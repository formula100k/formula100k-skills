#!/bin/bash
# Renderiza las 4 piezas del carrusel. Uso: SALIDA=./salida ./todo.sh
# Si Blender no está en esta ruta, cambia BLENDER (Mac: /Applications/Blender.app/Contents/MacOS/Blender).
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
cd "$(dirname "$0")"
for v in hero lapiz planta pose; do
  "$BLENDER" -b --python-exit-code 3 -P escena.py -- $v
done
echo "Listo: copia los PNG de \${SALIDA:-./salida}/render/ a tu carpeta img/"
