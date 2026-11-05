#!/usr/bin/env node
// instalar.mjs — revisa lo que hace falta (Node 18+, ffmpeg, uv, Google Chrome) e instala el motor de render.
// Uso: node scripts/instalar.mjs
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { chrome, INSTALAR } from './sistema.mjs';
import { K } from './comun.mjs';

const win = process.platform === 'win32', como = INSTALAR();
const hay = (cmd, args = ['--version']) => { const r = spawnSync(cmd, args, { encoding: 'utf8', shell: win }); return !r.error && r.status === 0; };
let falta = false;
const fila = (ok, si, no, arreglo) => { console.log(ok ? `✓ ${si}` : `✗ ${no} → ${arreglo}`); if (!ok) falta = true; };
fila(Number(process.versions.node.split('.')[0]) >= 18, `Node ${process.version}`, 'Node 18+', 'https://nodejs.org');
fila(hay('ffmpeg', ['-version']), 'ffmpeg', 'ffmpeg', como.ffmpeg);
fila(hay('uv'), 'uv (para sacar el tiempo de cada palabra)', 'uv (para sacar el tiempo de cada palabra)', como.uv);
fila(!!chrome(), 'Google Chrome', 'Google Chrome', como.chrome);
if (!existsSync(join(K, 'node_modules', 'playwright-core'))) spawnSync('npm', ['install', '--no-audit', '--no-fund', '--silent'], { cwd: K, stdio: 'inherit', shell: win });
fila(existsSync(join(K, 'node_modules', 'playwright-core')), 'motor de render (playwright-core)', 'motor de render', `corre «npm install» dentro de ${K}`);
console.log(falta ? 'Instala lo que falta y vuelve a correr este script.' : 'Todo listo.');
process.exit(falta ? 1 : 0);
