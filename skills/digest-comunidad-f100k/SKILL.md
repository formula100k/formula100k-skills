---
name: digest-comunidad-f100k
description: >
  Módulo del Autopilot F100K que corre cada viernes: analiza los comentarios e interacciones de los últimos 7 días en el perfil de Instagram/TikTok del usuario, extrae las 5 preguntas más repetidas y los dolores más mencionados, y los convierte en ideas de contenido de alto valor con estructura de guion lista. Usar cuando alguien diga: "qué preguntan mis seguidores", "ideas desde mis comentarios", "qué quiere ver mi comunidad", "ejecutar digest comunidad", o cuando el schedule lo invoque los viernes. Requiere ~/.f100k-radar/config.json con ig_handle o tiktok_handle configurado.
---

# Skill: Digest de Comunidad — Autopilot F100K

Tus seguidores te dicen exactamente qué contenido quieren ver — en los comentarios. Este módulo los lee por ti cada semana y convierte sus preguntas y dolores en ideas de contenido de alto valor, listas para guionizar el lunes.

---

## FASE 1 — CARGAR CONFIG

```bash
cat ~/.f100k-radar/config.json
```

Verificar que exista `ig_handle` o `tiktok_handle`.

Si ninguno está configurado → preguntar:
> "Para el Digest de Comunidad necesito tu usuario de Instagram y/o TikTok. ¿Cuáles son? Escríbelos con @"

Guardar los handles en config antes de continuar:
```bash
# Leer, modificar y guardar el JSON con los handles nuevos
```

Extraer para el trabajo: `niche`, `email`, `voice_profile`, `ig_handle`, `tiktok_handle`

---

## FASE 2 — EXTRACCIÓN DE COMENTARIOS

### Opción A — Vía agent-browser (preferida, si hay sesión activa)

```
Abre Chrome con sesión Instagram activa.
Ve al perfil @[ig_handle].
Accede a la pestaña de posts.
Para los últimos 7 posts:
  - Extrae los primeros 25 comentarios de cada uno
  - Incluir: texto del comentario, likes del comentario, URL del post
Output: markdown crudo, una sección por post.
```

### Opción B — Vía Apify (si no hay sesión agent-browser)

Usar Apify con actor `apify/instagram-comment-scraper` o equivalente:
```json
{
  "username": "[ig_handle sin @]",
  "resultsLimit": 200,
  "commentsPerPost": 30
}
```

Para TikTok usar `clockworks/tiktok-scraper` en modo perfil:
```json
{
  "profiles": ["[tiktok_handle sin @]"],
  "resultsPerPage": 20
}
```

Filtrar: solo comentarios de los últimos 7 días.

---

## FASE 3 — ANÁLISIS Y CATEGORIZACIÓN

### Paso 3 — Agrupar por tipo e identificar temas

Leer todos los comentarios y categorizarlos:

**Tipo A — Preguntas directas**
"¿Cómo hago X?", "¿Qué herramienta usas para Y?", "¿Funciona Z para mi caso?"

**Tipo B — Dolores expresados**
"Me cuesta mucho X", "No logro entender Y", "Llevo meses intentando Z sin resultado"

**Tipo C — Objeciones y dudas**
"Pero y si no tengo X", "Eso no funciona cuando...", "¿Y si soy principiante?"

**Tipo D — Validaciones y peticiones explícitas**
"Hazme un video de X", "Quiero más de Y", "¿Puedes explicar Z más a fondo?"

Contar frecuencia de cada tema dentro de cada tipo.
Los **5 temas más frecuentes** = ideas con demanda probada.

---

## FASE 4 — CONVERTIR EN IDEAS DE CONTENIDO

### Paso 4 — De comentario a idea accionable

Para cada uno de los 5 temas top, crear:

**Título de la idea** (formulado como gancho potencial del video)
**Tipo de pieza sugerida:**
- Reel educativo (para preguntas complejas)
- Story interactiva (para encuestas y validar interés)
- Carrusel (para frameworks o listas paso a paso)
- Reel de historia (para dolores emocionales)

**Estructura recomendada** (de los 33 frameworks de guionizacion-formula100k):
Ejemplo: "Estructura 7 — El Paso a Paso" / "Estructura 12 — El Error Común" / "Estructura 19 — La Revelación"

**Por qué tiene tracción:** evidencia directa de los comentarios (número de menciones, cita de comentario representativo).

---

## FASE 5 — EMAIL DEL VIERNES

Usar `mcp__claude_ai_Gmail__create_draft`:

**Para:** `config.email`

**Asunto:**
```
💬 Lo que tu comunidad pide esta semana — Digest Viernes | Autopilot F100K
```

**Cuerpo:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬  DIGEST DE COMUNIDAD — Semana del [lunes] al [viernes]
[X] comentarios analizados · [Y] posts revisados
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LO QUE TU COMUNIDAD QUIERE VER:

1️⃣  [Tema 1] — [X] menciones
    Idea de video: "[gancho potencial]"
    Formato: [Reel / Carrusel / Story]
    Estructura: [nombre estructura F100K]
    Evidencia: "[cita de comentario real]" — @[usuario]

2️⃣  [Tema 2] — [X] menciones
    Idea de video: "[gancho potencial]"
    Formato: [tipo]
    Estructura: [nombre]
    Evidencia: "[cita]"

3️⃣  [Tema 3] — igual estructura

4️⃣  [Tema 4] — igual estructura

5️⃣  [Tema 5] — igual estructura


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐  COMENTARIO DESTACADO DE LA SEMANA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"[el comentario más representativo, emotivo o con más likes]"
— @[usuario] · [X] ❤️ · [URL del post]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡  Las ideas del digest ya están listas para el Calendario Semanal
    del próximo lunes. Tu Autopilot las tendrá en cuenta.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Autopilot F100K · fórmula100k.app
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
