// Agenda con Cal.com (API v2): ver horarios libres y crear la cita.
// Si no hay CAL_API_KEY, usa una agenda de mentira (para probar en la terminal sin cuentas).

import { config } from './config.js';

const CAL = 'https://api.cal.com/v2';

// ---------- Utilidades de fechas en la zona horaria del negocio ----------

function desfase(fechaISO, zona) {
  // Devuelve algo como "-06:00" para esa zona en esa fecha.
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: zona, timeZoneName: 'longOffset' })
    .formatToParts(new Date(fechaISO + 'T12:00:00Z'));
  const nombre = partes.find((p) => p.type === 'timeZoneName')?.value || 'GMT';
  const m = nombre.match(/GMT([+-]\d{2}):?(\d{2})?/);
  return m ? `${m[1]}:${m[2] || '00'}` : '+00:00';
}

export function legible(inicioISO, zona = config.zonaHoraria) {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: zona, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(inicioISO));
}

function dias(desde, hasta) {
  const lista = [];
  const d = new Date(desde + 'T12:00:00Z');
  const fin = new Date(hasta + 'T12:00:00Z');
  while (d <= fin && lista.length < 14) {
    lista.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return lista;
}

// ---------- Agenda de mentira (solo para el simulador sin Cal.com) ----------
// Coincide con el negocio.md de ejemplo: martes a sábado de 10:00 a 19:00, domingo y lunes cerrado.
const HORARIO_PRUEBA = { 2: [10, 19], 3: [10, 19], 4: [10, 19], 5: [10, 19], 6: [10, 19] };

function horariosDePrueba(desde, hasta) {
  const ahora = Date.now();
  const salida = [];
  for (const dia of dias(desde, hasta)) {
    const semana = new Date(dia + 'T12:00:00Z').getUTCDay();
    const rango = HORARIO_PRUEBA[semana];
    if (!rango) continue;
    const off = desfase(dia, config.zonaHoraria);
    for (let h = rango[0]; h < rango[1]; h += 2) {
      const inicio = `${dia}T${String(h).padStart(2, '0')}:00:00${off}`;
      if (new Date(inicio).getTime() > ahora) salida.push(inicio);
    }
  }
  return salida;
}

// ---------- Cal.com real ----------

async function horariosCal(desde, hasta) {
  const url = new URL(CAL + '/slots');
  url.searchParams.set('eventTypeId', config.calEventTypeId);
  url.searchParams.set('start', desde);
  url.searchParams.set('end', hasta);
  url.searchParams.set('timeZone', config.zonaHoraria);
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${config.calKey}`, 'cal-api-version': '2024-09-04' },
  });
  const j = await r.json();
  if (!r.ok || j.status === 'error') throw new Error('Cal.com no respondió los horarios: ' + JSON.stringify(j).slice(0, 300));
  // Formato: { data: { "2026-11-04": [ { start: "2026-11-04T10:00:00.000-06:00" }, ... ] } }
  const salida = [];
  for (const lista of Object.values(j.data || {})) {
    for (const s of lista) salida.push(typeof s === 'string' ? s : s.start);
  }
  return salida;
}

async function reservarCal({ inicio, nombre, email, telefono, nota }) {
  const cuerpo = {
    start: new Date(inicio).toISOString(), // Cal.com pide la hora en UTC
    eventTypeId: Number(config.calEventTypeId),
    attendee: { name: nombre, timeZone: config.zonaHoraria, language: 'es' },
  };
  if (email) cuerpo.attendee.email = email;
  if (telefono) cuerpo.attendee.phoneNumber = telefono.startsWith('+') ? telefono : '+' + telefono;
  if (nota) cuerpo.bookingFieldsResponses = { notes: nota };
  const r = await fetch(CAL + '/bookings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.calKey}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cuerpo),
  });
  const j = await r.json();
  if (!r.ok || j.status === 'error') {
    throw new Error('Cal.com no pudo agendar: ' + JSON.stringify(j.error || j).slice(0, 300));
  }
  return { id: j.data?.uid || j.data?.id, inicio };
}

// ---------- Lo que usa el agente ----------

export const usandoCalReal = Boolean(config.calKey && config.calEventTypeId);

export async function buscarHorarios(desde, hasta) {
  const lista = usandoCalReal ? await horariosCal(desde, hasta) : horariosDePrueba(desde, hasta);
  return lista.slice(0, 12);
}

export async function reservar(datos) {
  if (usandoCalReal) return reservarCal(datos);
  return { id: 'prueba-' + Date.now(), inicio: datos.inicio, prueba: true };
}
