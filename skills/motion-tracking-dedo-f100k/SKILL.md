---
name: motion-tracking-dedo-f100k
description: Agrega motion graphics que SIGUEN el dedo (motion tracking real) sobre un reel 9:16 de talking-head. Detecta la punta del índice cuadro por cuadro con MediaPipe y pega un elemento — punto con glow + etiqueta de texto, solo glow, o efecto tap/ripple — que se ancla a la yema y se mueve CON la mano cuando la creadora señala hacia arriba. A diferencia de motion-reels-f100k (overlays en zonas FIJAS), aquí el gráfico viaja con el dedo. Activar SIEMPRE que se diga 'haz que el gráfico siga mi dedo', 'motion tracking del dedo', 'que la animación me siga cuando señalo', 'pega una etiqueta a mi dedo', 'efecto que sigue la mano', 'anima lo que señalo', 'glow en la punta del dedo', 'el gráfico no se mueve cuando muevo el dedo / quiero que me siga', o cuando un reel tiene a la creadora señalando/apuntando algo y se quiere un gráfico anclado a la mano. NO usar para overlays fijos en zonas seguras (motion-reels-f100k), 16:9 (motion-youtube-f100k) ni gráficos estáticos PNG (graficos-de-video-formula100k).
argument-hint: <ruta_video.mov> [contexto/etiquetas deseadas]
disable-model-invocation: false
---

# Motion Tracking del Dedo — F100K

Motion graphics que **siguen la punta del dedo** en un reel 9:16. La creadora señala hacia arriba y un elemento (glow + etiqueta) se queda pegado a la yema y se mueve con la mano. Es la diferencia entre un overlay decorativo y un overlay que "interactúa" con el gesto.

## Cuándo usar esta skill (vs. las otras de motion)

| Situación | Skill correcta |
|-----------|----------------|
| La creadora **señala / apunta / mueve el dedo** y quieres un gráfico que la SIGA | **esta skill** ✅ |
| Quieres etiquetar **lo que señala** en el momento exacto | **esta skill** ✅ |
| El gráfico actual está "clavado" y no sigue la mano (queja típica) | **esta skill** ✅ |
| Overlays en zonas fijas (cards, pills, comparativas) sincronizados al audio | `motion-reels-f100k` |
| Video horizontal 16:9 | `motion-youtube-f100k` |
| Gráficos estáticos PNG sin video | `graficos-de-video-formula100k` |

**Señal de oro:** si el valor del gráfico depende de DÓNDE está la mano en cada frame → es tracking → esta skill. Si el gráfico puede vivir en una esquina fija → es `motion-reels-f100k`.

**Casos ideales:**
- "Mira ESTO" señalando un punto → glow + etiqueta de lo que señala.
- Enumerar errores/pasos apuntando arriba con el índice → una etiqueta por cada vez que señala.
- Gesto de "encender/activar" → switch o tap-ripple en la yema.
- Reels educativos donde el dedo marca el ritmo de los puntos clave.

## Estilos de elemento disponibles

| `style` | Qué hace | Para qué |
|---------|----------|----------|
| `glow_label` (default) | Punto azul con glow en la yema + pastilla de texto que viaja al lado | Etiquetar lo que se señala / marcar errores o pasos |
| `glow_dot` | Solo el punto con glow, sin texto | Resaltar la mano sin saturar |
| `tap_ripple` | Ondas expansivas desde la yema | Gesto de "tocar el aire" / activar |

---

## Onboarding (ejecutar al inicio)

El tracking corre en **Python 3.12** (MediaPipe aún no soporta 3.13/3.14). Crear venv aislado con `uv`:

```bash
SKILL_DIR="$HOME/.claude/skills/motion-tracking-dedo-f100k"
cd "$SKILL_DIR"
# venv 3.12 + deps (idempotente)
[ -d track-env ] || uv venv --python 3.12 track-env
source track-env/bin/activate
python -c "import mediapipe, cv2, PIL, numpy" 2>/dev/null || \
  uv pip install mediapipe opencv-python Pillow numpy
# ffmpeg para componer
command -v ffmpeg >/dev/null || brew install ffmpeg
```

El modelo `scripts/hand_landmarker.task` ya viene incluido (7.5 MB). Si falta, `track_finger.py` lo descarga solo.

---

## Pipeline (6 pasos)

### Paso 1 — Recibir el video y verificar

```bash
VIDEO="<ruta del .mov/.mp4>"
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,nb_frames \
  -show_entries format=duration -of default=noprint_wrappers=1 "$VIDEO"
```

Confirmar que es 9:16 (1080×1920 típico). Guardar `VIDEO_DIR` y `VIDEO_NAME`.

> Si el video ya trae una edición previa con gráficos "quemados", el efecto se superpone encima — avisar a la creadora que esos gráficos viejos seguirán visibles. Para el resultado más limpio, pedir el video ORIGINAL sin la edición previa.

### Paso 2 — Trackear el dedo

```bash
cd "$HOME/.claude/skills/motion-tracking-dedo-f100k"
source track-env/bin/activate
python scripts/track_finger.py "$VIDEO" /tmp/finger_track.json
```

Imprime los **segmentos donde se señala hacia arriba** con sus tiempos. Si no detecta ninguno o detecta de más, ver "Ajustes" abajo. Revisar que los segmentos tengan sentido (la creadora apunta con el índice arriba, otros dedos recogidos).

### Paso 3 — Transcribir para etiquetar según contexto (solo `glow_label`)

El texto de cada etiqueta debe reflejar lo que la creadora DICE mientras señala. Transcribir:

```bash
# Fuente local (Apple Silicon):
ffmpeg -i "$VIDEO" -vn -acodec mp3 -ar 16000 -ac 1 -y /tmp/finger_audio.mp3 2>/dev/null
uvx --from mlx-whisper mlx_whisper /tmp/finger_audio.mp3 \
  --model mlx-community/whisper-large-v3-mlx --language es \
  --word-timestamps True --output-format json --output-dir /tmp
```

Cruzar los `segments` del Paso 2 con los `segments` del transcript por solapamiento temporal. Para cada segmento de señalar, escribir una etiqueta **corta (1-3 palabras, MAYÚSCULAS)** que nombre el concepto que se está marcando. Español neutro (ver feedback_espanol_neutro). Ejemplos reales validados: `SIN GANCHO`, `ADIÓS ATENCIÓN`, `NADA NUEVO`, `MUY LARGO`.

Mostrar la tabla de mapeo a la creadora y confirmar/ajustar textos antes de renderizar.

### Paso 4 — Escribir la config

Crear `/tmp/finger_config.json`. El array `labels` se alinea **en orden** con los segmentos que sobreviven `min_seg_dur` (usar `null` para saltar un segmento, p.ej. un blip corto del CTA):

```json
{
  "src":   "RUTA_VIDEO",
  "track": "/tmp/finger_track.json",
  "out":   "RUTA_VIDEO_SIN_EXT_FINGER.mp4",
  "style": "glow_label",
  "accent": [10, 132, 255],
  "min_seg_dur": 0.8,
  "labels": ["SIN GANCHO", "ADIÓS ATENCIÓN", "NADA NUEVO", "MUY LARGO"]
}
```

- `accent`: RGB del glow/anillo/punto de la pastilla. Default azul iOS `[10,132,255]`. Para acento F100K cálido: `[249,115,22]` (naranja).
- `style`: `glow_label` | `glow_dot` | `tap_ripple`.
- Para `glow_dot` / `tap_ripple` el array `labels` se ignora (no hay texto).

### Paso 5 — Componer y renderizar

```bash
python scripts/compose_overlay.py /tmp/finger_config.json
```

Lee el track, suaviza la trayectoria (EMA), interpola huecos, aplica fade in/out por segmento, dibuja el elemento pegado a la yema y compone sobre el video **conservando el audio original**. Output: `..._FINGER.mp4`.

### Paso 6 — Verificar

Extraer 2 frames dentro de un mismo segmento (p.ej. inicio y final) y confirmar con `Read` que el punto sigue en la yema y la etiqueta se movió con la mano:

```bash
for t in INICIO FINAL; do ffmpeg -ss $t -i "$OUT" -vframes 1 -q:v 3 /tmp/chk_$t.jpg -y 2>/dev/null; done
```

Checklist:
- [ ] El punto/glow cae sobre la punta del índice en cada segmento.
- [ ] La etiqueta se MUEVE con la mano (comparar 2 frames del mismo segmento).
- [ ] Fade in/out suave; sin saltos bruscos cuando la mano se mueve rápido.
- [ ] La etiqueta no se sale del frame ni tapa la cara (clamps en `compose_overlay.py`).
- [ ] Audio original intacto.

Abrir la carpeta: `open -R "$OUT"`.

---

## Ajustes finos

**Detecta pocos/ningún segmento** — la mano se mueve muy rápido (motion blur) o el gesto no es "índice arriba puro". En `scripts/track_finger.py` bajar umbrales: `above_wrist > 0.12` → `0.08`, o relajar `curled >= 2` → `>= 1`. Para gestos que NO son "índice arriba" (mano abierta, dos dedos), cambiar la lógica `pointing` en el script.

**Trackea cuando NO debería** — subir `above_wrist` a `0.16` o exigir `curled >= 3`.

**Tiembla / da saltos** — subir el suavizado: en `compose_overlay.py` bajar el factor EMA del path del punto `ema(ix, 0.45)` → `ema(ix, 0.30)` (más suave, más lag).

**La etiqueta tapa los gráficos viejos** — reposicionar cambiando el offset en `draw_label` (`px = lx + 60` / `py = ly + 30`), o pedir el video original sin la edición previa.

**Seguir todo el video (no solo al señalar)** — en `track_finger.py`, en vez de filtrar por `point`, generar un único segmento `[0, N-1]` y dejar que interpole; subir el suavizado porque la mano baja/sube mucho.

**Otro elemento (switch/toggle, emoji, sticker)** — extender `compose_overlay.py` con una función `draw_<estilo>` análoga a `draw_glow_dot`/`draw_ripple` y enrutarla en `render_frame` por `STYLE`.

---

## Cómo funciona (resumen técnico)

1. **MediaPipe Tasks HandLandmarker** (modo VIDEO) detecta 21 landmarks de la mano por frame; se usa el landmark 8 (punta del índice).
2. Heurística `pointing-up`: índice extendido hacia arriba + por encima de la muñeca + otros dedos recogidos + índice es el dedo más alto → marca el frame como "señalando".
3. Se agrupan frames consecutivos en **segmentos** (tolera huecos ≤4 frames, descarta runs <8 frames).
4. Por segmento: interpolación lineal de huecos + **EMA** (suavizado) para el punto y un EMA más lento para la etiqueta (glide), + envolvente de **alpha** (fade in/out).
5. Render frame-by-frame con PIL (glow gaussiano + anillo + núcleo + pastilla) compuesto sobre el video con OpenCV; audio copiado del original.

## Archivos

```
motion-tracking-dedo-f100k/
├── SKILL.md
├── scripts/
│   ├── track_finger.py        # detección + segmentos → finger_track.json
│   ├── compose_overlay.py     # dibuja + compone → ..._FINGER.mp4
│   └── hand_landmarker.task   # modelo MediaPipe (incluido)
└── track-env/                 # venv 3.12 (se crea en onboarding)
```

## Notas / guardrails

- **Python 3.12 obligatorio** para MediaPipe. No correr con 3.13/3.14.
- **No re-cortar el audio** después: este efecto se sincroniza por coordenadas de imagen, no por timestamps de audio, así que es seguro sobre video ya editado — pero los gráficos previos quemados quedan visibles.
- **Costo cero**: todo corre local (MediaPipe + ffmpeg). Sin APIs de pago.
- Mantener etiquetas **cortas y en español neutro**; MAYÚSCULAS para lectura rápida en reel.
- Verificar SIEMPRE con frames reales (Paso 6) antes de entregar: el tracking puede fallar en frames con motion blur o cuando la mano sale del cuadro.
