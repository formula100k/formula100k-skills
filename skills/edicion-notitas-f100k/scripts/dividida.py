"""Pantalla dividida: imágenes arriba (1080x960) y la toma recortada abajo, en un tramo del video.

uso: python3 -I dividida.py DEST plan_div.json
plan_div.json = {"entrada": "_source_cut.mov", "salida": "_source_div.mov", "crop_y": 180,
                 "desde": 2.0, "hasta": 25.4,
                 "imagenes": [{"src": "USER/a.png", "desde": 2.0, "modo": "cubre"|"entra"}, ...]}
Cada imagen dura hasta que empieza la siguiente (la última, hasta `hasta`).
"""
import json, subprocess, sys
from pathlib import Path

dest = Path(sys.argv[1]); c = json.load(open(sys.argv[2], encoding="utf-8"))
d0, d1, cy = c["desde"], c["hasta"], c.get("crop_y", 180)
ims = c["imagenes"]
args = ["ffmpeg", "-y", "-v", "error", "-i", str(dest / c["entrada"])]
fc = []
for i, im in enumerate(ims):
    fin = ims[i + 1]["desde"] if i + 1 < len(ims) else d1
    args += ["-loop", "1", "-framerate", "60", "-t", f"{fin - im['desde']:.3f}", "-i", str(dest / im["src"])]
    if im.get("modo", "cubre") == "cubre":
        fc.append(f"[{i+1}]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setsar=1,fps=60,format=yuv420p[i{i}]")
    else:
        fc.append(f"[{i+1}]scale=1080:960:force_original_aspect_ratio=decrease,pad=1080:960:(ow-iw)/2:(oh-ih)/2:color=0x111111,setsar=1,fps=60,format=yuv420p[i{i}]")
fc.append("".join(f"[i{i}]" for i in range(len(ims))) + f"concat=n={len(ims)}:v=1:a=0[top]")
fc.append("[0:v]split=3[v0][v1][v2]")
fc.append(f"[v0]trim=0:{d0},setpts=PTS-STARTPTS,format=yuv420p[a]")
fc.append(f"[v1]trim={d0}:{d1},setpts=PTS-STARTPTS,crop=1080:960:0:{cy},format=yuv420p[her]")
fc.append(f"[v2]trim={d1},setpts=PTS-STARTPTS,format=yuv420p[c]")
fc.append("[top][her]vstack,setsar=1[mid]")
fc.append("[a][mid][c]concat=n=3:v=1:a=0[v]")
args += ["-filter_complex", ";".join(fc), "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-preset", "fast", "-crf", "16",
         "-pix_fmt", "yuv420p", "-c:a", "copy", "-r", "60", str(dest / c["salida"])]
subprocess.run(args, check=True)
print("ok", dest / c["salida"])
