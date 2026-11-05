#!/usr/bin/env node
// sistema.mjs — todo lo que depende del sistema operativo pasa por aquí (Mac y Windows).
//
// Es el MISMO archivo en todas las skills de animación (animacion-dibujada, animacion-recortes-papel, reel-manotazo): si lo cambias, cámbialo en todas.
// Elige ./sistema.mac.mjs o ./sistema.windows.mjs según la computadora; cada paquete trae solo el suyo.
// Lo que sirve igual en los dos sistemas (ffmpeg, faster-whisper, rembg, OpenCV) está en este archivo.
//
// Desde la terminal, igual en Mac y en Windows:
//   node sistema.mjs abrir <archivo o carpeta>             lo abre con el programa de siempre
//   node sistema.mjs voz "<frase>" <salida.wav>            voz de PRUEBA de la computadora  [--voz Nombre] [--ritmo 185]
//   node sistema.mjs voz --archivo guion.txt <salida.wav>  lo mismo, leyendo la frase de un archivo
//   node sistema.mjs voces                                 voces en español instaladas
//   node sistema.mjs transcribir <audio> [carpeta]         deja <audio>.json con el tiempo de cada palabra  [--idioma es] [--txt]
//   node sistema.mjs achicar <foto> <salida> [lado=1600]   achica y convierte una foto (según la extensión de la salida)
//   node sistema.mjs recortar <foto> <salida.png>          quita el fondo y deja a la persona u objeto
//   node sistema.mjs cara <imagen>                         imprime dónde están la cara, los ojos y la boca (JSON)
//   node sistema.mjs chrome                                imprime dónde está Google Chrome
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
export const WINDOWS = process.platform === 'win32';
export const SISTEMA = WINDOWS ? 'windows' : 'mac';       // Linux usa la de Mac: ahí todo cae en las piezas comunes

const correr = (cmd, args, opt = {}) => spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28, ...opt });
const cola = (txt, n = 8) => String(txt || '').trim().split('\n').slice(-n).join('\n');
const sinExt = f => basename(f, extname(f));

// Un archivo de apoyo (un .py, un .swift, un modelo): junto a este o en la skill de animación dibujada, que los trae todos.
export function pieza(nombre) {
  const hermana = 'animacion-dibujada-f100k';
  const cerca = [join(AQUI, nombre), join(AQUI, '..', '..', hermana, 'scripts', nombre), join(homedir(), '.claude', 'skills', hermana, 'scripts', nombre)].find(existsSync);
  return cerca || enPlugins(join('skills', hermana, 'scripts', nombre));
}

// Con el plugin, las skills viven en ~/.claude/plugins/…/skills/<nombre> (la ruta cambia con la versión): se busca ahí.
function enPlugins(rel) {
  const hijos = d => { try { return readdirSync(d, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => join(d, e.name)); } catch { return []; } };
  const base = join(homedir(), '.claude', 'plugins');
  let nivel = [base];
  for (let i = 0; i < 4; i++) {
    nivel = nivel.flatMap(hijos);
    const hallado = nivel.map(d => join(d, rel)).filter(existsSync).sort().pop();
    if (hallado) return hallado;
  }
  return null;
}

// ---------- Python sin instalar Python: uv baja lo que el script pide en su encabezado ----------
function uvRun(script, args, opt = {}) {
  const ruta = pieza(script);
  if (!ruta) return { status: 1, stdout: '', stderr: `Falta ${script}. Viene en la skill animacion-dibujada-f100k: instálala junto a esta.` };
  const env = { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', HF_HUB_DISABLE_SYMLINKS_WARNING: '1' };
  const r = correr('uv', ['run', '--quiet', ruta, ...args], { env, stdio: ['ignore', 'pipe', 'pipe'], ...opt });
  if (r.error) return { status: 1, stdout: '', stderr: `Falta uv (es lo que corre esta parte). Instálalo con: ${impl.INSTALAR.uv}` };
  return r;
}

// ---------- transcribir ----------
// Deja <dir>/<nombre del audio>.json con el mismo formato de Whisper: segments[].words[] = { word, start, end }.
// Devuelve { ok, archivo, motor } o { ok: false, error }.
export function transcribirFaster(audio, { dir = dirname(resolve(audio)), idioma = 'es', txt = false, modelo } = {}) {
  mkdirSync(dir, { recursive: true });
  const archivo = join(dir, sinExt(audio) + (txt ? '.txt' : '.json'));
  const args = [resolve(audio), '--dir', dir, '--idioma', idioma, '--formato', txt ? 'txt' : 'json'];
  if (modelo || process.env.F100K_WHISPER_MODELO) args.push('--modelo', modelo || process.env.F100K_WHISPER_MODELO);
  const r = uvRun('transcribir.py', args, { stdio: ['ignore', 'pipe', 'inherit'] });
  return r.status === 0 && existsSync(archivo) ? { ok: true, archivo, motor: 'faster-whisper' } : { ok: false, error: cola(r.stderr || r.stdout) || 'faster-whisper no terminó.' };
}
// Último recurso: el Whisper de OpenAI, si la persona ya lo tenía instalado.
export function transcribirWhisperCli(audio, { dir = dirname(resolve(audio)), idioma = 'es', txt = false } = {}) {
  const archivo = join(dir, sinExt(audio) + (txt ? '.txt' : '.json'));
  const r = correr('whisper', [resolve(audio), '--model', 'small', '--language', idioma, '--word_timestamps', 'True', '--output_format', txt ? 'txt' : 'json', '--output_dir', dir]);
  return !r.error && r.status === 0 && existsSync(archivo) ? { ok: true, archivo, motor: 'openai-whisper' } : { ok: false, error: r.error ? 'whisper no está instalado.' : cola(r.stderr) };
}
export function transcribir(audio, opciones = {}) {
  if (!existsSync(audio)) return { ok: false, error: 'No existe el audio: ' + audio };
  const o = { ...opciones, dir: resolve(opciones.dir || dirname(resolve(audio))) };
  mkdirSync(o.dir, { recursive: true });
  const r = impl.transcribir(resolve(audio), o);
  if (r.ok) return r;
  const w = transcribirWhisperCli(audio, o);
  return w.ok ? w : r;
}

// ---------- voz de prueba ----------
// Dice `texto` con la voz de la computadora y lo guarda. NUNCA es la voz final: solo sirve para medir tiempos.
// `base` es la ruta SIN extensión; devuelve el archivo que escribió (.aiff en Mac, .wav en Windows).
// Si la computadora no tiene voz en español, lanza un error que pide grabar la voz.
export function vozDePrueba(texto, base, { voz, ritmo } = {}) { return impl.vozDePrueba(texto, base, { voz, ritmo }); }
export function vocesDePrueba() { return impl.vocesDePrueba(); }
export const SIN_VOZ = 'Esta computadora no tiene una voz en español para la prueba.\n' +
  'Graba tu voz diciendo las frases (con el celular sirve) y pásame el audio: los tiempos salen de tu grabación, que además es la voz que se entrega.';

// ---------- fotos ----------
export function medirImagenFf(foto) {
  const r = correr('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', foto]);
  const m = (r.stdout || '').match(/(\d+),(\d+)/);
  if (!m) throw new Error('No pude leer la foto: ' + foto + (/\.hei[cf]$/i.test(foto) ? '\nLas fotos HEIC del iPhone a veces no se leen: expórtala como JPG y vuelve a intentarlo.' : ''));
  return [+m[1], +m[2]];
}
// Copia la foto a `salida` en el formato de su extensión; si su lado largo pasa de `lado`, la achica (nunca la agranda).
export function achicarImagenFf(foto, salida, lado = 1600, { calidad = 90 } = {}) {
  const jpg = /\.jpe?g$/i.test(salida);
  const escala = `scale=w='if(gte(iw,ih),min(iw,${lado}),-1)':h='if(gte(iw,ih),-1,min(ih,${lado}))':flags=lanczos`;
  const a = ['-v', 'error', '-y', '-i', foto, '-vf', escala, '-frames:v', '1', '-update', '1'];
  if (jpg) a.push('-q:v', String(Math.max(2, Math.round((100 - calidad) / 4)))); else a.push('-pix_fmt', 'rgba');
  const r = correr('ffmpeg', [...a, salida]);
  if (r.error) throw new Error('Falta ffmpeg. Instálalo con: ' + impl.INSTALAR.ffmpeg);
  if (r.status !== 0) throw new Error('No pude convertir la foto ' + foto + ':\n' + cola(r.stderr, 4));
}
export function medirImagen(foto) { return impl.medirImagen(foto); }
export function achicarImagen(foto, salida, lado = 1600, opciones = {}) { mkdirSync(dirname(resolve(salida)), { recursive: true }); return impl.achicarImagen(foto, salida, lado, opciones); }

// ---------- recortar a la persona y encontrar la cara ----------
// recortarPersona → { ok, mensaje }. Sin sujeto claro: ok = false y el mensaje lo dice.
export function recortarRembg(foto, salida) {
  console.log('Quitando el fondo (la primera vez descarga el modelo, tarda unos minutos)…');
  const r = uvRun('recortar.py', [resolve(foto), resolve(salida)], { stdio: ['ignore', 'pipe', 'inherit'] });
  const dicho = cola(r.stdout, 1) || cola(r.stderr, 3);
  return { ok: r.status === 0 && existsSync(salida), mensaje: dicho, sinSujeto: r.status === 2 };
}
export function recortarPersona(foto, salida) { mkdirSync(dirname(resolve(salida)), { recursive: true }); return impl.recortarPersona(foto, salida); }
// buscarCara → { ancho, alto, cara: [x, y, w, h] | null, ojoIzq, ojoDer, ojoAncho, boca, bocaAncho, bocaAlto } en pixeles de esa imagen.
export function caraOpenCV(imagen) {
  const r = uvRun('cara.py', [resolve(imagen)]);
  const linea = (r.stdout || '').split('\n').filter(l => l.startsWith('{')).pop();
  if (r.status !== 0 || !linea) throw new Error(cola(r.stderr || r.stdout, 4) || 'No pude buscar la cara.');
  return JSON.parse(linea);
}
export function buscarCara(imagen) { return impl.buscarCara(imagen); }

// ---------- Chrome, abrir, npx, Python ----------
// La ruta de Google Chrome, o null. Manda la variable CHROME si existe.
export function chrome() {
  const linux = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return [process.env.CHROME, ...impl.rutasChrome(), ...linux].filter(Boolean).find(existsSync) || null;
}
export function chromeOSalir() {
  const c = chrome();
  if (!c) { console.error(`No encontré Google Chrome. Instálalo (${impl.INSTALAR.chrome}) o indica dónde está con la variable CHROME.`); process.exit(1); }
  return c;
}
export function abrir(ruta) { return impl.abrir(resolve(ruta)); }
// npx <args>: en Windows npx es un .cmd y no arranca sin pasar por la consola.
export function npx(args, opt = {}) { return impl.npx(args, { encoding: 'utf8', ...opt }); }
// Un Python propio (venv) con paquetes, para lo que no corre con uv run. Devuelve la ruta de su python.
export function pythonConPaquetes(venv, paquetes) {
  const py = impl.pythonDelVenv(venv);
  if (existsSync(py)) return py;
  mkdirSync(dirname(venv), { recursive: true });
  const conUv = () => correr('uv', ['venv', venv, '--python', '3.12'], { stdio: 'inherit' }).status === 0 &&
    correr('uv', ['pip', 'install', '--quiet', '--python', py, ...paquetes], { stdio: 'inherit' }).status === 0;
  const conPython = () => impl.PYTHON.some(p => correr(p[0], [...p.slice(1), '-m', 'venv', venv], { stdio: 'inherit' }).status === 0) &&
    correr(py, ['-m', 'pip', 'install', '-q', ...paquetes], { stdio: 'inherit' }).status === 0;
  const orden = impl.PRIMERO_UV ? [conUv, conPython] : [conPython, conUv];
  for (const intento of orden) { if (intento() && existsSync(py)) return py; rmSync(venv, { recursive: true, force: true }); }
  throw new Error(`No pude preparar Python. Instala uv (${impl.INSTALAR.uv}) y vuelve a intentarlo.`);
}
export const INSTALAR = () => impl.INSTALAR;
// Una ruta de archivo como dirección para Chrome (en Windows «file://» + ruta no sirve).
export const comoUrl = (ruta, cola = '') => pathToFileURL(resolve(ruta)).href + cola;
// Una ruta para una lista de ffmpeg (concat): con barras normales y sin que un apóstrofo la rompa.
export const paraLista = ruta => `file '${String(ruta).replace(/\\/g, '/').replace(/'/g, "'\\''")}'`;

// ---------- la implementación de esta computadora ----------
const comun = { correr, cola, sinExt, pieza, transcribirFaster, medirImagenFf, achicarImagenFf, recortarRembg, caraOpenCV, SIN_VOZ, rmSync, existsSync, join };
let impl;
try { impl = (await import(`./sistema.${SISTEMA}.mjs`)).default(comun); }
catch (e) {
  if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e;
  console.error(`Este paquete no es el de tu sistema: falta sistema.${SISTEMA}.mjs.\nDescarga el módulo de ${WINDOWS ? 'Windows' : 'Mac'} y vuelve a instalarlo.`);
  process.exit(1);
}

// ---------- desde la terminal ----------
const yo = fileURLToPath(import.meta.url), llamado = process.argv[1] ? resolve(process.argv[1]) : '';
if (llamado && (WINDOWS ? llamado.toLowerCase() === yo.toLowerCase() : llamado === yo)) {
  const [orden, ...resto] = process.argv.slice(2);
  const op = n => { const i = resto.indexOf('--' + n); if (i < 0) return undefined; const v = resto[i + 1]; resto.splice(i, v === undefined || v.startsWith('--') ? 1 : 2); return v === undefined || v.startsWith('--') ? true : v; };
  try {
    if (orden === 'abrir' && resto[0]) abrir(resto[0]);
    else if (orden === 'chrome') console.log(chromeOSalir());
    else if (orden === 'voces') { const v = vocesDePrueba(); console.log(v.length ? v.join('\n') : SIN_VOZ); }
    else if (orden === 'voz') {
      const voz = op('voz'), ritmo = op('ritmo'), archivo = op('archivo');
      const texto = archivo ? readFileSync(archivo, 'utf8') : resto.shift(), salida = resto[0];
      if (!texto || !salida) throw new Error('uso: node sistema.mjs voz "<frase>" <salida.wav> [--voz Nombre] [--ritmo 185]');
      mkdirSync(dirname(resolve(salida)), { recursive: true });
      const tmp = mkdtempSync(join(tmpdir(), 'voz-')), cruda = vozDePrueba(texto, join(tmp, 'cruda'), { voz: voz === true ? undefined : voz, ritmo: ritmo ? Number(ritmo) : undefined });
      const r = correr('ffmpeg', ['-v', 'error', '-y', '-i', cruda, '-ar', '44100', '-ac', '1', resolve(salida)]);
      rmSync(tmp, { recursive: true, force: true });
      if (r.status !== 0) throw new Error('No pude guardar la voz: ' + cola(r.stderr, 3));
      console.log('voz de PRUEBA (no se entrega) -> ' + resolve(salida));
    }
    else if (orden === 'transcribir' && resto[0]) {
      const txt = !!op('txt'), idioma = op('idioma') || 'es';
      console.log('Transcribiendo (la primera vez descarga el modelo)…');
      const r = transcribir(resto[0], { dir: resto[1] ? resolve(resto[1]) : undefined, idioma, txt });
      if (!r.ok) throw new Error('No pude transcribir.\n' + r.error);
      console.log(`transcripción (${r.motor}) -> ${r.archivo}`);
    }
    else if (orden === 'achicar' && resto[1]) { achicarImagen(resto[0], resto[1], Number(resto[2]) || 1600); console.log(`foto -> ${resolve(resto[1])} (${medirImagen(resto[1]).join(' x ')})`); }
    else if (orden === 'recortar' && resto[1]) { const r = recortarPersona(resto[0], resto[1]); if (!r.ok) throw new Error(r.mensaje || 'No hubo recorte.'); console.log(r.mensaje || 'recorte -> ' + resolve(resto[1])); }
    else if (orden === 'cara' && resto[0]) console.log(JSON.stringify(buscarCara(resto[0])));
    else { console.error(readFileSync(yo, 'utf8').split('\n').filter(l => l.startsWith('//   node sistema.mjs')).map(l => l.slice(3)).join('\n')); process.exit(1); }
  } catch (e) { console.error(e.message); process.exit(1); }
}
