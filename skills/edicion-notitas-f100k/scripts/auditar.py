# uso: auditar.py VIDEO_ORIGINAL edl.json salida.txt  -> transcribe cada tramo del corte por separado
import json, subprocess, sys, numpy as np, whisper
video, edl, out = sys.argv[1], json.load(open(sys.argv[2], encoding="utf-8")), sys.argv[3]
m = whisper.load_model("medium")
with open(out, "w", encoding="utf-8") as f:
    for i, s in enumerate(edl):
        a, b = s["origStart"], s["origEnd"]
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a), "-to", str(b), "-i", video, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
        x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
        x = np.concatenate([x, np.zeros(16000, np.float32)])
        t = m.transcribe(x, language="es", condition_on_previous_text=False, fp16=False)["text"].strip()
        f.write(f"{i:3d} new {s['newStart']:7.2f}-{s['newEnd']:7.2f} orig {a:7.2f}-{b:7.2f}: {t}\n"); f.flush()
