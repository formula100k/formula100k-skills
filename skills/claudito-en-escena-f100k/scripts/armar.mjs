#!/usr/bin/env node
// armar.mjs — mete el núcleo dentro de la pieza para que funcione sola (doble clic o render).
// Uso: node armar.mjs <pieza.src.html> [pieza.html]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const [src, out] = process.argv.slice(2);
if (!src) { console.error('uso: node armar.mjs <pieza.src.html> [pieza.html]'); process.exit(1); }
const nucleo = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../nucleo/nucleo.js'), 'utf8');
const destino = out || join(dirname(resolve(src)), 'pieza.html');
writeFileSync(destino, readFileSync(src, 'utf8').replace('<script src="../nucleo/nucleo.js"></script>', () => '<script>\n' + nucleo + '\n</script>'));
console.log('armado -> ' + destino);
