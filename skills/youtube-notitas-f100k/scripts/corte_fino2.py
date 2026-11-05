"""Corte fino: dentro de los tramos a conservar, saca todo silencio > MIN s (deja PAD a cada lado).

uso: python3 -I corte_fino.py VIDEO DEST tramos.json   (tramos.json = [[ini, fin], ...] en el original)
     PALABRAS=crudo.json (whisper del original) → no saca silencios que caen DENTRO de una palabra (25-oct: partía «transporte»)
escribe DEST/_source_cut.mov, DEST/edl.json y DEST/cortes.json
"""
import json, re, subprocess, sys
from pathlib import Path

MIN, PAD, DB = 0.10, 0.05, -36
PAD_IN = 0.09  # margen antes de que arranque la palabra (consonantes suaves)
video, dest, tramos = sys.argv[1], Path(sys.argv[2]), json.load(open(sys.argv[3], encoding="utf-8"))

log = subprocess.run(["ffmpeg", "-v", "info", "-i", video, "-vn", "-af", f"silencedetect=noise={DB}dB:d={MIN}",
                      "-f", "null", "-"], capture_output=True, text=True).stderr
ini = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
fin = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
sil = [(a + PAD, b - PAD_IN) for a, b in zip(ini, fin) if b - a - PAD - PAD_IN > 0.03]
import os
if os.environ.get("PALABRAS"):
    d = json.load(open(os.environ["PALABRAS"], encoding="utf-8"))
    W = [(w["start"], w["end"]) for s in d["segments"] for w in s.get("words", [])]
    sil = [(s, e) for s, e in sil if (e - s) > 0.16 or not any(ws + 0.04 < s and e < we - 0.04 for ws, we in W if we - ws < 0.9)]
    print("silencios fuera de palabras:", len(sil))

segs = []
for a, b in tramos:
    cur = a
    for s, e in sil:
        if e <= cur or s >= b:
            continue
        if s > cur + 0.06:
            segs.append((cur, min(s, b)))
        cur = max(cur, e)
    if b - cur > 0.06:
        segs.append((cur, b))

# pedacitos < 0,2 s se pegan al vecino de su mismo tramo (no se saca ese silencio)
m = []
for a, b in segs:
    if m and (b - a < 0.2 or m[-1][1] - m[-1][0] < 0.2) and a - m[-1][1] < 0.7 and any(x <= m[-1][0] and b <= y for x, y in tramos):
        m[-1] = (m[-1][0], b)
    else:
        m.append((a, b))
segs = m
f, edl, t = [], [], 0.0
for i, (a, b) in enumerate(segs):
    d = b - a
    f.append(f"[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,"
             f"afade=t=in:d=0.008,afade=t=out:st={max(d - 0.008, 0):.3f}:d=0.008[a{i}]")
    edl.append({"origStart": round(a, 3), "origEnd": round(b, 3), "newStart": round(t, 3), "newEnd": round(t + d, 3)})
    t += d
f.append("".join(f"[v{i}][a{i}]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=1[v][a]")
fc = dest / "_fc.txt"
fc.write_text(";".join(f), encoding="utf-8")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", video, "-/filter_complex", str(fc), "-map", "[v]", "-map", "[a]",
                "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                str(dest / "_source_cut.mov")], check=True)
json.dump(edl, open(dest / "edl.json", "w", encoding="utf-8"), indent=1)
# cambio de cámara solo en los cortes entre tramos (no en cada micro-silencio)
cortes, acc = [], 0.0
for e in edl[:-1]:
    if e["newEnd"] - acc >= 1.2:
        cortes.append(e["newEnd"]); acc = e["newEnd"]
json.dump({"cortes": cortes}, open(dest / "cortes.json", "w", encoding="utf-8"))
print(f"{len(segs)} tramos · {t:.2f} s · {len(cortes)} cambios de cámara")
