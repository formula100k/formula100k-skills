#!/usr/bin/env node
// Hornea escenas scrapbook a pantalla completa (cartón + recortes) en la toma, ANTES del render de notitas.
// uso: node hornear.mjs <carpeta-escenas con config.js y fotos/> <video-base.mp4> <salida.mp4>
// Igual en Mac y en Windows: saca los cuadros con ffmpeg, pone el total en config.js y llama a render.mjs.
import {spawnSync} from 'node:child_process';
import {mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const [E, BASE, OUT] = process.argv.slice(2);
if (!E || !BASE || !OUT) { console.error('uso: node hornear.mjs <carpeta-escenas> <video-base.mp4> <salida.mp4>'); process.exit(1); }
const cuadros = path.join(E, 'cuadros');
rmSync(cuadros, {recursive: true, force: true});
mkdirSync(cuadros, {recursive: true});
const ff = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', BASE, '-vf', 'scale=1080:1920', '-q:v', '3', path.join(cuadros, '%05d.jpg')], {stdio: 'inherit'});
if (ff.status !== 0) { console.error('ffmpeg no pudo sacar los cuadros de ' + BASE); process.exit(1); }
const total = readdirSync(cuadros).filter((n) => n.endsWith('.jpg')).length;
const cfg = path.join(E, 'config.js');
writeFileSync(cfg, readFileSync(cfg, 'utf8').replace(/cuadros: \d+/, `cuadros: ${total}`), 'utf8');
const r = spawnSync(process.execPath, [path.join(aqui, 'render.mjs'), E, BASE, OUT], {stdio: 'inherit', env: {...process.env, PAGINA: 'escenas.html'}});
rmSync(cuadros, {recursive: true, force: true});
if (r.status !== 0) process.exit(r.status || 1);
console.log(`escenas horneadas → ${OUT} (${total} cuadros)`);
