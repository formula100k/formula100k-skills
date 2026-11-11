// ============================================================================
// MOTOR «expediente de inteligencia» v3 (10-nov-2026) · no depende del caso: el caso vive en pieza.src.html
//
// Qué trae:
//   · cámara viva sobre fotos y capturas reales (foto, lamina, clip) con su «mapa» foto → pantalla
//   · ANCLAS: cajas en fracciones de la foto. Toda etiqueta, mira o visor se cuelga de un ancla, nunca de un x,y a ojo
//   · etiqueta / mira / visor / rotulo / cifra / titulo / subtitulo: cada uno apunta su caja en el REGISTRO
//   · revisarCuadro(f): con el registro comprueba zona segura, encimados y que cada ancla se vea → lo usa revisar.mjs
//   · transiciones entre escenas (barrido, lado, empuje) y eventos de sonido (on)
// Antes de este archivo la pieza define: W, H, FPS, PAUSA, COLA, LINEAS (y carga nucleo.js). Opcionales: TIEMPOS, CARAS.
// ============================================================================

// ---------- zona segura ----------
const ZONA = { x0: 60, x1: 1020, y0: 220, y1: 1650 };
const SUB_Y = 1400;                       // centro del subtítulo
const C = { negro: '#060606', hueso: '#EDEDED', gris: '#8C8C8C', grisOsc: '#3A3A3A', amarillo: '#FFD21F' };
const SANS = '"Work Sans", Helvetica, Arial, sans-serif', MONO = '"JetBrains Mono", Menlo, monospace', CIFRA = '"Inter Tight", Helvetica, Arial, sans-serif';

// ---------- tiempos: una frase = una escena ----------
const TT = (typeof window.TIEMPOS !== 'undefined' && window.TIEMPOS) || null;
if (TT) LINEAS.forEach((l, i) => { if (TT[i]) l.d = TT[i].d; });
const INICIOS = []; { let a = 0; for (const l of LINEAS) { INICIOS.push(a); a += l.d + PAUSA; } }
const DUR = INICIOS.at(-1) + LINEAS.at(-1).d + COLA;
const TRAMO = i => (i < LINEAS.length - 1 ? INICIOS[i + 1] - INICIOS[i] : LINEAS[i].d + COLA);   // lo que dura la escena en pantalla
const limpia = s => s.replace(/\*/g, '');
const norma = s => limpia(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9$]/g, '');
// palabras de cada frase con su hora (de whisper si hay tiempos.js; si no, repartidas por cantidad de letras)
const PALABRAS = LINEAS.map((l, i) => {
  const ws = l.txt.split(' '); let clave = false;
  const out = ws.map(w => { const abre = w.startsWith('*'), cierra = /\*[.,:;?!]*$/.test(w.slice(1)) || (abre && w.indexOf('*', 1) > 0);
    if (abre) clave = true; const o = { s: limpia(w), clave }; if (cierra) clave = false; return o; });
  const tw = TT && TT[i] && TT[i].w && TT[i].w.length === out.length ? TT[i].w : null;
  if (tw) out.forEach((o, k) => { o.t0 = tw[k][0]; o.t1 = tw[k][1]; });
  else { const pesos = out.map(o => o.s.length + 2), tot = pesos.reduce((a, b) => a + b, 0); let acc = 0;
    out.forEach((o, k) => { o.t0 = l.d * .96 * acc / tot; acc += pesos[k]; o.t1 = l.d * .96 * acc / tot; }); }
  return out;
});

// ---------- estado del cuadro ----------
let CUR = { i: 0, u: 0, d: 1, tramo: 1 };   // escena, segundos dentro de ella, duración de la frase, duración en pantalla
let MUDO = false;                            // true mientras se pinta la escena anterior dentro de una transición
let REG = [], ETQ = [], EN_TRANSICION = false;
const EVENTOS = new Map();                   // hora absoluta → tipo de sonido (lo lee revisar.mjs para la mezcla)
window.EVENTOS = EVENTOS;
function reg(tipo, nombre, x0, y0, x1, y1, extra = {}) { if (!MUDO) REG.push({ tipo, nombre, x0, y0, x1, y1, ...extra }); }
// hora (s dentro de la frase) en que se dice una palabra: «cada cambio cae en la palabra que lo nombra»
function T(palabra, n = 0) {
  const b = norma(palabra), ps = PALABRAS[CUR.i]; let k = 0;
  for (const p of ps) if (norma(p.s) === b && k++ === n) return p.t0;      // primero la palabra exacta
  k = 0; for (const p of ps) if (norma(p.s).includes(b) && k++ === n) return p.t0;
  console.warn(`T('${palabra}') no está en la frase ${CUR.i + 1}`); return CUR.d * .5;
}
// ¿ya llegó el segundo t de la escena? De paso apunta el golpe de sonido (grave y corto) para la mezcla
function on(t, sonido = 'pop') {
  if (!MUDO && sonido) EVENTOS.set((INICIOS[CUR.i] + t).toFixed(2), sonido);
  return CUR.u >= t;
}
const viva = q => .35 * clamp(q) + .65 * ease(q);          // avance de cámara: nunca se queda quieta
const camara = (a, b, q) => a.map((v, k) => lerp(v, b[k], viva(q)));

// ---------- texto ----------
function txt(s, x, y, tam, { peso = 500, color = C.hueso, al = 'left', fam = SANS, esp = 0, sombra = 0 } = {}) {
  ctx.save(); ctx.font = `${peso} ${tam}px ${fam}`; ctx.fillStyle = color; ctx.textAlign = al; ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = esp + 'px';
  if (sombra) { ctx.shadowColor = `rgba(0,0,0,${sombra})`; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3; }
  ctx.fillText(s, x, y); ctx.restore();
}
function ancho(s, tam, peso, fam, esp = 0) { ctx.save(); ctx.font = `${peso} ${tam}px ${fam}`; ctx.letterSpacing = esp + 'px'; const w = ctx.measureText(s).width; ctx.restore(); return w; }
function linea(x0, y0, x1, y1, { color = C.hueso, a = .8, w = 2, dash = null } = {}) {
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = a; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
}
function circ(x, y, r, { color = C.hueso, a = .85, w = 2, dash = null, fill = null } = {}) {
  ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash); ctx.stroke(); }
  ctx.restore();
}
const fmt = n => Math.round(n).toLocaleString('de-DE');

// ---------- imágenes reales con cámara ----------
// Todas devuelven un «mapa»: m(fx, fy) → punto en pantalla · m.ancla(nombre, [x, y, w, h], margen) → ancla en pantalla
function mapa(x0, y0, w, h, nombreFoto) {
  const M = ctx.getTransform();
  const m = (fx, fy) => { const p = M.transformPoint(new DOMPoint(x0 + fx * w, y0 + fy * h)); return [p.x, p.y]; };
  m.ancla = (nombre, [x, y, a, b], margen = 0) => { const [ax, ay] = m(x, y), [bx, by] = m(x + a, y + b);
    const mx = (bx - ax) * margen, my = (by - ay) * margen; return { n: nombre, foto: nombreFoto, c: [ax - mx, ay - my, bx + mx, by + my] }; };
  return m;
}
const GRIS = (br = .8, con = 1.2) => `grayscale(1) contrast(${con}) brightness(${br})`;
// foto a pantalla completa. cam = [fx, fy, z]: el punto (fx,fy) de la foto va a (sx,sy) y z es el zoom sobre «cubrir».
// Nunca deja borde vacío: si hace falta, corre la foto (por eso (fx,fy) puede no caer exacto en (sx,sy): usa el mapa).
function foto(im, cam, { br = .78, con = 1.22, sx = W / 2, sy = H / 2, nombre = '' } = {}) {
  const [fx, fy, z] = cam, e = Math.max(W / im.width, H / im.height) * Math.max(1, z), w = im.width * e, h = im.height * e;
  const x0 = clamp(sx - fx * w, W - w, 0), y0 = clamp(sy - fy * h, H - h, 0);
  ctx.save(); ctx.filter = GRIS(br, con); ctx.drawImage(im, x0, y0, w, h); ctx.restore();
  return mapa(x0, y0, w, h, nombre);
}
// zoom mínimo para que el punto fy de la foto pueda bajar hasta sy sin dejar hueco arriba (gancho: la cara va DEBAJO del bloque)
const zoomPara = (im, fy, sy) => sy / (fy * im.height * Math.max(W / im.width, H / im.height));
// captura o foto como lámina plana (la pantalla real): esquina (x, y), ancho w, en coordenadas de escena (respeta escena())
function lamina(im, x, y, w, { br = .95, con = 1.08, borde = true, nombre = '', recorte = null } = {}) {
  const [rx, ry, rw, rh] = recorte || [0, 0, 1, 1], h = w * (im.height * rh) / (im.width * rw);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14; ctx.fillStyle = '#111'; ctx.fillRect(x, y, w, h); ctx.restore();
  ctx.save(); ctx.filter = GRIS(br, con); ctx.drawImage(im, rx * im.width, ry * im.height, rw * im.width, rh * im.height, x, y, w, h); ctx.restore();
  if (borde) { ctx.save(); ctx.strokeStyle = 'rgba(237,237,237,.45)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h); ctx.restore(); }
  return mapa(x - rx * w / rw, y - ry * h / rh, w / rw, h / rh, nombre);
}
// cámara sobre una escena hecha de láminas: el punto (cx,cy) de la escena va al centro (o a sx,sy) con zoom z
function escena(cx, cy, z, pinta, { sx = W / 2, sy = H / 2 } = {}) {
  ctx.save(); ctx.translate(sx, sy); ctx.scale(z, z); ctx.translate(-cx, -cy); const r = pinta(); ctx.restore(); return r;
}
function fondo(cx = W / 2, cy = H * .45) {      // negro con una luz suave, para las escenas de láminas
  ctx.fillStyle = C.negro; ctx.fillRect(0, 0, W, H);
  ctx.save(); const g = ctx.createRadialGradient(cx, cy, 60, cx, cy, 1000);
  g.addColorStop(0, '#262626'); g.addColorStop(.6, '#101010'); g.addColorStop(1, '#040404'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function vineta(f = .85, cx = W / 2, cy = H * .45, r0 = 300, r1 = 1200) {
  ctx.save(); const g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${f})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function penumbra(y0, y1, a = .6) {             // degradado negro suave, SIN bordes, para que un texto se lea sobre una foto
  ctx.save(); const g = ctx.createLinearGradient(0, y0, 0, y1), m = (x) => `rgba(0,0,0,${a * x})`;
  g.addColorStop(0, m(0)); g.addColorStop(.35, m(1)); g.addColorStop(.65, m(1)); g.addColorStop(1, m(0)); ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0); ctx.restore();
}
let TRAMA = null;
function trama() {                               // las líneas finas diagonales de monitor de la referencia
  if (!TRAMA) { const m = document.createElement('canvas'); m.width = m.height = 6; const g = m.getContext('2d');
    g.strokeStyle = 'rgba(255,255,255,.045)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 6); g.lineTo(6, 0); g.stroke(); TRAMA = m; }
  ctx.save(); ctx.fillStyle = ctx.createPattern(TRAMA, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}
// cuadro de un clip (lista de fotos a 15 por segundo); al acabarse sostiene el último y la cámara sigue
const CLIP_FPS = 15;
const idxClip = (lista, u) => Math.min(lista.length - 1, Math.max(0, Math.floor(u * CLIP_FPS)));
// ancla de la cara completa (de caras.js, Vision): la caja de la cara agrandada para que entre el pelo y el mentón
function cara(m, cajaCara, quien) {
  const [x, y, w, h] = cajaCara; return m.ancla(quien, [x - w * .1, y - h * .24, w * 1.2, h * 1.32]);
}

// ---------- piezas HUD (todas en coordenadas de pantalla y todas se apuntan en el registro) ----------
function visible(c) {       // fracción del ancla que está dentro del cuadro
  const [x0, y0, x1, y1] = c, a = Math.max(1, (x1 - x0) * (y1 - y0));
  return Math.max(0, Math.min(x1, W) - Math.max(x0, 0)) * Math.max(0, Math.min(y1, H) - Math.max(y0, 0)) / a;
}
// mira: un círculo que abraza el ancla ENTERA (la cara completa), con cruz. p = 0→1 la cierra sobre el objetivo
function mira(an, p = 1, a = .9) {
  const [x0, y0, x1, y1] = an.c, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r0 = Math.max(x1 - x0, y1 - y0) * .54, r = r0 * lerp(1.7, 1, easeOut(p));
  circ(cx, cy, r, { a, w: 2.5 }); circ(cx, cy, r * 1.09, { a: a * .4, w: 1.5, dash: [3, 9] });
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) linea(cx + dx * r * .86, cy + dy * r * .86, cx + dx * r * 1.2, cy + dy * r * 1.2, { a, w: 2 });
  an.r = r; reg('mira', an.n, cx - r, cy - r, cx + r, cy + r, { ancla: an });
}
// visor: esquinas alrededor del ancla (para cosas que no son caras: un precio, una fecha, una pila de cajas)
function visor(an, p = 1, { color = C.hueso, a = .95, largo = 34, w = 3 } = {}) {
  const [X0, Y0, X1, Y1] = an.c, k = lerp(1.5, 1, easeOut(p)), cx = (X0 + X1) / 2, cy = (Y0 + Y1) / 2;
  const x0 = cx - (cx - X0) * k - 8, x1 = cx + (X1 - cx) * k + 8, y0 = cy - (cy - Y0) * k - 8, y1 = cy + (Y1 - cy) * k + 8, L = Math.min(largo, (x1 - x0) * .3, (y1 - y0) * .45);
  for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { linea(x, y, x + dx * L, y, { a, w, color }); linea(x, y, x, y + dy * L, { a, w, color }); }
  reg('visor', an.n, x0, y0, x1, y1, { ancla: an });
}
// etiqueta HUD: cajita mono con borde fino + segunda línea gris, unida por una línea guía al ANCLA que nombra.
// lado: 'der' | 'izq' | 'arriba' | 'abajo' (dónde va la cajita respecto del ancla) · sep: separación · corre: ajuste a lo largo
function etiqueta(an, l1, l2 = '', { lado = 'der', sep = 60, corre = 0 } = {}) {
  const T1 = 28, T2 = 21, w1 = ancho(l1, T1, 500, MONO, 3), w2 = l2 ? ancho(l2, T2, 400, MONO, 3) : 0, bw = Math.max(w1, w2) + 36, bh = l2 ? 92 : 54;
  const [x0, y0, x1, y1] = an.c, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rr = an.r || 0;
  let x, y;
  if (lado === 'der') { x = (rr ? cx + rr : x1) + sep; y = cy - bh / 2 + corre; }
  else if (lado === 'izq') { x = (rr ? cx - rr : x0) - sep - bw; y = cy - bh / 2 + corre; }
  else if (lado === 'arriba') { x = cx - bw / 2 + corre; y = (rr ? cy - rr : y0) - sep - bh; }
  else { x = cx - bw / 2 + corre; y = (rr ? cy + rr : y1) + sep; }
  x = clamp(x, ZONA.x0, ZONA.x1 - bw); y = clamp(y, ZONA.y0, ZONA.y1 - bh);
  // línea guía: del borde del ancla (o del círculo de la mira) al borde de la cajita
  const lx = clamp(cx, x, x + bw), ly = clamp(cy, y, y + bh);
  let px, py;
  if (rr) { const d = Math.hypot(lx - cx, ly - cy) || 1; px = cx + (lx - cx) / d * rr; py = cy + (ly - cy) / d * rr; }
  else { px = clamp(lx, x0, x1); py = clamp(ly, y0, y1); }
  linea(px, py, lx, ly, { a: .75, w: 2 }); circ(px, py, 5, { fill: C.hueso, a: 1 });
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.62)'; ctx.fillRect(x, y, bw, bh); ctx.strokeStyle = 'rgba(237,237,237,.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, bw, bh); ctx.restore();
  txt(l1, x + 18, y + 37, T1, { fam: MONO, esp: 3 });
  if (l2) txt(l2, x + 18, y + 73, T2, { fam: MONO, color: C.gris, esp: 3, peso: 400 });
  reg('etiqueta', l1, x, y, x + bw, y + bh, { ancla: an });
  if (!MUDO) ETQ.push({ etiqueta: l1 + (l2 ? ' / ' + l2 : ''), senala: an.n, foto: an.foto || '', se_ve: +visible(an.c).toFixed(2) });
}
// rótulo sin línea guía (contexto: lugar, fecha, fuente). No señala nada, así que no puede señalar mal
function rotulo(l1, l2, x, y, al = 'left') {
  const T1 = 28, T2 = 21, w = Math.max(ancho(l1, T1, 500, MONO, 4), l2 ? ancho(l2, T2, 400, MONO, 4) : 0);
  txt(l1, x, y, T1, { fam: MONO, esp: 4, al, sombra: .8 });
  if (l2) txt(l2, x, y + 36, T2, { fam: MONO, esp: 4, al, color: '#A8A8A8', peso: 400, sombra: .8 });
  const xa = al === 'left' ? x : al === 'center' ? x - w / 2 : x - w;
  reg('rotulo', l1, xa, y - 28, xa + w, y + (l2 ? 44 : 8));
}
// cifra gigante (cuenta) con su rótulo debajo
function cifra(s, y, { tam = 190, label = '', l2 = '' } = {}) {
  let t = tam; while (ancho(s, t, 800, CIFRA, -2) > ZONA.x1 - ZONA.x0 - 20) t -= 4;
  txt(s, W / 2, y, t, { fam: CIFRA, peso: 800, al: 'center', esp: -2, sombra: .7 });
  const w = ancho(s, t, 800, CIFRA, -2); reg('cifra', s, W / 2 - w / 2, y - t * .78, W / 2 + w / 2, y + 8);
  if (label) rotulo(label, l2, W / 2, y + 62, 'center');
}
// título grande centrado (una palabra o frase corta); se achica solo para no salirse
function titulo(s, y, { tam = 150, color = C.hueso, fam = CIFRA, peso = 800 } = {}) {
  let t = tam; while (ancho(s, t, peso, fam, -1) > ZONA.x1 - ZONA.x0 - 20) t -= 4;
  txt(s, W / 2, y, t, { fam, peso, al: 'center', esp: -1, color, sombra: .75 });
  const w = ancho(s, t, peso, fam, -1); reg('titulo', s, W / 2 - w / 2, y - t * .78, W / 2 + w / 2, y + t * .06);
}
// barra de avance fina (día 1 → día 2, inventario que se vacía…)
function barra(x, y, w, p, { izq = '', der = '' } = {}) {
  ctx.save(); ctx.strokeStyle = 'rgba(237,237,237,.55)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, 18); ctx.fillStyle = C.hueso; ctx.fillRect(x + 3, y + 3, (w - 6) * clamp(p), 12); ctx.restore();
  if (izq) txt(izq, x, y + 52, 21, { fam: MONO, esp: 3, color: '#A8A8A8', sombra: .8 });
  if (der) txt(der, x + w, y + 52, 21, { fam: MONO, esp: 3, color: '#A8A8A8', al: 'right', sombra: .8 });
  reg('barra', izq || 'barra', x, y, x + w, y + (izq || der ? 60 : 18));
}
// línea de escaneo que baja una vez (al entrar un plano dentro de la escena)
function barrido(t, dur = .4) { if (t < 0 || t > dur) return; const y = lerp(ZONA.y0, ZONA.y1, easeOut(t / dur)); linea(0, y, W, y, { a: .5 * (1 - t / dur), w: 2 }); }

// ---------- subtítulo: SIN caja ni placa. Texto suelto, 1 a 3 palabras, la clave en amarillo y más grande ----------
const TROZOS = PALABRAS.map(ps => { const out = []; let cur = [];
  for (const p of ps) { const largo = cur.map(c => c.s).join(' ').length;
    if (cur.length && (cur.length >= 3 || largo + p.s.length > 17 || /[.,:;?!]$/.test(cur.at(-1).s) || cur.at(-1).clave !== p.clave)) { out.push(cur); cur = []; }
    cur.push(p); }
  if (cur.length) out.push(cur); return out; });
function subtitulo(i, u) {
  const tz = TROZOS[i]; let k = -1; tz.forEach((t, j) => { if (u >= t[0].t0 - .04) k = j; });
  if (k < 0 || u > LINEAS[i].d + .12) return;
  const partes = tz[k], NORMAL = 60, CLAVE = 84;
  // si un título grande en pantalla ya dice estas mismas palabras, el subtítulo no las repite debajo
  const dichas = new Set(REG.filter(r => r.tipo === 'titulo').flatMap(r => r.nombre.split(' ').map(norma)));
  if (dichas.size && partes.filter(p => dichas.has(norma(p.s))).length / partes.length >= .6) return;
  ctx.save(); ctx.textBaseline = 'alphabetic';
  const f = p => p.clave ? `800 ${CLAVE}px ${CIFRA}` : `600 ${NORMAL}px ${SANS}`;
  ctx.font = `600 ${NORMAL}px ${SANS}`; const sp = ctx.measureText(' ').width + 4;
  const lim = p => (p.clave ? p.s.toUpperCase() : p.s).replace(/[.,:;]+$/, '');
  const ws = partes.map(p => { ctx.font = f(p); return ctx.measureText(lim(p)).width; }), tot = ws.reduce((a, b) => a + b, 0) + sp * (partes.length - 1);
  let x = W / 2 - tot / 2; const y = SUB_Y + 22;
  ctx.shadowColor = 'rgba(0,0,0,.85)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 4;
  partes.forEach((p, j) => { ctx.font = f(p); ctx.fillStyle = p.clave ? C.amarillo : '#FFFFFF'; const s = lim(p);
    ctx.fillText(s, x, y); ctx.fillText(s, x, y); x += ws[j] + sp; });
  ctx.restore();
  reg('subtitulo', partes.map(p => p.s).join(' '), W / 2 - tot / 2, y - 70, W / 2 + tot / 2, y + 18);
}

// ---------- globo de puntos (oscuro: los subtítulos se leen sin caja) ----------
const rad = Math.PI / 180;
function proy(lon, lat, lon0, lat0, R, cx, cy) {
  const l = (lon - lon0) * rad, p = lat * rad, p0 = lat0 * rad;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  return [cx + R * Math.cos(p) * Math.sin(l), cy - R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)), cosc];
}
function globo(lon0, lat0, R = 520, cx = 540, cy = 900) {
  fondo(cx, cy);
  ctx.save(); const g = ctx.createRadialGradient(cx - R * .3, cy - R * .3, R * .2, cx, cy, R * 1.05);
  g.addColorStop(0, '#2c2c2c'); g.addColorStop(1, '#0e0e0e'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  circ(cx, cy, R, { a: .35, w: 1.5 });
  for (const [lon, lat] of TIERRA) { const [x, y, c] = proy(lon, lat, lon0, lat0, R, cx, cy); if (c <= 0) continue;
    ctx.fillStyle = `rgba(225,225,225,${.2 + .65 * c})`; const s = 2 + 2.4 * c; ctx.fillRect(x - s / 2, y - s / 2, s, s); }
  return (lon, lat) => proy(lon, lat, lon0, lat0, R, cx, cy);
}
function arcoGlobo(a, b, p, P) {   // círculo máximo punteado entre dos ciudades
  const v = ([lo, la]) => [Math.cos(la * rad) * Math.cos(lo * rad), Math.cos(la * rad) * Math.sin(lo * rad), Math.sin(la * rad)];
  const A = v(a), B = v(b), om = Math.acos(A[0] * B[0] + A[1] * B[1] + A[2] * B[2]), n = 80, pts = [];
  for (let i = 0; i <= n * clamp(p); i++) { const t = i / n, s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om);
    const x = s1 * A[0] + s2 * B[0], y = s1 * A[1] + s2 * B[1], z = s1 * A[2] + s2 * B[2];
    const [px, py, c] = P(Math.atan2(y, x) / rad, Math.asin(z) / rad); if (c > 0) pts.push([px, py]); }
  ctx.save(); ctx.strokeStyle = C.hueso; ctx.lineWidth = 3.5; ctx.setLineDash([5, 11]); ctx.beginPath();
  pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
}
function marcaGlobo(P, lon, lat, nombre) {   // punto de una ciudad → ancla para colgarle su etiqueta
  const [x, y, c] = P(lon, lat); if (c <= 0) return null;
  circ(x, y, 9, { fill: C.hueso, a: 1 }); circ(x, y, 24, { a: .7, w: 1.5 });
  return { n: nombre, foto: 'globo', c: [x - 24, y - 24, x + 24, y + 24] };
}

// ---------- bucle: escena + transición + trama + subtítulo ----------
const TR = .22;      // lo que dura la transición entre escenas
function pinta(i, u) { CUR = { i, u, d: LINEAS[i].d, tramo: TRAMO(i), q: clamp(u / TRAMO(i)) }; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none'; ESC[i](u, CUR); }
function draw(f) {
  const t = f / FPS; let i = INICIOS.findLastIndex(s => t >= s); if (i < 0) i = 0;
  const u = t - INICIOS[i], tipo = LINEAS[i].tr || ['barrido', 'empuje', 'lado'][i % 3];
  REG = []; ETQ = []; EN_TRANSICION = i > 0 && u < TR;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1;
  if (i > 0) EVENTOS.set(INICIOS[i].toFixed(2), 'swish');
  if (EN_TRANSICION) {
    const p = easeOut(u / TR);
    if (tipo === 'empuje') {            // la escena nueva llega desde un zoom corto, con un parpadeo oscuro
      ctx.save(); ctx.translate(W / 2, H / 2); const s = lerp(1.14, 1, p); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); pinta(i, u); ctx.restore();
      ctx.fillStyle = `rgba(0,0,0,${.75 * (1 - p)})`; ctx.fillRect(0, 0, W, H);
    } else {                            // barrido: la escena nueva destapa a la anterior detrás de una línea de escaneo
      MUDO = true; pinta(i - 1, TRAMO(i - 1)); MUDO = false;
      ctx.save(); ctx.beginPath(); if (tipo === 'lado') ctx.rect(0, 0, W * p, H); else ctx.rect(0, 0, W, H * p); ctx.clip(); pinta(i, u); ctx.restore();
      if (tipo === 'lado') linea(W * p, 0, W * p, H, { a: .8, w: 3 }); else linea(0, H * p, W, H * p, { a: .8, w: 3 });
    }
  } else pinta(i, u);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none';
  trama(); grano(.06, 3);
  if (!LINEAS[i].gancho) subtitulo(i, u);
}

// ---------- revisión automática de cada cuadro (la usa herramientas/revisar.mjs) ----------
// Devuelve las faltas de la lista de revisión que se pueden medir: zona segura, encimados y anclas que no se ven.
const TEXTOS = ['etiqueta', 'rotulo', 'cifra', 'titulo', 'subtitulo', 'gancho', 'barra'];
const cruza = (a, b, tol = 4) => a.x0 < b.x1 - tol && b.x0 < a.x1 - tol && a.y0 < b.y1 - tol && b.y0 < a.y1 - tol;
window.revisarCuadro = f => {
  draw(f); const faltas = [], seg = (f / FPS).toFixed(2);
  if (EN_TRANSICION) return { faltas, etiquetas: ETQ, seg };
  const tx = REG.filter(r => TEXTOS.includes(r.tipo));
  for (const r of tx) if (r.x0 < ZONA.x0 - 1 || r.x1 > ZONA.x1 + 1 || r.y0 < ZONA.y0 - 1 || r.y1 > ZONA.y1 + 1)
    faltas.push(`fuera de zona segura: ${r.tipo} «${r.nombre}» [${[r.x0, r.y0, r.x1, r.y1].map(Math.round)}]`);
  for (let a = 0; a < tx.length; a++) for (let b = a + 1; b < tx.length; b++) if (cruza(tx[a], tx[b]))
    faltas.push(`encimados: ${tx[a].tipo} «${tx[a].nombre}» con ${tx[b].tipo} «${tx[b].nombre}»`);
  for (const r of REG) if (r.ancla) {
    const v = visible(r.ancla.c);
    if (v < .85) faltas.push(`${r.tipo} «${r.nombre}» señala «${r.ancla.n}», que no se ve entero (${Math.round(v * 100)} % en cuadro)`);
    const A = { x0: r.ancla.c[0], y0: r.ancla.c[1], x1: r.ancla.c[2], y1: r.ancla.c[3] };
    for (const t of tx) if (t !== r && cruza(t, A, 6)) {      // ningún texto tapa lo que se está señalando
      const ix = Math.min(t.x1, A.x1) - Math.max(t.x0, A.x0), iy = Math.min(t.y1, A.y1) - Math.max(t.y0, A.y0);
      if (ix * iy > .15 * (A.x1 - A.x0) * (A.y1 - A.y0)) faltas.push(`${t.tipo} «${t.nombre}» tapa «${r.ancla.n}» (lo que señala ${r.tipo} «${r.nombre}»)`);
    }
  }
  if (REG.some(r => r.tipo === 'gancho') && REG.some(r => r.tipo === 'subtitulo')) faltas.push('hay subtítulo mientras el gancho está en pantalla');
  return { faltas: [...new Set(faltas)], etiquetas: ETQ, seg };
};
