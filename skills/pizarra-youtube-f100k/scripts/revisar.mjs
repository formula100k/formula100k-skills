#!/usr/bin/env node
// revisar.mjs — fotografía cada lámina sola (sin notas ni encabezado) y arma hojas de 6 para revisarlas con Read.
// Uso: node revisar.mjs <pizarra.html> <n_laminas> <salida_prefijo>   → <prefijo>_0.jpg, <prefijo>_1.jpg…
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { correr, ffmpeg, uso } from './comun.mjs';
import { chromeOSalir } from './sistema.mjs';

const [h, n, pre] = uso('node revisar.mjs <pizarra.html> <n_laminas> <salida_prefijo>', 3);
const H = resolve(h), N = +n, O = resolve(pre), dir = dirname(H), shots = join(dir, '_shots');
mkdirSync(shots, { recursive: true });
const prev = join(dir, '_prev.html');
writeFileSync(prev, readFileSync(H, 'utf8').replace('</body>', '<script>document.getElementById("notes").hidden=true;const m=location.hash.match(/s(\\d+)/);if(m)show(+m[1]);document.querySelector("header").style.display="none";</script></body>'));
const chrome = chromeOSalir();
for (let k = 0; k < N; k++) {
  const png = join(shots, `s${k}.png`); rmSync(png, { force: true });
  correr(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--window-size=1232,720', '--virtual-time-budget=5000', `--screenshot=${png}`, pathToFileURL(prev).href + `#s${k}`], { silencio: true, opcional: true });
  if (!existsSync(png)) { console.error(`Chrome no pudo fotografiar la lámina ${k}.`); process.exit(1); }
}
for (let p = 0, ini = 0; ini < N; ini += 6, p++) {
  const ks = [...Array(Math.min(6, N - ini)).keys()].map(i => ini + i);
  const ins = ks.flatMap(k => ['-i', join(shots, `s${k}.png`)]), sal = `${O}_${p}.jpg`;
  if (ks.length === 1) ffmpeg([...ins, '-vf', 'crop=1200:675:16:20,scale=800:-2', sal]);
  else {
    const f = ks.map((_, c) => `[${c}]crop=1200:675:16:20,scale=800:-2[a${c}]`).join(';');
    const lay = ks.map((_, i) => `${(i % 2) * 800}_${Math.floor(i / 2) * 450}`).join('|');
    ffmpeg([...ins, '-filter_complex', `${f};${ks.map((_, i) => `[a${i}]`).join('')}xstack=inputs=${ks.length}:layout=${lay}:fill=white`, sal]);
  }
  console.log(sal);
}
rmSync(prev, { force: true });
