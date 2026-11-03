// ============================================================================
// MOTOR «cine-impresion» · impresión y grabado (para estilos cine-*)
// Lo usan: cine-ukiyoe, cine-risograph, cine-halftone-dossier, cine-woodcut,
//          cine-engraving, cine-silkscreen-poster, cine-printed-long-take (y cine-papercut-red para el papel).
// Exporta (globales, todo determinista y pintado UNA vez donde es caro):
//   mk(w,h) · hexRGB · rgba(col,a) · mezcla(c1,c2,t) · campoRuido(w,h,celdas,semilla)
//   papelImpreso(color,{fibras,manchas,viñeta,verjurado,semilla}) → canvas W×H (washi, verjurado, cartulina)
//   fibrasEn(ctx,n,col,a,lw,semilla,largo)
//   TEXI.veta() (vetas de madera) · TEXI.baren() (frotado de baren) · TEXI.motas() (goma-zuri) · TEXI.revelado(k) (máscara 0..12)
//   entintar(canvas,{veta,baren,motas,ox,oy}) → bloque de color «impreso»
//   estampar(dst,src,revela,reg,desliz) → un bloque que entra con barrido de baren y cae en registro
//   bokashi(ctx,x0,y0,x1,y1,col,a0,a1,{aspero,semilla,col2}) → degradado limpiado a mano, píxel por píxel
//   kasumi(ctx,cx,cy,w,h,col,a) → banda de niebla
//   semitono(ctx,{x0,y0,x1,y1,paso,angulo,k,dens,col}) → puntos de semitono en retícula girada
//   hendidura(ctx,pts,w,{col,p,entrada,salida,semilla}) → corte de gubia (entrada roma, salida en punta, borde astillado)
//   buril(ctx,pts,w,{col,p,wMin}) → línea de buril que se hincha y se afina
//   Trazos() → almacén de cortes con tiempo de inicio y duración: .agregar(tipo,pts,w,t0,dur,o) .dibujar(ctx,t)
//   sello(texto,tam,{col,semilla}) → canvas de sello rojo con bordes mordidos
//   registro(semilla,amp) → [dx,dy] fijo por plancha
// Técnica adaptada de lemo-opuscar (MIT, © 2026 LemoLab): print.js de ukiyoe (washi, veta, baren, goma-zuri,
// bokashi por píxel, revelado), riso.js (planchas, sobreimpresión), knife.js/hatch.js de woodcut (cortes),
// burin.js de engraving (ley de hinchado), silk.js de silkscreen (tintas opacas, registro).
// Solo canvas 2D. Nada de Math.random ni Date.
// ============================================================================
function mk(w = W, h = H) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
const hexRGB = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const rgba = (s, a = 1) => { const [r, g, b] = hexRGB(s); return `rgba(${r},${g},${b},${a})`; };
const mezcla = (s1, s2, t) => { const a = hexRGB(s1), b = hexRGB(s2); return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join(''); };

// ruido de valor en retícula (fbm) para texturas: devuelve Float32Array w×h en 0..1
function campoRuido(w, h, celdas, semilla, pesos) {
  const out = new Float32Array(w * h); let tot = 0;
  celdas.forEach((cell, n) => {
    const R = rng(semilla + n * 101), gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = R();
    const wt = pesos ? pesos[n] : 1 / (n + 1); tot += wt;
    for (let y = 0; y < h; y++) { const fy = y / cell, iy = fy | 0, ty = fy - iy, sy = ty * ty * (3 - 2 * ty);
      for (let x = 0; x < w; x++) { const fx = x / cell, ix = fx | 0, tx = fx - ix, sx = tx * tx * (3 - 2 * tx), o = iy * gw + ix;
        const a = g[o], b = g[o + 1], c = g[o + gw], d = g[o + gw + 1], top = a + (b - a) * sx;
        out[y * w + x] += (top + ((c + (d - c) * sx) - top) * sy) * wt; } }
  });
  for (let k = 0; k < out.length; k++) out[k] /= tot;
  return out;
}

function fibrasEn(x, n, col, a, lw, semilla, largo = 60, ancho = W, alto = H) {
  const R = rng(semilla); x.save(); x.strokeStyle = col; x.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    let px = R() * ancho, py = R() * alto, ang = R() * 6.283; const L = largo * (.3 + R());
    x.globalAlpha = a * (.4 + R() * .6); x.lineWidth = lw * (.5 + R()); x.beginPath(); x.moveTo(px, py);
    for (let s = 0; s < 5; s++) { ang += (R() - .5) * .9; px += Math.cos(ang) * L / 5; py += Math.sin(ang) * L / 5; x.lineTo(px, py); }
    x.stroke();
  }
  x.restore();
}

// papel: base con manchas suaves (fbm chico agrandado), fibras, motitas y viñeta cálida. Se pinta una vez.
function papelImpreso(color, o = {}) {
  const { fibras = 1, manchas = 22, viñeta = .16, verjurado = false, semilla = 11, motitas = 70 } = o;
  const c = mk(), x = c.getContext('2d'), w = 270, h = 480, m = campoRuido(w, h, [90, 30, 9, 3], semilla);
  const sm = mk(w, h), sx = sm.getContext('2d'), id = sx.createImageData(w, h), [r, g, b] = hexRGB(color);
  for (let i = 0; i < w * h; i++) { const v = (m[i] - .5) * manchas; id.data[i * 4] = r + v; id.data[i * 4 + 1] = g + v * .95; id.data[i * 4 + 2] = b + v * .8; id.data[i * 4 + 3] = 255; }
  sx.putImageData(id, 0, 0); x.imageSmoothingQuality = 'high'; x.drawImage(sm, 0, 0, W, H);
  if (verjurado) { x.save(); x.globalAlpha = .05; x.fillStyle = '#5a4630'; for (let y = 0; y < H; y += 6) x.fillRect(0, y, W, 1.2); x.globalAlpha = .07; for (let X = 40; X < W; X += 150) x.fillRect(X, 0, 2, H); x.restore(); }
  if (fibras) { fibrasEn(x, 5200 * fibras, '#fbf6e9', .30, 1, semilla + 7); fibrasEn(x, 1500 * fibras, '#c7b893', .16, .8, semilla + 8); fibrasEn(x, 160 * fibras, '#f9f3e3', .35, 1.6, semilla + 9, 140); }
  const R = rng(semilla + 5); for (let i = 0; i < motitas; i++) { x.fillStyle = `rgba(150,110,60,${.03 + R() * .06})`; x.beginPath(); x.arc(R() * W, R() * H, .6 + R() * 2.2, 0, 6.283); x.fill(); }
  if (viñeta) { const gr = x.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1250); gr.addColorStop(0, 'rgba(150,108,55,0)'); gr.addColorStop(1, `rgba(150,108,55,${viñeta})`); x.fillStyle = gr; x.fillRect(0, 0, W, H); }
  return c;
}

// ---------- texturas de impresión (perezosas: se construyen la primera vez que se piden) ----------
const TEXI = (() => {
  const cache = {};
  return {
    // vetas: líneas de nivel de un campo de ruido torcido (anillos de crecimiento) + bandas anchas
    veta() { if (cache.veta) return cache.veta;
      const w = W / 2, h = H / 2, m = campoRuido(w / 2, h / 2, [80, 24, 7], 41, [1, .45, .2]), c = mk(w, h), x = c.getContext('2d'), id = x.createImageData(w, h);
      const nudos = [[120, 160], [400, 520], [180, 760], [440, 90]];
      for (let y = 0; y < h; y++) for (let X = 0; X < w; X++) {
        const i = y * w + X, mv = m[(y >> 1) * (w / 2) + (X >> 1)];
        let u = y * .07 + mv * 9 + Math.sin(X * .0042) * 1.4;
        for (const [kx, ky] of nudos) { const d = Math.hypot((X - kx) * .5, y - ky); u += 2.2 * Math.exp(-d * d / 1250); }
        const f = u - Math.floor(u), d = Math.abs(f - .5) * 2, ln = d > .8 ? Math.pow((d - .8) / .2, 1.6) : 0, band = .5 + .5 * Math.sin(u * .9);
        id.data[i * 4] = 24; id.data[i * 4 + 1] = 20; id.data[i * 4 + 2] = 30; id.data[i * 4 + 3] = (ln * .85 + band * .28) * 255;
      }
      x.putImageData(id, 0, 0); const big = mk(), bx = big.getContext('2d'); bx.drawImage(c, 0, 0, W, H); return cache.veta = big; },
    // baren: arcos de presión difuminados + frotes en zigzag (se usan con destination-out → tinta despareja)
    baren() { if (cache.baren) return cache.baren;
      const c = mk(), x = c.getContext('2d'), R = rng(61); x.filter = 'blur(7px)'; x.lineCap = 'round';
      for (let i = 0; i < 300; i++) { const cx = R() * W, cy = R() * H, r = 40 + R() * 170, a0 = R() * 6.283;
        x.strokeStyle = `rgba(0,0,0,${.05 + R() * .12})`; x.lineWidth = 14 + R() * 40; x.beginPath(); x.arc(cx, cy, r, a0, a0 + 1 + R() * 3.5); x.stroke(); }
      for (let i = 0; i < 90; i++) { let px = R() * W, py = R() * H; x.strokeStyle = `rgba(0,0,0,${.04 + R() * .08})`; x.lineWidth = 20 + R() * 30; x.beginPath(); x.moveTo(px, py);
        for (let k = 0; k < 6; k++) { px += 60 + R() * 80; py += (k % 2 ? 1 : -1) * (30 + R() * 50); x.lineTo(px, py); } x.stroke(); }
      x.filter = 'none'; return cache.baren = c; },
    // goma-zuri: motitas donde la tinta no agarró (destination-out)
    motas() { if (cache.motas) return cache.motas;
      const w = W / 2, h = H / 2, m = campoRuido(w, h, [60, 16], 31), R = rng(32), c = mk(w, h), x = c.getContext('2d'), id = x.createImageData(w, h);
      for (let i = 0; i < w * h; i++) { const p = .02 + .32 * Math.pow(m[i], 3.5); id.data[i * 4 + 3] = R() < p ? 90 + R() * 140 : 0; }
      x.putImageData(id, 0, 0); const big = mk(), bx = big.getContext('2d'); bx.drawImage(c, 0, 0, W, H); return cache.motas = big; },
    // máscaras de revelado (barrido diagonal de baren con borde ruidoso), 13 niveles
    revelado(k) { if (!cache.rev) { const w = 270, h = 480, m = campoRuido(w, h, [60, 20, 6, 2], 51, [1, .7, .45, .35]); cache.rev = [];
        for (let n = 0; n <= 12; n++) { const thr = 1.35 - n / 12 * 1.75, c = mk(w, h), x = c.getContext('2d'), id = x.createImageData(w, h);
          for (let i = 0; i < w * h; i++) { const X = i % w, Y = (i / w) | 0, v = 1 - (X / w * .45 + Y / h * .55) + (m[i] - .5) * .55; id.data[i * 4 + 3] = clamp((v - thr) / .06) * 255; }
          x.putImageData(id, 0, 0); cache.rev.push(c); } }
      return cache.rev[clamp(k | 0, 0, 12)]; },
    tmp(n = 0) { const k = 'tmp' + n; return cache[k] || (cache[k] = mk()); },
  };
})();

function entintar(c, o = {}) {
  const { veta = 0, baren = 0, motas = .3, ox = 0, oy = 0 } = o, x = c.getContext('2d'); x.save();
  if (veta) { x.globalCompositeOperation = 'source-atop'; x.globalAlpha = veta; x.drawImage(TEXI.veta(), ox, oy); x.drawImage(TEXI.veta(), ox - W, oy); }
  if (baren) { x.globalCompositeOperation = 'destination-out'; x.globalAlpha = baren; x.drawImage(TEXI.baren(), ox * .5, oy * .5); }
  if (motas) { x.globalCompositeOperation = 'destination-out'; x.globalAlpha = motas; x.drawImage(TEXI.motas(), 0, 0); }
  x.restore(); return c;
}

// un bloque (canvas W×H) que se imprime: revela 0→1 con barrido de baren y se desliza `desliz` px hasta su registro `reg`
function estampar(dst, src, revela = 1, reg = [0, 0], desliz = [5, -4]) {
  if (revela <= 0) return;
  if (revela >= 1) { dst.drawImage(src, reg[0], reg[1]); return; }
  const t = TEXI.tmp(7), x = t.getContext('2d'), e = 1 - easeOut(clamp(revela * 1.6));
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'copy'; x.drawImage(src, reg[0] + desliz[0] * e, reg[1] + desliz[1] * e);
  x.globalCompositeOperation = 'destination-in'; x.imageSmoothingEnabled = true; x.drawImage(TEXI.revelado(Math.floor(revela * 12.999)), 0, 0, W, H);
  x.globalCompositeOperation = 'source-over'; dst.drawImage(t, 0, 0);
}

// bokashi: degradado hecho a mano; el borde de arriba se pasea con ruido por columna (nunca tiras de fillRect)
function bokashi(x, x0, y0, x1, y1, col, a0, a1, o = {}) {
  const { aspero = 24, semilla = 3, col2 } = o;
  const X0 = Math.max(0, Math.floor(x0)), X1 = Math.min(W, Math.ceil(x1));
  const Y0 = Math.max(0, Math.floor(Math.min(y0, y1) - aspero * 1.4)), Y1 = Math.min(H, Math.ceil(Math.max(y0, y1) + aspero * 1.4));
  const w = X1 - X0, h = Y1 - Y0; if (w <= 0 || h <= 0) return;
  const c = mk(w, h), cx = c.getContext('2d'), id = cx.createImageData(w, h), d = id.data, A = hexRGB(col), B = hexRGB(col2 || col);
  for (let i = 0; i < w; i++) { const X = X0 + i, off = (vnoise(X * .006 + semilla, 1) - .5) * 2 * aspero + (vnoise(X * .03 + semilla * 5, 2) - .5) * aspero * .35;
    for (let j = 0; j < h; j++) { let u = (Y0 + j - (y0 + off)) / (y1 - y0); u = u < 0 ? 0 : u > 1 ? 1 : u;
      const k = (j * w + i) * 4; d[k] = A[0] + (B[0] - A[0]) * u; d[k + 1] = A[1] + (B[1] - A[1]) * u; d[k + 2] = A[2] + (B[2] - A[2]) * u; d[k + 3] = (a0 + (a1 - a0) * u) * 255; } }
  cx.putImageData(id, 0, 0); x.drawImage(c, X0, Y0);
}
function kasumi(x, cx, cy, w, h, col, a = 1) {
  x.save(); const g = x.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  g.addColorStop(0, rgba(col, 0)); g.addColorStop(.12, rgba(col, a)); g.addColorStop(.88, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  x.fillStyle = g; x.beginPath(); x.moveTo(cx - w / 2 + h / 2, cy - h / 2); x.lineTo(cx + w / 2 - h / 2, cy - h / 2); x.arc(cx + w / 2 - h / 2, cy, h / 2, -Math.PI / 2, Math.PI / 2);
  x.lineTo(cx - w / 2 + h / 2, cy + h / 2); x.arc(cx - w / 2 + h / 2, cy, h / 2, Math.PI / 2, Math.PI * 1.5); x.fill(); x.restore();
}

// semitono: círculos en una retícula girada; radio = dens(x,y) × paso × k (con k ≈ .7 los puntos se juntan en tinta llena)
function semitono(x, o) {
  const { x0 = 0, y0 = 0, x1 = W, y1 = H, paso = 22, angulo = .26, k = .68, dens, col = '#111', minR = .6 } = o;
  const ca = Math.cos(angulo), sa = Math.sin(angulo), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + paso;
  x.save(); x.fillStyle = col; x.beginPath();
  for (let v = -R; v <= R; v += paso) for (let u = -R; u <= R; u += paso) {
    const px = cx + u * ca - v * sa, py = cy + u * sa + v * ca; if (px < x0 - paso || px > x1 + paso || py < y0 - paso || py > y1 + paso) continue;
    const r = clamp(dens(px, py)) * paso * k; if (r < minR) continue; x.moveTo(px + r, py); x.arc(px, py, r, 0, 6.283);
  }
  x.fill(); x.restore();
}

// ---------- cortes ----------
// contorno (izq/der) de una línea con ancho por punto
function contornoTrazo(pts, ws) {
  const L = [], Rr = [], n = pts.length;
  for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, h = ws[i] / 2;
    L.push([pts[i][0] - dy / l * h, pts[i][1] + dx / l * h]); Rr.push([pts[i][0] + dy / l * h, pts[i][1] - dx / l * h]); }
  return [L, Rr];
}
function rellenarTrazo(x, pts, ws, col, p = 1) {
  const n = Math.max(2, Math.round(pts.length * clamp(p))); if (p <= 0 || pts.length < 2) return;
  const [L, Rr] = contornoTrazo(pts.slice(0, n), ws.slice(0, n));
  x.fillStyle = col; x.beginPath(); x.moveTo(L[0][0], L[0][1]); for (const q of L) x.lineTo(q[0], q[1]);
  for (let i = Rr.length - 1; i >= 0; i--) x.lineTo(Rr[i][0], Rr[i][1]); x.closePath(); x.fill();
}
// gubia: entrada roma, panza, salida en punta, borde astillado (el ancho tiembla por punto, fijo por semilla)
function perfilGubia(n, w, semilla = 1, entrada = .12, salida = .4) {
  const ws = []; for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) : 0;
    const e = u < entrada ? .55 + .45 * (u / entrada) : 1, s = u > 1 - salida ? Math.pow((1 - u) / salida, .8) : 1;
    ws.push(w * e * s * (1 + (hash2(i, semilla * 7) - .5) * .35)); }
  return ws;
}
function hendidura(x, pts, w, o = {}) { const ws = perfilGubia(pts.length, w, o.semilla || 1, o.entrada, o.salida); rellenarTrazo(x, pts, ws, o.col || '#efe8d8', o.p ?? 1); }
// buril: ancho × (0.2 + 0.8·sin(πu)^0.7), afinado en el primer y último 22 %
function perfilBuril(n, w, wMin = .15) {
  const ws = []; for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) : 0; let k = .2 + .8 * Math.pow(Math.sin(Math.PI * u), .7);
    if (u < .22) k *= u / .22; if (u > .78) k *= (1 - u) / .22; ws.push(Math.max(wMin, w * k)); }
  return ws;
}
function buril(x, pts, w, o = {}) { rellenarTrazo(x, pts, perfilBuril(pts.length, w, o.wMin), o.col || '#1c1510', o.p ?? 1); }

// almacén de cortes con tiempo: cada uno se corta a velocidad constante desde t0 durante dur s
function Trazos() {
  const lista = []; let fin = 0, foto = null, fotoClave = '';
  return {
    lista,
    agregar(tipo, pts, w, t0, dur, o = {}) {
      const ws = tipo === 'buril' ? perfilBuril(pts.length, w, o.wMin) : tipo === 'linea' ? pts.map(() => w) : perfilGubia(pts.length, w, o.semilla || lista.length + 1, o.entrada, o.salida);
      lista.push({ pts, ws, t0, dur: Math.max(.02, dur), col: o.col }); fin = Math.max(fin, t0 + dur); return this;
    },
    get fin() { return fin; },
    dibujar(x, t, colDef = '#111') {
      if (t >= fin) {                                   // todo cortado: se copia de una foto hecha una vez
        const clave = colDef + lista.length;
        if (!foto || fotoClave !== clave) { foto = mk(); fotoClave = clave; const fx = foto.getContext('2d'); for (const s of lista) rellenarTrazo(fx, s.pts, s.ws, s.col || colDef, 1); }
        x.drawImage(foto, 0, 0); return;
      }
      for (const s of lista) { const p = (t - s.t0) / s.dur; if (p > 0) rellenarTrazo(x, s.pts, s.ws, s.col || colDef, Math.min(1, p)); }
    },
  };
}

// sello rojo con bordes mordidos: letras caladas en blanco sobre bermellón
function sello(texto, tam, o = {}) {
  const { col = '#b8412f', semilla = 3, fuente = '"Hiragino Mincho ProN", "Big Caslon", serif' } = o;
  const c = mk(tam, tam), x = c.getContext('2d'), R = rng(semilla);
  x.fillStyle = col; x.beginPath(); const n = 40;
  for (let i = 0; i < n; i++) { const u = i / n, lado = Math.floor(u * 4), f = u * 4 - lado, m = tam * .06, j = (R() - .5) * tam * .025;
    const P = [[m + f * (tam - 2 * m), m + j], [tam - m + j, m + f * (tam - 2 * m)], [tam - m - f * (tam - 2 * m), tam - m + j], [m + j, tam - m - f * (tam - 2 * m)]][lado];
    i ? x.lineTo(P[0], P[1]) : x.moveTo(P[0], P[1]); }
  x.closePath(); x.fill();
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
  const lineas = texto.split('\n'), s = tam * .74 / Math.max(lineas.length, Math.max(...lineas.map(l => l.length)) * .62);
  x.font = `700 ${s}px ${fuente}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  lineas.forEach((l, i) => x.fillText(l, tam / 2, tam / 2 + (i - (lineas.length - 1) / 2) * s * 1.05));
  x.lineWidth = tam * .035; x.strokeStyle = '#000'; x.strokeRect(tam * .14, tam * .14, tam * .72, tam * .72);
  for (let i = 0; i < 18; i++) { x.globalAlpha = .3 + R() * .4; x.beginPath(); x.arc(R() * tam, R() * tam, R() * tam * .015, 0, 6.283); x.fill(); }
  return c;
}
const registro = (semilla, amp = 2) => [(hash2(semilla, 1) - .5) * 2 * amp, (hash2(semilla, 2) - .5) * 2 * amp];
