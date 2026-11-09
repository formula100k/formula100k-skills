---
name: clonador-de-edicion-f100k
description: Clonador de edición. Hace videos verticales «¿Qué pasaría si…?» (9:16, sin mostrar la cara, con voz narrada) clonando el estilo de un video de referencia. Baja la referencia, estudia su gramática visual (paleta, letra, cómo entran las cifras, ritmo), escribe una historia nueva en ese molde, dibuja cada cuadro con código (2D en canvas o 3D con three.js), le pone la voz y entrega el MP4 con subtítulos. Trae un catálogo de 56 estilos con su video de referencia (estilos/catalogo.md). Usar cuando digan «hazme un video qué pasaría si», «clona este estilo», «video what if», «usa el estilo [nombre del catálogo]», «video sin mostrar mi cara con voz», «clonador de edición», o peguen el link de un reel de ese formato. NO usar para editar un video grabado ni para reels hablando a cámara.
argument-hint: [tema o pregunta] [estilo del catálogo o link de referencia]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Clonador de edición: «¿Qué pasaría si…?» con el estilo que te guste

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Un video vertical donde una pregunta imposible se responde paso a paso, con cifras que crecen, diagramas que se
dibujan solos y una voz que narra. **Cada cuadro se dibuja con código**: sin generadores de video, sin cámara.
Lo único que puede costar algo es la voz.

## 🧰 EN TU COMPU

Esta skill viaja en el módulo de Edición y corre igual en Mac y en Windows (todos los comandos son `node`).

- **Programas:** Node 18 o más nuevo, ffmpeg y Google Chrome. `node scripts/preparar.mjs` revisa todo e instala lo que
  falta de la skill (`playwright-core`, con `npm install`). Para links de Instagram, TikTok o YouTube como referencia:
  `yt-dlp`. Los estilos del catálogo no lo necesitan.
- **Tu negocio:** `~/Documents/mi-contenido/mi-negocio.md` (qué vendes y a quién). Si no existe, pregunta en un solo
  mensaje el tema; no inventes oferta, precio ni cifras.
- **Tu marca:** `~/Documents/mi-contenido/mi-marca.md` (o su manual `mi-marca/marca.md`). Aquí el estilo lo pone la
  referencia: la marca solo entra si la persona lo pide (por ejemplo, el color de acento o su @ en la tarjeta final).
- **Dónde guardar:** cada video en `~/Documents/mis-videos-editados/<proyecto>/` (en Windows, la carpeta Documentos de
  su usuario). Esa es la `<carpeta>` de los pasos.
- **La voz no obliga a pagar nada:** su propia voz grabada con el celular, o la voz de la compu para medir el ritmo.
  La voz con IA (Higgsfield) es opcional.
- `$SKILL` es la carpeta de esta skill (la que tiene este `SKILL.md`); los comandos de abajo corren desde ahí.
- **Abrir un archivo:** `node scripts/sistema.mjs abrir "<ruta>"` (sirve en Mac y en Windows).

## El camino

### 1. El tema y el estilo
- El tema es la pregunta: «¿Qué pasaría si…?». Si la persona dio un negocio, la pregunta toca el problema que resuelve
  sin nombrar su producto: el video atrae, no vende de frente.
- El estilo sale, en este orden: un link o video que pegó la persona → un estilo del catálogo (`estilos/catalogo.md`,
  búscalo por nombre o slug) → si no dio ninguno, propón 3 del catálogo que le queden al tema y que elija.

### 2. Mira la referencia de verdad
```
node scripts/referencia.mjs <url-del-catálogo-o-link> <carpeta>/referencia
```
Deja `hoja.jpg` (un cuadro cada 2 s) y `cuadros/1..6.jpg`. **Ábrelos y míralos todos** antes de escribir nada.
Escribe en `<carpeta>/estilo.md` la ficha del estilo:
- Fondo y paleta (los hex aproximados), cuántos acentos y para qué se usa cada uno.
- Letra: familia parecida (de Google Fonts), peso, dónde va la pregunta, cómo es el subtítulo.
- Cómo entra una cifra: tamaño, posición, si cuenta hacia arriba, unidad chica al lado.
- Qué se dibuja: diagramas de línea, 3D low-poly, plastilina, papel, pixel… y si hay HUD, medidores o cronómetros.
- Ritmo: cuánto dura cada escena, si hay cambios de fondo (claro/oscuro), cómo cierra.
- **Lo que NO se copia**: el texto, la premisa, los personajes, logos o marcas de agua de la referencia.

### 2b. Sin olor a IA (por defecto, aunque la referencia lo haga)
- **Nada tiembla ni rebota**: no uses `resorte`, `rebota`, shake ni wiggle del núcleo; para movimiento, `aterriza` o `ease`.
  Lo único que se mueve es lo que cuenta la historia (una cifra que cuenta, un trazo que se dibuja, una cámara lenta).
- **Texto con corte seco**: pregunta, cifras y subtítulos aparecen enteros en su cuadro (sin fade, slide, escala ni tecleo).
  Tamaños distintos en la misma frase: la clave enorme, los conectores chicos.
- **Sin brillos ni degradados**: nada de `glow`, `estrellita` ni la tiza mágica con chispas; colores planos de la ficha.
- **Letra de diseño** que vaya con el tema (serif itálica, condensada de póster…), no una sans genérica por defecto.
- Si la escena nombra algo real (una app, una página, un producto), mejor su **captura real** que un ícono o un emoji.

### 3. El guion: una frase = una escena
- 8 a 14 frases, de 15 palabras o menos, en el idioma de la persona y tuteando. Entre 30 y 60 s en total.
- Molde: la pregunta → el primer efecto (pequeño) → escalada con cifras → un giro («pero…») → el remate → una
  pregunta final que invite a comentar.
- **Cifras**: solo las que salen de cuentas simples con un supuesto dicho en voz alta («si cada uno te toma una hora,
  son treinta horas») o de una fuente que puedas citar. Si no tienes fuente, no la pongas. Anota en `LEEME.md` de
  dónde salió cada número.
- Marca con `*asteriscos*` la palabra clave de cada frase: el subtítulo la pinta en el color de acento.

### 4. Dibuja la pieza
Copia el molde que más se acerca a la ficha a `<carpeta>/fuente/pieza.src.html`:

| Molde | Para | Qué trae |
|---|---|---|
| `plantilla/grafico-minimal.src.html` | gráfico plano, editorial, pantallas oscuras, planos | pregunta, cifra gigante con unidad, rejilla de cuadritos, anillo, regla, curva, subtítulo de dos tonos, escenas oscuras, tarjeta final |
| `plantilla/lowpoly-3d.src.html` | low-poly, juguete, ciudades, cine en 3D | escena three.js (cámara que orbita, bloques que crecen) con la letra encima en 2D |

Copia también la carpeta `nucleo/` al lado de `fuente/` (o arma con `scripts/armar.mjs`, que la mete dentro).
Cambia `ESTILO` con la ficha, `PREGUNTA`, `LINEAS` (frase + duración `d` aproximada) y `ESC`: una función por frase.
- En `grafico-minimal`, cada escena recibe `q` = avance de la frase de 0 a 1. **Pon los tiempos en fracciones de `q`**,
  nunca en segundos: así la animación termina aunque la voz real dure más o menos.
- `draw(frame)` es función pura del cuadro: nada de `Math.random` ni `Date` (usa `rng(semilla)` o `hash2`).
- Zona segura: nada importante arriba de y 250 ni abajo de y 1470.
- **Estilos en 3D**: el molde `lowpoly-3d` carga three.js r128 de cdnjs, dibuja en un canvas oculto y lo copia
  cada cuadro al lienzo que se graba. Para plastilina usa materiales mate y colores pastel; para juguete, bloques
  con bordes redondeados (`RoundedBoxGeometry` no viene en r128: escala cajas y suma esferas); para cine, niebla
  (`scene.fog`) y una luz direccional baja.
- Ilustración y papel: usa `hacerPapel`, `grano`, `acuarela` y `pincel` del núcleo.
- Si dibujas personajes, que sean estilizados (pixel, cuadrito, silueta) y declara en la pieza
  `// ANATOMIA: estilizada — <por qué>`: el render frena si ve manos o caras dibujadas en vector.

### 5. Revisa antes de la voz
```
node scripts/armar.mjs <carpeta>/fuente/pieza.src.html
node scripts/renderizar.mjs <carpeta>/fuente/pieza.html <carpeta>/hoja.jpg --hoja 2
```
Abre la hoja y compárala con la de la referencia: ¿se reconoce el estilo? ¿Cada cifra termina de contar? ¿Se lee
el subtítulo en el celular? ¿Algo se sale del cuadro? Arregla y repite.

### 6. La voz
Elige con la persona (pregúntale si no lo dijo). Las dos primeras son gratis:
- **Su propia voz** (la recomendada): que grabe cada frase en un audio aparte (`01.m4a`, `02.m4a`…), con el celular sirve.
- **Voz de la compu** (gratis, sirve para medir el ritmo y para un borrador; suena a robot, no para publicar):
  `node scripts/sistema.mjs voz "frase" <carpeta>/voz/01.wav` (una por frase; `node scripts/sistema.mjs voces` lista
  las voces en español de la compu). En Windows, si no hay voz en español, se agrega en Configuración → Hora e idioma → Voz.
- **Voz con IA (opcional, cuesta créditos):** si tiene el conector de Higgsfield en Claude: `list_voices` →
  `generate_audio_batch` con `model: "text2speech_v2"`, `variant: "elevenlabs"` y la voz que elija, un pedido por frase,
  **de a 5 por tanda**. Dile el total de créditos antes de generar. Palabras en MAYÚSCULAS se deletrean: escríbelas en minúscula.

Pon los audios en `<carpeta>/voz/` numerados en el orden del guion y corre:
```
node scripts/voz.mjs <carpeta>/fuente/pieza.src.html <carpeta>/voz <carpeta>/video.mp4
```
Recorta el silencio de cada audio, escribe su duración en `LINEAS`, renderiza y pega la voz al inicio de cada escena.

### 7. Comprueba y entrega
- Saca otra hoja del video final y míralo. Si la skill `editor-video-formula100k` está instalada, puedes transcribir el MP4
  (`node <editor>/scripts/editar.mjs <video.mp4> --solo-corte --carpeta <carpeta>/revision`) y comparar `captions.json` con el guion.
- Entrega en `<carpeta>/`: `video.mp4`, `fuente/`, `voz/`, `estilo.md` y `LEEME.md` (guion, de dónde salió cada
  cifra, qué estilo se clonó). Ábrele el video con `node scripts/sistema.mjs abrir <carpeta>/video.mp4`.

## Ejemplo
`ejemplo/` trae la pieza (`pieza.src.html`) y su hoja de contacto (`hoja.jpg`) de un video hecho con el molde
`grafico-minimal` clonando el estilo Swiss Grid del catálogo («¿Qué pasaría si publicaras un reel cada día por un año?»).
Para verlo en video: `node scripts/armar.mjs ejemplo/pieza.src.html <carpeta>/pieza.html` y
`node scripts/renderizar.mjs <carpeta>/pieza.html <carpeta>/ejemplo.mp4`.
