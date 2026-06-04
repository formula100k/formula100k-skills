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

### Paso 4 — Escribir el guion con el sistema F100K

**4A — Identificar el Pilar de Valor** (elegir UNO):

| # | Pilar | Qué genera |
|---|-------|------------|
| 1 | Revelación (Insight) | Sensación de acceder a un secreto |
| 3 | Validación Emocional | COMPARTIDOS — "eso me pasa a mí" |
| 5 | Actualidad (Curiosidad) | Posicionamiento como fuente al día |
| 7 | Disrupción (Anti-consejo) | DEBATE y autoridad superior |

Para reaccionar a un viral, los pilares más útiles son: 5 (Actualidad), 1 (Revelación), 7 (Disrupción). Elegir el que mejor encaje con el ángulo de reacción.

**4B — Elegir la Estructura según el pilar:**

- **Estructura 15 — Vacío de Información** (Pilar 5): gancho que deja algo sin resolver → contexto → revelación → consecuencia para el creador
- **Estructura 16 — El Roba Audiencia** (Pilar 1): usar la figura/viral como gancho → agregar perspectiva propia única → conectar con el nicho
- **Estructura 19 — Desafío Contracorriente** (Pilar 7): afirmación contraintuitiva → evidencia del viral → reencuadre → reto implícito

**4C — Sistema de Ganchos Triple** (los 3 alineados al mismo mensaje):

```
GANCHO VERBAL (0-3s, máx 15 palabras):
Referencia directa al viral con gatillo emocional activo.
Opciones según pilar:
- Curiosidad: "[Dato impactante del viral] — y esto cambia todo para los creadores."
- Identificación: "¿Ya viste lo que está pasando con [tema]? A mí me pasó exactamente esto."
- Sorpresa: "Esto que está viral ahora mismo confirma lo que llevo meses diciendo."

GANCHO VISUAL (qué se MUESTRA en cámara):
[Expresión de sorpresa genuina / señalar pantalla con el viral / mostrar dato en papel o pizarra]

GANCHO TEXTUAL (qué se LEE en pantalla):
[Número impactante del viral / Pregunta provocadora / Texto de alerta]

→ Los 3 deben comunicar el MISMO mensaje. Si no están alineados, reescribir.
```

**4D — Cuerpo del guion** (8-45s):

```
[CONTEXTO — 3-8s]
1-2 líneas: qué es el viral, de dónde viene, por qué está trending ahora.

[PERSPECTIVA ÚNICA — 8-45s]
3 puntos siguiendo la estructura elegida en 4B.
→ Usar voz del usuario: [voice_profile]
→ Conectar con el nicho: [niche]
→ Incluir marcas: [PAUSA], [SEÑALAR CÁMARA], [ZOOM IN], [MOSTRAR PANTALLA]
```

**4E — CTA Optimizado** (45-55s) — Patrón F100K validado:

```
1. PRIMING TRIPLE: mencionar la palabra clave 3 veces ANTES de pedirla.
   "Si tú [contexto con la palabra], si [contexto], si [contexto]..."

2. RECURSO INVISIBLE: prometer algo que solo consiguen si comentan.
   "Tengo [recurso/info] que no está publicado en ningún lado."

3. VACÍO DE INFORMACIÓN: dejar claro que falta algo importante.
   "Y lo más importante todavía no lo dije."

4. CIERRE: "Comenta [PALABRA DE 1-2 SÍLABAS] y te cuento cómo puedes acceder a [beneficio específico]."
```

La PALABRA del CTA: 1-2 sílabas, relacionada al tema del viral.

Reglas del guion:
- Español neutro (no argentino, no regional) — tú/tienes, NUNCA vos/tenés
- Sonar como lo escribió el usuario (respetar `voice_profile`)
- Máximo 120 palabras en el cuerpo
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
