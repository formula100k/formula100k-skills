# Catálogo · Auto Edit Effects (20 efectos + 7 looks)

Complemento de `auto-edicion`. Son **golpes de 1 a 5 s sobre UNA frase**, en la escena de esa frase, dentro de cualquier estilo.
Mismas reglas que `auto-edicion/referencia/efectos.md`: un efecto cuenta lo que se dice en ese momento, máximo uno cada 3–5 s
y el mismo no más de 2 veces por reel.

Dos clases (iguales que en Auto-Edición):
- **Piezas de lienzo**: funciones de `motor/efectos-extra.js`. `auto-edicion/scripts/video.mjs` las inyecta solas en toda pieza. Se llaman dentro de la función de la escena en `ESC`.
- **Efectos de video**: van en `plano.json`, en la escena, como `"efecto": {"tipo": …}`. Los pre-renderiza `auto-edicion/scripts/efectos.py`, que le pasa a `video/efectos_extra.py` los tipos `puntos`, `ventana` y `look`.

«Ref» = de qué reel salió (A = @corbinsylk DeuQkT1BzGV · B = @corbinsylk DezeMvbTjl4 · C = Bruno Media DfHzFaoAw29).

## Piezas de lienzo

| # | Efecto | Ref | Cuándo usarlo | Cómo se pone (persona) |
|---|---|---|---|---|
| 1 | **Palabra ancla** | A, B `/match-cut` | Una palabra que se repite en titulares, mensajes o documentos reales («todos hablan de X»). Las páginas cambian detrás con corte seco; la palabra se queda fija en su recuadro. | `palabraAncla([[k,'texto real con la palabra'],…], t, {palabra})` · `oculta` |
| 2 | **Fotos que se tachan** | A `/shutter-strike` | «Antes era…», «se acabó», descartar algo. Fotos reales que entran y una línea roja las tacha. | `fotosTachadas([[k, FOTOS.x],…], t, {tachar: k, rotulo})` · `abajo` (panel arriba hasta y=960) |
| 3 | **Pantalla LED** | A, B `/screen-push-digital` | Una frase corta con peso, palabra por palabra en matriz de puntos a pantalla completa. | `pantallaLed([[k,'PALABRA'],…], t)` · `oculta` |
| 4 | **Tarjeta con curva** | A, B `/liquid-glass-graph` | Una cifra DICHA que crece (retención, ventas). Tarjeta oscura plana delante del pecho, curva verde y contador. | `tarjetaCurva(t, {tA, tB, de, a, sufijo, rotulo, titulo})` · `completa` |
| 5 | **Partículas en la caja** | A `/screen-push` | «Cientos», «se llena», acumular. Bolitas que caen, llenan la caja y rebalsan; la palabra cambia abajo. | `particulasCaja(t, {tA, palabras:[[k,'texto'],…]})` · `abajo` |
| 6 | **Prueba al lado** | A, B `/over-the-shoulder-zoom` | Un resultado, un antes y después, una decisión con fecha. La tarjeta aterriza junto a tu cara (SIN el zoom de la referencia). | `pruebaAlLado([[k,'ANTES','$3.200','al mes'],…], t)` · `completa` |
| 7 | **Carrusel 3D** | B `/pov-carousel-spin` | «Mis reels», «mis carruseles», un portafolio. Anillo de capturas reales que gira un lugar en cada palabra. | `carrusel3d([FOTOS…], t, {pasos:[k,…], titulo})` · `oculta` |
| 8 | **Interruptores** | B `/apple-ui-toggles` | Requisitos o pasos que se cumplen («un prompt, lo pegas, listo»). Cada switch se prende cuando lo dices. | `interruptores([[k,'Texto'],…], t, {desde})` · `completa` |
| 9 | **Widgets alrededor** | C `widgets cristal` | Tu sistema, tu tablero, «todo lo que hace». Hasta 6 tarjetitas planas rodean tu cara: cifra, barras, progreso, perfil, audio y anillo. | `widgets([{k, tipo, …},…], t)` · `completa` |
| 10 | **Tier list** | C `tier-list` | Comparar herramientas, opciones o niveles. Cada cosa cae en su fila (S–D) cuando la nombras; el título es la última. | `tierList([[k,'S', FOTOS.x \| 'Texto', color],…], t, {titulos})` · `completa` (panel abajo) |
| 11 | **Barras con tus datos** | C `split datos` | «Mis N reels más vistos», tus números reales. Barras que suben, línea de promedio; tú abajo. | `barrasSplit(t, {titulo:['Mis 7 reels','más vistos'], datos:[[k,'Etiqueta',valor],…]})` · `abajo` (y=1000) |
| 12 | **Pastillas detrás + titular** | C `premium` | Una advertencia o un giro («NO USES / ESTE SISTEMA»). Botones apilados DETRÁS de tu cabeza y titular de 2 líneas delante. | `pastillasDetras(t, {pastillas, titular})` · `["completa","recorte"]`, `FRENTE = true` (mate) |
| 13 | **Contador de vistas** | C `premium` | Tus vistas o ventas reales que cuentan hasta la cifra, con la línea que crece. | `contadorVistas(t, {tA, tB, de, a, titulo})` · `completa` |
| 14 | **Panel de render** | C `línea de tiempo` | «Lo hace por ti», un proceso que corre. Ventana de render con checks, pistas, onda y cabezal 0→100 %. | `panelRender(t, {titulo:['Lo','renderiza'], pasos, foto, tA, tB})` · `abajo` (y=1000) |
| 15 | **Comentario con la palabra** | A (cuadrícula final) | El CTA de la mitad o del cierre: la barra de comentarios escribe tu palabra letra por letra. | `comentarioCTA(t, {k, palabra, foto, rotulo:'Comenta'})` · `completa` |
| 16 | **Cuadrícula de cierre** | A, B, C (cierre) | El cierre: «Comenta PALABRA» + pastilla + tus tomas que llenan una cuadrícula. | `cuadriculaCierre([FOTOS…], t, {tA, palabra, sub, rotulos, extra})` · `oculta` |
| 17 | **Marco de comando** | A, B, C (el formato) | Mostrar que se hace con un comando: escribes `/comando` en el chat, se envía y tu video sale en una burbuja que crece. | `marcoComando(t, {comando, desc, tEscribe, tEnvia, foto})` + efecto `ventana` · `oculta` |
| 18 | **Titular detrás de ti** | C `titular`, `contorno`, `documental` | Una palabra gigante condensada que queda detrás de tu cuerpo. `contorno: true` = solo el borde. | `titularDetras(t, {k, palabra, contorno, y})` · `["completa","recorte"]` (mate) o `completa` (va encima) |
| 19 | **Rótulo VHS** | C `VHS` | Acompaña al look VHS: «▶ REPR.» y el contador de cinta. | `rotuloVHS(t - e.desde)` + `"efecto": {"tipo":"look","estilo":"vhs"}` |

## Efectos de video (`plano.json`)

| # | Efecto | Ref | Cuándo usarlo | Cómo se pone |
|---|---|---|---|---|
| 20 | **Trama de puntos** | A, B, C (entre efecto y efecto) | La entrada de una escena: tu video aparece como trama de puntos y se resuelve en 0,5 s. Sirve de transición, no de adorno: máximo 2 por reel. | `"efecto": {"tipo": "puntos", "dur": .5}` (debajo) |
| — | **Ventana** | A, B, C | Va con el Marco de comando: tu video en la burbuja del chat y, en `en`, crece a pantalla completa y frena seco. | `"efecto": {"tipo": "ventana", "de": [60,300,640,1060], "aparece": s, "en": s, "dur": .3}` (encima) |
| — | **Looks** | C | Un cambio de clima en UNA escena (un recuerdo, un «modo documental»). Nunca el reel entero. | `"efecto": {"tipo": "look", "estilo": …}` (debajo) |

Looks (`estilo`): `bn` (blanco y negro) · `calido` (brillo cálido) · `duotono` (`de`, `a`; por defecto violeta → naranja) ·
`documental` (duotono amarillo, va con `titularDetras`) · `cine` (barras 2.39, `barras: .16`) · `vhs` (colores corridos fijos + líneas + ruido; va con `rotuloVHS`) · `grano` (grano de película + viñeta).

## Reglas (además de las de efectos.md)
- 🔴 **Nada de zooms por defecto.** El «over-the-shoulder-zoom» de la referencia acerca la cara: aquí solo aterriza la tarjeta. Si piden el acercamiento, es el #1 de Auto-Edición.
- 🔴 **Sin «liquid glass», sin neón, sin brillo.** La tarjeta con curva y los widgets son planos y opacos (regla 10). El «foco neón» de la referencia C quedó fuera.
- 🔴 **Cifras solo dichas o de una fuente.** Tarjeta con curva, barras, contador de vistas y prueba al lado usan los números que la persona dice o los de sus estadísticas reales. Sin dato, no va el efecto.
- **Sin pitidos.** Los interruptores, la pantalla LED y el teclado del marco de comando tientan a poner clics: van con pop o golpe grave, nada sobre ~3 kHz.
- **Fotos y capturas reales.** El carrusel, la tier list y la cuadrícula usan capturas o cuadros del propio video, nunca íconos inventados. Saca cuadros con `ffmpeg -ss <s> -i fuente/cortado.mp4 -frames:v 1 -vf scale=540:-2 fuente/fotos/toma_01.jpg`.
- **El CTA:** «Comentario con la palabra» y «Cuadrícula de cierre» llevan una palabra ligada al tema. Nunca «YO» (regla 7).
- **Recorte + look:** si una escena `recorte` lleva un `look`, también tu recorte sale con el look (así se ve en «Contorno + B/N»).
- Un `look` y la `trama de puntos` son efectos de video: una escena lleva **uno** solo. Si quieres los dos, usa `{"tipo": "look", …, "puntos": true}`.


## Efectos de sonido (van siempre)
Todo reel con estos efectos lleva sonido en cada entrada. Se ponen en `plano.json` y `node auto-edicion/scripts/video.mjs render` los mezcla solo al final (`video/sonidos.py`):
```json
"sonidos_volumen": 0.4,
"sonidos": [[0.0, "golpe", 0.6], [2.6, "pop"], [6.9, "swish"], …]
```
Banco `sfx/`: 16 pop, 14 swish, 23 golpe, 2 papel y 1 desliza (CC0, todos graves, con pasa-bajos de 3,2 kHz por las dudas). Cada tipo va rotando entre sus variantes.

| Efecto | Sonido |
|---|---|
| Gancho, pantalla LED (cada palabra), titular, look nuevo | `golpe` |
| Palabra ancla | `swish` al entrar + `papel` bajito (0,25) cada 3 recortes |
| Fotos, interruptores, widgets, tier list, pastillas, comentario, panel de render | `pop` en cada cosa que entra |
| Tachar, prueba al lado, carrusel (cada giro), ventana que crece, cuadrícula | `swish` |
| Partículas en la caja | `desliza` |
Después del render escucha el final: si un efecto suena más fuerte que tu voz, baja `sonidos_volumen` (de 0,4 a 0,3) y vuelve a renderizar.
