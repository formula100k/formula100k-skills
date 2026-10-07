# Formato: resumen de película

Video narrado en tercera persona que cuenta la trama de una película de principio a fin, con escenas de la película de fondo. Duración típica de 8 a 12 minutos.

Canales que respaldan este formato: 1 (SPRINGFIELD HUB, octubre de 2026). Cuando se sumen más canales, actualiza los números y anota cuántos los confirman.

## 1. Elegir la película

La película pesa tanto como el guion. Antes de escribir, comprueba:

- ¿Se puede contar en una frase con un "pero" o un "sin saber"? Por ejemplo: "un chico invisible insulta al matón de la escuela, pero el matón vuelve en 14 días para matarlo".
- ¿Tiene un plazo o una amenaza con fecha? Ese va a ser el reloj del guion.
- ¿Hay alguien subestimado que se da vuelta, o una injusticia que se castiga? En el canal analizado, los dos hits son de este tipo.
- ¿El ángulo es nuevo para el canal? Los 3 clones directos del hit de matones escolares no pasaron de 3,2 mil vistas. El que cambió el ángulo (víctima adulta y venganza de un policía) llegó a 154 mil.

## 2. Patrones de título

| Patrón | Ejemplo real |
|---|---|
| Víctima + giro de poder | Al ser golpeado por matones libera su verdadero potencial (642 mil) |
| Agresión + castigo extremo | Cuatro MATONES la golpearon y el policía toma la venganza más cruel (154 mil) |
| "Sin saber…" | Los MATONES de la escuela lo acosaron SIN SABER ESTO… |
| Subestimado | Creyeron que era un viejo indefenso.. |
| Regla del mundo + amenaza | En el futuro, ser guapo es obligatorio… si no, morirás |

Usa MAYÚSCULAS en 1 o 2 palabras de conflicto como máximo. El sufijo "| Resumen de Película" lo usa el canal, pero no hay datos de que ayude.

## 3. Estructura (tiempos del hit de 642 mil, 9:21)

| Bloque | Cuándo | Qué pasa |
|---|---|---|
| Gancho | 0:00 | La primera frase ya es historia. Si la película arranca lento, abre con la escena más fuerte y vuelve atrás ("retrocediendo un mes en el tiempo"). |
| Setup | 0:00–1:00 | Protagonista, qué quiere o teme, su "regla". Villano en una frase. |
| Primer giro | antes de 2:00 | Algo rompe la regla del setup (en el hit: 1:42). |
| Reloj | antes de 2:30 | Plazo o amenaza con fecha (en el hit: 2:14, "regresará justo el día del baile"). Recuérdalo 1 o 2 veces más. |
| Pregunta abierta | antes de 3:00 | Algo que se va a responder cerca del final (en el hit: 3:02 a 7:06). |
| Ascenso | mitad | 3 o 4 escenas, cada una con su propio "pero" o "de repente". |
| Falsa pista | opcional, ~2/3 | El espectador cree una respuesta y se la desmiente (en el hit: 6:39). |
| Caída | último tercio | Todo sale mal (traición, pérdida). |
| Clímax | cuando vence el reloj | Se cumple el plazo prometido al inicio. |
| Cierre | últimos 10–20 s | 1 o 2 frases. Sin moraleja larga. |

## 4. Ritmo medido

| Medida | Hit 642 mil | Hit 154 mil |
|---|---|---|
| Palabras por minuto | 219 | 204 |
| Conector de giro cada | 11,3 s | 14,6 s |
| Tramo más largo sin giro | 38 s | 41 s |

Medido con `scripts/densidad_giros.py`. Para un guion nuevo: unas 200 palabras por minuto, un giro cada 15 s o menos y ningún tramo de más de 45 s sin giro.

## 5. Estilo de narración

- Tercera persona y pasado simple o presente narrativo, sin mezclar en la misma escena.
- Frases de 8 a 20 palabras. Verbo de acción al principio cuando se pueda.
- Adjetivos con emoción en los momentos de violencia o tensión ("brutal", "como bestias salvajes", "quedó helada").
- Cero opinión del narrador. Sin "lo cual me parece", sin "spoiler", sin "como verán".
- Diálogo solo en las frases clave, citado corto: "Voy a matarte."
- Conectores para variar: pero, sin embargo, de repente, acto seguido, en ese momento, justo entonces, más tarde, al día siguiente, mientras tanto, resulta que, lo que no sabía es que.

## 6. Plantilla

```
TÍTULO (inversión / "sin saber" / castigo):
→
[0:00–0:15] ESCENA MÁS FUERTE (sin saludo):
→
[0:15–1:00] SETUP: quién es, qué quiere o teme, su "regla":
→
VILLANO / AMENAZA en una frase:
→
[antes de 2:00] PRIMER GIRO (rompe la regla):
→
[antes de 2:30] RELOJ:
→
[antes de 3:00] PREGUNTA ABIERTA (se cierra cerca del final):
→
FALSA PISTA (opcional):
→
[mitad] ASCENSO (cada escena con un "pero" o "de repente"):
1.
2.
3.
[último tercio] CAÍDA:
→
CLÍMAX (vence el reloj):
→
CIERRE (1–2 frases):
→
```

## 7. Checklist

1. La primera frase ya es historia.
2. El título promete una inversión, usa "sin saber" o promete un castigo.
3. Antes del minuto 1 se sabe qué quiere o teme el protagonista.
4. Hay un giro fuerte antes del minuto 2.
5. Hay un reloj antes del 2:30 y se recuerda al menos una vez más.
6. Siempre queda al menos una pregunta abierta.
7. Un giro cada 15 s o menos en promedio y ningún tramo de más de 45 s sin giro.
8. El clímax llega cuando vence el reloj.
9. El cierre dura 2 frases o menos.
10. Los hechos de la trama son correctos (nombres, orden de las escenas, final).
