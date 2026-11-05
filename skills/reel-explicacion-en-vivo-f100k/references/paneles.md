# Biblioteca de paneles

Cada frase de `guion.json` lleva un `panel`. El panel se dibuja en la mitad de arriba (1080 × 890 px) mientras se dice la frase.
Los tiempos internos son fracciones de la frase: si la frase dura más, todo se estira solo.

## Lo que vale para todos

| Campo | Qué hace |
|---|---|
| `"tipo"` | Cuál de los 15 paneles |
| `"queda": true` | El panel se queda dibujado el resto del bloque, debajo de los que vengan (el tablero se acumula) |
| `{ "sigue": true }` | Esta frase no trae panel nuevo: es el **siguiente paso** del panel anterior |
| `"dx"`, `"dy"`, `"escala"` | Mueve o achica el panel entero (px y factor) si lo combinas con otro |

Un panel con varios pasos al que le das una sola frase hace todos sus pasos dentro de esa frase.
Los textos largos se achican para caber; nunca se cortan. Aun así, mira la hoja de contacto.

Fuera del panel, en la **frase**: `"encuadre"` (`tarjeta`, `completa`, `panel`) y `"nota"` (rótulo «• ejemplo…» arriba a la derecha, desde esa frase).
En el **bloque**: `"ceja"` (rubro, arriba a la izquierda), `"nota"`, `"fuente"` (línea de fuente abajo), `"tema"`, `"utileria"`, `"rotulo"`, `"mascota"`, `"toma"`.

## Los 15

### 1 · `titulo` — portada de bloque («Si vendes / ropa»)
`arriba`, `palabra` (grande, en serif y color de acento), `abajo` (opcional), `icono`, `tamIcono`, `colorIcono`.
Es el panel pensado para `"encuadre": "completa"`: a pantalla completa quedan solo las dos líneas, arriba de la cabeza.

### 2 · `contador` — un objeto y una etiqueta con un número que sube
`objeto` (`saco`, `pan`, `caja`), `prefijo`, `hasta`, `desde`, `sufijo`, `remate` (pregunta bajo la etiqueta; la etiqueta tiembla al decirla), `color`, `oscuro`, `papel`.
Ocupa la izquierda (objeto) y arriba a la derecha (etiqueta). Con `"queda": true` deja libre abajo a la derecha para `puntos`.

### 3 · `puntos` — N puntos que se llenan + división (2 pasos)
`n`, `singular`, `plural`, `columnas`, `color`, `division: { cuenta, resultado, etiqueta }`.
Paso 1: se llenan y cuenta. Paso 2: «$90 ÷ 30 =» y salta el resultado. Vive abajo a la derecha.

### 4 · `rejilla` — rejilla que se pinta con restas (3 pasos)
`filas`, `columnas`, `rotulosFilas` (una letra por fila), `marcasColumnas` (números sobre la rejilla), `sufijoColumnas`,
`total: { etiqueta }`, `restas: [{ etiqueta, color, filas: [de, a], columnas: [de, a] }]`, `resto: { etiqueta, color }`, `pregunta`.
El total es filas × columnas y cada resta vale las casillas que pinta: **los números salen del dibujo**, no se escriben aparte.
Paso 1: aparece y cuenta el total. Paso 2: las restas, una tras otra. Paso 3: lo que sobra late, «= N» y la pregunta.

### 5 · `ramas` — uno → muchos (3 pasos)
`origen: { tipo: "pantalla" | "caja", etiqueta, marca, icono }`, `salidas: [{ n, forma, etiqueta, color, en }]`, `remate: { a, b }`, `color2`.
Formas: `vertical` (reel), `apilado` (carrusel), `aro` (historia), `circulo`, `ovalo`, `cuadro`, `plato`. De 1 a 4 salidas; hasta 6 piezas por salida.
Paso 1: el origen, grande. Paso 2: se hace a un lado y salen las ramas con su número. Paso 3: pastilla «a → b».
El `b` del remate es la suma de las salidas: súmala tú y compruébala.

### 6 · `escudo` — rayos contra un escudo, con porcentaje
`fuente` (icono de donde salen), `etiquetaEscudo`, `frenan` (de 100), `pasan` (qué rayos pasan, opcional), `sujeto` (lo que el escudo cuida),
`textoFrenados: [l1, l2]`, `textoPasan: [singular, plural]`, `colorFuente`, `colorEscudo`, `colorPasan`.
Salen 100 rayos de verdad: el contador sube con los que rebotan.

### 7 · `barra` — la barra que no llega al 100
`titulo1`, `titulo2`, `valor` (0–100), `etiqueta`, `extra: { ancho, texto }` (el poquito que suma lo siguiente; sin cifra si tu fuente no la da), `tope`, `remate`, `colorBarra`, `colorTope`.

### 8 · `reloj` — reloj con cuña
`horas` (cuánto barre la aguja), `ceja`, `antes`, `grande`, `lineas: []`, `nota`, `colorCuna`.

### 9 · `fichas` — antes / hoy
`antes: { etiqueta, lineas: [], icono }`, `hoy: { etiqueta, grande, lineas: [] }`, `corte` (0–1: cuándo entra «hoy»; ponlo donde lo dices).
La ficha de antes se apaga y se tacha cuando entra la de hoy con su ✓. Sin cifras si no tienes fuente para el costo de antes.

### 10 · `lista` — renglones con ✗ y ✓
`titulo1`, `titulo2`, `filas: [{ txt, ok, en }]` (2 a 4; `ok: true` es el renglón de acento con ✓; `en` = fracción de la frase en que cae).

### 11 · `mosaico` — una ficha por bloque
`celdas: [{ bloque, icono, texto }]` → presentación («te lo pruebo con estos N»), o
`celdas: [{ bloque, cifra, sub }]` → remates del cierre. `pie`: una frase, o `{ a, b }` en dos tonos. De 1 a 4 celdas.
Cada celda toma los colores del tema de su bloque. **`"tomas": "foto"` o `"clip"`**: en el montaje, cada celda muestra un cuadro
(o un clip mudo de 2 s en vaivén) de la toma de ese bloque, con su rótulo y su cifra encima. En la maqueta, sin tomas todavía,
se ve la ficha de color con la marca «● toma N». El segundo de donde sale el cuadro: `bloque.toma.mosaico` (por defecto, el inicio de la segunda frase).

### 12 · `comentario` — cierre con la caja que se escribe sola
`arriba` («Comenta»), `palabra` (por defecto `palabraCta`), `vacio`, `mensaje: { ceja, txt }`.
La palabra gigante, la caja donde se teclea letra por letra y se envía, y el mensaje que llega. Si hay mascota, brinca.

### 13 · `voz` — gancho: tu voz → un tablero que se arma
`titulo1`, `titulo2`, `etiquetaVoz`, `etiquetaTablero`. El primer cuadro ya trae el título escrito (es la portada del reel).

### 14 · `pastillas` — «yo: esto» → «la herramienta: esto otro»
`a: { icono, txt }`, `b: { grande, txt }`, `nota`.

### 15 · `frase` — la frase para llevarse
`l1`, `l2` (serif), `grande` (acento), `l4`.

## Iconos
`percha`, `reloj`, `play`, `sol`, `pan`, `horno`, `hoja`, `moneda`, `microfono`.
Si tu rubro pide otro, agrégalo en `plantilla/paneles.js` dentro de `ICONO` (una función `(x, y, tamaño, color, t)`), solo con trazos y formas simples.
Nada de manos, caras ni cuerpos dibujados: salen deformes.

## Temas
`"temas": { "nombre": { "fondo", "tinta", "ac", "gris", "panel", "pelo", "suave", "brillo" } }`, todos en hexadecimal de 6 cifras.
`ac` es el acento (un solo color fuerte por bloque), `panel` y `pelo` son el relleno y el borde de las cajas, `suave` un tono para la segunda línea
de `lista` y `frase`, `brillo: true` pone un resplandor del acento. Un tema por demostración: el cambio de fondo es lo que hace que se vea «otro estilo».

## Otros ajustes de `guion.json`
| Campo | Por defecto | Qué es |
|---|---|---|
| `palabraCta` | — | La palabra del CTA. Se pinta de acento en el subtítulo y se dice en minúsculas en la voz de prueba |
| `ritmo` | `{ pausa: .3, pausaBloque: .5, quietoFinal: 1.4, transicion: .28 }` | Respiros y duración del salto de encuadre |
| `tarjeta` | `{ x: 60, y: 890, w: 960, h: 960, r: 44 }` | Dónde va tu video |
| `completa` | `{ escala: .55, y: 30, velo: .9 }` | Tamaño y altura del título a pantalla completa, y qué tan opaco es el velo de arriba |
| `subtitulo` | `{ y: 1512, yCompleta: 1330, tam: 70, color, borde, colorCta }` | Subtítulos |
| `mascota` | sin mascota | `{ filas: [...], parpadeo: [...], paleta: { letra: color }, x, u }`: un sprite pixel que se sienta en el borde de la tarjeta en los bloques con `"mascota": true` |
| `vozGuia` | `{ nombre: "Paulina", ritmo: 190 }` | Voz de la computadora para medir |
| `bloque.toma` | `{ y: .15, x: .5, zoom: 1, mosaico }` | Recorte del cuadrado de esa toma (0 = pegado arriba) |
