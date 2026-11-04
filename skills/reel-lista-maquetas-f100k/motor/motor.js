// ============================================================================
// MOTOR — arma el reel desde window.ESCENAS y expone el contrato de render:
//   window.draw(frame) -> firma (string; si no cambia, el cuadro es idéntico al anterior)
//   window.FRAMES, window.FPS, window.EVENTOS (sonidos: [{t, sfx}]), window.LISTO (promesa)
// draw es función pura del número de cuadro. Nada de Math.random ni Date.
// ============================================================================
(function () {
const E = window.ESCENAS, F = E.formato || {}, MARCA = E.marca || {};
const FPS = F.fps || 30;
const esc = window.MAQ_UTIL.esc;
if (MARCA.acento) document.documentElement.style.setProperty('--acento', MARCA.acento);
if (MARCA.acento_oscuro) document.documentElement.style.setProperty('--acento-osc', MARCA.acento_oscuro);

// ---------- lista de escenas con sus tiempos ----------
const items = E.items || [];
const TOTAL = E.total || items.length, DESDE = E.desde || 0;
const escenas = [];
if (E.gancho) escenas.push({ ...E.gancho, _tipo: 'gancho', dur: E.gancho.dur || 2.2 });
items.forEach((it, i) => escenas.push({ ...it, _tipo: 'item', _n: DESDE + i + 1, dur: it.dur || 2.6 }));
if (E.cierre) escenas.push({ ...E.cierre, _tipo: 'cierre', dur: E.cierre.dur || 3.6 });
let acc = 0; escenas.forEach(s => { s._ini = acc; acc += s.dur; });
const DUR = acc, FRAMES = Math.round(DUR * FPS);

// ---------- titular: palabras que entran con corte seco, la clave más grande y en color ----------
function titularHTML(s) {
  const txt = s.titular || '';
  // *clave* puede abarcar varias palabras; el punto final va en color
  const partes = []; let clave = false;
  txt.split(/(\*)/).forEach(seg => { if (seg === '*') { clave = !clave; return; } seg.split(/(\s+)/).forEach(w => { if (w) partes.push({ w, clave }); }); });
  const palabras = partes.filter(p => !/^\s+$/.test(p.w));
  const voz = s.voz_dur || s.dur * .8;
  const ventana = Math.max(.3, Math.min(s.dur * .7, voz * .85));
  const largo = palabras.reduce((a, p) => a + p.w.length + 1, 0);
  let cum = 0; let tiempos = s.palabras_t || palabras.map(p => { const t = cum / largo * ventana; cum += p.w.length + 1; return t; });
  // si la voz dice más que el titular, cada palabra entra cuando la voz la nombra (posición en el texto de la voz)
  const norm = x => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñ ]/g, '');
  if (!s.palabras_t && s.voz && s.voz_dur) {
    const v = norm(s.voz); let desde = 0; const pos = [];
    for (const p of palabras) { const w = norm(p.w); const j = w ? v.indexOf(w, desde) : -1; if (j < 0) { pos.length = 0; break; } pos.push(j); desde = j + w.length; }
    if (pos.length === palabras.length) tiempos = pos.map(j => j / Math.max(1, v.length) * s.voz_dur * .92);
  }
  let k = 0;
  return partes.map(p => {
    if (/^\s+$/.test(p.w)) return ' ';
    const t = tiempos[k++] || 0;
    let w = esc(p.w), punto = '';
    const m = w.match(/^(.*?)([.:!?]+)$/); if (m && m[1]) { w = m[1]; punto = `<span class="punto">${m[2]}</span>`; }
    return `<span class="w${p.clave ? ' clave' : ''}" data-t="${t.toFixed(2)}">${w}${punto}</span>`;
  }).join('');
}

// ---------- construir el DOM ----------
const lienzo = document.getElementById('lienzo');
lienzo.innerHTML = '<div class="fondo"></div>';
escenas.forEach((s, i) => {
  const sec = document.createElement('section'); sec.className = 'escena'; sec.dataset.i = i;
  const k = Math.max(.75, Math.min(1.7, s.dur / 2.6));
  const ctx = { T: x => x * k, D: s.dur, dominio: MARCA.dominio || 'miapp.com', handle: MARCA.handle || '@tucuenta', foto: MARCA.foto, acento: MARCA.acento };
  let arriba = '';
  if (s._tipo === 'gancho') {
    const col = { rojo: 'var(--rojo)', verde: 'var(--verde)', amarillo: 'var(--amarillo)', acento: 'var(--acento)' }[s.color || 'rojo'] || s.color;
    arriba = `<div class="gancho"><div class="g1" style="font-size:${s.tam_grande || (s.grande.length > 14 ? 104 : 128)}px" data-t="0">${esc(s.grande)}</div>` +
      `<div class="g2" style="font-size:${s.tam_chica || 58}px;color:${col}" data-t="${(s.t_chica ?? .2).toFixed(2)}">${esc(s.chica || '')}</div></div>`;
  } else {
    arriba = `<div class="titular"><div class="txt">${titularHTML(s)}</div></div>`;
  }
  const maq = s.maqueta || (s._tipo === 'gancho' ? { tipo: 'objetivo' } : s._tipo === 'cierre' ? { tipo: 'cierre', palabra: s.palabra, regalo: s.regalo, bio: s.bio } : null);
  let centro = '';
  if (maq) {
    const f = window.MAQUETAS[maq.tipo];
    if (!f) console.error(`Maqueta desconocida: «${maq.tipo}» (escena ${i + 1}). Tipos: ${Object.keys(window.MAQUETAS).join(', ')}`);
    else centro = f(maq, ctx);
  }
  sec.innerHTML = arriba + `<div class="centro">${centro}</div>`;
  lienzo.appendChild(sec);
});
// barra de progreso + pastilla del @ (fijas)
lienzo.insertAdjacentHTML('beforeend',
  `<div class="barra" id="barra"><span class="num" id="bnum"></span><span class="riel"><span class="lleno" id="blleno"></span></span><span class="cat" id="bcat"></span></div>` +
  `<div class="pie"><span class="ava">${MARCA.foto ? `<img src="${esc(MARCA.foto)}">` : esc((MARCA.handle || '@t').replace('@', '')[0] || 'T').toUpperCase()}</span>${esc(MARCA.handle || '@tucuenta')}</div>`);

// ---------- índice de elementos con tiempo ----------
const idx = [...lienzo.querySelectorAll('.escena')].map((sec, i) => {
  const els = [...sec.querySelectorAll('[data-t],[data-a]')].map(el => ({
    el, t: +(el.dataset.t || 0), hasta: el.dataset.hasta != null ? +el.dataset.hasta : null,
    a: el.dataset.a ? el.dataset.a.split(',').map(Number) : null,
    cuenta: el.dataset.cuenta ? el.dataset.cuenta.split(',').map(Number) : null,
  }));
  return { sec, els, s: escenas[i] };
});
// eventos de sonido (tiempo global)
const EVENTOS = [];
idx.forEach(({ els, s }, i) => {
  if (i > 0) EVENTOS.push({ t: +s._ini.toFixed(3), sfx: 'corte' });
  if (s._tipo === 'gancho') EVENTOS.push({ t: 0, sfx: 'golpe' });
  els.forEach(o => { const sf = o.el.dataset.sfx; if (sf && sf !== 'null') EVENTOS.push({ t: +(s._ini + (o.a ? o.a[0] : o.t)).toFixed(3), sfx: sf }); });
});
EVENTOS.sort((a, b) => a.t - b.t);

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const barra = document.getElementById('barra'), bnum = document.getElementById('bnum'), blleno = document.getElementById('blleno'), bcat = document.getElementById('bcat');
let activa = -1;

function draw(frame) {
  const t = Math.min(frame, FRAMES - 1) / FPS;
  let i = escenas.findIndex(s => t >= s._ini && t < s._ini + s.dur); if (i < 0) i = escenas.length - 1;
  if (i !== activa) { if (activa >= 0) idx[activa].sec.classList.remove('activa'); idx[i].sec.classList.add('activa'); activa = i; }
  const { els, s } = idx[i], tl = t - s._ini;
  let firma = i + ':';
  for (const o of els) {
    const vis = tl >= o.t && (o.hasta == null || tl < o.hasta);
    o.el.style.visibility = vis ? 'visible' : 'hidden';
    firma += vis ? '1' : '0';
    if (o.a) {
      const p = ease((tl - o.a[0]) / Math.max(.01, o.a[1] - o.a[0]));
      o.el.style.setProperty('--p', p.toFixed(3)); firma += p.toFixed(3);
      if (o.cuenta) { const seg = Math.round(o.cuenta[0] + (o.cuenta[1] - o.cuenta[0]) * p); o.el.textContent = Math.floor(seg / 60) + ':' + String(seg % 60).padStart(2, '0'); }
    }
  }
  if (s._tipo === 'item' && E.barra !== false) {
    barra.style.visibility = 'visible';
    const p = ease(tl / .35), v = ((s._n - 1) + p) / TOTAL;
    blleno.style.width = (v * 100).toFixed(2) + '%';
    bnum.textContent = String(s._n).padStart(2, '0') + '/' + String(TOTAL).padStart(2, '0');
    bcat.textContent = s.categoria || '';
    firma += 'b' + v.toFixed(4);
  } else { barra.style.visibility = 'hidden'; firma += 'nb'; }
  return firma;
}

window.draw = draw; window.FRAMES = FRAMES; window.FPS = FPS; window.EVENTOS = EVENTOS; window.DUR = DUR;
// ajustar el tamaño del titular para que quepa (la clave 1,25x, los conectores normales)
function ajustarTitulares() {
  // gancho: la línea enorme siempre en UNA línea (sin tercera línea en pantalla)
  document.querySelectorAll('.gancho .g1').forEach(el => { const sec = el.closest('.escena'); sec.classList.add('activa'); el.style.whiteSpace = 'nowrap';
    let fs = parseFloat(el.style.fontSize); while (el.scrollWidth > el.clientWidth + 1 && fs > 50) { fs -= 4; el.style.fontSize = fs + 'px'; } sec.classList.remove('activa'); });
  document.querySelectorAll('.titular .txt').forEach(el => {
  const n = el.textContent.length;
  let base = n <= 16 ? 92 : n <= 26 ? 82 : n <= 40 ? 70 : 60;
  const aplicar = () => { el.style.fontSize = base + 'px'; el.querySelectorAll('.clave').forEach(c => c.style.fontSize = '1.25em'); };
  const sec = el.closest('.escena'); sec.classList.add('activa');
  aplicar(); while (el.offsetHeight > 255 && base > 40) { base -= 4; aplicar(); }
  sec.classList.remove('activa');
}); }
window.LISTO = (document.fonts ? Promise.all(['900 80px Inter', '800 80px Inter', '600 30px Inter', '400 20px "JetBrains Mono"', '700 20px "JetBrains Mono"'].map(f => document.fonts.load(f))).then(() => document.fonts.ready) : Promise.resolve()).then(() => { ajustarTitulares(); activa = -1; idx.forEach(o => o.sec.classList.remove('activa')); draw(0); return true; });
if (!/[?&]render/.test(location.search)) {
  // vista previa en vivo al abrir el HTML con doble clic
  let f = 0; const tick = () => { draw(f); f = (f + 1) % FRAMES; setTimeout(tick, 1000 / FPS); }; window.LISTO.then(tick);
  document.body.style.transformOrigin = '0 0';
  const z = () => { const s = Math.min(innerWidth / 1080, innerHeight / 1920); document.getElementById('lienzo').style.transform = `scale(${s})`; document.getElementById('lienzo').style.transformOrigin = '0 0'; };
  addEventListener('resize', z); z();
}
})();
