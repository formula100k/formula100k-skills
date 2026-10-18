#!/usr/bin/env node
// Convierte un HTML en PNG con el Google Chrome de la compu. Corre igual en Mac y en Windows.
//   node capturar.mjs <archivo.html> [salida.png] [--ancho=1080] [--alto=1350]
//   node capturar.mjs <carpeta>      → un PNG por cada .html de la carpeta
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const libres = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const opcion = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? Number(a.split('=')[1]) : d; };
if (!libres[0]) { console.error('Uso: node capturar.mjs <archivo.html | carpeta> [salida.png] [--ancho=1080] [--alto=1350]'); process.exit(1); }

const candidatos = process.platform === 'win32'
  ? [join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'),
    join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Google/Chrome/Application/chrome.exe'),
    join(homedir(), 'AppData/Local/Google/Chrome/Application/chrome.exe'),
    join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Microsoft/Edge/Application/msedge.exe')]
  : process.platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', join(homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
      '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
    : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
const chrome = process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : candidatos.find((p) => existsSync(p));
if (!chrome) { console.error('No encontré Google Chrome. Instálalo y vuelve a correr esto (o define CHROME_PATH con su ruta).'); process.exit(1); }

const entrada = resolve(libres[0]);
if (!existsSync(entrada)) { console.error(`No existe: ${entrada}`); process.exit(1); }
const pares = statSync(entrada).isDirectory()
  ? readdirSync(entrada).filter((n) => n.toLowerCase().endsWith('.html')).sort().map((n) => [join(entrada, n), join(entrada, n.replace(/\.html$/i, '.png'))])
  : [[entrada, resolve(libres[1] || entrada.replace(/\.html$/i, '.png'))]];
if (!pares.length) { console.error(`No hay archivos .html en ${entrada}`); process.exit(1); }

const ancho = opcion('ancho', 1080), alto = opcion('alto', 1350);
let fallos = 0;
for (const [html, png] of pares) {
  const r = spawnSync(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--window-size=${ancho},${alto}`, `--screenshot=${png}`, pathToFileURL(html).href], { encoding: 'utf8' });
  if (r.status === 0 && existsSync(png)) console.log(`✓ ${png}`);
  else { fallos++; console.error(`✗ ${html}\n${(r.stderr || r.error?.message || '').split('\n').slice(-3).join('\n')}`); }
}
process.exit(fallos ? 1 : 0);
