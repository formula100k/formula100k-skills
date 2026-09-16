#!/usr/bin/env bash
# instalar.sh — instala o actualiza las skills F100K en un agente OpenClaw.
#
# Uso (en el servidor del agente):
#   git clone https://<TOKEN>@github.com/formula100k/formula100k-skills.git ~/f100k-skills
#   bash ~/f100k-skills/openclaw/instalar.sh
#
# Para actualizar:
#   git -C ~/f100k-skills pull --ff-only && bash ~/f100k-skills/openclaw/instalar.sh
#
# Qué hace:
#   - Busca el workspace del agente (config de OpenClaw o ~/.openclaw/workspace).
#   - Copia cada skill de openclaw/skills/ a <workspace>/skills/<skill>/.
#     Sobrescribe los archivos que vienen en el paquete y NO borra skills ajenas
#     ni archivos extra que ya estuvieran dentro de una carpeta.
#   - Crea guiones/ ideas/ informes/ cerebro/ entregables/ si faltan (nunca las vacía).
#   - Se puede correr las veces que quieras: siempre deja lo mismo.

set -euo pipefail

AQUI="$(cd "$(dirname "$0")" && pwd)"
ORIGEN="$AQUI/skills"

if [ ! -d "$ORIGEN" ]; then
  echo "❌ No encuentro $ORIGEN. ¿Clonaste el repo completo en ~/f100k-skills?" >&2
  exit 1
fi

WS="${F100K_WORKSPACE:-}"   # opcional: forzar otra carpeta de workspace
if [ -z "$WS" ] && command -v openclaw >/dev/null 2>&1; then
  WS="$(openclaw config get agents.defaults.workspace 2>/dev/null | tail -n 1 | tr -d '"' | tr -d "'" || true)"
fi
case "$WS" in
  ""|null|undefined|*" "*|*rror*) WS="$HOME/.openclaw/workspace" ;;
esac
WS="${WS/#\~/$HOME}"

mkdir -p "$WS/skills"
for d in guiones ideas informes cerebro entregables; do
  mkdir -p "$WS/$d"
done
[ -f "$WS/cerebro/INDICE.md" ] || printf '# Índice del segundo cerebro\n\n(Todavía vacío: aquí va una línea por cada archivo de cerebro/.)\n' > "$WS/cerebro/INDICE.md"

VERSION="$(git -C "$AQUI/.." rev-parse --short HEAD 2>/dev/null || echo 'sin-git')"
instaladas=()
for s in "$ORIGEN"/*/; do
  nombre="$(basename "$s")"
  destino="$WS/skills/$nombre"
  mkdir -p "$destino"
  cp -R "$s". "$destino"/
  echo "$VERSION" > "$destino/.f100k-version"
  instaladas+=("$nombre")
done

echo "✅ Skills F100K instaladas en $WS/skills (versión $VERSION):"
for n in "${instaladas[@]}"; do echo "   - $n"; done
echo ""
echo "Carpetas de trabajo listas: guiones/ ideas/ informes/ cerebro/ entregables/"
echo "Si el agente ya estaba corriendo y no ve las skills nuevas, reinícialo (openclaw gateway restart)."
