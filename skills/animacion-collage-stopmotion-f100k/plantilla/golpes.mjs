#!/usr/bin/env node
// golpes.mjs — encuentra los golpes (beats) de una pista y ajusta tiempos de animación a ellos.
// Sin dependencias: solo Node 18+ y ffmpeg/ffprobe en el PATH.
//
//   node golpes.mjs analizar pista.mp3 [--salida golpes.json] [--compas 4] [--bpm-min 60] [--bpm-max 180]
//   node golpes.mjs rejilla --bpm 120 --duracion 20 [--primer 0] [--compas 4] [--salida golpes.json]
//   node golpes.mjs ajustar golpes.json 2.8,5.4,9 [--tolerancia 0.35] [--fuertes] [--inicio 0]
//   node golpes.mjs alinear golpes.json 3.4 [--desde 0]
//   node golpes.mjs mezclar video.mp4 pista.mp3 salida.mp4 [--inicio 0] [--volumen 0.8] [--con-voz]
//
// Este archivo viaja copiado, idéntico, en varias skills. No lo edites en una sola:
// `node probar-golpes.mjs` avisa si las copias dejaron de coincidir.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const VERSION = 1;
const SR = 16000;   // muestras por segundo del análisis
const HOP = 80;     // 5 ms entre medidas
const WIN = 320;    // ventana de 20 ms
const PASO = HOP / SR;
const r3 = (x) => Math.round(x * 1000) / 1000;

/* ───────────────────────── audio → muestras ───────────────────────── */
function decodificar(archivo, maxSeg) {
  if (!fs.existsSync(archivo)) throw new Error("No encuentro el audio: " + archivo);
  const args = ["-v", "error", "-i", archivo, "-vn", "-ac", "1", "-ar", String(SR)];
  if (maxSeg) args.push("-t", String(maxSeg));
  args.push("-f", "s16le", "-");
  const r = spawnSync("ffmpeg", args, { maxBuffer: 1024 * 1024 * 1024 });
  if (r.error) throw new Error("No pude correr ffmpeg (¿está instalado?): " + r.error.message);
  if (r.status !== 0 || !r.stdout.length) throw new Error("ffmpeg no pudo leer el audio de " + archivo + "\n" + String(r.stderr || ""));
  const b = r.stdout;
  const x = new Float32Array(Math.floor(b.length / 2));
  for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(i * 2) / 32768;
  return x;
}

// filtro bicuadrático (fórmulas RBJ), aplicado dos veces para una pendiente más marcada
function filtro(x, tipo, f0) {
  const w = 2 * Math.PI * f0 / SR, c = Math.cos(w), al = Math.sin(w) / (2 * 0.7071);
  let b0, b1, b2;
  if (tipo === "bajos") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
  else { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
  const a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
  let y = x;
  for (let pasada = 0; pasada < 2; pasada++) {
    const o = new Float32Array(y.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < y.length; i++) {
      const v = (b0 * y[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = y[i]; y2 = y1; y1 = v; o[i] = v;
    }
    y = o;
  }
  return y;
}

// energía por ventana (una medida cada 5 ms)
function energia(x) {
  const n = Math.max(0, Math.floor((x.length - WIN) / HOP) + 1), e = new Float32Array(n);
  let s = 0;
  for (let i = 0; i < WIN && i < x.length; i++) s += x[i] * x[i];
  for (let k = 0; k < n; k++) {
    e[k] = s / WIN;
    const a = k * HOP;
    for (let i = 0; i < HOP; i++) { const q = x[a + i], p = x[a + WIN + i] || 0; s += p * p - q * q; }
    if (s < 0) s = 0;
  }
  return e;
}

// «novedad»: cuánto sube la energía (en escala logarítmica) respecto a 10 ms antes
function novedad(e) {
  const o = new Float32Array(e.length);
  for (let k = 2; k < e.length; k++) {
    const d = Math.log(1 + 4000 * Math.sqrt(e[k])) - Math.log(1 + 4000 * Math.sqrt(e[k - 2]));
    o[k] = d > 0 ? d : 0;
  }
  return o;
}

/* ───────────────────────── análisis ───────────────────────── */
export function analizar(archivo, opciones = {}) {
  const compas = Math.max(1, Math.round(opciones.compas || 4));
  const bpmMin = opciones.bpmMin || 60, bpmMax = opciones.bpmMax || 180;
  // un segundo de silencio por delante: así un golpe en el segundo 0 también se detecta
  const crudo = decodificar(archivo, opciones.maxSeg || 600), RELLENO = 1;
  const x = new Float32Array(crudo.length + RELLENO * SR); x.set(crudo, RELLENO * SR);
  const duracion = crudo.length / SR;
  const notas = [];
  if (duracion < 4) throw new Error("La pista dura menos de 4 s: no alcanza para sacar el tempo.");

  const xb = filtro(x, "bajos", 150), xa = filtro(x, "altos", 2000);
  const eT = energia(x), eB = energia(xb), eA = energia(xa);
  const N = eT.length;
  const nT = novedad(eT), nB = novedad(eB), nA = novedad(eA);

  // curva de novedad total, suavizada un poco y sin su promedio local (deja solo los picos)
  let O = new Float32Array(N);
  for (let k = 0; k < N; k++) O[k] = nT[k] + 1.5 * nB[k] + 0.5 * nA[k];
  const S = new Float32Array(N);
  for (let k = 1; k < N - 1; k++) S[k] = 0.25 * O[k - 1] + 0.5 * O[k] + 0.25 * O[k + 1];
  O = S;
  const R = Math.round(0.4 / PASO), acum = new Float64Array(N + 1);
  for (let k = 0; k < N; k++) acum[k + 1] = acum[k] + O[k];
  const Q = new Float32Array(N);
  let suma2 = 0;
  for (let k = 0; k < N; k++) {
    const a = Math.max(0, k - R), b = Math.min(N, k + R + 1);
    const v = O[k] - (acum[b] - acum[a]) / (b - a);
    Q[k] = v > 0 ? v : 0; suma2 += Q[k] * Q[k];
  }
  const desv = Math.sqrt(suma2 / N) || 1;
  for (let k = 0; k < N; k++) Q[k] /= desv;
  if (suma2 / N < 1e-9) throw new Error("La pista no tiene golpes que se puedan medir (¿está en silencio?).");

  // dónde empieza y dónde termina el sonido
  let pico = 0; for (let k = 0; k < N; k++) if (eT[k] > pico) pico = eT[k];
  const umbral = pico * 1e-4; // 40 dB por debajo del pico
  let k0 = 0; while (k0 < N && eT[k0] < umbral) k0++;
  let k1 = N - 1; while (k1 > k0 && eT[k1] < umbral) k1--;
  const inicioSonido = Math.max(0, k0 * PASO + WIN / SR - PASO - RELLENO), finSonido = Math.min(duracion, k1 * PASO + WIN / SR - RELLENO);

  // tempo: autocorrelación de la novedad; cada candidato suma sus 4 primeros múltiplos
  const lagMax = Math.min(N - 1, Math.ceil(4 * 60 / bpmMin / PASO) + 2);
  const ac = new Float64Array(lagMax + 1);
  for (let l = 1; l <= lagMax; l++) { let s = 0; for (let k = l; k < N; k++) s += Q[k] * Q[k - l]; ac[l] = s / (N - l); }
  const acEn = (l) => { if (l >= lagMax) return 0; const i = Math.floor(l), f = l - i; return ac[i] * (1 - f) + ac[i + 1] * f; };
  let mejor = { p: 0, bpm: 0 }, segundo = 0;
  const cand = [];
  for (let bpm = bpmMin; bpm <= bpmMax + 1e-9; bpm += 0.1) {
    const P = 60 / bpm / PASO;
    const base = acEn(P) + 0.8 * acEn(2 * P) + 0.6 * acEn(3 * P) + 0.5 * acEn(4 * P);
    const oct = Math.log2(bpm / 120);
    const p = base * Math.exp(-0.5 * (oct / 0.9) ** 2);
    cand.push([bpm, p]);
    if (p > mejor.p) mejor = { p, bpm };
  }
  for (const [bpm, p] of cand) if (Math.abs(Math.log2(bpm / mejor.bpm)) > 0.2 && p > segundo) segundo = p;
  const confianzaTempo = r3(mejor.p > 0 ? Math.max(0, 1 - segundo / mejor.p) : 0);
  const P = 60 / mejor.bpm / PASO;

  // seguimiento de golpes (programación dinámica: cada golpe quiere caer en un pico y a un período del anterior)
  const dp = new Float64Array(N), ant = new Int32Array(N).fill(-1), APRETADO = 400;
  for (let t = 0; t < N; t++) {
    let m = 0, mi = -1;
    const a = Math.max(0, Math.round(t - 2 * P)), b = Math.round(t - P / 2);
    for (let u = a; u <= b; u++) {
      const lg = Math.log((t - u) / P), v = dp[u] - APRETADO * lg * lg;
      if (v > m) { m = v; mi = u; }
    }
    dp[t] = Q[t] + m; ant[t] = mi;
  }
  let fin = N - 1, mx = -1;
  for (let t = Math.max(0, N - Math.round(1.5 * P)); t < N; t++) if (dp[t] > mx) { mx = dp[t]; fin = t; }
  const cuadros = [];
  for (let t = fin; t >= 0; t = ant[t]) { cuadros.push(t); if (ant[t] < 0) break; }
  cuadros.reverse();

  // afinar cada golpe al pico de novedad más cercano (±20 ms) con interpolación
  const SESGO = WIN / SR - 1.5 * PASO - RELLENO; // la ventana «ve» el golpe cuando ya entró; se descuenta el relleno
  let tiempos = cuadros.map((c) => {
    let b = c;
    for (let d = -4; d <= 4; d++) { const j = c + d; if (j > 0 && j < N - 1 && Q[j] > Q[b]) b = j; }
    let f = 0;
    if (b > 0 && b < N - 1 && Q[b] > 0) { const den = Q[b - 1] - 2 * Q[b] + Q[b + 1]; if (den < 0) f = 0.5 * (Q[b - 1] - Q[b + 1]) / den; }
    const hayPico = Q[b] > 0.5;
    return { t: (hayPico ? b + f : c) * PASO + SESGO, k: hayPico ? b : c, pico: hayPico };
  });
  // fuera lo que cae en el silencio del principio o del final
  const periodoSeg = 60 / mejor.bpm;
  tiempos = tiempos.filter((g) => g.t >= Math.max(-0.02, inicioSonido - 0.25 * periodoSeg) && g.t <= finSonido + 0.05);
  tiempos.forEach((g) => { if (g.t < 0) g.t = 0; });
  if (tiempos.length < 4) throw new Error("Encontré menos de 4 golpes: la pista es muy corta o no tiene pulso marcado.");

  // tempo final: recta que mejor pasa por los golpes (más fino que la autocorrelación)
  const n = tiempos.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  tiempos.forEach((g, i) => { sx += i; sy += g.t; sxx += i * i; sxy += i * g.t; });
  const pend = (n * sxy - sx * sy) / (n * sxx - sx * sx), orden = (sy - pend * sx) / n;
  const bpm = 60 / pend;
  let desvio = 0; tiempos.forEach((g, i) => { desvio += (g.t - (orden + pend * i)) ** 2; });
  desvio = Math.sqrt(desvio / n);
  const tempoEstable = desvio < 0.03;
  if (!tempoEstable) notas.push("El tempo se mueve a lo largo de la pista: usa los tiempos de «golpes», no una rejilla fija.");
  // los golpes sin pico propio (pausas de la música) se colocan sobre la recta si el tempo es estable
  if (tempoEstable) tiempos.forEach((g, i) => { if (!g.pico) g.t = orden + pend * i; });

  // fuerza de cada golpe: graves + novedad alrededor
  const mide = (arr, k, a, b) => { let m = 0; for (let j = Math.max(0, k + a); j <= Math.min(N - 1, k + b); j++) if (arr[j] > m) m = arr[j]; return m; };
  const fg = tiempos.map((g) => Math.sqrt(mide(eB, g.k, -2, 14))), fn = tiempos.map((g) => mide(Q, g.k, -3, 3));
  const mxg = Math.max(...fg) || 1, mxn = Math.max(...fn) || 1;
  const fuerza = tiempos.map((_, i) => 0.6 * fg[i] / mxg + 0.4 * fn[i] / mxn);

  // primer tiempo del compás: la fase con más fuerza acumulada
  const porFase = Array.from({ length: compas }, () => ({ s: 0, n: 0 }));
  fuerza.forEach((f, i) => { porFase[i % compas].s += f; porFase[i % compas].n++; });
  const medias = porFase.map((o) => (o.n ? o.s / o.n : 0));
  let fase = 0; medias.forEach((m, i) => { if (m > medias[fase]) fase = i; });
  const otras = medias.filter((_, i) => i !== fase);
  const confianzaCompas = compas > 1 && medias[fase] > 0 ? r3(1 - Math.max(...otras) / medias[fase]) : 0;
  if (compas > 1 && confianzaCompas < 0.05) notas.push("No se distingue bien el primer tiempo del compás: los «fuertes» son una estimación. Escucha y, si hace falta, corrige con --primer-fuerte (0 a 3) o con `primerFuerte` en la config.");
  if (opciones.primerFuerte != null) fase = ((Math.round(opciones.primerFuerte) % compas) + compas) % compas;

  // secciones: saltos grandes de energía entre compases
  const golpes = tiempos.map((g) => r3(g.t));
  const fuertes = golpes.filter((_, i) => i % compas === fase);
  const db = (a, b) => { const ka = Math.max(0, Math.round((a + RELLENO) / PASO)), kb = Math.min(N, Math.round((b + RELLENO) / PASO)); let s = 0; for (let k = ka; k < kb; k++) s += eT[k]; return 10 * Math.log10(s / Math.max(1, kb - ka) + 1e-10); };
  const bordes = [...fuertes]; if (bordes[0] > inicioSonido + 0.05) bordes.unshift(r3(inicioSonido)); bordes.push(r3(finSonido));
  const barras = []; for (let i = 0; i + 1 < bordes.length; i++) if (bordes[i + 1] - bordes[i] > 0.2) barras.push({ a: bordes[i], b: bordes[i + 1], db: db(bordes[i], bordes[i + 1]) });
  const secciones = [];
  if (barras.length) {
    let ini = 0;
    const cierra = (hasta) => { const tr = barras.slice(ini, hasta); secciones.push({ inicio: tr[0].a, fin: tr[tr.length - 1].b, db: Math.round(tr.reduce((s, q) => s + q.db, 0) / tr.length * 10) / 10 }); ini = hasta; };
    for (let i = 1; i < barras.length; i++) {
      const prev = barras.slice(Math.max(ini, i - 2), i);
      const mp = prev.reduce((s, q) => s + q.db, 0) / prev.length;
      if (Math.abs(barras[i].db - mp) >= 6 && barras[i].b - barras[i].a > 0.5) cierra(i);
    }
    cierra(barras.length);
    const mxs = Math.max(...secciones.map((s) => s.db));
    secciones.forEach((s) => { s.energia = s.db >= mxs - 3 ? "alta" : s.db >= mxs - 10 ? "media" : "baja"; });
  }

  return {
    version: VERSION, archivo: path.basename(archivo), duracion: r3(duracion),
    bpm: Math.round(bpm * 100) / 100, bpmAproximado: Math.round(mejor.bpm * 10) / 10,
    confianzaTempo, tempoEstable, compas, confianzaCompas,
    inicioSonido: r3(inicioSonido), golpes, fuertes, fuerza: fuerza.map((f) => Math.round(f * 100) / 100), secciones, notas,
  };
}

/* ───────────── rejilla: cuando solo sabes el tempo (p. ej. un audio de Instagram) ───────────── */
export function rejilla({ bpm, duracion, primer = 0, compas = 4 }) {
  if (!(bpm > 0) || !(duracion > 0)) throw new Error("rejilla necesita bpm y duracion mayores que cero.");
  const per = 60 / bpm, golpes = [];
  for (let i = 0; primer + i * per <= duracion + 1e-9; i++) golpes.push(r3(primer + i * per));
  return {
    version: VERSION, archivo: null, duracion, bpm, bpmAproximado: bpm, confianzaTempo: 1, tempoEstable: true, compas, confianzaCompas: 1,
    inicioSonido: primer, golpes, fuertes: golpes.filter((_, i) => i % compas === 0), fuerza: golpes.map((_, i) => (i % compas === 0 ? 1 : 0.5)),
    secciones: [], notas: ["Rejilla calculada a partir del tempo, sin escuchar la pista."],
  };
}

/* ───────────── pasar los golpes al reloj del video (el video empieza en el segundo `inicio` de la pista) ───────────── */
export function desplazar(G, inicio = 0, duracionVideo = Infinity) {
  const mueve = (arr) => arr.map((t) => r3(t - inicio)).filter((t) => t >= -1e-6 && t <= duracionVideo + 1e-6);
  const idx = G.golpes.map((t, i) => [t - inicio, i]).filter(([t]) => t >= -1e-6 && t <= duracionVideo + 1e-6).map(([, i]) => i);
  return { ...G, golpes: mueve(G.golpes), fuertes: mueve(G.fuertes), fuerza: idx.map((i) => G.fuerza[i]), inicio };
}

/* ───────────── ajustar una lista de tiempos al golpe más cercano ─────────────
   tiempos: números, u objetos { t, fuerte, minimo, tolerancia }
     fuerte: true = busca primero un golpe fuerte · minimo = segundos mínimos desde el tiempo anterior ya ajustado
     tolerancia = la de ese tiempo en particular
   opciones: tolerancia (s) · fuertes (todos buscan golpe fuerte) · arrastre (true = conserva las distancias
     originales: cada tiempo se busca cerca de «anterior ajustado + distancia original») · minimo (por defecto)
   Devuelve por cada tiempo: { original, ajustado, movido, tipo: "fuerte" | "golpe" | "sin cambio" }            */
export function ajustarTiempos(tiempos, G, opciones = {}) {
  const tol = opciones.tolerancia != null ? opciones.tolerancia : 0.35;
  const arrastre = !!opciones.arrastre, minDef = opciones.minimo != null ? opciones.minimo : 0.1;
  const esFuerte = new Set(G.fuertes.map((t) => Math.round(t * 1000)));
  const usados = new Set();
  let prevOrig = null, prevAj = null;
  return tiempos.map((it) => {
    const o = typeof it === "number" ? { t: it } : it;
    const quiereFuerte = o.fuerte != null ? !!o.fuerte : !!opciones.fuertes;
    const minimo = o.minimo != null ? o.minimo : minDef, tolI = o.tolerancia != null ? o.tolerancia : tol;
    const meta = arrastre && prevAj != null ? prevAj + (o.t - prevOrig) : o.t;
    const piso = prevAj != null ? prevAj + minimo : -Infinity;
    const busca = (lista) => {
      let m = null;
      for (const g of lista) {
        if (g < piso - 1e-6 || usados.has(g)) continue;
        const d = Math.abs(g - meta);
        if (d <= tolI + 1e-6 && (m == null || d < Math.abs(m - meta))) m = g;
      }
      return m;
    };
    let g = quiereFuerte ? busca(G.fuertes) : null, tipo = "fuerte";
    if (g == null) { g = busca(G.golpes); tipo = g != null && esFuerte.has(Math.round(g * 1000)) ? "fuerte" : "golpe"; }
    let ajustado;
    if (g == null) { ajustado = r3(Math.max(meta, piso === -Infinity ? meta : piso)); tipo = "sin cambio"; }
    else { ajustado = g; usados.add(g); }
    prevOrig = o.t; prevAj = ajustado;
    return { original: o.t, ajustado, movido: r3(ajustado - o.t), tipo };
  });
}

/* ───────────── utilidades para los armadores de cada plantilla ───────────── */
// el golpe más cercano a `t` (o null). opciones: tolerancia, fuertes (solo golpes fuertes), desde (no antes de ese segundo)
export function golpeCercano(G, t, { tolerancia = 0.35, fuertes = false, desde = -Infinity } = {}) {
  let m = null;
  for (const g of fuertes ? G.fuertes : G.golpes) {
    if (g < desde - 1e-6) continue;
    const d = Math.abs(g - t);
    if (d <= tolerancia + 1e-6 && (m == null || d < Math.abs(m - t))) m = g;
  }
  return m;
}
// lleva un tiempo al cuadro de video más cercano
export const alCuadro = (t, fps = 30) => Math.round(t * fps) / fps;

/* ───────────── alinear: en qué segundo de la pista arrancar para que un golpe fuerte caiga en `momento` del video ───────────── */
export function alinear(G, momento, desde = 0) {
  const c = G.fuertes.filter((t) => t - momento >= desde - 1e-6);
  if (!c.length) throw new Error("No hay un golpe fuerte lo bastante tarde en la pista para ese momento.");
  return { inicio: r3(c[0] - momento), golpeFuerte: c[0] };
}

/* ───────────── música de una pieza: lee el bloque `musica` de la config y devuelve los golpes en el reloj del video ─────────────
   musica: { archivo: "assets/pista.mp3", inicio: "auto", volumen: 0.8, mezclar: true, tolerancia: 0.6, compas: 4 }
        o  { bpm: 120, primer: 0, compas: 4 }   (sin archivo: solo el tempo)
   inicio = segundo de la pista en que arranca el video. "auto" (o nada) = su primer golpe fuerte.                        */
export function leerMusica(dir, musica, duracionVideo) {
  if (!musica) return null;
  const M = typeof musica === "string" ? { archivo: musica } : musica;
  let G;
  if (M.archivo) {
    const ruta = path.resolve(dir, M.archivo);
    const cache = path.join(dir, "golpes.json");
    const sello = fs.existsSync(ruta) ? `${path.basename(ruta)}:${fs.statSync(ruta).size}:${Math.round(fs.statSync(ruta).mtimeMs)}:${M.compas || 4}` : "";
    if (fs.existsSync(cache)) { try { const j = JSON.parse(fs.readFileSync(cache, "utf8")); if (j.sello === sello && j.version === VERSION) G = j; } catch { /* se vuelve a analizar */ } }
    if (!G) { G = analizar(ruta, { compas: M.compas, primerFuerte: M.primerFuerte }); G.sello = sello; fs.writeFileSync(cache, JSON.stringify(G, null, 1)); }
    else if (M.primerFuerte != null) { const f = ((Math.round(M.primerFuerte) % G.compas) + G.compas) % G.compas; G = { ...G, fuertes: G.golpes.filter((_, i) => i % G.compas === f) }; }
  } else if (M.bpm) {
    G = rejilla({ bpm: M.bpm, duracion: (duracionVideo || 60) + (M.inicio || 0) + 30, primer: M.primer || 0, compas: M.compas || 4 });
  } else throw new Error("`musica` necesita `archivo` (una pista) o `bpm` (solo el tempo).");
  const inicio = typeof M.inicio === "number" ? M.inicio : (M.archivo && G.fuertes.length ? G.fuertes[0] : 0);
  const V = desplazar(G, inicio, duracionVideo == null ? Infinity : duracionVideo + 30);
  return {
    golpes: V, bpm: G.bpm, archivo: M.archivo || null, inicio, duracionPista: G.duracion,
    volumen: M.volumen != null ? M.volumen : 0.8, mezclar: !!M.archivo && M.mezclar !== false,
    tolerancia: M.tolerancia != null ? M.tolerancia : null, notas: G.notas || [],
  };
}

/* ───────────── mezclar: pega la pista al MP4 ya renderizado ───────────── */
export function mezclar(video, pista, salida, { inicio = 0, volumen = 0.8, conVoz = false } = {}) {
  for (const f of [video, pista]) if (!fs.existsSync(f)) throw new Error("No encuentro " + f);
  const dur = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], { encoding: "utf8" }));
  const tieneAudio = execFileSync("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", video], { encoding: "utf8" }).trim() !== "";
  const cola = Math.min(0.5, dur / 4);
  let fc = `[1:a]atrim=start=${inicio},asetpts=PTS-STARTPTS,volume=${volumen},afade=t=out:st=${r3(dur - cola)}:d=${r3(cola)},apad[m]`;
  let mapa = "[m]";
  if (conVoz && tieneAudio) { fc += `;[0:a][m]amix=inputs=2:duration=first:normalize=0[mix]`; mapa = "[mix]"; }
  const r = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", video, "-i", pista, "-filter_complex", fc, "-map", "0:v", "-map", mapa,
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", String(dur), "-movflags", "+faststart", salida], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("ffmpeg no pudo mezclar:\n" + r.stderr);
  return { salida, duracion: dur, conVoz: conVoz && tieneAudio };
}

// lee el `window.CONFIG` de un config.js sin abrir Chrome
export function leerConfig(dir, archivo = "config.js") {
  const caja = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(dir, archivo), "utf8"), caja);
  if (!caja.window.CONFIG) throw new Error(archivo + " no define window.CONFIG");
  return caja.window.CONFIG;
}
// mezcla la pista de `musica` en un MP4 ya renderizado de la pieza que vive en `dir`
export function mezclarPieza(dir, musica, video, salida) {
  const M = leerMusica(dir, musica);
  if (!M || !M.archivo) throw new Error("config.js no tiene `musica.archivo`: no hay pista que mezclar.");
  if (!M.mezclar) throw new Error("`musica.mezclar` está en false: esta pieza se entrega sin audio (los tiempos ya van al tempo).");
  const v = path.resolve(dir, video), o = path.resolve(dir, salida || video.replace(/\.mp4$/i, "") + "-con-musica.mp4");
  return mezclar(v, path.resolve(dir, M.archivo), o, { inicio: M.inicio, volumen: M.volumen });
}

/* ───────────────────────── línea de comandos ───────────────────────── */
function opciones(argv) {
  const pos = [], op = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) { const k = argv[i].slice(2); if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) op[k] = argv[++i]; else op[k] = true; }
    else pos.push(argv[i]);
  }
  return { pos, op };
}
const num = (v, d) => (v == null || v === true ? d : parseFloat(v));

function cli() {
  const [modo, ...resto] = process.argv.slice(2);
  const { pos, op } = opciones(resto);
  const leer = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
  if (modo === "analizar") {
    if (!pos[0]) throw new Error("Falta la pista: node golpes.mjs analizar pista.mp3");
    const G = analizar(pos[0], { compas: num(op.compas, 4), bpmMin: num(op["bpm-min"], 60), bpmMax: num(op["bpm-max"], 180), primerFuerte: op["primer-fuerte"] != null ? num(op["primer-fuerte"], 0) : null });
    const salida = op.salida || "golpes.json";
    fs.writeFileSync(salida, JSON.stringify(G, null, 1));
    console.log(`Tempo: ${G.bpm} BPM (${G.tempoEstable ? "estable" : "variable"}) · ${G.golpes.length} golpes · ${G.fuertes.length} fuertes · primer golpe en ${G.golpes[0]} s`);
    console.log("Fuertes: " + G.fuertes.slice(0, 12).join(" · ") + (G.fuertes.length > 12 ? " …" : ""));
    if (G.secciones.length > 1) console.log("Secciones: " + G.secciones.map((s) => `${s.inicio}–${s.fin} s (${s.energia})`).join(" | "));
    G.notas.forEach((n) => console.log("OJO: " + n));
    console.log("Guardado en " + salida);
  } else if (modo === "rejilla") {
    const G = rejilla({ bpm: num(op.bpm), duracion: num(op.duracion, 60), primer: num(op.primer, 0), compas: num(op.compas, 4) });
    const salida = op.salida || "golpes.json";
    fs.writeFileSync(salida, JSON.stringify(G, null, 1));
    console.log(`Rejilla de ${G.bpm} BPM · ${G.golpes.length} golpes · guardada en ${salida}`);
  } else if (modo === "ajustar") {
    if (pos.length < 2) throw new Error("Uso: node golpes.mjs ajustar golpes.json 2.8,5.4,9 [--tolerancia 0.35] [--fuertes] [--inicio 0]");
    const G = desplazar(leer(pos[0]), num(op.inicio, 0));
    const res = ajustarTiempos(pos[1].split(",").map(Number), G, { tolerancia: num(op.tolerancia, 0.35), fuertes: !!op.fuertes, arrastre: !!op.arrastre, minimo: num(op.minimo, 0.1) });
    res.forEach((r) => console.log(`${String(r.original).padStart(7)} → ${String(r.ajustado).padStart(7)}   ${r.movido >= 0 ? "+" : ""}${Math.round(r.movido * 1000)} ms   ${r.tipo}`));
    console.log(res.map((r) => r.ajustado).join(","));
  } else if (modo === "alinear") {
    if (pos.length < 2) throw new Error("Uso: node golpes.mjs alinear golpes.json <segundo del video> [--desde 0]");
    const a = alinear(leer(pos[0]), parseFloat(pos[1]), num(op.desde, 0));
    console.log(`Arranca la pista en el segundo ${a.inicio}: su golpe fuerte de ${a.golpeFuerte} s cae en el segundo ${pos[1]} del video.`);
    console.log(`musica.inicio = ${a.inicio}`);
  } else if (modo === "mezclar") {
    if (pos.length < 3) throw new Error("Uso: node golpes.mjs mezclar video.mp4 pista.mp3 salida.mp4 [--inicio 0] [--volumen 0.8] [--con-voz]");
    const m = mezclar(pos[0], pos[1], pos[2], { inicio: num(op.inicio, 0), volumen: num(op.volumen, 0.8), conVoz: !!op["con-voz"] });
    console.log(`Listo: ${m.salida} (${m.duracion} s${m.conVoz ? ", música debajo del audio que ya traía" : ""})`);
  } else {
    console.log("Uso:\n  node golpes.mjs analizar pista.mp3 [--salida golpes.json] [--compas 4]\n  node golpes.mjs rejilla --bpm 120 --duracion 20 [--primer 0]\n  node golpes.mjs ajustar golpes.json 2.8,5.4,9 [--tolerancia 0.35] [--fuertes] [--inicio 0] [--arrastre]\n  node golpes.mjs alinear golpes.json 3.4\n  node golpes.mjs mezclar video.mp4 pista.mp3 salida.mp4 [--inicio 0] [--volumen 0.8] [--con-voz]");
    process.exit(modo ? 1 : 0);
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  try { cli(); } catch (e) { console.error("Error: " + e.message); process.exit(1); }
}
