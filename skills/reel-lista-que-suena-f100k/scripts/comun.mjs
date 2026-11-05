// Utilidades compartidas por los scripts de la skill.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync, spawnSync } from 'node:child_process';

export const EXT_AUDIO = ['mp3', 'wav', 'm4a', 'aac', 'aiff', 'aif', 'flac', 'ogg', 'opus'];

export function carpeta(argv) {
  const dir = argv.find(a => !a.startsWith('--') && fs.existsSync(a) && fs.statSync(a).isDirectory());
  if (!dir || !fs.existsSync(path.join(dir, 'config.js'))) {
    console.error('Pasa la carpeta de la pieza (la que tiene config.js). Ejemplo: node <script> "$SALIDA"');
    process.exit(1);
  }
  return path.resolve(dir);
}

function leerGlobal(archivo, nombre) {
  if (!fs.existsSync(archivo)) return null;
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(archivo, 'utf8'), ctx, { filename: archivo });
  return ctx.window[nombre] || null;
}

export function leerConfig(dir) {
  const c = leerGlobal(path.join(dir, 'config.js'), 'CONFIG');
  if (!c) { console.error('config.js no define window.CONFIG'); process.exit(1); }
  if (!Array.isArray(c.categorias) || !c.categorias.length) { console.error('config.js: faltan las categorías'); process.exit(1); }
  c.categorias.forEach((k, i) => {
    if (!k.items || k.items.length < 1 || k.items.length > 3) { console.error(`config.js: la categoría ${i + 1} debe traer de 1 a 3 ítems`); process.exit(1); }
  });
  c.tiempos = Object.assign({ fragmento: 2, arranque: 0.3, antes: 0.15, pausa: 0.35, cola: 0.2, colaFinal: 1.6 }, c.tiempos || {});
  c.mezcla = Object.assign({ bajoLaVoz: 8, fundido: 0.15 }, c.mezcla || {});
  c.cierre = c.cierre || { pantallas: [] };
  c.archivo = c.archivo || 'reel-lista';
  return c;
}

export function leerTiempos(dir) {
  const t = leerGlobal(path.join(dir, 'tiempos.js'), 'TIEMPOS');
  if (!t) { console.error('Falta tiempos.js. Corre primero scripts/voz.mjs sobre esta carpeta.'); process.exit(1); }
  return t;
}

// Lista plana de ítems en el orden de la tabla de montaje (01, 02, …).
export function items(config, tiempos) {
  const out = []; let n = 0;
  config.categorias.forEach((k, ki) => k.items.forEach((it, i) => {
    n++;
    out.push({ n, num: String(n).padStart(2, '0'), categoria: k.nombre, ...it, inicio: Number(it.inicio) || 0,
      entra: tiempos ? tiempos.cats[ki].tItems[i] : null });
  }));
  return out;
}

// Frases de voz en orden: una por categoría y una por pantalla de cierre.
export function frases(config) {
  const out = [];
  config.categorias.forEach((k, i) => out.push({ tipo: 'categoria', i, texto: k.frase || '' }));
  (config.cierre.pantallas || []).forEach((p, i) => out.push({ tipo: 'cierre', i, texto: p.frase || '' }));
  return out.map((f, n) => ({ ...f, num: String(n + 1).padStart(2, '0') }));
}

export function buscarAudio(dir, num) {
  if (!fs.existsSync(dir)) return null;
  for (const e of EXT_AUDIO) { const p = path.join(dir, `${num}.${e}`); if (fs.existsSync(p)) return p; }
  // también vale «01-lo-que-sea.mp3»
  const f = fs.readdirSync(dir).find(x => x.startsWith(num + '-') && EXT_AUDIO.includes(x.split('.').pop().toLowerCase()));
  return f ? path.join(dir, f) : null;
}

export function ff(args, opciones = {}) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-y', ...args], { encoding: 'utf8', maxBuffer: 1 << 28, ...opciones });
  if (r.error) { console.error('No encuentro ffmpeg. Instálalo (Mac: brew install ffmpeg · Windows: winget install -e --id Gyan.FFmpeg).'); process.exit(1); }
  if (r.status !== 0) { console.error(r.stderr.split('\n').slice(-12).join('\n')); throw new Error('ffmpeg falló'); }
  return r.stderr;
}

export function duracion(archivo) {
  return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', archivo], { encoding: 'utf8' }));
}

// Volumen medio (dB) de un tramo. filtroPrevio permite, por ejemplo, quitar silencios antes de medir.
export function volumenMedio(archivo, { desde = null, dura = null, filtroPrevio = '' } = {}) {
  const args = [];
  if (desde != null) args.push('-ss', String(desde));
  if (dura != null) args.push('-t', String(dura));
  args.push('-i', archivo, '-af', (filtroPrevio ? filtroPrevio + ',' : '') + 'volumedetect', '-f', 'null', '-');
  const m = /mean_volume:\s*(-?[\d.]+|-inf)/.exec(ff(args));
  return m && m[1] !== '-inf' ? parseFloat(m[1]) : -91;
}

export const seg = x => x.toFixed(2).replace('.', ',');
