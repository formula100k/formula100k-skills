#!/usr/bin/env bash
# compose_faceless.sh — ensambla el Reel faceless 9:16 desde plan.json + voz + assets.
# Uso: compose_faceless.sh <DEST>
set -euo pipefail

DEST="${1:?Uso: compose_faceless.sh <DEST>}"
PLAN="$DEST/plan.json"
VOZ="$DEST/voz.mp3"
OUT="$DEST/REEL_FACELESS.mp4"
W=1080; H=1920; FPS=30
[ -f "$PLAN" ] || { echo "[error] falta $PLAN"; exit 1; }
[ -f "$VOZ" ]  || { echo "[error] falta $VOZ";  exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# 1. Por cada segmento del plan: normalizar el asset a 1080x1920/30fps y recortarlo/estirarlo a su duración.
python3 - "$PLAN" "$DEST" "$WORK" "$W" "$H" "$FPS" <<'PY'
import json, sys, subprocess, os
plan_path, dest, work, W, H, FPS = sys.argv[1:7]
plan = json.load(open(plan_path))
concat = open(os.path.join(work, "concat.txt"), "w")
for i, seg in enumerate(plan):
    dur = round(float(seg["end"]) - float(seg["start"]), 3)
    if dur <= 0: continue
    src = os.path.join(dest, seg["asset_path"])
    out = os.path.join(work, f"norm{i}.mp4")
    # escala cubriendo el frame, recorta al centro, fuerza duración con loop+trim
    vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,"
          f"crop={W}:{H},fps={FPS},format=yuv420p")
    subprocess.run(["ffmpeg","-stream_loop","-1","-i",src,"-t",str(dur),
                    "-vf",vf,"-an","-r",FPS,"-y",out],
                   check=True, stderr=subprocess.DEVNULL)
    concat.write(f"file '{out}'\n")
concat.close()
PY

# 2. Concatenar los segmentos normalizados en la base de video.
ffmpeg -f concat -safe 0 -i "$WORK/concat.txt" -c:v libx264 -crf 18 -preset medium \
  -pix_fmt yuv420p -y "$WORK/base.mp4" 2>/dev/null

# 3. Si hay overlays kinéticos (HyperFrames chroma magenta), componerlos con colorkey.
if [ -f "$DEST/overlays.mp4" ]; then
  ffmpeg -i "$WORK/base.mp4" -i "$DEST/overlays.mp4" -filter_complex \
    "[0:v]fps=$FPS,format=yuv420p[b];[1:v]fps=$FPS,format=yuv420p[o];\
     [o]colorkey=0xFF00FF:0.3:0.1[ok];[b][ok]overlay=0:0:format=auto[v]" \
    -map "[v]" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p \
    -movflags +faststart -y "$WORK/video.mp4" 2>/dev/null
else
  cp "$WORK/base.mp4" "$WORK/video.mp4"
fi

# 4. Mezclar la voz (y música si $DEST/musica.mp3 existe) y cortar a la duración de la voz.
if [ -f "$DEST/musica.mp3" ]; then
  ffmpeg -i "$WORK/video.mp4" -i "$VOZ" -i "$DEST/musica.mp3" -filter_complex \
    "[2:a]volume=0.12[m];[1:a][m]amix=inputs=2:duration=first[a]" \
    -map "0:v" -map "[a]" -c:v copy -c:a aac -shortest \
    -movflags +faststart -y "$OUT" 2>/dev/null
else
  ffmpeg -i "$WORK/video.mp4" -i "$VOZ" -map "0:v" -map "1:a" \
    -c:v copy -c:a aac -shortest -movflags +faststart -y "$OUT" 2>/dev/null
fi

echo "[ok] $OUT"
