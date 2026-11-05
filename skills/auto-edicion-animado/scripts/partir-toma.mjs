#!/usr/bin/env node
// partir-toma.mjs — la voz en UNA sola toma corrida, partida después por frase.
// Tomado de Keyframes «Full Visual» (voice.md: «one whole take, never spliced»): pedir la voz frase por frase deja la
// entonación suelta entre frases. Aquí se pide el guion entero en un solo audio y este script lo corta en los silencios
// entre frases, así el resto del camino (voz.sh de auto-edicion o voz.mjs de reel-explicado-animado) no cambia.
//
// Uso: node partir-toma.mjs <toma.mp3> <pieza.src.html> <carpeta-de-voz>
//   Escribe 01.mp3, 02.mp3… (uno por frase de LINEAS) en la carpeta, y partir-toma.json con dónde cortó cada una.
//   Después, en un proyecto de Auto-Edición: bash ~/.claude/skills/auto-edicion/scripts/voz.sh <proyecto>
// Whisper: usa whisper-cli si está con su modelo; si no, el mismo Whisper de Auto-Edición (uv + openai-whisper).
// Cómo: whisper-cli marca cada palabra con su tiempo; el guion se alinea palabra a palabra con lo que oyó (tolera
// cifras dichas en letras y palabras mal oídas) y cada corte cae en el centro del silencio entre la última palabra de
// una frase y la primera de la siguiente. Si un silencio mide menos de 0,08 s, avisa: ahí la frase quedó pegada.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';

const [toma, src, carpeta] = process.argv.slice(2);
if (!toma || !src || !carpeta) { console.error('uso: node partir-toma.mjs <toma.mp3> <pieza.src.html> <carpeta-de-voz>'); process.exit(1); }
const MODELO = [join(homedir(), '.cache/hyperframes/whisper/models/ggml-large-v3.bin')].find(existsSync);
const CLI = spawnSync('whisper-cli', ['--help'], { stdio: 'ignore' }).status !== null && MODELO;

// las frases: el txt de cada objeto del arreglo LINEAS
const fuente = readFileSync(src, 'utf8');
const ini0 = fuente.indexOf('const LINEAS = [');
if (ini0 < 0) { console.error('No encontré «const LINEAS = [» en la pieza.'); process.exit(1); }
const bloque = fuente.slice(ini0, fuente.indexOf('\n];', ini0) + 3);
const frases = [...bloque.matchAll(/txt:\s*'((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'"));
if (!frases.length) { console.error('No encontré frases (txt: \'…\') dentro de LINEAS.'); process.exit(1); }
const norm = w => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');
const guion = frases.flatMap((f, i) => f.replace(/\*/g, '').split(/\s+/).map(norm).filter(Boolean).map(w => ({ w, frase: i })));

// 1. whisper, palabra por palabra
const tmp = mkdtempSync(join(tmpdir(), 'toma-'));
const wav = join(tmp, 'toma.wav');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', toma, '-ac', '1', '-ar', '16000', wav]);
let oido;
if (CLI) {
  execFileSync('whisper-cli', ['-m', MODELO, '-f', wav, '-l', 'es', '-ml', '1', '-sow', '-oj', '-of', join(tmp, 'toma'), '-np'], { stdio: 'ignore' });
  oido = JSON.parse(readFileSync(join(tmp, 'toma.json'), 'utf8')).transcription
    .map(s => ({ w: norm(s.text), t: s.offsets.from / 1000, e: s.offsets.to / 1000 }));
} else {
  const py = 'import whisper,json,sys\nr=whisper.load_model("large-v3-turbo").transcribe(sys.argv[1],language="es",word_timestamps=True)\n' +
    'json.dump([{"w":w["word"],"t":w["start"],"e":w["end"]} for s in r["segments"] for w in s["words"]],open(sys.argv[2],"w"))';
  execFileSync('uv', ['run', '-q', '--with', 'openai-whisper', 'python', '-c', py, wav, join(tmp, 'toma.json')], { stdio: ['ignore', 'ignore', 'inherit'] });
  oido = JSON.parse(readFileSync(join(tmp, 'toma.json'), 'utf8')).map(x => ({ ...x, w: norm(x.w) }));
}
oido = oido.filter(x => x.w);

// 2. alinear guion ↔ lo oído (distancia de edición por palabra)
const A = guion.length, B = oido.length;
const D = Array.from({ length: A + 1 }, (_, i) => Int32Array.from({ length: B + 1 }, (_, j) => i + j));
const igual = (a, b) => a === b || (a.length > 3 && b.length > 3 && (a.startsWith(b) || b.startsWith(a)));
for (let i = 1; i <= A; i++) for (let j = 1; j <= B; j++)
  D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (igual(guion[i - 1].w, oido[j - 1].w) ? 0 : 1));
const par = new Array(A).fill(-1);
for (let i = A, j = B; i > 0 && j > 0;) {
  if (D[i][j] === D[i - 1][j - 1] + (igual(guion[i - 1].w, oido[j - 1].w) ? 0 : 1)) { par[i - 1] = j - 1; i--; j--; }
  else if (D[i][j] === D[i - 1][j] + 1) i--; else j--;
}
const aciertos = guion.filter((g, i) => par[i] >= 0 && igual(g.w, oido[par[i]].w)).length;

// 3. un corte entre cada par de frases
const ultimaOida = k => { let r = -1; guion.forEach((g, i) => { if (g.frase === k && par[i] >= 0) r = par[i]; }); return r; };
const primeraOida = k => guion.findIndex((g, i) => g.frase === k && par[i] >= 0);
const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', toma]).toString();
// whisper da tiempos de palabra aproximados (±0,2 s): el corte se lleva al silencio MEDIDO en el audio más cercano
const silOut = spawnSync('ffmpeg', ['-i', toma, '-af', 'silencedetect=n=-40dB:d=0.06', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
const sils = [...silOut.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map(m => [+m[1], +m[2]]);
// sin silencio entero (la voz encadena con coma), el corte va al punto MÁS CALLADO entre las dos palabras:
// energía en ventanas de 10 ms, suavizada a 30 ms. Whisper suele cerrar la última palabra antes de tiempo.
const SR = 16000, pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', toma, '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { maxBuffer: 1 << 30 });
const muestras = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1), VEN = SR / 100;
const ener = Float64Array.from({ length: Math.floor(muestras.length / VEN) }, (_, i) => { let s = 0; for (let j = i * VEN; j < (i + 1) * VEN; j++) s += muestras[j] * muestras[j]; return s / VEN; });
const masCallado = (desde, hasta) => {
  let mejor = -1, min = Infinity;
  for (let i = Math.max(1, Math.round(desde * 100)); i < Math.min(ener.length - 1, Math.round(hasta * 100)); i++) {
    const e = ener[i - 1] + ener[i] + ener[i + 1]; if (e < min) { min = e; mejor = i; }
  }
  return mejor < 0 ? (desde + hasta) / 2 : (mejor + 0.5) / 100;
};
const cortes = [0];
for (let k = 0; k < frases.length - 1; k++) {
  const a = ultimaOida(k), bi = primeraOida(k + 1);
  if (a < 0 || bi < 0) { console.error(`No pude ubicar el final de la frase ${k + 1} o el inicio de la ${k + 2}: revisa que la toma diga el guion.`); process.exit(1); }
  const fin = oido[a].e, ini = oido[par[bi]].t, aprox = (fin + ini) / 2;
  const cerca = sils.filter(([x, y]) => y > fin - 0.6 && x < ini + 0.6 && (x + y) / 2 > cortes.at(-1))
    .sort((p, q) => Math.abs((p[0] + p[1]) / 2 - aprox) - Math.abs((q[0] + q[1]) / 2 - aprox))[0];
  const corte = cerca ? (cerca[0] + cerca[1]) / 2 : masCallado(Math.max(fin - 0.05, cortes.at(-1) + 0.2), Math.max(ini, fin) + 0.3);
  if (!cerca) console.warn(`nota frase ${k + 1} → ${k + 2}: sin pausa entera; corto en el punto más callado (${corte.toFixed(2)} s, whisper decía ${aprox.toFixed(2)}).`);
  cortes.push(Math.max(cortes.at(-1), corte));
}
cortes.push(dur);

// 4. escribir los pedazos
mkdirSync(carpeta, { recursive: true });
const salida = frases.map((f, k) => {
  const nombre = String(k + 1).padStart(2, '0') + '.mp3';
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', toma, '-ss', cortes[k].toFixed(3), '-to', cortes[k + 1].toFixed(3), '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '192k', join(carpeta, nombre)]);
  return { frase: k + 1, archivo: nombre, desde: +cortes[k].toFixed(3), hasta: +cortes[k + 1].toFixed(3), texto: f };
});
writeFileSync(join(carpeta, 'partir-toma.json'), JSON.stringify({ toma, aciertos: `${aciertos}/${A}`, frases: salida }, null, 2));
console.log(`${frases.length} frases cortadas de una toma de ${dur.toFixed(1)} s · ${aciertos}/${A} palabras del guion reconocidas` +
  (aciertos / A < 0.85 ? ' · AVISO: menos del 85 %, revisa que la toma diga este guion' : ''));
