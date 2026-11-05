// Revisión de layout: abre DEST/reel/index.html en Chrome y lee window.__layout, la lista que arma
// el motor con las piezas que pisan el título o el subtítulo, se salen por los costados o se enciman entre sí.
// Uso: node revisar_layout.mjs DEST        → sale con código 1 si hay choques. Igual en Mac y en Windows.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chrome, puppeteer } from './navegador.mjs';

const dest = process.argv[2];
if (!dest) { console.error('Uso: node revisar_layout.mjs DEST'); process.exit(2); }
const html = path.resolve(dest, 'reel', 'index.html');
let nav;
try { nav = { pp: puppeteer(), exe: chrome() }; } catch (e) { console.error(e.message); process.exit(2); }

const b = await nav.pp.launch({ executablePath: nav.exe, headless: true, args: ['--allow-file-access-from-files'] });
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1920 });
await p.goto(pathToFileURL(html).href, { waitUntil: 'domcontentloaded', timeout: 180000 });   // networkidle0 nunca llega con el video pesado
await p.waitForFunction('Array.isArray(window.__layout)', { timeout: 180000 }).catch(() => {});
const av = await p.evaluate('window.__layout');
const cajas = await p.evaluate('(window.__cajas || []).length');
console.log(`· ${cajas} piezas medidas`);
await b.close();

if (!Array.isArray(av)) { console.error('❌ El motor no publicó window.__layout (¿plantilla vieja o error de JS?).'); process.exit(1); }
if (!av.length) { console.log('✅ Layout: nada se encima ni se sale de los márgenes.'); process.exit(0); }
av.forEach(t => console.log('❌ ' + t));
process.exit(1);
