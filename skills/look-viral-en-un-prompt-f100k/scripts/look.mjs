#!/usr/bin/env node
// Un comando para todo: prepara, recorta, transcribe, arma el plan (si no existe) y renderiza. Igual en Mac y en Windows.
// Uso: node look.mjs MI_VIDEO.mov palabra|linea|ambos [CARPETA_DE_TRABAJO]
//      node look.mjs MI_VIDEO.mov plan palabra|linea [CARPETA]   → solo deja el plan para afinarlo
//      node look.mjs --preparar                                  → solo instala lo que hace falta (una vez, ~2 min)
// Necesita ffmpeg y uv. Python 3.12 aislado en ~/.cache/look-viral-env y el modelo de recorte (~16 MB) en ~/.cache/look-viral-models.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const WIN = process.platform === 'win32';
const APPLE = process.platform === 'darwin' && process.arch === 'arm64';
const ENV = join(homedir(), '.cache', 'look-viral-env');
const MOD = join(homedir(), '.cache', 'look-viral-models');
const PY = WIN ? join(ENV, 'Scripts', 'python.exe') : join(ENV, 'bin', 'python');
const MODELO_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';
const INSTALAR = WIN ? { ffmpeg: 'winget install -e --id Gyan.FFmpeg', uv: 'winget install -e --id astral-sh.uv' } : { ffmpeg: 'brew install ffmpeg', uv: 'brew install uv' };
const entorno = { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', PYTHONWARNINGS: 'ignore', GLOG_minloglevel: '2', TF_CPP_MIN_LOG_LEVEL: '3' };
const hay = (cmd, arg = '--version') => spawnSync(cmd, [arg], { stdio: 'ignore', shell: WIN }).status === 0;
const salir = (msg) => { console.error(msg); process.exit(1); };

async function preparar() {
  if (!hay('ffmpeg', '-version')) salir(`Falta ffmpeg. Instálalo con: ${INSTALAR.ffmpeg}`);
  if (!hay('uv')) salir(`Falta uv. Instálalo con: ${INSTALAR.uv}`);
  if (!existsSync(PY)) {
    const r = spawnSync('uv', ['venv', '-q', '--python', '3.12', ENV], { stdio: 'inherit' });
    if (r.status !== 0) salir('No pude crear el Python aislado con uv.');
  }
  // En Mac con chip Apple la transcripción va con mlx-whisper (uvx, aparte); en Windows y Mac Intel, con faster-whisper aquí dentro.
  const mods = ['mediapipe', 'cv2', 'PIL', 'numpy', ...(APPLE ? [] : ['faster_whisper'])];
  const ok = spawnSync(PY, ['-c', `import ${mods.join(', ')}`], { stdio: 'ignore', env: entorno }).status === 0;
  if (!ok) {
    console.log('Instalando lo que necesitan los estilos (una sola vez)…');
    const pk = ['mediapipe', 'opencv-python', 'Pillow', 'numpy', ...(APPLE ? [] : ['faster-whisper'])];
    const r = spawnSync('uv', ['pip', 'install', '-q', '--python', PY, ...pk], { stdio: 'inherit' });
    if (r.status !== 0) salir('No pude instalar las librerías. Revisa tu internet y vuelve a intentarlo.');
  }
  mkdirSync(MOD, { recursive: true });
  const modelo = join(MOD, 'selfie_multiclass.tflite');
  if (!existsSync(modelo)) {
    console.log('Bajando el modelo de recorte (~16 MB)…');
    const res = await fetch(MODELO_URL);
    if (!res.ok) salir('No pude bajar el modelo de recorte: ' + res.status);
    writeFileSync(modelo, Buffer.from(await res.arrayBuffer()));
  }
}

const py = (script, args, filtrar = false) => {
  const r = spawnSync(PY, [join(AQUI, script), ...args], { stdio: filtrar ? ['ignore', 'inherit', 'pipe'] : 'inherit', env: entorno, encoding: 'utf8' });
  if (filtrar && r.stderr) {
    const util = r.stderr.split('\n').filter((l) => l.trim() && !/^(W|I)0000|inference_feedback|^WARNING/.test(l));
    if (util.length) console.error(util.join('\n'));
  }
  if (r.status !== 0) salir(`Falló ${script}.`);
};

const [VIDEO, MODO, ...resto] = process.argv.slice(2);
if (VIDEO === '--preparar') { await preparar(); console.log('Todo listo.'); process.exit(0); }
if (!VIDEO || !MODO) salir('Uso: node look.mjs MI_VIDEO.mov palabra|linea|ambos [CARPETA]   ·   node look.mjs MI_VIDEO.mov plan palabra|linea [CARPETA]');
if (!existsSync(VIDEO)) salir('No encuentro el video: ' + VIDEO);
const ESTILO = MODO === 'plan' ? resto[0] : null;
const porDefecto = join(dirname(resolve(VIDEO)), `look-${basename(VIDEO, extname(VIDEO))}`);
const T = resolve((MODO === 'plan' ? resto[1] : resto[0]) || porDefecto);

await preparar();
mkdirSync(T, { recursive: true });
if (!existsSync(join(T, 'mascara.mp4'))) py('recortar.py', [VIDEO, T], true);
if (!existsSync(join(T, 'palabras.json'))) py('palabras.py', [T]);
const hacer = (e) => {
  if (!existsSync(join(T, `config-${e}.json`))) py('plan.py', [T, e]);
  if (MODO === 'plan') return;
  py(e === 'palabra' ? 'estilo_palabra.py' : 'estilo_linea.py', [T]);
};
if (MODO === 'palabra' || MODO === 'linea') hacer(MODO);
else if (MODO === 'ambos') { hacer('palabra'); hacer('linea'); }
else if (MODO === 'plan' && (ESTILO === 'palabra' || ESTILO === 'linea')) { hacer(ESTILO); console.log(`Plan listo en ${join(T, `config-${ESTILO}.json`)}`); }
else salir('Estilo: palabra, linea o ambos');
console.log('Carpeta: ' + T);
