#!/usr/bin/env python3
"""
trim_cutout.py — Recorta al RAS el margen transparente de un cutout, para que el
sujeto LLENE el marco (arregla el "demasiado espacio alrededor de la persona").

Se usa DESPUÉS de `npx hyperframes remove-background` (cutout local con alpha).

Modos:
  # imagen PNG con alpha -> PNG recortado a la bbox del sujeto (+ margen %)
  python3 trim_cutout.py img  cutout.png  cutout_trim.png  [margin_pct=4]

  # video .webm/.mov con alpha -> recorta a la bbox UNIÓN de N frames muestreados
  # (la persona se mueve; tomamos la caja que la contiene en todo el clip)
  python3 trim_cutout.py vid  cutout.webm cutout_trim.webm [margin_pct=6] [samples=12]

Notas:
- Imagen: usa PIL getbbox() sobre el canal alpha.
- Video: muestrea frames, alphaextract -> bbox por frame con PIL, une las cajas,
  y recorta el clip con ffmpeg `crop` conservando el alpha (VP9/yuva420p o prores).
"""
import sys, os, json, subprocess, tempfile
from PIL import Image


def _bbox_from_alpha(im, thr=10):
    """bbox del contenido NO transparente (alpha > thr). Devuelve (l,t,r,b) o None."""
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    a = im.split()[-1]
    # binariza el alpha para ignorar halos casi-transparentes
    mask = a.point(lambda p: 255 if p > thr else 0)
    return mask.getbbox()


def _pad(box, W, H, pct):
    l, t, r, b = box
    mx = int(W * pct / 100.0)
    my = int(H * pct / 100.0)
    return (max(0, l - mx), max(0, t - my), min(W, r + mx), min(H, b + my))


def trim_image(src, dst, margin_pct=4.0):
    im = Image.open(src).convert("RGBA")
    box = _bbox_from_alpha(im)
    if not box:
        raise SystemExit(f"[trim] {src}: alpha vacío (no hay sujeto).")
    box = _pad(box, im.width, im.height, margin_pct)
    im.crop(box).save(dst)
    l, t, r, b = box
    print(f"[trim img] {os.path.basename(src)} {im.width}x{im.height} -> "
          f"{r-l}x{b-t} (bbox {box}) -> {dst}")


def _ffprobe_wh(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height", "-of", "json", path])
    s = json.loads(out)["streams"][0]
    return int(s["width"]), int(s["height"])


def _ffprobe_dur(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries",
        "format=duration", "-of", "default=nokey=1:noprint_wrappers=1", path])
    return float(out)


def trim_video(src, dst, margin_pct=6.0, samples=12):
    W, H = _ffprobe_wh(src)
    dur = _ffprobe_dur(src)
    tmpd = tempfile.mkdtemp()
    union = None
    n = max(2, int(samples))
    for i in range(n):
        t = dur * (i + 0.5) / n
        fp = os.path.join(tmpd, f"f_{i}.png")
        # alphaextract -> alpha como gris; getbbox sobre el gris (>thr)
        subprocess.run(["ffmpeg", "-y", "-ss", f"{t}", "-i", src, "-vframes", "1",
            "-vf", "alphaextract", fp], check=True, capture_output=True)
        a = Image.open(fp).convert("L")
        mask = a.point(lambda p: 255 if p > 10 else 0)
        bb = mask.getbbox()
        if not bb:
            continue
        if union is None:
            union = list(bb)
        else:
            union[0] = min(union[0], bb[0]); union[1] = min(union[1], bb[1])
            union[2] = max(union[2], bb[2]); union[3] = max(union[3], bb[3])
    if not union:
        raise SystemExit(f"[trim] {src}: alpha vacío en todos los frames.")
    l, t, r, b = _pad(tuple(union), W, H, margin_pct)
    cw, ch = r - l, b - t
    # codec según extensión
    if dst.endswith(".mov"):
        venc = ["-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le"]
    else:  # webm
        venc = ["-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "18"]
    subprocess.run(["ffmpeg", "-y", "-i", src, "-vf", f"crop={cw}:{ch}:{l}:{t}",
        *venc, "-an", dst], check=True, capture_output=True)
    print(f"[trim vid] {os.path.basename(src)} {W}x{H} -> {cw}x{ch} "
          f"(bbox union {(l,t,r,b)}, {n} frames) -> {dst}")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(__doc__); raise SystemExit(1)
    mode, src, dst = sys.argv[1], sys.argv[2], sys.argv[3]
    if mode == "img":
        trim_image(src, dst, float(sys.argv[4]) if len(sys.argv) > 4 else 4.0)
    elif mode == "vid":
        trim_video(src, dst,
                   float(sys.argv[4]) if len(sys.argv) > 4 else 6.0,
                   int(sys.argv[5]) if len(sys.argv) > 5 else 12)
    else:
        raise SystemExit("modo debe ser 'img' o 'vid'")
