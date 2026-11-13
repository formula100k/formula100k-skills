---
name: efecto-domino-f100k
description: "Reel sin cara en Blender, sin créditos: cientos de fichas de dominó caen en cadena y al final escriben tu palabra de CTA. Usar con «plantilla Efecto dominó», «reel de dominó»."
argument-hint: [tema + 3 frases cortas + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Efecto dominó (reel sin cara en Blender)

Una ficha de color empieza todo. La ola recorre una serpentina de 3 filas sobre una mesa de nogal, y cada ficha, al caer, muestra su dorso de color: la ola va «pintando» el recorrido. Entre fila y fila hay frases pintadas en la mesa que aparecen con corte seco justo cuando la ola pasa por ahí. Al final, la cadena baja por unos conectores a una fila de fichas cortas que, de pie, no se leen; cuando caen, escriben tu palabra de CTA. Todo se simula con física real (cuerpos rígidos), se hornea a keyframes y se renderiza gratis en tu compu: 1080×1920, 30 fps, 10,5 s.

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`. En este estilo, su acento va en el dorso de las fichas que escriben la palabra (`colores.letras`), su segundo color en el dorso de la cadena (`colores.cadena`) y su color claro en las frases de la mesa (`colores.texto`). La mesa, la luz y la cámara se quedan. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **El tema en 3 frases cortas** que cuenten una reacción en cadena:
   - **inicio**: lo que empieza todo, junto a la primera ficha (una cifra o palabra enorme + una palabra chica, ej. «1 idea»). Si usas una cifra, que sea real.
   - **fila 1**: parte chica en itálica + palabra clave enorme (ej. «Una cosa LLEVA»).
   - **fila 2**: parte chica + palabra clave enorme (ej. «a la OTRA»).
2. **Tu palabra de CTA** (la que escriben las fichas), ligada al tema y a tu regalo. Una sola palabra, de 3 a 8 letras: A–Z, Ñ y vocales con tilde. No uses «YO».
3. **La palabra chica del CTA** («Comenta», «Escribe»).
4. **Voz (opcional):** tu grabación o una voz clonada. Sin voz, la pieza dura 10,5 s y funciona como gancho visual o loop.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: `plantilla/build.py`, `plantilla/config.json`, `plantilla/post.sh` y `plantilla/fuentes/`.
2. **Escribe `config.json`:** `cta` (la palabra de las fichas), `textos` (`inicio`, `fila1`, `fila2` con `chica` y `grande`, y `cta_chica`) y `colores` (`cadena`, `letras`, `ficha` para el frente marfil y `texto`). Las frases que no caben entre las filas se achican solas; la serpentina se estira sola si tu palabra es larga.
3. **Simula y arma la escena (≈ 2 min):** `DOM_CONFIG=config.json DOM_SCALE=50 DOM_SAMPLES=16 blender -b --factory-startup -P build.py`. Al terminar imprime `[domino] eventos: {...}` y lo guarda en `eventos.json`: **`sin_caer` tiene que estar vacío** (`[]`). Si sale alguna ficha ahí, es de una letra que quedó trabada: revisa esa letra (ver «Agregar o corregir una letra»).
4. **Prueba rápida (3 cuadros):** `blender -b escena.blend -o //prueba_#### -f 45 -f 175 -f 315`. Revísalos con la lista de abajo. Para cambiar solo textos, luz o cámara sin volver a simular, usa `DOM_CACHE=1` (reutiliza `sim_cache.json`; si cambiaste la palabra, NO lo uses).
5. **Render completo:** `DOM_CONFIG=config.json blender -b --factory-startup -P build.py` (sin DOM_SCALE), luego `blender -b escena.blend -a` (315 cuadros) y `./post.sh`, que arma `muestra.mp4` con viñeta y grano finos, `poster.jpg` (cuadro 300), `hoja.jpg` (9 cuadros) y mide si hay tramos quietos.
6. **Verifica con la hoja de 9 cuadros** (`hoja.jpg`) con la lista de revisión.
7. **Sonido:** clac grave y seco de fichas en cadena (que suba de densidad con la ola) y un golpe sordo cuando cae la palabra. Nada agudo (nada por encima de ~3 kHz), sin timbres, teclas ni clics.

## Lista de revisión (cuadro por cuadro)
1. ¿El primer segundo muestra la ficha de color en macro, nítida, y la ola arranca antes del segundo 1?
2. ¿Cada frase aparece cuando la ola pasa por ella, con corte seco y sin temblor?
3. ¿Todas las fichas cayeron? (`sin_caer: []` en `eventos.json`).
4. ¿La palabra del CTA se lee completa desde arriba en el último segundo, con cada letra cerrada (sin huecos que cambien la letra)?
5. ¿Hay algo clave encima de y < 180 o debajo de y > 1650 (zonas de la interfaz)?
6. ¿La cámara nunca se detiene? (`post.sh` debe decir «sin congelados»).

## Agregar o corregir una letra
El alfabeto está en `GLYPHS` dentro de `build.py`. Cada letra es una lista de trazos; el que empieza en `TOP` baja desde la cadena (en coral) y al entrar en la letra cambia al color de las letras. Los demás trazos nacen de otro (`p`) cuando cae su ficha más cercana (`m="near"`) o su última ficha (`m="last"`). Reglas para que caigan bien: curvas de radio ≥ 0,25; dos trazos paralelos a ≥ 0,3 de distancia; ningún trazo cruza a otro (si se cruzan, pártelo en dos que nacen del centro, como la X). Después de tocar una letra, simula y revisa `sin_caer`.

**Estado del alfabeto (11-nov-2026):** probadas con la física y sin fichas trabadas: A, Á, B, C, D, E, F, G, H, I, Í, J, K, L, O, Ó, P, R, U. Corregidas después de una prueba y aún sin volver a simular: É, M, N, Ñ. Sin probar todavía: Q, S, T, Ú, V, W, X, Y, Z. Con una letra sin probar, mira `sin_caer` antes del render completo.

## Reglas del estilo
- **De pie no se lee, tumbadas sí:** la palabra solo aparece cuando caen sus fichas. No la escribas en la mesa.
- **Física real, nunca animada a mano:** la cadena se simula con cuerpos rígidos (60 subpasos) y se hornea a keyframes. Las ramas de cada letra arrancan con un empujón invisible cuando cae la ficha que las alimenta.
- **Doble revelado de color:** frente marfil, dorso de color. La ola pinta el recorrido al pasar.
- **Cámara calculada desde la ola:** macro a ras de mesa → travelling que sigue el frente de caída → grúa que sube → cenital con empuje a la palabra. El foco va enganchado a la ola.
- **Fichas cortas para las letras:** las letras usan fichas más bajas que la cadena para resolver las curvas.
- **Letras pintadas en la mesa:** serif itálica chica + letra negra enorme, en un color claro que se lea sobre la madera.
- **Luz de mesa:** clave cálida lateral con sombras largas, relleno frío suave, motas de polvo en la luz. La laca de las fichas sin reflejo lechoso (las luces de área van sin especular).

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/build.py` | Toda la escena por código: alfabeto de fichas, serpentina, mesa, textos, simulación física, cámara desde la ola, luz y render. Genera `escena.blend`, `eventos.json` y `sim_cache.json`. |
| `plantilla/config.json` | Palabra del CTA, frases y colores (ejemplo genérico con «GUÍA»). |
| `plantilla/post.sh` | Arma `muestra.mp4` (viñeta y grano finos), `poster.jpg`, `hoja.jpg` y mide tramos quietos. |
| `plantilla/fuentes/` | Archivo Black e Instrument Serif Italic (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto con la config genérica. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit. |

## Errores que ya costaron una vuelta (no repetir)
- **Fichas atascadas** en letras con trazos que se pisaban (la B y la R): dos trazos nunca comparten el mismo lugar.
- **Letras ilegibles** con fichas altas: las letras van con fichas cortas.
- **Reflejo lechoso** de las luces sobre la laca: las luces de área van con `specular_factor = 0`.
- **Colores lavados:** los colores de las fichas van con poco brillo propio; si tu color sale pálido, oscurécelo un poco en `config.json`.
- **Cámara cenital plana durante 3 s** mientras cae la palabra: la palabra se ve caer en oblicuo, con grúa subiendo, y solo al final queda cenital.
