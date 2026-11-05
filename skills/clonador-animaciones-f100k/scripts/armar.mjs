#!/usr/bin/env node
// armar.mjs — mete el núcleo de animación dentro de la pieza para que funcione sola (se abre con doble clic).
// Uso: node armar.mjs <pieza.src.html> [pieza.html]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { hermana, MARCA } from './comun.mjs';
const [src, out] = process.argv.slice(2);
if (!src) { console.error('uso: node armar.mjs <pieza.src.html> [pieza.html]'); process.exit(1); }
const html = readFileSync(src, 'utf8');
if (!html.includes(MARCA)) { console.error(`La pieza no trae la línea ${MARCA}: no la borres, ahí entra el núcleo.`); process.exit(1); }
const nucleo = readFileSync(join(hermana(), 'nucleo', 'nucleo.js'), 'utf8');
const destino = out || join(dirname(resolve(src)), 'pieza.html');
writeFileSync(destino, html.replace(MARCA, () => '<script>\n' + nucleo + '\n</script>'));
console.log('armado -> ' + destino);
console.log('hoja de contacto: node "' + join(hermana(), 'scripts', 'renderizar.mjs') + '" "' + destino + '" hoja.jpg --hoja 2');
