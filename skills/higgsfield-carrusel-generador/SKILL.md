---
name: higgsfield-carrusel-generador
description: "Genera las láminas de un carrusel de Instagram con imágenes de IA en Higgsfield, usando tus fotos reales si apareces. Usar con «carrusel con imágenes de IA», «crea las láminas con Higgsfield». Sin Higgsfield conectado entrega los prompts y una versión en tipografía."
argument-hint: "<guion del carrusel o tema>"
metadata:
  version: "2.0.0"
---

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

## 🧰 EN TU COMPU (leer antes de seguir: manda sobre lo que diga esta skill más abajo)

Esta skill viaja en el módulo de Agentes de FÓRMULA 100K y corre igual en Mac y en Windows.

- **Tu negocio.** Los datos salen de la persona, nunca de un ejemplo: lo que venga en el pedido, su Manual o Segundo Cerebro si lo tiene, o la ficha `~/Documents/mi-contenido/mi-negocio.md`. Si no hay nada, pregunta rubro, avatar y oferta en un solo mensaje. Colores, letra y @handle también son los suyos.
- **Dónde guardar.** Todo lo que generes va dentro de `~/Documents/mi-contenido/` (crea la subcarpeta si no existe).
- **Si falta una cuenta o un conector, no te detengas:** haz la parte que sí se puede y di en una línea qué faltó.
  - Sin Apify → usa la búsqueda web de Claude (WebSearch y WebFetch) y los enlaces que la persona te pase. Toda cifra que no leíste de la fuente va marcada «sin verificar». Nunca inventes una métrica ni un enlace.
  - Sin `agent-browser`, Tavily, Supadata o vidIQ → lo mismo: búsqueda web de Claude.
  - Sin Higgsfield ni otra herramienta de imagen → entrega la pieza en HTML y tipografía si se puede, y deja el prompt de cada imagen listo para cuando conecte la cuenta.
  - Sin Gmail → entrega el resultado en el chat y guárdalo como archivo.
- **Nombres de herramientas.** Un conector puede aparecer como `mcp__claude_ai_<Nombre>__…` o `mcp__<nombre>__…`: usa el que esté disponible.
- **Otras skills.** Si esta skill nombra una que no está en `~/.claude/skills/`, sigue sin ella y avisa. El editor de video viene en el módulo de Edición y los estilos de animación en el módulo de Animación: úsalos solo si están instalados.
- **Abrir un archivo o una carpeta:** en Mac `open "<ruta>"`; en Windows `start "" "<ruta>"`.
- **Llaves.** Nunca pidas que peguen una llave o un token en el chat ni los escribas en un archivo de `~/Documents/mi-contenido/`.

---

# Carrusel con imágenes de IA (Higgsfield)

Convierte el guion de un carrusel en láminas 4:5 con imágenes generadas. Trabaja con el **conector de Higgsfield** de Claude: no abre el navegador ni necesita una llave.

---

## PASO 0 — ¿Hay conector?

Busca entre tus herramientas las de Higgsfield (`mcp__claude_ai_Higgsfield__…` o `mcp__higgsfield__…`).

- **Están** → revisa el saldo con `balance` y sigue al Paso 1.
- **No están** → no te detengas. Haz el Paso 3 (escribir los prompts), guárdalos en `prompts.md`, renderiza el carrusel en tipografía con `carrusel-render-formula100k` y cierra con:
  > «Te dejé el carrusel en versión tipográfica y los prompts de cada lámina. Para generar las imágenes, conecta Higgsfield en Claude (Configuración → Conectores) con tu cuenta y vuelve a pedírmelo.»

---

## PASO 1 — ¿Sale la persona en alguna lámina?

Revisa el guion: ¿alguna lámina lleva a la dueña de la marca como protagonista (portada, cierre)?

**Sí** → pide sus fotos antes de generar:

> «Para las láminas donde sales tú (por ejemplo la portada y el cierre) es mejor partir de **fotos tuyas reales**: así te reconocen. Pásame de 1 a 3 fotos con buena luz y fondo limpio, o dime en qué carpeta están. Si prefieres una foto para la portada y otra para el cierre, dímelo.»

Si ya hay una carpeta de fotos en su ficha (`~/Documents/mi-contenido/mi-negocio.md`), úsala y confirma cuáles tomaste.

Con las fotos, revisa que la luz, el fondo y la expresión sirvan para la lámina. Si algo no encaja, dilo antes de gastar saldo.

**No** (ilustraciones, objetos, escenas sin ella) → pasa al Paso 2.

Nunca generes una cara inventada para suplantar a la persona.

---

## PASO 2 — Sube las fotos de referencia

Solo si hubo fotos en el Paso 1:

```
media_upload(file_path="<foto>")   → devuelve dónde subirla y un id
media_confirm(file_id="<id>")      → confirma y devuelve el id de la imagen
```

Guarda el id de cada foto: se pasa como referencia al generar.

---

## PASO 3 — Escribe el prompt de cada lámina

Un prompt por lámina, en inglés, con cinco partes: **sujeto, acción, entorno, composición, estilo y luz**. Usa los colores de la persona (de su ficha o del pedido), no los de un ejemplo.

Decide dónde va el texto:

- **Texto corto** (titular de hasta unas 8 palabras) → puede ir dentro de la imagen.
- **Texto largo, listas o cifras** → genera la imagen **sin texto** y pon el texto encima con `carrusel-render-formula100k`. El texto compuesto en HTML nunca sale con errores.

### Portada y cierre (foto a sangre con texto encima)

```
Instagram carousel [cover/closing] slide, vertical 4:5.

PHOTO: Full-bleed lifestyle photo of [persona o escena]. [Luz]. The photo bleeds to all edges, zero margins.

TYPOGRAPHY ON PHOTO (no boxes):
— Hero word "[PALABRA]" in massive bold [tipo de letra], color [TU COLOR], [posición].
— Supporting line, white: "[texto de apoyo]"

MOOD: [mood]. No gradients. No watermarks.
```

### Láminas interiores (recorte de papel sobre foto)

```
Instagram carousel interior slide, vertical 4:5.

PHOTO BACKGROUND: Full-bleed photo of [escena]. [Luz]. Zero margins.

CENTERED ELEMENT: a large cream paper cutout with torn edges and a soft shadow.

TEXT INSIDE THE CUTOUT:
— "[número]" in bold [TU COLOR], top-left.
— "[título]" in bold black sans-serif.
— Body, black regular: "[texto corto]"

MOOD: [mood]. No gradients. No watermarks.
```

Guarda todos los prompts en `prompts.md` dentro de la carpeta del carrusel, pase lo que pase después.

---

## PASO 4 — Genera

Antes de generar, di cuántas imágenes vas a pedir y espera el visto bueno si son más de 5.

Forma esperada de la llamada (confirma los nombres de los parámetros en la descripción de la herramienta):

```
generate_image(params={
  model: "nano_banana_2",
  prompt: "<prompt de la lámina>",
  aspect_ratio: "4:5",
  resolution: "2k",
  count: 1,
  medias: [{ value: "<id de la foto>", role: "image" }]   # solo si la lámina lleva a la persona
})
```

- Lanza todas las láminas y espera cada trabajo con la herramienta de estado hasta que termine.
- Descarga cada imagen a la carpeta del carrusel como `slide-01.png`, `slide-02.png`…
- Mira cada resultado: si una lámina salió con texto mal escrito, manos raras o una cara que no es la de la persona, regenérala una vez con el prompt corregido. Si vuelve a fallar, pasa esa lámina a «imagen sin texto + texto en HTML».

---

## PASO 5 — Entrega

Carpeta: `~/Documents/mi-contenido/carruseles/[YYYY-MM-DD]_[tema]/`

```
slide-01.png … slide-0N.png
prompts.md
```

Reporta: cuántas láminas salieron, cuáles regeneraste, saldo usado si la herramienta lo informa, y la ruta. Abre la carpeta: en Mac `open "<ruta>"`, en Windows `start "" "<ruta>"`.

---

## Reglas

- ✅ Colores, letra y fotos de la persona.
- ✅ 4:5 siempre para carrusel de Instagram.
- ✅ Texto largo, fuera de la imagen.
- ❌ Sin caras inventadas que suplanten a la persona.
- ❌ Sin marcas de agua, logos de terceros ni cifras inventadas.
- ❌ No te detengas porque falte el conector: entrega prompts y versión tipográfica.
