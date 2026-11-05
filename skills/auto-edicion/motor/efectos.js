// efectos.js — las piezas de lienzo de la capa «Efectos» (se inyecta en la pieza con <script src="../nucleo/efectos.js">).
// Usa lo del kit de la pieza: ctx, W, H, C, tx, rr, hueco, detras, frente, dicho, fotoCover, PLANO.
// Reglas: todo plano y opaco sobre el verde, sin rebote ni temblor; lo que entra lo hace con corte seco cuando se dice.
// Los efectos que mueven tu video (acercamientos, polaroid, vidrios, portal, vértigo, papel, estudio) son de scripts/efectos.py.
const EFX = {
  cara: () => [W * (PLANO.cara || [.5, .35])[0], H * (PLANO.cara || [.5, .35])[1]],
  rojo: '#E8412C', azul: '#2F5BEA', crema: '#F3EEE4', verdeCroma: '#22B14C',   // verde de croma «de mentira»: nunca #00FF00
};

// ---------- 1 · Órbita: fotos reales girando alrededor de tu cabeza (persona ["completa","recorte"], FRENTE = true) ----------
// fotos = [img, …] (de FOTOS) · o.rx, o.ry (óvalo), o.vel (vueltas por segundo), o.tam, o.desde (s)
function orbita(fotos, t, o = {}) {
  if (t < (o.desde ?? 0)) return;
  const [cx, cy] = EFX.cara(), rx = o.rx ?? 400, ry = o.ry ?? 130, n = fotos.length, tam = o.tam ?? 190;
  const items = fotos.map((im, i) => { const a = (t - (o.desde ?? 0)) * (o.vel ?? .35) * 2 * Math.PI + i * 2 * Math.PI / n;
    return { im, x: cx + rx * Math.cos(a), y: cy + (o.dy ?? 40) + ry * Math.sin(a), z: Math.sin(a) }; });
  const una = it => { const s = tam * (.82 + .22 * (it.z + 1) / 2);
    ctx.save(); ctx.fillStyle = '#FFF'; rr(it.x - s / 2 - 6, it.y - s / 2 - 6, s + 12, s + 12, 26); ctx.fill();
    rr(it.x - s / 2, it.y - s / 2, s, s, 20); ctx.clip(); fotoCover(it.im, it.x - s / 2, it.y - s / 2, s, s, .5, .5); ctx.restore(); };
  detras(() => items.filter(it => it.z < 0).sort((a, b) => a.z - b.z).forEach(una));   // pasan por detrás de tu cabeza
  frente(() => items.filter(it => it.z >= 0).sort((a, b) => a.z - b.z).forEach(una));  // y por delante
}

// ---------- 2 · Ventana de chat: tu video se mete en una conversación (persona = CHAT_CAJA) ----------
// o.app ('Tu asistente') · o.pedido ('Edita este video…') · o.kPedido (palabra en que aparece) · o.items = [[k, 'Cortar pausas'], …]
const CHAT_CAJA = { x: 560, y: 560, w: 400, h: 690, cara: [.5, .3] };
function ventanaChat(t, o = {}) {
  ctx.fillStyle = '#0E0F12'; ctx.fillRect(0, 0, W, H);
  const x = 60, y = 330, w = 960, h = 1100;
  ctx.save(); ctx.fillStyle = '#F7F5F0'; rr(x, y, w, h, 36); ctx.fill(); ctx.restore();
  ['#E5484D', '#F5A524', '#30A46C'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 46 + i * 34, y + 46, 11, 0, 7); ctx.fill(); });
  ctx.save(); ctx.fillStyle = EFX.rojo; rr(x + 170, y + 28, 36, 36, 9); ctx.fill(); ctx.restore();
  tx(o.app || 'Tu asistente', x + 220, y + 58, 30, 700, '#222', 'left');
  ctx.fillStyle = '#E4E0D8'; ctx.fillRect(x, y + 92, w, 2);
  const pedido = (o.pedido || 'Edita este video, subtítulos en cada palabra y agrega los efectos.').split(' ');
  if (t >= dicho(o.kPedido ?? 0)) {   // tu pedido: burbuja a la derecha, arriba del video
    ctx.save(); ctx.fillStyle = '#E9E5DC'; rr(x + 300, y + 120, w - 340, 100, 22); ctx.fill(); ctx.restore();
    const mitad = Math.ceil(pedido.length / 2);
    tx(pedido.slice(0, mitad).join(' '), x + w - 60, y + 162, 27, 500, '#333', 'right');
    tx(pedido.slice(mitad).join(' '), x + w - 60, y + 198, 27, 500, '#333', 'right');
  }
  ctx.save(); ctx.fillStyle = '#FFF'; rr(CHAT_CAJA.x - 8, CHAT_CAJA.y - 8, CHAT_CAJA.w + 16, CHAT_CAJA.h + 16, 30); ctx.fill(); ctx.restore();
  hueco(CHAT_CAJA.x, CHAT_CAJA.y, CHAT_CAJA.w, CHAT_CAJA.h, 24);
  const items = o.items || [];
  if (items.length && t >= dicho(items[0][0]) - .4) {
    ctx.save(); ctx.fillStyle = EFX.rojo; rr(x + 50, y + 560, 34, 34, 8); ctx.fill(); ctx.restore();
    tx(o.respuesta || 'En eso.', x + 100, y + 588, 32, 700, '#222', 'left');
  }
  items.forEach(([k, s], i) => { if (t < dicho(k)) return; const yy = y + 650 + i * 64;
    ctx.fillStyle = EFX.rojo; ctx.beginPath(); ctx.arc(x + 68, yy, 16, 0, 7); ctx.fill();
    tx('✓', x + 68, yy + 9, 22, 800, '#FFF'); tx(s, x + 100, yy + 10, 28, 600, '#444', 'left'); });
  ctx.save(); ctx.fillStyle = '#FFF'; ctx.strokeStyle = '#E4E0D8'; ctx.lineWidth = 2; rr(x + 40, y + h - 110, w - 80, 74, 37); ctx.fill(); ctx.stroke(); ctx.restore();
  tx('Escribe aquí…', x + 80, y + h - 62, 26, 500, '#AAA', 'left');
}

// ---------- 3 · Lista que se marca: pastillas con check al lado de tu cabeza (persona completa) ----------
// items = [[k, 'Editar', '✓'|'✗'], …] · o.x, o.y · o.lado ('der' | 'izq')
function checklistPop(items, t, o = {}) {
  const [cx, cy] = EFX.cara(), der = (o.lado ?? 'der') === 'der';
  items.forEach(([k, s, marca = '✓'], i) => { if (t < dicho(k)) return;
    ctx.save(); ctx.font = `700 40px ${C.sans}`; const w = ctx.measureText(s).width + 120; ctx.restore();
    const x = o.x ?? (der ? cx + 230 : cx - 230 - w), y = (o.y ?? cy - 120) + i * 96;
    ctx.save(); ctx.fillStyle = '#FFF'; rr(x, y, w, 76, 38); ctx.fill(); ctx.restore();
    ctx.fillStyle = marca === '✗' ? '#1A1A1A' : EFX.rojo; ctx.beginPath(); ctx.arc(x + 40, y + 38, 22, 0, 7); ctx.fill();
    tx(marca, x + 40, y + 50, 30, 800, '#FFF'); tx(s, x + 76, y + 52, 40, 700, '#1A1A1A', 'left'); });
}

// ---------- 4 · Tormenta de titulares: tiras de noticia detrás de tu cabeza (persona ["completa","recorte"]) ----------
// tiras = [[k, 'TEXTO DEL TITULAR'], …] (máx. 6, con lo que dices) · o.etiqueta ('ÚLTIMA HORA')
function tormentaTitulares(tiras, t, o = {}) {
  const sitios = [[-40, 420, -5], [160, 560, 4], [-60, 700, -3], [240, 840, 5], [-30, 1360, -4], [300, 1480, 3]];
  detras(() => tiras.slice(0, 6).forEach(([k, s], i) => { if (t < dicho(k)) return;
    const [x, y, g] = sitios[i], oscuro = i % 2 === 1;
    ctx.save(); ctx.translate(x, y); ctx.rotate(g * Math.PI / 180);
    ctx.font = `800 52px ${C.golpe}`; const w = ctx.measureText(s).width + 300;
    ctx.fillStyle = oscuro ? '#121212' : '#FFF'; ctx.fillRect(0, -50, w, 84);
    ctx.fillStyle = EFX.rojo; ctx.fillRect(14, -36, 190, 56);
    tx(o.etiqueta || 'ÚLTIMA HORA', 109, 1, 26, 800, '#FFF', 'center');
    tx(s, 226, 12, 52, 800, oscuro ? '#FFF' : '#121212', 'left', C.golpe);
    ctx.restore(); }));
}

// ---------- 5 · Curva de crecimiento: fondo oscuro, la curva sube detrás de ti (persona "recorte") ----------
// o.tA, o.tB (segundos: empieza y termina de subir) · o.de, o.a (valores reales que dices) · o.sufijo ('×') · o.rotulo
// o.texto: si no dices una cifra exacta («cientos»), la palabra reemplaza al número cuando la curva llega arriba (nunca inventes la cifra)
function curvaCrecimiento(t, o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#07080B'); g.addColorStop(1, '#0B1430'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, H * i / 6); ctx.lineTo(W, H * i / 6); ctx.stroke(); }
  const p = aterriza(clamp((t - o.tA) / (o.tB - o.tA))), x0 = 40, y0 = 1560, x1 = W - 40, y1 = 260;
  const pt = u => [x0 + (x1 - x0) * u, y0 - (y0 - y1) * (Math.exp(4 * u) - 1) / (Math.exp(4) - 1)];
  ctx.beginPath(); ctx.moveTo(x0, H); for (let u = 0; u <= p; u += .01) ctx.lineTo(...pt(u)); ctx.lineTo(pt(p)[0], H); ctx.closePath();
  ctx.fillStyle = '#1E3A9E'; ctx.fill();
  ctx.beginPath(); for (let u = 0; u <= p; u += .01) { const [x, y] = pt(u); u ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.strokeStyle = EFX.rojo; ctx.lineWidth = 10; ctx.lineJoin = 'round'; ctx.stroke();
  const [px, py] = pt(p); ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(px, py, 16, 0, 7); ctx.fill();
  const v = Math.round((o.de ?? 1) + ((o.a ?? 10) - (o.de ?? 1)) * p);
  ctx.save(); ctx.fillStyle = EFX.rojo; rr(W - 360, 300, 300, 110, 18); ctx.fill(); ctx.restore();
  if (o.texto) { if (p >= 1) tx(o.texto, W - 210, 385, 64, 800, '#FFF', 'center', C.golpe); }
  else tx(`${v}${o.sufijo ?? '×'}`, W - 330, 385, 76, 800, '#FFF', 'left', C.golpe);
  if (o.rotulo) tx(o.rotulo, W - 90, 376, 24, 700, '#FFF', 'right');
}

// ---------- 6 · Estudio que se enciende: dos focos detrás de ti y el cartel AL AIRE (persona: efecto "estudio") ----------
function estudio(t, tLuz, o = {}) {
  const on = t >= tLuz;
  ctx.fillStyle = on ? '#22252C' : '#08090B'; ctx.fillRect(0, 0, W, H);
  if (on) { const g = ctx.createRadialGradient(W / 2, 760, 50, W / 2, 760, 900); g.addColorStop(0, '#4A4F5C'); g.addColorStop(1, '#22252C'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  [[-90, 560, 1], [W - 250, 560, -1]].forEach(([x, y, s]) => {
    ctx.save(); ctx.translate(x + 170, y + 170); ctx.transform(1, s * .18, 0, 1, 0, 0);
    ctx.fillStyle = on ? '#F4F4F2' : '#1A1B1F'; rr(-170, -170, 340, 340, 18); ctx.fill();
    ctx.strokeStyle = on ? '#C9CCD3' : '#26282D'; ctx.lineWidth = 10; ctx.stroke(); ctx.restore(); });
  ctx.save(); ctx.fillStyle = on ? EFX.rojo : '#3A1712'; rr(W / 2 - 130, 300, 260, 76, 14); ctx.fill(); ctx.restore();
  tx(o.cartel || 'AL AIRE', W / 2, 352, 40, 800, on ? '#FFF' : '#6B3A32', 'center');
}

// ---------- 7 · Editor con línea de tiempo: tu video dentro de un programa de edición (persona = EDITOR_CAJA) ----------
const EDITOR_CAJA = { x: 390, y: 400, w: 300, h: 534, cara: [.5, .3] };
function editorLinea(t, o = {}) {
  ctx.fillStyle = '#0B0D12'; ctx.fillRect(0, 0, W, H);
  const x = 40, y = 290, w = 1000, h = 1000;
  ctx.save(); ctx.fillStyle = '#ECEDEF'; rr(x, y, w, h, 24); ctx.fill(); ctx.restore();
  ctx.fillStyle = EFX.rojo; ctx.fillRect(x + 24, y + 24, 260, 34); tx(o.titulo || 'EDITOR · B-ROLL', x + 40, y + 50, 22, 800, '#FFF', 'left');
  ctx.fillStyle = '#111317'; ctx.fillRect(x + 24, y + 80, w - 48, 600);
  hueco(EDITOR_CAJA.x, EDITOR_CAJA.y, EDITOR_CAJA.w, EDITOR_CAJA.h, 10);
  ctx.fillStyle = '#D5D7DB'; for (let i = 0; i < 40; i++) ctx.fillRect(x + 60 + i * 22, y + 720, 12, 26 + 22 * Math.abs(Math.sin(i * 1.7)));
  const pistas = [['B-roll', EFX.rojo, .32, .62], ['Tú hablando', EFX.azul, .05, .98]];
  pistas.forEach(([n, c, a, b], i) => { const yy = y + h + 30 + i * 70;
    ctx.fillStyle = '#1A1D24'; ctx.fillRect(x, yy, w, 56);
    ctx.fillStyle = c; rr(x + 120 + (w - 160) * a, yy + 8, (w - 160) * (b - a), 40, 8); ctx.fill();
    tx(n, x + 130 + (w - 160) * a, yy + 37, 22, 700, '#FFF', 'left'); tx(`V${2 - i}`, x + 30, yy + 37, 22, 700, '#888', 'left'); });
  const ph = x + 120 + (w - 160) * clamp((t - (o.desde ?? 0)) / (o.dur ?? 3));
  ctx.fillStyle = '#FFF'; ctx.fillRect(ph - 2, y + h + 18, 4, 160);
}

// ---------- 8 · Fondo de papel: papel de color con figuras (persona: efecto "papel") ----------
function fondoPapel(t, o = {}) {
  ctx.fillStyle = o.color || EFX.rojo; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 260; i++) { const r = rng(i * 13); ctx.fillRect(r() * W, r() * H, 2 + r() * 3, 2 + r() * 3); }
  ctx.fillStyle = EFX.azul; ctx.beginPath(); ctx.arc(W - 180, 520, 190, 0, 7); ctx.fill();
  ctx.fillStyle = '#111'; ctx.save(); ctx.translate(170, 560); ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 50 : 120; ctx.lineTo(r * Math.cos(a), r * Math.sin(a)); } ctx.fill(); ctx.restore();
  ctx.fillStyle = '#FFF'; [[120, 1020, 18], [W - 110, 1040, 26]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
  ctx.save(); ctx.translate(0, 1380); ctx.rotate(-.12); ctx.fillStyle = '#FFF'; ctx.fillRect(-100, 0, 600, 46); ctx.fillStyle = '#111'; ctx.fillRect(700, -40, 600, 70); ctx.restore();
}

// ---------- 9 · Portada de revista: el título enorme DETRÁS de tu cabeza (persona ["completa","recorte"] o "recorte") ----------
// o.nombre ('EDICIÓN') · o.numero ('31') · o.lado1/o.lado2 (titulares cortos de lo que dices) · o.sello ('NUEVO') · o.fecha
function portadaRevista(t, o = {}) {
  detras(() => {
    ctx.fillStyle = EFX.crema; ctx.fillRect(0, 0, W, H);
    tx(o.fecha || '', W - 60, 250, 22, 800, '#111', 'right'); tx(o.edicion || 'NÚMERO ESPECIAL', 60, 250, 22, 800, '#111', 'left');
    const nombre = (o.nombre || 'EDICIÓN').toUpperCase(); ctx.save(); ctx.font = `800 300px ${C.golpe}`;
    const s = Math.min(1, (W - 80) / ctx.measureText(nombre).width); ctx.restore();
    tx(nombre, W / 2, 300 + 260 * s, 300 * s, 800, EFX.rojo, 'center', C.golpe);
    tx(o.numero || '', 60, 900, 200, 800, EFX.rojo, 'left', C.golpe); tx(o.bajoNumero || '', 64, 950, 26, 700, '#111', 'left');
    (o.lados || []).forEach((l, i) => tx(l, W - 60, 760 + i * 58, 54, 800, '#111', 'right', C.golpe));
    ctx.fillStyle = '#111'; for (let i = 0; i < 34; i++) ctx.fillRect(70 + i * 7, 1560, i % 3 ? 3 : 5, 110);
  });
  frente(() => { ctx.fillStyle = EFX.rojo; ctx.beginPath(); ctx.arc(W - 170, 1500, 105, 0, 7); ctx.fill();
    tx(o.sello || 'NUEVO', W - 170, 1515, 44, 800, '#FFF', 'center', C.golpe); });
}

// ---------- 10 · Pantalla verde que cambia: croma detrás de ti y, cuando lo dices, la foto real (persona "recorte") ----------
function pantallaVerde(t, tCambio, foto, o = {}) {
  if (t < tCambio) { ctx.fillStyle = EFX.verdeCroma; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let x = 40; x < W; x += 120) ctx.fillRect(x, 0, 30, H); return; }
  fotoCover(foto, 0, 0, W, H, o.fx ?? .5, o.fy ?? .5);
}

// ---------- 11 · Interfaz de cámara: REC, zoom y esquinas encima de tu video (persona: efecto "zoom-digital") ----------
// pasos = los mismos [[s, escala], …] del efecto, para que el número cambie justo con el salto
function camaraUI(t, pasos, o = {}) {
  hueco(0, 0, W, H);
  let z = 1; pasos.forEach(([s, v]) => { if (t >= s) z = v; });
  const m = 90, l = 70, y0 = 420, y1 = H - 380;
  ctx.strokeStyle = '#FFF'; ctx.lineWidth = 5;
  [[m, y0, 1, 1], [W - m, y0, -1, 1], [m, y1, 1, -1], [W - m, y1, -1, -1]].forEach(([x, y, sx, sy]) => {
    ctx.beginPath(); ctx.moveTo(x, y + sy * l); ctx.lineTo(x, y); ctx.lineTo(x + sx * l, y); ctx.stroke(); });
  ctx.fillStyle = EFX.rojo; ctx.beginPath(); ctx.arc(m + 20, y0 - 50, 12, 0, 7); ctx.fill();
  CONTORNO = .12; tx('REC', m + 44, y0 - 38, 34, 800, '#FFF', 'left');
  const s = Math.floor(t); tx(`00:${String(42 + Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, W - m, y0 - 38, 30, 700, '#FFF', 'right'); CONTORNO = 0;
  ctx.save(); ctx.fillStyle = '#111'; rr(W / 2 - 80, y0 - 84, 160, 60, 30); ctx.fill(); ctx.restore();
  tx(`${z.toFixed(1)}×`, W / 2, y0 - 41, 34, 800, '#F5C518', 'center');
}

// ---------- 12 · Tu video dentro de un iPhone (persona = iphoneCaja()) ----------
function iphoneCaja(o = {}) { const w = o.w ?? 560, h = w * 2.05; return { x: (W - w) / 2, y: o.y ?? 420, w, h, cara: o.cara || [.5, .3] }; }
function iphone(t, o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120B07'); g.addColorStop(1, '#0B1022'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const c = iphoneCaja(o), b = 22;
  ctx.save(); ctx.fillStyle = '#0A0A0A'; ctx.strokeStyle = '#4A4C52'; ctx.lineWidth = 6; rr(c.x - b, c.y - b, c.w + 2 * b, c.h + 2 * b, 86); ctx.fill(); ctx.stroke(); ctx.restore();
  hueco(c.x, c.y, c.w, c.h, 66);
  ctx.save(); ctx.fillStyle = '#000'; rr(W / 2 - 90, c.y + 22, 180, 52, 26); ctx.fill(); ctx.restore();
}

// ---------- 13 · Lista final: contador que sube y todo lo que se marcó (persona "oculta") ----------
// items = ['Órbita', …] · o.tA, o.dur (s en que se marcan todos) · o.rotulo
function checklistFinal(items, t, o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0A0B0E'); g.addColorStop(1, '#0C1530'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const n = items.length, k = Math.min(n, Math.floor(clamp((t - o.tA) / (o.dur ?? 2)) * n + (t >= o.tA ? 1 : 0)));
  tx(String(k), 90, 600, 220, 800, EFX.rojo, 'left', C.golpe);
  tx(`/ ${n} ${o.unidad || 'efectos'}`, 90 + (k > 9 ? 260 : 140), 560, 44, 700, '#FFF', 'left');
  if (o.rotulo) tx(o.rotulo, 90 + (k > 9 ? 260 : 140), 610, 40, 700, '#FFF', 'left');
  const col = Math.ceil(n / 2);
  items.forEach((s, i) => { const x = 90 + Math.floor(i / col) * 470, y = 720 + (i % col) * 82, ok = i < k;
    ctx.save(); ctx.fillStyle = ok ? EFX.rojo : 'transparent'; ctx.strokeStyle = ok ? EFX.rojo : '#555'; ctx.lineWidth = 3; rr(x, y - 34, 44, 44, 8); ctx.fill(); ctx.stroke(); ctx.restore();
    if (ok) tx('✓', x + 22, y, 34, 800, '#FFF'); tx(s, x + 66, y, 36, 600, ok ? '#FFF' : '#666', 'left'); });
}

// ---------- fondo oscuro para la polaroid y los vidrios ----------
function fondoEfecto(t, o = {}) {
  const g = ctx.createRadialGradient(W / 2, H * .6, 80, W / 2, H * .6, 1300); g.addColorStop(0, o.centro || '#1B2A55'); g.addColorStop(1, '#07080B');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
