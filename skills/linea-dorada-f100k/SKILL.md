---
name: linea-dorada-f100k
description: "Reel sin cara en Blender, sin créditos: una línea de luz dorada sobre negro que se transforma en una figura por frase. Usar con «plantilla Línea dorada», «reel con línea de luz»."
argument-hint: [tema + 4 frases cortas con su figura + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Línea dorada (reel sin cara en Blender)

Una sola línea de luz dorada cuenta toda la historia. En los primeros 1,5 s se dibuja sola mientras la cámara persigue su punta; después se transforma, sin cortes, en una figura por frase. Cada transformación pasa por un aro limpio, lanza una onda de luz y hace que la línea brille más. Cada figura trae sus luces: estrellas para la luna, antenas y un latido en cada asistente del equipo, el foco que se enciende, mini pantallas que salen del celular, humo en la chimenea de la fábrica, destellos alrededor del regalo y un latido dentro del corazón. Arriba, la frase entra palabra por palabra: lo chico en itálica crema y la clave enorme en dorado. Todo se arma por código en Blender (EEVEE), se renderiza gratis en tu compu y queda en 1080×1920 a 30 fps, 300 cuadros (10 s).

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`. En este estilo, su color de acento reemplaza el dorado de la palabra clave (`colores.clave` en `config.json`) y su color de texto puede reemplazar el crema de las palabras chicas (`colores.texto`). La línea se queda dorada, porque es el estilo; solo se cambia (`colores.linea`) si ella lo pide, y siempre por un color claro y cálido que brille sobre el negro. El fondo negro, el polvo y el piso que refleja se quedan. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **El tema y 4 frases cortas** (~2 s cada una). Cada frase tiene de 1 a 3 palabras chicas y una clave enorme, por ejemplo «mientras tú / DUERMES». La clave tiene que caber en una línea: de 1 a 2 palabras.
2. **La figura de cada frase,** que **muestre lo que dice**: `luna` (de noche, mientras duermes), `equipo` (tres asistentes), `foco` (una idea), `telefono` (un celular con play; puede soltar de 0 a 8 mini pantallas con `piezas`), `fabrica` (producción en serie), `regalo` (lo que te llevas) o `corazon` (algo que se quiere o se cuida). No repitas la misma figura en dos frases seguidas.
3. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO». La frase del CTA va sola al final con su figura (por defecto, `regalo`).
4. **Cifras:** si una clave lleva número («8 VIDEOS»), tiene que ser real, y `piezas` del celular tiene que coincidir con ese número. No inventes cifras.
5. **Voz (opcional):** tu grabación o una voz clonada, de unos 10 s. Sin voz, la pieza se sostiene sola con texto.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: `plantilla/build.py`, `plantilla/config.json`, `plantilla/post.sh` y `plantilla/fuentes/`.
2. **Escribe `config.json`:**
   - `frases`: exactamente 4, cada una con `chica`, `grande`, `figura` (y `piezas` si la figura es `telefono`).
   - `cta_chica` («comenta», «escribe»…), `cta` (tu palabra) y `cta_figura`.
   - `colores`: `clave`, `texto` y, solo si lo pide, `linea`, en hex.
   Si una frase es larga, la plantilla la achica sola para que no pase de 900 px de ancho; aun así, mejor corta.
3. **Si ninguna figura sirve,** agrega una en `build.py`: una función que devuelva una lista de puntos `(x, profundidad, altura)` dentro de un cuadro de ±1,4, trazada **de un solo trazo** (puede volver sobre sí misma), y regístrala en `FIGURAS`. Si quieres que traiga luces, agrega su `fx_<nombre>(h0, h1, fr)` con `punto(...)`. Usa `bez()` y `arco()` como las demás.
4. **Prueba rápida:** `LD_CONFIG=config.json LD_SCALE=50 LD_SAMPLES=12 blender -b -P build.py` y luego `blender -b escena.blend -f 40 -f 92 -f 160 -f 215 -f 290` (una por figura). Revisa esos 5 cuadros con la lista de abajo antes de renderizar todo.
5. **Render completo:** `LD_CONFIG=config.json blender -b -P build.py`, luego `blender -b escena.blend -a` (300 cuadros; unos 2–3 s por cuadro en una Mac M) y `./post.sh`, que arma `muestra.mp4` con grano y viñeta finos, `poster.jpg` y `cuadros.jpg` (hoja de 9 cuadros) y mide que no haya tramos quietos.
6. **Verifica con la hoja de 9 cuadros** (`cuadros.jpg`) y la lista de revisión.
7. **Sonido:** un desliz grave mientras se dibuja la línea, un swish grave en cada transformación y un golpe sordo cuando entra la clave. Nada agudo (nada por encima de ~3 kHz): sin campanitas, brillos sonoros, timbres ni clics, aunque el estilo sea dorado.

## Lista de revisión (cuadro por cuadro)
1. ¿Cada figura se reconoce de un vistazo y muestra lo que dice su frase?
2. ¿La clave se lee entera, en una línea, más grande que lo chico y en tu color?
3. ¿Las palabras entran una por una con corte seco, sin rebote, temblor ni animación de entrada?
4. ¿La línea se ve como luz (brilla, se refleja en el piso) y no como un alambre opaco?
5. ¿Las mini pantallas del celular coinciden con la cifra que dices?
6. ¿El CTA es tu palabra y no es «YO»?
7. ¿La cámara nunca se queda quieta (post.sh dice «sin congelados»)?

Si algo da «no», se corrige y se vuelve a pasar la lista.

## Reglas del estilo
- **Una sola línea, de principio a fin.** Nada se corta ni aparece de la nada: la línea se dibuja y después se transforma. Toda transformación cruza por un aro limpio para que el paso de una figura a otra se lea.
- **Línea en 3D, no un trazo plano:** tiene profundidad, la cámara gira a su alrededor y se refleja en el piso.
- **Cámara viva:** al principio persigue la punta que dibuja; después gira suave alrededor y se acerca y aleja con cada frase. Desenfoque de lente con foco en la línea.
- **La luz respira:** la línea brilla más en cada transformación y una onda sale del centro.
- **Fondo negro cálido con polvo dorado** en dos capas que derivan lento. Nada de fondos de color ni degradados chillones.
- **Letras de diseño:** serif itálica chica (Instrument Serif) para los conectores y serif de contraste enorme (DM Serif Display) para la clave. Tamaños distintos, corte seco, sin brillo en el texto.
- **El texto vive pegado a la cámara,** arriba y centrado, siempre del mismo tamaño en pantalla, mientras la línea se mueve en 3D debajo.

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/build.py` | Toda la escena por código: la línea y sus 7 figuras, luces por figura, polvo, piso, cámara, texto y brillo. |
| `plantilla/config.json` | 4 frases con su figura, CTA y colores (ejemplo genérico con «GUÍA»). |
| `plantilla/post.sh` | De los cuadros a `muestra.mp4`, `poster.jpg` y `cuadros.jpg`, y mide los tramos quietos. |
| `plantilla/fuentes/` | DM Serif Display e Instrument Serif Italic (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit. |

## Lo que ya se sabe (para no repetir)
- **Los tiempos están fijos** (`MORPH`): 4 transformaciones de 0,8 s y el texto entra 10 cuadros después de que arranca cada una. Si cambias la duración, mueve `NF`, `MORPH`, `DIBUJO_FIN` y los puntos de distancia de la cámara (`D_PTS`) juntos.
- **El brillo es del compositor** (bloom solo sobre lo que pasa el umbral): si la línea se ve opaca, sube la fuerza de su emisión, no la del texto.
- **Una figura muy grande** se sale del cuadro cuando la cámara gira: mantén los puntos dentro de ±1,4 a lo ancho.
- **Duración:** la plantilla hace un bloque de 10 s. Para un reel más largo, haz un bloque por tramo (otra `config.json`) y únelos en edición.
