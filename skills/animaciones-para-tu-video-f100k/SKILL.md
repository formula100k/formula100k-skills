---
name: animaciones-para-tu-video-f100k
description: "Fabrica animaciones cortas en fondo verde para poner encima de tu video en CapCut (número que sube, lista, flecha, cartel con tu nombre). Usar con «hazme una animación para mi video», «texto animado para CapCut», «overlay con fondo verde». NO edita el video completo."
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Animaciones para tu video

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Tú no editas el video: fabricas **la animación** y la persona la pone encima en CapCut.
La pieza no es decoración: el número, la lista o el cartel están para que quien mira
**crea y quiera lo que se vende**. Si la animación no refuerza la oferta, sobra.

## El camino (siempre este, no inventes otro)

1. **Copia la plantilla** `plantilla/animacion.html` de esta skill a una carpeta nueva del
   Escritorio llamada `animaciones`, con un nombre que diga qué es
   (`numero-que-sube.html`, `lista-errores.html`…). **No escribas el motor desde cero**: la
   plantilla ya está probada (graba MP4 real en Chrome, respeta la zona segura de Instagram y
   las reglas del verde).
2. **Cambia SOLO el bloque de arriba** («LO QUE PUEDES CAMBIAR»): `TIPO`, `FORMATO`, los 3
   colores, `NOMBRE_ARCHIVO` y el objeto de textos del tipo elegido. Nada más.
3. Si piden algo que los 6 tipos no cubren, agrega una escena nueva dentro de `ESCENAS`
   reusando `texto()`, `caja()`, `suave()` y `SEGURA` — y cumpliendo las reglas del verde.
4. **Ábrela en Chrome** (en Mac: `open -a "Google Chrome" archivo.html`; en Windows:
   `start chrome "archivo.html"`) y revísala.
5. Explica cómo descargar y cómo ponerla en CapCut (abajo).

## Qué tipo elegir

| Tipo | Úsalo para | Textos |
|---|---|---|
| `numero` | un resultado que impresiona (clientas, ventas, kilos, años) | `NUMERO.hasta`, `antes`/`despues` (ej. «+», « kg»), `frase` |
| `lista` | pasos, errores o razones mientras hablas (máx. 5) | `LISTA.titulo` (opcional), `LISTA.puntos` |
| `flecha` | señalar algo del video (deja el centro libre) | `FLECHA.texto`, `lado` |
| `barras` | antes vs después de trabajar contigo | `BARRAS.antes`, `despues`, etiquetas, `unidad` |
| `gancho` | la frase del segundo 1, palabra por palabra | `GANCHO.frase` (≤ 8 palabras), `palabraFuerte` |
| `cartel` | tu nombre y lo que haces, abajo, como en la tele | `CARTEL.nombre`, `queHace` |

## Reglas del verde (si se rompen, CapCut deja manchas)

- Fondo `#00FF00` sólido en todo el cuadro. Nunca transparente ni degradado.
- **Ningún color de marca verde.** Si la marca es verde, usa el tono no-verde más cercano y AVÍSALE.
- Colores sólidos. **Cero** `shadowBlur`, brillos, desenfoques, degradados o transparencias sobre el verde.
- Todo texto y forma lleva **contorno oscuro sólido** (~12 % del tamaño de letra). La plantilla ya lo hace.

## Antes de decir «lista»

- Nada se sale del cuadro ni de la zona segura (vertical: 250 px arriba y 450 px abajo libres).
- Se lee en pantalla chica; la palabra/número más importante se ve primero.
- Textos en el idioma y el rubro de la persona, sin jerga ajena.
- Tócale tú «▶ Ver de nuevo» mentalmente: la animación termina quieta, no cortada.

## Qué le dices al entregar

1. La ruta exacta del archivo.
2. «Toca **⬇ Descargar video** y **no cambies de pestaña** hasta que diga ✓ Listo (Chrome pausa la
   grabación si la pestaña queda oculta). El video queda en Descargas.»
3. En CapCut: importa tu video y la animación → pon la animación en la pista de ARRIBA, en el
   momento en que lo dices → Recortar/Croma (o «Quitar fondo» → Croma) → gotero sobre el verde →
   sube la intensidad **solo** hasta que desaparezca el verde (si te pasas, lo oscuro se transparenta).
4. Qué líneas cambiar para reusarla con otro texto u otro color.

## Marca, serie y efectos

- **Marca.** Antes de elegir colores, lee el `marca.md` de la persona (color, letra y **movimiento**). Si no existe,
  copia `references/marca.md` de esta skill, pregunta lo que falte en un solo mensaje y déjaselo escrito.
  Color → `COLOR_TEXTO`, `COLOR_ACENTO`, `COLOR_OSCURO` · Letra → `FUENTE` (está en el motor, debajo del bloque de arriba).
  El movimiento de los 6 tipos es fijo. Cuando agregues una escena nueva en `ESCENAS`, sí aplica su fila de
  «Movimiento»: cuánto dura la entrada, si frena seco o suave, de qué lado entra y cuánto se sostiene. Las reglas del
  verde mandan sobre la marca: nada de desenfoque ni transparencias aunque la marca los pida; dilo.
- **Varias animaciones para un mismo video.** Escribe primero la lista: qué animación va en qué frase y qué tienen
  todas en común (los mismos 3 colores, la misma letra, el mismo lugar del cuadro, la misma forma de entrar y salir).
  Densidad: como mínimo una cada 3 a 5 segundos según el contexto, y nunca dos a la vez.
- **Referencias.** Si te pasa un video que le gustó además de su material, declara qué tomas de cada uno («de la
  referencia, el tipo de movimiento; de su marca, colores y letra») antes de fabricar. Detalle: `references/ritmo-y-serie.md`.
- **Música.** Esta skill no sincroniza con música: la animación dura 5 s y la persona la coloca en CapCut. Si quiere
  que el número o la palabra «caigan» en un golpe, que arrastre el clip hasta que el momento fuerte coincida con el
  golpe; no prometas más que eso.
- **Efectos de otras librerías:** `references/efectos-open-source.md`. Aquí casi todo queda fuera por las reglas del
  verde (acuarela, filtros, brillos); el trazo sólido a mano sí cabe.

## Si algo falla

- **No descarga / el navegador no es Chrome:** que la abra en Google Chrome. Si igual no, que grabe
  la pantalla (Mac: Cmd + Shift + 5 → grabar porción seleccionada, solo el cuadro; Windows:
  Herramienta Recortes → Grabar) con la animación y la recorte en CapCut. El verde se borra igual.
- **Se queda «Grabando…» para siempre:** cambió de pestaña. Recargar la página y volver a tocar
  Descargar sin salir de la pestaña.
- **La fuente sale fea:** no hay internet para Google Fonts; funciona igual con la fuente del sistema.

## Lo que esta skill NO hace

Edición completa (cortar silencios, subtítulos, montaje), video con IA, transparencia real para
otros editores. Si lo piden, dilo en una línea: eso es el siguiente nivel y no se hace aquí.
