// ============================================================================
// cine-juegos.js · motor compartido del grupo «Caricatura, videojuegos y cine de época» (parte videojuegos)
// Técnica adaptada de lemo-opuscar (MIT, © 2026 LemoLab): px.js/font.js/ui.js/sprites.js (pixel-rpg),
// px.js/chars.js/ui.js (hd-2d), g_pixel.js (microgame), osd.js (backrooms). Reescrito desde cero para canvas 2D.
//
// Lo usan: cine-pixel-rpg, cine-hd-2d, cine-microgame, cine-backrooms.
// Exporta (globales, después de nucleo.js):
//   crearGrilla(px)           → { c, g, GW, GH, PX, p(x,y,col,w,h), limpiar(col), presentar(ctx, dx, dy) }
//                               pixel art de verdad: grilla chica + imageSmoothingEnabled = false, UN solo tamaño de pixel
//   textoPx(G, txt, x, y, o)  · anchoPx(txt, esc) · partirPx(txt, maxAncho, esc)   fuente pixel propia 5×7 con tildes y Ñ
//   bayer(x, y)               → umbral 0..1 de una matriz de Bayer 4×4 (tramado ordenado, nunca mezcla)
//   degradadoPx(G, x,y,w,h, cols)   bandas tramadas en vertical
//   spritePx(G, filas, paleta, x, y, o)   sprite en ASCII con contorno automático de 1 px
//   ventanaPx(G, x,y,w,h, o)  ventana de RPG con borde en capas y fondo tramado
// Nada de Math.random ni Date.
// ============================================================================

function crearGrilla(px, o = {}) {   // o.lectura = true si vas a leer pixeles en cada cuadro (getImageData)
  const GW = Math.round(W / px), GH = Math.round(H / px);
  const c = document.createElement('canvas'); c.width = GW; c.height = GH;
  const g = c.getContext('2d', o.lectura ? { willReadFrequently: true } : undefined); g.imageSmoothingEnabled = false;
  const G = { c, g, GW, GH, PX: px,
    p(x, y, col, w = 1, h = 1) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); },
    limpiar(col) { if (col) { g.fillStyle = col; g.fillRect(0, 0, GW, GH); } else g.clearRect(0, 0, GW, GH); },
    presentar(destino = ctx, dx = 0, dy = 0) { destino.save(); destino.imageSmoothingEnabled = false; destino.drawImage(c, Math.round(dx) * px, Math.round(dy) * px, GW * px, GH * px); destino.restore(); },
  };
  return G;
}

// ---------- tramado ordenado ----------
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => (BAYER4[((y & 3) << 2) | (x & 3)] + .5) / 16;
function degradadoPx(G, x0, y0, w, h, cols) {
  for (let y = 0; y < h; y++) { const f = y / Math.max(1, h - 1) * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(f)), k = f - i;
    for (let x = 0; x < w; x++) G.p(x0 + x, y0 + y, k > bayer(x0 + x, y0 + y) ? cols[i + 1] : cols[i]); }
}

// ---------- fuente pixel propia 5×7 (mayúsculas, números, signos; tildes y Ñ se dibujan encima) ----------
const FUENTE_PX = {
  A:'01110100011000111111100011000110001', B:'11110100011000111110100011000111110', C:'01110100011000010000100001000101110',
  D:'11110100011000110001100011000111110', E:'11111100001000011110100001000011111', F:'11111100001000011110100001000010000',
  G:'01110100011000010111100011000101111', H:'10001100011000111111100011000110001', I:'01110001000010000100001000010001110',
  J:'00111000100001000010000101001001100', K:'10001100101010011000101001001010001', L:'10000100001000010000100001000011111',
  M:'10001110111010110101100011000110001', N:'10001110011010110011100011000110001', O:'01110100011000110001100011000101110',
  P:'11110100011000111110100001000010000', Q:'01110100011000110001101011001001101', R:'11110100011000111110101001001010001',
  S:'01111100001000001110000010000111110', T:'11111001000010000100001000010000100', U:'10001100011000110001100011000101110',
  V:'10001100011000110001100010101000100', W:'10001100011000110101101011010101010', X:'10001100010101000100010101000110001',
  Y:'10001100010101000100001000010000100', Z:'11111000010001000100010001000011111',
  '0':'01110100011001110101110011000101110', '1':'00100011000010000100001000010001110', '2':'01110100010000100010001000100011111',
  '3':'11110000010000101110000010000111110', '4':'00010001100101010010111110001000010', '5':'11111100001111000001000011000101110',
  '6':'00110010001000011110100011000101110', '7':'11111000010001000100010000100001000', '8':'01110100011000101110100011000101110',
  '9':'01110100011000101111000010001001100', '!':'00100001000010000100001000000000100', '¡':'00100000000010000100001000010000100',
  '?':'01110100010000100010001000000000100', '¿':'00100000000010001000100001000101110', '.':'00000000000000000000000000000000100',
  ',':'00000000000000000000001000010001000', ':':'00000001000000000000000000010000000', '-':'00000000000000011111000000000000000',
  '+':'00000001000010011111001000010000000', '/':'00001000010001000100010001000010000', "'":'00100001000000000000000000000000000',
  '>':'01000001000001000001000100010001000', '<':'00010001000100010000010000010000010', '=':'00000000001111100000111110000000000',
  '(':'00010001000100001000010000010000010', ')':'01000001000001000010000100010001000', '%':'11001110010001000100010001001110011',
  '$':'00100011111010001110001011111000100', '#':'01010010101111101010111110101001010', '▼':'00000111110111000100000000000000000',
  '♥':'00000010101111111111011100010000000', '★':'00100001001111101110011100101000000', ' ':'0'.repeat(35),
};
const BASE_PX = { 'Á':'A', 'É':'E', 'Í':'I', 'Ó':'O', 'Ú':'U', 'Ü':'U', 'Ñ':'N' };
const anchoPx = (txt, esc = 1) => [...txt].length * 6 * esc - esc;
// textoPx: dibuja en la grilla. o.esc (1, 2, 3…) · o.col · o.sombra (1 px abajo-derecha) · o.contorno (8 vecinos) · o.max (letras visibles)
function textoPx(G, txt, x, y, o = {}) {
  const { esc = 1, col = '#fff', sombra = null, contorno = null, max = Infinity } = o;
  const T = [...txt.toUpperCase()].slice(0, max);
  const pinta = (dx, dy, c) => T.forEach((ch, i) => {
    const base = BASE_PX[ch] || ch, gl = FUENTE_PX[base] || FUENTE_PX['?'], x0 = x + i * 6 * esc + dx, y0 = y + dy;
    for (let k = 0; k < 35; k++) if (gl[k] === '1') G.p(x0 + (k % 5) * esc, y0 + Math.floor(k / 5) * esc, c, esc, esc);
    if (BASE_PX[ch]) {                                   // marcas: tilde, diéresis o virgulilla arriba
      if (ch === 'Ñ') { G.p(x0 + esc, y0 - 2 * esc, c, 3 * esc, esc); }
      else if (ch === 'Ü') { G.p(x0 + esc, y0 - 2 * esc, c, esc, esc); G.p(x0 + 3 * esc, y0 - 2 * esc, c, esc, esc); }
      else { G.p(x0 + 3 * esc, y0 - 3 * esc, c, esc, esc); G.p(x0 + 2 * esc, y0 - 2 * esc, c, esc, esc); }
    }
  });
  if (contorno) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) pinta(dx * Math.max(1, esc >> 1), dy * Math.max(1, esc >> 1), contorno);
  if (sombra) pinta(Math.max(1, esc >> 1), Math.max(1, esc >> 1), sombra);
  pinta(0, 0, col);
}
// parte un texto en renglones que caben en maxAncho (en pixeles de grilla)
function partirPx(txt, maxAncho, esc = 1) {
  const out = []; let cur = '';
  for (const pal of txt.trim().split(/[ \t\n]+/)) { const pr = cur ? cur + ' ' + pal : pal; if (anchoPx(pr, esc) > maxAncho && cur) { out.push(cur); cur = pal; } else cur = pr; }
  if (cur) out.push(cur); return out;
}

// ---------- sprites en ASCII con contorno automático ----------
// filas: ['..aa..', ...] · paleta: { a: '#hex', ... } ('.' = vacío) · o.espejo · o.contorno '#hex' (1 px alrededor)
function spritePx(G, filas, paleta, x, y, o = {}) {
  const h = filas.length, w = Math.max(...filas.map(f => f.length));
  const at = (i, j) => { if (j < 0 || j >= h) return '.'; const f = filas[j], ii = o.espejo ? w - 1 - i : i; return ii < 0 || ii >= f.length ? '.' : f[ii]; };
  if (o.contorno) for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
    if (at(i, j) !== '.') continue;
    if (at(i - 1, j) !== '.' || at(i + 1, j) !== '.' || at(i, j - 1) !== '.' || at(i, j + 1) !== '.') G.p(x + i, y + j, o.contorno);
  }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const ch = at(i, j); if (ch !== '.' && paleta[ch]) G.p(x + i, y + j, paleta[ch]); }
  return { w, h };
}

// ---------- ventana de RPG: borde en capas (tinta / blanco / plata) y fondo tramado ----------
function ventanaPx(G, x, y, w, h, o = {}) {
  const { tinta = '#10121c', blanco = '#f4f4f8', plata = '#9aa3c0', fondo = ['#1c2c78', '#2a3f9a'], radio = 2 } = o;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const esq = Math.min(i, w - 1 - i) + Math.min(j, h - 1 - j); if (Math.min(i, w - 1 - i) < radio && Math.min(j, h - 1 - j) < radio && esq < radio) continue;
    const d = Math.min(i, j, w - 1 - i, h - 1 - j);
    const col = d === 0 ? tinta : d === 1 ? blanco : d === 2 ? plata : d === 3 ? tinta : ((j / h) > bayer(x + i, y + j) * .9 + .05 ? fondo[0] : fondo[1]);
    G.p(x + i, y + j, col);
  }
}
