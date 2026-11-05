#!/usr/bin/env node
// Une una voz generada frase por frase (voz/01.mp3, 02.mp3… en el orden del guion) en assets/voz.wav.
//   node unir-voz.mjs [carpeta=voz] [pausa=0.14] [velocidad=1]   (velocidad 1.1 = 10 % más rápido, sin cambiar el tono)
// Recorta el silencio de cada frase y deja una pausa corta entre una y otra. Después: node armar.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { paraLista } from "./sistema.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const carpeta = path.resolve(DIR, process.argv[2] || "voz"), pausa = parseFloat(process.argv[3] || "0.14"), vel = parseFloat(process.argv[4] || "1");
const archivos = fs.readdirSync(carpeta).filter((f) => /\.(mp3|wav|m4a)$/i.test(f)).sort();
if (!archivos.length) { console.error("No hay audios en " + carpeta); process.exit(1); }
const tmp = path.join(carpeta, ".tmp");
fs.mkdirSync(tmp, { recursive: true });
fs.mkdirSync(path.join(DIR, "assets"), { recursive: true });
const corte = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse";
const lista = archivos.map((f, i) => {
  const out = path.join(tmp, String(i).padStart(2, "0") + ".wav");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(carpeta, f), "-af", `${corte},atempo=${vel},apad=pad_dur=${pausa}`, "-ar", "44100", "-ac", "1", out]);
  return paraLista(out);
});
fs.writeFileSync(path.join(tmp, "lista.txt"), lista.join("\n"));
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(tmp, "lista.txt"), "-af", "adelay=100:all=1", path.join(DIR, "assets/voz.wav")]);
fs.rmSync(tmp, { recursive: true });
fs.rmSync(path.join(DIR, "assets/transcript.json"), { force: true });
console.log(`  Listo: ${archivos.length} frases → assets/voz.wav. Ahora: node armar.mjs`);
