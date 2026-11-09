# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///
"""Corte fino de verdad sobre una base ya cortada y normalizada .

uso: python3 -I apretar.py <carpeta-notitas> [--desde S]
  lee  base.mp4 + captions.json (línea de tiempo de base)
  saca toda pausa con RMS < UMBRAL dB de >= MIN s (deja PAD a cada lado), sin partir palabras de Whisper,
  y no toca nada antes de --desde (el gancho).
  escribe base_fino.mp4, edl_fino.json, captions_fino.json, cortes_fino.json (TODOS los puntos de unión),
  _palabras_fino.json (formato PALABRAS de escenas: w/a/b)
"""
import json, subprocess, sys, array
from pathlib import Path

D = Path(sys.argv[1])
DESDE = float(sys.argv[sys.argv.index('--desde') + 1]) if '--desde' in sys.argv else 0.0
UMBRAL, MIN, PAD, VEN = -40.0, 0.16, 0.05, 0.02
FPS = 30.0

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(D / 'base.mp4'), '-vn', '-ac', '1', '-ar', '16000',
                      '-f', 's16le', '-'], capture_output=True, check=True).stdout
a = array.array('h'); a.frombytes(raw)
n = int(16000 * VEN)
import math
rms = []
for i in range(0, len(a) - n, n):
    s = 0
    for v in a[i:i + n:4]:
        s += v * v
    m = s / (n / 4)
    rms.append(20 * math.log10(math.sqrt(m) / 32768 + 1e-9))
dur = len(a) / 16000

W = json.load(open(D / 'captions.json'))
# silencios
sil, ini = [], None
for k, r in enumerate(rms + [0]):
    t = k * VEN
    if r < UMBRAL and ini is None:
        ini = t
    elif r >= UMBRAL and ini is not None:
        if t - ini >= MIN:
            sil.append((ini + PAD, t - PAD))
        ini = None
# no partir palabras (palabras cortas de whisper) ni tocar el gancho
def dentro(s, e):
    return any(w['start'] + 0.04 < s and e < w['end'] - 0.04 for w in W if w['end'] - w['start'] < 0.9)
QUITAR = [tuple(map(float, x.split('-'))) for x in sys.argv[sys.argv.index('--quitar') + 1].split(',')] if '--quitar' in sys.argv else []
sil = [(s, e) for s, e in sil if s >= DESDE and e - s > 0.04 and not dentro(s, e)]

sil = sorted(sil + QUITAR)
q = lambda x: round(x * FPS) / FPS
segs, cur = [], 0.0
for s, e in sil:
    if s > cur + 0.06:
        segs.append((cur, s))
    cur = max(cur, e)
if dur - cur > 0.06:
    segs.append((cur, dur))
segs = [(q(x), q(y)) for x, y in segs]
# pegar pedacitos < 0,2 s al vecino
out = []
for x, y in segs:
    if out and (y - x < 0.2 or x - out[-1][1] < 0.034):
        out[-1] = (out[-1][0], y)
    else:
        out.append((x, y))
segs = [(x, y) for x, y in out if y - x >= 0.067]
while len(segs) > 1 and segs[0][1] - segs[0][0] < 0.2:
    segs.pop(0)

edl, t = [], 0.0
for x, y in segs:
    edl.append({'origStart': round(x, 4), 'origEnd': round(y, 4), 'newStart': round(t, 4), 'newEnd': round(t + y - x, 4)})
    t += y - x

def mapa(x):
    for e in edl:
        if x < e['origStart']:
            return e['newStart']
        if x <= e['origEnd']:
            return e['newStart'] + x - e['origStart']
    return edl[-1]['newEnd']

W2 = []
for w in W:
    s, e = mapa(w['start']), mapa(w['end'])
    W2.append({**w, 'start': round(s, 3), 'end': round(max(e, s), 3)})
json.dump(W2, open(D / 'captions_fino.json', 'w'), ensure_ascii=False)
json.dump([{'w': w['word'], 'a': w['start'], 'b': w['end']} for w in W2], open(D / '_palabras_fino.json', 'w'), ensure_ascii=False)
json.dump(edl, open(D / 'edl_fino.json', 'w'), indent=1)
json.dump({'cortes': [e['newStart'] for e in edl[1:]]}, open(D / 'cortes_fino.json', 'w'))

f = []
for i, (x, y) in enumerate(segs):
    d = y - x
    f.append(f"[0:v]trim={x:.5f}:{y:.5f},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={x:.5f}:{y:.5f},asetpts=PTS-STARTPTS,"
             f"afade=t=in:d=0.008,afade=t=out:st={max(d - 0.008, 0):.3f}:d=0.008[a{i}]")
f.append(''.join(f'[v{i}][a{i}]' for i in range(len(segs))) + f'concat=n={len(segs)}:v=1:a=1[v][a]')
(D / '_fc_fino.txt').write_text(';'.join(f))
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(D / 'base.mp4'), '-/filter_complex', str(D / '_fc_fino.txt'),
                '-map', '[v]', '-map', '[a]', '-r', '30', '-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '192k', str(D / 'base_fino.mp4')], check=True)
L = [e['newEnd'] - e['newStart'] for e in edl]
print(f'{dur:.1f} s → {t:.1f} s · {len(edl)} tramos · quitados {dur - t:.1f} s en {len(sil)} pausas · tramo más largo {max(L):.1f} s')
