#!/usr/bin/env node
// render.mjs — saca el MP4 con la voz y una hoja de contacto.
//
//   node render.mjs <carpeta-de-la-pieza>                 → <carpeta>/<nombre>.mp4 + hoja-de-contacto.jpg
//   node render.mjs <carpeta-de-la-pieza> 1.5,6.5,12.9    → solo esos segundos, en <carpeta>/prueba/ (+ tira.jpg)
//   opciones: --salida nombre.mp4 · --hilos 3 · --conservar (no borra los cuadros)
//
// Necesita Google Chrome, ffmpeg y el paquete puppeteer-core (lo busca en la carpeta de la pieza,
// en la skill carrusel-render-formula100k y en NODE_PATH; si no está: npm i puppeteer-core).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join, basename } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { delimiter } from 'node:path';
import vm from 'node:vm';
import { chromeOSalir, comoUrl, paraLista } from './sistema.mjs';

const args = process.argv.slice(2), flag = (n, d) => { const i = args.indexOf(n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
let salida = flag('--salida', null); const hilos = +flag('--hilos', 3);
const conservar = args.includes('--conservar'); if (conservar) args.splice(args.indexOf('--conservar'), 1);
if (!args[0]) { console.error('uso: node render.mjs <carpeta-de-la-pieza> [t1,t2,…] [--salida nombre.mp4] [--hilos 3]'); process.exit(1); }
const dir = resolve(args[0]), lista = args[1];

let puppeteer = null;
for (const base of [dir, process.cwd(), fileURLToPath(new URL('..', import.meta.url)), fileURLToPath(new URL('../../carrusel-render-formula100k', import.meta.url)), join(homedir(), '.claude/skills/carrusel-render-formula100k'), ...(process.env.NODE_PATH || '').split(delimiter).filter(Boolean).map(p => join(p, '..'))]) {
  try { puppeteer = createRequire(join(base, 'x.js'))('puppeteer-core'); break; } catch { }
}
if (!puppeteer) { console.error('Falta puppeteer-core. En la carpeta de la pieza: npm i puppeteer-core'); process.exit(1); }
const chrome = chromeOSalir();

const caja = { window: {} }; vm.runInNewContext(readFileSync(join(dir, 'config.js'), 'utf8'), caja); const C = caja.window.CONFIG;
if (!existsSync(join(dir, 'tiempos.js'))) console.log('⚠ No hay tiempos.js: los tiempos son ESTIMADOS. Corre sincronizar.mjs cuando tengas la voz.');
const out = join(dir, lista ? 'prueba' : '_cuadros'); rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });

const b = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--allow-file-access-from-files', '--force-color-profile=srgb', ...(process.platform === 'linux' ? ['--no-sandbox', '--disable-dev-shm-usage'] : [])] });   // en un servidor Linux (root) Chrome necesita --no-sandbox
async function abre() {
  const p = await b.newPage(); await p.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  p.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') { const t = m.text(); if (!/indice\.js|tiempos\.js|ERR_FILE_NOT_FOUND/.test(t)) console.log('  [página] ' + t); } });
  p.on('pageerror', e => { console.error('ERROR en la página: ' + e.message); process.exitCode = 1; });
  await p.goto(comoUrl(join(dir, 'index.html')), { waitUntil: 'load' });
  await p.evaluate(() => window.LISTO);
  return p;
}
const p0 = await abre();
const est = await p0.evaluate(() => ({ n: window.FRAMES, dur: window.DUR, fps: window.FPS_PIEZA, fuentes: window.FUENTES_OK, rotas: window.ROTAS }));
if (!est.fuentes) { console.error('Las fuentes web no cargaron (¿sin internet?). Revisa `fuentes.web` en config.js o usa fuentes del sistema.'); await b.close(); process.exit(1); }
if (est.rotas.length) { console.error('Imágenes que no cargaron:\n  ' + est.rotas.join('\n  ') + '\nRevisa las rutas en config.js.'); await b.close(); process.exit(1); }
const cuadros = lista ? lista.split(',').map(s => Math.min(est.n - 1, Math.round(parseFloat(s) * est.fps))) : [...Array(est.n).keys()];
const paginas = [p0]; for (let i = 1; i < Math.min(hilos, lista ? 1 : hilos); i++) paginas.push(await abre());
const t0 = Date.now(); let hechos = 0;
await Promise.all(paginas.map(async (p, k) => {
  for (let i = k; i < cuadros.length; i += paginas.length) { const f = cuadros[i];
    await p.evaluate(f => window.draw(f), f);
    await p.screenshot({ path: join(out, (lista ? (f / est.fps).toFixed(2).padStart(6, '0') : String(f).padStart(5, '0')) + '.jpg'), type: 'jpeg', quality: lista ? 82 : 93 });
    if (++hechos % 150 === 0) console.log(`  ${hechos}/${cuadros.length} cuadros`); }
}));
await b.close();
console.log(`${cuadros.length} cuadros en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
const ff = a => { const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: 'inherit' }); if (r.status !== 0) process.exit(1); };

if (lista) {
  const fotos = readdirSync(out).filter(f => f.endsWith('.jpg')).sort(), n = fotos.length, orden = join(out, '_orden.txt');
  // una lista en vez de «*.jpg»: el ffmpeg de Windows no acepta comodines
  writeFileSync(orden, fotos.map(f => `${paraLista(join(out, f))}\nduration 1`).join('\n') + '\n');
  ff(['-f', 'concat', '-safe', '0', '-i', orden, '-vf', `scale=270:-1,tile=${Math.min(n, 8)}x${Math.ceil(n / 8)}:padding=4`, '-frames:v', '1', '-q:v', '3', join(out, 'tira.jpg')]);
  rmSync(orden, { force: true });
  console.log('Mira ' + join(out, 'tira.jpg')); process.exit(0);
}
salida = join(dir, salida || (C.nombre || basename(dir)) + '.mp4');
const audio = C.audio && existsSync(join(dir, C.audio)) ? join(dir, C.audio) : null;
if (!audio) console.log('⚠ Sin audio (`audio` en config.js no existe): el MP4 sale mudo.');
ff(['-framerate', String(est.fps), '-i', join(out, '%05d.jpg'), ...(audio ? ['-i', audio, '-af', 'apad,loudnorm=I=-16:TP=-1.5', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000'] : []), '-t', String(est.dur), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-movflags', '+faststart', salida]);
const filas = Math.ceil(est.dur * 2 / 10), hoja = join(dir, 'hoja-de-contacto.jpg');
ff(['-i', salida, '-vf', `fps=2,scale=216:-1,tile=10x${filas}:padding=3`, '-frames:v', '1', '-q:v', '3', hoja]);
if (!conservar) rmSync(out, { recursive: true, force: true });
console.log(`MP4:  ${salida}  (${est.dur} s)\nHoja: ${hoja}  (un cuadro cada 0,5 s: ábrela y mírala)`);
