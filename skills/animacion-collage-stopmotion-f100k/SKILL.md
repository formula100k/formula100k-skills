---
name: animacion-collage-stopmotion-f100k
description: "Animación vertical corta tipo collage stop motion: escenarios de papel recortado por capas y tu figura recortada cambiando de pose y outfit. Usar con «collage stop motion», «yo recortada cambiando de outfit», «estilo whimsy». NO para editar video grabado (editor-video-formula100k)."
argument-hint: [frase del texto fijo]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Animación · collage stop motion

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Un clip de 9 s, 1080×1920, sin audio salvo que la persona traiga su pista (entonces los cortes de escenario y los
cambios de pose caen en los golpes: ver «Música, marca y serie»). Parece hecho a mano con tijeras: cada escenario se arma pieza por pieza, la persona
aparece recortada al centro y salta de una pose a otra, y encima queda una frase fija. Sirve para piezas de humor y de
identificación («yo ignorando… porque estoy…»), para mostrar outfits, productos o una mascota, y para abrir un reel.

Qué lo hace verse así (no lo rompas):

- **Nada se desliza.** Todo cambio cae en un «salto» (por defecto 4 cuadros de video = 7,5 saltos por segundo).
- **Las capas entran en orden**, de atrás hacia adelante, una cada pocos saltos.
- **La persona no se anima: se reemplaza.** Cada pose es una foto distinta y cambia con corte duro.
- **El texto no se mueve** y el escenario cambia con corte seco, sin transición.

## Qué pedirle a la persona

En un solo mensaje, solo lo que falte:

1. **La frase fija** (hasta ~75 letras). Con humor y de tú. Sin cifras ni resultados que no haya dado.
2. **Fotos**: de 3 a 6 fotos de cuerpo entero, de pie, sobre fondo liso y con buena luz; mejor si cambia de ropa o de pose.
   También sirven 2 o 3 bustos (se asoman detrás de un mueble o desde el borde de abajo). O un **clip** corto de cuerpo
   entero (ver «Poses desde un video»). Sin persona también funciona: una mascota, un producto o nadie.
3. **Escenarios**: 2 o 3 lugares (uno de afuera y uno de adentro contrastan bien). Si no dice, propón los del ejemplo.
4. Sus colores y su usuario, si quiere firma. Lee antes su **`marca.md`** (color, letra y movimiento); si no existe,
   copia `references/marca.md` de esta skill, pregunta lo que falte y déjaselo escrito.
5. Si va con **música**: su pista, o el tempo del audio que usará al publicar.

## Flujo

```bash
SKILL=~/.claude/skills/animacion-collage-stopmotion-f100k
DEST=<carpeta de salida>/<nombre-de-la-pieza>     # nunca dentro de la skill
mkdir -p "$DEST" && cp -R "$SKILL/plantilla/." "$DEST/"
```

1. **Recorta las fotos** y déjalas en `$DEST/assets/` (ver «Imágenes»). Mira cada recorte antes de usarlo.
2. **Llena `$DEST/config.js`**: texto, persona y la lista de escenarios con sus capas en orden. Campos abajo.
   Después corre **`node ajustar.mjs`** siempre que cambies un `dur`, las poses o `musica`: escribe la duración total
   en `index.html`, pone los tiempos sobre la música si la hay, e imprime la lista de cuadros para el paso 4.
3. **Valida:** `cd "$DEST" && hyperframes lint`. Cero errores. El aviso `nested_structure_needs_subcomposition` es esperado.
4. **Mira los cuadros** antes de renderizar (uno al inicio, uno a media armada y uno completo por escenario):
   ```bash
   hyperframes snapshot --at 0.2,1.5,3.0,3.6,4.5,5.6,6.6,7.6,8.6 --no-end --describe false
   ```
   Abre los PNG de `snapshots/` y revisa: la persona pisa el piso (no flota ni se hunde), ninguna capa le tapa la cara,
   los bustos no muestran el borde cortado, el texto se lee completo y no tapa la cara. Corrige y repite.
5. **Renderiza:** `hyperframes render --output <nombre>.mp4` (unos 10 s). Borra `snapshots/`.
   Con música: `node ajustar.mjs --mezclar <nombre>.mp4` deja `<nombre>-con-musica.mp4`.
6. **Revisa el MP4**, no solo los snapshots:
   ```bash
   ffmpeg -y -loglevel error -i <nombre>.mp4 -vf "fps=4,scale=216:-1,tile=9x4" -frames:v 1 hoja.jpg
   ```
   Lee `hoja.jpg`: capas en orden, cambio de pose visible, sin cuadros en negro.
7. Entrega la ruta del MP4 y di lo que falta: sin `musica` no trae audio (música y efectos se ponen en la edición);
   con `musica`, que la sincronizaste por tiempos y no la escuchaste: que la oiga antes de publicar.

**Duración.** HyperFrames lee la duración del HTML antes de correr el script. La escribe `node ajustar.mjs`: sin
música es la suma de los `dur` (máximo recomendado 12 s); con música, el último corte más el `dur` del último
escenario. No la cambies a mano.

## Música, marca y serie

Detalle común a todas las skills de animación: `references/ritmo-y-serie.md`. Lo propio de esta plantilla:

- **Música.** En `config.js`: `musica: { archivo: "assets/pista.mp3" }` (o `{ bpm: 120 }` si solo sabes el tempo).
  `node ajustar.mjs` mide la pista (`golpes.mjs`) y: cada **corte de escenario** va al golpe fuerte más cercano (o a un
  golpe, si no hay fuerte a menos de `tolerancia` segundos; 0,6 por defecto) y cada **cambio de pose** al golpe más
  cercano (se corre como mucho medio golpe; las poses de un solo salto no se tocan). Las capas siguen entrando con su
  `en` contado desde el corte. El video arranca en el primer golpe fuerte de la pista (`inicio` lo cambia). Imprime
  cuánto movió cada corte y cuántas poses quedaron sobre un golpe; si son pocas, acerca los `dur` de las poses a lo
  que dura un golpe (60 ÷ BPM segundos).
  La pista la trae la persona (propia o libre de derechos). Si va a usar un audio de Instagram: `{ bpm: … }` o
  `mezclar: false`, y el MP4 sale sin audio con los tiempos ya puestos a ese tempo.
- **Marca.** De `marca.md`: Color → colores de capas, `fondo`, `texto.color`, `texto.resalte` · Letra → `fuentes` ·
  Movimiento → `cuadrosPorSalto` (ritmo a saltos), `entra` y `pasos` de cada capa (de dónde entra y cuánto tarda),
  `persona.meneo`, `.brinco` y `.cada`, y los `dur` (cuánto se sostiene). La salida es siempre corte seco y no hay
  desenfoque ni frenado suave: son el estilo. Si la marca pide otra cosa, dilo al entregar.
- **Serie.** Para varias piezas, escribe antes `BIBLIA.md` (paleta, letra, textura de papel, `cuadrosPorSalto`,
  música y momentos obligados: por ejemplo, misma apertura rasgada, mismo lugar del texto, misma firma) y declara qué
  se toma de cada referencia. Revisa cada pieza contra esa lista mirando sus cuadros.
- **Efectos de otras librerías:** `references/efectos-open-source.md`. Agregar uno es editar `index.html`.
- `node scripts/probar-golpes.mjs` (en la skill) prueba el detector con pistas de tempo conocido.

## Campos de `config.js`

Lienzo de 1080×1920; `x`, `y`, `ancho`, `alto` en píxeles. Los tiempos (`en`, `dur`) van en segundos y se ajustan solos al salto más cercano.

### Generales

| Campo | Qué es |
|---|---|
| `cuadrosPorSalto` | Cuadros de video por salto. 4 = stop motion clásico; 3 = más nervioso; 5–6 = más lento y torpe |
| `semilla` | Número que decide el dibujo de estrellas, colinas, pinos y bordes rasgados. Cámbialo si no te gusta cómo cayeron |
| `fondo` | Color detrás de todo |
| `texto.contenido` | La frase. `*palabra*` la resalta con `texto.resalte`; `_palabra_` va en serif itálica |
| `texto.estilo` | `"suelto"` (letra chica blanca con sombra, como subtítulo) o `"etiqueta"` (tira de papel rasgado, color `texto.fondo`) |
| `texto.y`, `.ancho`, `.tamano`, `.color`, `.rot`, `.x` | Posición (por arriba), ancho de caja, tamaño de letra, color, giro y centro horizontal |
| `firma` | `{ texto, color }` abajo al centro, o `null` |
| `apertura` | `{ color }`: un papel que se rasga en 3 saltos al empezar. `null` = empieza directo |
| `persona` | `{ borde, colorBorde, meneo, brinco, cada }` o `null`. `borde` = contorno de sticker en px (0 = sin contorno); `meneo` = grados que se ladea; `brinco` = px que salta; `cada` = cada cuántos saltos |
| `fuentes` | `{ sans, serif }`. Solo fuentes del sistema |
| `musica` | `null`, `{ archivo }` o `{ bpm }`. Extras: `inicio`, `volumen`, `mezclar`, `tolerancia`, `toleranciaPoses`, `primerFuerte` |

### Cada escenario (`escenarios[]`)

| Campo | Qué es |
|---|---|
| `dur` | Segundos que dura. Entre 2 y 3,5 funciona; menos de 1,5 no alcanza a armarse |
| `capas` | Lista ordenada de atrás hacia adelante. La primera suele ser el fondo completo |
| `personaEntra` | `{ en, desde, pasos }`: cuándo aparece la primera pose y, opcional, desde qué lado entra a saltos |
| `poses` | Lista de poses que se alternan en orden y se repiten hasta que acaba el escenario (`repetir: false` = una sola vuelta) |

### Cada capa

| Campo | Qué es |
|---|---|
| `id` | Nombre, para referirla desde una pose (`detrasDe`) |
| `src` **o** `forma` | Imagen PNG sin fondo, **o** una forma de papel: `plano`, `ovalo`, `rasgado`, `colinas`, `pinos`, `estrellas`, `nube` |
| `x`, `y`, `ancho`, `alto` | Caja. En imágenes basta `ancho` (el alto sale solo). En formas, sin datos = lienzo completo |
| `color`, `grano` | Color y fuerza de la textura de papel (0 a 1; 0 la quita) |
| `patron`, `color2`, `tamano`, `fibra` | Solo `plano`: `ondas` (agua), `tablas`, `baldosas`, `rayas`, `cuadros`; `fibra: true` suma vetas de papel |
| `cantidad`, `tamano`, `relieve` | `estrellas` y `pinos`: cuántos; `estrellas`: tamaño; `colinas`: qué tan accidentadas (0 a 1) |
| `en` | Segundo, desde el inicio del escenario, en que aparece |
| `entra` | `corte` (aparece), `pop` (crece en 3 saltos), `arriba`, `abajo`, `izquierda`, `derecha` (llega desde fuera del cuadro) |
| `pasos` | Saltos que tarda en llegar. 2 = golpe; 7 = bajada lenta (la luna) |
| `rot`, `espejo`, `sombra`, `borde`, `opacidad`, `z` | Giro fijo, volteo horizontal, sombra de papel, contorno de sticker, transparencia, orden manual |
| `vaiven`, `brinco`, `cada` | Se ladea (grados) y salta (px) a saltos mientras dura el escenario. Para personas extra o plantas |
| `deriva` | `{ x, y, cada, saltos }`: se corre esos px en cada salto (nubes, un barco) |
| `hasta` | Segundo en que desaparece |

### Cada pose

| Campo | Qué es |
|---|---|
| `src` | PNG sin fondo |
| `x`, `pie` | Centro horizontal y **dónde pisa** (la base de la foto). Todas las poses de pie comparten `pie` |
| `alto`, `ancho` | Caja donde cabe la foto, pegada abajo y centrada. Persona de pie: alto 900–1000, ancho ~0,4 del alto |
| `dur` | Segundos que se queda. 0,4–0,53 = cambio rápido de outfit; 1,2 = se queda |
| `rot`, `espejo` | Giro y volteo. La misma foto volteada cuenta como otra pose |
| `detrasDe` | `id` de una capa: la pose queda detrás de ella. Para **bustos**: `pie` dentro del mueble para esconder el corte |

Varias personas a la vez: ponlas como capas con `src`, `borde` y `vaiven`.

## Imágenes

En este orden:

1. **Fotos reales**, recortadas gratis y en local (Mac y Windows; la primera vez en Windows descarga el modelo y tarda unos minutos):
   ```bash
   node ~/.claude/skills/animacion-dibujada-f100k/scripts/sistema.mjs recortar foto.jpg "$DEST/assets/pose-1.png"
   ```
   Si esa skill no está instalada, usa `remove_background` de Higgsfield o cualquier quitafondos.
2. **Piezas de escenario generadas con Higgsfield** (`generate_image`, modelo `gpt_image_2_5`): una pieza por imagen, con
   `Photo cut-out collage element: <objeto>, seen straight from the front, whole object visible, isolated on a plain flat
   pure white background, no shadow, vintage magazine cutout look`, y después el mismo `sistema.mjs recortar`.
   Objetos blancos o claros: pide fondo magenta liso. Mira el saldo con `balance` antes, usa `get_cost: true` y di cuánto gastaste.
3. **Formas de papel de la plantilla** para todo lo simple: cielo, pared, piso, agua, colinas, pinos, estrellas, nubes, alfombra.

Varias poses de una mascota o de un objeto: pide una hoja 2×2 («the SAME … in four different poses, one per quadrant, wide
margins, white background»), corta los cuadrantes con ffmpeg (`crop=512:512:0:0`, `:512:0`, `:0:512`, `:512:512`) y recorta cada uno.

En `plantilla/assets/` vienen listas: `luna`, `muelle`, `divan`, `ventana` (con el vidrio transparente: pon detrás un
`plano` celeste) y `planta`, más cuatro poses de una mascota.

### Poses desde un video (avanzado)

Graba 2–4 s de cuerpo entero, cámara quieta, fondo liso. Saca 8 cuadros por segundo y recorta cada uno:

```bash
mkdir -p cuadros "$DEST/assets/poses"
ffmpeg -v error -y -ss 0 -t 2 -i clip.mp4 -vf "fps=8" cuadros/c_%03d.png
for f in cuadros/c_*.png; do
  node ~/.claude/skills/animacion-dibujada-f100k/scripts/sistema.mjs recortar "$f" "$DEST/assets/poses/$(basename "$f")"
done
```

Cada recorte tarda ~1 s. Luego lista los cuadros como poses con el mismo `x`, `pie`, `alto` y `ancho`, y `dur: 0.13`
(un salto cada una). Cada cuadro sale recortado a su propio borde, así que la figura baila un poco de tamaño: es parte del
look, pero si un cuadro salta demasiado, quítalo. Con 6 fps queda más tosco; con más de 8 deja de parecer stop motion.

## Errores conocidos

- **El video dura distinto a lo que suman los `dur`:** falta correr `node ajustar.mjs` (ver «Duración»). Con música el total cambia a propósito.
- **Cambié `musica` y los cortes no se movieron:** falta `node ajustar.mjs`; `ritmo.js` guarda los tiempos anteriores.
- **La persona flota o se hunde:** ajusta `pie`. En un muelle o piso en perspectiva, pisa a 100–200 px del borde de abajo.
- **Se ve el corte de un busto:** falta `detrasDe` o el `pie` quedó arriba del mueble. Otra salida: `pie: 1930` para que el corte caiga fuera del cuadro.
- **La pose se ve chica:** la foto se ajusta a la caja sin deformarse; una foto ancha en una caja angosta se encoge. Sube `ancho`.
- **Capa que entra «de golpe» desde lejos:** con `pasos: 2` cruza medio cuadro por salto. Es el look; si molesta, usa `pop`.
- **Recorte con borde de color** (fondo magenta o verde): se nota contra fondos claros. Regenera con fondo blanco o recorta 1–2 px.
- **Vidrios y huecos:** el recorte local los vuelve transparentes. Aprovéchalo poniendo una capa detrás.
- **Texto tapando la cara:** el texto es fijo y va encima de todo. Muévelo con `texto.y` o baja la persona. Mira un snapshot tras cada cambio de texto.
- **Fuentes:** solo del sistema. Una fuente externa se cae en el render y sale Times.
- **Cuadro en negro en el render pero no en el snapshot:** alguien puso un fondo en la raíz o en el `.clip`. El fondo va en `fondo` o en la primera capa.
- **Se ve «suave»:** alguien agregó un tween con duración. En esta plantilla todo son cambios instantáneos sobre la rejilla de saltos.

## Skills hermanas

Otros estilos del mismo sistema: `animacion-juego-de-cocina-f100k` (una receta de tres pasos como videojuego viejo),
`animacion-collage-editorial-f100k` (objetos flotando y tipografía palabra por palabra) y `reel-manotazo-f100k`
(problema → manotazo → resultado sobre una toma a cámara).
