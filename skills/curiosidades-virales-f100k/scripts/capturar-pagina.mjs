#!/usr/bin/env node
// capturar-pagina.mjs — captura una página ENTERA vista en celular (390 px) y la deja como una sola imagen larga,
// lista para que el mockup del cierre baje por ella. Toma tramos de 2000 px y los pega (una captura fullPage de
// más de ~16.000 px sale con partes repetidas, por eso no se usa).
// Uso: node capturar-pagina.mjs <url> <salida.jpg> [ancho final, 560] [alto css máximo, todo]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { abrirChrome } from './comun.mjs';

const [url, salida, ancho = '560', tope] = process.argv.slice(2);
if (!url || !salida) { console.error('uso: node capturar-pagina.mjs <url> <salida.jpg> [ancho] [alto css máximo]'); process.exit(1); }
const b = await abrirChrome();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto(url, { waitUntil: 'networkidle' });
const total = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 400) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(100); }   // carga las imágenes perezosas
const H = Math.min(total, Number(tope) || total), T = 2000, dir = mkdtempSync(join(tmpdir(), 'pag-'));
await p.setViewportSize({ width: 390, height: T });
const tramos = [];
for (let y = 0; y < H; y += T) {
  await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(700);
  await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))));
  const real = await p.evaluate(() => window.scrollY), f = join(dir, `t${tramos.length}.png`);
  await p.screenshot({ path: f });
  tramos.push({ f, desde: (y - real) * 2, alto: Math.min(T, H - y) * 2 });   // si el último tramo no pudo bajar del todo, se recorta
}
await b.close();
mkdirSync(dirname(resolve(salida)), { recursive: true });
const ent = tramos.flatMap(t => ['-i', t.f]);
const recortes = tramos.map((t, i) => `[${i}]crop=780:${t.alto}:0:${t.desde}[c${i}]`).join(';');
const fil = tramos.length > 1 ? `${recortes};${tramos.map((_, i) => `[c${i}]`).join('')}vstack=${tramos.length},scale=${ancho}:-1:flags=lanczos` : `${recortes};[c0]scale=${ancho}:-1:flags=lanczos`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ent, '-filter_complex', fil, '-q:v', '3', salida]);
rmSync(dir, { recursive: true });
console.log(`listo -> ${salida} · ${H} px css de alto en ${tramos.length} tramos`);
