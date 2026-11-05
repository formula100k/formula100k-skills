# Sin grabar · Avatar 3D

**Qué es:** el mismo reel explicado de «Sin grabar» (subtítulo con selección de iPhone arriba, una escena por frase al centro), pero el avatar de abajo es un personaje 3D hecho con código (three.js) en vez de PNG por pose. Se mueve solo: parpadea, mira, mueve la boca con el volumen de la voz y pasa de un gesto a otro con brazos y dedos. No cuesta créditos de imágenes: solo la voz.

**Cuándo elegirlo:** cuando la persona no tiene poses de caricatura hechas (o no quiere gastar ~33–55 créditos en ellas), o pide «avatar 3D», «que se mueva», «que hable». Con poses PNG ya hechas, sigue la plantilla normal (`plantilla/ejemplo-ruido.src.html`).

## Archivos
| archivo | qué hace |
|---|---|
| `pieza.src.html` | ejemplo completo (tema: cómo se arma Discover Weekly de Spotify). Se cambian `MI_LOOK`, `LINEAS`, `GOLPE_HASTA`, `ESC` y `rutas`, igual que en la plantilla normal. |
| `avatar3d.js` | el avatar. Arriba del todo está **`LOOK`**: el aspecto por defecto. |
| `boca.mjs` | saca el volumen de la voz cuadro por cuadro → `fuente/boca.js`. `node K/scripts/vista.mjs` y `render.mjs` lo corren solos si hay voz en `voz/rec/`. |
| `three.module.min.js`, `three.core.min.js` | three.js (MIT), local: no depende de internet. |
| `cap_*.jpg`, `m_*.png` | capturas reales del ejemplo (Spotify For the Record). En un reel nuevo se reemplazan por las de su fuente. |

## El look de cada persona
Pregunta y pon en `MI_LOOK` (en la pieza) o directo en `LOOK` (en `avatar3d.js`, para que valga en todos sus reels):
`piel`, `pielSombra`, `pelo`, `largoPelo` (`'corto'` a la mandíbula · `'medio'` a los hombros · `'largo'` al pecho), `flequillo`, `ojos`, `cejas`, `labios`, `rubor`, `pecas`, `ropa`, `ropaDetalle` (cuello y puños), `botones`, `lentes` + `marco`, `diadema` (color o `null`), `aretes`, `collar`, `metal`.
Todo son colores hex o sí/no. Lo que no se pone sale del `LOOK` por defecto. Guárdalo también en `~/Documents/mi-contenido/auto-edicion/mi-look.json` como `"avatar3d": { … }` para el próximo reel.
El pelo siempre cae recto y el cuerpo es delgado y de la cintura para arriba (así quedó aprobado el diseño).

## Gestos
`poses: [[índiceDePalabra, gesto], …]` en cada frase, con los números 1–20 de `referencia/poses.md` + `'oidos'` (manos en las orejas). El gesto arranca 0,18 s antes de su palabra y llega en 0,32 s. 2 o 3 por frase, sin repetir el mismo en frases seguidas. El 6 (celular) muestra en la pantalla el texto de `palabra` de `Avatar3D.iniciar` (en un CTA, la palabra del CTA).

## Armar el proyecto
`K` = la carpeta de la skill auto-edicion. Todos los comandos son `node` y corren igual en Mac y en Windows.
```
node K/scripts/nuevo.mjs <nombre-corto> --avatar 3d     # → ~/Documents/mis-videos-editados/<nombre-corto>/ (P) con la pieza y el avatar
# capturas reales del tema → P/fuente/ y en `rutas` (las del ejemplo no se copian)
# voz: P/voz/01.m4a, 02.m4a… (paso 5 de SKILL.md), luego:
node K/scripts/voz.mjs "P"
node K/scripts/vista.mjs "P" 1s,4s,8s,12s,16s,20s,24s
node K/scripts/render.mjs "P" "P/<nombre>.mp4"
node K/scripts/cuadros.mjs "P/<nombre>.mp4" "P/hoja.jpg" 1 4 8 12 16 20 24
```
`vista.mjs` y `render.mjs` sacan solos `fuente/boca.js` (el volumen de la voz por cuadro) cuando hay audios en `P/voz/rec/`:
sin voz el avatar sale con la boca cerrada. Dos cosas a saber:
- La pieza trae la línea `// ANATOMIA: estilizada — …`: el motor frena las piezas que mencionan piel o manos dibujadas en vector, y aquí el cuerpo es 3D. No la borres.
- Si Whisper escribe una cifra en números («56») y tu `txt` la tiene en letras («cincuenta y seis»), corrige esa palabra en `fuente/tiempos.json` (una entrada por palabra) para que el subtítulo cuadre.

## Capturas
Algunas páginas (Spotify, por ejemplo) bloquean el Chrome headless del motor. Si `playwright screenshot` falla, sácalas con el navegador del chat (no headless) en ancho de celular (430 px, escala 3), seleccionando la frase de la fuente para que salga resaltada en azul, y recortando solo esas 2–3 líneas: así se leen en el reel.
