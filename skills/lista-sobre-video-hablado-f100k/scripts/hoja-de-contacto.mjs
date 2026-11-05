#!/usr/bin/env node
// Hoja de contacto de un MP4: 24 cuadros repartidos en todo el video, o un tramo a varios cuadros por segundo.
// Corre igual en Mac y en Windows.
// Uso: node hoja-de-contacto.mjs <video.mp4> [salida.jpg]                 → 24 cuadros de todo el video (6 por fila)
//      node hoja-de-contacto.mjs <video.mp4> <salida.jpg> <desde> <hasta> → ese tramo, 6 cuadros por segundo (para ver el cierre)
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const [video, salidaArg, desdeArg, hastaArg] = process.argv.slice(2);
if (!video || !existsSync(video)) { console.error('Uso: node hoja-de-contacto.mjs <video.mp4> [salida.jpg] [desde hasta]'); process.exit(1); }
const salida = salidaArg || video.replace(/\.[^.\\/]+$/, '') + '-hoja.jpg';
const ff = a => { const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...a, '-frames:v', '1', '-update', '1', salida], { stdio: 'inherit' });
  if (r.error) { console.error('Falta ffmpeg (Mac: brew install ffmpeg · Windows: winget install -e --id Gyan.FFmpeg).'); process.exit(1); }
  if (r.status !== 0) process.exit(1); };

if (desdeArg !== undefined && hastaArg !== undefined) {
  const desde = Number(desdeArg), hasta = Number(hastaArg);
  if (isNaN(desde) || isNaN(hasta)) { console.error('<desde> y <hasta> son segundos, por ejemplo 38.5 44'); process.exit(1); }
  const n = Math.max(1, Math.floor((hasta - desde) * 6)), filas = Math.floor((n + 7) / 8);
  ff(['-ss', String(desde), '-t', String(hasta - desde), '-i', video, '-vf', `fps=6,scale=270:-2,tile=8x${filas}:padding=4:color=white`]);
  console.log(`Hoja: ${salida} (del segundo ${desde} al ${hasta}, 6 cuadros por segundo, de izquierda a derecha)`);
} else {
  const d = parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], { encoding: 'utf8' }).stdout);
  if (!(d > 0)) { console.error('No pude medir el video: ' + video); process.exit(1); }
  ff(['-i', video, '-vf', `fps=24/${d},scale=360:-2,tile=6x4:padding=4:color=white`]);
  console.log(`Hoja: ${salida} (24 cuadros, uno cada ${(d / 24).toFixed(1)} s, de izquierda a derecha)`);
}
