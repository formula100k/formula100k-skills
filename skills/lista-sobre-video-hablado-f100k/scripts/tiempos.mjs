#!/usr/bin/env node
// Saca de tu toma los segundos reales de cada paso y (con --escribir) los pone en config.js.
//   node tiempos.mjs <toma.mp4|.mov|.wav> [--config=config.js] [--escribir] [--subs-de-voz]
//                    [--json=transcripcion.json] [--ruido=-35]
// Qué hace: transcribe la toma con Whisper (palabra por palabra), busca dónde dices el número de cada paso
// («uno», «dos»… o «1», «2», o «primero»; si no lo dices, el nombre del paso), el «Comenta PALABRA» del cierre
// y el final de la voz. Imprime una tabla. No toca nada si no pones --escribir.
//   --escribir      actualiza en config.js: `t` de cada paso, `sale`, `acercar.t`, `cta.t`, `duracion`,
//                   y reacomoda `pulsos` y `subs` si existen. Deja una copia en config.antes.js.
//   --subs-de-voz   en vez de reacomodar tus subtítulos, los reescribe con lo que se oyó (trozos de 2 o 3 palabras)
//   --json=…        usa una transcripción ya hecha (el JSON de mlx_whisper) y no vuelve a transcribir
//   --ruido=-35     umbral de silencio en dB. Súbelo (por ejemplo -28) si grabaste con ruido de fondo
// Necesita ffmpeg y uvx (https://docs.astral.sh/uv/). La primera vez descarga el modelo de Whisper.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';

const arg = n => { const a = process.argv.find(x => x === '--' + n || x.startsWith('--' + n + '=')); return a ? (a.includes('=') ? a.split('=').slice(1).join('=') : true) : null; };
const libres = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!libres[0]) { console.log('Uso: node tiempos.mjs <toma> [--config=config.js] [--escribir] [--subs-de-voz] [--json=transcripcion.json] [--ruido=-35]'); process.exit(1); }
const toma = resolve(libres[0]), rutaConfig = resolve(arg('config') && arg('config') !== true ? arg('config') : 'config.js');
for (const [f, que] of [[toma, 'la toma'], [rutaConfig, 'config.js (pásalo con --config=ruta/config.js)']]) if (!existsSync(f)) { console.error(`No encontré ${que}: ${f}`); process.exit(1); }
const trabajo = join(dirname(rutaConfig), 'tiempos'); mkdirSync(trabajo, { recursive: true });
const r2 = x => Math.round(x * 100) / 100;
const correr = (cmd, args, que) => { const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28 }); if (r.error || r.status !== 0) { console.error(`Falló ${que}.\n${r.error ? r.error.message : (r.stderr || '').split('\n').slice(-12).join('\n')}`); process.exit(1); } return r; };

// ---------- config ----------
const leerConfig = src => { const w = {}; new Function('window', src)(w); return w.CONFIG; };
let fuente = readFileSync(rutaConfig, 'utf8');
const C = leerConfig(fuente), P = C.pasos || [], A = Object.assign({ cadaMini: 1 }, C.acomodo || {});
if (!P.length) { console.error('config.js no tiene pasos. Escribe primero los pasos (nombre y miniaturas), aunque sea con t: 0.'); process.exit(1); }

// ---------- audio y transcripción ----------
const wav = join(trabajo, 'toma.wav');
correr('ffmpeg', ['-v', 'error', '-y', '-i', toma, '-vn', '-ac', '1', '-ar', '16000', wav], 'la extracción del audio (¿la toma tiene sonido?)');
const durToma = parseFloat(correr('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', toma], 'ffprobe').stdout);
let rutaJson = arg('json') && arg('json') !== true ? resolve(arg('json')) : null;
if (!rutaJson) {
  console.log('Transcribiendo con Whisper (la primera vez tarda: descarga el modelo)…');
  const r = spawnSync('uvx', ['--from', 'mlx-whisper', 'mlx_whisper', wav, '--model', 'mlx-community/whisper-large-v3-turbo', '--language', 'es', '--word-timestamps', 'True', '--output-format', 'json', '--output-dir', trabajo], { encoding: 'utf8', maxBuffer: 1 << 28 });
  rutaJson = join(trabajo, 'toma.json');
  if (r.error || r.status !== 0 || !existsSync(rutaJson)) {
    console.error('No pude transcribir.\n' + (r.error ? `No encontré uvx: instálalo con  curl -LsSf https://astral.sh/uv/install.sh | sh` : (r.stderr || '').split('\n').slice(-10).join('\n')) +
      '\nmlx_whisper solo corre en Mac con chip Apple. En otro equipo transcribe con tu Whisper (con tiempos por palabra, salida JSON) y pásalo con --json=archivo.json');
    process.exit(1);
  }
}
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');
const W = [];
for (const s of JSON.parse(readFileSync(rutaJson, 'utf8')).segments || []) for (const w of s.words || []) { const p = norm(w.word); if (p) W.push({ crudo: w.word.trim(), p, a: w.start, z: w.end }); }
if (!W.length) { console.error('La transcripción salió vacía o sin tiempos por palabra.'); process.exit(1); }

// Whisper suele pegar una palabra al inicio del silencio que la precede (sobre todo la primera, al segundo 0):
// si una palabra «empieza» dentro de un silencio (o el silencio arranca apenas empezada), su inicio real es donde el silencio termina.
const sil = [...(spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', `silencedetect=noise=${arg('ruido') && arg('ruido') !== true ? arg('ruido') : -35}dB:d=0.15`, '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '').matchAll(/silence_start: (-?[\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map(m => [Math.max(0, +m[1]), +m[2]]);
let corregidas = 0;
for (const w of W) { const s = sil.find(([a, z]) => a <= w.a + .3 && z > w.a + .08 && z < w.z - .04); if (s) { w.a = r2(s[1]); corregidas++; } }
const finVoz = W[W.length - 1].z;

// ---------- buscar cada paso ----------
const CARD = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'];
const ORD = ['', ['primero', 'primer', 'primera'], ['segundo', 'segunda'], ['tercero', 'tercer', 'tercera'], ['cuarto', 'cuarta'], ['quinto', 'quinta'], ['sexto', 'sexta'], ['septimo', 'septima'], ['octavo', 'octava'], ['noveno', 'novena'], ['decimo', 'decima'], [], []];
const esNumero = (p, k) => p === String(k) || p === CARD[k] || (ORD[k] || []).includes(p) || p === k + 'o' || p === k + 'a';
const cierraFrase = w => /[.!?:…]$/.test(w.crudo);
const palabrasNombre = n => String(n || '').split(/\s+/).map(norm).filter(x => x.length > 2 && !CARD.includes(x) && !/^\d+$/.test(x));
const cand = P.map((p, i) => {
  const k = i + 1, nom = palabrasNombre(p.nombre), lista = [];
  W.forEach((w, x) => {
    const inicio = x === 0 || cierraFrase(W[x - 1]) || w.a - W[x - 1].z >= .3;
    if (esNumero(w.p, k)) {
      let pts = 1; const porque = ['número'];
      if (nom.length && W.slice(x + 1, x + 4).some(v => nom.includes(v.p))) { pts += 4; porque.push('nombre'); }
      let t = w.a;
      if (x > 0 && ['paso', 'punto', 'numero', 'etapa', 'clave'].includes(W[x - 1].p)) { pts += 2; porque.push('«' + W[x - 1].p + '»'); if (w.a - W[x - 1].a < 1) t = W[x - 1].a; }   // «paso uno»: la fila entra con «paso»
      if (inicio) { pts += 2; porque.push('abre frase'); }
      if (/[,.:;]$/.test(w.crudo)) pts += 1;
      lista.push({ x, t, pts, porque: porque.join(' + '), num: true });
    } else if (nom[0] === w.p) lista.push({ x, t: w.a, pts: inicio ? 2 : 1.5, porque: 'solo el nombre', num: false });
  });
  return lista;
});
// Se elige una mención por paso, en orden creciente de tiempo, que sume más puntos (así «te faltan tres cosas»
// en el gancho no le gana a «Tres, menú»). Un paso sin mención cuesta 3 puntos.
const mejor = cand.map(l => l.map(() => ({ pts: -Infinity, prev: null })));
for (let k = 0; k < P.length; k++) cand[k].forEach((c, ci) => {
  let b = { pts: c.pts - 3 * k, prev: null };
  for (let j = 0; j < k; j++) cand[j].forEach((d, di) => { if (d.t < c.t - .3 && mejor[j][di].pts + c.pts - 3 * (k - j - 1) > b.pts) b = { pts: mejor[j][di].pts + c.pts - 3 * (k - j - 1), prev: [j, di] }; });
  mejor[k][ci] = b;
});
let fin = null, finPts = -Infinity;
for (let k = 0; k < P.length; k++) cand[k].forEach((c, ci) => { const s = mejor[k][ci].pts - 3 * (P.length - 1 - k); if (s > finPts) { finPts = s; fin = [k, ci]; } });
const elegido = P.map(() => null);
for (let n = fin; n; n = mejor[n[0]][n[1]].prev) elegido[n[0]] = cand[n[0]][n[1]];
const contexto = (x, antes = 1, despues = 4) => W.slice(Math.max(0, x - antes), x + despues).map(w => w.crudo).join(' ');

// ---------- cierre ----------
const ultimoT = Math.max(0, ...elegido.filter(Boolean).map(e => e.t));
const palabra = (C.cta && C.cta.palabra ? String(C.cta.palabra).split(/\s+/).map(norm).filter(Boolean) : [])[0];
let cta = null, ctaComo = '';
if (C.cta) {
  const tras = W.map((w, x) => ({ w, x })).filter(o => o.w.a > ultimoT + .5);
  const esComenta = w => /^(coment|escrib|pon|deja|mand)/.test(w.p);
  const conVerbo = palabra && tras.filter(o => o.w.p === palabra && W.slice(Math.max(0, o.x - 3), o.x).some(esComenta)).pop();
  if (conVerbo) { let x = conVerbo.x - 1; while (x > conVerbo.x - 3 && !esComenta(W[x])) x--; cta = W[x].a; ctaComo = '«' + contexto(x, 0, conVerbo.x - x + 1) + '»'; }
  else if (palabra && tras.some(o => o.w.p === palabra)) { const o = tras.filter(o => o.w.p === palabra).pop(); cta = Math.max(0, o.w.a - .3); ctaComo = `la palabra sola: «${contexto(o.x)}»`; }
  else if (tras.some(o => esComenta(o.w))) { const o = tras.filter(o => esComenta(o.w)).pop(); cta = o.w.a; ctaComo = `no oí «${C.cta.palabra}»; usé «${contexto(o.x, 0)}»`; }
}
const avisos = [];
let sale = null, acercarT = null, acercarSeg = 1;
const iUlt = elegido.map(Boolean).lastIndexOf(true);
const asentado = iUlt < 0 ? 0 : elegido[iUlt].t + .25 + Math.max(0, ((P[iUlt].minis || []).length - 1)) * A.cadaMini + 1;   // la última miniatura ya está en su fila
if (cta != null) {
  sale = cta - 1.2;
  if (sale < asentado) { sale = Math.min(asentado, cta - .4); if (asentado > cta - .4) avisos.push('El último paso queda muy pegado al cierre: sus miniaturas no terminan de entrar. Deja un respiro antes de «Comenta…» o ponle menos miniaturas.'); }
  acercarT = sale + .2; acercarSeg = Math.max(.5, Math.min(1, cta - acercarT));
} else if (C.cta) avisos.push(`No encontré el cierre («${(C.cta.antes || 'Comenta')} ${C.cta.palabra || ''}»). Pon a mano sale, acercar.t y cta.t.`);
const largoPalabra = C.cta ? [...String(C.cta.palabra || '')].length : 0;
const necesita = cta != null ? cta + .55 + largoPalabra * .13 + .5 + 1.2 : finVoz + .8;
const duracion = Math.min(durToma, Math.max(finVoz + .8, necesita));
if (cta != null && durToma < necesita - .05) avisos.push(`La toma termina ${(necesita - durToma).toFixed(1)} s antes de que la caja de comentario se lea completa. Al grabar, quédate 2 segundos mirando a cámara después de la última palabra.`);
elegido.forEach((e, i) => { if (!e) avisos.push(`NO ENCONTRÉ el paso ${i + 1} («${P[i].nombre || ''}»). Su t queda como estaba: ponlo a mano.`); else if (e.pts < 3) avisos.push(`Paso ${i + 1}: mención débil (${e.porque}). Confírmala oyendo el segundo ${e.t.toFixed(2)}.`); });
if (!sil.length) avisos.push('No detecté ningún silencio (¿mucho ruido de fondo?). Prueba --ruido=-28; sin eso, la primera palabra puede quedar pegada al segundo 0.');

// ---------- tabla ----------
console.log(`\nToma: ${basename(toma)} · ${durToma.toFixed(2)} s · ${W.length} palabras · ${corregidas} inicio(s) corregido(s) con los silencios`);
console.log('Oído: ' + W.map(w => w.crudo).join(' ') + '\n');
const fila = (a, b, c, d) => console.log(`  ${String(a).padEnd(22)} ${String(b).padStart(7)}  ${String(c).padStart(7)}   ${d}`);
fila('QUÉ', 'ANTES', 'AHORA', 'DÓNDE LO OÍ');
P.forEach((p, i) => { const e = elegido[i]; fila(`${i + 1}. ${p.nombre || ''}`.slice(0, 22), p.t != null ? p.t : '—', e ? e.t.toFixed(2) : '¿?', e ? `«${contexto(e.x)}» (${e.porque})` : 'no lo encontré'); });
if (C.cta) { fila('la lista se va (sale)', C.sale != null ? C.sale : '—', sale != null ? sale.toFixed(2) : '¿?', '1,2 s antes de la caja'); fila('la toma se acerca', C.acercar && C.acercar.t != null ? C.acercar.t : '—', acercarT != null ? acercarT.toFixed(2) : '¿?', `dura ${acercarSeg.toFixed(1)} s`); fila('caja de comentario', C.cta.t != null ? C.cta.t : '—', cta != null ? cta.toFixed(2) : '¿?', ctaComo); }
fila('duración', C.duracion != null ? C.duracion : '—', duracion.toFixed(2), `la voz termina en ${finVoz.toFixed(2)}`);
const otras = []; cand.forEach((l, i) => l.forEach(c => { if (c.num && c !== elegido[i]) otras.push({ t: c.t, paso: i + 1, x: c.x }); }));
if (otras.length) { console.log('\nOtras veces que nombras un número (por si quieres que ese número lata: van en `pulsos`):'); otras.sort((a, b) => a.t - b.t).forEach(o => console.log(`  { t: ${o.t.toFixed(2)}, paso: ${o.paso} },   // «${contexto(o.x, 2, 3)}»`)); }

// ---------- escribir ----------
// Lectura mínima del archivo como texto, para cambiar solo los números y conservar comentarios y formato.
function saltar(s, i) {                       // si en i empieza cadena o comentario, devuelve dónde termina
  const c = s[i];
  if (c === '"' || c === "'" || c === '`') { let j = i + 1; while (j < s.length && s[j] !== c) j += s[j] === '\\' ? 2 : 1; return j + 1; }
  if (c === '/' && s[i + 1] === '/') { const j = s.indexOf('\n', i); return j < 0 ? s.length : j; }
  if (c === '/' && s[i + 1] === '*') { const j = s.indexOf('*/', i); return j < 0 ? s.length : j + 2; }
  return i;
}
function cierre(s, i) { let n = 0; for (let j = i; j < s.length; j++) { const k = saltar(s, j); if (k !== j) { j = k - 1; continue; } if ('{['.includes(s[j])) n++; else if ('}]'.includes(s[j]) && --n === 0) return j; } return -1; }
function clave(s, ini, fin, nombre) {         // busca `nombre:` en el primer nivel del bloque [ini, fin] y devuelve el tramo de su valor
  let n = 0;
  for (let j = ini + 1; j < fin; j++) {
    const k = saltar(s, j); if (k !== j) { j = k - 1; continue; }
    if ('{['.includes(s[j])) n++; else if ('}]'.includes(s[j])) n--;
    else if (n === 0 && /[\s,{]/.test(s[j - 1]) && s.startsWith(nombre, j) && /^\s*:/.test(s.slice(j + nombre.length))) {
      let a = s.indexOf(':', j) + 1; while (/\s/.test(s[a])) a++;
      let z; if ('{['.includes(s[a])) z = cierre(s, a) + 1; else { z = a; while (z < fin && !/[,}\]\n]/.test(s[z])) { const q = saltar(s, z); z = q !== z ? q : z + 1; } while (/\s/.test(s[z - 1])) z--; }
      return [a, z];
    }
  }
  return null;
}
const raiz = s => { const i = s.indexOf('{', s.indexOf('CONFIG')); return [i, cierre(s, i)]; };
function poner(s, ruta, valor) {              // ruta: ['cta','t'] · devuelve el texto nuevo o null si la clave no existe
  let [a, z] = raiz(s), tramo;
  for (const k of ruta) { tramo = clave(s, a, z, k); if (!tramo) return null; [a, z] = [tramo[0], tramo[1] - 1]; }
  return s.slice(0, tramo[0]) + valor + s.slice(tramo[1]);
}
const objetos = (s, a, z) => { const l = []; for (let j = a + 1; j < z; j++) { const k = saltar(s, j); if (k !== j) { j = k - 1; continue; } if (s[j] === '{') { const c = cierre(s, j); l.push([j, c]); j = c; } } return l; };

if (arg('escribir')) {
  let s = fuente; const hecho = [], num = x => String(r2(x));
  // pasos (de atrás hacia adelante para no mover los índices)
  const tp = clave(s, ...raiz(s), 'pasos'), obs = objetos(s, tp[0], tp[1] - 1);
  for (let i = obs.length - 1; i >= 0; i--) {
    if (!elegido[i]) continue;
    const [a, z] = obs[i], t = clave(s, a, z, 't');
    s = t ? s.slice(0, t[0]) + num(elegido[i].t) + s.slice(t[1]) : s.slice(0, a + 1) + ` t: ${num(elegido[i].t)},` + s.slice(a + 1);
  }
  hecho.push(`${elegido.filter(Boolean).length} de ${P.length} pasos`);
  const pon = (ruta, v, nombre) => { if (v == null) return; const n = poner(s, ruta, num(v)); if (n) { s = n; hecho.push(nombre); } else avisos.push(`config.js no tiene \`${ruta.join('.')}\`: agrégalo a mano con ${num(v)}${ruta[0] === 'acercar' ? ' (o déjalo así: sin ese campo, la toma se acerca 0,2 s después de `sale`)' : ''}.`); };
  pon(['sale'], sale, 'sale'); pon(['cta', 't'], cta, 'cta.t'); pon(['duracion'], duracion, 'duracion');
  if (acercarT != null && C.acercar && typeof C.acercar === 'object') { pon(['acercar', 't'], acercarT, 'acercar.t'); if (C.acercar.segundos != null) pon(['acercar', 'segundos'], acercarSeg, 'acercar.segundos'); }

  // Tiempos viejos → nuevos: entre dos pasos, todo lo demás (pulsos y subtítulos) se estira en proporción.
  const anclas = [[0, 0]]; P.forEach((p, i) => { if (elegido[i] && typeof p.t === 'number' && p.t > anclas[anclas.length - 1][0]) anclas.push([p.t, elegido[i].t]); });
  if (C.sale != null && sale != null && C.sale > anclas[anclas.length - 1][0]) anclas.push([C.sale, sale]);
  if (C.duracion > anclas[anclas.length - 1][0]) anclas.push([C.duracion, duracion]);
  const sirveMapa = anclas.length >= P.length + 1 && anclas.every((a, i) => !i || a[1] > anclas[i - 1][1]);
  const mapa = t => { for (let i = 1; i < anclas.length; i++) if (t <= anclas[i][0]) { const [a, b] = [anclas[i - 1], anclas[i]]; return b[1] - (b[0] - t) * (b[1] - a[1]) / (b[0] - a[0]); } return t + anclas[anclas.length - 1][1] - anclas[anclas.length - 1][0]; };
  const igual = (a, b) => a === b || (CARD.indexOf(a) > 0 && String(CARD.indexOf(a)) === b) || (CARD.indexOf(b) > 0 && String(CARD.indexOf(b)) === a);
  const cerca = (t, prueba, radio) => W.filter(w => Math.abs(w.a - t) <= radio && prueba(w)).sort((a, b) => Math.abs(a.a - t) - Math.abs(b.a - t))[0];

  if ((C.pulsos || []).length) {
    if (!sirveMapa) avisos.push('No reacomodé `pulsos`: los t anteriores de los pasos no servían de guía. Usa las sugerencias de arriba.');
    else {
      const nuevos = C.pulsos.map(p => { const t = mapa(p.t), w = cerca(t, w => esNumero(w.p, p.paso), 1.5); return { ...p, t: r2(w ? w.a : t), oido: !!w }; });
      const tr = clave(s, ...raiz(s), 'pulsos');
      s = s.slice(0, tr[0]) + '[\n' + nuevos.map(p => `    { t: ${p.t}, paso: ${p.paso} },${p.oido ? '' : '   // no oí ese número cerca: revisa'}`).join('\n') + '\n  ]' + s.slice(tr[1]);
      hecho.push(`${nuevos.length} pulso(s)`); if (nuevos.some(p => !p.oido)) avisos.push('Algún pulso quedó por proporción, sin oír su número: revísalo.');
    }
  }
  const tope = sale != null ? sale : duracion;
  if (arg('subs-de-voz')) {
    const subs = []; let g = [];
    const cerrar = () => { if (g.length) subs.push({ t: r2(g[0].a), texto: g.map(w => w.crudo).join(' ').replace(/[.,;:]+$/, '').replace(/^[A-ZÁÉÍÓÚÑ](?=[a-záéíóúñ])/, m => m.toLowerCase()), fin: g[g.length - 1].z }); g = []; };
    // trozos de hasta 3 palabras; se cortan en cada pausa o signo, salvo un número suelto («1.»), que se queda con lo que sigue
    const suelto = () => g.length === 1 && /^\d+$/.test(g[0].p);
    W.filter(w => w.a < tope - .2).forEach(w => { if (g.length && ((w.a - g[g.length - 1].z > .35 && !(suelto() && w.a - g[0].z < .9)) || g.length >= 3 || g.map(x => x.crudo).join(' ').length + w.crudo.length > 16)) cerrar(); g.push(w); if (/[.!?,:;…]$/.test(w.crudo) && !suelto()) cerrar(); });
    if (g.length && tope - g[g.length - 1].z < .8 && W.some(w => w.a >= tope - .2)) g = [];      // frase cortada por la salida de la lista: mejor sin subtítulo
    cerrar();
    subs.forEach((b, i) => { const sig = subs[i + 1]; if (!sig || sig.t - b.fin > .8) b.hasta = r2(Math.min(b.fin + .3, sig ? sig.t : tope)); });
    const tr = clave(s, ...raiz(s), 'subs'), q = t => JSON.stringify(t).replace(/^"|"$/g, "'").replace(/\\"/g, '"');
    const txt = '[\n' + subs.map(b => `    { t: ${b.t}, texto: ${b.texto.includes("'") ? JSON.stringify(b.texto) : q(b.texto)}${b.hasta != null ? `, hasta: ${b.hasta}` : ''} },`).join('\n') + '\n  ]';
    if (tr) { s = s.slice(0, tr[0]) + txt + s.slice(tr[1]); hecho.push(`${subs.length} subtítulos escritos con lo que se oyó (léelos: Whisper escribe números con cifras y a veces oye mal)`); }
    else avisos.push('config.js no tiene `subs`: agrega `subs: [],` y vuelve a correr.');
  } else if ((C.subs || []).length) {
    if (!sirveMapa) avisos.push('No reacomodé `subs`: los t anteriores de los pasos no servían de guía. Corre de nuevo con --subs-de-voz o deja subs: [].');
    else {
      let ant = -1, oidos = 0;
      const nuevos = C.subs.map(b => { const p0 = norm(String(b.texto).split(/\s+/)[0]), t = mapa(b.t), w = cerca(t, w => igual(w.p, p0) && w.a > ant + .15, .7); let n = r2(w ? w.a : t); if (w) oidos++; if (n <= ant) n = r2(ant + .15); ant = n; return { ...b, t: n }; });
      nuevos.forEach((b, i) => { if (b.hasta != null) b.hasta = r2(Math.min(Math.max(mapa(C.subs[i].hasta), b.t + .3), nuevos[i + 1] ? nuevos[i + 1].t : tope)); });
      const tr = clave(s, ...raiz(s), 'subs');
      s = s.slice(0, tr[0]) + '[\n' + nuevos.map(b => `    { t: ${b.t}, texto: ${JSON.stringify(b.texto)}${b.hasta != null ? `, hasta: ${b.hasta}` : ''} },`).join('\n') + '\n  ]' + s.slice(tr[1]);
      hecho.push(`${nuevos.length} subtítulos reacomodados (${oidos} enganchados a su palabra, el resto por proporción)`);
    }
  }
  P.forEach((p, i) => { if ((p.minis || []).some(m => m.t != null)) avisos.push(`El paso ${i + 1} tiene miniaturas con t propio: no los toqué, revísalos.`); });
  try { leerConfig(s); } catch (e) { console.error('\nNo escribí nada: el archivo resultante no se podía leer (' + e.message + '). Pon los tiempos a mano con la tabla.'); process.exit(1); }
  copyFileSync(rutaConfig, join(dirname(rutaConfig), 'config.antes.js')); writeFileSync(rutaConfig, s);
  console.log(`\nEscrito en ${basename(rutaConfig)}: ${hecho.join(' · ')}. Copia anterior: config.antes.js`);
} else console.log('\nNo escribí nada. Si la tabla está bien, corre lo mismo con --escribir.');
if (avisos.length) { console.log('\nRevisa:'); avisos.forEach(a => console.log('  ⚠ ' + a)); }
