---
name: curiosidades-virales-f100k
description: Serie «Curiosidades virales». Toma una curiosidad que ya explotó en otra cuenta (ej. «¿por qué los aviones no vuelan en línea recta?»), la rehace 100 % con Claude (cada cuadro dibujado con código, apertura en 3D si la referencia es 3D, imágenes reales de la NASA o capturas reales, tu voz, efectos de sonido) y cierra con un CTA a tu regalo: un celular que baja por la página completa del regalo. Render en tu computadora, gratis. Usar cuando digan «otra curiosidad viral», «siguiente de la serie de curiosidades», «haz la curiosidad de [tema]», «clona este video de curiosidad», «como el de los aviones», «como el de tu mapa te miente», o peguen el link de un reel de curiosidad o ciencia explicada con animación. NO para reels hablando a cámara ni para clonar un estilo de animación cualquiera (clonador-animaciones-f100k).
argument-hint: [link del reel de referencia o tema de la curiosidad]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video tiene a alguien hablando (tú, una clienta o una voz clonada), ANTES de montar nada se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md` con todas sus optimizaciones: (0) preparar la toma (30 fps, espejo, volumen si es bajita);
> (1) la skill de cortes con pase semántico, nunca un script suelto de silencios; (2) transcripción leída entera y muletillas o repeticiones fuera a mano
> (`recortar.py`); (3) `escuchar_corte.py` tramo por tramo + segundo pase de aire (`apretar.py`) y subtítulos sobre una transcripción nueva;
> (4) oído Gemini sobre el corte y el final si hay llave (si no, se avisa en la primera línea de la entrega); (5) el sello del protocolo en NOTAS.
> Sin el sello, el video no está terminado.


# Curiosidades virales, rehechas con Claude

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Molde: el clon «tu mapa / TE MIENTE» (sobre un reel de @viani.pro), aprobado después de dos correcciones que esta skill ya trae puestas:
1. **Si la referencia abre en 3D, el clon abre en 3D desde el cuadro 0.** La versión que abría en un mapa plano se rechazó.
2. **El cierre muestra TODO lo que trae el regalo**: el celular baja por la página entera, no por la portada quieta.

Ejemplo completo: `ejemplo/aviones.src.html` (pieza) y `ejemplo/LEEME-aviones.md` (guion, cifras con fuente, gancho).
La pieza necesita sus imágenes en `assets/`: `formas.js` viene en `ejemplo/assets/`; las texturas de la NASA se bajan con
`scripts/bajar-texturas.mjs` (ver `texturas.md`) y la página del regalo se captura con `scripts/capturar-pagina.mjs`.

Depende de `animacion-dibujada-f100k`, instalada junto a esta (su núcleo de dibujo, `renderizar.mjs` y `playwright-core`). Si falta, **dilo y detente**.

## Reglas que mandan
- **Gancho golpe autoevaluado:** en pantalla, de 2 a 5 palabras en dos líneas (una ENORME y otra chica), letra de diseño, sin brillo ni degradado, corte seco; negativo o polémico o una cifra real desnuda; sin nombrar Claude, prompt ni skill; habla de TI; lleva la palabra clave o la cifra; las dos líneas se leen como una frase. Escribe 3 variantes, puntúalas en una tabla y entrega solo la ganadora.
- **Edición sin olor a IA:** imágenes y capturas reales en vez de emojis, íconos o stickers; nada de tembladera ni rebotes; letra de diseño con palabras que entran con corte seco y tamaños distintos.
- **Cifras solo con fuente.** No inventes cifras ni referencias.
- **CTA a un regalo que la persona ya tenga** (de `mi-negocio.md`). Si no tiene, pregúntale qué ofrece. En piezas virales no se vende de frente.
- Efectos de sonido, sin música (la música se pone al publicar).

## Paso 0 · Lo de la persona
- **Marca:** `~/Documents/mi-contenido/mi-marca.md`. Los colores del molde están en `C` (fondo `#050509`, oro `#F5C542`, blanco cálido `#f4f1ea`, rojo `#E5484D`): cambia el oro por su acento si lo tiene; el rojo de lo negativo y el fondo oscuro se quedan.
- **Negocio y regalo:** `~/Documents/mi-contenido/mi-negocio.md` (a quién le habla, qué vende, qué regalo tiene y su página). Si no existen, pregunta.

## Paso 1 · Elegir la curiosidad (si no viene dada)
- Propón de 3 a 4 curiosidades que **ya explotaron** en otras cuentas. Cada referencia se valida **descargando y mirando
  el video**, no por el caption. Anota likes, comentarios y fecha.
- Búsqueda gratis: busca en la web («curiosidad psicología del consumidor reel», nombres de efectos o estudios + «reel» o «tiktok») y valida cada link con `yt-dlp --skip-download --write-info-json <URL>` (likes, comentarios y fecha salen del JSON). Si la persona tiene cuenta de Apify y lo pide, puedes buscar ahí también (es de pago: di el costo antes).
- No repitas los temas que ya hizo @viani.pro (pollo sin cabeza, estrella verde, aviones…) ni los de la serie de la persona:
  lista en `serie.md`. El rumbo que mejor funciona para vender también está ahí. Espera el visto bueno antes de producir.

## Paso 2 · Ver la referencia de verdad
Carpeta temporal, nunca la del proyecto:
```
yt-dlp --write-info-json <URL> -o reel.mp4
node <skill>/scripts/sistema.mjs transcribir reel.mp4 . --txt
ffmpeg -i reel.mp4 -vf "fps=0.5,scale=360:-1,tile=6x3" -frames:v 1 hoja.jpg
ffmpeg -ss 0 -t 12 -i reel.mp4 -vf "fps=2,scale=360:-1,tile=6x4:padding=4:color=white" -frames:v 1 ini.jpg
```
(La transcripción usa mlx-whisper en Mac con chip Apple y faster-whisper en Windows y Mac Intel; la primera vez baja el modelo.)
Mira las hojas y apunta: ¿la apertura es 3D (cámara que se mueve, horizonte, objeto con volumen) o plana? ¿Qué material real usa
(satélite, fotos, capturas)? ¿Cómo entra el texto? ¿Cómo cierra?

## Paso 3 · Guion
- Mismo tema validado, **guion propio**: 12–16 frases de ≤15 palabras, 50–60 s, tuteando. Claves con `*asteriscos*`.
- **El gancho va al MIEDO o a la RABIA:** es lo que más mueve. Antes de escribirlo, busca en la historia el momento de peligro, de pérdida o de injusticia (casi muere, lo estafaron, se lo robaron, te engañan) y ponlo arriba, aunque el negocio o el logro sea lo que se explica después. Ej.: Red Bull Stratos → «CASI MUERE / por una campaña de Red Bull», no «LO MANDARON AL ESPACIO / y 8 millones lo vieron». En la tabla de autoevaluación suma la columna «¿Da miedo o rabia?»; la que no, no gana. La historia tiene que pagar el gancho con un hecho con fuente.
- Frase 1 = el gancho golpe dicho en ≤12 palabras (ej. pantalla «tu mapa / TE MIENTE», voz «Tu mapa te miente.»).
- Penúltima: «Este video lo hizo *Claude*, sin cámara y sin editor.» Última: «Comenta *PALABRA* y te mando…» con el regalo de la persona (mejor si enseña algo ligado al tema).
- Cada cifra con su fuente o su cuenta en `LEEME.md` (ej. 1.434 km = ortodrómica 11.340 vs loxodrómica 12.774).
- Sin CTA a mitad salvo que la persona lo pida (corta el misterio). Déjalo como ⚠️ por confirmar.

## Paso 4 · La pieza
`<PROYECTO>` = `~/Documents/mis-animaciones/curiosidad-<tema>/` en Mac y `~/mis-animaciones/curiosidad-<tema>/` en Windows.
Copia `ejemplo/aviones.src.html` a `<PROYECTO>/fuente/pieza.src.html`, `ejemplo/assets/formas.js` a `<PROYECTO>/fuente/assets/` y baja las texturas que uses (`node <skill>/scripts/bajar-texturas.mjs <PROYECTO>/fuente/assets`; la pieza las busca en `assets/`). Cambia `PALABRA` y `REGALO` (el CTA). Qué reutilizar del ejemplo:

| Bloque | Para qué |
|---|---|
| `LINEAS`, `INICIOS`, `ESC[]` | una frase = una escena; tiempos en fracciones de `q`, nunca en segundos |
| `apertura3D(t)` + `armar3D()` | apertura en three.js r128: Tierra con textura NASA, parche de alta, atmósfera calculada desde la cámara, objeto modelado con piezas, estela, cámara que sigue y luego sube. Corre sobre tiempo global `TG` porque cruza dos frases |
| `vistaMerc`, `vistaGlobo`, `vistaGajos` | mapas reproyectados por píxel desde la textura (Mercator, globo, gajos de naranja) |
| `fichasFrase` · `subtitulo` · `escribir` | subtítulo palabra por palabra, corte seco, clave en Inter 900 dorada y conectores en Instrument Serif itálica |
| `gancho()` | línea chica serif blanca + línea ENORME Inter 900 roja (negativo) |
| `contador()` | cifra que cuenta + unidad chica dorada |
| `cierre()` + `ctaRegalo()` | celular plano que baja por la página completa del regalo (`BAJA0`→`BAJA1`, arranque y frenada suaves) y CTA fijo arriba |
| `window.SFX` | lista de efectos que lee `scripts/mezclar.mjs` |

**Apertura 3D (lo aprendido al afinarla):**
- `renderer.outputEncoding = sRGBEncoding`, texturas en sRGB, `anisotropy` al máximo y **colores de material con
  `.convertSRGBToLinear()`** (si no, el dorado sale lavado).
- Especular de la Tierra casi negro (`0x040506`): con más, el océano se ve gris lechoso al subir la cámara.
- Niebla solo en vuelo bajo (`near = horizonte·0,55`, `far = near·2,7`) y que se vaya apenas sube la cámara
  (`near / (1 − s·6)`). Nunca `near > far`: pinta todo del color de la niebla.
- Vuelo bajo (altura ~8, cámara 24 atrás y 10 arriba, mirando 24 adelante y 3 abajo) para que se vea tierra
  bajo el objeto. La «recta» se dibuja como **círculo máximo** (un paralelo se ve curvo en 3D).
- Lo que dependa de la cámara (grosor de la estela) se calcula **después** de mover la cámara: los cuadros se
  renderizan sueltos y fuera de orden, todo tiene que ser función pura del tiempo.
- Rótulos 2D sobre el 3D: `Vector3.project(cam)` → coordenadas de pantalla → `ciudad()`.

**Imágenes reales** (texturas en `texturas.md`): NASA Blue Marble NG con topografía y batimetría; para acercarse a
una zona, recorta un parche de alta de la tesela de 21.600 px con `scripts/recortar_tesela.py` (máx. 8192 px por lado).

**Captura del regalo para el cierre:**
```
node <skill>/scripts/capturar-pagina.mjs <url-del-regalo> <PROYECTO>/fuente/assets/regalo-pagina-completa.jpg 560 [alto css hasta el formulario]
```
Pega tramos de 2000 px (una captura fullPage de más de ~16.000 px sale con partes repetidas). Mírala entera antes de usarla.

## Paso 5 · Revisar con la voz de prueba (gratis)
```
node <skill>/scripts/voz.mjs <PROYECTO>/fuente/pieza.src.html <PROYECTO>/voz-prueba <PROYECTO>/prueba-voz.mp4 --prueba
node <animacion-dibujada-f100k>/scripts/renderizar.mjs <PROYECTO>/fuente/pieza.html <PROYECTO>/hoja.jpg --hoja 2
```
`--prueba` lee cada frase con la voz de la computadora, escribe las duraciones en `LINEAS`, arma `pieza.html` y sale un borrador con voz.
Mira la hoja y compara la apertura con `ini.jpg` de la referencia. Para cuadros sueltos: `renderizar.mjs <pieza.html> <PROYECTO>/prueba --cuadros 0,20,40,...`.
Para solo armar la pieza sin voz: `node <skill>/scripts/armar.mjs <PROYECTO>/fuente/pieza.src.html`.

## Paso 6 · Voz final y mezcla
Elige con la persona (di el costo antes si lo hay):
- **Su voz (gratis, la mejor):** que grabe cada frase por separado y te pase `voz/01.m4a`, `02.m4a`…
- **Opcional, voz con IA** (su voz clonada en ElevenLabs, Higgsfield u otra): una frase por audio; palabras en MAYÚSCULAS escritas en minúscula para que no las deletree. Baja a `<PROYECTO>/voz/01.mp3…`.
Transcribe cada audio (`node <skill>/scripts/sistema.mjs transcribir <audio> <carpeta> --txt`) y compáralo con el guion. Luego:
```
node <skill>/scripts/sonidos.mjs <PROYECTO>/sfx
node <skill>/scripts/voz.mjs <PROYECTO>/fuente/pieza.src.html <PROYECTO>/voz <PROYECTO>/video-voz.mp4
node <skill>/scripts/mezclar.mjs <PROYECTO>/fuente/pieza.html <PROYECTO>/video-voz.mp4 <PROYECTO>/sfx <PROYECTO>/<NOMBRE>.mp4
```
`sonidos.mjs` crea los efectos (golpe, whoosh, swoosh, tic, ding, papel, pop, plumon, riser, sello) con ffmpeg; si la persona tiene un banco libre de derechos, pon sus .wav con esos nombres. `mezclar.mjs` normaliza a −14 LUFS.

## Paso 7 · Entregar
- `<PROYECTO>` con el MP4, `fuente/`, `voz/`, `sfx/` y `LEEME.md` (guion, tabla del gancho, fuente de cada cifra, material, ⚠️ por confirmar).
- Agrega el tema a `serie.md`.
- Ábrele el video (`node <skill>/scripts/sistema.mjs abrir <mp4>`) y dile en 3–5 viñetas qué se ve, más lo que falta (la palabra en su automatización de mensajes, etc.).

## No hacer
- Copiar el texto, las frases o los datos de la referencia: se copia el tema validado y la mecánica.
- Emojis, íconos o stickers en vez de imágenes reales; tembladera; texto que entra animado.
- Nombrar el origen de la referencia en el video.
- Publicar sin el visto bueno de la persona.

## EN TU COMPU
- **Marca:** `~/Documents/mi-contenido/mi-marca.md` (colores y letra). **Negocio:** `~/Documents/mi-contenido/mi-negocio.md` (rubro, regalo del CTA y su página). Si no existen, se pregunta.
- **Videos terminados:** `~/Documents/mis-animaciones/curiosidad-<tema>/` en Mac y `~/mis-animaciones/curiosidad-<tema>/` en Windows.
- **Programas:** Node 18+, ffmpeg, Google Chrome, yt-dlp (referencias) y `uv` (Whisper y el recorte de la tesela). Usa el motor de `animacion-dibujada-f100k` (su `npm install` instala `playwright-core`); esta skill no tiene `package.json`.
- **Internet** al renderizar: three.js y las letras se bajan en ese momento.
- **Mac y Windows:** todo corre con `node` o `uv run`. `scripts/sistema.mjs` elige solo: voz de prueba con `say` en Mac y con las voces de Windows; Whisper con mlx-whisper en Mac con chip Apple y faster-whisper en lo demás; y encuentra Chrome en cada sistema.
- **Sin pagos obligatorios:** voz con IA y Apify son opcionales.
