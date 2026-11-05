---
name: collage-gancho-f100k
description: Arma el collage de gancho estilo @improvewithkate (título de 2 líneas sobre la frente y recortes aesthetic alrededor de la cabeza y a la altura del pecho) desde una BIBLIOTECA PROPIA de imágenes que crece con cada uso. Primero busca en la biblioteca; solo si falta, baja de Openverse (gratis, libres para ads) o, si la persona tiene cuenta de Apify, de Pinterest (centavos), con etiquetas, hoja de muestras numerada para elegir, recorte sin fondo en la computadora y registro de usos para no repetir. Sale una capa PNG transparente de 1080×1920 para poner encima del video. Usar cuando digan «collage de gancho», «gancho como Kate», «imágenes aesthetic para el gancho», «busca imágenes para el gancho», «recortes alrededor de mi cabeza», «arma el collage de este reel», «qué imágenes pongo en el gancho», «llena la biblioteca de imágenes» o pasen uno o varios ganchos para vestirlos con imágenes. NO usar para portadas de carrusel ni para animaciones con movimiento (animacion-collage-editorial-f100k).
---

# Collage de gancho · biblioteca que se reutiliza

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

## Reglas del gancho (mandan sobre cualquier gancho de esta skill)
El texto del gancho en pantalla lleva de 2 a 5 palabras, sin tercera línea; una línea ENORME en letra de diseño según el tema, color plano sin brillo ni degradado y con corte seco (rojo si es negativo, verde si es un logro, el acento de la marca si no) y otra chica; negativo o polémico (orden que quita, diagnóstico que duele, algo prohibido, insolencia) o una cifra real desnuda; sin nombrar Claude, prompt ni skill, y hablando de TI. La primera frase hablada dice lo mismo en ≤ 12 palabras. Lleva al menos 1 palabra clave del video (la del CTA o la cifra real) y las dos líneas se leen como UNA frase con sentido (no dos ideas pegadas). Escribe 3 variantes A/B/C, puntúalas y elige como principal la más clara.

La idea: cada imagen se busca una sola vez. Se guarda con etiquetas en la biblioteca de la persona
(`~/Documents/mis-animaciones/biblioteca-collage/` en Mac, `~/mis-animaciones/biblioteca-collage/` en Windows, o donde diga
la variable `BIBLIO_COLLAGE`), y la próxima vez que un gancho hable de dinero, mente o ventas sale de ahí gratis.

Scripts (solo Python estándar + Chrome; se corren con `uv run`, que trae su propio Python):
- `scripts/biblio.py`: biblioteca (`buscar`, `traer`, `hoja`, `recorte`, `usar`, `etiquetar`, `descartar`, `ver`, `resumen`)
- `scripts/componer.py`: capa del collage de 1080×1920 con fondo transparente, y una prueba sobre la toma
- `scripts/rostro.swift` (Mac, Vision) y `scripts/rostro.py` (Windows, OpenCV): dónde está la cara en la toma

Corre siempre con `uv run <skill>/scripts/<script> ...` (en Mac también sirve `python3 -I <skill>/scripts/<script> ...`).

## Paso 0 · Lo de la persona
- **Marca:** `~/Documents/mi-contenido/mi-marca.md` → color del bloque fuerte (`"color"`) y de la línea 1 (`"color_titulo"`) cuando no va rojo ni verde, y la letra si encaja con el tema. Si no existe, pregunta o usa el estilo de Kate.
- **Negocio:** `~/Documents/mi-contenido/mi-negocio.md` → de qué habla su contenido, para las etiquetas y los conceptos. Si no existe, pregunta.

## Edición sin olor a IA
- El collage ya es lo que pide la regla: **fotos y recortes reales** (cine, época, diccionario, ambiente), nunca emojis,
  íconos ni stickers con brillo. Si el gancho nombra algo de la persona (su perfil, su resultado), va su captura real.
- **Letra de diseño según el tema** en la línea 1: `"letra": "palo"` (la de Kate), `"condensada"` (póster) o `"serif"`
  (itálica elegante). La línea 2 sigue en serif cursiva: tamaños distintos, la palabra clave más grande.
- **Sin brillos ni degradados** en el título (solo la sombra seca para que se lea) y la capa entra en el editor con
  **corte seco** en el cuadro 0 y se queda quieta: sin pop, rebote, temblor ni recortes que tiemblan.

## Anatomía del gancho de Kate (lo que se copia)

1. **Título de 2 líneas sobre la frente:** la 1 sans gruesa y la 2 serif cursiva. A veces en contorno, como «Finance Maxxing». Debajo puede ir una etiqueta chica: «(niche edition)».
2. **De 2 a 4 recortes rodean la cabeza** y **2 van abajo, a la altura del pecho**. La cara queda libre al centro.
3. **Cada imagen dice el título de forma literal.** La imagen ES el tema.
4. **Mezcla de 4 tipos:** fotograma de cine o de época, ilustración científica (neuronas, cerebro), texto editorial o definición de diccionario («Ambition. noun»), y foto de ambiente.
5. **Paleta apagada** (blanco y negro o sepia) con **un solo** bloque de color fuerte.
6. Sus ganchos verbales: el premio en la primera frase y el método con nombre.

## Flujo

### 1. Del gancho a los conceptos
Por cada gancho, escribe en una línea «qué imágenes dicen este tema sin leer el título» y saca de 4 a 6
conceptos literales, uno por tipo. Ejemplo: «Así cobras tu primer cliente» → billetes contados en mano,
apretón de manos de época, recorte de recibo o factura, definición de diccionario «client», mujer en escritorio vintage.

### 2. Biblioteca primero
```
uv run biblio.py buscar "dinero, billetes, factura" --necesito 6
```
Dice cuántas hay disponibles (sin uso en los últimos 14 días) y si **ALCANZA** o **FALTAN**. Si alcanza, salta al paso 4.

### 3. Traer solo lo que falta, en tanda
Junta en **una sola llamada** los conceptos que faltan de todos los ganchos de la semana. Consultas en inglés
(rinden más), con etiquetas en español después de `=>`:
```
uv run biblio.py traer "money counting hands black and white=>dinero,billetes,cobrar" \
                       "vintage handshake business=>trato,cliente,acuerdo" \
                       "dictionary=>definicion,texto" \
                       --estilo blanco-y-negro --por-consulta 20
```
Palabras que dan el look: `aesthetic`, `black and white`, `vintage`, `editorial`, `film still`,
`scientific illustration`, `dictionary definition`, `newspaper clipping`, `renaissance painting`.

Fuentes (`--fuente`):
| Fuente | Costo aprox. | Cuándo |
|---|---|---|
| `openverse` (por defecto) | 0 | Libres para **ads** (CC0, dominio público, CC BY, CC BY-SA). Consultas de 1 a 3 palabras; la relevancia es más baja, revisa todo |
| `devcake` | 0,002 USD por imagen, mínimo 24 por consulta (~0,05). Necesita `APIFY_TOKEN` | Pinterest: trae la original y los guardados; ordena por lo que más frena el dedo |
| `fetch_cat` | 0,05 por corrida + 0,0014 por imagen. Necesita `APIFY_TOKEN` | Pinterest, tandas grandes de muchas consultas |

Pinterest pasa por Apify, que es de pago: úsalo solo si la persona tiene cuenta y lo pide (su llave va en la variable
`APIFY_TOKEN`; nunca la escribas en un archivo de la skill). Cada gasto queda anotado en `indice.json` (`resumen` da el total).

### 4. Hoja de muestras y elección
```
uv run biblio.py hoja --etiquetas "dinero, cobrar" --max 20 --titulo "gancho primer cliente"
```
Abre la PNG con Read y preselecciona de 4 a 6, o enséñasela a la persona para que elija por número. Lo que
no sirva **descártalo** (`descartar <ids> --motivo "..."`) para que no vuelva a salir. Si una imagen vale para
otros temas, súmale etiquetas (`etiquetar <id> +ventas +exito`).

### 5. Recorte sin fondo (solo objetos sueltos)
Fotos con escena (película, cuarto, paisaje) van como foto rectangular, sin recorte. Objetos o personas
sueltas (billetes, una pieza de ajedrez, una cabeza esculpida) van recortados, gratis y en la computadora:
1. `uv run biblio.py ver <id>` → `ruta`
2. `node <animacion-dibujada-f100k>/scripts/sistema.mjs recortar <ruta> recorte.png` (la primera vez baja el modelo)
3. `uv run biblio.py recorte <id> recorte.png` (el recorte queda guardado y no se vuelve a hacer)
Si la persona prefiere un quita-fondos con IA (Higgsfield u otro), también sirve: el paso 3 acepta una URL.

### 6. Componer
Escribe un JSON (formato en la cabecera de `scripts/componer.py`) con título, etiqueta, ids de arriba
(2–4) y de abajo (0–2), el color opcional y un fotograma de la toma para la prueba:
```
uv run componer.py pieza.json
```
**El título se acomoda al rostro.** Con `"toma"` (fotograma o el video del reel) el script detecta la cara
(en Mac con Vision, gratis, `rostro.swift` se compila solo la primera vez; en Windows con OpenCV, `rostro.py`, que
`uv` instala la primera vez) y elige:
1. **Arriba de la frente** si cabe entre los recortes de arriba y la frente (lo preferido).
2. Si no, **debajo de la barbilla**. Si falta poco espacio, los recortes del pecho bajan hasta 140 px.
3. Si no cabe en ninguno, lo pone donde tape menos y avisa qué cambiar (menos recortes o título de 1 línea).

La cara se mueve durante el gancho: pasa el **video** como `"toma"` (mira los primeros `"segundos"`, 3 por
defecto) o suma cuadros del tramo con `"muestras"` (globs). Se usa el peor caso: la frente más alta y la barbilla
más baja. `"posicion_titulo"` fuerza `"arriba"`, `"abajo"` o una y en px. Si en el editor mueves la capa, el título
se mueve con ella: déjala en su lugar o vuelve a mirar la prueba.

Mira `-prueba.png`: cara despejada, título legible y ninguna imagen que no se entienda sin leer. La capa
`.png` transparente va encima del video en el editor (CapCut u otro), desde el cuadro 0 del gancho.
Guarda la pieza del proyecto en `~/Documents/mis-animaciones/<proyecto>/` (Mac) o `~/mis-animaciones/<proyecto>/` (Windows).

### 7. Registrar el uso
```
uv run biblio.py usar "reel-primer-cliente" id1 id2 id3 id4
```
Así `buscar` no la vuelve a ofrecer en 14 días y el feed no se ve repetido.

## Reglas
- **Las imágenes NUNCA se superponen.** `componer.py` corta el render si dos se tocan (12 px de aire mínimo).
- **Si hay un cuadro o una captura protagonista** («este cuadro…»), va ARRIBA al centro y grande, con 2 a los lados de la cabeza y 2 abajo: `"cuadro": true`, `"arriba": [cuadro]`, `"lados": [a, b]`, `"abajo": [c, d]`.
- **El título NOMBRA el tema del video** con el nombre que la persona le da («Los droides / de Disney», «LA CULTURA / de la dopamina»), no una consecuencia suelta («YA NO / te emocionas» no sirve).
- El título fijo arriba durante todo el video se puede usar cuando el formato lo pide (por ejemplo un «Antes / Después», donde el título fijo es la promesa). Si el video no lo necesita, basta con el título del collage.
- **Derechos:** lo de Pinterest casi siempre tiene derechos de terceros (fotogramas, fotos ajenas). Sirve como recorte en **orgánico**. En **anuncios pagados** solo `buscar ... --solo-libres` (Openverse, con el crédito que guarda la ficha) o imágenes propias.
- Nunca imágenes de otras creadoras de contenido ni capturas de sus posts.
- Textos en pantalla en español neutro y tuteando. Sin preguntas retóricas en el gancho.
- No gastes en recortes de imágenes que no se van a usar: primero se elige y después se recorta.

## EN TU COMPU
- **Marca:** `~/Documents/mi-contenido/mi-marca.md` (colores y letra). **Negocio:** `~/Documents/mi-contenido/mi-negocio.md` (temas de su contenido). Si no existen, se pregunta.
- **Biblioteca:** `~/Documents/mis-animaciones/biblioteca-collage/` en Mac y `~/mis-animaciones/biblioteca-collage/` en Windows (o `BIBLIO_COLLAGE`). **Capas terminadas:** `~/Documents/mis-animaciones/<proyecto>/` en Mac y `~/mis-animaciones/<proyecto>/` en Windows.
- **Programas:** `uv` (corre los scripts y, en Windows, OpenCV para la cara), Google Chrome (dibuja la capa y la hoja), ffmpeg (si la toma es un video). En Mac, `swiftc` (viene con las herramientas de línea de comandos de Xcode) para la cara con Vision; si no está, usa OpenCV como en Windows. Para recortar objetos, la skill `animacion-dibujada-f100k` instalada junto a esta. Sin `package.json`.
- **Internet:** para traer imágenes nuevas.
- **Sin pagos obligatorios:** Openverse es gratis. Pinterest vía Apify es opcional y de pago.
