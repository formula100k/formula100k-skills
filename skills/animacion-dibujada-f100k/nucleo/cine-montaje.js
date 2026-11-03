// ============================================================================
// cine-montaje.js · motor compartido del grupo «Montaje documental» (Edit & Documentary)
// Técnica adaptada de lemo-opuscar (MIT, © 2026 LemoLab). Código escrito desde cero para canvas 2D 9:16.
//
// Lo usan: cine-caption-news, cine-newsreel, cine-countdown, cine-city-symphony,
//          cine-visual-investigation, cine-kino-montage, cine-telestrator, cine-news-package.
//
// En el original los estilos se cortan de material de archivo real. Aquí el material entra por FOTOS
// (rutas a fotos o capturas de la persona) y, si viene vacío, se dibuja un REEMPLAZO NEUTRO creíble
// (perfil, escritorio, chat, producto, ciudad, gráfica): nunca un cuadro vacío.
//
// Exporta (todas puras y deterministas, sin Math.random ni Date):
//   lienzo(w,h)                         canvas aparte + su contexto
//   fotoNeutra(tipo, w, h, semilla)     reemplazo dibujado: 'perfil'|'escritorio'|'chat'|'producto'|'ciudad'|'grafica'|'post'
//   material(FOTOS, tipos, w, h)        promesa con N imágenes (las fotos o los reemplazos); fija window.LISTO
//   gradear(img, modo, o)               el «grade» del estilo en un canvas aparte (se hace UNA vez):
//                                       'bn' | 'plata' | 'tinta' | 'frio' | 'cine' | 'duotono' | 'noticia'
//   cubrir(img, x,y,w,h, fx,fy, zoom)   foto tipo cover con empuje (zoom ≥ 1 sobre el foco)
//   granoPeli(alfa, frame)              grano de película: 6 mosaicos que rotan por cuadro (solo sobre la imagen)
//   vineta(x,y,w,h,fuerza)              viñeta radial
//   digitosFijos(str,x,y,font,col,al)   números en casillas de ancho fijo (el reloj no baila)
//   maqueta(texto, o)                   frase con *clave*: la clave enorme, los conectores chicos; mide y parte
//   pintarMaqueta(m, t, t0, cada, o)    las palabras entran de a una con CORTE SECO (sin animación de entrada)
//   flash(a, col)                       destello plano de cuadro completo
//   bandaWipe(p, ang, capas)            barrido de banda diagonal (lista de [ancho, color])
//   marcador(pts, p, o)                 trazo de telestrador: contorno oscuro + núcleo + punta de flecha
//   circuloTrazo(cx,cy,rx,ry,p,o)       círculo que se dibuja en sentido horario
//   anilloPiso(cx,cy,r,p,t,col)         anillo en perspectiva bajo algo, con anillo punteado que gira
//   sello(txt, x, y, p, o)              sello que cae de 1,9× a 1× en 0,16 s (sin rebote)
//   rayasPeli(frame, x,y,w,h)           rayas y polvo de proyección (vida de 9 cuadros / 1 cuadro)
// ============================================================================

function lienzo(w, h) { const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return [c, c.getContext('2d')]; }

// ---------- reemplazos neutros (si FOTOS viene vacío) ----------
// Se dibujan como «foto»: luz de un lado, sombras suaves y ruido fino, para que el grade del estilo los trate igual que a una foto.
function fotoNeutra(tipo, w = 1080, h = 1350, semilla = 1) {
  const [c, p] = lienzo(w, h), r = rng(semilla * 977 + 5);
  const caja = (x, y, ww, hh, rad, col) => { p.fillStyle = col; p.beginPath(); p.roundRect(x, y, ww, hh, rad); p.fill(); };
  const sombra = (blur, oy, a) => { p.shadowColor = `rgba(0,0,0,${a})`; p.shadowBlur = blur; p.shadowOffsetY = oy; };
  const sinSombra = () => { p.shadowColor = 'transparent'; p.shadowBlur = 0; p.shadowOffsetY = 0; };
  const barras = (x, y, ww, n, alto, gap, col) => { for (let i = 0; i < n; i++) caja(x, y + i * (alto + gap), ww * (i === n - 1 ? .55 + r() * .2 : .82 + r() * .18), alto, alto / 2, col); };
  const luz = (x, y, rad, a) => { const g = p.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, `rgba(255,250,240,${a})`); g.addColorStop(1, 'rgba(255,250,240,0)'); p.fillStyle = g; p.fillRect(0, 0, w, h); };
  if (tipo === 'escritorio' || tipo === 'producto') {
    // mesa de madera vista desde arriba
    p.fillStyle = '#8a6a4c'; p.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { const y = r() * h; p.strokeStyle = r() < .5 ? 'rgba(60,40,25,.18)' : 'rgba(255,230,200,.08)'; p.lineWidth = 2 + r() * 6;
      p.beginPath(); p.moveTo(0, y); p.bezierCurveTo(w * .3, y + (r() - .5) * 30, w * .7, y + (r() - .5) * 30, w, y + (r() - .5) * 20); p.stroke(); }
    if (tipo === 'escritorio') {
      sombra(40, 18, .45); caja(w * .12, h * .18, w * .76, h * .36, 24, '#2b2e33'); sinSombra();           // laptop
      caja(w * .15, h * .2, w * .7, h * .32, 12, '#dfe6ee');
      for (let i = 0; i < 3; i++) caja(w * .19 + i * w * .215, h * .24, w * .19, h * .13, 8, ['#c9d5e3', '#e8d6c2', '#cfe3d4'][i]);
      barras(w * .19, h * .4, w * .6, 4, 14, 14, '#aab4c0');
      sombra(30, 12, .4); caja(w * .1, h * .62, w * .42, h * .3, 10, '#f3efe6'); sinSombra();               // libreta
      for (let i = 0; i < 9; i++) caja(w * .14, h * .66 + i * 34, w * .32 * (.6 + r() * .4), 5, 2, 'rgba(60,70,90,.35)');
      sombra(30, 12, .45); p.fillStyle = '#e9e2d6'; p.beginPath(); p.arc(w * .74, h * .72, w * .1, 0, 7); p.fill(); sinSombra();   // taza
      p.fillStyle = '#5a3a24'; p.beginPath(); p.arc(w * .74, h * .72, w * .075, 0, 7); p.fill();
      sombra(26, 10, .45); caja(w * .64, h * .84, w * .2, h * .13, 18, '#1e2024'); sinSombra();              // celular
    } else {
      // caja de regalo / pedido con moño, etiqueta de precio en blanco
      sombra(60, 30, .5); caja(w * .2, h * .3, w * .6, h * .42, 16, '#c8a27a'); sinSombra();
      caja(w * .2, h * .3, w * .6, h * .1, 16, '#d8b48c');
      p.fillStyle = '#b8323a'; p.fillRect(w * .46, h * .3, w * .08, h * .42); p.fillRect(w * .2, h * .46, w * .6, w * .06);
      p.fillStyle = '#c94048'; for (const s of [-1, 1]) { p.beginPath(); p.ellipse(w * .5 + s * w * .09, h * .29, w * .1, w * .05, s * .5, 0, 7); p.fill(); }
      sombra(20, 8, .4); caja(w * .62, h * .62, w * .22, h * .09, 10, '#f5f1e8'); sinSombra();
      barras(w * .65, h * .645, w * .15, 2, 12, 12, '#9a8f80');
    }
    luz(w * .2, h * .1, w * 1.1, .35);
  } else if (tipo === 'ciudad') {
    const g = p.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0d1424'); g.addColorStop(.55, '#273a5a'); g.addColorStop(1, '#0b0f17');
    p.fillStyle = g; p.fillRect(0, 0, w, h);
    for (let capa = 0; capa < 3; capa++) { let x = -20; const base = h * (.48 + capa * .1);
      while (x < w) { const bw = 50 + r() * 120, bh = 120 + r() * (420 - capa * 90), col = ['#1a2333', '#141b28', '#0c111a'][capa];
        p.fillStyle = col; p.fillRect(x, base - bh, bw, h);
        for (let yy = base - bh + 14; yy < base + 200; yy += 22) for (let xx = x + 8; xx < x + bw - 8; xx += 16) if (r() < .32) { p.fillStyle = `rgba(255,${190 + r() * 50 | 0},${110 + r() * 60 | 0},${.5 + r() * .5})`; p.fillRect(xx, yy, 7, 10); }
        x += bw + 4; } }
    p.fillStyle = '#07090d'; p.fillRect(0, h * .78, w, h);
    luz(w * .5, h * .5, w * .9, .08);
  } else if (tipo === 'grafica') {
    p.fillStyle = '#f1eee6'; p.fillRect(0, 0, w, h);
    p.strokeStyle = 'rgba(60,70,90,.12)'; p.lineWidth = 2; for (let y = 80; y < h; y += 80) { p.beginPath(); p.moveTo(0, y); p.lineTo(w, y); p.stroke(); }
    const n = 6; for (let i = 0; i < n; i++) { const bh = h * (.12 + i * .1 + r() * .04); caja(w * .1 + i * w * .14, h * .85 - bh, w * .1, bh, 8, i === n - 1 ? '#3a3f48' : '#8d939c'); }
    luz(w * .3, h * .2, w, .3);
  } else if (tipo === 'chat') {
    p.fillStyle = '#eef0f3'; p.fillRect(0, 0, w, h);
    caja(0, 0, w, h * .1, 0, '#dfe3e8'); p.fillStyle = '#b9c0ca'; p.beginPath(); p.arc(w * .12, h * .05, h * .03, 0, 7); p.fill(); caja(w * .2, h * .04, w * .35, 18, 9, '#9aa3ae');
    let y = h * .15;
    for (let i = 0; i < 6; i++) { const mia = i % 2 === 1, bw = w * (.42 + r() * .3), bh = 70 + (r() < .5 ? 60 : 0);
      sombra(10, 4, .12); caja(mia ? w - bw - 50 : 50, y, bw, bh, 30, mia ? '#c8dcf5' : '#ffffff'); sinSombra();
      barras((mia ? w - bw - 50 : 50) + 30, y + 26, bw - 60, bh > 100 ? 2 : 1, 14, 22, mia ? '#7d93b3' : '#a3abb6'); y += bh + 34; }
  } else if (tipo === 'post') {
    // una publicación: imagen + barra de acciones + pie (sin logos)
    p.fillStyle = '#fafafa'; p.fillRect(0, 0, w, h);
    p.fillStyle = '#c3c8cf'; p.beginPath(); p.arc(80, 80, 40, 0, 7); p.fill(); caja(140, 62, 260, 20, 10, '#8f97a2'); caja(140, 92, 160, 14, 7, '#c0c6ce');
    const g = p.createLinearGradient(0, 150, w, 150 + w); g.addColorStop(0, '#e8c7a6'); g.addColorStop(1, '#9e6f57'); p.fillStyle = g; p.fillRect(0, 150, w, w);
    sombra(40, 20, .35); caja(w * .3, 150 + w * .3, w * .4, w * .45, 20, '#f4efe6'); sinSombra(); caja(w * .36, 150 + w * .38, w * .28, w * .05, 8, '#c08060');
    for (let i = 0; i < 4; i++) { p.strokeStyle = '#4a4f57'; p.lineWidth = 6; p.beginPath(); p.arc(70 + i * 90, 150 + w + 60, 26, 0, 7); p.stroke(); }
    barras(40, 150 + w + 120, w - 80, 3, 16, 18, '#9aa1aa');
  } else {
    // 'perfil': pantalla de un perfil genérico (círculo de foto, nombre, bio, botón, 3×3 publicaciones)
    p.fillStyle = '#f6f6f4'; p.fillRect(0, 0, w, h);
    const gA = p.createLinearGradient(0, 0, 0, 200); gA.addColorStop(0, '#d9b99b'); gA.addColorStop(1, '#a8775c');
    p.fillStyle = gA; p.beginPath(); p.arc(150, 170, 100, 0, 7); p.fill();
    p.strokeStyle = '#e0e0e0'; p.lineWidth = 6; p.beginPath(); p.arc(150, 170, 108, 0, 7); p.stroke();
    for (let i = 0; i < 3; i++) { caja(320 + i * 230, 130, 120, 34, 8, '#3f444c'); caja(320 + i * 230, 180, 160, 18, 9, '#a3a9b2'); }
    caja(60, 310, 330, 30, 12, '#2f333a');
    barras(60, 362, w * .8, 3, 18, 16, '#8d949e');
    caja(60, 480, (w - 140) / 2, 66, 14, '#e4e6ea'); caja(80 + (w - 140) / 2, 480, (w - 140) / 2, 66, 14, '#e4e6ea');
    for (let i = 0; i < 4; i++) { p.strokeStyle = '#c7cbd1'; p.lineWidth = 4; p.beginPath(); p.arc(120 + i * 170, 640, 52, 0, 7); p.stroke(); }
    const s = (w - 8) / 3, tonos = ['#d7c3ad', '#9fb4a6', '#c9a3a3', '#a7b4c9', '#e2d3b2', '#b7a69a', '#9eaab3', '#d4b9c5', '#c2c9b0'];
    for (let i = 0; i < 9; i++) { const x = (i % 3) * (s + 4), y = 740 + Math.floor(i / 3) * (s + 4);
      p.fillStyle = tonos[i]; p.fillRect(x, y, s, s);
      p.fillStyle = 'rgba(255,255,255,.55)'; p.beginPath(); p.roundRect(x + s * .28, y + s * .22, s * .44, s * .56, 12); p.fill();
      p.fillStyle = 'rgba(0,0,0,.12)'; p.beginPath(); p.ellipse(x + s * .5, y + s * .82, s * .26, s * .05, 0, 0, 7); p.fill(); }
  }
  // ruido fino de sensor (hace que el reemplazo se lea como foto)
  const img = p.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (hash2(i >> 2, semilla) - .5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  p.putImageData(img, 0, 0);
  return c;
}

// material(FOTOS, tipos): si hay fotos, las carga; si no, devuelve un reemplazo por cada tipo pedido.
function material(FOTOS, tipos, w = 1080, h = 1350) {
  const lista = (FOTOS || []).filter(Boolean);
  if (lista.length) {
    const p = cargarFotos(lista).then(ims => tipos.map((_, i) => ims[i % ims.length]));
    window.LISTO = p; return p;
  }
  const ims = tipos.map((t, i) => fotoNeutra(t, w, h, 11 + i * 7));
  const p = Promise.resolve(ims); window.LISTO = p; return p;
}

// ---------- el grade del estilo (una vez, en un canvas aparte) ----------
function gradear(img, modo = 'bn', o = {}) {
  const max = o.max || 1400, e = Math.min(1, max / Math.max(img.width, img.height));
  const [c, p] = lienzo(img.width * e, img.height * e);
  const filtros = {
    bn: 'grayscale(1) contrast(1.22) brightness(0.94)',
    plata: 'grayscale(1) contrast(1.18) brightness(1.02)',
    tinta: 'grayscale(1) contrast(1.35)',
    frio: 'contrast(1.07) saturate(0.9) brightness(0.99)',
    cine: 'contrast(1.12) saturate(0.86) brightness(1.0)',
    duotono: 'grayscale(1) contrast(1.3)',
    noticia: 'contrast(1.07) saturate(0.92) brightness(0.98)',
  };
  p.filter = o.filtro || filtros[modo] || 'none'; p.drawImage(img, 0, 0, c.width, c.height); p.filter = 'none';
  const capa = (op, col, a = 1) => { p.save(); p.globalCompositeOperation = op; p.globalAlpha = a; p.fillStyle = col; p.fillRect(0, 0, c.width, c.height); p.restore(); };
  if (modo === 'plata') { capa('multiply', '#efe7d6'); capa('screen', '#17140f'); }
  if (modo === 'tinta' || modo === 'duotono') {
    // dos tonos: negro → tinta, blanco → papel (mapa de luminancia)
    const os = o.oscuro || o.tinta || (modo === 'tinta' ? '#141210' : '#0E1013'), cl = o.claro || o.papel || (modo === 'tinta' ? '#EDE4D0' : '#ECE7D8');
    const hx = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = hx(os), B = hx(cl);
    const im = p.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) { let g = d[i] / 255; g = g + .32 * (g - .5) * (1 - Math.abs(2 * g - 1)) * 2; g = clamp(g);
      d[i] = A[0] + (B[0] - A[0]) * g; d[i + 1] = A[1] + (B[1] - A[1]) * g; d[i + 2] = A[2] + (B[2] - A[2]) * g; }
    p.putImageData(im, 0, 0);
  }
  if (modo === 'frio') { capa('soft-light', 'rgba(40,70,110,1)', .12); capa('soft-light', 'rgba(255,200,150,1)', .06); }
  if (modo === 'cine') { capa('soft-light', 'rgba(255,190,120,1)', .14); capa('screen', '#0a0806', .5); }
  if (modo === 'noticia') capa('soft-light', 'rgba(255,200,140,1)', .06);
  return c;
}

// cubrir: como fotoCover, con empuje (zoom) alrededor del foco
function cubrir(im, x, y, w, h, fx = .5, fy = .45, zoom = 1) {
  const e = Math.max(w / im.width, h / im.height) * zoom, sw = w / e, sh = h / e;
  const sx = clamp((im.width - sw) * fx, 0, im.width - sw), sy = clamp((im.height - sh) * fy, 0, im.height - sh);
  ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
}

// ---------- textura de proyección ----------
const MOSAICOS_GRANO = [];
function granoPeli(alfa = .18, frame = 0, op = 'overlay') {
  if (!MOSAICOS_GRANO.length) for (let k = 0; k < 6; k++) { const [c, g] = lienzo(256, 256), im = g.createImageData(256, 256), d = im.data, r = rng(700 + k);
    for (let i = 0; i < d.length; i += 4) { const v = 128 + ((r() + r() + r() - 1.5) * 120); d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); MOSAICOS_GRANO.push(c); }
  ctx.save(); ctx.globalAlpha = alfa; ctx.globalCompositeOperation = op;
  const m = MOSAICOS_GRANO[frame % 6]; ctx.translate((frame * 37) % 256, (frame * 91) % 256);
  ctx.fillStyle = ctx.createPattern(m, 'repeat'); ctx.fillRect(-256, -256, ctx.canvas.width + 512, ctx.canvas.height + 512); ctx.restore();
}
function vineta(x, y, w, h, fuerza = .4) {
  ctx.save(); const g = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * .3, x + w / 2, y + h / 2, Math.max(w, h) * .75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${fuerza})`); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.restore();
}
function rayasPeli(frame, x, y, w, h, o = {}) {           // rayas que viven 9 cuadros y polvo de 1 cuadro (suave)
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const bloque = Math.floor(frame / 9);
  for (let i = 0; i < 3; i++) if (hash2(bloque, i) < .55) { const xx = x + hash2(bloque, i + 9) * w;
    ctx.strokeStyle = `rgba(255,250,235,${.12 + hash2(i, bloque) * .14})`; ctx.lineWidth = 1 + hash2(bloque, i + 4) * 1.6;
    ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + (hash2(bloque, i + 2) - .5) * 14, y + h); ctx.stroke(); }
  for (let i = 0; i < 4; i++) if (hash2(frame, i + 30) < .6) { ctx.fillStyle = hash2(frame, i) < .5 ? 'rgba(0,0,0,.55)' : 'rgba(255,250,235,.4)';
    ctx.beginPath(); ctx.ellipse(x + hash2(frame, i + 40) * w, y + hash2(frame, i + 50) * h, 2 + hash2(i, frame) * 5, 1.5 + hash2(frame, i + 7) * 3, hash2(i, 3) * 3, 0, 7); ctx.fill(); }
  ctx.restore();
}

// ---------- números en casillas fijas ----------
function digitosFijos(str, x, y, font, col, al = 'left') {
  ctx.save(); ctx.font = font; ctx.fillStyle = col; ctx.textBaseline = 'alphabetic';
  const slot = ctx.measureText('0').width, ancho = [...str].reduce((a, ch) => a + (/\d/.test(ch) ? slot : ctx.measureText(ch).width), 0);
  let xx = al === 'right' ? x - ancho : al === 'center' ? x - ancho / 2 : x;
  for (const ch of str) { const cw = /\d/.test(ch) ? slot : ctx.measureText(ch).width; ctx.textAlign = 'center'; ctx.fillText(ch, xx + cw / 2, y); xx += cw; }
  ctx.restore(); return ancho;
}

// ---------- frase de diseño: la clave enorme, los conectores chicos ----------
// texto con la clave entre *asteriscos* («tu contenido *no vende*»). o: familia, peso, grande, chico, ancho, alto, x, y, al ('left'|'center'),
// interlineado, mayus. Prueba escalas de 1 hacia abajo hasta que todo cabe en ancho × alto; si no cabe, avisa en consola.
function maqueta(texto, o = {}) {
  const { familia = LETRA_LIMPIA, peso = 800, pesoChico = peso, grande = 220, chico = 80, ancho = SEGURA.right - SEGURA.left, alto = 900,
    x = SEGURA.left, y = SEGURA.top, al = 'left', inter = 1.02, mayus = false, familiaChica = familia } = o;
  const tokens = []; let clave = false;
  for (const parte of texto.split('*')) { for (const pal of parte.trim().split(/\s+/).filter(Boolean)) tokens.push({ txt: mayus ? pal.toUpperCase() : pal, clave }); clave = !clave; }
  for (let esc = 1; esc >= .3; esc -= .03) {
    const lineas = []; let cur = [], cw = 0, ok = true;
    const medida = tk => { const size = Math.round((tk.clave ? grande : chico) * esc), font = `${tk.clave ? peso : pesoChico} ${size}px ${tk.clave ? familia : familiaChica}`;
      return { ...tk, size, font, w: medir(tk.txt, font), sp: medir(' ', font) }; };
    for (const tk of tokens.map(medida)) {
      if (tk.w > ancho) { ok = false; break; }
      // una clave grande arranca renglón propio; un conector chico se pega al anterior si cabe
      const nueva = cur.length && (cw + tk.sp + tk.w > ancho || tk.clave !== cur[cur.length - 1].clave);
      if (nueva) { lineas.push(cur); cur = []; cw = 0; }
      cur.push(tk); cw += (cur.length > 1 ? tk.sp : 0) + tk.w;
    }
    if (!ok) continue; if (cur.length) lineas.push(cur);
    const altos = lineas.map(l => Math.max(...l.map(k => k.size)) * inter), total = altos.reduce((a, b) => a + b, 0);
    if (total > alto) continue;
    const pal = []; let yy = y;
    lineas.forEach((l, i) => { const lw = l.reduce((a, k, j) => a + k.w + (j ? k.sp : 0), 0);
      let xx = al === 'center' ? x + (ancho - lw) / 2 : al === 'right' ? x + ancho - lw : x; yy += altos[i] * .86;
      for (const k of l) { pal.push({ ...k, x: xx, y: yy, linea: i }); xx += k.w + k.sp; } yy += altos[i] * .14; });
    return { palabras: pal, alto: total, x, y, ancho, lineas: lineas.length };
  }
  console.error(`[maqueta] «${texto}» no cabe en ${ancho}×${alto}: acorta la frase.`);
  return maqueta(texto.split(' ').slice(0, 3).join(' '), { ...o, grande: grande * .5, chico: chico * .5 });
}
// pinta la maqueta: la palabra i aparece entera en t0 + i·cada (corte seco). o.col, o.colClave, o.bloque (color del bloque tras la clave)
function pintarMaqueta(m, t, t0 = 0, cada = .18, o = {}) {
  const { col = '#fff', colClave = col, bloque = null, colSobreBloque = '#0E0E0C', sombra = null, borde = null } = o;
  m.palabras.forEach((k, i) => {
    const ti = t0 + i * cada; if (t < ti) return;
    ctx.save(); ctx.font = k.font; ctx.textBaseline = 'alphabetic';
    if (k.clave && bloque) {                                       // bloque que se abre de izquierda a derecha detrás de la clave (0,12 s)
      const q = easeOut(prog(t, ti, ti + .12)), pad = k.size * .1, sig = m.palabras[i + 1], une = sig && sig.clave && sig.linea === k.linea ? k.sp : 0;   // claves vecinas: un solo bloque
      ctx.fillStyle = bloque; ctx.fillRect(k.x - pad, k.y - k.size * .8, (k.w + pad * 2 + une) * q, k.size * .98);
    }
    if (sombra) { ctx.shadowColor = sombra; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4; }
    if (borde) { ctx.lineJoin = 'round'; ctx.lineWidth = borde[0]; ctx.strokeStyle = borde[1]; ctx.strokeText(k.txt, k.x, k.y); }
    ctx.fillStyle = k.clave ? (bloque ? colSobreBloque : colClave) : col; ctx.fillText(k.txt, k.x, k.y);
    ctx.restore();
  });
}

// ---------- gestos de montaje ----------
function flash(a, col = '255,255,255') { if (a <= .003) return; ctx.save(); ctx.fillStyle = `rgba(${col},${clamp(a)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
// banda diagonal que barre la pantalla (p 0→1). capas: [[ancho, color], ...] del borde de ataque hacia atrás.
function bandaWipe(p, ang, capas, o = {}) {
  if (p <= 0 || p >= 1) return;
  const total = capas.reduce((a, c) => a + c[0], 0), L = Math.hypot(W, H) + total * 2, d = lerp(-L / 2 - total, L / 2 + total, p);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(ang);
  let off = d; for (const [ancho, col] of capas) { ctx.fillStyle = col; ctx.fillRect(off - ancho, -L, ancho, L * 2); off -= ancho; }
  ctx.restore();
}
// clip de lo que la banda ya destapó (para dibujar la escena nueva detrás del borde)
function clipBanda(p, ang, capas = [[0, '']]) {
  const total = capas.reduce((a, c) => a + c[0], 0), L = Math.hypot(W, H) + total * 2, d = lerp(-L / 2 - total, L / 2 + total, p) - total + 2;
  ctx.translate(W / 2, H / 2); ctx.rotate(ang); ctx.beginPath(); ctx.rect(-L * 2, -L * 2, L * 2 + d, L * 4); ctx.rotate(-ang); ctx.translate(-W / 2, -H / 2); ctx.clip();
}

// trazo de telestrador sobre la imagen (p 0→1 a lo largo). o: col, w, punteado, flecha
function marcador(pts, p, o = {}) {
  const { col = '#FFD400', w = 12, punteado = false, flecha = true, semilla = 1 } = o;
  if (p <= 0 || pts.length < 2) return;
  const P = resample(pts, 8).map(([x, y], i) => [x + (hash2(i >> 3, semilla) - .5) * 2.4, y + (hash2(semilla, i >> 3) - .5) * 2.4]);
  const n = Math.max(2, Math.round(P.length * clamp(p))), Q = P.slice(0, n);
  const traza = (lw, c, dash) => { ctx.save(); ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = c; ctx.lineWidth = lw; if (dash) ctx.setLineDash([lw * 2.4, lw * 1.6]);
    ctx.beginPath(); ctx.moveTo(...Q[0]); for (const q of Q.slice(1)) ctx.lineTo(...q); ctx.stroke(); ctx.restore(); };
  traza(w + 6, 'rgba(0,0,0,.55)', punteado); traza(w, col, punteado); traza(w * .28, 'rgba(255,255,255,.75)', punteado);
  if (flecha && p > .9) { const [x1, y1] = Q[Q.length - 1], [x0, y0] = Q[Math.max(0, Q.length - 4)], a = Math.atan2(y1 - y0, x1 - x0), s = w * 3.2 * clamp((p - .9) / .1);
    ctx.save(); ctx.translate(x1, y1); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(s * .4, 0); ctx.lineTo(-s, -s * .7); ctx.lineTo(-s * .6, 0); ctx.lineTo(-s, s * .7); ctx.closePath();
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.stroke(); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }
}
// círculo dibujado en sentido horario desde arriba a la izquierda (p 0→1)
function circuloTrazo(cx, cy, rx, ry, p, o = {}) {
  const { col = '#FF4A2E', w = 5, giro = 1.08 } = o; if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath();
  const a0 = -Math.PI * .75, n = 80; for (let i = 0; i <= n * clamp(p); i++) { const a = a0 + i / n * Math.PI * 2 * giro, k = 1 + (i / n) * .05; const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke(); ctx.restore();
}
// anillo en perspectiva (ry = .36 r) dibujado en sentido horario, con un anillo exterior punteado que gira
function anilloPiso(cx, cy, r, p, t, col = '#FFD400') {
  if (p <= 0) return; const ry = r * .36;
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 11; ctx.beginPath(); ctx.ellipse(cx, cy, r, ry, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p)); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.stroke();
  if (p >= 1) { ctx.setLineDash([16, 12]); ctx.lineDashOffset = -t * 60; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.25, ry * 1.25, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = .18; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy, r, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// sello: cae de 1,9× a 1× en 0,16 s (aterriza seco, sin rebote) con una elipse que se abre
function sello(txt, x, y, p, o = {}) {
  if (p <= 0) return;
  const { font = `900 90px ${LETRA_LIMPIA}`, fondo = '#F2CF1D', tinta = '#121417', rot = -.14, doble = null } = o;
  const k = aterriza(clamp(p / .16 * .16 / .16)), esc = lerp(1.9, 1, aterriza(clamp(p * 6.25)));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(esc, esc); ctx.font = font;
  const w = medir(txt, font) + 70, size = parseInt(font.match(/(\d+)px/)[1]), h = size * 1.35;
  if (p > .16 && p < .6) { const q = (p - .16) / .44; ctx.save(); ctx.globalAlpha = (1 - q) * .6; ctx.strokeStyle = fondo; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, 0, w * (.6 + q * .6), h * (.6 + q * .6), 0, 0, 7); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = fondo; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = doble || tinta; ctx.lineWidth = 5; ctx.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
  ctx.fillStyle = tinta; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, size * .05);
  ctx.restore(); void k;
}
