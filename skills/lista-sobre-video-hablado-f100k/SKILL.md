---
name: lista-sobre-video-hablado-f100k
description: "Reel de una toma hablando a cámara con una lista numerada al costado que se llena cuando dices cada paso y cierre con caja de comentario del CTA. Usar con «lista que se llena mientras hablo», «los pasos aparecen cuando los digo». NO para reel sin cara con lista (reel-lista-que-suena-f100k)."
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Lista sobre video hablado

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

## Qué es y por qué retiene

Una sola toma, sin cortes: tú hablando a cámara en un tercio del cuadro. Encima van tres capas.

1. **Rótulo fijo arriba** con la promesa («5 pasos para…»), desde el cuadro 0.
2. **Columna de números** del lado libre, vacía desde el cuadro 0. Cuando dices «uno», la fila 1 se llena: primero el nombre del paso en una etiqueta y después de 1 a 3 miniaturas, que entran al doble de tamaño y luego se acomodan.
3. **Cierre:** la lista se va, la toma se acerca durante un segundo y aparece una caja de comentario que escribe la palabra letra por letra.

La lista vacía es una promesa a la vista: cada fila que se llena es un avance que se puede contar y los números vacíos dicen cuánto falta. No hay un solo corte y aun así la pantalla cambia todo el tiempo.

Mira `ejemplo/muestra.jpg` (o `ejemplo/muestra.mp4` si tu copia lo trae) antes de empezar. Es un ejemplo de repostería montado sobre un **fondo sustituto** (una silueta dibujada y una voz de computadora), porque la skill no trae a nadie grabado. `ejemplo/muestra-espejo.jpg` es la misma pieza con la lista a la derecha.

## Lo que necesitas

| Qué | Detalle |
|---|---|
| Un guion con pasos numerados | De 5 a 7 pasos es lo ideal; aguanta hasta 10, con miniaturas más chicas |
| Una toma tuya | Vertical, una sola, diciendo el número de cada paso en voz alta |
| De 1 a 3 imágenes por paso | Capturas, fotos o portadas tuyas. Con color se leen mejor que una captura de puro texto |
| Una palabra para el CTA | Corta y ligada al tema, la misma que dices al final |
| En la computadora | Node, ffmpeg, Google Chrome, `puppeteer-core` y `uv` (para transcribir). Corre igual en Mac y en Windows |

## El guion (antes de grabar)

- **Gancho con el número:** la promesa dice cuántos pasos son, igual que el rótulo.
- **Cada paso abre con su número y su nombre:** «Uno, especialidad. …». Ese número dicho en voz alta es la señal para llenar la fila; si no lo dices, el script busca el nombre del paso, que es menos seguro.
- **Las primeras filas, rápido.** En la referencia de este formato entran cuatro filas en nueve segundos: eso es el gancho. Si tu introducción pasa de 6 segundos sin llenar nada, haz que un número lata (`pulsos`) o recorta.
- **Una o dos frases por paso.** La fila dura lo que dura tu frase.
- **Cierre:** una pregunta («¿en cuál vas?») y «Comenta PALABRA y te mando…». No prometas cifras ni resultados que no puedas probar.
- Si aún no hay guion, escríbelo con tu skill de guiones y vuelve aquí con los pasos.

## Cómo grabar la toma

- **Vertical, una sola toma, sin cortes.** Celular apoyado y quieto.
- **Tú en un tercio del cuadro**, con la cara cerca del 74 % del ancho (a la derecha) y la otra mitad despejada: ahí va la lista. Para la versión espejo, tú a la izquierda (26 %).
- **Fondo tranquilo del lado de la lista:** pared lisa mejor que estantes. No muevas las manos hacia ese lado.
- **Cara entre el 30 % y el 45 % del alto.** Más arriba la tapa el rótulo.
- **Un objeto en la mano** (micrófono, teléfono, tu producto) y mirada a cámara.
- **Di cada número claro** y haz una pausa mínima después: «Dos… clienta».
- **Al terminar, quédate 2 segundos mirando a cámara en silencio.** Ahí termina de leerse la caja de comentario.

## Flujo paso a paso

`SKILL` = `~/.claude/skills/lista-sobre-video-hablado-f100k`. `SALIDA` = la carpeta de trabajo de esta pieza.

**1. Copia la plantilla.**

```bash
mkdir -p "$SALIDA" && cp -R "$SKILL/plantilla/." "$SALIDA/" && cd "$SALIDA"
```

**2. Pon la toma** en la carpeta, vertical, a 30 cuadros por segundo y en un formato que no dé problemas:

```bash
ffmpeg -i "tu-toma.mov" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac "$SALIDA/toma.mp4"
```

¿Todavía no hay toma y quieres probar textos e imágenes? Mira «Probar sin haber grabado».

**3. Llena `config.js` con lo que no depende del tiempo.** `lado`, `acento` y `estilo` (colores de la marca de quien publica), `titulo`, y por cada paso su `nombre` (1 o 2 palabras) y sus `minis`. Las imágenes van en `img/`; borra las del ejemplo. `cta.palabra`, `cta.despues` y `cta.usuario`. Vacía los subtítulos del ejemplo (`subs: []`) y deja `pulsos: []`; los `t` déjalos como estén: los pone el paso siguiente. `overlay.html`, `render.js` y `montar.js` no se tocan.

**4. Saca los segundos reales.**

```bash
node "$SKILL/scripts/tiempos.mjs" toma.mp4
```

Transcribe la toma, busca dónde dices cada número (entiende «uno», «1», «primero» y «paso uno»), el «Comenta PALABRA» y el final de la voz, e imprime una tabla con el `t` de antes, el de ahora y la frase donde lo oyó. **Lee la tabla:** cada paso debe decir «número + nombre». Si alguno dice «mención débil» o «no lo encontré», oye ese segundo y ponlo a mano. Cuando esté bien:

```bash
node "$SKILL/scripts/tiempos.mjs" toma.mp4 --json=tiempos/toma.json --escribir
```

Escribe en `config.js` el `t` de cada paso, `sale`, `acercar.t`, `cta.t` y `duracion`, y deja la versión anterior en `config.antes.js`. `--json` reutiliza la transcripción y no vuelve a transcribir. Opciones:

- **Subtítulos dentro de la capa:** agrega `--subs-de-voz` y escribe `subs` con lo que se oyó, en trozos de 2 o 3 palabras. Léelos después: Whisper escribe los números con cifras («1. Especialidad») y a veces oye mal un nombre propio. Si los subtítulos los pone tu editor, deja `subs: []`.
- **Volviste a grabar y ya tenías `subs` o `pulsos`:** con `--escribir` solo, se reacomodan a la toma nueva (cada uno se engancha a su palabra si la oye cerca; si no, por proporción).
- **Un número que late:** la tabla lista las otras veces que nombras un número («te faltan estos 5 pasos»). Copia a `pulsos` las que quieras.

**5. Mira cuadros sobre tu toma antes de exportar.**

```bash
node render.js --toma=toma.mp4 --guias --segundos=0,<t paso 1 + 0.5>,<t paso 3 + 1.5>,<t último paso + 2.5>,<sale + 0.9>,<cta.t + 1.5>
```

Abre `revision/hoja.jpg` con Read. Qué revisar, en este orden:

1. **Ninguna miniatura ni etiqueta toca tu cara**, tampoco mientras entra en grande. Si la toca: baja `acomodo.anchoMax` (por ejemplo a 420) o `acomodo.foco` (a 1.6), o usa `--agrandar` en el paso 7.
2. **El rótulo no te tapa la frente** y se lee entero. Si es largo, pártelo en dos líneas.
3. **Nada cae en las franjas rojas** (arriba, abajo y los botones de la derecha): son de Instagram.
4. **Cada nombre de paso se lee** y ninguna miniatura es un borrón: si una captura de texto no se entiende ni en grande, cámbiala por una imagen con color.
5. **La caja de comentario** muestra la palabra completa y no te tapa la boca.

También puedes verla en vivo en Chrome: `overlay.html?fondo=toma.mp4`, y con `&t=31` se queda en ese segundo.

**6. Exporta la capa.**

```bash
node render.js            # → capa.mov (ProRes con transparencia; pesa cientos de MB)
```

**7. Monta.**

```bash
node montar.js toma.mp4 final.mp4
```

Pone la capa sobre la toma, conserva tu audio y hace el acercamiento del cierre según `acercar`. Si grabaste centrada, `--agrandar=1.3` agranda la toma y te corre al lado contrario de la lista (pierdes los bordes; es un parche, no el plan). `capa.mov` también sirve como pista de arriba en CapCut o Premiere; ahí el acercamiento lo haces tú.

**8. Revisa el MP4, no solo los cuadros sueltos.**

```bash
node "$SKILL/scripts/hoja-de-contacto.mjs" final.mp4 revision/final-hoja.jpg
node "$SKILL/scripts/hoja-de-contacto.mjs" final.mp4 revision/cierre-hoja.jpg <sale − 0.5> <cta.t + 2>
ffprobe -v error -show_entries stream=codec_type,duration -of compact final.mp4
```

Mira las dos hojas con Read. En la primera: las filas se llenan en orden y nada tapa la cara. En la segunda (6 cuadros por segundo): la lista se desvanece, la toma se acerca **de a poco** (cada cuadro un poco más cerca, sin salto) y la palabra se escribe letra por letra. `ffprobe` debe listar `audio` además de `video`. Luego oye el MP4 en dos o tres pasos: la fila entra con el número, no antes ni después. Al terminar, borra `capa.mov` y `tiempos/toma.wav`.

## Versión espejo

`lado: 'derecha'` pone la lista a la derecha y supone que tú estás a la izquierda. No cambies `acomodo`: se escribe siempre como si la lista fuera a la izquierda y se pasa sola al otro lado. La lista conserva el orden de lectura (número y después miniaturas), queda un poco más angosta (448 px en vez de 500) para no pisar los botones de Instagram, el subtítulo pasa a tu lado y el acercamiento apunta hacia ti. Elige el lado según cómo esté grabada la toma: no se voltea el video, porque se leería al revés cualquier texto que salga en cámara.

## Probar sin haber grabado

```bash
node "$SKILL/scripts/sistema.mjs" voz "Si haces… Uno, especialidad. …" voz.wav      # tu guion leído por la computadora (Mac y Windows)
node "$SKILL/scripts/fondo-sustituto.mjs" toma.mp4 --audio=voz.wav --lado=izquierda
```

Fabrica una toma de mentira (pared en degradado y una silueta sin cara del lado contrario a la lista) con ese audio. Sirve para afinar textos, imágenes y ritmo, y así se hizo el ejemplo. Sin `--audio`, usa `--segundos=40` (también si la computadora no tiene voz en español: el primer comando lo dice). No la publiques: es un borrador.

## Campos de `config.js`

| Campo | Qué hace |
|---|---|
| `duracion`, `fps` | Segundos de la capa (lo pone `tiempos.mjs`) y cuadros por segundo |
| `lado` | `'izquierda'` (tú a la derecha) o `'derecha'` (espejo) |
| `acento` | El único color de acento: número activo, palabra del rótulo, etiqueta activa, borde de la caja |
| `estilo.oscuro`, `claro`, `borde`, `sobreAcento` | Fondo de rótulo y etiquetas, color claro, filete, texto encima del acento |
| `estilo.fuente`, `fuenteCursiva` | Solo fuentes del sistema; las externas se caen al exportar |
| `titulo.lineas`, `titulo.nota` | Una o dos líneas. `*así*` = en el acento · `_así_` = cursiva en el acento |
| `pasos[].t`, `nombre` | Segundo en que lo dices y nombre corto |
| `pasos[].minis[]` | De 1 a 3: `src`, `rotulo` opcional (una palabra) y `t` opcional (si no, entran una cada `cadaMini` segundos) |
| `pulsos[]` | `{ t, paso }`: ese número late sin llenarse |
| `subs[]` | `{ t, texto, hasta? }`: subtítulo corto del lado de tu cara. `[]` = sin subtítulos |
| `sale` | Segundo en que se van la lista y el rótulo |
| `acercar` | `{ t, segundos, escala, x, y }`. Sin el campo: arranca 0,2 s después de `sale`, dura 1 s, escala 1.25. `x`, `y` (de 0 a 1) son el punto que se queda quieto mientras se acerca; por defecto, tu borde del cuadro (0.92 o 0.08) y 0.36 de alto, para que tu cara se corra hacia el centro. `false` = sin acercamiento |
| `cta.t`, `antes`, `palabra`, `despues`, `usuario` | La caja de comentario: cuándo aparece, «Comenta», la palabra que se escribe, la línea de abajo y el usuario |
| `acomodo.*` | Posiciones en el lienzo de 1080×1920. Casi nunca se toca: `anchoMax` (ancho de la fila), `foco` (cuánto crece la miniatura al entrar), `yTitulo`, `yFin`, `xSubs`, `ySubs`, `yCta` |

Las medidas se calculan solas: la distancia entre filas es el espacio libre entre el rótulo y `yFin` dividido entre los pasos (tope de 190 px) y la miniatura mide esa distancia menos 34 (tope de 150). Con 5 a 7 pasos la miniatura ocupa cerca del 7 % del alto; con 10, menos del 4 % y se vuelve textura.

## Errores conocidos

- **Falta `puppeteer-core`.** `render.js` lo busca en la carpeta de trabajo y en `~/.claude/skills/carrusel-render-formula100k/node_modules`. Si no está, lo dice y da los dos arreglos: `npm install` en esa skill o `npm install puppeteer-core` en tu carpeta.
- **Whisper pega una palabra al silencio anterior** (sobre todo la primera, al segundo 0). `tiempos.mjs` lo corrige con los silencios del audio. Con ruido de fondo no detecta silencios y lo avisa: usa `--ruido=-28`.
- **Whisper escribe «1.» en vez de «uno».** El buscador acepta las dos formas. Lo que no distingue solo es un número dicho a mitad de frase («tres tamaños») de uno que abre un paso: por eso prefiere el número seguido del nombre del paso. Si cambias el nombre en `config.js` por uno que no dices, pierde esa pista.
- **La tabla acierta el paso pero la fila se siente tarde.** Resta 0.1 a ese `t`: la fila entra mejor un pelo antes que después.
- **`tiempos.mjs` solo se probó con voz sintética** (dos velocidades). Con una toma real, confirma siempre la tabla oyendo.
- **La toma termina antes que la caja.** El script lo avisa. `montar.js` congela el último cuadro hasta el final; se nota si te estabas moviendo. Mejor graba los 2 segundos de silencio.
- **La lista te toca la cara.** La toma está centrada. Regraba en tu tercio, o baja `anchoMax`, o usa `--agrandar=1.3`.
- **Capturas oscuras de texto no se leen en la fila.** Se leen solo mientras están grandes. Usa imagen con color o un `rotulo`.
- **`capa.webm`** (`node render.js --webm`) se exporta pero no se probó en ningún editor. El `.mov` sí.
- **Miniaturas en movimiento:** no hay. La referencia mete mini grabaciones de pantalla en algunas filas; aquí son imágenes fijas.
- **Imagen que no carga:** `render.js` imprime «No encontré la imagen …» y la miniatura sale vacía. Revisa la ruta en `src`.

## Qué decir al entregar

La ruta del MP4, los segundos que quedaron a mano o con mención débil, qué miniaturas son provisionales y qué viste en las dos hojas. Si usaste fondo sustituto o voz de computadora, dilo: no es una pieza para publicar.
