#!/usr/bin/env bash
# Baja referencias de Instagram/TikTok y deja todo listo para VERLAS, no para leer el caption.
# Uso: investigar.sh <carpeta_salida> <url1> [url2 ...]
# Deja por referencia: <id>.mp4, <id>.info.json, sheet_<id>.jpg (24 cuadros), cortes_<id>.txt
# (momentos donde cambia el plano) y tx/<id>.txt (lo que se oye). Al final, fichas.md con todo junto.
# Las vistas NO salen de aquí (yt-dlp no las trae de IG): sácalas con Apify (ver SKILL.md, paso I-3).
set -uo pipefail
OUT="$1"; shift
mkdir -p "$OUT/tx"; cd "$OUT" || exit 1
COOKIES="--cookies-from-browser chrome"
for url in "$@"; do
  id=$(echo "$url" | sed -E 's#.*/(p|reel|reels|video)/([^/?]+).*#\2#')
  [ -f "$id.mp4" ] || yt-dlp -q $COOKIES --write-info-json -o "$id.%(ext)s" "$url" 2>&1 | tail -1 &
done; wait
for f in *.mp4; do
  id=${f%.mp4}
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  fps=$(python3 -c "print(min(1.0, 24/$d))")
  [ -f "sheet_$id.jpg" ] || ffmpeg -loglevel error -y -i "$f" -vf "fps=$fps,scale=240:-2,tile=6x4" -frames:v 1 "sheet_$id.jpg"
  ffmpeg -hide_banner -i "$f" -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 \
    | grep -o 'pts_time:[0-9.]*' | cut -d: -f2 | awk '{printf "%.1f s\n",$1}' > "cortes_$id.txt"
  [ -f "tx/$id.txt" ] || ffmpeg -loglevel error -y -i "$f" -ac 1 -ar 16000 "$id.wav"
done
ls *.wav >/dev/null 2>&1 && { whisper *.wav --model small --output_format txt --output_dir tx --fp16 False >/dev/null 2>&1; rm -f *.wav; }
python3 - <<'PY'
import json,glob,os
out=["# Fichas de referencias\n","> Mira cada sheet_<id>.jpg con Read antes de concluir nada. El caption miente; el video no.\n"]
for j in sorted(glob.glob("*.info.json")):
    d=json.load(open(j)); i=d.get("id") or j.split(".")[0]
    cortes=open(f"cortes_{i}.txt").read().split() if os.path.exists(f"cortes_{i}.txt") else []
    tx=open(f"tx/{i}.txt").read().strip() if os.path.exists(f"tx/{i}.txt") else ""
    dur=d.get("duration") or 0
    try:
        import subprocess
        dur=float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f"{i}.mp4"],capture_output=True,text=True).stdout)
    except Exception: pass
    out.append(f"## {i} · {d.get('uploader') or d.get('channel') or ''}\n"
      f"- URL: {d.get('webpage_url')}\n- Fecha: {d.get('upload_date')} · Dura: {dur:.1f} s · Likes: {d.get('like_count')} · Comentarios: {d.get('comment_count')}\n"
      f"- Cortes de plano ({len(cortes)//2}): {' · '.join(cortes[0::2][:20]) or 'ninguno (una sola toma)'}\n"
      f"- Hoja de cuadros: sheet_{i}.jpg\n- Caption: {(d.get('description') or '')[:300].replace(chr(10),' / ')}\n"
      f"- Se oye: {tx[:400] or '(nada / solo música)'}\n- Vistas (Apify): PENDIENTE\n- Qué es de verdad (visto): PENDIENTE\n")
open("fichas.md","w").write("\n".join(out)); print("fichas.md listo:",len(out)-2,"referencias")
PY
