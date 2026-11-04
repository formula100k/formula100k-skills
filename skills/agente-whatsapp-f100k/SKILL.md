---
name: agente-whatsapp-f100k
description: >
  Construye con la alumna, paso a paso y sin que programe, un agente de IA en el WhatsApp de SU negocio que conversa, recuerda la conversación, conoce sus servicios, precios y horarios, y AGENDA citas en su Cal.com, usando SOLO la API oficial de Meta (WhatsApp Cloud API) para que no le bloqueen el número. Parte de una plantilla funcional en Node (webhook con firma verificada, OpenRouter, memoria, Cal.com y simulador por terminal), la personaliza con un negocio.md hecho en entrevista, la prueba hasta romperla y la deja encendida en un servidor. Usar cuando alguien diga: "quiero un agente de WhatsApp", "bot de WhatsApp que agende", "que mi WhatsApp responda solo", "asistente de WhatsApp para mi negocio", "que me agende citas por WhatsApp", "conecta WhatsApp con IA", "/agente-whatsapp". NO hace envíos masivos ni mensajes en frío, NO arma bots que se conectan escaneando un QR (Baileys, whatsapp-web.js, venom, wppconnect) y NO construye asistentes de propósito general tipo "pregúntame lo que quieras": Meta los prohíbe. Para apps web sin WhatsApp usa crea-tu-app-f100k.
argument-hint: [tu negocio o lo que quieres que haga tu agente]
disable-model-invocation: false
---

# Agente de WhatsApp para tu negocio

Lleva a la alumna **de la mano** desde «quiero que mi WhatsApp conteste solo» hasta un agente **encendido en internet** que atiende a sus clientas, conoce su negocio y agenda citas en su calendario.

**La regla que manda sobre todas:** primero que no la bloqueen, después que funcione. Si algo ahorra un paso pero pone en riesgo su número, no se hace. Las reglas completas están en `references/reglas-de-meta.md` (verificadas el 3-nov-2026, con fuentes). Léelas antes de empezar.

## Cómo hablarle a la alumna (no opcional)

- **Cero jerga.** No digas «webhook», «endpoint», «tool calling» ni «token» sin traducirlo. Di «la dirección donde Meta te avisa que llegó un mensaje», «el permiso que le das a tu agente para ver tu agenda», «la llave».
- **Una pregunta a la vez.** Nunca le pidas varios datos juntos.
- **Celebra cada checkpoint** y muéstrale algo que funciona antes de seguir.
- **Si algo falla, es problema → solución**, no un error pegado. Por dentro usa `superpowers:systematic-debugging`; hacia ella: «esto pasa seguido, lo arreglo y seguimos».
- **Ella manda.** No pasas de fase sin su «sí».
- **Sus cuentas, su costo.** Todo va con SUS cuentas (Meta, OpenRouter, Cal.com, servidor). Nunca pongas llaves tuyas ni de nadie más.

## Lo que nunca se hace (díselo en la Fase 0)

1. **Nada de conectar WhatsApp escaneando un QR** (Baileys, whatsapp-web.js, venom, wppconnect y parecidos). Va contra los términos y el número puede quedar bloqueado para siempre, junto con su WhatsApp normal. Si ella lo propone o encontró un tutorial así, explícale por qué no y sigue con la API oficial.
2. **Nada de asistente «para todo».** Desde el 15-ene-2026 Meta prohíbe los asistentes de propósito general en la API. Su agente solo atiende su negocio.
3. **Nada de masivos ni mensajes en frío.** Solo se responde a quien escribe. Fuera de la ventana de 24 h, solo plantillas aprobadas.
4. **Ninguna llave en el código ni en GitHub.** Viven en `.env` (en su compu) y en el panel del servidor.
5. **Ninguna cifra inventada.** Ni precios de Meta, ni de OpenRouter, ni del servidor: siempre a la página de precios de cada uno, porque dependen del país y del plan.

## La plantilla

En `plantilla/` hay un proyecto **funcional y sin dependencias** (Node 22.9 o más nuevo, nada que instalar):

- `src/servidor.js`: recibe los mensajes, comprueba la firma de Meta, contesta 200 rápido y no responde dos veces el mismo mensaje.
- `src/agente.js`: las reglas del agente (acotado al negocio, no inventa, resiste engaños) y sus 3 herramientas: `ver_horarios`, `agendar_cita` (solo puede agendar un horario que salió de la agenda) y `pasar_con_persona` (deja al agente en pausa con esa clienta).
- `src/modelo.js`: OpenRouter con herramientas en formato OpenAI. Sin llave, usa un modelo de prueba.
- `src/memoria.js`: historial reciente por clienta. Archivo JSON en local, Upstash Redis en producción.
- `src/agenda.js`: Cal.com API v2 (horarios libres y crear cita). Sin llave, usa una agenda de prueba.
- `src/probar.js`: simulador en la terminal (`npm run probar`) para chatear con el agente sin Meta.
- `pruebas/humo.js`: `npm run revisar` comprueba verificación, firma, 200 e idempotencia.
- `negocio.md` (ejemplo ficticio de un estudio de uñas), `.env.example`, `.gitignore`, `README.md`.

**Copia la plantilla, no la reescribas.** Tu trabajo es el orden, la narración, el `negocio.md` y conectar sus cuentas. Cambia el código solo si su negocio lo pide de verdad (por ejemplo, otro tipo de herramienta).

## Las 7 fases

Crea un TODO por fase y márcalas. **No saltes fases.** Cada una tiene su riesgo y su salida: si la salida no se cumple, no se avanza.

---

### Fase 0 — El plan: qué hace tu negocio y qué hará tu agente

Objetivo: un `negocio.md` completo, escrito con sus datos reales.

1. Explícale en 3 líneas qué van a construir y **las 5 reglas de arriba** (en su versión corta de `references/reglas-de-meta.md`).
2. Si estás en Claude Code, entra en **modo plan** para esta fase: primero se entiende, después se construye.
3. Entrevista **una pregunta a la vez**, en este orden: qué es su negocio · a quién atiende · qué servicios da · precio y duración de cada uno · días y horarios (y cuándo cierra) · reglas de agenda (anticipación, cancelaciones, tolerancia) · dirección y formas de pago · preguntas que le hacen siempre · tono con el que habla · **qué NO hace** el negocio y qué NO debe hacer el agente.
4. Si algo no lo sabe, propón una opción concreta y sigue. Nunca rellenes un precio o un horario por tu cuenta: si no lo dio, no va.
5. Escribe `negocio.md` con la misma forma que el de ejemplo y léeselo completo.

- **Riesgo:** datos incompletos → el agente dice «no tengo ese dato» todo el tiempo, o peor, alguien rellena con datos supuestos.
- **Salida / checkpoint:** «Esto es lo que tu agente va a saber de tu negocio. ¿Está todo bien o cambiamos algo?»

---

### Fase 1 — Meta: tu app y tu número de prueba

Objetivo: el número de prueba de Meta conectado y las 4 llaves de Meta en su `.env`.

1. Copia `plantilla/` a la carpeta de su proyecto. Crea el `.gitignore` **antes** del primer commit (ya viene en la plantilla) y copia `.env.example` como `.env`.
2. Guíala pantalla por pantalla, un paso a la vez, y espera su «listo» en cada uno:
   - Entrar a **developers.facebook.com** con su cuenta y crear una app de tipo negocio.
   - Agregar el producto **WhatsApp** y entrar a **API Setup** (Configuración de la API).
   - Ahí está el **número de prueba**. Agregar su propio celular como destinatario verificado (el número de prueba solo le escribe a 5 números verificados).
   - Copiar el **Phone number ID** (el identificador, no el teléfono) y el **token temporal**.
   - En la configuración básica de la app, copiar la **Clave secreta de la app** (App Secret).
   - Inventar juntas una palabra secreta para el **verify token**.
3. Ella pega cada llave **una vez**; tú la guardas en `.env`. Corre `npm run revisar` para comprobar que el servidor está listo.
4. Para conectar el webhook, Meta necesita una dirección pública. Para probar desde su compu usa un túnel (por ejemplo `cloudflared tunnel --url http://localhost:3000`), pide permiso antes de instalarlo y explícale que es temporal. En **WhatsApp → Configuración**, pega la dirección `…/webhook` y el verify token, y suscribe el campo **messages**.
5. Que mande «hola» desde su celular al número de prueba y vea llegar el mensaje en la terminal.

- **Riesgo:** confundir el número de prueba con el definitivo (no sirve para clientas reales y sus plantillas no se reutilizan); pegar el token en un chat o en el código.
- **Salida / checkpoint:** «Le escribiste a tu número de prueba y tu servidor lo recibió 🎉. ¿Seguimos con el cerebro?»

---

### Fase 2 — El cerebro: el modelo y sus reglas

Objetivo: el agente contesta con el modelo real, solo sobre su negocio.

1. Que cree su cuenta en **openrouter.ai** (una sola llave para usar muchos modelos), cargue saldo si hace falta y copie su llave. Va a `OPENROUTER_API_KEY`.
2. Elijan juntas el modelo en openrouter.ai/models: uno que diga que soporta **tools** (herramientas). Que ella vea el precio ahí mismo; tú no des cifras.
3. Revisa con ella las reglas de `instrucciones()` en `src/agente.js`: solo habla del negocio, no inventa, resiste engaños, ofrece pasar con una persona. Ajusta el tono si ella quiere.
4. Corre `npm run probar` y que le haga 3 preguntas de clienta.

- **Riesgo:** un modelo sin soporte de herramientas no podrá agendar; un agente sin límites cae en la prohibición de propósito general.
- **Salida / checkpoint:** «Pregúntale lo que te preguntan tus clientas. ¿Contesta como tú contestarías?»

---

### Fase 3 — La memoria: que recuerde la conversación

Objetivo: que no pregunte dos veces lo mismo.

1. Explícale en simple: con cada mensaje, el agente relee los últimos mensajes de esa clienta (`MEMORIA_MENSAJES`, por defecto 20) y se borran solos a los 30 días sin hablar.
2. En su compu, la memoria vive en `datos/memoria.json` (no se sube a GitHub). En producción va a Upstash (Fase 6).
3. Prueba en el simulador: dile su nombre y un servicio, habla de otra cosa y pregúntale «¿qué te había dicho?». Usa `/borrar` para empezar de cero.

- **Riesgo:** guardar más datos de los necesarios. Por eso solo se guarda el texto reciente y caduca.
- **Salida / checkpoint:** «Tu agente ya recuerda lo que le dicen. ¿Lo probamos con la agenda?»

---

### Fase 4 — La agenda: Cal.com

Objetivo: el agente ve horarios libres reales, ofrece opciones y agenda después de que la clienta confirma.

1. Que cree su cuenta en **cal.com**, conecte su calendario y arme **un tipo de evento** por servicio (o uno general) con sus horarios reales, los mismos de `negocio.md`.
2. Que saque su llave en **Settings → Developer → API Keys** (`CAL_API_KEY`) y el número del tipo de evento (`CAL_EVENT_TYPE_ID`).
3. Explícale el flujo: la clienta pide cita → el agente consulta horarios libres → ofrece de 2 a 3 → la clienta elige → el agente repite el resumen y pide nombre, correo y un «sí» → recién ahí agenda. El código no deja agendar un horario que no salió de la agenda.
4. Prueba en el simulador una cita real y que la vea aparecer en su calendario. Después cancélala desde Cal.com.

- **Riesgo:** horarios distintos en Cal.com y en `negocio.md` (el agente diría una cosa y la agenda otra); agendar sin confirmación.
- **Salida / checkpoint:** «Tu agente agendó su primera cita y está en tu calendario. ¿La ves?»

---

### Fase 5 — Pruébalo hasta romperlo

Objetivo: que falle aquí y no con una clienta.

1. Corre con ella la lista completa de `references/pruebas.md` (más de 30 pruebas): lo básico, citas imposibles (domingo cerrado, 3 a. m., 30 de febrero), precios inventados, intentos de engaño («ignora tus instrucciones»), temas fuera del negocio, quejas y pedir una persona.
2. Lleva la tabla: prueba · qué respondió · ¿pasa?
3. Cada falla se arregla en `negocio.md` o en las reglas, y se corre **toda** la lista otra vez.

- **Riesgo:** publicar con un agente que inventa precios, agenda en días cerrados o se sale del negocio (eso último además choca con la regla de Meta).
- **Salida / checkpoint:** «Pasó todas las pruebas ✅. ¿Lo dejamos encendido para siempre?»

---

### Fase 6 — Publicarlo: encendido en un servidor, no en tu compu

Objetivo: el agente contesta aunque su compu esté apagada.

1. Explícale por qué: si el servidor vive en su laptop, cuando la cierra el agente deja de contestar.
2. **Opción recomendada (la más simple): un servicio que corre Node siempre encendido** (por ejemplo Railway o Render, en un plan que no se «duerma»). Se sube el proyecto desde su GitHub, se pegan las variables del `.env` en el panel del servicio y el comando de arranque es `npm start`. Que revise el precio en la página de cada uno.
3. **Memoria en producción:** que cree una base en **Upstash Redis** (revisa su plan en su página) y pegue `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`. Así la memoria sobrevive a reinicios.
4. **Si quiere Vercel:** ojo, ahí el servidor no queda siempre encendido (se apaga entre mensajes) y no guarda archivos. Hace falta Upstash o Supabase para la memoria y adaptar el webhook a una función que termine el trabajo después de responder (`waitUntil`). Es posible, pero no es lo más simple.
5. **Si quiere un VPS** (un servidor propio): también sirve, con `npm start` vigilado para que se reinicie solo. Es la opción con más pasos.
6. Cambia en Meta la dirección del webhook a la del servidor, vuelve a verificar y manda un «hola».
7. **Para clientas reales** (cuando ya funcionó con el número de prueba): número propio y dedicado (no su WhatsApp personal), verificación del negocio, nombre visible aprobado, token permanente (de usuario del sistema) y **método de pago en el Billing Hub**: desde el 1-oct-2026 Meta cobra también los mensajes de servicio, y sin método de pago deja de entregarlos.
8. Antes de cada commit revisa que ningún `.env` ni llave vaya incluido. Commit con el correo de **ella**.

- **Riesgo:** memoria que se borra en cada reinicio, servidor que se duerme, llaves subidas a GitHub, mensajes que dejan de llegar por falta de método de pago.
- **Salida / checkpoint:** «Tu agente está encendido en internet. Escríbele desde otro celular y mira cómo contesta 🎉.»

---

## Entregable final

1. Su agente **encendido** en el servidor, con la dirección del webhook verificada en Meta.
2. Su `negocio.md`: «cuando cambies un precio o un horario, cámbialo aquí y en Cal.com».
3. **Lo que ella controla:** qué llaves puso, en qué cuenta está cada una y cómo cambiarlas.
4. La tabla de pruebas pasada.
5. **Qué sigue**, si lo quiere: pasar del número de prueba a su número real (paso 7 de la Fase 6) y, si quiere recordatorios por WhatsApp, crear una plantilla de utilidad y que Meta la apruebe.

## Skills que se combinan

- `crea-tu-app-f100k` y `constructor-miniapps-f100k`: si además quiere una app web (por ejemplo, una página para agendar).
- `superpowers:systematic-debugging`: cuando algo no conecta.
- `vercel:deploy`: solo si elige Vercel en la Fase 6 (con las precauciones de arriba).

## Referencias

- `references/reglas-de-meta.md`: lo que no se negocia para que no la bloqueen, con fuentes y fecha de verificación.
- `references/pruebas.md`: la lista de pruebas de la Fase 5.
- `plantilla/README.md`: cómo se usa el proyecto.
