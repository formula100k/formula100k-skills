---
name: carrusel-formatos-f100k
description: "Router del catálogo de 35 formatos de carrusel de FÓRMULA 100K (20 fichas F con referencia mirada + 15 fichas G de la guía maestra de 25 estilos). Elige el formato por objetivo, escribe el guion con el prompt de la ficha, fija el visual y la referencia, y lo entrega como prompts listos para Gemini, ChatGPT o cualquier chat (3 variantes: desde la descripción, con su marca, solo fondo) o como HTML. Usar cuando se diga \"qué formato de carrusel uso\", \"catálogo de formatos de carrusel\", \"hazme un carrusel tipo [ficha]\", \"carrusel en libreta\", \"carrusel frase partida\", \"carrusel tier list\", \"chuleta en lapicero\", \"carrusel checklist\", \"carrusel de noticias\", \"lo que nadie te dice\", \"carrusel antes y después\", \"carrusel tipo chat\", \"dame el prompt para hacerlo en Gemini/ChatGPT\", \"carrusel estilo bento/recibo/periódico/terminal\"."
metadata: {"openclaw": {"emoji": "🦞"}}
---

## 🦞 Corriendo en OpenClaw

> Esta versión corre en un agente OpenClaw (servidor + Telegram), no en Claude Code.
> **Antes de seguir, lee la skill `f100k-puente`**: traduce herramientas y rutas.
> Lo específico de esta skill:
>
> - El render a PNG (`build.js` + `export.js`) está hecho para una Mac con Chrome. En el servidor, por defecto entrega el camino **«prompts por plataforma»**: el prompt listo para Gemini o ChatGPT de la ficha elegida, con las 3 variantes.
> - Si la usuaria tiene `GEMINI_API_KEY` o un modelo de imagen en OpenRouter, puedes generar las imágenes tú: costo estimado → ✅ → generar → mandar por Telegram.
> - `build.js` y `export.js` buscan Chrome en `CHROME_PATH`, `/usr/bin/google-chrome-stable` o `/usr/bin/chromium` y lanzan con `--no-sandbox`. Úsalos si `node` y `puppeteer-core` están instalados; si fallan, vuelve a los prompts sin insistir.
> - Las fotos de la usuaria están en `cerebro/fotos/`. Skills que menciona y no vienen en este paquete (render, clonador, ilustrado con tu cara): ofrece el prompt equivalente.

---

## 🧰 ANTES DE EMPEZAR (leer antes de seguir: manda sobre lo que diga esta skill más abajo)

Esta skill viaja en el plugin de FÓRMULA 100K y corre igual en Mac y en Windows. Cuando aquí se dice
**«la carpeta de esta skill»** es la carpeta donde está este `SKILL.md` (con el plugin no vive en `skills/`):
`build.js`, `export.js`, `templates/`, `kit/`, `ejemplos/` y `references/` están ahí.

- **Su negocio.** Rubro, avatar y oferta salen de `entregables/`; su forma de hablar, de
  `entregables/`. Léelos antes de escribir. Si no existen, sigue el ANCLAJE DE RUBRO de abajo.
- **Su brandkit, antes que todo lo demás:** primero `mi_brandkit` del conector de Yapper (si el pedido viene de Yapper o el conector está disponible; con varios proyectos, pásale `cuenta`);
  si no, `mi-marca/brandkit.md` en la carpeta del proyecto (sus stickers, en `mi-marca/stickers/`). Trae gancho, subtítulos, elementos de marca, stickers y CTA; los colores y las letras siguen saliendo de su marca (abajo).
  Cómo se aplica en un carrusel: «Su brandkit (antes del flujo)». Si no hay brandkit, sigue con su marca como siempre.
- **Su marca, en este orden:**
  1. `entregables/` (colores, letras, estilo visual, @handle y tono).
  2. Si no está, su manual de identidad visual `mi-marca/marca.md` (dónde buscarlo y cómo leerlo: `references/mi-marca.md`).
  3. Si no hay ninguno, pregunta en UN solo mensaje: «¿Cuál es tu color principal (o un HEX)?, ¿qué letra te gusta (o "no sé")? y ¿cuál es tu @?».
     Mientras no responda, usa los colores que trae cada plantilla o ficha (son neutros) y `@tuhandle`. Ofrece en una línea armar su manual en formula100k.app/identidad-visual.
- **Su marca manda sobre el estilo de esta skill.** El visual de cada ficha, las plantillas y los estilos de la guía maestra son el punto de partida:
  de aquí se toman la composición, el soporte, la jerarquía y el oficio; el color, la letra y el lugar del @ son los suyos, aunque la ficha diga otra paleta.
  Su color principal reemplaza el acento de la ficha y su letra reemplaza la del cuerpo, cuidando contraste y jerarquía. Detalle por paso en «Su marca (antes del flujo)».
- **Sus fotos.** Solo las suyas: búscalas primero en `entregables/` si existe, o pídeselas por su nombre («súbeme 3 fotos tuyas para este carrusel»)
  o pregúntale en qué carpeta las tiene. Nunca uses fotos de muestra, caras inventadas ni las capturas de los ejemplos.
- **Dónde guardar.** `entregables/` (crea la carpeta si no existe). Nunca escribas dentro de la carpeta de esta skill.
- **Tamaño.** Exporta a 1080 × 1350 (`--escala 1`), salvo que pida más resolución.
- **Si falta una cuenta o un conector, no te detengas:** haz la parte que sí se puede y di en una línea qué faltó.
  - Sin herramienta de imagen (Higgsfield, Gemini/Nano Banana, ChatGPT Imágenes) → usa fotos de la persona o fondos en HTML/CSS, y deja el prompt de cada imagen listo para cuando la tenga.
- **Otras skills.** Esta skill nombra otras (`carrusel-render-formula100k`, `banana`, `higgsfield-carrusel-generador`, `capturas-tutorial-formula100k`, `carrusel-ilustrado-formula100k`…). Si una no está instalada, sigue sin ella: fabrica la pieza aquí con **HTML libre** y avisa en una línea.
- **Las capturas de los ejemplos no vienen en el paquete.** Donde el catálogo o los prompts hablan de «referencia anclada» o de una carpeta `referencias/<FICHA>/`, usa la descripción del visual y, si la ficha trae enlace público del ejemplo, ábrelo o pásaselo a la persona.
- **Abrir un archivo o una carpeta:** en Mac `open "<ruta>"`; en Windows `start "" "<ruta>"`.
- **Llaves.** Nunca pidas que peguen una llave o un token en el chat ni los escribas en un archivo de `entregables/`.

---

## 🧭 ANCLAJE DE RUBRO (leer PRIMERO — manda sobre cualquier ejemplo de esta skill)

Esta skill enseña un **método**. El método es agnóstico de industria: sirve igual para
formulación cosmética, nutrición, repostería, fisioterapia, finanzas o jabonería.
Los ejemplos escritos aquí abajo son ilustraciones **del método**, nunca del tema.

**Antes de escribir nada:**

1. Identifica el **RUBRO real** de la persona (léelo de `entregables/`, de su perfil o
   pregúntaselo en una línea si no está claro). Decláralo: *"Rubro: ___"*.
2. Todos los ejemplos, analogías, comparaciones, objeciones, métricas y vocabulario salen
   de **ESE** rubro.
3. Si el rubro **no** es marketing, redes sociales, creación de contenido, ventas online o
   negocios digitales → queda **PROHIBIDO** el vocabulario de ese mundo (reels, algoritmo,
   embudo, lead magnet, engagement, "publicar sin vender", "clientes de alto ticket",
   "escalar tu negocio", "posicionarte como referente"), salvo que la persona lo escriba primero.
4. Si el rubro es **técnico, científico o de oficio**: NO borres el tecnicismo para
   "simplificar". Úsalo y **tradúcelo en su primera mención**. El término preciso ES la
   autoridad de esa creadora; quitarlo borra justo lo que la diferencia.
5. Si no tienes datos suficientes del negocio, dilo y usa marcadores explícitos
   (`[TU OFERTA]`, `[TU RESULTADO]`). **Nunca asumas que el rubro es marketing.**
6. **Perfil de compra.** Si vas a proponer ideas, ángulos, ganchos o un calendario, primero encaja al
   avatar en 1 a 3 perfiles según lo que compra en realidad. Se clasifica por situación, nunca por género:
   principiante perdida → dirección · saturada → simplicidad · sin tiempo → tiempo · escéptica → certeza
   (háblale con prueba) · insegura → confianza (identidad + un paso pequeño) · indecisa → que decidan por
   ella · ambiciosa → acceso y estatus · experta estancada → ventaja · cómoda en su plan B → salir del
   «sigo como estoy» · responsable de otros → tranquilidad. Etiqueta cada idea con **perfil + nivel de
   conciencia + palanca** y reparte las piezas entre perfiles. La urgencia sale de lo que le cuesta seguir
   igual, con datos reales. No nombres el perfil en pantalla: háblale desde su freno.

**El método viaja, el rubro no.** El mismo molde, vestido con rubros distintos:

| Rubro | El mismo molde |
|---|---|
| Cocina | "Así es mi cena favorita para no dormir con el azúcar alta." |
| Relaciones | "5 señales de que estás forzando una relación que ya no funciona." |
| Finanzas | "La principal causa de un divorcio no es una infidelidad." |
| Formulación cosmética | "El conservante decide si tu crema dura tres meses o te da una infección. No el aceite." |
| Jabonería | "Si tu jabón se pone blando a los dos días, no fue el aceite. Fue la sosa." |
| Fisioterapia | "Ese dolor de rodilla al bajar escaleras casi nunca nace en la rodilla." |
| Repostería | "Tu bizcocho se hunde en el centro por la temperatura, no por la harina." |
| Jardinería | "Tu planta no se está muriendo de sed. Se está ahogando." |

Mismo molde en todos; ninguno menciona reels ni embudos. Haz exactamente eso.

---

# Carrusel por formatos · FÓRMULA 100K

Convierte un tema en un carrusel terminado eligiendo **una ficha** y girando 3 perillas:
**MECÁNICA** (qué hace con la atención) → **SOPORTE** (dónde vive el texto) → **MOTOR** (con qué se fabrica).

## Fuentes (léelas, no las copies en esta skill)
| Archivo | Qué trae |
|---|---|
| `references/catalogo.md` | Las **60 fichas**: F01–F20 (referencias miradas) y G01–G40. Mecánicas M1–M49, soportes S1–S50, anatomía, error típico, **prompt de guion** y quién lo fabrica. |
| `references/prompts-por-plataforma.md` | Por ficha: **referencia** (cuenta y enlace del ejemplo, cuando lo hay), **visual detallado** (paleta hex, tipografía, composición por slide) y prompts para Claude Code · HTML en cualquier chat · Gemini · ChatGPT, con variantes A/B/C. |
| `references/grimorio-carruseles.md` | Anatomía completa de los 17 carruseles del Grimorio (G01–G13 + 4 alias). |
| `references/estilos-guia-maestra.md` | Los 25 estilos visuales con su prompt HTML (pieles y soportes S17–S28). |
| `references/plantillas.md` | Formato de `spec.json` de las plantillas y contrato del HTML libre. |
| `references/portada-gancho-visual.md` | La portada que se entiende sin leer: prueba de 1 segundo, tema → imagen, mockups realistas, jerarquía. |
| `references/mi-marca.md` | Cómo encontrar y leer su manual de identidad visual `mi-marca/marca.md`. |
| `kit/` | Kit de scrapbook con textura para HTML libre (instrucciones en `kit/LEEME.md`). |

Los archivos de `references/` los mantiene el equipo de FÓRMULA 100K y llegan con cada actualización del paquete: no los edites.

**Voz:** tuteo siempre (tú, tienes, sube, comenta). Nunca voseo, tampoco en los textos de las slides.

## Su brandkit (antes del flujo)
Búscalo antes que la marca: `mi_brandkit` del conector de Yapper (devuelve su brandkit, su manual y los enlaces de sus stickers); si no, `mi-marca/brandkit.md` con `mi-marca/stickers/`; si no hay ninguno, sigue con «Su marca» y nada más.
Si lo encuentras, va **encima de la ficha elegida**, respetando su composición, su soporte y su jerarquía:
- **Colores y letras:** los de su manual (el que devuelve `mi_brandkit` o el de «Su marca»).
- **Gancho → la portada.** El texto de la lámina 1 sigue su forma de gancho: de 2 a 5 palabras grandes, sin brillo ni degradado.
- **CTA → la última lámina,** con su palabra y su forma de cierre.
- **Elementos de marca** (fondos con patrón, marco, listas con check, secciones numeradas, antes/después, flechas) **y stickers → en las láminas** donde sirvan al contenido, sin tapar el texto ni la foto.
- **Stickers según su modo:** `dibuja` → dibújalos tú según su descripción, con sus colores; `busca` → memes o imágenes reales según `que_buscar`; `propios` → sus imágenes: descarga las URLs de `mi_brandkit` o usa `mi-marca/stickers/`. Nunca inventes stickers que no pidió.
- **El brandkit no pisa el oficio:** fotos y capturas reales antes que emojis o íconos, nada con brillo ni efecto 3D, y la ficha sigue mandando en la estructura.
- **Al terminar,** di en una línea qué aplicaste del brandkit (por ejemplo: «Del brandkit: colores y letras, portada con tu gancho, lista con check, 2 stickers propios y tu CTA»).

## Su marca (antes del flujo)
Búscala en el orden de «ANTES DE EMPEZAR»: primero `entregables/`; si no está, su manual `mi-marca/marca.md` (como dice `references/mi-marca.md`); si no hay ninguno, pregunta.
- **Si encuentras `mi-contenido/mi-marca.md`**, úsalo en todo el flujo sin repreguntar: su color principal, su letra y su @ rellenan los corchetes de marca de los prompts (paso 3) y van en `"handle"`, `"acento"` (split) y `"color"` (garabato) del `spec.json`, o en el `:root` del HTML libre (paso 6). Si su estilo visual coincide con una plantilla (`papel`, `garabato`, `split`, `datos`), inclúyela entre las 3 fichas propuestas si sirve al objetivo.
- **Si solo existe el manual `mi-marca/marca.md`**, úsalo en todo el flujo sin repreguntar:
  - Paso 1: si trae `carruseles.estilo` (`papel`, `garabato`, `split` o `datos`), incluye entre las 3 fichas propuestas una que se fabrique con esa plantilla, si sirve al objetivo. El objetivo manda.
  - Paso 3: rellena los corchetes de marca de los prompts con sus valores exactos (hex de `color.*`, letras `canva` o `google_font`, `firma.usuario`).
  - Paso 6: en `spec.json`, `handle` = `firma.usuario`; `acento` (split) y `color` (garabato) = `color.acento`. En HTML libre, `:root` con `color.lienzo`, `color.tinta`, `color.acento` y `color.segundo`, y sus letras de Google Fonts. Lo que pida el estilo de la ficha (composición, soporte, decoración) se respeta; el color y la letra son los suyos. Portada y cierre cumplen `carruseles.portada` y `carruseles.cierre`.
- **Si no hay ninguno**, pregunta su color y su @ solo cuando haga falta (papel no lleva color propio) y ofrece en una línea armar su manual en formula100k.app/identidad-visual.

---

## Flujo

### 1. Formato
- Si piden una ficha ("tier list", "F07", "tipo chat") → esa ficha.
- Si NO dicen formato → pregunta UNA cosa: **¿qué quieres que haga este carrusel?** y propón **3 fichas** con 1 línea de por qué y su referencia.

| Objetivo | Primero se proponen | También |
|---|---|---|
| Guardado | F07 chuleta · G01 checklist · G19 explicador de tendencia (con bonus) | F18, F04, G05 recursos, G06 glosario, G13 de A a B, G17 hilo de tuits, G18 tabla de ranking, G21 día por día en papel, G29 calendario del mes, G32 inspiración vs. mi versión, G34 principiante vs. pro, G36 una foto nueve publicaciones, G38 lo mismo en 5 niveles, G39 se ven iguales, G40 reto de N días |
| Comentario | F17 tier list · G03 qué tipo eres · G25 yo de antes / yo de ahora | F08, F14, G08 molde, G12 confesión, G10 frases, G16 vitrina de lo que construiste, G18 tabla de ranking, G23 reporte del mes, G26 cliente en evidencia, G28 premios (pide etiquetar), G31 «soy X, obvio Y», G34 principiante vs. pro |
| Compartido | F01 causa y consecuencia · G22 la excusa y lo que no se ve · G10 frases | F19 mapa, G06 glosario, G24 capturas con círculo rojo, G28 premios, G31 «soy X, obvio Y», G33 meme de una imagen, G35 la frase que se escribe sola, G37 un miedo por lámina |
| Tiempo de permanencia | G09 swipe-reveal · F20 collage | G04 lo que nadie te dice, G27 desliza y pasa algo (interactivo), G35 la frase que se escribe sola |
| Seguidor | F07 (slide de seguir) · F10 anáfora · F13 garabatos (post fijado) | F06 |
| Conexión | F11 historia con edades · G20 cosas que me hacen muy yo · G24 capturas que cuentan una historia | F12, G11 errores propios, G12 confesión, G25 yo de antes / yo de ahora, G30 del dibujo a la foto, G37 un miedo por lámina |
| Venta | G07 caso de estudio · G14 antes/después · G15 FAQ en chat | F11, F20, F09, G26 cliente en evidencia, G36 una foto nueve publicaciones |
| Autoridad / actualidad | G02 noticia · G19 explicador de tendencia · G23 reporte de tendencias del mes | F14 hot take, G04 lo que nadie te dice, G18 tabla de ranking |

### 2. Guion
Usa el **prompt de guion** de la ficha (catálogo) con el tema, el nicho y la voz. Respeta la anatomía y evita el error típico.
Si falta un dato real (cifra, caso, historia, pregunta de DM) → pregúntalo. No inventes cifras, casos ni testimonios.
Entrega el guion como tabla slide por slide y **espera el OK** antes de producir.

### 3. ¿Dónde lo va a fabricar?
Pregunta solo si no está claro. Si trabaja aquí, en Claude Code → paso 4. Si la persona trabaja en otra herramienta, o pide "el prompt":
entrégale de `prompts-por-plataforma.md` la sección de esa ficha para **su** herramienta:
- **HTML en cualquier chat** (Claude, ChatGPT o Gemini con Canvas): texto perfecto, gratis. Recomiéndalo si hay más de ~25 palabras por slide.
- **Gemini (Nano Banana)** o **ChatGPT (Imágenes)**: variante **A** desde la descripción (el prompt se sostiene solo: no se adjuntan capturas ni se nombra la cuenta del ejemplo), **B** con su marca, **C** solo fondo sin texto (el texto va después en HTML). Más los prompts «seguir» (slide N) y «arreglar» (una palabra mal escrita).
Rellena tú los corchetes que ya conozcas (texto de la portada, colores de su marca). Si quiere ver el formato funcionando, pásale el link del ejemplo aparte, nunca dentro del prompt.

### 4. Motor en Claude Code
- **A · Fotos + HTML** (gratis, texto perfecto) · **B · Imagen IA** · **C · Híbrido** (fondo IA sin texto + texto en HTML).
- **Regla:** más de ~25 palabras o una lista en una slide → el texto NO se le pide al modelo de imagen → motor C.
- Antes de gastar créditos (B o C) di cuántas imágenes son y pide confirmación.

### 5. ¿Quién lo fabrica?
| Ficha | Se fabrica con |
|---|---|
| F01, F02, F05 | esta skill · `templates/split.html` |
| F04, F06, F07, F08 · G01 (variante papel) · G06 (variante papel) | esta skill · `templates/papel.html` (F06: stickers con `banana`) |
| F13 | esta skill · `templates/garabato.html` |
| F17, F18, F19 | esta skill · `templates/datos.html` (F18 con fondo: `banana`) |
| G01–G06, G08, G09, G10, G12–G15 | esta skill · **HTML libre** con el estilo de su soporte (S17–S28) y el visual de la ficha |
| G07 · G14 con clienta | `carrusel-caso-exito-f100k` (cifras verificadas) |
| G11 · G10 sobre tus fotos | `carrusel-render-formula100k` |
| F03 · G05 (capturas) | `capturas-tutorial-formula100k` + esta skill o `carrusel-render-formula100k` |
| G16 · G17 | `capturas-tutorial-formula100k` (capturas o grabaciones reales) + esta skill · **HTML libre** S29 (fondo plano + pantalla en marco) o S27 (tuit) |
| G18 | esta skill · `templates/datos.html` (tabla S16, máx. 4 columnas, fuente citada) |
| G19 · G23 | esta skill · **HTML libre** S18/S32 · las tendencias y sus fuentes las trae la persona (o búscalas con la búsqueda web de Claude y cita la fuente) |
| G20 | `carrusel-render-formula100k` (collage con tus fotos) o esta skill · HTML libre S34 |
| G21 | esta skill · `templates/papel.html` (letra manuscrita, una sola tinta) |
| G22 | `banana` (las dos ilustraciones sin texto) + esta skill · HTML libre S31 |
| G24 | `capturas-tutorial-formula100k` (tapar datos) + esta skill · HTML libre S33 (trazo rojo) |
| G25 | esta skill · **HTML libre** S35 (split horizontal sobre tus fotos, rótulo fijo en itálica) |
| G26, G27, G28, G29, G32, G33, G34, G35, G38, G39, G40 | esta skill · **HTML libre** con el soporte de la ficha (S36–S50). G27 y G35: el objeto o la libreta van clavados en el mismo punto en todas las slides. G29: los emojis salen de una fuente, nunca de un modelo de imagen |
| G30, G31, G36 | `banana` o `higgsfield-carrusel-generador` (el dibujo a crayón, el bodegón o las variaciones del producto, SIN texto y desde la foto real) + esta skill · HTML libre S40 / S41 / S46 |
| G37 | `carrusel-render-formula100k` (tus fotos a sangre) o esta skill · HTML libre S47 |
| F09 | `carrusel-organico-f100k` o `carrusel-render-formula100k` |
| F10, F11, F12, F15 | `carrusel-render-formula100k` (o `clonador-carrusel-formula100k` con el link) |
| F14 | `higgsfield-carrusel-generador` (foto con tu cara) + texto en HTML |
| F16 · G03 con personajes | `carrusel-ilustrado-formula100k` (adaptando el estilo) |
| F20 | `banana` (recortes) + `carrusel-render-formula100k` |

Si deriva a otra skill: pásale el guion aprobado + el **visual detallado** + la **referencia** de la ficha + su marca, e invócala.
Si esa skill no está instalada, fabrícalo aquí con **HTML libre** y las fotos reales de la persona; lo que pida imagen IA (`banana`, `higgsfield-carrusel-generador`) se cambia por una foto suya o un fondo en CSS, y dejas el prompt de la imagen listo por si después lo quiere generar.

### 6. Render
En los comandos, `<carpeta de esta skill>` es la ruta de la carpeta donde está este `SKILL.md`.

**Plantillas propias:**
1. Escribe `spec.json` en la carpeta de la pieza (por defecto `entregables/`). Formato en `references/plantillas.md`; ejemplos en `ejemplos/`. Pon su @ en `"handle"`.
2. Fotos de la persona: cópialas a una carpeta `fotos/` junto al spec y usa rutas relativas (`fotos/foto-1.jpg`). Mira las fotos recortadas a 4:5 antes de elegir y de poner coordenadas: la cara nunca va debajo del texto.
3. `node "<carpeta de esta skill>/build.js" "<carpeta>/spec.json" --escala 1`

**HTML libre** (fichas G y estilos de la guía maestra):
1. Lee el prompt del estilo del soporte en `estilos-guia-maestra.md` y el visual de la ficha en `prompts-por-plataforma.md`. Si la ficha trae enlace público del ejemplo, ábrelo para ver el post.
2. Escribe `<carpeta>/carrusel.html` con el contrato de `plantillas.md` y su marca en `:root`.
   **Scrapbook con textura (fotos reales + papel, cinta, polaroid, recortes):** copia `kit/` de la carpeta de esta skill a la carpeta de la pieza, escribe
   `kit/marca.css` con los colores y las letras de la persona y usa sus piezas (`.rasgado`, `.tape`, `.pola`, `.recorte`,
   `.postit`, `.recibo`, `.sello`, `.hl`, `.cta`, `.versus`). Instrucciones y reglas en `kit/LEEME.md`. La textura va
   detrás del contenido: ningún filtro sobre letras.
3. `node "<carpeta de esta skill>/build.js" "<carpeta>/carrusel.html" --escala 1`

Avisos: `⚠ no-cabe` / `⚠ letra-chica` (menos de 28 px) → acorta el texto (no achiques la letra). `⚠ margen` (texto a
menos de 80 px de la orilla) → mete el texto hacia dentro. `⚠ fuente` / `⚠ imagen` → no entregues hasta resolverlo.
Con `--escala 1` salen PNG a 1080 × 1350 exactos (lo que pide Instagram). Sin esa opción salen a 2160×2700 (escala 2): úsalo solo si pide más resolución.
La primera vez, si falta `node_modules` dentro de la carpeta de esta skill: entra a esa carpeta y corre `npm install`.

**Mockups de celular:** usa una foto real de iPhone con la pantalla en blanco y monta la pantalla en HTML encima (el texto sale perfecto). Nada de teléfonos dibujados con borde negro grueso. Detalle en `references/portada-gancho-visual.md`.

### 6.5 Portada: la imagen ES el tema

Antes de dar por buena la lámina 1, lee `references/portada-gancho-visual.md` y pasa la prueba de 1 segundo (titular tapado: ¿la imagen sola dice el tema?). Si el carrusel muestra ejemplos del recetario o de un catálogo, rota las fichas: no enseñes siempre las mismas cuando hay muchas documentadas.

### 7. MIRA los PNG antes de entregar
Abre cada `slide-NN.png` con Read. Revisa: texto cortado, tildes y eñes, cara tapada, líneas cruzando textos, contraste, que lleve sus colores y su letra, que se parezca a la referencia.
Los avisos de `build.js` no reemplazan mirar.
Entrega: rutas de los PNG + caption con el CTA. **CTA:** comentario de una palabra clave ligada al tema (y a un regalo suyo, si lo tiene), nunca «YO» ni «guárdalo» como cierre, aunque la ficha lo traiga; salvo que su marca traiga otro CTA. Abre la carpeta.

---

## Fichas de octubre (G26–G40)
- G26, G27 y G28 se vieron como miniatura dentro de un reporte de tendencias: sus métricas son las del reporte. No las cites como resultado del formato.
- Ninguna tiene la prueba con Nano Banana todavía.
- Si la referencia de una ficha es animada (G27, G35), se puede entregar con las slides en video; el texto siempre en HTML.


## Gotchas conocidos
- **Fuentes:** nunca `-apple-system` (en Chrome headless cae a Times). Las plantillas esperan `document.fonts.ready`. Requiere internet (Google Fonts).
- **Autofit** mide cajas, no `scrollHeight`, y borra `style.fontSize` para medir la base: el tamaño inicial de un texto con `data-fit` va en CSS (o en una variable), nunca inline en `font-size`, o cae a 16 px.
- **Chequeo de fuentes** del HTML libre usa el peso y la itálica reales: una familia cargada solo en 900 no se pregunta en 400.
- `export.js` viene dentro de esta skill. Si `build.js` dice que falta `puppeteer-core`, corre `npm install` dentro de la carpeta de esta skill (instala `puppeteer-core` y usa tu Google Chrome; no descarga navegador).
- Si Chrome está en una ruta rara, define la variable `CHROME_PATH` con la ruta al ejecutable antes de correr `build.js`.
- F05 necesita 2 imágenes metafóricas por slide: sin créditos de imagen, usa fotos distintas y avisa que es provisional.
- F18 sin fondo IA dibuja barras: sirve para publicar, pero la referencia usa objetos reales apilados.
- F13: el `contorno` es un óvalo suelto, no un recorte de la silueta.
- Los prompts de Gemini y ChatGPT no están probados con generación real todavía.
