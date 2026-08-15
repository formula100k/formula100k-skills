#!/bin/bash
# Regenera la carpeta de distribución que Andrea sube al Drive del curso.
#
# Toma las versiones vigentes de las skills en ~/.claude/skills/, las copia a
# /Users/kissita/Documents/FORMULA100K/distribucion-skill-editor/ (excluyendo
# node_modules y artefactos de test), preserva GUIA_INSTALACION.md y instalar.sh,
# y opcionalmente genera el .zip listo para subir.
#
# Uso:
#   bash make_distribution.sh           → solo actualiza la carpeta
#   bash make_distribution.sh --zip     → también genera el .zip

set -e

DIST="/Users/kissita/Documents/SKILLS/EDICIÓN AUTOMÁTICA/formula100k-editor-video"
SKILLS="$HOME/.claude/skills"

GREEN='\033[0;32m'
NC='\033[0m'

mkdir -p "$DIST"

echo "Sincronizando editor-video-formula100k..."
rsync -a --delete \
  --exclude='node_modules' \
  --exclude='.DS_Store' \
  --exclude='public/IA' \
  --exclude='public/WEB' \
  --exclude='public/_source_cut.mov' \
  --exclude='public/IMG_*.mov' \
  --exclude='public/IMG_*.mp4' \
  --exclude='scripts/make_distribution.sh' \
  "$SKILLS/editor-video-formula100k/" "$DIST/editor-video-formula100k/"

echo "Sincronizando recursos-de-video-formula100k..."
rsync -a --delete --exclude='.DS_Store' \
  "$SKILLS/recursos-de-video-formula100k/" "$DIST/recursos-de-video-formula100k/"

# Estos archivos viven en $DIST (los editás ahí directo, NO en ~/.claude/skills/):
for f in \
  instalar.sh \
  instalar.ps1 \
  instalar.bat \
  GUIA_INSTALACION_MAC.html \
  GUIA_INSTALACION_WINDOWS.html
do
  if [ ! -f "$DIST/$f" ]; then
    echo "AVISO: falta $DIST/$f — escríbelo a mano antes de zippar."
  fi
done

du -sh "$DIST"
echo -e "${GREEN}✓ Carpeta de distribución actualizada: $DIST${NC}"

if [ "$1" = "--zip" ]; then
  PARENT="$(dirname "$DIST")"
  NAME="$(basename "$DIST")"
  ZIP="$PARENT/${NAME}.zip"
  echo
  echo "Generando zip → $ZIP"
  rm -f "$ZIP"
  (cd "$PARENT" && zip -r -q "$NAME.zip" "$NAME" -x "*.DS_Store")
  du -h "$ZIP"
  echo -e "${GREEN}✓ Zip listo para subir al Drive del curso.${NC}"
fi
