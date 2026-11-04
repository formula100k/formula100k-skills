// ============================================================================
// MOTOR «CUADERNO» — mismo contrato de render que motor.js:
//   window.draw(frame) -> firma · window.FRAMES · window.FPS · window.EVENTOS · window.LISTO
// Escenas: gancho → intro (opcional) → ítems agrupados → cierre.
// Cada ítem: encabezado de su grupo con puntitos, la lista del grupo que se acumula
// (la fila nueva entra con corte seco), un boceto a lápiz que se dibuja y el subtítulo en papelito.
// draw es función pura del cuadro. Nada de Math.random ni Date.
// ============================================================================
(function () {
const E = window.ESCENAS, F = E.formato || {}, MARCA = E.marca || {};
const FPS = F.fps || 30;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const R = document.documentElement.style;
if (MARCA.acento) R.setProperty('--acento', MARCA.acento);
if (MARCA.raya) R.setProperty('--raya', MARCA.raya);
if (MARCA.papel) R.setProperty('--papel', MARCA.papel);

// ---------- atributos de tiempo (los mismos que maquetas.js) ----------
const A = (t, o = {}) => ` data-t="${(+t).toFixed(2)}"` + (o.hasta != null ? ` data-hasta="${(+o.hasta).toFixed(2)}"` : '') +
  (o.a ? ` data-a="${o.a.map(v => (+v).toFixed(2)).join(',')}"` : '') + (o.sfx ? ` data-sfx="${o.sfx}"` : '');

// ---------- primitivas de lápiz (viewBox 800x500 en los bocetos) ----------
// cada trazo: pathLength=1 y se dibuja con --p entre a0 y a1
const tz = (tag, attrs, a0, a1, cls = '', sfx) => `<${tag} pathLength="1" class="trazo ${cls}" ${attrs}${A(a0, { a: [a0, a1], sfx })}/>`;
const L = (x1, y1, x2, y2, a0, a1, c) => tz('path', `d="M${x1} ${y1} L${x2} ${y2}"`, a0, a1, c);
const Rc = (x, y, w, h, a0, a1, c, sfx) => tz('path', `d="M${x} ${y} H${x + w} V${y + h} H${x} Z"`, a0, a1, c, sfx);
const Ci = (cx, cy, r, a0, a1, c) => tz('path', `d="M${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx + r - .01} ${cy - .5}"`, a0, a1, c);
const P = (d, a0, a1, c, sfx) => tz('path', `d="${d}"`, a0, a1, c, sfx);
const Tx = (x, y, txt, t, c = '', size, anchor = 'start') => `<text x="${x}" y="${y}" class="rot ${c}" text-anchor="${anchor}"${size ? ` style="font-size:${size}px"` : ''}${A(t)}>${esc(txt)}</text>`;
const OK = (x, y, s, a0, a1) => P(`M${x} ${y} l${s * .35} ${s * .38} l${s * .75} -${s * .85}`, a0, a1, 'ac');
const NO = (x, y, w, h, a0, a1) => L(x, y, x + w, y + h, a0, a0 + (a1 - a0) / 2, 'ac') + L(x + w, y, x, y + h, a0 + (a1 - a0) / 2, a1, 'ac');
const svg = (inner, vb = '0 0 800 500') => `<svg viewBox="${vb}" class="lapiz">${inner}</svg>`;

// ---------- bocetos: cada uno recibe (m, at) — at(f) = segundo f del tramo de dibujo ----------
const BOCETOS = {
  // dos pantallas: la de la izquierda tachada, la de la derecha con ✓
  pantallas: (m, at) => {
    const izq = m.izq || '', der = m.der || '';
    return svg(Rc(150, 20, 220, 400, at(0), at(.18), '', 'swish') + Ci(255, 120, 45, at(.12), at(.25)) + Ci(320, 200, 28, at(.18), at(.28)) +
      L(180, 300, 340, 300, at(.25), at(.32)) + L(180, 340, 300, 340, at(.3), at(.36)) + NO(150, 20, 220, 400, at(.38), at(.55)) +
      Rc(430, 20, 220, 400, at(.5), at(.66)) + L(460, 80, 620, 80, at(.6), at(.66)) + L(460, 125, 580, 125, at(.64), at(.7)) +
      Rc(460, 180, 160, 50, at(.68), at(.78)) + OK(500, 320, 90, at(.8), at(.95)) +
      (izq ? Tx(260, 475, izq, at(.4), '', 36, 'middle') : '') + (der ? Tx(540, 475, der, at(.9), '', 36, 'middle') : ''));
  },
  // tres opciones; la elegida se marca
  opciones: (m, at) => {
    const op = m.opciones || ['opción 1', 'opción 2', 'opción 3'], k = m.elegida ?? op.length - 1;
    return svg(op.map((o, i) => {
      const y = 30 + i * 150, a = at(i * .22);
      return Rc(120, y, 560, 100, a, a + at(.14) - at(0), i === k ? '' : 'fino', i === 0 ? 'swish' : null) + Tx(160, y + 64, o, a + .15, i === k ? 'ac' : '', 44) +
        (i === k ? OK(600, y + 30, 60, at(.78), at(.95)) : '');
    }).join(''));
  },
  // pasos en fila con flechas
  pasos: (m, at) => {
    const ps = m.pasos || ['1', '2', '3', '4'], n = ps.length, w = 150, gap = (800 - n * w) / (n - 1 || 1);
    return svg(ps.map((p, i) => {
      const x = i * (w + gap), a = at(i / n * .9);
      return Rc(x, 160, w, 150, a, a + .25, '', i === 0 ? 'swish' : null) + Tx(x + w / 2, 250, p, a + .2, i === n - 1 ? 'ac' : '', 36, 'middle') +
        (i < n - 1 ? P(`M${x + w + 12} 235 H${x + w + gap - 14} M${x + w + gap - 30} 222 L${x + w + gap - 14} 235 L${x + w + gap - 30} 248`, a + .2, a + .4, 'ac') : '');
    }).join(''));
  },
  // comentario con la palabra y la respuesta
  chat: (m, at) => svg(
    P('M80 40 H560 V170 H180 L120 220 V170 H80 Z', at(0), at(.25), '', 'swish') + Tx(120, 125, m.palabra || 'PALABRA', at(.28), 'ac sans', 60) +
    P('M720 270 H240 V400 H620 L680 450 V400 H720 Z', at(.5), at(.72)) + L(290, 320, 660, 320, at(.75), at(.82), 'fino') + L(290, 360, 560, 360, at(.8), at(.88), 'fino') +
    (m.respuesta ? Tx(480, 490, m.respuesta, at(.9), '', 38, 'middle') : '')),
  // semana: 7 columnas, se marcan los días
  calendario: (m, at) => {
    const dias = m.dias || ['L', 'M', 'M', 'J', 'V', 'S', 'D'], marca = m.marca || [0, 2, 4];
    let s = Rc(40, 40, 720, 400, at(0), at(.2), '', 'swish') + L(40, 120, 760, 120, at(.18), at(.26));
    dias.forEach((d, i) => { const x = 40 + i * 720 / 7; if (i) s += L(x, 40, x, 440, at(.2 + i * .02), at(.3 + i * .02), 'fino'); s += Tx(x + 51, 95, d, at(.3), '', 40, 'middle'); });
    marca.forEach((i, j) => { const x = 40 + i * 720 / 7 + 51; s += Ci(x, 260, 34, at(.45 + j * .15), at(.58 + j * .15), 'ac'); });
    return svg(s);
  },
  // gráfica que sube
  grafica: (m, at) => svg(
    L(80, 40, 80, 430, at(0), at(.15), '', 'swish') + L(80, 430, 760, 430, at(.12), at(.27)) +
    P('M100 390 L230 350 L340 370 L460 260 L570 220 L700 90', at(.3), at(.75), 'ac') + Ci(700, 90, 30, at(.78), at(.9), 'ac') +
    (m.etiqueta ? Tx(660, 160, m.etiqueta, at(.85), '', 38, 'end') : '')),
  // ficha con diana (avatar, a quién le hablas)
  ficha: (m, at) => svg(
    Rc(120, 20, 330, 430, at(0), at(.2), '', 'swish') + Ci(285, 140, 60, at(.15), at(.3)) + L(170, 260, 400, 260, at(.3), at(.38)) +
    L(170, 310, 360, 310, at(.35), at(.42)) + L(170, 360, 390, 360, at(.4), at(.48)) +
    Ci(610, 230, 120, at(.5), at(.65)) + Ci(610, 230, 75, at(.6), at(.72), 'ac') + Ci(610, 230, 28, at(.68), at(.78), 'ac') +
    P('M760 80 L620 222 M745 70 L770 70 L770 95', at(.8), at(.95)) + (m.etiqueta ? Tx(610, 410, m.etiqueta, at(.85), '', 38, 'middle') : '')),
  // lista con ✓
  lista: (m, at) => {
    const n = m.filas || 3; let s = Rc(150, 10, 500, 440, at(0), at(.2), '', 'swish');
    for (let i = 0; i < n; i++) { const y = 80 + i * 120, a = .25 + i * .22; s += Rc(195, y, 50, 50, at(a), at(a + .08)) + OK(203, y + 12, 38, at(a + .08), at(a + .16)) + L(285, y + 26, 600, y + 26, at(a + .1), at(a + .2)); }
    return svg(s);
  },
  // tarjetas y una lupa
  buscar: (m, at) => {
    let s = ''; for (let i = 0; i < 4; i++) { const x = 90 + i * 160; s += Rc(x, 120, 130, 220, at(i * .1), at(i * .1 + .18), '', i ? null : 'swish') + L(x + 20, 180, x + 110, 180, at(i * .1 + .15), at(i * .1 + .22), 'fino'); }
    return svg(s + Ci(250, 240, 70, at(.55), at(.72), 'ac') + L(300, 290, 360, 350, at(.72), at(.82), 'ac') + (m.etiqueta ? Tx(400, 460, m.etiqueta, at(.85), '', 38, 'middle') : ''));
  },
  // video → documento
  video: (m, at) => svg(
    Rc(60, 150, 240, 170, at(0), at(.2), '', 'swish') + P('M155 195 L215 235 L155 275 Z', at(.18), at(.3), 'ac') +
    P('M340 235 H460 M435 215 L460 235 L435 255', at(.35), at(.5), 'ac') +
    Rc(510, 60, 230, 340, at(.5), at(.68)) + L(540, 130, 710, 130, at(.68), at(.74)) + L(540, 180, 680, 180, at(.72), at(.78), 'fino') +
    L(540, 225, 700, 225, at(.76), at(.82), 'fino') + L(540, 270, 650, 270, at(.8), at(.86), 'fino')),
  // dos etiquetas de precio
  precio: (m, at) => {
    const tag = (x, a) => P(`M${x} 140 H${x + 200} L${x + 260} 230 L${x + 200} 320 H${x} Z`, at(a), at(a + .2), '', a ? null : 'swish') + Ci(x + 40, 230, 12, at(a + .2), at(a + .25)) + Tx(x + 120, 262, '$', at(a + .25), 'sans', 96, 'middle');
    return svg(tag(110, 0) + tag(450, .4) + (m.etiqueta ? Tx(400, 430, m.etiqueta, at(.8), '', 40, 'middle') : ''));
  },
  // HTML/SVG propio (viewBox 800x500); usa class="trazo" pathLength="1" y data-a para dibujar
  libre: m => m.svg ? svg(m.svg) : (m.html || ''),
};

// ---------- íconos a lápiz para las filas (viewBox 64) ----------
const ic = d => `<svg viewBox="0 0 64 64" class="lapiz">${d}</svg>`;
const st = 'class="trazo" pathLength="1" style="stroke-width:3.4"', sa = 'class="trazo ac" pathLength="1" style="stroke-width:3.6"';
const ICONOS = {
  lapiz: ic(`<path ${st} d="M14 50 L18 38 L44 12 L52 20 L26 46 Z M40 16 L48 24"/><path ${sa} d="M14 50 L26 46"/>`),
  objetivo: ic(`<circle ${st} cx="32" cy="32" r="24"/><circle ${sa} cx="32" cy="32" r="14"/><circle ${sa} cx="32" cy="32" r="4"/>`),
  rayo: ic(`<path ${sa} d="M36 6 L14 36 H30 L26 58 L50 26 H34 Z"/>`),
  pasos: ic(`<path ${st} d="M8 50 H24 V36 H40 V22 H56"/><path ${sa} d="M46 12 L56 22 L46 30"/>`),
  chat: ic(`<path ${st} d="M8 12 H56 V42 H26 L14 52 V42 H8 Z"/><path ${sa} d="M18 26 H46"/>`),
  calendario: ic(`<path ${st} d="M8 14 H56 V56 H8 Z M8 26 H56 M20 8 V18 M44 8 V18"/><path ${sa} d="M20 38 L27 45 L42 32"/>`),
  grafica: ic(`<path ${st} d="M8 8 V56 H58"/><path ${sa} d="M14 46 L28 34 L38 40 L54 16"/>`),
  lupa: ic(`<circle ${st} cx="28" cy="28" r="18"/><path ${sa} d="M41 41 L56 56"/>`),
  play: ic(`<path ${st} d="M6 14 H58 V50 H6 Z"/><path ${sa} d="M27 23 L41 32 L27 41 Z"/>`),
  dolar: ic(`<path ${st} d="M44 18 C40 12 22 12 22 22 C22 34 44 28 44 42 C44 52 24 52 20 46"/><path ${sa} d="M32 6 V58"/>`),
  check: ic(`<path ${st} d="M8 8 H56 V56 H8 Z"/><path ${sa} d="M18 32 L28 42 L46 22"/>`),
  documento: ic(`<path ${st} d="M14 6 H40 L52 18 V58 H14 Z M40 6 V18 H52"/><path ${sa} d="M22 32 H44 M22 42 H38"/>`),
  foco: ic(`<path ${st} d="M22 40 C10 30 16 8 32 8 C48 8 54 30 42 40 V48 H22 Z M24 56 H40"/><path ${sa} d="M28 30 L32 36 L36 30"/>`),
  persona: ic(`<circle ${st} cx="32" cy="20" r="11"/><path ${st} d="M10 58 C12 42 52 42 54 58"/><path ${sa} d="M44 8 L52 4"/>`),
  estrella: ic(`<path ${sa} d="M32 6 L39 25 L58 25 L43 37 L49 56 L32 44 L15 56 L21 37 L6 25 L25 25 Z"/>`),
};
const icono = v => !v ? '' : /^(data:|https?:|\.{0,2}\/)|\.(png|jpe?g|webp|svg|gif)$/i.test(v) ? `<img src="${esc(v)}">` : (ICONOS[v] || ICONOS.estrella);

// ---------- escenas con sus tiempos ----------
const limpio = s => String(s || '').replace(/\*/g, '');
const items = E.items || [];
const grupos = []; items.forEach(it => { const g = it.grupo || ''; if (!grupos.includes(g)) grupos.push(g); });
const escenas = [];
if (E.gancho) escenas.push({ ...E.gancho, _tipo: 'gancho', dur: E.gancho.dur || 2.4 });
if (E.intro) escenas.push({ ...E.intro, _tipo: 'intro', dur: E.intro.dur || 2.4 });
items.forEach((it, i) => escenas.push({ ...it, _tipo: 'item', _i: i, _g: grupos.indexOf(it.grupo || ''), dur: it.dur || 2.8 }));
if (E.cierre) escenas.push({ ...E.cierre, _tipo: 'cierre', dur: E.cierre.dur || 3.6 });
let acc = 0; escenas.forEach(s => { s._ini = acc; acc += s.dur; });
const DUR = acc, FRAMES = Math.round(DUR * FPS);

// ---------- subtítulo en papelito: trozos de hasta 3 palabras al ritmo de la voz ----------
const norm = x => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');
function chipHTML(s) {
  if (E.subtitulos === false || !s.voz) return '';
  const claves = new Set();
  (s.voz.match(/\*([^*]+)\*/g) || []).forEach(m => m.replace(/\*/g, '').split(/\s+/).forEach(w => claves.add(norm(w))));
  [s.nombre, s.palabra].forEach(x => x && limpio(x).split(/\s+/).forEach(w => claves.add(norm(w))));
  claves.delete('');
  const palabras = limpio(s.voz).split(/\s+/).filter(Boolean);
  const trozos = []; let cur = [];
  palabras.forEach(w => { cur.push(w); const largo = cur.join(' ').length; if (cur.length >= 3 || largo >= 16 || /[.,:;!?]$/.test(w)) { trozos.push(cur); cur = []; } });
  if (cur.length) trozos.push(cur);
  const voz = s.voz_dur || s.dur * .82, total = palabras.join(' ').length + 1;
  let c = 0;
  const ini = trozos.map(tr => { const t = c / total * voz; c += tr.join(' ').length + 1; return t; });
  return trozos.map((tr, i) => {
    const html = tr.map(w => { const t = esc(w.replace(/[.,:;!?¿¡]+$/, '').replace(/^[¿¡]+/, '')); return claves.has(norm(w)) ? `<span class="k">${t}</span>` : t; }).join(' ');
    return `<div class="chip"${A(ini[i], { hasta: i < trozos.length - 1 ? ini[i + 1] : null })}>${html}</div>`;
  }).join('');
}

// ---------- construir el DOM ----------
const lienzo = document.getElementById('lienzo');
lienzo.innerHTML = '<div class="fondo"></div>' +
  `<svg class="defs"><filter id="lapiz" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="7"/>` +
  `<feDisplacementMap in="SourceGraphic" scale="4.5" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;
const ETI = E.etiqueta_grupo || 'Grupo';
const col = c => ({ rojo: 'var(--rojo)', verde: 'var(--verde)', amarillo: 'var(--amarillo)', acento: 'var(--acento)' }[c || 'rojo'] || c);

escenas.forEach((s, i) => {
  const sec = document.createElement('section'); sec.className = 'escena'; sec.dataset.i = i;
  const D = s.dur, voz = s.voz_dur || D * .8;
  let h = '';
  if (s._tipo === 'gancho') {
    const tg = s.t_grande ?? Math.min(.6, voz * .35);
    const dib = s.boceto && BOCETOS[s.boceto.tipo] ? `<div class="dib">${BOCETOS[s.boceto.tipo](s.boceto, f => .05 + f * Math.min(1.2, D * .5))}</div>` : '';
    h = `<div class="gancho">${dib}<div class="g2" style="font-size:${s.tam_chica || 92}px;color:${col(s.color)}"${A(0, { sfx: 'golpe' })}>${esc(s.chica || '')}</div>` +
      `<div class="g1 rayado" data-txt="${esc(s.grande)}" style="font-size:${s.tam_grande || 200}px"${A(tg)}>${esc(s.grande)}</div></div>`;
  } else if (s._tipo === 'intro') {
    const n = s.numero ?? items.length, cols = Math.min(3, n), filas = Math.ceil(n / cols);
    const lado = Math.min(92, Math.floor(780 / filas) - 14);
    const caj = Array.from({ length: n }, (_, k) => `<i style="width:${lado}px;height:${lado}px;font-size:${lado * .5}px"${A(.15 + k / n * Math.min(1.2, voz * .7), { sfx: k === 0 ? 'pop' : null })}>?</i>`).join('');
    h = `<div class="intro"><div class="arr"${A(0)}>${esc(s.arriba || '')}</div><div class="num rayado" data-txt="${esc(n)}"${A(.12)}>${esc(n)}</div>` +
      `<div class="aba"${A(Math.min(1, voz * .55))}>${esc(s.abajo || '')}</div>` +
      `<div class="caj" style="grid-template-columns:repeat(${cols},${lado}px)">${caj}</div></div>`;
  } else if (s._tipo === 'item') {
    const g = s._g, NG = grupos.length, delGrupo = items.map((it, k) => ({ it, k })).filter(o => (o.it.grupo || '') === (s.grupo || '') && o.k <= s._i);
    const primero = delGrupo.length === 1;
    const puntos = Array.from({ length: NG }, (_, k) => `<i class="${k <= g ? 'si' : ''}"></i>`).join('');
    h += `<div class="cab"><div class="eti">${esc(ETI)} ${g + 1} de ${NG}</div><div class="puntos">${puntos}</div>` +
      `<div class="tit">${esc(s.grupo || '')}<svg class="ondas" viewBox="0 0 300 22" preserveAspectRatio="none">` +
      `<path pathLength="1" class="trazo ac" style="stroke-width:4;vector-effect:non-scaling-stroke" d="M2 11 Q 17 1 32 11 T 62 11 T 92 11 T 122 11 T 152 11 T 182 11 T 212 11 T 242 11 T 272 11 T 298 11"${primero ? A(0, { a: [.05, .45] }) : ''}/></svg></div></div>`;
    h += '<div class="lista">' + delGrupo.map(({ it, k }) => {
      const nueva = k === s._i;
      return `<div class="fila"${nueva ? A(.08, { sfx: 'pop' }) : ''}><div class="ico">${icono(it.icono)}</div><div class="txt">` +
        `<div class="nom">${esc(limpio(it.nombre))}<svg class="raya" viewBox="0 0 300 10" preserveAspectRatio="none"><path pathLength="1" class="trazo ac" style="stroke-width:3;vector-effect:non-scaling-stroke" d="M2 6 L298 4"${nueva ? A(.08, { a: [.15, .5] }) : ''}/></svg></div>` +
        `<div class="sub">${esc(it.desc || '')}</div></div></div>`;
    }).join('') + '</div>';
    const b = s.boceto;
    if (b) {
      const f = BOCETOS[b.tipo];
      if (!f) console.error(`Boceto desconocido: «${b.tipo}» (escena ${i + 1}). Tipos: ${Object.keys(BOCETOS).join(', ')}`);
      else { const a0 = .45, a1 = Math.max(a0 + .9, Math.min(D - .25, voz * .95)); h += `<div class="boceto">${f(b, x => a0 + x * (a1 - a0))}</div>`; }
    }
  } else if (s._tipo === 'cierre') {
    h = `<div class="nota"><div class="cinta"></div><div class="n1"${A(0)}>${esc(s.arriba || '')}</div><div class="n2"${A(.15)}>${esc(s.verbo || 'comenta')}</div>` +
      `<div class="n3 rayado" data-txt="${esc(s.palabra || '')}" style="font-size:${s.tam_palabra || 170}px"${A(Math.min(.9, voz * .4), { sfx: 'golpe' })}>${esc(s.palabra || '')}</div>` +
      `<div class="n4"${A(Math.min(1.4, voz * .7))}>${esc(s.regalo || '')}</div></div>`;
  }
  h += chipHTML(s);
  sec.innerHTML = h;
  lienzo.appendChild(sec);
});

// ---------- índice de elementos con tiempo ----------
const idx = [...lienzo.querySelectorAll('.escena')].map((sec, i) => ({
  sec, s: escenas[i],
  els: [...sec.querySelectorAll('[data-t],[data-a]')].map(el => ({
    el, t: +(el.dataset.t || 0), hasta: el.dataset.hasta != null ? +el.dataset.hasta : null,
    a: el.dataset.a ? el.dataset.a.split(',').map(Number) : null,
  })),
}));
const EVENTOS = [];
idx.forEach(({ els, s }, i) => {
  if (i > 0) EVENTOS.push({ t: +s._ini.toFixed(3), sfx: 'corte' });
  els.forEach(o => { const sf = o.el.dataset.sfx; if (sf && sf !== 'null') EVENTOS.push({ t: +(s._ini + (o.a ? o.a[0] : o.t)).toFixed(3), sfx: sf }); });
});
EVENTOS.sort((a, b) => a.t - b.t);

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => { t = clamp(t); return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
let activa = -1;
function draw(frame) {
  const t = Math.min(frame, FRAMES - 1) / FPS;
  let i = escenas.findIndex(s => t >= s._ini && t < s._ini + s.dur); if (i < 0) i = escenas.length - 1;
  if (i !== activa) { if (activa >= 0) idx[activa].sec.classList.remove('activa'); idx[i].sec.classList.add('activa'); activa = i; }
  const { els, s } = idx[i], tl = t - s._ini;
  let firma = i + ':';
  for (const o of els) {
    const vis = tl >= o.t && (o.hasta == null || tl < o.hasta);
    o.el.style.visibility = vis ? 'visible' : 'hidden'; firma += vis ? '1' : '0';
    if (o.a) { const p = ease((tl - o.a[0]) / Math.max(.01, o.a[1] - o.a[0])); o.el.style.setProperty('--p', p.toFixed(3)); firma += p.toFixed(3); }
  }
  return firma;
}
window.draw = draw; window.FRAMES = FRAMES; window.FPS = FPS; window.EVENTOS = EVENTOS; window.DUR = DUR;

// ajustes de tamaño: la línea enorme del gancho y la palabra del cierre en UNA línea; el chip dentro del cuadro
function ajustar() {
  document.querySelectorAll('.gancho .g1, .gancho .g2, .nota .n3').forEach(el => { const sec = el.closest('.escena'); sec.classList.add('activa');
    let fs = parseFloat(getComputedStyle(el).fontSize); el.style.whiteSpace = 'nowrap';
    while (el.scrollWidth > el.clientWidth + 1 && fs > 40) { fs -= 4; el.style.fontSize = fs + 'px'; } sec.classList.remove('activa'); });
  document.querySelectorAll('.chip').forEach(el => { const sec = el.closest('.escena'); sec.classList.add('activa'); el.style.visibility = 'visible';
    let fs = 38; while (el.offsetWidth > 940 && fs > 24) { fs -= 2; el.style.fontSize = fs + 'px'; } sec.classList.remove('activa'); });
  document.querySelectorAll('.fila .txt').forEach(el => { const sec = el.closest('.escena'); sec.classList.add('activa');
    const nom = el.querySelector('.nom'), sub = el.querySelector('.sub'); let fs = 48, fz = 33;
    while (nom.offsetWidth > 800 && fs > 30) { fs -= 2; nom.style.fontSize = fs + 'px'; }
    sub.style.whiteSpace = 'nowrap'; while (sub.scrollWidth > 810 && fz > 22) { fz -= 1; sub.style.fontSize = fz + 'px'; }
    sec.classList.remove('activa'); });
}
window.LISTO = (document.fonts ? Promise.all(['900 80px Inter', '800 80px Inter', '700 40px Inter', '600 26px Inter', 'italic 400 40px "Instrument Serif"'].map(f => document.fonts.load(f))).then(() => document.fonts.ready) : Promise.resolve())
  .then(() => { ajustar(); activa = -1; idx.forEach(o => o.sec.classList.remove('activa')); draw(0); return true; });
if (!/[?&]render/.test(location.search)) {
  let f = 0; const tick = () => { draw(f); f = (f + 1) % FRAMES; setTimeout(tick, 1000 / FPS); }; window.LISTO.then(tick);
  const z = () => { const s = Math.min(innerWidth / 1080, innerHeight / 1920); const l = document.getElementById('lienzo'); l.style.transform = `scale(${s})`; l.style.transformOrigin = '0 0'; };
  addEventListener('resize', z); z();
}
})();
