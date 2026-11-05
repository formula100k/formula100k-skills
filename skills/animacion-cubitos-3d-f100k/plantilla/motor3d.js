// Sala 3D de cubitos: gradería, estrado y escritorio del jefe. No se edita para hacer un video nuevo:
// todo lo que cambia (colores, elenco, textos) llega desde config.js.
import * as THREE from './vendor/three.module.min.js';
import { mix, E, k, rng, plano } from './util.js';

const W = 1080, H = 1920;
const J = new THREE.Vector3(-6, 0, 0); // gradería
const SX = 6; // estrado del duelo
const BX = 16; // escritorio del jefe
const SANS = (px) => `800 ${px}px system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif`;
const SERIF = (px) => `italic 700 ${px}px Georgia, "Times New Roman", serif`;

let renderer, scene, camera, key, amb, spot, fill, T, C;
const P = { porEscena: {} };

// ---------- materiales y primitivas ----------
let grain;
const mats = {};
function mat(color, em = 0) {
  const id = color + ':' + em;
  if (!mats[id]) {
    mats[id] = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, map: grain });
    if (em) { mats[id].emissive = new THREE.Color(color); mats[id].emissiveIntensity = em; }
  }
  return mats[id];
}
function box(w, h, d, color, x = 0, y = 0, z = 0, em = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, em));
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function ball(r, color, x = 0, y = 0, z = 0, em = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat(color, em));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}
function cyl(r, h, color, x = 0, y = 0, z = 0, em = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), mat(color, em));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}
// cartel con texto (lienzo → textura)
function sign(w, h, draw, lit = false) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * 256);
  c.height = Math.round(h * 256);
  draw(c.getContext('2d'), c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const o = { map: tex, transparent: true, side: THREE.DoubleSide };
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), lit ? new THREE.MeshBasicMaterial(o) : new THREE.MeshStandardMaterial({ ...o, roughness: 1 }));
}
function txt(x, s, cx, cy, px, color, font = SANS, maxW) {
  x.font = font(px);
  if (maxW) { const w = x.measureText(s).width; if (w > maxW) x.font = font(Math.floor((px * maxW) / w)); }
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = color;
  x.fillText(s, cx, cy);
}
function rr(x, a, b, w, h, r) { x.beginPath(); x.roundRect(a, b, w, h, r); }

// ---------- gorros y objetos ----------
const GORROS = {
  tapa: (b, o) => b.add(box(1.1, 0.15, 0.9, o.colorGorro || T.acento, 0, 1.17, 0)),
  bombin: (b) => { b.add(cyl(0.6, 0.05, 0x17171c, 0, 1.13, 0)); const d = ball(0.36, 0x17171c, 0, 1.15, 0); d.scale.y = 0.8; b.add(d); },
  audifonos: (b) => {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.04, 8, 24, Math.PI), mat(0x17171c));
    arc.position.set(0, 0.8, 0);
    b.add(arc, box(0.14, 0.3, 0.3, T.acento, -0.57, 0.85, 0), box(0.14, 0.3, 0.3, T.acento, 0.57, 0.85, 0));
  },
  pelo: (b, o) => { for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), mat(o.colorGorro || 0x7b5cff)); c.position.set(-0.4 + i * 0.13, 1.25 + (i % 2) * 0.06, (i % 3) * 0.12 - 0.12); c.rotation.z = -0.5 + i * 0.05; b.add(c); } },
  visera: (b, o) => b.add(box(1.06, 0.12, 0.86, o.colorGorro || T.si, 0, 1.15, 0), box(1.0, 0.05, 0.4, o.colorGorro || T.si, 0, 1.11, 0.55)),
  gorra: (b, o) => b.add(box(1.04, 0.2, 0.84, o.colorGorro || 0x2f5fd0, 0, 1.19, 0), box(0.7, 0.06, 0.4, o.colorGorro || 0x2f5fd0, 0, 1.12, 0.55)),
  mono: (b) => b.add(box(0.2, 0.16, 0.1, 0xe8508a, -0.13, 1.18, 0.2), box(0.2, 0.16, 0.1, 0xe8508a, 0.13, 1.18, 0.2), box(0.1, 0.1, 0.12, 0xc23a70, 0, 1.18, 0.2)),
  boina: (b, o) => { const d = cyl(0.5, 0.14, o.colorGorro || 0xc7402f, 0.06, 1.16, 0); d.rotation.z = -0.12; b.add(d, ball(0.06, 0x17171c, 0.06, 1.26, 0)); },
  corona: (b) => { b.add(box(0.8, 0.14, 0.7, T.acento, 0, 1.16, 0, 0.3)); for (let i = 0; i < 4; i++) b.add(box(0.12, 0.2, 0.12, T.acento, -0.33 + i * 0.22, 1.3, 0.28, 0.3)); },
  antena: (b) => b.add(cyl(0.025, 0.4, 0x8a8f98, 0.25, 1.3, 0), ball(0.08, T.acento, 0.25, 1.52, 0, 0.8)),
  peluca: (b) => { b.add(box(1.16, 0.2, 0.94, 0xf4efe6, 0, 1.18, 0)); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) b.add(box(0.2, 0.22, 0.86, 0xf4efe6, s * 0.6, 1.02 - i * 0.24, 0)); },
};
const OBJETOS = {
  calculadora: () => {
    const g = new THREE.Group();
    g.add(box(0.34, 0.46, 0.06, 0x1d2430), box(0.26, 0.1, 0.02, 0xbfe6c8, 0, 0.14, 0.035, 0.6));
    for (let a = 0; a < 3; a++) for (let c = 0; c < 3; c++) g.add(box(0.06, 0.06, 0.02, 0xf4efe6, -0.09 + a * 0.09, 0.02 - c * 0.09, 0.035));
    g.position.set(0.62, 0.64, 0.42); g.rotation.set(-0.3, -0.3, 0.1);
    return g;
  },
  guante: () => { const g = ball(0.3, 0xd42a2a, -0.55, 0.62, 0.5); g.add(box(0.3, 0.14, 0.3, 0xf4efe6, 0, 0, -0.26)); g.scale.setScalar(0.7); return g; },
  lupa: () => { const g = new THREE.Group(); const aro = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 24), mat(0x17171c)); g.add(aro, cyl(0.035, 0.3, 0x7a4a2a, 0.2, -0.28, 0)); g.children[1].rotation.z = 0.7; g.position.set(0.62, 0.8, 0.45); return g; },
  telefono: () => { const g = new THREE.Group(); g.add(box(0.26, 0.46, 0.05, 0x17171c), box(0.21, 0.38, 0.02, 0x9fd0ff, 0, 0, 0.03, 0.7)); g.position.set(0.62, 0.66, 0.42); g.rotation.set(-0.2, -0.3, 0.1); return g; },
  moneda: () => { const g = cyl(0.2, 0.05, T.acento, 0.62, 0.7, 0.45, 0.4); g.rotation.x = Math.PI / 2; return g; },
  corazon: () => { const g = new THREE.Group(); g.add(ball(0.13, 0xe8508a, -0.09, 0.06, 0), ball(0.13, 0xe8508a, 0.09, 0.06, 0)); const p = box(0.2, 0.2, 0.14, 0xe8508a, 0, -0.05, 0); p.rotation.z = Math.PI / 4; g.add(p); g.position.set(0.62, 0.75, 0.45); return g; },
};
export const LISTA_GORROS = Object.keys(GORROS), LISTA_OBJETOS = Object.keys(OBJETOS);

// ---------- el cubito ----------
// Mira hacia +z. `tipo`: "bichito" (cubo de color) o "gato" (crema, orejas y lentes).
function cubito(o = {}) {
  const g = new THREE.Group(), b = new THREE.Group();
  g.add(b);
  const gato = o.tipo === 'gato', col = o.color || (gato ? 0xefe7d8 : T.cubo);
  b.add(box(1, 0.86, 0.82, col, 0, 0.68, 0));
  for (const x of [-0.32, 0.32]) for (const z of [-0.24, 0.24]) g.add(box(0.14, 0.28, 0.14, col, x, 0.14, z));
  b.add(box(0.16, 0.16, 0.3, col, -0.58, 0.6, 0), box(0.16, 0.16, 0.3, col, 0.58, 0.6, 0));
  b.add(box(0.1, 0.24, 0.03, 0x15110f, -0.2, 0.8, 0.42), box(0.1, 0.24, 0.03, 0x15110f, 0.2, 0.8, 0.42));
  if (gato) {
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.34, 4), mat(col));
      ear.position.set(s * 0.33, 1.26, 0); ear.rotation.y = Math.PI / 4; ear.castShadow = true;
      b.add(ear, box(0.1, 0.12, 0.03, 0xe8a0a8, s * 0.33, 1.2, 0.13));
      // lentes cuadrados
      for (const [w, h, dx, dy] of [[0.3, 0.035, 0, 0.17], [0.3, 0.035, 0, -0.17], [0.035, 0.37, -0.15, 0], [0.035, 0.37, 0.15, 0]]) b.add(box(w, h, 0.04, 0x15110f, s * 0.2 + dx, 0.8 + dy, 0.43));
      for (const dy of [0, 0.07]) b.add(box(0.2, 0.015, 0.02, 0x15110f, s * 0.44, 0.52 + dy, 0.42));
    }
    b.add(box(0.1, 0.035, 0.04, 0x15110f, 0, 0.82, 0.43), box(0.09, 0.06, 0.04, 0xe8a0a8, 0, 0.56, 0.42));
    b.add(box(0.12, 0.12, 0.5, col, 0.3, 0.45, -0.6));
  }
  if (o.dientes) for (let i = 0; i < 7; i++) { const u = i / 6 - 0.5; b.add(box(0.07, 0.09, 0.03, 0xfaf3e6, u * 0.6, 0.49 + u * u * 0.22, 0.42)); }
  if (o.perlas) for (let i = 0; i < 9; i++) { const u = i / 8 - 0.5; b.add(ball(0.035, 0xfaf3e6, u * 0.62, 0.38 + u * u * 0.3, 0.42)); }
  if (o.cadena) for (let i = 0; i < 11; i++) { const u = i / 10 - 0.5; b.add(ball(0.05, T.acento, u * 0.8, 0.38 + u * u * 0.5, 0.44, 0.3)); }
  if (o.corbata) b.add(box(0.12, 0.36, 0.04, o.corbata === true ? T.si : o.corbata, 0, 0.44, 0.43));
  if (o.traje) b.add(box(1.03, 0.3, 0.84, o.traje, 0, 0.42, 0));
  if (o.gorro && GORROS[o.gorro]) GORROS[o.gorro](b, o);
  if (o.objeto && OBJETOS[o.objeto]) { const ob = OBJETOS[o.objeto](); b.add(ob); g.userData.objeto = ob; g.userData.objBase = ob.position.clone(); g.userData.objEsc = ob.scale.x; }
  g.userData.b = b;
  return g;
}

// ---------- sala ----------
function ventanal(x) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 5.2), new THREE.MeshBasicMaterial({ color: T.luz }));
  p.position.y = 4.4;
  g.add(p);
  for (let i = 1; i < 4; i++) g.add(box(1.5, 0.07, 0.05, T.pared, 0, 1.8 + i * 1.3, 0.02));
  g.add(box(0.07, 5.2, 0.05, T.pared, 0, 4.4, 0.02));
  g.position.set(x, 0, -4.45);
  return g;
}
function librero(x) {
  const g = new THREE.Group();
  g.add(box(2.4, 4.2, 0.5, T.madera2, 0, 2.1, 0));
  const r = rng(Math.round(x * 10) + 3), cols = [T.acento, T.cubo, 0x7b5cff, T.si, 0xf4efe6, 0x2f5fd0];
  for (let row = 0; row < 4; row++) {
    let px = -1.05;
    while (px < 1.0) { const w = 0.1 + r() * 0.1, h = 0.5 + r() * 0.25; g.add(box(w, h, 0.3, cols[Math.floor(r() * cols.length)], px + w / 2, 0.45 + row + h / 2, 0.15)); px += w + 0.02; }
    g.add(box(2.3, 0.06, 0.45, T.madera, 0, 0.4 + row, 0.05));
  }
  g.position.set(x, 0, -4.2);
  return g;
}
function sala() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 30), mat(T.madera2));
  floor.rotation.x = -Math.PI / 2; floor.position.set(5, 0, 4); floor.receiveShadow = true;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(70, 16), mat(T.pared));
  wall.position.set(5, 8, -4.5);
  scene.add(floor, wall, box(70, 1.5, 0.2, T.madera2, 5, 0.75, -4.4), box(70, 0.12, 0.26, T.acento, 5, 1.56, -4.4));
  for (const x of [-11, -8.4, -3.6, -1, 3.9, 8.1, 12, 20]) scene.add(ventanal(x));
  scene.add(librero(1.6), librero(10.4), librero(13.6), librero(18.4));
  // rosetón sobre la gradería
  const ros = new THREE.Group();
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.09, 8, 32), mat(T.acento, 0.3));
  const luz = new THREE.Mesh(new THREE.CircleGeometry(0.7, 32), new THREE.MeshBasicMaterial({ color: T.luz }));
  ros.add(luz, aro);
  for (let i = 0; i < 4; i++) { const r = box(1.4, 0.05, 0.04, T.pared); r.rotation.z = (i * Math.PI) / 4; ros.add(r); }
  ros.position.set(J.x, 6.6, -4.38);
  scene.add(ros);
  // banderines
  for (let i = 0; i < 26; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 3), mat(i % 2 ? T.acento : T.cubo));
    f.rotation.x = Math.PI; f.scale.z = 0.15;
    f.position.set(-12 + i * 1.3, 7.7 - Math.sin((i % 6) / 5 * Math.PI) * 0.35, -4.3);
    scene.add(f);
  }
  const carpet = box(9, 0.04, 9, T.alfombra, SX, 0.02, 1.5);
  carpet.castShadow = false;
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.75, 1.9, 48), mat(T.acento));
  ring.rotation.x = -Math.PI / 2; ring.position.set(SX, 0.05, 0.4);
  scene.add(carpet, ring);
}

// ---------- gradería ----------
const ORDEN = [1, 9, 5, 6, 0, 2, 3, 4, 7, 8, 10, 11];
const EN_CONTRA = [1, 4, 6, 9, 11, 2, 7, 0, 10, 5, 3, 8];
function paleta(texto, ok) {
  const g = new THREE.Group();
  const d = sign(0.8, 0.8, (x, w, h) => {
    x.fillStyle = '#0b0b10'; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 2, 0, 7); x.fill();
    x.fillStyle = ok ? T.si : T.no; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 12, 0, 7); x.fill();
    txt(x, texto, w / 2, h / 2, 32, '#0b0b10', SANS, w - 50);
  }, true);
  d.position.y = 0.75;
  g.add(d, cyl(0.03, 0.7, 0xe9dcc0, 0, 0.2, -0.01));
  return g;
}
function graderia() {
  const g = new THREE.Group();
  g.position.copy(J);
  P.elenco = [];
  const vot = C.escenas.find((s) => s.plano === 'votacion') || {};
  const noN = 12 - (vot.aFavor ?? 7), enContra = new Set(EN_CONTRA.slice(0, noN));
  for (let r = 0; r < 3; r++) {
    g.add(box(5.4, 0.55 + r * 0.75, 1.1, T.madera2, 0, (0.55 + r * 0.75) / 2, -r * 1.1));
    for (let c = 0; c < 4; c++) {
      const i = r * 4 + c, x = (c - 1.5) * 1.18, y = 0.55 + r * 0.75, z = -r * 1.1;
      g.add(box(1.05, 1.25, 0.14, T.butaca, x, y + 0.62, z - 0.5));
      const j = cubito((C.elenco && C.elenco[i]) || {});
      j.position.set(x, y, z);
      const pd = paleta(enContra.has(i) ? vot.no || 'NO' : vot.si || 'SÍ', !enContra.has(i));
      pd.position.set(0.42, 0.95, 0.35); pd.rotation.x = -0.35;
      j.add(pd);
      j.userData.paleta = pd;
      g.add(j);
      P.elenco.push(j);
    }
  }
  g.add(box(5.7, 0.95, 0.3, T.madera, 0, 0.475, 0.85), box(5.9, 0.1, 0.5, T.acento, 0, 0.98, 0.85));
  if (C.cartel) {
    const ls = plano(C.cartel).split(' ');
    const s = sign(1.1, 0.75, (x, w, h) => {
      x.fillStyle = '#0b0b10'; rr(x, 0, 0, w, h, 26); x.fill();
      x.strokeStyle = T.acento; x.lineWidth = 6; rr(x, 8, 8, w - 16, h - 16, 20); x.stroke();
      const a = ls.slice(0, Math.ceil(ls.length / 2)).join(' '), b2 = ls.slice(Math.ceil(ls.length / 2)).join(' ');
      txt(x, a, w / 2, b2 ? h * 0.33 : h / 2, 70, T.tinta, SANS, w - 50);
      if (b2) txt(x, b2, w / 2, h * 0.69, 76, T.acento, SERIF, w - 50);
    });
    s.scale.setScalar(0.72); s.position.set(0, 0.45, 1.02); s.rotation.z = -0.04;
    g.add(s);
  }
  scene.add(g);
}

// ---------- estrado del duelo ----------
function estrado() {
  const g = new THREE.Group(), M = C.duelo || {};
  g.position.set(SX, 0, 0.4);
  g.add(box(0.6, 0.95, 0.6, T.madera, 0, 0.475, 0), box(0.8, 0.08, 0.8, T.acento, 0, 0.98, 0), cyl(0.14, 0.22, 0x9aa0a8, 0, 1.13, 0));
  P.foco = ball(0.36, T.luz, 0, 1.55, 0, 1.4);
  P.foco.castShadow = false;
  P.focoLuz = new THREE.PointLight(T.luz, 8, 7, 1.6);
  P.focoLuz.position.set(0, 1.7, 0.4);
  g.add(P.foco, P.focoLuz);
  const mk = (o, x) => {
    const c = cubito(o);
    c.position.set(x, 0, 0.3);
    const vara = new THREE.Group();
    vara.add(cyl(0.035, 1.5, 0x17171c, 0, 0.75, 0), ball(0.07, T.acento, 0, 1.5, 0, 0.5));
    vara.position.set(0, 0.62, 0.45);
    c.userData.b.add(vara);
    c.userData.vara = vara;
    const poste = new THREE.Group();
    poste.add(box(0.08, 1.9, 0.08, T.madera2, 0, 0.95, 0));
    const q = sign(1.12, 1.44, (cx, w, h) => { cx.fillStyle = '#0b0b10'; rr(cx, 0, 0, w, h, 30); cx.fill(); txt(cx, '?', w / 2, h / 2, 230, T.acento, SERIF); });
    q.position.set(0, 2.0, 0.05);
    poste.add(q);
    poste.position.set(x * 1.45, 0, -1.6);
    g.add(c, poste);
    return { c, poste, x };
  };
  P.izq = mk(M.izq || { perlas: 1, gorro: 'boina' }, -1.2);
  P.der = mk(M.der || { tipo: 'gato', corbata: true }, 1.2);
  // un cartel de respuesta por cada escena «alegato»
  C.escenas.forEach((sc, i) => {
    if (sc.plano !== 'alegato') return;
    const lado = sc.lado === 'der' ? P.der : P.izq, ok = sc.ok ?? sc.lado === 'der', col = ok ? T.si : T.no;
    const a = sign(1.12, 1.44, (cx, w, h) => {
      cx.fillStyle = T.papel; rr(cx, 0, 0, w, h, 30); cx.fill();
      cx.fillStyle = col; cx.beginPath(); cx.arc(w / 2, h * 0.34, 70, 0, 7); cx.fill();
      txt(cx, ok ? '✓' : '✗', w / 2, h * 0.345, 92, '#0b0b10');
      txt(cx, plano(sc.texto || ''), w / 2, h * 0.74, 64, '#0b0b10', SANS, w - 40);
    });
    a.position.set(0, 2.0, 0.08);
    lado.poste.add(a);
    P.porEscena[i] = a;
  });
  scene.add(g);
}

// ---------- escritorio del jefe ----------
function escritorio() {
  const g = new THREE.Group();
  g.position.set(BX, 0, 0);
  g.add(box(4.2, 1.7, 1.2, T.madera, 0, 0.85, 0.6), box(4.5, 0.12, 1.5, T.acento, 0, 1.76, 0.6), box(3.4, 0.9, 0.08, T.madera2, 0, 0.9, 1.22));
  P.jefe = cubito(C.jefe || { tipo: 'gato', gorro: 'corona', cadena: 1 });
  P.jefe.scale.setScalar(1.55);
  P.jefe.position.set(0, 1.15, -0.5);
  g.add(P.jefe);
  // estrella dorada en la pared
  const st = new THREE.Group();
  for (let i = 0; i < 4; i++) { const r = box(2.2, 0.34, 0.06, T.acento, 0, 0, 0, 0.35); r.rotation.z = (i * Math.PI) / 4; st.add(r); }
  st.add(cyl(0.5, 0.1, T.luz, 0, 0, 0.04, 0.6));
  st.children[4].rotation.x = Math.PI / 2;
  st.position.set(0, 5.2, -4.3); st.scale.setScalar(0.8);
  P.estrella = st;
  const warm = new THREE.PointLight(T.luz, 14, 12, 1.5);
  warm.position.set(0, 4.6, -2.6);
  g.add(st, warm);
  // sobre lacrado
  P.sobre = new THREE.Group();
  P.sobre.add(box(1.25, 0.82, 0.05, T.papel));
  const flap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.45, 3), mat(0xd9cdb4));
  flap.rotation.set(Math.PI, 0, 0); flap.scale.z = 0.05; flap.position.set(0, 0.2, 0.04);
  const lacre = ball(0.14, T.acento, 0, 0.02, 0.06, 0.3);
  lacre.scale.z = 0.4;
  P.sobre.add(flap, lacre);
  g.add(P.sobre);
  // una tarjeta por cada escena «jefe»
  C.escenas.forEach((sc, i) => {
    if (sc.plano !== 'jefe') return;
    const tj = sc.tarjeta || {}, ok = tj.ok !== false, col = ok ? T.si : T.no, ls = (tj.lineas || []).map(plano);
    const v = sign(1.35, 1.8, (x, w, h) => {
      x.fillStyle = '#0b0b10'; rr(x, 0, 0, w, h, 34); x.fill();
      x.strokeStyle = T.acento; x.lineWidth = 6; rr(x, 10, 10, w - 20, h - 20, 26); x.stroke();
      txt(x, (tj.eyebrow || '').toUpperCase(), w / 2, h * 0.11, 26, 'rgba(255,255,255,.7)', SANS, w - 60);
      x.fillStyle = col; x.beginPath(); x.arc(w / 2, h * 0.33, 60, 0, 7); x.fill();
      txt(x, ok ? '✓' : '✗', w / 2, h * 0.335, 80, '#0b0b10');
      ls.forEach((l, n) => txt(x, l, w / 2, h * (0.6 + n * 0.19), 76, n ? T.acento : T.tinta, n ? SERIF : SANS, w - 60));
    }, true);
    v.scale.setScalar(0.001);
    g.add(v);
    P.porEscena[i] = v;
  });
  // mazo
  P.mazo = new THREE.Group();
  const head = cyl(0.2, 0.62, 0x17171c, 0, 1.25, 0);
  head.rotation.x = Math.PI / 2;
  const a1 = cyl(0.21, 0.06, T.acento, 0, 1.25, 0.2), a2 = cyl(0.21, 0.06, T.acento, 0, 1.25, -0.2);
  a1.rotation.x = a2.rotation.x = Math.PI / 2;
  P.mazo.add(cyl(0.05, 1.3, T.madera, 0, 0.65, 0), head, a1, a2);
  P.mazo.position.set(2.3, 1.85, 0.9);
  P.chispa = ball(0.5, T.luz, 1.05, 2.0, 0.95, 3);
  P.chispa.castShadow = false;
  P.chispaLuz = new THREE.PointLight(T.luz, 0, 10, 1.4);
  P.chispaLuz.position.set(1.05, 2.3, 1.4);
  g.add(P.mazo, cyl(0.34, 0.12, 0x17171c, 1.05, 1.88, 0.9), P.chispa, P.chispaLuz);
  scene.add(g);
}

// ---------- montaje ----------
export function init(canvas, config) {
  C = config;
  T = C.tema;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(T.noche);
  scene.fog = new THREE.Fog(T.pared, 14, 40);
  camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 80);
  // grano de papel en todas las superficies
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d'), d = x.createImageData(128, 128), r = rng(7);
  for (let i = 0; i < d.data.length; i += 4) { const v = 228 + r() * 27; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0);
  grain = new THREE.CanvasTexture(c);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.colorSpace = THREE.SRGBColorSpace;

  amb = new THREE.AmbientLight(0xb9a8ff, 1.5);
  key = new THREE.DirectionalLight(0xffe6c0, 2.7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  fill = new THREE.DirectionalLight(0x8f7bff, 0.9);
  spot = new THREE.SpotLight(T.luz, 0, 22, 0.42, 0.55, 1.2);
  spot.position.set(J.x, 8, 5);
  spot.target.position.set(J.x, 1, -0.6);
  scene.add(amb, key, key.target, fill, fill.target, spot, spot.target);
  sala();
  graderia();
  estrado();
  escritorio();
}

function cam(px, py, pz, lx, ly, lz, fov = 42, roll = 0) {
  camera.position.set(px, py, pz);
  camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.lookAt(lx, ly, lz);
  camera.fov = fov;
  camera.updateProjectionMatrix();
  key.position.set(lx + 5, ly + 9, lz + 7);
  key.target.position.set(lx, ly, lz);
  fill.position.set(lx - 6, ly + 4, lz + 5);
  fill.target.position.set(lx, ly, lz);
}

// Cortes internos de un plano (los primeros planos de «papeles»): para el barrido borroso.
export function cortesInternos(sc, cuando) {
  if (sc.plano !== 'papeles') return [];
  return (sc.quienes || []).slice(1).map((q, n, a) => cuando(q.en, (n + 1) / (a.length + 1)));
}

const PLANOS = {
  // el elenco va saliendo hasta llenar la gradería
  tribuna(u, d) {
    const paso = Math.min(0.16, (d * 0.72) / 12);
    ORDEN.forEach((ji, n) => {
      const a = n === 0 ? -1 : 0.05 + n * paso, j = P.elenco[ji];
      j.scale.set(1, Math.max(0.001, k(u, a, a + 0.28, E.back)), 1);
      j.userData.b.position.y += (1 - k(u, a, a + 0.45)) * 0.5;
    });
    const p = k(u, 0, d);
    cam(J.x + mix(0.5, 0, p), mix(1.9, 2.4, p), mix(5.0, 7.0, p), J.x + mix(0.3, 0, p), mix(1.1, 0.8, p), -0.6, 55);
  },
  // dos cubitos frente al foco, cada uno con su vara
  duelo(u, d) {
    duo(u, 0, 0);
    const p = k(u, 0, d);
    cam(SX + mix(-0.6, 0, p), mix(3.0, 2.5, p), mix(8.6, 7.4, p), SX, 0.5, 0.3, 55, mix(-0.05, 0, p));
  },
  // primer plano de un lado; su cartel responde
  alegato(u, d, sc, cuando, i) {
    const der = sc.lado === 'der', giro = k(u, 0, 0.3);
    duo(u, der ? 0 : giro, der ? giro : 0);
    const en = cuando(sc.en, 0.5), s = k(u, en, en + 0.25, E.back);
    P.porEscena[i].scale.setScalar(Math.max(0.001, s * 0.85));
    P.porEscena[i].rotation.z = (1 - s) * (der ? -0.6 : 0.6);
    const p = k(u, 0, d), sg = der ? 1 : -1;
    cam(SX + sg * 1.2 - sg * mix(1.0, 0.6, p), mix(1.0, 1.2, p), mix(6.2, 5.5, p), SX + sg * 1.3, 0.95, 0.3, 46, -sg * 0.05);
  },
  // suben las paletas; al final la cámara se va de lado
  votacion(u, d, sc, cuando) {
    const en = cuando(sc.en, 0.35), giroEn = cuando(sc.giroEn, 0.78), paso = Math.min(0.135, (giroEn - en) / 13);
    [5, 2, 9, 0, 7, 11, 4, 1, 10, 6, 3, 8].forEach((ji, n) => {
      const a = en + n * paso, p = k(u, a, a + 0.25, E.back), pd = P.elenco[ji].userData.paleta;
      pd.scale.setScalar(Math.max(0.001, p));
      pd.rotation.z = Math.sin(u * 6 + ji) * 0.12;
      pd.position.y = 0.95 + p * 0.25;
    });
    const p = k(u, 0, giroEn), q = sc.giro === false ? 0 : k(u, giroEn, d, E.in);
    cam(J.x + mix(5.2, 3.6, p) - q * 2.5, mix(4.4, 5.3, p) + q * 2.2, mix(6.4, 5.4, p) - q * 3, J.x + 0.2, mix(1.3, 1.6, p) + q * 0.5, -0.9, 52, mix(0.34, 0.24, p) + q * 1.5);
  },
  // a oscuras con un foco, y se enciende la sala
  apagon(u, d, sc, cuando) {
    const en = cuando(sc.en, 0.55), on = k(u, en, en + 0.35, E.inOut);
    amb.intensity = mix(0.12, 1.5, on);
    key.intensity = mix(0.05, 2.7, on);
    spot.intensity = mix(0, 170, k(u, 0.2, 0.7, E.inOut)) * (1 - on);
    const p = k(u, 0, d, E.lin);
    cam(J.x + mix(-0.5, 0.2, p), 2.4, mix(7.6, 7.0, p), J.x, 0.8, -0.6, 55);
  },
  // primeros planos de la fila de adelante, uno por palabra
  papeles(u, d, sc, cuando) {
    const qs = sc.quienes || [{ asiento: 0 }], ts = qs.map((q, n) => (n ? cuando(q.en, n / qs.length) : 0));
    let n = 0;
    ts.forEach((t0, m) => { if (u >= t0) n = m; });
    const q = qs[n], t0 = ts[n], j = P.elenco[q.asiento ?? n], b = j.userData.b, ob = j.userData.objeto;
    if (q.gesto === 'teclea') b.rotation.z = Math.sin(u * 16) * 0.05;
    if (q.gesto === 'brinca') b.position.y = Math.abs(Math.sin((u - t0) * 9)) * 0.22;
    if (q.gesto === 'asiente') b.rotation.x = Math.max(0, Math.sin((u - t0) * 10)) * 0.18;
    if (q.gesto === 'golpea' && ob) {
      const g = k(u, t0 + 0.12, t0 + 0.32, E.back), o = j.userData.objBase;
      ob.position.set(o.x + 0.1 * g, o.y, o.z + 0.65 * g);
      ob.scale.setScalar(j.userData.objEsc * (1 + 0.35 * g));
    }
    const p = k(u, t0, t0 + 0.7), lado = n % 2 ? -0.5 : 0.5, w = j.position;
    cam(J.x + w.x + lado * (1 - p * 0.5), w.y + 1.0, w.z + mix(4.7, 4.1, p), J.x + w.x, w.y + 0.45, w.z, 40, lado * 0.08);
  },
  // el jefe saca un sobre, sale la tarjeta y cae el mazo
  jefe(u, d, sc, cuando, i) {
    P.jefe.userData.b.position.y = Math.abs(Math.sin(u * 6)) * 0.04;
    const abre = cuando(sc.abreEn, 0.45), mazoT = sc.mazo === false ? 1e9 : cuando(sc.mazoEn, 0.84);
    const sube = k(u, 0.1, 0.7, E.back), open = k(u, abre, abre + 0.3, E.back), fuera = k(u, abre, abre + 0.2, E.in);
    P.sobre.position.set(-0.3, mix(1.2, 3.0, sube) - fuera * 2.4, 1.3);
    P.sobre.rotation.set(-0.15, 0.25, mix(0.5, -0.12, sube) + Math.sin(u * 7) * 0.04);
    P.sobre.scale.setScalar(Math.max(0.001, sube * (1 - fuera)));
    const hit = k(u, mazoT, mazoT + 0.15, E.in), fl = u > mazoT + 0.15 ? 1 - k(u, mazoT + 0.15, mazoT + 0.45) : 0;
    const v = P.porEscena[i];
    v.position.set(-0.85, mix(2.0, 2.45, open) + hit * 0.15, mix(1.0, 1.7, open));
    v.rotation.set(-0.1, 0.18, -0.06 + Math.sin(u * 5) * 0.03);
    v.scale.setScalar(Math.max(0.001, open * 0.62));
    P.mazo.rotation.z = mix(-0.5, 1.42, hit);
    P.chispa.scale.setScalar(Math.max(0.001, fl * 1.5));
    P.chispaLuz.intensity = fl * 60;
    const p = k(u, 0, Math.min(d, mazoT - 0.05)), g2 = k(u, mazoT - 0.1, mazoT + 0.15, E.inOut), tiembla = fl * Math.sin(u * 90) * 0.06;
    cam(BX + mix(-0.9, -0.5, p) + g2 * 1.2 + tiembla, mix(1.9, 2.3, p) + tiembla, mix(8.0, 7.2, p) - g2 * 2.4, BX + g2 * 0.9, mix(2.2, 2.55, p) - g2 * 0.45, 0.2, 44, mix(0.06, 0.02, p) - g2 * 0.12);
    return fl; // destello para la capa de encima
  },
};
export const PLANOS_3D = Object.keys(PLANOS);

function duo(u, gI, gD) {
  const a = P.izq.c, b = P.der.c, pulso = 1 + Math.sin(u * 9) * 0.05;
  P.foco.scale.setScalar(pulso);
  P.focoLuz.intensity = 8 * pulso;
  a.rotation.y = mix(Math.PI / 2, 0.2, gI);
  b.rotation.y = mix(-Math.PI / 2, -0.2, gD);
  a.userData.vara.rotation.set(1.25 + Math.max(0, Math.sin(u * 11)) * 0.22, 0, 0);
  b.userData.vara.rotation.set(1.25 + Math.max(0, Math.sin(u * 11 + 3.1)) * 0.22, 0, 0);
  a.userData.vara.scale.setScalar(Math.max(0.001, 1 - gI));
  b.userData.vara.scale.setScalar(Math.max(0.001, 1 - gD));
  a.userData.b.position.y = Math.abs(Math.sin(u * 8)) * 0.07;
  b.userData.b.position.y = Math.abs(Math.sin(u * 8 + 1.6)) * 0.07;
}

export function pintar(t, i, u, d, sc, cuando) {
  amb.intensity = 1.5;
  key.intensity = 2.7;
  spot.intensity = 0;
  P.chispa.scale.setScalar(0.001);
  P.chispaLuz.intensity = 0;
  P.estrella.rotation.z = t * 0.15;
  Object.values(P.porEscena).forEach((o) => o.scale.setScalar(0.001));
  P.elenco.forEach((j, n) => {
    j.scale.setScalar(1);
    const b = j.userData.b;
    b.position.y = Math.abs(Math.sin(t * 5 + n * 1.7)) * 0.04;
    b.rotation.set(0, 0, Math.sin(t * 3 + n * 2.1) * 0.03);
    j.userData.paleta.scale.setScalar(0.001);
    if (j.userData.objeto) { j.userData.objeto.position.copy(j.userData.objBase); j.userData.objeto.scale.setScalar(j.userData.objEsc); }
  });
  const fl = PLANOS[sc.plano](u, d, sc, cuando, i) || 0;
  renderer.render(scene, camera);
  return fl;
}
