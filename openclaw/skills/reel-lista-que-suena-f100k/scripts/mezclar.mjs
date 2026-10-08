#!/usr/bin/env node
// Coloca los fragmentos de audio en su segundo y saca el MP4 final (voz + fragmentos).
//   node mezclar.mjs <carpeta> [--audios <otra carpeta>] [--permitir-faltantes]
//
// Lee <carpeta>/audios/01.mp3, 02.mp3 … en el orden de la tabla de montaje. A cada uno:
//   lo recorta al largo del fragmento desde `inicio` (config.js, por ítem), le pone fundido de entrada y salida,
//   lo iguala a `mezcla.bajoLaVoz` dB por debajo de la voz y lo coloca en su segundo.
// Si un fragmento llega a pisar la voz, además se agacha solo mientras ella habla.
// Necesita <archivo>.mp4 (render.mjs) y pista-voz.wav (voz.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { carpeta, leerConfig, leerTiempos, items, buscarAudio, ff, duracion, volumenMedio, seg } from './comun.mjs';

const argv = process.argv.slice(2);
const dir = carpeta(argv);
const C = leerConfig(dir), T = leerTiempos(dir), IT = items(C, T), F = T.frag, M = C.mezcla;
const iA = argv.indexOf('--audios');
const audios = iA >= 0 ? path.resolve(argv[iA + 1]) : path.join(dir, 'audios');
const mp4 = path.join(dir, C.archivo + '.mp4'), voz = path.join(dir, 'pista-voz.wav');
for (const p of [mp4, voz]) if (!fs.existsSync(p)) { console.error(`Falta ${path.basename(p)}. Corre antes voz.mjs y render.mjs.`); process.exit(1); }

const usados = [], faltan = [];
for (const it of IT) {
  const a = buscarAudio(audios, it.num);
  if (!a) { faltan.push(it); continue; }
  const largo = duracion(a);
  if (largo < it.inicio + F - 0.05) console.log(`⚠ ${path.basename(a)} dura ${seg(largo)} s y se le pide desde ${seg(it.inicio)} s: el fragmento ${it.num} quedará corto.`);
  usados.push({ ...it, a });
}
if (!usados.length) { console.error(`No hay audios en ${audios}. Se esperan ${IT.map(i => i.num + '.mp3').slice(0, 3).join(', ')}… (mira MONTAJE.md).`); process.exit(1); }
if (faltan.length && !argv.includes('--permitir-faltantes')) {
  console.error(`Faltan ${faltan.length} audios: ${faltan.map(i => i.num + ' (' + i.nombre + ')').join(', ')}.\nPonlos en ${audios} o repite con --permitir-faltantes para dejar esos huecos en silencio.`);
  process.exit(1);
}

// Nivel de la voz medido solo donde hay voz (sin los silencios entre frases).
const nivelVoz = volumenMedio(voz, { filtroPrevio: 'silenceremove=stop_periods=-1:stop_duration=0.1:stop_threshold=-45dB' });
const objetivo = nivelVoz - M.bajoLaVoz;
const fd = Math.min(M.fundido, F / 2);
const args = ['-i', voz], filtros = ['[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[voz][llave]'];
usados.forEach((u, i) => {
  u.nivel = volumenMedio(u.a, { desde: u.inicio, dura: F, filtroPrevio: 'aformat=channel_layouts=stereo' });
  u.ganancia = u.nivel <= -90 ? 0 : objetivo - u.nivel;
  args.push('-i', u.a);
  filtros.push(`[${i + 1}:a]atrim=start=${u.inicio}:duration=${F},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,` +
    `volume=${u.ganancia.toFixed(2)}dB,afade=t=in:st=0:d=${fd},afade=t=out:st=${(F - fd).toFixed(3)}:d=${fd},adelay=${Math.round(u.entra * 1000)}:all=1[m${i}]`);
});
filtros.push(usados.map((_, i) => `[m${i}]`).join('') + `amix=inputs=${usados.length}:normalize=0,apad=whole_dur=${T.dur},atrim=duration=${T.dur}[musica]`);
filtros.push('[musica][llave]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=250[agachada]');
filtros.push('[agachada]asplit=2[sola][paramezcla]');
filtros.push('[voz][paramezcla]amix=inputs=2:normalize=0,alimiter=limit=0.95[final]');
const pistaMusica = path.join(dir, 'pista-musica.wav'), pistaFinal = path.join(dir, 'pista-final.wav');
ff([...args, '-filter_complex', filtros.join(';'), '-map', '[sola]', '-t', String(T.dur), '-ar', '48000', pistaMusica,
  '-map', '[final]', '-t', String(T.dur), '-ar', '48000', pistaFinal]);
const final = path.join(dir, C.archivo + '-con-musica.mp4');
ff(['-i', mp4, '-i', pistaFinal, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(T.dur), '-movflags', '+faststart', final]);

console.log(`Voz: ${nivelVoz.toFixed(1)} dB de media · cada fragmento queda en ${objetivo.toFixed(1)} dB (${M.bajoLaVoz} dB por debajo)`);
console.log('# · archivo · desde (s) · entra (s) · sale (s) · ajuste');
usados.forEach(u => console.log(`${u.num} · ${path.basename(u.a)} · ${seg(u.inicio)} · ${seg(u.entra)} · ${seg(u.entra + F)} · ${u.ganancia >= 0 ? '+' : ''}${u.ganancia.toFixed(1)} dB${u.nivel <= -90 ? ' ⚠ ese tramo está en silencio' : ''}`));
if (faltan.length) console.log(`En silencio (sin audio): ${faltan.map(i => i.num).join(', ')}`);
console.log(`\nMP4 final: ${final}\nPistas sueltas: pista-musica.wav (solo fragmentos), pista-final.wav (voz + fragmentos)`);
console.log('Compruébalo con: node comprobar-mezcla.mjs "' + dir + '"');
console.log('Recuerda: la música comercial la consigue y la licencia quien publica; prueba en tu cuenta que Instagram no silencie el reel.');
