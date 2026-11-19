#!/usr/bin/env bash
# mezcla.sh <carpeta> — junta la voz con el video, y si existen, la música y los sonidos.
#   <carpeta>/voz/01.mp3…   un audio por frase (obligatorio)
#   <carpeta>/musica.mp3    tu pista de fondo (opcional): baja sola cuando hablas
#   <carpeta>/sonidos.txt   (opcional) «segundo:archivo.wav» separados por espacio, archivos en <carpeta>/sfx/
#                           ej.: 0:pop.wav 1.9:golpe.wav 3.6:pop.wav — usa sonidos graves (pop, golpe sordo, papel), nada agudo
# Sale <carpeta>/video.mp4 a −14 LUFS.
set -e
SK="$(cd "$(dirname "$0")" && pwd)"
cd "${1:?Uso: bash mezcla.sh carpeta-del-video}"
TMP=$(mktemp -d)
node "$SK/voz.mjs" fuente/pieza.src.html voz "$TMP/con-voz.mp4" | tail -1
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/con-voz.mp4")
FIN=$(awk "BEGIN{print $DUR-0.7}")
IN=(-i "$TMP/con-voz.mp4"); F=""; MIX="[v1]"; k=1; n=1
if [ -f musica.mp3 ]; then
  IN+=(-stream_loop -1 -i musica.mp3)
  F+="[0:a]asplit=2[v1][v2];[1:a]volume=0.26,atrim=0:${DUR},afade=t=in:d=0.3,afade=t=out:st=${FIN}:d=0.7[mus];[mus][v2]sidechaincompress=threshold=0.05:ratio=4:attack=40:release=600[duck];"
  MIX+="[duck]"; k=2; n=2
else
  F+="[0:a]anull[v1];"
fi
if [ -f sonidos.txt ]; then
  for e in $(cat sonidos.txt); do
    t="${e%%:*}"; f="${e#*:}"; IN+=(-i "sfx/$f"); ms=$(awk "BEGIN{print int($t*1000)}")
    F+="[$k:a]lowpass=f=3000,volume=0.55,adelay=${ms}|${ms}[s$k];"; MIX+="[s$k]"; k=$((k+1)); n=$((n+1))
  done
fi
F+="${MIX}amix=inputs=${n}:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11[a]"
ffmpeg -v error -y "${IN[@]}" -filter_complex "$F" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest video.mp4
echo "listo -> $(pwd)/video.mp4"
