// capturar_perfil.mjs — captura real de un perfil público de Instagram (vista de celular, modo oscuro, sin el aviso de «abre la app»).
// Uso:  node capturar_perfil.mjs <usuario> <DEST/reel/assets>
// Deja: perfil.png (pantalla de celular desde el encabezado, para la pieza telefono) y bio.png (solo la bio, para captura).
// Usa el puppeteer-core de hyperframes y el Chrome instalado. Igual en Mac y en Windows.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { chrome, puppeteer } from './navegador.mjs';

const [usuario, out] = process.argv.slice(2);
if (!usuario || !out) { console.error('Uso: node capturar_perfil.mjs <usuario> <carpeta>'); process.exit(1); }
const limpiar = () => {
  document.querySelectorAll('[role="dialog"], [role="presentation"]').forEach(e => e.remove());
  document.querySelectorAll('div').forEach(d => { const s = getComputedStyle(d), r = d.getBoundingClientRect();
    if (s.position === 'fixed' && (r.top > 60 || r.height > innerHeight * 0.7)) d.remove(); });
  document.body.style.overflow = 'auto'; document.documentElement.style.overflow = 'auto';
};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(out, { recursive: true });
const b = await puppeteer().launch({ executablePath: chrome(), headless: true });
const p = await b.newPage();
await p.setViewport({ width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await p.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
await p.setExtraHTTPHeaders({ 'Accept-Language': 'es-419,es;q=0.9' });
await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
await p.goto(`https://www.instagram.com/${usuario.replace(/^@/, '')}/`, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
await espera(7000);          // la grilla tarda; si se limpia antes, queda la ruedita
await p.evaluate(limpiar);
await espera(5000);
await p.evaluate(limpiar);
const full = path.join(out, '_perfil_completo.png');
await p.screenshot({ path: full });
// la bio: el bloque de texto entre el encabezado y las pestañas
const caja = await p.evaluate(() => {
  const tabs = [...document.querySelectorAll('a[href$="/reels/"], a[href*="/reels"], svg[aria-label="Reels"]')].map(e => e.getBoundingClientRect().top).filter(t => t > 200)[0];
  // en la vista de celular (430 px) la foto de perfil termina en y≈180: la bio empieza ahí; termina en las pestañas
  const top = 182;
  return { top, bottom: tabs ? tabs - 14 : top + 180 };
});
await b.close();
const k = 3, y0 = Math.round(caja.top * k), h = Math.round((caja.bottom - caja.top) * k);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', full, '-vf', 'crop=1290:2636:0:160', path.join(out, 'perfil.png')]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', full, '-vf', `crop=1240:${h}:40:${y0}`, path.join(out, 'bio.png')]);
console.log(`✅ ${path.join(out, 'perfil.png')}\n✅ ${path.join(out, 'bio.png')}  (míralas: si la bio salió corrida, recórtala a mano)`);
