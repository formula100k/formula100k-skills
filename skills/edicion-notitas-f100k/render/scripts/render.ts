#!/usr/bin/env tsx
/**
 * Render del estilo «notitas».
 *
 *   tsx scripts/render.ts <DEST> [--out nombre.mp4] [--solo-resolver] [--desde s --hasta s]
 *
 * Lee de <DEST>: PLAN.json (lo escribe el agente), captions.json y edl.json
 * (los deja el corte de editor-video-formula100k) y el video cortado.
 * Resuelve cada cue anclado por frase a segundos, agrega la cámara por
 * corte y los efectos de sonido, y renderiza <DEST>/BORRADOR_NOTITAS.mp4.
 */
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import type {Camara, ItemLamina, Lamina, Mockup, Nota, NotitasProps, Palabra, Sfx, Sticker, ZonaSub} from '../src/tipos';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 30;

// ── argumentos ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DEST = path.resolve(args[0] ?? '');
const flag = (n: string) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const SOLO_RESOLVER = args.includes('--solo-resolver');
// --gancho N: renderiza la variante N de `ganchos` (A, B, C…) en lugar de `gancho`.
// Mismo video, solo cambian los primeros segundos: para subirlas como trial reels.
const VARIANTE = flag('--gancho');
const LETRA = VARIANTE !== undefined ? String.fromCharCode(65 + Number(VARIANTE)) : '';
const OUT = path.join(DEST, flag('--out') ?? (LETRA ? `BORRADOR_NOTITAS_${LETRA}.mp4` : 'BORRADOR_NOTITAS.mp4'));
if (!args[0] || !fs.existsSync(path.join(DEST, 'PLAN.json'))) {
  console.error('uso: render.ts <DEST con PLAN.json, captions.json y el video cortado>');
  process.exit(1);
}

const leer = (f: string) => JSON.parse(fs.readFileSync(path.join(DEST, f), 'utf8'));
const plan = leer('PLAN.json');
if (VARIANTE !== undefined) {
  const v = plan.ganchos?.[Number(VARIANTE)];
  if (!v) {
    console.error(`[error] PLAN.json no tiene ganchos[${VARIANTE}]`);
    process.exit(1);
  }
  plan.gancho = v;
}
const crudas: {word?: string; text?: string; start: number; end: number}[] = leer('captions.json');
const edl: {newStart: number; newEnd: number}[] = fs.existsSync(path.join(DEST, 'edl.json')) ? leer('edl.json') : [];
const avisos: string[] = [];

// ── anclaje por frase ────────────────────────────────────────────────────
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ%]+/g, ' ')
    .trim();

const palabrasTxt = crudas.map((c) => (c.word ?? c.text ?? '').trim());
const tokens = palabrasTxt.map(norm);

/** Índice de la primera palabra de `frase` (ocurrencia n, buscando desde `desdeIdx`). */
function buscar(frase: string, n = 1, desdeIdx = 0): {i: number; j: number} | null {
  const objetivo = norm(frase).split(' ').filter(Boolean);
  if (!objetivo.length) return null;
  let vistas = 0;
  for (let i = desdeIdx; i < tokens.length; i++) {
    let ok = true;
    for (let k = 0; k < objetivo.length; k++) {
      const tk = tokens[i + k];
      // la última palabra de la frase puede ser prefijo («mill» → «millones»)
      if (tk === undefined || (k < objetivo.length - 1 ? tk !== objetivo[k] : !tk.startsWith(objetivo[k]))) {
        ok = false;
        break;
      }
    }
    if (ok && ++vistas === n) return {i, j: i + objetivo.length - 1};
  }
  return null;
}

type Ancla = {en?: string; t?: number; n?: number};
function inicio(c: Ancla, que: string): {t: number; j: number} | null {
  if (typeof c.t === 'number') {
    const j = crudas.findIndex((w) => w.start >= c.t!);
    return {t: c.t, j: j < 0 ? crudas.length - 1 : j};
  }
  if (!c.en) {
    avisos.push(`${que}: sin «en» ni «t», lo salto`);
    return null;
  }
  const r = buscar(c.en, c.n ?? 1);
  if (!r) {
    avisos.push(`${que}: no encontré «${c.en}» en el transcript, lo salto`);
    return null;
  }
  return {t: crudas[r.i].start, j: r.j};
}

/** `hasta` puede ser una duración en segundos o una frase posterior. */
function fin(desde: {t: number; j: number}, hasta: unknown, porDefecto: number, que: string): number {
  if (typeof hasta === 'number') return desde.t + hasta;
  if (typeof hasta === 'string') {
    const r = buscar(hasta, 1, desde.j);
    if (r) return crudas[r.j].end;
    avisos.push(`${que}: no encontré el «hasta» «${hasta}», uso ${porDefecto}s`);
  }
  return desde.t + porDefecto;
}

// La duración manda el video, no el transcript: el último «chao» puede
// terminar después de la última palabra que Whisper reconoció.
const videoPlan = plan.video ?? '_source_cut.mov';
const sonda = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(DEST, videoPlan)], {encoding: 'utf8'});
const DURACION = Number(sonda.stdout.trim()) || Math.max(crudas.at(-1)?.end ?? 1, edl.at(-1)?.newEnd ?? 0);

// ── subtítulos ───────────────────────────────────────────────────────────
const amarillas = new Set<string>((plan.amarillas ?? []).map(norm));
const palabras: Palabra[] = crudas.map((c, i) => ({
  w: palabrasTxt[i],
  start: c.start,
  end: c.end,
  amarilla: amarillas.has(tokens[i]) || /\d/.test(tokens[i]),
}));

const ZONAS: Record<string, Omit<ZonaSub, 'desde'>> = {
  izq: {x: 70, y: 1160, alinear: 'izq'},
  der: {x: 1010, y: 1160, alinear: 'der'},
  'izq-alta': {x: 70, y: 720, alinear: 'izq'},
  'der-alta': {x: 1010, y: 720, alinear: 'der'},
  centro: {x: 540, y: 1460, alinear: 'centro'},
};
const zona = (nombre: string | undefined, que: string) => {
  const z = ZONAS[nombre ?? 'izq'];
  if (!z) avisos.push(`${que}: zona «${nombre}» no existe (${Object.keys(ZONAS).join(', ')}), uso izq`);
  return z ?? ZONAS.izq;
};
const sub = plan.subtitulos ?? {};
const zonas: ZonaSub[] = [{desde: 0, ...zona(sub.zona, 'subtitulos.zona')}];
for (const c of sub.cambios ?? []) {
  const a = inicio(c, 'subtitulos.cambios');
  if (a) zonas.push({...(c.oculto ? {...zonas.at(-1)!, oculto: true} : zona(c.zona, 'subtitulos.cambios')), desde: a.t});
}
zonas.sort((a, b) => a.desde - b.desde);

// ── cámara: un encuadre distinto en cada corte + eventos ─────────────────
const cam = plan.camara ?? {};
const camara: Camara[] = [];
// Los cortes salen de cortes.json si el video se recortó a mano después
// del corte automático (el edl.json queda viejo); si no, del edl.json.
const cortes: number[] = fs.existsSync(path.join(DEST, 'cortes.json'))
  ? leer('cortes.json')
  : edl.slice(1).map((s) => s.newStart);
if (cam.auto !== false && cortes.length) {
  const zoomCorte = cam.zoomCorte ?? 1.1;
  let cerrado = false;
  let tramoDesde = 0;
  for (const corte of cortes) {
    // Un tramo de menos de medio segundo no cambia de encuadre: se vería un parpadeo.
    if (corte - tramoDesde < 0.5) continue;
    camara.push({desde: tramoDesde, hasta: corte, zoom: cerrado ? zoomCorte : 1});
    cerrado = !cerrado;
    tramoDesde = corte;
  }
  camara.push({desde: tramoDesde, hasta: DURACION + 1, zoom: cerrado ? zoomCorte : 1});
}

const sfx: Sfx[] = [];
const VOL = plan.sfx?.volumen ?? 1;
// Banco de efectos: papel, lápiz y caricatura. Cada uno con el volumen que
// lo deja debajo de la voz (los .wav no vienen todos al mismo nivel).
const BANCO: Record<string, number> = {
  papel: 0.3, papel_arruga: 0.22, papel_desliza: 0.3, lapiz: 0.22, plumon: 0.25, sello: 0.18,
  boing: 0.16, bloop: 0.2, chirrido: 0.12, bocina: 0.14, silbato_sube: 0.2, silbato_baja: 0.2,
  caja: 0.3, scratch: 0.25, ding_doble: 0.25,
  tic: 0.25, sparkle: 0.14, rewind: 0.2, typing: 0.3, pop1: 0.5, pop2: 0.5, whoosh1: 0.35, swoosh1: 0.35, click1: 0.5, ding1: 0.5,
};
const efecto = (t: number, nombre: string, vol?: number, dur?: number) => {
  const base = nombre.replace(/\.wav$/, '');
  if (!(base in BANCO)) avisos.push(`sfx «${nombre}» no está en el banco (${Object.keys(BANCO).join(', ')})`);
  sfx.push({t, archivo: `${base}.wav`, vol: (vol ?? BANCO[base] ?? 0.3) * VOL, dur});
};
// Lo que suena si el plan no dice otra cosa. Los memes alternan entre
// efectos de caricatura para que no suene siempre igual.
const CHISTOSOS = ['boing', 'bloop', 'papel_arruga', 'chirrido'];
let turnoChiste = 0;
const sfxDe = (pedido: unknown, porDefecto: string) =>
  pedido === false ? null : typeof pedido === 'string' ? pedido : porDefecto;

for (const e of cam.eventos ?? []) {
  const a = inicio(e, 'camara.eventos');
  if (!a) continue;
  const hasta = fin(a, e.hasta ?? e.dur, 1.2, 'camara.eventos');
  camara.push({desde: a.t, hasta, zoom: e.zoom ?? (e.marco || e.bn ? 1 : 1.25), ox: e.ox, oy: e.oy, bn: e.bn, marco: e.marco});
  const se = sfxDe(e.sfx, e.bn ? 'silbato_baja' : e.marco ? 'papel_desliza' : 'whoosh1');
  if (se) efecto(a.t, se);
}

// ── gancho ───────────────────────────────────────────────────────────────
const tiempoEscritura = (texto: string) => Math.min(1.1, Math.max(0.3, texto.length * 0.035));
let gancho: NotitasProps['gancho'] = null;
if (plan.gancho?.lineas?.length) {
  const g = plan.gancho;
  const hasta =
    typeof g.hasta === 'string' ? fin({t: 0, j: 0}, g.hasta, 4, 'gancho.hasta') : (g.hasta ?? 4);
  gancho = {...g, hasta};
  efecto(0, g.estilo === 'golpe' ? 'whoosh1' : 'sello');
  if (g.estilo === 'golpe') {
    const palabras = g.lineas.join(' ').split(/\s+/).filter(Boolean).length;
    if (palabras > 5) avisos.push(`gancho golpe con ${palabras} palabras: el patrón pide 2 a 5`);
    if (g.sub) avisos.push('gancho golpe con sub: el patrón va sin tercera línea');
  }
  if (g.sub) efecto(g.subDesde ?? 0.4, 'typing', undefined, tiempoEscritura(g.sub));
}

// ── notitas ──────────────────────────────────────────────────────────────
const notitas: Nota[] = [];
for (const n of plan.notitas ?? []) {
  const a = inicio(n, `notita «${n.texto}»`);
  if (!a) continue;
  const desde = a.t + (n.offset ?? 0);
  const hasta = fin({t: desde, j: a.j}, n.hasta ?? n.dur, 2, `notita «${n.texto}»`);
  // Que nunca se salga del cuadro: se estima el ancho de la línea más
  // larga y se achica o se corre hacia adentro.
  let tamano = n.tamano ?? 84;
  const largo = Math.max(...String(n.texto).split('\n').map((x: string) => x.length));
  const factor = n.fuente === 'serif' ? 0.42 : 0.47;
  if (largo * tamano * factor > 980) {
    const nuevo = Math.floor(980 / (largo * factor));
    avisos.push(`notita «${n.texto}»: no entraba a ${tamano} px, la dejo en ${nuevo}`);
    tamano = nuevo;
  }
  const mitad = (largo * tamano * factor) / 2;
  const x = Math.min(1030 - mitad, Math.max(50 + mitad, n.x));
  notitas.push({...n, x, tamano, desde, hasta});
  const sn = sfxDe(n.sfx, n.escribe === false ? 'sello' : 'typing');
  if (sn) efecto(desde, sn, undefined, sn === 'typing' ? tiempoEscritura(n.texto) : undefined);
}

// ── stickers ─────────────────────────────────────────────────────────────
const stickers: Sticker[] = [];
let alterna = 0;
for (const s of plan.stickers ?? []) {
  const que = `sticker ${s.src ?? s.emoji}`;
  if (s.src && !fs.existsSync(path.join(DEST, s.src))) {
    avisos.push(`${que}: no existe ${s.src} en la carpeta, lo salto`);
    continue;
  }
  const a = inicio(s, que);
  if (!a) continue;
  const desde = a.t + (s.offset ?? 0);
  stickers.push({...s, desde, hasta: fin({t: desde, j: a.j}, s.hasta ?? s.dur, 1.6, que)});
  const tipo = s.emoji ? 'emoji' : (s.tipo ?? 'meme');
  const porDefecto =
    tipo === 'meme' ? CHISTOSOS[turnoChiste++ % CHISTOSOS.length] : tipo === 'captura' ? 'papel' : alterna++ % 2 ? 'bloop' : 'pop1';
  const ss = sfxDe(s.sfx, porDefecto);
  if (ss) efecto(desde, ss);
}

for (const e of plan.sfx?.extra ?? []) {
  const a = inicio(e, `sfx ${e.archivo}`);
  if (a) efecto(a.t + (e.offset ?? 0), e.archivo, e.vol);
}

// ── mockups de lo que se nombra (prompt, skill, voz, chat, carpeta, post) ─
// 19-oct: «skill», «prompt», «nota de voz» o «carpeta» nunca quedan en un
// logo o un emoji: se ve la cosa. Los tiempos internos se anclan por frase
// (`accion_en`, `tiempos_en`, `envia_en`, `respuesta_en`) y viajan relativos.
const TIPOS_MOCKUP = ['prompt', 'guion', 'skill', 'voz', 'chat', 'carpeta', 'post_ig'];
const mockups: Mockup[] = [];
// Los tiempos internos se buscan desde la palabra donde entra la tarjeta
// («tu perfil» puede decirse antes; vale la vez que cae dentro del mockup).
const momento = (ancla: unknown, que: string, desdeIdx = 0): number | undefined => {
  if (ancla == null) return undefined;
  if (typeof ancla === 'number') return ancla;
  const r = buscar(String(ancla), 1, desdeIdx);
  if (!r) avisos.push(`${que}: no encontré «${ancla}» después de que entra la tarjeta`);
  return r ? crudas[r.i].start : undefined;
};
/** Alto aproximado de cada tarjeta (para ubicarla y ver si pisa el subtítulo). */
const altoMockup = (m: Mockup, w: number) => {
  const lineas = (txt: string, porLinea: number) => Math.max(1, Math.ceil(txt.length / porLinea));
  const k = w / 760;
  switch (m.tipo) {
    case 'prompt': return (200 + lineas(m.texto ?? '', 34) * 42 + 100 + (m.respuesta ? 70 : 0) + (m.imgs?.length ? 165 : 0)) * k;
    case 'guion': return (130 + (m.items?.length ?? 0) * 70) * k;
    case 'skill': return (180 + (m.items?.length ? 50 + m.items.length * 58 : 0)) * k;
    case 'voz': return 210 * k;
    case 'chat': return (130 + (m.mensajes ?? []).reduce((a, x) => a + 30 + lineas(x.texto, 26) * 40, 0)) * k;
    case 'carpeta': return w * 0.92;
    case 'post_ig': return w * 1.25 + 170 * k + (m.texto ? 60 : 0);
  }
  return 400;
};
for (const m of plan.mockups ?? []) {
  const que = `mockup ${m.tipo}${m.texto ? ` «${String(m.texto).slice(0, 24)}»` : ''}`;
  if (!TIPOS_MOCKUP.includes(m.tipo)) {
    avisos.push(`${que}: tipo «${m.tipo}» no existe (${TIPOS_MOCKUP.join(', ')}), lo salto`);
    continue;
  }
  const a0 = inicio(m, que);
  if (!a0) continue;
  const a = {...a0, i0: Math.max(0, crudas.findIndex((w) => w.start >= a0.t - 0.01))};
  const desde = a.t + (m.offset ?? 0);
  const hasta = fin({t: desde, j: a.j}, m.hasta ?? m.dur, 2.4, que);
  const falta = [m.icono, m.avatar, ...(m.imgs ?? [])].filter((f) => f && !fs.existsSync(path.join(DEST, f)));
  if (falta.length) avisos.push(`${que}: no existe ${falta.join(', ')} en la carpeta`);
  const rel = (x: number | undefined) => (x == null ? undefined : Math.max(0, x - desde));
  const accion = rel(momento(m.accion_en, `${que} · accion_en`, a.i0));
  const tiempos = (m.tiempos_en ?? []).map((x: unknown, i: number) => rel(momento(x, `${que} · tiempos_en[${i}]`, a.i0)) ?? 0.3 + i * 0.3);
  const w = m.w ?? (m.tipo === 'post_ig' ? 560 : m.tipo === 'carpeta' ? 640 : 780);
  const mk: Mockup = {
    ...m,
    desde,
    hasta,
    w,
    imgs: (m.imgs ?? []).filter((f: string) => fs.existsSync(path.join(DEST, f))),
    accion: accion ?? m.accion,
    tiempos: tiempos.length ? tiempos : undefined,
    envia: rel(momento(m.envia_en, `${que} · envia_en`, a.i0)),
    respuestaEn: rel(momento(m.respuesta_en, `${que} · respuesta_en`, a.i0)),
    duracion: hasta - desde,
  };
  // Ubicación: por defecto pegada ABAJO del subtítulo (borde de arriba en y 1250)
  // y siempre dentro del cuadro (abajo hasta 1790, la franja del caption de IG).
  const h = altoMockup(mk, w);
  const arriba = m.arriba ?? (m.y != null ? m.y - h / 2 : 1250);
  const centro = Math.min(1790 - h / 2, Math.max(140 + h / 2, arriba + h / 2));
  if (centro !== arriba + h / 2) avisos.push(`${que}: no entraba en el cuadro, la subo a y=${Math.round(centro)}`);
  mk.y = centro;
  mk.x = Math.min(1080 - 36 - w / 2, Math.max(36 + w / 2, m.x ?? 540));
  if (h > 1650) avisos.push(`${que}: mide ~${Math.round(h)} px de alto, achica «w»`);
  // Si la tarjeta pisa la franja del subtítulo, el subtítulo se apaga mientras dure.
  mk.tapaSub = centro - h / 2 - (m.rotulo ? 100 : 0) < 1225 && centro + h / 2 > 1095;
  mockups.push(mk);
  // Efectos: entra con papel; luego suena lo que hace la cosa.
  const sm = sfxDe(m.sfx, 'papel');
  if (sm) efecto(desde, sm);
  const at = desde + (mk.accion ?? (m.tipo === 'skill' ? 0.5 : 0.35));
  if (m.tipo === 'prompt') efecto(at, mk.pegar === false ? 'typing' : 'click1', undefined, mk.pegar === false ? 1.2 : undefined);
  if (m.tipo === 'prompt' && mk.envia != null) efecto(desde + mk.envia, 'pop2');
  if (m.tipo === 'skill') efecto(at, 'ding1');
  if (m.tipo === 'guion') efecto(desde + (mk.tiempos?.[0] ?? 0.15), 'lapiz', undefined, 0.8);
  if (m.tipo === 'voz') efecto(at, 'tic');
  if (m.tipo === 'post_ig' && mk.accion != null) efecto(at, 'pop1');
  if (m.tipo === 'carpeta') (mk.tiempos ?? (mk.imgs ?? []).map((_, i) => 0.3 + i * 0.3)).forEach((x) => efecto(desde + x + 0.4, 'tic'));
  if (m.tipo === 'chat') (mk.mensajes ?? []).forEach((_, i) => efecto(desde + (mk.tiempos?.[i] ?? 0.2 + i * 0.35), 'bloop'));
}

// ── láminas de papel a pantalla completa ─────────────────────────────────
const laminas: Lamina[] = [];
for (const [li, l] of (plan.laminas ?? []).entries()) {
  const que = `lámina «${l.titulo ?? l.tipo}»`;
  const a = inicio(l, que);
  if (!a) continue;
  const desde = a.t + (l.offset ?? 0);
  const hasta = fin({t: desde, j: a.j}, l.hasta ?? l.dur, 3.5, que);
  const items: ItemLamina[] = [];
  let previo = desde + (l.titulo ? 0.45 : 0.25);
  for (const it of l.items ?? []) {
    if (it.img && !fs.existsSync(path.join(DEST, it.img))) {
      avisos.push(`${que}: no existe ${it.img}, la saco del item`);
      delete it.img;
    }
    // Un item sin ancla entra 0,4 s después del anterior.
    const ai = it.en || typeof it.t === 'number' ? inicio(it, `${que} · ${it.texto ?? it.img}`) : null;
    const t = Math.min(hasta - 0.4, Math.max(desde + 0.2, ai ? ai.t + (it.offset ?? 0) : previo));
    previo = t + 0.4;
    items.push({t, texto: it.texto, img: it.img, tachado: it.tachado, check: it.check});
  }
  if (!['flujo', 'lista', 'mockup', 'comparar'].includes(l.tipo)) avisos.push(`${que}: tipo «${l.tipo}» no existe`);
  laminas.push({desde, hasta, tipo: l.tipo, titulo: l.titulo, items, marco: l.marco, ancho: l.ancho, tenue: l.tenue, rotulos: l.rotulos, semilla: li + 1});
  efecto(desde, 'papel_desliza');
  if (l.titulo) efecto(desde + 0.13, 'plumon');
  for (const it of items) {
    efecto(it.t, it.img ? 'papel' : l.tipo === 'flujo' || l.tipo === 'lista' ? 'lapiz' : 'tic', undefined, 0.35);
    if (it.check) efecto(it.t + 0.2, 'chirrido');
    if (it.tachado) efecto(it.t + 0.27, 'bocina');
  }
  if (l.tipo === 'comparar') {
    if (items[0]) efecto(items[0].t + 0.33, 'bocina');
    if (items[1]) efecto(items[1].t + 0.33, 'chirrido');
  }
}
// Lo que cae debajo de una lámina no se vería: se saca.
const tapado = (d: number, h: number) => laminas.some((l) => d < l.hasta && l.desde < h);
for (const lista of [notitas, stickers, mockups] as {desde: number; hasta: number; texto?: string; src?: string; emoji?: string; tipo?: string}[][]) {
  for (let i = lista.length - 1; i >= 0; i--) {
    // Si empezó antes de la lámina, se corta justo cuando entra el papel.
    const l = laminas.find((x) => lista[i].desde < x.desde && lista[i].hasta > x.desde);
    if (l && l.desde - lista[i].desde >= 0.5) lista[i].hasta = l.desde;
    if (tapado(lista[i].desde, lista[i].hasta)) {
      avisos.push(`debajo de una lámina, lo saco: ${lista[i].texto ?? lista[i].src ?? lista[i].emoji ?? lista[i].tipo}`);
      lista.splice(i, 1);
    }
  }
}
for (let i = sfx.length - 1; i >= 0; i--) {
  const enL = laminas.some((l) => sfx[i].t >= l.desde && sfx[i].t < l.hasta);
  const propio = /papel|lapiz|plumon|chirrido|bocina|tic/.test(sfx[i].archivo);
  if (enL && !propio) sfx.splice(i, 1);
}

// Dos mockups nunca a la vez: el que entra corta al anterior.
mockups.sort((a, b) => a.desde - b.desde);
for (let i = 1; i < mockups.length; i++) if (mockups[i - 1].hasta > mockups[i].desde) mockups[i - 1].hasta = mockups[i].desde;

// El subtítulo se apaga debajo de un mockup que pisa su franja y vuelve después.
for (const m of mockups.filter((x) => x.tapaSub)) {
  const activa = (t: number) => [...zonas].filter((z) => z.desde <= t).at(-1)!;
  const despues = {...activa(m.hasta), desde: m.hasta};
  zonas.push({...activa(m.desde), desde: m.desde, oculto: true}, despues);
  zonas.sort((a, b) => a.desde - b.desde);
}

// Dos efectos a menos de 0,12 s se pisan y suenan a error: queda el primero.
sfx.sort((a, b) => a.t - b.t);
const sfxLimpio = sfx.filter((s, i) => i === 0 || s.t - sfx[i - 1].t >= 0.12);

// ── reporte de ritmo: una cosa a la vez y nunca 5 s vacíos ───────────────
const elementos = [
  ...(gancho ? [{desde: 0, hasta: gancho.hasta, que: 'gancho'}] : []),
  ...notitas.map((n) => ({desde: n.desde, hasta: n.hasta, que: `notita «${n.texto}»`})),
  ...stickers.map((s) => ({desde: s.desde, hasta: s.hasta, que: `sticker ${s.src ?? s.emoji}`})),
  ...laminas.map((l) => ({desde: l.desde, hasta: l.hasta, que: 'lámina'})),
  ...mockups.map((m) => ({desde: m.desde, hasta: m.hasta, que: `mockup ${m.tipo}`})),
  ...camara.filter((c) => c.zoom !== 1 && c.zoom !== 1.1 || c.bn || c.marco).map((c) => ({desde: c.desde, hasta: c.hasta, que: 'cámara'})),
].sort((a, b) => a.desde - b.desde);
let ultimo = 0;
for (const e of elementos) {
  if (e.desde - ultimo > 5) avisos.push(`ritmo: ${(e.desde - ultimo).toFixed(1)} s sin nada entre ${ultimo.toFixed(1)} y ${e.desde.toFixed(1)}`);
  ultimo = Math.max(ultimo, e.hasta);
}
if (DURACION - ultimo > 5) avisos.push(`ritmo: ${(DURACION - ultimo).toFixed(1)} s sin nada al final`);
for (let i = 0; i < stickers.length; i++)
  for (let k = i + 1; k < stickers.length; k++)
    if (stickers[k].desde < stickers[i].hasta && stickers[i].desde < stickers[k].hasta)
      avisos.push(`a la vez: sticker ${stickers[i].src ?? stickers[i].emoji} y ${stickers[k].src ?? stickers[k].emoji} (${stickers[k].desde.toFixed(1)} s)`);
// Un mockup es el elemento del momento: nada de stickers ni notitas encima.
for (const m of mockups)
  for (const o of [...stickers, ...notitas.filter((n) => n.hasta - n.desde < 3)] as {desde: number; hasta: number; texto?: string; src?: string; emoji?: string}[])
    if (o.desde < m.hasta && m.desde < o.hasta)
      avisos.push(`a la vez: mockup ${m.tipo} (${m.desde.toFixed(1)} s) y ${o.texto ?? o.src ?? o.emoji}`);
// Lo que el guion nombra y no tiene mockup (regla del 19-oct).
const NOMBRADOS: [RegExp, string][] = [
  [/^prompts?$/, 'prompt'], [/^guion(es)?$/, 'guion'], [/^skills?$/, 'skill'], [/^(voz|audio|audios|grabacion)$/, 'voz'], [/^carpetas?$/, 'carpeta'],
];
for (const [re, tipo] of NOMBRADOS) {
  const dichos = crudas.filter((_, i) => re.test(tokens[i]));
  if (dichos.length && !mockups.some((m) => m.tipo === tipo || (tipo === 'voz' && m.tipo === 'chat')))
    avisos.push(`se nombra «${palabrasTxt[crudas.indexOf(dichos[0])]}» (${dichos[0].start.toFixed(1)} s) y no hay mockup ${tipo}`);
}
const cadencia = elementos.length ? DURACION / elementos.length : 0;

// El golpe es UNA cosa: si una notita entra arriba mientras dura, el golpe le deja el lugar.
if (gancho?.estilo === 'golpe') {
  for (const n of notitas) {
    if (n.y < 760 && n.desde > 0.8 && n.desde < gancho.hasta) gancho.hasta = n.desde - 0.05;
  }
}

const props: NotitasProps = {
  video: plan.video ?? '_source_cut.mov',
  palabras,
  zonas,
  tamanoSub: sub.tamano ?? 78,
  colorClave: plan.colorClave,
  ventanasLimpias: plan.ventanasLimpias,
  camara,
  gancho,
  notitas,
  stickers,
  laminas,
  mockups,
  sfx: sfxLimpio,
  duracionFrames: Math.ceil(DURACION * FPS),
};

fs.writeFileSync(path.join(DEST, '_props_notitas.json'), JSON.stringify(props, null, 2));
console.log(
  `[plan] ${DURACION.toFixed(1)} s · ${notitas.length} notitas · ${stickers.length} stickers · ` +
    `${laminas.length} láminas · ${mockups.length} mockups · ${camara.length} tramos de cámara · ${sfxLimpio.length} efectos · un elemento cada ${cadencia.toFixed(1)} s`,
);
for (const a of avisos) console.log(`[warn] ${a}`);
if (SOLO_RESOLVER) process.exit(0);

if (!fs.existsSync(path.join(DEST, props.video))) {
  console.error(`[error] no existe el video ${props.video} en ${DEST}`);
  process.exit(1);
}

// ── render ───────────────────────────────────────────────────────────────
fs.mkdirSync(path.join(DEST, '_sfx'), {recursive: true});
for (const f of fs.readdirSync(path.join(RAIZ, 'sfx'))) fs.copyFileSync(path.join(RAIZ, 'sfx', f), path.join(DEST, '_sfx', f));

const desdeS = flag('--desde');
const hastaS = flag('--hasta');
const frameRange: [number, number] | undefined =
  desdeS || hastaS
    ? [Math.round(Number(desdeS ?? 0) * FPS), Math.min(props.duracionFrames - 1, Math.round(Number(hastaS ?? DURACION) * FPS))]
    : undefined;

const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'src/index.ts'), publicDir: DEST});
const composition = await selectComposition({serveUrl, id: 'notitas', inputProps: props});
let ultimoPct = -1;
await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  crf: 18,
  outputLocation: OUT,
  inputProps: props,
  frameRange,
  chromiumOptions: {gl: 'angle'},
  onProgress: ({progress}) => {
    const pct = Math.floor(progress * 10) * 10;
    if (pct !== ultimoPct) {
      ultimoPct = pct;
      console.log(`[render] ${pct}%`);
    }
  },
});
// Volumen de entrega para Instagram: −14 LUFS, picos a −1,5 dB. El video no se recodifica.
const tmp = OUT.replace(/\.mp4$/, '_tmp.mp4');
const volumen = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', OUT, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', tmp]);
if (volumen.status === 0) fs.renameSync(tmp, OUT);
else console.log('[warn] no pude normalizar el volumen; queda como salió del render');
console.log(`[ok] ${OUT}`);
