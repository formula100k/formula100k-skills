---
name: animacion-cubitos-3d-f100k
description: Arma un corto vertical narrado de 20 a 40 s en un mundo 3D de cubitos - una gradería de 12 mascotas de caja (bichitos y gatitos nerd con gorros y objetos), un estrado donde dos se enfrentan, el escritorio del jefe con sobre, tarjeta y mazo, más planos de papel (sello, marcador, edificio, ventana con lista, caja de comentario), encabezado en ventanita oscura y subtítulos palabra por palabra con la clave en serif dorada. Parte de un guion de una frase por escena y saca sola los cortes y los subtítulos, con voz o sin voz. Usar cuando digan «hazme un corto de cubitos», «animación 3D como la del tribunal», «un corto así sobre [noticia de IA, plugin, skill, herramienta]», «explica esta noticia con los cubitos», «12 Claudes hacen X», «corto 3D sin salir a cámara» o pasen un tema o guion corto para animarlo en ese mundo. NO usar para editar un video grabado (editor-video-formula100k), ni para mundos de papel 2D completos (animacion-recortes-papel-f100k), ni para clips sueltos de 5 s (animacion-dibujada-f100k), ni para video realista (Higgsfield).
argument-hint: [tema, noticia o guion]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Corto · cubitos 3D

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Un clip narrado, 1080×1920, 30 fps, hecho con HyperFrames + Three.js. Todo el video es una función del tiempo: se llena
`config.js`, se corre `armar.mjs` y se renderiza en unos 20 s. Muestra: `ejemplo/muestra.mp4`.

Lo que lo hace reconocible:

- **Una sala de noche con luz dorada**: gradería de 12 cubitos, estrado con un foco al centro y el escritorio del jefe.
- **Cubitos con oficio**: cada uno se distingue por su gorro y por el objeto que lleva.
- **Encabezado en ventanita oscura** (tres puntos de Mac) que cambia por escena; la palabra marcada va en serif itálica dorada.
- **Subtítulos palabra por palabra** en fichas oscuras; la palabra clave en serif dorada.
- **Planos de papel** intercalados para lo que se entiende mejor plano: sellos, conteos, listas, la caja de comentario.
- **Barrido borroso** en cada corte.

## 1. Del tema al guion (antes de tocar archivos)

1. **Una sola idea**, en una frase. Si necesita dos, son dos cortos.
2. **Tradúcela a la sala.** La sala tiene tres lugares y cada uno cuenta algo distinto:
   - **Gradería (12 butacas):** un grupo que opina, prueba, vota o trabaja en equipo (jurado, probadores, tu audiencia, 12 agentes).
   - **Estrado (dos frente al foco):** dos posturas sobre una misma cosa (a favor / en contra, antes / ahora, opción A / opción B).
   - **Escritorio del jefe:** quien da el resultado (veredicto, la noticia, la recomendación) en una tarjeta.
   Si el tema no cabe en esos tres lugares ni en los planos de papel, no lo fuerces: esta skill tiene UNA sola sala.
   Un lugar distinto se arma con `animacion-recortes-papel-f100k` y piezas propias en `window.MUNDO`.
   **En una serie, la sala no se repite.** Si haces varios cortos seguidos, cada uno lleva su propio lugar y su propia
   animación. La sala de 12 butacas solo vuelve cuando el tema es literalmente un juicio; lo que une a la serie es tu
   marca (tu voz, tu color de acento y tus mascotas), no el set.
3. **Escribe el guion: una frase por escena, de 6 a 12 escenas.** Cada frase:
   - dura entre 1,5 y 5 s al decirla (de 4 a 18 palabras);
   - se puede mostrar con UN plano del catálogo;
   - lleva entre `*asteriscos*` la palabra que carga el sentido.
   Estructura que funciona: gancho con la sala llena → el problema (papel) → el mecanismo en 2 a 4 escenas → el resultado
   (marcador o jefe) → por qué te conviene → CTA con la palabra.
4. **Reparte el elenco.** Una línea por personaje que importe: quién es y qué gorro u objeto lo explica. Los tres o
   cuatro que salen en primer plano van en las butacas 0 a 3 (fila de adelante).
5. **Enseña el guion con su tabla de escenas (plano, encabezado, frase) y espera el visto bueno antes de armar.**
   - Sin cifras, precios ni resultados inventados. Si falta un dato, pregúntalo.
   - **Noticias de IA, plugins y herramientas:** cada afirmación sale de una fuente abierta en esta sesión (link y
     fecha). Si no la verificaste, no va.
   - El CTA apunta a un regalo que la persona ya tiene; la palabra solo se usa si la automatización existe.

## 2. Flujo

```bash
SKILL=~/.claude/skills/animacion-cubitos-3d-f100k
DEST=<carpeta de salida>/<nombre-del-corto>     # nunca dentro de la skill
mkdir -p "$DEST" && cp -R "$SKILL/plantilla/." "$DEST/" && cd "$DEST"
```

1. **Llena `config.js`.** Es lo único que se edita. `motor.js`, `motor3d.js`, `papel.js`, `motor.css`, `armar.mjs` y `unir-voz.mjs` no
   se tocan; `index.html` y `tiempos.js` los escribe `armar.mjs`.
2. **Arma:**
   ```bash
   node armar.mjs              # usa assets/voz.wav (o .mp3 / .m4a) si existe
   node armar.mjs --voz-ia     # genera una voz de IA provisional y la usa
   node armar.mjs --sin-voz    # sin audio: tiempos por largo de palabra (config.ritmo lo acelera)
   ```
   Lee lo que imprime: avisa si un plano no existe, si una palabra de `en` no está en la frase, si un encabezado es muy
   largo o si la voz dice otro texto.
3. **Valida:** `npx hyperframes lint`. Cero errores.
4. **Mira los cuadros** con el comando de `snapshot` que imprime `armar.mjs` y abre `snapshots/contact-sheet*.jpg`.
   Revisa: encabezado completo, subtítulos en una línea, que el personaje de cada primer plano se vea entero, que los
   carteles se lean y que ningún texto quede tapado. Corrige en `config.js`, vuelve a correr `armar.mjs` y repite.
5. **Renderiza y aligera:**
   ```bash
   npx hyperframes render --output crudo.mp4 --fps 30
   ffmpeg -y -loglevel error -i crudo.mp4 -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart <nombre>.mp4 && rm crudo.mp4
   ```
6. **Revisa el MP4**, no solo los snapshots:
   ```bash
   ffmpeg -y -loglevel error -i <nombre>.mp4 -vf "fps=1/1.5,scale=216:-1,tile=10x3" -frames:v 1 hoja.jpg
   ```
7. Entrega la ruta del MP4 y di lo que falta: si va sin voz o con voz provisional, que hay que grabarla; que no trae
   música ni efectos; y que el audio no lo escuchaste, solo lo sincronizaste por tiempos.

**La voz clonada (si tienes una).** Con el conector de Higgsfield; cuesta créditos (0,3 por frase el 7-oct-2026): avisa el total antes.
1. `list_voices` → la voz propia sale con `voice_type: "element"`.
2. `generate_audio_batch`, un pedido por frase con `index` = número de escena: `model: "text2speech_v2"`, `variant: "elevenlabs"`, `voice_type: "element"`, `voice_id`. **De a 5 pedidos por tanda** (más da 429). En el texto para la voz: sin asteriscos, números en letras («doce») y la palabra del CTA en minúsculas («juicio», no «JUICIO», que la deletrea).
3. `jobs_wait` → baja cada `result_url` a `voz/01.mp3`, `02.mp3`… en el orden del guion.
4. `node unir-voz.mjs voz 0.12 1.1` (recorta silencios, une con pausa de 0,12 s y acelera 10 % sin cambiar el tono; la voz clonada sale lenta) → `node armar.mjs` → render.
5. **Comprueba lo que dice:** `assets/transcript.json` es la transcripción de la voz; compárala con `guion.txt`. Si una frase salió mal, regenera solo esa y repite el paso 4.
La voz clonada lee frase por frase: la entonación no se encadena como en una grabación corrida. Dilo al entregar.

**La voz grabada.** La persona graba el guion tal cual (queda en `guion.txt`) y el archivo va en `assets/voz.wav`. Al volver a
correr `node armar.mjs` se recalculan cortes, subtítulos y cada `en`. Si cambias una frase, la voz vieja ya no sirve.
Música debajo de la voz: `node golpes.mjs mezclar <nombre>.mp4 assets/pista.mp3 <salida>.mp4 --con-voz --volumen 0.25`
(detalle en `references/ritmo-y-serie.md`).

## 3. `config.js`

| Campo | Qué es |
|---|---|
| `id`, `titulo` | Nombre interno y título |
| `usuario` | Usuario de la red; sale chico en la última escena. Vacío = no sale |
| `cola` | Segundos de aire al final |
| `ritmo` | Solo sin voz: 1 = hablado normal, 0,75 = rápido |
| `tema` | Colores: `acento` (el de la marca), `cubo` (los bichitos), `noche`, `pared`, `butaca`, `alfombra`, `madera`, `madera2`, `luz`, `papel`, `tinta`, `si`, `no` |
| `cartel` | Letrero de la baranda de la gradería, 2 a 3 palabras; `*así*` va en serif |
| `mascota` | Mascota de los planos de papel: `"gato"` o `"bichito"` |
| `elenco` | Las 12 butacas (0 a 3 = fila de adelante) |
| `duelo` | `izq` y `der`: los dos del estrado |
| `jefe` | El del escritorio |
| `escenas[]` | `plano`, `encabezado` (hasta 30 letras), `frase` y los campos del plano |

**Un cubito:** `{ tipo, gorro, objeto, dientes, color, colorGorro, perlas, cadena, corbata, traje }`
- `tipo`: `"bichito"` (cubo de color) o `"gato"` (crema, orejas, lentes y bigotes).
- `gorro`: `tapa`, `bombin`, `audifonos`, `pelo`, `visera`, `gorra`, `mono`, `boina`, `corona`, `antena`, `peluca`.
- `objeto`: `calculadora`, `guante`, `lupa`, `telefono`, `moneda`, `corazon`.

**Tiempos.** `en`, `giroEn`, `abreEn`, `mazoEn`, `selloEn`, `cortaEn`, `entraEn` y `escribeEn` aceptan una **palabra de
la frase de esa escena** (pasa cuando la voz la dice; basta el comienzo, sin tildes), un **número** (segundos desde que
empieza la escena) o nada (tiempo por defecto).

## 4. Catálogo de planos

**3D**

| `plano` | Qué se ve | Campos |
|---|---|---|
| `tribuna` | El elenco va saliendo hasta llenar la gradería | — |
| `duelo` | Los dos del estrado, frente al foco, apuntándole con su vara | — |
| `alegato` | Primer plano de uno de los dos; su cartel pasa de «?» a la respuesta | `lado` (`"izq"`/`"der"`), `texto` (una palabra), `ok` (verde ✓ o rojo ✗), `en` |
| `votacion` | Suben las 12 paletas y la cámara se va de lado | `si`, `no` (textos), `aFavor` (cuántas de 12), `en`, `giroEn`, `giro:false` |
| `apagon` | Sala a oscuras con un foco, y se enciende | `en` |
| `papeles` | Primeros planos de la fila de adelante, uno tras otro | `quienes:[{ asiento, gesto, en }]`; `gesto`: `teclea`, `brinca`, `asiente`, `golpea` (mueve su objeto hacia la cámara) |
| `jefe` | El jefe saca un sobre, sale la tarjeta y cae el mazo con destello | `tarjeta:{ eyebrow, lineas:[2], ok }`, `abreEn`, `mazoEn`, `mazo:false` |

**Papel**

| `plano` | Qué se ve | Campos |
|---|---|---|
| `sello` | Una mascota sella cuatro veces una hoja | `hoja`, `sello`, `diploma:{ titulo, sub }`, `mascota` |
| `marcador` | Ventana con dos contadores; las papeletas vuelan de la urna y cae un sello | `izq:{ texto, n }`, `der:{ texto, n }`, `barra`, `urna`, `sello`, `selloEn` |
| `edificio` | Fachada con etiqueta colgada: la cortan unas tijeras, cae un sello y la mascota entra con su idea | `rotulo`, `etiqueta:{ chico, grande }`, `sello`, `cortaEn`, `entraEn` |
| `ventana` | Ventana de Mac con titular y lista que se va marcando | `barra`, `eyebrow`, `titulo`, `items:[{ texto, en }]` (hasta 4) |
| `comentario` | Caja de comentario donde se escribe la palabra | `palabra`, `placeholder`, `boton`, `regalo:{ eyebrow, titulo }`, `escribeEn` |

Combinaciones probadas:

- **Gancho:** `tribuna` con el `cartel` del tema.
- **El problema:** `sello` (algo que se repite sin pensar) o `ventana` con el titular.
- **Dos posturas:** `duelo` → `alegato` izq → `alegato` der.
- **Decisión de grupo:** `votacion` → `marcador` con el mismo conteo (`aFavor` = `der.n`).
- **Cada uno aporta algo distinto:** `apagon` → `papeles`.
- **Resultado:** `jefe` con la tarjeta.
- **Noticia de IA o herramienta nueva:** `ventana` (qué salió, con sus puntos) → `tribuna` → `papeles` (quién la aprovecha) → `jefe` (qué hacer) → `comentario`.
- **Cierre:** `edificio` (es gratis / ya está abierto) → `comentario`.

## 5. Reglas

- **Cada cubito que sale en primer plano se entiende sin leer:** gorro + objeto. Si no se entiende, cámbialo.
- **Una acción por frase.** La frase más corta que aguanta un plano es de ~1 s.
- **El conteo coincide:** `votacion.aFavor`, `marcador.der.n` y lo que diga la voz son el mismo número, y sale de un dato real o es parte evidente de la ficción (un jurado inventado). Nunca cifras de resultados.
- **Nada de precios inventados** en etiquetas ni sellos.
- **Textos de cartel: una palabra** (`alegato.texto`) o dos líneas cortas (`tarjeta.lineas`). Se achican solos, pero largos no se leen.
- **Marca:** `tema.acento` es el color de la persona. Lo que va a otra persona no lleva tu marca: cambia `tema`, `usuario`, `mascota` y textos por los de ella.
- **El bichito** es un cubo naranja inspirado en la mascota de Claude, no el arte oficial. Úsalo cuando el tema sea Claude; para otros temas cambia `tema.cubo` o usa `tipo: "gato"`.
- **Serie:** para varios cortos, deja fijos `tema`, `jefe` y `mascota`, y cambia `cartel`, `elenco` y guion. Así se reconocen como de la misma cuenta.

## 6. Errores conocidos

- **«Missing window.__timelines» al hacer snapshot:** falta correr `node armar.mjs` (es quien escribe `index.html`).
- **Encabezado que se sale:** más de ~30 letras. Acórtalo.
- **Subtítulos en dos líneas:** una palabra muy larga junto a otras dos; cambia la palabra o pon una coma.
- **Un `en` que no hace nada:** la palabra no está en la frase de ESA escena (lo avisa `armar.mjs`).
- **Primer plano con el personaje tapado:** `papeles` solo funciona con butacas 0 a 3.
- **Cuadro borroso en un snapshot:** cayó justo en un corte (el barrido dura 0,13 s a cada lado). Mueve el tiempo.
- **Fuentes:** solo del sistema (sans gruesa + Georgia). No importes fuentes externas.
- **Colores de los carteles 3D no cambian:** los carteles se pintan al cargar; cambia `tema` en `config.js` y vuelve a correr `armar.mjs`.
- **`--voz-ia` falla al instalar:** necesita `uv` (en Windows) o `python3` (en Mac); los dos los deja listos la revisión de la compu. Alternativa: graba la voz o usa `--sin-voz`.

## Skills hermanas

`animacion-recortes-papel-f100k` (mundo 2D de papel, misma lógica de guion y voz), `animacion-dibujada-f100k`
(clips sueltos y mascotas sobre tu video), `reel-explicado-animado-f100k` (recrear un explicativo desde un link).
