# Tu agente de WhatsApp

Un asistente que contesta el WhatsApp de tu negocio: conversa, recuerda lo que ya le dijeron, conoce tus servicios, precios y horarios, y agenda citas en tu Cal.com. Usa **solo la API oficial de Meta** (nada de conectar escaneando un código QR).

## Qué hay aquí

| Archivo | Para qué sirve |
|---|---|
| `negocio.md` | Lo que tu agente sabe de tu negocio. **Es lo primero que cambias.** |
| `.env.example` | La lista de llaves. Cópialo como `.env` y llénalo (el `.env` nunca se sube). |
| `src/servidor.js` | Recibe los mensajes de WhatsApp y comprueba que vienen de Meta. |
| `src/agente.js` | El cerebro: las reglas del agente y sus herramientas (horarios, agendar, pasar con una persona). |
| `src/memoria.js` | La memoria (archivo en tu compu, Upstash en producción). |
| `src/agenda.js` | La conexión con Cal.com. |
| `src/probar.js` | El simulador para chatear con tu agente en la terminal. |

## Cómo se usa

Necesitas Node 22.9 o más nuevo. No hay que instalar paquetes.

```bash
cp .env.example .env      # y llena tus llaves
npm run probar            # chatea con tu agente sin WhatsApp
npm run revisar           # comprueba que el webhook está listo para Meta
npm start                 # enciende el servidor (en producción)
```

Sin llaves, `npm run probar` funciona igual con un modelo y una agenda de prueba: sirve para ver que todo está conectado. Con tu `OPENROUTER_API_KEY` habla el modelo de verdad. Con `CAL_API_KEY` y `CAL_EVENT_TYPE_ID` las citas se crean de verdad en tu calendario.

## Lo que nunca debes hacer

- Subir tu `.env` o cualquier llave a GitHub.
- Usar herramientas que conectan WhatsApp escaneando un QR: tu número puede quedar bloqueado para siempre.
- Mandar mensajes masivos o escribirle a gente que no te escribió primero.
- Convertirlo en un asistente para «preguntar cualquier cosa»: Meta solo permite asistentes de un negocio.

Las reglas completas y sus fuentes están en la skill, en `references/reglas-de-meta.md`.
