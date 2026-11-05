// comun.mjs — el motor de dibujo (núcleo, renderizar.mjs y playwright-core) viene de la skill animacion-dibujada-f100k,
// instalada junto a esta. Aquí también se abre Chrome para leer la pieza o capturar una página.
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chrome } from './sistema.mjs';

export const AQUI = dirname(fileURLToPath(import.meta.url));
const SKILL = join(AQUI, '..');
// Primero JUNTO a esta skill (sirve en ~/.claude/skills y en la carpeta del plugin), después en ~/.claude/skills.
const DIBUJADA = [join(SKILL, '..'), join(homedir(), '.claude', 'skills')].map(b => join(b, 'animacion-dibujada-f100k')).find(d => existsSync(join(d, 'nucleo', 'nucleo.js')));
if (!DIBUJADA) {
  console.error('Falta la skill animacion-dibujada-f100k (se usa su motor de dibujo). Debe estar instalada junto a esta o en ~/.claude/skills.');
  process.exit(1);
}
export const NUCLEO = join(DIBUJADA, 'nucleo', 'nucleo.js');
export const RENDERIZAR = join(DIBUJADA, 'scripts', 'renderizar.mjs');
export const conNucleo = (html, nucleo) => html.replace('<script src="../nucleo/nucleo.js"></script>', () => '<script>\n' + nucleo + '\n</script>');

// Chrome con playwright-core (lo instala `npm install` en animacion-dibujada-f100k).
export async function abrirChrome(opciones = {}) {
  let pw;
  for (const base of [DIBUJADA + '/', process.cwd() + '/']) { try { pw = createRequire(base)('playwright-core'); break; } catch {} }
  if (!pw) { console.error('Falta playwright-core: corre `npm install` en la carpeta de animacion-dibujada-f100k.'); process.exit(1); }
  try { return await pw.chromium.launch({ channel: 'chrome', ...opciones }); }
  catch { const c = chrome(); return pw.chromium.launch({ ...opciones, ...(c ? { executablePath: c } : {}) }); }
}
