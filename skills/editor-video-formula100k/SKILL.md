---
name: editor-video-formula100k
description: "Toma un video grabado por el usuario + un MANIFEST.md (keyword-based: header, énfasis, overlays, B-roll) y produce un BORRADOR_AUTO.mp4 listo para retoque. Corta silencios, muletillas y repeticiones (transcribe word-level) y compone uno de 5 formatos elegibles — fullscreen, split, pip, versus, pizarra — de un catálogo de 7 (faceless/noticiero: aún no); subtítulos según formato. Sincroniza por keyword sobre el transcript (no por timestamp), sobrevive al corte de silencios. Renderiza local con Remotion (gratis). OPCIÓN EXTRA: motion graphics animados (HyperFrames, HTML+GSAP) como overlays o B-roll. Activar cuando el usuario diga 'edita este video', 'auto-edita', 'monta el video', 'renderiza', '/render <carpeta>', '/edita <carpeta>', 'genera un motion graphic', 'overlay animado', o combine una carpeta con MANIFEST.md con intención de producir el .mp4 final. Output: $DEST/BORRADOR_AUTO.mp4. macOS (Homebrew) y Windows (winget); primera vez instala dependencias vía bootstrap."
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

# Editor de Video Auto — FÓRMULA 100K

Pipeline automatizado: toma una grabación del usuario + un `MANIFEST.md` (keyword-based) y produce `BORRADOR_AUTO.mp4` listo para retoque fino en CapCut/Premiere.

El preset visual default es **"Crea contenido viral"** — el formato `fullscreen` del catálogo (ver `## Catálogo de formatos` más abajo; hay otros 4) — talking-head 9:16 a 30fps con:
- Header persistente (2 líneas) grande, con trazo negro, debajo del cuarto superior
- **Imagen gancho** tipo pixel-avatar mascot en una esquina superior durante los primeros ~2.5s (sin tapar la cara)
- Caja blanca de énfasis en la zona inferior (anclada a keywords del transcript)
- Overlays gráficos en el **tercio inferior** (muy por debajo del rostro, `bottom: 520`) — **pixel-avatar mascot** generado, **screenshots** del usuario, o **capturas UI tutorial** (anclados a keywords, NUNCA tapan la cara, ni cuando quien habla se acerca a cámara)
- B-roll **videos** fullscreen estilo `monitor-photo` / **imágenes** en el tercio inferior (`bottom: 520`), igual que overlays — nunca tapan la cara
- **SFX "pop"** dispara automáticamente al aparecer cada imagen (hook, overlays, B-roll)
- **Sin subtítulos** — default de `fullscreen` (y también de `noticiero`); la cara y los gráficos llevan todo el peso visual. `split`, `pip` y `faceless` los traen encendidos por default.

**Diferencia clave con la versión anterior:** los cues se anclan por **keyword** sobre el transcript del video cortado, no por timestamp. Eso significa que `_source_cut.mov` puede regenerarse cuantas veces haga falta sin tener que remapear nada — los keywords resuelven contra el `captions.json` del corte vigente.

## Cuándo activar

Cuando el usuario:
- Pide auto-edición: "edita", "monta", "compón", "renderiza", "auto-edita"
- Usa atajos `/render <carpeta>` o `/edita <carpeta>`
- Acaba de correr `recursos-de-video-formula100k` y la skill cazadora dejó un `MANIFEST.md`

Requisitos:
- Una carpeta `$DEST` con `MANIFEST.md` (típicamente `/FORMULA100K/RECURSOS VIDEOS/<fecha>_<slug>/`)
- La ruta del video fuente (`.mov`/`.mp4`) — del campo `**Video fuente:**` del MANIFEST o pedirla al usuario

## NO activar para

- Cazar recursos web / generar IA → `recursos-de-video-formula100k`
- Gráficos sueltos → `graficos-de-video-formula100k`
- Carruseles → `carrusel-render-formula100k`
- Stories → `historias-a-imagenes-nanobanana`
- Miniaturas → `miniatura-youtube-formula100k`

## Requisitos previos (precondición)

La skill funciona en **macOS** (Apple Silicon o Intel) y **Windows 10/11**. Cada plataforma tiene una sola precondición: un gestor de paquetes que la skill usa para instalar todo lo demás. Si lo tienes, el bootstrap se encarga del resto solo.

### En macOS — Homebrew

**Homebrew** debe estar instalado ANTES de usar la skill por primera vez. El bootstrap NO lo instala automáticamente.

Verificar si Homebrew está instalado:
```bash
command -v brew
```

Si no responde nada, instalar con el comando oficial:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Después de instalar Homebrew, seguir las instrucciones que imprime al final (suelen pedir agregar `brew` al PATH con dos comandos `echo >> ~/.zprofile` + `eval`).

### En Windows — winget

**winget** (Windows Package Manager) debe estar disponible. Viene preinstalado en **Windows 10 build 1809+** y **Windows 11**, así que en la práctica casi todo el mundo ya lo tiene.

Verificar en PowerShell:
```powershell
winget --version
```

Si no aparece nada o da error:
1. Abre **Microsoft Store**
2. Busca **"App Installer"** (de Microsoft) e instala/actualiza
3. Cierra y vuelve a abrir PowerShell

Alternativa manual si Microsoft Store no funciona: https://github.com/microsoft/winget-cli/releases/latest

Una vez que tu gestor de paquetes esté listo (`brew` en Mac, `winget` en Windows), **la skill se auto-configura sola** la primera vez que la corras.

## Primera vez: bootstrap automático

La primera vez que invocas `/render <carpeta>` o `/edita <carpeta>`, el wrapper ejecuta el bootstrap correspondiente a tu plataforma y se encarga del resto.

### macOS

`render.sh` invoca `bootstrap.sh`:
- Verifica Homebrew (si falta, aborta con instrucciones claras)
- Instala vía `brew`: Node 18+, ffmpeg, yt-dlp, uv (para `uvx mlx-whisper`)
- Corre `npm install` dentro de `remotion-template/` (baja Remotion y sus deps)
- Genera el SFX `pop.wav` con ffmpeg

Para correrlo manualmente:
```bash
bash ~/.claude/skills/editor-video-formula100k/scripts/bootstrap.sh
```

Sólo verificar sin instalar:
```bash
bash ~/.claude/skills/editor-video-formula100k/scripts/bootstrap.sh --check
```

### Windows

`render.ps1` invoca `bootstrap.ps1`:
- Verifica winget (si falta, aborta con instrucciones)
- Instala vía `winget`: Node 18+, Python 3.10+, ffmpeg, yt-dlp
- Instala `faster-whisper` vía `pip` (alternativa de Whisper para Windows; en Mac se usa `mlx-whisper` que es nativo de Apple Silicon)
- Corre `npm install` dentro de `remotion-template/`

Para correrlo manualmente desde PowerShell (en la carpeta de la skill):
```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\.claude\skills\editor-video-formula100k\scripts\bootstrap.ps1"
```

Sólo verificar sin instalar:
```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\.claude\skills\editor-video-formula100k\scripts\bootstrap.ps1" -Check
```

**Importante en Windows:** después de la primera instalación de Node o Python, cerrar y volver a abrir PowerShell para que el PATH se actualice.

Tarda ~5-8 min en máquina limpia, **sólo la primera vez**. Las invocaciones siguientes saltean el bootstrap.

## Paso 0 — Confirmar el gancho textual (OBLIGATORIO antes del render)

Antes de invocar `render.sh` / `render.ps1`, el agente **SIEMPRE** debe revisar y ofrecer variantes del header del MANIFEST. El header es el **gancho textual** del reel — vive sobre la cara de quien habla los primeros 8 segundos y carga el 80% del trabajo de retención. No se renderiza ciegamente lo que está en el MANIFEST; se valida con el usuario, aunque nunca lo haya pedido.

Esta regla aplica incluso si:
- El MANIFEST viene recién generado por `recursos-de-video-formula100k` (sí, ese flujo ya pregunta en Paso 3.5 — pero al saltar a `/render` directamente o en un re-render posterior, esa elección puede no haber pasado).
- El usuario invoca con `/render <carpeta>` o "edita este video" sin mencionar el header.
- El header existente "parece bien".

**Aviso — el header puede no llegar a renderizarse.** Este paso corre antes
del Paso 0.5 (elección de formato), así que todavía no se sabe qué formato
va a usarse. Si termina siendo `split`, `pip` o `faceless`, el header que
El usuario acaba de confirmar aquí **no se renderiza** — esos formatos no
incluyen la capa `header` (ver `### Reglas por sección` → "Alcance por
formato"). No es un bug de este paso, es trabajo que se descarta cuando el
Paso 0.5 elige otro formato. No se reordenan los pasos por esto (harían
falta ambos: no se puede proponer un buen header sin saber si va a existir,
pero tampoco conviene elegir formato antes de tener transcript real en
algunos casos) — sólo quede advertido para no sorprenderse si el header
confirmado "desaparece" del render.

**Flujo:**

1. Leer `$DEST/MANIFEST.md` y extraer `## Header` → `Línea 1` + `Línea 2`. Si falta el header, marcar el actual como vacío (no abortar).

2. Si `captions.json` ya existe (re-render), leerlo para tener el transcript real. Si no, leer el campo `**Video fuente:**` y avisar que las variantes se generan sobre la promesa del MANIFEST (sin transcript todavía).

3. **Invocar la skill `guionizacion-formula100k`** pidiéndole 3 variantes de gancho textual aplicando su framework "Gancho Textual del Top 1%":
   - Cada variante en formato `Línea 1` / `Línea 2`
   - 3-5 palabras por línea
   - Sentence case (NO all caps)
   - Estilos diversos: una declaración punzante, una con contraste/contraintuitivo, una con número fuerte o promesa concreta

4. Mostrar al usuario con `AskUserQuestion` **siempre 4 opciones** en este orden:
   - **Opción 1 (Recomendada solo si no hay nada mejor):** "Conservar el actual — `<L1 actual>` / `<L2 actual>`"
   - **Opción 2:** Variante 1 — `<L1>` / `<L2>` (estilo: declaración punzante)
   - **Opción 3:** Variante 2 — `<L1>` / `<L2>` (estilo: contraste / contraintuitivo)
   - **Opción 4:** Variante 3 — `<L1>` / `<L2>` (estilo: número fuerte / promesa concreta)

   Header del AskUserQuestion: `"Gancho textual"`. Pregunta literal: `"¿Cuál usamos como header del reel? Aparece sobre la cara los primeros 8s."`. multiSelect: false.

5. Si Andrea elige una variante distinta a la actual, **reescribir el header del MANIFEST.md** preservando todo lo demás:
   - Solo tocar las dos líneas que empiezan con `- **Línea 1:**` y `- **Línea 2:**` dentro de la sección `## Header`.
   - NO tocar el resto del archivo.
   - Si la sección `## Header` no existía, agregarla inmediatamente después del frontmatter (`# Reel — ...` + metadata).

6. Si Andrea elige "Otro" (input libre del AskUserQuestion), interpretar su texto como un nuevo `Línea 1 / Línea 2` y aplicarlo. Si pide variaciones ("dame 3 más"), volver a invocar `guionizacion-formula100k` con feedback específico y repetir el paso 4.

7. Solo cuando el header esté confirmado y guardado en el MANIFEST, continuar con el pipeline de render abajo.

**Si `guionizacion-formula100k` no está disponible:** generar las 3 variantes aplicando estas reglas a mano sobre el transcript, pero avisar al usuario: "para mejor calidad de gancho instala `guionizacion-formula100k`".

**Re-renders y atajo de skip:** si Andrea explícitamente dice "renderiza tal cual", "no toques el header", "el header está bien", "skip", o invoca con `/render <carpeta> --skip-hook`, saltar este paso. Por default — incluso en re-render — se pregunta.

---

## Paso 0.5 — Proponer el formato (antes del render)

Después de confirmar el gancho textual y antes de invocar `render.sh`, proponer
el formato de edición. Se salta si el MANIFEST ya declara `**Formato:**` con
**uno de los cinco ids válidos** (`fullscreen`, `split`, `pip`, `versus`,
`pizarra`) y el usuario dice
"renderiza tal cual", o si se invoca con `--skip-formato`. Un MANIFEST real
puede traer `- **Formato:** 1920×1080` (texto libre, no un id) — el parser lo
descarta por inválido y cae al default en silencio; si la regla de salto sólo
mirara "¿existe el campo?" el agente nunca preguntaría en ese caso. Por eso
la condición es sobre el **valor**, no sobre la presencia del campo.

**Sólo cinco formatos son elegibles hoy: `fullscreen`, `split`, `pip`, `versus`,
`pizarra`.**
`faceless` y `noticiero` están en el catálogo (`formatos.ts`) pero
`render.py` no tiene forma de invocarlos todavía — ver el porqué en
`## Catálogo de formatos`. **Nunca escribir** `- **Formato:** faceless` ni
`- **Formato:** noticiero` en el MANIFEST: el render caería en silencio a
`fullscreen` con las dimensiones equivocadas (vertical en vez del horizontal
que promete `noticiero`, por ejemplo). Si las señales del video apuntan a uno
de esos dos, decírselo al usuario **en palabras** — no como campo del
MANIFEST — y ofrecerle el más cercano de los cinco elegibles.

**Flujo:**

1. Leer `remotion-template/src/formatos.ts` para tener los siete formatos con
   su campo `cuandoUsar` — se lee para reconocer señales, no para elegir
   directamente entre los siete (sólo cinco son elegibles, ver arriba).
2. Inventariar `$DEST`: ¿hay una carpeta `CANVAS/` con screen recordings?
   ¿el video fuente tiene cara o es sólo audio?
3. Leer `captions.json` si existe y contar cuántas señales de `cuandoUsar`
   aparecen en el transcript, de los siete formatos.
4. Si las señales dominantes apuntan a `faceless` o `noticiero`, **no
   recomendar ese id**: avisar a Andrea en texto plano que el contenido pide
   ese formato pero que el catálogo todavía no lo soporta desde este
   pipeline, y dejar que ella decida entre los cinco elegibles con el
   `AskUserQuestion` del paso siguiente (si el video no tiene cámara en
   absoluto, decirlo explícitamente — ninguno de los cinco elegibles fue
   pensado para eso, y es preferible que el usuario lo sepa antes de un render
   de varios minutos que igual va a mostrar algo raro).
5. Mostrar con `AskUserQuestion` el formato recomendado **entre los cinco
   elegibles**, con su razón concreta (qué señal lo disparó), más la o las
   alternativas más cercanas — también elegibles. Header: `"Formato"`.
   Pregunta: `"¿Con qué formato lo edito?"`.
6. Escribir `- **Formato:** <id>` en el MANIFEST (siempre uno de los cinco
   elegibles), debajo de la metadata de cabecera, y continuar con el
   pipeline.

**Nunca elegir en silencio.** Un render de un minuto de video tarda 3-5
minutos; equivocarse de formato sin preguntar cuesta más que la pregunta.

---

## Pipeline (un solo comando)

**macOS:**
```bash
bash ~/.claude/skills/editor-video-formula100k/scripts/render.sh "$DEST" "$VIDEO_PATH"
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\.claude\skills\editor-video-formula100k\scripts\render.ps1" "$DEST" "$VIDEO_PATH"
```

Lo que hace el wrapper internamente (idéntico en ambas plataformas — la lógica vive en `render.py`):

1. **Corte de silencios + transcripción** (`cut_silences_and_fillers.py`) — sólo si `_source_cut.mov` y `captions.json` no existen aún. Produce:
   - `_source_cut.mov` — video cortado **agresivamente** en dos capas: primero un **pase semántico con Claude** (ver abajo) que entiende el transcript y borra tomas falladas/equivocaciones/repeticiones reformuladas; luego el motor local que limpia silencios > ~0.20s, muletillas `eh/em/uhh/...` y **repeticiones consecutivas** ("y, y, y…", "que que", "porque porque") colapsadas a la última ocurrencia. Padding de 60ms al final de cada palabra para que no se corte la cola.
   - Tunables vía flags: `--min-silence 0.08`, `--pad 0.06`, `--no-dedupe`, `--dedupe-max-gap 1.2`, `--no-semantic`, `--semantic-model`, `--guion`, `--semantic-max-drop`.
   - `edl.json` — mapping orig→nuevo tiempo. Lo usa el remap de captions, no es debug.
   - `captions.json` — word-timestamps del transcript original **remapeados** al timeline del corte vía `edl.json`. No se re-transcribe el video cortado (eso introducía alucinaciones de Whisper y drift fonético tipo "reels"→"reales"). Una sola transcripción = fuente de verdad.

### Corte por comprensión (pase semántico con Claude)

El motor local solo compara **strings**: borra muletillas, palabras idénticas pegadas y reinicios de frase que se PARECEN. No entiende lo que dices, así que dejaba pasar el caso real: te equivocas y reformulas la idea con **otras palabras**, o repites con una respiración en medio. El pase semántico arregla justo eso.

**Cómo funciona:** antes del corte local, el transcript indexado palabra-por-palabra (con su guion opcional como referencia) se manda a Claude, que razona como editor humano — *"arrancó mal aquí, lo volvió a decir bien allá → me quedo con la buena"* — y devuelve los rangos de índices a borrar. Se eliminan esas palabras y el resto del pipeline (silencios, EDL, captions, render) sigue igual.

**Requisito:** exportar la API key de Anthropic antes del render:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```
Sin key, el pase se salta **automáticamente** y corre solo el motor local (con un aviso). Nunca rompe el render.

**Guion opcional (máxima precisión):** si dejas un `guion.txt` en la carpeta `$DEST` (o pasas `--guion ruta.txt`), Claude lo usa como norte de lo que querías decir. No es obligatorio — sin guion igual limpia bien.

**Seguridad (no sobre-borra):** si Claude propone borrar más del 40% del video (`--semantic-max-drop`), se descarta su sugerencia y corre solo el motor local. Una toma buena jamás se pierde por error del modelo. El llamado se hace por HTTP nativo (sin SDK), así que no agrega dependencias.

**Flags:** `--no-semantic` (desactiva el pase), `--semantic-model claude-haiku-4-5` (más barato/rápido; default `claude-opus-4-8` por calidad), `--guion ruta.txt`, `--semantic-max-drop 0.4`, `--semantic-level conservador|ajustado`.

**`--semantic-level`** (default `conservador`) — qué tan agresivo es el pase:

- `conservador` — sólo tomas falladas literales. Es el default y el seguro.
- `ajustado` — además recorta preámbulos de arranque, divagaciones tangenciales y re-enunciados redundantes, protegiendo gancho, pasos, datos y CTA. Recorta ≈2-3× más.

Usá `ajustado` cuando grabaste limpio y el reel te quedó largo y flojo: sobre video sin tropiezos el default corta ~6% y no alcanza. `collage-cine-f100k` ya lo exige siempre por esa razón.

### Director de conceptos (ilustrar lo que se explica) — OPCIONAL

Un segundo pase de Claude que NO corta: lee el transcript y detecta **momentos de concepto nuevo** (una skill, una herramienta, un sistema, una metáfora, un "modo") que se entenderían mejor con un apoyo visual, y propone cómo ilustrarlos. **Híbrido:**
- **`card`** — concepto simple/numérico → una infografía/tarjeta HTML (gratis, instantánea).
- **`imagen`** — concepto rico o "visualizable" (ej. *representar una skill* como una escena/objeto) → imagen generada con Higgsfield **nano_banana**.

**Activar cuando** el usuario diga "ilustra los conceptos", "agrégale visuales a lo que explico", "representa la skill que menciono", o como paso extra antes del render. Flujo:

```bash
# 1. Proponer (corre sobre el captions.json del corte ya hecho; necesita ANTHROPIC_API_KEY)
[ -z "$ANTHROPIC_API_KEY" ] && [ -f "$HOME/.config/f100k/secrets.env" ] && source "$HOME/.config/f100k/secrets.env"
python3 "$HOME/.claude/skills/editor-video-formula100k/scripts/concept_director.py" \
  "$DEST/captions.json" --out "$DEST/concept_proposals.json" --max 4
```

`concept_proposals.json` = lista de `{keyword, concepto, tipo, prompt_visual, t_hint}`. El `keyword` ya viene **anclado** (verificado contra el transcript), así sobrevive a re-cortes.

2. **CHECKPOINT humano (antes de gastar créditos):** mostrar las propuestas con `AskUserQuestion`. El usuario aprueba, edita el `prompt_visual`, cambia `tipo`, o descarta. **No se genera ninguna imagen sin su OK.**

3. **Generar el visual de cada propuesta aprobada:**
   - `tipo: card` → generar la infografía con la skill `graficos-de-video-formula100k` (o una card HTML) → guardar en `$DEST/IA/concepto_<slug>.png`.
   - `tipo: imagen` → generar con el **MCP de Higgsfield** (`mcp__higgsfield__generate_image`, modelo `nano_banana`) usando `prompt_visual` (9:16 o 1:1) → descargar a `$DEST/IA/concepto_<slug>.png`. Si **no hay créditos** Higgsfield, **degradar a `card`** automáticamente (avisar) — el reel no se queda sin el apoyo visual.

4. **Agregar filas al MANIFEST** ancladas por keyword (respetan las reglas: nunca tapan la cara):
   ```markdown
   ## Overlays
   | Keyword  | Archivo                      | Ancho | Duración | Posición |
   |----------|------------------------------|-------|----------|----------|
   | council  | IA/concepto_council.png      | 900   | 2.6      | bottom   |
   ```
   (Para un apoyo más protagonista usar `## B-roll` con el mismo archivo y `Estilo = monitor-photo`.)

**Flag/guardarraíles:** `--max N` (tope de conceptos, default 4, para no saturar). Sin `ANTHROPIC_API_KEY` el pase escribe `[]` y se salta (no bloquea). El video original nunca se toca; los conceptos son overlays sobre el corte.

2. **MANIFEST.md → cues.json** (`manifest_to_cues.py`) — parsea las secciones Header, Énfasis, Overlays, B-roll del MANIFEST y emite `cues.json`. Si `captions.json` existe, avisa con `[warn]` si alguna keyword no aparece en el transcript.

3. **Setup de `public/`** — hard-link de `WEB/`, `IA/` y `_source_cut.mov` dentro del template Remotion para que `staticFile()` los resuelva.

4. **Render** (`scripts/render.ts` con `tsx`) — bundlea con `@remotion/bundler`, selecciona la composición `reel-viral`, infiere `durationInFrames` del último `word.end`, llama `renderMedia()` con codec h264. Output: `$DEST/BORRADOR_AUTO.mp4`.

Tiempo típico: ~3-5 min por minuto de video fuente en Apple Silicon. El render es 1080×1920 @ 30fps.

---

## Catálogo de formatos

El registro vive en `remotion-template/src/formatos.ts` — esa es la fuente de
verdad. Esta tabla es un resumen; si difieren, manda el código.

| Formato | Qué es | Subtítulos | Tema default | Elegible desde `- **Formato:**` |
|---|---|---|---|---|
| `fullscreen` | Talking-head 9:16 + overlays en los tercios | apagados | `default` | ✅ |
| `split` | Canvas arriba 40% / cara abajo 60% | encendidos | `crema-editorial` | ✅ |
| `pip` | Screen-rec de lienzo + cámara en recuadro | encendidos | `default` | ✅ |
| `versus` | Cuadro partido A/B + cámara en la costura | encendidos | `crema-editorial` | ✅ |
| `pizarra` | Trazos a mano que se dibujan detrás de ti | encendidos | `default` | ✅ |
| `faceless` | Screen-rec + cards sobre voz en off | encendidos | `default` | ❌ |
| `noticiero` | 16:9 con barra de noticias y chyrons | apagados | `default` | ❌ |

**Los siete formatos existen en el catálogo, pero hoy sólo cinco se activan
desde el MANIFEST.** `remotion-template/src/formatos/index.ts` sólo registra
componente para `fullscreen`, `split`, `pip`, `versus` y `pizarra`. `faceless` (modo `tutorial`) y
`noticiero` (modo `news`, horizontal 1920×1080) están definidos en
`formatos.ts` y tienen su composición Remotion registrada en `Root.tsx`, pero
`render.py` **nunca pasa `--mode`** al invocar `render.ts` — siempre corre en
modo `reel`. Si el MANIFEST declara `- **Formato:** noticiero` o `faceless`,
el despachador de React no encuentra componente para ese id, cae a
`fullscreen` con un `console.warn` (se imprime en la terminal del render,
igual que cualquier otro `[warn]` — ver **Degradaciones** abajo), y el
resultado — para `noticiero` — es un
video **vertical** 1080×1920 en vez del horizontal prometido. No escribas
`- **Formato:** faceless` ni `- **Formato:** noticiero` en un MANIFEST de este
pipeline esperando que el render los use: hoy no existe un `/render` que los
invoque. Cablear el modo por formato es trabajo de una tarea aparte, no de
esta.

Se declara en el MANIFEST con hasta seis campos opcionales (sólo tienen
efecto real para `fullscreen`, `split`, `pip`, `versus` y `pizarra`):

```markdown
- **Formato:** split
- **Tema:** crema-editorial
- **Subtítulos:** on
- **Esquina cámara:** tr
- **Etiqueta A:** ANTES
- **Etiqueta B:** AHORA
```

Un MANIFEST sin ellos renderiza exactamente como antes del catálogo.

**Para `versus`:** el cuadro se parte en dos mitades de 960 px y la cámara va
en un círculo sobre la costura. Cada fila de la tabla de B-roll declara en qué
mitad vive con una columna extra **`Lado`** (`a` = arriba, `b` = abajo):

```markdown
| Keyword | Archivo | Duración | Estilo | Lado |
|---|---|---|---|---|
| antes | captura-vieja.png | 4 | clean | a |
| ahora | captura-nueva.png | 4 | clean | b |
```

Una fila sin `Lado` (o con cualquier otro valor) cae en el lado `a`. `Etiqueta
A` y `Etiqueta B` rotulan cada mitad; se emiten **sólo si vienen las dos** —
con una sola, el render avisa con `[warn]` y usa ANTES/AHORA. Se ignoran fuera
de `versus`, igual que `Esquina cámara` fuera de `pip`.

⚠️ El clamp de B-roll («cada cue termina donde empieza el siguiente») es **por
lado** justamente por este formato: si fuera global, el cue del lado B cortaría
al del lado A y las dos mitades nunca se verían juntas — que es el formato
entero. Los demás formatos no notan la diferencia porque todo cae en `a`.

**Zonas muertas de la card (medidas en un render real, no teoría).** En `versus`
el frame ya está ocupado por el cromo del formato, así que una card que use todo
su lienzo se pisa sola. Al diseñar las imágenes de B-roll para este formato:

- **Esquina superior izquierda de cada mitad (~100 px de alto):** ahí se dibuja
  la etiqueta-chip (`Etiqueta A` / `Etiqueta B`). Deja ese borde libre.
- **Franja bajo la cámara (~1200-1380 px del frame, o sea el tercio superior de
  la mitad B):** ahí viven el subtítulo y el énfasis. La card del lado **b**
  debe llevar su contenido **abajo**.
- **Borde inferior de la mitad A (~210 px):** lo muerde el círculo de cámara.
  La card del lado **a** debe llevar su contenido **arriba**.

Regla corta: **el contenido huye de la costura** — la card de arriba empuja
hacia arriba, la de abajo empuja hacia abajo. Si tus cards son texto denso y no
querés rediseñarlas, apagá los subtítulos con `- **Subtítulos:** off`.

**Subtítulo y énfasis comparten banda y se excluyen.** Los dos se anclan debajo
de la cámara (no en el tercio inferior, que en este formato es cuerpo de card).
Mientras un énfasis está activo, el subtítulo que lo pisaría **se descarta** —
es la misma regla que ya rige entre énfasis y overlay en `fullscreen`, sólo que
acá el que cede es el subtítulo.

**Para `pizarra`:** es un formato de **montaje**, no un motor — no dibuja
nada, apila dos insumos que ya producen otras skills:

| Insumo | Lo produce | Dónde dejarlo |
|---|---|---|
| **lienzo** — los trazos a mano, con alfa | `pizarra-explicativa-f100k` | `$DEST/*lienzo*.webm` (o `.mov`), o `$DEST/PIZARRA/` |
| **cutout** — vos recortada, con alfa | `hyperframes remove-background` | `$DEST/*cutout*.webm` |

```bash
# el cutout: local, gratis, sin pantalla verde, sobre cualquier pared
npx hyperframes remove-background "$DEST/_source_cut.mov" \
  -o "$DEST/cutout.webm" --quality balanced
```

Los dos se descubren solos por nombre y **no se declaran en el MANIFEST**: al
MANIFEST le alcanza con `- **Formato:** pizarra`. Si falta cualquiera de los
dos, el render avisa con `[warn]` y cae a `fullscreen` — nunca rompe.

⚠️ **El alfa de un `.mov` HEVC no lo lee Chrome, y por lo tanto tampoco
Remotion.** Se comprobó decodificando un frame contra un fondo rojo: con
`.webm` VP9 el rojo se ve a través; con `.mov` HEVC el frame sale opaco entero
y el lienzo desaparece. Y resulta que el entregable de
`pizarra-explicativa-f100k` es justamente un `.mov` HEVC (su formato ligero,
~100 MB frente a los 4 GB del ProRes). El pipeline lo resuelve solo:
**convierte el lienzo a VP9/webm la primera vez y cachea el resultado** junto
al original. Si podés elegir, pedile el lienzo directamente en `.webm`
(`hyperframes render . --format webm`) y te ahorrás la conversión.

**`pizarra` no admite B-roll.** No es un olvido: el lienzo YA es el apoyo
visual del formato, y un B-roll encima taparía exactamente lo que se viene a
mostrar. Sus capas son `emphasis`, `captions` y `sfx`.

**Dónde caben los trazos.** El sujeto ocupa el frame de la cintura para abajo.
Medido sobre la máscara alfa de una toma real: de `y=0` a `y≈480` el frame está
**libre del todo**, entre 480 y 720 quedan libres los costados, y de 720 hacia
abajo cualquier trazo queda tapado. Diseñá el lienzo dentro de esos primeros
~700 px.

**Limitación conocida:** donde la ropa oscura toca el fondo oscuro, el matting
puede dejar una banda tenue. Si molesta, subí a `--quality best` en
`remove-background`; si la toma tiene mala luz y el recorte sale sucio de
verdad, el fallback probado es `split` (pizarra arriba, cara abajo) — que es
exactamente el modo Paneles de `collage-cine-f100k`.

**Para `pip`:** dejar el screen recording en `$DEST/CANVAS/`. El pipeline toma
el primer video de esa carpeta **por orden alfabético** como lienzo y avisa
con `[warn]` cuál eligió (útil si dejaste más de uno ahí sin darte cuenta).
Sin la carpeta, avisa y usa la cámara a pantalla completa — pero **no** se ve
como `fullscreen`: `pip` sigue sin montar `Header`, `HookImage` ni
`EmphasisLayer` (ese componente nunca los incluye, con o sin lienzo — no
están en sus `capas` de `formatos.ts`) y los subtítulos siguen encendidos
(default de `pip`). El resultado es la cámara a pantalla completa, sin
header ni gancho visual, con subtítulos — no esperes que el header
confirmado en el Paso 0 aparezca sólo porque falta `CANVAS/`.

**`Esquina cámara` (sólo aplica a `pip`)** — dónde va el recuadro de cámara:
`tl`, `tr`, `bl`, `br`. Default **`tr`** (arriba a la derecha): abajo viven
los subtítulos, los overlays y el B-roll de imagen, así que ahí la cámara
queda tapada.

**Dos limitaciones conocidas de `pip`** — para no descubrirlas en un render:
- El B-roll de **video** ocupa el frame completo, recuadro de cámara
  incluido. Durante esa ventana el formato deja de verse como pip. Si
  necesitas que la cámara siga visible, usa una imagen en vez de un video.
- Los overlays y el B-roll de imagen solapan parcialmente el recuadro
  incluso con la esquina superior (medido: ~10% y ~15% del recuadro). Es
  tolerable, pero conviene saberlo al elegir la esquina.

**Dos limitaciones conocidas de `split`** — alcance que quedó fuera de esta
ronda, no bugs a arreglar:
- El encuadre vertical de la cara está **hardcodeado** en `split.tsx`
  (`objectPosition: 'center 20%'`) — no es ajustable desde el MANIFEST,
  aunque el spec original lo prometía. Si el encuadre por defecto no sirve
  para un video puntual, hoy no hay override; hay que tocar el código.
- Si el canvas superior no tiene ni B-roll ni overlays en un momento dado,
  `split` **no avisa** — el panel simplemente queda pintado con el color de
  fondo del tema (`tema.fondo`). A diferencia de `pip` (que sí avisa cuando
  le falta el lienzo), `split` no tiene forma de detectar "canvas vacío" y
  quedarse callado ahí es esperado, no un bug.

### Catálogo de estilos (lo que ve la alumna)

`remotion-template/src/estilos.ts` es el registro de **estilos** — lo que la
alumna elige — frente a `formatos.ts`, que es lo que el render sabe componer.
Hoy son 1:1, pero el tipo ya distingue `resuelvePor: 'formato' | 'skill'`
porque a futuro un estilo podrá resolverlo otra skill (`collage-cine-f100k`,
`motion-reels-f100k`) sin que ella note la diferencia.

`construirPrompt(id)` compone el prompt que se copia de la vitrina: tres
partes fijas (instalación → recorte semántico → estilo) más el paso del
MANIFEST y los requisitos duros de ese estilo. El texto de las dos primeras
partes es una constante compartida: si cambia el instalador, cambia en un
solo lugar.

**Regla dura, la que ya costó caro con `faceless`/`noticiero`:** un estilo no
entra a `ESTILOS` hasta que su render salga bien de punta a punta. Hay un test
que lo fija (`estilos.test.ts` verifica que todo estilo apunte a un formato
realmente elegible desde el MANIFEST). Vale más un catálogo de cuatro honesto
que uno de cinco con una promesa falsa.

**Los cinco demos** salen del mismo clip fuente a propósito — la comparación
honesta es el argumento de venta del catálogo. Viven en
`FORMULA100K/RECURSOS VIDEOS/2026-08-19_demos-estilos/DEMOS/`, junto al
MANIFEST con el que se produjo cada uno. **No se commitean a esta skill**
(son ~175 MB); los consume la vitrina del Grimorio, que es trabajo aparte.

---

**Degradaciones:** formato desconocido cae a `fullscreen`; tema desconocido cae
al del formato; subtítulos sin `captions.json` se apagan. Todas avisan con
`[warn]` y ninguna aborta el render.

---

## Formato del MANIFEST.md (keyword-based)

Todos los cues se anclan a **keywords del transcript**. El parser busca la primera ocurrencia de la keyword (case-insensitive, tolerante a acentos y puntuación) en `captions.json` y dispara el cue ahí.

### Esqueleto mínimo

```markdown
# Reel — <título corto>

- **Video fuente:** ~/Downloads/IMG_1969.MOV
- **Fecha:** 2026-05-13

## Header

- **Línea 1:** Publica todos
- **Línea 2:** los días sin perfección
- **Esconder después:** 8   <!-- opcional. Default 8s. Pon 0 si querés que se quede todo el video. -->

## Gancho visual

- **Archivo:** `IA/HOOK_perfeccion_tachada.png`
- **Posición:** right
- **Inicio:** 0.3
- **Duración:** 2.2
- **Ancho:** 380
- **Rotación:** 3

## Énfasis

| Keyword     | Texto en caja blanca   | Duración |
|-------------|------------------------|----------|
| perfección  | Olvida la perfección   | 1.6      |
| japer       | Yapper Method          | 1.8      |
| automatizar | Automatiza todo        | 1.6      |
| comenta     | Comenta 100K           | 2.0      |

## Overlays

| Keyword     | Archivo                                       | Ancho | Duración | Posición |
|-------------|-----------------------------------------------|-------|----------|----------|
| deteniendo  | `IA/T1_G1_perfeccion_tachada_0000-0012.png`   | 480   | 2.4      | bottom   |
| Japer       | `IA/T2_G1_yappermethod_ideas_0012-0027.png`   | 480   | 2.4      | bottom   |
| Cloud       | `IA/T3_G1_auto_edicion_claude_0027-0042.png`  | 480   | 2.4      | top      |

## B-roll

| Keyword     | Archivo                                | Duración | Estilo        |
|-------------|----------------------------------------|----------|---------------|
| internet    | `WEB/google/pinterest_clip.mp4`        | 3.0      | monitor-photo |
```

### Reglas por sección

**Alcance por formato.** No todas estas secciones del MANIFEST existen en
los siete formatos — cada uno declara sus propias `capas` en `formatos.ts`.
`Header` y `Gancho visual` (hook) **sólo existen en `fullscreen`**:
escribirlas en el MANIFEST de `split` o `pip` no hace nada, se ignoran en
silencio (ni siquiera avisan con `[warn]`). `Énfasis` existe en `fullscreen`
y **también en `split`** (no en `pip`). `Overlays` existe en `fullscreen`,
`split` y `pip`. `B-roll` y el SFX de "pop" existen en los tres, y también
en `versus` (con su columna extra `Lado`). **`pizarra` no admite ninguna de
las cuatro**: sus capas son sólo `emphasis`, `captions` y `sfx` — el lienzo
ya es su apoyo visual. Los formatos elegibles hoy desde el MANIFEST son
`fullscreen`, `split`, `pip`, `versus` y `pizarra` (ver
`## Catálogo de formatos`).

**Header** — Líneas 1 y 2. Funciona como **gancho de los primeros 8 segundos** (default) y luego desaparece para dejar la cara de quien habla limpia. **Anton (pack F100K, `F100K Display`) 92px en MAYÚSCULAS**, blanco con trazo negro 6px (`WebkitTextStroke`), sombra suave, centrado horizontal, anclado a `paddingTop: 280` (debajo del cuarto superior para no chocar con la frente de quien habla). Override en MANIFEST con `Esconder después: N` (segundos del timeline ya cortado). Para que se quede todo el video pasa `Esconder después: 0`.

**Gancho visual** — Imagen tipo sticker (UN solo archivo) que aparece en los primeros segundos en una esquina superior. Columnas: `Archivo | Posición | Inicio | Duración | Ancho | Rotación`. Defaults: `Posición=right`, `Inicio=0.3s`, `Duración=2.2s`, `Ancho=360px`, `Rotación=3°`. Anclado a `top: 340px` para no chocar con el header. Spring drop desde fuera del frame + wobble sutil + fade out. NO cubre la cara centrada (zona segura x≥640 si position=right).

**Énfasis** — Columnas (en orden): `Keyword | Texto | Duración | Offset`. Defaults: `Duración = 1.6s`, `Offset = 0`. La caja blanca aparece en la parte inferior del frame (`bottom: 220`), Inter 800 84px, sombra suave + sombra base estilo "stack". Mientras hay énfasis activo, los overlays se ocultan automáticamente para no superponerse.

**Overlays** — Columnas: `Keyword | Archivo | Ancho | Duración | Posición`. Defaults: `Ancho = 420px`, `Duración = 2.0s`, `Posición = bottom`. El path es relativo a `$DEST/` (ej. `IA/...` o `USER/...`).

- **`Posición: bottom` (default)** — Renderiza en el **tercio inferior** (`bottom: 520`), zona pecho/manos. MUY por debajo del rostro.
- **`Posición: top`** — Renderiza en la **zona superior al ras del cabello** (`bottom: 1100` ≈ 820px desde arriba en 1920px). El BORDE INFERIOR del overlay toca el hairline de quien habla — nunca flotando en el espacio vacío arriba. Usar para UI tutorial, terminal, callouts que se ubican encima de la cabeza.

Regla dura: los overlays NUNCA tapan la cara, independientemente de la posición. Spring de entrada + float loop sutil. Si hay un énfasis activo en cualquier frame mientras el overlay vive, se oculta (opacity 0) porque el énfasis (`bottom: 220`) compite por la atención.

**Excepción — formato `split`:** la columna `Posición` se ignora. El canvas
superior de `split` es una sola zona, no un frame completo con tercios — el
overlay se centra y se escala para caber dentro del panel. `top`/`bottom`
sólo tienen efecto en los formatos que usan el frame completo (`fullscreen`,
`pip`, `noticiero`). Consecuencia: en `split`, si dos overlays coinciden en
el tiempo, se dibujan **uno encima del otro** en el mismo punto (el panel no
tiene tercios donde separarlos).

**B-roll** — Columnas: `Keyword | Archivo | Duración | Estilo`. Defaults: `Duración = 3.0s`, `Estilo = monitor-photo`. **Videos (.mp4/.mov/.webm)** → fullscreen con `object-fit: cover`; el estilo `monitor-photo` añade `rotate(-1.2deg)` + gradiente radial blanco al 8%. **Imágenes (.png/.jpg/.gif)** → se renderizan en la parte inferior (`bottom: 520`), centradas, a **900 px fijos** — la tabla de B-roll no tiene columna `Ancho`, a diferencia de la de Overlays. Igual que los overlays, nunca tapan la cara. El header **sigue visible** sobre el B-roll mientras esté en su ventana (≤ `hideAfter`).

### Sincronización por keyword

Cada cue resuelve su `t_start` así:
```
t_start = findKeywordTime(transcript, keyword) + (startOffset || 0)
t_end   = t_start + duration
```

`findKeywordTime` normaliza (lowercase, sin acentos, sin puntuación) y busca la primera coincidencia parcial en el transcript. Si la keyword no aparece, el cue se descarta silenciosamente (y `manifest_to_cues.py` ya habrá avisado con `[warn]`).

**Dos trampas que ya mordieron a dos implementadores, por no ser obvias al escribir un MANIFEST:**

1. **La keyword engancha otra palabra por substring.** El match es "contiene",
   no palabra completa — una keyword corta como `es` matchea dentro de
   `esto`, `eso`, `estamos`, y el cue dispara ahí en vez de donde la
   escribiste pensando. Usa keywords distintivas (frases de 2-3 palabras, no
   una sola palabra corta y común).
2. **El overlay dura menos del mínimo visible y el filtro lo elimina.** Si un
   overlay choca con un `## Énfasis` y, tras desplazarlo, le quedan menos de
   1.2s despejados, se descarta por completo — sin ningún `[warn]`, porque su
   keyword sí matcheó. Si un overlay "no aparece" en el render y su keyword
   está bien escrita, revisa si un énfasis se lo está comiendo.

### Reglas de oro de la composición

1. El **header funciona como gancho** — vive los primeros 8s (default) y luego se quita. Si se necesita persistente, override con `Esconder después: 0` en el MANIFEST.
2. **Emphasis excluye overlay** — el énfasis (`bottom: 220`) y el overlay (`bottom: 520`) viven ambos en el tercio inferior; si coinciden en un frame compiten por la atención visual; gana el emphasis y el overlay se oculta con `opacity: 0` durante toda la ventana de emphasis solapada.
3. **La cara de quien habla queda libre** — ni emphasis ni overlays se renderizan en la mitad central del frame.
4. **Subtítulos según el formato.** `fullscreen` y `noticiero` los mantienen apagados por default; `split`, `pip` y `faceless` los traen encendidos (ver `### Subtítulos` abajo). Se fuerzan con `**Subtítulos:** on|off` en el MANIFEST.
5. **Sentence case** en cajas blancas — NUNCA all caps.

### Subtítulos

Ya no están desactivados de forma global: cada formato define si los trae
encendidos (ver `## Catálogo de formatos`). `fullscreen` los mantiene
**apagados** por default, así que los reels de cara siguen comportándose como
siempre.

Se fuerzan en cualquier sentido con `**Subtítulos:** on|off` en el MANIFEST.

Se agrupan de a 3 palabras y cortan antes si hay una pausa mayor a 0.6s, así el
subtítulo respeta la respiración. La palabra que coincide con una keyword de
`## Énfasis` se resalta con una caja de color (`cajaFondo`/`cajaTexto` del
tema — en `crema-editorial` es el amarillo marcador), no con el acento.

El color y trazo del texto del subtítulo son tokens propios del tema
(`captionTexto`/`captionTrazo` en `temas.ts`), separados de `texto`/
`trazoTexto` porque el subtítulo no siempre cae sobre el mismo fondo que el
resto del tema: en `split`, el subtítulo (`SEAM_TOP = 800`) cae **sobre el
panel de video**, no sobre el papel crema, así que `crema-editorial` usa
blanco con trazo negro para el subtítulo aunque su texto normal (`texto`)
sea casi negro y sin trazo.

---

## Clips de apoyo generados (Clip Director) — opcional, antes del render

Paso opcional para **generar B-roll a medida del guion** con IA (Higgsfield) e inyectarlo al
MANIFEST, en vez de solo cazar recursos sueltos con `recursos-de-video-formula100k`. Usa el
**Clip Director**, el mismo motor que `reel-faceless-f100k`.

**Cuándo:** el usuario dice "genera clips de apoyo", "b-roll a medida del guion", "clips
generados para este video", o tras transcribir un video **16:9** largo (YouTube) que necesita
apoyo visual en conceptos/datos/ejemplos.

**Cómo (auto-propone → el usuario aprueba):**

1. **Transcript.** Requiere `captions.json` (ya lo produce el Paso 1 del pipeline). Si aún no
   existe, correr primero el corte/transcripción, o usar el guion.
2. **Invocar el Clip Director** siguiendo `../reel-faceless-f100k/reference/clip-director.md`
   con `modo=support`, `formato=16:9`. El Director lee `captions.json`, detecta los momentos
   que piden apoyo (concepto/dato/ejemplo → `visual_type`) y **auto-propone** un plan donde
   cada segmento trae un `keyword` **verbatim** del transcript (8-15 palabras) como ancla.
3. **Aprobación.** Mostrar la tabla propuesta y preguntar con `AskUserQuestion`:
   "¿Genero estos N clips de apoyo? / ajustar algunos / ninguno". El usuario puede agregar o
   quitar marcas.
4. **Generar.** Higgsfield `generate_video` con `aspect_ratio="16:9"` (lotes ≤8, poll
   `job_status(sync:true)`, declinar presets, anti-NSFW — ver la receta `broll` del reference).
   Descargar a `$DEST/IA/broll_generado/clipNN.mp4`:
   `curl -L "<url>" -o "$DEST/IA/broll_generado/clipNN.mp4"`.
5. **Inyectar al MANIFEST.** Añadir una fila por clip a la sección `## B-roll` del MANIFEST
   (formato exacto en "Formato del MANIFEST.md" abajo):

   ```markdown
   ## B-roll
   | Keyword                          | Archivo                          | Duración | Estilo        |
   |----------------------------------|----------------------------------|----------|---------------|
   | los tres errores que cometía     | IA/broll_generado/clip01.mp4     | 4s       | monitor-photo |
   ```

   Si la sección `## B-roll` no existe en el MANIFEST, crearla con ese encabezado. La keyword
   debe existir en `captions.json` (el parser avisa con `[warn]` si no).
6. **Render normal.** Continuar con el pipeline de abajo: `manifest_to_cues.py` resuelve las
   keywords y el render coloca cada clip como B-roll fullscreen por su ventana y vuelve a la
   cara de quien habla (regla de B-roll existente — los clips son **apoyo**, no reemplazan la toma).

**Degradación:** si `mcp__higgsfield__balance` es 0, el Director degrada a cards/pixel o
sugiere cazar recursos reales con `recursos-de-video-formula100k` (ver reference §6). No falla.

---

## Atajos conversacionales

- `/render <carpeta>` → pipeline completo. Auto-detecta el video fuente desde `**Video fuente:**` del MANIFEST. **Antes de renderizar siempre corre el Paso 0** (confirmación de gancho textual con 3 variantes).
- `/edita <carpeta>` → equivalente.
- `/render <carpeta> --skip-hook` → saltea el Paso 0. Úsalo cuando el usuario ya confirmó el header en una invocación previa de esta misma sesión, cuando explícitamente dijo "renderiza tal cual", o cuando se está iterando solo sobre énfasis/overlays sin tocar el header.
- `/render <carpeta> --skip-formato` → saltea el Paso 0.5. Úsalo cuando el MANIFEST ya trae `**Formato:**` declarado y el usuario dijo "renderiza tal cual", o cuando se está iterando sin cambiar de formato.
- `/setup` → corre el bootstrap correspondiente a la plataforma para instalar/verificar dependencias (`bootstrap.sh` en Mac, `bootstrap.ps1` en Windows).

Para invocación natural ("edita este video"), preguntar al usuario por la carpeta DEST si no es obvia y luego correr el Paso 0 antes del pipeline. La skill detecta la plataforma automáticamente: en Mac llama `render.sh`, en Windows llama `render.ps1`. El usuario no necesita elegir.

---

## Iteración

**Cambiar un cue:**
1. Editar la fila correspondiente en `MANIFEST.md` (cambiar keyword, texto, duración, o el archivo)
2. Re-correr `render.sh` (el corte se saltea porque `_source_cut.mov` ya existe; el render reusa los assets de `public/`)

**Re-cortar con regla diferente** (más/menos agresivo, otros fillers, etc.):
1. Opciones rápidas vía flags al invocar `cut_silences_and_fillers.py` manualmente:
   - `--min-silence 0.05` para cortar aún más apretado (default 0.08)
   - `--min-silence 0.15` para más respiración entre frases
   - `--pad 0.09` si todavía sientes que se cortan las colas de las palabras (default 0.06)
   - `--pad 0.03` si quieres un ritmo más apretado (sacrificando algo de naturalidad)
   - `--no-dedupe` si querés conservar repeticiones intencionales ("muy, muy bueno")
   - `--dedupe-max-gap 0.6` para colapsar solo repeticiones muy seguidas
2. Para cambiar la lista de muletillas: editar `FILLER_REGEX` en el script
3. Borrar `_source_cut.mov` y `captions.json` del DEST
4. Re-correr `render.sh` (re-genera el corte y los captions, los keywords se re-resuelven contra el nuevo transcript)

**Cambiar estética visual** (tamaños, posiciones, animaciones, fuente):
1. Editar `remotion-template/src/CreaContenidoViral.tsx`
2. Re-correr `render.sh` (saltea corte, regenera cues + render)

**Probar un solo cambio en cues sin re-bundlear nada de Python:**
```bash
cd ~/.claude/skills/editor-video-formula100k/remotion-template
npx tsx scripts/render.ts \
  --video _source_cut.mov \
  --transcript "$DEST/captions.json" \
  --cues "$DEST/cues.json" \
  --out "$DEST/BORRADOR_AUTO.mp4"
```

---

## GOTCHAS conocidos de `CreaContenidoViral.tsx` — NO repetir

> **Historial:** bugs encontrados en producción (2026-06-05). Ambos ya corregidos en el TSX. Si en el futuro se refactoriza el template, respetar estas reglas.

### ❌ NUNCA poner `<Header>` dentro de una `<Sequence>` de B-roll

**Bug:** si agregas `<Header .../>` dentro de la Sequence de cada b-roll (para asegurar que el header sea visible encima de las imágenes), el header **reaparece en cada b-roll** aunque ya haya pasado el `hideAfter`. Causa: dentro de `<Sequence>`, `useCurrentFrame()` devuelve el frame **relativo** al inicio de la Sequence (empieza desde 0), no el frame global. Entonces `frame/fps = 0 < hideAfter=8` → siempre verdadero → header visible en cada imagen.

**Fix correcto:** el `<Header>` existe UNA SOLA VEZ fuera de todas las Sequences (CAPA 1 en el JSX raíz). Ahí `useCurrentFrame()` sí devuelve el frame global y el `hideAfter` funciona correctamente.

### ❌ NUNCA dejar que dos entradas de B-roll se solapen en tiempo

**Bug:** si `broll[i].end > broll[i+1].start`, ambos `BrollLayer` se renderizan simultáneamente con sus imágenes en `bottom: 520` → se superponen visualmente.

**Fix correcto:** `resolveBroll` ya incluye un paso de sort + clamp al final:
```typescript
for (let i = 0; i < resolved.length - 1; i++) {
  if (resolved[i].end > resolved[i + 1].start) {
    resolved[i] = {...resolved[i], end: resolved[i + 1].start};
  }
}
```
Al editar el TSX, asegurarse de que este clamp persista.

### ⚠️ `--mode tutorial` (`scripts/render.ts`) ahora renderiza los captions cinéticos en MAYÚSCULAS

**Cambio de comportamiento, no un bug — pero nadie lo declaró.** Al mudar los
subtítulos de `TutorialFaceless.tsx` a la capa compartida `layers/Captions.tsx`
(reuso con `fullscreen`/`split`/`pip`), el componente que se borró **no** tenía
`textTransform: uppercase`; el compartido **sí** lo aplica siempre, sin forma
de apagarlo por prop. Cualquier render que use `--mode tutorial` (la ruta que
consume `reel-faceless-f100k`, documentada en el docstring de
`scripts/render.ts`) ahora muestra los captions en mayúsculas donde antes
salían en el casing original del transcript. Si algo consumía ese output
esperando el casing anterior, hay que ajustarlo ahí — este pipeline no expone
`--mode tutorial` desde su propio flujo de MANIFEST (ver `## Catálogo de
formatos`: `render.py` nunca pasa `--mode`).

---

## Errores y fallbacks

| Error | Acción |
|-------|--------|
| (Mac) `bootstrap.sh` reporta Homebrew faltante | Instalar Homebrew con el comando oficial y reintentar |
| (Win) `bootstrap.ps1` reporta winget faltante | Instalar/actualizar "App Installer" desde Microsoft Store y reabrir PowerShell |
| (Mac) `bootstrap.sh` falla al instalar Remotion (npm cache corrupto) | El script usa `--cache=/tmp/npm-cache-<user>`. Si persiste: `sudo chown -R 501:20 ~/.npm` o borrar `~/.npm` |
| (Win) `node` o `python` no se reconocen después de bootstrap | Cerrar PowerShell y abrir una ventana nueva para que el PATH se actualice |
| `manifest_to_cues.py` reporta keywords sin match | La keyword no aparece en `captions.json`. Editar el MANIFEST con una palabra que sí esté en el transcript |
| `semantic OFF: falta ANTHROPIC_API_KEY` | El pase por comprensión se saltó. Exportar `ANTHROPIC_API_KEY` y re-correr (borrando antes `_source_cut.mov` y `captions.json`) para activar el corte semántico |
| `semantic: la llamada a Claude falló` | Red caída o key inválida. El render sigue con el motor local. Verificar conexión / key y re-cortar si querés el pase semántico |
| `semantic: Claude propuso borrar >40%` | Sugerencia descartada por el guard de seguridad. Si el video de verdad tiene mucho descarte, subir `--semantic-max-drop` (ej. `0.6`) y re-cortar |
| Remotion falla con "Can only download URLs starting with http:// or https://" | El path del asset salió de `public/`. Verificar que `WEB/`/`IA/` y `_source_cut.mov` estén linkeados/copiados al template (lo hace `render.py`) |
| Carpeta destino sin `MANIFEST.md` | Necesita correr antes `recursos-de-video-formula100k` o armar el MANIFEST a mano |

---

## Estructura de archivos generados (en $DEST)

```
$DEST/
├── MANIFEST.md              ← editado por el usuario (no se modifica en render)
├── CANVAS/                  ← opcional, sólo formato pip: screen recording del lienzo
├── _source_cut.mov          ← video cortado (sin silencios/muletillas)
├── edl.json                 ← mapping orig→nuevo tiempo (debugging)
├── captions.json            ← word-timestamps del video cortado
├── cues.json                ← input para Remotion (regenerado cada render)
├── BORRADOR_AUTO.mp4        ← OUTPUT FINAL
├── WEB/                     ← recursos web (no se toca)
└── IA/                      ← recursos generados con IA (no se toca)
```

---

---

## Motion Graphics Nativos — Remotion (Nueva Opción)

El template de Remotion incluye 4 composiciones standalone listas para usar como overlays, intros o B-roll animado. No requieren HyperFrames ni dependencias adicionales — ya están compiladas dentro del template.

### Las 4 composiciones

| ID | Componente | Props principales | Duración | Mejor para |
|----|-----------|-------------------|----------|-----------|
| `motion-badge` | `BadgeSlide` | `badgeNumber`, `title`, `subtitle?`, `accentColor?` | 90f (3s) | Intro de punto numerado, paso de tutorial |
| `motion-stat` | `StatCounter` | `value`, `label`, `suffix?`, `accentColor?` | 60f (2s) | Métricas, logros, números impactantes |
| `motion-quote` | `QuoteCard` | `quote`, `author?`, `accentColor?` | 90f (3s) | Testimonios, frases de autoridad |
| `motion-list` | `ListReveal` | `items[]`, `title?`, `accentColor?` | 30+12×n frames | Beneficios, pasos, listas de resultados |

### Cómo renderizar

```bash
cd ~/.claude/skills/editor-video-formula100k/remotion-template

# Badge numerado
npx tsx scripts/render.ts \
  --composition motion-badge \
  --props '{"badgeNumber": 1, "title": "Este método cambia todo", "subtitle": "F100K"}' \
  --out "$DEST/IA/badge-overlay.mp4"

# Contador animado
npx tsx scripts/render.ts \
  --composition motion-stat \
  --props '{"value": 50000, "label": "seguidores ganados", "suffix": "+"}' \
  --out "$DEST/IA/stat-overlay.mp4"

# Cita con wipe
npx tsx scripts/render.ts \
  --composition motion-quote \
  --props '{"quote": "El contenido que vende no es el más bonito, es el más claro.", "author": "Andrea Vega"}' \
  --out "$DEST/IA/quote-overlay.mp4"

# Lista reveal (duración auto según numero de items)
npx tsx scripts/render.ts \
  --composition motion-list \
  --props '{"title": "Lo que vas a aprender", "items": ["Crear contenido que vende", "Automatizar con IA", "Construir tu comunidad"]}' \
  --out "$DEST/IA/list-overlay.mp4"
```

> Para todos los clips motion nativos usar `Ancho: 1080` y `Duración` = duración del clip en el MANIFEST.

### Principios de animación (Emil Kowalski)

Todas las composiciones siguen estas reglas que producen motion UI de alta calidad:
- Solo se animan `transform` y `opacity` — nunca `width`/`height` directamente
- Spring values para UI: stiffness 280-320, damping 26-32 (sin bounce exagerado)
- Máximo 300ms por transición individual de UI
- Entradas con ease-out feel (spring que decelera suavemente)
- Sin `ease-in` — se siente abrupto al espectador

### HyperFrames vs Remotion nativo — cuándo usar cada uno

| Aspecto | HyperFrames | Remotion nativo |
|---------|-------------|-----------------|
| Setup | Node >= 22, `npx hyperframes` | Ya instalado en el template |
| Estilos visuales | 8 temas predefinidos (Swiss Pulse, Velvet, etc.) | 4 composiciones optimizadas para reel |
| Flexibilidad | Alta — cualquier HTML/CSS/GSAP | Media — props definidas por composición |
| Velocidad de render | Headless browser (Puppeteer) | Render nativo React + Remotion |
| Mejor para | Diseños custom complejos, mockups, tipografía cinética | Badges, stats, quotes, listas |

### Técnicas de motion disponibles (todas las opciones)

| Técnica | Herramienta | Comando |
|---------|-------------|---------|
| Badge numerado deslizante | Remotion nativo | `--composition motion-badge` |
| Contador animado | Remotion nativo | `--composition motion-stat` |
| Cita con wipe horizontal | Remotion nativo | `--composition motion-quote` |
| Lista reveal con stagger | Remotion nativo | `--composition motion-list` |
| Typing effect | HyperFrames | `npx hyperframes render` |
| Browser mockup con pasos | HyperFrames | `npx hyperframes render` |
| CSS 3D card flip | HyperFrames | `npx hyperframes render` |
| Partículas procedurales | HyperFrames | `npx hyperframes render` |
| Audio-reactive | HyperFrames | `npx hyperframes render` |

---

## Motion Graphics Animados — HyperFrames (Opción Extra)

En lugar de imágenes estáticas como overlays, se puede generar un clip `.mp4` animado con HyperFrames. Estos clips son 1080×1920 (9:16) y se usan exactamente igual que cualquier otro overlay o B-roll en el MANIFEST.

### Cuándo usar HyperFrames vs imagen estática

| Imagen estática (default) | Clip HyperFrames animado |
|--------------------------|--------------------------|
| El recurso ya está generado | Quieres entrada animada |
| Cue simple: aparece y desaparece | Badge/título que desliza desde la izquierda |
| Pixel avatar, screenshot de app | Browser mockup con pasos en cascada |
| | Contador que sube de 0 al valor final |
| | Texto que se escribe solo (typing effect) |
| | Cualquiera de los 8 estilos visuales |

### Prerequisito

```bash
node --version  # necesita Node.js >= 22
# No instalar nada más — se usa via npx hyperframes
```

### Flujo para generar un clip animado

1. Editar `~/Documents/f100k-overlays/index.html` con el contenido del overlay (o crear nuevo proyecto)
2. Previsualizar: `npx hyperframes preview`
3. Renderizar: `npx hyperframes render --output $DEST/IA/nombre-overlay.mp4`
4. Agregar al MANIFEST:

```markdown
## Overlays

| Keyword | Archivo | Ancho | Duración |
|---------|---------|-------|----------|
| claude  | IA/badge-overlay.mp4 | 1080 | 8.0 |
```

> Para clips HyperFrames usar `Ancho: 1080` y `Duración` = duración exacta del clip.

### 8 estilos visuales disponibles

| Estilo | Mood | Mejor para |
|--------|------|-----------|
| Swiss Pulse | Clínico, preciso | SaaS, datos, métricas |
| Velvet Standard | Premium, atemporal | Lujo, empresarial |
| Deconstructed | Industrial, raw | Tech, glitch, punk |
| Maximalist Type | Ruidoso, cinético | Lanzamientos, hype |
| Data Drift | Futurista, inmersivo | IA, ML, tech |
| Soft Signal | Íntimo, cálido | Wellness, historias personales |
| Folk Frequency | Cultural, vívido | Comunidad, consumidor |
| Shadow Cut | Oscuro, cinemático | Revelaciones dramáticas |

### Prompts rápidos

**Badge + título (el estilo del reel de referencia):**
```
Usando HyperFrames, crea overlay 1080×1920 con badge naranja (#F59E0B)
"#1 Skill de Claude Code", título blanco "Esta herramienta cambia todo",
badge entra desde la izquierda expo.out, título sube con fade. Duración 8s.
Fondo #0d0d0d. Guarda en ~/Documents/f100k-overlays/ y renderiza el .mp4.
```

**Browser con 3 pasos:**
```
Usando HyperFrames, crea overlay 1080×1920 con browser mockup oscuro.
3 pasos numerados con badges amarillos que aparecen cada 0.8s.
URL: "formula100k.app/skills". Duración 10s. Fondo #0d0d0d.
```

---

## Diferencias con otras skills

| Aspecto | recursos-de-video | editor-video (esta) | graficos-de-video |
|---------|-------------------|---------------------|-------------------|
| Output principal | MANIFEST.md + WEB/ + IA/ | BORRADOR_AUTO.mp4 | PNG scrapbook sueltos |
| Necesita MANIFEST | ❌ (lo genera) | ✅ (lo consume) | ❌ |
| Necesita Remotion | ❌ | ✅ | ❌ |
| Edita video | ❌ | ✅ | ❌ |
| Caza web | ✅ | ❌ | ❌ |
| Tiempo típico | 3-8 min | 4-8 min | 1-2 min |
