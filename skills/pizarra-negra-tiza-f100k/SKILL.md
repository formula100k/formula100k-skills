---
name: pizarra-negra-tiza-f100k
description: Arma un reel vertical sin cara en estilo PIZARRA NEGRA CON TIZA, hecho con código y sin créditos (sin Blender, sin IA de video). Cuenta una parábola con un monigote de tiza blanca que se dibuja trazo a trazo sobre una pizarra casi negra, con rellenos rayados en tiza de color, polvo que cae de la punta y textura de tiza real. Arriba hay un medidor de MALO a BUENO con una aguja que se mueve con la historia. Abajo, un rótulo de tiza cuenta el hecho. Al final el borrador limpia el rótulo y en su lugar se escribe tu palabra de CTA. Usar cuando digan «pizarra negra», «plantilla Pizarra negra», «parábola con monigotes de tiza», «reel de tiza con medidor de malo a bueno», «historia dibujada en pizarrón», «la del pescador con la aguja». NO usar para el clip de pizarra blanca con anotaciones que acompaña un video tuyo en pantalla dividida (pizarra-explicativa-f100k), para la pizarra 16:9 con capturas para grabar YouTube (pizarra-youtube-f100k), para el cuento a color con mundo ilustrado (cuento-dibujado-f100k) ni para videos donde sales tú a cámara.
argument-hint: [tema de la parábola + el hecho del rótulo + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Pizarra negra con tiza (reel sin cara hecho con código)

Una parábola que se escribe en vivo sobre una pizarra de verdad: moteada, con pasadas viejas de borrador y fantasmas de una clase mal borrada. Primero el suelo, luego el medidor y el personaje, después el objeto del problema y los rellenos de color rayados de ida y vuelta. Al final, el rótulo con el hecho, un círculo rojo donde está el problema y un «?» amarillo. La aguja cae a MALO cuando pasa lo malo y empieza a dudar cuando aparece la pregunta. En el cierre, el borrador de fieltro pasa sobre el rótulo y se escribe «Comenta [PALABRA]». Se renderiza gratis en tu compu en segundos y queda en 1080×1920 a 30 fps.

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`. En este estilo, su color de acento reemplaza la tiza amarilla (`colores.amarillo`: lo bueno, la pregunta y la palabra del CTA). Su letra va en todo lo escrito si es legible como tiza (`fuente`, ruta a su .ttf u .otf). La pizarra casi negra, la tiza blanca y el rojo de «lo malo» se quedan. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **La parábola en 3 tiempos:** qué pasa (lo que parece malo), el hecho en 2 a 5 palabras para el rótulo («SE ROMPIÓ SU RED») y la duda que deja. El tema tiene que ver con tu negocio aunque la historia sea de otro mundo.
2. **Las palabras del medidor:** título («ESTO ES») y los dos extremos («MALO» / «BUENO» o los de tu tema).
3. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO».
4. **Voz (opcional):** tu grabación o una voz clonada. Sin voz, el rótulo cuenta la historia.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: todo `plantilla/` (`build.mjs`, `escena.html`, `config.json`, `package.json`, `motor/` y `fuentes/`). La primera vez corre `npm i` dentro de esa carpeta. Necesitas Node 18 o más, ffmpeg y Google Chrome.
2. **Escribe `config.json`:**
   - `titulo`, `izquierda`, `derecha`: el medidor.
   - `rotulo`: el hecho (se parte solo en 2 renglones y el último se subraya en rojo). `pregunta`: «?» o una palabra corta.
   - `cta` (tu palabra) y `cta_frase` («Comenta»).
   - `fantasmas`: 4 palabras casi invisibles de una clase vieja, del mundo de tu historia.
   - `colores`: pizarra, tiza, rojo (lo malo), amarillo (lo bueno y el CTA) y los rellenos.
   - `duracion_escena` (4 s en el ejemplo; si la alargas, toda la agenda se estira en proporción) y `duracion_cta` (unos 2,8 s).
   - `fuente`: `null` usa Kalam Bold (incluida). Si pones la ruta a tu letra, manda en todo lo escrito.
3. **Adapta el dibujo** en `escena.html`, en el bloque «EL DIBUJO»:
   - **El personaje:** `CABEZA`, `SOMBRERO`, `CARA`, `CUERPO` y `PALOS` (un monigote de palitos). Cambia el sombrero y la ropa por los de tu historia; la cara cambia con el ánimo (boca hacia abajo cuando pasa lo malo).
   - **El objeto del problema:** `BOTE`, `MASTIL`, `RED` y el `HOYO` que se encierra en rojo. Cámbialo por el de tu tema (una tienda, una planta, un teléfono) y pon `HOYO` donde está lo que salió mal.
   - **Los rellenos:** `rayado(polígono, color)` llena una forma con tiza de color de ida y vuelta.
   - Las piezas son `tLinea`, `tCurva`, `tArco`, `tCirculo` (trazos de tiza) y `letras(...)` (texto que se escribe). Si agregas piezas, súmalas a `agendar(...)` y a la lista `TRAZOS`.
   - **La aguja:** `anguloAguja(t)` (arriba → cae a MALO → duda). Si tu historia termina en BUENO, cambia el signo de la última parte.
4. **Revisión rápida:** `node build.mjs --revision` saca `revision.jpg`, un cuadro cada 0,5 s con la hora estampada. Pásale la lista de abajo.
5. **Render:** `node build.mjs` saca `reel.mp4` (nunca pisa uno anterior: sale `reel_v2.mp4`) y `cuadros.jpg`, la hoja de 9 cuadros. Unos 15 s en una Mac M.
6. **Voz y sonido:** si lleva voz, cada trazo clave cae de 2 a 6 cuadros antes de su palabra (mueve la agenda). Sonido de tiza como roce grave, un golpe sordo cuando cae la aguja y un desliz de fieltro con el borrador. Nada agudo (nada por encima de ~3 kHz): ni chirrido de tiza, ni timbres, ni clics.

## Lista de revisión (en `cuadros.jpg` o `revision.jpg`)
1. ¿El primer cuadro ya trae un trazo empezado (nada de pizarra vacía)?
2. ¿Todo se escribe en orden (suelo → medidor → personaje → objeto → rellenos → rótulo → círculo → pregunta) y aparece algo nuevo cada 0,5 a 1 s?
3. ¿La aguja cae a MALO justo cuando el rótulo dice lo malo?
4. ¿Se ve tiza de verdad: grano, polvo alrededor y granitos que caen, y no una línea plana?
5. ¿El rótulo y el CTA se leen de un vistazo y quedan arriba de y ≈ 1650?
6. ¿El CTA es tu palabra, en tiza de color y subrayada en rojo?

Si algo da «no», se corrige y se vuelve a pasar la lista.

## Reglas del estilo
- **Gramática de color de la tiza:** blanco para el dibujo, rojo para lo malo (el círculo y el subrayado), amarillo para lo bueno y la pregunta. Nada más.
- **El medidor es el hilo de la historia:** queda fijo arriba y la aguja se mueve con cada giro. Nunca se queda quieta en el medio.
- **Tiza real:** cada trazo pasa por el grano de la pizarra (la tiza no agarra en los valles), con halo de polvo y granitos que se sueltan de la punta y caen despacio.
- **Cámara viva y suave:** acercamiento lento todo el tiempo, y en el cierre baja al CTA. Nada de sacudidas ni rebotes.
- **El rótulo hace de texto en pantalla:** cuenta el hecho con la palabra clave. Sin subtítulos aparte que tapen el dibujo.
- **El cierre se borra y se escribe:** el borrador de fieltro (sin mano) limpia el rótulo y en su lugar entra el CTA. Lo que queda es una neblina tenue, como en una pizarra de verdad.
- **Monigote de palitos a propósito:** la línea `// ANATOMIA: estilizada` de `escena.html` lo declara. No dibujes manos ni dedos con detalle.
- **Todo sale del número de cuadro:** nada de `Math.random` ni de la hora. Usa `hash2` o `rng(semilla)` del motor.

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/escena.html` | La pizarra, el dibujo, el medidor, la agenda de trazos, el polvo, la cámara, el borrador y el CTA. |
| `plantilla/config.json` | Textos del medidor y del rótulo, palabra de CTA, colores y duraciones (ejemplo con «GUÍA»). |
| `plantilla/build.mjs` | Arma `index.html` (se abre con doble clic para verlo en vivo), renderiza el MP4 y saca la hoja de 9 cuadros. |
| `plantilla/motor/` | El núcleo de dibujo (`nucleo.js`, `cine-dibujo.js`) y el renderizador (`renderizar.mjs`, Chrome sin ventana + ffmpeg). Licencia MIT en `LICENSE-iart-ai.txt`. |
| `plantilla/fuentes/` | Kalam Bold (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit. |

## Errores que ya se vieron en las pruebas (no repetir)
- **Hueco vacío entre el medidor y el personaje:** si tu objeto es chico, súbelo o agrega un detalle del mundo (casa, árbol, nube).
- **El «?» se destapa de izquierda a derecha y en un cuadro se ve suelto el punto:** si usas una palabra en vez de «?», revisa ese cuadro.
- **Un solo plano todo el video:** para más de 8 s, divide la historia en 2 o 3 pizarras con corte seco y deja el medidor en el mismo lugar como hilo.
