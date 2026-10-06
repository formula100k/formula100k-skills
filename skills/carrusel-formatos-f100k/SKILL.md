---
name: carrusel-formatos-f100k
description: Router del catálogo de 60 formatos de carrusel de FÓRMULA 100K (F01–F20 y G01–G40). Elige el formato por objetivo, escribe el guion con el prompt de la ficha y lo fabrica donde la persona trabaje: Claude Code con plantillas propias o HTML libre, o prompts listos para Gemini, ChatGPT o cualquier chat. Usar cuando se diga "qué formato de carrusel uso", "catálogo de formatos de carrusel", "hazme un carrusel tipo [ficha]", "carrusel en libreta", "tier list", "checklist", "chuleta", "carrusel tipo chat", "antes y después", "garabatos sobre mi foto", "hilo de tuits", "tabla de ranking", "yo de antes y yo de ahora", "cliente en evidencia", "carrusel interactivo", "calendario del mes", "principiante vs pro", "la frase que se escribe sola", "un miedo por lámina", "reto de N días", "dame el prompt para hacerlo en Gemini/ChatGPT". NO usar para clonar un link concreto (clonador-carrusel-formula100k) ni para un scrapbook con tus fotos sin formato (carrusel-render-formula100k).
---

## 🧭 ANCLAJE DE RUBRO (leer PRIMERO — manda sobre cualquier ejemplo de esta skill)

Esta skill enseña un **método**. El método es agnóstico de industria: sirve igual para
formulación cosmética, nutrición, repostería, fisioterapia, finanzas o jabonería.
Los ejemplos escritos aquí abajo son ilustraciones **del método**, nunca del tema.

**Antes de escribir nada:**

1. Identifica el **RUBRO real** de la persona (léelo de su Segundo Cerebro, de su perfil o
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
| `references/catalogo.md` | Las **60 fichas**: F01–F20 (referencias miradas) y G01–G40 (G26–G40 sumadas el 5-oct desde las referencias de octubre). Mecánicas M1–M49, soportes S1–S50, anatomía, error típico, **prompt de guion**, quién lo fabrica, y la auditoría de cobertura. |
| `references/prompts-por-plataforma.md` | Por ficha: **referencia** (link al post real), **visual detallado** (paleta hex, tipografía, composición por slide) y prompts para Claude Code · HTML en cualquier chat · Gemini · ChatGPT, con variantes A/B/C. GENERADO desde `visual.json`. |
| `references/grimorio-carruseles.md` | Anatomía completa de los 17 carruseles del Grimorio (G01–G13 + 4 alias). GENERADO por `scripts/sincronizar-grimorio.mjs`. |
| `references/estilos-guia-maestra.md` | Los 25 estilos visuales con su prompt HTML (pieles y soportes S17–S28). |
| `references/plantillas.md` | Formato de `spec.json` de las plantillas y contrato del HTML libre. |

Los archivos de `references/` los mantiene el equipo de FÓRMULA 100K y llegan con cada actualización del paquete: no los edites.

**Voz:** tuteo siempre (tú, tienes, sube, comenta). Nunca voseo, tampoco en los textos de las slides.

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
Pregunta solo si no está claro. Si el usuario trabaja en Claude Code → paso 4. Si la persona trabaja en otra herramienta, o pide "el prompt":
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
| G19 · G23 | esta skill · **HTML libre** S18/S32 · los clips con `portada-video-carrusel-formula100k` · las tendencias se cazan con `radar-formatos-f100k` |
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

Si deriva a otra skill: pásale el guion aprobado + el **visual detallado** + la **referencia anclada** de la ficha, e invócala.

### 6. Render
**Plantillas propias:**
1. Escribe `spec.json` en la carpeta de la pieza (por defecto `~/Documents/CARRUSELES/<fecha>_<slug>/`). Formato en `references/plantillas.md`; ejemplos en `ejemplos/`.
2. Fotos del usuario: pregúntale la carpeta la primera vez (por ejemplo `~/Documents/MIS SELFIES`) y usa rutas absolutas o relativas al `spec.json`. Mira las fotos recortadas a 4:5 antes de elegir y de poner coordenadas: la cara nunca va debajo del texto.
3. `node ~/.claude/skills/carrusel-formatos-f100k/build.js <carpeta>/spec.json`

**HTML libre** (fichas G y estilos de la guía maestra):
1. Lee el prompt del estilo del soporte en `estilos-guia-maestra.md` y el visual de la ficha en `prompts-por-plataforma.md`. Abre el link de la referencia para ver el post.
2. Escribe `<carpeta>/carrusel.html` con el contrato de `plantillas.md`.
3. `node ~/.claude/skills/carrusel-formatos-f100k/build.js <carpeta>/carrusel.html`

Avisos: `⚠ no-cabe` / `⚠ letra-chica` → acorta el texto (no achiques la plantilla). `⚠ fuente` / `⚠ imagen` → no entregues hasta resolverlo.
Salen PNG a 2160×2700 (escala 2).

### 7. MIRA los PNG antes de entregar
Abre cada `slide-NN.png` con Read. Revisa: texto cortado, tildes y eñes, cara tapada, líneas cruzando textos, contraste, que se parezca a la referencia.
Los avisos de `build.js` no reemplazan mirar.
Entrega: rutas de los PNG + caption con el CTA de la ficha.

---

## Fichas de octubre (G26–G40)
- G26, G27 y G28 se vieron como miniatura dentro de un reporte de tendencias: sus métricas son las del reporte. No las cites como resultado del formato.
- Si el formato es animado (G27, G35), se puede entregar con las slides en video; el texto siempre en HTML.

## Gotchas conocidos
- **Fuentes:** nunca `-apple-system` (en Chrome headless cae a Times). Las plantillas esperan `document.fonts.ready`. Requiere internet (Google Fonts).
- **Autofit** mide cajas, no `scrollHeight`, y borra `style.fontSize` para medir la base: el tamaño inicial de un texto con `data-fit` va en CSS (o en una variable), nunca inline en `font-size`, o cae a 16 px.
- **Chequeo de fuentes** del HTML libre usa el peso y la itálica reales: una familia cargada solo en 900 no se pregunta en 400.
- `export.js` viene dentro de esta skill. La primera vez: `cd` a la carpeta de esta skill y corre `npm install` (instala `puppeteer-core`; usa tu Google Chrome).
- F05 necesita 2 imágenes metafóricas por slide: sin créditos de imagen, usa fotos distintas y avisa que es provisional.
- F18 sin fondo IA dibuja barras: sirve para publicar, pero la referencia usa objetos reales apilados.
- F13: el `contorno` es un óvalo suelto, no un recorte de la silueta.
- Los prompts de Gemini y ChatGPT no están probados con generación real todavía.
