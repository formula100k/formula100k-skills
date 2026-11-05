#!/usr/bin/env node
// video.mjs — el modo «Con tu video»: tu video grabado → corte fino → gráficos del estilo → MP4. Igual en Mac y en Windows.
// Uso:
//   node scripts/video.mjs preparar <video> <nombre-corto> [desde] [hasta]   copia el video (opcional: solo de «desde» a «hasta», en s),
//        lo pasa a 30 fps y lo transcribe → ~/Documents/mis-videos-editados/<nombre>/fuente/palabras-original.json (imprime el texto)
//   node scripts/video.mjs cortar <proyecto>      corte fino (sin silencios ni lo de fuente/quitar.json) → fuente/cortado.mp4 + palabras.json
//   node scripts/video.mjs mate <proyecto>        recorta a la persona del fondo → fuente/mate.mp4 (solo si alguna escena es «recorte»)
//   node scripts/video.mjs render <proyecto> <salida.mp4>   arma la pieza, renderiza los gráficos (y la capa de frente) y compone
//   node scripts/video.mjs plantilla <proyecto> [estilo]   copia la plantilla del estilo (plantilla/estilos/<estilo>.src.html) a fuente/pieza.src.html
//   node scripts/video.mjs clips <proyecto> <clips.json>    de un video largo ya cortado saca un proyecto por clip:
//        clips.json = [{"nombre": "…", "desde": s, "hasta": s}, …] en segundos del video cortado → <proyecto>-<nombre>/
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { K, VIDEOS, casa, correr, durar, renderizar, salir } from './comun.mjs';
import { transcribir } from './sistema.mjs';

// El complemento «auto-edit-effects» (20 efectos y 7 looks más) vive al lado de esta skill; si no está, todo sigue igual.
const EXTRA = join(K, '..', 'auto-edit-effects');
const ENC = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k'];
const leer = f => JSON.parse(readFileSync(f, 'utf8'));
// ffmpeg 7+ lee el filtro de un archivo con «-/filter_complex»; las versiones viejas, con «-filter_complex_script»
const conFiltro = archivo => [correr('ffmpeg', ['-hide_banner', '-h', 'full']).includes('filter_complex_script') ? '-filter_complex_script' : '-/filter_complex', archivo];

function preparar(video, nombre, desde, hasta) {
  const P = /[\\/]/.test(nombre) ? casa(nombre) : join(VIDEOS, nombre.replace(/[^\p{L}\p{N}_-]+/gu, '-')), F = join(P, 'fuente');
  mkdirSync(F, { recursive: true });
  const r = [...(desde ? ['-ss', desde] : []), ...(hasta ? ['-to', hasta] : [])];
  correr('ffmpeg', ['-loglevel', 'error', '-y', ...r, '-i', casa(video), '-map', '0:v:0', '-map', '0:a:0', '-r', '30', ...ENC, join(F, 'original.mp4')]);
  console.log('Transcribiendo (la primera vez descarga el modelo)…');
  const t = transcribir(join(F, 'original.mp4'), { dir: F });
  if (!t.ok) throw new Error('No pude transcribir.\n' + t.error);
  const ws = leer(t.archivo).segments.flatMap(s => s.words || []).map(w => ({ w: w.word.trim(), s: +w.start.toFixed(2), e: +w.end.toFixed(2) }));
  writeFileSync(join(F, 'palabras-original.json'), JSON.stringify(ws));
  for (let i = 0; i < ws.length; i += 12) {
    const g = ws.slice(i, i + 12);
    console.log(`[${g[0].s.toFixed(2).padStart(6)}–${g.at(-1).e.toFixed(2).padStart(6)}] #${String(i).padEnd(4)} ` + g.map(x => x.w).join(' '));
  }
  console.log(`\nproyecto -> ${P}`);
}

// Deja solo los tramos con voz. quitar.json = [[desde, hasta], …] en segundos del video ORIGINAL.
function cortar(P) {
  const F = join(P, 'fuente'), ws = leer(join(F, 'palabras-original.json'));
  const quitar = existsSync(join(F, 'quitar.json')) ? leer(join(F, 'quitar.json')) : [];
  const ANTES = 0.06, DESPUES = 0.10, UNIR = 0.30;     // aire antes/después de cada palabra; huecos menores a UNIR no se cortan
  const quedan = ws.filter(w => !quitar.some(([a, b]) => a <= (w.s + w.e) / 2 && (w.s + w.e) / 2 <= b));
  const tramos = [];
  for (const w of quedan) {
    const a = Math.max(0, w.s - ANTES), b = w.e + DESPUES, u = tramos.at(-1);
    if (u && a - u[1] < UNIR && !quitar.some(q => u[1] <= q[0] && q[0] <= a)) u[1] = Math.max(u[1], b); else tramos.push([a, b]);
  }
  const nuevo = []; let acum = 0, k = 0;          // cada palabra con su tiempo en el video cortado
  for (const [a, b] of tramos) {
    for (; k < quedan.length && quedan[k].s < b; k++) { const w = quedan[k]; nuevo.push({ w: w.w, s: +(acum + Math.max(0, w.s - a)).toFixed(2), e: +(acum + Math.min(b, w.e) - a).toFixed(2) }); }
    acum += b - a;
  }
  writeFileSync(join(F, 'tramos.json'), JSON.stringify(tramos.map(t => t.map(x => +x.toFixed(3)))));
  writeFileSync(join(F, 'palabras.json'), JSON.stringify(nuevo));
  const f = tramos.map(([a, b], i) => `[0:v]trim=${a.toFixed(3)}:${b.toFixed(3)},setpts=PTS-STARTPTS[v${i}];[0:a]atrim=${a.toFixed(3)}:${b.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=${Math.max(0, b - a - 0.012).toFixed(3)}:d=0.012[a${i}];`).join('')
    + tramos.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${tramos.length}:v=1:a=1[v][a]`;
  writeFileSync(join(F, 'corte.filtro'), f);
  correr('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(F, 'original.mp4'), ...conFiltro(join(F, 'corte.filtro')), '-map', '[v]', '-map', '[a]', '-r', '30', ...ENC, join(F, 'cortado.mp4')]);
  console.log(`${tramos.length} tramos · ${acum.toFixed(1)} s de ${ws.at(-1).e.toFixed(1)} s · ${nuevo.length} palabras -> ${join(F, 'cortado.mp4')}`);
}

function mate(P) {
  const F = join(P, 'fuente');
  console.log('Recortando a la persona (la primera vez descarga el modelo de recorte, 15 MB; luego ~6 cuadros por segundo)…');
  correr('uv', ['run', '--quiet', '--python', '3.12', join(K, 'scripts', 'mate.py'), join(F, 'cortado.mp4'), join(F, 'mate.mp4')],
    { env: { ...process.env, PYTHONUTF8: '1', GLOG_minloglevel: '2', TF_CPP_MIN_LOG_LEVEL: '3' } });
  if (!existsSync(join(F, 'mate.mp4'))) throw new Error('No se creó fuente/mate.mp4.');
  console.log('listo -> ' + join(F, 'mate.mp4'));
}

// fuente/pieza.src.html + palabras + plano + duración + motor/nucleo.js + motor/titulos.js → fuente/pieza.html
function armar(P) {
  const F = join(P, 'fuente');
  for (const a of ['pieza.src.html', 'plano.json', 'palabras.json', 'cortado.mp4']) if (!existsSync(join(F, a))) throw new Error(`Falta ${join(F, a)}.`);
  const nucleo = readFileSync(join(K, 'motor', 'nucleo.js'), 'utf8');
  const titulos = existsSync(join(K, 'motor', 'titulos.js')) ? readFileSync(join(K, 'motor', 'titulos.js'), 'utf8') : '';
  const efectos = existsSync(join(K, 'motor', 'efectos.js')) ? readFileSync(join(K, 'motor', 'efectos.js'), 'utf8') : '';
  const extra = existsSync(join(EXTRA, 'motor', 'efectos-extra.js')) ? '\n' + readFileSync(join(EXTRA, 'motor', 'efectos-extra.js'), 'utf8') : '';   // + el complemento auto-edit-effects (20 efectos más)
  const h = readFileSync(join(F, 'pieza.src.html'), 'utf8')
    .replace('__PALABRAS__', () => readFileSync(join(F, 'palabras.json'), 'utf8'))
    .replace('__PLANO__', () => readFileSync(join(F, 'plano.json'), 'utf8'))
    .replace('__DUR__', String(durar(join(F, 'cortado.mp4'))))
    .replace('<script src="../nucleo/nucleo.js"></script>', () => '<script>\n' + nucleo + '\n</script>')
    .replace('<script src="../nucleo/titulos.js"></script>', () => '<script>\n' + titulos + '\n</script>\n<script>\n' + efectos + extra + '\n</script>');   // las 21 plantillas de gancho + las piezas de Efectos
  writeFileSync(join(F, 'pieza.html'), h);
  return join(F, 'pieza.html');
}

// Capas: negro → tu video (y tus otras tomas o B-roll) donde diga cada escena → gráficos (el verde #00FF00 deja ver lo de abajo)
// → tú recortada (escenas «recorte») → la capa de frente (lo que va delante de ti). El audio es el de fuente/cortado.mp4.
// Extras de plano.json:
//   "tomas": {"2": "toma2.mp4"}           otras tomas tuyas (en fuente/), mudas; una caja con "toma": 2 la usa («Dos de ti»)
//   escena "persona": [caja, caja, …]     varias cajas a la vez; cada caja {"x","y","w","h"} puede llevar "toma", "recorte", "cara" y "bn" (blanco y negro)
//   escena "broll": {"archivo": "broll/x.mp4", "x","y","w","h", "desde": 0, "bn": true}   un clip mudo en esa caja (debajo de los gráficos)
//   escena "efecto": {"tipo": "polaroid", …}   tu video con un efecto (fuente/efx/<i>.mp4 de scripts/efectos.py) en vez de las cajas de "persona";
//                                             "capa" debajo (bajo los gráficos, como tu video normal) o encima (sobre los gráficos, con su alfa)
const CAPA_EFX = { polaroid: 'encima', romper: 'encima', papel: 'encima', estudio: 'encima', ventana: 'encima' };   // «ventana» es de auto-edit-effects
const efx = e => { if (!e.efecto) return null; const ef = typeof e.efecto === 'string' ? { tipo: e.efecto } : e.efecto; return [ef.tipo, ef.capa || CAPA_EFX[ef.tipo] || 'debajo']; };
function componer(P, salida) {
  const F = join(P, 'fuente'), plano = leer(join(F, 'plano.json')), formato = plano.formato || '9:16';
  const [W, H] = formato === '16:9' ? [1920, 1080] : [1080, 1920];
  const CAJAS = {
    '9:16': { completa: [0, 0, 1080, 1920], arriba: [0, 0, 1080, 960], abajo: [0, 960, 1080, 960], panel: [60, 1260, 960, 600], recorte: [0, 0, 1080, 1920] },
    '16:9': { completa: [0, 0, 1920, 1080], derecha: [960, 0, 960, 1080], izquierda: [0, 0, 960, 1080], esquina: [1400, 640, 460, 400], recorte: [0, 0, 1920, 1080] },
  }[formato];
  const CARA = plano.cara || [0.5, 0.35];   // dónde está tu cara en el video (0..1): el recorte la mantiene en cuadro
  const cortado = join(F, 'cortado.mp4'), dur = durar(cortado);
  const tamano = f => {   // ancho y alto como se VEN: el iPhone graba acostado con una marca de giro que ffmpeg aplica al decodificar
    const v = JSON.parse(correr('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:stream_side_data=rotation', '-of', 'json', f])).streams[0];
    const giro = (v.side_data_list || []).find(d => 'rotation' in d)?.rotation || 0;
    return Math.abs(giro) % 180 === 90 ? [v.height, v.width] : [v.width, v.height];
  };
  const TOMAS = { 1: cortado, ...Object.fromEntries(Object.entries(plano.tomas || {}).map(([k, v]) => [k, join(F, v)])) };
  const entradas = [], idx = new Map();
  const entrada = (ruta, extra = []) => {   // cada archivo entra una sola vez; devuelve su índice
    if (!existsSync(ruta)) throw new Error(`No encuentro ${ruta}.`);
    if (!idx.has(ruta)) { idx.set(ruta, idx.size); entradas.push(...extra, '-i', ruta); }
    return idx.get(ruta);
  };
  entrada(cortado); entrada(join(F, 'graficos.mp4'));
  const cajas = e => {   // → [[caja, recorte, toma, cara, bn]]
    const p = e.persona || 'completa';
    if (p === 'oculta') return [];
    return (Array.isArray(p) ? p : [p]).map(c => {
      if (typeof c === 'object') return [[c.x, c.y, c.w, c.h], !!c.recorte, String(c.toma || 1), c.cara || CARA, !!c.bn];
      if (!CAJAS[c]) throw new Error(`persona «${c}» no existe en ${formato}. Usa: ${Object.keys(CAJAS).join(', ')}, oculta o una caja {x,y,w,h}.`);
      return [CAJAS[c], c === 'recorte', '1', CARA, false];
    });
  };
  const cover = ([sw0, sh0], w, h, [fx, fy]) => {   // escala para llenar w×h y recorta alrededor de la cara
    const e = Math.max(w / sw0, h / sh0), sw = Math.round(sw0 * e / 2) * 2, sh = Math.round(sh0 * e / 2) * 2;
    return `scale=${sw}:${sh},crop=${w}:${h}:${Math.floor((sw - w) * fx)}:${Math.floor((sh - h) * fy)}`;
  };
  const fil = [`color=black:s=${W}x${H}:r=30:d=${dur.toFixed(3)}[b0]`]; let cur = 'b0', n = 0;
  // quita el verde: transparente donde la pieza pintó #00FF00 y le saca el tinte verde SOLO a 2 px del hueco
  // (un despill en toda la imagen vuelve naranja el amarillo; aquí el interior opaco conserva su color exacto)
  const llave = (i, o) => fil.push(`[${i}:v]format=gbrp,colorkey=0x00FF00:0.13:0.05,split=4[${o}a][${o}b][${o}c][${o}d]`,
    `[${o}a]alphaextract,lut=y='if(gte(val,250),255,0)',erosion,erosion,format=gbrp[${o}m]`, `[${o}b]format=gbrp[${o}o]`, `[${o}c]despill=type=green,format=gbrp[${o}s]`,
    `[${o}s][${o}o][${o}m]maskedmerge,format=gbrap[${o}x]`, `[${o}d]alphaextract[${o}al]`, `[${o}x][${o}al]alphamerge[${o}]`);
  const poner = (etiqueta, x, y, e) => { fil.push(`[${cur}][${etiqueta}]overlay=${x}:${y}:enable='between(t,${e.desde},${e.hasta})'[c${n}]`); cur = `c${n++}`; };
  const encima = [];
  const clipEfx = (j, alfa) => `[${entrada(join(F, 'efx', `${j}${alfa ? '_a' : ''}.mp4`))}:v]setpts=PTS-STARTPTS+${plano.escenas[j].desde}/TB`;
  for (const [j, e] of plano.escenas.entries()) {
    const ex = efx(e);
    if (ex && ex[1] === 'debajo') { fil.push(`${clipEfx(j)}[ef${n}]`); poner(`ef${n}`, 0, 0, e); }
    for (const [[x, y, w, h], rec, toma, cara, bn] of (ex ? [] : cajas(e))) {
      if (rec) { encima.push([e, [x, y, w, h], cara]); continue; }
      if (!TOMAS[toma]) throw new Error(`La caja usa la toma ${toma}, pero plano.json no la tiene en "tomas".`);
      const i = entrada(TOMAS[toma]);
      fil.push(`[${i}:v]${cover(tamano(TOMAS[toma]), w, h, cara)}${bn ? ',hue=s=0' : ''}[q${n}]`); poner(`q${n}`, x, y, e);
    }
    if (e.broll) {   // B-roll: encima de tu video, debajo de los gráficos; corre desde «desde» del clip al empezar la escena
      const b = e.broll, ruta = join(F, b.archivo), i = entrada(ruta, ['-stream_loop', '-1']);
      const [x, y, w, h] = [b.x ?? 0, b.y ?? 0, b.w ?? W, b.h ?? H];
      fil.push(`[${i}:v]trim=start=${b.desde || 0},setpts=PTS-STARTPTS+${e.desde}/TB,fps=30,${cover(tamano(ruta), w, h, [.5, .5])}${b.bn ? ',hue=s=0' : ''}[br${n}]`);
      poner(`br${n}`, x, y, e);
    }
  }
  if (encima.length && !existsSync(join(F, 'mate.mp4'))) throw new Error('Hay escenas «recorte» pero falta fuente/mate.mp4: corre antes «node scripts/video.mjs mate».');
  llave(1, 'g'); fil.push(`[${cur}][g]overlay=0:0:shortest=1[cg]`); cur = 'cg';
  plano.escenas.forEach((e, j) => {   // efectos que van ENCIMA de los gráficos (polaroid, vidrios, papel, estudio)
    const ex = efx(e); if (!ex || ex[1] !== 'encima') return;
    fil.push(`${clipEfx(j)},format=rgba[ec${j}]`, `${clipEfx(j, true)},format=gray[ea${j}]`, `[ec${j}][ea${j}]alphamerge[ex${j}]`); poner(`ex${j}`, 0, 0, e);
  });
  if (encima.length) {
    const src = tamano(cortado), iM = entrada(join(F, 'mate.mp4'));
    encima.forEach(([e, [x, y, w, h], cara], j) => {
      fil.push(`[${iM}:v]format=gray,${cover(src, w, h, cara)}[mm${j}]`, `[0:v]${cover(src, w, h, cara)},format=rgba[pp${j}]`, `[pp${j}][mm${j}]alphamerge[r${j}]`);
      poner(`r${j}`, x, y, e);
    });
  }
  if (existsSync(join(F, 'frente.mp4'))) {
    const iF = entrada(join(F, 'frente.mp4'));
    llave(iF, 'fr'); fil.push(`[${cur}][fr]overlay=0:0[fin]`); cur = 'fin';
  }
  writeFileSync(join(F, 'componer.filtro'), fil.join(';\n'));
  correr('ffmpeg', ['-loglevel', 'error', '-y', ...entradas, ...conFiltro(join(F, 'componer.filtro')), '-map', `[${cur}]`, '-map', '0:a',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', dur.toFixed(3), salida]);
  console.log(`listo -> ${salida} · ${dur.toFixed(1)} s · ${plano.escenas.length} escenas (${encima.length} con tu recorte encima)`);
}

// Un proyecto por clip, con su tramo de cortado.mp4 (y de mate.mp4), sus palabras desde 0 y onda.json (volumen del video completo en
// 160 tramos, su duración y el tramo del clip: lo usa «Clips de una llamada»). Los bordes caen en palabra completa.
function clips(P, lista) {
  const F = join(P, 'fuente'), ws = leer(join(F, 'palabras.json')), hayMate = existsSync(join(F, 'mate.mp4'));
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-i', join(F, 'cortado.mp4'), '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error('No pude leer el audio de ' + join(F, 'cortado.mp4'));
  const pcm = new Int16Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length >> 1), total = pcm.length / 8000, n = Math.floor(pcm.length / 160);
  const rms = Array.from({ length: 160 }, (_, i) => { let s = 0, k = 0; for (let j = i * n; j < (i + 1) * n; j += 4) { s += pcm[j] ** 2; k++; } return Math.sqrt(s / Math.max(1, k)); });
  const tope = Math.max(...rms) || 1, onda = rms.map(v => +(v / tope).toFixed(2));
  for (const c of leer(lista)) {
    const dentro = ws.filter(w => w.s >= c.desde - 0.05 && w.e <= c.hasta + 0.15);
    if (!dentro.length) throw new Error(`El clip «${c.nombre}» no tiene palabras entre ${c.desde} y ${c.hasta} s.`);
    const a = Math.max(0, dentro[0].s - 0.04), b = dentro.at(-1).e + 0.12, F2 = join(`${P}-${c.nombre}`, 'fuente');
    mkdirSync(F2, { recursive: true });
    const tramo = (src, out, audio) => correr('ffmpeg', ['-loglevel', 'error', '-y', '-ss', a.toFixed(3), '-to', b.toFixed(3), '-i', join(F, src),
      ...(audio ? ENC : ['-an', ...ENC.slice(0, 8)]), join(F2, out)]);
    tramo('cortado.mp4', 'cortado.mp4', true); if (hayMate) tramo('mate.mp4', 'mate.mp4', false);
    writeFileSync(join(F2, 'palabras.json'), JSON.stringify(dentro.map(w => ({ w: w.w, s: +(w.s - a).toFixed(2), e: +(w.e - a).toFixed(2) }))));
    writeFileSync(join(F2, 'onda.json'), JSON.stringify({ onda, total: +total.toFixed(2), tramo: [+a.toFixed(2), +b.toFixed(2)] }));
    console.log(`${c.nombre}: ${(b - a).toFixed(1)} s · ${dentro.length} palabras -> ${join(P + '-' + c.nombre)}`);
  }
}

function render(P, salida) {
  const F = join(P, 'fuente'), pieza = armar(P);
  console.log('Renderizando los gráficos (cada cuadro se dibuja en Chrome)…');
  console.log(renderizar([pieza, join(F, 'graficos.mp4'), '--callado'], { stdio: ['ignore', 'pipe', 'inherit'] }).trim().split('\n').at(-1));
  rmSync(join(F, 'frente.mp4'), { force: true });
  if (/^const FRENTE\s*=\s*true/m.test(readFileSync(join(F, 'pieza.src.html'), 'utf8'))) {
    console.log('Renderizando la capa de frente…');
    console.log(renderizar([pieza, join(F, 'frente.mp4'), '--verde', '--callado'], { stdio: ['ignore', 'pipe', 'inherit'] }).trim().split('\n').at(-1));
  }
  rmSync(join(F, 'efx'), { recursive: true, force: true });
  if (leer(join(F, 'plano.json')).escenas.some(e => e.efecto)) {
    console.log('Preparando los efectos de tu video (acercamientos, foto, vidrios…)…');
    correr('uv', ['run', '--quiet', '--python', '3.12', join(K, 'scripts', 'efectos.py'), P], { env: { ...process.env, PYTHONUTF8: '1' } });
  }
  componer(P, salida);
  const plano = leer(join(F, 'plano.json'));
  if ((plano.sonidos || []).length) {   // efectos de sonido graves de plano.json["sonidos"] (complemento auto-edit-effects)
    if (!existsSync(join(EXTRA, 'video', 'sonidos.py'))) throw new Error('plano.json trae "sonidos", pero falta la skill auto-edit-effects (instala el módulo Edición completo).');
    console.log(correr('uv', ['run', '--quiet', '--python', '3.12', join(EXTRA, 'video', 'sonidos.py'), P, salida], { env: { ...process.env, PYTHONUTF8: '1' } }).trim());
  }
}

try {
  const [orden, ...a] = process.argv.slice(2);
  if (orden === 'preparar' && a[1]) preparar(...a);
  else if (orden === 'cortar' && a[0]) cortar(casa(a[0]));
  else if (orden === 'mate' && a[0]) mate(casa(a[0]));
  else if (orden === 'render' && a[1]) render(casa(a[0]), casa(a[1]));
  else if (orden === 'clips' && a[1]) clips(casa(a[0]), casa(a[1]));
  else if (orden === 'plantilla' && a[0]) {   // copia la plantilla del estilo (o el kit solo) a fuente/pieza.src.html
    const destino = join(casa(a[0]), 'fuente', 'pieza.src.html');
    const origen = a[1] ? join(K, 'plantilla', 'estilos', `${a[1]}.src.html`) : join(K, 'plantilla', 'con-tu-video.src.html');
    if (!existsSync(origen)) throw new Error(`No hay plantilla «${a[1]}». Mira los nombres en referencia/estilos.md.`);
    if (existsSync(destino)) throw new Error(`Ya existe ${destino}.`);
    cpSync(origen, destino); console.log('listo -> ' + destino);
    const ejemplo = origen.replace(/\.src\.html$/, '.plano.json');
    if (a[1] && existsSync(ejemplo)) { cpSync(ejemplo, join(casa(a[0]), 'fuente', 'plano.ejemplo.json')); console.log('plano de ejemplo -> fuente/plano.ejemplo.json'); }
  }
  else throw new Error(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//   node scripts/video.mjs')).map(l => l.slice(3)).join('\n'));
} catch (e) { salir(e); }
