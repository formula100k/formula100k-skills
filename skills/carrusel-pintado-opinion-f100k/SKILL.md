---
name: carrusel-pintado-opinion-f100k
description: Carrusel «PINTADO A MANO» de opinión + prueba para Instagram: portada con TU foto real a sangre y la promesa en letras a mano con estrellas pintadas; interiores en fondos pintados (salvia, crema, rojo, azul) con flechas, citas en cajas, tarjetas de papel con un dato real, tu captura real en polaroid y cifras subrayadas a pincel; cierre con tu foto recortada señalando + «Comenta PALABRA». Mecánica clonada de un carrusel viral de creadora (2,8 mil ❤ · 724 comentarios) y mejorada. Usar con «carrusel pintado», «carrusel de opinión», «carrusel a mano con mi foto», «carrusel de postura», «cómo te pagan por…». NO para tutoriales de pasos (carrusel-paso-a-paso-f100k).
---

# Carrusel PINTADO (opinión → prueba → CTA)

Plantilla lista: `templates/carrusel.html` (ejemplo: «Cómo te PAGAN por tener opiniones»). Los `[corchetes]` son lo que se reemplaza con datos REALES de la alumna.

## Antes de escribir
1. Si tiene Yapper: `mi_brandkit` (paleta) y `mi_manual` (nicho, postura, regalo). Si no, pregúntale su postura sobre el tema y su regalo.
2. Pídele: 1 foto suya de cuerpo entero en un lugar real con cielo/espacio libre arriba (portada), 1 foto recortada señalando o mirando a cámara (cierre) y 1-2 capturas reales que prueben lo que dice (perfil, métricas, mensajes).
3. **Nada de cifras inventadas.** Si no tiene un dato, esa lámina se quita (de 9 baja a 7-8) antes que inventar.

## Arquitectura (9 láminas, 1080×1350)
1. Portada: foto a sangre + promesa a mano en 4 tamaños (clave enorme en acento, remate en rojo). **El texto nunca encima de la cara.**
2. Tensión «[Algo] cambió.» · 3. «¿Qué quiere la gente?» + 3 flechas · 4. Reencuadre «Bienvenida a la era de…» · 5. Dos citas en caja («lo que dicen las que sí venden») · 6-8. PRUEBA (dato en tarjeta de papel, captura en polaroid + 2 cifras, comparación en 2 tarjetas) · 9. CTA con su recorte + «Comenta PALABRA» (palabra ligada al tema, nunca «YO»).

## Cómo se llena
- Imágenes en `img/`: `foto-portada.jpg`, `recorte.png`, `captura-real.png`.
- Estrellas y flechas son SVG con filtro de pincel (ya en la plantilla); cambia solo el `fill`. Nada de emojis.
- Paleta en `:root`: pon la de su brandkit. Letras: Caveat Brush (todo) y Special Elite (tarjetas); si su brandkit trae letra a mano, úsala.
- Cuerpo ≥ 62 px; sin líneas huérfanas.

## Exportar
`node ../carrusel-formatos-f100k/export.js <ruta>/carrusel.html --width 1080 --height 1350 --scale 2`. Mira cada lámina antes de entregar.
