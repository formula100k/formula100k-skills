---
name: cuento-dibujado-f100k
description: Arma un reel vertical sin cara en estilo CUENTO DIBUJADO, hecho con código y sin créditos (sin Blender, sin IA de video). Es un libro ilustrado plano que se mueve. El mundo arranca gris, frío y con lluvia, y un solo objeto (la ficha del cuento) tiene color desde el primer cuadro. La ficha se enciende y el color vuelve al mundo en una ola que nace de ella. Brotan flores, salen el sol y los pájaros, y el personaje pasa de la sorpresa a la alegría. Lleva subtítulo a mano y cierra con tu palabra de CTA escrita a mano en el color de la ficha. Usar cuando digan «cuento dibujado», «plantilla Cuento dibujado», «hazme un cuento infantil animado», «un mundo gris al que le vuelve el color», «reel tipo libro ilustrado», «cuento tierno sin grabar». NO usar para el corto narrado con títeres y escenas de rubro (corto-animado-narrado-f100k), para clips sueltos de pizarra, libreta o chat que van dentro de un reel (animacion-dibujada-f100k), para la parábola con monigotes de tiza y medidor (pizarra-negra-tiza-f100k) ni para videos donde sales tú a cámara.
argument-hint: [tema o 2 a 4 frases del cuento + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Cuento dibujado (reel sin cara hecho con código)

Un cuento ilustrado y tierno donde cada cuadro se dibuja con código en el navegador: formas redondeadas sin contorno, degradados suaves, una sola luz, viñeta y grano de papel. Arranca en una ciudad gris bajo la lluvia. El personaje llega con su ficha, el único objeto con color. La ficha se enciende, el color vuelve al mundo en una ola que nace de ella y todo lo que la ola toca brota. Cierra con «Comenta [PALABRA]» escrito a mano. Se renderiza gratis en tu compu en segundos y queda en 1080×1920 a 30 fps.

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`. En este estilo, su color de acento reemplaza el de la ficha (`colores.farol` en `config.json`), que también es el color de la palabra del CTA. Su letra va en el subtítulo y en el CTA (`fuente`, ruta a su .ttf u .otf). Sus colores pueden vestir el mundo a color (`fachadas`, `flores`, `concha`). El arco gris → color, la luz única, la viñeta y el grano se quedan. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **El tema y de 2 a 4 frases cortas del cuento**, con las palabras exactas que se dicen o que van en pantalla. El cuento tiene 3 tiempos: planteo (el mundo gris), giro (la ficha se enciende) y pago (vuelve el color). Ejemplo: «Un farol chiquito…» / «…le devolvió el color.».
2. **La ficha:** el objeto chico que tiene color desde el inicio y cambia el mundo (un farol, una semilla, una llave, una taza). Tiene que ver con tu tema.
3. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO».
4. **Voz (opcional):** tu grabación o una voz clonada. Sin voz, el cuento se lee con el subtítulo.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: todo `plantilla/` (`build.mjs`, `escena.html`, `config.json`, `package.json`, `motor/` y `fuentes/`). La primera vez corre `npm i` dentro de esa carpeta. Necesitas Node 18 o más, ffmpeg y Google Chrome.
2. **Escribe `config.json`:**
   - `frases`: las frases del cuento. Se reparten solas a lo largo del cuento según su largo.
   - `cta` (tu palabra), `cta_frase` («Comenta») y `cta_bajada` (opcional, una línea chica debajo, por ejemplo «y te mando la guía»).
   - `colores`: el mundo a color. `farol` es el color de la ficha y del CTA.
   - `duracion_historia` (5 s en el ejemplo; para más tiempo los golpes se estiran en proporción) y `duracion_cta` (unos 2,8 s).
   - `fuente`: `null` usa Patrick Hand (incluida). Si pones la ruta a tu letra, manda en el subtítulo y el CTA.
3. **Adapta el cuento** en `escena.html`:
   - **El mundo:** las funciones `cielo`, `horizonte`, `edificio`, `farola`, `suelo`, `grieta` y `brote`. Cambia la ciudad por el mundo de tu tema (bosque, cocina, oficina, mar) con las mismas piezas: `rr` (rectángulo redondeado), `elipse`, `brillo` y degradados. Todo se dibuja SIEMPRE en color: el gris sale solo con el filtro.
   - **El personaje:** la función `tilo` (un caracol). Cámbialo por una silueta tierna de tu tema: ojos grandes, boca chica, rubor y respiración. El mismo dibujo sirve para el plano amplio y para el corto.
   - **La ficha:** la función `farol` y `farolPos`. Se dibuja ENCIMA del gris, así que tiene color desde el cuadro 0.
   - **Los golpes:** `T` (llega, enciende, ola0, ola1, feliz) y la cámara `CAM` ([segundo, x, y, zoom]). Están pensados para 5 s.
4. **Revisión rápida:** `node build.mjs --revision` saca `revision.jpg`, un cuadro cada 0,5 s con la hora estampada. Pásale la lista de abajo.
5. **Render:** `node build.mjs` saca `reel.mp4` (nunca pisa uno anterior: sale `reel_v2.mp4`) y `cuadros.jpg`, la hoja de 9 cuadros. Unos 10 s en una Mac M.
6. **Voz y sonido:** si lleva voz, ata los golpes a las palabras: cada golpe cae de 2 a 6 cuadros ANTES de su palabra. Música suave (piano grave o cuerdas) y efectos graves: un golpe sordo cuando se enciende la ficha y un swish suave con la ola. Nada agudo (nada por encima de ~3 kHz): ni campanitas, ni celesta, ni timbres, ni clics.

## Lista de revisión (en `cuadros.jpg` o `revision.jpg`)
1. ¿La ficha tiene color desde el primer cuadro y se ve en todos los planos?
2. ¿El arco se lee en la hoja: la primera parte gris y fría, la segunda a color, sin saltos?
3. ¿El color nace de la ficha (la ola) y lo que toca brota?
4. ¿El personaje está siempre vivo (respira, mira la ficha, cambia de cara con el golpe)?
5. ¿Hay algo importante encima de y < 250 o debajo de y > 1650? El subtítulo va centrado en y ≈ 1400.
6. ¿El CTA es tu palabra, entra con corte seco y se lee de un vistazo?

Si algo da «no», se corrige y se vuelve a pasar la lista.

## Reglas del estilo
- **Un solo objeto con color al inicio.** Es la ficha del cuento: está al principio y vuelve cambiada al final. Nunca se explica, se ve.
- **El color vuelve desde la ficha, en una ola de borde suave** con un anillo de luz tibia al frente. No vuelve por corte ni con un fundido de toda la pantalla.
- **Golpe antes de los 2 s:** la ficha se enciende con un destello tibio de 3 a 4 cuadros y la ola arranca.
- **Cámara viva:** nunca quieta más de medio segundo. Empuje hacia el personaje, plano corto en el giro y apertura amplia para el pago, siempre con suavizado. Nada tiembla: el vaivén de la ficha es lento, de péndulo.
- **Libro ilustrado plano:** formas redondeadas sin contorno, degradados suaves en el cielo y las fachadas, una sola luz por escena, viñeta y grano. Ningún negro puro.
- **Subtítulo a mano:** letra a mano color crema con halo oscuro y una franja suave detrás, con las palabras exactas de la voz.
- **Escena a sangre con personaje:** no lleva gancho textual. El golpe de los primeros 2 s es la ficha que se enciende.
- **Todo sale del número de cuadro:** nada de `Math.random` ni de la hora. Usa `hash2` o `rng(semilla)` del motor, así el mismo cuadro siempre da la misma imagen.

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/escena.html` | El cuento entero dibujado en canvas: mundo, personaje, ficha, ola de color, lluvia, pétalos, pájaros, cámara, subtítulo y CTA. |
| `plantilla/config.json` | Frases, palabra de CTA, colores y duraciones (ejemplo con «GUÍA»). |
| `plantilla/build.mjs` | Arma `index.html` (se abre con doble clic para verlo en vivo), renderiza el MP4 y saca la hoja de 9 cuadros. |
| `plantilla/motor/` | El núcleo de dibujo (`nucleo.js`) y el renderizador (`renderizar.mjs`, Chrome sin ventana + ffmpeg). Licencia MIT en `LICENSE-iart-ai.txt`. |
| `plantilla/fuentes/` | Patrick Hand (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit. |

## Errores que ya se vieron en las pruebas (no repetir)
- **El color volvía con un fundido de toda la pantalla:** se ve plano. La ola sale de la ficha.
- **El tercio de abajo quedaba como calle vacía:** ahí va el subtítulo y, en el cierre, el CTA.
- **Parpadeo como una elipse aplastada:** sale como un hongo. El ojo cerrado es una línea curva.
- **La ficha pegada a los ojos del personaje:** deja aire entre los dos.
