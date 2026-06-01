---
name: investigacion-nicho-formula100k
description: "Investigación estratégica de nicho para creadoras de contenido con la metodología F100K. Usar cuando una creadora quiere validar si un nicho tiene potencial antes de invertir tiempo, cuando quiere analizar la competencia en Skool/TikTok/IG, cuando quiere saber si su oferta tiene mercado, o cuando necesita un brief de posicionamiento antes de crear contenido o lanzar una comunidad. Output = decisión con evidencia real, no teoría."
---

# Investigación de Nicho — Fórmula 100K

Produce investigación que sustenta decisiones reales, no investigación de adorno.

## Cuándo activar

- Una creadora quiere entrar a un nuevo nicho y no sabe si tiene demanda
- Necesita entender quién más está en ese espacio y cómo se posicionan
- Va a lanzar una comunidad Skool y quiere validar el ángulo antes de construirla
- Quiere saber qué preguntas/dolores reales tiene su audiencia objetivo
- Necesita un brief de posicionamiento antes de empezar a crear contenido

## Estándar de investigación

1. Todo dato importante necesita fuente real (cuenta real, post real, número real).
2. Preferir datos recientes. Si el dato tiene más de 6 meses, marcarlo como posiblemente obsoleto.
3. Incluir evidencia contraria y escenarios de riesgo.
4. Traducir hallazgos en UNA decisión clara, no en un resumen neutro.
5. Separar explícitamente: hecho / inferencia / recomendación.

## Stack de investigación

| Motor | Qué caza |
|-------|----------|
| **agent-browser** | Perfiles reales en IG/TikTok, engagement real, comunidades Skool activas, qué contenido funciona en ese nicho |
| **Apify** | Scraping de cuentas IG sin sesión, volumen de seguidores, posts recientes, cuando agent-browser no tiene sesión activa |
| **Tavily MCP** | Tendencias web, búsquedas de palabras clave, artículos del sector, validación cruzada de demanda |
| **vidIQ MCP** | YouTube: qué tan buscado es el tema, outliers del nicho, preguntas reales en comentarios |

## Modos de investigación

### Modo 1: Validación de nicho (¿tiene demanda?)

Recolectar:
- ¿Hay cuentas con +10k seguidores hablando de esto? (señal de demanda)
- ¿Cuánto engagement real tienen vs views? (ratio mide calidad de audiencia)
- ¿Hay comunidades Skool activas en este nicho? ¿Cuántos miembros? ¿Gratis o pago?
- ¿Qué palabras usa la audiencia para describir su problema? (verbatim, no paráfrasis)
- ¿Hay búsquedas en YouTube? ¿Cuántas vistas tienen los outliers?

### Modo 2: Análisis de competencia (¿cómo está posicionado el mercado?)

Para cada competidor directo/adyacente, recolectar:
- Propuesta de valor real (lo que dicen, no lo que uno asume)
- Precio y modelo de negocía
- Tamaño de audiencia y plataforma principal
- Qué funciona (posts con más engagement) y qué no (posts ignorados)
- Huecos: ¿qué pregunta frecuente nadie está respondiendo?

### Modo 3: Diagnóstico de audiencia (¿qué quiere realmente?)

- Top 5 dolores reales de la audiencia (sacar de comentarios, no inventar)
- Lenguaje exacto que usan para describir su problema (verbatim)
- Qué soluciones ya intentaron y por qué no funcionaron
- Qué resultado específico están buscando

## Formato de output

Estructura default:

```
### 1. RESUMEN EJECUTIVO
[2-3 oraciones: ¿tiene potencial este nicho? ¿por qué sí / no / con qué condiciones?]

### 2. EVIDENCIA DEL MERCADO
- Cuentas encontradas: [nombres reales + seguidores + link]
- Comunidades Skool: [nombres + miembros + precio]
- Volumen de búsqueda YouTube: [keywords + views de outliers]
- Conclusión: nicho [saturado / en crecimiento / virgen / de difícil acceso]

### 3. ANÁLISIS DE COMPETENCIA
[tabla: Cuenta | Plataforma | Audiencia | Propuesta | Precio | Hueco]

### 4. VOZ DE LA AUDIENCIA (verbatim)
- Dolores reales: [citas textuales de comentarios/posts]
- Lenguaje exacto: [cómo llaman ellos al problema]
- Resultado deseado: [qué quieren lograr en sus propias palabras]

### 5. HUECOS DE MERCADO
[Lo que nadie está haciendo bien en este nicho]

### 6. RECOMENDACIÓN
[Decisión clara: entrar / esperar / pivotear + ángulo de posicionamiento sugerido]

### 7. FUENTES
[Links reales usados]
```

## Gate de calidad

Antes de entregar:
- Todos los números tienen fuente real o están marcados como estimados
- Los datos viejos están señalados
- La recomendación se sigue lógicamente de la evidencia
- Se incluyen riesgos y casos contrarios
- El output hace más fácil tomar una decisión, no más confusa

## Conexión con otros skills F100K

Usar este skill ANTES de:
- `creador-estrategia-contenido-formula100k` — el brief de nicho alimenta la estrategia
- `campana-lanzamiento-formula100k` — el posicionamiento saldrá de aquí
- `calendarizador-contenido-formula100k` — los dolores y lenguaje van al calendario
- `creadora-comunidades-skool` — validar el ángulo antes de construir la estructura
