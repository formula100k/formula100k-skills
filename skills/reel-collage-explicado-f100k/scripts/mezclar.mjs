#!/usr/bin/env node
// mezclar.mjs — voz + música (opcional) + efectos sobre un render mudo. Música a −17 dB con ducking bajo la voz,
// efectos a −5 dB, todo a −14 LUFS.
// Uso: node mezclar.mjs <mudo.mp4> <voz.wav|mp4> <musica.wav | -> <efectos.wav> <salida.mp4>
//   <voz> puede ser el MP4 que sale de voz.mjs: se le saca el audio. Con «-» en vez de la música, va sin música.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const a = process.argv.slice(2);
if (a.length !== 5) { console.error('uso: node mezclar.mjs <mudo.mp4> <voz> <musica.wav | -> <efectos.wav> <salida.mp4>'); process.exit(1); }
const [mudo, voz, mus, sfx, out] = a;
const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mudo]).toString().trim();
const fin = Math.max(0, dur - 2.5).toFixed(2), tmp = mkdtempSync(join(tmpdir(), 'mezcla-')), m4a = join(tmp, 'mezcla.m4a');
const conMusica = mus !== '-';
const filtro = conMusica
  ? `[0:a]aformat=channel_layouts=stereo,asplit=2[v][vsc];[1:a]atrim=0:${dur},volume=-17dB,afade=t=in:d=1.5,afade=t=out:st=${fin}:d=2.5[m];[m][vsc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[md];[2:a]volume=-5dB[s];[v][md][s]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[o]`
  : `[0:a]aformat=channel_layouts=stereo[v];[1:a]volume=-5dB[s];[v][s]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[o]`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', voz, ...(conMusica ? ['-i', mus] : []), '-i', sfx, '-filter_complex', filtro, '-map', '[o]', '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', m4a], { stdio: 'inherit' });
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mudo, '-i', m4a, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
rmSync(tmp, { recursive: true, force: true });
console.log('listo -> ' + out);
const lufs = (spawnSync('ffmpeg', ['-hide_banner', '-i', out, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '').match(/^\s+I:\s+(-?[\d.]+) LUFS/m);
if (lufs) console.log(`volumen: ${lufs[1]} LUFS`);
