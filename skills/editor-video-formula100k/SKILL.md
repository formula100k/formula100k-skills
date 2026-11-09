---
name: editor-video-formula100k
description: "Toma un video grabado (hablando a cámara) y lo deja cortado y montado: quita silencios, muletillas y palabras repetidas, y con una llave de Anthropic también las frases reformuladas y los arranques en falso (corte fino). Después lo monta en el formato que elijas: fullscreen, split, pip, versus, pizarra o noticiero, con gancho en texto, cajas de énfasis, subtítulos, imágenes y B-roll anclados a lo que dices. Lee tu negocio y tu marca (mi-contenido o tu manual de identidad visual) para que el gancho y los gráficos suenen y se vean como tú. Extra: motion graphics animados como overlay o B-roll. Activar con 'edita este video', 'córtale los silencios', 'monta mi video', 'auto-edita', 'renderiza', 'cámbiale el formato', 'genera un motion graphic', 'overlay animado', '/edita <video>' o '/render <carpeta>', o cuando haya una carpeta con MANIFEST.md lista para producir el video. Entrega BORRADOR_AUTO.mp4. Funciona en Mac y en Windows; se corre con Node y uv, sin instalar Python aparte."
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Editor de video

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Toma una grabación tuya hablando a cámara y entrega `BORRADOR_AUTO.mp4`: el video ya cortado y montado, listo para publicar o para un retoque final en tu editor de siempre.

Hace dos trabajos, en este orden:

1. **Corta.** Transcribe palabra por palabra y quita silencios, muletillas («eh», «em») y palabras repetidas pegadas («que que», «y, y, y»). Con una llave de Anthropic hace además el **corte fino**: quita las frases que dijiste mal y repetiste con otras palabras, y los arranques en falso.
2. **Monta.** Compone el formato elegido con un `MANIFEST.md`: gancho en texto, cajas de énfasis, subtítulos, imágenes y B-roll. Todo se ancla a **palabras de lo que dices**, no a segundos, así que puedes volver a cortar sin rehacer nada.

## Cuándo activar

- «Edita este video», «córtale los silencios», «monta mi video», «auto-edita», «renderiza».
- «Cámbiale el formato», «ponle subtítulos», «pásalo a pantalla dividida».
- «Genera un motion graphic», «overlay animado».
- Atajos: `/edita <video>` y `/render <carpeta>`.
- Cuando `recursos-de-video-formula100k` acaba de dejar una carpeta con `MANIFEST.md`.

No es para:

| Si piden… | Usa |
|---|---|
| Cazar recursos web o generar imágenes para el video | `recursos-de-video-formula100k` |
| Gráficos sueltos | `graficos-de-video-formula100k` |
| Carruseles | `carrusel-render-formula100k` |
| Historias | `historias-a-imagenes-nanobanana` |
| Miniaturas | `miniatura-youtube-formula100k` |
| Animaciones sin video grabado | las skills de animación |

## Dónde vive esta skill

Los comandos de abajo usan `$SKILL`: la **carpeta de esta skill**, la que contiene este `SKILL.md`. No la supongas en `~/.claude/skills/`: si la skill vino con el plugin, vive en otra ruta. Fíjala una vez al empezar con la ruta real (`SKILL="<carpeta de esta skill>"`) y úsala en todos los comandos.

En Windows los comandos corren en la terminal de Claude Code (Git Bash): `~` y las rutas con `/` funcionan igual que en Mac.

## Antes de empezar: tu negocio y tu marca

Lee esto **antes** de proponer el gancho, las cajas de énfasis o cualquier gráfico:

- **Tu negocio y tu voz.** Rubro, avatar y oferta salen de `~/Documents/mi-contenido/mi-negocio.md`; cómo hablas, de `~/Documents/mi-contenido/mi-voz.md`. El gancho y las cajas se escriben con esas palabras y para esa clienta, nunca con vocabulario de marketing si su rubro es otro.
- **Tu marca.** Búscala en este orden y quédate con la primera que exista:
  1. `~/Documents/mi-contenido/mi-marca.md`.
  2. Su manual de identidad visual, `mi-marca/marca.md` (dónde buscarlo y cómo leerlo: `references/mi-marca.md` de esta skill).
  3. Si no hay ninguno, pregunta en **un solo mensaje**: «¿Cuál es tu color principal (o un HEX)?, ¿qué letra te gusta (o "no sé")? y ¿cuál es tu @?». Mientras no responda, sigue con los valores de fábrica de la skill; no la bloquees.
- **Si falta `mi-negocio.md` o `mi-voz.md`**, pregunta en una línea su rubro y a quién le habla, o sácalo de lo que dice en el video. Si aun así no hay datos, usa marcadores (`[TU OFERTA]`) en vez de inventar.
- Al cargar la marca, confírmalo en una línea («✓ Tu marca: acento `#______`, letra ______, @______») y no repreguntes lo que ya trae.

**Tu marca manda sobre el estilo de esta skill.** Los colores, las letras y los ejemplos que trae la skill son de fábrica, no una marca:

- El **acento** de los motion graphics (`accentColor`) y de los clips animados sale de su marca. Nunca uses colores de su lista de prohibidos.
- Si su manual trae `reels.formato` o `reels.subtitulos`, úsalos como formato y subtítulos recomendados (ella decide igual en el paso 3).
- El **tema** (`default` o `crema-editorial`) se elige por el que más se parece a su paleta. El montaje base no toma colores del MANIFEST: si su paleta no se parece a ninguno, díselo y pon su color en lo que sí lo acepta (motion graphics, imágenes, clips animados).
- En `noticiero`, `Marca` lleva el nombre de su negocio.
- Si para una pieza pide otra cosa («hazlo en negro»), hazle caso en esa pieza y no toques sus archivos de marca.
- Nunca mezcles su marca con colores, letras o el @ de otra cuenta, aunque vengan de una referencia.

## Lo que necesita la compu

Node 18 o más nuevo, ffmpeg (con ffprobe) y uv. **Python no se instala aparte**: uv lo trae con sus librerías la primera vez. El motor de montaje (Remotion) vive dentro de esta skill.

Antes de editar por primera vez, o si algo falla, corre la revisión:

```bash
node "$SKILL/scripts/editar.mjs" --revisar
```

Responde una lista con ✓ y ✗, el comando que arregla cada ✗ (con Homebrew en Mac y winget en Windows), qué transcriptor va a usar y si el corte fino está encendido. Si falta el motor de montaje:

```bash
node "$SKILL/scripts/preparar.mjs"
```

Si prefieres instalar todo de una vez con el gestor de paquetes, la skill trae también `scripts/bootstrap.sh` (Mac, necesita Homebrew) y `scripts/bootstrap.ps1` (Windows, necesita winget); con `--check` (o `-Check` en Windows) solo revisan sin instalar. Homebrew no se instala solo: si `command -v brew` no responde nada, instálalo con el comando oficial de brew.sh. En Windows, winget viene con Windows 10 (1809 o más nuevo) y 11; si falta, instala «App Installer» desde Microsoft Store.

**La primera edición tarda más**: se descarga Python y el modelo que transcribe la voz (pesa más de 1 GB). El navegador que dibuja cada cuadro se baja con `node "$SKILL/scripts/preparar.mjs" --navegador`; si no se hizo, baja solo en el primer montaje. Un comando largo se corre en segundo plano y se revisa hasta que termine: no se cancela ni se repite. Avísale a la persona antes de empezar para que no piense que se trabó. Las siguientes ya no descargan nada.

| Compu | Transcribe con |
|---|---|
| Mac con chip Apple (M1 o más nuevo) | mlx-whisper |
| Windows y Mac con procesador Intel | faster-whisper (más lento: usa el procesador) |

¿Quieres comprobar que todo funciona sin grabar nada? `node "$SKILL/scripts/toma-de-prueba.mjs" "<carpeta>"` fabrica una toma de prueba con la voz de la compu, pausas largas y una frase repetida; edítala como cualquier video.

## El corte fino y la llave de Anthropic

Dilo siempre claro, antes y después de editar:

| | Sin llave | Con llave |
|---|---|---|
| Silencios y pausas | ✓ se cortan | ✓ se cortan |
| Muletillas («eh», «em») | ✓ | ✓ |
| Palabra repetida pegada («que que») | ✓ | ✓ |
| Frase reiniciada con las mismas palabras | a veces | ✓ |
| Frase mal dicha y repetida **con otras palabras** | ✗ se queda | ✓ se quita |
| Arranques en falso y autocorrecciones | ✗ se quedan | ✓ se quitan |

**La edición nunca falla por no tener llave**: simplemente corre sin el corte fino y lo avisa (`semantic OFF`).

**Dónde se saca la llave.** En console.anthropic.com, con una cuenta de la persona: menú «API keys» → «Create key». Empieza con `sk-ant-`. Es de pago por uso y aparte de la suscripción de Claude: hay que cargarle saldo en «Billing». Cada video hace una sola llamada.

**Dónde se guarda.** En un archivo propio, no en la configuración de la terminal:

```
~/.editor-video/llave-anthropic.txt
```

Crea la carpeta y el archivo vacío y ábrelo para que la persona pegue la llave ella misma (`open -e` en Mac, `notepad` en Windows). **No le pidas que pegue la llave en el chat** y nunca la escribas en un comando, un MANIFEST, un archivo de la carpeta del video ni en `~/Documents/mi-contenido/`.

⚠️ No pongas `ANTHROPIC_API_KEY` en `~/.zshrc`, `~/.bashrc` ni en las variables de entorno de Windows: Claude Code la tomaría también para sí y empezaría a cobrar por uso en vez de usar el plan de la persona. Por eso el archivo.

**Seguridad (no sobre-borra):** si el corte fino propone borrar más del 40 % del video, se descarta su sugerencia y queda solo el corte local. Una toma buena no se pierde por un error del modelo.

El modelo del corte fino se cambia con la variable `EDITOR_MODELO_CORTE` o con `--semantic-model <modelo>` (por ejemplo, uno más económico).

## Flujo completo

`EDITAR` es `node "$SKILL/scripts/editar.mjs"`.

### Paso 1 · Cortar y transcribir

```bash
node "$SKILL/scripts/editar.mjs" "<ruta del video>" --solo-corte
```

Trabaja en `~/Documents/mis-videos-editados/<nombre-del-video>/` (cámbialo con `--carpeta "<carpeta>"`; si `recursos-de-video-formula100k` ya dejó una carpeta con `MANIFEST.md`, usa esa). Deja ahí:

- `_source_cut.mov`: el video cortado.
- `captions.json`: cada palabra con su tiempo en el video ya cortado. Se transcribe una sola vez el original y se remapea al corte; no se vuelve a transcribir el video cortado.
- `edl.json`: qué tramo del original quedó en dónde.
- `corte.json`: el resumen del corte. Su campo `corte_fino` dice si ocurrió: `ok` o `nothing` (corrió), `no_key` (sin llave), `api_fail` (la llamada falló), `aborted_overbudget` (se descartó por seguridad) o `apagado`.

Si la persona tiene el guion de lo que quiso decir, guárdalo como `guion.txt` en esa carpeta **antes** de cortar: el corte fino lo usa de referencia.

### Paso 2 · Leer lo que quedó

Lee `captions.json` y arma el texto completo. Revisa:

- Lo que imprimió el corte: cuántos tramos quedaron, la duración antes y después, y la línea `semantic`.
- Si `corte.json` no dice `ok` ni `nothing` (o el registro dice `semantic OFF` o `la llamada a Claude falló`), **el corte fino no ocurrió**. Dilo con esas palabras, señala las frases repetidas o reformuladas que veas en el texto y ofrece el paso de la llave. No des a entender que quedó limpio.
- Con el corte fino activo, busca igual repeticiones y autocorrecciones que se hayan escapado.

Al entregar, di qué no se pudo cortar y que tú no oíste el audio: la persona debe verlo una vez.

### Paso 3 · Gancho, formato y MANIFEST

Con el texto a la vista (y su negocio, su voz y su marca ya leídos):

1. **Gancho en texto** (solo formato `fullscreen`): propón 3 variantes de dos líneas, de 3 a 5 palabras cada una (el montaje las muestra en mayúsculas): una declaración directa, una con contraste y una con promesa concreta sacada de lo que dice el video. Pregunta cuál con `AskUserQuestion` («¿Cuál usamos como gancho? Aparece sobre tu cara los primeros 8 segundos»), con la opción de no poner ninguno. Si el MANIFEST ya trae un `## Header`, la primera opción es **conservar el actual** y las otras tres son las variantes. Si la persona tiene la skill `guionizacion-formula100k`, úsala para las variantes; si no, escríbelas tú. Si elige «Otro», usa su texto como `Línea 1` / `Línea 2`; si pide más, propón otras 3.
2. **Formato**: recomienda uno con su razón (qué viste en el video o en la carpeta que lo pide; si su manual trae `reels.formato`, ese es el punto de partida) y ofrece las alternativas cercanas con `AskUserQuestion` («¿Con qué formato lo edito?»). **Nunca elijas en silencio**: equivocarse cuesta un render de varios minutos. Mira el catálogo de abajo; cada formato dice qué material necesita. Las señales de cada formato están en el campo `cuandoUsar` de `remotion-template/src/formatos.ts`.
3. **Énfasis**: 2 a 4 cajas de texto en los momentos fuertes, ancladas a palabras que sí están en `captions.json`.
4. Escribe `MANIFEST.md` en la carpeta de trabajo (formato más abajo). Si ya existe, cambia solo lo que se decidió (las dos líneas del `## Header`, el `- **Formato:**`) y no toques el resto.

No inventes cifras, precios ni resultados en el gancho ni en las cajas: usa solo lo que la persona dice en el video o te dio.

**Saltar preguntas.** Si la persona dice «renderiza tal cual», «el gancho está bien» o «no toques el formato», o usa `/render <carpeta> --skip-hook` o `--skip-formato`, salta esa pregunta. Por defecto, incluso al volver a renderizar, se pregunta.

### Paso 4 · Montar

```bash
node "$SKILL/scripts/editar.mjs" "<ruta del video>"
```

Como el corte ya existe, no lo repite: lee el MANIFEST, arma `cues.json` y renderiza `BORRADOR_AUTO.mp4` en la carpeta de trabajo. Si usaste `--carpeta` en el paso 1, repítelo aquí. Con `/render <carpeta>`, el video fuente sale del campo `**Video fuente:**` del MANIFEST; si no está, pídelo.

Antes de entregar: mide la duración con `ffprobe`, saca dos o tres cuadros con `ffmpeg` y míralos (que el texto se lea, que nada tape la cara, que los colores sean los de su marca), y lee los `[warn]` que haya impreso: no los des por buenos sin decirlos.

Tiempo típico: de 3 a 5 minutos de render por minuto de video en una Mac con chip Apple; más en Windows o Intel.

### Atajo: todo de una

Sin MANIFEST en la carpeta, el mismo comando sin `--solo-corte` crea uno básico (formato `fullscreen`, subtítulos encendidos) y entrega el video de corrido. Con `--formato <id>` eliges el formato de ese MANIFEST básico. Sirve para una prueba rápida; para un video que se va a publicar, sigue los 4 pasos.

## Catálogo de formatos

| Formato | Qué es | Material que necesita además de tu video | Subtítulos |
|---|---|---|---|
| `fullscreen` | Tú a pantalla completa (9:16) con gancho, énfasis y gráficos en los tercios | Nada | apagados |
| `split` | Lienzo arriba (40 %) y tu cara abajo (60 %) | Imágenes o clips para el lienzo | encendidos |
| `pip` | Grabación de pantalla de fondo y tu cámara en un recuadro | Una grabación de pantalla en `CANVAS/` | encendidos |
| `versus` | Cuadro partido en dos (antes/ahora) con tu cámara en la costura | Dos imágenes o clips, uno por lado | encendidos |
| `noticiero` | Horizontal 16:9 con barra de noticias, rótulos y capturas | Nada (capturas, si quieres) | no tiene |
| `pizarra` | Trazos a mano que se dibujan detrás de ti | Un video de trazos con transparencia y tu recorte sin fondo | encendidos |

`fullscreen` y `noticiero` salen solo con tu video. `split`, `pip` y `versus` necesitan que la persona aporte imágenes, capturas o una grabación de pantalla: si no las tiene, dilo y propón `fullscreen`. **`pizarra` es avanzado**: este editor no dibuja los trazos; ofrécelo solo si la persona ya tiene ese video con transparencia o tiene la skill `pizarra-explicativa-f100k`, que lo produce. Si tienes skills de animación, sus clips sirven como imágenes y B-roll de cualquier formato.

Existe un séptimo formato en el código (`faceless`, solo voz) que **no** se puede pedir desde el MANIFEST: nunca escribas `- **Formato:** faceless`.

El formato y sus opciones van en la cabecera del MANIFEST:

```markdown
- **Formato:** split
- **Tema:** crema-editorial
- **Subtítulos:** on
- **Esquina cámara:** tr
- **Etiqueta A:** ANTES
- **Etiqueta B:** AHORA
```

Solo `Formato` es necesario, y tiene que ser uno de los ids de la tabla (un texto libre como `1920×1080` se descarta y cae al de fábrica). Temas: `default` y `crema-editorial`. Un formato o tema desconocido cae al de fábrica y avisa con `[warn]`; subtítulos sin `captions.json` se apagan. Nunca rompe el render.

### `split`

El lienzo de arriba muestra los overlays y el B-roll. Si en un momento no hay nada que mostrar, el panel queda con el color de fondo del tema, sin aviso: reparte el material a lo largo del video. La columna `Posición` de los overlays se ignora (el lienzo es una sola zona), así que dos overlays al mismo tiempo se dibujan uno encima del otro. El encuadre de la cara está fijo en el código (`split.tsx`): no se ajusta desde el MANIFEST.

### `pip`

Deja la grabación de pantalla en `CANVAS/` dentro de la carpeta de trabajo; toma el primer video por orden alfabético y avisa cuál eligió. Sin `CANVAS/`, avisa y muestra tu cámara a pantalla completa, con subtítulos y sin gancho. `Esquina cámara` dice dónde va tu recuadro: `tl`, `tr`, `bl`, `br` (de fábrica `tr`, arriba a la derecha, porque abajo viven los subtítulos). No lleva gancho ni cajas de énfasis. Un B-roll de **video** tapa también tu recuadro mientras dura: si quieres seguir en cuadro, usa imágenes. Los overlays y las imágenes de B-roll rozan un poco el recuadro (entre 10 y 15 %), aun en una esquina de arriba.

### `versus`

El cuadro se parte en dos mitades y tu cámara va en un círculo sobre la costura. Cada fila de B-roll dice en qué mitad vive con la columna `Lado` (`a` arriba, `b` abajo; sin `Lado`, cae en `a`):

```markdown
| Keyword | Archivo | Duración | Estilo | Lado |
|---|---|---|---|---|
| antes | USER/vitrina-vieja.png | 4 | clean | a |
| ahora | USER/vitrina-nueva.png | 4 | clean | b |
```

`Etiqueta A` y `Etiqueta B` rotulan cada mitad (si falta una, usa ANTES/AHORA). Al preparar las imágenes, **el contenido huye de la costura**: la de arriba lleva lo importante arriba (su borde inferior lo muerde el círculo de cámara) y la de abajo, abajo (su franja superior es para el subtítulo y el énfasis). Deja libre la esquina superior izquierda de cada mitad para la etiqueta. El subtítulo y el énfasis comparten banda: mientras hay un énfasis, el subtítulo que lo pisaría no se muestra. Si las imágenes son texto denso, apaga los subtítulos con `- **Subtítulos:** off`.

### `noticiero`

Horizontal 1920×1080. Si tu video es vertical, lo recorta a la banda central: se pierden el techo y el piso del encuadre. **Compruébalo antes de montar** sacando un cuadro:

```bash
ffmpeg -ss 8 -i "<video>" -frames:v 1 -vf "scale=1920:-1,crop=1920:1080" "<carpeta>/prueba-16x9.png"
```

Si se corta la cabeza, ese video no sirve para este formato. Tiene sus propias secciones de MANIFEST (más abajo).

### `pizarra`

Apila tres capas: tu video, un **lienzo** de trazos con transparencia (`*lienzo*.webm` o `.mov`, o cualquier video en `PIZARRA/`) y tu **recorte** sin fondo (`*cutout*.webm`). Los encuentra por el nombre; al MANIFEST le basta `- **Formato:** pizarra`. El recorte se saca, local y gratis, sin pantalla verde, con:

```bash
npx hyperframes remove-background "<carpeta>/_source_cut.mov" -o "<carpeta>/mi_cutout.webm" --quality balanced
```

Si falta cualquiera de los dos, avisa y cae a `fullscreen`. No admite B-roll: el lienzo ya es el apoyo visual.

- El alfa de un `.mov` HEVC no lo lee el navegador del montaje: el editor convierte el lienzo a `.webm` la primera vez y lo guarda junto al original. Si puedes, pide el lienzo directamente en `.webm`.
- **Dónde caben los trazos:** tu cuerpo ocupa la mitad de abajo del cuadro. De arriba hasta unos 480 px el cuadro está libre; entre 480 y 720 quedan libres los costados; de 720 hacia abajo el recorte tapa los trazos. Diseña el lienzo dentro de los primeros ~700 px.
- Donde la ropa oscura toca un fondo oscuro, el recorte puede dejar una banda tenue: sube a `--quality best`. Si la toma tiene mala luz y el recorte sale sucio, usa `split` (pizarra arriba, cara abajo).

## Formato del MANIFEST.md

Todo se ancla a **palabras del transcript** (columna `Keyword`). El editor busca la primera vez que aparece (sin importar mayúsculas, tildes ni puntuación) y dispara ahí. Los ejemplos son de un negocio ficticio: cámbialos por el rubro y las palabras de la persona.

```markdown
# Reel — Ramos que duran más

- **Video fuente:** ~/Downloads/ramos.mov
- **Formato:** fullscreen
- **Subtítulos:** on

## Header

- **Línea 1:** Tu ramo dura
- **Línea 2:** el doble así
- **Esconder después:** 8

## Gancho visual

- **Archivo:** `USER/ramo-marchito.png`
- **Posición:** right
- **Inicio:** 0.3
- **Duración:** 2.2
- **Ancho:** 380
- **Rotación:** 3

## Énfasis

| Keyword        | Texto en caja blanca  | Duración |
|----------------|-----------------------|----------|
| agua tibia     | Agua tibia, no fría   | 1.6      |
| corte diagonal | Corta en diagonal     | 1.8      |

## Overlays

| Keyword     | Archivo                 | Ancho | Duración | Posición |
|-------------|-------------------------|-------|----------|----------|
| el florero  | `USER/florero.png`      | 480   | 2.4      | bottom   |

## B-roll

| Keyword        | Archivo                  | Duración | Estilo        |
|----------------|--------------------------|----------|---------------|
| en la tienda   | `USER/tienda.mp4`        | 3.0      | monitor-photo |
```

Los archivos van en subcarpetas de la carpeta de trabajo: `USER/` (lo que aporta la persona), `IA/` (lo generado) o `WEB/` (lo descargado). Solo esas tres se copian al montaje. Las fotos son siempre de la persona: nunca uses fotos de muestra, caras inventadas ni piezas de otras creadoras.

### Qué sección existe en cada formato

| Sección | fullscreen | split | pip | versus | pizarra | noticiero |
|---|---|---|---|---|---|---|
| Header (gancho en texto) | ✓ | — | — | — | — | — |
| Gancho visual | ✓ | — | — | — | — | — |
| Énfasis | ✓ | ✓ | — | ✓ | ✓ | — |
| Overlays | ✓ | ✓ | ✓ | — | — | — |
| B-roll | ✓ | ✓ | ✓ | ✓ (con `Lado`) | — | — |
| Subtítulos | opcional | ✓ | ✓ | ✓ | ✓ | — |

Una sección que el formato no usa se ignora sin avisar. Si el gancho «desapareció», casi siempre es porque el formato no es `fullscreen`.

### Reglas por sección

- **Header.** Dos líneas en letra grande con trazo negro. Vive los primeros 8 segundos y se quita; `Esconder después: 0` lo deja todo el video. Sigue visible sobre el B-roll mientras está en su ventana.
- **Gancho visual.** Una imagen tipo sticker en una esquina superior los primeros segundos. De fábrica: `Posición=right`, `Inicio=0.3`, `Duración=2.2`, `Ancho=360`, `Rotación=3`. No cubre la cara.
- **Énfasis.** Columnas `Keyword | Texto | Duración | Offset` (de fábrica 1.6 s y 0). Caja blanca en la parte baja. Mayúscula solo al inicio, nunca todo en mayúsculas. Mientras hay un énfasis, los overlays se esconden.
- **Overlays.** Columnas `Keyword | Archivo | Ancho | Duración | Posición` (de fábrica 420 px, 2.0 s, `bottom`). `bottom` va en el tercio inferior, a la altura del pecho; `top`, con su borde de abajo al ras del cabello, por encima de la cabeza (sirve para capturas de pantalla y llamadas). Nunca tapan la cara.
- **B-roll.** Columnas `Keyword | Archivo | Duración | Estilo` (de fábrica 3.0 s, `monitor-photo`; el otro estilo es `clean`). Un **video** ocupa la pantalla completa; una **imagen** va en la parte baja a 900 px de ancho (esta tabla no tiene columna `Ancho`). Dos B-roll seguidos no se enciman: el primero termina donde empieza el segundo.
- **Subtítulos.** `- **Subtítulos:** on|off` los fuerza. Van de 3 en 3 palabras y cortan en las pausas; la palabra que coincide con un énfasis se resalta.
- Cada imagen que aparece suena con un «pop» corto.

### Secciones del formato noticiero

Solo las lee `- **Formato:** noticiero`, que a su vez ignora las de arriba.

- `- **Marca:** FLORES NOTICIAS` — el nombre del noticiero (usa el de su negocio). Sale junto a «● EN VIVO» y en el bloque de la barra inferior, partido en dos renglones por su último espacio. De fábrica: `NOTICIAS`.
- `## Ticker` — una viñeta por titular; rotan solos cada 5 segundos en la barra inferior.
- `## Chyrons` — el rótulo de cada noticia. Columnas `Keyword | Kicker | Título | Duración | Offset` (de fábrica `NOVEDAD`, 4 s).
- `## Tarjetas` — columnas `Keyword | Tipo | Campos | Duración | Offset`. `Campos` es `clave=valor` separado por `;` y las listas internas por `//`.

| Tipo | Campos | Obligatorio |
|---|---|---|
| `title` | `eyebrow`, `titulo`, `subtitulo` | `titulo` |
| `bignum` | `de`, `a`, `unidad`, `pie` | `a` |
| `list` | `titulo`, `items` (separados por `//`) | `items` |
| `leaderboard` | `titulo`, `filas` (`Nombre : Dato : Detalle` separadas por `//`) | `filas` |
| `shot` | `archivo`, `titulo`, `pie` | `archivo` |

```markdown
- **Formato:** noticiero
- **Marca:** NUTRICIÓN NOTICIAS

## Ticker

- Nueva guía de porciones para la lonchera
- Taller de etiquetas este sábado

## Chyrons

| Keyword              | Kicker  | Título                     | Duración | Offset |
|----------------------|---------|----------------------------|----------|--------|
| la nueva guía        | Novedad | Guía de porciones          | 4.5      | 0      |

## Tarjetas

| Keyword          | Tipo  | Campos                                                        | Duración | Offset |
|------------------|-------|---------------------------------------------------------------|----------|--------|
| tres cambios     | list  | titulo=Los 3 cambios; items=Más fibra // Menos azúcar // Agua | 4.5      | 0      |
| en la etiqueta   | shot  | archivo=USER/etiqueta.png; titulo=La etiqueta; pie=Dónde mirar | 6        | 0      |
```

Los rótulos y las tarjetas `title`, `bignum`, `list` y `leaderboard` comparten el tercio inferior (la tarjeta esconde el rótulo mientras dura). La tarjeta `shot` va arriba a la derecha, en una caja de 620×392: recorta la captura a la zona que importa antes de usarla, porque una pantalla completa no se lee a ese tamaño. Una fila con un tipo desconocido o sin su campo obligatorio se descarta con `[warn]`. Los números de `bignum` y `leaderboard` salen de la persona: no los inventes.

### Dos trampas de las keywords

1. **La keyword engancha otra palabra.** La búsqueda es «contiene»: `es` aparece dentro de `esto` y `estamos`. Usa frases de 2 o 3 palabras, no una palabra corta y común.
2. **El overlay no aparece aunque la keyword esté bien.** Si choca con un énfasis y le queda menos de 1.2 s libre, se descarta sin avisar. Muévelo a otra palabra o acorta el énfasis.

Si `[warn]` dice que una keyword no está en el transcript, cámbiala por palabras que sí estén en `captions.json` (el transcriptor a veces escribe distinto un nombre propio).

## Cambiar algo después

- **Otro formato, otro gancho, otra caja:** edita `MANIFEST.md` y corre de nuevo el comando del paso 4. No vuelve a cortar ni a transcribir.
- **Otro corte:** agrega `--recortar` y las banderas que quieras:

| Bandera | Para qué |
|---|---|
| `--semantic-level ajustado` | Corte fino más apretado: también quita preámbulos, divagaciones y frases que repiten la idea. Protege gancho, pasos, datos y llamado a la acción. De fábrica es `conservador` (solo tomas falladas). Úsalo cuando grabaste limpio y el video quedó largo y flojo. |
| `--no-semantic` | Apaga el corte fino aunque haya llave. |
| `--min-silence 0.15` | Deja más respiración entre frases (de fábrica 0.08; `0.05` aprieta más). |
| `--pad 0.09` | Si se comen el final de las palabras (de fábrica 0.06; `0.03` da un ritmo más apretado). |
| `--no-dedupe` | Conserva repeticiones a propósito («muy, muy bueno»). |
| `--dedupe-max-gap 0.6` | Solo junta repeticiones muy seguidas. |
| `--no-phrase-dedupe` | Conserva las frases reiniciadas. |
| `--guion "<ruta>.txt"` | Guion de referencia para el corte fino (o deja `guion.txt` en la carpeta). |
| `--semantic-max-drop 0.6` | El corte fino se descarta si quiere borrar más de esa parte del video (de fábrica 0.4). |

- **Otras muletillas:** edita `FILLER_REGEX` en `scripts/cut_silences_and_fillers.py`.
- **Otro modelo de voz:** variable `EDITOR_WHISPER_MODELO` (`small` o `medium` en una compu lenta o con poco internet, `large-v3` para más precisión; de fábrica `large-v3-turbo`).
- **Estética** (tamaños, posiciones, letra): los componentes están en `remotion-template/src/` (el formato `fullscreen` vive en `CreaContenidoViral.tsx`). Los temas, en `temas.ts`.

## Opcional: ilustrar lo que explicas (director de conceptos)

Un pase extra de Claude que **no corta**: lee el transcript, encuentra los momentos en que explicas algo nuevo (una herramienta, un método, una metáfora) que se entendería mejor con un apoyo visual, y propone cómo mostrarlo. Actívalo cuando digan «ilustra lo que explico» o «agrégale visuales». Necesita la llave de Anthropic; sin ella escribe una lista vacía y no bloquea nada.

```bash
ANTHROPIC_API_KEY="$(grep -o 'sk-ant-[A-Za-z0-9_-]*' ~/.editor-video/llave-anthropic.txt 2>/dev/null)" \
  uv run --no-project --python 3.12 --with certifi python "$SKILL/scripts/concept_director.py" \
  "<carpeta>/captions.json" --out "<carpeta>/concept_proposals.json" --max 4
```

`concept_proposals.json` trae una lista de `{keyword, concepto, tipo, prompt_visual, t_hint}` con la keyword ya verificada contra el transcript.

1. **Pregunta antes de gastar créditos:** muestra las propuestas con `AskUserQuestion`. La persona aprueba, cambia el `prompt_visual` o el `tipo`, o descarta. No se genera nada sin su sí.
2. **Genera cada propuesta aprobada**, con los colores y la letra de su marca:
   - `card` (concepto simple o numérico) → una tarjeta con `graficos-de-video-formula100k` o una tarjeta HTML → `<carpeta>/IA/concepto_<slug>.png`.
   - `imagen` (concepto que se puede ver) → el conector de Higgsfield (`generate_image`), en 9:16 o 1:1 → `<carpeta>/IA/concepto_<slug>.png`. Sin créditos o sin conector, haz una `card` y avísalo.
3. Agrégalas al MANIFEST como overlays (o como B-roll con estilo `monitor-photo` si deben ser protagonistas), ancladas a su keyword.

## Opcional: clips de apoyo generados

Para un video largo (por ejemplo, 16:9 de YouTube) que necesita apoyo visual en conceptos, datos o ejemplos. Solo si la skill `reel-faceless-f100k` está instalada junto a esta:

1. Con `captions.json` listo, sigue `../reel-faceless-f100k/reference/clip-director.md` (ruta relativa a la carpeta de esta skill) con `modo=support` y `formato=16:9`. Propone un plan donde cada clip trae una keyword copiada tal cual del transcript.
2. Pregunta con `AskUserQuestion`: «¿Genero estos N clips de apoyo? / ajustar algunos / ninguno».
3. Genera con Higgsfield (`generate_video`, `aspect_ratio="16:9"`) y descarga a `<carpeta>/IA/broll_generado/clipNN.mp4`.
4. Agrega una fila por clip en `## B-roll` (créala si no existe). Los clips son apoyo: el video vuelve a tu cara al terminar cada uno.

Sin créditos de Higgsfield, propone tarjetas o recursos reales con `recursos-de-video-formula100k`. No falla.

## Gráficos animados incluidos

El motor trae cuatro piezas animadas que se renderizan sueltas y se usan como overlay o B-roll (con `Ancho: 1080` y la duración del clip). No necesitan nada más que el motor de montaje:

| Composición | Datos | Para |
|---|---|---|
| `motion-badge` | `badgeNumber`, `title`, `subtitle`, `accentColor` | Punto numerado, paso de un tutorial |
| `motion-stat` | `value`, `label`, `suffix`, `accentColor` | Un número que sube |
| `motion-quote` | `quote`, `author`, `accentColor` | Una frase o testimonio |
| `motion-list` | `title`, `items[]`, `accentColor` | Lista que aparece punto por punto |

```bash
cd "$SKILL/remotion-template"
npx tsx scripts/render.ts --composition motion-list \
  --props '{"title":"Lo que vas a aprender","items":["Elegir la flor","Armar el ramo","Hacerlo durar"],"accentColor":"<acento de su marca>"}' \
  --out "<carpeta>/IA/lista.mp4"
```

`accentColor` es siempre el acento de su marca. Los datos que pongas (números, citas, nombres) salen de la persona: no los inventes.

Se animan solo `transform` y `opacity`, con resortes firmes (rigidez 280-320, amortiguación 26-32), transiciones de menos de 300 ms y entradas que frenan al final.

## Extra: motion graphics a medida (HyperFrames)

Para algo más elaborado que las cuatro piezas (texto que se escribe solo, una ventana de navegador con pasos, tarjetas que giran, partículas, algo que reacciona al audio), arma un clip 1080×1920 con HyperFrames (HTML + GSAP) y úsalo como cualquier overlay o B-roll. Necesita Node 22 o más nuevo; se usa con `npx hyperframes`, sin instalar nada más. Si tienes las skills `hyperframes`, síguelas.

1. Crea un proyecto en `<carpeta>/IA/motion-<nombre>/` con su `index.html`.
2. Previsualiza: `npx hyperframes preview`.
3. Renderiza: `npx hyperframes render --output "<carpeta>/IA/<nombre>.mp4"`.
4. Agrégalo al MANIFEST con `Ancho: 1080` y `Duración` igual a la del clip:

```markdown
## Overlays

| Keyword     | Archivo                 | Ancho | Duración |
|-------------|-------------------------|-------|----------|
| tres pasos  | IA/pasos-overlay.mp4    | 1080  | 8.0      |
```

**El estilo lo pone su marca:** fondo, texto y acento de su paleta, sus letras y, si su manual trae `movimiento.*`, su ritmo de animación (duración, frenado, rebote, de dónde entra y cómo sale). Sin marca, elige un estilo que vaya con su rubro y díselo. Ejemplo de pedido:

```
Usando HyperFrames, crea un overlay 1080×1920 con una etiqueta en <acento de su marca>
«Paso 1», un título en <color de texto de su marca> «<frase de su video>», la etiqueta entra
desde la izquierda y el título sube con un fundido. Duración 8 s. Fondo <fondo de su marca>.
Guárdalo en <carpeta>/IA/motion-paso1/ y renderiza el .mp4.
```

| | Piezas incluidas (Remotion) | HyperFrames |
|---|---|---|
| Preparación | Ya vienen en el motor | Node 22 o más nuevo, `npx hyperframes` |
| Libertad | Media: datos fijos por pieza | Alta: cualquier HTML, CSS o GSAP |
| Mejor para | Pasos, números, citas, listas | Diseños a medida, maquetas, tipografía en movimiento |

## Errores comunes

| Mensaje | Qué hacer |
|---|---|
| `No puedo editar todavía. Falta: …` | Instala lo que lista, con el comando que indica, y vuelve a correr. |
| `Falta instalar el motor de montaje` | `node "$SKILL/scripts/preparar.mjs"` |
| `semantic OFF` | No hay llave: no hubo corte fino. No es un error. Dilo y ofrece ponerla. |
| `corte fino: la API respondió 401` | La llave está mal copiada o fue borrada. Revisa el archivo de la llave. |
| `corte fino: la API respondió 400` o `403` con un texto de saldo o crédito | La cuenta no tiene saldo: se carga en «Billing» de console.anthropic.com. |
| `semantic: Claude propuso borrar >40%` | Sugerencia descartada por seguridad. Si el video de verdad tiene mucho descarte, `--recortar --semantic-max-drop 0.6`. |
| `no detecté voz en el video` | El archivo no tiene audio o no se oye a nadie hablar. |
| `mlx-whisper no pudo transcribir` | Corre de nuevo con `EDITOR_TRANSCRIPCION=faster` delante del comando. |
| `[warn] keyword … no aparece` | Cambia esa keyword por palabras que estén en `captions.json`. |
| Remotion dice «Can only download URLs starting with http:// or https://» | Un archivo del MANIFEST está fuera de `USER/`, `IA/` o `WEB/`. Muévelo a una de esas tres. |
| `npm install` falla por la caché de npm (Mac) | Borra `~/.npm` y corre de nuevo `preparar.mjs`. |
| En Windows, un programa recién instalado «no existe» | Cierra Claude Code y ábrelo de nuevo: la terminal no ve lo instalado hasta reiniciar. |
| El render se queda en 0 % un rato la primera vez | Está descargando el navegador de montaje. Espera. |

## Archivos de la carpeta de trabajo

```
<carpeta>/
├── MANIFEST.md          ← lo que se edita para cambiar el montaje
├── guion.txt            ← opcional, referencia para el corte fino
├── USER/  IA/  WEB/     ← imágenes y clips del montaje
├── CANVAS/              ← solo pip: la grabación de pantalla
├── _source_cut.mov      ← el video cortado
├── captions.json        ← cada palabra con su tiempo
├── edl.json             ← qué tramo del original quedó dónde
├── corte.json           ← resumen del corte y si hubo corte fino
├── cues.json            ← se rehace en cada montaje
└── BORRADOR_AUTO.mp4    ← el video final
```

El video original nunca se modifica.

## Para quien toque el código

- `remotion-template/src/formatos.ts` es la fuente de verdad del catálogo de formatos; si esta guía y el código difieren, manda el código. `estilos.ts` es el catálogo de estilos que se ofrece a las alumnas (con `construirPrompt(id)` para el prompt que se copia); un estilo no entra ahí hasta que su render salga bien de punta a punta (lo vigila `estilos.test.ts`).
- Pruebas: `cd "$SKILL/remotion-template" && npm test` (TypeScript) y `cd "$SKILL/scripts" && python3 -m unittest test_manifest_formato test_semantic_clean`.
- **Nunca pongas `<Header>` dentro de una `<Sequence>` de B-roll**: dentro de una `Sequence`, `useCurrentFrame()` cuenta desde 0 y el gancho reaparece en cada B-roll aunque ya pasó su tiempo. El `<Header>` vive una sola vez, fuera de todas las `Sequence`.
- **Nunca dejes que dos B-roll se solapen**: `resolveBroll` ordena y recorta cada uno hasta el inicio del siguiente. En `versus` ese recorte es **por lado**; si fuera global, las dos mitades nunca se verían juntas.
- El modo `tutorial` de `scripts/render.ts` (el que usa `reel-faceless-f100k`) muestra los subtítulos en mayúsculas porque comparte la capa `layers/Captions.tsx`.
- Para probar un cambio de cues sin pasar por Python:

```bash
cd "$SKILL/remotion-template"
npx tsx scripts/render.ts --video _source_cut.mov \
  --transcript "<carpeta>/captions.json" --cues "<carpeta>/cues.json" \
  --out "<carpeta>/BORRADOR_AUTO.mp4"
```

## Diferencias con otras skills

| | recursos-de-video | editor-video (esta) | graficos-de-video |
|---|---|---|---|
| Entrega | MANIFEST.md + WEB/ + IA/ | BORRADOR_AUTO.mp4 | PNG sueltos |
| Necesita MANIFEST | No (lo genera) | Sí (lo usa o lo crea) | No |
| Edita video | No | Sí | No |
| Busca en la web | Sí | No | No |
