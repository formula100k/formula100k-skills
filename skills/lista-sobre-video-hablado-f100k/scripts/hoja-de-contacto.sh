#!/bin/bash
# Hoja de contacto de un MP4: 24 cuadros repartidos en todo el video, o un tramo a varios cuadros por segundo.
# Uso: hoja-de-contacto.sh <video.mp4> [salida.jpg]                 → 24 cuadros de todo el video (6 por fila)
#      hoja-de-contacto.sh <video.mp4> <salida.jpg> <desde> <hasta> → ese tramo, 6 cuadros por segundo (para ver el cierre)
set -e
[ -f "$1" ] || { echo "Uso: hoja-de-contacto.sh <video.mp4> [salida.jpg] [desde hasta]"; exit 1; }
SALIDA="${2:-${1%.*}-hoja.jpg}"
if [ -n "$3" ] && [ -n "$4" ]; then
  N=$(awk "BEGIN{n=int(($4-$3)*6); if(n<1)n=1; print n}")
  F=$(awk "BEGIN{print int(($N+7)/8)}")
  ffmpeg -v error -y -ss "$3" -t "$(awk "BEGIN{print $4-$3}")" -i "$1" -vf "fps=6,scale=270:-2,tile=8x${F}:padding=4:color=white" -frames:v 1 -update 1 "$SALIDA"
  echo "Hoja: $SALIDA (del segundo $3 al $4, 6 cuadros por segundo, de izquierda a derecha)"
else
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$1")
  ffmpeg -v error -y -i "$1" -vf "fps=24/${D},scale=360:-2,tile=6x4:padding=4:color=white" -frames:v 1 -update 1 "$SALIDA"
  CADA=$(awk -v d="$D" 'BEGIN{printf "%.1f", d/24}')
  echo "Hoja: $SALIDA (24 cuadros, uno cada $CADA s, de izquierda a derecha)"
fi
