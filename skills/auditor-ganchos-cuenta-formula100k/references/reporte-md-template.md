# Plantilla de REPORTE.md

Versión texto-plano del reporte, complementaria al `index.html` interactivo.

---

```markdown
# Auditoría @<usuario> — Últimos <N> reels

**Fecha**: <YYYY-MM-DD>
**Ventana analizada**: <fecha_más_antigua> → <fecha_más_reciente> (<N> días)
**Total reels**: <N> (<X> pinned)
**Fuente**: Apify `instagram-reel-scraper` + frame extraction (ffmpeg @ t=1s) + transcripciones de audio del actor

---

## Tabla de los <N> reels (ordenados por plays desc)

| Rank | # | Fecha | Plays | Likes | Coments | Dur. | Tema | Screenshot |
|------|---|-------|------:|------:|--------:|-----:|------|-----------|
| 🥇 | <pos> | <date> | **<plays>** | <likes> | <coms> | <dur>s | **<tema_short>** | `hook_<pos>.png` |
| 🥈 | … |
| 🥉 | … |
| 4 | … |
| ... |
| 🔻 | … | … | **<plays>** | … | … | … | <tema> | … |
| 🔻 | … |

> Brecha top vs bottom: **~<Nx>** (<top_plays> vs <bot_plays> plays). Misma persona, misma narrativa, mismo formato — la diferencia está casi 100% en el GANCHO (visual + verbal).

---

## Patrón ganador — Gancho visual (frame @ 1s)

### ✅ Los TOP 3 tienen 3 cosas en común

| Elemento | TOP 1 (<plays>) | TOP 2 (<plays>) | TOP 3 (<plays>) |
|----------|-----------------|-----------------|-----------------|
| **Persona EN ACCIÓN concreta** | <descripción> | <descripción> | <descripción> |
| **Contraste / exageración visual** | <descripción> | <descripción> | <descripción> |
| **Texto amarillo grande en mitad inferior que ABRE LOOP** | "<texto>" | "<texto>" | "<texto>" |

### ❌ Los BOTTOM 3 rompen las 3 reglas

| Elemento | BOTTOM 1 ❌ | BOTTOM 2 ❌ | BOTTOM 3 ❌ |
|----------|-------------|-------------|-------------|
| **Acción** | <falla> | <falla> | <falla> |
| **Contraste** | <falla> | <falla> | <falla> |
| **Texto** | "<texto cerrado>" | "<texto cerrado>" | "<texto cerrado>" |

### Regla extraída del frame 0–1s

> **Gancho ganador = persona haciendo algo + objeto exagerado o movimiento + texto amarillo que abre un loop**
> **Gancho perdedor = objeto solo / persona quieta + texto que cierra una reflexión filosófica**

---

## Patrón ganador — Gancho verbal (primeras 10 palabras del audio)

### TOP 3 · arrancan con SITUACIÓN CONCRETA + tiempo o lugar específico

| # | Plays | Primeras palabras |
|---|------:|-------------------|
| <pos> | <plays> | "<primeras_palabras>" |
| ... |

**Estructura repetida**: VERBO de acción + dato verificable (lugar, número, primera vez). Activa el cerebro: "¿y qué pasó?".

### BOTTOM 3 · arrancan con REFLEXIÓN abstracta

| # | Plays | Primeras palabras |
|---|------:|-------------------|
| <pos> | <plays> | "<primeras_palabras_abstractas>" |

**Problema**: el cerebro no tiene nada a qué agarrarse. Tarda 4–6s en entenderse qué está pasando — Instagram ya pasó al siguiente reel.

---

## Patrón ganador — Temática

| Cluster | Reels | Promedio plays | Veredicto |
|---------|-------|---------------:|-----------|
| 🟢 **<tema_ganador>** (descripción) | #X, #Y, #Z | **<promedio>** | REPETIR — es el ángulo madre |
| 🟡 **<tema_medio>** | #A, #B | <promedio> | OPTIMIZAR — buen formato, falta gancho más fuerte |
| 🔴 **<tema_perdedor>** | #M, #N, #O | **<promedio>** | ELIMINAR este TIPO de hook — el tema está bien, pero NO puede ser el gancho |

---

## 3 reglas accionables para los próximos reels

**1. <Regla 1 título>.**
<Explicación con ejemplo verificable del feed>

**2. <Regla 2 título>.**
<Plantillas validadas + qué evitar al 100%>

**3. <Regla 3 título>.**
<Implicación concreta + estimación de impacto>

---

## Bonus · señal cualitativa

Los reels con MÁS comentarios (<X> cada uno: #N, #N, #N) **no son** los más vistos. Esto sugiere que la base leal de la cuenta sí conversa con el contenido reflexivo — pero NO trae gente nueva.

**Implicación**: la estrategia óptima para crecer = gancho dramático arriba (reach) + reflexión <branded_phrase> abajo (engagement de leales).

---

## Archivos generados

`/Users/kissita/Documents/FORMULA100K/FORMULA100K AUDITORIAS/<usuario>_<YYYY-MM-DD>/`
- `00_dataset.json` — metadata cruda de los <N> reels
- `reel_1.mp4` … `reel_<N>.mp4` — videos descargados
- `hook_1.png` … `hook_<N>.png` — frames @ t=1s
- `propuestas/p1_<slug>.png` … `p6_<slug>.png` — mockups Higgsfield
- `REPORTE.md` — este reporte
- `index.html` — versión interactiva con tabs, modal y hook-builder
```
