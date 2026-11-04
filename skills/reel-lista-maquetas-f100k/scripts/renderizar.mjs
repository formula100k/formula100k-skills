#!/usr/bin/env node
// renderizar.mjs — abre pieza.html en Chrome, saca una foto por cuadro y la pasa a ffmpeg.
// La pieza expone window.draw(frame) -> firma, window.FRAMES, window.FPS, window.EVENTOS, window.LISTO.
// Si la firma no cambia, reusa la foto anterior (los tramos quietos salen casi gratis).
//
// Uso:
//   node renderizar.mjs pieza.html salida.mp4                  video mudo (H.264, yuv420p) + salida.eventos.json (sonidos)
//   node renderizar.mjs pieza.html foto --cuadros 0,2.5s,90    fotos sueltas (número de cuadro o segundos con «s»)
//   node renderizar.mjs pieza.html hoja.jpg --hoja 1           un cuadro cada 1 s en una sola imagen, con la hora estampada
//   ... --png                                                  con --cuadros: PNG en vez de JPG
// Necesita: Node 18+, ffmpeg y Google Chrome (o Chromium). `npm i` en la carpeta de la skill instala playwright-core.
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
let chromium;
for (const base of [join(aqui, '..') + '/', process.cwd() + '/']) { try { chromium = createRequire(base)('playwright-core').chromium; break; } catch {} }
if (!chromium) { console.error('Falta playwright-core: corre `npm i` en la carpeta de la skill.'); process.exit(1); }

const args = process.argv.slice(2);
const [pieza, salida] = args;
const op = n => { const i = args.indexOf(n); return i < 0 ? undefined : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
if (!pieza || !salida) { console.error('uso: node renderizar.mjs pieza.html <salida> [--cuadros a,b] [--hoja seg]'); process.exit(1); }

const flags = { args: ['--allow-file-access-from-files', '--force-color-profile=srgb', ...(process.platform === 'linux' ? ['--no-sandbox', '--disable-dev-shm-usage'] : [])] };
let nav; try { nav = await chromium.launch({ channel: 'chrome', ...flags }); } catch { nav = await chromium.launch(flags); }
const pag = await nav.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errores = [];
pag.on('pageerror', e => errores.push(e.message));
pag.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
await pag.goto('file://' + resolve(pieza) + '?render');
await pag.evaluate(() => window.LISTO);
const info = await pag.evaluate(() => ({ FRAMES: window.FRAMES, FPS: window.FPS, EVENTOS: window.EVENTOS, ok: typeof window.draw === 'function' }));
if (!info.ok || !info.FRAMES) { console.error('La pieza no cargó bien:', errores); await nav.close(); process.exit(1); }
if (errores.length) console.warn('⚠ errores de la página:', errores);

const lienzo = await pag.$('#lienzo');
const foto = async (f, tipo = 'jpeg') => { await pag.evaluate(f => window.draw(f), f); return lienzo.screenshot({ type: tipo, ...(tipo === 'jpeg' ? { quality: 92 } : {}) }); };
// hoja de contacto: la hora se estampa con un rótulo dentro de la página (no depende de drawtext de ffmpeg)
const fotoConHora = async f => {
  await pag.evaluate(([f, fps]) => { window.draw(f); let d = document.getElementById('__hora'); if (!d) { d = document.createElement('div'); d.id = '__hora';
    d.style.cssText = 'position:absolute;left:0;top:0;z-index:99;background:rgba(0,0,0,.72);color:#fff;font:700 52px monospace;padding:10px 22px'; document.getElementById('lienzo').appendChild(d); }
    d.textContent = (f / fps).toFixed(1) + 's'; }, [f, info.FPS]);
  const b = await lienzo.screenshot({ type: 'jpeg', quality: 90 }); await pag.evaluate(() => document.getElementById('__hora')?.remove()); return b;
};

if (op('--cuadros')) {
  const png = !!op('--png');
  for (const v of String(op('--cuadros')).split(',').map(s => s.trim())) {
    const f = Math.min(info.FRAMES - 1, v.endsWith('s') ? Math.round(parseFloat(v) * info.FPS) : Number(v));
    const archivo = `${salida}-${String(f).padStart(4, '0')}.${png ? 'png' : 'jpg'}`; writeFileSync(archivo, await foto(f, png ? 'png' : 'jpeg')); console.log(archivo);
  }
} else if (op('--hoja')) {
  const cada = op('--hoja') === true ? 1 : Number(op('--hoja'));
  const cuadros = []; for (let t = cada / 2; t * info.FPS < info.FRAMES; t += cada) cuadros.push(Math.round(t * info.FPS));
  const dir = mkdtempSync(join(tmpdir(), 'hoja-'));
  for (let i = 0; i < cuadros.length; i++) writeFileSync(join(dir, `f${String(i).padStart(4, '0')}.jpg`), await fotoConHora(cuadros[i]));
  const cols = Math.min(6, cuadros.length), filas = Math.ceil(cuadros.length / cols);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(dir, 'f%04d.jpg'), '-vf', `scale=270:-2,tile=${cols}x${filas}`, '-frames:v', '1', salida]);
  rmSync(dir, { recursive: true });
  console.log(`hoja de contacto: ${cuadros.length} cuadros (cada ${cada}s) -> ${salida}`);
} else {
  const out = /\.\w+$/.test(salida) ? salida : salida + '.mp4';
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(info.FPS), '-c:v', 'mjpeg', '-i', '-',
    '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p', '-color_range', 'tv', '-c:v', 'libx264', '-crf', '18', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  let cerrado = false, codigo = null; const fin = new Promise(r => ff.on('close', c => { cerrado = true; codigo = c; r(); }));
  ff.stdin.on('error', () => {});
  const t0 = Date.now(); let ultima = null, ultimaFirma = null, fotos = 0;
  for (let f = 0; f < info.FRAMES && !cerrado; f++) {
    const firma = await pag.evaluate(f => window.draw(f), f);
    if (firma !== ultimaFirma || !ultima) { ultima = await lienzo.screenshot({ type: 'jpeg', quality: 92 }); ultimaFirma = firma; fotos++; }
    if (!ff.stdin.write(ultima)) await Promise.race([new Promise(r => ff.stdin.once('drain', r)), fin]);
    if (f % (info.FPS * 3) === 0) process.stdout.write(`cuadro ${f}/${info.FRAMES}\r`);
  }
  ff.stdin.end(); await fin;
  if (codigo !== 0) { console.error(`ffmpeg terminó con código ${codigo}`); await nav.close(); process.exit(1); }
  writeFileSync(out.replace(/\.\w+$/, '.eventos.json'), JSON.stringify(info.EVENTOS, null, 1));
  console.log(`listo: ${info.FRAMES} cuadros (${fotos} distintos) @ ${info.FPS}fps en ${((Date.now() - t0) / 1000).toFixed(1)} s -> ${out}`);
}
await nav.close();
