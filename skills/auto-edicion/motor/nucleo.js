// ============================================================================
// NÚCLEO de dibujo cuadro a cuadro
// Cada cuadro se DIBUJA con código: sin imágenes, sin videos, sin librerías.
// Adaptado de iart-ai/javascript-animation-skills (MIT, ver motor/LICENSE-iart-ai.txt).
//
// Contrato (render.mjs depende de él):
//   window.draw(frame)  es función PURA del número de cuadro (mismo cuadro = misma imagen)
//   window.FRAMES, window.FPS
// Nunca uses Math.random ni Date: usa rng(semilla) o hash2(a, b).
// Antes de este archivo la pieza define: W, H, FPS, DUR.
// ============================================================================
const FRAMES = Math.round(FPS * DUR);
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
let ctx = cv.getContext('2d');

// Zona segura de Instagram en 9:16 (lo que no tapan la barra de arriba ni el caption de abajo)
const SEGURA = { top: 250, bottom: H - 450, left: 70, right: W - 70 };

// ---------- matemática ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const back = t => { t = clamp(t); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const prog = (t, a, b) => clamp((t - a) / (b - a));
function hash2(a, b) {
  let n = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), u), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u), v);
}
function rng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- trazo a mano ----------
let BOIL = 0;          // cambia cada BOIL_N cuadros: el "hervor" de la línea dibujada a mano
let WOBBLE = 1;        // 0 = línea limpia, 1 = pluma, 2+ = boceto suelto
function jit(x, y, seed, amp) {
  const s = seed * 13.37;
  return [
    x + (vnoise(x * .012 + s, y * .012) - .5) * 2 * amp + (vnoise(x * .09 + s, y * .09 + 7) - .5) * amp * .6,
    y + (vnoise(x * .012, y * .012 + s + 50) - .5) * 2 * amp + (vnoise(x * .09 + 3, y * .09 + s) - .5) * amp * .6,
  ];
}
function resample(pts, step = 9, closed = false) {
  const out = [], P = closed ? [...pts, pts[0]] : pts;
  for (let i = 0; i < P.length - 1; i++) {
    const [x0, y0] = P[i], [x1, y1] = P[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 0; k < n; k++) out.push([lerp(x0, x1, k / n), lerp(y0, y1, k / n)]);
  }
  if (!closed) out.push(P[P.length - 1]);
  return out;
}
function tracePath(pts, closed) {
  ctx.beginPath();
  if (pts.length < 3) { ctx.moveTo(...pts[0]); pts.slice(1).forEach(p => ctx.lineTo(...p)); if (closed) ctx.closePath(); return; }
  const P = closed ? [...pts, pts[0], pts[1]] : pts;
  ctx.moveTo(...(closed ? [(P[0][0] + P[1][0]) / 2, (P[0][1] + P[1][1]) / 2] : P[0]));
  for (let i = 1; i < P.length - 1; i++) ctx.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2);
  if (!closed) ctx.lineTo(...P[P.length - 1]); else ctx.closePath();
}
const J = (pts, seed, amp) => pts.map(([x, y]) => jit(x, y, BOIL + seed, amp * WOBBLE));
function ink(pts, o = {}) {
  const { w = 4, col = '#111', closed = false, amp = 2, seed = 0, passes = 2, alpha = 1 } = o;
  ctx.save(); ctx.lineCap = ctx.lineJoin = 'round';
  for (let p = 0; p < passes; p++) {
    ctx.globalAlpha = alpha * (p ? .45 : 1); ctx.strokeStyle = col; ctx.lineWidth = w * (p ? .55 : 1);
    tracePath(J(pts, seed + p * .41, amp * (p ? 1.4 : 1)), closed); ctx.stroke();
  }
  ctx.restore();
}
function fill(pts, col, o = {}) {
  const { amp = 1.6, seed = 0, alpha = 1 } = o;
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = col;
  tracePath(J(pts, seed + .2, amp), true); ctx.fill(); ctx.restore();
}
function hatch(pts, o = {}) { // rayado paralelo recortado a una forma
  const { angle = -0.9, gap = 11, col = '#111', w = 1.6, alpha = .35, seed = 0 } = o;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const R = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 10;
  ctx.save(); tracePath(J(pts, seed, 1.5), true); ctx.clip();
  ctx.translate(cx, cy); ctx.rotate(angle);
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.globalAlpha = alpha; ctx.lineCap = 'round';
  for (let y = -R, i = 0; y < R; y += gap, i++) {
    const a = hash2(i, BOIL + seed * 7) * 4 - 2, b = hash2(i + 99, BOIL + seed * 7) * 4 - 2;
    ctx.beginPath(); ctx.moveTo(-R, y + a); ctx.quadraticCurveTo(0, y + (a + b), R, y + b); ctx.stroke();
  }
  ctx.restore();
}
function drawOn(pts, p, o = {}) { const n = Math.max(2, Math.round(pts.length * clamp(p))); if (p > 0) ink(pts.slice(0, n), o); }

// ---------- formas ----------
const circle = (cx, cy, r, ry = r, rot = 0) => {
  const n = Math.max(20, Math.round(Math.max(r, ry) * .45)), out = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = Math.cos(a) * r, y = Math.sin(a) * ry;
    out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); }
  return out;
};
const rect = (x, y, w, h) => resample([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], 12, true);
const line = (x0, y0, x1, y1) => resample([[x0, y0], [x1, y1]], 10);
const arc = (cx, cy, r, a0, a1, ry = r) => { const n = Math.max(8, Math.round(Math.abs(a1 - a0) * r / 9)), o = [];
  for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * ry]); } return o; };
const roundRect = (x, y, w, h, r) => resample([
  ...arc(x + w - r, y + r, r, -Math.PI / 2, 0), ...arc(x + w - r, y + h - r, r, 0, Math.PI / 2),
  ...arc(x + r, y + h - r, r, Math.PI / 2, Math.PI), ...arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)], 10, true);
function glow(x, y, r, rgb, a) {
  ctx.save(); const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
}

// ---------- herramienta mágica: escribe SOLA, sin mano ni brazo ----------
// Regla de la skill: nada de anatomía dibujada en vector (manos, brazos, dedos, caras realistas): sale deforme.
// Lo que escribe flota, con brillo y chispas. Es pequeño y queda ARRIBA A LA DERECHA de la punta:
// nunca tapa lo ya escrito. Aparece y se va con un destello, no entra deslizándose desde fuera del cuadro.
//   px, py: dónde está la punta · aparece: 0→1 · se va: 0→1 · t: segundos
//   o.tipo: 'tiza' | 'plumon' · o.col: color del cuerpo · o.punta: color de la punta · o.brillo: 'r,g,b'
function herramientaMagica(px, py, t, aparece, seVa, o = {}) {
  const tipo = o.tipo || 'tiza', brillo = o.brillo || '255,236,170';
  const vis = clamp(aparece) * (1 - clamp(seVa));
  // destello al aparecer y al irse: anillo que se abre + estrellitas
  for (const [k, s] of [[aparece, 1], [seVa, 2]]) if (k > 0 && k < 1) {
    const r = 30 + k * 120; ctx.save(); ctx.globalAlpha = (1 - k) * .9; ctx.strokeStyle = `rgb(${brillo})`; ctx.lineWidth = 5 * (1 - k) + 1;
    ctx.beginPath(); ctx.arc(px + 40, py - 40, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + s, d = 40 + k * 150;
      estrellita(px + 40 + Math.cos(a) * d, py - 40 + Math.sin(a) * d, 14 * (1 - k) + 3, brillo, 1 - k); }
  }
  if (vis <= 0) return;
  // estela de chispas: posiciones pasadas de la punta no hacen falta; salen de la punta y suben flotando
  const f = Math.round(t * 30);
  for (let k = f - 18; k <= f; k++) { const dt = (f - k) / 30;
    for (let j = 0; j < 2; j++) { const h = hash2(k, j + 7); if (h < .45) continue;
      const x = px + (hash2(j, k) - .5) * 50 + (hash2(k, j) - .5) * 60 * dt, y = py - 10 - 90 * dt + (hash2(k + 3, j) - .5) * 30;
      estrellita(x, y, (4 + h * 7) * (1 - dt / .6), brillo, vis * (1 - dt / .6)); } }
  const flota = Math.sin(t * 5) * 4;
  ctx.save(); ctx.globalAlpha = vis; ctx.translate(px, py + flota);
  glow(0, 0, 70, brillo, .55); glow(55, -55, 110, brillo, .18);
  ctx.rotate(-Math.PI / 4);                         // cuerpo hacia arriba a la derecha, punta en el trazo
  const L = tipo === 'tiza' ? 120 : 150, A = tipo === 'tiza' ? 28 : 34;
  fill(roundRect(8, -A / 2 + 10, L, A, A / 2.4), 'rgba(0,0,0,.22)', { amp: .4, seed: 91 });   // sombra
  if (tipo === 'tiza') {
    fill(roundRect(0, -A / 2, L, A, 11), o.col || '#f4f1e8', { amp: .5, seed: 92 });
    fill(roundRect(0, -A / 2, 24, A, 10), o.punta || '#ffffff', { amp: .4, seed: 93 });
    fill(roundRect(30, -A / 2 + 4, L - 44, 6, 3), 'rgba(255,255,255,.55)', { amp: .3, seed: 94 });
  } else {
    fill(roundRect(28, -A / 2, L - 28, A, 12), o.col || '#243a7a', { amp: .5, seed: 92 });
    fill(roundRect(L - 44, -A / 2 - 3, 44, A + 6, 12), 'rgba(0,0,0,.25)', { amp: .4, seed: 95 });   // tapa trasera
    fill(resample([[4, -8], [30, -A / 2 + 3], [30, A / 2 - 3], [4, 8]], 5, true), '#1c2b59', { amp: .3, seed: 96 });
    fill(circle(2, 0, 8), o.punta || '#2f5fc4', { amp: .3, seed: 97 });
    fill(roundRect(40, -A / 2 + 5, L - 90, 6, 3), 'rgba(255,255,255,.35)', { amp: .3, seed: 94 });
  }
  ctx.restore();
}
function estrellita(x, y, r, rgb, a) {               // estrella de 4 puntas
  if (r <= 0 || a <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.fillStyle = `rgb(${rgb})`; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const ang = i / 8 * Math.PI * 2, d = i % 2 ? r * .28 : r; ctx.lineTo(x + Math.cos(ang) * d, y + Math.sin(ang) * d); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

// ---------- papel (se pinta UNA vez; luego se copia en cada cuadro) ----------
function hacerPapel(color, { grano = true, fibras = true, viñeta = .13, semilla = 7 } = {}) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const p = c.getContext('2d'), r = rng(semilla);
  p.fillStyle = color; p.fillRect(0, 0, W, H);
  if (grano) for (let i = 0; i < W * H / 14; i++) { p.fillStyle = r() < .5 ? 'rgba(90,70,50,0.05)' : 'rgba(255,255,255,0.08)'; p.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5); }
  if (fibras) { p.strokeStyle = 'rgba(120,95,70,0.06)'; p.lineWidth = 1;
    for (let i = 0; i < 480; i++) { const x = r() * W, y = r() * H, a = r() * 6.28, l = 6 + r() * 22;
      p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(x + Math.cos(a) * l / 2 + 3, y + Math.sin(a) * l / 2, x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke(); } }
  if (viñeta) { const g = p.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(60,40,20,${viñeta})`); p.fillStyle = g; p.fillRect(0, 0, W, H); }
  return c;
}

// ---------- texto ----------
// Fuentes del sistema (cero descargas). En Mac existen todas; en Windows cae a la siguiente de la lista.
const LETRA_MANO = '"Marker Felt", "Chalkboard SE", "Segoe Print", "Comic Sans MS", cursive';
const LETRA_LIMPIA = '"Avenir Next", "Helvetica Neue", "Segoe UI", Arial, sans-serif';
function medir(texto, font) { ctx.save(); ctx.font = font; const w = ctx.measureText(texto).width; ctx.restore(); return w; }
// Parte un texto en renglones que caben en `ancho`.
// Solo corta en espacios normales: un espacio duro ( ) mantiene juntas dos palabras («10 kg»).
function renglones(texto, font, ancho) {
  const out = []; let cur = '';
  for (const pal of texto.trim().split(/[ \t\n]+/)) { const prueba = cur ? cur + ' ' + pal : pal;
    if (medir(prueba, font) > ancho && cur) { out.push(cur); cur = pal; } else cur = prueba; }
  if (cur) out.push(cur); return out;
}
// Mismos renglones, pero parejos: el ancho más angosto que no agrega renglones (evita «Nadie / enseña la / derecha»)
function parejos(texto, font, ancho, n) {
  let lo = ancho * .35, hi = ancho;
  for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (renglones(texto, font, m).length <= n) hi = m; else lo = m; }
  return renglones(texto, font, hi);
}
// Elige tamaño y renglones (mide alto Y ancho). Prefiere MENOS renglones: acepta uno más solo si la letra crece ≥ 20 %.
// Si ni con tamMin cabe, avisa en consola (renderizar.mjs lo muestra) y devuelve desborda: true.
function autoajuste(texto, familia, peso, ancho, maxRenglones, tamMax, tamMin = 40) {
  const mejor = {};                                      // cantidad de renglones -> tamaño más grande con esa cantidad
  for (let s = tamMax; s >= tamMin; s -= 2) {
    const font = `${peso} ${s}px ${familia}`, rs = renglones(texto, font, ancho);
    if (rs.length <= maxRenglones && rs.every(r => medir(r, font) <= ancho) && !mejor[rs.length]) mejor[rs.length] = s;
  }
  const ns = Object.keys(mejor).map(Number).sort((a, b) => a - b);
  if (!ns.length) {
    console.error(`[autoajuste] «${texto}» no cabe en ${maxRenglones} renglones ni con letra de ${tamMin}px: acorta la frase.`);
    const font = `${peso} ${tamMin}px ${familia}`; return { font, size: tamMin, rs: renglones(texto, font, ancho), desborda: true };
  }
  let n = ns[0];
  for (const k of ns.slice(1)) if (mejor[k] >= mejor[n] * 1.2) n = k;
  const size = mejor[n], font = `${peso} ${size}px ${familia}`;
  return { font, size, rs: parejos(texto, font, ancho, n) };
}

// ---------- fotos reales (scrapbook, polaroid) ----------
// cargarFotos(['fotos/a.jpg', ...]) → promesa con las imágenes, en orden. Rutas relativas a la pieza.
// El render espera a window.LISTO antes del primer cuadro, así que nunca sale un cuadro sin foto.
function cargarFotos(rutas) {
  const p = Promise.all(rutas.map(src => new Promise((ok, mal) => {
    const im = new Image(); im.onload = () => ok(im); im.onerror = () => mal(new Error('No encontré la foto: ' + src)); im.src = src;
  })));
  window.LISTO = p; return p;
}
// cargarJSON('mi-ficha.json') → promesa con el objeto. Usa XHR porque fetch() no abre archivos locales (file://).
function cargarJSON(ruta) {
  return new Promise((ok, mal) => { const x = new XMLHttpRequest(); x.open('GET', ruta);
    x.onload = () => { try { ok(JSON.parse(x.responseText)); } catch (e) { mal(new Error('El JSON está mal escrito: ' + ruta)); } };
    x.onerror = () => mal(new Error('No encontré el archivo: ' + ruta)); x.send(); });
}
// Pinta una foto recortada tipo «cover» dentro de un rectángulo (sin deformarla). fx, fy = foco 0..1
function fotoCover(im, x, y, w, h, fx = .5, fy = .4) {
  const e = Math.max(w / im.width, h / im.height), sw = w / e, sh = h / e;
  ctx.drawImage(im, (im.width - sw) * fx, (im.height - sh) * fy, sw, sh, x, y, w, h);
}

// ---------- movimiento con oficio (puras: entra el tiempo, sale el valor) ----------
// Una entrada nunca es lineal: se pasa y asienta (resorte), llega y frena seco (aterriza) o toma impulso (anticipa).
// resorte: 0→1 que se pasa de largo y se asienta. rebote = cuántas veces oscila · amortigua = qué tan pronto se calma.
function resorte(t, o = {}) {
  const { rebote = 1.5, amortigua = 5 } = o; t = clamp(t);
  return 1 - Math.exp(-amortigua * t) * Math.cos(rebote * 2 * Math.PI * t) * (1 - t);
}
// aterriza: 0→1 que sale disparado y frena seco al llegar (sin rebote).
const aterriza = t => 1 - Math.pow(1 - clamp(t), 5);
// anticipa: 0→1 que primero retrocede `cuanto` (toma impulso durante `impulso` del tiempo) y después sale y aterriza.
function anticipa(t, cuanto = .12, impulso = .3) {
  t = clamp(t);
  return t < impulso ? -cuanto * (1 - Math.cos(t / impulso * Math.PI)) / 2 : lerp(-cuanto, 1, aterriza((t - impulso) / (1 - impulso)));
}
// escalonado: el avance 0→1 de la pieza i de n cuando el conjunto va en t (0→1): entran en cascada.
// solape 0 = una termina y empieza la otra · .5 = cada una arranca a la mitad de la anterior · 1 = todas juntas.
function escalonado(i, n, t, solape = .5) {
  const d = 1 / (1 + (n - 1) * (1 - solape));
  return clamp((t - i * d * (1 - solape)) / d);
}
// caer: la y de algo que se suelta en `desde` y rebota en `piso` (px). t en SEGUNDOS desde que se suelta.
// Fórmula cerrada (sin estado): cada rebote sube `elastico` de la velocidad del anterior; después se queda en el piso.
function caer(t, o = {}) {
  const { desde = 0, piso = 600, gravedad = 4200, rebotes = 3, elastico = .45 } = o, h = piso - desde;
  if (t <= 0 || h <= 0) return t <= 0 ? desde : piso;
  const T = Math.sqrt(2 * h / gravedad); let v = gravedad * T;
  if (t < T) return desde + gravedad * t * t / 2;
  t -= T;
  for (let k = 0; k < rebotes; k++) { v *= elastico; const d = 2 * v / gravedad; if (t < d) return piso - (v * t - gravedad * t * t / 2); t -= d; }
  return piso;
}

// ---------- textura: acuarela, pincel y grano ----------
// Semilla fija y sin BOIL: la mancha no hierve; se mueve solo si tú cambias `crece` o `p`.
// acuarela: mancha de una forma cerrada (circle, roundRect, tus puntos). Un halo húmedo, un lavado translúcido,
// capas adentro que dejan sus marcas de agua, más pigmento en la orilla y motas. crece 0→1 = el agua se abre.
//   o.capas (4) · o.alpha (.8) · o.borde (14 px de irregularidad) · o.orilla (.35) · o.semilla · o.crece (1)
function acuarela(pts, color, o = {}) {
  const { capas = 4, alpha = .8, semilla = 1, borde = 14, orilla = .35, crece = 1 } = o;
  if (crece <= 0 || alpha <= 0 || pts.length < 3) return;
  let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= pts.length; cy /= pts.length;
  const base = resample(pts, 16, true), amb = ctx.globalAlpha * clamp(alpha), g = aterriza(crece), fuerza = clamp(crece * 1.6 - .6);
  // la misma forma con otro borde, otro tamaño y un poco corrida: así ninguna capa calza con la anterior
  const forma = (k, tam, corre) => { const dx = (hash2(k, semilla * 3 + 1) - .5) * corre, dy = (hash2(k, semilla * 3 + 2) - .5) * corre;
    return base.map(([x, y]) => { const [jx, jy] = jit(x, y, semilla * 7.31 + k * 3.7, borde * (k ? 1.5 : 1)); return [cx + dx + (jx - cx) * tam * g, cy + dy + (jy - cy) * tam * g]; }); };
  const orillaP = forma(0, 1, 0);
  ctx.save(); ctx.fillStyle = ctx.strokeStyle = color; ctx.lineJoin = 'round';
  ctx.globalAlpha = amb * .16; tracePath(forma(9, 1.035, borde), true); ctx.fill();                 // halo húmedo
  tracePath(orillaP, true); ctx.clip();
  ctx.globalAlpha = amb * .62; ctx.fill();                                                           // lavado
  ctx.globalAlpha = amb * .2;
  for (let k = 1; k < capas; k++) { tracePath(forma(k, .97 - .1 * k * (1 - .25 * hash2(k, semilla)), borde * 4), true); ctx.fill(); }   // marcas de agua
  if (orilla > 0 && fuerza > 0) {                                                                    // el pigmento se junta en la orilla
    tracePath(orillaP, true);
    ctx.globalAlpha = amb * orilla * .45 * fuerza; ctx.lineWidth = borde * 3; ctx.stroke();
    ctx.globalAlpha = amb * orilla * fuerza; ctx.lineWidth = Math.max(3, borde * .55); ctx.stroke();
    const r = rng(semilla * 977 + 13), xs = orillaP.map(p => p[0]), ys = orillaP.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), m = Math.min(x1 - x0, y1 - y0);
    ctx.globalAlpha = amb * orilla * .22 * fuerza;
    for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.ellipse(lerp(x0, x1, r()), lerp(y0, y1, r()), m * (.05 + r() * .16), m * (.04 + r() * .1), r() * 3.14, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}
// pincel: brochazo sobre una línea de puntos (con 3 o 4 basta: la curva se suaviza sola). Muchas cerdas finas:
// unas cargan más pintura, la presión cambia el ancho y la brocha se seca hacia el final y en las orillas
// (deja vetas). p 0→1 = se pinta sola.
//   o.w (60) · o.col · o.alpha · o.seco (0 = llena, .35, 1 = casi seca) · o.presion (.35) · o.semilla · o.p (1)
function pincel(pts, o = {}) {
  const { w = 60, col = '#111', alpha = 1, semilla = 1, seco = .35, presion = .35, p = 1 } = o;
  if (p <= 0 || alpha <= 0 || pts.length < 2) return;
  const P = [];                                           // la línea, suavizada (Catmull-Rom) y a pasos de ~8 px
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], d = pts[Math.min(pts.length - 1, i + 2)];
    const m = Math.max(1, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / 8));
    for (let k = 0; k < m; k++) { const u = k / m, u2 = u * u, u3 = u2 * u;
      P.push([0, 1].map(e => .5 * (2 * b[e] + (c[e] - a[e]) * u + (2 * a[e] - 5 * b[e] + 4 * c[e] - d[e]) * u2 + (3 * b[e] - a[e] - 3 * c[e] + d[e]) * u3))); }
  }
  P.push(pts[pts.length - 1]);
  const N = P.length, n = Math.max(2, Math.round(N * clamp(p))), cerdas = Math.max(6, Math.min(44, Math.round(w / 2.6)));
  const nor = P.map((_, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / L, (b[0] - a[0]) / L]; });
  ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
  const a0 = ctx.globalAlpha * alpha, grosor = w / cerdas * 1.25;
  for (let j = 0; j < cerdas; j++) {
    const u = j / (cerdas - 1) - .5, orilla = Math.abs(u) * 2, carga = hash2(j, semilla * 31 + 5);
    const entra = Math.round(hash2(j, semilla * 7 + 3) * 3 * orilla * orilla), sale = n - Math.round(hash2(j + 9, semilla * 7 + 4) * (2 + 10 * orilla));
    ctx.globalAlpha = a0 * (.62 + .38 * carga); ctx.lineWidth = grosor * (.8 + .5 * hash2(j + 40, semilla * 17 + 1));
    ctx.beginPath(); let pintando = false;
    for (let i = entra; i < sale; i++) {
      const f = i / (N - 1), ancho = (1 - presion + presion * 2 * vnoise(f * 4 + semilla * 3.1, 3.3)) * Math.min(1, f * 10 + .55, (1 - f) * 7 + .45);
      // vetas secas: manchas largas que agarran varias cerdas vecinas; más hacia el final del trazo y en las orillas
      if (vnoise(i * .045 + semilla * 5.3, j * .42 + semilla) * .75 + hash2(j, semilla + 77) * .12 + seco * (f * f * .5 + orilla * orilla * .32) > .72) { pintando = false; continue; }
      const d = u * w * ancho, x = P[i][0] + nor[i][0] * d, y = P[i][1] + nor[i][1] * d;
      if (pintando) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      pintando = true;
    }
    ctx.stroke();
  }
  ctx.restore();
}
// grano: grano de papel SOLO sobre lo ya pintado (el fondo transparente sigue transparente). Va al final del cuadro
// o justo antes del texto si lo quieres nítido. El mosaico se pinta una vez por semilla.
const GRANOS_DE_PAPEL = {};
function grano(alfa = .14, semilla = 3) {
  let m = GRANOS_DE_PAPEL[semilla];
  if (!m) { m = GRANOS_DE_PAPEL[semilla] = document.createElement('canvas'); m.width = m.height = 256;
    const g = m.getContext('2d'), r = rng(semilla * 131 + 7);
    for (let i = 0; i < 9000; i++) { g.fillStyle = r() < .55 ? `rgba(40,25,10,${.25 + r() * .55})` : `rgba(255,255,255,${.25 + r() * .55})`; g.fillRect(r() * 256, r() * 256, 1 + r() * 1.7, 1 + r() * 1.7); } }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alfa; ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = ctx.createPattern(m, 'repeat'); ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
}

// ---------- arranque ----------
window.FRAMES = FRAMES; window.FPS = FPS;
function arrancar(draw) {
  window.draw = draw;
  // vista previa en vivo al abrir con doble clic (render.mjs abre con ?render y se la salta)
  if (!new URLSearchParams(location.search).has('render')) (window.LISTO || Promise.resolve()).then(() => {
    const start = performance.now();
    const loop = () => { draw(Math.floor((performance.now() - start) / 1000 * FPS) % FRAMES); requestAnimationFrame(loop); };
    loop();
  });
}
