# Catálogo de técnicas de la pieza base

Cada técnica ya está hecha en `plantilla/base.src.html`. Aquí dice cuál usar según lo que viste en la referencia.
Todas las posiciones son en un lienzo de 1080 × 1920. En cada escena tienes `u` (segundos desde que arrancó), `d`
(su duración) y `t` (tiempo global).

## Tiempo y entradas

| Quiero… | Usa | Nota |
|---|---|---|
| Que algo entre con rebote | `pop(u, inicio, dura)` → 0 a 1 | Multiplica el tamaño por ese valor |
| Que algo entre suave | `fin(u, inicio, dura)` → 0 a 1 | Sirve de opacidad (`{ a: fin(u, .2) }`) o de avance de un trazo |
| Un tramo entre dos momentos | `prog(u, a, b)` → 0 a 1 | Del núcleo. Con `ease(...)` arranca y frena suave |
| Ir de un valor a otro | `lerp(a, b, k)` | Del núcleo |
| Algo al azar pero repetible | `hash2(a, b)` o `rng(semilla)` | Nunca `Math.random` ni `Date` |

## Lo que ves en la referencia → cómo se hace

| Técnica | Ayuda de la plantilla | Cuándo usarla |
|---|---|---|
| **Toda la escena tiembla un poquito** | `VECES`, `PIXELES` arriba; `M(t)` devuelve cuánto (0 a 1) | La referencia se siente «viva» aunque nada se mueva. Con 3 y 8 a 12 basta; más marea |
| **Algo queda clavado mientras lo demás tiembla** | `sinMover(() => { … })` | Marcos, guías, el gancho: lo que debe leerse quieto |
| **Apagar y prender el movimiento** | Cambia `M(t)` para que dé 0 en una frase | Demostrar un antes y después dentro del mismo video |
| **Halo de luz (neón) en el dibujo** | `NEON = [[desenfoque, fuerza], …]`; `[]` lo apaga | Dibujo de línea o figuras claras sobre fondo oscuro |
| **Tramo sobre papel claro** | Pon el número de la escena en `CLARAS` | Aperturas de collage. Las escenas claras no llevan halo |
| **Línea que se dibuja sola** | `trazo(puntos, avance, color, grosor)` | Dibujo de línea, rutas, gráficas, contornos |
| **Curva suave** | `curva([[x,y], …])` → puntos para `trazo` | Tallos, caminos, flechas curvas |
| **Círculo o arco que se cierra** | `aro(cx, cy, radio, avance, color)` | Relojes, soles, aros de progreso, resaltar algo |
| **Recta que avanza** | `recta(x0, y0, x1, y1, avance, color, grosor, { raya: [22, 16] })` | Subrayados, cortes, ejes. `raya` la hace punteada |
| **Palomita y equis** | `palomita(x, y, tam, avance)`, `equis(x, y, tam, avance)` | Sí / no, bien / mal, antes / después |
| **Gancho chico y discreto** | `ganchoChico('texto', y)` | Reel de puro dibujo: lo que frena el dedo es la animación |
| **Gancho grande en tiras** | `GANCHO = ['línea 1', 'línea 2']` (se pinta solo en la escena 0) o `tira(texto, y, tam, fondo, color, giro)` | La referencia abre con una imagen disruptiva y un titular que se nota. `tam` de 60 a 90 |
| **Collage de recortes** | PNG sin fondo en `recortes/`, nombres en `RECORTES`; `recorte('nombre', x, y, alto, giro)` | La apertura de la referencia es un collage, una foto o un objeto. Hazla del mismo TIPO, con imágenes tuyas |
| **Texto suelto** | `txt('texto', x, y, tam, { col, al, serif, it, mono, peso, a })` | Rótulos, cifras, etiquetas |
| **Caja o tarjeta** | `caja(x, y, ancho, alto, radio, relleno, borde, grosor)` | Paneles, pantallas, burbujas |
| **Paso numerado** | `numero(n, x, y, pop(u, 0))` | Listas de pasos: el número dentro de un aro |
| **Personaje pixel** | `personaje(x, y, U, t, { salta })`; la grilla es `PIXEL` y sus colores `PIXEL_COL` | Un acompañante que simboliza el tema. Dibuja el tuyo cambiando la grilla |
| **Subtítulo con la palabra que suena** | `subtitulo(i, u, y)` (ya lo llama `draw`) | Siempre que haya voz. `?sinsubs` da la versión limpia |
| **Cierre con caja de comentario** | `comentario(u, d, t, y)` usa `PALABRA_CTA` y `MENSAJE` | Última escena: la palabra, se teclea sola, se envía y llega el regalo |
| **Escenas que comparten objeto** | Pon sus números en `CONTINUA` | El objeto se queda y solo cambia lo que pasa encima: sin fundido entre ellas |
| **Brillo o destello** | `glow(x, y, radio, 'r,g,b', fuerza)`, `estrellita(x, y, radio, 'r,g,b', a)` | Del núcleo. Para remates y festejos |
| **Fotos** | `cargarFotos([...])` y `fotoCover(im, x, y, w, h)` | Del núcleo. Fotos enteras (no recortes) dentro de un marco |

## Mecánicas frecuentes y cómo armarlas

- **Explicativo de una escena por frase.** Cada `ESC[i]` dibuja lo que nombra su frase. Si varias frases hablan del
  mismo objeto, van en `CONTINUA` y el objeto se dibuja igual en todas.
- **Comparación de dos personajes** (la que hace A y la que hace B). Divide el lienzo en dos mitades con una función
  que dibuja el personaje según un avance; cada mitad avanza a su ritmo con el mismo `t`. Pictogramas de cápsulas y
  círculos, sin manos ni cara. `NEON` encendido y `ganchoChico`.
- **Reflexión en línea fina.** Fondo oscuro, un solo objeto por tramo que se transforma (`CONTINUA`), `trazo` y `aro`
  con poco grosor, etiquetas chicas con `txt(..., { mono: true })`.
- **Apertura de collage + desarrollo oscuro.** Escena 0 en `CLARAS` con `recorte(...)` y `GANCHO`; el resto sobre
  fondo oscuro con halo. El contraste entre los dos tramos es parte de la mecánica.
- **Pantalla o interfaz que se arma.** `caja` para la ventana, `txt` con `mono` para el texto tecleado
  (`texto.slice(0, Math.floor(prog(u, a, b) * texto.length))`), `palomita` cuando termina.
- **Bucle.** Haz que el último cuadro coincida con el primero y pon `QUIETO_FINAL = 0`. Con cierre de comentario ya
  no es un bucle perfecto: elige una de las dos cosas y dilo.

## Recortes para el collage

Orden de preferencia: (1) foto real de la persona o de su producto, con el fondo quitado; (2) imagen generada sobre
fondo blanco y con el fondo quitado después (si tiene un generador de imágenes conectado: avisa lo que cuesta antes);
(3) dibujarlo con código, como hace el ejemplo cuando `RECORTES` está vacío. PNG de 1.000 px o más por el lado largo.
Nunca las imágenes de la referencia.

## Lo que la pieza base no hace

3D real, video filmado, seguir una mano o una cara, y sincronizar con los golpes de una canción. Si la mecánica de la
referencia depende de eso, mira si una skill de estilo lo resuelve; si no, dilo antes de empezar.
