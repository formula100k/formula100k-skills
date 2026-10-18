#!/usr/bin/env node
// Hoja de contacto de un MP4 (4 cuadros por segundo) para revisar el reel de un vistazo. Corre igual en Mac y en Windows.
// Uso: node hoja-de-contacto.mjs <video.mp4> [salida.jpg]
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const [video, salidaArg] = process.argv.slice(2);
if (!video || !existsSync(video)) { console.error('Uso: node hoja-de-contacto.mjs <video.mp4> [salida.jpg]'); process.exit(1); }
const salida = salidaArg || video.replace(/\.[^.\\/]+$/, '') + '-hoja.jpg';
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', 'fps=4,scale=216:-2,tile=10x4:padding=4:color=white', '-frames:v', '1', '-update', '1', salida], { stdio: 'inherit' });
if (r.error) { console.error('Falta ffmpeg (Mac: brew install ffmpeg · Windows: winget install -e --id Gyan.FFmpeg).'); process.exit(1); }
if (r.status !== 0) process.exit(1);
console.log(`Hoja: ${salida} (se lee de izquierda a derecha, 4 cuadros por segundo)`);
