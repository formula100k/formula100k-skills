// Piezas compartidas: puppeteer-core (viene con hyperframes, que se instala global) y la ruta de Google Chrome.
// Igual en Mac y en Windows. Manda la variable CHROME si existe.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function puppeteer() {
  const raiz = execSync('npm root -g', { encoding: 'utf8' }).trim();
  for (const base of [join(raiz, 'hyperframes', 'package.json'), join(raiz, 'package.json')]) {
    try { return createRequire(base)('puppeteer-core'); } catch { /* sigue */ }
  }
  throw new Error('Falta hyperframes (trae el navegador automático). Instálalo con: npm i -g hyperframes');
}

export function chrome() {
  const local = process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local');
  const c = [
    process.env.CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/usr/bin/google-chrome', '/usr/bin/chromium',
  ].filter(Boolean).find(existsSync);
  if (!c) throw new Error(`No encontré Google Chrome. Instálalo (${process.platform === 'win32' ? 'winget install -e --id Google.Chrome' : 'brew install --cask google-chrome'}) o indica dónde está con la variable CHROME.`);
  return c;
}
