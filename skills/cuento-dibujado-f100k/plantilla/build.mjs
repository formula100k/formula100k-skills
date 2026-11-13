#!/usr/bin/env node
// build.mjs — arma el reel desde cero, sin Blender y sin créditos.
//   node build.mjs                          → index.html + reel.mp4 + cuadros.jpg (hoja de 9 cuadros)
//   node build.mjs --revision               → solo una hoja rápida con la hora de cada cuadro (revision.jpg)
//   node build.mjs --config otra.json       → usa otra config (por defecto config.json)
//   node build.mjs --out mi-reel.mp4        → nombre del video (si ya existe, sale mi-reel_v2.mp4, nunca se pisa)
// Necesita Node 18+, ffmpeg y Google Chrome. La primera vez: `npm i` en esta carpeta.
import { readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const op = n => { const i = args.indexOf(n); return i < 0 ? undefined : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const rutaConfig = resolve(op('--config') || join(aqui, 'config.json'));
const config = JSON.parse(readFileSync(rutaConfig, 'utf8'));

// 1) fuentes: cada .ttf/.otf de fuentes/ entra en el HTML (base64) con su nombre de archivo como familia.
//    Si config.fuente apunta a tu letra (ruta a un .ttf/.otf), entra como familia «Marca» y manda en los textos.
const fuenteFace = (familia, ruta) => {
  const ext = extname(ruta).slice(1).toLowerCase(), fmt = ext === 'otf' ? 'opentype' : 'truetype';
  return `@font-face{font-family:"${familia}";src:url(data:font/${ext};base64,${readFileSync(ruta).toString('base64')}) format("${fmt}");}`;
};
const dirF = join(aqui, 'fuentes');
let css = readdirSync(dirF).filter(f => /\.(ttf|otf)$/i.test(f)).map(f => fuenteFace(basename(f, extname(f)), join(dirF, f))).join('\n');
if (config.fuente) {
  const rf = resolve(dirname(rutaConfig), config.fuente);
  if (!existsSync(rf)) { console.error('No encontré tu letra: ' + rf); process.exit(1); }
  css += '\n' + fuenteFace('Marca', rf);
}

// 2) motor (núcleo de dibujo) adentro del HTML: un solo archivo que se abre con doble clic
const motor = ['nucleo.js', 'cine-dibujo.js'].filter(f => existsSync(join(aqui, 'motor', f)))
  .map(f => '<script>\n' + readFileSync(join(aqui, 'motor', f), 'utf8') + '\n</script>').join('\n');
const html = readFileSync(join(aqui, 'escena.html'), 'utf8')
  .replace('<!--FUENTES-->', () => `<style>\n${css}\n</style>`)
  .replace('<!--CONFIG-->', () => `<script>window.CONFIG = ${JSON.stringify(config)};</script>`)
  .replace('<!--MOTOR-->', () => motor);
const index = join(aqui, 'index.html');
writeFileSync(index, html);
const R = (...a) => execFileSync('node', [join(aqui, 'motor/renderizar.mjs'), index, ...a], { stdio: 'inherit' });

if (args.includes('--revision')) { R(join(aqui, 'revision.jpg'), '--hoja', '0.5'); process.exit(0); }

// 3) video (1080×1920, 30 fps, H.264 yuv420p, BT.709, sin audio)
const libre = (nombre) => { const b = nombre.replace(/\.mp4$/, ''); let f = join(aqui, b + '.mp4'), i = 2; while (existsSync(f)) f = join(aqui, `${b}_v${i++}.mp4`); return f; };
const out = libre(String(op('--out') || 'reel.mp4'));
const crudo = join(aqui, '_crudo.mp4');
R(crudo, '--callado');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', crudo, '-an', '-c', 'copy',
  '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', out]);
rmSync(crudo);

// 4) hoja de 9 cuadros repartidos en todo el video
const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString());
const hoja = join(aqui, 'cuadros.jpg');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', out, '-vf', `fps=9/${dur.toFixed(3)},scale=360:-2,tile=3x3`, '-frames:v', '1', '-q:v', '3', hoja]);
console.log('listo ->', out, '+', hoja);
