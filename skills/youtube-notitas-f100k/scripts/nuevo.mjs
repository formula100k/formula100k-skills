#!/usr/bin/env node
// Arma la carpeta de render de un proyecto: copia la plantilla a <DEST>/_remotion y le enlaza el motor
// (node_modules de la skill), sin volver a instalar nada. Igual en Mac y en Windows.
// uso: node nuevo.mjs <DEST>
import { cpSync, existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = dirname(dirname(fileURLToPath(import.meta.url)));
const plantilla = join(skill, 'plantilla');
const dest = process.argv[2];
if (!dest) { console.error('uso: node nuevo.mjs <carpeta del proyecto>'); process.exit(1); }
const motor = join(plantilla, 'node_modules');
if (!existsSync(join(motor, 'remotion'))) { console.error(`Falta el motor. Corre: node "${join(skill, 'scripts', 'preparar.mjs')}"`); process.exit(1); }
const r = join(resolve(dest), '_remotion');
mkdirSync(r, { recursive: true });
cpSync(plantilla, r, { recursive: true, force: false, errorOnExist: false, filter: (s) => !/[\\/]node_modules([\\/]|$)/.test(s) });
for (const d of ['public/img', 'public/web', 'public/clips', 'out']) mkdirSync(join(r, d), { recursive: true });
// En Windows un enlace de carpeta «junction» no pide permisos de administrador.
if (!existsSync(join(r, 'node_modules'))) symlinkSync(motor, join(r, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
console.log(`✓ ${r}\n  Ahí van public/cut.mov, public/words.json, public/plan.json (lo escribe plan.py), public/img/, public/web/ y public/clips/.`);
