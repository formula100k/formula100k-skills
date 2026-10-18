# Portada que se entiende sin leer · guía de gancho visual

> Copia idéntica en las skills de carrusel (render, clonador, viral, formatos). La maestra vive en `carrusel-render-formula100k/references/`. Nace de 21 portadas devueltas en una sola revisión (15-oct-2026): casi todas fallaban por lo mismo, la foto no tenía nada que ver con lo que prometía el título.

## La prueba de 1 segundo

Tapa el titular con el dedo. **¿La imagen sola dice de qué trata el carrusel?** Si no, la portada no está lista.

Antes de diseñar, escribe en una línea: «la imagen que dice este tema es ___». Después consíguela. Elegir la foto porque «es la que había» es el error que más se repite.

## Tema → imagen (casos reales)

| Si el carrusel habla de… | La portada muestra… | No sirve |
|---|---|---|
| Videojuegos, «tu contenido es un juego» | A la persona convertida en pixel art DENTRO de un nivel de videojuego (plataformas, HUD con vidas y monedas) | Una selfie normal con muñequitos pixel abajo |
| Grabar, encuadres, cámara | A la persona con una cámara (VHS, de rollo) apuntando a la lente; textura de video casero (● REC, fecha, líneas) | Recorte de la persona sin cámara |
| Construir algo «en N meses» / progreso | La evolución: 3 polaroids «mes 1 · mes 2 · mes 3» (de grabar nerviosa en la cama a grabar segura en un café) | Una selfie de paseo |
| Estudios, informes, datos | La persona entre pilas de informes + 2-3 informes en maqueta («estudio 21 de 21») | Un retrato sin papeles |
| Una empresa o herramienta (Anthropic, Claude, Canva…) | Su logo oficial (de fuente pública, con URL anotada) + íconos del tema + la persona en contexto | Foto en un estacionamiento |
| Tipografías, letras | Las letras: muestras reales recortadas, pliego de especímenes | Foto de viaje |
| Una estructura «de N partes» | La línea de tiempo o esquema con las N partes nombradas | Dos láminas sueltas sin orden |
| Un error | El error mismo, con círculo rojo a mano y flecha que lo señala | Una foto que no muestra el error |
| Personas famosas | Quiénes son: nombre completo + por qué son famosas en 2-4 palabras + sus otros oficios | Solo el nombre de pila («Toni», «Coco») |
| Carrusel animado, «se mueve», mascota que se mueve | La portada ES video: algo se mueve desde el primer cuadro | Una lámina fija con la promesa de movimiento |
| Apps, proyectos digitales | Teléfonos realistas con la pantalla real + la persona usándolos | Teléfonos de caricatura |
| «Novata vs. pro», antes y después | Los dos ejemplos lado a lado en el contexto real (dentro del feed, con su interfaz) y la versión «pro» de verdad deseable | Un «pro» que se ve igual de flojo |
| Colores, paletas | Las muestras ordenadas en retícula, con su código completo y legible | Muestras en abanico con los códigos cortados |
| Lecciones, «lo que ojalá hubiera sabido» | La persona escribiendo/repasando sus lecciones + 2-3 lecciones reales del carrusel como notas | Foto en un parque de diversiones |
| Muchos intereses, multipasión | La persona rodeada de sus intereses (pintura, guitarra, libros, cámara…) con notas a mano que los señalan | Foto en blanco y negro sin relación |

## Si no hay foto que diga el tema: créala

- **Imagen de la persona con IA** (Higgsfield `gpt_image_2_5` o equivalente) partiendo de 2-3 fotos reales suyas como referencia. En el prompt: «Use the reference photos ONLY for the face and hair; do NOT copy their clothing», describe su pelo y sus accesorios de siempre, y dale **ropa nueva en cada imagen** (si no, el modelo copia la prenda de la referencia en todas). Pide «no text, no logos»: el texto va siempre en HTML.
- **Recorte tipo sticker:** genera de frente con fondo liso, quita el fondo y ponle borde blanco grueso. Cara y hombros mirando a cámara.
- **Mix media:** polaroids con cinta, recortes, notas a mano, sellos, maquetas. La foto no tiene que ser «una foto»: puede ser un collage que cuente el tema.
- Mira cada imagen generada antes de usarla: parecido, accesorios, manos, texto basura. Cuesta muy poco (≈0,25 créditos por imagen); el video (Seedance) cuesta 35-100 créditos, úsalo solo cuando el tema es movimiento.

## Jerarquía (como en las referencias que funcionan)

1. **UN protagonista**: la imagen-tema o el titular, no los dos peleando. Todo lo demás, subordinado.
2. Titular de 2-3 líneas, afirmación concreta. Máximo 1-2 apoyos (post-it, sello). Nada flotando sin alinear.
3. Sin huecos vacíos grandes (más de ~200 px de fondo sin nada) y sin piezas amontonadas en una esquina.
4. Nada tapa la cara ni el titular. Ojo: si agrandas el titular puede saltar a una línea más y quedar debajo de una foto. Vuelve a mirar después de cada cambio de tamaño.

## Encuadre

- La cara entera, de frente o 3/4, a buen tamaño. Nunca la cara cortada por el papel rasgado, ni una persona lejana y chica al fondo de un paisaje.
- Foto movida o nocturna borrosa = descartar.

## Mockups realistas

- Teléfono: usa una foto real de iPhone con la pantalla en blanco y monta la pantalla en HTML encima (así el texto sale perfecto). Si tienes instalada `carrusel-render-formula100k` y trae `assets/iphone-mockup.png`, úsala: la pantalla ocupa x 7,05 % · y 3,92 % · ancho 82,05 % · alto 88,8 %, con esquinas de ~30 px. Si no, usa una foto real de iPhone (tuya o de un banco de imágenes libre) y mide la pantalla antes de montar.
- Instagram: cabecera con usuario, íconos, «me gusta», caption. Historias: barra de progreso, usuario, «Enviar mensaje».
- Nada de teléfonos dibujados con borde negro grueso.

## El gancho escrito

- Afirmación concreta que **nombra la cosa**: la herramienta, la cifra, el resultado. «Claude Pro te cuenta mensajes, no videos» y no «Claude Pro no te cuenta lo que crees».
- Si hay personas, se dice quiénes son. Si hay un dato, sale de la pieza o de su fuente, nunca inventado.
- Las notas a mano también deben ser verdad: nada de «los leí por ti» si no los leíste.

## Color y repetición

- Nunca blanco y negro «porque sí». Solo en fotos de archivo de época, y se anota.
- Cuenta las fotos de la pieza y del lote. Una misma foto o recorte, máximo 1 vez por carrusel; un recorte que ya salió en varias piezas está quemado: genera uno nuevo.
- Si el carrusel muestra ejemplos de un catálogo (recetas, formatos, plantillas), **rota**: no muestres siempre los mismos cuando hay muchos documentados.

## Antes de entregar la portada

- [ ] Prueba de 1 segundo con el titular tapado.
- [ ] Un protagonista; sin huecos; nada tapa cara ni titular.
- [ ] Cara completa y nítida.
- [ ] Gancho concreto, en afirmación, con datos con fuente.
- [ ] La miré a tamaño real (no solo en la hoja de contacto) después del último cambio.
- [ ] Ninguna foto repetida de otra pieza del lote.
