// Prueba de humo: levanta el servidor en local y comprueba lo básico, sin cuentas reales.
// npm run revisar
// 1) Meta puede verificar el webhook con el token correcto (y no con uno falso).
// 2) Un mensaje con firma falsa se rechaza.
// 3) Un mensaje con firma buena recibe 200 y se contesta (en modo sin envío).
// 4) Si Meta reintenta el mismo mensaje, no se contesta dos veces.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const carpeta = mkdtempSync(join(tmpdir(), 'agente-humo-'));
Object.assign(process.env, {
  WHATSAPP_VERIFY_TOKEN: 'token-de-prueba',
  WHATSAPP_APP_SECRET: 'secreto-de-prueba',
  WHATSAPP_TOKEN: '',
  OPENROUTER_API_KEY: '',
  CAL_API_KEY: '',
  UPSTASH_REDIS_REST_URL: '',
  ARCHIVO_MEMORIA: join(carpeta, 'memoria.json'),
});

const { crearServidor } = await import('../src/servidor.js');
const { firmar } = await import('../src/firma.js');

let fallas = 0;
const revisar = (ok, texto) => { console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`); if (!ok) fallas++; };

const enviados = [];
const logOriginal = console.log;
console.log = (...a) => { if (String(a[0]).startsWith('[sin envío')) enviados.push(a.join(' ')); else logOriginal(...a); };

const servidor = crearServidor().listen(0);
await new Promise((r) => servidor.once('listening', r));
const base = `http://localhost:${servidor.address().port}`;

let r = await fetch(`${base}/webhook?hub.mode=subscribe&hub.verify_token=token-de-prueba&hub.challenge=12345`);
revisar(r.status === 200 && (await r.text()) === '12345', 'verificación del webhook con el token correcto');

r = await fetch(`${base}/webhook?hub.mode=subscribe&hub.verify_token=otro&hub.challenge=12345`);
revisar(r.status === 403, 'verificación rechazada con un token falso');

const cuerpo = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{ changes: [{ field: 'messages', value: {
    contacts: [{ wa_id: '5210000000000', profile: { name: 'Clienta Prueba' } }],
    messages: [{ from: '5210000000000', id: 'wamid.PRUEBA1', type: 'text', text: { body: 'Hola, ¿qué servicios tienen?' } }],
  } }] }],
});

r = await fetch(`${base}/webhook`, { method: 'POST', body: cuerpo, headers: { 'x-hub-signature-256': 'sha256=falsa' } });
revisar(r.status === 401, 'mensaje con firma falsa rechazado');

const firma = firmar(cuerpo, 'secreto-de-prueba');
r = await fetch(`${base}/webhook`, { method: 'POST', body: cuerpo, headers: { 'x-hub-signature-256': firma } });
revisar(r.status === 200, 'mensaje con firma buena recibe 200');

await new Promise((res) => setTimeout(res, 300));
revisar(enviados.length === 1, 'el agente contestó el mensaje (modo sin envío)');

r = await fetch(`${base}/webhook`, { method: 'POST', body: cuerpo, headers: { 'x-hub-signature-256': firma } });
await new Promise((res) => setTimeout(res, 300));
revisar(r.status === 200 && enviados.length === 1, 'reintento del mismo mensaje: no se contesta dos veces');

servidor.close();
console.log = logOriginal;
rmSync(carpeta, { recursive: true, force: true });
console.log(fallas ? `\n${fallas} prueba(s) fallaron.` : '\nTodo bien: el webhook está listo para conectarse con Meta.');
process.exit(fallas ? 1 : 0);
