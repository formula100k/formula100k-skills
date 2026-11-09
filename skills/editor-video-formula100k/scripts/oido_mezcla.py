# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy"]
# ///
"""Oído de mezcla: revisa el audio de un reel TERMINADO (con efectos) con mediciones, no con IA.

Gemini escucha la VOZ (repeticiones, palabras mochas) pero NO oye los ruidos: el 31-oct-2026 no detectó un pitido
de 4 kHz ni un golpe fuerte metidos a propósito. Esto mide lo que Gemini no oye:
  - agudo:   tono puro sobre 3 kHz (pitido, timbre, campana, ding, tecla, clic metálico) · regla 30-oct «sin pitidos».
             Las «s» de la voz también tienen agudos, pero cortas y más bajas; un pitido es un pico > 14 dB sobre las «s»
             (percentil 90) que dura ≥ 100 ms.
  - fuerte:  (INFORMATIVO, no frena) un golpe muy por encima de la voz. Calibrado con 1 golpe plantado; en los 11 reels
             del 31-oct marcó también los efectos normales de las notitas, así que no es confiable para decidir solo.
  - hueco:   silencio > 0,7 s (con la voz el reel no debería quedarse callado).

Uso: uv run --with numpy python -I oido_mezcla.py <reel.mp4|audio> [salida.json] [--voz _source_cut.mov]
  --voz  (recomendado) el corte de SOLO voz con la misma línea de tiempo: entonces «fuerte» compara cada ventana del
         reel contra la voz sola en ese mismo segundo, y solo avisa cuando lo que sobresale es un EFECTO (no ella subiendo la voz).
Sale con código 1 si encontró algo. Cada aviso trae el segundo para escucharlo.
"""
import json, subprocess, sys
import numpy as np

SR, VENT = 44100, 0.05


def audio(ruta):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", ruta, "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def agrupar(ts, sep=0.3):
    out = []
    for t in ts:
        if out and t - out[-1][1] <= sep:
            out[-1][1] = t
        else:
            out.append([t, t])
    return out


def main():
    args = [a for a in sys.argv[1:]]
    voz_ruta = None
    if "--voz" in args:
        i = args.index("--voz"); voz_ruta = args[i + 1]; del args[i:i + 2]
    sys.argv = [sys.argv[0]] + args
    ruta = sys.argv[1]
    x = audio(ruta)
    n = int(SR * VENT)
    frames = len(x) // n
    X = x[:frames * n].reshape(frames, n) * np.hanning(n)
    spec = np.abs(np.fft.rfft(X, axis=1))
    freqs = np.fft.rfftfreq(n, 1 / SR)
    alta = freqs >= 3000
    rms = 20 * np.log10(np.sqrt((x[:frames * n].reshape(frames, n) ** 2).mean(1)) + 1e-9)
    hf = spec[:, alta]
    pk_db = 20 * np.log10(hf.max(1) + 1e-9)            # el pico más fuerte sobre 3 kHz en cada ventana
    vozm = rms > -40
    pk_ref = np.percentile(pk_db[vozm], 90) if vozm.any() else 0     # cómo suenan los agudos normales de la voz («s»)
    ref = np.median(rms[vozm]) if vozm.any() else -20               # nivel normal de la voz
    t = np.arange(frames) * VENT
    avisos = []
    agudo = pk_db > pk_ref + 14
    agudo &= np.r_[agudo[1:], False] | np.r_[False, agudo[:-1]]      # dura al menos 2 ventanas (100 ms): no es una «s»
    for a, b in agrupar(t[agudo]):
        f = freqs[alta][hf[int(round(a / VENT))].argmax()]
        avisos.append({"inicio": round(a, 2), "fin": round(b + VENT, 2), "tipo": "agudo",
                       "motivo": f"tono agudo de ~{f / 1000:.1f} kHz, {pk_db[int(round(a / VENT))] - pk_ref:.0f} dB sobre las «s» de la voz (pitido/timbre/tecla): cámbialo por un pop o golpe grave"})
    if voz_ruta:
        v = audio(voz_ruta)
        v = np.pad(v, (0, max(0, frames * n - len(v))))[:frames * n]
        vr = 20 * np.log10(np.sqrt((v.reshape(frames, n) ** 2).mean(1)) + 1e-9)
        hab = (vr > np.percentile(vr, 40)) & vozm
        gan = np.median(rms[hab] - vr[hab]) if hab.any() else 0          # cuánto subió la voz el render (normalización)
        exceso = rms - (np.maximum(vr, np.median(vr[hab]) if hab.any() else vr) + gan)
        fuerte = (exceso > 6) & (rms > ref)
        for a, b in agrupar(t[fuerte]):
            i0, i1 = int(round(a / VENT)), int(round(b / VENT)) + 1
            avisos.append({"inicio": round(a, 2), "fin": round(b + VENT, 2), "tipo": "fuerte",
                           "motivo": f"un efecto suena {exceso[i0:i1].max():.0f} dB más que tu voz en ese momento: bájalo"})
    else:
        for a, b in agrupar(t[rms > ref + 9]):
            pico = rms[int(round(a / VENT)):int(round(b / VENT)) + 1].max()
            avisos.append({"inicio": round(a, 2), "fin": round(b + VENT, 2), "tipo": "fuerte",
                           "motivo": f"{pico - ref:.0f} dB sobre la voz normal (sin --voz no sé si es un efecto o tu voz)"})
    callado = rms < -50
    i = 0
    while i < frames:
        if callado[i]:
            j = i
            while j < frames and callado[j]:
                j += 1
            if (j - i) * VENT > 0.7 and i > 0 and j < frames:
                avisos.append({"inicio": round(i * VENT, 2), "fin": round(j * VENT, 2), "tipo": "hueco",
                               "motivo": f"{(j - i) * VENT:.1f} s de silencio"})
            i = j
        else:
            i += 1
    avisos.sort(key=lambda a: a["inicio"])
    res = {"archivo": ruta, "voz_db": round(float(ref), 1), "agudos_voz_db": round(float(pk_ref), 1), "avisos": avisos}
    if len(sys.argv) > 2:
        json.dump(res, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
    for a in avisos:
        print(f"{a['inicio']:7.2f}s  {a['tipo']:7s} {a['motivo']}")
    graves = [a for a in avisos if a["tipo"] in ("agudo", "hueco")]
    info = len(avisos) - len(graves)
    if graves:
        print(f"❌ {len(graves)} avisos que hay que arreglar (agudo/hueco)" + (f" · {info} «fuerte» informativos" if info else ""))
    else:
        print("✅ sin pitidos ni huecos" + (f" · {info} «fuerte» informativos (no validados: los efectos normales de cada notita también salen)" if info else ""))
    sys.exit(1 if graves else 0)


if __name__ == "__main__":
    main()
