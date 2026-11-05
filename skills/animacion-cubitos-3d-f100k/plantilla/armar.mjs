#!/usr/bin/env node
// Arma index.html y tiempos.js a partir de config.js y de la voz.
//   node armar.mjs             usa assets/voz.(wav|mp3|m4a) si existe; si no, calcula los tiempos sin voz
//   node armar.mjs --voz-ia    genera una voz de IA provisional (Kokoro, local) y la usa
// Corre igual en Mac y en Windows: lo que cambia entre los dos pasa por sistema.mjs.
//   node armar.mjs --sin-voz   ignora cualquier audio y calcula los tiempos por largo de palabra (config.ritmo lo acelera o lo frena)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { npx, pythonConPaquetes, transcribir } from "./sistema.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const A = (f) => path.join(DIR, f);
const args = process.argv.slice(2);
const aviso = (m) => console.log("  ⚠ " + m);

/* ── config ── */
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(A("config.js"), "utf8"), sandbox);
const C = sandbox.window.CONFIG;
if (!C || !Array.isArray(C.escenas) || !C.escenas.length) { console.error("config.js no define window.CONFIG.escenas"); process.exit(1); }
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

/* ── guion → palabras ── */
const G = []; // {txt, n, esc, clave}
C.escenas.forEach((E, i) => {
  if (!E.frase) { console.error(`La escena ${i + 1} no tiene frase`); process.exit(1); }
  let dentro = false;
  E.frase.trim().split(/\s+/).forEach((tok) => {
    const abre = tok.startsWith("*"), cierra = /\*[^\w]*$/.test(tok) && tok.replace(/^\*/, "").includes("*");
    const clave = dentro || abre;
    if (abre) dentro = true;
    if (cierra) dentro = false;
    const txt = tok.replace(/[*_]/g, "");
    if (norm(txt)) G.push({ txt, n: norm(txt), esc: i, clave });
    else if (G.length) G[G.length - 1].txt += " " + txt;
  });
});
const guion = C.escenas.map((E) => E.frase.replace(/[*_]/g, "").trim()).join("\n");
fs.mkdirSync(A("assets"), { recursive: true });
fs.writeFileSync(A("guion.txt"), guion + "\n");

/* ── voz ── */
const hf = (a, opt = {}) => npx(["hyperframes", ...a], { cwd: DIR, ...opt });
let voz = null;
if (!args.includes("--sin-voz")) {
  if (args.includes("--voz-ia")) {
    const env = { ...process.env };
    if (!env.HYPERFRAMES_PYTHON) {
      console.log("  Preparando la voz local (la primera vez tarda ~1 min)…");
      try { env.HYPERFRAMES_PYTHON = pythonConPaquetes(path.join(os.homedir(), ".cache", "f100k-voz"), ["kokoro-onnx", "soundfile"]); }
      catch (e) { console.error(e.message + "\nAlternativa: graba la voz o usa --sin-voz."); process.exit(1); }
    }
    const v = C.voz || {};
    const r = hf(["tts", "guion.txt", "-v", v.id || "ef_dora", "-l", v.idioma || "es", "-s", String(v.velocidad || 1), "-o", "assets/voz.wav", "--json"], { env });
    if (r.status !== 0 || !fs.existsSync(A("assets/voz.wav"))) { console.error("No se pudo generar la voz:\n" + (r.stdout || "") + (r.stderr || "")); process.exit(1); }
  }
  for (const ext of ["wav", "mp3", "m4a", "aac"]) if (!voz && fs.existsSync(A("assets/voz." + ext))) voz = "assets/voz." + ext;
  if (voz && !voz.endsWith(".wav")) { // el render usa wav
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", A(voz), "-ar", "44100", "-ac", "1", A("assets/voz.wav")]);
    voz = "assets/voz.wav";
  }
  if (!voz) aviso("No hay assets/voz.wav: armo los tiempos SIN voz. Graba la voz o usa --voz-ia.");
}

/* ── tiempos por palabra ── */
const r2 = (x) => Math.round(x * 100) / 100;
let durVoz = 0;
if (voz) {
  durVoz = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", A(voz)], { encoding: "utf8" }));
  const tj = A("assets/transcript.json");
  if (!fs.existsSync(tj) || fs.statSync(tj).mtimeMs < fs.statSync(A(voz)).mtimeMs) {
    console.log("  Transcribiendo la voz para sacar los tiempos…");
    const idioma = (C.voz && C.voz.idioma) || "es";
    fs.rmSync(tj, { force: true });
    const r = hf(["transcribe", voz, "-l", idioma, "-m", "large-v3", "--json"]);
    if (r.status !== 0 || !fs.existsSync(tj)) {
      // plan B: el Whisper de sistema.mjs (el mismo de las otras skills), pasado al formato de transcript.json
      const t = transcribir(A(voz), { dir: A("assets/.transcripcion"), idioma });
      if (!t.ok) { console.error("No se pudo transcribir:\n" + (r.stdout || "") + (r.stderr || "") + "\n" + t.error); process.exit(1); }
      const palabras = JSON.parse(fs.readFileSync(t.archivo, "utf8")).segments.flatMap((s) => s.words || []).map((w) => ({ text: w.word.trim(), start: w.start, end: w.end }));
      fs.writeFileSync(tj, JSON.stringify(palabras));
      fs.rmSync(A("assets/.transcripcion"), { recursive: true, force: true });
    }
  }
  const raw = JSON.parse(fs.readFileSync(tj, "utf8"));
  const W = (Array.isArray(raw) ? raw : raw.words || []).map((w) => {
    let i = w.start, f = w.end; const n = norm(w.text);
    if (f - i > 0.09 * n.length + 0.15) i = f - (0.06 * n.length + 0.06); // la palabra se tragó un silencio
    return { n, i, f };
  }).filter((w) => w.n);
  // alineación guion ↔ transcripción (subsecuencia común más larga)
  const eq = (a, b) => a === b || (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a)));
  const n = G.length, m = W.length, L = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
  for (let a = n - 1; a >= 0; a--) for (let b = m - 1; b >= 0; b--) L[a][b] = eq(G[a].n, W[b].n) ? L[a + 1][b + 1] + 1 : Math.max(L[a + 1][b], L[a][b + 1]);
  let a = 0, b = 0, ok = 0;
  while (a < n && b < m) {
    if (eq(G[a].n, W[b].n) && L[a][b] === L[a + 1][b + 1] + 1) { G[a].i = W[b].i; G[a].f = W[b].f; ok++; a++; b++; }
    else if (L[a + 1][b] >= L[a][b + 1]) a++; else b++;
  }
  if (ok / n < 0.7) aviso(`Solo ${ok} de ${n} palabras del guion coinciden con la voz. ¿La voz dice OTRO texto? Revisa config.js o vuelve a grabar.`);
  // huecos: se reparten entre las vecinas que sí coincidieron
  for (let k = 0; k < n; k++) if (G[k].i == null) {
    let j = k; while (j < n && G[j].i == null) j++;
    const ini = k ? G[k - 1].f : 0, fin = j < n ? G[j].i : durVoz, paso = Math.max(0.01, (fin - ini) / (j - k));
    for (let q = k; q < j; q++) { G[q].i = ini + (q - k) * paso; G[q].f = G[q].i + paso; }
    k = j - 1;
  }
} else {
  let t = 0.1; const R = C.ritmo || 1; // ritmo < 1 = habla más rápido (solo sin voz)
  G.forEach((g) => { g.i = t; g.f = t + (0.1 + 0.045 * g.n.length) * R; t = g.f + (/[.!?…]$/.test(g.txt) ? 0.32 : /[,;:]$/.test(g.txt) ? 0.12 : 0.02) * R; });
}
for (let k = 1; k < G.length; k++) if (G[k].i <= G[k - 1].i) G[k].i = G[k - 1].i + 0.02;

const cortes = C.escenas.map((E, i) => { const p = G.find((g) => g.esc === i); return i ? r2(Math.max(0.3, p.i - 0.08)) : 0; });
const DUR = r2(Math.max(durVoz, G[G.length - 1].f) + (C.cola != null ? C.cola : 1.6));
cortes.push(DUR);
for (let i = 1; i < cortes.length; i++) if (cortes[i] - cortes[i - 1] < 0.8) aviso(`La escena ${i} dura menos de 0,8 s: su frase es muy corta para lo que pasa en pantalla.`);

/* ── revisa planos y palabras de «en» ── */
const PLANOS = ["tribuna", "duelo", "alegato", "votacion", "apagon", "papeles", "jefe", "sello", "marcador", "edificio", "comentario", "ventana"];
const CLAVES = ["en", "giroEn", "abreEn", "mazoEn", "selloEn", "cortaEn", "entraEn", "escribeEn"];
C.escenas.forEach((E, i) => {
  if (!PLANOS.includes(E.plano)) { console.error(`Escena ${i + 1}: el plano «${E.plano}» no existe. Planos: ${PLANOS.join(", ")}`); process.exit(1); }
  const pal = G.filter((g) => g.esc === i).map((g) => g.n);
  const mira = (o, donde) => CLAVES.forEach((k) => {
    if (typeof o[k] === "string" && o[k] && !pal.some((p) => p.startsWith(norm(o[k])))) aviso(`Escena ${i + 1} (${donde}): «${k}: "${o[k]}"» no está en la frase; se usará el tiempo por defecto.`);
  });
  mira(E, E.plano);
  (E.quienes || []).forEach((q) => mira(q, "quienes"));
  (E.items || []).forEach((it) => typeof it === "object" && mira(it, "items"));
  if (String(E.encabezado || "").replace(/\*/g, "").length > 30) aviso(`Escena ${i + 1}: el encabezado pasa de 30 letras y se puede salir del cuadro.`);
  if (E.plano === "comentario" && E.palabra && !pal.includes(norm(E.palabra))) aviso(`Escena ${i + 1}: la palabra «${E.palabra}» del comentario no está en la frase.`);
});
if ((C.elenco || []).length !== 12) aviso(`El elenco tiene ${(C.elenco || []).length} butacas; la gradería es de 12 (las que falten salen como bichitos sin gorro).`);

fs.writeFileSync(A("tiempos.js"),
  "// Lo escribe armar.mjs. No lo edites a mano: vuelve a correr armar.mjs.\n" +
  "window.TIEMPOS = " + JSON.stringify({ dur: DUR, cortes, voz: !!voz, palabras: G.map((g) => [g.txt, r2(g.i), g.esc, g.clave ? 1 : 0]) }) + ";\n");

/* ── index.html ── */
const id = (C.id || "cubitos").replace(/[^a-z0-9-]/gi, "");
const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>${String(C.titulo || "Corto de cubitos 3D").replace(/</g, "&lt;")}</title>
<link rel="stylesheet" href="motor.css" />
</head>
<body>
<!-- Archivo GENERADO por armar.mjs. Los cambios van en config.js. -->
<div id="root" data-composition-id="${id}" data-start="0" data-width="1080" data-height="1920" data-duration="${DUR}">
${voz ? `  <audio id="voz" src="assets/voz.wav" data-start="0" data-duration="${r2(Math.min(durVoz, DUR))}" data-track-index="6" data-volume="1"></audio>\n` : ""}</div>
<script src="vendor/gsap.min.js"></script>
<script src="config.js"></script>
<script src="tiempos.js"></script>
<script>
  // Reloj del video: HyperFrames mueve esta línea de tiempo y motor.js pinta el cuadro en cada cambio.
  window.__paint = function () {};
  window.__clock = { _t: 0, get t() { return this._t; }, set t(v) { this._t = v; window.__paint(v); } };
  window.__timelines = window.__timelines || {};
  window.__timelines["${id}"] = gsap.timeline({ paused: true }).to(window.__clock, { t: ${DUR}, duration: ${DUR}, ease: "none" }, 0);
</script>
<script type="module" src="motor.js"></script>
</body>
</html>
`;
fs.writeFileSync(A("index.html"), html);

const mid = cortes.slice(0, -1).map((c, i) => r2(c + (cortes[i + 1] - c) * 0.8));
console.log(`\n  Listo: ${C.escenas.length} escenas · ${DUR} s · ${voz ? "con voz" : "SIN voz"}`);
console.log("  Cortes: " + cortes.join(" · "));
console.log("\n  Siguiente:\n    npx hyperframes lint\n    npx hyperframes snapshot --at " + mid.join(",") + " --no-end --describe false\n    npx hyperframes render --output <nombre>.mp4 --fps 30\n");
