#!/usr/bin/env bash
# Renderiza la pizarra, la comprime a HEVC con alfa y arma la previsualizacion
# del montaje. Borra el ProRes al terminar: pesa ~40x mas y no se entrega.
#
#   render_pizarra.sh <dir-composicion> <video-original> <dir-salida> <slug> [fps] [alto-pizarra]
#
# Ejemplo:
#   render_pizarra.sh ./pizarra "$VIDEO" ~/Documents/.../2026-08-06_slug pizarra_10k

set -euo pipefail

COMP="${1:?falta el directorio de la composicion}"
VIDEO="${2:?falta el video original}"
DEST="${3:?falta el directorio de salida}"
SLUG="${4:?falta el slug}"
FPS="${5:-30}"
PIZ_H="${6:-864}"

mkdir -p "$DEST"
MASTER="$COMP/renders/_master_prores.mov"
FINAL="$DEST/${SLUG}_alfa_HEVC.mov"
PREV="$DEST/previsualizacion_montaje.mp4"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")
SRC_W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width  -of csv=p=0 "$VIDEO")
SRC_H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$VIDEO")
BOT_H=$(( SRC_H - PIZ_H ))

echo "==> video ${SRC_W}x${SRC_H}, ${DUR}s | pizarra ${SRC_W}x${PIZ_H} | talking head ${SRC_W}x${BOT_H}"

# ---- 1. master con alfa real (ProRes 4444). Sin croma, nunca. ----
echo "==> 1/4 render ProRes 4444 con alfa (lo lento: ~13 min para 2:20)"
( cd "$COMP" && hyperframes render --format mov -f "$FPS" -q high -o renders/_master_prores.mov )

# ---- 2. comprimir a HEVC con alfa ----
echo "==> 2/4 comprimiendo a HEVC con alfa"
ffmpeg -v error -stats -i "$MASTER" \
  -c:v hevc_videotoolbox -alpha_quality 0.85 -allow_sw 1 -tag:v hvc1 \
  -pix_fmt bgra -b:v 6M -an -y "$FINAL"

# ---- 3. verificar que el alfa sobrevivio (ffprobe MIENTE aqui) ----
echo "==> 3/4 verificando alfa"
python3 - "$FINAL" <<'PY'
import subprocess, sys, tempfile, os
from PIL import Image
src = sys.argv[1]
malos = []
for t in ("0.5", "25", "60", "95"):
    png = os.path.join(tempfile.gettempdir(), f"hf_{t}.png")
    subprocess.run(["ffmpeg","-v","error","-ss",t,"-i",src,"-frames:v","1",
                    "-pix_fmt","rgba","-y",png], check=True)
    im = Image.open(png).convert("RGBA")
    w, h = im.size
    esq, cen = im.getpixel((3, 3))[3], im.getpixel((w // 2, h // 2))[3]
    lo, hi = im.split()[3].getextrema()
    print(f"   t={t:>4}s  esquina alfa={esq:3d}  centro alfa={cen:3d}  min/max={lo}/{hi}")
    if esq > 40 or hi < 250:
        malos.append(t)
    os.remove(png)
if malos:
    sys.exit(f"!! ALFA ROTO en t={malos}. No entregues este archivo.")
print("   alfa correcto")
PY

# ---- 4. previsualizacion del montaje, con audio, para revisar la sincronia ----
echo "==> 4/4 previsualizacion del montaje"
CROP_Y=$(( (SRC_H - BOT_H) / 3 ))   # encuadre alto: la cara suele estar arriba
ffmpeg -v error -stats -i "$FINAL" -i "$VIDEO" -filter_complex \
"[1:v]crop=${SRC_W}:${BOT_H}:0:${CROP_Y},setsar=1,fps=${FPS}[bot];\
color=c=0x101010:s=${SRC_W}x${SRC_H}:r=${FPS}:d=${DUR}[bg];\
[bg][bot]overlay=0:${PIZ_H}:shortest=1[s1];\
[s1][0:v]overlay=0:0:format=auto[out]" \
  -map "[out]" -map 1:a -t "$DUR" \
  -c:v libx264 -crf 26 -preset veryfast -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart -y "$PREV"

# ---- limpieza ----
rm -f "$MASTER"
echo
echo "LISTO:"
ls -lah "$FINAL" "$PREV"
echo
echo "Entrega $(basename "$FINAL"). Alinear al segundo 0, sin croma."
