#!/usr/bin/env node
// boca.mjs · volumen de la voz por cuadro → <proyecto>/fuente/boca.js (window.BOCA = [0..1 por cuadro]).
// Usa la misma línea de tiempo que scripts/render.mjs: cada frase empieza en la suma de (d + 0,12) de las anteriores.
// Uso: node boca.mjs <proyecto> [fps=30]
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const P = process.argv[2], FPS = Number(process.argv[3] || 30), SR = 16000;
if (!P) { console.error('uso: node boca.mjs <proyecto> [fps]'); process.exit(1); }
const T = JSON.parse(readFileSync(join(P, 'fuente/tiempos.json'), 'utf8'));
let a = 0; const ini = T.map((x) => { const r = a; a += x.d + 0.12; return r; });
const N = Math.ceil((a + 2) * FPS), rms = new Float32Array(N), paso = SR / FPS;
T.forEach((_, i) => {
  const wav = join(P, 'voz/rec', String(i + 1).padStart(2, '0') + '.wav');
  const buf = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', wav, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  const s = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
  for (let k = 0; k * paso < s.length; k++) {
    let e = 0, n = 0; for (let j = Math.floor(k * paso); j < Math.min(s.length, (k + 1) * paso); j++) { e += s[j] * s[j]; n++; }
    const f = Math.round(ini[i] * FPS) + k; if (f < N) rms[f] = Math.max(rms[f], Math.sqrt(e / Math.max(1, n)));
  }
});
const max = Math.max(...rms) || 1;
const boca = [...rms].map((v) => { const db = 20 * Math.log10(v / max + 1e-6); return Math.round(Math.max(0, Math.min(1, (db + 32) / 24)) * 100) / 100; });
writeFileSync(join(P, 'fuente/boca.js'), 'window.BOCA=' + JSON.stringify(boca) + ';\n');
console.log(`boca.js: ${boca.length} cuadros`);
