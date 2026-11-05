#!/usr/bin/env node
// sonidos.mjs — crea el banco de efectos de sonido que usa mezclar.mjs, sintetizado con ffmpeg (sin archivos de terceros).
// Uso: node sonidos.mjs <carpeta-sfx>   → golpe.wav, whoosh.wav, swoosh.wav, tic.wav, ding.wav, papel.wav, pop.wav, plumon.wav, riser.wav, sello.wav
// Si prefieres otros sonidos (un banco libre de derechos que ya tengas), pon tus .wav con esos mismos nombres.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('uso: node sonidos.mjs <carpeta-sfx>'); process.exit(1); }
mkdirSync(dir, { recursive: true });
// [fuente, expresión o filtro, duración en segundos]
const SONIDOS = {
  golpe:  ['aevalsrc', '0.95*sin(2*PI*(62-30*t)*t)*exp(-t*7)+0.4*(random(0)*2-1)*exp(-t*40)', 0.7],
  pop:    ['aevalsrc', '0.8*sin(2*PI*(950-650*t/0.09)*t)*exp(-t*38)', 0.14],
  tic:    ['aevalsrc', '0.5*sin(2*PI*2600*t)*exp(-t*110)', 0.04],
  ding:   ['aevalsrc', '0.45*sin(2*PI*1320*t)*exp(-t*9)+0.25*sin(2*PI*1980*t)*exp(-t*11)', 0.6],
  sello:  ['aevalsrc', '0.95*sin(2*PI*(78-40*t)*t)*exp(-t*9)+0.35*(random(0)*2-1)*exp(-t*45)', 0.6],
  whoosh: ['pink', 'highpass=f=350,lowpass=f=2800,afade=t=in:d=0.22:curve=qsin,afade=t=out:st=0.22:d=0.26:curve=qsin,volume=0.9', 0.48],
  swoosh: ['pink', 'highpass=f=900,lowpass=f=6000,afade=t=in:d=0.12:curve=qsin,afade=t=out:st=0.12:d=0.5:curve=qsin,volume=0.8', 0.62],
  plumon: ['pink', 'bandpass=f=2300:w=1400,tremolo=f=18:d=0.6,afade=t=in:d=0.04,afade=t=out:st=0.25:d=0.12,volume=1.6', 0.38],
  riser:  ['pink', 'lowpass=f=2400,afade=t=in:d=3.6:curve=exp,afade=t=out:st=3.6:d=0.3,volume=0.6', 3.9],
  papel:  ['pink', 'bandpass=f=3800:w=3000,tremolo=f=31:d=0.9,afade=t=in:d=0.02,afade=t=out:st=0.12:d=0.12,volume=1.1', 0.24],
};
for (const [n, [tipo, expr, dur]] of Object.entries(SONIDOS)) {
  const [src, filtro] = tipo === 'aevalsrc' ? [`aevalsrc='${expr}':s=44100:d=${dur}`, 'anull'] : [`anoisesrc=d=${dur}:c=${tipo}:r=44100:a=0.5:seed=7`, expr];
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', src, '-af', filtro, '-ac', '2', join(dir, n + '.wav')], { stdio: 'inherit' });
}
console.log(`${Object.keys(SONIDOS).length} sonidos -> ${dir}`);
