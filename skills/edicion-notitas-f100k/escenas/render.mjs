// Renderiza las escenas scrapbook cuadro a cuadro (Chrome sin ventana + ffmpeg). Igual en Mac y en Windows.
// uso: node render.mjs <carpeta-escenas> <audio-o-video-del-corte> <salida.mp4> [--cuadro N salida.png ...]
// La página sale de PAGINA=<archivo.html> (por defecto escenas.html, junto a este script).
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {chrome} from './chrome.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
// puppeteer-core viene con el motor de render de esta skill (render/node_modules).
const require = createRequire(path.join(aqui, '..', 'render', 'package.json'));
let puppeteer;
try { puppeteer = require('puppeteer-core'); }
catch { console.error('Falta el motor de render. Corre: node "' + path.join(aqui, '..', 'scripts', 'preparar.mjs') + '"'); process.exit(1); }

const [ep, corte, salida, ...resto] = process.argv.slice(2);
if (!ep || !corte || !salida) { console.error('uso: node render.mjs <carpeta-escenas> <video-del-corte> <salida.mp4>'); process.exit(1); }
// La carpeta va como dirección file:// (en Windows una ruta C:\… no sirve dentro de la página).
const epUrl = pathToFileURL(path.resolve(ep)).href;
const pagina = pathToFileURL(path.join(aqui, process.env.PAGINA || 'escenas.html')).href;
const url = `${pagina}?ep=${encodeURIComponent(epUrl)}`;

const nav = await puppeteer.launch({
  executablePath: chrome(),
  headless: true, args: ['--allow-file-access-from-files', '--hide-scrollbars', '--force-color-profile=srgb'],
});
const pag = await nav.newPage();
pag.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('[página]', m.text()); });
await pag.setViewport({width: 1080, height: 1920, deviceScaleFactor: 1});
await pag.goto(url);
const total = await pag.evaluate(() => window.listo);

// ── 🔴 Cartón quieto = video muerto ──────────────────────────────────────
// Cada escena dura de 2 a 6 s y entra algo nuevo (foto, etiqueta, sello…) cada 3 s como mucho.
// Una frase de `cuando` que no se encuentra deja la pieza fuera y el cartón vacío: también bloquea.
const tiempos = await pag.evaluate(() => window.TIEMPOS || null);
const sinResolver = await pag.evaluate(() => window.SIN_RESOLVER || []);
if (tiempos && resto[0] !== '--cuadro') {
  const fallas = sinResolver.map((x) => `no encontré la frase de ${x} en PALABRAS: esa pieza no aparece`);
  for (const e of tiempos.filter((t) => t.tipo === 'escena')) {
    const largo = e.hasta - e.desde;
    if (largo > 6.5) fallas.push(`escena «${e.cuando}» dura ${largo.toFixed(1)} s (máximo 6): pártela en dos o córtala antes`);
    const entradas = tiempos.filter((t) => t.tipo !== 'escena' && t.desde >= e.desde - 0.05 && t.desde < e.hasta).map((t) => t.desde).sort((a, b) => a - b);
    let antes = e.desde;
    for (const d of [...entradas, e.hasta]) {
      if (d - antes > 3.5) fallas.push(`escena «${e.cuando}»: ${(d - antes).toFixed(1)} s de cartón quieto entre ${antes.toFixed(1)} y ${d.toFixed(1)} s (suma una foto, etiqueta o sello anclado a lo que se dice)`);
      antes = Math.max(antes, d);
    }
  }
  const lado = salida.replace(/\.[^.\/\\]+$/, '') + '.escenas.json';
  (await import('node:fs')).writeFileSync(lado, JSON.stringify(tiempos, null, 1));
  for (const f of fallas) console.log('[bloqueo] ' + f);
  if (fallas.length && process.env.ESCENAS_FORZAR !== '1') {
    console.error(`\n${fallas.length} bloqueo(s) en las escenas: no horneo un cartón vacío o quieto. Arregla config.js y vuelve a correr.`);
    await nav.close();
    process.exit(1);
  }
}

if (resto[0] === '--cuadro') {
  for (let i = 1; i < resto.length; i += 2) {
    await pag.evaluate(f => window.draw(f), Number(resto[i]));
    await pag.screenshot({path: resto[i + 1]});
  }
  await nav.close();
  process.exit(0);
}

const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-i', corte,
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', salida], {stdio: ['pipe', 'inherit', 'inherit']});
// Con -shortest ffmpeg puede cerrar antes del último cuadro (el audio es un poco más corto): no es un error.
let cerrado = false;
const fin = new Promise(r => ff.on('close', () => { cerrado = true; r(); }));
ff.stdin.on('error', () => { cerrado = true; });
for (let f = 0; f < total && !cerrado; f++) {
  await pag.evaluate(c => window.draw(c), f);
  const img = await pag.screenshot({type: 'jpeg', quality: 93});
  if (cerrado) break;
  if (!ff.stdin.write(img)) await Promise.race([new Promise(r => ff.stdin.once('drain', r)), fin]);
  if (f % 150 === 0) console.log(`${f}/${total}`);
}
ff.stdin.end();
await fin;
await nav.close();
console.log('listo →', salida);
