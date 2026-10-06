#!/usr/bin/env node
/**
 * Exporta cada elemento .slide de un HTML a PNG individual.
 *
 * Uso:
 *   node export.js /ruta/al/carrusel.html
 *   node export.js /ruta/al/carrusel.html --width 1080 --height 1350 --scale 2
 *
 * Outputs: slide-01.png, slide-02.png, ... en la misma carpeta del HTML.
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

// --- Args ---
const args = process.argv.slice(2);
if (args.length === 0 || args[0].startsWith('--')) {
  console.error('Uso: node export.js <ruta-al-html> [--width N] [--height N] [--scale N]');
  process.exit(1);
}

const HTML_FILE = path.resolve(args[0]);
if (!fs.existsSync(HTML_FILE)) {
  console.error(`No existe el archivo: ${HTML_FILE}`);
  process.exit(1);
}

function getArg(name, def) {
  const i = args.indexOf(name);
  return i > -1 && args[i + 1] ? Number(args[i + 1]) : def;
}

const SLIDE_W = getArg('--width', 1080);
const SLIDE_H = getArg('--height', 1350);
const SCALE = getArg('--scale', 2);
const OUTPUT_DIR = path.dirname(HTML_FILE);

// --- Detectar Chrome en macOS ---
// puppeteer-core NO trae navegador: usa el que ya está instalado. Mac, Windows y Linux:
// con solo las rutas de /Applications, en Windows moría diciendo que no hay Chrome aunque sí lo hubiera.
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge',
].filter(Boolean);
const CHROME_PATH = CHROME_CANDIDATES.find(p => { try { return fs.existsSync(p); } catch { return false; } });

if (!CHROME_PATH) {
  console.error('No encontré Google Chrome (ni Edge, Brave o Chromium) en esta computadora.\n' +
    'Instala Google Chrome desde google.com/chrome y vuelve a correr esto.\n' +
    'Si lo tienes en otra carpeta, dime la ruta así:  CHROME_PATH="/ruta/a/chrome" node export.js ...');
  process.exit(1);
}

(async () => {
  console.log(`Launching browser: ${path.basename(CHROME_PATH)}`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: SCALE }
  });

  const page = await browser.newPage();
  await page.goto('file://' + HTML_FILE, { waitUntil: 'networkidle0' });

  // Esperar que Google Fonts terminen de cargar
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1500));

  const slides = await page.$$('.slide');
  console.log(`Found ${slides.length} slides.`);

  if (slides.length === 0) {
    console.error('ERROR: No se encontraron elementos .slide en el HTML.');
    await browser.close();
    process.exit(1);
  }

  for (let i = 0; i < slides.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const filename = path.join(OUTPUT_DIR, `slide-${num}.png`);
    await slides[i].screenshot({ path: filename, omitBackground: false });
    console.log(`✓ slide-${num}.png`);
  }

  await browser.close();
  console.log(`\n✅ ${slides.length} PNGs guardados en:\n${OUTPUT_DIR}`);
})().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
