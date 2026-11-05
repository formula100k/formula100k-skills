// comun.mjs — encuentra la skill hermana animacion-dibujada-f100k (núcleo y render).
// Primero junto a esta skill (así viaja en un paquete), después en ~/.claude/skills/.
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const AQUI = dirname(fileURLToPath(import.meta.url));
export function hermana() {
  const nombre = 'animacion-dibujada-f100k';
  const sitios = [resolve(AQUI, '..', '..', nombre), join(homedir(), '.claude', 'skills', nombre)];
  const dir = sitios.find(d => existsSync(join(d, 'nucleo', 'nucleo.js')) && existsSync(join(d, 'scripts', 'renderizar.mjs')));
  if (!dir) {
    console.error(`No encontré la skill «${nombre}», que trae el núcleo y el render.\nLa busqué en:\n  ${sitios.join('\n  ')}\nInstálala junto a esta (viene en el mismo paquete) y vuelve a correr el comando.`);
    process.exit(1);
  }
  return dir;
}
export const MARCA = '<script src="../nucleo/nucleo.js"></script>';
