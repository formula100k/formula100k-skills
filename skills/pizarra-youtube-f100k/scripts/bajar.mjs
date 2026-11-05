#!/usr/bin/env node
// bajar.mjs — baja cada video de YouTube (720p máx), sus subtítulos automáticos y deja <id>.txt con bloques de 20 s y su minuto.
// Uso: node bajar.mjs <carpeta> <id_youtube> [id2 ...]      (también acepta el link entero)
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { correr, uso } from './comun.mjs';

const [carpeta, ...ids] = uso('node bajar.mjs <carpeta> <id_youtube> [id2 ...]', 2);
const vid = join(carpeta, 'vid'); mkdirSync(vid, { recursive: true });
const espera = s => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, s * 1000);   // YouTube responde 429 si se piden subtítulos de corrido

// Subtítulos .vtt → «[mm:ss] texto» por bloques de 20 s, sin las líneas repetidas de los subtítulos automáticos.
function vttATexto(vtt) {
  const out = []; let ultimo = '';
  for (const blk of vtt.replace(/\r/g, '').split('\n\n')) {
    const m = blk.match(/(\d+):(\d+):(\d+)\.\d+ -->/); if (!m) continue;
    const t = +m[1] * 3600 + +m[2] * 60 + +m[3];
    const lineas = blk.split('\n').slice(1).map(l => l.replace(/<[^>]+>/g, '').trim()).filter(l => l && !l.includes('-->'));
    if (!lineas.length) continue;
    const txt = lineas.at(-1); if (txt === ultimo) continue; ultimo = txt; out.push([t, txt]);
  }
  const res = []; let cur = null, buf = [];
  const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  for (const [t, x] of out) { const b = Math.floor(t / 20) * 20; if (b !== cur) { if (buf.length) res.push(`[${mmss(cur)}] ${buf.join(' ')}`); cur = b; buf = []; } buf.push(x); }
  if (buf.length) res.push(`[${mmss(cur)}] ${buf.join(' ')}`);
  return res.join('\n') + '\n';
}

for (const entrada of ids) {
  const id = (entrada.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/) || [, entrada])[1];
  const url = `https://www.youtube.com/watch?v=${id}`;
  correr('yt-dlp', ['-q', '--no-warnings', '-f', 'bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720]', '--merge-output-format', 'mp4', '-o', join(vid, `${id}.%(ext)s`), '--write-info-json', url]);
  espera(4);
  correr('yt-dlp', ['-q', '--no-warnings', '--skip-download', '--write-auto-subs', '--sub-langs', 'en-orig,es-orig', '--sub-format', 'vtt', '-o', join(vid, `${id}.%(ext)s`), url], { opcional: true });
  const vtt = readdirSync(vid).find(f => f.startsWith(id + '.') && f.endsWith('.vtt'));
  if (vtt) writeFileSync(join(vid, id + '.txt'), vttATexto(readFileSync(join(vid, vtt), 'utf8')));
  else console.log(`(sin subtítulos para ${id}: si YouTube dio 429, espera un rato y vuelve a correr solo este id)`);
  const info = join(vid, id + '.info.json');
  if (existsSync(info)) { const j = JSON.parse(readFileSync(info, 'utf8')); console.log(`${id} | ${j.title} | ${j.channel} | ${j.upload_date} | ${Math.floor((j.duration || 0) / 60)} min`); }
  espera(4);
}
