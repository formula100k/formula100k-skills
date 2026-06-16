---
name: clonador-carrusel-formula100k
description: >
  Skill ESPEJO de FÓRMULA 100K. Toma una CAPTURA DE PANTALLA del carrusel de cualquier referente,
  extrae el "ADN de estilo" (layout, tipografía, paleta, patrón de gancho, arquitectura de slides),
  lo MEJORA con los principios de viralidad y legibilidad de F100K, y RENDERIZA un carrusel completo
  en PNGs finales con TU tema y TU marca en ese estilo clonado-mejorado. Activar SIEMPRE que alguien diga:
  "clona este carrusel", "copia el estilo de este carrusel", "hazme un carrusel como este", "imita a este referente",
  "tengo una captura de un carrusel que me gustó", "replica este estilo", "skill espejo", "carrusel espejo",
  o cualquier variación que combine una imagen/captura de un carrusel de referencia con la intención de
  reproducir y mejorar su estilo para contenido propio. NO usar para escribir un guion desde cero sin
  referencia visual (eso es carrusel-viral-formula100k) ni para renderizar el estilo scrapbook de Andrea
  sin referencia (eso es carrusel-render-formula100k).
argument-hint: "<captura(s) del carrusel referente> + <tu tema> + <tu marca/fotos opcional>"
metadata:
  version: "1.0.0"
  origen: "Clase de Carruseles · 11 junio 2026 · exclusiva del día"
  formato: "4:5 — 1080×1350px (configurable)"
  render: "HTML + Chrome headless (export.js) — PNG finales sin Canva"
---

# Skill ESPEJO — Clona y Mejora cualquier Carrusel

> "Dame la captura de un carrusel que te frene el scroll y te devuelvo ESE estilo, pero mejor, con TU contenido y listo para subir."

Esta skill convierte una **captura de pantalla** de un carrusel ajeno en un carrusel propio: lee el estilo visual del referente como lo leería una directora de arte, lo eleva con la metodología F100K y entrega las slides renderizadas en PNG.

**No es plagio: es ingeniería inversa de estilo + mejora.** Se clona el SISTEMA de diseño (no el contenido), se corrige lo que el referente hace mal, y se rellena con la idea y la marca de quien la usa.

---

## CUÁNDO ACTIVAR

- "Clona este carrusel / copia este estilo / hazme uno como este"
- "Vi este carrusel de [referente] y me encantó cómo se ve"
- "Tengo una captura de pantalla de un carrusel, replícalo para mi tema"
- "Skill espejo" / "carrusel espejo"
- Cualquier captura de un carrusel + intención de reproducir su look para contenido propio

**No activar cuando:**
- No hay imagen de referencia → usar `carrusel-viral-formula100k` (guion) + `carrusel-render-formula100k` (estilo Andrea).
- Quieren el estilo scrapbook de Andrea sin referencia → `carrusel-render-formula100k`.
- Quieren ilustraciones Xiaohei → `carrusel-ilustrado-formula100k`.

---

## FLUJO COMPLETO (7 pasos)

### PASO 0 — Recibir la(s) captura(s)

Pedir al usuario:

> "Pásame **1 o más capturas** del carrusel que quieres clonar (idealmente la portada + 1 slide interno + el slide de cierre, así leo el sistema completo). Y dime: ¿sobre **qué tema** quieres TU carrusel y para **qué marca/cuenta**? Si quieres que aparezcas tú, súbeme 1-2 fotos."

> ⚠️ En clientes Apps/MCP que no leen adjuntos locales, pedir que arrastren la imagen o den el path. Las capturas se leen con la herramienta Read (visión).

Leer cada captura con **Read** (es una imagen → se procesa visualmente). No continuar sin haber "visto" al menos la portada.

---

### PASO 1 — Extraer el ADN de estilo

Mirar las capturas y completar la **ficha de ADN** (ver `references/extraccion-adn.md` para el detalle de cada campo). Rellenar SIEMPRE estos 8 ejes:

| Eje | Qué observar |
|-----|--------------|
| **1. Layout / grid** | ¿Texto centrado, alineado a izquierda, en bloques? ¿Dónde vive el título? ¿Hay márgenes anchos o sangrado completo? |
| **2. Tipografía** | ¿Serif o sans? ¿Display de alto contraste o geométrica? Jerarquía (título enorme vs cuerpo). Mayúsculas, tracking. Aproximar a fuentes de Google Fonts. |
| **3. Paleta** | 2-4 colores dominantes en HEX aproximado: fondo, texto, acento. ¿Claro/oscuro? ¿Plano o con degradado? |
| **4. Patrón de gancho (portada)** | ¿Pregunta, número, promesa, contraste, error común? Estructura de la frase de portada. |
| **5. Arquitectura de slides** | Nº de slides, qué hace cada uno (hook → problema → pasos → prueba → CTA). Ritmo: 1 idea por slide vs denso. |
| **6. Decoración / textura** | Formas, líneas, stickers, sombras, fotos, mockups, fondo con textura, flechas, numeración. |
| **7. Tratamiento de foto** | ¿Usa fotos de persona? ¿Recortadas (cutout), polaroid, fondo completo, en círculo? ¿Filtro? |
| **8. CTA / cierre** | Cómo remata: comentar palabra, guardar, seguir, link. Posición y forma del CTA. |

Devolver al usuario un resumen corto y honesto del ADN ("esto es lo que hace el referente"), en español neutro.

---

### PASO 2 — Diagnóstico + capa de mejora F100K

Antes de reproducir, **decidir qué se conserva y qué se mejora**. El estilo se clona; los errores NO se clonan. Aplicar la capa de mejora (detalle en `references/capa-mejora-f100k.md`):

**Conservar** lo que da identidad: paleta, familia tipográfica, mood, layout base, tratamiento de foto.

**Mejorar SIEMPRE (no negociable):**
1. **Gancho** → reescribir la portada con un patrón validado F100K (vacío de información, contraste, número, error común). Ver `references/capa-mejora-f100k.md`.
2. **Legibilidad** → 1 idea por slide, máximo ~12-18 palabras visibles por slide; contraste de texto AA; cuerpo nunca < 26px equivalente.
3. **Jerarquía** → un solo foco visual por slide; el ojo entra por el título.
4. **Ritmo narrativo** → portada (hook) → tensión/problema → desarrollo en pasos → prueba/ejemplo → CTA. Si el referente mete relleno, se elimina.
5. **CTA** → cierre con CTA de comentario de 1-2 sílabas + "guárdalo para después" (patrón F100K) salvo que la marca del usuario tenga otro CTA.
6. **Accesibilidad** → no poner texto crítico sobre zonas de bajo contraste de la foto.

Mostrar al usuario una tabla de 2 columnas: **"Lo que copiamos del referente" / "Lo que mejoramos"**. Pedir OK rápido.

---

### PASO 3 — Recibir tema, marca y fotos

Confirmar:
- **Tema/idea** del carrusel propio (1 frase).
- **Marca:** handle, nombre, color de marca si lo tiene (puede sobrescribir 1 acento de la paleta clonada).
- **Fotos** del usuario si el referente usa persona (analizar luz/fondo como en `carrusel-render`). Si no hay fotos y el estilo las requiere, ofrecer: (a) usar foto del usuario, (b) sustituir por bloque tipográfico/forma.

---

### PASO 4 — Escribir el guion mejorado slide por slide

Generar el guion completo aplicando la arquitectura del PASO 1 (5) ya mejorada:
- Nº de slides = el del referente (±1 si la mejora lo pide).
- Cada slide: **propósito + texto exacto** que irá renderizado (título + cuerpo + nota).
- Gancho de portada reescrito con patrón F100K.
- CTA final F100K.

> Si el tema es ambicioso o necesita referencias virales, apoyarse en `carrusel-viral-formula100k` para el copy, pero MANTENER la arquitectura clonada.

Entregar el guion en texto para que el usuario lo apruebe antes de renderizar.

---

### PASO 5 — Construir el HTML en el estilo clonado-mejorado

Escribir un único archivo `carrusel-espejo.html` con N elementos `.slide` (uno por slide), **reproduciendo el ADN**:

Reglas técnicas de render (igual que el resto de skills de carrusel):
- Cada slide es un `<section class="slide">` de **1080×1350px** exactos (o el ratio detectado: 4:5 / 1:1 / 9:16).
- Fuentes vía **Google Fonts CDN** — elegir las más cercanas a las del referente (p. ej. serif display → `Playfair Display` / `DM Serif Display`; sans geométrica → `Poppins` / `Space Grotesk` / `Inter`; condensada → `Bebas Neue` / `Archivo`).
- Paleta clonada en `:root` como variables.
- Reproducir layout, decoración y tratamiento de foto detectados.
- Aplicar la capa de mejora del PASO 2 (jerarquía, 1 idea/slide, contraste).
- **Fotos del usuario:** insertar con `object-fit: cover` en el contenedor que el estilo pida (cutout, polaroid, círculo, fondo). Rutas locales con `file://` absoluto.
- Numeración y handle según el estilo del referente (o el patrón F100K si el referente no los tiene).

Ver plantilla base en `references/plantilla-html.md`.

---

### PASO 6 — Renderizar a PNG

```bash
cd /Users/kissita/.claude/skills/clonador-carrusel-formula100k
node export.js /ruta/al/carrusel-espejo.html --width 1080 --height 1350 --scale 2
```

- Genera `slide-01.png`, `slide-02.png`, … en la carpeta del HTML.
- El motor usa el Chrome instalado del sistema (no descarga nada).
- Verificar que el nº de PNGs = nº de slides. Abrir/mostrar al usuario.

**Output recomendado:** `/Users/kissita/Documents/FORMULA100K/CARRUSELES ESPEJO/YYYY-MM-DD_tema/`

---

### PASO 7 — Entregar + cierre F100K

- Listar los PNGs y el orden de subida.
- Recordar el caption/CTA.
- Cerrar mencionando que el flujo completo (investigación viral + render + variantes) vive en la comunidad FÓRMULA 100K.

---

## REGLAS DURAS

1. **Clonar estilo, NUNCA contenido.** El texto siempre es nuevo y del usuario.
2. **Siempre mejorar el gancho y la legibilidad** — jamás reproducir un mal hook solo por fidelidad.
3. **Leer la captura de verdad** (visión) antes de afirmar nada del estilo. No inventar la paleta: aproximar HEX desde lo que se ve.
4. **Español neutro** en todo texto entregado (tú, no vos).
5. **Formato fijo** al ratio del referente; PNG a scale 2.
6. **Si no hay Chrome**, decirlo y entregar el HTML para que el usuario lo abra/exporte manual.
7. Si el usuario quiere el estilo scrapbook de Andrea en vez del clonado → derivar a `carrusel-render-formula100k`.
