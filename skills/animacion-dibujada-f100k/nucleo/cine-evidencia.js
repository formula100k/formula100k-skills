// ============================================================================
// cine-evidencia.js · motor compartido del grupo «Con material real» (Evidence Films)
// Técnica adaptada de lemo-opuscar (MIT, © 2026 LemoLab).
//
// Lo usan: cine-satellite-briefing, cine-briefing-board, cine-lidar-survey, cine-white-model,
//          cine-data-physical, cine-teardown, cine-microscope, cine-archive-lighttable.
// Va DESPUÉS de nucleo.js (usa ctx, W, H, rng, hash2, vnoise, autoajuste, renglones, medir, aterriza, prog…).
//
// Exporta:
//   letras ........ F_LECTURA (grotesca condensada fina), F_MONO, F_SANS, F_SERIF, F_PLUMON
//   material ...... cargarMaterial(rutas) → window.LISTO con las fotos (o [] si no hay: el estilo dibuja un reemplazo)
//                   lienzo(w, h) · fotoEnLienzo(im, w, h, fx, fy) (recorte cover a un canvas)
//                   gradoAnalista(canvas, o) (color → gris de analista: luminancia + claridad local, tono azul-negro → plata)
//                   negativo(canvas, tinte) · desaturar(canvas, k, calidez)
//   reemplazos .... terreno(w, h, o) (vista aérea procedural sin fronteras) · tejido(w, h, o) (muestra teñida procedural)
//                   (tejido: o.escala = unidades por px, o.x0/o.y0 = dónde empieza: placas anidadas de la MISMA muestra)
//                   documento(w, h, lineas, o) (hoja mecanografiada genérica) · escenaFoto(w, h, o) (foto de lugar genérica)
//   marcas ........ pelo(pts, o) (línea fina con halo oscuro y trazado parcial) · lineaRango(a, b, k, o)
//                   reticula(cx, cy, r, k, o) · guia(a, b, k, o) (línea guía con quiebre) · anillo(cx, cy, r, k, o)
//                   punto(x, y, o) · cota(a, b, k, o) (línea de cota con flechas)
//   texto ......... escribir(s, x, y, font, col, o) · placa(x, y, w, h, o) · esmerilado(x, y, w, h, o)
//                   rodar(valor, k) (contador que rueda hasta su cifra de aterrizaje) · lectura(x, y, o)
//                   armarFrase(frase, clave, o) / pintarFrase(F, t) (palabras secuenciales con corte seco, clave enorme)
//   2.5D .......... vista(o) → p(x, y, z) = [sx, sy, prof] · vistaA(objetivo, pantalla, o) (apuntada a un punto) · caja(p, x, y, z, w, d, h, col, o)
//                   tapa(p, x, y, z, w, d, canvas, alpha) (textura afín sobre una cara horizontal)
//                   sombraSuelo(p, pts, o) · rgb(c, f) · mezclar(a, b, k)
//   cámara ........ conCamara(cx, cy, zoom, rot, fn) · zoomLog(a, b, k) · vineta(a)
// ============================================================================

// ---------- letras (todas del sistema de macOS) ----------
const F_LECTURA = '"Avenir Next Condensed", "Avenir Next", "Helvetica Neue", sans-serif';
const F_MONO = 'Menlo, "Courier New", monospace';
const F_SANS = '"Avenir Next", "Helvetica Neue", Arial, sans-serif';
const F_SERIF = 'Didot, "Bodoni 72", Baskerville, Georgia, serif';
const F_PLUMON = '"Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';

// ---------- material real ----------
function lienzo(w, h) { const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return c; }
function cargarMaterial(rutas) {
  const lista = (rutas || []).filter(Boolean);
  if (!lista.length) { window.LISTO = Promise.resolve([]); return window.LISTO; }
  return cargarFotos(lista);
}
function fotoEnLienzo(im, w, h, fx = .5, fy = .5) {
  const c = lienzo(w, h), p = c.getContext('2d');
  const e = Math.max(w / im.width, h / im.height), sw = w / e, sh = h / e;
  p.drawImage(im, (im.width - sw) * fx, (im.height - sh) * fy, sw, sh, 0, 0, w, h);
  return c;
}
const _lum = (r, g, b) => .299 * r + .587 * g + .114 * b;
// caja de desenfoque rápida sobre un canal (para la claridad local)
function _borroso(src, w, h, rad) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) { let s = 0; const o = y * w;
    for (let x = -rad; x <= rad; x++) s += src[o + clamp(x, 0, w - 1)];
    for (let x = 0; x < w; x++) { tmp[o + x] = s / (2 * rad + 1); s += src[o + Math.min(w - 1, x + rad + 1)] - src[o + Math.max(0, x - rad)]; } }
  for (let x = 0; x < w; x++) { let s = 0;
    for (let y = -rad; y <= rad; y++) s += tmp[clamp(y, 0, h - 1) * w + x];
    for (let y = 0; y < h; y++) { out[y * w + x] = s / (2 * rad + 1); s += tmp[Math.min(h - 1, y + rad + 1) * w + x] - tmp[Math.max(0, y - rad) * w + x]; } }
  return out;
}
// El gris del analista (de engine.js · grade()): luminancia con claridad, hombro para que nada llegue a blanco,
// tono azul-negro → plata fría hasta ~65 %, un quinto del color. El blanco queda reservado para las marcas.
function gradoAnalista(src, o = {}) {
  const { claridad = .6, contraste = 1.15, croma = .22, techo = [.63, .655, .665], piso = [.026, .036, .044] } = o;
  const w = src.width, h = src.height, c = lienzo(w, h), p = c.getContext('2d');
  p.drawImage(src, 0, 0); const im = p.getImageData(0, 0, w, h), d = im.data, L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = _lum(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) / 255;
  const m = _borroso(L, w, h, Math.max(4, Math.round(w / 60)));
  for (let i = 0; i < w * h; i++) {
    let v = m[i] + (L[i] - m[i]) * (1 + claridad);
    v = clamp((v - .05) / .85); v = (1 - Math.exp(-1.9 * v)) / (1 - Math.exp(-1.9));
    v = v * v * (3 - 2 * v) * .3 + v * .7; v = clamp((Math.pow(v, 1.12) - .5) * contraste + .5);
    const l = L[i] * 255;
    for (let k = 0; k < 3; k++) d[i * 4 + k] = clamp((piso[k] + (techo[k] - piso[k]) * v) + (d[i * 4 + k] - l) / 255 * croma) * 255;
  }
  p.putImageData(im, 0, 0); return c;
}
// negativo de placa de vidrio (de film.js: T = 0.035 + 0.9·(1−pos)^1.25, tinte plata-gelatina)
function negativo(src, tinte = [.93, .9, .84]) {
  const w = src.width, h = src.height, c = lienzo(w, h), p = c.getContext('2d');
  p.drawImage(src, 0, 0); const im = p.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const pos = _lum(d[i], d[i + 1], d[i + 2]) / 255, T = .035 + .9 * Math.pow(1 - pos, 1.25);
    d[i] = T * 255 * tinte[0]; d[i + 1] = T * 255 * tinte[1]; d[i + 2] = T * 255 * tinte[2]; }
  p.putImageData(im, 0, 0); return c;
}
function desaturar(src, k = 1, calidez = 0) {
  const w = src.width, h = src.height, c = lienzo(w, h), p = c.getContext('2d');
  p.drawImage(src, 0, 0); const im = p.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const l = _lum(d[i], d[i + 1], d[i + 2]);
    d[i] = lerp(d[i], l, k) + calidez * 10; d[i + 1] = lerp(d[i + 1], l, k) + calidez * 4; d[i + 2] = lerp(d[i + 2], l, k) - calidez * 8; }
  p.putImageData(im, 0, 0); return c;
}

// ---------- reemplazos neutros (si la persona no trae foto) ----------
const _fbm = (x, y, oct = 5) => { let s = 0, a = .5, f = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; } return s / .97; };
// Vista aérea en color verdadero: parcelas de cultivo en dos retículas, un río que serpentea, caminos, un lago.
// Sin fronteras políticas ni nombres. o.mundo = [x0, y0, x1, y1] en unidades del terreno (para hacer placas anidadas).
function terreno(w, h, o = {}) {
  const { semilla = 3, mundo = [0, 0, 1000, 1000], pueblo = null } = o;
  const c = lienzo(w, h), p = c.getContext('2d'), im = p.createImageData(w, h), d = im.data;
  const [x0, y0, x1, y1] = mundo, sx = (x1 - x0) / w, sy = (y1 - y0) / h, S = semilla * 17.3;
  const rio = X => 520 + Math.sin(X * .0062 + semilla) * 150 + Math.sin(X * .017 + 2) * 45;    // el cauce: y en función de x
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const X = x0 + i * sx, Y = y0 + j * sy;
    const n = _fbm(X * .004 + S, Y * .004), n2 = _fbm(X * .03, Y * .03 + S, 3);
    // parcelas: dos retículas giradas, cada celda con su tinte
    const a = .35 + .25 * Math.sin(semilla), u = X * Math.cos(a) - Y * Math.sin(a), v = X * Math.sin(a) + Y * Math.cos(a);
    const cu = Math.floor(u / 46), cv = Math.floor(v / 64), hc = hash2(cu + semilla * 91, cv), borde = Math.min(u - cu * 46, v - cv * 64);
    let r, g, b;
    const tipo = hc < .33 ? 0 : hc < .62 ? 1 : hc < .82 ? 2 : 3;
    const cult = [[.42, .45, .28], [.6, .55, .38], [.33, .4, .25], [.7, .64, .5]][tipo];
    const monte = [.36 + n2 * .1, .38 + n2 * .08, .26];
    const m = clamp((n - .54) * 6);                                        // donde hay monte no hay parcelas
    r = lerp(cult[0], monte[0], m); g = lerp(cult[1], monte[1], m); b = lerp(cult[2], monte[2], m);
    const surco = .96 + .04 * Math.sin(u * (tipo === 1 ? 2.2 : 1.4));
    r *= surco * (.9 + n2 * .2); g *= surco * (.9 + n2 * .2); b *= surco * (.9 + n2 * .2);
    if (borde < 1.6 && m < .5) { r *= .82; g *= .82; b *= .8; }           // lindes entre parcelas
    // caminos claros
    const cam = Math.min(Math.abs(((u + 23) % 368 + 368) % 368 - 184), Math.abs(((v + 40) % 512 + 512) % 512 - 256));
    if (cam < 2.2 && m < .6) { r = g = .74; b = .7; }
    // río y lago
    const dr = Math.abs(Y - rio(X)) - (10 + n2 * 8), dl = Math.hypot((X - 720) * .9, Y - 260) - (70 + n * 50);
    const agua = Math.min(dr, dl);
    if (agua < 6) { const k = clamp((6 - agua) / 6); r = lerp(r, .13, k * .9); g = lerp(g, .2, k * .9); b = lerp(b, .23, k * .9); }
    else if (agua < 16) { const k = 1 - (agua - 6) / 10; r = lerp(r, .3, k * .5); g = lerp(g, .4, k * .5); b = lerp(b, .25, k * .5); }
    // árboles sueltos en el monte y en las lindes
    { const tv = vnoise(X * .22 + S, Y * .22) * .6 + vnoise(X * .9, Y * .9 + S) * .4; if (m > .4 && tv > .62) { const k = clamp((tv - .62) * 8) * .3; r *= 1 - k; g *= 1 - k * .9; b *= 1 - k; } }
    // un pueblo: manzanas de casitas con techo claro y su sombra corta
    if (pueblo) { const dp = Math.hypot(X - pueblo.x, (Y - pueblo.y) * 1.2) / (pueblo.r * (.75 + .5 * vnoise(X * .02, Y * .02)));
      if (dp < 1) { const hu = X * Math.cos(a) - Y * Math.sin(a), hv = X * Math.sin(a) + Y * Math.cos(a), lu = ((hu % 10) + 10) % 10, lv = ((hv % 8) + 8) % 8;
        const hh = hash2(Math.floor(hu / 10) + 7, Math.floor(hv / 8) + semilla);
        r = lerp(r, .52, .6); g = lerp(g, .5, .6); b = lerp(b, .46, .6);                          // calles y patios
        if (hh < .7 && lu > 1.5 && lu < 8 && lv > 1.2 && lv < 6.2) { const tc = hh < .25 ? [.66, .4, .32] : [.84, .8, .74]; r = tc[0]; g = tc[1]; b = tc[2]; }
        else if (hh < .7 && lu >= 8 && lu < 9.5 && lv > 2 && lv < 7) { r *= .45; g *= .45; b *= .48; } } }
    const q = (j * w + i) * 4; d[q] = r * 255; d[q + 1] = g * 255; d[q + 2] = b * 255; d[q + 3] = 255;
  }
  p.putImageData(im, 0, 0); return c;
}
// Muestra teñida de microscopio (tricrómico: células rojas, colágeno azul, núcleos morados) sobre vidrio cálido.
function tejido(w, h, o = {}) {
  const { semilla = 5, celda = 38, escala = 1, x0 = 0, y0 = 0 } = o;
  const c = lienzo(w, h), p = c.getContext('2d'), im = p.createImageData(w, h), d = im.data, S = semilla * 7.7;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const X = x0 + i * escala, Y = y0 + j * escala, gx = Math.floor(X / celda), gy = Math.floor(Y / celda);
    let d1 = 1e9, d2 = 1e9, idc = 0, nx = 0, ny = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const cx = (gx + a + .15 + .7 * hash2(gx + a + semilla, gy + b)) * celda, cy = (gy + b + .15 + .7 * hash2(gy + b, gx + a + semilla * 3)) * celda;
      const dd = Math.hypot(X - cx, Y - cy);
      if (dd < d1) { d2 = d1; d1 = dd; idc = hash2(gx + a, gy + b + 99); nx = cx; ny = cy; } else if (dd < d2) d2 = dd;
    }
    const memb = d2 - d1, fib = Math.abs(_fbm(X * .006 + S, Y * .006, 4) - .5), venas = clamp(1 - fib * 9);
    let r = .74 + idc * .1, g = .25 + idc * .06, b = .3;                         // citoplasma rojo
    const nuc = Math.hypot(X - nx - celda * .08, Y - ny) < celda * (.14 + idc * .05);
    if (nuc) { r = .38; g = .16; b = .42; }
    if (memb < 3.2) { const k = 1 - memb / 3.2; r = lerp(r, .97, k * .7); g = lerp(g, .9, k * .7); b = lerp(b, .9, k * .7); }   // borde claro
    if (venas > 0) { const k = venas * (.7 + .3 * _fbm(X * .05, Y * .05, 2)); r = lerp(r, .2, k); g = lerp(g, .36, k); b = lerp(b, .72, k); }
    const hueco = _fbm(X * .01 + 40, Y * .01 - S, 3); if (hueco > .7) { const k = clamp((hueco - .7) * 12); r = lerp(r, .96, k); g = lerp(g, .94, k); b = lerp(b, .91, k); }
    const gr = .9 + .14 * vnoise(X * .35 + S, Y * .35) + .06 * (hash2(i * 7 + j, j * 3 + semilla) - .5) - .08 * clamp(d1 / celda);   // grano de la tinción y centro más claro
    r *= gr; g *= gr; b *= gr;
    const q = (j * w + i) * 4; d[q] = r * 255; d[q + 1] = g * 255; d[q + 2] = b * 255; d[q + 3] = 255;
  }
  p.putImageData(im, 0, 0); return c;
}
// Hoja mecanografiada genérica: papel, renglones de texto real (las LINEAS que pase el estilo) y marcas de lápiz.
function documento(w, h, lineas, o = {}) {
  const { papel = '#e9e2d2', tinta = '#2a2622', semilla = 9, titulo = '' } = o;
  const c = lienzo(w, h), p = c.getContext('2d'), r = rng(semilla);
  p.fillStyle = papel; p.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h / 30; i++) { p.fillStyle = r() < .5 ? 'rgba(80,60,40,.06)' : 'rgba(255,255,255,.12)'; p.fillRect(r() * w, r() * h, 1.5, 1.5); }
  p.strokeStyle = 'rgba(90,70,50,.18)'; p.lineWidth = 2; p.beginPath(); p.moveTo(0, h * .34); p.lineTo(w, h * .345); p.stroke();   // doblez
  p.fillStyle = tinta; const tam = Math.round(w / 22);
  let y = tam * 2.4;
  if (titulo) { p.font = `700 ${Math.round(tam * 1.15)}px "American Typewriter", "Courier New", monospace`; p.fillText(titulo, tam * 1.6, y); y += tam * 2.2; }
  p.font = `${tam}px "American Typewriter", "Courier New", monospace`;
  const pos = [];
  for (const l of lineas) { p.globalAlpha = .82 + r() * .15; p.fillText(l, tam * 1.6 + (r() - .5) * 2, y); pos.push({ txt: l, y, x: tam * 1.6, size: tam }); y += tam * 1.75; }
  p.globalAlpha = 1; return { c, pos, tam };
}
// Foto genérica de un lugar (blanco y negro): cielo, horizonte, un local con toldo y vereda. Sin marcas ni letreros.
function escenaFoto(w, h, o = {}) {
  const { semilla = 4 } = o, c = lienzo(w, h), p = c.getContext('2d'), r = rng(semilla);
  const g = p.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#cfcfcb'); g.addColorStop(.55, '#b9b8b2'); g.addColorStop(.56, '#8d8b84'); g.addColorStop(1, '#6f6c66');
  p.fillStyle = g; p.fillRect(0, 0, w, h);
  p.fillStyle = '#4b4944'; p.fillRect(w * .12, h * .22, w * .76, h * .34);                       // fachada
  p.fillStyle = '#2c2b28'; p.fillRect(w * .2, h * .36, w * .26, h * .2); p.fillRect(w * .55, h * .36, w * .25, h * .14);   // vitrina y puerta
  p.fillStyle = '#d8d6cf'; for (let i = 0; i < 9; i++) p.fillRect(w * (.12 + i * .0844), h * .29, w * .0844 * .5, h * .05);   // toldo a rayas
  p.fillStyle = '#9a978f'; p.fillRect(w * .12, h * .285, w * .76, h * .01);
  p.fillStyle = '#5a5852'; p.fillRect(0, h * .56, w, h * .012);                                    // cordón de vereda
  for (let i = 0; i < w * h / 9; i++) { p.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,255,255'},${r() * .06})`; p.fillRect(r() * w, r() * h, 2, 2); }
  return c;
}

// ---------- marcas finas ----------
function _parcial(pts, k) {                                   // los puntos hasta la fracción k del largo
  if (k >= 1) return pts; if (k <= 0) return [pts[0]];
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const meta = L[L.length - 1] * k, out = [pts[0]];
  for (let i = 1; i < pts.length; i++) { if (L[i] <= meta) { out.push(pts[i]); continue; }
    const u = (meta - L[i - 1]) / (L[i] - L[i - 1]); out.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]); break; }
  return out;
}
function pelo(pts, o = {}) {
  const { w = 2, col = '#F2F5F6', halo = 'rgba(3,6,8,.5)', anchoHalo = 3.5, k = 1, dash = null, alpha = 1, cerrado = false, cap = 'round' } = o;
  if (k <= 0 || alpha <= 0 || pts.length < 2) return;
  const q = _parcial(cerrado && k >= 1 ? [...pts, pts[0]] : pts, k);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.lineCap = cap; ctx.lineJoin = 'round'; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(...q[0]); for (const v of q.slice(1)) ctx.lineTo(...v);
  if (halo) { ctx.strokeStyle = halo; ctx.lineWidth = w + anchoHalo; ctx.stroke(); }
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); ctx.restore();
}
function lineaRango(a, b, k, o = {}) {                     // línea con marcas que crece de A a B
  const { col = '#F2F5F6', marcas = 10, largo = 14, w = 2.2 } = o, kk = clamp(k);
  const tip = [lerp(a[0], b[0], kk), lerp(a[1], b[1], kk)];
  pelo([a, tip], { w, col });
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
  for (let i = 0; i <= marcas; i++) { const u = i / marcas; if (u > kk + 1e-6) break;
    const x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u), l = (i % 5 === 0 ? 1.6 : 1) * largo / 2;
    pelo([[x - nx * l, y - ny * l], [x + nx * l, y + ny * l]], { w: 1.6, col }); }
  return tip;
}
function reticula(cx, cy, r, k, o = {}) {                   // escuadras de enganche: entran abiertas y cierran seco
  const { col = '#F2F5F6', w = 2.4, tramo = .32 } = o; if (k <= 0) return;
  const R = r * (1 + (1 - aterriza(k)) * 1.4), b = R * tramo;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = cx + sx * R, y = cy + sy * R;
    pelo([[x - sx * b, y], [x, y], [x, y - sy * b]], { w, col, cap: 'square', alpha: clamp(k * 3) });
  }
  pelo([[cx - 10, cy], [cx + 10, cy]], { w: 1.6, col, alpha: clamp(k * 3) }); pelo([[cx, cy - 10], [cx, cy + 10]], { w: 1.6, col, alpha: clamp(k * 3) });
}
function guia(a, b, k, o = {}) {                           // línea guía con un quiebre: sube vertical y gira
  const { col = '#F2F5F6', w = 1.6 } = o, quiebre = [a[0], b[1]];
  pelo([a, quiebre, b], { w, col, k, halo: o.halo === undefined ? 'rgba(3,6,8,.45)' : o.halo });
}
function anillo(cx, cy, r, k, o = {}) {                    // círculo que se dibuja como arco, con marcas cardinales
  const { col = '#F2F5F6', w = 2, a0 = -Math.PI / 2, marcas = true } = o; if (k <= 0) return;
  const pts = []; for (let i = 0; i <= 96; i++) { const a = a0 + i / 96 * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  pelo(pts, { w, col, k, halo: o.halo });
  if (marcas) for (let i = 0; i < 4; i++) { if (i / 4 > k) break; const a = a0 + i * Math.PI / 2;
    pelo([[cx + Math.cos(a) * (r - 9), cy + Math.sin(a) * (r - 9)], [cx + Math.cos(a) * (r + 9), cy + Math.sin(a) * (r + 9)]], { w: 1.6, col, halo: o.halo }); }
}
function punto(x, y, o = {}) { const { col = '#F2F5F6', r = 6, anillo: ar = 0 } = o;
  ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  if (ar) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, ar, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); }
function cota(a, b, k, o = {}) {                           // línea de cota: crece desde el centro, flechas al final
  const { col = '#2f5fc4', w = 4, flecha = 18, halo = null } = o; if (k <= 0) return;
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], kk = aterriza(k);
  const A = [lerp(m[0], a[0], kk), lerp(m[1], a[1], kk)], B = [lerp(m[0], b[0], kk), lerp(m[1], b[1], kk)];
  pelo([A, B], { w, col, halo });
  if (k >= 1) for (const [P, Q] of [[a, b], [b, a]]) { const ang = Math.atan2(P[1] - Q[1], P[0] - Q[0]);
    pelo([[P[0] - Math.cos(ang - .45) * flecha, P[1] - Math.sin(ang - .45) * flecha], P, [P[0] - Math.cos(ang + .45) * flecha, P[1] - Math.sin(ang + .45) * flecha]], { w, col, halo }); }
}

// ---------- texto (sin brillo, sin halo, sin degradado) ----------
function escribir(s, x, y, font, col, o = {}) {
  const { align = 'left', base = 'alphabetic', alpha = 1, track = 0 } = o;
  ctx.save(); ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = base; ctx.globalAlpha *= alpha;
  if (track) ctx.letterSpacing = track + 'px';
  ctx.fillText(s, x, y); const w = ctx.measureText(s).width; ctx.restore(); return w;
}
function placa(x, y, w, h, o = {}) { const { col = 'rgba(12,14,17,.74)', r = 10, borde = null } = o;
  ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  if (borde) { ctx.fillStyle = borde; ctx.fillRect(x, y, 4, h); } ctx.restore(); }
function esmerilado(x, y, w, h, o = {}) {                  // vidrio esmerilado: copia borrosa de lo de atrás + oscuro
  const { col = 'rgba(12,14,17,.62)', r = 14, borroso = 16 } = o;
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip();
  ctx.filter = `blur(${borroso}px)`; ctx.drawImage(ctx.canvas, x - 40, y - 40, w + 80, h + 80, x - 40, y - 40, w + 80, h + 80); ctx.filter = 'none';
  ctx.fillStyle = col; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); ctx.restore();
}
// rodar('3.200 ventas', .5) → '1.600 ventas': el primer número del texto rueda hasta su valor (formato de quien escribe)
function rodar(valor, k) {
  const s = String(valor), m = s.match(/\d[\d.,\s]*\d|\d/); if (!m) return s;
  const crudo = m[0].trim(), decSep = /,\d{1,2}$/.test(crudo) ? ',' : /\.\d{1,2}$/.test(crudo) && !/\.\d{3}/.test(crudo) ? '.' : '';
  const miles = decSep === ',' ? '.' : decSep === '.' ? ',' : (/[.,]\d{3}/.test(crudo) ? crudo.match(/([.,])\d{3}/)[1] : '');
  const dec = decSep ? crudo.split(decSep).pop().length : 0;
  const n = parseFloat(crudo.split(miles).join('').replace(',', '.')), v = n * clamp(k);
  let ent = Math.floor(v + 1e-9).toString(), fr = dec ? (v - Math.floor(v + 1e-9)).toFixed(dec).slice(2) : '';
  if (k >= 1) return s;
  if (miles) ent = ent.replace(/\B(?=(\d{3})+(?!\d))/g, miles);
  return s.replace(crudo, ent + (dec ? decSep + fr : ''));
}
// Lectura: etiqueta chica arriba, la cifra grande (rueda con k), una línea de fuente/método abajo. Todo a la izquierda en x.
function lectura(x, y, o = {}) {
  const { etiqueta = '', valor = '', nota = '', k = 1, tam = 150, col = '#FFBE55', tinta = '#F2F5F6', tenue = 'rgba(242,245,246,.62)', ancho = 520, fondo = null, alpha = 1 } = o;
  if (alpha <= 0) return { alto: 0 };
  const fv = autoajuste(String(valor), F_LECTURA, 200, ancho, 1, tam, 60), fe = autoajuste(etiqueta || ' ', F_SANS, 600, ancho, 2, 40, 26);
  const altoE = fe.rs.length * fe.size * 1.2, alto = altoE + fv.size * 1.02 + (nota ? 50 : 10);
  if (fondo) fondo(x - 30, y - 30, ancho + 60, alto + 50);
  ctx.save(); ctx.globalAlpha *= alpha;
  fe.rs.forEach((r, i) => escribir(r, x, y + fe.size * (1 + i * 1.2), fe.font, tinta));
  escribir(rodar(valor, k), x, y + altoE + fv.size * .9, fv.font, col);
  pelo([[x, y + altoE + fv.size * 1.04], [x + ancho * .8, y + altoE + fv.size * 1.04]], { w: 1.4, col: tenue, halo: null });
  if (nota) escribir(nota, x, y + altoE + fv.size * 1.04 + 40, `400 24px ${F_MONO}`, tenue);
  ctx.restore(); return { alto };
}
// FRASE con su PALABRA CLAVE: lo de antes y lo de después en letra chica, la clave enorme en su propio renglón.
// Las palabras entran de a una, con corte seco (sin fundido, sin animación de entrada).
//   o: { x, y, ancho, fam, peso, famClave, pesoClave, chica, grande, col, colClave, align, interlinea }
function armarFrase(frase, clave, o = {}) {
  const { x = SEGURA.left, y = SEGURA.top, ancho = SEGURA.right - SEGURA.left, fam = F_SANS, peso = 500, famClave = fam, pesoClave = 700,
    chica = 68, grande = 230, col = '#fff', colClave = col, align = 'left', renglonesClave = 2 } = o;
  const pal = frase.trim().split(/\s+/), norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s]/g, '');
  const cl = (clave || '').trim().split(/\s+/).filter(Boolean);
  let i0 = -1; for (let i = 0; i + cl.length <= pal.length && cl.length; i++) if (cl.every((c, j) => norm(pal[i + j]) === norm(c))) { i0 = i; break; }
  if (i0 < 0) i0 = pal.length - 1;
  const n = Math.max(1, cl.length || 1), antes = pal.slice(0, i0), medio = pal.slice(i0, i0 + n), despues = pal.slice(i0 + n);
  const items = []; let cy = y, orden = 0;
  const bloque = (ws, f, c, esClave) => {
    if (!ws.length) return;
    const aj = esClave ? autoajuste(ws.join(' '), f.fam, f.peso, ancho, renglonesClave, grande, 70) : autoajuste(ws.join(' '), f.fam, f.peso, ancho, 3, chica, 34);
    for (const r of aj.rs) { cy += aj.size * (esClave ? .9 : 1.05);
      const ancr = medir(r, aj.font); let cx = align === 'center' ? x + (ancho - ancr) / 2 : align === 'right' ? x + ancho - ancr : x;
      for (const wd of r.split(' ')) { items.push({ txt: wd, x: cx, y: cy, font: aj.font, col: c, clave: esClave, i: orden++ }); cx += medir(wd + ' ', aj.font); }
      cy += aj.size * (esClave ? .16 : .22); }
  };
  bloque(antes, { fam, peso }, col, false);
  if (antes.length) cy += 8;
  bloque(medio, { fam: famClave, peso: pesoClave }, colClave, true);
  if (despues.length) cy += 6;
  bloque(despues, { fam, peso }, col, false);
  return { items, alto: cy - y, y0: y, y1: cy, n: orden };
}
// t0: cuándo entra la primera palabra · ritmo: segundos entre palabras (la clave se espera un poco más)
function pintarFrase(F, t, t0 = 0, ritmo = .16) {
  let tt = t0;
  for (const it of F.items) { if (it.clave) tt += ritmo * .6; if (t >= tt) escribir(it.txt, it.x, it.y, it.font, it.col); tt += ritmo; if (it.clave) tt += ritmo * .4; }
  return tt;                                           // cuándo terminó de entrar la frase
}

// ---------- 2.5D: proyección ortográfica propia, orden de pintor, luz de un lado ----------
// vista({ cx, cy, esc, yaw, pitch }) → p(x, y, z) = [sx, sy, prof]. z sube. prof más grande = más cerca de la cámara.
function vista(o = {}) {
  const { cx = W / 2, cy = H / 2, esc = 1, yaw = .6, pitch = .8 } = o, cY = Math.cos(yaw), sY = Math.sin(yaw), sP = Math.sin(pitch), cP = Math.cos(pitch);
  const p = (x, y, z = 0) => { const xr = x * cY - y * sY, yr = x * sY + y * cY; return [cx + xr * esc, cy + (yr * sP - z * cP) * esc, yr * cP + z * sP]; };
  p.yaw = yaw; p.pitch = pitch; p.esc = esc; p.lado = (nx, ny) => nx * sY + ny * cY;   // > 0: la cara mira a la cámara
  return p;
}
// vistaA: la misma vista, pero apuntada: el punto `objetivo` (x, y, z) del mundo cae en `pantalla` [sx, sy]
function vistaA(objetivo, pantalla, o = {}) {
  const v = vista({ ...o, cx: 0, cy: 0 }), s = v(...objetivo);
  const p = (x, y, z = 0) => { const r = v(x, y, z); return [r[0] - s[0] + pantalla[0], r[1] - s[1] + pantalla[1], r[2]]; };
  p.yaw = v.yaw; p.pitch = v.pitch; p.esc = v.esc; p.lado = v.lado; return p;
}
const rgb = (c, f = 1) => `rgb(${Math.round(clamp(c[0] * f, 0, 255))},${Math.round(clamp(c[1] * f, 0, 255))},${Math.round(clamp(c[2] * f, 0, 255))})`;
const mezclar = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
function _poli(q, estilo) { ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const v of q.slice(1)) ctx.lineTo(v[0], v[1]); ctx.closePath(); ctx.fillStyle = estilo; ctx.fill(); }
// caja: base (x, y, z), lados w (x), d (y), alto h. col = [r,g,b]. o.luz = [lx, ly, lz] (de dónde viene), o.tapa / o.lado = color extra por cara.
// o.proy(cara, normal) → [r,g,b] para sumar luz proyectada (white-model). Devuelve las 4 esquinas de arriba en pantalla.
function caja(p, x, y, z, w, d, h, col, o = {}) {
  const { luz = [-.5, -.6, .9], ambiente = .52, borde = null, proy = null, tapaCol = null } = o, L = Math.hypot(...luz), l = luz.map(v => v / L);
  const P = (a, b, c) => p(x + a * w, y + b * d, z + c * h);
  const caras = [[[1, 0, 0], [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]], [[-1, 0, 0], [[0, 1, 0], [0, 0, 0], [0, 0, 1], [0, 1, 1]]],
    [[0, 1, 0], [[1, 1, 0], [0, 1, 0], [0, 1, 1], [1, 1, 1]]], [[0, -1, 0], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]]];
  const sombra = n => ambiente + (1 - ambiente) * Math.max(0, n[0] * l[0] + n[1] * l[1] + n[2] * l[2]);
  for (const [n, vs] of caras) { if (p.lado(n[0], n[1]) <= 0) continue;
    let c = col.map(v => v * sombra(n)); if (proy) { const e = proy('lado', n); c = c.map((v, i) => v + e[i]); }
    const q = vs.map(v => P(...v)); _poli(q, rgb(c));
    if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = 1; ctx.stroke(); } }
  const top = [P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)];
  let c = (tapaCol || col).map(v => v * sombra([0, 0, 1])); if (proy) { const e = proy('tapa', [0, 0, 1]); c = c.map((v, i) => v + e[i]); }
  _poli(top, rgb(c)); if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = 1; ctx.stroke(); }
  return top;
}
// tapa: pinta un canvas sobre una cara horizontal (x, y, z, w, d) con una transformación afín (la proyección es ortográfica)
function tapa(p, x, y, z, w, d, img, alpha = 1) {
  const o = p(x, y, z), ex = p(x + w, y, z), ey = p(x, y + d, z);
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.transform((ex[0] - o[0]) / img.width, (ex[1] - o[1]) / img.width, (ey[0] - o[0]) / img.height, (ey[1] - o[1]) / img.height, o[0], o[1]);
  ctx.drawImage(img, 0, 0); ctx.restore();
}
function sombraSuelo(p, pts, o = {}) {                       // pts en el suelo (x, y, z): sombra suave, desenfocada
  const { alpha = .35, borroso = 18, col = '0,0,0' } = o;
  ctx.save(); ctx.filter = `blur(${borroso}px)`; ctx.globalAlpha *= alpha; _poli(pts.map(v => p(...v)), `rgb(${col})`); ctx.restore();
}

// ---------- cámara 2D ----------
function conCamara(cx, cy, zoom, rot, fn) {                // (cx, cy) del mundo queda en el centro de la pantalla
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy); fn(); ctx.restore();
}
const zoomLog = (a, b, k) => Math.exp(lerp(Math.log(a), Math.log(b), k));   // el zoom avanza en escala logarítmica
function vineta(a = .35, col = '0,0,0') {
  ctx.save(); const g = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .75);
  g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
