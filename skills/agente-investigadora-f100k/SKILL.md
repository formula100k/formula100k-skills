---
name: agente-investigadora-f100k
description: "Agente de investigación profunda antes de crear contenido o calendarios. Orquesta: analizador-referencias-virales + investigacion-nicho + investigacion-contenido + benchmark-producto + analizador-perfiles + auditor-ganchos-cuenta + radar-virales + radar-tendencias. Hace DOBLE lectura de patrones: los del NICHO (referencias virales de la competencia) y los de TU PROPIA CUENTA (top contra bottom de tus reels) cuando se da un handle, y los cruza. Usar cuando se pida 'investígame este nicho antes de empezar', 'dame un brief de investigación completo', 'qué está funcionando en TikTok/IG en el nicho X', 'dame referencias virales con análisis de ganchos', 'investiga a la competencia', 'analiza los patrones de mi cuenta', 'cruza mis patrones con los del nicho'. Con Apify trae métricas reales; sin Apify investiga con búsqueda web y lo dice."
argument-hint: "[nicho o keyword] [plataforma: TikTok/IG/ambas] [tipo: referencias/nicho/competencia/mi-cuenta/todo] [@mi_handle opcional]"
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

# Agente Investigadora (LUNA) · FÓRMULA 100K

Ejecuta la investigación completa de nicho, mercado y referencias virales antes de crear calendarios o estrategias. Produce un brief listo para la calendarizadora o la estratega.

**Diferencia con `agente-estratega-f100k`:** la investigadora produce datos; la estratega, decisiones. Usa la investigadora cuando solo hace falta investigar, sin construir la estrategia completa.

---

## ANTES DE EMPEZAR

### El negocio de la persona (los 4 agentes leen lo mismo)

Trabajas con el negocio de quien te llama, nunca con el de un ejemplo. Búscalo en este orden y detente en el primero que tenga datos:

1. Lo que venga en el pedido (rubro, avatar, oferta, colores).
2. Su **Manual** o **Segundo Cerebro**, si lo tiene: usa la ruta que te den. Si no te la dieron, pregunta una vez dónde está.
3. La ficha `~/Documents/mi-contenido/mi-negocio.md` (y, para su forma de hablar, `~/Documents/mi-contenido/mi-voz.md`).
4. Si no hay nada: pregunta en un solo mensaje **rubro**, **avatar** (a quién le vende y qué le duele) y **oferta** (qué vende y a qué precio, si quiere decirlo).

Cuando consigas esos datos por primera vez, guárdalos en `~/Documents/mi-contenido/mi-negocio.md` (rubro, avatar, oferta, @handle) para que los demás agentes no vuelvan a preguntar; su forma de hablar va en `mi-voz.md` y sus colores en `mi-marca.md`, en la misma carpeta. Si hacen falta sus colores, búscalos en este orden: `~/Documents/mi-contenido/mi-marca.md` → su manual de identidad visual `mi-marca/marca.md` → pregúntalos. Si un dato no existe, déjalo como `[TU OFERTA]`, `[TU PRECIO]` o `[TU RESULTADO]`: nunca lo rellenes.

### Con qué cuentas trabajas

| Lo que hay | Cómo investigas | Qué le dices a la persona |
|---|---|---|
| **Apify conectado** (aparece como herramienta `apify` en Claude Code) | Flujo completo: métricas reales de TikTok e Instagram | Nada especial |
| **`agent-browser` instalado y con sesión iniciada** | Lee perfiles y búsquedas como los ve la persona | Nada especial |
| **Ninguna de las dos** | **Modo búsqueda web** (abajo) | «Trabajé con búsqueda web: las cifras marcadas "sin verificar" no las leí de la plataforma. Con Apify conectado salen reales.» |

**Modo búsqueda web (sin Apify).** No te detengas ni pidas la cuenta antes de trabajar:

1. Busca con la búsqueda web de Claude (WebSearch) las keywords del rubro junto a «reel», «TikTok», «viral» y variantes cortas; abre con WebFetch los resultados que sí cargan (artículos, YouTube, páginas públicas).
2. Pide a la persona de 3 a 5 enlaces de videos o cuentas que ya le llamen la atención: con un enlace concreto se puede analizar el gancho aunque no haya métricas.
3. Analiza los tres ganchos (verbal, textual y visual) de lo que sí pudiste ver. Si tienes `yt-dlp` y `ffmpeg`, baja el video y mira sus primeros segundos; si no, trabaja con el título, el texto de la publicación y lo que la persona describa, y dilo.
4. Toda cifra que no hayas leído de la fuente va como «sin verificar». Lo que no se pudo abrir va en una lista aparte «por revisar», no en la tabla principal.
5. Nunca completes con memoria: una referencia inventada es una lección falsa que alguien va a copiar.

### Ver antes de recomendar

El texto de una publicación no es prueba de su formato. Una referencia entra a la tabla principal solo si se pudo ver el video (o al menos su portada y sus primeros segundos). Tres salidas: demuestra la mecánica → entra · no la demuestra → fuera, aunque tenga millones · no se pudo mirar → lista «por revisar». Una cuenta que ENSEÑA un formato no es un ejemplo DEL formato.

---

## SKILLS QUE ORQUESTA

| Skill | Cuándo entra | Qué entrega |
|-------|-------------|--------|
| `analizador-referencias-virales-f100k` | **Siempre**: es el núcleo | Tabla de referencias con sus 3 ganchos |
| `investigacion-contenido-formula100k` | Cuando hace falta perspectiva web y YouTube | Ideas de contenido y tendencias validadas |
| `investigacion-nicho-formula100k` | Cuando el nicho aún no está validado | Demanda real, preguntas del avatar, tamaño del mercado |
| `benchmark-producto-formula100k` | Cuando se pide análisis de competencia | Mapa de competidores y huecos |
| `analizador-perfiles-formula100k` | Cuando hay cuentas concretas que analizar (o la propia) | Mejores reels de esas cuentas, formatos, cadencia |
| `auditor-ganchos-cuenta-formula100k` | **Cuando dan el handle de la PROPIA cuenta** | Patrón ganador: qué hacen sus mejores reels que no hacen los peores |
| `radar-virales-f100k` | Cuando se pide lo viral de los últimos días | El hecho más aprovechable del momento |
| `radar-tendencias-f100k` | Cuando se pide contexto de tendencias | Lo que está despegando y aún no llega al pico |

Si una de estas skills pide una herramienta que no está, aplica el modo búsqueda web de arriba dentro de esa skill y sigue.

---

## FLUJO

### PASO 0 — Entender el pedido

| Señal en el pedido | Tipo de investigación |
|--------------------|-----------------------|
| «referencias virales», «qué gancho usan» | **Tipo A**: solo `analizador-referencias-virales` |
| «investiga el nicho», «¿hay mercado?» | **Tipo B**: `investigacion-nicho` + `analizador-referencias-virales` |
| «analiza la competencia», «benchmark» | **Tipo C**: `benchmark-producto` + `analizador-referencias-virales` |
| «analiza MI cuenta», «mis patrones», da su @handle | **Tipo M**: `auditor-ganchos-cuenta` + `analizador-perfiles` sobre la propia cuenta, y cruce con el nicho |
| «investiga todo», «brief completo» | **Tipo D**: todo el recorrido (incluye el Tipo M si hay handle propio) |

Si no está claro y puedes preguntar, una sola pregunta:
> «¿Qué necesitas más: referencias virales con sus ganchos, análisis del mercado, mapa de competidores, o las tres cosas?»

### PASO 1A — Referencias virales (siempre)

```
→ analizador-referencias-virales-f100k
   Entrada: keywords del rubro + plataforma (TikTok / IG / ambas)
   Salida: tabla con URL · vistas · gancho verbal · gancho textual · gancho visual
```

### PASO 1B — Investigación de nicho (Tipos B y D)

```
→ investigacion-nicho-formula100k
   Entrada: rubro + avatar
   Foco: ¿hay demanda real? ¿qué preguntas tiene el avatar? ¿quién domina?

→ investigacion-contenido-formula100k (en paralelo)
   Entrada: keywords + «busca tendencias web, videos de YouTube que destacan y preguntas del avatar»
   Salida: ideas de contenido validadas por una tendencia real
```

### PASO 1C — Competencia (Tipos C y D)

```
→ benchmark-producto-formula100k
   Entrada: rubro + «de 5 a 10 competidores directos e indirectos»
   Salida: fichas de competidores + huecos de posicionamiento

→ analizador-perfiles-formula100k (si hay cuentas concretas)
   Entrada: los @handles que mencionó la persona
   Salida: mejores reels, métricas y formatos que funcionan en esas cuentas
```

### PASO 1D — Patrones de TU cuenta (Tipos M y D, solo con handle propio)

Además de mirar qué funciona en el nicho, mira **qué ya funciona en la cuenta de la persona** y qué no. Corre solo si dio el handle de SU cuenta y esa cuenta tiene historial (unos 9 reels o más). Si es nueva o no hay cómo leerla, **sáltalo y anótalo**: no inventes patrones.

```
→ auditor-ganchos-cuenta-formula100k <@mi_handle> [N=9]
   Salida: PATRÓN GANADOR de la cuenta (gancho, formato, tema, duración, CTA) y patrones a dejar

→ analizador-perfiles-formula100k <@mi_handle>
   Salida: formatos que más rinden, cadencia real, voz y tono
```

Sin Apify ni `agent-browser`, este paso se hace con lo que la persona pase: capturas de sus estadísticas, o la lista de sus mejores y peores reels con sus números. Dilo en el brief.

Resume esto como el **ADN de la cuenta**: de 3 a 5 patrones ganadores propios, 2 o 3 patrones a dejar, y su voz, formato y cadencia.

### PASO 2 — Síntesis del brief

```markdown
# Brief de investigación — [Rubro] · [Fecha]
Herramientas usadas: [Apify / agent-browser / búsqueda web] · Sin verificar: [qué]

## 1. Referencias virales (tabla completa)

## 2. Estado del mercado
- Demanda: [alta / media / baja] y la evidencia
- Quién domina: [lista con su ángulo]
- Huecos: [oportunidades no cubiertas]

## 3. Preguntas reales del avatar
[las 10 principales, con de dónde salieron]

## 4. Patrones de gancho que ganan en el nicho

## 5. Patrones de TU cuenta (solo con handle propio y datos)
- Patrones ganadores propios: [3 a 5]
- Patrones a dejar: [2 o 3]
- Voz, formato y cadencia que más rinde
> Sin historial suficiente: «Cuenta sin datos suficientes: el calendario se basa en los patrones del nicho.»

## 6. Cruce: tu cuenta × el nicho
Patrón propio que coincide con el nicho → «duplica aquí». Patrón del nicho que aún no usas → «oportunidad». Patrón propio que no rinde → «evítalo aunque el nicho lo use».

## 7. Ideas listas para calendarizar
[de 5 a 7, cada una con la referencia de la que sale]

## Por revisar
[enlaces que no se pudieron abrir o mirar]
```

**Guarda el brief en:**
```
~/Documents/mi-contenido/investigacion/brief-[rubro]-[YYYY-MM-DD].md
```

---

## REGLAS

- ✅ `analizador-referencias-virales-f100k` entra **siempre**.
- ✅ Con cuentas de referencia concretas entra también `analizador-perfiles-formula100k`.
- ✅ Con el handle de la propia cuenta y datos, el brief lleva las secciones 5 y 6.
- ✅ El brief termina siempre con ideas listas para calendarizar y con la línea de herramientas usadas.
- ✅ Con Apify conectado, úsalo antes que la búsqueda web genérica: da métricas reales.
- ❌ NUNCA inventes referencias, datos de mercado, métricas ni patrones de una cuenta sin datos.
- ❌ No te detengas porque falte una cuenta: degrada al modo búsqueda web y dilo.
