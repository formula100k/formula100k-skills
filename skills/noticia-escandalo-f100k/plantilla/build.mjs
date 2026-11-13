#!/usr/bin/env node
// build.mjs · Plantilla «Noticia de escándalo» (noticia-escandalo-f100k) — código puro, sin Blender ni créditos.
// Lee config.json, escribe config.js (lo carga index.html) y renderiza con el motor de canvas de la skill
// animacion-dibujada-f100k (Chrome headless + playwright-core).
//
// Uso (desde esta carpeta):
//   node build.mjs                         → noticia.mp4 (1080×1920, 30 fps, H.264 yuv420p bt709, sin audio) + hoja.jpg (9 cuadros)
//   node build.mjs --prueba                → solo prueba/hoja_prueba.jpg con 4 cuadros (rápido, para revisar)
//   node build.mjs --config otro.json      → usa otra configuración
//   SALIDA=video_v2.mp4 node build.mjs     → otro nombre de salida (no sobrescribe sin FORZAR=1)
// Para ver la pieza en vivo: corre una vez `node build.mjs --prueba` y abre index.html en Chrome.
// Variable RENDERIZAR: ruta a renderizar.mjs si no está en ~/.claude/skills/animacion-dibujada-f100k/scripts/.
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';

const D = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const op = n => { const i = args.indexOf(n); return i < 0 ? undefined : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };

// 1. config.json → config.js
const cfgPath = resolve(D, typeof op('--config') === 'string' ? op('--config') : 'config.json');
const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, 'utf8')) : {};
writeFileSync(join(D, 'config.js'), `// generado por build.mjs desde ${cfgPath.split(/[\\/]/).pop()}: no lo edites a mano\nwindow.CONFIG = ${JSON.stringify(cfg, null, 1)};\n`);
if (String(cfg.cta || '').trim().toUpperCase() === 'YO') { console.error('La palabra del CTA no puede ser «YO»: elige una ligada al tema.'); process.exit(1); }

// 2. motor de render
const candidatos = [process.env.RENDERIZAR, join(D, '..', '..', 'animacion-dibujada-f100k', 'scripts', 'renderizar.mjs'),
  join(homedir(), '.claude', 'skills', 'animacion-dibujada-f100k', 'scripts', 'renderizar.mjs')].filter(Boolean);
const RENDER = candidatos.find(existsSync);
if (!RENDER) { console.error('No encuentro renderizar.mjs: instala la skill animacion-dibujada-f100k (módulo Animación) o pasa RENDERIZAR=/ruta/renderizar.mjs.'); process.exit(1); }
const html = join(D, 'index.html');

if (op('--prueba')) {                                        // 4 cuadros: ticket marcado, sello, hilo, CTA tecleado
  const dir = join(D, 'prueba'); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
  execFileSync('node', [RENDER, html, join(dir, 'f'), '--cuadros', '1.2s,2.6s,4.2s,6.6s'], { stdio: 'inherit' });
  const fotos = readdirSync(dir).filter(f => /\.(png|jpe?g)$/i.test(f)).sort().map(f => join(dir, f));
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...fotos.flatMap(f => ['-i', f]), '-filter_complex',
    fotos.map((_, i) => `[${i}]scale=360:-2[v${i}]`).join(';') + ';' + fotos.map((_, i) => `[v${i}]`).join('') + `hstack=inputs=${fotos.length}`,
    '-q:v', '3', join(dir, 'hoja_prueba.jpg')], { stdio: 'inherit' });
  console.log('listo:', join(dir, 'hoja_prueba.jpg'));
  process.exit(0);
}

// 3. video completo + hoja de 9 cuadros
const salida = join(D, process.env.SALIDA || 'noticia.mp4');
if (existsSync(salida) && !process.env.FORZAR) { console.error(`Ya existe ${salida}: no se sobrescribe (usa SALIDA=otro.mp4 o FORZAR=1).`); process.exit(1); }
const crudo = join(D, '_crudo.mp4');
execFileSync('node', [RENDER, html, crudo], { stdio: 'inherit' });
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', crudo, '-an', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1',
  '-movflags', '+faststart', salida], { stdio: 'inherit' });
rmSync(crudo);
const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', salida]).toString());
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', salida, '-vf', `fps=${(9 / dur).toFixed(4)},scale=360:-2,tile=3x3`, '-frames:v', '1', '-q:v', '3', join(D, 'hoja.jpg')]);
console.log('listo:', salida, dur.toFixed(2) + ' s · hoja:', join(D, 'hoja.jpg'));
