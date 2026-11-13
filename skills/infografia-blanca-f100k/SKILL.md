---
name: infografia-blanca-f100k
description: "Reel sin cara en Blender, sin créditos: fondo crema, tarjetas con borde negro y las pantallas de tu app armándose paso a paso. Usar con «plantilla Infografía blanca», «reel infografía crema»."
argument-hint: [tema o guion de 4 pasos + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Infografía blanca (reel sin cara en Blender)

Una mesa crema vista desde arriba. Sobre ella hay 4 estaciones, cada una con una tarjeta de cartón grueso de borde negro que recrea una pantalla: la cámara viaja de una a otra en una sola toma, sin cortes, con un desenfoque ligero de lente. En cada estación algo se construye a la vista (un reloj que avanza, tareas que se prenden una por una con su barra, tarjetas de video que salen mientras sube un contador, una palabra que se teclea). Arriba, pegada a la cámara, una barra de 4 casillas y una píldora marcan el tramo. Todo se arma por código en Blender (EEVEE), se renderiza gratis en tu compu y queda en 1080×1920 a 30 fps, 10 s.

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`. En este estilo, su color de acento reemplaza el naranja (`colores.acento` en `config.json`): la luna, la tira de la palabra clave, las barras que se llenan, el botón PUBLICAR y la tarjeta del CTA. El fondo crema y la tinta negra se quedan (son el estilo); si su marca es oscura, como mucho cambia `tinta` por su color más oscuro. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **El tema y los 4 pasos.** Cada estación cuenta un paso con una pantalla y una frase corta:
   - **Paso 1 · el problema o la situación:** una pantalla chica (por defecto un reloj de madrugada) + una frase con UNA palabra clave enorme, por ejemplo «Tu equipo / TRABAJA / mientras duermes».
   - **Paso 2 · cómo funciona:** la ventana de una app con hasta 6 tareas que se prenden una por una + una frase con la clave en color («Hacen tus videos SOLOS»).
   - **Paso 3 · el resultado:** «1 [cosa] → N [cosas]» con N tarjetas que se construyen mientras sube el contador + un remate en píldora.
   - **Paso 4 · el CTA:** «Comenta [PALABRA]».
2. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO».
3. **La cifra del paso 3 tiene que ser real** (sale de tu guion o de tu caso). Si no hay una cifra real, usa el número de cosas que de verdad muestras (por ejemplo, 3 formatos) y no inventes.
4. **Voz (opcional):** tu grabación o una voz clonada. Sin voz, cada estación dura ~2,5 s a tiempo fijo.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: `plantilla/build.py`, `plantilla/config.json` y `plantilla/fuentes/`.
2. **Escribe `config.json`:**
   - `cta`: tu palabra (se teclea en la tarjeta naranja y en el campo de comentario, y sale en el comentario enviado).
   - `colores`: `acento`, `fondo` y `tinta` en hex.
   - `tramos`: las 4 etiquetas de la píldora de arriba (cortas: «01 EQUIPO», «02 TAREAS», «03 VIDEOS», «04 GUÍA»).
   - `estacion1`: `hora` (dos horas: la que se ve y la que sigue), `hora_chica`, `estado` (la píldora de la tarjeta) y `frase` = [conector chico, CLAVE ENORME, conector, remate].
   - `estacion2`: `app` (nombre de la ventana: genérico o el de tu servicio), `estado`, `tareas` (de 1 a 6, una palabra cada una) y `frase` = [parte chica, CLAVE en color].
   - `estacion3`: `origen` = [número, cosa], `cantidad` (de 1 a 8, real), `unidad` = [singular, plural] y `remate`.
   - `estacion4`: `pide` (la palabra chica sobre el CTA, por defecto «Comenta»).
   Los textos largos se achican solos para no salirse de su tarjeta, pero mientras más cortos, mejor se leen.
3. **Adapta el dibujo de las estaciones** en `build.py` solo si el tema lo pide (cada estación tiene su bloque `# ============ ESTACIÓN n`). La luna y el reloj de la estación 1 o las cabecitas de la estación 2 se cambian por la pantalla de la app de verdad cuando la tengas: **una captura real va antes que un ícono dibujado** (ponla como textura de imagen sobre la cara de la tarjeta).
4. **Prueba rápida:** `IB_CONFIG=config.json IB_SCALE=50 IB_SAMPLES=12 blender -b -P build.py` y luego `blender -b escena.blend -o //prueba/f_#### -f 45 -f 130 -f 218 -f 298`. Revisa esos cuadros con la lista de abajo antes de renderizar todo.
5. **Render completo:** `IB_CONFIG=config.json blender -b -P build.py`, luego `blender -b escena.blend -a` (300 cuadros, ~3,7 s por cuadro en una Mac M, unos 18 min) y el `ffmpeg` del encabezado de `build.py` (agrega grano fino y viñeta suave).
6. **Verifica con la hoja de 9 cuadros:** `ffmpeg -y -i muestra.mp4 -vf "select='not(mod(n-15\,33))',scale=360:-1,tile=3x3:padding=6" -frames:v 1 hoja.jpg` y revisa la hoja entera.
7. **Sonido:** pop, swish y golpe sordo graves cuando entra cada tarjeta, en el viaje de la cámara y al publicar. Nada agudo (nada por encima de ~3 kHz), sin timbres ni clics de teclado.
8. **Con voz:** mueve los cuadros de entrada de cada texto (`show(…, cuadro)` y `grow(…, cuadro)`) a la palabra hablada, y si el guion dura más de 10 s, alarga `F_END`, `DW` y `CHG` o suma estaciones a `ST`.

## Lista de revisión (cuadro por cuadro)
1. ¿Cada estación muestra lo que dice su frase en ese momento?
2. ¿La palabra clave entra con corte seco, sin rebote, sin temblor y sin brillo?
3. ¿La barra de arriba marca el tramo correcto y nunca la tapa nada?
4. ¿Hay un solo color de acento en todo el video? (todo lo demás, tinta negra sobre crema)
5. ¿Algún texto se sale de su tarjeta o queda tan chico que no se lee en el celular?
6. ¿La cifra del paso 3 es real y el CTA es tu palabra, igual en la tarjeta, el campo y el comentario?
7. ¿La cámara se mueve todo el tiempo? (ningún tramo quieto de más de 1,5 s)

Si algo da «no», se corrige y se vuelve a pasar la lista.

## Reglas del estilo (lo que lo hace bueno)
- **Una paleta mínima:** fondo crema casi blanco, tinta negra y UN solo acento. Es lo que hace que se lea como infografía y no como animación de colores.
- **Tarjetas que recrean pantallas reales:** ventana de app, campo de comentario, tarjetas de video. Son cartón con grosor: canto gris, aro negro grueso y cara crema, con sombra suave sobre la mesa.
- **Una sola toma continua:** la cámara viaja por la mesa de estación en estación, se levanta un poco al viajar e inclina y gira apenas. Una línea punteada une las estaciones en la mesa. Nunca hay corte entre pasos.
- **Barra de avance pegada a la cámara:** 4 casillas + píldora con el nombre del tramo. La que va en curso se pinta del acento, las hechas en negro.
- **Todo se construye a la vista:** las tareas crecen una por una y su barra se llena; el contador sube 1 → N sincronizado con cada tarjeta; la palabra del CTA se teclea letra por letra con cursor.
- **El CTA se actúa, no solo se dice:** la palabra se escribe en el campo de comentario, se enciende PUBLICAR y sale el comentario enviado.
- **Letras con contraste:** serif itálica chica para los conectores («Tu equipo», «mientras», «Comenta») y una palo seco negra enorme para la clave, en caja de acento.
- **Ritmo:** un cambio fuerte cada ~1 s y 0 % de tiempo quieto.
- **Sin olor a IA:** corte seco, nada rebota ni tiembla, sin brillos; grano fino y viñeta suave de cámara real.

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/build.py` | Toda la escena por código: mesa, tarjetas, 4 estaciones, barra de avance, cámara en toma continua y render. |
| `plantilla/config.json` | Palabra del CTA, colores y textos de las 4 estaciones (ejemplo genérico con «GUÍA»). |
| `plantilla/fuentes/` | Archivo Black e Instrument Serif Italic (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto (render de prueba a media resolución). |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit. |

## Errores a evitar (vistos en la muestra)
- **El tercio de abajo vacío** en la estación 1 y en la 4: si tu frase es corta, sube la tarjeta o agranda la clave; no dejes media pantalla de mesa sola.
- **Íconos en vez de capturas:** las cabecitas de robot funcionan para el ejemplo, pero con tu app de verdad usa su captura.
- **Una cifra de adorno:** el «8 videos» del ejemplo es ilustrativo. En tu video va la cifra real o el número de cosas que de verdad muestras.
- **Sin gancho golpe:** la tarjeta del paso 1 hace de apertura; si vas a subir el reel como trial, agrega encima el gancho de 2 a 5 palabras de tu sistema de ganchos en los primeros 2 s.

## Checklist final
- [ ] `config.json` con tu tema, tu CTA (no «YO») y, si hay brandkit, su acento.
- [ ] Cifras reales o ninguna.
- [ ] En pantalla, nada de jerga técnica (ni nombres de herramientas de IA, ni «prompt», ni código).
- [ ] Prueba de 4 cuadros revisada con la lista.
- [ ] Render completo + hoja de 9 cuadros revisada.
- [ ] Sonido grave sin pitidos; con voz, protocolo de corte con su sello.
