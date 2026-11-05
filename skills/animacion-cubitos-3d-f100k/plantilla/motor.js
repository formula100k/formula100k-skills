// Une todo: qué escena toca, encabezado, subtítulos palabra por palabra y barridos entre escenas.
// No se edita para hacer un video nuevo: se llena config.js y se corre armar.mjs.
import { clamp, mix, E, k, rng, norm, rico } from './util.js';
import * as M3 from './motor3d.js';
import * as PP from './papel.js';

const C = window.CONFIG, TI = window.TIEMPOS;
const $ = (s) => document.querySelector(s);
const root = $('#root');
for (const [a, b] of Object.entries(C.tema)) root.style.setProperty('--' + a, b);
root.insertAdjacentHTML('beforeend', `
  <div id="stage"><canvas id="gl" width="1080" height="1920"></canvas><div id="papel"></div></div>
  <div id="vin"></div><div id="grano"></div><div id="destello"></div>
  <div id="cab"><div class="pts"><b></b><b></b><b></b></div><div id="cabTxt"></div></div>
  <div id="sub"></div><div id="usr">${C.usuario || ''}</div>`);
const canvas = $('#gl'), stage = $('#stage'), cab = $('#cab'), cabTxt = $('#cabTxt'), sub = $('#sub');

// grano de papel encima de todo
(() => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d'), d = x.createImageData(256, 256), r = rng(11);
  for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 26; }
  x.putImageData(d, 0, 0);
  $('#grano').style.backgroundImage = `url(${c.toDataURL()})`;
})();

const DUR = TI.dur, CORTES = TI.cortes, N = C.escenas.length;
const es3d = (sc) => M3.PLANOS_3D.includes(sc.plano);
// palabras: [texto, segundo, escena, clave]
const PAL = TI.palabras.map(([w, t, e, c]) => ({ w, t, e, c }));

// «cuando»: segundos desde que empieza la escena en que la voz dice esa palabra
const cuandoDe = (i) => (ref, defecto) => {
  const d = CORTES[i + 1] - CORTES[i];
  if (typeof ref === 'number') return ref;
  if (typeof ref === 'string' && ref) {
    const p = PAL.find((o) => o.e === i && norm(o.w).startsWith(norm(ref)));
    if (p) return Math.max(0, p.t - CORTES[i]);
  }
  return defecto * d;
};

// subtítulos en grupos cortos
const GRUPOS = [];
for (let e = 0; e < N; e++) {
  let g = null, chars = 0;
  PAL.filter((o) => o.e === e).forEach((o) => {
    if (!g || g.length >= 3 || chars + o.w.length > 15) { g = []; chars = 0; GRUPOS.push(g); }
    g.push(o);
    chars += o.w.length + 1;
  });
}
GRUPOS.forEach((g, n) => { g.fin = GRUPOS[n + 1] ? GRUPOS[n + 1][0].t : DUR; g.id = n; });

PP.construir($('#papel'), C);
M3.init(canvas, C);

const BARRIDOS = CORTES.slice(1, -1);
C.escenas.forEach((sc, i) => M3.cortesInternos(sc, cuandoDe(i)).forEach((u) => BARRIDOS.push(CORTES[i] + u)));
let subKey = '', cabKey = null;

function render(t) {
  t = clamp(t, 0, DUR);
  let i = 0;
  while (i < N - 1 && t >= CORTES[i + 1]) i++;
  const sc = C.escenas[i], u = t - CORTES[i], d = CORTES[i + 1] - CORTES[i], cuando = cuandoDe(i), tres = es3d(sc);

  canvas.style.opacity = tres ? 1 : 0;
  const fl = tres ? M3.pintar(t, i, u, d, sc, cuando) : 0;
  PP.pintar(i, u, d, sc, cuando, tres ? -1 : i);
  $('#destello').style.opacity = fl * 0.5;

  // barrido entre escenas: desenfoque + empujón corto
  let w = 0, dir = 1;
  for (const c of BARRIDOS) {
    const x = (t - c) / 0.13;
    if (Math.abs(x) < 1) { w = 1 - Math.abs(x); dir = x < 0 ? -1 : 1; }
  }
  stage.style.filter = w > 0.02 ? `blur(${(w * 16).toFixed(2)}px)` : 'none';
  stage.style.transform = `translate(${(-dir * w * 70).toFixed(1)}px,0) scale(${(1 + w * 0.08).toFixed(4)})`;

  // encabezado: cambia cuando cambia el texto
  const txt = sc.encabezado || '';
  if (txt !== cabKey) { cabKey = txt; cabTxt.innerHTML = rico(txt); }
  let j = i;
  while (j > 0 && (C.escenas[j - 1].encabezado || '') === txt) j--;
  const hp = k(t, CORTES[j], CORTES[j] + 0.3, E.back);
  cab.style.opacity = txt ? 1 : 0;
  cab.style.transform = `translateX(-50%) translateY(${mix(-40, 0, hp)}px) scale(${mix(0.8, 1, hp)})`;

  // subtítulo
  const g = GRUPOS.find((x) => x[0].t <= t && t < x.fin), vis = g ? g.filter((o) => o.t <= t) : [];
  const key = g ? g.id + ':' + vis.length : '';
  if (key !== subKey) {
    subKey = key;
    sub.innerHTML = vis.map((o) => `<span${o.c ? ' class="k"' : ''}>${o.w.replace(/</g, '&lt;')}</span>`).join('');
  }
  vis.forEach((o, n) => {
    const p = k(t, o.t, o.t + 0.14, E.back);
    sub.children[n].style.transform = `translateY(${mix(26, 0, p)}px) scale(${mix(0.8, 1, p)})`;
  });
  $('#usr').style.opacity = C.usuario && i === N - 1 ? k(u, 0.4, 0.8) * 0.9 : 0;
}

// El reloj vive en index.html (window.__clock): aquí solo se conecta el pintor.
window.__paint = render;
window.addEventListener('hf-seek', (e) => render(e.detail.time));
render(window.__clock ? window.__clock._t : 0);
