---
name: clips-que-venden-f100k
description: "Use when someone asks to investigar referencias de clips, procesar ideas de clips con links, escribir clips sin voz, armar el mes de clips o editar/renderizar un clip con sus tomas. Método de clips virales sin hablar (texto arriba + toma callada + copy con palabra clave). Trae 2 carriles, 5 esqueletos de ritmo, 21 moldes con vistas reales, banco de tomas y set. Investiga viendo el video cuadro por cuadro y midiendo vistas con Apify, escribe cada clip completo y renderiza el borrador 9:16 con texto en pantalla, tarjetas y tiempos exactos. Frases: «tengo ideas de clips», «procesa estas referencias», «hazme un clip de…», «edita mi clip», «renderiza mis tomas», «caza formatos de humor», «arma mis clips del mes». NO es para reels hablados, carruseles ni historias."
argument-hint: "[investigar|escribir|editar|mes] + links, idea o carpeta de tomas"
metadata: {"openclaw": {"emoji": "🦞"}}
---

## 🦞 Corriendo en OpenClaw

> Esta versión corre en un agente OpenClaw (servidor + Telegram), no en Claude Code.
> **Antes de seguir, lee la skill `f100k-puente`**: traduce herramientas y rutas.
> Lo específico de esta skill:
>
> - Perfil: guarda `references/perfil.md` lleno en `cerebro/clips-perfil.md` y léelo de ahí; la primera vez, las 6 preguntas van una por mensaje en Telegram.
> - `investigar.sh` usa cookies de Chrome para bajar de Instagram: en el servidor no hay Chrome. Baja el mp4 con el `videoUrl` que devuelve Apify (`apify~instagram-scraper`, solo con `APIFY_TOKEN`) y sigue con las hojas de cuadros y whisper igual.
> - Sin `APIFY_TOKEN` no hay vistas reales: dilo en la primera línea y no des ninguna referencia por validada.
> - `render_clip.py` necesita ffmpeg y Pillow. Manda el BORRADOR.mp4 y la hoja `_preview.jpg` por Telegram y espera ✅ antes de dar el clip por terminado.

---

# Clips que venden · sin hablar

Un clip = **toma callada + texto arriba + música en tendencia + copy con el valor y una palabra clave**. Esta skill cubre el ciclo completo: investigar referencias, escribir el clip, editarlo en borrador y sumarlo a tu lista.

## 0 · Perfil (solo la primera vez)
Si `references/perfil.md` dice `[PERFIL NO CONFIGURADO]`, **no escribas clips todavía**. Hazle estas 6 preguntas, una por mensaje, y llena el archivo con sus respuestas (borra la marca al terminar):
1. ¿Cuál es tu rubro y qué vendes, en una frase?
2. ¿Quién es tu clienta ideal y qué 3 situaciones de su día le dan risa o rabia?
3. ¿Cómo hablas: tú, usted o vos? ¿Hay palabras que nunca dices?
4. ¿Qué números reales puedes mostrar? (tu reel con más vistas, tu mediana, seguidores, resultados con permiso)
5. ¿Qué palabras clave usas en tus CTA y qué regalo manda cada una? Si no tienes, anota «pendiente»: el clip cerrará con «guárdalo».
6. ¿Qué formato ya te funcionó (tu carril A) y cómo es tu escritorio o set?

## Antes de cualquier modo, lee
- `references/metodo.md`: la receta, los carriles, los 5 esqueletos, la duración, el set, los planos, el banco de tomas, el texto en pantalla y qué medir.
- `references/perfil.md`: su rubro, su voz, sus números reales, sus palabras clave con CTA y su carril A.
- `references/moldes.md` cuando haya que elegir título.
- `references/investigacion.md` en los modos INVESTIGAR y CAZAR.

Carpeta de trabajo por defecto: `~/CLIPS/<AAAA-MM-DD>_<slug>/`. Si ella da otra, se usa la suya.

## Elige el modo por lo que pide
| Pide… | Modo |
|---|---|
| Pega links / «procesa estas ideas» / «fíjate qué me gusta» | **1 · INVESTIGAR** → luego 2 · ESCRIBIR → 5 · A LA LISTA |
| «Caza formatos», «qué está pegando en humor» | **1b · CAZAR** → 2 |
| «Hazme el clip de X», «escribe 5 clips» | **2 · ESCRIBIR** |
| Manda tomas / carpeta / «edita», «renderiza» | **3 · EDITAR** |
| «Arma el mes de clips» | **4 · MES** → 5 |
| Primera vez / perfil vacío | **0 · PERFIL** |

---

## 1 · INVESTIGAR (links que ella manda)
1. Corre `scripts/investigar.sh <carpeta>/refs <url1> <url2> …`. Si yt-dlp falla por login, pídele que abra Instagram en Chrome y reintenta. Si sigue fallando, usa `videoUrl` de Apify para bajar el mp4.
2. Saca las vistas reales con Apify (`apify~instagram-scraper`, directUrls, resultsLimit 1). Toma `videoPlayCount`, `commentsCount`, `videoDuration` y `ownerUsername`, y ponlos en `fichas.md`.
3. **Abre con Read cada `sheet_<id>.jpg`** y cruza con `cortes_<id>.txt` y `tx/<id>.txt`. Llena «qué es de verdad» en cada ficha: tomas, dónde va el texto y cuándo cambia, si habla, cómo cierra. No concluyas nada solo por el caption.
4. Clasifica cada una: molde + esqueleto + sabor (tranqui / humor de oficio / hablado).
5. **Lee lo que le gusta:** busca qué se repite en el conjunto y dilo con números (cuántas de N, rango de vistas, duración, si hablan). Anótalo en perfil.md como «Hacia dónde va mi gusto».
6. Sigue con el modo 2 para cada idea.

## 1b · CAZAR (referencias nuevas)
Sigue la Entrada B de `references/investigacion.md`: hashtags de oficios cross-niche, filtro de al menos 500 mil vistas y 20 s o menos, y los 10 mejores vistos con `investigar.sh`. Solo cuenta como formato si aparece en 2 o más nichos. Entrega una tabla (molde · referencia · vistas · dura · qué es de verdad) y propón cuáles pasar al modo 2.

## 2 · ESCRIBIR (un clip o varios)
Para cada clip entrega esta ficha. Siempre con este formato:

```
### [n] · [molde] · palabra: [PALABRA]
Referencia: [@cuenta · vistas reales · duración] (o «molde propio»)
Texto en pantalla:
[línea 1]
[línea 2 / remate / «lee el copy 👇»]
Ritmo: [esqueleto + segundos exactos: cuándo entra cada texto, cuánto dura cada escena o tarjeta, fin]
Toma: [T1–T14 / CARA / nueva: descríbela en una línea]
Imagen: [tarjetas o capturas REALES que van encima, o «ninguna»]
Copy:
[4–8 líneas en minúsculas con el valor]

[CTA exacto de perfil.md]
```

Reglas de escritura:
- Adapta la mecánica y no el tema (ver «Cómo se pasa una referencia» en investigacion.md).
- El texto va en minúsculas, máximo 3 líneas y un emoji al final. Una palabra de color con `*así*` si carga la promesa.
- El copy cumple lo que promete el texto. Nada de «en este video te voy a enseñar».
- Solo cifras de perfil.md o las que ella dé. Si falta un número, pon `[tu número real]` y pídelo.
- Una palabra clave por clip, sin repetir la misma dos clips seguidos.
- Respeta la forma de hablar de perfil.md (tú/usted/vos) y sus palabras prohibidas.
- Si el clip lo pide, di qué toma nueva hay que grabar y agrégala al banco en metodo.md.

## 3 · EDITAR (borrador listo)
Entrada: sus tomas (archivos o carpeta) + la ficha del clip (del modo 2 o de su lista).
1. Mira las tomas: `ffprobe` para la duración y una hoja de cuadros (`ffmpeg -i toma.mov -vf "fps=1,scale=240:-2,tile=6x3" -frames:v 1 hoja.jpg`) abierta con Read. Elige los segundos útiles de cada una: acción limpia, sin mirar al lente, sin cortes torpes.
2. Si hay tarjetas o capturas, que sean reales: pídeselas, o hazlas en HTML/PNG (tablas, fichas blancas, 2 columnas) con PIL o HTML + captura. El meme de 3 etapas se hace con un generador de imágenes a partir de su foto, o dibujado simple, nunca con caras de memes ajenos.
3. Escribe `clip.json` en la carpeta del clip, traduciendo el «Ritmo» de la ficha a segundos:
```json
{"salida": "BORRADOR.mp4", "formato": "9:16", "exposicion": -0.05,
 "tomas": [{"archivo": "T5.mov", "desde": 3.2, "hasta": 11.0}],
 "textos": [{"texto": "el mejor momento para *grabar* tus reels", "desde": 0, "hasta": 7.8, "y": 0.18, "tamano": 50, "letra": "sans"},
            {"texto": "lee el copy 👇", "desde": 5, "hasta": 7.8, "y": 0.27, "tamano": 40}],
 "tarjetas": [{"imagen": "captura.png", "desde": 2, "hasta": 6, "modo": "encima", "y": 0.58, "ancho": 0.82}]}
```
   - `formato: "16:9"` pone el video horizontal al centro con franjas; el título va en la franja de arriba (y ≈ 0,18).
   - `modo: "completa"` = tarjeta a pantalla entera sobre fondo liso (esqueleto 2).
   - `velocidad: 2` en una toma la acelera (útil para grabaciones de pantalla largas).
   - Exposición: -0,05 a -0,1 para el sabor tranqui; 0 para humor de oficio.
4. Renderiza: `python3 <carpeta de esta skill>/scripts/render_clip.py <carpeta>/clip.json --preview`.
5. **Mira `BORRADOR_preview.jpg` con Read** y además saca 2 o 3 cuadros a tamaño real en los momentos de cambio de texto. Revisa que:
   - el texto no tape la cara;
   - nada quede en el 20 % de abajo;
   - el texto se lea;
   - la duración sea la del esqueleto.
   Si algo falla, ajusta el json y vuelve a renderizar.
6. Entrega la ruta del `BORRADOR.mp4`, la duración y el copy listo para pegar. Recuérdale que la música en tendencia se pone al subirlo en Instagram (el borrador sale sin audio a propósito).
7. Si ella pide ajustes (tiempos, tamaño, letra, posición), edita solo `clip.json` y vuelve a renderizar. No repitas todo el proceso.

## 4 · MES (plan de 4 semanas)
- 7 clips por semana (o los que ella pueda): 2 del carril A y el resto del carril B.
- Mezcla los esqueletos. Nunca van dos clips seguidos con el mismo molde ni con la misma palabra.
- Todas las tomas de una semana deben salir de una sola sesión de 40 minutos. Lista qué grabar.
- Pon la revisión a las 2 semanas (metodo.md, «Qué medir»).

## 5 · A LA LISTA
Guarda cada ficha en la lista que diga perfil.md (si no tiene, crea `~/CLIPS/LISTA-DE-CLIPS.md` y ve sumando ahí, con la fecha y una casilla «subido»).

## No hagas
- Dar una referencia por buena sin haber visto sus cuadros, o creerle a unas vistas que no salieron del scraper.
- Inventar cifras en el texto o en el copy: tiempos, dinero, seguidores o resultados.
- Meter voz en off, subtítulos animados palabra por palabra o texto en el 20 % de abajo.
- Usar capturas de stock o caras de memes ajenos.
- Publicar en Instagram. La skill entrega el borrador y ella sube.
