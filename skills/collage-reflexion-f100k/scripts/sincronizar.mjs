#!/usr/bin/env node
// sincronizar.mjs — ata cada frase de config.js al segundo en que la voz la dice.
//
//   node sincronizar.mjs <carpeta-de-la-pieza> [audio] [--forzar] [--cola 1.6]
//   node sincronizar.mjs <carpeta-de-la-pieza> --guion     (solo escribe voz/guion.txt con las frases)
//
// 1. Transcribe el audio con marcas por palabra (Whisper local; ver sistema.mjs). Si ya existe <audio>.json más nuevo
//    que el audio, lo reutiliza (--forzar lo vuelve a transcribir).
// 2. Corrige el arranque: Whisper suele pegar la primera palabra al segundo 0 (silencedetect).
// 3. Alinea las palabras del guion con las oídas. Tolera números («ciento sesenta y dos» = «162»),
//    palabras cambiadas y frases en otro orden.
// 4. Escribe <carpeta>/tiempos.js con el inicio y el fin de cada bloque y de cada palabra.
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join, dirname, basename, extname } from 'node:path';
import vm from 'node:vm';
import { transcribir } from './sistema.mjs';

const args = process.argv.slice(2), flag = n => { const i = args.indexOf(n); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const colaArg = flag('--cola'); const forzar = args.includes('--forzar'); if (forzar) args.splice(args.indexOf('--forzar'), 1);
if (!args[0]) { console.error('uso: node sincronizar.mjs <carpeta-de-la-pieza> [audio] [--forzar] [--cola 1.6]'); process.exit(1); }
const dir = resolve(args[0]);
const caja = { window: {} }; vm.runInNewContext(readFileSync(join(dir, 'config.js'), 'utf8'), caja);
const C = caja.window.CONFIG; if (!C || !Array.isArray(C.bloques)) { console.error('config.js no define window.CONFIG.bloques'); process.exit(1); }
if (args.includes('--guion')) { // deja las frases en voz/guion.txt, una por renglón, para grabarlas o generarlas
  mkdirSync(join(dir, 'voz'), { recursive: true }); writeFileSync(join(dir, 'voz/guion.txt'), C.bloques.map(b => b.frase).filter(Boolean).join('\n\n') + '\n');
  console.log('Escrito: ' + join(dir, 'voz/guion.txt')); process.exit(0); }
const audio = resolve(dir, args[1] || C.audio || 'voz/narracion.wav');
if (!existsSync(audio)) { console.error('No encuentro el audio: ' + audio); process.exit(1); }

// ── 1. transcripción ────────────────────────────────────────────
const json = join(dirname(audio), basename(audio, extname(audio)) + '.json');
if (forzar || !existsSync(json) || statSync(json).mtimeMs < statSync(audio).mtimeMs) {
  console.log('Transcribiendo la voz (la primera vez descarga el modelo)…');
  const r = transcribir(audio, { dir: dirname(audio), idioma: 'es' });
  if (!r.ok || !existsSync(json)) { console.error('Falló la transcripción:\n' + String(r.error || '').slice(-800)); process.exit(1); }
} else console.log('Reutilizo la transcripción ' + basename(json));
const oido = JSON.parse(readFileSync(json, 'utf8')).segments.flatMap(s => s.words || []).map(w => ({ raw: w.word.trim(), a: w.start, z: w.end })).filter(w => w.raw);
if (!oido.length) { console.error('La transcripción no trae palabras con tiempo.'); process.exit(1); }

// ── 2. arranque real de la voz ──────────────────────────────────
const sd = spawnSync('ffmpeg', ['-hide_banner', '-i', audio, '-af', 'silencedetect=noise=-35dB:d=0.15', '-f', 'null', '-']).stderr.toString();
const m = sd.match(/silence_start: (-?[\d.]+)[\s\S]*?silence_end: ([\d.]+)/);
if (m && +m[1] < .05 && +m[2] < oido[0].z && +m[2] > oido[0].a) { console.log(`Primera palabra: Whisper dijo ${oido[0].a.toFixed(2)} s, la voz empieza en ${(+m[2]).toFixed(2)} s`); oido[0].a = +m[2]; }
const durAudio = +(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audio]).stdout.toString().trim()) || oido[oido.length - 1].z;

// ── 3. palabras → fichas comparables (los números se unifican a dígitos) ──
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const NUM = { cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300, cuatrocientos: 400, cuatrocientas: 400, quinientos: 500, quinientas: 500, seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700, ochocientos: 800, ochocientas: 800, novecientos: 900, novecientas: 900, mil: 1000 };
const AMBIGUA = new Set(['un', 'uno', 'una']);
// palabras: [{raw, grupo}] → fichas: [{formas:Set, de:[índices], n}]
function fichas(pal) {
  const out = []; let i = 0;
  const corta = k => /[.,;:!?»")]$/.test(pal[k].raw);
  while (i < pal.length) {
    const n = norm(pal[i].raw);
    if (/^\d+$/.test(n)) { let v = n, j = i + 1; if (j < pal.length && norm(pal[j].raw) === 'mil' && pal[j].grupo === pal[i].grupo && !corta(i)) { v = String(+n * 1000); j++; } out.push({ formas: new Set([v]), de: range(i, j), n: v, num: v }); i = j; continue; }
    if (n in NUM) {
      let j = i + 1;
      while (j < pal.length && pal[j].grupo === pal[i].grupo && !corta(j - 1)) {
        const w = norm(pal[j].raw);
        if (w in NUM) { j++; continue; }
        if (w === 'y' && j + 1 < pal.length && NUM[norm(pal[j - 1].raw)] >= 30 && NUM[norm(pal[j - 1].raw)] <= 90 && NUM[norm(pal[j + 1].raw)] >= 1 && NUM[norm(pal[j + 1].raw)] <= 9 && pal[j + 1].grupo === pal[i].grupo) { j += 2; continue; }
        break;
      }
      if (j - i === 1 && AMBIGUA.has(n)) { out.push({ formas: new Set([n]), de: [i], n }); i = j; continue; }
      let tot = 0, cur = 0; for (let k = i; k < j; k++) { const v = NUM[norm(pal[k].raw)]; if (v === undefined) continue; if (v === 1000) { tot += (cur || 1) * 1000; cur = 0; } else cur += v; }
      const v = String(tot + cur), f = new Set([v]); if (j - i === 1) f.add(n);
      out.push({ formas: f, de: range(i, j), n: j - i === 1 ? n : v, num: v }); i = j; continue;
    }
    out.push({ formas: new Set([n]), de: [i], n }); i++;
  }
  return out;
}
function range(a, b) { const r = []; for (let k = a; k < b; k++) r.push(k); return r; }
function lev(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
function parecido(s, h) { for (const f of s.formas) if (h.formas.has(f)) return 2; const L = Math.max(s.n.length, h.n.length); return L > 3 && 1 - lev(s.n, h.n) / L >= .7 ? 1 : -1; }

const guion = []; // todas las palabras del guion, con su bloque
C.bloques.forEach((b, g) => String(b.frase || '').split(/\s+/).forEach(raw => { if (norm(raw)) guion.push({ raw, grupo: g }); }));
if (!guion.length) { console.error('Ningún bloque trae `frase`.'); process.exit(1); }
const S = fichas(guion), Hh = fichas(oido.map(w => ({ raw: w.raw, grupo: 0 })));

// ── alineación global (Needleman-Wunsch) ────────────────────────
const n = S.length, k = Hh.length, G = -1, M = Array.from({ length: n + 1 }, () => new Float32Array(k + 1)), De = Array.from({ length: n + 1 }, () => new Uint8Array(k + 1));
for (let i = 1; i <= n; i++) { M[i][0] = i * G; De[i][0] = 1; } for (let j = 1; j <= k; j++) { M[0][j] = j * G; De[0][j] = 2; }
for (let i = 1; i <= n; i++) for (let j = 1; j <= k; j++) { const d = M[i - 1][j - 1] + parecido(S[i - 1], Hh[j - 1]), u = M[i - 1][j] + G, l = M[i][j - 1] + G; if (d >= u && d >= l) { M[i][j] = d; De[i][j] = 0; } else if (u >= l) { M[i][j] = u; De[i][j] = 1; } else { M[i][j] = l; De[i][j] = 2; } }
for (let i = n, j = k; i > 0 || j > 0;) { const d = De[i][j]; if (i > 0 && j > 0 && d === 0) { const s = S[i - 1], h = Hh[j - 1], p = parecido(s, h); s.h = h; s.exacto = p > 0; i--; j--; } else if (i > 0 && (d === 1 || j === 0)) i--; else j--; }
S.forEach(s => { if (s.h) { s.a = oido[s.h.de[0]].a; s.z = oido[s.h.de[s.h.de.length - 1]].z; } });
// lo que no se oyó se reparte entre sus vecinas
for (let i = 0; i < n; i++) { if (S[i].a != null) continue; let j = i; while (j < n && S[j].a == null) j++;
  const ta = i > 0 ? S[i - 1].z : 0, tz = j < n ? S[j].a : Math.max(ta + .3 * (j - i), oido[oido.length - 1].z), paso = Math.max(0, tz - ta) / (j - i);
  for (let q = i; q < j; q++) { S[q].a = ta + paso * (q - i); S[q].z = S[q].a + paso; S[q].inventado = true; } i = j - 1; }
for (let i = 1; i < n; i++) if (S[i].a < S[i - 1].a) { S[i].a = S[i - 1].a; S[i].z = Math.max(S[i].z, S[i].a); } // nunca hacia atrás

// ── 4. tiempos por bloque ───────────────────────────────────────
const r2 = x => Math.round(x * 100) / 100, ADELANTO = .1;
const porPal = []; S.forEach(s => s.de.forEach((ix, q) => porPal[ix] = { s, primera: q === 0 }));
const bloques = C.bloques.map((b, g) => ({ id: b.id || String(g + 1), tipo: b.tipo, a: null, z: null, palabras: [] }));
guion.forEach((w, ix) => { const { s, primera } = porPal[ix], o = { p: w.raw.replace(/^[«"'(¿¡]+|[»"').,;:!?]+$/g, ''), n: norm(w.raw), a: r2(s.a), z: r2(s.z) }; if (s.num && primera) o.d = s.num; bloques[w.grupo].palabras.push(o); });
const cola = colaArg != null ? +colaArg : (C.cola == null ? 1.6 : C.cola);
const finVoz = Math.max(oido[oido.length - 1].z, S[n - 1].z), dur = r2(finVoz + cola);
let ant = 0; bloques.forEach((b, g) => { b.a = b.palabras.length ? (g === 0 ? 0 : r2(Math.max(ant + .2, b.palabras[0].a - ADELANTO))) : r2(ant + .2); ant = b.a; });
bloques.forEach((b, g) => b.z = g < bloques.length - 1 ? bloques[g + 1].a : dur);

writeFileSync(join(dir, 'tiempos.js'), '// Lo escribe scripts/sincronizar.mjs a partir de la voz. No se edita a mano:\n// para mover una pieza usa `en` en config.js; si cambias el audio o las frases, vuelve a sincronizar.\nwindow.TIEMPOS = ' + JSON.stringify({ audio: basename(audio), durAudio: r2(durAudio), dur, bloques }, null, 1).replace(/\{\n\s+"p": ("[^"]*"),\n\s+"n": ("[^"]*"),\n\s+"a": ([\d.]+),\n\s+"z": ([\d.]+)(?:,\n\s+"d": ("[^"]*"))?\n\s+\}/g, (_, p, nn, a, z, d) => `{"p":${p},"n":${nn},"a":${a},"z":${z}${d ? `,"d":${d}` : ''}}`) + ';\n');

// ── informe ─────────────────────────────────────────────────────
console.log('\nOído: ' + oido.map(w => w.raw).join(' ') + '\n');
let avisos = 0;
bloques.forEach((b, g) => {
  console.log(`${String(b.a.toFixed(2)).padStart(6)} → ${String(b.z.toFixed(2)).padStart(6)}  ${String(g + 1).padStart(2)} · ${b.tipo.padEnd(10)} ${C.bloques[g].frase || '(sin frase)'}`);
  const mias = S.filter(s => guion[s.de[0]].grupo === g), cambiadas = mias.filter(s => s.h && !s.exacto), perdidas = mias.filter(s => s.inventado);
  if (cambiadas.length) { avisos++; console.log('         ⚠ la voz dice otra cosa: ' + cambiadas.map(s => `«${s.de.map(i => guion[i].raw).join(' ')}» → oído «${s.h.de.map(i => oido[i].raw).join(' ')}»`).join(', ')); }
  if (perdidas.length) { avisos++; console.log('         ⚠ no se oyó (tiempo repartido): ' + perdidas.map(s => s.de.map(i => guion[i].raw).join(' ')).join(' ')); }
  if (mias.length && perdidas.length === mias.length) console.log('         ✖ NINGUNA palabra de este bloque se oyó: revisa la frase o el audio');
  if (b.z - b.a < .6) { avisos++; console.log('         ⚠ el bloque dura menos de 0,6 s: no se alcanza a ver'); }
  if (g < bloques.length - 1 && b.z - b.a > 4.5) { avisos++; console.log('         ⚠ el bloque dura más de 4,5 s: pártelo en dos o súmale una pieza a media frase'); }
});
const sobran = Hh.filter(h => !S.some(s => s.h === h));
if (sobran.length) console.log('\n⚠ La voz dice palabras que no están en el guion: ' + sobran.map(h => h.de.map(i => oido[i].raw).join(' ')).join(' · '));
console.log(`\nDuración: voz ${finVoz.toFixed(2)} s + cola ${cola} s = ${dur} s · ${bloques.length} bloques · un recurso cada ${(finVoz / bloques.length).toFixed(1)} s`);
console.log(`Escrito: ${join(dir, 'tiempos.js')}${avisos ? ` (${avisos} avisos arriba)` : ''}`);
