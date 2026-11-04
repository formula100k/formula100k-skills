// Toda la configuración sale de variables de entorno (.env en tu compu, panel del servidor en producción).
// Aquí no va ninguna llave escrita a mano.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

function env(nombre, porDefecto = '') {
  const v = process.env[nombre];
  return v === undefined || v === '' ? porDefecto : v;
}

export const config = {
  raiz,
  puerto: Number(env('PORT', '3000')),

  // Meta (WhatsApp Cloud API)
  verifyToken: env('WHATSAPP_VERIFY_TOKEN'),
  appSecret: env('WHATSAPP_APP_SECRET'),
  whatsappToken: env('WHATSAPP_TOKEN'),
  phoneNumberId: env('WHATSAPP_PHONE_NUMBER_ID'),
  graphVersion: env('GRAPH_API_VERSION', 'v23.0'),

  // Modelo (OpenRouter)
  openrouterKey: env('OPENROUTER_API_KEY'),
  modelo: env('OPENROUTER_MODEL', 'anthropic/claude-sonnet-4.5'),

  // Agenda (Cal.com API v2)
  calKey: env('CAL_API_KEY'),
  calEventTypeId: env('CAL_EVENT_TYPE_ID'),

  // Negocio
  zonaHoraria: env('ZONA_HORARIA', 'America/Mexico_City'),
  telefonoDuena: env('TELEFONO_DUENA'),
  pausaHoras: Number(env('PAUSA_HORAS', '12')),

  // Memoria
  memoriaMensajes: Number(env('MEMORIA_MENSAJES', '20')),
  upstashUrl: env('UPSTASH_REDIS_REST_URL'),
  upstashToken: env('UPSTASH_REDIS_REST_TOKEN'),
  archivoMemoria: env('ARCHIVO_MEMORIA', join(raiz, 'datos', 'memoria.json')),
};

// Lee el archivo con los datos del negocio (servicios, precios, horarios, reglas, tono).
export function leerNegocio() {
  const ruta = join(raiz, env('ARCHIVO_NEGOCIO', 'negocio.md'));
  if (!existsSync(ruta)) {
    throw new Error(`No encuentro ${ruta}. Crea tu negocio.md (puedes copiar el de ejemplo).`);
  }
  return readFileSync(ruta, 'utf8');
}
