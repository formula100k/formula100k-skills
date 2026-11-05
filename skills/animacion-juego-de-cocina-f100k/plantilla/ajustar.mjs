// ajustar.mjs — solo hace falta si config.js trae `musica` o `movimiento.sostieneFinal`.
//  · con música: pone los tres cambios de escena en golpes fuertes y la caída de cada ingrediente en un golpe,
//    lo guarda en ritmo.js y reescribe los tiempos de index.html (HyperFrames los lee del HTML, no del JavaScript)
//  · sin música: deja ritmo.js en null y la pieza vuelve a sus tiempos de siempre
// Uso, dentro de la carpeta de la pieza:
//   node ajustar.mjs                              después de cambiar `musica` o `movimiento.sostieneFinal`
//   node ajustar.mjs --mezclar video.mp4          pega la pista al MP4 ya renderizado → video-con-musica.mp4
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { leerConfig, leerMusica, ajustarTiempos, alCuadro, mezclarPieza } from "./golpes.mjs";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const r3 = (x) => Math.round(x * 1000) / 1000;
// los tiempos de ritmo.js se guardan redondeados HACIA ABAJO: así el cambio ya ocurrió cuando se captura su cuadro
const abajo = (x) => Math.floor(x * 1e4 + 1e-6) / 1e4;

try {
  const C = leerConfig(aqui);
  if (args[0] === "--mezclar") {
    if (!args[1]) throw new Error("Uso: node ajustar.mjs --mezclar video.mp4 [salida.mp4]");
    const m = mezclarPieza(aqui, C.musica, args[1], args[2]);
    console.log("Listo, con música: " + m.salida);
    process.exit(0);
  }

  const FPS = 30;
  const cierre = Math.max(0.8, (C.movimiento && C.movimiento.sostieneFinal) || 1.5);
  let cortes = [2.8, 5.4, 9], pasos = null, ritmo = null;
  const M = leerMusica(aqui, C.musica, 9 + cierre + 4);

  if (M) {
    const G = M.golpes, tol = M.tolerancia != null ? M.tolerancia : 0.6, per = 60 / M.bpm;
    // anclas: corte a «elige tu plato», corte a los pasos, caída de cada ingrediente, corte al plato servido.
    // `minimo` = lo que cada tramo necesita para que su animación alcance a terminar.
    const anclas = [
      { t: 2.8, fuerte: true, minimo: 2.3 },
      { t: 5.4, fuerte: true, minimo: 2.4 },
      { t: 6.5, minimo: 1.0, tolerancia: per },
      { t: 7.5, minimo: 0.8, tolerancia: per },
      { t: 8.5, minimo: 0.8, tolerancia: per },
      { t: 9.0, fuerte: true, minimo: 0.45 },
    ];
    const aj = ajustarTiempos(anclas, G, { tolerancia: tol, arrastre: true }).map((a) => ({ ...a, ajustado: alCuadro(a.ajustado, FPS) }));
    cortes = [aj[0].ajustado, aj[1].ajustado, aj[5].ajustado];
    pasos = [aj[2].ajustado, aj[3].ajustado, aj[4].ajustado];
    ritmo = { bpm: M.bpm, musica: M.archivo, inicio: M.inicio, cortes: cortes.map(abajo), pasos: pasos.map(abajo) };

    const nombres = ["corte a «elige tu plato»", "corte a los pasos", "paso 1 cae al bowl", "paso 2 cae al bowl", "paso 3 cae al bowl", "corte al plato servido"];
    console.log(`Música: ${M.archivo || "solo tempo"} · ${M.bpm} BPM · la pieza arranca en el segundo ${M.inicio} de la pista`);
    aj.forEach((a, i) => console.log(`  ${nombres[i]}: ${a.original.toFixed(2)} → ${a.ajustado.toFixed(3)} s (${a.ajustado - a.original >= 0 ? "+" : ""}${Math.round((a.ajustado - a.original) * 1000)} ms, ${a.tipo === "fuerte" ? "golpe fuerte" : a.tipo === "golpe" ? "golpe" : "sin golpe cerca: no cae en golpe"})`));
    M.notas.forEach((n) => console.log("  OJO: " + n));
  }
  const total = r3(alCuadro(cortes[2] + cierre, FPS));
  if (M && M.archivo && M.inicio + total > M.duracionPista + 0.05) console.log(`  OJO: la pista termina antes que el video (${M.duracionPista} s de pista, hacen falta ${r3(M.inicio + total)}).`);

  fs.writeFileSync(path.join(aqui, "ritmo.js"),
    "// Lo escribe `node ajustar.mjs`. Sin música queda en null y la plantilla usa sus tiempos de siempre.\n" +
    "window.RITMO = " + (ritmo ? JSON.stringify(ritmo) : "null") + ";\n");

  // tiempos estáticos de index.html
  const c = ritmo ? ritmo.cortes : cortes;
  const tramo = { s1: [0, c[0]], s2: [c[0], c[1]], s3: [c[1], c[2]], s4: [c[2], total], barridos: [0, total] };
  let html = fs.readFileSync(path.join(aqui, "index.html"), "utf8");
  html = html.replace(/(<div id="root"[^>]*data-duration=")[^"]*"/, `$1${total}"`);
  for (const [id, [ini, fin]] of Object.entries(tramo)) {
    const re = new RegExp(`(<(?:section|div) id="${id}"[^>]*data-start=")[^"]*("\\s+data-duration=")[^"]*"`);
    if (!re.test(html)) throw new Error("No encuentro la escena " + id + " en index.html: ¿alguien editó la plantilla?");
    html = html.replace(re, `$1${ini}$2${Math.round((fin - ini) * 1e4) / 1e4}"`);
  }
  fs.writeFileSync(path.join(aqui, "index.html"), html);

  const p = pasos || [6.5, 7.5, 8.5];
  const mira = [1.3, c[0] - 0.5, c[1] - 0.5, p[0] + 0.25, p[1] + 0.25, p[2] + 0.25, total - 0.2];
  console.log(`Duración total: ${total} s${ritmo ? " (tiempos sobre la música)" : " (sin música)"}`);
  console.log("Cuadros para revisar:\n  hyperframes snapshot --at " + mira.map((x) => x.toFixed(2)).join(",") + " --no-end --describe false");
  if (M && M.mezclar) console.log("Después de renderizar, pega la pista:\n  node ajustar.mjs --mezclar <nombre>.mp4");
  if (M && !M.mezclar) console.log("Esta pieza sale sin audio: los tiempos ya van al tempo; la música se pone al publicar.");
} catch (e) { console.error("Error: " + e.message); process.exit(1); }
