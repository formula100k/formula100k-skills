#!/usr/bin/env node
// Plantilla «explicador con avatar» (modo Sin grabar) · arma un proyecto de HyperFrames a partir de reel.json
// Todo entra con CORTE SECO: nada rebota, nada tiembla, nada se desliza (regla de la casa: edición sin olor a IA).
//
//   node armar.mjs <carpeta-del-reel>
//
// La carpeta del reel trae: reel.json, assets/voz/NN.wav (una frase por archivo, ya recortada),
// assets/avatar/{neutral,hablando,pensando}.png y, opcional, tiempos.json (lo escribe preparar-voz.mjs).
// Escribe: index.html, assets/clips/*.mp4 (recortes de tus videos) y assets/img/tira-*.jpg.
// Todo lo que se ve sale del reel.json: frases, medios, gestos y colores. Este archivo no se toca.

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(process.argv[2] || '.');
const cfg = JSON.parse(readFileSync(join(DIR, 'reel.json'), 'utf8'));
const tiempos = existsSync(join(DIR, 'tiempos.json')) ? JSON.parse(readFileSync(join(DIR, 'tiempos.json'), 'utf8')) : {};

const W = 1080, H = 1920;
const PAUSA = cfg.pausa ?? 0.28;          // aire entre frases
const COLA = cfg.cola ?? 1.2;             // segundos extra al final
const ZONA = { x: 70, y: 480, w: 940, h: 700 };          // donde viven las tarjetas
const AV = { w: 340, h: 432, y: 1200, izq: 60, centro: 370, der: 680 };
const M = Object.assign({
  claro: { fondo: '#f4f1ea', tinta: '#0b0b10', tenue: '#8a857c', tarjeta: '#ffffff', borde: 'rgba(11,11,16,.12)' },
  oscuro: { fondo: '#050509', tinta: '#f4f1ea', tenue: '#8f8c97', tarjeta: '#15151d', borde: 'rgba(244,241,234,.16)' },
  acento: '#0A84FF', acentoTinta: '#ffffff', ok: '#7fe3ad', mal: '#ef4444',
}, cfg.marca || {});

for (const d of ['assets/clips', 'assets/img', 'assets/fonts']) mkdirSync(join(DIR, d), { recursive: true });
for (const f of readdirSync(join(AQUI, 'fonts'))) copyFileSync(join(AQUI, 'fonts', f), join(DIR, 'assets/fonts', f));

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const dur = f => parseFloat(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]));
const tam = f => sh('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f]).trim().split(',').map(Number);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r2 = n => Math.round(n * 1000) / 1000;
const par = n => 2 * Math.round(n / 2);
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const COLOR = { rojo: '#ef4444', verde: '#22c55e', amarillo: '#F5C542', acento: M.acento };
const origen = p => p.startsWith('~') ? p.replace('~', process.env.HOME) : resolve(DIR, p);

// ───────────── recortes de video y cuadros sueltos (se guardan con huella: no se repiten) ─────────────
function recorte(src, desde, largo, w, h, recorteY = 0) {
  const s = origen(src);
  const [sw, shh] = tam(s);
  const a = w / h;
  let cw = sw, ch = par(sw / a), cx = 0, cy = par(recorteY * shh);
  if (ch > shh) { ch = shh; cw = par(shh * a); cx = par((sw - cw) / 2); cy = 0; }
  if (cy + ch > shh) cy = shh - ch;
  const ow = par(Math.min(cw, w * 1.5)), oh = par(ow / a);
  const huella = createHash('md5').update([s, desde, largo, cw, ch, cx, cy, ow].join('|')).digest('hex').slice(0, 10);
  const rel = `assets/clips/${basename(s).replace(/\.[^.]+$/, '').slice(0, 24)}-${huella}.mp4`;
  if (!existsSync(join(DIR, rel)))
    sh('ffmpeg', ['-y', '-v', 'error', '-ss', String(desde), '-t', String(r2(largo + 0.3)), '-i', s, '-an',
      '-vf', `crop=${cw}:${ch}:${cx}:${cy},scale=${ow}:${oh},fps=30`, '-c:v', 'libx264', '-g', '1', '-crf', '20', '-pix_fmt', 'yuv420p', join(DIR, rel)]);
  return rel;
}
function cuadros(src, desde, paso, n, w, h, recorteY = 0) {
  const s = origen(src);
  const [sw, shh] = tam(s);
  const a = w / h; const ch = par(sw / a); const cy = par(recorteY * shh);
  const huella = createHash('md5').update([s, desde, paso, n, w, h, recorteY].join('|')).digest('hex').slice(0, 8);
  const lista = [];
  for (let i = 0; i < n; i++) {
    const rel = `assets/img/tira-${huella}-${String(i).padStart(2, '0')}.jpg`;
    if (!existsSync(join(DIR, rel)))
      sh('ffmpeg', ['-y', '-v', 'error', '-ss', String(r2(desde + i * paso)), '-i', s, '-frames:v', '1', '-vf', `crop=${sw}:${ch}:0:${cy},scale=${par(w * 1.5)}:-2`, '-q:v', '3', join(DIR, rel)]);
    lista.push(rel);
  }
  return lista;
}

// ───────────── frase de arriba: «uno dos | *negrita* y [caja] | …» ─────────────
function partirFrase(texto) {
  const trozos = texto.split('|').map(t => t.trim()).filter(Boolean);
  let k = 0;
  return trozos.map(t => {
    const segs = t.split(/(\*[^*]+\*|\[[^\]]+\])/).filter(s => s.trim());
    const fuera = [];
    segs.forEach(s => {
      const estilo = s.startsWith('*') ? 'fuerte' : s.startsWith('[') ? 'encaja' : 'normal';
      const limpio = s.replace(/^[*[]|[*\]]$/g, '').trim();
      let ps = limpio.split(/\s+/);
      // la puntuación suelta se pega a la palabra de al lado: no cuenta como palabra
      if (estilo === 'normal' && fuera.length && /^[.,:;?!…»)]+$/.test(ps[0])) { fuera[fuera.length - 1].cola = ps.shift(); }
      let abre = '';
      if (estilo === 'normal' && ps.length && /^[¿¡«(]+$/.test(ps[ps.length - 1])) abre = ps.pop();
      if (ps.length) fuera.push({ estilo, palabras: ps.map(p => ({ p, k: k++ })) });
      if (abre) fuera.push({ estilo: 'abre', abre });
    });
    // «¿» suelto antes de un tramo con estilo: se pega al tramo que sigue
    return fuera.filter((f, j) => { if (f.estilo === 'abre') { if (fuera[j + 1]) fuera[j + 1].cabeza = f.abre; return false; } return true; });
  });
}
const norm = s => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9ñ]/g, '');

function tiemposDePalabras(clave, palabras, largo) {
  const t = tiempos[clave];
  if (t && t.length === palabras.length) return t.map(x => Math.min(x.t, largo - 0.05));
  // sin transcripción (o no cuadra): reparte por largo de palabra, con aire tras la puntuación
  const pesos = palabras.map(p => p.length + 2 + (/[.:;?!]$/.test(p) ? 5 : /,$/.test(p) ? 3 : 0));
  const total = pesos.reduce((a, b) => a + b, 0);
  let acc = 0; return pesos.map(p => { const x = acc / total * largo; acc += p; return r2(x); });
}

// ───────────── armado ─────────────
let t0 = 0, pista = 10, uid = 0;
const html = [], js = [], audios = [];
// immediateRender:false → antes de su primer tween cada cosa conserva su estado del CSS (oculta)
const P = (s) => js.push(s.replace(/(tl\.fromTo\("[^"]+",\{[^}]*\},\{)/g, '$1immediateRender:false,'));
let avPos = null;

function armarEscenas() {
cfg.escenas.forEach((e, i) => {
  const n = String(i + 1).padStart(2, '0');
  const id = `e${n}`;
  const voz = e.voz || `assets/voz/${n}.wav`;
  const largoVoz = dur(join(DIR, voz));
  const ultima = i === cfg.escenas.length - 1;
  const D = r2(largoVoz + PAUSA + (ultima ? COLA : 0));
  const tema = e.tema || 'claro';
  const frase = partirFrase(e.texto);
  const palabras = frase.flat().flatMap(s => s.palabras.map(x => x.p));
  const tp = tiemposDePalabras(n, palabras, largoVoz);

  // «@palabra» → segundo (dentro de la escena) en que se dice; «@palabra+0.3» suma
  const cuando = v => {
    if (typeof v === 'number') return v;
    if (v == null) return 0;
    const m = /^@([^+-]+)([+-][\d.]+)?$/.exec(v);
    if (!m) throw new Error(`escena ${n}: no entiendo el momento «${v}»`);
    const j = palabras.findIndex(p => norm(p).startsWith(norm(m[1])));
    if (j < 0) throw new Error(`escena ${n}: la frase no tiene la palabra «${m[1]}»`);
    return Math.max(0, r2(tp[j] + (m[2] ? parseFloat(m[2]) : 0)));
  };

  audios.push(`<audio id="voz${n}" src="${voz}" data-start="${t0}" data-duration="${r2(largoVoz)}" data-track-index="2" data-volume="1"></audio>`);

  // gancho golpe (solo la escena que lo trae): una línea chica + una ENORME, quietas desde el primer cuadro
  let fr = '';
  if (e.gancho) {
    const g = e.gancho, col = COLOR[g.color] || g.color || COLOR.rojo;
    const n = Math.max(...String(g.enorme).split('\n').map(l => [...l].length));
    const tam = g.tamano || Math.round(Math.min(250, 900 / Math.max(1, n * 0.38)));
    const chica = `<p class="g-chica">${esc(g.chica || '')}</p>`, enorme = `<p class="g-enorme" style="font-size:${tam}px;color:${col}">${esc(g.enorme).replace(/\n/g, '<br>')}</p>`;
    fr = `<div class="gancho">${g.chicaAbajo ? enorme + chica : chica + enorme}</div>`;
  } else
  frase.forEach((trozo, ti) => {
    fr += `<div class="trozo" id="${id}t${ti}"><p>`;
    trozo.forEach(seg => {
      const sp = seg.palabras.map(x => `<span class="p ${seg.estilo}" id="${id}p${x.k}">${esc(x.p)}</span>`).join(' ');
      const cola = seg.cola ? `<span class="p cola" id="${id}q${seg.palabras[0].k}">${esc(seg.cola)}</span>` : '';
      if (seg.cola) P(`tl.set("#${id}q${seg.palabras[0].k}",{opacity:1},${r2(t0 + tp[seg.palabras[seg.palabras.length - 1].k] + 0.1)});`);
      fr += (seg.cabeza ? esc(seg.cabeza) : '') + (seg.estilo === 'encaja' ? `<span class="caja" id="${id}c${seg.palabras[0].k}">${sp}</span>` : sp) + cola + ' ';
    });
    fr += `</p></div>`;
    const k0 = trozo[0].palabras[0].k;
    const ini = ti === 0 ? 0 : Math.max(0, tp[k0] - 0.04);
    const sig = frase[ti + 1];
    P(`tl.set("#${id}t${ti}",{autoAlpha:1},${r2(t0 + ini)});`);
    if (sig) P(`tl.set("#${id}t${ti}",{autoAlpha:0},${r2(t0 + Math.max(0, tp[sig[0].palabras[0].k] - 0.04))});`);
    trozo.forEach(seg => {
      if (seg.estilo === 'encaja') P(`tl.set("#${id}c${seg.palabras[0].k}",{autoAlpha:1},${r2(t0 + tp[seg.palabras[0].k])});`);
      seg.palabras.forEach(x => {
        if (i === 0 && x.k === 0) { P(`tl.set("#${id}p0",{opacity:1},0);`); return; }
        // las palabras de una caja entran juntas con su caja
        const tt = seg.estilo === 'encaja' ? tp[seg.palabras[0].k] : tp[x.k];
        P(`tl.set("#${id}p${x.k}",{opacity:1},${r2(t0 + tt)});`);
      });
    });
  });

  // tarjetas
  let tj = '';
  (e.tarjetas || []).forEach((c, ci) => {
    const cid = `${id}k${ci}`;
    const caja = lugar(c.pos);
    const en = cuando(c.en);
    const T = r2(t0 + en);
    const ctx = { cid, caja, T, t0, D, fin: r2(t0 + D), cuando: v => r2(t0 + cuando(v)), tema, seed: i * 31 + ci * 7 + 3 };
    const cuerpo = TIPOS[c.tipo](c, ctx);
    tj += `<div class="tj tj-${c.tipo}${c.plano ? ' plano' : ''}" id="${cid}" style="left:${caja.x}px;top:${caja.y}px;width:${caja.w}px;height:${caja.h}px">${cuerpo}</div>`;
    const rot = c.rot || 0;
    if (i === 0 && en <= 0.05) P(`tl.set("#${cid}",{autoAlpha:1,rotation:${rot}},0);`);
    else P(`tl.set("#${cid}",{autoAlpha:1,rotation:${rot}},${T});`);
    if (c.sale != null) P(`tl.set("#${cid}",{autoAlpha:0},${r2(t0 + cuando(c.sale))});`);
  });

  html.push(`<div class="esc ${tema}${i === 0 ? ' primera' : ''}" id="${id}"><div class="fondo"></div><div class="frase${e.gancho ? ' con-gancho' : ''}">${fr}</div>${tj}</div>`);
  if (i > 0) P(`tl.set("#${id}",{autoAlpha:1},${t0});`);
  if (!ultima) P(`tl.set("#${id}",{autoAlpha:0},${r2(t0 + D)});`);

  // avatar: lugar y gesto
  const pos = e.avatar || 'centro';
  if (pos === 'no') P(`tl.set("#avatar",{autoAlpha:0},${t0});`);
  else {
    if (avPos === 'no') P(`tl.set("#avatar",{autoAlpha:1},${t0});`);
    if (avPos === null || avPos === 'no') P(`tl.set("#avatar",{x:${AV[pos]}},${t0});`);
    else if (avPos !== pos) P(`tl.set("#avatar",{x:${AV[pos]}},${t0});`);
  }
  avPos = pos;
  const gesto = (t, g) => P(`tl.set("#av-neutral",{opacity:${g === 'neutral' ? 1 : 0}},${r2(t)});tl.set("#av-hablando",{opacity:${g === 'hablando' ? 1 : 0}},${r2(t)});tl.set("#av-pensando",{opacity:${g === 'pensando' ? 1 : 0}},${r2(t)});`);
  if ((e.gesto || 'hablando') === 'pensando') {
    gesto(t0, 'pensando');
  } else {
    // boca: se abre en una palabra sí y otra no; en las pausas, cerrada
    tp.forEach((t, k) => {
      const sigue = k + 1 < tp.length ? tp[k + 1] : largoVoz;
      gesto(t0 + t, k % 2 === 0 ? 'hablando' : 'neutral');
      if (k % 2 === 0 && sigue - t > 0.42) gesto(t0 + t + 0.3, 'neutral');
    });
    gesto(t0 + largoVoz, 'neutral');
  }
  t0 = r2(t0 + D);
});
}

// ───────────── lugares ─────────────
function lugar(p) {
  const Z = ZONA, g = 28;
  if (p && typeof p === 'object') return p;
  const medio = (Z.w - g) / 2, tercio = (Z.w - 2 * g) / 3;
  const L = {
    centro: { ...Z },
    izq: { x: Z.x, y: Z.y, w: medio, h: Z.h }, der: { x: Z.x + medio + g, y: Z.y, w: medio, h: Z.h },
    t1: { x: Z.x, y: Z.y, w: tercio, h: Z.h }, t2: { x: Z.x + tercio + g, y: Z.y, w: tercio, h: Z.h }, t3: { x: Z.x + 2 * (tercio + g), y: Z.y, w: tercio, h: Z.h },
    arriba: { x: Z.x, y: Z.y, w: Z.w, h: (Z.h - g) / 2 }, abajo: { x: Z.x, y: Z.y + (Z.h + g) / 2, w: Z.w, h: (Z.h - g) / 2 },
  };
  if (!L[p || 'centro']) throw new Error(`no existe el lugar «${p}»`);
  return L[p || 'centro'];
}

// ───────────── tipos de tarjeta ─────────────
function pintaCodigo(l) {
  let s = esc(l);
  if (/^\s*\/\//.test(l)) return `<i>${s}</i>`;
  s = s.replace(/(&quot;|"|')([^"']*)("|')/g, '<b class="s">$1$2$3</b>');
  s = s.replace(/\b(function|const|let|return|for|if)\b/g, '<b class="k">$1</b>');
  s = s.replace(/(\/\/.*)$/, '<i>$1</i>');
  return s;
}
const TIPOS = {
  // video real: { src, desde, largo?, etiqueta?, recorteY? } · se recorta al tamaño de la tarjeta
  video(c, x) {
    const hEti = c.etiqueta ? 64 : 0;
    const largo = Math.min(c.largo || 99, x.fin - x.T);
    const rel = recorte(c.src, c.desde || 0, largo, x.caja.w, x.caja.h - hEti, c.recorteY || 0);
    return `<div class="marco" style="height:${x.caja.h - hEti}px"><video id="${x.cid}v" src="${rel}" data-start="${x.T}" data-duration="${r2(largo)}" data-track-index="${pista++}" muted playsinline></video></div>` +
      (c.etiqueta ? `<div class="eti">${esc(c.etiqueta)}</div>` : '');
  },
  // imagen o captura: { src, etiqueta?, ajuste?: "cover"|"contain", arriba?: true }
  imagen(c, x) {
    const hEti = c.etiqueta ? 64 : 0;
    return `<div class="marco" style="height:${x.caja.h - hEti}px"><img src="${c.src}" style="object-fit:${c.ajuste || 'cover'};object-position:${c.arriba === false ? 'center' : 'top'}"></div>` +
      (c.etiqueta ? `<div class="eti">${esc(c.etiqueta)}</div>` : '');
  },
  // código que se escribe renglón por renglón: { titulo, lineas[], cada?, resalta?, resaltaEn? }
  codigo(c, x) {
    const cada = c.cada ?? 0.28;
    c.lineas.forEach((_, k) => P(`tl.set("#${x.cid}l${k}",{opacity:1},${r2(x.T + 0.25 + k * cada)});`));
    if (c.resalta != null) P(`tl.set("#${x.cid}r",{opacity:1},${x.cuando(c.resaltaEn ?? 0)});`);
    return `<div class="barra"><span class="pt"></span><span class="pt"></span><span class="pt"></span><em>${esc(c.titulo || 'pieza.html')}</em>${c.sello ? `<span class="sello">${esc(c.sello)}</span>` : ''}</div><div class="lineas" style="font-size:${c.letra || 25}px">` +
      c.lineas.map((l, k) => `<div class="ln" id="${x.cid}l${k}">${c.resalta === k ? `<span class="res" id="${x.cid}r"></span>` : ''}<span class="n">${k + 1}</span><code>${pintaCodigo(l)}</code></div>`).join('') + `</div>`;
  },
  // conversación: { mensajes: [{ de: "yo"|"claude", texto, en }] }
  chat(c, x) {
    c.mensajes.forEach((m, k) => P(`tl.set("#${x.cid}m${k}",{autoAlpha:1},${x.cuando(m.en ?? 0)});`));
    return `<div class="barra clara"><span class="astro"></span><em>${esc(c.titulo || 'Chat')}</em></div><div class="mensajes">` +
      c.mensajes.map((m, k) => `<div class="msj ${m.de}" id="${x.cid}m${k}">${esc(m.texto)}</div>`).join('') + `</div>`;
  },
  // tira de cuadros que corre + contador: { src, desde, paso?, n?, cuenta?, etiqueta?, recorteY? }
  tira(c, x) {
    const n = c.n || 10, cw = 250, ch = 312, g = 16;
    const imgs = cuadros(c.src, c.desde || 0, c.paso || 0.1, n, cw, ch, c.recorteY || 0);
    const viaje = n * (cw + g) - x.caja.w + 40;
    const d = r2(x.fin - x.T - 0.3);
    P(`tl.fromTo("#${x.cid}s",{x:40},{x:${-viaje},duration:${d},ease:"none"},${x.T});`);
    const cuenta = c.cuenta || 30, lh = 96;
    P(`tl.fromTo("#${x.cid}o",{y:0},{y:${-(cuenta - 1) * lh},duration:${r2(Math.min(d, c.cuentaDura || 2.4))},ease:"steps(${cuenta - 1})"},${x.cuando(c.cuentaEn ?? 0.2)});`);
    return `<div class="carril" style="height:${ch + 44}px"><div class="cinta" id="${x.cid}s">` +
      imgs.map((f, k) => `<div class="cuadro" style="width:${cw}px;height:${ch}px"><img src="${f}"><span>${String(k + 1).padStart(2, '0')}</span></div>`).join('') + `</div></div>` +
      `<div class="cuenta"><div class="odo" style="height:${lh}px"><div id="${x.cid}o" class="col">` + Array.from({ length: cuenta }, (_, k) => `<span style="height:${lh}px;line-height:${lh}px">${k + 1}</span>`).join('') +
      `</div></div><div class="rot"><b>${esc(c.etiqueta || 'imágenes')}</b><i>${esc(c.nota || 'en 1 segundo')}</i></div></div>`;
  },
  // navegador que toma fotos: { src, desde, url?, fotos?, chip?, chipEn?, fotosEn?, recorteY? }
  navegador(c, x) {
    const hBarra = 62, hFila = 150, hVid = x.caja.h - hBarra - hFila;
    const wVid = Math.round(hVid * 0.8);
    const largo = x.fin - x.T;
    const rel = recorte(c.src, c.desde || 0, largo, wVid, hVid, c.recorteY || 0);
    const nf = c.fotos || 6, f0 = x.cuando(c.fotosEn ?? 0.6);
    const thumbs = cuadros(c.src, c.desde || 0, 0.35, nf, 84, 105, c.recorteY || 0);
    for (let k = 0; k < nf; k++) {
      const t = r2(f0 + k * 0.3);
      P(`tl.fromTo("#${x.cid}f",{opacity:.85},{opacity:0,duration:.22,ease:"power1.out"},${t});`);
      P(`tl.set("#${x.cid}th${k}",{autoAlpha:1},${r2(t + 0.05)});`);
    }
    P(`tl.set("#${x.cid}chip",{autoAlpha:1},${x.cuando(c.chipEn ?? 2.4)});`);
    return `<div class="barra clara"><span class="pt"></span><span class="pt"></span><span class="pt"></span><em class="url">${esc(c.url || 'archivo local · pieza.html')}</em></div>` +
      `<div class="visor" style="height:${hVid}px"><div class="marco" style="width:${wVid}px;height:${hVid}px"><video id="${x.cid}v" src="${rel}" data-start="${x.T}" data-duration="${r2(largo)}" data-track-index="${pista++}" muted playsinline></video><div class="flash" id="${x.cid}f"></div></div></div>` +
      `<div class="fila" style="height:${hFila}px">` + thumbs.map((f, k) => `<img id="${x.cid}th${k}" src="${f}">`).join('') + `<span class="chip" id="${x.cid}chip">→ ${esc(c.chip || 'reel.mp4')}</span></div>`;
  },
  // onda de voz: { barras?, etiqueta?, etiquetaEn? }
  onda(c, x) {
    const n = c.barras || 30, R = rng(x.seed), d = x.fin - x.T - 0.3;
    for (let k = 0; k < n; k++) {
      const a = 0.25 + R() * 0.75, p = 0.2 + R() * 0.18;
      P(`tl.fromTo("#${x.cid}b${k}",{scaleY:${r2(0.12 + R() * 0.2)}},{scaleY:${r2(a)},duration:${r2(p)},ease:"sine.inOut",yoyo:true,repeat:${Math.max(0, Math.floor(d / p) - 1)}},${x.T});`);
    }
    if (c.etiqueta) P(`tl.set("#${x.cid}e",{autoAlpha:1},${x.cuando(c.etiquetaEn ?? 0.5)});`);
    return `<div class="cab"><span class="pulso"></span><em>${esc(c.titulo || 'voz')}</em>${c.etiqueta ? `<span class="chip ac" id="${x.cid}e">${esc(c.etiqueta)}</span>` : ''}</div>` +
      `<div class="barras">` + Array.from({ length: n }, (_, k) => `<span id="${x.cid}b${k}"></span>`).join('') + `</div>`;
  },
  // píldoras: { items: [{ texto, en, estado?: "tachado"|"ok"|"acento" }] } · usar con "plano": true
  chips(c, x) {
    c.items.forEach((m, k) => {
      const t = x.cuando(m.en ?? 0);
      P(`tl.set("#${x.cid}i${k}",{autoAlpha:1},${t});`);
      if (m.estado === 'tachado') P(`tl.set("#${x.cid}x${k}",{opacity:1},${r2(t + 0.3)});`);
    });
    return `<div class="pildoras">` + c.items.map((m, k) => `<span class="pil ${m.estado || ''}" id="${x.cid}i${k}">${esc(m.texto)}${m.estado === 'tachado' ? `<s id="${x.cid}x${k}"></s>` : ''}</span>`).join('') + `</div>`;
  },
  // filas con nota: { filas: [{ texto, nota, en, estado?: "tenue"|"resaltado" }] }
  lista(c, x) {
    c.filas.forEach((m, k) => {
      const t = x.cuando(m.en ?? 0);
      P(`tl.set("#${x.cid}f${k}",{autoAlpha:1},${t});`);
      if (m.nota) P(`tl.set("#${x.cid}n${k}",{autoAlpha:1},${m.notaEn != null ? x.cuando(m.notaEn) : r2(t + 0.3)});`);
    });
    return `<div class="filas">` + c.filas.map((m, k) => `<div class="fila-l ${m.estado || ''}" id="${x.cid}f${k}"><b>${esc(m.texto)}</b>${m.nota ? `<span class="chip" id="${x.cid}n${k}">${esc(m.nota)}</span>` : ''}</div>`).join('') + `</div>`;
  },
  // hoja de guion: { titulo, lineas?: n, textos?: [..], nota?, notaEn? }
  hoja(c, x) {
    const n = c.lineas || 6, R = rng(x.seed);
    if (c.nota) P(`tl.set("#${x.cid}n",{autoAlpha:1,rotation:-7},${x.cuando(c.notaEn ?? 0.5)});`);
    return `<div class="titulo-h">${esc(c.titulo || 'guion')}</div>` +
      (c.textos ? c.textos.map(t => `<p>${esc(t)}</p>`).join('') : Array.from({ length: n }, () => `<div class="raya" style="width:${Math.round(45 + R() * 50)}%"></div>`).join('')) +
      (c.nota ? `<span class="sello-h" id="${x.cid}n">${esc(c.nota)}</span>` : '');
  },
  // reproductor con barra de retención que se vacía: { titulo, hasta?: 0.15, drenaEn, nota?, notaEn? }
  reproductor(c, x) {
    const t = x.cuando(c.drenaEn ?? 0.5);
    P(`tl.fromTo("#${x.cid}r",{scaleX:1},{scaleX:${c.hasta ?? 0.15},duration:${c.drenaDura || 1.1},ease:"power2.inOut"},${t});`);
    if (c.nota) P(`tl.set("#${x.cid}n",{autoAlpha:1},${x.cuando(c.notaEn ?? c.drenaEn ?? 0.5)});`);
    return `<div class="lienzo"><div class="deco" id="${x.cid}d"></div><span class="play"></span><em>${esc(c.titulo || 'video bonito')}</em></div>` +
      `<div class="pie-r"><i>${esc(c.rotulo || 'la gente que sigue viendo')}</i><div class="riel"><div class="relleno" id="${x.cid}r"></div></div>${c.nota ? `<span class="nota-r" id="${x.cid}n">${esc(c.nota)}</span>` : ''}</div>`;
  },
  // cifra grande con su fuente: { valor: "1,8", unidad: "segundos", nota?: "por título", color?: "rojo"|"verde"|"acento"|"#hex", notaEn? }
  cifra(c, x) {
    const col = COLOR[c.color] || c.color || M.acento;
    const largo = [...String(c.valor)].length;
    const tam = c.tamano || Math.round(Math.min(x.caja.h * 0.62, (x.caja.w - 60) / Math.max(1, largo * 0.5)));
    if (c.nota) P(`tl.set("#${x.cid}n",{autoAlpha:1},${x.cuando(c.notaEn ?? 0)});`);
    return `<div class="cifra-in"><b style="font-size:${tam}px;color:${col}">${esc(c.valor)}</b>${c.unidad ? `<span class="uni">${esc(c.unidad)}</span>` : ''}${c.nota ? `<i id="${x.cid}n">${esc(c.nota)}</i>` : ''}</div>`;
  },
  // caja de comentario del CTA: { usuario, palabra, respuesta, escribeEn, enviaEn }
  comentario(c, x) {
    const t = x.cuando(c.escribeEn ?? 0.3), letras = [...c.palabra];
    letras.forEach((_, k) => P(`tl.set("#${x.cid}q${k}",{opacity:1},${r2(t + k * 0.07)});`));
    const env = c.enviaEn != null ? x.cuando(c.enviaEn) : r2(t + letras.length * 0.07 + 0.35);
    P(`tl.set("#${x.cid}r",{autoAlpha:1},${r2(env + 0.3)});`);
    return `<div class="campo"><span class="foto"></span><span class="escrito">` + letras.map((l, k) => `<b id="${x.cid}q${k}">${esc(l)}</b>`).join('') + `</span><span class="boton" id="${x.cid}b">Publicar</span></div>` +
      `<div class="resp" id="${x.cid}r"><b>${esc(c.usuario || '')}</b> ${esc(c.respuesta || '')}</div>`;
  },
};

// ───────────── página ─────────────
armarEscenas();
const TOTAL = t0;
const tema = (k) => `--fondo:${M[k].fondo};--tinta:${M[k].tinta};--tenue:${M[k].tenue};--tarjeta:${M[k].tarjeta};--borde:${M[k].borde};`;
const css = readFileSync(join(AQUI, 'plantilla.css'), 'utf8')
  .replace('/*TEMAS*/', `.esc.claro{${tema('claro')}}.esc.oscuro{${tema('oscuro')}}#lienzo{--acento:${M.acento};--acento-tinta:${M.acentoTinta};--ok:${M.ok};--mal:${M.mal};}`);
const av = cfg.avatar || {};
const pagina = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=${W}, height=${H}">
<title>${esc(cfg.titulo || 'Explicador con avatar')}</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<link rel="stylesheet" href="assets/fonts/fonts.css">
<style>
${css}
</style>
</head>
<body>
<div id="lienzo" data-composition-id="main" data-start="0" data-width="${W}" data-height="${H}" data-duration="${TOTAL}">
<div id="capa">
${html.join('\n')}
<div id="avatar" style="width:${AV.w}px;height:${AV.h}px;top:${AV.y}px"><div id="avatar-in">
<img id="av-neutral" src="${av.neutral || 'assets/avatar/neutral.png'}">
<img id="av-hablando" src="${av.hablando || 'assets/avatar/hablando.png'}">
<img id="av-pensando" src="${av.pensando || 'assets/avatar/pensando.png'}">
</div></div>
</div>
${audios.join('\n')}
</div>
<script>
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
${js.join('\n')}
window.__timelines["main"] = tl;
</script>
</body>
</html>
`;
writeFileSync(join(DIR, 'index.html'), pagina);
console.log(`index.html listo · ${cfg.escenas.length} escenas · ${TOTAL} s`);
