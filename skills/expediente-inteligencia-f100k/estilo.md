# Ficha de estilo · «Expediente de inteligencia»

Referencia: un reel de noticia de 66 s, voz en off con ritmo de noticiero (~2,6 palabras/s), sin música marcada. Lo que sigue es lo que se repite cuadro a cuadro y cómo lo ajustamos.

## 1. Paleta
- **Monocromo total.** Negro `#050505` → gris carbón `#121212` de fondo, blanco hueso `#EDEDED` para lo importante, gris `#7A7A7A` para lo secundario.
- Cero color de acento en fotos, capturas y HUD. El énfasis es **brillo** (blanco puro sobre gris), no color.
- Viñeta fuerte en todos los planos + trama fina de líneas diagonales (como una pantalla de monitor) + grano.
- Los únicos colores: el del gancho (verde si es un logro, rojo si es negativo), el **amarillo** `#FFD21F` de la palabra clave del subtítulo y la captura de tu regalo en el cierre (a color, como la pantalla real).

## 2. Letra (3 familias, todas de Google Fonts)
| Uso | Letra |
|---|---|
| Subtítulo | Work Sans 600, blanca con sombra suave, centro en **y ≈ 1400** (73 % del alto); la clave en Inter Tight 800 amarilla y más grande |
| Etiquetas y rótulos HUD | JetBrains Mono en MAYÚSCULAS, tracking amplio, 2 líneas (nombre blanco + dato gris más chico) |
| Cifra gigante, títulos | Inter Tight 700–800, blanca, casi sin halo |

- Etiquetas con **línea guía** desde el objeto a una cajita con borde fino de 1 px.
- Subtítulo **sin caja ni placa**: texto suelto.

## 3. Repertorio de planos
1. **Foto real desaturada** con viñeta y trama + mira (círculo + cruz) que se posa sobre la **cara completa** + etiqueta HUD al lado («NOMBRE / CARGO»).
2. **Captura real como lámina** (el sitio, el video, el titular) con la cámara que se acerca a lo que se nombra y un visor sobre el dato.
3. **Persona del video real** (clip corto a 15 cuadros por segundo) con la mira que la sigue.
4. **Globo de puntos oscuro** que gira y se acerca a un punto marcado con su etiqueta mono; puede dibujar una **línea punteada** entre dos ciudades.
5. **Cifra gigante que cuenta** (de 0 al número) y llega justo cuando la voz la dice, con su rótulo mono arriba.
6. **Barra** que se llena o se vacía (día 1 → día 2, inventario 100 % → 0 %).
7. **Tira de fotogramas** del video real que corre de lado.
8. **Título grande** para el giro («¿POR QUÉ FUNCIONÓ?», «NO ERA EL PRODUCTO») y el tachado que se dibuja sobre lo que «no era».
9. **Pasos 01-02-03** de la lección, cada uno sobre una foto del caso.
10. **Cierre**: tu palabra grande y la captura plana de tu regalo, que se desplaza despacio.

## 4. Ritmo
- Cambio de plano cada **3 a 6 s**, siempre amarrado a una frase dicha; dentro de cada plano pasa **algo nuevo cada 0,5–1,5 s** (una etiqueta, una línea, una cifra, un acercamiento).
- Transiciones cortas entre escenas (barrido con línea de escaneo, lado o empuje, 0,22 s). Nada vistoso.
- Cámara siempre en movimiento lento (empuje o paneo hacia lo que se nombra, giro del globo), nunca más de 1,5 s quieta. Nada tiembla.

## 5. Lo que NO se copia de la referencia
- Su tema, sus nombres, sus fotos, sus logos ni la marca del medio.
- Su voz y su texto.
- Los planos 3D y los documentos dibujados: su lugar lo ocupan **fotos y capturas reales del caso** (el anuncio, el sitio, el titular, la sede). Nada de dibujo vectorial como imagen principal.

## 6. Ajustes sobre la referencia (mandan sobre lo de arriba)
- **Gancho:** la referencia no lleva gancho de texto. El nuestro va **centrado encima de la escena a pantalla completa**, con un degradado negro suave sin bordes (`herramientas/gancho_png.py`). Nunca a la izquierda ni en una franja negra. La cara del plano queda debajo del bloque.
- **Subtítulo:** sin caja, con la clave en amarillo.
- **Globo:** oscuro (puntos claros sobre negro) para que el subtítulo se lea sin caja. El «respiro» de brillo lo dan las capturas claras (sitio web, titular).
- **Etiquetas:** siempre colgadas de un ancla que se ve. Zona segura: 60 px a los lados, y entre y = 220 y y = 1650.
- **Sin brillos:** halo de la cifra casi nulo; etiquetas y subtítulos entran con **corte seco**.
- **Sonido:** pops y barridos graves y cortos (pasa-bajos a 2,8 kHz, 0,3 s como mucho); nada agudo (ni campanas, ni timbres, ni clics).
- **Cierre:** con CTA (la referencia no lo tiene): «comenta [TU PALABRA]» sobre la captura real de tu regalo.
