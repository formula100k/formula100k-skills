# Tipos de bloque y campos de `config.js`

Lienzo 1080 × 1920. Toda posición `x`, `y` es el **centro** de la pieza en píxeles. Zona segura para texto:
de y = 230 a y = 1580 (arriba y abajo tapa la interfaz de la red).

## Campos generales

| Campo | Qué es |
|---|---|
| `nombre` | Nombre del MP4. |
| `audio` | Ruta de la voz (`voz/narracion.wav`). Sin audio el MP4 sale mudo y los tiempos se estiman. |
| `cola` | Segundos que se sostiene el último bloque después de la última palabra (1,6 por defecto). |
| `mostrarPendientes` | `false` esconde los avisos amarillos. |
| `colores` | `papel`, `tinta`, `acento`, `acento2`, `suave`, `alerta` y los nombres que quieras sumar. Se usan en `plano` y `color`. |
| `fuentes` | `sans`, `peso`, `tracking`, `serif`, `serifItalica`, `minusculas` (todo en minúsculas salvo `mayus`), `web` (URL de un CSS de fuentes; si no carga, el render se detiene). |
| `tamanos` | Cambia los tamaños con nombre: `gigante` 460, `xl` 250, `l` 170, `m` 116, `s` 80, `xs` 56. |
| `bloques[]` | La lista. Se muestran en orden, con corte seco. |

## Campos que acepta cualquier bloque

| Campo | Qué es |
|---|---|
| `tipo` | Uno de los once de abajo. |
| `frase` | Lo que dice la voz durante el bloque, tal como se lee (números en letras o en cifras, da igual). Una oración puede partirse en dos bloques seguidos. |
| `texto[]` | Renglones en pantalla (ver «Renglones»). No es subtítulo: solo las palabras que cargan la idea. |
| `zona` | Dónde se apila el texto: `arriba` (por defecto), `centro`, `abajo`. `textoY` fija el borde superior en px. |
| `tarjetas[]` | Piezas sueltas encima (ver «Tarjetas»). |
| `persona` | `{ img, x, y, ancho, en, flota, borde }`: recorte PNG con borde blanco de sticker. `borde: false` lo quita. |
| `pendiente` | Texto del aviso amarillo «PENDIENTE · …» para marcar que el bloque espera material real. |
| `plano` | Color de fondo liso (nombre de `colores` o hex). El texto se pone claro u oscuro solo. |
| `fondo` | En los tipos de plano liso, cambia el plano por una foto o un clip: `{ foto }` o `{ clip }`. `velo` (0 a 1) lo oscurece. |

### `en`: cuándo entra cada pieza

- Una **palabra de la frase** del bloque: `en: 'seis'`. Para la segunda vez que se dice: `en: 'cero#2'`.
- **Segundos** desde que empieza el bloque: `en: 0.8`.
- Sin `en`, un renglón entra cuando la voz dice su primera palabra (el renglón «162» encuentra «ciento sesenta y dos»).
  Si no la encuentra, se reparte entre los renglones vecinos. Las tarjetas sin `en` entran escalonadas.
- `sale` (misma sintaxis) hace desaparecer la pieza.

### Recurso (foto o clip)

`recurso: 'assets/foto.jpg'` o `{ foto, encuadre: '50% 30%', zoom: .05 }` (zoom lento; 0 lo deja quieto).
`recurso: { clip: 'nombre', desde: 0, velocidad: 1, bucle: false }`: el clip se pinta cuadro a cuadro desde el
inicio del bloque; si el bloque dura más que el clip, se queda en el último cuadro (`bucle: true` lo repite).
Los clips se preparan con `scripts/clip.mjs`. Sin recurso, o con `{ nota: '…' }`, sale un hueco rayado «AQUÍ VA: …».

### Renglones (`texto[]`)

Un texto suelto (`'hola'`) o un objeto:

| Campo | Qué es |
|---|---|
| `t` | El texto. |
| `letra` | `sans` (por defecto, pesada: la palabra que carga) o `serif` (fina: el conector). |
| `tam` | `gigante`, `xl`, `l`, `m`, `s`, `xs` o un número en px. Si no cabe en el ancho, se encoge solo. |
| `color` | Nombre de `colores`, `blanco`, `negro` o hex. |
| `mayus` | `true` = mayúsculas (guárdalas para el remate y un lugar). |
| `fx` | `sube`, `golpe` (llega grande y se asienta), `izq`, `aparece`. Por defecto: `golpe` en lo grande, `sube` en el resto. |
| `y` (y `x`) | Saca el renglón de la pila y lo pone a esa altura; con `x` se alinea a la izquierda desde ahí. |
| `giro`, `en`, `sale` | Inclinación en grados y tiempos. |

### Tarjetas (`tarjetas[]`, `piezas[]`, `adentro[]`, `cartas[]`, `fichas[]`)

| `tipo` | Campos | Qué dibuja |
|---|---|---|
| `calendario` | `arriba`, `valor` | Hoja de calendario: franja de color con «días» o «año» y el número grande. |
| `contador` | `valor`, `etiqueta` | Número grande con su unidad abajo («+149 / seguidores»). |
| `etiqueta` | `texto` | Una línea en una tarjeta blanca. |
| `burbuja` | `texto`, `propia` | Globo de mensaje dibujado. Úsalo solo si no tienes la captura real. |
| (sin tipo) + `img` | `img`, `ancho` | **Captura real** como tarjeta: esquinas redondas y sombra. |
| `objeto` | `img`, `ancho` | PNG sin fondo, con sombra (objeto recortado). |
| `sticker` | `img`, `ancho` | PNG sin fondo con borde blanco. |
| `pendiente` | `texto`, `ancho`, `alto` | Recuadro punteado «AQUÍ VA: …». |

Todas aceptan `x`, `y`, `giro`, `en`, `sale`, `fx` (`cae` por defecto, `brota`, `aparece`), `flota` (vaivén a saltos, en px) y `tam` (px de la letra).

## Los once tipos

| # | `tipo` | Para qué frase | Campos propios |
|---|---|---|---|
| 1 | `toma` | Presentación, lugar, el giro | `recurso` · `congela: 'palabra'` o `{ en, hasta }` (congela y pasa a blanco y negro; con `hasta` vuelve el color y el movimiento) · `encoge: 'palabra'` (el cuadro se encoge a un marco sobre negro) · `velo` |
| 2 | `remate` | La regla, lo que se subraya | `recurso` o `sigue: true` (usa el último cuadro del bloque anterior) · `movimiento: true` deja correr el clip. Texto en mayúsculas `xl` con golpe por defecto |
| 3 | `sticker` | Un plazo o un número propio | `plano` o `fondo` · `persona` · `tarjetas` · `sigue: true` conserva la persona y las tarjetas del bloque anterior ya puestas (cambia solo el fondo) |
| 4 | `contenedor` | Prueba, inventario guardado | `contenedor: { cerrado, abierto, x, y, ancho, abre: 'palabra', abiertoAncho, abiertoDx }` (por defecto el casillero de `assets/`; `cerrado: null` = entra ya abierto) · `adentro[]` (1 a 3 tarjetas; vacío = «no hay nada») |
| 5 | `bandeja` | Inventario («tengo esto, esto y esto») | `bandeja: { color, ancho, alto, y, entra }` · `piezas[]` con `x`, `y` medidos dentro de la bandeja (700 × 900): sin `en` llegan montadas, con `en` caen después y la bandeja avanza un paso |
| 6 | `franja` | Una decepción concreta | `recurso` (va en la franja) · `arriba`, `palabra`, `abajo` (texto o lista de textos) · `franjaY`, `franjaAlto` |
| 7 | `capturas` | Prueba social, «mira mi pantalla» | `cartas[]` (imágenes reales que caen) · `celular: { captura, clip, x, y, ancho, giro, encuadre, nota }` (marco de celular dibujado; adentro una captura o una grabación de pantalla) · `plano` o `fondo` |
| 8 | `carpeta` | Lo que se probó y no funcionó | `carpeta: { img, x, y, ancho, abre, cursor }` · `fichas[]` (textos o `{ img }`) · `tacha: 'palabra'` (se tachan todas desde ahí, una tras otra) o `tacha` en cada ficha · `seVan: true` (además se van) |
| 9 | `eco` | Lo que NO pasó, justo después de un inventario | Sin recurso: toma el bloque anterior, lo congela, lo desenfoca y le quita el color. `desenfoque`, `brillo`, `velo` |
| 10 | `apilado` | El giro, el cierre de una idea | `recurso` o `plano` · sin `texto`, parte la frase sola en renglones (sans y serif alternadas) y cada uno entra con su palabra · `desenfoca` (px) |
| 11 | `cierre` | El llamado a comentar | `palabra` · `verbo` («comenta») · `promesa[]` (renglones) · `regalo: { img, x, y, ancho }` o `null` · `persona` · `firma`, `firmaY` |

## Ritmo que hay que cuidar

- Un bloque nuevo cada 2 a 3 s; dentro de cada bloque, algo entra cada 0,5 a 1 s. `sincronizar.mjs` avisa de los bloques de más de 4,5 s.
- No repitas dos «temperaturas» seguidas: foto o clip real → plano de color con objeto → negro con franja.
- Blanco y negro solo dos veces: una para presentar (`congela`) y una para el remate.
- Mayúsculas solo en el remate y, si acaso, en un lugar o nombre.
- Sans para la palabra que pesa (el número, el verbo, el sustantivo); serif para el conector. Una o dos palabras por golpe.
