---
name: carrusel-render-formula100k
description: >
  Skill para renderizar guiones de carrusel a slides PNG terminados, listos para subir a Instagram, usando el brandkit visual de Andrea Vega (FÓRMULA 100K) — estilo scrapbook/collage con paleta crema, tipografías Caveat + Poppins, post-its, washi tape y stickers. Soporta integrar FOTOS REALES del usuario (polaroid, hero background, cutout). Activar SIEMPRE que Andrea pida: "renderiza este carrusel", "exporta este guion a PNG", "convierte este guion en slides", "diséñame el carrusel", "hazme las imágenes del carrusel", "genera las slides en mi estilo", "carrusel con mi foto", "usa mis fotos", o cualquier solicitud que combine un guion de carrusel (slide 1 / slide 2 / etc.) con la intención de tener archivos visuales listos. También activar cuando le pasen el output de la skill carrusel-viral-formula100k y quiera renderizarlo. NO usar para generar el guion — para eso está carrusel-viral-formula100k.
---

# Skill: Carrusel Render Fórmula 100K

Toma un guion estructurado de carrusel y produce los slides como imágenes PNG listas para Instagram, aplicando el brandkit visual de Andrea Vega.

---

## CUÁNDO USAR ESTA SKILL

Activar cuando Andrea ya tiene un guion de carrusel y necesita los slides VISUALES (PNG) renderizados. Esta skill **NO escribe el guion** — eso lo hace `carrusel-viral-formula100k`. Esta skill toma el guion y lo convierte en archivos visuales.

Triggers típicos:
- "Renderiza este carrusel"
- "Exporta este guion a PNG"
- "Hazme las slides del carrusel"
- "Diséñame el carrusel"
- "Convierte este carrusel en imágenes"
- "Genera el carrusel en mi estilo"
- Cuando Andrea pega un guion con estructura `Slide 1: ... / Slide 2: ...`

---

## PROCESO OBLIGATORIO

### Paso 1 — Leer el brandkit
Antes de escribir HTML, leer `brandkit.md` para conocer:
- Paleta de colores
- Tipografías
- Reglas de composición
- Decoración (stickers, tape, post-its, doodles)
- Handle e identidad

### Paso 2 — Confirmar el guion
Si Andrea solo pasa una idea (no un guion estructurado), pídele que te dé el guion completo o sugiérele invocar primero `carrusel-viral-formula100k`. Si pasa un guion, identifica:
- Cuántos slides tiene (incluido portada y cierre)
- Tema central (afecta acentos visuales del slide)
- Si quiere subtema/color por slide (chisme tiene un color por chisme; otros temas pueden ser monocromáticos)

### Paso 3 — Confirmar uso de fotos reales

Preguntar a Andrea si quiere incluir fotos suyas en el carrusel. Las opciones son:

1. **Sin fotos** — solo brandkit con stickers, post-its, doodles (default si no responde)
2. **Foto en uno o más slides** — pedir:
   - Ruta de la(s) foto(s), O
   - Carpeta default `/Users/kissita/Documents/ANDREA SELFIES` (pool grande sin tags)
   - Carpeta curada `/Users/kissita/Documents/ANDREA ADN` (3 fotos curadas con tags)
3. **Si Andrea da una carpeta**: revisar las fotos con la herramienta Read y elegir la(s) que mejor calce(n) con cada slide según composición + tema

Patrones de composición con foto disponibles (ver `references/fotos-reales.md`):
- **Polaroid** — foto con borde blanco rotada como recorte de álbum
- **Hero background** — foto fill al 100% del slide con overlay de tinta + texto sobre encima
- **Cutout circular** — foto en círculo con sombra (estilo profile pic)
- **Photo strip** — múltiples fotos pequeñas tipo tira de fotomatón

Si la foto se incluye, copiarla a la carpeta de output con nombre simple (`andrea.jpg`, `slide-3-foto.jpg`) para que el `<img src="...">` use ruta relativa.

### Paso 4 — Confirmar carpeta de salida
Carpeta default: `/Users/kissita/Documents/FORMULA100K/CARRUSELES/CARRUSELES DIARIOS/{YYYY-MM-DD}-{slug-tema}/`

Donde `{slug-tema}` es 2-4 palabras del tema en kebab-case. Ej: `2026-05-03-chisme-silicon-valley`.

Confirmar con Andrea o usar default.

### Paso 5 — Generar el HTML
- Leer `references/composiciones.md` para variar la composición entre slides (no todos iguales)
- Si hay fotos, leer `references/fotos-reales.md` para los patrones CSS de polaroid/hero/cutout
- Aplicar `brandkit.md` rigurosamente
- Slide 1 = portada (composición A)
- Slides intermedios = rotar entre composiciones B/C/D
- Slide final = cierre con CTA + "guárdalo para después" + handle
- Cada slide: `<div class="slide sN">...</div>` consecutivos, todos 1080×1350px
- Tipografías Google Fonts vía CDN (Caveat + Poppins)
- Texto en pantalla suficientemente grande para leer en feed móvil (mínimo 26px cuerpo, títulos 100px+)
- Subrayados y garabatos como SVG inline
- Stickers emoji rotados con `transform`
- `references/ejemplo-completo.html` es la referencia canónica del estilo — consultar si hay duda

### Paso 6 — Verificar dependencias
Comprobar si `node_modules/puppeteer-core` existe en la carpeta de la skill:
```bash
ls "/Users/kissita/.claude/skills/carrusel-render-formula100k/node_modules/puppeteer-core" 2>/dev/null
```

Si no existe, instalar UNA SOLA VEZ (la skill es self-contained):
```bash
cd "/Users/kissita/.claude/skills/carrusel-render-formula100k" && npm install puppeteer-core --cache /tmp/npm-cache-skill
```

NOTA: usar siempre `--cache /tmp/npm-cache-skill` para evitar el bug conocido de permisos en `~/.npm/_cacache`.

### Paso 7 — Exportar PNGs
```bash
node "/Users/kissita/.claude/skills/carrusel-render-formula100k/export.js" "{ruta-al-html}"
```

El script:
- Lee el HTML
- Detecta automáticamente `.slide` elements
- Exporta cada uno como `slide-01.png`, `slide-02.png`, etc.
- Resolución 2160×2700 (retina 2x) en la misma carpeta del HTML

### Paso 8 — Confirmar y abrir
- Verificar que existen N PNGs
- `open "{carpeta-output}"` para mostrar en Finder
- Reportar a Andrea: ruta, cantidad de slides, tamaño, instrucciones para regenerar

---

## REGLAS DE COMPOSICIÓN VISUAL

1. **Asimetría obligatoria.** Nunca dos slides idénticos en composición. Rotar entre las composiciones de `references/composiciones.md`.
2. **Decoración con propósito.** Los stickers refuerzan el tono del slide (💔 para ruptura, 👀 para chisme, 🍿 para drama). No saturar — máximo 4-5 stickers por slide.
3. **Jerarquía clara.** Cada slide tiene UN punto principal. Si tiene más, romperlo en dos slides.
4. **Texto legible.** Cuerpo nunca menor a 26px. Títulos hand-written nunca menores a 100px.
5. **Rotaciones sutiles.** Solo `±2deg a ±8deg` (más allá se ve forzado).
6. **Post-its = highlights.** Usar bloques de color tipo post-it solo bajo frases que merecen énfasis (1-2 por slide).
7. **Slide final SIEMPRE incluye:** CTA fuerte + nota "guárdalo para después" + handle.

---

## FORMATO DE GUION ESPERADO

Andrea suele pasar guiones así:

```
Slide 1: Portada
Título: ...
Subtítulo: ...

Slide 2: ...
Cuerpo: ...
```

O en formato libre. La skill debe ser flexible: si Andrea pasa el guion en otro formato, parsearlo igual y mapear a slides.

---

## REFERENCIAS

- `brandkit.md` — paleta, tipografías, decoración, handle
- `references/composiciones.md` — patrones de layout asimétrico
- `references/fotos-reales.md` — patrones CSS para integrar fotos del usuario (polaroid, hero, cutout, photo strip)
- `references/ejemplo-completo.html` — carrusel "Chisme Silicon Valley" como referencia canónica del estilo
- `template.html` — esqueleto base con CSS reutilizable
- `export.js` — script de Puppeteer que exporta PNGs
