# Sin grabar · estilo «Avatar pixel / Habbo»

Reel explicado 9:16 igual que el modo «Sin grabar» (subtítulo con selección de iPhone arriba, una escena con capturas reales al centro), pero lo presenta un **avatar 3D de cubitos estilo Habbo** (pixel art con contorno y 3 tonos), renderizado cuadro a cuadro con three.js: 6 gestos (`descanso`, `explica`, `senala`, `sorpresa`, `pulgar`, `pensar`) que pasan de uno a otro en 0,3 s, parpadeo y boca que se abre según el volumen real de la voz. No hace falta generar poses: 0 créditos de imagen.

## Archivos
- `pieza.src.html` — la pieza. Ejemplo: «Cómo Google Maps sabe que hay tráfico» (7 frases, ~24 s).
- `avatar-habbo.js` — el avatar (no se edita para un video nuevo). Carga three vía `<script type="module">`; no toca THREE al cargarse.
- `boca.mjs` — saca el volumen de la voz por cuadro a `fuente/boca.js`.
- `three.module.min.js`, `three.core.min.js` — three.js (MIT).
- `prueba.html` — hoja con los 6 gestos.
- `ejemplo/` — capturas reales y `tiempos.json` del ejemplo (para mirar la pieza sin voz).

## Qué se cambia por persona
Solo el objeto `LOOK` al inicio de `pieza.src.html`:
`piel`, `pelo`, `ropa` (4 tonos cada uno: luz, base, sombra, contorno), `ojos`, `labios`, `pelo_largo` (true/false), `lentes` (color del marco o null), `diadema` (4 tonos o null), `aretes`, `collar`.
Guárdalo también en `~/Documents/mi-contenido/auto-edicion/mi-look.json` (clave `habbo`) para reusarlo.

## Qué se cambia por video
`LINEAS` (texto con `*clave*` y `g: [[índiceDePalabra, 'gesto'], …]`, 2–3 gestos por frase, sin repetir el gesto entre frases seguidas), `ESC` (una escena por frase, entre y=330 y y≈1100; abajo va el avatar) y `rutas` (capturas reales en `fuente/`). La pieza lleva `// ANATOMIA: estilizada` porque el avatar es de cubitos.

## Armar y renderizar
`K` = la carpeta de la skill auto-edicion. Todos los comandos son `node` y corren igual en Mac y en Windows.
```
node K/scripts/nuevo.mjs <nombre-corto> --avatar habbo  # → ~/Documents/mis-videos-editados/<nombre-corto>/ (P)
# capturas reales del tema → P/fuente/ y en `rutas` · voz → P/voz/01.m4a, 02.m4a…
node K/scripts/voz.mjs "P"                              # recorta silencios y saca fuente/tiempos.json
node K/scripts/vista.mjs "P" 1s,4s,8s,12s               # cuadros sueltos (saca solo fuente/boca.js si hay voz)
node K/scripts/render.mjs "P" "P/reel.mp4"
```
Gestos sueltos: `node K/motor/renderizar.mjs K/plantilla/sin-grabar/habbo/prueba.html <carpeta>/g --cuadros 0,1,2,3,4,5`.
Probar la pieza de ejemplo sin voz: copia también `K/plantilla/sin-grabar/habbo/ejemplo/*` a `P/fuente/` y corre `vista.mjs`.
