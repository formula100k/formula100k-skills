# Reglas de Meta para que no te bloqueen el número

> **Verificado el 3 de noviembre de 2026.** Meta cambia sus reglas seguido: si pasaron meses, vuelve a abrir las fuentes antes de publicar. Cuando una fuente oficial y una secundaria digan cosas distintas, manda la oficial.

Léele a la alumna la versión corta (el recuadro) y ten el resto a mano para cuando pregunte.

> **Versión corta para la alumna**
> 1. Solo la API oficial de Meta. Nada de «conectar escaneando un QR».
> 2. Tu agente atiende TU negocio. No es un «pregúntame lo que quieras».
> 3. Contestas libre durante 24 h después de que la clienta te escribe. Fuera de eso, solo plantillas aprobadas.
> 4. Nunca escribes en frío ni mandas masivos sin permiso.
> 5. Siempre ofreces hablar con una persona.
> 6. Cada mensaje cuesta según tu país: pon un método de pago y revisa la página de precios.

---

## 1. Solo la API oficial (WhatsApp Business Platform / Cloud API)

- Se usa **únicamente** la API oficial de Meta (WhatsApp Business Platform, también llamada Cloud API).
- **Prohibido:** Baileys, whatsapp-web.js, venom, wppconnect o cualquier herramienta que se conecte «escaneando un código QR» con el WhatsApp del celular. Van contra los términos de WhatsApp y ese número puede quedar **bloqueado de forma permanente**, y con él se pierde también el WhatsApp normal de ese número.
- Si la alumna encuentra un tutorial o una herramienta «gratis, solo escanea el QR», la respuesta es no, aunque se vea más fácil.

Fuentes (secundarias, describen el riesgo de las conexiones no oficiales):
- https://github.com/cloud8877-source/whatsapp-ai-framework
- https://lumadock.com/tutorials/hermes-whatsapp-baileys-gateway?language=spanish

## 2. Nada de asistentes de propósito general (desde el 15 de enero de 2026)

- Desde el **15 de enero de 2026** Meta prohíbe en la Business API los asistentes de IA de **propósito general** (del tipo ChatGPT, Perplexity o Luzia).
- **Siguen permitidos** los bots de un negocio: atención a clientes, ventas, agenda y notificaciones.
- Ninguna fuente oficial nombra «agendar citas» de forma explícita. La lectura razonable es que agendar es una tarea específica del negocio y entra en lo permitido. Dilo así, sin exagerar ni prometer.
- **Qué hace la plantilla por esto:** el agente solo habla del negocio. Si le piden algo fuera (tareas, código, recetas, temas generales), responde con amabilidad que solo ayuda con el negocio y ofrece pasar con una persona.

Fuentes:
- https://techcrunch.com/2025/10/18/whatssapp-changes-its-terms-to-bar-general-purpose-chatbots-from-its-platform
- https://respond.io/blog/whatsapp-general-purpose-chatbots-ban
- https://the-decoder.com/meta-removes-rival-chatbots-from-whatsapp/

## 3. La ventana de 24 horas

- Cada mensaje de una clienta abre **24 horas** en las que el negocio puede responder con mensajes libres.
- **Fuera de esa ventana** solo se pueden enviar **plantillas aprobadas** por Meta (de marketing, de utilidad o de autenticación).
- Un **recordatorio de cita al día siguiente** casi siempre cae fuera de la ventana: tiene que ser una **plantilla de utilidad aprobada**. La plantilla de este proyecto no manda recordatorios; Cal.com ya puede mandarlos por correo.
- **Nunca** iniciar conversaciones en frío ni enviar masivos a personas que no dieron su permiso (opt-in).
- El aviso a la dueña (`TELEFONO_DUENA`) también es un mensaje libre: solo le llega si ella le escribió al número del negocio en las últimas 24 horas.

Fuentes:
- https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages
- https://business.whatsapp.com/policy

## 4. El número de prueba y el número real

- El **número de prueba** que da Meta solo puede escribirle a **5 números verificados** en API Setup.
- No sirve para clientas reales. Las plantillas creadas con el número de prueba **no se reutilizan** después.
- Para clientas reales hace falta:
  - un **número propio y dedicado** (no el personal que la alumna usa en la app de WhatsApp);
  - la **verificación del negocio** en Meta;
  - un **nombre visible aprobado**.

Fuentes:
- https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started
- https://help.wanotifier.com/en/article/test-phone-number-limitations-kt0ly2/

## 5. Lo que cuesta (sin inventar cifras)

- Desde el **1 de octubre de 2026** Meta cobra por mensaje también los **de servicio dentro de la ventana** y los **de utilidad en respuesta**.
- Si no hay **método de pago** en el Billing Hub, Meta **deja de entregar** esos mensajes.
- Las **tarifas dependen del país**. No des un número: manda a la alumna a la página de precios y que vea la de su país.
- El **modelo de IA** (OpenRouter) se paga aparte, según el modelo que elija.
- Cal.com, Upstash y el servidor tienen sus propios planes: que revise cada uno en su página.

Fuentes:
- https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages
- https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing

## 6. La calificación del número

- Si muchas personas **bloquean o reportan** el número, Meta baja su calificación y sus límites de envío.
- Para cuidarla: ofrecer siempre **«hablar con una persona»**, no spamear y responder rápido.

## 7. Seguridad del webhook

- **Verify token:** al conectar el webhook, Meta manda un GET con `hub.verify_token`; el servidor solo responde si coincide con `WHATSAPP_VERIFY_TOKEN`.
- **Firma:** cada mensaje llega con el encabezado `X-Hub-Signature-256`, una firma hecha con el **App Secret**. El servidor la comprueba y rechaza lo que no esté firmado.
- **Responder 200 rápido:** primero se contesta 200 a Meta y después se procesa el mensaje. Si el servidor tarda, Meta lo reintenta.
- **Idempotencia:** como Meta reintenta, el servidor recuerda el id de cada mensaje (`wamid…`) y no contesta dos veces el mismo.
- La plantilla ya hace las cuatro cosas; `npm run revisar` lo comprueba.
