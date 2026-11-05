#!/usr/bin/env node
// mirar.mjs — deja lista una referencia para MIRARLA antes de clonarla. Corre igual en Mac y en Windows.
// Uso: node mirar.mjs <enlace o archivo de video> <carpeta de salida>
// Deja: referencia.mp4, datos.txt, hoja-completa.jpg (un cuadro cada 2 s), hoja-apertura.jpg (los primeros 3 s,
// cuadro a cuadro) y, si la referencia habla, transcripcion.txt.
import { copyFileSync, existsSync, mkdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { transcribir, INSTALAR } from './sistema.mjs';

const [entrada, carpeta] = process.argv.slice(2);
if (!entrada || !carpeta) { console.error('uso: node mirar.mjs <enlace o archivo> <carpeta de salida>'); process.exit(1); }
const OUT = resolve(carpeta), REF = join(OUT, 'referencia.mp4');
mkdirSync(OUT, { recursive: true });
const correr = (cmd, a, opt = {}) => spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 1 << 28, ...opt });
const sonda = a => (correr('ffprobe', ['-v', 'error', ...a, '-of', 'csv=p=0', REF]).stdout || '').trim();

if (existsSync(entrada) && statSync(entrada).isFile()) { if (resolve(entrada) !== REF) copyFileSync(entrada, REF); }
else {
  const bajar = extra => correr('yt-dlp', ['-q', '--no-playlist', ...extra, '-f', 'mp4/best', '-o', REF, entrada], { stdio: 'inherit' });
  let r = bajar([]);
  if (r.error) { console.error(`Falta yt-dlp. Instálalo (${INSTALAR()['yt-dlp']}) o pasa el archivo del video ya descargado.`); process.exit(1); }
  if (r.status !== 0 || !existsSync(REF)) r = bajar(['--cookies-from-browser', 'chrome']);
  if (r.status !== 0 || !existsSync(REF)) { console.error('No pude descargarlo. Guarda el video desde la app y vuelve a correr esto con el archivo.'); process.exit(1); }
}
if (correr('ffmpeg', ['-version']).error) { console.error(`Falta ffmpeg. Instálalo con: ${INSTALAR().ffmpeg}`); process.exit(1); }

const DUR = parseFloat(sonda(['-show_entries', 'format=duration'])) || 0;
const TAM = sonda(['-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate']);
const AUD = sonda(['-select_streams', 'a:0', '-show_entries', 'stream=codec_name']);
const datos = `duración: ${DUR} s\nvideo (ancho,alto,cuadros por segundo): ${TAM}\naudio: ${AUD || 'sin audio'}\n`;
writeFileSync(join(OUT, 'datos.txt'), datos); process.stdout.write(datos);

const ff = a => { const r = correr('ffmpeg', ['-y', '-loglevel', 'error', ...a]); if (r.status !== 0) console.error((r.stderr || '').trim()); return r.status === 0; };
// un cuadro cada 2 s, en filas de 8
const N = Math.floor(DUR / 2) + 1, FILAS = Math.floor((N + 7) / 8);
ff(['-i', REF, '-vf', `fps=1/2,scale=240:-1,tile=8x${FILAS}`, '-frames:v', '1', join(OUT, 'hoja-completa.jpg')]);
// los primeros 3 s, 10 cuadros por segundo: ahí está lo que frena el dedo
ff(['-t', '3', '-i', REF, '-vf', 'fps=10,scale=270:-1,tile=10x3', '-frames:v', '1', join(OUT, 'hoja-apertura.jpg')]);
console.log(`hojas -> ${join(OUT, 'hoja-completa.jpg')} y ${join(OUT, 'hoja-apertura.jpg')}  (ábrelas y míralas)`);

if (!AUD) { console.log('La referencia no trae audio: no hay nada que transcribir.'); process.exit(0); }
const wav = join(OUT, 'audio.wav'), txt = join(OUT, 'transcripcion.txt');
ff(['-i', REF, '-vn', '-ar', '16000', '-ac', '1', wav]);
rmSync(txt, { force: true });
console.log('Transcribiendo lo que dice (la primera vez descarga el modelo)…');
const r = transcribir(wav, { dir: OUT, txt: true });
if (r.ok) { renameSync(r.archivo, txt); console.log('transcripción -> ' + txt); }
else console.log('No pude transcribir en esta computadora. Si la referencia solo trae música, no hace falta; si habla, pídele a la persona que te diga qué dice.\n  (' + String(r.error).split('\n').pop() + ')');
