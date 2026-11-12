---
name: metricas-semanales-f100k
description: "Reporte semanal de métricas de Instagram o TikTok: post ganador y por qué, comparación con la semana anterior y qué replicar. Usar con «muéstrame mis métricas de la semana», «cuál fue mi mejor post», «reporte semanal de métricas»."
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

# Skill: Métricas Semanales

Cada domingo recibes una retrospectiva simple: qué post ganó esta semana, por qué funcionó, y qué replicar la próxima. Sin tener que revisar Instagram Insights ni TikTok Analytics manualmente.

---

## FASE 1 — DATOS DE LA PERSONA

Necesitas: `niche` (su rubro), `keywords` (de 3 a 5), `ig_handle` o `tiktok_handle` y, solo si quiere el resultado por correo, `email`.

Búscalos en este orden y detente en el primero que los tenga:

1. Lo que venga en el pedido (si te llamó un agente, usa lo que te pasó).
2. `~/.f100k-radar/config.json`, si existe.
3. La ficha `~/Documents/mi-contenido/mi-negocio.md`, o su Manual o Segundo Cerebro.
4. Si no hay nada: pregunta rubro y de 3 a 5 keywords en un solo mensaje.

**No te detengas porque falte el archivo de configuración.** Si la persona quiere dejar sus datos fijos, guárdalos tú en `~/.f100k-radar/config.json`.

**Sin Apify:** pide a la persona una captura de sus estadísticas de la semana, o la lista de sus publicaciones con vistas, me gusta y comentarios. Trabaja con eso y dilo en el reporte. Sin datos no hay reporte: no estimes números.

---

## FASE 2 — EXTRAER MÉTRICAS DE LA SEMANA

### Opción A — Instagram vía Apify

Usar Apify con actor para Instagram profiles:
```json
{
  "username": "[ig_handle sin @]",
  "resultsLimit": 15,
  "scrapeType": "posts"
}
```

Filtrar: solo posts publicados en los últimos 7 días.

Para cada post extraer:
- URL del post
- Caption (primeras 80 chars)
- Fecha de publicación
- Likes
- Comentarios
- Shares / guardados (si disponible)
- Tipo de contenido (Reel / Carrusel / Imagen)

### Opción B — TikTok vía Apify

Usar Apify `clockworks/tiktok-scraper` en modo perfil:
```json
{
  "profiles": ["[tiktok_handle sin @]"],
  "resultsPerPage": 15
}
```

Para cada video extraer:
- URL
- Caption (primeras 80 chars)
- Fecha
- Views (plays)
- Likes
- Comentarios
- Shares
- Duración

Filtrar: últimos 7 días.

---

## FASE 3 — ANÁLISIS

### Paso 3A — Identificar el post ganador

Ordenar posts por métrica primaria:
- **TikTok / Reels**: por Views (reproducción total)
- **Carruseles / Imágenes**: por Engagement Rate = (likes + comentarios + guardados) / alcance

**Post ganador = el #1.**

### Paso 3B — Analizar por qué ganó

Evaluar los siguientes factores comparando el ganador contra el promedio de los demás:

| Factor | Qué mirar |
|--------|-----------|
| Gancho | ¿Las primeras palabras del caption son diferentes a los otros posts? |
| Tema | ¿El tema del ganador coincide con tendencias de la semana? |
| Formato | ¿Es el único Reel / el único Carrusel de la semana? |
| Longitud | ¿Es notablemente más corto o más largo que el promedio? |
| CTA | ¿Tuvo más comentarios? ¿El CTA generó interacción? |

Identificar el factor #1 que explica el éxito.

### Paso 3C — Comparar con semana anterior

Si hay datos de la semana anterior disponibles (en memoria de sesión o historial):
- Views promedio: ↑ o ↓ X%
- Engagement promedio: ↑ o ↓ X%

Si no hay datos anteriores → omitir esta comparación (no inventar números).

### Paso 3D — Recomendación accionable

Basándose en el análisis, generar 1-2 líneas concretas:
- "Replica el formato [X] del ganador — fue el único Reel de la semana y lo demostró"
- "El tema [Y] resonó más que [Z] — prioriza ese ángulo los lunes"
- "El gancho '[texto]' funcionó mejor que los demás — úsalo como plantilla"

---

## FASE 4 — ENTREGA

**Entrega.** Por defecto muestra el resultado en el chat y guárdalo en `~/Documents/mi-contenido/investigacion/`. Crea además el borrador de correo solo si hay `email` y el conector de Gmail está conectado; si no, no lo menciones como error.

Usar `mcp__claude_ai_Gmail__create_draft`:

**Para:** `config.email`

**Asunto:**
```
📊 Tu semana en números — [lunes] al [domingo]
```

**Cuerpo:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊  MÉTRICAS SEMANALES
Semana del [lunes fecha] al [domingo fecha]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆  POST GANADOR DE LA SEMANA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"[primeras 80 chars del caption]"
📍 [tipo: Reel / Carrusel / TikTok] · 📅 [día publicado]
👁️  [views o plays]  ·  ❤️  [likes]  ·  💬  [comentarios]  ·  🔁  [shares]
🔗 [URL]

POR QUÉ FUNCIONÓ:
→ [Factor principal del éxito]
→ [Factor secundario, si aplica]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋  TODOS LOS POSTS DE LA SEMANA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DÍA       | IDEA (primeras 40 chars)   | VIEWS   | LIKES | COMENTARIOS
[día]     | [idea]                      | [views] | [n]   | [n]
[día]     | [idea]                      | [views] | [n]   | [n]
[...]

Promedio semanal: [X] views/post · [Y] likes/post
[Si hay comparación]: vs semana anterior: [↑/↓ X%]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡  RECOMENDACIÓN PARA LA PRÓXIMA SEMANA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Recomendación específica y accionable basada en los datos reales de la semana]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tu reporte semanal
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
