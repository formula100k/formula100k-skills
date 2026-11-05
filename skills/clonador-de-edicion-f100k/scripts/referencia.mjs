#!/usr/bin/env node
// referencia.mjs — baja el video de referencia de un estilo y lo deja listo para mirarlo. Igual en Mac y en Windows.
// Uso: node referencia.mjs <url-o-archivo> <carpeta-destino>
//   Acepta un .mp4 directo (los estilos del catálogo), un link de Instagram/TikTok/YouTube (necesita yt-dlp) o un archivo local.
// Deja en la carpeta: referencia.mp4, hoja.jpg (un cuadro cada 2 s), cuadros/ (6 cuadros grandes) y datos.txt (duración y medidas).
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { INSTALAR } from './sistema.mjs';

const [src, outArg] = process.argv.slice(2);
if (!src || !outArg) { console.error('uso: node referencia.mjs <url-o-archivo> <carpeta-destino>'); process.exit(1); }
const out = resolve(outArg), video = join(out, 'referencia.mp4');
mkdirSync(join(out, 'cuadros'), { recursive: true });
const correr = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.error) { console.error(`Falta ${cmd}. Instálalo con: ${INSTALAR()[cmd] || INSTALAR().ffmpeg}`); process.exit(1); }
  if (r.status !== 0) { console.error(`${cmd} falló:\n${(r.stderr || '').trim().split('\n').slice(-5).join('\n')}`); process.exit(1); }
  return r.stdout || '';
};

if (existsSync(src)) copyFileSync(src, video);
else if (/\.mp4($|\?)/i.test(src) || /static-public-media/.test(src)) {
  const r = await fetch(src);
  if (!r.ok) { console.error(`No pude bajar ${src} (${r.status}).`); process.exit(1); }
  writeFileSync(video, Buffer.from(await r.arrayBuffer()));
} else {
  correr('yt-dlp', ['-q', '-f', 'mp4/best', '-o', join(out, 'referencia.%(ext)s'), src]);
  if (!existsSync(video)) {
    const bajado = readdirSync(out).find(f => f.startsWith('referencia.'));
    if (!bajado) { console.error('yt-dlp no dejó ningún video.'); process.exit(1); }
    correr('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(out, bajado), video]);
  }
}

const dur = parseFloat(correr('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]));
const dim = correr('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=s=x:p=0', video]).trim();
const audio = correr('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', video]).trim().split('\n')[0];
const datos = `duración: ${dur.toFixed(1)} s\nmedidas: ${dim}\naudio: ${audio || 'sin audio'}\n`;
writeFileSync(join(out, 'datos.txt'), datos);
const n = Math.max(1, Math.floor(dur / 2)), cols = 6, filas = Math.ceil(n / cols);
correr('ffmpeg', ['-loglevel', 'error', '-y', '-i', video, '-vf', `fps=1/2,scale=270:-2,tile=${cols}x${filas}`, '-frames:v', '1', join(out, 'hoja.jpg')]);
for (let i = 0; i < 6; i++) {
  const t = (dur * (i + 0.5) / 6).toFixed(2);
  correr('ffmpeg', ['-loglevel', 'error', '-y', '-ss', t, '-i', video, '-frames:v', '1', '-vf', 'scale=540:-2', join(out, 'cuadros', `${i + 1}.jpg`)]);
}
console.log(datos + `listo -> ${join(out, 'hoja.jpg')} y ${join(out, 'cuadros')} (1..6.jpg)`);
