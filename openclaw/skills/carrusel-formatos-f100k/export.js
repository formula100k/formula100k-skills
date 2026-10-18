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

// --- Detectar el navegador (Mac, Windows o Linux) ---
const os = require('os');
const CASA = os.homedir();
const PF = process.env.PROGRAMFILES || 'C:/Program Files';
const PF86 = process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)';
const CHROME_CANDIDATES = process.platform === 'win32' ? [
  path.join(PF, 'Google/Chrome/Application/chrome.exe'),
  path.join(PF86, 'Google/Chrome/Application/chrome.exe'),
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
  path.join(CASA, 'AppData/Local/Google/Chrome/Application/chrome.exe'),
  path.join(PF86, 'Microsoft/Edge/Application/msedge.exe'),
  path.join(PF, 'Microsoft/Edge/Application/msedge.exe'),
] : process.platform === 'darwin' ? [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  path.join(CASA, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
] : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
const CHROME_PATH = (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) ? process.env.CHROME_PATH : CHROME_CANDIDATES.find(p => p && fs.existsSync(p));

if (!CHROME_PATH) {
  console.error('No se encontró Google Chrome. Instálalo y vuelve a correr esto (o define CHROME_PATH con su ruta).');
  process.exit(1);
}

(async () => {
  console.log(`Launching browser: ${path.basename(CHROME_PATH)}`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: SCALE }
  });

  const page = await browser.newPage();
  await page.goto(require('url').pathToFileURL(HTML_FILE).href, { waitUntil: 'networkidle0' });

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
