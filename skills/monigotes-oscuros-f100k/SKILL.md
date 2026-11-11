---
name: monigotes-oscuros-f100k
description: Arma un reel vertical sin cara en estilo MONIGOTES OSCUROS, hecho en Blender por código y sin créditos. Siluetas negras de palitos con ojos que brillan, en un paisaje nocturno de cine (luna, sierras que se pierden en la niebla, pasto en primer plano) y en una sola toma continua que se transforma. En el ejemplo, un monigote solo empuja una roca cuesta arriba, se le resbala, su equipo llega corriendo desde la niebla, la suben juntos y él se sienta a dormir. El texto entra palabra por palabra con corte seco y cierra con tu palabra de CTA en tu color. Va sin voz por defecto (10 s). Usar cuando digan «monigotes oscuros», «plantilla Monigotes oscuros», «monigotes de palitos en la noche», «siluetas con ojos que brillan», «reel del que empuja la roca», «hazme el de los monigotes en la niebla». NO usar para las figuras blancas en una sala oscura con narración (monigotes-blender-sala-oscura-f100k), para los monigotes planos de plumón sobre papel (ensayo-palitos-f100k), para el monigote de tiza en pizarra (pizarra-negra-tiza-f100k), para la línea técnica blanca sobre negro (explicacion-blanco-negro-f100k) ni para videos donde sales tú a cámara.
argument-hint: [tema o frase de 3 partes + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Monigotes oscuros (reel sin cara en Blender)

Un mundo 100 % oscuro, azul y gris, con una banda clara en el horizonte. Los personajes son monigotes negros de palitos que solo se leen por su silueta y por sus ojos: el protagonista con ojos blancos y su equipo con ojos de color. Todo pasa en un plano largo que nunca corta: la cámara de grúa empuja, panea, sube y abre. Es una metáfora visual sin palabras habladas: lo que pasa en pantalla cuenta la idea y el texto solo la remata. Se arma por código en Blender (EEVEE), se renderiza gratis en tu compu y queda en 1080×1920 a 30 fps.

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`. En este estilo es un **mundo propio: no se repinta.** Su color de acento reemplaza el amarillo de la palabra del CTA (`colores.acento`) y puede teñir los ojos del equipo y las ventanas encendidas (`ojos_equipo`, `ventanas`) para que el único toque cálido sea el suyo. La noche azul, las siluetas negras y la letra (serif itálica chica + letra condensada enorme) se quedan. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **El tema y una frase de 3 partes:** dos líneas chicas y una palabra clave enorme, por ejemplo «tu equipo trabaja / mientras / DUERMES». Que la frase diga lo mismo que muestra la escena.
2. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO».
3. **La metáfora**, si quieres otra: quién es el protagonista, qué carga o empuja, quién lo ayuda y adónde llegan. Si no me la das, uso la del ejemplo (roca cuesta arriba + equipo + edificio encendido), que sirve para cualquier tema de «hacerlo sola contra tener un sistema».
4. **Voz (opcional):** tu grabación o una voz clonada. Sin voz, son 10 s con música grave.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: `plantilla/build.py`, `plantilla/montar.sh`, `plantilla/config.json` y `plantilla/fuentes/`.
2. **Escribe `config.json`:**
   - `frase`: las 3 partes (línea chica 1, línea chica 2, palabra clave). `cierre`: la palabra chica antes del CTA («comenta»). `cta`: tu palabra.
   - `equipo`: cuántos llegan a ayudar (1 a 7). Con 5 se lee limpio; con 7 se enciman en una mancha de patas.
   - `colores`: `acento` (palabra del CTA), `texto`, `ojos_heroe`, `ojos_equipo` y `ventanas`, en hex.
   - `tiempos`: en segundos, cuándo entra cada parte del texto (`linea1`, `linea2`, `clave`), cuándo se va (`fuera`) y cuándo entran `cierre` y `cta`.
3. **Adapta la escena** en `build.py` solo si cambias la metáfora o la duración:
   - Recorrido de la roca: `boulder_x(t)` (empujones, resbalón, aguante, subida). El objeto que empujan es `ROCK` (cámbialo por una caja, un carrito o lo que diga tu tema, pero que pese).
   - Protagonista: `hero_pose(t)` (empuja, suelta en `T_REL`, se sienta y cabecea). Equipo: `team_pose(i, t)` y la tabla `TEAM_DEF`.
   - Destino: `build_factory(...)` en `FAB`, un edificio con ventanas encendidas. Cámbialo por lo que represente la meta.
   - Cámara: la lista `CAM_KEYS` (segundo, posición de cámara, punto al que mira).
   - Si cambias la duración, ajusta `DUR` y los tiempos de todo lo anterior.
   - Si lleva voz: mapea cada frase a un momento de la escena y mueve `boulder_x`, las poses y `CAM_KEYS` para que el cambio de acción caiga en la frase. Subtítulos encima de la cabeza del protagonista, nunca en caja negra.
4. **Prueba rápida:** `MO_SCALE=50 MO_SAMPLES=12 blender -b -P build.py` y luego `./montar.sh prueba 30 120 200 280`. Revisa esos 4 cuadros en `prueba/` con la lista de abajo antes de renderizar todo.
5. **Render completo:** `blender -b -P build.py` y `./montar.sh` (300 cuadros, unos 2 s por cuadro en una Mac M a resolución completa; a `MO_SCALE=50` tarda unos 2 min). Sale `muestra.mp4`, `poster.jpg` y `cuadros.jpg` (hoja de 9 cuadros), y te dice si hay tramos quietos. Si `blender` no está en el PATH: `BLENDER=/Applications/Blender.app/Contents/MacOS/Blender ./montar.sh`.
6. **Verifica con la hoja de 9 cuadros** (`cuadros.jpg`) y la lista de revisión.
7. **Sonido:** golpe sordo cuando la roca se resbala y cuando llega el equipo, desliz de tierra grave, pop grave en cada palabra. Nada agudo (nada por encima de ~3 kHz): sin campanas, timbres, teclas ni clics.

## Lista de revisión (cuadro por cuadro)
1. ¿Las siluetas se leen contra el fondo (niebla o cielo detrás) y no se pierden en el negro?
2. ¿Se distingue al protagonista (ojos blancos) del equipo (ojos de color) en todo momento?
3. ¿La cámara se mueve en todos los cuadros? (`montar.sh` debe decir «sin congelados»).
4. ¿El texto entra con corte seco, sin brillo, sin rebote, y la clave es la palabra más grande?
5. ¿Hay algo clave encima de y < 180 o debajo de y > 1650? El texto vive entre y 200 y 620.
6. ¿La palabra del CTA es la tuya, en tu color, y se lee completa (no se sale del cuadro)?
7. ¿Lo que pasa en pantalla cuenta la frase sin necesitar el texto?

Si algo da «no», se corrige y se vuelve a pasar la lista.

## Reglas del estilo
- **Mundo 100 % oscuro, un solo acento cálido.** Fondo azul-gris (de casi negro a una banda clara en el horizonte), mitad baja del cuadro oscura. El único color cálido son los ojos del equipo y las ventanas del destino. Nada más lleva color.
- **Siluetas, no personajes con cara.** Monigotes negros de palitos con dos ojos que brillan; se reconocen por la pose. La animación es por IK: los pies pisan el terreno y las manos tocan lo que empujan.
- **Una sola toma continua, cero cortes.** La cámara de grúa siempre viva: contrapicado → push-in → paneo → grúa que sube → apertura final. Con desenfoque de lente (f/1.1) que sigue a la acción.
- **Profundidad real:** 3 sierras que se pierden en la niebla, mar de niebla volumétrica con luz propia (para que la silueta siempre se lea), loma y pasto de primer plano con paralaje, polvo en bokeh y piedritas que saltan.
- **Luz de cine:** contraluz de luna más alto que la luna (borde claro en las siluetas), relleno frío suave, resplandor suave en luna, ojos y ventanas, viñeta y grano fino.
- **Una metáfora, una acción por momento:** solo → problema → llega la ayuda → lo logran juntos → descanso. Algo nuevo cada 1–2 s (resbalón, ojos en la niebla, empujón en grupo, texto, se sienta, «z z Z»).
- **Letras:** serif itálica chica para las líneas de conexión y letra condensada enorme para la clave; entran secuenciales con corte seco y sin animación de entrada. El CTA cierra en tu color.
- **Sin gancho textual en bloque:** es una escena a sangre con personajes; el texto de la frase hace de gancho y va arriba, lejos de las cabezas.

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/build.py` | Toda la escena por código: terreno, niebla, sierras, luna, monigotes con IK, roca, destino, cámara y los textos en PNG. |
| `plantilla/montar.sh` | Render de cuadros (salta los que ya están), resplandor + viñeta + grano, textos con corte seco, poster, hoja de 9 cuadros y control de tramos quietos. |
| `plantilla/config.json` | Frase, palabra del CTA, tamaño del equipo, colores y tiempos del texto (ejemplo genérico con «GUÍA»). |
| `plantilla/fuentes/` | Anton e Instrument Serif Italic (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit. |

## Errores conocidos (no repetir)
- **Cuadros casi negros:** si el cielo sale apagado o la luz del destino tiñe todo, revisa el degradado `SKY`, que la niebla tenga emisión propia y que la luz cálida no pase de 500 W.
- **Equipo hecho una mancha:** con 7 monigotes empujando se enciman; usa 5 o ábrelos en profundidad (columna `y` de `TEAM_DEF`).
- **Protagonista chico al final y pegado al borde:** si cambias la cámara final, deja al que duerme y al equipo dentro del mismo cuadro, sin cortar el destino.
- **Manos cerca de la cara al empujar:** baja la altura de las manos en `push_slot` si la pose se ve como empujar con el hombro.

## Checklist final
- [ ] `config.json` con la frase, tu palabra de CTA (no «YO») y tus colores.
- [ ] Prueba de 4 cuadros revisada antes del render completo.
- [ ] `muestra.mp4` en 1080×1920, 30 fps, «sin congelados».
- [ ] `cuadros.jpg` revisado con la lista de 7 preguntas.
- [ ] Sonido grave, sin agudos. Si lleva voz: sello del protocolo de corte.
- [ ] En pantalla no aparecen nombres de herramientas, código ni marcas que no sean las tuyas.
