#!/usr/bin/env node
// sonidos.mjs — efectos GRAVES sintetizados con ffmpeg (nada de pitidos, clics, teclas ni campanas)
// y la mezcla de la pista de efectos en los momentos que marca la pieza (eventos.json).
// Todos pasan por un filtro pasa-bajos doble a 2,2 kHz: nada audible sobre ~3 kHz.
// Uso:
//   node sonidos.mjs verificar <carpeta>     genera los 4 sonidos y mide su energía sobre 3 kHz
//   (desde producir.mjs) pistaEfectos(eventos, duracion, build)
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LP = 'lowpass=f=2200,lowpass=f=2200,highpass=f=40';
// pop = burbuja grave · swish = aire suave · golpe = golpe sordo · corte = desliz de papel muy bajo
const RECETAS = {
  pop: ['-f', 'lavfi', '-i', "aevalsrc='0.9*sin(2*PI*(160+260*exp(-t*55))*t)*exp(-t*30)':s=48000:d=0.16"],
  swish: ['-f', 'lavfi', '-i', 'anoisesrc=c=brown:a=0.9:d=0.32:r=48000', '-af', `afade=t=in:d=0.14:curve=qsin,afade=t=out:st=0.14:d=0.18:curve=qsin,bandpass=f=500:width_type=o:w=2,${LP}`],
  golpe: ['-f', 'lavfi', '-i', "aevalsrc='1.0*sin(2*PI*(55+70*exp(-t*28))*t)*exp(-t*14)':s=48000:d=0.35"],
  corte: ['-f', 'lavfi', '-i', 'anoisesrc=c=brown:a=0.7:d=0.22:r=48000', '-af', `afade=t=in:d=0.05,afade=t=out:st=0.05:d=0.17,lowpass=f=900,${LP}`],
};
const VOL = { pop: -19, swish: -21, golpe: -15, corte: -27 };

export function generar(dir) {
  mkdirSync(dir, { recursive: true });
  for (const [n, r] of Object.entries(RECETAS)) {
    const out = join(dir, n + '.wav');
    if (existsSync(out)) continue;
    const tieneAf = r.includes('-af');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...r, ...(tieneAf ? [] : ['-af', LP]), '-ac', '1', '-ar', '48000', out]);
  }
  return dir;
}

// energía sobre 3 kHz relativa al total (dB). Menos de -30 dB = nada agudo audible.
const media = (f, af) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', `${af}volumedetect`, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = (r.stderr || '').match(/mean_volume:\s*(-?[\d.]+|-inf) dB/); return m ? (m[1] === '-inf' ? -120 : +m[1]) : -120; };
export function agudosDb(f) { return +(media(f, 'highpass=f=3000,highpass=f=3000,') - media(f, '')).toFixed(1); }

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [modo, dir] = process.argv.slice(2);
  if (modo !== 'verificar' || !dir) { console.error('uso: node sonidos.mjs verificar <carpeta>'); process.exit(1); }
  generar(dir);
  let ok = true;
  for (const n of Object.keys(RECETAS)) { const d = agudosDb(join(dir, n + '.wav')); ok &&= d < -30; console.log(n.padEnd(6), `energía sobre 3 kHz: ${d} dB respecto del total`, d < -30 ? 'OK' : 'DEMASIADO AGUDO'); }
  process.exit(ok ? 0 : 1);
}

// pista de efectos: cada evento en su segundo, con su volumen; eventos a menos de 0,12 s se funden en uno
export function pistaEfectos(eventos, duracion, build) {
  const dir = generar(join(build, 'sfx'));
  const ev = []; for (const e of eventos) { if (!RECETAS[e.sfx]) continue; if (ev.length && e.t - ev[ev.length - 1].t < .12) continue; ev.push(e); }
  const out = join(build, 'efectos.wav');
  const tipos = [...new Set(ev.map(e => e.sfx))];
  const ins = tipos.flatMap(t => ['-i', join(dir, t + '.wav')]);
  const partes = [], etiquetas = [];
  tipos.forEach((t, k) => {
    const mios = ev.filter(e => e.sfx === t);
    partes.push(`[${k}:a]volume=${VOL[t]}dB,asplit=${mios.length}${mios.map((_, j) => `[${t}${j}]`).join('')}`);
    mios.forEach((e, j) => { partes.push(`[${t}${j}]adelay=${Math.round(e.t * 1000)}:all=1[${t}d${j}]`); etiquetas.push(`[${t}d${j}]`); });
  });
  if (!etiquetas.length) return null;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex',
    partes.join(';') + ';' + etiquetas.join('') + `amix=inputs=${etiquetas.length}:normalize=0,${LP},apad=whole_dur=${duracion.toFixed(3)},atrim=0:${duracion.toFixed(3)}[o]`,
    '-map', '[o]', '-ar', '48000', '-ac', '1', out]);
  return out;
}
