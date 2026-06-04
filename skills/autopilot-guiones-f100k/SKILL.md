---
name: autopilot-guiones-f100k
description: >
  Módulo del Autopilot F100K que corre diariamente (Lun–Vie 8:30 AM Lima): busca las 3 noticias más relevantes de IA del día via Tavily, las convierte en 3 guiones listos para grabar usando el sistema de guionización F100K (pilar de valor + estructura de las 33 + gancho triple + CTA optimizado con priming triple), los guarda en Yapper y crea un draft de Gmail. Usar cuando alguien diga: "corre el autopilot de guiones", "dame los 3 guiones del día", "guiones de noticias de IA de hoy", "ejecutar autopilot guiones", o cuando el schedule automático lo invoque. El módulo vive en la rutina remota trig_01NFerZcieaNzfwR5v7K9gxo.
---

# Skill: Autopilot Guiones — F100K

Cada mañana, este módulo busca las noticias más relevantes de IA del día, elige las 3 más aprovechables para el nicho F100K, y las convierte en guiones listos para grabar usando el sistema completo de guionización F100K. Solo hay que abrir el email y grabar.

---

## PASO 1 — BUSCA LAS NOTICIAS DE IA DEL DÍA

Usa Tavily para buscar las 5 noticias más importantes de hoy:

1. `AI tools content creators news today`
2. `Anthropic Claude new features today`
3. `AI video generation tools 2026 news`

---

## PASO 2 — SELECCIONA LAS 3 MÁS RELEVANTES

Criterios en orden de importancia:
1. ¿Afecta directamente a creadores que usan Claude, Higgsfield, Canva, CapCut, etc.?
2. ¿Tiene un dato numérico sorprendente o un cambio de paradigma claro?
3. ¿Andrea puede conectarlo con su experiencia personal o con lo que enseña en F100K?
4. ¿Es noticia del día (no de hace una semana)?

---

## PASO 3 — ESCRIBE 3 GUIONES CON EL SISTEMA F100K

Para CADA guion, seguir este proceso completo:

### A) IDENTIFICAR EL PILAR DE VALOR (elegir UNO de los 7)

| # | Pilar | Qué genera |
|---|-------|------------|
| 1 | Revelación (Insight) | El usuario siente que accede a un secreto |
| 2 | Utilidad Práctica | Genera GUARDADOS — le ahorra tiempo |
| 3 | Validación Emocional | Genera COMPARTIDOS — "eso me pasa a mí" |
| 4 | Desafío (Gamificación) | Toca el ego, se siente desafiado |
| 5 | Actualidad (Curiosidad) | Te posiciona como fuente al día |
| 6 | Curaduría | El valor es el tiempo que le ahorras |
| 7 | Disrupción (Anti-consejo) | Genera DEBATE, demuestra autoridad superior |

Para noticias de IA, los pilares más útiles son: **5 (Actualidad), 1 (Revelación), 7 (Disrupción)**. Variar entre los 3 guiones.

### B) ELEGIR LA ESTRUCTURA (según el pilar)

Estructuras recomendadas para noticias de IA. Los 3 guiones del día **deben usar estructuras diferentes**:

**Estructura 15 — VACÍO DE INFORMACIÓN** (Pilar 5 Actualidad)
- Gancho: frase que deja algo sin resolver → obliga a seguir viendo
- Contexto: por qué es urgente saber esto ahora
- Revelación: qué está pasando exactamente
- Consecuencia: qué significa para el creador
- Cierre con promesa: "y esto es lo más importante que nadie te está diciendo..."

**Estructura 18 — EL MOMENTO WTF** (Pilar 1 Revelación)
- Gancho WTF: hecho impactante sin contexto todavía
- Tensión: datos que aumentan la sorpresa
- Plot twist: la revelación que cambia todo
- Reflexión: qué hacer con esto

**Estructura 19 — EL DESAFÍO CONTRACORRIENTE** (Pilar 7 Disrupción)
- Afirmación contraintuitiva: lo opuesto a lo que todos dicen
- Evidencia: por qué la creencia popular está equivocada (datos de la noticia)
- Reencuadre: la visión correcta
- Reto implícito a la audiencia

**Estructura 33 — ANÁLISIS DE CASO ESTRATÉGICO** (Pilar 6 Curaduría)
- Plantear el caso (la noticia)
- Diseccionar: qué está pasando en realidad
- Lección estratégica para creadores
- Acción concreta que pueden tomar HOY

### C) SISTEMA DE GANCHOS TRIPLE

Cada guion necesita los 3 estímulos alineados al mismo mensaje:

**Gancho Verbal** → qué se DICE en los primeros 3 segundos (máx 15 palabras, activa: curiosidad / miedo a error / sorpresa / identificación)

**Gancho Visual** → qué se MUESTRA (resultado final, dato en pantalla, expresión de sorpresa, objeto intrigante)

**Gancho Textual** → qué se LEE en pantalla (texto de alerta, número impactante, pregunta provocadora)

Los tres deben comunicar el MISMO mensaje. Si no están alineados, reescribirlos.

### D) CTA OPTIMIZADO — PATRÓN F100K VALIDADO

Estructura obligatoria del CTA (últimos 10-15 segundos):

1. **Priming triple**: mencionar la palabra clave 3 veces ANTES de pedirla.
   > "Si tú usas [herramienta], si trabajas con [herramienta], si [herramienta] es parte de tu proceso..."

2. **Recurso invisible**: prometer algo que solo consiguen si comentan.
   > "Tengo [recurso/info] que no está publicado en ningún lado."

3. **Vacío de información**: dejar claro que les falta algo importante.
   > "Y lo más importante todavía no lo dije."

4. **Cierre**: `Comenta "[PALABRA DE 1-2 SÍLABAS]" y te cuento cómo puedes acceder a [beneficio específico].`

La PALABRA del CTA: 1-2 sílabas, relacionada al tema (ej: "IA", "ya", "más", "hoy", "gratis", "cómo").

---

## FORMATO DE SALIDA PARA CADA GUION

```
=== GUION [N] ===
TÍTULO: [descriptivo, máx 8 palabras]
NOTICIA FUENTE: [título + URL]
PILAR DE VALOR: [número y nombre]
ESTRUCTURA: [número y nombre]

GANCHO VERBAL: [texto exacto — máx 15 palabras]
GANCHO VISUAL: [descripción de qué mostrar]
GANCHO TEXTUAL: [texto para la pantalla]

--- GUION COMPLETO ---
[texto completo siguiendo la estructura elegida]
[frases cortas, máx 15 palabras por frase]
[español neutro: tú/tienes NUNCA vos/tenés]
[primera persona cuando aplique]

--- CTA ---
[Priming triple — 3 oraciones con la palabra]
[Recurso invisible]
[Vacío de información]
Comenta "[PALABRA]" y te cuento cómo puedes acceder a [beneficio]
```

**Reglas de escritura:**
- Español neutro (tú/tienes, NUNCA vos/tenés)
- Sin jerga técnica — si la hay, explicarla en la misma oración
- Primera persona cuando aplique ("yo la uso para...", "esta mañana...")
- Frases cortas, máximo 15 palabras por frase
- Tono: directa, con autoridad, conversacional
- Duración total: 45-60 segundos por guion

---

## PASO 4 — GUARDAR LOS 3 GUIONES EN YAPPER

Para cada guion, hacer un POST a la API de Yapper:

```
POST https://yapper-method.vercel.app/api/scripts
Headers:
  Content-Type: application/json
  Authorization: Bearer 28dfbc5c3c26d85aadd1a473e9448da056cb2ca114978ddde58f5bd406380273
Body:
  user_email: andreavegabocanegra@gmail.com
  title: [TÍTULO del guion]
  body: [TEXTO COMPLETO incluyendo ganchos y CTA]
  source: claude
  origin_url: null
```

Usar Bash con curl para los 3 POSTs. Mostrar los IDs retornados.

---

## PASO 5 — CREAR DRAFT DE GMAIL

Obtener la fecha actual: `date '+%d %b %Y'`

Crear draft con:
- **To:** andreavegabocanegra@gmail.com
- **Subject:** 🎬 Autopilot Guiones — [fecha de hoy]
- **Body:**

```
Hola Andrea,

Aquí están los 3 guiones del día, listos para grabar. Cada uno usa una estructura distinta del sistema F100K.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
GUION 1: [título] | Pilar: [pilar] | Estructura: [estructura]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
GANCHO VERBAL: [texto]
GANCHO VISUAL: [descripción]
GANCHO TEXTUAL: [texto pantalla]

[guion completo]

[CTA completo con priming triple]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
GUION 2: [título] | Pilar: [pilar] | Estructura: [estructura]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
GANCHO VERBAL: [texto]
GANCHO VISUAL: [descripción]
GANCHO TEXTUAL: [texto pantalla]

[guion completo]

[CTA completo con priming triple]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
GUION 3: [título] | Pilar: [pilar] | Estructura: [estructura]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
GANCHO VERBAL: [texto]
GANCHO VISUAL: [descripción]
GANCHO TEXTUAL: [texto pantalla]

[guion completo]

[CTA completo con priming triple]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
También los guardé en tu Yapper: https://yapper-method.vercel.app/app

Generado por Autopilot F100K ⚡
```

---

## CONFIRMACIÓN FINAL

```
✅ Noticias encontradas: [lista las 3 fuentes con URL]
✅ Guiones escritos: [título | pilar | estructura para cada uno]
✅ CTAs generados: [palabra de cada uno]
✅ Guardados en Yapper: [IDs]
✅ Draft de Gmail creado para andreavegabocanegra@gmail.com
```

---

## NOTAS TÉCNICAS

- **Rutina remota:** `trig_01NFerZcieaNzfwR5v7K9gxo` — corre Lun–Vie a las 8:30 AM Lima (13:30 UTC)
- **MCPs requeridos:** Tavily (búsqueda de noticias) + Gmail (draft)
- **Costo estimado:** ~$0.05 por ejecución (solo Tavily, sin Apify)
- **Config de voz:** ver `~/.f100k-radar/config.json` — campo `voice_profile`
