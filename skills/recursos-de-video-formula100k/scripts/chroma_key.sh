#!/usr/bin/env bash
# chroma_key.sh — Aplica chroma key a un PNG con fondo verde brillante (#00FF00)
# y lo SOBRESCRIBE con su versión con alpha transparente.
#
# Uso:
#   chroma_key.sh <archivo.png>
#   chroma_key.sh <archivo.png> --similarity 0.40 --blend 0.15
#
# Defaults:
#   similarity=0.30   (qué tan cerca de #00FF00 cuenta como "verde a quitar")
#   blend=0.10        (suavizado del borde — más alto = transición más suave pero más halo)
#
# El script crea un .png.bak por seguridad antes de sobrescribir; el .bak se borra al final
# si el procesado fue exitoso.

set -euo pipefail

SIMILARITY="0.30"
BLEND="0.10"

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 <archivo.png> [--similarity 0.30] [--blend 0.10]" >&2
  exit 1
fi

INPUT="$1"
shift

while [[ $# -gt 0 ]]; do
  case "$1" in
    --similarity) SIMILARITY="$2"; shift 2;;
    --blend) BLEND="$2"; shift 2;;
    *) echo "Opción desconocida: $1" >&2; exit 1;;
  esac
done

if [[ ! -f "$INPUT" ]]; then
  echo "ERROR: no encuentro $INPUT" >&2
  exit 1
fi

BAK="${INPUT}.bak"
TMP="${INPUT}.chromakey.tmp.png"

cp "$INPUT" "$BAK"

# ffmpeg chromakey filter:
# - color: el verde a quitar (#00FF00)
# - similarity: rango de cercanía a ese verde que cuenta como background
# - blend: ancho del borde de transición (smooth alpha)
# format=rgba para garantizar que el PNG output tenga canal alpha.
ffmpeg -y -loglevel error \
  -i "$INPUT" \
  -vf "chromakey=color=0x00FF00:similarity=${SIMILARITY}:blend=${BLEND},format=rgba" \
  "$TMP"

mv "$TMP" "$INPUT"
rm -f "$BAK"

echo "[ok] $INPUT (similarity=$SIMILARITY blend=$BLEND)"
