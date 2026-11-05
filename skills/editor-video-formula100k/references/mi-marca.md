# Leer el manual de identidad visual (`mi-marca/marca.md`)

> Este archivo es igual en todas las skills que leen el manual. Si lo cambias, cámbialo en todas.

La persona arma su manual una sola vez en **formula100k.app/identidad-visual** y lo descarga como
`marca.md`. Desde ahí, ninguna skill le vuelve a preguntar su color, su letra ni su @.

## 1. Dónde buscarlo (en este orden)

0. **Antes del manual, su brandkit.** Si tiene el conector de Yapper, llama `mi_brandkit` (con varios
   proyectos, pásale `cuenta`): devuelve su brandkit, este mismo manual y los enlaces de sus stickers.
   Si no hay conector, busca `mi-marca/brandkit.md` (stickers en `mi-marca/stickers/`) junto al manual.
   El brandkit suma gancho, subtítulos, elementos de marca, stickers y CTA; los colores y las letras
   siguen saliendo del manual. Cómo se aplica en cada pieza lo dice `references/tu-brandkit.md` (si la
   skill lo trae) o el `SKILL.md` de cada skill; si no dicen nada, úsalo solo como apoyo. Si no hay brandkit, sigue con el paso 1.
1. `mi-marca/marca.md` dentro de la carpeta en la que estás trabajando (la del proyecto de Claude).
2. Si no está ahí: `~/mi-marca/marca.md`, y después cualquier carpeta `mi-marca` con un `marca.md`
   dentro de su carpeta de documentos (búscala con `find`, a pocos niveles de profundidad).
   Si aparecen varios, pregunta cuál es el suyo y no mezcles.
3. Si no hay manual: usa el **formato viejo de esta skill** (el que dice su `SKILL.md`).
4. Si tampoco hay formato viejo: ofrécele, en un solo mensaje, las dos salidas:
   > «Todavía no tengo tu manual de identidad visual. Puedes armarlo en 15 minutos en
   > formula100k.app/identidad-visual y ponerlo en una carpeta `mi-marca` de tu proyecto, o te hago
   > ahora unas preguntas cortas y seguimos.»

   Si elige las preguntas, sigue con la entrevista corta de siempre de esta skill. No la bloquees.

## 2. Cómo se lee

El archivo tiene dos partes:

- **Arriba, entre las dos primeras líneas `---`, un bloque YAML.** Son los **valores exactos**:
  colores en hex, ids de letras, de Edita y de estilos. **El YAML manda en los valores.** Cópialos
  tal cual; no los redondees ni los "mejores".
- **Abajo, la prosa** («Mi manual de identidad visual»). Es el **criterio**: dónde va el acento, qué
  nunca se hace, la lista de revisión. **La prosa manda en el criterio** cuando tengas que decidir
  algo que el YAML no dice.

Al cargarlo, confírmalo en una línea y no repreguntes lo que ya trae:

> «✓ Tu manual de identidad visual: fondo `#______`, texto `#______`, acento `#______`, títulos en
> ______ y textos en ______, firma @______.»

## 3. Qué significa cada campo

| Campo | Qué es | Cómo se usa |
|---|---|---|
| `color.lienzo` | Fondo | Fondo de las láminas, del lienzo o de la página |
| `color.tinta` | Texto | Todo el texto sobre el lienzo. Ya cumple contraste 4,5:1 o más (`contraste_tinta_lienzo`): no la cambies |
| `color.acento` | El color que la identifica | **Una sola cosa por pantalla**: la palabra que vende, el botón, la palabra clave del CTA |
| `color.segundo` | Color de apoyo (opcional) | Fondos alternos y detalles; nunca compite con el acento |
| `color.prohibidos` | Colores o familias que no usa | Nunca aparecen, ni de fondo ni de detalle |
| `letra.titulares` / `letra.apoyo` | Sus dos letras | Ver la regla de letras abajo |
| `letra.resalta_con` | Cómo se marca la palabra importante | `subrayado` · `caja` · `color` (pintada del acento) · `mano` (trazo a mano) · `tamano` (más grande) |
| `imagenes.tipo` | `foto_real` · `collage` · `ilustracion` · `ia_coherente` | Qué tipo de imagen lleva la pieza |
| `imagenes.tratamiento` / `imagenes.nunca` | Cómo se tratan y qué nunca | Luz, recorte, grano, filtro. Lo de `nunca` no entra |
| `carruseles.estilo` | `papel` · `garabato` · `split` · `datos` | La plantilla de `carrusel-formatos-f100k` que más le va |
| `carruseles.portada` / `carruseles.cierre` | Sus reglas de portada y de cierre | Se cumplen en la lámina 1 y en la última |
| `reels.*` | Formato, subtítulos, título y dirección de edición de Yapper Edita | Lo usan Edita y las skills de video |
| `movimiento.*` | Familia de animación, carácter (duración, frenado, rebote, de dónde entra, cómo sale), textura y lo que nunca hace | Lo usan las skills de animación y de motion |
| `firma.usuario` | Su @ | Va en cada pieza (handle, marca de agua) |
| `firma.elemento` | Lo que se repite en todo | Inclúyelo en cada pieza |
| `esencia.*` | Propósito, rasgos, lo que no es y a quién le habla | Tono de los textos y decisiones de estilo |
| `direccion` | La dirección base que eligió | Solo como referencia; los valores de arriba ya la traen |

**Letras.** Cada letra trae `nombre`, `canva` y, según el caso, `google_font` o `archivo`:
- Con `google_font`: cárgala de Google Fonts con ese nombre exacto.
- Con `archivo` (una letra propia de FÓRMULA 100K, que no viaja con esta skill): usa la letra de su
  campo `canva`, que es una Google Font equivalente, y díselo en una línea.
- Declara siempre una pila de respaldo (`'<letra>', sans-serif`) para que nunca caiga en Times.

## 4. Reglas

- **Ella manda en su pieza.** Si para esta pieza pide otra cosa («hazlo en negro»), hazle caso en esta
  pieza y no toques el manual.
- **No edites `marca.md`.** Si quiere cambiar su marca, que la cambie en formula100k.app/identidad-visual
  y descargue el archivo otra vez.
- Si el archivo no se puede leer (le falta el bloque entre `---` o un campo viene vacío), dile qué
  campo falla, usa lo que sí se lee y pregunta solo lo que falta.
- Nunca mezcles su manual con colores, letras o el @ de otra cuenta, aunque vengan de una referencia.

## 5. Ejemplo real

Así se ve el archivo que descarga una alumna (caso de prueba «Dulce Fiesta», una repostería de
fiestas infantiles; generado con el mismo código de la página):

````markdown
---
version: 1
direccion: ludica-3d
esencia:
  proposito: Que cada fiesta tenga un pastel que los niños recuerden.
  rasgos:
    - juguetona
    - cálida
    - detallista
  no_es:
    - seria
    - fría
  le_habla_a: Mamás que organizan el cumpleaños de sus hijos y quieren lucirse sin estrés.
color:
  lienzo: "#fff8ec"
  tinta: "#2b2118"
  acento: "#ff8a3d"
  segundo: "#7bd3ea"
  prohibidos:
    - gris oscuro
    - negro puro de fondo
  contraste_tinta_lienzo: 14.92
letra:
  titulares:
    id: compinche
    nombre: Compinche
    canva: Cutive
    archivo: Compinche.woff2
    edita_titulo: compinche
  apoyo:
    id: rubik
    nombre: Rubik
    canva: Rubik
    google_font: Rubik
  resalta_con: color
imagenes:
  tipo: foto_real
  tratamiento: Luz de día, colores vivos y el pastel siempre al centro.
  nunca:
    - fotos de banco de imágenes
carruseles:
  estilo: garabato
  portada: El pastel terminado y la promesa en grande.
  cierre: Una sola acción, con la palabra clave en el color de acento.
reels:
  formato: fullscreen
  subtitulos: karaoke
  titulo: burbuja
  direccion_edicion: dinamico
  palabras_por_grupo: 3
movimiento:
  familia: animacion-cubitos-3d-f100k
  caracter:
    duracion: 0,4 a 0,6 s
    frenado: rápido al final
    rebote: marcado, un rebote
    entra_desde: abajo, con salto
    salida: se encoge y desaparece
  textura: plástico brillante de juguete
  nunca:
    - movimientos lentos y solemnes
firma:
  usuario: "@dulcefiesta"
  elemento: Una vela encendida junto al título.
fuentes:
  - "dirección: Lúdica 3D"
---

# Mi manual de identidad visual

Este archivo es tu marca por escrito. Guárdalo en la carpeta `mi-marca/` de tu proyecto de Claude: tus skills de animación lo leen antes de crear cualquier pieza.

## Esencia

**Para qué existe tu marca:** Que cada fiesta tenga un pastel que los niños recuerden.

**Cómo se siente:** juguetona, cálida, detallista. **Lo que no es:** seria, fría.

**A quién le hablas:** Mamás que organizan el cumpleaños de sus hijos y quieren lucirse sin estrés.

## Color

Fondo `#fff8ec`, texto `#2b2118` (contraste 14.92:1) y un solo acento `#ff8a3d`, con `#7bd3ea` de apoyo.

- **Hazlo así:** el acento va solo en lo que quieres que vean primero.
- **Nunca así:** gris oscuro, negro puro de fondo.

## Letra

Títulos en **Compinche** y textos en **Rubik**. La palabra importante va pintada del color de acento.

- **En Canva:** busca Cutive y Rubik.

## Imágenes

Luz de día, colores vivos y el pastel siempre al centro.

- **Nunca:** fotos de banco de imágenes.

## Carruseles

Estilo **garabato**. **Portada:** El pastel terminado y la promesa en grande. **Cierre:** Una sola acción, con la palabra clave en el color de acento.

## Reels

Formato **fullscreen**, subtítulos **karaoke** de 3 en 3, título **burbuja** y dirección de edición **dinamico**. Así arranca cada reel nuevo en Yapper Edita.

## Movimiento

Tus animaciones duran 0,4 a 0,6 s, frenan rápido al final, con rebote marcado, un rebote. Entran abajo, con salto y salen se encoge y desaparece. Textura: plástico brillante de juguete.

- **Nunca:** movimientos lentos y solemnes.

## Firma

Una vela encendida junto al título. Tu usuario, @dulcefiesta, va en cada pieza.

## Antes de publicar

- [ ] El fondo y el texto son los de tu manual.
- [ ] El acento aparece en una sola cosa por pantalla.
- [ ] Los títulos van en tu letra de títulos.
- [ ] La palabra importante está resaltada como dice tu manual.
- [ ] Las imágenes siguen tu tratamiento.
- [ ] No usaste nada de tu lista de prohibidos.
- [ ] La portada del carrusel cumple tu regla de portada.
- [ ] El reel usa tus subtítulos y tu título.
- [ ] Las animaciones se mueven con tu ritmo.
- [ ] Tu firma está en la pieza.
````
