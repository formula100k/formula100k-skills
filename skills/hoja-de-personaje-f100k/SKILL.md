---
name: hoja-de-personaje-f100k
description: Arma la HOJA DE PERSONAJE (character sheet) que fija la cara, el cuerpo y la ropa antes de cualquier imagen o video con IA en Higgsfield. Dos caminos - PERSONA REAL (tú o una clienta - tu cara base + la foto de la ropa del día) o AVATAR NUEVO (marca, UGC, personaje de corto - brief → referencias de Pinterest/marcas con palabras clave en inglés → ficha con medidas del cuerpo y signo distintivo → historia). Genera la hoja de 4 paneles (cara · perfil 90° · espalda · cuerpo sin rostro) con luz neutra #F7F7F7, la revisa en voz alta, la parte con su script y crea el Element. Extras - hoja de cara con 8 expresiones, historia del avatar y presentación de 4 láminas para la clienta, y las fotos base para clonarte a ti misma. Va antes de celular-a-cine-f100k y de cualquier video con un personaje. Activar con "hazme la hoja de personaje", "character sheet", "hoja de vestuario", "crea un avatar", "avatar para mi marca", "modelo de IA para mi campaña", "clóname", "que no le cambie la cara", "crea el Element de", "presenta el avatar a la clienta", "hoja de expresiones". NO usar para el video en sí (celular-a-cine-f100k) ni para mascotas dibujadas con código (animacion-dibujada-f100k).
argument-hint: "[real|avatar] [nombre] [foto de cara o brief] [foto de la ropa]"
---

# Hoja de personaje · FÓRMULA 100K

La consistencia de un personaje **no se arregla escribiendo mejor**: se arregla pasándole al
modelo la cara como *input*. La hoja es ese input. Va **antes** de cualquier imagen o video con
una persona, aunque sea «solo una prueba».

> 🔴 Con una sola foto de calle como referencia, el modelo le cambia la cara a la persona. La foto
> trae una sola vista, luz dura y la cara chica, y el modelo inventa el resto. La hoja le da todo.

Archivos de apoyo (se leen cuando toca):
- `references/prompt-hoja.md`: las plantillas A (persona real) y B (avatar), la variante de marca, la hoja de cara, los costos y la revisión.
- `references/casting-y-referencias.md`: del brief a la ficha, las palabras clave, los 8 estilos, la lista de qué hace memorable a un avatar y el signo distintivo.
- `references/lore-y-presentacion.md`: la historia del avatar, la presentación de 4 láminas y las fotos base para clonarte.
- `scripts/partir_hoja.py`: parte la hoja en una imagen por panel y le quita la cabeza al BODY.
- Un **Element** es un personaje guardado en Higgsfield con nombre fijo: se invoca en el prompt
  (`<<<uuid>>>`) y el sistema le pasa la cara al modelo. Necesitas el conector de Higgsfield y créditos.

---

## Paso 0 · ¿Qué camino?

| Camino | Cuándo | Entra |
|---|---|---|
| **A · Persona real** | tú o una clienta que sale en el video | su cara base + **una foto de cuerpo entero con la ropa del día**, de frente y con luz de día |
| **B · Avatar nuevo** | una modelo de IA para una marca, un UGC o un personaje de corto | un brief (o 3 datos: para qué es, tono y edad) + referencias |

Si lo pide para un **festival**, se usa solo el camino B: en festival no entran caras reales como input.

**Carpetas:**
- Persona real: `~/Documents/mi-contenido/personajes/<nombre>/`. La primera vez se hace la **hoja base** (ver las fotos base en `references/lore-y-presentacion.md`); después, cada look en `<nombre>/vestuarios/<look>/`, partiendo de la FACE de la base.
- Avatar de marca o UGC: `~/Documents/mi-contenido/avatares/<marca>/<nombre>/`.

Antes de gastar, `balance` y `get_cost: true`, y se dice el número.

## Paso 1 · Casting (solo camino B)
Sigue `references/casting-y-referencias.md`:
1. Del brief, saca los 4 datos: marca/uso, tono, rasgos y ropa.
2. Junta de 4 a 6 referencias de cara y de 2 a 4 de ropa. Se buscan en Pinterest o en marcas de ropa con palabras clave **en inglés**, **en serie y nunca con un script en masa**. Lo más simple es que la persona pase sus pines.
3. Pasa la lista de los 6 puntos que hacen memorable a un avatar y define el **signo distintivo**.
4. Escribe la **ficha** con nombre, edad, origen, pelo, piel, rasgos, **cuerpo con medidas**, signo distintivo, estilo, actitud y la frase de una línea.

**Checkpoint:** le muestras la ficha y las referencias juntas y esperas su OK.

## Paso 2 · La hoja (≈6,5 cr)
- Modelo `gpt_image_2` con `resolution: 2k`, `quality: high` y `aspect_ratio: 16:9`. Las fotos entran con rol **`image`** (no `image_references`): la imagen 1 es la cara y la imagen 2 es la ropa.
- Prompt: plantilla A o B de `references/prompt-hoja.md`, con los paneles **FACE · PROFILE · BACK · BODY**.
  - Para un avatar de marca o UGC sirve la variante **FACE · MEDIUM · PROFILE · BODY**.
- Lo nuevo del 3-nov que siempre va:
  - identidad de **cara y cuerpo 1:1**, con altura y complexión;
  - ropa **idéntica en las 4 vistas** y solo las prendas que se listan;
  - **cuerpo entero dentro del cuadro**;
  - piel con poros, microdetalle y vello fino.
- Todo **en positivo**.

## Paso 3 · Revisión en voz alta
Pasa la lista de 6 puntos de `prompt-hoja.md`: misma cara, mismo cuerpo, misma ropa, nada cortado, separadores limpios y signo distintivo visible. Si un punto falla, se regenera con el arreglo y se avisa del costo.

Le muestras la hoja (`open`) y **esperas su OK**. Sin OK no hay Element.

## Paso 4 · Partir y crear el Element
```bash
uv run <carpeta de esta skill>/scripts/partir_hoja.py <hoja.png> \
  --nombre <nombre-element> --orden FACE,PROFILE,BACK,BODY -o <carpeta>/ELEMENTS
```
- El script busca la línea blanca de cada división y no se confunde con pelo oscuro ni con un bolso que toca el borde.
- Al BODY le quita la cabeza. **La única cara que manda es la del FACE.**
- Mira la tira de las 4 piezas antes de subirlas.
- Sube las 4 piezas con `media_upload` → PUT → `media_confirm`.
- Crea el Element con `manage_reference_elements`, en la categoría `character`. El nombre va en minúsculas, sin tildes y con guiones (`sofi-terraza`, `mara-skincare`), y no se cambia nunca.
- Anótalo en el `ELEMENTS.md` de la carpeta: nombre, uuid, look y fecha.

**Qué modelos lo leen:**
- Leen el Element: `seedance_2_0`, `cinematic_studio_*`, `kling3_0` y los de imagen.
- **`seedance_2_5` y `wan3_0` ignoran el `<<<uuid>>>`.** Para esos se pasan las 4 piezas como `image_references`, en orden FACE, PROFILE, BACK, BODY.

## Paso 5 · Extras (solo si los pide o si el uso lo necesita)
- **Hoja de cara con 8 expresiones**, para avatares que hablan a cámara o salen mucho en primer plano. Se parte con `--filas 2`. Al Element entran como máximo 1 o 2 de las caras, nunca las 8.
- **Historia y presentación de 4 láminas** (portada, hoja, historia y el avatar en la vida real), para una clienta o una campaña. Ver `lore-y-presentacion.md`.
- **Fotos base para clonarte**, si es una persona real sin hoja base. Ver `lore-y-presentacion.md`.

## Al terminar
Entrega:
- la ruta de la hoja y de las 4 piezas;
- el nombre y el uuid del Element;
- el costo gastado;
- qué sigue (por ejemplo `celular-a-cine-f100k`).

---

## Reglas
- **Una cara por imagen dentro del Element.** Una hoja con close-up y cuerpo entero juntos le muestra dos caras al modelo, y las promedia.
- **La luz de la hoja es neutra** (#F7F7F7, ventana norte). La luz de cada toma la pone el prompt de la toma, no la hoja.
- **Cada vestuario lleva su hoja**, hecha desde la hoja base. Un Element viejo con otra ropa arrastra esa ropa.
- **Un avatar no copia la cara de una persona real** de Pinterest: se inspira en ella y crea una cara nueva.
- **Un avatar nunca da testimonios ni resultados inventados.**
- **Nada de bajar Pinterest ni otra librería en masa.** Se busca en serie y con pausas, o la persona pasa las referencias.
