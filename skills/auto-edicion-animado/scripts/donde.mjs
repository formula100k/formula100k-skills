#!/usr/bin/env node
// donde.mjs — de un segundo del video a su escena. Para aplicar una nota («en el 23 se ve vacío») sin rehacer todo.
// Tomado de Keyframes (where.py). Usa los mismos tiempos que el render: duración de cada frase + PAUSA entre frases.
//
// Uso: node donde.mjs <proyecto> <segundos…>        ej.: node donde.mjs ~/Auto-Edicion/ruido 23 41,5
//      node donde.mjs <proyecto> --todo             la lista de escenas con su inicio y su fin
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const [P, ...pedidos] = process.argv.slice(2);
if (!P || !pedidos.length) { console.error('uso: node donde.mjs <proyecto> <segundos…> | --todo'); process.exit(1); }
const tiempos = JSON.parse(readFileSync(join(P, 'fuente/tiempos.json'), 'utf8'));
const src = readFileSync(join(P, 'fuente/pieza.src.html'), 'utf8');
const PAUSA = +(src.match(/const PAUSA = ([\d.]+)/) || [0, 0.12])[1];
const bloque = src.slice(src.indexOf('const LINEAS = ['), src.indexOf('\n];', src.indexOf('const LINEAS = [')));
const frases = [...bloque.matchAll(/txt:\s*'((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\*/g, ''));

let a = 0;
const escenas = tiempos.map((t, i) => { const e = { n: i + 1, desde: a, hasta: a + t.d, words: t.words, txt: frases[i] || '' }; a += t.d + PAUSA; return e; });
const s2 = x => x.toFixed(2).replace('.', ',');

if (pedidos[0] === '--todo') {
  for (const e of escenas) console.log(`escena ${String(e.n).padStart(2)} · ${s2(e.desde)}–${s2(e.hasta)} s · ESC[${e.n - 1}] · «${e.txt}»`);
  process.exit(0);
}
for (const p of pedidos) {
  const t = +String(p).replace(',', '.').replace(/s$/, '');
  const e = escenas.findLast(x => t >= x.desde) || escenas[0];
  const u = t - e.desde;
  const w = e.words.filter(x => u >= x.s - 0.05).at(-1);
  console.log(`${s2(t)} s → escena ${e.n} (ESC[${e.n - 1}], ${s2(e.desde)}–${s2(e.hasta)} s, nota en fuente/notas/escena-${String(e.n).padStart(2, '0')}.md)\n` +
    `   «${e.txt}»\n   palabra que suena: ${w ? `«${w.w}» (palabra ${e.words.indexOf(w)} → de(L, ${e.words.indexOf(w)}))` : 'antes de la primera'}`);
}
