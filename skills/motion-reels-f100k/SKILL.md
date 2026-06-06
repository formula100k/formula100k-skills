---
name: motion-reels-f100k
description: "Agrega motion graphics estilo Softgirlnocode a un reel 9:16 (talking-head). Pipeline completo: recibe video local (.mov/.mp4) o URL de YouTube, transcribe word-level (Supadata si es YouTube, Whisper local si es archivo), muestra el transcript, pide creative direction al usuario (qué mostrar y cuándo), genera HTML/CSS/GSAP con HyperFrames para los 4 templates del estilo (pill labels flotantes, comparison card BEFORE/NOW, floating UI card, chapter/summary card), renderiza con npx hyperframes render → MP4 con alpha, y compone sobre el video original con ffmpeg. Output: video_final_motion.mp4 en la misma carpeta del video fuente. Activar cuando el usuario diga: 'agrega motion graphics a este reel', 'motion graphics 9:16', 'overlays animados reel', 'estilo softgirlnocode', 'agrégale animaciones al video', 'quiero motion graphics para este talking-head'."
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

# Motion Reels F100K — Overlays Animados Estilo Softgirlnocode

Pipeline completo para agregar motion graphics animados sobre un reel 9:16 de talking-head. La filosofía de Softgirlnocode: el texto que dices en cámara SE MATERIALIZA en pantalla como overlays flotantes, cards comparativas y resúmenes visuales — el video se vuelve su propio teleprompter visual.

## Cuándo activar

Cuando el usuario:
- Dice "agrega motion graphics a este reel" / "motion graphics 9:16"
- Dice "overlays animados" / "estilo softgirlnocode"
- Pasa un video local o URL de YouTube y pide animaciones / overlays sobre el talking-head
- Quiere que el video tenga cards, labels, comparaciones animadas

## NO activar para

- Videos horizontales 16:9 → usar `editor-video-formula100k` con HyperFrames
- Carruseles → usar `carrusel-render-formula100k`
- Stories fullscreen → usar `historias-a-imagenes-nanobanana`
- Motion graphics sueltos sin video base → usar `graficos-de-video-formula100k`

## Requisitos previos

```bash
# Node >= 22
node --version

# HyperFrames CLI
npx hyperframes --version

# ffmpeg (macOS con Homebrew)
brew install ffmpeg

# Python + mlx-whisper (solo para archivos locales, Apple Silicon)
brew install uv
# uso: uvx --from mlx-whisper mlx_whisper ...
```

---

## Pipeline completo (7 pasos)

### Paso 1 — Recibir el video fuente

Preguntar al usuario si no lo especificó:

```
AskUserQuestion:
  "¿Cuál es el video fuente?"
  Opciones:
  - Ruta local: /Users/.../mi_reel.mp4
  - URL de YouTube: https://youtu.be/...
  - URL de Instagram Reel: https://www.instagram.com/reel/...
```

Detectar el tipo:
- Si empieza con `http` → fuente remota (Supadata o yt-dlp para descarga)
- Si es ruta local → archivo local (Whisper)

```bash
# Verificar que el archivo existe y es video
file "$VIDEO_PATH"
ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "$VIDEO_PATH"
```

Guardar:
- `VIDEO_PATH` = ruta absoluta al archivo
- `VIDEO_DIR` = carpeta del video (output irá aquí)
- `VIDEO_NAME` = nombre sin extensión

---

### Paso 2 — Transcribir con word-level timestamps

#### Fuente remota (YouTube / Instagram / TikTok) → Supadata API

```bash
# Supadata devuelve timestamps word-level directamente
curl -s "https://api.supadata.ai/v1/transcript?url=ENCODED_URL&lang=es" \
  -H "x-api-key: sd_8ff1f1f233fc19cb14b5b86277ae2d6b" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
# Normalizar a formato interno [{text, start, end}, ...]
words = []
for seg in data.get('content', []):
    words.append({'text': seg['text'], 'start': seg['offset']/1000, 'end': (seg['offset']+seg['duration'])/1000})
print(json.dumps(words, ensure_ascii=False, indent=2))
" > /tmp/motion_transcript.json
```

Si Supadata no devuelve word-level (Instagram sin timestamps), descargar con yt-dlp y pasar a Whisper:

```bash
yt-dlp -x --audio-format mp3 -o /tmp/motion_audio "$URL"
```

#### Fuente local → mlx-whisper (Apple Silicon)

```bash
# Extraer audio
ffmpeg -i "$VIDEO_PATH" -vn -acodec mp3 -ar 16000 -ac 1 -y /tmp/motion_audio.mp3

# Transcribir con timestamps word-level
uvx --from mlx-whisper mlx_whisper /tmp/motion_audio.mp3 \
  --model mlx-community/whisper-large-v3-mlx \
  --language es \
  --word-timestamps True \
  --output-format json \
  --output-dir /tmp

# Normalizar JSON a formato interno
python3 - << 'EOF'
import json
with open('/tmp/motion_audio.json') as f:
    data = json.load(f)
words = []
for seg in data['segments']:
    for w in seg.get('words', []):
        words.append({'text': w['word'].strip(), 'start': w['start'], 'end': w['end']})
with open('/tmp/motion_transcript.json', 'w') as f:
    json.dump(words, f, ensure_ascii=False, indent=2)
print(f"Transcripción: {len(words)} palabras")
EOF
```

Alternativa si `uvx` no está disponible: usar `npx hyperframes transcribe` (HyperFrames incluye Whisper):

```bash
npx hyperframes transcribe /tmp/motion_audio.mp3 --model small --language es
# Genera transcript.json en el mismo directorio
```

---

### Paso 3 — Mostrar transcript y pedir creative direction

Leer `/tmp/motion_transcript.json`. Agrupar las palabras en líneas de ~8-12 palabras para legibilidad. Mostrar el transcript completo formateado con timestamps en bloques de 5-10 segundos:

```
[00:00 - 00:05] "Hoy te voy a contar los 3 errores que yo..."
[00:05 - 00:12] "...cometía cuando empecé a crear contenido en redes..."
[00:12 - 00:20] "El primero es publicar sin estrategia..."
...
```

Luego preguntar con `AskUserQuestion`:

```
"Perfecto, tengo la transcripción. Ahora necesito tu creative direction.
¿Qué quieres que aparezca visualmente en el video?

Tienes 4 estilos de overlay disponibles:
1. PILL LABELS — tags flotantes oscuros con texto blanco (esquina superior izquierda)
   Ejemplo: 'no soy diseñadora', 'era terrible en esto'
   Ideal para: describir el estado anterior, labels de identidad, negaciones

2. COMPARISON CARD — card BEFORE/NOW anclada al bottom del frame
   Muestra: título del contraste + miniatura del antes + highlight naranja del ahora
   Ideal para: mostrar transformación, antes/después, resultados

3. FLOATING UI CARD — card con borde azul flotando en el centro
   Muestra: mockup de interfaz / pantalla / herramienta con texto descriptivo
   Ideal para: mostrar una herramienta, un proceso, una pantalla de app

4. CHAPTER CARD — card blanca sobre fondo warm con lista de items
   Muestra: bullet points de resumen / pasos / lo que vas a aprender
   Ideal para: introducir secciones, listar beneficios, recap de puntos

Para cada overlay que quieras, dime:
- ¿Qué tipo (1/2/3/4)?
- ¿En qué momento del video? (puedes decir un timestamp o citar las palabras exactas que dices)
- ¿Qué texto va adentro?

Ejemplo de creative direction:
'En el segundo 3, cuando digo «no soy diseñadora», pon 3 pill labels: «no soy diseñadora», «no uso Figma», «empecé desde cero». Luego en el segundo 15, cuando digo «ahora mis reels llegan a 500K», pon una comparison card con BEFORE: 200 seguidores / NOW: 500K alcance. Al final en el segundo 45, pon un chapter card con los 3 pasos que expliqué.'
"
```

Guardar la creative direction como `CREATIVE_DIRECTION` para el siguiente paso.

---

### Paso 4 — Generar el Motion Board (mapa de overlays → timestamps)

Procesar la creative direction y el transcript para construir el motion board: lista ordenada de overlays con timestamps exactos.

Para cada overlay mencionado:
1. Si el usuario dio un timestamp exacto → usar ese directamente
2. Si citó palabras del video → buscar en `/tmp/motion_transcript.json` la primera ocurrencia de esas palabras y usar ese `start`

Generar `MOTION_BOARD` como JSON:

```json
[
  {
    "type": "pill_labels",
    "start": 2.8,
    "duration": 3.5,
    "labels": ["no soy diseñadora", "no uso Figma", "empecé desde cero"]
  },
  {
    "type": "comparison_card",
    "start": 14.2,
    "duration": 5.0,
    "title": "Mi transformación",
    "before_text": "200 seguidores",
    "before_label": "ANTES",
    "now_text": "500K alcance",
    "now_label": "AHORA"
  },
  {
    "type": "chapter_card",
    "start": 44.1,
    "duration": 6.0,
    "title": "Los 3 pasos que usé",
    "items": ["Elegir una sola plataforma", "Publicar 30 días seguidos", "Usar IA para los guiones"]
  }
]
```

Guardar en `/tmp/motion_board.json`.

Mostrar el motion board al usuario en formato legible y confirmar antes de generar:

```
AskUserQuestion:
  "Este es el mapa de overlays que voy a animar:
  [mostrar motion board formateado]

  ¿Generamos el HTML con estas animaciones o quieres ajustar algo?"
  Opciones: "Generar tal cual" / "Ajustar"
```

---

### Paso 5 — Generar HTML con HyperFrames

Obtener la duración total del video:

```bash
ffprobe -v error -show_entries format=duration \
  -of default=nokey=1:noprint_wrappers=1 "$VIDEO_PATH"
```

Crear la carpeta del proyecto HyperFrames:

```bash
MOTION_DIR="$VIDEO_DIR/motion_overlays"
mkdir -p "$MOTION_DIR"
```

Generar `$MOTION_DIR/index.html` a partir del motion board. Leer cada overlay del JSON y componer el HTML usando los 4 templates de referencia (sección abajo). Reglas de composición:

- El stage es 1080×1920 (9:16) sin video de fondo — solo los overlays sobre fondo transparente
- Cada overlay tiene `data-start`, `data-duration`, `data-track-index` único
- Usar tracks índice 10+ para no colisionar con posibles clips de video
- Todos los overlays coexisten en la misma composición, sincronizados por timestamp

Estructura general del index.html:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: transparent; overflow: hidden; }
    /* Fuente Inter de Google Fonts — el compiler la embede */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  </style>
</head>
<body>
  <div id="stage"
       data-composition-id="motion-overlays"
       data-start="0"
       data-width="1080"
       data-height="1920">

    <!-- OVERLAYS generados del motion board aquí -->
    <!-- Ver templates de referencia abajo para cada tipo -->

    <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
    <script>
      const tl = gsap.timeline({ paused: true });

      // ANIMACIONES generadas del motion board aquí
      // Ver sección de cada template para las animaciones

      window.__timelines = window.__timelines || {};
      window.__timelines["motion-overlays"] = tl;
    </script>
  </div>
</body>
</html>
```

Escribir el archivo HTML completo con todos los overlays del motion board usando los templates de referencia de la sección siguiente.

---

### Paso 6 — Preview y render del HTML

```bash
cd "$MOTION_DIR"

# Preview en browser (opcional, para iterar)
npx hyperframes preview

# Render → MP4 con alpha (fondo transparente)
npx hyperframes render index.html --out overlays.mp4
```

Si el render falla, revisar:
- `npx hyperframes lint` → errores de sintaxis
- `npx hyperframes validate` → problemas de composición
- Que `data-track-index` no se repita entre clips del mismo track

---

### Paso 7 — Componer sobre el video original con ffmpeg

```bash
OUTPUT="$VIDEO_DIR/${VIDEO_NAME}_motion.mp4"

ffmpeg \
  -i "$VIDEO_PATH" \
  -i "$MOTION_DIR/overlays.mp4" \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto" \
  -c:v libx264 -crf 18 -preset slow \
  -c:a copy \
  -y "$OUTPUT"

echo "✓ Output: $OUTPUT"
open "$VIDEO_DIR"
```

Si el video fuente no tiene audio separado del overlay (es un archivo local con audio embedido), el `-c:a copy` preserva el audio original intacto.

Si el overlay `.mp4` tiene canal alpha (VP9/WebM del render), usar:

```bash
ffmpeg \
  -i "$VIDEO_PATH" \
  -i "$MOTION_DIR/overlays.webm" \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto[outv]" \
  -map "[outv]" -map 0:a? \
  -c:v libx264 -crf 18 -preset slow \
  -c:a copy \
  -y "$OUTPUT"
```

Confirmar al usuario con la ruta del output.

---

## Templates de referencia — Los 4 estilos Softgirlnocode

Los templates van en el bloque del HTML generado. Cada uno incluye el HTML del elemento y el bloque GSAP de animación. Las posiciones son para stage 1080×1920.

---

### Template 1 — Pill Labels Flotantes

Tags oscuros con texto blanco, pill shape, esquina superior izquierda, fade-in con stagger.
Aparecen en la zona superior del frame (top: 120-320px) sin tapar la cara del talking-head.

**Cuándo usar:** describir el estado anterior, labels de identidad negativa/positiva, características del avatar.

**HTML (reemplazar `TRACK_IDX`, `START_S`, `DUR_S`, `LABEL_1..N`, `COMP_ID`):**

```html
<!-- PILL LABELS: insertar dentro del div data-composition-id -->
<div id="pills-COMP_ID"
     data-start="START_S"
     data-duration="DUR_S"
     data-track-index="TRACK_IDX"
     style="
       position: absolute;
       top: 140px;
       left: 56px;
       display: flex;
       flex-direction: column;
       align-items: flex-start;
       gap: 16px;
       opacity: 0;
     ">
  <span class="pill" style="
    background: #111111;
    color: #ffffff;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 34px;
    line-height: 1;
    padding: 18px 36px;
    border-radius: 999px;
    white-space: nowrap;
    display: inline-block;
    letter-spacing: -0.5px;
  ">LABEL_1</span>

  <span class="pill" style="
    background: #111111;
    color: #ffffff;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 34px;
    line-height: 1;
    padding: 18px 36px;
    border-radius: 999px;
    white-space: nowrap;
    display: inline-block;
    letter-spacing: -0.5px;
  ">LABEL_2</span>

  <!-- Agregar más <span class="pill"> por cada label adicional -->
</div>
```

**GSAP (agregar al timeline, reemplazar `COMP_ID`, `START_S`):**

```js
// Pill labels — fade in del wrapper + stagger de cada pill
const pillsEl = document.getElementById("pills-COMP_ID");
const pills = pillsEl ? pillsEl.querySelectorAll('.pill') : [];
tl.to(pillsEl, { opacity: 1, duration: 0 }, START_S);
tl.from(pills, {
  y: 20,
  opacity: 0,
  duration: 0.45,
  ease: "power3.out",
  stagger: 0.18
}, START_S + 0.08);
```

---

### Template 2 — Comparison Card BEFORE/NOW

Card oscura anclada al bottom del frame. Aparece en el tercio inferior (bottom: 180px). Muestra el contraste antes/ahora con un highlight naranja en el lado "now".

**Cuándo usar:** transformaciones, resultados, antes/después, prueba de cambio.

**HTML:**

```html
<!-- COMPARISON CARD: insertar dentro del div data-composition-id -->
<div id="compcard-COMP_ID"
     data-start="START_S"
     data-duration="DUR_S"
     data-track-index="TRACK_IDX"
     style="
       position: absolute;
       bottom: 200px;
       left: 56px;
       right: 56px;
       background: #1a1a1a;
       border-radius: 24px;
       padding: 32px 36px;
       display: flex;
       flex-direction: column;
       gap: 20px;
       opacity: 0;
       transform: translateY(40px);
     ">
  <!-- Título -->
  <p style="
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 28px;
    color: #888888;
    text-transform: uppercase;
    letter-spacing: 2px;
  ">CARD_TITLE</p>

  <!-- Contenedor antes/ahora -->
  <div style="display: flex; gap: 16px;">
    <!-- BEFORE -->
    <div style="
      flex: 1;
      background: #2a2a2a;
      border-radius: 16px;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    ">
      <span style="
        font-family: 'Inter', sans-serif;
        font-weight: 900;
        font-size: 18px;
        color: #555555;
        text-transform: uppercase;
        letter-spacing: 2px;
      ">BEFORE</span>
      <span style="
        font-family: 'Inter', sans-serif;
        font-weight: 700;
        font-size: 32px;
        color: #999999;
        line-height: 1.1;
      ">BEFORE_TEXT</span>
    </div>

    <!-- NOW (highlight naranja) -->
    <div style="
      flex: 1;
      background: #f97316;
      border-radius: 16px;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    ">
      <span style="
        font-family: 'Inter', sans-serif;
        font-weight: 900;
        font-size: 18px;
        color: rgba(0,0,0,0.5);
        text-transform: uppercase;
        letter-spacing: 2px;
      ">NOW</span>
      <span style="
        font-family: 'Inter', sans-serif;
        font-weight: 700;
        font-size: 32px;
        color: #000000;
        line-height: 1.1;
      ">NOW_TEXT</span>
    </div>
  </div>
</div>
```

**GSAP:**

```js
// Comparison card — slide up + fade in
tl.to("#compcard-COMP_ID", {
  opacity: 1,
  y: 0,
  duration: 0.55,
  ease: "expo.out"
}, START_S + 0.1);
```

---

### Template 3 — Floating UI Card

Card con borde azul highlight flotando en el centro del frame. Muestra un mockup de interfaz / pantalla de app con texto descriptivo. Posición central (top: 600-900px según duración del video).

**Cuándo usar:** mostrar una herramienta, un proceso, una pantalla, un workflow de IA.

**HTML:**

```html
<!-- FLOATING UI CARD: insertar dentro del div data-composition-id -->
<div id="uicard-COMP_ID"
     data-start="START_S"
     data-duration="DUR_S"
     data-track-index="TRACK_IDX"
     style="
       position: absolute;
       top: 680px;
       left: 56px;
       right: 56px;
       opacity: 0;
       transform: scale(0.92) translateY(24px);
     ">
  <!-- Card principal con borde azul -->
  <div style="
    background: #0f1117;
    border: 2px solid #3b82f6;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 0 40px rgba(59,130,246,0.25), 0 20px 60px rgba(0,0,0,0.5);
  ">
    <!-- Header de la UI card (barra superior simulada) -->
    <div style="
      background: #1e2333;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid #2a3040;
    ">
      <div style="width:12px;height:12px;border-radius:50%;background:#ff5f57;"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#febc2e;"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#28c840;"></div>
      <span style="
        margin-left: 12px;
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 20px;
        color: #6b7280;
      ">UI_HEADER_LABEL</span>
    </div>

    <!-- Contenido principal del mockup -->
    <div style="padding: 32px 28px;">
      <!-- Fila de "código" o contenido simulado -->
      <div style="
        background: #1a1f2e;
        border-radius: 12px;
        padding: 24px;
        font-family: 'Inter', monospace;
        font-size: 24px;
        color: #a5b4fc;
        line-height: 1.6;
      ">UI_CONTENT_LINE_1
<span style="color:#6b7280;">UI_CONTENT_LINE_2</span>
<span style="color:#34d399;">UI_CONTENT_LINE_3</span></div>
    </div>
  </div>

  <!-- Texto descriptivo debajo de la card -->
  <p style="
    margin-top: 20px;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 30px;
    color: #ffffff;
    text-align: center;
    padding: 0 20px;
    line-height: 1.3;
  ">UI_DESCRIPTION_TEXT</p>
</div>
```

**GSAP:**

```js
// Floating UI card — scale up + fade in
tl.to("#uicard-COMP_ID", {
  opacity: 1,
  scale: 1,
  y: 0,
  duration: 0.6,
  ease: "back.out(1.4)"
}, START_S + 0.12);
```

---

### Template 4 — Chapter / Summary Card

Card blanca sobre fondo warm (beige/crema). Lista de items con bullets. Se ancla en la zona central-inferior del frame, ideal para introducir secciones o recapitular puntos.

**Cuándo usar:** listar lo que vas a enseñar, resumir los puntos clave, introducir el estructura del video.

**HTML:**

```html
<!-- CHAPTER CARD: insertar dentro del div data-composition-id -->
<div id="chaptercard-COMP_ID"
     data-start="START_S"
     data-duration="DUR_S"
     data-track-index="TRACK_IDX"
     style="
       position: absolute;
       top: 720px;
       left: 56px;
       right: 56px;
       background: #faf7f2;
       border-radius: 28px;
       padding: 40px 40px 44px;
       box-shadow: 0 24px 64px rgba(0,0,0,0.35);
       opacity: 0;
       transform: translateY(36px);
     ">
  <!-- Título de la card -->
  <p style="
    font-family: 'Inter', sans-serif;
    font-weight: 900;
    font-size: 32px;
    color: #1a1a1a;
    margin-bottom: 28px;
    line-height: 1.2;
  ">CHAPTER_TITLE</p>

  <!-- Lista de items -->
  <div style="display: flex; flex-direction: column; gap: 18px;">
    <div class="chapter-item" style="display: flex; align-items: flex-start; gap: 16px;">
      <span style="
        width: 36px; height: 36px; min-width: 36px;
        background: #1a1a1a;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Inter', sans-serif;
        font-weight: 800; font-size: 18px;
        color: #ffffff;
      ">1</span>
      <span style="
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 28px;
        color: #2d2d2d;
        line-height: 1.3;
        padding-top: 2px;
      ">ITEM_1</span>
    </div>

    <div class="chapter-item" style="display: flex; align-items: flex-start; gap: 16px;">
      <span style="
        width: 36px; height: 36px; min-width: 36px;
        background: #1a1a1a;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Inter', sans-serif;
        font-weight: 800; font-size: 18px;
        color: #ffffff;
      ">2</span>
      <span style="
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 28px;
        color: #2d2d2d;
        line-height: 1.3;
        padding-top: 2px;
      ">ITEM_2</span>
    </div>

    <!-- Agregar más items con el mismo patrón, cambiando el número -->
  </div>
</div>
```

**GSAP:**

```js
// Chapter card — slide up + fade, luego stagger en cada item
const chapterItems = document.querySelectorAll("#chaptercard-COMP_ID .chapter-item");
tl.to("#chaptercard-COMP_ID", {
  opacity: 1,
  y: 0,
  duration: 0.5,
  ease: "power3.out"
}, START_S + 0.1);
tl.from(chapterItems, {
  x: -20,
  opacity: 0,
  duration: 0.4,
  ease: "power2.out",
  stagger: 0.15
}, START_S + 0.35);
```

---

## Generación automática del HTML completo

Cuando se generan múltiples overlays del motion board, el agente construye UN solo archivo `index.html` con todos los elementos. Las reglas de asignación de `data-track-index`:

- Pill labels: track 10, 11, 12... (uno por aparición)
- Comparison cards: track 20, 21, 22...
- UI cards: track 30, 31, 32...
- Chapter cards: track 40, 41, 42...

El timeline GSAP concatena todos los bloques de animación de cada overlay. El orden en el timeline es cronológico por `START_S`.

### Ejemplo de HTML completo con 2 overlays

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: transparent; overflow: hidden; }
  </style>
</head>
<body>
  <div id="stage"
       data-composition-id="motion-overlays"
       data-start="0"
       data-width="1080"
       data-height="1920">

    <!-- OVERLAY 1: Pill labels en t=2.8s -->
    <div id="pills-01"
         data-start="2.8"
         data-duration="3.5"
         data-track-index="10"
         style="position:absolute;top:140px;left:56px;display:flex;flex-direction:column;align-items:flex-start;gap:16px;opacity:0;">
      <span class="pill" style="background:#111;color:#fff;font-family:'Inter',sans-serif;font-weight:700;font-size:34px;padding:18px 36px;border-radius:999px;white-space:nowrap;">no soy diseñadora</span>
      <span class="pill" style="background:#111;color:#fff;font-family:'Inter',sans-serif;font-weight:700;font-size:34px;padding:18px 36px;border-radius:999px;white-space:nowrap;">no uso Figma</span>
      <span class="pill" style="background:#111;color:#fff;font-family:'Inter',sans-serif;font-weight:700;font-size:34px;padding:18px 36px;border-radius:999px;white-space:nowrap;">empecé desde cero</span>
    </div>

    <!-- OVERLAY 2: Chapter card en t=14.2s -->
    <div id="chaptercard-01"
         data-start="14.2"
         data-duration="6.0"
         data-track-index="40"
         style="position:absolute;top:720px;left:56px;right:56px;background:#faf7f2;border-radius:28px;padding:40px;box-shadow:0 24px 64px rgba(0,0,0,0.35);opacity:0;transform:translateY(36px);">
      <p style="font-family:'Inter',sans-serif;font-weight:900;font-size:32px;color:#1a1a1a;margin-bottom:28px;">Los 3 pasos que usé</p>
      <div style="display:flex;flex-direction:column;gap:18px;">
        <div class="chapter-item" style="display:flex;align-items:flex-start;gap:16px;">
          <span style="width:36px;height:36px;min-width:36px;background:#1a1a1a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;font-weight:800;font-size:18px;color:#fff;">1</span>
          <span style="font-family:'Inter',sans-serif;font-weight:600;font-size:28px;color:#2d2d2d;line-height:1.3;padding-top:2px;">Elegir una sola plataforma</span>
        </div>
        <div class="chapter-item" style="display:flex;align-items:flex-start;gap:16px;">
          <span style="width:36px;height:36px;min-width:36px;background:#1a1a1a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;font-weight:800;font-size:18px;color:#fff;">2</span>
          <span style="font-family:'Inter',sans-serif;font-weight:600;font-size:28px;color:#2d2d2d;line-height:1.3;padding-top:2px;">Publicar 30 días seguidos</span>
        </div>
        <div class="chapter-item" style="display:flex;align-items:flex-start;gap:16px;">
          <span style="width:36px;height:36px;min-width:36px;background:#1a1a1a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;font-weight:800;font-size:18px;color:#fff;">3</span>
          <span style="font-family:'Inter',sans-serif;font-weight:600;font-size:28px;color:#2d2d2d;line-height:1.3;padding-top:2px;">Usar IA para los guiones</span>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
    <script>
      const tl = gsap.timeline({ paused: true });

      // Overlay 1 — Pill labels t=2.8
      const pills01 = document.getElementById("pills-01");
      const pillItems01 = pills01 ? pills01.querySelectorAll('.pill') : [];
      tl.to(pills01, { opacity: 1, duration: 0 }, 2.8);
      tl.from(pillItems01, { y: 20, opacity: 0, duration: 0.45, ease: "power3.out", stagger: 0.18 }, 2.88);

      // Overlay 2 — Chapter card t=14.2
      const chapterItems01 = document.querySelectorAll("#chaptercard-01 .chapter-item");
      tl.to("#chaptercard-01", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 14.3);
      tl.from(chapterItems01, { x: -20, opacity: 0, duration: 0.4, ease: "power2.out", stagger: 0.15 }, 14.65);

      window.__timelines = window.__timelines || {};
      window.__timelines["motion-overlays"] = tl;
    </script>
  </div>
</body>
</html>
```

---

## Composición final con ffmpeg — referencia completa

### Caso estándar: video con audio, overlays opacos

```bash
ffmpeg \
  -i "$VIDEO_PATH" \
  -i "$MOTION_DIR/overlays.mp4" \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto[outv]" \
  -map "[outv]" \
  -map "0:a?" \
  -c:v libx264 -crf 18 -preset slow \
  -c:a aac -b:a 192k \
  -y "$OUTPUT"
```

### Caso con alpha channel (WebM del render HyperFrames)

HyperFrames puede renderizar en WebM con canal alpha. En ese caso la composición respeta la transparencia del fondo del overlay:

```bash
ffmpeg \
  -i "$VIDEO_PATH" \
  -i "$MOTION_DIR/overlays.webm" \
  -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg];[bg][1:v]overlay=0:0:format=auto[outv]" \
  -map "[outv]" \
  -map "0:a?" \
  -c:v libx264 -crf 18 -preset slow \
  -c:a aac -b:a 192k \
  -y "$OUTPUT"
```

### Si el video fuente no es 1080×1920 (9:16)

Escalar primero:

```bash
ffmpeg \
  -i "$VIDEO_PATH" \
  -i "$MOTION_DIR/overlays.mp4" \
  -filter_complex \
    "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[scaled];
     [scaled][1:v]overlay=0:0:format=auto[outv]" \
  -map "[outv]" -map "0:a?" \
  -c:v libx264 -crf 18 -preset slow \
  -c:a aac -b:a 192k \
  -y "$OUTPUT"
```

---

## Iteración

**Cambiar el texto de un overlay:**
1. Editar el elemento HTML en `motion_overlays/index.html`
2. Re-correr `npx hyperframes render`
3. Re-correr el comando ffmpeg de composición

**Mover el timestamp de un overlay:**
1. Cambiar `data-start` en el HTML del elemento
2. Cambiar el tiempo correspondiente en el bloque GSAP del timeline
3. Re-render y re-componer

**Agregar un overlay nuevo:**
1. Pegar el template HTML del tipo deseado con un nuevo `COMP_ID` y `data-track-index` único
2. Agregar el bloque GSAP correspondiente al timeline
3. Re-render y re-componer

**Preview rápido sin re-componer:**
```bash
cd "$MOTION_DIR" && npx hyperframes preview
```

---

## Errores y fallbacks

| Error | Acción |
|-------|--------|
| Supadata devuelve 401 | Verificar API key en la URL: `sd_8ff1f1f233fc19cb14b5b86277ae2d6b` |
| Supadata devuelve timestamps vacíos | El video puede ser privado. Descargar con yt-dlp y usar Whisper local |
| `uvx` no encontrado | `brew install uv` y reintentar |
| Whisper produce alucinaciones | Re-correr con `--temperature 0.2` o usar modelo `medium` |
| `npx hyperframes render` falla con timeline error | Verificar que todos los `window.__timelines["motion-overlays"]` están registrados y que ningún `data-track-index` se repite |
| ffmpeg: "No such file" en overlays.mp4 | El render no completó. Verificar que `npx hyperframes render` terminó sin errores |
| Video final con overlays desfasados | Verificar que los timestamps en `data-start` corresponden al video original (no al recortado si se cortó silencios antes) |
| HyperFrames no disponible (Node < 22) | Actualizar Node: `brew install node@22 && brew link node@22` |

---

## Estructura de archivos generados

```
$VIDEO_DIR/
├── mi_reel.mp4                    ← video original (no se modifica)
├── mi_reel_motion.mp4             ← OUTPUT FINAL
└── motion_overlays/
    ├── index.html                 ← composición HyperFrames generada
    └── overlays.mp4               ← overlays renderizados (fondo transparente)

/tmp/
├── motion_audio.mp3               ← audio extraído (temporal)
├── motion_transcript.json         ← transcript word-level normalizado
└── motion_board.json              ← mapa de overlays → timestamps
```

---

## Diferencias con otras skills

| Aspecto | motion-reels-f100k | editor-video-formula100k | graficos-de-video |
|---------|-------------------|--------------------------|-------------------|
| Input | Video hablado local o URL | Video + MANIFEST.md | Video local |
| Output | Video final con overlays animados | BORRADOR_AUTO.mp4 | Imágenes PNG scrapbook |
| Motion graphics | HTML/GSAP/HyperFrames | Remotion + HyperFrames opcional | Higgsfield static |
| Corte de silencios | No (trabaja sobre el video original) | Sí (agresivo) | No |
| Transcripción | Word-level para sincronía de overlays | Word-level para keyword matching | Por segmentos |
| Estilo visual | Softgirlnocode — dark cards + pills + UI mockups | FÓRMULA 100K — header + énfasis + b-roll | Scrapbook crema F100K |
