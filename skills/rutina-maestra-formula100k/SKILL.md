---
name: rutina-maestra-formula100k
description: >
  Skill de configuración inicial del Autopilot F100K. Usar cuando alguien diga: "configura mi autopilot", "quiero activar mi radar de contenido", "configurar rutina diaria", "activar mis tareas programadas", "setup autopilot F100K", "quiero recibir ideas de contenido por email", o cualquier intención de automatizar su rutina de contenido. Este skill hace preguntas de personalización (nicho, keywords, email, horario, voz), guarda la config en ~/.f100k-radar/config.json, y programa los módulos elegidos vía /schedule. También usar para reconfigurar o ver la config actual.
argument-hint: [escribe "nuevo" para onboarding completo, o "ver config" para revisar la actual]
---

# Skill: Rutina Maestra — Autopilot F100K

Este skill configura el sistema completo de automatización de contenido para que cada día y cada semana lleguen a tu bandeja de entrada: virales + guiones listos, calendario armado, tendencias detectadas, y resumen de métricas. Sin que tengas que hacer nada.

---

## DETECCIÓN DE ESTADO

### Paso 0 — ¿Primera vez o reconfiguración?

Ejecutar en bash:
```bash
cat ~/.f100k-radar/config.json 2>/dev/null
```

**Si el archivo NO existe o está vacío:** Ir directo a FASE 1 — ONBOARDING.

**Si el archivo existe:** Mostrar config actual en tabla limpia y preguntar:
- "¿Quieres modificar algún campo específico?" → editar solo ese campo
- "¿Quieres hacer el onboarding completo de nuevo?" → borrar y empezar de cero
- "¿Quieres ver qué tareas tengo programadas?" → listar con `/schedule list`

---

## FASE 1 — ONBOARDING (8 preguntas, una a la vez con AskUserQuestion)

Presentar antes de empezar:
> "Voy a hacerte 8 preguntas rápidas para personalizar tu Autopilot F100K. Esto toma ~3 minutos y solo lo haces una vez. ¡Después todo corre solo!"

### Q1 — Nicho
Pregunta: "¿Cuál es tu nicho principal de contenido? (ej: finanzas personales, fitness femenino, marketing digital, cocina saludable)"
Guardar como: `niche`

### Q2 — Keywords de búsqueda
Pregunta: "Dame 3 a 5 palabras clave que usarías para buscar contenido de tu nicho en TikTok. Sepáralas por comas. (ej: 'ahorro dinero, invertir desde cero, deudas, libertad financiera')"
Guardar como: `keywords` (array, split por coma y trim)

### Q3 — Red principal
Pregunta: "¿Cuál es tu red principal donde publicas?"
Opciones: TikTok / Instagram / YouTube / TikTok + Instagram
Guardar como: `platform`

### Q4 — Handles de redes
Pregunta: "¿Cuáles son tus usuarios en las redes que elegiste? (ej: @miusuario en TikTok e Instagram)"
Guardar como: `ig_handle` y/o `tiktok_handle` según aplique

### Q5 — Email de destino
Pregunta: "¿A qué email quieres recibir tus digests diarios y semanales?"
Guardar como: `email`

### Q6 — Hora del radar diario
Pregunta: "¿A qué hora quieres recibir tu Radar Diario? (ej: 7:00, 8:30)"
Guardar como: `daily_time` (formato HH:MM)

### Q7 — Zona horaria
Pregunta: "¿Cuál es tu zona horaria?"
Opciones:
- America/Lima (Perú, Colombia, Ecuador)
- America/Mexico_City (México)
- America/Bogota (Colombia)
- America/Santiago (Chile)
- America/Argentina/Buenos_Aires (Argentina)
- Europe/Madrid (España)
Guardar como: `timezone`

### Q8 — Perfil de voz
Pregunta: "Describe en 2-3 líneas cómo hablas en tus videos. Esto sirve para que los guiones suenen a ti, no a una IA. (ej: 'directa, sin rodeos, tuteo, mezclo humor con dato duro, uso mucho storytelling personal')"
Guardar como: `voice_profile`

### Q9 — Módulos a activar
Pregunta: "¿Qué módulos quieres activar? (el Radar Diario viene siempre)"

Mostrar opciones con descripción de cada una:
- **Radar Diario de Virales** ✅ (siempre activo) — cada mañana, lunes a viernes
- **Calendario Semanal automático** — cada lunes, te arma el calendario de 7 días con refs virales reales
- **Alerta de Tendencias Emergentes** — corre junto al radar, te avisa si algo está despegando
- **Digest de Comunidad** — cada viernes, las 5 preguntas más repetidas de tus seguidores convertidas en ideas
- **Resumen de Métricas Semanales** — cada domingo, qué funcionó y qué replicar
- **Análisis de Patrones IG** — cada lunes, transcribe tus videos de la semana, detecta patrones virales vs negativos, y actualiza tu memoria para que los guiones mejoren solos

Guardar como: `modules` objeto con booleans

---

## FASE 2 — GUARDAR CONFIG

### Paso 1 — Crear directorio y archivo

```bash
mkdir -p ~/.f100k-radar
```

Guardar el siguiente JSON en `~/.f100k-radar/config.json` usando la herramienta Write con los valores reales de las respuestas:

```json
{
  "niche": "[respuesta Q1]",
  "keywords": ["[kw1]", "[kw2]", "[kw3]"],
  "platform": "[respuesta Q3]",
  "ig_handle": "[handle IG sin @, o null]",
  "tiktok_handle": "[handle TikTok sin @, o null]",
  "email": "[respuesta Q5]",
  "daily_time": "[respuesta Q6]",
  "timezone": "[respuesta Q7]",
  "voice_profile": "[respuesta Q8]",
  "modules": {
    "daily_radar": true,
    "weekly_calendar": false,
    "trends_alert": false,
    "community_digest": false,
    "metrics_report": false,
    "patron_ig_analytics": false
  },
  "created": "[fecha ISO hoy]",
  "version": "1.0"
}
```

### Paso 2 — Confirmar al usuario

Mostrar la config guardada en tabla bonita y decir:
> "✅ Config guardada en `~/.f100k-radar/config.json`. Ahora voy a programar tus tareas."

---

## FASE 3 — SETUP DE SCHEDULES

Para cada módulo activado, invocar el skill `/schedule` con las instrucciones correspondientes.

**Radar Diario** (siempre activo):
Invocar `/schedule` con:
> "Crear una rutina llamada 'Radar Diario F100K' que ejecute `/radar-virales-f100k` de lunes a viernes a las [daily_time] [timezone]. Si [modules.trends_alert] es true, también ejecutar `/radar-tendencias-f100k` 5 minutos después del radar."

**Calendario Semanal** (si `modules.weekly_calendar == true`):
> "Crear una rutina llamada 'Calendario Semanal F100K' que ejecute `/calendario-semanal-f100k` cada lunes a las [daily_time] [timezone]"

**Digest Comunidad** (si `modules.community_digest == true`):
> "Crear una rutina llamada 'Digest Comunidad F100K' que ejecute `/digest-comunidad-f100k` cada viernes a las [daily_time] [timezone]"

**Métricas Semanales** (si `modules.metrics_report == true`):
> "Crear una rutina llamada 'Métricas Semanales F100K' que ejecute `/metricas-semanales-f100k` cada domingo a las [daily_time] [timezone]"

**Análisis de Patrones IG** (si `modules.patron_ig_analytics == true`):
> "Crear una rutina llamada 'Análisis Patrones IG F100K' que ejecute `/patron-ig-f100k` cada lunes a las [daily_time + 5 minutos] [timezone]"

---

## FASE 4 — RESUMEN FINAL + OFERTA DE TEST

Mostrar al usuario:
```
🚀 Tu Autopilot F100K está activo.

MÓDULOS PROGRAMADOS:
[lista de los módulos activados con día/hora]

PRÓXIMA EJECUCIÓN:
Mañana (o el próximo día laboral) a las [daily_time] — llegará a [email]

¿Quieres que ejecute el Radar Diario AHORA para que veas cómo llega el email?
```

Si dice SÍ → invocar `/radar-virales-f100k` inmediatamente.
Si dice NO → cerrar con:
> "Todo listo. Tu primer radar llegará mañana por la mañana. Si quieres ajustar algo, vuelve a correr `/rutina-maestra-formula100k`."
