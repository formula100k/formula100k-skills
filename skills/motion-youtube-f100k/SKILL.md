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
| `vignelli` | 9:16 🔴 | Tipografía bold con acentos rojos | Headlines, anuncios verticales |
| `blank` | 16:9 | Solo el scaffold — composición vacía | Control total, agente-generated |

**Ejemplo para video de YouTube (F100K):**
```bash
# Para un video educativo/tutorial:
npx hyperframes init "$DEST/overlays" --example swiss-grid --video "$VIDEO_SRC"

# Para un video de lifestyle/marca personal:
npx hyperframes init "$DEST/overlays" --example warm-grain --video "$VIDEO_SRC"

# Para un reel de resultado (antes/después):
npx hyperframes init "$DEST/overlays" --example play-mode --video "$VIDEO_SRC"
```

> Si el usuario no especifica preferencia estética, usar `blank` y construir los overlays desde los templates de este skill (Paso 5). Si especifica un mood, usar el template más cercano como base y sobreescribir con los overlays del motion board.

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

### Regla de densidad obligatoria: 1 motion graphic cada 5 segundos

**Esta regla NO es negociable.** Calcular el mínimo de overlays antes de clasificar:

```python
import json

with open('$DEST/transcript.json') as f:
    transcript = json.load(f)

# Duración total en segundos
duration_ms = max(s['end_ms'] for s in transcript)
duration_s = duration_ms / 1000

# Mínimo requerido: 1 overlay por cada 5 segundos de video
MIN_OVERLAYS = int(duration_s // 5)

print(f"📹 Duración del video: {duration_s:.0f}s")
print(f"📊 Overlays mínimos requeridos: {MIN_OVERLAYS} (1 cada 5s)")
print(f"   → Distribución sugerida: 1 overlay activo en cada ventana de 5s")
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

**Luego auto-clasificar el contenido del guión** detectando la INTENCIÓN del segmento. La tabla es GENEROSA a propósito: NO esperes la frase literal — los 6 templates están disponibles y hay que repartirlos, no defaultear a pills + UI card.

| Intención del segmento | Template sugerido | Señales (no requieren literalidad) |
|------------------------|-------------------|-------------------------------------|
| **Contraste / cambio** entre dos estados | Comparison Card ANTES/AHORA | "antes/ahora", "era/ahora", "ya no… ahora", "pasé de X a Y", "el problema vs la solución", cualquier evolución o mejora implícita |
| **Enumeración** de pasos, razones, errores, tips, beneficios | Chapter Card con bullets | "lo primero", "paso 1/2/3", "tres cosas", "primero… luego…", "hay que X y también Y", listas implícitas de 2+ ítems |
| **Herramienta / app / pantalla** mencionada | Floating UI Card | "Claude", "ChatGPT", "Canva", "Notion", "esta app", "te muestro", cualquier software o interfaz |
| **Frase punch / insight / definición / tesis** | Quote Pull | "la clave es", "lo que nadie te dice", "esto lo cambia todo", afirmaciones contundentes, definiciones, la idea central del video |
| **Concepto / palabra-fuerza** suelta o cambio de tema | Kinetic Word | un sustantivo o verbo central que merece énfasis ("constancia", "sistema", "gratis"), transiciones entre secciones |
| **Identidad** negativa/positiva del avatar | Pill Labels | "no soy", "nunca fui", "no uso", "desde cero", "soy", "logré", "me convertí en", características personales |
| **Dato / métrica** (número con K/M/%, $) | Comparison Card o Stat Pill | seguidores, ventas, alcance, ingresos, cualquier cifra concreta |

> ⚠ **Anti-default:** Pill Labels y Floating UI Card son los que más se sobre-usan porque el contenido F100K casi siempre dice "yo no soy X… uso Claude/ChatGPT". NO los dejes dominar. Si un segmento encaja en pill PERO también tiene una enumeración, una cita fuerte o un contraste, prefiere el template menos usado hasta ese momento. Quote Pull y Kinetic Word son selecciones de PRIMERA CLASE, no relleno.

Generar **motion board automático preliminar** y mostrarlo:

```
📊 AUTO-DETECCIÓN DEL GUIÓN (busca VARIEDAD, no repetir template):
──────────────────────────────────────────────────────────────
t=00:08  →  PILL LABELS    "sin código / sin equipo / desde cero"
             (detectado: identidad negativa en "desde cero")
t=01:24  →  FLOATING UI    Claude Code — herramienta detectada
             (detectado: menciona herramienta)
t=03:45  →  COMPARISON     ANTES: 3 horas / AHORA: 20 minutos
             (detectado: "me tomaba 3 horas, ahora 20 minutos")
t=05:30  →  QUOTE PULL     "lo que nadie te dice es que el sistema gana al talento"
             (detectado: frase punch / tesis del video)
t=06:50  →  KINETIC WORD   "CONSTANCIA"
             (detectado: palabra-fuerza / cambio de tema)
t=08:10  →  CHAPTER CARD   "Los 4 pasos del sistema"
             (detectado: enumeración "primero... segundo... tercero...")
──────────────────────────────────────────────────────────────
Mezcla: 6 overlays, 6 templates distintos ✅  (ninguno domina)
Zonas: PILLS/KINETIC → top-left (60px), CARDS → lado libre opuesto al sujeto
[basado en sujeto detectado en Paso 1.5]
```

Luego preguntar con `AskUserQuestion`:

```
"¿El plan de overlays te encaja o quieres ajustar algo?
 También puedes agregar, quitar o cambiar el texto de cualquier overlay."
Opciones: ["Generar tal cual", "Ajustar algunos", "Creative direction manual completa"]
```

---

## Paso 4 — Generar Motion Board definitivo

Crear `$DEST/motion_board.json` resolviendo cada overlay al timestamp correcto y verificando densidad:

```python
import json

def find_keyword_time(transcript, keyword):
    keyword_lower = keyword.lower()
    for seg in transcript:
        if keyword_lower in seg['text'].lower():
            return seg['start_ms']
    return None

def check_density_gaps(motion_board, duration_ms, window_ms=5000):
    """Detecta ventanas de 5s sin cobertura de overlay."""
    gaps = []
    for window_start in range(0, int(duration_ms), window_ms):
        window_end = window_start + window_ms
        covered = any(
            o['start_ms'] < window_end and (o['start_ms'] + o['duration_ms']) > window_start
            for o in motion_board
        )
        if not covered:
            gaps.append({'start_ms': window_start, 'end_ms': window_end})
    return gaps

with open('$DEST/transcript.json') as f:
    transcript = json.load(f)

duration_ms = max(s['end_ms'] for s in transcript)

# Motion board (definido por auto-clasificación + ajustes del usuario)
motion_board = []
# ... resolver timestamps para cada overlay

# VERIFICAR DENSIDAD — rellenar gaps > 5s CON VARIEDAD (no solo kinetic word)
gaps = check_density_gaps(motion_board, duration_ms)
if gaps:
    print(f"⚠ {len(gaps)} ventanas de 5s sin cobertura — rellenando con VARIEDAD:")
    rotation = ["kinetic_word", "ambient_pill", "quote_pull"]  # se turnan, no se repiten seguidas
    last = None
    for gap in gaps:
        seg_texts = [s['text'] for s in transcript
                     if s['start_ms'] >= gap['start_ms'] and s['start_ms'] < gap['end_ms']]
        seg_text = " ".join(seg_texts).strip()
        words = seg_text.split()

        if any(ch.isdigit() for ch in seg_text):       # hay un dato → stat pill
            ftype = "stat_pill"
        elif len(words) >= 6:                           # frase completa → cita textual
            ftype = "quote_pull"
        else:                                           # rotar sin repetir el anterior
            ftype = next(t for t in rotation if t != last)
        last = ftype

        if ftype == "stat_pill":
            num = next((w for w in words if any(ch.isdigit() for ch in w)), seg_text[:20])
            payload = {"type": "stat_pill", "text": num}
        elif ftype == "quote_pull":
            payload = {"type": "quote_pull", "text": seg_text[:80]}
        elif ftype == "ambient_pill":
            payload = {"type": "pill_labels", "labels": [words[0] if words else "IDEA"]}
        else:  # kinetic_word
            payload = {"type": "kinetic_word", "text": (words[0] if words else "IDEA").upper()}

        print(f"  → t={gap['start_ms']/1000:.0f}s: {ftype:12} '{seg_text[:30]}'")
        motion_board.append({**payload, "start_ms": gap['start_ms'] + 500,
                             "duration_ms": 3500, "note": f"relleno densidad ({ftype})"})

motion_board.sort(key=lambda x: x['start_ms'])

# VERIFICAR DIVERSIDAD — ningún video se apoya en 1-2 templates
from collections import Counter
mix = Counter(o['type'] for o in motion_board)
distinct = len(mix)
top_type, top_n = mix.most_common(1)[0]
top_share = top_n / len(motion_board)
duration_s = duration_ms / 1000
min_distinct = 4 if duration_s > 45 else 3
print(f"\n🎨 Mezcla de templates: {dict(mix)}")
if distinct < min_distinct or top_share > 0.45:
    print(f"⚠ POCA VARIEDAD: {distinct} templates distintos, '{top_type}' domina {top_share:.0%}")
    print(f"  → Antes de confirmar: convierte la enumeración más clara en CHAPTER,")
    print(f"    la frase más fuerte en QUOTE PULL, y el mayor contraste en COMPARISON.")
    print(f"  → Objetivo: ≥{min_distinct} templates distintos y dominante ≤45%.")
else:
    print(f"✅ Diversidad OK: {distinct} templates distintos, dominante {top_share:.0%}")

with open('$DEST/motion_board.json', 'w') as f:
    json.dump(motion_board, f, indent=2, ensure_ascii=False)

print(f"\n✅ Motion board final: {len(motion_board)} overlays para {duration_ms/1000:.0f}s de video")
print(f"   Densidad: {len(motion_board)/(duration_ms/1000/5):.1f}x el mínimo requerido")
```

---

## Paso 5 — Generar HTML HyperFrames (1920×1080)

Generar `$DEST/overlays/index.html` con TODOS los overlays. Usar las variables `SAFE_*_CSS` del Paso 1.5 en lugar de posiciones hardcodeadas.

### Estructura base

> **GOTCHA — background obligatorio**: Usar `background: #00ff00` (NUNCA `transparent`).
> HyperFrames fuerza transparencia al renderizar WebM → fondo negro en yuv420p → colorkey no funciona.
> Renderizando como **MP4**, el renderer SÍ respeta el CSS body background → green screen limpio.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #00ff00; width: 1920px; height: 1080px; overflow: hidden; }
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

---

### Template 5 — Kinetic Word (relleno de densidad)

Palabra clave grande con animación elástica. Usado automáticamente para cubrir gaps > 5s.

**Cuándo usar:** relleno de densidad cuando no hay overlay natural, énfasis en conceptos clave.

```html
<div id="kw-{id}" class="clip"
     data-start="{start_s}" data-duration="{dur_s}" data-track-index="{track}"
     style="position: absolute; SAFE_PILL_CSS; opacity: 0;">
  <span style="
    font: 900 72px/1 'Inter', sans-serif;
    letter-spacing: -0.04em;
    color: #fff;
    text-transform: uppercase;
    text-shadow: 0 4px 32px rgba(0,0,0,0.6);
    white-space: nowrap;
  ">{KEYWORD}</span>
</div>
```

```js
// Kinetic word — elastic bounce entrada, scale out salida
tl.from("#kw-{id}", {
  scale: 0.5,
  opacity: 0,
  duration: 0.45,
  ease: "elastic.out(1.2, 0.5)"
}, {start_s} + 0.05);

tl.to("#kw-{id}", {
  scale: 1.1,
  opacity: 0,
  duration: 0.3,
  ease: "power3.in"
}, {start_s} + {dur_s} - 0.4);
```

---

### Template 6 — Quote Pull (cita textual)

Frase del speaker enmarcada en card de cita.

**Cuándo usar:** durante definiciones, citas memorables, momentos de insights.

```html
<div id="quote-{id}" class="clip"
     data-start="{start_s}" data-duration="{dur_s}" data-track-index="{track}"
     style="position: absolute; SAFE_CARD_CSS;
            max-width: 620px; opacity: 0;">
  <div style="
    background: rgba(255,255,255,0.06);
    border-left: 4px solid #f59e0b;
    border-radius: 0 12px 12px 0;
    padding: 20px 24px;
    backdrop-filter: blur(12px);
  ">
    <p style="
      color: #fff;
      font: 500 italic 22px/1.5 'Inter', sans-serif;
      margin: 0;
    ">"<span id="quote-text-{id}">{QUOTE_TEXT}</span>"</p>
  </div>
</div>
```

```js
// Quote pull — slide desde borde + fade, salida fade suave
tl.fromTo("#quote-{id}",
  { opacity: 0, x: 30 },
  { opacity: 1, x: 0, duration: 0.55, ease: "expo.out" },
  {start_s} + 0.1
);

tl.to("#quote-{id}", {
  opacity: 0,
  duration: 0.45,
  ease: "power1.in"
}, {start_s} + {dur_s} - 0.55);
```

---

## Asignación de data-track-index

- Pill labels: 10, 11, 12...
- Comparison cards: 20, 21, 22...
- UI cards: 30, 31, 32...
- Chapter cards: 40, 41, 42...
- Kinetic words: 50, 51, 52...
- Quote pulls: 60, 61, 62...

**Mapa `type` → template HTML** (los tipos de relleno reusan templates existentes, no inventes HTML nuevo):
| `type` del motion board | Template a usar (sección arriba) |
|-------------------------|----------------------------------|
| `pill_labels`, `ambient_pill`, `stat_pill` | Template 1 — Pill Labels (1 pill para stat/ambient) |
| `comparison` | Template 2 — Comparison Card |
| `ui_card` / floating UI | Template 3 — Floating UI Card |
| `chapter` | Template 4 — Chapter Summary Card |
| `kinetic_word` | Template 5 — Kinetic Word |
| `quote_pull` | Template 6 — Quote Pull |

El timeline GSAP concatena todos los bloques en orden cronológico por `start_ms`.

---

## Paso 6 — Preview y render

```bash
mkdir -p "$DEST/overlays"
# [escribir index.html en $DEST/overlays/index.html]

cd "$DEST/overlays"
npx hyperframes preview   # verificar en browser

# ⚠️ SIEMPRE renderizar como MP4 — WebM ignora el body background (fuerza transparente → negro)
hyperframes render --format mp4 -o "$DEST/overlays/overlays.mp4"
```

Verificar que el green screen funciona antes de componer:
```bash
ffmpeg -ss 3 -i "$DEST/overlays/overlays.mp4" -vframes 1 /tmp/verify_gs.jpg -y
# Abrir /tmp/verify_gs.jpg — debe mostrar fondo verde brillante con overlays encima
```

---

## Paso 7 — Composición final con ffmpeg

### Video fuente ya es 1920×1080 (horizontal):
```bash
ffmpeg -y -i "$VIDEO_SRC" -i "$DEST/overlays/overlays.mp4" \
  -filter_complex "
    [1:v]colorkey=0x00ff00:0.35:0.15[keyed];
    [0:v][keyed]overlay=0:0:eof_action=pass[v]
  " \
  -map "[v]" -map 0:a \
  -c:v libx264 -crf 18 -preset fast \
  -c:a copy \
  "$OUTPUT"
```

### Video fuente es VERTICAL (9:16 → pillarbox 16:9):

> **GOTCHA — pillarbox con video vertical**: Requiere `fps=30,format=yuv420p` ANTES de `split=2`.
> Sin esta conversión explícita, HEVC 60fps en filter_complex produce fondo negro aunque los streams individuales funcionen.
> También: **NO** usar `-movflags +faststart` (cuelga el proceso). **NO** usar `-r 30` al final (interfiere con filter timing).
> Para MOV con streams de data/metadata: usar `-map 0:1` explícito en lugar de `-map 0:a`.

```bash
# Detectar dimensiones del fuente
VIDEO_W=$(ffprobe -v quiet -select_streams v:0 \
  -show_entries stream=width -of csv=p=0 "$VIDEO_SRC")
VIDEO_H=$(ffprobe -v quiet -select_streams v:0 \
  -show_entries stream=height -of csv=p=0 "$VIDEO_SRC")

# Si VIDEO_W < VIDEO_H → fuente es vertical, aplicar pillarbox
ffmpeg -y \
  -i "$VIDEO_SRC" \
  -i "$DEST/overlays/overlays.mp4" \
  -filter_complex "
    [0:0]fps=30,format=yuv420p,split=2[v1][v2];
    [v1]scale=1920:-2,crop=1920:1080:0:(ih-1080)/2,gblur=sigma=15[bg];
    [v2]scale=-2:1080[fg];
    [bg][fg]overlay=(W-w)/2:0[composed];
    [1:v]colorkey=0x00ff00:0.35:0.15[keyed];
    [composed][keyed]overlay=0:0:eof_action=pass[v]
  " \
  -map "[v]" \
  -map 0:1 \
  -c:v libx264 -crf 20 -preset fast \
  -c:a aac -b:a 192k \
  "$OUTPUT"
```

El pillarbox blurrea el video de fondo a 1920px ancho (crop centro) y centra el video nítido al aspect ratio original. Como ambos son el mismo encuadre, el efecto es seamless.

---

## Paso 8 — Verificación

```bash
open "$OUTPUT"
```

Checklist:
- [ ] **Densidad OK** — ningún tramo de 5s sin motion graphic activo (verificar con `check_density_gaps` del Paso 4)
- [ ] Pill labels no tapan la cara del speaker (verificado con zonas del Paso 1.5)
- [ ] Cards están en zona segura detectada
- [ ] UI cards tienen borde azul visible
- [ ] Animaciones de entrada Y salida fluidas — no abruptas
- [ ] Duración de cada overlay suficiente para leer el texto
- [ ] Audio del video original intacto

---

## Iteración rápida

1. Editar `$DEST/overlays/index.html`
2. Re-renderizar: `hyperframes render --format mp4 -o $DEST/overlays/overlays.mp4`
3. Re-componer con ffmpeg (reutilizar el mismo comando del Paso 7)

---

## Errores frecuentes

| Error | Causa | Fix |
|-------|-------|-----|
| `hyperframes: command not found` | No instalado o Node < 22 | `npm install -g hyperframes` |
| Supadata retorna 404 | Video privado | Descarga local + Whisper |
| Overlay no aparece en el tiempo correcto | Keyword no en transcript | Usar timestamp literal en segundos |
| Video final sin audio | ffmpeg no copió el stream | Agregar `-map 0:1` (MOV) o `-map 0:a` (MP4/otros) |
| GSAP no anima (overlay estático) | `window.__timelines` no configurado | Verificar bloque `window.__timelines` al final del script |
| Frame de análisis vacío (URL) | yt-dlp sin thumbnail | Extraer thumbnail manualmente o usar frame 0.25 del video |
| **Overlay fondo negro (no verde)** | WebM ignora CSS background | Renderizar como **MP4** (`--format mp4`), nunca WebM para green screen |
| **Video final fondo negro** (overlays sí, video no) | filter_complex no puede leer HEVC 60fps sin conversión previa | Agregar `fps=30,format=yuv420p` ANTES del `split=2` en el filter_complex |
| **ffmpeg se cuelga** sin progreso visible | `-movflags +faststart` con filter_complex complejo | Quitar `-movflags +faststart` |
| `No decoder for none` en MOV | Stream de data/metadata sin codec | Usar `-map 0:1` explícito para audio en lugar de `-map 0:a` |
| Pillarbox fondo negro después de `split=2` | Mismo stream usado dos veces sin split | Ya incluir `split=2[v1][v2]` — si aún negro, verificar `fps=30,format=yuv420p` previo |

---

## Estructura de archivos generados

```
$DEST/
├── raw_transcript.json     ← respuesta cruda de Supadata
├── transcript.json         ← [{text, start_ms, end_ms}] normalizado
├── transcript.txt          ← texto plano legible
├── motion_board.json       ← overlays con timestamps resueltos
├── overlays/
│   ├── index.html          ← composición HyperFrames (body: #00ff00)
│   └── overlays.mp4        ← render green screen (SIEMPRE MP4, no WebM)
└── video_final_motion.mp4  ← OUTPUT FINAL

/tmp/
├── frame_sujeto.jpg        ← frame para análisis de posición (temporal)
└── verify_gs.jpg           ← verificación green screen (debe ser verde, no negro)
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
