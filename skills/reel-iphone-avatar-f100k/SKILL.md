---
name: reel-iphone-avatar-f100k
description: Reel animado estilo «iPhone + avatar abajo» (inspirado en un reel de @Koen Salo) — subtítulo de 2–3 palabras con la selección de texto de iPhone arriba, UNA ilustración plana iOS al centro, tu avatar abajo cambiando de pose cada 1–2 s (o sin avatar), fondo claro u oscuro según el tono y tu voz. Cada cuadro se dibuja con código y se renderiza en tu computadora (gratis) con el motor de animacion-dibujada-f100k. Usar cuando digan «hazlo con el avatar abajo», «estilo iPhone con avatar», «animación tipo iPhone con avatar explicando», «explica este estudio con mi avatar», «/reel-iphone-avatar <tema>». NO para clonar un estilo nuevo desde un link (clonador-animaciones-f100k) ni para editar un video hablado a cámara.
argument-hint: <tema o estudio a explicar>
---

# Reel «iPhone + avatar abajo»

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Un reel vertical de 40–60 s donde tu avatar explica un tema (un estudio, una noticia, un dato) con la estética de iOS.
**Cada cuadro se dibuja con código** y se renderiza en tu computadora: no cuesta nada. Lo único opcional que puede costar
es una voz con IA o poses del avatar hechas con IA.

## Lo que trae la skill
- **Ficha del estilo:** `referencia/estilo.md` (composición, paleta, ritmo, lo que no se copia) y `referencia/hoja-ref.jpg` (cuadros de la referencia).
- **Molde funcionando:** `plantilla/ejemplo-86.src.html` (13 escenas: gancho golpe, subtítulo iOS, teclado del CTA, píldoras, chat, rejilla de personitas, tarjetas).
- **Guion de ejemplo con fuentes y variantes de gancho:** `referencia/ejemplo-guion.md`.
- **Scripts (Node, iguales en Mac y Windows):** `scripts/voz.mjs`, `scripts/armar.mjs`, `scripts/render.mjs`, `scripts/cuadros.mjs`.
- Motor de render: la skill `animacion-dibujada-f100k` (su `nucleo/nucleo.js` y `scripts/renderizar.mjs`), instalada junto a esta. Si falta, **dilo y detente**.

## Paso 0 · Tu marca, tu negocio y tu avatar
- **Marca** (colores y letra): `~/Documents/mi-contenido/mi-marca.md`. Si no existe, pregunta en un solo mensaje el color de acento y la letra, y ofrece guardarlo ahí. El rojo, el azul iOS y el fondo claro/oscuro del estilo se quedan; tu acento entra en las claves y en el gancho si va con el tema.
- **Negocio** (a quién le habla, qué vende, qué regalo tiene para el CTA): `~/Documents/mi-contenido/mi-negocio.md`. Si no existe, pregunta.
- **Avatar** (carpeta `avatar/` del proyecto con `p01.png`, `p02.png`… transparentes, de la cintura para arriba, cortadas por el borde de abajo). Elige con la persona:
  1. **Gratis, con sus fotos (por defecto).** Pídele de 6 a 12 fotos suyas de la cintura para arriba con gestos distintos (señala arriba, pulgar arriba, manos en la cara, encoge los hombros, mano de «alto», pensando, sosteniendo el celular). Recórtalas en su computadora:
     `node <skill>/scripts/sistema.mjs recortar foto.jpg avatar/p01.png` (una por foto; la primera vez baja el modelo).
     Anota en `avatar/POSES.md` qué es cada una.
  2. **Opcional, caricatura con IA.** Con cualquier IA de imagen (Higgsfield, ChatGPT, Gemini u otra) a partir de una foto suya: primero una pose base y después cada pose nueva **con esa imagen como referencia**: «The exact same cartoon character from the reference image (same face, hair, clothes, same illustration style, same scale and waist-up framing cut at the bottom edge). New pose: … Transparent background, no text.» Si la IA cobra, di el costo antes.
  3. **Sin avatar.** En la pieza, `const AVATAR = false;`: la ilustración baja al centro y todo lo demás sigue igual.
  Pon en `N_POSES` cuántas poses hay.

## Pasos

### 1. Tema y fuente
- Tema = `$ARGUMENTS`. Si es un estudio o una noticia, busca la **fuente primaria** y anota cada cifra con su link. No inventes cifras. Lee con cuidado **de qué es** la cifra (ej.: 86 % de las *decisiones*, no de las *personas*).
- Liga el tema al negocio de la persona al final (la parte que habla de TI) y elige un CTA con una palabra ligada al tema, hacia un regalo que la persona ya tenga. Si no tiene regalo, pregúntale qué ofrece.

### 2. Gancho golpe (es lo que más se rechaza, revísalo dos veces)
Escribe 3 variantes A/B/C y **puntúa cada una en voz alta** contra esta lista; la principal debe cumplir TODO:
- [ ] 2 a 5 palabras en total, dos líneas: una **ENORME** (ocupa ~90 % del ancho) y una chica. Sin tercera línea.
- [ ] Las dos líneas se leen como **una sola frase** con sentido.
- [ ] Lleva **la cifra real** o **la palabra del CTA**.
- [ ] Negativa o polémica; sin nombrar Claude, prompt ni skill; habla de TI.
- [ ] Letra de diseño que va con el tema (en el ejemplo: chica en *Instrument Serif* itálica blanca, enorme en *Anton* roja), sin brillo, sin degradado, corte seco, fondo oscuro.
- [ ] La primera frase de la voz dice lo mismo que la pantalla en **12 palabras o menos**.
- El golpe dura lo que la voz tarda en decir la parte del gancho: `GOLPE` = inicio de la palabra siguiente (ver `GOLPE = …ws[6].s` en el molde).
- Ejemplo de gancho flojo: «la IA / DECIDE POR TI» → sin cifra ni palabra clave, línea grande chica y letra genérica.

### 3. Guion: una frase = una escena
- 10 a 14 frases de ≤15 palabras, tuteando, sin frase puente («pero antes…», «una cosa…»). CTA a mitad (con el teclado) y al cierre.
- Por frase: `osc` (fondo oscuro si es drama o peligro), qué se dibuja al centro (captura REAL si se nombra algo real) y las **poses**.
- **Poses: 2 o 3 por frase**, cada una entra en la palabra que toca: `poses: [[índiceDePalabra, nPose], …]`. Una sola pose por frase se ve congelada. La pose acompaña lo que se dice (ver `avatar/POSES.md`). No repitas la misma pose en frases seguidas.
- Guarda el guion en `<proyecto>/GUION.md` con variantes de gancho, fuentes y caption (formato de `referencia/ejemplo-guion.md`), y las frases solas, una por renglón, en `<proyecto>/frases.txt`.

### 4. Carpeta del proyecto
Mac: `P=~/Documents/mis-animaciones/<proyecto>` · Windows: `P=~/mis-animaciones/<proyecto>`. `SK` = la carpeta de esta skill.
```
mkdir -p "$P/fuente" "$P/voz" "$P/avatar"
cp "$SK/plantilla/ejemplo-86.src.html" "$P/fuente/pieza.src.html"
```
Pon las poses en `$P/avatar/`. Edita `LINEAS` (txt con `*clave*`, `osc`, `poses`), `PALABRA` (la del CTA) y `ESC` (una función por frase; tiempos en fracciones de `q` o en el inicio de una palabra `L.ws[k].s`). Copia las capturas reales a `fuente/` y agrégalas a `rutas`.

### 5. Voz
Elige con la persona (di el costo antes si lo hay):
- **Su voz (gratis, la mejor).** Que grabe cada frase por separado (con el celular sirve) y te pase los audios como `voz/01.m4a`, `voz/02.m4a`…
- **Voz de prueba de la computadora (gratis)** para medir tiempos y revisar: `node "$SK/scripts/voz.mjs" "$P" --prueba "$P/frases.txt"`. No se entrega como voz final salvo que la persona lo pida.
- **Opcional: voz con IA** (su voz clonada en ElevenLabs, Higgsfield u otra). Una frase por audio, cifras escritas en letras («ochenta y seis por ciento»), palabras en MAYÚSCULAS en minúscula para que no las deletree. Descárgalas a `voz/01.mp3…`.
Con los audios en `voz/`: `node "$SK/scripts/voz.mjs" "$P"` → recorta silencios (`voz/rec/`) y saca `fuente/tiempos.json` con Whisper en la computadora (mlx-whisper en Mac con chip Apple, faster-whisper en Windows y Mac Intel).
- Si Whisper corta la frase en otra cantidad de palabras que tu `txt`, ajusta el `txt` para que coincidan (ej. «86» y «%» van separados) o el reparto cae a letras.

### 6. Revisa antes del video completo
```
node "$SK/scripts/armar.mjs" "$P"
node <animacion-dibujada-f100k>/scripts/renderizar.mjs "$P/fuente/pieza.html" "$P/fuente/f" --cuadros 0.5s,1.5s,3s,6s,…
```
Mira los cuadros: el gancho ocupa el ancho, nada se encima (píldoras: mide el texto con `medir` y coloca el resto a la derecha), el subtítulo se lee, el avatar cambia de pose dentro de la frase. Si sale `errores de la página`, arréglalo (ojo: `clamp`, `lerp`, `prog` son del núcleo y no existen en el primer `<script>`). Los avisos `ERR_FILE_NOT_FOUND` son fotos que faltan (avatar o captura): revisa si es a propósito.

### 7. Render, voz y entrega
```
node "$SK/scripts/render.mjs" "$P" "$P/<nombre>.mp4"
node "$SK/scripts/cuadros.mjs" "$P/<nombre>.mp4" "$P/hoja.jpg" 1 4 8 12 16 20 24 28 32 36 40 44
```
Mira la hoja. Escribe `LEEME.md` (cómo rehacerlo, gasto, pendientes), abre el video (`node <skill>/scripts/sistema.mjs abrir "$P/<nombre>.mp4"`) y reporta: gancho elegido con su puntaje, fuente de cada cifra, gasto (si hubo) y pendientes (su visto bueno, la palabra del CTA en su automatización de mensajes).

## No hacer
- Nada tiembla ni rebota; texto y poses entran con corte seco. La cifra puede contar y quedarse quieta.
- No dibujes manos ni caras en vector (el render lo bloquea): personas = personitas tipo ícono o el avatar PNG.
- No copies el tema, los textos ni el avatar de la referencia.
- No publiques nada sin el visto bueno de la persona.

## EN TU COMPU
- **Marca:** `~/Documents/mi-contenido/mi-marca.md` (colores y letra). **Negocio:** `~/Documents/mi-contenido/mi-negocio.md` (a quién le habla, oferta, regalo del CTA). Si no existen, se pregunta.
- **Videos terminados:** `~/Documents/mis-animaciones/<proyecto>/` en Mac y `~/mis-animaciones/<proyecto>/` en Windows.
- **Programas:** Node 18+, ffmpeg, Google Chrome y `uv` (transcribe con Whisper y recorta las fotos del avatar). Usa el motor de `animacion-dibujada-f100k` (su `npm install` instala `playwright-core`); esta skill no tiene `package.json`.
- **Internet** al renderizar: las letras (Google Fonts) se bajan en ese momento.
- **Mac y Windows:** todo corre con `node`. `scripts/sistema.mjs` elige solo: voz de prueba con `say` en Mac y con las voces de Windows; Whisper con mlx-whisper en Mac con chip Apple y faster-whisper en lo demás.
- **Nada de pago obligatorio:** voz con IA y avatar con IA son opcionales.
