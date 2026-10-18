#!/usr/bin/env node
// Deja listo el motor de montaje (Remotion) dentro de la skill.
//
//   node scripts/preparar.mjs              instala el motor (corre solo al instalar el módulo)
//   node scripts/preparar.mjs --navegador  descarga además el navegador que dibuja cada cuadro
//
// Se puede repetir sin riesgo. El navegador va aparte porque es una descarga
// larga: si no se hace aquí, baja sola en el primer video.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = dirname(dirname(fileURLToPath(import.meta.url)));
const plantilla = join(skill, 'remotion-template');
const win = process.platform === 'win32';
const correr = (cmd, args) => spawnSync(cmd, args, { cwd: plantilla, stdio: 'inherit', shell: win });
const listo = () => existsSync(join(plantilla, 'node_modules', 'remotion')) && existsSync(join(plantilla, 'node_modules', 'tsx'));

if (!listo()) {
  console.log('Editor de video: instalando el motor de montaje (unos minutos la primera vez)...');
  const npm = correr('npm', ['install', '--no-audit', '--no-fund']);
  if (npm.status !== 0 || !listo()) {
    console.error('No pude instalar el motor de montaje. Revisa tu internet y corre de nuevo:');
    console.error(`  node "${join(skill, 'scripts', 'preparar.mjs')}"`);
    process.exit(1);
  }
}
console.log('Editor de video: motor de montaje listo.');

if (process.argv.includes('--navegador')) {
  console.log('Descargando el navegador de montaje (puede tardar varios minutos según tu internet)...');
  const nav = correr('npx', ['remotion', 'browser', 'ensure']);
  if (nav.status !== 0) {
    console.error('El navegador de montaje no terminó de bajar. Corre de nuevo este mismo comando, o deja que baje solo en tu primer video.');
    process.exit(1);
  }
  console.log('Navegador de montaje listo.');
}
