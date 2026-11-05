// comun.mjs — lo que comparten armar.mjs, voz.mjs, render.mjs y cuadros.mjs.
// El motor de dibujo (núcleo + renderizar.mjs) viene de la skill animacion-dibujada-f100k, instalada junto a esta.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const AQUI = dirname(fileURLToPath(import.meta.url));
export const SKILL = join(AQUI, '..');
// Primero JUNTO a esta skill (sirve en ~/.claude/skills y en la carpeta del plugin), después en ~/.claude/skills.
const hermana = (...resto) => [join(SKILL, '..'), join(homedir(), '.claude', 'skills')].map(b => join(b, 'animacion-dibujada-f100k', ...resto)).find(existsSync);
export const NUCLEO = hermana('nucleo', 'nucleo.js');
export const RENDERIZAR = hermana('scripts', 'renderizar.mjs');
if (!NUCLEO || !RENDERIZAR) {
  console.error('Falta la skill animacion-dibujada-f100k (se usa su motor de dibujo). Debe estar instalada junto a esta o en ~/.claude/skills.');
  process.exit(1);
}
export const sh = (cmd, args, opt = {}) => (execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 1 << 28, ...opt }) ?? '').toString();
export const duracion = f => +sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim();
export const dos = n => String(n).padStart(2, '0');
