# Prompts de Investigación con MCPs

Queries exactos para Tavily, Supadata y Playwright. Ejecutar en este orden de prioridad.

---

## 1. TAVILY MCP (primario)

Ejecuta 3 búsquedas en paralelo. Reemplaza `[NICHO]` y `[KEYWORDS]` con datos del bloque 3.

### Query 1 — Tendencias del nicho
```
mcp__tavily__tavily_search:
  query: "tendencias virales 2026 [NICHO] Instagram TikTok ganchos contenido reels"
  max_results: 10
  search_depth: "advanced"
```

### Query 2 — Preguntas frecuentes de la audiencia
```
mcp__tavily__tavily_search:
  query: "qué preguntas hace [AVATAR_DESCRIPTION] [NICHO] Reddit Quora foros"
  max_results: 8
```

### Query 3 — Competidores y referencias
```
mcp__tavily__tavily_search:
  query: "mejores creadores [NICHO] Instagram TikTok hispanos 2026 millones seguidores"
  max_results: 8
```

### Query 4 (opcional) — Investigación profunda
Si la alumna pidió análisis específico, usa `tavily_research`:
```
mcp__tavily__tavily_research:
  topic: "Análisis de contenido viral en [NICHO]: temas que más viralizan, ganchos comunes, formatos top, errores frecuentes"
  depth: "deep"
```

### Cómo procesar el output de Tavily

Extrae:
1. **Top 10 temas recurrentes** del nicho
2. **5-7 ganchos verbales** que se repiten
3. **3 formatos** que dominan
4. **Cuentas mencionadas** (para enriquecer competidores)

NO copies y pegues los resultados crudos. Sintetiza en bullets accionables.

---

## 2. SUPADATA MCP (si la alumna dio cuentas referencia)

Solo si la alumna proporcionó 1-3 handles de Instagram/TikTok.

### Para cada cuenta:

```
mcp__supadata__profile_analysis:
  username: "[handle_sin_arroba]"
  platform: "instagram" o "tiktok"
  analyze: ["top_posts", "engagement_patterns", "hooks", "formats"]
```

Si Supadata no tiene esa función exacta, usa los nombres reales de los métodos disponibles. Algunos comunes:
- Lista de top posts del último mes
- Análisis de patrones de engagement
- Extracción de captions/ganchos

### Cómo procesar el output de Supadata

Para cada cuenta extrae:
1. **Top 10 posts por engagement** (con texto del caption + tipo de contenido)
2. **Formato dominante** (reel/carrusel/static)
3. **Patrones de gancho** (frases iniciales recurrentes)
4. **Frecuencia de publicación** (cuántas piezas/semana)

---

## 3. PLAYWRIGHT MCP (fallback)

Solo si Tavily falla o se necesita un perfil específico que Supadata no cubre.

### Caso típico: scrape de explore page de Instagram para un hashtag

```
mcp__playwright__browser_navigate:
  url: "https://www.instagram.com/explore/tags/[hashtag-del-nicho]/"

mcp__playwright__browser_snapshot
```

Extraer del snapshot los top 9 posts visibles y sus captions.

**ADVERTENCIA:** Playwright es lento (~2-3 min). Solo úsalo si los otros fallan.

---

## 4. FALLBACK: SIN MCPs DISPONIBLES

Si NINGÚN MCP responde, comunica a la alumna:

> "No pude acceder a la investigación web automática en este momento. Voy a generar tu estrategia basándome 100% en lo que me contaste de tu avatar y oferta. Esto significa que las ideas serán sólidas pero no validadas con tendencias actuales del mercado. Te recomiendo, después de tener la estrategia base, ejecutar manualmente la skill `investigacion-contenido-formula100k` para enriquecer."

Procede sin investigación pero genera ideas conservadoras que se basen ÚNICAMENTE en:
- Dolores del avatar (bloque 1)
- Vehículo único (bloque 2)
- Pilares confirmados (bloque 3)

---

## 5. CÓMO INTEGRAR LA INVESTIGACIÓN EN EL OUTPUT

Después de ejecutar los MCPs, presenta a la alumna un resumen breve antes de generar las 20 ideas:

```
🔍 Investigación completada · [NICHO]

TEMAS QUE MÁS VIRALIZAN:
- [tema 1]
- [tema 2]
- [tema 3]

GANCHOS QUE SE REPITEN:
- "[gancho 1]"
- "[gancho 2]"

FORMATOS DOMINANTES:
- [formato 1] ([%])
- [formato 2] ([%])

CUENTAS REFERENCIA DETECTADAS:
- @[cuenta1] · [característica destacable]
- @[cuenta2] · [característica destacable]

Ahora genero tus 20 ideas integrando esta data...
```

Esto le da contexto a la alumna y muestra que la investigación fue real, no fabricada.

---

## 6. CÓMO USAR LOS DATOS PARA GENERAR IDEAS

Cada idea generada debe poder rastrearse a:
- Un dolor del avatar (bloque 1) o
- Un tema viral encontrado en investigación o
- Un patrón de la competencia identificado

**Ejemplo:**
> Idea: "El error que comete el 90% al guionizar reels"
> Rastreo: dolor "no sé qué decir" + dato encontrado en Tavily ("90% de creadores fallan en el gancho") + formato top en Supadata (carrusel educativo)

NO inventes ideas que no tengan rastreo. Si una idea no se sustenta, descártala.

---

## 7. LÍMITE DE INVESTIGACIÓN

- Tiempo máximo: 90 segundos en total
- Si Tavily devuelve poco/nada útil, NO sigas escarbando — procede con lo que tienes
- NO ejecutes más de 4 búsquedas Tavily por sesión (cuesta tokens)
- NO ejecutes Playwright a menos que sea estrictamente necesario
