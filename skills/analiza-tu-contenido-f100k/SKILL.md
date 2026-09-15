---
name: analiza-tu-contenido-f100k
description: Hace el módulo «Analiza tu Contenido» de FÓRMULA 100K completo sobre la cuenta de la alumna y lo entrega en UNA infografía imprimible (La Hoja del Mes). Baja y transcribe sus últimos 30 Reels, lee las estadísticas del panel «Ver insights» (del Chrome logueado o de capturas de pantalla), etiqueta formato · ángulo · propósito, lee los 5 filtros y declara el filtro tapado, corona moldes (ORO/CHATARRA → repetir · confirmar · matar) y ángulos, deja hechas las preguntas para que la alumna solo marque, reparte el 60/30/10 inclinado, escribe las conclusiones y arma el calendario del mes con acta y la apuesta con 4 ganchos. Usar SIEMPRE que digan «analiza mi contenido», «analiza mi cuenta del mes», «hazme la hoja del mes», «lee mis filtros», «cuál es mi filtro tapado», «haz el informe de mis 30 reels», «llena el tablero por mí», «analiza tu contenido», o manden su @ con capturas de insights. NO usar para auditar la cuenta de OTRA persona sin sus estadísticas (analizador-perfiles-formula100k), ni para desglosar UN video (analisis-video-viral-f100k).
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
3. **Las estadísticas del panel**, por el camino más fácil que tenga (ofrécelos en este orden):
   - **A · Chrome logueado (lo más fácil):** tú abres «Ver insights» de cada Reel con `claude-in-chrome` y lees los números. Ella no hace nada. (El puente de cookies de agent-browser lo bloquea el clasificador: usa claude-in-chrome.)
   - **B · Capturas:** desde la app, en cada Reel → «Ver estadísticas», 1 o 2 capturas por Reel. Pídeselas en una carpeta. Ver `references/capturas.md` para qué debe salir en cada captura.
   - **C · Solo retención e intención por capturas** y el resto por A. Es la mejor combinación: el panel web no da retención ni el desglose de intención.

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
`compartidos`, `seguidores_nuevos`, `likes`, `comentarios` y, si hay: `retencion_3s` (= 100 − tasa de
omisión), `duracion_media` (s), `visitas_perfil`, `toques_enlace`, `dms`.
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
Lee `resultado.json` entero antes de escribir nada: `tapado`, `filtros`, `ranking`, `engañoVistas`,
`formatos` (veredictos), `angulos` (coronas), `reparto.cubetas`, `encuesta.sirve`.

## PASO 5 — La lectura (`lectura.json`): lo único que redactas

Esquema en `references/esquema.md`. Contenido:

- **resumen**: una frase, en tú, con el filtro tapado y la consecuencia.
- **videos**: por Reel `{ gancho: primera frase LITERAL del transcript, idea: de qué va en ≤10 palabras }`.
- **preguntas** (6 a 9), hechas para que ella solo marque Sí / No / No sé:
  - `tipo: "hipotesis"`: un patrón que VES en los transcripts de ORO vs CHATARRA y los números no explican (cómo abren, cuánto tardan en decir el tema, si nombran al desconocido, si piden algo…). Cada una con `porque` (lo que viste), `evidencia` (números de Reel) y `destino` (qué cambia en el calendario si dice que sí).
  - Si `resultado.encuesta.sirve` es true, agrega 2 `tipo: "encuesta"` ya redactadas para su audiencia: la de **lenguaje** (abierta: «Cuéntame con tus palabras qué estás intentando resolver con…») y la de **objeción**. Si es false, ninguna: el motor ya explica por qué.
  - Prohibido: «¿de qué quieres que hable?» y A/B de cosas que no va a hacer.
- **conclusiones** (máx. 3): `{ titulo, texto, evidencia }`. La primera siempre es el filtro tapado. Otra, lo que las vistas coronaban y el filtro no (`engañoVistas`).
- **aplicacion**:
  - `calendario`: exactamente `reparto.piezas` filas; REPETIR/VARIAR/APOSTAR = `reparto.cubetas`. REPETIR solo con formatos de veredicto REPETIR (si no hay ninguno, usa CONFIRMAR y dilo en `por_que`). Nunca un formato MATAR. VARIAR cambia UNA sola variable. APOSTAR = formato nuevo de `references/formatos.json` que ella no haya usado. Cada fila: `semana, tema, formato, angulo, proposito, de_donde_sale, filtro_que_ataca, por_que, evidencia`. Temas concretos de SU nicho, sacados de sus transcripts.
  - `campana`: solo si hay ángulo de Venta coronado (`{ frase: "[ángulo] + hasta el DÍA + lo que se pierde", detalle }`). Si no, `sin_campana` con el porqué. La campaña va en REPETIR, nunca en APOSTAR.
  - `apuesta`: `{ formato, por_que, tasa_mediana: mediana de tasa_conv del lote, ganchos: { A claim de texto, B gancho visual, C conflicto, D prueba } }`.
  - `esta_semana`: 3 acciones concretas, con verbo, para los próximos 7 días.

Estilo: frases cortas, en tú, sin «el algoritmo», sin promesas de viralidad.

## PASO 6 — Armar y entregar

```bash
node ~/.claude/skills/analiza-tu-contenido-f100k/scripts/render.mjs --datos datos.json --lectura lectura.json --salida hoja-del-mes.html
```
Sale un HTML completo que se abre con doble clic. Para publicarlo como Artifact, agrega `--artifact` (el visor pone su propio esqueleto).
- Salida 2 = el validador encontró contradicciones: corrige `lectura.json` y vuelve a correr. No uses `--forzar` salvo que ella lo pida.
- El informe trae 4 vistas: **📋 La clase** (el método explicado con esquemas y los números de la cuenta: El mapa · Los 5 filtros · Etiquetar y coronar · Preguntar · Decidir), **📊 Mi hoja** (la infografía + anexos), **🃏 Flashcards** (8) y **✅ Examen** (5 casos). Abre en Mi hoja; para una clase o un ejemplo para enseñar, agrega `--vista clase`.
- Mira el informe UNA vez (screenshot) antes de entregarlo.
- Publícalo como Artifact si tienes la herramienta (queda privado y lo puede compartir con su equipo); si no, entrégale el archivo: se abre con doble clic sin internet y el botón «Imprimir o guardar PDF» saca la hoja en carta horizontal.
- En el chat, 5 líneas máximo: filtro tapado, el formato a repetir, el que se mata, y la primera acción de la semana.

## Cada mes

Guarda `datos.json` del mes. El mes siguiente, pasa `ventanas: { base: [...], mes: [...] }` con los
Reels del mes anterior como línea base. A los 3 meses tiene su curva: ese histórico es el verdadero entregable.
