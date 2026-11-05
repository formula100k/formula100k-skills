#!/usr/bin/env node
// subs.mjs — solo la franja de abajo, 2 cuadros por segundo: sirve para cazar el instante exacto de un subtítulo quemado.
// Uso: node subs.mjs <video.mp4> <inicio_s> <segundos> <salida.jpg>
import { ffmpeg, uso } from './comun.mjs';
const [v, ini, seg, sal] = uso('node subs.mjs <video.mp4> <inicio_s> <segundos> <salida.jpg>', 4);
ffmpeg(['-ss', ini, '-t', seg, '-i', v, '-vf', 'fps=2,crop=iw:ih*0.22:0:ih*0.78,scale=400:-2,tile=4x8:padding=3:color=white', '-frames:v', '1', sal]);
console.log(sal);
