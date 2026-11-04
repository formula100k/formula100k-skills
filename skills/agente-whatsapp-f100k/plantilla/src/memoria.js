// Memoria del agente: guarda la conversación reciente de cada cliente.
// - En tu compu: un archivo datos/memoria.json (no se sube a GitHub).
// - En producción: Upstash Redis (si pones UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN).
// Las dos opciones tienen las mismas funciones, así el resto del código no cambia.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.js';

const DIA = 24 * 60 * 60;

// ---------- Opción 1: archivo JSON local ----------
function crearMemoriaArchivo(ruta) {
  mkdirSync(dirname(ruta), { recursive: true });
  let datos = existsSync(ruta) ? JSON.parse(readFileSync(ruta, 'utf8')) : {};
  const guardar = () => writeFileSync(ruta, JSON.stringify(datos, null, 2));
  const ahora = () => Math.floor(Date.now() / 1000);

  return {
    tipo: 'archivo',
    async leer(clave) {
      const r = datos[clave];
      if (!r) return null;
      if (r.vence && r.vence < ahora()) { delete datos[clave]; guardar(); return null; }
      return r.valor;
    },
    async escribir(clave, valor, segundos) {
      datos[clave] = { valor, vence: segundos ? ahora() + segundos : null };
      guardar();
    },
    async borrar(clave) { delete datos[clave]; guardar(); },
    // Devuelve true solo la primera vez que ve esa clave (para no contestar dos veces el mismo mensaje).
    async primeraVez(clave, segundos) {
      if (await this.leer(clave)) return false;
      await this.escribir(clave, 1, segundos);
      return true;
    },
  };
}

// ---------- Opción 2: Upstash Redis (API REST, sin instalar nada) ----------
function crearMemoriaUpstash(url, token) {
  async function comando(...args) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const j = await r.json();
    if (j.error) throw new Error('Upstash: ' + j.error);
    return j.result;
  }
  return {
    tipo: 'upstash',
    async leer(clave) {
      const v = await comando('GET', clave);
      return v == null ? null : JSON.parse(v);
    },
    async escribir(clave, valor, segundos) {
      const args = ['SET', clave, JSON.stringify(valor)];
      if (segundos) args.push('EX', String(segundos));
      await comando(...args);
    },
    async borrar(clave) { await comando('DEL', clave); },
    async primeraVez(clave, segundos) {
      const r = await comando('SET', clave, '1', 'NX', 'EX', String(segundos || DIA));
      return r === 'OK';
    },
  };
}

export const almacen = config.upstashUrl && config.upstashToken
  ? crearMemoriaUpstash(config.upstashUrl, config.upstashToken)
  : crearMemoriaArchivo(config.archivoMemoria);

// ---------- Funciones que usa el agente ----------

// Historial reciente de un cliente (solo texto de ida y vuelta).
export async function leerHistorial(telefono) {
  return (await almacen.leer(`hist:${telefono}`)) || [];
}

export async function guardarHistorial(telefono, historial) {
  const recortado = historial.slice(-config.memoriaMensajes);
  // Se borra sola a los 30 días sin hablar: no guardes datos de más.
  await almacen.escribir(`hist:${telefono}`, recortado, 30 * DIA);
}

export async function borrarHistorial(telefono) {
  await almacen.borrar(`hist:${telefono}`);
  await almacen.borrar(`horarios:${telefono}`);
  await almacen.borrar(`pausa:${telefono}`);
}

// Horarios que el agente le ofreció a esa cliente (solo puede agendar uno de esos).
export async function guardarHorariosOfrecidos(telefono, lista) {
  await almacen.escribir(`horarios:${telefono}`, lista, DIA);
}
export async function leerHorariosOfrecidos(telefono) {
  return (await almacen.leer(`horarios:${telefono}`)) || [];
}

// Pausa: cuando la cliente pide hablar con una persona, el agente se calla un rato.
export async function pausar(telefono, horas) {
  await almacen.escribir(`pausa:${telefono}`, true, Math.round(horas * 3600));
}
export async function estaEnPausa(telefono) {
  return Boolean(await almacen.leer(`pausa:${telefono}`));
}

// Idempotencia: Meta a veces reintenta el mismo mensaje. Solo se contesta una vez.
export async function esMensajeNuevo(idMensaje) {
  return almacen.primeraVez(`msg:${idMensaje}`, DIA);
}
