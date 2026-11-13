---
name: noticia-escandalo-f100k
description: "Reel sin cara hecho con código, sin créditos: recortes de papel y capturas reales; un detalle absurdo termina tumbando a alguien grande. Usar con «plantilla Noticia de escándalo», «reel de escándalo con recortes»."
argument-hint: [el caso: detalle absurdo + caída + fuentes, y la palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Noticia de escándalo (reel sin cara por código)

Un mundo de recortes de papel sobre un cielo azul noche. Primero, en primer plano, **lo absurdo**: un detalle cotidiano (un ticket con el mismo sándwich cobrado dos veces) que el plumón amarillo subraya y un óvalo rojo encierra, con una nota a mano. La cámara baja y se abre hasta **la caída**: el titular grande con su foto en trama de puntos, y un sello rojo entra de golpe. Al alejarse, un hilo rojo une el óvalo del ticket con el sello, y entran las etiquetas «lo absurdo» y «la caída». Cierra en una nota amarilla donde se teclea tu palabra de CTA. Todo se dibuja en canvas y se renderiza gratis en segundos: 1080×1920, 30 fps, 7 s.

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`. En este estilo, su color de acento reemplaza el amarillo de la palabra clave del subtítulo y del plumón (`colores.amarillo` en `config.json`). El rojo del sello, del óvalo y del hilo se queda (es «lo negativo»), igual que el azul noche y el papel. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **El caso, con sus fuentes.** Un hecho chico, cotidiano y fácil de imaginar (un gasto, un mensaje, un error de app, un objeto, una frase en una reunión) que terminó, por una cadena verificable, en una caída grande (una renuncia, una intervención, una multa, el desplome de una acción, un cierre). Necesito:
   - **la fuente de la caída** (boletín oficial, regulador, comunicado de la empresa, hecho relevante en bolsa o resolución judicial);
   - **la fuente del detalle absurdo** (al menos 2 medios serios o el mismo documento oficial);
   - que **las fuentes afirmen la cadena causal**. Si el detalle fue solo «la gota», el guion lo dice así.
   Si no tienes caso, búscalo con esos filtros. Se descartan los casos de partido o de bandera política.
2. **Las capturas reales** (o déjame buscarlas): la del detalle absurdo (el documento, el post, la foto del objeto) y la de la caída (la portada o el titular del medio serio, o el comunicado, con la fecha visible).
3. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO».
4. **Voz (opcional):** tu grabación o una voz clonada. Sin voz, el subtítulo se reparte solo en cada frase.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: `plantilla/index.html`, `plantilla/build.mjs`, `plantilla/config.json` y `plantilla/fuentes/`. El motor de render es el de la skill `animacion-dibujada-f100k` (se instala con el módulo Animación); la primera vez corre `npm i` en su carpeta. Hace falta Node 18+, ffmpeg y Google Chrome.
2. **Lee las fuentes enteras** antes de escribir nada (se valida mirando el documento, no por el titular ni el pie de foto). Anota las fuentes con su enlace y su fecha en un `FUENTES.md` junto al video.
3. **Escribe `config.json`:**
   - `cta`: tu palabra. `maqueta`: `false` en un video real (apaga las marcas «MAQUETA» del ejemplo).
   - `frases`: 4 frases `[desde, hasta, texto]` en segundos; la clave va entre `*asteriscos*` y `{CTA}` se cambia por tu palabra. 1) lo absurdo, 2) la caída, 3) la ecuación («lo chico tumba lo grande»), 4) el CTA. Se cuenta **el hecho**, no la moraleja.
   - `fotos`: `ticket` (lo absurdo) y `titular` (la caída) con la ruta a tu captura, relativa a `index.html`. Con foto, ese recorte deja de dibujarse y muestra tu captura dentro del mismo papel rasgado, con su sombra y su grano. Las capturas de titulares van enteras, sin recortar el medio ni la fecha.
   - Sin foto todavía: `ticket` (título, renglones, cuáles se marcan y la nota a mano; hasta 5 renglones) y `diario` (cabecera, titular y bajada) dibujan el recorte. Úsalo solo para la prueba o con `maqueta: true`.
   - `sello` (1 palabra, ej. «RENUNCIA», «INTERVENIDO», «MULTA»), `etiquetas`, `cierre` (`pide` y `debajo`) y `colores`.
4. **Prueba rápida:** `node build.mjs --prueba` → `prueba/hoja_prueba.jpg` con 4 cuadros (lo absurdo marcado, el sello, el hilo y el CTA). Revísalos con la lista de abajo.
5. **Render completo:** `node build.mjs` → `noticia.mp4` y `hoja.jpg` (9 cuadros). Tarda segundos. Revisa la hoja entera.
6. **Con voz:** cambia los tiempos de `frases` a los tiempos reales de la voz (palabra por palabra si los tienes) y, si cambia la duración, ajusta `DUR` y las paradas de `CAM` en `index.html`.
7. **Video largo (30–60 s):** repite el motor con más escenas (8 a 15): más recortes en el mundo (`papel(...)`), gráficas simples en canvas (por ejemplo, una barra de «lo que pedía la ley» contra el valor real) y capturas reales, siempre con la cámara viajando de una a otra.
8. **Sonido:** pop, swish, golpe sordo grave en el sello y desliz de papel en los viajes. Nada agudo (nada por encima de ~3 kHz), sin timbres ni clics.

## Lista de revisión (cuadro por cuadro)
1. ¿El primer cuadro muestra el objeto chico, claro y legible, sin texto encima que lo tape?
2. ¿Cada cifra, nombre o fecha en pantalla sale en una captura real y en una fuente anotada?
3. ¿El sello entra con corte seco, sin rebote ni temblor?
4. ¿El hilo une el óvalo de lo absurdo con el sello de la caída?
5. ¿El subtítulo se lee entero (centro en y≈1420, sin caja negra, con el degradado suave detrás) y la clave va en caja?
6. ¿Con un caso real, las marcas «MAQUETA» están apagadas? ¿Con un ejemplo inventado, están prendidas?
7. ¿El CTA es tu palabra y se teclea entera en la nota?

Si algo da «no», se corrige y se vuelve a pasar la lista.

## Reglas del estilo (lo que lo hace bueno)
- **Chico → grande:** la mecánica entera es una ecuación visual. Se ve lo absurdo primero, después la caída, y al final los dos juntos unidos por el hilo. Se entiende sin audio.
- **Papel real, no vector:** recortes con borde rasgado, sombra plana, grano y foto en trama de puntos. Las capturas reales van dentro del mismo papel.
- **La cámara nunca se queda quieta** (nada quieto más de 1,5 s) y nunca tiembla: empuja, baja, se aleja.
- **Corte seco:** el sello, las etiquetas y las letras del CTA aparecen enteras de un cuadro al otro. Solo el plumón, el óvalo y el hilo «se dibujan».
- **Subtítulo karaoke:** las palabras que vienen van tenues; la clave, en caja amarilla.
- **Fondo azul noche con estrellas y paralaje leve:** da profundidad sin mover el cuadro de golpe.
- **Rojo = la caída:** el sello, el óvalo, el hilo y la etiqueta «la caída». El amarillo es lo absurdo.

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/index.html` | La pieza en canvas: mundo de recortes, plumón, óvalo, sello, hilo, nota del CTA, cámara y subtítulo. |
| `plantilla/build.mjs` | Lee `config.json`, escribe `config.js` y renderiza (prueba de 4 cuadros o el video completo + hoja). |
| `plantilla/config.json` | Ejemplo genérico e inventado (marcado como MAQUETA) con «GUÍA». |
| `plantilla/fuentes/` | Anton, DM Serif Display, Instrument Serif Italic, JetBrains Mono y Montserrat (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit. |

## Errores a evitar
- **Presentar un caso inventado como real.** El ejemplo es una maqueta y lo dice en pantalla. Un video publicado lleva un caso real, con fuentes leídas enteras.
- **Inventar la cadena causal.** Si las fuentes no dicen que lo chico causó lo grande, no se dice.
- **Cifras sin fuente.** Una cifra en pantalla va solo si sale en la captura y en la fuente anotada.
- **Quedarse corto de escenas.** La muestra tiene 3 tiempos y 2 objetos; un video completo necesita de 8 a 15 escenas.
- **El tercio de abajo vacío en el plano abierto:** si queda aire bajo el subtítulo, acerca la cámara o agranda los recortes.
- **Contar la moraleja en vez del hecho** en la primera frase.

## Checklist final
- [ ] Caso real con fuente oficial de la caída y 2 fuentes del detalle (o el documento oficial), leídas enteras y anotadas en `FUENTES.md`.
- [ ] Capturas reales en `fotos` y `maqueta: false`.
- [ ] Tu CTA (no «YO») en la frase 4 y en la nota.
- [ ] En pantalla, nada de jerga técnica (ni nombres de herramientas de IA, ni «prompt», ni código).
- [ ] Prueba de 4 cuadros y hoja de 9 cuadros revisadas con la lista.
- [ ] Sonido grave sin pitidos; con voz, protocolo de corte con su sello.
