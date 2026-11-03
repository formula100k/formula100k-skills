// ============================================================================
// cine-3d.js · motor 2.5D en canvas 2D para el grupo «Materiales y 3D»
// Técnica adaptada de lemo-opuscar (MIT, © 2026 LemoLab). Sin three.js ni WebGL: todo es canvas 2D.
//
// Lo usan: cine-brick-toy, cine-paper-popup, cine-tilt-shift, cine-lowpoly-island,
//          cine-glass-product, cine-memphis-diorama, cine-desktop-flythrough.
//
// Exporta (globales, se carga DESPUÉS de nucleo.js):
//   color:    rgbDe(hex) · rgbTxt([r,g,b], a) · mezclaC(a, b, t) · tonoC(c, f)
//   vector:   V3.sub/add/mul/dot/cross/norm/len/lerp
//   cámara:   camara({ objetivo, az, el, dist, fov, orto, escala, cx, cy }) → { proy(p) → [sx, sy, z], P, ... }
//             (orto: true = isométrica/ortográfica; fov en grados; az/el en radianes)
//   formas:   caja(x,y,z,w,h,d,col,o) · techo(x,y,z,w,h,d,col,o) · cilindro(x,y,z,r,h,col,o) · cono(x,y,z,r,h,col,o)
//             hexCol(x,y,z,r,h,colArriba,colLado,o) · cara(pts,col,o) · objeto(caras, o) · moverObj · rotarObjY
//             (x,z = centro de la base; y = base; caja: w en x, h hacia arriba, d en z)
//   pintar:   render3d(g, cam, objetos, o) → orden de pintor + luz de un lado + sombras de contacto suaves
//             + desenfoque de profundidad falso por capas (o.dof = { foco, apertura, max })
//             cara.dibujo(g, cara, cam, colorSombreado) = decoración propia (ventanas, tachas, impresos)
//   ayudas:   puntoCara(cara, u, v) · cuadCara(cara, cam, u0, v0, u1, v1) · rellenarPoli(g, pts2, col)
//             planoImagen(g, cam, img, esquinasMundo[4], o) → una imagen sobre un plano en perspectiva (por tiras)
//             sombraDe(objs, L, ySuelo) · pintarSombras(g, cam, objs, L, o)
//             bandaEnfoque(g, yc, medio, max, o) → tilt-shift: franja nítida y lo demás desenfocado
//             desenfocarCapa(g, fuente, px) · lienzo(w, h)
// Todo es determinista: entra el estado, sale el cuadro.
// ============================================================================

// ---------- color ----------
const _rgbCache = {};
function rgbDe(c) {
  if (Array.isArray(c)) return c;
  if (_rgbCache[c]) return _rgbCache[c];
  let h = c.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const n = parseInt(h, 16); return (_rgbCache[c] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
}
const rgbTxt = (c, a = 1) => { const [r, g, b] = rgbDe(c); return a >= 1 ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`; };
const mezclaC = (a, b, t) => { a = rgbDe(a); b = rgbDe(b); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };
const tonoC = (c, f) => { c = rgbDe(c); const k = Array.isArray(f) ? f : [f, f, f]; return [Math.min(255, c[0] * k[0]), Math.min(255, c[1] * k[1]), Math.min(255, c[2] * k[2])]; };

// ---------- vectores ----------
const V3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: a => Math.hypot(a[0], a[1], a[2]),
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)],
};

// ---------- cámara (órbita alrededor de un objetivo) ----------
function camara(o = {}) {
  const T = o.objetivo || [0, 0, 0], az = o.az || 0, el = o.el ?? .5, dist = o.dist || 10;
  const P = [T[0] + dist * Math.cos(el) * Math.sin(az), T[1] + dist * Math.sin(el), T[2] + dist * Math.cos(el) * Math.cos(az)];
  const f = V3.norm(V3.sub(T, P)), r = V3.norm(V3.cross(f, [0, 1, 0])), u = V3.cross(r, f);
  const foc = (H / 2) / Math.tan((o.fov || 35) * Math.PI / 360);
  const cx = o.cx ?? W / 2, cy = o.cy ?? H / 2, orto = !!o.orto, esc = o.escala || 100, roll = o.roll || 0;
  const cr = Math.cos(roll), sr = Math.sin(roll);
  return {
    P, T, f, r, u, foc, orto, escala: esc, cx, cy, dist,
    proy(p) {
      const v = [p[0] - P[0], p[1] - P[1], p[2] - P[2]];
      let x = v[0] * r[0] + v[1] * r[1] + v[2] * r[2], y = v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
      const z = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
      if (roll) { const x2 = x * cr - y * sr; y = x * sr + y * cr; x = x2; }
      if (orto) return [cx + x * esc, cy - y * esc, z];
      const k = foc / Math.max(z, .001); return [cx + x * k, cy - y * k, z];
    },
    haciaCam(p) { return orto ? V3.mul(f, -1) : V3.norm(V3.sub(P, p)); },
    // tamaño en pantalla de 1 unidad a la profundidad z
    px(z) { return orto ? esc : foc / Math.max(z, .001); },
  };
}

// ---------- formas ----------
const _rotY = (p, c, a) => { if (!a) return p; const s = Math.sin(a), k = Math.cos(a), dx = p[0] - c[0], dz = p[2] - c[2]; return [c[0] + dx * k + dz * s, p[1], c[2] - dx * s + dz * k]; };
const _rotN = (n, a) => { if (!a) return n; const s = Math.sin(a), k = Math.cos(a); return [n[0] * k + n[2] * s, n[1], -n[0] * s + n[2] * k]; };
function cara(pts, col, o = {}) {
  const n = o.n || V3.norm(V3.cross(V3.sub(pts[1], pts[0]), V3.sub(pts[2], pts[0])));
  return Object.assign({ p: pts, n, col }, o, { n });
}
// voltea las normales calculadas que apuntan hacia adentro (para formas convexas)
function _haciaAfuera(caras, c) { for (const f of caras) { const m = f.p.reduce((a, p) => V3.add(a, p), [0, 0, 0]).map(v => v / f.p.length);
  if (V3.dot(f.n, V3.sub(m, c)) < 0) f.n = V3.mul(f.n, -1); } return caras; }
function objeto(caras, o = {}) {
  let c = o.centro;
  if (!c) { c = [0, 0, 0]; let k = 0; for (const f of caras) for (const p of f.p) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; k++; } c = V3.mul(c, 1 / Math.max(1, k)); }
  return Object.assign({ caras, centro: c, sombra: true }, o, { centro: c });
}
// caja: centro de la base en (x, y, z). o.col = { arriba, frente, lado } para colores por cara · o.rot = giro en y
// Las caras van en orden: arriba, +z (frente), -z, +x, -x, (abajo si o.base). Cada cara sabe su «u,v» (esquinas en orden).
function caja(x, y, z, w, h, d, col, o = {}) {
  const c = [x, y, z], R = o.rot || 0, q = p => _rotY(p, c, R);
  const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, y1 = y + h;
  const cc = o.cols || {};
  const F = (pts, n, k) => cara(pts.map(q), cc[k] || col, Object.assign({ n: _rotN(n, R), tipo: k }, o.cara || {}, (o.porCara || {})[k] || {}));
  const caras = [
    F([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], 'arriba'),
    F([[x0, y1, z1], [x1, y1, z1], [x1, y, z1], [x0, y, z1]], [0, 0, 1], 'frente'),
    F([[x1, y1, z0], [x0, y1, z0], [x0, y, z0], [x1, y, z0]], [0, 0, -1], 'atras'),
    F([[x1, y1, z1], [x1, y1, z0], [x1, y, z0], [x1, y, z1]], [1, 0, 0], 'der'),
    F([[x0, y1, z0], [x0, y1, z1], [x0, y, z1], [x0, y, z0]], [-1, 0, 0], 'izq'),
  ];
  if (o.base) caras.push(F([[x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0]], [0, -1, 0], 'abajo'));
  return objeto(caras, Object.assign({ centro: [x, y + h / 2, z] }, o.obj || {}));
}
// techo a dos aguas: cumbrera a lo largo de x (o girado con o.rot)
function techo(x, y, z, w, h, d, col, o = {}) {
  const c = [x, y, z], R = o.rot || 0, q = p => _rotY(p, c, R), cc = o.cols || {};
  const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, y1 = y + h;
  const F = (pts, k) => { const pp = pts.map(q); return cara(pp, cc[k] || col, Object.assign({ tipo: k }, o.cara || {}, (o.porCara || {})[k] || {})); };
  return objeto(_haciaAfuera([
    F([[x0, y1, z], [x1, y1, z], [x1, y, z1], [x0, y, z1]], 'faldon'),
    F([[x1, y1, z], [x0, y1, z], [x0, y, z0], [x1, y, z0]], 'faldonAtras'),
    F([[x1, y, z1], [x1, y1, z], [x1, y, z0]], 'hastial'),
    F([[x0, y, z0], [x0, y1, z], [x0, y, z1]], 'hastialIzq'),
  ], q([x, y + h / 3, z])), Object.assign({ centro: [x, y + h / 3, z] }, o.obj || {}));
}
function cilindro(x, y, z, r, h, col, o = {}) {
  const n = o.lados || 18, cc = o.cols || {}, caras = [], top = [];
  for (let i = 0; i < n; i++) {
    const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2;
    const p0 = [x + Math.sin(a0) * r, 0, z + Math.cos(a0) * r], p1 = [x + Math.sin(a1) * r, 0, z + Math.cos(a1) * r];
    caras.push(cara([[p0[0], y + h, p0[2]], [p1[0], y + h, p1[2]], [p1[0], y, p1[2]], [p0[0], y, p0[2]]], cc.lado || col,
      Object.assign({ n: [Math.sin(am), 0, Math.cos(am)], tipo: 'lado', suave: true }, o.cara || {})));
    top.push([p0[0], y + h, p0[2]]);
  }
  if (o.tapa !== false) caras.push(cara(top.reverse(), cc.arriba || col, Object.assign({ n: [0, 1, 0], tipo: 'arriba' }, o.cara || {}, o.caraTapa || {})));
  return objeto(caras, Object.assign({ centro: [x, y + h / 2, z] }, o.obj || {}));
}
function cono(x, y, z, r, h, col, o = {}) {
  const n = o.lados || 8, caras = [], ph = o.fase || 0;
  for (let i = 0; i < n; i++) {
    const a0 = i / n * Math.PI * 2 + ph, a1 = (i + 1) / n * Math.PI * 2 + ph;
    const p0 = [x + Math.sin(a0) * r, y, z + Math.cos(a0) * r], p1 = [x + Math.sin(a1) * r, y, z + Math.cos(a1) * r];
    caras.push(cara([[x, y + h, z], p0, p1], col, Object.assign({ tipo: 'lado' }, o.cara || {})));
  }
  _haciaAfuera(caras, [x, y + h / 3, z]);
  return objeto(caras, Object.assign({ centro: [x, y + h / 3, z] }, o.obj || {}));
}
// columna hexagonal de punta arriba (isla low-poly). colArriba = tapa, colLado = costados
function hexCol(x, y, z, r, h, colArriba, colLado, o = {}) {
  const caras = [], top = [];
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2 + Math.PI / 6, a1 = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 6;
    const p0 = [x + Math.cos(a0) * r, z + Math.sin(a0) * r], p1 = [x + Math.cos(a1) * r, z + Math.sin(a1) * r];
    caras.push(cara([[p1[0], y + h, p1[1]], [p0[0], y + h, p0[1]], [p0[0], y, p0[1]], [p1[0], y, p1[1]]], colLado, Object.assign({ tipo: 'lado', n: [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)] }, o.cara || {})));
    top.push([p0[0], y + h, p0[1]]);
  }
  caras.push(cara(top.reverse(), colArriba, Object.assign({ n: [0, 1, 0], tipo: 'arriba' }, o.cara || {})));
  return objeto(caras, Object.assign({ centro: [x, y + h / 2, z] }, o.obj || {}));
}
function moverObj(ob, d) { for (const f of ob.caras) f.p = f.p.map(p => V3.add(p, d)); ob.centro = V3.add(ob.centro, d); return ob; }
function rotarObjY(ob, a, c = ob.centro) { for (const f of ob.caras) { f.p = f.p.map(p => _rotY(p, c, a)); f.n = _rotN(f.n, a); } ob.centro = _rotY(ob.centro, c, a); return ob; }
// escala alrededor de un punto (para squash y crecimiento): k = [kx, ky, kz]
function escalarObj(ob, k, c) { const f = p => [c[0] + (p[0] - c[0]) * k[0], c[1] + (p[1] - c[1]) * k[1], c[2] + (p[2] - c[2]) * k[2]];
  for (const q of ob.caras) q.p = q.p.map(f); ob.centro = f(ob.centro); return ob; }

// ---------- ayudas de cara ----------
function puntoCara(f, u, v) { // bilineal sobre las 4 primeras esquinas (0=arriba-izq, 1=arriba-der, 2=abajo-der, 3=abajo-izq)
  const [a, b, c, d] = f.p; const top = V3.lerp(a, b, u), bot = V3.lerp(d, c, u); return V3.lerp(top, bot, v);
}
function cuadCara(f, cam, u0, v0, u1, v1) { return [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => cam.proy(puntoCara(f, u, v))); }
function trazarPoli(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
function rellenarPoli(g, pts, col, a = 1) { trazarPoli(g, pts); g.fillStyle = typeof col === 'string' && a >= 1 ? col : rgbTxt(col, a); g.fill(); }
function lienzo(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------- sombreado de una luz ----------
// o.luz (dirección HACIA la luz) · o.amb · o.dif · o.cielo (tinte de lo que mira arriba) · o.sombraTinte (tinte de lo que da la espalda)
// o.tonos = 'tres' → tres tonos duros (arriba brillante, lado al sol base, lado contrario ×0.62–0.9)
function sombrear(f, o, L) {
  const base = rgbDe(f.col);
  if (f.emite) return base;
  const lam = Math.max(0, V3.dot(f.n, L));
  if (o.tonos === 'tres') {
    const c3 = f.n[1] > .6 ? tonoC(base, o.arribaK || 1.06) : lam > .08 ? base : tonoC(base, o.ladoK || [.78, .72, .9]);
    return o.tinte ? tonoC(c3, o.tinte) : c3;
  }
  const amb = o.amb ?? .5, dif = o.dif ?? .55;
  let c = tonoC(base, amb + dif * lam);
  if (o.cielo && f.n[1] > 0) c = mezclaC(c, o.cielo, f.n[1] * (o.cieloK ?? .08));
  if (o.sombraTinte) c = mezclaC(c, tonoC(base, o.sombraTinte), (1 - lam) * (o.sombraK ?? .35));
  if (o.tinte) c = tonoC(c, o.tinte);          // color de la hora (noche = corrimiento a violeta); lo que emite no se toca
  return c;
}

// ---------- sombras sobre el suelo ----------
function _casco(pts) { // casco convexo 2D (cadena monótona)
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (P.length < 3) return P;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}
// casco de la sombra de un objeto proyectada por la luz L sobre el plano y = ySuelo (en mundo: [x, z])
function sombraDe(ob, L, ySuelo = 0) {
  const pts = [], yc = ob.cortarY;
  for (const f of ob.caras) for (let p of f.p) { if (yc != null) p = [p[0], Math.max(p[1], yc), p[2]]; const k = (p[1] - ySuelo) / Math.max(.05, L[1]); pts.push([p[0] - L[0] * k, p[2] - L[2] * k]); }
  return _casco(pts);
}
// pinta todas las sombras en una capa y la compone una vez (así no se oscurecen dos veces).
// o.col · o.alpha · o.blur (px) · o.ySuelo · o.contacto (alpha de la sombra de contacto, la huella bajo el objeto)
function pintarSombras(g, cam, objs, L, o = {}) {
  const cap = _capa(0), x = cap.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
  x.fillStyle = '#000';
  for (const ob of objs) { if (!ob.sombra || ob.oculto) continue;
    const ys = ob.ySombra ?? o.ySuelo ?? 0, cs = sombraDe(ob, L, ys); if (cs.length < 3) continue;
    trazarPoli(x, cs.map(([a, b]) => cam.proy([a, ys, b]))); x.fill(); }
  g.save(); g.globalAlpha = o.alpha ?? .35; if (o.blur) g.filter = `blur(${o.blur}px)`;
  if (o.col) { x.globalCompositeOperation = 'source-in'; x.fillStyle = typeof o.col === 'string' ? o.col : rgbTxt(o.col); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; }
  g.drawImage(cap, 0, 0); g.restore();
  if (o.contacto) { // huella: la base del objeto, un poco más grande y más oscura, casi sin desenfoque
    x.clearRect(0, 0, W, H); x.fillStyle = '#000';
    for (const ob of objs) { if (!ob.sombra || ob.oculto) continue;
      let ymin = Infinity; for (const f of ob.caras) for (const p of f.p) ymin = Math.min(ymin, p[1]);
      const ys = ob.ySombra ?? o.ySuelo ?? 0; if (ymin - ys > (o.alturaContacto ?? .3)) continue;
      const base = []; for (const f of ob.caras) for (const p of f.p) if (p[1] - ymin < .02) base.push([p[0], p[2]]);
      const cs = _casco(base); if (cs.length < 3) continue;
      const cx = cs.reduce((a, p) => a + p[0], 0) / cs.length, cz = cs.reduce((a, p) => a + p[1], 0) / cs.length, k = o.contactoK ?? 1.12;
      trazarPoli(x, cs.map(([a, b]) => cam.proy([cx + (a - cx) * k, ys, cz + (b - cz) * k]))); x.fill(); }
    g.save(); g.globalAlpha = o.contacto; g.filter = `blur(${o.blurContacto ?? 6}px)`; g.drawImage(cap, 0, 0); g.restore();
  }
}

// ---------- capas de trabajo (se reusan) ----------
const _CAPAS = [];
function _capa(i) { if (!_CAPAS[i]) _CAPAS[i] = lienzo(W, H); return _CAPAS[i]; }
const _MEDIA = {};
// desenfoque barato: se achica a la mitad, se desenfoca allí y se vuelve a agrandar
function desenfocarCapa(g, fuente, px, alpha = 1) {
  if (px < .6) { g.save(); g.globalAlpha = alpha; g.drawImage(fuente, 0, 0); g.restore(); return; }
  const k = px > 6 ? 4 : 2, w = Math.ceil(W / k), h = Math.ceil(H / k), key = k;
  if (!_MEDIA[key]) _MEDIA[key] = [lienzo(w, h), lienzo(w, h)];
  const [a, b] = _MEDIA[key], xa = a.getContext('2d'), xb = b.getContext('2d');
  xa.setTransform(1, 0, 0, 1, 0, 0); xa.clearRect(0, 0, w, h); xa.drawImage(fuente, 0, 0, w, h);
  xb.setTransform(1, 0, 0, 1, 0, 0); xb.clearRect(0, 0, w, h); xb.filter = `blur(${(px / k).toFixed(2)}px)`; xb.drawImage(a, 0, 0); xb.filter = 'none';
  g.save(); g.globalAlpha = alpha; g.imageSmoothingEnabled = true; g.drawImage(b, 0, 0, W, H); g.restore();
}

// ---------- el render ----------
// objs: lista de objetos (de caja, cilindro…). o: { luz, amb, dif, tonos, borde: {col, w}, dof: {foco, apertura, max, niveles},
//        sombras: { alpha, blur, col, contacto } | false, antes(g) }
// ob.cortarY = y: no se pinta lo que queda por debajo de esa altura (agua). Cada cara puede traer: emite (no se sombrea), alpha, borde {col,w}, brillo (0..1 franja especular plana), dibujo(g, f, cam, col)
function render3d(g, cam, objs, o = {}) {
  const L = V3.norm(o.luz || [-.5, .8, .4]);
  const lista = objs.filter(ob => ob && !ob.oculto).map(ob => { const z = cam.proy(ob.centro)[2]; return { ob, z, zo: z + (ob.zBias || 0) }; });
  lista.sort((a, b) => b.zo - a.zo);
  if (o.sombras) pintarSombras(g, cam, lista.map(e => e.ob).filter(ob => !ob.sinSombra), L, o.sombras);
  const dof = o.dof, niveles = (dof && dof.niveles) || [0, 1.5, 3, 5, 8, 12, 17];
  const nivel = z => { if (!dof) return 0; const b = Math.min(dof.max ?? 18, (dof.apertura || 0) * Math.abs(1 - dof.foco / Math.max(z, .01)));
    let k = 0; for (let i = 0; i < niveles.length; i++) if (b >= niveles[i] - .01) k = i; return niveles[k]; };
  let i = 0;
  while (i < lista.length) {
    const nb = nivel(lista[i].z); let j = i;
    while (j < lista.length && nivel(lista[j].z) === nb) j++;
    if (nb === 0) for (let k = i; k < j; k++) _pintarObj(g, cam, lista[k].ob, L, o);
    else { const cap = _capa(1), x = cap.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
      for (let k = i; k < j; k++) _pintarObj(x, cam, lista[k].ob, L, o);
      desenfocarCapa(g, cap, nb); }
    i = j;
  }
}
function _pintarObj(g, cam, ob, L, o) {
  if (ob.antes) ob.antes(g, cam, ob);
  const caras = [];
  for (let f of ob.caras) {
    if (ob.cortarY != null) { const pts = _cortarY(f.p, ob.cortarY); if (pts.length < 3) continue; if (pts.length !== f.p.length || pts.some((p, k) => p !== f.p[k])) f = Object.assign({}, f, { p: pts, brillo: 0 }); }
    const c = f.p.reduce((a, p) => V3.add(a, p), [0, 0, 0]).map(v => v / f.p.length);
    const vis = V3.dot(f.n, cam.haciaCam(c));
    if (vis <= 0 && !f.dobleCara) continue;
    const p2 = f.p.map(p => cam.proy(p)); if (p2.some(p => p[2] < .01)) continue;
    caras.push({ f, p2, z: p2.reduce((a, p) => a + p[2], 0) / p2.length, vis });
  }
  if (!ob.sinOrden) caras.sort((a, b) => (a.f.orden || 0) - (b.f.orden || 0) || b.z - a.z);
  for (const { f, p2, vis } of caras) {
    const col = f.colFijo ? rgbDe(f.colFijo) : sombrear(f, o, L);
    g.save(); if (f.alpha != null || ob.alpha != null) g.globalAlpha = (f.alpha ?? 1) * (ob.alpha ?? 1);
    trazarPoli(g, p2); g.fillStyle = rgbTxt(col); g.fill();
    const bd = f.borde || ob.borde || o.borde;
    if (bd) { g.strokeStyle = bd.col; g.lineWidth = bd.w || 2; g.lineJoin = 'round'; g.stroke(); }
    else if (!f.sinCostura) { g.strokeStyle = rgbTxt(col); g.lineWidth = .9; g.lineJoin = 'round'; g.stroke(); }  // tapa la costura entre caras
    if (f.brillo) { // brillo especular plano: una franja limpia arriba de la cara, más fuerte cuando la cara mira hacia la luz y la cámara
      const Hh = V3.norm(V3.add(L, cam.haciaCam(f.p[0]))), s = Math.pow(Math.max(0, V3.dot(f.n, Hh)), f.brilloExp || 3) * f.brillo;
      if (s > .02 && f.p.length >= 4) { const b = f.brilloBanda || [.08, .1, .92, .26];
        rellenarPoli(g, cuadCara(f, cam, b[0], b[1], b[2], b[3]), [255, 255, 255], Math.min(.85, s)); }
    }
    if (f.dibujo) f.dibujo(g, f, cam, col, p2);
    g.restore();
  }
  if (ob.despues) ob.despues(g, cam, ob);
}

// recorta un polígono al semiespacio y ≥ yc (lo que queda bajo el agua no se pinta)
function _cortarY(P, yc) { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = a[1] >= yc, ib = b[1] >= yc;
    if (ia) out.push(a); if (ia !== ib) { const k = (yc - a[1]) / (b[1] - a[1]); out.push(V3.lerp(a, b, k)); } } return out; }

// ---------- una imagen sobre un plano en perspectiva ----------
// esquinas en mundo: [arriba-izq, arriba-der, abajo-der, abajo-izq] de la imagen. Se pinta en tiras horizontales con su propia afín.
function planoImagen(g, cam, img, E, o = {}) {
  const n = o.tiras || 24, iw = img.width, ih = img.height;
  g.save(); if (o.alpha != null) g.globalAlpha = o.alpha;
  for (let i = 0; i < n; i++) {
    const v0 = i / n, v1 = (i + 1) / n;
    const TL = cam.proy(V3.lerp(E[0], E[3], v0)), TR = cam.proy(V3.lerp(E[1], E[2], v0)), BL = cam.proy(V3.lerp(E[0], E[3], v1));
    const sy = v0 * ih, sh = (v1 - v0) * ih;
    const a = (TR[0] - TL[0]) / iw, b = (TR[1] - TL[1]) / iw, c = (BL[0] - TL[0]) / sh, d = (BL[1] - TL[1]) / sh;
    g.save(); g.transform(a, b, c, d, TL[0] - c * sy, TL[1] - d * sy);
    g.drawImage(img, 0, sy, iw, Math.min(ih - sy, sh * 1.06 + 1), 0, sy, iw, Math.min(ih - sy, sh * 1.06 + 1));
    g.restore();
  }
  g.restore();
}

// ---------- tilt-shift: franja nítida, lo demás se va desenfocando ----------
// yc = centro de la franja (px) · medio = media altura nítida · max = desenfoque máximo (px) · o.pasos · o.rampa (px hasta el máximo)
function bandaEnfoque(g, yc, medio, max, o = {}) {
  const pasos = o.pasos || 5, rampa = o.rampa || 520;
  const base = _capa(2), x = base.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.drawImage(g.canvas, 0, 0);
  const tmp = _capa(3), y = tmp.getContext('2d');
  for (let k = 1; k <= pasos; k++) {
    const d0 = medio + (k - 1) / pasos * rampa, d1 = medio + k / pasos * rampa, b = max * Math.pow(k / pasos, 1.15);
    y.setTransform(1, 0, 0, 1, 0, 0); y.globalCompositeOperation = 'source-over'; y.clearRect(0, 0, W, H);
    desenfocarCapa(y, base, b);
    // máscara con borde suave: 0 dentro de la franja, sube a 1 entre d0 y d1 (sin escalones visibles)
    const gr = y.createLinearGradient(0, 0, 0, H), st = v => clamp(v / H);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(st(yc - d1), 'rgba(0,0,0,1)'); gr.addColorStop(st(yc - d0), 'rgba(0,0,0,0)');
    gr.addColorStop(st(yc + d0), 'rgba(0,0,0,0)'); gr.addColorStop(st(yc + d1), 'rgba(0,0,0,1)');
    gr.addColorStop(1, 'rgba(0,0,0,1)');
    y.globalCompositeOperation = 'destination-in'; y.fillStyle = gr; y.fillRect(0, 0, W, H); y.globalCompositeOperation = 'source-over';
    g.drawImage(tmp, 0, 0);
  }
}
