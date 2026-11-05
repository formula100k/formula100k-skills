---
name: reel-motion-recortada-f100k
description: "Edita un reel 9:16 hablado alternando DOS modos: MOTION (fondo negro, título arriba con corte seco, motion graphics construidos al centro con IMÁGENES REALES (su perfil, su bio, sus reels, su página) y la persona RECORTADA abajo, sin caja) y CARA (la persona a pantalla completa). La persona viaja entre los modos en 0,6 s. Recorta con fondo verde (chromakey) o, sin verde, con la segmentación de personas (Vision en Mac, MediaPipe en Windows). Opcional: ventana con su fondo real. Look: negro #050509 + un solo acento (dorado #F5C542 de fábrica o el color de tu marca), GANCHO con título GOLPE (22-oct): una línea ENORME en mayúsculas en letra de diseño (condensada de póster por defecto, o serif itálica), color plano rojo/verde/amarillo sin degradado ni brillo, quieta desde el cuadro 0 + otra chica blanca (sans o serif) y, si se quiere, un ícono del tema encima; los títulos del resto del reel siguen como la referencia (línea 1 blanca y línea 2 en bloque dorado, con corte seco). Piezas listas: celular con su perfil + cronómetro integrado, imágenes que se tachan al nombrarse («no es X»), captura real con resaltes dorados que aparecen al nombrarse, celular con prueba, grilla de reels, curva que se dibuja, barra con contador, caja de concepto, documento con marcas, objeto héroe, lista de etiquetas, pantalla con scroll, número grande y frase palabra por palabra con corte seco. Subtítulos de 1–2 palabras, efectos de sonido automáticos y voz intacta. Activar con 'edita este reel estilo motion recortada', 'ponme abajo con motion graphics arriba', 'alterna pantalla completa y motion', 'edición tipo motion con mi cara abajo', 'pantalla verde abajo y animación arriba', 'reel con gráficas construidas y yo abajo'. NO usar para 16:9 (motion-takeover-f100k), overlays sobre la cara sin cambiar de modo (motion-reels-f100k) ni reels 100 % animados sin persona (reel-explicado-animado-f100k)."
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill
---

# Reel motion recortada

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Un reel hablado (9:16) que alterna dos modos sobre **una sola línea de tiempo**:

```
 MOTION (≈70 %)                         CARA (≈30 %, 2–6 s cada vez)
┌──────────────────────┐                ┌──────────────────────┐
│ Título (corte seco)  │                │                      │
│  con la palabra      │                │     plano cerrado    │
│  _clave_ en dorado   │    ←0,4 s→     │      de la persona   │
│                      │   (whoosh)     │                      │
│   [gráfica que se    │                │                      │
│    construye]        │                │       palabra        │
│       palabra        │                │                      │
│        (•‿•)         │                │                      │
│       /|   |\        │  ← recortada,  └──────────────────────┘
└──────────────────────┘    sin caja
```
**Recortada es el estilo por defecto** (19-oct: la ventana de la referencia «se ve mal» cuando la toma es de cerca,
porque la cara llena la franja). `--estilo ventana` queda solo si alguien la pide.

Mecánica tomada de una referencia medida cuadro por cuadro (`references/anatomia-referencia.md`). Se copia la
mecánica; los colores, la tipografía, la franja y las transiciones son de la marca.

Formato: 1080×1920, 30 fps. Sale en `~/Documents/mis-videos-editados/<proyecto>/`.

## 🧰 EN TU COMPU

Esta skill viaja en el módulo de Edición y corre igual en Mac y en Windows (en Windows, desde la terminal de Git Bash que usa Claude Code).

- **Programas:** Node 18 o más nuevo, ffmpeg (con ffprobe), uv, Google Chrome y HyperFrames (`npm i -g hyperframes`, el motor
  que dibuja el reel; trae también el navegador automático que usan `revisar_layout.mjs` y `capturar_perfil.mjs`). Python no se
  instala aparte: uv lo trae. No tiene `package.json`: no hace falta `npm install` dentro de la skill.
- **Recorte de la persona:** con fondo verde, ffmpeg (igual en los dos sistemas). Sin verde: en Mac usa Vision de macOS
  (`mascara_persona.swift`, se compila solo la primera vez si hay herramientas de Xcode); en Windows, o en una Mac sin ellas, usa
  MediaPipe (`mascara_persona.py`, local y gratis; la primera vez baja el modelo, ~16 MB).
- **Corte:** reusa `editor-video-formula100k` (mismo módulo). El corte fino «por comprensión» usa la llave de Anthropic de
  `~/.editor-video/llave-anthropic.txt` (nunca en una variable de entorno); **sin llave funciona igual**: corta silencios y
  muletillas y avisa `semantic OFF`, y el resto se revisa a mano (paso 1).
- **Tu negocio:** `~/Documents/mi-contenido/mi-negocio.md` (qué vendes, a quién, el regalo y la palabra que pide comentar).
  Si no existe, pregunta en un solo mensaje. No inventes cifras, precios, testimonios ni regalos.
- **Tu marca:** `~/Documents/mi-contenido/mi-marca.md` (o su manual `mi-marca/marca.md`). Su color de acento va en
  `"acento"` del plan (reemplaza al dorado en todo el reel) y su @ en `firma` y en `usuario` de los `post_ig`. Si no hay marca,
  queda el dorado de fábrica y le preguntas en un solo mensaje su color y su @.
- **Dónde guardar:** cada reel en `~/Documents/mis-videos-editados/<proyecto>/` (en Windows, la carpeta Documentos de su usuario).
- **Imágenes con IA (opcional):** el objeto héroe se puede generar con Higgsfield si tiene el conector y créditos. Gratis: una
  foto real del objeto con el fondo quitado (paso 4).
- **Otras skills:** `gancho-golpe-f100k` y `editor-video-formula100k` vienen en el mismo módulo. Si alguna no está, sigue sin ella y avisa.

---

## ⛔ Reglas que no se rompen

1. **La voz nunca se corta después del corte fino.** `_source_cut.mov` es la base. La composición dura lo mismo
   y el audio se copia de ahí. `final.py` falla si las duraciones difieren.
2. **Corte fino primero** (silencios, muletillas, repeticiones, arranques en falso). Todo se cronometra sobre el
   video ya cortado.
3. **Cada gráfica cuenta lo que se dice en ese momento.** El ritmo es algo nuevo cada 3–5 s, pero entre ritmo y
   sentido gana el sentido. La misma pieza no se repite más de 3 veces seguidas. La excepción son los **objetos que
   vuelven** (Paso 4): esos se repiten a propósito.
4. **Imágenes reales que ejemplifican, no solo gráficas vectoriales.** Si la frase nombra algo que existe en una
   imagen (su perfil, su bio, un reel, un mensaje, un resultado, la página del regalo), se MUESTRA esa imagen real
   (`captura`, `telefono`, `grilla`, `pantalla`). Mínimo una por escena de motion cuando el guion lo permite, y la
   **primera escena abre con la cosa de la que habla** (si dice «tu perfil», el cuadro 0 es un perfil real).
   `armar.py` avisa si no hay ninguna. Nada de stock ni de cifras inventadas: los números salen del guion o de la
   prueba real; si no existe, va sin número. Objetos-metáfora: foto real sin fondo (o Higgsfield, si lo tiene).
   **Ejemplos de formato o de estilo = videos REALES de otras cuentas («debía tener formatos reales documentados de
   otras personas, no solo mis videos»).** Cuando el guion nombra un formato, un
   estilo o «esto funciona en todo rubro», cada ejemplo es un video publicado de OTRA creadora, ojalá de otro
   rubro: `telefono` con `img` (el cuadro del video donde se lee el formato; `video` NO se ve en el render) +
   `vistas` reales y `vistas_texto: "vistas · @cuenta"`. Búscalos en Instagram o TikTok (o en las referencias que la
   persona ya tenga guardadas) y valídalos MIRANDO los cuadros, no el caption. Sus propios reels van solo cuando habla
   de SU resultado.
5. **Título GOLPE en el gancho (22-oct: «el gancho con las letras doradas no está llamando la atención»;
   refs «ELIMINA / tus destacadas» y «IDEAS DE REELS / en historias»).** La escena del cuadro 0 ya NO usa el bloque
   dorado: el motor pone solo el título golpe. Una línea ENORME (hasta 210 px, llena el ancho) en mayúsculas, color
   plano de su sentido y sombra seca (23-oct: sin degradado, canto 3D, brillo, rebote, latido ni destello); la otra
   línea chica en blanco; las dos (y el ícono) aparecen con corte seco, quietas. Sin flecha y sin tecleo. Campos del `titulo`:
   `l1`, `l2`, `grande` (0 o 1: cuál va enorme), `letra` (`condensada` = Impact/DIN Condensed, por defecto ·
   `serif` = Didot itálica · `palo` = la sans gruesa de antes; elígela por el tema del reel), `color` (`rojo` negativo/prohibido · `verde` logro · `amarillo`
   la casa, por defecto · o un hex), `chica: "serif"` (Didot, como «en historias»; por defecto sans gruesa),
   `icono` (imagen del tema encima: logo de Reels, círculos de destacadas, la app de la que habla; nunca el logo de
   Claude en el gancho) + `icono_alto` (170 px por defecto), `y` (alto del título, 230 px). `"estilo": "bloque"`
   vuelve al dorado; `"estilo": "golpe"` lo usa en otra escena. `armar.py` avisa si pasa de 5 palabras o si la línea grande pasa de 11 letras (22-oct: «ESPANTA CLIENTAS», «NADIE TE ENCUENTRA» quedaban chicas; la grande es 1–2 palabras cortas y lo demás va en la chica). Las 3
   variantes A/B/C cambian solo `l1`/`l2`/`color`/`grande` de la escena 0.
   **Gancho sobre su toma REAL (22-oct, «actualiza eso»):** por defecto la escena 0 con título golpe ya no va sobre
   negro con ella recortada: va sobre su toma original con su fondo, bajada para que el borde de su cabeza quede en
   `yo.golpe_cabeza_y` (1000 px); el hueco de arriba es la misma toma desenfocada y oscura, con sombra para que el
   texto se lea. Título arriba, UNA pieza chica entre el título y su cabeza (el motor la achica para que no baje de
   la cabeza) y el subtítulo sobre su pecho (`sub_y_golpe`). Al terminar la escena la capa se funde y sigue el reel
   como siempre. `"fondo": "negro"` en la escena 0 vuelve a la versión recortada sobre negro. Solo en estilo recortada.
   **Golpe visual en 0–2 s:** 🔴 21-oct: el TEXTO del título del gancho sigue `gancho-golpe-f100k` (2 a 5 palabras, negativo o polémico, sin nombrar Claude, sin tercera línea; 3 variantes A/B/C). el reel abre en modo MOTION con el título ya puesto y una pieza que se mueve en el
   cuadro 0 (el motor no teclea ni anima la entrada de lo que empieza en 0). **El gancho SIEMPRE con la persona
   (20-oct, probado en trial reels: «este gancho no convence, debería aparecer yo»):** la escena 0 nunca va
   `completa`; va en modo MOTION, ella recortada abajo y la animación arriba **sin taparle la cara** (la pieza termina
   sobre el subtítulo, que va encima de su cabeza; si no cabe, se achica o se parte, nunca baja a la cara). `armar.py`
   pasa sola a motion una escena 0 `completa` y lo avisa; `"gancho_sin_mi": true` solo si la persona pide un gancho sin ella.
   Como «el texto aparecía en la parte de muy arriba y no impactaba, no salía una flecha ni nada», el motor hace solo:
   título de 84 px (baja si la línea es larga) a 250 px del borde, ya puesto y quieto (23-oct: sin caída ni destello); la
   pieza entra empujada (1,12 → 1) y sigue acercándose despacio; y una **flecha dorada dibujada a mano** baja del
   título a la pieza a los 0,3 s. La flecha va en **toda escena con título** cuando hay sitio entre el título y la
   pieza (en el gancho, si no cabe, apunta de costado); sale con su pieza. `"flecha": false` en una escena o
   `"flechas": false` en el plan la quitan; `"flecha": {"lado": "izq"}` elige el lado. Slot `arriba` = 700 px.
   **Sin superposiciones (19-oct):** cada pieza mide su alto; si tapa el título baja, y si no cabe hasta el subtítulo
   se achica (`"encima": true` lo desactiva; `y` fijo también). Revisa igual la hoja: el motor no mira piezas `flujo`.
6. **Cara: nunca más de ~6 s seguidos.** Motion entre 60 y 90 % del reel (con pantalla completa puede subir).
7. **Efectos de sonido siempre** (whoosh en cada cambio de modo, pop en cada pieza, clic cuando entra el título). **Sin música**:
   la música se pone al publicar en Instagram.
8. **Español neutro y tuteo** en títulos, cajas y etiquetas.
9. **Criterio visual (19-oct: «pura montonera», «no tienes criterio»):** cada frase se MUESTRA literal. «Hacer
   este guion» → `escribe` (hoja que se teclea); «editarlo» → `edicion` (sus tomas en un editor con tijeras); «copia y
   pega este prompt» → `escribe` estilo chat con `pegar: true` y un prompt de verdad; «nota de voz» → `nota_voz`;
   «guárdalos en una carpeta» → `carpeta`; «A + B → Claude» → `flujo`. Nunca una caja que repite la frase.
10. **Una cosa a la vez.** Título + UNA pieza; en pasos largos se encadenan piezas con `hasta` (una sale, entra la otra)
    cada 1,5–3 s. Prohibido apilar caja + lista + objeto (`armar.py` avisa «demasiado texto»).
10b. 🔴 **Edición sin olor a IA.** Más capturas y fotos reales (su perfil, la app de
    verdad, Google, el carrete) que íconos o emojis; tarjetas planas como la pantalla del celular. Nada tiembla ni rebota:
    el motor ya no usa `back.out`, ni la pieza «respira», ni la flecha se mece, ni el subtítulo hace pop. Títulos y
    subtítulos aparecen con corte seco (sin tecleo, barrido, fade ni escala). El único golpe es el del cuadro 0–2 s
    (corte + whoosh, o el empuje 1,12 → 1 de la primera pieza). Letra del golpe elegida por tema (`letra`).
11. **Variaciones en todo reel:** pantalla completa (`"completa": true`) como base de los gráficos; la persona abajo en el GANCHO, el
    CTA y tramos cortos; tramos de cara y dramatizaciones con **su fondo real** (por defecto `yo.cara_fondo: "real"`,
    o `"real": true` en una escena). El recorte sobre negro deja huecos en el pelo con la cara grande.
12. **Cortes finos de verdad:** Whisper con todo el contexto se traga las frases repetidas. Toda palabra de > 0,6 s o
    hueco raro se transcribe AISLADA (Whisper solo sobre ese tramo: mlx-whisper en Mac, faster-whisper en Windows); las pausas internas se aprietan a ~0,1 s.

---

## Paso 0 · Preparar

```bash
SKILL=~/.claude/skills/reel-motion-recortada-f100k   # la carpeta de esta skill
VIDEO=<ruta de la toma>                         # .MOV del celular, con o sin fondo verde
PROYECTO=<nombre-corto>
DEST=~/Documents/mis-videos-editados/$PROYECTO; mkdir -p "$DEST/reel/assets" "$DEST/USER"
command -v hyperframes >/dev/null || npm i -g hyperframes
command -v ffmpeg >/dev/null || echo "Falta ffmpeg (Mac: brew install ffmpeg · Windows: winget install -e --id Gyan.FFmpeg)"
```

**Imágenes reales (obligatorio).** Lee el guion y anota cada cosa nombrada que se puede ver. Consíguela así:
- **Su perfil de Instagram y su bio** (público) → sin pedir nada:
  ```bash
  node "$SKILL/scripts/capturar_perfil.mjs" <usuario> "$DEST/reel/assets"    # deja perfil.png y bio.png
  ```
  Míralas antes de usarlas (la bio a veces sale corrida: recórtala con ffmpeg `crop`).
- **Páginas públicas** (regalo, producto) → captura con Chrome headless o playwright a 430 px de ancho.
- **Portadas de apps / regalos** → búscalas en sus carpetas (`~/Documents/mis-videos-editados/`, `~/Documents/mi-contenido/`) antes de pedirlas.
- **Lo privado** (métricas, mensajes, resultados de clientas) → pídelo en UN solo mensaje y sigue con lo demás.

## Paso 1 · Corte fino

```bash
node ~/.claude/skills/editor-video-formula100k/scripts/editar.mjs "$VIDEO" --solo-corte --carpeta "$DEST"
```
Deja `_source_cut.mov` (la base) y `captions.json` (palabra por palabra, sobre el video cortado). Después lee
`captions.json` buscando tropiezos que el script no vio (frase dicha dos veces con otras palabras, autocorrecciones)
y, si hay, vuelve a cortar antes de seguir. A partir de aquí **no se corta más**.

- El registro tiene que decir `snap=on`. Con `snap=off` los cortes se comen el final de las palabras
  («publicando», «se acaba»): para y arréglalo antes de seguir.
- Si cortas a mano (`trim/atrim`), cada borde va DENTRO de un silencio de `silencedetect=noise=-38dB:d=0.06` sobre la
  toma original, con `afade` de 10–15 ms. Un borde que cae fuera de un silencio corta una palabra.
- **Verifica**: transcribe `_source_cut.mov` y léelo entero. Ninguna palabra puede quedar mocha en una unión.
- **Verifica las uniones con el audio, no con la transcripción** (23-oct: «tres tipos de post» salió con 7 finales
  mochos y 6 pedacitos sueltos aunque la transcripción se leía completa; Whisper rellena la sílaba que falta):
  ```bash
  uv run --no-project --python 3.12 --with numpy python -X utf8 "$SKILL/scripts/revisar_uniones.py" "$VIDEO" "$DEST/edl.json"   # o tu recut en segundos de la toma
  ```
  Tiene que decir `✅ uniones limpias`. Si apretaste pausas con un segundo recorte, no lo hagas sobre los tiempos de
  Whisper (marcan el final de la palabra antes de tiempo): lleva cada borde hasta 40 ms de silencio real y, si la
  frase sigue de corrido hacia una toma descartada, córtala en el valle de energía entre las dos palabras.

## Paso 2 · Preparar a la persona

```bash
uv run --no-project --python 3.12 python -X utf8 "$SKILL/scripts/recortar.py" "$DEST/_source_cut.mov" "$DEST"   # recortada (por defecto); detecta solo si hay verde
#   --modo verde | --modo vision · --rapida
#   --estilo ventana   → sin recortar, en franja con su fondo (solo si la piden; ajusta con "yo": {"ventana_cabeza_y", "ventana_zoom"})
```
**Recortada:**
- **Con fondo verde:** chromakey + despill; el color del verde se mide solo en los bordes del cuadro.
- **Sin verde:** segmentación de personas. En Mac, Vision de macOS (compila `mascara_persona.swift` la primera vez,
  ~2,5 min por minuto de video). En Windows (o Mac sin herramientas de Xcode), MediaPipe con `mascara_persona.py`
  (la primera vez instala sus librerías y baja el modelo; después, unos minutos por minuto de video). Con
  `F100K_SIN_APPLE=1` delante, una Mac usa MediaPipe (sirve para probar la rama de Windows).

Deja `reel/assets/yo.webm` (con transparencia) y `silueta.json`. **Mira un cuadro** del
recorte sobre negro antes de seguir (bordes verdes, pelo comido, manos cortadas):
```bash
ffmpeg -loglevel error -y -ss 3 -i "$DEST/_source_cut.mov" -frames:v 1 -vf scale=360:-1 "$DEST/revision-toma.png"
```
Para grabar con verde: verde parejo y sin arrugas, la persona a 1 m del fondo, luz de frente, sin ropa verde, de la
cintura para arriba con aire sobre la cabeza.

## Paso 3 · Leer el guion y marcar los modos

Lee `captions.json` completo y parte el guion en **ideas** (cada idea = un título). Dentro de cada idea, decide frase
por frase:

| Va en MOTION | Va en CARA |
|---|---|
| Lo que se puede ver: un dato, un proceso, pasos, un objeto, una prueba, una comparación | La frase puente que nombra el concepto («se llama…») |
| El gancho (siempre: golpe visual) | El giro («a menos que…», «pero…») |
| El CTA final (página del regalo + palabra a comentar) | La opinión, el énfasis, la complicidad |
| | La promesa antes del método («y es muy simple») |

Corta los modos **en el silencio entre dos palabras** (usa `start` de la primera palabra de la frase). Cada cambio
de modo es un respiro: uno cada ~5 s, nunca dos en menos de 1,2 s.

## Paso 4 · Diseñar las gráficas

Primero elige **3 o 4 objetos que vuelven** para todo el reel: la metáfora central del guion (un objeto héroe: foto
real del objeto con el fondo quitado), una gráfica (curva o barra) y una prueba (celular con su reel). Aparecen
la primera vez completos y después regresan en otras escenas: así el espectador entiende sin leer.

Piezas disponibles (todas en dorado, entran con un movimiento corto y suave, sin rebote, quedan quietas y salen solas al final de su escena):

| `tipo` | Para qué | Campos |
|---|---|---|
| `telefono` + `cuenta` | **«Tienes N segundos»**: el celular con su perfil y un cronómetro pegado que baja de N a 0 + barra que se agota en la pantalla. UNA pieza, no un celular y un número por separado | `cuenta`: {`desde`, `en`, `dur`} |
| `tachado` | **«No es X ni Y»**: cada imagen real se tacha con una X dorada cuando se nombra | `items` [{`img`, `forma` (circulo·tarjeta), `ancho`, `alto`, `etiqueta`, `entra`, `en` (cuándo se tacha)}] |
| `captura` | **Una imagen real con partes marcadas** (su bio línea por línea, un mensaje, un dato de sus métricas) | `img`, `ancho`, `resaltes` [{`x`,`y`,`w`,`h` en fracciones 0–1 de la imagen, `en`, `marca`, `pad_y`}], `velo` (oscurece el resto) |
| `telefono` | Prueba: su perfil, su reel o una captura dentro de un celular | `img` (se alinea arriba) o `video` (+`dur`), `chip` (texto bajo el celular, p. ej. `@usuario`), `vistas` (solo si es real), `vistas_texto`, `ancho` |
| `grilla` | Muchos resultados a la vez (6 reels) | `imgs` [6], `vistas` [6] |
| `curva` | Algo que cae, sube, se sostiene o rebota | `etiqueta`, `forma` (cae·sube·sostiene·rebota), `punto` (0–1), `dibujo` (s) |
| `barra` | Algo que se llena o se agota | `etiqueta`, `hasta_num`, `unidad`, `dur`, `llena` (0–1) |
| `caja` | Nombrar un concepto (aparece entero, corte seco) | `texto` |
| `documento` | Guion, plan o checklist con partes | `titulo`, `secciones` [{`nombre`, `lineas`, `resaltar`, `marca`, `marca_en`}] |
| `objeto` | La metáfora central (PNG sin fondo) | `img`, `ancho`, `gira_en` (gira 180° en ese segundo) |
| `lista` | Lo que incluye / los pasos nombrados | `items`, `tiempos` (cuándo entra cada uno), `ritmo`, `ultimo_contorno` |
| `pantalla` | Página del regalo o producto con scroll | `img` (captura larga), `ancho`, `alto`, `scroll` (true o %) |
| `numero` | Una cifra que merece toda la pantalla | `valor`, `antes`, `despues` (en serif dorada), `etiqueta`, `decimales`, `dur` |
| `frase` | Una frase corta en grande | `texto`, `clave` (una palabra en serif dorada) |
| `html` | Algo a la medida (escape) | `html` |
| `escribe` | **Un guion que se teclea** (`estilo: "hoja"`) o **un prompt en el chat de Claude** (`estilo: "chat"`, `pegar: true` = aparece de una con «Pegado») | `lineas`, `titulo`, `estilo`, `pegar`, `icono`, `ritmo` (letras/s), `desde_en`, `tiempos`, `marcar` [índices], `respuesta`, `respuesta_en` |
| `edicion` | **«Claude lo edita»**: editor con cuadros reales de su toma, cabezal que corre, tijeras y subtítulos | `imgs` (cuadros de `_source_cut.mov`), `cortes` [fracciones 0–1], `subs`, `dur`, `etiqueta` |
| `nota_voz` | **Nota de voz** de WhatsApp: play, onda que se mueve, contador, micrófono que late | `play_en`, `segundos`, `barras` |
| `carpeta` | **«Guárdalos en una carpeta»**: las imágenes vuelan y caen en una carpeta dorada con contador | `imgs`, `tiempos`, `ritmo`, `etiqueta`, `ancho_img`, `proporcion_alto` |
| `post_ig` | **Un post ya publicado en Instagram** (carrusel o foto): cabecera con su avatar real y usuario, la imagen COMPLETA en su proporción (4:5), corazón que se pinta, puntos del carrusel. Todo carrusel o post terminado va así, nunca recortado dentro de un `telefono` (`armar.py` lo bloquea) | `img` o `imgs` (láminas), `avatar` (recorta el círculo de `perfil.png`), `usuario`, `texto`, `ancho`, `proporcion`, `pasa` [tiempos de deslizar], `corazon_en`, `likes` (solo si es real) |
| `skill` | **«Usa este skill»**: tarjeta de skill que pasa de «Instalar» a «Instalada ✓», se pega un video y salen sus partes. Toda mención a una skill, prompt o herramienta lleva su mockup | `icono`, `nombre`, `subtitulo`, `instala_en`, `video_img`, `video_texto`, `video_sub`, `video_en`, `salida`, `items`, `tiempos` |
| `flujo` | **A → B**: imágenes unidas por flechas doradas que se dibujan («qué vendes + a quién → Claude», «tu video → Claude») | `nodos` [{`img`, `etiqueta`, `x`, `y` en un cuadro de 1000×1000, `ancho`, `en`}], `flechas` [{`de`, `a`, `en`, `curva`}] |

**Escenas (variaciones):** `"completa": true` → motion a pantalla completa (la persona sale por abajo, el subtítulo baja a
y≈1640, las piezas se centran en y≈1010). `"real": true` → la toma original con su fondo a pantalla completa, sin título
ni piezas (dramatización). Los huecos entre escenas también van con su fondo real salvo `yo.cara_fondo: "recortada"`.
`grilla` acepta `proporcion` («4:5» para carruseles: nunca recortados) y `ancho_card`.

**Una idea = una pieza que la cuenta entera.** Si la frase junta dos cosas («tu perfil» + «3 segundos»), van en la
misma pieza (celular + cronómetro), no en dos piezas sueltas lado a lado.

**Ninguna frase que nombra algo visible se queda en CARA.** Si dice «no es tu foto ni un Lamborghini», eso es
motion con su foto real y la imagen tachadas. La cara es para frases sin nada que mostrar.

Comunes a todas: `en` (segundo en que entra), `hasta` (por defecto, el fin de la escena), `pos` (`centro`,
`arriba`, `abajo`, `izq`, `der`, `arriba-izq`, `arriba-der`, `abajo-izq`, `abajo-der`), `x`/`y` (píxeles, si
ninguna posición sirve) y `escala`. La zona de las gráficas va de y≈330 a y≈1240; debajo van el subtítulo y la persona.
Dos piezas a la vez como máximo (arriba + abajo, o izq + der).

Imágenes: cópialas a `$DEST/reel/assets/` y nómbralas en el plan como `assets/archivo.png`. Objeto héroe: una foto real
del objeto (de ella o de internet, sin marca de agua) con el fondo quitado; si tiene la skill `animacion-dibujada-f100k`,
`node ~/.claude/skills/animacion-dibujada-f100k/scripts/sistema.mjs recortar foto.jpg "$DEST/reel/assets/objeto.png"`
lo hace gratis en Mac y en Windows. Opcional, si tiene el conector y créditos: generarlo con Higgsfield
(`generate_image`, fondo negro liso, luz de borde cálida) y quitarle el fondo (`remove_background`).

## Paso 5 · Escribir `plan.json`

**`cortes`**: las uniones del corte fino en segundos del video cortado (de `edl.json`: cada `newStart` menos el
primero; si recortaste a mano, recalcúlalas). Con eso el motor alterna un punch-in de 8 % en cada salto y la voz
hace un micro-fundido de 15 ms: los cortes dejan de sentirse abruptos. Las uniones a menos de 0,5 s de un cambio de
modo se dejan (el cambio ya las tapa); mejor aún, pon el cambio de modo justo en la unión.

```json
{
  "claves": ["reloj de arena"],
  "cortes": [4.12, 9.8, 15.36],
  "firma": "",
  "acento": "#F5C542",
  "yo": { "cara_zoom": 1.08, "motion_escala": 0.58, "motion_cabeza_y": 1345 },
  "escenas": [
    { "desde": 0, "hasta": 4.2,
      "titulo": { "l1": "NADIE TE VE", "l2": "hasta el final", "grande": 0, "color": "rojo" },
      "piezas": [
        { "tipo": "grilla", "en": 0, "imgs": ["assets/r1.jpg","assets/r2.jpg","assets/r3.jpg","assets/r4.jpg","assets/r5.jpg","assets/r6.jpg"] },
        { "tipo": "curva", "en": 2.6, "pos": "abajo", "etiqueta": "Retención", "forma": "cae", "escala": 0.8 }
      ] },
    { "desde": 7.1, "hasta": 12.6, "titulo": { "l1": "Cada persona trae", "l2": "25 segundos de atención", "clave": "25 segundos" },
      "piezas": [ { "tipo": "barra", "en": 7.4, "etiqueta": "Atención", "hasta_num": 25, "unidad": " s", "dur": 2.2 } ] },
    { "desde": 60.0, "hasta": 72.0, "cta": true,
      "titulo": { "l1": "Comenta USO", "l2": "y te lo mando gratis", "clave": "gratis" },
      "piezas": [ { "tipo": "pantalla", "en": 60.2, "img": "assets/regalo.png", "scroll": true },
                  { "tipo": "lista", "en": 63.0, "pos": "abajo", "items": ["Paso 1","Paso 2","Paso 3"] } ] }
  ]
}
```
- Los huecos entre escenas son modo CARA. `duracion` sale sola de la toma.
- `claves`: palabras o frases del guion que salen en el subtítulo en dorado, misma sans (2 a 4 por reel). En el título, `clave` ya no cambia la letra: la línea 2 entera va en el bloque dorado.
- `titulo` de la escena 0 = título GOLPE sobre su toma real (ver regla 5): `grande`, `color`, `chica`, `icono`; `fondo: "negro"` en la escena lo pone sobre negro. El resto de escenas, bloque dorado.
- `cta: true` en la escena del CTA (suma un riser). La palabra a comentar y el regalo salen de su `mi-negocio.md`
  (o de lo que dice el video); nunca «YO». Si no hay regalo definido, pregúntalo: no lo inventes.
- `firma`: su @ si lo quiere arriba (vacío si no).
- `acento`: el color de su marca en hex (`#RRGGBB`, de `mi-marca.md`); reemplaza al dorado en títulos, piezas, halos y
  subtítulos clave. Sin `acento`, queda el dorado de fábrica.
- `yo`: solo si el encuadre lo pide (cabeza muy alta o muy baja). Por defecto se calcula con `silueta.json`.

## Paso 6 · Armar y revisar el plan

```bash
uv run --no-project --python 3.12 python -X utf8 "$SKILL/scripts/armar.py" "$DEST"
```
Revisa el plan contra las reglas y avisa: cara de más de 6,5 s, escenas de menos de 1,2 s, más de 5 s sin nada
nuevo, motion fuera de 55–82 %, reel que no abre en motion, palabras clave que no están en el guion. Errores (pieza
desconocida, imagen que no existe, escenas encimadas) detienen el armado. Corrige los avisos o di por qué se quedan.

Antes de dar el plan por bueno, recórrelo frase por frase: ¿lo que dice se VE? ¿hay una sola cosa en pantalla?
¿algún paso se queda más de 3 s sin que entre algo nuevo? ¿hay al menos una escena `completa` y la cara va con su fondo?

Muéstrale a la persona el plan en una tabla corta (segundo · modo · título · qué gráfica) y pide visto bueno antes
de renderizar.

## Paso 7 · Render, sonido y revisión

```bash
cd "$DEST/reel" && hyperframes lint && cd -
node "$SKILL/scripts/revisar_layout.mjs" "$DEST"     # 🔴 obligatorio: debe salir ✅ antes de renderizar
uv run --no-project --python 3.12 python -X utf8 "$SKILL/scripts/final.py" "$DEST" --nombre <nombre-que-se-entienda>
```
`revisar_layout.mjs` abre el reel en Chrome y lee lo que mide el motor: pieza que pisa el título, pieza que pisa el
subtítulo o a la persona, pieza que se sale por los costados (margen 36 px), dos piezas que se enciman mientras
conviven y flecha que cruza una pieza. Si marca algo, se corrige el plan (posición, `ancho`, partir la escena o
`"flecha": false`) y se vuelve a correr hasta que salga ✅. El motor ya baja y achica solo lo que choca con el título
o el subtítulo, pero no inventa espacio: si una pieza queda diminuta, mejor partir la escena.
Renderiza, arma la pista de efectos desde `sfx_plan.json` (pack en `sfx/`), mezcla la voz original al frente y los
efectos por debajo, y comprueba que el video y la voz duren lo mismo. Deja `revision/hoja.jpg` (un cuadro por
segundo) y `revision/apertura.png` (0–2 s).

**Mira las dos imágenes con Read antes de entregar:**
- [ ] El cuadro 0 está lleno y algo cambia antes de 2 s (di cuál es el golpe en una línea).
- [ ] En el gancho se ve la persona abajo y su cara queda libre: ninguna pieza, flecha ni título le cae encima.
- [ ] En motion, la persona queda abajo, sin línea de corte visible, y no tapa el subtítulo ni la gráfica.
- [ ] En cara, el subtítulo cae en el pecho, no en la boca.
- [ ] Ninguna gráfica se sale del cuadro ni choca con el título (`revisar_layout.mjs` en ✅ y además mirado a ojo).
- [ ] Ninguna caja vacía en pantalla: lo que se va a llenar se ve tenue antes (esqueleto) o entra entero.
- [ ] Mockups: cada cosa que se nombra (skill, prompt, plantilla, documento, carrusel, post, app) se ve como la
      cosa real en su interfaz (`skill`, `escribe`, `documento`, `pantalla`, `post_ig`, `captura`). `armar.py` avisa
      «se nombra y en pantalla no hay mockup»: cada aviso se resuelve o se justifica en el reporte.
- [ ] Imágenes en su proporción: carruseles 4:5 completos (`grilla` o `post_ig`), nunca recortados a 9:16.
- [ ] Los objetos que vuelven, vuelven.
- [ ] Cada escena de motion muestra algo real cuando el guion lo nombra; el cuadro 0 es la cosa de la que habla.
- [ ] Ventana: la cabeza no queda cortada arriba y se ve su fondo. (Recortada: sin halo verde, sin manos comidas.)

Si algo falla, corrige el `plan.json` y repite desde el Paso 6 (el render tarda ~1 min por cada 15 s de reel).

## Paso 8 · Entregar

1. `$DEST/LEEME.md` con: fuente, fecha, qué escenas tiene, qué no se pudo hacer.
2. Ábrele el MP4 para que lo vea (`open` en Mac, `start ""` en Windows).
3. Reporte en 5 líneas: ruta del video, duración, % motion, golpe visual, pendientes (imágenes que faltaron, avisos que se quedaron).

---

## Errores frecuentes

| Síntoma | Causa | Arreglo |
|---|---|---|
| Los cortes se sienten abruptos | faltan `cortes` en el plan | ponlos (Paso 5); y coloca los cambios de modo sobre las uniones |
| Reel «solo con dibujitos» | ninguna pieza con imagen real | `armar.py` avisa; usa `captura`/`telefono` con su perfil, su bio, sus reels |
| La bio sale cortada o con la foto de perfil | el recorte fijo de `capturar_perfil.mjs` | recorta `_perfil_completo.png` a mano con `ffmpeg -vf crop=…` |
| Halo verde alrededor del pelo | verde disparejo o persona pegada al fondo | sube `despill` o graba más lejos del fondo; prueba `--modo vision` |
| Se ve la línea donde termina el cuerpo en motion | encuadre muy cerrado | `motion_escala` más baja o `motion_cabeza_y` más alta |
| La persona tapa el subtítulo en motion | cabeza alta en la toma | sube `motion_cabeza_y` (ej. 1380) |
| Una gráfica en blanco | imagen con ruta mal escrita | `armar.py` lo marca; las rutas son `assets/…` |
| El título se sale | título largo | máximo ~26 caracteres por línea |
| Video y voz no duran lo mismo | se editó `_source_cut.mov` después de recortar | repetir desde el Paso 2 |
| `hyperframes render` falla con un `<video>` dentro de `telefono` | ids repetidos | un video por segundo de entrada distinto |

## Archivos de la skill

```
reel-motion-recortada-f100k/
├── SKILL.md
├── templates/reel.html              motor: modos, título con corte seco, piezas, subtítulos (no se edita a mano)
├── scripts/recortar.py              ventana → yo.mp4 · recortada (verde, Vision o MediaPipe) → yo.webm · + silueta.json
├── scripts/mascara_persona.swift    segmentación de personas de macOS (solo en el paquete de Mac)
├── scripts/mascara_persona.py       segmentación de personas con MediaPipe (Mac y Windows)
├── scripts/capturar_perfil.mjs      perfil público de Instagram → perfil.png + bio.png
├── scripts/navegador.mjs            Chrome y puppeteer-core (de hyperframes) para los .mjs
├── scripts/revisar_layout.mjs       choques de piezas antes del render
├── scripts/revisar_uniones.py       uniones del corte contra el audio
├── scripts/armar.py                 plan.json → reel/index.html + sfx_plan.json + avisos
├── scripts/final.py                 render + voz + efectos + hoja de revisión
├── sfx/                             whoosh, pop, click, ding, riser
└── references/anatomia-referencia.md   la referencia medida y qué cambiamos
```
