// Enviar mensajes por la API oficial de WhatsApp (Cloud API de Meta).
// Solo texto libre: sirve DENTRO de la ventana de 24 h desde el último mensaje de la cliente.
// Fuera de esa ventana Meta solo deja enviar plantillas aprobadas (ver references/reglas-de-meta.md).

import { config } from './config.js';

export async function enviarTexto(para, texto) {
  if (!config.whatsappToken || !config.phoneNumberId) {
    console.log(`[sin envío: falta WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID] para ${para}: ${texto}`);
    return { simulado: true };
  }
  const url = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.whatsappToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: para,
      type: 'text',
      text: { preview_url: false, body: texto.slice(0, 4000) },
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('WhatsApp no envió el mensaje: ' + JSON.stringify(j.error || j).slice(0, 300));
  return j;
}
