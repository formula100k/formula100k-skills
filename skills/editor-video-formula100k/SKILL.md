---
name: editor-video-formula100k
description: Skill que toma un video grabado por Andrea + un MANIFEST.md (keyword-based, con header, énfasis, overlays y B-roll) y produce un BORRADOR_AUTO.mp4 listo para retoque fino. Corta silencios y muletillas, transcribe word-level, y compone el preset visual "Crea contenido viral" — talking-head 9:16 con header persistente arriba a la izquierda, caja blanca de énfasis al centro, overlays sobre el pecho, B-roll fullscreen estilo monitor-photo, y subtítulos word-level abajo. La sincronización es por keyword sobre el transcript (no por timestamp), así que sobrevive al corte de silencios sin remapear. Renderiza local con Remotion (gratis, sin nube). Activar cuando Andrea diga "edita este video", "auto-edita", "monta el video", "renderiza", "/render <carpeta>", "/edita <carpeta>", o cualquier variación que combine una carpeta con MANIFEST.md y la intención de producir el .mp4 final. Output: $DEST/BORRADOR_AUTO.mp4. La primera vez instala node, ffmpeg, yt-dlp, uv y Remotion vía bootstrap.
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

# Editor de Video Auto — FÓRMULA 100K

Pipeline automatizado: toma una grabación de Andrea + un `MANIFEST.md` (keyword-based) y produce `BORRADOR_AUTO.mp4` listo para retoque fino en CapCut/Premiere.

El preset visual es **"Crea contenido viral"** — talking-head 9:16 a 30fps con:
- Header persistente (2 líneas) centrado arriba
- **Imagen gancho** tipo sticker editorial en una esquina superior durante los primeros ~2.5s (sin tapar la cara)
- Caja blanca de énfasis al centro (anclada a keywords del transcript)
- Overlays gráficos sobre el pecho (~58% Y, anclados a keywords)
- B-roll fullscreen estilo `monitor-photo` (anclados a keywords)
- Subtítulos word-level estilo CapCut al pie

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
   - `_source_cut.mov` — video cortado (silencios > 0.45s y muletillas `eh/em/uhh/...` removidos, padding de 60ms para no clipar consonantes)
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

**Header** — Líneas 1 y 2. Persistente durante todo el reel. Inter 800 64px, blanco con sombra, centrado horizontal, anclado a `paddingTop: 140`.

**Gancho visual** — Imagen tipo sticker (UN solo archivo) que aparece en los primeros segundos en una esquina superior. Columnas: `Archivo | Posición | Inicio | Duración | Ancho | Rotación`. Defaults: `Posición=right`, `Inicio=0.3s`, `Duración=2.2s`, `Ancho=360px`, `Rotación=3°`. Anclado a `top: 340px` para no chocar con el header. Spring drop desde fuera del frame + wobble sutil + fade out. NO cubre la cara centrada (zona segura x≥640 si position=right).

**Énfasis** — Columnas (en orden): `Keyword | Texto | Duración | Offset`. Defaults: `Duración = 1.6s`, `Offset = 0`. La caja blanca aparece al centro (54% Y), Inter 800 84px, sombra suave + sombra base estilo "stack". Mientras hay énfasis activo, los overlays se ocultan automáticamente.

**Overlays** — Columnas: `Keyword | Archivo | Ancho | Duración`. Defaults: `Ancho = 420px`, `Duración = 2.0s`. El path es relativo a `$DEST/` (ej. `IA/...` o `WEB/...`). Renderiza al ~58% Y (sobre el pecho de Andrea), con spring de entrada y float loop sutil. Si hay un énfasis activo en cualquier frame mientras el overlay vive, se oculta (opacity 0).

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
2. **Emphasis excluye overlay** — si ambos coinciden en un frame, gana el emphasis. El overlay se oculta con `opacity: 0` durante toda la ventana de emphasis solapada.
3. **Los subtítulos word-level siempre van encima de todo.**
4. **Cada 7s máximo debe ocurrir un cambio visual.** Si entre dos cues consecutivos hay > 7s, el componente inserta automáticamente un emphasis "auto-recap" con el texto del último emphasis (a la mitad del gap).
5. **Sentence case** en cajas blancas y captions — NUNCA all caps.

### Subtítulos word-level

- Se generan automáticamente desde `captions.json` (no se configuran en MANIFEST)
- Inter 800 72px, blanco con stroke negro de 5px, anclados a `bottom: 280`
- Cut in/out duro (sin animación), texto en minúsculas
- Agrupa hasta 3 palabras consecutivas cuando la duración total < 0.6s

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
