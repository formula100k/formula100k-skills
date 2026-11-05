#!/usr/bin/env python3
"""
montar.py — arma el diálogo: intercala tramos de la toma NARRADORA y de la toma del CLON en un solo video.

Uso:  montar.py <DEST>
Lee:   DEST/montaje.json
Deja:  DEST/_source_cut.mov   el video montado (la voz que manda desde aquí; ya no se corta más)
       DEST/captions.json     palabra por palabra, remapeada al video montado (sin volver a transcribir)
       DEST/clon.json         [{"desde", "hasta"}] tramos del clon en el video montado
       DEST/edl.json          [{"toma", "origStart", "origEnd", "newStart", "newEnd"}] (las uniones = cortes)

montaje.json:
{
  "tomas": {
    "narradora": {"video": "/ruta/narradora/_source_cut.mov", "captions": "/ruta/narradora/captions.json"},
    "clon":      {"video": "/ruta/clon/_source_cut.mov",      "captions": "/ruta/clon/captions.json", "vol": 1.0}
  },
  "tramos": [
    {"toma": "narradora", "desde": "Deja", "hasta": "rubro"},
    {"toma": "clon",      "desde": "sí",   "hasta": "sí"},
    {"toma": "narradora", "desde": "Este es", "hasta": "común"},
    {"toma": "narradora", "desde": 28.1, "hasta": 31.2}
  ]
}
- "desde" / "hasta" aceptan PALABRAS (la frase se busca en la transcripción de esa toma, en orden; "@2" pide la
  2.ª vez que aparece) o SEGUNDOS de esa toma.
- El borde se pone dentro del silencio vecino: nunca corta una palabra (desde = hasta 0,10 s antes de la primera
  palabra sin pisar la anterior; hasta = hasta 0,12 s después de la última sin pisar la siguiente) + fundido de 12 ms.
- Con UNA sola toma (sin clon) sirve igual para quedarte con los tramos que quieres del corte fino.
- Cada toma trae su "captions": sale del corte fino de editor-video-formula100k (node editar.mjs <toma> --solo-corte).
"""
import json, re, subprocess, sys, unicodedata
from pathlib import Path

# Windows: la consola y los archivos en UTF-8 (tildes, «», ✅)
for _f in (sys.stdout, sys.stderr):
    try:
        _f.reconfigure(encoding="utf-8")
    except Exception:
        pass



def norm(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^\w]+", "", s)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", str(p)]).decode().strip())


def buscar(words, frase, desde_i=0):
    """Índices (i, j) de la frase en words, empezando en desde_i. 'frase@n' = la n-ésima vez en toda la toma."""
    n = None
    if "@" in frase:
        frase, n = frase.rsplit("@", 1); n = int(n); desde_i = 0
    toks = [norm(t) for t in frase.split() if norm(t)]
    vistos = 0
    for i in range(desde_i, len(words) - len(toks) + 1):
        if all(norm(words[i + k]["word"]) == toks[k] for k in range(len(toks))):
            vistos += 1
            if n is None or vistos == n:
                return i, i + len(toks) - 1
    return None


def transcribir(video, work):
    sys.exit(f"❌ Falta captions.json de {video}. Pásala antes por el corte fino:\n"
             f"   node <editor-video-formula100k>/scripts/editar.mjs \"{video}\" --solo-corte --carpeta <carpeta>")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    dest = Path(sys.argv[1]).resolve()
    cfg = json.loads((dest / "montaje.json").read_text(encoding="utf-8"))
    work = dest / "_montaje"; work.mkdir(exist_ok=True)

    tomas = {}
    for nombre, t in cfg["tomas"].items():
        cap = t.get("captions")
        words = json.loads(Path(cap).read_text(encoding="utf-8")) if cap and Path(cap).exists() else transcribir(t["video"], work)
        words = [w for w in words if (w.get("word") or "").strip()]
        tomas[nombre] = {"video": t["video"], "words": words, "dur": dur(t["video"]), "vol": t.get("vol", 1.0), "cursor": 0}

    segs, errores = [], []
    for k, tr in enumerate(cfg["tramos"]):
        T = tomas.get(tr["toma"])
        if not T:
            errores.append(f"Tramo {k}: no existe la toma «{tr['toma']}»."); continue
        W = T["words"]

        def lado(v, es_fin):
            if isinstance(v, (int, float)):
                return float(v), None
            r = buscar(W, str(v), T["cursor"])
            if not r:
                errores.append(f"Tramo {k}: no encuentro «{v}» en la toma {tr['toma']} (desde la palabra {T['cursor']})."); return None, None
            i, j = r
            if es_fin:
                fin = W[j]["end"]; sig = W[j + 1]["start"] if j + 1 < len(W) else T["dur"]
                return min(fin + 0.12, max(fin + 0.02, sig - 0.03)), j
            ini = W[i]["start"]; ant = W[i - 1]["end"] if i > 0 else 0.0
            T["cursor"] = i
            return max(ini - 0.10, min(ini - 0.02, ant + 0.03), 0.0), i
        a, ia = lado(tr["desde"], False)
        b, jb = lado(tr["hasta"], True)
        if a is None or b is None:
            continue
        if jb is not None:
            T["cursor"] = jb + 1
        if b <= a + 0.1:
            errores.append(f"Tramo {k}: dura {b - a:.2f} s (¿«hasta» antes de «desde»?)."); continue
        segs.append({"toma": tr["toma"], "a": round(a, 3), "b": round(b, 3), "vol": tr.get("vol", T["vol"])})

    if errores:
        for e in errores:
            print("❌", e)
        sys.exit(1)

    # extraer cada tramo normalizado (1080×1920, 30 fps, 48 kHz estéreo) con fundido de 12 ms en la voz
    partes = []
    for k, s in enumerate(segs):
        out = work / f"t{k:02d}.mov"
        d = s["b"] - s["a"]
        vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p"
        af = f"aresample=48000,aformat=channel_layouts=stereo,volume={s['vol']},afade=t=in:d=0.012,afade=t=out:st={max(0, d - 0.012):.3f}:d=0.012"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{s['a']:.3f}", "-i", tomas[s["toma"]]["video"], "-t", f"{d:.3f}",
                        "-vf", vf, "-af", af, "-c:v", "libx264", "-crf", "15", "-preset", "fast", "-c:a", "pcm_s16le", str(out)], check=True)
        partes.append(out)
    lista = work / "lista.txt"
    lista.write_text(encoding="utf-8", data="".join(f"file '{p.as_posix()}'\n" for p in partes))
    final = dest / "_source_cut.mov"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lista), "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "256k", str(final)], check=True)

    # remapear palabras y armar edl / clon con las duraciones REALES de cada parte
    t, palabras, edl, clon = 0.0, [], [], []
    for s, p in zip(segs, partes):
        d = dur(p)
        for w in tomas[s["toma"]]["words"]:
            if w["start"] >= s["a"] - 0.01 and w["end"] <= s["b"] + 0.05:
                palabras.append({"word": w["word"], "start": round(w["start"] - s["a"] + t, 3),
                                 "end": round(min(w["end"], s["b"]) - s["a"] + t, 3), "toma": s["toma"]})
        edl.append({"toma": s["toma"], "origStart": s["a"], "origEnd": s["b"], "newStart": round(t, 3), "newEnd": round(t + d, 3)})
        if s["toma"] != "narradora":
            clon.append({"desde": round(t, 3), "hasta": round(t + d, 3), "toma": s["toma"]})
        t += d
    (dest / "captions.json").write_text(encoding="utf-8", data=json.dumps(palabras, ensure_ascii=False, indent=1))
    (dest / "edl.json").write_text(encoding="utf-8", data=json.dumps(edl, indent=1))
    (dest / "clon.json").write_text(encoding="utf-8", data=json.dumps(clon, indent=1))
    print(f"✅ {final}  ·  {t:.2f} s · {len(segs)} tramos · {len(clon)} cortes al clon · {len(palabras)} palabras")
    for e in edl:
        print(f"   {e['newStart']:6.2f}–{e['newEnd']:6.2f}  {e['toma']:<10} ({e['origStart']:.2f}–{e['origEnd']:.2f} de la toma)")
    print("   Escucha cada unión: si una palabra queda mocha, mueve ese borde con segundos en montaje.json.")


if __name__ == "__main__":
    main()
