#!/usr/bin/env node
// hoja.mjs — hoja de 20 fotogramas (5×4) desde <inicio>, uno cada <paso> s. Cuadro k = inicio + k×paso (fila por fila).
// Uso: node hoja.mjs <video.mp4> <inicio_s> <paso_s> <salida.jpg>
import { ffmpeg, uso } from './comun.mjs';
const [v, ini, paso, sal] = uso('node hoja.mjs <video.mp4> <inicio_s> <paso_s> <salida.jpg>', 4);
ffmpeg(['-ss', ini, '-t', String(+paso * 20), '-i', v, '-vf', `fps=1/${paso},scale=320:-1,tile=5x4:padding=4:color=white`, '-frames:v', '1', sal]);
console.log(sal);
