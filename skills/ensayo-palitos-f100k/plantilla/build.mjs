#!/usr/bin/env node
// build.mjs — arma el reel «Ensayo de palitos» desde config.json. Código puro: sin Blender y sin créditos.
//
//   node build.mjs                 → reel.mp4 (1080×1920, 30 fps, H.264) + hoja.jpg (9 cuadros) + styleframe.jpg
//   node build.mjs --hoja          → solo la hoja de revisión rápida (_revision-N.jpg, un cuadro cada 0,4 s por escena)
//   node build.mjs --config otra.json --out reel_v2.mp4
//   node build.mjs --chico         → prueba rápida a 540×960 (misma composición, la mitad de píxeles)
//
// Cada escena de config.json se dibuja con escena.html (o con el archivo que diga su "archivo") y se pegan en orden.
// La escena con "cierre": true lleva el CTA al final. Si config.json trae "voz", se mezcla debajo.
// Motor: nucleo.js + cine-dibujo.js + renderizar.mjs de la skill animacion-dibujada-f100k (Chrome sin ventana + ffmpeg).
import { readFileSync, writeFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir, tmpdir } from 'node:os';

const AQUI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const op = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };

// ---------- el motor de dibujo (skill hermana) ----------
const MOTOR = [process.env.MOTOR_DIBUJO, join(AQUI, '..', '..', 'animacion-dibujada-f100k'), join(homedir(), '.claude', 'skills', 'animacion-dibujada-f100k')]
  .filter(Boolean).find(d => existsSync(join(d, 'nucleo', 'nucleo.js')) && existsSync(join(d, 'scripts', 'renderizar.mjs')));
if (!MOTOR) { console.error('Falta la skill animacion-dibujada-f100k (su motor de dibujo). Instálala junto a esta o en ~/.claude/skills, corre `npm i` dentro de ella y vuelve a intentar. También puedes indicar la carpeta con MOTOR_DIBUJO=/ruta.'); process.exit(1); }
const RENDER = join(MOTOR, 'scripts', 'renderizar.mjs');
const NUCLEO = ['nucleo.js', 'cine-dibujo.js'].map(f => '<script>\n' + readFileSync(join(MOTOR, 'nucleo', f), 'utf8') + '\n</script>').join('\n');

// ---------- config ----------
const rutaConfig = resolve(AQUI, op('--config', 'config.json'));
let C; try { C = JSON.parse(readFileSync(rutaConfig, 'utf8')); } catch (e) { console.error('config.json está mal escrito o no existe: ' + e.message); process.exit(1); }
const escenas = C.escenas?.length ? C.escenas : [{}];
if (!escenas.some(e => e.cierre)) escenas[escenas.length - 1].cierre = true;
if (String(C.cta || '').trim().toUpperCase() === 'YO') { console.error('La palabra del CTA no puede ser «YO»: elige una ligada al tema.'); process.exit(1); }

// fuentes OFL dentro del HTML (así la vista previa con doble clic también las usa)
const b64 = f => readFileSync(join(AQUI, 'fuentes', f)).toString('base64');
const FUENTES = `@font-face{font-family:"Kalam";src:url(data:font/ttf;base64,${b64('Kalam-Bold.ttf')}) format("truetype")}
@font-face{font-family:"Bangers";src:url(data:font/ttf;base64,${b64('Bangers-Regular.ttf')}) format("truetype")}`;

const chico = !!op('--chico');
function armar(i) {
  const e = escenas[i], html = readFileSync(join(AQUI, e.archivo || 'escena.html'), 'utf8');
  if (!html.includes('<!--NUCLEO-->') || !html.includes('/*CONFIG*/')) { console.error(`${e.archivo || 'escena.html'} perdió las marcas <!--NUCLEO--> o /*CONFIG*/.`); process.exit(1); }
  let out = html.replace('/*FUENTES*/', FUENTES).replace('/*CONFIG*/{}', JSON.stringify({ ...C, escena: e })).replace('<!--NUCLEO-->', () => NUCLEO);
  if (chico) out = out.replace('</body>', `<script>(()=>{const c=document.getElementById('c'),d=document.createElement('canvas');d.width=540;d.height=960;d.id='c';c.removeAttribute('id');c.style.display='none';c.before(d);
const g=d.getContext('2d'),f=window.draw;window.draw=n=>{f(n);g.drawImage(c,0,0,540,960)};})();</script></body>`);
  const ruta = join(AQUI, `_escena-${String(i + 1).padStart(2, '0')}.html`); writeFileSync(ruta, out); return ruta;
}
const R = (...a) => execFileSync(process.execPath, [RENDER, ...a], { stdio: 'inherit' });
const piezas = escenas.map((_, i) => armar(i));
const limpiar = () => piezas.forEach(p => rmSync(p, { force: true }));

if (op('--hoja')) {
  piezas.forEach((p, i) => R(p, join(AQUI, `_revision-${i + 1}.jpg`), '--hoja', '0.4'));
  limpiar(); process.exit(0);
}

// ---------- video ----------
const OUT = resolve(AQUI, op('--out', 'reel.mp4'));
if (existsSync(OUT) && !args.includes('--forzar')) { console.error(`${OUT} ya existe: usa --out reel_v2.mp4 (o --forzar para pisarlo).`); limpiar(); process.exit(1); }
const tmp = mkdtempSync(join(tmpdir(), 'ensayo-'));
const partes = piezas.map((p, i) => { const f = join(tmp, `p${i}.mp4`); R(p, f, '--callado'); return f; });
writeFileSync(join(tmp, 'lista.txt'), partes.map(f => `file '${f}'`).join('\n'));
const unido = join(tmp, 'unido.mp4');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'lista.txt'), '-c', 'copy', unido]);
const voz = C.voz ? resolve(AQUI, C.voz) : null;
if (voz && !existsSync(voz)) console.warn(`No encontré la voz ${voz}: el reel sale sin audio.`);
const conVoz = voz && existsSync(voz);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', unido, ...(conVoz ? ['-i', voz] : []),
  '-map', '0:v', ...(conVoz ? ['-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-af', 'apad', '-shortest'] : ['-an']),
  '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', OUT]);
rmSync(tmp, { recursive: true, force: true }); limpiar();

// ---------- revisión: hoja de 9 cuadros + styleframe ----------
const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT]).toString());
const base = OUT.replace(/\.mp4$/, '');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', OUT, '-vf', `fps=${(9 / dur).toFixed(4)},scale=360:-2,tile=3x3`, '-frames:v', '1', '-q:v', '3', base + '-hoja.jpg']);
const st = op('--style', String(Math.min(dur - .1, (escenas[0].dur ?? 4) * .8)));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', st, '-i', OUT, '-frames:v', '1', '-q:v', '2', base + '-styleframe.jpg']);
console.log(`listo: ${OUT} (${dur.toFixed(2)} s) · ${base}-hoja.jpg · ${base}-styleframe.jpg`);
