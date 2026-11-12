---
name: clonador-carrusel-formula100k
description: "Toma la captura o el link de un carrusel de referencia, extrae su estilo, lo mejora y renderiza PNGs con tu tema y tu marca. Usar con «clona este carrusel», «hazme un carrusel como este», «replica este estilo». NO sin referencia visual (carrusel-viral-formula100k o carrusel-render-formula100k)."
argument-hint: "<captura(s) O enlace IG/TikTok del carrusel referente> + <tu tema> + <tus fotos (opcional)>"
metadata:
  version: "1.1.0"
  formato: "4:5 — 1080×1350px (configurable)"
  render: "HTML + Chrome headless (export.js) — PNG finales sin Canva"
---

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

## 🧰 ANTES DE EMPEZAR (manda sobre lo que diga esta skill más abajo)

Corre igual en Mac y en Windows.

- **Tu negocio.** Rubro, avatar y oferta salen de `~/Documents/mi-contenido/mi-negocio.md` (o de lo que venga en el pedido). Si existe `~/Documents/mi-contenido/mi-voz.md`, el guion suena a ella.
- **Tu marca, en este orden:** 1) `~/Documents/mi-contenido/mi-marca.md` (colores, letras, estilo visual, @handle y tono); 2) si no está, su manual de identidad visual `mi-marca/marca.md` (cómo buscarlo y leerlo: `references/mi-marca.md`); 3) si no hay ninguno, pregunta en UN solo mensaje: «¿Cuál es tu color principal (o un HEX)?, ¿qué letra te gusta (o "no sé")? y ¿cuál es tu @?». Mientras no responda, usa el look del referente tal cual y `@tuhandle` como marcador. Ofrece guardar lo que te diga en `~/Documents/mi-contenido/mi-marca.md` para la próxima vez, o armar su manual en formula100k.app/identidad-visual.
- **Tu marca manda sobre el estilo clonado.** Con ficha o manual, la paleta y las letras del referente se cambian por las suyas (ver PASO 3); del referente se clona el sistema: layout, ritmo, decoración y tratamiento de foto.
- **La carpeta de esta skill.** `export.js`, `references/` y `node_modules/` están en la carpeta donde vive este `SKILL.md`. Con el plugin esa carpeta no es `~/.claude/skills/…`: usa la ruta real de esta skill y nunca escribas archivos de la persona dentro de ella.
- **Tus fotos.** Solo las que te pase la persona («súbeme 1 o 2 fotos tuyas si quieres salir en el carrusel»). Nunca uses fotos de muestra, caras inventadas ni fotos del referente.
- **Dónde guardar.** `~/Documents/mi-contenido/carruseles/<AAAA-MM-DD>-<tema>/` (crea la carpeta si no existe).
- **Si falta una cuenta o un conector, no te detengas:** haz la parte que sí se puede y di en una línea qué faltó. Para bajar un enlace: con el conector de Apify, lo baja solo; sin él, pide capturas (ver PASO 0.5).
- **Nombres de herramientas.** Un conector puede aparecer como `mcp__claude_ai_<Nombre>__…` o `mcp__<nombre>__…`: usa el que esté disponible.
- **Otras skills.** Si esta skill nombra otra que no está instalada, sigue sin ella y avisa.
- **Sin pasos de más.** No preguntes por Canva ni entregues calendario, horarios de publicación o estadísticas salvo que te lo pida.
- **Abrir un archivo o una carpeta:** en Mac `open "<ruta>"`; en Windows `start "" "<ruta>"`.
- **Llaves.** Nunca pidas que peguen una llave o un token en el chat ni los escribas en un archivo de `~/Documents/mi-contenido/`.
- **Cifras.** Nunca inventes seguidores, ventas, precios ni resultados. Si el guion necesita un número, pídeselo a la persona o deja `[TU RESULTADO]`.

---

# Skill ESPEJO — Clona y Mejora cualquier Carrusel

> "Dame la captura de un carrusel que te frene el scroll y te devuelvo ESE estilo, pero mejor, con TU contenido y listo para subir."

Esta skill convierte una **captura de pantalla** (o un enlace) de un carrusel ajeno en un carrusel propio: lee el estilo visual del referente como lo leería una directora de arte, lo eleva con la metodología F100K y entrega las slides renderizadas en PNG.

**No es plagio: es ingeniería inversa de estilo + mejora.** Se clona el SISTEMA de diseño (no el contenido), se corrige lo que el referente hace mal, y se rellena con la idea y la marca de quien la usa.

---

## CUÁNDO ACTIVAR

- "Clona este carrusel / copia este estilo / hazme uno como este"
- "Vi este carrusel de [referente] y me encantó cómo se ve"
- "Tengo una captura de pantalla de un carrusel, replícalo para mi tema"
- **"Clona este carrusel desde este enlace de Instagram/TikTok"** → ver PASO 0.5
- "Skill espejo" / "carrusel espejo"
- Cualquier captura **o enlace** de un carrusel + intención de reproducir su look para contenido propio

**No activar cuando:**
- No hay imagen de referencia → usar `carrusel-viral-formula100k` (guion) + `carrusel-render-formula100k` (render en tu estilo), si están instaladas.
- Quieren un formato del catálogo (tier list, libreta, chat…) sin referencia concreta → `carrusel-formatos-f100k`.
- Quieren ilustraciones con personaje → `carrusel-ilustrado-formula100k`, si está instalada.

---

## FLUJO COMPLETO (7 pasos)

### PASO 0 — Recibir la referencia (captura **o** enlace)

La referencia puede llegar de **dos formas**. Detectar cuál es antes de pedir nada:

**A) Captura(s) de pantalla** (ruta local o adjunto):
> "Pásame **1 o más capturas** del carrusel que quieres clonar (idealmente la portada + 1 slide interno + el slide de cierre, así leo el sistema completo)."

**B) Enlace de Instagram / TikTok** (empieza con `instagram.com/p/`, `instagram.com/reel/`, `tiktok.com/...`):
> "Perfecto, pásame el link del post."

En ambos casos, pedir también:
> "¿Sobre **qué tema** quieres TU carrusel? Si quieres aparecer tú, súbeme 1 o 2 fotos."

(La marca —colores, letra, @— se lee de `~/Documents/mi-contenido/mi-marca.md` o de su manual `mi-marca/marca.md`; solo se pregunta si no hay ninguno.)

#### PASO 0.5 — Si es un ENLACE: bajar las slides

Seguir la receta de **`references/descargar-referencia.md`**. En resumen:
1. **Si la persona tiene el conector de Apify** (aparecen herramientas `mcp__apify__…` o `mcp__claude_ai_Apify__…`): usar el actor `apify/instagram-scraper` con `directUrls: [<link>]` y `resultsType: "details"`; de la respuesta extraer las URLs de imagen del carrusel (`images[]` o `childPosts[].displayUrl`). Para TikTok, un actor de TikTok que devuelva las fotos del slideshow.
2. Descargar cada imagen a una carpeta temporal, **en orden** (`curl -L -o slide-XX.jpg <url>`; `curl` viene en Mac y en Windows 10/11).
3. **Si no tiene Apify, o Apify falla** (post privado, sin red): pedir capturas, sin drama:
   > "No puedo abrir el enlace desde aquí. Hazle captura a la portada, a 1 slide del medio y al cierre, y pégamelas en el chat."
4. Si es un video y no un carrusel de imágenes, avisar: el clonador trabaja con slides.
5. Confirmar al usuario: "Bajé N slides del post, ya las estoy leyendo."

**Luego, tanto para A como para B:** leer cada imagen con **Read** (visión). No continuar sin haber "visto" al menos la portada.

---

### PASO 1 — Extraer el ADN de estilo

Mirar las capturas y completar la **ficha de ADN** (ver `references/extraccion-adn.md` para el detalle de cada campo). Rellenar SIEMPRE estos 8 ejes:

| Eje | Qué observar |
|-----|--------------|
| **1. Layout / grid** | ¿Texto centrado, alineado a izquierda, en bloques? ¿Dónde vive el título? ¿Hay márgenes anchos o sangrado completo? |
| **2. Tipografía** | ¿Serif o sans? ¿Display de alto contraste o geométrica? Jerarquía (título enorme vs cuerpo). Mayúsculas, tracking. Aproximar a fuentes de Google Fonts. |
| **3. Paleta** | 2-4 colores dominantes en HEX aproximado: fondo, texto, acento. ¿Claro/oscuro? ¿Plano o con degradado? |
| **4. Patrón de gancho (portada)** | ¿Número, promesa, contraste, error común, ruptura? Estructura de la frase de portada. |
| **5. Arquitectura de slides** | Nº de slides, qué hace cada uno (hook → problema → pasos → prueba → CTA). Ritmo: 1 idea por slide vs denso. |
| **6. Decoración / textura** | Formas, líneas, stickers, sombras, fotos, mockups, fondo con textura, flechas, numeración. |
| **7. Tratamiento de foto** | ¿Usa fotos de persona? ¿Recortadas (cutout), polaroid, fondo completo, en círculo? ¿Filtro? |
| **8. CTA / cierre** | Cómo remata: comentar palabra, guardar, seguir, link. Posición y forma del CTA. |

Devolver al usuario un resumen corto y honesto del ADN ("esto es lo que hace el referente"), en español neutro.

---

### PASO 2 — Diagnóstico + capa de mejora F100K

Antes de reproducir, **decidir qué se conserva y qué se mejora**. El estilo se clona; los errores NO se clonan. Aplicar la capa de mejora (detalle en `references/capa-mejora-f100k.md`):

**Conservar** lo que da identidad: mood, layout base, tratamiento de foto. La **paleta** y la **familia tipográfica** del referente se conservan solo si la persona no tiene ficha de marca ni manual (ver PASO 3).

**Vestir con TU marca:** con `mi-marca.md` o con su manual, sus colores y sus letras reemplazan los del referente (detalle en el PASO 3). Si solo trae color principal y letra, el color principal reemplaza el acento del referente y la letra reemplaza la del cuerpo (o la del título, si encaja con el mood). Mantener el contraste y la jerarquía del original.

**Mejorar SIEMPRE (no negociable):**
1. **Gancho** → reescribir la portada con un patrón validado (ruptura, contraste, número, error común), como afirmación directa. Ver `references/capa-mejora-f100k.md`.
2. **Legibilidad** → 1 idea por slide, máximo ~12-18 palabras visibles por slide; contraste de texto AA; cuerpo nunca < 26px equivalente.
3. **Jerarquía** → un solo foco visual por slide; el ojo entra por el título.
4. **Ritmo narrativo** → portada (hook) → tensión/problema → desarrollo en pasos → prueba/ejemplo → CTA. Si el referente mete relleno, se elimina.
5. **CTA** → cierre con comentario de una palabra clave ligada al tema (nunca «YO» ni «guárdalo»), salvo que su ficha de marca o su manual (`carruseles.cierre`) traiga otro CTA.
6. **Accesibilidad** → no poner texto crítico sobre zonas de bajo contraste de la foto.

Mostrar al usuario una tabla de 2 columnas: **"Lo que copiamos del referente" / "Lo que mejoramos"**. Pedir OK rápido.

---

### PASO 3 — Confirmar tema, marca y fotos

**Primero, su marca, en este orden:** `~/Documents/mi-contenido/mi-marca.md`; si no está, su manual de identidad visual `mi-marca/marca.md` (búscalo como dice `references/mi-marca.md`).

- **Si hay ficha o manual:** la paleta clonada **se reemplaza por la suya**. Con el manual: fondo → `color.lienzo`, texto → `color.tinta`, acento → `color.acento`, segundo color → `color.segundo`; las letras del referente se cambian por las suyas (`letra.titulares` y `letra.apoyo`) cuando cumplen el mismo papel (titular pesado, manuscrita, serif); se respetan sus `color.prohibidos`, `imagenes.nunca`, `carruseles.portada`, `carruseles.cierre` y su firma (`firma.usuario`, `firma.elemento`). Con la ficha `mi-marca.md`, lo mismo con los colores, letras y @ que traiga. Lo que se clona es el sistema: layout, ritmo, decoración y tratamiento de foto.
  - **Excepción:** si la persona pide quedarse con la paleta o las letras del referente («quiero esos colores»), hazle caso en esta pieza y díselo en una línea.
  - Muestra en la tabla del PASO 2 una fila «Paleta: la tuya (de tu marca)».
- **Si no hay ninguno:** pregunta lo de siempre (color principal, letra, @). Puede sobrescribir 1 acento de la paleta clonada. Menciona en una línea que puede armar su manual en formula100k.app/identidad-visual para que la próxima vez salga con su marca sin preguntar.

Confirmar:
- **Tema/idea** del carrusel propio (1 frase). El rubro sale de `mi-negocio.md`: los ejemplos y el vocabulario del guion salen de ESE rubro, no de marketing (salvo que su rubro sea ese).
- **Marca:** @handle, color y letra (de `mi-marca.md`, de su manual o de su respuesta).
- **Fotos** de la persona si el referente usa persona. Si no hay fotos y el estilo las requiere, ofrecer: (a) que suba una foto suya, (b) sustituir por bloque tipográfico/forma.

---

### PASO 4 — Escribir el guion mejorado slide por slide

Generar el guion completo aplicando la arquitectura del PASO 1 (5) ya mejorada:
- Nº de slides = el del referente (±1 si la mejora lo pide).
- Cada slide: **propósito + texto exacto** que irá renderizado (título + cuerpo + nota).
- Gancho de portada reescrito con un patrón validado.
- CTA final con palabra clave del tema.
- Tuteo siempre (tú, tienes, guarda, comenta).

> Si el tema necesita más desarrollo, apoyarse en `carrusel-viral-formula100k` (si está instalada) para el copy, pero MANTENER la arquitectura clonada.

Entregar el guion en texto para que el usuario lo apruebe antes de renderizar.

---

### PASO 5 — Construir el HTML en el estilo clonado-mejorado

Escribir un único archivo `carrusel-espejo.html` en la carpeta de salida, con N elementos `.slide` (uno por slide), **reproduciendo el ADN**:

Reglas técnicas de render:
- Cada slide es un `<section class="slide">` de **1080×1350px** exactos (o el ratio detectado: 4:5 / 1:1 / 9:16).
- Fuentes vía **Google Fonts CDN** — la de su marca si la tiene; si no, la más cercana a la del referente (p. ej. serif display → `Playfair Display` / `DM Serif Display`; sans geométrica → `Poppins` / `Space Grotesk` / `Inter`; condensada → `Bebas Neue` / `Archivo`).
- Paleta en `:root` como variables: la de su marca si tiene ficha o manual; si no, la clonada (con su color principal como acento si te lo dio).
- Reproducir layout, decoración y tratamiento de foto detectados.
- Aplicar la capa de mejora del PASO 2 (jerarquía, 1 idea/slide, contraste).
- **Fotos de la persona:** copiarlas a la carpeta de salida (`foto-1.jpg`, `foto-2.jpg`…) y usarlas con **ruta relativa** (`src="foto-1.jpg"`), `object-fit: cover`, en el contenedor que el estilo pida (cutout, polaroid, círculo, fondo).
- Numeración y handle según el estilo del referente (o abajo a la izquierda si el referente no los tiene).
- **Anti-texto-cortado (obligatorio):** pegar el bloque `<script>` de auto-ajuste antes de `</body>`, usar `line-height` ≥ 1.06 + `padding-bottom:.12em` en titulares, y NUNCA poner `overflow:hidden` ni `height` fijo en el contenedor del texto. Titular de portada: máximo 2 líneas / ~35 caracteres.

Ver plantilla base en `references/plantilla-html.md`.

---

### PASO 6 — Renderizar a PNG

En lo que sigue, `{carpeta-skill}` es la carpeta de esta skill (donde está este `SKILL.md`; con el plugin no es `~/.claude/skills/…`).

La primera vez, si falta `node_modules` dentro de `{carpeta-skill}`, instalar (una sola vez):

```bash
cd "{carpeta-skill}" && npm install
```

Luego:

```bash
node "{carpeta-skill}/export.js" "<carpeta>/carrusel-espejo.html" --width 1080 --height 1350 --scale 1
```

(`--scale 1` da 1080 × 1350; usa `--scale 2` solo si la persona pide más resolución.)

- Genera `slide-01.png`, `slide-02.png`, … en la carpeta del HTML.
- El motor usa el Google Chrome instalado (Mac o Windows; también Edge, Brave o Chromium). No descarga ningún navegador.
- Verificar que el nº de PNGs = nº de slides. Abrir cada PNG con Read y revisar texto cortado, tildes y caras tapadas antes de entregar.

---

### PASO 7 — Entregar

- Listar los PNGs y el orden de subida.
- Proponer el caption con el CTA (palabra clave del tema).
- Abrir la carpeta de salida: en Mac `open "<ruta>"`; en Windows `start "" "<ruta>"`.

---

## REGLAS DURAS

1. **Clonar estilo, NUNCA contenido.** El texto siempre es nuevo y de la persona.
2. **Siempre mejorar el gancho y la legibilidad** — jamás reproducir un mal hook solo por fidelidad.
3. **Leer la referencia de verdad** (visión) antes de afirmar nada del estilo. No inventar la paleta: aproximar HEX desde lo que se ve.
3b. **Si llega un ENLACE**, intentar bajarlo con Apify si el conector está; si no, pedir capturas en una línea y seguir.
4. **Español neutro y tuteo** en todo texto entregado (tú, tienes, puedes; nunca vos, tenés, podés).
5. **Formato fijo** al ratio del referente; PNG de 1080 × 1350 (`--scale 1`) salvo que pida más resolución.
6. **Si no hay Chrome**, decirlo y entregar el HTML para que la persona lo abra en el navegador.
7. **Sin datos inventados** ni cifras que la persona no haya dado.
8. Si la persona quiere su propio estilo en vez del clonado → derivar a `carrusel-render-formula100k` (si está instalada) o a `carrusel-formatos-f100k`.
9. **Se clona también el GANCHO VISUAL de la referencia, no solo su layout.** Si la portada de la referencia muestra el tema (la persona en pixel, con una cámara, entre informes, un mockup), la tuya también lo muestra, con la versión de la persona. Lee `references/portada-gancho-visual.md` antes del PASO 5 y pasa la prueba de 1 segundo (titular tapado). Una selfie cualquiera en el lugar de la imagen-tema = portada rechazada.
