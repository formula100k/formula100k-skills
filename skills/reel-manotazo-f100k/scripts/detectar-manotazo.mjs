#!/usr/bin/env node
// Encuentra el segundo del manotazo en un clip: es el pico de diferencia entre cuadros consecutivos.
// Uso:  node detectar-manotazo.mjs <clip.mp4> [--desde 1] [--hasta 6] [--salida carpeta]
// Busca entre --desde (por defecto 1 s) y --hasta (por defecto medio segundo antes del final).
// Deja <salida>/manotazo-cuadros.jpg con 3 cuadros (el anterior, el del manotazo, el siguiente) para confirmarlo a ojo.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const clip = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1]?.startsWith("--") !== true) ?? args[0];
const opt = (nombre, def) => { const i = args.indexOf("--" + nombre); return i >= 0 ? args[i + 1] : def; };
if (!clip || clip.startsWith("--") || !existsSync(clip)) {
  console.error("Uso: node detectar-manotazo.mjs <clip.mp4> [--desde s] [--hasta s] [--margen s] [--salida carpeta]");
  process.exit(1);
}
const correr = (cmd, a) => spawnSync(cmd, a, { encoding: "utf8", maxBuffer: 1 << 28 });
if (correr("ffmpeg", ["-version"]).status !== 0) { console.error("Falta ffmpeg (Mac: brew install ffmpeg · Windows: winget install -e --id Gyan.FFmpeg)."); process.exit(1); }

// datos del clip
const sonda = correr("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate,width,height,duration:format=duration", "-of", "json", clip]);
const info = JSON.parse(sonda.stdout || "{}");
const [fn, fd] = (info.streams?.[0]?.r_frame_rate ?? "30/1").split("/").map(Number);
const fps = fn / (fd || 1);
const dur = Number(info.streams?.[0]?.duration) || Number(info.format?.duration ?? 0);
const ancho = info.streams?.[0]?.width, altoV = info.streams?.[0]?.height;
const tieneAudio = correr("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", clip]).stdout.trim() !== "";

// por defecto no busca en el primer segundo (ahí la gente se acomoda tras dar a grabar, y el texto «antes» necesita ese tiempo para leerse)
// ni en el último medio segundo (ahí se estira para detener la grabación)
const margen = Number(opt("margen", 0.5));
const desde = Number(opt("desde", 1));
const hasta = Number(opt("hasta", Math.max(desde, dur - margen)));

// diferencia entre cada cuadro y el anterior, sobre una copia reducida en grises (rápido y sin ruido de detalle)
const r = correr("ffmpeg", ["-v", "error", "-i", clip, "-an", "-vf", "scale=64:-2,format=gray,select='gte(scene,0)',metadata=print:file=-", "-f", "null", "-"]);
const cuadros = [];
let t = null;
for (const linea of r.stdout.split("\n")) {
  const m1 = linea.match(/pts_time:([\d.]+)/);
  if (m1) t = Number(m1[1]);
  const m2 = linea.match(/scene_score=([\d.]+)/);
  if (m2 && t !== null) cuadros.push({ t, d: Number(m2[1]) });
}
if (!cuadros.length) { console.error("No pude leer los cuadros del clip."); process.exit(1); }

const zona = cuadros.filter((c) => c.t >= desde && c.t <= hasta);
if (!zona.length) { console.error("No hay cuadros entre --desde y --hasta."); process.exit(1); }
// candidatos: los picos más altos, separados al menos 0,4 s entre sí
const orden = [...zona].sort((a, b) => b.d - a.d);
const picos = [];
for (const c of orden) { if (picos.every((p) => Math.abs(p.t - c.t) >= 0.4)) picos.push(c); if (picos.length === 3) break; }
const pico = picos[0];
const media = zona.reduce((s, c) => s + c.d, 0) / zona.length;
// el gesto completo: cuadros seguidos alrededor del pico que siguen moviéndose fuerte
const umbral = Math.max(pico.d * 0.35, media * 2);
const i0 = cuadros.indexOf(pico);
let a = i0, b = i0;
while (a > 0 && cuadros[a - 1].d >= umbral) a--;
while (b < cuadros.length - 1 && cuadros[b + 1].d >= umbral) b++;

// hoja con 3 cuadros: anterior · manotazo · siguiente
const salida = resolve(opt("salida", dirname(resolve(clip))));
mkdirSync(salida, { recursive: true });
const hoja = join(salida, "manotazo-cuadros.jpg");
const n = Math.round(pico.t * fps);
const h = correr("ffmpeg", ["-v", "error", "-y", "-i", clip, "-vf", `select='between(n,${n - 1},${n + 1})',scale=360:-2,tile=3x1:padding=8:color=white`, "-frames:v", "1", "-update", "1", hoja]);

const f = (x) => x.toFixed(3);
console.log(`Clip: ${ancho}×${altoV} · ${fps.toFixed(2)} fps · ${f(dur)} s · audio: ${tieneAudio ? "sí" : "NO tiene"}`);
if (ancho && altoV && ancho > altoV) console.log("OJO: el clip es horizontal. El reel es vertical (9:16): se va a recortar por los lados.");
console.log(`Busqué entre ${f(desde)} y ${f(hasta)} s (cámbialo con --desde y --hasta).`);
console.log(`\nMANOTAZO: ${f(pico.t)} s   (cuadro ${n}, diferencia ${pico.d.toFixed(3)}; el movimiento fuerte va de ${f(cuadros[a].t)} a ${f(cuadros[b].t)} s)`);
if (pico.d < media * 4 || pico.d < 0.03) console.log("OJO: el pico es débil. Puede que el gesto no sea lo bastante brusco; mira la hoja y, si no convence, pon el segundo a mano.");
if (picos.length > 1) console.log("Otros candidatos: " + picos.slice(1).map((p) => `${f(p.t)} s (${p.d.toFixed(3)})`).join(" · "));
console.log(h.status === 0 ? `\nMira la hoja para confirmarlo: ${hoja}\n  izquierda = cuadro anterior · centro = cuadro del manotazo (aquí cambia todo) · derecha = cuadro siguiente` : "\nNo pude escribir la hoja de cuadros.");
console.log(`\nPara config.js:\n  manotazo: ${f(pico.t)},\n  duracion: ${(Math.floor(dur * fps) / fps).toFixed(2)},   // o menos, si quieres cortar el final`);
