#!/usr/bin/env node
// cuadros.mjs — tira de cuadros de un video para revisarla (6 por fila).
// Uso: node cuadros.mjs <video.mp4> <salida.jpg> t1 t2 ...   (segundos)
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const [video, salida, ...ts] = process.argv.slice(2);
if (!video || !salida || !ts.length) { console.error('uso: node cuadros.mjs <video.mp4> <salida.jpg> t1 t2 ...'); process.exit(1); }
const tmp = mkdtempSync(join(tmpdir(), 'cuadros-'));
ts.forEach((t, i) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(t), '-i', video, '-frames:v', '1', '-vf', 'scale=270:480', join(tmp, String(i).padStart(3, '0') + '.jpg')]));
const cols = Math.min(6, ts.length), filas = Math.ceil(ts.length / cols);
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', '1', '-i', join(tmp, '%03d.jpg'), '-vf', `tile=${cols}x${filas}`, '-frames:v', '1', salida]);
rmSync(tmp, { recursive: true, force: true });
console.log('hoja -> ' + salida);
