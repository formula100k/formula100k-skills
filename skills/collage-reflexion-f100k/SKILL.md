---
name: collage-reflexion-f100k
description: Arma una reflexión en voz en off de 30 a 45 s editada como collage en movimiento, sin cara a cámara, con fotos y clips reales, recortes tipo sticker con tarjetas de dato, objetos que se abren, capturas reales que caen como tarjetas, texto que entra en el segundo en que la voz lo dice y un remate en blanco y negro. La pieza sale de una lista de bloques en config.js; incluye la sincronía con la voz, la preparación de clips y el render a MP4 con hoja de contacto. Usar cuando digan «reflexión en collage», «reflexión en voz en off», «collage con mi voz», «texto que entra al ritmo de mi voz», o pasen una nota de voz o un texto reflexivo y pidan volverlo reel sin grabarse hablando. NO usar para un video hablado a cámara (editor-video-formula100k, lista-sobre-video-hablado-f100k), para una apertura de pocos segundos sin voz, para un tutorial de pantalla, para una lista por categorías (reel-lista-que-suena-f100k), ni cuando la persona no tiene ni una cifra, foto o captura propia que mostrar.
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Collage de reflexión

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Reel vertical 1080 × 1920 a 30 fps con la voz en off de la persona. Cada frase tiene un recurso distinto y casi cada
palabra importante entra con su propio golpe. Motor: HTML que se pinta cuadro a cuadro + Chrome sin ventana + ffmpeg.
No se toca el HTML: la pieza es una lista de bloques en `config.js`.

## Qué la hace funcionar

Es vulnerabilidad con contabilidad. No dice «estoy frustrada»: muestra el calendario, el buzón, la carpeta vacía.
Por eso pide material real. Sin clips ni capturas propias sale un pase de diapositivas bonito y nadie lo cree.

## Cuándo no usarla

- No hay una cifra propia ni una historia concreta: primero consigue eso.
- La idea es enseñar un paso a paso (es un tutorial) o vender de frente (es otra pieza).
- La persona quiere salir hablando a cámara.

## 1. El guion

10 a 12 frases, 30 a 45 s. Reglas:

1. **Abre con una cifra propia**, no con una idea («Revisé mis 162 guiones», «Hace seis años abrí…»).
2. **Haz inventario antes de opinar:** dos o tres datos seguidos, cada uno con su objeto.
3. **El giro va a la mitad** y es un hecho, no una moraleja («Lo que sí cambió fue…»).
4. **La regla va al final y sin «yo»:** suena a ley, no a consejo. Es la frase del remate en blanco y negro.
5. **No se vende.** El cierre es «Comenta PALABRA y te mando…» hacia un regalo que ya exista.
6. **Un recurso por frase.** Si una frase no tiene recurso, sobra o le falta un dato.

Orden que sigue: intriga propia → la historia con su detalle → bisagra → puente a quien mira → regla que se puede
repetir → cierre. No inventes cifras, casos ni capturas: usa solo lo que la persona te dé o lo que esté en sus datos.

Qué recurso le toca a cada frase:

| Tipo de frase | Bloque (`tipo`) |
|---|---|
| Presentación, la cifra que abre | `toma` con clip real y `congela` |
| Un plazo o un número propio | `sticker` con tarjeta `calendario` o `contador` |
| Un inventario («tengo esto, esto y esto») | `bandeja` o `contenedor` |
| Lo que NO pasó | `eco` (el inventario anterior, borroso y sin color) |
| Una decepción concreta | `franja` |
| Lo que se probó y falló | `carpeta` con fichas que se tachan |
| El giro | `toma` o `apilado` sobre un clip real, sin objetos |
| Prueba social, pantalla | `capturas` (mensajes y panel reales; captura o grabación dentro del celular) |
| La regla | `toma` + `remate` (una oración partida en dos bloques) |
| El llamado | `cierre` |

## 2. El material que hay que pedir (todo junto, en un mensaje)

1. **La voz:** una nota de voz leyendo el guion (lo ideal: es una reflexión, se nota quién habla), o permiso para generarla.
2. **Clips verticales** de 3 a 5 s, de su vida o su oficio: uno para abrir (ella o él moviéndose, aunque no hable), uno para el giro, uno para la franja. Sin clips, fotos.
3. **Capturas reales:** mensajes de clientes, el panel con la cifra que nombra, la publicación de la que habla; y una **grabación de pantalla** si alguna frase dice «busqué», «abrí», «revisé».
4. **Dos o tres fotos** de cuerpo entero o de medio cuerpo para recortar como sticker.
5. **Marca:** colores (papel, tinta, un acento, un segundo color) y letra. Lee su `marca.md` si existe.
6. **Regalo y palabra** del cierre.

Lo que falte se deja como `pendiente` (aviso amarillo en el cuadro) y se entrega dicho, no se rellena con inventos.

## 3. Receta

```bash
SKILL=~/.claude/skills/collage-reflexion-f100k
cp -R "$SKILL/plantilla" ./mi-reflexion && cd ./mi-reflexion

# a) Escribe los bloques en config.js (una frase por bloque) y saca el guion para grabar o generar la voz
node "$SKILL/scripts/sincronizar.mjs" . --guion          # → voz/guion.txt

# b) La voz → voz/narracion.wav (ver «La voz»). Para medir antes de tener la definitiva:
node "$SKILL/scripts/sistema.mjs" voz --archivo voz/guion.txt voz/narracion.wav --ritmo 170      # voz de la computadora, Mac y Windows

# c) Clips: cada video se pasa a cuadros numerados (el motor los pinta por índice, sincronizados)
node "$SKILL/scripts/clip.mjs" . ruta/al/video.mp4 apertura --desde 2 --dura 4
#    en config.js → recurso: { clip: 'apertura' }

# d) Ata frases y palabras a la voz → tiempos.js
node "$SKILL/scripts/sincronizar.mjs" .

# e) Mira cuadros sueltos antes del render completo (segundos separados por comas) y abre prueba/tira.jpg
node "$SKILL/scripts/render.mjs" . 1.2,4.5,9,13.4

# f) Render: MP4 con la voz + hoja-de-contacto.jpg (un cuadro cada 0,5 s). ÁBRELA y mírala
node "$SKILL/scripts/render.mjs" .
```

La plantilla trae un ejemplo completo (una panadería) con sus tres clips de prueba en `assets/clip-*.mp4`: para verlo
correr, pasa esos tres por el paso c (`amasado`, `horno`, `pantalla`). Para una pieza nueva, borra lo que no uses de `assets/`.

Vista rápida en Chrome: `index.html#12.5` (un segundo fijo) o `index.html#play` (corre con la voz).
Necesita Google Chrome, ffmpeg, `uv` y el paquete `puppeteer-core` (el render lo busca en la carpeta de la pieza y en
esta skill; si no está: `npm i puppeteer-core`). Corre igual en Mac y en Windows.

## 4. `config.js` en corto

Cada bloque: `{ id, tipo, frase, …recurso, texto: [...] }`. Los once tipos: `toma`, `remate`, `sticker`, `contenedor`,
`bandeja`, `franja`, `capturas`, `carpeta`, `eco`, `apilado`, `cierre`. **Campos de cada uno, tarjetas y renglones:
`references/bloques.md`** (léelo antes de escribir la config).

Lo esencial:

- `frase` es lo que dice la voz en ese bloque. Una oración puede partirse en dos bloques seguidos.
- `texto` no es subtítulo: solo las palabras que cargan la idea. Sans pesada para la palabra que pesa, serif para el conector.
- `en` dice cuándo entra una pieza: una palabra de la frase (`en: 'seis'`, `en: 'cero#2'`) o segundos desde el inicio del bloque. Sin `en`, cada renglón entra cuando la voz dice su primera palabra.
- `x`, `y` son el centro de la pieza. Texto entre y = 230 y y = 1580.
- `pendiente: '…'` pinta el aviso amarillo. `mostrarPendientes: false` los esconde todos.

## 5. La voz

- **Grabada por la persona** (lo mejor): cuarto silencioso, teléfono a un palmo, más lento que en un reel hablado, pausa corta después de cada frase y una más larga antes del giro. La regla final, más despacio que todo.
- **Generada:** con la voz clonada de la marca si existe, o con el servicio que use la persona. Una frase por pedido, en tandas chicas; las palabras en MAYÚSCULAS se escriben en minúscula para que no las deletree; une las frases con 0,25 a 0,3 s de silencio. Después transcribe y compara con el guion.
- **La voz de la computadora** (paso b) sirve solo para medir tiempos y para el ejemplo. No se entrega una pieza con voz de sistema. Si la computadora no tiene voz en español, el comando lo dice: pídele a la persona que grabe la suya.

`sincronizar.mjs` transcribe con Whisper en tu computadora (mlx-whisper en Mac con chip Apple, faster-whisper en Windows y en Mac Intel), corrige
el arranque (Whisper suele pegar la primera palabra al segundo 0; se mide el silencio inicial con `silencedetect`) y
alinea guion y voz aunque los números vengan en cifras o cambie una palabra. Lee su informe:

- «la voz dice otra cosa» → la grabación no coincide con la frase; corrige la frase o regraba.
- «no se oyó» → esa parte se repartió a ojo; revisa ese bloque en la hoja de contacto.
- «dura más de 4,5 s» → parte el bloque o súmale una pieza a media frase.

Si cambias el audio o una frase, vuelve a sincronizar. Si reutilizas una transcripción, basta dejar `voz/narracion.json` junto al audio.

## 6. Imágenes

Orden de preferencia: (1) foto, clip o captura real; (2) objeto generado; (3) emoji o dibujo como último recurso.

- **Sticker de persona u objeto**, gratis y local: `node ~/.claude/skills/animacion-dibujada-f100k/scripts/sistema.mjs recortar foto.jpg assets/recorte.png` (Mac y Windows). El borde blanco lo pone la plantilla.
- **Objetos** (carpeta, contenedor en dos estados, regalo): la plantilla trae carpeta, lupa, casillero cerrado y abierto, y regalo. Para otros, una sola imagen generada con seis objetos sobre blanco en cuadrícula 3 × 2 (conector de Higgsfield: `generate_image`; mira `balance` antes y di cuánto gastaste) → `crop` con ffmpeg → el mismo `sistema.mjs recortar`. Pide siempre el contenedor cerrado **y** abierto.
- **Capturas:** recórtalas a lo que importa (el mensaje, la cifra). Tapa nombres y fotos de terceros si la persona no tiene su permiso.
- Se copia la mecánica de una referencia, nunca su paleta, su letra ni sus textos.

## 7. Revisión antes de entregar

Abre `hoja-de-contacto.jpg` y revisa, cuadro por cuadro:

1. Ningún bloque vacío ni con el hueco rayado «AQUÍ VA» (salvo los que dejaste como pendiente a propósito).
2. Ningún texto cortado ni encima de la cara; ninguna tarjeta tapando el dato de otra.
3. Cada cifra en pantalla es la que dice la voz, y cada imagen cumple lo que dice el texto.
4. No hay dos bloques seguidos de la misma «temperatura» (foto real · plano con objeto · negro con franja).
5. Blanco y negro, máximo dos veces. Mayúsculas, solo en el remate.
6. El cierre se sostiene al menos 1,5 s después de la última palabra (`cola`).

Di al entregar qué bloques quedaron como pendiente y si la sincronía la revisaste de oído o solo por las marcas.

## Errores conocidos

| Síntoma | Causa y arreglo |
|---|---|
| Hueco rayado «AQUÍ VA: el clip…» | No corriste `clip.mjs` para ese nombre, o el nombre en `config.js` no coincide. |
| El render dice «Imágenes que no cargaron» | Ruta mal escrita en `config.js`. Las rutas son relativas a la carpeta de la pieza. |
| «Las fuentes web no cargaron» | Sin internet o URL mala en `fuentes.web`. Usa fuentes del sistema. |
| Todo entra a destiempo | Falta `tiempos.js` (tiempos estimados) o cambiaste el audio sin volver a sincronizar. |
| Un renglón entra tarde o junto con otro | Su primera palabra no está en la frase. Ponle `en: 'palabra'`. |
| El clip se queda quieto a media frase | El bloque dura más que el clip. Corta más largo (`--dura`) o usa `velocidad: .7`. |
| El contenedor abierto queda corrido | Tu objeto no mide como el casillero: ajusta `abiertoAncho` y `abiertoDx`. |

## Lo que la plantilla no hace

- Texto **detrás** de la persona en un clip (pide recortarla cuadro por cuadro).
- Congelar en blanco y negro **solo** a la persona: se congela el cuadro entero.
- Música y efectos de sonido: el MP4 lleva solo la voz. Se suman al publicar o en un editor.
- Clips con audio propio: los clips entran mudos.
