#!/usr/bin/env node
// Punto de entrada del editor de video. Corre igual en Mac y en Windows.
//
//   node editar.mjs "<video>"                      corta y monta → BORRADOR_AUTO.mp4
//   node editar.mjs "<video>" --solo-corte         solo corta y transcribe
//   node editar.mjs "<video>" --carpeta "<carpeta>" elige dónde trabajar
//   node editar.mjs "<video>" --formato split      formato del MANIFEST que se crea si no hay uno
//   node editar.mjs "<video>" --recortar           rehace el corte
//   node editar.mjs --revisar                      dice qué falta en la compu
//
// Cualquier otra bandera (--semantic-level ajustado, --min-silence 0.15,
// --no-semantic, --guion ruta.txt…) pasa tal cual al corte.
//
// Python no se instala aparte: uv lo trae junto con sus librerías.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scripts = dirname(fileURLToPath(import.meta.url));
const skill = dirname(scripts);
const win = process.platform === 'win32';
const macApple = process.platform === 'darwin' && process.arch === 'arm64';
const casa = (ruta) => (ruta.startsWith('~') ? join(homedir(), ruta.slice(1)) : ruta);

export const ARCHIVO_LLAVE = join(homedir(), '.editor-video', 'llave-anthropic.txt');
export const FORMATOS = ['fullscreen', 'split', 'pip', 'versus', 'pizarra', 'noticiero'];

// La llave vive en un archivo propio, no en la configuración de la terminal:
// así Claude Code sigue usando tu plan de siempre y solo el editor usa la llave.
export function leerLlave(entorno = process.env, archivo = ARCHIVO_LLAVE) {
  if (entorno.ANTHROPIC_API_KEY) return { llave: entorno.ANTHROPIC_API_KEY.trim(), origen: 'la variable ANTHROPIC_API_KEY' };
  if (existsSync(archivo)) {
    const m = readFileSync(archivo, 'utf8').match(/sk-ant-[A-Za-z0-9_-]+/);
    if (m) return { llave: m[0], origen: archivo };
  }
  return { llave: null, origen: null };
}

export const ARCHIVO_LLAVE_GEMINI = join(homedir(), '.editor-video', 'llave-gemini.txt');

// Llave de Gemini para la revisión del guion (segunda lectura del corte).
export function leerLlaveGemini(entorno = process.env, archivo = ARCHIVO_LLAVE_GEMINI) {
  for (const v of ['GEMINI_API_KEY', 'GOOGLE_API_KEY']) {
    if (entorno[v] && entorno[v].trim()) return { llave: entorno[v].trim(), origen: `la variable ${v}` };
  }
  if (existsSync(archivo)) {
    const m = readFileSync(archivo, 'utf8').match(/AIza[0-9A-Za-z_-]{20,}/);
    if (m) return { llave: m[0], origen: archivo };
  }
  return { llave: null, origen: null };
}

export const FRASE_GEMINI = {
  ok: 'Revisión Gemini: SÍ corrió. Quitó muletillas, repeticiones o re-enunciados que quedaban (detalle arriba, líneas «revisión Gemini»).',
  nothing: 'Revisión Gemini: SÍ corrió y el guion quedó limpio.',
  no_key: `Revisión Gemini: NO corrió (sin llave). Guárdala en ${ARCHIVO_LLAVE_GEMINI}.`,
  api_fail: 'Revisión Gemini: NO corrió. Hay llave, pero la llamada falló (arriba dice por qué).',
  aborted_overbudget: 'Revisión Gemini: NO se aplicó. Quiso borrar demasiado y se descartó por seguridad.',
  apagado: 'Revisión Gemini: apagada a propósito (--no-gemini).',
};

function avisoGemini(l) {
  return l.llave
    ? `Revisión del guion con Gemini: ENCENDIDA (llave en ${l.origen}).`
    : `Revisión del guion con Gemini: APAGADA (no hay llave). Para encenderla, guarda tu llave de Google AI Studio en: ${ARCHIVO_LLAVE_GEMINI}`;
}

export function motorTranscripcion(entorno = process.env) {
  const forzado = (entorno.EDITOR_TRANSCRIPCION || '').trim().toLowerCase();
  if (forzado === 'mlx' || forzado === 'faster') return forzado;
  return macApple ? 'mlx' : 'faster';
}

const prueba = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: win });
  return r.status === 0 ? `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n')[0] : null;
};

export function revisar() {
  const como = (mac, windows) => (win ? windows : mac);
  const nodeOk = Number(process.versions.node.split('.')[0]) >= 18;
  return [
    { nombre: 'Node 18 o más nuevo', ok: nodeOk, arreglo: como('brew install node', 'winget install -e --id OpenJS.NodeJS.LTS') },
    { nombre: 'ffmpeg', ok: !!prueba('ffmpeg', ['-version']), arreglo: como('brew install ffmpeg', 'winget install -e --id Gyan.FFmpeg') },
    { nombre: 'ffprobe', ok: !!prueba('ffprobe', ['-version']), arreglo: como('brew install ffmpeg', 'winget install -e --id Gyan.FFmpeg') },
    { nombre: 'uv (trae Python y la transcripción)', ok: !!prueba('uv', ['--version']), arreglo: como('brew install uv', 'winget install -e --id astral-sh.uv') },
    { nombre: 'Motor de montaje (Remotion)', ok: existsSync(join(skill, 'remotion-template', 'node_modules', 'remotion')), arreglo: `node "${join(scripts, 'preparar.mjs')}"` },
  ];
}

export const FRASE_CORTE_FINO = {
  ok: 'Corte fino: SÍ corrió. Quitó frases reformuladas y arranques en falso (el detalle está arriba, en las líneas «semantic»).',
  nothing: 'Corte fino: SÍ corrió y no encontró tomas falladas que quitar.',
  no_key: 'Corte fino: NO corrió (sin llave). Solo se quitaron silencios, muletillas y palabras repetidas.',
  api_fail: 'Corte fino: NO corrió. Hay llave, pero la llamada falló (arriba dice por qué: llave mal copiada, sin saldo o sin internet). Solo se quitaron silencios, muletillas y palabras repetidas.',
  aborted_overbudget: 'Corte fino: NO se aplicó. Quiso borrar demasiado video y se descartó por seguridad. Solo se quitaron silencios, muletillas y palabras repetidas.',
  apagado: 'Corte fino: apagado a propósito (--no-semantic).',
};

function avisoLlave(l) {
  return l.llave
    ? `Corte fino: ENCENDIDO (llave de Anthropic en ${l.origen}).`
    : `Corte fino: APAGADO. No hay llave de Anthropic, así que solo se cortan silencios, muletillas y palabras repetidas.\n  Para encenderlo, guarda tu llave en: ${ARCHIVO_LLAVE}`;
}

function duracion(archivo) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', archivo], { encoding: 'utf8' });
  const n = Number((r.stdout || '').trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

const slug = (nombre) => nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'video';

export function manifestMinimo({ titulo, video, formato }) {
  return `# Reel — ${titulo}

- **Video fuente:** ${video}
- **Formato:** ${formato}
- **Subtítulos:** on
`;
}

function leerArgs(argv) {
  const a = { video: null, carpeta: null, formato: null, soloCorte: false, recortar: false, revisar: false, resto: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--revisar') a.revisar = true;
    else if (x === '--solo-corte') a.soloCorte = true;
    else if (x === '--recortar') a.recortar = true;
    else if (x === '--carpeta') a.carpeta = argv[++i];
    else if (x === '--formato') a.formato = argv[++i];
    else if (!x.startsWith('--') && !a.video) a.video = x;
    else a.resto.push(x);
  }
  return a;
}

function principal() {
  const a = leerArgs(process.argv.slice(2));
  const filas = revisar();
  const llave = leerLlave();
  const llaveGemini = leerLlaveGemini();

  if (a.revisar) {
    console.log('Editor de video · revisión\n');
    for (const f of filas) console.log(`${f.ok ? '✓' : '✗'} ${f.nombre}${f.ok ? '' : `\n    Se arregla con: ${f.arreglo}`}`);
    console.log(`\nTranscripción: ${motorTranscripcion() === 'mlx' ? 'mlx-whisper (Mac con chip Apple)' : 'faster-whisper'}. La primera vez descarga el modelo de voz.`);
    console.log(avisoLlave(llave));
    console.log(avisoGemini(llaveGemini));
    process.exit(filas.every((f) => f.ok) ? 0 : 1);
  }

  if (!a.video) {
    console.error('Falta el video. Uso: node editar.mjs "<ruta del video>" [--carpeta "<carpeta>"] [--solo-corte] [--formato <formato>]');
    process.exit(2);
  }
  const faltan = filas.filter((f) => !f.ok);
  if (faltan.length) {
    console.error('No puedo editar todavía. Falta:');
    for (const f of faltan) console.error(`  ✗ ${f.nombre}\n      Se arregla con: ${f.arreglo}`);
    process.exit(2);
  }
  const video = resolve(casa(a.video));
  if (!existsSync(video)) { console.error(`No encuentro el video: ${video}`); process.exit(2); }
  if (a.formato && !FORMATOS.includes(a.formato)) { console.error(`No conozco el formato «${a.formato}». Opciones: ${FORMATOS.join(', ')}.`); process.exit(2); }

  const titulo = basename(video, extname(video));
  const carpeta = resolve(casa(a.carpeta || join('~', 'Documents', 'mis-videos-editados', slug(titulo))));
  mkdirSync(carpeta, { recursive: true });
  const manifest = join(carpeta, 'MANIFEST.md');
  if (!a.soloCorte && !existsSync(manifest)) {
    writeFileSync(manifest, manifestMinimo({ titulo, video, formato: a.formato || 'fullscreen' }), 'utf8');
    console.error(`Creé un MANIFEST.md básico en ${carpeta} (formato ${a.formato || 'fullscreen'}, con subtítulos).`);
  }

  console.error(avisoLlave(llave));
  console.error(avisoGemini(llaveGemini));
  const motor = motorTranscripcion();
  const con = ['--with', 'numpy', '--with', 'certifi', ...(motor === 'faster' ? ['--with', 'faster-whisper'] : [])];
  const args = ['run', '--no-project', '--python', '3.12', ...con, 'python', join(scripts, 'render.py'), carpeta, video,
    ...(a.soloCorte ? ['--solo-corte'] : []), ...(a.recortar ? ['--recortar'] : []), ...a.resto];
  const entorno = { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', EDITOR_TRANSCRIPCION: motor };
  if (llave.llave) entorno.ANTHROPIC_API_KEY = llave.llave; else delete entorno.ANTHROPIC_API_KEY;
  if (llaveGemini.llave) entorno.GEMINI_API_KEY = llaveGemini.llave;

  const r = spawnSync('uv', args, { cwd: skill, stdio: 'inherit', env: entorno });
  if (r.status !== 0) {
    console.error('\nEl editor no terminó. Arriba está el motivo; si no queda claro, corre: node editar.mjs --revisar');
    process.exit(r.status || 1);
  }

  const antes = duracion(video);
  const corte = join(carpeta, '_source_cut.mov');
  const final = join(carpeta, 'BORRADOR_AUTO.mp4');
  const s = (n) => (n == null ? '?' : `${n.toFixed(1)} s`);
  console.error('\nResumen');
  console.error(`  Carpeta de trabajo: ${carpeta}`);
  console.error(`  Original: ${s(antes)} → cortado: ${s(existsSync(corte) ? duracion(corte) : null)}`);
  if (!a.soloCorte && existsSync(final)) console.error(`  Video final: ${final} (${s(duracion(final))})`);
  let estado = llave.llave ? 'ok' : 'no_key';
  let estadoGemini = llaveGemini.llave ? 'ok' : 'no_key';
  try {
    const c = JSON.parse(readFileSync(join(carpeta, 'corte.json'), 'utf8'));
    estado = c.corte_fino || estado;
    estadoGemini = c.revision_gemini || estadoGemini;
  } catch { /* corte hecho por una versión anterior */ }
  console.error(`  ${FRASE_CORTE_FINO[estado] || FRASE_CORTE_FINO.no_key}`);
  console.error(`  ${FRASE_GEMINI[estadoGemini] || FRASE_GEMINI.no_key}`);
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) principal();
