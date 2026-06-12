---
name: auditor-ganchos-cuenta-formula100k
description: >
  Auditoría end-to-end del PATRÓN DE GANCHO de una cuenta de Instagram o TikTok. Activar cuando pidan: "auditá los últimos N reels de @cuenta", "analizá esta cuenta y dime el patrón ganador", "compará top vs bottom", "qué hace funcionar los reels de X", "reverse-engineering de @cuenta", "reporte visual de los ganchos de [cuenta]", "qué diferencia los reels virales de los que no", "hazme un HTML interactivo del análisis de [cuenta]"; o cualquier pedido que combine una cuenta IG/TikTok con identificar su patrón de gancho comparando reels que funcionaron vs los que no. Pipeline: Apify instagram-reel-scraper (con transcripts) → ffmpeg frame @1s de cada reel → análisis Top/Bottom + 3 reglas F100K → 6 propuestas nuevas con Higgsfield nano_banana_pro (9:16/2k) → HTML interactivo con tabs, comparativa, modal y hook-builder. Output a FORMULA100K AUDITORIAS/. NO confundir con analizador-perfiles (métricas/ventas), evaluador-ganchos (UN gancho grabado) ni generador-ganchos (crea desde cero).
argument-hint: <@usuario o URL de IG/TikTok> [N reels=9]
---

# Auditor de Ganchos de Cuenta · FÓRMULA 100K

Skill que toma una cuenta de Instagram, mira los últimos N reels reales, mide qué hicieron los TOP que no hicieron los BOTTOM, y entrega un reporte HTML interactivo con propuestas visuales generadas con IA listas para grabar.

## Output esperado

Carpeta `/Users/kissita/Documents/FORMULA100K/FORMULA100K AUDITORIAS/<usuario>_<YYYY-MM-DD>/` con:

```
00_dataset.json              metadata cruda de los N reels (views, captions, transcripts)
hook_1.png … hook_N.png      screenshots del frame @ t=1s de cada reel real
reel_1.mp4 … reel_N.mp4      videos descargados
propuestas/p1.png … p6.png   mockups generados con Higgsfield (9:16, 2k)
REPORTE.md                   reporte markdown con tabla, comparativa, 3 reglas
index.html                   HTML interactivo single-file (auto-contenido, doble-click)
```

El HTML tiene 5 tabs: **📐 La fórmula** · **📊 Los N reels** (sortable+filterable) · **⚖️ Top vs Bottom** · **🧠 Por qué funcionó** (10 patrones + deconstrucción) · **✨ Propuestas Higgsfield** + **🛠️ Hook builder** en vivo.

---

## PASO 1 — Recolectar input

Preguntar SOLO si falta:
1. **¿Cuál es la cuenta?** (@usuario o URL completa de IG/TikTok)
2. **¿Cuántos reels analizo?** (default 9 — sweet spot: suficiente para patrón sin saturar costos)
3. ¿Algún ángulo específico que querés mirar primero? (gancho verbal / gancho visual / temática) — si no responde, cubrir los tres.

Convertir fecha relativa de hoy a `YYYY-MM-DD` para el nombre de la carpeta.

---

## PASO 2 — Extraer los N reels con Apify (default)

**Por qué Apify y no agent-browser:**
Instagram bloquea agent-browser sin sesión guardada — la página de reels muestra solo el login wall. Esta skill va directo a Apify para evitar ese roadblock. Si más adelante hay una sesión IG guardada en `~/.agent-browser/sessions/`, agent-browser puede reemplazar Apify (pero no es el default).

```
mcp__apify__call-actor
  actor: "apify/instagram-reel-scraper"
  input: {
    "username": ["<usuario>"],
    "resultsLimit": <N>,
    "includeTranscript": true,
    "skipPinnedPosts": false
  }
  waitSecs: 45
```

Para TikTok usar `clockworks/free-tiktok-scraper` o equivalente; el resto del pipeline es idéntico.

Esperar a `SUCCEEDED` con `mcp__apify__get-actor-run` (sync=true).

Luego:

```
mcp__apify__get-dataset-items
  datasetId: <devuelto>
  limit: <N>+1
  fields: "shortCode,url,caption,commentsCount,likesCount,timestamp,videoUrl,videoDuration,videoViewCount,videoPlayCount,isPinned,transcript,displayUrl,hashtags.0,hashtags.1,hashtags.2,hashtags.3,hashtags.4,musicInfo.song_name,musicInfo.artist_name,musicInfo.uses_original_audio"
```

**Métrica de orden:** usar `videoPlayCount` (= "views" visibles públicamente en IG). `videoViewCount` es unique viewers, menor.

**Costo estimado:** ~$0.45 para 9 reels con transcripts (Apify start + 9 reels + add-on transcripts por minuto).

---

## PASO 3 — Guardar dataset y descargar los N videos

Crear carpeta: `/Users/kissita/Documents/FORMULA100K/FORMULA100K AUDITORIAS/<usuario>_<YYYY-MM-DD>/`

Guardar `00_dataset.json` con un subset legible:
```json
{"runId":"…","datasetId":"…","scrapedAt":"…","profile":"<usuario>","reels":[
  {"pos":1,"shortCode":"…","date":"…","plays":…,"views":…,"likes":…,"comments":…,"duration":…,"isPinned":false,"hook":"<primeras palabras del transcript>"}
]}
```

Descargar los N videos en paralelo desde `videoUrl` con curl (las URLs de IG expiran rápido, no demorar):

```bash
# escribir /tmp/<usuario>_urls.txt con líneas: <pos>|<videoUrl>
while IFS='|' read -r pos url; do
  curl -sL -A "Mozilla/5.0 ..." -o "reel_${pos}.mp4" "$url" &
done < /tmp/<usuario>_urls.txt
wait
```

User-Agent realista evita 403 ocasionales.

---

## PASO 4 — Extraer frame @ t=1s con ffmpeg

```bash
for i in $(seq 1 <N>); do
  ffmpeg -y -ss 1 -i "reel_${i}.mp4" -frames:v 1 -q:v 2 "hook_${i}.png" 2>&1 | tail -1 &
done
wait
```

`-ss 1 -i` (no `-i -ss`) salta rápido al segundo 1. `-q:v 2` da calidad alta sin gigabytes.

**Por qué t=1s y no t=0:** los primeros frames suelen ser fade-in negro o el thumbnail de IG. t=1s captura el primer frame real del contenido.

---

## PASO 5 — Inspeccionar los N hooks con la herramienta Read

Leer los PNG con la tool `Read` para verlos. Usar el modelo multimodal para identificar para cada uno:
- **Acción**: ¿hay persona haciendo algo concreto? ¿qué hace?
- **Composición**: ¿hay contraste visual / exageración / objeto desproporcionado?
- **Texto en pantalla**: ¿qué dice? ¿abre loop o lo cierra?
- **Sujeto principal**: ¿persona, objeto, paisaje?

Anotar todo. Esto es la materia prima para el análisis comparativo.

---

## PASO 6 — Análisis: Top vs Bottom + 10 patrones profundos

Ordenar por `plays` desc. Marcar:
- **TOP 3** (los 3 más vistos)
- **BOTTOM 3** (los 3 menos vistos)
- **MID** (el resto)

Para cada TOP, deconstruir EN PROFUNDIDAD los disparadores específicos:
1. Primera palabra del audio (¿palabra-bomba? ¿dato concreto?)
2. Estructura narrativa (cronológica, comparativa, reveal, etc.)
3. Universalidad emocional (¿qué botón del nicho aprieta?)
4. Ratio likes/comments (alto likes = guardable / alto comments = polémico)
5. Duración y completion rate implícito (sub-10s = loop infinito hack)
6. Payoff visualizable

Para cada BOTTOM, deconstruir los errores específicos:
1. ¿Arranca con abstracción ("hay algo", "tiene", "es")?
2. ¿El visual tiene persona o solo objeto?
3. ¿El texto cierra la idea en vez de abrir loop?
4. ¿La duración + gancho débil hunden retención?
5. ¿El audio empieza con el tema EQUIVOCADO (la conclusión emocional antes del conflicto)?

Identificar los **10 patrones recurrentes** aplicando los principios de F100K:
1. Drama real > tema neutro (Efecto Zeigarnik)
2. Estímulo supernormal (Tinbergen)
3. Deuda narrativa (open loop)
4. Específico > abstracto (memoria episódica vs semántica)
5. Verbo de acción > verbo de estado (showing vs telling)
6. Sujeto identificable del nicho (hijo, mascota, pareja según el caso)
7. Frame vivo, no carátula editada
8. Texto quemado en posición fija para mute
9. Duration sweet spot (45-55s para narrativa, sub-10s para loop hack)
10. Branded phrase como cierre, NO como gancho

---

## PASO 7 — Generar 6 propuestas de gancho con Higgsfield

Aplicar el patrón ganador detectado al universo de contenido de la cuenta. Diseñar 6 propuestas que cubran categorías distintas (cada una con plantilla F100K validada):
- **Urgencia + número** (countdown)
- **Dilema infantil/relacional**
- **Reveal de error**
- **Contradicción visual** (flat-lay cenital)
- **Cliffhanger emocional** ("me dijo…")
- **Cierre nostálgico** (última cosa de…)

Para cada propuesta, definir:
- Texto del overlay (amarillo bold, mitad inferior)
- Primeras 10 palabras del audio
- 3 razones de por qué funciona (mapeadas a los 10 patrones)

Verificar saldo:
```
mcp__higgsfield__balance
```

Generar las 6 imágenes en PARALELO:
```
mcp__higgsfield__generate_image
  params: {
    model: "nano_banana_pro",
    aspect_ratio: "9:16",
    resolution: "2k",
    prompt: "Instagram reel cover frame, vertical 9:16 documentary photo. [escena con persona en acción]. [contraste visual]. [iluminación natural]. Bottom of frame has bold YELLOW text with thin black outline: \"<texto del overlay>\". Large centered text, Instagram reel style."
  }
```

**Importante:** el server hace fallback silencioso a `nano_banana_2` cuando pro está ocupado — calidad equivalente, no es un problema (ver [[feedback_higgsfield_playwright]] no aplica acá pero es el mismo gotcha).

Esperar todos con `mcp__higgsfield__job_status` sync=true en paralelo. Total ~30-60s.

**Costo estimado:** ~12-18 créditos Higgsfield (de cuenta Creator $30/mes).

Descargar cada PNG con curl a `propuestas/p1_<slug>.png` … `p6_<slug>.png`:

```bash
mkdir -p propuestas && \
curl -sL "<rawUrl_1>" -o propuestas/p1_<slug>.png & \
curl -sL "<rawUrl_2>" -o propuestas/p2_<slug>.png & \
...
wait
```

Verificar visualmente con `Read` que los textos amarillos se renderizaron bien (nano_banana sometimes garbles long Spanish — si pasa, regenerar ese específico).

---

## PASO 8 — Escribir REPORTE.md (versión texto plana)

Estructura: ver `references/reporte-md-template.md`.

Secciones obligatorias:
1. Tabla de los N reels ordenados por plays
2. Patrón ganador — gancho visual (con ejemplos top/bottom)
3. Patrón ganador — gancho verbal (con ejemplos top/bottom)
4. Patrón ganador — temática (cluster con plays promedio)
5. 3 reglas accionables (plantillas de texto + qué evitar)
6. Bonus señal cualitativa (ratio comments/plays)
7. Archivos generados

---

## PASO 9 — Construir index.html interactivo

Single-file HTML auto-contenido (abre con doble-click). Ver plantilla completa en `references/html-template.md`.

**Estructura obligatoria:**

```
<header>
  título con número grande de plays top vs bottom (brecha Nx)
  meta row con cuenta, ventana, totales
<nav.tabs sticky>
  📐 La fórmula
  📊 Los N reels
  ⚖️ Top vs Bottom
  🧠 Por qué funcionó
  ✨ Propuestas Higgsfield
  🛠️ Hook builder
<sections>
  formula: 3 cards de las 3 reglas
  data: grid sortable+filterable + modal con transcript
  compare: side-by-side top/bottom con strips + 4 diferencias por columna
  deep: 10 pattern cards + 6 reason details (<details>/<summary>) accordion
  proposals: 6 cards con thumbnail, overlay, audio, why, botones copy-to-clipboard
  builder: 3 pills (plantilla + dato + emoción) con preview en vivo + score
```

**Paleta obligatoria:** dark BG `#0a0b0d`, accent `--yellow:#ffd60a`, text `#f5f5f7`. Font Inter (Google Fonts) + Caveat para números/firma.

**Interactividad mínima:**
- Tabs (vanilla JS, no framework)
- Sort + filter en la grid de reels
- Modal con transcript completo
- Accordion (`<details>`) en sección deep
- Copy-to-clipboard en propuestas con feedback "✓ Copiado"
- Hook builder vivo con score "✓ Abre loop / ✗ Cierra idea"

Las imágenes se referencian con paths relativos (`hook_1.png`, `propuestas/p1.png`) — el HTML funciona offline.

Al terminar, abrir el archivo:
```bash
open "/Users/kissita/Documents/FORMULA100K/FORMULA100K AUDITORIAS/<usuario>_<fecha>/index.html"
```

---

## PASO 10 — Resumen en el chat

Mensaje final al usuario:
1. Brecha top/bottom en plays (ej: "9x · 57K vs 6K")
2. El patrón ganador en 3 frases (acción + texto amarillo loop + audio concreto)
3. Las 6 propuestas listadas con título corto
4. Confirmación de que el HTML está abierto
5. Costo total real (Apify + Higgsfield)

Ofrecer: "¿Querés más variantes de algún gancho específico, o que ataque otros ángulos del feed?"

---

## Reglas críticas

- **NO** confundir `videoViewCount` con `videoPlayCount`. Usar SIEMPRE `playCount` para ordenar (es lo que IG muestra públicamente).
- **NO** saltarse el ffmpeg con `-ss 1` — el frame 0 suele ser negro o thumbnail genérico.
- **NO** usar nano_banana al 1k para los mockups — texto sale ilegible. SIEMPRE 2k mínimo (4k si el saldo lo permite). Ver [[feedback_avatar_imagen]].
- **NO** generar mockups CON la cara de Andrea (esto NO es contenido para ella, es para auditar OTRA cuenta). Las propuestas son visualizaciones genéricas del estilo de la cuenta auditada.
- **NO** poner emojis en lugares decorativos del HTML excepto en los tabs (donde sí ayudan a navegar) y en los overlays de las propuestas (son parte del lenguaje IG).
- **SÍ** español neutro en TODO output (ver [[feedback_espanol_neutro]]) — "tu/tú", no "vos/tenés/podés".
- **SÍ** verificar saldo Higgsfield ANTES de generar 6 imágenes.
- **SÍ** descargar videos Y screenshots a disco — las URLs de IG expiran en horas.

## Dependencias técnicas

- `ffmpeg` instalado (vía Homebrew: `brew install ffmpeg`)
- `curl` (preinstalado en macOS)
- MCP Apify autenticado
- MCP Higgsfield con plan Creator activo
- Plan F100K Apify con créditos > $0.50 para auditoría estándar de 9 reels

## Archivos de referencia

- `references/reporte-md-template.md` — plantilla del REPORTE.md
- `references/html-template.md` — estructura HTML + CSS + JS canónica
- `references/prompts-higgsfield.md` — 12 plantillas de prompt para mockups por categoría
