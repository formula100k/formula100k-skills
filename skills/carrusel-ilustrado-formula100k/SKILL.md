---
name: carrusel-ilustrado-formula100k
description: >
  Skill para crear carruseles de Instagram con ilustraciones minimalistas estilo Xiaohei (hand-drawn, figura negra sólida, fondo blanco puro). Activar SIEMPRE que alguien diga: "carrusel ilustrado", "carrusel estilo Xiaohei", "ilustraciones minimalistas para carrusel", "carrusel con dibujos", "carrusel con ilustraciones", "slides ilustrados", o cualquier variación que implique generar un carrusel con ilustraciones de personaje hand-drawn en lugar de fotografías o diseño tipográfico. Esta skill selecciona el tipo de ilustración más adecuado para cada slide (de 8 tipos disponibles), construye el prompt para Higgsfield nano_banana_2, genera todas las imágenes en paralelo, y entrega el layout guide para armar el carrusel final en Canva.
argument-hint: "[tema o guion del carrusel] [contexto: educativo / venta / storytelling]"
metadata:
  version: "1.0.0"
  modelo: "nano_banana_2"
  formato: "4:5 — 1080×1350px"
  estilo: "Xiaohei hand-drawn · fondo blanco · acentos naranja F100K"
---

# Skill: Carrusel Ilustrado — Fórmula 100K

Genera carruseles de Instagram (5-8 slides) con ilustraciones estilo Xiaohei: figura sólida negra, fondo blanco puro, line art hand-drawn, acentos mínimos en naranja F100K (#F59E0B). Cada slide recibe el tipo de ilustración más efectivo para el concepto que comunica.

---

## CUÁNDO ACTIVAR

- "carrusel ilustrado de [tema]"
- "carrusel estilo Xiaohei"
- "ilustraciones minimalistas para carrusel"
- "carrusel con dibujos"
- "slides ilustrados sobre [concepto]"
- Cualquier carrusel donde el concepto sea abstracto y necesite visualización conceptual

**No usar esta skill cuando:** el carrusel necesita fotografías fotorrealistas de personas, mockups de UI, o diseño tipográfico puro sin ilustración. En esos casos → `higgsfield-carrusel-generador` o `carrusel-render-formula100k`.

---

## LOS 8 TIPOS DE ILUSTRACIÓN

Cada slide del carrusel recibe exactamente uno de estos tipos. La asignación se hace en el PASO 2.

| # | Tipo | Úsalo para | Xiaohei en escena |
|---|------|------------|-------------------|
| 1 | **Workflow** | Procesos secuenciales, metodologías, sistemas paso a paso | Caminando a lo largo de una línea de pasos numerados o subiendo escaleras |
| 2 | **System Locale** | Componentes de un sistema, stacks de herramientas, módulos de un curso | Parado en el centro con flechas o conexiones hacia los elementos del sistema |
| 3 | **Before/After Contrast** | Estado malo vs. bueno, antes/después de aprender algo | Dos versiones del mismo escenario: izquierda caótica, derecha ordenada |
| 4 | **Role Status** | Estado mental/situacional del lector (se identifica con Xiaohei) | Posturas expresivas: abrumado (papeles cayendo), enfocado (zoom en pantalla), victorioso (brazo arriba) |
| 5 | **Concept Metaphor** | Hacer tangible un concepto abstracto (algoritmo, engagement, autoridad) | Literalizando la metáfora: megáfono gigante, imán atrayendo personas, balanza con ideas |
| 6 | **Method Layering** | Jerarquías, pirámides, capas que se construyen una sobre otra | Construyendo o sosteniendo capas apiladas como bloques o plataformas |
| 7 | **Map/Route** | Roadmaps, journeys del cliente, secuencias de decisión | Viajando por un mapa con puntos de decisión o en un camino que se bifurca |
| 8 | **Comic Strip Sequence** | Historias cortas, "esto te ha pasado", storytelling en secuencia | En 3-4 paneles narrativos que cuentan una situación de principio a fin |

---

## FLUJO COMPLETO

### PASO 0 — Recibir el tema o guion

Si el usuario solo da un tema sin desglose de slides:
→ Preguntar: ¿Es educativo, de venta o storytelling? ¿Hay un hook/CTA concreto?

Si ya hay un guion o lista de puntos:
→ Continuar al PASO 1 directamente.

---

### PASO 1 — Diseñar la arquitectura de slides

Determinar cuántos slides (recomendado: 5-8) y asignar a cada uno:
- **Número de slide**
- **Propósito** (hook / desarrollo / CTA / conclusión)
- **Concepto central** que debe comunicar

**Estructura tipo recomendada para carrusel educativo/venta F100K:**

| Slide | Propósito | Tipo recomendado |
|-------|-----------|-----------------|
| 1 | Hook visual — captura atención | Role Status o Concept Metaphor |
| 2 | Problema identificado | Before/After Contrast |
| 3-5 | Desarrollo del método o idea | Workflow o Method Layering |
| 6 | Sistema completo o visión | System Locale o Map/Route |
| 7-8 | CTA o llamada a acción | Role Status (victorioso) o Comic Strip |

---

### PASO 2 — Asignar tipo de ilustración a cada slide

Para cada slide, seleccionar el tipo más efectivo usando esta lógica:

```
¿El slide muestra un proceso con pasos ordenados?  → Workflow (1)
¿El slide muestra partes/herramientas de un sistema?  → System Locale (2)
¿El slide contrasta dos estados opuestos?  → Before/After Contrast (3)
¿El slide describe cómo se SIENTE el lector?  → Role Status (4)
¿El slide usa una metáfora para explicar algo abstracto?  → Concept Metaphor (5)
¿El slide muestra niveles, capas o jerarquía?  → Method Layering (6)
¿El slide muestra un camino, journey o decisión?  → Map/Route (7)
¿El slide cuenta una historia o situación narrativa?  → Comic Strip Sequence (8)
```

---

### PASO 3 — Construir prompts para Higgsfield

Para cada slide, construir el prompt en inglés usando esta plantilla base y reemplazando las secciones `[BRACKETED]`:

```
Minimalist hand-drawn illustration on pure white (#FFFFFF) background.
Black ink line art style, slightly irregular "hand-drawn" quality lines.

CHARACTER: Xiaohei — solid black figure, white dot eyes, thin stick legs, 
blank neutral expression. [DESCRIBE the specific action Xiaohei is performing 
related to the slide concept].

COMPOSITION: Subject occupies 45-55% of frame. Large white space around subject.
[DESCRIBE any props, arrows, labels, or annotation elements in the illustration].

ACCENTS: Minimal use of orange #F59E0B for emphasis annotations only. 
Maximum 2 accent elements total. No other colors.

STYLE: Eccentric and creative but clean. Not cute, not kawaii. 
"Absurd professional worker" aesthetic. Similar to Chinese editorial illustration style.
No gradients, no shadows, no textures. Pure geometric minimalism.
NEVER include any text or watermarks in the illustration.

FORMAT: 4:5 vertical composition optimized for Instagram (1080x1350px equivalent).
```

**Adaptaciones por tipo de ilustración:**

**Tipo 1 — Workflow:**
```
CHARACTER: Xiaohei walking along a horizontal path with [N] numbered circular 
nodes connected by arrows. At step [X], Xiaohei is positioned mid-stride 
pointing forward. Each node has a simple icon representing [step concepts].
COMPOSITION: Path extends across 80% of frame width. Xiaohei at center-left.
```

**Tipo 2 — System Locale:**
```
CHARACTER: Xiaohei standing at center with arms slightly raised. 
[N] labeled boxes or circles float around Xiaohei connected by thin arrows 
pointing inward/outward, representing [system components].
COMPOSITION: Xiaohei at exact center, components arranged in orbit around subject.
```

**Tipo 3 — Before/After Contrast:**
```
CHARACTER: Two instances of Xiaohei — LEFT: surrounded by [chaotic elements: 
scattered papers/tangled lines/question marks]. RIGHT: same pose but orderly, 
with [clean elements: organized stacks/clear arrow/checkmark].
COMPOSITION: Vertical dividing line at center. Left zone labeled "BEFORE" area, 
right zone labeled "AFTER" area. Each side occupies equal frame space.
```

**Tipo 4 — Role Status:**
```
CHARACTER: Xiaohei in [specific expressive pose]: 
- Overwhelmed: arms raised, surrounded by floating papers/notifications
- Focused: leaning toward glowing screen, one hand on chin
- Victorious: one arm raised, small star burst above head
- Confused: tilted head, question mark floating nearby
[Match the pose to the emotional state of the slide].
COMPOSITION: Xiaohei occupies center 50% of frame. Emotional props in surrounding space.
```

**Tipo 5 — Concept Metaphor:**
```
CHARACTER: Xiaohei holding/operating/interacting with [literal object that 
represents the concept]: a giant megaphone for reach, a magnet attracting 
tiny figures for engagement, a scale with ideas for decision-making, 
a telescope for strategy, a funnel for conversion.
COMPOSITION: The metaphor object is larger than Xiaohei (60-70% of frame height).
Xiaohei appears small but in control of the giant object.
```

**Tipo 6 — Method Layering:**
```
CHARACTER: Xiaohei standing beside or on top of a stack of [N] rectangular 
layers/platforms, each labeled with a simple icon. Bottom layer is widest, 
top layer is narrowest. Xiaohei is at the top layer, arms spread wide.
COMPOSITION: Pyramid/stack centered in frame. Xiaohei at apex. 
Orange accent on the top layer to indicate achievement.
```

**Tipo 7 — Map/Route:**
```
CHARACTER: Xiaohei walking or riding a simple vehicle along a winding path 
that connects [N] labeled waypoints: [list waypoints]. At a fork in the path, 
Xiaohei has one arm raised pointing toward the correct direction.
COMPOSITION: Path creates an S-curve or Z-pattern across the full frame. 
Start point at bottom-left, destination at top-right. Waypoints as small circles.
```

**Tipo 8 — Comic Strip Sequence:**
```
CHARACTER: Xiaohei in [3-4] equal panels arranged in a 2x2 grid or horizontal strip.
Panel 1: [action/situation]. Panel 2: [reaction/development]. 
Panel 3: [turning point]. Panel 4: [resolution/punchline].
COMPOSITION: Thin black borders separate panels. Each panel has equal size.
Xiaohei's expression/posture changes significantly between panels.
```

---

### PASO 4 — Generar imágenes en paralelo

Llamar a `mcp__higgsfield__generate_image` para TODOS los slides simultáneamente.

Parámetros para cada llamada:
```
model: "nano_banana_2"
prompt: [prompt construido en PASO 3]
aspect_ratio: "4:5"
quality: "high"
```

Esperar los resultados y anotar el job_id de cada generación.

---

### PASO 5 — Verificar y descargar resultados

Para cada job_id:
1. Llamar `mcp__higgsfield__job_status` hasta que el status sea "completed"
2. Obtener la URL de la imagen generada
3. Descargar a: `/Users/kissita/Documents/FORMULA100K/RECURSOS VIDEOS/[YYYY-MM-DD]_carrusel-ilustrado-[slug-del-tema]/`
   - Naming: `slide-01-[tipo].png`, `slide-02-[tipo].png`, etc.

Si alguna imagen no refleja el estilo Xiaohei correctamente (fondos de color, sombras, kawaii):
→ Reforzar el prompt con: `"IMPORTANT: Pure white background only. Solid flat black figure. Zero gradients. Zero shadows. Zero cute/kawaii aesthetic."`
→ Regenerar ese slide solo.

---

### PASO 6 — Construir el Layout Guide para Canva

Entregar un documento de instrucciones para armar el carrusel en Canva:

```markdown
## Layout Guide — Carrusel Ilustrado: [TEMA]
Formato: 1080×1350px (4:5) · Fondo: #FFFFFF · Fuente: Inter o Poppins

---

### SLIDE 1 — [Propósito: Hook]
Imagen: slide-01-[tipo].png
Posición de imagen: centrada, ocupa 55-65% del alto del slide
Texto superior (si aplica): [texto corto, Inter Bold 48-56px, negro #1A1A1A]
Texto inferior: [titular principal, Inter Black 72-80px, negro #1A1A1A]
Subtexto (si aplica): [Inter Regular 32px, gris #666666]
Acento: línea o caja naranja #F59E0B detrás del texto clave

### SLIDE 2 — [Propósito]
...

### SLIDE [N] — CTA
Imagen: slide-0N-[tipo].png
Texto: [CTA directo, máximo 2 líneas]
Elemento visual: flecha naranja apuntando al CTA
```

**Reglas de texto para todos los slides:**
- Título principal: Inter Black o Poppins ExtraBold, 64-80px
- Cuerpo: Inter Regular, 32-40px, máximo 3 líneas por slide
- Color de texto: #1A1A1A (casi negro) sobre fondo blanco
- Acento naranja (#F59E0B): SOLO para destacar 1 palabra clave o el CTA
- Espacio entre ilustración y texto: mínimo 40px
- Márgenes laterales: 60px cada lado

---

## REGLAS DE ESTILO XIAOHEI

Mantener en TODOS los slides:

- **Fondo**: #FFFFFF puro — sin grises, sin degradados, sin texturas
- **Figura Xiaohei**: negro sólido #000000 — sin gradientes, sin sombras, sin rellenos
- **Line art**: trazo irregular hand-drawn — NO vector perfecto, NO bordes suavizados
- **Ojos**: dos puntos blancos simples — NO expresión facial compleja
- **Piernas**: delgadas, de palo — NO anatomía realista
- **Tono**: excéntrico y profesional — NUNCA kawaii, NUNCA cute, NUNCA infantil
- **Espacio blanco**: abundante — el sujeto ocupa máximo 55% del frame
- **Color de acento**: naranja #F59E0B (F100K) — máximo 2 elementos por slide
- **Texto en imagen**: NINGUNO — todo el texto va en Canva sobre la imagen

---

## CARPETA DE SALIDA

```
/Users/kissita/Documents/FORMULA100K/RECURSOS VIDEOS/[YYYY-MM-DD]_carrusel-ilustrado-[slug]/
├── slide-01-role-status.png
├── slide-02-before-after.png
├── slide-03-workflow.png
├── slide-04-method-layering.png
├── slide-05-system-locale.png
├── slide-06-concept-metaphor.png
├── layout-guide.md
└── prompts-usados.md   ← guardar todos los prompts para referencia
```

---

## REFERENCIA RÁPIDA

Consultar `references/guia-ilustraciones.md` para:
- Ejemplos concretos de F100K por cada tipo de ilustración
- Tabla de elementos visuales con descripción en inglés para el prompt
- Galería de combinaciones de tipos por formato de contenido
