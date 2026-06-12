---
name: editor-video-formula100k
description: >
  Toma un video grabado por Andrea + un MANIFEST.md (keyword-based: header, énfasis, overlays, B-roll) y produce un BORRADOR_AUTO.mp4 listo para retoque. Corta silencios, muletillas y repeticiones (transcribe word-level) y compone el preset "Crea contenido viral": talking-head 9:16, header con trazo negro (gancho primeros 8s), caja blanca de énfasis, overlays inferiores que no tapan la cara, B-roll videos fullscreen y B-roll imágenes en la parte inferior. SIN subtítulos. Sincroniza por keyword sobre el transcript, así sobrevive al corte de silencios. Renderiza local con Remotion (gratis). EXTRA: genera motion graphics animados (badge deslizante, browser con pasos, typing, contador, kinetic type) con HyperFrames y los agrega al MANIFEST. Activar cuando Andrea diga "edita este video", "auto-edita", "monta el video", "renderiza", "/render <carpeta>", "/edita <carpeta>", "genera un motion graphic", "overlay animado", o combine una carpeta con MANIFEST.md. Output: $DEST/BORRADOR_AUTO.mp4. macOS y Windows.
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

# Editor de Video Auto — FÓRMULA 100K

Pipeline automatizado: toma una grabación de Andrea + un `MANIFEST.md` (keyword-based) y produce `BORRADOR_AUTO.mp4` listo para retoque fino en CapCut/Premiere.

El preset visual es **"Crea contenido viral"** — talking-head 9:16 a 30fps con:
- Header persistente (2 líneas) grande, con trazo negro, debajo del cuarto superior
- **Imagen gancho** tipo pixel-avatar mascot en una esquina superior durante los primeros ~2.5s (sin tapar la cara)
- Caja blanca de énfasis en la zona inferior (anclada a keywords del transcript)
- Overlays gráficos en el **tercio inferior** (muy por debajo del rostro, `bottom: 150`) — **pixel-avatar mascot** generado, **screenshots** del usuario, o **capturas UI tutorial** (anclados a keywords, NUNCA tapan la cara, ni cuando Andrea se acerca a cámara)
- B-roll **videos** fullscreen estilo `monitor-photo` / **imágenes** en el tercio inferior (`bottom: 150`), igual que overlays — nunca tapan la cara
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

## Requisitos previos (precondición)

La skill funciona en **macOS** (Apple Silicon o Intel) y **Windows 10/11**. Cada plataforma tiene una sola precondición: un gestor de paquetes que la skill usa para instalar todo lo demás. Si lo tienes, el bootstrap se encarga del resto solo.

### En macOS — Homebrew

**Homebrew** debe estar instalado ANTES de usar la skill por primera vez. El bootstrap NO lo instala automáticamente.

Verificar si Homebrew está instalado:
```bash
command -v brew
```

Si no responde nada, instalar con el comando oficial:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Después de instalar Homebrew, seguir las instrucciones que imprime al final (suelen pedir agregar `brew` al PATH con dos comandos `echo >> ~/.zprofile` + `eval`).

### En Windows — winget

**winget** (Windows Package Manager) debe estar disponible. Viene preinstalado en **Windows 10 build 1809+** y **Windows 11**, así que en la práctica casi todo el mundo ya lo tiene.

Verificar en PowerShell:
```powershell
winget --version
```

Si no aparece nada o da error:
1. Abre **Microsoft Store**
2. Busca **"App Installer"** (de Microsoft) e instala/actualiza
3. Cierra y vuelve a abrir PowerShell

Alternativa manual si Microsoft Store no funciona: https://github.com/microsoft/winget-cli/releases/latest

Una vez que tu gestor de paquetes esté listo (`brew` en Mac, `winget` en Windows), **la skill se auto-configura sola** la primera vez que la corras.

## Primera vez: bootstrap automático

La primera vez que invocas `/render <carpeta>` o `/edita <carpeta>`, el wrapper ejecuta el bootstrap correspondiente a tu plataforma y se encarga del resto.

### macOS

`render.sh` invoca `bootstrap.sh`:
- Verifica Homebrew (si falta, aborta con instrucciones claras)
- Instala vía `brew`: Node 18+, ffmpeg, yt-dlp, uv (para `uvx mlx-whisper`)
- Corre `npm install` dentro de `remotion-template/` (baja Remotion y sus deps)
- Genera el SFX `pop.wav` con ffmpeg

Para correrlo manualmente:
```bash
bash /Users/kissita/.claude/skills/editor-video-formula100k/scripts/bootstrap.sh
```

Sólo verificar sin instalar:
```bash
bash /Users/kissita/.claude/skills/editor-video-formula100k/scripts/bootstrap.sh --check
```

### Windows

`render.ps1` invoca `bootstrap.ps1`:
- Verifica winget (si falta, aborta con instrucciones)
- Instala vía `winget`: Node 18+, Python 3.10+, ffmpeg, yt-dlp
- Instala `faster-whisper` vía `pip` (alternativa de Whisper para Windows; en Mac se usa `mlx-whisper` que es nativo de Apple Silicon)
- Corre `npm install` dentro de `remotion-template/`

Para correrlo manualmente desde PowerShell (en la carpeta de la skill):
```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\.claude\skills\editor-video-formula100k\scripts\bootstrap.ps1"
```

Sólo verificar sin instalar:
```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\.claude\skills\editor-video-formula100k\scripts\bootstrap.ps1" -Check
```

**Importante en Windows:** después de la primera instalación de Node o Python, cerrar y volver a abrir PowerShell para que el PATH se actualice.

Tarda ~5-8 min en máquina limpia, **sólo la primera vez**. Las invocaciones siguientes saltean el bootstrap.

## Paso 0 — Confirmar el gancho textual (OBLIGATORIO antes del render)

Antes de invocar `render.sh` / `render.ps1`, el agente **SIEMPRE** debe revisar y ofrecer variantes del header del MANIFEST. El header es el **gancho textual** del reel — vive sobre la cara de Andrea los primeros 8 segundos y carga el 80% del trabajo de retención. No se renderiza ciegamente lo que está en el MANIFEST; se valida con Andrea, aunque ella nunca lo haya pedido.

Esta regla aplica incluso si:
- El MANIFEST viene recién generado por `recursos-de-video-formula100k` (sí, ese flujo ya pregunta en Paso 3.5 — pero al saltar a `/render` directamente o en un re-render posterior, esa elección puede no haber pasado).
- El usuario invoca con `/render <carpeta>` o "edita este video" sin mencionar el header.
- El header existente "parece bien".

**Flujo:**

1. Leer `$DEST/MANIFEST.md` y extraer `## Header` → `Línea 1` + `Línea 2`. Si falta el header, marcar el actual como vacío (no abortar).

2. Si `captions.json` ya existe (re-render), leerlo para tener el transcript real. Si no, leer el campo `**Video fuente:**` y avisar que las variantes se generan sobre la promesa del MANIFEST (sin transcript todavía).

3. **Invocar la skill `guionizacion-formula100k`** pidiéndole 3 variantes de gancho textual aplicando su framework "Gancho Textual del Top 1%":
   - Cada variante en formato `Línea 1` / `Línea 2`
   - 3-5 palabras por línea
   - Sentence case (NO all caps)
   - Estilos diversos: una declaración punzante, una con contraste/contraintuitivo, una con número fuerte o promesa concreta

4. Mostrar a Andrea con `AskUserQuestion` **siempre 4 opciones** en este orden:
   - **Opción 1 (Recomendada solo si no hay nada mejor):** "Conservar el actual — `<L1 actual>` / `<L2 actual>`"
   - **Opción 2:** Variante 1 — `<L1>` / `<L2>` (estilo: declaración punzante)
   - **Opción 3:** Variante 2 — `<L1>` / `<L2>` (estilo: contraste / contraintuitivo)
   - **Opción 4:** Variante 3 — `<L1>` / `<L2>` (estilo: número fuerte / promesa concreta)

   Header del AskUserQuestion: `"Gancho textual"`. Pregunta literal: `"¿Cuál usamos como header del reel? Aparece sobre la cara los primeros 8s."`. multiSelect: false.

5. Si Andrea elige una variante distinta a la actual, **reescribir el header del MANIFEST.md** preservando todo lo demás:
   - Solo tocar las dos líneas que empiezan con `- **Línea 1:**` y `- **Línea 2:**` dentro de la sección `## Header`.
   - NO tocar el resto del archivo.
   - Si la sección `## Header` no existía, agregarla inmediatamente después del frontmatter (`# Reel — ...` + metadata).

6. Si Andrea elige "Otro" (input libre del AskUserQuestion), interpretar su texto como un nuevo `Línea 1 / Línea 2` y aplicarlo. Si pide variaciones ("dame 3 más"), volver a invocar `guionizacion-formula100k` con feedback específico y repetir el paso 4.

7. Solo cuando el header esté confirmado y guardado en el MANIFEST, continuar con el pipeline de render abajo.

**Si `guionizacion-formula100k` no está disponible:** generar las 3 variantes aplicando estas reglas a mano sobre el transcript, pero avisar a Andrea: "para mejor calidad de gancho instala `guionizacion-formula100k`".

**Re-renders y atajo de skip:** si Andrea explícitamente dice "renderiza tal cual", "no toques el header", "el header está bien", "skip", o invoca con `/render <carpeta> --skip-hook`, saltar este paso. Por default — incluso en re-render — se pregunta.

---

## Pipeline (un solo comando)

**macOS:**
```bash
bash /Users/kissita/.claude/skills/editor-video-formula100k/scripts/render.sh "$DEST" "$VIDEO_PATH"
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\.claude\skills\editor-video-formula100k\scripts\render.ps1" "$DEST" "$VIDEO_PATH"
```

Lo que hace el wrapper internamente (idéntico en ambas plataformas — la lógica vive en `render.py`):

1. **Corte de silencios + transcripción** (`cut_silences_and_fillers.py`) — sólo si `_source_cut.mov` y `captions.json` no existen aún. Produce:
   - `_source_cut.mov` — video cortado **agresivamente**: silencios > ~0.20s, muletillas `eh/em/uhh/...` y **repeticiones consecutivas** ("y, y, y…", "que que", "porque porque") colapsadas a la última ocurrencia. Padding de 60ms al final de cada palabra para que no se corte la cola (consonantes/vocales finales tienen aire para terminar).
   - Tunables vía flags: `--min-silence 0.08`, `--pad 0.06`, `--no-dedupe`, `--dedupe-max-gap 1.2`.
   - `edl.json` — mapping orig→nuevo tiempo. Lo usa el remap de captions, no es debug.
   - `captions.json` — word-timestamps del transcript original **remapeados** al timeline del corte vía `edl.json`. No se re-transcribe el video cortado (eso introducía alucinaciones de Whisper y drift fonético tipo "reels"→"reales"). Una sola transcripción = fuente de verdad.

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
- **Esconder después:** 8   <!-- opcional. Default 8s. Pon 0 si querés que se quede todo el video. -->

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

**Header** — Líneas 1 y 2. Funciona como **gancho de los primeros 8 segundos** (default) y luego desaparece para dejar la cara de Andrea limpia. Inter 800 92px, blanco con trazo negro 6px (`WebkitTextStroke`), sombra suave, centrado horizontal, anclado a `paddingTop: 280` (debajo del cuarto superior para no chocar con la frente de Andrea). Override en MANIFEST con `Esconder después: N` (segundos del timeline ya cortado). Para que se quede todo el video pasa `Esconder después: 0`.

**Gancho visual** — Imagen tipo sticker (UN solo archivo) que aparece en los primeros segundos en una esquina superior. Columnas: `Archivo | Posición | Inicio | Duración | Ancho | Rotación`. Defaults: `Posición=right`, `Inicio=0.3s`, `Duración=2.2s`, `Ancho=360px`, `Rotación=3°`. Anclado a `top: 340px` para no chocar con el header. Spring drop desde fuera del frame + wobble sutil + fade out. NO cubre la cara centrada (zona segura x≥640 si position=right).

**Énfasis** — Columnas (en orden): `Keyword | Texto | Duración | Offset`. Defaults: `Duración = 1.6s`, `Offset = 0`. La caja blanca aparece en la parte inferior del frame (`bottom: 220`), Inter 800 84px, sombra suave + sombra base estilo "stack". Mientras hay énfasis activo, los overlays se ocultan automáticamente para no superponerse.

**Overlays** — Columnas: `Keyword | Archivo | Ancho | Duración`. Defaults: `Ancho = 420px`, `Duración = 2.0s`. El path es relativo a `$DEST/` (ej. `IA/...` o `USER/...`). Renderiza en el **tercio inferior** (`bottom: 150`) — MUY por debajo del rostro de Andrea, en la zona pecho/manos. Regla dura: los overlays NUNCA tapan la cara, ni siquiera cuando Andrea se acerca a cámara. Esto vale para todos los tipos (mascot pixel, screenshots, capturas UI tutorial). Spring de entrada + float loop sutil. Si hay un énfasis activo en cualquier frame mientras el overlay vive, se oculta (opacity 0) porque el énfasis (`bottom: 220`) compite por la atención.

**B-roll** — Columnas: `Keyword | Archivo | Duración | Estilo`. Defaults: `Duración = 3.0s`, `Estilo = monitor-photo`. **Videos (.mp4/.mov/.webm)** → fullscreen con `object-fit: cover`; el estilo `monitor-photo` añade `rotate(-1.2deg)` + gradiente radial blanco al 8%. **Imágenes (.png/.jpg/.gif)** → se renderizan en la parte inferior (`bottom: 150`), centradas, con width configurable (default 900px), igual que los overlays — nunca tapan la cara. El header **sigue visible** sobre el B-roll mientras esté en su ventana (≤ `hideAfter`).

### Sincronización por keyword

Cada cue resuelve su `t_start` así:
```
t_start = findKeywordTime(transcript, keyword) + (startOffset || 0)
t_end   = t_start + duration
```

`findKeywordTime` normaliza (lowercase, sin acentos, sin puntuación) y busca la primera coincidencia parcial en el transcript. Si la keyword no aparece, el cue se descarta silenciosamente (y `manifest_to_cues.py` ya habrá avisado con `[warn]`).

### Reglas de oro de la composición

1. El **header funciona como gancho** — vive los primeros 8s (default) y luego se quita. Si se necesita persistente, override con `Esconder después: 0` en el MANIFEST.
2. **Emphasis excluye overlay** — el énfasis (`bottom: 220`) y el overlay (`bottom: 150`) viven ambos en el tercio inferior; si coinciden en un frame compiten por la atención visual; gana el emphasis y el overlay se oculta con `opacity: 0` durante toda la ventana de emphasis solapada.
3. **La cara de Andrea queda libre** — ni emphasis ni overlays se renderizan en la mitad central del frame.
4. **Sin subtítulos quemados.** Si el usuario los quiere los pone en post.
5. **Sentence case** en cajas blancas — NUNCA all caps.

### Subtítulos

- **Desactivados.** El preset no quema subtítulos sobre el video — la cara de Andrea + el header + los énfasis llevan el peso textual.
- Si el usuario quiere subtítulos, los agrega en CapCut/Premiere encima del `BORRADOR_AUTO.mp4`.

---

## Atajos conversacionales

- `/render <carpeta>` → pipeline completo. Auto-detecta el video fuente desde `**Video fuente:**` del MANIFEST. **Antes de renderizar siempre corre el Paso 0** (confirmación de gancho textual con 3 variantes).
- `/edita <carpeta>` → equivalente.
- `/render <carpeta> --skip-hook` → saltea el Paso 0. Úsalo cuando Andrea ya confirmó el header en una invocación previa de esta misma sesión, cuando explícitamente dijo "renderiza tal cual", o cuando se está iterando solo sobre énfasis/overlays sin tocar el header.
- `/setup` → corre el bootstrap correspondiente a la plataforma para instalar/verificar dependencias (`bootstrap.sh` en Mac, `bootstrap.ps1` en Windows).

Para invocación natural ("edita este video"), preguntar al usuario por la carpeta DEST si no es obvia y luego correr el Paso 0 antes del pipeline. La skill detecta la plataforma automáticamente: en Mac llama `render.sh`, en Windows llama `render.ps1`. El usuario no necesita elegir.

---

## Iteración

**Cambiar un cue:**
1. Editar la fila correspondiente en `MANIFEST.md` (cambiar keyword, texto, duración, o el archivo)
2. Re-correr `render.sh` (el corte se saltea porque `_source_cut.mov` ya existe; el render reusa los assets de `public/`)

**Re-cortar con regla diferente** (más/menos agresivo, otros fillers, etc.):
1. Opciones rápidas vía flags al invocar `cut_silences_and_fillers.py` manualmente:
   - `--min-silence 0.05` para cortar aún más apretado (default 0.08)
   - `--min-silence 0.15` para más respiración entre frases
   - `--pad 0.09` si todavía sientes que se cortan las colas de las palabras (default 0.06)
   - `--pad 0.03` si quieres un ritmo más apretado (sacrificando algo de naturalidad)
   - `--no-dedupe` si querés conservar repeticiones intencionales ("muy, muy bueno")
   - `--dedupe-max-gap 0.6` para colapsar solo repeticiones muy seguidas
2. Para cambiar la lista de muletillas: editar `FILLER_REGEX` en el script
3. Borrar `_source_cut.mov` y `captions.json` del DEST
4. Re-correr `render.sh` (re-genera el corte y los captions, los keywords se re-resuelven contra el nuevo transcript)

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

## GOTCHAS conocidos de `CreaContenidoViral.tsx` — NO repetir

> **Historial:** bugs encontrados en producción (2026-06-05). Ambos ya corregidos en el TSX. Si en el futuro se refactoriza el template, respetar estas reglas.

### ❌ NUNCA poner `<Header>` dentro de una `<Sequence>` de B-roll

**Bug:** si agregas `<Header .../>` dentro de la Sequence de cada b-roll (para asegurar que el header sea visible encima de las imágenes), el header **reaparece en cada b-roll** aunque ya haya pasado el `hideAfter`. Causa: dentro de `<Sequence>`, `useCurrentFrame()` devuelve el frame **relativo** al inicio de la Sequence (empieza desde 0), no el frame global. Entonces `frame/fps = 0 < hideAfter=8` → siempre verdadero → header visible en cada imagen.

**Fix correcto:** el `<Header>` existe UNA SOLA VEZ fuera de todas las Sequences (CAPA 1 en el JSX raíz). Ahí `useCurrentFrame()` sí devuelve el frame global y el `hideAfter` funciona correctamente.

### ❌ NUNCA dejar que dos entradas de B-roll se solapen en tiempo

**Bug:** si `broll[i].end > broll[i+1].start`, ambos `BrollLayer` se renderizan simultáneamente con sus imágenes en `bottom: 150` → se superponen visualmente.

**Fix correcto:** `resolveBroll` ya incluye un paso de sort + clamp al final:
```typescript
for (let i = 0; i < resolved.length - 1; i++) {
  if (resolved[i].end > resolved[i + 1].start) {
    resolved[i] = {...resolved[i], end: resolved[i + 1].start};
  }
}
```
Al editar el TSX, asegurarse de que este clamp persista.

---

## Errores y fallbacks

| Error | Acción |
|-------|--------|
| (Mac) `bootstrap.sh` reporta Homebrew faltante | Instalar Homebrew con el comando oficial y reintentar |
| (Win) `bootstrap.ps1` reporta winget faltante | Instalar/actualizar "App Installer" desde Microsoft Store y reabrir PowerShell |
| (Mac) `bootstrap.sh` falla al instalar Remotion (npm cache corrupto) | El script usa `--cache=/tmp/npm-cache-<user>`. Si persiste: `sudo chown -R 501:20 ~/.npm` o borrar `~/.npm` |
| (Win) `node` o `python` no se reconocen después de bootstrap | Cerrar PowerShell y abrir una ventana nueva para que el PATH se actualice |
| `manifest_to_cues.py` reporta keywords sin match | La keyword no aparece en `captions.json`. Editar el MANIFEST con una palabra que sí esté en el transcript |
| Remotion falla con "Can only download URLs starting with http:// or https://" | El path del asset salió de `public/`. Verificar que `WEB/`/`IA/` y `_source_cut.mov` estén linkeados/copiados al template (lo hace `render.py`) |
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

---

## Motion Graphics Nativos — Remotion (Nueva Opción)

El template de Remotion incluye 4 composiciones standalone listas para usar como overlays, intros o B-roll animado. No requieren HyperFrames ni dependencias adicionales — ya están compiladas dentro del template.

### Las 4 composiciones

| ID | Componente | Props principales | Duración | Mejor para |
|----|-----------|-------------------|----------|-----------|
| `motion-badge` | `BadgeSlide` | `badgeNumber`, `title`, `subtitle?`, `accentColor?` | 90f (3s) | Intro de punto numerado, paso de tutorial |
| `motion-stat` | `StatCounter` | `value`, `label`, `suffix?`, `accentColor?` | 60f (2s) | Métricas, logros, números impactantes |
| `motion-quote` | `QuoteCard` | `quote`, `author?`, `accentColor?` | 90f (3s) | Testimonios, frases de autoridad |
| `motion-list` | `ListReveal` | `items[]`, `title?`, `accentColor?` | 30+12×n frames | Beneficios, pasos, listas de resultados |

### Cómo renderizar

```bash
cd /Users/kissita/.claude/skills/editor-video-formula100k/remotion-template

# Badge numerado
npx tsx scripts/render.ts \
  --composition motion-badge \
  --props '{"badgeNumber": 1, "title": "Este método cambia todo", "subtitle": "F100K"}' \
  --out "$DEST/IA/badge-overlay.mp4"

# Contador animado
npx tsx scripts/render.ts \
  --composition motion-stat \
  --props '{"value": 50000, "label": "seguidores ganados", "suffix": "+"}' \
  --out "$DEST/IA/stat-overlay.mp4"

# Cita con wipe
npx tsx scripts/render.ts \
  --composition motion-quote \
  --props '{"quote": "El contenido que vende no es el más bonito, es el más claro.", "author": "Andrea Vega"}' \
  --out "$DEST/IA/quote-overlay.mp4"

# Lista reveal (duración auto según numero de items)
npx tsx scripts/render.ts \
  --composition motion-list \
  --props '{"title": "Lo que vas a aprender", "items": ["Crear contenido que vende", "Automatizar con IA", "Construir tu comunidad"]}' \
  --out "$DEST/IA/list-overlay.mp4"
```

> Para todos los clips motion nativos usar `Ancho: 1080` y `Duración` = duración del clip en el MANIFEST.

### Principios de animación (Emil Kowalski)

Todas las composiciones siguen estas reglas que producen motion UI de alta calidad:
- Solo se animan `transform` y `opacity` — nunca `width`/`height` directamente
- Spring values para UI: stiffness 280-320, damping 26-32 (sin bounce exagerado)
- Máximo 300ms por transición individual de UI
- Entradas con ease-out feel (spring que decelera suavemente)
- Sin `ease-in` — se siente abrupto al espectador

### HyperFrames vs Remotion nativo — cuándo usar cada uno

| Aspecto | HyperFrames | Remotion nativo |
|---------|-------------|-----------------|
| Setup | Node >= 22, `npx hyperframes` | Ya instalado en el template |
| Estilos visuales | 8 temas predefinidos (Swiss Pulse, Velvet, etc.) | 4 composiciones optimizadas para reel |
| Flexibilidad | Alta — cualquier HTML/CSS/GSAP | Media — props definidas por composición |
| Velocidad de render | Headless browser (Puppeteer) | Render nativo React + Remotion |
| Mejor para | Diseños custom complejos, mockups, tipografía cinética | Badges, stats, quotes, listas |

### Técnicas de motion disponibles (todas las opciones)

| Técnica | Herramienta | Comando |
|---------|-------------|---------|
| Badge numerado deslizante | Remotion nativo | `--composition motion-badge` |
| Contador animado | Remotion nativo | `--composition motion-stat` |
| Cita con wipe horizontal | Remotion nativo | `--composition motion-quote` |
| Lista reveal con stagger | Remotion nativo | `--composition motion-list` |
| Typing effect | HyperFrames | `npx hyperframes render` |
| Browser mockup con pasos | HyperFrames | `npx hyperframes render` |
| CSS 3D card flip | HyperFrames | `npx hyperframes render` |
| Partículas procedurales | HyperFrames | `npx hyperframes render` |
| Audio-reactive | HyperFrames | `npx hyperframes render` |

---

## Motion Graphics Animados — HyperFrames (Opción Extra)

En lugar de imágenes estáticas como overlays, se puede generar un clip `.mp4` animado con HyperFrames. Estos clips son 1080×1920 (9:16) y se usan exactamente igual que cualquier otro overlay o B-roll en el MANIFEST.

### Cuándo usar HyperFrames vs imagen estática

| Imagen estática (default) | Clip HyperFrames animado |
|--------------------------|--------------------------|
| El recurso ya está generado | Quieres entrada animada |
| Cue simple: aparece y desaparece | Badge/título que desliza desde la izquierda |
| Pixel avatar, screenshot de app | Browser mockup con pasos en cascada |
| | Contador que sube de 0 al valor final |
| | Texto que se escribe solo (typing effect) |
| | Cualquiera de los 8 estilos visuales |

### Prerequisito

```bash
node --version  # necesita Node.js >= 22
# No instalar nada más — se usa via npx hyperframes
```

### Flujo para generar un clip animado

1. Editar `~/Documents/f100k-overlays/index.html` con el contenido del overlay (o crear nuevo proyecto)
2. Previsualizar: `npx hyperframes preview`
3. Renderizar: `npx hyperframes render --output $DEST/IA/nombre-overlay.mp4`
4. Agregar al MANIFEST:

```markdown
## Overlays

| Keyword | Archivo | Ancho | Duración |
|---------|---------|-------|----------|
| claude  | IA/badge-overlay.mp4 | 1080 | 8.0 |
```

> Para clips HyperFrames usar `Ancho: 1080` y `Duración` = duración exacta del clip.

### 8 estilos visuales disponibles

| Estilo | Mood | Mejor para |
|--------|------|-----------|
| Swiss Pulse | Clínico, preciso | SaaS, datos, métricas |
| Velvet Standard | Premium, atemporal | Lujo, empresarial |
| Deconstructed | Industrial, raw | Tech, glitch, punk |
| Maximalist Type | Ruidoso, cinético | Lanzamientos, hype |
| Data Drift | Futurista, inmersivo | IA, ML, tech |
| Soft Signal | Íntimo, cálido | Wellness, historias personales |
| Folk Frequency | Cultural, vívido | Comunidad, consumidor |
| Shadow Cut | Oscuro, cinemático | Revelaciones dramáticas |

### Prompts rápidos

**Badge + título (el estilo del reel de referencia):**
```
Usando HyperFrames, crea overlay 1080×1920 con badge naranja (#F59E0B)
"#1 Skill de Claude Code", título blanco "Esta herramienta cambia todo",
badge entra desde la izquierda expo.out, título sube con fade. Duración 8s.
Fondo #0d0d0d. Guarda en ~/Documents/f100k-overlays/ y renderiza el .mp4.
```

**Browser con 3 pasos:**
```
Usando HyperFrames, crea overlay 1080×1920 con browser mockup oscuro.
3 pasos numerados con badges amarillos que aparecen cada 0.8s.
URL: "formula100k.app/skills". Duración 10s. Fondo #0d0d0d.
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
