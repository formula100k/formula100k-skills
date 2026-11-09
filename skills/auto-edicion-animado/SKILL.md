---
name: auto-edicion-animado
description: "Auto-Edición Animado, el complemento de Auto-Edición: pones UN tema y te entrega un reel 9:16 100 % animado y sin avatar, donde la voz explica y la pantalla es la explicación. Cada frase dibuja en código la cosa REAL de la que habla (la app de verdad, el objeto por dentro, el documento, la cifra que cuenta) y la cambia justo en la palabra que la cambia. Antes de dibujar arma un plan visual con su crítica; la voz sale en UNA toma corrida que se parte por frase; y antes de entregar, un revisor mide si algo quedó quieto, si hay fondo vacío o si falta el golpe de los primeros 2 s. Usa el motor, Mi look y los scripts de auto-edicion. Activar con «auto-edición animado», «/auto-edicion-animado <tema>», «reel animado sin avatar sobre…», «explícalo todo animado», «hazlo full animado», «como Keyframes / full visual», «que se vea por dentro cómo funciona X». NO usar para reels con tu avatar (auto-edicion, modo Sin grabar) ni para editar un video grabado (auto-edicion, modo Con tu video)."
argument-hint: <tema a explicar>
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Auto-Edición Animado

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

> **Oficio de dirección (opcional).** Si tienes instalada la skill `estilos-de-cine-f100k`, antes de dibujar lee `~/.claude/skills/estilos-de-cine-f100k/referencia/oficio-de-direccion.md` y aplícalo encima de lo de abajo. Lo que más cambia: toda acción visible suena (grave), con 2 silencios antes del giro y 2 transiciones de sonido (J/L-cut); al menos 4 movimientos de cámara y 1 plano firma; tiempo de lectura medido con `readcheck.mjs`; tiras de 0,2 s de cada acción clave, y una sola ronda de arreglos. El método Full Visual sigue mandando; esto le suma sonido, cámara y chequeos. Si necesitas un pincel, tiza, plumón, rig de personaje, look CRT o pantalla de app que se usa sola, copia la técnica del banco (§5 de `estilos-de-cine-f100k/SKILL.md`). Si la pieza pide otro estilo con nombre (acuarela, pizarra, anime de los 80, pixel, noticiero…), pásala a `estilos-de-cine-f100k`.

Un tema en una frase → un reel animado de 40 a 70 s. No hay avatar ni cámara: **la voz explica y la pantalla es la
explicación.** Un subtítulo dice cada palabra cuando suena y, debajo, se dibuja la cosa real de la que habla la frase,
que cambia en la palabra que la cambia. Quien lo ve sin sonido entiende todo. Quien lo ve una vez se lo puede
explicar a un amigo.

Si la persona trae un reel de referencia para copiar su estructura, usa `clonador-edicion-animada`: mide la referencia y
la trasplanta antes de seguir este mismo método.

Es el complemento de `auto-edicion`: usa su motor, su `mi-look.json` (voz y acento) y sus scripts.
`K` = `~/.claude/skills/auto-edicion` · `A` = esta skill · carpeta de trabajo: `~/Auto-Edicion/`.

Lee `A/referencia/metodo.md` antes de empezar: ahí están el plan visual, cómo mirar lo real, el gancho y la lista de
lo que se ve hecho con IA. Es la parte que hace que el reel se vea bien.

## Dos momentos y una sola aprobación

1. **El guion** (pasos 1 a 3). Se muestra y la persona elige el gancho o corrige palabras. **Es la única aprobación.**
2. **El video, de una vez** (pasos 4 a 9). Después del sí, nada espera: plan, crítica, voz, escenas, revisión y render.
   La persona ve un video terminado, no un plan ni una primera escena.

## 0. La primera vez
`bash K/scripts/instalar.sh`. Si no existe `~/Auto-Edicion/mi-look.json`, pide solo la **voz** y el **acento** como
dice el paso 1 de `K/SKILL.md` (aquí no hace falta avatar) y guárdalo.

## 1. Tema y fuentes
- Busca fuentes primarias (la empresa, el estudio, la documentación, el teardown, la patente). Cada cifra con su link y
  de qué es. Lo que no se puede confirmar no se dice. Guarda la tabla en `<proyecto>/datos.md`: `dato | cita textual | link`.
- Encuentra **la idea equivocada** del que mira, en 5 palabras («los AirPods tapan el ruido»). El reel existe para
  romperla. Si no hay una, usa la pregunta que todos se hacen y nadie sabe responder.
- Anota el **momento que la persona ya vivió** (el avión, el guante en invierno, el error que se corrigió solo) y el
  **material real** para dibujar: fotos del producto, la app, cortes, documentos. Guarda los links.

## 2. Guion
El molde de 8 pasos de `K/referencia/molde-guion.md`, con tres ajustes:
- La respuesta se da temprano (antes del segundo 10): «no es X, es Y».
- **Un solo dibujo sostenido**: cada idea nueva se pone sobre el mismo mundo (la onda, el mapa, la rejilla). Cambiar
  de metáfora en cada frase pierde a la gente.
- El cierre repite la primera frase, ya resuelta.

Gancho golpe con 3 variantes y su nota, como en el molde. Pregunta qué se regala a quien comente la palabra.

## 3. Muéstralo
En el chat: la idea equivocada, las 3 variantes de gancho con tu elegida y por qué, el guion y lo que la persona
guarda o comparte. Guárdalo en `<proyecto>/GUION.md`. Espera el sí.

## 4. Proyecto y plan visual
```
P=~/Auto-Edicion/<nombre-corto>
mkdir -p "$P"/{fuente/refs,fuente/notas,voz/rec}
cp A/plantilla/pieza.src.html A/plantilla/cap_apple.png "$P/fuente/"
```
Escribe el guion en `LINEAS` (una frase por objeto, `*clave*` en negrita, `osc: true` si va oscuro).
Después, `fuente/plan.md` según `A/referencia/metodo.md` §1: el mundo y sus tres escalas, el objeto hilo, el color
único de lo invisible y la tabla por escena con `palabra → qué cambia`. Baja las referencias reales a `fuente/refs/`.
Un agente nuevo critica el plan una sola vez (§1, «Crítica») y lo reescribe.

## 5. Voz: una sola toma
- Un solo `generate_audio` con el guion entero y la voz de `mi-look.json`. En el texto para la voz: cifras en letras
  («doscientas»), el CTA en minúscula (en MAYÚSCULAS lo deletrea) y un punto al final de cada frase.
- Antes de pedirla, di cuántos créditos cuesta (con `get_cost: true`; un guion de ~1.000 caracteres son 2,7 créditos
  con `text2speech_v2` · `elevenlabs` y entra entero en un solo pedido).
- `node A/scripts/partir-toma.mjs toma.mp3 "$P/fuente/pieza.src.html" "$P/voz"` → `voz/01.mp3`, `02.mp3`…
- `bash K/scripts/voz.sh "$P"` → `fuente/tiempos.json`. Si una frase tiene otra cantidad de palabras que tu texto,
  ajusta `LINEAS`.
- Si una palabra salió mal dicha, pide la toma entera de nuevo (3 como máximo sin preguntar). Nunca se parcha una
  frase suelta: se rompe la entonación. Si el pedido no acepta el guion entero, pídela en 2 o 3 párrafos y avisa.

## 6. Escenas
En `fuente/pieza.src.html`, una función de `ESC` por frase. Para cada una, en orden (`A/referencia/metodo.md` §2–§4):
1. Abre sus referencias a tamaño completo y escribe en `fuente/notas/escena-NN.md` lo que ves y qué cambia en cada
   palabra clave.
2. Dibújala desde las referencias, con su geometría, sus rótulos reales y en capas. Que algo entre o cambie justo
   en su palabra con `de(L, k)`. Capturas reales en `fuente/` y en `rutas`
   (`npx -y playwright@1.48.2 screenshot --viewport-size=1200,900 <url> fuente/cap.png`).
3. Llena el escenario (y 330 a 1470): ya no hay avatar abajo.

Con varios agentes: uno por escena, todos a la vez, y cada uno es su propio crítico. Solo tocan su función de `ESC` y
sus piezas (con el número de la escena en el nombre).

## 7. Mira, haz la pasada rica y revisa con máquina
```
bash K/scripts/vista.sh "$P" 1s,4s,8s,12s,16s,20s,24s,28s,32s,36s,40s,44s
```
Mira cada cuadro al lado de su referencia: ¿tan detallado como la foto?, ¿cambia algo en cada palabra clave?, ¿se
entiende sin sonido? Corrige. Después haz **la pasada rica** (§7): más detalle real y un segundo movimiento, sin
tocar los tiempos.
```
bash K/scripts/render.sh "$P" "$P/<nombre>.mp4"
node A/scripts/revisar.mjs "$P/<nombre>.mp4" --guion "$P/fuente/pieza.src.html"
```
El revisor falla si algo queda quieto más de 1,2 s (el último plano puede sostenerse), si hay 2 o más cuadros con el
escenario vacío, o si el cuadro 0 está vacío o no cambia nada entre 0 y 2 s. Avisa si la parte de abajo del escenario
queda vacía en más de la mitad del reel y si hay letra de menos de 32 px en la pieza. Arregla la escena dueña del
problema (`node A/scripts/donde.mjs "$P" <segundo>` te dice cuál es y qué palabra suena), vuelve a renderizar y mira
`apertura.jpg`.

La plantilla dibuja cada escena en y 330–1080 y la agranda sola para llenar el escenario. Si dibujas una escena para el
alto completo (330–1470), pon su número en `ALTO_COMPLETO`.

## 8. Entrega
Abre el video. Entrega el MP4, el gancho elegido con su nota, la fuente de cada cifra (`datos.md`), el caption y los
créditos gastados.

**El caption** (`<proyecto>/caption.txt`):
1. **Primera línea, menos de 125 caracteres** (lo que se ve antes de «más»): con regalo, «Comenta PALABRA y te mando
   [lo que llega]»; sin regalo, la promesa de lo que trae el caption. Nunca repite el gancho de la pantalla.
2. **El porqué**, en 2 a 4 frases con las palabras que alguien buscaría (el tema, la herramienta, el método): el
   caption lo leen el buscador de Instagram y Google.
3. **El valor completo**, no un adelanto: los pasos, la lista o el truco escritos enteros. El mensaje del regalo
   trae la versión larga.
4. **El cierre**: qué hacer con eso y a quién mandárselo («guárdalo y mándaselo a quien…»).
Sin hashtags, sin raya larga, sin «link en la bio» para algo que cabe en el caption. Una palabra de comentario nueva
por post.

## 9. Después de una nota
Nunca se rehace todo, porque se pierde lo que ya gustó. Ubica la escena por el segundo que nombran
(`node A/scripts/donde.mjs "$P" <segundo>`, o `--todo` para la lista entera), reábrela con la nota en sus palabras, vuelve a mirar la cosa real y ve más allá de
lo que pide la nota. Renderiza y revisa de nuevo. Lo que vale para todos los videos («siempre más movimiento») se
guarda en `~/Auto-Edicion/preferencias.md`.
