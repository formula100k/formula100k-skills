#!/usr/bin/env bash
# RADAR DE CONTENIDO · compuerta visual. Uso: scripts/mirar.sh <carpeta> <lista.txt con un shortcode por línea>
# Mac y Linux. En Windows, Claude corre los mismos pasos (yt-dlp, ffmpeg, whisper) uno a uno en PowerShell.
# Baja cada reel, arma una hoja de 16 frames y extrae 90 s de audio para Whisper.
# Whisper ALUCINA sobre música (inventa palabras sobre un video sin voz): si no hay voz, manda la hoja.
set -u
D=$1; LISTA=$(cd "$(dirname "$2")" && pwd)/$(basename "$2"); mkdir -p "$D"; cd "$D"
for c in $(cat "$LISTA"); do
  # con las cookies de Chrome primero; si fallan (pasa en Windows), sin cookies: los reels públicos suelen bajar igual
  [ -f "$c.mp4" ] || yt-dlp -q --no-warnings --cookies-from-browser chrome -f "mp4/best" -o "$c.%(ext)s" "https://www.instagram.com/reel/$c/" 2>>errores.log \
    || yt-dlp -q --no-warnings -f "mp4/best" -o "$c.%(ext)s" "https://www.instagram.com/reel/$c/" 2>>errores.log \
    || echo "FALLO $c" >> errores.log
  [ -f "$c.mp4" ] || continue
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$c.mp4")
  ffmpeg -loglevel error -y -i "$c.mp4" -vf "fps=16/$DUR,scale=240:-1,tile=8x2" -frames:v 1 "$c.hoja.jpg"
  ffmpeg -loglevel error -y -i "$c.mp4" -t 90 -vn -ac 1 -ar 16000 "$c.wav"
done
# lotes de 4 hojas rotuladas (este ffmpeg no trae drawtext ⇒ PIL)
python3 - "$LISTA" <<'PY'
import sys; from PIL import Image, ImageDraw
codes=[l.strip() for l in open(sys.argv[1]) if l.strip()]
codes=[c for c in codes if __import__('os').path.exists(f'{c}.hoja.jpg')]
for i in range(0,len(codes),4):
    ims=[]
    for j,c in enumerate(codes[i:i+4]):
        im=Image.open(f'{c}.hoja.jpg'); im=im.resize((1600,int(im.height*1600/im.width)))
        d=ImageDraw.Draw(im); d.rectangle([0,0,330,34],fill='black'); d.text((6,4),f'{i+j+1}. {c}',fill='yellow',font_size=26); ims.append(im)
    out=Image.new('RGB',(1600,sum(x.height for x in ims))); y=0
    for x in ims: out.paste(x,(0,y)); y+=x.height
    out.save(f'lote{i//4+1}.jpg',quality=80)
PY
command -v whisper >/dev/null || echo "(whisper no está instalado: se sigue solo con fotogramas)"
for w in *.wav; do [ -e "$w" ] || continue; command -v whisper >/dev/null || break; [ -f "${w%.wav}.txt" ] || whisper "$w" --model base --fp16 False --output_format txt --output_dir . --verbose False >/dev/null 2>>whisper.err; done
echo "listo: $(ls *.hoja.jpg 2>/dev/null | wc -l) hojas · $(ls lote*.jpg 2>/dev/null | wc -l) lotes · fallos: $(cat errores.log 2>/dev/null | grep -c FALLO)"
