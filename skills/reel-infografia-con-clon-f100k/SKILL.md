---
name: reel-infografia-con-clon-f100k
description: "Edita un reel 9:16 hablado con el estilo «infografía con clon» (referencia: @personalbrandlaunch, medida el 22-oct-2026): la persona dialoga CONSIGO MISMA (la narradora explica y su CLON, con otra ropa y en otro lugar, solo reacciona «¿sí?», «mm-hmm», «wow», «¿y dónde aprendo eso?» en cortes de ~0,5 s que sirven de puntuación) y cada número que se dice se vuelve una LÁMINA a pantalla completa sobre fondo plano del color de la marca donde la cantidad se VE: 1 = ella recortada al centro con etiqueta, 5 = mapa mental con ella al centro, flechas a mano y objetos/miniaturas con etiqueta, 10 = cuadrícula de miniaturas reales, 7 = lista numerada con miniatura + título + descripción, resultado = mosaico de reels + NÚMERO gigante (sale de multiplicar los del guion). Sobre la toma: palabra en triple jerarquía (chica / ENORME / chica), llave { } que agrupa miniaturas, hoja de cálculo en el tercio inferior, tarjeta de video de YouTube y caja de comentario que teclea la palabra del CTA, envía y termina en corazón. Piezas ancladas a PALABRAS (no a segundos), gancho golpe A/B/C, subtítulos de 1–2 palabras, efectos de sonido automáticos y voz intacta. Activar con 'edítalo estilo infografía con clon', 'yo hablando conmigo misma', 'mi clon me responde', 'láminas con los números', 'cada número en una lámina', 'estilo personalbrandlaunch con clon', 'mapa mental con mi foto al centro', 'reel de 1 nicho 5 subnichos 10 formatos', 'fondo amarillo con las cantidades'. NO usar para la lista que se llena a un costado de una sola toma (lista-sobre-video-hablado-f100k), reels 100 % animados sin persona (auto-edicion) ni para escribir el guion desde cero."
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill
---

# Reel infografía con clon

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

> **Guion simple.** Gancho con resultado y cifra real → directo a la historia o al primer paso (nada de frase puente
> tipo «pero antes…» / «una cosa…»: suena robótica) → de 2 a 4 pasos con verbos que se pueden hacer → la herramienta se
> nombra pero vive en el regalo → CTA a mitad y al cierre. Nada de jerga, ni en voz ni en pantalla. Las réplicas del
> clon también: «¿en serio?», «¿y eso cómo?».

> **Gancho golpe (manda sobre cualquier gancho de esta skill).** En pantalla, de 2 a 5 palabras, sin tercera línea:
> una línea ENORME en letra de diseño según el tema (`letra`: `condensada` por defecto o `serif` itálica), color plano
> sin brillo ni degradado y quieta desde el cuadro 0 (rojo negativo, verde logro, el color de tu marca para lo neutro),
> y otra chica. Negativo o polémico o una cifra real desnuda. Sin nombrar Claude, prompt ni skill; hablando de TI. La
> primera frase hablada dice lo mismo en ≤ 12 palabras, lleva al menos 1 palabra clave del video y chica + GRANDE se lee
> como UNA frase. **Siempre 3 variantes A/B/C** (`ganchos` en el plan) para subir como trial reels. Moldes y tarjeta de
> puntaje: skill `gancho-golpe-f100k` (viene en este módulo).

```
 0–11 s: INFOGRAFÍA (un cambio cada 0,5–1,5 s)              11 s–fin: TOMA + OVERLAYS (uno cada 2–4 s)
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       ┌────────────┐ ┌────────────┐ ┌────────────┐
│ GOLPE  │ │▒▒▒▒▒▒▒▒│ │        │ │▒ ▣  ▣ ▒│ │        │       │  over a    │ │ ┌────────┐ │ │            │
│ sobre  │ │▒  (•)  │ │  CLON  │ │▒ ↖(•)↗▒│ │  CLON  │  …    │   MONTH    │ │ │YouTube │ │ │  (•‿•)     │
│ la toma│ │▒ NICHO │ │ «¿sí?» │ │▒ ↙  ↘ ▒│ │ «wow»  │       │ of content │ │ └────────┘ │ │ ┌────────┐ │
│  (•‿•) │ │▒[1 nicho]│ 0,5 s  │ │▒[5 sub]│ │ 0,5 s  │       │   (•‿•)    │ │  (•‿•)     │ │ │GANCHOS♥│ │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘       └────────────┘ └────────────┘ └────────────┘
 narradora   lámina     clon       lámina     clon            palabra triple  tarjeta video  comentario
```

Desglose de la referencia, segundo a segundo: `references/anatomia-referencia.md`.
Ejemplo: los JSON que armaron un reel de prueba de 15 s (`ejemplo/plan-demo.json` y `ejemplo/montaje-demo.json`).

Formato: 1080×1920, 30 fps. Sale en `~/Documents/mis-videos-editados/<PROYECTO>/`.

## 🧰 EN TU COMPU

Esta skill viaja en el módulo de Edición y corre igual en Mac y en Windows (en Windows, desde la terminal de Claude Code,
que usa Git Bash).

- **Programas:** Node 18+, ffmpeg, Google Chrome, uv (trae Python: los `.py` se corren con `uv run`, no hace falta
  instalar Python) y HyperFrames (`npm i -g hyperframes`, gratis; dibuja y renderiza la composición).
- **Corte fino y transcripción:** con la skill hermana `editor-video-formula100k` (viene en este módulo). El corte fino
  completo necesita la llave de Anthropic guardada en `~/.editor-video/llave-anthropic.txt` (la skill del editor explica
  cómo); sin llave igual corta silencios, muletillas y repeticiones.
- **Recortar a la persona:** gratis y local. Con fondo verde, ffmpeg. Sin verde: en Mac, la segmentación de personas de
  macOS; en Windows, rembg (la primera vez descarga el modelo y tarda unos minutos por minuto de video).
- **Tu marca:** `marca.color` (el fondo de las láminas), tu @ y tu foto para la caja de comentario salen de
  `~/Documents/mi-contenido/mi-marca.md` (o su manual `mi-marca/marca.md`). Si no hay, pregunta; si no dice nada, amarillo `#FFD630`.
- **Tu negocio y tu CTA:** `~/Documents/mi-contenido/mi-negocio.md` (qué vende, qué regala a quien comenta la palabra).
  Si no existe, pregunta. Nunca inventes un regalo, una cifra ni un testimonio.
- **Dónde guardar:** `~/Documents/mis-videos-editados/<PROYECTO>/` (en Windows, la carpeta Documentos de su usuario).
- **Abrir el video:** en Mac `open "<ruta>"`; en Windows `start "" "<ruta>"`.
- **Imágenes con IA** (objetos sin fondo para el mapa): opcionales. Si tiene el conector de Higgsfield, `generate_image`
  + `remove_background` (cuesta créditos: avísale antes); si no, fotos reales recortadas gratis
  (`node "$SK/../auto-edicion/scripts/sistema.mjs" recortar <foto> <salida.png>`) o miniaturas reales.

---

## ⛔ Reglas que no se rompen

1. **La voz nunca se corta después del montaje.** `_source_cut.mov` es la base; el render dura lo mismo y el audio se
   copia de ahí (`final.py` falla si difieren).
2. **Corte fino primero** en cada toma (silencios, muletillas, repeticiones, arranques en falso). Después de `montar.py`
   no se corta más.
3. **Golpe visual en 0–2 s:** el cuadro 0 ya tiene el título golpe puesto sobre la toma y la primera lámina entra antes
   de ~2,5 s. `armar.py` avisa si en los primeros 11 s hay más de 2,2 s sin cambio.
4. **Cada número que se dice se VE como cantidad** (1 figura, 5 objetos, 10 miniaturas…). `armar.py` avisa cada número
   dicho sin lámina ni palabra en pantalla.
5. **Nada de cifras inventadas.** El número gigante del `mosaico_numero` sale de multiplicar números que SE DICEN en el
   guion (`calculo: [1, 5, 10, 7]` → 350) o es un número dicho tal cual. `armar.py` lo bloquea si no. Vistas y me gusta
   en las etiquetas, solo los reales medidos. Cifras de la persona (ventas, alumnas, seguidores): solo las que ella te
   da o están en `mi-negocio.md`; si falta, se pregunta.
6. **Ejemplos de formatos = reels REALES de otras cuentas**, validados MIRANDO el video, no el caption. Descárgalos
   (`yt-dlp`) y mira los cuadros. Sus propios reels van solo cuando habla de SU resultado. Nada de stock.
7. **Efectos de sonido en todo video** (los pone `armar.py` solos: whoosh en cada corte al clon y en cada lámina, clic
   en cada lámina e item, tecleo en el comentario, ding en el corazón). **Sin música**: la pone la persona al publicar.
7b. **Edición sin olor a IA.** Láminas con **miniaturas y fotos reales** (reels de
   otras cuentas, su perfil, la app), nunca emojis ni íconos de relleno. El motor ya no rebota: láminas, items, palabra
   triple, número gigante y etiquetas aparecen con **corte seco**, una cosa tras otra (sin pop, escala ni deslizar), y
   quedan quietos. La palabra triple ya va con tamaños distintos (chica / ENORME / chica) y sin brillo. El tecleo solo vive
   en la caja de comentario, porque imita la app real. Colores de la marca o de la toma, sin degradados.
8. **CTA con una palabra ligada al tema** y a lo que regala (sale de `mi-negocio.md` o se pregunta). «YO» está gastado:
   `armar.py` lo bloquea en el `comentario`.
9. **Español neutro y tuteo** en láminas, chips, etiquetas y réplicas del clon.
10. **Una cosa a la vez.** Una lámina o un overlay por momento; los overlays sobre la toma no tapan la cara (la palabra
    triple va a la altura del pecho, `y` ≈ 1020; la tarjeta de video arriba, nunca encima del gancho).

---

## Paso 0 · Preparar

```bash
SK="<carpeta de esta skill>"                          # la que tiene este SKILL.md
ED="$SK/../editor-video-formula100k/scripts"          # skill hermana: corte fino y transcripción
PROYECTO=<NOMBRE-EN-MAYUSCULAS>
DEST="$HOME/Documents/mis-videos-editados/$PROYECTO"; mkdir -p "$DEST/reel/assets"
command -v hyperframes >/dev/null || npm i -g hyperframes
```
Si `editor-video-formula100k` está instalada en otro lado (por ejemplo dentro del plugin), usa su ruta real en `ED`.
Los `.py` se corren siempre con `uv run --no-project --python 3.12 "<script>.py"`: uv trae Python, igual en Mac y en Windows.
Las variables no sobreviven entre comandos: escribe las rutas completas en cada uno.

**Cómo se graba (díselo antes si aún no grabó):**
- **Toma A, narradora:** el guion completo, de corrido, en un lugar (ej. silla, blusa clara). Pausa de medio segundo
  donde va a responder el clon.
- **Toma B, clon:** OTRA ropa y OTRO lugar (sofá, otra pared). Graba solo las réplicas, una por una, con aire entre
  ellas: «¿Qué?», «Ajá», «Ok», «¿En serio?», «Wow», «¿Y dónde aprendo eso?». Mirando un poco fuera de cámara, como si
  escuchara a la narradora. Tres o cuatro réplicas bastan; la última es la pregunta que abre el CTA.
- Si solo hay una toma, la skill funciona igual sin clon (pierde la puntuación; `armar.py` avisa).

**Imágenes:** miniaturas reales (9:16) para cuadrícula, lista, llave y mosaico; objetos PNG sin fondo para el mapa
(fotos reales recortadas, miniaturas si el tema son videos, o, si tiene créditos, Higgsfield `generate_image` +
`remove_background`). Todo a `$DEST/reel/assets/`.

## Paso 1 · Corte fino de cada toma

```bash
node "$ED/editar.mjs" "<toma narradora>" --solo-corte --carpeta "$DEST/narradora"
node "$ED/editar.mjs" "<toma clon>"      --solo-corte --carpeta "$DEST/clon"
```
Cada carpeta deja `_source_cut.mov` + `captions.json`. El editor lee la llave de Anthropic de su archivo
(`~/.editor-video/llave-anthropic.txt`); sin llave hace solo el corte de silencios, muletillas y repeticiones (y lo avisa).
Lee las dos transcripciones enteras: tropiezos, frases dichas dos veces con otras palabras.

## Paso 2 · Montar el diálogo (`montar.py`)

Escribe `$DEST/montaje.json`: el orden de los tramos, con bordes en PALABRAS de cada toma.
```json
{ "tomas": {
    "narradora": {"video": "$DEST/narradora/_source_cut.mov", "captions": "$DEST/narradora/captions.json"},
    "clon":      {"video": "$DEST/clon/_source_cut.mov",      "captions": "$DEST/clon/captions.json", "vol": 1.4} },
  "tramos": [
    {"toma": "narradora", "desde": "Deja",    "hasta": "rubro"},
    {"toma": "clon",      "desde": "sí",      "hasta": "sí"},
    {"toma": "narradora", "desde": "Este es", "hasta": "común"},
    {"toma": "narradora", "desde": "comenta", "hasta": "minuto"} ] }
```
(rutas absolutas, con `/` también en Windows; `"frase@2"` = la 2.ª vez; segundos si no hay palabra). Un clon cada 1–3 láminas en los primeros
11 s, nunca dos seguidos. `vol` empareja el volumen del clon (mide con `volumedetect`).
```bash
uv run --no-project --python 3.12 "$SK/scripts/montar.py" "$DEST"
```
Deja `_source_cut.mov` (el diálogo), `captions.json` (remapeado, sin volver a transcribir), `clon.json` y `edl.json`.
**Escucha cada unión**; si una palabra queda mocha, pon ese borde en segundos.

## Paso 3 · Recortar a la persona (para las láminas `centro` y `mapa`)

```bash
cd "$DEST" && uv run --no-project --python 3.12 "$SK/scripts/recortar.py" _source_cut.mov .     # → reel/assets/yo.webm + silueta.json
```
Sin verde usa la segmentación de personas de macOS (~2,5 min por minuto de video) o, en Windows, rembg (más lento: deja
la compu trabajando). Mira un cuadro del recorte antes de seguir. Si no quieres video
recortado, cada lámina acepta `"centro_img": "assets/yo.png"` (PNG sin fondo).

## Paso 4 · Escribir `plan.json` (piezas ancladas a PALABRAS)

Lee `captions.json` completo. Marca cada número dicho y decide su lámina; después los overlays sobre la toma.

```json
{
  "marca": {"color": "#FFD630", "usuario": "tu_usuario", "avatar": "assets/avatar.png"},
  "ganchos": [
    {"l1": "NO INVENTES", "l2": "tus formatos",    "grande": 0, "color": "rojo",     "hasta": "contenido:fin"},
    {"l1": "4 FORMATOS",  "l2": "para todo rubro", "grande": 0, "color": "amarillo", "hasta": "contenido:fin"},
    {"l1": "tus formatos","l2": "INVENTADOS",      "grande": 1, "color": "rojo",     "hasta": "contenido:fin"} ],
  "piezas": [
    {"tipo": "lamina", "forma": "centro", "en": "cuatro", "etiqueta": "Formatos", "chip": "4 formatos · todo rubro", "etiqueta_en": "todo"},
    {"tipo": "lamina", "forma": "mapa", "en": "Este es", "etiqueta": "Formatos", "chip": "4 formatos",
     "items": [{"img": "assets/ej_problema.jpg", "texto": "Problema y solución", "en": "problema"}, …]},
    {"tipo": "lamina", "forma": "cuadricula", "en": "Analicé", "chip": "+1.000 videos analizados",
     "items": [{"img": "assets/gr1.jpg", "texto": "26,2 M"}, …]},
    {"tipo": "palabra", "en": "comenta", "arriba": "comenta", "grande": "GANCHOS", "abajo": "y te la mando", "hasta": "ganchos:fin"},
    {"tipo": "comentario", "en": "ganchos:fin", "palabra": "GANCHOS"} ]
}
```

**Anclas** (`en`, `hasta`, `items[].en`, `etiqueta_en`, `enviar_en`, `corazon_en`, `gancho.hasta`):
`"cinco"` = la primera vez que se dice después de la pieza anterior (sin tildes ni mayúsculas) · `"cinco nichos"` frase
· `"cinco@2"` la 2.ª vez en todo el video · `"cinco:fin"` cuando termina de decirla · `"cinco+0.3"` corrimiento ·
`4.2` segundos (solo si no hay palabra). **Escribe las piezas en el orden en que pasan.**
Sin `hasta`, la lámina dura hasta la siguiente lámina/palabra o el próximo corte al clon; la palabra, hasta el fin de
la frase (máx. 3 s); tabla, tarjeta y comentario, hasta la próxima lámina o el final.

### Láminas (`"tipo": "lamina"`, fondo plano `marca.color`; `"color"` lo cambia en una)

| `forma` | Para qué | Campos |
|---|---|---|
| `centro` | **1** (un nicho, una idea, un producto): ella recortada al centro con borde blanco + etiqueta oliva a sus pies | `etiqueta`, `chip`, `cabeza_y` (600), `alto` (560), `centro_img` |
| `mapa` | **3–6 cosas que salen de una** (subnichos, pilares): ella al centro, flechas blancas a mano y cada item con etiqueta, uno por palabra | `items` [{`img`, `texto`, `en`, `forma`: `"objeto"` (PNG sin fondo) o tarjeta, `ancho`}], `etiqueta`, `chip`, `ancho_item` (200), `rx`/`ry` (radio), `arco` (120°) |
| `cuadricula` | **Muchas miniaturas** (10 formatos, 10 reels): 2×2, 2×3, 2×4 o 2×5 según cuántas | `items` [{`img`, `texto`, `en`}], `columnas`, `chip`, `y` (880), `proporcion` (0.5625) |
| `lista` | **N pasos/ángulos con nombre**: miniatura + «#1. TÍTULO» + una línea | `items` [{`img`, `texto`, `descripcion`, `en`}], `chip`, `alto_fila` |
| `mosaico_numero` | **El resultado**: mosaico de 20 miniaturas + NÚMERO gigante + chip | `imgs`, `numero`, `calculo` [factores dichos], `chip`, `y` |

Comunes: `chip` (pie blanco con texto oscuro; sin chip, los subtítulos se muestran como chip), `chip_y`, `etiqueta_en`.

### Sobre la toma

| `tipo` | Para qué | Campos |
|---|---|---|
| `palabra` | **Una palabra que manda** (triple jerarquía: chica blanca / ENORME del color / chica) | `arriba`, `grande`, `abajo`, `y` (1020), `tamano` (tope 200) |
| `llave` | **«Y eso sin contar X»**: palabra grande + llave { } + fila de miniaturas | `arriba`, `grande`, `abajo`, `imgs`, `y` (1110) |
| `tabla` | **Hoja de cálculo / calendario** en el tercio inferior que se llena fila por fila | `columnas`, `filas`, `celdas` [[…]], `y` (1250), `alto` (380) |
| `tarjeta_video` | **«Hice un video completo»**: tarjeta de YouTube arriba | `img` (16:9), `titulo`, `meta`, `duracion`, `ancho` (600), `y` (110) |
| `comentario` | **CTA**: caja que teclea la palabra, envía y queda un corazón | `palabra`, `usuario`, `avatar`, `y` (1330), `ritmo`, `enviar_en`, `corazon_en` |

Subtítulos: 1–2 palabras, blancos, chicos, a `sub_y` (1060). Se esconden solos con la palabra triple, la llave y las
láminas con chip. `cortes` (uniones) salen de `edl.json`: en cada una la toma alterna un punch-in de 7 % (`zoom_corte`).

## Paso 5 · Armar, mirar y revisar el layout

```bash
cd "$DEST"
uv run --no-project --python 3.12 "$SK/scripts/armar.py" .                        # --gancho 1 / 2 para las variantes B y C
node "$SK/scripts/vistazo.mjs" . 0.5 3 6 9.8 12 14    # fotos sueltas SIN renderizar → revision/vistazo.jpg (míralo con Read)
(cd reel && hyperframes lint)
node "$SK/scripts/revisar_layout.mjs" .               # debe salir ✅ antes de renderizar
```
`armar.py` resuelve cada ancla y escribe la línea de tiempo (s · pieza), y avisa: ancla que no encuentra (error),
imagen que no existe (error), número gigante sin respaldo (error), CTA «YO» (error), gancho de más de 5 palabras o con
línea grande de más de 11 letras, menos de 3 variantes, número dicho que no se ve, más de 2,2 s sin cambio en los
primeros 11 s, lámina de más de 3 s sin que entre nada, pieza encima del gancho, sin clon.
Muéstrale a la persona la línea de tiempo en una tabla corta y pide visto bueno antes de renderizar.

## Paso 6 · Render, sonido y revisión

```bash
uv run --no-project --python 3.12 "$SK/scripts/final.py" "$DEST" --nombre <nombre-que-se-entienda>          # render + voz + efectos (~25 s por 15 s de reel)
ffmpeg -v error -y -i "$DEST/<nombre>.mp4" -vf "fps=2,scale=180:-1,tile=10x6:padding=3:color=white" -frames:v 1 "$DEST/revision/hoja2fps.jpg"
```
Variantes del gancho: `uv run --no-project --python 3.12 "$SK/scripts/armar.py" . --gancho 1 && uv run --no-project --python 3.12 "$SK/scripts/final.py" . --nombre <nombre>-B` (y `2` → C).

**Mira `revision/hoja2fps.jpg` con Read antes de entregar** (este estilo cambia cada medio segundo: la hoja de 1 fps
de `final.py` no alcanza):
- [ ] Cuadro 0 con el golpe puesto y legible; la primera lámina antes de ~2,5 s.
- [ ] Cada clon dura 0,4–0,9 s y cae ENTRE láminas, no en medio de una idea.
- [ ] Cada lámina se lee en medio segundo: una cantidad, un chip; la persona recortada sin halo ni manos comidas.
- [ ] Los items del mapa y de la lista entran cuando se nombran.
- [ ] La palabra triple, la tarjeta y el comentario no tapan la cara; el corazón se alcanza a ver antes del final.
- [ ] Ninguna cifra en pantalla sin fuente; los ejemplos de formatos son de otras cuentas.

## Paso 7 · Entregar

1. `$DEST/LEEME.md`: fuente de cada toma, línea de tiempo, de dónde salió cada imagen y cifra, qué no se pudo hacer.
2. Abre el video principal y dile dónde quedaron los MP4 (A/B/C) en `$DEST`.
3. Reporte en 5 líneas: carpeta, duración, golpe de 0–2 s, variantes A/B/C, pendientes.

---

## Errores frecuentes

| Síntoma | Causa | Arreglo |
|---|---|---|
| `no encuentro «…»` | la palabra está escrita distinto en `captions.json` (Whisper) o ya pasó | copia la palabra tal cual; usa `@n`; revisa el orden de las piezas |
| La lámina aparece tarde o se come al clon | ancla en una palabra que se repite | ancla a la frase de 2 palabras o con `@n` |
| El corazón no se ve | el comentario empieza muy al final | ánclalo antes (`armar.py` aprieta el tecleo y avisa si no alcanza) |
| Persona recortada con huecos | toma oscura o con fondo parecido a la ropa | graba con luz de frente; o `centro_img` con un PNG limpio |
| Una palabra mocha en una unión | borde del tramo pegado a la palabra | en `montaje.json` pon ese borde en segundos, dentro del silencio |
| `vistazo.mjs` muestra la toma congelada | Chrome no busca el cuadro del video en `file://` | normal: el vistazo es para láminas y posiciones; el render sí trae el video |

## Archivos de la skill

```
reel-infografia-con-clon-f100k/
├── SKILL.md
├── templates/reel.html              motor: toma + gancho golpe + láminas + overlays + subtítulos (no se edita a mano)
├── scripts/montar.py                montaje.json → _source_cut.mov (narradora + clon) + captions.json + clon.json + edl.json
├── scripts/recortar.py              recorta a la persona → reel/assets/yo.webm + silueta.json
├── scripts/mascara_persona.swift    silueta con la segmentación de macOS (solo en el paquete de Mac)
├── scripts/mascara_persona.py       silueta con rembg (Windows y Mac sin Vision)
├── scripts/armar.py                 plan.json (anclas a palabras) → reel/index.html + sfx_plan.json + avisos
├── scripts/vistazo.mjs              fotos sueltas de la composición sin renderizar
├── scripts/revisar_layout.mjs       avisa si algo se encima o se sale de los márgenes
├── scripts/final.py                 render + voz intacta + efectos de sonido + hoja de revisión
├── sfx/                             efectos de sonido (clic, pop, whoosh, ding…)
├── references/anatomia-referencia.md   la referencia segundo a segundo y qué cambiamos
└── ejemplo/                         plan y montaje de un reel de prueba
Del editor-video-formula100k (este módulo): editar.mjs --solo-corte (corte fino y transcripción).
```
