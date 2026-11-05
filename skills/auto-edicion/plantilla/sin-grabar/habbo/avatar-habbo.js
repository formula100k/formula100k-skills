// avatar-habbo.js · avatar 3D de cubitos estilo Habbo (pixel art con contorno y 3 tonos) para «Sin grabar».
// Se dibuja cuadro por cuadro con three.js sobre el canvas 2D de la pieza (nada de PNG por pose).
// Uso (la pieza carga three con <script type="module"> y deja window.THREE; este archivo no toca THREE al cargarse):
//   await AvatarHabbo.iniciar({ ancho: 1080, alto: 880, look: LOOK })
//   AvatarHabbo.linea(eventos, palabras, boca, fps)   // eventos [{t, g}], palabras [t…], boca [0..1 por cuadro]
//   AvatarHabbo.dibujar(ctx, t, x, y)
// Gestos (g): 'descanso', 'explica', 'senala', 'sorpresa', 'pulgar', 'pensar'.
// El look (colores de piel, pelo, ropa, lentes…) llega desde la pieza: aquí no hay nada fijo de ninguna persona.
(function () {
const A = {};
let THREE, R, escena, cam, cuerpo, cab, cara, brazos, L;
let EV = [], PAL = [], BOCA = [], FPS = 30;

// look por defecto (neutro): la pieza lo pisa con su objeto LOOK
const LOOK0 = {
  piel: ['#f0c19c', '#d9a07a', '#b97c58', '#7a4a32'],      // luz, base, sombra, contorno
  pelo: ['#6b4a35', '#4e3424', '#3a2619', '#1e120b'],
  ropa: ['#9fc3ff', '#6f9fe8', '#4f7cc4', '#26406b'],
  ojos: ['#6b3f22', '#3a2010'],
  labios: ['#b83a58', '#e0657f'],
  pelo_largo: true,      // mechones a los lados y en la espalda
  lentes: null,          // color del marco ('#15110f') o null
  diadema: null,         // 4 tonos o null
  aretes: false,
  collar: false,
  botones: '#fffaf0',
};

// ---------- texturas de pixeles nítidos ----------
function pixTex(gw, gh, draw) {
  const c = document.createElement('canvas'), z = 8;
  c.width = gw * z; c.height = gh * z;
  const x = c.getContext('2d');
  const px = (a, b, col, w = 1, h = 1) => { if (!col) return; x.fillStyle = col; x.fillRect(a * z, b * z, w * z, h * z); };
  draw(px, gw, gh, x, z);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
}
const pmat = (tex, alfa = false) => new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0, transparent: alfa, alphaTest: alfa ? 0.5 : 0 });
const mats = {};
const mat = (c, em = 0) => mats[c + em] || (mats[c + em] = new THREE.MeshStandardMaterial({ color: c, roughness: 1, metalness: 0, emissive: em ? c : 0x000000, emissiveIntensity: em }));
function box(w, h, d, c, x = 0, y = 0, z = 0, em = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, em)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; }
function ball(r, c, x = 0, y = 0, z = 0, em = 0) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat(c, em)); m.position.set(x, y, z); return m; }
// relleno con sombreado: luz arriba-izquierda, sombra abajo-derecha, contorno de 1 celda
function relleno(px, gw, gh, P, borde = true) {
  px(0, 0, P[1], gw, gh);
  for (let i = 1; i < gw - 1; i++) px(i, 1, P[0]);
  for (let j = 1; j < gh - 1; j++) px(1, j, P[0]);
  for (let i = 2; i < gw - 1; i++) px(i, gh - 2, P[2]);
  for (let j = 2; j < gh - 1; j++) px(gw - 2, j, P[2]);
  if (borde) { px(0, 0, P[3], gw, 1); px(0, gh - 1, P[3], gw, 1); px(0, 0, P[3], 1, gh); px(gw - 1, 0, P[3], 1, gh); }
}
// caja con una textura por cara: caras = { todas, frente, atras, arriba, abajo, der, izq }
function hbox(w, h, d, caras, x0 = 0, y0 = 0, z0 = 0, alfa = false) {
  const D = 32, g = (a) => Math.max(3, Math.round(a * D));
  const dims = { der: [g(d), g(h)], izq: [g(d), g(h)], arriba: [g(w), g(d)], abajo: [g(w), g(d)], frente: [g(w), g(h)], atras: [g(w), g(h)] };
  const ms = ['der', 'izq', 'arriba', 'abajo', 'frente', 'atras'].map((k) => pmat(pixTex(dims[k][0], dims[k][1], caras[k] || caras.todas), alfa));
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), ms);
  m.position.set(x0, y0, z0); m.castShadow = m.receiveShadow = true;
  return m;
}
const liso = (P) => (px, gw, gh) => relleno(px, gw, gh, P);
function rng(seed) { let s = seed >>> 0; return () => { s += 0x6d2b79f5; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
// mechones: vetas verticales de 3 tonos, banda de brillo y puntas disparejas
function mechones(px, gw, gh, { brillo = 0.22, semilla = 3 } = {}) {
  const P = L.pelo, r = rng(semilla);
  px(0, 0, P[2], gw, gh);
  for (let i = 0; i < gw; i++) {
    const tono = i % 3 === 0 ? P[3] : i % 3 === 1 ? P[1] : P[2];
    for (let j = 0; j < gh; j++) if (r() < 0.55) px(i, j, tono);
    const b = Math.round(gh * brillo + Math.sin(i * 0.9) * 1.5);
    px(i, b, P[0]); if (i % 2) px(i, b + 1, P[0]); if (i % 3 === 0) px(i, b - 1, P[1]);
  }
  px(0, 0, P[3], 1, gh); px(gw - 1, 0, P[3], 1, gh);
}
const mechonesCon = (op) => (px, gw, gh, x, z) => {
  mechones(px, gw, gh, op);
  if (op.puntas) for (let i = 0; i < gw; i++) { const c = 1 + ((i * 7) % 3); x.clearRect(i * z, (gh - c) * z, z, c * z); px(i, gh - c - 1, L.pelo[3]); }
};

// lienzo vivo: se redibuja solo cuando cambia su estado
function lienzo(w, h, pw, ph, draw) {
  const c = document.createElement('canvas'); c.width = pw; c.height = ph;
  const x = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 1, transparent: true, alphaTest: 0.5 }));
  let kk = null;
  m.userData.set = (e) => { const s = JSON.stringify(e); if (s === kk) return; kk = s; draw(x, pw, ph, e); tex.needsUpdate = true; };
  return m;
}

// ---------- cara 32 × 32: cejas, ojos con pestañas e iris, nariz, rubor tramado y boca de 3 aperturas ----------
function pintaCara(x, w, h, s) {
  x.clearRect(0, 0, w, h);
  const c = s.cara || 'normal', z = w / 32;
  const r = (a, b, ww, hh, col) => { x.fillStyle = col; x.fillRect(a * z, b * z, ww * z, hh * z); };
  const Pi = L.piel, PEST = '#1c100a', BL = '#ffffff', [IRIS, IRIS2] = L.ojos;
  r(0, 26, 2, 6, Pi[2]); r(30, 26, 2, 6, Pi[2]); r(2, 30, 28, 2, Pi[2]);
  const dy = c === 'sorpresa' ? -1 : 0;
  const ceja = (a, lado) => {
    const forma = c === 'seria' ? [1, 1, 0, 0, 0, 0] : [1, 0, 0, 0, 0, 1];
    for (let i = 0; i < 6; i++) { const k2 = lado < 0 ? i : 5 - i; r(a + i, 12 + dy + forma[k2], 1, 1, Pi[3]); r(a + i, 13 + dy + forma[k2], 1, 1, L.pelo[3]); }
  };
  ceja(6, -1); ceja(20, 1);
  const ojo = (a, lado) => {
    if (s.parpadeo || c === 'feliz') {
      if (c === 'feliz' && !s.parpadeo) { r(a + 1, 15, 3, 1, PEST); r(a, 16, 1, 1, PEST); r(a + 4, 16, 1, 1, PEST); r(a - 1, 17, 1, 1, PEST); r(a + 5, 17, 1, 1, PEST); }
      else { r(a, 17, 5, 1, PEST); r(lado < 0 ? a - 1 : a + 5, 16, 1, 1, PEST); }
      return;
    }
    const alto = c === 'sorpresa' ? 4 : 3, my = s.arriba ? -1 : 0;
    r(a, 16, 5, alto, BL);
    r(a + 1, 16, 3, alto + my, IRIS); r(a + 2, 16 + Math.floor(alto / 2) + my, 1, 1, IRIS2); if (!my) r(a + 2, 16 + alto - 1, 2, 1, IRIS2);
    r(a + 1, 16, 1, 1, BL);
    r(a - 1, 15, 7, 1, PEST);
    r(lado < 0 ? a - 2 : a + 6, 14, 1, 1, PEST); r(lado < 0 ? a - 1 : a + 5, 14, 1, 1, PEST);
    r(a, 16 + alto, 5, 1, Pi[2]);
  };
  ojo(7, -1); ojo(20, 1);
  r(16, 18, 1, 3, Pi[0]); r(17, 19, 1, 3, Pi[2]); r(15, 22, 1, 1, Pi[3]); r(18, 22, 1, 1, Pi[3]); r(16, 22, 2, 1, Pi[2]);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) { r(4 + i, 21 + j, 1, 1, 'rgba(235,100,130,.55)'); r(24 + i, 21 + j, 1, 1, 'rgba(235,100,130,.55)'); }
  const [L1, L2] = L.labios, LB = 'rgba(255,255,255,.85)', OSC = '#4a1020', DI = '#ffffff';
  const ab = s.boca || 0;   // 0 cerrada · 1 media · 2 abierta (sale del volumen de la voz)
  if (ab === 2) { r(13, 24, 7, 1, L1); r(13, 25, 7, 3, OSC); r(14, 25, 5, 1, DI); r(15, 27, 3, 1, '#d9556f'); r(13, 28, 7, 1, L2); }
  else if (ab === 1) { r(13, 24, 7, 1, L1); r(13, 25, 7, 2, OSC); r(14, 25, 5, 1, DI); r(13, 27, 7, 1, L2); r(15, 27, 1, 1, LB); }
  else if (c === 'sorpresa') { r(15, 24, 3, 3, OSC); r(14, 24, 1, 3, L1); r(18, 24, 1, 3, L1); r(15, 23, 3, 1, L1); r(15, 27, 3, 1, L2); }
  else if (c === 'seria') { r(13, 25, 7, 1, L1); r(14, 26, 5, 1, L2); }
  else { r(13, 25, 7, 1, L1); r(12, 24, 1, 1, L1); r(20, 24, 1, 1, L1); r(14, 26, 5, 1, L2); r(15, 26, 1, 1, LB); r(16, 24, 1, 1, L1); }
}
// flequillo de lado con puntas
function pintaFlequillo(x, w, h) {
  const z = w / 32, P = L.pelo;
  const r = (a, b, ww, hh, col) => { x.fillStyle = col; x.fillRect(a * z, b * z, ww * z, hh * z); };
  x.clearRect(0, 0, w, h);
  for (let i = 0; i < 32; i++) {
    const largo = i < 9 ? 3 + Math.floor(i / 4) : 5 + Math.floor((i - 9) / 3) + ((i * 5) % 2);
    const Lg = Math.min(11, largo);
    for (let j = 0; j < Lg; j++) r(i, j, 1, 1, j === Lg - 1 ? P[3] : (i + j) % 3 === 0 ? P[1] : (i % 3 === 0 ? P[3] : P[2]));
    if (Lg > 4) r(i, 2, 1, 1, P[0]);
    if (i % 2 && Lg > 5) r(i, 3, 1, 1, P[0]);
  }
}

// ---------- el personaje ----------
function personaje() {
  const g = new THREE.Group();
  const Pi = L.piel, Ro = L.ropa;
  // torso: escote en V, volado, botones, pliegues
  const frente = (px, gw, gh) => {
    relleno(px, gw, gh, Ro);
    const m = Math.floor(gw / 2);
    for (let j = 0; j < 7; j++) px(m - 4 + Math.floor(j / 2), j, Pi[1], 8 - 2 * Math.floor(j / 2), 1);
    for (let j = 0; j < 7; j++) { px(m - 5 + Math.floor(j / 2), j, Ro[3]); px(m + 4 - Math.floor(j / 2), j, Ro[3]); }
    for (let i = 1; i < gw - 1; i += 2) px(i, 0, Ro[0]);
    for (let j = 8; j < gh - 6; j += 4) { px(m, j, L.botones); px(m, j + 1, Ro[3]); }
    for (const f of [5, gw - 6]) for (let j = 9; j < gh - 4; j++) if (j % 3) px(f, j, Ro[2]);
  };
  g.add(hbox(0.86, 0.82, 0.48, { todas: liso(Ro), frente }, 0, 1.22, 0));
  g.add(hbox(0.3, 0.14, 0.3, { todas: liso(Pi) }, 0, 1.68, 0));
  if (L.collar) {
    for (let i = 0; i < 11; i++) { const u = i / 10 - 0.5; g.add(ball(0.018, 0xdfe3ea, u * 0.34, 1.56 - (0.25 - u * u) * 0.5, 0.245, 0.3)); }
    const dije = new THREE.Group(); dije.add(ball(0.035, 0xdfe3ea, -0.025, 0.02, 0, 0.4), ball(0.035, 0xdfe3ea, 0.025, 0.02, 0, 0.4));
    const pt = box(0.05, 0.05, 0.03, 0xdfe3ea, 0, -0.01, 0, 0.4); pt.rotation.z = Math.PI / 4; dije.add(pt); dije.position.set(0, 1.4, 0.25); g.add(dije);
  }
  // extremidades de cubitos con codo: hombro → codo → mano (+ índice y pulgar que aparecen según el gesto)
  const manga = (px, gw, gh) => relleno(px, gw, gh, Ro);
  const puno = (px, gw, gh) => { relleno(px, gw, gh, Ro); px(1, gh - 3, Ro[0], gw - 2, 1); for (let i = 1; i < gw - 1; i += 2) px(i, gh - 2, Ro[3]); };
  const palma = (px, gw, gh) => { relleno(px, gw, gh, Pi); for (let i = 2; i < gw - 2; i += 2) px(i, gh - 4, Pi[2], 1, 3); };
  const dedo = liso(Pi);
  brazos = [-1, 1].map((s) => {
    const h = new THREE.Group(); h.position.set(s * 0.55, 1.56, 0);
    h.add(hbox(0.22, 0.38, 0.26, { todas: manga }, 0, -0.17, 0));
    const c = new THREE.Group(); c.position.y = -0.34; h.add(c);
    c.add(hbox(0.23, 0.16, 0.27, { todas: puno }, 0, -0.06, 0), hbox(0.2, 0.27, 0.22, { todas: palma }, 0, -0.27, 0));
    const ind = hbox(0.07, 0.16, 0.07, { todas: dedo }, 0, -0.47, 0.04);
    const pul = hbox(0.15, 0.07, 0.07, { todas: dedo }, -s * 0.16, -0.22, 0.04);
    c.add(ind, pul);
    g.add(h); return { h, c, ind, pul, s };
  });
  // cabeza
  cab = new THREE.Group(); cab.position.set(0, 2.2, 0); g.add(cab);
  const ladoCab = (px, gw, gh) => { relleno(px, gw, gh, Pi); const m = Math.floor(gw / 2), e = Math.floor(gh * 0.45); px(m - 2, e, Pi[2], 4, 6); px(m - 1, e + 1, Pi[0], 2, 4); px(m - 2, e, Pi[3], 4, 1); };
  cab.add(hbox(0.95, 0.92, 0.84, { todas: liso(Pi), der: ladoCab, izq: ladoCab }, 0, 0, 0));
  cara = lienzo(0.9, 0.9, 320, 320, pintaCara); cara.position.set(0, -0.02, 0.425); cab.add(cara);
  cab.add(hbox(1.03, 0.2, 0.92, { todas: mechonesCon({ brillo: 0.4, semilla: 1 }), arriba: mechonesCon({ brillo: 0.3, semilla: 2 }) }, 0, 0.5, -0.02));
  const fleq = lienzo(1.0, 0.36, 320, 115, pintaFlequillo); fleq.position.set(0, 0.27, 0.44); fleq.userData.set({}); cab.add(fleq);
  if (L.pelo_largo) {
    for (const s of [-1, 1]) cab.add(hbox(0.13, 1.3, 0.82, { todas: mechonesCon({ brillo: 0.12, puntas: true, semilla: 4 + s }) }, s * 0.53, -0.18, -0.03, true));
    cab.add(hbox(1.03, 1.45, 0.14, { todas: mechonesCon({ brillo: 0.1, puntas: true, semilla: 9 }) }, 0, -0.25, -0.46, true));
  } else {
    for (const s of [-1, 1]) cab.add(hbox(0.1, 0.5, 0.8, { todas: mechonesCon({ brillo: 0.2, semilla: 4 + s }) }, s * 0.52, 0.22, -0.03));
    cab.add(hbox(1.03, 0.7, 0.12, { todas: mechonesCon({ brillo: 0.15, semilla: 9 }) }, 0, 0.12, -0.46));
  }
  if (L.diadema) cab.add(hbox(1.08, 0.08, 0.26, { todas: liso(L.diadema) }, 0, 0.6, 0.12));
  if (L.lentes) {
    const c = new THREE.Color(L.lentes).getHex();
    for (const s of [-1, 1]) {
      for (const [ww, hh, dx, dy] of [[0.28, 0.03, 0, 0.11], [0.28, 0.03, 0, -0.11], [0.03, 0.25, -0.13, 0], [0.03, 0.25, 0.13, 0]]) cab.add(box(ww, hh, 0.03, c, s * 0.2 + dx, -0.04 + dy, 0.44));
      cab.add(box(0.08, 0.03, 0.03, c, s * 0.43, 0, 0.44));
    }
    cab.add(box(0.12, 0.025, 0.03, c, 0, 0, 0.44));
  }
  if (L.aretes) for (const s of [-1, 1]) cab.add(ball(0.045, 0xdfe3ea, s * 0.6, -0.42, 0.3, 0.4));
  return g;
}

// ---------- gestos: [hombro rx, rz, codo rx, rz] por lado (d = s -1, izquierda de la pantalla; i = s +1) ----------
// rz positivo abre hacia la derecha de la pantalla; el signo de cada lado ya va puesto.
const DESC = { d: [0, -0.06, -0.15, 0], i: [0, 0.06, -0.15, 0] };
function G(n) {
  const o = { d: DESC.d.slice(), i: DESC.i.slice(), cab: [0, 0, 0], cara: 'normal', arriba: 0, ind: [0, 0], pul: [0, 0], pulso: 0 };
  switch (n) {
    case 'explica': o.d = [-0.55, -0.28, -0.95, 0]; o.i = [-0.55, 0.28, -0.95, 0]; o.pulso = 1; o.cab = [0.04, 0, 0]; break;
    case 'senala': o.i = [0, 2.35, 0, 0.35]; o.ind = [0, 1]; o.cab = [-0.06, 0.12, -0.08]; o.arriba = 1; break;
    case 'sorpresa': o.d = [-0.2, -2.45, 0, -0.45]; o.i = [-0.2, 2.45, 0, 0.45]; o.cara = 'sorpresa'; o.cab = [-0.05, 0, 0]; break;
    case 'pulgar': o.d = [-0.95, 0.12, 0.95, Math.PI / 2]; o.pul = [1, 0]; o.cara = 'feliz'; o.cab = [0, 0, 0.06]; break;
    case 'pensar': o.d = [-0.8, 0.5, -1.7, 0.75]; o.cara = 'seria'; o.arriba = 1; o.cab = [-0.04, -0.12, 0.08]; break;
  }
  return o;
}
const suave = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
function mezcla(a, b, w) {
  if (typeof a === 'number') return a + (b - a) * w;
  if (typeof a === 'string') return w < 0.5 ? a : b;
  if (Array.isArray(a)) return a.map((x, i) => mezcla(x, b[i], w));
  const o = {}; for (const k in a) o[k] = mezcla(a[k], b[k], w); return o;
}
const PASO = 0.3;   // segundos que tarda en pasar de un gesto a otro (suave, sin rebote)
function estado(t) {
  if (!EV.length) return G('descanso');
  let k = -1; for (let j = 0; j < EV.length; j++) if (EV[j].t <= t) k = j;
  let cur = G(EV[0].g); if (k < 0) return cur;
  for (let j = 0; j <= k; j++) { const t0 = EV[j].t, t1 = j < k ? EV[j + 1].t : t; cur = mezcla(cur, G(EV[j].g), suave((t1 - t0) / PASO)); }
  return cur;
}
function pulso(t) { let v = 0; for (const p of PAL) { const d = t - p; if (d >= 0 && d < 0.4) v = Math.max(v, Math.sin(d / 0.4 * Math.PI)); } return v; }
function parpadeo(t) { const r = rng(77); let a = 1.1; while (a < t + 1) { if (t - a >= 0 && t - a < 0.14) return true; a += 2.6 + r() * 2.2; } return false; }

// ---------- armado ----------
A.iniciar = async function (o = {}) {
  THREE = window.THREE;
  L = Object.assign({}, LOOK0, o.look || {});
  const w = o.ancho || 1080, h = o.alto || 880;
  R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(w, h, false); R.outputColorSpace = THREE.SRGBColorSpace; R.setClearColor(0x000000, 0);
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  escena = new THREE.Scene();
  // encuadre de medio cuerpo: de la cintura a la coronilla
  cam = new THREE.PerspectiveCamera(o.fov || 20, w / h, 0.1, 50); cam.position.set(0, 1.9, 7.4); cam.lookAt(0, 1.85, 0);
  escena.add(new THREE.AmbientLight(0xfff0e0, 1.55));
  const key = new THREE.DirectionalLight(0xffe6c0, 2.3); key.position.set(-2.5, 4, 5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -2, right: 2, top: 3.5, bottom: 0, near: 1, far: 15 }); key.shadow.bias = -0.0005;
  escena.add(key);
  const fill = new THREE.DirectionalLight(0xc8d8ff, 0.8); fill.position.set(3, 2, 3); escena.add(fill);
  cuerpo = personaje(); escena.add(cuerpo);
};
A.linea = function (eventos, palabras, boca, fps = 30) { EV = eventos.slice().sort((a, b) => a.t - b.t); PAL = palabras || []; BOCA = boca || []; FPS = fps; };
A.dibujar = function (ctx, t, x = 0, y = 0) {
  const e = estado(t), p = pulso(t) * e.pulso;
  cuerpo.position.y = Math.sin(t * 1.8) * 0.006;          // respiración apenas visible
  cuerpo.rotation.y = Math.sin(t * 0.4) * 0.05;
  cab.rotation.set(e.cab[0], e.cab[1] + Math.sin(t * 0.5) * 0.03, e.cab[2]);
  for (const b of brazos) {
    const v = b.s < 0 ? e.d : e.i;
    b.h.rotation.set(v[0] - p * 0.06, 0, v[1]);
    b.c.rotation.set(v[2] - p * 0.12, 0, v[3]);
    const lado = b.s < 0 ? 0 : 1;
    b.ind.visible = e.ind[lado] > 0.5; b.pul.visible = e.pul[lado] > 0.5;
  }
  const f = Math.round(t * FPS), vol = Math.max(BOCA[f] || 0, (BOCA[f - 1] || 0) * 0.7);
  cara.userData.set({ cara: e.cara, arriba: e.arriba > 0.5, parpadeo: parpadeo(t), boca: vol > 0.55 ? 2 : vol > 0.15 ? 1 : 0 });
  R.render(escena, cam);
  ctx.drawImage(R.domElement, x, y);
};
window.AvatarHabbo = A;
})();
