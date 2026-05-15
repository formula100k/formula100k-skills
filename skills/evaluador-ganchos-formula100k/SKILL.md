---
name: evaluador-ganchos-formula100k
description: Skill para evaluar ganchos visuales a partir de capturas del primer segundo de videos. Activar SIEMPRE que alguien pida "evalúa este gancho", "analiza mi primer segundo", "revisa mi gancho", "diagnostica este primer segundo", "qué le falta a este gancho", "puntaje de mi gancho", "es viral este gancho", "audita mi thumbnail", "mejora este primer segundo". También activar cuando alguien suba una captura de pantalla de un video y quiera saber si funciona. Aplica toda la metodología de FÓRMULA 100K: Sistema E.N.C. (Estímulo Núcleo, Nivel de Carga Cognitiva, Contextualización), las 5 Formas Visuales (F1-F5), los 15 Gatillos de Viralidad, el Gancho Textual del Top 1%, y el Test del 1 Segundo.
argument-hint: [contexto del video opcional]
---

# Evaluador de Ganchos · FÓRMULA 100K

Diagnostica una captura del primer segundo de un video aplicando los frameworks de FÓRMULA 100K. Devuelve un análisis estructurado con score numérico, errores detectados y recomendaciones accionables.

## Cuándo se activa esta skill

- Andrea sube una captura de su primer segundo y pide evaluación
- Una alumna quiere saber si su gancho funciona antes de publicar
- Necesitan auditar el primer segundo de un competidor
- Quieren comparar dos versiones de gancho

## Contexto crítico

**Usuaria:** Andrea Vega (FÓRMULA 100K) o sus alumnas. Audiencia hispana, español neutro obligatorio (NO voseo).

**Material de referencia (cargar en orden):**
- `criterios.md` — la rúbrica completa de evaluación con todos los frameworks
- `output-template.md` — el formato exacto del diagnóstico

**Artifact educativo:** `/Users/kissita/Documents/FORMULA100K/ARTIFACTS/f100k-ganchos.html` — contiene la metodología visual completa que esta skill operacionaliza.

## Flujo paso a paso

### Paso 1: Recibir input

El input puede llegar de 3 formas:
1. **Imagen + texto explicativo** ("evalúa este gancho, es para un video sobre X")
2. **Solo imagen** ("¿qué tal está?")
3. **Texto que pide subir imagen** ("quiero evaluar mi gancho")

Si NO hay imagen adjunta, pide la captura del primer segundo antes de continuar:
> "Comparte la captura de pantalla del primer segundo de tu video. Si tienes el video, pausa exactamente al segundo 1 y captura esa pantalla."

Si hay imagen pero falta contexto, haz UNA pregunta clave (no más):
> "¿De qué trata el video y para quién es? Eso me ayuda a evaluar si tu gancho comunica la promesa correcta."

Si Andrea aporta el contexto en el mensaje inicial, no preguntes nada — procede a evaluar.

### Paso 2: Cargar la rúbrica

Lee `criterios.md` completo. Contiene:
- Sistema E.N.C. con sub-criterios para evaluar cada componente
- Las 5 Formas Visuales con cómo identificar cuál se está usando
- Los 15 Gatillos de Viralidad con señales para detectarlos
- Reglas del Gancho Textual (palabras, contraste, zona segura, pacing)
- Test del 1 Segundo con criterio de aprobación
- Tabla de cálculo del score

### Paso 3: Analizar la imagen con visión

Aplica los criterios en este orden estricto:

**A) Test del 1 Segundo (eliminatorio)**
Mira la captura como si fuera la primera vez. Sin contexto. ¿Entiendes en menos de 1 segundo de qué va el video? Si NO, el gancho está roto desde la base — anótalo y sigue evaluando los detalles para identificar dónde está el fallo.

**B) Identificar la Forma Visual (F1-F5 o híbrida)**
Usa la guía de identificación en `criterios.md`. Cada forma tiene marcadores visuales claros:
- F1: rostro/cuerpo + texto contextual
- F2: acción simbólica (verbo visible) + subtítulo
- F3: título grande + sujeto secundario
- F4: imagen sorprendente/viral + texto guía
- F5: movimiento disruptivo + corte (más difícil de evaluar en captura, requiere video)

**C) Evaluar E.N.C. componente por componente**

Para **E (Estímulo Núcleo)**:
- ¿Hay UN protagonista visual claro?
- ¿Está nítido, contrastado, posicionado correctamente?
- ¿Hay un verbo/gesto visible?

Para **N (Carga Cognitiva)**:
- Cuenta elementos en pantalla. ≤3 = bajo. 4-6 = medio. 7+ = alto (mal).
- ¿El fondo está limpio o caótico?
- ¿Hay 1 sola idea visible?

Para **C (Contextualización)**:
- ¿Cuántos apoyos secundarios hay? Máx 2 ideal.
- ¿Compiten con el E o lo refuerzan?
- ¿Apuntan o señalan algo?

**D) Detectar Gatillos de Viralidad**
De los 15 gatillos, identifica cuáles activa el gancho actual. Sé honesto: si solo activa 0-1, el video no viralizará.

**E) Evaluar Gancho Textual** (si hay texto en pantalla)
- Cuenta palabras (ideal ≤8)
- Evalúa contraste, tamaño (7-12% del frame), zona segura
- ¿El quiebre de línea es lógico?
- ¿La tipografía es nativa, premium o genérica?
- ¿Tiene paréntesis tipo "Susurro"?

### Paso 4: Calcular el score

Usa la tabla de scoring en `criterios.md`. El score es sobre 100:
- Test del 1 Segundo: 25 pts (binario: pasa/no pasa)
- E.N.C.: 30 pts (10 cada componente)
- Gatillos: 20 pts (proporcional al número activado, máx 3 gatillos cuentan)
- Gancho Textual: 15 pts (si aplica; si no hay texto, redistribuir)
- Forma Visual ejecutada correctamente: 10 pts

**Bandas de calidad:**
- 85-100: Listo para publicar (top 10%)
- 70-84: Viable, con ajustes menores
- 50-69: Necesita iteración significativa
- <50: Reconstruir desde cero

### Paso 5: Generar el diagnóstico

Usa EXACTAMENTE el formato de `output-template.md`. No te saltes secciones. El diagnóstico debe ser:
- **Honesto** — si está mal, dilo. No inflar puntajes.
- **Específico** — referencia elementos visuales concretos ("la planta del fondo", "el texto azul")
- **Accionable** — cada recomendación debe ser implementable hoy
- **En español neutro** — usa "tú", "tienes", "puedes" — NUNCA voseo

### Paso 6: Cerrar con propuesta de mejora

Al final, ofrece una **versión mejorada concreta**:
- Si el problema es el texto: reescribe el gancho textual aplicando las 4 estructuras de copywriting (Curiosidad/Dolor/Resultado/Susurro)
- Si el problema es visual: describe la composición ideal paso a paso (qué eliminar, qué añadir, dónde colocar cada elemento)
- Si el problema es la forma: sugiere cuál de las F1-F5 funcionaría mejor para ese contenido

## Reglas anti-error

- **NO inventes elementos** que no estén en la imagen. Si no ves el texto claramente, dilo.
- **NO uses voseo argentino** — Andrea ya corrigió esto en otras skills. Usa "tú", "tienes", "puedes", "haz" — NUNCA "vos", "tenés", "podés", "hacé".
- **NO seas complaciente** — si el gancho está mal, ponle puntaje bajo. Andrea valora la honestidad.
- **NO recomiendes cosas genéricas** ("mejora la calidad", "ponle más onda"). Sé técnico: "elimina la planta del fondo derecho", "reduce el texto de 12 a 6 palabras", "cambia la fuente Arial por una bold tipo Inter".
- **NO uses el bot de ganchos visuales** — esta skill ES el reemplazo manual del bot.
- **NO evalúes audio** — solo lo visual. Si la usuaria menciona audio, recuerda que evaluamos solo el primer cuadro.

## Casos especiales

- **Imagen borrosa o de baja calidad:** Pide otra captura antes de evaluar. No adivines.
- **Imagen no es del primer segundo:** Pregunta al usuario si capturó al segundo 1 o más adelante. La evaluación cambia.
- **Imagen es un thumbnail de YouTube:** Aplica los mismos criterios pero menciona que YouTube tiene reglas distintas (más texto permitido, contraste extremo importa más).
- **Múltiples imágenes (variantes A/B):** Evalúa cada una y entrega comparativa con cuál ganaría.

## Output del proceso

Mientras evalúas, comunica brevemente:
1. "Cargando rúbrica de evaluación"
2. "Analizando E.N.C. en la imagen"
3. (Generar diagnóstico)

Luego entrega el diagnóstico completo siguiendo el template.
