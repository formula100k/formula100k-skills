# Modo «Con tu video»

La persona ya grabó (talking head, 9:16 o 16:9) y dice «edítalo como <estilo>». Tú cortas, pones subtítulos, dibujas los gráficos de ese estilo y renderizas. Todo corre en su compu y no gasta créditos.

`K` = la carpeta de la skill. `P` = `~/Documents/mis-videos-editados/<nombre-corto>` (en Windows, la carpeta Documentos de su usuario). Todos los comandos son `node` y corren igual en Mac y en Windows. La primera vez corre `node K/scripts/instalar.mjs`.

## Cómo está armado (3 capas)
1. **Tu video**, cortado y colocado donde diga cada escena (`persona` en `plano.json`).
2. **Los gráficos**: una pieza en canvas (`plantilla/con-tu-video.src.html`). Donde va el video, la pieza pinta verde `#00FF00` y ffmpeg lo reemplaza por el video.
3. Solo en las escenas `recorte`: la persona **recortada encima** de los gráficos. Lo que va **delante** de ella se dibuja dentro de `frente(() => …)`.

## Paso a paso

**1. Preparar y transcribir**
```
node K/scripts/video.mjs preparar "<video>" <nombre-corto> [desde] [hasta]
```
Crea `P`, imprime el texto en renglones con su segundo y su índice `#` y, al final, la ruta del proyecto.
- Lee todo el texto. Las tomas repetidas, las frases a medias y los «eh» largos van en `P/fuente/quitar.json` como `[[desde, hasta], …]`, en segundos del original.
- El CTA completo y las improvisaciones que suman se quedan.

**2. Corte fino**
```
node K/scripts/video.mjs cortar "P"
```
Deja solo los tramos con voz y produce `fuente/cortado.mp4` + `fuente/palabras.json`, con los tiempos en el video cortado.
- Revisa las uniones escuchando el resultado, no leyendo el texto. Si se come una sílaba, ajusta `quitar.json` y vuelve a cortar.
- Whisper confunde nombres propios (por ejemplo «Cloud» por «Claude»): corrígelos en `CORREGIR`, dentro de la pieza.

**3. Elegir el estilo y escribir `plano.json`**
Lee `referencia/estilos.md` y elige el estilo que pidió. Si no pidió ninguno, propón 2 que vayan con el contenido y deja que elija. Después parte el video en escenas: una por idea, cada 2 a 5 s, cortando siempre al inicio de una palabra (`dicho(k)`).
```json
{ "formato": "9:16", "cara": [0.5, 0.3],
  "escenas": [ { "desde": 0, "hasta": 3.16, "persona": "completa", "estilo": "gancho golpe" }, … ] }
```
- **`persona`** en 9:16: `completa` · `arriba` · `abajo` · `panel` (tarjeta abajo) · `oculta` · `recorte` (encima de los gráficos), o una caja propia `{"x":…,"y":…,"w":…,"h":…,"recorte":true}`.
- **`persona`** en 16:9: `completa` · `derecha` · `izquierda` · `esquina` · `oculta` · `recorte`.
- **`cara`**: dónde está la cara en el video, de 0 a 1. Mira un cuadro y ajústalo para que el recorte no le corte la cabeza.
- **Varias cajas a la vez**: `persona` también puede ser una lista de cajas. Cada caja `{"x","y","w","h"}` puede llevar `"recorte": true`, su propia `"cara"` y `"toma": 2`.
- **Otra toma tuya** («Dos de ti», «Novato vs. experto»): ponla en `fuente/toma2.mp4` y decláralo con `"tomas": {"2": "toma2.mp4"}`. Va muda: el audio siempre es el de tu video principal.
- **B-roll**: en la escena, `"broll": {"archivo": "broll/x.mp4", "x":…, "y":…, "w":…, "h":…, "desde": 0, "bn": true}`. El clip va mudo en esa caja, debajo de los gráficos, y `bn` lo pasa a blanco y negro. La pieza deja esa zona en verde. Usa SOLO clips que la persona grabó o que te dio. Para encontrar clips por tema: `referencia/biblioteca-broll.md`.
- **Clips de un video largo** («Clips rankeados», «Clips de una llamada»): corta el video largo completo, puntúa cada idea que se entiende sola (gancho en los primeros 3 s, una sola idea, una cifra o un giro, de 20 a 60 s), muéstrale el ranking y, con los que elija, escribe `clips.json` = `[{"nombre": "…", "desde": s, "hasta": s}, …]` en segundos del video cortado. Después corre:
```
node K/scripts/video.mjs clips "P" "P/clips.json"
```
  Cada clip queda como un proyecto aparte (`P-<nombre>`) y sigue desde el paso 3.

**4. Recorte de la persona** (solo si alguna escena es `recorte`)
```
node K/scripts/video.mjs mate "P"
```
Produce `fuente/mate.mp4`. La primera vez descarga el modelo de recorte (15 MB); después va a unos 6 cuadros por segundo. Funciona mejor con fondo liso y buena luz.

**5. Gráficos**
```
node K/scripts/video.mjs plantilla "P" <estilo>
```
Copia la plantilla del estilo (`plantilla/estilos/<estilo>.src.html`, el nombre está en `referencia/estilos.md`) y su plano de ejemplo (`fuente/plano.ejemplo.json`). Cada plantilla ya trae las piezas propias del estilo y un `ESC` de ejemplo. Sin estilo, copia solo el kit.
Reescribe `ESC`, con una función por escena en el mismo orden que el plano. Usa las piezas del kit:
- `hueco`, `fondo`, `gancho`, `titulo`, `subAjustado`, `pasos`, `contador`, `calendario`, `notificacion` y `tablero`.
- **Gancho y títulos con plantilla** (las mismas 21 de Yapper Edita, en `motor/titulos.js`): todo video abre con `gancho('línea chica', 'LÍNEA ENORME', t)` desde el cuadro 0, de 2 a 5 palabras que ella dice y que se leen como una sola frase. La plantilla se elige en el plano: `"gancho": "gigante"` (y `"titulo"` para los títulos de adentro, si quieres otra). Pregúntale cuál quiere o elige la que va con el tema: `gigante` (palabra que llena el ancho), `contraste`, `cartel`, `recorte`, `revista`, `pixel`, `sello`, `gastado`, `compinche`, `plumon`, `franja`, `escalera`, `fino`, `tecla`, `burbuja`, `hueca`, `pluma`, `chicle`, `carta` (`Titulos.lista` trae el «cuándo usarla» de cada una). En el gancho no uses `titular` ni `caramelo` (traen brillo). Títulos y gancho van en la capa de gráficos, nunca dentro de `frente(…)`, y sin tapar la cara.
- `detras` y `frente`, para las escenas `recorte`.
- `dicho(k)`, para que cada cosa entre justo cuando se dice la palabra k.

Colores y letras: cambia `C` (el acento y las letras) por los de su marca (`~/Documents/mi-contenido/mi-marca.md`). **Efectos** (acercamiento seco, foto que escapa, portal, revista, iPhone, chat…): van en una escena de cualquier estilo. Lee `referencia/efectos.md`.

Si el estilo pide una pieza que el kit no trae, créala en la pieza. Las capturas reales se cargan como en el modo «Sin grabar»: `cargarFotos` + `fotoCover`.

**6. Revisar y renderizar**
```
node K/scripts/video.mjs render "P" "P/<nombre>.mp4"
node K/scripts/cuadros.mjs "P/<nombre>.mp4" "P/hoja.jpg" 1 3 5 8 11 14 17 20 23
```
Mira la hoja antes de entregar y abre el video con `node K/scripts/sistema.mjs abrir "P/<nombre>.mp4"`. Corrige y vuelve a renderizar si pasa algo de esto:
- un gráfico tapa la cara;
- queda un tinte verde;
- el texto no se lee;
- algo entra antes de que se diga.

**7. Notas antes del final** (siempre que la persona quiera revisar antes de publicar)
```
node K/scripts/notas.mjs abrir "P" "P/<nombre>.mp4"
```
Abre en su navegador una página con el video: pausa, aprieta «Nota aquí» (o la tecla N) y escribe qué cambiar en ese segundo. Las notas se guardan solas en `P/notas.json`. Corre este comando en segundo plano y déjalo abierto mientras revisa.
1. Cuando diga que terminó, lee las notas que faltan: `node K/scripts/notas.mjs ver "P"`.
2. Aplica cada nota (corte, plano, pieza) y deja debajo qué hiciste: `node K/scripts/notas.mjs responder "P" <n> "qué hiciste"`. Si una nota no se puede, dilo ahí mismo y por qué.
3. Vuelve a renderizar con el MISMO nombre de archivo. La página avisa que hay una versión nueva y muestra tus respuestas debajo de cada nota.
4. Repite hasta que apriete «✓ Aprobado» (`ver` lo muestra). Si no puede abrir la página, que te dicte las notas así: «12,3 s: corta esta pausa».

## Reglas de la casa (mandan sobre cualquier estilo)
- **Gancho golpe en el segundo 0** de todo reel 9:16: de 2 a 5 palabras, una línea chica y una ENORME que se lean como una frase, con al menos una palabra clave del video. La voz arranca diciendo lo mismo que la pantalla. Antes de elegir, escribe 3 variantes, puntúalas y quédate con la más clara.
- **Nada tiembla ni rebota.** Las palabras y las piezas entran de a una con corte seco. Lo que se acumula (listas, rejillas, tableros) se queda y se va llenando.
- **Letra de diseño que va con el tema** en la palabra clave, con tamaños distintos dentro de la misma frase (la clave enorme, los conectores chicos). Sin brillo ni degradado 3D.
- **Capturas y fotos reales** de lo que se nombra (su perfil, la app de verdad, Google) en vez de íconos o emojis. Nunca un marcador gris vacío.
- **Sobre el verde, solo cosas opacas.** Una sombra o un velo translúcido queda como tinte verde encima del video. Tampoco uses `#00FF00` en los gráficos.
- **No inventes nada que no dijo.** Una cifra, una fecha o un nombre en pantalla tiene que estar en lo que se habla, o en una fuente que ella te dé.
- **No le tapes la cara**: en escenas `completa`, los gráficos van arriba de la cabeza o a la altura del pecho.
