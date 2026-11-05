# Ingeniería inversa · 2-nov-2026

Tres reels de referencia (cuentas públicas). Se descargaron con yt-dlp, se transcribieron con whisper-cli y se leyeron cuadro a cuadro a 2 fps.

| | Cuenta | Duración | Likes · comentarios | Audio | CTA |
|---|---|---|---|---|---|
| A · instagram.com/reel/DeuQkT1BzGV | @corbinsylk | 22,3 s | 34.419 · 22.030 | música en tendencia (sin voz) | Comment «STACK» |
| B · instagram.com/reel/DezeMvbTjl4 | @corbinsylk | 22,3 s | 23.852 · 17.795 | la misma canción (sin voz) | Comment «STACK» |
| C · instagram.com/p/DfHzFaoAw29 | Bruno Media | 28,4 s | 900 · 374 | la misma canción (sin voz) | comentar «claude» |

(Las vistas no vinieron en la descarga, así que no hay tasas.)

## El hallazgo: el formato es el efecto
Ninguno de los tres habla. Los tres usan la **misma estructura**, repetida 6 o 7 veces en 22 a 28 s:
1. **Pantalla de chat** (oscura, pestañas Chat/Código): se escribe `/nombre-del-efecto` en el teclado, con la sugerencia y su descripción encima (≈1 s).
2. **Se envía**: arriba a la derecha queda el comando en su burbuja y «✳ Editando con …» (≈0,3 s).
3. **El resultado sale en una burbuja**, entra como **trama de puntos** y se resuelve (≈0,5 s).
4. **Corte a pantalla completa** con el efecto andando (≈1–1,5 s).
5. Siguiente comando.
Cierre: `/stack` → «Comment STACK / for every effect's prompt» con la **cuadrícula de 20 miniaturas** que se llena. Es una vitrina, optimizada para comentario: 22.030 comentarios sobre 34.419 likes en A.
La palabra del CTA es el nombre del producto (STACK), no «YO».

## Efecto por efecto (lo que se ve → cómo lo hicimos)
| Comando en la ref | Lo que se ve | En la skill |
|---|---|---|
| `/match-cut` «News articles cut on one word, locked in place» | Recortes de diario con distinta letra que cambian; «Claude» en recuadro rojo queda fijo al centro; desenfoque de profundidad arriba y abajo | `palabraAncla` |
| `/shutter-strike` «Photo cards snap in, then strike through» | Panel claro arriba con tarjetas de foto que entran giradas; tú abajo | `fotosTachadas` (con la línea que tacha) |
| `/screen-push-digital` «Pixel words pushed through the screen» | «All / effects / made / in / one / prompt.» en matriz de LED, una palabra por golpe | `pantallaLed` |
| `/liquid-glass-graph` «A glass card with a graph that climbs» | Tarjeta de vidrio delante del pecho, RETENTION 19 % → 82 %, curva verde | `tarjetaCurva` **plana** (sin vidrio ni brillo) |
| `/screen-push` «Particles pour in, the screen pushes through» | Bolitas rojas que caen en una caja, rótulos 01/02/03 y palabra que cambia debajo | `particulasCaja` |
| `/over-the-shoulder-zoom` «Proof cards land beside your head» | Acercamiento + tarjeta «$3,200» → «AFTER $32,000 per month» junto a la cabeza | `pruebaAlLado` **sin zoom** |
| `/pov-carousel-spin` «Your reels on a 3D ring, swiped by hand» | Mano con el celular; los reels flotan en un anillo 3D | `carrusel3d` (sin mano: no se finge una mano) |
| `/apple-ui-toggles` «Switches flip on, one line at a time» | Tarjeta blanca: One prompt / Paste into Claude / Perfect result, switches que se prenden | `interruptores` |
| `/efectos-motions` (C) | Widgets alrededor: «36 efectos», barras «Gradación cálida», «Renderizando», perfil, reproductor «pops suaves», anillo 4K, «21 cortes» | `widgets` (planos y opacos) |
| `/efectos orbita` (C) | Reels flotando alrededor de la persona + «12 Formatos de contenidos» | ya existía: `orbita` (#13 de Auto-Edición) |
| `/efectos tier-list` (C) | Tier list S–D; ChatGPT, Gemini, Copilot… caen en su fila; título amarillo con el último | `tierList` |
| `/efectos split-datos` (C) | «Mis 7 reels más vistos»: 197K, 140K, 124K… barras amarilla y rojas, línea de promedio; tú abajo | `barrasSplit` |
| `/efectos premium` (C) | Pastillas violeta detrás de la cabeza + «NO USES / ESTE SISTEMA» → «SALVO QUE / ESTÉS LISTO» → «PARA QUE / TE BUSQUEN CLIENTES»; luego tarjeta «Vistas 1.548.685 → 2.454.885» | `pastillasDetras` + `contadorVistas` |
| `/efectos lista` (C) | «Claude está editando tu clip»: checks que se marcan | ya existía: `checklistPop` / `ventanaChat` |
| `/efectos linea-de-tiempo` (C) | «Claude lo renderiza»: ventana azul con pistas, onda, cabezal y 44 % → 82 % | `panelRender` |
| Cuadrícula de C | blanco y negro, VHS, polaroid, cine 2.39, duotono, titular «REELS», brillo cálido, contorno «BRUNO», grano de film, documental «UN CLIP.», foco neón, zoom golpe, subtítulos pop | looks `bn`, `vhs`, `cine`, `duotono`, `calido`, `grano`, `documental` + `titularDetras` (relleno y contorno). Polaroid, zoom y subtítulos ya existían. |
| Cuadrícula de A | barra de comentario con avatar escribiendo «PREMIU», «GUIDE» | `comentarioCTA` |
| Transición de todos | Cada resultado entra como trama de puntos | efecto de video `puntos` |
| Formato de todos | Chat + teclado + burbuja | `marcoComando` + efecto de video `ventana` |
| Cierre de todos | «Comment STACK» + pastilla naranja + cuadrícula | `cuadriculaCierre` |

## Lo que quedó fuera (y por qué)
- **Liquid glass y foco neón:** brillo y vidrio chocan con la regla 10 («sin olor a IA»). Se rehicieron planos.
- **El zoom del over-the-shoulder y el «zoom golpe»:** regla del 2-nov (sin zooms por defecto). El acercamiento ya existe y va solo si se pide.
- **La mano del POV:** habría que grabarla; no se dibuja una mano falsa (el motor bloquea manos y caras en vector).
- **Órbita, lista, polaroid y subtítulos pop:** ya estaban en Auto-Edición.
