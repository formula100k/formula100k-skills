#!/usr/bin/env node
// maqueta.mjs — del guion.json a la maqueta: el reel completo con una silueta donde va tu video.
//
//   node maqueta.mjs <carpeta>              mide las frases, saca la hoja de contacto, la maqueta (muda y con voz de
//                                           computadora), los cuadros de cada cambio de encuadre y la hoja de rodaje
//   node maqueta.mjs <carpeta> --hojas      solo la hoja de contacto y la hoja de rodaje (rápido, para revisar el dibujo)
//   node maqueta.mjs <carpeta> --paneles    además, un MP4 por bloque con el panel y el hueco de la tarjeta (para montar a mano)
//
// La voz de computadora (say) solo sirve para estimar el ritmo: NO es la voz final. Si una frase trae "d" en guion.json, se respeta.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { sh, arg, carpetaDe, leerGuion, frasesDe, medir, lineaDeTiempo, armar, renderizar, cuadrosDeTransicion, dos } from './comun.mjs';

const DIR = carpetaDe(), G = leerGuion(DIR), F = frasesDe(G);
const voces = medir(DIR, G), d = F.map((f, i) => f.d ?? voces[i].medida), TL = lineaDeTiempo(G, d);
const REV = join(DIR, 'revision'); mkdirSync(REV, { recursive: true });
const largo = b => TL.FIN_B[b] - TL.INI_B[b];
console.log(G.bloques.map((bl, b) => `${bl.nombre} ${largo(b).toFixed(1)} s`).join(' · ') + ` · total ${TL.TOTAL.toFixed(1)} s (${F.reduce((a, f) => a + f.txt.split(/\s+/).length, 0)} palabras)`);

// ---------- hoja de rodaje ----------
const R = ['# Hoja de rodaje', '', `${G.bloques.length} tomas cortas, en vertical, mismo lugar y misma luz. Duración estimada del reel: ${Math.round(TL.TOTAL)} s (medida con voz de computadora; tu ritmo va a ser otro y el montaje se ajusta solo).`, '',
  '| Toma | Archivo | Dura aprox. | En la mano | Encuadre |', '|---|---|---|---|---|'];
G.bloques.forEach((bl, b) => { const comp = bl.frases.filter(f => f.encuadre === 'completa'), solo = bl.frases.filter(f => f.encuadre === 'panel');
  R.push(`| ${b + 1} · ${bl.nombre} | \`tomas/toma-${b + 1}.mov\` | ${Math.ceil(largo(b))} s | ${bl.utileria || 'nada'} | ${comp.length ? 'Pantalla completa en: ' + comp.map(f => '«' + f.txt + '»').join(' ') + ' Después, tarjeta.' : 'Tarjeta'}${solo.length ? ' Panel solo (no sales) en: ' + solo.map(f => '«' + f.txt + '»').join(' ') : ''} |`); });
R.push('', '## Qué dices en cada toma', '');
G.bloques.forEach((bl, b) => { R.push(`**Toma ${b + 1} · ${bl.nombre}**${bl.utileria ? ` (${bl.utileria})` : ''}`, '', ...bl.frases.map(f => f.txt + (f.encuadre === 'completa' ? '  ← pantalla completa' : '')), ''); });
R.push('## Cómo grabar', '',
  '- **Una toma por bloque**, de corrido y diciendo las frases tal cual: el montaje busca cada frase en tu voz. Si cambias una palabra del principio de una frase, puede no encontrarla.',
  '- **Encuadre:** celular en vertical, quieto. Tu cara en el tercio de arriba; dentro de la tarjeta solo se ve un cuadrado (de la cabeza al pecho). El subtítulo cae sobre el pecho: no pongas el objeto ahí.',
  '- **En las frases a pantalla completa** se ve la toma entera y el título va arriba: deja aire sobre la cabeza (que el pelo no toque el quinto de arriba del cuadro).',
  '- **El objeto** se levanta a la altura del hombro cuando lo nombras, y se queda dentro del cuadrado.',
  '- **Ritmo:** sin pausas largas entre frases. Las cifras se dicen mirando a cámara: es cuando el panel salta.',
  '- Deja medio segundo de silencio antes de empezar y al terminar. Graba cada toma dos veces y elige.',
  '- Guarda cada toma elegida como `tomas/toma-1.mov`, `toma-2.mov`… (sirve .mov, .mp4 o .m4v).', '');
writeFileSync(join(DIR, 'HOJA-DE-RODAJE.md'), R.join('\n'));

// ---------- hoja de contacto y maqueta ----------
const html = armar(DIR, G, TL, 'capa=todo', 'maqueta');
renderizar(html, join(REV, 'hoja-maqueta.jpg'), ['--hoja', '1.5']);
console.log('hoja de contacto: ' + join(REV, 'hoja-maqueta.jpg'));
if (!arg('hojas')) {
  const muda = join(DIR, 'maqueta.mp4');
  renderizar(html, muda);
  const ins = [], fl = [];
  voces.forEach((v, i) => { ins.push('-i', v.wav); fl.push(`[${i + 1}:a]adelay=${Math.round(TL.S[i] * 1000)}:all=1[a${i}]`); });
  sh('ffmpeg', ['-v', 'error', '-y', '-i', muda, ...ins, '-filter_complex', fl.join(';') + ';' + voces.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${voces.length}:normalize=0[m]`,
    '-map', '0:v', '-map', '[m]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', join(DIR, 'maqueta-con-voz-guia.mp4')]);
  const cuadros = cuadrosDeTransicion(muda, TL, REV);
  console.log(`maqueta: ${muda}\ncon voz de computadora (solo para oír el ritmo): ${join(DIR, 'maqueta-con-voz-guia.mp4')}`);
  if (cuadros.length) console.log(`cuadros de los cambios de encuadre (ábrelos): ${REV}/transicion-*.jpg (${cuadros.length})`);
}
if (arg('paneles')) {
  const P = join(DIR, 'paneles'); mkdirSync(P, { recursive: true });
  G.bloques.forEach((bl, b) => { renderizar(armar(DIR, G, TL, `capa=fondo&bloque=${b}`, 'panel'), join(P, `panel-${b + 1}-${bl.nombre}.mp4`)); });
  console.log('paneles sueltos: ' + P);
}
console.log('hoja de rodaje: ' + join(DIR, 'HOJA-DE-RODAJE.md'));
