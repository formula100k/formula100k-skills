---
name: reel-collage-explicado-f100k
description: Convierte un reel de referencia (alguien explicando una idea a cámara) en un video EXPLICACIÓN FACELESS de 70 a 95 s editado como collage animado - papel envejecido con textura y grano, recortes de fotos vintage (con borde y sombra), el concepto central DIBUJADO en código para que cada frase pase literal en pantalla, cintas washi, etiquetas de rotuladora, sellos que caen con golpe, tiras de papel rasgado, sin temblor de escena, una capa filosófica con fuente verificada, tu voz, música opcional generada en tu computadora, efectos de sonido sincronizados y mezcla a −14 LUFS. Molde aprobado con el reel «Sesgo de supervivencia». Usar cuando digan «conviértelo en video explicación faceless», «hazlo en collage animado con texturas, imágenes y recortes», «como el del sesgo de supervivencia», «como el de los aviones», «explicación filosófica animada», «sin salir yo, con recortes» o pasen un link de alguien hablando a cámara y pidan la versión faceless editada. NO usar para reflexiones de 30 a 45 s con fotos y capturas propias (collage-reflexion-f100k), clips animados sueltos (animacion-dibujada-f100k) ni para editar un video grabado.
argument-hint: [link de Instagram o TikTok] [nota: tema o giro]
---

# Reel collage explicado (faceless)

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

## Reglas que mandan sobre todo lo de abajo
- **Guion simple:** resultado o idea con cifra real → directo a la historia (nada de frase puente tipo «Pero antes, una cosa…» o «Ya sé, parece trampa. Mira.»: suenan robóticas; si hace falta, un pico de interés REAL del caso: un dato, un giro o una escena concreta) → la idea explicada → CTA al cierre. Frases de 15 palabras o menos. Prohibido: token, skill, código, frames, agente, servidor. Si alguien que nunca abrió una IA no lo entiende, se reescribe.
- **Se anima lo que se dice, no la mecánica:** nada de diagramas de cómo funciona por dentro.
- **Gancho golpe:** el texto del gancho en pantalla lleva de 2 a 5 palabras, sin tercera línea; una línea ENORME y otra chica (rojo si es negativo, verde si es un logro, el acento de la marca si no), en letra de diseño que va con el tema, sin brillo ni degradado y con corte seco; negativo o polémico (orden que quita, diagnóstico que duele, algo prohibido) o una cifra real desnuda; sin nombrar Claude, prompt ni skill, y hablando de TI. Lleva al menos 1 palabra clave del video (la del CTA o la cifra real) y las dos líneas se leen como UNA frase. La primera frase hablada dice lo mismo en ≤ 12 palabras. Escribe 3 variantes A/B/C, puntúalas y entrega la más clara como principal.
- **Edición sin olor a IA:** el temblor de collage de la escena entera queda APAGADO (`PIXELES = 0`). La hoja se queda quieta; lo que se mueve son las piezas (recortes que entran, el dibujo que se arma), con frenado suave y sin rebote. Los recortes salen de fotos reales antes que de imágenes genéricas; nada de emojis ni íconos. Texto en letra de diseño, con palabras o líneas que aparecen en secuencia con corte seco y tamaños distintos en la misma frase; sin halo detrás de las letras. 1 apoyo cada 3–5 s; el único golpe va en el segundo 0–2.

El molde es `plantilla/collage-explicado.src.html`: el reel «Sesgo de supervivencia» (19 escenas, 88 s), aprobado tal cual.
El oficio visual (qué piezas hay, cómo se ve, qué no hacer) está en `references/oficio.md`. Léelo antes del paso 4.
El guion del molde está en `references/ejemplo-sesgo-guion.txt`.

Depende de:
- `animacion-dibujada-f100k` (instalada junto a esta): su núcleo de dibujo, `renderizar.mjs` y el recorte de fotos de `sistema.mjs`. Si falta, **dilo y detente**.
- Opcional: una IA de imagen (Higgsfield u otra) para recortes o textura, una voz con IA y ACE-Step 1.5 para la música. Nada de eso es obligatorio.

Rutas cortas que se usan abajo: `SK` = la carpeta de esta skill · `AD` = la carpeta `scripts` de `animacion-dibujada-f100k`.
Carpeta del proyecto: `DEST=~/Documents/mis-animaciones/<tema>/` en Mac y `DEST=~/mis-animaciones/<tema>/` en Windows, con `fuente/collage/`, `fuente/_intermedios/`, `voz/`, `musica/` y `sfx/`.

## Paso 0 · Lo de la persona
- **Marca** (acento, letra): `~/Documents/mi-contenido/mi-marca.md`. El dorado del molde (`C.oro`, `#F5C542`) se cambia por su acento si lo tiene; el rojo de «lo que falla» y el papel se quedan. Si no existe, pregunta o sigue con el del molde.
- **Negocio y regalo del CTA:** `~/Documents/mi-contenido/mi-negocio.md`. La palabra del CTA sale del regalo que la persona ya tiene. Si no tiene regalo, pregúntale qué ofrece; nunca inventes uno.

## El camino

0. **La nota que viene con el enlace es el tema.** No le cambies el ángulo.

1. **Mira la referencia de verdad** (en una carpeta temporal, no en la del proyecto):
   - `yt-dlp --write-info-json <URL> -o reel.mp4`. De la metadata salen la cuenta, los likes, los comentarios y el caption.
   - Transcríbela en la computadora: `node "$SK/scripts/sistema.mjs" transcribir reel.mp4 . --txt` (mlx-whisper en Mac con chip Apple, faster-whisper en Windows y Mac Intel; la primera vez baja el modelo).
   - Hojas de contacto (un cuadro cada 2 s): `ffmpeg -i reel.mp4 -vf "fps=0.5,scale=360:-1,tile=6x3" -frames:v 1 hoja.jpg`, que miras con Read.
   - Anota qué imagen abre el video. Esa imagen (o su concepto) va **dibujada en código** en la portada.
   - No analices nada que no descargaste.

2. **Escribe el guion en `$DEST/guion.txt`: una frase por renglón = una escena.** Son 17 a 20 frases y 70 a 95 s.
   - **Traducción fiel** de la referencia, en español neutro y tuteando. Las cifras salen solo de lo que se oye o se lee en ella.
   - **La capa filosófica, en dos frases**: una historia antigua que diga lo mismo, con fuente verificada (libro y pasaje). Si está instalada `storytelling-filosofico-f100k`, busca primero en su banco de `references/`; si no, búscala en la web y confirma el pasaje. Va después de explicar la idea y antes de nombrarla. En el molde: Diágoras y las tablillas de los náufragos (Cicerón, *De natura deorum* III, 89). Si no encuentras una con fuente, no la inventes: sigue sin ella y dilo.
   - **Remate**: la frase que cierra la idea (en el molde, «pregúntate cuántos aviones no volvieron»).
   - **Cierre + CTA en una frase**: «Este video lo armé con IA, recorte por recorte. Comenta X y te mando…», con la palabra del regalo de la persona. Si el regalo tiene página, comprueba que responda antes de usarla.
   - En el guion, la palabra del CTA va en minúscula para que la voz no la deletree.

3. **Plan visual (antes de buscar nada).** Por escena, una línea: qué recorte entra, qué pieza de código lo acompaña y **qué se cumple literal**.
   - Si dice «cada punto es un balazo», los puntos aparecen uno a uno.
   - Si dice «blindar», salen las placas.
   - Si dice «al revés», la hoja se voltea.
   - El concepto central se dibuja en código, no se genera: así puede cambiar con la voz.
   - Lista los recortes que necesitas: unos 8, más la textura de papel. Cada uno tiene que servir a una frase.

4. **Recortes y papel.** Elige con la persona (di el costo antes si lo hay):
   - **Gratis (por defecto):** fotos de archivo libres para uso comercial — Wikimedia Commons (dominio público), Openverse (`https://api.openverse.org/v1/images/?q=<tema>&license=cc0,pdm,by,by-sa`), archivos de museos con licencia abierta — o fotos propias de la persona. Anota el autor y la licencia en el LEEME.
   - **Opcional, con IA de imagen** (Higgsfield, ChatGPT, Gemini u otra): «Vintage … archival photograph of …, sepia film grain, no insignia, isolated on a plain pure white background, collage cutout style». Textura: «Full frame texture of old cream colored paper, subtle fibers, light folds and creases, faint coffee stains near edges… no objects, no text, flat scan», en 9:16.
   - Recorte **gratis y en la computadora**, una por foto: `node "$AD/sistema.mjs" recortar img/x.jpg img/x-recorte.png` y después `node "$AD/sistema.mjs" achicar img/x-recorte.png "$DEST/fuente/collage/x.png" 1100` (la primera vez el recorte baja su modelo).
   - Papel: foto o escaneo de una hoja vieja, una textura libre o la de IA → `ffmpeg -i papel.jpg -vf scale=1080:1920 "$DEST/fuente/collage/papel.jpg"`. Sin papel, la pieza usa el color crema.
   - Arma una hoja con todos los recortes y mírala.
   - Nada de caras de personas reales inventadas. Si no hay retrato libre de alguien, usa un objeto suyo (lentes y cálculos para Wald) o una escultura genérica con su nombre en etiqueta aparte.

5. **Dibuja la pieza.** Copia `$SK/plantilla/collage-explicado.src.html` a `$DEST/fuente/pieza.src.html` y cambia:
   - `LINEAS` (frase + `d`), `GANCHO` (dos tiras), `PALABRA_CTA`.
   - `RUTAS` con los nombres de tus recortes.
   - `ESC[i]`, una función por frase `(u, d, t)`. Reusa las piezas de `references/oficio.md`. Si el concepto central no es un avión, sustituye `avion()`/`hoja()` por tu propio diagrama dibujado, con la misma lógica de opciones animables (`o.puntos`, `o.blindaje`…).
   - `CONTINUA` (escenas que comparten tablero y no llevan fundido) y `OSCURA` (escenas sobre negro con neón: las del remate y el CTA).
   - `EFECTOS`: un sonido por cada cosa que entra, en el mismo segundo que su animación (ver la cabecera de la lista).

6. **Mide con la voz de prueba y revisa antes de la voz final** (gratis):
   - `node "$SK/scripts/voz.mjs" "$DEST/fuente/pieza.src.html" "$DEST/voz-prueba" "$DEST/fuente/_intermedios/prueba.mp4" --prueba` → la computadora lee cada frase, escribe las duraciones en `LINEAS` y sale un borrador con voz.
   - `node "$AD/renderizar.mjs" "$DEST/fuente/pieza.html" "$DEST/hoja.jpg" --hoja 3` y mira la hoja. Después 6 a 8 cuadros grandes con `--cuadros 0,18s,…`.
   - Revisa: nada importante fuera de y 250–1320, el subtítulo en y 1402 sin taparse con nada y el primer cuadro con la portada completa (gancho + diagrama).

7. **La voz final.** Elige con la persona:
   - **Su voz (gratis, la mejor):** que grabe cada frase por separado y te pase `voz/01.m4a`, `02.m4a`…
   - **Opcional, voz con IA** (su voz clonada en ElevenLabs, Higgsfield u otra; di el costo antes): una frase por audio, con `index` = número de frase; baja cada audio a `voz/01.mp3`, `02.mp3`…
   - Luego: `node "$SK/scripts/voz.mjs" "$DEST/fuente/pieza.src.html" "$DEST/voz" "$DEST/fuente/_intermedios/con-voz.mp4"` (escribe las duraciones reales en `LINEAS`).

8. **Comprueba lo que dice**: `node "$SK/scripts/sistema.mjs" transcribir "$DEST/fuente/_intermedios/con-voz.mp4" "$DEST/fuente/_intermedios" --txt` y compáralo con el guion. Si una frase salió mal, rehaz solo esa y repite el paso 7.

9. **Sonido y renders finales:**
   - Música (opcional): sin música es válido (la persona puede ponerla al publicar), una pista libre de derechos que ya tenga, o una propia en su computadora con ACE-Step 1.5 (`scripts/musica.py`, ver su cabecera; unos 2 min por pista en Mac con chip Apple): `uv run python "$SK/scripts/musica.py" "$DEST/musica" <duración+8> G H` desde la carpeta de ACE-Step. G (piano documental) fue la aprobada.
   - Efectos: `uv run "$SK/scripts/efectos.py" "$DEST/fuente/pieza.src.html" "$DEST/sfx"` (se sintetizan con ffmpeg: no hay archivos de terceros).
   - Mudos: `node "$AD/renderizar.mjs" "$DEST/fuente/pieza.html" "$DEST/fuente/_intermedios/mudo-consubs.mp4"`. Para la versión limpia, una copia con `const SUBTITULOS = false;` → `mudo-sinsubs.mp4`.
   - Mezcla: `node "$SK/scripts/mezclar.mjs" <mudo> "$DEST/fuente/_intermedios/con-voz.mp4" <musica.wav o -> "$DEST/sfx/efectos.wav" "$DEST/<TEMA>-CON-VOZ.mp4"`. Haz lo mismo con el mudo sin subtítulos (`<TEMA>-SIN-SUBTITULOS.mp4`).

10. **Entrega** en `$DEST`:
    - Los MP4 finales arriba; lo intermedio, en `fuente/_intermedios/`.
    - Un `LEEME.md` con el guion, de dónde sale cada dato (la fuente de la historia antigua), el crédito y la licencia de cada imagen, las decisiones sin visto bueno y lo pendiente.
    - Ábrele el video: `node "$SK/scripts/sistema.mjs" abrir "$DEST/<TEMA>-CON-VOZ.mp4"`.

## Límites honestos (dilos al entregar)

- Si nadie oyó el audio (solo se comparó la transcripción), dilo. Whisper confunde palabras («trend» → «tren»).
- Una voz leída frase por frase no encadena la entonación.
- La historia antigua es un agregado tuyo: va en el LEEME con su fuente.
- Es una recreación de una idea ajena: en el caption hay que darle crédito a la cuenta de la referencia.
- Si el CTA depende de una automatización de mensajes, confirma que esté armada.

## Golpe visual en los primeros 2 segundos

Entre el segundo 0 y el 2 tiene que pasar algo que frene el dedo, y tiene que ser propio de esta pieza, no una apertura reciclada.

1. **El cuadro 0 va lleno.** Nada de arrancar en fondo vacío, con fundido o con una animación de entrada que arma la escena desde cero: lo que se ve, ya está.
2. **Antes de 2 s, al menos uno de estos, fuerte:** movimiento grande (algo que cruza o tapa el cuadro, un empuje o zoom rápido, un objeto que cae), contraste de color o de brillo (un bloque saturado, una luz), una imagen rara o inesperada (escala absurda, objeto fuera de lugar).
3. **Algo cambia entre 0 y 2 s.** Si los cuadros se ven iguales, no hay golpe.
4. **Vertical y a pantalla completa** desde el primer cuadro (nada de franjas negras).
5. **Un título de texto solo no cuenta como golpe:** el golpe es visual; el texto lo acompaña.

**En este formato:** la portada ya está completa en el cuadro 0; además, antes de 2 s algo tiene que moverse (un recorte que entra, un empuje sobre la hoja, una marca que se dibuja).

**Revisión antes de entregar:** saca los cuadros y míralos juntos (con Read):
```
ffmpeg -loglevel error -y -t 2.5 -i FINAL.mp4 -vf "fps=2,scale=270:-2,tile=5x1" -frames:v 1 apertura.png
```
Si no hay golpe, se corrige antes de entregar. En el reporte, di en una línea cuál es el golpe («0,4 s: el recorte tapa el cuadro»).

## EN TU COMPU
- **Marca:** `~/Documents/mi-contenido/mi-marca.md` (acento y letra). **Negocio:** `~/Documents/mi-contenido/mi-negocio.md` (a quién le habla y qué regalo tiene para el CTA). Si no existen, se pregunta.
- **Videos terminados:** `~/Documents/mis-animaciones/<tema>/` en Mac y `~/mis-animaciones/<tema>/` en Windows.
- **Programas:** Node 18+, ffmpeg, Google Chrome, yt-dlp (para bajar la referencia) y `uv` (transcribir con Whisper, recortar fotos y correr `efectos.py`). Usa el motor de `animacion-dibujada-f100k` (su `npm install` instala `playwright-core`); esta skill no tiene `package.json`.
- **Internet:** para bajar la referencia y las fotos libres.
- **Mac y Windows:** todo corre con `node` o `uv run`. `scripts/sistema.mjs` elige solo: voz de prueba con `say` en Mac y con las voces de Windows; Whisper con mlx-whisper en Mac con chip Apple y faster-whisper en lo demás; recorte con Vision en Mac y rembg en lo demás.
- **Opcionales:** imágenes con IA, voz con IA y música con ACE-Step 1.5 (`ACESTEP_DIR`; MLX en Mac con chip Apple, PyTorch en Windows con tarjeta de video). Ninguno es obligatorio.
