#!/usr/bin/env node
// voz.mjs — de los audios de cada frase a fuente/tiempos.json (duración de cada frase + inicio de cada palabra).
// Uso: node voz.mjs <proyecto>                      usa <proyecto>/voz/01.mp3, 02.wav… (mp3, wav, m4a o aiff; uno por frase)
//      node voz.mjs <proyecto> --prueba frases.txt  primero crea esos audios con la voz de la computadora (una frase por renglón)
// Recorta el silencio de cada audio → voz/rec/NN.wav y transcribe cada uno con Whisper en tu computadora
// (mlx-whisper en Mac con chip Apple, faster-whisper en Windows y Mac Intel; la primera vez baja el modelo).
import { readFileSync, writeFileSync, readdirSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { sh, duracion, dos } from './comun.mjs';
import { transcribir, vozDePrueba } from './sistema.mjs';

const args = process.argv.slice(2);
const P = args[0] && !args[0].startsWith('--') ? resolve(args[0]) : null;
if (!P) { console.error('uso: node voz.mjs <proyecto> [--prueba frases.txt]'); process.exit(1); }
const voz = join(P, 'voz'), rec = join(voz, 'rec');
mkdirSync(rec, { recursive: true }); mkdirSync(join(P, 'fuente'), { recursive: true });

const ip = args.indexOf('--prueba');
if (ip >= 0) {
  const frases = readFileSync(args[ip + 1], 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const tmp = mkdtempSync(join(tmpdir(), 'voz-'));
  try {
    frases.forEach((t, i) => {
      const cruda = vozDePrueba(t.replace(/\*/g, ''), join(tmp, dos(i + 1)));
      sh('ffmpeg', ['-v', 'error', '-y', '-i', cruda, '-ar', '44100', '-ac', '1', join(voz, dos(i + 1) + '.wav')]);
    });
  } catch (e) { console.error(e.message); process.exit(1); }
  rmSync(tmp, { recursive: true, force: true });
  console.log(`voz de PRUEBA (no se entrega): ${frases.length} frases en ${voz}`);
}

const audios = readdirSync(voz).filter(f => /^\d+\.(mp3|wav|m4a|aiff)$/i.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
if (!audios.length) { console.error('No hay audios en ' + voz + ' (01.mp3, 02.mp3…).'); process.exit(1); }
const salida = [];
for (const [i, f] of audios.entries()) {
  const out = join(rec, dos(i + 1) + '.wav');
  sh('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(voz, f), '-af',
    'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '44100', '-ac', '1', out]);
  const r = transcribir(out, { dir: join(rec, '_texto') });
  if (!r.ok) { console.error('No pude transcribir ' + out + ':\n' + r.error); process.exit(1); }
  const j = JSON.parse(readFileSync(r.archivo, 'utf8'));
  const words = (j.segments || []).flatMap(s => s.words || []).map(w => ({ w: String(w.word).trim(), s: +(+w.start).toFixed(2), e: +(+w.end).toFixed(2) }));
  const d = +duracion(out).toFixed(2);
  salida.push({ d, words });
  console.log(`${dos(i + 1)} · ${d} s · ${words.map(w => w.w).join(' ')}`);
}
writeFileSync(join(P, 'fuente', 'tiempos.json'), JSON.stringify(salida, null, 1));
console.log('tiempos -> ' + join(P, 'fuente', 'tiempos.json'));
