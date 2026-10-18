# Efectos con librerías de código abierto

Estas animaciones son código (HTML + JavaScript). Por eso no hay que inventar cada efecto desde cero: se puede partir
de un proyecto que ya existe. Este archivo dice qué librería sirve para qué, con qué licencia, cómo pedírselo a Claude
y qué cuidar para que el video salga igual cada vez que se renderiza.

## Las librerías

Licencias revisadas el 7 de octubre de 2026 en el archivo de licencia de cada repositorio. Antes de publicar algo
comercial con una de ellas, abre el enlace y confirma que no cambió.

| Librería | Para qué sirve | Licencia | Dónde se verificó |
|---|---|---|---|
| **Rough.js** | Trazo a mano: círculos, flechas, subrayados y rellenos rayados que parecen hechos a lápiz | MIT | github.com/rough-stuff/rough → `LICENSE` |
| **p5.brush** | Acuarela, pincel, carboncillo, marcador y tramas con textura | MIT | github.com/acamposuribe/p5.brush → `LICENSE.md` |
| **Matter.js** | Física en 2D: cosas que caen, rebotan, se apilan o chocan | MIT | github.com/liabru/matter-js → `LICENSE` |
| **Anime.js** | Otro motor de animación (líneas de tiempo, trazos SVG, escalonados) | MIT | github.com/juliangarnier/anime → `LICENSE.md` |
| **PixiJS** | Lienzo WebGL rápido para muchas piezas a la vez | MIT | github.com/pixijs/pixijs → `LICENSE` |
| **PixiJS Filters** | Filtros sobre ese lienzo: brillo, desenfoque, grano, distorsión, aberración | MIT | github.com/pixijs/filters → `LICENSE` |
| **three.js** | 3D y esferas o nubes de partículas | MIT | github.com/mrdoob/three.js → `LICENSE` |

Dos que no son lo que parecen:

- **p5.brush necesita p5.js 2.x** en su versión normal, y p5.js es **LGPL-2.1** (github.com/processing/p5.js →
  `license.txt`). Trae también una versión «standalone» que no necesita p5.js (solo pide WebGL2).
- **GSAP**, el motor que ya usan estas plantillas, **no es de código abierto**: se distribuye con la licencia estándar
  «sin costo» de GreenSock (gsap.com/standard-license), que permite uso comercial gratis. Su repositorio no declara una
  licencia abierta.

MIT permite usar, copiar y modificar, también en trabajos comerciales, siempre que la copia de la librería conserve
su aviso de derechos de autor. Si copias el archivo de la librería dentro de tu proyecto, copia su licencia al lado.

## Cómo pedírselo a Claude

Dale el enlace del proyecto y di qué parte quieres. Tres pedidos que funcionan:

- «Parte de este ejemplo: `<enlace al ejemplo o al repositorio>`. Quiero **solo** el trazo de acuarela del fondo,
  con mis colores de `marca.md`. Lo demás de la pieza queda igual.»
- «Usa Matter.js para que las tres etiquetas caigan y se apilen al llegar al golpe fuerte. Calcula la caída antes y
  reprodúcela por tiempo, para que el render salga igual cada vez.»
- «Cambia los garabatos por trazo de Rough.js con semilla fija y enséñame un cuadro antes de renderizar.»

Qué decir siempre: **qué se toma** del proyecto (un efecto, no su estética completa), **qué no se toca** de tu pieza
y **con qué colores y letra** (los de tu `marca.md`). Un ejemplo ajeno trae su propia paleta y su propio ritmo: si no
lo dices, se cuelan.

## Para que el render salga igual cada vez

El render no reproduce la animación: pide cada cuadro por separado, dándole solo el segundo que toca, y a veces en
desorden o en paralelo. Todo lo que dependa de «haber llegado hasta aquí» se rompe. Reglas de HyperFrames
(`hyperframes-core`, `references/determinism-rules.md`), aplicadas a estas librerías:

1. **Nada de reloj real.** Sin `Date.now()`, `performance.now()`, `setTimeout`, `setInterval` ni
   `requestAnimationFrame` como fuente del movimiento. El cuadro se dibuja a partir del tiempo que entrega el render.
2. **Nada de azar sin semilla.** `Math.random()` suelto da un dibujo distinto en cada render. Usa la semilla de la
   librería o un generador con semilla propio.
3. **Todo se arma al cargar la página, de forma síncrona.** Nada de construir la animación dentro de un `async`, una
   promesa o un evento.
4. **Nada se descarga durante el render.** Las librerías y las imágenes van dentro de la carpeta de la pieza o se
   cargan antes de animar.
5. **Sin bucles infinitos** (`repeat: -1`, `loop: true` sin fin): calcula cuántas vueltas caben en la duración.
6. **Sin estados de ratón, scroll o foco:** en el render no existen.
7. **La duración total se lee del `data-duration` de la raíz del HTML**, antes de correr el JavaScript. Con lienzos
   (three.js, PixiJS, p5) es obligatorio escribirla: el render no puede adivinarla.

Qué significa para cada una:

| Librería | Qué cuidar |
|---|---|
| Rough.js | Cada llamada avanza su azar interno. Crea **un generador nuevo con `seed` fija** por figura (o dibuja siempre en el mismo orden). Lo que devuelve son trazados SVG: una vez calculados, no cambian |
| p5.brush | Fija `randomSeed()` y `noiseSeed()` (o `brush.seed()` y `brush.noiseSeed()` en la versión standalone). Sin `draw()` en bucle: pinta por tiempo. Lo más seguro es pintar la textura **una vez** y usarla como imagen fija de fondo |
| Matter.js | Una simulación no se puede «saltar» a un segundo cualquiera. **Calcúlala entera al cargar** con paso fijo (`Engine.update(engine, 1000/60)` en un bucle), guarda la posición de cada cuerpo por cuadro y, en el render, solo lee la posición que toca |
| Anime.js | Créala con `autoplay: false` y regístrala para que el render la mueva con `seek()`. HyperFrames trae un adaptador (`hyperframes-animation/adapters/animejs.md`) |
| PixiJS y filtros | Apaga su reloj (`app.ticker.stop()`, `autoStart: false`) y dibuja cuando llegue el tiempo. Los filtros animados reciben el tiempo como parámetro, nunca lo acumulan |
| three.js | Dibuja al recibir el evento `hf-seek` (adaptador `hyperframes-animation/adapters/three.md`). Las partículas se colocan con una función del tiempo y una semilla, no sumando velocidad cuadro a cuadro |

**Prueba mínima antes de confiar en un efecto nuevo:** saca el mismo cuadro dos veces y compáralo.

```bash
hyperframes snapshot --at 3.2 --no-end --describe false && cp snapshots/frame-00-at-3.2s.png a.png
rm -rf snapshots && hyperframes snapshot --at 3.2 --no-end --describe false
cmp a.png snapshots/frame-00-at-3.2s.png && echo "igual"      # si no dice «igual», el efecto no sirve para render
```

Si no sale igual y no encuentras el azar o el reloj que lo causa, no lo uses en el render: hornea el efecto como
imagen o como clip corto y ponlo de fondo.

## Qué está probado y qué no

- **Probado con render:** Rough.js 4.6.6 dentro de la plantilla de `animacion-collage-editorial-f100k` (campo
  `captura.trazo: "rough"`): el mismo cuadro capturado dos veces salió idéntico byte a byte, con un generador nuevo y
  semilla fija por garabato. El archivo va copiado en `plantilla/lib/rough.js` con su licencia al lado.
- **Sin probar en estas plantillas:** p5.brush, Matter.js, Anime.js, PixiJS, sus filtros y las esferas de partículas
  con three.js. Las reglas de arriba salen de la documentación de cada librería y de las reglas del render; la primera
  vez que uses una, haz la prueba mínima y mira los cuadros antes de entregar.
- En las animaciones que se graban en Chrome sobre fondo verde (`animaciones-para-tu-video-f100k`) no hay render
  cuadro a cuadro: ahí valen las reglas del verde de esa skill (colores sólidos, sin desenfoques ni transparencias),
  que descartan acuarelas y filtros.
