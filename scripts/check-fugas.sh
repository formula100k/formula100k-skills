#!/usr/bin/env bash
# check-fugas.sh — guardarraíl de publicación del marketplace F100K.
#
# Este repo es la COPIA DE DISTRIBUCIÓN: lo que hay aquí se instala en la máquina
# de cada alumna. Las skills se escriben trabajando en ~/.claude/skills/, donde es
# normal que estén personalizadas (rutas locales, la cuenta propia, la voz propia).
# Al copiarlas aquí, esa personalización se convierte en una FUGA: el Claude de la
# alumna lee "eres Andrea" / "usa la carpeta de Andrea" y se niega a trabajar
# ("no puedo usar información privada de otra persona"), o intenta leer rutas y
# repos que no existen en su máquina.
#
# Uso:  ./scripts/check-fugas.sh        → sale 1 si encuentra fugas
# Correr SIEMPRE antes de commitear un sync desde ~/.claude/skills/.

set -uo pipefail
cd "$(dirname "$0")/.."

TARGETS="skills agents openclaw"
EXCLUDE='node_modules|remotion-template|/scripts/check-fugas.sh'
# Único archivo donde la voz de otra persona es intencional (está rotulado como ejemplo):
ALLOW='skills/guionizacion-humanizada/references/ejemplo-voice-guide.md'

FAIL=0

check () {  # check <nombre> <regex> <explicación>
  local nombre="$1" regex="$2" ayuda="$3" hits
  hits=$(grep -rniE --exclude-dir=node_modules --exclude-dir=remotion-template --exclude-dir=.git \
           --binary-files=without-match "$regex" $TARGETS 2>/dev/null \
         | grep -vE "$EXCLUDE" | grep -vF "$ALLOW")
  if [ -n "$hits" ]; then
    FAIL=1
    echo ""
    echo "❌ FUGA — $nombre"
    echo "   $ayuda"
    echo "$hits" | sed 's/^/   /' | head -25
    local n; n=$(echo "$hits" | wc -l | tr -d ' ')
    [ "$n" -gt 25 ] && echo "   … y $((n - 25)) más"
  fi
}

echo "Revisando fugas de personalización en $TARGETS …"

check "rutas de la máquina de origen" \
  '/Users/[a-z]+/|-Users-[a-z]+' \
  "Usa ~/ (docs) o \$HOME/ (scripts), y <tu-proyecto> en las rutas de memoria. La alumna no tiene ese usuario."

check "carpetas personales" \
  'ANDREA SELFIES|ANDREA ADN|SEGUNDO CEREBRO ANDREA' \
  "Usa nombres neutros (MIS SELFIES / MI ADN VISUAL) y pregunta la ruta si no existe."

check "handle hardcodeado" \
  '@?andreaestratega|@?andraestratega' \
  "El handle lo da el usuario. Usa @tuhandle como placeholder."

check "cuentas de terceros" \
  'Kissicore|andreavegabocanegra|sebastian-flores' \
  "GitHub/Vercel/Skool de la alumna, no los de la dueña del repo."

# "Andrea" a secas = se está hablando de la persona, no de la marca.
# "Andrea Vega" / "Andrea Estratega" completos = atribución de autoría de la metodología: permitido.
andrea_hits=$(grep -rniE --exclude-dir=node_modules --exclude-dir=remotion-template --exclude-dir=.git \
                --binary-files=without-match 'andrea' $TARGETS 2>/dev/null \
              | grep -vE "$EXCLUDE" | grep -vF "$ALLOW" \
              | awk '{ orig = $0
                       gsub(/[Aa]ndrea [VvEe][a-zA-Z]*/, "", $0)
                       if (tolower($0) ~ /andrea/) print orig }')
if [ -n "$andrea_hits" ]; then
  FAIL=1
  echo ""
  echo "❌ FUGA — 'Andrea' como sujeto (la usuaria NO es Andrea)"
  echo "   En la máquina de la alumna, la usuaria es ELLA. Escribe 'el usuario'."
  echo "   (Atribuir la metodología a 'Andrea Vega' / 'Andrea Estratega' completos sí está bien.)"
  echo "$andrea_hits" | sed 's/^/   /' | head -25
fi

check "memorias personales" \
  '\[\[(user|feedback|project|reference)_[a-z_]*andrea[a-z_]*\]\]|patterns_ig_andrea|reference_andrea' \
  "Esas memorias solo existen en la máquina de origen. Quita el puntero o deja la regla escrita inline."

check "secretos" \
  'github_pat_|ghp_[A-Za-z0-9]{20}|sk-[A-Za-z0-9]{20}|AIzaSy[A-Za-z0-9_-]{20}' \
  "NUNCA commitear tokens. Rótalo ya si aparece."

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "✅ Sin fugas. Listo para publicar."
  echo "   Recuerda bumpear .claude-plugin/plugin.json Y marketplace.json (las dos)."
else
  echo "🚫 No publiques hasta limpiar lo de arriba."
fi
exit $FAIL
