#!/usr/bin/env node
// armar.mjs — mete el núcleo de dibujo dentro de la pieza para que funcione sola (doble clic o render).
// Uso: node armar.mjs <pieza.src.html> [pieza.html]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { NUCLEO, conNucleo } from './comun.mjs';
const [src, out] = process.argv.slice(2);
if (!src) { console.error('uso: node armar.mjs <pieza.src.html> [pieza.html]'); process.exit(1); }
const destino = out || join(dirname(resolve(src)), 'pieza.html');
writeFileSync(destino, conNucleo(readFileSync(src, 'utf8'), readFileSync(NUCLEO, 'utf8')));
console.log('armado -> ' + destino);
