#!/usr/bin/env bash
# compose_collage.sh — Compositor de paneles + grade vintage + grano (estilo @andrewcodesmith)
# Primera versión: se CALIBRA contra el video real de Andrea en el piloto.
#
# Uso:  bash compose_collage.sh "$DEST" [escena_top.png]
#   $DEST            carpeta con _source_cut.mov (y opcional escenas/)
#   escena_top.png   imagen de escena para la banda superior (default: escenas/escena_1.png)
#
# Produce: $DEST/_panels.mp4  (talking-head abajo, escena arriba, grade+grano sobre todo)
#
# Layout 9:16 (1080x1920):
#   - Banda superior  (escena temática)  : 0   .. 730   (~38%)
#   - Banda inferior  (talking-head)      : 730 .. 1920  (~62%)
# Calibrá BAND_SPLIT / GRADE / GRAIN sobre material real.
set -euo pipefail

DEST="${1:?Falta \$DEST}"
SRC="$DEST/_source_cut.mov"
[ -f "$SRC" ] || SRC="$(ls "$DEST"/*.mov "$DEST"/*.mp4 2>/dev/null | head -1)"
[ -f "$SRC" ] || { echo "[err] no encuentro video fuente en $DEST"; exit 1; }

SCENE="${2:-$DEST/escenas/escena_1.png}"
OUT="$DEST/_panels.mp4"

W=1080; H=1920
BAND_SPLIT=730          # alto de la banda superior (escena). 1920-730=1190 para el talking-head
TH_H=$((H - BAND_SPLIT)) # alto banda talking-head

# --- Grade vintage verdoso-sepia + grano + viñeteado (capa 4 del ADN) ---
# curves: baja un pelo el azul y sube verde/rojo en sombras → virado sepia-verde
# eq: desatura; noise: grano; vignette: oscurece bordes
GRADE="eq=saturation=0.82:contrast=1.06:gamma=0.98,\
curves=b='0/0.04 0.5/0.46 1/0.92':g='0/0.02 1/0.99',\
vignette=PI/5"
GRAIN="noise=alls=9:allf=t+u"   # grano sutil (~6-12%); subí alls si querés más textura

if [ -f "$SCENE" ]; then
  echo "[collage] modo PANELES con escena: $SCENE"
  ffmpeg -y \
    -i "$SRC" \
    -loop 1 -i "$SCENE" \
    -filter_complex "\
      [0:v]scale=${W}:${TH_H}:force_original_aspect_ratio=increase,crop=${W}:${TH_H},setsar=1[th];\
      [1:v]scale=${W}:${BAND_SPLIT}:force_original_aspect_ratio=increase,crop=${W}:${BAND_SPLIT},setsar=1[sc];\
      [sc][th]vstack=inputs=2[stack];\
      [stack]${GRADE},${GRAIN},format=yuv420p[outv]" \
    -map "[outv]" -map "0:a?" \
    -c:v libx264 -crf 18 -preset slow -c:a aac -b:a 160k \
    -movflags +faststart \
    -shortest "$OUT"
else
  echo "[collage] sin escena (escena no encontrada): aplico solo grade+grano fullframe a 9:16"
  ffmpeg -y -i "$SRC" \
    -vf "scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,${GRADE},${GRAIN},format=yuv420p" \
    -c:v libx264 -crf 18 -preset slow -c:a aac -b:a 160k \
    -movflags +faststart "$OUT"
fi

echo "[collage] OK → $OUT"
echo "[collage] siguiente: captions HyperFrames + composite (Paso 6 del SKILL.md)"
