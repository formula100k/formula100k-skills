---
name: avatar-mini-tele-f100k
description: "Reel sin cara en Blender: tu avatar 3D explica abajo y una tele retro arriba cambia de canal en cada frase. Usar con «avatar con mini tele», «mi avatar explicando con una tele». NO para el avatar en iPhone (reel-iphone-avatar-f100k) ni muñequitos three.js (munequitos-3d-sin-creditos-f100k)."
argument-hint: [tema o guion de 4 frases + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Avatar con mini tele (reel sin cara en Blender)

Tu avatar en 3D explica en el piso de abajo. En el de arriba hay una mini tele naranja que muestra una ilustración plana con trama de puntos, distinta en cada frase. Entre los dos va una tarjeta de interfaz que cambia con cada frase: un estado, una barra que se llena, un interruptor o un campo de comentario. Todo se arma por código en Blender (EEVEE), se renderiza gratis en tu compu y queda en 1080×1920 a 30 fps.

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`. En este estilo, su color de acento reemplaza el naranja de la tele y de la palabra clave, y sus colores también visten al avatar (`ropa` en `config.json`). La trama de puntos, el fondo crema y la tinta negra se quedan. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **El tema y 4 frases cortas** (~2,5 s cada una). Cada frase lleva una parte chica en itálica y una palabra clave enorme, por ejemplo: «Tu equipo trabaja / mientras DUERMES». La última es el CTA: «Comenta [PALABRA]».
2. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO».
3. **Cómo es tu avatar:** color de piel, de pelo, de la ropa, si la ropa lleva lunares, si usas collar o aretes, y si tienes pecas o lunares en la cara. Si ya tienes una hoja de personaje (`hoja-de-personaje-f100k`), saca los colores de ahí.
4. **Voz (opcional):** tu grabación o una voz clonada. Sin voz, la boca se mueve sola y los cortes caen cada 2,5 s.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: `plantilla/build.py`, `plantilla/config.json` y `plantilla/fuentes/`.
2. **Escribe `config.json`:** `cta` es la palabra del CTA y `avatar` lleva los rasgos (colores en hex; `lunares_ropa`, `collar`, `aretes`, `lunares_cara` y `pecas` van en true o false). Para fijar el tono de las hebras del pelo agrega `"pelo_hebras": ["#oscuro", "#claro"]`; si no lo pones, sale del color del pelo.
3. **Adapta las 4 frases y las 4 escenas de la tele** en `build.py`:
   - Titulares: busca las llamadas `tline(t1…t4, …)`. Cada palabra lleva (texto, letra, tamaño, color y cuadro en que entra). La clave va en `"black"` con `("fit", 2.0, 0.36)`.
   - Escenas de la tele: los bloques `A`, `B`, `C` y `D` (noche con el equipo, 1 idea → 8 videos, banda transportadora y comentario que se teclea). Reemplaza el dibujo de cada una por algo que **muestre lo que dice la frase**. Usa las mismas piezas (`S` para formas, `T` para texto, `bot`, `vcard`) y las 3 capas de profundidad (`b`, `m`, `f`).
   - Tarjetas de interfaz: los bloques `ca`, `cb_`, `cc` y `cd`, con textos cortos de la app de verdad.
   - Si cambias la duración, ajusta `B1…B4`, `NF` y la lista `POSES` del avatar.
4. **Prueba rápida:** `MT_CONFIG=config.json MT_SCALE=50 MT_SAMPLES=16 blender -b -P build.py` y luego `blender -b escena.blend -o //prueba_#### -f 40 -f 110 -f 285`. Revisa esos 3 cuadros (ver la lista de abajo) antes de renderizar todo.
5. **Render completo:** `MT_CONFIG=config.json blender -b -P build.py`, luego `blender -b escena.blend -a` (300 cuadros, unos 2 s por cuadro en una Mac M) y el `ffmpeg` del encabezado de `build.py`.
6. **Sonido:** pop, swish y golpe sordo graves en cada corte y en el cambio de canal. Nada agudo (nada por encima de ~3 kHz), sin timbres ni clics.

## Lista de revisión (cuadro por cuadro)
1. ¿El avatar tiene volumen (luz y sombra suaves, brillo en pelo y labios) y no se ve plano?
2. ¿Los ojos se ven completos (iris y brillo) y no hundidos en la cara?
3. ¿Cada escena de la tele muestra lo que dice la frase en ese momento?
4. ¿La palabra clave entra con corte seco, sin rebote ni temblor?
5. ¿Hay algo encima de y < 180 o debajo de y > 1650 que no sea el cuerpo del avatar?
6. ¿El CTA es tu palabra y se teclea igual en la tele y en la tarjeta?

Si algo da «no», se corrige y se vuelve a pasar la lista.

## Reglas del estilo
- **Tres pisos fijos:** titular arriba a la izquierda, la tele al centro y el avatar abajo a la derecha. La tarjeta va entre la tele y el avatar.
- **La tele es un objeto 3D:** tiene cavidad, cristal con reflejos y perillas, y el contenido vive en 3 capas con paralaje real. En cada corte de frase la perilla gira y 4 cuadros de trama gruesa tapan el salto.
- **Cámara viva todo el tiempo:** empuje continuo con un vaivén suave y desenfoque de lente. Nunca queda quieta.
- **Avatar con volumen:** materiales con luz real (piel translúcida con poro, pelo con hebras y brillo, ropa con tejido y lustre, metal pulido) y contorno de tinta fino. Lleva contraluz cálido y relleno suave. No vuelvas al sombreado plano de 2 tonos.
- **Letras:** serif itálica chica para los conectores y una letra negra enorme para la clave. Un color de acento por frase.
- **Sin gancho textual encima del avatar:** el titular de cada frase hace de gancho.

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/build.py` | Toda la escena por código: tele, escenas, tarjetas, titulares, avatar con volumen, cámara y render. |
| `plantilla/config.json` | Palabra del CTA y rasgos del avatar (ejemplo con un avatar genérico y «GUÍA»). |
| `plantilla/fuentes/` | Archivo Black, Instrument Serif Italic y Montserrat (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit. |

## Errores que ya costaron un rechazo (no repetir)
- **Avatar plano, sin volumen ni textura** (sombreado de 2 tonos). Se corrigió con materiales de luz real, mechones laminados con punta y ojos con iris.
- **Mechones como «salchichas»** (cápsulas gordas): el pelo lacio va en láminas finas que nacen en la raya y terminan en punta.
- **Ojos hundidos o medio cerrados:** los ojos se giran con la curva de la cara (`rotation_euler.z = ±24°`) y el párpado va arriba del iris.
- **Cejas tristes** (la punta de adentro más alta): la ceja va con la punta de afuera apenas más baja.
