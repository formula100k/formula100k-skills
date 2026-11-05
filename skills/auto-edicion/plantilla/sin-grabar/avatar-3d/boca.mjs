// boca.mjs · saca el volumen de la voz cuadro por cuadro → fuente/boca.js (window.BOCA, 0..1 por cuadro)
// Uso: node boca.mjs <proyecto> [fps]
// Lee fuente/tiempos.json y voz/rec/NN.wav (los deja scripts/voz.mjs) y las pone en fila igual que scripts/render.mjs
// (inicio de cada frase = suma de d + 0,12), así la boca cae justo con la voz final.
import { readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { join } from 'path';

const P = process.argv[2], FPS = +(process.argv[3] || 30), SR = 16000;
if (!P) { console.error('Uso: node boca.mjs <proyecto> [fps]'); process.exit(1); }
const t = JSON.parse(readFileSync(join(P, 'fuente/tiempos.json'), 'utf8'));
let a = 0; const ini = t.map(x => { const r = a; a += x.d + 0.12; return r; });
const ins = t.flatMap((_, i) => ['-i', join(P, `voz/rec/${String(i + 1).padStart(2, '0')}.wav`)]);
const f = ini.map((s, i) => `[${i}:a]adelay=${Math.round(s * 1000)}:all=1[a${i}]`).join(';') + ';' +
  ini.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${ini.length}:normalize=0[o]`;
const pcm = execFileSync('ffmpeg', ['-loglevel', 'error', ...ins, '-filter_complex', f, '-map', '[o]', '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
const n = pcm.length / 2, por = SR / FPS, rms = [];
for (let k = 0; k * por < n; k++) {
  let s = 0, c = 0;
  for (let i = Math.floor(k * por); i < Math.min(n, Math.floor((k + 1) * por)); i++) { const v = pcm.readInt16LE(i * 2) / 32768; s += v * v; c++; }
  rms.push(Math.sqrt(s / Math.max(1, c)));
}
const orden = rms.filter(x => x > 0.005).sort((x, y) => x - y);
const tope = orden[Math.floor(orden.length * 0.9)] || 1, piso = tope * 0.12;
const boca = rms.map(x => Math.round(Math.min(1, Math.max(0, (x - piso) / (tope - piso))) * 100) / 100);
writeFileSync(join(P, 'fuente/boca.js'), `window.BOCA=${JSON.stringify(boca)};\n`);
console.log(`boca.js: ${boca.length} cuadros (${(boca.length / FPS).toFixed(1)} s)`);
