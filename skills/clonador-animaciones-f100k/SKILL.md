---
name: clonador-animaciones-f100k
description: Clona la MECÁNICA de un reel animado que te gustó y la recrea en código con tu tema, tu marca y tus personajes. Le pasas el enlace o el archivo de la referencia y tu tema - la descarga, la mira cuadro a cuadro, llena una ficha de mecánica (qué frena el dedo, ritmo, tipo de movimiento, cómo trata el texto), decide si ya existe un estilo hecho para eso o si se dibuja desde la pieza base, escribe tu guion de una frase por escena, dibuja cada escena en canvas, le pone tu voz y entrega el MP4 vertical. Usar cuando digan «clona esta animación», «recrea este reel animado», «hazme una animación como esta», «ponle mi tema a esta animación», «copia el estilo de esta animación», «quiero un video animado como este» o pasen el enlace de un reel animado con su tema. NO usar para editar un video grabado (editor-video-formula100k), para solo analizar una referencia (analisis-video-viral-f100k) ni para clonar carruseles (clonador-carrusel-formula100k).
argument-hint: [enlace o archivo de la referencia] [tu tema]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Clonador de animaciones

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Ves un reel animado que te frena el dedo y quieres uno así, pero con tu tema. Esta skill **mira la referencia de
verdad, saca su mecánica y la vuelve a dibujar en código** con lo tuyo. Sin IA de video y sin créditos: cada cuadro es
una función de su número y tu computadora lo convierte en MP4. Muestra de la pieza base: `ejemplo/muestra.mp4`.

Necesita Node 18 o más nuevo, ffmpeg, Google Chrome y la skill hermana `animacion-dibujada-f100k` (trae el núcleo y
el render; los scripts la buscan junto a esta skill y, si no, en `~/.claude/skills/`). Para bajar la referencia,
`yt-dlp`; para transcribirla, `uv` (opcionales). Todo corre igual en Mac y en Windows.

```bash
SKILL=<carpeta de esta skill>
DEST=<carpeta de salida>/<nombre-de-la-pieza>      # nunca dentro de la skill
mkdir -p "$DEST/fuente" "$DEST/referencia"
```

## 1. Mira la referencia de verdad

```bash
node "$SKILL/scripts/mirar.mjs" "<enlace o archivo>" "$DEST/referencia"
```

Deja `referencia.mp4`, `datos.txt`, `hoja-completa.jpg` (un cuadro cada 2 s), `hoja-apertura.jpg` (los primeros 3 s
cuadro a cuadro) y, si la referencia habla, `transcripcion.txt`.

- **Abre las dos hojas y míralas.** No se analiza lo que no se vio: el caption no cuenta cómo está hecho el video.
- Si no descarga, pide el archivo (que lo guarde desde la app) y corre lo mismo con el archivo.
- Si un tramo no se entiende en la hoja, saca ese cuadro grande: `ffmpeg -ss 12.5 -i referencia.mp4 -frames:v 1 cuadro.jpg`.
- Si la persona escribió una nota junto al enlace, **esa nota es el tema de la pieza**. No le cambies el ángulo.

## 2. Llena la ficha de mecánica

Copia `references/ficha-de-mecanica.md` a `$DEST/FICHA.md` y llénala mirando las hojas. Lo que no puede faltar:

- **Qué frena el dedo en el primer cuadro y de qué TIPO es esa imagen** (un collage de recortes, una foto, un objeto
  llamativo, un dibujo de línea, un personaje, una pantalla). Es lo más importante de toda la ficha.
- Estructura por tramos con sus segundos, ritmo (cada cuánto cambia algo), tipo de movimiento, cómo trata el texto y
  el gancho, personajes, audio y cierre.

Enséñale la ficha en cuatro o cinco renglones antes de seguir: confirma que eso es lo que le gustó.

## 3. Qué se copia y qué no

| Se copia (la mecánica) | Nunca se copia |
|---|---|
| El ritmo y la estructura por tramos | Su paleta y su tipo de letra |
| El tipo de movimiento (a saltos, suave, temblor, trazo) | Sus personajes, su logo, su marca de agua |
| El tipo de imagen de apertura | Sus textos, sus imágenes, sus capturas |
| Cómo trata el texto y dónde lo pone | Sus cifras (salvo que sean un dato público con fuente) |

La pieza sale con la paleta, la letra y los personajes de quien la pide. En el caption va el crédito a la cuenta de
la referencia por la idea original.

## 4. Elige el camino

Si la referencia calza con un estilo que ya tiene skill, **úsala**: está más probada que dibujar desde cero.

| Si la referencia es… | Usa |
|---|---|
| Un mundo de papel con personajes y voz que explica una idea | `animacion-recortes-papel-f100k` |
| Una sala en 3D con personajes de cubo que opinan, debaten o votan | `animacion-cubitos-3d-f100k` |
| Una «receta» de tres pasos con estética de videojuego viejo | `animacion-juego-de-cocina-f100k` |
| Objetos flotando y un titular palabra por palabra, tipo revista | `animacion-collage-editorial-f100k` |
| Escenarios de papel y una persona recortada que cambia de pose | `animacion-collage-stopmotion-f100k` |
| Una reflexión en voz en off con fotos, clips y texto al ritmo de la voz | `collage-reflexion-f100k` |
| Una lista por categorías que se va llenando, sin cara | `reel-lista-que-suena-f100k` |
| Persona a cámara, un golpe y cambia al resultado | `reel-manotazo-f100k` |
| Un inserto dibujado de pocos segundos (libreta, pizarra, chat, mapa) | `animacion-dibujada-f100k` |
| Un elemento suelto encima de un video, para montar en CapCut | `animaciones-para-tu-video-f100k` |
| Persona abajo en una tarjeta y un panel animado arriba que dibuja lo que dice | `reel-explicacion-en-vivo-f100k` |
| Persona a cámara con una lista numerada al costado | `lista-sobre-video-hablado-f100k` |

Si alguna no está instalada, dilo y sigue por la pieza base. Todo lo demás (explicativos de una escena por frase,
dibujo de línea, monigotes, comparaciones, aperturas de collage, pantallas que se arman) **se dibuja sobre
`plantilla/base.src.html`**. Qué ayuda de la plantilla hace cada técnica: `references/tecnicas.md`.

## 5. Escribe el guion propio

- **Una frase = una escena.** De 6 a 18 frases de 2 a 6 s; cada una se puede decir de un tirón y nombra algo que se
  puede VER. Si no sabes qué mostrar en una frase, la frase sobra.
- Es el tema de la persona con la estructura de la referencia (gancho → desarrollo → remate → cierre), no una traducción.
- **Cifras:** solo las de ella, reales. Si falta un dato, pregúntalo o quítalo. Nada de resultados inventados.
- **Si lo que hizo viral a la referencia es su gancho, se conserva** aunque dependa de una fecha: avisa hasta cuándo sirve publicarla.
- **Cierre:** «Comenta PALABRA» hacia un regalo que ya tenga. La palabra va ligada al tema y solo se usa si la
  automatización que lo entrega ya existe; si no está confirmada, dilo.
- Enseña el guion con una tabla (frase · qué se ve) y espera el visto bueno antes de dibujar.

## 6. Dibuja, revisa, voz y render

```bash
cp "$SKILL/plantilla/base.src.html" "$DEST/fuente/pieza.src.html"
```

1. **Cambia el bloque «LO QUE PUEDES CAMBIAR»**: `LINEAS`, `PALABRA_CTA`, `GANCHO`, `MENSAJE`, los colores de `C`
   (un solo acento), `VECES`/`PIXELES`, `NEON`, `CLARAS`, `CONTINUA`, `RECORTES`.
2. **Reescribe `ESC[i]`**, una función por frase: `(u, d, t)` = segundos desde que arranca la escena, su duración y el
   tiempo global. Borra las piezas del ejemplo (la florería) y dibuja las del tema con la caja de herramientas.
3. **Mide el ritmo** con voz de prueba si aún no hay voz: `node "$SKILL/scripts/sistema.mjs" voz "frase" voz-prueba/01.wav --ritmo 185`
   por frase (usa la voz de la computadora, en Mac y en Windows). Sirve solo para medir, no para entregar. Si la
   computadora no tiene voz en español, el comando lo dice: pídele a la persona que grabe su voz.
4. **Arma y mira:**
   ```bash
   node "$SKILL/scripts/armar.mjs" "$DEST/fuente/pieza.src.html"     # imprime el comando de la hoja de contacto
   ```
   Saca la hoja (`renderizar.mjs pieza.html hoja.jpg --hoja 2`) y **ábrela junto a `referencia/hoja-completa.jpg`**.
   Se tiene que reconocer la misma mecánica y no parecer el mismo video. Revisa: primer cuadro con contenido, textos
   completos, nada tapado, cada personaje se entiende sin leer.
5. **La voz.** La grabada por la persona es la versión final: un audio por frase (`voz/01.m4a`, `02.m4a`…) leyendo el
   guion tal cual. Una voz clonada es opcional (una frase por pedido; escribe en minúscula las palabras que irían en
   MAYÚSCULAS, porque las deletrea). Sin voz: ajusta los `d` a mano y salta al render.
   ```bash
   node "$SKILL/scripts/voz.mjs" "$DEST/fuente/pieza.src.html" "$DEST/voz" "$DEST/<nombre>.mp4"
   ```
   Recorta silencios, mide cada frase, escribe su duración en `LINEAS`, renderiza y pega cada audio al inicio de su escena.
   Sin voz: `node <animacion-dibujada-f100k>/scripts/renderizar.mjs pieza.html "$DEST/<nombre>.mp4"`.
6. **Comprueba lo que dice:** transcribe el MP4 final y compáralo con el guion. Si una frase salió mal, regenera solo
   esa y repite el paso 5.
7. **Entrega** en `$DEST`: el MP4, la versión sin subtítulos (abre la pieza con `?sinsubs` o pon `SUBTITULOS = false`),
   `fuente/`, `voz/`, `referencia/` y un `LEEME.md` con el guion, la ficha y lo pendiente.

## 7. Reglas de la casa

- **Cada animación cuenta lo que se dice.** Una acción por frase, y es la que la frase nombra.
- **Lo que el texto promete, la imagen lo cumple literal.** Si dice «en un minuto», el reloj marca el tiempo real.
- **Los personajes simbolizan lo que representan.** Una forma de color con cara no comunica: que sea o lleve el objeto de su papel.
- **Sin manos ni anatomía dibujada.** Salen deformes; el render se detiene si las encuentra. Personajes pixel o
  pictogramas, declarados con `// ANATOMIA: estilizada — …`.
- **El gancho depende de qué frena el dedo:**
  - Si es el dibujo (línea, monigotes): gancho de texto chico y discreto (`ganchoChico`, unos 46 px al 70 %) y halo de luz (`NEON`). Manda la animación.
  - Si la referencia abre con una imagen disruptiva (collage, foto, objeto): haz una **del mismo tipo**, propia, con
    gancho grande en tiras (`tira`, de 60 a 90 px). Un personaje simpático no reemplaza esa imagen.
- **Zona segura:** nada importante por encima de y 250 ni por debajo de y 1470.
- **El primer cuadro ya tiene contenido:** es la portada. La escena 0 no entra con fundido.
- Escenas que comparten el mismo objeto no llevan fundido entre ellas (`CONTINUA`).
- **Función pura del tiempo:** nada de `Math.random` ni `Date`; usa `hash2` o `rng` del núcleo.
- Fuentes del sistema solamente.

## 8. Límites honestos (dilos al entregar)

- No escuchaste el audio: lo sincronizaste por tiempos y lo comprobaste por transcripción. Que lo oiga antes de publicar.
- No trae música ni efectos de sonido: se eligen al subirlo.
- Una voz clonada lee frase por frase; la entonación no se encadena como en una grabación corrida.
- Si la referencia estaba en otro idioma, el español ocupa más: la pieza sale más larga.
- Es una recreación de una idea ajena: el crédito a la cuenta original va en el caption.
- Si el cierre depende de una automatización, que la pruebe antes de publicar.
- Lo que no pudiste copiar de la mecánica (3D real, video filmado, seguimiento de una mano), dilo: no lo disimules.

## Si algo falla

- **«No encontré la skill animacion-dibujada-f100k»:** instálala junto a esta; viene en el mismo paquete.
- **«La pieza tiene N frases y la carpeta M audios»:** un audio por frase, con el número al principio del nombre.
- **El render se detiene por anatomía:** quita manos, brazos o caras realistas del código, o declara el personaje estilizado.
- **Sale un cuadro sin recortes:** los PNG van en `recortes/` junto a `pieza.src.html` y sus nombres en `RECORTES`.
- **El subtítulo tapa el dibujo:** sube el dibujo; el subtítulo vive en y ≈ 1410.
