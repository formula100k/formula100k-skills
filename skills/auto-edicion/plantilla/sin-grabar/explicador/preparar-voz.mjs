#!/usr/bin/env node
// Prepara la voz de un reel de la plantilla «explicador con avatar». Igual en Mac y en Windows.
//
//   node preparar-voz.mjs <carpeta-de-voces> <carpeta-del-reel>
//
// Por cada frase (01.mp3, 02.m4a… en el orden del guion):
//   1. le quita el silencio del inicio y del final → <reel>/assets/voz/NN.wav
//   2. la transcribe palabra por palabra (el mismo Whisper local de Auto-Edición: mlx-whisper en Mac con chip Apple,
//      faster-whisper en Windows y Mac Intel) → <reel>/tiempos.json
// armar.mjs usa tiempos.json para encender cada palabra y cada tarjeta («@palabra») justo cuando se dice.
// Además imprime lo que oyó, para compararlo con el guion antes de renderizar.
import { readdirSync, mkdirSync, writeFileSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { transcribir } from '../../../scripts/sistema.mjs';

const [origen, reel] = process.argv.slice(2).map(p => p && resolve(p));
if (!origen || !reel) { console.error('Uso: node preparar-voz.mjs <carpeta-de-voces> <carpeta-del-reel>'); process.exit(1); }
const sal = join(reel, 'assets', 'voz'); mkdirSync(sal, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'voz-'));
const ff = a => execFileSync('ffmpeg', ['-y', '-v', 'error', ...a]);
const RECORTE = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse';

const tiempos = {};
const audios = readdirSync(origen).filter(f => /^\d+\.(mp3|wav|m4a|aiff?)$/i.test(f)).sort();
if (!audios.length) { console.error(`No hay audios en ${origen}: van como 01.mp3, 02.m4a… uno por frase.`); process.exit(1); }
console.log('Transcribiendo cada frase (la primera vez descarga el modelo)…');
for (const f of audios) {
  const n = f.replace(/\..+$/, '').padStart(2, '0');
  ff(['-i', join(origen, f), '-af', RECORTE, '-ar', '44100', join(sal, `${n}.wav`)]);
  ff(['-i', join(sal, `${n}.wav`), '-ar', '16000', '-ac', '1', join(tmp, `${n}.wav`)]);
  const r = transcribir(join(tmp, `${n}.wav`), { dir: tmp, idioma: process.env.IDIOMA || 'es' });
  if (!r.ok) { console.error(`No pude transcribir ${f}:\n${r.error}`); process.exit(1); }
  const j = JSON.parse(readFileSync(r.archivo, 'utf8'));
  tiempos[n] = (j.segments || []).flatMap(s => s.words || []).map(w => ({ w: String(w.word).trim(), t: +(+w.start).toFixed(2) })).filter(w => w.w);
  console.log(n, tiempos[n].map(x => x.w).join(' '));
}
rmSync(tmp, { recursive: true, force: true });
writeFileSync(join(reel, 'tiempos.json'), JSON.stringify(tiempos, null, 1));
console.log(`\ntiempos.json listo (${Object.keys(tiempos).length} frases). Compara lo de arriba con tu guion.`);
