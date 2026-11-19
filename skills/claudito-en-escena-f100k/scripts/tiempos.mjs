#!/usr/bin/env node
// tiempos.mjs — saca el segundo de cada palabra de la voz para colgar cada acción de Claudito de la palabra que la nombra.
// Uso: node scripts/tiempos.mjs <carpeta>/fuente/pieza.src.html <carpeta>/voz
// Lee el texto de LINEAS (las *claves* entre asteriscos), recorta el silencio de cada audio igual que voz.mjs y:
//  · si hay whisper-cli + un modelo ggml (WHISPER_MODEL o ~/.cache/whisper-cpp/ggml-*.bin), usa el tiempo real de cada palabra;
//  · si no, reparte el tiempo según el largo de cada palabra (aproximado, sirve igual).
// Imprime las duraciones `d` y el bloque `SUBS` listo para pegar en la pieza.
import { readFileSync, readdirSync, existsSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';

const [src, carpeta] = process.argv.slice(2);
if (!src || !carpeta) { console.error('Uso: node scripts/tiempos.mjs pieza.src.html carpeta-voz'); process.exit(1); }
const html = readFileSync(src, 'utf8');
const bloque = html.slice(html.indexOf('const LINEAS'), html.indexOf('];', html.indexOf('const LINEAS')));
const textos = [...bloque.matchAll(/txt:\s*'((?:[^'\\]|\\.)*)'/g)].map(m => m[1]);
const audios = readdirSync(carpeta).filter(f => /\.(mp3|m4a|wav|aiff|ogg)$/i.test(f)).sort();
if (audios.length !== textos.length) console.error(`Ojo: ${textos.length} frases y ${audios.length} audios.`);

const tmp = mkdtempSync(join(tmpdir(), 'tiempos-'));
const ruta = n => { try { return execFileSync('which', [n]).toString().trim(); } catch { return null; } };
const wcli = ruta('whisper-cli');
const modelos = [process.env.WHISPER_MODEL, ...['small', 'base', 'medium', 'large-v3'].map(m => join(homedir(), '.cache/whisper-cpp', `ggml-${m}.bin`))].filter(Boolean);
const modelo = modelos.find(m => existsSync(m));
const conWhisper = !!(wcli && modelo);
console.error(conWhisper ? `whisper: ${modelo}` : 'Sin whisper: reparto por largo de palabra (aproximado).');

const lineasSubs = [], durs = [];
audios.forEach((f, i) => {
  const wav = join(tmp, `${i}.wav`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(carpeta, f), '-af',
    'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '16000', '-ac', '1', wav]);
  const d = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString().trim();
  durs.push(+d.toFixed(2));
  const txt = textos[i] || '';
  const pal = txt.split(/\s+/).filter(Boolean).map(w => ({ raw: w, s: w.replace(/\*/g, '').replace(/[.,:;!?¡¿«»"]/g, ''), clave: w.includes('*'), corta: /[.,:;!?]\*?$/.test(w) }));
  const total = pal.reduce((a, p) => a + p.s.length + 1, 0);
  // tiempos con whisper: palabras en orden; se casan por posición relativa en caracteres
  let ww = null;
  if (conWhisper) {
    try {
      execFileSync(wcli, ['-m', modelo, '-l', 'es', '-ml', '1', '-oj', '-of', join(tmp, String(i)), '-f', wav], { stdio: 'ignore' });
      const seg = JSON.parse(readFileSync(join(tmp, `${i}.json`), 'utf8')).transcription;
      ww = []; for (const s of seg) { const t = s.text; if (!t.trim() || /^[\s.,:;!?]+$/.test(t)) continue;
        if (/^\s/.test(t) || !ww.length) ww.push({ s: t.trim(), t: s.offsets.from / 1000 }); else ww.at(-1).s += t.trim(); }
    } catch { ww = null; }
  }
  let acc = 0;
  const tiempos = pal.map((p, k) => {
    if (ww && ww.length === pal.length) { acc += p.s.length + 1; return ww[k].t; }
    const rel = acc / total; acc += p.s.length + 1;
    if (ww && ww.length) { const wt = ww.reduce((a, w) => a + w.s.length + 1, 0); let c = 0;
      for (const w of ww) { if (c / wt >= rel - 1e-6) return w.t; c += w.s.length + 1; } return ww.at(-1).t; }
    return d * .95 * rel;
  });
  // grupos de 1–3 palabras, corta en la puntuación
  const grupos = []; let g = [];
  pal.forEach((p, k) => { g.push(`${p.clave ? '*' : ''}${p.s}:${+tiempos[k].toFixed(2)}`); if (g.length === 3 || p.corta) { grupos.push(g.join(' ')); g = []; } });
  if (g.length) grupos.push(g.join(' '));
  lineasSubs.push(grupos.join(' | '));
});
console.log('// duraciones (voz.mjs las escribe solo en LINEAS):', durs.join(', '));
console.log('const SUBS = [\n' + lineasSubs.map((s, i) => `  '${i === 0 ? '' : s}',${i === 0 ? '  // gancho: sin subtítulo' : ''}`).join('\n') + '\n].map(/* deja el .map(...) de la plantilla */);');
console.log('\n// palabra:segundo de cada frase (para colgar las acciones de Claudito):');
lineasSubs.forEach((s, i) => console.log(`// ${i}: ${s}`));
