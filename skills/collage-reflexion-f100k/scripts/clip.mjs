#!/usr/bin/env node
// clip.mjs — convierte un video en cuadros numerados para que la plantilla lo pinte sincronizado.
//
//   node clip.mjs <carpeta-de-la-pieza> <video> <nombre> [--desde 0] [--dura 4] [--fps 30] [--ancho 1080]
//   node clip.mjs <carpeta-de-la-pieza> --indice        (solo vuelve a contar lo que hay en clips/)
//
// Deja clips/<nombre>/0001.jpg… y reescribe clips/indice.js. En config.js el clip se usa por su nombre:
//   recurso: { clip: 'apertura' }
import { mkdirSync, rmSync, readdirSync, writeFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2), flag = (n, d) => { const i = args.indexOf(n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const desde = flag('--desde', null), dura = flag('--dura', null), fps = +flag('--fps', 30), ancho = +flag('--ancho', 1080);
const soloIndice = args.includes('--indice');
if (!args[0] || (!soloIndice && (!args[1] || !args[2]))) { console.error('uso: node clip.mjs <carpeta-de-la-pieza> <video> <nombre> [--desde s] [--dura s] [--fps 30] [--ancho 1080]'); process.exit(1); }
const raiz = join(resolve(args[0]), 'clips'); mkdirSync(raiz, { recursive: true });

if (!soloIndice) {
  const video = resolve(args[1]), nombre = args[2].replace(/[^a-z0-9_-]/gi, '-'), out = join(raiz, nombre);
  if (!existsSync(video)) { console.error('No encuentro el video: ' + video); process.exit(1); }
  rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
  const a = ['-v', 'error', '-y']; if (desde != null) a.push('-ss', desde); a.push('-i', video); if (dura != null) a.push('-t', dura);
  a.push('-vf', `fps=${fps},scale=${ancho}:-2`, '-q:v', '3', '-start_number', '1', join(out, '%04d.jpg'));
  const r = spawnSync('ffmpeg', a, { stdio: 'inherit' }); if (r.status !== 0) process.exit(1);
  writeFileSync(join(out, 'fps.txt'), String(fps));
  console.log(`clips/${nombre}: ${readdirSync(out).filter(f => f.endsWith('.jpg')).length} cuadros a ${fps} por segundo`);
}
const idx = {};
for (const d of readdirSync(raiz)) { const p = join(raiz, d); if (!statSync(p).isDirectory()) continue; const n = readdirSync(p).filter(f => /^\d{4}\.jpg$/.test(f)).length; if (n) idx[d] = { cuadros: n, fps: existsSync(join(p, 'fps.txt')) ? +readFileSync(join(p, 'fps.txt'), 'utf8') : 30 }; }
writeFileSync(join(raiz, 'indice.js'), '// Lo escribe scripts/clip.mjs. No se edita a mano.\nwindow.CLIPS = ' + JSON.stringify(idx, null, 1) + ';\n');
console.log('clips/indice.js → ' + (Object.entries(idx).map(([k, v]) => `${k} (${(v.cuadros / v.fps).toFixed(1)} s)`).join(', ') || 'sin clips'));
