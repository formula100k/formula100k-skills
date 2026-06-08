---
name: motion-youtube-f100k
description: "Agrega motion graphics estilo Softgirlnocode a videos de YouTube (16:9 horizontal). Analiza un frame del video para detectar la posición del sujeto y calcular zonas seguras de overlay, transcribe con Supadata (URL) o Whisper (archivo local), auto-clasifica el contenido del guión para proponer el tipo de overlay correcto (antes/ahora → comparison card, listas → chapter card, herramientas → UI card, identidad → pills), genera HTML/GSAP con HyperFrames posicionado en las zonas libres del frame con animaciones fluidas, renderiza en 1920×1080 y compone sobre el video original con ffmpeg. Activar cuando: 'agrega motion graphics a este video de YouTube', 'overlays para YouTube', 'motion graphics 16:9', 'edita este video de YouTube', 'quiero overlays como Softgirlnocode en horizontal'. Output: $CARPETA/video_final_motion.mp4"
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

# Motion Graphics para YouTube — FÓRMULA 100K

Pipeline: analizar sujeto → transcripción → auto-clasificar guión → motion board → HTML/GSAP (HyperFrames) → render → composición ffmpeg.

Formato: **1920×1080 (16:9)** a 30fps. Los overlays se posicionan en las zonas libres del frame detectadas automáticamente.

---

## Cuándo activar

- "agrega motion graphics a este video de YouTube"
- "overlays para YouTube", "motion graphics 16:9", "horizontal"
- "edita este video de YouTube con IA"
- "quiero overlays como Softgirlnocode" (en video horizontal)
- Cualquier video > 1 minuto que el usuario quiera publicar en YouTube

## NO activar para

- Videos 9:16 (reels/shorts) → usar `motion-reels-f100k`
- Edición de silencios/muletillas → usar `editor-video-formula100k`
- Carruseles estáticos → `carrusel-render-formula100k`
- Solo transcripción → `transcripcion-youtube-formula100k`

---

## Onboarding — Primera vez

```bash
node --version  # debe mostrar v22+
# Si es menor: brew install node@22 && brew link node@22 --force
npm install -g hyperframes
hyperframes --version   # debe mostrar 0.6.x
hyperframes doctor      # Chrome y FFmpeg deben aparecer con ✓
# Si ffmpeg falta: brew install ffmpeg
```

---

## Paso 1 — Recibir el video fuente

El usuario puede dar:
- **URL de YouTube**: `https://www.youtube.com/watch?v=...`
- **Archivo local**: `/ruta/al/video.mp4` o `.mov`

```
AskUserQuestion:
"¿El video es una URL de YouTube o un archivo local?"
Opciones: ["URL de YouTube", "Archivo local en mi Mac"]
```

Definir variables:
- `$VIDEO_SRC` — la URL o ruta
- `$DEST` — carpeta de trabajo (misma que el archivo, o `~/Desktop/yt-motion-$(date +%Y%m%d)/` si es URL)
- `$OUTPUT` — `$DEST/video_final_motion.mp4`

---

## Paso 1.5 — Analizar posición del sujeto en el frame

**Determina las zonas seguras del frame. Obligatorio antes de generar HTML.**

Extraer un frame representativo:

```bash
# Si es archivo local:
DURATION=$(ffprobe -v error -show_entries format=duration \
  -of default=nokey=1:noprint_wrappers=1 "$VIDEO_SRC")
MIDPOINT=$(python3 -c "print(round($DURATION * 0.5, 2))")
ffmpeg -ss $MIDPOINT -i "$VIDEO_SRC" -vframes 1 -q:v 2 /tmp/frame_sujeto.jpg 2>/dev/null

# Si es URL de YouTube, descargar primero un segmento corto:
yt-dlp -x --skip-download --write-thumbnail -o /tmp/yt_thumb "$VIDEO_SRC" && \
  mv /tmp/yt_thumb.* /tmp/frame_sujeto.jpg 2>/dev/null || \
  echo "Usar thumbnail del video como referencia visual"
```

Usar `Read` en `/tmp/frame_sujeto.jpg` para ver la imagen y determinar:

| Variable | Pregunta | Valores |
|----------|----------|---------|
| `SUBJECT_X` | ¿En qué zona horizontal está el sujeto? | `left` / `center` / `right` |
| `SUBJECT_Y` | ¿Qué zona vertical ocupa el sujeto? | `upper` / `full` / `lower` |

**Mapa de zonas seguras para 1920×1080 según posición del sujeto:**

```
┌──────────────────────────────────────────────────┐  y=0
│  PILL ZONE: top-left (60px, 60px)                │  y=0–140px
├──────────────┬───────────────────┬───────────────┤
│  LEFT SIDE   │   CARA / TORSO    │  RIGHT SIDE   │
│  x=0–400px   │   (no tapar)      │  x=1380–1920  │
│              │   x=400–1380px    │               │
├──────────────┴───────────────────┴───────────────┤
│  BOTTOM ZONE: 850–1000px (disponible si no hay   │
│  subtítulos — zona bajo el pecho)                │
└──────────────────────────────────────────────────┘  y=1080
```

**Valores CSS por configuración del sujeto:**

```
SUBJECT_X=center, SUBJECT_Y=full (talking-head clásico):
  SAFE_PILL_CSS  = "top: 60px; left: 60px;"
  SAFE_CARD_CSS  = "bottom: 80px; right: 80px; width: 700px;"
  SAFE_FLOAT_CSS = "top: 50%; right: 120px; transform: translateY(-50%);"

SUBJECT_X=right (sujeto a la derecha):
  SAFE_PILL_CSS  = "top: 60px; left: 60px;"
  SAFE_CARD_CSS  = "top: 50%; left: 60px; width: 640px; transform: translateY(-50%);"
  SAFE_FLOAT_CSS = "top: 50%; left: 60px; width: 640px; transform: translateY(-50%);"

SUBJECT_X=left (sujeto a la izquierda):
  SAFE_PILL_CSS  = "top: 60px; right: 60px;"
  SAFE_CARD_CSS  = "top: 50%; right: 60px; width: 640px; transform: translateY(-50%);"
  SAFE_FLOAT_CSS = "top: 50%; right: 120px; width: 580px; transform: translateY(-50%);"

SUBJECT_Y=lower (sujeto en mitad inferior):
  SAFE_PILL_CSS  = "top: 60px; left: 60px;"
  SAFE_CARD_CSS  = "top: 80px; left: 60px; width: 700px;"
  SAFE_FLOAT_CSS = "top: 160px; right: 80px; width: 560px;"
```

Guardar `SAFE_PILL_CSS`, `SAFE_CARD_CSS`, `SAFE_FLOAT_CSS` para usar en el Paso 5.

---

## Paso 2 — Transcribir con timestamps

### Si es URL de YouTube (Supadata API):

```bash
curl -s "https://api.supadata.ai/v1/transcript?url=$VIDEO_SRC&lang=es" \
  -H "x-api-key: sd_8ff1f1f233fc19cb14b5b86277ae2d6b" \
  > "$DEST/raw_transcript.json"

python3 -c "
import json
with open('$DEST/raw_transcript.json') as f:
    data = json.load(f)
content = data.get('content', [])
segments = [{'text': item['text'], 'start_ms': item['offset'], 'end_ms': item['offset'] + item['duration']} for item in content]
with open('$DEST/transcript.json', 'w') as f:
    json.dump(segments, f, indent=2, ensure_ascii=False)
text = ' '.join(s['text'] for s in segments)
print(text)
" | tee "$DEST/transcript.txt"
```

### Si es archivo local (Whisper):

```bash
ffmpeg -i "$VIDEO_SRC" -vn -acodec mp3 -ar 16000 -ac 1 -y /tmp/motion_audio.mp3

uvx --from mlx-whisper mlx_whisper /tmp/motion_audio.mp3 \
  --model mlx-community/whisper-large-v3-mlx \
  --language es \
  --word-timestamps True \
  --output-format json \
  --output-dir /tmp

python3 - << 'EOF'
import json, os
basename = os.path.splitext(os.path.basename('/tmp/motion_audio.mp3'))[0]
with open(f'/tmp/{basename}.json') as f:
    data = json.load(f)
segments = [{'text': s['text'].strip(), 'start_ms': int(s['start']*1000), 'end_ms': int(s['end']*1000)}
            for s in data.get('segments', [])]
with open('$DEST/transcript.json', 'w') as f:
    json.dump(segments, f, indent=2, ensure_ascii=False)
print(' '.join(s['text'] for s in segments))
EOF
```

---

## Paso 3 — Presentar transcript y auto-clasificar contenido

Mostrar transcript formateado en bloques de 10-15 segundos.

**Luego auto-clasificar el contenido del guión** detectando patrones:

| Patrón en el texto | Tipo de overlay sugerido |
|-------------------|--------------------------|
| "antes/ahora", "era/ahora", "solía/hoy", "pasé de X a Y" | Comparison Card BEFORE/NOW |
| "el primero/segundo", "paso 1/2/3", "número uno", lista de 3+ items | Chapter Card con bullets |
| Menciona herramientas: "Claude", "ChatGPT", "Canva", "Notion", apps | Floating UI Card |
| "no soy", "nunca fui", "no uso", "desde cero", "sin saber" | Pill Labels (identidad) |
| "soy", "logré", "ahora soy", "me convertí" | Pill Labels (transformación) |
| Números con K/M/%, métricas de negocio | Comparison Card o Pill con stat |

Generar **motion board automático preliminar** y mostrarlo:

```
📊 AUTO-DETECCIÓN DEL GUIÓN:
──────────────────────────────────────────────────────────────
t=00:08  →  PILL LABELS    "sin código / sin equipo / desde cero"
             (detectado: "desde cero, sin saber nada")
t=01:24  →  FLOATING UI    Claude Code — herramienta detectada
             (detectado: "uso Claude Code para...")
t=03:45  →  COMPARISON     ANTES: 3 horas / AHORA: 20 minutos
             (detectado: "me tomaba 3 horas, ahora son 20 minutos")
t=08:10  →  CHAPTER CARD   "Los 4 pasos del sistema"
             (detectado: "el primero... el segundo... el tercero... el cuarto")
──────────────────────────────────────────────────────────────
Zonas: PILLS → top-left (60px), CARDS → bottom-right (700px)
[basado en sujeto centrado detectado en Paso 1.5]
```

Luego preguntar con `AskUserQuestion`:

```
"¿El plan de overlays te encaja o quieres ajustar algo?
 También puedes agregar, quitar o cambiar el texto de cualquier overlay."
Opciones: ["Generar tal cual", "Ajustar algunos", "Creative direction manual completa"]
```

---

## Paso 4 — Generar Motion Board definitivo

Crear `$DEST/motion_board.json` resolviendo cada overlay al timestamp correcto:

```python
import json

def find_keyword_time(transcript, keyword):
    keyword_lower = keyword.lower()
    for seg in transcript:
        if keyword_lower in seg['text'].lower():
            return seg['start_ms']
    return None

with open('$DEST/transcript.json') as f:
    transcript = json.load(f)

# Motion board (definido por auto-clasificación + ajustes del usuario)
motion_board = []
# ... resolver timestamps para cada overlay

with open('$DEST/motion_board.json', 'w') as f:
    json.dump(motion_board, f, indent=2, ensure_ascii=False)
```

---

## Paso 5 — Generar HTML HyperFrames (1920×1080)

Generar `$DEST/overlays/index.html` con TODOS los overlays. Usar las variables `SAFE_*_CSS` del Paso 1.5 en lugar de posiciones hardcodeadas.

### Estructura base

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: transparent; width: 1920px; height: 1080px; overflow: hidden; }
  .clip { position: absolute; }
</style>
</head>
<body>
<div id="stage" data-composition-id="yt-motion"
     data-start="0" data-width="1920" data-height="1080">

  <!-- OVERLAYS aquí — ver templates abajo -->

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });

    // ANIMACIONES aquí en orden cronológico

    window.__timelines = window.__timelines || {};
    window.__timelines["yt-motion"] = tl;
  </script>
</div>
</body>
</html>
```

---

## Templates 16:9 con animaciones fluidas

Las posiciones usan `SAFE_PILL_CSS`, `SAFE_CARD_CSS`, `SAFE_FLOAT_CSS` del Paso 1.5.
Todos los templates incluyen entrada Y salida animada.

---

### Template 1 — Pill Labels Flotantes (16:9)

Tags oscuros apilados verticalmente. Posición determinada por `SAFE_PILL_CSS`.

**Cuándo usar:** identidad, estado anterior, características del avatar.

```html
<div id="pills-{id}" class="clip"
     data-start="{start_s}" data-duration="{dur_s}" data-track-index="{track}"
     style="position: absolute; SAFE_PILL_CSS; display: flex; flex-direction: column; gap: 14px;">
  <span class="pill-{id}" style="
    background: rgba(17,17,17,0.92);
    color: #fff;
    padding: 12px 28px;
    border-radius: 999px;
    font: 700 28px/1.2 'Inter', sans-serif;
    letter-spacing: -0.02em;
    opacity: 0;
    white-space: nowrap;
    backdrop-filter: blur(8px);
  ">LABEL_1</span>
  <span class="pill-{id}" style="
    background: rgba(17,17,17,0.92);
    color: #fff;
    padding: 12px 28px;
    border-radius: 999px;
    font: 700 28px/1.2 'Inter', sans-serif;
    letter-spacing: -0.02em;
    opacity: 0;
    white-space: nowrap;
    backdrop-filter: blur(8px);
  ">LABEL_2</span>
</div>
```

```js
// Pill labels — spring entrada, fade+slide salida
const pillItems_{id} = document.querySelectorAll('.pill-{id}');

tl.from(pillItems_{id}, {
  y: 22,
  opacity: 0,
  duration: 0.48,
  ease: "back.out(1.3)",
  stagger: 0.16
}, {start_s} + 0.08);

tl.to(pillItems_{id}, {
  y: -18,
  opacity: 0,
  duration: 0.38,
  ease: "power2.in",
  stagger: 0.08
}, {start_s} + {dur_s} - 0.5);
```

---

### Template 2 — Comparison Card BEFORE/NOW (16:9)

Card oscura con paneles ANTES/AHORA. Posición por `SAFE_CARD_CSS`.

**Cuándo usar:** transformaciones, resultados, antes/después.

```html
<div id="comp-{id}" class="clip"
     data-start="{start_s}" data-duration="{dur_s}" data-track-index="{track}"
     style="position: absolute; SAFE_CARD_CSS;
            background: #111; border-radius: 16px; padding: 24px; opacity: 0;">
  <div style="color: #888; font: 700 13px/1 'Inter',sans-serif;
              letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px;">
    {CARD_TITLE}
  </div>
  <div style="display: flex; gap: 0; align-items: stretch;">
    <div id="comp-before-{id}" style="
      flex: 1; background: #1a1a1a; border-radius: 12px 0 0 12px;
      padding: 16px; display: flex; flex-direction: column; gap: 8px;">
      <span style="color: #555; font: 700 11px/1 'Inter',sans-serif;
                   text-transform: uppercase; letter-spacing: 0.08em;">ANTES</span>
      <span style="color: #999; font: 600 20px/1.3 'Inter',sans-serif;">{BEFORE_TEXT}</span>
    </div>
    <div style="width: 2px; background: #333;"></div>
    <div id="comp-now-{id}" style="
      flex: 1; background: #f97316; border-radius: 0 12px 12px 0;
      padding: 16px; display: flex; flex-direction: column; gap: 8px;">
      <span style="color: rgba(0,0,0,0.5); font: 700 11px/1 'Inter',sans-serif;
                   text-transform: uppercase; letter-spacing: 0.08em;">AHORA</span>
      <span style="color: #000; font: 600 20px/1.3 'Inter',sans-serif;">{NOW_TEXT}</span>
    </div>
  </div>
</div>
```

```js
// Comparison card — slide desde el borde más cercano + fade
// Ajustar x vs y según la zona:
//   zona right → from x: 40   |   zona bottom → from y: 32   |   zona left → from x: -40
tl.to("#comp-{id}", {
  opacity: 1,
  x: 0,       // o y: 0 si viene de abajo/arriba
  duration: 0.5,
  ease: "expo.out"
}, {start_s} + 0.1);

tl.from(["#comp-before-{id}", "#comp-now-{id}"], {
  opacity: 0,
  x: -12,
  duration: 0.35,
  ease: "power2.out",
  stagger: 0.18
}, {start_s} + 0.4);

// Salida
tl.to("#comp-{id}", {
  opacity: 0,
  x: 20,     // o y: 16 si zona vertical
  duration: 0.4,
  ease: "power2.in"
}, {start_s} + {dur_s} - 0.5);
```

---

### Template 3 — Floating UI Card (16:9)

Card con borde azul simulando una interfaz. Posición por `SAFE_FLOAT_CSS`.

**Cuándo usar:** mostrar herramientas, workflows de IA, pantallas de apps.

```html
<div id="ui-{id}" class="clip"
     data-start="{start_s}" data-duration="{dur_s}" data-track-index="{track}"
     style="position: absolute; SAFE_FLOAT_CSS;
            width: 420px; opacity: 0; transform: scale(0.88);">
  <div style="
    background: #0f0f0f;
    border: 2px solid #3b82f6;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 0 40px rgba(59,130,246,0.2);
    font-family: 'Inter', sans-serif;
  ">
    <div style="
      display: flex; align-items: center; gap: 8px;
      padding: 14px 18px; border-bottom: 1px solid #222;
      background: #111827;
    ">
      <div style="width:12px;height:12px;border-radius:50%;background:#ef4444;"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#f59e0b;"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:#22c55e;"></div>
      <span style="color:#888;font-size:13px;margin-left:8px;">{UI_TITLE}</span>
    </div>
    <div style="padding: 18px; color: #e5e5e5; font-size: 15px; line-height: 1.6; font-family: monospace;">
      {UI_CONTENT}
    </div>
  </div>
  <p style="
    margin-top: 16px; color: #fff;
    font: 600 18px/1.3 'Inter',sans-serif;
    text-align: center;
  ">{UI_CAPTION}</p>
</div>
```

```js
// Floating UI card — spring scale al entrar, shrink al salir
tl.to("#ui-{id}", {
  opacity: 1,
  scale: 1,
  duration: 0.52,
  ease: "back.out(1.4)"
}, {start_s} + 0.12);

tl.to("#ui-{id}", {
  opacity: 0,
  scale: 0.9,
  duration: 0.38,
  ease: "power2.in"
}, {start_s} + {dur_s} - 0.5);
```

---

### Template 4 — Chapter Summary Card (16:9)

Card blanca con lista de bullets. Posición por `SAFE_CARD_CSS` o centrada.

**Cuándo usar:** listar secciones, resumir puntos clave, introducir estructura del video.

```html
<div id="summary-{id}" class="clip"
     data-start="{start_s}" data-duration="{dur_s}" data-track-index="{track}"
     style="position: absolute; SAFE_CARD_CSS;
            background: #fff; border-radius: 20px; padding: 32px 40px;
            min-width: 480px; opacity: 0;
            box-shadow: 0 24px 64px rgba(0,0,0,0.4);">
  <div style="color: #666; font: 700 13px/1 'Inter',sans-serif;
              text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 20px;">
    {SECTION_TITLE}
  </div>
  <ul style="list-style: none; padding: 0; margin: 0;
             display: flex; flex-direction: column; gap: 12px;">
    <li class="sum-item-{id}" style="
      display: flex; align-items: center; gap: 12px;
      color: #111; font: 500 18px/1.3 'Inter',sans-serif;
      opacity: 0;">
      <span style="width:8px;height:8px;background:#f59e0b;border-radius:50%;flex-shrink:0;"></span>
      {ITEM_1}
    </li>
    <li class="sum-item-{id}" style="
      display: flex; align-items: center; gap: 12px;
      color: #111; font: 500 18px/1.3 'Inter',sans-serif;
      opacity: 0;">
      <span style="width:8px;height:8px;background:#f59e0b;border-radius:50%;flex-shrink:0;"></span>
      {ITEM_2}
    </li>
    <!-- Agregar más .sum-item-{id} según necesario -->
  </ul>
</div>
```

```js
// Summary card — fade + slide, luego stagger de items
tl.to("#summary-{id}", {
  opacity: 1,
  x: 0,       // ajustar según zona de entrada
  duration: 0.5,
  ease: "power3.out"
}, {start_s} + 0.1);

const sumItems_{id} = document.querySelectorAll('.sum-item-{id}');
tl.to(sumItems_{id}, {
  opacity: 1,
  x: 0,
  duration: 0.32,
  ease: "power2.out",
  stagger: 0.12
}, {start_s} + 0.38);

tl.to("#summary-{id}", {
  opacity: 0,
  x: 20,
  duration: 0.38,
  ease: "power2.in"
}, {start_s} + {dur_s} - 0.5);
```

---

## Reglas de animación — siempre aplicar

1. **Entrada: `gsap.from()` o `gsap.to()` desde estado inicial** → posición CSS es el estado visible.
2. **Salida: `gsap.to()` hacia invisible** → colocar 0.45-0.6s antes del final del clip.
3. **Dirección de entrada según zona:**
   - Zona right → `from: {x: 40}` (viene de la derecha)
   - Zona left → `from: {x: -40}` (viene de la izquierda)
   - Zona bottom → `from: {y: 32}` (viene de abajo)
   - Zona top → `from: {y: -28}` (viene de arriba)
   - Floating → `from: {scale: 0.88}` (crece)
4. **Eases por tipo:**
   - Cards amplias → `expo.out` / `power3.out` entrada; `power2.in` salida
   - UI cards flotantes → `back.out(1.4)` entrada (spring); `power2.in` salida
   - Pill labels → `back.out(1.3)` entrada; `power2.in` salida
5. **Stagger:** 0.12-0.18s entre pills, 0.12-0.15s entre items de lista.
6. **Offset de entrada:** primer tween mínimo `START_S + 0.08`, nunca exactamente en `START_S`.
7. **No repetir el mismo ease** en todos los overlays del mismo video — variar.

---

## Asignación de data-track-index

- Pill labels: 10, 11, 12...
- Comparison cards: 20, 21, 22...
- UI cards: 30, 31, 32...
- Chapter cards: 40, 41, 42...

---

## Paso 6 — Preview y render

```bash
mkdir -p "$DEST/overlays"
# [escribir index.html en $DEST/overlays/index.html]

cd "$DEST/overlays"
npx hyperframes preview   # verificar en browser

# Render WebM con alpha (recomendado)
hyperframes render --format webm --resolution landscape -o "$DEST/overlays/overlays.webm"

# Alternativa sin alpha
hyperframes render --resolution landscape -o "$DEST/overlays/overlays.mp4"
```

---

## Paso 7 — Composición final con ffmpeg

### Con alpha (WebM transparente, recomendado):
```bash
ffmpeg -i "$VIDEO_SRC" -i "$DEST/overlays/overlays.webm" \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto" \
  -c:v libx264 -crf 18 -preset fast \
  -c:a copy \
  -movflags +faststart \
  "$OUTPUT"
```

### Si el video fuente no es 1920×1080:
```bash
VIDEO_W=$(ffprobe -v quiet -select_streams v:0 \
  -show_entries stream=width -of csv=p=0 "$VIDEO_SRC")
VIDEO_H=$(ffprobe -v quiet -select_streams v:0 \
  -show_entries stream=height -of csv=p=0 "$VIDEO_SRC")

ffmpeg -i "$VIDEO_SRC" -i "$DEST/overlays/overlays.webm" \
  -filter_complex \
    "[1:v]scale=${VIDEO_W}:${VIDEO_H}[ov]; [0:v][ov]overlay=0:0:format=auto" \
  -c:v libx264 -crf 18 -preset fast \
  -c:a copy \
  "$OUTPUT"
```

---

## Paso 8 — Verificación

```bash
open "$OUTPUT"
```

Checklist:
- [ ] Pill labels no tapan la cara del speaker (verificado con zonas del Paso 1.5)
- [ ] Cards están en zona segura detectada
- [ ] UI cards tienen borde azul visible
- [ ] Animaciones de entrada Y salida fluidas — no abruptas
- [ ] Duración de cada overlay suficiente para leer el texto
- [ ] Audio del video original intacto

---

## Iteración rápida

1. Editar `$DEST/overlays/index.html`
2. Re-renderizar: `hyperframes render --format webm --resolution landscape -o $DEST/overlays/overlays.webm`
3. Re-componer con ffmpeg

---

## Errores frecuentes

| Error | Causa | Fix |
|-------|-------|-----|
| `hyperframes: command not found` | No instalado o Node < 22 | `npm install -g hyperframes` |
| Supadata retorna 404 | Video privado | Descarga local + Whisper |
| Overlay no aparece en el tiempo correcto | Keyword no en transcript | Usar timestamp literal en segundos |
| Video final sin audio | ffmpeg no copió el stream | Agregar `-c:a copy` al comando |
| GSAP no anima (overlay estático) | `window.__timelines` no configurado | Verificar bloque `window.__timelines` al final del script |
| Frame de análisis vacío (URL) | yt-dlp sin thumbnail | Extraer thumbnail manualmente o usar frame 0.25 del video |

---

## Estructura de archivos generados

```
$DEST/
├── raw_transcript.json     ← respuesta cruda de Supadata
├── transcript.json         ← [{text, start_ms, end_ms}] normalizado
├── transcript.txt          ← texto plano legible
├── motion_board.json       ← overlays con timestamps resueltos
├── overlays/
│   ├── index.html          ← composición HyperFrames completa
│   └── overlays.webm       ← render transparente de overlays
└── video_final_motion.mp4  ← OUTPUT FINAL

/tmp/
└── frame_sujeto.jpg        ← frame para análisis de posición (temporal)
```

---

## Diferencias con motion-reels-f100k

| Aspecto | motion-reels-f100k | motion-youtube-f100k |
|---------|-------------------|----------------------|
| Formato | 1080×1920 (9:16) | 1920×1080 (16:9) |
| Detección sujeto | Frame análisis 9:16 | Frame análisis 16:9 |
| Speaker zone | Centro vertical del frame | Centro horizontal del frame |
| Zona PILL segura | Top (0-160px) | Top-corner (60px, 60px) |
| Zona CARD segura | Bottom (1500px+) | Side opuesto al sujeto |
| Zona FLOAT segura | Lateral opuesto al sujeto | Side opuesto al sujeto |
| Duración típica | 30-90s (reel) | 5-15 min (YouTube) |
| Número de overlays | 3-8 | 5-20 |
