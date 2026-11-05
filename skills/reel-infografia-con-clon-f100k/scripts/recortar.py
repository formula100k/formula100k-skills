#!/usr/bin/env python3
"""
recortar.py — prepara el video de la persona y mide dónde está (cabeza y centro) para encuadrarla.

Uso:  recortar.py <video_cortado> <DEST> [--estilo ventana|recortada] [--modo auto|verde|vision] [--rapida]

--estilo ventana: la persona va abajo en una franja con un poco de su fondo real (como la referencia).
    No se recorta nada: se normaliza el video y Vision solo mide la silueta.
    Salida: DEST/reel/assets/yo.mp4 (H.264, 30 fps, 1080×1920)
--estilo recortada (POR DEFECTO): la persona sin fondo, sin caja.
    Fondo verde → chromakey + despill de ffmpeg (el color se mide solo en los bordes).
    Sin verde   → Mac: segmentación de personas de macOS (Vision), con mascara_persona.swift.
                  Windows (o Mac sin swiftc): rembg con mascara_persona.py, vía uv (gratis, más lento).
    Salida: DEST/reel/assets/yo.webm (VP9 con alfa, 30 fps, 1080×1920)
Siempre:
  DEST/silueta.json          dónde está la persona (cabeza y centro), para colocarla en cada modo
No usa numpy: lee cuadros chicos en crudo con ffmpeg.
"""
import json, os, platform, subprocess, sys, shutil
from pathlib import Path

for _f in (sys.stdout, sys.stderr):
    try:
        _f.reconfigure(encoding="utf-8")
    except Exception:
        pass

SKILL = Path(__file__).resolve().parent.parent
W, H = 1080, 1920


def sh(cmd, **kw):
    return subprocess.run(cmd, check=True, **kw)


def duracion(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", str(p)]).decode().strip())


def cuadro_crudo(src, t, w, h, fmt, vf_extra=""):
    vf = (vf_extra + "," if vf_extra else "") + f"scale={w}:{h}"
    return subprocess.check_output(["ffmpeg", "-loglevel", "error", "-ss", str(t), "-i", str(src), "-frames:v", "1",
                                    "-vf", vf, "-f", "rawvideo", "-pix_fmt", fmt, "-"])


def medir_verde(src):
    """Devuelve el hex del fondo si los bordes son verdes; None si no."""
    d = duracion(src)
    w, h = 24, 42
    bordes = []
    for t in (d * 0.2, d * 0.5, d * 0.8):
        raw = cuadro_crudo(src, t, w, h, "rgb24")
        for y in range(h):
            for x in range(w):
                if x < 2 or x >= w - 2 or y < 3:   # laterales y techo (abajo suele haber mesa o cuerpo)
                    i = (y * w + x) * 3
                    bordes.append(tuple(raw[i:i + 3]))
    verdes = [p for p in bordes if p[1] > p[0] + 35 and p[1] > p[2] + 35]
    if len(verdes) < len(bordes) * 0.6:
        return None
    med = [sorted(c[k] for c in verdes)[len(verdes) // 2] for k in range(3)]
    return "0x%02x%02x%02x" % tuple(med)


def mascara_vision(src, dest, rapida):
    """Video en grises (blanco = persona). Mac: Vision (rápido, sin instalar nada). Si no: rembg vía uv."""
    out = dest / "_mascara.mov"
    fuente = SKILL / "scripts" / "mascara_persona.swift"
    if platform.system() == "Darwin" and fuente.exists() and shutil.which("swiftc") and not os.environ.get("F100K_SIN_APPLE"):
        binario = SKILL / "scripts" / "bin" / "mascara_persona"
        if not binario.exists() or binario.stat().st_mtime < fuente.stat().st_mtime:
            binario.parent.mkdir(parents=True, exist_ok=True)
            print("· compilando la segmentación de personas (una sola vez)…")
            sh(["swiftc", "-O", str(fuente), "-o", str(binario)])
        sh([str(binario), str(src), str(out)] + (["rapida"] if rapida else []))
        return out
    uv = shutil.which("uv")
    if not uv:
        sys.exit("❌ Para recortar a la persona sin fondo verde hace falta uv (Mac: brew install uv · Windows: winget install -e --id astral-sh.uv).")
    print("· recorte con rembg (la primera vez descarga el modelo; tarda unos minutos por minuto de video)…")
    sh([uv, "run", "--quiet", str(SKILL / "scripts" / "mascara_persona.py"), str(src), str(out), "rapida" if rapida else "buena"],
       env={**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"})
    return out


def silueta(mask_src):
    """Mide en 7 cuadros dónde empieza la cabeza y dónde está su centro (coordenadas de 1080×1920)."""
    d = duracion(mask_src)
    w, h = 108, 192
    tops, cxs, fondos = [], [], []
    for k in range(7):
        t = d * (0.1 + 0.8 * k / 6)
        raw = cuadro_crudo(mask_src, t, w, h, "gray", "format=gray")
        filas = [[raw[y * w + x] > 128 for x in range(w)] for y in range(h)]
        top = next((y for y in range(h) if sum(filas[y]) >= 3), None)
        if top is None:
            continue
        cab = [x for y in range(top, min(h, top + 14)) for x in range(w) if filas[y][x]]
        tops.append(top)
        cxs.append(sum(cab) / len(cab))
        ancho = [sum(f) for f in filas[top:]]
        fondos.append(max(ancho))
    if not tops:
        sys.exit("❌ No encontré a ninguna persona en el video. ¿Está bien el archivo?")
    tops.sort(); cxs.sort()
    return {"cabeza_y": round(tops[len(tops) // 2] * H / h), "centro_x": round(cxs[len(cxs) // 2] * W / w),
            "ancho_max": round(max(fondos) * W / w)}


def main():
    a = sys.argv[1:]
    if len(a) < 2:
        sys.exit(__doc__)
    src, dest = Path(a[0]), Path(a[1])
    modo = a[a.index("--modo") + 1] if "--modo" in a else "auto"
    rapida = "--rapida" in a
    estilo = a[a.index("--estilo") + 1] if "--estilo" in a else "recortada"
    assets = dest / "reel" / "assets"; assets.mkdir(parents=True, exist_ok=True)
    norm = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps=30"

    if estilo == "ventana":
        yo = assets / "yo.mp4"
        print("· estilo ventana → video con su fondo real (sin recorte)")
        sh(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vf", f"{norm},format=yuv420p",
            "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-an", str(yo)])
        medida = silueta(mascara_vision(src, dest, True))
        medida.update({"estilo": "ventana", "metodo": "vision", "duracion": round(duracion(src), 3)})
        (dest / "silueta.json").write_text(encoding="utf-8", data=json.dumps(medida, indent=2))
        print(f"✅ {yo}  ·  silueta: cabeza en y={medida['cabeza_y']}, centro x={medida['centro_x']}")
        return

    yo = assets / "yo.webm"

    color = medir_verde(src) if modo in ("auto", "verde") else None
    if modo == "verde" and not color:
        sys.exit("❌ Pediste modo verde pero los bordes del video no son verdes.")
    if color:
        print(f"· fondo verde detectado ({color}) → chromakey")
        sh(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vf",
            f"{norm},chromakey={color}:0.13:0.06,despill=type=green:mix=0.6:expand=0.1,format=yuva420p",
            "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "6M", "-auto-alt-ref", "0", "-an", str(yo)])
        # medir sobre la máscara del chromakey (alfa → gris)
        tmp = dest / "_mascara_verde.mp4"
        sh(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vf",
            f"{norm},chromakey={color}:0.13:0.06,alphaextract,format=gray", "-an", str(tmp)])
        medida = silueta(tmp)
        metodo = "verde"
    else:
        print("· sin fondo verde → segmentación de personas")
        m = mascara_vision(src, dest, rapida)
        # máscara suavizada en el tiempo (sin parpadeo) y con borde firme
        sh(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-i", str(m), "-filter_complex",
            f"[1:v]{norm},format=gray,tmix=frames=3,gblur=sigma=1.2,curves=all='0/0 0.35/0 0.65/1 1/1'[m];"
            f"[0:v]{norm},format=yuva420p[v];[v][m]alphamerge,format=yuva420p",
            "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "6M", "-auto-alt-ref", "0", "-an", str(yo)])
        medida = silueta(m)
        metodo = "vision"

    medida.update({"estilo": "recortada", "metodo": metodo, "duracion": round(duracion(src), 3)})
    (dest / "silueta.json").write_text(encoding="utf-8", data=json.dumps(medida, indent=2))
    print(f"✅ {yo}  ·  silueta: cabeza en y={medida['cabeza_y']}, centro x={medida['centro_x']}")


if __name__ == "__main__":
    main()
