---
name: investigacion-contenido-formula100k
description: >
  Investigación de tendencias e ideas de contenido viral con la metodología FÓRMULA 100K. Usar cuando pidan: investigar tendencias, encontrar ideas, cazar temas virales, qué funciona en mi nicho, investigar competencia, ganchos visuales, validar ideas, preguntas de la audiencia, outliers de YouTube para convertir en reels, "buscar referencias virales por keyword", "cazar 1 ejemplo viral por cada item de un framework" (7 pilares, 33 estructuras, 10 ganchos); o "no sé de qué hablar", "quiero ideas para mis videos", "buscame referencias con [keyword]", "ejemplos virales de [pattern]". Stack permanente de 4 motores juntos: (1) agent-browser SIEMPRE para entrar logueada a Instagram/TikTok/YouTube y extraer captions, ganchos verbatim, métricas y reels reales; (2) Tavily (tendencias web y validación cruzada); (3) vidIQ (outliers de YouTube); (4) Supadata (landings sin login). agent-browser nunca es fallback: es fijo en el stack.
---

# Skill: Investigación de Contenido — Fórmula 100K

Esta skill convierte a Claude en un detective de contenido que caza tendencias e ideas virales ANTES de que todo el mundo las conozca, usando la metodología de investigación de FORMULA 100K.

---

## MENTALIDAD DEL INVESTIGADOR

Al entrar a esta skill, Claude deja de ser consumidor de contenido y se convierte en estratega. Cada búsqueda tiene un objetivo: encontrar qué está funcionando ahora, qué preguntas tiene la audiencia, y qué ángulos tienen potencial viral.

---

## STACK PERMANENTE DE INVESTIGACIÓN

Cuatro motores trabajan SIEMPRE juntos, no se excluyen. Cada uno tiene su zona donde nadie más entra:

| Motor | Zona exclusiva | Cuándo es protagonista |
|-------|----------------|------------------------|
| **agent-browser** | IG/TikTok logueado · captions verbatim · views reales · reels carousel · DMs · stories · cualquier cosa detrás de login | SIEMPRE que haya cuentas referencia, perfiles a auditar, hashtags a explorar o contenido que solo se ve estando logueada |
| **Tavily MCP** | Web abierta · tendencias · artículos · validación cruzada | Para dimensionar tendencia con fuentes públicas y encontrar dónde más se valida el tema |
| **vidIQ MCP** | YouTube outliers + transcripts + comentarios + keyword research | Para cazar videos largos con multiplicador real de views y convertirlos en reels |
| **Supadata MCP** | Landings, blogs, transcripts de YouTube cuando vidIQ no aplica | Complemento — NO competir con agent-browser para IG/TikTok logueado |

**Regla de oro:** si la usuaria ya nombró cuentas referencia o el target es IG/TikTok, agent-browser entra SIEMPRE en el primer paso. No esperar a que otra herramienta falle.

---

## PROCESO DE INVESTIGACIÓN (paso a paso)

### Paso 1 — Entender el nicho y objetivo
Antes de buscar, preguntar si no está claro:
- ¿Cuál es tu nicho o tema principal?
- ¿Qué tipo de contenido buscas? (educativo, de venta, viral, storytelling)
- ¿Tienes algún tema o palabra clave en mente?
- ¿Tienes 1-5 cuentas referencia que quieras que analice a fondo? (si dice sí → agent-browser es OBLIGATORIO)

### Paso 1.5 — agent-browser PRIMERO si hay cuentas referencia

Si la usuaria nombró cuentas IG/TikTok (suyas o competencia), arrancar SIEMPRE con agent-browser antes de Tavily/vidIQ. agent-browser:
- Entra logueado con la sesión de Andrea (más data que cualquier API)
- Extrae los reels top de cada cuenta con caption + views + formato del primer frame
- Saca ganchos verbatim de la pestaña Reels
- Mina hashtags y exploración por tema dentro de IG/TikTok

Prompt típico para agent-browser:
```
Abre Chrome con sesión existente (IG y TikTok logueados).
Para cada cuenta [@handle], visita /reels/, extrae los 9 reels top con:
- URL · caption completo · views · formato del primer frame.
Después busca [keyword] en TikTok y trae top 5 con URL + caption + views.
Output: markdown crudo, una sección por cuenta.
```

### Paso 1.6 — BÚSQUEDA POR KEYWORD PATTERN (cuando el usuario entrega una lista de palabras clave)

**Activación:** cuando el usuario entrega 1+ palabras clave para investigar en TikTok (ej. "buscame referencias con 'lo que nunca te dijeron de' y 'deja de hacer esto'"), o cuando hay que cazar 1 ejemplo viral por cada item de un framework cerrado (los 7 pilares, las 33 estructuras, los 10 ganchos verbales, etc.).

**Por qué este paso existe:** TikTok pone un captcha slider en CADA búsqueda de visitante no logueado, lo que rompe el flow normal de agent-browser. Pero el truco es que los resultados YA están renderizados en el DOM detrás del overlay — el captcha solo bloquea la UI, no el HTML. Con un eval de JS extraemos URLs, handles, captions y views sin tocar el captcha.

**Workflow (deterministic, ~15s por keyword):**

```bash
# 1. Abrir TikTok una vez en headed (si no hay sesión activa)
agent-browser --session-name f100k_tiktok --headed open https://www.tiktok.com

# 2. Por CADA keyword: navegar al search URL determinista
agent-browser open "https://www.tiktok.com/search?q=lo+que+nunca+te+dijeron+de"
sleep 3
agent-browser wait --load networkidle

# 3. Extraer resultados con eval (el captcha overlay NO bloquea el DOM)
cat <<'EOF' | agent-browser eval --stdin
(() => {
  const linkEls = Array.from(document.querySelectorAll('a[href*="/video/"]'));
  const ids = new Set();
  const out = [];
  for (const a of linkEls) {
    const m = a.href.match(/tiktok\.com\/@([^/]+)\/video\/(\d+)/);
    if (!m || ids.has(m[2])) continue;
    ids.add(m[2]);
    const img = a.querySelector('img[alt]') || (a.parentElement && a.parentElement.querySelector('img[alt]'));
    const card = a.closest('div[class]') || a.parentElement;
    const views = card ? (card.innerText.match(/\d+(\.\d+)?[KMB]/) || [''])[0] : '';
    out.push({ url: a.href.split('?')[0], handle: '@' + m[1], title: (img?.alt || '').slice(0, 180), views });
  }
  return out.slice(0, 8);
})();
EOF

# 4. Al terminar todas las keywords
agent-browser close --all
```

**Por qué el IIFE `(() => { ... })();`:** el contexto de eval persiste entre llamadas dentro de la misma sesión. Sin IIFE, `const ids = new Set()` falla en la segunda llamada con "Identifier 'ids' has already been declared". El IIFE crea scope nuevo cada vez.

**Patterns de búsqueda validados (úsalos como base y muta según el nicho):**

| Intención del contenido | Patterns que funcionan en TikTok |
|---|---|
| Revelación / insight | "lo que nunca te dijeron de" · "lo que nadie te dice de" · "el secreto que" · "lo que descubrí cuando" |
| Utilidad / tutorial | "3 trucos para" · "cómo hacer X paso a paso" · "errores que cometes en" |
| Validación emocional | "esto es para ti si sientes" · "si te sientes así" · "a veces simplemente" |
| Desafío / gamificación | "qué tipo de X eres" · "responde rápido" · "test para saber si" |
| Actualidad / curiosidad | "lo que pasó con" · "el último cambio de" · "atención a esto que" |
| Curaduría / ranking | "probé X y estas son las mejores" · "comparé X y" · "las 3 únicas X que" |
| Disrupción / anti-consejo | "deja de hacer esto" · "todos están equivocados sobre" · "no hagas esto si" |

**Cómo elegir el ganador por keyword (decisión rápida en 3 criterios):**
1. **Match al pattern**: que el caption empiece literal o muy cerca del pattern (no solo lo mencione)
2. **Vistas**: ≥50K idealmente; si nada llega a 50K, tomar el de más vistas
3. **Nicho-fit**: que el creador no sea de un nicho hostil al avatar (ej. para Andrea evitar gaming hardcore o nichos masculinos muy específicos si el video es para mujeres emprendedoras)

**Output esperado de esta búsqueda:**

```
| # | Pattern usado | URL | Handle · Vistas | Por qué califica |
|---|---|---|---|---|
| 1 | "lo que nunca te dijeron de" | tiktok.com/@.../video/123... | @edu.tec · 160K | Match literal del pattern + caption claro |
```

**Cuándo NO usar este atajo:**
- ❌ Si necesitas transcripción verbatim del audio (el DOM solo da captions; el audio hay que escucharlo o usar Apify con transcript)
- ❌ Si necesitas comentarios o engagement breakdown (Apify TikTok scraper es mejor)
- ❌ Si necesitas reels específicos de Instagram (IG bloquea más fuerte — agent-browser logueado con sesión real es obligatorio)

**Si el atajo falla** (TikTok cambia el DOM o pone captcha bloqueante):
1. Bajar a `apify/tiktok-scraper` con la keyword como query
2. Si Apify tampoco aplica, pedir al usuario que loguee TikTok en la ventana headed y reintentar

### Paso 2 — Buscar tendencias con Tavily MCP
Usar **tavily_search** para búsquedas rápidas y **tavily_research** para investigación profunda con síntesis. Usar **tavily_extract** para extraer contenido completo de una URL específica. Estrategias de búsqueda:

**Para tendencias generales del nicho:**
- `"[nicho] tendencias 2025"`
- `"[nicho] qué está funcionando en redes sociales"`
- `"[nicho] preguntas frecuentes"`
- `"[tema] errores más comunes"`

**Para ideas virales:**
- `"[nicho] viral TikTok Instagram 2025"`
- `"[tema] curiosidades que nadie explica"`
- `"[nicho] controversia debate"`

**Para ángulos de contenido:**
- `"[nicho] mitos vs realidad"`
- `"[tema] antes y después"`
- `"[nicho] secretos que nadie dice"`

**Para validar demanda:**
- `"[tema] preguntas Reddit"`
- `"[nicho] dudas más frecuentes"`
- `"[tema] qué pasa si"`

### Paso 3 — Analizar los resultados con criterios de viralidad
Por cada idea encontrada, evaluar:
1. ¿Está creciendo o es tendencia reciente?
2. ¿Genera curiosidad, miedo, identificación o controversia?
3. ¿Es comprensible para cualquier persona?
4. ¿Tiene potencial de comentarios o debate?
5. ¿Existe un ángulo propio que nadie está usando?

### Paso 4 — Entregar ideas procesadas
No entregar solo links o datos crudos. Transformar cada hallazgo en:
- **Idea de contenido** concreta y accionable
- **Ángulo sugerido** (cómo diferenciarlo)
- **Tipo de gancho verbal** recomendado (error, resultado, controversia, etc.)
- **Gatillo de viralidad** principal que activa

---

---

## HERRAMIENTAS TAVILY MCP — CUÁNDO USAR CADA UNA

| Tool | Cuándo usarlo |
|------|--------------|
| **tavily_search** | Búsquedas rápidas de tendencias, ideas, preguntas de la audiencia |
| **tavily_research** | Investigación profunda de un tema — sintetiza múltiples fuentes automáticamente |
| **tavily_extract** | Extraer contenido completo de una URL específica (ej. un artículo viral, una página de competidor) |
| **tavily_crawl** | Rastrear un sitio completo (ej. el blog de un referente para ver sus temas) |

**Flujo recomendado (cuando Andrea quiere OUTLIERS YouTube → REELS):**
1. `mcp__vidiq__outlier_detection` con keyword del nicho → top 10 outliers
2. Para los top 5: en paralelo `video_transcript` + `video_comments`
3. Aplicar tabla de traducción YouTube → Reel (sección vidIQ)
4. Entregar cada outlier convertido en el formato de output estándar + extensión vidIQ
5. (Opcional) `tavily_search` complementario para validar tendencia web del tema

**Flujo recomendado (cuando Andrea quiere INVESTIGACIÓN GENERAL):**
1. `tavily_search` → ideas rápidas y panorama general
2. `tavily_research` → profundizar en el tema más prometedor
3. `tavily_extract` → analizar una pieza de contenido viral específica
4. (Opcional) `mcp__vidiq__outlier_detection` para validar que YouTube ya tiene videos virales del tema

---

## FUENTES Y PLATAFORMAS DE INVESTIGACIÓN

### 0. AGENT-BROWSER — motor permanente del stack (NUEVO, ARRANCA AQUÍ)

**Por qué entra primero:** las APIs/MCPs (Supadata, Tavily, vidIQ) chocan con login walls de IG y TikTok. agent-browser usa la sesión real de Chrome de Andrea — ve TODO lo que ella ve cuando está logueada. Es la fuente más rica para data viral en vivo de Instagram y TikTok.

**Qué extrae que ninguna otra herramienta puede:**
- Reels top de un perfil con caption verbatim + views + thumbnail
- Posts y carruseles completos con todos los slides
- Stories destacadas
- Hashtags explorados desde la cuenta (algoritmo personalizado)
- Resultados de búsqueda TikTok desde una sesión real (no muestra los mismos resultados a usuarios públicos)
- DMs guardados, mensajes, etiquetas
- Métricas que solo aparecen con login (Reels Insights, vistas)

**Cuándo usarlo (regla simple):**
- ✅ SIEMPRE que la usuaria nombre 1+ cuenta IG/TikTok
- ✅ SIEMPRE que el target sea "investigar a la competencia en IG/TikTok"
- ✅ SIEMPRE que se pida "ganchos reales" o "captions verbatim"
- ✅ Para cazar hashtags trending dentro de la plataforma (no en buscadores externos)
- ✅ Para validar lo que Tavily/vidIQ encontraron, mirando los videos reales

**Prompt base reutilizable:**

```
[agent-browser]

Abre Chrome con la sesión existente de Andrea (IG y TikTok logueados).

TAREA A — IG. Para cada cuenta [@h1, @h2, ...]:
  1. Visita instagram.com/[handle]/reels/
  2. Extrae los 9 reels más vistos con: URL · caption completo · views · formato del primer frame.

TAREA B — TikTok. Búsquedas: [keyword1, keyword2, ...]
  Para cada búsqueda: top 5 videos con URL · caption · handle · views.

TAREA C — Hashtags IG (opcional). Hashtags: [#h1, #h2]
  Top 9 posts por hashtag con caption + formato.

OUTPUT: markdown crudo, una sección por cuenta/búsqueda/hashtag. No analizar — yo lo proceso después.
```

**Convivencia con Supadata MCP:**
- Si Supadata responde con data útil de un perfil → genial, usa esa data
- Si Supadata devuelve "limit-exceeded" o login wall → agent-browser entra al ring SIN preguntar
- Para landings públicas (sin login), Supadata sigue siendo más rápido — úsalo

**Convivencia con vidIQ MCP:**
- vidIQ es insustituible para YouTube (transcripts, comments, outliers con multiplicador real)
- agent-browser puede complementar visitando los canales reales para ver thumbnails, títulos y miniaturas en contexto

### 1. TikTok Creative Center — ads.tiktok.com/business/creativecenter
**Para qué sirve:**
- Videos "Hot" del momento: formatos que están creciendo
- Ganchos visuales que puedes reutilizar en tu nicho
- Top anuncios con CTR alto: ángulos de venta que funcionan
- Creadores en auge, hashtags trending

**Cómo usarlo:**
- Filtrar en "Hot" para ver lo más viral de los últimos 7 días
- En anuncios: filtrar por Top 1-20% de performance → son los creativos ganadores
- Buscar por palabra clave del nicho en la sección de anuncios
- El CTR alto = el anuncio es atractivo y genera clics → inspírate en su gancho visual

**Qué extraer:**
- Formatos visuales que se repiten (indican tendencia)
- Frases de gancho en los primeros segundos
- Ángulos de venta de los anuncios de alto CTR

### 2. Meta Ads Library — facebook.com/ads/library
**Para qué sirve:**
- Espiar anuncios de competidores y referentes
- Encontrar creativos ganadores que siguen corriendo

**Truco clave:** Los anuncios que llevan MÁS TIEMPO corriendo son los que mejor funcionan. Si alguien lo ha dejado activo semanas o meses, es porque sigue vendiendo. Buscar los más antiguos, no los más nuevos.

**Cómo usarlo:**
- Seleccionar país: Todos
- Buscar por nombre de competidor o referente
- Ordenar por fecha más antigua → esos son los creativos ganadores
- Inspírate en el gancho visual y el ángulo de venta, no copies el texto

### 3. Google Trends + Glimpse — trends.google.com
**Para qué sirve:**
- Validar si un tema está creciendo o cayendo
- Encontrar palabras clave relacionadas con alto crecimiento
- Descubrir preguntas que hace la audiencia alrededor de un tema
- Validar ideas de productos o cursos antes de crearlos

**Cómo usarlo:**
- Buscar el tema principal → ver % de crecimiento en los últimos 5 años
- Revisar "related topics" y "related queries" → ahí están las ideas de contenido
- Si un tema tiene +30% de crecimiento = tema en auge, habla de él ya
- Glimpse (extensión Chrome) amplía los datos de Google Trends con búsquedas mensuales exactas

**Señales de que una idea va a funcionar:**
- Crecimiento sostenido en los últimos años
- Picos recientes de búsqueda
- Preguntas relacionadas con "cómo", "qué es", "por qué"

### 4. vidIQ MCP — Outliers de YouTube → Reels virales

> **Requisito previo:** el MCP de vidIQ necesita autenticación. Si al llamar una tool sale error de auth, decirle a Andrea: "corre `/mcp` y autentica vidiq". Sin auth, ninguna tool funciona.

**Para qué sirve (en el contexto F100K):**
- Cazar videos de YouTube que están explotando (outliers) en cualquier nicho — incluso nichos que Andrea no ha tocado
- Convertir esos outliers en ideas de reel/TikTok/short adaptadas a su voz
- Validar que un tema NO solo es trending en web (Tavily) sino que YA genera views reales en video
- Sacar transcripts de los outliers para identificar la frase exacta que enganchó
- Minar comentarios para descubrir qué pregunta/dolor activó la viralidad

**14 tools disponibles, pero las 6 clave para esta skill:**

| Tool | Cuándo usarla en F100K |
|------|------------------------|
| `outlier_detection` | **Primera llamada siempre.** Pasa keyword del nicho de Andrea → devuelve videos que rompieron el promedio del canal |
| `trending_videos` | Validar qué categoría/región está caliente AHORA antes de elegir nicho |
| `breakout_channels` | Encontrar creadores emergentes en el nicho — son fuente de formatos frescos |
| `keyword_research` | Cuando Andrea no tiene claro el keyword exacto → encontrar los términos con menos competencia |
| `video_transcript` | Para cada outlier top, sacar transcript → identificar el "momento ajá" que detonó las views |
| `video_comments` | Minar comentarios del outlier → revelan qué dolor/pregunta resonó (= el ángulo del reel) |

**Flujo de conversión OUTLIER YOUTUBE → REEL F100K:**

1. **Keywords del nicho** (preguntar a Andrea si no está claro). Ejemplos para su mundo: "vender curso digital", "comunidad Skool", "creadora de contenido sin mostrar cara", "monetizar Instagram mujer", "high ticket coaching", "marca personal IA".
2. **Llamar `outlier_detection`** con esas keywords → quedarse con los top 5-10 outliers (mejor multiplicador de views vs promedio).
3. **Para cada outlier seleccionado**, ejecutar en paralelo:
   - `video_transcript` → texto completo
   - `video_comments` → top comentarios con más likes
4. **Aplicar la traducción YouTube → Reel** (ver tabla abajo).
5. **Entregar cada outlier ya convertido** en el formato de output estándar (idea + ángulo + gancho verbal + gancho visual + gatillo + formato).

**Tabla de traducción YouTube → Reel (regla F100K):**

| YouTube (formato largo) | Reel/Short (formato corto F100K) |
|-------------------------|----------------------------------|
| Título narrativo de 60-100 caracteres | Gancho verbal de 1 frase (3-7 palabras, primer segundo) |
| Intro de 30 segundos | Hook en el SEGUNDO 0 — sin intro |
| Estructura de 8-15 puntos | UNA sola idea atómica por reel |
| Storytelling extendido | Frase de tensión + payoff inmediato |
| Visual estático talking-head | Gancho visual concreto (objeto, gesto, comparación, antes/después) |
| CTA "suscríbete" | CTA de comentario o guardado |
| "Momento ajá" del minuto 7 | ESE momento ES el reel completo — sin el resto |

**Cómo elegir qué outlier convertir (criterios F100K):**

- ✅ Aplica si: el dolor del video es transferible al avatar de Andrea (creadora hispana, vende online, quiere libertad)
- ✅ Aplica si: el "momento ajá" del transcript se puede extraer en <60 segundos
- ✅ Aplica si: los comentarios revelan pregunta repetida (= la pregunta es el reel)
- ❌ NO aplica si: el outlier requiere contexto largo para que tenga sentido
- ❌ NO aplica si: el ángulo es genérico de "tips de productividad" sin filo F100K
- ❌ NO aplica si: el creador original ya domina el mismo nicho y no hay ángulo propio

**Output específico para outliers (extensión del output estándar):**

Por cada outlier convertido, agregar al final:
- 📺 **Outlier base:** título original + URL + multiplicador de views
- 🧠 **Momento ajá extraído:** frase exacta del transcript que detonó (1-2 líneas)
- 💬 **Dolor detectado en comentarios:** pregunta/queja más repetida
- 🎬 **Por qué este reel sí, no el video completo:** la razón por la que la versión 30-60s va a funcionar en IG/TikTok

### 5. Perplexity AI — perplexity.ai
**Para qué sirve:**
- Investigación profunda con fuentes actuales
- Encontrar las preguntas más frecuentes de la audiencia
- Obtener datos, estadísticas y estudios recientes sobre un tema
- Identificar ángulos controversiales o poco conocidos

**Prompts recomendados para Perplexity:**
- "¿Cuáles son las preguntas más frecuentes sobre [tema] en 2025?"
- "¿Qué errores cometen más las personas que [situación del avatar]?"
- "¿Qué controversias existen alrededor de [tema]?"
- "Dame datos sorprendentes sobre [tema] que poca gente conoce"
- "¿Qué está cambiando en [nicho] en los últimos 6 meses?"

---

## TIPOS DE INVESTIGACIÓN Y CUÁNDO USAR CADA UNA

| Objetivo | Fuente principal | Qué buscar |
|----------|-----------------|------------|
| **Cuentas referencia IG/TikTok logueado** | **agent-browser** | Top reels + captions verbatim + views + formato visual |
| **Outliers YouTube → reels** | **vidIQ MCP** | `outlier_detection` + `video_transcript` + `video_comments` por nicho |
| **Hashtags trending dentro de IG/TikTok** | **agent-browser** | Top 9 posts por hashtag desde sesión real (algoritmo personalizado) |
| Ideas virales ahora | TikTok Creative Center + **agent-browser** | Videos Hot + formatos trending (validar con tiktok.com logueado) |
| Ángulos de venta | Meta Ads Library + TikTok Ads | Anuncios antiguos activos + CTR alto |
| Validar si un tema crece | Google Trends + Glimpse + **vidIQ trending_videos** | % crecimiento + related queries + views reales en video |
| Preguntas de la audiencia | Perplexity + web_search + **vidIQ video_comments** | "preguntas frecuentes [nicho]" + comentarios de outliers |
| Ganchos visuales | TikTok Creative Center | Top videos por likes/compartidos |
| Controversia y debate | web_search | "mitos [nicho]" + "debate [tema]" |
| Ideas para productos | Google Trends + **vidIQ keyword_research** | Búsquedas de "curso [tema]" + keywords con menos competencia |
| Encontrar creadores emergentes | **vidIQ breakout_channels** | Canales con crecimiento explosivo en el nicho |

---

## CÓMO TRANSFORMAR UN HALLAZGO EN UNA IDEA DE CONTENIDO

Cuando encuentras algo interesante, aplicar este proceso:

1. **Identificar el dolor o curiosidad** que hay detrás
2. **Encontrar un ángulo propio** que nadie esté usando en tu nicho
3. **Conectar con un gancho verbal validado** (error, resultado, controversia, vacío de info, etc.)
4. **Definir el gatillo de viralidad** principal (curiosidad, FOMO, identificación, etc.)
5. **Sugerir el formato** más adecuado (reel educativo, storytelling, reacción, controversia)

**Ejemplo:**
- Hallazgo: "La gente busca mucho 'por qué mis reels no llegan a nadie'"
- Dolor: No saben qué está fallando en su contenido
- Ángulo propio: "No es el algoritmo, es este error específico del gancho"
- Gancho verbal: Gancho de error + vacío de información
- Gatillo: Curiosidad + identificación
- Formato sugerido: Reel educativo con antes/después de un gancho

---

## OUTPUT ESPERADO

Al terminar la investigación, entregar siempre:

**3 a 5 ideas de contenido listas para guionizar**, cada una con:
- Título o idea central
- Ángulo diferenciador
- Gancho verbal sugerido (con ejemplo de frase de apertura)
- Gatillo de viralidad principal
- Formato recomendado
- Nivel de potencial viral (alto / muy alto) con justificación breve

Si el usuario quiere desarrollar alguna de las ideas en guion completo, invocar la skill de guionización.

---

## MCPs ADICIONALES — DISPONIBLES EN CLAUDE DESKTOP

Estos MCPs no están disponibles en claude.ai pero sí en Claude Desktop. Cuando estés en Claude Desktop y los tengas instalados, úsalos para investigación directa en las plataformas.

### TikTok MCP — davibauer/tiktok-mcp
**Instalación:** `mcp add davibauer/tiktok-mcp`
**Para qué sirve:**
- Buscar videos virales directamente en TikTok por palabra clave
- Ver tendencias reales dentro de la plataforma
- Extraer ganchos visuales y formatos de top performers
- Analizar hashtags en auge en tu nicho

**Cuándo usarlo en investigación:**
- Buscar `[nicho] + tendencia actual` directamente en TikTok
- Encontrar el top 10 de videos más virales de una categoría
- Ver qué formatos están explotando esta semana

### Instagram MCP — smithery instagram
**Instalación:** `mcp add instagram`
**Para qué sirve:**
- Buscar reels y posts virales por tema
- Analizar perfiles de referentes y competidores
- Ver qué tipo de contenido genera más engagement en tu nicho

**Cuándo usarlo en investigación:**
- Analizar los últimos posts de un referente específico
- Buscar reels virales de tu nicho por hashtag
- Ver qué CTA y ganchos textuales usa la competencia

### Flujo recomendado en Claude Desktop (con todos los MCPs)

1. **tavily_research** → panorama general del tema y tendencias web
2. **TikTok MCP** → videos virales reales + formatos trending ahora
3. **Instagram MCP** → reels y posts de referentes en tu nicho
4. **tavily_extract** → analizar en profundidad una URL específica que encontraste
5. Sintetizar todo en 3-5 ideas accionables con gancho y gatillo definidos

### Nota para claude.ai
En claude.ai sin estos MCPs, usar Tavily con estas búsquedas para aproximarse:
- `site:tiktok.com [nicho] [tema]` → videos públicos de TikTok
- `"trending" OR "viral" [nicho] TikTok Instagram 2025` → reportes de tendencias
- `[referente] Instagram reels estrategia` → análisis externos de cuentas
