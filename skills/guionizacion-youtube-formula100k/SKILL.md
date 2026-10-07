---
name: guionizacion-youtube-formula100k
description: Escribe, revisa y hace ingeniería inversa de guiones para videos largos de YouTube narrados (resúmenes de películas, historias, documentales cortos, recaps de series o anime, true crime, explicaciones narradas). Usa canales reales investigados como referencia, con datos de vistas, transcripciones y mapas minuto a minuto. Usar SIEMPRE que alguien pida un guion para YouTube de más de 3 minutos, quiera mejorar la retención o la trama de sus videos largos, pregunte cómo hace un canal para mantener la atención, quiera analizar o descifrar el formato de un canal de YouTube, diga "mis guiones no enganchan", "quiero que se queden hasta el final", "cómo narran los canales de resúmenes", "analiza este canal" o "hazme un guion de resumen de película". Para Reels, TikTok o Shorts usa guionizacion-formula100k.
---

# Guionización YouTube FÓRMULA 100k

Esta skill sirve para tres cosas: analizar un canal de YouTube para entender por qué funciona, escribir un guion largo narrado con lo aprendido y revisar un guion que ya existe. Todo se apoya en referencias reales que están en `references/canales/`. Cada canal investigado deja una ficha con datos y patrones, así la skill mejora con cada investigación.

## Por qué funciona así

En YouTube largo, el guion importa, pero no explica solo el éxito. En el primer canal analizado (SPRINGFIELD HUB), los dos videos virales juntaron el 93% de las vistas de sus últimos 30 videos. Los 3 videos que copiaron casi igual el tema del viral se quedaron en 1,5 a 3 mil vistas. Por eso esta skill siempre mira tres capas en este orden:

1. **Historia y ángulo**: ¿la historia se puede contar en una frase con un "pero" o un "sin saber"?
2. **Título y miniatura**: ¿prometen una inversión, una amenaza o una transformación?
3. **Guion**: ¿hay un reloj, preguntas abiertas y un giro cada pocos segundos?

Si la capa 1 falla, no hay guion que la salve. Dilo con honestidad antes de escribir.

## Qué hacer según el pedido

### A. "Analiza este canal" o "¿cómo hacen sus guiones?"

Lee `references/investigar-canal.md` y sigue el método. En resumen:

1. Corre `python3 scripts/canal_videos.py @handle --json canal.json` para ver vistas, duración y outliers (videos con 5 veces o más la mediana).
2. Baja la transcripción de los 2 o 3 outliers con `python3 scripts/transcripcion.py <url> salida.txt`. Si YouTube bloquea la IP, usa la skill `transcripcion-youtube-formula100k` o el MCP de transcripción que haya.
3. Corre `python3 scripts/densidad_giros.py salida.txt` en cada transcripción.
4. Arma el mapa minuto a minuto y compara outliers contra videos normales del mismo canal. Las diferencias son el aprendizaje, no lo que todos los videos tienen en común.
5. Guarda la ficha nueva en `references/canales/<canal>.md` usando `references/canales/_plantilla-canal.md`, y suma al formato correspondiente cualquier patrón que se repita en 2 canales o más.

Entrega: datos (con la fuente y la fecha), el patrón de títulos, las técnicas con citas reales y su minuto, el mapa del outlier principal y qué hacer distinto. Sé honesto si el canal tiene pocos hits o está inactivo.

### B. "Hazme un guion" (de una película, historia o tema)

1. Identifica el formato y lee su archivo en `references/formatos/`. Hoy existe `resumen-pelicula.md`. Si el formato no existe todavía, usa el más cercano y avisa que no hay una referencia investigada para ese formato.
2. Lee al menos una ficha de canal de ese formato en `references/canales/` para tomar el tono y el ritmo reales.
3. Si no conoces bien la trama de la película o historia, pide la sinopsis o busca una antes de escribir. Un resumen con hechos inventados destruye la confianza del canal.
4. Llena primero la plantilla de estructura del formato (gancho, setup, primer giro, reloj, pregunta abierta, ascenso, caída, clímax, cierre) y muéstrala en pocas líneas.
5. Escribe el guion narrado completo con las marcas de tiempo estimadas (unas 200 palabras por minuto).
6. Pasa el guion por `scripts/densidad_giros.py guion.txt --wpm 200` y corrige los tramos marcados con ⚠.
7. Propón 3 títulos con los patrones del formato.

### C. "Revisa mi guion" o "¿por qué no retienen mis videos?"

1. Corre `scripts/densidad_giros.py` sobre el guion o la transcripción.
2. Revísalo contra el checklist del formato.
3. Devuelve un feedback numerado: qué funciona, qué falla con el minuto exacto y cómo reescribirlo, con un ejemplo de la frase corregida.

## Reglas de escritura que aplican a cualquier formato narrado

- La primera frase ya es historia. Nada de "hola", "bienvenidos" ni "en el video de hoy". La gente decide en los primeros 10 segundos.
- Abre con la escena más fuerte y después vuelve atrás si hace falta ("retrocediendo un mes en el tiempo…").
- Antes del minuto 2 tiene que pasar algo que rompa la situación inicial. Antes del 2:30 tiene que haber un reloj (una fecha, un plazo, una amenaza).
- Siempre tiene que quedar al menos una pregunta abierta. Cuando cierres una, abre otra antes.
- En los virales medidos aparece un conector de giro ("pero", "sin embargo", "de repente", "acto seguido", "en ese momento", "más tarde") cada 11 a 15 segundos, y ningún tramo pasa de 41 segundos sin uno.
- Frases cortas, verbos de acción y adjetivos con emoción. No opines sobre la historia ni expliques de más: narra.
- Cierra en 1 o 2 frases. No hagas moralejas largas.

## Cómo escribir la entrega

- Escribe en español neutro, en segunda persona ("tú") y con la voz de FÓRMULA 100k: directa, cálida y honesta.
- Cita datos con su fuente y su fecha. Las vistas cambian.
- Cuando el guion es para grabar, entrégalo en texto plano, sin markdown dentro del texto narrado, para que se pueda leer en voz alta o pegar en un teleprompter.
- Si luego van a "humanizar" el guion, la skill `guionizacion-humanizada` complementa esta.

## Archivos

- `references/investigar-canal.md`: el método completo para investigar un canal nuevo.
- `references/formatos/resumen-pelicula.md`: estructura, plantilla, títulos y checklist del formato resumen de película.
- `references/canales/springfield-hub.md`: primer caso de estudio, con datos, citas y el mapa del video de 642 mil vistas.
- `references/canales/_plantilla-canal.md`: plantilla para documentar cada canal nuevo.
- `scripts/canal_videos.py`: vistas, duración y outliers de un canal. No necesita API key.
- `scripts/transcripcion.py`: baja la transcripción con marcas de tiempo.
- `scripts/densidad_giros.py`: mide los giros por minuto, los tramos sin giro y las palabras por minuto.
