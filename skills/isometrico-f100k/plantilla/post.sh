#!/bin/bash
# post.sh · secuencia PNG → muestra.mp4 (viñeta + grano fino), poster.jpg, hoja.jpg (9 cuadros) y medición de quietud
# Uso: ./post.sh [carpeta con frames/]   (por defecto, la carpeta de este archivo)
set -e
cd "${1:-$(dirname "$0")}"
ffmpeg -v error -y -framerate 30 -start_number 1 -i frames/f_%04d.png \
  -vf "vignette=PI/9,noise=alls=3:allf=t,format=yuv420p" -c:v libx264 -crf 18 -an -movflags +faststart muestra.mp4
ffmpeg -v error -y -i muestra.mp4 -vf "select='not(mod(n-18\,37))',scale=360:-2,tile=9x1" -frames:v 1 -q:v 3 hoja.jpg
ffmpeg -v error -y -sseof -0.2 -i muestra.mp4 -frames:v 1 -q:v 2 poster.jpg
ffmpeg -i muestra.mp4 -vf "freezedetect=n=0.003:d=0.5" -map 0:v -f null - 2>&1 | grep freeze || echo "sin tramos quietos (0 %)"
