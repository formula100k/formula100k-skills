---
name: auditor-ganchos-cuenta-formula100k
description: >
  Auditoría end-to-end del PATRÓN DE GANCHO de una cuenta IG/TikTok. Activar cuando pidan: "auditá los últimos N reels de @cuenta", "top 10 vs 10 peores", "analizá esta cuenta y su patrón ganador", "compará top vs bottom", "qué hace funcionar los reels de X", "reverse-engineering de @cuenta", "reporte visual de los ganchos de [cuenta]". Pipeline: Apify instagram-reel-scraper (transcripts) → ffmpeg frame @1s + frames 0/3/6/10s → integra estadísticas nativas de IG si las pasan (guardados, compartidos, seguidores, %no-seguidores) y carruseles → análisis Top-N vs Bottom-N + comparación de ganchos textual/visual/verbal + anatomía por segundos + ángulos (comentarios vs vistas vs guardados) + ganchos perfectos → HTML interactivo + layouts de gancho con Higgsfield (9:16/2k) para editores. Encadena opcional: calendario de guiones, memoria, Segundo Cerebro, Yapper. Output a FORMULA100K AUDITORIAS/. NO confundir con analizador-perfiles, evaluador-ganchos (UN gancho), generador-ganchos (crea desde cero).
argument-hint: <@usuario o URL de IG/TikTok> [top N + bottom N=10]
---

# Auditor de Ganchos de Cuenta · FÓRMULA 100K

Skill que toma una cuenta de Instagram, mira los últimos N reels reales, mide qué hicieron los TOP que no hicieron los BOTTOM, y entrega un reporte HTML interactivo con propuestas visuales generadas con IA listas para grabar.

## Output esperado

Carpeta `/Users/kissita/Documents/FORMULA100K/FORMULA100K AUDITORIAS/<usuario>_<YYYY-MM-DD>/` con:

```
00_dataset.json              metadata cruda + stats first-party + carruseles
hook_t01.png … hook_bNN.png  frame @ t=1s de cada reel (top y bottom)
reel_t01.mp4 … reel_bNN.mp4  videos descargados
montage_TOP.png/BOTTOM.png   mosaicos comparativos de los ganchos @1s
anatomia/WINNERS_anatomy.png anatomía por segundos (frames 0/3/6/10s apilados)
anatomia/LOSERS_anatomy.png
layouts-editores/1..6.png    layouts de gancho Higgsfield (9:16, 2k) para editores
REPORTE.md                   reporte markdown completo
CALENDARIO_GUIONES.md        (opcional) semana de guiones con el criterio ganador
index.html                   HTML interactivo single-file (auto-contenido, doble-click)
```

El HTML tiene 7 tabs: **📐 Diagnóstico** · **📊 Los N reels** (sortable+filterable+modal) · **🎣 Comparación de ganchos** (textual/visual/verbal) · **⏱️ Anatomía por segundos** · **🧠 Patrones invisibles** (12) · **🎯 Comentarios vs vistas** (ángulos) · **✨ Ganchos perfectos + formato ganador**.

> **Modo Top-N vs Bottom-N (default):** para comparar "10 mejores vs 10 peores" hay que scrapear un pool amplio (~70 reels), ordenar por `videoPlayCount` y tomar los N de arriba y N de abajo. NO scrapear solo N: eso da los N más recientes, no los mejores/peores.

---

## PASO 1 — Recolectar input

Preguntar SOLO si falta:
1. **¿Cuál es la cuenta?** (@usuario o URL completa de IG/TikTok)
2. **¿Comparación top vs bottom?** (default: TOP 10 vs BOTTOM 10 → scrapear ~70 para tener pool). Si piden "los últimos N" sin comparar, scrapear N.
3. ¿Algún ángulo específico? (gancho verbal / visual / temática) — si no responde, cubrir los tres.

**Estadísticas nativas de IG (oro puro):** si Andrea pega los datos de "Estadísticas de contenido" (guardados, compartidos, seguidores nuevos, % de alcance de no-seguidores, vistas totales de la cuenta), **integralos** — el reel-scraper NO trae guardados/compartidos/seguidores ni el % de no-seguidores, y esos números cambian el análisis (revelan el motor de "alcance silencioso por DM" de los carruseles y la desconexión guardar↔seguir). También pueden mencionar **carruseles top** que el reel-scraper no captura: agregarlos como data manual en `00_dataset.json` (campo `carousels`).

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
    "resultsLimit": 70,   // pool amplio para elegir top-N y bottom-N
    "includeTranscript": true,
    "skipPinnedPosts": false
  }
  waitSecs: 0            // 70 reels con transcripts tarda ~2-3 min: fire-and-forget + poll
```

Para TikTok usar `clockworks/free-tiktok-scraper` o equivalente; el resto del pipeline es idéntico.

Esperar a `SUCCEEDED` con `mcp__apify__get-actor-run` (waitSecs=45, repetir hasta terminal).

**Paso A — ranking (liviano):** traer solo métricas para ordenar y elegir los 20:
```
mcp__apify__get-dataset-items
  fields: "shortCode,videoPlayCount,videoViewCount,likesCount,commentsCount,videoDuration,timestamp,isPinned,productType"
```
Ordenar por `videoPlayCount` desc → TOP N (arriba) + BOTTOM N (abajo).

**Paso B — contenido de los 20:** traer transcript/videoUrl/caption SOLO de los elegidos.
⚠️ **Gotcha:** pedir transcript+videoUrl de 70 reels revienta el límite de tokens (get-dataset-items guarda el resultado en un `.txt`). Solución: traer con `fields="shortCode,url,videoUrl,caption,transcript,..."` y si excede, usar `jq` sobre el archivo guardado para filtrar los 20 shortCodes elegidos.

**Métrica de orden:** usar `videoPlayCount` (= "views" públicas en IG). `videoViewCount` es unique viewers, menor.

⚠️ **Sesgo de recencia:** los reels de <5 días aún no acumulan vistas; si caen en el BOTTOM por recientes, marcarlo explícitamente en el reporte (no es que sean "malos").

**Costo estimado:** ~$0.45 para ~70 reels con transcripts.

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

**Frames para ANATOMÍA POR SEGUNDOS** — para 3-4 héroes y 3-4 peores, extraer también frames a 0/3/6/10s y armar una tira horizontal por video (la anatomía muestra si el video re-engancha o se queda estático):
```bash
for r in t01 t04 t08 t09 b01 b05 b06 b10; do
  for t in 0 3 6 10; do
    ffmpeg -y -ss $t -i "reel_${r}.mp4" -frames:v 1 -q:v 3 -vf "scale=300:-1" "anatomia/_${r}_${t}.png" >/dev/null 2>&1
  done
  ffmpeg -y -i anatomia/_${r}_0.png -i anatomia/_${r}_3.png -i anatomia/_${r}_6.png -i anatomia/_${r}_10.png -filter_complex hstack=inputs=4 "anatomia/strip_${r}.png" >/dev/null 2>&1
done
# apilar tiras en WINNERS_anatomy.png y LOSERS_anatomy.png con vstack
```

**Gotcha montajes:** algunos builds de ffmpeg (Homebrew) NO traen el filtro `drawtext` (falta libfreetype). Si falla al etiquetar, armar los montajes sin texto y recordar el orden (fila = video, columnas = 0/3/6/10s). Para escalar+apilar usar `scale` + `xstack`/`vstack`.

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

Identificar los **12 patrones invisibles** (los 2 últimos SOLO si hay stats first-party). Patrones validados en la auditoría de @andreaestratega (ver [[feedback_criterio_ganchos_andrea]]):
1. Noticia/evento con fecha > tutorial de función ("Claude puede…")
2. Deseo del espectador > capacidad de la herramienta
3. Hablar de TI ("si tú…") > hablar de MIS/YO ("mis ganchos")
4. Rol/diálogo con conflicto (skit) > monólogo expositivo
5. Primera frase = bomba/dato > primera frase = relleno ("Ok…", "Así es como…")
6. Objeto en mano + ojos al lente > manos entrelazadas / mirada baja
7. Número/dato concreto en el gancho > gancho vago
8. Re-hook cada 2-3s (texto que cambia) > frame estático 10s
9. Ángulo contraintuitivo/polémico > cero fricción
10. Evidencia externa en pantalla (tweet, footage real, mockup) > solo pantalla sin cara
11. **[first-party]** Carrusel comparación/checklist = guardados+compartidos masivos (alcance silencioso por DM)
12. **[first-party]** Cara a cámara = seguidores; guardado ≠ seguidor → combinar carrusel-gancho + reel-seguimiento

### Comparación de ganchos en 3 CAPAS (obligatorio en el reporte)
Todo gancho vive en 3 capas a la vez; los TOP aciertan las 3 en el seg 1, los BOTTOM fallan ≥1:
- **Textual** (texto quemado): promesa+número, amarillo, cambia cada 2-3s → NO etiqueta estática.
- **Visual** (primer frame): ojos a cámara + objeto en mano + gesto + buena luz → NO manos juntas/mirada baja/prop irrelevante/grabado en auto.
- **Verbal** (primeras palabras): dato/conflicto, habla de TÚ, vende resultado → NO "Ok/Así es como", NO "mis/yo", NO función.

### Anatomía por segundos (obligatorio)
Mapear los beats de retención sobre frames 0/3/6/10s. GANADORES: re-hook cada 2-3s + evidencia/cambio de persona en seg 6 + giro a "tú" en seg 10, nunca frame estático. PERDEDORES: diagnosticar el punto de caída (frame estático que lee una lista / prop que distrae / b-roll ilegible / formato correcto mal ejecutado). **Insight clave:** el formato no basta — la ejecución del primer segundo (luz, energía, ojos, objeto) es el multiplicador.

### Ángulos: qué dispara cada métrica
Tabla objetivo→formato→ejemplo→métrica: alcance frío+seguidores (tutorial-relámpago con número) · guardados+compartidos (carrusel comparación) · comentarios (conflicto/"te señalo"/skit con enemigo) · retención de comunidad (noticia de nicho, se queda 85% en seguidores).

---

## PASO 7 — Generar layouts de gancho con Higgsfield (para editores)

Aplicar la **fórmula ganadora** detectada. Diseñar 6 layouts que sirvan de referencia visual a los editores (dónde va el texto amarillo + número, el objeto en mano, el contacto visual, la evidencia externa). Categorías validadas:
- **Tutorial-relámpago** con número ("...EN 3 SEGUNDOS", teléfono en mano señalando)
- **Noticia + deseo** (captura real como evidencia)
- **Conflicto / te señalo** (dedo al viewer, "Por esto NADIE...")
- **Skit Principiante vs Avanzada** (split, etiquetas, buena luz — NO en el auto)
- **Carrusel comparación** (portada "X vs Y", columnas ✓/✗ — máquina de guardados)
- **Contraintuitivo** ("DEJA de hacer...", gesto de stop)

Para cada layout definir: texto del overlay (amarillo bold), primeras 10 palabras del audio, 3 razones mapeadas a los 12 patrones.

**Si es la cuenta de Andrea (auditoría propia):** los layouts pueden mostrar una creadora genérica de marca (pelo lacio castaño, ladrillo, buena luz) como plantilla para los editores — NO hace falta su cara real. Añadir en el prompt "hook layout reference for video editors".

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

Descargar cada PNG con curl a `layouts-editores/1_<slug>.png` … `6_<slug>.png` (nombres descriptivos por formato). Verificar visualmente con `Read` un montaje de los 6 que los textos amarillos en ESPAÑOL se renderizaron bien (nano_banana a veces distorsiona español largo — si pasa, regenerar ese).

---

## PASO 8 — Escribir REPORTE.md (versión texto plana)

Estructura: ver `references/reporte-md-template.md`.

Secciones obligatorias:
0. Titular con brecha top/bottom + panorama first-party (si lo hay) + descarte de excusas (duración/CTA/"no gusta")
1. **Comparación de ganchos** — textual / visual / verbal (qué comparten los top + qué les falta a los bottom)
2. **Anatomía por segundos** — dónde se cae cada video (beats 0/3/6/10s, ganadores vs perdedores)
3. **Resumen SÍ vs NO + 12 patrones invisibles**
4. **Ángulos** — qué dispara comentarios vs vistas vs seguidores vs guardados (tabla) + desconexión guardar↔seguir + jugada combinada
5. **Ganchos perfectos + formato ganador** — fórmula + 6 ganchos listos (textual/visual/verbal cada uno) + 3 reglas
6. Nota de recencia (reels <5 días) + archivos generados

---

## PASO 9 — Construir index.html interactivo

Single-file HTML auto-contenido (abre con doble-click). Ver plantilla completa en `references/html-template.md`.

**Estructura obligatoria:**

```
<header>
  título con número grande de plays top vs bottom (brecha Nx)
  meta row con cuenta, ventana, totales
<nav.tabs sticky>
  📐 Diagnóstico          → panorama first-party + descarte de excusas + embudo
  📊 Los N reels          → grid sortable+filterable + modal con transcript
  🎣 Comparación de ganchos → 3 cards (textual/visual/verbal) con columnas yes/no
  ⏱️ Anatomía por segundos → montajes WINNERS/LOSERS + beatmap 0/3/6/10s
  🧠 Patrones invisibles   → 12 pattern cards (marca los 2 de first-party)
  🎯 Comentarios vs vistas → tabla de ángulos + jugada combinada
  ✨ Ganchos perfectos     → fórmula + 6 ganchos (textual/visual/verbal) + 3 reglas
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

Ofrecer: "¿Quieres más variantes de un gancho, layouts para editores, o el calendario de guiones con este criterio?"

---

## PASO 11 — Encadenamiento opcional (si lo piden)

La auditoría alimenta el resto del ecosistema. Si Andrea lo pide (o proactivamente al final):
- **Calendario de guiones** (`CALENDARIO_GUIONES.md`): una semana de guiones que cumplan SOLO el criterio ganador (cada uno con gancho textual/visual/verbal + guion teleprompter con re-hooks por segundo + CTA + nota de producción). Aplicar la jugada combinada carrusel→reel.
- **Memoria**: guardar el criterio ganador como memoria `feedback` + puntero en `MEMORY.md` (ver [[feedback_criterio_ganchos_andrea]]).
- **Segundo Cerebro**: copiar REPORTE.md + index.html + hooks + anatomía + calendario a `/Documents/OFICIAL SECOND BRAIND ANDREA 11 JUNIO/outputs/<fecha>_auditoria-ganchos-cuenta/`.
- **Yapper**: subir cada guion con `mcp__yapper__save_yapper_script` (cuenta principal, `scheduled_date`, `entry_type` script/carousel).

---

## Reglas críticas

- **NO** confundir `videoViewCount` con `videoPlayCount`. Usar SIEMPRE `playCount` para ordenar (es lo que IG muestra públicamente).
- **NO** saltarse el ffmpeg con `-ss 1` — el frame 0 suele ser negro o thumbnail genérico.
- **NO** usar nano_banana al 1k para los mockups — texto sale ilegible. SIEMPRE 2k mínimo (4k si el saldo lo permite). Ver [[feedback_avatar_imagen]].
- **NO** generar mockups con la cara EXACTA de nadie. Si auditas OTRA cuenta, layouts genéricos del estilo de esa cuenta. Si es la propia cuenta de Andrea, layouts de una creadora genérica de marca como referencia para editores (no su cara real).
- **NO** scrapear solo N cuando piden "top N vs bottom N": eso da los N más RECIENTES. Scrapear ~70 y ordenar por playCount.
- **NO** ignorar las estadísticas nativas si Andrea las pega: guardados/compartidos/seguidores/%no-seguidores NO vienen del scraper y cambian el análisis.
- **SÍ** marcar el sesgo de recencia (reels <5 días en el bottom).
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
