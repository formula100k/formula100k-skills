// comun.mjs — lo que comparten maqueta.mjs, montar.mjs y tomas-de-prueba.mjs:
// leer y revisar guion.json, medir las frases con la voz de la computadora, calcular la línea de tiempo,
// armar la pieza (plantilla + biblioteca + guion + núcleo) y renderizarla.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

export const AQUI = dirname(fileURLToPath(import.meta.url));
export const SKILL = join(AQUI, '..');
// Las skills de las que depende se buscan primero JUNTO a esta (sirve en ~/.claude/skills, en la carpeta
// del plugin y en cualquier otra instalación) y después en ~/.claude/skills.
const hermana = (skill, ...resto) => [join(SKILL, '..'), join(homedir(), '.claude', 'skills')].map(b => join(b, skill, ...resto)).find(existsSync) || join(SKILL, '..', skill, ...resto);
export const NUCLEO = hermana('animacion-dibujada-f100k', 'nucleo', 'nucleo.js');
export const RENDERIZAR = hermana('animacion-dibujada-f100k', 'scripts', 'renderizar.mjs');
export const FPS = 30;
export const TIPOS = ['titulo', 'contador', 'puntos', 'rejilla', 'ramas', 'escudo', 'barra', 'reloj', 'fichas', 'lista', 'mosaico', 'comentario', 'voz', 'pastillas', 'frase'];

export const sh = (c, a, o = {}) => (execFileSync(c, a, { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 1 << 28, ...o }) ?? '').toString();
export const dur = f => +sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim();
export const arg = (n, def) => { const a = process.argv.find(x => x === '--' + n || x.startsWith('--' + n + '=')); return a ? (a.includes('=') ? a.split('=').slice(1).join('=') : true) : def; };
export const carpetaDe = () => { const c = process.argv.slice(2).find(a => !a.startsWith('--')); if (!c) { console.error('Falta la carpeta de la pieza (la que tiene guion.json).'); process.exit(1); } return resolve(c); };
export const dos = n => String(n).padStart(2, '0');

for (const [f, que] of [[RENDERIZAR, 'animacion-dibujada-f100k'], [NUCLEO, 'animacion-dibujada-f100k']])
  if (!existsSync(f)) { console.error(`Falta la skill ${que} (se usa su motor de dibujo). Debe estar instalada junto a esta o en ~/.claude/skills. Instálala y vuelve a correr.`); process.exit(1); }

// ---------- el guion ----------
export function leerGuion(dir) {
  const ruta = join(dir, 'guion.json');
  if (!existsSync(ruta)) { console.error('No encontré ' + ruta + '. Copia plantilla/guion.json a tu carpeta y llénalo.'); process.exit(1); }
  let G; try { G = JSON.parse(readFileSync(ruta, 'utf8')); } catch (e) { console.error('guion.json está mal escrito: ' + e.message); process.exit(1); }
  const mal = [], avisos = [], nombres = new Set();
  if (!Array.isArray(G.bloques) || !G.bloques.length) mal.push('no hay bloques');
  (G.bloques || []).forEach((bl, b) => {
    if (!bl.nombre) mal.push(`el bloque ${b + 1} no tiene "nombre"`); if (nombres.has(bl.nombre)) mal.push(`dos bloques se llaman «${bl.nombre}»`); nombres.add(bl.nombre);
    if (bl.tema && !(G.temas || {})[bl.tema]) mal.push(`el bloque «${bl.nombre}» pide el tema «${bl.tema}», que no está en "temas"`);
    if (!Array.isArray(bl.frases) || !bl.frases.length) { mal.push(`el bloque «${bl.nombre}» no tiene frases`); return; }
    bl.frases.forEach((f, k) => { const p = f.panel, donde = `bloque «${bl.nombre}», frase ${k + 1}`;
      if (!f.txt) mal.push(`${donde}: falta "txt"`);
      if (!p) avisos.push(`${donde}: no tiene panel (el tablero queda vacío mientras se dice)`);
      else if (p.sigue) { if (k === 0) mal.push(`${donde}: la primera frase de un bloque no puede llevar "sigue"`); }
      else if (!TIPOS.includes(p.tipo)) mal.push(`${donde}: el panel «${p.tipo}» no existe. Hay: ${TIPOS.join(', ')}`);
      if (f.encuadre && !['tarjeta', 'completa', 'panel'].includes(f.encuadre)) mal.push(`${donde}: "encuadre" es tarjeta, completa o panel`);
      if (p && p.tipo === 'mosaico') for (const c of p.celdas || []) if (c.bloque && !(G.bloques.some(x => x.nombre === c.bloque))) mal.push(`${donde}: el mosaico nombra el bloque «${c.bloque}», que no existe`);
      if (f.txt && f.txt.split(/\s+/).length > 22) avisos.push(`${donde}: ${f.txt.split(/\s+/).length} palabras. Una frase larga deja el panel quieto: pártela si puedes`); });
  });
  if (mal.length) { console.error('guion.json tiene errores:\n  - ' + mal.join('\n  - ')); process.exit(1); }
  avisos.forEach(a => console.warn('⚠ ' + a));
  return G;
}
export const frasesDe = G => G.bloques.flatMap((bl, b) => bl.frases.map((f, k) => ({ ...f, b, k })));

// `say` a veces se queda colgado sin escribir nada: se le da un plazo y se reintenta.
export function decir(voz, ritmo, texto, aiff) {
  for (let n = 1; n <= 3; n++) {
    const r = spawnSync('say', ['-v', voz, '-r', String(ritmo), '-o', aiff, texto], { stdio: 'ignore', timeout: 25000, killSignal: 'SIGKILL' });
    if (r.status === 0 && existsSync(aiff)) return;
    console.warn(`⚠ la voz de la computadora no respondió (intento ${n} de 3): «${texto.slice(0, 40)}…»`);
  }
  console.error('`say` no respondió tres veces seguidas. Cierra y vuelve a abrir la terminal, o prueba otra voz en "vozGuia".'); process.exit(1);
}

// ---------- medir: cuánto tarda cada frase con la voz de la computadora (solo sirve para estimar) ----------
export function medir(dir, G) {
  const voz = join(dir, 'trabajo', 'voz-guia'); mkdirSync(voz, { recursive: true });
  const V = { nombre: 'Paulina', ritmo: 190, ...(G.vozGuia || {}) }, cta = G.palabraCta;
  return frasesDe(G).map((f, i) => {
    const aiff = join(voz, dos(i + 1) + '.aiff'), wav = join(voz, dos(i + 1) + '.wav');
    const dicho = cta ? f.txt.split(cta).join(cta.toLowerCase()) : f.txt;          // una palabra en MAYÚSCULAS se deletrea
    decir(V.nombre, V.ritmo, dicho, aiff);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', aiff, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '44100', wav]);
    execFileSync('rm', [aiff]);
    return { wav, medida: +dur(wav).toFixed(2) };
  });
}

// ---------- la línea de tiempo ----------
// d[i] = segundos de cada frase. Devuelve dónde empieza cada una, los bloques y los cambios de encuadre.
export function lineaDeTiempo(G, d) {
  const R = { pausa: .3, pausaBloque: .5, quietoFinal: 1.4, transicion: .28, ...(G.ritmo || {}) };
  const F = frasesDe(G), cuadro = x => Math.round(x * FPS) / FPS, S = []; let a = 0;
  F.forEach((f, i) => { S.push(cuadro(a)); a += d[i] + (F[i + 1] && F[i + 1].b !== f.b ? R.pausaBloque : R.pausa); });
  const finFrases = cuadro(a - R.pausa), TOTAL = +(finFrases + R.quietoFinal).toFixed(3);
  S.push(finFrases);
  const nB = G.bloques.length, INI_B = [], FIN_B = [];
  for (let b = 0; b < nB; b++) { const is = F.map((f, i) => f.b === b ? i : -1).filter(i => i >= 0); INI_B[b] = S[is[0]]; FIN_B[b] = b === nB - 1 ? TOTAL : S[is[is.length - 1] + 1]; }
  // tramos de un encuadre: sube en la pausa anterior, baja en la pausa siguiente; al empezar o terminar un bloque, corta seco
  const tramos = cual => { const segs = []; let v = 0;
    for (let b = 0; b < nB; b++) { const is = F.map((f, i) => f.b === b ? i : -1).filter(i => i >= 0);
      const es = i => (F[i].encuadre || 'tarjeta') === cual, v0 = es(is[0]) ? 1 : 0;
      segs.push({ a: INI_B[b], b: INI_B[b], v0: v, v1: v0 }); v = v0;
      for (const i of is) { const sig = is.includes(i + 1) ? i + 1 : -1;
        if (sig < 0 || es(i) === es(sig)) continue;
        if (es(sig)) segs.push({ a: +(S[sig] - R.transicion).toFixed(3), b: S[sig], v0: 0, v1: 1 }); else segs.push({ a: +(S[i] + d[i]).toFixed(3), b: +Math.min(S[sig], S[i] + d[i] + R.transicion).toFixed(3), v0: 1, v1: 0 });
        v = es(sig) ? 1 : 0; } }
    return segs; };
  return { S, D: d.map(x => +x.toFixed(3)), B: F.map(f => f.b), INI_B, FIN_B, TOTAL, QUIETO: R.quietoFinal, segE: tramos('completa'), segP: tramos('panel'), ritmo: R };
}
// los tramos de un bloque, con el tiempo contado desde que empieza ese bloque
export function tramosDeBloque(TL, segs, b) {
  const a0 = TL.INI_B[b], z0 = TL.FIN_B[b]; let inicial = 0; const out = [];
  for (const s of segs) { if (s.a === s.b) { if (s.a <= a0 + 1e-6) inicial = s.v1; continue; } if (s.a >= a0 - 1e-6 && s.a < z0) out.push({ a: +(s.a - a0).toFixed(3), b: +(s.b - a0).toFixed(3), v0: s.v0, v1: s.v1 }); }
  return { inicial, segs: out };
}

// ---------- armar y renderizar ----------
// Escribe <dir>/trabajo/<nombre>.html con todo adentro. modo = 'capa=todo', 'capa=fondo&bloque=2', …
export function armar(dir, G, TL, modo, nombre = 'pieza') {
  const T = join(dir, 'trabajo'); mkdirSync(T, { recursive: true });
  const src = join(T, nombre + '.src.html'), out = join(T, nombre + '.html');
  const datos = `const GUION = ${JSON.stringify(G)};\nconst TL = ${JSON.stringify(TL)};\nwindow.MODO = ${JSON.stringify(modo)};`;
  writeFileSync(src, readFileSync(join(SKILL, 'plantilla', 'pieza.src.html'), 'utf8')
    .replace('/*__DATOS__*/', () => datos)
    .replace('<script src="paneles.js"></script>', () => '<script>\n' + readFileSync(join(SKILL, 'plantilla', 'paneles.js'), 'utf8') + '\n</script>'));
  // mete el núcleo de dibujo (animacion-dibujada-f100k) dentro de la pieza, para que el HTML no dependa de nada
  const conNucleo = readFileSync(src, 'utf8').replace('<script src="../nucleo/nucleo.js"></script>', () => '<script>\n' + readFileSync(NUCLEO, 'utf8') + '\n</script>');
  if (conNucleo.includes('../nucleo/nucleo.js')) { console.error('No pude meter el núcleo de dibujo en la pieza.'); process.exit(1); }
  writeFileSync(out, conNucleo);
  execFileSync('rm', [src]);
  return out;
}
export function renderizar(html, salida, extra = []) {
  const r = spawnSync('node', [RENDERIZAR, html, salida, '--callado', ...extra], { stdio: ['ignore', 'ignore', 'pipe'] }), err = (r.stderr || '').toString();
  const ruido = /willReadFrequently|^errores de la página: \[\s*$|^\]\s*$/;        // un aviso de Chrome que no afecta el resultado
  const resto = err.split('\n').filter(l => l.trim() && !ruido.test(l)).join('\n'); if (resto) console.error(resto);
  if (r.status !== 0) { console.error('No se pudo renderizar ' + html); process.exit(1); }
}
export function hojaDeContacto(mp4, jpg, cada = 1.5) {
  const n = Math.max(1, Math.floor(dur(mp4) / cada)), cols = Math.min(9, n);
  sh('ffmpeg', ['-v', 'error', '-y', '-i', mp4, '-vf', `fps=1/${cada},scale=216:384,tile=${cols}x${Math.ceil(n / cols)}`, '-frames:v', '1', '-q:v', '3', jpg]);
}
// cuadros a tamaño real de cada cambio de encuadre: justo antes, a la mitad y ya cambiado
export function cuadrosDeTransicion(mp4, TL, carpeta) {
  mkdirSync(carpeta, { recursive: true }); const hechos = [], total = dur(mp4);
  [...TL.segE.map(s => ({ ...s, q: 'completa' })), ...TL.segP.map(s => ({ ...s, q: 'panel' }))].filter(s => s.v0 !== s.v1).sort((x, y) => x.a - y.a).forEach((s, n) => {
    const momentos = s.a === s.b ? [['corte', s.a + .1], ['medio', s.a + .7]] : [['antes', s.a - .1], ['mitad', (s.a + s.b) / 2], ['despues', s.b + .12]];
    for (const [et, t] of momentos) { if (t < 0 || t > total - .05) continue; const f = join(carpeta, `transicion-${dos(n + 1)}-${s.q}-${s.v1 ? 'entra' : 'sale'}-${et}.jpg`);
      sh('ffmpeg', ['-v', 'error', '-y', '-ss', t.toFixed(3), '-i', mp4, '-frames:v', '1', '-q:v', '2', f]); hechos.push(f); } });
  return hechos;
}
