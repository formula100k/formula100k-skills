# Sin grabar · estilo «Explicador con avatar»

Un reel 9:16 de 20 a 60 s donde **tu avatar en línea (blanco y negro) explica** un tema: arriba la frase que se enciende palabra por palabra, al centro tarjetas con **capturas reales** de las fuentes, cifras grandes, código o chats, y abajo el avatar que cambia entre 3 gestos (neutral, hablando, pensando). Fondo liso que alterna claro y oscuro. Todo entra con **corte seco**: nada rebota ni tiembla.
Todo sale de un archivo, `reel.json`. Se monta con HyperFrames (HTML + GSAP) y se renderiza gratis en tu compu.

## Qué hay aquí
- `armar.mjs` · lee `reel.json` y escribe `index.html` (el proyecto de HyperFrames).
- `preparar-voz.mjs` · recorta el silencio de cada frase y mide cuándo cae cada palabra (`tiempos.json`).
- `capturar.mjs` · saca capturas reales de una página o de un párrafo, con el dato resaltado en amarillo.
- `plantilla.css` y `fonts/` · estilos y letras libres (Inter, Fraunces itálica, Anton).
- `reel.ejemplo.json` · ejemplo completo: «Cómo Netflix elige la portada que ves» (7 escenas, 27 s).

## Instala (una vez)
`node K/scripts/instalar.mjs` (Node, ffmpeg, uv, Chrome) y además HyperFrames para el montaje y el render: `npm install -g hyperframes`.
La transcripción es la misma de Auto-Edición (gratis y en tu compu): no hace falta instalar otro Whisper.

## El avatar de línea (una vez, desde 1 foto)
Modelo de Higgsfield `gpt_image_2_5`, calidad alta, fondo transparente, 1:1. Es opcional (cuesta **unos 1,5 créditos por imagen**: los 3 gestos salen en **unos 5 créditos**; mira el precio antes con `get_cost: true` y di el total antes de generar). Sin avatar, pon `"avatar": "no"` en cada escena: el reel sale igual, solo con tarjetas.
1. **Base (neutral)**, con la foto de la persona de frente como referencia:
   > Convierte a la persona de la foto en un retrato de busto, de frente, en ilustración de tinta en blanco y negro: trazo negro limpio, rellenos blancos, sombras con achurado de líneas, sin grises ni color. Conserva su peinado, sus lentes, lunares y rasgos. Expresión tranquila, boca cerrada. Encuadre desde la mitad del pecho hasta arriba de la cabeza, centrado, con aire a los lados. Fondo transparente.
2. **Hablando**, con la base como referencia (no la foto): así calzan uno sobre otro.
   > La misma ilustración, idéntico encuadre, tamaño y posición de la cabeza y los hombros. Solo cambia la boca: abierta, hablando, con una sonrisa.
3. **Pensando**, con la base como referencia:
   > La misma ilustración, idéntico encuadre, tamaño y posición de la cabeza y los hombros. Mira hacia arriba a un lado y apoya una mano en el mentón, pensando.
4. Recorta los tres con **el mismo** recorte para que no salten al cambiar de gesto, por ejemplo
   `ffmpeg -i base.png -vf crop=740:940:142:84 neutral.png` (igual para `hablando.png` y `pensando.png`).
   Ponlos en `<reel>/assets/avatar/`. Míralos encimados: si un gesto se corre, rehazlo con la base como referencia.

## Un reel nuevo
`K` = la carpeta de la skill auto-edicion · `E` = `K/plantilla/sin-grabar/explicador` · `R` = `~/Documents/mis-videos-editados/<nombre>/`.
Crea `R/assets/img`, `R/assets/avatar` y `R/voces`, y copia `E/reel.ejemplo.json` como `R/reel.json` (es el molde: cambia todo su texto y sus imágenes por las de tu tema).
```
node E/capturar.mjs <url-de-la-fuente> "R/assets/img/cabecera.png"                # captura real
node E/capturar.mjs <url> "R/assets/img/dato.png" p "texto del dato" 540           # párrafo con el dato en amarillo
# voz: una frase por archivo (R/voces/01.m4a, 02.m4a…), cifras en letras; luego
node E/preparar-voz.mjs "R/voces" "R"                                               # imprime lo que oyó: compáralo con el guion
node E/armar.mjs "R"
# dentro de la carpeta R:
hyperframes lint
hyperframes snapshot --at 0.5,5,10,15,20 --no-end
hyperframes render -f 30 -o reel.mp4
node K/scripts/cuadros.mjs "R/reel.mp4" "R/hoja.jpg" 0.5 3 6 9 12 15 18 21 24 27   # mira la hoja y corrige
```
Las imágenes que nombra `reel.ejemplo.json` (portadas, capturas de la fuente) no vienen en el paquete: son las del tema del ejemplo. Pon las de tu tema con el mismo nombre o cambia `src`.

## Cada escena del `reel.json`
```json
{ "tema": "claro | oscuro", "gesto": "hablando | pensando", "avatar": "izq | centro | der | no",
  "texto": "trozo uno | con *negrita* | y [caja].", "tarjetas": [ … ] }
```
- `texto`: `|` parte la frase en trozos, `*así*` negrita, `[así]` caja del color de acento. Mismas palabras que la voz (las cifras pueden ir en número: «1,8», «82%»).
- **Gancho golpe** (escena 1): agrega `"gancho": { "chica": "tu portada", "enorme": "NO ES LA MÍA", "color": "rojo | verde | amarillo | #hex" }`. Reemplaza la frase: una línea chica y una ENORME en Anton, quietas desde el cuadro 0. De 2 a 5 palabras, que se lean como una sola frase, y la voz arranca diciendo lo mismo.
- `marca`: `acento` (color de las cajas) y `acentoTinta` (letra dentro de la caja).

## Cada tarjeta
Todas llevan `tipo`, `pos` y `en`. Opcionales: `rot` (grados, quieta), `sale`, `plano` (sin marco).
- `pos`: `centro`, `izq`, `der`, `t1`, `t2`, `t3`, `arriba`, `abajo` o `{ "x", "y", "w", "h" }`. Zona útil: x 70–1010, y 480–1180 (abajo va el avatar).
- `en`: segundo dentro de la escena o la palabra que la dispara (`"@palabra"`, `"@palabra+0.2"`).

| tipo | para qué | campos |
|---|---|---|
| `imagen` | captura o foto real | `src`, `etiqueta`, `ajuste` (`cover`/`contain`) |
| `cifra` | número grande con su fuente | `valor`, `unidad`, `nota`, `color`, `notaEn` |
| `video` | un clip en movimiento (mudo) | `src`, `desde`, `largo`, `etiqueta`, `recorteY` |
| `codigo` | código renglón por renglón | `titulo`, `lineas[]`, `cada`, `resalta`, `resaltaEn`, `sello` |
| `chat` | conversación | `titulo`, `mensajes[{ de: "yo" o "claude", texto, en }]` |
| `chips` | píldoras | `items[{ texto, en, estado: "tachado" / "ok" / "acento" }]` |
| `lista` | filas con nota | `filas[{ texto, nota, en, notaEn, estado }]` |
| `tira`, `navegador`, `onda`, `hoja`, `reproductor`, `comentario` | cuadros de un video, captura de navegador, onda de voz, hoja de guion, barra que se vacía, caja de comentario del CTA | ver los comentarios en `armar.mjs` |

## Reglas que la plantilla ya cumple y las que pones tú
- Corte seco en todo (palabras, tarjetas, cambios de lugar del avatar); el avatar solo cambia de gesto.
- El primer cuadro ya tiene contenido: sirve de portada.
- **Tú pones**: capturas reales de lo que se nombra (nada de íconos inventados), cifras solo con fuente, una tarjeta nueva cada 3–5 s y ningún hueco vacío al centro.
- Lo personal vive solo en `reel.json` y `assets/` del reel: la plantilla no trae el nombre ni la cara de nadie.
