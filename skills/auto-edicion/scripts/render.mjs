#!/usr/bin/env node
// render.mjs — arma, renderiza mudo, mezcla la voz alineada (inicio de frase = suma de d + 0,12) y pega.
// Uso: node scripts/render.mjs <proyecto> <salida.mp4>
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { armar, casa, correr, durar, renderizar, salir } from './comun.mjs';

try {
  const [p, s] = process.argv.slice(2);
  if (!p || !s) throw new Error('uso: node scripts/render.mjs <proyecto> <salida.mp4>');
  const P = casa(p), salida = casa(s), f = join(P, 'fuente');
  const pieza = armar(P);
  console.log('Renderizando (cada cuadro se dibuja en Chrome)…');
  console.log(renderizar([pieza, join(f, 'mudo.mp4'), '--callado'], { stdio: ['ignore', 'pipe', 'inherit'] }).trim().split('\n').slice(-1)[0]);
  const t = JSON.parse(readFileSync(join(f, 'tiempos.json'), 'utf8'));
  let a = 0; const ini = t.map(x => { const r = a; a += x.d + 0.12; return r; });
  const ins = t.flatMap((_, i) => { const w = join(P, 'voz', 'rec', String(i + 1).padStart(2, '0') + '.wav'); if (!existsSync(w)) throw new Error('Falta ' + w + ': corre node scripts/voz.mjs'); return ['-i', w]; });
  const fil = ini.map((x, i) => `[${i}:a]adelay=${Math.round(x * 1000)}:all=1[a${i}]`).join(';') + ';' + ini.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${ini.length}:normalize=0,loudnorm=I=-14:TP=-1.5[o]`;
  correr('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', fil, '-map', '[o]', '-c:a', 'aac', '-b:a', '192k', join(f, 'voz.m4a')]);
  correr('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(f, 'mudo.mp4'), '-i', join(f, 'voz.m4a'), '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', salida]);
  console.log(`listo -> ${salida} (${durar(salida).toFixed(1)} s)`);
} catch (e) { salir(e); }
