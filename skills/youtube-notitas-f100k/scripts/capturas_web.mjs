// Capturas reales de la web (1440×900) con Chrome sin ventana. Igual en Mac y en Windows.
// uso: node capturas_web.mjs <carpeta-salida> <lista.json>
//   lista.json = [["nombre", "https://www.bing.com/news/search?q=...&setlang=es"], ...]
// Google bloquea el navegador automático («sorry»): usa Bing (news / images) y Wikipedia.
import {createRequire} from 'node:module';
import {existsSync, mkdirSync, readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(aqui, '..', 'plantilla', 'package.json'));
let chromium;
try { ({chromium} = require('playwright-core')); }
catch { console.error('Falta el motor de la skill. Corre: node "' + path.join(aqui, 'preparar.mjs') + '"'); process.exit(1); }

const local = process.env.LOCALAPPDATA || path.join(homedir(), 'AppData', 'Local');
const chrome = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'), '/usr/bin/google-chrome'].filter(Boolean).find(existsSync);
if (!chrome) { console.error('No encontré Google Chrome. Instálalo o indica dónde está con la variable CHROME.'); process.exit(1); }

const [out, lista] = process.argv.slice(2);
if (!out || !lista) { console.error('uso: node capturas_web.mjs <carpeta-salida> <lista.json>'); process.exit(1); }
mkdirSync(out, {recursive: true});
const shots = JSON.parse(readFileSync(lista, 'utf8'));
const b = await chromium.launch({executablePath: chrome, headless: true});
const ctx = await b.newContext({viewport: {width: 1440, height: 900}, locale: 'es-ES',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'});
for (const [n, u] of shots) {
  const p = await ctx.newPage();
  try {
    await p.goto(u, {waitUntil: 'domcontentloaded', timeout: 30000}); await p.waitForTimeout(2500);
    for (const t of ['Aceptar todo', 'Accept all', 'Rechazar todo']) { const btn = p.getByRole('button', {name: t}); if (await btn.count()) { await btn.first().click().catch(() => {}); await p.waitForTimeout(1500); break; } }
    await p.screenshot({path: path.join(out, `${n}.png`)}); console.log('ok', n, p.url().slice(0, 80));
  } catch (e) { console.log('fail', n, e.message.slice(0, 80)); }
  await p.close();
}
await b.close();
