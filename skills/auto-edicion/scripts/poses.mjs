#!/usr/bin/env node
// poses.mjs — arma las poses del avatar GRATIS a partir de tus fotos: les quita el fondo y las deja como p01.png, p02.png…
// Uso: node scripts/poses.mjs <carpeta con tus fotos> [carpeta del avatar]
//   Las fotos se toman en el orden de su nombre (ponles 01.jpg, 02.jpg… según la tabla de referencia/poses.md).
//   El avatar queda por defecto en ~/Documents/mi-contenido/auto-edicion/avatar/.
//   Mac: recorte con el de macOS (Vision); Windows y Mac antiguas: rembg (la primera vez descarga el modelo).
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { achicarImagen, recortarPersona } from './sistema.mjs';
import { MI_LOOK_DIR, casa, salir } from './comun.mjs';

try {
  const [fotosArg, destArg] = process.argv.slice(2);
  if (!fotosArg) throw new Error('uso: node scripts/poses.mjs <carpeta con tus fotos> [carpeta del avatar]');
  const fotos = casa(fotosArg), dest = destArg ? casa(destArg) : join(MI_LOOK_DIR, 'avatar');
  const lista = readdirSync(fotos).filter(f => /\.(jpe?g|png|heic|webp)$/i.test(f)).sort();
  if (!lista.length) throw new Error('No hay fotos en ' + fotos);
  mkdirSync(dest, { recursive: true });
  lista.forEach((f, i) => {
    const sal = join(dest, `p${String(i + 1).padStart(2, '0')}.png`);
    const r = recortarPersona(join(fotos, f), sal);
    if (!r.ok) throw new Error(`No pude recortar ${f}: ${r.mensaje || 'sin sujeto claro'}. Usa una foto con fondo liso y buena luz.`);
    achicarImagen(sal, sal, 1400);
    console.log(`${f} -> ${sal}`);
  });
  console.log(`listo: ${lista.length} poses en ${dest}. Pon N_POSES = ${lista.length} en la pieza.`);
} catch (e) { salir(e); }
