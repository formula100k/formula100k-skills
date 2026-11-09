# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "faster-whisper"]
# ///
"""
Escucha el corte PIEZA POR PIEZA (30-oct). Whisper sobre el corte entero NO sirve para revisar: rellena las sílabas
que faltan y funde las repeticiones («no regales | no regales nada» sale como una sola frase). Este script:

  1. BORDES: mira 250 ms fuera de cada borde. Si ahí sigue la voz, el tramo se comió el final o el inicio de una
     palabra aunque el borde caiga en un valle (7293 «about pa|ge», 7295 «en torno a | Skool»).
  2. PIEZAS: transcribe cada tramo SOLO (whisper.cpp large-v3) y los imprime en orden, para leerlos como se oyen.
  3. REPETICIONES: avisa si una pieza empieza con las mismas palabras con las que termina (o empieza) la anterior.

Uso:  escuchar_corte.py <toma_original_st.mov> <n>/edl.json [--sin-whisper]
Sale con código 1 si hay algo que revisar. Después de arreglar tramos2.json y recortar, se corre de nuevo.
"""
import json, os, re, shutil, subprocess, sys, tempfile
import numpy as np

SR = 16000
MODELO = os.path.expanduser("~/.cache/hyperframes/whisper/models/ggml-large-v3.bin")


def leer_tramos(p):
    j = json.load(open(p))
    if isinstance(j, dict):
        j = j.get("keep") or j.get("segmentos") or j.get("segments")
    if j and isinstance(j[0], dict):
        return [(s["origStart"], s["origEnd"]) for s in j]
    return [tuple(x) for x in j]


def normal(t):
    t = t.lower()
    for a, b in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u")):
        t = t.replace(a, b)
    return re.findall(r"[a-zñ0-9]+", t)


_fw = None


def transcribir(w):
    """whisper.cpp large-v3 si está instalado; si no, faster-whisper (Mac y Windows)."""
    global _fw
    if shutil.which("whisper-cli") and os.path.exists(MODELO):
        return subprocess.run(["whisper-cli", "-m", MODELO, "-l", "es", "-f", w, "-nt", "-np"],
                              capture_output=True, text=True).stdout.replace("\n", " ").strip()
    if _fw is None:
        from faster_whisper import WhisperModel
        _fw = WhisperModel("large-v3", device="cpu", compute_type="int8")
    segs, _ = _fw.transcribe(w, language="es", beam_size=5)
    return " ".join(x.text.strip() for x in segs)


def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(2)
    toma, edl = sys.argv[1], sys.argv[2]
    con_whisper = "--sin-whisper" not in sys.argv
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", toma, "-vn", "-ac", "1", "-ar", str(SR),
                        "-f", "s16le", "-"], capture_output=True, check=True)
    a = np.frombuffer(r.stdout, np.int16).astype(float) / 32768
    db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9) if len(x) else -120
    ruido = np.percentile([db(a[i:i + 320]) for i in range(0, len(a) - 320, 320)], 10)
    tramos = leer_tramos(edl)

    def voz(t0, t1):  # el cuadro de 40 ms más fuerte en [t0, t1], sobre el ruido
        t0, t1 = max(t0, 0), min(t1, len(a) / SR)
        cuadros = [db(a[int(t * SR):int((t + 0.04) * SR)]) for t in np.arange(t0, t1 - 0.039, 0.02)]
        return (max(cuadros) - ruido) if cuadros else 0

    avisos, piezas, t = [], [], 0.0
    tmp = tempfile.mkdtemp()
    for i, (s, e) in enumerate(tramos):
        sig = tramos[i + 1][0] if i + 1 < len(tramos) else None
        ant = tramos[i - 1][1] if i else None
        # solo se mira lo que se QUITÓ (hasta el inicio del tramo siguiente si viene de la misma toma)
        fin_quitado = e + 0.25 if sig is None or sig < e else min(e + 0.25, sig)
        if fin_quitado - e > 0.04:
            v = voz(e, fin_quitado)
            if v > 18: avisos.append(f"tramo {i} ({t + e - s:.2f} s del corte · toma {e:.2f}): SIGUE LA VOZ después del final (+{v:.0f} dB) → ¿palabra mocha?")
        ini_quitado = s - 0.25 if ant is None or ant > s else max(s - 0.25, ant)
        if s > 0.3 and s - ini_quitado > 0.04:
            v = voz(ini_quitado, s)
            if v > 18: avisos.append(f"tramo {i} ({t:.2f} s del corte · toma {s:.2f}): HAY VOZ justo antes del inicio (+{v:.0f} dB) → ¿sílaba comida?")
        if con_whisper:
            w = f"{tmp}/{i}.wav"
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(s), "-to", str(e), "-i", toma,
                            "-ar", str(SR), "-ac", "1", "-af", "adelay=300,apad=pad_dur=0.6", w], check=True)
            txt = transcribir(w)
            piezas.append(txt)
            print(f"{i:2d} {t:6.2f}  (toma {s:6.2f}-{e:6.2f}) | {txt}")
        t += e - s

    for i in range(1, len(piezas)):
        p, q = normal(piezas[i - 1]), normal(piezas[i])
        for k in (4, 3, 2):
            if len(q) >= k and (q[:k] == p[-k:] or q[:k] == p[:k]):
                avisos.append(f"tramo {i}: REPITE «{' '.join(q[:k])}» de la pieza anterior → ¿retoma que quedó?")
                break

    print()
    for x in avisos: print("  ⚠️ ", x)
    print("✅ se oye limpio" if not avisos else f"❌ {len(avisos)} cosas por revisar (escúchalas antes de descartarlas)")
    sys.exit(1 if avisos else 0)


if __name__ == "__main__":
    main()
