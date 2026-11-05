#!/usr/bin/env node
// mezclar.mjs — lee window.SFX de la pieza armada y pone cada efecto de sonido debajo de la voz (sin música).
// Uso: node mezclar.mjs <pieza.html> <video-voz.mp4> <carpeta-sfx> <salida.mp4>
//   La carpeta trae un .wav por efecto (golpe, whoosh, swoosh, tic, ding, papel, pop, plumon, riser, sello): créala con sonidos.mjs.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { abrirChrome } from './comun.mjs';
import { comoUrl } from './sistema.mjs';

const [pieza, video, sfx, salida] = process.argv.slice(2);
if (!pieza || !video || !sfx || !salida) { console.error('uso: node mezclar.mjs <pieza.html> <video-voz.mp4> <carpeta-sfx> <salida.mp4>'); process.exit(1); }
const nav = await abrirChrome({ args: ['--allow-file-access-from-files'] });
const pag = await nav.newPage();
await pag.goto(comoUrl(pieza, '?render'));
const eventos = (await pag.evaluate(() => window.SFX)) || [];
await nav.close();
const faltan = [...new Set(eventos.map(e => e.s))].filter(s => !existsSync(join(sfx, s + '.wav')));
if (faltan.length) { console.error(`Faltan sonidos en ${sfx}: ${faltan.join(', ')}. Créalos con: node sonidos.mjs ${sfx}`); process.exit(1); }
const vol = { golpe: .55, whoosh: .35, swoosh: .3, tic: .22, ding: .35, papel: .5, pop: .35, plumon: .4, riser: .3, sello: .5 };
const entradas = ['-i', video], filtros = [];
eventos.forEach((e, i) => {
  entradas.push('-i', join(sfx, e.s + '.wav'));
  filtros.push(`[${i + 1}:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=${vol[e.s] ?? .3},adelay=${Math.round(e.t * 1000)}:all=1[s${i}]`);
});
filtros.push(`[0:a]aformat=sample_rates=44100:channel_layouts=stereo[v]`);
filtros.push(`[v]${eventos.map((_, i) => `[s${i}]`).join('')}amix=inputs=${eventos.length + 1}:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5[o]`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', filtros.join(';'), '-map', '0:v', '-map', '[o]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', salida], { stdio: 'inherit' });
console.log(`listo -> ${salida} · ${eventos.length} efectos`);
