// vistazo.mjs — fotos de la composición en segundos sueltos, SIN renderizar (Chrome headless + el timeline).
// Sirve para revisar láminas y posiciones en segundos antes del render completo (que tarda ~1 min cada 15 s).
// Uso: node vistazo.mjs DEST 0.5 3 6.2 ...      → DEST/revision/vistazo.jpg (una fila con todas) y vistazo-<t>.png
import { createRequire } from 'module';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { execSync } from 'child_process';

const require = createRequire(path.join(execSync('npm root -g', { shell: true }).toString().trim(), 'hyperframes', 'package.json'));
const puppeteer = require('puppeteer-core');
const [dest, ...ts] = process.argv.slice(2);
if (!dest || !ts.length) { console.error('Uso: node vistazo.mjs DEST t1 t2 ...'); process.exit(2); }
const html = path.resolve(dest, 'reel', 'index.html');
const rev = path.resolve(dest, 'revision'); mkdirSync(rev, { recursive: true });
// Google Chrome en Mac o en Windows (manda la variable CHROME si existe)
const enV = (v, ...r) => process.env[v] ? path.join(process.env[v], ...r) : null;
const chrome = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
  enV('PROGRAMFILES', 'Google', 'Chrome', 'Application', 'chrome.exe'), enV('PROGRAMFILES(X86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  enV('LOCALAPPDATA', 'Google', 'Chrome', 'Application', 'chrome.exe'), '/usr/bin/google-chrome'].filter(Boolean).find(existsSync);
if (!chrome) { console.error('No encuentro Google Chrome.'); process.exit(2); }
const b = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1920 });
p.on('pageerror', e => console.error('❌ JS:', e.message));
await p.goto(pathToFileURL(html).href, { waitUntil: 'domcontentloaded', timeout: 180000 });
for (let i = 0; i < 240 && !(await p.evaluate('!!(window.__timelines && window.__timelines.reel)')); i++) await new Promise(r => setTimeout(r, 500));
const fotos = [];
for (const t of ts.map(Number)) {
  await p.evaluate(async t => {
    window.__timelines.reel.seek(t, false);
    const vs = [...document.querySelectorAll('video')];
    await Promise.all(vs.map(v => new Promise(res => {
      const s = parseFloat(v.dataset.start || 0); const tt = Math.max(0, t - s);
      if (v.readyState < 1) { v.addEventListener('loadedmetadata', () => { v.currentTime = tt; }, { once: true }); }
      else v.currentTime = tt;
      v.addEventListener('seeked', () => res(), { once: true }); setTimeout(res, 4000);
    })));
  }, t);
  const f = path.join(rev, `vistazo-${t}.png`);
  await p.screenshot({ path: f }); fotos.push(f);
}
await b.close();
const out = path.join(rev, 'vistazo.jpg');
execSync(`ffmpeg -v error -y ${fotos.map(f => `-i "${f}"`).join(' ')} -filter_complex "${fotos.map((_, i) => `[${i}:v]scale=270:-2[v${i}]`).join(';')};${fotos.map((_, i) => `[v${i}]`).join('')}hstack=${fotos.length}" "${out}"`);
console.log('✅', out);
