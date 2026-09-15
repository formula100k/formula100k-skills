---
name: analiza-tu-contenido-f100k
description: Hace el módulo «Analiza tu Contenido» de FÓRMULA 100K sobre la cuenta de la alumna y lo entrega en La Hoja del Mes (infografía imprimible). Baja y transcribe sus últimos 30 Reels, lee sus estadísticas básicas (Chrome logueado) y pide las avanzadas por captura de la app (retención y actividad en el perfil), lee los 5 filtros y el filtro tapado, corona moldes y ángulos, saca 3 conclusiones fijas (formato ganador, ángulo que más viraliza y posible ángulo de venta, aterrizados a su tema) y arma el calendario pieza por pieza con ángulo exacto, gancho, estructura, CTA y Reel de referencia. Usar SIEMPRE que digan «analiza mi contenido», «hazme la hoja del mes», «lee mis filtros», «cuál es mi filtro tapado», «haz el informe de mis 30 reels», «analiza tu contenido», o manden su @ con capturas de insights. NO usar para auditar la cuenta de OTRA persona sin sus estadísticas (analizador-perfiles-formula100k) ni para desglosar UN video (analisis-video-viral-f100k).
---

# Analiza tu Contenido — La Hoja del Mes

La alumna NO llena hojas de cálculo. Tú haces el recorrido completo y ella solo **revisa y marca**.
Todo lo que lee va en **tú** (nunca vos).

## La regla que no se rompe

**El motor pone los números; tú solo etiquetas y redactas.** Nunca calcules a mano una mediana, un
porcentaje, un ORO o un veredicto: todo sale de `scripts/motor.mjs`. Si escribes una conclusión con
un número, cópialo del `resultado.json`. El validador de `render.mjs` rechaza lo que contradiga al motor.

Nada inventado: si un número no está en el panel, queda **sin dato** (ni pasa ni se tapa). Si un Reel
no tiene voz, se etiqueta por lo que se ve y se dice.

## El método en 3 momentos (así se explica siempre)

| Momento | Pregunta | Estaciones | Sale |
|---|---|---|---|
| **Diagnostica** | ¿Dónde se tapa? | 1 Leer los 5 filtros | tu filtro tapado |
| **Descifra** | ¿Qué lo explica? | 2 Etiquetar · 3 Coronar · 4 Preguntar | tus moldes ganadores y el porqué |
| **Decide** | ¿Qué hago el mes que viene? | 5 Repartir · 6 Presionar · 7 Apostar | el calendario con acta |

**Los 5 filtros** = el recorrido de alguien que no te conoce. Cada uno deja pasar a menos gente; se leen
en orden y se para en el primero tapado:
1 **Alcance** ¿Te vieron fuera de tu casa? · 2 **Retención** ¿Se quedaron viendo? · 3 **Valor** ¿Les sirvió
tanto como para guardarlo o mandarlo? · 4 **Conversión** ¿El que llegó de afuera quiso quedarse? ·
5 **Intención** ¿Te buscaron para lo que ofreces?

Vocabulario fijo: «filtro tapado» (nunca «dial roto»), «pasa», «sin dato», «no se lee».

---

## PASO 0 — Pide solo 3 cosas

1. Su **@ de Instagram**.
2. **Propósito del mes** (Experimentación · Crecimiento · Nutrición · Venta) y **cuántas piezas** publica al mes. Si no sabe, Crecimiento y 12.
3. **Las estadísticas, en dos partes. Pide SIEMPRE las dos:**
   - **Básicas** (vistas, % de no seguidores, guardados, compartidos, seguidores nuevos): **A · Chrome logueado**, tú abres «Ver insights» de cada Reel con `claude-in-chrome` y lees los números; ella no hace nada. (El puente de cookies de agent-browser lo bloquea el clasificador.) Si no hay Chrome, salen de sus capturas.
   - **Avanzadas, por captura desde la app del teléfono** (el panel del computador NO las trae): **Retención** (tasa de omisión + tiempo de visualización promedio → filtro 2) y **Actividad en el perfil** (visitas al perfil + toques en enlaces → filtro 5). Sin ellas los filtros 2 y 5 quedan sin dato y el ángulo de venta sale «posible». Pídeselas con el mensaje de `references/capturas.md`, que dice qué se tiene que ver en cada captura.
   - Mínimo para leer un filtro: **5 Reels de «este mes» y 5 de la línea base** con ese dato (el motor no lee con menos). Si no puede con los 30, que empiece por esos 10: los más recientes y, en la base, los que queden en ORO y CHATARRA. Si todavía no tienes el corte, corre primero el motor con las básicas y usa `calidadDatos.avanzadas[].prioridad`.
   - Si no las manda, sigue igual, pero dilo: el informe muestra el bloque «Tu data» con la lista de Reels a capturar, y «esta semana» tiene que incluir capturarlas (el validador lo exige).

Si tiene menos de 9 Reels o menos de 30 días publicando: no sigas. Díselo con la frase «esto todavía es anécdota, no data» y cuándo volver.

## PASO 1 — Bajar y transcribir los 30 Reels

Carpeta de trabajo: `~/Documents/ANALIZA-TU-CONTENIDO/<handle>-<AAAA-MM>/` con `reels/`, `portadas/`, `transcripts/`.

- **Lista de Reels** (code, fecha, caption, duración, portada): con claude-in-chrome en la pestaña Reels del perfil.
  Probado el 15-sep-2026: `web_profile_info` da 429 y `/api/v1/clips/user/` devuelve HTML. Lo que SÍ funcionó:
  repetir la consulta GraphQL que usa la pestaña (`PolarisProfileReelsTabContentQuery_connection`) y pedir cada
  Reel a `/api/v1/media/<PK>/info/` con el header `x-ig-www-claim`. Si falla 3 veces, `apify/instagram-reel-scraper`
  (avisa que cuesta centavos).
- **Videos**: `yt-dlp "https://www.instagram.com/reel/<code>/"` sin cookies (los Reels públicos bajan sin fallar).
  La herramienta de Chrome bloquea URLs firmadas en su salida: no intentes sacar `video_versions` por ahí.
- **Portadas** a ~320 px (`sips -Z 320`). **Transcripción**: `whisper <video> --model small --language es --output_format txt`.
  Whisper alucina con música: texto repetitivo o sin sentido ⇒ `sin_voz: true`.
- **Nunca etiquetes un Reel que no bajaste.** El caption no es prueba.

## PASO 2 — Números del panel → `datos.json`

Por Reel, en `metricas` (números crudos, sin formato): `vistas`, `pct_no_seguidores`, `guardados`,
`compartidos`, `seguidores_nuevos`, `likes`, `comentarios` y, de las capturas avanzadas: `retencion_3s` (= 100 − tasa de
omisión), `duracion_media` (s), `visitas_perfil`, `toques_enlace`, `dms`.
Lee cada captura con Read (es una imagen) y copia el número tal cual; si la captura está cortada o no se lee, ese dato queda `null`.
**No llenes** `valor_1000`, `tasa_conv` ni `intencion`: las calcula el motor.

Ojo: en el panel web, «Actividad en el perfil» NO es intención (en la cuenta medida era idéntica a
«Seguidores nuevos»). Si solo tienes ese agregado, deja la intención sin dato.

Esquema completo en `references/esquema.md`. Ejemplo con los 30 Reels de una cuenta real (sin enlaces ni textos) en `ejemplo/datos-ejemplo.json`.

## PASO 3 — Etiquetar (estación 2)

Por cada Reel, leyendo SU transcript y mirando su portada:
- **formato** = el MOLDE, con el `nombre` exacto de `references/formatos.json` (186 de la Biblioteca). Si ninguno encaja, descríbelo con palabras de mecánica, nunca de tema. «Rutina de mañana» es tema; «lista numerada con captura sobreimpresa» es formato.
- **angulo** = desde dónde lo agarra (Error común, Dolor concreto, Contraintuitivo, Método, Detrás de escena, Creencia, Prueba / resultado, Objeción, Comparación, Opinión, Curiosidad, Lista abierta…). Usa siempre el mismo nombre para el mismo ángulo: la recurrencia depende de que coincidan.
- **proposito** = Experimentación · Crecimiento · Nutrición · Venta.

Guárdalo en `posts[].etiquetas` de `datos.json`. Normaliza nombres antes de seguir: dos grafías del mismo formato parten su recurrencia en dos y matan el veredicto.

## PASO 4 — Correr el motor

```bash
node ~/.claude/skills/analiza-tu-contenido-f100k/scripts/render.mjs --datos datos.json --solo-motor resultado.json
```
Lee `resultado.json` entero antes de escribir nada: `calidadDatos` (qué falta y qué capturar primero), `tapado`, `filtros`, `ranking`, `engañoVistas`,
`formatos` (veredictos), `angulos` (coronas), **`conclusionesFijas`**, `medianas`, `reparto.cubetas`, `encuesta.sirve`.

### Las 3 conclusiones fijas (las elige el motor, salen en TODOS los informes)

| Conclusión | Regla del motor | Si no alcanza |
|---|---|---|
| **Formato ganador** | veredicto REPETIR (pueden ser varios) | el mejor CONFIRMAR, marcado «candidato» |
| **Ángulo que más te ayuda a viralizar** | todos los Reels agrupados por ángulo; gana la mayor mediana de **% de no seguidores** | «pista» si solo 1 Reel quedó en el cuarto de arriba; «patrón» con 2+ |
| **Posible mejor ángulo de venta** | el ángulo de Venta coronado; si no, mayor mediana de **intención**; sin intención, de **conversión** | con conversión se dice «posible» y se pide capturar la sección Perfil |

Un ángulo compite solo con 2+ Reels y tiene que ganarle a la mediana de la cuenta. Nunca cambies el
ganador ni lo «corrijas» con tu criterio: si no te convence, dilo en el texto, pero el nombre es el del motor.

## PASO 5 — La lectura (`lectura.json`): lo único que redactas

Esquema en `references/esquema.md`. Contenido:

- **resumen**: una frase, en tú, con el filtro tapado y la consecuencia.
- **videos**: por Reel `{ gancho: primera frase LITERAL del transcript, idea: de qué va en ≤10 palabras }`.
- **preguntas** (6 a 9), hechas para que ella solo marque Sí / No / No sé:
  - `tipo: "hipotesis"`: un patrón que VES en los transcripts de ORO vs CHATARRA y los números no explican (cómo abren, cuánto tardan en decir el tema, si nombran al desconocido, si piden algo…). Cada una con `porque` (lo que viste), `evidencia` (números de Reel) y `destino` (qué cambia en el calendario si dice que sí).
  - Si `resultado.encuesta.sirve` es true, agrega 2 `tipo: "encuesta"` ya redactadas para su audiencia: la de **lenguaje** (abierta: «Cuéntame con tus palabras qué estás intentando resolver con…») y la de **objeción**. Si es false, ninguna: el motor ya explica por qué.
  - Prohibido: «¿de qué quieres que hable?» y A/B de cosas que no va a hacer.
- **conclusiones_fijas**: `{ formato, angulo_viral, angulo_venta }`, cada una `{ texto, evidencia }`. Solo explicas el PORQUÉ del ganador que eligió el motor, mirando sus transcripts: qué tienen en común esos Reels (cómo abren, a quién le hablan). 2–3 frases. Si es «pista», «candidato» o «posible», dilo y di qué lo confirma.
  - `angulo_viral` y `angulo_venta` llevan además **`angulo_especifico`**: la categoría del motor **aterrizada al tema** de los Reels que la hicieron ganar (sus `referencias`, leyendo `videos[n].idea` y los transcripts). Es el titular de la tarjeta, así que ≤110 caracteres.
    - Mal: «Curiosidad». Bien: «Curiosidad de cómo generar contenido viral en automático con Claude».
    - Mal: «Método». Bien: «Método paso a paso para que Claude te haga el trabajo pesado: anuncios, landings y visuales».
    - Parte SIEMPRE de la categoría del motor (el validador lo exige). El tema sale del Reel que más empuja la mediana; si los otros Reels del ángulo hablan de otra cosa, dilo en `texto`, no lo mezcles en el titular.
    - En el calendario, las piezas con ese ángulo usan ESE tema en su `angulo_exacto`, no solo la categoría.
- **conclusiones** (máx. 3, se muestran como «Otras conclusiones»): `{ titulo, texto, evidencia }`. La primera siempre es el filtro tapado. Otra, lo que las vistas coronaban y el filtro no (`engañoVistas`). No repitas las fijas.
- **aplicacion**:
  - `calendario`: exactamente `reparto.piezas` filas; REPETIR/VARIAR/APOSTAR = `reparto.cubetas`. REPETIR solo con formatos de veredicto REPETIR (si no hay ninguno, usa CONFIRMAR y dilo en `por_que`). Nunca un formato MATAR. VARIAR cambia UNA sola variable. APOSTAR = formato nuevo de `references/formatos.json` que ella no haya usado. Temas concretos de SU nicho, sacados de sus transcripts.
    El ángulo que viraliza y el de venta **tienen que aparecer** en el calendario (el validador lo exige). Con filtro tapado 1 o 2, el que viraliza va en la mayoría de REPETIR; el de venta, en al menos una pieza de Nutrición o Venta.
    Cada fila se tiene que poder grabar sin adivinar:
    | Campo | Qué va |
    |---|---|
    | `semana`, `dia` | 1–4 y Lun/Mié/Vie (o su ritmo) |
    | `tema` | el título de la pieza |
    | `formato`, `angulo`, `proposito`, `de_donde_sale`, `filtro_que_ataca` | los nombres exactos del motor |
    | `angulo_exacto` | la frase del ángulo aplicada a ESTE tema («El dolor de publicar todos los días y seguir igual»), no la categoría |
    | `gancho` | la primera frase literal que dice |
    | `texto_pantalla` | (opcional) el rótulo del segundo 1 |
    | `estructura` | 3–6 pasos siguiendo la `anatomia` del formato en `references/formatos.json`, ya escritos con su tema |
    | `cta` | literal. No repitas la misma palabra clave en dos piezas |
    | `referencia` | `{ post: n, que_copiar }` = un Reel SUYO: en REPETIR, uno del mismo formato (el validador lo exige), preferible el de ORO; `que_copiar` dice qué movimiento concreto se copia. En APOSTAR, `{ biblioteca: "<formato>", que_copiar }` (el informe muestra la ficha) |
    | `por_que`, `evidencia` | el acta con los números del motor |
    La meta («funcionó si supera X, tu mediana») la pone el informe con `resultado.medianas`: no la escribas.
  - `campana`: solo si hay ángulo de Venta coronado (`{ frase: "[ángulo] + hasta el DÍA + lo que se pierde", detalle }`). Si no, `sin_campana` con el porqué. La campaña va en REPETIR, nunca en APOSTAR.
  - `apuesta`: `{ formato, por_que, tasa_mediana: mediana de tasa_conv del lote, ganchos: { A claim de texto, B gancho visual, C conflicto, D prueba } }`.
  - `esta_semana`: 3 acciones concretas, con verbo, para los próximos 7 días. Si `calidadDatos` tiene avanzadas incompletas, agrega una 4.ª: capturar esas estadísticas de los Reels de `prioridad` (el validador exige una acción con «captur»).

Estilo: frases cortas, en tú, sin «el algoritmo», sin promesas de viralidad.

## PASO 6 — Armar y entregar

```bash
node ~/.claude/skills/analiza-tu-contenido-f100k/scripts/render.mjs --datos datos.json --lectura lectura.json --salida hoja-del-mes.html
```
Sale un HTML completo que se abre con doble clic. Para publicarlo como Artifact, agrega `--artifact` (el visor pone su propio esqueleto).
- Salida 2 = el validador encontró contradicciones o faltan campos del calendario: corrige `lectura.json` y vuelve a correr. No uses `--forzar` salvo que ella lo pida.
- El informe trae 4 vistas: **📋 La clase** (el método explicado con esquemas y los números de la cuenta: El mapa · Los 5 filtros · Etiquetar y coronar —con el paso E, cómo salen las 3 conclusiones fijas— · Preguntar · Decidir), **📊 Mi hoja** (las 3 conclusiones fijas arriba, la infografía y los anexos; el calendario va en tarjetas por semana y se copia a Sheets con «Copiar el calendario»), **🃏 Flashcards** (10) y **✅ Examen** (5 casos). Abre en Mi hoja; para una clase o un ejemplo para enseñar, agrega `--vista clase`.
- Mira el informe UNA vez (screenshot) antes de entregarlo.
- Publícalo como Artifact si tienes la herramienta (queda privado y lo puede compartir con su equipo); si no, entrégale el archivo: se abre con doble clic sin internet y el botón «Imprimir o guardar PDF» saca la hoja en carta horizontal.
- En el chat, 6 líneas máximo: filtro tapado, formato ganador, ángulo que viraliza, posible ángulo de venta, la primera acción de la semana y, si falta data, qué capturas faltan.

## Cada mes

Guarda `datos.json` del mes. El mes siguiente, pasa `ventanas: { base: [...], mes: [...] }` con los
Reels del mes anterior como línea base. A los 3 meses tiene su curva: ese histórico es el verdadero entregable.
