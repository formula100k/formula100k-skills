#!/usr/bin/env node
// cuadros.mjs — tira de cuadros de un video para revisarlo (6 por fila).
// Uso: node scripts/cuadros.mjs <video.mp4> <salida.jpg> t1 t2 …   (segundos)
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { casa, correr, salir } from './comun.mjs';

try {
  const [v, o, ...ts] = process.argv.slice(2);
  if (!v || !o || !ts.length) throw new Error('uso: node scripts/cuadros.mjs <video.mp4> <salida.jpg> 1 5 9 …');
  const d = mkdtempSync(join(tmpdir(), 'cuadros-'));
  ts.forEach((t, i) => correr('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(t), '-i', casa(v), '-frames:v', '1', '-vf', 'scale=270:480:force_original_aspect_ratio=decrease,pad=270:480:(ow-iw)/2:(oh-ih)/2', join(d, String(i).padStart(3, '0') + '.jpg')]));
  const n = Math.min(6, ts.length), filas = Math.ceil(ts.length / n);
  correr('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(d, '%03d.jpg'), '-vf', `tile=${n}x${filas}`, '-frames:v', '1', casa(o)]);
  rmSync(d, { recursive: true, force: true });
  console.log('listo -> ' + casa(o));
} catch (e) { salir(e); }
