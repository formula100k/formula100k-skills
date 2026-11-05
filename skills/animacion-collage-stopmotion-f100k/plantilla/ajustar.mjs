// ajustar.mjs — lee config.js y deja la pieza lista para renderizar:
//  · escribe la duración total en index.html (HyperFrames la lee del HTML, no del JavaScript)
//  · si config.js trae `musica`, pone los cortes de escenario en golpes fuertes y los cambios de pose en golpes,
//    y lo guarda en ritmo.js (sin música, ritmo.js queda en null y todo sale como siempre)
// Uso, dentro de la carpeta de la pieza:
//   node ajustar.mjs                              después de cambiar `dur`, poses o `musica`
//   node ajustar.mjs --mezclar video.mp4          pega la pista al MP4 ya renderizado → video-con-musica.mp4
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { leerConfig, leerMusica, ajustarTiempos, golpeCercano, alCuadro, mezclarPieza } from "./golpes.mjs";

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

  const FPS = 30, SALTO = Math.max(1, Math.round(C.cuadrosPorSalto || 4)) / FPS;
  const cuant = (t) => Math.round(t / SALTO) * SALTO;
  const ESC = C.escenarios || [];
  if (!ESC.length) throw new Error("config.js no tiene escenarios.");

  let t = 0; const base = [0];
  ESC.forEach((E) => { t += E.dur || 3; base.push(cuant(t)); });
  let total = Math.round(t * 100) / 100;
  let ritmo = null;
  const M = leerMusica(aqui, C.musica, total);

  if (M) {
    const G = M.golpes, tol = M.tolerancia != null ? M.tolerancia : 0.6;
    // una pose se corre, como mucho, medio golpe (y nunca más de 0,6 de lo que dura): las poses muy cortas no se tocan
    const tolPose = C.musica && C.musica.toleranciaPoses != null ? C.musica.toleranciaPoses : 30 / M.bpm;
    // cortes de escenario → golpe fuerte (si no hay uno cerca, cualquier golpe); cada corte conserva lo que duraba su escenario
    const aj = ajustarTiempos(base.slice(1, -1).map((x) => ({ t: x, fuerte: true, minimo: 1.2 })), G, { tolerancia: tol, arrastre: true });
    const cortes = [0, ...aj.map((a) => alCuadro(a.ajustado, FPS))];
    total = alCuadro(cortes[cortes.length - 1] + (ESC[ESC.length - 1].dur || 3), FPS);
    cortes.push(total);
    // cambios de pose → golpe más cercano
    let movidas = 0, cuenta = 0;
    const poses = ESC.map((E, ei) => {
      const lista = [], ps = (C.persona && E.poses) || [];
      if (!ps.length) return lista;
      const pe = E.personaEntra || {}, ini = cortes[ei], fin = cortes[ei + 1];
      let tt = ini + cuant(pe.en == null ? 0.4 : pe.en), i = 0;
      while (tt < fin - 1e-6 && lista.length < 400) {
        const dur = Math.max(SALTO, cuant(ps[i % ps.length].dur || 0.5));
        let hasta = tt + dur;
        const g = golpeCercano(G, hasta, { tolerancia: Math.min(tolPose, dur * 0.6), desde: tt + SALTO });
        cuenta++; if (g != null) { hasta = alCuadro(g, FPS); movidas++; }
        hasta = Math.min(fin, hasta); lista.push(abajo(hasta)); tt = hasta; i++;
        if (i >= ps.length && E.repetir === false) break;
      }
      return lista;
    });
    ritmo = { bpm: M.bpm, musica: M.archivo, inicio: M.inicio, total: r3(total), cortes: cortes.map(abajo), poses };

    console.log(`Música: ${M.archivo || "solo tempo"} · ${M.bpm} BPM · la pieza arranca en el segundo ${M.inicio} de la pista`);
    aj.forEach((a, i) => console.log(`  corte ${i + 1}: ${a.original.toFixed(2)} → ${cortes[i + 1].toFixed(3)} s (${a.movido >= 0 ? "+" : ""}${Math.round((cortes[i + 1] - a.original) * 1000)} ms, ${a.tipo === "fuerte" ? "golpe fuerte" : a.tipo === "golpe" ? "golpe" : "sin golpe cerca: no se movió"})`));
    console.log(`  cambios de pose sobre un golpe: ${movidas} de ${cuenta}`);
    M.notas.forEach((n) => console.log("  OJO: " + n));
    if (M.archivo && M.inicio + total > M.duracionPista + 0.05) console.log(`  OJO: la pista termina antes que el video (${M.duracionPista} s de pista, hacen falta ${r3(M.inicio + total)}).`);
  }

  fs.writeFileSync(path.join(aqui, "ritmo.js"),
    "// Lo escribe `node ajustar.mjs`. Sin música queda en null y la plantilla usa los tiempos de config.js.\n" +
    "window.RITMO = " + (ritmo ? JSON.stringify(ritmo) : "null") + ";\n");
  let html = fs.readFileSync(path.join(aqui, "index.html"), "utf8");
  html = html.replace(/(<div id="root"[^>]*data-duration=")[^"]*"/, `$1${r3(total)}"`).replace(/(<div id="escena"[^>]*data-duration=")[^"]*"/, `$1${r3(total)}"`);
  fs.writeFileSync(path.join(aqui, "index.html"), html);

  const cortes = ritmo ? ritmo.cortes : base.slice(0, -1).concat(total);
  const mira = []; for (let i = 0; i + 1 < cortes.length; i++) mira.push(cortes[i] + 0.2, cortes[i] + (cortes[i + 1] - cortes[i]) * 0.5, cortes[i + 1] - 0.2);
  console.log(`Duración total: ${r3(total)} s${ritmo ? " (cortes sobre la música)" : " (sin música)"}`);
  console.log("Cuadros para revisar:\n  hyperframes snapshot --at " + mira.map((x) => x.toFixed(1)).join(",") + " --no-end --describe false");
  if (M && M.mezclar) console.log("Después de renderizar, pega la pista:\n  node ajustar.mjs --mezclar <nombre>.mp4");
  if (M && !M.mezclar) console.log("Esta pieza sale sin audio: los tiempos ya van al tempo; la música se pone al publicar.");
} catch (e) { console.error("Error: " + e.message); process.exit(1); }
