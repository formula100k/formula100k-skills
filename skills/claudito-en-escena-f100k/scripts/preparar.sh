#!/usr/bin/env bash
# preparar.sh — revisa que esté todo para hacer videos y deja lista la skill.
cd "$(dirname "$0")/.."
falta=0
command -v node >/dev/null && echo "✓ Node $(node -v)" || { echo "✗ Falta Node 18+ (https://nodejs.org)"; falta=1; }
command -v ffmpeg >/dev/null && echo "✓ ffmpeg" || { echo "✗ Falta ffmpeg (Mac: brew install ffmpeg · Windows: winget install ffmpeg)"; falta=1; }
if [ -d "/Applications/Google Chrome.app" ] || command -v google-chrome >/dev/null || command -v chrome >/dev/null; then echo "✓ Google Chrome"; else echo "✗ Falta Google Chrome"; falta=1; fi
command -v yt-dlp >/dev/null && echo "✓ yt-dlp (para links de redes)" || echo "· yt-dlp no está: solo hace falta si usas links de Instagram, TikTok o YouTube como referencia"
if command -v npm >/dev/null; then [ -d node_modules/playwright-core ] && echo "✓ playwright-core" || { npm i --silent && echo "✓ playwright-core instalado"; }; fi
[ $falta = 0 ] && echo "Todo listo." || echo "Instala lo que falta y vuelve a correr este archivo."
