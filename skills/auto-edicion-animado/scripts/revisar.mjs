#!/usr/bin/env node
// revisar.mjs — la revisión mecánica del MP4 final, antes de que lo veas.
// Tomado de Keyframes «Full Visual» (check.py render), adaptado: cada falla es un defecto que ya nos devolvieron.
//
// Uso: node revisar.mjs <reel.mp4> [--guion guion.txt | pieza.src.html] [--quieto 1.2]
//
// Mide:
//   1. QUIETO   el tramo más largo sin que se mueva nada (subtítulo incluido). Falla si pasa de 1,2 s.
//               «Nada se queda quieto más de un segundo»: un plano sostenido sigue vivo (empuje lento, luz que viaja).
//   2. VACÍO    cuadros con el escenario pelado (fondo liso, sin dibujo) en mitad del reel. Falla con 2 o más seguidos:
//               un cambio de escena nunca pasa por fondo vacío.
//   3. GOLPE    el cuadro 0 va lleno y entre 0 y 2 s algo cambia fuerte (regla de edición del 18-oct).
//   4. RITMO    con --guion: palabras por segundo. Solo informa; compáralo con el molde aprobado (problema-6).
// Además deja apertura.jpg (0 · 0,5 · 1 · 1,5 · 2 s) junto al MP4 para mirarla con Read.
//
// Sale con código 1 si algo marca FALLA. AVISO es criterio: léelo, decide y sigue.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';

const args = process.argv.slice(2);
const mp4 = args.find(a => !a.startsWith('--') && /\.(mp4|mov|webm)$/i.test(a));
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
if (!mp4 || !existsSync(mp4)) { console.error('uso: node revisar.mjs <reel.mp4> [--guion guion.txt | pieza.src.html] [--quieto 1.2]'); process.exit(2); }
const MAX_QUIETO = +opt('--quieto', 1.2);
const W = 90, H = 160, FPS = 30;
let fallas = 0;
const di = (nivel, msg) => { if (nivel === 'FALLA') fallas++; console.log(`${nivel.padEnd(5)} ${msg}`); };
const t2 = s => s.toFixed(2).replace('.', ',');

const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', mp4, '-vf', `fps=${FPS},scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
const N = Math.floor(raw.length / (W * H));
const px = (f, i) => raw[f * W * H + i];
const media = new Float64Array(N), desv = new Float64Array(N);
// el escenario: sin la franja de arriba (gancho/subtítulo) ni la de abajo (zona de Instagram)
const y0 = Math.round(H * 250 / 1920), y1 = Math.round(H * 1470 / 1920);
for (let f = 0; f < N; f++) {
  let s = 0, s2 = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const v = px(f, y * W + x); s += v; s2 += v * v; n++; }
  media[f] = s / n; desv[f] = Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2));
}
const cambio = new Float64Array(N);   // cambio medio del cuadro entero respecto al anterior
for (let f = 1; f < N; f++) { let d = 0; for (let i = 0; i < W * H; i++) d += Math.abs(px(f, i) - px(f - 1, i)); cambio[f] = d / (W * H); }

// 1. QUIETO
let peor = [0, 0], ini = null;
for (let f = 1; f <= N; f++) {
  const quieto = f < N && cambio[f] < 0.12;
  if (quieto && ini === null) ini = f;
  else if (!quieto && ini !== null) { const largo = (f - ini) / FPS; if (f < N - 2 && largo > peor[0])   // el último plano puede sostenerse hasta el final
      peor = [largo, ini / FPS]; ini = null; }
}
di(peor[0] > MAX_QUIETO ? 'FALLA' : 'ok', `tramo más largo sin movimiento: ${t2(peor[0])} s en ${t2(peor[1])} s (límite ${t2(MAX_QUIETO)} s)` +
  (peor[0] > MAX_QUIETO ? '. Dale vida: empuje lento, luz que viaja, una pieza que trabaja.' : ''));

// 2. VACÍO
let racha = 0, peorV = [0, 0];
for (let f = 0; f < N; f++) {
  if (desv[f] < 2.0) { racha++; if (racha > peorV[0]) peorV = [racha, (f - racha + 1) / FPS]; } else racha = 0;
}
di(peorV[0] > 1 ? 'FALLA' : 'ok', peorV[0] > 1
  ? `${peorV[0]} cuadros seguidos con el escenario vacío desde ${t2(peorV[1])} s: el cambio de escena no puede pasar por fondo pelado`
  : 'ningún cambio de escena pasa por fondo vacío');

// 2b. LLENO: el tercio de abajo del escenario (y 1080–1470) liso en buena parte del reel = medio escenario vacío
const ya = Math.round(H * 1080 / 1920);
let vacios = 0;
for (let f = 0; f < N; f++) {
  let s = 0, s2 = 0, n = 0;
  for (let y = ya; y < y1; y++) for (let x = 0; x < W; x++) { const v = px(f, y * W + x); s += v; s2 += v * v; n++; }
  if (Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2)) < 2.0) vacios++;
}
const pv = vacios / N;
di(pv > .5 ? 'AVISO' : 'ok', `la parte de abajo del escenario está vacía en el ${Math.round(pv * 100)} % del reel` +
  (pv > .5 ? ': llena el escenario (frente, protagonista, fondo) o agranda la escena' : ''));

// 3. GOLPE
const f2 = Math.min(N - 1, 2 * FPS);
let mov2 = 0; for (let f = 1; f <= f2; f++) mov2 += cambio[f];
let lejos = 0; for (let i = 0; i < W * H; i++) lejos += Math.abs(px(f2, i) - px(0, i)); lejos /= W * H;
di(desv[0] < 6 ? 'FALLA' : 'ok', `cuadro 0: ${desv[0] < 6 ? 'casi vacío (arranca en fondo liso o con fundido)' : 'lleno'} (contraste ${desv[0].toFixed(1)})`);
di(lejos < 4 && mov2 / f2 < 1 ? 'FALLA' : (lejos < 8 ? 'AVISO' : 'ok'),
  `golpe 0-2 s: el cuadro de los 2 s difiere ${lejos.toFixed(1)} del cuadro 0, movimiento medio ${(mov2 / f2).toFixed(2)}` +
  (lejos < 8 ? '. Mira apertura.jpg: ¿algo grande cruza, cae o cambia antes de 2 s?' : ''));

// 4. RITMO
const g = opt('--guion');
if (g && existsSync(g)) {
  let texto = readFileSync(g, 'utf8');
  if (/\.html$/i.test(g)) texto = [...texto.matchAll(/txt:\s*'((?:[^'\\]|\\.)*)'/g)].map(m => m[1]).join(' ');   // las frases de LINEAS
  const palabras = texto.replace(/\*/g, '').split(/\s+/).filter(w => /\p{L}|\d/u.test(w)).length;
  di('info', `ritmo: ${palabras} palabras en ${t2(dur)} s = ${(palabras / dur).toFixed(2).replace('.', ',')} palabras por segundo`);
}

// 5. LETRA: con --guion pieza.src.html, los tamaños de letra escritos en la pieza. Menos de 32 px (a 1080 de ancho) es
//    textura en un celular, no algo que se lee. Si es textura a propósito, termina la línea con // textura
if (g && /\.html$/i.test(g)) {
  readFileSync(g, 'utf8').split('\n').forEach((linea, n) => {
    if (/\/\/\s*textura/.test(linea)) return;
    for (const m of linea.matchAll(/(\d{1,3})px\b|\btx\([^;]*?,\s*[^,]+,\s*[^,]+,\s*(\d{1,3})\s*[,)]/g)) {
      const tam = +(m[1] || m[2]);
      if (tam >= 8 && tam < 32) di('AVISO', `letra de ${tam} px en la línea ${n + 1} de la pieza: en un celular no se lee. Agrándala o termina la línea con // textura`);
    }
  });
}

// la tira de la apertura, para mirarla
const tira = join(dirname(mp4), 'apertura.jpg');
execFileSync('ffmpeg', ['-v', 'error', '-y', ...[0, 0.5, 1, 1.5, 2].flatMap(t => ['-ss', String(t), '-i', mp4]),
  '-filter_complex', [0, 1, 2, 3, 4].map(i => `[${i}:v]trim=end_frame=1,scale=270:-2[v${i}]`).join(';') + ';' + [0, 1, 2, 3, 4].map(i => `[v${i}]`).join('') + 'hstack=5',
  '-frames:v', '1', tira]);
console.log(`\n${basename(mp4)}: ${t2(dur)} s · ${fallas ? fallas + ' falla(s)' : 'pasa'} · mira ${tira}`);
process.exit(fallas ? 1 : 0);
