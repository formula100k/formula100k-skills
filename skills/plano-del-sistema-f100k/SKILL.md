---
name: plano-del-sistema-f100k
description: Arma un reel vertical sin cara en estilo PLANO DEL SISTEMA, hecho en Blender por código y sin créditos. Un plano azul tipo blueprint sobre una mesa de madera, con luz rasante y papel con relieve, se dibuja solo: 4 módulos numerados con sus conectores y puntos de luz que los recorren. La cámara se mete por la trampilla del módulo 03 a una sala donde una máquina 3D se arma pieza por pieza, recibe la idea y saca las piezas por una cinta con dos asistentes al lado, y vuelve a subir al plano para el cierre con tu palabra de CTA. Toma continua de 10 s, 1080×1920. Usar cuando digan «plano del sistema», «plantilla Plano del sistema», «el del plano azul», «reel tipo blueprint», «explica mi sistema como un plano de ingeniero», «el de la máquina debajo de la mesa». NO usar para la línea que se transforma en figuras (linea-dorada-f100k), para el avatar con la tele (avatar-mini-tele-f100k), para pizarras dibujadas a mano (pizarra-explicativa-f100k) ni para videos donde sales tú a cámara.
argument-hint: [tema + 4 pasos de tu sistema + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Plano del sistema (reel sin cara en Blender)

Tu proceso explicado como el plano de un ingeniero. Sobre una mesa de madera hay un plano azul con relieve, dobleces y esquinas levantadas, iluminado por una lámpara rasante. Las líneas se trazan solas: el título, 4 módulos numerados (01 → 04) con un ícono cada uno, conectores con flecha y puntos de luz que corren por ellos. Se abren las trampillas del módulo 03 y la cámara baja por el hueco a una sala con cuadrícula azul: una máquina se arma pieza por pieza, giran sus engranajes, cae la idea por la tolva y salen las piezas por la cinta con dos asistentes mirando. En la pared, lo que entra y lo que sale («1 IDEA → 8 VIDEOS»). La cámara vuelve a subir, se cierran las trampillas y entra el CTA. Todo se arma por código en Blender (EEVEE), se renderiza gratis en tu compu y queda en 1080×1920 a 30 fps, 300 cuadros (10 s).

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`. En este estilo, su color de acento reemplaza el amarillo de la clave del título, de la cifra de la pared, del CTA y de la tolva y la franja de la máquina (`colores.acento` en `config.json`). Si quiere, su tinta puede reemplazar el blanco azulado de las líneas (`colores.tinta`, siempre un color claro). El papel azul, la mesa de madera y la sala se quedan: son el mundo del estilo. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **El tema y el título en 4 partes:** dos palabras chicas y dos grandes, por ejemplo «TU EQUIPO / TRABAJA / mientras / DUERMES». La última (`clave`) es la palabra que pega y va en tu color.
2. **Los 4 pasos de tu sistema** en una palabra cada uno (ej. IDEAS, GUION, ANIMACIÓN, PUBLICA). El paso 03 es el que se abre: pon ahí el corazón del proceso.
3. **Lo que entra y lo que sale de la máquina:** dos textos cortos para la pared de la sala («1 IDEA» → «8 VIDEOS») y cuántas piezas salen por la cinta (de 1 a 8). Si llevan cifra, tiene que ser real: no inventes números.
4. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO».
5. **Voz (opcional):** tu grabación o una voz clonada, de unos 10 s. Sin voz, la pieza se sostiene sola con texto.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: `plantilla/build.py`, `plantilla/config.json`, `plantilla/post.sh` y `plantilla/fuentes/`.
2. **Escribe `config.json`:**
   - `titulo`: `chica_1`, `grande_1`, `chica_2` y `clave`.
   - `modulos`: los 4 pasos, en orden.
   - `cota`: el rótulo chico bajo el módulo 03 (ej. «TRABAJA SOLA»).
   - `cajetin`: los dos textos de la esquina de abajo (ej. «PLANO 01», «TU SISTEMA»).
   - `sala`: `entra`, `sale` y `piezas` (1 a 8, que coincida con la cifra que dices).
   - `cta_chica` («COMENTA», «ESCRIBE»…) y `cta` (tu palabra).
   - `colores`: `acento` (y `tinta` si la cambias), en hex.
   Si un texto es largo, la plantilla lo achica sola para que quepa en su caja; aun así, mejor corto: una palabra por módulo.
3. **Si quieres cambiar los íconos de los módulos** (foco, líneas de guion, celular con play y engranajes), están en `build.py` en el bloque «tinta: lineas que se trazan solas» (`i01_…`, `i02_…`, `i04_…`, `g_…`). Se dibujan con `stroke()` sobre puntos del plano. Que el ícono **muestre lo que dice el módulo**.
4. **Prueba rápida:** `PS_CONFIG=config.json PS_SCALE=50 PS_SAMPLES=12 blender -b -P build.py` y luego `blender -b escena.blend -f 80 -f 215 -f 295`. Revisa esos 3 cuadros (plano lleno, sala con la máquina y cierre) con la lista de abajo antes de renderizar todo.
5. **Render completo:** `PS_CONFIG=config.json blender -b -P build.py`, luego `blender -b escena.blend -a` (300 cuadros; unos 2–3 s por cuadro en una Mac M) y `./post.sh`, que arma `muestra.mp4` con grano y viñeta finos, `poster.jpg` y `cuadros.jpg` (hoja de 9 cuadros) y mide que no haya tramos quietos.
6. **Verifica con la hoja de 9 cuadros** (`cuadros.jpg`) y la lista de revisión.
7. **Sonido:** trazo de lápiz grave, golpe sordo en las trampillas, desliz de la cinta y pop grave en cada texto. Nada agudo (nada por encima de ~3 kHz), sin timbres, clics ni pitidos.

## Lista de revisión (cuadro por cuadro)
1. ¿El título se lee completo y la clave va en tu color, más grande que el resto?
2. ¿Los 4 módulos tienen su nombre dentro de la caja, sin salirse ni tocar los íconos?
3. ¿El ícono de cada módulo muestra lo que dice?
4. ¿En la sala, la pared dice lo que entra y lo que sale, y salen tantas piezas como dice la cifra?
5. ¿Los textos entran con corte seco, sin rebote, temblor ni animación de entrada?
6. ¿El CTA es tu palabra, se lee entera dentro del bloque de cierre y no es «YO»?
7. ¿La cámara nunca se queda quieta (post.sh dice «sin congelados»)?

Si algo da «no», se corrige y se vuelve a pasar la lista.

## Reglas del estilo
- **Un plano físico, no un diagrama plano:** papel con relieve y dobleces, luz rasante cálida, mesa de madera, lápiz, regla y pisapapeles de latón con sombras reales. No lo conviertas en un diagrama 2D sobre blanco.
- **Las líneas se dibujan solas** y la máquina se construye en cámara: nada aparece ya hecho.
- **Entrar al módulo es atravesar el papel:** la cámara baja por la trampilla a la sala 3D y vuelve a subir para el cierre. Toma continua, sin cortes.
- **Cámara viva todo el tiempo,** con desenfoque de lente y foco que se mueve. 0 % de tiempo quieto.
- **Estímulo nuevo cada 0,3–2 s:** un trazo, una etiqueta, las trampillas, una pieza de la máquina, una tarjeta en la cinta.
- **Letras:** una letra condensada enorme para lo que importa (Anton) y una de palo grueso chica para los conectores (Archivo Black). Tamaños distintos en la misma frase y corte seco.
- **Zonas libres:** título y CTA caen entre y ≈ 230 y y ≈ 1350; la franja de abajo solo tiene lápiz y regla, para que quepan subtítulos si los pones en edición.
- **Una idea por módulo** y el CTA con palabra clave al final.

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/build.py` | Toda la escena por código: mesa, plano, trazos, trampillas, sala, máquina, asistentes, luces, cámara y render. |
| `plantilla/config.json` | Título, módulos, rótulos, sala, CTA y color de acento (ejemplo genérico con «GUÍA»). |
| `plantilla/post.sh` | De los cuadros a `muestra.mp4`, `poster.jpg` y `cuadros.jpg`, y mide los tramos quietos. |
| `plantilla/fuentes/` | Anton y Archivo Black (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit. |

## Lo que ya se sabe (para no repetir)
- **El amarillo sale arena** por el tono de color de Blender (AgX): elige un acento bien saturado.
- **El paso por el hueco** (4,5–5 s y 8–8,5 s) es muy cercano y borroso: funciona como transición, no pongas texto ahí.
- **Las piezas de la cinta** se esconden con toda su familia (pantalla y play): si agregas objetos hijos, usa `appear(..., tree=True)`.
- **Desde arriba, la máquina se quemaba a blanco:** por eso lleva tapa oscura. No la quites.
- Avisos «Shadow buffer full» de EEVEE: no se notan, pero si agregas luces, que sean sin sombra.
- **Duración:** la plantilla hace un bloque de 10 s. Para un reel más largo, haz un bloque por paso (otra `config.json`) y únelos en edición.
