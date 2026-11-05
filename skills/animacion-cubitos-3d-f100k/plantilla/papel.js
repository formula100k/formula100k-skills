// Planos de papel (2D). Cada escena de papel tiene su sección; se mueve desde u (segundos desde que empieza la escena).
import { clamp, mix, E, k, rico } from './util.js';

const tf = (el, { x = 0, y = 0, r = 0, s = 1, o } = {}) => {
  el.style.transform = `translate(${x}px,${y}px) rotate(${r}deg) scale(${s})`;
  if (o !== undefined) el.style.opacity = o;
};

// Mascotas pixel planas. `lleva: "foco"` les pone la idea encima.
export function mascota(tipo = 'gato', { lleva, tam = 190 } = {}) {
  const foco = lleva === 'foco'
    ? '<g><rect x="50" y="-6" width="20" height="14" fill="#9aa0a8"/><circle cx="60" cy="-14" r="16" fill="var(--luz)"/><circle cx="60" cy="-14" r="23" fill="var(--luz)" opacity=".3"/></g>' : '';
  const patas = (c) => [26, 44, 66, 84].map((x) => `<rect x="${x}" y="74" width="10" height="24" fill="${c}"/>`).join('');
  if (tipo === 'bichito') {
    return `<svg width="${tam}" height="${tam * 1.2}" viewBox="0 -34 120 144">${foco}
      <rect x="8" y="38" width="12" height="14" fill="var(--cubo)"/><rect x="100" y="38" width="12" height="14" fill="var(--cubo)"/>${patas('var(--cubo)')}
      <rect x="20" y="20" width="80" height="56" fill="var(--cubo)"/>
      <rect x="40" y="38" width="8" height="17" fill="#15110f"/><rect x="72" y="38" width="8" height="17" fill="#15110f"/></svg>`;
  }
  const g = '#efe7d8';
  return `<svg width="${tam}" height="${tam * 1.2}" viewBox="0 -34 120 144">${lleva === 'foco' ? foco.replace(/-14/g, '-22').replace('y="-6"', 'y="-14"') : ''}
    <path d="M22 22 L22 0 L44 20 Z M98 22 L98 0 L76 20 Z" fill="${g}"/><path d="M27 18 L27 9 L36 18 Z M93 18 L93 9 L84 18 Z" fill="#e8a0a8"/>
    ${patas(g)}<rect x="100" y="52" width="16" height="9" fill="${g}"/><rect x="110" y="38" width="9" height="20" fill="${g}"/>
    <rect x="20" y="20" width="80" height="56" fill="${g}"/>
    <rect x="42" y="40" width="7" height="13" fill="#15110f"/><rect x="71" y="40" width="7" height="13" fill="#15110f"/>
    <rect x="33" y="33" width="24" height="26" fill="none" stroke="#15110f" stroke-width="4"/><rect x="63" y="33" width="24" height="26" fill="none" stroke="#15110f" stroke-width="4"/>
    <rect x="57" y="42" width="6" height="4" fill="#15110f"/><rect x="56" y="62" width="8" height="5" fill="#e8a0a8"/></svg>`;
}

const HTML = {
  sello: (sc, C) => `<div class="zoom">
      <div class="pared"></div><div class="suelo"></div><div class="luna"></div>
      ${sc.diploma ? `<div class="diploma tarj"><b>${sc.diploma.titulo || ''}</b><i>${sc.diploma.sub || ''}</i></div>` : ''}
      <div class="hoja tarj">${rico(sc.hoja || C.cartel || '', 'i')}</div>
      ${[0, 1, 2, 3].map(() => `<div class="marca">${sc.sello || '¡SÍ!'}</div>`).join('')}
      <div class="sellador">${mascota(sc.mascota || 'bichito')}<div class="palo"></div><div class="taco"><span>${(sc.sello || 'SÍ').replace(/[¡!]/g, '')}</span></div><div class="goma"></div></div>
    </div>`,
  marcador: (sc) => {
    const a = sc.izq || { texto: 'NO', n: 5 }, b = sc.der || { texto: 'SÍ', n: 7 };
    return `<div class="pared"></div><div class="zocalo"></div><div class="suelo"></div>
      <div class="tabla vent"><div class="barra"><b></b><b></b><b></b><span>${sc.barra || 'conteo'}</span></div>
        <div class="col l"><small>${a.texto}</small><b class="n0">0</b></div><div class="col r"><small>${b.texto}</small><b class="n1">0</b></div><div class="medio"></div></div>
      <div class="votos">${[...Array(a.n + b.n)].map((_, i) => `<div class="voto ${i < a.n ? 'no' : 'si'}"><b>${i < a.n ? '✗' : '✓'}</b></div>`).join('')}</div>
      <div class="urna"><span>${sc.urna || 'VOTOS'}</span></div>
      ${sc.sello ? `<div class="timbre" style="font-size:110px">${sc.sello}</div>` : ''}`;
  },
  edificio: (sc, C) => `<div class="cielo"></div><div class="calle"></div>
      <div class="farol" style="left:120px"></div><div class="farol" style="left:934px"></div>
      <div class="casa"><div class="fronton"><span>${sc.rotulo || ''}</span></div>
        <div class="cuerpo"><div class="cornisa"></div><div class="puerta"><i></i><i></i></div></div></div>
      ${sc.etiqueta ? `<div class="colg"><small>${sc.etiqueta.chico || ''}</small><b>${sc.etiqueta.grande || ''}</b></div>
      <svg class="tij" width="260" height="200" viewBox="0 0 260 200">
        <g class="ta"><path d="M10 100 L150 86 L150 104 Z" fill="#d5d8dd"/><circle cx="196" cy="60" r="32" fill="none" stroke="var(--acento)" stroke-width="16"/><rect x="146" y="78" width="34" height="14" fill="var(--acento)" transform="rotate(-28 163 85)"/></g>
        <g class="tb"><path d="M10 100 L150 96 L150 114 Z" fill="#b4b8bf"/><circle cx="196" cy="140" r="32" fill="none" stroke="var(--acento)" stroke-width="16"/><rect x="146" y="108" width="34" height="14" fill="var(--acento)" transform="rotate(28 163 115)"/></g>
      </svg>` : ''}
      ${sc.sello ? `<div class="timbre si" style="font-size:150px">${sc.sello}</div>` : ''}
      <div class="masc">${mascota(sc.mascota || C.mascota || 'gato', { lleva: 'foco', tam: 170 })}</div>`,
  comentario: (sc, C) => `<div class="pared"></div><div class="zocalo"></div><div class="suelo"></div>
      ${sc.regalo ? `<div class="regalo tarj"><small>${sc.regalo.eyebrow || 'REGALO'}</small><b>${sc.regalo.titulo || ''}</b></div>` : ''}
      <div class="candado"><b>?</b></div>
      <div class="caja"><div class="ava"></div><span class="ph">${sc.placeholder || 'Agrega un comentario…'}</span><b></b><em>${sc.boton || 'Publicar'}</em></div>
      <div class="masc">${mascota(sc.mascota || C.mascota || 'gato')}</div>`,
  ventana: (sc, C) => `<div class="pared"></div><div class="zocalo"></div><div class="suelo"></div>
      <div class="nota vent"><div class="barra"><b></b><b></b><b></b><span>${sc.barra || ''}</span></div><div class="cont">
        ${sc.eyebrow ? `<small>${sc.eyebrow}</small>` : ''}<h2>${rico(sc.titulo || '', 'span class="k"')}</h2>
        <ul>${(sc.items || []).map((it) => `<li><u>✓</u>${typeof it === 'string' ? it : it.texto}</li>`).join('')}</ul></div></div>
      <div class="masc">${mascota(sc.mascota || C.mascota || 'gato')}</div>`,
};
export const PLANOS_PAPEL = Object.keys(HTML);

export function construir(root, C) {
  root.innerHTML = C.escenas.map((sc, i) => (HTML[sc.plano] ? `<section class="pp ${sc.plano}" id="pp${i}">${HTML[sc.plano](sc, C)}</section>` : '')).join('');
}

const R = {
  sello(el, u, d) {
    const q = (s) => el.querySelector(s);
    el.querySelector('.zoom').style.transform = `scale(${mix(1.75, 1, k(u, 0, 0.55))})`;
    const paso = Math.min(0.5, (d - 0.5) / 4), golpes = [0, 1, 2, 3].map((i) => 0.4 + i * paso);
    const pos = [[420, 990, -6], [690, 1075, 6], [120, 1150, -9], [400, 1180, 4]];
    let y = 0;
    el.querySelectorAll('.marca').forEach((m, i) => {
      const h = golpes[i];
      if (u > h - 0.12 && u < h + 0.22) y = u < h ? k(u, h - 0.12, h, E.in) : 1 - k(u, h, h + 0.22);
      tf(m, { x: pos[i][0], y: pos[i][1], r: pos[i][2], s: mix(1.7, 1, k(u, h, h + 0.14)), o: u >= h ? 1 : 0 });
    });
    const lado = [0, 150, -190, 0, 0], n = golpes.filter((h) => u > h + 0.2).length;
    const nx = n < 4 ? mix(lado[n], lado[n + 1], k(u, golpes[n] - 0.3, golpes[n] - 0.12, E.inOut)) : 0;
    tf(q('.sellador'), { x: 445 + nx, y: 470 + y * 170, r: nx * 0.02 });
    tf(q('.hoja'), { x: 250, y: 880, r: -3 + y * 0.6 });
  },
  marcador(el, u, d, sc, cuando) {
    const a = (sc.izq || { n: 5 }).n, b = (sc.der || { n: 7 }).n, tot = a + b;
    const fin = sc.sello ? cuando(sc.selloEn, 0.68) : d * 0.8, paso = Math.min(0.09, (fin - 0.6) / tot);
    // alterna rojo y verde mientras haya de los dos
    const orden = [];
    for (let i = 0; i < Math.max(a, b); i++) { if (i < a) orden.push(i); if (i < b) orden.push(a + i); }
    let n0 = 0, n1 = 0;
    el.querySelectorAll('.voto').forEach((v, i) => {
      const si = i >= a, n = si ? i - a : i, t0 = 0.2 + orden.indexOf(i) * paso, p = k(u, t0, t0 + 0.4);
      const sx = (si ? 600 : 190) + (n % 2) * 135, sy = 1070 - Math.floor(n / 2) * 66;
      tf(v, { x: mix(480, sx, p), y: mix(1270, sy, p) + Math.sin(p * Math.PI) * -260, r: mix(200 + i * 40, ((i * 37) % 9) - 4, p), o: u >= t0 ? 1 : 0 });
      if (p >= 0.85) si ? n1++ : n0++;
    });
    el.querySelector('.n0').textContent = n0;
    el.querySelector('.n1').textContent = n1;
    const tb = el.querySelector('.timbre');
    if (tb) {
      const w = tb.offsetWidth || 600;
      tf(tb, { x: 540 - w / 2, y: 800, r: -7, s: mix(2.6, 1, k(u, fin, fin + 0.16, E.in)), o: u >= fin ? 1 : 0 });
      el.querySelector('.tabla').style.transform = `translate(${u > fin + 0.16 && u < fin + 0.34 ? Math.sin(u * 120) * 6 : 0}px,0)`;
    }
  },
  edificio(el, u, d, sc, cuando) {
    const q = (s) => el.querySelector(s);
    const corta = cuando(sc.cortaEn, 0.3), sella = corta + 0.3, entra = Math.max(sella + 0.3, cuando(sc.entraEn, 0.55));
    if (q('.colg')) {
      const inn = k(u, 0.05, 0.4, E.back), cae = k(u, corta + 0.1, corta + 0.75, E.in);
      tf(q('.colg'), { x: 590, y: 640 + cae * 1100, r: mix(-40, 9, inn) + Math.sin(u * 6) * 2 * (1 - cae) + cae * 70 });
      const corte = k(u, corta, corta + 0.1, E.lin);
      const snip = Math.abs(Math.sin(clamp((u - corta + 0.2) / 0.3) * Math.PI * 2)) * (1 - corte);
      tf(q('.tij'), { x: mix(1150, 815, k(u, corta - 0.35, corta - 0.05)) + k(u, corta + 0.25, corta + 0.55, E.in) * 400, y: 560, r: 4 });
      q('.ta').setAttribute('transform', `rotate(${-snip * 13 - 3} 160 100)`);
      q('.tb').setAttribute('transform', `rotate(${snip * 13 + 3} 160 100)`);
    }
    const tb = q('.timbre');
    if (tb) tf(tb, { x: 540 - (tb.offsetWidth || 560) / 2, y: 930, r: -6, s: mix(2.4, 1, k(u, sella, sella + 0.14, E.in)), o: u >= sella ? 1 : 0 });
    const w = k(u, entra, entra + 0.85, E.lin), ent = k(u, entra + 0.85, entra + 1.2, E.in), ab = k(u, entra + 0.6, entra + 0.85);
    tf(q('.masc'), { x: mix(-200, 455, w), y: 1130 - Math.abs(Math.sin(w * Math.PI * 5)) * 26 - ent * 20, s: mix(1, 0.45, ent), o: 1 - ent });
    el.querySelectorAll('.puerta i').forEach((p) => (p.style.transform = `scaleX(${1 - ab * 0.8})`));
  },
  comentario(el, u, d, sc, cuando) {
    const q = (s) => el.querySelector(s), palabra = sc.palabra || '';
    tf(q('.caja'), { x: 70, y: 880, s: mix(0.8, 1, k(u, 0, 0.25, E.back)) });
    const ini = cuando(sc.escribeEn ?? palabra, 0.25), n = clamp(Math.floor((u - ini) / 0.065), 0, palabra.length);
    q('.caja b').textContent = palabra.slice(0, n);
    q('.ph').style.opacity = n ? 0 : 1;
    tf(q('.masc'), { x: 445, y: 1150 - Math.abs(Math.sin(u * 9)) * 30 * (1 - k(u, 0.7, 1.2)) });
    if (q('.regalo')) tf(q('.regalo'), { x: 90, y: 520, r: -3, s: k(u, 0.05, 0.35, E.back) });
    tf(q('.candado'), { x: 800, y: 640, s: k(u, 0.3, 0.5, E.back), r: Math.sin(u * 14) * 5 * (1 - k(u, 0.8, 1.3)) });
  },
  ventana(el, u, d, sc, cuando) {
    const q = (s) => el.querySelector(s);
    q('.nota').style.transform = `rotate(${mix(-4, -1, k(u, 0, 0.3))}deg) scale(${mix(0.8, 1, k(u, 0, 0.3, E.back))})`;
    const its = sc.items || [];
    el.querySelectorAll('.nota li').forEach((li, i) => {
      const t0 = cuando(typeof its[i] === 'object' ? its[i].en : null, 0.3 + (0.55 * i) / Math.max(1, its.length));
      li.classList.toggle('ok', u >= t0);
      li.style.transform = `scale(${1 + (u >= t0 ? (1 - k(u, t0, t0 + 0.2)) * 0.08 : 0)})`;
    });
    tf(q('.masc'), { x: 800, y: 1190 - Math.abs(Math.sin(u * 7)) * 18 });
  },
};

export function pintar(i, u, d, sc, cuando, activo) {
  document.querySelectorAll('.pp').forEach((p) => (p.style.opacity = p.id === 'pp' + activo ? 1 : 0));
  const el = document.getElementById('pp' + i);
  if (el && R[sc.plano]) R[sc.plano](el, u, d, sc, cuando);
}
