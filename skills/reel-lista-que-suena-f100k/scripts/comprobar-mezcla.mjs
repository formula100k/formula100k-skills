#!/usr/bin/env node
// Comprueba la mezcla midiendo por tramos: cada fragmento suena en su segundo, los huecos de voz quedan sin música
// y la voz queda por encima. Sale con error si algo no cuadra.
//   node comprobar-mezcla.mjs <carpeta>
import fs from 'node:fs';
import path from 'node:path';
import { carpeta, leerConfig, leerTiempos, items, buscarAudio, volumenMedio, seg } from './comun.mjs';

const dir = carpeta(process.argv.slice(2));
const C = leerConfig(dir), T = leerTiempos(dir), IT = items(C, T), F = T.frag;
const musica = path.join(dir, 'pista-musica.wav'), voz = path.join(dir, 'pista-voz.wav'), final = path.join(dir, C.archivo + '-con-musica.mp4');
for (const p of [musica, voz, final]) if (!fs.existsSync(p)) { console.error(`Falta ${path.basename(p)}. Corre antes mezclar.mjs.`); process.exit(1); }

let mal = 0; const m = 0.2; // margen para no medir encima de los fundidos
console.log('Fragmentos (pista-musica.wav) · dB de media dentro de su ventana y en el medio segundo anterior');
const niveles = [];
IT.forEach((it, i) => {
  const hay = !!buscarAudio(path.join(dir, 'audios'), it.num);
  const dentro = volumenMedio(musica, { desde: it.entra + m, dura: F - 2 * m });
  const primero = i === 0 || IT[i - 1].categoria !== it.categoria;
  const antes = primero ? volumenMedio(musica, { desde: Math.max(0, it.entra - 0.6), dura: 0.5 }) : null;
  let nota = 'bien';
  if (hay && dentro < -60) { nota = 'NO SUENA'; mal++; }
  if (!hay) nota = 'sin audio (hueco)';
  if (antes != null && antes > -60) { nota = 'SUENA ANTES DE TIEMPO'; mal++; }
  if (hay) niveles.push(dentro);
  console.log(`${it.num} · ${seg(it.entra)}–${seg(it.entra + F)} s · ${dentro.toFixed(1)} dB${antes != null ? ' · antes ' + antes.toFixed(1) + ' dB' : ''} · ${nota}`);
});
console.log('\nVoz (pista-voz.wav) · dB de media de cada frase y de la música en ese mismo tramo');
const voces = [];
T.frases.forEach(f => {
  const v = volumenMedio(voz, { desde: f.entra, dura: f.dura }), mu = volumenMedio(musica, { desde: f.entra, dura: f.dura });
  voces.push(v); let nota = 'bien';
  if (mu > v - 6) { nota = 'LA MÚSICA TAPA LA VOZ'; mal++; }
  console.log(`${f.num} · ${seg(f.entra)}–${seg(f.entra + f.dura)} s · voz ${v.toFixed(1)} dB · música ${mu.toFixed(1)} dB · ${nota}`);
});
const mediaV = voces.reduce((a, b) => a + b, 0) / voces.length, maxM = Math.max(...niveles);
console.log(`\nVoz: ${mediaV.toFixed(1)} dB de media · fragmento más fuerte: ${maxM.toFixed(1)} dB · diferencia ${(mediaV - maxM).toFixed(1)} dB`);
if (maxM > mediaV - 3) { console.log('⚠ Algún fragmento suena casi tan fuerte como la voz. Sube mezcla.bajoLaVoz en config.js.'); mal++; }
console.log(mal ? `\n${mal} problema(s). Revisa los audios y vuelve a mezclar.` : '\nTodo en su sitio: cada fragmento en su segundo y la voz por encima.');
process.exit(mal ? 1 : 0);
