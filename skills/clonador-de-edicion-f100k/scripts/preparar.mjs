#!/usr/bin/env node
// preparar.mjs — revisa que esté todo para hacer videos y deja lista la skill. Igual en Mac y en Windows.
// Uso: node preparar.mjs
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, INSTALAR } from './sistema.mjs';

const skill = join(dirname(fileURLToPath(import.meta.url)), '..');
const win = process.platform === 'win32';
const hay = (cmd, args = ['-version']) => { const r = spawnSync(cmd, args, { encoding: 'utf8', shell: win }); return !r.error && r.status === 0; };
const como = INSTALAR();
let falta = false;
const fila = (ok, si, no) => { console.log(ok ? `✓ ${si}` : `✗ ${no}`); if (!ok) falta = true; };

fila(Number(process.versions.node.split('.')[0]) >= 18, `Node ${process.version}`, `Node 18 o más nuevo (tienes ${process.version}) · https://nodejs.org`);
fila(hay('ffmpeg') && hay('ffprobe'), 'ffmpeg', `Falta ffmpeg · ${como.ffmpeg}`);
fila(!!chrome(), 'Google Chrome', `Falta Google Chrome · ${como.chrome}`);
console.log(hay('yt-dlp', ['--version']) ? '✓ yt-dlp (para links de redes)' : `· yt-dlp no está: solo hace falta si usas links de Instagram, TikTok o YouTube como referencia (${como['yt-dlp']})`);
if (existsSync(join(skill, 'node_modules', 'playwright-core'))) console.log('✓ playwright-core');
else {
  const r = spawnSync('npm', ['install', '--no-audit', '--no-fund', '--silent'], { cwd: skill, stdio: 'inherit', shell: win });
  fila(r.status === 0, 'playwright-core instalado', `No pude instalar playwright-core: corre «npm install» dentro de ${skill}`);
}
console.log(falta ? 'Instala lo que falta y vuelve a correr este archivo.' : 'Todo listo.');
process.exit(falta ? 1 : 0);
