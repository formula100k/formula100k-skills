#!/usr/bin/env node
// Captura REAL de una página (o de un bloque de ella) para usarla de tarjeta «imagen».
//
//   node capturar.mjs <url> <salida.png> [selector] [texto-que-debe-contener] [ancho-css]
//
//   node capturar.mjs https://ejemplo.com/articulo assets/img/cabecera.png
//   node capturar.mjs https://ejemplo.com/articulo assets/img/parrafo.png p "1.8 seconds" 540
//
// Con selector + texto, recorta el primer elemento que contiene ese texto y le pinta el texto en amarillo.
// Con ancho-css, angosta ese bloque para que las letras se lean en el celular.
// Usa Google Chrome por playwright-core (lo instala «node scripts/instalar.mjs» de la skill).
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const req = createRequire(join(dirname(fileURLToPath(import.meta.url)), '../../../package.json'));
const { chromium } = req('playwright-core');
const [url, salida, sel, texto, ancho] = process.argv.slice(2);
if (!url || !salida) { console.error('Uso: node capturar.mjs <url> <salida.png> [selector] [texto] [ancho-css]'); process.exit(1); }
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await b.newPage({ viewport: { width: 1000, height: 1250 }, deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' });
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3000);
// banners de cookies y diálogos fuera
await p.evaluate(() => document.querySelectorAll('#onetrust-consent-sdk,[role=dialog],[id*=cookie],[class*=cookie-banner]').forEach(e => e.remove()));
if (!sel) await p.screenshot({ path: resolve(salida) });
else {
  let el = null;
  for (const e of await p.$$(sel)) if (!texto || (await e.innerText()).includes(texto)) { el = e; break; }
  if (!el) { console.error(`No encontré «${sel}»${texto ? ` con «${texto}»` : ''}`); await b.close(); process.exit(1); }
  await el.evaluate((e, [t, w]) => {
    if (w) { e.style.width = w + 'px'; e.style.maxWidth = w + 'px'; e.style.padding = '18px 22px'; e.style.background = '#fff'; }
    if (t) e.innerHTML = e.innerHTML.replace(t, `<mark style="background:#ffe14d">${t}</mark>`);
  }, [texto, ancho]);
  await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
  await el.screenshot({ path: resolve(salida) });
}
await b.close();
console.log('captura lista →', salida);
