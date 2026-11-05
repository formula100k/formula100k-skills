#!/usr/bin/env python3
"""
Revisa que ninguna unión del corte fino se coma una palabra.

Uso:  revisar_uniones.py <toma_original> <tramos.json>
      tramos.json = lista de [inicio, fin] en segundos de la TOMA ORIGINAL,
                    o edl.json (origStart/origEnd), o {"keep": [...]} / {"segmentos": [...]}.
      Si recortaste sobre un corte previo (keep en segundos de _source_cut_v0.mov), primero pásalo a
      segundos de la toma original con su edl.

Marca:
  · CORTA FINAL / CORTA INICIO: la voz suena fuerte justo antes Y justo después del borde (> +15 dB sobre el ruido
    de fondo en 30 ms a cada lado) → el corte cae en medio de una palabra. Lleva el borde al silencio, o al valle
    entre dos palabras si la frase sigue de corrido hacia una toma descartada.
  · PEDACITO: tramo de menos de 0,15 s (suena como un clic o una sílaba suelta).
Sale con código 1 si hay algo que arreglar. Las transcripciones NO sirven para esto: Whisper completa la palabra
aunque falte la última sílaba (20-oct, 6998: 7 finales mochos con la transcripción «perfecta»).
"""
import json, subprocess, sys
import numpy as np

SR = 16000

def tramos(p):
    j = json.load(open(p, encoding="utf-8"))
    if isinstance(j, dict):
        j = j.get("keep") or j.get("segmentos") or j.get("segments")
    if j and isinstance(j[0], dict):
        return [(s["origStart"], s["origEnd"]) for s in j]
    return [tuple(x) for x in j]

def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(2)
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", sys.argv[1], "-vn", "-ac", "1", "-ar", str(SR),
                        "-f", "s16le", "-"], capture_output=True, check=True)
    a = np.frombuffer(r.stdout, np.int16).astype(float) / 32768
    db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9) if len(x) else -120
    ruido = np.percentile([db(a[i:i + 320]) for i in range(0, len(a) - 320, 320)], 10)
    seg = lambda t0, t1: a[int(max(t0, 0) * SR):int(t1 * SR)]
    malos, t = 0, 0.0
    for i, (s, e) in enumerate(tramos(sys.argv[2])):
        avisos = []
        fin = min(db(seg(e - 0.03, e)), db(seg(e, e + 0.03))) - ruido
        ini = min(db(seg(s - 0.03, s)), db(seg(s, s + 0.03))) - ruido if s > 0.03 else 0
        if fin > 15: avisos.append(f"CORTA FINAL (+{fin:.0f} dB)")
        if ini > 15: avisos.append(f"CORTA INICIO (+{ini:.0f} dB)")
        if e - s < 0.15: avisos.append(f"PEDACITO de {e - s:.2f} s")
        if avisos:
            malos += 1
            print(f"  tramo {i}: {t:.2f}–{t + e - s:.2f} s del corte (toma {s:.2f}–{e:.2f}) · " + " · ".join(avisos))
        t += e - s
    print(f"{'✅ uniones limpias' if not malos else f'❌ {malos} tramos con problema'} · {t:.2f} s")
    sys.exit(1 if malos else 0)

if __name__ == "__main__":
    main()
