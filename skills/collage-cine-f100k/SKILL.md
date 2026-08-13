---
name: collage-cine-f100k
description: "Convierte un video grabado por el usuario en un reel estilo COLLAGE CINEMATOGRÁFICO (estética @andrewcodesmith): el talking-head se compone en paneles apilados sobre ESCENAS temáticas generadas (grafo de Obsidian, sala de control retro), con captions MANUSCRITOS (cursiva crema + palabra clave verde subrayada en amarillo) y grano de película vintage encima. Es el look 'second brain / sci-fi analógico': desaturado verdoso, paneles horizontales, sujeto recortado metido en escenas. Activar SIEMPRE que el usuario pase un .mov/.mp4 y diga 'hazme el estilo collage cinematográfico', 'estilo andrewcodesmith', 'mete mi cara en escenas temáticas', 'el look del second brain', 'collage cine', 'paneles apilados con escenas', 'captions a mano + grano vintage', o combine un video grabado con la intención de ese look compositeado-cinematográfico. NO confundir con editor-video-formula100k (talking-head normal) ni motion-takeover-f100k."
disable-model-invocation: true
argument-hint: "[ruta del video .mov/.mp4]"
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill, mcp__higgsfield__generate_image, mcp__higgsfield__remove_background, mcp__higgsfield__job_status, mcp__higgsfield__job_display, mcp__higgsfield__balance
delegates-to:
  - guionizacion-formula100k          # ganchos textuales para los captions manuscritos
  - motion-reels-f100k                # patrón HyperFrames→alpha MP4→ffmpeg para captions+grano
  - editor-video-formula100k          # reutiliza cut_silences_and_fillers.py (corte + captions.json)
---

# Collage Cinematográfico — FÓRMULA 100K

Pipeline para convertir una grabación del usuario en un reel con la estética **collage cinematográfico** de @andrewcodesmith: el talking-head no vive solo en pantalla, sino **compuesto en paneles** sobre **escenas temáticas generadas**, con **captions manuscritos** y **grano de película** encima.

Esta skill **es un director**: orquesta motores ya probados (corte de `editor-video`, Higgsfield para escenas/cutout, HyperFrames para captions+grano, ffmpeg para paneles). No reinventa ningún motor.

Output final: `$DEST/BORRADOR_COLLAGE.mp4` listo para retoque fino.

## El ADN del estilo (5 capas — replicar TODAS)

Referencia decodificada del reel viral "Build a second brain w Claude + Obsidian" (21K likes / 17K comentarios, @andrewcodesmith):

1. **Sujeto recortado (cutout)** — El usuario se separa del fondo y se mete DENTRO de las escenas. El cutout se hace con **HyperFrames `remove-background` (LOCAL, GRATIS, sin créditos Higgsfield)** — modelo `u2net_human_seg` específico para personas, así que **NO hace falta greenscreen**: segmenta al usuario sobre cualquier fondo de cuarto. Funciona sobre la **imagen** (PNG) y sobre el **video completo** (`.webm` con alpha). Tras recortar, SIEMPRE pasar `trim_cutout.py` para **ajustar al ras del sujeto** (recorta el margen transparente sobrante; sin esto queda "demasiado espacio alrededor de la persona" — bug del piloto). Dos modos:
   - **Cutout/Collage (recomendado)** → la persona recortada se compone DENTRO del collage (sobre las escenas/cards). Ya no requiere greenscreen.
   - **Paneles (fallback rápido)** → no se recorta al usuario; se la enmarca en una **banda** (panel inferior) y la escena/collage ocupa el **panel superior**. Útil si el cutout sale sucio por iluminación pobre.
2. **Paneles horizontales apilados** — la pantalla 9:16 se parte en bandas: escena temática arriba / talking-head abajo (o fondo temático detrás del talking-head). NO un solo plano.
3. **Captions manuscritos** — tipografía **cursiva crema** para la frase ("it's time to build a second brain") + **palabra clave resaltada con highlighter amarillo sólido y tinta OSCURA** ("second brain"). NO son subtítulos automáticos ni el header con trazo negro de editor-video. ⚠ **LEGIBILIDAD (bug del piloto):** PROHIBIDO verde fosforescente (`#3CCB5A`) sobre amarillo — verde sobre amarillo NO se lee. El realce es amarillo `#F2D23A` **sólido cubriendo toda la palabra** + texto oscuro `#16240A` (casi negro). El resto de la frase, crema sobre la escena.
4. **Color grade vintage** — desaturado, virado **verdoso/sepia**, con **grano de película** (film grain) sobre todo el frame. Es lo que une las capas y las hace ver "de una sola pieza".
5. **Motivos recurrentes** (opcionales, suben el match): mascota pixel-art, sticky notes amarillas, marcos polaroid, viñeteado. Generados con Higgsfield / reutilizados de `recursos-de-video`.

> Regla de oro: si falta el **grano + grade verdoso** (capa 4), el collage se ve como "fotos pegadas", no cinematográfico. Esa capa NO es opcional.

## Cuándo activar / NO activar

Activar cuando se cumplan AMBAS: (1) hay un video local `.mov/.mp4/.m4v/.mkv`; (2) el usuario pide ESTE look (collage cinematográfico / andrewcodesmith / escenas temáticas / second brain / paneles + captions a mano + grano).

NO activar para:
- Overlays animados estilo softgirlnocode → `motion-reels-f100k`.
- Talking-head limpio con header de trazo + caja blanca → `editor-video-formula100k`.
- Cazar B-roll real / recursos web → `recursos-de-video-formula100k`.
- Carruseles → `carrusel-render-formula100k`. Stories → `historias-a-imagenes-nanobanana`.

## Guardrails (leer antes de generar nada)

- **Costo Higgsfield:** cada imagen generada = 1 crédito. Un **collage rico** necesita VARIAS imágenes por bloque (escena base + 2-4 props/cards), no 1 sola — por eso el piloto con 6 imágenes quedó pobre. Default: **escena base + 2-3 props por bloque** (≈ 12-20 imágenes en un reel de 5-6 bloques). Correr `mcp__higgsfield__balance`, **mostrar el presupuesto y el nº total al usuario** antes de generar, y generar en tandas. Si el saldo no alcanza, reusar props entre bloques y avisar.
- **Cutout = GRATIS y local:** el recorte del usuario NO usa Higgsfield ni greenscreen — es `npx hyperframes remove-background` (modelo humano `u2net_human_seg`). No prometer ni gastar créditos en cutout. Si el cutout sale sucio (pelo/bordes) por iluminación pobre, caer a modo Paneles.
- **Validación visual obligatoria:** cada escena generada se inspecciona con `Read` sobre el `rawUrl` del job. Si la escena no ilustra el bloque del guion → regenerar (máx 3 intentos) o usar una escena más neutra. `nano_banana_2` a veces deriva del prompt.
- **NO stock, NO placeholder:** mismas reglas que `recursos-de-video` (nada de shutterstock/picsum/etc.).
- **Grano sutil:** opacidad del grain 6-12%. Pasado de ahí ensucia y baja retención. El grade verdoso no debe matar tonos de piel — clamp en piel.
- **Idempotencia:** trabajar siempre sobre `_source_cut.mov`; los assets viven en `$DEST/` y se reusan en re-render.

## Pipeline (8 pasos)

### Paso 1 — Validar input + elegir modo

```bash
file "$VIDEO_PATH"
ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "$VIDEO_PATH"
# muestrear 1 frame medio para juzgar fondo
MID=$(python3 -c "import subprocess,sys;d=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nokey=1:noprint_wrappers=1','$VIDEO_PATH']));print(d/2)")
ffmpeg -ss $MID -i "$VIDEO_PATH" -vframes 1 -q:v 2 -y /tmp/cc_bg.jpg 2>/dev/null
```

`Read` el frame: el cutout local funciona sobre cualquier fondo, así que el modo **Cutout/Collage es el default**. Solo caé a **Paneles** si el sujeto está mal separado del fondo (contraluz, fondo del mismo tono que la ropa/pelo) — eso ensucia el recorte. Confirmar el modo con el usuario vía `AskUserQuestion` (mostrar el frame y el modo recomendado). Si >5 min, avisar antes de seguir.

Definir `DEST`:
```
DEST="$HOME/Documents/FORMULA100K/RECURSOS VIDEOS/$(date +%Y-%m-%d)_collage_<slug>"
mkdir -p "$DEST"
```

### Paso 2 — Cortar silencios + transcribir (reutiliza editor-video)

```bash
python3 ~/.claude/skills/editor-video-formula100k/scripts/cut_silences_and_fillers.py \
  "$VIDEO_PATH" "$DEST" --semantic-level ajustado
```
Produce `$DEST/_source_cut.mov` + `$DEST/captions.json` (word-timestamps). El resto del pipeline trabaja sobre `_source_cut.mov`.

> ⚠ **Usar `--semantic-level ajustado` SIEMPRE en collage.** El default del cutter es `conservador` (quita solo tomas falladas literales); en video grabado limpio casi no corta y el reel queda largo/flojo (bug del piloto: 130.7s→114.8s, solo 6%). `ajustado` además recorta preámbulos de arranque, divagaciones/apartes tangenciales y re-enunciados redundantes — protegiendo gancho, pasos, datos y CTA — para un reel apretado y dinámico (≈2-3× más recorte). Si querés el corte mínimo de seguridad, omití el flag.

### Paso 3 — Dividir el guion en BLOQUES temáticos (collage por bloque)

Leer `captions.json` y partir el transcript en **4-6 bloques semánticos** (cada bloque = una idea/paso). Por bloque define:
- `keyword` — palabra única del audio que ancla el inicio del bloque (lowercase, sin puntuación, presente en `captions.json`).
- `tema_visual` — la ESCENA base del bloque (1 línea). Ej: "grafo de nodos tipo Obsidian flotando en la oscuridad".
- `props` — **2-3 piezas extra** que enriquecen el collage del bloque (NO una sola escena plana — ese fue el bug del piloto "pobre"). Cada prop es un objeto recortable: ej. "sticky note amarilla manuscrita", "monitor CRT verde retro", "icono pixel-art de cerebro", "polaroid de un escritorio". Estas se montan como cards encima de la escena base.
- `caption_frase` — la frase manuscrita cursiva (3-7 palabras, del audio o reformulada).
- `caption_keyword` — la palabra que va resaltada (highlighter amarillo + tinta oscura) dentro de la frase.

Mostrar el board de bloques + el **nº total de imágenes y el costo** al usuario con `AskUserQuestion` antes de generar (controla costo y dirección).

### Paso 3.5 — Captions: delegar ganchos a guionizacion-formula100k (opcional)

Para que las `caption_frase` peguen, invocar `guionizacion-formula100k` con el transcript pidiendo frases-gancho cortas por bloque (framework "Gancho Textual del Top 1%", sentence case, 3-7 palabras). Si la skill no está, escribirlas aplicando esas reglas y avisar.

### Paso 4 — Generar las imágenes del collage (Higgsfield)

`mcp__higgsfield__balance` → confirmar nº TOTAL de imágenes + costo con el usuario (recordá: escena base + 2-3 props por bloque, no 1 sola). Generar con `nano_banana_2`, **9:16** (NUNCA auto=16:9):

- **Escenas base** (1 por bloque) — prompt con el ADN cinematográfico:
  ```
  "<tema_visual>, cinematic still, vintage analog film look, desaturated green-sepia
  color grade, soft film grain, moody volumetric lighting, retro CRT / sci-fi mission
  control aesthetic, shallow depth of field, 35mm, 9:16 vertical composition, no text,
  no watermark, leave the lower third darker and emptier for a talking-head panel"
  ```
  Guardar en `$DEST/escenas/escena_<n>.png`.
- **Props/cards** (2-3 por bloque) — objeto aislado, **fondo plano** para recortar limpio:
  ```
  "<prop>, single object, centered, plain dark neutral background, vintage analog film
  look, slight film grain, 9:16, no text, no watermark, isolated for cutout"
  ```
  Recortar con `npx hyperframes remove-background props/x.png -o props/x.png` (deja el prop con alpha) → `$DEST/props/`.
- `Read` cada `rawUrl` y validar contra `tema_visual`/`prop` (máx 3 regeneraciones). `nano_banana_2` a veces deriva del prompt.

### Paso 4.5 — Cutout del usuario + recorte al ras (LOCAL, gratis)

```bash
# recortar al usuario del video completo (sin greenscreen, modelo humano)
npx hyperframes remove-background "$DEST/_source_cut.mov" -o "$DEST/sujeto.webm" --quality balanced
# ajustar al RAS del sujeto (quita el margen transparente sobrante; arregla "demasiado espacio")
python3 ~/.claude/skills/collage-cine-f100k/scripts/trim_cutout.py vid "$DEST/sujeto.webm" "$DEST/sujeto_trim.webm"
```
Si el cutout sale sucio (pelo/bordes) → caer a modo Paneles (sin cutout). Para props PNG el mismo script en modo `img`.

### Paso 5 — Armar el COLLAGE backdrop + componer

**(a) Backdrop de collage por bloque** — apila escena base + props como cards (no 1 foto plana):
```bash
python3 ~/.claude/skills/collage-cine-f100k/scripts/build_collage_backdrop.py "$DEST" "$DEST/collage_blocks.json"
```
`collage_blocks.json` = una entrada por bloque (ver cabecera del script: `pieces` con `fill`/`card`, `cx/cy/w/rot/polaroid`, `subject_zone`). Esto produce `$DEST/collage/bloque_<n>.png`.

**(b) Componer** — dos caminos según el modo:
- **Cutout/Collage:** sobre cada `collage/bloque_<n>.png` se superpone el cutout `sujeto_trim.webm` (escalado a la `subject_zone`) con ffmpeg, + grade+grano sobre TODO el frame.
- **Paneles (fallback):** usar el compositor de bandas (escena/collage arriba, talking-head abajo):
  ```bash
  python3 ~/.claude/skills/collage-cine-f100k/scripts/compose_blocks.py "$DEST" "$DEST/blocks.json"
  ```
  `blocks.json = [{"start": seg, "scene": "collage/bloque_0.png"}, ...]` (la "scene" ahora apunta al collage, no a una escena plana). Salida → `$DEST/_panels.mp4`.

> El grade+grano se aplica al final sobre el frame compuesto para unir las capas (capa 4 del ADN). `compose_blocks.py` ya lo hace; en modo Cutout aplicarlo en el mismo filter_complex tras el overlay.

### Paso 6 — Captions manuscritos + grano como overlay HyperFrames (patrón motion-reels)

Reutilizar el patrón probado de `motion-reels-f100k` (HyperFrames → alpha MP4 → ffmpeg `colorkey` magenta):

1. Generar un HTML HyperFrames (`$DEST/captions.html`) con, por bloque:
   - `caption_frase` en **fuente cursiva manuscrita** (ej. "Caveat", "Gochi Hand", "Shadows Into Light") color crema `#F4ECD8`, con `data-start`/`data-duration` cronometrados al keyword.
   - `caption_keyword` resaltada con **highlighter amarillo `#F2D23A` SÓLIDO (cubre toda la palabra) + tinta oscura `#16240A`** — LEGIBLE. ⚠ NUNCA verde fosforescente sobre amarillo (no se lee; bug del piloto). Entrada tipo marker sweep de HyperFrames sobre el amarillo.
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

Escribir `$DEST/MANIFEST_COLLAGE.md` con: video fuente, modo (Pro/Paneles), bloques (keyword, tema_visual, caption_frase/keyword), rutas de escenas, y los comandos exactos para re-render. Reportar al usuario la ruta del `BORRADOR_COLLAGE.mp4` y un resumen de qué validar en CapCut.

## Notas

- **Compositores:** `compose_blocks.py` (modo Paneles: vstack collage/talking-head + grade+grano) y `build_collage_backdrop.py` (arma el collage PIL por bloque). `compose_collage.sh` quedó obsoleto (era single-scene). Los offsets, el grade y la opacidad del grano se calibran sobre material real.
- HyperFrames y ffmpeg deben estar instalados (`hyperframes doctor`, `command -v ffmpeg`). El bootstrap de `editor-video`/`motion-reels` ya los deja listos.
- El cutout (HyperFrames) ya NO necesita greenscreen; si sale sucio por iluminación, caer a Paneles.
- Mantener el grade/grano CONSISTENTE entre bloques — es lo que hace que el reel se sienta de una sola pieza.
