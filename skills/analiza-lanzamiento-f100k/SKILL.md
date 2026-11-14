---
name: analiza-lanzamiento-f100k
description: "Analiza los números de un lanzamiento que ya pasó (masterclass, webinar, clase en vivo o reto con venta): calcula conversión de registro, show-up, conversión a venta, CPL, CPA, ROAS y LTV con churn si hubo suscripción, encuentra dónde se cayó el embudo y entrega qué funcionó, máximo 3 cambios para el próximo y un reporte HTML descargable. Usar con «analiza mi lanzamiento», «cómo me fue en el lanzamiento», «revisa las métricas de mi masterclass», «reporte de lanzamiento», «por qué no vendí en mi webinar». NO planea un lanzamiento nuevo (eso es campana-lanzamiento-formula100k) ni mide los posts semanales (eso es metricas-semanales-f100k)."
argument-hint: [números pegados, CSV o nada para que te pregunte]
---


## 🧰 EN TU COMPU (leer antes de seguir: manda sobre lo que diga esta skill más abajo)

Esta skill viaja en el plugin de FÓRMULA 100K y corre igual en Mac y en Windows.

- **Tu negocio.** Los datos salen de la persona, nunca de un ejemplo: lo que venga en el pedido, su Manual o Segundo Cerebro si lo tiene, o la ficha `~/Documents/mi-contenido/mi-negocio.md`. Si no hay nada, pregunta rubro, avatar y oferta en un solo mensaje.
- **Tu marca.** Colores, letras, estilo visual y @handle salen, en este orden: de `~/Documents/mi-contenido/mi-marca.md`; si no existe, de su manual de identidad visual `mi-marca/marca.md` (en la carpeta del proyecto, en `~/mi-marca/` o en una carpeta `mi-marca` dentro de Documentos; su bloque YAML manda en los valores exactos). Si no hay ninguno, pregúntale lo que haga falta en un solo mensaje. Nunca uses los colores ni el @ de un ejemplo.
- **Tu voz.** Cómo habla (tono, palabras que usa y las que nunca usa) sale de `~/Documents/mi-contenido/mi-voz.md`. Si no existe y lo que entregas lleva texto para decir o publicar, pídele dos o tres textos suyos o que te cuente cómo habla, en un solo mensaje.
- **Dónde guardar.** Todo lo que generes va dentro de `~/Documents/mi-contenido/` (crea la subcarpeta si no existe).
- **Si falta una cuenta o un conector, no te detengas:** haz la parte que sí se puede y di en una línea qué faltó.
  - Sin Apify → usa la búsqueda web de Claude (WebSearch y WebFetch) y los enlaces que la persona te pase. Toda cifra que no leíste de la fuente va marcada «sin verificar». Nunca inventes una métrica ni un enlace.
  - Sin `agent-browser`, Tavily, Supadata o vidIQ → lo mismo: búsqueda web de Claude.
  - Sin Higgsfield ni otra herramienta de imagen → entrega la pieza en HTML y tipografía si se puede, y deja el prompt de cada imagen listo para cuando conecte la cuenta.
  - Sin Gmail → entrega el resultado en el chat y guárdalo como archivo.
- **Nombres de herramientas.** Un conector puede aparecer como `mcp__claude_ai_<Nombre>__…` o `mcp__<nombre>__…`: usa el que esté disponible.
- **Otras skills.** Las que nombra esta skill vienen en el mismo plugin. Si alguna no está instalada, sigue sin ella y avisa.
- **Archivos de esta skill.** Las rutas como `references/…` son relativas a la carpeta de esta skill (la que tiene este `SKILL.md`), no a `~/.claude/skills/`.
- **Abrir un archivo o una carpeta:** en Mac `open "<ruta>"`; en Windows `start "" "<ruta>"`.
- **Llaves.** Nunca pidas que peguen una llave o un token en el chat ni los escribas en un archivo de `~/Documents/mi-contenido/`.

---


# Analiza tu lanzamiento

Tomas los números de un lanzamiento que ya pasó (masterclass, webinar, clase en vivo o reto con venta al final) y devuelves un reporte claro: **qué funcionó, dónde se cayó el embudo (con el número), qué cambiar en el próximo (máximo 3 acciones)** y un HTML descargable con el embudo dibujado.

## Archivos de esta skill
- `scripts/metricas_lanzamiento.py`: hace TODAS las cuentas. Solo Python 3, sin instalar nada. Nunca calcules a mano lo que el script ya calcula.
- `references/secciones-del-reporte.md`: qué va en cada sección del reporte. **Léelo antes del paso 4.**

## Lo que NO hace
- No planea un lanzamiento nuevo (eso es `campana-lanzamiento-formula100k`).
- No mide los posts de la semana (eso es `metricas-semanales-f100k`).
- No escribe la masterclass (eso es `webinar-que-vende-f100k`).

---

## PASO 1 · Pide los datos

Si ya pegó todo junto (un texto, una tabla, un CSV o una captura del administrador de anuncios), léelo y pasa directo a confirmar. Si no, pregunta **de una en una**, en este orden, y acepta «no sé» o «no tengo» (ese dato queda en 0 y lo dices en el reporte):

1. **Nombre del lanzamiento** (para el título del reporte).
2. **¿Cuánto invertiste en anuncios?** (si fue orgánico, 0).
3. **¿Tuviste página de registro (landing)?** Si dice que no, es el caso **sin landing**: no preguntes visitas.
4. **Visitas a la página de registro** (de la herramienta de la página o de los anuncios).
5. **Leads:** cuántas personas se registraron.
6. **Asistentes en vivo:** cuántas llegaron a la clase (el pico de conectadas o el total de la plataforma; pregúntale cuál está usando).
7. **Ventas y precios por tipo de pago.** Pregunta solo los que usó:
   - pago único: cuántas ventas y a qué precio;
   - suscripción mensual: cuántas personas y precio por mes;
   - suscripción anual: cuántas personas y precio por año.
   Si vendió el mismo programa a dos precios (preventa y precio normal), pide el promedio o súmalos como dos líneas y avísale cómo lo tomaste.
8. **Opcionales, que hacen el reporte mucho mejor** (ofrécelos en un solo mensaje):
   - la **transcripción** de la masterclass (pegada o en un archivo .txt);
   - los **comentarios** del chat del vivo o de las publicaciones;
   - **contexto de WhatsApp**: capturas del grupo de calentamiento o una descripción (cuánta gente había, cuánto respondía, qué preguntaba).

Antes de calcular, muéstrale los datos en una lista corta y pregúntale «¿está bien?». Un número mal puesto cambia todo el diagnóstico.

## PASO 2 · Calcula con el script

Guarda los datos en `~/Documents/mi-contenido/lanzamientos/<nombre-corto>/datos.json`:

```json
{
  "nombre": "Masterclass de marzo",
  "inversion_ads": 1000,
  "sin_landing": false,
  "visitas_landing": 2500,
  "leads": 800,
  "asistentes_en_vivo": 200,
  "precio_unico": 497, "ventas_unico": 8,
  "precio_mensual": 0, "ventas_mensual": 0,
  "precio_anual": 0, "ventas_anual": 0
}
```

(Los números de arriba son solo un ejemplo del formato: usa siempre los de la alumna.)

Corre:

```bash
python3 "<carpeta de esta skill>/scripts/metricas_lanzamiento.py" datos.json        # todo en JSON
python3 "<carpeta de esta skill>/scripts/metricas_lanzamiento.py" datos.json --md   # tabla para el chat
```

En Windows, si `python3` no existe, usa `python` o `py`. También acepta un CSV con las columnas `launchName,inversionAds,visitasLanding,leadsGenerados,asistentesEnVivo,precioUnico,ventasUnico,precioMensual,ventasMensual,precioAnual,ventasAnual` (fila 1 = encabezados, fila 2 = datos).

### Qué calcula (y cómo)
| Métrica | Fórmula |
|---|---|
| Ventas | únicas + mensuales + anuales |
| Ingresos (mes 1) | ventas × precio de cada tipo, sumados (la mensual cuenta 1 mes; la anual, el pago del año) |
| Ganancia neta | ingresos − inversión |
| Conversión de registro | leads ÷ visitas × 100 (N/A sin landing) |
| Show-up | asistentes ÷ leads × 100 |
| Conversión a venta | ventas ÷ asistentes × 100 |
| CPL (costo por lead) | inversión ÷ leads |
| CPA (costo por venta) | inversión ÷ ventas |
| ROAS | ingresos ÷ inversión |
| Ticket promedio | ingresos ÷ ventas |
| Ventas para cubrir la inversión | inversión ÷ ticket promedio, redondeado hacia arriba |
| Eslabón más débil | la conversión del embudo más lejos de su referencia |
| Dinero sobre la mesa | ventas e ingresos extra si SOLO esa etapa llegaba a su referencia |
| LTV con churn (solo si hay suscripción) | ingresos acumulados a 3, 6 y 12 meses con el churn supuesto; ROAS en cada horizonte; mes en que recuperas la inversión |
| Proyección | misma inversión y mismo CPL; el eslabón débil se queda igual / sube a mitad de camino / llega a la referencia |

### Referencias y supuestos (dilo siempre así)
El script compara contra estas **referencias supuestas**: registro 40 %, show-up 30 %, venta 5 %, CPL $2.50, ROAS 3x. Y si hay suscripción usa estos **supuestos** de churn: 15 % mensual y 30 % de anuales que no renuevan. **No son datos del mercado verificados**: son puntos de partida. En el reporte llámalos «referencia supuesta» o «supuesto» y ofrécele cambiarlos. Si tiene sus propios números (de lanzamientos anteriores o de su nicho), agrégalos al JSON y vuelve a correr:

```json
"referencias": {"registro": 35, "show_up": 25, "venta": 4, "cpl": 3, "roas": 2.5},
"supuestos": {"churn_mensual": 0.10, "churn_anual": 0.25}
```

Si la inversión es 0 (lanzamiento orgánico), CPL, CPA y ROAS salen en 0: dilo y enfoca el análisis en las conversiones del embudo.

## PASO 3 · Muestra el resumen en el chat
Primero la tabla (`--md`) y, debajo, en este orden:
1. **Qué funcionó** (de 1 a 3 cosas, cada una con su número).
2. **Dónde se cayó el embudo**: la etapa, su número y lo que costó. Ej.: «De 800 leads llegaron 200 (25 %). Con la referencia supuesta de 30 % habrías tenido 40 personas más en el vivo».
3. **Qué cambiar en el próximo lanzamiento**: máximo 3 acciones, una línea cada una.

Esto es lo que la alumna necesita si no lee nada más. Tiene que entenderlo alguien que nunca vio un administrador de anuncios: nada de siglas sin explicar la primera vez.

## PASO 4 · Escribe el reporte completo
Lee `references/secciones-del-reporte.md` y escribe el análisis en `analisis.md` (misma carpeta), con estas secciones en orden:

0. Resumen en 30 segundos
1. Diagnóstico ejecutivo (saludable, en riesgo o en crisis)
2. FODA del lanzamiento
3. Captación (con landing o sin landing)
4. Asistencia (show-up), usando WhatsApp y comentarios si los hay
5. Ventas (cierre)
6. Rentabilidad y escala (con LTV si hay suscripción)
7. Contenido de la masterclass (solo si hay transcripción)
8. Comentarios de la audiencia (solo si los hay)
9. Plan de acción: máximo 3 acciones
10. Proyección del próximo lanzamiento

Reglas al escribir:
- Cada afirmación lleva el número del script que la sostiene. No inventes cifras, promedios de la industria ni casos.
- Si citas la transcripción o los comentarios, copia la frase tal cual.
- Usa `##` para cada sección, viñetas con `- ` y `**negritas**` (el HTML entiende eso).

## PASO 5 · Arma el HTML descargable

```bash
python3 "<carpeta de esta skill>/scripts/metricas_lanzamiento.py" datos.json --html reporte.html --analisis analisis.md
```

El HTML trae: tarjetas de resumen (inversión, ingresos, ganancia, ROAS, costo por venta, ventas), el embudo en barras, cada métrica frente a su referencia supuesta, el ingreso recurrente si hay suscripción, la proyección en 3 escenarios y tu análisis completo. Funciona en claro y oscuro y se guarda como PDF con Imprimir → Guardar como PDF.

Ábrelo (`open` en Mac, `start ""` en Windows) y dile dónde quedó: `~/Documents/mi-contenido/lanzamientos/<nombre-corto>/reporte.html`.

## PASO 6 · Cierra
Ofrécele en una línea el siguiente paso que corresponda a su eslabón débil:
- se cayó la venta → revisar la masterclass con `webinar-que-vende-f100k`;
- se cayó el show-up o la captación → planear el próximo con `campana-lanzamiento-formula100k`, llevando estas 3 acciones como punto de partida.

Si vuelve a correr la skill en el próximo lanzamiento, compara con la carpeta anterior en `~/Documents/mi-contenido/lanzamientos/` y di qué etapa mejoró y cuál no.
