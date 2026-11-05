// Revisión de layout: abre DEST/reel/index.html en Chrome y lee window.__layout, la lista que arma
// el motor con las piezas que pisan el título o el subtítulo, se salen por los costados o se enciman entre sí.
// Uso: node revisar_layout.mjs DEST        → sale con código 1 si hay choques.
import { createRequire } from 'module';
import { existsSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { execSync } from 'child_process';

const require = createRequire(path.join(execSync('npm root -g', { shell: true }).toString().trim(), 'hyperframes', 'package.json'));
const puppeteer = require('puppeteer-core');

const dest = process.argv[2];
if (!dest) { console.error('Uso: node revisar_layout.mjs DEST'); process.exit(2); }
const html = path.resolve(dest, 'reel', 'index.html');
// Google Chrome en Mac o en Windows (manda la variable CHROME si existe)
const enV = (v, ...r) => process.env[v] ? path.join(process.env[v], ...r) : null;
const chrome = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
  enV('PROGRAMFILES', 'Google', 'Chrome', 'Application', 'chrome.exe'), enV('PROGRAMFILES(X86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  enV('LOCALAPPDATA', 'Google', 'Chrome', 'Application', 'chrome.exe'), '/usr/bin/google-chrome'].filter(Boolean).find(existsSync);
if (!chrome) { console.error('No encuentro Google Chrome.'); process.exit(2); }

const b = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--allow-file-access-from-files'] });
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1920 });
await p.goto(pathToFileURL(html).href, { waitUntil: 'domcontentloaded', timeout: 180000 });   // networkidle0 nunca llega con el video pesado y la máquina cargada
await p.waitForFunction('Array.isArray(window.__layout)', { timeout: 180000 }).catch(() => {});
const av = await p.evaluate('window.__layout');
const cajas = await p.evaluate('(window.__cajas || []).length');
console.log(`· ${cajas} piezas medidas`);
await b.close();

if (!Array.isArray(av)) { console.error('❌ El motor no publicó window.__layout (¿plantilla vieja o error de JS?).'); process.exit(1); }
if (!av.length) { console.log('✅ Layout: nada se encima ni se sale de los márgenes.'); process.exit(0); }
av.forEach(t => console.log('❌ ' + t));
process.exit(1);
