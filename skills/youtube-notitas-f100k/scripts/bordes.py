# Revisa cada borde del EDL contra el audio original: si hay voz justo después de un fin
# (o justo antes de un inicio) que no se usa, la palabra quedó mocha.
import json, sys, wave, numpy as np
wav, edl = sys.argv[1], json.load(open(sys.argv[2], encoding="utf-8"))
w = wave.open(wav); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
def db(a, b):
    s = x[int(a * sr):int(b * sr)]
    return -99 if len(s) == 0 else 20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-9)
TH = float(sys.argv[3]) if len(sys.argv) > 3 else -40
for i, e in enumerate(edl):
    nxt = edl[i + 1]["origStart"] if i + 1 < len(edl) else 1e9
    prv = edl[i - 1]["origEnd"] if i > 0 else -1e9
    if nxt - e["origEnd"] > 0.03:
        after = db(e["origEnd"], e["origEnd"] + 0.07)
        if after > TH:
            print(f"FIN   corte {e['newEnd']:7.2f}  orig {e['origEnd']:7.2f}  voz después {after:5.1f} dB")
    if e["origStart"] - prv > 0.03:
        before = db(e["origStart"] - 0.07, e["origStart"])
        if before > TH:
            print(f"INICIO corte {e['newStart']:7.2f}  orig {e['origStart']:7.2f}  voz antes {before:5.1f} dB")
