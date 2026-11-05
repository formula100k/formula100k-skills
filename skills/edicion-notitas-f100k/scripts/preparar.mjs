#!/usr/bin/env node
// Deja listo el motor de render (Remotion) dentro de render/. Corre solo al instalar la skill.
//
//   node scripts/preparar.mjs              instala el motor
//   node scripts/preparar.mjs --navegador  descarga además el navegador que dibuja cada cuadro
//
// Se puede repetir sin riesgo. Igual en Mac y en Windows.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = dirname(dirname(fileURLToPath(import.meta.url)));
const render = join(skill, 'render');
const win = process.platform === 'win32';
const correr = (cmd, args) => spawnSync(cmd, args, { cwd: render, stdio: 'inherit', shell: win });
const listo = () => ['remotion', 'tsx', 'puppeteer-core'].every((m) => existsSync(join(render, 'node_modules', m)));

if (!listo()) {
  console.log('Edición notitas: instalando el motor de render (unos minutos la primera vez)...');
  const npm = correr('npm', ['install', '--no-audit', '--no-fund']);
  if (npm.status !== 0 || !listo()) {
    console.error('No pude instalar el motor de render. Revisa tu internet y corre de nuevo:');
    console.error(`  node "${join(skill, 'scripts', 'preparar.mjs')}"`);
    process.exit(1);
  }
}
console.log('Edición notitas: motor de render listo.');

if (process.argv.includes('--navegador')) {
  console.log('Descargando el navegador de render (puede tardar varios minutos)...');
  const nav = correr('npx', ['remotion', 'browser', 'ensure']);
  if (nav.status !== 0) {
    console.error('El navegador no terminó de bajar. Corre de nuevo este comando, o deja que baje solo en el primer render.');
    process.exit(1);
  }
  console.log('Navegador listo.');
}
