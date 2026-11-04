#!/usr/bin/env node
// producir.mjs — todo el camino: escenas.json → voz → pieza.html → video mudo → efectos graves → MP4 final.
// Uso:
//   node producir.mjs <escenas.json> [--voz say|<carpeta-de-audios>|no] [--voz-nombre Paulina] [--ritmo 190]
//                     [--salida reel.mp4] [--sin-efectos] [--solo-armar]
// Deja todo lo intermedio en <carpeta del json>/build/ (pieza.html, tiempos.json, voz.wav, efectos.wav, mudo.mp4, hoja.jpg).
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { armar, aplicarTiempos } from './armar.mjs';
import { voz } from './voz.mjs';
import { pistaEfectos, agudosDb } from './sonidos.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const a = process.argv.slice(2), op = n => { const i = a.indexOf(n); return i < 0 ? undefined : (a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : true); };
const json = a[0];
if (!json || !existsSync(json)) { console.error('uso: node producir.mjs <escenas.json> [--voz say|<carpeta>|no] [--salida reel.mp4]'); process.exit(1); }
const build = join(dirname(resolve(json)), 'build'); mkdirSync(build, { recursive: true });
const salida = resolve(op('--salida') || join(dirname(resolve(json)), 'reel.mp4'));
const e = JSON.parse(readFileSync(json, 'utf8'));

console.log('1/5 voz…');
const { tiempos, pista } = voz(e, build, { voz: op('--voz') || 'say', nombre: op('--voz-nombre'), ritmo: op('--ritmo') });
aplicarTiempos(e, tiempos);
const dur = tiempos.reduce((s, t) => s + t.dur, 0);
console.log(`   ${tiempos.length} escenas · ${dur.toFixed(1)} s`);

console.log('2/5 armar pieza…');
const pieza = armar(e, join(build, 'pieza.html'));
if (op('--solo-armar')) { console.log('vista previa: abre ' + pieza); process.exit(0); }

console.log('3/5 render (Chrome)…');
const mudo = join(build, 'mudo.mp4');
execFileSync('node', [join(AQUI, 'renderizar.mjs'), pieza, mudo], { stdio: 'inherit' });
execFileSync('node', [join(AQUI, 'renderizar.mjs'), pieza, join(build, 'hoja.jpg'), '--hoja', '1'], { stdio: 'inherit' });

console.log('4/5 efectos graves…');
const eventos = JSON.parse(readFileSync(join(build, 'mudo.eventos.json'), 'utf8'));
const efectos = op('--sin-efectos') ? null : pistaEfectos(eventos, dur, build);
if (efectos) { const d = agudosDb(efectos); console.log(`   ${eventos.length} eventos · energía sobre 3 kHz: ${d} dB ${d < -30 ? '(OK, nada agudo)' : '⚠ REVISAR: hay agudos'}`); }

console.log('5/5 mezcla final…');
const ins = ['-i', mudo], filtros = [], et = [];
if (pista) { ins.push('-i', pista); filtros.push(`[${ins.length / 2 - 1}:a]volume=0dB[v]`); et.push('[v]'); }
if (efectos) { ins.push('-i', efectos); filtros.push(`[${ins.length / 2 - 1}:a]volume=0dB[s]`); et.push('[s]'); }
if (et.length) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex',
    filtros.join(';') + ';' + et.join('') + `amix=inputs=${et.length}:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[o]`,
    '-map', '0:v', '-map', '[o]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', salida]);
} else execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mudo, '-c', 'copy', salida]);
console.log(`listo -> ${salida}\nhoja de contacto -> ${join(build, 'hoja.jpg')}`);
