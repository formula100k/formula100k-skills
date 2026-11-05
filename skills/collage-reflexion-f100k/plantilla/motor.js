// Motor del collage de reflexión. NO se edita por pieza: lee window.CONFIG (config.js),
// window.TIEMPOS (tiempos.js, lo escribe scripts/sincronizar.mjs) y window.CLIPS (clips/indice.js).
// Expone window.LISTO (promesa), window.draw(cuadro) (promesa) y window.FRAMES.
(function () {
const C = window.CONFIG, FPS = C.fps || 30, W = 1080, H = 1920;
const lienzo = document.getElementById('lienzo');
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const outBack = p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
const outCubic = p => 1 - Math.pow(1 - p, 3);
const rebote = p => { const n = 7.5625, d = 2.75; if (p < 1 / d) return n * p * p; if (p < 2 / d) return n * (p -= 1.5 / d) * p + .75; if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + .9375; return n * (p -= 2.625 / d) * p + .984375; };
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// ── colores y letra ─────────────────────────────────────────────
const COL = Object.assign({ papel: '#F4EFE6', tinta: '#1F1B16', acento: '#2F6FDB', acento2: '#F2C14E', suave: '#CFE0F7', alerta: '#E0452F', blanco: '#ffffff', negro: '#000000' }, C.colores || {});
const col = c => c == null ? null : (COL[c] || c);
const clara = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(col(hex) || ''); if (!m) return true; const n = parseInt(m[1], 16); return (.299 * (n >> 16) + .587 * (n >> 8 & 255) + .114 * (n & 255)) > 150; };
const FU = Object.assign({ sans: "'Avenir Next','Helvetica Neue',Arial,sans-serif", peso: 900, tracking: '-.04em', serif: "Georgia,'Times New Roman',serif", serifItalica: false, minusculas: true, web: null }, C.fuentes || {});
const rs = document.documentElement.style;
rs.setProperty('--sans', FU.sans); rs.setProperty('--peso', FU.peso); rs.setProperty('--tracking', FU.tracking);
rs.setProperty('--serif', FU.serif); rs.setProperty('--serif-estilo', FU.serifItalica ? 'italic' : 'normal');
rs.setProperty('--tinta', COL.tinta); rs.setProperty('--alerta', COL.alerta);
const TAM = Object.assign({ gigante: 460, xl: 250, l: 170, m: 116, s: 80, xs: 56 }, C.tamanos || {});

// ── tiempos: los de tiempos.js o, si aún no hay voz, una estimación ──
let T = window.TIEMPOS;
if (!T || !T.bloques || T.bloques.length !== C.bloques.length) {
  let t = 0; const bl = C.bloques.map(b => { const a = t; const pal = String(b.frase || '').split(/\s+/).filter(Boolean).map(p => { const o = { p, n: norm(p), a: t, z: t + .34 }; t += .36; return o; }); t += .3; return { a, z: t, palabras: pal }; });
  T = { dur: t + (C.cola == null ? 1.6 : C.cola), bloques: bl, estimado: true };
  bl.forEach((b, i) => b.z = i < bl.length - 1 ? bl[i + 1].a : T.dur);
}
const DUR = T.dur, FRAMES = Math.round(DUR * FPS);

// ── piezas ──────────────────────────────────────────────────────
function el(tag, cls, css) { const e = document.createElement(tag); if (cls) e.className = cls; if (css) Object.assign(e.style, css); return e; }
function pieza(B, e, t0, fx, o) { e.classList.add('k'); const p = Object.assign({ el: e, t0, fx: fx || 'aparece', base: '' }, o || {}); B.piezas.push(p); return p; }
// busca una palabra de la frase del bloque; 'cero#2' = la segunda vez que se dice «cero»
function buscar(B, palabra, desde) { const m = /^(.*?)#(\d+)$/.exec(String(palabra).trim().split(/\s+/)[0]) || [0, String(palabra).trim().split(/\s+/)[0], 1]; const w = norm(m[1]); let falta = +m[2]; if (!w) return -1; for (let k = desde || 0; k < B.pal.length; k++) if ((B.pal[k].n === w || B.pal[k].d === w) && --falta === 0) return k; return -1; }
function tiempoEn(B, en) {
  if (typeof en === 'number') return B.a + en;
  if (typeof en === 'string') { const k = buscar(B, en); if (k >= 0) return B.pal[k].a; console.warn(`[${B.b.id || B.i}] no encuentro «${en}» en la frase`); }
  return null;
}
// reparte en el tiempo las piezas que no se pudieron atar a una palabra
function rellenar(B, ps) {
  ps.forEach((p, i) => { if (p.t0 != null) return;
    let a = i - 1, z = i + 1; while (z < ps.length && ps[z].t0 == null) z++;
    const ta = a >= 0 ? ps[a].t0 : B.a + .05, tz = z < ps.length ? ps[z].t0 : Math.max(ta + .3, B.z - .5);
    p.t0 = a < 0 ? ta : Math.max(ta + .2, ta + (tz - ta) / (z - a)); });
}

// foto, clip (cuadros numerados) o hueco. rec: 'assets/x.jpg' | {foto} | {clip:'nombre'} | null
function medio(B, rec, padre, o) {
  o = o || {}; const m = el('div', 'medio'); (padre || B.raiz).appendChild(m);
  if (typeof rec === 'string') rec = /\.(jpe?g|png|webp|gif|svg)$/i.test(rec) ? { foto: rec } : { clip: rec };
  const info = rec && rec.clip ? (window.CLIPS || {})[rec.clip] : null;
  if (!rec || (!rec.foto && !info)) { const h = el('div', 'hueco'); h.textContent = 'AQUÍ VA: ' + ((rec && rec.nota) || (rec && rec.clip ? `el clip «${rec.clip}» (corre scripts/clip.mjs)` : 'tu foto o tu clip')); m.appendChild(h); return m; }
  const img = el('img'); if (rec.encuadre) img.style.objectPosition = rec.encuadre; m.appendChild(img);
  const origen = o.origen != null ? o.origen : B.a, zoom = rec.zoom == null ? .05 : rec.zoom;
  if (rec.foto) img.src = rec.foto;
  B.vivos.push(t => {
    let tt = o.fijo != null ? o.fijo : t, gris = !!o.gris;
    if (B.congela && t >= B.congela.a) { gris = true; tt = B.congela.a; if (B.congela.z != null && t >= B.congela.z) { gris = false; tt = t - (B.congela.z - B.congela.a); } }
    img.style.filter = (gris ? 'grayscale(1) contrast(1.1) brightness(.8) ' : '') + (rec.filtro || '');
    if (rec.foto) { img.style.transform = `scale(${1 + zoom * Math.max(0, tt - origen)})`; return; }
    let n = Math.floor(((tt - origen) * (rec.velocidad || 1) + (rec.desde || 0)) * info.fps + 1e-6);
    n = rec.bucle ? ((n % info.cuadros) + info.cuadros) % info.cuadros : cl(n, 0, info.cuadros - 1);
    const src = `clips/${rec.clip}/${String(n + 1).padStart(4, '0')}.jpg`;
    if (img.dataset.src !== src) { img.dataset.src = src; img.src = src; return img.decode().catch(() => {}); }
  });
  return m;
}
function velo(B, a, z) { if (!a && !z) return; const v = el('div', 'velo'); v.style.background = `linear-gradient(rgba(0,0,0,${a}),rgba(0,0,0,${Math.min(a, z) * .4}) 50%,rgba(0,0,0,${z}))`; B.raiz.appendChild(v); }

// ── texto ───────────────────────────────────────────────────────
function linea(B, L, def, padre, ancho) {
  L = Object.assign({}, def || {}, typeof L === 'string' ? { t: L } : L);
  const d = el('div', 'linea ' + (L.letra === 'serif' ? 'serif' : 'sans') + (L.mayus ? ' mayus' : FU.minusculas ? ' minus' : '') + (L.sombra ? ' sombra' : '') + (L.pildora ? ' pildora' : ''));
  const s = el('span'); s.textContent = L.t; d.appendChild(s);
  let px = TAM[L.tam] || +L.tam || TAM.l; d.style.fontSize = px + 'px';
  const tono = L.color != null ? L.color : (def || {}).color; if (tono) d.style.color = col(tono);
  padre.appendChild(d);
  const tope = (L.ancho || ancho || 960) - (L.pildora ? 100 : 0);
  for (let k = 0; k < 40 && s.getBoundingClientRect().width > tope; k++) { px *= .95; d.style.fontSize = px + 'px'; }
  const p = pieza(B, d, null, L.fx || (px >= TAM.xl * .9 || L.mayus ? 'golpe' : 'sube'), { esTexto: true, base: L.giro ? `rotate(${L.giro}deg)` : '' });
  if (L.sale != null) p.sale = tiempoEn(B, L.sale);
  return { p, L };
}
function textos(B, lista, o) {
  o = o || {}; if (!lista || !lista.length) return;
  const b = B.b, zona = o.zona || b.zona || 'arriba', ancho = b.textoAncho || o.ancho || 960;
  const pila = el('div', 'pila', { left: (W - ancho) / 2 + 'px', width: ancho + 'px' });
  if (b.textoY != null) pila.style.top = b.textoY + 'px';
  else if (zona === 'centro') { pila.style.top = '0'; pila.style.height = H + 'px'; pila.style.justifyContent = 'center'; }
  else if (zona === 'abajo') pila.style.bottom = '340px'; else pila.style.top = '230px';
  B.raiz.appendChild(pila);
  let ptr = 0; const ps = [];
  lista.forEach(L0 => {
    const L1 = typeof L0 === 'string' ? { t: L0 } : L0; let padre = pila, a = ancho;
    if (L1.y != null) { padre = el('div', '', { position: 'absolute', left: (L1.x != null ? L1.x : 0) + 'px', top: L1.y + 'px', width: (L1.x != null ? 'auto' : W + 'px'), display: 'flex', justifyContent: 'center' }); B.raiz.appendChild(padre); a = L1.x != null ? W - L1.x - 40 : 1000; }
    const { p, L } = linea(B, L1, Object.assign({ color: o.color, sombra: o.sombra }, o.def), padre, a); p.el.style.position = 'relative';
    if (L.en != null) p.t0 = tiempoEn(B, L.en);
    else { const k = buscar(B, L.t, ptr); if (k >= 0) { p.t0 = B.pal[k].a; ptr = k + 1; } }
    ps.push(p);
  });
  rellenar(B, ps);
}

// ── tarjetas, objetos, capturas sueltas ─────────────────────────
function tarjeta(c) {
  let d;
  if (c.tipo === 'calendario') { d = el('div', 'cal'); d.innerHTML = `<i>${esc(c.arriba)}</i><b>${esc(c.valor)}</b>`; if (String(c.valor).length > 4) d.style.width = 'auto', d.querySelector('b').style.padding = '6px 30px 22px'; }
  else if (c.tipo === 'contador') { d = el('div', 'chip'); d.innerHTML = `${esc(c.valor)}<small>${esc(c.etiqueta)}</small>`; d.style.fontSize = '76px'; }
  else if (c.tipo === 'etiqueta') { d = el('div', 'chip'); d.textContent = c.texto; }
  else if (c.tipo === 'burbuja') { d = el('div', 'burbuja'); d.textContent = c.texto; if (c.propia) { d.style.background = COL.acento; d.style.color = '#fff'; } }
  else if (c.tipo === 'pendiente' || (!c.img && !c.texto)) { d = el('div', 'falta', { width: (c.ancho || 420) + 'px', height: (c.alto || 260) + 'px' }); d.textContent = 'AQUÍ VA: ' + (c.texto || c.nota || 'tu captura'); }
  else if (c.tipo === 'objeto') { d = el('img', 'obj'); d.src = c.img; }
  else if (c.tipo === 'sticker') { d = el('img', 'stk'); d.src = c.img; }
  else if (c.img) { d = el('img', 'captura'); d.src = c.img; }
  else { d = el('div', 'chip'); d.textContent = c.texto; }
  if (c.ancho && d.tagName === 'IMG') d.style.width = c.ancho + 'px';
  if (c.tam) d.style.fontSize = c.tam + 'px';
  return d;
}
const SITIOS = [[290, 620], [790, 800], [300, 1230], [780, 1440], [540, 1020]];
function tarjetas(B, lista, o) {
  o = o || {}; const ps = [];
  (lista || []).forEach((c, i) => {
    const d = tarjeta(c), s = (o.sitios || SITIOS)[i % (o.sitios || SITIOS).length];
    d.style.left = (c.x != null ? c.x : s[0]) + 'px'; d.style.top = (c.y != null ? c.y : s[1]) + 'px';
    (o.padre || B.raiz).appendChild(d);
    const giro = c.giro != null ? c.giro : (i % 2 ? 6 : -7);
    const p = pieza(B, d, null, c.fx || o.fx || 'cae', { base: `translate(-50%,-50%) rotate(${giro}deg)`, flota: c.flota });
    if (o.ya && c.en == null) { p.t0 = -1; p.fx = 'ya'; }
    else p.t0 = c.en != null ? tiempoEn(B, c.en) : null;
    if (p.t0 == null) p.t0 = (o.desde != null ? o.desde : B.a + .4) + i * (o.paso || .45);
    if (c.sale != null) p.sale = tiempoEn(B, c.sale);
    ps.push(p);
  });
  return ps;
}
function persona(B, q, ya) {
  if (!q) return; const d = el('img', q.borde === false ? 'obj' : 'stk'); d.src = q.img; d.style.width = (q.ancho || 620) + 'px';
  d.style.left = (q.x != null ? q.x : 540) + 'px'; d.style.top = (q.y != null ? q.y : 1240) + 'px'; B.raiz.appendChild(d);
  const t0 = ya ? -1 : (q.en != null ? tiempoEn(B, q.en) : B.a);
  pieza(B, d, t0 == null ? B.a : t0, ya ? 'ya' : (q.fx || 'brota'), { base: 'translate(-50%,-50%)', flota: q.flota == null ? 5 : q.flota });
}
function pendiente(B) { const b = B.b; if (!b.pendiente || C.mostrarPendientes === false) return; const d = el('div', 'pend'); d.textContent = 'PENDIENTE · ' + b.pendiente; B.raiz.appendChild(d); }
function plano(B, defecto) { const c = col(B.b.plano || defecto); B.raiz.style.background = c; return clara(c) ? COL.tinta : '#fff'; }
// capas comunes a todos los tipos, en orden: persona → tarjetas → texto → aviso de pendiente
function comunes(B, o) { persona(B, B.b.persona); tarjetas(B, B.b.tarjetas); textos(B, B.b.texto, o); pendiente(B); }
function fondoDe(B, defecto) { // fondo liso o, si hay `fondo`, foto o clip
  if (B.b.fondo) { medio(B, B.b.fondo); velo(B, B.b.velo == null ? .3 : B.b.velo, .1); return { color: '#fff', sombra: true }; }
  return { color: plano(B, defecto) };
}

// ── tipos de bloque ─────────────────────────────────────────────
const TIPOS = {
  // 1 · foto o clip a pantalla completa con texto (puede congelarse y encogerse a un marco)
  toma(B) { const b = B.b;
    if (b.congela) { const g = typeof b.congela === 'object' ? b.congela : { en: b.congela }; B.congela = { a: tiempoEn(B, g.en), z: g.hasta != null ? tiempoEn(B, g.hasta) : null }; if (B.congela.a == null) B.congela = null; }
    const m = medio(B, b.recurso); B.raiz.style.background = '#000';
    if (b.encoge != null) { const te = tiempoEn(B, typeof b.encoge === 'object' ? b.encoge.en : b.encoge), k = (typeof b.encoge === 'object' && b.encoge.a) || .72; B.vivos.push(t => { const p = outCubic(cl((t - te) / .3)); m.style.transform = `scale(${1 - (1 - k) * p})`; }); }
    velo(B, b.velo == null ? .28 : b.velo, .12);
    comunes(B, { color: '#fff', sombra: true });
  },
  // 2 · remate: cuadro congelado en blanco y negro + palabra en mayúsculas
  remate(B) { const b = B.b, prev = B.prev;
    if (b.sigue && prev) medio(B, prev.b.recurso || prev.b.fondo, null, { gris: true, origen: prev.a, fijo: prev.z - 1 / FPS });
    else medio(B, b.recurso, null, { gris: true, fijo: b.movimiento ? null : B.a + .001 });
    velo(B, b.velo == null ? .2 : b.velo, .2);
    comunes(B, { color: '#fff', sombra: true, def: { mayus: true, tam: 'xl', fx: 'golpe' } });
  },
  // 3 · plano liso (o foto) + sticker de persona + tarjetas de dato que se le pegan
  sticker(B) { const b = B.b, prev = B.prev, o = fondoDe(B, 'acento');
    if (b.sigue && prev) { persona(B, prev.b.persona, true); tarjetas(B, (prev.b.tarjetas || []).map(c => Object.assign({}, c, { en: null })), { ya: true }); B.piezas.forEach(p => { p.t0 = -1; p.fx = 'ya'; }); }
    comunes(B, o);
  },
  // 4 · contenedor que se abre: cerrado → abierto con 1 a 3 piezas adentro
  contenedor(B) { const b = B.b, o = fondoDe(B, 'papel'), c = Object.assign({ cerrado: 'assets/casillero.png', abierto: 'assets/casillero-abierto.png', x: 540, y: 1060, ancho: 400 }, b.contenedor || {});
    let tA = c.abre != null ? tiempoEn(B, c.abre) : null; if (tA == null) tA = B.a + (B.z - B.a) * .4; if (!c.cerrado) tA = B.a;
    if (c.cerrado) { const i1 = el('img', 'obj', { left: c.x + 'px', top: c.y + 'px', width: c.ancho + 'px' }); i1.src = c.cerrado; B.raiz.appendChild(i1); pieza(B, i1, B.a, 'brota', { base: 'translate(-50%,-50%)', sale: tA }); }
    const i2 = el('img', 'obj', { left: (c.x + (c.abiertoDx != null ? c.abiertoDx : c.ancho * .068)) + 'px', top: c.y + 'px', width: (c.abiertoAncho || c.ancho * 1.295) + 'px' }); i2.src = c.abierto; B.raiz.appendChild(i2);
    pieza(B, i2, tA, c.cerrado ? 'pum' : 'brota', { base: 'translate(-50%,-50%)' });
    tarjetas(B, b.adentro, { desde: tA + .3, fx: 'brota', sitios: [[c.x - c.ancho * .12, c.y - c.ancho * .38], [c.x + c.ancho * .1, c.y + c.ancho * .18], [c.x - c.ancho * .05, c.y + c.ancho * .6]] });
    comunes(B, o);
  },
  // 5 · bandeja que llega por rodillos con 2 a 4 piezas
  bandeja(B) { const b = B.b, o = { color: plano(B, 'blanco') }, v = Object.assign({ ancho: 700, alto: 900, y: 430, color: 'acento', entra: 1.1 }, b.bandeja || {});
    const pista = el('div', 'pista', { left: '90px', width: '900px' }), rod = el('div', 'rodillos'); pista.appendChild(rod); B.raiz.appendChild(pista);
    const ch = el('div', 'charola', { left: (W - v.ancho) / 2 + 'px', top: '0', width: v.ancho + 'px', height: v.alto + 'px', background: col(v.color) }); B.raiz.appendChild(ch);
    const ps = tarjetas(B, b.piezas, { padre: ch, ya: true, fx: 'brota', sitios: [[v.ancho * .34, v.alto * .26], [v.ancho * .66, v.alto * .5], [v.ancho * .36, v.alto * .74], [v.ancho * .7, v.alto * .2]] });
    const tarde = ps.filter(p => p.t0 > B.a + v.entra * .6).map(p => p.t0);
    B.vivos.push(t => { const p = outCubic(cl((t - B.a) / v.entra)); let y = -v.alto - 60 + (v.y + v.alto + 60) * p; tarde.forEach(tt => y += 46 * outCubic(cl((t - tt) / .3))); y += Math.max(0, t - B.a - v.entra) * 14;
      ch.style.transform = `translateY(${y}px)`; rod.style.transform = `translateY(${((y % 70) + 70) % 70}px)`; });
    persona(B, b.persona); tarjetas(B, b.tarjetas); textos(B, b.texto, o); pendiente(B);
  },
  // 6 · negro con franja: foto o clip en franja + serif arriba + palabra gigante + serif abajo
  franja(B) { const b = B.b, y = b.franjaY == null ? 660 : b.franjaY, h = b.franjaAlto || 600; B.raiz.style.background = '#000';
    const f = el('div', '', { position: 'absolute', left: 0, top: y + 'px', width: W + 'px', height: h + 'px', overflow: 'hidden' }); B.raiz.appendChild(f); medio(B, b.recurso, f);
    const ps = [], caja = (top, alto, just) => { const d = el('div', '', { position: 'absolute', left: 0, top: top + 'px', width: W + 'px', height: alto + 'px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: just }); B.raiz.appendChild(d); return d; };
    let ptr = 0; const pon = (txt, def, padre) => { if (!txt) return; (Array.isArray(txt) ? txt : [txt]).forEach(x => { const { p, L } = linea(B, x, def, padre, 1000); p.el.style.position = 'relative'; if (L.en != null) p.t0 = tiempoEn(B, L.en); else { const k = buscar(B, L.t, ptr); if (k >= 0) { p.t0 = B.pal[k].a; ptr = k + 1; } } ps.push(p); }); };
    pon(b.arriba, { letra: 'serif', tam: 'm', color: '#fff' }, caja(y - 400, 380, 'flex-end'));
    pon(b.palabra, { tam: 'xl', color: '#fff', sombra: true, fx: 'golpe' }, caja(y, h, 'center'));
    pon(b.abajo, { letra: 'serif', tam: 'm', color: '#fff' }, caja(y + h + 20, 380, 'flex-start'));
    rellenar(B, ps); comunes(B, { color: '#fff', sombra: true });
  },
  // 7 · capturas reales: imágenes que caen como tarjetas y/o una captura o grabación dentro de un celular
  capturas(B) { const b = B.b, o = fondoDe(B, 'suave'), q = b.celular;
    if (q) { const w = q.ancho || 500, h = Math.round(w * 2.06), c = el('div', 'cel', { left: (q.x != null ? q.x : 540) + 'px', top: (q.y != null ? q.y : 1080) + 'px', width: w + 'px', height: h + 'px', borderRadius: w * .16 + 'px', padding: w * .035 + 'px' });
      const pa = el('div', 'pant', { borderRadius: w * .125 + 'px' }); c.appendChild(pa); c.appendChild(el('div', 'isla')); B.raiz.appendChild(c);
      medio(B, q.captura || q.clip ? (q.captura ? { foto: q.captura, zoom: 0, encuadre: q.encuadre || '50% 0%' } : Object.assign({ clip: q.clip }, q)) : { nota: q.nota || 'tu captura o tu grabación de pantalla' }, pa);
      const t0 = q.en != null ? tiempoEn(B, q.en) : B.a; pieza(B, c, t0 == null ? B.a : t0, 'brota', { base: `translate(-50%,-50%) rotate(${q.giro || 0}deg)` }); }
    tarjetas(B, (b.cartas || []).map(c => typeof c === 'string' ? { img: c } : c), { desde: B.a + (q ? .7 : .15), paso: .4, sitios: q ? [[250, 640], [830, 880], [240, 1330], [840, 1520]] : [[430, 600], [660, 930], [420, 1270], [680, 1530]] });
    comunes(B, o);
  },
  // 8 · carpeta con cursor de la que salen fichas que se tachan
  carpeta(B) { const b = B.b, o = fondoDe(B, 'acento'), c = Object.assign({ img: 'assets/carpeta.png', x: 540, y: 1080, ancho: 460 }, b.carpeta || {});
    let tA = c.abre != null ? tiempoEn(B, c.abre) : null; if (tA == null) tA = B.a + .75;
    const fichas = (b.fichas || []).map(f => Object.assign({ tam: 84 }, typeof f === 'string' ? { texto: f } : f)), sitios = b.sitios || [[270, c.y - 420], [800, c.y - 250], [250, c.y + 330], [810, c.y + 440], [540, c.y - 560], [540, c.y + 600]];
    const im = el('img', 'obj', { left: c.x + 'px', top: c.y + 'px', width: c.ancho + 'px' }); im.src = c.img; B.raiz.appendChild(im); pieza(B, im, B.a, 'brota', { base: 'translate(-50%,-50%) rotate(-4deg)', flota: 4 });
    let ptr = 0; const fs = fichas.map((f, i) => { const d = tarjeta(f), s = sitios[i % sitios.length], x = f.x != null ? f.x : s[0], y = f.y != null ? f.y : s[1];
      d.style.left = x + 'px'; d.style.top = y + 'px'; B.raiz.appendChild(d); const raya = el('div', 'tacha'); if (d.tagName !== 'IMG') { d.style.position = 'absolute'; d.appendChild(raya); }
      const p = pieza(B, d, null, 'vuela', { base: `translate(-50%,-50%) rotate(${f.giro != null ? f.giro : (i % 2 ? 5 : -6)}deg)`, dx: c.x - x, dy: c.y - y });
      if (f.en != null) p.t0 = tiempoEn(B, f.en); else if (f.texto) { const k = buscar(B, f.texto.replace(/^[^\wáéíóúñ]+/i, ''), ptr); if (k >= 0) { p.t0 = Math.max(tA + .1, B.pal[k].a); ptr = k + 1; } }
      return { p, f, d, raya }; });
    fs.forEach((x, i) => { if (x.p.t0 == null) x.p.t0 = tA + .15 + i * .35; });
    const tT = b.tacha != null ? tiempoEn(B, b.tacha) : null;
    fs.forEach((x, i) => { x.tt = x.f.tacha != null ? tiempoEn(B, x.f.tacha) : (tT != null ? tT + i * .28 : x.p.t0 + .7); if (x.f.tacha === false) x.tt = 1e9;
      B.vivos.push(t => { const p = outCubic(cl((t - x.tt) / .22)); x.raya.style.width = 110 * p + '%'; x.d.style.filter = p > 0 ? `grayscale(${p}) opacity(${1 - .35 * p})` : ''; if (b.seVan && t > x.tt + .5) x.d.style.opacity = 1 - cl((t - x.tt - .5) / .2); }); });
    if (c.cursor !== false) { const cu = el('div', '', { left: (c.x + c.ancho * .12) + 'px', top: (c.y + c.ancho * .16) + 'px', width: '110px' }); cu.innerHTML = '<svg viewBox="0 0 40 52" width="110"><path d="M4 3v38l10-9 7 16 7-3-7-16h14z" fill="#fff" stroke="#1f1b16" stroke-width="3.5" stroke-linejoin="round"/></svg>'; B.raiz.appendChild(cu); pieza(B, cu, tA - .6, 'cursor'); }
    comunes(B, o);
  },
  // 9 · eco: el bloque anterior, borroso y sin color, detrás del texto siguiente
  eco(B) { const b = B.b; B.raiz.style.background = '#999';
    const caja = el('div', '', { position: 'absolute', inset: '-50px', filter: `grayscale(1) blur(${b.desenfoque == null ? 16 : b.desenfoque}px) brightness(${b.brillo || .85})` }), dentro = el('div', 'esc', { inset: '50px' }); caja.appendChild(dentro); B.raiz.appendChild(caja);
    if (B.i > 0) { const P = crear(B.i - 1, dentro, true); B.vivos.push(() => pinta(P, P.z - 1 / FPS, true)); }
    velo(B, b.velo == null ? .12 : b.velo, .12);
    comunes(B, { color: '#fff', sombra: true });
  },
  // 10 · texto apilado al ritmo de la voz (si no das `texto`, se arma solo con las palabras de la frase)
  apilado(B) { const b = B.b; let o;
    if (b.recurso) { const m = medio(B, b.recurso); if (b.desenfoca) m.style.filter = `blur(${b.desenfoca}px)`, m.style.inset = '-40px'; velo(B, b.velo == null ? .34 : b.velo, .2); o = { color: '#fff', sombra: true }; }
    else o = { color: plano(B, 'papel') };
    if (!b.texto) { const g = []; let cur = '';
      B.pal.forEach(w => { const p = w.p.replace(/[.,;:!?]+$/, ''); if (cur && (cur + ' ' + p).length > 11) { g.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p; }); if (cur) g.push(cur);
      b.texto = g.map((t, i) => ({ t, letra: i % 2 ? 'serif' : 'sans', tam: i % 2 ? 'm' : 'l', color: i === g.length - 1 ? (b.recurso ? 'acento2' : 'acento') : null })); }
    o.zona = b.zona || 'centro'; comunes(B, o);
  },
  // 11 · cierre: «Comenta PALABRA…» + objeto de regalo
  cierre(B) { const b = B.b, o = fondoDe(B, 'acento2'), r = b.regalo === null ? null : Object.assign({ img: 'assets/regalo.png', x: 800, y: 1330, ancho: 380 }, b.regalo || {});
    persona(B, b.persona);
    const lista = [{ t: b.verbo || 'comenta', letra: 'serif', tam: 'm' }, { t: b.palabra || 'PALABRA', mayus: true, pildora: true, tam: 215, giro: -3, fx: 'golpe', color: 'tinta' }]
      .concat((b.promesa || []).map((t, i) => typeof t === 'string' ? { t, letra: i % 2 ? 'serif' : 'sans', tam: 'm' } : t));
    textos(B, lista, o);
    if (r) { const d = el('img', 'obj', { left: r.x + 'px', top: r.y + 'px', width: r.ancho + 'px' }); d.src = r.img; B.raiz.appendChild(d); let t0 = r.en != null ? tiempoEn(B, r.en) : null; if (t0 == null) { const k = buscar(B, b.palabra || '', 0); t0 = k >= 0 ? B.pal[k].z + .25 : B.a + 1.2; } pieza(B, d, t0, 'cae', { base: 'translate(-50%,-50%) rotate(8deg)', flota: 7 }); }
    tarjetas(B, b.tarjetas);
    if (b.firma) { const d = el('div', 'firma', { left: '0', width: W + 'px', top: (b.firmaY || 1560) + 'px', textAlign: 'center', color: o.color }); d.textContent = b.firma; B.raiz.appendChild(d); pieza(B, d, B.a + .3, 'aparece'); }
    pendiente(B);
  },
};

// ── armado y pintado ────────────────────────────────────────────
function crear(i, padre, copia) {
  const b = C.bloques[i], tt = T.bloques[i];
  const B = { i, b, a: tt.a, z: i === C.bloques.length - 1 ? DUR + 1 : tt.z, pal: tt.palabras || [], piezas: [], vivos: [], raiz: el('div', 'esc') };
  B.prev = i > 0 ? { b: C.bloques[i - 1], a: T.bloques[i - 1].a, z: T.bloques[i - 1].z } : null;
  (padre || lienzo).appendChild(B.raiz);
  const f = TIPOS[b.tipo]; if (!f) throw new Error(`Bloque ${i + 1}: no existe el tipo «${b.tipo}». Tipos: ${Object.keys(TIPOS).join(', ')}`);
  f(B); if (copia) B.raiz.querySelectorAll('.pend').forEach(e => e.remove());
  return B;
}
function pinta(B, t, sinTexto) {
  const out = [];
  for (const p of B.piezas) { const e = p.el;
    if (t < p.t0 || (p.sale != null && t >= p.sale) || (sinTexto && p.esTexto)) { e.style.opacity = 0; continue; }
    const d = t - p.t0; let dx = 0, dy = 0, s = 1, op = 1;
    if (p.fx === 'brota') { s = .3 + .7 * outBack(cl(d / .3)); op = cl(d / .08); }
    else if (p.fx === 'sube') { dy = (1 - outCubic(cl(d / .24))) * 70; op = cl(d / .12); }
    else if (p.fx === 'izq') { dx = (outCubic(cl(d / .26)) - 1) * 220; op = cl(d / .1); }
    else if (p.fx === 'golpe') { s = 1.7 - .7 * outCubic(cl(d / .2)); op = cl(d / .07); }
    else if (p.fx === 'cae') { dy = (rebote(cl(d / .45)) - 1) * 220; op = cl(d / .06); }
    else if (p.fx === 'aparece') { op = cl(d / .25); }
    else if (p.fx === 'pum') { s = 1 + .12 * Math.sin(cl(d / .22) * Math.PI); }
    else if (p.fx === 'vuela') { const q = outBack(cl(d / .38)); dx = p.dx * (1 - q); dy = p.dy * (1 - q); s = .2 + .8 * cl(d / .3); op = cl(d / .08); }
    else if (p.fx === 'cursor') { const q = outCubic(cl(d / .5)); dx = (1 - q) * -380; dy = (1 - q) * 300; s = d > .55 && d < .72 ? .82 : 1; if (d > 1.6) op = 1 - cl((d - 1.6) / .2); }
    let fl = '';
    if (p.flota) { const q = Math.floor(t * 12) / 12; dy += Math.sin(q * 2.1 + p.t0) * p.flota; fl = ` rotate(${Math.sin(q * 1.6 + p.t0 * 3) * p.flota * .22}deg)`; } // a saltos, 12 por segundo
    e.style.opacity = op; e.style.transform = `translate(${dx}px,${dy}px) ${p.base} scale(${s})${fl}`;
  }
  for (const v of B.vivos) { const r = v(t); if (r && r.then) out.push(r); }
  return out;
}

let BL = [];
window.LISTO = (async () => {
  if (FU.web) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FU.web; document.head.appendChild(l); await new Promise(r => { l.onload = r; l.onerror = r; }); }
  const pide = [`${FU.peso} 100px ${FU.sans.split(',')[0]}`, `${FU.serifItalica ? 'italic ' : ''}100px ${FU.serif.split(',')[0]}`, `800 100px ${FU.sans.split(',')[0]}`, `700 100px ${FU.sans.split(',')[0]}`];
  await Promise.all(pide.map(f => document.fonts.load(f).catch(() => {}))); await document.fonts.ready;
  window.FUENTES_OK = !FU.web || (document.fonts.check(pide[0]) && document.fonts.check(pide[1]));
  BL = C.bloques.map((_, i) => crear(i));
  await Promise.all([...document.images].filter(i => i.src).map(i => i.decode().catch(() => console.warn('no cargó', i.getAttribute('src')))));
  window.ROTAS = [...document.images].filter(i => i.getAttribute('src') && !i.naturalWidth).map(i => i.getAttribute('src'));
  BL.forEach(B => B.raiz.style.display = 'none');
  return true;
})();
window.draw = async f => { await window.LISTO; const t = f / FPS, esp = [];
  BL.forEach(B => { const on = t >= B.a && t < B.z; B.raiz.style.display = on ? 'block' : 'none'; if (on) esp.push(...pinta(B, t)); });
  await Promise.all(esp); };
window.FRAMES = FRAMES; window.DUR = DUR; window.FPS_PIEZA = FPS;

// vista rápida en Chrome: index.html#12.5 (segundo fijo) o index.html#play (corre con la voz)
window.LISTO.then(() => { const h = location.hash.slice(1);
  if (h === 'play') { const au = C.audio ? new Audio(C.audio) : null, t0 = performance.now(); if (au) au.play().catch(() => {}); const paso = () => { const t = au && !au.paused ? au.currentTime : (performance.now() - t0) / 1000; if (t < DUR) { window.draw(Math.round(t * FPS)); requestAnimationFrame(paso); } }; paso(); }
  else if (h) window.draw(Math.round(parseFloat(h) * FPS)); });
})();
