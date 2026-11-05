---
name: pizarra-youtube-f100k
description: "Pizarras para grabar videos de YouTube. Convierte una o varias fuentes (entrevista, podcast o charla en YouTube) en una PIZARRA 16:9 de pizarrón blanco con plumones para grabar el video: una lámina por bloque, cada una con CAPTURAS REALES sacadas de la fuente, el minuto de donde sale, lo que la persona dice debajo y una pestaña de Guion completo con avisos de qué confirmar. Es una página HTML (pantalla completa, flechas para pasar) que se abre con doble clic o se publica como Artifact. Activar con 'hazme la pizarra para el video de YouTube', 'pizarra como la de Mosseri', 'pizarra como la de Hormozi', 'arma la pizarra de esta entrevista', 'pizarra para grabar', o un link de YouTube con intención de explicarlo a cámara. NO es un clip animado de pizarra para un reel."
argument-hint: "[links de YouTube o guion existente] [opcional: CTA / regalo]"
allowed-tools: Bash, Read, Write, Edit, Artifact, AskUserQuestion, Glob, Grep
---

# Pizarra para YouTube

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

La skill trae dos piezas terminadas en `ejemplos/`:
- `ceo-instagram_mosseri.html`: video largo de noticias (15 láminas, 1 fuente).
- `tu-fabrica_hormozi-gary-jobs.html`: video corto con 3 fuentes y 4 pasos (11 láminas).
(Las capturas `img/` de los ejemplos no vienen: las láminas se ven con el hueco de la foto. Sirven como patrón del código.)

**El diseño no se toca:** pizarrón blanco 16:9, Permanent Marker para títulos, Caveat para la letra a mano y Atkinson para la página, rojo, azul y verde de plumón, amarillo para resaltar, círculos (`.circ`), tachados (`.strike`) y resaltados (`.hl`) a mano. Se cambian solo los datos. Si la persona quiere su color, cambia `--yellow` (el resaltado) por el acento de su `mi-marca.md`; lo demás se queda.

## Reglas que no se rompen
1. **Cada lámina lleva al menos una captura real de la fuente** (fotograma del video, pantalla que mostraron, página del regalo). Una pizarra solo con texto no sirve.
2. **La lámina 2 es «de dónde sale»:** quién habla, canal, fecha, duración, con su captura. En un video corto puede ser opcional (decirlo en el aviso).
3. **Cada lámina dice el minuto de la fuente** (`min: 'Gary · min 18:00'`), para que la persona pueda verificar.
4. **Las citas entre comillas son textuales** (traducidas) de la transcripción. Si es paráfrasis, sin comillas.
5. **Cifras solo de la fuente y atribuidas.** Si una cifra suena a error de transcripción, no se usa y va al aviso.
6. **Guion simple:** gancho con resultado y cifra real, nada de frases puente («Pero antes…», «Ya sé, suena…»), de 2 a 4 pasos, CTA a mitad y al cierre, sin jerga técnica. Tutea, español neutro.
7. **No se avanza sin revisar las láminas como imagen** (paso 6).

## Paso 0 · Lo de la persona
- **Negocio y regalo del CTA:** `~/Documents/mi-contenido/mi-negocio.md`. Si no existe o no dice qué regalo tiene, pregunta. Nunca inventes un regalo ni un link.
- **Marca:** `~/Documents/mi-contenido/mi-marca.md` (solo para el color de resaltado). Si no existe, se usa el amarillo de la plantilla.
- **Carpeta del proyecto:** `~/Documents/mis-animaciones/pizarra-<slug>/` en Mac y `~/mis-animaciones/pizarra-<slug>/` en Windows.

## Flujo

Scripts en `scripts/` (Node, iguales en Mac y Windows; usan yt-dlp, ffmpeg y Chrome). `SK` = la carpeta de esta skill, `P` = la del proyecto.

**1. Base del contenido.** Si la persona ya tiene guion o artículo, parte de ahí. Si no, el guion sale de la fuente con las reglas de arriba.

**2. Bajar las fuentes.**
`node "$SK/scripts/bajar.mjs" "$P" <id1> <id2>…` (o los links enteros) → `vid/` con el video, `info.json` (título, canal, fecha, duración) y `<id>.txt` con bloques de 20 s y su minuto. Si YouTube da 429 en los subtítulos, espera y repite. Lee las transcripciones completas.
Si un video no tiene subtítulos, transcríbelo en la computadora: `node "$SK/scripts/sistema.mjs" transcribir "$P/vid/<id>.mp4" "$P/vid" --txt` (la primera vez baja el modelo; para tener los minutos usa el JSON sin `--txt`).

**3. Mapa de láminas.** Una por bloque del guion: gancho → de dónde sale → noticias o pasos → CTA → cierre «qué haces tú». Para cada una, anota el minuto de la fuente y qué captura la prueba.

**4. Cazar las capturas.**
- `node "$SK/scripts/hoja.mjs" <video> <inicio> <paso> <salida.jpg>`: 20 cuadros en una hoja; el cuadro k es inicio + k×paso. Léela con Read.
- `node "$SK/scripts/subs.mjs" <video> <inicio> <segundos> <salida.jpg>`: si el video tiene subtítulos quemados, encuentra el medio segundo exacto de la frase.
- `node "$SK/scripts/cuadro.mjs" <video> <segundo> "$P/img/<nombre>.jpg"`: la captura final a 1280 px.
- `node "$SK/scripts/captura-web.mjs" <url> "$P/img/<nombre>.jpg"`: la página del regalo o un perfil.
Prefiere: la cara de quien habla diciendo la frase, los gráficos y textos que mostró el propio video, y la pantalla real de lo que se nombra. Si la fuente es solo audio, se usa su pantalla (ej.: el iPod de Jobs). Nada de emojis ni stock.

**5. Armar el HTML.** Copia `templates/pizarra.html` a `$P/pizarra.html` y llena `{{TITULO_CORTO}}` (2 a 4 palabras), `{{TITULO}}`, `{{QUIEN}}`, `{{AVISOS}}`, `{{FUENTES}}` y `{{LAMINAS}}`. Para las láminas, copia los patrones de `ejemplos/`:
- `split` (texto a la izquierda, 1 o 2 capturas a la derecha; `sm` para la segunda más chica),
- `trio` con `step` numerados (3 capturas en fila),
- `phones` para capturas verticales,
- `box`, `list`, `quote`, `facts`, `tag`, `ARROW` y `MONO()` (monito con su fábrica, para «todas iguales»).
Clases de la captura: `plain` (sin recortar, para gráficos o pantallas con texto), `left` / `right` (si el texto quemado queda a un lado), `big`.
Títulos largos: baja el tamaño con `style="font-size:6.4cqw"` en vez de usar `h-xl`.

**6. Revisar como imagen.** `node "$SK/scripts/revisar.mjs" "$P/pizarra.html" <n_laminas> "$P/revision"` → hojas de 6 láminas. Léelas con Read y corrige: texto que se sale del borde, captura que corta el texto quemado (usa `left`/`right`/`plain`), columna vacía, cita que no está en la transcripción. Repite hasta que estén limpias. Borra `_shots/` al terminar.

**7. Entregar.**
- La pizarra vive en `$P/pizarra.html` con su carpeta `img/`: se abre con doble clic (`node "$SK/scripts/sistema.mjs" abrir "$P/pizarra.html"`).
- Si la persona la quiere en línea: Artifact con `file_path` = el HTML, `root` = su carpeta, `files` = solo las `img/*.jpg` que se usan, `icon: "pencil"`. Para cambios, vuelve a publicar el mismo `file_path` (mismo link).
- Entrega la lista de láminas en una línea cada una, los cambios al guion y lo que hay que confirmar antes de grabar.

## EN TU COMPU
- **Negocio y regalo:** `~/Documents/mi-contenido/mi-negocio.md`. **Marca** (color de resaltado, opcional): `~/Documents/mi-contenido/mi-marca.md`. Si no existen, se pregunta.
- **Proyectos:** `~/Documents/mis-animaciones/pizarra-<slug>/` en Mac y `~/mis-animaciones/pizarra-<slug>/` en Windows.
- **Programas:** Node 18+, yt-dlp, ffmpeg y Google Chrome. `uv` solo si hay que transcribir un video sin subtítulos (mlx-whisper en Mac con chip Apple, faster-whisper en Windows y Mac Intel). Sin `package.json`: no hay que correr `npm install`.
- **Internet:** para bajar las fuentes y para que la pizarra cargue sus letras (Google Fonts).
- **Mac y Windows:** todos los scripts son `.mjs` y se corren con `node`; `scripts/sistema.mjs` encuentra Chrome en cada sistema.
- **Sin pagos:** nada de esta skill cobra.
