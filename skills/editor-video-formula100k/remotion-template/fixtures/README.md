# Compuerta de regresión — `reel-viral`

Fixture usado por la compuerta SSIM de la Tarea 4 (extracción de `CreaContenidoViral.tsx` a
`src/layers/`). Las Tareas 6, 7 y 8 heredan esta misma línea base cuando toquen esas capas.

Todos los comandos se corren desde `remotion-template/`.

## 1. Regenerar el video fuente (gitignorado — `*.mp4`, no se versiona)

```bash
mkdir -p public/fixtures
ffmpeg -y -f lavfi -i testsrc=size=1080x1920:rate=30:duration=6 \
  -pix_fmt yuv420p public/fixtures/test-source.mp4
```

`public/fixtures/hook.png` (400×400, generado igual con `testsrc`) **sí está versionado** —
sirve de imagen para `hookCue`, ambos `overlayCues` y el `brollCue` de imagen. No hace falta
regenerarlo salvo que se pierda.

**`test-source.mp4` no tiene pista de audio** (el comando de arriba es sólo `-f lavfi
testsrc`, sin `-i` de audio). Sirve para `npx remotion still`/`npx remotion render` directos
con `fixtures/reel-fixture.json` — la compuerta SSIM de esta página — pero **no sirve para
alimentar `scripts/render.py`**: su Paso A (`cut_silences_and_fillers.py`) extrae audio con
`ffmpeg -vn ...` y falla ("Output file does not contain any stream") si no hay pista. Para una
prueba de punta a punta de `render.py` con este fixture, mux primero una pista de voz sobre una
copia (no sobre el fixture versionado):

```bash
say -o /tmp/voz.aiff "un texto cualquiera que dure unos segundos"
ffmpeg -y -i /tmp/voz.aiff -ar 44100 /tmp/voz.wav
ffmpeg -y -i public/fixtures/test-source.mp4 -i /tmp/voz.wav \
  -c:v copy -c:a aac -b:a 128k -shortest /tmp/fuente_con_audio.mp4
```

`say` es de macOS; en otro SO cualquier fuente de voz (TTS o una grabación real) sirve igual —
lo único que importa es que la pista de audio exista y cubra ~los 6s del video para que el
recorte de silencios no acorte demasiado el resultado.

## 2. Frames y ventanas de cada capa (fps=30, `durationInFrames=180`)

| Capa | Ventana resuelta | Frames | Frame de referencia |
|---|---|---|---|
| `Header` | siempre (hasta `hideAfter=8s`) | — | cualquiera |
| `HookImage` | `[0.2, 2.2)` s | `[6, 66)` | **31** |
| `OverlayLayer` — `bottom` | `[0.0, 1.3)` s | `[0, 39)` | **31** |
| `OverlayLayer` — `top` | `[0.0, 1.3)` s | `[0, 39)` | **31** |
| `EmphasisLayer` | `[1.5, 3.1)` s | `[45, 93)` | **90** (de paso — no es su frame dedicado, pero cae dentro) |
| `BrollLayer` — video | `[1.2, 2.2)` s | `[36, 66)` | **45** |
| `BrollLayer` — imagen (`bottom: 520`) | `[2.6, 3.6)` s | `[78, 108)` | **90** |

**Por qué el frame cambió de 45 a 31 para el still primario**: a partir de 1.5s
(`emphasisCues` con keyword `"prueba"`) `OverlayLayer` oculta ambos overlays por la regla
"emphasis gana" (`emphasisActive` en `OverlayLayer.tsx`). El frame 45 (=1.5s) cae justo en el
arranque del emphasis, así que un still ahí no muestra ninguno de los dos overlays. El frame 31
(≈1.033s) está dentro de las tres ventanas (`HookImage`, overlay `bottom`, overlay `top`) y
antes de que el emphasis entre en juego.

**Por qué `BrollLayer` necesita dos stills separados**: `resolveBroll` (en `src/layers/shared.ts`,
sin tocar) sortea los `brollCues` por `start` y recorta el `end` del anterior hasta el `start`
del siguiente cuando se solapan — por diseño, **sólo un B-roll está en pantalla a la vez**. No
existe un frame donde la rama video y la rama imagen convivan. El still del frame 31 no
incluye ningún B-roll (ambas ventanas empiezan después de 1.2s); el frame 45 cae dentro de la
ventana del B-roll **video** (fullscreen, sin `bottom` — no tocado por el Step 7); el frame 90
cae dentro de la ventana del B-roll **imagen** (`bottom: 520` — sí tocada por el Step 7 de esta
tarea, la razón por la que este tercer still es obligatorio y no opcional: sin él, el cambio de
comportamiento más relevante de la tarea no tiene compuerta visual persistente).

## 3. Regenerar los stills de referencia

```bash
# Still 1 (primario) — Header + HookImage + overlay bottom + overlay top
npx remotion still src/index.ts reel-viral /tmp/regresion_antes.png \
  --frame=31 --props=fixtures/reel-fixture.json

# Still 2 — rama video de BrollLayer (fullscreen, sin bottom, no tocada por el Step 7)
npx remotion still src/index.ts reel-viral /tmp/regresion_antes_broll_video.png \
  --frame=45 --props=fixtures/reel-fixture.json

# Still 3 — rama imagen de BrollLayer (bottom: 520, sí tocada por el Step 7) + EmphasisLayer de paso
npx remotion still src/index.ts reel-viral /tmp/regresion_antes_broll_imagen.png \
  --frame=90 --props=fixtures/reel-fixture.json
```

Los tres se escriben en `/tmp` (efímeros, no versionados a propósito — son binarios que cambiarían
en cada refactor legítimo). Para comparar contra un cambio nuevo:

```bash
npx remotion still src/index.ts reel-viral /tmp/regresion_despues.png \
  --frame=31 --props=fixtures/reel-fixture.json
ffmpeg -i /tmp/regresion_antes.png -i /tmp/regresion_despues.png \
  -lavfi ssim -f null - 2>&1 | grep -o 'All:[0-9.]*'
```

Repetir con `--frame=45` (+ `*_broll_video.png`) y con `--frame=90` (+ `*_broll_imagen.png`)
para las otras dos compuertas.

## 4. Verificar los resolvedores directamente (sin renderizar)

Si un cambio de cue no se refleja en el still, no asumas por qué — corre los resolvedores
reales antes de tocar el fixture de nuevo:

```bash
npx tsx -e "
import {resolveEmphasis, resolveOverlays, resolveBroll, shiftOverlaysAroundEmphasis, findKeywordTime}
  from './src/layers/shared';
import fixture from './fixtures/reel-fixture.json';
const emphasis = resolveEmphasis(fixture.emphasisCues as any, fixture.transcript as any);
const raw = resolveOverlays(fixture.overlayCues as any, fixture.transcript as any);
console.log('RAW', raw);
console.log('FINAL', shiftOverlaysAroundEmphasis(raw, emphasis));
console.log('BROLL', resolveBroll(fixture.brollCues as any, fixture.transcript as any));
"
```

Un cue que se resuelve pero cae por debajo de `MIN_OVERLAY_VISIBLE_SECONDS` (1.2s visibles,
descontando el tiempo tapado por `emphasisCues`) se descarta **en silencio** — no aparece en
FINAL aunque sí en RAW. Compará ambas listas, no sólo el PNG.

## 5. Notas de las keywords del fixture

`findKeywordTime` hace *substring match* (`.includes`), no comparación exacta — una keyword
corta puede enganchar la palabra equivocada si otra palabra del transcript la contiene como
prefijo (p. ej. `"es"` engancha `"esto"` antes que la palabra `"es"` real, porque `"esto"`
aparece antes en el array). Antes de elegir una keyword nueva para un cue, confirmá que ninguna
palabra *anterior* en el `transcript` la contenga como substring.
