# Plantilla HTML base — render de slides

El `export.js` busca elementos `.slide` y exporta uno por PNG. Cada `.slide` debe medir exactamente el formato detectado.

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<!-- Sustituir por las fuentes más cercanas al referente -->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    /* PALETA CLONADA del referente (aproximada) */
    --bg:    #F5EFE0;
    --ink:   #1A1A1A;
    --accent:#FF6B4A;
    --accent2:#F2C94C;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#888;} /* gris fuera del slide, no se exporta */

  .slide{
    width:1080px;height:1350px;       /* 4:5 — cambiar a 1080x1080 (1:1) o 1080x1920 (9:16) si aplica */
    position:relative;overflow:hidden;
    background:var(--bg);
    display:flex;flex-direction:column;
    padding:96px 88px;
    font-family:'Inter',sans-serif;color:var(--ink);
    margin:0 auto 24px;                /* separación visual al previsualizar; no afecta el PNG */
  }

  /* === reproducir aquí el LAYOUT del referente === */
  .titulo{font-family:'Playfair Display',serif;font-weight:800;font-size:104px;line-height:1.02;}
  .cuerpo{font-size:30px;line-height:1.5;max-width:80%;}
  .tag{font-size:24px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent);}

  /* foto del usuario (si el estilo la pide) */
  .foto-cutout{position:absolute;right:0;bottom:0;width:520px;height:680px;object-fit:cover;}
  .foto-circulo{width:280px;height:280px;border-radius:50%;object-fit:cover;}

  /* numeración + handle (patrón F100K si el referente no los tiene) */
  .num{position:absolute;bottom:56px;right:72px;font-size:28px;opacity:.45;}
  .handle{position:absolute;bottom:56px;left:72px;font-size:26px;opacity:.55;font-weight:500;}
</style>
</head>
<body>

  <!-- SLIDE 1 — PORTADA / HOOK -->
  <section class="slide">
    <span class="tag">@tu_marca</span>
    <h1 class="titulo">Gancho reescrito<br>con patrón F100K</h1>
    <p class="cuerpo">Subtítulo de apoyo, una sola idea.</p>
    <img class="foto-cutout" src="file:///ruta/absoluta/foto.jpg" alt="">
    <span class="handle">@tu_marca</span>
    <span class="num">1/7</span>
  </section>

  <!-- SLIDE 2..N — repetir variando layout según el ADN -->

</body>
</html>
```

## Notas

- Para 1:1 usar `width:1080px;height:1080px`; para 9:16 `1080x1920`. Pasar los mismos valores a `export.js` con `--width/--height`.
- Rutas de foto SIEMPRE absolutas con `file://`.
- Mantener la MISMA familia tipográfica y márgenes en todos los slides.
- Aplicar la capa de mejora (jerarquía, 1 idea/slide, contraste) — ver `capa-mejora-f100k.md`.
