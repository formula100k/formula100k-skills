#!/bin/bash
# montar.sh · después de:  blender -b -P build.py   y   blender -b escena.blend -a
# De frames/f_0001..0360.png saca muestra.mp4 (viñeta + grano fino), poster.jpg, cuadros.jpg (hoja de 9) y mide el % quieto.
# Uso: ./montar.sh [carpeta]   (por defecto, la carpeta de este archivo; usa la misma que OM_OUT)
D="${1:-$(cd "$(dirname "$0")" && pwd)}"; cd "$D" || exit 1
ffmpeg -y -v error -framerate 30 -start_number 1 -i frames/f_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -an limpio.mp4
ffmpeg -y -v error -framerate 30 -start_number 1 -i frames/f_%04d.png \
  -vf "vignette=angle=PI/5.5,noise=alls=5:allf=t,format=yuv420p" -c:v libx264 -crf 18 -movflags +faststart -an muestra.mp4
ffmpeg -y -v error -i muestra.mp4 -vf "select='eq(n,${POSTER:-345})'" -frames:v 1 -q:v 2 poster.jpg
ffmpeg -y -v error -i muestra.mp4 -vf "select='not(mod(n-18,40))',scale=240:427,tile=3x3" -frames:v 1 -q:v 3 cuadros.jpg
# % quieto medido sobre el video SIN grano: tiene que dar 0 congelados
ffmpeg -i limpio.mp4 -vf "freezedetect=n=0.003:d=0.5" -map 0:v -f null - 2>&1 | grep freeze > quieto.txt
echo "congelados: $(grep -c freeze_start quieto.txt) · listo: $D/muestra.mp4 · $D/cuadros.jpg"
