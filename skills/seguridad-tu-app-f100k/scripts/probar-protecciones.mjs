#!/usr/bin/env node
// Pruebas de afuera para TU propia app publicada. Funciona igual en Mac, Windows y Linux (Node 18+).
//
// Uso:
//   node probar-protecciones.mjs https://tu-app.vercel.app
//   node probar-protecciones.mjs https://tu-app.vercel.app --portero /api/mi-ruta --n 31
//   node probar-protecciones.mjs https://tu-app.vercel.app --portero /api/mi-ruta --metodo POST
//
// Qué prueba: HTTPS (12), archivos expuestos y mapas de código (15), cabeceras (16),
// webs permitidas / CORS (14) y, solo si se pide, el portero / límite de peticiones (13).
// Úsalo SOLO con apps que son tuyas. No hace nada destructivo: solo pide páginas.

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:\/\//i.test(a));
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

if (!base) {
  console.log('Uso: node probar-protecciones.mjs <url-de-tu-app> [--portero /api/ruta] [--n 31] [--metodo GET|POST]');
  process.exit(2);
}

const BASE = base.replace(/\/+$/, '');
const portero = opt('--portero', null);
const N = Math.min(Math.max(parseInt(opt('--n', '31'), 10) || 31, 1), 60); // tope de 60: prueba suave
const METODO = opt('--metodo', 'GET').toUpperCase();
const ORIGEN_AJENO = 'https://otra-web.example';
const esLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(BASE);

const resultados = [];
const anota = (estado, control, texto) => {
  resultados.push({ estado, control, texto });
  const icono = { ok: '✅', aviso: '⚠️ ', falla: '❌', info: 'ℹ️ ' }[estado];
  console.log(`${icono} [${control}] ${texto}`);
};

async function pedir(url, opciones = {}) {
  try {
    const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), ...opciones });
    let cuerpo = '';
    try { cuerpo = await r.text(); } catch {}
    return { status: r.status, headers: r.headers, cuerpo };
  } catch (e) {
    return { status: 0, headers: new Headers(), cuerpo: '', error: e.message };
  }
}

console.log(`\nPruebas de afuera para: ${BASE}`);
console.log('Recuerda: solo con tu propia app.\n');

// Portada
const portada = await pedir(BASE + '/', { redirect: 'follow' });
if (portada.status === 0) {
  console.log(`No pude abrir ${BASE} (${portada.error}). ¿Está publicada y bien escrita la dirección?`);
  process.exit(2);
}
anota('info', '--', `La portada responde ${portada.status}.`);

// 12 · HTTPS
if (esLocal) {
  anota('info', '12', 'Es localhost: la prueba de HTTPS se hace sobre la URL publicada.');
} else {
  const http = await pedir(BASE.replace(/^https:/i, 'http:') + '/');
  const destino = http.headers.get('location') || '';
  if ([301, 302, 307, 308].includes(http.status) && destino.startsWith('https://')) {
    anota('ok', '12', `http:// redirige a https:// (${http.status}).`);
  } else if (http.status === 0) {
    anota('aviso', '12', 'No pude probar la versión http:// (puede estar bloqueada, que también está bien). Revísala a mano.');
  } else {
    anota('falla', '12', `http:// NO redirige a https:// (respondió ${http.status}).`);
  }
}

// 16 · Cabeceras
const h = portada.headers;
const csp = h.get('content-security-policy') || '';
const cspRO = h.get('content-security-policy-report-only') || '';
const tiene = (n) => !!h.get(n);
if (!esLocal) {
  tiene('strict-transport-security')
    ? anota('ok', '16', 'Strict-Transport-Security presente.')
    : anota('aviso', '16', 'Falta Strict-Transport-Security.');
}
csp
  ? anota('ok', '16', 'Content-Security-Policy presente.')
  : cspRO
    ? anota('aviso', '16', 'CSP solo en modo aviso (Report-Only). Bien para empezar; actívala cuando no rompa nada.')
    : anota('aviso', '16', 'Falta Content-Security-Policy.');
tiene('x-frame-options') || /frame-ancestors/i.test(csp)
  ? anota('ok', '16', 'Protección contra meter tu app dentro de otra web (X-Frame-Options o frame-ancestors).')
  : anota('aviso', '16', 'Falta X-Frame-Options (o frame-ancestors en la CSP).');
(h.get('x-content-type-options') || '').toLowerCase() === 'nosniff'
  ? anota('ok', '16', 'X-Content-Type-Options: nosniff presente.')
  : anota('aviso', '16', 'Falta X-Content-Type-Options: nosniff.');
tiene('referrer-policy')
  ? anota('ok', '16', 'Referrer-Policy presente.')
  : anota('aviso', '16', 'Falta Referrer-Policy.');
if (tiene('x-powered-by')) anota('info', '16', `La app dice con qué está hecha (X-Powered-By: ${h.get('x-powered-by')}). Se puede apagar.`);

// 15 · Archivos expuestos
const huella = (t) => t.replace(/\s+/g, ' ').slice(0, 2000);
const huellaPortada = huella(portada.cuerpo);
const pareceHtml = (t) => /<(!doctype html|html|head|body)\b/i.test(t.slice(0, 1000));
const rutas = [
  ['/.env', (t) => /^[A-Z0-9_]+\s*=/m.test(t)],
  ['/.env.local', (t) => /^[A-Z0-9_]+\s*=/m.test(t)],
  ['/.env.production', (t) => /^[A-Z0-9_]+\s*=/m.test(t)],
  ['/.git/config', (t) => /\[core\]/.test(t)],
  ['/.git/HEAD', (t) => /^ref:\s/m.test(t)],
  ['/.vercel/project.json', (t) => /"projectId"/.test(t)],
  ['/.DS_Store', (t) => t.includes('Bud1')],
  ['/index.html.bak', (t) => pareceHtml(t)],
  ['/index-viejo.html', (t) => pareceHtml(t)],
  ['/backup.zip', (t) => t.startsWith('PK')],
  ['/schema.sql', (t) => /create\s+table/i.test(t)],
  ['/package.json', (t) => /"dependencies"/.test(t)],
];
let expuestos = 0;
for (const [ruta, delata] of rutas) {
  const r = await pedir(BASE + ruta);
  if (r.status === 200 && huella(r.cuerpo) !== huellaPortada && delata(r.cuerpo)) {
    expuestos++;
    anota('falla', '15', `${ruta} se puede descargar (200). Sácalo de la carpeta publicada.`);
  }
}
if (!expuestos) anota('ok', '15', `Ninguno de ${rutas.length} archivos sensibles se puede descargar.`);

// 15 · Mapas de código (source maps)
const scripts = [...portada.cuerpo.matchAll(/<script[^>]+src=["']([^"']+\.js)(\?[^"']*)?["']/gi)]
  .map((m) => m[1])
  .filter((s) => !/^https?:\/\//i.test(s) || s.startsWith(BASE))
  .slice(0, 3);
if (!scripts.length) {
  anota('info', '15', 'No hay scripts propios en la portada para probar mapas de código.');
} else {
  let mapas = 0;
  for (const s of scripts) {
    const url = new URL(s, BASE + '/').href + '.map';
    const r = await pedir(url);
    if (r.status === 200 && /"sources"\s*:/.test(r.cuerpo)) {
      mapas++;
      anota('falla', '15', `Se publica el mapa de tu código: ${url}`);
    }
  }
  if (!mapas) anota('ok', '15', `Sin mapas de código publicados (${scripts.length} scripts revisados).`);
}

// 14 · CORS
const cors = await pedir(BASE + '/', { headers: { Origin: ORIGEN_AJENO } });
const acao = cors.headers.get('access-control-allow-origin');
const acac = (cors.headers.get('access-control-allow-credentials') || '').toLowerCase() === 'true';
if (!acao) {
  anota('ok', '14', 'La portada no le da permiso a otras webs (sin Access-Control-Allow-Origin).');
} else if (acao === ORIGEN_AJENO && acac) {
  anota('falla', '14', 'Le da permiso a CUALQUIER web, con sesión incluida (devuelve el origen ajeno + credentials).');
} else if (acao === ORIGEN_AJENO) {
  anota('falla', '14', 'Le da permiso a cualquier web (devuelve el origen ajeno).');
} else if (acao === '*') {
  anota('aviso', '14', 'Access-Control-Allow-Origin: * en la portada. En páginas públicas es común; en rutas con datos privados no. Prueba tus /api a mano.');
} else {
  anota('ok', '14', `Solo permite: ${acao}.`);
}

// 13 · Portero (solo si se pide)
if (portero) {
  const url = BASE + (portero.startsWith('/') ? portero : '/' + portero);
  console.log(`\nProbando el portero: ${N} peticiones ${METODO} seguidas a ${url} …`);
  const estados = [];
  for (let i = 0; i < N; i++) {
    const r = await pedir(url, {
      method: METODO,
      headers: METODO === 'GET' ? {} : { 'Content-Type': 'application/json' },
      body: METODO === 'GET' ? undefined : '{}',
    });
    estados.push(r.status);
    if (r.status === 429) break;
  }
  const primero = estados.indexOf(429);
  primero >= 0
    ? anota('ok', '13', `El portero frenó en la petición número ${primero + 1} (429).`)
    : anota('falla', '13', `${estados.length} peticiones seguidas y ningún 429. Respuestas: ${[...new Set(estados)].join(', ')}.`);
} else {
  anota('info', '13', 'Portero no probado. Para probarlo: --portero /api/tu-ruta');
}

// Resumen
const cuenta = (e) => resultados.filter((r) => r.estado === e).length;
console.log(`\nResumen: ✅ ${cuenta('ok')} · ⚠️  ${cuenta('aviso')} · ❌ ${cuenta('falla')}`);
process.exit(cuenta('falla') ? 1 : 0);
