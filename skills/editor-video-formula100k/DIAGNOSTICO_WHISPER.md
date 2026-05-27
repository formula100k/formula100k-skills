# Diagnóstico — Problemas de transcripción Whisper en `cut_silences_and_fillers.py`

Observados durante el render del video IMG_2211 (2026-05-18). Documentados aquí para que se ataquen de raíz, no con workarounds.

---

## Stack actual

- **Modelo:** `mlx-community/whisper-large-v3-mlx` vía `uvx mlx_whisper`
- **Idioma:** español, `--word-timestamps True`
- **Audio:** mono 16kHz extraído con ffmpeg
- **Pipeline:** transcribe original → cortar silencios → re-transcribir video cortado → captions.json final

---

## Problema 1 — Alucinación catastrófica en loop ("descargas y lo descargas...")

**Síntoma:** En la re-transcripción del video cortado, Whisper se trabó en un loop infinito de `"descargas y lo descargas y lo descargas..."` durante ~30 segundos (de los segundos 61 a 94). Reemplazó contenido real ("investiga me 20 reels virales en el nicho tomando en cuenta a esos referentes y va a entrar a la web por ti...") con la frase loop. Resultado: 419 palabras de las cuales ~120 eran ruido.

**Cascada de daño:**
1. La re-transcripción inyectó texto falso en `captions.json`.
2. El post-cut `phrase-dedupe` detectó el patrón repetitivo y "limpió" el video — pero al estar basado en captions falsos, recortó **45 segundos de contenido real** (114.48s → 69.14s).
3. Las keywords de overlays/énfasis que vivían en esa región (`virales`, `guiones`, `programadores`, `comenta`, `café`, `subir`) quedaron sin ancla y los overlays se descartaron silenciosamente.

**Causa raíz:** `mlx-whisper` corre por default con `condition_on_previous_text=True`. En audio con cadencia rítmica del español (Andrea habla rápido y con repetición de conectores "y... y..."), el decoder puede caer en un loop autoregresivo donde el output anterior alimenta más del mismo. Es un failure mode conocido del modelo Whisper de OpenAI, no específico de mlx.

**Síntoma característico:** una sola palabra o bigrama se repite >5 veces seguidas, con timestamps colapsando al mismo valor (varias palabras `@82.30s`).

**Fix aplicado (parche en línea 248 del script):**
```python
cmd = [
    'uvx', '--from', 'mlx-whisper', 'mlx_whisper', str(audio_path),
    '--model', 'mlx-community/whisper-large-v3-mlx',
    '--language', 'es',
    '--word-timestamps', 'True',
    '--output-format', 'json',
    '--output-dir', str(work_dir),
    '--condition-on-previous-text', 'False',   # ← clave
    '--temperature', '0',
    '--compression-ratio-threshold', '2.0',
    '--logprob-threshold', '-1.0',
    '--no-speech-threshold', '0.5',
    '--hallucination-silence-threshold', '1.0',
]
```

Resultado: 302 palabras limpias, 0 loops. Duration estable.

**Fix pendiente (más profundo):**
- Agregar validación post-transcripción: detectar runs de >5 palabras idénticas consecutivas o N palabras con el mismo timestamp y abortar/reintentar.
- Considerar transcribir en chunks de 30s con overlap en lugar del audio completo, para limitar contexto compartido.

---

## Problema 2 — Cola fricativa (-s, -ch, -f) cortada agresivamente

**Síntoma:** Andrea reportó que en el segundo 10-11 se cortaba la palabra "carísimas" sin la `-s` final. Lo mismo le pasa a "los", "es", "vez", etc. al final de frase.

**Causa raíz:** El sibilante `-s` en español tiene amplitud bastante menor que las vocales que lo preceden. El VAD (silero) lo clasifica como silencio y el `word_end` timestamp de Whisper cae ANTES del sibilante. Cuando `--pad` es chico (0.02-0.04), el corte sucede dentro del fricativo, eliminándolo.

**Caso específico:** Andrea dijo "suscripciones carísimas", Whisper transcribió "suscripciones carísima" (singular), porque para Whisper la `-s` final ya era silencio. El cut respetó eso y agarró la palabra de fonema en fonema sin las consonantes finales.

**Fix temporal:** subir `--pad 0.08` (80ms preservados después de cada word_end). Suficiente para fricativos de Andrea, sacrifica algo de densidad.

**Fix aplicado (2026-05-18):** pad adaptativo por fonema final. `_ends_in_fricative()` detecta palabras que terminan en `s`, `z`, `j`, `x`, `f` o el dígrafo `ch` (post-strip de puntuación) y a esas SOLO les suma `FRICATIVE_PAD_EXTRA = 0.04` en el end-pad. El resto del timeline mantiene el `--pad` del usuario sin inflar. Permite volver a defaults agresivos (`--pad 0.02`) sin volver a clipar colas sibilantes.

**Fix de raíz aplicado (2026-05-27):** *silence-snapping por envelope de energía.* En vez de confiar en `word_end+pad`, el script ahora lee la energía RMS real del audio (`load_energy_envelope`) y empuja CADA borde de corte al silencio sostenido más cercano (`_snap_end_forward` / `_snap_start_backward`), topado al punto medio del hueco con el segmento vecino para que no se solapen. El corte cae siempre en silencio sin importar el fonema final (s, d, n, vocal, l, r…), así que reemplaza el parche de fricativas (que queda solo como fallback si numpy/wave no están). Validado en IMG_2411: cortes cayendo sobre voz 13/17 → 4/17 (los 4 restantes son uniones de frases borradas, no clips). Flag `--no-snap` para desactivar.

---

## Problema 3 — Whisper pierde palabras al re-transcribir audio ya cortado

**Síntoma:** Palabras como `reels` (que en el audio original Andrea dice claramente) se transcriben como `reales` en la versión cortada. Resultado: la keyword `reels` no resuelve.

**Causa raíz:** Al cortar el audio con micropausas eliminadas, el contexto fonético cambia. Whisper depende fuertemente del contexto para deshacer ambigüedades (`reels` vs `reales` son foneticamente cercanos en español). Sin las pausas naturales que delimitan palabras, la decisión se sesga hacia palabras del léxico español genérico.

**Fix aplicado (2026-05-18):** `remap_words_via_edl(words, edl)` traslada las palabras post-dedupe del transcript original al timeline cortado usando el offset de cada segmento del EDL. Whisper sólo se corre UNA vez sobre el audio original; el video cortado nunca se re-transcribe. Beneficios:
- Mata el problema 1 (alucinaciones) en el camino del cut: no hay re-transcripción donde alucinar.
- Mata este problema (drift fonético).
- Estabiliza el dedupe (problema 4): trabaja sobre captions consistentes con el transcript original.
- Ahorra ~30s del pipeline (no más extracción de cut_audio + segunda corrida de mlx-whisper).

---

## Problema 4 — Post-cut phrase-dedupe basado en captions inestables

**Síntoma:** El dedupe descarta contenido real cuando los captions tienen alucinaciones (cascada del Problema 1). Pero también puede colapsar repeticiones LEGÍTIMAS de Andrea ("muy, muy bueno" → "muy bueno") sin pedir confirmación.

**Causa raíz:** Confía ciegamente en captions.json. Si captions miente, dedupe corta de más.

**Efectivamente resuelto por el fix 3 (remap por EDL):** ya no hay segunda corrida de phrase-dedupe sobre captions re-transcritos. El dedupe ahora corre UNA vez sobre el transcript original (estable) y los captions del cut son una proyección directa de esas decisiones. El failure mode "captions mentirosos → dedupe corta de más" desaparece estructuralmente.

**Pendiente (defensa en profundidad, baja prioridad):**
- Validación post-transcripción que detecte runs de >5 palabras idénticas consecutivas en el transcript ORIGINAL y aborte. Sería el último cinturón de seguridad si Whisper alucinara incluso con `--condition-on-previous-text False`.

---

## Recomendación priorizada

| # | Fix | Esfuerzo | Impacto | Estado |
|---|---|---|---|---|
| 1 | Flags anti-alucinación (`--condition-on-previous-text False` + temp/threshold guards) | 5 min | Crítico — evita loop catastrófico | ✅ Aplicado |
| 2 | Remap de captions vía EDL en lugar de re-transcribir | 1-2 h | Alto — elimina Problemas 1, 3 y 4 a la vez | ✅ Aplicado |
| 3 | Pad adaptativo según consonante final | 1 h | Calidad de cola de palabras (sin sacrificar densidad) | ✅ Aplicado |
| 4 | Validación post-transcripción (detectar loops antes del dedupe) | 30 min | Defensa en profundidad | ✅ Aplicado |
| 5 | Silence-snapping por envelope de energía (reemplaza pad fijo) | 2 h | Alto — corta siempre en silencio, mata clips de cola/onset | ✅ Aplicado (2026-05-27) |

`detect_hallucinations()` corre justo después de `transcribe_words()` y reporta runs de ≥6 tokens normalizados idénticos consecutivos o ≥5 palabras compartiendo timestamp (< 5ms de diferencia). Solo emite warning a stderr — el remap por EDL ya neutraliza el daño, este es el cinturón de observabilidad.
