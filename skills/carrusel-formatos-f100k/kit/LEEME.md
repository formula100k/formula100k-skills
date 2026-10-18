# Kit de scrapbook con textura (HTML libre)

Piezas listas para armar carruseles hechos «a mano» con fotos reales: papel con fibras, papel rasgado,
cinta washi, polaroids, recortes con borde de sticker, post-its, recibo, sello, resaltador, nota a mano,
celular y caja de CTA. Se usa con el modo **HTML libre** de `build.js`.

## Cómo se arma una pieza

1. Copia la carpeta `kit/` dentro de la carpeta del carrusel (así el HTML queda editable y se abre solo):
   `<carpeta>/kit/kit.css`, `<carpeta>/kit/texturas.css`.
2. Escribe `<carpeta>/kit/marca.css` con los colores y letras de la persona (en este orden: `~/Documents/mi-contenido/mi-marca.md`,
   su manual de identidad visual `mi-marca/marca.md`, o `mi_manual` si viene de Yapper). Solo variables; nada más:

   ```css
   @import url('https://fonts.googleapis.com/css2?family=<SU+LETRA>:wght@400;700;900&display=swap');
   :root{
     --papel:#...;  --papel2:#...;  --tinta:#...;  --gris:#...;
     --acento:#<su color principal>;  --acento-tinta:#<el mismo, más oscuro>;
     --acento2:#<su segundo color>;   --acento3:#<un tercero de su paleta o un tono claro del principal>;
     --mano:#<color de la nota a mano: el principal o uno oscuro de su paleta>;
     --letra:'<su letra>',sans-serif;   /* titulares y cuerpo */
     --letra-serif:'<su serif o la del kit>',serif;
   }
   ```
   Contraste primero: `--tinta` sobre `--papel` tiene que leerse en el celular. Si su paleta es oscura, el papel
   puede ser su color claro y el acento el fuerte. Nunca inventes colores fuera de su paleta.
3. En el `<head>`: `kit/kit.css`, después `kit/marca.css`, después `kit/texturas.css` (en ese orden).
4. Pega el contenido de `kit/filtros.html` justo después de `<body>`.
5. Cada lámina es un `<section class="slide">` de 1080 × 1350.
6. Exporta: `node "<carpeta de esta skill>/build.js" "<carpeta>/carrusel.html" --escala 1`

## Piezas

| Clase | Qué es | Nota |
|---|---|---|
| `.t` + `<i>` | titular sans pesada con serif itálica dentro | la firma del estilo: mezcla de peso y estilo en la misma frase |
| `.hl` (`.dos`, `.tres`) | resaltador detrás de una palabra | una o dos palabras por lámina, no frases enteras |
| `.rasgado` (`.kraft`, `.negro`, `.acento`) | papel rasgado que lleva el titular | el texto va limpio encima; la orilla la hace la textura |
| `.tape` (`.uno`, `.tres`) | cinta washi | pega fotos y papeles; rota ±3–8° |
| `.pola` + `.pie` | polaroid con foto real y pie a mano | `object-position` para que la cara no quede cortada |
| `.recorte` | foto recortada con borde blanco de sticker | necesita un PNG con fondo transparente |
| `.postit` (`.uno`, `.tres`) | nota adhesiva con letra a mano | 1 por lámina como mucho |
| `.recibo` | ticket térmico con letra mono | listas, «lo que pagas», pasos |
| `.sello` | sello de tinta | una palabra: «ERROR», «SÍ», «NO» |
| `.mano` | nota escrita a mano | flechas, aclaraciones cortas |
| `.cta` + `<b>` | caja del cierre con la palabra clave | la palabra del CTA va en `<b>` |
| `.tel` | celular con una captura dentro | para un iPhone fotográfico usa una foto real de iPhone con la pantalla en blanco (ver `references/portada-gancho-visual.md`) |
| `.versus` + `.lado` + `.etq` | dos columnas A vs B | para comparativos: cada columna con su etiqueta |
| `.cafe`, `.lapiz`, `.grapa` | detalles sueltos | decoran sin tapar texto |
| `.handle` | firma con el @ | 28 px, centrada abajo |

## Reglas que el kit ya cumple (no las rompas al editar)

- Ningún filtro va sobre texto: la textura está detrás. Si agregas una pieza, su textura va en `::before`.
- Letra de cuerpo de 28 px o más; titulares de portada entre 90 y 130 px.
- Nada de texto a menos de 80 px de la orilla izquierda o derecha.
- Un solo protagonista grande por lámina; lo demás subordinado y alineado.
- Nunca quites el color de las fotos «porque sí».
