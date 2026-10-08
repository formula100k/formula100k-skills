#!/usr/bin/env node
// Renderiza la pieza: abre index.html en Chrome sin ventana, llama a draw(cuadro) y captura.
//
//   node render.mjs <carpeta> --cuadros 1,4.5,12     solo esos SEGUNDOS → <carpeta>/prueba/hoja.jpg (para mirar antes de renderizar)
//   node render.mjs <carpeta> --cuadros auto         un cuadro por momento clave (cada ítem sonando y cada pantalla de cierre)
//   node render.mjs <carpeta>                        todos los cuadros → <archivo>.mp4 con la voz + <archivo>-hoja.jpg
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { carpeta, leerConfig, leerTiempos, ff } from './comun.mjs';

const argv = process.argv.slice(2);
const dir = carpeta(argv);
const C = leerConfig(dir), T = leerTiempos(dir);

function cargarPuppeteer() {
  const bases = [process.env.PUPPETEER_DIR, path.join(dir, 'node_modules'),
    path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'carrusel-render-formula100k', 'node_modules'),   // la skill hermana, esté donde esté instalada
    path.join(os.homedir(), '.claude/skills/carrusel-render-formula100k/node_modules'),
    path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'node_modules')].filter(Boolean);
  for (const b of bases) for (const nombre of ['puppeteer-core', 'puppeteer']) {
    const p = path.join(b, nombre);
    if (fs.existsSync(p)) return createRequire(import.meta.url)(p);
  }
  console.error('No encuentro puppeteer-core. Instálalo una vez en la carpeta de la pieza:\n  cd "' + dir + '" && npm install puppeteer-core');
  process.exit(1);
}
function chrome() {
  const rutas = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].filter(Boolean);
  const r = rutas.find(p => fs.existsSync(p));
  if (!r) { console.error('No encuentro Chrome. Pon su ruta en la variable CHROME.'); process.exit(1); }
  return r;
}

const iC = argv.indexOf('--cuadros');
let solo = null;
if (iC >= 0) {
  const v = argv[iC + 1];
  if (!v || v === 'auto') {
    solo = [0.1];
    T.cats.forEach(c => c.tItems.forEach(t => solo.push(t + T.frag * 0.6)));
    T.cierre.pantallas.forEach(p => solo.push(p.tVoz + p.voz * 0.7));
  } else solo = v.split(',').map(Number).filter(x => !isNaN(x));
  solo = solo.map(s => Math.min(T.frames - 1, Math.max(0, Math.round(s * T.fps))));
}

const puppeteer = cargarPuppeteer();
const visor = await puppeteer.launch({ executablePath: chrome(), headless: 'new', args: ['--allow-file-access-from-files', ...(process.platform === 'linux' ? ['--no-sandbox', '--disable-dev-shm-usage'] : [])] });   // en un servidor Linux (root) Chrome necesita --no-sandbox
const pagina = await visor.newPage();
await pagina.setViewport({ width: 1080, height: 1920 });
const errores = []; pagina.on('pageerror', e => errores.push(String(e)));
await pagina.goto('file://' + path.join(dir, 'index.html'));
const sinCargar = await pagina.evaluate(() => window.listo);
if (errores.length) { console.error('Error en la página:\n' + errores.join('\n')); await visor.close(); process.exit(1); }
if (sinCargar.length) console.log(`⚠ ${sinCargar.length} carátula(s) no cargaron y salen con disco: ${sinCargar.join(', ')}`);
if (T.estimado && !solo) console.log('⚠ tiempos.js es ESTIMADO (sin voz). Sirve para probar, no para publicar.');

const salida = path.join(dir, solo ? 'prueba' : 'cuadros');
fs.rmSync(salida, { recursive: true, force: true }); fs.mkdirSync(salida, { recursive: true });
const lista = solo || Array.from({ length: T.frames }, (_, i) => i);
let n = 0;
for (const f of lista) {
  await pagina.evaluate(f => window.draw(f), f);
  const nombre = solo ? String(n).padStart(3, '0') + '.jpg' : String(f).padStart(5, '0') + '.jpg';
  await pagina.screenshot({ path: path.join(salida, nombre), type: 'jpeg', quality: 92 });
  if (!solo && ++n % 300 === 0) console.log(`  ${n}/${T.frames} cuadros`);
  if (solo) n++;
}
await visor.close();

if (solo) {
  const col = Math.min(6, lista.length), fil = Math.ceil(lista.length / col);
  ff(['-framerate', '1', '-i', path.join(salida, '%03d.jpg'), '-vf', `scale=360:-2,tile=${col}x${fil}:padding=6:color=white`, '-frames:v', '1', '-update', '1', path.join(salida, 'hoja.jpg')]);
  console.log(`Cuadros de prueba (segundos ${lista.map(f => (f / T.fps).toFixed(1)).join(', ')}):\n  ${path.join(salida, 'hoja.jpg')}\nMíralos antes de renderizar.`);
} else {
  const mp4 = path.join(dir, C.archivo + '.mp4'), voz = path.join(dir, 'pista-voz.wav'), hayVoz = fs.existsSync(voz) && !T.estimado;
  const args = ['-framerate', String(T.fps), '-i', path.join(salida, '%05d.jpg')];
  if (hayVoz) args.push('-i', voz); else args.push('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo');
  ff([...args, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-c:a', 'aac', '-b:a', '192k', '-t', String(T.dur), '-movflags', '+faststart', mp4]);
  if (!argv.includes('--conservar-cuadros')) fs.rmSync(salida, { recursive: true, force: true });
  const hoja = path.join(dir, C.archivo + '-hoja.jpg');
  ff(['-i', mp4, '-vf', `fps=${(24 / T.dur).toFixed(5)},scale=300:-2,tile=8x3:padding=4:color=white`, '-frames:v', '1', '-update', '1', hoja]);
  console.log(`${hayVoz ? 'Listo (con voz, SIN música)' : '⚠ Listo SIN voz (no hay pista-voz.wav)'}: ${mp4}\nHoja de 24 cuadros: ${hoja}`);
}
