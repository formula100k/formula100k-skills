#!/usr/bin/env node
// notas.mjs — página para dejar notas en el segundo exacto del video, antes del render final. Igual en Mac y en Windows.
// Uso:
//   node scripts/notas.mjs abrir <proyecto> [video.mp4]   abre la página en el navegador (por defecto, el MP4 más nuevo del proyecto)
//                                                         y queda corriendo; las notas se guardan solas en <proyecto>/notas.json
//   node scripts/notas.mjs ver <proyecto>                 imprime las notas que faltan, con su segundo y su número
//   node scripts/notas.mjs responder <proyecto> <n> "qué hiciste"   deja tu respuesta debajo de la nota n y la marca hecha
// La página muestra la respuesta debajo de cada nota y avisa cuando el video cambia (vuelves a renderizar con el mismo nombre).
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, join } from 'node:path';
import { casa, salir } from './comun.mjs';

const archivoNotas = P => join(P, 'notas.json');
const leerNotas = P => existsSync(archivoNotas(P)) ? JSON.parse(readFileSync(archivoNotas(P), 'utf8')) : { aprobado: false, notas: [] };
const guardar = (P, d) => writeFileSync(archivoNotas(P), JSON.stringify(d, null, 2));
const seg = t => t.toFixed(1).replace('.', ',') + ' s';

function masNuevo(P) {
  const mp4 = readdirSync(P).filter(f => /\.mp4$/i.test(f)).map(f => join(P, f)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (!mp4.length) throw new Error(`No hay ningún MP4 en ${P}. Renderiza primero o pásame la ruta del video.`);
  return mp4[0];
}

function abrirNavegador(url) {
  const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
}

function abrir(P, video) {
  const v = video ? casa(video) : masNuevo(P);
  if (!existsSync(v)) throw new Error('No existe el video: ' + v);
  const servidor = createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(PAGINA.replaceAll('__NOMBRE__', basename(v).replace(/[&<>"]/g, ''))); }
    if (url.pathname === '/estado') {
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      return res.end(JSON.stringify({ version: statSync(v).mtimeMs, ...leerNotas(P) }));
    }
    if (url.pathname === '/notas' && req.method === 'POST') {
      let cuerpo = ''; req.on('data', c => cuerpo += c);
      return req.on('end', () => {
        try {
          const nuevo = JSON.parse(cuerpo), viejo = leerNotas(P);
          // las respuestas las escribe Claude en el archivo: la página nunca las pisa
          nuevo.notas.forEach(n => { const o = viejo.notas.find(x => x.id === n.id); if (o) { n.respuesta = o.respuesta; n.hecha = o.hecha; } });
          guardar(P, { ...viejo, ...nuevo }); res.writeHead(204); res.end();
        } catch { res.writeHead(400); res.end(); }
      });
    }
    if (url.pathname === '/video') {   // con Range: sin esto el navegador no deja saltar a un segundo
      const tam = statSync(v).size, r = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
      if (!r) { res.writeHead(200, { 'content-type': 'video/mp4', 'content-length': tam, 'accept-ranges': 'bytes', 'cache-control': 'no-store' }); return createReadStream(v).pipe(res); }
      const a = r[1] ? +r[1] : tam - +r[2], b = r[1] && r[2] ? Math.min(+r[2], tam - 1) : tam - 1;
      res.writeHead(206, { 'content-type': 'video/mp4', 'content-range': `bytes ${a}-${b}/${tam}`, 'content-length': b - a + 1, 'accept-ranges': 'bytes', 'cache-control': 'no-store' });
      return createReadStream(v, { start: a, end: b }).pipe(res);
    }
    res.writeHead(404); res.end();
  });
  let puerto = 47840;
  servidor.on('error', e => { if (e.code === 'EADDRINUSE' && puerto < 47860) servidor.listen(++puerto, '127.0.0.1'); else salir(e); });
  servidor.on('listening', () => {
    const url = `http://127.0.0.1:${puerto}/`;
    console.log(`Notas de ${basename(v)} -> ${url}\nSe guardan en ${archivoNotas(P)}. Deja esta ventana abierta; ciérrala con Ctrl+C cuando termines.`);
    abrirNavegador(url);
  });
  servidor.listen(puerto, '127.0.0.1');
}

function ver(P) {
  const d = leerNotas(P), faltan = d.notas.filter(n => !n.hecha).sort((a, b) => a.t - b.t);
  if (d.aprobado) console.log('APROBADO: la persona marcó el video como listo.');
  if (!faltan.length) return console.log(d.notas.length ? 'No hay notas pendientes.' : 'Todavía no hay notas.');
  faltan.forEach(n => console.log(`#${n.id}  ${seg(n.t)}  ${n.texto}`));
}

function responder(P, id, texto) {
  const d = leerNotas(P), n = d.notas.find(x => String(x.id) === String(id));
  if (!n) throw new Error(`No hay nota #${id}. Corre «node scripts/notas.mjs ver» para ver los números.`);
  n.respuesta = texto; n.hecha = true; guardar(P, d);
  console.log(`#${n.id} (${seg(n.t)}) respondida.`);
}

const PAGINA = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Notas · __NOMBRE__</title>
<style>
:root{--fondo:#141518;--panel:#1E2024;--tarjeta:#26282D;--borde:rgba(255,255,255,.10);--texto:#F3F3F1;--gris:rgba(255,255,255,.55);--acento:#FF7A1A;--bien:#2FB85A}
*{box-sizing:border-box}html,body{margin:0;height:100%;background:var(--fondo);color:var(--texto);font:15px/1.45 -apple-system,"Segoe UI",Inter,Arial,sans-serif}
main{display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:20px;height:100%;padding:20px}
.video{display:flex;flex-direction:column;gap:12px;min-height:0}
video{flex:1;min-height:0;width:100%;background:#000;border-radius:14px;object-fit:contain}
.barra{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
button{font:inherit;font-weight:600;border:1px solid var(--borde);background:var(--tarjeta);color:var(--texto);padding:9px 14px;border-radius:10px;cursor:pointer}
button.principal{background:var(--acento);border-color:var(--acento);color:#111}
button.listo{background:var(--bien);border-color:var(--bien);color:#111}
.tiempo{font-variant-numeric:tabular-nums;color:var(--gris);margin-left:auto}
aside{background:var(--panel);border:1px solid var(--borde);border-radius:14px;display:flex;flex-direction:column;min-height:0}
aside header{padding:16px 16px 8px}aside h1{font-size:17px;margin:0 0 4px}aside p{margin:0;color:var(--gris);font-size:13px}
.nueva{padding:8px 16px 14px;border-bottom:1px solid var(--borde)}
.nueva .en{font-weight:700;color:var(--acento);font-variant-numeric:tabular-nums}
textarea{width:100%;margin-top:6px;font:inherit;background:var(--fondo);color:var(--texto);border:1px solid var(--borde);border-radius:10px;padding:10px;resize:vertical;min-height:64px}
ol{list-style:none;margin:0;padding:10px;overflow:auto;flex:1}
li{background:var(--tarjeta);border:1px solid var(--borde);border-radius:10px;padding:10px 12px;margin-bottom:8px}
li .cab{display:flex;gap:8px;align-items:baseline}
li .t{font-weight:700;color:var(--acento);cursor:pointer;font-variant-numeric:tabular-nums}
li .n{color:var(--gris);font-size:12px}li .x{margin-left:auto;background:none;border:0;color:var(--gris);padding:0 4px}
li .resp{margin-top:8px;padding:8px 10px;border-left:3px solid var(--bien);background:rgba(47,184,90,.10);border-radius:6px;font-size:14px}
li.hecha{opacity:.75}
.aviso{display:none;background:var(--acento);color:#111;font-weight:700;padding:10px 14px;border-radius:10px;cursor:pointer}
.vacio{color:var(--gris);text-align:center;padding:30px 10px}
kbd{background:var(--tarjeta);border:1px solid var(--borde);border-radius:5px;padding:0 5px;font-size:12px}
@media (max-width:820px){main{grid-template-columns:1fr;height:auto}video{max-height:70vh}}
</style></head><body><main>
<section class="video">
  <div class="aviso" id="aviso">Hay una versión nueva del video. Haz clic para cargarla.</div>
  <video id="v" src="/video" controls playsinline></video>
  <div class="barra">
    <button class="principal" id="marcar">＋ Nota aquí <kbd>N</kbd></button>
    <button id="atras">−0,1 s <kbd>,</kbd></button><button id="adelante">+0,1 s <kbd>.</kbd></button>
    <span class="tiempo" id="reloj">0,0 s</span>
  </div>
</section>
<aside>
  <header><h1>Notas · __NOMBRE__</h1><p>Pausa donde quieras cambiar algo y escribe qué. Claude te responde debajo de cada nota.</p></header>
  <div class="nueva" id="nueva" hidden>
    <div>Nota en <span class="en" id="en"></span></div>
    <textarea id="texto" placeholder="Ej.: corta esta pausa · el contador entra tarde · esta palabra va más grande"></textarea>
    <div class="barra" style="margin-top:8px"><button class="principal" id="guardar">Guardar <kbd>Enter</kbd></button><button id="cancelar">Cancelar</button></div>
  </div>
  <ol id="lista"></ol>
  <div class="barra" style="padding:12px 16px;border-top:1px solid var(--borde)">
    <button id="copiar">Copiar notas</button><button class="listo" id="aprobar">✓ Aprobado</button>
  </div>
</aside>
</main>
<script>
const v = document.getElementById('v'), $ = id => document.getElementById(id);
let d = { aprobado: false, notas: [] }, version = null, tNueva = 0;
const seg = t => t.toFixed(1).replace('.', ',') + ' s';
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function pintar() {
  const ns = [...d.notas].sort((a, b) => a.t - b.t);
  $('lista').innerHTML = ns.length ? ns.map(n => '<li class="' + (n.hecha ? 'hecha' : '') + '"><div class="cab"><span class="t" data-t="' + n.t + '">' + seg(n.t) + '</span><span class="n">#' + n.id + (n.hecha ? ' · hecha' : '') + '</span>'
    + (n.hecha ? '' : '<button class="x" data-id="' + n.id + '" title="Borrar">✕</button>') + '</div><div>' + esc(n.texto) + '</div>'
    + (n.respuesta ? '<div class="resp">' + esc(n.respuesta) + '</div>' : '') + '</li>').join('') : '<div class="vacio">Todavía no hay notas.</div>';
  $('aprobar').textContent = d.aprobado ? '✓ Aprobado (deshacer)' : '✓ Aprobado';
}
async function enviar() { await fetch('/notas', { method: 'POST', body: JSON.stringify({ aprobado: d.aprobado, notas: d.notas }) }); }
async function traer() {
  try {
    const r = await (await fetch('/estado')).json();
    if (version !== null && r.version !== version) $('aviso').style.display = 'block';
    if (version === null) version = r.version;
    d = { aprobado: r.aprobado, notas: r.notas || [] }; pintar();
  } catch {}
}
function marcar() { v.pause(); tNueva = Math.round(v.currentTime * 10) / 10; $('en').textContent = seg(tNueva); $('nueva').hidden = false; $('texto').value = ''; $('texto').focus(); }
async function guardar() {
  const texto = $('texto').value.trim(); if (!texto) return;
  const id = d.notas.reduce((m, n) => Math.max(m, n.id), 0) + 1;
  d.notas.push({ id, t: tNueva, texto, creada: new Date().toISOString() }); $('nueva').hidden = true; pintar(); await enviar();
}
$('marcar').onclick = marcar; $('guardar').onclick = guardar; $('cancelar').onclick = () => $('nueva').hidden = true;
$('atras').onclick = () => { v.pause(); v.currentTime = Math.max(0, v.currentTime - .1); };
$('adelante').onclick = () => { v.pause(); v.currentTime = v.currentTime + .1; };
$('lista').onclick = async e => {
  if (e.target.dataset.t) { v.currentTime = +e.target.dataset.t; v.pause(); }
  if (e.target.dataset.id) { d.notas = d.notas.filter(n => n.id !== +e.target.dataset.id); pintar(); await enviar(); }
};
$('aprobar').onclick = async () => { d.aprobado = !d.aprobado; pintar(); await enviar(); };
$('copiar').onclick = () => navigator.clipboard.writeText([...d.notas].sort((a, b) => a.t - b.t).filter(n => !n.hecha).map(n => seg(n.t) + ': ' + n.texto).join('\\n'));
$('aviso').onclick = () => { const t = v.currentTime; v.src = '/video?v=' + Date.now(); v.currentTime = t; $('aviso').style.display = 'none'; version = null; traer(); };
v.ontimeupdate = () => $('reloj').textContent = seg(v.currentTime);
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'TEXTAREA') { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guardar(); } if (e.key === 'Escape') $('nueva').hidden = true; return; }
  if (e.key === 'n' || e.key === 'N') { e.preventDefault(); marcar(); }
  if (e.key === ',') $('atras').click(); if (e.key === '.') $('adelante').click();
  if (e.key === ' ') { e.preventDefault(); v.paused ? v.play() : v.pause(); }
});
traer(); setInterval(traer, 3000);
</script></body></html>`;

try {
  const [orden, p, ...r] = process.argv.slice(2);
  if (orden === 'abrir' && p) abrir(casa(p), r[0]);
  else if (orden === 'ver' && p) ver(casa(p));
  else if (orden === 'responder' && p && r[1]) responder(casa(p), r[0], r.slice(1).join(' '));
  else throw new Error(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//   node scripts/notas.mjs')).map(l => l.slice(3)).join('\n'));
} catch (e) { salir(e); }
