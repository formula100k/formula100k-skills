---
name: edicion-notitas-f100k
description: "Edita un talking-head 9:16 con el estilo «notitas»: corte ultra fino (cero aire entre palabras), un encuadre distinto en cada corte, gancho golpe de 2 a 5 palabras de 0 a 3 s (una línea enorme en letra de diseño, sin brillo y con corte seco, negativa o polémica, con 3 variantes A/B/C para trial reels), subtítulos de UNA palabra en serif con las clave en el color de tu marca y 1,2x, notitas a mano grandes que aparecen con corte seco sobre un degradado negro suave (rótulo del paso, listas que se acumulan, palabra que estalla), capturas, fotos y logos reales (memes solo de reacción puntual), mockups de lo que se nombra (guion que se escribe, prompt pegado en Claude, skill que se instala, nota de voz, carpeta, chat de WhatsApp, post publicado), uno a la vez cada 1,5–3 s, láminas de papel a pantalla completa con trazo a mano quieto para explicar (flujo, lista, mockup, antes/después) y efectos de papel y caricatura. Render local con Remotion (gratis), en Mac y en Windows. Activar con 'edítalo con notitas', 'estilo notitas', 'edición palabra por palabra con notitas', 'edítalo como la referencia de las notitas', '/notitas <video>'. NO usar para la persona recortada con motion arriba (reel-motion-recortada-f100k), la ráfaga de memes que tapa la cara ni el corte simple con header (editor-video-formula100k)."
argument-hint: "[ruta del video o carpeta]"
---

# Edición «notitas»

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Toma un video hablado a cámara y lo deja con el estilo medido en
`references/BIBLIA-DE-ESTILO.md` (léela antes de escribir el plan: ahí están las medidas y el porqué).
En corto: **se corta todo el aire, la cámara cambia en cada corte, el texto acompaña lo que se dice y nunca hay dos cosas compitiendo.**

`SK` = la carpeta de esta skill (normalmente `~/.claude/skills/edicion-notitas-f100k`) · `ED` = `~/.claude/skills/editor-video-formula100k/scripts` (motor de corte, se reusa; viene en el mismo módulo).
Los `.py` de la skill corren con `uv run --no-project --python 3.12 --with numpy python -X utf8 <script>` (Python sin instalar Python;
igual en Mac y en Windows). Escríbelo entero en cada comando: guardado en una variable no corre en zsh.

## 🧰 EN TU COMPU

Esta skill viaja en el módulo de Edición y corre igual en Mac y en Windows (en Windows, desde la terminal de Git Bash que usa Claude Code).

- **Programas:** Node 18 o más nuevo, ffmpeg (con ffprobe), uv y Google Chrome. Python no se instala aparte: uv lo trae.
  El motor de render (Remotion + puppeteer-core) vive dentro de la skill, en `render/`: se instala solo con el módulo
  (`npm install` en la skill corre `scripts/preparar.mjs`). Si falta, `node "$SK/scripts/preparar.mjs"`.
- **Corte:** reusa `editor-video-formula100k` (mismo módulo). Transcribe con mlx-whisper en Mac con chip Apple y con
  faster-whisper en Windows y Mac Intel. El corte fino «por comprensión» usa la llave de Anthropic de
  `~/.editor-video/llave-anthropic.txt` (la misma del editor, nunca en una variable de entorno); **sin llave funciona igual**:
  corta silencios y muletillas y avisa `semantic OFF` (ahí el paso 2 se hace a mano, como dice abajo).
- **Tu negocio:** `~/Documents/mi-contenido/mi-negocio.md` (qué vendes, a quién, qué palabra pide comentar en el CTA).
  Si no existe, sácalo de lo que dice el video o pregunta en una línea. No inventes cifras, precios ni testimonios.
- **Tu marca:** `~/Documents/mi-contenido/mi-marca.md` (o su manual `mi-marca/marca.md`). Su color de acento va en
  `colorClave` del plan (palabras clave del subtítulo) y en las notitas (`color` con su hex); su @ va en `usuario` de los
  mockups `post_ig`. Si no hay marca, usa el amarillo de fábrica `#FFE14D` y pregúntale en un solo mensaje su color y su @.
- **Dónde guardar:** cada video en `~/Documents/mis-videos-editados/notitas-<nombre>/` (en Windows, la carpeta Documentos
  de su usuario). Esa carpeta es `DEST`. Nunca en una carpeta temporal.
- **Otras skills:** `gancho-golpe-f100k` y `editor-video-formula100k` vienen en el mismo módulo; `collage-gancho-f100k`
  (fotos para las escenas) viene en el de Animación. Si alguna no está instalada, sigue sin ella y avisa en una línea.

## Reglas que mandan (por encima de la referencia)

0. **Sin frase puente** después del gancho («Pero antes, una cosa…»): suena robótica. Se entra directo a la historia o al
   primer paso, o va un pico de interés REAL del caso (dato, giro o escena concreta). Si la toma lo dice, no lo escribas en pantalla.
1. **Corte fino de verdad**: cero frases repetidas, autocorrecciones ni arranques en falso.
2. **Un elemento a la vez** además del subtítulo. La lista que se acumula cuenta como uno.
3. **Mostrar lo que se dice**: si nombra una herramienta, su logo; un número, la captura real; una emoción, el meme. Nada decorativo.
3b. 🔴 **Mockup de todo lo que se nombra.** Un logo o un emoji NO alcanza: «pega este prompt» → `mockups` tipo `prompt` con el
   texto real pegándose en el chat de Claude; «skill» → `skill` (se instala y trabaja); «nota de voz / grabación / audio» → `voz`;
   «carpeta» → `carpeta` (las capturas caen adentro); «este guion / escribir el guion» → `guion` (la hoja con el guion real
   escribiéndose); «mensajes / chats de WhatsApp» → `chat`; «carrusel/post listo para publicar» → `post_ig`; «mándale la captura»
   → `prompt` con `imgs` (adjunto).
   El render avisa `se nombra «…» y no hay mockup` (prompt, skill, voz, carpeta): ese aviso no se entrega sin resolver.
4. **Imágenes reales**: capturas, perfil y logos de verdad. Nunca una cara inventada ni piezas de otras creadoras.
5. **Efectos de sonido en todo**: la skill los pone solos. **Sin música** (se pone al publicar en Instagram).
6a. **Gancho collage como sticker → apaga los subtítulos mientras dura** (`subtitulos.cambios` con `oculto`) y, si la frase es
   larga, una capa por tramo con las palabras textuales que dice.
6. **Golpe en 0–2 s**: el gancho textual está en el cuadro 0 y se puede sumar una captura real.
6b. 🔴 **Gancho golpe** (skill `gancho-golpe-f100k`): de 2 a 5 palabras, SIN sub, una línea enorme (`"estilo": "golpe"`)
   negativa o polémica, sin nombrar Claude/prompt/skill, hablando de TI. El gancho serif de 2 líneas + sub queda solo si la
   persona lo pide. Siempre 3 variantes en `ganchos` (moldes distintos) y se renderizan las 3 (`--gancho 0|1|2`).
7. **Ningún texto fuera del cuadro.** Revisar la hoja de cuadros antes de entregar.
8. **Sin desenfoque al inicio**: el cuadro 0 ya está nítido.
9. CTA nunca «YO» (palabra gastada): si la toma lo dice, avísale a la persona y no la escribas en pantalla. La palabra sale
   de su `mi-negocio.md` o de lo que dice el video.

### 🔴 Edición sin olor a IA
- **Fotos y capturas reales antes que emojis o íconos**: el triple emoji y el emoji de mano salen; en su lugar, la captura, la
  foto del carrete o un meme real. Los mockups van planos, como la pantalla del celular.
- **Fuera la tembladera**: el render no hace pop, rebote ni temblor de garabato (láminas, fotos y mockups quedan quietos).
  El único golpe es el del cuadro 0–2 s (whoosh + zoom seco de cámara).
- **Corte seco**: subtítulos, notitas, stickers y gancho aparecen enteros en su cuadro. El tecleo (`escribe: true`) queda solo
  si la persona lo pide.
- **Gancho golpe en letra de diseño**: `"letra": "condensada"` (Anton de póster), `"serif"` (itálica elegante) o `"palo"`
  (Montserrat); elígela por tema. Sin brillo ni degradado; la chica va en serif itálica.
- 🔴 **Default en notitas: `"letra": "editorial"`** (look minimalista editorial con letras grandes y colores pastel que van con
  la ropa, y ganchos no tan largos). Instrument Serif recta en mayúsculas, `tamano: 230`, la línea grande en un **pastel sacado
  de la ropa de la toma** (hex en `color`: rojo → rosa `#F7B9C6`, celeste/gris → celeste `#BFD9F3`, azul marino → lavanda
  `#CCC9F2`, blanco/lunares → manteca `#F4E2B3`), la chica en serif itálica blanca. Nada de rojo/verde/amarillo saturado en
  notitas. Sigue las reglas de `gancho-golpe-f100k` (2–5 palabras, golpe, sin Claude, palabra clave, coherente) y se entrega UNA
  ganadora autoevaluada.
- La densidad de un apoyo cada 1,5–3 s se mantiene, con fotos, capturas y texto quieto en vez de movimiento.

### 🔴 Escenas scrapbook a pantalla completa («la combinación completa»)
Un tramo donde solo se ve la cara hablando de algo que se puede mostrar (un lugar, un objeto, un precio, un paso) **no se queda
en la cara con una notita**: lleva una **escena** = cartón kraft a pantalla completa que tapa la toma (la voz sigue) con fotos
reales de borde rasgado, etiquetas de papel, sellos, precios y letreros que entran con corte seco, cada uno anclado a la frase
que lo nombra, y quietos.
- De 3 a 5 escenas por cada 90 s, de 2 a 6 s cada una. No reemplazan a los memes ni a las capturas: van en los huecos de pura cara.
- Fotos reales siempre: las de la persona (su carrete, su local, su producto), capturas, o la biblioteca de `collage-gancho-f100k`
  si está instalada.
- Se hornean en la toma ANTES del render de notitas: `node "$SK/escenas/hornear.mjs" <carpeta con config.js y fotos/> <base.mp4> <base_escenas.mp4>`
  y en el plan `"video": "base_escenas.mp4"`. Ejemplo completo en `escenas/ejemplo-config.js` (tipos: `escena` con `hijos` · `foto`
  · `etiqueta` · `etiqueta mano` · `sello` · `precio` · `letrero`; `x, y` = centro; `cuando`/`hasta` = frases; `quieto: true` siempre).
  Las letras de las escenas vienen en `escenas/letras/` (todas con licencia libre OFL).
- En el PLAN: saca las notitas, memes y zooms que caían dentro de una escena y borra de `cortes.json` los cortes que caen dentro
  (si no, el cartón salta con el zoom de corte). El aviso `[warn] ritmo` en un tramo con escena es falso.
- Clips de apoyo de la persona (su pantalla, un objeto real) también se hornean en la base antes, con ffmpeg (`overlay` con
  `enable='between(t,a,b)'`).
- En `PLAN.json` un `hasta` numérico no es segundo absoluto: para cortar a un tiempo exacto usa `dur`.

## 🔴 Memes de reacción a sus caras
Como hacen las editoras de reels: **cada vez que la persona hace una cara o dice algo con sarcasmo o risa, va el meme**.
No es decoración: el meme traduce el gesto.
- **Cómo encontrar los momentos** (no solo leyendo el texto): en `captions.json` busca ironía y remates («obvio», «claro», «ajá»,
  «no pasa nada», «súper fácil» dicho al revés, «spoiler», «nadie me creyó», risas `[risa]`/«jaja»), y además saca cuadros cada 0,5 s
  (`ffmpeg -vf fps=2`) y mira la cara: ojos en blanco, mirada de lado, ceja arriba, sonrisa contenida, carcajada, boca abierta.
- **Densidad**: de 4 a 8 memes de reacción por cada 90 s, además de los de emoción. Uno a la vez, nunca dentro de una escena
  scrapbook ni encima de un mockup, y nunca tapando la cara (costado libre, x ≈ 850–880).
- **Corte seco, 0,8–1,2 s**, pegado al gesto (entra en el cuadro de la cara, no después). Sin rebote ni tembladera.
- **Qué meme con qué cara** (nombres del banco `_memes/`, ver paso 4):

| Su cara o frase | Meme |
|---|---|
| mirada de lado, desconfía, «ajá, sí» | chloe-ojo |
| pone los ojos en blanco, «obvio», «otra vez» | ojos-arriba |
| ironía, «pero bueno, no digo nada» | kermit-te |
| se queda en blanco, «¿perdón?», algo absurdo | parpadeo-1 / parpadeo-2 (los dos seguidos 0,5 s c/u) |
| se ríe de sí misma, remate gracioso | leo-risa, gato-risa, gato-risa2 |
| metida de pata, «qué tonta» | facepalm |
| «truco», idea pícara, «lo que hice fue…» | listo-cabeza |
| sonrisa traviesa, «lo hice igual», travesura | nina-desastre |
| todo sale mal y sigue, «no pasa nada» | perro-todo-bien |
| sorpresa falsa, «¿quién lo diría?» | pikachu, gato-shock |
| asombro de verdad, «¿en serio?», se le cae la mandíbula | harvey-shock |
| «esto no / esto sí», compara lo malo con lo bueno | drake-no-si (los 2 cuadros) |
| sonrisa forzada, «todo bien» con dolor | harold-sonrisa |
| logro chico, puño cerrado, «¡lo logré!» | nino-exito |
| «imagínate…», sueña en grande | bob-imaginacion |
| no entiende nada, «¿qué?, ¿cómo?» | jackie-no-entiendo, nick-confundido |
| busca algo que no está, «¿y los resultados?» | travolta-perdido |
| plan maquiavélico, «y ahí es cuando…» | burns-excelente |
| regalo, «para ti, para ti», CTA del regalo | oprah-regalo |
| esperando, «sigo esperando», «nunca llegó» | bean-esperando, esqueleto-esperando, bernie-sentado |
| agotada, «otra vez lo mismo» | affleck-cansado |
| celebra, brinda, «salud por eso» | leo-brindis, chavo-eso-eso (en clave latina) |
| tranquila mientras todo pasa, ignora el drama | yoda-sopa |
| aprueba, «me encanta», pulgar arriba | gato-pulgar |
| caos total, «se prendió todo» | elmo-fuego |
| ruega, «por favor», carita triste a propósito | hamster-triste |
| duda, «mmm… pensándolo bien sí» | kombucha-duda (los 2 cuadros) |
| triste y sola, nadie la apoyó | keanu-triste |
| «somos iguales», copia, «hacemos lo mismo» | spiderman-igual |
| se distrae con otra idea brillante | novio-distraido |
| incómoda, mira para otro lado, «yo no dije nada» | mono-incomodo (los 2 cuadros) |
| indignada, «¿perdón? ¿qué dijiste?» | gato-mesa |
| molesta, «no», cero ganas | gato-grunon |

- Si falta una cara en su banco, búscala en internet (`"<reacción> meme"` en Google Imágenes o Giphy; si tiene el conector de
  Apify, `hooli/google-images-scraper`, 4 por búsqueda), arma una hoja con ffmpeg (`tile`), míralas, recorta el texto en inglés
  y súmalas al banco con el nombre de la tabla.

## Pipeline

### 0 · Instalación (una vez)
El módulo ya la hizo. Si el render dice que falta algo:
```bash
node "$SK/scripts/preparar.mjs"              # instala el motor de render dentro de render/
node "$ED/editar.mjs" --revisar              # revisa ffmpeg, uv y el transcriptor
```

### 1 · Carpeta del proyecto
`DEST=~/Documents/mis-videos-editados/notitas-<nombre>` (`mkdir -p "$DEST"`).
Si el video ya tiene un corte fino aprobado en otra carpeta (`_source_cut.mov` + `captions.json`), cópialo y si hay `recut.json`
guarda sus `cortes` en `cortes.json`. No lo vuelvas a cortar.

### 2 · Corte ultra fino (siempre, aunque el video venga de otra edición)
Primero **transcribe el crudo entero y entiende el guion**: qué quiere decir, cuál es la toma buena de cada frase, dónde repitió
o se corrigió. Un corte heredado de otra carpeta también se audita así antes de usarlo.
```bash
node "$ED/editar.mjs" "$VIDEO" --solo-corte --carpeta "$DEST" --semantic-level ajustado
```
- Si el registro dice `semantic OFF` (no hay llave), el corte por comprensión **no ocurrió**. Busca en `captions.json` las palabras
  que «duran» > 0,9 s: casi siempre esconden una toma repetida. Transcribe el original aislado
  (`node ~/.claude/skills/animacion-dibujada-f100k/scripts/sistema.mjs transcribir audio.wav` si está esa skill, o
  `uvx --from openai-whisper whisper audio.wav --model small --language es --output_format json --word_timestamps True --condition_on_previous_text False`),
  saca los rangos a quedarte (la última toma completa de cada frase), ajusta los bordes a silencios
  (`silencedetect=noise=-38dB:d=0.07`) y escribe `tramos.json` (`[[ini, fin], …]` en segundos del original).
- 🔴 **Los tramos a mano NO son el corte fino**: pásalos SIEMPRE por `uv run --no-project --python 3.12 --with numpy python -X utf8 "$SK/scripts/corte_fino.py" VIDEO "$DEST" tramos.json`
  (saca toda pausa > 0,12 s dentro de cada tramo; con `PALABRAS=crudo.json` delante no parte palabras), pega a su vecino los
  pedacitos < 0,2 s que marque `revisar_uniones` y recién ahí monta. Un tramo de más de 5 s en el EDL = no se hizo.
- El registro tiene que decir `snap=on`. Con `snap=off` los cortes se comen el final de las palabras: para y arréglalo antes de seguir.
- **Verifica tramo por tramo**: `uv run --no-project --python 3.12 --with numpy --with openai-whisper python -X utf8 "$SK/scripts/auditar.py" VIDEO "$DEST/edl.json" aud.txt`
  transcribe CADA tramo por separado; whisper sobre el corte entero funde las repeticiones en una palabra larga y no las ves.
  Quita lo que sobre con `uv run --no-project --python 3.12 --with numpy python -X utf8 "$SK/scripts/quitar.py" "$DEST" SRC.mov OUT.mov '[[a,b],…]'` (remapea todo).
- **Verifica**: transcribe `_source_cut.mov` y léelo entero. Si queda una repetición o una palabra mocha en una unión, vuelve a cortar.
- **Verifica las uniones con el audio** (la transcripción se puede leer completa y tener finales mochos):
  `uv run --no-project --python 3.12 --with numpy python -X utf8 "$SK/scripts/revisar_uniones.py" <toma> <edl.json o tramos en segundos de la toma>` tiene que decir `✅ uniones limpias`.
  Nunca aprietes pausas con los tiempos de Whisper: lleva cada borde a 40 ms de silencio real.
- Si el `captions.json` remapeado pierde palabras en los bordes, usa el de la transcripción del corte verificado.

### 3 · Encuadre
Saca un cuadro al 50 % y léelo. Anota dónde está la coronilla (las notitas van arriba de ella), si el fondo es claro
(la sombra ya está reforzada, pero sube `tamano`) y qué costado está libre para memes (por defecto la derecha; el subtítulo va a la izquierda).

### 4 · Recursos
- **Reales primero**: perfil (`perfil_top.png` = la mitad de arriba de su perfil), bio, portadas, capturas, logos (Claude, WhatsApp…).
  Búscalos en las carpetas de sus proyectos anteriores (`~/Documents/mis-videos-editados/`) antes de pedirlos. Lo que solo tiene
  la persona, pídeselo por nombre en un solo mensaje.
- **Memes de reacción**: su banco vive en `~/Documents/mis-videos-editados/_memes/` (un PNG por meme, con el nombre de la tabla de
  arriba). La skill no trae memes: la primera vez el banco está vacío y se arma con los que pide el video (ver «Si falta una cara»).
  Memes en español o sin texto; nunca uno con marca de agua de otra creadora.
- Copia todo dentro de `$DEST/USER/` y `$DEST/MEMES/` (el render solo ve lo que está en la carpeta).

### 5 · El plan (`$DEST/PLAN.json`) — aquí se decide todo
Lee `captions.json` palabra por palabra con sus tiempos y escribe el plan con el formato de abajo. Cómo decidir:

| Momento del guion | Qué poner |
|---|---|
| 0–3 s | `ganchos`: 3 variantes golpe (`gancho-golpe-f100k`): 2 a 5 palabras que comprimen lo que DICE en la primera frase, una línea enorme y otra chica blanca, sin sub. `gancho` = la ganadora. Si hay prueba real (perfil, cifra, contadores de vistas), una captura al costado. |
| advertencia, giro | `camara.eventos` zoom 1,22–1,28 por 0,9 s |
| golpe negativo («no», «nadie», «error») | `bn: true` 0,9–1 s, o notita «no» roja |
| pasos numerados | lista que se acumula: una notita por paso, todas con el mismo `hasta` (el fin del último paso), en diagonal arriba de la cabeza |
| nombra una herramienta | su logo (`tipo: logo`) 1,2 s al costado |
| nombra una prueba/cifra | captura real (`tipo: captura`), o cifra en serif grande (`fuente: serif`) |
| emoción (cansancio, sorpresa, «así de fácil», «perfecto») | meme real 1–1,4 s (sin triple emoji) |
| hace una cara, ironiza, se ríe o suelta un «obvio», «ajá», «claro que sí» | meme de reacción 0,8–1,2 s en el mismo cuadro (ver «Memes de reacción a sus caras») |
| cierre en cadena («lo grabas, lo editas, publicas») | palabras a mano que se acumulan con ✓ |
| CTA (a mitad y al final) | `«PALABRA»` a mano arriba a la derecha mientras la dice (sin emoji de corazón) |
| arranca con «hacer este guion», «escribí el guion» (o cualquier gancho que nombra algo escrito) | `mockups` tipo `guion` desde el cuadro 0 (`t: 0.05`): la hoja con el guion real escribiéndose. El gancho no se queda solo con la cara |
| «si no le cuentas X, te escribe lo mismo» (el error) | `prompt` tecleado (`pegar: false`) con el pedido flojo + `respuesta` genérica |
| nombra **prompt, skill, nota de voz, carpeta, chats, post publicado** | `mockups` (tarjeta pegada con cinta, 1,5–4 s, abajo del subtítulo). Reemplaza al logo/emoji de ese momento |
| hay que **explicar** (un proceso, una cadena de pasos, cómo se ve algo, qué sí y qué no) | `laminas`: papel a pantalla completa, 3–6 s, máximo 2 por video. `flujo` (pasos con flechas), `lista` (con ✓ o tachado), `mockup` (1 captura real en celular, o hasta 4 pegadas con cinta), `comparar` (así no / así sí) |

- **Cadencia**: algo nuevo cada 1,5–3 s, nunca 5 s vacío. El render avisa (`[warn] ritmo`, `[warn] a la vez`).
- **Palabras clave** (`amarillas`): 6–10 palabras clave del tema + nombres propios. Las cifras salen marcadas solas. El color
  sale de `colorClave` (el acento de su marca; amarillo `#FFE14D` si no tiene).
- **Posiciones** (lienzo 1080×1920, x/y = centro del elemento): gancho y ≈ 140–200; notitas **grandes (76–96 px, default 84) y
  bajas, y ≈ 290–580**, justo encima de la coronilla; un degradado negro suave arriba (siempre puesto) las separa del techo.
  Listas: un paso cada ~95 px en diagonal. Si una notita no cabe, el render la achica y la mete al cuadro (`[warn] no entraba`).
  Memes/logos a la derecha x ≈ 850–880, y ≈ 600–1020. El subtítulo vive a la izquierda (y 1160).
- **Láminas**: lo que cae debajo se saca solo (o se corta si empezó antes) y el subtítulo se esconde. Los items sin `en` entran
  0,4 s después del anterior; anclalos a la frase que los nombra. Imágenes reales siempre (`USER/…`).
- **Mockups**: el texto del prompt es el prompt de verdad (el del regalo o el que se muestra en el video), nunca «tu prompt aquí».
  Se ubican solos abajo del subtítulo (borde de arriba en y 1250) y dentro del cuadro; si una tarjeta alta pisa la franja del
  subtítulo, el subtítulo se apaga mientras dura. Un mockup es el elemento del momento: sin memes ni notitas cortas encima
  (`[warn] a la vez: mockup…`); la lista de pasos que se acumula arriba sí puede seguir. `rotulo` = la notita a mano que lo nombra.
  Dos mockups nunca a la vez: el render corta al anterior cuando entra el siguiente.
- **Cada paso hablado que nombra algo, su mockup** (ejemplo de un video bien hecho: hoja del guion → prompt flojo → «en dos líneas»
  tecleado → link del video pegado → prompt pegado con la estructura → nota de voz → chat de WhatsApp → lámina «Así de fácil»
  → skill en el CTA).

### 6 · Render
```bash
cd "$SK/render"
npx tsx scripts/render.ts "$DEST" --solo-resolver   # resuelve y avisa, sin render
npx tsx scripts/render.ts "$DEST" --desde 0 --hasta 6 --out _prueba.mp4   # tramo de prueba
npx tsx scripts/render.ts "$DEST"                   # → $DEST/BORRADOR_NOTITAS.mp4 (~1 min por 40 s)
for v in 0 1 2; do npx tsx scripts/render.ts "$DEST" --gancho $v; done   # → BORRADOR_NOTITAS_A/B/C.mp4 (trial reels)
```
La primera vez baja el navegador de render (unos minutos): córrelo en segundo plano y espera, no lo cortes.
Resuelve cada `en` (frase del transcript; la última palabra puede ir a medias: «mill» → «millones»), arma la cámara alternando
1,0 ↔ `zoomCorte` en cada corte (de `cortes.json` o `edl.json`; tramos < 0,5 s no cambian) y pone los efectos:
sello en el gancho, teclado en cada notita que se teclea, sello en la palabra que estalla; memes con un efecto de caricatura que
alterna (boing, bloop, papel arrugado, chirrido); capturas con papel; emojis y logos con bloop/pop; whoosh en zoom, papel deslizado
en marco, silbato que baja en blanco y negro; láminas: papel deslizado al entrar, plumón en el título, lápiz por caja, papel por imagen,
chirrido en ✓ y bocina en ✗/tachado. Cualquier elemento acepta `"sfx": "boing"` para cambiarlo o `false` para silenciarlo.

### 7 · Revisión (obligatoria antes de entregar)
```bash
ffmpeg -y -loglevel error -i "$DEST/BORRADOR_NOTITAS.mp4" -vf "fps=1,scale=230:-1,tile=8x6:padding=4:color=white" -frames:v 1 "$DEST/_hoja.jpg"
```
Lee la hoja: cada prompt/skill/voz/carpeta nombrado tiene su mockup, textos dentro del cuadro, nada encima de los ojos, una cosa a
la vez, notitas legibles sobre el fondo. Abre 2–3 cuadros a tamaño real en los momentos más cargados. Di qué no pudiste verificar
(nadie escuchó el audio).

### 8 · Entrega
Nombre `<tema>-notitas.mp4`, copia en `$DEST` y ábrelo para que la persona lo vea (`open` en Mac, `start ""` en Windows).
Si es la variante B de otra edición, déjala al lado de la A con el mismo tema en el nombre.

## Formato de `PLAN.json`

```json
{
  "gancho": {"estilo": "golpe", "lineas": ["tu perfil", "NO VENDE"], "grande": 1, "color": "rojo", "letra": "condensada", "y": 250, "hasta": 2.9},
  "ganchos": [
    {"estilo": "golpe", "lineas": ["tu perfil", "NO VENDE"], "grande": 1, "color": "rojo", "y": 250, "hasta": 2.9},
    {"estilo": "golpe", "lineas": ["3 SEGUNDOS", "o no te compran"], "grande": 0, "color": "amarillo", "y": 250, "hasta": 2.9},
    {"estilo": "golpe", "lineas": ["BORRA", "tu bio de hoy"], "grande": 0, "color": "rojo", "y": 250, "hasta": 2.9}],
  "amarillas": ["perfil", "vendes", "skill"],
  "subtitulos": {"zona": "izq", "tamano": 82, "cambios": [{"en": "segundo paso", "zona": "der"}]},
  "camara": {"zoomCorte": 1.1, "eventos": [
    {"en": "fotos con un", "dur": 1.0, "bn": true},
    {"en": "con números", "dur": 0.9, "zoom": 1.25},
    {"en": "en tiempo real", "dur": 1.6, "marco": true}]},
  "notitas": [
    {"en": "primera línea", "hasta": "escribes", "texto": "1. a quién ayudas", "x": 330, "y": 190, "rot": -3},
    {"en": "pero no es", "dur": 0.8, "texto": "no", "color": "rojo", "tamano": 170, "escribe": false, "x": 230, "y": 760},
    {"en": "30 carruseles", "dur": 1.6, "texto": "30 carruseles\n40 minutos", "fuente": "serif", "tamano": 100, "x": 540, "y": 1500}],
  "stickers": [
    {"t": 0.15, "hasta": 2.9, "src": "USER/perfil_top.png", "tipo": "captura", "x": 860, "y": 700, "w": 330, "rot": 3},
    {"en": "skill", "dur": 1.3, "src": "USER/claude.png", "tipo": "logo", "x": 860, "y": 600, "w": 210},
    {"en": "así de fácil", "dur": 1.2, "src": "MEMES/mono-aplaudiendo.png", "x": 850, "y": 640, "w": 320, "rot": -3},
    {"en": "estructura viral", "dur": 1.2, "src": "MEMES/gato-shock.png", "x": 870, "y": 820, "w": 300}],
  "laminas": [
    {"en": "y tengo un skill", "hasta": "pantalla", "tipo": "flujo", "titulo": "Optimiza tu perfil", "items": [
      {"texto": "le mandas tu captura", "img": "USER/perfil_top.png"},
      {"en": "optimizar", "texto": "el skill la revisa", "img": "USER/claude.png"},
      {"en": "captura", "texto": "tu perfil, listo", "check": true}]},
    {"en": "primero no", "hasta": "y a quién", "tipo": "comparar", "titulo": "Cómo pedírselo", "rotulos": ["así no", "así sí"],
     "items": [{"en": "hazme un reel", "texto": "«hazme un reel»"}, {"en": "dile qué vendes", "texto": "qué vendes y a quién"}]},
    {"en": "un recetario", "hasta": "aquí abajo", "tipo": "mockup", "titulo": "Mi recetario",
     "items": [{"img": "USER/recetario.png"}, {"en": "comentando carruseles", "texto": "comenta «CARRUSELES»"}]}],
  "mockups": [
    {"tipo": "guion", "t": 0.05, "hasta": "tomarme", "titulo": "Mi guion",
     "items": ["Gancho: me tomó un café ☕", "Paso 1: qué vendes", "Paso 2: un video que funcionó", "CTA: comenta GUION"],
     "tiempos_en": [0.15, 0.6, "editarlo", "me tomó"]},
    {"tipo": "prompt", "en": "el último paso", "hasta": "listo para", "icono": "USER/claude.png", "rotulo": "copia y pega el prompt",
     "texto": "Hazme un carrusel con el formato «Causa y consecuencia»…", "accion_en": "y pegar", "envia_en": "en claude y",
     "respuesta": "Listo: tu carrusel de 8 láminas ✓", "respuesta_en": "te va a dar"},
    {"tipo": "prompt", "en": "mandarle la captura", "dur": 1.4, "icono": "USER/claude.png", "imgs": ["USER/perfil_top.png"], "texto": "Optimiza mi perfil"},
    {"tipo": "skill", "en": "utiliza este skill", "hasta": "y te la", "icono": "USER/claude.png", "texto": "Roba Estructuras",
     "accion_en": "este skill", "items": ["Gancho", "Problema", "Pasos", "CTA"], "tiempos_en": ["robar", "estructura viral", "cualquier video", "redes"]},
    {"tipo": "voz", "en": "graba una nota", "hasta": "utiliza", "avatar": "USER/avatar.png", "rotulo": "tu nota de voz", "segundos": 9, "accion_en": "de voz"},
    {"tipo": "chat", "en": "mándale capturas", "hasta": "aunque", "titulo": "Tus chats de WhatsApp", "avatar": "USER/avatar.png",
     "mensajes": [{"de": "otro", "texto": "¿Y eso funciona? 👀"}, {"de": "yo", "texto": "Holaaa, sí, mira"}], "tiempos_en": ["mándale", "de whatsapp"]},
    {"tipo": "carpeta", "en": "y guárdalos", "hasta": "pantalla", "texto": "Referencias", "imgs": ["USER/c1.jpg", "USER/c2.jpg"], "tiempos_en": ["guárdalos", "una carpeta"]},
    {"tipo": "post_ig", "en": "listo para publicar", "dur": 1.3, "imgs": ["USER/c10.jpg"], "avatar": "USER/avatar.png", "texto": "Guárdalo 📌", "accion_en": "publicar", "w": 520, "arriba": 700}],
  "sfx": {"volumen": 1, "extra": [{"en": "boom", "archivo": "boing", "vol": 0.2}]}
}
```

- Gancho golpe: `estilo: "golpe"`, `grande` (índice de la línea enorme, default la última), `color` rojo | verde | amarillo | hex,
  `letra` (23-oct: `condensada` = Anton de póster, default · `serif` = itálica elegante · `palo` = Montserrat 900; se elige por tema),
  `chica: "sans"` (línea chica en palo seco mayúscula; default serif itálica), `tamano` (tope de la grande, 170; se achica sola para caber).
  Sin brillo ni rebote: está entera y quieta desde el cuadro 0.
  Si una notita entra arriba (y < 760) mientras dura, el golpe se retira solo. Avisos: más de 5 palabras o con `sub`.
- Ancla: `en` (frase) + `n` (ocurrencia, default 1) o `t` (segundos). `offset` corre el inicio. Fin: `dur` (segundos) o `hasta` (frase posterior o segundos).
- Zonas de subtítulo: `izq`, `der`, `izq-alta`, `der-alta`, `centro`; `{"en": …, "oculto": true}` lo apaga en un tramo.
- `color`: `amarillo` (default), `blanco`, `rojo` o un hex. `fuente`: `mano` (default) o `serif`. `recuadro: true` = caja de borde (callback del título).
- `tipo` de sticker: `meme` (borde blanco), `captura` (esquinas redondeadas + sombra), `logo` (sin marco). `numero: "426K"` pone la cifra en serif debajo.
- Láminas: `tipo` flujo | lista | mockup | comparar; `titulo` (serif con resaltador); `items` [{en|t, texto, img, check, tachado}];
  `marco: "ninguno"` en mockup para pegar la captura sin celular; `rotulos` en comparar. Máximo 5 items en flujo/lista, 4 en el collage.
- Mockups: `tipo` prompt | guion (hoja de cuaderno: `items` = líneas que se escriben solas; para «hacer este guion», «tu guion») | skill | voz | chat | carpeta | post_ig. `texto` (prompt: el texto; skill: su nombre; carpeta: etiqueta; post: caption),
  `icono`, `avatar`, `imgs`, `items`/`mensajes`, `rotulo`. Momentos internos por frase, buscados DESPUÉS de que entra la tarjeta:
  `accion_en` (se pega / se instala / suena / late el corazón), `tiempos_en` (cada item, mensaje o captura), `envia_en`, `respuesta_en`.
  Un número en `tiempos_en`/`accion_en` son segundos ABSOLUTOS del video (útil para la primera línea en el cuadro 0, donde no hay frase antes).
  `pegar: false` teclea el prompt en vez de pegarlo. Ubicación opcional `x`, `arriba` (borde superior) o `y` (centro), `w` (default 780; post 560; carpeta 640).
  Suenan solos: papel al entrar, click al pegar, ding al instalar, tic en la voz, bloop por mensaje, tic por captura en la carpeta.
- Efectos en `render/sfx/` (`sfx`/`archivo` sin `.wav`): papel, papel_arruga, papel_desliza, lapiz, plumon, sello, boing, bloop, chirrido,
  bocina, silbato_sube, silbato_baja, tic, sparkle, rewind, typing, pop1, pop2, whoosh1, swoosh1, click1, ding1. El volumen de cada uno ya
  está calibrado en `render.ts` (`BANCO`). Boing, silbatos, bocina, chirrido, papel_arruga, papel_desliza y lápiz son sintetizados con ffmpeg.

## Archivos

```
edicion-notitas-f100k/
├── SKILL.md
├── package.json                      al instalar corre scripts/preparar.mjs (motor de render)
├── references/BIBLIA-DE-ESTILO.md    medidas de la referencia y el porqué de cada regla
├── scripts/                          preparar.mjs · corte_fino.py · quitar.py · auditar.py · revisar_uniones.py · dividida.py
├── escenas/                          hornear.mjs · render.mjs · escenas.html · ejemplo-config.js · letras/ (OFL)
└── render/
    ├── src/Notitas.tsx               la composición (cámara, degradado, gancho, notitas, stickers, láminas, subtítulo, efectos)
    ├── src/Mockup.tsx                mockups de lo que se nombra: prompt, guion, skill, nota de voz, chat, carpeta, post publicado
    ├── src/Lamina.tsx                lámina de papel: trazo a mano quieto, fotos con cinta, flujo/lista/mockup/comparar
    ├── src/tipos.ts                  props ya resueltas
    ├── scripts/render.ts             PLAN.json → props → BORRADOR_NOTITAS.mp4 (+ reporte de ritmo)
    └── sfx/                          efectos
```

## Errores conocidos

| Síntoma | Causa | Arreglo |
|---|---|---|
| `[warn] no encontré «…»` | la frase no está igual en el transcript (Whisper escribió «Cloud») | usa otra frase o `t` |
| el zoom «parpadea» | `cortes.json` viejo (de antes de un recorte a mano) | regenera `cortes.json` con los puntos de unión reales |
| texto ilegible en techo blanco | fondo claro | sube `tamano`, baja `y` a una zona más oscura o usa `color: blanco` |
| un item del mockup aparece desde el inicio o una línea del guion nunca se escribe | la frase de `tiempos_en` se dijo antes o no se dice después de que entra la tarjeta (se busca DESDE la entrada) | usa una frase que caiga dentro del mockup o un número (segundos absolutos) |
| `mockup …: no entraba en el cuadro, la subo` | tarjeta alta (prompt largo, post) | normal: se sube y el subtítulo se apaga mientras dura; si tapa la cara, acorta el texto o baja `w` |
| `se nombra «…» y no hay mockup` | el guion dice prompt/skill/voz/carpeta/guion y solo hay logo o emoji | agrega el mockup de ese tipo en esa frase |
| un paso se teclea encima del anterior («2. tusegu una carpeta») | pasos de la lista en la misma `x`/`y` con `hasta` = el siguiente (lote 3: 7012 y 7011) | acumular en diagonal (un paso cada ~95 px, mismo `hasta`) o, si no caben, `hasta` = inicio del siguiente − 0,15 s. Nunca dos textos en la misma posición a la vez |
| lámina `mockup`/`comparar` con capturas chicas y papel vacío | tamaño por defecto (540 px el celular, 380 la columna) | campo opcional `ancho` en la lámina (21-oct); `tenue: true` en `comparar` muestra las columnas apagadas en vez de vacías |
| `Top-level await… cjs` | falta `render/package.json` con `"type": "module"` | restaurarlo |
