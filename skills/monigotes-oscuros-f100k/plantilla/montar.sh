#!/bin/bash
# montar.sh · Plantilla «Monigotes oscuros»: render + posproducción.
# Uso (desde la carpeta de la plantilla, después de `blender -b -P build.py`):
#   ./montar.sh            → renderiza los 300 cuadros que falten en frames/ y arma muestra.mp4, poster.jpg y cuadros.jpg
#   ./montar.sh build      → reconstruye la escena (build.py) y renderiza en la misma pasada
#   ./montar.sh post       → solo rehace el video con ffmpeg (los cuadros ya están)
#   ./montar.sh prueba 1 120 240   → cuadros sueltos a prueba/ (usa la escala de build.py) para revisar antes del render completo
# BLENDER=/ruta/a/blender si `blender` no está en el PATH (en Mac: /Applications/Blender.app/Contents/MacOS/Blender).
set -e
cd "$(dirname "$0")"
if [ -z "$BLENDER" ]; then
  if command -v blender >/dev/null; then BLENDER=blender; else BLENDER=/Applications/Blender.app/Contents/MacOS/Blender; fi
fi
SETUP="import bpy;s=bpy.data.scenes['Escena'];bpy.context.window.scene=s;s.render.use_overwrite=False"

if [ "$1" = "prueba" ]; then
  shift; mkdir -p prueba; ARGS=(); for f in "$@"; do ARGS+=(-f "$f"); done
  "$BLENDER" -b escena.blend --python-expr "$SETUP" -o "//prueba/p_####" "${ARGS[@]}" 2>&1 | grep -E "turno|Error|Traceback" || true
  echo "Cuadros en prueba/"; exit 0
fi

if [ "$1" != "post" ]; then
  mkdir -p frames
  PRE=(-b escena.blend); [ "$1" = "build" ] && PRE=(-b -P build.py)
  "$BLENDER" "${PRE[@]}" --python-expr "$SETUP" -o "//frames/f_####" -a 2>&1 | grep -E "turno|Error|Traceback" || true
fi

source ./tiempos.env      # T1 T2 T3 TOFF T_CIERRE T_CTA ESCALA (los escribe build.py desde config.json)
SIG=$(( 22 * ESCALA / 100 ))
ffmpeg -y -loglevel error -framerate 30 -i frames/f_%04d.png -loop 1 -i texto_1_linea1.png -loop 1 -i texto_2_linea2.png -loop 1 -i texto_3_clave.png \
  -loop 1 -i texto_4_cierre.png -loop 1 -i texto_5_cta.png \
  -filter_complex "[0:v]format=gbrp,split[a][b];[b]curves=all='0/0 0.62/0 1/1',gblur=sigma=$SIG[g];[a][g]blend=all_mode=screen:all_opacity=0.75,vignette=angle=PI/4.8[v0];\
[v0][1:v]overlay=enable='between(t,$T1,$TOFF)':shortest=1[v1];[v1][2:v]overlay=enable='between(t,$T2,$TOFF)':shortest=1[v2];\
[v2][3:v]overlay=enable='between(t,$T3,$TOFF)':shortest=1[v3];[v3][4:v]overlay=enable='gte(t,$T_CIERRE)':shortest=1[v4];\
[v4][5:v]overlay=enable='gte(t,$T_CTA)':shortest=1,noise=alls=6:allf=t+u,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -crf 18 -preset slow -r 30 -movflags +faststart muestra.mp4
ffmpeg -y -loglevel error -ss 9.5 -i muestra.mp4 -frames:v 1 -q:v 2 poster.jpg
# hoja de 9 cuadros (3×3) para revisar de un vistazo
ffmpeg -y -loglevel error -i muestra.mp4 -vf "select='not(mod(n-8\,35))',scale=240:427,tile=3x3" -frames:v 1 -q:v 3 cuadros.jpg
echo "Tramos quietos (debe decir «sin congelados»):"
ffmpeg -i muestra.mp4 -vf "freezedetect=n=0.003:d=0.5" -map 0:v -f null - 2>&1 | grep freeze_start || echo "sin congelados"
