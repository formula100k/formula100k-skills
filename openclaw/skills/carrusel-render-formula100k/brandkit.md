# Brandkit visual de los carruseles

> Este archivo tiene dos partes: **tu marca** (colores, letras y @) y **dos estilos de composición** (Scrapbook y
> Editorial con foto). El estilo pone el orden, la decoración y el ritmo; **los colores, las letras y el @ siempre
> son los tuyos.**

---

## 1. Tu marca: de dónde salen los valores (en este orden)

1. **Tu ficha de marca** `entregables/` (colores, letra, estilo visual y @).
   Si existe, manda sobre todo lo que hay en este archivo.
2. **Si no está:** tu **manual de identidad visual** `mi-marca/marca.md`. Cómo buscarlo y leerlo:
   `references/mi-marca.md`. También manda sobre este archivo.
3. **Si no hay ninguno:** la tabla «Mi marca» de abajo, si ya la llenaste (formato de siempre).
4. **Si tampoco:** pregunta en un solo mensaje fondo, texto, acento, letra de títulos y @ (u ofrece armar el
   manual en formula100k.app/identidad-visual). Lo que no sepa, queda por definir: no lo inventes.

Los colores y letras de este archivo (paleta neutra de muestra, Caveat, Poppins, Georgia) solo se usan si ella
no tiene los suyos. Del estilo toma la estructura, la jerarquía y el oficio; el look es el suyo.

### Cómo pasan los valores del manual a los estilos

| En el manual | En el estilo |
|---|---|
| `color.lienzo` | Fondo (Scrapbook: el papel · Editorial: la base bajo la foto) |
| `color.tinta` | Texto |
| `color.acento` | Palabra clave del CTA, subrayados, la palabra que vende: **una sola cosa por slide** |
| `color.segundo` | Post-its, cinta, cajas o detalles |
| `letra.titulares` · `letra.apoyo` | Títulos y cuerpo (Google Fonts; si la letra trae `archivo`, usa su `canva`) |
| `letra.resalta_con` | Cómo se marca la palabra importante |
| `imagenes.*` | Si lleva fotos y cómo se tratan |
| `carruseles.portada` · `carruseles.cierre` | Reglas de la slide 1 y de la última |
| `firma.usuario` · `firma.elemento` | Handle y el elemento que se repite en todas |
| `color.prohibidos` · `imagenes.nunca` | No aparecen nunca |

### Mi marca (respaldo si no tienes manual)

| Qué | Valor |
|---|---|
| Fondo | `#______` |
| Texto | `#______` |
| Acento | `#______` |
| Segundo color | `#______` |
| Letra de títulos | ______ |
| Letra de cuerpo | ______ |
| @ | @______ |
| Colores que no uso | ______ |

### Qué estilo usar

- Si la persona lo pide («scrapbook», «estilo diario», «editorial», «con mi foto de fondo»), ese.
- Si su manual trae `imagenes.tipo: collage` o una dirección de recortes o scrapbook → **Scrapbook**.
- Si trae `imagenes.tipo: foto_real` y un tono sobrio o editorial → **Editorial con foto**.
- Si no queda claro, pregúntale una vez cuál de los dos prefiere. No hay estilo por defecto.

---

# ═══════════════════════════════════════
# ESTILO 1 — SCRAPBOOK
# ═══════════════════════════════════════

**Estilo:** scrapbook / collage / álbum personal · cuaderno de creadora.

## Color en scrapbook
- Papel de fondo: `color.lienzo` con la textura de abajo (nunca blanco liso).
- Tinta: `color.tinta`. Acento: `color.acento`. Post-its y cinta: `color.segundo` y versiones claras del acento.
- **Solo si no hay ningún color de marca y la persona pide «el de la skill»**, usa esta paleta neutra de muestra:
  papel `#F5EFE0`, tinta `#2B2218`, acentos `#C17F5A` y `#8FAF8A`, post-its `#FFE881` `#FFCAD4` `#CCE3B5` `#BFD8E8`.

## Letras en scrapbook (Google Fonts CDN)
- Con manual: títulos en su `letra.titulares`, cuerpo en su `letra.apoyo`.
- Sin manual y sin respuesta: **Caveat** (títulos y notas a mano) + **Poppins** (cuerpo).
```html
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```
- Tamaños: títulos 100-180px, notas 36-52px, cuerpo 26-30px, tags 22-26px (800, spacing 2px), CTA 30-36px (800).

## Textura del papel
```css
/* --lienzo = color.lienzo de su manual */
background:
  var(--lienzo)
  radial-gradient(circle at 20% 30%, rgba(0,0,0,0.03) 0%, transparent 40%),
  radial-gradient(circle at 80% 70%, rgba(0,0,0,0.03) 0%, transparent 40%),
  url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 0.08 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
```
La textura va en el papel, la cinta y las piezas; **nunca en las letras** (salen borrosas).

## Decoración scrapbook
- **Washi tape** (1-2 por slide, ±5° a 12°, ~140×32px, en `color.segundo` o el acento translúcido)
- **Post-its** (1-2 por slide, letra a mano, sombra corrida, cinta arriba)
- **Stickers emoji** (3-5 por slide, 70-140px, drop-shadow) según el tono
- **Garabatos** SVG (subrayados ondulados en `color.acento` bajo palabras clave)
- Su `firma.elemento`, si lo tiene, en todas las slides

## Reglas scrapbook
1. 1080×1350px · 2. Papel con textura (nunca blanco liso) · 3. Mínimo 1 cinta + 2 stickers + 1 post-it o garabato por slide · 4. Asimetría (ver `references/composiciones.md`) · 5. Slide final con CTA «Comenta PALABRA» + handle (nunca «guárdalo» ni «YO» como CTA) · 6. Handle abajo a la izquierda · 7. Numeración abajo a la derecha, 28px.

> **Scrapbook con textura:** si la skill `carrusel-formatos-f100k` trae su carpeta `kit/` (papel con fibras, papel
> rasgado, cinta washi, polaroids, recortes tipo sticker, post-its), úsalo cuando pidan scrapbook: toma los colores y
> las letras de la persona desde un `marca.css`, se ve hecho a mano y la textura nunca toca las letras. Ver su `kit/LEEME.md`.
>
> El ejemplo canónico del estilo está en `references/ejemplo-completo.html`. Las composiciones asimétricas de
> `references/composiciones.md` aplican a este estilo.

---

# ═══════════════════════════════════════
# ESTILO 2 — EDITORIAL CON FOTO
# ═══════════════════════════════════════

**Estilo:** editorial / revista, con su foto real a sangre.
**Por qué funciona:** contraste alto entre texto y foto, mezcla de una sans pesada con una serif itálica en el
mismo titular, y capturas reales que dan autoridad.

## Color en editorial
| Rol | Valor |
|---|---|
| Base bajo la foto y cajas | `color.lienzo` (si su lienzo es claro, la foto lleva un velo de su `color.tinta` para que el texto blanco se lea) |
| Texto sobre foto | blanco, o `color.lienzo` si es claro |
| Palabra clave del CTA, comillas, borde de la caja CTA | `color.acento` |
| Badge «CAPTURA REAL» | texto `#7fe3ad` · borde `rgba(127,227,173,.4)` · fondo `rgba(62,207,142,.12)` |
| Puntos de ventana Mac | `#ff5f57` `#febc2e` `#28c840` |

Mide el contraste del texto contra el velo (mínimo 4,5:1). Si el acento no llega como texto, úsalo como relleno.

## Letras en editorial (100% offline si no hay manual)
- Con manual: la sans pesada es su `letra.titulares` y la serif es su `letra.apoyo` (o al revés, según cuál sea
  serif). Si sus dos letras son sans, mezcla pesos (800 y 400 itálica) en vez de familias.
- Sin manual: **sans pesada** `-apple-system, 'Helvetica Neue', Helvetica, Arial` (800, interletrado −2 a −5px,
  78-128px) + **serif** `Georgia, 'Times New Roman', serif` (itálica 500 conectora, itálica 800 destacada, 400 cuerpo).
- Eyebrow arriba a la izquierda: sans 700, 23px, `letter-spacing:5px`, MAYÚSCULAS, blanco al 72%.
- Handle arriba a la derecha: sans 600, 23px, blanco al 72%.
- Todo texto sobre foto lleva `text-shadow: 0 3px 18px rgba(0,0,0,.8)`.

## Fondos y velos
**Foto:** SIEMPRE foto real de la persona (ver `references/fotos-reales.md`). Nunca stock.
- **Portada y CTA (foto nítida a sangre):** `background-position ~50% 32%` + velo
  `linear-gradient(180deg, rgba(0,0,0,.64) 0%, rgba(0,0,0,.42) 30%, rgba(0,0,0,.55) 62%, rgba(0,0,0,.93) 100%)`
  (cambia el negro por su `color.tinta` si es oscura).
- **Slides interiores (la misma foto desenfocada como textura):** `filter:blur(22px) saturate(.7) brightness(.7); transform:scale(1.1)` + velo `rgba(0,0,0,.82)` → `.72` → `.9`.

## Estructura editorial (1080×1350px)
- **Portada:** eyebrow + handle; titular a la izquierda (~top 300px) mezclando sans 800 + serif itálica; opcional, fila de íconos abajo.
- **Contenido:** número `#N` serif arriba; ícono + título; descripción serif 44px (máx. ~3 líneas). Si hay prueba, captura REAL en ventana Mac + flecha a mano + badge «CAPTURA REAL». Un solo punto por slide.
- **CTA:** titular grande + línea serif itálica con la **palabra clave en `color.acento`**; caja oscura translúcida con borde del acento; handle visible.

`references/editorial-oscuro-motor.js` es un motor de ejemplo de este estilo: pásale su acento con
`ACENTO="#rrggbb" node editorial-oscuro-motor.js`.

## Reglas editorial (no romper)
1. 1080×1350px.
2. Foto real (nítida en portada y CTA, desenfocada en interiores).
3. Mezcla sans pesada + serif itálica en el titular de portada y CTA.
4. Toda captura va en ventana Mac + badge «CAPTURA REAL». Las capturas son reales, nunca inventadas.
5. La palabra clave del CTA va en su `color.acento`.
6. Handle de la persona arriba a la derecha (portada y CTA); eyebrow del tema arriba a la izquierda.
7. Cero elementos scrapbook (cinta, post-its, stickers).

---

## Identidad (común a los dos estilos)
- **Handle:** `firma.usuario` de su manual. Si no hay, pregúntaselo la primera vez (`@tuhandle` es solo un marcador).
- **CTA:** «Comenta **[PALABRA]** y te envío…», con una palabra ligada al tema y a un regalo o una oferta **de la
  persona**. Si su manual trae `carruseles.cierre`, esa regla manda.
- **CTA prohibidos:** «guárdalo» como CTA y la palabra «YO».
- **Fotos reales:** `entregables/` (o la carpeta que te diga la persona). Si está vacía o no
  existe, pídele de 10 a 20 fotos. Nunca uses fotos de muestra.
