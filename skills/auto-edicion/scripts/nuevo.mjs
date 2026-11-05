#!/usr/bin/env node
// nuevo.mjs — crea la carpeta de un reel: ~/Documents/mis-videos-editados/<nombre>/ con fuente/, voz/ y avatar/.
// Uso: node scripts/nuevo.mjs <nombre-corto>  [--desde <proyecto anterior>]  [--avatar 3d | habbo]
//   Copia la plantilla (o la pieza de un proyecto anterior) y las poses de tu avatar (si armaste «Mi look»).
//   --avatar 3d     avatar 3D que mueve brazos, dedos y boca (plantilla/sin-grabar/avatar-3d): no usa poses.
//   --avatar habbo  avatar pixel de cubitos con 6 gestos (plantilla/sin-grabar/habbo): no usa poses.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { K, MI_LOOK_DIR, VIDEOS, casa, salir } from './comun.mjs';

const AVATARES = {
  '3d': ['avatar-3d', ['pieza.src.html', 'avatar3d.js', 'three.module.min.js', 'three.core.min.js']],
  habbo: ['habbo', ['pieza.src.html', 'avatar-habbo.js', 'three.module.min.js', 'three.core.min.js']],
};

try {
  const a = process.argv.slice(2), opcion = o => { const i = a.indexOf(o); return i >= 0 ? a[i + 1] : null; };
  const desde = opcion('--desde') ? casa(opcion('--desde')) : null, avatar = opcion('--avatar');
  const nombre = a.find((x, k) => !x.startsWith('--') && !['--desde', '--avatar'].includes(a[k - 1]));
  if (!nombre) throw new Error('uso: node scripts/nuevo.mjs <nombre-corto> [--desde <proyecto anterior>] [--avatar 3d | habbo]');
  if (avatar && !AVATARES[avatar]) throw new Error(`No hay avatar «${avatar}». Usa: ${Object.keys(AVATARES).join(' o ')}.`);
  const P = join(VIDEOS, nombre.replace(/[^\p{L}\p{N}_-]+/gu, '-'));
  if (existsSync(join(P, 'fuente', 'pieza.src.html'))) throw new Error(`Ya existe ${P}: elige otro nombre o trabaja ahí.`);
  for (const d of ['fuente', 'voz/rec', 'avatar']) mkdirSync(join(P, d), { recursive: true });
  if (avatar) {
    const [dir, archivos] = AVATARES[avatar], A = join(K, 'plantilla', 'sin-grabar', dir);
    for (const f of archivos) cpSync(join(A, f), join(P, 'fuente', f));
    if (desde) cpSync(join(desde, 'fuente', 'pieza.src.html'), join(P, 'fuente', 'pieza.src.html'));
    console.log(`listo -> ${P}\navatar ${dir}: sigue plantilla/sin-grabar/${dir}/LEEME.md (las capturas del ejemplo NO se copian: pon las de tu tema)`);
  } else {
    if (desde) cpSync(join(desde, 'fuente', 'pieza.src.html'), join(P, 'fuente', 'pieza.src.html'));
    else cpSync(join(K, 'plantilla', 'ejemplo-ruido.src.html'), join(P, 'fuente', 'pieza.src.html'));
    cpSync(join(K, 'plantilla', 'cap_apple.png'), join(P, 'fuente', 'cap_apple.png'));
    const av = join(MI_LOOK_DIR, 'avatar');
    if (existsSync(av)) cpSync(av, join(P, 'avatar'), { recursive: true });
    console.log(`listo -> ${P}\n${existsSync(av) ? 'avatar copiado' : 'sin avatar (pon N_POSES = 0 en la pieza o arma «Mi look»)'}`);
  }
} catch (e) { salir(e); }
