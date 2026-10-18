#!/usr/bin/env node
// Captura los 9 posts de posts.html como despues-1.jpg … despues-9.jpg. Corre igual en Mac y en Windows.
// Uso: node capturar.mjs <carpeta con posts.html, foto.jpg y recorte.png> <carpeta de salida (assets del reel)>
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { chrome, comoUrl, achicarImagen } from '../scripts/sistema.mjs';

const [dirArg, outArg] = process.argv.slice(2);
if (!dirArg || !outArg) { console.error('Uso: node capturar.mjs <carpeta de trabajo> <carpeta de salida>'); process.exit(1); }
const DIR = resolve(dirArg), OUT = resolve(outArg);
mkdirSync(OUT, { recursive: true });
for (const f of ['posts.html', 'foto.jpg', 'recorte.png']) if (!existsSync(join(DIR, f))) { console.error(`Falta ${join(DIR, f)}`); process.exit(1); }
const CHROME = chrome();
if (!CHROME) { console.error('No encontré Chrome: instálalo o captura cada lámina a mano (posts.html#1 … #9, a 1080×1350).'); process.exit(1); }

for (let i = 1; i <= 9; i++) {
  const png = join(DIR, `post-${i}.png`);
  rmSync(png, { force: true });
  spawnSync(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=3000',
    `--screenshot=${png}`, '--window-size=1080,1350', comoUrl(join(DIR, 'posts.html'), '#' + i)], { stdio: 'ignore', timeout: 60000 });
  if (!existsSync(png)) { console.error(`Chrome no capturó la lámina ${i}. Abre posts.html#${i} en Chrome y captúrala a mano (1080×1350).`); process.exit(1); }
  try { achicarImagen(png, join(OUT, `despues-${i}.jpg`), 900, { calidad: 88 }); } catch (e) { console.error(e.message); process.exit(1); }
  rmSync(png, { force: true });
}
const hoja = join(DIR, 'hoja-posts.jpg');
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(OUT, 'despues-%d.jpg'), '-vf', 'scale=360:-1,tile=9x1', '-frames:v', '1', hoja], { stdio: 'inherit' });
if (r.status === 0) console.log('Hoja para revisar: ' + hoja);
