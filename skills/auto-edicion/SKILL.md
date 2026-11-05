---
name: auto-edicion
description: Auto-Edición — dos entradas, un reel terminado en tu compu y gratis. (1) «Sin grabar»: pones UN tema y te entrega un reel explicado 9:16 sin grabarte; investiga con fuentes, escribe el guion con el molde de 8 pasos y un gancho golpe, pone la voz (la tuya grabada, la de la compu o una con IA opcional), dibuja una escena por frase (subtítulo palabra por palabra, ilustración plana al centro, tu avatar abajo: con tus fotos, 3D, pixel o de línea) y renderiza. La primera vez arma «Mi look». (2) «Con tu video»: dejas un video que ya grabaste y dices el estilo; lo corta fino, le pone subtítulos con la clave enorme, gráficos del estilo (split, panel, Depth UI con tu cara delante de tu perfil real, tablero que se llena, ranking, cuadrícula de fotos, fondo que cambia, dos de ti, B-roll, clips de un video largo y más: 31 estilos, cada uno con su plantilla) y lo renderiza, también en 16:9. Encima de cualquier estilo, 19 efectos de 1–4 s (acercamiento seco, foto que escapa, vidrio roto, portal, vértigo, portada de revista, dentro del iPhone, chat que edita, curva que sube, órbita de fotos, pantalla verde, estudio que se enciende, recorte de papel y más). Activar con «auto-edición», «/auto-edicion <tema>», «hazme un reel explicado de…», «explica cómo funciona X en un reel», «reel sin grabarme sobre…», «configura mi look de auto-edición», «edita este video como <estilo>», «auto-edita mi video», «qué estilos de edición hay», «ponle efectos», «qué efectos hay», «agrega el efecto <nombre>».
argument-hint: <tema a explicar> | <ruta de tu video> [estilo]
---

# Auto-Edición

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

**¿Qué entrada es?**
- Si te dan un **tema** (o no hay video), sigue el modo **Sin grabar**, de aquí abajo.
- Si te dan un **video ya grabado** (una ruta .mov/.mp4) o piden «edítalo como…», sigue el modo **Con tu video**: lee `referencia/con-tu-video.md` y, para elegir el estilo, `referencia/estilos.md`. Corre `node K/scripts/instalar.mjs` igual la primera vez, pero no hace falta «Mi look».
- Si preguntan «qué estilos hay», muéstrales la lista de `referencia/estilos.md` en una línea por estilo.
- Si piden **efectos** («ponle efectos», «agrega el portal», «qué efectos hay»), lee `referencia/efectos.md`: 19 golpes de 1–4 s que van en una escena de cualquier estilo (`"efecto"` en plano.json o una pieza de `motor/efectos.js`).
- Si quiere armar o buscar en su biblioteca de B-roll: `referencia/biblioteca-broll.md`.
- Hay **20 efectos más y 7 looks** en el complemento `auto-edit-effects` (si está instalado junto a esta skill: `../auto-edit-effects/referencia/catalogo.md`): palabra ancla, pantalla LED, tier list, interruptores, marco de comando, trama de puntos, looks VHS/cine/duotono/documental/B-N y más. Se conectan solos al mismo motor.

## Modo «Sin grabar»

Un tema en una frase → un reel explicado de 40–60 s, con voz, subtítulos y una escena por frase. Nada se graba en video.
Cada cuadro se dibuja con código y se renderiza gratis en tu compu. Por defecto no gasta nada: el avatar sale de tus
fotos y la voz es la tuya. Solo cuesta si eliges la voz con IA o el avatar en caricatura (los dos opcionales).

`K` = la carpeta de esta skill (la que tiene este `SKILL.md`). Todos los comandos son `node` y corren igual en Mac y en Windows.

## 🧰 EN TU COMPU

- **Programas:** Node 18+, ffmpeg, uv (saca el tiempo de cada palabra; trae su propio Python) y Google Chrome.
  `node K/scripts/instalar.mjs` revisa todo e instala el motor de render (`playwright-core`, con `npm install`).
- **Transcripción (gratis, local):** mlx-whisper en Mac con chip Apple; faster-whisper en Windows y Mac Intel.
  La primera vez descarga el modelo.
- **Tu marca:** acento de color y letras salen de `~/Documents/mi-contenido/mi-marca.md` (o su manual `mi-marca/marca.md`).
  Si no hay, pregunta; si no dice nada: azul iOS `#0A84FF`, Anton para la línea enorme e Instrument Serif itálica para la chica.
- **Tu negocio:** `~/Documents/mi-contenido/mi-negocio.md` (qué vende, a quién y qué regala a quien comenta).
  Si no existe, pregunta en un solo mensaje. Nunca inventes un regalo, una cifra ni un testimonio.
- **«Mi look»:** `~/Documents/mi-contenido/auto-edicion/mi-look.json` y las poses en `~/Documents/mi-contenido/auto-edicion/avatar/`.
- **Dónde guardar:** cada reel en `~/Documents/mis-videos-editados/<nombre-corto>/` (en Windows, la carpeta Documentos
  de su usuario). `node K/scripts/nuevo.mjs` la crea.
- **Abrir el video:** `node K/scripts/sistema.mjs abrir "<ruta>"`.

## 0. La primera vez
1. Corre `node K/scripts/instalar.mjs`. Si falta algo, dile a la persona qué instalar con las palabras del script y espera.
2. Si no existe `~/Documents/mi-contenido/auto-edicion/mi-look.json`, arma «Mi look» (paso 1). Si existe, léelo y salta al paso 2.

## 1. Mi look (una sola vez)
Primero pregunta **qué avatar** quiere (si no sabe, muéstrale los cuatro en una línea cada uno):
- **Con poses** (el de siempre): sus fotos o su caricatura, una imagen por pose. Sigue con este paso y los pasos 4 a 7.
- **Avatar 3D**: personaje 3D que mueve brazos, dedos y boca con la voz; 0 créditos de imagen. Sigue `plantilla/sin-grabar/avatar-3d/LEEME.md` (proyecto con `node K/scripts/nuevo.mjs <nombre> --avatar 3d`).
- **Avatar pixel (Habbo)**: personaje de cubitos en pixel art con 6 gestos y boca con la voz; 0 créditos de imagen. Sigue `plantilla/sin-grabar/habbo/LEEME.md` (`--avatar habbo`).
- **Explicador con avatar de línea**: su retrato en tinta blanco y negro con 3 gestos (opcional, ~5 créditos) o sin avatar, con tarjetas de capturas, cifras y chats; se arma desde un `reel.json` con HyperFrames. Sigue `plantilla/sin-grabar/explicador/LEEME.md`.
En los tres últimos, el tema, las fuentes, el guion y la voz (pasos 2, 3 y 5) son iguales; cambia el armado, que está en su LEEME. Guarda la elección en `mi-look.json` como `"estilo"` (`poses`, `avatar-3d`, `habbo` o `explicador`).

Para el avatar con poses, pregunta lo que falte, de a una cosa:
- **Avatar** (`referencia/poses.md`). Tres caminos; ofrece primero el gratis:
  - **Con sus fotos (gratis):** una foto por pose, con el celular, y `node K/scripts/poses.mjs "<carpeta de fotos>"`
    les quita el fondo en la compu.
  - **Sin avatar:** `N_POSES = 0` en la pieza. Sirve para empezar hoy.
  - **Caricatura con IA (opcional):** Higgsfield, ~2,75 créditos por pose. Di el total antes de generar y espera su sí.
- **Voz:** elige una (prueba una frase y pregúntale si le gusta):
  - **Su voz grabada** (gratis, la recomendada): una nota de voz por frase con el celular.
  - **Voz de la compu** (gratis; suena a robot, sirve para borradores): `node K/scripts/sistema.mjs voces` las lista.
  - **Voz con IA (opcional, cuesta créditos):** con el conector de Higgsfield, una voz prediseñada (`list_voices`) o su
    voz clonada (`create_voice` con un audio suyo de 30–60 s). ~0,3 créditos por frase.
- **Acento de color** y **letras del gancho**: de su marca (ver «EN TU COMPU»).

```json
{ "avatar": "~/Documents/mi-contenido/auto-edicion/avatar", "n_poses": 12,
  "voz": { "tipo": "grabada" },
  "acento": "#0A84FF", "letra_enorme": "Anton", "letra_chica": "Instrument Serif" }
```
`voz.tipo`: `grabada` · `compu` (con `"nombre"` de la voz) · `ia` (con `model: "text2speech_v2"`, `variant: "elevenlabs"`,
`voice_id` y `voice_type`).

## 2. Tema y fuentes
- Tema = `$ARGUMENTS`. Busca **fuentes primarias** (la empresa, el estudio, la documentación oficial) y anota cada cifra con su link y **de qué es** la cifra.
- Si no encuentras fuente para una cifra, no la uses. Nunca inventes datos ni testimonios.

## 3. Guion
Sigue `referencia/molde-guion.md`: gancho golpe (3 variantes con su nota, usa la mejor), 10 a 14 frases de 15 palabras o menos, una escena por frase, CTA con una palabra ligada al tema a mitad y al cierre (nunca «YO»).
Pregúntale qué quiere regalar a quien comente la palabra. Si no tiene regalo, el CTA es «sígueme para el próximo».
Guárdalo en `<proyecto>/GUION.md` como en `referencia/ejemplo-guion.md` (variantes de gancho, guion, fuentes, caption) y **muéstraselo antes de grabar o generar la voz**.

## 4. Proyecto
```
node K/scripts/nuevo.mjs <nombre-corto>          # → ~/Documents/mis-videos-editados/<nombre-corto>/
```
Crea `fuente/` (con la plantilla), `voz/` y `avatar/` (copia sus poses si armó «Mi look»). Con `--desde <proyecto anterior>`
parte de la pieza de otro reel. En adelante `P` = esa carpeta.

## 5. Voz
Un audio por frase en `P/voz/`, numerados en el orden del guion: `01.m4a`, `02.m4a`… (sirven mp3, wav, m4a o aiff).
- **Grabada:** pásale el guion numerado; que grabe cada frase en una nota de voz aparte y te pase los archivos.
- **Compu:** `node K/scripts/sistema.mjs voz "frase" "P/voz/01.wav"` por cada frase (`--voz <nombre>` elige la voz).
- **IA (opcional):** una frase por pedido con `generate_audio_batch` (los datos de `mi-look.json`), de a 5. Escribe las
  cifras en letras («doscientas») y las palabras del CTA en minúscula, porque en MAYÚSCULAS las deletrea. Descarga como
  `voz/01.mp3`, `02.mp3`…

Después corre `node K/scripts/voz.mjs "P"`: recorta los silencios y saca el inicio de cada palabra a `fuente/tiempos.json`.
Revisa la transcripción que imprime: si una frase tiene otra cantidad de palabras que tu texto, ajusta el texto de
`LINEAS` para que coincidan. Si una palabra salió mal dicha, rehaz solo esa frase.

## 6. Escenas
En `P/fuente/pieza.src.html` cambia solo tres cosas:
- `LINEAS`: una por frase. `txt` con `*clave*` en negrita (la primera clave de cada trozo lleva la selección de iPhone), `osc: true` para fondo oscuro (peligro o drama), `poses: [[índiceDePalabra, nPose], …]` con 2 o 3 poses por frase que van con lo que se dice (`referencia/poses.md`). No repitas la misma pose en frases seguidas. Solo usa números de pose que existan.
- `ESC`: una función por frase que dibuja la ilustración del centro (entre y=330 y y=1080; abajo va el avatar). Usa las piezas del ejemplo: `tarjeta`, `pildora`, `etiqueta`, `burbuja`, `onda`, `persona`, `teclado` (CTA) y `de(L, k)` para que algo entre justo cuando se dice la palabra k. Haz una pieza nueva para lo propio del tema. La frase 1 es el gancho golpe.
- `rutas` y `N_POSES`: las capturas reales del tema (la página de la fuente, la app de verdad) van en `fuente/` y en `rutas` (borra `cap_apple.png` de `rutas` si no la usas). Puedes sacarlas con `npx -y playwright@1.48.2 screenshot --viewport-size=1200,900 <url> "P/fuente/cap.png"`. `N_POSES` = cuántas poses tiene (0 = sin avatar).
- Colores: cambia `C.azul` (el acento) y las letras de `C` por las de su marca.

Reglas visuales:
- Cuando se nombra algo real, va su captura real, no un ícono inventado.
- Nada tiembla ni rebota: las cosas entran con corte seco.
- No dibujes manos ni caras en vector (el motor lo bloquea). Las personas van como personitas tipo ícono o como el avatar.
- Ningún hueco vacío: cada escena tiene algo en el centro desde su primer cuadro.

## 7. Revisa, renderiza y entrega
```
node K/scripts/vista.mjs "P" 1s,4s,8s,12s,16s,20s,24s,28s,32s,36s,40s,44s   # cuadros sueltos en fuente/f-*.jpg
node K/scripts/render.mjs "P" "P/<nombre>.mp4"
node K/scripts/cuadros.mjs "P/<nombre>.mp4" "P/hoja.jpg" 1 5 9 13 17 21 25 29 33 37 41 45
```
Mira los cuadros antes del video completo: el gancho ocupa el ancho, nada se encima, el subtítulo se lee y el avatar cambia de pose dentro de la frase. Corrige y vuelve a mirar.
Al final abre el video (`node K/scripts/sistema.mjs abrir "P/<nombre>.mp4"`) y entrega: el MP4, el gancho elegido con su nota, la fuente de cada cifra, el caption y los créditos gastados (0 si fue todo gratis).

## Para el siguiente video
Reusa `mi-look.json` y el avatar. Con `node K/scripts/nuevo.mjs <nombre> --desde <proyecto anterior>` partes de una pieza que ya funciona si el tema se parece.
