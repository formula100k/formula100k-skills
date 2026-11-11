---
name: animacion-ascii-f100k
description: Arma un reel vertical sin cara en estilo ANIMACIÓN ASCII, hecho en Blender por código y sin créditos. Una escena 3D de verdad (una oficina de noche con 3 asistentes de bloques frente a sus monitores, una pared de 8 pantallas y tu palabra de CTA en letras 3D) se convierte cuadro por cuadro en caracteres de computadora verdes sobre negro, como un monitor de fósforo antiguo. Lo cercano sale más denso y brillante, lo lejano más ralo, y los bordes se dibujan con | / \ - según su ángulo. Los textos se escriben solos con cursor y la palabra clave se arma enorme con bloques. Una sola toma continua de 10 s, sin voz por defecto. Usar cuando digan «animación ASCII», «plantilla ASCII», «estilo letras de computadora», «video hecho con caracteres», «estilo matrix», «monitor verde retro», «hazme el de los caracteres verdes». NO usar para la línea técnica blanca sobre negro con globo alámbrico (explicacion-blanco-negro-f100k), para el plano azul tipo blueprint (plano-del-sistema-f100k), para objetos 3D en pedestales (objetos-3d-minimal-f100k) ni para videos donde sales tú a cámara.
argument-hint: [tema + 3 frases (chica + clave) + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Animación ASCII (reel sin cara en Blender + caracteres)

La imagen entera está hecha de letras y signos monoespaciados verdes sobre negro. No es un filtro sobre un dibujo plano: debajo hay una escena 3D real que se renderiza en dos pases (luz y profundidad) y un script la traduce a una grilla de 90 × 80 caracteres. Por eso tiene profundidad, cámara viva y bordes que se leen. Arriba de todo, los textos se teclean solos con cursor y la palabra clave aparece enorme, armada con bloques █ ▓ ▒ ░. Se renderiza gratis en tu compu y queda en 1080×1920 a 30 fps.

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`. En este estilo es un **mundo propio: no se repinta.** Su color de acento va en la palabra clave (`colores.clave` en `config.json`) y, si lo pide, en los dos tonos de la pantalla (`cerca` y `lejos`). La letra monoespaciada, el fondo negro y el acabado de monitor se quedan. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **El tema y 3 frases cortas**, cada una con una línea chica y una palabra clave enorme, por ejemplo «tu equipo / TRABAJA», «mientras / DUERMES», «1 idea → / 8 VIDEOS». La clave cabe en una línea (hasta ~9 letras se lee enorme; más larga se achica sola). Si usas una cifra, que sea real y tenga fuente.
2. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO». Se arma en letras 3D al final.
3. **La escena**, si quieres otra: la del ejemplo (asistentes trabajando de noche + pared de pantallas que se prenden) sirve para cualquier tema de «un sistema que trabaja por ti». Si tu tema pide otra cosa (una cocina, un taller, una tienda), dime qué se ve y qué cambia en cada tramo.
4. **Voz (opcional):** tu grabación o una voz clonada. Sin voz, son 10 s con música grave.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: `plantilla/build.py`, `plantilla/render_pases.py`, `plantilla/ascii_post.py`, `plantilla/config.json` y `plantilla/fuentes/`.
2. **Escribe `config.json`:**
   - `cta`: tu palabra (se arma en letras 3D sobre la tarima).
   - `textos`: la lista de textos. Cada uno lleva `f0` y `f1` (cuadro en que entra y en que se va; 30 cuadros = 1 s), `chica` (se teclea letra por letra con cursor), `grande` (la clave en bloques, o `null`) y `fila` (dónde arranca: 9 = arriba, 49–50 = mitad baja; la grilla va de 0 a 79). El último es la línea chica del CTA («comenta») con `grande: null`.
   - `colores`: `cerca` y `lejos` (los dos tonos de la imagen), `blanco` (pantallas y texto) y `clave` (la palabra enorme), en hex.
3. **Adapta la escena** en `build.py` solo si cambias la metáfora:
   - Zona A (ventana con luna, escritorio, monitores y asistentes): funciones `monitor(x, fase)` y `asistente(x, f_giro, giro)`. Los asistentes giran la cabeza a cámara en el cuadro `f_giro`.
   - Zona B (pared de 8 pantallas que se prenden una por una desde `F_PANT`, y la palabra del CTA que entra letra por letra desde `F_LETRA`).
   - Cámara: la lista `RUTA` (cuadro, posición de cámara, punto al que mira): push-in → órbita → travelling a la pared → apertura.
   - Las piezas se arman con `caja(...)` y `cil(...)`. Para que algo aparezca de golpe usa `paso(...)` (corte seco), nunca una escala animada.
   - Si lleva voz: mueve `f0`/`f1` de los textos y la `RUTA` para que cada frase caiga en su tramo. Los subtítulos van como textos `chica` en la fila libre, no en caja.
4. **Arma la escena:** `blender -b -P build.py` → `escena.blend`.
5. **Prueba rápida:** `blender -b escena.blend -P render_pases.py -- 40,110,190,290` y luego `uv run --with pillow --with numpy ascii_post.py 40,110,190,290`. Revisa los PNG de `revision/` con la lista de abajo. (Sin `uv`: `pip install pillow numpy` y `python3 ascii_post.py ...`).
6. **Render completo:** `blender -b escena.blend -P render_pases.py` (los 300 cuadros a 360×640 en `pases/`, unos 2 min) y `uv run --with pillow --with numpy ascii_post.py` (unos 1,5 min). Sale `muestra.mp4`, `poster.jpg` y `cuadros.jpg` (hoja de 9 cuadros).
7. **Verifica** con `cuadros.jpg` y comprueba que no haya tramos quietos: `ffmpeg -i muestra.mp4 -vf "freezedetect=n=0.003:d=0.5" -map 0:v -f null - 2>&1 | grep freeze_start` no debe imprimir nada.
8. **Sonido:** pop y golpe sordo graves en cada palabra clave y en cada letra del CTA. **Nada de teclas, clics ni pitidos** aunque el texto se teclee: nada por encima de ~3 kHz.

## Lista de revisión (cuadro por cuadro)
1. ¿Se entiende qué es cada cosa (personas, monitores, pantallas) solo con los caracteres?
2. ¿Lo cercano es más denso y claro que lo lejano (se siente la profundidad)?
3. ¿Cada palabra clave se lee completa, centrada y sin salirse del cuadro?
4. ¿El texto aparece tecleado con cursor y la clave con corte seco letra por letra, sin rebote ni temblor?
5. ¿Hay algo clave encima de y < 180 o debajo de y > 1650 (fila < 8 o > 68)?
6. ¿La palabra del CTA es la tuya y entra completa al final?
7. ¿El primer cuadro ya muestra imagen (nunca una portada negra)?

Si algo da «no», se corrige y se vuelve a pasar la lista.

## Reglas del estilo
- **Escena 3D real debajo, no dibujo plano.** Dos pases (luz + profundidad): lo cercano más denso y brillante, lo lejano más ralo y oscuro. Eso es lo que lo separa de un filtro ASCII cualquiera.
- **Bordes con dirección:** los contornos usan `| - / \` según el ángulo real de la forma, para que todo se lea.
- **Un solo plano largo que se transforma, sin cortes,** con algo nuevo cada ~2 s: push-in, órbita en la que los asistentes giran la cabeza, pantallas que se prenden, letras del CTA una por una.
- **Casi monocromo:** un tono de pantalla en dos intensidades + blanco para lo que emite luz. Si se suma un acento, va solo en la palabra clave.
- **Acabado de monitor de fósforo:** resplandor en dos radios, líneas de barrido, viñeta. Nada se quema: las altas luces pasan por una rodilla.
- **Arranque escrito:** la pantalla se escribe sola de izquierda a derecha y el cuadro 1 ya va escrito a medias.
- **Texto de diseño dentro del estilo:** la línea chica en monoespaciada que se teclea; la clave en letra condensada rasterizada a bloques, enorme. Fondo negro detrás del texto para que se lea.
- **Sin gancho textual en bloque aparte:** el primer texto de la lista hace de gancho (2 a 5 palabras, entra antes del segundo 1).

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/build.py` | La escena 3D por código: oficina, asistentes, monitores, pared de pantallas, palabra del CTA en 3D, luces y cámara. |
| `plantilla/render_pases.py` | Saca los pases de luz y profundidad (todos o cuadros sueltos). |
| `plantilla/ascii_post.py` | Convierte los pases en la grilla de caracteres, pone los textos y arma `muestra.mp4`, `poster.jpg` y `cuadros.jpg`. |
| `plantilla/config.json` | Palabra del CTA, textos con sus tiempos y colores (ejemplo genérico con «GUÍA»). |
| `plantilla/fuentes/` | Anton y JetBrains Mono Bold (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit. |

## Errores conocidos (no repetir)
- **Primeros segundos con poco contraste:** si la escena arranca con figuras de espaldas, súbeles la luz de relleno o abre el plano; la figura tiene que entenderse antes del giro.
- **Pared de pantallas muy cerrada:** si las pantallas son la idea, que el plano las muestre todas juntas al menos 1 s.
- **Palabra del CTA corta que se sale del cuadro:** el tamaño de las letras 3D tiene tope (`ESC` en `build.py`); no lo quites.
- **Escalonado en letras finas:** la grilla es de 90 columnas; para más detalle baja `CW`/`CH` en `ascii_post.py` (más columnas = más lento).

## Checklist final
- [ ] `config.json` con tus textos, tu palabra de CTA (no «YO») y tus colores.
- [ ] Prueba de 4 cuadros revisada antes del render completo.
- [ ] `muestra.mp4` en 1080×1920, 30 fps, sin tramos quietos.
- [ ] `cuadros.jpg` revisado con la lista de 7 preguntas.
- [ ] Sonido grave, sin teclas ni pitidos. Si lleva voz: sello del protocolo de corte.
- [ ] En pantalla no aparecen nombres de herramientas, código ni marcas que no sean las tuyas.
