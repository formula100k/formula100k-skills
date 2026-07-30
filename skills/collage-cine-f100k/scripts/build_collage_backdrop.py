#!/usr/bin/env python3
"""
build_collage_backdrop.py — Arma un BACKDROP de COLLAGE 9:16 (1080x1920) por bloque,
apilando VARIAS imágenes (escena base + recortes/props/polaroids) en vez de una sola
escena plana. Ese es el look @andrewcodesmith: muchas piezas montadas, no 1 foto.

Arregla la observación "se generaron solo 6 imágenes y no eran collages".

Cada pieza puede ir como:
  - "fill"   : escena base que cubre todo el frame (la primera, opcional)
  - "card"   : recorte/polaroid con marco crema, rotación y sombra, posicionado por %

collage.json (por bloque):
{
  "out": "collage/bloque_1.png",
  "pieces": [
    {"img":"escenas/escena_1.png", "role":"fill"},
    {"img":"props/grafo.png",      "role":"card", "cx":28, "cy":24, "w":46, "rot":-6, "polaroid":true},
    {"img":"props/sticky.png",     "role":"card", "cx":74, "cy":18, "w":30, "rot":7,  "polaroid":false},
    {"img":"props/crt.png",        "role":"card", "cx":70, "cy":40, "w":40, "rot":-3, "polaroid":true}
  ],
  "subject_zone": "bottom"   // deja libre la zona del sujeto: bottom|right|left|none
}
cx,cy = centro de la pieza en % del frame; w = ancho en % del frame; rot = grados.

Uso:
  python3 build_collage_backdrop.py "$DEST" collage_blocks.json
  collage_blocks.json = [ {collage del bloque 0}, {bloque 1}, ... ]
"""
import sys, os, json, math
from PIL import Image, ImageOps, ImageFilter, ImageDraw

W, H = 1080, 1920
CREAM = (244, 236, 216, 255)   # marco polaroid
SHADOW = (0, 0, 0, 140)


def _open(dest, rel):
    p = rel if os.path.isabs(rel) else os.path.join(dest, rel)
    return Image.open(p).convert("RGBA")


def _fit_fill(im, w, h):
    return ImageOps.fit(im, (w, h), method=Image.LANCZOS)


def _polaroid(card, pad=26, bottom_extra=70):
    """Envuelve la pieza en un marco crema tipo polaroid."""
    w, h = card.size
    fw, fh = w + pad * 2, h + pad * 2 + bottom_extra
    frame = Image.new("RGBA", (fw, fh), CREAM)
    frame.paste(card, (pad, pad), card)
    return frame


def _with_shadow(im, blur=22, dx=14, dy=18):
    w, h = im.size
    pad = blur * 3
    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    # sombra a partir del alpha de la pieza
    alpha = im.split()[-1]
    sh = Image.new("RGBA", im.size, SHADOW)
    sh.putalpha(alpha)
    shadow_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_layer.paste(sh, (pad + dx, pad + dy), sh)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(blur))
    canvas = Image.alpha_composite(canvas, shadow_layer)
    canvas.paste(im, (pad, pad), im)
    return canvas


def _place_card(base, piece, dest):
    im = _open(dest, piece["img"])
    target_w = int(W * float(piece.get("w", 40)) / 100.0)
    ratio = target_w / im.width
    im = im.resize((target_w, max(1, int(im.height * ratio))), Image.LANCZOS)
    if piece.get("polaroid"):
        im = _polaroid(im)
    im = _with_shadow(im)
    if piece.get("rot"):
        im = im.rotate(float(piece["rot"]), expand=True, resample=Image.BICUBIC)
    cx = int(W * float(piece.get("cx", 50)) / 100.0)
    cy = int(H * float(piece.get("cy", 50)) / 100.0)
    base.alpha_composite(im, (cx - im.width // 2, cy - im.height // 2))


def _darken_subject_zone(base, zone):
    """Oscurece la zona donde irá el sujeto/talking-head para que destaque."""
    if zone in (None, "none"):
        return
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    if zone == "bottom":
        box = (0, int(H * 0.58), W, H)
    elif zone == "right":
        box = (int(W * 0.5), 0, W, H)
    elif zone == "left":
        box = (0, 0, int(W * 0.5), H)
    else:
        return
    # gradiente simple: rectángulo semi-transparente
    d.rectangle(box, fill=(8, 12, 6, 150))
    base.alpha_composite(ov)


def build_one(spec, dest):
    base = Image.new("RGBA", (W, H), (10, 14, 8, 255))
    pieces = spec.get("pieces", [])
    # primero el fill (si hay)
    for p in pieces:
        if p.get("role") == "fill":
            base.alpha_composite(_fit_fill(_open(dest, p["img"]), W, H), (0, 0))
    _darken_subject_zone(base, spec.get("subject_zone", "bottom"))
    # luego las cards encima
    for p in pieces:
        if p.get("role", "card") == "card":
            _place_card(base, p, dest)
    out = spec["out"]
    if not os.path.isabs(out):
        out = os.path.join(dest, out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    base.convert("RGB").save(out, quality=95)
    print(f"[collage] {len(pieces)} piezas -> {out}")
    return out


def main():
    dest = sys.argv[1]
    specs = json.load(open(sys.argv[2]))
    if isinstance(specs, dict):
        specs = [specs]
    for s in specs:
        build_one(s, dest)


if __name__ == "__main__":
    main()
