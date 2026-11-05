---
name: reel-manotazo-f100k
description: Arma el reel del manotazo, un reel vertical de unos 7 segundos de problema y solución. Sobre una toma tuya a cámara va un texto con el problema y UNA imagen; das un manotazo hacia la cámara y, en ese cuadro exacto, el texto cambia a tu respuesta y la imagen se convierte en una cuadrícula de hasta nueve piezas. Usar cuando digan «reel del manotazo», «antes y después con un golpe a la cámara», «una imagen se convierte en nueve», «reel de problema y solución en 7 segundos», «reel de clienta dice / yo digo», «el reel donde le pego a la cámara y cambia», «muestra mis nueve publicaciones en un reel», o pasen un clip con un gesto brusco y pidan que el cambio caiga ahí. NO usar para editar un video hablado largo, cortar silencios o poner subtítulos (editor-video-formula100k), ni para animaciones sin persona a cámara (las skills de animación hermanas), ni para fabricar las imágenes del resultado (eso va antes, con tus skills de carrusel o con Higgsfield).
---

# Reel del manotazo

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

## Qué es y para qué sirve

No es una animación. Es una toma tuya mirando a la cámara, con dos capas encima:

1. **Antes (el problema).** Un texto corto, casi siempre en voz de otra persona («Clienta: necesito 9 publicaciones para el sábado y solo tengo una foto»), y debajo UNA imagen pequeña en una tarjeta.
2. **El manotazo.** A mitad del clip das un golpe con la mano hacia la cámara.
3. **Después (el resultado).** En ese mismo cuadro el texto cambia a tu respuesta («Yo: dame cinco minutos») y la imagen se vuelve una cuadrícula de 1 a 9 piezas, que entra con un golpe corto de 3 o 4 cuadros.

Sirve para mostrar una transformación en menos de 7 segundos: poco material → mucho resultado, borrador → pieza terminada, un producto → su catálogo. Vende porque enseña el resultado sin explicarlo. Regla de contenido: el texto «antes» es un dolor real de tu clienta, el «después» es tu respuesta. No pongas cifras de resultados que no puedas probar.

**La imagen cumple lo que dice el texto, al pie de la letra.** Si el texto dice «solo tengo una foto», las nueve piezas del «después» salen de ESA foto y se nota que es la misma. Si dice «un producto», todas muestran ese producto. Rellenar la cuadrícula con piezas que ya tenías de otros temas rompe la promesa y es el error más grave de este formato.

Mira `ejemplo/muestra.jpg` (la hoja de cuadros de una florería; si tu copia trae `ejemplo/muestra.mp4`, mejor el video) antes de empezar. Ese ejemplo usa un **fondo sustituto** (una foto fija y una mancha de color que imita la mano), porque la skill no trae a nadie grabado. Tu reel de verdad lleva tu clip.

## Lo que necesitas

| Qué | Detalle |
|---|---|
| Un clip tuyo | Vertical, con el manotazo. Guion de grabación abajo |
| Dos textos | El problema y tu respuesta. Cortos: se leen en 2 o 3 segundos |
| La imagen «antes» | Una sola: la foto del producto, el borrador, la captura |
| De 1 a 9 imágenes «después» | Tus piezas ya hechas. Si no existen, mira «Si no tienes las imágenes» |

## Guion de grabación (léelo antes de grabar)

- **Encuadre.** Celular en vertical, apoyado y quieto, a la altura del pecho o un poco más abajo, a un brazo de distancia. Tu cara ocupa el tercio de arriba del cuadro. El texto y las imágenes caen del pecho hacia abajo: no pongas nada importante ahí.
- **Duración.** Graba de 8 a 10 segundos de corrido. El reel usa unos 7.
- **Segundos 0 a 3.** Mira a la cámara con cara de «me acaban de pedir un imposible». Casi sin moverte: mientras tanto se lee el problema.
- **Segundo 3 a 4: el manotazo.** Un solo golpe rápido con la mano abierta, de un lado al otro del cuadro, pasando cerca del lente. Que la mano tape buena parte de la imagen por un instante. Rápido y de una sola vez: si lo haces lento, el cambio se ve blando.
- **Después del manotazo.** Baja la mano y quédate 3 o 4 segundos mirando a la cámara, tranquila, con cara de «listo». Ahí aparece la cuadrícula.
- **Qué evitar.** No te muevas fuerte en ningún otro momento (acomodarte, acercarte al celular): el detector puede confundirlo con el manotazo. No hables si vas a ponerle música en Instagram. Luz de frente, fondo simple.
- **Variante con dos tomas** (como el reel original de este formato): graba el problema y el manotazo, corta, cámbiate de lugar o de postura y graba el final. Une las dos tomas en un solo archivo antes de usar la skill. El cambio va en el corte entre tomas.

Cualquier gesto brusco hacia la cámara sirve: un chasquido cerca del lente, tapar la cámara con la palma, lanzar una prenda.

## Flujo paso a paso

`SKILL` = la carpeta de esta skill (la que tiene este `SKILL.md`; con el plugin no está en `~/.claude/skills`). `SALIDA` = la carpeta de trabajo de esta pieza.

**0. Su negocio y su marca.** Los textos y los colores son los de la persona, nunca los del ejemplo.
- **Negocio y voz:** `~/Documents/mi-contenido/mi-negocio.md` (rubro, clienta, oferta) y `~/Documents/mi-contenido/mi-voz.md`
  (cómo habla). De ahí salen el dolor del «antes» y la respuesta del «después». Si no existen, pregúntale rubro, clienta
  y qué le resuelve, en un solo mensaje.
- **Marca**, en este orden: `~/Documents/mi-contenido/mi-marca.md` → su manual de identidad visual `mi-marca/marca.md` →
  si no hay ninguno, copia `references/marca.md` a `~/Documents/mi-contenido/mi-marca.md`, pregunta lo que falte en un
  solo mensaje y déjaselo escrito.
- **Su marca manda sobre el estilo:** los colores y la letra de `config.js` y de `posts.html` son de muestra; van con los suyos.

**1. Copia la plantilla.**

```bash
mkdir -p "$SALIDA" && cp -R "$SKILL/plantilla/." "$SALIDA/"
```

**2. Pon el clip.** Déjalo vertical, a 30 cuadros por segundo y en un formato que no dé problemas:

```bash
ffmpeg -i "tu-toma.mov" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac "$SALIDA/assets/clip.mp4"
```

**3. Encuentra el segundo del manotazo.**

```bash
node "$SKILL/scripts/detectar-manotazo.mjs" "$SALIDA/assets/clip.mp4" --salida "$SALIDA/revision"
```

Imprime el segundo, los otros candidatos y las dos líneas para `config.js`. Deja `revision/manotazo-cuadros.jpg` con tres cuadros: el anterior, el del manotazo y el siguiente. **Míralo con Read.** El cuadro del centro debe ser el momento en que la mano entra o tapa el cuadro (o el primer cuadro de la segunda toma). Si eligió otro movimiento, acota la búsqueda con `--desde 2.5 --hasta 4.5` o usa uno de los otros candidatos. El script no busca en el primer segundo ni en el último medio segundo.

**4. Pon las imágenes.** La imagen «antes» y las del «después» van en `assets/`. Si pesan mucho, redúcelas (`node "$SKILL/scripts/sistema.mjs" achicar imagen.png assets/despues-1.jpg 1000`). Borra de `assets/` las de ejemplo que no uses.

**5. Llena `config.js`.** Como mínimo: `clip: "assets/clip.mp4"`, `manotazo`, `duracion`, los dos textos y las rutas de las imágenes. `index.html` no se toca.

**6. Valida y mira.**

```bash
cd "$SALIDA" && hyperframes lint
hyperframes snapshot --at 1,<manotazo − 0.034>,<manotazo>,<manotazo + 0.1>,<duracion − 0.5> --no-end --describe false
```

Lint debe dar 0 errores (los avisos `nested_structure_needs_subcomposition` se aceptan). Mira `snapshots/contact-sheet.jpg` con Read: en el cuadro anterior al manotazo todavía está el problema, en el cuadro del manotazo ya está la cuadrícula, los textos se leen enteros y nada tapa tu cara de más.

**7. Renderiza y revisa el MP4.**

```bash
hyperframes render --output reel-manotazo.mp4
node "$SKILL/scripts/hoja-de-contacto.mjs" reel-manotazo.mp4     # en Mac también: bash "$SKILL/scripts/hoja-de-contacto.sh" reel-manotazo.mp4
ffprobe -v error -show_entries stream=codec_type,duration -of compact reel-manotazo.mp4
```

Mira la hoja (4 cuadros por segundo) con Read: el cambio cae en el manotazo y la cuadrícula no se sale del cuadro. `ffprobe` debe listar una pista `audio` además de la de `video`.

## Música, marca y serie

Detalle común a todas las skills de animación: `references/ritmo-y-serie.md`. Lo propio de este reel:

- **Música: el golpe fuerte va en el manotazo.** Aquí el momento grande ya está grabado, así que no se mueve la
  animación: se mueve el arranque de la pista. Con el MP4 ya renderizado:
  ```bash
  node "$SKILL/scripts/golpes.mjs" analizar "$SALIDA/assets/pista.mp3" --salida "$SALIDA/golpes.json"
  node "$SKILL/scripts/golpes.mjs" alinear "$SALIDA/golpes.json" <manotazo − clipInicio>     # imprime musica.inicio
  node "$SKILL/scripts/golpes.mjs" mezclar reel-manotazo.mp4 "$SALIDA/assets/pista.mp3" reel-con-musica.mp4 --inicio <ese número> --volumen 0.8
  ```
  Si el clip lleva tu voz y quieres conservarla, agrega `--con-voz` y baja `--volumen` a 0.25; si no, pon
  `conservarAudio: false` antes de renderizar. La pista la trae la persona (propia o libre de derechos). Si va a usar
  un audio de Instagram, no mezcles nada: dile en qué segundo cae el manotazo (`manotazo − clipInicio`) para que
  alinee ahí el golpe fuerte al publicar. La plantilla no lee `musica` de `config.js`: son esos tres comandos.
- **Marca.** De su `mi-marca.md` o de su manual (ver el paso 0). Color y Letra → `estilo` · Movimiento → `golpe` (`escala`, `sacudida`, `cuadros`: con rebote o
  corte seco) y cuánto se sostiene cada mitad (`manotazo` y `duracion`). No hay entradas con dirección ni desenfoque.
- **Serie.** Para varios reels del mismo formato, escribe antes `BIBLIA.md` (letra y color de los textos, forma de
  la tarjeta y de la cuadrícula, golpe, música y momentos obligados: mismo encuadre, manotazo en el mismo segundo,
  misma firma) y declara qué se toma de cada referencia. Revisa cada reel contra esa lista mirando sus cuadros.
- **Efectos de otras librerías:** `references/efectos-open-source.md`. `node "$SKILL/scripts/probar-golpes.mjs"` prueba el detector.

## Campos de `config.js`

| Campo | Qué hace |
|---|---|
| `clip` | Ruta del clip (`"assets/clip.mp4"`). `null` = fondo sustituto, solo para probar textos e imágenes sin haber grabado |
| `clipInicio` | Segundo del clip donde empieza el reel. Sirve para recortar el arranque |
| `duracion` | Segundos del reel. Con clip, no más que la duración del clip menos `clipInicio` |
| `manotazo` | Segundo del manotazo **medido en el clip** (lo que imprime el detector). Se ajusta solo al cuadro más cercano |
| `conservarAudio`, `volumen` | El audio original del clip se conserva por defecto. `volumen` va de 0 a 1 |
| `fondoSustituto` | Solo sin clip: `foto`, `fotoDespues` (opcional), `mancha` (color de la «mano»), `color` |
| `antes.quien`, `antes.texto` | Quién habla y qué dice. `quien` puede ir vacío |
| `antes.imagen` | La imagen única. `null` = solo texto |
| `antes.y`, `antes.ancho`, `antes.aspecto`, `antes.ajuste`, `antes.relleno` | Altura del texto, tamaño y forma de la tarjeta, `contain` o `cover` |
| `despues.quien`, `despues.texto` | Tu respuesta |
| `despues.imagenes` | De 1 a 9 rutas. 1 = una grande, 2 a 4 = dos columnas, 5 a 9 = tres columnas |
| `despues.y`, `despues.ancho`, `despues.columnas` | Altura del texto, ancho de la cuadrícula, columnas forzadas |
| `despues.limiteInferior` | La cuadrícula nunca baja de ahí: si no cabe, se encoge sola |
| `estilo.fuente`, `peso`, `tamano`, `espaciado`, `color`, `sombra` | Tipografía de los textos. Solo fuentes del sistema |
| `estilo.fuenteQuien`, `estiloQuien`, `etiquetaFondo`, `etiquetaColor` | Para destacar «Clienta:» y «Yo:» con otra fuente o con una etiqueta de color |
| `estilo.tarjetaFondo`, `tarjetaBorde`, `tarjetaRadio`, `tarjetaGiro`, `cinta` | Aspecto de la tarjeta «antes» |
| `estilo.separacion`, `celdaAspecto`, `celdaAjuste`, `celdaRadio` | Aspecto de la cuadrícula. `celdaAspecto`: `"1/1"`, `"4/5"`, `"9/16"` |
| `golpe.escala`, `golpe.sacudida`, `golpe.cuadros` | El golpe de entrada. `escala: 1` y `sacudida: 0` = corte seco |
| `firma`, `firmaY` | Texto pequeño opcional (tu usuario). `null` = sin firma |

## Si no tienes las imágenes «después»

El reel solo funciona si el resultado se ve real **y sale de la imagen «antes»**. Si el texto promete «una foto», ve directo a «Nueve posts con una sola foto»; las piezas de otros temas no sirven. Si la promesa es otra (un borrador que se vuelve pieza terminada, un producto y su catálogo), por orden de preferencia:

1. **Piezas tuyas ya publicadas o fabricadas, hechas a partir de esa misma imagen:** portadas de tus carruseles, publicaciones, fotos de producto. Si tienes skills de carrusel, fabrica las piezas con ellas y usa la primera lámina de cada una.
2. **Generadas con Higgsfield** a partir de tu imagen «antes»: sube la foto y pide variaciones con `mcp__claude_ai_Higgsfield__generate_image` (herramienta diferida: cárgala con ToolSearch). Revisa `balance` antes y di cuántos créditos gastaste. Pide el mismo formato que `celdaAspecto`.
3. **Diseñadas a mano** con la misma foto: fondo de color, la foto recortada y un título. Así se hizo el ejemplo de la florería: 5 de las 9 piezas son la misma foto del ramo sobre distintos fondos.

No rellenes la cuadrícula con la misma imagen nueve veces sin cambiarla: se nota y mata el efecto. La misma foto con nueve tratamientos distintos sí funciona, y es justo lo que el reel promete.

## Nueve posts con una sola foto

`posts-de-una-foto/` fabrica las nueve piezas a partir de la imagen «antes»: foto a sangre con título, recorte sobre color, tarjeta tipo publicación con la cara de avatar, polaroid, blanco y negro con frase, mitad foto y mitad lista, recorte repetido, primer plano con pregunta y tira rasgada.

```bash
TRABAJO="$SALIDA/posts-de-una-foto" && mkdir -p "$TRABAJO" && cp "$SKILL/posts-de-una-foto/posts.html" "$TRABAJO/"
cp "$SALIDA/assets/antes.jpg" "$TRABAJO/foto.jpg"
# la misma foto sin fondo (Mac y Windows; usa los ayudantes de animacion-dibujada-f100k, que viene en el mismo plugin). Si no sale bien: quítale el fondo con Higgsfield (remove_background) o a mano
node "$SKILL/scripts/sistema.mjs" recortar "$TRABAJO/foto.jpg" "$TRABAJO/recorte.png"
```

1. **Mira `recorte.png` con Read** antes de seguir: la persona o el producto completo, sin pedazos de fondo.
2. **Edita el bloque `AJUSTES` de `posts.html`** y nada más: `foco` (dónde está la cara o el producto, en fracción del ancho y del alto), `colores` (los de la marca de quien publica), `nombre` y los nueve `titulos`. Los títulos son posts creíbles de esa persona, de su rubro, sin cifras ni resultados inventados; `*así*` va en itálica.
3. **Captura:** `node "$SKILL/posts-de-una-foto/capturar.mjs" "$TRABAJO" "$SALIDA/assets"` (en Mac también sirve `bash "$SKILL/posts-de-una-foto/capturar.sh"` con los mismos argumentos). Deja `despues-1.jpg` … `despues-9.jpg` y una hoja para revisar.
4. **Mira `hoja-posts.jpg` con Read**, post por post. Qué revisar: ningún recorte corta el cuerpo en un punto raro ni deja en primer plano algo que no es el tema (pasó con un zoom a un vaso que encuadraba el escote); la cara o el producto se reconoce en los nueve; ningún título tapa la cara. Si un post queda mal, mueve `foco` o cambia los números `data-f="ancho,x,y"` de esa lámina y vuelve a capturar.

Los títulos de la plantilla son de muestra: di cuáles pusiste y que se pueden cambiar.

## Errores conocidos

- **La cuadrícula no cumple el texto.** El texto dice «una foto» y las piezas son de otros temas. Rehaz las piezas con «Nueve posts con una sola foto». Antes de renderizar, lee el texto «antes» y mira la cuadrícula: ¿se ve que salió de esa imagen?
- **El detector elige otro momento.** Pasa si te moviste fuerte en otro punto del clip, o si el manotazo fue lento. Usa `--desde` y `--hasta`, mira los otros candidatos o pon `manotazo` a mano. Para afinar: sumar o restar `0.033` mueve el cambio un cuadro.
- **El detector solo se probó con un clip real y con el fondo sustituto.** Con tomas con mucho movimiento de cámara, confirma siempre a ojo con la hoja de tres cuadros.
- **Video en negro o que no avanza.** El clip no está en la ruta de `clip`, o viene en un formato raro del celular. Pásalo por el comando del paso 2.
- **Sin audio en el resultado.** Tu clip no traía audio (el detector lo avisa) o `conservarAudio` está en `false`.
- **El final se queda congelado o en negro.** `duracion` es mayor que lo que queda de clip. Bájala a lo que imprime el detector.
- **Texto largo que tapa la cara o empuja la tarjeta.** El texto parte en líneas solo y la tarjeta baja con él. Acorta el texto o sube `antes.y`. Mira un snapshot tras cada cambio de texto.
- **El texto no se lee sobre la toma.** Deja `sombra: true`, usa `peso` 800 o 900, o pon `etiquetaFondo`. Fondos con mucho detalle detrás del texto empeoran la lectura: graba con fondo simple.
- **Sale Times en vez de tu fuente.** Solo se pueden usar fuentes del sistema; las externas se caen al renderizar.
- **La raíz de `index.html` no trae `data-duration`.** Es a propósito: lo pone el script desde `duracion`. Si lo escribes a mano, el render usa ese número y deja de hacer caso a `config.js`.
- **Zonas de Instagram.** Por debajo de 1560 px van los botones y el texto del reel; por encima de 250 px, la barra superior. La plantilla ya respeta el límite de abajo.

## Skills hermanas

`animacion-recortes-papel-f100k` (animación narrada con mascotas pixel) y `animacion-dibujada-f100k` (clips y cortos dibujados cuadro a cuadro).
