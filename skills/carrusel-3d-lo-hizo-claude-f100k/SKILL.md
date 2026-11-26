---
name: carrusel-3d-lo-hizo-claude-f100k
description: Carrusel «LO HIZO CLAUDE» de 6 láminas con objetos 3D hechos en Blender por código (sin créditos ni Photoshop) para Instagram: portada con título grande y Claudito 3D que rompe el marco, capas explotadas numeradas, tablet atravesada por un objeto 3D, abanico de tablets con TUS diseños reales, 4 pastillas y cierre «COMENTA PALABRA» con objeto 3D a sangre. Usar con «carrusel 3D», «carrusel hecho con Claude», «carrusel con objetos 3D en Blender», «carrusel que muestre que lo hizo Claude». NO para tutoriales de pasos (carrusel-paso-a-paso-f100k).
---

# Carrusel 3D «lo hizo Claude»

Plantilla lista: `templates/gen.py` (textos editables arriba; lee las imágenes de `img/` y escribe `carrusel.html`) y `templates/carrusel.html` (ejemplo ya generado, con marcadores donde van tus imágenes). Modelado 3D por código en `blender/` (Claudito, un lápiz, una planta de cubitos; Cycles con GPU, PNG con fondo transparente).

## Antes de escribir
1. Si tiene Yapper: `mi_brandkit` (paleta y letras) y `mi_manual` (nicho, postura, regalo). Si no, pregúntale su nicho y su regalo.
2. Pídele 3 capturas o diseños REALES suyos (posts, portadas, pantallas) para las tablets de la lámina 4 y la portada dentro de la tablet de la 3. Nunca uses diseños ajenos ni inventados.
3. Palabra del CTA ligada al tema (nunca «YO»). **Nada de cifras inventadas**: si no tiene un dato real, no lo pongas.

## Arquitectura (6 láminas, 1080×1350)
1. Portada: pastilla, frase corta, título en 2 líneas (acento / tinta), «DESLIZA PARA VER →», Claudito 3D delante de un bloque de color. La frase debe entenderse sola («mira este carrusel / HECHO 100% / CON CLAUDE»).
2. Capas explotadas 1-5 (papel, título, bloques, personaje, detalles) con las capas reales de la portada.
3. «No usé Photoshop…»: tablet con la portada atravesada por un objeto 3D.
4. «Puedo replicar cualquier estilo»: abanico de 3 tablets con TUS diseños.
5. «Además de hacerlo, Claude también:» 4 pastillas, la última en el color de acento.
6. CTA gigante «COMENTA / PALABRA» + objeto 3D a sangre.

## Cómo se hace
1. **3D** (`blender/`): instala Blender (gratis). Desde la terminal: `SALIDA=./salida ./todo.sh` (o una pieza: `SALIDA=./salida blender -b -P escena.py -- hero`). Salen `hero`, `pose`, `lapiz` y `planta` en `salida/render/`. Para otro tema cambia los objetos de `escena.py` (nuevo tema = nuevos objetos con sentido) y los colores. Claudito es la mascota de la comunidad; úsalo tal cual.
2. Copia los PNG a `img/` y tus diseños como `tab-a.jpg`, `tab-b.jpg`, `tab-c.jpg`.
3. Edita los textos y colores de arriba de `gen.py` (paleta de tu brandkit) y corre `python3 gen.py`.
4. Exporta: `node ../carrusel-formatos-f100k/export.js <ruta>/carrusel.html --width 1080 --height 1350 --scale 2`. Mira cada lámina antes de entregar.

## Reglas
- Renders a ≥1600 px (los de 800 px se ven suaves a ×2); `ESCALA` sube la resolución.
- Letras: Dela Gothic One para títulos y Zilla Slab para el cuerpo (Google Fonts); si su brandkit trae otras, úsalas.
- Títulos grandes con la clase `.fit` (autoajuste: no se desbordan).
- Capturas y diseños reales en las tablets, nunca un mockup vacío.
