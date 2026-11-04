// Simulador: chatea con tu agente en la terminal, SIN Meta y sin WhatsApp.
// npm run probar
// Comandos: /borrar (empieza de cero), /salir

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { responder } from './agente.js';
import { borrarHistorial } from './memoria.js';
import { usandoModeloReal } from './modelo.js';
import { usandoCalReal } from './agenda.js';
import { config } from './config.js';

const TELEFONO = 'simulador-0000';

console.log('Simulador del agente de WhatsApp');
console.log(`Modelo: ${usandoModeloReal ? config.modelo : 'de prueba (pon OPENROUTER_API_KEY en .env para el real)'}`);
console.log(`Agenda: ${usandoCalReal ? 'Cal.com REAL (las citas se crean de verdad)' : 'de prueba (no se agenda nada)'}`);
console.log('Escribe como si fueras una clienta. /borrar empieza de cero · /salir termina\n');

const rl = createInterface({ input: stdin, output: stdout });

// Si llegan líneas por tubería (echo "hola" | npm run probar), se procesan en orden.
for await (const linea of rl) {
  const texto = linea.trim();
  if (!texto) continue;
  if (texto === '/salir') break;
  if (texto === '/borrar') {
    await borrarHistorial(TELEFONO);
    console.log('(memoria borrada)\n');
    continue;
  }
  console.log(`Tú: ${texto}`);
  try {
    const { texto: respuesta, pasoAPersona } = await responder(TELEFONO, texto, '');
    console.log(`Agente: ${respuesta}${pasoAPersona ? '\n(el agente pasó la conversación a una persona y queda en pausa con esta clienta)' : ''}\n`);
  } catch (e) {
    console.log(`(algo falló: ${e.message})\n`);
  }
}
rl.close();
