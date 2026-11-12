---
name: generador-ganchos-formula100k
description: "Genera variantes de gancho, las produce como clip y las rankea con el Virality Predictor. Usar con «genera un gancho», «propón ganchos para este guion», «dame 3 opciones de primer segundo». NO para evaluar un gancho ya hecho (evaluador-ganchos-formula100k)."
argument-hint: [guion o URL/referencia | número de variantes]
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

# Generador de Ganchos · FÓRMULA 100K

Lab pre-grabación: diseña N variantes de gancho (composición + texto), las produce como clip AI, las pasa por el Virality Predictor de Higgsfield y entrega la ganadora con brief de producción.

## Cuándo se activa

- El usuario tiene un guion listo y quiere optimizar el primer segundo antes de grabar
- El usuario encuentra un reel viral y quiere 3 versiones adaptadas a su nicho/estilo
- Una alumna no sabe qué hook usar para un video que va a grabar hoy
- Se quiere comparar 2-4 hipótesis de Forma Visual para el mismo contenido

## Relación con otras skills

- **Entrada típica:** output de `guionizacion-formula100k` (guion completo)
- **Salida típica:** brief que el usuario graba; opcionalmente el video final se pasa por `evaluador-ganchos-formula100k` para validar post-grabación
- **NO confundir con** `evaluador-ganchos-formula100k` — esa juzga un gancho YA grabado; esta GENERA opciones nuevas
- **NO confundir con** `carrusel-viral-formula100k` — esa es para slides estáticos de carrusel

## Contexto crítico

**Usuario:** creador/a de contenido hispano (tú o tu clienta). Audiencia hispana. Español neutro obligatorio (NO voseo: usa "tú", "tienes", "puedes", "haz" — nunca "vos", "tenés", "podés", "hacé").

**Material de referencia (cargar siempre):**
- `criterios.md` — reglas de diversificación de variantes + composición visual + estructuras de texto
- `moldes-gancho.md` — banco de 15 moldes de gancho textual (rotación, NO ranking) del estudio 1000 Ganchos
- `output-template.md` — formato del reporte LAB con ranking y brief de ganadora

**Frameworks heredados de FÓRMULA 100K:**
- Sistema E.N.C. (Estímulo Núcleo, Nivel de Carga Cognitiva, Contextualización)
- 5 Formas Visuales (F1-F5)
- 15 Gatillos de Viralidad
- 4 estructuras de copy: Curiosidad / Dolor / Resultado / Susurro
- Test del 1 Segundo

Si necesitas detalles de un framework, consulta `criterios.md` de la skill `evaluador-ganchos-formula100k` (está en la carpeta hermana `../evaluador-ganchos-formula100k/`, junto a la de esta skill).

**Output siempre va a:** `~/Documents/mi-contenido/lab-ganchos/YYYY-MM-DD_tema/`

## Flujo paso a paso

### Paso 1: Recibir input

El input llega de 2 formas:

**Modo A — Guion existente:**
> "Genera ganchos para este guion: [pega guion]"
> "Tengo este guion, dame 3 opciones de primer segundo"

**Modo B — Referencia viral:**
> "Adapta este reel viral a mi estilo: [URL]"
> "Convierte este TikTok en gancho mío para mi nicho de X"

Si NO hay input claro, pide UNA cosa específica:
> "Pásame el guion completo o el URL del reel de referencia, y dime el tema/nicho del video si no está claro."

Si hay input pero falta el **nicho/avatar/promesa del video**, haz UNA pregunta:
> "¿Cuál es la promesa concreta del video y a quién va dirigido? Eso define qué Forma Visual conviene priorizar."

### Paso 2: Definir el número de variantes

Pregunta UNA vez al inicio (a menos que el usuario ya lo haya especificado):
> "¿Cuántas variantes quieres testear? Recomiendo 3 (cubre F1, F4 y F2 — tres hipótesis muy distintas). Mínimo 2, máximo 4."

Default si no contesta: **3 variantes**.

### Paso 3: Generar N hipótesis de hook diversificadas

Carga `criterios.md` y sigue las reglas de diversificación. Cada variante DEBE tener:

1. **Forma Visual asignada** (F1-F5) — usar Formas distintas entre variantes para diversificar hipótesis. Ej con 3 variantes: F1 (sujeto+texto), F4 (imagen viral/simbólica), F2 (acción simbólica). NO repetir Forma entre variantes.
2. **Composición visual del primer cuadro** descrita con precisión:
   - Sujeto principal (qué/quién, gesto, expresión)
   - Posición en el cuadro (regla de tercios, centro, etc.)
   - Fondo (limpio, contextual, sorpresivo)
   - Paleta de color dominante
   - Elementos secundarios (máx 2 — flecha, prop, rótulo)
3. **Gancho textual** ≤ 8 palabras, asignando una de las 4 estructuras:
   - **A — Curiosidad** ("Lo que nadie te dijo de X")
   - **B — Dolor** ("Por qué tu X no funciona")
   - **C — Resultado** ("Cómo pasé de 0 a Y en Z")
   - **D — Susurro** ("Hazlo así (nadie habla de esto)")
   - Diversificar estructuras entre variantes cuando sea posible
4. **Molde de gancho** — carga `moldes-gancho.md` y asigna a cada variante un molde DISTINTO del banco de 15 (la forma sintáctica con la que abre la línea). El molde es ortogonal a la estructura de copy: se combinan (ej. molde 08 + estructura C).
   - **Se elige por ajuste al tema, NUNCA por rendimiento.** El banco está ordenado por frecuencia de aparición, no por resultados: ningún molde rinde más que otro de forma defendible. Si razonas "este molde funciona mejor", estás inventando.
   - No repetir molde entre variantes, ni con el video anterior del mismo usuario.
   - Si el molde no cabe en 8 palabras, córtalo — el ≤ 8 manda.
5. **Gatillos activados** (3-5 de los 15) con justificación 1 línea cada uno
6. **Hipótesis 1 línea** del por qué esta variante puede ganar

Comunicación al usuario en este paso:
> "Diseñando 3 variantes diversificadas: F1+Curiosidad+molde 03 (condicional), F4+Dolor+molde 14 (no es X es Y), F2+Susurro+molde 13 (instrucción-hábito)"

### Paso 4: Producir clip de test por variante

Para CADA variante, ejecuta en paralelo cuando sea posible:

**4.1 — Generar imagen estática (primer cuadro)**

Usa `mcp__higgsfield__generate_image` con `nano_banana_2`:
- Prompt: descripción detallada de la composición visual (Paso 3.2) + texto del gancho integrado en pantalla + estilo "Instagram reel first frame, 9:16, high contrast"
- Aspecto: 9:16 (vertical reel)
- Calidad: 2K mínimo
- Si el usuario está en una variante con su rostro, usa sus fotos reales como referencia, no una cara generada desde cero

**4.2 — Animar imagen a clip de 3s**

Usa `mcp__higgsfield__generate_video` con `seedance_2_0`:
- Input: la imagen generada en 4.1 como first frame
- Duración: 3-4 segundos (suficiente para que el Predictor lea hook strength y retention temprana)
- Movement: sutil — micro-zoom-in, ligero parallax, o gesto del sujeto si aplica. El Predictor mide composición + pacing, no efectos pirotécnicos.
- Aspecto: 9:16

**4.3 — Confirmar el media_id del clip**

Cuando el video termina, guarda su `job_id` (que sirve como id para el Predictor — el tool acepta tanto media_id confirmado como job_id de video generado).

### Paso 5: Lanzar Virality Predictor en paralelo

Para cada variante, ejecuta:

```
mcp__higgsfield__virality_predictor
action: "create"
params:
  model: "virality_predictor"
  medias: [{ role: "video", id: "<job_id de la variante>" }]
```

Guarda el `job_id` que devuelve el predictor por cada variante. Estos sirven para `action: "preview"` después.

**Lanza las N llamadas al predictor en paralelo, no en serie** — son independientes.

### Paso 6: Leer resultados y rankear

Para cada variante, extrae del dashboard:
- **Hook Strength** (peso 35%)
- **Creative Performance** (peso 25%)
- **Retention Risk** invertido (peso 20% — menor riesgo = más puntos)
- **Engagement** (peso 12%)
- **Attention** (peso 8%)

Calcula **score ponderado** sobre 100 por variante. Rankea de mayor a menor.

**Reglas de desempate:**
- Si dos variantes empatan dentro de 3 pts → gana la que tenga mejor Hook Strength (es lo único que importa en el primer segundo).
- Si una variante tiene Retention Risk alto en los primeros 3s aunque su Hook Strength sea alto → bajarla un rank (el hook engancha pero pierde).

**Si el Predictor falla en ≥1 variante:**
- Reporta cuáles fallaron, intenta UNA segunda vez
- Si vuelve a fallar, entrega ranking parcial con disclaimer y procede

### Paso 7: Generar reporte LAB y entregar ganadora

Sigue EXACTAMENTE `output-template.md`. El reporte debe incluir:

1. Resumen ejecutivo (1 párrafo)
2. Ganadora con: composición detallada + texto + brief de producción para grabar en real
3. Comparativa de todas las variantes con scores
4. Links a los dashboards de cada variante en Higgsfield
5. Siguiente paso concreto (qué grabar y cómo)

**Guarda todos los artefactos:**
- `LAB.md` → reporte completo
- `variant-1.png` ... `variant-N.png` → imágenes generadas (descarga desde Higgsfield)
- `variant-1.mp4` ... `variant-N.mp4` → clips de test (descarga desde Higgsfield)
- `predictor-jobs.json` → mapping de variante → job_id del predictor (para reabrir dashboards después)

Carpeta destino: `~/Documents/mi-contenido/lab-ganchos/YYYY-MM-DD_<slug-del-tema>/`

### Paso 8: Cerrar con call-to-action

Termina con UNA acción concreta:
> "Graba la variante ganadora siguiendo el brief. Cuando tengas el .mp4 final, pásalo por evaluador-ganchos-formula100k para validar el resultado vs el predictor."

## Reglas anti-error

- **NO uses voseo argentino.** Español neutro siempre. Aplica al texto del gancho Y a la conversación con el usuario.
- **NO repitas la misma Forma Visual en dos variantes** salvo que el usuario lo pida explícitamente. El valor de testear N variantes es cubrir hipótesis distintas.
- **NO uses imágenes de bancos de stock** (Shutterstock, Getty, Unsplash, Pexels, Pixabay, etc.). La imagen base se genera con Nanobanana o sale de las fotos reales del usuario.
- **NO inventes los scores del Predictor.** Si una corrida falla, dilo. No rellenes con números.
- **NO entregues una sola variante.** Mínimo 2. Si solo hay presupuesto/tiempo para 1, esto no es el lab — usa la skill `evaluador-ganchos-formula100k` directamente.
- **NO generes la cara del usuario desde cero.** Si una variante necesita su rostro, parte de sus fotos reales como referencia en `generate_image`.
- **NO ejecutes en serie las llamadas al Predictor.** Lanza las N en paralelo.
- **NO bloquees todo el flujo si una variante falla.** Reintenta una vez; si falla de nuevo, entrega ranking parcial.
- **NO sobreescribas el veredicto del Predictor con tu opinión.** Si la variante ganadora por score es la que "menos te gusta", entrega la ganadora igual con disclaimer si hace falta. El usuario decide al final.
- **El nombre/handle del usuario en cualquier overlay textual:** el handle EXACTO que dio el usuario. Nunca lo inventes ni lo deduzcas del nombre: pregúntalo una vez y reúsalo.
- **NO rankees los moldes de gancho.** El banco de `moldes-gancho.md` está ordenado por frecuencia, no por rendimiento; ninguna familia sobrevive corrección por comparaciones múltiples. Elegir "el molde que más rinde" es inventar data.

## Casos especiales

- **Guion muy largo (>1 página):** extrae solo la promesa central y la primera frase del guion para usar como base; no necesitas leer todo el guion para diseñar el gancho.
- **Referencia viral en idioma distinto al español:** tradúcela mentalmente al español neutro y diseña los textos en español. El video AI puede ser en cualquier idioma pero el texto en pantalla debe ser español neutro.
- **Tema sensible (salud, finanzas, legal):** las variantes deben evitar promesas absolutas. El gancho puede generar curiosidad sin prometer resultados exactos.
- **el usuario pide una variante específica además de las AI:** acéptala como variante adicional. Genera su clip, pásalo por el predictor, inclúyela en el ranking.

## Comunicación durante el proceso

Comunica brevemente cada milestone:
1. "Diseñando N variantes diversificadas: [Forma1+Estructura1], [Forma2+Estructura2], ..."
2. "Generando imágenes base con Nanobanana"
3. "Animando con Seedance"
4. "Lanzando Virality Predictor para las N variantes en paralelo"
5. "Resultados recibidos — calculando ranking ponderado"
6. (Entregar reporte LAB)

## Output del proceso

El último mensaje al usuario debe contener:
- El reporte LAB completo en el chat (formato del template)
- Mención de la ruta donde quedaron guardados los .png, .mp4 y el LAB.md
- Links a los dashboards del Predictor por variante (Higgsfield URLs)
- Un único call-to-action: grabar la ganadora.
