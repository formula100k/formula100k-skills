#!/usr/bin/env python3
"""Sello de serie · el título-sticker que se repite en cada capítulo (ej.: «el maniquí me viste»,
«mis cosas de los 2000s», «5 días de viaje · 6 outfits»).

Letra gruesa e inclinada, en 2–3 líneas apiladas, color de relleno + contorno blanco grueso + sombra dura,
apenas girado, con un contador opcional («3/6») en una etiqueta. Fondo transparente: se pasa en el plan
como "sello" y queda quieto arriba los primeros segundos (y, si quieres, otra vez al final).

    uv run --with pillow python3 sello_serie.py "el maniquí|me viste" --color "#7B5CD6" --acento "#2FB34A" \
        --contador "2/6" --out sello.png

Sin brillo ni degradado 3D: color plano, contorno y sombra dura, nada más.
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

K = Path(__file__).resolve().parent.parent
RUBIK = K / "fuentes" / "Rubik[wght].ttf"


def hexa(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def fuente(tam, peso=900):
    f = ImageFont.truetype(str(RUBIK), tam)
    try:
        f.set_variation_by_axes([peso])
    except Exception:
        pass
    return f


def linea(texto, f, relleno, borde=16, sombra=(40, 20, 60, 255)):
    d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    bb = d.textbbox((0, 0), texto, font=f, stroke_width=borde)
    w, h = bb[2] - bb[0] + 40, bb[3] - bb[1] + 40
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    di = ImageDraw.Draw(im)
    o = (20 - bb[0], 20 - bb[1])
    di.text((o[0] + 8, o[1] + 10), texto, font=f, fill=sombra, stroke_width=borde, stroke_fill=sombra)
    di.text(o, texto, font=f, fill=relleno, stroke_width=borde, stroke_fill=(255, 255, 255, 255))
    # inclinación tipo cursiva (shear), como el sticker de la referencia
    return im.transform(im.size, Image.AFFINE, (1, 0.18, -0.09 * h, 0, 1, 0), resample=Image.BICUBIC)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("texto", help="líneas separadas por |  (la más importante, la más grande: márcala con *)")
    ap.add_argument("--color", default="#7B5CD6", help="relleno de las líneas")
    ap.add_argument("--acento", default="#2FB34A", help="relleno de la línea marcada con *")
    ap.add_argument("--contador", help="etiqueta chica, ej. «3/6» o «día 2»")
    ap.add_argument("--giro", type=float, default=-6)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    filas = []
    for t in a.texto.split("|"):
        grande = t.startswith("*")
        t = t.lstrip("*").strip()
        filas.append(linea(t, fuente(170 if grande else 120), hexa(a.acento if grande else a.color)))
    ancho = max(f.width for f in filas)
    alto = sum(f.height for f in filas) - 50 * (len(filas) - 1)
    lz = Image.new("RGBA", (ancho + 120, alto + 200), (0, 0, 0, 0))
    y = 60
    for i, f in enumerate(filas):          # escalonado: cada línea corrida un poco a la derecha
        x = 30 + i * 40 if i % 2 else 30
        lz.alpha_composite(f, (min(x, lz.width - f.width), y))
        y += f.height - 50
    if a.contador:
        f = fuente(64, 800)
        d = ImageDraw.Draw(lz)
        bb = d.textbbox((0, 0), a.contador, font=f)
        tw, th = bb[2] - bb[0] + 48, bb[3] - bb[1] + 30
        et = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
        de = ImageDraw.Draw(et)
        de.rounded_rectangle([0, 0, tw - 1, th - 1], 14, fill=(255, 255, 255, 255), outline=(40, 20, 60, 255), width=5)
        de.text((tw / 2, th / 2), a.contador, font=f, fill=(40, 20, 60, 255), anchor="mm")
        et = et.rotate(8, expand=True, resample=Image.BICUBIC)
        lz.alpha_composite(et, (lz.width - et.width - 10, 0))
    lz = lz.rotate(-a.giro, expand=True, resample=Image.BICUBIC)
    lz = lz.crop(lz.getbbox())
    lz.save(a.out)
    print(f"✅ {a.out}  {lz.size}")


if __name__ == "__main__":
    main()
