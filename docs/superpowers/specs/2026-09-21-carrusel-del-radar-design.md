# Carrusel del radar — diseño

Fecha: 21-sep-2026 · Rama: `feat/carrusel-del-radar` · Estado: diseño para aprobar

## Qué es

Una skill nativa de OpenClaw, `carrusel-del-radar-f100k`, que convierte lo que trae el radar del agente
en un carrusel con la calidad del recetario F100K y lo publica en el Instagram de la usuaria, con dos
✅ suyos por Telegram en el camino. Es una **orquestadora**: no reescribe el método de ninguna skill,
encadena las que ya están en el canal y guarda el estado entre un ✅ y el siguiente.

## Decisiones tomadas (21-sep, con Andrea)

| Pregunta | Decisión |
|---|---|
| Autonomía | Siempre pide ✅. Nunca publica solo. |
| De dónde sale el tema | De los radares que el agente ya corre (noticias y temas). |
| Qué pieza | Recetario: elige la ficha por objetivo (no el noticiero). |
| Cómo salen las imágenes | Mixto: slides en HTML → PNG; solo la portada lleva fondo de Gemini (motor C: fondo IA sin texto + texto en HTML). |
| Dónde va el ✅ | Doble: primero sobre el guion, después sobre las slides renderizadas. |
| Cómo se implementa | Skill orquestadora + `estado.json` por carrusel (sin Lobster por ahora). |

## Dónde vive

- `openclaw/nativas/carrusel-del-radar-f100k/SKILL.md` — carpeta nueva para skills que solo existen en
  OpenClaw (no tienen versión de Claude Code en `skills/`).
- `scripts/build_openclaw.py` copia `openclaw/nativas/*` igual que ya copia `openclaw/puente/*`.
  La validación existente se le aplica completa (bloque «🦞 Corriendo en OpenClaw», sin rutas de Mac,
  sin secretos, sin «vos», sin nombrar el origen del método).
- Es genérica: usa `USER.md` y `cerebro/` de quien la instale. Nada de la marca, el handle ni la palabra
  de CTA de Andrea dentro de la skill.

## El flujo

Cada carrusel abre `entregables/carruseles/AAAA-MM-DD-<slug>/` con un `estado.json`. **Lo primero que
hace la skill en cualquier invocación es buscar un `estado.json` sin cerrar** y retomar desde ahí. Así, un
✅ que llega 6 horas después sigue el hilo.

### Paso 0 · Chequeo (no gasta nada)

Comprueba, sin imprimir llaves: `node`, Chrome en `CHROME_PATH` o rutas de Linux, `puppeteer-core`
instalado en `skills/carrusel-formatos-f100k/`, `GEMINI_API_KEY` presente, conexión de Instagram en
Composio (acción `INSTAGRAM_POST_IG_USER_MEDIA`). Si algo falta, **un solo mensaje** con la primera línea
diciendo qué falta y cómo arreglarlo, y se detiene. Falta Chrome ⇒ «te falta Su taller».
Falta Instagram ⇒ sigue igual, pero el último paso entrega el paquete para subir a mano.

### Paso 1 · Tema

1. Busca el informe de radar más reciente de las últimas 72 h en `informes/` (radar-tendencias,
   radar-virales, radar-contenido o el de noticias).
2. Si no hay, corre `radar-tendencias-f100k` en modo corto.
3. Si la usuaria mandó «carrusel de X» por Telegram, ese tema manda sobre el radar.
4. Elige **un** tema y guarda por qué (señal del radar + fuente). Cifras o hechos solo con la fuente que
   trae el radar; lo que no tenga fuente no entra al guion.

### Paso 2 · Ficha

Lee `skills/carrusel-formatos-f100k/references/catalogo.md` y elige la ficha por objetivo (alcance,
guardados, seguidores, venta), como hace la skill. **Restricción del modo automático:** solo fichas que se
fabrican sin material que ella tenga que mandar:

- Sí: las de plantilla (`split`, `papel`, `datos`) y las G de HTML libre sin capturas.
- Solo si hay fotos en `cerebro/fotos/`: `garabato` y las que llevan su foto.
- Nunca en automático: casos de éxito, capturas reales, fichas con su cara generada por IA.
  Si el tema pide una de esas, lo propone en el ✅1 y espera el material.

Referencia de la ficha: solo la que trae el catálogo ya mirada. Nunca una nueva por caption.

### Paso 3 · Guion + caption

Método de `carrusel-viral-formula100k` con el prompt de la ficha. Reglas duras del guion:

- Titular de cada slide ≤ 35 caracteres o 2 líneas. Si no cabe, se corta el copy, no la letra.
- CTA con la palabra clave de `USER.md`/`cerebro/` (1-2 sílabas), repetida antes del cierre. Si no hay
  palabra definida, la pregunta en el ✅1.
- Caption completo con el CTA, sin cifras sin fuente.

### ✅1 · Telegram

Un mensaje: tema + por qué, ficha elegida + por qué, guion slide por slide, caption, costo estimado
(~US$0,10 por la portada). Opciones numeradas: `1. ✅ así` · `2. cambia <qué>` · `3. otra ficha` ·
`4. descártalo`. Estado → `esperando_ok_guion`.

### Paso 4 · Render

- Slides: `spec.json` (plantilla) o `carrusel.html` (HTML libre) → `build.js` de carrusel-formatos.
  Fuentes con Google Fonts; nunca `-apple-system`. PNG 1080×1350 a escala 2.
- Portada: fondo de Gemini (sección 3.1 del puente), sin texto en la imagen; el titular va en HTML encima.
  Se anota el gasto en `informes/gasto-imagenes.md`.

### Paso 5 · Revisión (compuerta, bloqueante)

1. Avisos de `build.js`: `⚠ no-cabe` / `⚠ letra-chica` ⇒ acorta el copy y vuelve a renderizar.
   `⚠ fuente` / `⚠ imagen` ⇒ no se entrega.
2. **Mira cada PNG**: texto cortado, tildes y eñes, cuadritos en lugar de emoji, cara tapada,
   contraste, líneas cruzando el texto.
3. Máximo 2 vueltas de corrección. Si sigue fallando, avisa qué slide y por qué, y no manda nada roto.

### ✅2 · Telegram

Los PNG como **documento** (no como foto, para que no se compriman), en orden, + el caption final.
Opciones: `1. ✅ publícalo` · `2. corrige la slide N: <qué>` · `3. guárdalo sin publicar`.
Estado → `esperando_ok_slides`.

### Paso 6 · Publicar

Con la skill `publicar-ig`, vía Composio:

1. `INSTAGRAM_GET_IG_USER_CONTENT_PUBLISHING_LIMIT` (si se pasó del límite, avisa y no publica).
2. PNG → JPEG (Instagram solo acepta JPEG).
3. Un contenedor por slide con `image_file` + `is_carousel_item: true` (Composio sube el archivo a una
   URL pública temporal: **no hace falta repo público**).
4. Contenedor padre `media_type: CAROUSEL` con `children` + `caption` (los `#` van como `%23`).
5. `INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH` ⇒ manda el link del post. Estado → `publicado`.

Sin Instagram conectado: manda los JPEG + caption listos para subir a mano. Estado → `entregado_a_mano`.

## `estado.json`

```json
{
  "paso": "esperando_ok_guion | esperando_ok_slides | publicado | entregado_a_mano | descartado",
  "creado": "2026-09-22T08:00:00-05:00",
  "tema": { "titulo": "", "por_que": "", "fuente": "", "radar": "informes/..." },
  "ficha": { "id": "F17", "por_que": "", "motor": "plantilla:datos | html-libre" },
  "guion": [ { "slide": 1, "texto": "" } ],
  "caption": "",
  "slides_png": [],
  "gasto_usd": 0.10,
  "vueltas_revision": 0,
  "post_url": null
}
```

Un solo carrusel abierto a la vez: si hay uno esperando ✅, la corrida del cron le recuerda en una línea y
no abre otro.

## Disparo

Automatización de OpenClaw **lunes y jueves 8:00** (zona de `USER.md`), creada con ✅. Bajo demanda:
«hazme un carrusel de X» o «corre el carrusel del radar».

## Costo

Portada Gemini 2K ≈ US$0,10 (precio verificado el 20-sep). Slides en HTML: gratis.
2 carruseles por semana ≈ US$0,85 al mes. El radar corre igual que hoy.

## Fuera de alcance

Historias, reels, carrusel noticiero, Lobster, radar-formatos (necesita IG con login), publicar sin ✅.

## Cómo se prueba

1. `python3 scripts/build_openclaw.py` verde + `scripts/check-fugas.sh` limpio.
2. Ensayo en la Mac con la skill construida: un tema real → ficha de plantilla y otra de HTML libre →
   `build.js` → mirar los PNG. Sin publicar.
3. En Bigotito (lo corre Andrea): primera corrida con «ensayo, no publiques» hasta el ✅2.
4. Primera publicación real, con Andrea mirando.

## Lo que tiene que hacer Andrea (desde aquí no se puede)

1. Actualizar a Bigotito: `openclaw skills update --all` + reiniciar (SSH o la automatización del lunes).
2. «Su taller» hecho en el servidor (Chrome + `npm install` en carrusel-formatos).
3. Confirmar que Instagram está conectado en el Composio de Bigotito.
4. Pegarle el mensaje que crea la automatización de lunes y jueves.
