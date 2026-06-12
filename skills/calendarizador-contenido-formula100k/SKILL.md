---
name: calendarizador-contenido-formula100k
description: >
  Arma calendarios de contenido semanales (Lunes-Domingo) en CSV y XLSX con la metodología FÓRMULA 100K. Usar cuando Andrea pida "arma mi calendario", "calendariza estos guiones", "ordena estas ideas en un calendario", "convierte esto en calendario semanal", "haz mi calendario en Excel", "organiza mis guiones por día", "calendariza este lote/enlaces/TikToks/reels/carruseles", "haz un calendario de carruseles"; o cualquier variación que combine ideas/guiones/enlaces con organizarlos por día. 3 modos de entrada: (1) guiones listos; (2) ideas sueltas que desarrolla llamando a guionizacion-formula100k o carrusel-viral-formula100k; (3) enlaces de video que transcribe con transcripcion-youtube-formula100k y reescribe como referencia. 2 tipos de pieza: REELS (DÍA·IDEA·GUION·CTA·FORMATO·REFERENCIA) y CARRUSELES (DÍA·FECHA·#·IDEA·GUION SLIDE x SLIDE·CTA·FORMATO, altura de fila dinámica). Distribución por propósito: Experimentación 70/30/0, Crecimiento 40/50/10, Nutrición 20/70/10, Venta 20/50/30.
argument-hint: [pega guiones, ideas o enlaces — o describe lo que quieres calendarizar]
---

# Skill: Calendarizador de Contenido FÓRMULA 100K

Convierte guiones, ideas sueltas o enlaces de referencia en un **calendario semanal Lunes-Domingo** listo para producir, exportado a CSV y XLSX.

Soporta **dos tipos de pieza** con esquemas de columnas distintos:

### Tipo REELS (default)

| Columna | Qué contiene |
|---|---|
| **DÍA** | Lunes a Domingo |
| **IDEA** | Concepto/título corto del video |
| **GUION** | Hook + Cuerpo + Outro completo |
| **LLAMADO A LA ACCIÓN** | CTA específico al propósito del slot |
| **FORMATO** | 1 de los 40 formatos del catálogo F100K |
| **REFERENCIA** | URL del video referencia o "Original" |

### Tipo CARRUSELES

| Columna | Qué contiene |
|---|---|
| **DÍA** | Día semana (LUN/MAR/MIE/…) coloreado por semana (S1 amarillo `#FCE96B`, S2 lila `#D9CCEC`) |
| **FECHA** | Fecha absoluta (ej. "18 MAY 2026") |
| **#** | Número del carrusel (01-99) |
| **IDEA** | Título del carrusel |
| **GUION (SLIDE x SLIDE)** | Texto de cada slide concatenado con saltos de línea reales. Altura de fila se ajusta automáticamente al largo del guion (wrap text activado, vertical-align top) |
| **CTA** | Palabra clave del CTA (ej. "MÁQUINA", "ROAST") |
| **FORMATO** | "Carrusel · N slides" |

El tipo CARRUSELES soporta **calendarios de hasta 2 semanas** (11-14 carruseles) en una sola hoja, con coloreo de la columna DÍA por semana para que visualmente se identifique el bloque S1 vs S2.

Distribución de los 7 días según el **propósito del calendario** (los 4 modos de la Estrategia V3.0).

---

## OUTPUTS

Carpeta de salida según tipo de pieza:
- **REELS:** `/Users/kissita/Documents/FORMULA100K/CALENDARIOS/`
- **CARRUSELES:** `/Users/kissita/Documents/FORMULA100K/CARRUSELES/CALENDARIO DE CARRUSELES/`

Genera **3 archivos** por sesión:
1. `calendario_[modo]_[YYYY-MM-DD].csv` — CSV separado por comas, encoding UTF-8 (solo modo reels)
2. `calendario_[modo]_[YYYY-MM-DD].xlsx` — Excel con header en negrita, columnas anchas
3. Tabla markdown en el chat (preview)

Para tipo CARRUSELES el nombre por defecto es `00_CALENDARIO_CARRUSELES.xlsx` (en la carpeta destino del proyecto), pero el usuario puede pedir un nombre con fecha.

Donde `[modo]` es uno de: `experimentacion`, `crecimiento`, `nutricion`, `venta`.

---

## FLUJO COMPLETO (seguir en orden)

### PASO 0 · Detectar tipo de pieza (REELS vs CARRUSELES)

**Antes que nada**, determinar si lo que se va a calendarizar son **reels** (default) o **carruseles**.

Señales para detectar tipo CARRUSELES:
- Usuario menciona explícitamente "carrusel", "carruseles", "slides", "diapositivas"
- Input incluye estructura "SLIDE 1 / SLIDE 2 / …" o "Slide 1: … Slide 2: …"
- Usuario pasa archivos `.md` generados por la skill `carrusel-viral-formula100k`
- Carpeta de origen es `/Users/kissita/Documents/FORMULA100K/CARRUSELES/`

Si no hay señales explícitas → asumir **REELS**.

Si hay ambigüedad → preguntar:
> ¿Estos son reels o carruseles? Cambia las columnas del calendario y el formato del guion.

El tipo de pieza determina:
- Esquema de columnas del CSV/XLSX (ver tabla de `QUÉ HACE` arriba)
- Si el guion va resumido en una línea (reels) o slide-by-slide completo (carruseles)
- Carpeta de output: `CALENDARIOS/` para reels · `CARRUSELES/CALENDARIO DE CARRUSELES/` para carruseles

### PASO 1 · Detectar modo de entrada

Inspecciona lo que pegó el usuario y clasifica:

| Señal en el input | Modo |
|---|---|
| Bloques largos con "Hook:", "Gancho:", "Cuerpo:", "CTA:", o párrafos completos de 80+ palabras por idea | **Modo A · Guiones listos** |
| Líneas cortas (5-30 palabras) que describen un tema o concepto, sin estructura de guion | **Modo B · Ideas sueltas** |
| URLs de TikTok, Instagram Reels, YouTube Shorts/Long | **Modo C · Enlaces de referencia** |
| Mezcla de varios | **Modo Híbrido** — procesa cada bloque según su tipo |

### PASO 2 · Preguntar propósito del calendario

Antes de calendarizar, **siempre** preguntar (a menos que el usuario lo haya dicho explícitamente):

> ¿Cuál es el propósito de este calendario? Elige uno:
> - 🧪 **Experimentación** (70% viral / 30% valor / 0% venta) — recién empiezas o no tienes formato estrella
> - 📈 **Crecimiento** (40% viral / 50% valor / 10% venta) — atraer audiencia fría nueva
> - 🌱 **Nutrición** (20% viral / 70% valor / 10% venta) — pre-lanzamiento, calentar audiencia
> - 💰 **Venta** (20% viral / 50% valor / 30% venta) — lanzamiento o promo activa en 14 días

Si el usuario duda, ofrécele hacer el mini test (5 preguntas) que está en el artifact `f100k-estrategia-contenido.html`.

### PASO 3 · Asignar slots Lunes-Domingo según propósito

Cada modo tiene un patrón fijo de 7 días con tipo (Viral/Valor/Venta) y formato sugerido:

Cargar la tabla de slots desde [references/slots-por-modo.md](references/slots-por-modo.md). Resumen:

**🧪 Experimentación** (cada día un formato distinto, prioridad viralidad):
- Lun: Viral · POV (#3) · Mar: Viral · Sketch (#7) · Mié: Valor · Pizarra (#19) · Jue: Viral · Cinemático (#2) · Vie: Viral · Historia Curiosa (#1) · Sáb: Valor · Mitos (#23) · Dom: Viral · Reacción Viral (#4)

**📈 Crecimiento** (40/50/10):
- Lun: Valor · Pizarra (#19) · Mar: Viral · POV (#3) · Mié: Valor · Versus (#12) · Jue: Viral · Sketch (#7) · Vie: Valor · Mitos (#23) · Sáb: Viral · Cinemático (#2) · Dom: Venta · Testimonio (#32)

**🌱 Nutrición** (20/70/10):
- Lun: Valor · Tutorial (#25) · Mar: Valor · Pizarra (#19) · Mié: Viral · POV (#3) · Jue: Valor · Versus (#12) · Vie: Valor · Mitos (#23) · Sáb: Valor · Errores (#30) · Dom: Venta · Testimonio (#32)

**💰 Venta** (20/50/30):
- Lun: Valor · Tutorial (#25) · Mar: Venta · Testimonio (#32) · Mié: Valor · Errores (#30) · Jue: Viral · POV (#3) · Vie: Venta · Demo (#33) · Sáb: Valor · Pizarra (#19) · Dom: Venta · Caso de Éxito (#34)

> Los formatos por día son **sugerencias base**. Si una idea/guion del usuario calza mejor con otro formato del catálogo (ver [references/catalogo-40-formatos.md](references/catalogo-40-formatos.md)) que respeta el tipo del slot, úsalo.

### PASO 4 · Procesar cada modo de entrada

#### MODO A · Guiones listos

1. Para cada guion del usuario:
   - Detectar el formato implícito (Tutorial, POV, Versus, etc.) leyendo la estructura del cuerpo
   - Detectar el tipo (Viral/Valor/Venta) por el CTA y nivel de conciencia que ataca
2. Hacer match de cada guion al slot del día que más se ajuste
3. Si hay más guiones que slots (>7), avisar al usuario y preguntar qué semana usar (esta o la siguiente)
4. Si hay menos de 7 guiones, completar slots vacíos sugiriendo desarrollar nuevas ideas (no inventar guiones a la fuerza)

#### MODO B · Ideas sueltas

1. Para cada idea, decidir formato basándose en el slot del día asignado y el catálogo de 40 formatos
2. **Delegar el desarrollo del guion** a la skill apropiada:
   - Si el slot pide formato carrusel (poco común en calendario semanal de reels) → usar `carrusel-viral-formula100k`
   - En todos los demás casos → usar `guionizacion-formula100k`
3. Para invocar la skill: usa el formato de delegación de Claude Code, pasando: la idea, el formato sugerido, el tipo (viral/valor/venta), y la instrucción de devolver Hook + Cuerpo + CTA en formato compacto
4. Mientras se desarrollan los guiones, ir poblando la tabla

#### MODO C · Enlaces de referencia

1. Para cada URL:
   - Llamar a `transcripcion-youtube-formula100k` para YouTube, o usar Supadata/yt-transcript-mcp si es TikTok/Reels
   - Extraer la transcripción y los puntos clave
2. **Reescribir la idea con voz de Andrea** aplicando frameworks F100K (no copiar)
3. Pasar el guion reescrito por `guionizacion-formula100k` para validar estructura y CTA
4. Guardar la URL original en la columna REFERENCIA

#### MODO Híbrido

Procesar cada bloque del input según su tipo. Mantener el orden del usuario solo si hay 7 piezas; si hay diferente cantidad, redistribuir según slots óptimos.

### PASO 5 · Asignar CTAs según tipo de slot

| Tipo de slot | CTA por defecto |
|---|---|
| Viral | "Sígueme para más" |
| Valor | "Guarda este post" o "Comenta [palabra clave] para enviarte el [recurso]" |
| Venta | "Haz clic en el enlace" / "Link en bio" / "Reserva tu lugar" |

Si el guion ya trae CTA, respétalo (solo verifica que coincida con el tipo del slot — si hay error de coherencia, corregir y avisar al usuario).

### PASO 6 · Generar archivos CSV y XLSX

Ejecutar el script Python `generate_calendar.py` (ubicado en `references/generate_calendar.py`) pasando los datos como JSON via stdin. El argumento `--tipo-pieza` cambia el esquema de columnas y el layout del Excel:

**Modo REELS:**
```bash
python3 /Users/kissita/.claude/skills/calendarizador-contenido-formula100k/references/generate_calendar.py \
  --tipo-pieza "reels" \
  --modo "[modo]" \
  --output-dir "/Users/kissita/Documents/FORMULA100K/CALENDARIOS/" \
  --data-json '<JSON_DATA>'
```

**Modo CARRUSELES:**
```bash
python3 /Users/kissita/.claude/skills/calendarizador-contenido-formula100k/references/generate_calendar.py \
  --tipo-pieza "carruseles" \
  --modo "[modo]" \
  --output-dir "/Users/kissita/Documents/FORMULA100K/CARRUSELES/CALENDARIO DE CARRUSELES/" \
  --output-name "00_CALENDARIO_CARRUSELES" \
  --data-json '<JSON_DATA>'
```

JSON para REELS:

```json
{
  "modo": "crecimiento",
  "fecha_inicio": "2026-05-04",
  "filas": [
    {"dia":"Lunes","idea":"...","guion":"...","cta":"...","formato":"Pizarra (#19)","referencia":"Original"},
    {"dia":"Martes","idea":"...","guion":"...","cta":"...","formato":"POV (#3)","referencia":"https://..."}
  ]
}
```

JSON para CARRUSELES (más campos por fila):

```json
{
  "modo": "crecimiento",
  "fecha_inicio": "2026-05-18",
  "titulo": "CALENDARIO DE CARRUSELES — SEMANA 18 MAYO 2026",
  "subtitulo": "Andrea Vega · FÓRMULA 100K · @andraestratega",
  "filas": [
    {
      "dia": "LUN",
      "fecha": "18 MAY 2026",
      "numero": "01",
      "idea": "Te están viendo la cara con Claude",
      "guion": "SLIDE 1 — GANCHO\n\"Te están viendo la cara con Claude\"\n\nSLIDE 2 — EL PROBLEMA\n...",
      "cta": "MÁQUINA",
      "formato": "Carrusel · 7 slides",
      "semana": "S1"
    }
  ]
}
```

Notas clave del modo carruseles:
- Campo `semana` con valor `"S1"` o `"S2"` colorea la celda DÍA (amarillo `#FCE96B` o lila `#D9CCEC`).
- Campo `guion` debe traer los slides separados con `\n\n` o títulos `SLIDE N — …`. El script calcula la altura de fila automáticamente.
- El script NO genera CSV para tipo carruseles (los saltos de línea internos del guion rompen Excel CSV); solo XLSX.

El script genera los archivos automáticamente. Si Python no tiene `openpyxl` instalado, intenta `pip install openpyxl --quiet` antes; si falla, generar solo CSV (reels) o avisar (carruseles).

### PASO 7 · Mostrar preview en chat

Imprimir tabla markdown con los 7 días. Truncar GUION a primeras 80 caracteres + "…" para que el preview sea legible. Después de la tabla, listar:
- 📁 Ruta del CSV
- 📊 Ruta del XLSX
- 📌 Resumen de distribución (X viral / Y valor / Z venta)
- ⚠️ Si algún slot quedó vacío o forzado

---

## FORMATO DE OUTPUT EN CHAT

```markdown
## 📅 Calendario [Modo] · Semana del [fecha]

| DÍA | IDEA | GUION (preview) | CTA | FORMATO | REFERENCIA |
|---|---|---|---|---|---|
| Lunes | ... | ... | ... | ... | ... |
| ... | | | | | |

📁 CSV: /Users/kissita/Documents/FORMULA100K/CALENDARIOS/calendario_[modo]_[fecha].csv
📊 XLSX: /Users/kissita/Documents/FORMULA100K/CALENDARIOS/calendario_[modo]_[fecha].xlsx

📌 Distribución real: X viral / Y valor / Z venta
✅ Listo para producir
```

---

## REGLAS Y GUARDARRAÍLES

- **NUNCA inventar referencias** (URLs falsas). Si la idea no tiene referencia, columna = "Original".
- **NUNCA mezclar tipos en un mismo slot.** Si una idea de venta cae en slot viral, mover de día o pedir reemplazo al usuario.
- **NUNCA inflar guiones a relleno.** Mejor 5 días con guiones sólidos + 2 slots vacíos que 7 días forzados.
- **Si el usuario tiene >7 ideas/guiones**, ofrecer guardar las extras para la semana siguiente (crear segundo archivo).
- **Si el usuario tiene <7**, completar el resto sugiriendo ángulos basados en los pilares (Problema/Solución/Resultado) de su nicho — no inventar contenido.
- **Respetar el formato estrella del usuario** si lo menciona ("siempre uso pizarra"). En ese caso, predominar ese formato sin romper la distribución viral/valor/venta del modo.
- **Si el usuario pasa enlaces sin contexto de su nicho**, preguntar el nicho antes de reescribir.
- **No llamar a las skills delegadas si el guion ya está completo** (Modo A) — ahorra tokens.
- **Encoding del CSV: UTF-8 con BOM** para que Excel en Mac/Windows abra acentos correctamente.

---

## REFERENCIAS Y ARCHIVOS DE APOYO

- `references/slots-por-modo.md` — Tabla completa de slots Lun-Dom para los 4 modos
- `references/catalogo-40-formatos.md` — Los 40 formatos F100K agrupados (A/B/C)
- `references/generate_calendar.py` — Script Python que produce CSV + XLSX
- `references/ejemplos-cta.md` — Bank de CTAs por tipo de slot

---

## EJEMPLO DE INVOCACIÓN

**Usuario:** "Calendariza estos 5 guiones para mi semana de venta del lanzamiento del 12 de mayo"

**Skill:**
1. Detecta Modo A (guiones listos)
2. Confirma propósito = Venta (20/50/30)
3. Mapea cada guion a un día según tipo (probablemente 1 viral / 2-3 valor / 2 venta)
4. Para los 2 días sin guion del usuario, sugiere completarlos con: 1 testimonio extra (slot venta domingo) y 1 valor (Tutorial paso a paso)
5. Genera CSV + XLSX
6. Muestra preview con distribución real y rutas de archivos
