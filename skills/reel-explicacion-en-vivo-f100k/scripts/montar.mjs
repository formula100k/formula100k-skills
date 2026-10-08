#!/usr/bin/env node
// montar.mjs — monta el reel con las tomas reales: una toma por bloque.
//
//   node montar.mjs <carpeta>                 todo: oye las tomas, ajusta los paneles a la voz, monta y saca las hojas de revisión
//   node montar.mjs <carpeta> --solo-medir    solo transcribe y muestra dónde cae cada frase (revísalo antes de montar)
//
//   --tomas=DIR        donde están toma-1, toma-2… (.mov, .mp4 o .m4v)          [<carpeta>/tomas]
//   --salida=MP4       archivo final                                             [<carpeta>/reel.mp4]
//   --y=0.15           de dónde sale el cuadrado de la toma: 0 = pegado arriba, 1 = pegado abajo (también en guion.json: bloque.toma.y)
//   --y3=0.3           lo mismo, solo para la toma 3
//   --idioma=es        idioma de la voz
//   --retranscribir    vuelve a oír las tomas aunque ya haya transcripción guardada
//
// Qué hace: 1) transcribe cada toma con marcas por palabra, 2) busca dónde empieza cada frase del guion, 3) calcula la
// duración real de cada frase y rehace las cuatro capas (panel, mate, encima y su transparencia) con esos tiempos,
// 4) pone la toma en la tarjeta (o a pantalla completa en las frases con "encuadre": "completa"), con subtítulos de 1 a 3
// palabras calzados a la voz, 5) une los bloques, normaliza el audio y saca la hoja de contacto y los cuadros de cada
// cambio de encuadre. Si una frase no aparece, se detiene y dice cuál: se corrige a mano en
// <tomas>/tiempos-manual.json  →  { "3": [0.42, 1.9, 5.1, 8.0] }  (el segundo en que empieza cada frase de la toma 3).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { sh, dur, arg, carpetaDe, leerGuion, frasesDe, lineaDeTiempo, tramosDeBloque, armar, renderizar, hojaDeContacto, cuadrosDeTransicion, FPS } from './comun.mjs';

const DIR = carpetaDe(), G = leerGuion(DIR), F = frasesDe(G).map((f, i) => ({ ...f, i }));
const TOMAS = resolve(arg('tomas', join(DIR, 'tomas'))), SALIDA = resolve(arg('salida', join(DIR, 'reel.mp4')));
const T = join(DIR, 'trabajo'), TR = join(T, 'transcripcion'); mkdirSync(TR, { recursive: true });
const ENTRADA = .1;                                   // el panel arranca este rato antes de la primera palabra
const TJ = { x: 60, y: 890, w: 960, h: 960, r: 44, ...(G.tarjeta || {}) };
if (!existsSync(TOMAS)) { console.error('No encontré la carpeta de tomas: ' + TOMAS); process.exit(1); }
const manual = existsSync(join(TOMAS, 'tiempos-manual.json')) ? JSON.parse(readFileSync(join(TOMAS, 'tiempos-manual.json'), 'utf8')) : {};

// ---------- palabras comparables: sin acentos ni signos, y los números siempre en cifras ----------
// Whisper escribe «168» donde el guion dice «ciento sesenta y ocho»: las dos formas se llevan a la misma.
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const UNI = { cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiun: 21, veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29 };
const DEC = { treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90 };
const CEN = { cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500, seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900 };
for (const k of Object.keys(CEN)) if (k.endsWith('os')) CEN[k.slice(0, -2) + 'as'] = CEN[k];
function enCifras(W) {      // W = [{p, a, z}] → igual, con cada número dicho en palabras convertido en una sola ficha de cifras
  const out = []; let i = 0;
  const menorDeMil = () => { let n = 0, hubo = false;
    if (W[i] && W[i].p in CEN) { n += CEN[W[i].p]; i++; hubo = true; }
    if (W[i] && W[i].p in DEC) { n += DEC[W[i].p]; i++; hubo = true; if (W[i] && W[i].p === 'y' && W[i + 1] && UNI[W[i + 1].p] >= 1 && UNI[W[i + 1].p] <= 9) { n += UNI[W[i + 1].p]; i += 2; } }
    else if (W[i] && W[i].p in UNI) { n += UNI[W[i].p]; i++; hubo = true; }
    return hubo ? n : null; };
  while (i < W.length) { const i0 = i; let n = menorDeMil();
    if (W[i] && W[i].p === 'mil') { i++; const r = menorDeMil(); n = (n ?? 1) * 1000 + (r ?? 0); }
    if (n == null) { out.push(W[i]); i++; } else out.push({ ...W[i0], p: String(n), z: W[i - 1].z }); }
  return out;
}
const fichas = txt => enCifras(txt.split(/\s+/).map(x => ({ p: norm(x), a: 0, z: 0 })).filter(w => w.p)).map(w => w.p);

// ---------- 1 y 2: oír cada toma y ubicar cada frase ----------
const tomas = [];
G.bloques.forEach((bl, b) => {
  const archivo = readdirSync(TOMAS).find(f => new RegExp(`^toma-0?${b + 1}\\.(mov|mp4|m4v)$`, 'i').test(f));
  if (!archivo) { console.error(`Falta la toma ${b + 1} (${bl.nombre}): ${TOMAS}/toma-${b + 1}.mov`); process.exit(1); }
  const video = join(TOMAS, archivo), wav = join(TR, `toma-${b + 1}.wav`), json = join(TR, `toma-${b + 1}.json`);
  sh('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vn', '-ac', '1', '-ar', '16000', wav]);
  if (!existsSync(json) || arg('retranscribir')) {
    const r = spawnSync('uvx', ['--from', 'mlx-whisper', 'mlx_whisper', wav, '--model', 'mlx-community/whisper-large-v3-turbo', '--language', String(arg('idioma', 'es')),
      '--word-timestamps', 'True', '--output-format', 'json', '--output-dir', TR], { stdio: ['ignore', 'ignore', 'pipe'] });
    if (r.status !== 0 || !existsSync(json)) { console.error('No pude transcribir ' + archivo + '. Hace falta `uvx` (brew install uv) en una Mac con Apple Silicon.\n' +
      'Alternativa: escribe a mano el segundo en que empieza cada frase en ' + join(TOMAS, 'tiempos-manual.json') + '\n' + (r.stderr || '').toString().slice(-600)); if (!manual[b + 1]) process.exit(1); }
  }
  const crudas = existsSync(json) ? JSON.parse(readFileSync(json, 'utf8')).segments.flatMap(s => s.words || []).map(w => ({ p: norm(w.word), crudo: w.word.trim(), a: w.start, z: w.end })).filter(w => w.p) : [];
  const W = enCifras(crudas), frases = F.filter(f => f.b === b), aviso = []; let ini = [];
  if (manual[b + 1]) { ini = manual[b + 1]; if (ini.length !== frases.length) { console.error(`tiempos-manual.json: la toma ${b + 1} tiene ${frases.length} frases y pusiste ${ini.length} tiempos.`); process.exit(1); } }
  else {
    if (!W.length) { console.error(`En la toma ${b + 1} no se oye ninguna palabra.`); process.exit(1); }
    let j = 0;
    frases.forEach((f, k) => {
      const pal = fichas(f.txt);
      if (k === 0) {   // Whisper suele pegar la primera palabra al segundo 0: se corrige con el fin del silencio inicial
        const m = spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', 'silencedetect=noise=-35dB:d=0.15', '-f', 'null', '-']).stderr.toString().match(/silence_start: (-?[\d.]+)[\s\S]*?silence_end: ([\d.]+)/);
        const voz = m && +m[1] < .05 && +m[2] < W[0].z ? +m[2] : 0;
        ini.push(Math.max(W[0].a, voz)); return; }
      const desde = j + Math.max(1, Math.floor(fichas(frases[k - 1].txt).length * .5));
      let hit = -1, t0 = NaN;
      for (let x = desde; x < W.length && hit < 0; x++) if (W[x].p === pal[0] && (pal.length < 2 || !W[x + 1] || W[x + 1].p === pal[1] || (W[x + 2] && W[x + 2].p === pal[1]))) { hit = x; t0 = W[x].a; }
      for (let x = desde; x < W.length && hit < 0; x++) if (W[x].p === pal[0]) { hit = x; t0 = W[x].a; aviso.push(`frase ${k + 1} ubicada solo por su primera palabra`); }
      for (let x = desde + 1; x < W.length && hit < 0 && pal.length > 2; x++) if (W[x].p === pal[1] && W[x + 1] && W[x + 1].p === pal[2]) { hit = x; t0 = W[x - 1].a; aviso.push(`frase ${k + 1} ubicada por su segunda palabra (la primera se oyó distinta: «${W[x - 1].crudo || W[x - 1].p}»)`); }
      if (hit < 0) { aviso.push(`NO ENCONTRÉ la frase ${k + 1}: «${f.txt}»`); ini.push(NaN); return; }
      j = hit; ini.push(t0);
    });
  }
  const finVoz = W.length ? W[W.length - 1].z : dur(video) - .3;
  tomas.push({ b, n: b + 1, video, frases, ini, finVoz, W, aviso });
  console.log(`\nToma ${b + 1} · ${bl.nombre} · ${archivo} (${dur(video).toFixed(1)} s)`);
  if (crudas.length) console.log('  oído: ' + crudas.map(w => w.crudo).join(' '));
  frases.forEach((f, k) => console.log(`  ${isNaN(ini[k]) ? '    ¿?' : ini[k].toFixed(2).padStart(6)}  ${f.txt}`));
  aviso.forEach(a => console.log('  ⚠ ' + a));
});
if (tomas.some(t => t.ini.some(isNaN))) { console.error('\nHay frases sin ubicar. Pon sus segundos en ' + join(TOMAS, 'tiempos-manual.json') + ' y vuelve a correr.'); process.exit(1); }

// la duración real de cada frase, en el modelo de la pieza: inicio(k+1) = inicio(k) + d(k) + pausa
const PAUSA = { pausa: .3, ...(G.ritmo || {}) }.pausa, d = [];
for (const t of tomas) {
  t.corte = Math.max(0, t.ini[0] - ENTRADA);         // segundo de la toma donde empieza el bloque
  t.frases.forEach((f, k) => { let x = k < t.frases.length - 1 ? t.ini[k + 1] - t.ini[k] - PAUSA : t.finVoz - t.ini[k] + .1; if (k === 0) x += t.ini[0] - t.corte; d[f.i] = +Math.max(.4, x).toFixed(3); });
}
const TL = lineaDeTiempo(G, d), largo = b => TL.FIN_B[b] - TL.INI_B[b];
console.log('\nDuración de cada bloque con tu voz: ' + G.bloques.map((bl, b) => `${bl.nombre} ${largo(b).toFixed(1)} s`).join(' · ') + ` · total ${TL.TOTAL.toFixed(1)} s`);
writeFileSync(join(T, 'tiempos.json'), JSON.stringify(tomas.map(t => ({ toma: t.n, inicio_de_cada_frase: t.ini, corte: t.corte, d: t.frases.map(f => d[f.i]) })), null, 1));
if (arg('solo-medir')) process.exit(0);

// ---------- subtítulos desde la voz: cada grupo de 1 a 3 palabras empieza con la palabra que se oyó ----------
const grupos = txt => { const gr = []; let a = []; for (const p of txt.split(' ')) { a.push(p); const j = a.join(' '); if (a.length >= 3 || j.length >= 13 || /[.,:?]$/.test(p)) { gr.push(j); a = []; } } if (a.length) gr.push(a.join(' ')); return gr; };
const subs = [];
for (const t of tomas) {
  const aGlobal = x => +(TL.INI_B[t.b] + x - t.corte).toFixed(3), mios = [];
  t.frases.forEach((f, k) => {
    const a0 = t.ini[k], z0 = k < t.frases.length - 1 ? t.ini[k + 1] : t.finVoz + .15;
    const oidas = t.W.filter(w => w.a >= a0 - .01 && w.a < z0 - .01), pals = f.txt.split(' ');
    // cada palabra del guion → el momento en que se oyó (los números ya van en cifras en los dos lados)
    const fich = enCifras(pals.map((x, q) => ({ p: norm(x), q, a: 0, z: 0 })).filter(w => w.p)).map(w => ({ p: w.p, q: w.q, a: NaN }));
    let j = 0; for (const w of fich) for (let x = j; x < Math.min(oidas.length, j + 4); x++) if (oidas[x].p === w.p) { w.a = oidas[x].a; j = x + 1; break; }
    if (fich.length) fich[0].a = a0;
    fich.forEach((w, i) => { if (!isNaN(w.a)) return; let u = i - 1, v = i + 1; while (v < fich.length && isNaN(fich[v].a)) v++;      // la que no se oyó igual: entre sus vecinas
      const ta = fich[u].a, tb = v < fich.length ? fich[v].a : Math.min(z0, (oidas.length ? oidas[oidas.length - 1].z : z0)); w.a = ta + (tb - ta) / (v - u); });
    const cuando = q => { let i = fich.findLastIndex(w => w.q <= q); if (i < 0) return a0; const w = fich[i], sig = fich[i + 1], q1 = sig ? sig.q : pals.length, fin = sig ? sig.a : Math.min(z0, w.a + .6);
      return w.a + (fin - w.a) * (q - w.q) / Math.max(1, q1 - w.q); };                                                      // una palabra en medio de un número dicho de corrido
    let visto = 0;
    grupos(f.txt).forEach((g, gi) => { mios.push({ a: gi === 0 ? a0 : Math.max(a0, cuando(visto)), s: g.replace(/[.,:]$/, '') }); visto += g.split(' ').length; });
    mios.push({ a: Math.min(z0, (oidas.length ? oidas[oidas.length - 1].z : z0) + .25), s: '' });
  });
  mios.forEach((o, i) => { const z = mios[i + 1] ? mios[i + 1].a : t.corte + largo(t.b); if (o.s && z > o.a + .04) subs.push({ a: aGlobal(o.a), z: aGlobal(z), s: o.s }); });
}
TL.subs = subs;

// ---------- cómo cae cada toma en el cuadro (tarjeta y pantalla completa) ----------
function medidas(video) {
  const s = JSON.parse(sh('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:stream_side_data=rotation:stream_tags=rotate', '-of', 'json', video])).streams[0];
  const rot = Math.abs(+((s.side_data_list || []).find(x => x.rotation != null)?.rotation ?? s.tags?.rotate ?? 0));
  return rot % 180 === 90 ? { w: s.height, h: s.width } : { w: s.width, h: s.height };
}
for (const t of tomas) {
  const o = { y: .15, x: .5, zoom: 1, yCompleta: .5, xCompleta: .5, zoomCompleta: 1, ...(G.bloques[t.b].toma || {}) };
  if (arg('y') !== undefined) o.y = +arg('y'); if (arg('y' + t.n) !== undefined) o.y = +arg('y' + t.n);
  const { w, h } = medidas(t.video), cw = Math.min(w, h * TJ.w / TJ.h) / o.zoom, ch = cw * TJ.h / TJ.w, sc = TJ.w / cw, sf = Math.max(1080 / w, 1920 / h) * o.zoomCompleta;
  t.geo = { w, h, cw, ch, cx: (w - cw) * o.x, cy: (h - ch) * o.y, sc, oxc: TJ.x - (w - cw) * o.x * sc, oyc: TJ.y - (h - ch) * o.y * sc, sf, oxf: (1080 - w * sf) * o.xCompleta, oyf: (1920 - h * sf) * o.yCompleta };
  t.mosaico = o.mosaico ?? (t.ini[1] ?? t.ini[0] + .5);
}

// ---------- mosaico con las tomas: un cuadro (o un clip mudo corto) de cada una ----------
const mosaicos = F.filter(f => f.panel && f.panel.tipo === 'mosaico' && f.panel.tomas);
if (mosaicos.length) {
  const M = join(T, 'mosaico'); rmSync(M, { recursive: true, force: true }); mkdirSync(M, { recursive: true }); TL.fotos = {};
  const clip = mosaicos.some(f => f.panel.tomas === 'clip'), pide = new Set(mosaicos.flatMap(f => (f.panel.celdas || []).map(c => G.bloques.findIndex(x => x.nombre === c.bloque))).filter(b => b >= 0));
  for (const b of pide) { const t = tomas[b], g = t.geo, seg = clip ? Math.min(2.4, Math.max(.3, t.finVoz - t.mosaico)) : 0;
    sh('ffmpeg', ['-v', 'error', '-y', '-ss', t.mosaico.toFixed(3), '-i', t.video, ...(clip ? ['-t', seg.toFixed(2)] : ['-frames:v', '1']),
      '-vf', `${clip ? 'fps=10,' : ''}crop=${Math.round(g.cw)}:${Math.round(g.ch)}:${Math.round(g.cx)}:${Math.round(g.cy)},scale=600:-2`, '-q:v', '3', join(M, `b${b}-%03d.jpg`)]);
    TL.fotos[b] = readdirSync(M).filter(x => x.startsWith(`b${b}-`)).sort().map(x => 'mosaico/' + x); }
}

// ---------- 3: las cuatro capas, con los tiempos de la voz ----------
console.log('\nDibujando las capas con tus tiempos…');
const capa = {};
for (const c of ['fondo', 'mate', 'encima', 'alfa']) { capa[c] = join(T, `capa-${c}.mp4`); renderizar(armar(DIR, G, TL, 'capa=' + c, 'capa-' + c), capa[c]); }

// ---------- 4: cada bloque = panel + toma (en la tarjeta o a pantalla completa) + lo de encima ----------
const expr = ({ inicial, segs }) => {      // E(t) del bloque escrito para ffmpeg
  let cur = String(segs.length ? segs[segs.length - 1].v1 : inicial);
  for (let k = segs.length - 1; k >= 0; k--) { const s = segs[k], P = `((t-${s.a})/${(s.b - s.a).toFixed(3)})`;
    cur = `if(lt(t,${s.a}),${s.v0},if(lt(t,${s.b}),${s.v0}+(${s.v1 - s.v0})*${P}*${P}*(3-2*${P}),${cur}))`; }
  return cur;
};
const partes = [];
for (const t of tomas) {
  const g = t.geo, tr = tramosDeBloque(TL, TL.segE, t.b), fijo = !tr.segs.length, Ex = fijo ? String(tr.inicial) : expr(tr), L = largo(t.b), ini = TL.INI_B[t.b].toFixed(3);
  const mix = (a, b) => fijo ? String(+(a + (b - a) * tr.inicial).toFixed(4)) : `(${a.toFixed(5)}+(${(b - a).toFixed(5)})*(${Ex}))`;
  const Sx = mix(g.sc, g.sf), salida = join(T, `bloque-${t.n}.mp4`);
  const filtro = `[1:v]trim=start=${t.corte.toFixed(3)},setpts=PTS-STARTPTS,fps=${FPS},tpad=stop_mode=clone:stop_duration=4,` +
    `scale=w='2*trunc(${g.w}*${Sx}/2)':h='2*trunc(${g.h}*${Sx}/2)'${fijo ? '' : ':eval=frame'}:flags=bicubic,setsar=1[p];` +
    `color=c=black:s=1080x1920:r=${FPS}[k];[k][p]overlay=x='${mix(g.oxc, g.oxf)}':y='${mix(g.oyc, g.oyf)}':eval=frame[pl];` +
    `[2:v]format=gray[m];[pl][m]alphamerge[pm];[0:v][pm]overlay=0:0[v1];` +
    `[4:v]format=gray[ea];[3:v][ea]alphamerge[em];[v1][em]overlay=0:0,format=yuv420p[v];` +
    `[1:a]atrim=start=${t.corte.toFixed(3)},asetpts=PTS-STARTPTS,aresample=48000,apad[a]`;
  const capaIn = c => ['-ss', ini, '-t', (L + .2).toFixed(3), '-i', capa[c]];
  sh('ffmpeg', ['-v', 'error', '-y', ...capaIn('fondo'), '-i', t.video, ...capaIn('mate'), ...capaIn('encima'), ...capaIn('alfa'),
    '-filter_complex', filtro, '-map', '[v]', '-map', '[a]', '-t', L.toFixed(3), '-r', String(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', salida]);
  partes.push(salida); console.log(`  bloque ${t.n} montado (${L.toFixed(1)} s)`);
}

// ---------- 5: unir, normalizar el audio y sacar la revisión ----------
const lista = join(T, 'lista.txt'), crudo = join(T, 'unido.mp4'); writeFileSync(lista, partes.map(p => `file '${p}'`).join('\n'));
sh('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', crudo]);
sh('ffmpeg', ['-v', 'error', '-y', '-i', crudo, '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', SALIDA]);
const REV = join(DIR, 'revision'); mkdirSync(REV, { recursive: true });
const hoja = join(REV, 'hoja-reel.jpg'); hojaDeContacto(SALIDA, hoja, 1.5);
const cuadros = cuadrosDeTransicion(SALIDA, TL, join(REV, 'reel'));
console.log(`\nListo: ${SALIDA} (${dur(SALIDA).toFixed(1)} s)\nHoja de contacto (un cuadro cada 1,5 s): ${hoja}` + (cuadros.length ? `\nCuadros de los cambios de encuadre (ábrelos): ${join(REV, 'reel')} (${cuadros.length})` : ''));
