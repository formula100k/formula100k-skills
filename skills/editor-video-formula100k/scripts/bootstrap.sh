#!/bin/bash
# Bootstrap: detectar e instalar dependencias del editor-video-formula100k.
#
# Uso:
#   bootstrap.sh          → modo automático (instala lo que falta, sin preguntar)
#   bootstrap.sh --check  → solo reporta qué falta, no instala
#
# Dependencias:
#   - Homebrew (precondición; si falta, mostramos URL para instalarlo)
#   - node 18+, npm
#   - ffmpeg
#   - yt-dlp
#   - uv (provee uvx para mlx-whisper)
#   - Remotion (npm install dentro de remotion-template/)

set -e

MODE="${1:-auto}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TEMPLATE_DIR="$SKILL_DIR/remotion-template"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

MISSING=()
ACTIONS=()

check() {
  local name="$1"
  local cmd="$2"
  local fix="$3"
  if eval "$cmd" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $name"
  else
    echo -e "  ${RED}✗${NC} $name"
    MISSING+=("$name")
    ACTIONS+=("$fix")
  fi
}

echo "[1/2] Checking dependencies..."

# Homebrew (precondición)
if ! command -v brew >/dev/null 2>&1; then
  echo -e "  ${RED}✗${NC} Homebrew"
  echo
  echo -e "${YELLOW}Homebrew NO instalado.${NC} Es precondición para todo lo demás."
  echo "  Instalación oficial:"
  echo "    /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
  echo
  echo "Vuelve a correr este script después de instalarlo."
  exit 2
fi
echo -e "  ${GREEN}✓${NC} Homebrew"

check "node 18+"  "node --version | grep -E 'v(1[89]|[2-9][0-9])'"  "brew install node"
check "ffmpeg"    "command -v ffmpeg"                                "brew install ffmpeg"
check "yt-dlp"    "command -v yt-dlp"                                "brew install yt-dlp"
check "uv (uvx)"  "command -v uvx"                                   "brew install uv"
check "Remotion node_modules" "[ -d \"$TEMPLATE_DIR/node_modules/remotion\" ]"  "cd \"$TEMPLATE_DIR\" && npm install --cache=/tmp/npm-cache-$(whoami)"

if [ ${#MISSING[@]} -eq 0 ]; then
  echo
  echo -e "${GREEN}Todo listo. La skill editor-video-formula100k está operativa.${NC}"
  exit 0
fi

echo
echo "Falta(n): ${MISSING[*]}"

if [ "$MODE" = "--check" ]; then
  echo
  echo "Para instalar todo lo que falta:"
  for a in "${ACTIONS[@]}"; do echo "  $a"; done
  exit 1
fi

echo "[2/2] Instalando..."
for i in "${!MISSING[@]}"; do
  name="${MISSING[$i]}"
  action="${ACTIONS[$i]}"
  echo
  echo -e "${YELLOW}→ ${name}${NC}"
  echo "  $action"
  eval "$action"
done

echo
echo -e "${GREEN}Bootstrap completo. La skill editor-video-formula100k está lista.${NC}"
