#!/usr/bin/env node
// Fabrica una toma de prueba para comprobar que el editor funciona, sin que
// tengas que grabar nada: una voz de tu propia compu dice unas frases con
// pausas largas y una frase repetida, sobre un fondo de color.
//
//   node toma-de-prueba.mjs ["<carpeta>"]   → <carpeta>/toma-de-prueba.mp4
//
// Mac: usa la voz en español del sistema (`say`).
// Windows: usa la voz en español de Windows (System.Speech).
// Si la compu no tiene voz en español, lo dice y sale con código 3: en ese
// caso graba tú 15 segundos con el celular o la cámara y edita ese video.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const win = process.platform === 'win32';

// [frase, segundos de silencio después]
export const FRASES = [
  ['Hola. Esta es una toma de prueba.', 1.6],
  ['Dejo pausas largas a propósito.', 2.2],
  ['El editor quita los... perdón, lo digo otra vez.', 1.2],
  ['El editor corta los silencios y las repeticiones.', 1.8],
  ['Si me escuchas de corrido, todo quedó funcionando.', 0.6],
];

function vozMac() {
  const r = spawnSync('say', ['-v', '?'], { encoding: 'utf8' });
  const voces = (r.stdout || '').split('\n').map((l) => l.match(/^(.+?)\s+(es[_-][A-Z]{2,3})\b/)).filter(Boolean).map((m) => m[1].trim());
  const preferidas = ['Paulina', 'Mónica', 'Monica', 'Angélica', 'Angelica', 'Jorge', 'Juan', 'Diego'];
  return preferidas.find((p) => voces.includes(p)) || voces[0] || null;
}

function hablarMac(tmp) {
  const voz = vozMac();
  if (!voz) return null;
  return FRASES.map(([frase], i) => {
    const salida = join(tmp, `frase${i}.aiff`);
    const r = spawnSync('say', ['-v', voz, '-o', salida, frase], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`La voz del sistema falló: ${r.stderr}`);
    return salida;
  });
}

function hablarWindows(tmp) {
  const salidas = FRASES.map((_, i) => join(tmp, `frase${i}.wav`));
  const lineas = FRASES.map(([frase], i) => `$s.SetOutputToWaveFile('${salidas[i].replace(/'/g, "''")}'); $s.Speak('${frase.replace(/'/g, "''")}')`);
  const guion = [
    'Add-Type -AssemblyName System.Speech',
    '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
    "$v = $s.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -like 'es*' } | Select-Object -First 1",
    'if (-not $v) { exit 3 }',
    '$s.SelectVoice($v.VoiceInfo.Name)',
    ...lineas,
    '$s.Dispose()',
  ].join('\r\n');
  const archivo = join(tmp, 'hablar.ps1');
  writeFileSync(archivo, `﻿${guion}`, 'utf8'); // con BOM: PowerShell 5 lee bien las tildes
  const r = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', archivo], { encoding: 'utf8' });
  if (r.status === 3) return null;
  if (r.status !== 0) throw new Error(`La voz de Windows falló: ${r.stderr || r.stdout}`);
  return salidas;
}

export function crearToma(carpeta) {
  mkdirSync(carpeta, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), 'toma-'));
  try {
    const audios = win ? hablarWindows(tmp) : hablarMac(tmp);
    if (!audios) return null;
    // Cada frase con su silencio al final, luego todas en fila sobre un fondo
    // de color con una barra que avanza (así los cortes se notan a la vista).
    const entradas = audios.flatMap((a) => ['-i', a]);
    const pasos = audios.map((_, i) => `[${i}:a]aresample=44100,aformat=channel_layouts=mono,apad=pad_dur=${FRASES[i][1]}[a${i}]`);
    const fila = `${audios.map((_, i) => `[a${i}]`).join('')}concat=n=${audios.length}:v=0:a=1[voz]`;
    const fondo = "color=c=0x2F5D50:s=1080x1920:r=30,drawbox=x='mod(t*160,1080)':y=900:w=120:h=120:color=white@0.9:t=fill[v]";
    const salida = join(carpeta, 'toma-de-prueba.mp4');
    const r = spawnSync('ffmpeg', ['-y', '-v', 'error', ...entradas, '-filter_complex', [...pasos, fila, fondo].join(';'),
      '-map', '[v]', '-map', '[voz]', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', salida], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`ffmpeg no pudo armar la toma de prueba: ${r.stderr}`);
    return salida;
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  const carpeta = resolve((process.argv[2] || join(homedir(), 'Documents', 'mis-videos-editados', 'prueba')).replace(/^~/, homedir()));
  try {
    const toma = crearToma(carpeta);
    if (!toma) {
      console.error('Tu compu no tiene una voz en español instalada, así que no pude fabricar la toma de prueba.\nGraba 15 segundos hablando (celular o cámara de la compu), con un par de pausas largas, y usa ese video para la prueba.');
      process.exit(3);
    }
    console.log(toma);
  } catch (e) { console.error(e.message); process.exit(1); }
}
