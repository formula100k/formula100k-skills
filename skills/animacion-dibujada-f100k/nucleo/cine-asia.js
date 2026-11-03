// ============================================================================
// MOTOR «cine-asia» · tradiciones de Asia (para estilos cine-*)
// Lo usan: cine-shadow-puppet (teatro de sombras), cine-papercut-red (papel rojo recortado),
//          cine-paper-lantern (caja de papel con luz). Necesita cine-impresion.js antes (mk, rgba, campoRuido…).
// Exporta (globales):
//   CUERO() → mosaico de cuero translúcido (manchas, fibras, motas) · pieza(caja, dibujo, {tex,semilla,ss}) → pieza de cuero
//   recorte(g, fnCamino, regla) · recorteLinea(g, w, fnCamino) · escamasAbiertas · celosia · moneda · nubeEspiral · cuentas · remache · lenguaLlama
//   TELA() → tela de algodón del biombo (trama sin×sin torcida, motas, manchas) · luzLamparas(ctx, lamparas, t, base) · viñetaCalida(ctx, a)
//   GRANO_PAPEL() → grano gris neutro para soft-light · piezaPapel(w, h, dibujo, {col, grano, filo, semilla}) → {c, sombra}
//   recorteInterior(g, fnCamino, inset, w) → la ranura del contorno interior (doble contorno del papel picado)
//   dienteSierra(g, x0, x1, y, alto, paso) · media luna, espiral → con recorteLinea
//   rosetaD4(R, cuña) → canvas con un rosetón: la cuña de 45° se refleja 8 veces · desplegar(ctx, RF, cx, cy, p) → doblez que se abre
//   capaLinterna(dibujo, col, {rim, sombraBorde, fibra, semilla}) → hoja de papel para la caja de luz · sombraDe(capa, blur)
// Técnica adaptada de lemo-opuscar (MIT, © 2026 LemoLab): carve.js y gl.js de shadow-puppet (cuero = transmisión que se
// multiplica, agujeros = luz, lámparas que titilan, tela), paper.js / motifs.js / tuanhua.js / fold.js de papercut-red
// (grano soft-light, filo de corte, contorno interior, cuña D4, doblez en tiras), paper.js de paper-lantern (borde de luz
// arriba, banda oscura abajo, translucidez por capa, sombras suaves).
// ============================================================================

// ---------- teatro de sombras ----------
let _cuero = null;
function CUERO() {
  if (_cuero) return _cuero;
  const N = 256, c = mk(N, N), g = c.getContext('2d'), id = g.createImageData(N, N), d = id.data, R = rng(77);
  const vn = (x, y, p) => { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const w = (a, b) => hash2(((a % p) + p) % p, ((b % p) + p) % p); return lerp(lerp(w(i, j), w(i + 1, j), u), lerp(w(i, j + 1), w(i + 1, j + 1), u), v); };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const f = vn(x / 32, y / 32, 8) * .5 + vn(x / 16, y / 16, 16) * .3 + vn(x / 4, y / 4, 64) * .2, sp = hash2(x * 7, y * 3) > .985 ? .82 : 1, v = (.8 + .22 * f) * sp, i = (y * N + x) * 4;
    d[i] = Math.min(255, v * 255); d[i + 1] = Math.min(255, v * 248); d[i + 2] = Math.min(255, v * 232); d[i + 3] = 255; }
  g.putImageData(id, 0, 0); g.globalAlpha = .1; g.strokeStyle = '#6a4a2a'; g.lineWidth = .8;
  for (let k = 0; k < 450; k++) { const x = R() * N, y = R() * N, a = R() * 6.28, l = 6 + R() * 18; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + 3, y + Math.sin(a) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return _cuero = c;
}
// una pieza de cuero: caja [x0,y0,x1,y1] relativa al pivote; dibujo(g) pinta en esas unidades. Se multiplica el cuero y se restaura el alfa (los agujeros siguen siendo agujeros)
function pieza(caja, dibujo, o = {}) {
  const [x0, y0, x1, y1] = caja, K = o.ss || 1.5, c = mk((x1 - x0) * K, (y1 - y0) * K), g = c.getContext('2d');
  g.setTransform(K, 0, 0, K, -x0 * K, -y0 * K); g.lineJoin = g.lineCap = 'round'; dibujo(g);
  if (o.tex !== false) { const m = mk(c.width, c.height); m.getContext('2d').drawImage(c, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0); const pat = g.createPattern(CUERO(), 'repeat'); pat.setTransform(new DOMMatrix([1, 0, 0, 1, ((o.semilla || 0) * 137) % 256, ((o.semilla || 0) * 71) % 256]));
    g.globalCompositeOperation = 'multiply'; g.fillStyle = pat; g.fillRect(0, 0, c.width, c.height); g.globalCompositeOperation = 'destination-in'; g.drawImage(m, 0, 0); g.globalCompositeOperation = 'source-over'; }
  return { c, x0, y0, w: x1 - x0, h: y1 - y0 };
}
const ponerPieza = (g, p) => g.drawImage(p.c, p.x0, p.y0, p.w, p.h);
function recorte(g, fn, regla = 'evenodd') { g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.beginPath(); fn(g); g.fill(regla); g.restore(); }
function recorteLinea(g, w, fn) { g.save(); g.globalCompositeOperation = 'destination-out'; g.strokeStyle = '#000'; g.lineWidth = w; g.lineCap = g.lineJoin = 'round'; g.beginPath(); fn(g); g.stroke(); g.restore(); }
function escamasAbiertas(g, x0, y0, x1, y1, r = 9) {
  recorte(g, q => { let f = 0; for (let y = y0; y < y1 + r; y += r * .95, f++) for (let x = x0 - r + (f % 2) * r; x < x1 + r; x += r * 2) {
    q.moveTo(x + Math.cos(.08 * Math.PI) * r * .86, y + Math.sin(.08 * Math.PI) * r * .86); q.arc(x, y, r * .86, .08 * Math.PI, .92 * Math.PI); q.arc(x, y - r * .18, r * .5, .88 * Math.PI, .12 * Math.PI, true); q.closePath(); } }, 'nonzero');
}
function celosia(g, x0, y0, x1, y1, s = 14, w = 3) {
  recorte(g, q => { let f = 0; for (let y = y0; y < y1 + s; y += s / 2, f++) for (let x = x0 + (f % 2) * s / 2; x < x1 + s; x += s) { const h = s / 2 - w;
    q.moveTo(x, y - h * .9); q.lineTo(x + h, y); q.lineTo(x, y + h * .9); q.lineTo(x - h, y); q.closePath(); } }, 'nonzero');
}
function moneda(g, x, y, r) { recorte(g, q => { q.arc(x, y, r, 0, 6.283); q.rect(x - r * .38, y - r * .38, r * .76, r * .76); }, 'evenodd'); }
function nubeEspiral(g, x, y, r, rot = 0, w = 2, giro = 1) {
  recorteLinea(g, w, q => { for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2.2, rr = r * (1 - i / 40 * .78), px = x + Math.cos(rot + a * giro) * rr, py = y + Math.sin(rot + a * giro) * rr; i ? q.lineTo(px, py) : q.moveTo(px, py); } });
}
function cuentas(g, pts, r) { recorte(g, q => { for (const [x, y] of pts) { q.moveTo(x + r, y); q.arc(x, y, r, 0, 6.283); } }); }
function remache(g, x, y, r = 4) {
  g.save(); g.globalCompositeOperation = 'multiply'; g.beginPath(); g.arc(x, y, r * .74, 0, 6.283); g.strokeStyle = '#2e1c10'; g.lineWidth = r * .52; g.stroke();
  g.beginPath(); g.arc(x, y, r * .48, 0, 6.283); g.fillStyle = '#b58a5e'; g.fill(); g.restore();
}
// lengua de llama tradicional: raíz ancha, panza, punta que se enrosca en gancho (dir = ±1)
function lenguaLlama(q, h, w, dir = 1) {
  const d = dir; q.moveTo(-w / 2, 0);
  q.bezierCurveTo(-w * .75, -h * .3, -w * .25 * d - w * .1, -h * .55, w * .15 * d, -h * .82);
  q.bezierCurveTo(w * .3 * d, -h * .95, w * .55 * d, -h * 1.02, w * .62 * d, -h * .9);
  q.bezierCurveTo(w * .52 * d, -h * .93, w * .38 * d, -h * .88, w * .36 * d, -h * .76);
  q.bezierCurveTo(w * .55, -h * .5, w * .62, -h * .22, w / 2, 0); q.closePath();
}
// la tela del biombo: trama fina, motas de fibra, manchas de densidad, bordes más oscuros
let _tela = null;
function TELA() {
  if (_tela) return _tela;
  const c = mk(), g = c.getContext('2d'), w = W / 2, h = H / 2, m = campoRuido(w / 4, h / 4, [40, 12], 91), id = g.createImageData(w, h), d = id.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const n = m[(y >> 2) * (w / 4) + (x >> 2)], wx = x + Math.sin(y * .05) * 1.5, wy = y + Math.sin(x * .05) * 1.5;
    const trama = .5 + .25 * Math.sin(wx * 2.2) * Math.sin(wy * 2.2), v = .93 + .05 * trama + (n - .5) * .07 - (hash2(x, y) > .993 ? .06 : 0), i = (y * w + x) * 4;
    d[i] = 255 * v; d[i + 1] = 252 * v; d[i + 2] = 244 * v; d[i + 3] = 255; }
  const s = mk(w, h); s.getContext('2d').putImageData(id, 0, 0); g.drawImage(s, 0, 0, W, H);
  return _tela = c;
}
// campo de luz de lámparas de aceite (lóbulo ancho + punto caliente, ~6:1), cada una titila suave por su cuenta
//   lamparas: [{x, y, r, k}] con k 0→1 (encendida); base = color del cuarto
function luzLamparas(g, lamparas, t, base = '#2a1408') {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.fillStyle = base; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  const n = Math.max(1, lamparas.reduce((a, l) => a + clamp(l.k), 0)), exp = 1 / Math.pow(n, .3);   // más lámparas = el cuadro se blanquea, pero sigue legible
  lamparas.forEach((l, i) => { if (l.k <= 0) return;
    const fl = 1 + .035 * (vnoise(t * 7 + i * 13, i) - .5) * 2 + .012 * Math.sin(t * 23 + i * 2), sobre = l.k < 1 ? 1 + .5 * Math.sin(l.k * Math.PI) : 1, a = clamp(l.k) * fl * sobre * exp;
    const g1 = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r); g1.addColorStop(0, `rgba(255,196,120,${.95 * a})`); g1.addColorStop(.55, `rgba(240,150,70,${.55 * a})`); g1.addColorStop(1, 'rgba(200,100,40,0)');
    g.fillStyle = g1; g.fillRect(0, 0, W, H);
    const g2 = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * .32); g2.addColorStop(0, `rgba(255,240,205,${.7 * a})`); g2.addColorStop(1, 'rgba(255,220,160,0)');
    g.fillStyle = g2; g.fillRect(0, 0, W, H); });
  g.restore();
}
function viñetaCalida(g, a = .5, col = '60,25,8') {
  const v = g.createRadialGradient(W / 2, H / 2, W * .35, W / 2, H / 2, H * .72); v.addColorStop(0, `rgba(${col},0)`); v.addColorStop(1, `rgba(${col},${a})`);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = v; g.fillRect(0, 0, W, H); g.restore();
}

// ---------- papel recortado (de frente, opaco) ----------
let _granoP = null;
function GRANO_PAPEL() {
  if (_granoP) return _granoP;
  const N = 256, c = mk(N, N), g = c.getContext('2d'), id = g.createImageData(N, N), d = id.data;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const f = vnoise(x / 18, y / 18) * .6 + vnoise(x / 4, y / 4) * .25 + hash2(x, y) * .15, v = 108 + f * 40 - (hash2(x * 3, y) > .992 ? 30 : 0), i = (y * N + x) * 4;
    d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  g.putImageData(id, 0, 0); fibrasEn(g, 220, '#d8d8d8', .25, .8, 5, 30, N, N); fibrasEn(g, 120, '#4a4a4a', .18, .7, 6, 24, N, N);
  return _granoP = c;
}
// una pieza de papel: dibujo(g) llena y recorta (con recorte/recorteLinea); se le pone grano, filo claro arriba-izq y oscuro abajo-der, y su sombra
function piezaPapel(w, h, dibujo, o = {}) {
  const { grano = .55, filo = 1.6, semilla = 1, sombra = 7 } = o, c = mk(w, h), g = c.getContext('2d');
  g.lineJoin = g.lineCap = 'round'; dibujo(g);
  const m = mk(w, h), mg = m.getContext('2d'); mg.drawImage(c, 0, 0);
  if (grano) { g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = grano; const pat = g.createPattern(GRANO_PAPEL(), 'repeat');
    pat.setTransform(new DOMMatrix([1, 0, 0, 1, (semilla * 97) % 256, (semilla * 53) % 256])); g.fillStyle = pat; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-in'; g.globalAlpha = 1; g.drawImage(m, 0, 0); g.restore(); }
  if (filo) for (const [dx, col, a] of [[filo, '255,240,220', .55], [-filo, '40,10,5', .5]]) {
    const r = mk(w, h), rg = r.getContext('2d'); rg.drawImage(m, 0, 0); rg.globalCompositeOperation = 'source-in'; rg.fillStyle = `rgba(${col},${a})`; rg.fillRect(0, 0, w, h);
    rg.globalCompositeOperation = 'destination-out'; rg.drawImage(m, dx, dx); g.save(); g.globalCompositeOperation = 'source-atop'; g.drawImage(r, 0, 0); g.restore(); }
  let s = null;
  if (sombra) { s = mk(w + 60, h + 60); const sg = s.getContext('2d'); sg.filter = `blur(${sombra * .6}px)`; sg.drawImage(m, 30, 30); sg.filter = 'none';
    sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgba(20,5,0,.45)'; sg.fillRect(0, 0, w + 60, h + 60); }
  return { c, sombra: s, w, h };
}
function ponerPapel(g, p, x, y, sx = 6, sy = 8) { if (p.sombra) g.drawImage(p.sombra, x - 30 + sx, y - 30 + sy); g.drawImage(p.c, x, y); }
// diente de sierra: fila de triangulitos recortados (pasto, flecos, tejas)
function dienteSierra(g, x0, x1, y, alto, paso) { recorte(g, q => { for (let x = x0; x < x1; x += paso) { q.moveTo(x, y); q.lineTo(x + paso / 2, y - alto); q.lineTo(x + paso, y); q.closePath(); } }, 'nonzero'); }

// rosetón D4: cuña(g, R) recorta en el sector [0, π/4] (coordenadas centradas); se aplica 8 veces (4 giros × espejo)
function rosetaD4(R, col, cuña, o = {}) {
  const S = Math.ceil(R * 2 + 8), c = mk(S, S), g = c.getContext('2d'); g.translate(S / 2, S / 2);
  g.fillStyle = col; g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.fill();
  for (let k = 0; k < 4; k++) for (const esp of [1, -1]) { g.save(); g.rotate(k * Math.PI / 2); g.scale(1, esp);
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R + 4, -.002, Math.PI / 4 + .002); g.closePath(); g.clip(); cuña(g, R); g.restore(); }
  // pliegues: líneas tenues donde estuvo doblado (verdad del oficio)
  g.save(); g.globalCompositeOperation = 'source-atop'; g.strokeStyle = 'rgba(60,0,0,.18)'; g.lineWidth = 1.2;
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(-Math.cos(a) * R, -Math.sin(a) * R); g.lineTo(Math.cos(a) * R, Math.sin(a) * R); g.stroke(); }
  g.restore();
  const p = piezaPapel(S, S, x => x.drawImage(c, 0, 0), { semilla: o.semilla || 3, sombra: 9 });
  return p;
}
// desplegar: el rosetón doblado en una cuña de 45° se abre en tres dobleces (45 → 90 → 180 → 360°)
//   p 0→1 (tres tramos); cada colgajo gira sobre su eje: se aplasta con cos, se agranda un poco a lo largo del pliegue y se oscurece de pie
function desplegar(g, RF, cx, cy, p, o = {}) {
  const S = RF.c.width, R = S / 2, abierto = [[-0.0001, Math.PI / 4], [-Math.PI / 4, Math.PI / 4], [-Math.PI / 4, 3 * Math.PI / 4], [-Math.PI, Math.PI]];
  const tramo = Math.min(2, Math.floor(clamp(p) * 3)), k = clamp(p * 3 - tramo), lleno = p >= 1;
  const sector = (a0, a1, fn) => { g.save(); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R + 2, a0, a1); g.closePath(); g.clip(); fn(); g.restore(); };
  if (lleno) { ponerPapel(g, RF, cx - R, cy - R); return; }
  const [a0, a1] = abierto[tramo]; sector(a0, a1, () => ponerPapel(g, RF, cx - R, cy - R));
  // el colgajo: la parte que queda espejada al otro lado del eje
  const s = -Math.cos(Math.PI * k), crece = 1 + (o.perspectiva ?? .1) * Math.sin(Math.PI * k);
  const [b0, b1] = tramo === 0 ? [-Math.PI / 4, 0] : tramo === 1 ? [Math.PI / 4, 3 * Math.PI / 4] : [3 * Math.PI / 4, 7 * Math.PI / 4];
  const eje = tramo === 0 ? 0 : tramo === 1 ? Math.PI / 4 : 3 * Math.PI / 4;
  g.save(); g.translate(cx, cy); g.rotate(eje); g.scale(crece, s); g.rotate(-eje); g.translate(-cx, -cy);
  sector(b0, b1, () => { g.drawImage(RF.c, cx - R, cy - R);
    const osc = 1 - Math.abs(s); if (osc > 0) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = s < 0 ? `rgba(255,190,170,${.35 * osc})` : `rgba(40,0,0,${.45 * osc})`; g.fillRect(cx - R, cy - R, S, S); } });
  g.restore();
}

// ---------- caja de papel con luz ----------
// una hoja: dibujo(g) llena la silueta (los agujeros con recorte); se le pone fibra, borde de luz arriba y banda oscura abajo
function capaLinterna(dibujo, col, o = {}) {
  const { rim = 'rgba(255,214,150,.55)', borde = 'rgba(0,0,0,.35)', fibra = .18, semilla = 1 } = o, c = mk(), g = c.getContext('2d');
  g.fillStyle = col; g.strokeStyle = col; dibujo(g);
  const m = mk(); m.getContext('2d').drawImage(c, 0, 0);
  g.save(); g.globalCompositeOperation = 'source-atop'; fibrasEn(g, 1800, '#ffffff', fibra * .5, .8, semilla + 3); fibrasEn(g, 900, '#000000', fibra * .5, .8, semilla + 4);
  for (const [dy, cc, w] of [[4, rim, 1], [-7, borde, 1]]) { const r = mk(), rg = r.getContext('2d'); rg.drawImage(m, 0, 0); rg.globalCompositeOperation = 'source-in'; rg.fillStyle = cc; rg.fillRect(0, 0, W, H);
    rg.globalCompositeOperation = 'destination-out'; rg.drawImage(m, 0, dy); g.drawImage(r, 0, 0); }
  g.restore();
  return c;
}
function sombraDe(capa, blur = 14, a = .55) {
  const s = mk(), g = s.getContext('2d'); g.filter = `blur(${blur}px)`; g.drawImage(capa, 0, 0); g.filter = 'none';
  g.globalCompositeOperation = 'source-in'; g.fillStyle = `rgba(5,5,15,${a})`; g.fillRect(0, 0, W, H); return s;
}
