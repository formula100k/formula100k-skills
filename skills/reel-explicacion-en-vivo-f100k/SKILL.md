---
name: reel-explicacion-en-vivo-f100k
description: Arma el reel «explicación en vivo», un reel hablado a cámara de 30 a 90 s donde la persona va dentro de una tarjeta en la mitad de abajo y, arriba, un panel animado dibuja lo que va diciendo, frase por frase; va por bloques (demostraciones), cada uno con su fondo y su título, y cierra con un mosaico de las tomas y una caja de comentario con la palabra del CTA. Incluye la biblioteca de 15 paneles (contador, puntos, barra, reloj, lista, mosaico…), la maqueta, la hoja de rodaje y el montaje con las tomas reales. Usar cuando digan «yo hablo y Claude lo dibuja», «panel arriba y yo abajo», «explicación en vivo», «te lo pruebo con N negocios», o pasen un guion por demostraciones y pidan el panel animado sobre su video. NO usar para un reel entero en animación sin persona, para clips animados sueltos (animacion-dibujada-f100k), para una toma con una lista al costado (lista-sobre-video-hablado-f100k), para cortar silencios o subtitular (editor-video-formula100k) ni para un guion que no explica nada dibujable.
argument-hint: "[tema o guion] [carpeta de salida]"
---

# Reel · explicación en vivo

Tú hablas a cámara; arriba, un panel dibuja lo que dices en el momento en que lo dices. 1080×1920, 30 cuadros por segundo.
Cada cuadro del panel se dibuja con código (canvas), así que todo queda atado a la duración de cada frase y se rehace con un comando.

Mira primero `ejemplo/muestra.jpg` (hoja de cuadros de una panadería: tres bloques, tomas sustitutas) y su `ejemplo/guion.json`.

## Antes de empezar: lo que necesita (compruébalo primero)

Esta skill no dibuja sola: usa el motor de otras dos skills, que deben estar instaladas **junto a esta** (en la misma carpeta de skills) o en `~/.claude/skills`.

| Skill | Qué usa de ella | ¿Viene en el paquete de FÓRMULA 100K? |
|---|---|---|
| `animacion-dibujada-f100k` | `nucleo/nucleo.js` y `scripts/renderizar.mjs` | Sí. La primera vez: `npm i` dentro de su carpeta (instala `playwright-core`) |
| `reel-explicado-animado-f100k` | `scripts/armar.mjs` | **Todavía no.** Sin ella, `maqueta.mjs`, `tomas-de-prueba.mjs` y `montar.mjs` se detienen con «Falta la skill reel-explicado-animado-f100k» |

Si falta `reel-explicado-animado-f100k`, **dilo y detente**: no la sustituyas por otro script ni inventes el paso. Mientras tanto sí puedes dejar listo el guion por bloques (`guion.json`) y la elección de paneles (pasos 1 a 3).

Además: Node 18+, ffmpeg, Google Chrome, `say` (solo macOS; es la voz de la maqueta y de las tomas de prueba) y, para el montaje, `uvx` (transcribe con mlx-whisper, solo Mac con chip Apple).

## Cuándo sí y cuándo no

Sirve cuando el guion **explica** algo que se puede contar, medir o comparar: un precio, un reparto de horas, un proceso, un porcentaje.
No sirve para opinión, historia personal o motivación: el panel se queda sin nada que dibujar. Si en una frase no sabes qué se dibuja, la frase sobra.

## Cómo está armado

| Encuadre | Qué se ve | Cuándo |
|---|---|---|
| `tarjeta` (base) | Panel arriba, tu video en una tarjeta redondeada abajo | Casi todo el reel |
| `completa` | Tú a pantalla completa con el título del bloque encima; vuelve a la tarjeta en 0,28 s | La primera frase de cada demostración («Si vendes pan.») |
| `panel` | El panel solo, centrado; tú no sales | 3 o 4 s en una gráfica que pide todo el cuadro |

Lo que **no cambia nunca**: el subtítulo de 1 a 3 palabras sobre tu pecho y la tarjeta. Lo que cambia en cada bloque: el fondo entero
(un tema de color por demostración), el título y lo que llevas en la mano.

## El flujo

`SK=~/.claude/skills/reel-explicacion-en-vivo-f100k` · `DEST` = carpeta de la pieza (por ejemplo `~/Documents/<PROYECTO>/`).

### 1. Elige de 3 a 5 demostraciones
Una promesa («te lo pruebo con N casos») y N casos del avatar de quien publica. Orden: del más comercial (un producto con precio)
al más sorprendente (un dato que se comparte). Estructura probada:

1. **Gancho que se cumple en el acto** (1 bloque, 3 o 4 frases): nombras el formato mientras ya está pasando; por qué importa; «te lo pruebo con N».
2. **N demostraciones** (1 bloque cada una, 3 a 5 frases, 9 a 15 s).
3. **Cierre** (1 bloque): mosaico de las N, la frase para llevarse y el CTA con palabra.

### 2. Escribe el guion por bloques
- **Frases cortas, una cosa dibujable por frase.** Cada frase nombra un objeto o una cifra (hogaza, etiqueta, rebanadas), no una idea abstracta.
- **La primera frase del bloque es el título** («Si vendes pan.») y va con `"encuadre": "completa"`.
- **La cifra más fuerte es el remate del bloque** (la última frase).
- **De dónde sale cada dato.** Anota la fuente de cada número. Dato real → `"fuente"` del bloque, visible en pantalla. Cuenta inventada para
  ilustrar → `"nota": "ejemplo…"`, visible arriba a la derecha. Sin fuente y sin rótulo de ejemplo, el número no va. La aritmética se comprueba a mano.
- **La imagen cumple lo que dice el texto:** si dices «dieciséis rebanadas», se llenan 16 puntos. No pongas un panel que no corresponde a la frase.
- **Las frases se dicen tal cual se escriben:** el montaje busca el principio de cada frase en la voz.
- El CTA: «comenta PALABRA» hacia un regalo que exista. La palabra va en `palabraCta` y se planta antes en el guion si se puede.

### 3. Elige un panel para cada frase
Lee `references/paneles.md` (los 15 paneles y sus parámetros) y llena `guion.json`:

```bash
mkdir -p "$DEST" && cp $SK/plantilla/guion.json "$DEST/guion.json"
```

```json
{ "palabraCta": "HORNO",
  "temas": { "pan": { "fondo": "#f3ead9", "tinta": "#2b2118", "ac": "#b8642a", "gris": "#8b7a68", "panel": "#e7dcc6", "pelo": "#cfc1a6" } },
  "bloques": [ { "nombre": "pan", "tema": "pan", "ceja": "SI VENDES PAN", "nota": "ejemplo: precio ilustrativo", "utileria": "una hogaza en la mano",
    "frases": [
      { "txt": "Si vendes pan.", "encuadre": "completa", "panel": { "tipo": "titulo", "arriba": "Si vendes", "palabra": "pan", "icono": "pan" } },
      { "txt": "Esta hogaza cuesta ocho dólares.", "panel": { "tipo": "contador", "objeto": "pan", "prefijo": "$", "hasta": 8, "queda": true } },
      { "txt": "Rinde dieciséis rebanadas.", "panel": { "tipo": "puntos", "n": 16, "singular": "rebanada", "plural": "rebanadas",
          "division": { "cuenta": "$8 ÷ 16 =", "resultado": "50 ¢", "etiqueta": "por rebanada" } } },
      { "txt": "Cada rebanada sale a cincuenta centavos.", "panel": { "sigue": true } } ] } ] }
```

- Un bloque = una toma = un tema de color. `"queda": true` deja el panel dibujado; `{ "sigue": true }` es el siguiente paso del mismo panel.
- **La pieza se describe aquí. No edites `plantilla/pieza.src.html` ni `paneles.js` por pieza.** Si de verdad falta un panel o un icono,
  agrégalo a `paneles.js` como uno más de la biblioteca, parametrizado.
- Texto en español neutro y de tú. Nada de marca ajena: paleta, letra y dibujos propios.

### 4. Maqueta con voz de computadora

```bash
node $SK/scripts/maqueta.mjs "$DEST" --hojas     # rápido: solo la hoja de contacto, para corregir el dibujo
node $SK/scripts/maqueta.mjs "$DEST"             # maqueta.mp4, maqueta-con-voz-guia.mp4, revision/ y HOJA-DE-RODAJE.md
```

Mide cada frase con `say` (solo para estimar: **no es la voz final**), dibuja el reel con una silueta donde va el video y saca
`revision/hoja-maqueta.jpg` (un cuadro cada 1,5 s) y `revision/transicion-*.jpg` (cada salto de encuadre a tamaño real).
**Abre la hoja y los cuadros con Read y míralos**: textos que se pisan, un panel vacío, una cifra que no coincide con lo dicho.
Corrige en `guion.json` y repite. Con `--paneles` saca además un MP4 por bloque (panel + hueco) por si alguien monta a mano.

### 5. Hoja de rodaje
`HOJA-DE-RODAJE.md` sale sola del guion: una toma por bloque, lo que se dice, el objeto y qué frases van a pantalla completa. Lo que debe saber quien graba:

- Vertical, celular quieto, mismo lugar y luz. Cara en el tercio de arriba; en la tarjeta se ve un cuadrado de la cabeza al pecho.
- En las frases a pantalla completa, aire sobre la cabeza: ahí va el título.
- El objeto, a la altura del hombro y dentro del cuadrado. El subtítulo cae sobre el pecho.
- Medio segundo de silencio al empezar y al terminar. Cada toma dos veces.
- Las tomas elegidas van en `"$DEST/tomas/toma-1.mov"`, `toma-2.mov`… (una por bloque, en orden).

### 6. Prueba el montaje antes de grabar (opcional, recomendado la primera vez)

```bash
node $SK/scripts/tomas-de-prueba.mjs "$DEST"
node $SK/scripts/montar.mjs "$DEST" --tomas="$DEST/tomas-de-prueba" --salida="$DEST/prueba.mp4"
```

Fabrica tomas sustitutas (una silueta sobre un fondo de color + las frases con voz de computadora) y las monta de punta a punta.
Sirve para ver el recorte, el salto a pantalla completa y el mosaico. Dilo siempre: no es una persona ni su voz.

### 7. Montaje con las tomas reales

```bash
node $SK/scripts/montar.mjs "$DEST" --solo-medir   # revisa lo que oyó y dónde ubicó cada frase
node $SK/scripts/montar.mjs "$DEST"                # reel.mp4 + revision/hoja-reel.jpg + revision/reel/transicion-*.jpg
```

Qué hace: transcribe cada toma con marcas por palabra, ubica el inicio de cada frase, escribe la duración real, **vuelve a dibujar los paneles
con esos tiempos**, recorta la toma a cuadrado y la pone en la tarjeta con esquinas redondeadas (o a pantalla completa donde toca),
saca los subtítulos de 1 a 3 palabras **de la voz** (no del estimado), llena el mosaico con un cuadro o un clip mudo de cada toma,
une los bloques y normaliza el audio a −16 LUFS.

- **Recorte por toma:** `"toma": { "y": 0.15, "x": 0.5, "zoom": 1 }` en el bloque, o `--y=0.2` (todas) y `--y3=0.3` (solo la toma 3).
  `y` = de dónde sale el cuadrado: 0 pegado arriba, 1 pegado abajo. Si la cara queda cortada, sube o baja `y` y vuelve a montar.
- **Mosaico con tomas:** en el panel `mosaico`, `"tomas": "foto"` o `"clip"`. El segundo de donde sale: `"toma": { "mosaico": 3.2 }`.
- **Si una frase no aparece** (cambió una palabra, o se trabó): el script se detiene y dice cuál. Escribe a mano en `tomas/tiempos-manual.json`
  el segundo en que empieza cada frase de esa toma: `{ "3": [0.42, 1.9, 5.1, 8.0] }`.
- Ya contemplado: Whisper pega la primera palabra al segundo 0 (se corrige con el fin del silencio inicial) y escribe los números en cifras
  («ciento sesenta y ocho» → «168»): el guion y lo oído se comparan con los números ya convertidos.

### 8. Revisión (no entregues sin esto)
1. Abre `revision/hoja-reel.jpg` y **todos** los `revision/reel/transicion-*.jpg`. Busca: cara cortada por el borde de la tarjeta, el título
   encima de la cara a pantalla completa, el objeto fuera del cuadrado, subtítulo sobre la boca.
2. Mira en el registro del montaje los avisos «ubicada solo por…» y comprueba esas frases en el video.
3. Compara lo oído con el guion: si dijo otra cifra, el panel miente. Se regraba o se cambia el panel.
4. Entrega `reel.mp4`, la hoja y un LEEME corto: de dónde sale cada dato, qué es ejemplo y qué queda por confirmar.

## Reglas del dibujo
- Zona útil del panel: de y 150 a y 860. El rubro va arriba a la izquierda y «ejemplo» arriba a la derecha; no los tapes.
- Algo nuevo en el panel cada 0,5 a 1,5 s; nunca más de 2 s quieto. Una frase de más de 5 s necesita un panel con varios momentos o partirse.
- Un solo color de acento por bloque. Verde para lo que sale bien, rojo para lo que falla o el límite.
- El primer cuadro del reel ya tiene el gancho escrito (panel `voz` o `titulo`): es la portada.
- Nada de manos, caras ni cuerpos dibujados. La mascota, si la hay, es pixel art y viene en `guion.json`.
- Nada de `Math.random` ni fechas en los paneles: cada cuadro sale igual siempre.

## Errores conocidos
| Síntoma | Causa y arreglo |
|---|---|
| «el panel X no existe» | El `tipo` está mal escrito. La lista sale en el mensaje |
| El título tapa la cara a pantalla completa | Falta aire arriba en la toma. Baja `completa.escala` (0.45) o regraba con la cabeza más abajo |
| A pantalla completa la toma sale recortada o descentrada | La toma no es vertical 9:16: se agranda hasta cubrir el cuadro. Muévela con `"toma": { "xCompleta": 0.5, "yCompleta": 0.3 }` |
| Un panel termina antes o después de la frase | La frase se ubicó mal: mira `--solo-medir` y corrige con `tiempos-manual.json` |
| El subtítulo trae una palabra que no dijo | Los subtítulos usan el texto del guion con los tiempos de la voz: corrige el guion o regraba |
| `renderizar.mjs` frena por «anatomía» | Agregaste un dibujo con nombres de partes del cuerpo en `paneles.js`. Usa formas simples |
| No transcribe | Falta `uvx` (`brew install uv`) o no es Apple Silicon: usa `tiempos-manual.json` |

## Límites honestos (dilos al entregar)
- El cambio de ropa con barrido de luz y la persona recortada sin tarjeta sobre el fondo no están: aquí cada bloque es una toma aparte y el cambio es un corte.
- A pantalla completa solo se lee bien el panel `titulo` (queda en dos líneas arriba). Los demás paneles están pensados para la tarjeta.
- La tarjeta no cambia de tamaño dentro de un bloque: el panel no «empuja» la tarjeta.
- La maqueta mide con voz de computadora; los tiempos reales salen solo del montaje con las tomas.
- Si el CTA depende de una automatización de mensajes, confirma que esté armada antes de publicar. Esta skill no publica nada.
