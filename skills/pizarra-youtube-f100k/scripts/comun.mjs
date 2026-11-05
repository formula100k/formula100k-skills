// comun.mjs — lo que comparten los scripts de la pizarra: correr un programa y avisar claro si falta.
import { spawnSync } from 'node:child_process';
import { INSTALAR } from './sistema.mjs';

export function correr(cmd, args, { silencio = false, opcional = false } = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error && r.error.code === 'ENOENT') {
    const como = INSTALAR()[cmd];
    console.error(`Falta ${cmd}.` + (como ? ` Instálalo con: ${como}` : ''));
    process.exit(1);
  }
  if (r.status !== 0 && !opcional) { console.error(`${cmd} falló:\n${String(r.stderr || r.stdout).trim().split('\n').slice(-6).join('\n')}`); process.exit(1); }
  if (!silencio && r.stdout) process.stdout.write(r.stdout);
  return r;
}
export const ffmpeg = (args, o) => correr('ffmpeg', ['-loglevel', 'error', '-y', ...args], o);
export const uso = (txt, n) => { if (process.argv.slice(2).length < n) { console.error('uso: ' + txt); process.exit(1); } return process.argv.slice(2); };
