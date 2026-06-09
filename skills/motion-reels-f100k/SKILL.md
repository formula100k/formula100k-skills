---
name: motion-reels-f100k
description: "Agrega motion graphics estilo Softgirlnocode a un reel 9:16 (talking-head). Pipeline completo: analiza un frame del video para detectar dónde está el sujeto y calcular zonas seguras de overlay, transcribe word-level (Supadata si es YouTube, Whisper local si es archivo), auto-clasifica el contenido del guión para proponer el tipo de overlay correcto (antes/ahora → comparison card, listas → chapter card, herramientas → UI card, identidad → pill labels), genera HTML/CSS/GSAP con HyperFrames posicionado en las zonas libres del frame con animaciones fluidas, renderiza con npx hyperframes render → MP4 con alpha, y compone sobre el video original con ffmpeg. Output: video_final_motion.mp4 en la misma carpeta del video fuente. Activar cuando el usuario diga: 'agrega motion graphics a este reel', 'motion graphics 9:16', 'overlays animados reel', 'estilo softgirlnocode', 'agrégale animaciones al video', 'quiero motion graphics para este talking-head'."
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

# Motion Reels F100K — Overlays Animados Estilo Softgirlnocode

Pipeline completo para agregar motion graphics animados sobre un reel 9:16 de talking-head. La filosofía de Softgirlnocode: el texto que dices en cámara SE MATERIALIZA en pantalla como overlays flotantes, cards comparativas y resúmenes visuales — el video se vuelve su propio teleprompter visual.

El pipeline detecta automáticamente dónde está el sujeto en el frame y coloca los overlays en las zonas libres para que nunca tapen la cara.

## Cuándo activar

Cuando el usuario:
- Dice "agrega motion graphics a este reel" / "motion graphics 9:16"
- Dice "overlays animados" / "estilo softgirlnocode"
- Pasa un video local o URL de YouTube y pide animaciones / overlays sobre el talking-head
- Quiere que el video tenga cards, labels, comparaciones animadas

## NO activar para

- Videos horizontales 16:9 → usar `motion-youtube-f100k`
- Carruseles → usar `carrusel-render-formula100k`
- Stories fullscreen → usar `historias-a-imagenes-nanobanana`
- Motion graphics sueltos sin video base → usar `graficos-de-video-formula100k`

## Onboarding — Auto-install (ejecutar siempre al inicio)

Antes de cualquier trabajo, verificar e instalar todo lo necesario:

```bash
# 1. Node.js v22+
node --version 2>/dev/null | grep -qE "v2[2-9]|v[3-9][0-9]" || {
  echo "⚠ Node.js v22+ requerido. Instalando..."
  brew install node@22 && brew link node@22 --force
}

# 2. HyperFrames CLI
command -v hyperframes &>/dev/null || {
  echo "📦 Instalando HyperFrames CLI..."
  npm install -g hyperframes
}
hyperframes --version   # debe mostrar 0.6.x+

# 3. Paquetes del ecosistema @hyperframes
node -e "require('@hyperframes/core')" 2>/dev/null || npm install @hyperframes/core
node -e "require('@hyperframes/engine')" 2>/dev/null || npm install @hyperframes/engine
node -e "require('@hyperframes/player')" 2>/dev/null || npm install @hyperframes/player
node -e "require('@hyperframes/producer')" 2>/dev/null || npm install @hyperframes/producer
# Studio (editor visual — opcional, solo si usuario pide editar visualmente):
# npm install @hyperframes/studio

# 4. Dependencias de sistema
hyperframes doctor      # Chrome y FFmpeg deben aparecer con ✓
command -v ffmpeg &>/dev/null || brew install ffmpeg
command -v yt-dlp &>/dev/null || brew install yt-dlp
```

### Paquetes del ecosistema HyperFrames

| Paquete | Propósito |
|---------|-----------|
| `hyperframes` (CLI) | Crear, preview, lint y render composiciones |
| `@hyperframes/core` | Tipos, parsers HTML, linter, runtime — base de todo |
| `@hyperframes/engine` | Captura frame-by-frame usando Chrome BeginFrame API |
| `@hyperframes/player` | Web component para reproducir composiciones en web |
| `@hyperframes/producer` | Pipeline completo HTML→video con encoding + mezcla de audio |
| `@hyperframes/studio` | Editor visual con live preview y timeline (opcional) |

---

## Templates Oficiales HyperFrames

Scaffoldear cualquier proyecto desde un template oficial con:

```bash
npx hyperframes init mi-proyecto --example NOMBRE_TEMPLATE
# Con video fuente:
npx hyperframes init mi-proyecto --example NOMBRE_TEMPLATE --video ./video.mp4
```

### Catálogo completo (9 templates)

| Template | Formato | Estética | Mejor para |
|----------|---------|----------|------------|
| `warm-grain` | 16:9 | Crema + textura grain + color grading cálido | Lifestyle, branding, editorial |
| `play-mode` | 16:9 | Animaciones elásticas energéticas, bold motion | Social media, lanzamientos |
| `swiss-grid` | 16:9 | Grid estructurado estilo tipografía suiza | Corporativo, datos, técnico |
| `kinetic-type` | 16:9 | Tipografía cinética, texto dramático | Promos, intros, title cards |
| `decision-tree` | 16:9 | Flowchart animado con paths progresivos | Explainers, tutoriales |
| `product-promo` | 16:9 | Multi-escena con SVG + logo animations | Demos de producto, showcases |
| `nyt-graph` | 16:9 | Charts estilo editorial print (NYT) | Data stories, reportes |
| `vignelli` | 9:16 ✅ | Tipografía bold con acentos rojos | Reels con headlines fuertes |
| `blank` | 16:9 | Solo el scaffold — composición vacía | Control total, agente-generated |

**Ejemplo para reel 9:16 (F100K):**
```bash
# Reel de transformación / lifestyle:
npx hyperframes init "$MOTION_DIR" --example vignelli --video "$VIDEO_PATH"

# Reel energético / lanzamiento:
npx hyperframes init "$MOTION_DIR" --example play-mode --video "$VIDEO_PATH"

# Reel educativo / tutorial:
npx hyperframes init "$MOTION_DIR" --example blank --video "$VIDEO_PATH"
```

> Para reels 9:16, `vignelli` es el único template nativo en portrait. Los demás sirven como base estética pero requieren ajustar `data-width="1080" data-height="1920"` y recalcular posiciones. Si el usuario no especifica estética, usar `blank` y construir desde los templates de este skill.

---

## Pipeline completo (8 pasos)

### Paso 1 — Recibir el video fuente

Preguntar si no se especificó:

```
AskUserQuestion:
  "¿Cuál es el video fuente?"
  Opciones:
  - Ruta local: /Users/.../mi_reel.mp4
  - URL de YouTube/Instagram: https://...
```

Detectar tipo (http → remoto, ruta → local). Verificar:

```bash
file "$VIDEO_PATH"
ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "$VIDEO_PATH"
```

Guardar `VIDEO_PATH`, `VIDEO_DIR`, `VIDEO_NAME`.

---

### Paso 1.5 — Analizar posición del sujeto en el frame

**Este paso determina las zonas seguras para los overlays y es obligatorio antes de generar cualquier HTML.**

Extraer un frame representativo al 50% de duración:

```bash
DURATION=$(ffprobe -v error -show_entries format=duration \
  -of default=nokey=1:noprint_wrappers=1 "$VIDEO_PATH")
MIDPOINT=$(python3 -c "print(round($DURATION * 0.5, 2))")
ffmpeg -ss $MIDPOINT -i "$VIDEO_PATH" -vframes 1 -q:v 2 /tmp/frame_sujeto.jpg 2>/dev/null
echo "Frame extraído: /tmp/frame_sujeto.jpg"
```

Usar la herramienta `Read` en `/tmp/frame_sujeto.jpg` para ver la imagen y determinar visualmente:

| Variable | Pregunta | Valores |
|----------|----------|---------|
| `SUBJECT_X` | ¿En qué tercio horizontal está el sujeto? | `left` / `center` / `right` |
| `SUBJECT_Y` | ¿Qué zona vertical ocupa el sujeto? | `upper` (>60% del frame) / `full` (toda la altura) / `lower` (<40%) |

**Mapa de zonas seguras para 1080×1920 según posición del sujeto:**

```
┌────────────────────────────────┐  y=0
│  ████████ TOP ZONE ████████   │  y=0–180px    ← SIEMPRE segura (encima de la cabeza)
├────────────────────────────────┤
│  LEFT │   CARA / TORSO │ RIGHT│  y=180–1450px ← zona del cuerpo
│  zone │   (no tapar)   │ zone │
│ 0–200 │                │ 880+ │
├────────────────────────────────┤
│  ████████ BOTTOM ZONE ██████  │  y=1500–1760px ← segura (debajo del pecho)
└────────────────────────────────┘  y=1920
```

**Valores CSS por zona (definir las 3 variables antes del Paso 5):**

```
SUBJECT_X=center, SUBJECT_Y=full (talking-head clásico):
  SAFE_PILL_CSS  = "top: 80px; left: 56px;"
  SAFE_CARD_CSS  = "bottom: 160px; left: 56px; right: 56px;"
  SAFE_FLOAT_CSS = "bottom: 160px; left: 56px; right: 56px;"

SUBJECT_X=right, SUBJECT_Y=full (sujeto a la derecha):
  SAFE_PILL_CSS  = "top: 80px; left: 56px;"
  SAFE_CARD_CSS  = "top: 50%; left: 40px; width: 460px; transform: translateY(-50%);"
  SAFE_FLOAT_CSS = "top: 50%; left: 40px; width: 460px; transform: translateY(-50%);"

SUBJECT_X=left, SUBJECT_Y=full (sujeto a la izquierda):
  SAFE_PILL_CSS  = "top: 80px; right: 56px; align-items: flex-end;"
  SAFE_CARD_CSS  = "top: 50%; right: 40px; width: 460px; transform: translateY(-50%);"
  SAFE_FLOAT_CSS = "top: 50%; right: 40px; width: 460px; transform: translateY(-50%);"

SUBJECT_Y=lower (sujeto en mitad inferior — inusual):
  SAFE_PILL_CSS  = "top: 80px; left: 56px;"
  SAFE_CARD_CSS  = "top: 120px; left: 56px; right: 56px;"
  SAFE_FLOAT_CSS = "top: 260px; left: 56px; right: 56px;"
```

Guardar como variables de texto para usarlas en el HTML del Paso 5.

---

### Paso 2 — Transcribir con word-level timestamps

#### Fuente remota (YouTube / Instagram / TikTok) → Supadata API

```bash
curl -s "https://api.supadata.ai/v1/transcript?url=ENCODED_URL&lang=es" \
  -H "x-api-key: sd_8ff1f1f233fc19cb14b5b86277ae2d6b" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
words = []
for seg in data.get('content', []):
    words.append({'text': seg['text'], 'start': seg['offset']/1000, 'end': (seg['offset']+seg['duration'])/1000})
print(json.dumps(words, ensure_ascii=False, indent=2))
" > /tmp/motion_transcript.json
```

#### Fuente local → mlx-whisper (Apple Silicon)

```bash
ffmpeg -i "$VIDEO_PATH" -vn -acodec mp3 -ar 16000 -ac 1 -y /tmp/motion_audio.mp3

uvx --from mlx-whisper mlx_whisper /tmp/motion_audio.mp3 \
  --model mlx-community/whisper-large-v3-mlx \
  --language es \
  --word-timestamps True \
  --output-format json \
  --output-dir /tmp

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

Alternativa si `uvx` no disponible:
```bash
npx hyperframes transcribe /tmp/motion_audio.mp3 --model small --language es
```

---

### Paso 3 — Mostrar transcript y auto-clasificar contenido

Leer `/tmp/motion_transcript.json`. Agrupar palabras en bloques de 5-10 segundos y mostrar:

```
[00:00 - 00:05] "Hoy te voy a contar los 3 errores que yo..."
[00:05 - 00:12] "...cometía cuando empecé a crear contenido..."
...
```

### Regla de densidad obligatoria: 1 motion graphic cada 5 segundos

**Esta regla NO es negociable.** Calcular el mínimo de overlays antes de clasificar:

```python
import json

with open('/tmp/motion_transcript.json') as f:
    words = json.load(f)

# Duración total en segundos
duration_s = max(w['end'] for w in words)

# Mínimo requerido: 1 overlay por cada 5 segundos de video
MIN_OVERLAYS = int(duration_s // 5)

print(f"📹 Duración del reel: {duration_s:.0f}s")
print(f"📊 Overlays mínimos requeridos: {MIN_OVERLAYS} (1 cada 5s)")
print(f"   → Un reel de 60s necesita al menos 12 overlays activos")
```

Si el contenido natural genera menos overlays que `MIN_OVERLAYS`, **rellenar con overlays de densidad**:

| Tipo de relleno | Cuándo usar | Duración típica |
|----------------|-------------|-----------------|
| **Kinetic word** — palabra clave del segmento en grande | Cualquier momento sin overlay | 3-4s |
| **Stat pill** — número o dato mencionado | Cuando se dice un número | 4-5s |
| **Ambient pill** — etiqueta contextual del tema | Durante explicaciones sin estructura | 4s |
| **Quote pull** — frase textual del speaker en card | Durante citas o definiciones | 5-6s |

```
REGLA DE COBERTURA: En ningún segmento de 5 segundos puede haber 0 motion graphics activos.
Si hay un gap > 5s sin overlay, agregar obligatoriamente un overlay de relleno.
```

**Luego auto-clasificar cada bloque del transcript** detectando patrones de contenido:

| Patrón en el texto | Tipo de overlay sugerido |
|-------------------|--------------------------|
| "antes/ahora", "era/ahora", "solía/hoy", "pasé de X a Y" | Comparison Card BEFORE/NOW |
| "el primero/segundo", "paso 1/2/3", "número uno", lista implícita de 3+ items | Chapter Card con bullets |
| Menciona herramientas: "Claude", "ChatGPT", "Canva", "Notion", apps por nombre | Floating UI Card |
| "no soy", "nunca fui", "no uso", "sin saber", "desde cero" | Pill Labels (identidad) |
| "soy", "logré", "ahora soy", "me convertí en" | Pill Labels (transformación) |
| Números con K/M/%, métricas específicas (seguidores, ventas, alcance) | Comparison Card o Pill con stat |

Generar un **motion board automático preliminar** como tabla y mostrar al usuario:

```
📊 AUTO-DETECCIÓN DEL GUIÓN:
─────────────────────────────────────────────────────
t=00:03  →  PILL LABELS    "no soy diseñadora / no uso Figma"
             (detectado: identidad negativa en "no soy")
t=00:15  →  COMPARISON     ANTES: 200 seguidores / AHORA: 500K alcance
             (detectado: "pasé de 200 a 500K")
t=00:42  →  CHAPTER CARD   "Los 3 pasos que usé"
             (detectado: "el primero, el segundo, el tercero")
─────────────────────────────────────────────────────
Zonas de overlay: PILL → TOP (80px), CARDS → BOTTOM (160px)
[basado en sujeto centrado detectado en Paso 1.5]
```

Luego preguntar:

```
AskUserQuestion:
  "¿El plan de overlays te encaja o quieres ajustar algo?
   También puedes pedir tipos específicos o cambiar textos."
  Opciones:
  - "Generar tal cual"
  - "Ajustar algunos overlays"
  - "Cambiar todos — te doy la creative direction manual"
```

Si el usuario quiere creative direction manual, ofrecer los 4 tipos disponibles con descripción.

---

### Paso 4 — Generar el Motion Board definitivo

Procesar la creative direction (auto-detectada + ajustes del usuario) y construir el motion board JSON. **Luego verificar densidad y rellenar gaps > 5s automáticamente:**

```python
import json

def check_density_gaps(motion_board, duration_s, window_s=5):
    """Detecta ventanas de 5s sin cobertura de overlay."""
    gaps = []
    for w_start in range(0, int(duration_s), window_s):
        w_end = w_start + window_s
        covered = any(
            o['start'] < w_end and (o['start'] + o['duration']) > w_start
            for o in motion_board
        )
        if not covered:
            gaps.append({'start': w_start, 'end': w_end})
    return gaps

with open('/tmp/motion_transcript.json') as f:
    words = json.load(f)
duration_s = max(w['end'] for w in words)

# Motion board base (auto-clasificado + ajustes del usuario)
motion_board = [
    {
        "type": "pill_labels",
        "start": 2.8,
        "duration": 3.5,
        "labels": ["no soy diseñadora", "no uso Figma", "empecé desde cero"],
        "position": "top"
    },
    # ... más overlays del guión
]

# VERIFICAR DENSIDAD — rellenar gaps > 5s
gaps = check_density_gaps(motion_board, duration_s)
if gaps:
    print(f"⚠ {len(gaps)} ventanas de 5s sin cobertura — agregando overlays de relleno:")
    for gap in gaps:
        # Encontrar texto del segmento en ese momento
        seg_words = [w['text'] for w in words
                     if w['start'] >= gap['start'] and w['start'] < gap['end']]
        keyword = seg_words[0].strip() if seg_words else "IDEA"
        print(f"  → t={gap['start']:.0f}s: kinetic word '{keyword}'")
        motion_board.append({
            "type": "kinetic_word",
            "start": gap['start'] + 0.5,
            "duration": 3.5,
            "text": keyword.upper(),
            "note": "relleno densidad"
        })

motion_board.sort(key=lambda x: x['start'])

with open('/tmp/motion_board.json', 'w') as f:
    json.dump(motion_board, f, ensure_ascii=False, indent=2)

print(f"\n✅ Motion board final: {len(motion_board)} overlays para {duration_s:.0f}s de reel")
print(f"   Densidad: {len(motion_board)/(duration_s/5):.1f}x el mínimo requerido")
```

Confirmar el motion board si no se hizo en Paso 3.

---

### Paso 5 — Generar HTML con HyperFrames

Obtener duración total:
```bash
ffprobe -v error -show_entries format=duration \
  -of default=nokey=1:noprint_wrappers=1 "$VIDEO_PATH"
```

Crear carpeta:
```bash
MOTION_DIR="$VIDEO_DIR/motion_overlays"
mkdir -p "$MOTION_DIR"
```

Generar `$MOTION_DIR/index.html` usando los templates de referencia (sección abajo). Reglas:

- Stage: 1080×1920, fondo transparente
- Cada overlay: `data-start`, `data-duration`, `data-track-index` único
- Usar tracks 10+ para no colisionar
- Aplicar `SAFE_PILL_CSS`, `SAFE_CARD_CSS`, `SAFE_FLOAT_CSS` del Paso 1.5 en lugar de posiciones hardcoded
- Todos los overlays incluyen animación de entrada Y de salida (ver templates)

---

### Paso 6 — Preview y render

```bash
cd "$MOTION_DIR"
hyperframes preview  # opcional, para revisar en browser

# Render WebM con alpha (fondo transparente, recomendado)
hyperframes render --format webm --resolution portrait -o overlays.webm

# Alternativa MP4 opaco
hyperframes render --resolution portrait -o overlays.mp4
```

Si el render falla: `hyperframes lint` → `hyperframes validate` para detectar errores.

---

### Paso 7 — Componer sobre el video original con ffmpeg

```bash
OUTPUT="$VIDEO_DIR/${VIDEO_NAME}_motion.mp4"

# Con alpha (WebM — recomendado)
ffmpeg \
  -i "$VIDEO_PATH" \
  -i "$MOTION_DIR/overlays.webm" \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto[outv]" \
  -map "[outv]" -map 0:a? \
  -c:v libx264 -crf 18 -preset slow \
  -c:a aac -b:a 192k \
  -y "$OUTPUT"

echo "✓ Output: $OUTPUT"
open "$VIDEO_DIR"
```

Si el video fuente no es 1080×1920:
```bash
ffmpeg \
  -i "$VIDEO_PATH" \
  -i "$MOTION_DIR/overlays.webm" \
  -filter_complex \
    "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[scaled];
     [scaled][1:v]overlay=0:0:format=auto[outv]" \
  -map "[outv]" -map 0:a? \
  -c:v libx264 -crf 18 -preset slow \
  -c:a aac -b:a 192k \
  -y "$OUTPUT"
```

---

### Paso 8 — Verificar y entregar resultado

```bash
open "$VIDEO_DIR"
```

Checklist antes de entregar:
- [ ] **Densidad OK** — ningún tramo de 5s sin motion graphic activo (verificado con `check_density_gaps` del Paso 4)
- [ ] Pill labels no tapan la cara del speaker (verificado con zonas del Paso 1.5)
- [ ] Cards están en zona segura detectada
- [ ] UI cards tienen borde azul visible
- [ ] Animaciones de entrada Y salida fluidas — no abruptas
- [ ] Duración de cada overlay suficiente para leer el texto
- [ ] Audio del video original intacto

Mostrar al usuario: ruta del video final + tabla con overlays generados + timestamps.

---

## Templates de referencia — Los 4 estilos con animaciones fluidas

Las posiciones en CSS usan las variables definidas en Paso 1.5 (`SAFE_PILL_CSS`, `SAFE_CARD_CSS`, `SAFE_FLOAT_CSS`). Los valores entre `[[ ]]` deben reemplazarse con los valores reales.

Todas las animaciones siguen la regla: entrada con `gsap.from()` + salida con `gsap.to()` antes del final del clip.

---

### Template 1 — Pill Labels Flotantes

Tags oscuros pill-shape con texto blanco. Se apilan verticalmente en la zona superior (o la zona segura detectada).

**Cuándo usar:** identidad negativa/positiva, características del avatar, estado anterior.

**HTML (sustituir `COMP_ID`, `TRACK_IDX`, `START_S`, `DUR_S`, `SAFE_PILL_CSS`, `LABEL_N`):**

```html
<div id="pills-COMP_ID"
     data-start="START_S"
     data-duration="DUR_S"
     data-track-index="TRACK_IDX"
     style="
       position: absolute;
       SAFE_PILL_CSS
       display: flex;
       flex-direction: column;
       align-items: flex-start;
       gap: 16px;
     ">
  <span class="pill-COMP_ID" style="
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
    opacity: 0;
  ">LABEL_1</span>

  <span class="pill-COMP_ID" style="
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
    opacity: 0;
  ">LABEL_2</span>

  <!-- Agregar más <span class="pill-COMP_ID"> por cada label adicional -->
</div>
```

**GSAP (cada pill entra con stagger, sale deslizándose hacia arriba):**

```js
// Pill labels — entrada en stagger, salida hacia arriba
const pills_COMP_ID = document.querySelectorAll('.pill-COMP_ID');

// Entrada: cada pill sube desde abajo con spring
tl.from(pills_COMP_ID, {
  y: 28,
  opacity: 0,
  duration: 0.5,
  ease: "back.out(1.3)",
  stagger: 0.18
}, START_S + 0.08);

// Salida: pills se van hacia arriba con fade (0.55s antes del final)
tl.to(pills_COMP_ID, {
  y: -20,
  opacity: 0,
  duration: 0.45,
  ease: "power2.in",
  stagger: 0.08
}, START_S + DUR_S - 0.55);
```

---

### Template 2 — Comparison Card BEFORE/NOW

Card oscura que muestra el contraste antes/ahora. Se ancla en la zona segura inferior (o lateral si el sujeto lo ocupa).

**Cuándo usar:** transformaciones, resultados, antes/después, prueba de cambio.

**HTML (sustituir valores entre `[[...]]`):**

```html
<div id="compcard-COMP_ID"
     data-start="START_S"
     data-duration="DUR_S"
     data-track-index="TRACK_IDX"
     style="
       position: absolute;
       SAFE_CARD_CSS
       background: #1a1a1a;
       border-radius: 24px;
       padding: 32px 36px;
       display: flex;
       flex-direction: column;
       gap: 20px;
       opacity: 0;
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
    <div id="comp-before-COMP_ID" style="
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
      ">ANTES</span>
      <span style="
        font-family: 'Inter', sans-serif;
        font-weight: 700;
        font-size: 32px;
        color: #999999;
        line-height: 1.1;
      ">BEFORE_TEXT</span>
    </div>

    <!-- AHORA (highlight naranja) -->
    <div id="comp-now-COMP_ID" style="
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
      ">AHORA</span>
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

**GSAP (slide up al entrar, fade+slide down al salir, panels aparecen en stagger):**

```js
// Comparison card — entrada deslizante, salida suave
tl.to("#compcard-COMP_ID", {
  opacity: 1,
  y: 0,
  duration: 0.55,
  ease: "expo.out"
}, START_S + 0.1);

// Los paneles ANTES/AHORA aparecen en stagger tras la card
tl.from(["#comp-before-COMP_ID", "#comp-now-COMP_ID"], {
  opacity: 0,
  x: -16,
  duration: 0.4,
  ease: "power2.out",
  stagger: 0.18
}, START_S + 0.4);

// Salida: se va hacia abajo con fade (0.6s antes del final)
tl.to("#compcard-COMP_ID", {
  opacity: 0,
  y: 24,
  duration: 0.45,
  ease: "power2.in"
}, START_S + DUR_S - 0.55);
```

Nota CSS: si `SAFE_CARD_CSS` usa `bottom: Npx`, el HTML ya estará posicionado. El tween de entrada debe ser `from: {y: 40}` (viene desde abajo) en lugar de `to: {y: 0}`. Ajustar según la zona:
- Zona bottom → `gsap.from(el, {y: 40})` ← viene subiendo
- Zona top → `gsap.from(el, {y: -40})` ← viene bajando
- Zona lateral → `gsap.from(el, {x: -40})` ← viene de la izquierda

---

### Template 3 — Floating UI Card

Card con borde azul que simula una interfaz / pantalla de app. Flota en la zona libre del frame.

**Cuándo usar:** mostrar una herramienta, un workflow de IA, una pantalla de app.

**HTML:**

```html
<div id="uicard-COMP_ID"
     data-start="START_S"
     data-duration="DUR_S"
     data-track-index="TRACK_IDX"
     style="
       position: absolute;
       SAFE_FLOAT_CSS
       opacity: 0;
     ">
  <!-- Card principal con borde azul -->
  <div style="
    background: #0f1117;
    border: 2px solid #3b82f6;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 0 40px rgba(59,130,246,0.25), 0 20px 60px rgba(0,0,0,0.5);
  ">
    <!-- Header de la UI card -->
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

**GSAP (spring scale al entrar, shrink+fade al salir):**

```js
// Floating UI card — spring scale al entrar
tl.to("#uicard-COMP_ID", {
  opacity: 1,
  scale: 1,
  duration: 0.55,
  ease: "back.out(1.4)"
}, START_S + 0.12);

// Salida: encoge y se desvanece (0.55s antes del final)
tl.to("#uicard-COMP_ID", {
  opacity: 0,
  scale: 0.92,
  duration: 0.4,
  ease: "power2.in"
}, START_S + DUR_S - 0.55);
```

CSS inicial del elemento: `opacity: 0; transform: scale(0.88);` para que el tween `to` parta desde ese estado.

---

### Template 4 — Chapter / Summary Card

Card blanca con lista de items. Se ancla en la zona segura del frame.

**Cuándo usar:** listar lo que vas a enseñar, resumir puntos clave, introducir la estructura del video.

**HTML:**

```html
<div id="chaptercard-COMP_ID"
     data-start="START_S"
     data-duration="DUR_S"
     data-track-index="TRACK_IDX"
     style="
       position: absolute;
       SAFE_CARD_CSS
       background: #faf7f2;
       border-radius: 28px;
       padding: 40px 40px 44px;
       box-shadow: 0 24px 64px rgba(0,0,0,0.35);
       opacity: 0;
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
    <div class="ch-item-COMP_ID" style="display: flex; align-items: flex-start; gap: 16px;">
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

    <div class="ch-item-COMP_ID" style="display: flex; align-items: flex-start; gap: 16px;">
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

    <!-- Agregar más .ch-item-COMP_ID con el mismo patrón -->
  </div>
</div>
```

**GSAP (slide + fade al entrar, stagger de items, fade+slide al salir):**

```js
// Chapter card — entrada deslizante
tl.to("#chaptercard-COMP_ID", {
  opacity: 1,
  y: 0,
  duration: 0.55,
  ease: "expo.out"
}, START_S + 0.1);

// Items aparecen en stagger tras la card
const chItems_COMP_ID = document.querySelectorAll('.ch-item-COMP_ID');
tl.from(chItems_COMP_ID, {
  x: -24,
  opacity: 0,
  duration: 0.4,
  ease: "power2.out",
  stagger: 0.15
}, START_S + 0.45);

// Salida: fade + ligero deslizamiento (0.6s antes del final)
tl.to("#chaptercard-COMP_ID", {
  opacity: 0,
  y: 20,
  duration: 0.45,
  ease: "power2.in"
}, START_S + DUR_S - 0.6);
```

CSS inicial: `opacity: 0; transform: translateY(36px);` para que entre desde abajo.

---

---

### Template 5 — Kinetic Word (relleno de densidad)

Palabra clave grande con animación elástica. Usado automáticamente para cubrir gaps > 5s.

**Cuándo usar:** relleno de densidad cuando no hay overlay natural, énfasis en conceptos clave.

```html
<div id="kw-COMP_ID"
     data-start="START_S"
     data-duration="DUR_S"
     data-track-index="TRACK_IDX"
     style="
       position: absolute;
       SAFE_PILL_CSS
       opacity: 0;
     ">
  <span style="
    font: 900 96px/1 'Inter', sans-serif;
    letter-spacing: -0.04em;
    color: #ffffff;
    text-transform: uppercase;
    text-shadow: 0 4px 40px rgba(0,0,0,0.7);
    white-space: nowrap;
  ">KEYWORD</span>
</div>
```

```js
// Kinetic word — elastic bounce entrada, scale out salida
tl.from("#kw-COMP_ID", {
  scale: 0.4,
  opacity: 0,
  duration: 0.5,
  ease: "elastic.out(1.2, 0.5)"
}, START_S + 0.05);

tl.to("#kw-COMP_ID", {
  scale: 1.15,
  opacity: 0,
  duration: 0.32,
  ease: "power3.in"
}, START_S + DUR_S - 0.4);
```

---

### Template 6 — Quote Pull (cita textual)

Frase del speaker enmarcada en card con borde ámbar. Zona segura inferior o lateral.

**Cuándo usar:** durante definiciones, citas memorables, momentos de insight.

```html
<div id="quote-COMP_ID"
     data-start="START_S"
     data-duration="DUR_S"
     data-track-index="TRACK_IDX"
     style="
       position: absolute;
       SAFE_CARD_CSS
       opacity: 0;
     ">
  <div style="
    background: rgba(255,255,255,0.06);
    border-left: 5px solid #f59e0b;
    border-radius: 0 16px 16px 0;
    padding: 24px 28px;
    backdrop-filter: blur(14px);
  ">
    <p style="
      color: #ffffff;
      font: 500 italic 30px/1.5 'Inter', sans-serif;
      margin: 0;
    ">"QUOTE_TEXT"</p>
  </div>
</div>
```

```js
// Quote pull — slide lateral + fade, salida fade suave
tl.fromTo("#quote-COMP_ID",
  { opacity: 0, y: 28 },
  { opacity: 1, y: 0, duration: 0.55, ease: "expo.out" },
  START_S + 0.1
);

tl.to("#quote-COMP_ID", {
  opacity: 0,
  duration: 0.45,
  ease: "power1.in"
}, START_S + DUR_S - 0.55);
```

---

## Reglas de animación — siempre aplicar

1. **Entrada: `gsap.from()`** — animar DESDE el estado inicial HACIA la posición CSS.
2. **Salida: `gsap.to()`** — animar HACIA invisible/fuera de frame. Colocar 0.5-0.6s antes del final del clip.
3. **Eases por tipo:**
   - Cards amplias → `expo.out` (entrada) + `power2.in` (salida)
   - UI card flotante → `back.out(1.4)` (entrada con spring) + `power2.in` (salida)
   - Pill labels → `back.out(1.3)` (entrada con spring pequeño) + `power2.in` (salida)
   - Kinetic word → `elastic.out(1.2, 0.5)` (entrada rebote) + `power3.in` (salida rápida)
   - Quote pull → `expo.out` con `fromTo` (entrada) + `power1.in` (salida suave)
4. **Stagger:** siempre staggar elementos múltiples — 0.15-0.18s entre pills, 0.12-0.15s entre items de lista.
5. **Variedad de eases:** no repetir el mismo ease en todos los overlays del mismo video.
6. **Offset de entrada:** primer tween a `START_S + 0.08` como mínimo, nunca exactamente en `START_S`.

---

## Generación del HTML completo

Un solo archivo `index.html` con todos los overlays. Asignación de `data-track-index`:
- Pill labels: 10, 11, 12...
- Comparison cards: 20, 21, 22...
- UI cards: 30, 31, 32...
- Chapter cards: 40, 41, 42...
- Kinetic words: 50, 51, 52...
- Quote pulls: 60, 61, 62...

El timeline GSAP concatena todos los bloques en orden cronológico por `START_S`.

### Estructura base

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

    <!-- OVERLAYS: pegar templates aquí con posiciones de SAFE_*_CSS -->

    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script>
      const tl = gsap.timeline({ paused: true });

      // ANIMACIONES: pegar bloques GSAP de cada template aquí en orden cronológico

      window.__timelines = window.__timelines || {};
      window.__timelines["motion-overlays"] = tl;
    </script>
  </div>
</body>
</html>
```

---

## Iteración

**Cambiar texto o timing de un overlay:**
1. Editar `motion_overlays/index.html`
2. Re-render: `npx hyperframes render --format webm --resolution portrait -o overlays.webm`
3. Re-componer con ffmpeg

**Mover un overlay a otra zona:**
1. Cambiar el CSS `position` en el HTML del elemento
2. Ajustar la dirección de la animación de entrada si es necesario (eje x vs y)
3. Re-render y re-componer

**Agregar un overlay nuevo:**
1. Pegar el template con nuevo `COMP_ID` y `data-track-index` único
2. Agregar bloque GSAP al timeline
3. Re-render y re-componer

---

## Errores y fallbacks

| Error | Acción |
|-------|--------|
| Supadata devuelve 401 | Verificar API key: `sd_8ff1f1f233fc19cb14b5b86277ae2d6b` |
| Supadata sin timestamps | Video privado → descargar con yt-dlp + Whisper local |
| `uvx` no encontrado | `brew install uv` y reintentar |
| Whisper produce alucinaciones | Re-correr con `--temperature 0.2` o modelo `medium` |
| `hyperframes render` falla | `hyperframes lint` + `hyperframes validate`; verificar que `window.__timelines["motion-overlays"]` está registrado y no hay `data-track-index` repetido |
| ffmpeg: "No such file" en overlays | El render no completó → verificar que terminó sin errores |
| Video final con overlays desfasados | Verificar timestamps en `data-start` vs duración del video original |
| `hyperframes: command not found` | `npm install -g hyperframes` + `node --version >= 22` |
| Frame de análisis (Paso 1.5) incompleto | Usar el frame en posición `0.33` del video como backup |

---

## Estructura de archivos generados

```
$VIDEO_DIR/
├── mi_reel.mp4                    ← video original (no se modifica)
├── mi_reel_motion.mp4             ← OUTPUT FINAL
└── motion_overlays/
    ├── index.html                 ← composición HyperFrames con overlays
    └── overlays.webm              ← overlays renderizados (alpha transparente)

/tmp/
├── frame_sujeto.jpg               ← frame para análisis de posición (temporal)
├── motion_audio.mp3               ← audio extraído (temporal)
├── motion_transcript.json         ← transcript word-level normalizado
└── motion_board.json              ← mapa de overlays → timestamps definitivo
```

---

## Diferencias con otras skills

| Aspecto | motion-reels-f100k | motion-youtube-f100k | graficos-de-video |
|---------|-------------------|----------------------|-------------------|
| Formato | 1080×1920 (9:16) | 1920×1080 (16:9) | Cualquiera (PNG) |
| Detección de sujeto | ✅ Sí, frame análisis | ✅ Sí, frame análisis | ✗ No aplica |
| Auto-clasificación guión | ✅ Sí | ✅ Sí | ✗ No aplica |
| Output | Video MP4 final con overlays | Video MP4 final con overlays | PNGs estáticos |
| Motion | HTML/GSAP/HyperFrames animado | HTML/GSAP/HyperFrames animado | Higgsfield estático |
| Estilo visual | Softgirlnocode dark | Softgirlnocode dark | Scrapbook crema F100K |
