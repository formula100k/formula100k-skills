---
name: recursos-de-video-formula100k
description: >
  Convierte un video grabado por Andrea en un set de RECURSOS de edición (B-roll, overlays, referencias visuales) para superponer sobre la toma. Variante de graficos-de-video-formula100k. 4 modos: (1) IA — pixel-avatar mascot e infografía-pixel con Higgsfield sobre chroma key verde; (2) WEB — recursos reales de Pinterest, Google Images, TikTok virales y noticias; (3) HÍBRIDO — combina ambos por timestamp; (4) SCREENSHOTS manuales (carpeta USER/). NO usa bancos de stock. NO edita el video final (eso lo hace editor-video-formula100k). Activar cuando Andrea pase un .mov/.mp4 y diga "cazame recursos para este video", "busca b-roll real", "tráeme recursos web", "mezcla IA + recursos reales", "recursos híbridos para este reel", "buscame TikToks virales para este tema", "imágenes de Pinterest/Google/noticias"; o cualquier variación que combine un video grabado con cazar recursos visuales. Output: FORMULA100K/RECURSOS VIDEOS/YYYY-MM-DD_nombre/ con subcarpetas WEB/IA/USER + MANIFEST.md.
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill, mcp__higgsfield__generate_image, mcp__higgsfield__job_status, mcp__higgsfield__job_display, mcp__claude_ai_supadara__supadata_scrape, mcp__claude_ai_supadara__supadata_transcript, mcp__claude_ai_supadara__supadata_metadata, mcp__claude_ai_Tavily__authenticate, mcp__claude_ai_Tavily__complete_authentication
delegates-to:
  - guionizacion-formula100k    # para generar el header viral (gancho textual)
  - banana                       # para generar la imagen gancho del segundo 1
---

# Recursos de Video — FÓRMULA 100K

Pipeline para convertir un video grabado por Andrea en un set de recursos de edición (B-roll, overlays, referencias visuales) listos para superponer sobre la toma.

**Esta skill SOLO caza recursos y arma el MANIFEST.md.** No edita ni renderiza el video. Para auto-componer el `BORRADOR_AUTO.mp4` final, usar `editor-video-formula100k` después de que esta skill termine.

## Cuándo activar

Activar cuando se cumplan AMBAS:
1. El usuario provee un archivo de video local (`.mov`, `.mp4`, `.m4v`, `.mkv`).
2. Pide recursos reales / b-roll / clips virales / referencias web / mix IA+web.

Si el usuario solo dice "hazme gráficos / scrapbook / overlays con IA" → usar `graficos-de-video-formula100k` directamente.

## NO activar para

- Solo gráficos scrapbook con IA → `graficos-de-video-formula100k`.
- Editar/componer el video final → `editor-video-formula100k`.
- Stories de Instagram → `historias-a-imagenes-nanobanana`.
- Carruseles de IG → `carrusel-render-formula100k`.
- Miniaturas YouTube → `miniatura-youtube-formula100k`.

## Regla NO-STOCK (obligatoria)

NUNCA usar resultados de estos dominios. Si el agente de búsqueda los encuentra, descartarlos:

```
shutterstock.com, gettyimages.com, istockphoto.com, unsplash.com, pexels.com,
pixabay.com, freepik.com, stock.adobe.com, 123rf.com, depositphotos.com,
dreamstime.com, alamy.com, vecteezy.com, canstockphoto.com, bigstockphoto.com
```

Si en algún paso un dominio de stock aparece en los top resultados, reformula la query (más nicho, más narrativo, más editorial) y vuelve a buscar.

## Regla NO-PLACEHOLDER (obligatoria)

NUNCA usar servicios de imagen aleatoria / placeholder / lorem-ipsum, ni siquiera como "test" o "demo". Bloqueados:

```
picsum.photos, lorem-picsum, fastly.picsum.photos, placekitten.com,
placebear.com, placehold.it, placehold.co, via.placeholder.com,
fakeimg.pl, dummyimage.com, baconmockup.com, fillmurray.com
```

Estos servicios devuelven imágenes ALEATORIAS — nunca van a matchear el contenido del video. Si no se puede cazar un recurso real relevante después de los intentos del Paso 7, **dejar el cue sin recurso** (no incluirlo en MANIFEST). Es mejor no tener overlay que tener uno que no tiene nada que ver con lo que Andrea está diciendo en ese segundo.

## Regla VALIDACIÓN-VISUAL (obligatoria)

Cada archivo cazado (WEB o IA) debe pasar una inspección visual antes de incluirse en `MANIFEST.md`. No se acepta nada "a ciegas" basado solo en la URL/query/título del resultado.

Para cada candidato:

1. **Imágenes (.jpg, .png, .webp):** usar `Read` sobre el archivo descargado y comparar contra el `concepto_visual` + `texto_clave` del momento. Preguntarse: "¿Esta imagen ilustra LITERALMENTE lo que Andrea está diciendo en ese segundo del video?" Si la respuesta es "más o menos", "podría servir", "es genérica pero está bien" → **descartar**. Solo aceptar matches CLAROS.

2. **Videos (.mp4, .mov):** extraer 3 keyframes con ffmpeg (al 25%, 50%, 75%) y leer cada uno (ya documentado en Paso 7c para subtítulos quemados). Aplicar el mismo criterio de relevancia visual.

3. **IA generada (Higgsfield):** misma regla — leer el rawUrl después del job, confirmar que el output respeta el prompt y no derivó (sucede a veces con `nano_banana_2`).

Si tras 3 intentos de cazada/regenerada un cue no consigue un match relevante, marcar ese cue como **"sin recurso"** y omitirlo del MANIFEST. Andrea prefiere un reel con menos overlays que con overlays incorrectos.

> Ejemplo de fallo a evitar: video habla de "descargar recursos de Internet" en el segundo 42. La cazadora encuentra una foto bonita de lluvia de chispas en cámara lenta. Visualmente impactante pero NO TIENE NADA QUE VER con internet/redes/contenido. **Descartar.** Mejor dejar ese segundo sin overlay.

## Pipeline (10 pasos)

### Paso 1 — Validar input

```bash
file "$VIDEO_PATH"
ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "$VIDEO_PATH"
```

Si >5 min, avisa y confirma antes de seguir.

### Paso 2 — Transcribir (idempotente)

Llamar al script de la skill `editor-video-formula100k` que corta silencios y transcribe word-level. Esto produce `_source_cut.mov` + `captions.json` que después la skill editor reutiliza sin re-transcribir:

```bash
python3 ~/.claude/skills/editor-video-formula100k/scripts/cut_silences_and_fillers.py \
  "$VIDEO_PATH" "$DEST"
```

Outputs en `$DEST/`:
- `_source_cut.mov` — video sin silencios ni muletillas
- `captions.json` — word-timestamps del video cortado (usar para verificar que los `keyword` del Paso 3 existen)
- `edl.json` — mapping orig→nuevo tiempo (debugging)

### Paso 3 — Identificar momentos (mínimo 7 por video)

**Regla obligatoria: SIEMPRE al menos 7 momentos por video**, sin importar la duración. Los reels viven o mueren por la densidad visual — menos de 7 deja muchos segundos "secos" donde solo hay cara hablando.

Si el video es más largo, escalar proporcionalmente:
- ≤60s → **7 momentos** (mínimo absoluto, ~1 cada 8s)
- 60-120s → 7-10 momentos
- >120s → 10-14 momentos

Si el video es muy corto (<20s) y honestamente no caben 7 momentos sin saturar, avisarle a Andrea con un AskUserQuestion antes de saltarse la regla — pero el default es siempre 7+.

Por momento extrae:
- `timestamp_in`, `timestamp_out` (informativo, no se usa en el MANIFEST nuevo — el editor resuelve por keyword)
- `concepto_visual` (1 línea)
- `texto_clave` (frase literal del audio en ese segmento)
- **`keyword`** — UNA palabra del `texto_clave` que ancla el cue al transcript. Reglas obligatorias:
  - Aparece **literalmente** en el audio (la skill editor la busca en `captions.json`)
  - Lo más **única** posible dentro del video (no usar "es", "el", "que" — usar sustantivos/verbos específicos)
  - En lowercase, sin puntuación
  - Si el texto_clave usa una palabra rara/marca/nombre propio, ESE es el keyword ideal
- `clase_visual` — **overlay** o **broll**:
  - `overlay` → gráfico pequeño que se superpone sobre el pecho de Andrea (~480px ancho). Aplicable a: scrapbook IA, mascots de acción única, infografías de Pinterest, screenshots de UI, charts, iconos, capturas de redes.
  - `broll` → reemplaza fullscreen la cámara durante unos segundos. Aplicable a: TikToks virales, fotos de lugares/personas/eventos reales, clips de noticias, **infografías-pixel** generadas con IA.
- `tipo_dominante` (pantalla IG / comparación / dato duro / persona / objeto / lugar / proceso / emoción / **ecosistema** / **grid** / **mapa**)
- `subtipo_ia` (solo si `clase_visual: broll` o si modo IA/HÍBRIDO) — **mascot** o **infografia-pixel**:
  - `mascot` (default) → un solo personaje pixel-art haciendo una acción. Usa overlay pequeño.
  - `infografia-pixel` → panel denso multi-elemento (mandala de tiles, grid 2×5, split comparativo). Usar cuando el `texto_clave` enumera ≥3 elementos, o el `tipo_dominante` es `ecosistema | comparación | grid | mapa`, o Andrea dice explícitamente "muéstralo como infografía / mapa / sistema". Va SIEMPRE a B-roll.
- `riqueza_visual` (alta / media / baja) — qué tan "buscable" es ese momento en la web

**Regla de oro de keyword:** si en el video Andrea dice "...con la skill de Cloud Remotion que edita...", el keyword puede ser `remotion` (única, fácil de encontrar). Si dice "...Yapper Method...", el keyword es `japer` o `yapper` — lo que efectivamente diga el audio (mlx-whisper a veces lo transcribe como "Japer"). Si dudas, mejor inspecciona `captions.json` después del corte para elegir keywords que sí estén ahí.

### Paso 3.5 — Diseñar el Header del reel (delegar a `guionizacion-formula100k`)

El reel tiene un **header persistente de 2 líneas** centrado arriba durante TODO el video. Es la promesa principal — no cambia, no por-timestamp.

**Cómo generarlo:** invocar la skill `guionizacion-formula100k` con el transcript del Paso 2 + el tema central + las 3-5 ideas que el video promete entregar. Pedirle que devuelva **3 variantes de gancho textual** siguiendo su framework "Gancho Textual del Top 1%" (declaración punzante, contraste, número fuerte, contraintuitivo).

Cada variante en formato `línea 1` / `línea 2`, 3-5 palabras por línea, sentence case (NO all caps).

Ejemplo de prompt a la skill:
```
Tengo este transcript: [pegar]
El video promete: [resumen 1 línea]
Necesito 3 variantes de gancho textual en formato:
  Línea 1 (3-5 palabras)
  Línea 2 (3-5 palabras)
Aplicar framework "Gancho Textual del Top 1%". Sin all caps.
```

Mostrar las 3 variantes a Andrea con `AskUserQuestion` y dejar que elija. Si pide variaciones, volver a invocar la skill con feedback específico.

> Si la skill `guionizacion-formula100k` no está instalada, generar el header tú mismo aplicando estas reglas, pero avisar a Andrea: "para mejor calidad de gancho instala guionizacion-formula100k".

### Paso 3.55 — Carpeta de fotos de referencia del usuario (OBLIGATORIO antes de generar IA)

El pixel-mascot se genera **inspirado en una foto del usuario** (pelo, complexión, color de piel). Sin foto de referencia el mascot sale genérico — perderías el efecto "es mi avatar".

```
AskUserQuestion:
  question: "¿Tienes una carpeta con selfies / fotos personales para inspirar el pixel-mascot?"
  header: "Fotos de referencia"
  multiSelect: false
  options:
    - label: "Sí, uso esta ruta:"
      description: "Carpeta con .jpg / .png frontales o de medio cuerpo. El sistema elegirá automáticamente una clara con cara visible para usar como referencia en Higgsfield (medias role:image)."
    - label: "No, usa un mascot genérico"
      description: "El mascot sale en estilo pixel genérico, sin parecido al usuario. Útil si nunca van a ver su cara en el reel y solo es decoración."
```

**Default para Andrea (siempre):** si la usuaria es Andrea (revisar memoria `reference_andrea_selfies_folder.md`), saltar la pregunta y usar `/Users/kissita/Documents/ANDREA SELFIES`. Listar el directorio, leer 2-3 archivos con Read y elegir el que tenga cara frontal/3-cuartos clara, buena iluminación, sin objetos tapando el rostro.

Una vez elegida la foto:
1. Subirla a Higgsfield con `mcp__higgsfield__media_upload` (returns `upload_url`).
2. PUT el binary a esa URL con `curl -X PUT -T <file> "<upload_url>"`.
3. Llamar `mcp__higgsfield__media_confirm` para registrarla.
4. Capturar el `media_id` (UUID). Lo vas a pasar en `medias: [{value: <UUID>, role: "image"}]` en CADA `generate_image` que use el mascot.

Guardar el `media_id` en memoria conversacional (se reusa en TODAS las generaciones del reel — el HOOK + los 4-5 overlays).

### Paso 3.6 — Imagen gancho del segundo 1 (OPCIONAL — preguntar a Andrea)

La imagen gancho es un **pixel-avatar mascot** que aparece en el segundo 0.3-2.5 en la parte inferior del frame (para no tapar el header grande), rotado ligeramente, sin chocar con la cara. Es CRÍTICA para el primer segundo cuando se usa — el viewer la registra antes que el header. PERO no siempre se quiere: a veces el primer segundo está mejor "limpio" para que el viewer fije la mirada en la cara y el header.

**Preguntar SIEMPRE a Andrea antes de generar nada:**

```
AskUserQuestion:
  question: "¿Quieres una imagen gancho en el segundo 1 de este reel?"
  header: "Imagen gancho"
  multiSelect: false
  options:
    - label: "Sí, genera el pixel mascot"
      description: "Genero un pixel-avatar mascot (380px) con la skill banana — cuerpo blocky salmón, contorno blanco grueso, ojos cuadrados, haciendo la acción del gancho. Aparece top-right en seg 0.3-2.5, rotado 3°, sin tapar la cara."
    - label: "Sí, usar captura mía"
      description: "Andrea pasa la ruta a una captura de pantalla (PNG/JPG) que se usa tal cual como gancho. Útil para mostrar conversaciones, UI de IG, dashboards, mensajes, etc."
    - label: "No, dejar el segundo 1 limpio"
      description: "Sólo header centrado arriba + cara. El primer segundo respira; el viewer fija la mirada en ti directamente."
```

**Atajos textuales que saltan la pregunta:**
- "sin imagen gancho" / "sin sticker" / "limpio el primer segundo" → modo SIN
- "con pixel" / "con mascot" / "hazme el hook" → modo PIXEL (genera)
- "con captura" / "usa esta foto" + ruta → modo CAPTURA

**Si Andrea elige "Sí, pixel mascot":**

Concepto: un **personaje pixel-art chunky** (estilo retro 16-bit / sprite de juego) representando a Andrea haciendo la acción que sintetiza el video. Mismo personaje recurrente entre videos, distinta pose por gancho. Ejemplos:
- Video sobre perfeccionismo → mascot con cara dubitativa rompiendo un papel + ✗ pixelada
- Video sobre auto-edición → mascot con pulgar arriba + ✓ pixelada azul
- Video sobre venta en DM → mascot sosteniendo un teléfono pixelado con notificación
- Video sobre haters → mascot indiferente con escudo pixelado

**Cómo generarlo (Higgsfield `nano_banana_2`):**

Prompt base — copiar y rellenar `<ACCIÓN>` y `<PELO Y RASGOS>`. Pasar SIEMPRE el `media_id` del Paso 3.55 en `medias: [{value: <UUID>, role: "image"}]`:

```
Chunky pixel-art mascot character in 16-bit retro game sprite style, INSPIRED BY THE REFERENCE PHOTO,
preserve the person's <PELO Y RASGOS: ej. "long straight dark-auburn hair, light-tan skin tone, soft features">
translated to chunky pixels (hair as blocky pixel locks, skin as solid color),
square blocky body, tiny black square dot eyes, small simple mouth line,
thick crisp white pixel outline around the entire silhouette (3-4px equivalent),
flat colors only — NO gradients, NO anti-aliasing, NO shading,
visible chunky square pixels (low-res aesthetic upscaled with nearest-neighbor),
character is <ACCIÓN: pose/objeto/expresión específica>,
SOLID BRIGHT CHROMA-KEY GREEN BACKGROUND (#00FF00) — pure saturated green fills the entire canvas edge to edge with NO gradient, NO shadow on the background, NO green pixels touching the character outline (background must be flat key-out green),
centered composition, single subject only,
aspect ratio 1:1, 1024x1024px.
```

Reglas:
1. Aspect ratio cuadrado (1:1)
2. UNA acción por imagen — nada de escenas complejas
3. Si la acción incluye un objeto (cartas, teléfono, escudo, ✓, ✗), describir el objeto también en estilo pixel — **NUNCA usar verde** en el mascot o sus objetos (chocaría con el chroma key)
4. NO escribir texto dentro de la imagen — los textos van en el header y en la caja de énfasis
5. Guardar en `IA/HOOK_<slug>.png` (raíz de `IA/`, sin prefijo T)
6. **Post-procesar con chroma key OBLIGATORIO** (ver Paso 7g) — el PNG final guardado en `IA/` debe tener alpha transparente, no fondo verde
7. Validación visual (Read tool): el mascot debe leerse claro a 380px. El contorno blanco debe destacar contra cualquier fondo. Descartar y regenerar si parece tridimensional / con sombras suaves / sin contorno, o si tiene pixeles verdes en el mascot.

**Si Andrea elige "Sí, captura":**

1. Pedirle la ruta del archivo (`AskUserQuestion` o input directo).
2. Copiar/hardlinkar el archivo a `IA/HOOK_<slug>.png`.
3. Validación visual: ¿se entiende el contenido a 380px? Si es una conversación con texto pequeño, sugerirle recortar/zoomar antes.

Una vez aprobada (cualquiera de los dos modos), registrarla en MANIFEST.md sección `## Gancho visual`.

**Si Andrea elige "No":**

Saltar la generación. **NO incluir** la sección `## Gancho visual` en MANIFEST.md (el editor la ignora silenciosamente si no existe). El primer segundo del reel queda con header + cara únicamente.

### Paso 4 — Preguntar modo

**Salvo que el usuario ya lo haya dicho** (frases como "solo IA", "solo recursos web", "mezcla los dos") preguntar:

```
AskUserQuestion:
  question: "¿Qué tipo de recursos quieres para este video?"
  header: "Modo recursos"
  options:
    - label: "Solo IA (generados con Higgsfield)"
      description: "Gráficos scrapbook 100% on-brand. Comportamiento idéntico a graficos-de-video."
    - label: "Solo Web (Pinterest, Google, TikTok, noticias)"
      description: "Recursos reales cazados de la web. Sin stock. Tú decides en edición qué usar."
    - label: "Híbrido (los dos por timestamp)"
      description: "Por cada momento da 1 opción IA + 1-2 opciones web. Más para elegir."
```

Atajos textuales que saltan la pregunta:
- "modo ia" / "solo ia" / "solo generados" → modo IA
- "modo web" / "solo web" / "solo reales" / "sin ia" → modo WEB
- "híbrido" / "mezcla" / "los dos" / "ambos" → modo HÍBRIDO

### Paso 5 — Decidir cantidad y fuentes por timestamp (adaptativo)

Para cada momento, la skill decide cuántos recursos buscar y de qué fuentes según `riqueza_visual` + `tipo_dominante`:

| Riqueza visual | Cantidad total | Fuentes priorizadas |
|----------------|----------------|---------------------|
| Alta (visualmente potente, viral, persona/lugar reconocible) | 3-4 | TikTok + noticias + Pinterest + Google |
| Media (concepto claro pero genérico) | 2 | Pinterest + Google |
| Baja (concepto abstracto, nicho) | 1-2 | Pinterest + (IA si modo híbrido) |

Mapeo `tipo_dominante` → fuente más probable:
- `persona` / `lugar` / `evento` → **noticias** + TikTok (porque son hechos reales)
- `pantalla IG` / `comparación` / `dato duro` → **Pinterest** (infografías virales) + IA
- `proceso` / `tutorial` → **TikTok** + Pinterest
- `emoción` / `objeto` → **Google Images** + Pinterest
- `nicho de Andrea` (algoritmo IG, ventas DM, contenido) → **TikTok** + Pinterest

### Paso 6 — Mostrar plan y confirmar

Antes de gastar créditos/tiempo de búsqueda, muestra una tabla:

```
| # | TS    | Keyword     | Clase   | Concepto              | Modo    | Fuentes        |
|---|-------|-------------|---------|-----------------------|---------|----------------|
| 1 | 00:02 | perfección  | overlay | Tachado/cruz sobre G1 | Híbrido | IA + Pinterest |
| 2 | 00:15 | japer       | overlay | Logo/UI Yapper Method | IA      | IA             |
| 3 | 00:38 | remotion    | broll   | Capturas Claude IDE   | Web     | Google + TikTok|
...
```

Adicional: confirmar el **Header** propuesto (`línea 1` / `línea 2`) y si la **imagen gancho** se va a generar o no (resultado del Paso 3.6).

`AskUserQuestion`: "¿Procedo con este plan, ajusto cantidades, cambio el header, cambio modo/keyword/clase de algún timestamp, o cambio la decisión de la imagen gancho?"

Atajo: si el video dura <60s y el plan es claro, saltar la confirmación.

### Paso 7 — Ejecutar búsquedas en paralelo

**TODAS las búsquedas se lanzan en paralelo** (un solo mensaje con múltiples tool calls). El downloading se hace después, cuando ya tienes las URLs.

> **Recordatorio:** todo asset cazado en este paso (Pinterest, Google, TikTok, noticias, IA) DEBE pasar la **Regla VALIDACIÓN-VISUAL** antes de incluirse en MANIFEST. Inspeccionar el archivo (Read) y descartar si no matchea el `concepto_visual` del cue. Las reglas NO-STOCK y NO-PLACEHOLDER siguen aplicando.

#### 7a. Pinterest (vía agent-browser)

Cargar la skill agent-browser si no está cargada:
```bash
agent-browser skills get core
```

Workflow:
1. `agent-browser navigate https://www.pinterest.com/search/pins/?q=<query>` con query en inglés derivada del concepto + tipo.
2. Snapshot la accessibility tree. Identificar los primeros 5-10 pins.
3. Para los pins seleccionados, obtener URL de imagen full-size (no thumbnail).
4. Descargar con `curl` al destino.

Si Pinterest pide login, usar la sesión persistente del agent-browser (vault).

#### 7b. Google Images (vía agent-browser)

1. `agent-browser navigate https://www.google.com/search?tbm=isch&q=<query>+-site:shutterstock.com+-site:gettyimages.com+-site:istockphoto.com`
2. Tomar los 5 primeros resultados que NO sean del blocklist de stock.
3. Click en cada uno para obtener la imagen full-res (no thumbnail).
4. Descargar con `curl`.

Si un dominio de stock aparece en top 5, agregarlo a la query con `-site:` y reintentar.

#### 7c. TikTok virales (vía Tavily + yt-dlp)

1. `mcp__claude_ai_Tavily__authenticate` si hace falta.
2. Buscar con Tavily: query en español + filtros virales. Ej: `"tiktok viral algoritmo instagram 2025 millones de vistas site:tiktok.com"`.
3. Tomar 4-6 URLs candidatas de tiktok.com/@user/video/12345 (más de las que vas a usar).
4. Para cada URL, llamar `mcp__claude_ai_supadara__supadata_metadata` para confirmar:
   - vistas > 100k (umbral viral)
   - duración relevante (5-60s típicamente)
   - idioma compatible (es/en)
5. **Descargar el .mp4** con yt-dlp:
   ```bash
   yt-dlp -f "best[ext=mp4]" -o "$DEST/WEB/tiktok/T<n>_<slug>.%(ext)s" "$URL"
   ```
6. **🚫 FILTRO ANTI-SUBTÍTULOS QUEMADOS (obligatorio, regla de Andrea):**
   Los TikToks con captions/subtítulos quemados sobre el video crean ruido visual cuando se superponen. Antes de aceptar un TikTok como recurso final:
   
   a. Extraer 3 keyframes distribuidos (al 25%, 50%, 75%):
   ```bash
   DUR=$(ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "$VIDEO")
   for pct in 0.25 0.5 0.75; do
     t=$(python3 -c "print($DUR * $pct)")
     ffmpeg -ss "$t" -i "$VIDEO" -frames:v 1 -y "/tmp/check_${pct}.jpg"
   done
   ```
   
   b. Inspeccionar visualmente cada keyframe (Read tool sobre los .jpg). Si en cualquiera aparece texto/subtítulos/captions quemados → **descartar ese TikTok** (borrar .mp4 + keyframes) y probar el siguiente candidato.
   
   c. Solo conservar TikToks **limpios**. Si tras 4 candidatos no encuentras uno limpio, marcar el timestamp como "sin TikTok" en MANIFEST.
   
   Tips: los tipo POV/reaction/show suelen estar limpios. Los tipo "explainer/tutorial" casi siempre tienen subtítulos. Filtra con palabras como "raw", "POV", "no commentary", "sin texto", "show", "process".

7. Una vez aprobado, capturar **screenshot del segundo clave** con ffmpeg para el manifest:
   ```bash
   ffmpeg -ss <seg> -i "$DEST/WEB/tiktok/T<n>_<slug>.mp4" -frames:v 1 -y "$DEST/WEB/tiktok/T<n>_<slug>_keyframe.jpg"
   ```

#### 7d. Medios de noticias (vía agent-browser)

Lista priorizada de medios (español primero, inglés después). NUNCA stock:

```
Español:
- bbc.com/mundo, cnnespanol.cnn.com, elpais.com, lanacion.com.ar,
  infobae.com, clarin.com, eluniversal.com.mx, forbes.com.mx,
  bloomberglinea.com, expansion.mx, semana.com

Inglés:
- reuters.com, apnews.com, bbc.com, theguardian.com, nytimes.com,
  forbes.com, bloomberg.com, wired.com, techcrunch.com, theverge.com
```

Workflow:
1. `agent-browser navigate https://www.google.com/search?tbm=isch&q=<query>+(site:bbc.com/mundo+OR+site:reuters.com+OR+...)`
2. Tomar 2-3 imágenes editoriales relevantes.
3. Descargar respetando la URL original del medio (para crédito en el manifest).

Filtrar dominios de stock incluso si Google los devuelve.

#### 7e. IA (Higgsfield) — solo si modo IA o HÍBRIDO

**Dos sub-tipos pixel-art, ambos sobre chroma green:**

- **7e.1 — Mascot** (default): un solo personaje pixel-art haciendo una acción. Va a tabla `Overlays` (~480px). Usar para cues con `subtipo_ia: mascot` o cuando no se especifica.
- **7e.2 — Infografía pixel** (NUEVO): panel denso multi-elemento (mandala de tiles, grid 2×N, split comparativo). Va SIEMPRE a tabla `B-roll` (fullscreen). Usar para cues con `subtipo_ia: infografia-pixel` (ecosistema / comparación / grid / mapa / lista enumerada).

> Nota: la skill `infografia-reel-formula100k` también hace infografías pero entrega un REEL completo 9:16 listo para subir a IG. Esta sub-sección 7e.2 es distinta — genera una **infografía estática 1:1 como inserto B-roll** dentro de un reel talking-head de Andrea, recortable con chroma key. Si el usuario quiere infografía como deliverable final (no inserto), redirigir a `infografia-reel-formula100k`.

#### 7e.1 — Mascot (acción única, overlay)

Prompt base — copiar y rellenar `<ACCIÓN>` y `<PELO Y RASGOS>`. **SIEMPRE** pasar el `media_id` del Paso 3.55 en `medias: [{value: <UUID>, role: "image"}]`:

```
Chunky pixel-art mascot character in 16-bit retro game sprite style, INSPIRED BY THE REFERENCE PHOTO,
preserve the person's <PELO Y RASGOS: ej. "long straight dark-auburn hair, light-tan skin tone, soft features">
translated to chunky pixels (hair as blocky pixel locks, skin as solid color),
square blocky body, tiny black square dot eyes, small simple mouth line,
thick crisp white pixel outline around the entire silhouette (3-4px equivalent),
flat colors only — NO gradients, NO anti-aliasing, NO shading,
visible chunky square pixels (low-res aesthetic upscaled with nearest-neighbor),
character is <ACCIÓN: pose/objeto/expresión específica>,
SOLID BRIGHT CHROMA-KEY GREEN BACKGROUND (#00FF00) — pure saturated green fills the entire canvas edge to edge with NO gradient, NO shadow on the background, NO green pixels touching the character outline (background must be flat key-out green),
centered composition, single subject only,
aspect ratio 1:1, 1024x1024px.
```

Reglas obligatorias:
- **UNA acción por imagen.** Pose limpia, un solo objeto/gesto.
- **Cero texto dentro de la imagen** — los textos van en header y caja de énfasis.
- **Contorno blanco grueso** siempre visible (es la firma del estilo).
- **Mismo personaje en todo el reel** — pasa la MISMA foto de referencia (mismo `media_id`) en TODAS las generaciones para que pelo/piel/rasgos sean consistentes.
- **Fondo verde chroma key** (#00FF00) — Nanobanana sale verde plano, después el Paso 7g lo convierte en alpha transparente. NUNCA usar verde en el mascot o sus objetos (chocaría con el key).
- Si la acción requiere objeto (✓, ✗, teléfono, cartas, escudo, llave, candado, reloj), describirlo también en pixel-art (sin verde).

Flujo de generación:
- `mcp__higgsfield__generate_image` con `nano_banana_2`, aspect_ratio `1:1`, prompt llenado, `medias: [{value: <media_id>, role: "image"}]`
- `mcp__higgsfield__job_status` con `sync: true`
- Capturar `rawUrl` y descargar a `$DEST/IA/T<n>_G<g>_<slug>_<mmss-mmss>.png` (versión raw, fondo verde)
- **Validación visual (Read tool):** confirmar que (a) tiene contorno blanco grueso, (b) los píxeles son cuadrados/chunky visibles, (c) NO hay shading suave ni gradientes, (d) el mascot está centrado y completo, (e) el fondo es verde sólido brillante (#00FF00, no oscuro ni con gradiente), (f) NO hay pixeles verdes en el mascot, (g) los rasgos respetan la foto de referencia. Si falla cualquiera → regenerar con prompt reforzado en esa dimensión.
- **Inmediatamente después de aprobar la validación, aplicar chroma key (Paso 7g) y SOBRESCRIBIR el archivo en `IA/`** — el PNG que va al MANIFEST tiene que tener alpha transparente, NO fondo verde.

> Si `nano_banana_2` deriva al estilo "ilustración digital suave" en lugar de pixel-art (pasa ~10% del tiempo), reforzar el prompt con: `MUST be pixel art with visible square pixels, like a Stardew Valley or Minecraft mob sprite — NOT a digital painting, NOT smooth illustration`.

#### 7e.2 — Infografía pixel (sistema/ecosistema/comparación, B-roll fullscreen)

Cuándo dispararla, en orden de prioridad:
1. El `texto_clave` del cue enumera ≥3 elementos discretos (ej: "tengo 9 áreas / 5 ofertas / 3 tipos / 7 fases").
2. `tipo_dominante` ∈ `{ecosistema, comparación, grid, mapa}`.
3. Andrea dice explícitamente en el video o en chat "muéstralo como infografía / mapa / sistema / grid / poster".
4. El concepto necesita densidad visual que un solo mascot no resuelve (ej: "mi ecosistema completo", "antes vs después con 5 puntos cada uno", "los 10 subagentes").

Si ninguna se cumple → usar 7e.1 (mascot). No sobre-aplicar: una infografía mal usada interrumpe el reel.

Tres layouts soportados (elegir según el contenido del cue):

| Layout | Cuándo | Estructura |
|---|---|---|
| **`mandala`** | Sistema con 1 centro + N satélites (3-9) | Mascot central salmón con cartel del número, N tiles de colores alrededor conectadas con líneas pixeladas |
| **`grid-2xN`** | Lista de 4-10 ítems paralelos | 2 columnas × N filas de cartas, cada una con mini-mascot + label + 3-5 chips |
| **`split`** | Comparación A vs B | Panel izquierdo color 1 + panel derecho color 2, mascot+stack de bullets en cada lado |

Prompt base — copiar, elegir layout, llenar `<TÍTULO>`, `<SUBTÍTULO>` y `<CONTENIDO>`. Pasar el `media_id` del Paso 3.55 en `medias` si quieres que los mascots internos respeten los rasgos de Andrea:

```
Retro 16-bit pixel art infographic, sharp chunky pixels, no anti-aliasing, no smooth gradients.
SOLID BRIGHT CHROMA-KEY GREEN BACKGROUND (#00FF00) — pure saturated green fills the entire canvas edge to edge with NO gradient, NO shadow on the background, NO green pixels touching any element outline.

Title at top in chunky pixel font, white with black 1px outline and small drop shadow: "<TÍTULO 3-5 palabras, MÁX 25 caracteres>".
Subtitle in smaller pixel font: "<SUBTÍTULO 1 línea, opcional>".

LAYOUT: <mandala | grid-2xN | split>
<CONTENIDO específico según layout:
  · mandala  → "central salmon (#FF8C8C) pixel mascot with thick white outline holding a sign with the chunky pixel number <N>, surrounded by <N> colored tiles connected by pixelated dashed lines and chunky pixel arrows. Each tile has a 2px white pixel border and shows a label in chunky pixel font + a number badge + 3 sub-items in tiny pixel font: <listar tile1: color · label · sub-items / tile2 ... >"
  · grid-2xN → "grid of <N> pixel-art trading cards arranged as 2 columns × <N/2> rows. Each card has a 2px white pixel border, a solid colored background, a small 32x32 salmon-pink mascot avatar at the top (different prop per card), the agent name in chunky pixel font on a colored header band, and 3-5 tiny pill-shaped chips below with item names: <listar card1: color · prop · name · chips / card2 ... >"
  · split    → "split-screen left vs right. Left panel: <COLOR1> background, mascot character with <PROP1>, header '<LABEL1>', stack of 3-5 bullet chips: <items>. Right panel: <COLOR2> background, mascot with <PROP2>, header '<LABEL2>', stack of bullets: <items>. Pixel-art vertical divider between panels.">

Decorative pixel elements: small 8x8 pixel stars sparkles, pixel hearts, pixel arrows, pixel coins scattered between elements.

NEVER use realistic textures. NEVER use smooth shading. NEVER include extra text or watermarks beyond what is specified. ONLY chunky retro 16-bit pixel-art aesthetic like Super Nintendo or Game Boy Advance era. Background MUST be flat solid chroma green #00FF00 with zero gradient, ready for chroma key removal in video editing.

Aspect ratio 1:1, 1024×1024px.
```

Reglas obligatorias para infografía-pixel:
- **Aspect ratio: 1:1.** El B-roll del editor mete cualquier ratio en `object-fit: cover` — el 1:1 cropea aceptable a 9:16. Si Andrea pide vertical nativo, usar 9:16 pero avisar que el texto interno se ve más chico.
- **Máx 10 elementos discretos** en el panel. Más densidad → el texto se vuelve ilegible incluso a 4K.
- **Texto interno por bloque: ≤ 25 caracteres** (regla de Nano Banana). Abreviar nombres largos (ej: `guionizacion-formula100k` → `GUIONES`).
- **Mismo personaje salmón** en todos los cards/tiles si aparecen mascots internos — pasar el `media_id` de Andrea para que pelo/piel respeten su look. Si la infografía no incluye mascots de cara, el `media_id` se puede omitir.
- **Cero verde en los elementos** — chocaría con el chroma key.
- **NO escribir texto que no esté en el prompt** — Nano Banana inventa labels si no le pides cero extra text. Reforzar con la frase "NEVER include extra text" en el prompt final.
- **Validación visual obligatoria (Read tool)**: (a) los elementos prometidos están y son legibles, (b) los colores corresponden a los del prompt, (c) no hay micro-typos en labels críticos (si los hay y son corregibles, re-generar el cue específico — vale más generar 3 veces que dejar un typo en un B-roll), (d) fondo es verde plano #00FF00 sin gradiente.

Flujo de generación:
- `mcp__higgsfield__generate_image` con `nano_banana_2`, aspect_ratio `1:1`, prompt llenado, `medias` opcional
- `mcp__higgsfield__job_status` con `sync: true`
- Descargar a `$DEST/IA/T<n>_INFO_<slug>_<mmss-mmss>.png` (el prefijo `INFO` distingue infografías de mascots para debugging)
- Aplicar chroma key (Paso 7g) — sobrescribe en sitio

> Si `nano_banana_2` deriva al estilo "ilustración suave / mood board / collage" en lugar de pixel-art, reforzar con: `MUST be chunky pixel art with visible 4-8px square pixels, like a Super Nintendo cartridge cover or a Stardew Valley promotional poster — NOT a digital illustration, NOT a flat vector design, NOT a watercolor`.

#### 7g. Aplicar chroma key a los PNGs IA (OBLIGATORIO)

Después de generar y validar cada imagen, **convertir el fondo verde a alpha transparente** con el script de la skill:

```bash
bash ~/.claude/skills/recursos-de-video-formula100k/scripts/chroma_key.sh "$DEST/IA/T1_G1_xxx.png"
```

El script usa `ffmpeg` con `chromakey=color=0x00FF00:similarity=0.30:blend=0.10` y SOBRESCRIBE el archivo de entrada. El resultado es un PNG con alpha — el mascot recortado, listo para flotar sobre el video real sin caja contenedora.

**Procesar TODOS los PNGs IA generados en este proyecto** (HOOK + overlays). No olvidar ninguno: si un PNG queda con fondo verde, el viewer va a ver un cuadrado verde feo en el reel.

Atajo para procesar toda la carpeta:
```bash
for f in "$DEST/IA/"*.png; do
  bash ~/.claude/skills/recursos-de-video-formula100k/scripts/chroma_key.sh "$f"
done
```

**Validación post-chroma-key (Read tool):**
- El mascot conserva su contorno blanco grueso (no se erosionó)
- NO hay halo verde fino alrededor del mascot (si lo hay, re-correr con `--similarity 0.40 --blend 0.15`)
- El fondo es transparente (Read mostrará el patrón cuadriculado de transparencia)
- Los pixeles internos del mascot no se hicieron transparentes accidentalmente (si pasó, hay verde en el mascot — regenerar la imagen con prompt reforzado en "NO green on character")

Si tras 2 intentos el halo verde no se va, revertir al fondo negro (cambiar prompt + omitir chroma key) — el negro con contorno blanco también queda bien aunque sin el efecto recortado.

#### 7f. Capturas del usuario (modo SCREENSHOT)

Andrea puede aportar **screenshots propios** (DMs, dashboards, posts virales, conversaciones, UI de IG/TikTok, gráficas reales, mensajes de pago) que se usan tal cual como overlay sin generación IA. Útil cuando necesita mostrar **prueba real** o data específica que un mascot no puede representar.

Flujo:
1. Durante el Paso 6 (confirmación de plan), preguntar si algún timestamp se cubre con captura propia.
2. Si sí, pedirle la(s) ruta(s) (`AskUserQuestion` con campo libre, o ella las pega en chat).
3. Copiar a `$DEST/USER/T<n>_<slug>.png` (crear `USER/` si no existe).
4. Validación visual: ¿el contenido se entiende a ~480px de ancho? Si tiene texto chico, sugerirle recortar/zoomar a la parte clave antes.
5. En el MANIFEST, este cue va a la tabla **Overlays** con `Archivo: USER/T<n>_<slug>.png` exactamente como cualquier otro overlay.

Atajos textuales:
- "uso mi captura de pantalla aquí" + ruta → modo SCREENSHOT en ese timestamp
- "para el momento X, esta foto: <ruta>" → modo SCREENSHOT en X

### Paso 8 — Estructura de carpeta destino

```bash
DEST="/Users/kissita/Documents/FORMULA100K/RECURSOS VIDEOS/$(date +%Y-%m-%d)_<nombre_descriptivo>"
mkdir -p "$DEST/IA"
mkdir -p "$DEST/USER"
mkdir -p "$DEST/WEB/pinterest"
mkdir -p "$DEST/WEB/google"
mkdir -p "$DEST/WEB/tiktok"
mkdir -p "$DEST/WEB/noticias"
```

`IA/` → pixel-avatar mascots generados.
`USER/` → screenshots que Andrea pasó manualmente.
`WEB/` → recursos cazados de la web.

`<nombre_descriptivo>` en snake_case sin acentos (ej: `algoritmo_instagram_recursos`).

Convención de nombre de archivo (CRÍTICA — la skill editor depende de ella):
- `IA/T<n>_G<g>_<slug>_<mmss-mmss>.png` (pixel-avatar mascot generado, overlay)
- `IA/T<n>_INFO_<slug>_<mmss-mmss>.png` (infografía-pixel generada, B-roll fullscreen)
- `USER/T<n>_<slug>.png` (captura del usuario)
- `WEB/pinterest/T<n>_P<p>_<slug>.jpg`
- `WEB/google/T<n>_GI<g>_<slug>.jpg`
- `WEB/tiktok/T<n>_TT<t>_<slug>.mp4` + `_keyframe.jpg`
- `WEB/noticias/T<n>_N<m>_<slug>_<medio>.jpg`

El prefijo `T<n>_` es **recomendado** (no obligatorio en el nuevo lineamiento, pero ayuda a navegar la carpeta y a debuggear cuando un cue no carga). El editor ya no auto-descubre alternativas — cada cue del MANIFEST apunta a UN archivo explícito.

### Paso 9 — Generar MANIFEST.md (formato keyword-based)

Archivo `MANIFEST.md` en la raíz de `$DEST`. La skill `editor-video-formula100k` lo consume con este formato exacto:

```markdown
# Reel — <nombre del video>

- **Video fuente:** <ruta absoluta al .mov/.mp4>
- **Fecha:** <YYYY-MM-DD>
- **Modo:** <IA | Web | Híbrido>

## Header

- **Línea 1:** <línea 1 del header — 3-5 palabras, sentence case>
- **Línea 2:** <línea 2 del header — 3-5 palabras, sentence case>

## Gancho visual

- **Archivo:** `IA/HOOK_<slug>.png`
- **Posición:** right          (o `left`)
- **Inicio:** 0.3              (segundos)
- **Duración:** 2.2            (segundos)
- **Ancho:** 380               (px)
- **Rotación:** 3              (grados, suave)

## Énfasis

| Keyword     | Texto                 | Duración |
|-------------|-----------------------|----------|
| <keyword1>  | <texto caja blanca>   | 1.6      |
| <keyword2>  | ...                   | 1.6      |

## Overlays

| Keyword     | Archivo                                                   | Ancho | Duración |
|-------------|-----------------------------------------------------------|-------|----------|
| <keyword>   | `IA/T1_..._.png` · `USER/T1_..._.png` · `WEB/.../...jpg`  | 480   | 2.4      |

## B-roll

| Keyword     | Archivo                                  | Duración | Estilo         |
|-------------|------------------------------------------|----------|----------------|
| <keyword>   | `WEB/tiktok/T3_..._.mp4`                 | 3.0      | monitor-photo  |

## Créditos (recursos web)

[tablas por fuente con URL original de cada archivo]
```

**Cómo llenar cada sección:**

**Header** (obligatoria):
- 2 líneas que resumen la promesa del video, no por-timestamp. Ver Paso 3.5.

**Énfasis** (recomendada):
- 4-10 cajas blancas que aparecen al centro del video durante 1.4-2.0s cada una.
- Cada fila ancla a UNA `keyword` que existe literalmente en el audio.
- El `Texto` de la caja puede ser DISTINTO de la keyword: la keyword es solo el ancla temporal; el texto es lo que se muestra (más corto/punzante).
- Ej: `keyword: perfección` → `Texto: Olvida la perfección`. La caja aparece cuando Andrea dice "perfección".
- Buenos candidatos: declaraciones definitivas, frases-bomba, números importantes, veredictos.

**Overlays** (recomendada — recursos pequeños sobre el pecho):
- Una fila por cada recurso clasificado como `overlay` en el Paso 3.
- `Archivo` es path relativo a `$DEST/` (ej. `IA/T1_..._.png`, `WEB/pinterest/T2_..._.jpg`).
- `Ancho` por default 480px. Subir a 560 si el gráfico necesita detalle.
- `Duración` por default **3.0s** (mínimo recomendado para que el viewer lo registre). Subir a 4-5s si tiene mucho texto. No bajar de 2.5s.
- Mientras hay énfasis activo en el mismo segundo, el overlay se oculta automáticamente. El editor además **desplaza** automáticamente cualquier overlay que quede visible <1.8s al final del emphasis con el que choque — así la duración configurada se respeta siempre. No hace falta evitar manualmente que keyword de overlay y keyword de emphasis coincidan.

**B-roll** (opcional — recursos fullscreen):
- Una fila por cada recurso clasificado como `broll` en el Paso 3 — incluye TikToks, fotos de noticias, screenshots fullscreen, **y todas las infografías-pixel generadas con 7e.2**.
- `Estilo: monitor-photo` añade `rotate(-1.2deg)` + gradiente radial blanco al 8% — simula una foto de pantalla, lo que da un toque editorial sin ser solemne. Default.
- `Estilo: clean` deja la imagen plana sin efectos. Usar para tomas que ya tienen mucho carácter (TikToks dinámicos, lugares con composición fuerte, **infografías-pixel** — el chroma green ya recortado se ve mejor sin la rotación de monitor-photo).
- Para `IA/T<n>_INFO_*.png` el default recomendado es **`clean`** con duración **3.5-5s** (necesita más tiempo en pantalla que un TikTok porque tiene texto que leer).
- Header sigue visible sobre el B-roll. Subtítulos también.

**🚫 REGLA: para B-roll priorizar recursos verticales (9:16)**

Los B-roll se renderean con `object-fit: cover`. Si el recurso es horizontal se va a cropear bastante — perderás contexto en los bordes. Para que se vea bien:
- TikToks ya son verticales (✓)
- Fotos de noticias: prefiere las verticales/cuadradas; si solo hay horizontal, conserva pero avisa
- Pinterest pins: prefiere los verticales
- Screenshots de UI: NO mandar a B-roll, mejor como overlay

**No hay más columna `Layout`.** Los recursos van a una de dos tablas (`Overlays` o `B-roll`), y cada tabla tiene su rendering fijo. Esto es más simple y predecible que el viejo `pip` / `fullscreen` / `split`.

### Paso 10 — Entregar al usuario

1. `mcp__higgsfield__job_display` con UUIDs de IA (si hubo).
2. `open "$DEST"` para abrir Finder.
3. Resumen en chat:
   - Total de recursos por modo y por fuente.
   - Cuáles momentos quedaron sin recurso web.
   - Cualquier dominio de stock que se haya descartado.
4. **Sugerir el siguiente paso:** "Para componer el borrador automático del video, corre `/render <ruta de DEST>` o di 'edita este video' — invocará `editor-video-formula100k` con todo lo que acabamos de armar."

## Iteración

Si el usuario pide regenerar un timestamp o cambiar un recurso:
1. Re-ejecutar solo esa búsqueda con query ajustada.
2. Sobrescribir solo ese archivo.
3. Actualizar `MANIFEST.md`.

Si pide "este momento mejor IA": llamar a `mcp__higgsfield__generate_image` solo para ese timestamp y guardar en `IA/`.

## Errores y fallbacks

| Error | Acción |
|-------|--------|
| `agent-browser` no instalado | `npm i -g agent-browser && agent-browser install` (avisar al usuario). |
| `yt-dlp` no instalado | `brew install yt-dlp`. Mientras tanto, guardar solo URL + thumbnail de Supadata. |
| Tavily no autenticado | Llamar `mcp__claude_ai_Tavily__authenticate` y guiar al user por el flow. |
| Pinterest exige login | Reintentar con sesión persistente del agent-browser. Si sigue, marcar el timestamp como "solo Google + IA". |
| TikTok URL caída / privada | Buscar otra. Si después de 3 intentos no hay clip viable, marcar el timestamp como "sin TikTok" en MANIFEST. |
| Todos los TikToks tienen subtítulos quemados | Reformular query con "raw"/"POV"/"no text" hasta 2 veces. Si igual, marcar como "sin TikTok". |
| Todos los resultados son stock | Reformular query (más editorial, más nicho) hasta 2 veces. Si igual sale stock, marcar timestamp como "sin web" y proponer IA. |
| Carpeta destino existe | Confirmar sobrescribir, o agregar `_v2`. |

## Atajos conversacionales

- `/recursos-video <ruta>` → modo HÍBRIDO por default, aspect ratio 1:1, decide cantidad adaptativo.
- `/recursos-video <ruta> --modo ia` → modo solo IA.
- `/recursos-video <ruta> --modo web` → modo solo web, sin IA.
- `/recursos-video <ruta> --solo-tiktok` → solo TikToks virales.

Para videos <60s con plan claro, saltar paso 6 (confirmación) y ejecutar directo.

**Cadena con la skill editor:** si el usuario añade `--render` o "y luego edita" al comando, al terminar el Paso 10 invocar inmediatamente la skill `editor-video-formula100k` con la carpeta DEST recién creada.
