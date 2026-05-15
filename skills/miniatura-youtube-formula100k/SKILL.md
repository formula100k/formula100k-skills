---
name: miniatura-youtube-formula100k
description: >
  Skill especializada en generar miniaturas y portadas virales para YouTube usando NanoBanana y las fotos del usuario. Usar SIEMPRE que alguien pida: crear una miniatura de YouTube, generar una portada para video, diseñar thumbnail, hacer la imagen de mi video de YouTube, analizar miniaturas de la competencia, optimizar mi miniatura, crear variaciones de thumbnail. Basada en la metodología de FORMULA 100K con análisis de competencia real.
argument-hint: "<palabra clave o tema del video>"
metadata:
  version: "1.0.0"
  author: AndreaEstratega
---

# Skill: Miniatura YouTube FORMULA 100K

Genera miniaturas optimizadas para YouTube usando tus fotos + NanoBanana, con análisis de la competencia. Metodología basada en FORMULA 100K: menos es más, CTR primero.

---

## PROCESO OBLIGATORIO

### PASO 1 — Recolectar inputs del usuario

Si no se proporcionaron en el mensaje, preguntar (una sola vez, todo junto):

1. **Palabra clave / tema del video** — ¿Qué buscaría alguien para encontrar tu video? (ej: "cómo ganar dinero en Instagram")
2. **Título tentativo del video** — Para que la miniatura complemente sin repetir
3. **Fotos disponibles** — ¿Tienes una foto tuya de fondo removido (PNG) o quieres usar una foto nueva? Pide que arrastren el archivo o den la ruta
4. **Palabras para la miniatura** — 2 a 5 palabras máximo que irían en el cartel. Si no sabe, sugerir basado en el tema
5. **Estilo de miniatura** — ¿Cuál prefieres? Ver tabla en `references/estilos-plantillas.md`. Si no sabe, usar el **Estilo FORMULA 100K (fondo negro + amarillo)**

Si el usuario solo da la palabra clave, continuar con defaults: estilo FORMULA 100K, generar palabras sugeridas tú mismo.

---

### PASO 2 — Investigar miniaturas de la competencia

Usar **WebSearch** para buscar miniaturas similares al tema del video:

```
Buscar: site:youtube.com "<palabra clave>" thumbnail miniatura
Buscar: youtube "<palabra clave>" miniaturas más clickeadas
```

También usar **Playwright** para capturar resultados visuales de YouTube si es necesario:
- Navegar a `https://www.youtube.com/results?search_query=<palabra+clave>`
- Tomar screenshot de los primeros 8-12 resultados
- Analizar visualmente qué patrones se repiten

**Qué analizar de la competencia:**

| Elemento | Qué observar |
|----------|--------------|
| 🎨 **Paleta de colores** | ¿Qué colores dominan? ¿Hay un color que destaca? |
| 📝 **Texto en miniatura** | ¿Cuántas palabras? ¿Qué palabras usan más? |
| 😄 **Expresiones** | ¿Cara de sorpresa, seria, sonriente, señalando? |
| 🖼️ **Composición** | ¿Persona a la izquierda? ¿Centrada? ¿Con objetos? |
| 📊 **Patrones de nicho** | ¿Hay un estilo que se repite en los top videos? |
| ⚡ **Oportunidad de diferenciación** | ¿Qué hace NADIE que podría funcionar? |

Generar un reporte breve de 3-5 observaciones clave antes de crear la miniatura.

---

### PASO 3 — Planificar la miniatura (brief creativo)

Basado en la investigación, armar el **Brief Visual** siguiendo la metodología FORMULA 100K:

**Checklist obligatorio (leer `references/metodologia-miniaturas.md`):**
- [ ] Entendible en menos de 1 segundo
- [ ] Complementa el título (NO repite el mismo mensaje)
- [ ] Expresión facial de emoción (sonrisa, sorpresa, confianza)
- [ ] Colores contrastantes (amarillo+negro, rojo+blanco, azul+amarillo)
- [ ] Elemento de tracción visual (flecha, ícono, cartel)
- [ ] Espacio negativo — no sobrecargar
- [ ] Máximo 3-5 palabras en el texto de la miniatura

**Definir para el prompt de generación:**
- Fondo: negro sólido (default FORMULA 100K) o alternativo según estilo elegido
- Posición de la persona: centrada o ligeramente a la derecha/izquierda
- Texto del cartel: 2-5 palabras en MAYÚSCULAS, color amarillo vibrante (#FFD700)
- Expresión que necesita la foto: indicar al usuario si necesita una foto específica
- Elementos adicionales: íconos de plataformas, flechas, checkmarks, etc.

---

### PASO 4 — Generar con NanoBanana

**Leer `references/banana-thumbnail-config.md` antes de generar.**

Configurar siempre para YouTube:
```
Aspect ratio: 16:9
Resolution: 2K (imageSize: 2K)
Model: gemini-3.1-flash-image-preview
```

**Si el usuario tiene foto propia (PNG con fondo removido):**
Usar `gemini_edit_image` pasando la foto y el siguiente prompt mejorado:

```
PROMPT BASE (adaptar al caso):
[Nombre/descripción de la persona] centered on pure solid black background,
confident [smiling/surprised/determined] facial expression looking directly at camera.
Yellow bold text banner "[PALABRAS EN MAYÚSCULAS]" prominently placed [above/below] 
the person in thick sans-serif font. [Íconos opcionales: Instagram icon, TikTok icon,
arrow emoji, checkmark]. Negative space preserved — clean, uncluttered composition.
High-contrast YouTube thumbnail, 1280x720 format. Professional photography quality.
MUST have solid black background with NO gradients.
```

**Si NO tiene foto o quiere generar una:**
Usar `gemini_generate_image` con descripción detallada de la persona:

```
PROMPT BASE:
Hispanic woman in her [edad] with [descripción física], confident smile, 
looking directly at camera, wearing [ropa de marca/professional], 
centered on pure solid black background. Yellow bold text banner 
"[PALABRAS]" prominently placed at bottom in thick sans-serif font. 
Professional studio photography with dramatic front lighting.
YouTube thumbnail 16:9 format, clean composition, high contrast.
```

**Generar 3 variaciones obligatorias:**
- **Variación A**: Texto arriba, persona centrada
- **Variación B**: Texto abajo, persona ligeramente a la izquierda con espacio a la derecha
- **Variación C**: Texto lateral, persona con expresión diferente o elemento adicional (ícono, flecha)

---

### PASO 5 — Post-procesamiento (si es necesario)

Si la imagen necesita ajustes exactos de dimensiones:

```bash
# Recortar a dimensiones exactas YouTube (1280x720)
magick input.png -resize 1280x720^ -gravity center -extent 1280x720 thumbnail_final.png

# Si el usuario quiere remover fondo de su foto antes de componer
magick foto.jpg -fuzz 15% -transparent white foto_sin_fondo.png
```

Verificar ImageMagick disponible:
```bash
which magick || which convert || echo "Instala: brew install imagemagick"
```

---

### PASO 6 — Entregar resultado con análisis estratégico

Después de generar, siempre entregar:

1. **Las 3 imágenes generadas** con sus rutas
2. **Recomendación de cuál usar primero** (y por qué según la investigación de competencia)
3. **Estrategia de iteración CTR:**
   - Si CTR < 4% en las primeras 2 horas → cambiar el TÍTULO primero
   - Si CTR sigue bajo tras otras 2 horas → cambiar a Variación B de miniatura
   - Máximo 3-4 cambios de miniatura por video
4. **Palabras de alto impacto** sugeridas para el cartel si aún no está optimizado
5. **Próxima acción**: ¿Quieres que genere también el título optimizado?

---

## DEFAULTS Y ESTILO ANDREA ESTRATEGA

Cuando el usuario no especifica estilo, aplicar el **Estilo FORMULA 100K**:

- **Fondo**: Negro sólido (#000000)
- **Posición persona**: Centrada o ligeramente derecha
- **Texto**: Cartel amarillo vibrante (#FFD700) con 2-4 palabras en bold sans-serif
- **Expresión**: Sonrisa de confianza / dominio
- **Íconos**: Instagram, TikTok, o emojis de plataforma según nicho
- **Composición**: Limpia, mucho espacio negativo
- **Palabras de alto impacto para redes sociales**: DOMINA, SECRETO, ALGORITMO, VIRAL, MILLÓN, ESTRATEGIA

---

## GUARDRAILS

- NUNCA generar miniaturas con más de 7 palabras de texto visible
- NUNCA sobrecargar con múltiples elementos visuales (máx 3 elementos: persona + texto + 1 ícono)
- NUNCA repetir el mismo mensaje que el título del video en la miniatura
- SIEMPRE hacer 3 variaciones para tener opciones de iteración
- Si el usuario no tiene fotos, generar con descripción detallada pero AVISAR que usar foto real propia convierte más
- Si la generación falla por filtros de seguridad, simplificar la descripción y reintentar

---

## REFERENCIAS

Cargar bajo demanda — NO cargar todas al inicio:
- `references/metodologia-miniaturas.md` — Checklist completo + teoría CTR de FORMULA 100K
- `references/estilos-plantillas.md` — 9 estilos de miniatura con prompts base
- `references/banana-thumbnail-config.md` — Configuración específica de NanoBanana para thumbnails
