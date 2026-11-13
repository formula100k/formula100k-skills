// ============================================================================
// cine-dibujo.js · motor compartido del grupo «Dibujo y pintura» (estilos cine-*)
// Lo usan: cine-whiteboard, cine-chalkboard, cine-crayon-book, cine-watercolor, cine-ink-wash,
//          cine-impasto, cine-one-line, cine-urban-sketch.
// Va DESPUÉS de nucleo.js (usa ctx, W, H, clamp, lerp, hash2, vnoise, rng, ease, prog).
// Técnica adaptada de lemo-opuscar (MIT, © 2026 LemoLab).
//
// Exporta (globales):
//   capa(w?, h?)                      → canvas aparte (para tinta, máscaras, texturas)
//   camara(claves)                    → { at(t) → {x, y, z, r} }  claves: [t, x, y, zoom, giro?, curva?]
//                                       el zoom se interpola en 1/z (el empuje se siente como dolly)
//   ponerCam(g, c) · aPantalla(c, x, y)
//   class Trazo(pts, o)               → trazo a mano con temblor de pulso, sobrepaso, presión y velocidad lenta-rápida-lenta
//                                       o: { w, col, alpha, temblor, onda, sobre, semilla, suave }
//   cinta(g, s, L, k)                 → el trazo hasta el largo L como cinta de ancho variable (punta biselada + presión)
//   pintarTrazo(g, s, t, o)           → lo pinta según su t0/t1, con la gota de tinta al aterrizar
//   tLinea, tCurva, tArco, tCirculo (no cierra: se pasa), tCaja (4 trazos con sobrepaso), tFlecha, tPalomita
//   agendar(items, t0, t1, hueco)     → reparte el tiempo entre trazos y letras (termina justo en t1)
//   letras(txt, x, y, font, o)        → glifos sueltos con giro, base y escala movidos a mano (escritura en orden)
//   pintarLetra(g, L, t)              → la letra se destapa de izquierda a derecha como si se escribiera
//   puntaLetra(L, u)                  → dónde está la punta escribiendo esa letra
//   poseHerramienta(trabajos, t, park)→ { x, y, alza, toca } : flota entre trazos, se estaciona fuera del cuadro
//   tileSeco(semilla)                 → mosaico de plumón seco (motas y rayitas) para destination-out
//   plumon(sx, sy, alza, col, o)      → plumón flotante con sombra que crece al alzarse (sin mano)
//   borrador(sx, sy, alza, ancho)     → borrador de fieltro con sombra
//   iman(sx, sy, alza, r, col)        → imán brillante con reflejo y sombra que se encoge al caer
//   tileGrano(semilla, tam)           → grano fino genérico (pizarra, papel)
//   granoPizarra(semilla)             → la pizarra decide qué granos toman la tiza (destination-out)
// ============================================================================

function capa(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------- cámara 2D sobre un tablero grande ----------
function camara(claves) {
  const K = claves.map(k => ({ t: k[0], x: k[1], y: k[2], z: k[3], r: k[4] || 0, e: k[5] || 'io' }));
  const E = { io: u => u * u * u * (u * (u * 6 - 15) + 10), i: u => u * u * u, o: u => 1 - (1 - u) ** 3, l: u => u };
  return {
    at(t) {
      if (t <= K[0].t) return K[0]; if (t >= K[K.length - 1].t) return K[K.length - 1];
      let i = 0; while (t > K[i + 1].t) i++;
      const a = K[i], b = K[i + 1], e = (E[b.e] || E.io)((t - a.t) / (b.t - a.t));
      const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), e));
      const wgt = Math.abs(b.z - a.z) > 1e-4 ? (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z) : e;
      return { x: lerp(a.x, b.x, wgt), y: lerp(a.y, b.y, wgt), z, r: lerp(a.r, b.r, e) };
    },
  };
}
function ponerCam(g, c) { g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, H / 2); g.rotate(c.r); g.scale(c.z, c.z); g.translate(-c.x, -c.y); }
function aPantalla(c, x, y) { const dx = (x - c.x) * c.z, dy = (y - c.y) * c.z, cs = Math.cos(c.r), sn = Math.sin(c.r); return [W / 2 + dx * cs - dy * sn, H / 2 + dx * sn + dy * cs]; }

// ---------- trazo a mano ----------
function _remuestra(p, paso) {
  const o = [p[0].slice()]; let resto = 0;
  for (let i = 1; i < p.length; i++) {
    const [ax, ay] = p[i - 1], [bx, by] = p[i], d = Math.hypot(bx - ax, by - ay); let s = paso - resto;
    while (s <= d) { o.push([ax + (bx - ax) * s / d, ay + (by - ay) * s / d]); s += paso; }
    resto = d - (s - paso);
  }
  const L = p[p.length - 1], E = o[o.length - 1]; if (Math.hypot(L[0] - E[0], L[1] - E[1]) > paso * .25) o.push(L.slice());
  return o;
}
function _chaikin(p, n) { for (let k = 0; k < n; k++) { const o = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const [ax, ay] = p[i], [bx, by] = p[i + 1]; o.push([ax * .75 + bx * .25, ay * .75 + by * .25], [ax * .25 + bx * .75, ay * .25 + by * .75]); } o.push(p[p.length - 1]); p = o; } return p; }
let _SEM = 1;
class Trazo {
  constructor(pts, o = {}) {
    this.o = o; this.w = o.w ?? 9; this.col = o.col || '#23262c'; this.alpha = o.alpha ?? .94; this.semilla = o.semilla ?? (_SEM += 1.37);
    let p = _remuestra(o.suave ? _chaikin(pts, o.suave) : pts, Math.max(2.5, this.w * .6));
    const J = o.temblor ?? 1, onda = o.onda ?? 220;
    if (J > 0 && p.length > 2) {             // pulso: deriva lenta a lo largo de la normal + un temblor fino
      let s = 0; p = p.map((q, i) => {
        const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
        if (i) s += Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]);
        const off = J * 2.6 * ((vnoise(s / onda + this.semilla * 7.31, 1.5) - .5) * 2 + .45 * (vnoise(s / (onda * .23) + this.semilla * 3.1, 4.5) - .5));
        return [q[0] - ty / tl * off, q[1] + tx / tl * off];
      });
    }
    if (o.sobre && p.length > 2) {           // sobrepaso + ganchito al final
      const n = p.length, tx = p[n - 1][0] - p[n - 2][0], ty = p[n - 1][1] - p[n - 2][1], tl = Math.hypot(tx, ty) || 1, hk = (hash2(this.semilla * 99 | 0, 3) - .5) * .5;
      for (let k = 1; k <= 4; k++) { const f = o.sobre * k / 4, a = hk * k / 4;
        p.push([p[n - 1][0] + (tx / tl * Math.cos(a) - ty / tl * Math.sin(a)) * f, p[n - 1][1] + (ty / tl * Math.cos(a) + tx / tl * Math.sin(a)) * f]); }
    }
    this.pts = p; this.cum = [0];
    for (let i = 1; i < p.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
    this.len = this.cum[this.cum.length - 1] || .001; this.t0 = 1e9; this.t1 = 1e9;
  }
  at(L) { const c = this.cum, p = this.pts; L = clamp(L, 0, this.len); let lo = 0, hi = c.length - 1; if (!hi) return p[0];
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] < L) lo = m; else hi = m; }
    const u = (L - c[lo]) / ((c[hi] - c[lo]) || 1); return [lerp(p[lo][0], p[hi][0], u), lerp(p[lo][1], p[hi][1], u)]; }
  get ini() { return this.pts[0]; } get fin() { return this.pts[this.pts.length - 1]; }
  prog(t) { if (t <= this.t0) return 0; if (t >= this.t1) return 1; const u = (t - this.t0) / (this.t1 - this.t0); return u - Math.sin(2 * Math.PI * u) / (2 * Math.PI) * .8; }
  punto(u) { return this.at(this.len * (u - Math.sin(2 * Math.PI * u) / (2 * Math.PI) * .8)); }
}
// cinta de ancho variable: punta biselada (cambia con la dirección), presión al aterrizar y afinado al soltar
function cinta(g, s, L, k = 1, bisel = 2.35) {
  const p = s.pts, c = s.cum, n = c.length; if (L <= 0) return;
  let m = n; for (let i = 1; i < n; i++) if (c[i] > L) { m = i + 1; break; }
  const X = [], Y = [], Hh = [];
  for (let i = 0; i < m; i++) { if (i === m - 1 && c[Math.min(i, n - 1)] > L) { const q = s.at(L); X.push(q[0]); Y.push(q[1]); } else { X.push(p[i][0]); Y.push(p[i][1]); } }
  const w = s.w * k;
  if (m < 2 || s.len < s.w * 1.2) { const r = s.w * .6 * k; g.moveTo(X[0] + r, Y[0]); g.arc(X[0], Y[0], r, 0, Math.PI * 2); return; }
  const nx = [], ny = [];
  for (let i = 0; i < m; i++) {
    const a = Math.max(0, i - 1), b = Math.min(m - 1, i + 1), tx = X[b] - X[a], ty = Y[b] - Y[a], tl = Math.hypot(tx, ty) || 1, d = c[Math.min(i, n - 1)];
    const pr = Math.min(1, .72 + d / (s.w * 2.2)) * (1 - .12 * clamp((d - (s.len - s.w * 2)) / (s.w * 2)));
    Hh.push(w * .5 * (.8 + .2 * Math.abs(Math.sin(Math.atan2(ty, tx) - bisel))) * pr); nx.push(-ty / tl); ny.push(tx / tl);
  }
  g.moveTo(X[0] + nx[0] * Hh[0], Y[0] + ny[0] * Hh[0]);
  for (let i = 1; i < m; i++) g.lineTo(X[i] + nx[i] * Hh[i], Y[i] + ny[i] * Hh[i]);
  const ae = Math.atan2(ny[m - 1], nx[m - 1]); g.arc(X[m - 1], Y[m - 1], Hh[m - 1], ae, ae - Math.PI, true);
  for (let i = m - 2; i >= 0; i--) g.lineTo(X[i] - nx[i] * Hh[i], Y[i] - ny[i] * Hh[i]);
  const as = Math.atan2(-ny[0], -nx[0]); g.arc(X[0], Y[0], Hh[0], as, as - Math.PI, true); g.closePath();
}
function pintarTrazo(g, s, t, o = {}) {
  const u = o.p ?? s.prog(t); if (u <= 0) return;
  g.save(); g.globalAlpha = (o.alpha ?? s.alpha); g.fillStyle = o.col || s.col; g.beginPath(); cinta(g, s, u * s.len, o.k ?? 1, o.bisel); g.fill();
  if (s.len > 30 && o.gota !== false) { g.globalAlpha = .3; g.beginPath(); const [x, y] = s.at(s.w * .5); g.arc(x, y, s.w * .33, 0, Math.PI * 2); g.fill(); }   // la tinta se junta donde aterrizó la punta
  g.restore();
}
const tLinea = (x0, y0, x1, y1, o = {}) => { const d = Math.hypot(x1 - x0, y1 - y0) || 1, bow = (o.comba ?? .012) * d * (hash2(_SEM * 17 | 0, 5) - .5) * 2;
  return new Trazo([[x0, y0], [(x0 + x1) / 2 - (y1 - y0) / d * bow, (y0 + y1) / 2 + (x1 - x0) / d * bow], [x1, y1]], { suave: 2, ...o }); };
const tCurva = (pts, o = {}) => new Trazo(pts, { suave: 3, ...o });
function tArco(cx, cy, r, a0, a1, o = {}) { const ry = o.ry ?? r, n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * Math.max(r, ry) / 10)), p = [];
  for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * ry]); } return new Trazo(p, { onda: 300, ...o }); }
const tCirculo = (cx, cy, r, o = {}) => { const a0 = o.a0 ?? -2.2; return tArco(cx, cy, r, a0, a0 + (o.dir ?? 1) * (Math.PI * 2 + (o.vuelta ?? .22)), o); };
function tCaja(x, y, w, h, o = {}) { const e = o.sobre ?? 6; return [tLinea(x - e, y, x + w + e, y, o), tLinea(x + w, y - e, x + w, y + h + e, o), tLinea(x + w + e, y + h, x - e, y + h, o), tLinea(x, y + h + e, x, y - e, o)]; }
function tFlecha(x0, y0, x1, y1, o = {}) {
  const sh = o.curva ? tCurva([[x0, y0], o.curva, [x1, y1]], o) : tLinea(x0, y0, x1, y1, o);
  const [ex, ey] = sh.fin, [px, py] = sh.at(sh.len - 30), a = Math.atan2(ey - py, ex - px), hl = o.cabeza ?? 34;
  return [sh, tLinea(ex + Math.cos(a + 2.6) * hl, ey + Math.sin(a + 2.6) * hl, ex, ey, { ...o, comba: 0 }), tLinea(ex, ey, ex + Math.cos(a - 2.6) * hl, ey + Math.sin(a - 2.6) * hl, { ...o, comba: 0 })];
}
const tPalomita = (cx, cy, r, o = {}) => new Trazo([[cx - r, cy], [cx - r * .3, cy + r * .7], [cx + r, cy - r * .8]], { temblor: .5, ...o });

// ---------- agenda: el tiempo se resuelve para terminar justo a tiempo ----------
// items: trazos o letras (con .len). Reparte [t0, t1] según el largo; los saltos entre items son cortos.
function agendar(items, t0, t1, hueco = .04) {
  const L = items.reduce((a, s) => a + s.len, 0), H = hueco * Math.max(0, items.length - 1), libre = Math.max(.05, t1 - t0 - H);
  let t = t0; for (const s of items) { s.t0 = t; s.t1 = t + s.len / L * libre; t = s.t1 + hueco; }
  return t1;
}

// ---------- escritura con letra del sistema, letra por letra ----------
// Cada letra se mueve un poco (giro, base, escala) como en la mano; se destapa en orden de escritura.
function letras(txt, x, y, font, o = {}) {
  const r = rng(o.semilla ?? 7), size = parseFloat(font.match(/([\d.]+)px/)[1]), out = [];
  const total = medir(txt, font), x0 = o.centro ? x - total / 2 : x;
  let acc = 0;
  for (const ch of txt) {
    const w = medir(ch, font);
    if (ch.trim()) out.push({ ch, x: x0 + acc, y: y + (r() - .5) * size * (o.base ?? .05), w, size, font, col: o.col || '#23262c',
      rot: (r() - .5) * (o.giro ?? .06), grosor: o.grosor || 0, esc: 1 + (r() - .5) * (o.escala ?? .05), len: Math.max(w, size * .35) });
    acc += w * (o.espacio ?? 1);
  }
  out.ancho = total; out.x0 = x0; out.y = y; out.size = size;
  return out;
}
function pintarLetra(g, L, t, o = {}) {
  const u = o.p ?? (t <= L.t0 ? 0 : t >= L.t1 ? 1 : ease((t - L.t0) / (L.t1 - L.t0))); if (u <= 0) return;
  g.save(); g.translate(L.x + L.w / 2, L.y); g.rotate(L.rot); g.scale(L.esc, L.esc);
  if (u < 1) { const pad = L.size * .25; g.beginPath(); g.rect(-L.w / 2 - pad, -L.size * 1.2, (L.w + pad * 2) * u, L.size * 1.7);
    g.arc(-L.w / 2 - pad + (L.w + pad * 2) * u, L.y * 0 - L.size * .35, L.size * .3, 0, Math.PI * 2); g.clip(); }   // borde delantero redondo
  g.font = L.font; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = o.col || L.col; g.globalAlpha = o.alpha ?? 1;
  g.fillText(L.ch, 0, 0);
  if (L.grosor) { g.strokeStyle = o.col || L.col; g.lineWidth = L.grosor; g.lineJoin = 'round'; g.strokeText(L.ch, 0, 0); }
  g.restore();
}
function puntaLetra(L, u) { const e = ease(u); return [L.x + L.w * e, L.y - L.size * (.38 + .22 * Math.sin(e * Math.PI * 3 + L.x * .01))]; }

// ---------- la herramienta flota sola: salta entre trazos y se estaciona fuera del cuadro ----------
// trabajos: [{t0, t1, at(u) → [x,y]}] ordenados. park(t) → [x,y] fuera del cuadro (en mundo).
function poseHerramienta(trab, t, park, o = {}) {
  const IN = o.entra ?? .42, OUT = o.sale ?? .38, LARGO = o.largo ?? .75;
  if (!trab.length) return null;
  let i = trab.findIndex(s => s.t1 >= t);
  if (i >= 0 && t >= trab[i].t0) { const s = trab[i]; return { x: s.at(clamp((t - s.t0) / (s.t1 - s.t0)))[0], y: s.at(clamp((t - s.t0) / (s.t1 - s.t0)))[1], alza: 0, toca: true }; }
  const a = i < 0 ? trab[trab.length - 1] : (i > 0 ? trab[i - 1] : null), b = i < 0 ? null : trab[i];
  const gap = a && b ? b.t0 - a.t1 : 1e9;
  if (a && b && gap < LARGO) { const u = clamp((t - a.t1) / gap), e = u * u * (3 - 2 * u), [ax, ay] = a.at(1), [bx, by] = b.at(0);
    return { x: lerp(ax, bx, e), y: lerp(ay, by, e), alza: Math.sin(Math.PI * u) * Math.min(1, Math.hypot(bx - ax, by - ay) / 220 + .25), toca: false }; }
  if (a && t - a.t1 < OUT) { const u = (t - a.t1) / OUT, e = u * u, [ax, ay] = a.at(1), [px, py] = park(t); return { x: lerp(ax, px, e), y: lerp(ay, py, e), alza: Math.min(1, u * 3), toca: false }; }
  if (b && b.t0 - t < IN) { const u = 1 - (b.t0 - t) / IN, e = 1 - (1 - u) ** 3, [bx, by] = b.at(0), [px, py] = park(t); return { x: lerp(px, bx, e), y: lerp(py, by, e), alza: Math.min(1, (1 - u) * 2.2), toca: false }; }
  return null;
}
// convierte trazos y letras agendados en trabajos de la herramienta
function trabajosDe(lista) { return lista.filter(s => s.t1 < 1e8).map(s => ({ t0: s.t0, t1: s.t1, at: s.pts ? (u => s.punto(u)) : (u => puntaLetra(s, u)) })).sort((a, b) => a.t0 - b.t0); }

// ---------- texturas ----------
function tileSeco(semilla = 7) {
  const c = capa(512, 512), g = c.getContext('2d'), r = rng(semilla);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(0,0,0,${r() * .35})`; g.beginPath(); g.arc(r() * 512, r() * 512, r() * 1.6 + .3, 0, 6.283); g.fill(); }
  g.lineCap = 'round';
  for (let i = 0; i < 300; i++) { g.strokeStyle = `rgba(0,0,0,${r() * .25})`; g.lineWidth = r() * 1.4 + .4; const x = r() * 512, y = r() * 512, a = (r() - .5) * .5, l = 20 + r() * 70;
    for (const ox of [-512, 0, 512]) { g.beginPath(); g.moveTo(x + ox, y); g.lineTo(x + ox + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } }
  return c;
}
function tileGrano(semilla = 3, tam = 256, n = 9000, osc = 'rgba(0,0,0,', cla = 'rgba(255,255,255,') {
  const c = capa(tam, tam), g = c.getContext('2d'), r = rng(semilla);
  for (let i = 0; i < n; i++) { g.fillStyle = (r() < .55 ? osc : cla) + (.2 + r() * .6) + ')'; g.fillRect(r() * tam, r() * tam, 1 + r() * 1.6, 1 + r() * 1.6); }
  return c;
}
// grano de pizarra: hoyitos que NO toman la tiza (se usa con destination-out sobre la capa de tiza)
function granoPizarra(semilla = 5) {
  const c = capa(384, 384), g = c.getContext('2d'), r = rng(semilla);
  for (let i = 0; i < 14000; i++) { const a = r(); g.fillStyle = `rgba(0,0,0,${a < .6 ? .25 + r() * .5 : .9})`; g.fillRect(r() * 384, r() * 384, 1 + r() * 1.8, 1 + r() * 1.2); }
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.1;
  for (let i = 0; i < 380; i++) { const x = r() * 384, y = r() * 384; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6 + r() * 6, y - 3 - r() * 3); g.stroke(); }
  return c;
}

// ---------- objetos físicos (sin mano: flotan solos) ----------
function _rgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
// plumón de pizarra: punta de fieltro, cuerpo blanco, banda y tapa del color de su tinta. La sombra crece y se corre al alzarse.
function plumon(sx, sy, alza, col, o = {}) {
  const z = o.z ?? 1, L = (o.largo ?? 360) * z, ang = (o.ang ?? -0.95) - alza * .06, ca = Math.cos(ang), sa = Math.sin(ang), up = alza * 26 * z;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.save(); ctx.filter = `blur(${(6 + alza * 10) * z}px)`; ctx.fillStyle = `rgba(40,40,50,${.28 - alza * .08})`;
  ctx.translate(sx + up * .9 + 6 * z, sy + up * 1.2 + 8 * z); ctx.transform(ca * 1.06, sa * .85 + .22, -sa, ca, 0, 0);
  ctx.beginPath(); ctx.roundRect(4 * z, -L * .06, L, L * .12, L * .05); ctx.fill(); ctx.restore();
  ctx.translate(sx - up * .15, sy - up); ctx.rotate(ang); const s = L / 430; ctx.scale(s, s);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-2, -5); ctx.quadraticCurveTo(-8, 0, -2, 5); ctx.lineTo(20, 9); ctx.lineTo(20, -9); ctx.closePath(); ctx.fill();
  const g1 = ctx.createLinearGradient(0, -22, 0, 22); g1.addColorStop(0, '#dfe2e6'); g1.addColorStop(.35, '#ffffff'); g1.addColorStop(1, '#8b9099');
  ctx.fillStyle = g1; ctx.beginPath(); ctx.moveTo(20, -10); ctx.lineTo(50, -24); ctx.lineTo(50, 24); ctx.lineTo(20, 10); ctx.closePath(); ctx.fill();
  const g2 = ctx.createLinearGradient(0, -26, 0, 26); g2.addColorStop(0, '#e6e8eb'); g2.addColorStop(.3, '#ffffff'); g2.addColorStop(.62, '#e9ebee'); g2.addColorStop(1, '#9ea3ab');
  ctx.fillStyle = g2; ctx.beginPath(); ctx.roundRect(48, -26, 300, 52, 6); ctx.fill();
  const [r, g, b] = _rgb(col), f = (k) => `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`;
  const g3 = ctx.createLinearGradient(0, -26, 0, 26); g3.addColorStop(0, f(.8)); g3.addColorStop(.3, f(1.25)); g3.addColorStop(1, f(.55));
  ctx.fillStyle = g3; ctx.fillRect(150, -26, 110, 52);
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(166, -6, 78, 5); ctx.fillRect(166, 4, 50, 3);
  ctx.fillStyle = g3; ctx.beginPath(); ctx.roundRect(338, -29, 92, 58, 12); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(338, -29, 6, 58); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(350, -22, 70, 6);
  ctx.restore();
}
function borrador(sx, sy, alza, ancho = 150, acento = '#d97757') {
  const w = ancho * 1.9, h = ancho, up = alza * 30;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.save(); ctx.filter = `blur(${8 + alza * 12}px)`; ctx.fillStyle = `rgba(40,40,50,${.3 - alza * .1})`;
  ctx.beginPath(); ctx.roundRect(sx - w / 2 + 10 + up, sy - h / 2 + 16 + up, w, h, 14); ctx.fill(); ctx.restore();
  ctx.translate(sx, sy - up); ctx.rotate(-.08);
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#4a4f58'); g.addColorStop(.5, '#2e3239'); g.addColorStop(1, '#1d2025');
  ctx.fillStyle = '#c9c4ba'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2 + h * .72, w, h * .3, 8); ctx.fill();
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h * .78, 14); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 12, -h / 2 + 8, w - 24, h * .16, 8); ctx.fill();
  ctx.fillStyle = acento; ctx.globalAlpha = .9; ctx.fillRect(-w * .18, -h * .12, w * .36, h * .2);
  ctx.restore();
}
function iman(sx, sy, alza, r = 44, col = '#d97757') {
  const up = alza * 110, sc = 1 + alza * .7;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.save(); ctx.filter = `blur(${5 + alza * 22}px)`; ctx.fillStyle = `rgba(60,30,20,${.4 - alza * .2})`;
  ctx.beginPath(); ctx.ellipse(sx + 7 + up * .7, sy + 10 + up * .9, r * sc * 1.02, r * sc * .98, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.translate(sx, sy - up * .3); ctx.scale(sc, sc);
  const [cr, cg, cb] = _rgb(col);
  const g = ctx.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r * 1.05);
  g.addColorStop(0, `rgb(${Math.min(255, cr + 70)},${Math.min(255, cg + 70)},${Math.min(255, cb + 70)})`); g.addColorStop(.5, col); g.addColorStop(1, `rgb(${cr * .6 | 0},${cg * .6 | 0},${cb * .6 | 0})`);
  ctx.fillStyle = `rgb(${cr * .5 | 0},${cg * .5 | 0},${cb * .5 | 0})`; ctx.beginPath(); ctx.arc(0, 4, r, 0, Math.PI * 2); ctx.fill();    // canto
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(-r * .38, -r * .45, r * .3, r * .14, -.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---------- tiza: la pizarra decide qué granos toman la tiza ----------
//   granoTiza(semilla, tam)  → máscara de valles (alfa = cuánto NO toma la tiza); se aplica con destination-out
//   polvoAlSoltar(g, x, y, semilla, n, col) → 2 a 5 granitos donde la tiza se levanta (quietos, sobre la pizarra)
function granoTiza(semilla = 5, tam = 512, umbral = .5) {
  const c = capa(tam, tam), g = c.getContext('2d'), img = g.createImageData(tam, tam), d = img.data;
  const per = (x, y, s) => vnoise((x % tam) / s + semilla * 13, (y % tam) / s);
  for (let y = 0; y < tam; y++) for (let x = 0; x < tam; x++) {
    const v = .45 * hash2(x + semilla * 977, y) + .3 * per(x, y, 2.2) + .25 * per(x, y, 7);
    const a = clamp((umbral - v) / .12); const k = 4 * (y * tam + x); d[k + 3] = Math.round(a * 235);
  }
  g.putImageData(img, 0, 0); return c;
}
function polvoAlSoltar(g, x, y, semilla, n = 4, col = '#eeeadf') {
  g.save(); g.fillStyle = col;
  for (let i = 0; i < n; i++) { g.globalAlpha = .35 + hash2(semilla, i) * .4; const s = 1.5 + hash2(i, semilla) * 2.5;
    g.fillRect(x + (hash2(semilla + 3, i) - .3) * 26, y + 6 + hash2(i + 9, semilla) * 22, s, s); }
  g.restore();
}

// ---------- crayón de cera (cine-crayon-book) ----------
//   PASO_CERA: el dibujo hierve a 12 cuadros por segundo (cambia la semilla, no se mueve de lugar)
//   ceraLinea(g, pts, o)   → cinta de cera con pulso, ancho ±15 %, puntas afinadas, núcleo más denso y 1–2 vetas
//                            o: { col, w, p (presión 0–1), semilla, dibuja (0→1), hierve (amplitud) }
//   rayado(poly, o)        → zigzag de ida y vuelta (con hueco) dentro de un polígono, pasándose un poco del borde
//   diente(semilla)        → mosaico del diente del papel (la cera solo se pega a las crestas): destination-out
let PASO_CERA = 0;
function _rem(p, paso) { const o = [p[0]], L = [0]; let tot = 0;
  for (let i = 1; i < p.length; i++) { const [ax, ay] = p[i - 1], [bx, by] = p[i], d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d / paso));
    for (let k = 1; k <= n; k++) { o.push([lerp(ax, bx, k / n), lerp(ay, by, k / n)]); tot += d / n; L.push(tot); } }
  return { p: o, L, tot }; }
function ceraLinea(g, pts, o = {}) {
  const dib = o.dibuja ?? 1; if (dib <= 0 || pts.length < 2) return;
  const col = o.col || '#2d3263', w = o.w ?? 9, pr = o.p ?? .85, sm = o.semilla ?? 1, hv = o.hierve ?? 1, R = _rem(pts, 3), lim = R.tot * dib;
  const st = PASO_CERA, jx = (hash2(sm * 31 | 0, st) - .5) * 1.6 * hv, jy = (hash2(st, sm * 17 | 0) - .5) * 1.6 * hv, tl = Math.min(R.tot * .25, 28);
  const P = [], Wd = [];
  for (let i = 0; i < R.p.length; i++) { const s = R.L[i]; if (s > lim) break;
    const a = R.p[Math.max(0, i - 1)], b = R.p[Math.min(R.p.length - 1, i + 1)], tn = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / tn, ty = (b[1] - a[1]) / tn;
    const off = (vnoise(s / 85 + sm * 17.3, 2) * 2 - 1) * 1.7 + (vnoise(s / 38 + sm + st * 1.37, 7) * 2 - 1) * .9 * hv;
    P.push([R.p[i][0] - ty * off + jx, R.p[i][1] + tx * off + jy, -ty, tx]);
    Wd.push(w * (.82 + .3 * (vnoise(s / 55 + sm * 3, 9) * 2 - 1)) * (.45 + .55 * Math.min(clamp(s / (tl + .001)), clamp((Math.min(lim, R.tot) - s) / (tl + .001))))); }
  if (P.length < 2) return;
  const banda = (k, dx = 0) => { g.beginPath(); P.forEach((q, i) => g.lineTo(q[0] + q[2] * (Wd[i] * k + dx), q[1] + q[3] * (Wd[i] * k + dx)));
    for (let i = P.length - 1; i >= 0; i--) g.lineTo(P[i][0] - P[i][2] * (Wd[i] * k - dx), P[i][1] - P[i][3] * (Wd[i] * k - dx)); g.closePath(); };
  g.save(); g.fillStyle = col; g.globalAlpha = pr * .55; banda(.5); g.fill(); g.globalAlpha = pr * .4; banda(.25); g.fill();
  g.globalAlpha = pr * .35; banda(.08, Wd[0] * .28); g.fill(); banda(.06, -Wd[0] * .22); g.fill(); g.restore();   // vetas
}
function rayado(poly, o = {}) {
  const ang = o.angulo ?? -.8, sp = o.paso ?? 22, sobre = o.sobre ?? 6, ca = Math.cos(ang), sa = Math.sin(ang);
  const P = poly.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]), v0 = Math.min(...P.map(p => p[1])), v1 = Math.max(...P.map(p => p[1])), out = [];
  let flip = 0;
  for (let v = v0 + sp * .5; v < v1; v += sp) { const xs = [];
    for (let i = 0; i < P.length; i++) { const [ax, ay] = P[i], [bx, by] = P[(i + 1) % P.length]; if ((ay - v) * (by - v) < 0) xs.push(ax + (v - ay) / (by - ay) * (bx - ax)); }
    if (xs.length < 2) continue; xs.sort((a, b) => a - b);
    const a = xs[0] - sobre, b = xs[xs.length - 1] + sobre, seg = flip ? [b, a] : [a, b]; flip ^= 1;
    for (const u of seg) out.push([u * ca - v * sa, u * sa + v * ca]); }
  return out;
}
function diente(semilla = 9, tam = 512, umbral = .42) {   // diente del papel: tres octavas + fibra horizontal
  const c = capa(tam, tam), g = c.getContext('2d'), img = g.createImageData(tam, tam), d = img.data;
  const per = (x, y, s, k) => { const a = vnoise(x / s + k, y / s), b = vnoise((x - tam) / s + k, y / s), c2 = vnoise(x / s + k, (y - tam) / s), e = vnoise((x - tam) / s + k, (y - tam) / s), u = x / tam, v = y / tam;
    return lerp(lerp(a, b, u), lerp(c2, e, u), v); };
  for (let y = 0; y < tam; y++) for (let x = 0; x < tam; x++) {
    const v = .38 * hash2(x + semilla * 911, y + 3) + .32 * per(x, y, 2.5, semilla) + .2 * per(x, y, 9, semilla + 4) + .1 * per(x, y * 4, 30, semilla + 8);
    d[4 * (y * tam + x) + 3] = Math.round(clamp((umbral - v) / .1) * 240); }
  g.putImageData(img, 0, 0); return c;
}

// ---------- pincelada de acuarela (cine-watercolor, cine-urban-sketch) ----------
//   pincelada(pts, w, col, o)    → cinta de ancho con perfil ('pincel' | 'hoja' | 'parejo' | 'punta' | 'tronco') ±22 % de aspereza,
//                                  lavado fino + 3–9 cerdas que se cortan en guiones (el blanco que vuela) y terminan antes
//   pintarPincelada(g, s, p, am) → la pinta hasta la fracción p de su largo (la punta del pincel avanza)
//   lavadoPoly(g, poly, col, a, semilla) → la misma forma en 3 pasadas movidas: la orilla se oscurece donde no coinciden
//   colorA(hex, a)               → 'rgba(...)'
function colorA(h, a) { const [r, g, b] = _rgb(h); return `rgba(${r},${g},${b},${a})`; }
function pincelada(pts0, w, col, o = {}) {
  const pts = o.suave === false ? pts0 : (() => { const R = _rem(pts0.length > 2 ? _chaikin(pts0, 2) : pts0, Math.max(3, w * .35)); return R.p; })();
  const r = rng(o.semilla ?? (_SEM += 3.1) * 1000 | 0), n = pts.length, ws = [], nx = [], ny = [], rough = o.aspero ?? .22, prof = o.perfil || 'pincel', s0 = r() * 1000;
  for (let i = 0; i < n; i++) { const s = i / Math.max(1, n - 1); let f;
    if (prof === 'hoja') f = Math.pow(Math.sin(Math.PI * (s * .94 + .03)), .7);
    else if (prof === 'parejo') f = Math.min(1, s / .06 + .35) * Math.min(1, (1 - s) / .08 + .4);
    else if (prof === 'punta') f = Math.pow(1 - s * .92, .85) * Math.min(1, s / .05 + .6);
    else if (prof === 'tronco') f = (1 - s * .62) * (1 + Math.max(0, .06 - s) * 9);
    else f = Math.min(1, s / .1 + .3) * Math.pow(1 - s * .85, .6);
    ws.push(Math.max(.5, w * f * (1 + rough * (vnoise(s0 + i * .9, 1) * 2 - 1))));
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; nx.push(-dy / L); ny.push(dx / L); }
  const nb = o.cerdas ?? (w >= 6 ? Math.min(9, Math.max(3, Math.round(w / 3.2))) : 0), br = [];
  for (let j = 0; j < nb; j++) { const dash = []; for (let k = 0; k < 6; k++) dash.push(k % 2 ? 1 + r() * (w * .5 + 2) : 18 + r() * 72);
    br.push({ off: -.46 + r() * .92, bw: Math.max(.7, w / nb * (.6 + r() * .7)), a: .3 + r() * .55, fin: .72 + r() * .28, dash }); }
  return { pts, ws, nx, ny, col, a: o.alpha ?? .92, rib: o.cuerpo ?? (nb ? .6 : .92), br };
}
function pintarPincelada(g, s, p = 1, am = 1, col = null) {
  if (p <= 0) return; const P = s.pts, n = P.length, m = (n - 1) * clamp(p), k = Math.floor(m), f = m - k, cc = col || s.col, cnt = f > .001 && k < n - 1 ? k + 2 : k + 1;
  const X = i => i <= k ? P[i][0] : lerp(P[k][0], P[k + 1][0], f), Y = i => i <= k ? P[i][1] : lerp(P[k][1], P[k + 1][1], f);
  g.save(); g.beginPath();
  for (let i = 0; i < cnt; i++) { const j = Math.min(i, n - 1), hw = s.ws[j] / 2 * (p < 1 && i === cnt - 1 ? .5 : 1); g.lineTo(X(i) + s.nx[j] * hw, Y(i) + s.ny[j] * hw); }
  for (let i = cnt - 1; i >= 0; i--) { const j = Math.min(i, n - 1), hw = s.ws[j] / 2 * (p < 1 && i === cnt - 1 ? .5 : 1); g.lineTo(X(i) - s.nx[j] * hw, Y(i) - s.ny[j] * hw); }
  g.closePath(); g.fillStyle = colorA(cc, s.a * s.rib * am); g.fill();
  g.lineCap = g.lineJoin = 'round';
  for (const b of s.br) { const e = Math.min(m, (n - 1) * b.fin), kk = Math.floor(e); if (kk < 1) continue;
    g.beginPath(); for (let i = 0; i <= kk; i++) { const hw = s.ws[i] * b.off; g.lineTo(P[i][0] + s.nx[i] * hw, P[i][1] + s.ny[i] * hw); }
    g.setLineDash(b.dash); g.lineWidth = b.bw; g.strokeStyle = colorA(cc, s.a * b.a * am); g.stroke(); }
  g.setLineDash([]); g.restore();
}
function lavadoPoly(g, poly, col, a = .5, semilla = 1, amp = 6) {
  g.save(); g.fillStyle = colorA(col, a / 3);
  for (let k = 0; k < 3; k++) { g.beginPath(); poly.forEach(([x, y], i) => g.lineTo(x + (hash2(i, semilla * 7 + k) - .5) * 2 * amp, y + (hash2(semilla * 5 + k, i) - .5) * 2 * amp)); g.closePath(); g.fill(); }
  g.restore();
}
// papel de acuarela: base tibia, tres octavas suaves ±3,5 %, miles de fibras cortas curvas, grano fino, viñeta ligera
function papelAcuarela(color = '#f3ead8', semilla = 12) {
  const c = capa(), p = c.getContext('2d'), r = rng(semilla); p.fillStyle = color; p.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 6) for (let x = 0; x < W; x += 6) { const n = vnoise(x * .003, y * .003) * .5 + vnoise(x * .012 + 3, y * .012) * .3 + vnoise(x * .05, y * .05 + 9) * .2;
    p.fillStyle = n > .5 ? `rgba(255,255,250,${(n - .5) * .14})` : `rgba(110,85,50,${(.5 - n) * .14})`; p.fillRect(x, y, 6, 6); }
  for (let i = 0; i < 3500; i++) { const x = r() * W, y = r() * H, a = r() * 6.28, l = 4 + r() * 14; p.strokeStyle = r() < .6 ? 'rgba(120,95,60,.07)' : 'rgba(255,255,255,.12)'; p.lineWidth = .8;
    p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(x + Math.cos(a + .6) * l / 2, y + Math.sin(a + .6) * l / 2, x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke(); }
  for (let i = 0; i < W * H / 18; i++) { p.fillStyle = r() < .5 ? 'rgba(80,60,40,.04)' : 'rgba(255,255,255,.06)'; p.fillRect(r() * W, r() * H, 1.2, 1.2); }
  const g = p.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,60,30,.12)'); p.fillStyle = g; p.fillRect(0, 0, W, H);
  return c;
}

// ---------- tinta china (cine-ink-wash) ----------
//   papelArroz(color, semilla, w, h) → papel de arroz: moteado de nubes, fibras largas, motas de pulpa, viñeta
//   masaTinta(g, poly, a0, a1, y0, y1, semilla) → masa suave (nunca relleno plano): borde movido, degradado vertical,
//                                                halo mojado que sangra y pigmento acumulado en la orilla
const TONOS = { jiao: .96, nong: .82, zhong: .6, dan: .34, qing: .16 };   // los cinco tonos de la tinta
function papelArroz(color = '#f2ecde', semilla = 3, w = W, h = H) {
  const c = capa(w, h), p = c.getContext('2d'), r = rng(semilla); p.fillStyle = color; p.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { const n = vnoise(x * .0025, y * .0025) * .6 + vnoise(x * .01 + 7, y * .01) * .4;
    p.fillStyle = n > .5 ? `rgba(255,252,240,${(n - .5) * .12})` : `rgba(120,100,70,${(.5 - n) * .1})`; p.fillRect(x, y, 8, 8); }
  p.lineCap = 'round';
  for (let i = 0; i < w * h / 900; i++) { const x = r() * w, y = r() * h, a = r() * 6.28, l = 20 + r() * 70; p.strokeStyle = r() < .5 ? 'rgba(150,130,100,.07)' : 'rgba(255,255,250,.14)'; p.lineWidth = .7 + r() * .6;
    p.beginPath(); p.moveTo(x, y); p.bezierCurveTo(x + Math.cos(a) * l * .3 + 6, y + Math.sin(a) * l * .3, x + Math.cos(a) * l * .7 - 6, y + Math.sin(a) * l * .7, x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke(); }
  for (let i = 0; i < w * h / 4000; i++) { p.fillStyle = `rgba(110,90,60,${.08 + r() * .12})`; p.beginPath(); p.ellipse(r() * w, r() * h, .8 + r() * 2, .6 + r() * 1.2, r() * 3, 0, 6.29); p.fill(); }
  const g = p.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .4, w / 2, h / 2, Math.max(w, h) * .7); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,70,40,.12)'); p.fillStyle = g; p.fillRect(0, 0, w, h);
  return c;
}
function masaTinta(g, poly, a0, a1, y0, y1, semilla = 1, tinta = '#1e1a16') {
  const P = poly.map(([x, y], i) => [x + (vnoise(i * .7, semilla) - .5) * 10, y + (vnoise(semilla, i * .7) - .5) * 10]);
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, colorA(tinta, a0)); gr.addColorStop(1, colorA(tinta, a1));
  const camino = () => { g.beginPath(); P.forEach(q => g.lineTo(...q)); g.closePath(); };
  g.save(); g.filter = 'blur(7px)'; g.globalAlpha = .5; camino(); g.fillStyle = gr; g.fill(); g.restore();       // sangra en el papel
  g.save(); camino(); g.fillStyle = gr; g.fill(); g.clip(); g.lineWidth = 10; g.globalAlpha = .45; g.strokeStyle = gr; g.filter = 'blur(3px)'; camino(); g.stroke(); g.restore();   // orilla (se funde con la masa)
}

// ---------- óleo con espátula (cine-impasto) ----------
//   trazosEspatula(formas, o) → por cada forma (polígono con color), trazos de espátula de grueso a fino, confinados a la forma
//        forma: { pts, col, col2, r (radio grande), dir (ángulo), detalle (radio en la orilla) }
//   espatula(g, s, col, col2)  → un plano inclinado de pintura: extremos sesgados, arrastre de un 2.º color, pintura que se acaba
//   luzEspatula(g, s, k)       → la cresta donde apretó la hoja, el labio donde se levantó y el lado iluminado (luz rasante)
//   grisDe(hex)                → luminancia un poco fría con un resto de color (la versión gris de cada trazo)
function _mezcla(h, k) { const [r, g, b] = _rgb(h); const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
function grisDe(h) { const [r, g, b] = _rgb(h), y = lerp(128, r * .3 + g * .59 + b * .11, .92), m = (c, t) => Math.round(lerp(y * t, c, .06));
  return '#' + [m(r, .97), m(g, 1), m(b, 1.06)].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join(''); }
function trazosEspatula(formas, o = {}) {
  const g = capa(4, 4).getContext('2d'), out = [];
  formas.forEach((F, fi) => {
    const r = rng(fi * 97 + (o.semilla || 1)), P = new Path2D(); F.pts.forEach((q, i) => i ? P.lineTo(...q) : P.moveTo(...q)); P.closePath(); F.camino = P;
    const xs = F.pts.map(p => p[0]), ys = F.pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const capaTrazos = (R, soloOrilla) => { const paso = R * 1.05;
      for (let y = y0 + paso * .4; y < y1 + paso * .3; y += paso * .8) for (let x = x0 + paso * .4; x < x1 + paso * .3; x += paso) {
        const px = x + (r() - .5) * paso * .8, py = y + (r() - .5) * paso * .6; if (!g.isPointInPath(P, px, py)) continue;
        if (soloOrilla && [[R, 0], [-R, 0], [0, R], [0, -R]].every(([dx, dy]) => g.isPointInPath(P, px + dx, py + dy))) continue;
        const k = 1 + (r() - .5) * .12;
        out.push({ f: fi, x: px, y: py, ang: (F.dir ?? 0) + (r() - .5) * .45, len: R * (1.7 + r() * 1.4), wid: R * (.95 + r() * .5), k, k2: .9 + r() * .2, sesgo: (r() - .5) * 1.2, carga: .78 + r() * .5, s: r() * 1000 | 0 }); } };
    capaTrazos(F.r, false); if (F.detalle) capaTrazos(F.detalle, true);
  });
  return out;
}
function _formaEspatula(g, s) {
  const L = s.len, w = s.wid / 2, sk = s.sesgo * w * .8, n = 6;
  g.beginPath(); g.moveTo(-L / 2 + sk, -w);
  for (let i = 1; i <= n; i++) { const u = i / n; g.lineTo(lerp(-L / 2 + sk, L / 2 + sk * .3, u), -w * (1 + (vnoise(u * 3 + s.s, 1) - .5) * .16)); }
  for (let i = 0; i <= 4; i++) { const v = i / 4; g.lineTo(L / 2 * (1 - (vnoise(v * 4, s.s + 3) * .22) * clamp(s.carga - .6)) + lerp(sk * .3, -sk * .3, v), lerp(-w, w, v)); }   // extremo donde se acaba
  for (let i = n; i >= 0; i--) { const u = i / n; g.lineTo(lerp(-L / 2 - sk, L / 2 - sk * .3, u), w * (1 + (vnoise(u * 3 + s.s, 5) - .5) * .16)); }
  g.closePath();
}
function espatula(g, s, col, col2) {
  g.save(); g.translate(s.x, s.y); g.rotate(s.ang); _formaEspatula(g, s);
  const gr = g.createLinearGradient(-s.len / 2, 0, s.len / 2, 0); gr.addColorStop(0, _mezcla(col, s.k)); gr.addColorStop(.45, _mezcla(col, s.k)); gr.addColorStop(1, _mezcla(col2 || col, s.k2));
  g.fillStyle = gr; g.fill(); g.restore();
}
function luzEspatula(g, s, k = 1, ang = -2.3) {
  g.save(); g.translate(s.x, s.y); g.rotate(s.ang); _formaEspatula(g, s); g.clip();
  k *= .35 + .65 * hash2(s.s, 41);                                                             // no todas las crestas agarran la luz igual
  const L = s.len, w = s.wid / 2, ld = Math.cos(ang - s.ang - Math.PI / 2) >= 0 ? -1 : 1;   // qué lado mira a la luz
  g.fillStyle = `rgba(255,246,225,${.11 * k})`; g.fillRect(-L / 2 - w, ld > 0 ? w * .72 : -w, L + 2 * w, w * .28);      // lado apretado contra la hoja (mira a la luz)
  g.fillStyle = `rgba(30,20,15,${.12 * k})`; g.fillRect(-L / 2 - w, ld > 0 ? -w : w * .78, L + 2 * w, w * .22);       // lado en sombra
  const xl = -L / 2 + L * Math.min(.95, s.carga);                                          // el labio donde se levantó
  g.fillStyle = `rgba(255,246,225,${.2 * k})`; g.fillRect(xl - 2.5, -w, 2.5, w * 2); g.fillStyle = `rgba(30,20,15,${.2 * k})`; g.fillRect(xl, -w, 2.5, w * 2);
  g.fillStyle = `rgba(30,20,15,${.1 * k})`; g.fillRect(-L / 2 - w, -w, w * .35 + 4, w * 2);   // montoncito al apoyar
  g.strokeStyle = `rgba(0,0,0,${.06 * k})`; g.lineWidth = 1;                                 // vetas de la pintura arrastrada
  for (let i = 0; i < 3; i++) { const yy = lerp(-w * .8, w * .8, hash2(s.s, i)); g.beginPath(); g.moveTo(-L / 2 + L * hash2(i, s.s) * .4, yy); g.lineTo(L / 2, yy + (hash2(s.s + 1, i) - .5) * 3); g.stroke(); }
  g.restore();
}
