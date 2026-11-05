// Dónde está Google Chrome en esta compu (Mac o Windows). Manda la variable CHROME si existe.
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function chrome() {
  const local = process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local');
  const rutas = [
    process.env.CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    join(homedir(), 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium',
  ];
  const c = rutas.filter(Boolean).find(existsSync);
  if (!c) {
    const como = process.platform === 'win32' ? 'winget install -e --id Google.Chrome' : 'brew install --cask google-chrome';
    throw new Error(`No encontré Google Chrome. Instálalo (${como}) o indica dónde está con la variable CHROME.`);
  }
  return c;
}
