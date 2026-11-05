// efectos-extra.js — piezas de lienzo de «Auto Edit Effects» (complemento de auto-edicion).
// Ingeniería inversa de 3 reels (2-nov-2026): @corbinsylk DeuQkT1BzGV y DezeMvbTjl4, Bruno Media DfHzFaoAw29.
// scripts/video.mjs de auto-edicion lo inyecta después de motor/efectos.js, así que usa su kit: ctx, W, H, C, tx, rr, hueco,
// detras, frente, dicho, fotoCover, PLANO, PALABRAS, EFX.
// Reglas de la casa: todo plano y OPACO sobre el verde; nada tiembla ni rebota; lo que entra lo hace cuando se dice (corte seco o
// frenado seco); sin brillos, sin degradados 3D, sin «liquid glass»; cifras SOLO las que se dicen.
const FX2 = {
  crema: '#F3EEE4', papel: '#EDECE8', tinta: '#141414', rojo: '#E8412C', verdeOk: '#34C759', violeta: '#6B4EFF', lila: '#ECE8FF',
  azulNoche: '#0B1B3A', azul: '#2F6BFF', amarillo: '#F2B531', mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
  cond: 'Anton, "Bricolage Grotesque", Impact, sans-serif',
};
const fx2 = {
  clamp: (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)),
  frena: u => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 4),            // sale rápido y frena seco, sin rebote
  ultimo: (lista, t) => { let r = null; for (const it of lista) if (t >= dicho(it[0])) r = it; return r; },   // el último ítem ya dicho
  miles: n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
  rnd: s => () => (s = (s * 16807) % 2147483647) / 2147483647,           // aleatorio con semilla: el mismo cuadro sale igual siempre
  caja: (x, y, w, h, r, color) => { ctx.save(); ctx.fillStyle = color; rr(x, y, w, h, r); ctx.fill(); ctx.restore(); },
  ancho: (s, tam, peso = 700, fam = C.sans) => { ctx.save(); ctx.font = `${peso} ${tam}px ${fam}`; const w = ctx.measureText(s).width; ctx.restore(); return w; },
};

// ---------- 1 · Palabra ancla (match-cut): recortes de texto que cambian RÁPIDO detrás y UNA palabra fija en su recuadro (persona "oculta") ----------
// textos = [[k, 'texto real que contiene la palabra'], …] (desde el primer k) · o.palabra · o.cada (s por recorte, .22) · o.color
// La página cambia cada o.cada con corte seco (como la referencia: 4–5 recortes por segundo); la palabra no se mueve ni un píxel.
const _ancla = [   // estilos de recorte: fondo, letra, peso, tamaño, color de tinta
  ['#F4EFE4', C.diseno, 400, 92, '#1E1B17'], ['#FFFFFF', C.sans, 600, 70, '#222'], ['#E9E4D8', 'Georgia, serif', 400, 78, '#2B2620'],
  ['#F7F6F2', C.sans, 800, 64, '#111'], ['#EFE9DC', 'italic ' + C.diseno, 400, 96, '#2A251F'], ['#FBFAF7', 'Georgia, serif', 700, 70, '#1A1A1A'],
];
function palabraAncla(textos, t, o = {}) {
  const pal = o.palabra || 'Claude', t0 = dicho(textos[0][0]), cada = o.cada ?? .22;
  const n = Math.max(0, Math.floor((t - t0) / cada)), [bg, fam0, peso, tam, tinta] = _ancla[n % _ancla.length];
  const todas = textos.map(x => x[1]).join(' ').split(/\s+/).filter(w => w.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase() !== pal.toLowerCase());
  const giro = (n * 7) % todas.length, pals = todas.slice(giro).concat(todas.slice(0, giro));
  const fam = fam0.replace(/^italic /, ''), it2 = /^italic /.test(fam0);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const lh = tam * 1.22, cy = H / 2;
  // la palabra fija: SIEMPRE el mismo recuadro, la misma letra y el mismo lugar
  const tamP = 104, wP = fx2.ancho(pal, tamP, 800) + 64, hP = 150;
  ctx.save(); ctx.font = `${it2 ? 'italic ' : ''}${peso} ${tam}px ${fam}`; ctx.fillStyle = tinta; ctx.textBaseline = 'middle';
  let w = 0; const linea = () => { const out = []; let ancho = 0; while (ancho < W + 400) { const x = pals[w++ % pals.length]; out.push(x); ancho += ctx.measureText(x + ' ').width; } return out.join(' '); };
  for (let l = -9; l <= 9; l++) { if (l === 0) continue; const d = Math.abs(l);
    ctx.filter = d >= 2 ? `blur(${Math.min(9, (d - 1) * 2.2)}px)` : 'none'; ctx.globalAlpha = d >= 2 ? .8 : 1;
    ctx.textAlign = 'left'; ctx.fillText(linea(), -((n * 53 + l * 31) % 220), cy + Math.sign(l) * (hP / 2 + 14 + (d - .5) * lh)); }   // ningún renglón toca el recuadro
  ctx.filter = 'none'; ctx.globalAlpha = 1;
  ctx.textAlign = 'right'; ctx.fillText(linea().split(' ').slice(0, 6).join(' '), W / 2 - wP / 2 - 18, cy);
  ctx.textAlign = 'left'; ctx.fillText(linea(), W / 2 + wP / 2 + 18, cy); ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1150); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.42)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);   // viñeta: el ojo va al centro
  fx2.caja(W / 2 - wP / 2, cy - hP / 2, wP, hP, 14, o.color || FX2.rojo);
  ctx.save(); ctx.font = `800 ${tamP}px ${C.sans}`; ctx.fillStyle = '#FFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pal, W / 2, cy + 4); ctx.restore();
}

// ---------- 2 · Fotos que se tachan (shutter-strike): tarjetas de foto entran y una línea las tacha (persona abajo) ----------
// fotos = [[k, img], …] (fotos REALES) · o.tachar = k (palabra en que se tacha) · o.corte (alto del panel, 960) · o.rotulo
function fotosTachadas(fotos, t, o = {}) {
  const Y = o.corte ?? 960;
  ctx.fillStyle = FX2.papel; ctx.fillRect(0, 0, W, Y); hueco(0, Y, W, H - Y);
  const sitios = [[0, 290, 560], [0, 790, 560], [0, 540, 600], [0, 290, 640], [0, 790, 640]];
  fotos.forEach(([k, im], i) => { if (t < dicho(k)) return;
    const [g, x, y] = sitios[i % sitios.length], w = 300, h = 380;
    ctx.save(); ctx.translate(x, y); ctx.rotate(g * Math.PI / 180);
    ctx.fillStyle = 'rgba(0,0,0,.10)'; rr(-w / 2 + 6, -h / 2 + 10, w, h, 18); ctx.fill();
    ctx.fillStyle = '#FFF'; rr(-w / 2, -h / 2, w, h, 18); ctx.fill();
    ctx.save(); rr(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 10); ctx.clip(); if (im) fotoCover(im, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, .5, .4); ctx.restore();
    ctx.restore(); });
  if (o.rotulo && fotos.length && t >= dicho(fotos[0][0])) tx(o.rotulo, W / 2, o.yRotulo ?? 270, 54, 800, FX2.tinta, 'center', C.golpe);
  if (o.tachar != null && t >= dicho(o.tachar)) {   // la línea se traza en 0,25 s y se queda (sin vibrar)
    const u = fx2.frena((t - dicho(o.tachar)) / .25);
    ctx.save(); ctx.strokeStyle = FX2.rojo; ctx.lineWidth = 22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(140, 760); ctx.lineTo(140 + (800 * u), 760 - 420 * u); ctx.stroke(); ctx.restore();
  }
}

// ---------- 3 · Pantalla LED (screen-push-digital): cada palabra dicha en matriz de puntos, a pantalla completa (persona "oculta") ----------
// palabras = [[k, 'texto'], …] · o.color (puntos encendidos) · o.celda (14 px)
const _led = {};
function pantallaLed(palabras, t, o = {}) {
  const it = fx2.ultimo(palabras, t); ctx.fillStyle = '#11120F'; ctx.fillRect(0, 0, W, H);
  const cel = o.celda ?? 14, cols = Math.floor(W / cel), filas = Math.floor(H / cel);
  const clave = it ? it[1] + cel : '';
  if (it && !_led[clave]) {   // la palabra se dibuja una vez en un lienzo chico y se lee celda por celda
    const c = document.createElement('canvas'); c.width = cols; c.height = filas; const g = c.getContext('2d');
    let tam = filas * .24; g.font = `800 ${tam}px ${C.golpe}`; const w = g.measureText(it[1]).width; if (w > cols * .9) tam *= cols * .9 / w;
    g.font = `800 ${tam}px ${C.golpe}`; g.fillStyle = '#FFF'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it[1], cols / 2, filas / 2);
    _led[clave] = g.getImageData(0, 0, cols, filas).data;
  }
  const d = it ? _led[clave] : null, on = o.color || '#E9E3CF';
  ctx.save();
  for (let y = 0; y < filas; y++) for (let x = 0; x < cols; x++) {
    const a = d ? d[(y * cols + x) * 4 + 3] / 255 : 0;
    ctx.fillStyle = a > .35 ? on : '#22241F'; ctx.beginPath(); ctx.arc(x * cel + cel / 2, y * cel + cel / 2, a > .35 ? cel * .42 : cel * .3, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// ---------- 4 · Tarjeta con curva (liquid-glass-graph, versión plana): tarjeta oscura delante del pecho con curva que sube (persona completa) ----------
// o.tA, o.tB (s) · o.de, o.a (cifra DICHA) · o.sufijo ('%') · o.rotulo ('RETENCIÓN') · o.titulo (encima) · o.x, o.y, o.w, o.h
function tarjetaCurva(t, o = {}) {
  hueco(0, 0, W, H); if (t < o.tA) return;
  const x = o.x ?? 150, y = o.y ?? 1060, w = o.w ?? 780, h = o.h ?? 430, u = fx2.clamp((t - o.tA) / ((o.tB ?? o.tA + 1.2) - o.tA));
  if (o.titulo) { CONTORNO = .08; tx(o.titulo, x + w / 2, y - 34, 50, 700, '#FFF'); CONTORNO = 0; }
  fx2.caja(x, y, w, h, 34, '#141516'); ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2; rr(x, y, w, h, 34); ctx.stroke(); ctx.restore();
  tx(o.rotulo || 'RETENCIÓN', x + 40, y + 62, 24, 600, 'rgba(255,255,255,.45)', 'left', FX2.mono);
  const v = (o.de ?? 0) + ((o.a ?? 100) - (o.de ?? 0)) * fx2.frena(u);
  tx(Math.round(v) + '', x + w - 70, y + 92, 84, 800, '#FFF', 'right'); tx(o.sufijo ?? '%', x + w - 40, y + 92, 40, 700, '#FFF', 'right');
  const px = s => x + 50 + s * (w - 100), py = s => y + h - 60 - (h - 200) * (.08 + .92 * Math.pow(s, 1.7));
  ctx.save(); ctx.strokeStyle = '#2FD06B'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath();
  const fin = fx2.frena(u); for (let s = 0; s <= fin + 1e-4; s += .02) s === 0 ? ctx.moveTo(px(s), py(s)) : ctx.lineTo(px(s), py(s)); ctx.stroke();
  ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(px(fin), py(fin), 13, 0, 7); ctx.fill(); ctx.restore();
}

// ---------- 5 · Partículas en la caja (screen-push): bolitas que caen y llenan una caja (persona abajo) ----------
// o.tA (s, empiezan a caer) · o.palabras = [[k, 'texto bajo la caja'], …] · o.corte (960) · o.color
function particulasCaja(t, o = {}) {
  const Y = o.corte ?? 960; ctx.fillStyle = FX2.papel; ctx.fillRect(0, 0, W, Y); hueco(0, Y, W, H - Y);
  const bw = 380, bx = W / 2 - bw / 2, by = Y - 120 - bw, r = 11, paso = 22, cols = Math.floor((bw - 8) / paso), filas = Math.floor((bw - 8) / paso);
  const rnd = fx2.rnd(11), n = cols * filas, extra = 160, cada = o.cada ?? .0045, g = 5200;
  const tA = o.tA ?? 0, color = o.color || '#D9341F';
  ctx.save(); ctx.fillStyle = color;
  for (let i = 0; i < n + extra; i++) {
    const nace = tA + i * cada, x0 = W / 2 + (rnd() - .5) * 120, dx = rnd(); if (t < nace) continue;
    const dt = t - nace;
    let x, y;
    if (i < n) {   // cae a su lugar: de abajo hacia arriba
      const fila = filas - 1 - Math.floor(i / cols), col = i % cols, tx_ = bx + 4 + paso / 2 + ((col * 7) % cols) * paso, ty = by + 4 + paso / 2 + fila * paso;
      const caida = Math.sqrt(2 * (ty + 30) / g), u = fx2.clamp(dt / caida);
      x = x0 + (tx_ - x0) * u; y = -30 + .5 * g * Math.min(dt, caida) ** 2; if (u >= 1) { x = tx_; y = ty; }
    } else {         // la caja se llenó: rebalsa por los costados
      const lado = dx < .5 ? -1 : 1; y = -30 + .5 * g * dt * dt; x = x0 + (y > by - 20 ? lado * (y - by + 20) * (.5 + dx) : 0);
      if (y > Y + 20) continue;
    }
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  ctx.restore();
  ctx.save(); ctx.strokeStyle = FX2.tinta; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bw); ctx.lineTo(bx + bw, by + bw); ctx.lineTo(bx + bw, by); ctx.stroke(); ctx.restore();
  tx('01', bx - 40, by + bw / 2, 22, 600, FX2.rojo, 'center', FX2.mono); tx('03', bx + bw + 40, by + bw / 2, 22, 600, FX2.rojo, 'center', FX2.mono);
  tx('02', W / 2, by + bw + 36, 22, 600, FX2.rojo, 'center', FX2.mono);
  const p = fx2.ultimo(o.palabras || [], t); if (p) tx(p[1], W / 2, by + bw + 88, 46, 700, FX2.rojo, 'center', FX2.mono);
}

// ---------- 6 · Prueba al lado de la cabeza (over-the-shoulder, SIN zoom): la tarjeta de la cifra aterriza junto a tu cara (persona completa) ----------
// tarjetas = [[k, 'ANTES', '$3.200', 'al mes'], …] (cifras DICHAS; la nueva reemplaza a la anterior) · o.lado ('der'|'izq')
function pruebaAlLado(tarjetas, t, o = {}) {
  hueco(0, 0, W, H); const it = fx2.ultimo(tarjetas, t); if (!it) return;
  const [k, rot, cifra, pie] = it, [cx, cy] = EFX.cara(), der = (o.lado ?? 'der') === 'der';
  const w = Math.max(300, fx2.ancho(cifra, 84, 800) + 70), h = 200, u = fx2.frena((t - dicho(k)) / .22);
  const x0 = der ? Math.min(cx + 200, W - 40 - w) : Math.max(40, cx - 200 - w), x = x0 + (der ? 1 : -1) * 260 * (1 - u), y = cy - 260 + 60 * (1 - u);
  fx2.caja(x, y, w, h, 26, '#FFF');   // derecha: nada torcido
  const rx = x + w / 2, ry = y + h / 2;
  tx(rot, rx - w / 2 + 34, ry - 46, 24, 800, FX2.rojo, 'left', FX2.mono);
  tx(cifra, rx - w / 2 + 30, ry + 34, 84, 800, FX2.rojo, 'left'); if (pie) tx(pie, rx - w / 2 + 34, ry + 76, 26, 600, '#666', 'left');
}

// ---------- 7 · Carrusel 3D (pov-carousel-spin, sin mano): tus reels en un anillo que gira un paso cada vez que dices algo (persona "oculta") ----------
// fotos = [img, …] (capturas REALES de tus reels) · o.pasos = [k, …] (cada k gira un lugar) · o.y (centro) · o.titulo
function carrusel3d(fotos, t, o = {}) {
  ctx.fillStyle = '#0E0E10'; ctx.fillRect(0, 0, W, H);
  const n = fotos.length, cy = o.y ?? 860, R = o.radio ?? 400, w = o.w ?? 400, h = o.h ?? 700;
  let giro = 0; (o.pasos || []).forEach(k => { giro += fx2.frena((t - dicho(k)) / .35); });
  const items = fotos.map((im, i) => { const a = (i - giro) / n * 2 * Math.PI; return { im, x: W / 2 + R * Math.sin(a), z: Math.cos(a) }; }).sort((a, b) => a.z - b.z);
  items.forEach(({ im, x, z }) => { const s = .55 + .45 * (z + 1) / 2, ww = w * s, hh = h * s;
    ctx.save(); ctx.fillStyle = '#FFF'; rr(x - ww / 2 - 5, cy - hh / 2 - 5, ww + 10, hh + 10, 24 * s); ctx.fill();
    rr(x - ww / 2, cy - hh / 2, ww, hh, 20 * s); ctx.clip(); if (im) fotoCover(im, x - ww / 2, cy - hh / 2, ww, hh, .5, .4);
    ctx.fillStyle = `rgba(14,14,16,${(1 - (z + 1) / 2) * .7})`; ctx.fillRect(x - ww / 2, cy - hh / 2, ww, hh); ctx.restore(); });
  if (o.titulo) tx(o.titulo, W / 2, cy + h / 2 + 140, 70, 800, '#FFF', 'center', C.golpe);
}

// ---------- 8 · Interruptores (apple-ui-toggles): una tarjeta con renglones y cada switch se prende cuando lo dices (persona completa) ----------
// items = [[k, 'Un prompt'], …] · o.desde (s, aparece la tarjeta con todo apagado) · o.x, o.y, o.w
function interruptores(items, t, o = {}) {
  hueco(0, 0, W, H); if (t < (o.desde ?? dicho(items[0][0]) - .3)) return;
  const x = o.x ?? 150, y = o.y ?? 1180, w = o.w ?? 780, fila = 112, h = 40 + fila * items.length;
  fx2.caja(x, y, w, h, 44, '#FFF');
  items.forEach(([k, s], i) => { const yy = y + 20 + fila * i + fila / 2;
    tx(s, x + 50, yy + 17, 48, 600, '#111', 'left');
    const u = fx2.frena((t - dicho(k)) / .15), sx = x + w - 170, sw = 116, sh = 66;
    fx2.caja(sx, yy - sh / 2, sw, sh, sh / 2, u > .5 ? FX2.verdeOk : '#E3E3E6');
    ctx.save(); ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(sx + sh / 2 + (sw - sh) * u, yy, sh / 2 - 5, 0, 7); ctx.fill(); ctx.restore();
    if (i < items.length - 1) { ctx.fillStyle = '#ECECEE'; ctx.fillRect(x + 50, yy + fila / 2 - 1, w - 100, 2); } });
}

// ---------- 9 · Widgets alrededor (efectos-motions / widgets cristal, versión plana): tarjetitas de datos a los lados de tu cara (persona completa) ----------
// ws = [{k, tipo:'cifra'|'barras'|'progreso'|'perfil'|'audio'|'anillo', lado:'izq'|'der', …}, …] (máx. 6, alternan izq/der si no dices el lado)
//   cifra {valor:'36', rotulo:'efectos'} · barras {rotulo, valores:[…]} · progreso {rotulo, tA, tB} · perfil {nombre, usuario, foto}
//   audio {rotulo} · anillo {texto:'4K', tA, tB}
// Cada tarjeta mide lo que su contenido (sin huecos), todas del mismo ancho, alineadas en dos columnas, derechas y sin girar.
function widgets(ws, t, o = {}) {
  hueco(0, 0, W, H);
  const AW = o.ancho ?? 330, alto = { cifra: 230, barras: 230, progreso: 118, perfil: 130, audio: 190, anillo: AW * .62 }, gap = 22;
  const col = { izq: o.y ?? 330, der: o.y ?? 330 }, M = 40;
  ws.slice(0, 6).forEach((wd, i) => {
    const lado = wd.lado || (i % 2 ? 'der' : 'izq'), h = alto[wd.tipo] || 140, x = lado === 'izq' ? M : W - M - AW, y = col[lado]; col[lado] += h + gap;
    if (t < dicho(wd.k)) return;
    const fit = (s, tam, peso, max) => { while (tam > 18 && fx2.ancho(s, tam, peso) > max) tam -= 2; return tam; };
    if (wd.tipo === 'anillo') {
      const tA = wd.tA ?? dicho(wd.k), u = fx2.frena((t - tA) / ((wd.tB ?? tA + 1) - tA)), cx = x + AW / 2, cy = y + h / 2, r = h / 2;
      ctx.save(); ctx.fillStyle = '#F6F4F0'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
      ctx.lineWidth = 14; ctx.strokeStyle = '#E4E0D8'; ctx.beginPath(); ctx.arc(cx, cy, r - 22, 0, 7); ctx.stroke();
      ctx.strokeStyle = FX2.verdeOk; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, r - 22, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * u); ctx.stroke(); ctx.restore();
      tx(wd.texto || '4K', cx, cy + 20, 56, 800, '#111'); return;
    }
    fx2.caja(x, y, AW, h, 28, '#F6F4F0'); const pad = 30, max = AW - 2 * pad;
    if (wd.tipo === 'cifra') { tx(wd.valor, x + pad, y + 140, fit(wd.valor, 130, 800, max), 800, '#111', 'left'); tx(wd.rotulo || '', x + pad, y + 194, fit(wd.rotulo || '', 32, 600, max), 600, '#555', 'left'); }
    if (wd.tipo === 'barras') { tx(wd.rotulo || '', x + pad, y + 52, fit(wd.rotulo || '', 28, 700, max), 700, '#333', 'left');
      const v = wd.valores || [3, 5, 8, 6, 9, 7, 4], mx = Math.max(...v), bw = max / v.length;
      v.forEach((b, j) => { const hh = (h - 100) * b / mx * fx2.frena((t - dicho(wd.k) - j * .05) / .3); fx2.caja(x + pad + j * bw, y + h - 26 - hh, bw - 8, hh, 6, j % 2 ? '#F08A4B' : FX2.rojo); }); }
    if (wd.tipo === 'progreso') { const tA = wd.tA ?? dicho(wd.k), u = fx2.clamp((t - tA) / ((wd.tB ?? tA + 2) - tA));
      ctx.fillStyle = FX2.rojo; ctx.beginPath(); ctx.arc(x + pad + 8, y + 44, 9, 0, 7); ctx.fill();
      tx(wd.rotulo || 'Listo', x + pad + 28, y + 55, fit(wd.rotulo || 'Listo', 32, 700, max - 28), 700, '#222', 'left');
      fx2.caja(x + pad, y + 80, max, 12, 6, '#E2DED6'); fx2.caja(x + pad, y + 80, Math.max(12, max * u), 12, 6, FX2.rojo); }
    if (wd.tipo === 'perfil') { tx(wd.nombre || '', x + pad, y + 60, fit(wd.nombre || '', 34, 800, max - 100), 800, '#111', 'left'); tx(wd.usuario || '', x + pad, y + 100, 24, 500, '#777', 'left');
      ctx.save(); ctx.beginPath(); ctx.arc(x + AW - 70, y + h / 2, 40, 0, 7); ctx.clip(); if (wd.foto) fotoCover(wd.foto, x + AW - 110, y + h / 2 - 40, 80, 80); else { ctx.fillStyle = '#DDD'; ctx.fill(); } ctx.restore(); }
    if (wd.tipo === 'audio') { fx2.caja(x + pad, y + 28, 52, 52, 12, FX2.rojo); tx(wd.rotulo || '', x + pad + 70, y + 64, fit(wd.rotulo || '', 30, 700, max - 70), 700, '#222', 'left');
      tx('◀◀', x + AW / 2 - 90, y + 148, 28, 800, '#222'); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x + AW / 2, y + 138, 30, 0, 7); ctx.fill(); tx('▶', x + AW / 2 + 3, y + 150, 28, 800, '#FFF'); tx('▶▶', x + AW / 2 + 90, y + 148, 28, 800, '#222'); }
  });
}

// ---------- 10 · Tier list: filas S–D y cada cosa cae en su fila cuando la nombras (persona completa, panel abajo) ----------
// items = [[k, 'S'|'A'|'B'|'C'|'D', img|'texto', colorDeFicha], …] · o.y (arriba del panel, 1080) · el título encima es el último nombrado
function tierList(items, t, o = {}) {
  hueco(0, 0, W, H); if (!items.length || t < dicho(items[0][0]) - .2) return;
  const filas = ['S', 'A', 'B', 'C', 'D'], col = ['#F47C7C', '#F8B67B', '#FADB7A', '#F3F08A', '#BEF08A'];
  const Y = o.y ?? 1100, fh = 150, x = 60, w = W - 120;
  fx2.caja(x - 16, Y - 16, w + 32, fh * 5 + 32, 24, '#111214');
  filas.forEach((f, i) => { fx2.caja(x, Y + i * fh + 4, 150, fh - 8, 10, col[i]); tx(f, x + 75, Y + i * fh + fh / 2 + 22, 64, 800, '#2A2A2A'); });
  const enFila = {}; items.forEach(([k, f, cosa, c]) => { if (t < dicho(k)) return;
    const n = (enFila[f] = (enFila[f] || 0) + 1) - 1, i = filas.indexOf(f), cx = x + 175 + n * 150, cy = Y + i * fh + 12;
    fx2.caja(cx, cy, 130, fh - 24, 16, typeof cosa === 'string' ? (c || '#2E2F33') : '#FFF');
    if (typeof cosa === 'string') tx(cosa, cx + 65, cy + (fh - 24) / 2 + 12, cosa.length > 7 ? 24 : 30, 800, '#FFF');
    else if (cosa) { ctx.save(); rr(cx + 8, cy + 8, 114, fh - 40, 12); ctx.clip(); fotoCover(cosa, cx + 8, cy + 8, 114, fh - 40, .5, .5); ctx.restore(); } });
  const ult = fx2.ultimo(items, t); if (ult) { CONTORNO = .1; tx(o.titulos?.[items.indexOf(ult)] ?? (typeof ult[2] === 'string' ? ult[2] : ''), W / 2, Y - 50, 92, 800, FX2.amarillo, 'center', C.golpe); CONTORNO = 0; }
}

// ---------- 11 · Barras con tus datos (split datos): «Mis 7 reels más vistos» arriba, tú abajo (persona abajo) ----------
// o.titulo = ['Mis 7 reels', 'más vistos'] · o.datos = [[k, 'Etiqueta', valor], …] (DATOS REALES) · o.corte (1000) · o.promedio (true)
function barrasSplit(t, o = {}) {
  const Y = o.corte ?? 1000; ctx.fillStyle = FX2.crema; ctx.fillRect(0, 0, W, Y); hueco(0, Y, W, H - Y);
  const [l1, l2] = o.titulo || ['Mis datos', 'reales'];
  tx(l1, 70, 150, 76, 800, '#111', 'left'); const w2 = fx2.ancho(l1.split(' ')[0] + ' ', 76, 800);
  tx(l2.split(' ')[0], 70, 236, 76, 800, '#111', 'left');
  const w0 = fx2.ancho(l2.split(' ')[0] + ' ', 76, 800); tx(l2.split(' ').slice(1).join(' '), 70 + w0, 236, 80, 400, FX2.rojo, 'left', 'italic ' + C.diseno);
  const datos = o.datos || [], mx = Math.max(...datos.map(d => d[2])) * 1.1, gx = 150, gw = W - 210, gy = 300, gh = Y - 420, bw = gw / Math.max(1, datos.length);
  ctx.fillStyle = '#D9D3C7'; ctx.fillRect(gx, gy + gh, gw, 3);
  const fmt = v => v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'K' : '' + v;
  [0, .5, 1].forEach(f => tx(fmt(mx / 1.1 * f), gx - 20, gy + gh - gh * f / 1.1 + 8, 22, 500, '#999', 'right'));
  datos.forEach(([k, et, v], i) => { if (t < dicho(k)) return; const u = fx2.frena((t - dicho(k)) / .35), h = gh * v / mx * u, x = gx + i * bw + 10;
    ctx.fillStyle = i === 0 ? FX2.amarillo : FX2.rojo; ctx.fillRect(x, gy + gh - h, bw - 20, h);
    tx(fmt(v * u), x + (bw - 20) / 2, gy + gh - h - 16, 34, 800, '#111', 'center', FX2.cond);
    tx(et, x + (bw - 20) / 2, gy + gh + 40, 22, 600, '#555'); });
  if (o.promedio !== false && datos.length && t >= dicho(datos[datos.length - 1][0]) + .35) {
    const p = datos.reduce((s, d) => s + d[2], 0) / datos.length, yy = gy + gh - gh * p / mx;
    ctx.save(); ctx.strokeStyle = FX2.rojo; ctx.setLineDash([12, 10]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(gx, yy); ctx.lineTo(gx + gw, yy); ctx.stroke(); ctx.restore();
    tx('prom. ' + fmt(p), gx + gw, yy - 12, 24, 600, FX2.rojo, 'right');
  }
}

// ---------- 12 · Pastillas detrás + titular (premium): botones apilados DETRÁS de tu cabeza y un titular de 2 líneas delante ----------
// persona ["completa","recorte"], FRENTE = true · o.pastillas = [[k, 'Trabaja conmigo'], …] (la 1.ª va llena) · o.titular = [[k, 'NO USES', 'ESTE SISTEMA'], …]
function pastillasDetras(t, o = {}) {
  hueco(0, 0, W, H);
  const ps = o.pastillas || [], y0 = o.y ?? 360;
  detras(() => ps.forEach(([k, s], i) => { if (t < dicho(k)) return;
    const w = fx2.ancho(s, 46, 800) + 120, x = W / 2 - w / 2 + (i % 2 ? -1 : 1) * (i ? 60 : 0), y = y0 + i * 96;
    fx2.caja(x, y, w, 78, 39, i === 0 ? FX2.violeta : FX2.lila); tx(s, x + w / 2, y + 55, 46, 800, i === 0 ? '#FFF' : FX2.violeta); }));
  const it = fx2.ultimo(o.titular || [], t);
  if (it) frente(() => { CONTORNO = .06; tx(it[1], W / 2, o.yTitular ?? 1290, 120, 800, '#B9A8FF', 'center', C.golpe); tx(it[2] || '', W / 2, (o.yTitular ?? 1290) + 74, 62, 800, '#FFF', 'center', C.golpe); CONTORNO = 0; });
}

// ---------- 13 · Contador de vistas: tarjeta blanca con la cifra que cuenta y la línea que crece (persona completa) ----------
// o.tA, o.tB · o.de, o.a (cifras REALES de tus estadísticas) · o.titulo ('2,5 millones') · o.rotulo ('Vistas') · o.x, o.y
function contadorVistas(t, o = {}) {
  hueco(0, 0, W, H); if (t < o.tA) return;
  const x = o.x ?? 230, y = o.y ?? 1180, w = o.w ?? 620, h = 520, u = fx2.frena((t - o.tA) / ((o.tB ?? o.tA + 1.5) - o.tA));
  if (o.titulo) { CONTORNO = .08; tx(o.titulo, x + w / 2, y - 30, 54, 800, '#FFF'); CONTORNO = 0; }
  fx2.caja(x, y, w, h, 30, '#FFF');
  tx(o.rotulo || 'Vistas', x + 40, y + 74, 44, 700, '#111', 'left');
  ['Todo', 'Instagram', 'TikTok'].forEach((s, i) => { const bx = x + 40 + i * 150; fx2.caja(bx, y + 100, 130, 40, 20, i === 0 ? FX2.violeta : '#F0EFF5'); tx(s, bx + 65, y + 128, 20, 700, i === 0 ? '#FFF' : '#666'); });
  tx('Histórico', x + 40, y + 182, 22, 500, '#999', 'left');
  tx(fx2.miles((o.de ?? 0) + ((o.a ?? 0) - (o.de ?? 0)) * u), x + 40, y + 252, 72, 800, '#111', 'left');
  const gx = x + 40, gw = w - 80, gy = y + 300, gh = 160, rnd = fx2.rnd(5), pts = []; for (let i = 0; i <= 24; i++) pts.push(.15 + .75 * Math.pow(i / 24, 1.4) + (rnd() - .5) * .08);
  ctx.save(); ctx.strokeStyle = FX2.violeta; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath();
  const fin = Math.max(1, Math.round(24 * u)); for (let i = 0; i <= fin; i++) { const px = gx + gw * i / 24, py = gy + gh - gh * pts[i]; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
  ctx.fillStyle = FX2.violeta; ctx.beginPath(); ctx.arc(gx + gw * fin / 24, gy + gh - gh * pts[fin], 9, 0, 7); ctx.fill(); ctx.restore();
}

// ---------- 14 · Panel de render (línea de tiempo): «lo renderiza» arriba con pistas, onda y cabezal; tú abajo (persona abajo) ----------
// o.titulo = ['Claude lo', 'renderiza'] · o.pasos = [[k, 'pausas eliminadas'], …] · o.foto (miniatura) · o.tA, o.tB (cabezal 0→100 %) · o.corte (1000)
function panelRender(t, o = {}) {
  const Y = o.corte ?? 1000; ctx.fillStyle = '#E8EDF6'; ctx.fillRect(0, 0, W, Y); hueco(0, Y, W, H - Y);
  const [a, b] = o.titulo || ['Lo', 'renderiza'], wa = fx2.ancho(a + ' ', 72, 800), wb = fx2.ancho(b, 80, 400, 'italic ' + C.diseno);
  const yt = o.yTitulo ?? 280; tx(a, W / 2 - (wa + wb) / 2, yt, 72, 800, '#111', 'left'); tx(b, W / 2 - (wa + wb) / 2 + wa, yt, 80, 400, FX2.azul, 'left', 'italic ' + C.diseno);
  const x = 60, y = yt + 50, w = W - 120, h = Y - yt - 90; fx2.caja(x, y, w, h, 26, FX2.azulNoche);
  ['#E5484D', '#F5A524', '#30A46C'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 36 + i * 28, y + 36, 9, 0, 7); ctx.fill(); });
  tx('RENDER', x + 140, y + 44, 22, 700, 'rgba(255,255,255,.6)', 'left', FX2.mono);
  ctx.save(); rr(x + 30, y + 80, 230, 300, 14); ctx.clip(); if (o.foto) fotoCover(o.foto, x + 30, y + 80, 230, 300); else { ctx.fillStyle = '#1C2C52'; ctx.fill(); } ctx.restore();
  (o.pasos || []).forEach(([k, s], i) => { if (t < dicho(k)) return; tx('✓ ' + s, x + w - 40, y + 120 + i * 50, 26, 600, '#DDE6FF', 'right', FX2.mono); });
  const u = fx2.clamp((t - (o.tA ?? 0)) / ((o.tB ?? (o.tA ?? 0) + 3) - (o.tA ?? 0))), ty = y + h - 300, tw = w - 60;
  for (let i = 0; i < 9; i++) fx2.caja(x + 30 + i * tw / 9, ty, tw / 9 - 6, 70, 6, i % 2 ? '#2A3F70' : '#34508A');
  [[0, .28], [.3, .55], [.58, .9]].forEach(([s, e]) => fx2.caja(x + 30 + tw * s, ty + 90, tw * (e - s), 40, 8, FX2.azul));
  const rnd = fx2.rnd(3); ctx.fillStyle = '#8FB0FF'; for (let i = 0; i < 120; i++) { const bh = 8 + rnd() * 60; ctx.fillRect(x + 30 + i * tw / 120, ty + 200 - bh / 2, 3, bh); }
  const cx = x + 30 + tw * u; ctx.fillStyle = '#FFF'; ctx.fillRect(cx - 2, ty - 14, 4, 260);
  tx(Math.round(u * 100) + '%', x + w - 30, y + h - 26, 44, 800, '#FFF', 'right');
}

// ---------- 15 · Comentario con la palabra (CTA): la barra de comentarios escribe tu palabra clave letra por letra (persona completa) ----------
// o.k (palabra en que empieza) · o.palabra ('USO') · o.foto (tu avatar) · o.y (1640) · o.rotulo ('Comenta')
function comentarioCTA(t, o = {}) {
  hueco(0, 0, W, H); const t0 = dicho(o.k ?? 0); if (t < t0 - .15) return;
  const x = 110, y = o.y ?? 1640, w = W - 220, h = 108, pal = o.palabra || 'USO', n = Math.min(pal.length, Math.floor((t - t0) / .09) + 1);
  if (o.rotulo) { CONTORNO = .08; tx(o.rotulo, W / 2, y - 40, 50, 800, '#FFF'); CONTORNO = 0; }
  fx2.caja(x, y, w, h, h / 2, '#FFF');
  ctx.save(); ctx.beginPath(); ctx.arc(x + 58, y + h / 2, 38, 0, 7); ctx.clip(); if (o.foto) fotoCover(o.foto, x + 20, y + h / 2 - 38, 76, 76); else { ctx.fillStyle = '#DDD'; ctx.fill(); } ctx.restore();
  tx(pal.slice(0, n), x + 120, y + h / 2 + 17, 48, 800, '#111', 'left');
  const wTxt = fx2.ancho(pal.slice(0, n), 48, 800); ctx.fillStyle = '#111'; if (n < pal.length) ctx.fillRect(x + 126 + wTxt, y + 30, 4, h - 60);
  ctx.fillStyle = n === pal.length ? FX2.rojo : '#DDD'; ctx.beginPath(); ctx.arc(x + w - 58, y + h / 2, 36, 0, 7); ctx.fill(); tx('↑', x + w - 58, y + h / 2 + 15, 44, 800, '#FFF');
}

// ---------- 16 · Cuadrícula de cierre (stack): «Comenta PALABRA» + pastilla + cuadrícula de tus tomas que se llena (persona "oculta") ----------
// fotos = [img, …] (cuadros de TU video, hasta 20) · o.tA · o.palabra · o.sub ('y te paso los 20 efectos') · o.rotulos = ['…', …] · o.extra ('+17')
function cuadriculaCierre(fotos, t, o = {}) {
  ctx.fillStyle = '#17161A'; ctx.fillRect(0, 0, W, H); if (t < (o.tA ?? 0)) return;
  tx(`Comenta «${o.palabra || 'USO'}»`, W / 2, 230, 92, 800, '#FFF');
  const s = o.sub || 'y te lo mando', ws = fx2.ancho(s, 46, 800) + 70; fx2.caja(W / 2 - ws / 2, 272, ws, 78, 16, '#E06A3B'); tx(s, W / 2, 327, 46, 800, '#FFF');
  const cols = 5, cw = 188, ch = 300, gap = 12, x0 = (W - cols * cw - (cols - 1) * gap) / 2, y0 = 420;
  fotos.slice(0, 20).forEach((im, i) => { if (t < (o.tA ?? 0) + .15 + i * .04) return;   // se llena de a una, con corte seco
    const x = x0 + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + 56);
    ctx.save(); rr(x, y, cw, ch, 14); ctx.clip(); if (im) fotoCover(im, x, y, cw, ch, .5, .4); ctx.restore();
    if (o.rotulos?.[i]) tx(o.rotulos[i], x + cw / 2, y + ch + 36, 22, 600, 'rgba(255,255,255,.7)'); });
  if (o.extra && fotos.length < 20 && t >= (o.tA ?? 0) + .15 + fotos.length * .04) { const i = fotos.length, x = x0 + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + 56);
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.setLineDash([10, 8]); ctx.lineWidth = 3; rr(x, y, cw, ch, 14); ctx.stroke(); ctx.restore();
    tx(o.extra, x + cw / 2, y + ch / 2 + 10, 64, 800, '#FFF'); }
}

// ---------- 17 · Marco de comando (el formato de los 3 reels): escribes /comando en el chat y tu video sale en una burbuja ----------
// Va con "persona": "oculta" y "efecto": {"tipo": "ventana", "de": [x, y, w, h], "en": s, "dur": .3} (el video encima, en la burbuja y luego a pantalla completa).
// o.comando ('/subtitulos') · o.desc ('palabra por palabra') · o.tEscribe, o.tEnvia (s) · o.foto (miniatura adjunta) · o.marca ('✳') · o.pestanas
const VENTANA_CAJA = [60, 300, 640, 1060];   // la burbuja por defecto donde aparece tu video (x, y, w, h) — úsala en "de"
function marcoComando(t, o = {}) {
  ctx.fillStyle = '#1F1E1D'; ctx.fillRect(0, 0, W, H);
  const tabs = o.pestanas || ['Chat', 'Código']; fx2.caja(W / 2 - 170, 40, 340, 74, 37, '#2B2A28'); fx2.caja(W / 2, 46, 164, 62, 31, '#3A3936');
  tx(tabs[0], W / 2 - 85, 89, 30, 600, '#8E8B85'); tx(tabs[1], W / 2 + 82, 89, 30, 700, '#FFF');
  const cmd = o.comando || '/efecto', tE = o.tEscribe ?? 0, tS = o.tEnvia ?? tE + 1.2;
  if (t < tS) {   // escribiendo: sugerencia + caja + teclado
    const n = Math.max(0, Math.min(cmd.length, Math.floor((t - tE) / .07) + 1));
    fx2.caja(30, 760, W - 60, 120, 22, '#2B2A28'); tx(cmd, 60, 812, 34, 700, '#FFF', 'left'); tx(o.desc || '', 60, 856, 24, 500, '#8E8B85', 'left');
    fx2.caja(30, 900, W - 60, 300, 30, '#2B2A28');
    if (o.foto) { ctx.save(); rr(60, 930, 120, 150, 14); ctx.clip(); fotoCover(o.foto, 60, 930, 120, 150); ctx.restore(); }
    tx(cmd.slice(0, n), 60, 1140, 36, 500, '#FFF', 'left'); ctx.fillStyle = '#E06A3B'; ctx.fillRect(64 + fx2.ancho(cmd.slice(0, n), 36, 500), 1110, 3, 40);
    fx2.caja(W - 120, 1110, 64, 64, 18, '#E06A3B'); tx('↑', W - 88, 1156, 40, 800, '#FFF');
    const filas = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm']; ctx.fillStyle = '#2B2A28'; ctx.fillRect(0, 1240, W, H - 1240);
    filas.forEach((f, r) => f.split('').forEach((c, i) => { const kw = 96, x = (W - f.length * (kw + 8)) / 2 + i * (kw + 8), y = 1290 + r * 150;
      const pulsada = n > 0 && cmd[n - 1] === c && t - tE - (n - 1) * .07 < .07;
      fx2.caja(x, y, kw, 126, 14, pulsada ? '#6A6966' : '#4A4946'); tx(c, x + kw / 2, y + 82, 46, 500, '#FFF'); }));
  } else {        // enviado: tu pedido arriba a la derecha y «Editando con…»; la burbuja la pinta el efecto «ventana»
    const wc = fx2.ancho(cmd, 32, 600) + 60; fx2.caja(W - 60 - wc, 170, wc, 70, 35, '#3A2A22'); tx(cmd, W - 60 - wc / 2, 216, 32, 600, '#F08A5D');
    tx(o.marca || '✳', 74, 290, 40, 800, '#E06A3B'); tx(`Editando con ${cmd.replace('/', '')}…`, 110, 284, 28, 500, '#B7B3AC', 'left');
    fx2.caja(30, H - 140, W - 60, 100, 50, '#2B2A28'); tx('Responde…', 80, H - 76, 30, 500, '#77736D', 'left');
  }
}

// ---------- 18 · Titular detrás de ti (titular / contorno): una palabra gigante condensada que queda detrás de tu cuerpo ----------
// persona ["completa","recorte"] · o.k · o.palabra ('REELS') · o.contorno (true = solo el borde, como «contorno») · o.y · o.color
// Con "efecto": {"tipo": "look", "estilo": "bn"} queda como el «contorno» en blanco y negro de la referencia.
function titularDetras(t, o = {}) {
  hueco(0, 0, W, H); if (t < dicho(o.k ?? 0)) return;
  const pal = o.palabra || 'REELS'; let tam = o.tam ?? 380; ctx.save(); ctx.font = `400 ${tam}px ${FX2.cond}`;
  const w = ctx.measureText(pal).width; if (w > W - 80) tam *= (W - 80) / w; ctx.font = `400 ${tam}px ${FX2.cond}`; ctx.textAlign = 'center';
  if (o.contorno) { ctx.strokeStyle = o.color || '#FFF'; ctx.lineWidth = 6; ctx.strokeText(pal, W / 2, o.y ?? 700); }
  else { ctx.fillStyle = o.color || '#FFF'; ctx.fillText(pal, W / 2, o.y ?? 700); }
  ctx.restore();
}

// ---------- 19 · Rótulo VHS: «▶ REPR.» y el contador de cinta (va con "efecto": {"tipo": "look", "estilo": "vhs"}) ----------
function rotuloVHS(t, o = {}) {
  const s = Math.floor(t), tc = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(Math.floor((t % 1) * 30)).padStart(2, '0')}`;
  CONTORNO = .06; tx('▶ ' + (o.texto || 'REPR.'), 60, 130, 54, 700, '#FFF', 'left', FX2.mono); tx(tc, W - 60, H - 120, 48, 700, '#FFF', 'right', FX2.mono); CONTORNO = 0;
}
