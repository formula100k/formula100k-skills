---
name: editor-video-formula100k
description: Skill que toma un video grabado por Andrea + un MANIFEST.md (keyword-based, con header, énfasis, overlays y B-roll) y produce un BORRADOR_AUTO.mp4 listo para retoque fino. Corta silencios (>0.15s) y muletillas con precisión, transcribe word-level, y compone el preset visual "Crea contenido viral" — talking-head 9:16 con header grande con trazo negro debajo de la mitad superior, caja blanca de énfasis al centro, overlays en la parte inferior para no tapar la cara, y B-roll fullscreen estilo monitor-photo. SIN subtítulos. La sincronización es por keyword sobre el transcript (no por timestamp), así que sobrevive al corte de silencios sin remapear. Renderiza local con Remotion (gratis, sin nube). Activar cuando Andrea diga "edita este video", "auto-edita", "monta el video", "renderiza", "/render <carpeta>", "/edita <carpeta>", o cualquier variación que combine una carpeta con MANIFEST.md y la intención de producir el .mp4 final. Output: $DEST/BORRADOR_AUTO.mp4. La primera vez instala node, ffmpeg, yt-dlp, uv y Remotion vía bootstrap.
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

# Editor de Video Auto — FÓRMULA 100K

Pipeline automatizado: toma una grabación de Andrea + un `MANIFEST.md` (keyword-based) y produce `BORRADOR_AUTO.mp4` listo para retoque fino en CapCut/Premiere.

El preset visual es **"Crea contenido viral"** — talking-head 9:16 a 30fps con:
- Header persistente (2 líneas) grande, con trazo negro, debajo del cuarto superior
- **Imagen gancho** tipo pixel-avatar mascot en una esquina superior durante los primeros ~2.5s (sin tapar la cara)
- Caja blanca de énfasis en la zona inferior (anclada a keywords del transcript)
- Overlays gráficos en la parte inferior del frame — **pixel-avatar mascot** generado o **screenshots** del usuario (anclados a keywords, no tapan la cara)
- B-roll fullscreen estilo `monitor-photo` (anclados a keywords)
- **SFX "pop"** dispara automáticamente al aparecer cada imagen (hook, overlays, B-roll)
- **Sin subtítulos** — la cara y los gráficos llevan todo el peso visual

**Diferencia clave con la versión anterior:** los cues se anclan por **keyword** sobre el transcript del video cortado, no por timestamp. Eso significa que `_source_cut.mov` puede regenerarse cuantas veces haga falta sin tener que remapear nada — los keywords resuelven contra el `captions.json` del corte vigente.

## Cuándo activar

Cuando el usuario:
- Pide auto-edición: "edita", "monta", "compón", "renderiza", "auto-edita"
- Usa atajos `/render <carpeta>` o `/edita <carpeta>`
- Acaba de correr `recursos-de-video-formula100k` y la skill cazadora dejó un `MANIFEST.md`

Requisitos:
- Una carpeta `$DEST` con `MANIFEST.md` (típicamente `/FORMULA100K/RECURSOS VIDEOS/<fecha>_<slug>/`)
- La ruta del video fuente (`.mov`/`.mp4`) — del campo `**Video fuente:**` del MANIFEST o pedirla al usuario

## NO activar para

- Cazar recursos web / generar IA → `recursos-de-video-formula100k`
- Gráficos sueltos → `graficos-de-video-formula100k`
- Carruseles → `carrusel-render-formula100k`
- Stories → `historias-a-imagenes-nanobanana`
- Miniaturas → `miniatura-youtube-formula100k`

## Primera vez: bootstrap

```bash
bash /Users/kissita/.claude/skills/editor-video-formula100k/scripts/bootstrap.sh
```

Instala Homebrew (precondición), Node 18+, ffmpeg, yt-dlp, uv (para `uvx mlx-whisper`) y `npm install` del template Remotion. ~5-8 min en Mac limpia, sólo una vez. `render.sh` lo invoca automáticamente si detecta que falta algo.

## Pipeline (un solo comando)

```bash
bash /Users/kissita/.claude/skills/editor-video-formula100k/scripts/render.sh "$DEST" "$VIDEO_PATH"
```

Lo que hace `render.sh` internamente:

1. **Corte de silencios + transcripción** (`cut_silences_and_fillers.py`) — sólo si `_source_cut.mov` y `captions.json` no existen aún. Produce:
   - `_source_cut.mov` — video cortado **agresivamente** (silencios > 0.15s y muletillas `eh/em/uhh/...` removidos, padding mínimo de 25ms para no clipar consonantes)
   - `edl.json` — mapping orig→nuevo tiempo (no se usa en el pipeline nuevo pero queda para debugging)
   - `captions.json` — word-timestamps del CUT video (no del original)

2. **MANIFEST.md → cues.json** (`manifest_to_cues.py`) — parsea las secciones Header, Énfasis, Overlays, B-roll del MANIFEST y emite `cues.json`. Si `captions.json` existe, avisa con `[warn]` si alguna keyword no aparece en el transcript.

3. **Setup de `public/`** — hard-link de `WEB/`, `IA/` y `_source_cut.mov` dentro del template Remotion para que `staticFile()` los resuelva.

4. **Render** (`scripts/render.ts` con `tsx`) — bundlea con `@remotion/bundler`, selecciona la composición `reel-viral`, infiere `durationInFrames` del último `word.end`, llama `renderMedia()` con codec h264. Output: `$DEST/BORRADOR_AUTO.mp4`.

Tiempo típico: ~3-5 min por minuto de video fuente en Apple Silicon. El render es 1080×1920 @ 30fps.

---

## Formato del MANIFEST.md (keyword-based)

Todos los cues se anclan a **keywords del transcript**. El parser busca la primera ocurrencia de la keyword (case-insensitive, tolerante a acentos y puntuación) en `captions.json` y dispara el cue ahí.

### Esqueleto mínimo

```markdown
# Reel — <título corto>

- **Video fuente:** /Users/kissita/Downloads/IMG_1969.MOV
- **Fecha:** 2026-05-13

## Header

- **Línea 1:** Publica todos
- **Línea 2:** los días sin perfección

## Gancho visual

- **Archivo:** `IA/HOOK_perfeccion_tachada.png`
- **Posición:** right
- **Inicio:** 0.3
- **Duración:** 2.2
- **Ancho:** 380
- **Rotación:** 3

## Énfasis

| Keyword     | Texto en caja blanca   | Duración |
|-------------|------------------------|----------|
| perfección  | Olvida la perfección   | 1.6      |
| japer       | Yapper Method          | 1.8      |
| automatizar | Automatiza todo        | 1.6      |
| comenta     | Comenta 100K           | 2.0      |

## Overlays

| Keyword     | Archivo                                       | Ancho | Duración |
|-------------|-----------------------------------------------|-------|----------|
| deteniendo  | `IA/T1_G1_perfeccion_tachada_0000-0012.png`   | 480   | 2.4      |
| Japer       | `IA/T2_G1_yappermethod_ideas_0012-0027.png`   | 480   | 2.4      |
| Cloud       | `IA/T3_G1_auto_edicion_claude_0027-0042.png`  | 480   | 2.4      |

## B-roll

| Keyword     | Archivo                                | Duración | Estilo        |
|-------------|----------------------------------------|----------|---------------|
| internet    | `WEB/google/pinterest_clip.mp4`        | 3.0      | monitor-photo |
```

### Reglas por sección

**Header** — Líneas 1 y 2. Persistente durante todo el reel. Inter 800 92px, blanco con trazo negro 6px (`WebkitTextStroke`), sombra suave, centrado horizontal, anclado a `paddingTop: 280` (debajo del cuarto superior para no chocar con la frente de Andrea).

**Gancho visual** — Imagen tipo sticker (UN solo archivo) que aparece en los primeros segundos en una esquina superior. Columnas: `Archivo | Posición | Inicio | Duración | Ancho | Rotación`. Defaults: `Posición=right`, `Inicio=0.3s`, `Duración=2.2s`, `Ancho=360px`, `Rotación=3°`. Anclado a `top: 340px` para no chocar con el header. Spring drop desde fuera del frame + wobble sutil + fade out. NO cubre la cara centrada (zona segura x≥640 si position=right).

**Énfasis** — Columnas (en orden): `Keyword | Texto | Duración | Offset`. Defaults: `Duración = 1.6s`, `Offset = 0`. La caja blanca aparece en la parte inferior del frame (`bottom: 220`), Inter 800 84px, sombra suave + sombra base estilo "stack". Mientras hay énfasis activo, los overlays se ocultan automáticamente para no superponerse.

**Overlays** — Columnas: `Keyword | Archivo | Ancho | Duración`. Defaults: `Ancho = 420px`, `Duración = 2.0s`. El path es relativo a `$DEST/` (ej. `IA/...` o `WEB/...`). Renderiza en la parte inferior del frame (`bottom: 180`) para no tapar la cara de Andrea, con spring de entrada y float loop sutil. Si hay un énfasis activo en cualquier frame mientras el overlay vive, se oculta (opacity 0).

**B-roll** — Columnas: `Keyword | Archivo | Duración | Estilo`. Defaults: `Duración = 3.0s`, `Estilo = monitor-photo`. Fullscreen sobre el video base con `object-fit: cover`. Estilo `monitor-photo` añade `rotate(-1.2deg)` + gradiente radial blanco al 8% para simular reflejo de pantalla; `clean` no agrega nada. El header **sigue visible** sobre el B-roll.

### Sincronización por keyword

Cada cue resuelve su `t_start` así:
```
t_start = findKeywordTime(transcript, keyword) + (startOffset || 0)
t_end   = t_start + duration
```

`findKeywordTime` normaliza (lowercase, sin acentos, sin puntuación) y busca la primera coincidencia parcial en el transcript. Si la keyword no aparece, el cue se descarta silenciosamente (y `manifest_to_cues.py` ya habrá avisado con `[warn]`).

### Reglas de oro de la composición

1. El **header NUNCA desaparece**.
2. **Emphasis excluye overlay** — ambos viven en la zona inferior, así que si coinciden en un frame gana el emphasis. El overlay se oculta con `opacity: 0` durante toda la ventana de emphasis solapada.
3. **La cara de Andrea queda libre** — ni emphasis ni overlays se renderizan en la mitad central del frame.
4. **Sin subtítulos quemados.** Si el usuario los quiere los pone en post.
5. **Sentence case** en cajas blancas — NUNCA all caps.

### Subtítulos

- **Desactivados.** El preset no quema subtítulos sobre el video — la cara de Andrea + el header + los énfasis llevan el peso textual.
- Si el usuario quiere subtítulos, los agrega en CapCut/Premiere encima del `BORRADOR_AUTO.mp4`.

---

## Atajos conversacionales

- `/render <carpeta>` → pipeline completo. Auto-detecta el video fuente desde `**Video fuente:**` del MANIFEST.
- `/edita <carpeta>` → equivalente.
- `/setup` → corre `bootstrap.sh` para instalar/verificar dependencias.

Para invocación natural ("edita este video"), preguntar al usuario por la carpeta DEST si no es obvia.

---

## Iteración

**Cambiar un cue:**
1. Editar la fila correspondiente en `MANIFEST.md` (cambiar keyword, texto, duración, o el archivo)
2. Re-correr `render.sh` (el corte se saltea porque `_source_cut.mov` ya existe; el render reusa los assets de `public/`)

**Re-cortar con regla diferente** (ej. incluir más muletillas):
1. Editar `FILLER_REGEX` en `scripts/cut_silences_and_fillers.py`
2. Borrar `_source_cut.mov` y `captions.json` del DEST
3. Re-correr `render.sh` (re-genera el corte y los captions, los keywords se re-resuelven contra el nuevo transcript)

**Cambiar estética visual** (tamaños, posiciones, animaciones, fuente):
1. Editar `remotion-template/src/CreaContenidoViral.tsx`
2. Re-correr `render.sh` (saltea corte, regenera cues + render)

**Probar un solo cambio en cues sin re-bundlear nada de Python:**
```bash
cd /Users/kissita/.claude/skills/editor-video-formula100k/remotion-template
npx tsx scripts/render.ts \
  --video _source_cut.mov \
  --transcript "$DEST/captions.json" \
  --cues "$DEST/cues.json" \
  --out "$DEST/BORRADOR_AUTO.mp4"
```

---

## Errores y fallbacks

| Error | Acción |
|-------|--------|
| `bootstrap.sh --check` reporta Homebrew faltante | Mostrar URL oficial al usuario y abortar |
| `bootstrap.sh` falla al instalar Remotion (npm cache corrupto) | El script usa `--cache=/tmp/npm-cache-kissita`. Si persiste: `sudo chown -R 501:20 ~/.npm` o borrar `~/.npm` |
| `manifest_to_cues.py` reporta keywords sin match | La keyword no aparece en `captions.json`. Editar el MANIFEST con una palabra que sí esté en el transcript |
| Remotion falla con "Can only download URLs starting with http:// or https://" | El path del asset salió de `public/`. Verificar que `WEB/`/`IA/` y `_source_cut.mov` estén hard-linkeados al template (lo hace `render.sh`) |
| Carpeta destino sin `MANIFEST.md` | Necesita correr antes `recursos-de-video-formula100k` o armar el MANIFEST a mano |

---

## Estructura de archivos generados (en $DEST)

```
$DEST/
├── MANIFEST.md              ← editado por el usuario (no se modifica en render)
├── _source_cut.mov          ← video cortado (sin silencios/muletillas)
├── edl.json                 ← mapping orig→nuevo tiempo (debugging)
├── captions.json            ← word-timestamps del video cortado
├── cues.json                ← input para Remotion (regenerado cada render)
├── BORRADOR_AUTO.mp4        ← OUTPUT FINAL
├── WEB/                     ← recursos web (no se toca)
└── IA/                      ← recursos generados con IA (no se toca)
```

---

## Diferencias con otras skills

| Aspecto | recursos-de-video | editor-video (esta) | graficos-de-video |
|---------|-------------------|---------------------|-------------------|
| Output principal | MANIFEST.md + WEB/ + IA/ | BORRADOR_AUTO.mp4 | PNG scrapbook sueltos |
| Necesita MANIFEST | ❌ (lo genera) | ✅ (lo consume) | ❌ |
| Necesita Remotion | ❌ | ✅ | ❌ |
| Edita video | ❌ | ✅ | ❌ |
| Caza web | ✅ | ❌ | ❌ |
| Tiempo típico | 3-8 min | 4-8 min | 1-2 min |
