#!/bin/bash
# post.sh · de la secuencia PNG a muestra.mp4 + poster.jpg + cuadros.jpg (viñeta y grano finos)
# Uso: ./post.sh [carpeta con frames/ (por defecto, la de este archivo)] [cuadro del poster, 215]
cd "${1:-$(dirname "$0")}"
ffmpeg -v error -y -framerate 30 -i frames/f_%04d.png -vf "vignette=PI/5.5,noise=alls=5:allf=t,format=yuv420p" \
  -c:v libx264 -crf 20 -preset slow -an -movflags +faststart muestra.mp4
ffmpeg -v error -y -i muestra.mp4 -vf "select='eq(n,${2:-215})'" -frames:v 1 -q:v 2 poster.jpg
# hoja de 9 cuadros (3x3) para revisar
ffmpeg -v error -y -i muestra.mp4 -vf "select='not(mod(n-14,34))',scale=240:-1,tile=3x3" -frames:v 1 -q:v 3 cuadros.jpg
# % quieto: se mide sobre la versión SIN grano (el grano taparía un congelado)
ffmpeg -v error -y -framerate 30 -i frames/f_%04d.png -vf "format=yuv420p" -c:v libx264 -crf 18 -an _singrano.mp4
ffmpeg -i _singrano.mp4 -vf "freezedetect=n=0.003:d=0.5" -map 0:v -f null - 2>&1 | grep freeze || echo "sin congelados (0 % quieto)"
rm -f _singrano.mp4
