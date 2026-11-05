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
