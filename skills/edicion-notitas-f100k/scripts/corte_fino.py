"""Corte fino: dentro de los tramos a conservar, saca todo silencio > MIN s (deja PAD a cada lado).

uso: python3 -I corte_fino.py VIDEO DEST tramos.json   (tramos.json = [[ini, fin], ...] en el original)
     PALABRAS=crudo.json (whisper del original) → no saca silencios que caen DENTRO de una palabra (25-oct: partía «transporte»)
     Con PALABRAS, Gemini relee el guion de los tramos y saca muletillas, repeticiones y re-enunciados
     que quedaron (llave en ~/.editor-video/llave-gemini.txt). NOTITAS_SIN_GEMINI=1 lo apaga.
escribe DEST/_source_cut.mov, DEST/edl.json, DEST/cortes.json y DEST/corte.json (el sello que pide el render)
"""
import json, re, subprocess, sys
from pathlib import Path

MIN, PAD, DB = 0.12, 0.05, -38
video, dest, tramos = sys.argv[1], Path(sys.argv[2]), json.load(open(sys.argv[3], encoding="utf-8"))

log = subprocess.run(["ffmpeg", "-v", "info", "-i", video, "-vn", "-af", f"silencedetect=noise={DB}dB:d={MIN}",
                      "-f", "null", "-"], capture_output=True, text=True).stderr
ini = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
fin = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
sil = [(a + PAD, b - PAD) for a, b in zip(ini, fin) if b - a - 2 * PAD > 0.03]
import os
if os.environ.get("PALABRAS"):
    d = json.load(open(os.environ["PALABRAS"], encoding="utf-8"))
    W = [(w["start"], w["end"]) for s in d["segments"] for w in s.get("words", [])]
    sil = [(s, e) for s, e in sil if not any(ws + 0.04 < s and e < we - 0.04 for ws, we in W if we - ws < 0.9)]
    print("silencios fuera de palabras:", len(sil))

# ── Revisión del guion con Gemini (protocolo obligatorio): solo con PALABRAS ──
estado_gemini = "sin_palabras"
if os.environ.get("PALABRAS") and os.environ.get("NOTITAS_SIN_GEMINI") != "1":
    ED = Path(os.environ.get("ED") or Path(__file__).resolve().parents[2] / "editor-video-formula100k" / "scripts")
    sys.path.insert(0, str(ED))
    import cut_silences_and_fillers as eng
    import revision_gemini as rg
    dentro = lambda w: any(a <= (w["start"] + w["end"]) / 2 <= b for a, b in tramos)
    ws = [{"word": w["word"], "start": w["start"], "end": w["end"]}
          for s in d["segments"] for w in s.get("words", []) if dentro(w)]
    llave, _ = rg.leer_llave_gemini()
    gp = dest / "guion.txt"
    kept, quitadas, estado_gemini = eng.gemini_review(ws, llave, None, gp.read_text(encoding="utf-8") if gp.is_file() else None)
    eng.reportar_gemini(estado_gemini, quitadas, len(ws) - len(kept), rg.DEFAULT_GEMINI_MODEL)
    if estado_gemini == "ok":
        vivas = {id(w) for w in kept}
        fuera, i = [], 0
        while i < len(ws):
            if id(ws[i]) in vivas:
                i += 1; continue
            j = i
            while j + 1 < len(ws) and id(ws[j + 1]) not in vivas:
                j += 1
            a = ws[i - 1]["end"] + 0.02 if i > 0 else ws[i]["start"]
            b = ws[j + 1]["start"] - 0.02 if j + 1 < len(ws) else ws[j]["end"]
            fuera.append((min(a, ws[i]["start"]), max(b, ws[j]["end"])))
            i = j + 1
        nuevos = []
        for a, b in tramos:
            cur = a
            for fa, fb in fuera:
                if fb <= cur or fa >= b:
                    continue
                if fa > cur + 0.06:
                    nuevos.append([cur, fa])
                cur = max(cur, fb)
            if b - cur > 0.06:
                nuevos.append([cur, b])
        tramos = nuevos
elif os.environ.get("NOTITAS_SIN_GEMINI") == "1":
    estado_gemini = "apagado"

segs = []
for a, b in tramos:
    cur = a
    for s, e in sil:
        if e <= cur or s >= b:
            continue
        if s > cur + 0.06:
            segs.append((cur, min(s, b)))
        cur = max(cur, e)
    if b - cur > 0.06:
        segs.append((cur, b))

f, edl, t = [], [], 0.0
for i, (a, b) in enumerate(segs):
    d = b - a
    f.append(f"[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,"
             f"afade=t=in:d=0.008,afade=t=out:st={max(d - 0.008, 0):.3f}:d=0.008[a{i}]")
    edl.append({"origStart": round(a, 3), "origEnd": round(b, 3), "newStart": round(t, 3), "newEnd": round(t + d, 3)})
    t += d
f.append("".join(f"[v{i}][a{i}]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=1[v][a]")
fc = dest / "_fc.txt"
fc.write_text(";".join(f), encoding="utf-8")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", video, "-/filter_complex", str(fc), "-map", "[v]", "-map", "[a]",
                "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                str(dest / "_source_cut.mov")], check=True)
json.dump(edl, open(dest / "edl.json", "w", encoding="utf-8"), indent=1)
# cambio de cámara solo en los cortes entre tramos (no en cada micro-silencio)
cortes, acc = [], 0.0
for e in edl[:-1]:
    if e["newEnd"] - acc >= 1.2:
        cortes.append(e["newEnd"]); acc = e["newEnd"]
json.dump({"cortes": cortes}, open(dest / "cortes.json", "w", encoding="utf-8"))
# Sello del corte: sin este archivo el render de notitas no arranca.
dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video],
                     capture_output=True, text=True).stdout.strip()
previo = {}
if (dest / "corte.json").is_file():
    try:
        previo = json.load(open(dest / "corte.json", encoding="utf-8"))
    except ValueError:
        previo = {}
json.dump({**previo, "corte_fino": previo.get("corte_fino", "tramos_a_mano"), "tramos_a_mano": True,
           "revision_gemini": estado_gemini, "duracion_original": round(float(dur or 0), 2),
           "duracion_cortada": round(t, 2), "tramos": len(segs)},
          open(dest / "corte.json", "w", encoding="utf-8"), indent=2)
print(f"{len(segs)} tramos · {t:.2f} s · {len(cortes)} cambios de cámara · revisión Gemini: {estado_gemini}")
