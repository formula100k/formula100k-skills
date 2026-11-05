// ajustar.mjs — lee config.js y deja index.html listo para renderizar:
//  · escribe la duración total (HyperFrames la lee del HTML, no del JavaScript)
//  · monta el <video> de la captura si `captura.src` es un video
//  · avisa si falta algún archivo de assets
//  · si config.js trae `musica`, corre los cambios de parte (titular → carpeta → collage → monitor → captura) al golpe
//    fuerte más cercano y lo guarda en ritmo.js (sin música, ritmo.js queda en null y nada cambia)
// Uso (dentro de la carpeta de la pieza):
//   node ajustar.mjs                        después de cambiar tiempos, captura o musica
//   node ajustar.mjs --mezclar video.mp4    pega la pista al MP4 ya renderizado → video-con-musica.mp4
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { leerMusica, ajustarTiempos, alCuadro, mezclarPieza } from "./golpes.mjs";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const caja = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(aqui, "config.js"), "utf8"), caja);
const C = caja.window.CONFIG;
if (!C) { console.error("config.js no define window.CONFIG"); process.exit(1); }

if (process.argv[2] === "--mezclar") {
  try {
    if (!process.argv[3]) throw new Error("Uso: node ajustar.mjs --mezclar video.mp4 [salida.mp4]");
    console.log("Listo, con música: " + mezclarPieza(aqui, C.musica, process.argv[3], process.argv[4]).salida);
    process.exit(0);
  } catch (e) { console.error("Error: " + e.message); process.exit(1); }
}

const T = Object.assign({ titular: 5, carpeta: 1.8, collage: 3.6, monitor: 3.6, captura: 3.8 }, C.tiempos || {});
const cap = C.captura && C.captura.src ? C.captura : null;

// música: cada cambio de parte se corre al golpe fuerte más cercano (o a un golpe, si no hay fuerte dentro de la tolerancia)
let M = null, ritmo = null;
try { M = leerMusica(aqui, C.musica, T.titular + T.carpeta + T.collage + T.monitor + T.captura + 4); }
catch (e) { console.error("Error: " + e.message); process.exit(1); }
if (M) {
  const b0 = [T.titular, T.titular + T.carpeta, T.titular + T.carpeta + T.collage, T.titular + T.carpeta + T.collage + T.monitor];
  const abajo = (x) => Math.floor(x * 1e4 + 1e-6) / 1e4; // hacia abajo: el cambio ya ocurrió cuando se captura su cuadro
  const aj = ajustarTiempos([{ t: b0[0], minimo: 2.5 }, { t: b0[1], minimo: 1.4 }, { t: b0[2], minimo: 2.6 }, { t: b0[3], minimo: 2.4 }].map((o) => ({ ...o, fuerte: true })),
    M.golpes, { tolerancia: M.tolerancia != null ? M.tolerancia : 0.6, arrastre: true });
  const b = aj.map((a) => abajo(alCuadro(a.ajustado)));
  const r4 = (x) => Math.round(x * 1e4) / 1e4;
  Object.assign(T, { titular: b[0], carpeta: r4(b[1] - b[0]), collage: r4(b[2] - b[1]), monitor: r4(b[3] - b[2]) });
  ritmo = { bpm: M.bpm, musica: M.archivo, inicio: M.inicio, tiempos: { titular: T.titular, carpeta: T.carpeta, collage: T.collage, monitor: T.monitor } };
  console.log(`Música: ${M.archivo || "solo tempo"} · ${M.bpm} BPM · la pieza arranca en el segundo ${M.inicio} de la pista`);
  ["titular → carpeta", "carpeta → collage", "collage → monitor", "monitor → captura"].forEach((n, i) =>
    console.log(`  ${n}: ${b0[i].toFixed(2)} → ${b[i].toFixed(3)} s (${b[i] - b0[i] >= 0 ? "+" : ""}${Math.round((b[i] - b0[i]) * 1000)} ms, ${aj[i].tipo === "fuerte" ? "golpe fuerte" : aj[i].tipo === "golpe" ? "golpe" : "sin golpe cerca: no se movió"})`));
  M.notas.forEach((n) => console.log("  OJO: " + n));
}
fs.writeFileSync(path.join(aqui, "ritmo.js"),
  "// Lo escribe `node ajustar.mjs`. Sin música queda en null y la plantilla usa los `tiempos` de config.js.\n" +
  "window.RITMO = " + (ritmo ? JSON.stringify(ritmo) : "null") + ";\n");
const tA = T.titular, tB = tA + T.carpeta, tM = tB + T.collage, tK = tM + T.monitor;
const total = +(tK + (cap ? T.captura : 0)).toFixed(2);

let html = fs.readFileSync(path.join(aqui, "index.html"), "utf8");
html = html.replace(/(<div id="root"[^>]*data-duration=")[^"]*"/, `$1${total}"`);
html = html.replace(/(<div id="escena"[^>]*data-duration=")[^"]*"/, `$1${total}"`);
const esVideo = cap && /\.(mp4|mov|webm|m4v)$/i.test(cap.src);
const video = esVideo
  ? `<video id="captura-video" class="clip" data-start="${+tK.toFixed(4)}" data-duration="${T.captura}" data-track-index="2" src="${cap.src}" muted playsinline></video>`
  : "";
html = html.replace(/<!--VIDEO:INI-->[\s\S]*?<!--VIDEO:FIN-->/, `<!--VIDEO:INI-->${video}<!--VIDEO:FIN-->`);
fs.writeFileSync(path.join(aqui, "index.html"), html);

const rutas = [...(C.objetos || []), ...(C.recortes || []), C.persona || {}].map(o => o.img).filter(Boolean);
if (cap) rutas.push(cap.src);
const faltan = rutas.filter(r => !fs.existsSync(path.join(aqui, r)));
if (faltan.length) console.log("OJO, no encuentro estos archivos:\n  " + faltan.join("\n  "));
if ((C.recortes || []).length < 6) console.log("OJO: con menos de 6 recortes el collage no llena el cuadro (ideal: 8 a 10).");

const f = (n) => n.toFixed(1);
console.log(`Duración total: ${total} s${cap ? " (con captura)" : " (sin captura)"}`);
console.log("Cuadros para revisar:");
console.log(`  hyperframes snapshot --at ${[1, tA - 0.7, tA + 0.6, tA + 1.5, tB + T.collage * 0.4, tM - 0.7, tM + 1, tK - 0.6].concat(cap ? [tK + 1.2, total - 0.3] : []).map(f).join(",")} --describe false`);
if (M && M.mezclar) console.log("Después de renderizar, pega la pista:\n  node ajustar.mjs --mezclar <nombre>.mp4");
if (M && !M.mezclar) console.log("Esta pieza sale sin audio: los tiempos ya van al tempo; la música se pone al publicar.");
