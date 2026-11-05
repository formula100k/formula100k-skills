#!/usr/bin/env node
// bajar-texturas.mjs — baja las texturas de la NASA (dominio público) que usa el ejemplo a <carpeta>/ (normalmente fuente/assets).
// Uso: node bajar-texturas.mjs <carpeta> [--tesela B2]    (la tesela de alta pesa ~50 MB: solo si vas a recortar un parche)
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2), dir = args[0];
if (!dir) { console.error('uso: node bajar-texturas.mjs <carpeta> [--tesela B2]'); process.exit(1); }
const BMNG = 'https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/december/';
const lista = {
  'earth-blue-marble.jpg': 'https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-blue-marble.jpg',
  'earth-topology.png': 'https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-topology.png',
  'tierra-5400.jpg': BMNG + 'world.topo.bathy.200412.3x5400x2700.jpg',
};
const it = args.indexOf('--tesela');
if (it >= 0) lista[`tesela-${args[it + 1]}.jpg`] = BMNG + `world.topo.bathy.200412.3x21600x21600.${args[it + 1]}.jpg`;
mkdirSync(dir, { recursive: true });
for (const [nombre, url] of Object.entries(lista)) {
  const destino = join(dir, nombre);
  if (existsSync(destino)) { console.log(`ya está ${nombre}`); continue; }
  const r = await fetch(url);
  if (!r.ok) { console.error(`No pude bajar ${nombre} (${r.status}): ${url}`); process.exitCode = 1; continue; }
  writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
  console.log(`✓ ${nombre}`);
}
