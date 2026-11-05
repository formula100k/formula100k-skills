# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "numpy",
#   "mlx-whisper; sys_platform == 'darwin' and platform_machine == 'arm64'",
#   "faster-whisper; sys_platform != 'darwin' or platform_machine != 'arm64'",
# ]
# ///
"""Transcribe un audio palabra por palabra, SIN contexto entre ventanas (con contexto Whisper entra en bucle).

uso: uv run --python 3.12 transcribir.py AUDIO.wav CARPETA_SALIDA [--desde s --hasta s] [--modelo grande|chico]
Deja CARPETA_SALIDA/<nombre del audio>.json con el formato de Whisper: segments[].words[] = {word, start, end}.
Mac con chip Apple → mlx-whisper (large-v3). Windows y Mac Intel → faster-whisper (large-v3 en CPU; --modelo chico = small, más rápido).
"""
import json, os, platform, subprocess, sys, tempfile


def audio_np(ruta):
    """El audio como numpy a 16 kHz, leído con ffmpeg (faster-whisper sin PyAV, que falla con algunas versiones)."""
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", ruta, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


a = sys.argv[1:]
if len(a) < 2:
    sys.exit(__doc__)
audio, salida = a[0], a[1]
op = lambda n, d=None: a[a.index(n) + 1] if n in a else d
desde, hasta, tam = op("--desde"), op("--hasta"), op("--modelo", "grande")
os.makedirs(salida, exist_ok=True)
nombre = os.path.splitext(os.path.basename(audio))[0]
fuente = audio
if desde or hasta:
    fuente = tempfile.mktemp(suffix=".wav")
    cmd = ["ffmpeg", "-nostdin", "-loglevel", "error", "-y"] + (["-ss", desde] if desde else []) + (["-to", hasta] if hasta else []) + ["-i", audio, "-ac", "1", "-ar", "16000", fuente]
    subprocess.run(cmd, check=True)

apple = platform.system() == "Darwin" and platform.machine() == "arm64" and os.environ.get("F100K_TRANSCRIPCION") != "faster"
if apple:
    import mlx_whisper
    r = mlx_whisper.transcribe(fuente, path_or_hf_repo="mlx-community/whisper-large-v3-mlx" if tam == "grande" else "mlx-community/whisper-small-mlx",
                               language="es", word_timestamps=True, condition_on_previous_text=False,
                               hallucination_silence_threshold=2)
    segs = [{"start": s["start"], "end": s["end"], "text": s["text"],
             "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in s.get("words", [])]} for s in r["segments"]]
    motor = "mlx-whisper"
else:
    from faster_whisper import WhisperModel
    m = WhisperModel("large-v3" if tam == "grande" else "small", device="cpu", compute_type="int8")
    it, _ = m.transcribe(audio_np(fuente), language="es", word_timestamps=True, condition_on_previous_text=False,
                         vad_filter=False, hallucination_silence_threshold=2)
    segs = [{"start": s.start, "end": s.end, "text": s.text,
             "words": [{"word": w.word, "start": w.start, "end": w.end} for w in (s.words or [])]} for s in it]
    motor = "faster-whisper"
if fuente != audio:
    os.remove(fuente)
off = float(desde or 0)
for s in segs:  # tiempos del audio completo, no de la ventana
    s["start"] += off; s["end"] += off
    for w in s["words"]:
        w["start"] = round(w["start"] + off, 3); w["end"] = round(w["end"] + off, 3)
out = os.path.join(salida, nombre + ".json")
with open(out, "w", encoding="utf-8") as f:
    json.dump({"text": "".join(s["text"] for s in segs), "segments": segs}, f, ensure_ascii=False, indent=1)
print(f"{motor} · {sum(len(s['words']) for s in segs)} palabras → {out}")
print(" ".join(s["text"].strip() for s in segs))
