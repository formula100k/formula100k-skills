---
name: animacion-collage-editorial-f100k
description: Arma una animación vertical de 14 a 18 s tipo collage editorial - objetos recortados que flotan con parallax sobre papel mientras un titular aparece palabra por palabra con tamaños mezclados, la frase se encoge y cae dentro de una carpeta, la carpeta suelta recortes que llenan el cuadro, el collage pasa a verse dentro de un monitor viejo y, si quieres, cierra con una captura o grabación de pantalla con garabatos blancos encima. Usar cuando digan «hazme una animación tipo collage editorial», «objetos flotando con texto palabra por palabra», «carpeta que suelta recortes», «titular serif con cosas flotando», «intro tipo revista para mi reel», «mis fotos saliendo de una carpeta», «collage dentro de una pantalla vieja», «captura de pantalla con garabatos encima» o pasen un titular y un puñado de imágenes para abrir un reel. NO usar para editar un video ya grabado (editor-video-formula100k), ni para carruseles, ni para dibujos cuadro a cuadro (animacion-dibujada-f100k), ni cuando la pieza necesita a la persona hablando a cámara (reel-manotazo-f100k) o movimiento a saltos de papel recortado (animacion-collage-stopmotion-f100k).
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Animación · collage editorial

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Clip vertical 1080×1920 a 30 fps, sin audio (o con tu pista: ver «Música, marca y serie»), hecho con HyperFrames (HTML + GSAP). Toda la pieza sale de un solo
archivo, `config.js`: no se toca el HTML.

## Qué es y para qué sirve

Cinco partes encadenadas:

1. **Objetos flotando + titular** (5 s). Seis objetos recortados derivan despacio sobre papel, cada uno a su velocidad
   (los «cercanos» recorren más: eso da el parallax). El titular aparece palabra por palabra, con palabras grandes,
   chicas y en cursiva mezcladas.
2. **La frase cae en la carpeta** (1,8 s). Los objetos salen disparados, la frase se encoge, las palabras chicas se
   van volando y el bloque cae dentro de una carpeta de cartón; la etiqueta se escribe sola.
3. **La carpeta suelta recortes** (3,6 s). Fotos y láminas salen de la carpeta una tras otra y se apilan hasta llenar
   el cuadro. Al final puede subir un sticker tuyo y caer un rótulo.
4. **Monitor viejo** (3,6 s). El collage se oscurece y reaparece dentro de una pantalla antigua que se enciende, con una
   frase que se escribe y un cursor que se mueve.
5. **Captura con garabatos** (3,8 s, opcional). Zoom a la pantalla y aparece tu captura o grabación con círculos,
   flechas y subrayados blancos que se dibujan solos.

**Momento del reel:** es una apertura. Sirve como gancho visual de los primeros segundos (una pregunta que se arma
sola), como intro de un tutorial o como B-roll encima de tu voz. La parte 5 es el puente natural hacia «te muestro mi
pantalla». No es una pieza de venta directa: plantea la pregunta y deja el llamado a la acción para lo que viene después.

## Qué pedirle a la persona

Pide todo junto, en un solo mensaje:

1. **Titular**: una pregunta o frase de 6 a 10 palabras, y cuáles son las 2 o 3 que deben pesar más.
2. **Objetos** (5 a 7): cosas de su oficio que se reconozcan de un vistazo. Fotos reales si las tiene; si no, se generan.
3. **Recortes** (8 a 10): fotos de su trabajo, portadas de sus publicaciones, capturas. Verticales de preferencia.
4. **Carpeta**: qué dice la etiqueta (dos renglones cortos).
5. **Frase del monitor**: una oración de hasta 60 caracteres.
6. **Captura** (opcional): imagen o video de su pantalla y qué quiere señalar en ella.
7. **Marca**: lee su `marca.md` (color, letra y movimiento). Si no existe, copia `references/marca.md` de esta
   skill, pregunta lo que falte y déjaselo escrito. Solo fuentes del sistema. Y si quiere su foto recortada como sticker.
8. **Música** (opcional): su pista, o el tempo del audio que usará al publicar.

No inventes cifras, precios ni resultados para el titular: usa solo lo que la persona te dé.

## Flujo paso a paso

```bash
# 1. Copia la plantilla a la carpeta de salida
SKILL=~/.claude/skills/animacion-collage-editorial-f100k
cp -R "$SKILL/plantilla" ./mi-collage && cd ./mi-collage

# 2. Pon las imágenes en assets/ y llena config.js (tabla de abajo)

# 3. Ajusta la duración y revisa que no falten archivos (obligatorio tras cada cambio de tiempos o de captura)
node ajustar.mjs

# 4. Valida: 0 errores (se aceptan los avisos nested_structure_needs_subcomposition y composition_file_too_large)
hyperframes lint

# 5. Saca cuadros y MÍRALOS. ajustar.mjs imprime la lista de tiempos lista para pegar
hyperframes snapshot --at 1.0,4.3,5.6,6.5,8.2,9.7,11.4,13.4,15.2,17.5 --describe false

# 6. Renderiza
hyperframes render --output mi-collage.mp4
# 6b. Solo si config.js trae `musica`: pega la pista → mi-collage-con-musica.mp4
node ajustar.mjs --mezclar mi-collage.mp4

# 7. Hoja de contacto del MP4 final y mírala también
ffmpeg -v error -y -i mi-collage.mp4 -vf "fps=2,scale=270:-1,tile=12x3" hoja.jpg
```

Qué revisar en los cuadros: que ningún objeto pase por detrás del titular (4,3 s), que la etiqueta de la carpeta se
lea (6,5 s), que el collage llene el cuadro sin huecos grandes (9,7 s), que la frase del monitor quepa (13,4 s) y que
los garabatos caigan sobre lo que quieres señalar (17,5 s).

`ajustar.mjs` es el único que escribe en `index.html`: fija la duración total y monta el `<video>` de la captura.
HyperFrames lee la duración del HTML, no del JavaScript; si cambias `tiempos` y no lo corres, el video sale cortado o
con cola.

## Campos de `config.js`

| Campo | Qué es |
|---|---|
| `titular` | Lista de renglones. Marcas por palabra: `*grande*`, `_chica_` (cursiva; sale volando al final), `~acento~` (cursiva de color), `=resaltada=`. Se combinan: `*=~vende?~=*`. El tamaño se ajusta solo al ancho. |
| `titularY` | Centro vertical del titular en px (por defecto 640). |
| `objetos[]` | `img` (PNG sin fondo) o `emoji`; `x`, `y` = centro en el lienzo 1080×1920; `ancho`; `fondo` de 0 (lejos, lento, atrás) a 1 (cerca, rápido, adelante); `giro` en grados; `sticker: true` le pone borde blanco. |
| `deriva` | `{x, y}`: hacia dónde se desplaza todo durante el titular. |
| `carpeta` | `etiqueta` (renglón chico) y `numero` (renglón grande). |
| `recortes[]` | `img` + `forma` (`vertical` 4:5, `cuadrada`, `horizontal`) + `encuadre` opcional (`"50% 20%"`). Sin imagen: `texto` o `emoji` con `color`. Con 6 o menos van a dos columnas; con 7 o más, a tres. |
| `recorteBorde` | Marco blanco de cada recorte en px (0 = sin marco). |
| `cinta` | `true` o un color: cinta adhesiva en uno de cada tres recortes. |
| `sello` / `selloY` | Rótulo que cae sobre el collage y su altura. `null` = sin rótulo. |
| `persona` | `null` o `{img, ancho, alto, x, y}`: recorte con borde de sticker que sube al final del collage. |
| `monitor.texto` | Frase que se escribe en la pantalla. Se encoge sola si es larga. |
| `captura` | `null` o `{src, texto, garabatos, encuadre}`. `src` puede ser imagen o video (mp4, mov, webm). `texto` usa las mismas marcas que el titular. |
| `captura.garabatos[]` | `circulo {x,y,ancho,alto}`, `flecha {x,y,x2,y2}`, `subrayado {x,y,ancho}`, `estrella {x,y,ancho}`, `espiral {x,y,ancho}`; `color` y `grosor` opcionales. La captura ocupa x 60–1020, y 430–1630. |
| `tiempos` | Segundos de cada parte: `titular`, `carpeta`, `collage`, `monitor`, `captura`. |
| `colores` | `papel`, `tinta`, `acento`, `resalte`, `carpeta`, `carpetaTinta`, `pantalla`, `garabato`. |
| `fuentes` | `titular`, `pesoTitular`, `tracking`, `acento`, `pesoAcento`. Solo fuentes del sistema. |
| `semilla` | Número que decide el acomodo y la inclinación de los recortes. Cámbialo para barajar. |
| `captura.trazo` | `"rough"` dibuja los garabatos con trazo de lápiz (Rough.js, incluido en `lib/`). `captura.temblor` de 0 a 3. Sin este campo, el trazo de siempre. |
| `musica` | `null`, `{ archivo: "assets/pista.mp3" }` o `{ bpm: 120 }`. Extras: `inicio`, `volumen`, `mezclar`, `tolerancia`, `primerFuerte`. |

## Música, marca y serie

Detalle común a todas las skills de animación: `references/ritmo-y-serie.md`. Lo propio de esta plantilla:

- **Música.** Con `musica`, `node ajustar.mjs` mide la pista (`golpes.mjs`) y corre los cuatro cambios de parte
  (titular → carpeta → collage → monitor → captura) al golpe fuerte más cercano, o a un golpe si no hay fuerte a menos
  de `tolerancia` segundos (0,6 por defecto). Imprime cuánto movió cada uno; los `tiempos` de `config.js` no se tocan
  (los ajustados quedan en `ritmo.js`). El video arranca en el primer golpe fuerte de la pista (`inicio` lo cambia).
  Son cambios con transición, no cortes secos: el golpe cae en el momento en que una parte da paso a la otra. Lo que
  pasa dentro de cada parte (palabras del titular, recortes que caen) no se ajusta golpe por golpe.
  La pista la trae la persona (propia o libre de derechos). Si va a usar un audio de Instagram: `{ bpm: … }` o
  `mezclar: false`, y el MP4 sale sin audio con los tiempos ya puestos a ese tempo.
- **Marca.** De `marca.md`: Color → `colores` · Letra → `fuentes` · Movimiento → `tiempos` (cuánto se sostiene cada
  parte), `deriva` (hacia dónde se mueve todo) y `fondo` de cada objeto (qué tan rápido). Frenado, rebote, desenfoque
  y salida no se configuran en esta plantilla: si la marca pide otra cosa, dilo al entregar.
- **Serie.** Para varias aperturas, escribe antes `BIBLIA.md` (paleta, letra, textura, movimiento, música y momentos
  obligados: por ejemplo, misma carpeta, mismo rótulo, misma frase de cierre en el monitor) y declara qué se toma de
  cada referencia («de mi trabajo, los recortes y el encuadre; de la referencia, la letra y la jerarquía»). Revisa
  cada pieza contra esa lista mirando sus cuadros.
- **Efectos de otras librerías:** `references/efectos-open-source.md`. `captura.trazo: "rough"` es el ejemplo ya
  integrado y probado (mismo cuadro, dos capturas idénticas).
- `node scripts/probar-golpes.mjs` (en la skill) prueba el detector con pistas de tempo conocido.

## Cómo conseguir las imágenes

En este orden:

1. **Foto o captura real** de la persona. Para quitarle el fondo a un objeto o a una persona, gratis y local (Mac y Windows):
   `node ~/.claude/skills/animacion-dibujada-f100k/scripts/sistema.mjs recortar foto.jpg assets/objeto.png`
2. **Higgsfield** (herramientas diferidas: cárgalas con ToolSearch). Mira `balance` antes y di cuántos créditos gastaste.
   Rinde más pedir una sola imagen con seis objetos: «seis objetos separados sobre fondo blanco puro, en cuadrícula de
   3 por 2, con mucho espacio entre ellos, foto de producto, sin texto ni sombras», en 3:2 y resolución `2k`. Luego
   parte la imagen en seis celdas con ffmpeg (`crop`) y pasa cada celda por el mismo `sistema.mjs recortar`. A `1k` los objetos salen
   borrosos al tamaño en que flotan.
3. **Emoji** como último recurso: `{ emoji: "🍓", … }` en objetos o en recortes.

Los recortes del collage no necesitan recorte de fondo: son fotos rectangulares. Bájalos a unos 900 px de lado para que
el render no pese.

## Errores conocidos

- **Cambié `musica` y los cambios no se movieron**: falta `node ajustar.mjs`; `ritmo.js` guarda los tiempos anteriores.
- **El video dura distinto a lo esperado**: no corriste `node ajustar.mjs` después de cambiar `tiempos` o `captura`.
- **Aviso rojo «Falta correr node ajustar.mjs»** en la parte 5: la captura es un video y todavía no está montado.
- **Un objeto pasa por detrás del titular**: el titular vive entre x 120–960 y unos 250 px arriba y abajo de
  `titularY`. Deja los objetos en los bordes y recuerda que todos suben durante la escena (`deriva.y`).
- **El collage deja huecos**: hay menos de 8 recortes o demasiados horizontales. Suma recortes de texto o emoji.
- **La etiqueta o el rótulo salen diminutos**: el texto es muy largo y se encogió para caber. Acórtalo.
- **Texto en Times**: pusiste una fuente que no es del sistema. Usa `Georgia`, `-apple-system`/`'Helvetica Neue'`,
  `'Bradley Hand'` o `'Marker Felt'`.
- **Objetos borrosos**: el PNG mide menos que el `ancho` con que flota. Genera a `2k` o baja el `ancho`.
- **Cuadro negro al render**: no pongas fondos en `#root` ni en `#escena`; la plantilla ya los lleva en capas hijas.
- No uses `Math.random`, `Date.now` ni `repeat:-1` si tocas el HTML: el render deja de ser repetible.

## Skills hermanas

Si lo que buscas es otro estilo de animación, mira `animacion-juego-de-cocina-f100k` (videojuego de cocina),
`reel-manotazo-f100k` (toma a cámara con cambio de golpe) y `animacion-collage-stopmotion-f100k` (papel recortado a saltos).
