---
name: planificador-mensual-formula100k
description: "Usar cuando alguien quiere planear el mes, organizar objetivos mensuales, estructurar un plan de trabajo mensual, convertir un vaciado mental de metas en proyectos ejecutables con responsables, o cuando dice 'estos son mis objetivos del mes'. Sirve si trabajas sola o con equipo."
argument-hint: "[mes y año]"
---

## 🧰 EN TU COMPU (leer antes de seguir: manda sobre lo que diga esta skill más abajo)

Esta skill viaja en el módulo de Agentes de FÓRMULA 100K y corre igual en Mac y en Windows.

- **Tu negocio.** Los datos salen de la persona, nunca de un ejemplo: lo que venga en el pedido, su Manual o Segundo Cerebro si lo tiene, o la ficha `~/Documents/mi-contenido/mi-negocio.md`. Si no hay nada, pregunta rubro, avatar y oferta en un solo mensaje. Colores, letra y @handle también son los suyos.
- **Dónde guardar.** Todo lo que generes va dentro de `~/Documents/mi-contenido/` (crea la subcarpeta si no existe).
- **Si falta una cuenta o un conector, no te detengas:** haz la parte que sí se puede y di en una línea qué faltó.
  - Sin Apify → usa la búsqueda web de Claude (WebSearch y WebFetch) y los enlaces que la persona te pase. Toda cifra que no leíste de la fuente va marcada «sin verificar». Nunca inventes una métrica ni un enlace.
  - Sin `agent-browser`, Tavily, Supadata o vidIQ → lo mismo: búsqueda web de Claude.
  - Sin Higgsfield ni otra herramienta de imagen → entrega la pieza en HTML y tipografía si se puede, y deja el prompt de cada imagen listo para cuando conecte la cuenta.
  - Sin Gmail → entrega el resultado en el chat y guárdalo como archivo.
- **Nombres de herramientas.** Un conector puede aparecer como `mcp__claude_ai_<Nombre>__…` o `mcp__<nombre>__…`: usa el que esté disponible.
- **Otras skills.** Si esta skill nombra una que no está en `~/.claude/skills/`, sigue sin ella y avisa. El editor de video viene en el módulo de Edición y los estilos de animación en el módulo de Animación: úsalos solo si están instalados.
- **Abrir un archivo o una carpeta:** en Mac `open "<ruta>"`; en Windows `start "" "<ruta>"`.
- **Llaves.** Nunca pidas que peguen una llave o un token en el chat ni los escribas en un archivo de `~/Documents/mi-contenido/`.

---

## 🧭 ANCLAJE DE RUBRO (leer PRIMERO — manda sobre cualquier ejemplo de esta skill)

Esta skill enseña un **método**. El método es agnóstico de industria: sirve igual para
formulación cosmética, nutrición, repostería, fisioterapia, finanzas o jabonería.
Los ejemplos escritos aquí abajo son ilustraciones **del método**, nunca del tema.

**Antes de escribir nada:**

1. Identifica el **RUBRO real** de la persona (léelo de su Segundo Cerebro, de su perfil o
   pregúntaselo en una línea si no está claro). Decláralo: *"Rubro: ___"*.
2. Todos los ejemplos, analogías, comparaciones, objeciones, métricas y vocabulario salen
   de **ESE** rubro.
3. Si el rubro **no** es marketing, redes sociales, creación de contenido, ventas online o
   negocios digitales → queda **PROHIBIDO** el vocabulario de ese mundo (reels, algoritmo,
   embudo, lead magnet, engagement, "publicar sin vender", "clientes de alto ticket",
   "escalar tu negocio", "posicionarte como referente"), salvo que la persona lo escriba primero.
4. Si el rubro es **técnico, científico o de oficio**: NO borres el tecnicismo para
   "simplificar". Úsalo y **tradúcelo en su primera mención**. El término preciso ES la
   autoridad de esa creadora; quitarlo borra justo lo que la diferencia.
5. Si no tienes datos suficientes del negocio, dilo y usa marcadores explícitos
   (`[TU OFERTA]`, `[TU RESULTADO]`). **Nunca asumas que el rubro es marketing.**

**El método viaja, el rubro no.** El mismo molde, vestido con rubros distintos:

| Rubro | El mismo molde |
|---|---|
| Cocina | "Así es mi cena favorita para no dormir con el azúcar alta." |
| Relaciones | "5 señales de que estás forzando una relación que ya no funciona." |
| Finanzas | "La principal causa de un divorcio no es una infidelidad." |
| Formulación cosmética | "El conservante decide si tu crema dura tres meses o te da una infección. No el aceite." |
| Jabonería | "Si tu jabón se pone blando a los dos días, no fue el aceite. Fue la sosa." |
| Fisioterapia | "Ese dolor de rodilla al bajar escaleras casi nunca nace en la rodilla." |
| Repostería | "Tu bizcocho se hunde en el centro por la temperatura, no por la harina." |
| Jardinería | "Tu planta no se está muriendo de sed. Se está ahogando." |

Mismo molde en todos; ninguno menciona reels ni embudos. Haz exactamente eso.

---

# Planificador Mensual · FÓRMULA 100K

Convierte el vaciado mental de objetivos del mes en proyectos ordenados, con responsable y quincena. Sirve igual si trabajas sola o con equipo.

## Cuándo activar

- Alguien comparte una lista de objetivos y acciones para el mes
- «Estas son mis metas de julio, dime qué falta» / «organízalas»
- «Quiero planear el mes» / «arma el plan de [mes]»
- Inicio de mes o preparación del siguiente
- Cuando la estratega (`agente-estratega-f100k`) pide convertir una estrategia en plan

## Reglas que no se negocian

1. **Nunca inventes datos del equipo.** Pregunta quién hace qué; si trabaja sola, la responsable de todo es ella y el plan se ajusta a sus horas reales.
2. **Toda tarea tiene responsable.** Si no hay quién, márcala «Sin asignar» y pregunta.
3. **Toda métrica es real y verificable.** Sin porcentajes ni ventas estimadas sin fuente.
4. **La primera quincena (días 1 a 15) solo lleva lo crítico.** Lo que puede esperar va a la segunda. Lo que no cabe en la segunda es de otro mes.
5. La revisión es honesta y constructiva: el objetivo es que el plan se pueda ejecutar.

---

## Paso 1 — Quién hace qué

Si no viene en el pedido, pregunta en una sola ronda:

> «Para ordenar tu mes necesito saber:
> 1. ¿Trabajas sola o con equipo? Si hay equipo: nombre y rol de cada persona.
> 2. ¿Cuántas horas a la semana le puedes dedicar a esto?
> 3. ¿Tienes colaboradores externos (una editora, alguien de anuncios)?
> 4. ¿Dónde llevas tus tareas? (una hoja de cálculo, Notion, Trello, papel)
> 5. ¿Cuántos clientes o proyectos activos tienes ahora?»

Arma el mapa:

```
QUIÉN HACE QUÉ
- [Nombre] — [rol] — [horas por semana]
- Externos: [nombre] ([qué hace])
```

Si te llamó la estratega y ya trae estos datos, no vuelvas a preguntar.

---

## Paso 2 — El vaciado mental del mes

Si no lo ha pegado, pídelo:

> «Pega tu vaciado mental del mes: metas, acciones, ideas, todo mezclado. No lo ordenes, eso lo hago yo.»

Identifica el mes del plan. Si no está claro, pregunta.

---

## Paso 3 — Revisión de viabilidad

Analiza el vaciado con honestidad:

### Problemas de estructura
- Tareas sin responsable
- Objetivos mezclados con acciones (hay 4 niveles: objetivo / resultado clave / proyecto / tarea)
- Dependencias escondidas (la tarea B necesita que termine la A, y la A no está definida)

### Problemas de carga
- Semanas de trabajo real contra días disponibles
- Cuellos de botella por persona (por ejemplo: «grabar 7 videos, los anuncios y la clase el mismo día no cabe»)
- Qué NO cabe en el mes con las horas que hay

### Lo que falta de verdad
- Pasos previos que no están en la lista
- Tareas que se repiten cada semana y piden una plantilla
- Métricas intermedias: ¿cómo sabes en la semana 2 que vas bien?

```
## Revisión de viabilidad — [Mes]

### Lo que está bien
### Problemas de estructura
### Cuellos de botella por persona
- [Nombre]: [problema]
### Lo que falta
### Lo que NO cabe este mes (mover o quitar)
```

---

## Paso 4 — Objetivos, resultados clave y quincenas

```
OBJETIVO DEL MES (el porqué)
  └── Resultado clave (número concreto al día 30)
       └── Proyecto (grupo de tareas con una responsable)
            └── Tarea (acción concreta con responsable y quincena)
```

- **Objetivos:** máximo 4 en el mes. Si hay más, agrupa o recorta.
- **Resultado clave:** se puede medir el día 30 (ventas, piezas publicadas, personas en la lista). Nada cualitativo.
- **Proyecto:** nombre claro, responsable y quincena de arranque.
- **Primera quincena (Q1, días 1 a 15):** solo lo que desbloquea los resultados clave.
- **Segunda quincena (Q2, días 16 a 30):** ejecución sostenida y lo que la primera desbloqueó.
- **Recurrente:** lo que se repite cada semana se marca `recurrente`, no como quincena.

---

## Paso 5 — Proyectos

Por cada proyecto:

```markdown
### PROYECTO [N] — [Nombre]
**Resultado clave que habilita:** [número concreto]
**Responsable:** [persona]
**Cómo se sabe que se logró:** [criterio]

| Tarea | Responsable | Quincena |
|-------|-------|--------|
| [tarea 1] | [nombre] | Q1 |
| [tarea 2] | [nombre] | Q2 |
| [tarea que se repite] | [nombre] | recurrente |
```

- Si trabaja sola: máximo 3 o 4 proyectos en el mes. Con equipo: hasta 6. Más de 8, junta o mueve al mes siguiente.
- Asigna solo a personas que existen. Tarea sin responsable posible: `Sin asignar — definir antes de arrancar Q1`.
- Agrupa la grabación en uno o dos días fijos por semana y no la mezcles con días de lanzamiento.
- «Explorar X» o «posibilidad de Y» no son tareas: conviértelas en «Reunión sobre X el [fecha]» o sácalas del mes.

---

## Paso 6 — Resumen para compartir

```markdown
## Plan de [Mes]
**Período:** [inicio] — [fin]
**Objetivos del mes:**
1. [Objetivo] → Resultado clave: [número]
2. [Objetivo] → Resultado clave: [número]

**Proyectos:**
1. [Nombre] — Responsable: [persona] — Arranca: Q1
2. [Nombre] — Responsable: [persona] — Arranca: Q2

**Dependencias críticas (no mover sin resolver):**
- [tarea A] antes de [tarea B]

**Decisiones pendientes antes del día 5:**
- [lo que la dueña del negocio tiene que decidir para desbloquear lo demás]
```

---

## Paso 7 — Entrega

Guarda el plan en Markdown:

```
~/Documents/mi-contenido/planificacion/plan-[mes]-[año].md
```

Si lo piden como documento visual, genera además un HTML autocontenido con el mismo nombre: encabezado con mes y objetivos, una sección por proyecto con su tabla (color por quincena: Q1 azul, Q2 morado, recurrente verde) y un pie con dependencias y decisiones pendientes. Usa los colores de la persona si los conoces.

Ofrece el plan en el formato de la herramienta que usa (tabla para hoja de cálculo, lista para Notion o Trello).

---

## Notas

- Un plan ejecutado al 80 % le gana a un plan perfecto sin ejecutar.
- Si alguien del equipo ya está al tope, dilo antes de asignarle más.
