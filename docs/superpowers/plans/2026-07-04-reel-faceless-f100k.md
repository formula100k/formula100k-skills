# reel-faceless-f100k + Clip Director — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear la skill `reel-faceless-f100k` (explainer faceless 9:16 con voz grabada por Andrea) y un motor Clip Director reutilizable que también alimente al editor de YouTube 16:9 con clips de apoyo.

**Architecture:** Skill orquestadora delgada. El valor nuevo es el **Clip Director** (reference + una lógica de clasificación por gancho) que decide, por segmento, si el visual es B-roll cinemático IA / card kinética / pixel-meme, lo genera con los motores existentes (Higgsfield, HyperFrames), y devuelve un plan + colocación. Dos consumidores: `reel-faceless-f100k` (modo `full`, los clips SON el video) y `editor-video-formula100k` (modo `support`, clips de apoyo inyectados al MANIFEST).

**Tech Stack:** Markdown SKILL.md (convención F100K), Bash + ffmpeg (composición), Higgsfield MCP (`generate_video` seedance/9:16), HyperFrames CLI + GSAP (cards/kinetic, chroma magenta `#FF00FF`), mlx-whisper (transcripción word-level local).

## Global Constraints

- **Idioma:** todo el copy y los guiones en **español neutro** (tú/tienes/aquí — nunca vos/tenés/acá).
- **Formato de salida `reel-faceless`:** solo 9:16 (1080×1920). El 16:9 se sirve vía el enganche a `editor-video`, no como salida propia.
- **Voz:** Andrea **graba** la voz. NUNCA generar voz IA ni clon.
- **Texto en pantalla:** kinético de énfasis (palabras clave), NO subtítulos completos.
- **Chroma de overlays HyperFrames:** magenta `#FF00FF` + `colorkey=0xFF00FF:0.3:0.1` (NUNCA verde, NUNCA transparent).
- **Higgsfield:** máximo 8 jobs concurrentes; declinar presets con `declined_preset_id`; manejo anti-NSFW (simplificar prompt, evitar oscuridad/intimidad).
- **Degradación elegante:** si Higgsfield no tiene créditos, el Director cae a cards/pixel o caza recursos con `recursos-de-video-formula100k`; nunca falla en seco.
- **Cierre F100K:** el guion cierra vendiendo FÓRMULA 100K (patrón de artifacts/LM).
- **Convención de skill:** frontmatter con `name`, `description` (≤1024 chars), `allowed-tools`, `metadata`. Carpeta `skills/reel-faceless-f100k/` con `SKILL.md`, `reference/`, `scripts/`.
- **Salida en disco:** `FORMULA100K/RECURSOS VIDEOS/YYYY-MM-DD_<slug>/`.

---

### Task 1: Clip Director (reference compartida)

El cerebro reutilizable. Es un documento de referencia con contrato de entrada/salida, tabla de clasificación por gancho, recetas de generación por tipo de visual, y reglas de degradación. No hay código ejecutable en esta task — el "motor" es instrucción que Claude sigue leyendo el transcript.

**Files:**
- Create: `skills/reel-faceless-f100k/reference/clip-director.md`

**Interfaces:**
- Produces (contrato que consumen Task 2 y Task 4):
  - **Entrada:** `transcript` (array word-level `{text,start,end}`), `formato` (`9:16`|`16:9`), `modo` (`full`|`support`).
  - **Salida:** `plan` = array de segmentos `{start, end, visual_type, prompt, asset_path, keyword}` donde:
    - `visual_type` ∈ `broll` | `card` | `pixel`
    - `prompt` = prompt de Higgsfield (para `broll`/`pixel`) o texto de la card (para `card`)
    - `asset_path` = ruta del clip generado (se llena tras generar)
    - `keyword` = ancla para modo `support` (verbatim del transcript); `null` en modo `full` (usa `start/end`)

- [ ] **Step 1: Escribir el reference con las 6 secciones**

Crear `skills/reel-faceless-f100k/reference/clip-director.md` con exactamente estas secciones:

1. **Contrato** — la tabla de entrada/salida de arriba, verbatim.
2. **Clasificación por gancho** (reusar la lógica de `motion-reels-f100k` Paso 3, adaptada a 3 salidas):

| Intención del segmento | `visual_type` | Señales |
|---|---|---|
| Concepto / narrativa / aspiracional / autoridad | `broll` | afirmaciones, storytelling, "imagina", "el problema es", transformación, credibilidad |
| Dato / cifra / comparación / enumeración / definición | `card` | números (K/M/%/$), "antes/ahora", "3 razones", "la clave es", listas |
| Remate / chiste / cultura pop / punchline | `pixel` | humor, referencia pop, cierre de sección con gracia |

Regla de mezcla (anti-monotonía): en un reel de 30–90s, ≥2 `visual_type` distintos y ninguno domina >60%. Si el guion es 100% conceptual, convertir el dato más claro en `card` y el remate más fuerte en `pixel`.

3. **Receta `broll`** — Higgsfield `generate_video`, `aspect_ratio` según `formato` (`"9:16"` para full, `"16:9"` para support), `model="seedance_2_0"`, `duration=5`, `resolution="1080p"`. Con avatar (foto de Andrea, medias identity) si el segmento es sobre ella; cinemático puro si es concepto abstracto. Copiar la estructura de prompt cyberpunk/cálido de `broll-vsl-formula100k` Paso 5 y las reglas anti-NSFW Paso 5.
4. **Receta `card`** — HyperFrames full-frame 1080×1920 (modo full) o overlay (modo support), fondo `#FF00FF`, reusar templates Comparison/Chapter/Quote/Kinetic de `motion-reels-f100k`. En modo `full` la card ocupa todo el frame (no zona segura); en `support` usa `SAFE_CARD_CSS`.
5. **Receta `pixel`** — pixel-art vía Higgsfield (`mcp__higgsfield__generate_image` estilo pixel / `recursos-pixel-formula100k` si está disponible) sobre chroma, o meme card. Fallback a `card` si no hay créditos.
6. **Degradación** — tabla: `sin créditos Higgsfield → card/pixel via HyperFrames`; `segmento sin clasificar → card`; `audio no transcribible → pedir regrabar tramo`.

- [ ] **Step 2: Verificar consistencia del contrato**

Run:
```bash
cd /Users/kissita/Documents/formula100k-skills
grep -c "visual_type" skills/reel-faceless-f100k/reference/clip-director.md
grep -Eic "full|support" skills/reel-faceless-f100k/reference/clip-director.md
```
Expected: `visual_type` aparece ≥4 veces (contrato + tabla + recetas); `full`/`support` documentados.

- [ ] **Step 3: Commit**

```bash
git add skills/reel-faceless-f100k/reference/clip-director.md
git commit -m "feat(reel-faceless): Clip Director reference (motor compartido)"
```

---

### Task 2: `reel-faceless-f100k/SKILL.md` (orquestador modo full)

La skill cara al usuario. Encadena guion → grabación → transcripción → Clip Director (full) → composición.

**Files:**
- Create: `skills/reel-faceless-f100k/SKILL.md`

**Interfaces:**
- Consumes: contrato del Clip Director (Task 1), `scripts/compose_faceless.sh` (Task 3, firma abajo).
- Produces: pipeline documentado que termina en `$DEST/REEL_FACELESS.mp4`.

- [ ] **Step 1: Escribir el frontmatter**

```markdown
---
name: reel-faceless-f100k
description: "Convierte un tema en un Reel 9:16 faceless (30-90s) donde Andrea GRABA la voz pero nunca sale en cámara. Pipeline: guion con gancho + retención + español neutro + cierre F100K → Andrea graba la voz leyendo el teleprompter → transcripción word-level (Whisper local) → Clip Director decide por gancho el visual de cada segmento (B-roll cinemático IA / card kinética / pixel-meme, mezcla obligatoria) → genera con Higgsfield y HyperFrames → compone visuales fullscreen + texto kinético de énfasis + la voz de Andrea + música/SFX. Salida: REEL_FACELESS.mp4. Activar cuando Andrea diga 'hazme un reel faceless de X', 'video faceless sin mi cara', 'explainer faceless', 'convierte este tema en video sin grabarme en cámara', 'reel solo con mi voz'. NO usar para talking-head con su cara (editor-video/motion-reels), VSL (broll-vsl) ni carruseles."
argument-hint: "<tema | ruta-guion.md> [--duracion=30..90] [--estetica=cyberpunk|calido|minimalista]"
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, mcp__higgsfield__generate_video, mcp__higgsfield__generate_image, mcp__higgsfield__job_status, mcp__higgsfield__media_upload, mcp__higgsfield__media_confirm, mcp__higgsfield__balance
metadata:
  version: "1.0.0"
  aspect_ratio: "9:16"
  output: "REEL_FACELESS.mp4"
---
```

- [ ] **Step 2: Escribir Cuándo activar / NO activar**

Cuándo: tema → video sin cámara; "reel faceless"; "solo mi voz". NO activar: talking-head con cara (`editor-video`/`motion-reels`), VSL (`broll-vsl`), carruseles, stories.

- [ ] **Step 3: Escribir Onboarding (auto-install)**

Copiar el bloque de auto-install de `motion-reels-f100k` (Node v22+, HyperFrames CLI, `@hyperframes/*`, ffmpeg, mlx-whisper vía `uvx`). Añadir verificación de créditos Higgsfield con `mcp__higgsfield__balance` → si 0, activar degradación (Global Constraints).

- [ ] **Step 4: Escribir el Pipeline (6 pasos)**

Documentar textualmente:
1. **Tema → guion + teleprompter.** Invocar el ADN de `guionizacion-formula100k` (estructura + hook + español neutro + cierre F100K). Longitud según `--duracion`. Guardar `$DEST/guion.md` y `$DEST/teleprompter.txt`.
2. **Andrea graba la voz** leyendo el teleprompter → `$DEST/voz.mp3` (o pedir la ruta si ya grabó).
3. **Transcripción word-level** con mlx-whisper (copiar bloque de `motion-reels-f100k` Paso 2, fuente local) → `$DEST/transcript.json`.
4. **Clip Director en modo `full`, formato `9:16`** — seguir `reference/clip-director.md`: clasificar cada segmento, mostrar el plan como tabla, confirmar mezcla ≥2 tipos, generar assets (Higgsfield en lotes de 8 con poll `job_status sync`, HyperFrames render `--format mp4`). Guardar assets en `$DEST/assets/` y llenar `asset_path` en el plan → `$DEST/plan.json`.
5. **Composición** — llamar `scripts/compose_faceless.sh "$DEST"` (Task 3).
6. **Verificar y entregar** — `open "$DEST"`, mostrar ruta + tabla del plan.

- [ ] **Step 5: Escribir Errores/fallbacks y Estructura de archivos**

Reusar la tabla de errores de `motion-reels-f100k` (HyperFrames/ffmpeg/whisper) + los de Higgsfield de `broll-vsl-formula100k`. Documentar el árbol `$DEST/` (guion.md, teleprompter.txt, voz.mp3, transcript.json, plan.json, assets/, REEL_FACELESS.mp4).

- [ ] **Step 6: Verificar frontmatter válido (description ≤1024)**

Run:
```bash
cd /Users/kissita/Documents/formula100k-skills
python3 -c "
import re
t=open('skills/reel-faceless-f100k/SKILL.md').read()
fm=re.search(r'^---\n(.*?)\n---', t, re.S).group(1)
desc=re.search(r'description:\s*\"(.*?)\"', fm, re.S).group(1)
print('description chars:', len(desc)); assert len(desc)<=1024, 'MUY LARGA'
assert 'allowed-tools' in fm and 'name: reel-faceless-f100k' in fm
print('frontmatter OK')
"
```
Expected: `description chars: <N≤1024>` y `frontmatter OK`.

- [ ] **Step 7: Commit**

```bash
git add skills/reel-faceless-f100k/SKILL.md
git commit -m "feat(reel-faceless): SKILL.md orquestador modo full 9:16"
```

---

### Task 3: `scripts/compose_faceless.sh` (composición modo full)

El único código ejecutable nuevo. Ensambla los visuales por segmento a la línea de tiempo de la voz, superpone el texto kinético (chroma magenta) y mezcla audio.

**Files:**
- Create: `skills/reel-faceless-f100k/scripts/compose_faceless.sh`
- Test: `skills/reel-faceless-f100k/scripts/test_compose.sh`

**Interfaces:**
- Consumes: `$DEST/plan.json` (de Task 2 Step 4), `$DEST/voz.mp3`, `$DEST/assets/*`, opcional `$DEST/overlays.mp4` (kinetic, chroma `#FF00FF`).
- Produces: `$DEST/REEL_FACELESS.mp4` (1080×1920, con la voz de Andrea).

- [ ] **Step 1: Escribir el test que falla**

Crear `skills/reel-faceless-f100k/scripts/test_compose.sh` — genera un `$DEST` sintético (sin Higgsfield): 2 clips de color con ffmpeg + un audio de silencio de 6s + un `plan.json` mínimo, corre `compose_faceless.sh` y verifica que sale un mp4 1080×1920.

```bash
#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$(mktemp -d)/reel_test"
mkdir -p "$DEST/assets"

# 2 clips de color 1080x1920, 3s c/u (simulan B-roll y card)
ffmpeg -f lavfi -i color=c=navy:s=1080x1920:d=3 -r 30 -y "$DEST/assets/seg0.mp4" 2>/dev/null
ffmpeg -f lavfi -i color=c=maroon:s=1080x1920:d=3 -r 30 -y "$DEST/assets/seg1.mp4" 2>/dev/null
# voz de silencio 6s
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 6 -y "$DEST/voz.mp3" 2>/dev/null
# plan.json mínimo
cat > "$DEST/plan.json" <<JSON
[
  {"start":0.0,"end":3.0,"visual_type":"broll","asset_path":"assets/seg0.mp4"},
  {"start":3.0,"end":6.0,"visual_type":"card","asset_path":"assets/seg1.mp4"}
]
JSON

bash "$DIR/compose_faceless.sh" "$DEST"

OUT="$DEST/REEL_FACELESS.mp4"
[ -f "$OUT" ] || { echo "FAIL: no se creó $OUT"; exit 1; }
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$OUT")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$OUT")
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" | cut -d. -f1)
[ "$W" = "1080" ] && [ "$H" = "1920" ] || { echo "FAIL: dimensiones $W x $H"; exit 1; }
[ "$D" -ge 5 ] || { echo "FAIL: duración $D < 5s"; exit 1; }
echo "PASS: $OUT ($W x $H, ${D}s)"
```

- [ ] **Step 2: Correr el test — debe fallar**

Run:
```bash
cd /Users/kissita/Documents/formula100k-skills
bash skills/reel-faceless-f100k/scripts/test_compose.sh
```
Expected: FAIL — `compose_faceless.sh: No such file or directory`.

- [ ] **Step 3: Escribir `compose_faceless.sh`**

```bash
#!/usr/bin/env bash
# compose_faceless.sh — ensambla el Reel faceless 9:16 desde plan.json + voz + assets.
# Uso: compose_faceless.sh <DEST>
set -euo pipefail

DEST="${1:?Uso: compose_faceless.sh <DEST>}"
PLAN="$DEST/plan.json"
VOZ="$DEST/voz.mp3"
OUT="$DEST/REEL_FACELESS.mp4"
W=1080; H=1920; FPS=30
[ -f "$PLAN" ] || { echo "[error] falta $PLAN"; exit 1; }
[ -f "$VOZ" ]  || { echo "[error] falta $VOZ";  exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# 1. Por cada segmento del plan: normalizar el asset a 1080x1920/30fps y recortarlo/estirarlo a su duración.
python3 - "$PLAN" "$DEST" "$WORK" "$W" "$H" "$FPS" <<'PY'
import json, sys, subprocess, os
plan_path, dest, work, W, H, FPS = sys.argv[1:7]
plan = json.load(open(plan_path))
concat = open(os.path.join(work, "concat.txt"), "w")
for i, seg in enumerate(plan):
    dur = round(float(seg["end"]) - float(seg["start"]), 3)
    if dur <= 0: continue
    src = os.path.join(dest, seg["asset_path"])
    out = os.path.join(work, f"norm{i}.mp4")
    # escala cubriendo el frame, recorta al centro, fuerza duración con loop+trim
    vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,"
          f"crop={W}:{H},fps={FPS},format=yuv420p")
    subprocess.run(["ffmpeg","-stream_loop","-1","-i",src,"-t",str(dur),
                    "-vf",vf,"-an","-r",FPS,"-y",out],
                   check=True, stderr=subprocess.DEVNULL)
    concat.write(f"file '{out}'\n")
concat.close()
PY

# 2. Concatenar los segmentos normalizados en la base de video.
ffmpeg -f concat -safe 0 -i "$WORK/concat.txt" -c:v libx264 -crf 18 -preset medium \
  -pix_fmt yuv420p -y "$WORK/base.mp4" 2>/dev/null

# 3. Si hay overlays kinéticos (HyperFrames chroma magenta), componerlos con colorkey.
if [ -f "$DEST/overlays.mp4" ]; then
  ffmpeg -i "$WORK/base.mp4" -i "$DEST/overlays.mp4" -filter_complex \
    "[0:v]fps=$FPS,format=yuv420p[b];[1:v]fps=$FPS,format=yuv420p[o];\
     [o]colorkey=0xFF00FF:0.3:0.1[ok];[b][ok]overlay=0:0:format=auto[v]" \
    -map "[v]" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p \
    -movflags +faststart -y "$WORK/video.mp4" 2>/dev/null
else
  cp "$WORK/base.mp4" "$WORK/video.mp4"
fi

# 4. Mezclar la voz (y música si $DEST/musica.mp3 existe) y cortar a la duración de la voz.
if [ -f "$DEST/musica.mp3" ]; then
  ffmpeg -i "$WORK/video.mp4" -i "$VOZ" -i "$DEST/musica.mp3" -filter_complex \
    "[2:a]volume=0.12[m];[1:a][m]amix=inputs=2:duration=first[a]" \
    -map "0:v" -map "[a]" -c:v copy -c:a aac -shortest \
    -movflags +faststart -y "$OUT" 2>/dev/null
else
  ffmpeg -i "$WORK/video.mp4" -i "$VOZ" -map "0:v" -map "1:a" \
    -c:v copy -c:a aac -shortest -movflags +faststart -y "$OUT" 2>/dev/null
fi

echo "[ok] $OUT"
```

- [ ] **Step 4: Correr el test — debe pasar**

Run:
```bash
cd /Users/kissita/Documents/formula100k-skills
chmod +x skills/reel-faceless-f100k/scripts/compose_faceless.sh
bash skills/reel-faceless-f100k/scripts/test_compose.sh
```
Expected: `PASS: .../REEL_FACELESS.mp4 (1080 x 1920, 6s)`.

- [ ] **Step 5: Commit**

```bash
git add skills/reel-faceless-f100k/scripts/compose_faceless.sh skills/reel-faceless-f100k/scripts/test_compose.sh
git commit -m "feat(reel-faceless): compose_faceless.sh + test de composición 9:16"
```

---

### Task 4: Enganche en `editor-video-formula100k` (modo support)

Añadir a la skill del editor una sección que llame al Clip Director en modo `support` para auto-proponer clips de apoyo e inyectarlos al MANIFEST.

**Files:**
- Modify: `skills/editor-video-formula100k/SKILL.md` (añadir sección nueva antes de "## Pipeline")

**Interfaces:**
- Consumes: `captions.json` (transcript del corte, ya existe en el editor), contrato del Clip Director (Task 1).
- Produces: filas nuevas en la sección `## B-roll` del `MANIFEST.md` con `Keyword | Archivo | Duración | Estilo`, y los clips en `$DEST/IA/broll_generado/`.

- [ ] **Step 1: Escribir la sección "## Clips de apoyo generados (Clip Director)"**

Añadir a `skills/editor-video-formula100k/SKILL.md` una sección que documente:

1. **Cuándo:** Andrea dice "genera clips de apoyo", "b-roll a medida del guion", o tras transcribir un video 16:9 largo.
2. **Cómo:** leer `captions.json`; invocar el Clip Director (`../reel-faceless-f100k/reference/clip-director.md`) en `modo=support`, `formato=16:9`; el Director **auto-propone** los momentos (conceptos/datos/ejemplos) y devuelve el plan con `keyword` verbatim del transcript.
3. **Aprobación:** mostrar la tabla propuesta y preguntar con `AskUserQuestion` ("¿Genero estos N clips de apoyo? / ajustar / ninguno").
4. **Generación:** Higgsfield `aspect_ratio="16:9"`, guardar en `$DEST/IA/broll_generado/clipNN.mp4`.
5. **Inyección al MANIFEST:** añadir filas a `## B-roll` con la keyword ancla, ruta relativa `IA/broll_generado/clipNN.mp4`, `Duración=4s`, `Estilo=monitor-photo`. Si la sección `## B-roll` no existe, crearla (formato en la sección "Formato del MANIFEST.md" de esta misma skill).
6. **Nota:** los clips son **apoyo** sobre la toma de Andrea; el editor los renderiza fullscreen por ventana corta y vuelve a la cara (regla existente de B-roll).

- [ ] **Step 2: Verificar coherencia con el formato MANIFEST existente**

Run:
```bash
cd /Users/kissita/Documents/formula100k-skills
grep -q "broil\|IA/broll_generado" skills/editor-video-formula100k/SKILL.md && echo "ruta OK"
grep -q "Clip Director" skills/editor-video-formula100k/SKILL.md && echo "sección OK"
grep -A4 "## B-roll" skills/editor-video-formula100k/SKILL.md | grep -q "Keyword" && echo "formato B-roll intacto"
```
Expected: `sección OK` y `formato B-roll intacto` (la ruta puede variar; lo clave es que la sección referencia el generador y no rompe el formato existente).

- [ ] **Step 3: Commit**

```bash
git add skills/editor-video-formula100k/SKILL.md
git commit -m "feat(editor-video): modo clips de apoyo via Clip Director (support 16:9)"
```

---

### Task 5: Verificación E2E (dry-run) + registro

Verificar el flujo de composición de punta a punta con assets sintéticos (sin quemar créditos Higgsfield) y registrar la skill.

**Files:**
- Modify: `README.md` (si lista skills) — añadir `reel-faceless-f100k`.

- [ ] **Step 1: Dry-run de composición E2E**

Run:
```bash
cd /Users/kissita/Documents/formula100k-skills
bash skills/reel-faceless-f100k/scripts/test_compose.sh
```
Expected: `PASS`.

- [ ] **Step 2: Verificar que los tres archivos clave existen y son válidos**

Run:
```bash
cd /Users/kissita/Documents/formula100k-skills
ls skills/reel-faceless-f100k/{SKILL.md,reference/clip-director.md,scripts/compose_faceless.sh}
grep -q "reel-faceless-f100k" skills/editor-video-formula100k/SKILL.md || echo "OJO: editor no referencia la skill (ok si referencia el reference path)"
grep -q "Clip Director" skills/editor-video-formula100k/SKILL.md && echo "enganche editor OK"
```
Expected: los 3 archivos listados + `enganche editor OK`.

- [ ] **Step 3: Registrar en README (si aplica)**

Leer `README.md`; si hay una lista/tabla de skills, añadir una fila para `reel-faceless-f100k` siguiendo el formato existente. Si no hay lista, omitir.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore(reel-faceless): registro en README + verificación E2E"
```

---

## Self-Review

**Spec coverage:**
- Explainer faceless 9:16, voz grabada → Task 2 (SKILL.md pipeline).
- Estilo mixto por gancho → Task 1 (tabla de clasificación 3 tipos + regla de mezcla).
- Motor compartido → Task 1 (contrato) consumido por Task 2 (full) y Task 4 (support).
- Enganche editor YouTube 16:9, auto-propone → Task 4.
- Degradación elegante, español neutro, chroma magenta, cierre F100K → Global Constraints, referenciados en Tasks 1/2.
- Composición real → Task 3 (script + test).

**Placeholder scan:** sin TBD/TODO; los code blocks del script y el test están completos.

**Type consistency:** el contrato del Clip Director (`{start,end,visual_type,prompt,asset_path,keyword}`) se usa idéntico en Task 2 Step 4 (genera `plan.json`), Task 3 Step 3 (`compose_faceless.sh` lee `start/end/asset_path`) y Task 4 (usa `keyword`). `visual_type` ∈ `broll|card|pixel` consistente en Tasks 1/2. Chroma `#FF00FF` / `colorkey=0xFF00FF:0.3:0.1` idéntico en Constraints, Task 1 receta card, y Task 3 script.
