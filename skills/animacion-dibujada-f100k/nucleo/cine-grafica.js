// ============================================================================
// cine-grafica.js · motor del grupo «Gráfica y tipografía» de animacion-dibujada-f100k
// Técnica adaptada de lemo-opuscar (MIT, © 2026 LemoLab).
//
// Lo usan: cine-swiss-motion, cine-spy-titles, cine-art-deco, cine-blueprint,
//          cine-stained-glass, cine-pictogram-motion, cine-ascii-crt.
// Va DESPUÉS de nucleo.js (usa ctx, W, H, rng, hash2, vnoise, clamp, lerp…).
//
// Exporta (globales):
//   color ........ hexRgb, mezcla(a, b, t), rgbaHex(hex, alfa), lienzo(w, h)
//   tipografía ... medirT(txt, font, tracking), maquetar(partes, caja, o), pintarPalabras(lay, t, tiempos, o)
//                  (la frase con tamaños distintos: la clave enorme y los conectores chicos; entran con corte seco)
//   papel cortado  tijera(pts, semilla, amp, paso), pieza(pts, col, o), letrasRecortadas(txt, font, col, o)
//   oro déco ..... ORO, degradeOro(...), lineaOro(pts, o), rayos(cx, cy, o), aerografo(pts, base, o), escalonPts(...)
//   plano ........ hojaCianotipo(w, h, o), lineaPlano(pts, o), rayado(pts, o), largo(pts)
//   vitral ....... vidrio(g, pts, col, semilla, o), plomo(g, pts, w), ojivaPts(x, y, w, h, n)
//   pictogramas .. patronReticula(tonos, celda, semilla, o), pintarFilas(pat, celda, offs, dy), barra, disco
//   terminal ..... coberturaGlifos(chars, font), rampaDensidad(chars, font), postCRT(src, t, o)
// Todo es determinista: nada de Math.random ni Date.
// ============================================================================

// ---------- color ----------
function hexRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function mezcla(a, b, t) { const A = hexRgb(a), B = hexRgb(b);
  return '#' + A.map((v, i) => Math.round(clamp(lerp(v, B[i], t), 0, 255)).toString(16).padStart(2, '0')).join(''); }
function rgbaHex(h, a) { const c = hexRgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function lienzo(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

// ---------- tipografía con tamaños distintos ----------
function medirT(txt, font, tracking = 0) {
  ctx.save(); ctx.font = font; ctx.letterSpacing = tracking ? tracking + 'px' : '0px';
  const w = ctx.measureText(txt).width; ctx.restore(); return w;
}
// partes: [{ t:'texto', tam: px (a escala 1), fam, peso, col, nueva:true (empieza renglón), track: em, clave:true }]
// caja: { x, y, w, h } · o.alinea 'izq' | 'centro' · o.interlinea · o.espacio (en em)
// Devuelve { palabras:[{ txt, x, y, font, col, size, track, parte, clave, i }], alto, escala, renglones }
// Busca la escala más grande (≤ 1) con la que TODO cabe en la caja (ancho y alto).
function maquetar(partes, caja, o = {}) {
  const { alinea = 'izq', interlinea = 1.0, espacio = .26, minEscala = .25, vertical = 'arriba' } = o;
  const pals = [];
  partes.forEach((p, pi) => p.t.trim().split(/[ \t\n]+/).forEach((w, k) => pals.push({ ...p, txt: w, parte: pi, nueva: p.nueva && k === 0 })));
  const flujo = s => {
    const rs = []; let cur = null;
    for (const p of pals) {
      const size = p.tam * s, font = `${p.peso || 700} ${size}px ${p.fam}`, tr = (p.track || 0) * size;
      const ww = medirT(p.txt, font, tr) - tr, gap = size * espacio;
      if (!cur || p.nueva || (cur.items.length && cur.w + gap + ww > caja.w)) { cur = { items: [], w: 0, alto: 0 }; rs.push(cur); }
      cur.w += (cur.items.length ? gap : 0); cur.items.push({ p, size, font, tr, ww, dx: cur.w }); cur.w += ww;
      cur.alto = Math.max(cur.alto, size);
    }
    const alto = rs.reduce((a, r) => a + r.alto * interlinea, 0);
    return { rs, alto, ok: alto <= caja.h && rs.every(r => r.w <= caja.w + .5) };
  };
  let lo = minEscala, hi = 1, F = flujo(1);
  if (!F.ok) { for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (flujo(m).ok) lo = m; else hi = m; } F = flujo(lo);
    if (!F.ok) console.error(`[maquetar] «${partes.map(p => p.t).join(' ')}» no cabe en su caja: acorta la frase.`); }
  const escala = F.ok && hi === 1 ? 1 : lo;
  let y = caja.y + (vertical === 'centro' ? (caja.h - F.alto) / 2 : vertical === 'abajo' ? caja.h - F.alto : 0);
  const palabras = []; let i = 0;
  for (const r of F.rs) {
    const base = y + r.alto * .8; const x0 = alinea === 'centro' ? caja.x + (caja.w - r.w) / 2 : alinea === 'der' ? caja.x + caja.w - r.w : caja.x;
    for (const it of r.items) palabras.push({ txt: it.p.txt, x: x0 + it.dx, y: base, font: it.font, col: it.p.col, size: it.size, track: it.tr,
      ancho: it.ww, parte: it.p.parte, clave: !!it.p.clave, i: i++ });
    y += r.alto * interlinea;
  }
  return { palabras, alto: F.alto, escala, renglones: F.rs.length, caja };
}
// Pinta cada palabra cuando le llega su tiempo: CORTE SECO (aparece entera en un cuadro, sin fundido ni rebote).
// tiempos: número (segundos entre palabras, desde o.t0) o arreglo con el segundo de cada palabra.
function pintarPalabras(lay, t, tiempos, o = {}) {
  const t0 = o.t0 || 0;
  for (const p of lay.palabras) {
    const tp = Array.isArray(tiempos) ? tiempos[p.i] : t0 + p.i * tiempos;
    if (t < tp) continue;
    ctx.save(); ctx.font = p.font; ctx.letterSpacing = p.track ? p.track + 'px' : '0px'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = (o.color && o.color(p)) || p.col; ctx.fillText(p.txt, p.x, p.y); ctx.restore();
  }
}

// ---------- papel cortado (60s spy) ----------
// Filo de tijera: se remuestrea el contorno y se corre por la normal con ruido de baja frecuencia + alguna mordida.
// Se corta UNA vez por pieza (caché por semilla): la pieza que se mueve conserva su filo, como un recorte real.
const _TIJERA = new Map();
function tijera(pts, semilla = 1, amp = 1.6, paso = 10, cerrado = true) {
  const k = semilla + '|' + amp + '|' + pts.length + '|' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
  if (_TIJERA.has(k)) return _TIJERA.get(k);
  const n = pts.length, out = []; let s = 0;
  for (let i = 0; i < (cerrado ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-6;
    const nx = -dy / L, ny = dx / L, m = Math.max(1, Math.round(L / paso));
    for (let j = 0; j < m; j++) { const u = j / m, ss = s + u * L, w = j === 0 ? .25 : 1;
      let d = (vnoise(ss / (paso * 2.3) + semilla * 17.13, 3.1) * 2 - 1) * amp * w + (vnoise(ss / (paso * .55) + semilla * 5.7, 8.2) * 2 - 1) * amp * .35 * w;
      if (hash2(Math.floor(ss / (paso * 3)), semilla * 91) > .965 && j > 0) d -= amp * 1.6;
      out.push([a[0] + dx * u + nx * d, a[1] + dy * u + ny * d]); }
    s += L;
  }
  if (!cerrado) out.push(pts[n - 1]);
  _TIJERA.set(k, out); return out;
}
function _poli(g, pts) { g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
// Pieza de papel: ranura de corte del color del fondo + sombra chica de papel. polys = uno o varios contornos (evenodd).
function pieza(polys, col, o = {}) {
  if (!Array.isArray(polys[0][0])) polys = [polys];
  const { fondo = null, ranura = 2.4, sombra = .3, g = ctx } = o;
  g.save(); g.beginPath(); for (const p of polys) _poli(g, p);
  if (fondo && ranura > 0) { g.lineJoin = 'round'; g.lineWidth = ranura * 2; g.strokeStyle = fondo; g.stroke(); }
  if (sombra) { g.shadowColor = `rgba(20,12,6,${sombra})`; g.shadowBlur = 5; g.shadowOffsetX = 2.5; g.shadowOffsetY = 3.5; }
  g.fillStyle = col; g.fill('evenodd'); g.restore();
}
// Letras recortadas: cada letra con su giro (±0,8°), su salto de base (±1,5 px), filo mordido y sombra de papel.
// Devuelve { c, w, h, base, xs } (xs = x de cada letra dentro del lienzo, para hacerlas caer de a una).
function letrasRecortadas(txt, font, col, o = {}) {
  const { fondo = '#000', semilla = 1, sombra = .32, track = 0, saltar = [] } = o;
  const size = parseFloat(font.match(/([\d.]+)px/)[1]);
  const letras = [...txt]; const xs = []; let x = size * .12;
  for (const L of letras) { xs.push(x); x += medirT(L, font) + track; }
  const w = Math.ceil(x + size * .2), h = Math.ceil(size * 1.35), base = Math.round(size * 1.02);
  const [c, g] = lienzo(w, h);
  letras.forEach((L, i) => { if (L === ' ' || saltar.includes(i)) return;
    const r = (hash2(i, semilla) - .5) * .028, dy = (hash2(i + 50, semilla) - .5) * 3, lw = medirT(L, font);
    const [lc, lg] = lienzo(Math.ceil(lw + size * .3), h);
    lg.font = font; lg.textBaseline = 'alphabetic'; lg.fillStyle = col; lg.fillText(L, size * .15, base);
    // filo de tijera: se muerde el contorno con trazos cortados (borra, no pinta)
    lg.globalCompositeOperation = 'destination-out'; lg.lineWidth = 1.5; lg.strokeStyle = '#000';
    lg.setLineDash([4 + hash2(i, 7) * 10, 30 + hash2(i, 9) * 40, 2 + hash2(i, 3) * 6, 50]); lg.lineDashOffset = hash2(i, semilla + 3) * 30;
    lg.font = font; lg.strokeText(L, size * .15, base);
    g.save(); g.translate(xs[i] - size * .15 + lc.width / 2, dy); g.rotate(r); g.translate(-lc.width / 2, 0);
    if (sombra) { g.shadowColor = `rgba(20,12,6,${sombra})`; g.shadowBlur = 5; g.shadowOffsetX = 2.5; g.shadowOffsetY = 3.5; }
    g.drawImage(lc, 0, 0); g.restore();
  });
  return { c, w, h, base, xs, size };
}

// ---------- oro art déco ----------
const ORO = { o0: '#6f5220', o1: '#c9a24b', o2: '#f3d98b', hi: '#fff4d2' };
// metal en bandas: oscuro – claro – caliente – claro – oscuro. brillo = dónde pasa la luz (0..1). Solo para LÍNEAS y metal, nunca en el texto.
function degradeOro(x0, y0, x1, y1, brillo = .38) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1), s = clamp(brillo, .08, .92);
  g.addColorStop(0, ORO.o0); g.addColorStop(clamp(s - .3), ORO.o1); g.addColorStop(clamp(s - .08), ORO.o2);
  g.addColorStop(s, ORO.hi); g.addColorStop(clamp(s + .1), ORO.o1); g.addColorStop(clamp(s + .32), ORO.o0); g.addColorStop(1, ORO.o1);
  return g;
}
function largo(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
function _parte(pts, p) { if (p >= 1) return pts; const L = largo(pts) * clamp(p), out = [pts[0]]; let acc = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + d >= L) { const u = (L - acc) / (d || 1); out.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]); return out; }
    acc += d; out.push(pts[i]); } return out; }
// línea grabada: surco oscuro + línea de oro + filete claro encima. o.parte 0→1 la dibuja. o.caja = extensión del degradado.
function lineaOro(pts, o = {}) {
  const { w = 3, parte = 1, cerrado = false, brillo = .38, alfa = 1, caja = [0, 0, W, H], color = null } = o;
  if (parte <= 0) return;
  const P = _parte(cerrado && parte >= 1 ? [...pts, pts[0]] : pts, parte);
  ctx.save(); ctx.globalAlpha *= alfa; ctx.lineJoin = 'miter'; ctx.miterLimit = 6; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]);
  ctx.strokeStyle = color ? mezcla(color, '#000000', .55) : ORO.o0; ctx.lineWidth = w + 1.6; ctx.stroke();
  ctx.strokeStyle = color || degradeOro(...caja, brillo); ctx.lineWidth = w; ctx.stroke();
  if (w >= 2) { ctx.strokeStyle = 'rgba(255,246,214,.5)'; ctx.lineWidth = Math.max(.6, w * .28); ctx.stroke(); }
  ctx.restore();
}
// rayos de sol déco desde (cx, cy): cuñas tenues + líneas de oro. parte 0→1 los hace crecer desde el centro.
function rayos(cx, cy, o = {}) {
  const { n = 48, r0 = 0, r1 = 2600, rot = 0, alfa = 1, parte = 1, cunas = 'rgba(201,162,75,.08)', w = 1.6, brillo = .4 } = o;
  ctx.save(); ctx.globalAlpha *= alfa; const paso = Math.PI * 2 / n, R = lerp(r0, r1, clamp(parte));
  ctx.fillStyle = cunas;
  for (let i = 0; i < n; i += 2) { const a = rot + i * paso, b = a + paso; ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.lineTo(cx + Math.cos(b) * R, cy + Math.sin(b) * R); ctx.lineTo(cx + Math.cos(b) * r0, cy + Math.sin(b) * r0); ctx.fill(); }
  ctx.strokeStyle = degradeOro(cx - r1, cy - r1, cx + r1, cy + r1, brillo); ctx.lineWidth = w;
  for (let i = 0; i < n; i++) { const a = rot + i * paso; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke(); }
  ctx.restore();
}
// volumen con aerógrafo dentro de un borde duro: degradado de sombra a luz (luz arriba a la izquierda) + filo de oro del lado iluminado
function aerografo(pts, base, o = {}) {
  const { dir = -2.3, filo = 2 } = o;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.max(x1 - x0, y1 - y0) / 2, ux = Math.cos(dir), uy = Math.sin(dir);
  const g = ctx.createLinearGradient(cx + ux * R, cy + uy * R, cx - ux * R, cy - uy * R);
  g.addColorStop(0, mezcla(base, '#ffffff', .38)); g.addColorStop(.42, base); g.addColorStop(1, mezcla(base, '#000000', .62));
  ctx.save(); ctx.beginPath(); _poli(ctx, pts); ctx.fillStyle = g; ctx.fill();
  if (filo) { ctx.clip(); ctx.translate(-ux * filo * 1.6, -uy * filo * 1.6); ctx.strokeStyle = ORO.o2; ctx.lineWidth = filo * 2; ctx.globalAlpha = .9; ctx.beginPath(); _poli(ctx, pts); ctx.stroke(); }
  ctx.restore();
}
// marco escalonado (zigurat) centrado en cx: devuelve el contorno de una barra con extremos en escalera
function escalonPts(cx, cy, w, h, pasos = 3, d = 16) {
  const T = cy - h / 2, R = cx + w / 2, st = h * .12, Q = [[cx, T], [R - pasos * d, T]];
  for (let k = 1; k <= pasos; k++) { Q.push([R - (pasos - k + 1) * d, T + k * st]); Q.push([R - (pasos - k) * d, T + k * st]); }
  const der = [...Q, ...Q.slice().reverse().map(([x, y]) => [x, 2 * cy - y])];
  return [...der, ...der.slice().reverse().map(([x, y]) => [2 * cx - x, y])];
}

// ---------- plano / cianotipo ----------
// Hoja de cianotipo (se pinta UNA vez): ruido entre dos azules de Prusia, vetas del recubrimiento, fibras, pliegues, manchas y bordes lavados.
function hojaCianotipo(w, h, o = {}) {
  const { azul1 = '#18336B', azul2 = '#2A58A6', semilla = 5, pliegues = [[.5, 0], [0, .5]] } = o;
  const [c, g] = lienzo(w, h), r = rng(semilla), A = hexRgb(azul1), B = hexRgb(azul2);
  for (let y = 0; y < h; y += 6) for (let x = 0; x < w; x += 6) {
    const n = vnoise(x * .004 + 3, y * .004) * .55 + vnoise(x * .016, y * .016 + 9) * .3 + vnoise(x * .06, y * .06) * .15;
    const v = clamp(.25 + n * .75 + (vnoise(y * .002, 40) - .5) * .3);
    g.fillStyle = `rgb(${lerp(A[0], B[0], v) | 0},${lerp(A[1], B[1], v) | 0},${lerp(A[2], B[2], v) | 0})`; g.fillRect(x, y, 6, 6);
  }
  for (let i = 0; i < 60; i++) { const y = r() * h; g.fillStyle = r() < .5 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,30,.05)'; g.fillRect(0, y, w, 4 + r() * 18); }   // vetas del rodillo
  g.strokeStyle = 'rgba(230,240,250,.05)'; g.lineWidth = 1;
  for (let i = 0; i < 700; i++) { const x = r() * w, y = r() * h, a = r() * 6.28, l = 6 + r() * 20; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (const [fx, fy] of pliegues) {                                                                  // pliegues: canto claro, canto oscuro
    if (fx) { const x = w * fx; g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x - 3, 0, 3, h); g.fillStyle = 'rgba(0,0,20,.14)'; g.fillRect(x, 0, 4, h); }
    if (fy) { const y = h * fy; g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(0, y - 3, w, 3); g.fillStyle = 'rgba(0,0,20,.14)'; g.fillRect(0, y, w, 4); }
  }
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.16)' : 'rgba(0,0,25,.18)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.max(w, h) * .72);           // bordes lavados por el sol
  v.addColorStop(0, 'rgba(255,255,255,0)'); v.addColorStop(1, 'rgba(190,215,240,.16)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
  return c;
}
// línea técnica que se dibuja por largo de arco; patron: null (llena), 'eje' (larga-corta), 'oculta' (rayas cortas). o.pluma = punto brillante en la cabeza.
function lineaPlano(pts, o = {}) {
  const { w = 3, col = '#E7F0F9', parte = 1, patron = null, alfa = 1, pluma = false, cerrado = false } = o;
  if (parte <= 0) return null;
  const P = _parte(cerrado ? [...pts, pts[0]] : pts, parte);
  ctx.save(); ctx.globalAlpha *= alfa; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (patron === 'eje') ctx.setLineDash([38, 9, 6, 9]); else if (patron === 'oculta') ctx.setLineDash([14, 9]);
  ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.stroke();
  ctx.restore();
  const cab = P[P.length - 1];
  if (pluma && parte < 1) { ctx.save(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cab[0], cab[1], w * 1.6, 0, 7); ctx.fill(); ctx.restore(); }
  return cab;
}
// rayado a 45° recortado a una forma; parte 0→1 = cuántas rayas van
function rayado(pts, o = {}) {
  const { ang = -Math.PI / 4, sep = 12, w = 1.4, col = '#E7F0F9', parte = 1, alfa = .8 } = o;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const R = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 4;
  ctx.save(); ctx.beginPath(); _poli(ctx, pts); ctx.clip(); ctx.translate(cx, cy); ctx.rotate(ang);
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.globalAlpha *= alfa; const n = Math.ceil(2 * R / sep), m = Math.round(n * clamp(parte));
  for (let i = 0; i < m; i++) { const y = -R + i * sep; ctx.beginPath(); ctx.moveTo(-R, y); ctx.lineTo(R, y); ctx.stroke(); }
  ctx.restore();
}

// ---------- vitral ----------
// Vidrio: color de la pieza + vetas a un ángulo propio + variación de tono + orilla envejecida junto al plomo + burbujas.
function vidrio(g, pts, col, semilla, o = {}) {
  const r = rng(semilla * 31 + 7), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 2;
  g.save(); g.beginPath(); _poli(g, pts); g.clip();
  g.fillStyle = mezcla(col, r() < .5 ? '#000000' : '#ffffff', r() * .12); g.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  g.translate(cx, cy); g.rotate(r() * Math.PI);
  for (let i = 0; i < 26; i++) { const y = -R + r() * 2 * R; g.fillStyle = r() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.09)'; g.fillRect(-R, y, 2 * R, 1 + r() * 5); }
  g.setTransform(1, 0, 0, 1, 0, 0); if (o.m) g.setTransform(o.m);
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(lerp(x0, x1, r()), lerp(y0, y1, r()), .8 + r() * 1.8, 0, 7); g.fill(); }
  g.beginPath(); _poli(g, pts); g.strokeStyle = 'rgba(30,15,5,.32)'; g.lineWidth = 10; g.stroke();          // orilla envejecida
  g.restore();
}
// Plomo: red casi negra, uniones redondas y una ceja gris tenue.
function plomo(g, pts, w = 7) {
  g.save(); g.lineJoin = g.lineCap = 'round'; g.beginPath(); _poli(g, pts);
  g.strokeStyle = '#121010'; g.lineWidth = w; g.stroke(); g.strokeStyle = 'rgba(120,115,110,.35)'; g.lineWidth = Math.max(1, w * .22); g.stroke(); g.restore();
}
// Ojiva (arco apuntado): x, y = esquina arriba-izq del rectángulo que la contiene
function ojivaPts(x, y, w, h, n = 24) {
  const r = w, out = [[x, y + h]];
  const yc = y + w * .866;   // arranque de los arcos (punta = y)
  for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * (Math.PI / 3); out.push([x + w + Math.cos(a) * r, yc + Math.sin(a) * r]); }
  for (let i = 1; i <= n; i++) { const a = -Math.PI / 3 + i / n * (Math.PI / 3); out.push([x + Math.cos(a) * r, yc + Math.sin(a) * r]); }
  out.push([x + w, y + h]); return out;   // (si h < 0,866·w la ojiva no cierra: dale más alto)
}

// ---------- pictogramas ----------
function disco(g, x, y, r, col) { if (r <= 0) return; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
function barra(g, a, b, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
// Patrón de retícula: discos y medios discos de celda + motivos geométricos chicos, todo en 5 tonos de UN color.
// Se pinta más ancho que la pantalla para poder correr filas enteras.
function patronReticula(tonos, celda, semilla, o = {}) {
  const { densidad = .5, contraste = 1 } = o, T = tonos.map(c => mezcla(tonos[2], c, contraste));
  const cols = Math.ceil(W / celda) + 3, filas = Math.ceil(H / celda) + 2, [c, g] = lienzo(cols * celda, filas * celda), r = rng(semilla * 7919 + 13);
  g.fillStyle = T[1]; g.fillRect(0, 0, c.width, c.height);
  for (let j = -1; j < filas; j++) for (let i = -1; i < cols; i++) { const k = r(), x = i * celda, y = j * celda;
    if (k < .34) disco(g, x + celda, y + celda, celda, T[Math.floor(r() * 4)]);
    else if (k < .5) { disco(g, x + celda, y + celda, celda, T[3]); disco(g, x + celda, y + celda, celda * .5, T[0]); } }
  for (let j = 0; j < filas; j++) for (let i = 0; i < cols; i++) { if (r() > densidad) continue;
    const pick = () => T[Math.floor(r() * 5)]; let a = pick(), b = pick(); while (b === a) b = pick(); let cc = pick(); while (cc === b) cc = pick();
    _motivo(g, Math.floor(r() * 9), i * celda, j * celda, celda, a, b, cc, r); }
  return c;
}
function _motivo(g, k, x, y, s, a, b, cc, r) {
  g.save(); g.beginPath(); g.rect(x, y, s, s); g.clip(); g.fillStyle = a; g.fillRect(x, y, s, s);
  g.translate(x + s / 2, y + s / 2); g.rotate(Math.floor(r() * 4) * Math.PI / 2); g.translate(-s / 2, -s / 2);
  switch (k) {
    case 0: disco(g, 0, 0, s, b); break;                                                    // cuarto de disco
    case 1: disco(g, s / 2, s, s / 2, b); break;                                            // medio disco
    case 2: disco(g, s / 2, s / 2, s / 2, b); disco(g, s * .62, s * .42, s * .13, cc); break;
    case 3: for (let i = 5; i >= 1; i--) disco(g, 0, s, s * i / 5, i % 2 ? b : a); break;   // arcos concéntricos
    case 4: { const q = s / 4; for (let f = 0; f < 5; f++) for (let i = -1; i < 5; i++) { const cx = i * q + (f % 2 ? q / 2 : 0), cy = f * q * .5 + q * .5; disco(g, cx, cy, q * .5, f % 2 ? b : cc); disco(g, cx, cy, q * .3, a); } break; } // escamas
    case 5: { const q = s / 7; disco(g, s, s, s * .9, b); for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if ((i + j) % 2 === 0) { g.fillStyle = cc; g.fillRect(i * q + q * .2, j * q + q * .2, q * .6, q * .6); } break; }
    case 6: disco(g, s / 2, s / 2, s * .46, b); disco(g, s * .66, s * .38, s * .4, a); break;  // media luna
    case 7: disco(g, 0, s / 2, s / 2, b); disco(g, s, s / 2, s / 2, cc); break;              // ola en S
    case 8: { g.fillStyle = b; g.beginPath(); for (let i = 0; i < 16; i++) { const t0 = i / 16 * Math.PI * 2; g.moveTo(s / 2, s / 2); g.arc(s / 2, s / 2, s * .4, t0, t0 + Math.PI / 32); } g.fill(); disco(g, s / 2, s / 2, s * .3, b); disco(g, s / 2, s / 2, s * .16, cc); break; } // rueda de sol
  }
  g.restore();
}
// Pinta el patrón con filas enteras corridas: offs(fila) → px. Las filas pueden viajar sin fin.
function pintarFilas(pat, celda, offs, dy = 0) {
  const filas = Math.ceil(H / celda) + 1;
  for (let j = 0; j < filas; j++) { let dx = offs ? offs(j) : 0; dx = ((dx % celda) + celda) % celda - celda;
    ctx.drawImage(pat, 0, j * celda, pat.width, celda, dx, j * celda + dy, pat.width, celda + .5); }
}

// ---------- terminal ASCII / CRT ----------
// Cobertura de tinta de cada glifo (se mide UNA vez) para elegir el carácter por densidad.
function coberturaGlifos(chars, font, cw, chh) {
  const c = document.createElement('canvas'); c.width = Math.ceil(cw); c.height = Math.ceil(chh);
  const g = c.getContext('2d', { willReadFrequently: true }), cov = {};
  g.font = font; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  for (const ch of new Set(chars)) { g.clearRect(0, 0, c.width, c.height); g.fillText(ch, 0, chh / 2);
    const d = g.getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 3; i < d.length; i += 4) s += d[i]; cov[ch] = s / (d.length / 4) / 255; }
  return cov;
}
// Rampa: de vacío a lleno, con 3 brillos (tenue, normal, fuerte) y sin niveles casi repetidos
function rampaDensidad(chars, font, cw, chh) {
  const cov = coberturaGlifos(chars, font, cw, chh), set = [...new Set(chars)].filter(c => c !== ' '), mx = Math.max(...set.map(c => cov[c]));
  const lv = [{ ch: ' ', a: 0, v: 0 }]; for (const c of set) for (const a of [.42, .7, 1]) lv.push({ ch: c, a, v: cov[c] / mx * a });
  lv.sort((p, q) => p.v - q.v); const out = [lv[0]];
  for (const l of lv.slice(1)) { if (l.v - out[out.length - 1].v > .018) out.push(l); else if (l.a > out[out.length - 1].a) out[out.length - 1] = l; }
  return out;
}
const _BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16 - .5);
function elegirNivel(rampa, L, i, j) { const n = rampa.length - 1, x = L * n + (_BAYER[(j & 3) * 4 + (i & 3)] * .5 + (hash2(i, j) - .5) * .5) * .9;
  return rampa[Math.max(0, Math.min(n, Math.round(x)))]; }
// Post de CRT, SUAVE: curvatura leve (franjas horizontales y verticales), líneas de barrido, vidrio redondeado, viñeta y un parpadeo de ~1 %.
// Sin brillo sobre el texto: el fósforo se lee nítido.
let _CRT = null;
function postCRT(src, t, o = {}) {
  const { curva = .035, barrido = .16, vidrio = '#0b0704', esquina = 70, parpadeo = .012 } = o;
  if (!_CRT) { const [c, g] = lienzo(W, H); _CRT = { c, g };
    const [m, mg] = lienzo(W, H); mg.fillStyle = 'rgba(0,0,0,1)';                                    // líneas de barrido (una vez)
    for (let y = 0; y < H; y += 4) mg.fillRect(0, y + 2, W, 2); _CRT.scan = m;
    const [v, vg] = lienzo(W, H), gr = vg.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .72);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.62)'); vg.fillStyle = gr; vg.fillRect(0, 0, W, H);
    vg.fillStyle = vidrio; vg.beginPath(); vg.rect(0, 0, W, H); vg.roundRect(26, 26, W - 52, H - 52, esquina); vg.fill('evenodd');
    vg.strokeStyle = 'rgba(255,220,170,.05)'; vg.lineWidth = 3; vg.beginPath(); vg.roundRect(28, 28, W - 56, H - 56, esquina); vg.stroke();
    _CRT.vin = v; }
  const g = _CRT.g; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = vidrio; g.fillRect(0, 0, W, H);
  // curvatura de barril: cada franja horizontal se encoge un poco hacia arriba y abajo de la pantalla
  const tiras = 48, th = H / tiras;
  for (let k = 0; k < tiras; k++) { const yc = (k + .5) / tiras * 2 - 1, s = 1 - curva * yc * yc, dw = W * s;
    g.drawImage(src, 0, k * th, W, th, (W - dw) / 2, k * th, dw, th + .6); }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(_CRT.c, 0, 0);
  ctx.globalAlpha = barrido; ctx.drawImage(_CRT.scan, 0, 0); ctx.globalAlpha = 1;
  const fl = (vnoise(t * 9, 3) - .5) * 2 * parpadeo; if (fl > 0) { ctx.fillStyle = `rgba(255,190,90,${fl * .5})`; ctx.fillRect(0, 0, W, H); } else { ctx.fillStyle = `rgba(0,0,0,${-fl})`; ctx.fillRect(0, 0, W, H); }
  ctx.drawImage(_CRT.vin, 0, 0); ctx.restore();
}
