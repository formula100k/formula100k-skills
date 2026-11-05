// comun.mjs — lo que comparten los scripts de Auto-Edición. Igual en Mac y en Windows.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const K = resolve(dirname(fileURLToPath(import.meta.url)), '..');          // la carpeta de la skill
export const casa = r => resolve(String(r).replace(/^~(?=$|[\\/])/, homedir()));
export const MI_LOOK_DIR = join(homedir(), 'Documents', 'mi-contenido', 'auto-edicion');   // mi-look.json + avatar/
export const VIDEOS = join(homedir(), 'Documents', 'mis-videos-editados');               // un proyecto por reel

export function correr(cmd, args, opt = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28, ...opt });
  if (r.error) throw new Error(`No encontré ${cmd}. Corre «node scripts/instalar.mjs» para ver qué falta.`);
  if (r.status !== 0) throw new Error(`${cmd} falló:\n` + String(r.stderr || r.stdout || '').trim().split('\n').slice(-6).join('\n'));
  return r.stdout || '';
}
export const durar = f => parseFloat(correr('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]));

// fuente/pieza.src.html + fuente/tiempos.json + motor/nucleo.js → fuente/pieza.html
export function armar(P) {
  const f = join(P, 'fuente');
  for (const a of ['pieza.src.html', 'tiempos.json']) if (!existsSync(join(f, a))) throw new Error(`Falta ${join(f, a)}.` + (a === 'tiempos.json' ? ' Corre antes: node scripts/voz.mjs "<proyecto>"' : ''));
  const src = readFileSync(join(f, 'pieza.src.html'), 'utf8');
  // Avatar 3D o pixel (plantilla/sin-grabar): la boca se mueve con el volumen de la voz → fuente/boca.js
  if (src.includes('boca.js') && existsSync(join(P, 'voz', 'rec', '01.wav'))) {
    const av = src.includes('avatar-habbo.js') ? 'habbo' : 'avatar-3d';
    correr(process.execPath, [join(K, 'plantilla', 'sin-grabar', av, 'boca.mjs'), P]);
  }
  const nucleo = readFileSync(join(K, 'motor', 'nucleo.js'), 'utf8');
  const h = src
    .replace('__TIEMPOS__', () => readFileSync(join(f, 'tiempos.json'), 'utf8'))
    .replace('<script src="../nucleo/nucleo.js"></script>', () => '<script>\n' + nucleo + '\n</script>');
  writeFileSync(join(f, 'pieza.html'), h);
  return join(f, 'pieza.html');
}
export const renderizar = (args, opt = {}) => correr(process.execPath, [join(K, 'motor', 'renderizar.mjs'), ...args], opt);
export function salir(e) { console.error(e.message || e); process.exit(1); }
