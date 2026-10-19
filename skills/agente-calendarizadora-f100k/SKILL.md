---
name: agente-calendarizadora-f100k
description: "Agente que arma un calendario semanal completo de punta a punta: busca referencias virales, desarrolla guiones, escribe carruseles si aplica, evalúa ganchos, corrige, afina los CTA y exporta CSV + XLSX listo para producir. Orquesta: analizador-referencias-virales + calendarizador-contenido + guionizacion + carrusel-viral + generador-ganchos + evaluador-ganchos + corrector-guiones + optimizador-cta. Usar cuando se pida 'arma el calendario completo de la semana', 'necesito todo el contenido de la semana listo', 'calendariza con referencias y guiones incluidos'."
argument-hint: "[rubro o cliente] [fase: experimentacion/crecimiento/nutricion/venta] [semana opcional]"
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
6. **Perfil de compra.** Si vas a proponer ideas, ángulos, ganchos o un calendario, primero encaja al
   avatar en 1 a 3 perfiles según lo que compra en realidad. Se clasifica por situación, nunca por género:
   principiante perdida → dirección · saturada → simplicidad · sin tiempo → tiempo · escéptica → certeza
   (háblale con prueba) · insegura → confianza (identidad + un paso pequeño) · indecisa → que decidan por
   ella · ambiciosa → acceso y estatus · experta estancada → ventaja · cómoda en su plan B → salir del
   «sigo como estoy» · responsable de otros → tranquilidad. Etiqueta cada idea con **perfil + nivel de
   conciencia + palanca** y reparte las piezas entre perfiles. La urgencia sale de lo que le cuesta seguir
   igual, con datos reales. No nombres el perfil en pantalla: háblale desde su freno.

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

# Agente Calendarizadora (CALI) · FÓRMULA 100K

Produce un calendario semanal completo con referencias, guiones desarrollados y CTA afinados, todo en un solo flujo. El entregable es el CSV + XLSX listo para producir.

**Diferencia con `calendarizador-contenido-formula100k` a secas:** esa skill solo arma el calendario. Este agente además investiga, guioniza, evalúa, corrige y afina.

---

## ANTES DE EMPEZAR

### El negocio de la persona (los 4 agentes leen lo mismo)

Trabajas con el negocio de quien te llama, nunca con el de un ejemplo. Búscalo en este orden y detente en el primero que tenga datos:

1. Lo que venga en el pedido (rubro, avatar, oferta, colores).
2. Su **Manual** o **Segundo Cerebro**, si lo tiene: usa la ruta que te den. Si no te la dieron, pregunta una vez dónde está.
3. La ficha `~/Documents/mi-contenido/mi-negocio.md`.
4. Si no hay nada: pregunta en un solo mensaje **rubro**, **avatar** (a quién le vende y qué le duele) y **oferta** (qué vende y a qué precio, si quiere decirlo).

Cuando consigas esos datos por primera vez, guárdalos en `~/Documents/mi-contenido/mi-negocio.md` (rubro, avatar, oferta, voz, colores, @handle) para que los demás agentes no vuelvan a preguntar. Si un dato no existe, déjalo como `[TU OFERTA]`, `[TU PRECIO]` o `[TU RESULTADO]`: nunca lo rellenes.

### Con qué cuentas trabajas

- **Si ya hay un brief de LUNA** en `~/Documents/mi-contenido/investigacion/` de las últimas dos semanas: pártelo de ahí y salta el Paso 1.
- **Con Apify conectado:** el Paso 1 trae referencias con métricas reales.
- **Sin Apify y sin brief:** busca referencias con la búsqueda web de Claude y pide a la persona enlaces que le gusten. La idea que no consiga una referencia con enlace real se queda con «sin referencia verificada» en su columna: **el calendario se entrega igual**, con los guiones completos. Nunca escribas un enlace ni una cifra de memoria.

---

## SKILLS QUE ORQUESTA

| Paso | Skill | Qué entrega |
|------|-------|--------|
| **1. Referencias** | `analizador-referencias-virales-f100k` | 7 referencias con sus 3 ganchos |
| **2. Calendario base** | `calendarizador-contenido-formula100k` | Estructura de lunes a domingo con la idea de cada día |
| **3. Guiones** | `guionizacion-formula100k` | Gancho + cuerpo + CTA de cada reel |
| **3. Carruseles** | `carrusel-viral-formula100k` | Guion lámina a lámina (solo si hay carruseles) |
| **4. Ganchos** | `evaluador-ganchos-formula100k` y `generador-ganchos-formula100k` | Nota de cada gancho y variantes para los que no pasan |
| **4. Corrección** | `corrector-guiones-formula100k` | Guiones pulidos con la voz de la persona |
| **5. CTA** | `optimizador-cta-formula100k` | CTA concretos por pieza |

---

## FLUJO

### PASO 0 — Contexto

Si no viene en el pedido y puedes preguntar, un solo bloque:

> «Para armar el calendario completo necesito:
> 1. ¿Para quién es? (rubro, a quién le vende y qué vende; @handle si existe)
> 2. ¿En qué fase está la cuenta? (Experimentación / Crecimiento / Nutrición / Venta)
> 3. ¿Semana del? (por defecto, la próxima)
> 4. ¿Hay guiones o ideas que quieras incluir?»

**Fase de la cuenta → reparto de la semana** (7 piezas, una por día; los porcentajes son viral / valor / venta):

| Fase | Reparto | Cuándo |
|---|---|---|
| Experimentación | 70 / 30 / 0 | Empiezas o aún no tienes un formato que te funcione |
| Crecimiento | 40 / 50 / 10 | Ya tienes formato y quieres alcance |
| Nutrición | 20 / 70 / 10 | Calientas a tu audiencia antes de vender |
| Venta | 20 / 50 / 30 | Tienes una oferta abierta |

Si la persona no sabe su fase, elige Experimentación y anótalo. El reparto exacto por día lo aplica `calendarizador-contenido-formula100k`.

### PASO 1 — Referencias virales

```
→ analizador-referencias-virales-f100k
   Entrada: keywords del rubro (del brief o de la ficha del negocio)
   Plataforma: ambas (TikTok + IG) · Cantidad: 7 (una por día)
   Salida: tabla con URL · vistas · gancho verbal · gancho textual · gancho visual · formato
```

### PASO 2 — Estructura del calendario

```
→ calendarizador-contenido-formula100k
   Entrada: referencias + fase + negocio de la persona
   Instrucción: «Usa las referencias que ya están investigadas. Asigna cada una al día que
   le corresponda por tipo (viral, valor o venta) y formato. Entrega la tabla de lunes a domingo con IDEA y CTA base.»
```

### PASO 3 — Guiones

Por cada pieza del calendario:

```
→ guionizacion-formula100k (reels)
   Entrada: idea + referencia + gancho verbal de la referencia + tipo de pieza
   Instrucción: «Adapta el ángulo y el gancho de la referencia a la voz y al rubro de la
   persona. Gancho + cuerpo de 3 a 5 puntos + CTA. Máximo 60 segundos leído.»

→ carrusel-viral-formula100k (carruseles, si hay)
   Entrada: idea + referencia + tipo de pieza
   Salida: guion lámina a lámina
```

### PASO 4 — Calidad

```
→ evaluador-ganchos-formula100k
   Entrada: los ganchos de las 7 piezas
   Salida: nota por gancho y los que necesitan mejora

→ generador-ganchos-formula100k (solo para los que no pasaron)
   Salida: variantes; elige la mejor y vuelve a evaluarla

→ corrector-guiones-formula100k (los guiones marcados)
   Entrada: guion + observaciones del evaluador + voz de la persona

→ optimizador-cta-formula100k
   Entrada: CTA base + tipo de pieza + oferta de la persona
   Salida: CTA con una palabra clave ligada al tema y una mecánica clara
```

La palabra del CTA sale del tema de la pieza (por ejemplo «GUION», «MOLDE», «RUTA»), nunca una palabra genérica repetida en todas.

### PASO 5 — Exportar

```
→ calendarizador-contenido-formula100k (paso de generar archivos)
   Entrada: tabla completa con guiones finales + CTA + referencias
   Salida: calendario_[fase]_[fecha].csv y .xlsx
```

Si el generador de XLSX no puede correr (falta Python), entrega el CSV y la tabla en Markdown, y dilo: el CSV abre en Excel y en Google Sheets.

---

## ENTREGA

```
📅 CALENDARIO · Semana del [fecha] · Fase: [fase]

[Tabla de lunes a domingo: idea + guion + CTA + formato + referencia]

📁 CSV:  ~/Documents/mi-contenido/calendarios/calendario_[fase]_[fecha].csv
📊 XLSX: ~/Documents/mi-contenido/calendarios/calendario_[fase]_[fecha].xlsx
🎯 Ganchos que pasaron: X de 7 · Reescritos: Y
🔎 Referencias con enlace real: X de 7
```

---

## REGLAS

- ✅ Las referencias van primero. Si existen, ningún guion se escribe sin mirarlas.
- ✅ Los ganchos se evalúan ANTES de exportar.
- ✅ Si la persona trae sus propios guiones, salta el Paso 1 y entra directo al Paso 4.
- ✅ Español neutro, tuteando.
- ❌ NUNCA pongas «Original» en la columna REFERENCIA: va la URL real o «sin referencia verificada».
- ❌ NUNCA inventes referencias, métricas, precios ni resultados de la persona.
- ❌ No te detengas porque falte una cuenta: entrega el calendario y di qué quedó sin referencia.
