---
name: reel-lista-que-suena-f100k
description: Arma el reel «lista que suena», un reel vertical SIN CARA con fondo liso, título fijo y una lista numerada de categorías que se va llenando; por cada categoría entran tres filas con carátula, nombre y onda de audio mientras suena un fragmento, y cierra con un CTA de palabra clave. Sirve para canciones y para cualquier lista de recomendaciones por categoría. Incluye la voz por frases, el render a MP4, la tabla de montaje (qué fragmento entra en qué segundo) y la mezcla automática de los audios. Usar cuando digan «reel de canciones por categoría», «lista de músicas de fondo», «lista que suena», «reel de recomendaciones por categoría sin cara», «top 3 por categoría en un reel», «reel tipo playlist», o pasen una lista por categorías y pidan un reel sin grabarse. NO usar para un reel hablado a cámara (editor-video-formula100k), para una lista simple sin categorías ni carátulas, para un carrusel (carrusel-formatos-f100k), para elegir las canciones o los ítems ni para conseguir música o portadas con derechos.
---

# Reel «lista que suena»

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

## Qué es

Un reel sin persona en cámara. En pantalla hay cuatro cosas, siempre en el mismo lugar:

1. **Título fijo** arriba.
2. **Lista numerada** de categorías. Los números están desde el inicio; el nombre de cada categoría se escribe cuando le toca.
3. **Tres filas** por categoría: carátula a la izquierda y, solo en la que está sonando, el nombre, una segunda línea (autor y etiqueta) y la onda de audio que se va llenando.
4. **Cierre** con una o dos pantallas: cuántos ítems hay en la lista completa y «Comenta PALABRA».

El ritmo: la voz dice una frase corta por categoría («Si tu video cuenta una historia, usa estas») y después suenan los tres fragmentos, uno tras otro. Funciona porque la persona guarda el reel como referencia y comenta para recibir la lista completa.

Mira `ejemplo/muestra.jpg` (y `ejemplo/muestra.mp4` si tu copia lo trae): plantas de interior según la luz, con carátulas dibujadas y tonos de prueba en lugar de música.

## Cuándo sirve y cuándo no

| Sirve | No sirve |
|---|---|
| De 3 a 8 categorías con hasta 3 ítems cada una | Listas sin categorías, o con más de 3 ítems por categoría |
| Ítems con nombre corto y una imagen cuadrada (portada, logo, foto del producto) | Ítems que necesitan explicación larga |
| Tienes una lista completa más grande para regalar en el CTA | No hay nada que entregar al final |

Si la lista **no suena** (libros, herramientas, cuentas), pon `filas.indicador: "barra"` y sáltate la mezcla: publica con la voz y un audio de fondo.

## Lo que necesitas antes de empezar

| Qué | Detalle |
|---|---|
| La lista | Categorías e ítems reales, con nombre y autor bien escritos. No inventes ítems ni cifras: si no hay fuente, pregunta |
| Una frase por categoría | De 6 a 10 palabras, dicha en voz alta. Más una o dos frases de cierre |
| Carátulas (opcional) | Imagen cuadrada por ítem. Sin imagen, la fila dibuja un disco con el icono de la categoría |
| Voz | La tuya grabada, una voz generada por frases o, para probar, la voz del sistema |
| Audios (opcional) | Un archivo por ítem. Ver «Música y derechos» antes de decidir |

**Carátulas y derechos.** Las portadas de discos, los logos y las fotos de producto tienen dueño. La skill no las descarga: las trae quien publica y decide si puede usarlas. Las del ejemplo están dibujadas.

## Flujo paso a paso

`SKILL` = `~/.claude/skills/reel-lista-que-suena-f100k`. `SALIDA` = la carpeta de trabajo de esta pieza.

**1. Copia la plantilla.**

```bash
mkdir -p "$SALIDA" && cp -R "$SKILL/plantilla/." "$SALIDA/"
```

**2. Datos: llena el contenido en `config.js`.** Título, `categorias` (nombre, icono, `frase` y sus ítems) y `cierre.pantallas` (cada una con su `frase` y sus textos). Borra de `caratulas/` las del ejemplo y pon las tuyas; la ruta de cada una va en `caratula` del ítem (`null` = disco). `index.html` no se toca.

**3. Voz.** Elige UNA de estas formas. Las tres dejan `tiempos.js` (todos los segundos del reel) y `pista-voz.wav` (la voz ya alineada):

```bash
# a) Frases sueltas ya generadas o grabadas: ponlas en $SALIDA/voz/01.mp3, 02.mp3 … en el orden del guion
node "$SKILL/scripts/voz.mjs" "$SALIDA"
# b) Una sola grabación tuya con todas las frases seguidas (deja una pausa corta entre frase y frase)
node "$SKILL/scripts/voz.mjs" "$SALIDA" --grabada "mi-voz.m4a"
# c) Voz de la computadora, gratis, para probar o medir tiempos (en Mac: --say Paulina; en Windows: --say a secas)
node "$SKILL/scripts/voz.mjs" "$SALIDA" --say
```

- El orden de las frases es: una por categoría y luego una por pantalla de cierre. Si falta alguna, el script dice cuál y con qué nombre de archivo la espera.
- En (b) la grabación se transcribe con Whisper en tu computadora (mlx-whisper en Mac con chip Apple, faster-whisper en Windows y en Mac Intel; la primera vez descarga el modelo), se ubica cada frase del guion y se corta por la pausa. El script imprime, por frase, cuántas palabras encontró y **lo que se oye en ese tramo: léelo y compáralo con el guion**. Una línea con «REVISAR» significa que esa frase no coincide.
- Para una voz generada o clonada (por ejemplo con el conector de Higgsfield o con ElevenLabs): una frase por pedido, guarda cada resultado como `voz/NN.mp3` y usa (a). Escribe en minúscula las palabras que irían en MAYÚSCULAS para que no las deletree. Cuesta créditos: mide primero con (c) y di cuánto gastaste.
- En (c), si Windows no tiene una voz en español instalada, el script lo dice: pídele a la persona que grabe su voz y usa (a) o (b). Para tiempos aproximados sin audio: `--estimar`.
- Sin audio todavía: `--estimar` calcula tiempos aproximados para poder ver el diseño.

Cada vez que cambies una frase, la voz o algo de `tiempos` en `config.js`, vuelve a correr este paso.

**4. Config: aspecto.** Colores, fuentes (solo del sistema), adornos, firma y comportamiento de las filas. Lee antes el `marca.md` de la persona si existe; si no, pregunta sus colores. Tabla de campos más abajo.

**5. Cuadros de prueba. Míralos antes de renderizar.**

```bash
node "$SKILL/scripts/render.mjs" "$SALIDA" --cuadros auto     # un cuadro por ítem sonando y por pantalla de cierre
node "$SKILL/scripts/render.mjs" "$SALIDA" --cuadros 0.2,5,12 # o los segundos que quieras
```

Abre `prueba/hoja.jpg` con Read y revisa: el título no se corta, cada nombre se lee entero, la carátula es la del ítem correcto, la última fila no baja de 1575 px y el cierre se entiende. El script avisa qué carátulas no cargaron (ruta mal escrita): esas filas salen con disco.

**6. Render.**

```bash
node "$SKILL/scripts/render.mjs" "$SALIDA"
```

Tarda varios minutos (30 cuadros por segundo). Deja `<archivo>.mp4` **con la voz y sin música** y `<archivo>-hoja.jpg` con 24 cuadros. Abre la hoja con Read. Ese MP4 ya es publicable: es la variante «voz sola».

**7. Tabla de montaje.**

```bash
node "$SKILL/scripts/montaje.mjs" "$SALIDA"
```

Escribe `MONTAJE.md` y `montaje.csv`: número, archivo esperado en `audios/`, categoría, nombre, segundo en que entra y sale, y la tabla de la voz. Entrégala siempre, aunque no se mezcle nada: es lo que usa quien edite a mano.

**8. Música (opcional).** La persona deja sus audios en `$SALIDA/audios/` con el número de la tabla (`01.mp3`, `02.mp3`…; también vale `01-nombre.mp3`, y `.wav` o `.m4a`):

```bash
node "$SKILL/scripts/mezclar.mjs" "$SALIDA"
node "$SKILL/scripts/comprobar-mezcla.mjs" "$SALIDA"
```

`mezclar.mjs` recorta cada audio al largo del fragmento a partir de su `inicio` (segundo del archivo, por ítem, en `config.js`: elige el tramo más reconocible), le pone fundido de 0,15 s al entrar y al salir, los iguala entre sí `mezcla.bajoLaVoz` dB por debajo de la voz, los coloca en su segundo y saca `<archivo>-con-musica.mp4`. Si faltan audios se detiene y dice cuáles; con `--permitir-faltantes` deja esos huecos en silencio. `comprobar-mezcla.mjs` mide por tramos y falla si un fragmento no suena, suena antes de tiempo o tapa la voz.

Para ensayar la mezcla sin música de nadie: `node "$SKILL/scripts/tonos-de-prueba.mjs" "$SALIDA"` llena `audios/` con tonos. No son para publicar.

## Música y derechos (dilo siempre, con estas palabras o parecidas)

- **La música comercial la consigue y la licencia quien publica.** La skill no descarga canciones ni portadas, y tú tampoco lo hagas por tu cuenta.
- **No está comprobado que Instagram deje publicar un reel con muchos fragmentos de música distintos** sin silenciarlo o limitar su alcance. Hay que probarlo en la cuenta (subirlo y revisar el aviso de derechos) antes de darlo por bueno.
- **Alternativa segura:** publicar el MP4 de voz sola y, al subirlo, ponerle UN audio de la biblioteca de Instagram a volumen bajo. Entrega siempre esta variante junto a la mezclada.
- Si algún ítem es de uso libre con crédito, el crédito va en el caption.
- En fragmentos con letra conviene `bajoLaVoz` de 10 o más.

## Campos de `config.js`

| Campo | Qué hace |
|---|---|
| `archivo` | Nombre del MP4, sin extensión |
| `titulo.linea1`, `linea2`, `alineacion` | Línea en negrita y línea en cursiva (`null` = una sola). `"izquierda"` o `"centro"`. Se achica solo si no cabe |
| `firma`, `firmaY` | Usuario al pie. `null` = sin firma |
| `categorias[].nombre`, `icono`, `frase` | Nombre en la lista, emoji del disco, frase de la voz |
| `items[].nombre`, `autor`, `etiqueta` | Primera línea y segunda línea («autor · etiqueta»). `autor` y `etiqueta` son opcionales |
| `items[].caratula` | Ruta de la imagen (cuadrada; se recorta al centro). `null` o archivo ausente = disco |
| `items[].inicio` | Segundo del archivo de audio donde empieza su fragmento |
| `cierre.pantallas[]` | `frase` (voz) y textos: `grande` (número; `_de_` va pequeño), `linea`, `palabra` (en recuadro), `cursiva`, `alineacion` |
| `cierre.ocultarLista` | `true` = al cierre se van título y lista y queda solo el CTA |
| `filas.entrada` | `"una-a-una"`: cada carátula entra cuando le toca · `"juntas"`: las tres desde que arranca la categoría |
| `filas.alTerminar` | `"atenuar"`: el nombre del que ya sonó se queda en gris (la captura sirve) · `"ocultar"` |
| `filas.indicador` | `"onda"`, `"barra"` o `"ninguno"` |
| `filas.resaltarCategoria` | Franja de color detrás de la categoría activa |
| `tiempos.fragmento` | Segundos por ítem. 2 a 2,5 funciona; con 6 categorías, 2 |
| `tiempos.arranque`, `antes`, `pausa`, `cola`, `colaFinal` | Respiros alrededor de la voz y al final |
| `mezcla.bajoLaVoz`, `fundido` | dB por debajo de la voz y duración del fundido |
| `colores`, `fuentes`, `adornos` | Fondo (centro y borde), tinta, acento, fondos de tapa, cinta, grano, cuadrícula |

## Reglas de contenido

- **Tutea y usa español neutro.** Frases cortas, dichas como se hablan.
- **Cada frase dice para qué sirve la categoría**, no su nombre: «Si cuentas una historia tuya, usa estas» y no «Categoría dos: emocional».
- **El cierre promete solo lo que existe.** «12 de 30» únicamente si la lista completa tiene 30. La palabra del CTA la confirma la persona; si es una propuesta tuya, dilo.
- **La carátula cumple lo que dice la fila:** es la imagen de ESE ítem, no un relleno parecido.
- **Marca.** Se copia la mecánica, no el aspecto de otra cuenta: colores y letras son los de quien publica.
- Nombres largos se achican solos hasta un mínimo; si aun así se cortan con puntos suspensivos, usa el nombre corto.

## Qué entregar

1. `<archivo>.mp4` (voz sola, listo para subir con un audio de la biblioteca).
2. `<archivo>-con-musica.mp4` si la persona trajo audios, con el resultado de `comprobar-mezcla.mjs`.
3. `MONTAJE.md` y `montaje.csv`.
4. Un párrafo con lo pendiente: qué carátulas faltan, que la música la licencia quien publica y que falta la prueba en Instagram.

No publiques ni subas nada por tu cuenta.

## Errores conocidos

- **«Falta tiempos.js».** No corriste el paso 3. Para solo ver el diseño: `voz.mjs --estimar`.
- **Sale el disco en vez de la carátula.** Ruta mal escrita o archivo ausente; `render.mjs` lista cuáles. Las rutas son relativas a la carpeta de la pieza.
- **La voz y la imagen se desfasan.** Cambiaste una frase o `tiempos` sin volver a correr `voz.mjs`. Corre 3, 6 y 7 otra vez, en ese orden.
- **Una frase quedó cortada o con un pedazo de la siguiente (voz grabada).** Faltó pausa entre frases. Vuelve a grabar con pausas claras o entrega las frases sueltas en `voz/`.
- **La voz del sistema deletrea una palabra.** Escríbela en minúscula en la frase (el script ya lo hace con las palabras en mayúsculas).
- **Muchas categorías.** Con 7 u 8 la lista se achica; con más no cabe. Parte el reel en dos.
- **Sale Times en vez de tu fuente.** Solo fuentes del sistema; las externas no cargan al renderizar.
- **No encuentra puppeteer-core o Chrome.** `npm install puppeteer-core` dentro de la carpeta de la pieza; ruta de Chrome en la variable `CHROME`.
- **Zonas de Instagram.** Arriba de 250 px va la barra y debajo de unos 1560 px van los botones y el texto. La plantilla reparte todo dentro; la firma (`firmaY`) queda en la zona baja a propósito y puede taparse.
- **Sin probar:** más de 3 ítems por categoría (no se admite), audios mono muy cortos, y la publicación real en Instagram con fragmentos de música.
