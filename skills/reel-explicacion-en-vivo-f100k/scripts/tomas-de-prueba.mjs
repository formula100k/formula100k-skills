#!/usr/bin/env node
// tomas-de-prueba.mjs — fabrica tomas SUSTITUTAS para probar el montaje antes de grabar:
// una silueta dibujada sobre un fondo de color por bloque + las frases dichas con la voz de la computadora.
//
//   node tomas-de-prueba.mjs <carpeta>            escribe <carpeta>/tomas-de-prueba/toma-1.mp4, toma-2.mp4…
//   node montar.mjs <carpeta> --tomas=<carpeta>/tomas-de-prueba --salida=<carpeta>/prueba.mp4
//
// No es una persona ni su voz: sirve para ver el recorte, el salto a pantalla completa, el mosaico y los subtítulos.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sh, dur, arg, carpetaDe, leerGuion, renderizar, decir, dos, NUCLEO } from './comun.mjs';

const DIR = carpetaDe(), G = leerGuion(DIR), OUT = join(DIR, String(arg('salida', 'tomas-de-prueba'))), T = join(DIR, 'trabajo', 'tomas-de-prueba');
mkdirSync(OUT, { recursive: true }); mkdirSync(T, { recursive: true });
const V = { nombre: 'Paulina', ritmo: 185, ...(G.vozGuia || {}) }, nucleo = readFileSync(NUCLEO, 'utf8');
const ANTES = .7, ENTRE = .42, DESPUES = .6;

G.bloques.forEach((bl, b) => {
  // la voz: silencio, frase, silencio corto, frase… (como una toma dicha de corrido)
  const partes = [], sil = (s, n) => { const f = join(T, `s${n}.wav`); sh('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', String(s), f]); return f; };
  partes.push(sil(ANTES, 'a'));
  bl.frases.forEach((f, k) => { const aiff = join(T, `b${b}-${dos(k)}.aiff`), wav = join(T, `b${b}-${dos(k)}.wav`);
    decir(V.nombre, V.ritmo, G.palabraCta ? f.txt.split(G.palabraCta).join(G.palabraCta.toLowerCase()) : f.txt, aiff);
    sh('ffmpeg', ['-v', 'error', '-y', '-i', aiff, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '44100', '-ac', '1', wav]);
    partes.push(wav, sil(k === bl.frases.length - 1 ? DESPUES : ENTRE, k === bl.frases.length - 1 ? 'z' : 'm')); });
  const lista = join(T, `b${b}.txt`), voz = join(T, `b${b}.wav`); writeFileSync(lista, partes.map(p => `file '${p}'`).join('\n'));
  sh('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-ar', '44100', '-ac', '1', voz]);
  // la imagen: una silueta que se mece, con un fondo de color distinto por bloque (para que el recorte y el salto se noten)
  const tema = (G.temas || {})[bl.tema] || {}, pared = tema.ac || '#888888';
  const html = join(T, `b${b}.html`);
  writeFileSync(html, `<!doctype html><meta charset="utf-8"><canvas id="c"></canvas><script>const W=1080,H=1920,FPS=30;var DUR=${dur(voz).toFixed(2)};</script><script>${nucleo}</script><script>
// ANATOMIA: estilizada — busto de maniquí plano; es una toma sustituta, no una persona
const PARED=${JSON.stringify(pared)}, ROT=${JSON.stringify(`TOMA ${b + 1} · DE PRUEBA`)};
arrancar(f=>{const t=f/FPS,bal=Math.sin(t*1.5)*10;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;
 ctx.fillStyle='#23222b';ctx.fillRect(0,0,W,H);ctx.globalAlpha=.42;ctx.fillStyle=PARED;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
 ctx.fillStyle='rgba(0,0,0,.28)';for(let y=260;y<H;y+=330)ctx.fillRect(0,y,W,16);             // repisas
 ctx.fillStyle='rgba(255,255,255,.2)';for(let k=0;k<6;k++)ctx.fillRect(40+k*190,150+((k*97)%60),110,110-((k*53)%40)); // cosas en la repisa de arriba
 ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(0,1500,W,420);                                  // mesa
 ctx.fillStyle='#1b1a22';ctx.beginPath();ctx.arc(540+bal,650,150,0,7);ctx.fill();
 ctx.beginPath();ctx.roundRect(540-360+bal*.4,880,720,1200,220);ctx.fill();
 ctx.fillStyle=PARED;ctx.beginPath();ctx.roundRect(790+bal*.6,900+Math.sin(t*2.3)*14,150,190,26);ctx.fill();   // el objeto, a la altura del hombro
 ctx.fillStyle='rgba(255,255,255,.75)';ctx.font='800 34px sans-serif';ctx.textAlign='center';ctx.fillText(ROT,540,1420);
});</script>`);
  const mudo = join(T, `b${b}.mp4`), final = join(OUT, `toma-${b + 1}.mp4`);
  renderizar(html, mudo);
  sh('ffmpeg', ['-v', 'error', '-y', '-i', mudo, '-i', voz, '-c:v', 'libx264', '-crf', '26', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', final]);
  console.log(`${final} (${dur(final).toFixed(1)} s)`);
});
console.log(`\nTomas de prueba listas. Ahora: node ${join(import.meta.dirname, 'montar.mjs')} ${DIR} --tomas=${OUT} --salida=${join(DIR, 'prueba.mp4')}`);
