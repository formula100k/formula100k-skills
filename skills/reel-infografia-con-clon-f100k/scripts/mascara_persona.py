# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["rembg[cpu]>=2.0.60", "pillow>=10"]
# ///
"""mascara_persona.py — saca la silueta de la persona de un video SIN fondo verde (Windows, Linux y Mac sin Vision).
Gratis y local: usa rembg con el modelo de personas (u2net_human_seg). La primera vez descarga el modelo (~170 MB).

Uso: uv run mascara_persona.py <entrada> <salida.mov> [rapida|buena]
Salida: video en escala de grises (blanco = persona). Mide la máscara a 10 cuadros por segundo (15 con «buena») y
recortar.py la estira a 30 fps y la suaviza en el tiempo: así no tarda una eternidad en una compu sin tarjeta de video.
"""
import subprocess, sys, tempfile
from pathlib import Path

for _f in (sys.stdout, sys.stderr):
    try:
        _f.reconfigure(encoding="utf-8")
    except Exception:
        pass


def main():
    a = sys.argv[1:]
    if len(a) < 2:
        sys.exit(__doc__)
    src, out = Path(a[0]), Path(a[1])
    fps = 15 if (len(a) > 2 and a[2] == "buena") else 10
    from rembg import new_session, remove
    from PIL import Image
    sesion = new_session("u2net_human_seg")
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        (tmp / "in").mkdir(); (tmp / "m").mkdir()
        # cuadros chicos (lado largo 640): la máscara se agranda después sin que se note
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vf",
                        f"fps={fps},scale='if(gt(iw,ih),640,-2)':'if(gt(iw,ih),-2,640)'", str(tmp / "in" / "%05d.png")], check=True)
        cuadros = sorted((tmp / "in").glob("*.png"))
        if not cuadros:
            sys.exit("❌ No pude leer cuadros del video.")
        for k, f in enumerate(cuadros, 1):
            m = remove(Image.open(f).convert("RGB"), session=sesion, only_mask=True)
            m.convert("L").save(tmp / "m" / f.name)
            if k % 50 == 0:
                print(f"  {k}/{len(cuadros)} cuadros…", flush=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(fps), "-i", str(tmp / "m" / "%05d.png"),
                        "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv420p", str(out)], check=True)
    print(f"✅ máscara: {len(cuadros)} cuadros a {fps} fps → {out}")


if __name__ == "__main__":
    main()
