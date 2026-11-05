#!/usr/bin/env node
// captura-web.mjs — captura de escritorio 1280×800 de una página (la del regalo, un perfil, etc.) con Chrome sin ventana.
// Uso: node captura-web.mjs <url> <salida.jpg>
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { correr, ffmpeg, uso } from './comun.mjs';
import { chromeOSalir } from './sistema.mjs';
const [url, s] = uso('node captura-web.mjs <url> <salida.jpg>', 2);
const sal = resolve(s), png = sal.replace(/\.jpe?g$/i, '') + '.png';
mkdirSync(dirname(sal), { recursive: true });
correr(chromeOSalir(), ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,800', '--virtual-time-budget=8000', `--screenshot=${png}`, url], { silencio: true, opcional: true });
if (!existsSync(png)) { console.error('Chrome no pudo capturar ' + url); process.exit(1); }
if (png !== sal) { ffmpeg(['-i', png, '-q:v', '3', sal]); rmSync(png, { force: true }); }
console.log(sal);
