---
name: carrusel-render-formula100k
description: "Renderiza un guion de carrusel a slides PNG terminados (1080×1350, exportados a 2x), listos para subir a Instagram, con la marca de la usuaria: lee primero su manual de identidad visual (mi-marca/marca.md) para colores, letras y handle. Dos estilos: SCRAPBOOK (papel con textura, post-its, washi tape, stickers) o EDITORIAL CON FOTO (foto real de la usuaria, sans pesada + serif itálica, su acento en la palabra clave). Integra fotos reales de la usuaria (polaroid, hero, cutout, tira de fotomatón). Escribe el HTML y lo exporta a PNG con el Chromium headless del servidor. Activar SIEMPRE que pida: \"renderiza este carrusel\", \"exporta este guion a PNG\", \"convierte este guion en slides\", \"diséñame el carrusel\", \"hazme las imágenes del carrusel\", \"genera las slides en mi estilo\", \"carrusel con mi foto\", \"usa mis fotos\", o pase un guion con Slide 1 / Slide 2 queriendo los archivos visuales. NO escribe el guion: para eso está carrusel-viral-formula100k."
metadata: {"openclaw": {"emoji": "🦞"}}
---

## 🦞 Corriendo en OpenClaw

> Esta versión corre en un agente OpenClaw (servidor + Telegram), no en Claude Code.
> **Antes de seguir, lee la skill `f100k-puente`**: traduce herramientas y rutas.
> Lo específico de esta skill:
>
> - Cómo renderizar en el servidor: en la carpeta de esta skill corre `npm install --omit=dev` una sola vez (solo instala `puppeteer-core`, no baja navegador). Luego `CHROME_PATH="$(command -v chromium || command -v chromium-browser || command -v google-chrome)" node export.js <html> --width 1080 --height 1350 --scale 2`. Si el Chromium del agente es el de Playwright, la ruta es `~/.cache/ms-playwright/chromium-*/chrome-linux/chrome`. Esta versión del script ya busca `CHROME_PATH` y rutas de Linux y lanza con `--no-sandbox`.
> - Si no hay Node o `puppeteer-core` no instala: abre el HTML en tu navegador (Chromium del agente) con ventana de 1080×1350 y toma captura de cada `.slide`. Si tampoco puedes, entrega el `.html` por Telegram y dilo en la primera línea.
> - Fuentes en Linux: `-apple-system`, `Helvetica` y `Georgia` no existen en el servidor y el render sale con otra letra. En el `<head>` carga de Google Fonts `Inter` (800) y `Gelasio` (tiene las medidas de Georgia) y ponlas primero en cada `font-family`. Los stickers emoji necesitan la fuente Noto Color Emoji instalada; si salen cuadritos, avisa y no entregues.
> - Marca y estilo: primero su manual de identidad visual `mi-marca/marca.md` (en su workspace o en `cerebro/`; cómo leerlo en `references/mi-marca.md`). Si no hay manual, la tabla «Mi marca» de `brandkit.md`. No hay estilo por defecto: scrapbook o editorial con foto según su manual o lo que pida.
> - Handle, palabra del CTA y oferta: sácalos de `USER.md` y `cerebro/`. Donde la skill diga «Comenta 100K» o «cierra vendiendo F100K», usa SU palabra clave y SU oferta; pregunta en una línea si no están.
> - Fotos: `cerebro/fotos/`. Copia la elegida a la carpeta del carrusel con nombre simple para que el `<img>` use ruta relativa. Las capturas «CAPTURA REAL» tienen que mandarlas ella: nunca las inventes.
> - Entrega: los PNG por Telegram como archivo (documento, no foto, para que no se compriman), en orden `slide-01…`. Guarda todo en `entregables/carruseles/`.

---

# Skill: Carrusel Render Fórmula 100K

Toma un guion estructurado de carrusel y produce los slides como imágenes PNG listas para Instagram, con los colores, las letras y el @ de la persona, en estilo scrapbook o editorial (`brandkit.md`).

## 🧰 ANTES DE EMPEZAR (manda sobre lo que diga esta skill más abajo)

Corre igual en Mac y en Windows.

- **Tu negocio.** Los datos salen de la persona, nunca de un ejemplo: lo que venga en el pedido, su Manual o Segundo Cerebro si lo tiene, o su ficha `entregables/`. Si no hay nada, pregunta rubro, avatar y oferta en un solo mensaje.
- **Tu marca, en este orden:** 1) `entregables/` (colores, letra, estilo visual y @); 2) si no está, su manual de identidad visual `mi-marca/marca.md` (cómo buscarlo y leerlo: `references/mi-marca.md`); 3) si no hay ninguno, pregunta en un solo mensaje fondo, texto, acento, letra de títulos y @ (u ofrece armar el manual en formula100k.app/identidad-visual). Si existe `entregables/`, los textos que retoques suenan a ella.
- **Tu marca manda sobre el estilo de esta skill.** Sus colores, letras, estilo visual y lugar del @ reemplazan a los valores de muestra de `brandkit.md` (paleta neutra, Caveat, Poppins, Georgia), aunque digan «siempre». De esta skill toma la estructura, la jerarquía y el oficio; el look es el suyo.
- **La carpeta de esta skill.** `brandkit.md`, `references/`, `assets/`, `export.js` y `node_modules/` están en la carpeta donde vive este `SKILL.md`. Con el plugin esa carpeta no es `skills/…`: usa la ruta real de esta skill y nunca escribas archivos de la persona dentro de ella.
- **Dónde guardar.** Todo lo que generes va dentro de `entregables/` (crea la subcarpeta si no existe).
- **Fotos.** Sus fotos reales viven en `entregables/`. Si está vacía, pídele de 10 a 20 fotos (de frente, trabajando, su producto, capturas de resultados). Antes de elegir, mira `mis-fotos/usadas.json` si existe y usa primero las que no salieron en otro carrusel. Sin fotos, la portada es tipográfica con sus colores: nunca uses fotos de muestra.
- **Si falta una cuenta o un conector, no te detengas:** haz la parte que sí se puede y di en una línea qué faltó. Sin Higgsfield ni otra herramienta de imagen, entrega la pieza en HTML y tipografía y deja el prompt de cada imagen listo para cuando conecte la cuenta. Nunca inventes una métrica ni un enlace.
- **Otras skills.** Si esta skill nombra otra que no está instalada, sigue sin ella y avisa.
- **Llaves.** Nunca pidas que peguen una llave o un token en el chat ni los escribas en un archivo de `entregables/`.
- **Sin pasos de más.** No preguntes por Canva ni entregues calendario, horarios de publicación o estadísticas salvo que te lo pida.
- **Tamaño.** Exporta en 1080 × 1350 (`--scale 1`), salvo que te pida más resolución.

---

## CUÁNDO USAR ESTA SKILL

Activar cuando el usuario ya tiene un guion de carrusel y necesita los slides VISUALES (PNG) renderizados. Esta skill **NO escribe el guion** — eso lo hace `carrusel-viral-formula100k`. Esta skill toma el guion y lo convierte en archivos visuales.

Triggers típicos:
- "Renderiza este carrusel"
- "Exporta este guion a PNG"
- "Hazme las slides del carrusel"
- "Diséñame el carrusel"
- "Convierte este carrusel en imágenes"
- "Genera el carrusel en mi estilo"
- Cuando el usuario pega un guion con estructura `Slide 1: ... / Slide 2: ...`

---

## PROCESO OBLIGATORIO

### Paso 1 — Leer su marca y el brandkit
1. **Primero, su ficha de marca** `entregables/`. Si existe, sus colores, letras, estilo visual y @ mandan sobre todo lo demás.
2. **Si no está, su manual de identidad visual.** Busca `mi-marca/marca.md` como dice `references/mi-marca.md`. Si existe, sus colores, letras, tratamiento de imágenes, reglas de portada y cierre, firma y prohibidos mandan sobre todo lo demás.
3. **Si no hay ninguno:** usa la tabla «Mi marca» de `brandkit.md` si ya la llenó (formato de siempre).
4. **Si tampoco:** ofrece armar el manual en formula100k.app/identidad-visual o pregunta en un solo mensaje fondo, texto, acento, letra de títulos y @.

Lo que encuentres, confírmalo en una línea y no repreguntes lo que ya trae.

Después lee `brandkit.md` para conocer:
- Cómo pasan los valores de su marca a cada estilo
- Qué estilo usar (scrapbook o editorial con foto)
- Reglas de composición
- Decoración (stickers, tape, post-its, doodles)
- Handle e identidad

### Paso 2 — Confirmar el guion
Si el usuario solo pasa una idea (no un guion estructurado), pídele que te dé el guion completo o sugiérele invocar primero `carrusel-viral-formula100k`. Si pasa un guion, identifica:
- Cuántos slides tiene (incluido portada y cierre)
- Tema central (afecta acentos visuales del slide)
- Si quiere subtema/color por slide (chisme tiene un color por chisme; otros temas pueden ser monocromáticos)

### Paso 2.5 — Decidir la imagen de la PORTADA (obligatorio)

Lee `references/portada-gancho-visual.md`. Escribe en una línea «la imagen que dice este tema es ___» y consíguela: foto real que lo diga, imagen nueva de la persona con IA («solo cara y pelo, ropa nueva»), recorte sticker, mix media o mockup realista de iPhone fotográfico (`assets/iphone-mockup.png`, nunca un teléfono dibujado). Una selfie que no tiene que ver con el tema NO es portada. Prueba de 1 segundo: tapa el titular y mira si la imagen sola dice el tema.

### Paso 3 — Confirmar uso de fotos reales

Preguntar al usuario si quiere incluir fotos suyas en el carrusel. Las opciones son:

1. **Sin fotos** — solo brandkit con stickers, post-its, doodles (default si no responde)
2. **Foto en uno o más slides** — pedir:
   - Ruta de la(s) foto(s), O
   - Carpeta default `entregables/` (sus fotos reales; mira `usadas.json` si existe)
3. **Si el usuario da una carpeta**: revisar las fotos con la herramienta Read y elegir la(s) que mejor calce(n) con cada slide según composición + tema

Patrones de composición con foto disponibles (ver `references/fotos-reales.md`):
- **Polaroid** — foto con borde blanco rotada como recorte de álbum
- **Hero background** — foto fill al 100% del slide con overlay de tinta + texto sobre encima
- **Cutout circular** — foto en círculo con sombra (estilo profile pic)
- **Photo strip** — múltiples fotos pequeñas tipo tira de fotomatón

Si la foto se incluye, copiarla a la carpeta de output con nombre simple (`foto.jpg`, `slide-3-foto.jpg`) para que el `<img src="...">` use ruta relativa.

### Paso 4 — Confirmar carpeta de salida
Carpeta default: `entregables/`

Donde `{slug-tema}` es 2-4 palabras del tema en kebab-case. Ej: `2026-05-03-chisme-silicon-valley`.

Confirmar con el usuario o usar default.

### Paso 5 — Generar el HTML
- Leer `references/composiciones.md` para variar la composición entre slides (no todos iguales)
- Si hay fotos, leer `references/fotos-reales.md` para los patrones CSS de polaroid/hero/cutout
- Aplicar `brandkit.md` rigurosamente
- Slide 1 = portada (composición A)
- Slides intermedios = rotar entre composiciones B/C/D
- Slide final = cierre con CTA «Comenta PALABRA» (palabra ligada al tema y a un regalo o una oferta suya, nunca «YO» ni «guárdalo») + handle
- Cada slide: `<div class="slide sN">...</div>` consecutivos, todos 1080×1350px
- Tipografías Google Fonts vía CDN: las de su manual (`letra.titulares` y `letra.apoyo`); sin manual, Caveat + Poppins
- Texto en pantalla suficientemente grande para leer en feed móvil (mínimo 26px cuerpo, títulos 100px+)
- Subrayados y garabatos como SVG inline
- Stickers emoji rotados con `transform`
- `references/ejemplo-completo.html` es la referencia canónica del estilo — consultar si hay duda

### Paso 6 — Verificar dependencias
En lo que sigue, `{carpeta-skill}` es la carpeta de esta skill (donde está este `SKILL.md`; con el plugin no es `skills/…`). Comprobar si `node_modules/puppeteer-core` existe ahí:
```bash
ls "{carpeta-skill}/node_modules/puppeteer-core"
```

Si no existe, instalar UNA SOLA VEZ (la skill es self-contained; su `package.json` ya trae `puppeteer-core`):
```bash
cd "{carpeta-skill}" && npm install
```

Si `npm` falla por permisos de la caché (`~/.npm/_cacache`), repite con `--cache` apuntando a una carpeta temporal. El exportador usa el Google Chrome (o Edge) que ya está en la compu, en Mac o en Windows; si no lo encuentra, define `CHROME_PATH` con su ruta.

### Paso 7 — Exportar PNGs
```bash
node "{carpeta-skill}/export.js" "{ruta-al-html}" --scale 1
```

El script:
- Lee el HTML
- Detecta automáticamente `.slide` elements
- Exporta cada uno como `slide-01.png`, `slide-02.png`, etc.
- Resolución 1080×1350 en la misma carpeta del HTML (`--scale 2` da 2160×2700, solo si piden más resolución)

### Paso 8 — Confirmar y abrir
- Verificar que existen N PNGs y **mirar cada PNG a tamaño real** después del último cambio
- Abrir la carpeta: en Mac `open "{carpeta-output}"`, en Windows `start "" "{carpeta-output}"`
- Reportar al usuario: ruta, cantidad de slides, tamaño, instrucciones para regenerar

---

## REGLAS DE COMPOSICIÓN VISUAL

1. **Asimetría obligatoria.** Nunca dos slides idénticos en composición. Rotar entre las composiciones de `references/composiciones.md`.
2. **Decoración con propósito.** Los stickers refuerzan el tono del slide (💔 para ruptura, 👀 para chisme, 🍿 para drama). No saturar — máximo 4-5 stickers por slide.
3. **Jerarquía clara.** Cada slide tiene UN punto principal. Si tiene más, romperlo en dos slides.
4. **Texto legible.** Cuerpo nunca menor a 26px. Títulos hand-written nunca menores a 100px.
5. **Rotaciones sutiles.** Solo `±2deg a ±8deg` (más allá se ve forzado).
6. **Post-its = highlights.** Usar bloques de color tipo post-it solo bajo frases que merecen énfasis (1-2 por slide).
7. **Slide final SIEMPRE incluye:** CTA «Comenta PALABRA» ligado a un regalo o una oferta real de la persona + handle. Nunca «guárdalo» como CTA.
8. **Portada = la imagen ES el tema** (ver `references/portada-gancho-visual.md`): un protagonista, cara completa y nítida, sin huecos, nada de blanco y negro sin motivo, ninguna foto repetida en el carrusel.
9. **Mira cada PNG a tamaño real después del último cambio.** Agrandar un titular puede pasarlo a otra línea y dejarlo tapado por una foto.

---

## FORMATO DE GUION ESPERADO

El usuario suele pasar guiones así:

```
Slide 1: Portada
Título: ...
Subtítulo: ...

Slide 2: ...
Cuerpo: ...
```

O en formato libre. La skill debe ser flexible: si el usuario pasa el guion en otro formato, parsearlo igual y mapear a slides.

---

## REFERENCIAS

- `references/mi-marca.md` — cómo buscar y leer su manual de identidad visual (`mi-marca/marca.md`), el segundo lugar donde se busca su marca
- `brandkit.md` — cómo se aplica su marca, los dos estilos, decoración y handle
- `references/composiciones.md` — patrones de layout asimétrico
- `references/fotos-reales.md` — patrones CSS para integrar fotos del usuario (polaroid, hero, cutout, photo strip)
- `references/portada-gancho-visual.md` — cómo elegir o crear la imagen de la portada (prueba de 1 segundo, mockups)
- `assets/iphone-mockup.png` — iPhone fotográfico con la pantalla en blanco para montar capturas encima
- `references/ejemplo-completo.html` — carrusel "Chisme Silicon Valley" como referencia canónica del estilo
- `references/editorial-oscuro-motor.js` — motor de ejemplo del estilo editorial (`ACENTO="#rrggbb"`)
- `export.js` — script de Puppeteer que exporta PNGs
