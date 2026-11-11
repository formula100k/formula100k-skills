---
name: isometrico-f100k
description: Arma un reel vertical sin cara en estilo ISOMÉTRICO, hecho en Blender por código y sin créditos. Una maqueta 3D vista en isométrico sobre un piso crema: 4 módulos cortados (dos muros y una losa) se construyen en pantalla, cada uno con su utilería y sus asistentes cubo que brincan, unidos por un cable azul que se dibuja solo y lleva un paquete de luz de una estación a la siguiente. La cámara recorre las 4 estaciones en una toma continua de 11 s con desenfoque de maqueta y cierra en plano general sobre tu palabra de CTA pintada en el piso. Usar cuando digan «estilo isométrico», «plantilla Isométrico», «maqueta isométrica», «reel de mi proceso en 4 pasos como maqueta 3D», «mi sistema explicado en estaciones», «hazme el de la maqueta con el cable». NO usar para cubitos 3D con personaje (animacion-cubitos-3d-f100k), para el avatar con tele (avatar-mini-tele-f100k), para pizarras (pizarra-explicativa-f100k) ni para videos donde sales tú a cámara.
argument-hint: [tema + 4 pasos del proceso + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Isométrico (reel sin cara en Blender)

Una maqueta en 3D, vista desde arriba en diagonal, cuenta un proceso de 4 pasos. Cada paso es un módulo que se arma en pantalla: la losa crece, suben los muros, aparece la utilería (un foco, una pila de hojas, una pantalla de edición, un teléfono) y dos asistentes cubo empiezan a brincar. Un cable con quiebres en ángulo se dibuja de un módulo al siguiente y un paquete de luz viaja por él: lo que sale de un paso entra al otro. Al final, la cámara se abre a plano general y aparece tu CTA pintado en el piso sobre una placa de tu color. Todo se arma por código en Blender (EEVEE), se renderiza gratis en tu compu y queda en 1080×1920 a 30 fps, 11 s.

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`. En este estilo, su acento reemplaza el amarillo de la placa del CTA y de los paquetes de luz, y su color de texto oscuro va en los rótulos y letras del piso (`colores` en `config.json`). El piso crema, la vista isométrica y la cámara se quedan. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **El tema y los 4 pasos de tu proceso,** en orden. Cada paso lleva un título de 1 palabra en mayúsculas (máx. ~9 letras) y un renglón chico de 2 a 4 palabras, por ejemplo: «GUIONES / se vuelve guion».
2. **El gancho que va pintado en el piso al arrancar:** un renglón chico en itálica y 1 o 2 renglones enormes de hasta ~8 letras cada uno, por ejemplo: «De una idea a / VIDEOS / LISTOS». Va negativo, polémico o con un resultado; habla de quien mira, no de ti.
3. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO».
4. **Qué objeto representa cada paso** (si no lo dices, se eligen objetos simples que se reconozcan al instante).
5. **Voz (opcional):** tu grabación o una voz clonada. Sin voz, la pieza dura 11 s y funciona como gancho visual o loop.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: `plantilla/build.py`, `plantilla/config.json`, `plantilla/post.sh` y `plantilla/fuentes/`.
2. **Escribe `config.json`:**
   - `cta`: tu palabra (la placa de color se ajusta sola a su largo; hasta ~10 letras).
   - `cta_chica`: la palabra chica antes del CTA («Comenta», «Escribe»).
   - `gancho`: `chica` (renglón en itálica) y `grande` (lista de 1 o 2 renglones enormes).
   - `estaciones`: 4 objetos con `titulo` y `renglon`, en el orden del proceso.
   - `colores`: `acento`, `cable`, `tinta`, `asistentes`, y las listas de 4 `muros` y 4 `suelos`.
   Los textos que no caben se achican solos para no pisar otro módulo.
3. **Adapta la utilería de cada estación** en `build.py`, en los bloques `M1 · IDEAS`, `M2 · GUIONES`, `M3 · EDICIÓN` y `M4 · PUBLICAR`. Hoy traen: foco que se enciende con notas y tablero; mesa con una pila de hojas que crece y hojas en el muro; pantalla de edición con línea de tiempo que se llena y monitores; teléfono que cambia de video, calendario que se pinta y 8 tarjetas de video que vuelan a una fila en el piso. Si tu proceso es otro, **reemplaza el objeto por algo que muestre lo que dice ese paso** con las mismas piezas (`box`, `cyl`, `ico`, `tri`), que crecen con `grow(obj, t)` o aparecen con corte seco con `cut(obj, t)`. Deja los asistentes (`asistente(...)`) y el rótulo de cada módulo.
4. **Prueba rápida (3 cuadros):** `ISO_CONFIG=config.json ISO_SCALE=50 ISO_SAMPLES=12 blender -b --factory-startup -P build.py` y luego `blender -b escena.blend -o //prueba_#### -f 60 -f 190 -f 330`. Revísalos con la lista de abajo antes de renderizar todo.
5. **Render completo:** `ISO_CONFIG=config.json blender -b --factory-startup -P build.py`, luego `blender -b escena.blend -a` (330 cuadros; unos 8 min en una Mac M a 32 muestras) y `./post.sh`, que arma `muestra.mp4` con grano y viñeta finos, `poster.jpg` y `hoja.jpg` (9 cuadros), y mide si hay tramos quietos.
6. **Verifica con la hoja de 9 cuadros** (`hoja.jpg`) con la lista de revisión. Si algo da «no», se corrige y se vuelve a renderizar ese tramo (`blender -b escena.blend -s 200 -e 260 -a`).
7. **Sonido:** pop grave cuando crece cada módulo, desliz suave cuando corre el cable y golpe sordo en el CTA. Nada agudo (nada por encima de ~3 kHz), sin timbres, teclas ni clics.

## Lista de revisión (cuadro por cuadro)
1. ¿Cada módulo se lee en un vistazo: título, renglón y un objeto que muestra ese paso?
2. ¿El gancho del piso se lee completo en los primeros 2 s y dice lo mismo que la primera frase de la voz?
3. ¿El cable une los módulos en orden y el paquete de luz va del paso anterior al siguiente?
4. ¿Los textos entran con corte seco, sin rebote ni temblor?
5. ¿Hay algo clave encima de y < 180 o debajo de y > 1650 (zonas de la interfaz)?
6. ¿El CTA es tu palabra, queda nítido en el último segundo y la placa no se ve vacía ni corta?
7. ¿La cámara nunca se detiene? (`post.sh` debe decir «sin tramos quietos»).

## Reglas del estilo
- **Isométrico de verdad:** cámara ortográfica a 60° y 45°, sin perspectiva. En vertical, `ortho_scale` es el ALTO del encuadre, no el ancho.
- **Todo se construye en pantalla:** nada aparece ya armado. Losas y muros crecen, renglones se escriben, la pila sube hoja por hoja. Lo que crece usa una curva suave sin rebote; los textos entran con corte seco.
- **Causa y efecto visibles:** el paquete de luz sale del primer paso, viaja por el cable y lo que entrega el último paso (las tarjetas) aterriza en fila junto al CTA.
- **Toma continua con cámara viva:** 13 puntos de paso con interpolación suave; recorre las 4 estaciones y cierra en plano general con empuje al CTA. Nunca queda quieta.
- **Desenfoque de maqueta:** el foco viaja con la cámara y el diafragma se cierra en la última estación para que su rótulo y las tarjetas queden nítidos.
- **Luz de maqueta:** sol suave con sombras, rebote de luz entre muros, el foco, las pantallas y los paquetes emiten con halo suave. Sin sobreexponer: si todo se ve blanco, baja el sol (`sun_d.energy`) o el mundo.
- **Letras pintadas en el piso** en perspectiva isométrica: serif itálica chica + letra negra enorme, palabra por palabra. Sin brillo ni degradado.
- **Paleta apagada con un solo acento:** muros y suelos pastel, el acento solo en la placa del CTA y los paquetes de luz.

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/build.py` | Toda la escena por código: piso, 4 módulos con utilería, asistentes, cables con paquetes de luz, letras del piso, cámara y luz. |
| `plantilla/config.json` | Gancho, 4 estaciones, palabra del CTA y colores (ejemplo genérico con «GUÍA»). |
| `plantilla/post.sh` | Arma `muestra.mp4` (grano y viñeta finos), `poster.jpg`, `hoja.jpg` y mide tramos quietos. |
| `plantilla/fuentes/` | Archivo Black e Instrument Serif Italic (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto con la config genérica. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit. |

## Errores que ya costaron una vuelta (no repetir)
- **Encuadres fuera de sitio:** la rotación de la cámara y los ejes de pantalla (`RIGHT`, `UP`, `D`, `scr()`) tienen que usar el mismo ángulo (60°). Si cambias uno, cambia todos.
- **Todo blanco (sobreexpuesto):** sol 2,1 y mundo 0,45 son el punto bueno; más arriba se lava.
- **Desenfoque total:** un diafragma muy abierto (f/0,9) borra la maqueta. Base f/4 (`ISO_FSTOP`).
- **El CTA tapado por su placa:** la palabra va un poco más alta que la placa (`c2.location.z = 0.03`).
- **Tarjetas que desaparecen en 0,1 s:** lo que entrega el último paso aterriza en el piso y se queda hasta el final.
