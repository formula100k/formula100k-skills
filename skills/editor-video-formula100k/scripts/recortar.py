# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///
"""Quita tramos a mano (muletillas / arranques fallidos que el pase de la skill no vio) de un corte ya hecho.

uso: python3 -I recortar.py <carpeta con _source_cut.mov + captions.json> <ini-fin> [<ini-fin> ...]
  cada borde se lleva al valle de energía más cercano DENTRO del tramo que se quita (0,10 s) para no comerse sílabas.
  escribe _final_cut.mov, captions_final.json, edl_final.json (orig = tiempos de _source_cut.mov)
"""
import json, math, subprocess, sys, array
from pathlib import Path

D = Path(sys.argv[1])
SRC = D / '_source_cut.mov'
rangos = [tuple(map(float, r.split('-'))) for r in sys.argv[2:]]

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(SRC), '-vn', '-ac', '1', '-ar', '16000', '-f', 's16le', '-'],
                     capture_output=True, check=True).stdout
a = array.array('h'); a.frombytes(raw)
VEN = 0.01; n = int(16000 * VEN)
rms = [20 * math.log10(math.sqrt(sum(v * v for v in a[i:i + n]) / n) / 32768 + 1e-9) for i in range(0, len(a) - n, n)]
dur = len(a) / 16000


def valle(t, lado):
    # lado=+1: inicio del tramo que se quita (busca solo hacia adelante, no se come la palabra anterior)
    # lado=-1: fin del tramo que se quita (busca solo hacia atrás, no se come la palabra siguiente)
    a_, b_ = (t, t + 0.10) if lado > 0 else (t - 0.10, t)
    k0, k1 = max(0, int(a_ / VEN)), min(len(rms) - 1, int(b_ / VEN))
    k = min(range(k0, k1 + 1), key=lambda k: (rms[k], abs(k * VEN - t)))
    return round(k * VEN, 3)


cortes = sorted((valle(i, 1), valle(f, -1)) for i, f in rangos)
keep, last = [], 0.0
for i, f in cortes:
    keep.append((last, i)); last = f
keep.append((last, dur))
keep = [(x, y) for x, y in keep if y - x > 0.05]

edl, t = [], 0.0
for x, y in keep:
    edl.append({'origStart': x, 'origEnd': y, 'newStart': round(t, 3), 'newEnd': round(t + y - x, 3)}); t += y - x

sel = '+'.join(f'between(t,{x},{y})' for x, y in keep)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(SRC),
                '-vf', f"select='{sel}',setpts=N/FRAME_RATE/TB", '-af', f"aselect='{sel}',asetpts=N/SR/TB",
                '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-c:a', 'pcm_s16le', str(D / '_final_cut.mov')], check=True)

W = json.load(open(D / 'captions.json'))
out = []
for w in W:
    m = (w['start'] + w['end']) / 2
    for e in edl:
        if e['origStart'] <= m < e['origEnd']:
            off = e['newStart'] - e['origStart']
            out.append({'word': w['word'], 'start': round(max(w['start'], e['origStart']) + off, 3),
                        'end': round(min(w['end'], e['origEnd']) + off, 3)})
            break
json.dump(out, open(D / 'captions_final.json', 'w'), ensure_ascii=False)
json.dump(edl, open(D / 'edl_final.json', 'w'), indent=1)
print('cortes en valle:', cortes, f'· {dur:.2f} s → {t:.2f} s · {len(W) - len(out)} palabras fuera')
