---
name: benchmark-producto-formula100k
description: "Benchmark de producto/competencia profundo en cualquier nicho (cursos, comunidades Skool, coaching, SaaS, productos físicos). Activar SIEMPRE que se pida 'benchmark de producto', 'análisis de competencia', 'investiga a mi competencia', 'estudia el mercado de X', 'comparativa de competidores', 'mapeo competitivo', 'investigación de mercado', 'qué ofrecen otros en mi nicho', 'espía a mi competencia', 'qué gaps tiene mi nicho'. Stack de 4 motores juntos: Tavily (discovery web) + Supadata (landings públicas) + Apify (reviews/ads/Skool con auth) + agent-browser (permanente, no fallback) para sitios con login, anti-bot, Skool privadas, IG/TikTok del competidor y screenshots. Genera reporte con resumen ejecutivo, mapa competitivo, fichas del top 10, patrones, oportunidades y plan 30/60/90. NO usar para auditar UNA comunidad del cliente (auditor-formula100k), UN perfil (analizador-perfiles-formula100k) ni contenido viral (investigacion-contenido-formula100k)."
argument-hint: "[nicho o vertical a investigar]"
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

# Skill: Benchmark de Producto · FÓRMULA 100K

Skill que ejecuta benchmarks profesionales del mercado para el usuario y sus clientes de F100K. Orquesta múltiples MCPs para mapear competidores, identificar patrones del mercado y devolver oportunidades estratégicas accionables.

**Entregable garantizado:** un reporte **HTML autocontenido navegable** de 15-30 páginas (el documento maestro y entregable principal) + matriz `.csv` + resumen ejecutivo `.md` de 1 página + fichas/oportunidades `.md` para edición rápida, todo guardado en `~/Documents/mi-contenido/benchmarks/YYYY-MM-DD_nicho/`.

> ⚠️ **REPORTE PRINCIPAL = HTML.** El reporte maestro (`01-REPORTE-COMPLETO.html`) DEBE entregarse como archivo HTML autocontenido con Tailwind CDN y un estilo de cuaderno (paleta crema, Caveat para titulares, post-its), o con los colores de la persona si los conoces, navegable con tabla de contenidos sticky. No generar el reporte completo en .md — sólo los archivos secundarios (`00-RESUMEN-EJECUTIVO.md`, `03-FICHAS-COMPETIDORES.md`, `04-OPORTUNIDADES.md`) son markdown. Ver `references/template-reporte-html.md` para el esqueleto exacto.

---

## 🔌 PASO 0 — VERIFICAR HERRAMIENTAS DISPONIBLES

Antes de cualquier acción, verificar qué MCPs están activos. Esto define qué profundidad puede alcanzar el benchmark.

### Stack ideal (todos activos)

| MCP / Skill | Para qué | Cómo verificar |
|-------------|----------|----------------|
| **Tavily MCP** | Discovery, búsquedas web amplias | Buscar `mcp__claude_ai_Tavily__*` en tools disponibles |
| **Supadata MCP** | Scrape de landings públicas (pricing, copy, features) | Buscar `mcp__claude_ai_supadara__*` |
| **Apify MCP** | Reviews (G2/Capterra/Trustpilot), ads (Meta/TikTok), Skool, LinkedIn | Buscar `mcp__apify__*` |
| **agent-browser** | **Motor PERMANENTE.** Sitios con login propio, IG/TikTok del competidor, comunidades Skool con sesión, screenshots fullpage, anti-bot, captura visual de UX | Skill `agent-browser` siempre activable. NUNCA es fallback — entra en PASO 3 por defecto |
| **WebFetch/WebSearch** | Básico, siempre disponibles | Tools nativos |

### Si Apify NO está conectado

Mostrar al usuario:

```
⚠ Apify MCP no está activo. Sin él no puedo:
   - Extraer reviews de G2/Capterra/Trustpilot
   - Espiar ads activos en Meta/TikTok
   - Scrapear comunidades Skool privadas con login

¿Cómo proceder?
A) Activar Apify ahora (5 min, OAuth en https://mcp.apify.com — free tier $5/mes incluido) → benchmark COMPLETO
B) Continuar sin Apify usando solo Tavily + Supadata + agent-browser → benchmark PARCIAL (landings públicas + screenshots)
```

Esperar respuesta. Si A, dar instrucciones de activación. Si B, marcar las dimensiones que quedarán incompletas en el reporte.

---

## 📥 PASO 1 — BRIEFING (INPUTS OBLIGATORIOS)

Pedir todos los inputs antes de arrancar. No improvisar.

### Inputs requeridos

1. **Nicho / vertical** (ej: "Skool comunidades de marketing digital en español", "Coaching de finanzas personales high-ticket", "Cursos de IA para nutricionistas")
2. **Tipo de producto** del cliente (selección):
   - Comunidad Skool
   - Curso digital (Hotmart/Teachable/Kajabi/etc.)
   - Coaching/consultoría high-ticket
   - SaaS / app
   - Producto físico / e-commerce
   - Servicio (agencia / freelance)
3. **Avatar objetivo del cliente** (1 párrafo)
4. **Rango de precio del producto del cliente** (low/mid/high ticket)
5. **Geografía / idioma** (LATAM español, España, US Hispanic, global EN, etc.)
6. **Competidores ya identificados** (si el usuario tiene una lista parcial, partir de ahí)
7. **Profundidad deseada**:
   - **Express** (5 competidores, ~30 min): para validar una hipótesis rápida
   - **Estándar** (10 competidores, ~1 h): default
   - **Deep** (15-20 competidores, ~2 h): para reposicionamiento o lanzamiento mayor

Si falta algún input → preguntar con AskUserQuestion. No avanzar sin las respuestas.

### Resumen y confirmación

```
Voy a hacer benchmark de:
- Nicho: [X]
- Tipo de producto: [X]
- Avatar: [resumen]
- Rango de precio: [X]
- Geografía: [X]
- Profundidad: [X] (N competidores)

¿Procedemos?
```

Esperar sí.

---

## 🔍 PASO 2 — DISCOVERY (Tavily)

Encontrar los competidores. Usar Tavily con múltiples queries paralelas.

### Queries base (adaptar al nicho)

1. `top [tipo producto] [nicho] [geografía] 2026` — para encontrar listicles y rankings
2. `mejores [tipo producto] de [nicho]` — opcional con palabras clave del nicho
3. `[avatar] paying for [nicho] community/course/coaching` — para encontrar dónde está la demanda
4. `[nicho] influencers [geografía]` — porque muchos competidores son creadores con producto
5. `[tipo producto] [nicho] precio mensual / pricing` — para mapear rangos de precio

### Output esperado

Lista de **15-20 candidatos** con:
- Nombre
- URL principal
- 1 línea de descripción
- Fuente donde apareció (para verificar)

### Validación

Antes de pasar a Recopilación, mostrar al usuario los candidatos y dejar que **descarte/agregue** manualmente. Esto evita gastar Apify credits en competidores irrelevantes.

```
Encontré 18 candidatos. Marca cuáles SÍ son competencia directa:
1. [X] Marca A — descripción
2. [X] Marca B — descripción
...
¿Agregas alguno que conozcas y no esté?
```

---

## 📦 PASO 3 — RECOPILACIÓN DE DATOS

Para cada competidor confirmado, ejecutar en paralelo:

### A) Landing pública (Supadata)

```
mcp__claude_ai_supadara__supadata_scrape({url, format: "markdown"})
```

Extraer:
- Headline + subheadline
- Promesa principal
- Vehículo único / metodología (si la nombran)
- Bonos visibles
- Garantía visible
- Pricing (todos los planes y add-ons)
- Testimonios visibles
- CTAs
- Footer / autoridad / quién está detrás

### B) Reviews externas (Apify) — si aplica

Solo para SaaS, cursos en plataformas con reviews públicas o productos con presencia en G2/Trustpilot/Capterra.

```
Actor: zen-studio/software-review-scraper
Input: { product_name, platforms: ["g2","capterra","trustpilot"] }
```

Extraer: rating promedio, # reviews, top 5 pros, top 5 cons.

### C) Ads activos (Apify) — si aplica

```
Actor: aurumworks/facebook-ads-library
Input: { page_name, country, ad_type: "all" }
```

Extraer: # ads activos, formatos predominantes, hook recurrente, CTAs.

### D) Si es comunidad Skool (Apify)

```
Actor: skool-posts-scraper (requiere credenciales)
```

Solo si el cliente tiene acceso de miembro. Sino, saltar y marcar como "interior no visible".

### E) Tech stack (WebFetch a BuiltWith)

```
WebFetch(https://builtwith.com/{competitor-domain}, "Lista el stack tech principal: CMS, e-commerce, analytics, comunidad")
```

### F) agent-browser — SIEMPRE (motor permanente del stack)

agent-browser entra en el PASO 3 por defecto para cada competidor confirmado, no espera a que algo falle. Cubre las zonas donde APIs no llegan:

**Tareas obligatorias por competidor:**
1. **Screenshot fullpage** de la landing principal (para anexar al reporte HTML)
2. **Captura del checkout/pricing page** (a veces los precios están detrás de un toggle JS que Supadata no resuelve)
3. **IG/TikTok del fundador o marca:** top 9 reels con caption + views + formato. Esto NO lo da ninguna API pública.
4. **Comunidad Skool del competidor** (si es público o tienes acceso): tomar screenshots del About + leaderboard + foro destacado
5. **Funnel completo** (si aplica): seguir el flow real desde un ad o link de bio hasta el checkout, capturando cada paso

**Prompt típico:**

```
[agent-browser]

Abre Chrome con sesión existente. Para cada competidor en [lista]:

1. Visita su landing → screenshot fullpage → guardar en /BENCHMARKS/[fecha]/screenshots/[competidor]-landing.png
2. Visita su pricing → screenshot + extrae todos los planes en markdown
3. Visita instagram.com/[handle]/reels/ → top 9 reels con URL+caption+views
4. Si tiene Skool público: visita skool.com/[community] → screenshots del About + leaderboard

OUTPUT: markdown crudo por competidor + carpeta de screenshots.
```

agent-browser captura lo que Apify y Supadata no ven, especialmente:
- Funnels detrás de login propio
- Contenido orgánico del fundador (que es donde vive el "vehículo único" real)
- UX/UI del producto en vivo (para evaluar dimensión Tech stack)

### Almacenamiento

Guardar el raw scraped de cada competidor en:
```
~/Documents/mi-contenido/benchmarks/YYYY-MM-DD_nicho/raw/{competidor}.md
```

---

## 🧠 PASO 4 — ANÁLISIS POR DIMENSIONES

Cargar `references/dimensiones.md` y evaluar cada competidor en las **10 dimensiones**:

1. **Posicionamiento** (vehículo único, promesa, hook)
2. **Pricing** (modelo, rangos, descuentos, ladder)
3. **Mecánica de oferta** (bonos, garantía, urgencia, escasez)
4. **Producto** (estructura, entregables, módulos, tecnología)
5. **Avatar** (a quién le habla, nivel de consciencia)
6. **Marketing** (canales primarios, tipo de contenido, frecuencia)
7. **Social proof** (cantidad y calidad de testimonios, casos, ratings)
8. **Tech stack** (plataforma, integraciones, automatizaciones)
9. **Autoridad / marca personal** (fundador, equipo, presencia)
10. **Comunidad / retención** (engagement, gamificación, eventos)

Cada dimensión se evalúa en escala **0-5** + nota cualitativa.

### Output intermedio: matriz `.xlsx`

Tabla con competidores en filas y dimensiones en columnas. Esta matriz es uno de los entregables.

```
| Competidor | Pos | Price | Oferta | Prod | Avatar | Mkt | Proof | Tech | Marca | Comm | TOTAL |
|------------|-----|-------|--------|------|--------|-----|-------|------|-------|------|-------|
| Marca A    | 5   | 3     | 4      | 5    | 4      | 5   | 5     | 4    | 5     | 3    | 43    |
```

---

## 📈 PASO 5 — PATRONES Y TENDENCIAS

Identificar lo que se REPITE en 3+ competidores. Estas son las tendencias del mercado.

### Categorías de tendencias a buscar

- **De posicionamiento**: ¿qué vehículos únicos están de moda? ¿Qué promesas se repiten?
- **De pricing**: ¿hay un precio "anchor" del mercado? ¿Modelo dominante (mensual/anual/lifetime)?
- **De producto**: ¿qué módulos/entregables son ahora "tabla básica"? ¿Qué se considera bonus?
- **De marketing**: ¿qué canales están dominando? ¿qué tipo de contenido?
- **De tech**: ¿qué plataforma está ganando? ¿Skool / Circle / Kajabi / Hotmart?

### Formato del bloque "Tendencias"

```
TENDENCIA 1: [Nombre corto]
- Qué pasa: [1-2 frases]
- Evidencia: [Marca A, Marca C, Marca F lo hacen]
- Implicación para el cliente: [qué significa esto para su posicionamiento]
```

Mínimo 5 tendencias, idealmente 7-10.

---

## 💎 PASO 6 — OPORTUNIDADES ESTRATÉGICAS

Esta es la sección de MAYOR valor del reporte. Aquí está el "para qué" del benchmark.

### Cómo identificar oportunidades

1. **Gaps de posicionamiento**: ángulos que NADIE está tomando
2. **Gaps de precio**: rangos vacíos en el mercado (ej: todos en $47 o $997, nada en el medio)
3. **Gaps de avatar**: sub-nichos desatendidos
4. **Gaps de producto**: entregables que NADIE incluye y los clientes piden en reviews
5. **Gaps de canal**: plataformas donde la competencia es débil
6. **Gaps de garantía/oferta**: nadie ofrece X que reduciría fricción
7. **Anti-patrones**: cosas que TODOS hacen mal (y el cliente puede hacer diferente)

### Formato del bloque "Oportunidades"

Mínimo 5, máximo 10. Cada una:

```
OPORTUNIDAD #N: [Título accionable]
- Situación actual del mercado: [qué pasa]
- Gap detectado: [qué falta]
- Movimiento sugerido: [qué hacer]
- Esfuerzo: bajo / medio / alto
- Impacto estimado: bajo / medio / alto
- Inspiración: [si hay un competidor de OTRO nicho que sí lo hace bien, citarlo]
```

Ordenar por **Impacto / Esfuerzo** (top primero las de alto impacto y bajo esfuerzo).

---

## 📝 PASO 7 — GENERAR REPORTE FINAL

El reporte principal SIEMPRE se entrega como **HTML autocontenido** (single file, Tailwind via CDN, fuentes Google Fonts). Cargar `references/template-reporte-html.md` para el esqueleto exacto.

### Por qué HTML y no Markdown

- El usuario y sus clientes lo revisan en navegador (doble-click → se abre)
- Permite tablas comparativas con scoring visual, barras de progreso, cards de fichas, navegación sticky
- Renderiza un estilo de cuaderno (paleta crema, Caveat para titulares, post-its, chips) o los colores de la persona
- Es portable: un solo archivo se manda por email/WhatsApp y abre en cualquier laptop

### Estructura del HTML (secciones obligatorias)

1. **Header hero** (negro + amarillo F100K, badge "BENCHMARK", chips de fecha/profundidad/N competidores/score)
2. **Tabla de contenidos sticky** (lado izquierdo en desktop, lista de secciones clickeable)
3. **Resumen ejecutivo** (post-it amarillo con veredicto + 3 cards de hallazgos + tabla top 3 oportunidades + recomendación destacada)
4. **Mapa del mercado** (matriz ASCII 2x2 + tabla resumen con winner highlight)
5. **Matriz de scoring 10D** (tabla colorizada + barras de progreso TOTAL)
6. **Análisis dimensión por dimensión** (cards expandibles `<details>`)
7. **Tendencias** (grid de 10 cards numeradas con Caveat)
8. **Oportunidades** (cards con borde amarillo izquierdo + chips de impacto/esfuerzo/plazo)
9. **Plan 30/60/90** (3 columnas con chips de color por fase)
10. **Fichas individuales** (1 card por competidor + barras de miembros)
11. **Apéndice** (fuentes, notas metodológicas, archivos relacionados, próximos pasos)
12. **Footer** con firma Caveat "[TU MARCA] · @tuhandle"

### Convenciones visuales (NO improvisar)

- Paleta:
  - `cream-50` `#FDFBF6` (fondo principal)
  - `cream-100` `#F8F3E7` (fondo alterno)
  - `cream-200` `#F1E9D2` (bordes)
  - `ink` `#1A1A1A` (texto + header hero)
  - `accent-yellow` `#FFD43B` (highlight + winner)
  - `accent-pink` `#F472B6` `accent-green` `#84CC16` `accent-blue` `#60A5FA` (chips)
- Tipografía: `Caveat` para titulares decorativos / `Inter` para body
- Componentes reutilizables: `.washi` (etiqueta amarilla rotada), `.postit` (caja amarilla con sombra), `.ficha` (card blanca), `.bar` (barra de progreso), `.chip` (etiqueta redonda), `.winner` (gradiente amarillo→naranja para fila ganadora)
- TODO el reporte cabe en un archivo HTML único, sin dependencias externas más allá del CDN de Tailwind y Google Fonts

### Archivos a entregar

Guardar en `~/Documents/mi-contenido/benchmarks/YYYY-MM-DD_nicho/`:

1. `00-RESUMEN-EJECUTIVO.md` (1 página, lectura de 3 min — markdown)
2. **`01-REPORTE-COMPLETO.html`** ⭐ (el documento maestro, autocontenido)
3. **`01-REPORTE-COMPLETO.md`** (gemelo en markdown del HTML — misma información, para indexación y consulta rápida)
4. `02-MATRIZ-COMPARATIVA.csv` (la tabla de scoring para abrir en Excel/Numbers)
5. `03-FICHAS-COMPETIDORES.md` (fichas detalladas en markdown para edición rápida)
6. `04-OPORTUNIDADES.md` (sección extraída para foco rápido en markdown)
7. `raw/` (carpeta con scrapes originales)
8. `screenshots/` (si aplica)

### 🧠 Copia en tu Segundo Cerebro (opcional)

Si la persona tiene un Segundo Cerebro y te dio su ruta, ofrece copiar ahí los `.md`, el `.csv` y la carpeta `raw/` (todo menos el `.html`) para que pueda buscarlos y citarlos como notas. Si no tiene, no crees la carpeta.

---

## 🛑 REGLAS ANTI-ERROR

1. **NO inventar datos**. Si un competidor no muestra precio, decir "Precio oculto — requiere call de venta". No improvisar números.
2. **NO mezclar nichos**. Si Tavily devuelve resultados de otro vertical, descartarlos en validación con el usuario.
3. **NO sesgar hacia "todos son malos"**. El cliente necesita ver lo que la competencia hace BIEN para aprender, no solo lo que hace mal.
4. **NO dar oportunidades genéricas** tipo "diferenciarse mejor". Cada oportunidad debe ser concreta y citable a un gap específico.
5. **NO escribir en voseo argentino**. El usuario usa español neutro: tú/tienes/puedes (ver feedback_espanol_neutro en memoria).
6. **NO hacer benchmark si Apify no está activo Y el nicho lo requiere** (ej: SaaS con reviews en G2). Confirmar con el usuario que está OK con benchmark parcial.

---

## 🎨 VOZ Y ESTILO

- **Directa**: "El mercado está saturado en $47/mes. Hay vacío entre $97 y $297."
- **Profesional**: no usar "spoiler" ni jerga viral
- **Cuantitativa cuando se pueda**: "7 de 10 competidores usan Skool" en lugar de "muchos"
- **Citar fuentes**: cada afirmación importante debe poder rastrearse a un competidor específico o a una sección del scrape
- **Sin tecnicismos innecesarios**: la audiencia es el usuario + sus clientes, no equipos de marketing enterprise

---

## 📁 ARCHIVOS DE SOPORTE

- `references/dimensiones.md` — Las 10 dimensiones explicadas con criterios de scoring
- `references/template-reporte-html.md` — **Plantilla HTML del reporte principal** (esqueleto exacto a usar)
- `references/template-reporte.md` — Estructura semántica del reporte (referencia conceptual)
- `references/fallbacks.md` — Qué hacer cuando una herramienta falla
- `references/apify-actors.md` — Lista curada de actors de Apify útiles para benchmark
- `references/voz-y-frases.md` — Frases tipo F100K para usar en el reporte

---

## ✅ AL TERMINAR

1. Confirmar que los 7 archivos están en la carpeta destino (incluyendo `01-REPORTE-COMPLETO.html`)
2. Reportar al usuario:
   - Cuántos competidores se analizaron
   - Top 3 hallazgos del resumen ejecutivo
   - Top 3 oportunidades
   - Ruta absoluta de la carpeta
   - Próximo paso sugerido (ej: "¿Construimos la oferta con `constructor-ofertas-f100k` aplicando la oportunidad #1?")
3. **Abrir el reporte HTML** en el navegador del usuario: en Mac `open "$HOME/Documents/mi-contenido/benchmarks/YYYY-MM-DD_nicho/01-REPORTE-COMPLETO.html"`, en Windows `start "" "$HOME/Documents/mi-contenido/benchmarks/YYYY-MM-DD_nicho/01-REPORTE-COMPLETO.html"`
