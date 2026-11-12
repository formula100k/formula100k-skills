---
name: edicion-girlie-f100k
description: "Edición Girlie — el estilo nativo de TikTok de «amiga que te cuenta» con una capa de chistes y series encima. (A) HABLADO a cámara: corte pegado sin aire, UNA palabra a la vez en letra redonda gruesa color crema arriba de la cabeza (la posición sale sola) y «ventanitas» con pruebas reales ancladas a la palabra que las nombra. Capa creativa opcional: sello de serie (título-sticker que se repite en cada capítulo), memes reales, notas escritas a mano, zooms secos en el chiste, blanco y negro, viñeta, brillos y garabatos. (B) VLOG/POV: tomas cortas pegadas con el texto nativo de TikTok fijo arriba. 0 créditos, todo local (macOS). Activar con «edición girlie», «edítalo girlie», «edita esto estilo TikTok», «una palabra a la vez», «con memes y sello de serie», «edita el capítulo de mi serie», «vlog con texto de TikTok», «POV con texto arriba». NO es para videos animados sin cara."
argument-hint: <video o clips> [hablado|vlog]
---

# Edición Girlie

`K` = la carpeta de esta skill (`~/.claude/skills/edicion-girlie-f100k`). La guía del estilo está en
`K/referencia/GUIA-ESTILO.md` (léela la primera vez). Ejemplo de plan en `K/ejemplo/plan-ejemplo.json`.

**La idea:** que no parezca editado. Grabación con el celular en casa, y encima solo lo justo: una palabra a la vez,
pruebas reales y, en cada chiste, UNA intervención. Si el video es parte de una serie, lleva su sello.

**Antes de empezar:** busca su brandkit como dice `K/references/tu-brandkit.md`. Si lo tiene, sus colores van en el
sello de serie y en las notas; la palabra crema y la letra redonda se quedan (son la firma del estilo) salvo que
ella pida su letra.

## ¿Qué formato?
- Alguien hablando a cámara (consejo, opinión, reseña, haul, «te enseño mis…») → **A · hablado**.
- Tomas de la vida real con una situación (POV, día conmigo, algo que pasó) → **B · vlog**.
- GRWM o vlog donde además habla → arma las tomas con B (sin `--texto`) y después pásalo por A.

## Requisitos
macOS con `ffmpeg`, `uv` y `whisper-cli` (whisper.cpp) con un modelo en `~/.cache/whisper-cpp/` (large-v3 o small).
Si falta algo, instálalo con Homebrew (`brew install ffmpeg uv whisper-cpp`) y avisa en una línea.

## A · Hablado

### 1. Corte
Si existe la skill `editor-video-formula100k`, sigue su `PROTOCOLO-CORTE.md`. Si no: quita silencios, muletillas y
frases repetidas. El estilo pide **cero aire** (220–260 palabras por minuto). Sin zooms entre cortes.

### 2. Plan (`plan.json` junto a las imágenes)
Lee la transcripción y marca dos cosas:
1. **Ventanitas:** cada vez que se **nombra algo que se puede mostrar** (una persona o cuenta, una app, un producto,
   una página) va su prueba real. Una cada 5–8 s, de 1,5 a 4 s cada una.
2. **Chistes y sorpresas** (capa creativa, opcional): en cada remate, reacción o momento de drama, UNA intervención.

```json
{
  "corregir": {"Cloud": "Claude"},
  "sello": {"archivo": "sello.png", "desde": 0, "hasta": 4, "al_final": 2},
  "ventanitas": [
    {"palabra": "Alexia", "archivo": "alexia.png", "tipo": "recorte", "pos": "der", "dur": 2.5},
    {"palabra": "perfil", "archivo": "captura_perfil.png", "tipo": "captura", "pos": "izq", "dur": 3},
    {"palabra": "viral", "archivo": "clip.mp4", "tipo": "clip", "pos": "centro", "dur": 3, "inicio_clip": 2},
    {"palabra": "muerte", "archivo": "meme.jpg", "tipo": "meme", "pos": "izq", "y": 0.22, "dur": 1.2}
  ],
  "notas":   [{"palabra": "75", "texto": "¡¿75?!", "lado": "der", "dur": 1.2}],
  "zooms":   [{"palabra": "completamente", "escala": 1.25, "dur": 0.9}],
  "efectos": [{"palabra": "muerte", "tipo": "bn", "dur": 1.0},
              {"palabra": "decisión", "tipo": "vineta", "dur": 1.6},
              {"palabra": "cientos", "tipo": "brillos", "dur": 1.5},
              {"palabra": "logré", "tipo": "garabatos", "dur": 1.6}]
}
```
Todo se ancla a una **palabra** (`palabra` + `ocurrencia` si se repite), así sobrevive a cualquier recorte. `desde`
en segundos solo para el arranque.

**Ventanitas** (`tipo`):
- `recorte`: persona u objeto sin fondo; sale desde abajo, alto 45 %. Para quitar el fondo:
  `swift K/scripts/recortar.swift foto.jpg salida.png`.
- `captura`: tarjeta plana con esquinas apenas redondeadas, 45 % del ancho, sobre el torso.
- `clip`: video en recuadro, 42 % del ancho.
- `meme`: imagen de chiste, real (un meme conocido, una foto, la captura de un comentario), chica y quieta; puede ir
  arriba a un costado de la cabeza (`y` 0,15–0,30).
- `pos`: `izq` · `centro` · `der`. Nada tapa la cara ni la palabra.
- Capturas de verdad (el perfil real, la app real, la tienda real), nunca íconos ni mockups inventados.

**Capa creativa:**
- **Sello de serie** (título-sticker que se repite en cada capítulo):
  `uv run --with pillow python3 K/scripts/sello_serie.py "el título|*la clave" --color "#E8A33D" --acento "#7B5CD6" --contador "1/5" --out sello.png`.
  La línea con `*` sale más grande. Mientras está el sello no hay palabra: hace de gancho de la serie. Usa el MISMO
  sello y colores en todos los capítulos; solo cambia el contador.
- **Notas**: lo que piensa y no dice («hola :)», «plot twist», «¿quién fue?»), escrito a mano al lado de la cara.
  Máximo 3–4 palabras.
- **Zooms**: punch-in SECO a la cara (1,2–1,4×, 0,5–1 s), solo en la reacción o el remate.
- **Efectos**: `bn` (drama, algo salió mal) · `vineta` (suspenso) · `brillos` (algo lindo o nuevo) · `garabatos`
  (celebración).
- **Una cosa a la vez** y como máximo una cada ~4 s. Si no hay chiste, no hay intervención.
- Filtros de cara (ojos y boca deformados) y sonidos de chiste: se ponen en la app de TikTok al subir.

### 3. Montaje
```
uv run --with pillow python3 K/scripts/edicion_girlie.py hablado corte.mp4 --plan plan.json --out final.mp4
```
- La primera pasada transcribe y deja `final.palabras.json`. **Léelo**: corrige nombres en `"corregir"` del plan
  (o edita el JSON) y vuelve a montar con `--palabras final.palabras.json` (no transcribe de nuevo).
- La palabra se centra sola arriba de la cabeza (mira la cara). Si avisa que la cabeza llega muy arriba, dile que la
  próxima vez grabe con más aire arriba; mientras, sirve `--y 300`.
- `--mayus` para la variante de «tips» en MAYÚSCULA. `--tam` cambia el tamaño (80 por defecto).
- Gancho de texto opcional: un PNG transparente de 1080x1920 con `--gancho g.png --gancho-hasta 2`.

### 4. Revisar antes de entregar
```
ffmpeg -i final.mp4 -vf "fps=2,scale=216:-1,tile=10x6" -frames:v 1 hoja.jpg
```
Mira la hoja: ¿la palabra se lee arriba sin tocar el pelo? ¿Nada tapa la cara? ¿Cada ventanita sale con la palabra que
la nombra? ¿Cada intervención cae en un chiste de verdad? ¿El sello no se encima con nada? Arregla y repite.

## B · Vlog / POV
```
uv run --with pillow python3 K/scripts/edicion_girlie.py vlog t1.mov t2.mov t3.mov \
   --texto "Le pedí a mi asistente el contenido de la semana y esto pasó" --emojis "😭🫶" \
   --max 2.5 --rotulo "0-2|7:00 am|Lunes de grabación" --out final.mp4
```
- Las tomas se pegan en el orden que las pasas; `--max` deja cada una en N s. Tomas de 1,5–3 s.
- **El texto** cuenta una situación con conflicto, en 1–3 líneas, y termina en tensión («… y aún no viene nadie»).
  El remate es la reacción a cámara de la última toma, no el texto.
- Los virales de este formato duran 5–15 s. Si quiere un audio en tendencia, se pone en la app al subir.

## Reglas
- Tutea y usa español neutro. Nada tiembla ni rebota: todo entra y sale con corte seco.
- Sin efectos de sonido agudos (pitidos, campanas, clics).
- Si el video cierra con un llamado, usa una palabra ligada al tema.
- De las referentes se copia la mecánica, nunca sus frases, sus temas ni sus sellos.

## Entrega
En la carpeta del video: `final.mp4`, `plan.json`, `final.palabras.json` y la hoja. Ábrele el video.
