// ============================================================================
// BIBLIOTECA DE PANELES · reel-explicacion-en-vivo-f100k
// Cada panel es una función pura del tiempo:  PANEL.tipo(t, p, m)
//   t = segundo global · p = los parámetros que vienen de guion.json
//   m.K(k, f) = el momento «f» (0 a 1) del paso k · m.D(k) = lo que dura el paso k · m.n = frases que cubre
// Un panel cubre una frase, o varias si las siguientes llevan { "sigue": true } (cada frase = un paso).
// Si le das menos frases que pasos, los pasos que sobran se reparten la última frase.
// El catálogo con los parámetros de cada uno está en references/paneles.md.
// No se edita por pieza: lo que cambia va en guion.json.
// ============================================================================
let C = null;            // el tema del bloque en curso (lo fija el motor)
let E = 0;               // 0 = persona en la tarjeta · 1 = persona a pantalla completa
const FOTOS = {};        // cuadros de cada toma para el mosaico: { índiceDeBloque: [Image, …] }
const SANS = (GUION.letras && GUION.letras.sans) || LETRA_LIMPIA;
const SERIF = (GUION.letras && GUION.letras.serif) || 'Georgia, "Times New Roman", serif';
const BIEN = '#7fe3ad', MAL = '#ef4444', NEGRO = '#16161d';

const pop = (t, a, dur = .42) => back(prog(t, a, a + dur));
const fin = (t, a, dur = .3) => easeOut(prog(t, a, a + dur));
const cuenta = (t, a, b, hasta, desde = 0) => Math.round(lerp(desde, hasta, easeOut(prog(t, a, b))));
const rgbDe = h => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const esClaro = h => { const [r, g, b] = rgbDe(h); return r * .299 + g * .587 + b * .114 > 150; };
const mezcla = (a, b, k) => { const A = rgbDe(a), B = rgbDe(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, '0')).join(''); };

function txt(s, x, y, tam, o = {}) {
  ctx.save();
  ctx.globalAlpha *= o.a ?? 1;
  const letra = () => { ctx.font = `${o.it ? 'italic ' : ''}${o.peso ?? 800} ${tam}px ${o.serif ? SERIF : SANS}`; };
  letra(); ctx.letterSpacing = (o.esp ?? 0) + 'px';
  if (o.max) while (ctx.measureText(s).width > o.max && tam > 12) { tam *= .95; letra(); }   // el texto largo se achica, nunca se corta
  ctx.textAlign = o.al || 'center'; ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.col || C.tinta;
  ctx.fillText(s, x, y);
  ctx.restore();
}
function caja(x, y, w, h, r, rel, borde, grosor = 2) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (rel) { ctx.fillStyle = rel; ctx.fill(); }
  if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = grosor; ctx.stroke(); }
}
function escala(x, y, p, f) { if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(p, p); ctx.globalAlpha *= clamp(p * 1.5); f(); ctx.restore(); }
function poli(pts, rel, borde, g = 4) {
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  if (rel) { ctx.fillStyle = rel; ctx.fill(); }
  if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = g; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function trazo(pts, p, col, g = 5) {          // línea que se dibuja de 0 a 1
  if (p <= 0) return; let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let resto = L * clamp(p);
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = g; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && resto > 0; i++) { const k = Math.min(1, resto / seg[i - 1]); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)); resto -= seg[i - 1]; }
  ctx.stroke(); ctx.restore();
}
function palomita(x, y, s, p = 1, col = BIEN, g = 7) { trazo([[x - .5 * s, y], [x - .12 * s, y + .38 * s], [x + .55 * s, y - .42 * s]], p, col, g); }
function equis(x, y, s, p = 1, col = MAL, g = 6) { trazo([[x - s, y - s], [x + s, y + s]], clamp(p * 2), col, g); trazo([[x + s, y - s], [x - s, y + s]], clamp(p * 2 - 1), col, g); }
function flecha(x0, y0, x1, y1, p, col, g = 5) { trazo([[x0, y0], [x1, y1]], p, col, g); if (p > .9) { const a = Math.atan2(y1 - y0, x1 - x0), s = 16; trazo([[x1 - s * Math.cos(a - .5), y1 - s * Math.sin(a - .5)], [x1, y1], [x1 - s * Math.cos(a + .5), y1 - s * Math.sin(a + .5)]], 1, col, g); } }
function disco(x, y, r, rel, borde, g = 3) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); if (rel) { ctx.fillStyle = rel; ctx.fill(); } if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = g; ctx.stroke(); } }

// ---------- iconos:  ICONO.nombre(x, y, tamaño, color, t) ----------
const ICONO = {
  percha(x, y, s, col, t, g = 6) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = g; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(x, y - s * .62, s * .2, Math.PI * .9, Math.PI * 2.45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - s * .42); ctx.lineTo(x, y - s * .28); ctx.lineTo(x - s, y + s * .3); ctx.lineTo(x + s, y + s * .3); ctx.lineTo(x, y - s * .28); ctx.stroke(); ctx.restore(); },
  reloj(x, y, s, col, t = 0, g = 6) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = g; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.stroke(); const a = t * 1.6 - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * s * .68, y + Math.sin(a) * s * .68); ctx.moveTo(x, y); ctx.lineTo(x + s * .42, y); ctx.stroke(); ctx.restore(); },
  play(x, y, s, col) { caja(x - s, y - s * .68, s * 2, s * 1.36, s * .22, C.panel, col, 6); poli([[x - s * .22, y - s * .32], [x + s * .36, y], [x - s * .22, y + s * .32]], col); },
  sol(x, y, s, col, t = 0, g = 6) { ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = g; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, s * .52, 0, 7); ctx.fill();
    for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 + t * .5; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * s * .74, y + Math.sin(a) * s * .74); ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); ctx.stroke(); } ctx.restore(); },
  pan(x, y, s, col, t, g = 6) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = g; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.ellipse(x, y, s, s * .58, 0, 0, 7); ctx.stroke();
    for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(x + k * s * .42 - s * .12, y + s * .2); ctx.lineTo(x + k * s * .42 + s * .12, y - s * .2); ctx.stroke(); } ctx.restore(); },
  horno(x, y, s, col, t, g = 6) { caja(x - s, y - s * .8, s * 2, s * 1.6, s * .18, null, col, g); caja(x - s * .68, y - s * .2, s * 1.36, s * .78, s * .1, null, col, g);
    for (const k of [-1, 0, 1]) disco(x + k * s * .5, y - s * .5, s * .09, col); },
  hoja(x, y, s, col, t, g = 6) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = g; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - s * .8, y + s * .8); ctx.quadraticCurveTo(x - s * .9, y - s * .7, x + s * .8, y - s * .8); ctx.quadraticCurveTo(x + s * .7, y + s * .9, x - s * .8, y + s * .8); ctx.lineTo(x + s * .3, y - s * .3); ctx.stroke(); ctx.restore(); },
  moneda(x, y, s, col, t, g = 6) { disco(x, y, s, null, col, g); txt('$', x, y + s * .06, s * 1.1, { col, peso: 800 }); },
  microfono(x, y, s, col, t, g = 6) { caja(x - s * .32, y - s * .9, s * .64, s, s * .32, col); ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = g; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y - s * .32, s * .55, .15 * Math.PI, .85 * Math.PI); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y + s * .23); ctx.lineTo(x, y + s * .55); ctx.stroke(); ctx.restore(); },
};
const icono = (n, x, y, s, col, t) => { if (n && ICONO[n]) ICONO[n](x, y, s, col, t); };

// ---------- objetos grandes para el panel «contador»:  OBJETO.nombre(cx, y0, escala, p) ----------
const OBJETO = {
  saco(cx, y0, s, p) {                               // una prenda colgada en su percha
    const P = pts => pts.map(([x, y]) => [cx + x * s, y0 + y * s]);
    const tela = p.color || C.ac, osc = p.oscuro || mezcla(tela, '#000000', .22), T = C.tinta, papel = p.papel || '#fbf6ea';
    ctx.save(); ctx.strokeStyle = T; ctx.lineWidth = 6 * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(cx, y0 - 74 * s, 24 * s, Math.PI * .9, Math.PI * 2.45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, y0 - 50 * s); ctx.lineTo(cx, y0 - 30 * s); ctx.stroke(); ctx.restore();
    for (const m of [-1, 1]) poli(P([[m * 112, 12], [m * 168, 44], [m * 190, 318], [m * 142, 324], [m * 124, 120]]), osc, T, 5 * s);
    poli(P([[-58, -6], [-118, 14], [-126, 350], [126, 350], [118, 14], [58, -6], [0, 40]]), tela, T, 5 * s);
    poli(P([[-46, 0], [46, 0], [0, 176]]), papel, T, 4 * s);
    for (const m of [-1, 1]) poli(P([[m * 50, -4], [m * 104, 96], [m * 66, 104], [0, 178]]), osc, T, 4 * s);
    for (const y of [222, 276]) disco(cx, y0 + y * s, 8 * s, T);
    for (const m of [-1, 1]) trazo(P([[m * 96, 262], [m * 46, 262]]), 1, T, 4 * s);
  },
  pan(cx, y0, s, p) {                                // una hogaza sobre su tabla
    const col = p.color || C.ac, osc = p.oscuro || mezcla(col, '#000000', .25), T = C.tinta, y = y0 + 150 * s;
    caja(cx - 190 * s, y + 96 * s, 380 * s, 30 * s, 15 * s, p.papel || '#fbf6ea', T, 5 * s);
    ctx.beginPath(); ctx.ellipse(cx, y, 172 * s, 112 * s, 0, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = T; ctx.lineWidth = 5 * s; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, y, 172 * s, 112 * s, 0, 0, 7); ctx.clip();
    ctx.beginPath(); ctx.ellipse(cx, y + 64 * s, 190 * s, 96 * s, 0, 0, 7); ctx.fillStyle = osc; ctx.globalAlpha *= .55; ctx.fill(); ctx.restore();
    for (const k of [-1, 0, 1]) trazo([[cx + k * 78 * s - 26 * s, y - 14 * s], [cx + k * 78 * s + 26 * s, y - 66 * s]], 1, p.papel || '#fbf6ea', 9 * s);
  },
  caja(cx, y0, s, p) {                               // un producto cualquiera: una caja con su tapa
    const col = p.color || C.ac, osc = p.oscuro || mezcla(col, '#000000', .22), T = C.tinta;
    caja(cx - 150 * s, y0 + 60 * s, 300 * s, 250 * s, 18 * s, col, T, 5 * s);
    caja(cx - 168 * s, y0 + 10 * s, 336 * s, 74 * s, 16 * s, osc, T, 5 * s);
    caja(cx - 22 * s, y0 + 10 * s, 44 * s, 300 * s, 0, p.papel || '#fbf6ea', T, 4 * s);
  },
};

// ---------- formas chicas para el panel «ramas» ----------
const FORMA = {
  vertical(a, b) { caja(-45, -80, 90, 160, 14, C.panel, a, 4); poli([[-11, -15], [15, 0], [-11, 15]], a); caja(-30, 54, 60, 6, 3, C.pelo); },
  apilado(a, b) { caja(-24, -44, 116, 116, 14, C.panel, C.pelo, 3); caja(-44, -58, 116, 116, 14, C.panel, C.pelo, 3); caja(-64, -72, 116, 116, 14, C.panel, b, 4);
    caja(-46, -50, 80, 10, 5, b); caja(-46, -28, 56, 8, 4, C.gris); caja(-46, -10, 66, 8, 4, C.gris); for (let k = 0; k < 3; k++) disco(-22 + k * 16, 26, 4.5, k ? C.pelo : b); },
  aro(a, b) { const g = ctx.createLinearGradient(-30, 30, 30, -30); g.addColorStop(0, b); g.addColorStop(1, a);
    ctx.strokeStyle = g; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 29, 0, 7); ctx.stroke(); disco(0, 0, 21, C.panel); },
  circulo(a, b) { disco(0, 0, 27, a, C.tinta, 3); },
  ovalo(a, b) { ctx.beginPath(); ctx.ellipse(0, 0, 62, 40, 0, 0, 7); ctx.fillStyle = a; ctx.fill(); ctx.strokeStyle = C.tinta; ctx.lineWidth = 4; ctx.stroke(); for (const k of [-1, 0, 1]) trazo([[k * 30 - 9, 12], [k * 30 + 9, -12]], 1, C.panel, 5); },
  cuadro(a, b) { caja(-34, -34, 68, 68, 12, C.panel, a, 4); },
  plato(a, b) { disco(0, 0, 58, b, C.tinta, 4); disco(0, 0, 42, a); for (let k = 0; k < 5; k++) disco(Math.cos(k * 1.26) * 24, Math.sin(k * 1.26) * 24, 6, C.panel); },
};
const ANCHO_FORMA = { vertical: 112, apilado: 150, aro: 72, circulo: 68, ovalo: 150, cuadro: 86, plato: 140 };

// ============================================================================
const PANEL = {}, PASOS = {};   // PASOS.tipo(p) = cuántos pasos tiene (1 si no se declara)

// ---------- 1 · titulo · la portada de un bloque: «Si vendes» + la palabra grande ----------
PANEL.titulo = (t, p, m) => {
  const pal = p.palabra || '', tam = pal.length > 8 ? 150 : 210;
  txt(p.arriba || '', 540, 330, 58, { peso: 700, a: fin(t, m.K(0), .2), max: 960 });
  escala(540, 505, lerp(.7, 1, pop(t, m.K(0, .12), .35)), () => txt(pal, 0, 0, tam, { serif: true, it: true, peso: 700, col: p.color || C.ac, max: 980 }));
  ctx.save(); ctx.globalAlpha *= Math.pow(1 - E, 3);    // a pantalla completa solo quedan las dos líneas de texto
  trazo([[300, 640], [780, 640]], prog(t, m.K(0, .3), m.K(0, .3) + .35), C.tinta, 5);
  if (p.icono) { ctx.save(); ctx.globalAlpha *= fin(t, m.K(0, .25)); icono(p.icono, 540, 745, p.tamIcono || 62, p.colorIcono || C.tinta, t); ctx.restore(); }
  if (p.abajo) txt(p.abajo, 540, 842, 40, { peso: 700, col: C.gris, a: fin(t, m.K(0, .5)), max: 960 });
  ctx.restore();
};

// ---------- 2 · contador · un objeto a la izquierda y una etiqueta con un número que sube ----------
PANEL.contador = (t, p, m) => {
  const a0 = m.K(0), pb = pop(t, a0, .5), mece = Math.sin((t - a0) * 2.2) * .025 * (1 - prog(t, a0, a0 + 2.5)), tiembla = m.K(0, p.tiembla ?? .7);
  ctx.save(); ctx.translate(270, 250); ctx.rotate(mece); ctx.scale(lerp(.8, 1, pb), lerp(.8, 1, pb)); ctx.globalAlpha *= clamp(pb * 1.4);
  (OBJETO[p.objeto] || OBJETO.caja)(0, 110, 1.18, p); ctx.restore();
  escala(760, 330, pop(t, m.K(0, .12)), () => {
    ctx.save(); ctx.rotate(-.05 + (p.remate && t > tiembla && t < tiembla + .5 ? Math.sin((t - tiembla) * 40) * .03 : 0));
    poli([[-210, 0], [-150, -78], [200, -78], [200, 78], [-150, 78]], p.papel || '#fbf6ea', C.tinta, 5);
    disco(-160, 0, 13, C.fondo, C.tinta, 4);
    txt((p.prefijo || '') + cuenta(t, m.K(0, .15), m.K(0, .5), p.hasta, p.desde || 0) + (p.sufijo || ''), 40, 4, 112, { serif: true, peso: 700, max: 300, col: p.tintaEtiqueta || '#2a211c' });
    ctx.restore();
  });
  if (p.remate) txt(p.remate, 760, 462, 56, { serif: true, it: true, peso: 700, col: C.ac, a: fin(t, m.K(0, .72)), max: 480 });
};

// ---------- 3 · puntos · N puntos que se llenan uno por uno + (paso 2) la división ----------
PASOS.puntos = p => p.division ? 2 : 1;
PANEL.puntos = (t, p, m) => {
  const N = p.n, cols = p.columnas || (N <= 10 ? N : N <= 16 ? 8 : 10), paso = 460 / Math.max(cols, 8), r = paso * .35, filas = Math.ceil(N / cols);
  const n = cuenta(t, m.K(0, .1), m.K(0, .95) + .25, N), x0 = 552, y0 = 540;
  for (let k = 0; k < N; k++) { const x = x0 + (k % cols) * paso, y = y0 + Math.floor(k / cols) * paso, on = k < n; disco(x, y, r, on ? (p.color || C.ac) : C.panel, on ? null : C.pelo, 2); }
  txt(n + ' ' + (n === 1 ? (p.singular || '') : (p.plural || p.singular || '')), x0 - 16, y0 + filas * paso + 10, 44, { al: 'left', a: fin(t, m.K(0)), max: 480 });
  const d = p.division; if (!d || t < m.K(1)) return;
  txt(d.cuenta || '', 536, 762, 44, { al: 'left', a: fin(t, m.K(1)), max: 250 });
  escala(908, 748, pop(t, m.K(1, .42)), () => txt(d.resultado || '', 0, 0, 132, { serif: true, it: true, peso: 700, col: C.ac, max: 260 }));
  txt(d.etiqueta || '', 908, 830, 30, { peso: 700, col: C.gris, a: fin(t, m.K(1, .6)) });
};

// ---------- 4 · rejilla · total = filas × columnas, se pinta lo que se resta y late lo que sobra ----------
// pasos: 0 aparece la rejilla y el total · 1 las restas · 2 el resto y la pregunta
PASOS.rejilla = () => 3;
PANEL.rejilla = (t, p, m) => {
  const F = p.filas, Cn = p.columnas, restas = p.restas || [], colLibre = (p.resto && p.resto.color) || BIEN;
  const dentro = (r, f, c) => f >= r.filas[0] && f <= r.filas[1] && c >= r.columnas[0] && c <= r.columnas[1];
  const cuantas = r => (r.filas[1] - r.filas[0] + 1) * (r.columnas[1] - r.columnas[0] + 1);
  const total = F * Cn, libres = total - restas.reduce((a, r) => a + cuantas(r), 0), R = restas.length || 1;
  const f0 = j => .02 + j * (1.06 / R), fCuenta = .38 * 2 / R, fPinta = j => (.36 + .02 * j) * 2 / R;
  const dato = (x, n, et, col, a, op) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a;
    if (op) txt(op, x - 122, 262, 60, { col: C.gris, peso: 500 });
    txt(String(n), x, 262, 104, { serif: true, peso: 700, col, max: 190 }); txt(et, x, 338, 26, { peso: 700, col: C.gris, max: 230 }); ctx.restore(); };
  dato(170, cuenta(t, m.K(0, .15), m.K(0, .8), total), (p.total && p.total.etiqueta) || '', C.tinta, fin(t, m.K(0)));
  restas.forEach((r, j) => dato(R === 1 ? 540 : R === 2 ? 430 + j * 230 : 380 + j * 320 / (R - 1), cuenta(t, m.K(1, f0(j)), m.K(1, f0(j) + fCuenta), cuantas(r)), r.etiqueta || '', r.color, fin(t, m.K(1, j ? f0(j) - .03 : 0)), '−'));
  if (t >= m.K(2)) escala(905, 262, lerp(.6, 1, pop(t, m.K(2, .1))), () => { txt('=', -128, 0, 60, { col: C.gris, peso: 500 }); txt(String(cuenta(t, m.K(2, .1), m.K(2, .45), libres)), 0, 0, 132, { serif: true, it: true, peso: 700, col: colLibre, max: 200 }); });
  txt((p.resto && p.resto.etiqueta) || '', 905, 338, 26, { peso: 700, col: C.gris, a: fin(t, m.K(2, .1)) });
  const x0 = 150, y0 = 420, sep = 4, cw = 888 / Cn - sep, ch = Math.min(322 / F - sep, cw * 1.6), rot = p.rotulosFilas || '';
  for (let f = 0; f < F; f++) {
    if (rot[f]) txt(rot[f], 108, y0 + f * (ch + sep) + ch / 2, 26, { peso: 800, col: C.gris, a: fin(t, m.K(0, .05 + f * .04)) });
    for (let c = 0; c < Cn; c++) {
      const ap = prog(t, m.K(0, .05) + (c + f) * .028, m.K(0, .05) + (c + f) * .028 + .18); if (ap <= 0) continue;
      let col = C.pelo, libre = true;
      restas.forEach((r, j) => { if (!dentro(r, f, c)) return; libre = false; const idx = (f - r.filas[0]) * (r.columnas[1] - r.columnas[0] + 1) + (c - r.columnas[0]);
        if (t >= m.K(1, f0(j)) + idx * (m.D(1) * fPinta(j) / cuantas(r))) col = r.color; });
      const late = libre && t >= m.K(2, .1) + (c + f) * .012; if (late) col = colLibre;
      const x = x0 + c * (cw + sep), y = y0 + f * (ch + sep), g = late ? 1 + .06 * Math.sin(t * 5 + c * .4 + f) : 1;
      ctx.save(); ctx.globalAlpha *= ap * (late || col !== C.pelo ? 1 : .9); ctx.translate(x + cw / 2, y + ch / 2); ctx.scale(g * easeOut(ap), g * easeOut(ap)); caja(-cw / 2, -ch / 2, cw, ch, Math.min(7, cw / 4), col); ctx.restore();
    }
  }
  for (const c of p.marcasColumnas || []) txt(c + (p.sufijoColumnas || ''), x0 + c * (cw + sep) - (c === Cn ? 4 : 0), y0 - 22, 20, { peso: 700, col: C.gris, a: fin(t, m.K(0, .3)) });
  if (p.pregunta) txt(p.pregunta, 540, 800, 60, { serif: true, it: true, peso: 700, col: colLibre, a: fin(t, m.K(2, .55)), max: 960 });
};

// ---------- 5 · ramas · una cosa de la que salen muchas ----------
// pasos: 0 el origen, grande · 1 se hace a un lado y salen las ramas · 2 el remate «1 → N»
PASOS.ramas = p => p.remate ? 3 : 2;
PANEL.ramas = (t, p, m) => {
  const o = p.origen || {}, c2 = p.color2 || '#ff6fae', sal = p.salidas || [], n = sal.length;
  const mv = ease(prog(t, m.K(1) - .15, m.K(1) + .35)), vx = lerp(540, 250, mv), vy = 470, vs = lerp(1, .6, mv);
  escala(vx, vy, pop(t, m.K(0)) * vs, () => {
    caja(-260, -150, 520, 300, 26, C.panel, C.ac, 5);
    if ((o.tipo || 'pantalla') === 'pantalla') { poli([[-34, -46], [50, 0], [-34, 46]], C.ac);
      caja(-220, 104, 440, 10, 5, C.pelo); caja(-220, 104, 440 * ((t - m.K(0)) * .22 % 1), 10, 5, c2);
      if (o.marca) txt(o.marca, 212, -116, 24, { al: 'right', peso: 800, col: C.gris }); }
    else icono(o.icono, 0, 0, 92, C.ac, t);
  });
  txt(o.etiqueta || '', vx, vy + 190 * vs + 36, lerp(48, 36, mv), { a: fin(t, m.K(0, .3)), max: lerp(900, 400, mv) });
  if (t < m.K(1)) return;
  const ys = n === 1 ? [470] : n === 2 ? [340, 600] : n === 3 ? [305, 495, 660] : sal.map((_, k) => 290 + k * 380 / (n - 1));
  const en = k => m.K(1, sal[k].en ?? (n === 3 ? [.22, .52, .72][k] : .22 + k * .5 / Math.max(1, n - 1)));
  sal.forEach((s, k) => {
    const ini = en(k), y = ys[k], forma = FORMA[s.forma] ? s.forma : 'cuadro', cant = s.n || 1;
    trazo([[412, 470], [440, 470], [440, y], [470, y]], prog(t, ini - .2, ini + .1), C.pelo, 4);
    const ancho = ANCHO_FORMA[forma], pasoX = cant > 1 ? Math.min(ancho, 300 / (cant - 1)) : 0, e0 = cant > 1 && pasoX < ancho * .8 ? Math.max(.6, pasoX / (ancho * .8)) : 1;
    const xIni = forma === 'apilado' ? 535 : forma === 'aro' || forma === 'circulo' ? 506 : 520;
    for (let j = 0; j < cant; j++) escala(xIni + j * pasoX, y, pop(t, ini + j * (forma === 'aro' || forma === 'circulo' ? .09 : .12)) * e0, () => FORMA[forma](s.color || C.ac, c2));
    const a = fin(t, ini + .1); txt(String(cant), 858, y, 84, { al: 'left', serif: true, it: true, peso: 700, col: C.ac, a }); txt(s.etiqueta || '', 916, y + 6, 28, { al: 'left', peso: 700, a, max: 150 });
  });
  const r = p.remate; if (!r || t < m.K(2)) return;
  escala(540, 792, pop(t, m.K(2, .02)), () => caja(-456, -52, 912, 104, 52, C.panel, C.pelo, 2.5));
  txt(r.a || '', 300, 794, 46, { a: fin(t, m.K(2, .05)), max: 320 });
  flecha(470, 794, 548, 794, prog(t, m.K(2, .35), m.K(2, .5)), C.gris, 5);
  escala(770, 794, pop(t, m.K(2, .5)), () => txt(r.b || '', 0, 0, 50, { serif: true, it: true, peso: 700, col: C.ac, max: 400 }));
};

// ---------- 6 · escudo · 100 rayos salen de una fuente: unos rebotan en el escudo, otros pasan ----------
PANEL.escudo = (t, p, m) => {
  const cFuente = p.colorFuente || '#f0a13a', cEsc = p.colorEscudo || '#5aa7d6', cPasa = p.colorPasan || '#d94848', frenan = p.frenan ?? 97, nPasan = 100 - frenan;
  const PASAN = p.pasan || Array.from({ length: nPasan }, (_, j) => Math.floor((j + .6) * 100 / nPasan));
  const a = fin(t, m.K(0), .22); ctx.save(); ctx.globalAlpha *= a;
  icono(p.fuente || 'sol', 170, 400, 92, cFuente, t);
  const ex = 640; ctx.save(); ctx.strokeStyle = cEsc; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(ex + 330, 400, 360, Math.PI * .865, Math.PI * 1.135); ctx.stroke(); ctx.restore();
  if (p.etiquetaEscudo) escala(ex - 20, 222, pop(t, m.K(0, .04)), () => { const w = Math.max(184, medir(p.etiquetaEscudo, `800 34px ${SANS}`) + 60); caja(-w / 2, -32, w, 64, 32, cEsc); txt(p.etiquetaEscudo, 0, 3, 34, { col: '#ffffff', esp: 1 }); });
  caja(880, 250, 120, 300, 60, C.panel, C.pelo, 3); txt(p.sujeto || '', 940, 400, 44, { serif: true, it: true, peso: 700, col: C.gris, max: 104 });
  const ini = m.K(0, .12), ventana = m.D(0) * .62; let frenados = 0, pasaron = 0;
  for (let k = 0; k < 100; k++) {
    const sale = ini + ventana * k / 100, v = (t - sale) / .42; if (v < 0) continue;
    const yy = 262 + (hash2(k, 7) * 276), pasa = PASAN.includes(k), x1 = ex - 6 - Math.abs(yy - 400) * .09;
    if (v < 1) { const x = lerp(255, x1, v), y = lerp(400, yy, v), x2 = lerp(255, x1, Math.max(0, v - .22)), y2 = lerp(400, yy, Math.max(0, v - .22));
      ctx.strokeStyle = pasa ? cPasa : cFuente; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x, y); ctx.stroke(); continue; }
    if (pasa) { pasaron++; const w = clamp((v - 1) / .5); ctx.strokeStyle = cPasa; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1 + 20, yy); ctx.lineTo(lerp(x1 + 20, 874, w), yy); ctx.stroke(); }
    else { frenados++; const w = clamp((v - 1) / .35); if (w < 1) { ctx.save(); ctx.globalAlpha *= 1 - w; ctx.strokeStyle = cFuente; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x1 - 4, yy, 6 + 16 * w, 0, 7); ctx.stroke(); ctx.restore(); } }
  }
  const tf = p.textoFrenados || [], tp = p.textoPasan || ['pasa', 'pasan'];
  txt(frenados + ' %', 392, 690, 150, { serif: true, it: true, peso: 700, col: cEsc });
  txt(tf[0] || '', 392, 772, 28, { peso: 700, col: C.gris }); txt(tf[1] || '', 392, 806, 28, { peso: 800 });
  if (pasaron) { txt(String(pasaron), 820, 668, 92, { serif: true, it: true, peso: 700, col: cPasa }); txt(pasaron === 1 ? tp[0] : tp[1], 820, 734, 30, { peso: 700, col: C.gris }); }
  ctx.restore();
};

// ---------- 7 · barra · una barra que se llena hasta un porcentaje y la raya del 100 que no toca ----------
PANEL.barra = (t, p, m) => {
  const cBarra = p.colorBarra || '#5aa7d6', cTope = p.colorTope || '#d94848', v = (p.valor ?? 97) / 100, x = p.extra;
  const a = fin(t, m.K(0), .22); ctx.save(); ctx.globalAlpha *= a;
  txt(p.titulo1 || '', 540, 262, 64, { max: 960 });
  txt(p.titulo2 || '', 540, 346, 84, { serif: true, it: true, peso: 700, col: C.ac, max: 960 });
  const bx = 120, bw = 780, by = 500, bh = 76, pv = easeOut(prog(t, m.K(0, .02), m.K(0, .3)));
  caja(bx, by, bw, bh, 20, C.panel, C.pelo, 2.5);
  caja(bx, by, bw * v * pv, bh, 20, cBarra);
  txt(p.etiqueta || '', bx + 26, by + bh / 2 + 3, 36, { al: 'left', col: '#ffffff', a: fin(t, m.K(0, .2)), max: bw * v - 50 });
  const mas = prog(t, m.K(0, .32), m.K(0, .55));          // el poquito que suma lo siguiente (sin cifra si la fuente no la da)
  if (x && mas > 0) { const an = x.ancho ?? .017; ctx.save(); ctx.beginPath(); ctx.rect(bx + bw * v, by, bw * an * mas, bh); ctx.clip(); ctx.fillStyle = C.ac; ctx.fillRect(bx + bw * (v - .07), by, bw * .1 + bw * an, bh); ctx.restore();
    trazo([[bx + bw * (v + an / 2), by + bh + 12], [bx + bw * (v + an / 2), by + bh + 60], [bx + bw * (v - .07), by + bh + 60]], mas, C.ac, 4);
    txt(x.texto || '', bx + bw * (v - .07) - 14, by + bh + 62, 30, { al: 'right', peso: 700, col: C.ac, a: fin(t, m.K(0, .42)), max: bw * (v - .07) - 20 }); }
  const cien = prog(t, m.K(0, .6), m.K(0, .8));
  if (cien > 0) { ctx.save(); ctx.setLineDash([10, 10]); trazo([[bx + bw, by - 70], [bx + bw, by + bh + 26]], cien, cTope, 5); ctx.restore();
    txt(p.tope || '100 %', bx + bw + 6, by - 100, 40, { col: cTope, a: cien }); }
  if (p.remate) escala(540, 730, pop(t, m.K(0, .72)), () => { const w = Math.max(600, medir(p.remate, `800 42px ${SANS}`) + 110); caja(-w / 2, -48, w, 96, 48, C.tinta); txt(p.remate, 0, 3, 42, { col: C.fondo, max: 900 }); });
  ctx.restore();
};

// ---------- 8 · reloj · la aguja barre N horas y pinta la cuña ----------
PANEL.reloj = (t, p, m) => {
  const cCuna = p.colorCuna || '#5aa7d6', a = fin(t, m.K(0), .22), u = t - m.K(0); ctx.save(); ctx.globalAlpha *= a;
  const cx = 290, cy = 500, r = 190, giro = ease(prog(u, .25, 1.6)), a0 = -Math.PI / 2, a1 = a0 + giro * (p.horas ?? 2) * Math.PI / 6;
  disco(cx, cy, r, C.panel, C.tinta, 7);
  ctx.fillStyle = cCuna; ctx.globalAlpha *= .9; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r - 14, a0, a1); ctx.closePath(); ctx.fill(); ctx.globalAlpha = a;
  for (let k = 0; k < 12; k++) { const an = k * Math.PI / 6; ctx.strokeStyle = C.tinta; ctx.lineWidth = k % 3 ? 3 : 6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * (r - 26), cy + Math.sin(an) * (r - 26)); ctx.lineTo(cx + Math.cos(an) * (r - 10), cy + Math.sin(an) * (r - 10)); ctx.stroke(); }
  ctx.strokeStyle = C.tinta; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a1) * (r - 50), cy + Math.sin(a1) * (r - 50)); ctx.stroke();
  disco(cx, cy, 12, C.tinta);
  txt(p.ceja || '', 760, 300, 46, { peso: 700, col: C.gris, max: 500 });
  txt(p.antes || '', 760, 400, 70, { a: fin(t, m.K(0, .3)), max: 500 });
  escala(770, 540, pop(t, m.K(0, .5)), () => txt(p.grande || '', 0, 0, 122, { serif: true, it: true, peso: 700, col: C.ac, max: 500 }));
  (p.lineas || []).forEach((s, k) => txt(s, 760, 668 + k * 54, 44, { peso: 700, a: fin(t, m.K(0, .62)), max: 500 }));
  if (p.nota) txt(p.nota, 760, 778, 28, { peso: 700, col: C.gris, a: fin(t, m.K(0, .75)) });
  ctx.restore();
};

// ---------- 9 · fichas · ANTES (se apaga y se tacha) / HOY (entra con su palomita) ----------
PANEL.fichas = (t, p, m) => {
  const A = p.antes || {}, Hy = p.hoy || {}, hoy = m.K(0, p.corte ?? .52), ap = 1 - .65 * fin(t, hoy), la = A.lineas || [], lh = Hy.lineas || [];
  ctx.save(); ctx.globalAlpha *= fin(t, m.K(0), .2) * ap;
  caja(84, 230, 432, 520, 30, C.panel, C.pelo, 2.5);
  txt(A.etiqueta || 'ANTES', 300, 290, 26, { esp: 6, col: C.gris });
  const curva = [[150, 520], [230, 400], [330, 560], [450, 420]];        // un trazo con manijas, como en un programa de edición
  if (A.icono) icono(A.icono, 300, 470, 84, C.tinta, t);
  else { trazo(curva, prog(t, m.K(0, .08), m.K(0, .4)), C.tinta, 6); for (const [x, y] of curva) caja(x - 9, y - 9, 18, 18, 3, C.fondo, C.tinta, 3); }
  la.forEach((s, k) => txt(s, 300, 640 + k * 56, 52, { max: 400 }));
  ctx.restore();
  if (t > hoy) trazo([[120, 640 + (la.length - 1) * 28], [480, 640 + (la.length - 1) * 28]], prog(t, hoy, hoy + .3), MAL, 7);
  escala(780, 490, pop(t, hoy), () => {
    caja(-216, -260, 432, 520, 30, C.panel, C.ac, 4);
    txt(Hy.etiqueta || 'HOY', 0, -200, 26, { esp: 6, col: C.ac });
    txt(Hy.grande || '', 0, -70, 104, { serif: true, it: true, peso: 700, col: C.ac, max: 390 });
    lh.forEach((s, k) => txt(s, 0, 40 + k * 60, 50, { max: 400 }));
    palomita(0, 190, 50, prog(t, hoy + .45, hoy + .8), BIEN, 10);
  });
};

// ---------- 10 · lista · una pregunta y renglones que caen: los que no ✗ y el que sí ✓ ----------
PANEL.lista = (t, p, m) => {
  const a = fin(t, m.K(0), .22), filas = p.filas || [], n = filas.length, paso = n > 1 ? Math.min(140, 420 / (n - 1)) : 0, alto = Math.min(124, paso ? paso - 16 : 124);
  txt(p.titulo1 || '', 540, 232, 70, { a, max: 960 });
  txt(p.titulo2 || '', 540, 318, 78, { serif: true, it: true, peso: 700, col: C.suave || C.tinta, a, max: 960 });
  filas.forEach((f, k) => { const ini = m.K(0, f.en ?? (n > 1 ? .1 + k * .5 / (n - 1) : .2));
    escala(540, 452 + k * paso, pop(t, ini), () => {
      caja(-380, -alto / 2, 760, alto, alto / 2, f.ok ? C.ac : C.panel, f.ok ? null : C.pelo, 2.5);
      txt(f.txt, -320, 3, 52, { al: 'left', col: f.ok ? NEGRO : C.gris, max: 560 });
      if (f.ok) palomita(300, 4, 44, prog(t, ini + .25, ini + .55), NEGRO, 9); else equis(300, 2, 22, prog(t, ini + .25, ini + .6), MAL, 7);
    }); });
};

// ---------- 11 · mosaico · una ficha por bloque: icono + nombre, o la cifra de remate, o un cuadro de su toma ----------
function celdasDe(n, alto) {
  if (n === 1) return [[540, 460, 760, 440]];
  if (n === 2) return [[300, 450, 444, 400], [780, 450, 444, 400]];
  const y0 = alto === 240 ? 330 : 320, dy = alto === 240 ? 270 : 280, w = alto === 240 ? 440 : 444, out = [];
  for (let k = 0; k < n; k++) out.push([n === 3 && k === 2 ? 540 : 300 + (k % 2) * 480, y0 + (k >> 1) * dy, w, alto]);
  return out;
}
PANEL.mosaico = (t, p, m) => {
  const cel = p.celdas || [], conCifra = cel.some(c => c.cifra), pos = celdasDe(cel.length, conCifra || p.tomas ? 248 : 240), paso = conCifra || p.tomas ? m.D(0) * .13 : m.D(0) * .11;
  const ini = m.K(0, conCifra || p.tomas ? .04 : .06);
  cel.forEach((c, k) => { const b = INDICE_BLOQUE[c.bloque], T = b >= 0 ? TEMA_DE[b] : C, [cx, cy, w, h] = pos[k], fotos = p.tomas ? FOTOS[b] : null;
    const rot = (c.rotulo || (b >= 0 ? (GUION.bloques[b].rotulo || GUION.bloques[b].nombre) : '')).toUpperCase();
    escala(cx, cy, pop(t, ini + k * paso), () => {
      if (fotos && fotos.length) {                       // un cuadro (o un clip mudo en vaivén) de la toma de ese bloque
        const N = fotos.length, q = Math.floor(Math.max(0, t - ini - k * paso) * (p.cuadrosPorSegundo || 10)) % Math.max(1, 2 * N - 2), im = fotos[q < N ? q : 2 * N - 2 - q];
        ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 30); ctx.clip(); fotoCover(im, -w / 2, -h / 2, w, h, .5, .28);
        const g = ctx.createLinearGradient(0, h / 2 - 150, 0, h / 2); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.78)'); ctx.fillStyle = g; ctx.fillRect(-w / 2, h / 2 - 150, w, 150); ctx.restore();
        caja(-w / 2, -h / 2, w, h, 30, null, T.ac, 4);
        const wr = medir(rot, `800 20px ${SANS}`) + rot.length * 3 + 30; caja(-w / 2 + 14, -h / 2 + 14, wr, 38, 19, T.fondo); txt(rot, -w / 2 + 29, -h / 2 + 34, 20, { al: 'left', esp: 3, col: T.tinta });
        if (c.cifra) txt(c.cifra, -w / 2 + 24, h / 2 - 44, 64, { al: 'left', serif: true, it: true, peso: 700, col: '#ffffff', max: w * .5 });
        if (c.sub) txt(c.sub, w / 2 - 22, h / 2 - 34, 24, { al: 'right', peso: 700, col: '#ffffff', max: w * .42 });
        return;
      }
      caja(-w / 2, -h / 2, w, h, 30, T.fondo, esClaro(T.fondo) ? null : T.pelo, 2.5);
      if (c.cifra) { txt(rot, -w / 2 + 32, -h / 2 + 40, 22, { al: 'left', esp: 4, col: T.gris });
        txt(c.cifra, 0, 4, 104, { serif: true, it: true, peso: 700, col: T.ac, max: w - 60 }); txt(c.sub || '', 0, 82, 28, { peso: 700, col: T.tinta, max: w - 40 });
        if (p.tomas && b >= 0) { const et = 'toma ' + (b + 1); disco(w / 2 - 44 - medir(et, `700 20px ${SANS}`), -h / 2 + 40, 6, MAL); txt(et, w / 2 - 30, -h / 2 + 41, 20, { al: 'right', peso: 700, col: T.gris }); } }   // sin tomas todavía: marca dónde irá cada una
      else { const s = c.texto || rot, ant = C; C = T; icono(c.icono, -124, 0, c.tamIcono || 50, c.colorIcono || T.ac, t); C = ant; txt(s, -22, 4, s.length > 6 ? 38 : 46, { al: 'left', col: T.tinta, esp: 2, max: w / 2 }); }
    }); });
  const pie = p.pie; if (!pie) return;
  if (typeof pie === 'string') txt(pie, p.pieX || 540, conCifra || p.tomas ? 796 : 778, 56, { serif: true, it: true, peso: 700, col: C.ac, a: fin(t, m.K(0, .55)), max: 900 });
  else { const wa = medir(pie.a, `800 54px ${SANS}`), wb = medir(pie.b, `italic 700 62px ${SERIF}`), x0 = 540 - (wa + 20 + wb) / 2;
    txt(pie.a, x0, 796, 54, { al: 'left', a: fin(t, m.K(0, .1)) }); txt(pie.b, x0 + wa + 20, 796, 62, { al: 'left', serif: true, it: true, peso: 700, col: C.ac, a: fin(t, m.K(0, .6)) }); }
};

// ---------- 12 · comentario · el cierre: la palabra gigante, la caja donde se escribe sola y el mensaje que llega ----------
PANEL.comentario = (t, p, m) => {
  const pal = p.palabra || GUION.palabraCta || '', L = pal.length, msj = p.mensaje || {};
  const escribe = m.K(0, .36), n = Math.min(L, Math.floor(prog(t, escribe, escribe + .7) * (L + .99))), ya = t > escribe + .95;
  txt(p.arriba || 'Comenta', 540, 232, 66, { a: fin(t, m.K(0), .2) });
  escala(540, 400, pop(t, m.K(0, .3), .5), () => { glow(0, 0, 420, rgbDe(C.ac).join(','), .16); txt(pal, 0, 0, 216, { serif: true, it: true, peso: 700, col: C.ac, max: 940 }); });
  escala(540, 606, pop(t, m.K(0, .22)), () => { caja(-420, -56, 840, 112, 56, C.panel, ya ? C.ac : C.pelo, 3);
    if (n === 0) txt(p.vacio || 'Agrega un comentario…', -372, 3, 38, { al: 'left', peso: 600, col: C.gris });
    else txt(pal.slice(0, n), -372, 4, 52, { al: 'left', esp: 3 });
    if (n > 0 && n < L && Math.floor(t * 6) % 2) caja(-372 + medir(pal.slice(0, n), `800 52px ${SANS}`) + n * 3 + 6, -26, 5, 52, 2, C.ac);
    disco(360, 0, 38, ya ? BIEN : C.ac);
    if (ya) palomita(360, 0, 30, prog(t, escribe + .95, escribe + 1.2), NEGRO, 7); else trazo([[360, 16], [360, -16], [346, -2], [360, -16], [374, -2]], 1, NEGRO, 6); });
  escala(540, 764, pop(t, m.K(0, .62)), () => { caja(-420, -66, 840, 132, 30, NEGRO, C.pelo, 2.5);
    caja(-392, -40, 80, 80, 20, C.ac); poli([[-362, -18], [-336, 0], [-362, 18]], NEGRO);
    txt(msj.ceja || 'TE LLEGÓ AHORA MISMO', -286, -24, 22, { al: 'left', esp: 3, col: '#a1a1aa' });
    txt(msj.txt || '', -286, 20, 36, { al: 'left', col: '#f4f1ea', max: 680 }); });
};
const SALTO_MASCOTA = { comentario: [.62, 1.4] };      // la mascota brinca cuando llega el mensaje

// ---------- 13 · voz · el gancho: tu voz → una flecha → un tablero que se arma ----------
PANEL.voz = (t, p, m) => {
  const u = t - m.K(0);
  txt(p.titulo1 || '', 540, 228, 96, { max: 980 });                    // el primer cuadro ya trae el gancho escrito
  txt(p.titulo2 || '', 540, 340, 104, { serif: true, it: true, peso: 700, col: C.ac, max: 1000 });
  caja(84, 500, 300, 250, 28, C.panel, C.pelo, 2.5);
  txt(p.etiquetaVoz || 'TU VOZ', 234, 540, 22, { peso: 800, esp: 4, col: C.gris });
  for (let k = 0; k < 15; k++) { const am = 18 + 70 * Math.abs(Math.sin(u * 7 + k * 1.3) * Math.sin(u * 2.2 + k * .5)); caja(114 + k * 17, 640 - am / 2, 9, am, 4.5, k % 4 === 1 ? C.ac : C.tinta); }
  flecha(402, 625, 500, 625, prog(u, .25, .6), C.ac, 6);
  caja(520, 440, 476, 370, 28, C.panel, C.pelo, 2.5);
  txt(p.etiquetaTablero || 'SE ARMA SOLO', 758, 480, 22, { peso: 800, esp: 4, col: C.gris });
  [150, 96, 190, 128].forEach((h, k) => { const q = easeOut(prog(u, .55 + k * .28, .85 + k * .28)); caja(556 + k * 62, 740 - h * q, 44, h * q, 8, k === 2 ? C.ac : C.tinta); });
  trazo([[812, 706], [860, 660], [900, 684], [960, 590]], prog(u, 1.5, 2.3), C.ac, 7);
  if (u > 2.2) disco(960, 590, 11 * pop(u, 2.2, .3), C.ac);
  trazo([[556, 770], [960, 770]], prog(u, .4, .9), C.gris, 3);
};

// ---------- 14 · pastillas · «yo: esto» → «la herramienta: esto otro» → una nota ----------
PANEL.pastillas = (t, p, m) => {
  const A = p.a || {}, Bp = p.b || {};
  escala(540, 372, pop(t, m.K(0, .05)), () => { caja(-380, -74, 760, 148, 74, C.panel, C.pelo, 3);
    icono(A.icono || 'microfono', -302, 6, 46, C.tinta, t); txt(A.txt || '', -236, 4, 56, { al: 'left', max: 580 }); });
  escala(540, 566, pop(t, m.K(0, .52)), () => { caja(-420, -84, 840, 168, 84, C.ac);
    const wc = Bp.grande ? medir(Bp.grande, `italic 700 78px ${SERIF}`) + 22 : 0, wr = medir(Bp.txt || '', `800 46px ${SANS}`), k = Math.min(1, 760 / (wc + wr)), x0 = -(wc + wr) * k / 2;
    ctx.save(); ctx.scale(k, k);
    if (Bp.grande) txt(Bp.grande, x0 / k, 2, 78, { al: 'left', serif: true, it: true, peso: 700, col: NEGRO }); txt(Bp.txt || '', x0 / k + wc, 6, 46, { al: 'left', col: NEGRO }); ctx.restore(); });
  if (p.nota) { flecha(540, 668, 540, 748, prog(t, m.K(0, .75), m.K(0, .95)), C.ac, 7); txt(p.nota, 540, 800, 40, { peso: 700, col: C.gris, a: fin(t, m.K(0, .8)), max: 960 }); }
};

// ---------- 15 · frase · la frase para llevarse, apilada: dos líneas, flecha, la palabra fuerte, una más ----------
PANEL.frase = (t, p, m) => {
  txt(p.l1 || '', 540, 262, 78, { a: fin(t, m.K(0), .2), max: 980 });
  txt(p.l2 || '', 540, 370, 104, { serif: true, it: true, peso: 700, col: C.suave || C.tinta, a: fin(t, m.K(0, .3)), max: 980 });
  flecha(540, 452, 540, 536, prog(t, m.K(0, .52), m.K(0, .66)), C.gris, 6);
  escala(540, 650, pop(t, m.K(0, .62)), () => txt(p.grande || '', 0, 0, 150, { serif: true, it: true, peso: 700, col: C.ac, max: 980 }));
  txt(p.l4 || '', 540, 780, 64, { a: fin(t, m.K(0, .8)), max: 980 });
};
