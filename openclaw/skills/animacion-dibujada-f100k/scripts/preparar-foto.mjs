#!/usr/bin/env node
// preparar-foto.mjs — deja lista una foto (o un dibujo) para animarla: la achica, la recorta del fondo
// y busca la cara. Todo local y gratis. En Mac usa sips y Vision; en Windows, ffmpeg, rembg y OpenCV (ver sistema.mjs).
//
// Uso: node preparar-foto.mjs <foto> <carpeta-salida> [--sin-recorte]
// Deja en la carpeta:
//   <nombre>-recorte.png   la persona/objeto con fondo transparente (o la foto achicada si no hubo sujeto)
//   <nombre>-cara.json     cara, ojos y boca en pixeles del recorte (cara: null si no hay cara)
// --sin-recorte: para un PNG que YA viene transparente (un personaje de marca, un dibujo): solo busca la cara.
//
// Si no le encuentra cara (pasa con mascotas y dibujos), escribe tú los ojos y la boca en el JSON:
//   { "ojoIzq": [x, y], "ojoDer": [x, y], "ojoAncho": 30, "boca": [x, y], "bocaAncho": 40, "bocaAlto": 14, "piel": "#f3c9a0" }
import { mkdirSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { medirImagen, achicarImagen, recortarPersona, buscarCara } from './sistema.mjs';

const args = process.argv.slice(2);
const [foto, salida] = args.filter(a => !a.startsWith('--'));
const sinRecorte = args.includes('--sin-recorte');
if (!foto || !salida) { console.error('uso: node preparar-foto.mjs <foto> <carpeta-salida> [--sin-recorte]'); process.exit(1); }
if (!existsSync(foto)) { console.error('No existe la foto: ' + foto); process.exit(1); }
mkdirSync(salida, { recursive: true });
const nombre = basename(foto, extname(foto)).replace(/[^\w-]+/g, '-');
const tmp = mkdtempSync(join(tmpdir(), 'foto-'));
const chica = join(tmp, nombre + (sinRecorte ? '.png' : '.jpg'));
const recorte = resolve(salida, nombre + '-recorte.png');
const caraJson = resolve(salida, nombre + '-cara.json');

// 1. achicar (1600 px del lado largo: sobra para 1080x1920 y el recorte va más rápido). Nunca agranda.
try { medirImagen(foto); achicarImagen(foto, chica, 1600); } catch (e) { console.error(e.message); process.exit(1); }

// 2. recortar del fondo
let hayRecorte = false;
if (sinRecorte) { achicarImagen(chica, recorte, 1600); hayRecorte = true; }
else {
  const r = recortarPersona(chica, recorte);
  if (r.ok) { console.log(r.mensaje); hayRecorte = true; }
  else {
    console.warn('⚠ No hubo recorte: ' + (r.mensaje || '').trim().split('\n').pop());
    console.warn('  Sigo con la foto entera (sin fondo transparente).');
    achicarImagen(chica, recorte, 1600);
  }
}

// 3. cara, ojos y boca sobre el recorte
let cara = null;
try { cara = buscarCara(recorte); }
catch (e) { console.warn('⚠ No pude buscar la cara: ' + (e.message + '').trim().split('\n').pop()); }
if (!cara) cara = { cara: null };
if (!cara.cara) console.warn('⚠ No encontré una cara. Si es un personaje o un dibujo, escribe a mano ojoIzq, ojoDer, boca… en ' + caraJson);
writeFileSync(caraJson, JSON.stringify(cara, (k, v) => typeof v === 'number' ? Math.round(v * 10) / 10 : v));
rmSync(tmp, { recursive: true, force: true });
console.log(`listo: ${hayRecorte ? 'recorte' : 'foto'} -> ${recorte}`);
console.log(`      cara  -> ${caraJson}${cara.cara ? '' : ' (sin cara)'}`);
