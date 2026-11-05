#!/usr/bin/env node
// broll.mjs — tu biblioteca de B-roll: tus clips y fotos, descritos una vez y buscables por tema. Igual en Mac y en Windows.
// Vive en ~/Documents/mi-contenido/b-roll/ (biblioteca.json + clips/ + hojas/).
// Uso:
//   node scripts/broll.mjs agregar <archivo o carpeta> …   copia tus clips y fotos a la biblioteca y saca una hoja de cuadros de cada uno
//   node scripts/broll.mjs pendientes                      los que aún no tienen descripción, con la ruta de su hoja de cuadros
//   node scripts/broll.mjs describir <id> "qué se ve" [etiqueta,etiqueta]   guarda lo que se ve (míralo en su hoja antes)
//   node scripts/broll.mjs buscar "<de qué habla la frase>" [cuántos=5]    los que mejor van con esa frase
//   node scripts/broll.mjs usar <proyecto> <id>            lo copia a <proyecto>/fuente/broll/ y te da la línea para plano.json
//   node scripts/broll.mjs lista                           toda la biblioteca
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { MI_LOOK_DIR, casa, correr, salir } from './comun.mjs';

const B = join(MI_LOOK_DIR, '..', 'b-roll'), INDICE = join(B, 'biblioteca.json');
const VIDEO = /\.(mp4|mov|m4v|webm|mkv)$/i, FOTO = /\.(jpe?g|png|webp|heic)$/i;
const leer = () => existsSync(INDICE) ? JSON.parse(readFileSync(INDICE, 'utf8')) : [];
const guardar = l => { mkdirSync(B, { recursive: true }); writeFileSync(INDICE, JSON.stringify(l, null, 2)); };
const sinTildes = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const VACIAS = new Set('el la los las un una unos unas de del al a en y o que es por para con sin se lo le les mi mis tu tus su sus me te nos como mas pero ya muy esto esta este eso esa ese hay fue ser son tiene yo tu'.split(' '));
const palabras = s => sinTildes(s).split(/[^a-z0-9ñ]+/).filter(w => w.length > 2 && !VACIAS.has(w));
const raiz = w => w.replace(/(es|s)$/, '').slice(0, 6);
// misma raíz = punto entero; mismas 4 primeras letras («pensé» y «pensando») = medio punto
const parecido = (w, lista) => lista.includes(w) ? 1 : lista.some(x => x.slice(0, 4) === w.slice(0, 4)) ? .5 : 0;
const medir = f => {
  const r = correr('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:stream_side_data=rotation:format=duration', '-of', 'json', f]);
  const j = JSON.parse(r), s = j.streams?.[0] || {}, giro = Math.abs(+(s.side_data_list || []).find(d => 'rotation' in d)?.rotation || 0) % 180 === 90;
  // el iPhone guarda muchos clips acostados con una marca de giro: el tamaño que cuenta es el que se ve
  return { w: giro ? s.height : s.width, h: giro ? s.width : s.height, dur: FOTO.test(f) ? 0 : +(+j.format?.duration || 0).toFixed(2) };
};
const fila = b => `${b.id}  ${b.tipo === 'foto' ? 'foto' : b.dur.toFixed(1) + ' s'}  ${b.w}x${b.h}  ${b.descripcion || '(sin describir)'}${b.etiquetas?.length ? '  [' + b.etiquetas.join(', ') + ']' : ''}`;

function agregar(rutas) {
  const lista = leer(), archivos = rutas.map(casa).flatMap(r => statSync(r).isDirectory() ? readdirSync(r).map(f => join(r, f)) : [r]).filter(f => VIDEO.test(f) || FOTO.test(f));
  if (!archivos.length) throw new Error('No encontré videos ni fotos ahí (mp4, mov, m4v, webm, jpg, png, webp, heic).');
  mkdirSync(join(B, 'clips'), { recursive: true }); mkdirSync(join(B, 'hojas'), { recursive: true });
  let n = lista.reduce((m, b) => Math.max(m, +b.id.slice(1)), 0), nuevos = 0;
  for (const f of archivos) {
    const tam = statSync(f).size;
    if (lista.some(b => b.origen === basename(f) && b.bytes === tam)) { console.log(`ya estaba: ${basename(f)}`); continue; }
    const id = 'b' + String(++n).padStart(3, '0'), destino = join(B, 'clips', id + extname(f).toLowerCase());
    try {
      copyFileSync(f, destino);
      const m = medir(destino), hoja = join(B, 'hojas', id + '.jpg'), tipo = FOTO.test(f) ? 'foto' : 'video';
      if (tipo === 'foto') correr('ffmpeg', ['-loglevel', 'error', '-y', '-i', destino, '-vf', 'scale=640:-2', '-frames:v', '1', hoja]);
      else {   // 3 cuadros (principio, medio y final) en una tira
        const d = mkdtempSync(join(tmpdir(), 'broll-'));
        [.12, .5, .88].forEach((p, i) => correr('ffmpeg', ['-loglevel', 'error', '-y', '-ss', (m.dur * p).toFixed(2), '-i', destino, '-frames:v', '1', '-vf', 'scale=-2:360', join(d, `${i}.jpg`)]));
        correr('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(d, '0.jpg'), '-i', join(d, '1.jpg'), '-i', join(d, '2.jpg'), '-filter_complex', 'hstack=3', hoja]);
        rmSync(d, { recursive: true, force: true });
      }
      lista.push({ id, tipo, archivo: destino, origen: basename(f), bytes: tam, ...m, hoja, descripcion: '', etiquetas: [] }); nuevos++;
      console.log(`${id}  ${basename(f)}`);
    } catch (e) { rmSync(destino, { force: true }); console.log(`no pude leer ${basename(f)}: ${String(e.message).split('\n')[0]}`); }
  }
  guardar(lista);
  console.log(`\n${nuevos} nuevos · ${lista.length} en total -> ${B}\nAhora descríbelos: node scripts/broll.mjs pendientes`);
}

function pendientes() {
  const p = leer().filter(b => !b.descripcion);
  if (!p.length) return console.log('Todos tienen descripción.');
  p.forEach(b => console.log(`${b.id}  ${b.tipo}  ${b.origen}  hoja: ${b.hoja}`));
  console.log(`\nMira cada hoja y guarda lo que se ve: node scripts/broll.mjs describir <id> "qué se ve" etiqueta,etiqueta`);
}

function describir(id, texto, etiquetas = '') {
  const lista = leer(), b = lista.find(x => x.id === id);
  if (!b) throw new Error(`No hay ${id} en la biblioteca.`);
  b.descripcion = texto; b.etiquetas = etiquetas.split(',').map(s => s.trim()).filter(Boolean); guardar(lista);
  console.log(fila(b));
}

function buscar(frase, cuantos = 5) {
  const q = [...new Set(palabras(frase).map(raiz))];
  const puntos = leer().filter(b => b.descripcion).map(b => {
    const desc = palabras(b.descripcion).map(raiz), et = b.etiquetas.flatMap(palabras).map(raiz);
    return [q.reduce((s, w) => s + 2 * parecido(w, et) + parecido(w, desc), 0), b];
  }).filter(([p]) => p > 0).sort((a, b) => b[0] - a[0]).slice(0, cuantos);
  if (!puntos.length) return console.log('Nada en tu biblioteca va con esa frase. Mejor usa una captura real o deja a la persona en pantalla.');
  puntos.forEach(([p, b]) => console.log(`${p}  ${fila(b)}`));
}

function usar(P, id) {
  const b = leer().find(x => x.id === id);
  if (!b) throw new Error(`No hay ${id} en la biblioteca.`);
  const dir = join(P, 'fuente', 'broll'); mkdirSync(dir, { recursive: true });
  const destino = join(dir, basename(b.archivo)); if (!existsSync(destino)) copyFileSync(b.archivo, destino);
  console.log(`listo -> ${destino}\nEn la escena de plano.json:\n  "broll": {"archivo": "broll/${basename(b.archivo)}", "desde": 0}` +
    `\n(sin x, y, w, h ocupa toda la pantalla; "desde" = segundo del clip donde empieza; "bn": true lo pasa a blanco y negro)` +
    (b.tipo === 'video' ? `\nDura ${b.dur.toFixed(1)} s: si la escena es más larga, el clip vuelve a empezar.` : ''));
}

try {
  const [orden, ...a] = process.argv.slice(2);
  if (orden === 'agregar' && a.length) agregar(a);
  else if (orden === 'pendientes') pendientes();
  else if (orden === 'describir' && a[1]) describir(a[0], a[1], a[2]);
  else if (orden === 'buscar' && a[0]) buscar(a[0], +a[1] || 5);
  else if (orden === 'usar' && a[1]) usar(casa(a[0]), a[1]);
  else if (orden === 'lista') { const l = leer(); l.forEach(b => console.log(fila(b))); console.log(`${l.length} en ${B}`); }
  else throw new Error(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//   node scripts/broll.mjs')).map(l => l.slice(3)).join('\n'));
} catch (e) { salir(e); }
