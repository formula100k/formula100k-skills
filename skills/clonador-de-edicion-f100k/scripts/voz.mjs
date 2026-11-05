#!/usr/bin/env node
// voz.mjs — pone la voz en la pieza (una frase = una escena).
// Uso: node voz.mjs <pieza.src.html> <carpeta-de-voz> <salida.mp4>   (igual en Mac y en Windows)
//   La carpeta trae un audio por frase, en orden: 01.mp3, 02.mp3… (mp3, wav, m4a o aiff).
// Qué hace: recorta el silencio de cada audio, mide cuánto dura, escribe esa duración en el `d` de cada frase de LINEAS,
// arma la pieza, la renderiza y le pega la voz alineada al inicio de cada escena.
import { readFileSync, writeFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const [src, carpeta, salida] = process.argv.slice(2);
if (!src || !carpeta || !salida) { console.error('uso: node voz.mjs <pieza.src.html> <carpeta-de-voz> <salida.mp4>'); process.exit(1); }
const SKILL = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'voz-'));
const audios = readdirSync(carpeta).filter(f => /^\d+\.(mp3|wav|m4a|aiff)$/i.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
let html = readFileSync(src, 'utf8');
const n = (html.match(/\{ d: [\d.]+, txt:/g) || []).length;
if (audios.length !== n) { console.error(`La pieza tiene ${n} frases y la carpeta ${audios.length} audios: deben coincidir.`); process.exit(1); }
const pausa = +(html.match(/const PAUSA = ([\d.]+)/) || [0, .3])[1];
// 1. recortar silencios y medir
const durs = audios.map((f, i) => {
  const out = join(tmp, String(i).padStart(2, '0') + '.wav');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(carpeta, f), '-af',
    'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '44100', '-ac', '1', out]);
  return +(+execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString()).toFixed(2);
});
// 2. escribir las duraciones en la pieza
let k = 0; html = html.replace(/\{ d: [\d.]+, txt:/g, () => `{ d: ${durs[k++]}, txt:`);
writeFileSync(src, html);
const armada = join(dirname(resolve(src)), 'pieza.html');
writeFileSync(armada, html.replace('<script src="../nucleo/nucleo.js"></script>', () => '<script>\n' + readFileSync(join(SKILL, 'nucleo/nucleo.js'), 'utf8') + '\n</script>'));
// 3. la pista de voz, cada frase en su inicio
let a = 0; const ini = durs.map(d => { const r = a; a += d + pausa; return r; });
const voz = join(tmp, 'voz.m4a');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...durs.flatMap((_, i) => ['-i', join(tmp, String(i).padStart(2, '0') + '.wav')]), '-filter_complex',
  ini.map((t, i) => `[${i}:a]adelay=${Math.round(t * 1000)}:all=1[a${i}]`).join(';') + ';' + ini.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${ini.length}:normalize=0,loudnorm=I=-16:TP=-1.5[o]`,
  '-map', '[o]', '-c:a', 'aac', '-b:a', '192k', voz]);
// 4. render + voz
const mudo = join(tmp, 'mudo.mp4');
execFileSync(process.execPath, [join(SKILL, 'scripts', 'renderizar.mjs'), armada, mudo], { stdio: ['ignore', 'ignore', 'inherit'] });
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mudo, '-i', voz, '-c:v', 'copy', '-c:a', 'copy', '-movflags', '+faststart', salida]);
console.log(`listo -> ${salida}\nduración total: ${(a + 1.6).toFixed(1)} s · frases: ${durs.join(', ')}`);
