#!/bin/bash
# Posproducción: secuencia PNG -> muestra.mp4 (viñeta + grano fino), poster.jpg, hoja.jpg y medición de quietud
set -e
# Uso: ./post.sh [cuadro del póster, 300] [carpeta con frames/, por defecto la de este archivo]
cd "${2:-$(dirname "$0")}"
POSTER_F=${1:-300}
ffmpeg -y -loglevel error -framerate 30 -start_number 1 -i frames/f_%04d.png \
  -vf "vignette=angle=PI/5.2,noise=alls=5:allf=t+u,format=yuv420p" \
  -an -c:v libx264 -crf 18 -preset slow -r 30 -movflags +faststart muestra.mp4
ffmpeg -y -loglevel error -i muestra.mp4 -vf "select='eq(n\,$POSTER_F-1)'" -frames:v 1 -q:v 2 poster.jpg
ffmpeg -y -loglevel error -i muestra.mp4 -vf "select='not(mod(n-6\,38))',scale=360:640,tile=9x1" -frames:v 1 -q:v 3 hoja.jpg
ffprobe -v error -show_entries stream=width,height,r_frame_rate,codec_name,duration -of csv=p=0 muestra.mp4
ffmpeg -i muestra.mp4 -vf "freezedetect=n=0.003:d=0.5" -map 0:v -f null - 2>&1 | grep freeze || echo "sin congelados (0 % quieto)"
