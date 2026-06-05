#!/bin/bash
# Wrapper de bash para render.py (la lógica vive en Python, cross-platform).
# Uso: render.sh <DEST_FOLDER> <SOURCE_VIDEO>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Verificar bootstrap antes de arrancar (sólo en Mac)
if [ "$(uname)" = "Darwin" ]; then
  # Pre-check rápido: si Homebrew falta, mostrar instrucciones y abortar limpio
  if ! command -v brew >/dev/null 2>&1; then
    bash "$SCRIPT_DIR/bootstrap.sh" --check || true
    exit 2
  fi

  if ! bash "$SCRIPT_DIR/bootstrap.sh" --check >/dev/null 2>&1; then
    echo "[bootstrap] Faltan dependencias. Corriendo bootstrap (sólo la primera vez, ~5-8 min)..." >&2
    bash "$SCRIPT_DIR/bootstrap.sh"
  fi
fi

exec python3 "$SCRIPT_DIR/render.py" "$@"
