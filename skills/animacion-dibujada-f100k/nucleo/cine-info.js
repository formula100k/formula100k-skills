// ============================================================================
// cine-info.js · motor compartido del grupo «Información y keynote»
// Técnica adaptada de lemo-opuscar (MIT, © 2026 LemoLab). Escrito desde cero sobre nucleo.js (va DESPUÉS de él).
//
// Lo usan: cine-dataviz, cine-iso-infographic, cine-dark-keynote, cine-living-screencast,
//          cine-hologram-hud, cine-transit-map, cine-isometric-picture-book, cine-circuit-board.
//
// Exporta (todo puro y determinista: sin Math.random ni Date):
//   TEXTO      fraseDiseno(texto, clave, o) → maqueta de palabras (la clave enorme, los conectores chicos)
//              pintarFrase(maq, t, t0, paso, o) → las palabras entran de a una con corte seco · rgbDe(hex)
//   CÁMARA     camara({x,y,z,rot}) → pone la transformación del mundo · pantalla() la quita
//   PAPEL      mosaicoPapel(color, semilla) · papelMundo(mosaico, cam, {puntos, paso, colPunto})
//   GRÁFICAS   lapizTrazo(pts, o) → trazo de grafito con presión y grano (devuelve la punta)
//              textoLapiz(txt, x, y, o) → letra a mano con grano que se escribe de izquierda a derecha
//              puntoDato(x, y, r, col, fresco, o) · rampa(u) (divergente azul–rojo) · anilloAbierto(x,y,r,semilla)
//              lapizRojoAzul(punta, {alza, ang, mina, escala}) → el lápiz de dos minas, sin mano, con sombra
//   ISOMÉTRICO ISO = {ang, esc} · iso(x, y, z, o) → [sx, sy] · cajaIso(x,y,z,w,d,h, cols, o) · sombraIso(...)
//              tonos(hex) → {arriba, izq, der} con la luz desde arriba a la izquierda
//   METRO      lineaMetro(pts, col, ancho, p) (esquinas a 45° redondeadas) · estacion(x,y,r,o) · rutaOrtogonal(...)
//   CIRCUITO   pista(pts, o) · via(x,y,r,o) · pulso(pts, u, o) · chip(x,y,w,h,o)
//   PANTALLA   ventanaApp(x,y,w,h,o) · cursorFlecha(x,y,esc,o) · tecleo(txt, t, t0, cps)
//   ISO+       tonosIso(hex) · camaraIso(cx,cy,cz,k,sx,sy) · zoomLog(k0,k1,e) · pinIso(x,y,z,a,o) · rayadoPoli(pts) · lineaIso(pts3,p,o) · puntoRuta(pts3,u)
//   SERIGRAFÍA serigrafia(txt, x, y, cap, {p, grosor, alinear}) → letra ruteada a 0/45/90° que se traza · anchoSerigrafia(txt, cap)
//   OTROS      mezcla(a,b,t) · curvaQ(a,c,b,n) · finFrase(maq,t0,paso) · _remuestreo(pts,paso) (largo acumulado)
// ============================================================================

// ---------- color ----------
function rgbDe(hex) { const h = hex.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
function mezcla(a, b, t) { const A = rgbDe(a), B = rgbDe(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; }
function tonos(hex) { return { arriba: mezcla(hex, '#ffffff', .18), izq: hex, der: mezcla(hex, '#000000', .28), linea: mezcla(hex, '#000000', .5) }; }

// ---------- texto de diseño: la clave enorme, los conectores chicos, corte seco ----------
// texto: la frase · clave: palabra(s) que van enormes (puede ser '') · o: { familia, peso, pesoClave, familiaClave,
//   ancho, tam (base), factor (clave = tam × factor), maxRenglones, maxAlto, x, y (arriba), alinear: 'izq'|'centro', inter }
// Devuelve { palabras: [{txt, x, y, size, font, clave}], alto, ancho }. Si no cabe, se achica sola; si ni así, avisa en consola.
function fraseDiseno(texto, clave, o = {}) {
  const { familia = LETRA_LIMPIA, peso = 600, pesoClave = 800, familiaClave = familia, ancho = 900, tam = 70, factor = 2.1,
    maxRenglones = 4, maxAlto = 600, x = SEGURA.left, y = SEGURA.top, alinear = 'izq', inter = 1.02, mayusClave = false } = o;
  const claveL = (clave || '').toLowerCase().split(/\s+/).filter(Boolean);
  const pals = texto.trim().split(/\s+/).map(p => ({ txt: p, clave: claveL.includes(p.toLowerCase().replace(/[.,;:¡!¿?«»"]/g, '')) }));
  for (let s = tam; s >= 22; s -= 2) {
    const fuente = p => p.clave ? `${pesoClave} ${Math.round(s * factor)}px ${familiaClave}` : `${peso} ${s}px ${familia}`;
    const lineas = [[]]; let ac = 0; const esp = medir(' ', `${peso} ${s}px ${familia}`);
    for (const p of pals) {
      const t = p.clave && mayusClave ? p.txt.toUpperCase() : p.txt, f = fuente(p), w = medir(t, f);
      // la clave va sola en su renglón: así se lee como el golpe de la frase
      const sola = p.clave && claveL.length === 1;
      if ((ac + w > ancho || sola || (lineas.at(-1)[0] && lineas.at(-1)[0].clave && claveL.length === 1)) && lineas.at(-1).length) { lineas.push([]); ac = 0; }
      lineas.at(-1).push({ ...p, txt: t, font: f, w, size: p.clave ? Math.round(s * factor) : s }); ac += w + esp;
    }
    const altos = lineas.map(L => Math.max(...L.map(p => p.size)) * inter);
    const alto = altos.reduce((a, b) => a + b, 0), anchoMax = Math.max(...lineas.map(L => L.reduce((a, p) => a + p.w + esp, -esp)));
    if (lineas.length > maxRenglones || alto > maxAlto || anchoMax > ancho) continue;
    const out = []; let yy = y;
    lineas.forEach((L, i) => {
      yy += altos[i] * .86; const lw = L.reduce((a, p) => a + p.w + esp, -esp); let xx = alinear === 'centro' ? x + (ancho - lw) / 2 : x;
      for (const p of L) { out.push({ ...p, x: xx, y: yy }); xx += p.w + esp; }
      yy += altos[i] * .14;
    });
    return { palabras: out, alto, ancho: anchoMax, tam: s };
  }
  console.error(`[fraseDiseno] «${texto}» no cabe ni con letra de 22px: acorta la frase.`);
  return { palabras: [], alto: 0, ancho: 0, tam: 22 };
}
// Pinta la maqueta: la palabra i aparece entera en t0 + i·paso (corte seco, sin animación de entrada).
// o: { col, colClave, sombra: 'rgba(...)' (sombra dura de imprenta, sin desenfoque), alfa }
function pintarFrase(maq, t, t0 = 0, paso = .14, o = {}) {
  const { col = '#111', colClave = col, sombra = null, alfa = 1, dx = 3, dy = 3 } = o;
  ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.globalAlpha *= alfa;
  maq.palabras.forEach((p, i) => {
    if (t < t0 + i * paso) return;
    ctx.font = p.font;
    if (sombra) { ctx.fillStyle = sombra; ctx.fillText(p.txt, p.x + dx, p.y + dy); }
    ctx.fillStyle = p.clave ? colClave : col; ctx.fillText(p.txt, p.x, p.y);
  });
  ctx.restore();
}
const finFrase = (maq, t0, paso) => t0 + Math.max(0, maq.palabras.length - 1) * paso;

// ---------- cámara 2D (empuje, paneo, rotación) ----------
function camara(c) {
  const z = c.z || 1, r = c.rot || 0, co = Math.cos(r) * z, si = Math.sin(r) * z;
  ctx.setTransform(co, si, -si, co, W / 2 - (co * c.x - si * c.y), H / 2 - (si * c.x + co * c.y));
}
const pantalla = () => ctx.setTransform(1, 0, 0, 1, 0, 0);

// ---------- papel crema con fibras (mosaico) y retícula de puntos en el mundo ----------
function mosaicoPapel(color = '#F6F3EC', semilla = 7) {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), r = rng(semilla);
  g.fillStyle = color; g.fillRect(0, 0, S, S);
  const id = g.getImageData(0, 0, S, S), d = id.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {       // nube suave + diente fino, que se repite sin costura
    const u = x / S * 8, v = y / S * 8, lo = Math.sin(u * .785 + Math.sin(v * .785) * 1.3) * .5 + Math.sin(v * 1.57 + 1.3) * .3;
    const n = (r() - .5) * 5 + lo * 2.2, i = (y * S + x) * 4; d[i] += n; d[i + 1] += n; d[i + 2] += n * .9;
  }
  g.putImageData(id, 0, 0);
  for (let k = 0; k < 900; k++) { const x = r() * S, y = r() * S, a = r() * 6.283, l = 3 + r() * 14;
    g.strokeStyle = r() < .5 ? 'rgba(120,100,70,.07)' : 'rgba(255,255,255,.35)'; g.lineWidth = .6 + r() * .6;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return c;
}
// Rellena lo que ve la cámara con el papel y la retícula (la retícula se mueve con la cámara: así se siente el empuje)
function papelMundo(mos, cam, o = {}) {
  const { puntos = 1, paso = 24, colPunto = '#E4DDCF' } = o, z = cam.z || 1, m = 200 / z;
  const x0 = cam.x - W / 2 / z - m, x1 = cam.x + W / 2 / z + m, y0 = cam.y - H / 2 / z - m, y1 = cam.y + H / 2 / z + m;
  camara(cam); ctx.fillStyle = ctx.createPattern(mos, 'repeat'); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (puntos) { ctx.fillStyle = colPunto; ctx.globalAlpha = puntos; const r = 1.5 / Math.sqrt(z);
    for (let x = Math.floor(x0 / paso) * paso; x < x1; x += paso) for (let y = Math.floor(y0 / paso) * paso; y < y1; y += paso) ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    ctx.globalAlpha = 1; }
}

// ---------- lápiz: trazo de grafito con presión, vaivén lento y grano ----------
function _remuestreo(pts, paso = 2.5) {
  const out = [pts[0]], L = [0]; let ac = 0;
  for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d / paso));
    for (let k = 1; k <= n; k++) { ac += d / n; out.push([ax + (bx - ax) * k / n, ay + (by - ay) * k / n]); L.push(ac); } }
  return { pts: out, len: L, total: ac };
}
function lapizTrazo(pts, o = {}) {
  const { col = '#3A3733', ancho = 2.4, p = 1, semilla = 1, vaiven = .6, pasadas = 2, alfa = .92, grano: gr = .45, afinar = true } = o;
  if (p <= 0 || pts.length < 2) return pts[0];
  const R = _remuestreo(pts), n = R.pts.length, fin = R.total * clamp(p);
  const Q = R.pts.map((q, i) => { const a = R.pts[Math.max(0, i - 1)], b = R.pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const w = (vnoise(R.len[i] * .02 + semilla * 13.1, 2.7) - .5) * 2 * vaiven * ancho; return [q[0] - dy / l * w, q[1] + dx / l * w]; });
  const a0 = ctx.globalAlpha; let punta = Q[0];
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col;
  for (let ps = 0; ps < pasadas; ps++) {
    const off = ps ? (hash2(semilla, ps) - .5) * ancho * .5 : 0;
    for (let i = 1; i < n; i++) {
      if (R.len[i - 1] > fin) break;
      const f = R.len[i] / Math.max(1, R.total), tp = afinar ? Math.min(1, f * 8, (1 - f) * 8 + .35) : 1;
      ctx.globalAlpha = a0 * alfa * (1 - gr * hash2(i * 17 + ps * 7, semilla * 31)) * (ps ? .45 : 1);
      ctx.lineWidth = ancho * (.75 + .25 * tp) * (ps ? .6 : 1);
      let [bx, by] = Q[i];
      if (R.len[i] > fin) { const [ax, ay] = Q[i - 1], k = (fin - R.len[i - 1]) / (R.len[i] - R.len[i - 1]); bx = ax + (bx - ax) * k; by = ay + (by - ay) * k; }
      ctx.beginPath(); ctx.moveTo(Q[i - 1][0] + off, Q[i - 1][1] + off); ctx.lineTo(bx + off, by + off); ctx.stroke(); punta = [bx, by];
    }
  }
  ctx.restore(); return punta;
}
// círculo a mano que NO cierra (el anillo de una nota)
function anilloAbierto(x, y, r, semilla = 1, vueltas = 1.12, a0 = -2.2) {
  const out = []; for (let i = 0; i <= 48; i++) { const t = i / 48, a = a0 + t * vueltas * Math.PI * 2, rr = r * (1 + .08 * Math.sin(t * 5 + semilla) + t * .06);
    out.push([x + Math.cos(a) * rr * 1.08, y + Math.sin(a) * rr]); } return out;
}
const curvaQ = (a, c, b, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; });

// letra a mano con grano de grafito: se pinta una vez por texto y se destapa de izquierda a derecha
const _textosLapiz = new Map();
function textoLapiz(txt, x, y, o = {}) {
  const { tam = 44, col = '#2F5D8A', p = 1, peso = 400, familia = '"Bradley Hand", "Noteworthy", cursive', alinear = 'izq', dibujar = true } = o;
  const clave = [txt, tam, col, peso, familia].join('|'); let im = _textosLapiz.get(clave);
  if (!im) {
    const f = `${peso} ${tam * 2}px ${familia}`, wm = medir(txt, f), w = Math.ceil(wm + tam * 1.2), h = Math.ceil(tam * 3.4);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), r = rng(txt.length * 97 + tam);
    g.font = f; g.fillStyle = col; let xx = tam * .6;
    for (const ch of txt) { g.save(); g.translate(xx, h * .72 + (r() - .5) * tam * .1); g.rotate((r() - .5) * .06); g.fillText(ch, 0, 0); g.restore(); xx += g.measureText(ch).width; }
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < w * h * .16; i++) { g.globalAlpha = .35 + r() * .65; g.fillRect(r() * w, r() * h, 1, 1); }
    im = { c, w: w / 2, h: h / 2, pad: tam * .3, base: h * .72 / 2, tw: wm / 2 }; _textosLapiz.set(clave, im);
  }
  const izq = alinear === 'der' ? x - im.tw : alinear === 'centro' ? x - im.tw / 2 : x, pr = clamp(p);
  if (pr > 0 && dibujar) { ctx.save(); ctx.beginPath(); ctx.rect(izq - im.pad, y - im.base, im.pad + im.tw * pr + (pr >= 1 ? im.pad * 2 : 0), im.h); ctx.clip();
    ctx.drawImage(im.c, izq - im.pad, y - im.base, im.w, im.h); ctx.restore(); }
  const f = pr * im.tw, baile = Math.sin(f * .55) * .5 + Math.sin(f * 1.31 + 1) * .3;
  return { punta: [izq + f, y - tam * (.28 + .22 * baile)], w: im.tw, izq };
}

// ---------- marcas de datos ----------
// fresco = segundos desde que cayó (pop corto + onda fina) · negativo = todavía no
function puntoDato(x, y, r, col, fresco = 9, o = {}) {
  const { anillo = '#2B2723', anilloW = 2, alfa = 1, onda = 1 } = o; if (fresco < 0) return;
  const pop = fresco < .25 ? 1 + .45 * Math.sin(clamp(fresco / .25) * Math.PI) : 1;
  ctx.save(); ctx.globalAlpha *= alfa;
  if (onda && fresco < .6) { const k = fresco / .6; ctx.strokeStyle = col; ctx.globalAlpha = alfa * (1 - k) * .6; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r * (1.2 + k * 2.6 * onda), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = alfa; }
  ctx.beginPath(); ctx.arc(x, y, r * pop, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = anilloW; ctx.strokeStyle = anillo; ctx.stroke();
  ctx.restore();
}
// rampa divergente (familia azul–rojo): u = (valor − centro) / media_amplitud. Los valores pálidos siguen pálidos.
const RAMPA = [[-1, '#2166AC'], [-.72, '#4393C3'], [-.45, '#92C5DE'], [-.2, '#D1E5F0'], [0, '#F2EEE8'], [.2, '#FDDBC7'], [.45, '#F4A582'], [.72, '#D6604D'], [1, '#B2182B'], [1.4, '#7A0F1E']];
function rampa(u) { if (u <= RAMPA[0][0]) return RAMPA[0][1]; for (let i = 1; i < RAMPA.length; i++) if (u <= RAMPA[i][0]) return mezcla(RAMPA[i - 1][1], RAMPA[i][1], (u - RAMPA[i - 1][0]) / (RAMPA[i][0] - RAMPA[i - 1][0])); return RAMPA.at(-1)[1]; }

// el lápiz rojo–azul: cuerpo hexagonal de dos colores, cono de madera, mina del color. Solo se ve la punta; sin mano.
// punta = [x, y] en pantalla · alza 0..1 (la sombra se aleja y se ablanda) · ang = hacia dónde va el cuerpo (rad)
function lapizRojoAzul(punta, o = {}) {
  const { alza = 0, ang = 1.0, mina = 'azul', escala = 1.6, azul = '#2F5D8A', rojo = '#A8283A', madera = '#E3C79C' } = o;
  const cuerpo = (g, sombra) => {
    const L1 = 16, L2 = 58, A = 24, largo = 1600, cA = mina === 'rojo' ? rojo : azul, cB = mina === 'rojo' ? azul : rojo;
    if (sombra) { g.fillStyle = sombra; g.beginPath(); g.moveTo(0, 0); g.lineTo(L1 + L2, -A / 2); g.lineTo(largo, -A / 2); g.lineTo(largo, A / 2); g.lineTo(L1 + L2, A / 2); g.closePath(); g.fill(); return; }
    g.fillStyle = cA; g.fillRect(L1 + L2 - 2, -A / 2, largo * .5, A); g.fillStyle = cB; g.fillRect(L1 + L2 - 2 + largo * .5, -A / 2, largo * .5, A);
    g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(L1 + L2 - 2, -A / 2 + 3, largo, 5); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(L1 + L2 - 2, A / 2 - 6, largo, 6);
    g.fillStyle = madera; g.beginPath(); g.moveTo(L1 * .9, -3.2); g.lineTo(L1 + L2, -A / 2);
    for (let i = 0; i <= 6; i++) g.lineTo(L1 + L2 + (i % 2 ? 5 : 0), -A / 2 + A * i / 6); g.lineTo(L1 * .9, 3.2); g.closePath(); g.fill();
    g.fillStyle = 'rgba(150,110,60,.28)'; g.beginPath(); g.moveTo(L1 * .9, 1); g.lineTo(L1 + L2, A / 2 - 2); g.lineTo(L1 + L2, A / 2); g.lineTo(L1 * .9, 3.2); g.fill();
    g.fillStyle = mina === 'rojo' ? '#8E2232' : '#274E75'; g.beginPath(); g.moveTo(0, 0); g.lineTo(L1, -3.6); g.lineTo(L1, 3.6); g.closePath(); g.fill();
  };
  const lz = 1 + alza * .3, s = escala * lz, d = 3 + alza * 60;
  ctx.save(); pantalla();
  ctx.save(); ctx.translate(punta[0] + d * .8, punta[1] + d * 1.1); ctx.rotate(ang); ctx.scale(s, s);
  ctx.filter = `blur(${(2 + alza * 10).toFixed(1)}px)`; ctx.globalAlpha = .22 - alza * .08; cuerpo(ctx, 'rgb(70,50,30)'); ctx.restore();
  ctx.translate(punta[0], punta[1]); ctx.rotate(ang); ctx.scale(s, s); cuerpo(ctx, null);
  ctx.restore();
}

// ---------- isométrico 2.5D (proyección propia, orden de pintor, luz desde arriba a la izquierda) ----------
const ISO = { esc: 1, ox: W / 2, oy: H / 2, ang: Math.PI / 6 };
// x hacia abajo-derecha, y hacia abajo-izquierda, z hacia arriba (unidades de mundo → px)
function iso(x, y, z = 0) { const c = Math.cos(ISO.ang), s = Math.sin(ISO.ang); return [ISO.ox + (x - y) * c * ISO.esc, ISO.oy + ((x + y) * s - z) * ISO.esc]; }
function poli(pts, relleno, linea, lw = 2) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath();
  if (relleno) { ctx.fillStyle = relleno; ctx.fill(); } if (linea) { ctx.strokeStyle = linea; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); } }
// caja de w (x) × d (y) × h (z) con la esquina de atrás en (x,y,z). cols = tonos(hex) o {arriba, izq, der}
function cajaIso(x, y, z, w, d, h, cols, o = {}) {
  const { linea = null, lw = 2 } = o;
  const P = (a, b, c) => iso(x + a, y + b, z + c);
  poli([P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)], cols.izq, linea, lw);     // cara frente-izquierda (y = d)
  poli([P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, 0, h)], cols.der, linea, lw);     // cara frente-derecha (x = w)
  poli([P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)], cols.arriba, linea, lw);  // tapa
}
// sombra suave en el piso, corrida hacia abajo a la derecha (la luz viene de arriba a la izquierda)
function sombraIso(x, y, w, d, h, o = {}) {
  const { alfa = .18, col = '20,30,60' } = o, k = h * .5;
  ctx.save(); ctx.filter = 'blur(10px)'; ctx.globalAlpha = alfa;
  poli([iso(x, y + d, 0), iso(x + w, y + d, 0), iso(x + w + k, y + d + k * .3, 0), iso(x + w + k, y + k * .3, 0), iso(x + w, y, 0)], `rgb(${col})`);
  ctx.restore();
}

// ---------- metro: líneas a 0° / 45° / 90° con esquinas redondeadas ----------
// pts: esquinas de la ruta (los tramos deben ser horizontales, verticales o diagonales) · p 0→1 = se traza
function lineaMetro(pts, col, ancho = 26, p = 1, o = {}) {
  if (p <= 0) return null; const { radio = ancho * 1.6, borde = null } = o;
  const R = []; // redondea cada esquina con un arco corto
  for (let i = 0; i < pts.length; i++) {
    if (i === 0 || i === pts.length - 1) { R.push(pts[i]); continue; }
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], [cx, cy] = pts[i + 1];
    const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by), r = Math.min(radio, l1 / 2, l2 / 2);
    const p1 = [bx - (bx - ax) / l1 * r, by - (by - ay) / l1 * r], p2 = [bx + (cx - bx) / l2 * r, by + (cy - by) / l2 * r];
    R.push(...curvaQ(p1, [bx, by], p2, 10));
  }
  const Q = _remuestreo(R, 4), fin = Q.total * clamp(p); let k = 0; while (k < Q.pts.length - 1 && Q.len[k] < fin) k++;
  const vis = Q.pts.slice(0, k + 1);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = ancho + 10; ctx.beginPath(); vis.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.stroke(); }
  ctx.strokeStyle = col; ctx.lineWidth = ancho; ctx.beginPath(); vis.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.stroke();
  ctx.restore(); return vis.at(-1);
}
// estación: círculo blanco con aro (normal) o píldora con aro grueso (combinación)
function estacion(x, y, r = 16, o = {}) {
  const { aro = '#1d1d1b', relleno = '#ffffff', lw = 6, largo = 0, rot = 0 } = o;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = relleno; ctx.strokeStyle = aro; ctx.lineWidth = lw;
  ctx.beginPath(); if (largo) ctx.roundRect(-r - largo / 2, -r, 2 * r + largo, 2 * r, r); else ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke(); ctx.restore();
}

// ---------- circuito: pistas de cobre, vías, chips y el pulso de corriente ----------
function pista(pts, o = {}) {
  const { col = '#C9A253', ancho = 10, p = 1, alfa = 1 } = o; if (p <= 0) return null;
  const Q = _remuestreo(pts, 4), fin = Q.total * clamp(p); let k = 0; while (k < Q.pts.length - 1 && Q.len[k] < fin) k++;
  ctx.save(); ctx.globalAlpha *= alfa; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = ancho;
  ctx.beginPath(); Q.pts.slice(0, k + 1).forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.stroke(); ctx.restore();
  return Q.pts[k];
}
function via(x, y, r = 9, o = {}) { const { cobre = '#C9A253', hueco = '#0b1f16' } = o;
  ctx.save(); ctx.fillStyle = cobre; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hueco; ctx.beginPath(); ctx.arc(x, y, r * .45, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
// el pulso: un tramo corto y brillante que recorre la pista (u 0→1) dejando una estela que se apaga
function pulso(pts, u, o = {}) {
  const { col = '#FFE38A', ancho = 8, largo = 140 } = o; if (u <= 0 || u >= 1.2) return null;
  const Q = _remuestreo(pts, 3), cab = Q.total * u, cola = cab - largo;
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = col;
  for (let i = 1; i < Q.pts.length; i++) { const L = Q.len[i]; if (L < cola || L > cab) continue;
    ctx.globalAlpha = clamp((L - cola) / largo) * .95; ctx.lineWidth = ancho * (.5 + .5 * clamp((L - cola) / largo));
    ctx.beginPath(); ctx.moveTo(...Q.pts[i - 1]); ctx.lineTo(...Q.pts[i]); ctx.stroke(); }
  ctx.restore(); let k = 0; while (k < Q.pts.length - 1 && Q.len[k] < cab) k++; return Q.pts[k];
}

// ---------- pantalla de app (genérica, sin marcas) ----------
function ventanaApp(x, y, w, h, o = {}) {
  const { fondo = '#ffffff', barra = '#eef0f3', borde = 'rgba(0,0,0,.12)', radio = 28, sombra = true } = o;
  ctx.save();
  if (sombra) { ctx.save(); ctx.filter = 'blur(28px)'; ctx.fillStyle = 'rgba(10,20,40,.22)'; ctx.beginPath(); ctx.roundRect(x + 8, y + 26, w, h, radio); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = fondo; ctx.beginPath(); ctx.roundRect(x, y, w, h, radio); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, radio); ctx.clip(); ctx.fillStyle = barra; ctx.fillRect(x, y, w, 64); ctx.restore();
  ['#e6e8ec', '#e6e8ec', '#e6e8ec'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 36 + i * 30, y + 32, 9, 0, Math.PI * 2); ctx.fill(); });
  ctx.strokeStyle = borde; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y, w, h, radio); ctx.stroke();
  ctx.restore(); return { x, y: y + 64, w, h: h - 64 };
}
// flecha de cursor plana (blanca con borde oscuro), punta en (x, y)
function cursorFlecha(x, y, esc = 1.6, o = {}) {
  const { relleno = '#ffffff', borde = '#111111' } = o;
  const P = [[0, 0], [0, 26], [6.5, 20], [11, 30], [15, 28.5], [10.6, 18.8], [19, 18.8]];
  ctx.save(); ctx.translate(x, y); ctx.scale(esc, esc);
  ctx.save(); ctx.translate(1.5, 2); ctx.filter = 'blur(2px)'; poli(P, 'rgba(0,0,0,.3)'); ctx.restore();
  poli(P, relleno, borde, 1.6); ctx.restore();
}
// cuántas letras de txt se ven en t si se teclea desde t0 a cps letras por segundo
const tecleo = (txt, t, t0, cps = 18) => txt.slice(0, Math.max(0, Math.min(txt.length, Math.floor((t - t0) * cps))));

// ---------- isométrico: tonos, cámara con zoom logarítmico, pines y cortes ----------
// tres tonos por cara desde un color base: arriba hacia blanco cálido, derecha hacia oscuro frío (sombras algo frías)
function tonosIso(hex, sube = .22, baja = .26) { return { arriba: mezcla(hex, '#FFF7E6', sube), izq: hex, der: mezcla(hex, '#231A2C', baja) }; }
// pone ISO para que el punto del mundo (cx,cy,cz) quede en (sx, sy) de la pantalla con k px por unidad
function camaraIso(cx, cy, cz, k, sx = W / 2, sy = H / 2) { ISO.esc = k; ISO.ox = 0; ISO.oy = 0; const [px, py] = iso(cx, cy, cz); ISO.ox = sx - px; ISO.oy = sy - py; }
const zoomLog = (k0, k1, e) => Math.exp(lerp(Math.log(k0), Math.log(k1), e));
// pin de rótulo: punto con aro → guía vertical → regla horizontal → TÍTULO en versalitas + cifra grande + unidad chica.
// Las palabras entran con corte seco (sin barrido). a = segundos desde que empieza el pin (negativo = no está)
function pinIso(x, y, z, a, o = {}) {
  if (a < 0) return; const { sube = 140, dir = 1, largo = 60, titulo = '', cifra = '', unidad = '', tinta = '#2A2230', fondo = '#F3EAD7',
    familia = 'Futura, "Avenir Next", sans-serif', tamTit = 30, tamCifra = 64, punto = tinta } = o;
  const [ax, ay] = iso(x, y, z), k1 = easeOut(prog(a, 0, .2)), k2 = easeOut(prog(a, .12, .32));
  ctx.save(); pantalla(); ctx.strokeStyle = tinta; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - sube * k1); if (k2 > 0) ctx.lineTo(ax + dir * largo * k2, ay - sube); ctx.stroke();
  ctx.beginPath(); ctx.arc(ax, ay, 10, 0, Math.PI * 2); ctx.fillStyle = fondo; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(ax, ay, 4.5, 0, Math.PI * 2); ctx.fillStyle = punto; ctx.fill();
  const tx = ax + dir * (largo + 14), ty = ay - sube; ctx.textAlign = dir > 0 ? 'left' : 'right'; ctx.fillStyle = tinta;
  if (a >= .34) { ctx.font = `600 ${tamTit}px ${familia}`; ctx.letterSpacing = `${Math.round(tamTit * .14)}px`; ctx.fillText(titulo.toUpperCase(), tx, ty - 12); ctx.letterSpacing = '0px'; }
  if (a >= .48 && cifra) {
    ctx.font = `400 ${tamCifra}px ${familia}`; const cw = medir(cifra, ctx.font); ctx.font = `500 ${Math.round(tamCifra * .45)}px ${familia}`; const uw = unidad ? medir(unidad, ctx.font) + 12 : 0;
    ctx.font = `400 ${tamCifra}px ${familia}`; ctx.fillText(cifra, dir > 0 ? tx : tx - uw, ty + tamCifra * .95);
    if (unidad && a >= .6) { ctx.font = `500 ${Math.round(tamCifra * .45)}px ${familia}`; ctx.fillText(unidad, dir > 0 ? tx + cw + 12 : tx, ty + tamCifra * .95); }
  }
  ctx.restore();
}
// rayado de sección (corte) dentro de un polígono de pantalla
function rayadoPoli(pts, col = '#2A2230', paso = 9, alfa = .55) {
  ctx.save(); poli(pts, null); ctx.clip(); ctx.strokeStyle = col; ctx.globalAlpha *= alfa; ctx.lineWidth = 1.6;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (let x = x0 - (y1 - y0); x < x1; x += paso) { ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x + (y1 - y0), y0); ctx.stroke(); }
  ctx.restore();
}
// línea punteada de tinta en el mundo (ruta, línea de corte). p 0→1 = se dibuja
function lineaIso(pts3, p = 1, o = {}) {
  const { col = '#2A2230', ancho = 3, guiones = [12, 9], blanco = null } = o; if (p <= 0) return null;
  const S = pts3.map(q => iso(q[0], q[1], q[2] || 0)), Q = _remuestreo(S, 3), fin = Q.total * clamp(p); let k = 0; while (k < Q.pts.length - 1 && Q.len[k] < fin) k++;
  const vis = Q.pts.slice(0, k + 1);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (blanco) { ctx.strokeStyle = blanco; ctx.lineWidth = ancho + 5; ctx.beginPath(); vis.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.stroke(); }
  ctx.setLineDash(guiones); ctx.strokeStyle = col; ctx.lineWidth = ancho; ctx.beginPath(); vis.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.stroke();
  ctx.restore(); return vis.at(-1);
}
// punto a lo largo de una ruta 3D (u 0→1) y su dirección
function puntoRuta(pts3, u) {
  const L = []; let ac = 0; for (let i = 1; i < pts3.length; i++) { ac += Math.hypot(pts3[i][0] - pts3[i - 1][0], pts3[i][1] - pts3[i - 1][1]); L.push(ac); }
  const d = clamp(u) * ac; let i = 0; while (i < L.length - 1 && L[i] < d) i++;
  const a = pts3[i], b = pts3[i + 1], l0 = i ? L[i - 1] : 0, k = (d - l0) / Math.max(1e-6, L[i] - l0);
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2] || 0, b[2] || 0, k)];
}

// ---------- letra de serigrafía ruteada como pista (0/45/90°, puntas redondas) que se traza trazo a trazo ----------
// Retícula de 4 × 6 (y hacia abajo). Mayúsculas, dígitos, tildes y Ñ. Lo que no está se dibuja como «?» (avísalo en consola).
const GLIFOS = {
  A: [[0, 6, 0, 2, 2, 0, 4, 2, 4, 6], [0, 4, 4, 4]], B: [[0, 0, 0, 6, 3, 6, 4, 5, 4, 4, 3, 3, 0, 3], [0, 0, 3, 0, 4, 1, 4, 2, 3, 3]],
  C: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5]], D: [[0, 0, 0, 6, 2, 6, 4, 4, 4, 2, 2, 0, 0, 0]], E: [[4, 0, 0, 0, 0, 6, 4, 6], [0, 3, 3, 3]],
  F: [[4, 0, 0, 0, 0, 6], [0, 3, 3, 3]], G: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5, 4, 3, 2, 3]], H: [[0, 0, 0, 6], [4, 0, 4, 6], [0, 3, 4, 3]],
  I: [[1, 0, 3, 0], [2, 0, 2, 6], [1, 6, 3, 6]], J: [[4, 0, 4, 5, 3, 6, 1, 6, 0, 5]], K: [[0, 0, 0, 6], [4, 0, 1, 3, 0, 3], [1, 3, 4, 6]], L: [[0, 0, 0, 6, 4, 6]],
  M: [[0, 6, 0, 0, 2, 2, 4, 0, 4, 6]], N: [[0, 6, 0, 0, 4, 4, 4, 6], [4, 0, 4, 4]], O: [[1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0]],
  P: [[0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3, 0, 3]], Q: [[1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0], [2, 4, 4, 6]],
  R: [[0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3, 0, 3], [2, 3, 4, 5, 4, 6]], S: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 2, 1, 3, 3, 3, 4, 4, 4, 5, 3, 6, 1, 6, 0, 5]],
  T: [[0, 0, 4, 0], [2, 0, 2, 6]], U: [[0, 0, 0, 5, 1, 6, 3, 6, 4, 5, 4, 0]], V: [[0, 0, 0, 1, 2, 6, 4, 1, 4, 0]], W: [[0, 0, 0, 6, 2, 4, 4, 6, 4, 0]],
  X: [[0, 0, 0, 1, 4, 5, 4, 6], [4, 0, 4, 1, 0, 5, 0, 6]], Y: [[0, 0, 0, 1, 2, 3, 4, 1, 4, 0], [2, 3, 2, 6]], Z: [[0, 0, 4, 0, 4, 1, 0, 5, 0, 6, 4, 6]],
  0: [[1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0], [1, 4, 3, 2]], 1: [[1, 1, 2, 0, 2, 6], [1, 6, 3, 6]], 2: [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 0, 6, 4, 6]],
  3: [[0, 0, 4, 0, 2, 2, 3, 2, 4, 3, 4, 5, 3, 6, 1, 6, 0, 5]], 4: [[3, 6, 3, 0, 0, 3, 0, 4, 4, 4]], 5: [[4, 0, 0, 0, 0, 3, 3, 3, 4, 4, 4, 5, 3, 6, 0, 6]],
  6: [[3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 3, 3, 0, 3]], 7: [[0, 0, 4, 0, 4, 1, 1, 4, 1, 6]],
  8: [[1, 3, 0, 2, 0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 3, 3, 1, 3, 0, 4, 0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 3, 3]], 9: [[4, 3, 1, 3, 0, 2, 0, 1, 1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6]],
  '.': [[2, 6, 2, 5.7]], '·': [[2, 3, 2, 3.3]], '-': [[1, 3, 3, 3]], ':': [[2, 1.5, 2, 1.8], [2, 4.5, 2, 4.8]], '/': [[0, 6, 4, 2, 4, 0]], '?': [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 2, 4], [2, 6, 2, 5.7]],
};
const TILDE = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U' };
function glifo(ch) {
  ch = ch.toUpperCase();
  if (GLIFOS[ch]) return GLIFOS[ch];
  if (TILDE[ch]) return [...GLIFOS[TILDE[ch]], [1.5, -1, 2.5, -2]];
  if (ch === 'Ñ') return [...GLIFOS.N, [1, -1.4, 3, -1.4]];
  if (ch !== ' ') console.warn(`[serigrafía] no tengo la letra «${ch}»: sale como «?»`);
  return ch === ' ' ? [] : GLIFOS['?'];
}
const anchoSerigrafia = (txt, cap) => txt.length * cap / 6 * 5.6 - cap / 6 * 1.6;
// traza txt con la base en (x, y) y altura de mayúscula cap; p 0→1 = cuánto se ha trazado (trazo por trazo, en orden)
function serigrafia(txt, x, y, cap, o = {}) {
  const { p = 1, col = '#F2EEE1', grosor = Math.max(1.5, cap * .1), alinear = 'izq' } = o, u = cap / 6, w = anchoSerigrafia(txt, cap);
  const x0 = alinear === 'centro' ? x - w / 2 : alinear === 'der' ? x - w : x;
  const trazos = []; [...txt].forEach((ch, i) => glifo(ch).forEach(s => trazos.push(s.map((v, k) => k % 2 ? y - cap + v * u : x0 + i * 5.6 * u + v * u))));
  const largos = trazos.map(s => { let l = 0; for (let k = 2; k < s.length; k += 2) l += Math.hypot(s[k] - s[k - 2], s[k + 1] - s[k - 1]); return Math.max(l, .01); });
  let resta = largos.reduce((a, b) => a + b, 0) * clamp(p);
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = grosor; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < trazos.length && resta > 0; i++) {
    const s = trazos[i]; ctx.beginPath(); ctx.moveTo(s[0], s[1]);
    for (let k = 2; k < s.length && resta > 0; k += 2) { const l = Math.hypot(s[k] - s[k - 2], s[k + 1] - s[k - 1]), f = Math.min(1, resta / Math.max(l, .01));
      ctx.lineTo(lerp(s[k - 2], s[k], f), lerp(s[k - 1], s[k + 1], f)); resta -= l; }
    if (s.length === 4 && largos[i] < u * .5) resta -= largos[i];
    ctx.stroke();
  }
  ctx.restore(); return w;
}
