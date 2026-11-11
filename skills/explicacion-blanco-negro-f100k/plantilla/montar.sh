#!/bin/bash
# montar.sh · después de:  blender -b -P build.py   y   blender -b escena.blend -a
# Monta cuadros/ → muestra.mp4 (resplandor fino + viñeta + grano), poster.jpg y cuadros.jpg (hoja de 9 cuadros).
# Uso: ./montar.sh [carpeta]   (por defecto, la carpeta de este archivo; usa la misma que BN_OUT)
D="${1:-$(cd "$(dirname "$0")" && pwd)}"
ffmpeg -v error -y -framerate 30 -start_number 1 -i "$D/cuadros/c_%04d.png" -filter_complex \
 "[0:v]format=gbrp,split[a][b];[b]gblur=sigma=14[g];[a][g]blend=all_mode=screen:all_opacity=0.35,vignette=PI/6,noise=alls=3:allf=t,format=yuv420p[v]" \
 -map "[v]" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 -an -movflags +faststart "$D/muestra.mp4"
ffmpeg -v error -y -i "$D/muestra.mp4" -vf "select=eq(n\,292)" -frames:v 1 -q:v 2 "$D/poster.jpg"
ffmpeg -v error -y -i "$D/muestra.mp4" -vf "select='not(mod(n-12\,34))',scale=240:427,tile=3x3" -frames:v 1 -q:v 3 "$D/cuadros.jpg"
# % de tiempo quieto, medido sobre los cuadros SIN grano (el grano falsearía la medida). Tiene que salir vacío.
ffmpeg -framerate 30 -start_number 1 -i "$D/cuadros/c_%04d.png" -vf "freezedetect=n=0.003:d=0.5" -map 0:v -f null - 2>&1 | grep freeze
echo "listo: $D/muestra.mp4 · $D/cuadros.jpg"
