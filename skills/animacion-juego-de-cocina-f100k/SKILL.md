---
name: animacion-juego-de-cocina-f100k
description: Arma una animación vertical de 10,5 s con estética de videojuego de cocina de los 2000 (portada del juego, «elige tu plato», tres ingredientes que vuelan al bowl y plato servido), con recortes de fotos reales, papel rasgado, rótulos que se escriben solos y movimiento a saltos. Usar cuando digan «hazme la animación del juego de cocina», «la receta de [algo] en formato videojuego», «animación tipo juego flash», «reel de receta paso a paso animado», «tres ingredientes para [resultado]» o pasen una idea de «receta» de cualquier rubro para volverla clip. NO usar para editar un video ya grabado (editor-video-formula100k), ni para carruseles, ni para animaciones dibujadas cuadro a cuadro (animacion-dibujada-f100k).
argument-hint: [tema de la receta]
---

# Animación · juego de cocina

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Un clip de 10,5 s, 1080×1920, que cuenta una «receta» de tres pasos como si fuera un juego de cocina viejo.
Sirve para cualquier rubro: la receta puede ser de un bizcocho, de una rutina, de una consulta o de un reel.
Sale sin audio; si la persona trae su pista, los cambios de escena y los tres pasos caen en los golpes de la música y
la pista se mezcla en el MP4 (ver «Música, marca y serie»).

Cuatro escenas fijas:

| # | Segundos | Qué pasa |
|---|---|---|
| 1 | 0 – 2,8 | Portada: cae un cartel de papel, el título se escribe letra por letra, sale el botón de jugar |
| 2 | 2,8 – 5,4 | «Elige tu plato»: tres cartas, un dedo elige una y cae un sello |
| 3 | 5,4 – 9 | Tres ingredientes vuelan uno por uno al bowl; cada uno con su paso y una palabra escrita a mano |
| 4 | 9 – 10,5 | El resultado servido en un plato (una imagen, un emoji o un teléfono con una foto) |

## Antes de escribir nada

0. Lee su **`marca.md`** (color, letra y movimiento). Si no existe, copia `references/marca.md` de esta skill, pregunta
   lo que falte junto con el punto 2 y déjaselo escrito. Pregunta también si va con música (su pista, o el tempo del
   audio que usará al publicar).
1. Identifica el **rubro real** de la persona (de su perfil, de su Segundo Cerebro o pregúntalo en una línea). Los textos salen de ese rubro.
2. Reúne o propone, en un solo mensaje, lo que falta:
   - el **resultado** de la receta (va en el subtítulo de la portada y en el plato final);
   - **3 opciones** de «plato» y cuál se elige;
   - **3 pasos**, cada uno con su ingrediente (texto de hasta ~20 letras por paso);
   - su usuario de la red;
   - opcional: 1 a 3 **fotos de la persona** (busto de frente, cuerpo entero, busto) y su color de marca.
3. No inventes cifras, precios ni resultados. Si la persona no dio un dato, no lo pongas.

## Flujo

```bash
SKILL=~/.claude/skills/animacion-juego-de-cocina-f100k
DEST=<carpeta de salida>/<nombre-de-la-pieza>     # nunca dentro de la skill
mkdir -p "$DEST" && cp -R "$SKILL/plantilla/." "$DEST/"
```

1. **Llena `$DEST/config.js`.** Es lo único que se edita; `index.html` no se toca. Campos abajo.
2. **Pon las imágenes en `$DEST/assets/`** (ver «Imágenes»).
   Si llenaste `musica` o `movimiento.sostieneFinal`: pon la pista en `assets/` y corre `node ajustar.mjs`. Imprime
   cuánto movió cada cambio y la lista de cuadros para el paso 4 (los tiempos de abajo son los de la pieza sin música).
3. **Valida:** `cd "$DEST" && hyperframes lint`. Cero errores. Los avisos `nested_structure_needs_subcomposition`,
   `timeline_track_too_dense` y `duplicate_media_discovery_risk` son esperados.
4. **Mira los cuadros** antes de renderizar:
   ```bash
   hyperframes snapshot --at 1.3,2.3,4.9,6.75,7.75,8.75,10.3 --no-end --describe false
   ```
   Abre los PNG de `snapshots/` y revisa: título y subtítulo completos dentro del cartel, las tres cartas legibles,
   la palabra a mano encima del bowl, el plato final centrado. Corrige en `config.js` y repite.
5. **Renderiza:** `hyperframes render --output <nombre>.mp4` (unos 20 s). Borra `snapshots/`.
   Con música: `node ajustar.mjs --mezclar <nombre>.mp4` deja `<nombre>-con-musica.mp4`.
6. **Revisa el MP4**, no solo los snapshots:
   ```bash
   ffmpeg -y -loglevel error -i <nombre>.mp4 -vf "fps=2,scale=240:-1,tile=11x2" -frames:v 1 hoja.jpg
   ```
7. Entrega la ruta del MP4 y di qué le falta: sin `musica` no trae audio (música y efectos se ponen en la edición);
   con `musica`, que la sincronizaste por tiempos y no la escuchaste: que la oiga antes de publicar.

## Campos de `config.js`

En cualquier texto: `*palabra*` la resalta con el color de acento y `_palabra_` la pone en serif itálica.
Un visual es `{emoji:"🥚"}` o `{img:"assets/huevo.png"}`.

| Campo | Qué es |
|---|---|
| `tema.acento` | Color de marca: resaltados, botón, cinta, primer barrido |
| `tema.mantel` | Color de los cuadros del mantel; usa el acento con transparencia (`rgba(…, .30)`) |
| `tema.mantelFondo`, `tema.papel`, `tema.suave`, `tema.tinta`, `tema.kraft`, `tema.rojo` | Resto de la paleta |
| `personas.portada` / `.platos` / `.pasos` | PNG sin fondo de la persona, o `null`. Portada y pasos: busto. Platos: cuerpo entero, angosto |
| `portada.eyebrow` | Línea chica de arriba («Cocinando con …») |
| `portada.titulo` | Título grande, corto (hasta ~10 letras se ve enorme; más largo se achica solo) |
| `portada.subtitulo` | Una línea; resalta la promesa con `*…*` |
| `portada.boton` | Texto del botón |
| `platos.titulo` | Cartel de la escena 2 |
| `platos.opciones` | Exactamente 3: visual + `nombre` + `sub` |
| `platos.elegido` | 0, 1 o 2 |
| `platos.sello` | Texto del sello |
| `pasos` | Exactamente 3: `texto`, `ingrediente` (visual + `etiqueta`), `palabra` a mano, `color` de la mezcla |
| `final.titulo` | Cartel final |
| `final.tipo` | `"plato"` (usa `emoji` o `img`) o `"celular"` (usa `img` como pantalla del teléfono) |
| `final.usuario` | Usuario de la red, abajo |
| `musica` | `null`, `{ archivo: "assets/pista.mp3" }` o `{ bpm: 120 }`. Extras: `inicio`, `volumen`, `mezclar`, `tolerancia`, `primerFuerte` |
| `movimiento` | `null` o `{ rebote, velocidad, sostieneFinal }`: el movimiento de la marca (ver abajo) |

El número de escenas, de opciones y de pasos es fijo. La duración es de 10,5 s salvo que haya `musica` o
`movimiento.sostieneFinal`: HyperFrames lee los tiempos del HTML antes de correr el script, y por eso los reescribe
`node ajustar.mjs` (nunca a mano). Si alguien necesita 4 pasos, se duplica la escena 3 en `index.html`; eso ya es editar
la plantilla, avísalo.

## Música, marca y serie

Detalle común a todas las skills de animación: `references/ritmo-y-serie.md`. Lo propio de esta plantilla:

- **Música.** Con `musica`, `node ajustar.mjs` mide la pista (`golpes.mjs`) y coloca seis momentos: los tres cambios de
  escena en un golpe fuerte (o en un golpe, si no hay fuerte a menos de `tolerancia` segundos) y la caída de cada
  ingrediente al bowl en un golpe. La portada arranca en el primer golpe fuerte de la pista. La duración total cambia
  un poco (la imprime). Para volver a la pieza sin música: `musica: null` y `node ajustar.mjs`.
  La pista la trae la persona (propia o libre de derechos). Si va a usar un audio de Instagram: `{ bpm: … }` o
  `mezclar: false`, y el MP4 sale sin audio con los tiempos ya puestos a ese tempo.
- **Marca.** De `marca.md`: Color → `tema` · Letra → no se cambia (la plantilla usa letras del sistema; `_palabra_`
  da la serif) · Movimiento → `movimiento.rebote` (frenado con o sin rebote), `movimiento.velocidad` (duración de las
  entradas: 1 normal, 0.6 a 1.6) y `movimiento.sostieneFinal` (segundos de la última escena). El movimiento a saltos,
  la dirección de las entradas y el desenfoque son parte del estilo y no se configuran: si la marca pide otra cosa, dilo.
- **Serie.** Si se hacen varias recetas, escribe antes `BIBLIA.md` (paleta, letra, textura, movimiento, música y
  momentos obligados: por ejemplo, mismo botón, mismo sello y misma escena final en todas) y declara qué se toma de
  cada referencia. Revisa cada pieza contra esa lista mirando sus cuadros.
- **Efectos de otras librerías** (trazo a mano, acuarela, física): `references/efectos-open-source.md`. Agregar uno es
  editar `index.html`; haz la prueba de «mismo cuadro dos veces» que trae ese archivo.
- `node scripts/probar-golpes.mjs` (en la skill) prueba el detector con pistas de tempo conocido.

## Imágenes

En este orden:

1. **Fotos reales de la persona o de su producto.** Recorte sin fondo, gratis y local (Mac y Windows):
   `node ~/.claude/skills/animacion-dibujada-f100k/scripts/sistema.mjs recortar entrada.jpg salida.png` (si esa skill está instalada).
2. **Generadas con Higgsfield** cuando no hay foto: `generate_image` con un prompt de «foto de estudio de UN objeto, centrado,
   completo, fondo blanco liso, sin sombra, sin texto», y después recorte (el mismo `sistema.mjs recortar` o `remove_background`).
   Mira el saldo con `balance` antes de un lote y di cuántos créditos gastaste.
3. **Emoji** como último recurso: funciona, pero se ve menos parecido a un juego hecho a mano.

Las tres imágenes de ingredientes deben verse de la misma familia (misma luz, mismo estilo). El borde blanco de sticker lo
pone la plantilla; no lo pidas en el prompt.

## Errores conocidos

- **Cambié `musica` y el video sale igual o cortado:** falta `node ajustar.mjs`. Sin correrlo, `ritmo.js` y los tiempos del HTML son los anteriores.
- **Un paso «no cae en golpe»** (lo dice `ajustar.mjs`): el tempo es muy lento o muy rápido para esta pieza. Prueba otra pista, o `tolerancia` más alta.
- **Texto cortado en un cartel:** los textos se achican solos hasta caber, pero un paso de más de ~24 letras queda diminuto. Acórtalo.
- **Fuentes:** solo del sistema. No importes fuentes externas: en el render se caen y sale Times.
- **Persona recortada con bordes sucios:** el borde de sticker los delata. Rehaz el recorte o elige otra foto.
- **Imagen muy ancha en `personas.platos`:** tapa las cartas. Tiene que ser de cuerpo entero y angosta.
- **Cuadro en negro en el render pero no en el snapshot:** alguien puso un fondo en la raíz o en un `.clip`. El fondo va en `.fondo`.

## Skills hermanas

Otros estilos del mismo sistema: `animacion-collage-editorial-f100k` (objetos flotando y tipografía palabra por palabra),
`animacion-collage-stopmotion-f100k` (escenario de papel y persona que cambia de pose a saltos) y `reel-manotazo-f100k`
(problema → manotazo → resultado sobre una toma a cámara).
