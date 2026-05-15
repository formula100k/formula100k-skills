# Brandkit Visual — Andrea Vega · FÓRMULA 100K

> Esta es la **fuente de verdad** del estilo visual de los carruseles. Cualquier cambio aquí se aplica a todos los renders futuros.

---

## ESTILO BASE

**Estilo:** Scrapbook / collage / álbum personal
**Sensación:** Cuaderno de notas, tablero de ideas, "diario de creadora"
**Por qué funciona:** rompe el feed plano de Instagram con textura, asimetría y calidez. Genera sensación de cercanía vs. estética corporativa.

---

## PALETA DE COLORES

### Base
| Rol | Hex | Uso |
|---|---|---|
| Crema fondo | `#F5EFE0` | Fondo principal de todos los slides |
| Crema oscuro | `#EDE4CE` | Variación sutil para sombras/profundidad |
| Tinta | `#2B2218` | Color base de texto |

### Acentos
| Color | Hex | Uso |
|---|---|---|
| Terracota | `#C17F5A` | Doodles, subrayados, acentos cálidos |
| Salvia | `#8FAF8A` | Acento verde sereno (eco, calma, neutralidad) |

### Colores temáticos (uno por subtema cuando aplica)
| Color | Hex | Cuándo usarlo |
|---|---|---|
| Rojo | `#D85A4E` | Conflicto, ruptura, urgencia |
| Amarillo | `#F4C75B` | Sorpresa, cuidado, plot twist |
| Morado | `#B68EC8` | Misterio, exclusividad, premium |
| Verde | `#9BC289` | Coqueteo, complicidad, suave |
| Azul | `#7FA9C9` | Calma, neutralidad, confianza |
| Rosa | `#E8A8B8` | Dulzura, drama romántico |

### Post-its (bloques de highlight bajo texto)
| Color | Hex |
|---|---|
| Post-it amarillo | `#FFE881` |
| Post-it rosa | `#FFCAD4` |
| Post-it verde | `#CCE3B5` |
| Post-it azul | `#BFD8E8` |
| Post-it morado | `#DCC8E8` |

---

## TIPOGRAFÍAS

Cargadas vía Google Fonts CDN.

```html
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### Caveat (handwritten)
- **Uso:** títulos grandes, frases destacadas, citas, notas tipo manuscrita
- **Tamaños recomendados:**
  - Título portada: 130-180px
  - Título slide intermedio: 100-150px
  - Quote / nota: 36-52px
  - Subtítulo handwritten: 28-44px
- **Pesos:** 600-700 para títulos, 500-600 para notas

### Poppins (sans serif)
- **Uso:** cuerpo legible, listas, CTAs, etiquetas
- **Tamaños recomendados:**
  - Cuerpo: 26-30px
  - Etiquetas tipo tag: 22-26px (peso 800, letter-spacing 2px)
  - CTA: 30-36px (peso 800)
- **Pesos:** 400 cuerpo, 700-800 títulos/CTAs

---

## TEXTURA DE FONDO

Aplicar TODO slide con esta textura sutil de papel (CSS noise vía SVG inline):

```css
background:
  #F5EFE0
  radial-gradient(circle at 20% 30%, rgba(193,127,90,0.04) 0%, transparent 40%),
  radial-gradient(circle at 80% 70%, rgba(143,175,138,0.04) 0%, transparent 40%),
  url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 0.08 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
```

---

## ELEMENTOS DECORATIVOS

### Washi tape (cinta adhesiva)
- 1-2 piezas por slide, en esquinas o sobre títulos
- Dimensiones: ~140×32px
- Rotaciones: ±5° a ±12°
- Colores: variantes translúcidas de la paleta de acentos
- CSS:
```css
.tape {
  width: 140px; height: 32px;
  background: rgba(244, 199, 91, 0.55);
  border-left: 1px dashed rgba(0,0,0,0.08);
  border-right: 1px dashed rgba(0,0,0,0.08);
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}
```

### Post-its
- 1-2 por slide máximo
- Texto handwritten (Caveat)
- Box-shadow ofset hacia abajo-derecha
- Cinta adhesiva pequeña arriba (pseudo-elemento ::after)
- Rotaciones: ±3° a ±5°

### Stickers (emoji)
- 3-5 emoji por slide como elementos decorativos rotados
- Tamaños: 70-140px
- Filter drop-shadow para integrarlos al papel
- Emoji recomendados según tono:
  - **Drama/cotilleo:** 🍿 👀 🤫 💔 😏 💋 🔥
  - **Ruptura:** 💔 💥 😡 🚪
  - **Romance/coqueteo:** 💜 💚 😉 😏 ✨
  - **Calma/neutral:** 🧘‍♀️ ✌️ 🌿 🤗
  - **Acción/urgencia:** 🚀 ⚡ 🔥 📌
  - **Cierre/CTA:** 📌 🔖 💬 👇

### Doodles (subrayados a mano en SVG)
- Bajo títulos importantes o palabras clave
- SVG path con curva ondulada
- Color terracota o el acento del slide
- Stroke-width 3-4px, stroke-linecap round
- Ejemplo:
```html
<svg style="position:absolute; top:660px; left:80px; width:540px; height:30px;" viewBox="0 0 540 30">
  <path d="M5,18 Q135,4 270,15 T535,12" stroke="#C17F5A" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>
```

---

## IDENTIDAD

- **Handle Instagram:** `@andreaestratega`
- **Comunidad:** Fórmula 100K
- **CTA estándar de comentario:** Comenta **"100K"** y te enseño cómo
- **Frase de cierre:** "Guárdalo para después" + ícono 📌

---

## REGLAS DURAS (no romper)

1. **Formato fijo:** 1080×1350px (4:5 portrait Instagram)
2. **Fondo SIEMPRE crema con textura** — nunca blanco puro ni colores planos
3. **Mínimo de decoración:** todo slide debe tener al menos 1 tape + 2 stickers + 1 doodle o post-it
4. **Asimetría:** ningún slide repite la composición del anterior
5. **Slide final:** siempre con CTA "100K", frase "guárdalo para después", y handle visible
6. **Handle:** abajo izquierda en TODOS los slides, peso 500, color tinta al 55%
7. **Numeración:** abajo derecha tipo "3 / 7", color tinta al 45%, font Caveat 28px
