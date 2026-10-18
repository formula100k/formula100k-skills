---
name: radar-virales-f100k
description: >
  Radar diario: caza el HECHO más reaccionable del día —un lanzamiento de IA, una movida de marketing de una marca grande, o un formato viral SIN cara— evitando a propósito reaccionar a creadores del mismo nicho (eso le entrega la audiencia a un competidor). Elige 1 ganador con scoring + filtro de exclusión, genera un guion de reacción listo para grabar con la voz del usuario donde ÉL es el intérprete del hecho, y lo entrega en el chat (y por correo si está configurado). Usar cuando alguien diga: "corre mi radar", "qué hay viral hoy", "dame el viral del día", "ejecutar radar diario", "qué puedo reaccionar hoy", o cuando el schedule automático lo invoque. Toma el rubro y las keywords del pedido, de la ficha del negocio o de ~/.f100k-radar/config.json si existe.
---

## 🧰 EN TU COMPU (leer antes de seguir: manda sobre lo que diga esta skill más abajo)

Esta skill viaja en el plugin de FÓRMULA 100K y corre igual en Mac y en Windows.

- **Tu negocio.** Los datos salen de la persona, nunca de un ejemplo: lo que venga en el pedido, su Manual o Segundo Cerebro si lo tiene, o la ficha `~/Documents/mi-contenido/mi-negocio.md`. Si no hay nada, pregunta rubro, avatar y oferta en un solo mensaje.
- **Tu marca.** Colores, letras, estilo visual y @handle salen, en este orden: de `~/Documents/mi-contenido/mi-marca.md`; si no existe, de su manual de identidad visual `mi-marca/marca.md` (en la carpeta del proyecto, en `~/mi-marca/` o en una carpeta `mi-marca` dentro de Documentos; su bloque YAML manda en los valores exactos). Si no hay ninguno, pregúntale lo que haga falta en un solo mensaje. Nunca uses los colores ni el @ de un ejemplo.
- **Tu voz.** Cómo habla (tono, palabras que usa y las que nunca usa) sale de `~/Documents/mi-contenido/mi-voz.md`. Si no existe y lo que entregas lleva texto para decir o publicar, pídele dos o tres textos suyos o que te cuente cómo habla, en un solo mensaje.
- **Dónde guardar.** Todo lo que generes va dentro de `~/Documents/mi-contenido/` (crea la subcarpeta si no existe).
- **Si falta una cuenta o un conector, no te detengas:** haz la parte que sí se puede y di en una línea qué faltó.
  - Sin Apify → usa la búsqueda web de Claude (WebSearch y WebFetch) y los enlaces que la persona te pase. Toda cifra que no leíste de la fuente va marcada «sin verificar». Nunca inventes una métrica ni un enlace.
  - Sin `agent-browser`, Tavily, Supadata o vidIQ → lo mismo: búsqueda web de Claude.
  - Sin Higgsfield ni otra herramienta de imagen → entrega la pieza en HTML y tipografía si se puede, y deja el prompt de cada imagen listo para cuando conecte la cuenta.
  - Sin Gmail → entrega el resultado en el chat y guárdalo como archivo.
- **Nombres de herramientas.** Un conector puede aparecer como `mcp__claude_ai_<Nombre>__…` o `mcp__<nombre>__…`: usa el que esté disponible.
- **Otras skills.** Las que nombra esta skill vienen en el mismo plugin. Si alguna no está instalada, sigue sin ella y avisa.
- **Archivos de esta skill.** Las rutas como `references/…` son relativas a la carpeta de esta skill (la que tiene este `SKILL.md`), no a `~/.claude/skills/`.
- **Abrir un archivo o una carpeta:** en Mac `open "<ruta>"`; en Windows `start "" "<ruta>"`.
- **Llaves.** Nunca pidas que peguen una llave o un token en el chat ni los escribas en un archivo de `~/Documents/mi-contenido/`.

---

# Skill: Radar Diario de Virales

Cada mañana, este skill hace el trabajo de detective por ti: escanea TikTok y las noticias del día, elige EL viral más aprovechable para tu nicho, y te entrega un guion de reacción listo para grabar. Solo tienes que leerlo y grabar.

---

## FASE 1 — DATOS DE LA PERSONA

Necesitas: `niche` (su rubro), `keywords` (de 3 a 5), `voice_profile` (cómo habla) y, solo si quiere el resultado por correo, `email`.

Búscalos en este orden y detente en el primero que los tenga:

1. Lo que venga en el pedido (si te llamó un agente, usa lo que te pasó).
2. `~/.f100k-radar/config.json`, si existe.
3. La ficha `~/Documents/mi-contenido/mi-negocio.md` (y `~/Documents/mi-contenido/mi-voz.md` para `voice_profile`), o su Manual o Segundo Cerebro.
4. Si no hay nada: pregunta rubro y de 3 a 5 keywords en un solo mensaje.

**No te detengas porque falte el archivo de configuración.** Si la persona quiere dejar sus datos fijos, guárdalos tú en `~/.f100k-radar/config.json`.

Las tres listas de búsqueda de la FASE 2 (`radar_sources`) y el filtro `radar_exclusion` salen del config si existe. Si no, derívalos en el momento a partir de `niche` y `keywords`:

- `ai_launches` → "lanzamiento inteligencia artificial [niche]", "nuevo modelo IA OpenAI Google Anthropic Meta", "nueva herramienta IA [niche]"
- `brand_marketing` → "campaña marketing viral marca grande", "caso de marketing empresa", "jugada marketing marca redes sociales"
- `faceless_virals` → "tendencia viral formato redes", "formato viral instagram tiktok", + 1 query armada con las `keywords` del usuario
- `radar_exclusion` → "DESCARTAR cualquier viral que sea un creador del MISMO nicho ([niche]) dando tips o educando — reaccionar a eso le entrega tu audiencia a un competidor. Solo se permite reaccionar a un creador de OTRO rubro y como CONTRASTE, nunca como autoridad a seguir."

⚠️ El nicho de la exclusión es el del **usuario que corre el radar**, no "marketing y creación de contenido". Una alumna nutricionista debe excluir nutricionistas, no marketers.

---

## FASE 2 — CAZA DE HECHOS (no de creadores)

> **PRINCIPIO RECTOR DEL RADAR (v1.1):** reaccionamos a **HECHOS, no a creadores.**
> Reaccionar a otro creador de tu nicho dándote tips le entrega tu audiencia (lo descubren y lo siguen, y te posiciona como comentarista de un par). En cambio, cuando el "personaje" del viral es una entidad sin cara —un lanzamiento de IA, una movida de una marca grande, un formato viral genérico— **no hay nadie a quién irse a seguir, y TÚ eres la intérprete.** El hecho es el gancho; tu opinión es el producto.
>
> Por eso este radar NO busca TikToks por keywords de nicho (eso trae competidores). Busca en **3 carriles de hechos**.

### Carril A — Lanzamientos de IA (Tavily)

Para cada query en `config.radar_sources.ai_launches`, lanzar `mcp__claude_ai_Tavily__tavily_search`:
```json
{
  "query": "[query] últimas 48 horas",
  "search_depth": "advanced",
  "max_results": 5
}
```
Busca: nuevos modelos, features, herramientas o cambios de IA que afecten cómo se crea contenido que vende.
Conservar: URL, título, snippet, fuente, fecha. → lista `ai_candidates`.

### Carril B — Movidas de marketing de marcas grandes (Tavily)

Para cada query en `config.radar_sources.brand_marketing`, lanzar `mcp__claude_ai_Tavily__tavily_search` (igual estructura).
Busca: campañas, casos o jugadas de marketing de empresas grandes (Coca-Cola, Nike, Duolingo, McDonald's, Netflix, etc.) que se puedan diseccionar con tu lente de venta.
Conservar igual. → lista `brand_candidates`.

### Carril C — Virales SIN cara/competidor (TikTok via Apify, filtrado duro)

Usar `mcp__apify__call-actor` con `clockworks/tiktok-scraper`. Para cada keyword en `config.radar_sources.faceless_virals`:
```json
{
  "searchQueries": ["[keyword]"],
  "resultsPerPage": 15,
  "shouldDownloadVideos": false,
  "shouldDownloadCovers": false
}
```
`waitSecs: 45`. Filtrar:
- Publicados en las últimas 48h (`createTime`)
- Views mínimo 100,000 (bajar a 50,000 si nada supera el umbral)
- **DESCARTAR DE ENTRADA** todo video que sea un creador educando/dando tips de marketing, creación de contenido, IA para creadores o monetización (aplicar `config.radar_exclusion`). Lo que queda son tendencias/formatos donde el protagonista NO es un competidor a seguir.

Conservar: URL, caption, views, likes, shares, autor, fecha. → lista `faceless_candidates`.

> **Nota:** Carril C es el de mayor riesgo de colar un competidor. Ante la duda sobre un candidato de TikTok, descártalo. Es preferible un día con ganador de Carril A o B que reaccionar a un par.

Consolidar `ai_candidates` + `brand_candidates` + `faceless_candidates` en `all_candidates`.

---

## FASE 3 — ELEGIR EL GANADOR DEL DÍA

### Paso 3A — FILTRO DE EXCLUSIÓN (eliminatorio, antes de puntuar)

Recorrer `all_candidates` y **eliminar** todo candidato que active `config.radar_exclusion`:
- ❌ Creador del MISMO nicho (marketing, creación de contenido, IA para creadores, monetización, redes) dando tips o educando → **fuera.** Reaccionar a esto le entrega tu audiencia a un competidor.
- ✅ Se conserva: lanzamientos/noticias de IA, movidas de marcas grandes, formatos virales sin cara, o creadores de OTRO rubro usables como contraste (ej. un chef, un atleta) — nunca como autoridad a seguir.

Si tras el filtro quedan 0 candidatos → ampliar Carril A/B con una query extra de IA/marca antes de rendirse. El radar diario casi siempre debe tener ganador de hecho/noticia.

### Paso 3B — Scoring y selección

Evaluar los candidatos sobrevivientes contra estos criterios:

| Criterio | Peso | Cómo evaluar |
|----------|------|--------------|
| Sin-competidor / autoridad propia | 35% | ¿El protagonista es un HECHO (IA, marca, formato) y no un creador a seguir? ¿el usuario queda como intérprete, no como comentarista de un par? Máximo si no hay nadie a quién irse a seguir. |
| Potencial de reacción / opinión | 30% | ¿Puede agregar una lectura que nadie está dando? ¿Genera debate? |
| Aplicabilidad a "crear contenido que vende" | 20% | ¿Se puede aterrizar en qué significa esto para que su audiencia venda con contenido? (el ángulo de su negocio) |
| Frescura + viralidad | 15% | Publicado en últimas 24-48h · views/autoridad del medio |

Asignar puntuación del 1-10 a cada candidato y elegir el TOP 1.

Regla de desempate: preferir el de mayor puntaje en "Sin-competidor / autoridad propia" (criterio 1). Entre dos hechos igual de fuertes, gana el de Carril A (IA) o B (marca) sobre Carril C (TikTok).

Guardar en `winner`:
- título o caption (primeras 80 chars)
- URL
- métricas clave (views/fuente)
- tipo: "lanzamiento-ia" | "movida-marca" | "viral-sin-cara"
- razón de selección (1 línea — por qué deja al usuario como intérprete del hecho, no como comentarista de un par)

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
Patrón de CTA:
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

### Paso 5 — Entregar

**Entrega.** Por defecto muestra el resultado en el chat y guárdalo en `~/Documents/mi-contenido/investigacion/`. Crea además el borrador de correo solo si hay `email` y el conector de Gmail está conectado; si no, no lo menciones como error.

Usar `mcp__claude_ai_Gmail__create_draft` con:

**Para:** `config.email`

**Asunto:**
```
🔥 Tu radar — [día abreviado, fecha] | [primeras 40 chars del título del viral]
```
Ejemplo: `🔥 Tu radar — Jue 29 May | [título del hecho]`

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
Tu radar de contenido
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Paso 6 — Confirmar en terminal

```
✅ Radar listo: [ruta del archivo] (y borrador de correo si aplica)
📊 Viral del día: [título, primeras 50 chars]
🕐 [hora actual]
```
