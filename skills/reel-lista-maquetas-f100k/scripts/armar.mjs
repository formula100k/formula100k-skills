#!/usr/bin/env node
// armar.mjs — junta escenas.json + estilo + maquetas + motor + fuentes en UN html que funciona solo
// (doble clic = vista previa en vivo; renderizar.mjs = video).
// Uso: node armar.mjs <escenas.json> [salida.html] [--tiempos tiempos.json]
//   tiempos.json (lo escribe voz.mjs) trae la duración de cada escena según la voz: [{dur, voz_dur}, ...]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const op = n => { const i = args.indexOf(n); return i < 0 ? undefined : args[i + 1]; };
const [json] = args, salida = args[1] && !args[1].startsWith('--') ? args[1] : join(dirname(resolve(json || '.')), 'pieza.html');
if (!json) { console.error('uso: node armar.mjs <escenas.json> [salida.html] [--tiempos tiempos.json]'); process.exit(1); }

export function armar(escenas, destino, base = dirname(resolve(destino))) {
  const leer = f => readFileSync(join(SKILL, 'motor', f), 'utf8');
  const cuaderno = escenas.estilo === 'cuaderno';
  // íconos con foto o logo real (estilo cuaderno): se incrustan para que el HTML funcione solo
  const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif' };
  for (const it of escenas.items || []) {
    const v = it.icono; if (!v || /^(data:|https?:)/.test(v)) continue;
    const ext = (v.split('.').pop() || '').toLowerCase(); if (!MIME[ext]) continue;
    const f = resolve(base, v); if (!existsSync(f)) { console.warn(`⚠ no encuentro el ícono ${f}`); continue; }
    it.icono = `data:${MIME[ext]};base64,${readFileSync(f).toString('base64')}`;
  }
  const b64 = f => readFileSync(join(SKILL, 'motor/fuentes', f)).toString('base64');
  const fuentes = `@font-face{font-family:'Inter';src:url(data:font/woff2;base64,${b64('Inter-variable.woff2')}) format('woff2');font-weight:100 900;}
@font-face{font-family:'JetBrains Mono';src:url(data:font/woff2;base64,${b64('JetBrainsMono-400.woff2')}) format('woff2');font-weight:400;}
@font-face{font-family:'JetBrains Mono';src:url(data:font/woff2;base64,${b64('JetBrainsMono-700.woff2')}) format('woff2');font-weight:700;}` +
  (cuaderno ? `\n@font-face{font-family:'Instrument Serif';src:url(data:font/woff2;base64,${b64('InstrumentSerif-Italic.woff2')}) format('woff2');font-style:italic;font-weight:400;}` : '');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>reel lista maquetas</title>
<style>${fuentes}\n${leer(cuaderno ? 'cuaderno.css' : 'estilo.css')}</style></head><body><div id="lienzo"></div>
<script>window.ESCENAS = ${JSON.stringify(escenas).replace(/</g, '\\u003c')};</script>
${cuaderno ? `<script>${leer('cuaderno.js')}</script>` : `<script>${leer('maquetas.js')}</script>\n<script>${leer('motor.js')}</script>`}</body></html>`;
  writeFileSync(destino, html);
  return destino;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const escenas = JSON.parse(readFileSync(json, 'utf8'));
  const tiempos = op('--tiempos');
  if (tiempos && existsSync(tiempos)) aplicarTiempos(escenas, JSON.parse(readFileSync(tiempos, 'utf8')));
  console.log('armado -> ' + armar(escenas, salida, dirname(resolve(json))));
}

// mete la duración medida de la voz en cada escena (gancho, items…, cierre: en ese orden)
export function aplicarTiempos(e, t) {
  const lista = [...(e.gancho ? [e.gancho] : []), ...(e.intro ? [e.intro] : []), ...(e.items || []), ...(e.cierre ? [e.cierre] : [])];
  if (t.length !== lista.length) throw new Error(`tiempos.json tiene ${t.length} escenas y escenas.json ${lista.length}`);
  lista.forEach((s, i) => { s.dur = t[i].dur; s.voz_dur = t[i].voz_dur; s.voz_ini = t[i].voz_ini; });
}
