// comun.mjs — el motor de dibujo (núcleo + renderizar.mjs) viene de la skill animacion-dibujada-f100k, instalada junto a esta.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const AQUI = dirname(fileURLToPath(import.meta.url));
const SKILL = join(AQUI, '..');
// Primero JUNTO a esta skill (sirve en ~/.claude/skills y en la carpeta del plugin), después en ~/.claude/skills.
const hermana = (...resto) => [join(SKILL, '..'), join(homedir(), '.claude', 'skills')].map(b => join(b, 'animacion-dibujada-f100k', ...resto)).find(existsSync);
export const NUCLEO = hermana('nucleo', 'nucleo.js');
export const RENDERIZAR = hermana('scripts', 'renderizar.mjs');
if (!NUCLEO || !RENDERIZAR) {
  console.error('Falta la skill animacion-dibujada-f100k (se usa su motor de dibujo). Debe estar instalada junto a esta o en ~/.claude/skills.');
  process.exit(1);
}
export const conNucleo = (html, nucleo) => html.replace('<script src="../nucleo/nucleo.js"></script>', () => '<script>\n' + nucleo + '\n</script>');
