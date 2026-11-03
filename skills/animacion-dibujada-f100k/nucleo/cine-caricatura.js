// ============================================================================
// cine-caricatura.js · motor compartido del grupo «Caricatura, videojuegos y cine de época»
// Técnica adaptada de lemo-opuscar (MIT, © 2026 LemoLab): toon.js/chars.js/film.js (rubber-hose),
// cel.js/post.js (cel-anime-80s), toon.js (scifi-toon, midcentury-toon), film.js/cards.js (silent-film),
// main_v1.js/main_b.js (game-show), stage.js/hud.js (microgame). Reescrito desde cero para canvas 2D.
//
// Lo usan: cine-rubber-hose, cine-cel-anime-80s, cine-scifi-toon, cine-midcentury-toon, cine-silent-film,
//          cine-game-show, cine-microgame (y cine-backrooms solo para la frase).
// Exporta (globales, después de nucleo.js):
//   texto ........ partesDe, armarFrase, pintarFrase, textoTinta
//   toon ......... conCtx, forma, formaSombra, ojoPastel, ojoGrande, ceja, boca, manguera, guante, zapato
//   adornos ...... rayos, estrellaAtomica, explosion, rayasDiagonales, lunares
//   pasadas ...... hacerCapa, pelicula (gate + daño suave), cortinas, bloom, pasadaCinta (VHS/CRT suave), vineta
// Todo es determinista (hash2/vnoise/rng). Nada de Math.random ni Date.
// ANATOMIA: estilizada — guante de caricatura de 3 dedos gordos y extremidades de manguera sin codo: convención de los años 30–50, no anatomía real
// ============================================================================

// ---------------------------------------------------------------- contexto
// nucleo.js usa un `ctx` global: para dibujar en una capa aparte se cambia y se devuelve.
function conCtx(c2, fn) { const prev = ctx; ctx = c2; try { fn(); } finally { ctx = prev; } }
function hacerCapa(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------------------------------------------------------------- texto de diseño
// partesDe('tu contenido no vende', 'vende') → palabras con su escala: la clave enorme, los conectores chicos.
const CONECTORES = new Set(['de', 'la', 'el', 'los', 'las', 'tu', 'tus', 'y', 'o', 'a', 'en', 'un', 'una', 'que', 'con', 'por', 'para', 'del', 'al', 'lo', 'se', 'es', 'mi', 'te', 'no', 'si', 'sin', 'ni', 'su', 'sus']);
function partesDe(frase, clave = '', o = {}) {
  const { kClave = 2.1, kConector = .62, kNormal = 1 } = o;
  const cl = (clave || '').toLowerCase().split(/\s+/).filter(Boolean);
  return frase.trim().split(/[ \t\n]+/).map(p => {
    const limpia = p.toLowerCase().replace(/[¡!¿?.,:;«»"]/g, '').replace(/\u00A0/g, ' ');
    const esClave = cl.includes(limpia);
    return { txt: p, k: esClave ? kClave : CONECTORES.has(limpia) ? kConector : kNormal, clave: esClave };
  });
}
// Arma renglones con palabras de tamaños distintos. Busca el tamaño base más grande que cabe en ancho × altoMax.
// partes: [{txt, k, clave?, ...}] · devuelve { tokens: [{...parte, x, y, size, font, w}], alto, base }
function armarFrase(partes, o = {}) {
  const { familia = LETRA_LIMPIA, peso = 800, ancho = W - 160, altoMax = 600, tamMax = 150, tamMin = 30,
    interlinea = 1.02, x0 = W / 2, y0 = 400, alinear = 'centro', mayus = false, espacio = .28, maxRenglones = 5 } = o;
  const txt = p => mayus ? p.txt.toUpperCase() : p.txt;
  const prueba = base => {
    const rows = []; let row = [], wRow = 0;
    for (const p of partes) {
      const size = Math.round(base * p.k), font = `${p.peso || peso} ${size}px ${p.familia || familia}`, w = medir(txt(p), font), sp = base * espacio;
      if (row.length && wRow + sp + w > ancho) { rows.push(row); row = []; wRow = 0; }
      wRow += (row.length ? sp : 0) + w; row.push({ ...p, txt: txt(p), size, font, w });
      if (w > ancho) return null;
    }
    if (row.length) rows.push(row);
    if (rows.length > maxRenglones) return null;
    const alto = rows.reduce((a, r) => a + Math.max(...r.map(q => q.size)) * interlinea, 0);
    return alto <= altoMax ? { rows, alto } : null;
  };
  let base = tamMax, r = null;
  for (; base >= tamMin; base -= 2) { r = prueba(base); if (r) break; }
  if (!r) { console.error(`[armarFrase] «${partes.map(p => p.txt).join(' ')}» no cabe: acórtala.`); base = tamMin; r = prueba(tamMin) || { rows: [partes.map(p => ({ ...p, size: tamMin, font: `${peso} ${tamMin}px ${familia}`, w: medir(p.txt, `${peso} ${tamMin}px ${familia}`) }))], alto: tamMin }; }
  const tokens = []; let y = y0;
  for (const row of r.rows) {
    const alto = Math.max(...row.map(q => q.size)), sp = base * espacio;
    const wRow = row.reduce((a, q) => a + q.w, 0) + sp * (row.length - 1);
    let x = alinear === 'centro' ? x0 - wRow / 2 : alinear === 'der' ? x0 - wRow : x0;
    y += alto * .86;
    for (const q of row) { tokens.push({ ...q, x, y }); x += q.w + sp; }
    y += alto * (interlinea - .86);
  }
  return { tokens, alto: r.alto, base, y1: y };
}
// Pinta los tokens que ya entraron (corte seco: aparecen enteros en su tiempo q.t0). pintor(q) dibuja cada uno.
function pintarFrase(L, t, pintor) { for (const q of L.tokens) if (q.t0 === undefined || t >= q.t0) pintor(q); }
// Texto con tinta DEBAJO del relleno (paint-order: stroke) y sombra dura opcional. Sin brillo ni degradado.
function textoTinta(txt, x, y, o = {}) {
  const { font = `800 80px ${LETRA_LIMPIA}`, relleno = '#fff', tinta = '#111', grosor = 0, sombra = null, alinear = 'left', base = 'alphabetic' } = o;
  ctx.save(); ctx.font = font; ctx.textAlign = alinear; ctx.textBaseline = base; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  if (sombra) { ctx.fillStyle = ctx.strokeStyle = sombra[2]; if (grosor) { ctx.lineWidth = grosor * 2; ctx.strokeText(txt, x + sombra[0], y + sombra[1]); } ctx.fillText(txt, x + sombra[0], y + sombra[1]); }
  if (grosor) { ctx.strokeStyle = tinta; ctx.lineWidth = grosor * 2; ctx.strokeText(txt, x, y); }
  ctx.fillStyle = relleno; ctx.fillText(txt, x, y);
  ctx.restore();
}

// ---------------------------------------------------------------- formas de caricatura
// forma(pts): relleno plano, sombra dura recortada (la forma menos la forma corrida hacia la luz), luz dura opcional
// y tinta de grosor constante con hervor (BOIL del núcleo). o.desfase = color impreso corrido de su línea (años 50).
function forma(pts, o = {}) {
  const { relleno = null, tinta = '#14110f', w = 6, sombra = null, luz = null, amp = 1.4, seed = 0, desfase = null, alpha = 1, lineaAlpha = 1 } = o;
  const P = J(resample(pts, 8, true), seed, amp);
  ctx.save(); ctx.globalAlpha *= alpha;
  if (relleno) {
    const D = desfase ? P.map(([x, y]) => [x + desfase[0], y + desfase[1]]) : P;
    tracePath(D, true); ctx.fillStyle = relleno; ctx.fill();
    if (sombra || luz) {
      ctx.save(); tracePath(D, true); ctx.clip();
      if (sombra) { ctx.fillStyle = sombra.col; ctx.fill(); tracePath(D.map(([x, y]) => [x + sombra.dx, y + sombra.dy]), true); ctx.fillStyle = relleno; ctx.fill(); }
      if (luz) { tracePath(D.map(([x, y]) => [x + luz.dx, y + luz.dy]), true); ctx.rect(-9e3, -9e3, 2e4, 2e4); ctx.fillStyle = luz.col; ctx.fill('evenodd'); }
      ctx.restore();
    }
  }
  if (tinta && w > 0) { ctx.globalAlpha *= lineaAlpha; tracePath(P, true); ctx.strokeStyle = tinta; ctx.lineWidth = w; ctx.lineJoin = ctx.lineCap = 'round'; ctx.stroke(); }
  ctx.restore();
}
// línea abierta con hervor (antenas, arrugas, detalles)
function trazo(pts, o = {}) { const { col = '#14110f', w = 5, amp = 1.2, seed = 0, alpha = 1 } = o; ink(resample(pts, 8), { col, w, amp, seed, passes: 1, alpha }); }

// Ojo de pastel (años 30): blanco ovalado, pupila negra con una cuña recortada arriba a la derecha.
// o.mira [-1..1, -1..1] · o.tipo 'abierto'|'grande'|'feliz'|'cerrado' · o.parpado 0..1 · o.colParpado
function ojoPastel(cx, cy, rx, ry, o = {}) {
  const { mira = [0, 0], tipo = 'abierto', parpado = 0, colParpado = '#fcfbf7', tinta = '#0e0d0c', w = 5, blanco = '#fcfbf7' } = o;
  if (tipo === 'feliz') { trazo(arc(cx, cy + ry * .35, rx * .95, ry * .55, Math.PI * 1.08, Math.PI * 1.92), { col: tinta, w: w * 1.3 }); return; }
  if (tipo === 'cerrado') { trazo(arc(cx, cy - ry * .1, rx * .95, ry * .4, Math.PI * .1, Math.PI * .9), { col: tinta, w: w * 1.2 }); return; }
  const g = tipo === 'grande' ? 1.15 : 1, R = rx * g, RY = ry * g, pr = tipo === 'grande' ? .46 : .62, pry = tipo === 'grande' ? .5 : .72;
  const px = cx + clamp(mira[0], -1, 1) * R * (1 - pr) * .9, py = cy + clamp(mira[1], -1, 1) * RY * (1 - pry) * .85 + RY * .06;
  forma(circle(cx, cy, R, RY), { relleno: blanco, tinta: null });
  ctx.save(); tracePath(J(resample(circle(cx, cy, R, RY), 8, true), 3, 1.2), true); ctx.clip();
  ctx.fillStyle = tinta; ctx.beginPath();
  const a0 = -100 * Math.PI / 180, a1 = -40 * Math.PI / 180;
  ctx.moveTo(px + Math.cos((a0 + a1) / 2) * R * pr * .15, py + Math.sin((a0 + a1) / 2) * RY * pry * .15);
  for (let i = 0; i <= 28; i++) { const a = a1 + i / 28 * (Math.PI * 2 - (a1 - a0)); ctx.lineTo(px + Math.cos(a) * R * pr, py + Math.sin(a) * RY * pry); }
  ctx.closePath(); ctx.fill();
  if (parpado > 0) { ctx.fillStyle = colParpado; ctx.fillRect(cx - R * 1.3, cy - RY * 1.3, R * 2.6, RY * .3 + parpado * 2 * RY); }
  ctx.restore();
  forma(circle(cx, cy, R, RY), { relleno: null, tinta, w });
  if (parpado > 0.05) { const yl = cy - RY + parpado * 2 * RY, hw = Math.sqrt(Math.max(0, 1 - ((yl - cy) / RY) ** 2)) * R; if (hw > 2) trazo([[cx - hw, yl], [cx + hw, yl]], { col: tinta, w }); }
}
// Ojo grande de sitcom: blanco enorme, pupila diminuta, párpado pesado (deadpan) y ojera opcional.
function ojoGrande(cx, cy, r, o = {}) {
  const { mira = [0, 0], parpado = 0, colParpado = '#e9b28c', tinta = '#1d1424', w = 6, pupila = r * .13, ojera = false, tiembla = 0 } = o;
  forma(circle(cx, cy, r, r * 1.05), { relleno: '#fbfbf6', tinta: null });
  const px = cx + mira[0] * r * .55 + tiembla, py = cy + mira[1] * r * .5;
  ctx.save(); ctx.fillStyle = tinta; ctx.beginPath(); ctx.arc(px, py, pupila, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  if (parpado > 0) { ctx.save(); tracePath(resample(circle(cx, cy, r, r * 1.05), 8, true), true); ctx.clip(); ctx.fillStyle = colParpado; ctx.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * .2 + parpado * 2 * r); ctx.restore();
    const yl = cy - r * 1.05 + parpado * 2.1 * r, hw = Math.sqrt(Math.max(0, 1 - ((yl - cy) / (r * 1.05)) ** 2)) * r; trazo([[cx - hw, yl], [cx + hw, yl]], { col: tinta, w }); }
  forma(circle(cx, cy, r, r * 1.05), { tinta, w });
  if (ojera) trazo(arc(cx, cy + r * .55, r * .7, r * .55, Math.PI * .2, Math.PI * .8), { col: tinta, w: w * .55, alpha: .7 });
}
// Ceja por extremo interior/exterior (no izquierda/derecha): tipo 'arriba'|'triste'|'enojada'|'plana'|'duda' · lado -1 izq / +1 der
function ceja(cx, cy, w, tipo = 'plana', lado = 1, o = {}) {
  const { col = '#0e0d0c', grosor = 7 } = o, ix = cx - lado * w * .5, ox = cx + lado * w * .5;
  let pts;
  if (tipo === 'arriba') pts = arc(cx, cy + w * .5, w * .55, w * .42, Math.PI * 1.15, Math.PI * 1.85);
  else if (tipo === 'triste') pts = [[ix, cy - w * .3], [cx, cy - w * .12], [ox, cy + w * .08]];
  else if (tipo === 'enojada') pts = [[ix, cy + w * .14], [cx, cy - w * .05], [ox, cy - w * .28]];
  else if (tipo === 'duda') pts = lado > 0 ? arc(cx, cy + w * .5, w * .55, w * .5, Math.PI * 1.15, Math.PI * 1.85) : [[cx - w * .45, cy + w * .05], [cx + w * .45, cy + w * .05]];
  else pts = [[cx - w * .45, cy], [cx + w * .45, cy]];
  ink(resample(pts, 6), { col, w: grosor, amp: 1, passes: 1 });
}
// Boca: 'sonrisa'|'abierta'|'o'|'plana'|'triste'|'ondulada' · o.interior color de la boca · o.lengua
function boca(cx, cy, w, tipo = 'sonrisa', o = {}) {
  const { tinta = '#0e0d0c', grosor = 6, interior = '#3b1d1d', lengua = '#d8707a', abre = .6, dientes = true } = o;
  if (tipo === 'sonrisa') { trazo([[cx - w / 2, cy - w * .06], [cx, cy + w * .3], [cx + w / 2, cy - w * .06]], { col: tinta, w: grosor }); trazo(arc(cx - w / 2 - 2, cy - w * .07, w * .09, w * .09, Math.PI * .6, Math.PI * 1.4), { col: tinta, w: grosor * .75 }); trazo(arc(cx + w / 2 + 2, cy - w * .07, w * .09, w * .09, -Math.PI * .4, Math.PI * .4), { col: tinta, w: grosor * .75 }); return; }
  if (tipo === 'plana') { trazo([[cx - w * .4, cy], [cx + w * .4, cy + 2]], { col: tinta, w: grosor }); return; }
  if (tipo === 'triste') { trazo([[cx - w / 2, cy + w * .12], [cx, cy - w * .16], [cx + w / 2, cy + w * .12]], { col: tinta, w: grosor }); return; }
  if (tipo === 'ondulada') { const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([cx - w / 2 + u * w, cy + Math.sin(u * Math.PI * 4) * w * .06]); } trazo(pts, { col: tinta, w: grosor }); return; }
  if (tipo === 'o') { forma(circle(cx, cy, w * .2, w * .26 * abre / .6), { relleno: interior, tinta, w: grosor }); return; }
  // abierta: borde de arriba casi recto, U grande abajo, lengua y dientes
  const h = w * abre, pts = [];
  for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([cx - w / 2 + u * w, cy - Math.sin(u * Math.PI) * w * .03]); }
  for (let i = 10; i >= 0; i--) { const u = i / 10; pts.push([cx - w / 2 + u * w, cy + Math.sin(u * Math.PI) * h]); }
  const P = J(pts, 5, 1);
  ctx.save(); tracePath(P, true); ctx.fillStyle = interior; ctx.fill(); ctx.clip();
  ctx.fillStyle = lengua; ctx.beginPath(); ctx.ellipse(cx, cy + h * .95, w * .26, h * .42, 0, 0, Math.PI * 2); ctx.fill();
  if (dientes) { ctx.fillStyle = '#fbfaf4'; ctx.fillRect(cx - w / 2, cy - w * .1, w, h * .22 + w * .1); }
  ctx.restore();
  tracePath(P, true); ctx.save(); ctx.strokeStyle = tinta; ctx.lineWidth = grosor; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
// Extremidad de manguera: tubo de ancho constante con UNA curva suave y puntas redondas.
function manguera(a, b, curva = 0, w = 16, col = '#0e0d0c', o = {}) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const c = [mx - dy / L * curva, my + dx / L * curva], pts = [];
  for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push([(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]]); }
  const P = J(pts, o.seed || 2, 1);
  ctx.save(); ctx.lineCap = ctx.lineJoin = 'round';
  if (o.tinta) { ctx.strokeStyle = o.tinta; ctx.lineWidth = w + (o.wTinta || 8); tracePath(P, false); ctx.stroke(); }
  ctx.strokeStyle = col; ctx.lineWidth = w; tracePath(P, false); ctx.stroke(); ctx.restore();
}
// Guante blanco de caricatura (convención de los años 30/50, estilizado): muñequera con pliegue, 3 dedos gordos + pulgar,
// un solo contorno de la unión y 3 costuras. x,y = la muñequera · ang = hacia dónde apuntan los dedos · k = escala.
// tipo 'abierto'|'puno'|'senala'
function guante(x, y, ang, k = 1, o = {}) {
  const { tipo = 'abierto', col = '#fcfbf7', tinta = '#0e0d0c', w = 5 } = o;
  const partes = [];
  const dedo = (a, len, gr = 13) => { const r = a * Math.PI / 180, pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push([22 + Math.cos(r) * len * u, Math.sin(r) * len * u]); } partes.push({ pts, gr }); };
  if (tipo === 'abierto') { dedo(-34, 30); dedo(-4, 33); dedo(27, 29); dedo(-88, 22, 14); }
  else if (tipo === 'senala') { dedo(-4, 44, 12); dedo(-95, 18, 14); }
  else dedo(-90, 13, 15);
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(k, k * (o.espejo ? -1 : 1));
  const palma = tipo === 'abierto' ? 17 : 19;
  const pintar = (col2, extra) => {
    ctx.strokeStyle = ctx.fillStyle = col2; ctx.lineCap = 'round';
    for (const d of partes) { ctx.lineWidth = d.gr + extra; tracePath(J(d.pts, 7, .6), false); ctx.stroke(); }
    ctx.lineWidth = extra || 1; tracePath(J(circle(22, 0, palma, palma * .95), 8, .6), true); ctx.fill(); if (extra) ctx.stroke();
    tracePath(J(resample([[-7, -12], [4, -21], [11, -15], [11, 15], [4, 21], [-7, 12]], 5, true), 9, .6), true); ctx.fill(); if (extra) ctx.stroke();
  };
  pintar(tinta, w * 2); pintar(col, 0);
  ctx.strokeStyle = tinta; ctx.lineWidth = w * .55; ctx.lineCap = 'round';
  if (tipo === 'abierto') for (const dy of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(14, dy * 1.1); ctx.lineTo(25, dy * 1.4); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(2, -16); ctx.quadraticCurveTo(7, 0, 2, 16); ctx.stroke();
  ctx.restore();
}
// Zapatón negro redondo con brillo blanco en la punta. dir ±1 hacia dónde mira la punta.
function zapato(x, y, dir = 1, k = 1, o = {}) {
  const { col = '#0e0d0c', brillo = '#fcfbf7' } = o;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * k, k);
  const pts = [[-15, 0], [-17, -12], [-6, -19], [10, -21], [27, -18], [37, -8], [34, 3], [12, 5], [-8, 4]];
  forma(pts, { relleno: col, tinta: col, w: 3 });
  ctx.fillStyle = brillo; ctx.beginPath(); ctx.ellipse(22, -12, 7, 3.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- adornos
function rayos(cx, cy, r0, r1, n, ang, col, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = col;
  for (let i = 0; i < n; i++) { const a = ang + i / n * Math.PI * 2, d = Math.PI / n * .5;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a - d) * r0, cy + Math.sin(a - d) * r0); ctx.lineTo(cx + Math.cos(a - d * 1.4) * r1, cy + Math.sin(a - d * 1.4) * r1);
    ctx.lineTo(cx + Math.cos(a + d * 1.4) * r1, cy + Math.sin(a + d * 1.4) * r1); ctx.lineTo(cx + Math.cos(a + d) * r0, cy + Math.sin(a + d) * r0); ctx.fill(); }
  ctx.restore();
}
function estrellaAtomica(x, y, r, col, rot = 0) {   // destello de 4 puntas de los 50
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, d = i % 2 ? r * .18 : r; ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function explosion(x, y, r, puntas, o = {}) {      // estallido de N puntas con tinta
  const { relleno = '#ffc928', tinta = '#14110f', w = 7, rot = 0, interior = .72, sombra = null } = o, pts = [];
  for (let i = 0; i < puntas * 2; i++) { const a = rot + i / (puntas * 2) * Math.PI * 2, d = i % 2 ? r * interior : r; pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]); }
  if (sombra) forma(pts.map(([a, b]) => [a + sombra[0], b + sombra[1]]), { relleno: tinta, tinta: null, amp: .8 });
  forma(pts, { relleno, tinta, w, amp: .8 });
}
function rayasDiagonales(x, y, w, h, col, ancho = 60, desplaza = 0, ang = -.5) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = col;
  ctx.translate(x + w / 2, y + h / 2); ctx.rotate(ang); const R = Math.hypot(w, h);
  for (let k = -R; k < R; k += ancho * 2) { ctx.fillRect(k + (desplaza % (ancho * 2)), -R, ancho, R * 2); }
  ctx.restore();
}
function lunares(x, y, w, h, col, paso = 70, r = 12) {
  ctx.save(); ctx.fillStyle = col;
  for (let j = 0; j * paso < h + paso; j++) for (let i = 0; i * paso < w + paso; i++) { ctx.beginPath(); ctx.arc(x + i * paso + (j % 2) * paso / 2, y + j * paso, r, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// ---------------------------------------------------------------- pasadas de época
// Viñeta pintada una vez
const _VINETAS = {};
function vineta(fuerza = .6, col = '0,0,0', r0 = .35) {
  const k = fuerza + col + r0;
  if (!_VINETAS[k]) { const c = hacerCapa(), p = c.getContext('2d'); const g = p.createRadialGradient(W / 2, H / 2, Math.min(W, H) * r0, W / 2, H / 2, Math.hypot(W, H) * .55);
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(.65, `rgba(${col},${fuerza * .3})`); g.addColorStop(1, `rgba(${col},${fuerza})`); p.fillStyle = g; p.fillRect(0, 0, W, H); _VINETAS[k] = c; }
  ctx.drawImage(_VINETAS[k], 0, 0);
}
// Película de época, SUAVE: la escena (capa) se compone en una ventanilla redondeada con vaivén lento (≤ 0,8 px, sin saltos),
// parpadeo de brillo bajo, 0–2 rayas verticales, motas de polvo y viñeta. o.sepia 0..1 tiñe; o.contraste.
// gate = {x,y,w,h,r}. Llamar con el ctx principal.
function pelicula(escena, t, gate, o = {}) {
  const { sepia = .15, contraste = 1.12, parpadeo = .025, rayas = true, polvo = true, gris = true } = o;
  const f = Math.round(t * 24);
  const wx = (vnoise(t * .9, 3.1) - .5) * 1.4, wy = (vnoise(t * .8 + 40, 7.7) - .5) * 1.4;
  ctx.save(); ctx.fillStyle = o.fondo || '#000'; ctx.fillRect(0, 0, W, H);
  ctx.beginPath(); ctx.roundRect(gate.x, gate.y, gate.w, gate.h, gate.r || 30); ctx.clip();
  ctx.filter = `${gris ? 'grayscale(1) ' : ''}sepia(${sepia}) contrast(${contraste}) blur(.5px)`;
  ctx.drawImage(escena, wx, wy); ctx.filter = 'none';
  const fl = (hash2(f, 17) - .5) * parpadeo * 2 + (vnoise(t * 2.2, 1) - .5) * parpadeo;
  ctx.fillStyle = fl > 0 ? `rgba(255,250,235,${fl})` : `rgba(0,0,0,${-fl})`; ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
  if (rayas) { const seg = Math.floor(t * 1.6);
    for (let i = 0; i < 2; i++) { if (hash2(seg * 13 + i, 5) < .5) continue;
      const sx = gate.x + hash2(seg * 5 + i, 9) * gate.w + Math.sin(t * 3 + i) * 4, claro = hash2(seg + i * 9, 2) > .45;
      ctx.strokeStyle = claro ? 'rgba(245,242,230,.32)' : 'rgba(12,10,8,.3)'; ctx.lineWidth = 1 + hash2(seg * 2 + i, 4) * 1.2;
      const y0 = gate.y + hash2(seg * 3 + i, 6) * gate.h * .4; ctx.beginPath(); ctx.moveTo(sx, y0); ctx.lineTo(sx + 1.5, y0 + gate.h * (.35 + hash2(seg + i, 8) * .5)); ctx.stroke(); } }
  if (polvo) { const n = 2 + Math.floor(hash2(f, 3) * 4);
    for (let i = 0; i < n; i++) { const dx = gate.x + hash2(f * 11 + i, 1) * gate.w, dy = gate.y + hash2(f * 17 + i, 2) * gate.h, rr = .8 + hash2(f + i, 4) * 2.2;
      ctx.fillStyle = hash2(f + i, 5) > .4 ? 'rgba(14,12,10,.55)' : 'rgba(250,247,238,.5)'; ctx.beginPath(); ctx.ellipse(dx, dy, rr * 1.6, rr, hash2(i, f) * 3, 0, Math.PI * 2); ctx.fill(); } }
  vineta(o.vineta ?? .62, o.vinetaCol || '0,0,0', .3);
  ctx.restore();
  // borde interior suave de la ventanilla
  ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 16; ctx.filter = 'blur(6px)'; ctx.beginPath(); ctx.roundRect(gate.x, gate.y, gate.w, gate.h, gate.r || 30); ctx.stroke(); ctx.restore();
}
// Cortinas de terciopelo de un cine: abre 0 (cerradas) → 1 (abiertas), con luz de candilejas.
function cortinas(abre, o = {}) {
  const { col = '#5a1018', col2 = '#2a0508', luz = 'rgba(255,214,150,.22)', minimo = 70 } = o;
  for (const lado of [-1, 1]) {
    const ancho = lerp(W / 2 + 10, minimo, aterriza(abre)), x0 = lado < 0 ? 0 : W - ancho;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, ancho, H); ctx.clip();
    ctx.fillStyle = col2; ctx.fillRect(x0, 0, ancho, H);
    const pliegues = Math.max(2, Math.round(ancho / 70));
    for (let i = 0; i < pliegues; i++) { const xa = x0 + i / pliegues * ancho, wf = ancho / pliegues;
      const g = ctx.createLinearGradient(xa, 0, xa + wf, 0); g.addColorStop(0, col2); g.addColorStop(.45, col); g.addColorStop(1, col2);
      ctx.fillStyle = g; ctx.fillRect(xa, 0, wf + 1, H); }
    const g2 = ctx.createLinearGradient(0, H, 0, H * .55); g2.addColorStop(0, luz); g2.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g2; ctx.fillRect(x0, 0, ancho, H);
    ctx.restore();
  }
}
// Bloom: achica la capa emisiva, la desenfoca y la suma (lighter). Barato y determinista.
const _BLOOM = {};
function bloom(fuente, fuerza = .8, radio = 18, escala = 4) {
  const w = Math.ceil(W / escala), h = Math.ceil(H / escala), k = w + 'x' + h;
  if (!_BLOOM[k]) _BLOOM[k] = [hacerCapa(w, h), hacerCapa(w, h)];
  const [a, b] = _BLOOM[k], pa = a.getContext('2d'), pb = b.getContext('2d');
  pa.clearRect(0, 0, w, h); pa.drawImage(fuente, 0, 0, w, h);
  pb.clearRect(0, 0, w, h); pb.filter = `blur(${radio / escala}px)`; pb.drawImage(a, 0, 0); pb.filter = 'none';
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fuerza; ctx.imageSmoothingEnabled = true;
  ctx.drawImage(b, 0, 0, W, H); ctx.globalAlpha = fuerza * .5; pb.filter = `blur(${radio * 2.5 / escala}px)`; pb.drawImage(a, 0, 0); pb.filter = 'none'; ctx.drawImage(b, 0, 0, W, H);
  ctx.restore();
}
// Pasada de cinta (VHS/CRT) SUAVE sobre lo que ya está en el ctx: corrimiento de croma, líneas finas, ruido bajo, esquinas oscuras.
// o.lineas (bool) · o.croma px · o.ruido 0..1 · o.semilla
const _CINTA = {};
function pasadaCinta(t, o = {}) {
  const { lineas = true, croma = 4, ruido = .05, esquinas = .5, banda = null } = o;
  if (!_CINTA.copia) { _CINTA.copia = hacerCapa(); _CINTA.lin = hacerCapa(); const p = _CINTA.lin.getContext('2d');
    for (let y = 0; y < H; y += 4) { p.fillStyle = 'rgba(0,0,0,.16)'; p.fillRect(0, y + 2, W, 2); }
    _CINTA.ruido = []; for (let s = 0; s < 4; s++) { const c = hacerCapa(270, 480), q = c.getContext('2d'), r = rng(70 + s); const im = q.createImageData(270, 480);
      for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } q.putImageData(im, 0, 0); _CINTA.ruido.push(c); } }
  const cp = _CINTA.copia.getContext('2d'); cp.clearRect(0, 0, W, H); cp.drawImage(ctx.canvas, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (croma) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .16; ctx.filter = 'blur(3px)';
    ctx.drawImage(_CINTA.copia, croma, 0); ctx.filter = 'none'; ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .12; ctx.drawImage(_CINTA.copia, -croma * .5, 0); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  if (lineas) ctx.drawImage(_CINTA.lin, 0, 0);
  if (ruido) { ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = ruido; ctx.imageSmoothingEnabled = false; ctx.drawImage(_CINTA.ruido[Math.floor(t * 30) % 4], 0, 0, W, H); ctx.imageSmoothingEnabled = true; }
  if (banda) { const y = banda.y, hh = banda.h || 60; ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = banda.a ?? .5;
    ctx.drawImage(_CINTA.copia, 0, y, W, hh, 14, y, W, hh); ctx.globalAlpha = (banda.a ?? .5) * .5; ctx.drawImage(_CINTA.ruido[(Math.floor(t * 30) + 1) % 4], 0, 0, 270, 10, 0, y, W, hh * .4); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  if (esquinas) vineta(esquinas, '0,0,0', .42);
  ctx.restore();
}
