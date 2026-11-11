#!/usr/bin/env node
// revisar.mjs — la compuerta de cuadros del expediente. Abre la pieza armada, pinta TODOS los cuadros y comprueba
// con el registro del motor lo que se puede medir de la lista de revisión de cuadros:
//   1. nada fuera de la zona segura (60 px a los lados, nada arriba de y=220 ni abajo de y=1650)
//   2. nada encimado (etiqueta, rótulo, cifra, título, subtítulo, gancho)
//   3. toda etiqueta, mira o visor cuelga de un ancla que SE VE entera en el cuadro, y ningún texto la tapa
//   4. no hay subtítulo mientras el gancho está en pantalla
//   5. la cámara no se queda quieta más de 1,5 s y menos del 20 % del tiempo está congelado
// Además escribe la tabla «etiqueta → qué señala» (para leerla a ojo junto a la hoja de contacto) y los golpes de sonido.
// Uso: node revisar.mjs <fuente/pieza.html> <salida.json>     · sale con código 1 si hay faltas
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';
const [pieza, salida] = process.argv.slice(2);
if (!pieza || !salida) { console.error('uso: node revisar.mjs <pieza.html> <salida.json>'); process.exit(2); }
// usa el playwright-core de la skill clonador-de-edicion-f100k (o la carpeta que digas en CLONADOR_EDICION)
const K = (process.env.CLONADOR_EDICION || join(homedir(), '.claude/skills/clonador-de-edicion-f100k')).replace(/^~/, homedir());
const { chromium } = createRequire(K + '/')('playwright-core');
const flags = { args: ['--allow-file-access-from-files'] };
let nav; try { nav = await chromium.launch({ channel: 'chrome', ...flags }); } catch { nav = await chromium.launch(flags); }
const pag = await nav.newPage(); const errores = [];
pag.on('pageerror', e => errores.push(e.message));
pag.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errores.push(m.text()); });
await pag.goto('file://' + resolve(pieza) + '?render');
await pag.evaluate(() => document.fonts && document.fonts.ready); await pag.evaluate(() => window.LISTO);
const r = await pag.evaluate(() => {
  const faltas = {}, etiquetas = {}, FR = window.FRAMES, FPS = window.FPS, c = document.querySelector('canvas');
  const mini = document.createElement('canvas'); mini.width = 54; mini.height = 96; const g = mini.getContext('2d', { willReadFrequently: true });
  let previo = null, quietos = 0, racha = 0, rachaMax = 0, rachaEn = 0;
  for (let f = 0; f < FR; f++) {
    const x = window.revisarCuadro(f);
    for (const s of x.faltas) (faltas[s] ||= []).push(+x.seg);
    for (const e of x.etiquetas) { const k = e.etiqueta + ' → ' + e.senala; (etiquetas[k] ||= { ...e, desde: +x.seg, hasta: +x.seg, se_ve_min: e.se_ve }); etiquetas[k].hasta = +x.seg; etiquetas[k].se_ve_min = Math.min(etiquetas[k].se_ve_min, e.se_ve); }
    g.drawImage(c, 0, 0, 54, 96); const d = g.getImageData(0, 14, 54, 52).data;   // sin la franja del subtítulo
    if (previo) { let dif = 0; for (let i = 0; i < d.length; i += 4) dif += Math.abs(d[i] - previo[i]); dif /= d.length / 4;
      if (dif < .12) { quietos++; racha++; if (racha > rachaMax) { rachaMax = racha; rachaEn = f / FPS; } } else racha = 0; }
    previo = d;
  }
  return { faltas, etiquetas: Object.values(etiquetas), eventos: [...window.EVENTOS.entries()].map(([t, s]) => [+t, s]).sort((a, b) => a[0] - b[0]),
    inicios: INICIOS, duraciones: LINEAS.map(l => l.d), dur: FR / FPS, congelado_pct: +(100 * quietos / FR).toFixed(1), quieto_max_s: +(rachaMax / FPS).toFixed(2), quieto_max_en: +rachaEn.toFixed(2) };
});
await nav.close();
const lista = Object.entries(r.faltas).map(([s, ts]) => ({ falta: s, desde: Math.min(...ts), hasta: Math.max(...ts), cuadros: ts.length }));
if (r.quieto_max_s > 1.5) lista.push({ falta: `la imagen se queda quieta ${r.quieto_max_s} s (tope 1,5 s)`, desde: r.quieto_max_en - r.quieto_max_s, hasta: r.quieto_max_en });
if (r.congelado_pct > 20) lista.push({ falta: `${r.congelado_pct} % del tiempo congelado (tope 20 %)` });
for (const e of r.etiquetas) if (e.se_ve_min < .85) lista.push({ falta: `«${e.etiqueta}» señala algo que no se ve entero: ${e.senala}`, desde: e.desde, hasta: e.hasta });
const out = { paso: !lista.length && !errores.length, faltas: lista, errores, congelado_pct: r.congelado_pct, quieto_max_s: r.quieto_max_s, etiquetas: r.etiquetas, eventos: r.eventos, inicios: r.inicios, duraciones: r.duraciones, dur: r.dur };
writeFileSync(salida, JSON.stringify(out, null, 1));
console.log(`revisión de cuadros: ${lista.length} faltas · congelado ${r.congelado_pct} % · quieto máx ${r.quieto_max_s} s · ${r.etiquetas.length} etiquetas · ${r.eventos.length} golpes`);
for (const l of lista) console.log('  ✗', l.falta, l.desde !== undefined ? `(${l.desde}–${l.hasta} s)` : '');
for (const e of errores) console.log('  ! página:', e);
console.log('\nETIQUETA → LO QUE SEÑALA (compruébalo a ojo en la hoja de contacto):');
for (const e of r.etiquetas) console.log(`  ${String(e.desde).padStart(5)}–${String(e.hasta).padEnd(5)} s  ${e.etiqueta}  →  ${e.senala}  [se ve ${Math.round(e.se_ve_min * 100)} %]`);
process.exit(out.paso ? 0 : 1);
