---
name: radar-tendencias-f100k
description: >
  Radar que detecta tendencias emergentes ANTES de que lleguen al pico, dando 24-72h de ventana para publicar primero. Usar cuando alguien diga: "qué está despegando en mi nicho", "detectar tendencias emergentes", "qué va a ser viral pronto", "ejecutar radar tendencias", "dame las tendencias del día", o cuando el schedule automático lo invoque. Si no hay tendencia emergente real, lo dice y no inventa una. Toma el rubro y las keywords del pedido, de la ficha del negocio o de ~/.f100k-radar/config.json si existe.
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

# Skill: Radar de Tendencias Emergentes

La diferencia entre ser el primero y ser el décimo en hablar de algo es 48 horas. Este módulo detecta lo que está despegando AHORA en tu nicho para que publiques antes de la ola, no después.

---

## FASE 1 — DATOS DE LA PERSONA

Necesitas: `niche` (su rubro), `keywords` (de 3 a 5), `voice_profile` (cómo habla) y, solo si quiere el resultado por correo, `email`.

Búscalos en este orden y detente en el primero que los tenga:

1. Lo que venga en el pedido (si te llamó un agente, usa lo que te pasó).
2. `~/.f100k-radar/config.json`, si existe.
3. La ficha `~/Documents/mi-contenido/mi-negocio.md` (y `~/Documents/mi-contenido/mi-voz.md` para `voice_profile`), o su Manual o Segundo Cerebro.
4. Si no hay nada: pregunta rubro y de 3 a 5 keywords en un solo mensaje.

**No te detengas porque falte el archivo de configuración.** Si la persona quiere dejar sus datos fijos, guárdalos tú en `~/.f100k-radar/config.json`.

---

## FASE 2 — DETECCIÓN DE TENDENCIAS (3 señales)

### Señal 1 — TikTok: volumen de publicación acelerado

Buscar con Apify `clockworks/tiktok-scraper` para cada keyword:
```json
{
  "searchQueries": ["[keyword]"],
  "resultsPerPage": 50,
  "shouldDownloadVideos": false
}
```

Analizar el patrón temporal de los resultados:
- Contar videos publicados en las últimas 6h vs los publicados entre 6h-48h atrás
- **Spike = últimas 6h tienen 3x o más el promedio de las 6h anteriores**
- También observar: ¿algún video reciente acumula shares anormalmente rápido para su antigüedad?

### Señal 2 — Noticias: velocidad de propagación

Tavily `mcp__claude_ai_Tavily__tavily_search`:
```json
{
  "query": "[niche keyword] [keyword2] últimas horas noticia",
  "search_depth": "advanced",
  "max_results": 10
}
```

Contar cuántas fuentes distintas cubren el mismo tema en las últimas 24h:
- 1-2 fuentes = noticia normal → ignorar
- 3-5 fuentes = tendencia emergente ⚠️
- 6+ fuentes = tendencia confirmada 🔥

### Señal 3 — Términos léxicos nuevos

Comparar los captions de TikTok de hoy con el vocabulario de búsquedas anteriores (de memoria de la sesión o del contexto disponible):
¿Han aparecido 2+ videos usando la misma frase o término nuevo que no es parte de `config.keywords`?
Si sí → micro-tendencia léxica (nuevo meme-format, nuevo término para algo conocido)

---

## FASE 3 — CLASIFICACIÓN

Clasificar cada hallazgo:

| Nivel | Criterio | Acción |
|-------|----------|--------|
| 🔥 CALIENTE | Tendencia confirmada (6+ fuentes O spike 5x+) | Email URGENTE — publicar HOY |
| ⚠️ DESPEGANDO | Tendencia emergente (3-5 fuentes O spike 3x) | Email — publicar en 24-48h |
| 👀 OBSERVAR | Señal débil (1-2 fuentes O novedad léxica) | Solo mencionar si hay otro nivel presente |

**Regla de silencio:** si solo hay señales nivel OBSERVAR o nada → NO enviar email. El silencio significa "nada urgente hoy". Confirmar en terminal:
```
🔇 Radar Tendencias: sin tendencias emergentes hoy. No se envió email.
```

---

## FASE 4 — GENERAR GUION EXPRESS

Si hay tendencia nivel CALIENTE o DESPEGANDO, generar un guion rápido de 30-45s para aprovechar la ventana:

```
[GANCHO — 0-3s]
Referencia directa a la tendencia: "¿Ya viste lo que está pasando con [tema]?"

[QUÉ ES — 3-10s]
Una oración: qué es la tendencia y por qué importa ahora.

[TU ÁNGULO — 10-35s]
Por qué esto importa para [niche] del usuario.
2 puntos concretos de perspectiva única.
Voz: [voice_profile]

[CTA — 35-45s]
"Comenta [PALABRA] si quieres que haga un video completo sobre esto."
```

---

## FASE 5 — ENTREGA (solo si nivel ≥ DESPEGANDO)

**Entrega.** Por defecto muestra el resultado en el chat y guárdalo en `~/Documents/mi-contenido/investigacion/`. Crea además el borrador de correo solo si hay `email` y el conector de Gmail está conectado; si no, no lo menciones como error.

Usar `mcp__claude_ai_Gmail__create_draft`:

**Para:** `config.email`

**Asunto:**
- Si CALIENTE: `🔥 URGENTE — tendencia confirmada en tu nicho: [tema]`
- Si DESPEGANDO: `⚠️ Tendencia emergente detectada — [tema]`

**Cuerpo:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[🔥 CALIENTE / ⚠️ DESPEGANDO] — [TEMA EN MAYÚSCULAS]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ventana para publicar primero: [HOY MISMO / próximas 24-48h]

QUÉ ESTÁ PASANDO:
[2-3 líneas explicando la tendencia con datos concretos]

EVIDENCIA:
→ [Fuente 1 con URL]
→ [Fuente 2 con URL]
→ TikTok: [X] videos nuevos en las últimas [Y] horas sobre este tema

ÁNGULO PARA TU NICHO ([niche del usuario]):
[Sugerencia concreta de cómo conectar esta tendencia con tu contenido]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬  GUION EXPRESS — 30-45 SEGUNDOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[GANCHO]
[texto]

[QUÉ ES]
[texto]

[TU ÁNGULO]
[texto]

[CTA]
[texto]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰  Actúa rápido — las tendencias tienen ventana corta.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tu radar de contenido
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
