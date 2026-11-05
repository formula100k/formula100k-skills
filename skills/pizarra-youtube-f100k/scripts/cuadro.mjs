#!/usr/bin/env node
// cuadro.mjs — captura de 1280 px de ancho para la lámina.
// Uso: node cuadro.mjs <video.mp4> <segundo> <salida.jpg>
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { ffmpeg, uso } from './comun.mjs';
const [v, seg, sal] = uso('node cuadro.mjs <video.mp4> <segundo> <salida.jpg>', 3);
mkdirSync(dirname(resolve(sal)), { recursive: true });
ffmpeg(['-ss', seg, '-i', v, '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '3', sal]);
console.log(sal);
