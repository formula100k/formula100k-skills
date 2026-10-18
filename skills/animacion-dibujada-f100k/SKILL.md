---
name: animacion-dibujada-f100k
description: "Fabrica clips y cortos animados 9:16 donde CADA CUADRO SE DIBUJA CON CÓDIGO (canvas + JavaScript): sin IA de video y sin créditos. 13 estilos de clip para meter como inserto en un reel (libreta a mano, pizarra, post-its, chat, notificaciones, ticket, gráfica, mapa, pixel art, tinta, scrapbook y polaroid con tus fotos), mascotas pixel chiquitas que caminan sobre tu mesa ENCIMA del video (tu sello de marca) y un sistema de cortos de 30-90 s: tu mascota dibujada a partir de tu foto (vector, pixel o papel), tu propio personaje animado como títere, escenarios y objetos de 12 rubros, transiciones, subtítulos y tu voz. Render local en segundos. Activar con: 'animación dibujada', 'como las de Opus 5.5', 'animación en JavaScript', 'pixel art', 'mi mascota', 'mascotas pixel en mi mesa', 'pixel mascots en mi video', 'hazme un personaje', 'anima mi personaje', 'corto animado', 'video explicativo animado', 'B-roll dibujado', 'anima esta frase del guion'. NO hace video realista ni con personas reales en movimiento (eso es Higgsfield)."
---

# Animación dibujada (cada cuadro en código)

Cada cuadro es una función de su número: `draw(frame)` pinta en un canvas y un Chrome sin ventana
lo fotografía cuadro por cuadro hasta armar el MP4. No hay imágenes, ni modelo de video, ni créditos.
La pieza no es decoración: dice **la frase que vende** del guion, en el momento en que se dice.

Técnica adaptada de iart-ai/javascript-animation-skills (MIT, `scripts/LICENSE-iart-ai.txt`).
El render y todos los estilos son propios.

## Antes de empezar: tu negocio y tu marca

Los datos y los colores son los de la persona que te pide la pieza, nunca los de un ejemplo de esta skill.

- **Marca** (paleta, letra, textura): búscala en este orden y usa la primera que exista:
  1. `~/Documents/mi-contenido/mi-marca.md`;
  2. su manual de identidad visual, `mi-marca/marca.md` (en la carpeta del proyecto, en `~/mi-marca/` o en una carpeta `mi-marca` de sus documentos);
  3. si no hay ninguno, pregúntale en un solo mensaje sus 2 o 3 colores y si su letra es más a mano o más limpia.
     Ofrécele guardar la respuesta en `~/Documents/mi-contenido/mi-marca.md` para no volver a preguntar.
- **Negocio y voz** (qué vende, a quién, cómo habla): `~/Documents/mi-contenido/mi-negocio.md` y `~/Documents/mi-contenido/mi-voz.md`.
  Si no existen, sale todo del guion que te pasa; no inventes oferta, precio ni cifras.
- **Su marca manda sobre el estilo.** Los colores que traen los estilos son solo de muestra: si la persona tiene marca,
  cámbialos por los suyos en cada pieza (y la letra, si el estilo la deja cambiar). El estilo pone la forma; su marca, el color.

`$SKILL` es **la carpeta de esta skill** (la que tiene este `SKILL.md`). Según cómo la instaló, puede estar dentro del plugin
y no en `~/.claude/skills`: usa la ruta real.

## El camino (siempre este)

1. **Elige el estilo** por lo que dice el guion en ese momento (tabla abajo). Un reel lleva 1 o 2 clips, no más:
   son el golpe visual, no el reel. (Las mascotas sobre el video van aparte: son cameos chicos, ver su sección.)
2. **Ármalo en la carpeta del proyecto** (un solo archivo, con el núcleo adentro):
   `node "$SKILL/scripts/armar.mjs" <estilo> "$DEST/animaciones/<nombre>.html"`
3. **Cambia SOLO el bloque «LO QUE PUEDES CAMBIAR»**: la frase, los colores y la duración. Nada más.
   Pon ahí los colores de su marca (ver «Antes de empezar»); los del estilo son de muestra.
4. **Revisa antes de renderizar** (esto lo haces tú, no la persona):
   `node "$SKILL/scripts/renderizar.mjs" <pieza>.html "$DEST/animaciones/hoja.jpg" --hoja .5`
   y **mira la imagen**. Luego 2 cuadros a tamaño completo (`--cuadros 2s,5.5s`) para leer el texto.
   Checklist abajo. Corrige y vuelve a mirar. **Pasa el criterio anti-deformación** (sección de abajo) en cada cuadro grande.
5. **Renderiza**: `node "$SKILL/scripts/renderizar.mjs" <pieza>.html "$DEST/animaciones/<nombre>.mp4"` (~3 s por clip).
6. **Entrega** la ruta del MP4 y la fila del MANIFEST (sección de abajo).

Primera vez en una máquina: `cd "$SKILL" && npm i` (instala playwright-core).
`$DEST` es la carpeta de trabajo de la persona (por ejemplo `~/Documents/mis-animaciones`); créala si no existe.
Necesita Node 18+, ffmpeg y Google Chrome (Mac o Windows). Opcionales, con `uv`: recortar fotos, detectar la cara y los subtítulos
por palabra. Todo lo que cambia entre Mac y Windows pasa por `scripts/sistema.mjs` (corre `node "$SKILL/scripts/sistema.mjs"` para ver qué ofrece):
en Mac usa Vision, `sips`, `say` y mlx-whisper; en Windows (y en Mac Intel), rembg, OpenCV, ffmpeg, las voces de Windows y faster-whisper.

## Qué estilo elegir

| Estilo | Úsalo cuando el guion… | Qué cambias |
|---|---|---|
| `libreta-a-mano` | (plumón mágico, sin mano) suelta la frase gancho o una verdad incómoda («lo que nadie te dice de…») | `FRASE_ESCRITA` (≤ 40 letras; si trae MAYÚSCULA con tilde se escribe toda en minúscula), `PALABRA_FUERTE` (UNA palabra de la frase, se subraya), colores |
| `personaje-cuadrito` | celebra un logro o un antes→después emocional («¡ya tengo mi oferta!») | `CARTEL` (≤ 32 letras), color del cuerpo, `DUR` |
| `mago-pixel` | promete una transformación o un «truco» («vende con magia», «tu bio en 3 pasos») | `FRASE`: grande si cabe en 3 renglones de ≤ 10 letras; si no, normal hasta 3 de ≤ 21 (más largo = el render se detiene). MAYÚSCULAS, sin tildes ni comillas. La túnica debe contrastar con el cielo. El texto se completa cerca del s 3 |
| `tinta-blanco-negro` | abre una historia, un recuerdo o un capítulo («todo lo que aprendí antes de vender») | `TITULO` (≤ 45 letras), los 2 colores `TINTA` y `PAPEL_C` (cada uno en su línea) |
| `chat-que-vende` | cuenta lo que le escribe la clienta: la objeción, la pregunta del precio, el «lo quiero» | `MENSAJES[]` (≤ 4, `de: 'ella'\|'tu'`, ≤ 45 letras c/u), `NOMBRE` del chat, colores |
| `scrapbook-fotos` 📷 | muestra un antes → después o un proceso con fotos REALES de la persona | `FOTOS[]` (2 o 3), `PIES[]` (lo que se escribe bajo cada foto), `TITULO` de la etiqueta, colores de cinta |
| `polaroid-que-se-revela` 📷 | revela un resultado o un momento («ocho semanas después») con UNA foto real | `FOTO`, `PIE` (≤ 32 letras), `FOCO` (qué parte de la foto queda al centro) |
| `grafica-que-sube` | promete un antes → después o un crecimiento («cómo se ve la vida ocho semanas después») | `TITULO` (≤ 45), `RESALTAR`, `ETIQUETA_ANTES`/`ETIQUETA_DESPUES`, `VALORES` (solo la forma, 3-7 barras), `NUMERO_FINAL` + `UNIDAD` (`null` = sin número; SOLO cifras del guion), colores |
| `pizarra-tiza` | enseña un paso a paso, los pilares o una lista corta («hablaría de tres pilares») | `TITULO` (≤ 40), `PASOS` (2 o 3, ≤ 40 c/u), `PALABRA_CLAVE` (la encierra un círculo de tiza), colores de pizarra y tiza, `brillo` de la tiza mágica |
| `post-its` | enumera 3-4 pasos, errores o formatos y marca el bueno o tacha el malo («no hablaría de mi currículum») | `TITULO` (≤ 30, opcional), `NOTAS[]` (3-4, ≤ 45), `MARCA` (`'tacha'`\|`'palomita'`\|`''`), `MARCA_EN`, colores |
| `ticket-de-venta` | cierra con sensación de pedido hecho o de venta («para cuántos da», «mesa cuatro») | `ENCABEZADO` (≤ 24), `LINEAS[]` (3-4; con 5 la letra queda chica), `TOTAL.valor` (SOLO cifras del guion), `FRASE_FINAL`, `SELLO` (≤ 10), colores |
| `mapa-de-ruta` | promete un camino de A a B con paradas («de publicar sin rumbo a vender por DM», los 3 pilares) | `DESDE`, `PARADAS[]` (2 o 3, ≤ 26), `HASTA` (≤ 24), paleta |
| `notificaciones-que-llueven` | muestra lo que pasa cuando el contenido funciona o lo que te preguntan por mensaje | `NOTIFS[]` (4-8, `{icono, titulo, texto}`, íconos genéricos: mensaje, comentario, corazón, venta, agenda, mención), `FRASE` (≤ 50), colores |
| `mascota-en-tu-espacio` 🟩 | nombra algo que una mascota puede simbolizar y la persona quiere su **sello de marca**: mascotas pixel chiquitas sobre SU mesa, encima del video | `MASCOTA`, `PAREJA`, `ACCION`, `MESA`, `TAMANO`, `FONDO`. Ver «Mascotas sobre tu video» |

🟩 = **va ENCIMA del video, no lo reemplaza.** Sale sobre verde para quitárselo en el editor. Es el único estilo que no es B-roll a pantalla completa.

📷 = **usa fotos reales.** Copia las fotos a `$DEST/animaciones/fotos/` (achícalas antes: `node "$SKILL/scripts/sistema.mjs" achicar foto.jpg fotos/foto-1.jpg 1400`)
y pon la ruta relativa en `FOTOS`/`FOTO`. Las fotos son de la persona dueña de la cuenta, nunca de bancos de imágenes ni de otra gente.
Si una foto no carga, el render se detiene y te dice cuál: nunca sale un cuadro vacío.

La frase del clip sale **del guion literal**: la línea que dice la persona en ese momento, recortada.
Nunca inventes cifras ni promesas que el guion no dice.

## Mascotas sobre tu video (`mascota-en-tu-espacio`)

Mascotas pixel de unos 96 px que caminan, saltan o bailan **sobre la mesa real** del video mientras la persona habla.
Son un sello de marca: chiquitas, acompañan y no distraen. Aparecen con un puf, duran 3 a 6 s y se van.

**Qué mascota va.** La que simboliza lo que se dice en ese momento; una forma con cara no basta.

| Mascota | Simboliza | Mascota | Simboliza |
|---|---|---|---|
| `gato` (gatito con lentes) | la marca, «te lo explico» | `estrella` | una skill, una habilidad |
| `iman` | atraer | `hoja` | el guion |
| `bolsa` | vender, convertir | `libro` | la guía, el regalo |
| `reel` | el contenido | `lupa` · `micro` | analizar · el audio |

La principal es la que la persona elija como su mascota de marca (si no tiene, pregúntale; el gato es solo la de muestra).
`PAREJA` suma una segunda (la principal + el símbolo del momento). El acento de las mascotas (`C.acento`) es el color de su marca. Caminan juntas y dan la vuelta sin cruzarse.

**El camino:**

1. **Saca un cuadro real del video** y ponlo junto a la pieza: `ffmpeg -ss 30 -i video.mov -frames:v 1 -vf scale=1080:1920 cuadro.jpg`.
   Saca dos o tres en momentos distintos: la mesa libre cambia si la persona mueve las manos.
2. **Mide la mesa** sobre el cuadro (Read): dos puntos con superficie libre, lejos del borde de la mesa y de lo que haya encima
   (laptop, vaso, manos). Eso es `MESA = { x, y, x2, y2 }`. Si la mesa se ve inclinada, `y2` es distinta de `y`.
   Las mascotas van y vienen **dentro** de esa línea: nunca caminan al vacío.
3. **Revisa sobre el cuadro**: `FONDO = 'cuadro.jpg'` → hoja de contacto (`--hoja 1`) y mírala. ¿Pisan madera? ¿Tapan algo? ¿Se reconocen?
4. **Entrega sobre verde**: `FONDO = 'verde'` → `renderizar.mjs pieza.html mascota.mp4`. En CapCut va en la pista de arriba,
   en la palabra que dispara la idea → Croma → gotero sobre el verde. Ningún color de la mascota puede ser verde.

**Límites honestos (dilos al entregar):**
- La posición es fija: sirve con la cámara quieta. Si la cámara o la mesa se mueven, la mascota flota.
- No hay oclusión: si la persona baja la mano a la mesa, la mascota queda dibujada encima.
- La mesa suele caer en los 450 px de abajo, que Instagram tapa en parte con el caption. Aquí la zona segura cede a propósito.
- Solo en superficies: mesa, escritorio, repisa. En hombros no, porque el cuerpo se mueve y la mascota se queda.
- Como mucho una cada 3 a 5 s y nunca junto a otra animación.
- Mascota nueva: se dibuja en la grilla de 16 dentro de `TIPOS` (forma, colores, ojos, patas; el contorno sale solo).
  Pruébala a tamaño real: si a 96 px no se reconoce, simplifícala. Ningún personaje de otra marca.

## El sistema: tu personaje, tu rubro y cortos completos

Los estilos de arriba son clips sueltos. Para cualquier persona y cualquier rubro, las piezas se combinan en 4 capas:
**LOOK** (vector, pixel, papel…) × **PROTAGONISTA** × **ESCENA** × **MONTAJE** (clip, inserto o corto de 30-90 s).

### Protagonista: de dónde sale el personaje

| La persona te da… | Qué haces | Pieza |
|---|---|---|
| Una foto suya y quiere una **mascota** | **Tú MIRAS la foto** (Read) y escribes su ficha: pelo (color, largo, estilo), piel, ojos, ropa, accesorios. El código NO adivina rasgos: medirlos a ciegas falla (toma la piel de una sombra, no ve el pelo largo). Pixelar la foto tampoco sirve: la cara sale borrosa e inquietante. | `nucleo/personaje.js` → `crearPersonaje(ficha, { estilo: 'vector'\|'pixel'\|'papel', alto })` |
| Una descripción («un gato naranja con delantal») | Escribes la ficha (`tipo: 'criatura'`) | igual |
| Su **propio personaje** (PNG, dibujo, logo con cara) | Lo animas como **títere**, sin redibujarlo: respira, salta, se bambolea, parpadea y abre la boca (ojos y boca de `preparar-foto.mjs`, o escritos a mano en un JSON si no encuentra la cara) | `nucleo/titere.js` → `crearTitere(img, { cara })` |
| Una foto y quiere salir **ella misma** | Recorte (sticker con borde blanco) o títere con su foto real | `stickerDe(img)`, `estilos/tu-foto-sticker.html` |

Las fichas viven junto al proyecto de la persona, no en la skill. En `personajes/` solo hay ejemplos. Esquema y ejemplos: `personajes/ejemplo-*.json`.
Personaje y títere tienen la MISMA API: `p.dibujar(ctx, x, y, { accion, t, mira })` con las acciones `quieto`, `caminar`, `saludar`, `señalar`,
`saltar`, `hablar`, `festejar`, `pensar`, `presentar` y `contar` (con `n`). (x, y) = los pies. El personaje suma `expresion`
(`feliz`, `sorpresa`, `duda`, `triste`, `guiño`) y camina DE PERFIL: pásale `velocidad` (px/s) para que los pies no patinen y `desdePerfil`
para que gire de frente al llegar (escena-personaje ya lo hace). El títere suma gestos dibujados alrededor (mitón que saluda, flecha con
`hacia`, nube de pensar, destellos), `estilo: 'foto'|'sticker'|'recorte-papel'` y, si el dibujo tiene brazos separados, `partes` para rotarlos.
**Fotos → recorte y cara (gratis, local, Mac y Windows):** `node "$SKILL/scripts/preparar-foto.mjs" foto.jpg carpeta/` deja `<nombre>-recorte.png` + `<nombre>-cara.json`
(en Mac 14 o más nuevo usa Vision de Apple; en Windows y en Macs anteriores, rembg y OpenCV con `uv`: la primera vez descargan su modelo y tardan unos minutos).
Solo el recorte: `node "$SKILL/scripts/sistema.mjs" recortar foto.jpg salida.png`. **Mira el recorte antes de usarlo.**

**Límites honestos:** las criaturas caminan de frente (solo gira la cabeza). En pixel, `contar` no muestra la cifra. La boca de una FOTO es sutil
(acompaña la voz, sin audio casi no se nota). En fotos no hay brazos que mover: el gesto lo cuentan los elementos gráficos. Personaje de 700 px o más.

### Rubro: escenario y objetos

`nucleo/objetos.js` + `nucleo/kits/*.js`: `dibujarObjeto(nombre, x, y, tam, { t, estilo, anim: 'aparece'|'flota'|'late'|'brilla' })`,
`escenario(nombre, t, { estilo, paleta })`, `kitDe(rubro)`, `objetosDisponibles()`. Todo en vector o en pixel.
Kits hechos (12): **pasteleria, psicologo, dentista, restaurante, nutricionista, tienda-ropa, inmobiliario, makeup, fitness, centro-estetico,
joyeria, veterinaria**, más 16 objetos genéricos de negocio (celular, calendario, bolsa, billete, estrella, lupa, regalo…). Extras de composición:
`anim: 'entra-izq'|'entra-der'|'cae'`, `medidaObjeto(nombre)`, `componerFila(nombres, {…})`, `sombraContacto(...)`.
Un kit nuevo se carga agregando su `<script src="../nucleo/kits/<rubro>.js">` en kit-de-rubro, escena-personaje y receta-paso-a-paso.
¿Rubro sin kit? Usa `generico` y **dibuja los objetos que falten** con `registrarObjeto(...)` siguiendo el estilo del catálogo (contorno oscuro,
2 tonos, sombra plana y un detalle característico). Si un niño de 8 años no lo reconoce, simplifícalo. Después agrégalo como kit nuevo en `nucleo/kits/`.

### Montaje: cortos de 30-90 s

**Lo más fácil: un PLAN.** `node "$SKILL/scripts/armar-corto.mjs" plan.json <carpeta>` arma todas las escenas con sus cambios (texto, fichas, objetos),
genera una voz de PRUEBA para medir tiempos si aún no hay voz grabada y deja el `guion.json`. Formato del plan: comentario al inicio de
`scripts/armar-corto.mjs`. Regla de criterio: las escenas que YA muestran su texto (pizarra, ticket, post-its, notificaciones, kit, receta)
van con `"subtitulo": false`; el subtítulo va donde aporta (chat, personaje sin globo) o se dobla lo que se lee.

`node "$SKILL/scripts/corto.mjs" guion.json corto.mp4`. Cada escena es una pieza armada. Los tiempos salen de la voz (`inicio` de cada escena),
con transiciones (`corte`, `fundido`, `barrido-izq`, `barrido-arriba`, `zoom`, `circulo`, y dibujadas: `tinta`, `pagina`, `pixel`), subtítulos quemados
(`"sincronia": "palabra"` los alinea con la voz real vía Whisper local, con la palabra dicha resaltada; `"posicion": "auto"` busca la franja libre),
música con ducking bajo la voz y la voz mezclada.
`"encajar": true` acelera la escena (hasta 1,8×) para que termine a tiempo. Antes de renderizar: `node "$SKILL/scripts/hoja-corto.mjs" guion.json hoja.jpg`, y **mírala**.
Formato completo y consejos: `cortos/LEEME.md`. 40 s de corto se renderizan en unos 18 s.
La voz es la de la persona, grabada. La voz de la computadora sirve SOLO como voz de prueba para medir tiempos: nunca se entrega.
Si la computadora no tiene voz en español (pasa en algunas Windows), `armar-corto.mjs` lo dice y se detiene: pídele a la persona que grabe su voz y ponla en `"voz"` del plan.

| Escena para cortos | Úsala para… | Qué cambias |
|---|---|---|
| `escena-personaje` | el personaje dentro del lugar de su rubro, con objetos que aparecen y un globo | `FICHA` (objeto o ruta .json), `RUBRO`, `ESTILO`, `LUGAR`, `ACCIONES[]`, `FRASE`, `OBJETOS[]`, `TAMANO` |
| `personaje-en-escena` | el personaje solo, sobre un fondo simple (vector, pixel o papel) | `FICHA`, `ESTILO`, `ACCIONES[]`, `FRASE`, colores |
| `titere-propio` | el personaje que trajo la persona, en PNG | la imagen, su `cara`, `ACCIONES[]`, lo que dice |
| `tu-foto-sticker` | la persona recortada como sticker, con frase grande | foto recortada, `FRASE`, colores |
| `kit-de-rubro` | presentar el rubro: escenario + 5-6 objetos que entran | `RUBRO`, `TITULO`, `OBJETOS[]`, `ESTILO` |
| `receta-paso-a-paso` | un proceso con objetos, un paso por pantalla | `RUBRO`, `TITULO`, `PASOS[{objeto, texto}]`, `SEG_POR_PASO` |
| `escena-texto-cinetico` | la frase dicha, palabra por palabra, con la clave resaltada | `TEXTO` (clave entre `*asteriscos*`), `ANIMACION`, `ETIQUETA`, colores |
| `escena-cta` | el cierre: la palabra a comentar | `ANTES`, `PALABRA`, `DESPUES`, colores |

## Criterio anti-deformación (no se negocia)

Un clip con algo deforme no se entrega, aunque el texto esté perfecto. Lo que salga raro se **quita o se cambia**, no se entrega «así».

1. **Nada de anatomía dibujada en vector**: manos, brazos, dedos, muñecas ni caras realistas. En canvas salen como una bola
   de piel con un palo encima, que no sostiene nada. Lo que escribe (tiza, plumón, lápiz) **va solo y flota**:
   `herramientaMagica(px, py, t, aparece, seVa, { tipo: 'tiza' | 'plumon' })` del núcleo, con brillo, chispas y destello al entrar y salir.
2. **Excepción: personajes estilizados a propósito** (el cuadrito con brazos de palito, el mago en pixel art). La anatomía es una
   convención del dibujo, no un intento de parecer real. Se declaran con `// ANATOMIA: estilizada — <por qué>` en la pieza.
3. **El freno automático**: `renderizar.mjs` lee el código antes de abrir Chrome. Si encuentra mano, brazo, dedo, piel, manga… sin la
   declaración de estilizada, **se detiene** y dice qué encontró. No lo esquives renombrando variables: cambia el dibujo.
4. **Mirando los cuadros grandes** (esto lo hace el ojo, no el freno), por cada objeto pregúntate:
   - ¿Se entiende qué es sin explicarlo? ¿Un niño de 8 años diría lo mismo?
   - ¿Se une bien con lo que toca (el objeto con la mano, el cartel con el palo, la tapa con el plumón)? ¿Nada flota por error?
   - ¿Tapa texto ya escrito? Nada puede cubrir la frase que vende, ni un cuadro.
   - ¿Es más grande que el texto? Lo que escribe es un acento chico, no el protagonista.
   - ¿Un marco, círculo o subrayado se come la letra de al lado?
   Si alguna respuesta es mala, simplifica: quita el objeto, hazlo más chico o cámbialo por una forma que no pueda salir mal.

## Checklist (mirando la hoja de contacto y los cuadros grandes)

- Pasa el criterio anti-deformación (arriba).
- El texto se lee completo en un celular, sin salirse del cuadro ni de su caja.
- Nada importante fuera de la zona segura de Instagram (250 px arriba y 450 px abajo libres).
- El último cuadro está quieto y con el texto completo (el clip termina, no se corta).
- Tuteo y español neutro en todo texto visible. Tildes bien puestas (salvo en `mago-pixel`, que no las tiene).
- Nada de marcas ajenas: ningún personaje de otra empresa (tampoco el de Claude), ningún logo.

## Meterlo al reel (editor-video-formula100k)

Cada clip es un MP4 1080×1920 sin audio: entra como B-roll de video a pantalla completa. Fila para el MANIFEST:

```
## B-roll
| Keyword | Archivo | Duración | Estilo |
|---|---|---|---|
| lo que nadie te dice | animaciones/gancho-libreta.mp4 | 4s | monitor-photo |
```

La keyword es una frase que la persona **dice** en la grabación (el editor la busca en la transcripción).
La duración del B-roll puede ser menor que la del clip: el editor lo corta.
Para CapCut: se pone en la pista de arriba en ese momento, sin croma (el clip ocupa toda la pantalla).

## Estilo nuevo (si ninguno sirve)

Copia el estilo más parecido dentro de `estilos/` con otro nombre y cambia el dibujo. Reglas del motor (`nucleo/nucleo.js`):

- **Función pura del tiempo.** Nada de `Math.random`, `Date` ni animaciones CSS: usa `rng(semilla)` y `hash2(a,b)`.
  Si no, el render y la vista previa no coinciden y el video parpadea.
- **Hervor, no temblor.** La línea a mano cambia cada 3-4 cuadros (`BOIL = Math.floor(frame/4)`), no en cada cuadro.
- **Cuerpos con formas redondeadas** (`circle`, `roundRect`), nunca polígonos de pocos puntos.
- **Sin anatomía realista**: si algo escribe o señala, flota solo (`herramientaMagica`). Ver «Criterio anti-deformación».
- **Pixel art de verdad**: pinta en una grilla chica y agrándala con `imageSmoothingEnabled = false`
  (ver `mago-pixel`). Un solo tamaño de pixel en toda la escena.
- **Texto medido**: `autoajuste()` elige tamaño y renglones (prefiere menos renglones y parejos; un espacio duro `\u00A0` no se corta).
  Si no cabe, avisa en consola y `renderizar.mjs` muestra el aviso: léelo siempre al final del render.
- **Fotos reales**: `cargarFotos([...])` al inicio y `fotoCover(img, x, y, w, h, fx, fy)` para pintarlas recortadas sin deformar
  (ver `scrapbook-fotos`). Los filtros de canvas (`ctx.filter`) sirven para revelar o envejecer la foto: son deterministas.
- Fuentes solo del sistema (`LETRA_MANO`, `LETRA_LIMPIA`): cero descargas.
- Cuando el estilo nuevo pase el checklist en 2 piezas distintas, agrégalo a la tabla.

## Movimiento y textura

Lo que separa una animación plana de una con oficio. El núcleo (`nucleo/nucleo.js`) trae estas funciones: todas son
puras y deterministas (misma entrada, mismo cuadro) y baratas de dibujar.

**Cómo se mueve**

- Entra en la palabra y **aterriza seco**: entradas de 0,3 a 0,6 s, nunca lineales.
- **Un solo movimiento protagonista** por pieza; lo demás lo acompaña en cascada, nunca todo a la vez.
- **Anticipa** antes de un movimiento grande, **sostén quieto** lo suficiente para leer y sal más rápido de lo que entraste.

| Función | Qué hace |
|---|---|
| `resorte(t, { rebote, amortigua })` | 0→1 que se pasa de largo y se asienta. `rebote` = cuántas veces oscila (1.5), `amortigua` = qué tan pronto se calma (5). |
| `aterriza(t)` | 0→1 que sale rápido y frena seco, sin rebote. |
| `anticipa(t, cuanto, impulso)` | 0→1 que primero retrocede `cuanto` (.12) durante `impulso` (.3) del tiempo y después sale. |
| `escalonado(i, n, t, solape)` | El avance 0→1 de la pieza `i` de `n` cuando el conjunto va en `t`: entradas en cascada. `solape` 0 = una tras otra, 1 = todas juntas. |
| `caer(seg, { desde, piso, gravedad, rebotes, elastico })` | La `y` de algo que se suelta en `desde` y rebota en `piso`. `seg` va en segundos; fórmula cerrada, sin estado. |

`t` es el avance de 0 a 1: `resorte(prog(t, .2, .7))` hace la entrada entre los segundos 0,2 y 0,7.

**De qué está hecho**

Textura en vez de formas planas. La semilla es fija: no hierven solas (para eso está `ink` con `BOIL`).

| Función | Qué hace |
|---|---|
| `acuarela(pts, color, { crece, alpha, borde, orilla, capas, semilla })` | Mancha de una forma cerrada: halo húmedo, lavado translúcido, marcas de agua y más pigmento en la orilla. `crece` 0→1 abre el agua desde el centro. |
| `pincel(pts, { w, col, alpha, seco, presion, semilla, p })` | Brochazo sobre 3 o 4 puntos (la curva se suaviza sola), con cerdas y vetas secas hacia el final. `p` 0→1 lo pinta solo. |
| `grano(alfa, semilla)` | Grano de papel solo sobre lo ya pintado: el fondo transparente sigue transparente. Va al final del cuadro, o antes del texto si lo quieres nítido. |

**Varias piezas para un mismo video:** antes de la primera, fija UNA paleta (máximo 3 colores + tinta), UNA letra,
UNA textura y UN carácter de movimiento, y úsalos idénticos en todas. Si no, cada pieza parece de un video distinto.

## Lo que esta skill NO hace

Video realista o con personas (Higgsfield / storytelling-animado-f100k), editar el reel completo
(editor-video-formula100k), overlays con fondo verde para CapCut (animaciones-para-tu-video-f100k),
música. Si lo piden, dilo en una línea y manda a la skill que sí lo hace.
