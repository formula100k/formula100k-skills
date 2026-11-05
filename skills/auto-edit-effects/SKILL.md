---
name: auto-edit-effects
description: Auto Edit Effects — complemento de «auto-edicion» con 20 efectos más y 7 looks de color, que se ponen en una escena de cualquier estilo de Auto-Edición «Con tu video». Efectos — palabra ancla (match-cut de titulares con una palabra fija), fotos que se tachan, pantalla LED palabra por palabra, tarjeta con curva, partículas que llenan una caja, prueba al lado de la cabeza, carrusel 3D de tus reels, interruptores que se prenden, widgets alrededor de tu cara, tier list, barras con tus datos, pastillas detrás de tu cabeza con titular, contador de vistas, panel de render, comentario que escribe la palabra del CTA, cuadrícula de cierre, marco de comando, titular gigante detrás de ti, rótulo VHS y trama de puntos de transición. Looks — blanco y negro, cálido, duotono, documental, cine 2.39, VHS y grano. Todo en tu compu y gratis, con sonidos graves. Activar con «auto edit effects», «ponle los efectos nuevos», «palabra ancla», «tier list en mi video», «interruptores», «pantalla LED», «look VHS / cine / duotono / documental», «marco de comando», «cuadrícula de cierre», «qué efectos nuevos hay».
argument-hint: <proyecto de auto-edicion> [efecto]
---

# Auto Edit Effects

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

Complemento de **auto-edicion**. No edita solo: suma 20 efectos y 7 looks al mismo motor. Todo corre en tu compu y no gasta créditos.

`K` = la carpeta de la skill `auto-edicion` · `X` = la carpeta de esta skill (la que tiene este `SKILL.md`; las dos van una al lado de la otra) · `P` = el proyecto del reel.
Todos los comandos son `node` y corren igual en Mac y en Windows.

## Cómo se conecta
- `node K/scripts/video.mjs render` inyecta `X/motor/efectos-extra.js` después de `K/motor/efectos.js` en toda pieza, si esta skill está instalada.
- `K/scripts/efectos.py` importa `X/video/efectos_extra.py` y le pasa los tipos que no conoce (`puntos`, `ventana` y `look`).
- Al final, si `plano.json` trae `"sonidos"`, el mismo render mezcla los efectos de sonido con `X/video/sonidos.py` y el banco `X/sfx/`.
Si esta carpeta no está, Auto-Edición funciona igual que antes.

## Paso a paso
1. **El reel sale del flujo normal de Auto-Edición** («Con tu video»: `K/referencia/con-tu-video.md`): preparar, cortar, `plano.json` y pieza con su estilo. Esta skill entra cuando armas las escenas, en las que piden un efecto.
2. **Elige el efecto por lo que se dice** en esa frase con `X/referencia/catalogo.md` (columna «Cuándo usarlo»). Si piden uno por nombre, ponlo; si piden «ponle efectos», propón de 3 a 6 momentos (frase → efecto → por qué) y espera el OK antes de renderizar.
3. **Ponlo:**
   - Las piezas de lienzo se llaman dentro de la función de la escena en `ESC` (ej. `(e, t) => { interruptores([[12, 'Un prompt'], [15, 'Lo pegas']], t); }`) y la escena lleva la `persona` que dice el catálogo.
   - Los efectos de video van en la escena de `plano.json`: `"efecto": {"tipo": "look", "estilo": "vhs"}`.
   - Fotos y cuadros del video van en `P/fuente/fotos/` y en `cargarFotos` de la pieza.
   - Los que necesitan recorte (pastillas detrás, titular detrás con `recorte`) piden antes `node K/scripts/video.mjs mate "P"`.
4. **Renderiza** igual que siempre: `node K/scripts/video.mjs render "P" "P/<nombre>.mp4"`.
5. **Sonidos:** pon `"sonidos"` en `plano.json` con la tabla del catálogo (cada efecto entra con su pop, swish o golpe grave). Sin sonidos el reel no se entrega.
6. **Revisa antes de entregar:** saca un cuadro por escena con efecto (`node K/scripts/cuadros.mjs "P/<nombre>.mp4" "P/hoja.jpg" <segundos…>`) y míralos: nada tapa la cara, nada se sale del cuadro y no hay huecos vacíos. Escucha el final: si un efecto suena más fuerte que tu voz, baja `sonidos_volumen`. Guarda el reel en `~/Documents/mis-videos-editados/<nombre>/`.

## Reglas que mandan
- **Sin zooms por defecto, sin «liquid glass», sin neón, sin brillo, sin temblor.** Todo entra con corte seco o frena seco cuando se dice.
- **No inventes cifras.** Tarjeta con curva, barras, contador de vistas y prueba al lado usan números dichos o de las estadísticas reales de la persona. Sin dato, no va el efecto.
- **Un efecto cuenta lo que se dice.** Máximo uno cada 3–5 s, y el mismo no más de 2 veces por reel. La trama de puntos es transición, no relleno.
- **Fotos y capturas reales**, nunca íconos inventados.
- **CTA con una palabra ligada al tema**, nunca «YO». «Comentario con la palabra» a mitad y «Cuadrícula de cierre» al final.
- **Sonidos graves** (pop, swish, golpe sordo): los interruptores, el LED y el teclado NO llevan clics agudos.

## Archivos
- `motor/efectos-extra.js` — las 19 piezas de lienzo.
- `video/efectos_extra.py` — trama de puntos, ventana y los 7 looks.
- `video/sonidos.py` + `sfx/` — mezcla de efectos de sonido (CC0, graves; créditos en `sfx/CREDITOS-openverse.json`).
- `referencia/catalogo.md` — qué es cada efecto, cuándo y cómo se pone.
- `referencia/ingenieria-inversa.md` — de qué reels públicos salió cada efecto y qué quedó fuera.
