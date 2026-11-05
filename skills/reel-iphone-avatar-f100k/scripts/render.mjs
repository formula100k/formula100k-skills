#!/usr/bin/env node
// render.mjs — arma la pieza, la renderiza muda y le pega la voz alineada (inicio de frase = suma de d + 0,12 s).
// Uso: node render.mjs <proyecto> <salida.mp4>
import { mkdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { RENDERIZAR, sh, duracion, dos } from './comun.mjs';
import { armar } from './armar.mjs';

const [p, s] = process.argv.slice(2);
if (!p || !s) { console.error('uso: node render.mjs <proyecto> <salida.mp4>'); process.exit(1); }
const P = resolve(p), salida = resolve(s), f = join(P, 'fuente');
const pieza = armar(P);
sh(process.execPath, [RENDERIZAR, pieza, join(f, 'mudo.mp4')], { stdio: ['ignore', 'ignore', 'inherit'] });
const t = JSON.parse(readFileSync(join(f, 'tiempos.json'), 'utf8'));
let a = 0; const ini = t.map(x => { const r = a; a += x.d + 0.12; return r; });
const entradas = t.flatMap((_, i) => ['-i', join(P, 'voz', 'rec', dos(i + 1) + '.wav')]);
const filtro = ini.map((x, i) => `[${i}:a]adelay=${Math.round(x * 1000)}:all=1[a${i}]`).join(';') + ';' + ini.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${ini.length}:normalize=0,loudnorm=I=-14:TP=-1.5[o]`;
sh('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', filtro, '-map', '[o]', '-c:a', 'aac', '-b:a', '192k', join(f, 'voz.m4a')]);
mkdirSync(dirname(salida), { recursive: true });
sh('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(f, 'mudo.mp4'), '-i', join(f, 'voz.m4a'), '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', salida]);
console.log(`listo -> ${salida} · ${duracion(salida).toFixed(1)} s`);
