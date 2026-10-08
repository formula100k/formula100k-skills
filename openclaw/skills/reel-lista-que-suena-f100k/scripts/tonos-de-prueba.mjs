#!/usr/bin/env node
// Fabrica tonos sintéticos (uno por ítem, cada uno con su nota) en <carpeta>/audios/ para probar mezclar.mjs
// sin usar música de nadie. NO son para publicar.
//   node tonos-de-prueba.mjs <carpeta>
import fs from 'node:fs';
import path from 'node:path';
import { carpeta, leerConfig, items, ff } from './comun.mjs';

const dir = carpeta(process.argv.slice(2));
const IT = items(leerConfig(dir), null), audios = path.join(dir, 'audios');
fs.mkdirSync(audios, { recursive: true });
const ESCALA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]; // pentatónica: suena amable aunque sea un tono
IT.forEach((it, i) => {
  const f = 220 * Math.pow(2, ESCALA[i % ESCALA.length] / 12), vol = i % 2 ? 0.9 : 0.25; // a propósito unos fuertes y otros bajos
  ff(['-f', 'lavfi', '-i', `sine=frequency=${f.toFixed(2)}:duration=8`, '-f', 'lavfi', '-i', `sine=frequency=${(f * 1.5).toFixed(2)}:duration=8`,
    '-filter_complex', `[0:a][1:a]amix=inputs=2:normalize=0,volume=${vol},tremolo=f=4:d=0.4[o]`, '-map', '[o]', '-ar', '44100', '-b:a', '128k', path.join(audios, it.num + '.mp3')]);
});
console.log(`${IT.length} tonos de prueba en ${audios} (01.mp3 … ${IT[IT.length - 1].num}.mp3). Cada uno dura 8 s y tiene su propia nota.`);
