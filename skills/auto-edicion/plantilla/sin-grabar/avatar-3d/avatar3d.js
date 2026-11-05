// avatar3d.js · avatar 3D (three.js) para «Sin grabar»: se dibuja cuadro por cuadro sobre el canvas 2D de la pieza.
// Cuerpo delgado, pelo recto, cara pintada (parpadeo, cejas, mirada), boca movida por el volumen de la voz,
// brazos con codo y 5 dedos que pasan de un gesto a otro en 0,32 s.
// Uso:
//   await Avatar3D.iniciar({ ancho: 1080, alto: 1100, palabra: 'USO', look: { pelo: '#2b1a12', lentes: true } })
//   Avatar3D.linea(eventos, palabras, boca)   // eventos [{t, g}], palabras [t…], boca [0..1 por cuadro]
//   Avatar3D.dibujar(ctx, t, x, y)
// Gestos: los 20 números de referencia/poses.md (1 señala a cámara … 20 saluda) + 'oidos'.
// three se carga en la pieza con <script type="module"> (window.THREE); aquí no se toca THREE hasta iniciar().

// ======== MI LOOK: cambia esto para que el avatar se parezca a ti (o pásalo en iniciar({ look })) ========
const LOOK = {
  piel: '#e8b896', pielSombra: '#d9a07e',   // tono de piel y su sombra (cuello)
  pelo: '#3b2417',                          // color de pelo
  largoPelo: 'largo',                       // 'corto' (a la mandíbula) · 'medio' (a los hombros) · 'largo' (al pecho)
  flequillo: true,                          // flequillo de lado
  ojos: '#6b4423', cejas: '#3b2417', labios: '#c9586a',
  rubor: true, pecas: false,
  ropa: '#4a6fe3', ropaDetalle: '#a8bdf5',  // blusa/polera y su cuello y puños
  botones: true,
  lentes: false, marco: '#1a1210',
  diadema: null,                            // color de diadema ('#e8609a') o null
  aretes: true, collar: false,              // aretes de orbe y collar con dije
  metal: '#e4e7ee',                         // color de aretes y collar
};
(function () {
const A = {};
let THREE, R, escena, cam, cuerpo, cabeza, caraTex, caraCtx, brazos, tel, telTex;
let EV = [], PAL = [], BOCA = [], FPS = 30;
let L = LOOK, PIEL, PIEL_S, PELO, BLUSA, BLUSA_C, PLATA, MARCO;
// mezcla un color hex con otro (para iris claro/oscuro)
function mix(a, b, w) { const h = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)); const A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * w).toString(16).padStart(2, '0')).join(''); }
const RC = 0.38, CAB_Y = 1.98;   // radio y altura de la cabeza

// ---------- utilidades ----------
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .62, metalness: 0, ...o });
function malla(geo, m, sombra = true) { const x = new THREE.Mesh(geo, m); x.castShadow = sombra; x.receiveShadow = true; return x; }
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const suave = t => { t = cl(t); return t * t * (3 - 2 * t); };
function rnd(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// forma de la cabeza: mentón afinado, un poco más alta que ancha
function forma(v) {
  const k = v.y < 0 ? 1 - .2 * suave(-v.y / RC) : 1;
  v.x *= k; v.z *= (v.y < 0 ? 1 - .07 * suave(-v.y / RC) : 1) * .96; v.y *= 1.06;
  return v;
}
// punto sobre la cabeza: a = ángulo horizontal (0 = frente, + = derecha de la pantalla), th = desde arriba
function punto(a, th, extra = 0) {
  const r = RC * (1 + extra);
  return forma(v3(r * Math.sin(a) * Math.sin(th), r * Math.cos(th), r * Math.cos(a) * Math.sin(th)));
}
function deformar(geo) {
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const r = v.length(); v.multiplyScalar(RC / r); forma(v); v.multiplyScalar(r / RC); p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals(); return geo;
}

// ---------- cara pintada (se repinta solo cuando cambia parpadeo, boca o mirada) ----------
const PH = 1.6, TS = .28 * Math.PI, TL = .55 * Math.PI, TX = 1024;
const cx = a => (a / PH + .5) * TX, cy = th => (th - TS) / TL * TX;
let ultimaCara = '';
function pintaCara(e) {
  const clave = [e.parp, e.boca, e.O, e.son, e.ceja, e.mx, e.my].map(x => Math.round(x * 12)).join();
  if (clave === ultimaCara) return; ultimaCara = clave;
  const g = caraCtx; g.clearRect(0, 0, TX, TX);
  // rubor y pecas
  if (L.rubor) for (const s of [-1, 1]) {
    const gr = g.createRadialGradient(cx(s * .5), cy(.63 * Math.PI), 0, cx(s * .5), cy(.63 * Math.PI), 120);
    gr.addColorStop(0, 'rgba(240,120,130,.42)'); gr.addColorStop(1, 'rgba(240,120,130,0)'); g.fillStyle = gr; g.fillRect(0, 0, TX, TX);
  }
  const r = rnd(4); g.fillStyle = 'rgba(150,80,50,.28)';
  if (L.pecas) for (let i = 0; i < 26; i++) { const s = r() < .5 ? -1 : 1, a = s * (.12 + r() * .36), th = (.58 + r() * .08) * Math.PI; g.beginPath(); g.arc(cx(a), cy(th), 3 + r() * 3, 0, 7); g.fill(); }
  // ojos
  for (const s of [-1, 1]) {
    const ex = cx(s * .36), ey = cy(.545 * Math.PI), w = 100, h = 112, o = 1 - e.parp;
    g.save(); g.translate(ex, ey);
    if (o > .25) {
      const hh = h * o;
      g.beginPath(); g.ellipse(0, 0, w, hh, 0, 0, 7); g.fillStyle = '#fffaf6'; g.fill();
      g.save(); g.clip();
      const ix = e.mx * 22, iy = e.my * 18 + 8;
      const gi = g.createRadialGradient(ix, iy + 18, 8, ix, iy, 74);
      gi.addColorStop(0, mix(L.ojos, '#ffcc88', .45)); gi.addColorStop(.55, L.ojos); gi.addColorStop(1, mix(L.ojos, '#000000', .6));
      g.fillStyle = gi; g.beginPath(); g.arc(ix, iy, 74, 0, 7); g.fill();
      g.fillStyle = '#120806'; g.beginPath(); g.arc(ix, iy, 33, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ix - 26, iy - 28, 19, 0, 7); g.fill(); g.beginPath(); g.arc(ix + 22, iy + 24, 8, 0, 7); g.fill();
      const gs = g.createLinearGradient(0, -hh, 0, -hh + 40); gs.addColorStop(0, 'rgba(120,60,40,.35)'); gs.addColorStop(1, 'rgba(120,60,40,0)'); g.fillStyle = gs; g.fillRect(-w, -hh, 2 * w, 40);
      g.restore();
      // párpado de arriba con pestañas hacia afuera
      g.strokeStyle = '#24120a'; g.lineCap = 'round'; g.lineWidth = 11;
      g.beginPath(); g.ellipse(0, 0, w + 2, hh + 2, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
      g.lineWidth = 6; g.beginPath(); g.moveTo(s * (w - 4), -hh * .45); g.quadraticCurveTo(s * (w + 18), -hh * .7, s * (w + 30), -hh * .95); g.stroke();
      g.beginPath(); g.moveTo(s * (w - 18), -hh * .72); g.quadraticCurveTo(s * (w + 2), -hh - 6, s * (w + 10), -hh - 22); g.stroke();
      g.lineWidth = 3; g.strokeStyle = 'rgba(60,30,20,.5)'; g.beginPath(); g.ellipse(0, 0, w - 4, hh, 0, Math.PI * .2, Math.PI * .8); g.stroke();
    } else {
      g.strokeStyle = '#24120a'; g.lineWidth = 10; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-w, 4); g.quadraticCurveTo(0, 30, w, 4); g.stroke();
      g.lineWidth = 6; g.beginPath(); g.moveTo(s * w, 4); g.lineTo(s * (w + 22), -8); g.stroke();
    }
    g.restore();
    // ceja: arco grueso que sube con la sorpresa y se inclina con la duda
    const by = cy(.44 * Math.PI) - e.ceja * 24;
    g.save(); g.translate(ex, by); g.rotate(s * e.ceja * -.08); g.fillStyle = L.cejas;
    g.beginPath(); g.moveTo(-s * 70, 14); g.quadraticCurveTo(s * 0, -26, s * 82, 10); g.quadraticCurveTo(s * 0, -6, -s * 70, 24); g.closePath(); g.fill(); g.restore();
  }
  // nariz: sombra suave
  g.strokeStyle = 'rgba(170,95,70,.55)'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx(.05), cy(.6 * Math.PI)); g.quadraticCurveTo(cx(.07), cy(.645 * Math.PI), cx(.0), cy(.655 * Math.PI)); g.stroke();
  // boca
  const mx = cx(0), my = cy(.705 * Math.PI), ab = Math.max(e.boca, e.O);
  g.save(); g.translate(mx, my); g.scale(1.45, 1.45);
  if (ab < .08) {
    g.fillStyle = L.labios;
    g.beginPath(); g.moveTo(-56, 0); g.quadraticCurveTo(-20, -16, 0, -8); g.quadraticCurveTo(20, -16, 56, 0); g.quadraticCurveTo(0, 6 + e.son * 6, -56, 0); g.fill();
    g.fillStyle = mix(L.labios, '#ffffff', .18); g.beginPath(); g.moveTo(-50, 2); g.quadraticCurveTo(0, 8 + e.son * 10, 50, 2); g.quadraticCurveTo(0, 34, -50, 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(8, 14, 12, 4, 0, 0, 7); g.fill();
    g.strokeStyle = '#8a2a36'; g.lineWidth = 4; g.beginPath(); g.moveTo(-58, -2 - e.son * 8); g.quadraticCurveTo(0, 8 + e.son * 12, 58, -2 - e.son * 8); g.stroke();
  } else {
    const w = 46 + 18 * e.boca - 16 * e.O, h = 10 + 46 * ab;
    g.fillStyle = L.labios; g.beginPath(); g.ellipse(0, h * .35, w + 12, h * .5 + 14, 0, 0, 7); g.fill();
    g.fillStyle = '#5a1820'; g.beginPath(); g.ellipse(0, h * .35, w, h * .5 + 2, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.ellipse(0, h * .35, w, h * .5 + 2, 0, 0, 7); g.clip();
    g.fillStyle = '#fbf6f2'; g.fillRect(-w, h * .35 - h * .5 - 4, 2 * w, Math.min(16, h * .3));
    g.fillStyle = mix(L.labios, '#ffffff', .1); g.beginPath(); g.ellipse(0, h * .35 + h * .45, w * .7, h * .32, 0, 0, 7); g.fill();
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(10, h * .35 + h * .5 + 10, 12, 4, 0, 0, 7); g.fill();
  }
  g.restore();
  caraTex.needsUpdate = true;
}

// ---------- pelo: mechones gruesos que se afinan en la punta ----------
let texPelo;
function texturaPelo() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 256; const g = c.getContext('2d'), r = rnd(9);
  g.fillStyle = '#fff'; g.fillRect(0, 0, 16, 256);
  for (let y = 0; y < 256; y += 2) { const b = 175 + r() * 80; g.fillStyle = `rgb(${b},${b},${b})`; g.fillRect(0, y, 16, 1 + r() * 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function mechon(pts, r0, r1, color = PELO) {
  const curva = new THREE.CatmullRomCurve3(pts), seg = 40, rad = 10;
  const geo = new THREE.TubeGeometry(curva, seg, 1, rad, false), p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const u = i / seg, c = curva.getPointAt(u), rr = (r0 + (r1 - r0) * u) * (u < .12 ? .55 + u / .12 * .45 : 1) * (u > .85 ? 1 - (u - .85) / .15 * .7 : 1);
    for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j; v.fromBufferAttribute(p, k).sub(c).multiplyScalar(rr); v.z *= .75; v.add(c); p.setXYZ(k, v.x, v.y, v.z); }
  }
  geo.computeVertexNormals();
  return malla(geo, mat(color, { map: texPelo, roughness: .5 }));
}

function hacerPelo(cab) {
  const r = rnd(21);
  // casquete: cubre arriba y atrás, se recorta en la frente
  const geo = new THREE.SphereGeometry(RC * 1.045, 64, 40), p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const th = Math.acos(cl(v.y / (RC * 1.045), -1, 1)), a = Math.atan2(v.x, v.z);
    const lim = (.36 + .5 * Math.pow(Math.abs(a) / Math.PI, .8)) * Math.PI, tt = Math.min(th, lim);
    const n = punto(a, tt, .045); p.setXYZ(i, n.x, n.y, n.z);
  }
  geo.computeVertexNormals();
  const tc = texPelo.clone(); tc.repeat.set(1, 1); tc.rotation = Math.PI / 2; tc.needsUpdate = true;
  cab.add(malla(geo, mat(PELO, { map: tc, roughness: .5 })));
  // largo y LACIO: cada mechón baja por la cabeza hasta su parte más ancha y desde ahí cae recto hasta el pecho
  const P = (a, th, e) => punto(a, th, e);
  for (let k = 0; k < 44; k++) {
    const s = k % 2 ? 1 : -1, a = s * (.74 + (k >> 1) / 21 * (Math.PI - .74));
    const W = P(a, .56 * Math.PI, .035), base = { corto: -.34, medio: -.66, largo: -1.08 }[L.largoPelo] ?? -1.08;
    const largo = base * (Math.abs(a) > 1.7 ? .95 : 1) + (1 - Math.abs(a) / Math.PI) * .04, m = W.y + (largo - W.y) / 3;
    const pts = [P(a, .14 * Math.PI, .03), P(a, .36 * Math.PI, .05), W, v3(W.x, m, W.z), v3(W.x, (m + largo) / 2, W.z), v3(W.x, largo, W.z)];
    cab.add(mechon(pts, .068, .06));
  }
  // flequillo de lado, liso: nace en la raya y barre la frente en curvas parejas
  if (L.flequillo) for (let k = 0; k < 6; k++) {
    const d = k / 5;
    const pts = [[-.26, .1], [-.05 + d * .08, .2 + d * .03], [.2 + d * .22, .29 + d * .04], [.48 + d * .3, .37 + d * .04], [.72 + d * .32, .47 + d * .05]]
      .map(([a, t]) => P(a, t * Math.PI, .065 - Math.abs(a) * .008));
    cab.add(mechon(pts, .075, .035));
  }
  if (L.flequillo) for (let k = 0; k < 3; k++) {
    const pts = [[-.26, .1], [-.42 - k * .07, .25], [-.62 - k * .07, .38 + k * .02], [-.8 - k * .06, .5]].map(([a, t]) => P(a, t * Math.PI, .065));
    cab.add(mechon(pts, .07, .035));
  }
}

// ---------- brazos con codo, mano y dedos ----------
function hacerBrazo(s) {
  const b = { s, hombro: v3(s * .3, 1.4, 0) };
  const L1 = .37, L2 = .34; b.L1 = L1; b.L2 = L2;
  b.sup = malla(new THREE.CapsuleGeometry(.064, L1, 8, 18), mat(BLUSA));
  b.puno = malla(new THREE.TorusGeometry(.064, .02, 10, 28), mat(BLUSA_C));
  b.inf = malla(new THREE.CapsuleGeometry(.047, L2, 8, 18), mat(PIEL));
  b.mano = new THREE.Group();
  const palma = malla(new THREE.SphereGeometry(1, 24, 18), mat(PIEL)); palma.scale.set(.052, .062, .024); palma.position.set(0, -.055, 0); b.mano.add(palma);
  b.dedos = [];
  const largos = [.88, 1, .94, .74];
  for (let f = 0; f < 4; f++) {
    const base = new THREE.Group(); base.position.set(s * (-.033 + f * .022) * -1, -.105, .002); b.mano.add(base);
    let padre = base; const seg = [];
    for (const l of [.036, .028, .022]) {
      const L = l * largos[f], j = new THREE.Group(); padre.add(j);
      const m = malla(new THREE.CapsuleGeometry(.0118, L, 4, 10), mat(PIEL)); m.position.y = -L / 2; j.add(m);
      const sig = new THREE.Group(); sig.position.y = -L; j.add(sig); seg.push(j); padre = sig;
    }
    b.dedos.push({ base, seg, f });
  }
  // pulgar: nace al costado de la palma
  const pb = new THREE.Group(); pb.position.set(s * .042, -.03, .012); b.mano.add(pb);
  const pseg = []; let padre = pb;
  for (const L of [.034, .03]) { const j = new THREE.Group(); padre.add(j); const m = malla(new THREE.CapsuleGeometry(.014, L, 4, 10), mat(PIEL)); m.position.y = -L / 2; j.add(m); const sig = new THREE.Group(); sig.position.y = -L; j.add(sig); pseg.push(j); padre = sig; }
  b.pulgar = { base: pb, seg: pseg };
  cuerpo.add(b.sup, b.puno, b.inf, b.mano);
  return b;
}
let Y;
function ponerBrazo(b, e) {
  const S = b.hombro.clone().add(v3(0, e.alza || 0, 0)), H = v3(...e.H), u = H.clone().sub(S); let d = u.length(); u.normalize();
  d = cl(d, .12, (b.L1 + b.L2) * .995);
  const ca = cl((b.L1 * b.L1 + d * d - b.L2 * b.L2) / (2 * b.L1 * d), -1, 1), sa = Math.sqrt(1 - ca * ca);
  const pol = v3(...e.P).normalize(); const bb = pol.sub(u.clone().multiplyScalar(pol.dot(u))); if (bb.lengthSq() < 1e-6) bb.set(0, 0, -1); bb.normalize();
  const E = S.clone().add(u.clone().multiplyScalar(ca * b.L1)).add(bb.multiplyScalar(sa * b.L1));
  const Hn = S.clone().add(u.clone().multiplyScalar(d));
  const pon = (m, a, c) => { const dir = c.clone().sub(a); m.position.copy(a).add(c).multiplyScalar(.5); m.quaternion.setFromUnitVectors(Y, dir.normalize()); };
  pon(b.sup, S, E); pon(b.inf, E, Hn);
  b.puno.position.copy(E).lerp(S, .08); b.puno.quaternion.copy(b.sup.quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(v3(1, 0, 0), Math.PI / 2));
  // mano: dedos hacia f, palma hacia n
  const f = v3(...e.f).normalize(), n = v3(...e.n); n.sub(f.clone().multiplyScalar(n.dot(f))).normalize();
  const yy = f.clone().negate(), xx = yy.clone().cross(n).normalize();
  b.mano.position.copy(Hn); b.mano.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xx, yy, n));
  const c = e.c;
  b.dedos.forEach((dd, k) => {
    const q = c[k]; dd.base.rotation.set(-q * 1.45, 0, (k - 1.5) * .07 * (1 - q) * -b.s);
    dd.seg[1].rotation.x = -q * 1.7; dd.seg[2].rotation.x = -q * 1.1;
  });
  const qp = c[4];
  b.pulgar.base.rotation.set(-.35 - qp * .5, 0, b.s * (.9 - qp * 1.25));
  b.pulgar.seg[1].rotation.x = -qp * 1.1;
}

// ---------- gestos: dónde va cada mano (espacio del cuerpo; s = -1 derecha de ella = izquierda de la pantalla) ----------
const ABIERTA = [0, 0, 0, 0, 0], PUNO = [1, 1, 1, 1, 1], INDICE = [0, 1, 1, 1, .9], RELAJ = [.25, .3, .35, .4, .2];
const descanso = s => ({ H: [s * .36, .74, .1], P: [s * .5, 0, -1], f: [0, -1, .15], n: [-s, 0, .2], c: RELAJ });
const CARA0 = { ceja: 0, son: .4, O: 0, mx: 0, my: 0 };
function G(n) {
  const d = descanso(-1), i = descanso(1), out = { d, i, cab: [0, 0, 0], cara: { ...CARA0 }, alza: 0, pulso: 0, ola: 0, tel: 0 };
  const M = (s, o) => Object.assign(s < 0 ? out.d : out.i, o);
  switch (n) {
    case 1: M(-1, { H: [-.12, 1.56, .62], P: [-1, -.8, 0], f: [.1, .3, 1], n: [0, -1, 0], c: INDICE }); out.cab = [.04, 0, .05]; out.cara.son = .7; break;
    case 2: M(-1, { H: [-.26, 1.42, .4], P: [-1, -.8, .2], f: [1, 0, .25], n: [0, 0, 1], c: [1, 1, 1, 1, 0] }); out.cara.son = 1; out.cab = [0, 0, .07]; break;
    case 3: M(-1, { H: [-.6, 1.24, .32], P: [-.5, -1, -.4], f: [-.6, .05, .8], n: [0, 1, .1], c: [.1, .12, .15, .2, .1] }); out.cab = [0, -.12, .05]; out.cara.mx = -.6; break;
    case 4: M(-1, { H: [-.03, 1.66, .46], P: [-1, -1, 0], f: [.05, 1, .1], n: [1, 0, .2], c: INDICE }); out.cara.son = 0; out.cara.ceja = .3; break;
    case 5: case 0: for (const s of [-1, 1]) M(s, { H: [s * .21, 1.26, .42], P: [s, -1, -.2], f: [-s * .25, .25, 1], n: [-s * .5, .8, .2], c: [.08, .12, .16, .22, .05] }); out.pulso = 1; break;
    case 6: M(1, { H: [.06, 1.36, .44], P: [1, -1, -.2], f: [-.15, 1, .05], n: [0, 0, 1], c: [.55, .55, .6, .65, .3] }); M(-1, { H: [-.1, 1.3, .5], P: [-1, -1, -.2], f: [.4, .4, 1], n: [0, -.6, .5], c: INDICE }); out.tel = 1; out.cab = [.08, 0, 0]; out.cara.my = .5; break;
    case 7: for (const s of [-1, 1]) M(s, { H: [s * .31, 1.82, .26], P: [s, -1, -.1], f: [-s * .15, 1, .1], n: [-s, 0, .25], c: [.05, .05, .1, .15, .1] }); out.cara = { ceja: 1, son: 0, O: .8, mx: 0, my: 0 }; break;
    case 8: for (const s of [-1, 1]) M(s, { H: [s * .5, 1.16, .3], P: [s, -1, -.5], f: [s * .7, .1, .7], n: [0, 1, 0], c: [.15, .15, .2, .25, .1] }); out.alza = .05; out.cab = [0, 0, .12]; out.cara = { ceja: .6, son: .1, O: 0, mx: 0, my: 0 }; break;
    case 9: M(-1, { H: [-.04, 2.16, .43], P: [-1, -.3, 0], f: [1, .25, 0], n: [0, 0, -1], c: [.1, .1, .1, .1, .2] }); out.cab = [.12, 0, 0]; out.cara = { ceja: -.6, son: 0, O: 0, mx: 0, my: .4 }; break;
    case 10: M(-1, { H: [-.04, 1.64, .42], P: [-1, -1, -.2], f: [.1, 1, .25], n: [0, -.2, -1], c: [.2, .8, .9, .95, .5] }); M(1, { H: [-.02, 1.22, .3], P: [1, -1, 0], f: [-1, 0, .1], n: [0, 1, 0], c: RELAJ }); out.cab = [-.04, .1, .08]; out.cara = { ceja: .3, son: .2, O: 0, mx: .6, my: -.7 }; break;
    case 11: M(-1, { H: [-.44, 2.28, .55], P: [-1, -.4, .3], f: [0, 1, 0], n: [0, 0, 1], c: INDICE }); out.cab = [-.1, 0, 0]; out.cara.my = -.8; break;
    case 12: M(-1, { H: [-.3, 1.74, .38], P: [-1, -1, 0], f: [.05, 1, 0], n: [0, 0, 1], c: [0, 0, 0, 1, 1] }); break;
    case 13: for (const s of [-1, 1]) M(s, { H: [s * .29, .86, .04], P: [s, .2, -.3], f: [-s * .4, -.6, .1], n: [-s, 0, 0], c: RELAJ }); out.cara.son = .9; out.cab = [0, 0, -.04]; break;
    case 14: M(-1, { H: [.2, 1.12, .3], P: [-1, -1, .2], f: [1, .1, -.2], n: [0, 0, -1], c: RELAJ }); M(1, { H: [-.2, 1.17, .35], P: [1, -1, .2], f: [-1, .1, -.2], n: [0, 0, -1], c: RELAJ }); out.cara = { ceja: -.3, son: .1, O: 0, mx: 0, my: 0 }; out.cab = [0, .08, -.05]; break;
    case 15: M(-1, { H: [.04, 1.3, .24], P: [-1, -1, .1], f: [.4, 1, 0], n: [0, 0, -1], c: [.1, .1, .1, .15, .1] }); out.cara = { ceja: .2, son: .9, O: 0, mx: 0, my: 0 }; out.cab = [0, 0, .1]; break;
    case 16: M(-1, { H: [-.34, 1.86, .36], P: [-1, -1, -.2], f: [.05, 1, 0], n: [0, 0, 1], c: INDICE }); out.cara.ceja = .5; break;
    case 17: M(-1, { H: [-.4, 2.12, .5], P: [-1, -.6, .1], f: [.45, 1, .15], n: [0, 0, 1], c: INDICE }); out.cab = [-.12, -.12, 0]; out.cara.mx = -.5; out.cara.my = -.8; break;
    case 18: for (const s of [-1, 1]) M(s, { H: [s * .24, 1.48, .5], P: [s, -1, -.3], f: [s * .1, 1, 0], n: [0, 0, 1], c: [0, 0, 0, 0, .1] }); out.cara.ceja = .4; out.cara.son = .2; break;
    case 19: M(-1, { H: [0, 1.74, .48], P: [-1, -1, 0], f: [.35, 1, 0], n: [0, 0, -1], c: [.1, .1, .15, .2, .1] }); out.cara = { ceja: .9, son: 0, O: 0, mx: 0, my: 0 }; break;
    case 20: M(-1, { H: [-.46, 1.96, .45], P: [-1, -1, -.1], f: [-.1, 1, 0], n: [0, 0, 1], c: [0, 0, 0, 0, .1] }); out.ola = 1; out.cara.son = 1; break;
    case 'oidos': for (const s of [-1, 1]) M(s, { H: [s * .44, 1.96, .02], P: [s, -1, 0], f: [0, 1, -.1], n: [-s, 0, 0], c: [.1, .1, .1, .1, .2] }); out.cara = { ceja: -.5, son: 0, O: .3, mx: 0, my: 0 }; out.alza = .03; break;
  }
  return out;
}
function mezcla(a, b, w) {
  if (typeof a === 'number') return a + (b - a) * w;
  if (Array.isArray(a)) return a.map((x, i) => mezcla(x, b[i], w));
  const o = {}; for (const k in a) o[k] = mezcla(a[k], b[k], w); return o;
}
const DUR = .32;
function estado(t) {
  if (!EV.length) return G(5);
  let k = -1; for (let j = 0; j < EV.length; j++) if (EV[j].t <= t) k = j;
  let cur = G(EV[0].g); if (k < 0) return cur;
  for (let j = 0; j <= k; j++) { const t0 = EV[j].t, t1 = j < k ? EV[j + 1].t : t; cur = mezcla(cur, G(EV[j].g), suave((t1 - t0) / DUR)); }
  return cur;
}

// ---------- armado ----------
A.iniciar = async function (o = {}) {
  THREE = window.THREE; Y = v3(0, 1, 0);
  L = { ...LOOK, ...(o.look || {}) };
  PIEL = L.piel; PIEL_S = L.pielSombra; PELO = L.pelo; BLUSA = L.ropa; BLUSA_C = L.ropaDetalle; PLATA = L.metal; MARCO = L.marco;
  texPelo = texturaPelo();
  R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(o.ancho || 1080, o.alto || 1100, false);
  R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.setClearColor(0x000000, 0);
  escena = new THREE.Scene();
  const asp = (o.ancho || 1080) / (o.alto || 1100);
  cam = new THREE.PerspectiveCamera(16, asp, .1, 50); cam.position.set(0, 1.97, 7.6); cam.lookAt(0, 1.97, 0);
  escena.add(new THREE.HemisphereLight(0xfff4ec, 0x8a6a70, 1.25));
  const key = new THREE.DirectionalLight(0xfff1e6, 2.3); key.position.set(-2.2, 3.6, 4); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 3, bottom: .5, near: 1, far: 12 }); key.shadow.bias = -.0004; key.shadow.normalBias = .02; key.shadow.radius = 4;
  escena.add(key);
  const fill = new THREE.DirectionalLight(0xe8eeff, .7); fill.position.set(3, 1.5, 3); escena.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6); rim.position.set(0, 3, -4); escena.add(rim);

  cuerpo = new THREE.Group(); escena.add(cuerpo);
  // torso delgado (torno), aplanado de frente
  const perfil = [[.19, .5], [.2, .72], [.225, .94], [.258, 1.14], [.27, 1.3], [.25, 1.42], [.18, 1.49], [.09, 1.535], [.06, 1.54]].map(([x, y]) => new THREE.Vector2(x, y));
  const torso = malla(new THREE.LatheGeometry(perfil, 48), mat(BLUSA)); torso.scale.z = .64; cuerpo.add(torso);
  const radio = y => { for (let i = 1; i < perfil.length; i++) if (y <= perfil[i].y) { const a = perfil[i - 1], b = perfil[i]; return a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y); } return .06; };
  if (L.botones) for (const yb of [1.24, 1.08, .92]) { const bt = malla(new THREE.SphereGeometry(.016, 12, 10), mat(0xfffaf0, { roughness: .3 })); bt.position.set(0, yb, radio(yb) * .64 + .004); cuerpo.add(bt); }
  for (const s of [-1, 1]) { const h = malla(new THREE.SphereGeometry(.098, 24, 18), mat(BLUSA)); h.position.set(s * .29, 1.4, 0); h.scale.set(1, .9, .95); cuerpo.add(h); }
  const cuelloV = malla(new THREE.TorusGeometry(.085, .024, 12, 40), mat(BLUSA_C)); cuelloV.rotation.x = Math.PI / 2; cuelloV.scale.set(1, .8, 1); cuelloV.position.y = 1.53; cuerpo.add(cuelloV);
  const cuello = malla(new THREE.CylinderGeometry(.068, .075, .26, 24), mat(PIEL_S)); cuello.position.y = 1.64; cuerpo.add(cuello);
  // collar con dije de corazón
  if (L.collar) {
  const cad = malla(new THREE.TorusGeometry(.105, .0045, 6, 48, Math.PI), mat(PLATA, { metalness: .9, roughness: .25 }), false);
  cad.rotation.x = Math.PI / 2 + .55; cad.position.set(0, 1.52, .02); cad.scale.set(1, 1.15, 1); cuerpo.add(cad);
  const dije = new THREE.Group(); const mp = mat(PLATA, { metalness: .9, roughness: .2 });
  for (const s of [-1, 1]) { const b = malla(new THREE.SphereGeometry(.016, 12, 10), mp, false); b.position.set(s * .012, .006, 0); dije.add(b); }
  const pun = malla(new THREE.ConeGeometry(.022, .03, 12), mp, false); pun.rotation.z = Math.PI; pun.position.y = -.014; dije.add(pun);
  dije.position.set(0, 1.4, .13); cuerpo.add(dije);
  }

  // cabeza
  cabeza = new THREE.Group(); cabeza.position.y = CAB_Y; cuerpo.add(cabeza);
  cabeza.add(malla(deformar(new THREE.SphereGeometry(RC, 96, 72)), mat(PIEL, { roughness: .55 })));
  const nar = malla(new THREE.SphereGeometry(.02, 16, 12), mat(PIEL, { roughness: .5 }), false); nar.position.copy(punto(0, .63 * Math.PI, .0)); nar.scale.set(1.2, .8, .7); cabeza.add(nar);
  const cc = document.createElement('canvas'); cc.width = cc.height = TX; caraCtx = cc.getContext('2d');
  caraTex = new THREE.CanvasTexture(cc); caraTex.colorSpace = THREE.SRGBColorSpace; caraTex.anisotropy = 8;
  const gcara = deformar(new THREE.SphereGeometry(RC * 1.004, 96, 72, Math.PI / 2 - PH / 2, PH, TS, TL));
  const cara = new THREE.Mesh(gcara, new THREE.MeshStandardMaterial({ map: caraTex, transparent: true, roughness: .6, polygonOffset: true, polygonOffsetFactor: -2 }));
  cara.receiveShadow = true; cabeza.add(cara);
  // lentes de marco fino
  if (L.lentes) {
  const mm = mat(MARCO, { roughness: .35 });
  for (const s of [-1, 1]) {
    const c = punto(s * .36, .545 * Math.PI, .12);
    const aro = malla(new THREE.TorusGeometry(.105, .009, 10, 48), mm); aro.scale.set(1.12, .92, 1); aro.position.copy(c);
    aro.lookAt(c.clone().multiplyScalar(2).setY(c.y)); cabeza.add(aro);
    const pat = malla(new THREE.CylinderGeometry(.007, .007, .36, 8), mm); pat.rotation.x = Math.PI / 2; pat.position.set(s * (RC * .93), c.y + .01, c.z - .2); cabeza.add(pat);
  }
  const puente = malla(new THREE.TorusGeometry(.045, .008, 8, 20, Math.PI), mm); puente.position.copy(punto(0, .53 * Math.PI, .14)); cabeza.add(puente);
  }
  // diadema
  if (L.diadema) { const dia = malla(new THREE.TorusGeometry(RC * 1.1, .024, 12, 64, Math.PI), mat(L.diadema, { roughness: .35 })); dia.rotation.x = -.42; dia.scale.set(1.02, 1.07, 1); cabeza.add(dia); }
  hacerPelo(cabeza);
  // aretes de orbe
  if (L.aretes) for (const s of [-1, 1]) { const ar = malla(new THREE.SphereGeometry(.03, 16, 12), mat(PLATA, { metalness: .9, roughness: .2 }), false); ar.position.set(s * RC * .98, -.2, .02); cabeza.add(ar); }

  brazos = { d: hacerBrazo(-1), i: hacerBrazo(1) };
  // celular para el CTA
  tel = new THREE.Group();
  tel.add(malla(new THREE.BoxGeometry(.13, .26, .014), mat(0x1c1c1e, { roughness: .3 })));
  const tc = document.createElement('canvas'); tc.width = 256; tc.height = 512; const g = tc.getContext('2d');
  g.fillStyle = '#0d0d10'; g.fillRect(0, 0, 256, 512); g.fillStyle = '#2c2c2e'; g.beginPath(); g.roundRect(18, 380, 220, 56, 28); g.fill();
  g.fillStyle = '#fff'; g.font = '800 30px Inter, sans-serif'; g.fillText(o.palabra || 'USO', 36, 418);
  g.fillStyle = '#0A84FF'; g.beginPath(); g.arc(214, 408, 18, 0, 7); g.fill();
  for (let k = 0; k < 4; k++) { g.fillStyle = '#3a3a3c'; g.beginPath(); g.arc(40, 90 + k * 70, 18, 0, 7); g.fill(); g.fillRect(70, 80 + k * 70, 140 - k * 20, 10); g.fillRect(70, 98 + k * 70, 90, 8); }
  telTex = new THREE.CanvasTexture(tc); telTex.colorSpace = THREE.SRGBColorSpace;
  const pant = new THREE.Mesh(new THREE.PlaneGeometry(.118, .244), new THREE.MeshBasicMaterial({ map: telTex, toneMapped: false })); pant.position.z = .0075; tel.add(pant);
  tel.position.set(0, -.08, .02); brazos.i.mano.add(tel);
};

A.linea = function (eventos, palabras, boca, fps = 30) { EV = eventos.slice().sort((a, b) => a.t - b.t); PAL = palabras; BOCA = boca || []; FPS = fps; };

function parpadeo(t) {
  const r = rnd(77); let a = .8;
  while (a < t + 1) { const d = t - a; if (d >= 0 && d < .16) return Math.sin(d / .16 * Math.PI); a += 2.6 + r() * 2.2; }
  return 0;
}
function pulso(t) {   // pequeño acento de las manos en cada palabra (sube y vuelve suave, sin rebote)
  let v = 0; for (const p of PAL) { const d = t - p; if (d >= 0 && d < .45) v = Math.max(v, Math.sin(d / .45 * Math.PI)); } return v;
}

A.dibujar = function (ctx, t, x = 0, y = 0) {
  const e = estado(t);
  const resp = Math.sin(t * 1.9) * .006;
  cuerpo.position.y = resp; cuerpo.rotation.y = Math.sin(t * .45) * .04; cuerpo.rotation.z = Math.sin(t * .37) * .012;
  cabeza.rotation.set(e.cab[0] + Math.sin(t * .8) * .02, e.cab[1] + Math.sin(t * .53) * .04, e.cab[2]);
  const pl = pulso(t) * e.pulso, ol = Math.sin(t * 7) * e.ola;
  for (const k of ['d', 'i']) {
    const a = JSON.parse(JSON.stringify(e[k]));
    a.H[1] += pl * .035 * (k === 'd' ? 1 : .7); a.H[0] += (k === 'd' ? -1 : 1) * pl * .015;
    if (k === 'd') { a.f[0] += ol * .35; a.H[0] += ol * .02; }
    a.alza = e.alza; ponerBrazo(brazos[k], a);
  }
  tel.visible = e.tel > .5;
  const f = Math.round(t * FPS), b = Math.max(BOCA[f] || 0, (BOCA[f - 1] || 0) * .7);
  pintaCara({ parp: parpadeo(t), boca: cl(b), O: e.cara.O, son: e.cara.son, ceja: e.cara.ceja, mx: e.cara.mx, my: e.cara.my });
  R.render(escena, cam);
  ctx.drawImage(R.domElement, x, y);
};
window.Avatar3D = A;
})();
