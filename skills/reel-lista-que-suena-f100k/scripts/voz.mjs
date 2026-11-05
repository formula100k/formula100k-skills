#!/usr/bin/env node
// Arma la voz y calcula TODOS los tiempos del reel. Escribe tiempos.js y pista-voz.wav en la carpeta de la pieza.
//
//   node voz.mjs <carpeta>                      usa las frases que ya estén en <carpeta>/voz/01.mp3, 02.mp3 …
//   node voz.mjs <carpeta> --say [Voz]          genera las que falten con la voz de la computadora (solo para probar).
//                                               En Mac, por defecto Paulina; en Windows, la voz en español que tenga instalada
//   node voz.mjs <carpeta> --grabada <audio>    una sola grabación con todas las frases seguidas: la transcribe y la parte
//   node voz.mjs <carpeta> --estimar            sin audio: calcula tiempos aproximados para probar el diseño
//
// Una frase por categoría y una por pantalla de cierre, en ese orden (lo imprime al terminar).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { transcribir, vozDePrueba } from './sistema.mjs';
import { carpeta, leerConfig, frases as listaFrases, buscarAudio, ff, duracion, seg } from './comun.mjs';

const argv = process.argv.slice(2);
const dir = carpeta(argv);
const C = leerConfig(dir);
const FR = listaFrases(C);
const vozDir = path.join(dir, 'voz');
const lista = path.join(vozDir, '_recortadas');
const opcion = n => { const i = argv.indexOf(n); return i < 0 ? null : (argv[i + 1] && !argv[i + 1].startsWith('--') && argv[i + 1] !== dir ? argv[i + 1] : true); };
const estimar = argv.includes('--estimar');

FR.forEach(f => { if (!f.texto.trim()) { console.error(`Falta la frase ${f.num} en config.js (${f.tipo} ${f.i + 1}).`); process.exit(1); } });
fs.mkdirSync(vozDir, { recursive: true });

// ── 1. Conseguir un archivo por frase ────────────────────────────────────────────────────────────────
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').split(/\s+/).filter(Boolean);
const parecida = (a, b) => {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, dif = 0;                       // distancia de edición ≤ 1
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++dif > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return dif + (a.length - i) + (b.length - j) <= 1;
};

function partirGrabacion(audio) {
  if (!fs.existsSync(audio)) { console.error('No existe ' + audio); process.exit(1); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lista-voz-'));
  const wav = path.join(tmp, 'grabada.wav');
  ff(['-i', audio, '-ar', '16000', '-ac', '1', wav]);
  console.log('Transcribiendo la grabación (la primera vez descarga el modelo)…');
  const r = transcribir(wav, { dir: tmp, idioma: 'es' });
  const json = path.join(tmp, 'grabada.json');
  if (!r.ok || !fs.existsSync(json)) { console.error(r.error || ''); console.error('No se pudo transcribir la grabación. Alternativa: pon un audio por frase en la carpeta voz/ (01.mp3, 02.mp3…).'); process.exit(1); }
  const pal = JSON.parse(fs.readFileSync(json, 'utf8')).segments.flatMap(s => s.words || [])
    .map(w => ({ t: norm(w.word).join(''), crudo: w.word, a: w.start, b: w.end })).filter(w => w.t);
  const esp = FR.flatMap((f, fi) => norm(f.texto).map(t => ({ t, fi })));
  // alineación (subsecuencia común más larga) entre el guion y lo transcrito
  const n = esp.length, m = pal.length, L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    L[i][j] = parecida(esp[i].t, pal[j].t) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const pares = []; for (let i = 0, j = 0; i < n && j < m;) {
    if (parecida(esp[i].t, pal[j].t) && L[i][j] === L[i + 1][j + 1] + 1) { pares.push([i, j]); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++;
  }
  const porFrase = FR.map((_, fi) => pares.filter(([i]) => esp[i].fi === fi).map(([, j]) => j));
  porFrase.forEach((p, fi) => { if (!p.length) { console.error(`No encuentro la frase ${FR[fi].num} en la grabación: «${FR[fi].texto}». Revisa que el guion de config.js sea el que grabaste.`); process.exit(1); } });
  // el corte entre dos frases cae en la pausa más larga que haya entre ellas
  const total = duracion(audio), cortes = [0];
  for (let fi = 0; fi < FR.length - 1; fi++) {
    const a = porFrase[fi][porFrase[fi].length - 1], b = porFrase[fi + 1][0]; let mejor = a, hueco = -1;
    for (let j = a; j < b; j++) { const h = pal[j + 1].a - pal[j].b; if (h > hueco) { hueco = h; mejor = j; } }
    cortes.push((pal[mejor].b + pal[mejor + 1].a) / 2);
  }
  cortes.push(total);
  console.log('\nFrase · palabras del guion encontradas · lo que se oye en ese tramo');
  FR.forEach((f, fi) => {
    const dest = path.join(vozDir, f.num + '.wav');
    for (const viejo of fs.readdirSync(vozDir)) if (viejo.startsWith(f.num + '.') || viejo.startsWith(f.num + '-')) fs.rmSync(path.join(vozDir, viejo));
    ff(['-ss', String(cortes[fi]), '-to', String(cortes[fi + 1]), '-i', audio, '-ar', '48000', '-ac', '1', dest]);
    const oido = pal.filter(w => (w.a + w.b) / 2 >= cortes[fi] && (w.a + w.b) / 2 < cortes[fi + 1]).map(w => w.crudo.trim()).join(' ');
    const de = norm(f.texto).length;
    console.log(`${f.num} · ${porFrase[fi].length}/${de}${porFrase[fi].length < de * 0.6 ? ' ⚠ REVISAR' : ''} · ${oido}`);
  });
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (!estimar) {
  const grabada = opcion('--grabada');
  if (grabada) { if (grabada === true) { console.error('Uso: --grabada <archivo de audio>'); process.exit(1); } partirGrabacion(path.resolve(grabada)); }
  const say = opcion('--say');
  const faltan = FR.filter(f => !buscarAudio(vozDir, f.num));
  if (faltan.length && say) {
    const voz = say === true ? undefined : say;
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lista-say-'));
    for (const f of faltan) {
      // las palabras en MAYÚSCULAS se pasan a minúscula para que no las deletree
      const texto = f.texto.replace(/\b[A-ZÁÉÍÓÚÑ]{2,}\b/g, w => w.toLowerCase());
      let cruda; try { cruda = vozDePrueba(texto, path.join(tmp, f.num), { voz }); } catch (e) { console.error(e.message); process.exit(1); }
      ff(['-i', cruda, '-ar', '48000', '-ac', '1', path.join(vozDir, f.num + '.wav')]);
    }
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`Generadas ${faltan.length} frases con la voz de la computadora${voz ? ' «' + voz + '»' : ''}. Es de PRUEBA: no se publica.`);
  } else if (faltan.length) {
    console.error(`Faltan ${faltan.length} frases en ${vozDir}:`);
    faltan.forEach(f => console.error(`  ${f.num}.mp3 (o .wav, .m4a)  «${f.texto}»`));
    console.error('Ponlas con ese nombre, o usa --say, --grabada <audio> o --estimar.');
    process.exit(1);
  }
}

// ── 2. Recortar silencios de las puntas y medir ──────────────────────────────────────────────────────
const UMBRAL = 'start_periods=1:start_silence=0.04:start_threshold=-45dB';
if (!estimar) {
  fs.rmSync(lista, { recursive: true, force: true }); fs.mkdirSync(lista, { recursive: true });
  for (const f of FR) {
    f.origen = buscarAudio(vozDir, f.num);
    f.archivo = path.join(lista, f.num + '.wav');
    ff(['-i', f.origen, '-af', `silenceremove=${UMBRAL},areverse,silenceremove=${UMBRAL},areverse`, '-ar', '48000', '-ac', '1', f.archivo]);
    f.dura = +duracion(f.archivo).toFixed(2);
    if (f.dura < 0.3) { console.error(`La frase ${f.num} quedó vacía tras quitar silencios (${f.origen}). ¿Está grabada muy bajo?`); process.exit(1); }
  }
} else FR.forEach(f => { f.dura = +(0.5 + f.texto.split(/\s+/).length * 0.3).toFixed(2); });

// ── 3. Línea de tiempo ───────────────────────────────────────────────────────────────────────────────
const X = C.tiempos, r2 = x => +x.toFixed(2);
let t = X.arranque;
const cats = C.categorias.map((k, i) => {
  const f = FR.find(q => q.tipo === 'categoria' && q.i === i);
  const t0 = r2(t), tVoz = r2(t0 + X.antes); f.entra = tVoz;
  const tItems = k.items.map((_, j) => r2(tVoz + f.dura + X.pausa + j * X.fragmento));
  const t1 = r2(tItems[tItems.length - 1] + X.fragmento + X.cola); t = t1;
  return { t0, tVoz, voz: f.dura, tItems, t1 };
});
const cierreT0 = r2(t);
const pantallas = (C.cierre.pantallas || []).map((p, i) => {
  const f = FR.find(q => q.tipo === 'cierre' && q.i === i);
  const t0 = r2(t), tVoz = r2(t0 + 0.25); f.entra = tVoz; const t1 = r2(tVoz + f.dura + 0.3); t = t1;
  return { t0, tVoz, voz: f.dura, t1 };
});
const ultimaVoz = pantallas.length ? pantallas[pantallas.length - 1].tVoz + pantallas[pantallas.length - 1].voz : t;
const dur = r2(ultimaVoz + X.colaFinal), fps = 30;
const T = { fps, frag: X.fragmento, dur, frames: Math.round(dur * fps), estimado: estimar, cats, cierre: { t0: cierreT0, pantallas },
  frases: FR.map(f => ({ num: f.num, tipo: f.tipo, texto: f.texto, entra: f.entra, dura: f.dura })) };
fs.writeFileSync(path.join(dir, 'tiempos.js'),
  '// Generado por scripts/voz.mjs. No lo edites a mano: cambia config.js o la voz y vuelve a correrlo.\nwindow.TIEMPOS = ' + JSON.stringify(T, null, 1) + ';\n');

// ── 4. Pista de voz alineada ─────────────────────────────────────────────────────────────────────────
if (!estimar) {
  const args = [], filtros = [];
  FR.forEach((f, i) => { args.push('-i', f.archivo); filtros.push(`[${i}:a]adelay=${Math.round(f.entra * 1000)}:all=1[a${i}]`); });
  const mezcla = FR.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${FR.length}:normalize=0,apad=whole_dur=${dur},loudnorm=I=-16:TP=-1.5:LRA=11[o]`;
  ff([...args, '-filter_complex', filtros.join(';') + ';' + mezcla, '-map', '[o]', '-t', String(dur), '-ar', '48000', '-ac', '2', path.join(dir, 'pista-voz.wav')]);
}

console.log(`\n${estimar ? 'Tiempos ESTIMADOS (sin audio)' : 'Voz lista'} · duración total ${seg(dur)} s · ${T.frames} cuadros`);
console.log('Frase · entra (s) · dura (s) · texto');
FR.forEach(f => console.log(`${f.num} · ${seg(f.entra)} · ${seg(f.dura)} · ${f.texto}`));
console.log(`\nEscrito: tiempos.js${estimar ? '' : ' y pista-voz.wav'} en ${dir}`);
if (estimar) console.log('Antes del render final, corre voz.mjs otra vez con la voz de verdad.');
