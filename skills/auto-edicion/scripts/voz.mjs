#!/usr/bin/env node
// voz.mjs — recorta el silencio de voz/NN.(mp3|wav|m4a|aiff) → voz/rec/NN.wav y saca fuente/tiempos.json
// (la duración de cada frase y el inicio de cada palabra). Transcribe con mlx-whisper en Mac con chip Apple
// y con faster-whisper en Windows y en las demás (las dos gratis y en tu compu).
// Uso: node scripts/voz.mjs <proyecto>
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { transcribir } from './sistema.mjs';
import { casa, correr, durar, salir } from './comun.mjs';

try {
  if (!process.argv[2]) throw new Error('uso: node scripts/voz.mjs <proyecto>');
  const P = casa(process.argv[2]), voz = join(P, 'voz'), rec = join(voz, 'rec');
  mkdirSync(rec, { recursive: true }); mkdirSync(join(P, 'fuente'), { recursive: true });
  const audios = readdirSync(voz).filter(f => /^\d{2}\.(mp3|wav|m4a|aiff?)$/i.test(f)).sort();
  if (!audios.length) throw new Error(`No hay audios en ${voz}: van como 01.mp3, 02.mp3… (o .wav, .m4a, .aiff), uno por frase.`);
  const tmp = mkdtempSync(join(tmpdir(), 'tiempos-')), out = [];
  console.log('Transcribiendo cada frase (la primera vez descarga el modelo)…');
  for (const f of audios) {
    const n = f.slice(0, 2), wav = join(rec, n + '.wav');
    correr('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(voz, f), '-af',
      'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '44100', '-ac', '1', wav]);
    const r = transcribir(wav, { dir: tmp, idioma: 'es' });
    if (!r.ok) throw new Error('No pude transcribir ' + wav + '\n' + r.error);
    const j = JSON.parse(readFileSync(r.archivo, 'utf8'));
    const words = (j.segments || []).flatMap(s => s.words || []).map(w => ({ w: String(w.word).trim(), s: +(+w.start).toFixed(2), e: +(+w.end).toFixed(2) }));
    const d = +durar(wav).toFixed(2);
    out.push({ d, words });
    console.log(`rec/${n}.wav ${d} ${words.map(w => w.w).join(' ')}`);
  }
  rmSync(tmp, { recursive: true, force: true });
  writeFileSync(join(P, 'fuente', 'tiempos.json'), JSON.stringify(out, null, 1));
  console.log(`listo -> ${join(P, 'fuente', 'tiempos.json')} (${out.length} frases)`);
} catch (e) { salir(e); }
