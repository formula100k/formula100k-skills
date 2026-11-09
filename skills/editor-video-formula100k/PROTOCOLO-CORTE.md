# 🔴 PROTOCOLO DE CORTE OBLIGATORIO · todo video donde alguien habla

Vale para TODO video con voz, sea tuya, de una clienta o una voz clonada: reels, notitas, series de análisis, YouTube,
tutoriales, motion, memes, stop motion, telenovelas, cortos animados narrados. Ninguna skill de edición se salta esto,
ni siquiera si «ya venía cortado» o si «solo hay que sacar silencios».

Carpeta de scripts: `SK=~/.claude/skills/editor-video-formula100k/scripts`. Si instalaste por el plugin y esa carpeta no existe,
búscala con `find ~/.claude -path '*editor-video-formula100k/scripts/recortar.py'` (en Windows,
`Get-ChildItem $HOME\.claude -Recurse -Filter recortar.py`) y usa esa. Los `.py` se corren con `uv run` (Mac y Windows:
instala solo lo que cada uno necesita).

## Paso 0 · Preparar la toma (antes del corte)
- **60 o 120 fps → 30 fps** (`ffmpeg -i toma.mov -r 30 …`): si no, lo que se monta encima sale en cámara lenta.
- **Toma en espejo** (un letrero o un libro se lee al revés): `-vf hflip` en la base.
- **Toma bajita** (celular lejos, voz muy baja): `-af loudnorm=I=-16` en la base y RECIÉN ahí el corte. Cortar la toma cruda
  con un umbral alto se come los finales de frase; con uno muy bajo no saca las pausas.
- **Mucho ruido de fondo**: sube el umbral de silencio (de -38 a -32 dB).
- **Gancho que se monta aparte** (clips, collage, referencia): se separa y se corta solo la cola.

## Los 5 pasos (en orden, sin saltar ninguno)
1. **La skill de cortes, no un script suelto.** `node ~/.claude/skills/editor-video-formula100k/scripts/editar.mjs …` o
   `uv run $SK/cut_silences_and_fillers.py <video> <DEST>` con tu llave de Anthropic en `~/.editor-video/llave-anthropic.txt`
   para que corra el **pase semántico** (el que saca repeticiones y frases dichas dos veces).
   - Nivel `conservador` (el de por defecto) para análisis, series y YouTube. `--semantic-level ajustado` solo en reels de venta
     cortos, y **leyendo la lista de lo que borró**: el ajustado puede llevarse un nombre, un punto de la lista o el cierre.
     Si borra contenido, vuelve a conservador.
   - Sin llave, el pase semántico no corre: dilo en la entrega y haz el paso 2 con más cuidado.
2. **Leer la transcripción entera** (`captions.json`) como la oiría alguien que lo ve por primera vez y quitar a mano lo que
   el pase no vio: muletillas («o sea», «este», «no sé», «de alguna forma»), arranques fallidos, reformulaciones y frases
   repetidas con otras palabras: `uv run $SK/recortar.py <carpeta del corte> <ini-fin> [<ini-fin> …]`
   (cada borde va solo al silencio DENTRO del tramo que se quita, para no comerse sílabas).
3. **Escuchar tramo por tramo:** `uv run $SK/escuchar_corte.py <toma> <edl.json>`. Cada pieza transcrita SOLA tiene que
   empezar y terminar en palabra entera. Si un tramo quedó en media frase, se arregla antes de seguir.
4. **Oído Gemini sobre el corte y sobre el video FINAL** (opcional, si tienes llave gratis de https://aistudio.google.com/apikey
   en `~/.editor-video/llave-gemini.txt`): `uv run $SK/oido_gemini.py <corte.wav> oido.json` y
   `uv run $SK/oido_gemini.py <final.mp4> oido_final.json --final` (+ `uv run $SK/oido_mezcla.py <final.mp4>` para pitidos).
   Cada aviso se confirma en su unión y se arregla. Si no hay llave o da error, se dice en la PRIMERA línea de la entrega.
5. **Sello en la entrega** (NOTAS.md, una línea por video):
   `Protocolo de corte: skill (pase semántico <nivel>) ✅ · muletillas a mano: N ✅ · escuchar_corte ✅ · oído Gemini ✅ / ⚠️ no corrió (motivo)`.
   Sin esa línea el video no está terminado.

## Después del paso 3 · aire y anclas
- **Segundo pase de aire** sobre la base ya cortada y normalizada: `uv run $SK/apretar.py <carpeta> [--desde S]`
  (saca pausas sin partir palabras; `--desde` protege el gancho). Nunca en lugar del paso 1.
- **Regla de control:** un tramo de más de 5 s sin una sola unión = corte no hecho; se revisa.
- **Uniones:** `uv run $SK/revisar_uniones.py …` en ✅ (bordes en el silencio, sin palabras partidas).
- **Subtítulos y animaciones sobre el corte nuevo:** transcribe el corte otra vez con Whisper large-v3 (no reuses la
  transcripción vieja: los tiempos quedan corridos). Los subtítulos se corrigen a mano.

## Por qué
- Cortar por silencios solo saca aire: deja las repeticiones, los arranques en falso y las muletillas, que es lo que se oye.
- Whisper sobre el corte entero «arregla» las repeticiones y completa las sílabas mochas. Por eso se escucha tramo por tramo.
