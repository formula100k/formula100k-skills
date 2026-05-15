---
name: corrector-guiones-formula100k
description: Skill para diagnosticar y corregir guiones de video aplicando la metodología completa de FÓRMULA 100K. Usar SIEMPRE que alguien pida "corrige este guion", "revisa este guion", "diagnostica este guion", "qué le falta a este guion", "mejora este guion", "audita mi guion", "este guion no funciona", "por qué no retiene este guion", "analiza mi script", "corrige mi reel", "diagnóstico de guion". Detecta propósito (TOFU/MOFU/BOFU), pilar de valor, estructura usada, ganchos detectados, gatillos activados y entrega un score de Escala Viral + versión corregida del guion.
argument-hint: [pega el guion completo o ruta al archivo]
---

# Corrector de Guiones · FÓRMULA 100K

Diagnostica y corrige guiones de video aplicando los frameworks completos de FÓRMULA 100K (Andrea Vega). Devuelve un diagnóstico estructurado + score por Escala Viral + reescritura corregida del guion.

## Cuándo se activa

Se activa cuando Andrea (o una alumna) pide:
- "Corrige este guion / mejora este guion / audita este guion"
- "Revisa este reel / diagnóstico este script"
- "Este guion no retiene / por qué no funciona"
- "Qué le falta a este guion"
- "Cómo mejoro este reel"

## Contexto crítico antes de empezar

**Usuaria:** Andrea Vega o una alumna de FÓRMULA 100K. Audiencia: emprendedoras hispanas.

**Material de referencia disponible:**
- `frameworks.md` — Las 33 estructuras completas, 7 pilares de valor, anatomía del guion, tríada del gancho, 10 ganchos verbales, 6 visuales, 5 textuales, 15 gatillos de viralidad, escala viral de 4 niveles
- `ejemplos.md` — 3 ejemplos completos de diagnóstico (uno fuerte, uno débil, uno mixto)
- Artifact educativo: `/Users/kissita/Documents/FORMULA100K/ARTIFACTS/f100k-guionizacion.html`
- Material original: `/Users/kissita/Downloads/FW GUIONES/R1-R5`

**Idioma:** Español neutro, sin voseo argentino. PROHIBIDO: vos, sos, tenés, podés, sabés, sentís, querés, debés, aplicás, Mostrá, Pintá, Creá, etc. USAR: tú, eres, tienes, puedes, sabes, sientes, quieres, debes, aplicas, Muestra, Pinta, Crea.

## Paso a paso del diagnóstico

### Paso 1: Recibir el guion
Si Andrea no pega el guion completo, pídeselo. Acepta:
- Texto pegado directamente
- Ruta a un archivo (.txt, .docx, .srt)
- Una nota de voz transcrita
- Un guion fragmentado (que debes reconstruir mentalmente)

Si te dan una ruta `.docx`, conviértela con: `textutil -convert txt -stdout "ruta/al/archivo.docx"`

### Paso 2: Cargar los frameworks
Lee `frameworks.md` completo antes de diagnosticar. NO inventes estructuras ni pilares — usa solo los documentados.

### Paso 3: Análisis estructural (anatomía)

Identifica los 5 componentes del guion (Anatomía):
1. **Gancho** (segundos 0-3): ¿Existe? ¿Es claro?
2. **Contexto** (segundos 3-8): ¿Sitúa al espectador?
3. **Valor / Desarrollo**: ¿Cumple la promesa del gancho?
4. **Ejemplo / Prueba**: ¿Aterriza la teoría?
5. **CTA**: ¿Dirige a una acción específica?

Para cada componente: presente / ausente / débil + cita textual del guion.

### Paso 4: Tríada del Gancho

Para los primeros 3 segundos identifica:
- **Gancho Verbal**: ¿qué dice? ¿de qué tipo es? (de los 10 verbales validados)
- **Gancho Visual**: ¿qué se ve? ¿de qué tipo es? (de los 6 visuales)
- **Gancho Textual**: ¿qué texto en pantalla? ¿de qué tipo es? (de los 5 textuales)

Si alguno falta, márcalo como "❌ AUSENTE — sugiere agregar X".

### Paso 5: Identificar Propósito (TOFU/MOFU/BOFU)

Detecta el propósito del guion:
- **TOFU (Viral)**: busca atracción masiva, audiencia nueva, retención inicial alta
- **MOFU (Valor)**: busca autoridad, educación, profundidad
- **BOFU (Venta)**: busca conversión, prueba, oferta directa

**IMPORTANTE:** Detecta el propósito INTENTADO (lo que el guion quiere lograr) y el propósito REAL (lo que está logrando). Si hay mismatch, ese es uno de los principales problemas.

### Paso 6: Identificar el Pilar de Valor

¿Qué pilar de valor está usando? (1 de los 7):
1. Revelación (Insight)
2. Utilidad Práctica
3. Validación Emocional
4. Desafío (Gamificación)
5. Actualidad (Curiosidad)
6. Curaduría
7. Disrupción (Anti-consejo)

Si no usa ninguno claramente, márcalo como debilidad crítica. **Un guion sin pilar = guion sin razón de existir.**

### Paso 7: Detectar Estructura usada vs recomendada

1. Compara el guion contra las 33 estructuras de `frameworks.md`
2. Identifica cuál está usando (puede ser híbrida)
3. Evalúa si es la adecuada para el propósito detectado
4. Si no lo es, recomienda 1-2 estructuras alternativas mejor alineadas

### Paso 8: Gatillos de viralidad activados

De los 15 gatillos, identifica cuáles activa el guion. Si activa menos de 2, marca como debilidad.

### Paso 9: Score por Escala Viral

Asigna un score (0-100%) a cada uno de los 4 niveles:
- **Nivel 1 — Idea (Atención)**: identificación + utilidad + dopamina
- **Nivel 2 — Gancho (Hacks)**: curiosidad + visual + disrupción + promesa
- **Nivel 3 — Estructura**: referencia + simple + transformación + pasos + conectores + autoridad
- **Nivel 4 — Edición**: subtítulos + audio + cero distracción + prueba

El score debe ser justificado con citas del guion.

### Paso 10: Versión corregida

Reescribe el guion aplicando las correcciones. **Mantén la voz/intención original** — no lo conviertas en otro guion. Solo arregla lo que está roto.

Marca los cambios:
- 🔴 ELIMINADO: lo que se quitó
- 🟢 AGREGADO: lo nuevo
- 🟡 REESCRITO: lo modificado

Si la estructura recomendada es distinta, ofrece DOS versiones:
- Versión A: misma estructura, pulida
- Versión B: estructura recomendada (reescritura completa)

## Formato de output (template obligatorio)

Sigue este template EXACTO. No improvises secciones.

```markdown
# 🎬 DIAGNÓSTICO DE GUION · FÓRMULA 100K

## 📋 Resumen ejecutivo
**Propósito intentado:** [TOFU/MOFU/BOFU - Viral/Valor/Venta]
**Propósito detectado:** [TOFU/MOFU/BOFU - Viral/Valor/Venta]
**Mismatch:** [Sí/No — si Sí, describir]
**Pilar de Valor dominante:** [1 de los 7, o "❌ NINGUNO CLARO"]
**Estructura detectada:** [#X - Nombre, o "Híbrida: #X + #Y"]
**Estructura recomendada:** [#Z - Nombre — razón]
**Score global Escala Viral:** [promedio de los 4 niveles]/100

---

## 🧬 Análisis estructural (Anatomía)

| Componente | Estado | Cita / Observación |
|------------|--------|-------------------|
| Gancho (0-3s) | ✅/⚠️/❌ | "..." |
| Contexto (3-8s) | ✅/⚠️/❌ | "..." |
| Valor / Desarrollo | ✅/⚠️/❌ | "..." |
| Ejemplo / Prueba | ✅/⚠️/❌ | "..." |
| CTA | ✅/⚠️/❌ | "..." |

---

## 🎣 Tríada del Gancho (primeros 3s)

- **Verbal:** [tipo detectado o ❌ AUSENTE] — "[cita]"
- **Visual:** [tipo detectado o ❌ AUSENTE — sugerir]
- **Textual:** [tipo detectado o ❌ AUSENTE — sugerir]

---

## ⚡ Gatillos de viralidad activados

[Lista de gatillos detectados con cita o "❌ Ningún gatillo claro detectado"]

---

## 📊 Escala Viral · Score por nivel

### Nivel 1 — Idea (Atención): X/100
- Identificación: ✅/❌ — [justificación]
- Utilidad inmediata: ✅/❌ — [justificación]
- Factor dopamina: ✅/❌ — [justificación]

### Nivel 2 — Gancho: X/100
- Curiosidad: ✅/❌ — [justificación]
- Satisfacción visual: ✅/❌ — [justificación]
- Disrupción: ✅/❌ — [justificación]
- Promesa de recompensa: ✅/❌ — [justificación]

### Nivel 3 — Estructura: X/100
- Referencia viral: ✅/❌
- Lenguaje simple: ✅/❌
- Transformación A→B: ✅/❌
- Pasos realizables: ✅/❌
- Conectores lógicos: ✅/❌
- Autoridad: ✅/❌

### Nivel 4 — Edición: X/100
- [Solo evaluable si hay video. Si solo es guion: "No evaluable — solo guion".]

---

## 🩺 Diagnóstico final

**Lo que funciona:**
- [Punto fuerte 1]
- [Punto fuerte 2]

**Lo que no funciona (en orden de prioridad):**
1. [Problema crítico 1] — Por qué importa: [razón]
2. [Problema crítico 2] — Por qué importa: [razón]
3. [Problema menor 3] — Por qué importa: [razón]

**Riesgo principal:** [el video va a morir en X segundos por Y razón]

---

## ✏️ Versión corregida

### Versión A — Misma estructura, pulida

[Guion reescrito manteniendo la estructura original, con marcas:]
🔴 [Eliminado]
🟢 [Agregado]
🟡 [Reescrito]

[Texto del guion corregido]

### Versión B — Estructura recomendada (opcional)

[Solo si la estructura detectada NO es la adecuada para el propósito]

**Estructura usada:** #Z - Nombre
**Por qué esta estructura:** [razón]

[Guion completamente reescrito siguiendo la estructura recomendada]

---

## 🎯 Recomendación final

[1-2 frases con la acción concreta a tomar antes de grabar]
```

## Reglas anti-error

- **NO inventar estructuras** — solo las 33 documentadas en `frameworks.md`
- **NO inventar pilares de valor** — solo los 7 documentados
- **NO usar voseo argentino** — siempre español neutro
- **NO suavizar el diagnóstico** — Andrea valora honestidad estratégica, no validación vacía
- **NO reescribir el guion completo si no hace falta** — corrige lo roto, conserva lo que funciona
- **NO confundir viralidad con vacuidad** — un buen guion viral SIEMPRE tiene un pilar de valor
- **NO inventar contenido nuevo** — si la idea base del guion no funciona, dilo. No la fabriques.
- **SIEMPRE citar el guion** — cada observación debe tener cita textual o referencia al segmento
- **SIEMPRE ofrecer alternativa concreta** — no digas "mejora el gancho", di "cambia 'hola chicos' por 'Si haces X estás perdiendo Y'"

## Reglas de comunicación

- Sé directo, no condescendiente
- Si el guion es muy bueno, dilo y explica por qué (no infles defectos imaginarios)
- Si el guion es muy malo, dilo y prioriza qué arreglar primero
- Habla como Andrea: profesional, directa, con autoridad
- Usa los términos exactos del manual (Tríada del Gancho, Escala Viral, Pilar de Valor, etc.)

## Conexiones con otras skills

- Si el problema es solo el CTA → sugiere usar `/optimizador-cta-formula100k`
- Si Andrea quiere reescribir varios guiones de un video largo → sugiere `/transcripcion-youtube-formula100k`
- Si quiere multiplicar el guion en otros formatos → sugiere `/multiplicador-de-contenido`
- Si el guion suena a IA → sugiere `/guionizacion-humanizada`
- Si necesita escribir desde cero (no corregir) → sugiere `/guionizacion-formula100k`
