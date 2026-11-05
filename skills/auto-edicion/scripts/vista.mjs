#!/usr/bin/env node
// vista.mjs — arma la pieza y saca cuadros sueltos en fuente/f-*.jpg para revisar antes del video.
// Uso: node scripts/vista.mjs <proyecto> 1s,4s,8s,…
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { armar, casa, renderizar, salir } from './comun.mjs';

try {
  const [p, cuadros] = process.argv.slice(2);
  if (!p || !cuadros) throw new Error('uso: node scripts/vista.mjs <proyecto> 1s,4s,8s');
  const P = casa(p), f = join(P, 'fuente');
  for (const x of readdirSync(f)) if (/^f-.*\.jpg$/.test(x)) rmSync(join(f, x));
  console.log(renderizar([armar(P), join(f, 'f'), '--cuadros', cuadros]).trim().split('\n').slice(-1)[0]);
} catch (e) { salir(e); }
