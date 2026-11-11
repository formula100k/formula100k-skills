---
name: expediente-inteligencia-f100k
description: Arma un reel vertical sin cara de 45 a 65 s en estilo EXPEDIENTE DE INTELIGENCIA, un noticiero en blanco y negro con HUD. Lleva fotos y capturas reales desaturadas con cámara viva, una mira que se engancha a la cara completa, etiquetas monoespaciadas que cuelgan de lo que nombran, cifra gigante que cuenta, globo de puntos con ruta, subtítulo suelto con la clave en amarillo y gancho centrado sobre la escena a pantalla completa. Todo se dibuja cuadro a cuadro en canvas, sin créditos de video, y trae una revisión automática de cuadros (zona segura, encimados, anclas) y el ejemplo resuelto de Dollar Shave Club. Sirve para contar un caso real de negocio con cifras verificables y cerrar con tu CTA. Usar cuando digan «expediente de inteligencia», «plantilla Expediente de inteligencia», «estilo noticia en blanco y negro con mira», «caso real de negocio estilo documental corto», «documental corto estilo HUD», «hazlo como el de Dollar Shave Club». NO usar para la plantilla «Expediente de semitono» (es un clip de cine dibujado: animacion-dibujada-f100k), para la historia real en collage stop motion (telenovela-explicada-f100k, modo collage) ni para documentales largos de YouTube.
argument-hint: [caso real de negocio o marca]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Expediente de inteligencia (reel sin cara)

Un caso real de negocio contado como un expediente de noticiero: blanco y negro, fotos y capturas reales, una mira sobre la cara de quien se nombra, etiquetas que cuelgan de lo que se ve y cifras gigantes que cuentan hasta el número justo cuando la voz lo dice. Termina con tu CTA: tu palabra y tu regalo.

> **No la confundas con la plantilla «Expediente de semitono»** (Estilos de cine): esa es un clip corto dibujado con trama de puntos y un sello, para una frase. Esta es un reel completo de 45 a 65 s con un caso real, fotos reales y tu voz.

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill, respeta su estructura y no pisa sus reglas de oficio. En este estilo, su color de acento reemplaza el amarillo de la palabra clave y el verde o rojo del gancho, y su letra puede ir en el gancho y en el subtítulo; las fotos, las capturas y el HUD se quedan en blanco y negro. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

## 🔴 Compuerta obligatoria: 5 reglas que mandan sobre todo lo demás
Si una sola falla, el video no se entrega.

**1 · Gancho centrado sobre la escena a pantalla completa.** Nunca alineado a la izquierda, nunca en un cuadro o franja negra, nunca achicando la imagen. Se dibuja SOLO con `herramientas/ganchos.py` (que llama a `herramientas/gancho_png.py`: centrado, con un degradado negro suave sin bordes). Es **el hecho, no la moraleja**: marca, cifra real y pérdida o ganancia, de 2 a 5 palabras. **Sin subtítulos mientras el gancho está en pantalla.** La cara o el objeto del plano va DEBAJO del bloque, no detrás.

**2 · Toda etiqueta, mira, visor o línea guía apunta a algo que SE VE y que es justo lo que nombra.** Si dice «YouTube», en pantalla está la captura real de YouTube y la línea llega a ese dato. La mira abraza la **cara completa** de la persona que nombra (la caja sale de `caras.py`, nunca a ojo). En el código no existe «etiqueta en x,y»: solo `etiqueta(ancla, …)`, y el ancla es una caja declarada en `AN` con su descripción. Si lo que quieres señalar no tiene ancla, es que no está en la foto: consigue la foto o quita la etiqueta. Nada sale de la **zona segura** (60 px a los lados, nada arriba de y≈220 ni abajo de y≈1650 en 1080×1920) y nada se encima.

**3 · Cada plano muestra lo que la voz dice en ese momento**, con foto o captura real cuando nombra algo concreto (el video, el sitio, la sede, el titular). Los cambios caen en la palabra (`T('palabra')`). Nada de imágenes de relleno ni de dibujo vectorial como imagen principal.

**4 · Subtítulos sin caja ni placa:** texto suelto en letra de diseño, la palabra clave en amarillo y más grande, con sombra suave, centro en y≈1400 y nunca encima de una etiqueta.

**5 · Nada estático:** cámara viva (empuje o paneo hacia lo que se nombra, nunca más de 1,5 s quieta), transición entre escenas, lo que se dibuja se anima, menos del 20 % del tiempo congelado. Los textos entran con corte seco y sin temblor. Sonidos graves y cortos, nada por encima de ~3 kHz.

### Lista de revisión de cuadros (se pasa DOS veces: la máquina y tú)
**a) La máquina.** `herramientas/construir.py` corre `revisar.mjs` sobre TODOS los cuadros antes de renderizar y se detiene con código 1 si hay: algo fuera de la zona segura · dos textos encimados · una etiqueta, mira o visor cuya ancla no se ve entera (≥ 85 % en cuadro) · un texto tapando lo que se señala · subtítulo durante el gancho · más de 1,5 s quieto o más del 20 % congelado. Imprime además la tabla **«ETIQUETA → LO QUE SEÑALA»**.

**b) Tú, a ojo, cuadro por cuadro** (abre con Read `revision/hoja-contacto_A.jpg`, 1 cuadro por segundo, y la tabla de etiquetas). Por CADA cuadro contesta:
1. ¿Cada etiqueta señala lo que nombra, y eso se ve? («YOUTUBE · 1:33 → la duración en el reproductor de YouTube» sí; «YOUTUBE → la boca de alguien» no)
2. ¿El gancho está centrado, sin cuadro negro, con la escena a pantalla completa detrás y sin tapar la cara?
3. ¿Hay algo fuera de la zona segura o encimado (también un texto sobre una cara)?
4. ¿La imagen va con lo que la voz dice en ese segundo?
5. ¿El plano dice algo, o es un relleno borroso u oscuro?

Cualquier «no» → se corrige la pieza y se vuelve a pasar la lista entera. **Con código 1 no se entrega.**

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `estilo.md` | La ficha del estilo (paleta, letras, repertorio de planos, ritmo, lo que no se copia). **Léela antes de diseñar.** |
| `plantilla/fuente/motor.js` | **El motor, que no depende del caso:** `foto`, `lamina`, `escena` (cámara), `cara`, `mira`, `visor`, `etiqueta`, `rotulo`, `cifra`, `titulo`, `barra`, `globo`, `subtitulo`, transiciones y `revisarCuadro`. No se toca para un caso nuevo. |
| `plantilla/fuente/pieza.src.html` | **El caso** (Dollar Shave Club como ejemplo, comentado frase por frase): `CTA`, `LINEAS` (frases), `FOTOS` y `CLIPS`, `AN` (anclas) y `ESC` (una escena por frase). Es lo único que se reescribe. |
| `plantilla/herramientas/construir.py` | De punta a punta: voz recortada → hora de cada palabra (whisper, opcional) → armar → **revisión de cuadros** → render → mezcla a −14 LUFS → hoja de contacto. |
| `plantilla/herramientas/revisar.mjs` | La revisión automática de cuadros (parte a de la lista). |
| `plantilla/herramientas/ganchos.py` + `gancho_png.py` | Dibujan los ganchos A/B/C (el único dibujante permitido) y guardan sus cajas. Letra libre Anton en `herramientas/fuentes/`. |
| `plantilla/herramientas/caras.py` + `caras.swift` | Caja de la cara de cada foto y de cada cuadro de clip (Vision de macOS). |
| `plantilla/herramientas/sfx/` | Pops y barridos graves para los golpes de sonido. |
| `plantilla/herramientas/tierra.mjs` + `plantilla/assets/land-110m.json` | Regeneran los puntos del globo (`fuente/tierra.js`). |
| `ejemplo/` | El caso resuelto: guion, fuentes de cada cifra y de cada imagen (`LEEME.md`), la tabla de etiquetas y `cuadros.jpg` (8 cuadros del video terminado: mírala con Read para ver el look). Las imágenes sueltas del caso no vienen (son de terceros). |

Arma y renderiza con el motor de la skill `clonador-de-edicion-f100k` (`scripts/armar.mjs`, `scripts/renderizar.mjs`), que tiene que estar instalada. La primera vez corre `node ~/.claude/skills/clonador-de-edicion-f100k/scripts/preparar.mjs` (instala lo que falta). Si la tienes en otra carpeta, define `CLONADOR_EDICION` con su ruta. Necesitas también ffmpeg, Python 3 y `uv`. whisper.cpp es opcional: con él cada cambio cae en la palabra exacta; sin él, el tiempo se reparte por letras.

## Qué te pido antes de empezar
1. **El caso:** una empresa, una marca o una persona con **3 o 4 cifras verificables** (inversión → resultado → venta o valor) y un giro («no vendía X, vendía Y»).
2. **Tu CTA:** la palabra que tienen que comentar y el regalo que les mandas (con una captura plana de ese regalo).
3. **Tu voz:** grabada o clonada.

## Proceso (un caso nuevo: cambian los datos y las imágenes, no el motor)
`$SKILL` es la carpeta de esta skill (normalmente `~/.claude/skills/expediente-inteligencia-f100k`).

**0 · Caso y cifras.** Cada cifra va en una tabla de fuentes como la de `ejemplo/LEEME.md`. Si una cifra no es oficial, la voz dice «reportado». No se inventa nada: si no hay fuente, se pregunta.

**1 · Carpeta del proyecto.**
```bash
D=~/Documents/mi-contenido/expedientes/$(date +%F)_<caso>; mkdir -p $D/voz $D/voz-gancho $D/revision
cp -R $SKILL/plantilla/{fuente,herramientas,nucleo,assets,ganchos.json} $D/
```
En Windows (PowerShell) es lo mismo con `Copy-Item -Recurse`.

**2 · Guion de 12 o 13 frases:** 1 gancho con el hecho y la cifra · 2 fecha y protagonista · 3 qué vendía · 4 el detalle humano · 5 costo · 6 resultado · 7 consecuencia · 8 «¿por qué funcionó?» · 9 el giro · 10 quién compra o qué pasa años después · 11 la cifra final · 12 la lección en 3 pasos que se pueden hacer · 13 tu CTA («comenta [TU PALABRA] y te mando [tu regalo]»). Frases simples, sin jerga: si alguien que nunca usó la herramienta no lo entiende, se reescribe. Nada de frase puente tipo «pero antes…»: se entra directo a la historia. Dos versiones: lo que se DICE (cifras en palabras, para la voz) y `LINEAS[].txt` (cifras en número, con la palabra clave entre `*asteriscos*`, siempre entre comillas simples). Pon tu palabra y tu regalo en `CTA` arriba de `LINEAS`.

**3 · Imágenes reales: una por cada cosa que la voz nombra.** Antes de escribir una sola escena, llena esta tabla y no avances si queda un hueco:

| Frase | Lo que nombra | Imagen real que lo muestra | Fuente |
|---|---|---|---|
| «sube este video a YouTube» | el video en YouTube | captura de la página de YouTube con el reproductor, la duración y la fecha | youtube.com |
| «desde un dólar al mes» | el precio | captura del sitio de esa época con el precio | web.archive.org |
| «Unilever compró» | el comprador | logo en un letrero real + foto de la sede | Wikimedia Commons (con crédito) |
| «el precio reportado» | el titular | captura del titular del medio | el medio |
| «comenta [PALABRA]» | tu regalo | captura plana de tu regalo → `img/regalo.png` | tuya |

Dónde salen: el video original (cuadros sueltos y clips cortos de 1 a 3 s a 15 por segundo en `fuente/img/clipX/001.jpg…`), capturas del navegador (vertical 540×960 a escala 2; recorta la barra del navegador y cualquier dato de tu cuenta), Wayback Machine para el sitio de la época, Wikimedia Commons para sedes y logos (anota autor y licencia). **Si una imagen no existe, cambia el plano; no la reemplaces por un dibujo ni por una foto que «se parece».** Borra de `fuente/img/` lo que no uses.
Después: `python3 $D/herramientas/caras.py $D` (escribe `fuente/caras.js`). Funciona en Mac; en Windows, abre cada foto con Read, mide la caja de la cara completa en fracciones de la imagen y escríbela tú en `fuente/caras.js` con el mismo formato.

**4 · Anclas.** En `AN` de `pieza.src.html` declara cada cosa señalable: `clave: ['foto', 'qué es, con palabras', [x, y, ancho, alto]]` en fracciones de la foto (mídelo abriendo la imagen con Read). La descripción es lo que sale en la tabla «ETIQUETA → LO QUE SEÑALA»: escríbela para que un tercero pueda comprobarla.

**5 · Escenas.** Reescribe `ESC`, una función por frase (ver el ejemplo, que está comentado frase por frase). Reglas del oficio:
- La escena se parte en planos con `T('palabra')`: `if (u < T('sube')) {…cara…} else {…captura de YouTube…}`.
- Foto a pantalla completa: `foto(im, camara([fx, fy, z0], [fx, fy, z1], avance), { sy })` → devuelve el mapa `m`. Captura como lámina: `escena(cx, cy, zoom, () => lamina(im, x, y, ancho))`.
- Señalar: `const a = ancla(m, 'clave')` o `cara(m, CARAS['foto'], 'la cara de …')` → `mira(a, p)` (caras) o `visor(a, p)` (cosas) → `etiqueta(a, 'TEXTO', 'SEGUNDA LÍNEA', { lado: 'abajo' })`. En láminas claras, `visor(a, p, { color: '#0a0a0a', w: 5 })`.
- Contexto sin señalar (lugar, fecha, fuente): `rotulo()`. Cifras: `cifra()` contando con `ease(prog(u, T('costó'), T('4.500') + .4))` para que llegue al número cuando se dice.
- Cada aparición va dentro de `if (on(t))`: además de mostrarla, apunta su golpe de sonido para la mezcla.
- Un `titulo()` grande que dice lo mismo que el subtítulo lo apaga solo (no se repite debajo).
- **Gancho:** escena a pantalla completa con 2 planos del material más fuerte, la cámara enganchada a la cara con `zoomPara(...)` para que quede debajo del bloque, y al final `ctx.drawImage(IM['gancho_'+VAR], …)` + `reg('gancho', …)`.
- **Cierre:** tu palabra grande (`CTA.palabra`) y la captura de tu regalo (`img/regalo.png`), plana y a color, que se desplaza despacio. El CTA se dice también a mitad del reel si el guion lo pide.

**6 · Gancho A/B/C.** Edita `ganchos.json` y corre:
```bash
# ganchos.json: {"A": {"grande": "$4.500 VALIERON", "chica": "mil millones", "color": "verde"}, "B": {...}, "C": {...}}
python3 $D/herramientas/ganchos.py $D $D/ganchos.json <un cuadro 1080x1920 del plano 1, para ver la prueba>
```
Verde si es un logro, rojo si es negativo. Mira `revision/gancho_*_prueba.jpg` y **autoevalúa cada variante en voz alta** (¿marca o cifra real? ¿es el hecho y no la moraleja? ¿las dos líneas se leen como UNA frase? ¿la voz arranca diciendo lo mismo en 12 palabras o menos?). Anota en el LEEME cuál es la principal y por qué. Las otras dos sirven para subirlas como prueba (trial reels).

**7 · Voz.** Un audio por frase, en orden: `voz/01.mp3 … 13.mp3` (mp3). Para B y C solo cambia la frase 1 → `voz-gancho/01_B.mp3`, `01_C.mp3`.
- **Tu voz:** graba cada frase en una toma limpia, con el mismo tono y la misma distancia al micrófono.
- **Voz clonada:** pide cada frase pasándole al generador el guion entero como contexto (texto anterior y siguiente), nunca frase por frase sin contexto: si no, cada frase suena con otra entonación.

**8 · Construir y revisar** (una vez por variante):
```bash
python3 $D/herramientas/construir.py $D A $D/EXPEDIENTE-<CASO>_A.mp4 --solo-revisar   # rápido: solo la revisión de cuadros
python3 $D/herramientas/construir.py $D A $D/EXPEDIENTE-<CASO>_A.mp4 --musica <tu-musica.mp3>   # completo
```
La música es opcional y la pones tú: oscura y con pulso, sin voz (va con ducking debajo de la voz). Pasa la **lista de revisión de cuadros** de arriba sobre `revision/hoja-contacto_A.jpg`. Corrige y repite hasta que todo sea «sí».

**9 · Entrega.** Deja un `LEEME.md` con el guion, la tabla de fuentes de cifras, la tabla de fuentes de imágenes (con los créditos de Wikimedia, que también van en el caption), el gancho elegido y los números de la revisión de cuadros.

## Reglas del estilo (detalle en `estilo.md`)
- **Monocromo** en fotos, capturas y HUD. Los únicos colores: el del gancho (verde logro / rojo negativo), el **amarillo** en la palabra clave del subtítulo y la captura de tu regalo en el cierre.
- 3 letras: Work Sans 600 en el subtítulo, JetBrains Mono en MAYÚSCULAS en etiquetas y rótulos, Inter Tight 800 en cifras, títulos y la clave del subtítulo.
- Etiquetas y subtítulos entran con **corte seco**. Entre escenas, transición corta (barrido con línea de escaneo, lado o empuje, 0,22 s). Nada tiembla y nada brilla.
- El globo va **oscuro** (puntos claros sobre negro) para que el subtítulo se lea sin caja.
- Efectos graves y cortos (`herramientas/sfx/`), con pasa-bajos a 2,8 kHz y 0,3 s como mucho.
- Cierra con «comenta [TU PALABRA]» sobre la captura plana de tu regalo.

## Errores que ya costaron un rechazo (no repetir)
| Lo que pasó | Cómo lo impide la plantilla |
|---|---|
| Gancho a la izquierda sobre fondo negro | `gancho_png.py` solo dibuja centrado; la escena del gancho es `foto()` a pantalla completa |
| «YOUTUBE · 1:33» apuntaba a la boca del fundador | no había captura de YouTube; ahora la etiqueta cuelga del ancla `yt_duracion` de la captura real |
| El nombre del fundador apuntaba a un ojo | la mira usa la caja de la cara completa (`caras.py`) |
| La segunda línea se salía y el subtítulo tapaba una etiqueta | `etiqueta()` se acomoda dentro de la zona segura y `revisar.mjs` falla si algo se encima |
| Memo falso, pasillo dibujado, máquina en vector | cada plano es una foto o captura real con su fuente; el dibujo solo es acento (visor, tachado, barra) |
| Subtítulo en cajita gris | texto suelto con sombra, clave amarilla |
| Planos quietos | `camara()` siempre avanza; `revisar.mjs` mide el tiempo congelado |
