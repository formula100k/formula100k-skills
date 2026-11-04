#!/usr/bin/env node
// voz.mjs — una voz por escena (gancho, cada ítem, cierre), mide cuánto dura y escribe tiempos.json + voz.wav.
// Uso: node voz.mjs <escenas.json> <carpeta-build> [--voz say|<carpeta-de-audios>|no] [--voz-nombre Paulina] [--ritmo 190] [--pausa 0.18]
//   --voz <carpeta>: un audio por escena en orden: 01.mp3, 02.wav… (el 01 es el gancho si hay gancho; el último, el cierre).
//                    Sirve para la voz real grabada o la voz clonada (ElevenLabs, etc.) exportada frase por frase.
//   --voz say:       borrador con la voz del sistema de macOS (Paulina = español de México, la más neutra).
//   --voz no:        sin voz; cada escena usa el `dur` del json (o 2,6 s).
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function textosDeVoz(e) {
  const limpio = s => String(s || '').replace(/\*/g, '');
  return [
    ...(e.gancho ? [limpio(e.gancho.voz) || `${e.gancho.chica || ''} ${e.gancho.grande}`] : []),
    ...(e.intro ? [limpio(e.intro.voz) || `${e.intro.arriba || ''} ${e.intro.numero ?? ''} ${e.intro.abajo || ''}`] : []),
    ...(e.items || []).map(it => limpio(it.voz || it.titular || it.nombre)),
    ...(e.cierre ? [limpio(e.cierre.voz || e.cierre.titular)] : []),
  ];
}
const MIN = { gancho: 2.0, intro: 2.0, item: 2.3, cierre: 3.0 };
const dura = f => +(+execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString()).toFixed(3);

export function voz(e, build, o = {}) {
  mkdirSync(join(build, 'voz'), { recursive: true });
  const textos = textosDeVoz(e);
  const tipos = [...(e.gancho ? ['gancho'] : []), ...(e.intro ? ['intro'] : []), ...(e.items || []).map(() => 'item'), ...(e.cierre ? ['cierre'] : [])];
  const lista = [...(e.gancho ? [e.gancho] : []), ...(e.intro ? [e.intro] : []), ...(e.items || []), ...(e.cierre ? [e.cierre] : [])];
  const modo = o.voz || 'say', pausa = o.pausa ?? .3;
  if (modo === 'no') {
    const t = lista.map((s, i) => ({ dur: s.dur || (tipos[i] === 'gancho' || tipos[i] === 'intro' ? 2.4 : tipos[i] === 'cierre' ? 3.6 : 2.6), voz_dur: null }));
    writeFileSync(join(build, 'tiempos.json'), JSON.stringify(t, null, 1)); return { tiempos: t, pista: null };
  }
  let fuentes;
  if (modo === 'say') {
    try { execFileSync('which', ['say']); } catch { throw new Error('No hay `say` (solo macOS). Usa --voz <carpeta> con tus audios o --voz no.'); }
    fuentes = textos.map((txt, i) => {
      const f = join(build, 'voz', `${String(i + 1).padStart(2, '0')}.aiff`);
      execFileSync('say', ['-v', o.nombre || 'Paulina', '-r', String(o.ritmo || 190), '-o', f, txt]); return f;
    });
  } else {
    const dir = resolve(modo);
    if (!existsSync(dir)) throw new Error(`No existe la carpeta de voz ${dir}`);
    fuentes = readdirSync(dir).filter(f => /^\d+\.(mp3|wav|m4a|aiff|aif)$/i.test(f)).sort((a, b) => parseInt(a) - parseInt(b)).map(f => join(dir, f));
    if (fuentes.length !== textos.length) throw new Error(`Hay ${textos.length} escenas y ${fuentes.length} audios en ${dir}: deben coincidir (01 = gancho, último = cierre).`);
  }
  // recortar silencio al inicio y al final, medir
  const limpios = fuentes.map((f, i) => {
    const out = join(build, 'voz', `limpio-${String(i + 1).padStart(2, '0')}.wav`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', f, '-af',
      'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '48000', '-ac', '1', out]);
    return out;
  });
  const tiempos = limpios.map((f, i) => { const v = dura(f); return { dur: +Math.max(MIN[tipos[i]], v + pausa + (tipos[i] === 'cierre' ? .9 : 0)).toFixed(3), voz_dur: v, voz_ini: 0 }; });
  // pista de voz: cada frase al inicio de su escena
  let a = 0; const ini = tiempos.map(t => { const r = a; a += t.dur; return r; });
  const pista = join(build, 'voz.wav');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...limpios.flatMap(f => ['-i', f]), '-filter_complex',
    ini.map((t, i) => `[${i}:a]adelay=${Math.round(t * 1000)}:all=1[a${i}]`).join(';') + ';' + ini.map((_, i) => `[a${i}]`).join('') +
    `amix=inputs=${ini.length}:normalize=0,apad=whole_dur=${a.toFixed(3)},atrim=0:${a.toFixed(3)}[o]`, '-map', '[o]', '-ar', '48000', pista]);
  writeFileSync(join(build, 'tiempos.json'), JSON.stringify(tiempos, null, 1));
  return { tiempos, pista };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), op = n => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  if (a.length < 2) { console.error('uso: node voz.mjs <escenas.json> <carpeta-build> [--voz say|<carpeta>|no]'); process.exit(1); }
  const r = voz(JSON.parse(readFileSync(a[0], 'utf8')), a[1], { voz: op('--voz'), nombre: op('--voz-nombre'), ritmo: op('--ritmo'), pausa: op('--pausa') && +op('--pausa') });
  console.log('tiempos:', r.tiempos.map(t => t.dur).join(', '), '\npista:', r.pista);
}
