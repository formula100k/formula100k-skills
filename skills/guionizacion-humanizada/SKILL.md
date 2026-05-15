---
name: guionizacion-humanizada
description: >
  Skill para humanizar guiones, textos y scripts para que no suenen escritos por IA. Usar SIEMPRE que alguien pida: humanizar un texto, hacer que suene más natural, quitarle el tono de IA, reescribir con mi voz, adaptar a mi estilo, hacer sonar más humano, revisar que no parezca IA, aplicar mi tono, o escribir como yo escribo. También activar cuando digan "esto suena muy de IA", "necesito que suene mío", "ponle mi estilo", "humaniza este guion" o cualquier variación que implique personalizar el tono y voz de un texto para que refleje la forma auténtica de comunicarse del usuario.
---

# Skill: Guionización Humanizada

Esta skill adapta cualquier texto al tono, voz y estilo genuino de Andrea Estratega, basándose en el análisis real de sus contenidos más exitosos. El objetivo es que los guiones y escritos suenen como ella — no como una IA tratando de sonar como ella.

---

## PASO 0 — Verificar si el Voice Guide existe

Antes de hacer cualquier cosa, revisa si el archivo `references/Voice_Guide.md` existe Y tiene contenido de análisis (no solo el placeholder vacío).

```
Ruta: <directorio de esta skill>/references/Voice_Guide.md
```

**Si el archivo NO existe o está vacío/es el placeholder → ir al PASO 1 (Análisis de Instagram).**
**Si ya tiene el análisis completo → saltar directamente al PASO 2 (Humanización).**

---

## PASO 1 — Análisis de Instagram (solo la primera vez)

Este paso se corre UNA SOLA VEZ para generar el Voice Guide. Avísale al usuario que vas a analizar su perfil de Instagram antes de humanizar el texto.

### 1.1 — Navegar al perfil y recolectar posts

1. Abre el navegador y navega a: `https://www.instagram.com/andreaestratega/`
2. Espera a que cargue el perfil completamente
3. Toma un screenshot para confirmar que cargó bien
4. Desplázate hacia abajo para cargar al menos 15-20 posts
5. Para cada post visible, anota mentalmente: cantidad de likes/comentarios visibles, si es reel o imagen, el texto del caption si es visible

### 1.2 — Entrar a los posts más exitosos

Abre los **6-8 posts que tengan más engagement** (los que más likes y comentarios muestran). Para cada uno:

1. Haz click en el post para abrirlo
2. Lee el **caption completo** (expandiéndolo si está cortado)
3. Lee los primeros 5-8 comentarios de la autora si respondió
4. Anota:
   - Palabras y frases exactas que usa
   - Cómo empieza el caption (¿con pregunta?, ¿con afirmación fuerte?, ¿con historia?)
   - Cómo termina (¿CTA?, ¿reflexión?, ¿pregunta al lector?)
   - Uso de emojis: cuáles, dónde, con qué frecuencia
   - Longitud de oraciones: ¿cortas y directas o largas y explicativas?
   - Signos de puntuación especiales: puntos suspensivos, mayúsculas, guiones
   - Expresiones o palabras propias que repite
5. Vuelve al perfil con el botón atrás

### 1.3 — Generar el Voice Guide

Con todo lo que analizaste, crea el archivo `references/Voice_Guide.md` con esta estructura:

```markdown
# Voice Guide — Andrea Estratega
*Generado el: [fecha]*
*Basado en análisis de: [cantidad] posts de @andreaestratega*

## Tono general
[Describe el tono en 2-3 oraciones: ¿cálido? ¿directo? ¿mezcla de qué?]

## Cómo inicia sus textos
[Patrones de apertura que usa: ejemplos reales copiados de sus posts]

## Cómo cierra sus textos
[Patrones de cierre: cómo remata, qué tipo de CTA usa]

## Vocabulario y frases características
[Lista de palabras, frases y expresiones que usa con frecuencia — copiarlas exactas]

## Expresiones y quirks de escritura
[Cosas particulares: expresiones propias, giros de lenguaje, muletillas características]

## Uso de emojis
[Cuáles usa, dónde los pone, con qué frecuencia. Ejemplos reales.]

## Estructura de oraciones
[Longitud típica. ¿Usa listas? ¿Párrafos cortos? ¿Fragmentos sin verbo?]

## Puntuación y formato
[Uso de puntos suspensivos, signos de exclamación, MAYÚSCULAS, — guiones —, etc.]

## Lo que NUNCA dice (señales de IA a evitar)
[Palabras y frases que no aparecen en sus posts y sonarían artificiales]

## Ejemplos de captions reales (copiar textual)
[2-3 captions completos copiados literalmente para referencia]
```

Guarda este archivo en `references/Voice_Guide.md` dentro de la carpeta de esta skill.

---

## PASO 2 — Humanización del texto

Lee el `references/Voice_Guide.md` completo antes de empezar.

### 2.1 — Diagnóstico rápido del texto recibido

Antes de reescribir, identifica qué señales de IA tiene el texto original:

- **Estructura demasiado perfecta**: intro → desarrollo → conclusión en tres párrafos simétricos
- **Frases de relleno de IA**: "es importante destacar que", "en definitiva", "en conclusión", "sin lugar a dudas", "es fundamental", "por supuesto", "sin duda alguna", "indudablemente"
- **Vocabulario formal que nadie habla**: "cabe mencionar", "en este sentido", "a modo de conclusión"
- **Ausencia de imperfección**: no hay dudas, titubeos, cambios de ritmo, oraciones cortadas
- **Tono neutro y sin personalidad**: no hay preferencias, no hay voz propia
- **Ausencia de lo específico**: generaliza en lugar de dar detalles concretos

### 2.2 — Aplicar el Voice Guide

Reescribe el texto aplicando lo que encontraste en el Voice Guide:

1. **Ritmo y longitud**: Ajusta las oraciones al patrón real de Andrea (si ella escribe corto y directo, haz lo mismo)
2. **Vocabulario propio**: Reemplaza palabras genéricas con las que ella usa realmente
3. **Aperturas y cierres**: Usa los patrones reales de cómo ella empieza y termina
4. **Emojis**: Solo los que usa ella, donde los pone ella, con la frecuencia que los usa
5. **Expresiones propias**: Incorpora sus expresiones características donde encajen de forma natural
6. **Estructura**: Si ella usa párrafos cortos y saltos de línea, haz eso

### 2.3 — Aplicar principios universales de humanización

Independientemente del Voice Guide, todo texto humanizado debe:

- **Romper la simetría perfecta**: No tres párrafos del mismo largo. Mezcla uno corto, uno más largo, uno muy corto.
- **Incluir al menos una imperfección calculada**: Una oración sin terminar. Un paréntesis (porque sí). Una cosa que se contradice levemente y luego se aclara.
- **Hablar a UNA persona, no a una audiencia**: "tú" en lugar de "todos ustedes" o "las personas que..."
- **Nombrar lo concreto**: En lugar de "cuando tienes resultados", decir "cuando tus reels llegan a 50k"
- **Dejar entrar la emoción real**: Una frase que suene como que la pensó de verdad, no como que la calculó
- **Variar el ritmo deliberadamente**: Oraciones largas que fluyen... seguidas de una sola palabra. Eso.

### 2.4 — Revisión final de humanización

Antes de entregar, pasa el texto por este checklist mental:

- [ ] ¿Podría Andrea haber escrito esto sin que nadie lo note?
- [ ] ¿Hay alguna oración que suene a manual corporativo? → Reescribir
- [ ] ¿El ritmo sube y baja o va parejo? → Si va parejo, romperlo
- [ ] ¿Hay alguna frase de relleno que se podría cortar sin perder nada? → Cortar
- [ ] ¿El inicio engancha o empieza con una introducción burocrática? → Cambiar
- [ ] ¿El cierre se siente genuino o como fórmula? → Ajustar

---

## FORMATOS DE ENTREGA

### Para humanización de texto existente:
Entrega el texto reescrito directamente, sin explicar cada cambio. Si quieres, agrega una línea al final tipo: *"Humanicé X, Y y Z para que suene más tuyo."* — pero mantén el texto como protagonista.

### Para crear contenido nuevo en voz de Andrea:
Escribe el contenido directamente en su voz sin advertencias de que "intentaste capturar su estilo". Si lo hiciste bien, se nota solo.

### Si el Voice Guide no existe y no se pudo analizar Instagram:
Avísale al usuario que necesitas acceso a Instagram para hacer el análisis inicial, o pídele que comparta ejemplos de textos propios para construir el Voice Guide manualmente.

---

## RECORDATORIO

El Voice Guide es un documento vivo. Si el usuario muestra un texto propio y dice "quiero que escribas así", actualiza el Voice Guide con lo nuevo que aprendiste.
