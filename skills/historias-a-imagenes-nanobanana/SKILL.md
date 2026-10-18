---
name: historias-a-imagenes-nanobanana
description: >
  Skill que convierte un guion de secuencia de historias (output de guionizacion-historias-formula100k)
  en imágenes terminadas listas para subir a Instagram Stories. Activar SIEMPRE que el usuario o un usuario
  pida: "renderiza este guion de historias", "convierte este guion en imágenes", "diséñame las stories
  de [archivo]", "pasa este guion a imágenes con nanobanana", "genera las historias diseñadas",
  "exporta este guion a PNG", "haz las imágenes de mi secuencia de stories", o cualquier variación
  que combine un guion de historias con la intención de tener archivos visuales finales. Usa Nano Banana
  por el motor que la persona tenga: el conector de Higgsfield o Gemini directo; sin ninguno entrega los
  prompts y una versión en HTML. Se conecta
  con una carpeta de fotos de marca personal (la pregunta y guarda como preset) y elige automáticamente
  la mejor foto base por slide. Imita el estilo nativo de Instagram Stories (fuentes IG, cajas
  redondeadas, paleta de su marca, capas de capturas/mockups, flechas amarillas, X/✓).
argument-hint: "<ruta al .md del guion> [--motor=gemini|higgsfield] [--fotos=<carpeta>]"
metadata:
  version: "1.0.0"
  depends-on: ["guionizacion-historias-formula100k"]
  mcp-optional: ["higgsfield"]
---

## 🧰 ANTES DE EMPEZAR (manda sobre lo que diga esta skill más abajo)

Corre igual en Mac y en Windows.

- **Tu negocio.** Los datos salen de la persona, nunca de un ejemplo: lo que venga en el pedido, su Manual o Segundo Cerebro si lo tiene, o la ficha `~/Documents/mi-contenido/mi-negocio.md`. Si no hay nada, pregunta rubro, avatar y oferta en un solo mensaje. Si existe `~/Documents/mi-contenido/mi-voz.md`, los textos suenan a ella.
- **Tu marca, en este orden:** 1) `~/Documents/mi-contenido/mi-marca.md` (colores, letra, estilo visual y @); 2) si no está, su manual de identidad visual `mi-marca/marca.md` (búscalo en la carpeta del proyecto, en `~/mi-marca/` o en una carpeta `mi-marca` dentro de Documentos; del YAML usa `color.acento`, `color.segundo`, `color.prohibidos`, `imagenes.*` y `firma.usuario`); 3) si no hay ninguno, usa el sistema visual de IG de la skill y pregunta su @ si la historia lo lleva. Su acento reemplaza al azul de la palabra clave y a los resaltados de muestra; nunca uses sus colores prohibidos.
- **Fotos.** Sus fotos reales viven en `~/Documents/mi-contenido/mis-fotos/` (o la carpeta que te diga). Nunca uses fotos de muestra ni caras inventadas.
- **Dónde guardar.** Todo lo que generes va dentro de `~/Documents/mi-contenido/` (crea la subcarpeta si no existe). Nunca escribas dentro de la carpeta de esta skill: con el plugin esa carpeta no es `~/.claude/skills/…` y se reemplaza en cada actualización.
- **Si falta una cuenta o un conector, no te detengas:** haz la parte que sí se puede y di en una línea qué faltó. Sin Higgsfield ni Gemini, entrega las historias en HTML (su foto de fondo y el texto encima) y deja el prompt de cada imagen listo para cuando conecte la cuenta.
- **Nombres de herramientas.** Un conector puede aparecer como `mcp__claude_ai_<Nombre>__…` o `mcp__<nombre>__…`: usa el que esté disponible.
- **Otras skills.** Si esta skill nombra otra que no está instalada, sigue sin ella y avisa.
- **Abrir un archivo o una carpeta:** en Mac `open "<ruta>"`; en Windows `start "" "<ruta>"`.
- **Llaves.** Nunca pidas que peguen una llave o un token en el chat ni los escribas en un archivo de `~/Documents/mi-contenido/`.

---

# Skill: Historias a Imágenes

Toma un guion de stories generado por `guionizacion-historias-formula100k` y produce imágenes PNG
listas para subir a Instagram Stories, imitando el estilo nativo de IG y el look del usuario.

---

## ⚠️ ANTES DE EMPEZAR — LEE ESTOS REFERENCIALES

Cargar SIEMPRE estos archivos antes de generar:

1. `references/parser-guion.md` — cómo parsear el .md del guion
2. `references/instagram-design-system.md` — sistema visual exacto a aplicar
3. `references/prompt-builder.md` — fórmula del prompt para generar el slide
4. `references/foto-matcher.md` — algoritmo para elegir la mejor foto del folder
5. `references/motor-selection.md` — cuándo usar Banana vs Higgsfield

No es opcional.

---

## DEPENDENCIAS

- **Conector de Higgsfield** (`mcp__claude_ai_Higgsfield__…` o `mcp__higgsfield__…`, modelo `nano_banana_2`) — edita sobre la foto base o genera desde cero
- **Gemini directo** (la skill `banana` o las herramientas de Gemini `gemini_edit_image` / `gemini_generate_image`, si la persona ya las tiene; no vienen en el plugin) — el mismo Nano Banana
- **Qué motor:** el que pida con `--motor=gemini|higgsfield`; si no pide ninguno, el que esté disponible (si tiene los dos, Higgsfield)
- **Sin ninguno de los dos:** no te detengas. Guarda el prompt de cada historia en `prompts.md` y arma las historias en HTML (su foto real de fondo y el texto encima, 1080 × 1920) para capturarlas como PNG
- **Skill `guionizacion-historias-formula100k`** — provee el formato de input (.md con frontmatter + tabla)

---

## INPUT

El usuario te dará alguna combinación de:

1. **Ruta al .md** del guion: `~/Documents/mi-contenido/historias/guiones/[archivo].md`
2. **Pegado del contenido** del guion directamente
3. **Carpeta de fotos** (opcional la primera vez, después se guarda como preset): `--fotos=<ruta>` o pregunta interactiva
4. **Motor preferido** (opcional): `--motor=gemini` | `--motor=higgsfield` (default: el que esté disponible)

Si no hay carpeta de fotos guardada como preset, usa `~/Documents/mi-contenido/mis-fotos/` si tiene fotos; si no, **pregúntala antes de proceder**:

> "Para diseñar las historias necesito una carpeta con tus fotos de marca personal (viajes, escritorio, trabajando, tu producto). Pásame la ruta. La voy a guardar como preset para las próximas veces."

Guarda el preset en: `~/Documents/mi-contenido/historias/preset.json` (nunca dentro de la carpeta de la skill; el `preset.json` de la skill solo trae los valores por defecto).

```json
{
  "fotos_folder": "~/Documents/mi-contenido/mis-fotos",
  "default_motor": "auto",
  "last_used": "2026-05-06"
}
```

---

## PIPELINE DE 7 PASOS

### Paso 1 — Parsear el guion

Lee el archivo .md o el contenido pegado. Extrae con el método de `references/parser-guion.md`:

- **Frontmatter YAML:** título, fecha, categoría, estructura, palabra_clave_cta, slides_count, mood
- **Tabla slide-by-slide:** array de slides con `{n, frase, capa_visual, formato, qué_grabar, briefing}`
- **Bloque ⚙️:** `fotos_necesarias_de_carpeta` y `elementos_a_generar` por slide

Si el bloque ⚙️ no existe (guion legacy), la skill debe inferirlo del contenido.

### Paso 2 — Cargar carpeta de fotos

```bash
ls -la "$FOTOS_FOLDER" | grep -E '\.(jpg|jpeg|png|heic)$'
```

Si la carpeta está vacía o no existe, error claro al usuario y aborto.

Si tiene >50 fotos, sugerir al usuario crear una subcarpeta de "fotos curadas" para acelerar el matcher.

### Paso 3 — Elegir motor por slide

Lee `references/motor-selection.md`. Lógica simple:

| Slide tiene... | Motor preferido |
|---|---|
| Foto del usuario como fondo + overlay de texto/cajas | **Banana (gemini_edit_image)** |
| Slide 1 con escenario complejo cinematográfico | **Higgsfield** (si el usuario quiere "wow") o Banana |
| Slide CTA con escenario bonito + cara | **Banana** (sobre foto real) |
| Mockup puro (dashboard, GPT, captura sintética) | **Banana** (genera desde cero) |
| Composición compleja con consistencia de cara | **Higgsfield** (si tiene Soul/character) |

**Default:** si la persona no especifica `--motor`, usa el que esté disponible (si tiene los dos, Higgsfield). Donde la tabla dice «Banana» es el modelo Nano Banana: por Higgsfield (`nano_banana_2`) o por Gemini directo, lo mismo.

### Paso 4 — Para cada slide: matchear foto

Aplica `references/foto-matcher.md`:

- Lee el campo `fotos_necesarias_de_carpeta[slide_N]` del bloque ⚙️
- Lista los archivos de la carpeta de fotos
- Elige la mejor coincidencia por:
  1. Match por nombre de archivo si tiene tags (ej: `playa.jpg`, `escritorio_lap.jpg`)
  2. Si no hay match obvio, presenta 3 candidatos al usuario y pide que elija
  3. La elegida se cachea en una sesión: si slides 1, 3, 5 piden "playa", usa la misma foto para todos

Si NO hay foto que matchee (slide 100% mockup):
- Skip foto base
- Generar desde cero con Banana

### Paso 5 — Construir prompt por slide

Aplica `references/prompt-builder.md`. Cada prompt tiene 3 capas:

**Capa A — La foto base (si aplica):**
```
"Use this photo as background: [foto-del-usuario-en-playa.jpg]"
```

**Capa B — Estilo Instagram Stories nativo:**
```
"Compose this as an Instagram Story image (1080x1920 vertical, 9:16).
Apply Instagram's native UI style:
- Use Instagram's default sans-serif font (similar to SF Pro / Helvetica Neue Bold)
- Text boxes should have rounded corners (12-16px radius)
- Box colors: solid white, solid black, neon yellow (#FFE93C), neon green (#4ADE80), bright red (#EF4444)
- Drop shadow on boxes is subtle (10% opacity, 4px offset)
- Highlight effect on keywords: solid color background behind specific words"
```

**Capa C — El contenido específico del slide:**
```
"Place the following elements on the image:
1. [White text box] centered top: '[FRASE EXACTA DEL SLIDE]'
2. [Capture/mockup] center-right: [descripción del mockup]
3. [Yellow curved arrow] pointing from text to capture
4. [Red X marks] over the bad examples
5. [Green check marks] over the good examples
6. Highlight the word '[KEYWORD]' in [yellow/green]
7. [Emoji] 🎁 large, top-center, above the text box"
```

Ver ejemplos completos en `references/prompt-builder.md`.

### Paso 6 — Generar la imagen

**Si motor = Gemini (skill `banana` o herramientas de Gemini que la persona ya tenga):**
```
/banana edit <foto-base-path> "<prompt-construido>"
```
Si no tiene ninguna de las dos, usa Higgsfield (abajo).

Captura el output path y muévelo a la carpeta destino.

**Si motor = Higgsfield (MCP):**

1. Sube la foto base como asset:
   ```
   mcp__higgsfield__media_upload(file_path="<foto-base>")
   mcp__higgsfield__media_confirm(...)
   ```

2. Genera la imagen:
   ```
   mcp__higgsfield__generate_image(
     prompt="<prompt-construido>",
     reference_assets=[<asset-id>],
     aspect_ratio="9:16",
     ...
   )
   ```

3. Espera con `mcp__higgsfield__job_status`. Cuando esté lista, descarga vía `mcp__higgsfield__show_medias`.

### Paso 7 — Guardar y mostrar preview

Carpeta destino:
```
~/Documents/mi-contenido/historias/imagenes/[nombre-del-guion-sin-md]/
├── slide_1.png
├── slide_2.png
├── slide_3.png
├── ...
└── _metadata.json          ← record del run
```

Donde `_metadata.json` tiene:
```json
{
  "guion_origen": "/path/to/guion.md",
  "fecha_generacion": "2026-05-06T14:30:00",
  "motor_por_slide": {"1": "higgsfield", "2": "higgsfield", "3": "higgsfield", ...},
  "foto_usada_por_slide": {"1": "playa.jpg", "2": null, "3": "playa.jpg", ...},
  "prompts_usados": {"1": "...", "2": "..."}
}
```

Después mostrar al usuario:
1. Lista de imágenes generadas con tamaños
2. Preview Markdown con cada imagen embebida (o el comando para abrir la carpeta)
3. Costo aproximado (suma de tokens Banana + créditos Higgsfield)
4. Próximo paso: "¿Quieres que regenere algún slide específico?"

---

## CASOS ESPECIALES

### Slide 100% mockup (sin foto del usuario)

Ejemplo: slide 4 que muestra solo un mockup del GPT.

- Skip el matcher de fotos
- Banana genera desde cero con prompt tipo:
  ```
  "Realistic mockup of an OpenAI ChatGPT custom GPT interface showing
  '[NOMBRE DEL GPT]'. Clean white UI, blue primary color, displayed on
  a slight 3D perspective. Below: 3 bullet points with green check marks
  saying [bullet 1], [bullet 2], [bullet 3]. Apply Instagram Stories style overlays."
  ```

### Slide con captura real (dashboard, DM, calendario)

Si el guion menciona una captura específica que el usuario ya tiene en su carpeta:
- Buscar archivos tipo `dashboard*.png`, `dm-*.jpg`, `calendario_*.png`
- Usarla como capa adicional sobre la foto base

Si NO la tiene:
- Pedirla explícitamente: "Para el slide 3 necesitas una captura de tu dashboard de Skool. ¿La tienes lista? Pásame la ruta."

### Slide de URGENCIA (fondo plano permitido)

Si el guion es categoría `urgencia` y el slide es F9 (fondo de color):
- No usar foto base
- Banana genera fondo plano con texto IG style + emoji ⏰ o ⚠️

---

## OPCIONES DE COMANDO

| Flag | Default | Función |
|---|---|---|
| `--motor=gemini\|higgsfield` | el que esté disponible | Forzar motor |
| `--fotos=<ruta>` | preset guardado | Carpeta de fotos override |
| `--solo=1,3,5` | todos | Renderizar solo ciertos slides |
| `--variantes=N` | 1 | Generar N variantes por slide |
| `--no-cache` | false | Ignorar cache de fotos elegidas |

---

## ⚠️ ESPAÑOL NEUTRO OBLIGATORIO EN TEXTOS DE SLIDE

Cualquier texto que renderices sobre el slide debe estar en **español neutro**, NO argentino.
Si el guion del .md trae argentinismos (tenés, podés, querés, acá, decime), CORRÍGELOS antes
de meterlos al prompt del motor de imagen. Reemplazos:

vos→tú, sos→eres, tenés→tienes, podés→puedes, querés→quieres, sabés→sabes,
copiá→copia, mandá→manda, contá→cuenta, escribí→escribe, decime→dime,
acá→aquí, laburo→trabajo, plata→dinero, che/dale→(omitir).

---

## NO HACER

- No generar el guion (eso lo hace `guionizacion-historias-formula100k`).
- No subir las imágenes a Instagram (el usuario las sube manual).
- No usar fonts externas que no sean nativas de IG.
- No inventar capturas de dashboard que el usuario no tenga; pedirlas explícitamente.
- No olvidar el aspect ratio 9:16 (1080x1920).
- No olvidar guardar el preset de carpeta de fotos en la primera invocación.
- No usar `mcp__higgsfield__generate_video` — solo imagen.
- **No renderizar textos con voseo o argentinismos** sobre las imágenes (ver arriba).
