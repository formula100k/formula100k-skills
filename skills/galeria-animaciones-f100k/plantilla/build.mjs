#!/usr/bin/env node
// build.mjs — arma el reel «Galería de animaciones» desde config.json. Código puro: sin Blender y sin créditos.
//
//   node build.mjs                 → reel.mp4 (1080×1920, 30 fps, H.264) + reel-hoja.jpg (9 cuadros) + reel-styleframe.jpg
//   node build.mjs --hoja          → solo la hoja de revisión rápida (_revision.jpg, un cuadro cada 0,4 s)
//   node build.mjs --config otra.json --out reel_v2.mp4
//   node build.mjs --chico         → prueba rápida a 540×960
//
// Las imágenes de "items" (fotos o capturas reales) van con ruta relativa a esta carpeta. Si config.json trae "voz"
// o "musica", se mezclan debajo (la música baja sola cuando hay voz).
// Motor: renderizar.mjs de la skill animacion-dibujada-f100k (Chrome sin ventana + ffmpeg).
import { readFileSync, writeFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir, tmpdir } from 'node:os';

const AQUI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const op = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };

const MOTOR = [process.env.MOTOR_DIBUJO, join(AQUI, '..', '..', 'animacion-dibujada-f100k'), join(homedir(), '.claude', 'skills', 'animacion-dibujada-f100k')]
  .filter(Boolean).find(d => existsSync(join(d, 'scripts', 'renderizar.mjs')));
if (!MOTOR) { console.error('Falta la skill animacion-dibujada-f100k (se usa su renderizador). Instálala junto a esta o en ~/.claude/skills, corre `npm i` dentro de ella y vuelve a intentar. También puedes indicar la carpeta con MOTOR_DIBUJO=/ruta.'); process.exit(1); }
const RENDER = join(MOTOR, 'scripts', 'renderizar.mjs');

const rutaConfig = resolve(AQUI, op('--config', 'config.json'));
let C; try { C = JSON.parse(readFileSync(rutaConfig, 'utf8')); } catch (e) { console.error('config.json está mal escrito o no existe: ' + e.message); process.exit(1); }
if (String(C.cta || '').trim().toUpperCase() === 'YO') { console.error('La palabra del CTA no puede ser «YO»: elige una ligada al tema.'); process.exit(1); }
const faltan = (C.items || []).filter(it => it?.imagen && !existsSync(resolve(AQUI, it.imagen))).map(it => it.imagen);
if (faltan.length) { console.error('No encontré estas imágenes (rutas relativas a ' + AQUI + '):\n  ' + faltan.join('\n  ')); process.exit(1); }

const b64 = f => readFileSync(join(AQUI, 'fuentes', f)).toString('base64');
const ff = (fam, f, extra = '') => `@font-face{font-family:"${fam}";src:url(data:font/ttf;base64,${b64(f)}) format("truetype");${extra}}`;
const FUENTES = [ff('Inter', 'Inter-var.ttf', 'font-weight:100 900'), ff('Barlow Condensed', 'BarlowCondensed-ExtraBold.ttf', 'font-weight:800'),
  ff('Instrument Serif', 'InstrumentSerif-Italic.ttf', 'font-style:italic'), ff('JetBrains Mono', 'JetBrainsMono-Regular.ttf', 'font-weight:100 900'), ff('Lora', 'Lora-Bold.ttf', 'font-weight:100 900')].join('\n');

let html = readFileSync(join(AQUI, 'galeria.html'), 'utf8');
if (!html.includes('/*CONFIG*/')) { console.error('galeria.html perdió la marca /*CONFIG*/.'); process.exit(1); }
html = html.replace('/*FUENTES*/', FUENTES).replace('/*CONFIG*/{}', () => JSON.stringify(C));
if (op('--chico')) html = html.replace('</body>', `<script>(()=>{const c=document.getElementById('c'),d=document.createElement('canvas');d.width=540;d.height=960;c.style.display='none';c.before(d);
const g=d.getContext('2d'),f=window.draw;window.draw=n=>{f(n);g.drawImage(c,0,0,540,960)};})();</script></body>`);
const PIEZA = join(AQUI, '_galeria.html'); writeFileSync(PIEZA, html);   // junto a config.json: así las rutas de las imágenes funcionan
const R = (...a) => execFileSync(process.execPath, [RENDER, PIEZA, ...a], { stdio: 'inherit' });

if (op('--hoja')) { R(join(AQUI, '_revision.jpg'), '--hoja', '0.4'); rmSync(PIEZA); process.exit(0); }

const OUT = resolve(AQUI, op('--out', 'reel.mp4'));
if (existsSync(OUT) && !args.includes('--forzar')) { console.error(`${OUT} ya existe: usa --out reel_v2.mp4 (o --forzar para pisarlo).`); rmSync(PIEZA); process.exit(1); }
const tmp = mkdtempSync(join(tmpdir(), 'galeria-')), mudo = join(tmp, 'mudo.mp4');
R(mudo, '--callado'); rmSync(PIEZA);
const voz = C.voz && existsSync(resolve(AQUI, C.voz)) ? resolve(AQUI, C.voz) : null;
const mus = C.musica && existsSync(resolve(AQUI, C.musica)) ? resolve(AQUI, C.musica) : null;
if (C.voz && !voz) console.warn('No encontré la voz ' + C.voz + ': sale sin ella.');
if (C.musica && !mus) console.warn('No encontré la música ' + C.musica + ': sale sin ella.');
const ins = ['-i', mudo], fil = [];
if (voz) ins.push('-i', voz); if (mus) ins.push('-stream_loop', '-1', '-i', mus);
if (voz && mus) fil.push('[2:a]volume=0.25,lowpass=f=9000[m];[1:a][m]amix=inputs=2:duration=first:normalize=0,apad[a]');
else if (voz) fil.push('[1:a]apad[a]'); else if (mus) fil.push('[1:a]volume=0.5,lowpass=f=9000,apad[a]');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ins, ...(fil.length ? ['-filter_complex', fil[0], '-map', '0:v', '-map', '[a]', '-c:a', 'aac', '-b:a', '192k', '-shortest'] : ['-map', '0:v', '-an']),
  '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', OUT]);
rmSync(tmp, { recursive: true, force: true });

const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT]).toString());
const base = OUT.replace(/\.mp4$/, '');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', OUT, '-vf', `fps=${(9 / dur).toFixed(4)},scale=360:-2,tile=3x3`, '-frames:v', '1', '-q:v', '3', base + '-hoja.jpg']);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(op('--style', (dur * .55).toFixed(2))), '-i', OUT, '-frames:v', '1', '-q:v', '2', base + '-styleframe.jpg']);
console.log(`listo: ${OUT} (${dur.toFixed(2)} s) · ${base}-hoja.jpg · ${base}-styleframe.jpg`);
