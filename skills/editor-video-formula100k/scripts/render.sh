#!/bin/bash
# Wrapper de bash para render.py (la lógica vive en Python, cross-platform).
# Uso: render.sh <DEST_FOLDER> <SOURCE_VIDEO>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Verificar bootstrap antes de arrancar (sólo en Mac)
if [ "$(uname)" = "Darwin" ]; then
  if ! bash "$SCRIPT_DIR/bootstrap.sh" --check >/dev/null 2>&1; then
    echo "[bootstrap] Faltan dependencias. Corriendo bootstrap..." >&2
    bash "$SCRIPT_DIR/bootstrap.sh"
  fi
fi

exec python3 "$SCRIPT_DIR/render.py" "$@"
