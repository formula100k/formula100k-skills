---
name: motion-youtube-f100k
description: "Agrega motion graphics estilo Softgirlnocode a videos de YouTube (16:9 horizontal). Transcribe el video con Supadata (URL) o Whisper (archivo local), presenta el transcript y pide creative direction, genera HTML/GSAP con Hyperframes para los overlays (pill labels flotantes, comparison cards BEFORE/NOW, floating UI cards, chapter summary cards), renderiza en 1920×1080 y compone sobre el video original con ffmpeg. Activar cuando: 'agrega motion graphics a este video de YouTube', 'overlays para YouTube', 'motion graphics 16:9', 'edita este video de YouTube', 'quiero overlays como Softgirlnocode en horizontal'. Output: $CARPETA/video_final_motion.mp4"
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

# Motion Graphics para YouTube — FÓRMULA 100K

Pipeline: transcripción → motion board → HTML/GSAP (Hyperframes) → render → composición ffmpeg.

Formato: **1920×1080 (16:9)** a 30fps. Overlays se anclan por keyword del transcript.

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

## Prerequisitos

```bash
node --version   # necesita Node >= 22
ffmpeg -version  # necesita ffmpeg
npx hyperframes --version  # primera vez descarga via npx
```

Si falta ffmpeg en macOS: `brew install ffmpeg`

---

## Paso 1 — Recibir el video fuente

El usuario puede dar:
- **URL de YouTube**: `https://www.youtube.com/watch?v=...`
- **Archivo local**: `/ruta/al/video.mp4` o `.mov`

Confirmar antes de continuar:
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

## Paso 2 — Transcribir con timestamps

### Si es URL de YouTube (Supadata API):

```bash
curl -s "https://api.supadata.ai/v1/transcript?url=$VIDEO_SRC&lang=en" \
  -H "x-api-key: sd_8ff1f1f233fc19cb14b5b86277ae2d6b" \
  > "$DEST/raw_transcript.json"
```

Extraer texto limpio con timestamps:
```bash
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
# Instalar si no existe
command -v mlx_whisper || pip install mlx-whisper  # macOS Apple Silicon
# En Intel Mac / Linux: pip install openai-whisper

mlx_whisper "$VIDEO_SRC" \
  --output-format json \
  --output-dir "$DEST" \
  --word-timestamps
# Genera $DEST/$(basename $VIDEO_SRC .mp4).json
```

Normalizar a formato común `[{text, start_ms, end_ms}]`:
```bash
python3 -c "
import json, sys, os
basename = os.path.splitext(os.path.basename('$VIDEO_SRC'))[0]
with open('$DEST/' + basename + '.json') as f:
    data = json.load(f)
segments = [{'text': s['text'].strip(), 'start_ms': int(s['start']*1000), 'end_ms': int(s['end']*1000)}
            for s in data.get('segments', [])]
with open('$DEST/transcript.json', 'w') as f:
    json.dump(segments, f, indent=2, ensure_ascii=False)
print(' '.join(s['text'] for s in segments))
"
```

Si Whisper local no está disponible, intentar Supadata como fallback (puede fallar con archivos locales — en ese caso avisar al usuario que suba el video a YouTube como Unlisted primero).

---

## Paso 3 — Presentar transcript y pedir creative direction

Mostrar el transcript formateado al usuario:

```
📝 TRANSCRIPT OBTENIDO ($(wc -w < $DEST/transcript.txt) palabras)

$(head -50 $DEST/transcript.txt)
[... continúa]

---
¿Qué motion graphics quieres agregar? Puedo crear:

🏷️  PILL LABELS — etiquetas oscuras flotantes (esquina superior)
   Ejemplo: "Producido con Claude Code" aparece cuando dices "workflow"
   
📊  COMPARISON CARD — BEFORE/NOW dividido en el centro
   Ejemplo: muestra transformación cuando llegas al segmento de resultados
   
💻  FLOATING UI CARD — interfaz flotante con borde azul
   Ejemplo: muestra la pantalla de Claude mientras hablas de él
   
📋  CHAPTER SUMMARY CARD — card blanca con lista de puntos
   Ejemplo: resumen al final de cada sección del video

Dime en lenguaje natural qué quieres y en qué momento del video.
```

Usar `AskUserQuestion` o esperar input libre. El usuario puede decir:
- "Agrega un pill label 'sin código' cuando digo 'no necesitas programar'"
- "Quiero una comparison card cuando llego a los resultados"
- "Pon una UI card mostrando Claude Code cuando menciono el workflow"

---

## Paso 4 — Generar Motion Board

Crear `$DEST/motion_board.json` resolviendo cada overlay al timestamp correcto:

```python
# motion_board.py
import json

def find_keyword_time(transcript, keyword):
    """Busca keyword en el transcript y retorna el timestamp en ms."""
    keyword_lower = keyword.lower()
    for seg in transcript:
        if keyword_lower in seg['text'].lower():
            return seg['start_ms']
    return None

# Cargar transcript
with open('$DEST/transcript.json') as f:
    transcript = json.load(f)

# Motion board definido por el usuario (ejemplo):
overlays_raw = [
    {"type": "pill", "text": "Producido con Claude Code", "keyword": "workflow", "duration_ms": 4000},
    {"type": "comparison", "before": "3 horas editando", "after": "20 minutos", "keyword": "resultados", "duration_ms": 6000},
]

# Resolver timestamps
motion_board = []
for overlay in overlays_raw:
    t = find_keyword_time(transcript, overlay['keyword'])
    if t is not None:
        overlay['start_ms'] = t
        overlay['end_ms'] = t + overlay['duration_ms']
        motion_board.append(overlay)
    else:
        print(f"[warn] keyword '{overlay['keyword']}' no encontrada en transcript")

with open('$DEST/motion_board.json', 'w') as f:
    json.dump(motion_board, f, indent=2, ensure_ascii=False)

print(f"Motion board generado: {len(motion_board)} overlays")
```

---

## Paso 5 — Generar HTML Hyperframes (1920×1080)

Generar `$DEST/overlays/index.html` con TODOS los overlays del motion board.

### Dimensiones 16:9: `data-width="1920" data-height="1080"`

### TEMPLATE 1 — Pill Label (dark floating tag)

```html
<!-- Pill Label: texto oscuro, esquina superior izquierda -->
<div class="pill clip" id="pill-{id}"
     style="position:absolute; top:60px; left:60px;"
     data-start="{start_s}" data-duration="{duration_s}" data-track-index="{track}">
  {texto}
</div>

<style>
.pill {
  background: rgba(17,17,17,0.88);
  color: #fff;
  padding: 10px 24px;
  border-radius: 999px;
  font: 700 28px/1.2 'Inter', sans-serif;
  letter-spacing: -0.02em;
  opacity: 0;
  transform: translateY(12px);
  white-space: nowrap;
  backdrop-filter: blur(8px);
}
</style>

<script>
tl.to("#pill-{id}", { opacity:1, y:0, duration:0.35, ease:"power2.out" }, {start_s})
  .to("#pill-{id}", { opacity:0, duration:0.25 }, {start_s} + {duration_s} - 0.3);
</script>
```

Para múltiples pill labels apilados: incrementar `top` por 70px cada uno.

### TEMPLATE 2 — Comparison Card BEFORE/NOW (16:9 optimizada)

```html
<!-- Comparison Card: anclada al centro-derecho del frame -->
<div class="comp-card clip" id="comp-{id}"
     style="position:absolute; bottom:80px; right:80px; width:700px;"
     data-start="{start_s}" data-duration="{duration_s}" data-track-index="{track}">
  <div class="comp-title">TRANSFORMACIÓN</div>
  <div class="comp-panels">
    <div class="comp-before">
      <span class="comp-label">ANTES</span>
      <span class="comp-text">{before_text}</span>
    </div>
    <div class="comp-divider"></div>
    <div class="comp-after">
      <span class="comp-label">AHORA</span>
      <span class="comp-text">{after_text}</span>
    </div>
  </div>
</div>

<style>
.comp-card {
  background: #111;
  border-radius: 16px;
  padding: 24px;
  opacity: 0;
  transform: translateX(40px);
  font-family: 'Inter', sans-serif;
}
.comp-title {
  color: #888;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 16px;
}
.comp-panels {
  display: flex;
  align-items: stretch;
  gap: 0;
}
.comp-before, .comp-after {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}
.comp-before { background: #1a1a1a; border-radius: 12px 0 0 12px; }
.comp-after { background: #1a2a1a; border-radius: 0 12px 12px 0; }
.comp-divider { width: 2px; background: #333; }
.comp-label {
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase;
}
.comp-before .comp-label { color: #666; }
.comp-after .comp-label { color: #4ade80; }
.comp-text { color: #fff; font-size: 18px; font-weight: 600; line-height: 1.3; }
</style>

<script>
tl.to("#comp-{id}", { opacity:1, x:0, duration:0.5, ease:"power3.out" }, {start_s})
  .to("#comp-{id}", { opacity:0, duration:0.3 }, {start_s} + {duration_s} - 0.35);
</script>
```

### TEMPLATE 3 — Floating UI Card (interfaz flotante con borde azul)

```html
<!-- UI Card: flota en el centro-derecho, simula una interfaz -->
<div class="ui-card clip" id="ui-{id}"
     style="position:absolute; top:50%; right:120px; transform:translateY(-50%);"
     data-start="{start_s}" data-duration="{duration_s}" data-track-index="{track}">
  <div class="ui-header">
    <div class="ui-dot red"></div>
    <div class="ui-dot yellow"></div>
    <div class="ui-dot green"></div>
    <span class="ui-title">{title}</span>
  </div>
  <div class="ui-body">{content_html}</div>
  <div class="ui-caption">{caption}</div>
</div>

<style>
.ui-card {
  background: #0f0f0f;
  border: 2px solid #3b82f6;
  border-radius: 14px;
  width: 420px;
  opacity: 0;
  transform: translateY(-50%) scale(0.92);
  font-family: 'Inter', sans-serif;
  box-shadow: 0 0 40px rgba(59,130,246,0.2);
}
.ui-header {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 18px;
  border-bottom: 1px solid #222;
}
.ui-dot { width: 12px; height: 12px; border-radius: 50%; }
.ui-dot.red { background:#ef4444; }
.ui-dot.yellow { background:#f59e0b; }
.ui-dot.green { background:#22c55e; }
.ui-title { color:#888; font-size:13px; margin-left:8px; }
.ui-body {
  padding: 18px;
  color: #e5e5e5;
  font-size: 15px;
  line-height: 1.6;
  font-family: 'Fira Code', monospace;
}
.ui-caption {
  padding: 10px 18px 14px;
  color: #555;
  font-size: 12px;
  text-align: center;
}
</style>

<script>
tl.to("#ui-{id}", {
  opacity:1,
  scale:1,
  y:"-50%",
  duration:0.45,
  ease:"back.out(1.2)"
}, {start_s})
.to("#ui-{id}", {
  opacity:0,
  scale:0.94,
  duration:0.3
}, {start_s} + {duration_s} - 0.35);
</script>
```

### TEMPLATE 4 — Chapter Summary Card (lista blanca)

```html
<!-- Summary Card: card blanca en el centro del frame -->
<div class="summary-card clip" id="summary-{id}"
     style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);"
     data-start="{start_s}" data-duration="{duration_s}" data-track-index="{track}">
  <div class="summary-title">{section_title}</div>
  <ul class="summary-list">
    {items_html}
    <!-- Ejemplo: <li>Punto clave uno</li> -->
  </ul>
</div>

<style>
.summary-card {
  background: #fff;
  border-radius: 20px;
  padding: 32px 40px;
  min-width: 560px;
  max-width: 700px;
  opacity: 0;
  transform: translate(-50%,-50%) scale(0.9);
  font-family: 'Inter', sans-serif;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4);
}
.summary-title {
  color: #111;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 20px;
  color: #666;
}
.summary-list {
  list-style: none;
  padding: 0; margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.summary-list li {
  color: #111;
  font-size: 20px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transform: translateX(-16px);
}
.summary-list li::before {
  content: '';
  width: 8px; height: 8px;
  background: #f59e0b;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>

<script>
tl.to("#summary-{id}", {
  opacity:1, scale:1,
  x:"-50%", y:"-50%",
  duration:0.5, ease:"power3.out"
}, {start_s});
// Stagger de items
document.querySelectorAll("#summary-{id} li").forEach((li, i) => {
  tl.to(li, { opacity:1, x:0, duration:0.3, ease:"power2.out" }, {start_s} + 0.3 + i*0.12);
});
tl.to("#summary-{id}", { opacity:0, duration:0.35 }, {start_s} + {duration_s} - 0.4);
</script>
```

---

### Estructura completa del index.html

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: transparent; width: 1920px; height: 1080px; overflow: hidden; }
  .clip { position: absolute; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Fira+Code&display=swap');
</style>
</head>
<body>

<div id="stage" data-composition-id="yt-motion"
     data-start="0" data-width="1920" data-height="1080">

  <!-- ===== OVERLAY 1: pill label ===== -->
  <!-- [insertar template pill label aquí] -->

  <!-- ===== OVERLAY 2: comparison card ===== -->
  <!-- [insertar template comparison card aquí] -->

  <!-- ===== OVERLAY 3: UI card ===== -->
  <!-- [insertar template UI card aquí] -->

  <!-- GSAP -->
  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });

    // [insertar animaciones de cada overlay aquí]

    window.__timelines = window.__timelines || {};
    window.__timelines["yt-motion"] = tl;
  </script>
</div>
</body>
</html>
```

---

## Paso 6 — Preview y render

```bash
# Crear carpeta de overlays
mkdir -p "$DEST/overlays"
# [escribir index.html en $DEST/overlays/index.html]

# Preview en browser (verificar animaciones)
cd "$DEST/overlays"
npx hyperframes preview
# Abrir browser en localhost:3000, verificar cada overlay

# Render a MP4 con alpha (fondo transparente)
npx hyperframes render index.html \
  --out "$DEST/overlays/overlays.webm" \
  --format webm \
  --transparent \
  --width 1920 \
  --height 1080

# Alternativa sin alpha (fondo negro, usar blending en ffmpeg):
npx hyperframes render index.html \
  --out "$DEST/overlays/overlays.mp4" \
  --width 1920 \
  --height 1080
```

---

## Paso 7 — Composición final con ffmpeg

### Opción A — Con alpha (WebM transparente, recomendado):
```bash
ffmpeg -i "$VIDEO_SRC" -i "$DEST/overlays/overlays.webm" \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto" \
  -c:v libx264 -crf 18 -preset fast \
  -c:a copy \
  -movflags +faststart \
  "$OUTPUT"
```

### Opción B — Sin alpha (blending por luminosidad):
```bash
ffmpeg -i "$VIDEO_SRC" -i "$DEST/overlays/overlays.mp4" \
  -filter_complex "[0:v][1:v]blend=all_mode=screen:all_opacity=0.92" \
  -c:v libx264 -crf 18 -preset fast \
  -c:a copy \
  "$OUTPUT"
```

### Para video en resolución diferente a 1920×1080:
```bash
# Detectar resolución del video original
VIDEO_W=$(ffprobe -v quiet -select_streams v:0 \
  -show_entries stream=width -of csv=p=0 "$VIDEO_SRC")
VIDEO_H=$(ffprobe -v quiet -select_streams v:0 \
  -show_entries stream=height -of csv=p=0 "$VIDEO_SRC")

# Escalar overlays al tamaño del video
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
# Abrir el video final
open "$OUTPUT"
# (macOS) o:
vlc "$OUTPUT"
```

Checklist de revisión:
- [ ] Pill labels no tapan la cara del speaker cuando está centrado
- [ ] Comparison card está en zona segura (no sobre el speaker)
- [ ] UI cards tienen borde azul visible
- [ ] Animaciones de entrada se ven suaves (no abruptas)
- [ ] Duración de cada overlay es suficiente para leer el texto
- [ ] Audio del video original intacto

---

## Iteración rápida

Para cambiar solo un overlay sin re-renderizar todo:

1. Editar `$DEST/overlays/index.html` (cambiar texto, timing, colores)
2. Re-renderizar: `npx hyperframes render index.html --out $DEST/overlays/overlays.webm --transparent`
3. Re-componer con ffmpeg (el comando del Paso 7)

Para cambiar timing de un overlay: modificar `data-start` y/o el timestamp en la animación GSAP, re-renderizar.

---

## Errores frecuentes

| Error | Causa | Fix |
|-------|-------|-----|
| `npx hyperframes: command not found` | Node < 22 | `nvm use 22` o instalar Node 22+ |
| Supadata retorna 404 | Video privado o no indexado | Usar descarga local + Whisper |
| Overlay no aparece en el tiempo correcto | Keyword no en transcript | Usar timestamp literal `"start_ms": 45000` |
| Video final sin audio | ffmpeg no copio el stream | Agregar `-c:a copy` al comando |
| Overlay deformado en video 4K | Escala no aplicada | Usar Opción C de ffmpeg con escala dinámica |
| GSAP no anima (overlay estático) | `window.__timelines` no configurado | Verificar que el script del Paso 5 incluye el bloque `window.__timelines` |

---

## Estructura de archivos generados

```
$DEST/
├── raw_transcript.json     ← respuesta cruda de Supadata
├── transcript.json         ← [{text, start_ms, end_ms}] normalizado
├── transcript.txt          ← texto plano legible
├── motion_board.json       ← overlays con timestamps resueltos
├── overlays/
│   ├── index.html          ← composición Hyperframes completa
│   ├── overlays.webm       ← render transparente de overlays
│   └── overlays.mp4        ← render opaco (alternativa)
└── video_final_motion.mp4  ← OUTPUT FINAL
```

---

## Comparación con motion-reels-f100k

| Aspecto | motion-reels-f100k | motion-youtube-f100k |
|---------|-------------------|----------------------|
| Formato | 1080×1920 (9:16) | 1920×1080 (16:9) |
| Overlays izquierda | Esquina superior izquierda | Esquina superior izquierda |
| Comparison card | Anchada al bottom | Anchada al bottom-right |
| UI card | Centro del frame | Centro-derecha |
| Speaker zone | Centro vertical | Centro horizontal |
| Duración típica | 30-90s (reel) | 5-15 min (YouTube) |
| Número de overlays | 3-8 | 5-20 |
