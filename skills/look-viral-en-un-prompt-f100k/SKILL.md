---
name: look-viral-en-un-prompt-f100k
description: Le pone a una toma hablada a cámara (vertical) uno de dos looks virales de edición, con un solo prompt y sin editor - «palabra detrás de ti» (una palabra gigante va DETRÁS de la persona, arriba en contorno transparente y abajo en cursiva con degradé que se escribe letra por letra cuando la dices, más subtítulos chicos) y «línea minimalista» (fondo negro, la persona en blanco y negro con halo de luz, figuras de línea blanca que se dibujan solas y una frase chica en serif, alternando con pantallas solo de línea). Recorta a la persona cuadro por cuadro, transcribe palabra por palabra, elige las palabras que pegan y renderiza el MP4 con el audio original, todo local y gratis. Usar cuando digan «ponle el look de palabra detrás», «texto detrás de mí», «la palabra gigante detrás de la cabeza», «subtítulos transparentes que se mueven con mis palabras», «estilo línea minimalista», «fondo negro con líneas blancas», «en blanco y negro con halo», «el look de los videos de storytelling minimalistas», «look viral en un prompt», «edítame este video con uno de los estilos» o pasen una toma vertical pidiendo uno de estos looks. NO usar para cortar silencios o muletillas (editor de video), para animaciones sin persona, ni para carruseles.
---

# Look viral en un prompt

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Dos looks de edición que se ven en reels virales, aplicados a TU toma con un solo pedido.

| Estilo | Cómo se ve | Cuándo usarlo |
|---|---|---|
| `palabra` · **Palabra detrás de ti** | Tu toma a color. Una palabra gigante aparece DETRÁS de tu cabeza en dos líneas: arriba en contorno transparente y abajo en cursiva con degradé que se escribe letra por letra justo cuando la dices. Subtítulos chicos a la altura del pecho. | Reels con energía, listas, consejos rápidos. Lo que dices pide una palabra que se quede pegada. |
| `linea` · **Línea minimalista** | Fondo negro. Tú en blanco y negro con un halo de luz alrededor. Figuras de línea blanca (círculo, péndulo, esfera, flor, espiral, reloj, barra) que se dibujan solas y una frase chica en serif. Cada tanto, una pantalla negra solo con la figura mientras tu voz sigue. | Reflexiones, storytelling, frases que quieres que pesen. |

## Qué necesita la toma
- Vertical (si no lo es, se recorta al centro a 9:16).
- Una sola persona, fondo que se distinga de ella y luz pareja: el recorte sale mejor.
- Para `palabra`: deja algo de aire arriba de tu cabeza. La palabra vive ahí.

## 🧰 EN TU COMPU

Esta skill viaja en el módulo de Edición y corre igual en Mac y en Windows (en Windows, desde la terminal de Git Bash que usa
Claude Code). Todo es local y gratis: no usa llaves ni cuentas.

- **Programas:** Node 18 o más nuevo, `ffmpeg` y `uv` (Mac: `brew install ffmpeg uv` · Windows:
  `winget install -e --id Gyan.FFmpeg` y `winget install -e --id astral-sh.uv`). No tiene `package.json`: no hace falta
  `npm install`. La primera vez, `node scripts/look.mjs --preparar` (o el primer video) deja lo demás solo: Python 3.12 aislado
  en `~/.cache/look-viral-env` con MediaPipe, OpenCV y Pillow, y el modelo de recorte (~16 MB) en `~/.cache/look-viral-models`.
- **Transcripción:** en Mac con chip Apple, mlx-whisper (lo baja uvx la primera vez); en Windows y Mac Intel, faster-whisper
  (más lento: usa el procesador). También puedes pasar tu transcripción con `palabras.py CARPETA --json archivo.json`.
- **Tu marca:** los colores del degradé (`colores` del config) salen de `~/Documents/mi-contenido/mi-marca.md` (o su manual
  `mi-marca/marca.md`). Si no hay, quedan los de fábrica y le preguntas en una línea si quiere los suyos.
- **Tu negocio:** si el video lleva CTA, la palabra sale de `~/Documents/mi-contenido/mi-negocio.md`; no inventes regalos ni cifras.
- **Dónde guardar:** por defecto la carpeta `look-<video>` queda junto al video. Si la persona no dice otra cosa, usa
  `~/Documents/mis-videos-editados/look-<nombre>/` como CARPETA (tercer argumento; en Windows, la carpeta Documentos de su usuario).

## Flujo (lo que hace Claude cuando se lo piden)

Toma la ruta del video y el estilo. Si no dicen estilo, pregunta en una línea cuál de los dos (o `ambos`).

**1. Preparar y sacar el plan automático**
```bash
node scripts/look.mjs "RUTA/VIDEO.mov" plan palabra     # o: plan linea
```
Deja todo en `RUTA/look-VIDEO/`: `base.mp4` (la toma a 1080x1920, 30 cuadros), `mascara.mp4` (la silueta),
`palabras.json` (cada palabra con su segundo) y `config-<estilo>.json` (un primer plan automático).
Tarda más o menos lo mismo que dura la toma.

**2. Afinar el plan (aquí está el «prompt»: esto es lo que vuelve bueno el resultado)**
Lee `palabras.json` y reescribe `config-<estilo>.json` con criterio. El plan automático solo elige las palabras
más largas; tú eliges las que **pegan**.

Para `palabra`:
- Un golpe cada 1,5 a 3,5 s. Nunca más de un golpe por frase y nunca uno de menos de 0,8 s.
- `arriba` = 1 o 2 palabras chicas que preparan (contorno). `abajo` = LA palabra que se queda (cursiva). Juntas se leen como una frase: «todos los / trucos», «tus / muletillas», «5 / minutos».
- `abajo_en` = el segundo en que dices la palabra de abajo (sale de `palabras.json`): ahí empieza a escribirse.
- Corta en minúsculas, sin puntuación, de 4 a 12 letras en `abajo`. Las palabras largas se achican solas.
- Deja respirar: tramos sin golpe están bien (los subtítulos siguen).
- Corrige lo que Whisper oyó mal (marcas, nombres) en `palabras.json` antes de renderizar: de ahí salen los subtítulos.

Para `linea`:
- Escenas que cubren toda la toma, sin huecos (`hasta` de una = `desde` de la siguiente).
- Una escena `linea` (pantalla negra con figura) cada 2 o 3 escenas `persona`, de 1,5 a 3 s, sobre frases que no necesitan tu cara.
- `frase` = 2 a 6 palabras en minúsculas que resumen lo que dices, no la transcripción entera.
- Elige la figura por lo que se dice: tiempo → `reloj` o `pendulo`, foco → `circulo`, idea grande → `esfera`, crecer → `flor`, proceso → `espiral`, avance → `barra`. No repitas figura seguida.
- En escenas `persona`, una figura chica arriba a la derecha es opcional (`"figura": "circulo"`).

**3. Renderizar**
```bash
node scripts/look.mjs "RUTA/VIDEO.mov" palabra     # o: linea · ambos
```
Salida: `look-VIDEO/palabra-detras.mp4` o `look-VIDEO/linea-minimal.mp4`, con el audio original.

**4. Mirar antes de entregar (obligatorio)**
Saca una hoja de cuadros en los segundos de 4 o 5 golpes o escenas y léela:
```bash
cd RUTA/look-VIDEO && for s in 1 3 6 9 12; do ffmpeg -loglevel error -y -ss $s -i palabra-detras.mp4 -frames:v 1 -vf scale=300:-1 c_$s.jpg; done && ffmpeg -loglevel error -y $(for s in 1 3 6 9 12; do echo -i c_$s.jpg; done) -filter_complex hstack=5 hoja.jpg
```
Revisa: que la palabra de abajo se lea (al menos dos tercios), que la cabeza la tape un poco y no del todo,
que el recorte no deje manchas, que las frases no choquen con las figuras.
Si algo falla, ajusta el config (abajo) y vuelve a correr el paso 3: el recorte y la transcripción ya no se repiten.

## El config, campo por campo

`config-palabra.json`
```json
{
  "estilo": "palabra",
  "subtitulos": true,
  "colores": ["#ffb067", "#ff6fa8", "#b38cff"],
  "golpes": [
    {"desde": 0.72, "hasta": 2.36, "arriba": "todos los", "abajo": "trucos", "abajo_en": 1.88},
    {"desde": 16.9, "hasta": 19.9, "arriba": "tus", "abajo": "muletillas", "abajo_en": 18.08, "tam": 0.9}
  ]
}
```
| Campo | Qué hace |
|---|---|
| `desde` / `hasta` | Segundos en que se ve el golpe |
| `arriba` | Línea en contorno transparente (puede ir vacía) |
| `abajo` | Línea en cursiva con degradé, se escribe letra por letra |
| `abajo_en` | Segundo en que empieza a escribirse (cuando la dices) |
| `tam` | Escala del texto (1 = normal) |
| `y` | Fija la altura de la línea de abajo en píxeles (si no, se calcula sola para que se lea al menos el 60 %) |
| `legible` | Cuánto de la palabra tiene que verse (0,6 por defecto). Súbelo a 0,8 si la cabeza tapa demasiado |
| `colores` | Degradé de la cursiva (global o por golpe). Usa los colores de tu marca si los tienes |
| `subtitulos` | `false` para quitar los subtítulos chicos |

`config-linea.json`
```json
{
  "estilo": "linea",
  "halo": 0.55,
  "escenas": [
    {"desde": 0, "hasta": 2.36, "modo": "persona", "frase": "todos los trucos"},
    {"desde": 4.7, "hasta": 7.0, "modo": "linea", "figura": "esfera", "frase": "haz esto"}
  ]
}
```
| Campo | Qué hace |
|---|---|
| `modo` | `persona` (tú en blanco y negro sobre negro) o `linea` (pantalla negra con figura) |
| `figura` | `circulo`, `pendulo`, `esfera`, `flor`, `espiral`, `reloj`, `barra` |
| `frase` | Texto chico en serif (arriba a la izquierda en `persona`, centrado en `linea`) |
| `halo` | Fuerza del brillo alrededor de la persona (0 a 1) |

Ejemplos completos en `ejemplos/`.

## Problemas comunes
- **La palabra queda tapada casi entera:** sube `legible` a 0,8 o fija `y` más arriba (menos píxeles). Si la cabeza llena el cuadro, graba un poco más lejos.
- **El recorte se come los dedos cuando mueves rápido la mano:** es el desenfoque de movimiento. Graba con más luz.
- **Manchas sueltas alrededor:** el recorte ya borra islas chicas; si queda alguna, es algo pegado a ti (respaldo, cojín). Cambia el fondo.
- **Whisper escribe mal un nombre:** corrígelo en `palabras.json` o vuelve a transcribir con `--pista "TuMarca, TuNombre"`.
- **Quiero los dos estilos en el mismo reel:** renderiza `ambos` y únelos por tramos en tu editor.

## Archivos
- `scripts/look.mjs`: el comando único (prepara, recorta, transcribe, planifica, renderiza), igual en Mac y en Windows
- `scripts/recortar.py`: silueta de la persona cuadro por cuadro (MediaPipe, local)
- `scripts/palabras.py`: transcripción palabra por palabra (mlx-whisper o faster-whisper)
- `scripts/plan.py`: primer plan automático
- `scripts/estilo_palabra.py` / `scripts/estilo_linea.py`: los dos looks
- `fuentes/`: Instrument Serif, DM Serif Display y Poppins (licencia OFL, se pueden usar en cualquier video)
