---
name: patron-ig-f100k
description: >
  Módulo del Autopilot F100K que corre cada lunes a las 8:05 AM Lima: descarga los videos de @andreaestratega publicados en los últimos 7 días vía Apify, transcribe el audio de cada video con Supadata, calcula mediana de views/likes/comentarios, clasifica videos como virales (>1.5x mediana) o negativos (<0.7x), extrae patrones de qué funcionó y qué no, y actualiza el archivo de memoria patterns_ig_andrea.md para que guionización aprenda semana a semana. Usar cuando alguien diga: "analiza mis patrones de la semana", "qué patrones detectaste", "actualiza mi memoria de patrones IG", "ejecutar análisis de patrones IG", "qué me funcionó esta semana", o cuando el schedule automático lo invoque.
---

# Skill: Análisis de Patrones IG — Autopilot F100K

Cada lunes este módulo entra a Instagram, descarga tus videos de la semana, los transcribe, y construye el mapa de lo que te funcionó y lo que no. Ese mapa va directo a tu memoria para que cada guión que escriba después sea mejor que el anterior.

---

## PASO 1 — CARGAR CONFIG

```bash
cat ~/.f100k-radar/config.json
```

Extraer: `ig_handle` (default: `andreaestratega`), `email`.

Si el archivo no existe → detener y decir:
> "No encontré tu configuración del Autopilot. Corre `/rutina-maestra-formula100k` primero."

---

## PASO 2 — SCRAPING VÍA APIFY

### 2A — Obtener schema del actor

Usar `fetch-actor-details` (Apify MCP) con: `actorName: "apify/instagram-scraper"`

### 2B — Lanzar el scraper

Usar `call-actor` con:
- `actorName: "apify/instagram-scraper"`
- `waitSecs: 45`
- Input:
```json
{
  "usernames": ["[ig_handle]"],
  "resultsLimit": 20,
  "resultsType": "posts",
  "addParentData": false
}
```

### 2C — Obtener resultados

Usar `get-dataset-items` con el `datasetId` del run.

### 2D — Filtrar y construir lista

Conservar solo posts donde `timestamp` (o `takenAt`) >= hace 7 días.

Para cada post extraer:
- `shortCode` → URL: `https://www.instagram.com/reel/[shortCode]/`
- `caption` → primeras 200 chars
- `timestamp`
- `videoViewCount` o `videoPlayCount` (usar el que esté disponible)
- `likesCount`
- `commentsCount`
- `type` → conservar solo `Video` / `Reel` (descartar imágenes estáticas)

Si no hay posts en 7 días → terminar con mensaje:
> "No hubo videos/reels publicados en los últimos 7 días. Sin datos para analizar."

---

## PASO 3 — TRANSCRIBIR CADA VIDEO CON SUPADATA

Para CADA video/reel filtrado, ejecutar:

```bash
curl -s -X GET "https://api.supadata.ai/v1/transcript?url=https://www.instagram.com/reel/[shortCode]/" \
  -H "x-api-key: sd_8ff1f1f233fc19cb14b5b86277ae2d6b"
```

Del response extraer:
- Campo `content` → texto completo de la transcripción
- Si el request falla o `content` está vacío → `transcripcion: "no disponible"`

Construir array `videos[]` con:
```
{ url, caption, timestamp, views, likes, comentarios, transcripcion }
```

---

## PASO 4 — CALCULAR MEDIANA Y CLASIFICAR

### 4A — Calcular medianas de la semana

Con todos los videos del array:
- `median_views` = mediana de todos los valores `views`
- `median_likes` = mediana de todos los `likes`
- `median_comments` = mediana de todos los `comentarios`

Para calcular mediana: ordenar los valores de menor a mayor, tomar el valor central (o promedio de los dos centrales si N es par).

Si `median_views` = 0 → usar 1 para evitar división por cero.

### 4B — Score relativo por video

```
score = (views / median_views) * 0.5 + (likes / median_likes) * 0.3 + (comments / median_comments) * 0.2
```

### 4C — Clasificar

- `viral`: score >= 1.5
- `negativo`: score <= 0.7
- `neutral`: entre 0.7 y 1.5

---

## PASO 5 — EXTRAER PATRONES

Analizar videos virales vs negativos en estos 8 ejes:

1. **Gancho de texto** — primeras 5-7 palabras del caption
2. **Gancho verbal** — primeras 5-7 palabras de la transcripción (si disponible)
3. **Tópico principal** — ¿de qué trata? (ej: IA, estrategia, motivación, resultados, herramienta)
4. **Hora de publicación** — mañana (6-12h) / tarde (12-18h) / noche (18-24h)
5. **CTA explícito** — ¿la transcripción menciona "comenta", "guarda", "comparte", "escríbeme"?
6. **Número o métrica en apertura** — ¿abre con un dato numérico en los primeros 10 segundos?
7. **Estructura** — ¿es problema-solución, lista de N puntos, dato sorpresa, historia personal, o demo?
8. **Longitud del caption** — corto (<80 chars), medio (80-200), largo (>200)

**Sintetizar en lenguaje directo:**

Para cada eje donde haya diferencia notable entre virales y negativos, escribir:
- "VIRAL: [patrón observado]"
- "NEGATIVO: [patrón observado]"

Si solo hay 1 video en alguna categoría → indicarlo como "muestra pequeña (1 video), tomar con precaución".

---

## PASO 6 — LEER HISTORIAL EXISTENTE

```bash
cat /Users/kissita/.claude/projects/-Users-kissita/memory/patterns_ig_andrea.md 2>/dev/null
```

Extraer la sección `## Historial semanal` completa para preservarla en el archivo actualizado.

---

## PASO 7 — ESCRIBIR ARCHIVO DE MEMORIA

Usar la herramienta **Write** en:
`/Users/kissita/.claude/projects/-Users-kissita/memory/patterns_ig_andrea.md`

Con esta estructura exacta:

```markdown
---
name: patterns-ig-andrea
description: Patrones virales y negativos de @andreaestratega en Instagram — actualizado automáticamente cada lunes por el Autopilot F100K. Leer ANTES de escribir cualquier guión para Andrea.
metadata:
  type: feedback
---

# Patrones IG @andreaestratega

**Última actualización:** [FECHA DE HOY]
**Videos analizados:** [N] reels · Semana del [LUNES] al [DOMINGO]
**Medianas semanales:** [median_views] views · [median_likes] likes · [median_comments] comentarios

---

## Patrones VIRALES — qué repite cuando le va bien

[LISTA DE PATRONES — uno por línea, formulados como reglas accionables]

**Why:** Identificados en [N_viral] video(s) con score ≥ 1.5 esta semana.
**How to apply:** Abrir guiones con estos patrones, usar estos ganchos verbales, publicar en estos horarios.

---

## Patrones NEGATIVOS — qué evitar

[LISTA DE PATRONES NEGATIVOS]

**Why:** Identificados en [N_negativo] video(s) con score ≤ 0.7.
**How to apply:** Evitar estas aperturas, no publicar en estos horarios, detectar y reescribir si el guión cae en estos patrones.

---

## Detalle de videos esta semana

| Caption (inicio) | Views | Likes | Comments | Score | Clasificación |
|-----------------|-------|-------|----------|-------|---------------|
[FILAS CON CADA VIDEO]

---

## Historial semanal

### Semana del [LUNES] al [DOMINGO]
- Virales: [N] · Neutrales: [N] · Negativos: [N]
- Patrón viral dominante: [síntesis en 1 línea]
- Patrón negativo dominante: [síntesis en 1 línea]

[HISTORIAL DE SEMANAS ANTERIORES PRESERVADO AQUÍ]
```

---

## PASO 8 — CONFIRMACIÓN FINAL

Mostrar en terminal:
```
✅ Análisis de patrones IG completado
📊 [N] videos analizados · [N_viral] virales · [N_negativo] negativos · [N_neutral] neutrales
📝 Memoria actualizada: patterns_ig_andrea.md
🔁 Próxima ejecución: lunes que viene a las 08:05 Lima
```

---

## NOTAS TÉCNICAS

- **Rutina remota:** `trig_01SgUSXxiGAm6jVNvm8knuQ1` — corre cada lunes a las 08:05 AM Lima (13:05 UTC) · https://claude.ai/code/routines/trig_01SgUSXxiGAm6jVNvm8knuQ1
- **MCPs requeridos:** Apify (scraping IG) + Bash (Supadata via curl)
- **Supadata key:** `sd_8ff1f1f233fc19cb14b5b86277ae2d6b`
- **Memoria destino:** `/Users/kissita/.claude/projects/-Users-kissita/memory/patterns_ig_andrea.md`
- **Config:** `~/.f100k-radar/config.json` — campo `ig_handle`
- **Costo estimado:** ~$0.50 por ejecución (Apify scraping + ~10 llamadas Supadata)
