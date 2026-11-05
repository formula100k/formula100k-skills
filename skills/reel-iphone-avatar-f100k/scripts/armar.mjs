#!/usr/bin/env node
// armar.mjs — mete fuente/tiempos.json y el núcleo de dibujo en fuente/pieza.src.html → fuente/pieza.html
// Uso: node armar.mjs <proyecto>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NUCLEO } from './comun.mjs';

export function armar(proyecto) {
  const f = join(resolve(proyecto), 'fuente');
  const src = join(f, 'pieza.src.html'), tiempos = join(f, 'tiempos.json');
  if (!existsSync(src)) throw new Error('No encontré ' + src + '. Copia plantilla/ejemplo-86.src.html ahí.');
  if (!existsSync(tiempos)) throw new Error('No encontré ' + tiempos + '. Corre primero voz.mjs.');
  const html = readFileSync(src, 'utf8').replace('__TIEMPOS__', () => readFileSync(tiempos, 'utf8'))
    .replace('<script src="../nucleo/nucleo.js"></script>', () => '<script>\n' + readFileSync(NUCLEO, 'utf8') + '\n</script>');
  writeFileSync(join(f, 'pieza.html'), html);
  return join(f, 'pieza.html');
}
if (process.argv[1] && resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase()) {
  if (!process.argv[2]) { console.error('uso: node armar.mjs <proyecto>'); process.exit(1); }
  try { console.log('armado -> ' + armar(process.argv[2])); } catch (e) { console.error(e.message); process.exit(1); }
}
