# Anatomía de la referencia (medida cuadro por cuadro, 22-oct-2026)

**Reel:** https://www.instagram.com/reel/DdOgwyYIKmm/ · @personalbrandlaunch · 13-sep-2026 · 27,5 s · 1080×1920, 30 fps
· 3.508 me gusta · 3.230 comentarios (la mitad de la gente comenta: el CTA de palabra funciona).
Medido bajando el video, transcribiendo (`reel.srt`) y detectando cortes de escena con `ffmpeg select='gt(scene,0.25)'`.
Se copia la MECÁNICA; los colores, la tipografía y el tema son de la marca.

## Reparto

| Tramo | Qué pasa | Ritmo |
|---|---|---|
| 0–11,3 s | Infografía: láminas a pantalla completa intercaladas con cortes al clon | 16 cortes de escena: uno cada 0,5–1,5 s |
| 11,3–20,2 s | Toma de la narradora con overlays (palabra triple, llave, hoja de cálculo) | un overlay cada 2–4 s |
| 20,2–21 s | Último corte al clon: «¿y dónde aprendo eso?» (la pregunta que abre el CTA) | — |
| 21–27,5 s | CTA: tarjeta de su video de YouTube arriba + palabras triples + caja de comentario que teclea SHORT | — |

## Segundo a segundo

| s | Plano | Se dice | Qué se ve |
|---|---|---|---|
| 0–0,87 | Narradora (silla, blusa blanca) | «You know what's crazy?» | Gancho sobre la toma: «**1 YEAR** / of Content Ideas» (cifra grande lima + chica blanca), subtítulo «what's crazy» al centro |
| 0,87–1,23 | **Clon** (sofá, suéter oscuro) | «What?» | solo la reacción + subtítulo |
| 1,23–2,47 | **Lámina centro** (fondo lima plano) | «If you have one main niche» | ella recortada al centro, chica, con borde blanco · etiqueta oliva «FITNESS» a sus pies · chip blanco abajo «1 main niche» |
| 2,47–2,93 | Clon | «Mm-hmm» | — |
| 2,93–3,9 | **Lámina mapa** | «Five sub-niches» | ella al centro + 5 objetos PNG recortados (pesas, zapatilla, bowl, antifaz, proteína) con etiqueta oliva, flechas blancas dibujadas a mano · chip «5 sub niches» |
| 3,9–4,33 | Clon | «OK» | — |
| 4,33–6,07 | **Lámina cuadrícula** | «10 engaging formats to film your video in» | 2 filas × 5 miniaturas reales (9:16) con etiqueta chica abajo de cada una · chip «10 engaging formats» |
| 6,07–6,63 | Clon | «Right» | — |
| 6,63–7,87 | **Lámina lista** | «And use these seven angles» | 7 filas: miniatura + «#1. TUTORIAL ANGLE» en negrita + 1 línea de descripción · chip «7 video angles» |
| 7,87–8,3 | Clon | «Got it» | — |
| 8,3–10,4 | **Lámina mosaico + número** | «You have 350 different combinations of videos» | mosaico de ~20 reels suyos de fondo · primero subtítulo-chip «you have», luego **350** gigante lima con contorno + chip «different combinations». 350 = 1 × 5 × 10 × 7 (los números que dijo) |
| 10,4–11,27 | Clon | «Whoa» | — |
| 11,27–12,5 | Narradora | «That's almost one year of content» | palabra triple «that's almost / **1 YEAR** / of content» |
| 12,5–14,3 | Toma del sofá | «And that's not even including storytelling content» | llave: «**STORYTELLING** / content» + llave { } blanca + 5 miniaturas debajo |
| 14,3–20,2 | Narradora | «…you would add over a month of content… if you just filmed in one of the formats» | palabra triple «over a / **MONTH** / of content» · hoja de cálculo lima en el tercio inferior que se llena («you just… and») |
| 20,2–20,97 | Clon | «Where could I learn more?» | — |
| 20,97–27,5 | Narradora | «I created an in-depth video… just comment SHORT…» | tarjeta de YouTube arriba (miniatura con antes/después + título + vistas) · «I created an / **IN DEPTH** / video» · «**SHORT-FORM**» · caja de comentario blanca con borde lima: avatar + usuario, teclea «SHORT», botón rojo de enviar → corazón |

## Gramática

1. **El clon es puntuación, no contenido.** Cada reacción dura 0,4–0,9 s y separa dos láminas. Le da al espectador
   permiso de sorprenderse («Whoa») y marca el ritmo de «esto va subiendo».
2. **Cada número que se dice se ve como cantidad.** 1 = una figura; 5 = cinco objetos; 10 = diez miniaturas; 7 = siete
   filas; el resultado = un mosaico que se llena y la cifra gigante. La cifra final es la multiplicación de las que dijo:
   no hay ningún número que no haya salido de su boca.
3. **Fondo plano de un solo color**, siempre el mismo. La lámina se lee en 0,5 s porque no hay nada más.
4. **Chip blanco con texto oscuro** como pie de cada lámina = el nombre de la cantidad («5 sub niches»).
5. **Etiqueta oliva** (el color de la lámina oscurecido, texto blanco, borde blanco) para nombrar cosas dentro de la lámina.
6. **Sobre la toma, una palabra manda**: chica blanca arriba / PALABRA ENORME del color / chica abajo, corridas a los
   bordes (la de arriba a la izquierda, la de abajo a la derecha).
7. **Subtítulos chicos**, 1–2 palabras, blancos, al centro. Desaparecen cuando hay palabra triple o lámina con chip.
8. **CTA con mockup**: la caja de comentario teclea la palabra, se envía y queda un corazón (acción que se imita).

## Qué cambiamos para la marca

| Referencia | Nuestra versión |
|---|---|
| Lima #D4FF00 | El color de tu marca (`marca.color`; si no tienes, amarillo **#FFD630**) |
| Gancho «1 YEAR / of content ideas» | Título GOLPE (skill `gancho-golpe-f100k`): 2–5 palabras, línea enorme en letra de diseño, color plano sin brillo y con corte seco, 3 variantes A/B/C |
| Sin efectos de sonido marcados | Pop en cada lámina e item, whoosh en cada corte al clon, tecleo en el comentario, ding en el corazón |
| Clon con otra ropa en otro sofá | Igual: graba la reacción con otra ropa y otro lugar (o la misma toma con lentes y otro encuadre) |
| CTA «comment SHORT» | Una palabra ligada al tema y a lo que regalas (nunca «YO») |
