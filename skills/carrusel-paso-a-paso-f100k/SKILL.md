---
name: carrusel-paso-a-paso-f100k
description: Carrusel «PASO A PASO» (how to) para Instagram: portada con tu foto recortada delante de un mockup real, láminas «Paso #N» con pastilla oscura y UN mockup que se puede copiar (filas fácil/medio/pro con miniaturas de tus reels, semanas de calendario, mapa de nicho y subtemas, tabla de tipos de contenido, calendario del mes lleno) y cierre con número gigante + caja de comentario con tu PALABRA. Mecánica clonada de un carrusel viral de marca personal (790 ❤ · 523 comentarios) y mejorada. Usar con «carrusel paso a paso», «carrusel how to», «carrusel tutorial de pasos», «carrusel de 5 pasos», «cómo planear mi mes en un carrusel». NO para carruseles de opinión (carrusel-pintado-opinion-f100k).
---

# Carrusel PASO A PASO (how to)

La plantilla lista está en `templates/carrusel.html` (ejemplo: «Cómo planear un MES ENTERO de contenido que vende»). Se cambia el TEMA, los DATOS y la PALETA; la mecánica se queda.

## Antes de escribir
1. Si tiene Yapper conectado: `mi_brandkit` (colores y letra) y `mi_manual` (nicho, oferta, regalo). Si no, pregúntale su nicho, su regalo y su @.
2. Pídele: 1 foto suya (se recorta el fondo) y 6-8 capturas reales (portadas de sus reels, su app, su calendario). **Nada de mockups vacíos ni emojis**: imágenes reales de su cuenta.
3. Las cifras solo si son suyas y puede mostrarlas. Si no tiene, el número del cierre es lo que trae su regalo (ej.: «10 ganchos»).

## Arquitectura (7 láminas, 1080×1350)
1. **Portada:** «Cómo [verbo] un» + pastilla oscura ENORME con el resultado + remate con UNA palabra en serif itálica resaltada. Mockup real del tema + su recorte delante + sello redondo con el nº de pasos + botón «Desliza →».
2–6. **Paso #N: TEMA** + subtítulo de 1-2 líneas + UN mockup copiable.
7. **CTA:** pregunta que conecta con su regalo + número gigante en caja + «Comenta» + caja de comentario con su avatar y la PALABRA + «y te mando…». La palabra va ligada al tema (nunca «YO»).

## Cómo se llena
- Imágenes en `img/` junto al HTML: `recorte.png` (su foto sin fondo), `avatar.png` (círculo), `reel01.jpg`…`reel08.jpg` (sus capturas).
- Los mockups se arman por JS desde datos (`cal()`, `filasT`, `nodos`, `niv`): cambia los arreglos, no el HTML.
- Paleta en `:root` (comentada): pon los colores de su brandkit.
- Reglas de oficio: `.grid` con `minmax(0,1fr)` (si no, el calendario se corta); fila de 7 miniaturas ≤ 82 px de ancho; nada de texto tapado por el recorte.

## Exportar
`node ../carrusel-formatos-f100k/export.js <ruta>/carrusel.html --width 1080 --height 1350 --scale 2` (genera slide-01.png…). Mira cada lámina antes de entregar.
