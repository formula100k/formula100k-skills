---
name: explainer-youtube-f100k
description: "Crea videos explicativos (explainers) para YouTube 16:9 o vertical con dibujos sincronizados a la voz, cámara viva anti-PowerPoint, gráficas animadas y subtítulos opcionales usando HyperFrames + FFmpeg + Whisper. Usar con «hazme un video explicativo», «explainer para YouTube», «video estilo Kurzgesagt / Vox / 3Blue1Brown / pizarra narrada»."
argument-hint: "[tema, guion o audio] [opcional: estilo, duración, 16:9 o 9:16]"
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Glob, Grep
---

# Explainers para YouTube · FÓRMULA 100K

Crea videos explicativos narrados con cámara viva y dibujos/gráficos que aparecen al ritmo exacto de la voz, usando **únicamente las herramientas base de tu compu** (Node 18+, HyperFrames, Chrome, FFmpeg y Whisper — sin instalar motores extra de voz ni dependencias raras).

## Tu brandkit (antes de producir)
Si tienes brandkit, la pieza sale con tu identidad. Antes de empezar, búscalo (`mi-marca/brandkit.md`, `MI-MARCA/marca.md` o `~/Documents/mi-contenido/mi-marca/`). Aplica tu paleta de acento, tus tipografías y tu CTA sin romper la legibilidad del estilo elegido. Si no tienes brandkit, usa la paleta curada del estilo.

## Reglas que no se rompen
1. **Todo en español neutro y tuteo.** Nunca voseo ni jerga técnica que confunda a tu audiencia.
2. **Prohibido estilo PowerPoint.** Nunca hagas diapositivas que solo aparecen con `fade-in` / `fade-out`. Usa cámara viva sobre un lienzo continuo (`zoom` → `pan` → `settle` → empuje a la siguiente escena) o flujo continuo en parallax.
3. **Cuadro 0 con gancho visual (nunca vacío).** El primer cuadro ya muestra el sujeto, la cifra o el título clave (sirve como portada del video).
4. **Ritmo vivo: un cambio visual cada 3 a 5 segundos.** Cada dibujo, número o etiqueta entra exactamente cuando la voz lo nombra.
5. **Sin tembladera ni pitidos.** Nada de `shake`, `wiggle` ni sonidos agudos (> 3 kHz). Solo `whoosh`, `pop` o golpe sordo graves por debajo de la voz.
6. **Sin datos inventados.** Usa únicamente cifras, hechos o capturas reales del tema o de las fuentes que entregue el usuario.
7. **Revisión visual antes del render final.** Nunca entregues un MP4 sin haber sacado y revisado una hoja de fotogramas clave (que nada se corte, se encime ni quede medio cuadro vacío).

## Paso 0 · Una sola pregunta antes de construir
Si el usuario solo dice «hazme un explainer sobre X», pregunta **en un solo mensaje** solo lo que falte:
1. **Estilo** (recomienda uno según el tema; ver catálogo en `references/estilos-explainer.md`):
   - `papel-narrado` (dibujos al ritmo de la voz · ideal para enseñar una idea)
   - `periodismo-vox` (negro editorial + fotos/capturas + resaltador amarillo · ideal para casos y noticias)
   - `vector-kurzgesagt` (ilustración geométrica vibrante · ideal para conceptos y ciencia/negocio)
   - `pizarra-estudio` (pizarrón con tiza o estudio claro · ideal para tutoriales y pasos)
   - `datos-finanzas` (oscuro tipo 3Blue1Brown / finanzas · ideal para números y gráficas)
   - `catalogo-producto` (blanco con grilla + capturas reales · ideal para demos y lanzamientos)
   - `boceto-vintage` (papel sepia + grabados · ideal para historias y biografías)
   - `flujo-continuo` (escenario vector en movimiento continuo · ideal para procesos y comparaciones)
2. **Formato:** `16:9` (YouTube, por defecto) o `9:16` (Shorts/Reels).
3. **Duración aproximada:** `60 s` (por defecto), `90 s`, `3 min` o según guion.
4. **Voz:**
   - **Ya tengo audio grabado** (MP3/WAV/M4A) → sincronizamos palabra por palabra con Whisper.
   - **Grabo mi voz después** (por defecto) → armamos el video a ritmo de lectura y te entregamos el guion numerado por escena; cuando mandes tu audio, resincronizamos exacto.
   - **Voz generada por el usuario** (ElevenLabs u otro servicio que ya use) → se sincroniza igual que un audio grabado.

## Flujo de producción

### 1. Guion por escenas (`guion-vo.md`)
- Estructura simple: **Gancho (0–5 s)** → **Problema o contexto** → **2 a 4 bloques claros** → **Cierre + CTA**.
- Un párrafo = una escena o cambio de cámara.
- Escribe los números tal como se pronuncian si la persona los va a leer en voz alta.
- Si el usuario no tiene audio todavía, guarda `guion-vo.md` y muéstralo también al final del mensaje para que pueda grabarlo fácil.

### 2. Tiempos exactos de voz (si hay audio)
Si el usuario entregó audio (o voz clonada), obtén los tiempos palabra por palabra con Whisper local (el mismo que revisa *«¿Tu compu está lista?»*):
```bash
uvx --from faster-whisper python -c "..." # o mlx-whisper en Apple Silicon
```
Guarda `tiempos.json` con el segundo exacto de cada palabra clave (`at`) para amarrar cada animación a la frase exacta.

### 3. Mapa visual y aprobación del Cuadro 1
Antes de animar todo el video:
1. Define en 1 línea por escena: qué se ve, qué relación muestra (orden, comparación, partes de un todo o causa-efecto) y cómo entra la cámara.
2. Genera la composición en `index.html` partiendo de `templates/explainer-base.html` y el estilo elegido en `references/estilos-explainer.md`.
3. Captura y revisa el **Cuadro 1** (portada/gancho) + una **hoja de contacto** (1 fotograma por escena) usando Chrome headless o `hyperframes`:
   - Verifica legibilidad (texto mínimo 28 px en 1080p para que se lea incluso en celular).
   - Verifica que no haya textos cortados ni encimados.
   - Verifica que cada 3–5 s pase algo distinto.

### 4. Render final en MP4 (HyperFrames + FFmpeg)
1. Renderiza el video limpio desde el HTML con HyperFrames:
   ```bash
   npx hyperframes render index.html --output video-sin-audio.mp4 --fps 30 --width 1920 --height 1080
   ```
   *(Para vertical 9:16: `--width 1080 --height 1920`.)*
2. Si hay audio de voz (y opcionalmente música de fondo a `-24 dB` y efectos graves `whoosh`/`pop`), mezcla con FFmpeg:
   ```bash
   ffmpeg -y -i video-sin-audio.mp4 -i voz.wav -c:v copy -c:a aac -b:a 192k -shortest final.mp4
   ```
3. Si el usuario pidió subtítulos quemados, quémalos en español neutro sincronizados a `tiempos.json` sin tapar los gráficos principales.

### 5. Entrega
Entrega en la carpeta del proyecto (`~/Documents/mis-animaciones/explainer-<slug>/` en Mac o `~/mis-animaciones/explainer-<slug>/` en Windows):
- `final.mp4` (listo para subir a YouTube)
- `index.html` (editable en cualquier momento)
- `guion-vo.md` (y en el chat si falta grabar la voz)
- Una línea indicando qué aplicaste del brandkit (si existía) y la duración final.
