// La conexión con el modelo de IA a través de OpenRouter (una sola llave para muchos modelos).
// Usa el formato de OpenAI con "tools" para que el modelo pueda pedir: ver horarios, agendar, pasar con persona.
// Si no hay OPENROUTER_API_KEY, responde un "modelo de mentira" para que puedas probar el flujo sin gastar.

import { config } from './config.js';

export const usandoModeloReal = Boolean(config.openrouterKey);

export async function pensar(mensajes, herramientas) {
  if (!usandoModeloReal) return modeloDePrueba(mensajes);

  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openrouterKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'Agente de WhatsApp',
    },
    body: JSON.stringify({
      model: config.modelo,
      messages: mensajes,
      tools: herramientas,
      temperature: 0.3,
      max_tokens: 600,
    }),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error('OpenRouter: ' + JSON.stringify(j.error || j).slice(0, 300));
  return j.choices[0].message; // { role, content, tool_calls? }
}

// ---------- Modelo de mentira (sin llave) ----------
// No es inteligente: solo sirve para comprobar que el circuito funciona (memoria, herramientas, respuestas).
function modeloDePrueba(mensajes) {
  const ultimo = mensajes[mensajes.length - 1];

  // Si acaba de recibir horarios, los ofrece.
  if (ultimo.role === 'tool') {
    const datos = JSON.parse(ultimo.content);
    if (datos.horarios?.length) {
      const tres = datos.horarios.slice(0, 3).map((h) => `• ${h.legible}`).join('\n');
      return { role: 'assistant', content: `[modo prueba] Tengo estos horarios:\n${tres}\n¿Cuál te acomoda?` };
    }
    if (datos.ok && datos.cita) return { role: 'assistant', content: `[modo prueba] Listo, tu cita quedó para ${datos.cita}.` };
    if (datos.ok && datos.pausa) return { role: 'assistant', content: '[modo prueba] Te paso con una persona del equipo.' };
    return { role: 'assistant', content: '[modo prueba] No encontré horarios. ¿Probamos otra fecha?' };
  }

  const texto = String(ultimo.content || '').toLowerCase();
  if (/persona|humano|asesora|encargada/.test(texto)) {
    return llamada('pasar_con_persona', { motivo: 'La cliente lo pidió' });
  }
  if (/cita|agendar|agenda|horario|disponib|turno/.test(texto)) {
    const fecha = (dias) => new Intl.DateTimeFormat('en-CA', { timeZone: config.zonaHoraria })
      .format(new Date(Date.now() + dias * 24 * 3600 * 1000));
    const manana = fecha(1);
    const en7 = fecha(7);
    return llamada('ver_horarios', { fecha_desde: manana, fecha_hasta: en7 });
  }
  const vistos = mensajes.filter((m) => m.role === 'user').length;
  return {
    role: 'assistant',
    content: `[modo prueba, sin OPENROUTER_API_KEY] Recibí: «${ultimo.content}». Llevo ${vistos} mensaje(s) tuyos en memoria. Pon tu llave en .env para hablar con el modelo real.`,
  };
}

function llamada(nombre, args) {
  return {
    role: 'assistant',
    content: null,
    tool_calls: [{ id: 'prueba_' + Date.now(), type: 'function', function: { name: nombre, arguments: JSON.stringify(args) } }],
  };
}
