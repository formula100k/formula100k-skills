#!/bin/bash
# Hoja de contacto de un MP4 (4 cuadros por segundo) para revisar el reel de un vistazo.
# Uso: hoja-de-contacto.sh <video.mp4> [salida.jpg]
set -e
[ -f "$1" ] || { echo "Uso: hoja-de-contacto.sh <video.mp4> [salida.jpg]"; exit 1; }
SALIDA="${2:-${1%.*}-hoja.jpg}"
ffmpeg -v error -y -i "$1" -vf "fps=4,scale=216:-2,tile=10x4:padding=4:color=white" -frames:v 1 -update 1 "$SALIDA"
echo "Hoja: $SALIDA (se lee de izquierda a derecha, 4 cuadros por segundo)"
