#!/bin/bash
# Captura los 9 posts de posts.html como despues-1.jpg … despues-9.jpg.
# Uso: bash capturar.sh <carpeta con posts.html, foto.jpg y recorte.png> <carpeta de salida (assets del reel)>
set -e
DIR="$(cd "${1:?falta la carpeta de trabajo}" && pwd)"; OUT="${2:?falta la carpeta de salida}"; mkdir -p "$OUT"
for f in posts.html foto.jpg recorte.png; do [ -f "$DIR/$f" ] || { echo "Falta $DIR/$f"; exit 1; }; done
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || CHROME="$(command -v google-chrome || command -v chromium || command -v chrome || true)"
[ -n "$CHROME" ] || { echo "No encontré Chrome: instálalo o captura cada lámina a mano (posts.html#1 … #9, a 1080×1350)."; exit 1; }
for i in 1 2 3 4 5 6 7 8 9; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files --virtual-time-budget=3000 \
    --screenshot="$DIR/post-$i.png" --window-size=1080,1350 "file://$DIR/posts.html#$i" >/dev/null 2>&1
  if command -v sips >/dev/null; then sips -Z 900 "$DIR/post-$i.png" --out "$OUT/despues-$i.jpg" -s format jpeg -s formatOptions 88 >/dev/null
  else ffmpeg -y -loglevel error -i "$DIR/post-$i.png" -vf scale=720:-1 "$OUT/despues-$i.jpg"; fi
  rm -f "$DIR/post-$i.png"
done
ffmpeg -y -loglevel error -i "$OUT/despues-%d.jpg" -vf "scale=360:-1,tile=9x1" -frames:v 1 "$DIR/hoja-posts.jpg" && echo "Hoja para revisar: $DIR/hoja-posts.jpg"
