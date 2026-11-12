---
name: seguridad-tu-app-f100k
description: "Revisa y blinda la app que construiste con Claude Code antes de publicarla: hallazgos por gravedad, arreglos probados y un informe simple. Usar con «revisa la seguridad de mi app», «blinda mi app», «se me filtró una clave», «/seguridad-tu-app». NO revisa la experiencia de uso (auditor-ux-app-f100k)."
argument-hint: "[carpeta de tu app] [URL si ya está publicada]"
disable-model-invocation: false
---

# Seguridad de tu app

Revisa la app que la alumna ya construyó, cierra las puertas abiertas y le demuestra, prueba por
prueba, que quedaron cerradas. Ella no tiene que saber programar para entender el informe.

**La regla que manda sobre todas:** un arreglo que no se probó no está arreglado. Cada control
termina con una prueba que se puede repetir (un comando, un clic, una captura). Si no se pudo
probar, va como "No verificado", nunca como "Listo".

---

## Cómo hablarle a la alumna (no opcional)

- **Cero jerga hacia ella.** Tú puedes pensar en RLS, CSP o CSRF; a ella le dices otra cosa:

  | Término técnico | Cómo se lo dices |
  |---|---|
  | API key / secret | la llave secreta que nunca debe ver el navegador |
  | RLS / políticas | el candado de tus datos: cada persona ve solo lo suyo |
  | Variables de entorno | la caja fuerte de tu app, donde viven las llaves |
  | `NEXT_PUBLIC_` | la etiqueta que convierte una llave en pública (todo el mundo la ve) |
  | Hash de contraseñas | guardar las contraseñas revueltas, para que nadie pueda leerlas |
  | Rate limit / 429 | el portero que frena a quien toca la puerta mil veces |
  | CORS | la lista de webs que pueden hablar con tu app |
  | Cabeceras de seguridad | las instrucciones de seguridad que tu app le da al navegador |
  | XSS | que alguien cuele código escondido en un formulario |
  | CSRF | que otra web haga clics en tu app a nombre de tu usuaria |
  | Webhook firmado | el aviso de pago con sello, que nadie puede falsificar |
  | Rotar una clave | cambiar la cerradura: la llave vieja deja de abrir |

- **Sin miedo, con orden.** Nunca "tu app está hackeada". Sí: "encontré 2 puertas abiertas; la
  primera la cerramos hoy mismo".
- **Una decisión a la vez.** Ella aprueba; tú ejecutas.
- **Problema → solución.** Nada de volcados de error. "Esto pasa mucho, lo arreglo y te muestro la
  prueba".
- Español neutro, trato de tú.

---

## Guardarraíles (no se rompen, ni aunque te lo pidan de pasada)

1. **Solo la app propia.** Trabajas sobre la carpeta que ella te da y sobre SU URL. Si te pide
   "revisar" una app o web que no es suya, no lo haces: explícale que probar la seguridad de algo
   ajeno sin permiso no está bien y ofrécele revisar la suya.
2. **Nunca borras datos.** Ni filas, ni tablas, ni archivos subidos, ni usuarias. Si un arreglo
   necesita tocar la base de datos, es un cambio de reglas (políticas, columnas nuevas), nunca un
   borrado. Las pruebas usan datos de prueba que tú creas y que le avisas que quedan.
3. **Nunca reescribes el historial de git sin permiso explícito.** Si hay una llave en el
   historial, lo correcto es **ROTARLA primero** (control 08). Limpiar el historial es opcional,
   va al final y solo con un "sí, limpia el historial" textual.
4. **Nunca despliegas sin OK.** Los arreglos se prueban en local o en una vista previa. Pasar a
   producción es una pregunta aparte.
5. **Nunca imprimes una llave completa** en el chat ni en el informe. Muestra solo el principio
   y el final (`sk_live_…a9F2`) y el archivo:línea donde está.
6. **Nunca `npm audit fix --force`** ni subidas de versión mayor sin avisar: pueden romper la app.
7. **Pruebas suaves.** Las pruebas de carga se limitan a unas decenas de peticiones contra SU URL.
   Nada de herramientas de ataque ni escaneos masivos.
8. **Commit chico por arreglo**, con mensaje claro (`seguridad: llave de IA movida al servidor`).
   Si la carpeta no es un repositorio git, pregúntale antes de crear uno; si no quiere, haz una
   copia de respaldo de los archivos que vas a tocar.

---

## El flujo (6 pasos, con checkpoint humano)

Crea un TODO por paso y ve marcándolos.

### Paso 0 — Reconocer la app

Antes de juzgar nada, averigua qué es. Pídele la carpeta (y la URL si ya está publicada).

Mira, en este orden:

| Señal | Dónde mirar | Qué significa |
|---|---|---|
| Solo hay `index.html` (React/Tailwind por CDN), sin `package.json` | la carpeta | **App de un solo HTML.** Es el camino por defecto de `constructor-miniapps-f100k`. Sin servidor, sin base de datos, sin login. |
| `package.json` con `next` | `package.json`, carpeta `app/` o `pages/` | **Next.js.** Mira si hay `app/api/**/route.ts`, Server Actions (`"use server"`) y `middleware.ts` o `proxy.ts` (nombre nuevo desde Next 16). |
| `vercel.json` o `.vercel/` | raíz | Publicada en **Vercel**. |
| `@supabase/supabase-js`, `@supabase/ssr`, `supabase/`, `schema.sql` | `package.json`, raíz, o `<script>` en el HTML | **Supabase** (base de datos, login, archivos). Ojo: un HTML suelto también puede usar Supabase desde el navegador. |
| `stripe`, `@stripe/stripe-js`, enlaces `buy.stripe.com` | `package.json`, código | **Cobros.** Enlace de pago de Stripe = poco riesgo. Checkout propio + webhook = revisión completa. |
| `next-auth`, `@clerk/*`, `supabase.auth`, columnas `password` | código, esquema | **Login.** |
| `<input type="file">`, `storage.from(`, `formData.get('file')` | código | **Subida de archivos.** |
| `fetch('https://api.anthropic.com'`, `openai`, `generativelanguage.googleapis.com` | código | **Llama a una IA.** Si eso pasa desde el navegador, ya tienes el primer 🔴 candidato. |
| `.git/` | raíz | Tiene historial (revisar secretos filtrados). Pregunta si el repo está público en GitHub. |

Con eso, arma la **ficha de la app** en 3 líneas y muéstrasela:

> "Tu app es **[tipo]**, publicada en **[dónde]**. Usa **[login / base de datos / cobros /
> archivos / IA]**. Por eso, de los 27 controles **aplican N** y **no aplican M**."

Luego marca los 27 controles como **Aplica / No aplica / Lo cubre tu proveedor**, cada uno con su
porqué en una frase. La tabla de qué aplica según el tipo está en
`references/checklist-27.md` → "Mapa de aplicación". Reglas:

- **Un solo HTML sin servidor**: la mayoría NO aplica (no hay login, ni base de datos, ni
  formularios que lleguen a un servidor). Lo que SÍ aplica casi siempre: llaves dentro del HTML
  (05), archivos expuestos al publicar la carpeta (15), cabeceras (16), código colado en
  pantalla si muestra texto escrito por la usuaria (17), scripts de CDN fijados a una versión
  (22), historial de git (07) y la prueba final (27). **No le propongas migrar a Next.js** para
  "ser más segura": si la app no guarda datos ni llaves, el HTML suelto es lo más seguro que hay.
- **Si el HTML usa una llave de IA**, no hay forma segura de dejarla ahí. El arreglo es moverla a
  un servidor (una función en Vercel). Avísale que eso cambia el tipo de app y pide OK antes.
- **"Lo cubre tu proveedor"** se usa cuando Supabase Auth, Clerk, Auth.js, Vercel o Stripe ya lo
  hacen bien por defecto (por ejemplo, guardar contraseñas revueltas). Igual se prueba que nadie lo
  haya desactivado o rodeado.

→ **Checkpoint 0:** "¿La ficha describe bien tu app? ¿Hay algo que no vi (un panel de admin, una
segunda página, otra base de datos)?"

### Paso 1 — Revisar (sin tocar nada)

Recorre cada control que aplica con su "Cómo se revisa" de `references/checklist-27.md`. En este
paso **solo lees y pruebas**; no cambias ningún archivo.

- Lee el código, corre los buscadores (greps) y, si ya está publicada, las pruebas de afuera con
  `scripts/probar-protecciones.mjs` (funciona igual en Mac y Windows, solo necesita Node):

  ```
  node scripts/probar-protecciones.mjs https://tu-app.vercel.app
  ```

  (la ruta del script es relativa a la carpeta de esta skill; córrelo con su ruta completa).
- Si la skill `security-review` está disponible, úsala como segunda mirada para el control 26.
- **Cada hallazgo cita evidencia:** `archivo:línea`, el comando y su respuesta, o lo que se vio en
  pantalla. Sin evidencia no hay hallazgo; va a "No verificado".

### Paso 2 — Mostrar los hallazgos por gravedad

Agrupa así, en lenguaje de alumna:

- 🔴 **Urgente**: alguien de afuera ya podría hacer daño hoy (una llave secreta visible en el
  navegador o en GitHub, datos de una usuaria que otra puede leer, un pago que se puede falsificar,
  un panel de admin sin candado, el archivo `.env` descargable).
- 🟡 **Importante**: no es una puerta abierta hoy, pero lo será con un poco de mala suerte (sin
  portero contra los mil intentos, formularios que el servidor no revisa, dependencias con fallas
  conocidas, cookies sin sus banderas).
- 🔵 **Buena práctica**: suma capas (cabeceras extra, registro de actividad, paquetes que sobran).

Para cada uno: **qué encontré · por qué importa (con un ejemplo de la vida real) · qué propongo ·
cuánto toca (archivos)**. Al final, el termómetro provisional: *"Hoy cumples X de N controles que
aplican"*.

→ **Checkpoint 2:** "¿Te parece si arreglo primero los 🔴, uno por uno? Te muestro cada prueba."
No arregles nada sin este OK. Si dice "solo los urgentes", respeta eso.

### Paso 3 — Arreglar de a uno

Por cada hallazgo aprobado, en orden de gravedad:

1. Di en una línea qué vas a cambiar.
2. Haz el cambio mínimo que lo resuelve (no aproveches para "mejorar" otras cosas).
3. Comprueba que la app sigue abriendo (`npm run build` o abrir el HTML).
4. Commit chico: `seguridad: <qué se arregló>`.
5. Pasa al siguiente.

Casos especiales:

- **Llave filtrada (en el navegador, en GitHub o en el historial):** el orden es (1) que ella
  ROTE la llave en el panel de su proveedor (tú le dices dónde está el botón, ver control 08),
  (2) tú pones la nueva solo en la caja fuerte (`.env.local` y Vercel), (3) mueves el código para
  que la llave viva en el servidor, (4) redespliegue con su OK. Limpiar el historial de git es un
  paso opcional y aparte, con permiso explícito.
- **Cosas que solo ella puede hacer** (rotar una llave, activar una opción en el panel de Supabase,
  Stripe o Vercel): no las des por hechas. Anótalas en "Lo que tienes que hacer tú", con la ruta
  exacta del botón, y espera a que confirme.
- **Cambios en la base de datos** (políticas, roles): escríbelos en un archivo `.sql` dentro del
  proyecto y pídele que lo corra en el editor SQL de Supabase, o córrelo tú solo si te da acceso
  y OK. Nunca con `drop` ni `delete` sobre datos.

### Paso 4 — Probar cada protección

Corre el "Cómo se prueba" de cada control arreglado y guarda el resultado (comando + respuesta, o
una captura). Una prueba pasa solo si da lo esperado:

- `/.env` → 404 · 31 peticiones seguidas → aparece un 429 · `curl -I` muestra la cabecera ·
  leer el pedido de otra usuaria con otra sesión → vacío · `<script>` escrito en un campo → se ve
  como texto.

Si la app está publicada y el arreglo ya está desplegado (con su OK), vuelve a correr
`scripts/probar-protecciones.mjs` contra la URL real. Si algo no se pudo probar (por ejemplo, no
hay una segunda cuenta de prueba), dilo: va como "No verificado" con lo que faltó.

### Paso 5 — Informe final

Llena `references/plantilla-informe.md` y guárdalo en la carpeta del proyecto como
`INFORME-SEGURIDAD.md` (no lo subas a un repo público si menciona dónde estaba una llave: avísale).
Contiene:

1. Resumen en 3 líneas.
2. Termómetro: controles cumplidos / controles que aplican.
3. Tabla hallazgo → arreglo → prueba → estado.
4. Lo que tiene que hacer ella a mano, con dónde está cada botón.
5. Los controles que no aplican y por qué (una línea cada uno).
6. Lo no verificado.

→ **Checkpoint final:** "¿Despliego los arreglos a tu app publicada?" Solo con su sí.

---

## Si no tiene la skill instalada

`references/prompt-maestro.md` es el pedido completo en voz de alumna, listo para pegar en Claude
Code. Sirve también para que ella entienda qué se va a revisar.

## Skills que se combinan

- **`constructor-miniapps-f100k`** y **`crea-tu-app-f100k`**: construyen la app. Esta skill la
  revisa al final, antes de publicarla o antes de abrirla a más gente.
- **`auditor-ux-app-f100k`**: revisa la experiencia de uso (estados, móvil, claridad). No la
  dupliques; si encuentras un problema de UX, menciónalo en una línea y deriva.
- **`security-review`** (si está disponible): segunda mirada al código para el control 26.
- **Context7 MCP**: trae la documentación actual de Next.js, Supabase o Stripe antes de escribir
  un arreglo; cambian seguido.

## Referencias

- `references/checklist-27.md`: los 27 controles por categoría, con qué es, cómo se revisa, cómo
  se arregla y cómo se prueba. Incluye el mapa de qué aplica según el tipo de app.
- `references/prompt-maestro.md`: el pedido para pegar en Claude Code sin la skill.
- `references/plantilla-informe.md`: la plantilla del informe final.
- `scripts/probar-protecciones.mjs`: pruebas de afuera contra la URL propia (archivos expuestos,
  cabeceras, HTTPS, lista de webs permitidas, mapas de código y, si se le pide, el portero).
