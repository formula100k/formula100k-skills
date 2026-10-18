# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["rembg[cpu]>=2.0.60", "pillow>=10"]
# ///
"""Separa a la persona (o el sujeto principal) del fondo y deja un PNG transparente, recortado justo al borde
del sujeto. Gratis y local. Lo llama sistema.mjs con `uv run`, que baja Python y lo que haga falta.

Uso: uv run recortar.py foto.jpg salida.png
El modelo se cambia con F100K_REMBG_MODELO (por defecto u2net; isnet-general-use y birefnet-general también sirven).
Sale con 2 si no encuentra un sujeto claro.
"""
import os
import sys
from pathlib import Path


def main() -> int:
    for flujo in (sys.stdout, sys.stderr):
        try:
            flujo.reconfigure(encoding="utf-8")
        except Exception:
            pass
    if len(sys.argv) < 3:
        print("uso: recortar.py foto.jpg salida.png")
        return 1
    entrada, salida = Path(sys.argv[1]), Path(sys.argv[2])

    from PIL import Image, ImageOps

    try:
        foto = Image.open(entrada)
        foto = ImageOps.exif_transpose(foto).convert("RGBA")  # respeta la foto girada del celular
    except Exception as e:
        print(f"No pude abrir la foto: {entrada} ({e})")
        return 1

    from rembg import new_session, remove

    sesion = new_session(os.environ.get("F100K_REMBG_MODELO") or "u2net")
    sin_fondo = remove(foto, session=sesion, post_process_mask=True)

    alfa = sin_fondo.getchannel("A")
    caja = alfa.point(lambda v: 255 if v > 24 else 0).getbbox()
    cubierto = sum(alfa.histogram()[25:]) / float(alfa.width * alfa.height)
    if caja is None or cubierto < 0.005:
        print("No encontré ninguna persona ni objeto claro en la foto. Prueba con una donde el sujeto se separe del fondo.")
        return 2
    recorte = sin_fondo.crop(caja)
    salida.parent.mkdir(parents=True, exist_ok=True)
    recorte.save(salida, "PNG")
    print(f"recorte -> {salida} ({recorte.width}x{recorte.height})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
