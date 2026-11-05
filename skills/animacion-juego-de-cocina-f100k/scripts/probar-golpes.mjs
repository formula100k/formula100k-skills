#!/usr/bin/env node
// probar-golpes.mjs — prueba golpes.mjs con pistas sintéticas de tempo conocido y revisa que las copias
// repartidas en las skills hermanas sigan siendo idénticas.
//   node probar-golpes.mjs            corre todo
//   node probar-golpes.mjs --rapido   solo la comparación de copias y las funciones de ajuste
// Necesita ffmpeg. No deja nada: trabaja en una carpeta temporal y la borra.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MOTOR = [path.join(AQUI, "golpes.mjs"), path.join(AQUI, "..", "plantilla", "golpes.mjs")].find((f) => fs.existsSync(f));
if (!MOTOR) { console.error("No encuentro golpes.mjs junto a este archivo ni en ../plantilla/"); process.exit(1); }
const { analizar, rejilla, ajustarTiempos, alinear, desplazar, mezclar } = await import(pathToFileURL(MOTOR).href);

let fallas = 0;
const ok = (cond, texto) => { console.log((cond ? "  ok   " : "  FALLA ") + texto); if (!cond) fallas++; };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "golpes-"));

/* ── pista sintética: bombo en cada golpe, más grave y fuerte en el primero del compás, platillo a contratiempo ── */
function pista(archivo, { bpm, dur, silencio = 0, ruido = 0, entrada = 0 }) {
  const sr = 44100, n = Math.round(sr * dur), x = new Float32Array(n), per = 60 / bpm, reales = [];
  let semilla = 12345; const azar = () => ((semilla = (semilla * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  let i = 0;
  for (let t = silencio; t < dur - 0.3; t += per, i++) {
    const fuerte = i % 4 === 0, suave = t - silencio < entrada; // «entrada» = compases iniciales a bajo volumen
    reales.push(t);
    const s0 = Math.round(t * sr), amp = (fuerte ? 0.9 : 0.5) * (suave ? 0.12 : 1);
    for (let k = 0; k < sr * 0.18 && s0 + k < n; k++) {
      const tt = k / sr, f = (fuerte ? 55 : 95) + (fuerte ? 90 : 60) * Math.exp(-tt * 40);
      x[s0 + k] += amp * Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt * (fuerte ? 18 : 28)) + (k < 120 ? amp * 0.28 * azar() : 0);
    }
    const h0 = Math.round((t + per / 2) * sr);
    for (let k = 0; k < sr * 0.03 && h0 + k < n; k++) x[h0 + k] += 0.08 * (suave ? 0.3 : 1) * azar() * Math.exp(-k / sr * 150);
  }
  if (ruido) { // colchón: acorde sostenido + ruido de fondo
    for (let k = Math.round(silencio * sr); k < n; k++) { const tt = k / sr; x[k] += ruido * (0.5 * Math.sin(2 * Math.PI * 220 * tt) + 0.4 * Math.sin(2 * Math.PI * 277.2 * tt) + 0.4 * Math.sin(2 * Math.PI * 329.6 * tt) + 0.6 * azar()); }
  }
  const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let k = 0; k < n; k++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(x[k] * 26000))), 44 + k * 2);
  fs.writeFileSync(archivo, b);
  return reales;
}
function mide(G, reales) {
  let max = 0, suma = 0;
  for (const g of G.golpes) { let d = 1e9; for (const r of reales) if (Math.abs(g - r) < Math.abs(d)) d = g - r; max = Math.max(max, Math.abs(d)); suma += d; }
  const fr = reales.filter((_, i) => i % 4 === 0);
  const fuertesOk = G.fuertes.filter((g) => fr.some((r) => Math.abs(r - g) < 0.03)).length;
  return { medio: suma / G.golpes.length * 1000, max: max * 1000, fuertesOk, fuertesReales: fr.length };
}
const ff = (args) => spawnSync("ffmpeg", ["-y", "-v", "error", ...args], { encoding: "utf8" });

try {
  /* ── 1. copias idénticas ── */
  console.log("\n1 · Copias de golpes.mjs y de los documentos compartidos en las skills hermanas");
  const huella = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 12);
  const mia = huella(MOTOR);
  let raiz = AQUI; // sube hasta la carpeta que contiene las skills (la que tiene a esta skill adentro)
  for (let k = 0; k < 3; k++) { if (fs.existsSync(path.join(raiz, "SKILL.md"))) { raiz = path.dirname(raiz); break; } raiz = path.dirname(raiz); }
  const copias = [];
  if (fs.existsSync(raiz)) for (const d of fs.readdirSync(raiz)) for (const sub of ["plantilla", "scripts"]) {
    const f = path.join(raiz, d, sub, "golpes.mjs");
    if (fs.existsSync(f) && fs.existsSync(path.join(raiz, d, "SKILL.md"))) copias.push(f);
  }
  console.log(`  esta copia: ${mia} · copias encontradas: ${copias.length}`);
  for (const f of copias) ok(huella(f) === mia, path.relative(raiz, f) + " " + huella(f));
  // los tres documentos compartidos también viajan copiados: deben coincidir entre sí
  for (const doc of ["marca.md", "ritmo-y-serie.md", "efectos-open-source.md"]) {
    const fs2 = fs.existsSync(raiz) ? fs.readdirSync(raiz).map((d) => path.join(raiz, d, "references", doc)).filter((f) => fs.existsSync(f)) : [];
    const hs = new Set(fs2.map(huella));
    if (fs2.length) ok(hs.size === 1, `references/${doc}: ${fs2.length} copias, ${hs.size === 1 ? "todas iguales" : "HAY " + hs.size + " VERSIONES DISTINTAS"}`);
  }

  /* ── 2. funciones de ajuste (sin audio) ── */
  console.log("\n2 · Rejilla, ajuste y alineación");
  const R = rejilla({ bpm: 120, duracion: 20 });
  ok(R.golpes.length === 41 && R.fuertes[1] === 2, "rejilla de 120 BPM: 41 golpes en 20 s, fuertes cada 2 s");
  const a1 = ajustarTiempos([2.8, 5.4, 9.0], R, { tolerancia: 0.35 });
  ok(a1.map((r) => r.ajustado).join() === "3,5.5,9", "al golpe más cercano: 2.8→3 · 5.4→5.5 · 9→9  (" + a1.map((r) => r.movido).join(", ") + ")");
  const a2 = ajustarTiempos([2.8, 5.4, 9.0], R, { tolerancia: 1.01, fuertes: true });
  ok(a2.map((r) => r.ajustado).join() === "2,6,8" || a2.map((r) => r.ajustado).join() === "2,6,10", "solo fuertes con tolerancia amplia: " + a2.map((r) => r.ajustado).join(", "));
  const a3 = ajustarTiempos([2.8], R, { tolerancia: 0.1 });
  ok(a3[0].tipo === "sin cambio" && a3[0].ajustado === 2.8, "fuera de tolerancia no se mueve");
  const a4 = ajustarTiempos([1.0, 1.1], R, { tolerancia: 0.5, minimo: 0.4 });
  ok(a4[0].ajustado === 1 && a4[1].ajustado === 1.5, "dos tiempos nunca caen en el mismo golpe ni a menos del mínimo: " + a4.map((r) => r.ajustado).join(", "));
  const D = desplazar(R, 1.25);
  ok(D.golpes[0] === 0.25 && D.fuertes[0] === 0.75, "desplazar: la pista arranca en 1,25 s → primer golpe del video en 0,25 y primer fuerte en 0,75");
  const al = alinear(R, 3.4);
  ok(al.inicio === 0.6 && al.golpeFuerte === 4, "alinear: para que un fuerte caiga en 3,4 s del video, la pista arranca en 0,6 s");

  if (!process.argv.includes("--rapido")) {
    /* ── 3. detector con tempo conocido ── */
    console.log("\n3 · Detector con pistas sintéticas");
    const casos = [
      { n: "90 BPM", bpm: 90, dur: 24 }, { n: "120 BPM", bpm: 120, dur: 24 }, { n: "128 BPM", bpm: 128, dur: 24 },
      { n: "120 BPM con 1,37 s de silencio al inicio", bpm: 120, dur: 24, silencio: 1.37 },
      { n: "100 BPM con acorde y ruido de fondo", bpm: 100, dur: 30, ruido: 0.12 },
      { n: "110 BPM con 4 compases de entrada suave", bpm: 110, dur: 30, entrada: 4 * 4 * 60 / 110, seccion: 4 * 4 * 60 / 110 },
    ];
    for (const c of casos) {
      const wav = path.join(TMP, "p.wav"), reales = pista(wav, c), G = analizar(wav), m = mide(G, reales);
      console.log(`  ${c.n}: detectado ${G.bpm} BPM · ${G.golpes.length}/${reales.length} golpes · error medio ${m.medio.toFixed(1)} ms · máximo ${m.max.toFixed(1)} ms · fuertes ${m.fuertesOk}/${G.fuertes.length}`);
      ok(Math.abs(G.bpm - c.bpm) < 0.3, "tempo dentro de ±0,3 BPM");
      ok(m.max < 20, "todos los golpes a menos de 20 ms del real");
      ok(Math.abs(G.golpes[0] - reales[0]) < 0.02, `primer golpe en ${G.golpes[0]} s (real ${reales[0]})`);
      ok(m.fuertesOk === G.fuertes.length && G.fuertes.length >= m.fuertesReales - 1, "los fuertes caen en el primer tiempo del compás");
      if (c.seccion) ok(G.secciones.length === 2 && Math.abs(G.secciones[1].inicio - c.seccion) < 0.05, `cambio de sección detectado en ${G.secciones[1] ? G.secciones[1].inicio : "—"} s (real ${c.seccion.toFixed(3)})`);
    }
    // formatos comprimidos y pista hecha solo con ffmpeg (clics de 1 kHz a 120 BPM)
    const wav = path.join(TMP, "f.wav"), reales = pista(wav, { bpm: 128, dur: 20 });
    for (const [ext, extra] of [["mp3", ["-b:a", "128k"]], ["m4a", ["-c:a", "aac"]], ["mp4", ["-f", "lavfi", "-i", "color=c=black:s=64x64:d=20", "-c:a", "aac", "-shortest"]]]) {
      const f = path.join(TMP, "f." + ext), r = ff(["-i", wav, ...extra, f]);
      if (r.status !== 0) { ok(false, ext + ": ffmpeg no pudo crear la pista de prueba"); continue; }
      const G = analizar(f), m = mide(G, reales);
      ok(Math.abs(G.bpm - 128) < 0.3 && m.max < 20, `${ext}: ${G.bpm} BPM, error máximo ${m.max.toFixed(1)} ms`);
    }
    const clics = path.join(TMP, "clics.wav");
    ff(["-f", "lavfi", "-i", "sine=f=1000:d=16:r=44100", "-af", "asetnsamples=n=32,volume='lt(mod(t,0.5),0.02)':eval=frame", clics]);
    if (fs.existsSync(clics)) { const G = analizar(clics); let max = 0; G.golpes.forEach((g) => { const d = Math.abs(g - Math.round(g / 0.5) * 0.5); if (d > max) max = d; }); ok(Math.abs(G.bpm - 120) < 0.3 && max < 0.02, `clics hechos con ffmpeg: ${G.bpm} BPM, error máximo ${(max * 1000).toFixed(1)} ms`); }

    /* ── 4. mezcla ── */
    console.log("\n4 · Mezclar la pista en un MP4");
    const mudo = path.join(TMP, "mudo.mp4"), con = path.join(TMP, "con.mp4");
    ff(["-f", "lavfi", "-i", "color=c=gray:s=108x192:r=30:d=4", "-pix_fmt", "yuv420p", mudo]);
    mezclar(mudo, wav, con, { inicio: 1, volumen: 0.7 });
    const pr = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name:format=duration", "-of", "csv=p=0", con], { encoding: "utf8" }).stdout;
    ok(/audio/.test(pr) && /video/.test(pr), "el MP4 mezclado lleva video y audio: " + pr.trim().replace(/\n/g, " | "));
  }
} finally { fs.rmSync(TMP, { recursive: true, force: true }); }

console.log(fallas ? `\n${fallas} prueba(s) fallaron.` : "\nTodo en orden.");
process.exit(fallas ? 1 : 0);
