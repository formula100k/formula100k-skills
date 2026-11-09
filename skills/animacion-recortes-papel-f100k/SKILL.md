---
name: animacion-recortes-papel-f100k
description: Arma una animación vertical narrada de 20 a 30 s en estilo recortes de papel - un mundo-metáfora por tema (una tienda, un mostrador, una caja), encabezado en tira de papel que cambia en cada escena, subtítulos palabra por palabra sincronizados con la voz, mascotas pixel que llevan en la mano lo que representan (el reel con su imán, su regadera o su bolsa) y cierre con la palabra del CTA escribiéndose en una caja de comentario. Parte de un guion de una frase por escena y de la voz (grabada o de IA provisional) y saca sola los cortes y los subtítulos. Usar cuando digan «animación de recortes de papel», «explícalo con una animación narrada», «un mundo de papel para explicar [idea]», «animación con voz en off y subtítulos palabra por palabra», «convierte este guion en animación», «reel animado sin salir a cámara» o pasen un guion corto de voz en off para animarlo. NO usar para editar un video ya grabado, ni para piezas sin voz de 10 s, ni para dibujos cuadro a cuadro, ni para carruseles.
argument-hint: [tema o guion]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Animación · recortes de papel

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Un clip narrado, 1080×1920, 30 fps. Una idea se explica dentro de un **mundo de papel**: cada frase del guion es una
escena, y en cada escena pasa UNA cosa que se ve. La voz manda: los cortes de escena, los subtítulos y los momentos en que
se mueve cada pieza salen de los tiempos de la voz.

Lo que lo hace reconocible:

- **Encabezado fijo** arriba, en tira de papel con cinta, que cambia en cada escena.
- **Subtítulos palabra por palabra** abajo, en fichas; la palabra clave va en el color de acento.
- **Mascotas pixel que se entienden solas.** El protagonista es un reel (un teléfono con cara, botón de play, corazón y barra de avance) y la gente son personas pixel distintas entre sí. Cada una lleva en la mano el objeto de lo que representa.
- **Movimiento a saltos**, como recorte de papel movido a mano.

## 1. Del tema al mundo (hazlo antes de tocar archivos)

1. **Rubro y marca.** El negocio y la marca son los de la persona, nunca los de un ejemplo de esta skill.
   - **Negocio** (rubro, a quién le vende, qué vende): `~/Documents/mi-contenido/mi-negocio.md`; su voz, en
     `~/Documents/mi-contenido/mi-voz.md`. Si no existen, pregunta rubro, cliente y oferta en un solo mensaje.
   - **Marca** (color, letra y movimiento), en este orden: `~/Documents/mi-contenido/mi-marca.md` → su manual de
     identidad visual `mi-marca/marca.md` (de ahí salen el acento, el fondo, la tinta y su @) → si no hay ninguno, copia
     `references/marca.md` de esta skill a `~/Documents/mi-contenido/mi-marca.md`, pregunta lo que falte en un solo
     mensaje y déjaselo escrito.
   - **Su marca manda sobre el estilo:** los colores de `config.js` son de muestra; el `tema` y el `usuario` van con los suyos.
   Los ejemplos y el vocabulario salen de su rubro.
2. **Una sola idea.** Escríbela en una frase. Si necesita dos, son dos videos.
3. **Elige el mundo.** Un lugar físico donde esa idea se pueda VER. Las piezas que ya existen arman una **tienda**
   (fachada, vitrina, mostrador, caja, clientas, fila): sirve para todo lo que trate de atraer, atender, vender, cobrar o
   perder clientes. Si la idea pide otro mundo (un consultorio, una cocina, un tribunal), revisa primero si se arma con las
   piezas genéricas (lista, medidor, numeros, etiqueta, sello, globo, imagen); si no, dibuja de 3 a 5 piezas propias
   para ese video en `window.MUNDO`, al final de `config.js` (ver «Mundo propio»). `motor.js` no se edita.
   **Si es una serie, cada video lleva su propio mundo:** lo que se repite es la marca (voz, acento, mascotas), no el
   escenario. Antes de armar, compara con el video anterior: ni el mismo lugar, ni la misma escena de apertura, ni las
   mismas piezas protagonistas.
4. **Escribe el guion: una frase por escena, de 5 a 7 escenas.** Cada frase:
   - dura entre 2 y 5 segundos al decirla (de 6 a 16 palabras);
   - nombra algo que se pueda mostrar con una pieza;
   - lleva marcada con `*asteriscos*` la palabra que carga el sentido.
   Estructura que funciona: gancho que plantea el conteo o el conflicto → una escena por parte → la escena del error
   (fondo `noche`) → qué hacer → cierre con la palabra del CTA.
5. **Decide qué simboliza cada personaje.** Antes de colocar piezas, escribe una línea por personaje: quién es y qué
   objeto lo explica (`lleva`). Atraer = imán, nutrir o cuidar = regadera, vender = bolsa, quien paga = moneda, confianza
   = corazón. Si un personaje no lleva nada y no se entiende qué hace ahí, dale su objeto o quítalo. Si el objeto que
   necesitas no existe, se dibuja uno nuevo (ver «Mascotas pixel»).
6. **Por cada frase, decide qué pasa y EN QUÉ PALABRA pasa.** Eso es el campo `en` de cada pieza. Si no sabes qué
   mostrar en una frase, la frase sobra.
7. **Enseña el guion con su tabla de escenas y espera el visto bueno antes de armar.** Sin cifras, precios ni resultados
   inventados: si falta un dato, pregúntalo. El CTA va a un regalo que la persona ya tiene; no inventes regalos.

## 2. Flujo

```bash
SKILL=<la carpeta de esta skill>                 # la que tiene este SKILL.md (con el plugin no está en ~/.claude/skills)
DEST=<carpeta de salida>/<nombre-de-la-pieza>     # nunca dentro de la skill
mkdir -p "$DEST" && cp -R "$SKILL/plantilla/." "$DEST/" && cd "$DEST"
```

1. **Llena `config.js`.** Es lo único que se edita, incluidas las piezas propias del video (`window.MUNDO`, al final).
   `motor.js`, `motor.css` y `armar.mjs` no se tocan (`mascotas.js` solo para dibujar un objeto nuevo); `index.html` y
   `tiempos.js` los escribe `armar.mjs`.
2. **Pon la voz** (ver «La voz») y arma:
   ```bash
   node armar.mjs              # usa assets/voz.wav (o .mp3 / .m4a) si existe
   node armar.mjs --voz-ia     # genera una voz de IA provisional y la usa
   node armar.mjs --sin-voz    # sin audio: calcula los tiempos por largo de palabra (para bocetar)
   ```
   Lee lo que imprime: avisa si un `en` no está en la frase, si una escena dura menos de 0,8 s o si la voz dice otro texto.
3. **Valida:** `npx hyperframes lint`. Cero errores. Los avisos `nested_structure_needs_subcomposition`,
   `timeline_track_too_dense` y `composition_file_too_large` son esperados.
4. **Mira los cuadros** con el comando de `snapshot` que imprime `armar.mjs` (un cuadro al 80 % de cada escena). Abre
   `snapshots/contact-sheet*.jpg` y revisa: encabezado completo dentro de la tira, subtítulos en una sola línea, ninguna
   pieza tapando a otra ni saliéndose del cuadro, sellos y etiquetas legibles, y **cada mascota se entiende sin leer el
   texto** (se ve qué es y qué lleva; ninguna tapa el número o el dato que importa). Corrige en `config.js`, vuelve a correr
   `armar.mjs` y repite.
5. **Renderiza:** `npx hyperframes render --output <nombre>.mp4`. Borra `snapshots/`.
6. **Revisa el MP4**, no solo los snapshots:
   ```bash
   ffmpeg -y -loglevel error -i <nombre>.mp4 -vf "fps=1/1.5,scale=300:-1,tile=8x2" -frames:v 1 hoja.jpg
   ```
7. Entrega la ruta del MP4 y di qué le falta: si la voz es la provisional, que hay que grabarla; no trae música ni
   efectos de sonido salvo que hayas mezclado una pista (ver «Música, marca y serie»); y que el audio no lo
   escuchaste, solo lo sincronizaste por tiempos.

## 3. La voz

- **La voz real es la versión final.** La persona graba el guion tal cual (lo deja `armar.mjs` en `guion.txt`), sin
  cambiar palabras, y el archivo va en `assets/voz.wav` (también lee `.mp3` y `.m4a`). `node armar.mjs` lo transcribe y
  alinea cada palabra del guion con su tiempo.
- **La voz de IA es provisional.** `--voz-ia` usa una voz local gratis (la instala sola la primera vez). Sirve para ver el
  ritmo y aprobar la animación; suena a máquina. Se ajusta en `voz` (`velocidad`: 1 es normal).
- Si cambias una frase del guion, la voz vieja ya no coincide: vuelve a grabar o vuelve a correr `--voz-ia`.
- Si reemplazas `assets/voz.wav`, corre `node armar.mjs` otra vez: se recalculan cortes y subtítulos solos.

## 4. `config.js`

| Campo | Qué es |
|---|---|
| `id`, `titulo` | Nombre interno y título de la pieza |
| `usuario` | Usuario de la red; sale chico en la última escena. Vacío = no sale |
| `cola` | Segundos de aire después de la última palabra (1,6 por defecto) |
| `tema` | Paleta: `acento` (el color de marca), `papel`, `papel2`, `tinta`, `rosa`, `azul`, `salvia`, `kraft`, `kraft2`, `noche`, `rojo`, `luz`, `blanco` |
| `escenas[].encabezado` | Texto de la tira de arriba, corto (hasta ~28 letras); `*así*` resalta |
| `escenas[].frase` | Lo que dice la voz en esa escena; `*así*` marca la palabra clave del subtítulo |
| `escenas[].fondo` | Un color del tema (`papel`, `azul`, `rosa`, `salvia`, `noche`…) o un hex |
| `escenas[].piezas` | Lo que se ve, en orden de atrás hacia adelante |

**Tiempos de una pieza.** `en` (y `desde`, `hasta`, `apagaEn`, `saltaEn`, `pantallaEn`, `cajonEn`, `escribeEn`) aceptan:

- un **texto**: la acción ocurre cuando la voz dice esa palabra de la frase de la escena (basta el comienzo, sin tildes);
- un **número**: segundos desde que empieza la escena;
- nada: un tiempo razonable por defecto.

**Posición.** El cuadro mide 1080×1920. El escenario útil va de `y` 420 a 1300: arriba está el encabezado y desde 1350
los subtítulos. `x` e `y` son la esquina superior izquierda de la pieza; `escala` la agranda o achica; `rot` la gira.

## 5. Catálogo de piezas

| `tipo` | Qué es | Campos propios |
|---|---|---|
| `personaje` | El protagonista: el reel pixel | `tam` (100), `lleva` (`"iman"`, `"regadera"`, `"bolsa"`, `"moneda"`), `mira` (`"izq"` lo voltea: el objeto queda del otro lado), `quieto`, `color` (hex de la funda) |
| `gente` | Personas pixel | `modo`: `"pasan"` (cruzan, `n`), `"llega"` (entra y se detiene en `en`, con «!»), `"fila"` (`n`, `sep`), `"cliente"` (una). `tam`, `v` (0 a 4: pelo, piel y ropa), `color` (ropa), `lleva`, `mira` |
| `mascota` | Un objeto o mascota suelta | `sprite` (`"corazon"`, `"iman"`, `"regadera"`, `"bolsa"`, `"moneda"`, `"reel"`, `"persona"`), `alto`, `entrada`, `rot`, `mece` |
| `tienda` | Fachada con toldo | `ancho`, `alto` |
| `numeros` | Tarjetas 1, 2, 3… | `n`, `ancho`, `alto`, `sep`, `apagados:[2,3]` + `apagaEn`, `etiquetas:[…]` + `etiquetaY`, `saltaEn`, `desde` (número inicial) |
| `vitrina` | Ventana iluminada con rayos | `ancho`, `alto`, `marco`, `rayos:false`, `pedestal:false` |
| `mostrador` | Mostrador a todo lo ancho | — |
| `piso` | Franja de piso, fija | `color` |
| `medidor` | Barra que se llena | `etiqueta`, `segmentos` (5), `desde`, `hasta` |
| `fichas` | Hojas que viajan de un punto a otro | `de:[x,y]`, `a:[x,y]`, `n`, `desde`, `hasta` |
| `caja` | Caja registradora | `pantalla` + `pantallaEn`, `cajonEn` (se abre con monedas), `apagada:true` |
| `etiqueta` | Etiqueta de papel con texto | `texto`, `tam`, `mece:true` (cuelga y se mece) |
| `sello` | Sello rojo que cae de golpe | `texto`, `tam`, `rot` |
| `ojos` | Ojos que saltan (las vistas) | `n`, `sep` |
| `minis` | Mini teléfonos que caen en columnas | `columnas:[x…]` (centro de cada una), `porColumna` |
| `lista` | Filas con casilla que se marca | `items:[{texto, en}]`, `ancho` |
| `globo` | Globo de diálogo | `texto`, `tam`, `cola` (`"izq"`/`"der"`) |
| `rotulo` | Texto suelto | `texto`, `tam`, `color`, `ancho` |
| `imagen` | Foto o recorte propio (PNG sin fondo) | `src`, `ancho`, `entrada` (`"sube"`, `"cae"`, `"izq"`, `"der"`, `"pop"`), `sticker:false` |
| `regalo` | Tarjeta del regalo | `eyebrow`, `titulo` |
| `comentario` | Caja de comentario donde se escribe la palabra | `palabra`, `placeholder`, `boton`, `escribeEn` (por defecto, cuando la voz dice la palabra) |

Combinaciones que ya están probadas (copia las coordenadas de `plantilla/config.js`):

- **Abrir con el conteo:** `tienda` + `numeros` (con `apagados` si «solo hace uno») + `personaje`.
- **Atraer:** `piso` + `vitrina` + `personaje` adentro + `gente` que pasa + `gente` que llega y se detiene.
- **Atender o generar confianza:** `medidor` + `gente` cliente + `personaje` + `mostrador` + `fichas` o `globo`.
- **Vender:** `piso` + `caja` + `personaje` + `gente` cliente + `etiqueta` + `sello`.
- **El error:** fondo `noche` + `vitrina` chica sin rayos + `gente` en fila + `ojos` + `caja` apagada + `etiqueta` «CERRADO» + `sello`.
- **Repartir o resumir:** `numeros` con `etiquetas` + `minis`, o una `lista`.
- **Cierre con CTA:** `regalo` + `comentario` + `personaje`.

## Mundo propio (`window.MUNDO`)

Cuando la idea no pasa en una tienda, el lugar se dibuja para ese video sin tocar el motor. Al final de `config.js`:

```js
window.MUNDO = function (h) {
  const { el, pz, entra, menea, mascota, parpadea, PEGATINA } = h;   // ayudas del motor
  return {
    // { x, y, ancho, en }  → se usa en una escena como { tipo: "copiadora", x: 300, y: 700, en: "copia" }
    copiadora(ctx, o) {
      const w = o.ancho || 420, i = pz(ctx, o, w, w * 0.8, 330, 700);
      el("pp", i, `inset:0;background:#DDD;border:8px solid var(--tinta);border-radius:18px`);
      entra(i, o.entrada || "sube", ctx.cuando(o.en, 0.2));
    },
  };
};
```

- Cada pieza es una función `(ctx, o)`: `o` es lo que escribiste en la escena y `ctx.cuando(o.en, def)` devuelve el
  segundo en que se dice esa palabra. Lo que devuelve `MUNDO` se suma al catálogo: un nombre repetido reemplaza a la pieza de fábrica.
- Ayudas que recibe: `tl, el, pz, pop, sube, cae, lado, golpe, salto, menea, entra, mascota, parpadea, esc, marca, color,
  hex, cabe, PEGATINA`. Antes de usarlas, mira cómo las usan las piezas de `motor.js`.
- **De 3 a 5 piezas nuevas por video**, cada una con su movimiento propio (la máquina, el mueble, el objeto que hace de
  protagonista). Las genéricas (lista, sello, etiqueta, globo, comentario) acompañan, no cargan el video.
- Cambia también la paleta de fondos por escena respecto al video anterior de la serie.
- Prueba final: pon la hoja de cuadros junto a la del video anterior. Si a primera vista parecen el mismo video, no está listo.

## 6. Mascotas pixel

Viven en `mascotas.js`. Cada una se dibuja en una rejilla (1 unidad = 1 pixel) como lista de rectángulos
`[x, y, ancho, alto, color]`; el contorno de tinta y el borde blanco de pegatina se ponen solos.

- **Objetos (`PROPS`):** `iman`, `regadera`, `bolsa`, `moneda`, `corazon`. Sirven para `lleva` y como `sprite` suelto.
- **Cuerpos (`BASES`):** `reel` (20×30) y `persona` (16×24, cinco variantes con `v`). `mano: [x, y]` es donde se engancha el objeto.
- **Colores especiales:** `"A"` el acento del tema, `"E"` ojo que parpadea, `"G"` brillo del ojo, `"_"` hueco sin contorno
  (el asa de la bolsa, el centro del imán), `"N"` chispa sin contorno.
- **Para un objeto nuevo** (una lupa, un megáfono, un candado): agrégalo a `PROPS` con su `w`, `h` y sus rectángulos, de
  unos 8 a 12 pixeles de lado. Míralo grande antes de usarlo: si a 100 px de alto no se reconoce en un segundo, le
  falta forma, no detalle. Un hueco de 1 o 2 pixeles se llena de contorno: márcalo con `"_"`.
- **Si la pieza trata de otra cosa que no es contenido** (un producto, una clínica), el protagonista no tiene por qué
  ser el reel: dibuja otro cuerpo en `BASES` o usa una `persona` con su objeto.

## Música, marca y serie

Detalle común a todas las skills de animación: `references/ritmo-y-serie.md`. Lo propio de esta plantilla:

- **Música: aquí manda la voz.** Los cortes y cada pieza siguen a las palabras, así que **no** se ajustan a los golpes
  de una pista (se desfasarían de la voz). La música va debajo, más baja, sobre el MP4 ya renderizado:
  ```bash
  node golpes.mjs mezclar <nombre>.mp4 assets/pista.mp3 <nombre>-con-musica.mp4 --con-voz --volumen 0.25
  ```
  Para que el primer cambio de escena coincida con un golpe fuerte, mide la pista y alinea su arranque con el segundo
  de ese corte (los imprime `armar.mjs`): `node golpes.mjs analizar assets/pista.mp3` y
  `node golpes.mjs alinear golpes.json <segundo del corte>` da el `--inicio`. Los demás cortes caerán donde caiga la
  voz. La pista la trae la persona (propia o libre de derechos); si la música se pone en Instagram, entrega solo con voz.
- **Marca.** De su `mi-marca.md` (o de su manual): Color → `tema` · Letra → no se cambia (letras del sistema) · Movimiento → el estilo es a
  saltos y con entradas fijas por pieza (`entrada` en `imagen` y `mascota`); `cola` es cuánto se sostiene el final.
  Frenado, rebote y desenfoque no se configuran: si la marca pide otra cosa, dilo al entregar.
- **Serie.** Para varios videos, escribe antes `BIBLIA.md` (paleta del `tema`, mundo, qué mascota es cada personaje
  y qué lleva, música y momentos obligados: mismo encabezado, misma escena del error en fondo `noche`, mismo cierre) y
  declara qué se toma de cada referencia. Revisa cada video contra esa lista mirando sus cuadros.
- **Efectos de otras librerías:** `references/efectos-open-source.md`. Agregar uno es editar `motor.js`.
  `node scripts/probar-golpes.mjs` (en la skill) prueba el detector.

## 7. Reglas

- **Cada personaje simboliza lo que representa.** Nada de bloques o caras genéricas: se tiene que entender qué es y
  qué hace sin leer el texto. Es la corrección más repetida de este estilo.
- **Sin manos ni anatomía detallada.** Las mascotas tienen brazos de un pixel; no agregues dedos ni poses.
- **Una mascota nunca tapa el dato de la escena** (el número encendido, la pantalla de la caja, el sello).
- **Una acción por frase.** Si en una escena pasan tres cosas a la vez, no se lee ninguna.
- **Nada de cifras inventadas** en sellos, etiquetas, medidores ni contadores. Los `ojos` muestran vistas sin número.
- **El orden de `piezas` es el orden de capas:** lo primero queda atrás. El mostrador va después de quien está detrás de él.
- **La palabra del CTA** se escribe igual en la frase y en `comentario.palabra`, y solo se usa si la automatización que
  entrega el regalo existe. Si no está confirmada, avísalo.
- **Lo que va a otra persona no lleva tu marca:** cambia `tema`, `usuario` y los textos por los de ella.

## 8. Errores conocidos

- **Recuadros negros encima de una mascota:** una clase de `motor.css` le cayó a un rectángulo del SVG. Los ojos usan la clase `mo` por eso; no la renombres a `ojo`.
- **Encabezado cortado:** se achica solo, pero con más de ~34 letras queda diminuto. Acórtalo.
- **Subtítulos en dos líneas:** una palabra muy larga junto a otras dos. Cambia la palabra o pon una coma para partir el grupo.
- **«en» que no hace nada:** la palabra no está en la frase de ESA escena (lo avisa `armar.mjs`). Cada escena solo ve su frase.
- **Escena de menos de 1 s:** la frase es muy corta; las piezas no alcanzan a entrar. Únela con la anterior o alárgala.
- **Cortes corridos respecto a la voz:** la grabación no dice el guion tal cual. `armar.mjs` avisa si coinciden menos del 70 % de las palabras.
- **Fuentes:** solo del sistema. No importes fuentes externas: en el render se caen y sale Times.
- **Cuadro en negro en el render pero no en el snapshot:** alguien puso un fondo en la raíz o en un `.clip`. El fondo va en `.fondo`.
- **Un ticket o papel que «se imprime» y no aparece:** animar `height` no se pinta en la primera escena. Revélalo con `clipPath: inset(...)`.
- **`--voz-ia` falla al instalar:** necesita `uv` (en Windows; `winget install astral-sh.uv`) o `python3` (en Mac). Alternativa: graba la voz o usa `--sin-voz` para bocetar.

## Skills hermanas

`reel-manotazo-f100k` (problema y solución en 7 segundos, con una toma tuya a cámara, sin voz) y `animacion-dibujada-f100k`
(clips y cortos dibujados cuadro a cuadro; también trae los ayudantes de Mac y Windows que usa esta plantilla).
