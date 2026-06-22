---
name: collage-cine-f100k
description: "Convierte un video grabado por Andrea en un reel estilo COLLAGE CINEMATOGRÁFICO (estética @andrewcodesmith): el talking-head se compone en paneles apilados sobre ESCENAS temáticas generadas (grafo de Obsidian, sala de control retro, etc.), con captions MANUSCRITOS (cursiva crema + palabra clave verde subrayada en amarillo) y grano de película vintage encima de todo. Es el look 'second brain / sci-fi analógico': desaturado verdoso, paneles horizontales, sujeto recortado metido en escenas, motivos pixel-art/sticky-notes. Activar SIEMPRE que Andrea pase un .mov/.mp4 y diga 'hazme el estilo collage cinematográfico', 'estilo andrewcodesmith', 'mete mi cara en escenas temáticas', 'el look del second brain', 'collage cine', 'paneles apilados con escenas', 'captions a mano + grano vintage', o combine un video grabado con la intención de ese look compositeado-cinematográfico. NO confundir con motion-reels-f100k (overlays softgirlnocode), editor-video-formula100k (preset talking-head limpio) ni recursos-de-video (caza b-roll). Output: $DEST/BORRADOR_COLLAGE.mp4 + MANIFEST_COLLAGE.md."
disable-model-invocation: true
argument-hint: "[ruta del video .mov/.mp4]"
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill, mcp__higgsfield__generate_image, mcp__higgsfield__remove_background, mcp__higgsfield__job_status, mcp__higgsfield__job_display, mcp__higgsfield__balance
delegates-to:
  - guionizacion-formula100k          # ganchos textuales para los captions manuscritos
  - motion-reels-f100k                # patrón HyperFrames→alpha MP4→ffmpeg para captions+grano
  - editor-video-formula100k          # reutiliza cut_silences_and_fillers.py (corte + captions.json)
---

# Collage Cinematográfico — FÓRMULA 100K

Pipeline para convertir una grabación de Andrea en un reel con la estética **collage cinematográfico** de @andrewcodesmith: el talking-head no vive solo en pantalla, sino **compuesto en paneles** sobre **escenas temáticas generadas**, con **captions manuscritos** y **grano de película** encima.

Esta skill **es un director**: orquesta motores ya probados (corte de `editor-video`, Higgsfield para escenas/cutout, HyperFrames para captions+grano, ffmpeg para paneles). No reinventa ningún motor.

Output final: `$DEST/BORRADOR_COLLAGE.mp4` listo para retoque fino.

## El ADN del estilo (5 capas — replicar TODAS)

Referencia decodificada del reel viral "Build a second brain w Claude + Obsidian" (21K likes / 17K comentarios, @andrewcodesmith):

1. **Sujeto recortado (cutout)** — Andrea se separa del fondo y se mete DENTRO de las escenas. Dos modos:
   - **Pro (greenscreen)** → cutout real por croma; Andrea aparece literalmente dentro de la escena. Requiere que haya grabado sobre fondo verde/liso.
   - **Paneles (default, sin greenscreen)** → no se recorta a Andrea; se la enmarca en una **banda** (panel inferior) y la escena ocupa el **panel superior**. Fiel al 80% del look con cualquier grabación.
2. **Paneles horizontales apilados** — la pantalla 9:16 se parte en bandas: escena temática arriba / talking-head abajo (o fondo temático detrás del talking-head). NO un solo plano.
3. **Captions manuscritos** — tipografía **cursiva crema** para la frase ("it's time to build a second brain") + **palabra clave en verde manuscrito con subrayado/realce amarillo** ("second brain"). NO son subtítulos automáticos ni el header con trazo negro de editor-video.
4. **Color grade vintage** — desaturado, virado **verdoso/sepia**, con **grano de película** (film grain) sobre todo el frame. Es lo que une las capas y las hace ver "de una sola pieza".
5. **Motivos recurrentes** (opcionales, suben el match): mascota pixel-art, sticky notes amarillas, marcos polaroid, viñeteado. Generados con Higgsfield / reutilizados de `recursos-de-video`.

> Regla de oro: si falta el **grano + grade verdoso** (capa 4), el collage se ve como "fotos pegadas", no cinematográfico. Esa capa NO es opcional.

## Cuándo activar / NO activar

Activar cuando se cumplan AMBAS: (1) hay un video local `.mov/.mp4/.m4v/.mkv`; (2) Andrea pide ESTE look (collage cinematográfico / andrewcodesmith / escenas temáticas / second brain / paneles + captions a mano + grano).

NO activar para:
- Overlays animados estilo softgirlnocode → `motion-reels-f100k`.
- Talking-head limpio con header de trazo + caja blanca → `editor-video-formula100k`.
- Cazar B-roll real / recursos web → `recursos-de-video-formula100k`.
- Carruseles → `carrusel-render-formula100k`. Stories → `historias-a-imagenes-nanobanana`.

## Guardrails (leer antes de generar nada)

- **Costo Higgsfield:** cada escena = 1 generación de imagen. Antes de generar, correr `mcp__higgsfield__balance` y **confirmar con Andrea** el nº de escenas (default 4-6 por reel). NUNCA generar >8 sin OK explícito.
- **Greenscreen:** el modo Pro (cutout real) SOLO funciona si la grabación es sobre fondo verde/liso. Detectarlo en el Paso 1; si no lo hay, caer a modo Paneles y avisar — no prometer cutout que no se puede.
- **Validación visual obligatoria:** cada escena generada se inspecciona con `Read` sobre el `rawUrl` del job. Si la escena no ilustra el bloque del guion → regenerar (máx 3 intentos) o usar una escena más neutra. `nano_banana_2` a veces deriva del prompt.
- **NO stock, NO placeholder:** mismas reglas que `recursos-de-video` (nada de shutterstock/picsum/etc.).
- **Grano sutil:** opacidad del grain 6-12%. Pasado de ahí ensucia y baja retención. El grade verdoso no debe matar tonos de piel — clamp en piel.
- **Idempotencia:** trabajar siempre sobre `_source_cut.mov`; los assets viven en `$DEST/` y se reusan en re-render.

## Pipeline (8 pasos)

### Paso 1 — Validar input + detectar greenscreen

```bash
file "$VIDEO_PATH"
ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "$VIDEO_PATH"
# muestrear 1 frame medio para juzgar fondo
MID=$(python3 -c "import subprocess,sys;d=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nokey=1:noprint_wrappers=1','$VIDEO_PATH']));print(d/2)")
ffmpeg -ss $MID -i "$VIDEO_PATH" -vframes 1 -q:v 2 -y /tmp/cc_bg.jpg 2>/dev/null
```

`Read` el frame: ¿fondo verde/liso uniforme? → **modo Pro** posible. ¿fondo de cuarto normal? → **modo Paneles**. Confirmar el modo con Andrea vía `AskUserQuestion` (mostrar el frame y el modo detectado). Si >5 min, avisar antes de seguir.

Definir `DEST`:
```
DEST="$HOME/Documents/FORMULA100K/RECURSOS VIDEOS/$(date +%Y-%m-%d)_collage_<slug>"
mkdir -p "$DEST"
```

### Paso 2 — Cortar silencios + transcribir (reutiliza editor-video)

```bash
python3 ~/.claude/skills/editor-video-formula100k/scripts/cut_silences_and_fillers.py "$VIDEO_PATH" "$DEST"
```
Produce `$DEST/_source_cut.mov` + `$DEST/captions.json` (word-timestamps). El resto del pipeline trabaja sobre `_source_cut.mov`.

### Paso 3 — Dividir el guion en BLOQUES temáticos (1 escena por bloque)

Leer `captions.json` y partir el transcript en **4-6 bloques semánticos** (cada bloque = una idea/paso). Por bloque define:
- `keyword` — palabra única del audio que ancla el inicio del bloque (lowercase, sin puntuación, presente en `captions.json`).
- `tema_visual` — qué ESCENA cinematográfica representa el bloque (1 línea). Ej: bloque sobre "tu segundo cerebro" → "grafo de nodos tipo Obsidian flotando en la oscuridad"; bloque sobre "captura todo" → "escritorio retro con monitores CRT verdes, sala de control".
- `caption_frase` — la frase manuscrita cursiva (3-7 palabras, del audio o reformulada).
- `caption_keyword` — la palabra clave que va en verde+subrayado amarillo dentro de la frase.

Mostrar el board de bloques a Andrea con `AskUserQuestion` antes de generar imágenes (controla costo y dirección).

### Paso 3.5 — Captions: delegar ganchos a guionizacion-formula100k (opcional)

Para que las `caption_frase` peguen, invocar `guionizacion-formula100k` con el transcript pidiendo frases-gancho cortas por bloque (framework "Gancho Textual del Top 1%", sentence case, 3-7 palabras). Si la skill no está, escribirlas aplicando esas reglas y avisar.

### Paso 4 — Generar las ESCENAS temáticas (Higgsfield)

`mcp__higgsfield__balance` → confirmar nº de escenas con Andrea. Por bloque, `mcp__higgsfield__generate_image` con `nano_banana_2`, **9:16** (NUNCA auto=16:9), prompt con el ADN cinematográfico:

```
Plantilla de prompt de escena:
"<tema_visual>, cinematic still, vintage analog film look, desaturated green-sepia
color grade, soft film grain, moody volumetric lighting, retro CRT / sci-fi mission
control aesthetic, shallow depth of field, 35mm, 9:16 vertical composition, no text,
no watermark, leave the lower third darker and emptier for a talking-head panel"
```

- `Read` cada `rawUrl` y validar contra `tema_visual` (máx 3 regeneraciones). Guardar en `$DEST/escenas/escena_<n>.png`.
- **Modo Pro** además: `mcp__higgsfield__remove_background` sobre frames clave del sujeto si se quiere componer a Andrea dentro de la escena (avanzado; documentar en MANIFEST).

### Paso 5 — Componer los PANELES con ffmpeg

Para cada bloque, generar un clip compuesto con la escena arriba y el talking-head abajo. Usar el compositor:

```bash
bash ~/.claude/skills/collage-cine-f100k/scripts/compose_collage.sh "$DEST"
```

`compose_collage.sh` (ver script) hace, por bloque:
- Recorta el segmento del `_source_cut.mov` correspondiente al keyword (via `captions.json`).
- Escala el talking-head a la **banda inferior** (≈ 62% de la altura, 9:16) y la **escena** a la **banda superior** (≈ 38%), o pone la escena como **fondo completo** detrás de un talking-head recortado/enmarcado (modo Pro).
- Aplica **grade vintage** (`curves`/`colorbalance` verdoso-sepia) + **grano** (`noise`/overlay de textura) + viñeteado a TODO el frame.
- Concatena los bloques → `$DEST/_panels.mp4`.

> El grade+grano se aplica al final sobre el frame compuesto para unir las capas (capa 4 del ADN).

### Paso 6 — Captions manuscritos + grano como overlay HyperFrames (patrón motion-reels)

Reutilizar el patrón probado de `motion-reels-f100k` (HyperFrames → alpha MP4 → ffmpeg `colorkey` magenta):

1. Generar un HTML HyperFrames (`$DEST/captions.html`) con, por bloque:
   - `caption_frase` en **fuente cursiva manuscrita** (ej. "Caveat", "Gochi Hand", "Shadows Into Light") color crema `#F4ECD8`, con `data-start`/`data-duration` cronometrados al keyword.
   - `caption_keyword` resaltada en **verde manuscrito `#3CCB5A`** con **subrayado/realce amarillo** (marker sweep de HyperFrames).
   - Animación de entrada tipo scribble/handwrite (técnicas `marker sweep`, `sketchout` de HyperFrames).
   - Fondo del HTML en **magenta `#FF00FF`** (chroma) para que ffmpeg lo quite limpio.
   - Plantilla base en `templates/captions_base.html`.
2. Render:
   ```bash
   cd "$DEST" && npx hyperframes render --format mp4 --resolution portrait -o captions_overlay.mp4
   ```
3. Componer sobre `_panels.mp4` (mismo filtro que motion-reels — chroma MAGENTA, NO verde):
   ```bash
   ffmpeg -i "$DEST/_panels.mp4" -i "$DEST/captions_overlay.mp4" \
     -filter_complex \
       "[0:v]fps=30,format=yuv420p[base];
        [1:v]fps=30,format=yuv420p[ov];
        [ov]colorkey=0xFF00FF:0.3:0.1[ovk];
        [base][ovk]overlay=0:0:format=auto[outv]" \
     -map "[outv]" -map "0:1" -c:v libx264 -crf 18 -preset slow -c:a copy \
     -movflags +faststart -y "$DEST/BORRADOR_COLLAGE.mp4"
   ```
   ⚠ `fps=30,format=yuv420p` ANTES del colorkey. Chroma **magenta** (los verdes del caption se conservan). `-map "0:1"` explícito (en zsh `?` es glob).

### Paso 7 — Validación visual del resultado

Extraer 3 keyframes del `BORRADOR_COLLAGE.mp4` (25/50/75%) con ffmpeg y `Read` cada uno. Verificar: ¿se ven los paneles? ¿los captions legibles y bien cronometrados? ¿grano sutil (no sucio)? ¿piel no virada a verde? Si algo falla → ajustar el paso correspondiente y re-componer (Pasos 5/6 son idempotentes).

### Paso 8 — Escribir MANIFEST_COLLAGE.md + entregar

Escribir `$DEST/MANIFEST_COLLAGE.md` con: video fuente, modo (Pro/Paneles), bloques (keyword, tema_visual, caption_frase/keyword), rutas de escenas, y los comandos exactos para re-render. Reportar a Andrea la ruta del `BORRADOR_COLLAGE.mp4` y un resumen de qué validar en CapCut.

## Notas

- **Primera corrida del piloto:** desarrollar y endurecer `compose_collage.sh` contra el video REAL de Andrea (los offsets de banda, el grade y la opacidad del grano se calibran sobre material real, no a ciegas). Es esperado iterar el script en el piloto.
- HyperFrames y ffmpeg deben estar instalados (`hyperframes doctor`, `command -v ffmpeg`). El bootstrap de `editor-video`/`motion-reels` ya los deja listos.
- Si Andrea quiere el modo Pro (cutout real) pero no grabó en greenscreen, ofrecer: (a) re-grabar sobre fondo liso, o (b) quedarnos en modo Paneles (recomendado por defecto).
- Mantener el grade/grano CONSISTENTE entre bloques — es lo que hace que el reel se sienta de una sola pieza.
