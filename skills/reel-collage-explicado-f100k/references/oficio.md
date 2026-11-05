# Oficio del collage explicado

Todo esto está en `plantilla/collage-explicado.src.html`. Las piezas se llaman igual que en el código.

## El look (el del molde aprobado)

- **Fondo**: la textura de papel crema (`collage/papel.jpg`: foto o escaneo de papel real, una textura libre o una hecha con IA; sin ella queda el color de papel) a pantalla completa, más una viñeta tostada en las orillas y grano que cambia 12 veces por segundo (`grano`). El papel no tiembla; todo lo de encima sí.
- **Temblor de collage — APAGADO desde el 23-oct** (regla «edición sin olor a IA»: fuera la tembladera). `PIXELES = 0`; el reel aprobado «Sesgo de supervivencia» se hizo con 7. Solo vuelve si la persona lo pide. `wig(t)` movía toda la escena 3 veces por segundo, 7 px como máximo (`VECES`, `PIXELES`). `sinMover(() => …)` deja clavado lo que no debe temblar, como las flechas que apuntan a algo exacto.
- **Paleta**: tinta `#16161d`, rojo sangre `#d7263d` (lo que falla y lo que el tema marca), dorado `#F5C542`/`#f3c25d` (lo que resuelve y la respuesta), verde `#23885a` (lo que sale bien) y hoja blanca `#fbf8f1`. El negro `#050509` se usa solo en las escenas oscuras del final.
- **Letras**: sans 800 en tiras y sellos, Georgia itálica para frases, citas y el CTA, y mono para etiquetas y pies de figura.
- **Las dos escenas finales van sobre negro con neón** (`OSCURA`): el remate y el CTA. La escena se suma desenfocada (`NEON`) y después se dibuja nítida encima. ⚠️ 23-oct: ese halo también cae sobre el texto del CTA, y la regla pide texto sin brillo; la persona decide si el neón se queda.

## Piezas de papelería

| Pieza | Qué es | Para qué |
|---|---|---|
| `tira(s, y, tam, fondo, col, rot, a, x)` | Tira de papel con orillas rasgadas y sombra | El gancho (dos tiras: 60 px oscura y 76 px roja) y los títulos de escena |
| `etiqueta(s, x, y, tam, rot, a, fondo, col)` | Cinta de rotuladora con letras mono | Nombres propios, rótulos («ABRAHAM WALD», «EL GIMNASIO») |
| `sello(s, x, y, tam, rot, p, col)` | Sello de goma que cae desde 1,9× con tinta gastada | Veredictos: ERROR, BLINDAR AQUÍ, COPIAR. Siempre con efecto `sello` |
| `cinta(x, y, w, rot)` | Cinta washi dorada | Sujeta la hoja del diagrama |
| `recorte(nombre, x, y, h, rot, {esc, a, filtro, sombra})` | Imagen sin fondo con sombra de papel | Los objetos del tema. `filtro: 'grayscale(1)'` para lo perdido o muerto |
| `hoja(cx, cy, s, t, o)` | La figura impresa en hoja cuadriculada con pie «FIG. 1 — …» | El concepto central. Las opciones de `o` pasan al dibujo |
| `palomita`, `equis` | Check verde y X roja trazados | Lo lógico y lo que resulta error |
| `monigote(x, y, s, col, {a, paso})` | Pictograma de cápsula y círculo, sin cara ni manos | Personas en grupo: los que se quedan y los que se van |
| `celular(x, y, s, t, {gris})` | Teléfono con un monigote que baila y corazones | Redes, trends y cuentas. En `gris` es la cuenta que no funcionó |

## El concepto central, dibujado

En el molde es `avion()`: un bombardero visto desde arriba (alas, cola, 4 motores y cabina) con 112 balazos ubicados solo donde un avión puede recibirlos y volver. Sus opciones animables son:
- `puntos` (0 a 1): cuántos balazos se ven.
- `blindaje`: las placas grises.
- `limpias`: círculos punteados en los motores y la cabina; con `relleno2`, rellenos dorados.
- `late`: los puntos laten.
- `voltea`: la hoja gira «al revés».
- `fantasma`: solo el contorno punteado, para los aviones que no volvieron.

Para otro tema, haz su equivalente: un dibujo simple de línea sobre la hoja, con opciones que se encienden al ritmo de la voz. Es lo que hace que «lo que dice, se ve».

## Reglas aprendidas

- **Portada = imagen que frena + gancho grande.** El primer cuadro ya tiene la hoja con el diagrama completo y las dos tiras del gancho, clavadas, solo en la escena 0. El gancho es afirmación, no pregunta retórica.
- **Una frase = una escena.** Las escenas que comparten tablero van en `CONTINUA` (sin fundido): el objeto se queda y solo cambia lo de encima.
- **Lo que el texto promete, la imagen lo cumple literal**, en el segundo en que se dice. Los tiempos de cada aparición se escriben como fracción de la escena (`d * .45`), porque la voz real cambia las duraciones.
- **Zona segura**: contenido entre y 250 y 1320; subtítulo en y 1402 (caja oscura con la palabra que suena en dorado).
- **Recortes**: unos 8 por pieza, máximo 2 o 3 a la vez en pantalla, rotados unos grados y nunca derechos.
- **Nada del original**: ni su cara, ni sus fotos, ni sus memes. Imágenes propias: fotos reales o libres (dominio público, CC0) o hechas con IA.
- **Sin caras inventadas de personas reales.**
- **Efectos**: cada aparición suena : sello = golpe grave, entrada de escena = whoosh, puntitos = tic, recortes = papel, palomita = ding, tachón = plumón, ola = rumor y remate = riser.
- **Función pura del tiempo**: nada de `Math.random` ni `Date` (usa `hash2`).
