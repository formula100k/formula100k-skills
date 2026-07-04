#!/usr/bin/env bash
# test_compose.sh — verifica compose_faceless.sh con assets sintéticos (sin Higgsfield).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$(mktemp -d)/reel_test"
mkdir -p "$DEST/assets"

# 2 clips de color 1080x1920, 3s c/u (simulan B-roll y card)
ffmpeg -f lavfi -i color=c=navy:s=1080x1920:d=3 -r 30 -y "$DEST/assets/seg0.mp4" 2>/dev/null
ffmpeg -f lavfi -i color=c=maroon:s=1080x1920:d=3 -r 30 -y "$DEST/assets/seg1.mp4" 2>/dev/null
# voz de silencio 6s
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 6 -y "$DEST/voz.mp3" 2>/dev/null
# plan.json mínimo
cat > "$DEST/plan.json" <<JSON
[
  {"start":0.0,"end":3.0,"visual_type":"broll","asset_path":"assets/seg0.mp4"},
  {"start":3.0,"end":6.0,"visual_type":"card","asset_path":"assets/seg1.mp4"}
]
JSON

bash "$DIR/compose_faceless.sh" "$DEST"

OUT="$DEST/REEL_FACELESS.mp4"
[ -f "$OUT" ] || { echo "FAIL: no se creó $OUT"; exit 1; }
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$OUT")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$OUT")
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" | cut -d. -f1)
[ "$W" = "1080" ] && [ "$H" = "1920" ] || { echo "FAIL: dimensiones $W x $H"; exit 1; }
[ "$D" -ge 5 ] || { echo "FAIL: duración $D < 5s"; exit 1; }
echo "PASS: $OUT ($W x $H, ${D}s)"
