---
name: radar-virales-f100k
description: >
  Módulo del Autopilot F100K que corre diariamente: caza el viral más relevante del día en TikTok y noticias/YouTube de IA y del nicho del usuario, elige 1 ganador con scoring, genera un guion de reacción listo para grabar con la voz del usuario, y envía todo por email. Usar cuando alguien diga: "corre mi radar", "qué hay viral hoy", "dame el viral del día", "ejecutar radar diario", "qué puedo reaccionar hoy", o cuando el schedule automático lo invoque. Requiere config en ~/.f100k-radar/config.json — si no existe, instruir a correr /rutina-maestra-formula100k primero.
---

# Skill: Radar Diario de Virales — Autopilot F100K

Cada mañana, este skill hace el trabajo de detective por ti: escanea TikTok y las noticias del día, elige EL viral más aprovechable para tu nicho, y te entrega un guion de reacción listo para grabar. Solo tienes que abrir el email y grabar.

---

## FASE 1 — CARGAR CONFIG

### Paso 1 — Leer config del usuario

```bash
cat ~/.f100k-radar/config.json
```

Si el archivo no existe o da error → detener y decir:
> "No encontré tu configuración del Autopilot. Corre `/rutina-maestra-formula100k` primero para hacer el setup inicial — toma ~3 minutos."

Extraer y guardar en memoria de trabajo:
- `niche` → nicho del usuario
- `keywords` → array de keywords de búsqueda
- `email` → destino del digest
- `voice_profile` → perfil de voz

---

## FASE 2 — CAZA DE VIRALES

### Paso 2A — TikTok via Apify

Usar `mcp__apify__call-actor` con el actor `clockworks/tiktok-scraper`:

Para cada keyword en `config.keywords`, lanzar una búsqueda:
```json
{
  "searchQueries": ["[keyword]"],
  "resultsPerPage": 15,
  "shouldDownloadVideos": false,
  "shouldDownloadCovers": false
}
```

Usar `waitSecs: 45` para esperar resultados.

Filtrar resultados:
- Publicados en las últimas 48 horas (campo `createTime`)
- Views mínimo: 100,000 (bajar a 50,000 si ninguno supera el umbral)
- Conservar por cada resultado: URL, caption/texto, views, likes, shares, autor, fecha

Consolidar todos en lista `tiktok_candidates`.

### Paso 2B — Noticias y YouTube via Tavily

Lanzar 2 búsquedas con `mcp__claude_ai_Tavily__tavily_search`:

**Búsqueda 1 — nicho general:**
```json
{
  "query": "[niche] tendencia viral hoy",
  "search_depth": "advanced",
  "max_results": 5
}
```

**Búsqueda 2 — IA y herramientas** (ejecutar siempre, es nicho universal en el ecosistema F100K):
```json
{
  "query": "nueva herramienta inteligencia artificial creadores contenido lanzamiento",
  "search_depth": "advanced",
  "max_results": 5
}
```

Conservar por cada resultado: URL, título, snippet, fuente, fecha publicación.
Consolidar en lista `news_candidates`.

---

## FASE 3 — ELEGIR EL GANADOR DEL DÍA

### Paso 3 — Scoring y selección

Evaluar TODOS los candidatos (TikTok + noticias) contra estos criterios:

| Criterio | Peso | Cómo evaluar |
|----------|------|--------------|
| Relevancia al nicho (`config.niche`) | 40% | ¿Conecta directamente con lo que el usuario enseña/vende? |
| Potencial de reacción | 30% | ¿El usuario puede agregar perspectiva única y diferente? ¿Genera opinión? |
| Viralidad actual | 20% | Views/likes para TikTok · autoridad del medio para noticias |
| Frescura | 10% | ¿Publicado en las últimas 24h? (+bonus de 1 punto) |

Asignar puntuación del 1-10 a cada candidato y elegir el TOP 1.

Regla de desempate: si hay empate, preferir el que tenga mayor potencial de reacción (criterio 2).

Guardar en `winner`:
- título o caption (primeras 80 chars)
- URL
- métricas clave (views/fuente)
- tipo: "tiktok" o "noticia"
- razón de selección (1 línea)

---

## FASE 4 — GENERAR GUION DE REACCIÓN

### Paso 4 — Escribir el guion con la voz del usuario

Escribir un guion de reacción de 45-60 segundos (máximo 120 palabras) usando la siguiente estructura:

```
[GANCHO VISUAL — 0-3s]
Referencia directa al viral. Opciones:
- "Acabo de ver esto y necesitaba compartirlo..."
- "Esto que está viral ahora mismo en [red] me hizo pensar algo importante..."
- "[Dato más impactante del viral] — y esto es lo que nadie está diciendo al respecto."

[CONTEXTO — 3-8s]
1-2 líneas: qué es el viral, de dónde viene, por qué está trending ahora.

[PERSPECTIVA ÚNICA — 8-45s]
3 puntos de vista propios. Estructura:
Punto 1: "Lo que esto confirma sobre [tema del nicho] es..."
Punto 2: "Lo que la mayoría está pasando por alto aquí es..."
Punto 3: "Lo que yo haría diferente / lo que aprendí de esto es..."
→ Usar voz del usuario: [voice_profile]
→ Conectar con el nicho: [niche]
→ Incluir marcas de acción donde aplique: [PAUSA], [SEÑALAR CÁMARA], [ZOOM IN], [MOSTRAR PANTALLA]

[CTA — 45-55s]
Pregunta de engagement que invite a comentar.
Patrón CTA ganador F100K:
"¿Tú qué opinas de esto? Comenta [PALABRA DE 1-2 SÍLABAS] y te cuento [promesa de valor extra]."
```

Reglas del guion:
- Español neutro (no argentino, no regional)
- Sonar como lo escribió el usuario (respetar `voice_profile`)
- Máximo 120 palabras
- NO mencionar a ningún creador por nombre sin contexto
- SÍ mencionar la fuente/plataforma (ej: "este video de TikTok", "este artículo de The Verge")

---

## FASE 5 — ENVIAR EMAIL DIGEST

### Paso 5 — Crear email con Gmail MCP

Usar `mcp__claude_ai_Gmail__create_draft` con:

**Para:** `config.email`

**Asunto:**
```
🔥 Radar F100K — [día abreviado, fecha] | [primeras 40 chars del título del viral]
```
Ejemplo: `🔥 Radar F100K — Jue 29 May | OpenAI lanzó algo que cambia todo para creadores`

**Cuerpo (plain text con separadores visuales):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯  EL VIRAL DEL DÍA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Título o caption del viral]

📍 Fuente: [TikTok @autor / Nombre del medio]
👁️  [métricas: "X.XM views" o "publicado en [medio]"]
🔗 [URL]

POR QUÉ REACCIONAR A ESTO:
→ [Razón 1 — relevancia para el nicho]
→ [Razón 2 — perspectiva única que puedes agregar]
→ [Razón 3 — momentum actual del tema]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬  TU GUION — LISTO PARA GRABAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[GANCHO VISUAL]
[texto]

[CONTEXTO]
[texto]

[TU PERSPECTIVA]
[texto de los 3 puntos]

[CTA]
[texto]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡  NOTAS DE PRODUCCIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Duración estimada: 45-55 segundos
Formato sugerido: cara a cámara + texto overlay del punto clave
Mejor hora para publicar: dentro de las próximas 6-12h (el viral está caliente ahora)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Autopilot F100K · fórmula100k.app
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Paso 6 — Confirmar en terminal

```
✅ Radar enviado a [config.email]
📊 Viral del día: [título, primeras 50 chars]
🕐 [hora actual]
💰 Costo Apify estimado: ~$0.40
```
