---
name: youtube-notitas-f100k
description: "Edita un video largo de YouTube 16:9 a cámara en estilo notitas: corte fino, gancho editorial, títulos de sección y pantallas de papel cuadriculado. Usar con «edita este video de YouTube», «estilo YouTube notitas». NO para reels 9:16 (edicion-notitas-f100k) ni pizarras (pizarra-youtube-f100k)."
argument-hint: "[ruta del video] [opcional: link de la fuente o pizarra]"
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# YouTube notitas

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Edición completa de un video largo horizontal. Ejemplo de plan completo (un video de noticias de 8 min con 10 secciones,
clips de la entrevista y pantallas de papel): `ejemplo/plan_ejemplo.py`.

`SK` = la carpeta de esta skill (normalmente `~/.claude/skills/youtube-notitas-f100k`).
Los `.py` de la skill corren con `uv run --no-project --python 3.12 --with numpy python -X utf8 <script>` (Python sin instalar Python;
igual en Mac y en Windows). Escríbelo entero en cada comando: guardado en una variable no corre en zsh.
Proyecto: `DEST=~/Documents/mis-videos-editados/youtube-<nombre>/` (nunca en una carpeta temporal: se borra).

## 🧰 EN TU COMPU

Esta skill viaja en el módulo de Edición y corre igual en Mac y en Windows (en Windows, desde la terminal de Git Bash que usa Claude Code).

- **Programas:** Node 18 o más nuevo, ffmpeg (con ffprobe), uv y Google Chrome. yt-dlp solo si hay una fuente que bajar
  (entrevista, podcast). Python no se instala aparte: uv lo trae.
- **Motor de render** (Remotion + playwright-core): vive en `plantilla/` y se instala solo con el módulo (`npm install` en la
  skill corre `scripts/preparar.mjs`). Si falta: `node "$SK/scripts/preparar.mjs"`.
- **Transcripción:** `scripts/transcribir.py` usa mlx-whisper en Mac con chip Apple y faster-whisper en Windows y Mac Intel
  (más lento: usa el procesador; con `--modelo chico` va más rápido). La primera vez baja el modelo (más de 1 GB).
- **Tu negocio:** `~/Documents/mi-contenido/mi-negocio.md` (qué vendes, a quién, qué palabra pide comentar). Si no existe,
  sácalo de lo que dice el video o pregunta en una línea. No inventes cifras, precios ni testimonios.
- **Tu marca:** `~/Documents/mi-contenido/mi-marca.md` (o su manual `mi-marca/marca.md`). Su acento va en `MARCA["acento"]`
  (cifras y claves sobre la toma) y su color de clave en `MARCA["clave"]` (palabras con `~` en el papel). Si no hay marca,
  quedan los de fábrica (amarillo `#f3c623` y azul `#0192FB`) y le preguntas en un solo mensaje si quiere los suyos.
- **Dónde guardar:** todo en `DEST` (`~/Documents/mis-videos-editados/youtube-<nombre>/`; en Windows, la carpeta Documentos de su usuario).
- **Otras skills:** `pizarra-youtube-f100k` (Animación) y `miniatura-youtube-formula100k` si están instaladas; si no, sigue sin ellas.

## Reglas del estilo (mandan sobre todo lo demás)

1. **Corte fino de verdad.** Cero aire, cero retomas, cero palabras mochas. Lo típico que se escapa: «hooks entre cada uno de
   los… entre cada uno de los», «Pero volviendo… pero volviendo», «o… o», «en donde te pro… en donde te doy» y una palabra larga
   cortada al final. Se revisa con el audio, no solo con la transcripción (paso 2).
2. **Una sola tipografía: la del gancho.** Inter (grotesca, 600–900, mayúsculas en lo grande) + manuscrita fina subrayada
   (Nothing You Could Do). **Nada de letra de pizarra** (Permanent Marker o Caveat), ni en pantallas ni en etiquetas, y tampoco
   láminas de pizarra a pantalla completa (usan esa letra; sus capturas sí se reusan).
3. **Nada de etiquetas fijas arriba** («Noticia 10 · …»). Cada sección empieza con un **título grande**: kicker chico
   («Noticia 06»), línea grotesca en mayúsculas y la manuscrita subrayada («LA MÉTRICA QUE TE HACE / *crecer*»), a la izquierda
   y sobre la toma oscurecida (overlay plano 0,42).
4. **Gancho sin bloque**: palabras blancas que entran sincronizadas con la voz, una manuscrita subrayada y la cifra en el acento
   (amarillo `#f3c623` de fábrica). Referencias: Hormozi `youtube.com/watch?v=5rOIS7GHD5Y` y Federico Cristofari
   `youtube.com/watch?v=VfghO763wrc` (clean, editorial).
5. **Muchas pantallas de motion con imágenes reales**: papel cuadriculado estilo notitas, aproximadamente 1 cada 20–25 s, además
   de las palabras sobre la toma (densidad total: nada de huecos de más de 5 s).
6. **Exposición**: la toma va con `brightness(0.82) contrast(1.06) saturate(0.96)`. Con 0,72 queda oscura y con 0,84 el texto
   blanco no se lee sobre una pared clara.
7. Sin música, con efectos de sonido (vienen en `plantilla/public/sfx/`); nada rebota ni tiembla; corte seco; fotos reales antes
   que íconos; CTA nunca «YO» (la palabra sale de su `mi-negocio.md`).

## Pasos

### 0. Preparar
- `mkdir -p "$DEST"` y `node "$SK/scripts/nuevo.mjs" "$DEST"`: copia la plantilla a `DEST/_remotion/` y le enlaza el motor.
- `ffprobe` del video (si es 1620×1080 o parecido, se escala a 1920×1280 y se recorta 100 px arriba: así lo hace la plantilla).
- Audio mono 16 k: `ffmpeg -i VIDEO -vn -ac 1 -ar 16000 "$DEST/audio16k.wav"`.
- Si hay fuente (entrevista o podcast): bájala con `yt-dlp` y su `.srt`, que es para los clips del paso 4. Si hay pizarra de
  `pizarra-youtube-f100k`, copia sus imágenes a `DEST/_remotion/public/img/`.

### 1. Transcribir el crudo
```bash
uv run --python 3.12 "$SK/scripts/transcribir.py" "$DEST/audio16k.wav" "$DEST/w2"
```
Deja `DEST/w2/audio16k.json`. Va siempre **sin contexto entre ventanas** (`condition_on_previous_text False`): con contexto,
Whisper puede entrar en bucle y repetir una frase 200 veces. En los huecos con ruido inventa «Gracias», «Amén» o «¡Suscríbete!»:
eso es ruido, no voz.

### 2. Corte fino (en este orden, sin saltarse nada)
1. **Tramos a mano** (`DEST/tramos.json`, `[[ini, fin], …]` en segundos del crudo). Lee la transcripción como alguien que la
   escucha: de dos intentos queda el último completo; fuera arranques en falso, susurros que lee para sí, frases que no llevan a
   nada y pedacitos de ruido.
   - Para ubicar un borde, transcribe ventanas chicas del crudo (`transcribir.py … --desde a --hasta b`) y mira el perfil de
     energía (`astats` cada 0,04 s). Whisper funde las retomas («va… va a» sale como «va a»), así que no te fíes de sus tiempos por palabra.
2. **Corte fino**: `PALABRAS="$DEST/w2/audio16k.json" uv run --no-project --python 3.12 --with numpy python -X utf8 "$SK/scripts/corte_fino2.py" VIDEO "$DEST/corte" "$DEST/tramos.json"`
   (crea antes `mkdir -p "$DEST/corte"`).
   - Umbral `-36 dB`, margen 0,05 s al cerrar y **0,09 s antes de que arranque la palabra**.
   - Si la voz viene muy baja (mide con `ebur128`; por ejemplo −33 LUFS), −38 dB deja respiraciones y −34 dB se come las consonantes suaves.
3. **Bordes contra el audio**: `uv run --no-project --python 3.12 --with numpy python -X utf8 "$SK/scripts/bordes.py" "$DEST/audio16k.wav" "$DEST/corte/edl.json" -40`.
   - Cada `FIN … voz después` que NO sea un corte a propósito es una palabra mocha: alarga ese tramo hasta el silencio real
     (RMS < −46 dB durante 0,08 s).
   - Los `INICIO/FIN` en cortes de retoma son esperables.
4. **`uv run --no-project --python 3.12 --with numpy python -X utf8 "$SK/scripts/revisar_uniones.py" VIDEO "$DEST/corte/edl.json"`.** Lo que marque, se escucha con una transcripción de 2 s alrededor.
5. **Auditoría por grupos**: `uv run --python 3.12 "$SK/scripts/auditar.py" "$DEST/audio16k.wav" "$DEST/corte/edl.json" "$DEST/corte/aud.txt"`. Léelo ENTERO.
6. **Auditoría en ventanas de 3 s** sobre el corte (`transcribir.py` con `--desde i*3 --hasta i*3+3.4` sobre el audio del corte).
   Así salen las repeticiones que las otras dos pasadas no ven. Los finales repetidos entre ventanas son solapamiento, no error.
7. Repite 1–6 hasta que no quede nada. Recién ahí se transcribe el corte para `words.json`
   (`_remotion/public/words.json` = `[{"w", "s", "e"}, …]`, sale de aplanar los `words` de la transcripción) y se copia el
   video cortado a `_remotion/public/cut.mov`.

### 3. Imágenes reales
- **Cuadros de la fuente**: `ffmpeg -ss T -i fuente.mp4 -vframes 1`, más las capturas de la pizarra.
- **Capturas web**: `node "$SK/scripts/capturas_web.mjs" "$DEST/_remotion/public/web" lista.json` (Chrome sin ventana, 1440×900;
  `lista.json` = `[["nombre", "url"], …]`). 🔴 Google bloquea el navegador automático y devuelve «sorry»; **usa Bing**
  (`bing.com/news/search?q=…&setlang=es` y `bing.com/images/search?q=…`) y Wikipedia. Recorta a la zona útil con
  `ffmpeg -vf crop=…` y anota dónde cae el titular para el círculo rojo (coordenada relativa 0–1).
- **Logos oficiales**: SVG de Wikimedia Commons por API (`commons.wikimedia.org/w/api.php?action=query&titles=File:<nombre>.svg&prop=imageinfo&iiprop=url`).
- Todo va a `_remotion/public/{img,web}/`, copiado (no enlazado: el bundler de Remotion no sigue enlaces).

### 4. Clips de la fuente
- Momentos de 2–10 s donde el protagonista dice lo que la persona cuenta, ubicados con el `.srt`.
- Se recortan con `ffmpeg -ss -to` → `1920×1080`, 30 fps, AAC 48 k, con fundido de 0,06 s al final, a `_remotion/public/clips/`,
  y **se verifican transcribiéndolos**: los tiempos del SRT fallan por 0,3–1 s.
- Subtítulos en español: traducción fiel, en `SUBS` del plan. Se meten como segmentos del plan (`INS`) después de la frase que
  los presenta. Quién habla y dónde lo dijo van en `FUENTE` (rótulo arriba a la izquierda del clip).
- Si una sección no tiene voz de la persona, se arma con título + clips seguidos.

### 5. Plan (`_remotion/plan.py`)
Escribe `DEST/_remotion/plan.py` partiendo de `$SK/ejemplo/plan_ejemplo.py`: deja las funciones y el final, y reescribe las
secciones con las frases de este video. Todo se ancla a frases con `find("frase")`, nunca a segundos. Pon `CARA` (dónde está su
cara en el lienzo 1920×1280: mídela en un cuadro), `FUENTE` y `MARCA` (de su `mi-marca.md`).

| Pieza | Para qué | Duración |
|---|---|---|
| `hook` | 0–7 s, palabras con la voz + `line2` | hasta el fin de la 1.ª idea |
| `title` | cada sección («Noticia 0N») | 3 s (o `hold` con `solid` si no hay voz) |
| `papel(frase, hasta, lines, cards, layout)` | escena a pantalla completa: texto que entra con la voz (`~clave` en el color de clave) + capturas en tarjeta (`circle`, `phone`, `plain` para logos). `layout` L/R/C | lo que dura la idea |
| `word(frase, chica, GRANDE, color)` | palabra clave sobre la toma, al costado libre | 2,4–4 s |
| `lst` · `three` · `chain` | listas que se acumulan (`~~tachado~~`, MAYÚSCULA = clave en el acento) | lo que dura la enumeración |
| `photo` | captura en tarjeta al costado | 3,5–4,5 s |
| `estructura` · `slides` | gráficos propios en papel (flujo de un video largo, antes/después de un carrusel); sus textos están en `plantilla/src/Main.tsx` (`PASOS`): cámbialos si el video habla de otra cosa | — |
| `hold` | pantalla sostenida sin voz («tómale captura») | 2,5–3,2 s |

- El script recorta lo que va al costado cuando entra algo a pantalla completa, avisa de los huecos de más de 5 s (`DEBUG=1`
  muestra qué se dice en cada hueco) y arma los punch-in 1.0/1.14 en los saltos de corte (mínimo 2,5 s entre cambios).
- Papel: el texto de la columna se achica solo para caber en 760 px. Con una sola captura, la tarjeta se agranda (hasta 1020 px).

### 6. Revisar y renderizar
```bash
cd "$DEST/_remotion" && uv run --no-project --python 3.12 python -X utf8 plan.py
node scripts/stills.mjs revN 12.3          # un cuadro por llamada (en lote a veces falla) → out/revN/
node scripts/render.mjs out/<nombre>_vN.mp4   # en segundo plano, ~10 min para 8 min de video
```
- La primera vez baja el navegador de render (unos minutos): córrelo en segundo plano y espera, no lo cortes.
- Antes de renderizar todo, saca cuadros de cada `papel` (al final de la escena) y de 3–4 palabras, y míralos en una hoja.
- Audio: normaliza la toma a −16 LUFS (`highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=9`) y los clips a −17 LUFS ANTES del render.
  Comprueba con `ebur128` que el final quede en ~−17 LUFS.
- Hoja final: `ffmpeg -vf fps=1/10,scale=320:-1,tile=8x7`. Copia a `DEST/<NOMBRE>_vN.mp4` y ábrelo (`open` en Mac, `start ""` en Windows).

## Entrega
- Di qué cambió respecto de la versión anterior, qué se cortó (con las frases) y lo que no se pudo verificar (por ejemplo, que
  no escuchaste el video entero).
- Deja las versiones anteriores en la carpeta para comparar.
- Pendiente siempre: el visto bueno de la persona y la miniatura (`miniatura-youtube-formula100k`, si la tiene).

## Gotchas
- `O(tc)` (corte → salida): una frase que cae justo en el punto de inserción de un clip queda DEBAJO del clip; el plan ya usa
  `<` estricto, pero revisa la tabla de solapes si mueves inserciones.
- Whisper puede encimar palabras sobre una frase que quitaste («La tercera» sobre «Noticia 2»): verifica el ancla de los títulos con un cuadro.
- `Script` (manuscrita) hereda el color: pon `color` en el contenedor (blanco sobre la toma, azul o negro sobre el papel).
- `renderStill` en lote a veces falla con `Frame NaN`: saca los cuadros de a uno.
- En Windows, `nuevo.mjs` enlaza el motor con un «junction» (no pide permisos de administrador). Si algo lo borra, vuelve a correr `nuevo.mjs`.

## Archivos
```
youtube-notitas-f100k/
├── SKILL.md
├── package.json              al instalar corre scripts/preparar.mjs (motor de render en plantilla/)
├── scripts/                  preparar.mjs · nuevo.mjs · transcribir.py · corte_fino2.py · bordes.py · revisar_uniones.py · auditar.py · capturas_web.mjs
├── plantilla/                Remotion: src/Main.tsx (la composición), scripts/render.mjs y stills.mjs, public/fonts (Inter y Nothing You Could Do, OFL), public/sfx
└── ejemplo/plan_ejemplo.py   plan completo de un video de noticias, para copiar las funciones y el formato
```
