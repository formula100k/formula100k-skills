---
name: analisis-video-viral-f100k
description: Ingeniería inversa de UN video viral concreto a partir de su URL (Instagram Reel o TikTok). Descarga el video real, lo transcribe con Whisper, extrae los frames y desglosa la estructura segundo a segundo — tríada de gancho, bloques con timestamps, estructura madre del catálogo de 34, pilar de valor, reparto del tiempo, movimientos replicables y plantilla lista para copiar. Usar SIEMPRE que alguien diga "analiza la estructura de este video", "desglosa este viral", "por qué funcionó este reel", "ingeniería inversa de este video", "qué hizo bien este video", "analízame este link", "estúdiame este reel", o pase una URL de IG/TikTok con intención de entender su arquitectura. NO usar para buscar referencias por keyword (analizador-referencias-virales-f100k), auditar una cuenta entera (analizador-perfiles-formula100k) ni escribir un guion nuevo (guionizacion-formula100k).
argument-hint: [URL de Instagram Reel o TikTok]
disable-model-invocation: false
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

# Análisis de Virales — Ingeniería Inversa

Toma **una URL** y devuelve el desglose estructural completo del video. El entregable es un análisis en chat (markdown), no un archivo, salvo que el usuario pida lo contrario.

## ⛔ Regla número uno

**NUNCA analices un video que no descargaste.** Nada de deducir la estructura del caption, del thumbnail, del título o de "lo que suelen hacer estos videos". Si la descarga falla, dilo y para — no rellenes con suposiciones.

Todo dato que aparezca en el entregable (vistas, likes, timestamps, frases textuales) tiene que venir de la extracción real de los pasos 1-4.

---

## PASO 1 — Metadata

**Instagram:**
```
mcp__apify__call-actor
  actor: "apify/instagram-scraper"
  input: {"directUrls": ["<URL>"], "resultsType": "posts", "resultsLimit": 1, "addParentData": false}
  waitSecs: 45
```
Luego `mcp__apify__get-dataset-items` con:
```
fields: url,ownerUsername,ownerFullName,caption,videoDuration,videoPlayCount,
        videoViewCount,likesCount,commentsCount,timestamp,videoUrl,productType,
        musicInfo.song_name,musicInfo.artist_name,musicInfo.uses_original_audio,
        hashtags,alt,coauthorProducers.username
```

**TikTok:** usar `clockworks/tiktok-scraper` con `{"postURLs": ["<URL>"]}`.

⚠️ El `videoUrl` de Instagram **caduca en pocas horas**. Descarga inmediatamente después de extraerlo.

## PASO 2 — Descarga

Trabaja siempre en el scratchpad de la sesión, nunca en el directorio del usuario:
```bash
mkdir -p <SCRATCH>/viral && cd <SCRATCH>/viral
curl -s -o reel.mp4 "<videoUrl>"
ls -la reel.mp4    # verifica que pese >1MB; si pesa poco, la URL caducó
```
Si falla, alternativa: `yt-dlp "<URL del post>" -o reel.mp4` (funciona bien para TikTok).

## PASO 3 — Transcripción (en background)

```bash
whisper reel.mp4 --model small --output_format srt --output_dir .
```
Lánzalo con `run_in_background: true` y sigue con el paso 4 mientras corre. Añade `--language es` o `--language en` si ya sabes el idioma (es más rápido y preciso).

**Si el SRT sale vacío, con 2-3 líneas sueltas o puro ruido** ("I", "you", "Omg"), el video **no tiene narración**. Eso no es un error: es el hallazgo más importante del análisis. Cámbiate a modo 100% visual y dilo explícitamente en el entregable.

## PASO 4 — Frames y contact sheets

```bash
mkdir -p frames sheets
ffmpeg -y -loglevel error -i reel.mp4 -vf "fps=1,scale=460:-1" frames/f_%03d.jpg
# hojas de contacto de 16 frames cada una
for i in 1 17 33 49; do
  ffmpeg -y -loglevel error -start_number $i -i frames/f_%03d.jpg -frames:v 1 \
    -vf "tile=4x4:padding=6:color=white" sheets/sheet_$i.jpg
done
```
Luego **lee cada sheet con la tool Read**. Se leen izquierda→derecha, fila por fila: en `sheet_1` la casilla 1 es el segundo 1, la 16 es el segundo 16.

> `drawtext` no está disponible en el ffmpeg de esta máquina — no intentes numerar los frames con él, cuenta por posición.

**Extras opcionales, solo si aportan:**
```bash
# rango dinámico del audio (detecta silencios dramáticos y picos de sound design)
ffmpeg -i reel.mp4 -af "astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-" -f null - 2>/dev/null | grep -E "pts_time|RMS_level" | paste - - | awk 'NR%20==1'
# cortes de escena
ffmpeg -i reel.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep -o "pts_time:[0-9.]*"
```

## PASO 5 — Diagnóstico estructural

Con el SRT y los frames delante, resuelve estas seis preguntas **antes** de escribir nada:

1. **¿Verbal o visual?** ¿El peso lo lleva lo que se dice o lo que se ve? Un video sin narración se analiza por ritmo de corte, no por frases.
2. **¿Cuál es la tríada del gancho?** Qué se DICE / qué se MUESTRA / qué se LEE en los primeros 2 segundos. Los tres tienen que comunicar lo mismo.
3. **¿Dónde están los loops?** Marca el segundo exacto en que se abre cada pregunta sin responder y el segundo en que se cierra. Si hay loops anidados, dibújalos.
4. **¿Cuál es la estructura madre?** Elige UNA del catálogo de 34 en `~/.claude/skills/guionizacion-formula100k/references/estructuras.md` + los injertos secundarios.
5. **¿Cuál es el pilar de valor?** UNO de los 7 (Revelación, Utilidad Práctica, Validación Emocional, Desafío, Actualidad, Curaduría, Disrupción).
6. **¿Por qué métrica está optimizado?** Cruza las métricas reales:

| Señal | Cálculo | Qué indica |
|---|---|---|
| Tasa de like | likes ÷ vistas | 3-5% normal · >6% excepcional |
| Tasa de comentario | comentarios ÷ vistas | >0.1% conversación · <0.02% optimizado a guardado/compartido |
| Replays | reproducciones ÷ vistas | >1.6 = lo vieron más de una vez (loop o densidad visual) |

👉 Cuando la tasa de comentario es baja **y el CTA no pide comentario**, no es un fallo: es un canje deliberado. Nómbralo como canje, no como error.

## PASO 6 — Entregable

Sigue esta plantilla al pie de la letra. Español neutro. Emojis solo en encabezados, con moderación.

````markdown
# 📌 Ficha del video
Tabla: cuenta · fecha · duración · reproducciones · vistas · likes (+ % sobre vistas) ·
comentarios (+ %) · audio · formato. Una línea con el tema en cristiano.

# 🧬 Estructura madre
Estructura #N del catálogo + injertos. **Pilar de valor: [1 de los 7]** + justificación de 1 frase.

# ⏱️ Desglose paso por paso
Un bloque por unidad narrativa. Cada uno lleva:
### [emoji] BLOQUE N — Nombre del movimiento (0:00 – 0:00) · X% del video
> Frase textual del video (si hay audio) / descripción del plano (si es visual)
Qué hace, capa por capa. Cierra con 👉 **La jugada:** una línea con el mecanismo.

# 📊 Reparto del tiempo
Barras ASCII con el % de cada fase. Debajo, la regla que se deduce del reparto.

# 🎯 Los N movimientos replicables
Lista numerada, cada uno accionable. Nada de "usa un buen gancho".

# ⚠️ El canje que hizo
Qué sacrificó y a cambio de qué. Cómo cambiarlo si el objetivo del usuario es otro.

# 📋 Plantilla lista para reusar
Bloque de código con los tiempos y qué va en cada uno, agnóstico de nicho.
````

Cierra ofreciendo el siguiente paso: adaptarlo al nicho con `guionizacion-formula100k`, o calibrarlo con `calibrador-guion-andrea` si es para Andrea.

---

## Cómo se ve un buen análisis

**Flojo:** "Tiene un gancho fuerte y buen ritmo."
**Bueno:** "Segundo 0-2: afirmación-tesis de 5 palabras + el contador de 1.3M ya visible en el PiP. La prueba social entra antes que el argumento."

**Flojo:** "Usa storytelling."
**Bueno:** "Loop A (¿cómo recupera el arete?) se abre en s2 y cierra en s13. Loop B (¿qué psicología?) se abre en s18 y cierra en s33. Nunca hay un momento sin pregunta abierta."

**Flojo:** "Tuvo mucho engagement."
**Bueno:** "99K likes sobre 1.4M vistas = 7%, pero 139 comentarios = 0.01%. Mandó el CTA al caption en vez de a los comentarios: canjeó conversación por guardado."

Reglas de redacción:
- Cita el video **verbatim** cuando haya audio. Nada de parafrasear el gancho.
- Todo bloque lleva timestamps reales del SRT o del conteo de frames.
- Cuenta los porcentajes, no los estimes a ojo.
- Si algo no se puede saber con lo extraído (ej. retención real, si es contenido pagado), dilo. No lo inventes.

## Casos especiales

| Caso | Cómo tratarlo |
|---|---|
| **Sin narración** (DIY, ASMR, satisfying, trends) | El análisis es de ritmo visual: mide cada cuántos segundos cambia el plano y qué promesa sostiene el frame. El gancho es 100% visual + textual. |
| **Video de reacción o análisis de otro viral** | Hay DOS videos. Analiza cuántos segundos cede al material ajeno y qué gana con eso. |
| **A/B, versus o split-screen** | Mapea el ritmo de alternancia (cada cuántos segundos cambia de pista) y verifica si los cortes están emparejados por beat. |
| **Serie / episodio** | Busca el marcador de serie en el overlay y el CTA de continuidad ("sigue para el episodio 2"). Es una estructura distinta: optimiza seguidores, no vistas. |
| **Carrusel, no video** | Esta skill no aplica → usar `clonador-carrusel-formula100k`. |

## Límites

- **No inventes datos.** Si Apify no devuelve un campo, escribe "no disponible".
- **No adaptes el video al nicho de nadie** salvo que lo pidan. Esta skill analiza; guionizar es otra skill.
- **No dejes basura**: los archivos temporales viven en el scratchpad de la sesión, no en `~/Documents`.
- Cada corrida gasta una llamada de Apify (centavos) y unos minutos de CPU por Whisper. Para varios videos, corre los pasos 1-4 de cada uno antes de escribir cualquier análisis.
