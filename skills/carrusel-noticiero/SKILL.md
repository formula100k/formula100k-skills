---
name: carrusel-noticiero
description: Use when the user asks to build a "carrusel noticiero", "carrusel de noticia", "carrusel newsjacking", "convierte esta noticia de IA en carrusel", "el carrusel de la noticia de hoy", or wants to turn an AI/tech news item into an Instagram carousel with an animated news-style cover. Produces the 8-slide news narrative (QUÉ PASÓ → MOTIVO → EL DATO → Y A TI QUÉ → 3 JUGADAS → REGLA DE ORO → CTA) translated for creators with the F100K angle, renders finished PNGs from a swappable HTML body theme (scrapbook = default), and builds the signature animated cover (Higgsfield image → video → transparent overlay → ffmpeg composite). Do NOT use for generic viral carousels (carrusel-viral-formula100k) or plain scrapbook rendering of an existing script (carrusel-render-formula100k).
argument-hint: [tema o enlace de la noticia de IA]
disable-model-invocation: true
---

## Qué hace esta skill

Convierte **una noticia de IA/tech** en un **carrusel noticiero de Instagram** listo para publicar, con el ángulo probado de FÓRMULA 100K: *la noticia traducida para creadoras + jugadas accionables + CTA "comenta 100K"*. Replica exactamente el formato de `2026-07-01-ia-newsjacking` (el que salió bien).

Entrega en una sola carpeta:
- `slide-01.png … slide-08.png` — los 8 slides finales (1080×1350), renderizados con Chrome headless.
- `slide-01-ANIMADO.mp4` — la **portada animada** (firma del formato): imagen Higgsfield → video Higgsfield → overlay de titular transparente → composición ffmpeg.
- `carrusel.html`, `cover_slide.html`, `recursos/` — los fuentes editables.

**Separación clave (structure vs style):**
- La **ESTRUCTURA** (qué dice cada slide, el arco narrativo de noticia) vive en este SKILL.md y es fija.
- El **ESTILO visual del cuerpo** vive en `themes/`. `scrapbook.md` es el default. Para cambiar el look, se elige o se crea otro tema — sin tocar el contenido. Ver `themes/_template.md`.

---

## Inputs

- **Argumento / lo que dal usuario:** el tema o un enlace de la noticia de IA (`$ARGUMENTS`). El usuario siempre provee la noticia; la skill NO la inventa. Si el input es un enlace, léelo/transcríbelo primero para tener los hechos reales.
- **NUNCA inventar datos** (fechas, cifras, nombres de modelos, quién ordenó qué). Si un hecho no está confirmado en la fuente, no lo afirmes o dilo como pregunta/rumor. Ver memoria `feedback_no_inventar_data`.

## Output

- Carpeta: `~/Documents/FORMULA100K/CARRUSELES/CARRUSELES DIARIOS/YYYY-MM-DD-<slug>/`
- `<slug>` = 2-4 palabras kebab de la noticia (ej. `ia-newsjacking`, `gpt6-lanzamiento`).

## Dependencias

- **Render de PNG:** `export.js` (Puppeteer/Chrome headless) en esta carpeta. Requiere Google Chrome instalado. Primera corrida: `npm install --prefix ~/.claude/skills/carrusel-noticiero` (instala `puppeteer-core`). Si `carrusel-render-formula100k` ya tiene `node_modules`, se puede reusar su `export.js`.
- **Portada animada:** MCP de **Higgsfield** (`generate_image` con `nano_banana_2`, luego `generate_video` con `seedance`/`kling`) + **ffmpeg** (composición). Ambos ya disponibles en el entorno del usuario.
- **Fuentes:** Google Fonts vía CDN (Anton, Caveat, Poppins). El `export.js` espera `document.fonts.ready`.

---

## La ESTRUCTURA fija — 8 slides noticia

Cada slide tiene un rol narrativo. El copy es corto, en **español neutro** (memoria `feedback_espanol_neutro`: tú/tienes, no vos/tenés). Escribe primero TODO el copy de los 8 slides, luego construye.

| # | Rol | Qué contiene |
|---|-----|--------------|
| 1 | **PORTADA** | Titular tipo noticia (BREAKING/ÚLTIMA HORA · IA), foto hero oscura, "desliza para entender →". Estilo noticiero (Anton). Es la que se anima. |
| 2 | **QUÉ PASÓ** | El hecho en 2 frases. Fechas y nombres reales. Post-it de dato clave. |
| 3 | **EL MOTIVO / POR QUÉ** | Por qué pasó / el giro. Emoji grande. Post-it. |
| 4 | **EL DATO QUE ASUSTA** | El insight que da miedo/asombro, número o frase hero gigante. Subtítulo Caveat. |
| 5 | **¿Y A TI QUÉ?** | El pivote a la creadora: por qué le importa. Conecta noticia → atención → contenido. |
| 6 | **CÓMO APROVECHARLO** | 3 jugadas numeradas y accionables para HOY (newsjacking, traducir no reportar, usar la herramienta). |
| 7 | **LA REGLA DE ORO / MUÉVETE AHORA** | Urgencia: la ventana dura días. Frase hero gigante. |
| 8 | **CIERRE CTA** | "Convierte cada noticia en contenido" + lista de 3 → + CTA **"Comenta 100K"** + "Guárdalo". Cierra vendiendo F100K (memoria `feedback_artifacts_pitch_f100k`). |

**Reglas de copy:**
- Gancho verbal en portada de intriga/contraste ("Apagaron la IA más potente… y ya volvió").
- Traduce, no reportes: cada slide dice qué significa para la creadora, no repite el titular.
- CTA fijo: `Comenta "100K" y te enseño cómo 🚀`. Handle: el del usuario (pregúntaselo si no lo sabes).
- Números de slide `X / 8` y handle en cada slide (el tema los incluye).

---

## Pipeline paso a paso

### 1. Fija hechos y escribe el copy
- Lee la noticia (si es enlace, transcríbela/léela). Extrae hechos verificables: qué, cuándo, quién, cifra.
- Redacta el copy de los 8 slides siguiendo la tabla de arriba. Muéstraselo al usuario si pide revisar; si no, sigue.
- Define `<slug>` y crea la carpeta de salida.

### 2. Construye el cuerpo (slides 2-8) desde el tema
- Lee el tema activo (default `themes/scrapbook.md`). Contiene el `<style>` completo probado + el esqueleto de los 8 slides.
- Copia el template a `carrusel.html` en la carpeta de salida y **reemplaza solo el copy** (titulares, párrafos, post-its, lista, CTA) con lo escrito en el paso 1. NO toques el CSS salvo que el usuario pida cambiar de estilo.
- Para cambiar de estilo: usa otro archivo de `themes/` (o crea uno con `themes/_template.md`) — misma estructura, distinto CSS.

### 3. Construye la portada estática (slide 1)
- Genera la imagen hero con Higgsfield (paso 4) ANTES de renderizar el slide 1, o usa un placeholder oscuro.
- Copia `cover/cover-news.html` a `cover_slide.html`, apunta la foto a `recursos/cover.png`, pon el titular (Anton, con `<span class="amber">` en la palabra clave), la píldora BREAKING y "DESLIZA PARA ENTENDER →".

### 4. Genera la portada ANIMADA (firma — siempre) — ver `reference.md`
Resumen:
1. **Imagen hero:** Higgsfield `generate_image` `nano_banana_2`, prompt editorial/noticiero relacionado a la noticia (4K, cinematográfico, sin texto). Guarda como `recursos/cover.png`.
2. **Animación:** Higgsfield `generate_video` (seedance/kling) desde esa imagen, movimiento sutil (parallax/zoom lento). Guarda como `recursos/cover_anim_raw.mp4`.
3. **Overlay de titular:** copia `cover/overlay.html` → `recursos/overlay.html`, pon el mismo titular/píldora, renderiza a PNG **transparente** con `export.js` (`--width 1080 --height 1350`). Guarda `recursos/title-overlay.png`.
4. **Composición ffmpeg:** superpón el overlay PNG sobre el video → `slide-01-ANIMADO.mp4`. Comando exacto en `reference.md`.

### 5. Renderiza los PNG
```
node ~/.claude/skills/carrusel-noticiero/export.js "<carpeta>/carrusel.html" --width 1080 --height 1350 --scale 2
node ~/.claude/skills/carrusel-noticiero/export.js "<carpeta>/cover_slide.html" --width 1080 --height 1350 --scale 2
```
Renombra el PNG del cover a `slide-01.png` y asegúrate de que `carrusel.html` empiece en el slide 2 (o produce los 8 juntos y reemplaza el 1 por el cover noticiero). Verifica que existan `slide-01.png … slide-08.png`.

### 6. Entrega y (si el usuario lo pide) publica
- Reporta la ruta de la carpeta con los 8 PNG + el `.mp4` animado.
- **Publicar la SKILL** (no el carrusel) al repo/marketplace: ver `reference.md` sección "Publicar la skill".

---

## Guardrails

- **NO inventes hechos.** Fechas, cifras, nombres de modelos y decisiones deben venir de la fuente real.
- **Español neutro** siempre (no argentino).
- **Higgsfield gasta créditos:** genera la imagen y el video del cover una sola vez; reusa `recursos/cover.png` si re-renderizas.
- **No toques el CSS del tema** al cambiar de noticia; solo cambia el copy. El CSS solo se toca al crear/editar un tema.
- **1080×1350** (4:5) para todos los slides. No 9:16.
- **Cierra vendiendo F100K** en el slide 8 (CTA "comenta 100K").
- Esta skill es para **noticia de IA → creadoras**. Para carruseles virales generales usa `carrusel-viral-formula100k`; para solo renderizar un guion scrapbook existente, `carrusel-render-formula100k`.
