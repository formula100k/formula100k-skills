# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "numpy",
#   "mlx-whisper; sys_platform == 'darwin' and platform_machine == 'arm64'",
#   "faster-whisper; sys_platform != 'darwin' or platform_machine != 'arm64'",
# ]
# ///
"""Transcribe cada grupo de tramos contiguos del EDL por separado (large-v3, sin contexto).

uso: uv run --python 3.12 auditar.py AUDIO16K.wav edl.json salida.txt
Mac con chip Apple → mlx-whisper. Windows y Mac Intel → faster-whisper (más lento: usa el procesador).
"""
import json, os, platform, subprocess, sys, tempfile


def audio_np(ruta):
    """El audio como numpy a 16 kHz, leído con ffmpeg (faster-whisper sin PyAV, que falla con algunas versiones)."""
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", ruta, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


wav, edl, out = sys.argv[1], json.load(open(sys.argv[2], encoding="utf-8")), sys.argv[3]
apple = platform.system() == "Darwin" and platform.machine() == "arm64" and os.environ.get("F100K_TRANSCRIPCION") != "faster"
if apple:
    import mlx_whisper
    texto = lambda p: mlx_whisper.transcribe(p, path_or_hf_repo="mlx-community/whisper-large-v3-mlx", language="es", condition_on_previous_text=False)["text"]
else:
    from faster_whisper import WhisperModel
    _m = WhisperModel("large-v3", device="cpu", compute_type="int8")
    texto = lambda p: "".join(s.text for s in _m.transcribe(audio_np(p), language="es", condition_on_previous_text=False)[0])
groups, cur = [], None
for e in edl:  # agrupa tramos separados por < 0.6 s en el original (micro-silencios del corte fino)
    if cur and e["origStart"] - cur[1] < 0.6:
        cur[1] = e["origEnd"]
    else:
        cur = [e["origStart"], e["origEnd"], e["newStart"]]; groups.append(cur)
with open(out, "w", encoding="utf-8") as f:
    for k, (a, b, n) in enumerate(groups):
        tmp = tempfile.mktemp(suffix=".wav")
        subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-ss", str(a), "-to", str(b), "-i", wav, "-y", tmp], check=True)
        t = texto(tmp)
        os.remove(tmp)
        f.write(f"{k:3d} corte {n:7.2f} orig {a:7.2f}-{b:7.2f}: {t.strip()}\n"); f.flush()
print(len(groups), "grupos")
