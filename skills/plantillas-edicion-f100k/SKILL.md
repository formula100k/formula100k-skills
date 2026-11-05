---
name: plantillas-edicion-f100k
description: Router del catálogo único de plantillas de edición de video de FÓRMULA 100K (251 plantillas con nombre y comando de una línea - con tu video, YouTube 16:9, sin grabar, animado sin cara, «¿Qué pasaría si…?», motion graphics, 66 estilos de cine, 40 efectos y 7 looks). Con solo nombrar la plantilla sabe qué skill la hace, con qué receta y qué material pedir; revisa que esa skill esté instalada (si no, dice cómo instalarla en 1 paso) y le pasa el trabajo. Usar cuando digan "edita mi video con la plantilla X", "hazme un reel sin grabar con la plantilla X sobre…", "ponle el efecto X a mi video", "ponle el look X", "qué plantillas de edición hay", "qué estilos de edición hay", "/plantillas", "lista de plantillas", "cuál plantilla me sirve para este guion", "con qué plantilla edito esto", "clona la edición de este reel [enlace]", "edita mi video como este reel [enlace]". NO usar para carruseles (carrusel-formatos-f100k) ni para escribir el guion (guionizacion-formula100k).
argument-hint: "[nombre de la plantilla] [ruta del video | tema]"
---

# Plantillas de edición · FÓRMULA 100K

Una alumna no tiene que saber qué skill hace qué. Dice el **nombre de la plantilla** y esta skill hace el resto:
reconoce la plantilla → revisa que su motor esté instalado → pide solo el material que esa plantilla necesita → le pasa el trabajo al motor con la receta exacta.

**Voz:** tutea siempre y en español neutro. Nunca voseo.

## La fuente de verdad
`referencia/plantillas-edicion.json` (en la carpeta de esta skill, la que tiene este `SKILL.md`). Cada plantilla trae:
`id`, `nombre` (el que dice la alumna), `alias`, `grupo`, `queSeVe`, `necesita`, `comando`, `motor` (`skill` + `receta`, y `modo` o `complementoDe` si aplica), `seInstalaCon`, `tambienEn`, `muestra` (ruta pública de formula100k.app o `null`) y, a veces, `fusion` o `nota`.
`referencia/plantillas-edicion.md` es la misma lista en tablas, para mostrarla rápido. Si no coinciden, manda el JSON. No edites estos archivos: llegan con cada actualización.

## 1. ¿Qué pidió?
- **«Qué plantillas hay» / «/plantillas» / «lista de plantillas»** → muestra los grupos con su cantidad (`porGrupo`) y, de cada grupo, los nombres en una línea separados por « · ». En «¿Qué pasaría si…?» muestra solo las 7 familias con 2 ejemplos cada una (son 56). En «Estilos de cine» muestra sus 11 familias (`familia`) con 3 nombres cada una (son 66). Cierra con: «Copia el comando de la que quieras, por ejemplo: `edita mi video con la plantilla «Pantalla dividida»`».
  Si pregunta por un grupo («qué efectos hay»), muestra ese grupo completo: nombre — `queSeVe` en una línea.
- **Nombró una plantilla** → paso 2.
- **No nombró plantilla** (pasó un guion, un video o un tema) → paso 5.
- **Pegó el enlace de un reel** para copiar cómo está editado («clona la edición de este reel: …») → paso 6.

## 2. Reconoce la plantilla aunque venga aproximada
1. Compara lo que dijo con `nombre`, `alias` e `id` **sin tildes, sin mayúsculas y sin signos** («pantalla dividida», «la de dividir la pantalla», «split» → `pantalla-dividida`).
2. Si hay **una** coincidencia clara, sigue. Si hay **dos o más** (p. ej. «recorte de papel» es un efecto y «Recortes de papel» un corto animado; «tier list» es efecto y «Ranking por niveles» un estilo entero), pregunta en UNA línea con las opciones y su `queSeVe`.
3. Las palabras del pedido desempatan: «efecto» → grupo Efectos; «look» → Looks; «sin grabar», «sin cara», «sobre [tema]» → Sin grabar o Animado sin cara; «mi video», «edita» → Con tu video o YouTube 16:9; «qué pasaría si» → ese grupo.
4. Si no hay ninguna, di que no la encuentras y propón las 3 más parecidas por `queSeVe`. Nunca inventes una plantilla.
5. Si la plantilla tiene `fusion`, no lo expliques salvo que pregunte por el nombre viejo: úsala tal cual.

## 3. ¿Está instalado su motor?
El motor es `motor.skill`. Míralo en este orden:
- Entre las skills disponibles en esta sesión (con o sin el prefijo `formula100k:`).
- En la carpeta de skills de Claude: `~/.claude/skills/<motor.skill>/SKILL.md` (en Windows, `%USERPROFILE%\.claude\skills\…`).
Los efectos y looks con `complementoDe: "auto-edicion"` necesitan **las dos**: `auto-edit-effects` y `auto-edicion` (van una al lado de la otra).

Si falta, **no sigas** y dile en 1 paso cómo instalarlo, con el texto de `instalar[seInstalaCon]` del JSON (si tiene `tambienEn`, ofrece también esa vía). Ejemplo:
> La plantilla «Avatar 3D» la hace la skill auto-edicion, que viene en el módulo Edición. Instálalo desde la Fábrica de contenido (formula100k.app, Instala tus módulos → Edición) y vuelve a pegarme el comando.

## 4. Pide solo lo que esa plantilla necesita y pásale el trabajo
1. Lee `necesita` y pide **solo** lo que falte, en UN mensaje (la ruta del video, el tema, el enlace, las capturas…). Si ya lo dio, no lo repitas.
2. Busca su brandkit (sección «Tu brandkit manda en el look», más abajo).
3. Abre el `SKILL.md` del motor y síguelo: **sus reglas mandan** (corte, gancho, marca, sonidos, cifras con fuente, CTA). Esta skill no las repite ni las cambia. Su brandkit va encima del look de la plantilla.
4. Entra al motor por la receta exacta, sin volver a elegir estilo:

| `motor.skill` | Cómo entra la receta |
|---|---|
| `auto-edicion`, modo «Con tu video» o «Con tu video (16:9)» | Modo «Con tu video» de su `SKILL.md` con el estilo = `receta` (es el nombre de `plantilla/estilos/<receta>.src.html`: `node <skill>/scripts/video.mjs plantilla "<proyecto>" <receta>`). «Clips rankeados» corre antes `video.mjs clips`. |
| `auto-edicion`, modo «Sin grabar» | Modo «Sin grabar» y, en «Mi look», el avatar de la `receta`: `ejemplo-ruido` = con poses; `sin-grabar/avatar-3d`, `sin-grabar/habbo` o `sin-grabar/explicador` = sigue el `LEEME.md` de esa carpeta. No preguntes qué avatar: ya lo eligió. |
| `auto-edicion`, modo «Efectos» | La fila `#n` de `referencia/efectos.md` del motor, en la escena de la frase que pide. |
| `auto-edit-effects` | La fila `#n` (o el `look`) de su `referencia/catalogo.md`, sobre un proyecto de Auto-Edición «Con tu video». Si todavía no hay proyecto, primero edita el video con Auto-Edición (propón «Subtítulo ajustado» si no eligió estilo). |
| `editor-video-formula100k` | El formato = `receta` (`fullscreen`, `pip`, `versus` o `noticiero`). |
| `look-viral-en-un-prompt-f100k` | El look = `receta` (`palabra` o `linea`). |
| `clonador-de-edicion-f100k` | El estilo del catálogo `estilos/catalogo.md` con id = `receta`. |
| `animacion-dibujada-f100k` con `receta` `cine-<id>` (grupo «Estilos de cine») | `node <skill>/scripts/armar.mjs cine-<id> "<proyecto>/animaciones/<nombre>.html"`, cambia solo el bloque «LO QUE PUEDES CAMBIAR» con su frase (y sus fotos si el estilo las acepta) y renderiza con `renderizar.mjs`, como dice su `SKILL.md` (sección «Estilos de cine (66)»). Es un clip de 8 a 10 s para meter en su reel. |
| cualquier otra | Su flujo normal; la `receta` es el nombre del estilo o modo dentro de esa skill. |

5. Al entregar, di en una línea qué plantilla usaste (y, si hubo brandkit, qué aplicaste de él) y, si tiene `muestra`, que la puede comparar en `formula100k.app` + esa ruta.

## Tu brandkit manda en el look
Sin esto, las plantillas salen con sus colores por defecto. **Antes de producir** (y antes de pasarle el trabajo al motor), busca su brandkit en este orden y usa el primero que encuentres:
1. **`mi_brandkit` del conector de Yapper**, si el guion viene de Yapper o el conector está disponible en la sesión (si tiene varios proyectos, pásale `cuenta`). Trae su brandkit, su manual y los enlaces de sus stickers.
2. **`mi-marca/brandkit.md`** en la carpeta del proyecto, con sus stickers en `mi-marca/stickers/`.
3. **`mi-marca/marca.md`**, su manual de identidad visual (colores y letras).
4. Si no hay nada, sigue como siempre, con el look de la plantilla.

Los colores y las letras salen de su manual (`mi-marca/marca.md` o lo que devuelva `mi_brandkit`). Cómo se aplica:
- **Encima de la plantilla elegida:** colores, letras, gancho, subtítulos, elementos de marca (fondos con patrón, marco del video, listas con check, secciones numeradas, antes/después, flechas), stickers y CTA. La estructura de la plantilla se respeta: su orden, sus escenas, su ritmo y su composición. Pásale al motor el brandkit junto con la receta.
- **Estilos con mundo propio** (cubitos 3D, telenovela, juego retro, estilos de cine, stop motion): la marca va en los textos, el gancho, los subtítulos, los stickers y el CTA. El mundo no se repinta.
- **El brandkit no pisa las reglas de oficio:** gancho de 2 a 5 palabras que entra con corte seco; nada tiembla ni rebota (los stickers también van quietos); fotos y capturas reales antes que emojis o íconos; y ningún sonido agudo.
- **Stickers según su modo:** `dibuja` → dibújalos tú según su descripción, con sus colores; `busca` → usa memes o imágenes reales según `que_buscar`; `propios` → sus imágenes: descarga las URLs que devuelve `mi_brandkit` o usa las de `mi-marca/stickers/`. Nunca inventes stickers que no pidió.
- **Al terminar,** di en una línea qué aplicaste del brandkit (por ejemplo: «Del brandkit: colores y letras, gancho, subtítulos, lista con check, 3 stickers propios y tu CTA»).

## 5. No nombró plantilla: propón 2
Lee su guion, su video o su tema y propón **2 plantillas** (nombre — por qué en una línea — su `comando` listo para copiar). Guía:

| Si el contenido es… | Propón |
|---|---|
| Ranking, «lo mejor y lo peor» | Ranking por niveles · Top 5 |
| Pasos, «3 errores», lista | Lista rápida · Notitas |
| Lista por grupos sin cara («N herramientas para…», «lo que necesitas en cada etapa») | Lista en cuaderno · Lista con maquetas |
| Explicar una app o tu producto con personajes que hablan, sin salir a cámara | Telenovela de frutas |
| Historia real de una empresa o una persona («el nacimiento de…») con datos y fuentes | Collage documental |
| Historia, anécdota | Historia natural · Fondo que cambia (sin grabar: Historia animada) |
| Tutorial, demo de una app | Pantalla dividida · Capturas de tutorial |
| Explicas con cifras o un proceso | Explainer con cifras · Explicación arriba |
| Pruebas: tu perfil, tus resultados | Tú delante de tu pantalla (Depth UI) · Hablo y te muestro |
| «Siempre / nunca», bien y mal | Siempre / Nunca · Antes y ahora |
| Dos puntos de vista | Dos de ti · Novato vs. experto |
| Clase larga horizontal | YouTube educativo · YouTube notitas |
| Video largo para sacar reels | Clips rankeados |
| Grabó una escena sin hablar (llega, trabaja, celebra) y la quiere como película | Tu video hecho película |
| Solo un tema, no quiere grabarse | Avatar 3D · Avatar con poses |
| Reflexión o idea sin cara | Collage explicado · Reflexión en collage |
| Pregunta «¿qué pasaría si…?» | 2 estilos de ese grupo cuyo `para` vaya con la pregunta |

Si dice «ponle efectos» sin nombrar ninguno, el motor propone los momentos: pásale el pedido a `auto-edicion` (19 efectos) y, si está instalado, también al catálogo de `auto-edit-effects`.

## 6. Pegó un enlace: clona esa edición
Se clona **cómo está editado**, nunca el contenido: ni sus textos, ni su cara, ni su logo, ni su música.
1. **Baja el reel** a `<proyecto>/referencia/` con `yt-dlp -o "<proyecto>/referencia/ref.%(ext)s" "<enlace>"`. Si falta `yt-dlp`, dile cómo instalarlo en 1 paso (Mac: `brew install yt-dlp` · Windows: `winget install -e --id yt-dlp.yt-dlp`). Si no baja (cuenta privada o borrado), pídele que lo descargue y te pase el archivo.
2. **Míralo de verdad**, no por el caption: 1 cuadro por segundo (`ffmpeg -i ref.mp4 -vf fps=1 cuadros/%03d.jpg`) y, de 0 a 3 s, uno cada 0,25 s. Si tiene voz, transcríbela. Anota 5 líneas: (a) ¿sale una persona hablando o no?, (b) cómo es el gancho de 0 a 3 s, (c) letra, tamaño y colores de los textos, (d) qué aparece en pantalla (capturas, fotos, dibujos, cifras) y cada cuántos segundos, (e) el ritmo de los cortes.
3. **Elige el motor:**
   - Animado sin cara que responde una pregunta imposible o crece con cifras («¿qué pasaría si…?») → `clonador-de-edicion-f100k` con el enlace como referencia (él lo estudia con su propio paso).
   - Sale una persona hablando, o ella dijo «úsala en mi video» → las 2 plantillas de «Con tu video» o «YouTube 16:9» cuyo `queSeVe` más se parece a tus 5 notas. Dile en 2 líneas cuál se parece más y en qué es distinta, y sigue con esa (pasos 3 y 4).
   - Sin cara y no es «¿qué pasaría si…?», o ella dijo «sin grabar» → la plantilla más parecida de «Sin grabar» o «Animado sin cara», igual que arriba.
4. Pásale al motor tus 5 notas como **dirección de arte** (gancho, letra, colores, qué aparece y ritmo) para que la plantilla se parezca a la referencia. Si la referencia hace algo que va contra las reglas del motor (texto que tiembla, brillos, sonidos agudos, olor a IA), manda la regla del motor. Los colores, las letras, los stickers y el CTA son los de su brandkit, no los de la referencia.
5. Al entregar, di en una línea qué plantilla usaste de base y qué tomaste de la referencia.

## Reglas de esta skill
- **No inventes plantillas, recetas ni muestras.** Lo que no está en el JSON no existe.
- **Una plantilla, un motor.** No mezcles dos motores en un reel salvo que lo pida; los estilos de Auto-Edición sí se pueden mezclar por escena (lo dice su motor).
- **No dupliques reglas del motor.** Si una regla de la casa aplica (gancho golpe, edición sin olor a IA, sin pitidos, cifras con fuente, CTA con palabra ligada al tema y nunca «YO»), está en el `SKILL.md` del motor: síguela desde ahí.
- **Su marca y su negocio** los lee el motor (`~/Documents/mi-contenido/`). Su brandkit lo buscas tú antes de producir y se lo pasas al motor (sección «Tu brandkit manda en el look»). Esta skill no pregunta colores ni letras.
