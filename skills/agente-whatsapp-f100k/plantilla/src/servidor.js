// El servidor que recibe los mensajes de WhatsApp (el "webhook").
// GET  /webhook -> Meta comprueba que el servidor es tuyo (verify token).
// POST /webhook -> llegan los mensajes. Se revisa la firma, se contesta 200 al instante y se procesa después.

import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { config } from './config.js';
import { firmaValida } from './firma.js';
import { responder } from './agente.js';
import { enviarTexto } from './whatsapp.js';
import { esMensajeNuevo, estaEnPausa } from './memoria.js';
import { usandoModeloReal } from './modelo.js';
import { usandoCalReal } from './agenda.js';

function leerCuerpo(req) {
  return new Promise((ok, mal) => {
    const trozos = [];
    let tamano = 0;
    req.on('data', (t) => {
      tamano += t.length;
      if (tamano > 1_000_000) { mal(new Error('Cuerpo demasiado grande')); req.destroy(); return; }
      trozos.push(t);
    });
    req.on('end', () => ok(Buffer.concat(trozos)));
    req.on('error', mal);
  });
}

async function atenderMensaje(mensaje, contactos) {
  // Meta reintenta si no recibe 200 a tiempo: así nunca contestamos dos veces lo mismo.
  if (!(await esMensajeNuevo(mensaje.id))) return;

  const telefono = mensaje.from;
  if (await estaEnPausa(telefono)) {
    console.log(`[pausa] ${telefono} está con una persona; el agente no contesta.`);
    return;
  }

  if (mensaje.type !== 'text') {
    await enviarTexto(telefono, 'Por ahora solo puedo leer mensajes de texto. ¿Me lo escribes, por favor?');
    return;
  }

  const nombre = contactos?.find((c) => c.wa_id === telefono)?.profile?.name || '';
  const { texto, pasoAPersona } = await responder(telefono, mensaje.text.body, nombre);
  await enviarTexto(telefono, texto);

  if (pasoAPersona && config.telefonoDuena) {
    // Ojo: este aviso solo le llega a la dueña si ella le escribió a este número en las últimas 24 h.
    await enviarTexto(config.telefonoDuena, `Una clienta pidió hablar con una persona: +${telefono} (${nombre || 'sin nombre'}). El agente se queda en pausa con ella ${config.pausaHoras} h.`)
      .catch((e) => console.error('[aviso a la dueña]', e.message));
  }
}

async function procesar(cuerpo) {
  for (const entrada of cuerpo.entry || []) {
    for (const cambio of entrada.changes || []) {
      const valor = cambio.value || {};
      // "statuses" son avisos de entregado/leído: no se contestan.
      for (const mensaje of valor.messages || []) {
        await atenderMensaje(mensaje, valor.contacts).catch((e) => console.error('[mensaje]', e.message));
      }
    }
  }
}

export function crearServidor() {
  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('El agente está encendido.');
    }

    if (req.method === 'GET' && url.pathname === '/webhook') {
      const modo = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const reto = url.searchParams.get('hub.challenge');
      if (modo === 'subscribe' && config.verifyToken && token === config.verifyToken) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end(reto);
      }
      res.writeHead(403);
      return res.end();
    }

    if (req.method === 'POST' && url.pathname === '/webhook') {
      let crudo;
      try { crudo = await leerCuerpo(req); } catch { res.writeHead(413); return res.end(); }

      if (!firmaValida(crudo, req.headers['x-hub-signature-256'], config.appSecret)) {
        console.warn('[webhook] firma inválida: mensaje ignorado');
        res.writeHead(401);
        return res.end();
      }

      // Primero el 200 (rápido), después el trabajo pesado.
      res.writeHead(200);
      res.end();

      let cuerpo;
      try { cuerpo = JSON.parse(crudo.toString('utf8')); } catch { return; }
      procesar(cuerpo).catch((e) => console.error('[webhook]', e.message));
      return;
    }

    res.writeHead(404);
    res.end();
  });
}

// Solo arranca si se ejecuta directo (npm start), no cuando lo importa una prueba.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const faltan = ['WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_APP_SECRET'].filter((n) => !process.env[n]);
  if (faltan.length) console.warn(`Aviso: faltan ${faltan.join(', ')} en tu .env. Sin eso Meta no puede conectarse.`);
  crearServidor().listen(config.puerto, () => {
    console.log(`Agente escuchando en el puerto ${config.puerto}`);
    console.log(`Modelo: ${usandoModeloReal ? config.modelo : 'de prueba (sin OPENROUTER_API_KEY)'} · Agenda: ${usandoCalReal ? 'Cal.com' : 'de prueba'}`);
  });
}
