---
name: analizador-perfiles-formula100k
description: >
  Skill para analizar perfiles de Instagram y TikTok a profundidad usando Supadata MCP. Usar SIEMPRE que alguien pida: analizar un perfil, revisar métricas, identificar qué videos funcionan, qué videos repetir, qué videos dejar de hacer, qué genera seguidores, qué genera ventas, auditar una cuenta, diagnosticar por qué no crece un perfil, o cualquier solicitud de análisis de contenido en redes sociales. Basada en la metodología de FORMULA 100K para leer métricas como experto.
---

# Skill: Analizador de Perfiles FORMULA 100K

Skill especializada en auditar perfiles de Instagram y TikTok con la metodología de FORMULA 100K. Usa Supadata MCP para obtener datos reales de videos, métricas y tendencias.

---

## PROCESO OBLIGATORIO DE ANÁLISIS

### PASO 1 — Recolectar información del perfil
Preguntar si no se proporcionó:
1. ¿Cuál es el usuario o URL del perfil a analizar? (Instagram o TikTok)
2. ¿Cuál es el objetivo del creador? (vender, crecer audiencia, monetizar, autoridad)
3. ¿Cuánto tiempo lleva activo el perfil?
4. ¿Hay algún video o período específico que preocupa?

### PASO 2 — Extraer datos con Supadata MCP
Usar las herramientas de Supadata MCP para obtener:
- **`supadata_scrape`** o **`supadata_metadata`** → métricas generales del perfil (seguidores, posts, engagement rate)
- **`supadata_transcript`** → transcripción de videos clave para analizar ángulos de contenido
- **`supadata_map`** o **`supadata_crawl`** → listar todos los videos/reels disponibles con sus URLs

Para TikTok usar URLs del tipo: `https://www.tiktok.com/@usuario`
Para Instagram usar URLs del tipo: `https://www.instagram.com/usuario/`

Extraer al menos los últimos 20-30 videos si están disponibles.

### PASO 2.5 — Scrapear comentarios de los videos más virales
Identificar los **top 5 videos** del perfil con mayor número de comentarios o vistas.
Usar **`supadata_scrape`** apuntando directamente a la URL de cada video para extraer sus comentarios.

**Qué buscar en los comentarios (clasificar cada comentario en una categoría):**

| Categoría | Ejemplos | Qué revela |
|-----------|----------|------------|
| 🔍 **Preguntas sin responder** | "¿cómo hago para...?", "¿dónde consigo...?" | Vacío de contenido = oportunidad de video |
| 😤 **Frustraciones explícitas** | "nadie me explica...", "siempre me pasa que..." | Dolor de mercado no resuelto |
| 💡 **Deseos declarados** | "quisiera que hicieras un video de...", "me encantaría saber..." | Demanda validada de contenido |
| ⚠️ **Objeciones y miedos** | "sí pero...", "eso no funciona porque...", "qué pasa si..." | Ideas para refutar objeciones en contenido de venta |
| ✅ **Validaciones sociales** | "esto me pasó exactamente", "yo lo hice y funciona" | Prueba social → usar como ángulo de testimonial |

**Aplicar también a perfiles de competidores** si el usuario quiere analizar vacíos en su nicho:
- Scrapear los top 3-5 videos virales del competidor
- Buscar preguntas que el competidor NO respondió en su contenido
- Esas preguntas no respondidas = **vacíos de contenido** que tú puedes cubrir

Ver guía completa en: `references/analisis-comentarios.md`

### PASO 3 — Clasificar cada video en 4 categorías
Basado en métricas de comentarios, likes, compartidos y vistas:

| Categoría | Criterio | Acción |
|-----------|----------|--------|
| 🟢 **REPETIR** | Alto engagement + comentarios elevados | Hacer más videos con este ángulo |
| 🔵 **ESCALAR** | Vistas altas + bajo engagement | Mejorar CTA y gancho |
| 🔴 **ELIMINAR** | Bajo rendimiento en todo + 3+ meses sin tracción | Dejar de hacer este formato |
| 🟡 **OPTIMIZAR** | Potencial pero métricas mediocres | Cambiar gancho o estructura |

### PASO 4 — Análisis de Métricas con Metodología FORMULA 100K
Ver instrucciones detalladas en: `references/lectura-metricas.md`

Aplicar el marco completo de interpretación de métricas para dar diagnóstico preciso.

### PASO 5 — Identificar Ángulos Ganadores de Venta
Listar los videos con MÁS comentarios → estos son los **ángulos de venta ganadores**.
- Los comentarios = personas interesadas que puedes contactar
- Las vistas NO igualan ventas
- El video con más comentarios = el tema que más conecta con intención de compra
- Cruzar con el análisis de comentarios del PASO 2.5 para validar qué ángulos tienen demanda real

### PASO 5.5 — Detectar Vacíos de Contenido en Competidores
Si se analizaron comentarios de competidores en el PASO 2.5:
- Listar las preguntas recurrentes que el competidor NO respondió en su contenido
- Identificar frustraciones que siguen sin solución en el nicho
- Convertir cada vacío en una **idea de contenido accionable** para el creador analizado
- Priorizar por frecuencia: las preguntas que más se repiten = mayor demanda

Ver framework completo en: `references/analisis-comentarios.md`

### PASO 6 — Entregar Reporte Final
Estructura del reporte obligatorio (ver `references/reporte-estructura.md`).

---

## FRAMEWORK DE INTERPRETACIÓN RÁPIDA

### Señales de crecimiento de seguidores
- Videos con alta tasa de guardados → contenido de alto valor → genera follows orgánicos
- Videos con alto % de reproducción completa → formato correcto → el algoritmo lo amplifica
- Videos con muchos compartidos → contenido identificable → atrae audiencia nueva

### Señales de potencial de venta
- Videos con comentarios tipo pregunta ("¿cómo hago eso?", "¿cuánto cuesta?")
- Videos donde la gente menciona problemas específicos
- Videos con palabras clave del nicho en comentarios
- Estos son los **ángulos de venta**: repetirlos en variantes

### Señales de contenido a detener
- Videos con menos del 15% de engagement vs promedio del perfil
- Formato que no genera ni comentarios ni guardados ni shares
- Temas ajenos al nicho central que no conectan
- Videos donde las vistas son altas pero sin ninguna otra acción

---

## REGLAS DEL ANÁLISIS

1. **Vistas ≠ ventas.** Siempre priorizar comentarios y engagement cualitativo
2. **No recomendar borrar videos** a menos que tengan 3+ meses sin tracción y dañen la imagen del perfil
3. **Cada recomendación debe tener evidencia** del análisis (citar el video específico)
4. **Siempre dar ejemplos accionables** de qué cambiar (no solo decir "mejora el gancho", sino cómo)
5. **Comparar contra el promedio del propio perfil**, no contra benchmarks externos genéricos
6. Si no hay datos suficientes (perfil muy nuevo, menos de 10 videos), indicarlo claramente

---

## REFERENCIA DETALLADA

Para lectura de curvas de retención y patrones de métricas:
→ `references/lectura-metricas.md`

Para estructura del reporte final:
→ `references/reporte-estructura.md`

Para scrapeo y clasificación de comentarios + detección de vacíos de contenido:
→ `references/analisis-comentarios.md`
