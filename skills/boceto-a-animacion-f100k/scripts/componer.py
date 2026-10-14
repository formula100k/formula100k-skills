#!/usr/bin/env python3
"""Compone el clip animado para el reel. Tres salidas:

  solo      clip normalizado a 1080x1920, 30 fps, sin audio (para B-roll del editor)
  split     "Animación | Boceto" lado a lado sobre el propio clip desenfocado (el formato del reel)
  revelado  el boceto a pantalla completa y se transforma en la animación (sirve de gancho)

Uso:
  componer.py solo     --clip clip.mp4 --out clip_9x16.mp4
  componer.py split    --clip clip.mp4 --boceto boceto.jpg --out split.mp4 \
                       [--titulo "Animación con IA"] [--etiquetas "Animación,Boceto"] [--cta "Comenta DIBUJO"]
  componer.py revelado --clip clip.mp4 --boceto boceto.jpg --out revelado.mp4 \
                       [--sosten 1.2] [--transicion fade]

Solo necesita ffmpeg + Pillow (pip install pillow). Muchos ffmpeg NO traen drawtext: todo el texto se dibuja con PIL
como PNG y se pega con overlay.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

W, H, FPS = 1080, 1920, 30
FUENTES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",       # macOS
    "C:/Windows/Fonts/arialbd.ttf",                             # Windows
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",   # Linux
]
def _hex(h, defecto):
    h = (h or defecto).lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)

# El acento y la tinta de su marca (color.acento y color.tinta de mi-marca/marca.md).
# Se pasan por entorno: ACENTO=#2e7d6f TINTA=#14141a python componer.py ...
DORADO = _hex(os.environ.get('ACENTO'), '#2E7D6F')
TINTA = _hex(os.environ.get('TINTA'), '#14141A')

# Geometría del split: dos paneles 9:16 de 500x889 con 26 px de aire entre ellos
PANEL_W, PANEL_H = 500, 889
PANEL_Y = 380
PANEL_X = (W - 2 * PANEL_W - 26) // 2
RADIO = 28


def fuente(tam):
    for ruta in FUENTES:
        try:
            return ImageFont.truetype(ruta, tam)
        except OSError:
            continue
    return ImageFont.load_default(tam)


def duracion(ruta):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(ruta)],
        capture_output=True, text=True, check=True,
    ).stdout
    return float(json.loads(out)["format"]["duration"])


def ffmpeg(args):
    cmd = ["ffmpeg", "-v", "error", "-y", *args]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"ffmpeg falló:\n{' '.join(cmd)}\n{r.stderr}")


def cubrir(img, w, h, fondo=(255, 255, 255)):
    """Recorta al centro para llenar w x h sin deformar (boceto sobre papel blanco)."""
    img = ImageOps.exif_transpose(img).convert("RGBA")
    base = Image.new("RGBA", img.size, fondo + (255,))
    base.alpha_composite(img)
    return ImageOps.fit(base.convert("RGB"), (w, h), Image.LANCZOS)


def contener(img, w, h, fondo=(250, 248, 243)):
    """Encaja entero, sin recortar, sobre papel: el boceto completo tiene que verse."""
    img = ImageOps.exif_transpose(img).convert("RGB")
    escala = min(w / img.width, h / img.height)  # agranda también: thumbnail() solo achica
    img = img.resize((round(img.width * escala), round(img.height * escala)), Image.LANCZOS)
    lienzo = Image.new("RGB", (w, h), fondo)
    lienzo.paste(img, ((w - img.width) // 2, (h - img.height) // 2))
    return lienzo


def mascara_redonda(w, h, r):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255)
    return m


def capa_texto_split(titulo, etiquetas, cta, ruta):
    capa = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)

    if titulo:
        f = fuente(54)
        tw = d.textlength(titulo, font=f)
        px, py = 34, 20
        x0 = (W - tw) / 2 - px
        d.rounded_rectangle((x0, 150, x0 + tw + 2 * px, 150 + 54 + 2 * py), 22, fill=(255, 255, 255, 245))
        d.text((W / 2, 150 + py + 27), titulo, font=f, fill=TINTA, anchor="mm")

    f = fuente(46)
    for i, (txt, color) in enumerate(zip(etiquetas, (DORADO, (255, 255, 255, 255)))):
        cx = PANEL_X + i * (PANEL_W + 26) + PANEL_W / 2
        d.text((cx + 2, PANEL_Y - 42 + 3), txt, font=f, fill=(0, 0, 0, 140), anchor="mm")
        d.text((cx, PANEL_Y - 42), txt, font=f, fill=color, anchor="mm")

    if cta:
        f = fuente(76)
        y = PANEL_Y + PANEL_H + 170
        d.text((W / 2 + 3, y + 4), cta, font=f, fill=(0, 0, 0, 150), anchor="mm")
        d.text((W / 2, y), cta, font=f, fill=(255, 255, 255, 255), anchor="mm")

    capa.save(ruta)


def solo(a):
    ffmpeg([
        "-i", a.clip, "-an",
        "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},format=yuv420p",
        "-c:v", "libx264", "-crf", "18", "-preset", "medium", a.out,
    ])


def split(a, tmp):
    etiquetas = [e.strip() for e in a.etiquetas.split(",")][:2]
    if len(etiquetas) != 2:
        sys.exit("--etiquetas necesita dos textos separados por coma, p. ej. \"Animación,Boceto\"")

    panel = contener(Image.open(a.boceto), PANEL_W, PANEL_H).convert("RGBA")
    panel.putalpha(mascara_redonda(PANEL_W, PANEL_H, RADIO))
    panel.save(tmp / "boceto_panel.png")
    mascara_redonda(PANEL_W, PANEL_H, RADIO).save(tmp / "mascara.png")
    capa_texto_split(a.titulo, etiquetas, a.cta, tmp / "texto.png")

    dur = duracion(a.clip)
    x_izq, x_der = PANEL_X, PANEL_X + PANEL_W + 26
    filtro = (
        f"[0:v]fps={FPS},split[a][b];"
        # fondo: el mismo clip, llenando la pantalla, desenfocado y oscurecido
        f"[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
        f"gblur=sigma=38,eq=brightness=-0.12:saturation=0.9[fondo];"
        # panel izquierdo: la animación con esquinas redondas
        f"[b]scale={PANEL_W}:{PANEL_H}:force_original_aspect_ratio=increase,crop={PANEL_W}:{PANEL_H},"
        f"format=rgba[cl];[2:v]format=gray[m];[cl][m]alphamerge[anim];"
        f"[fondo][anim]overlay={x_izq}:{PANEL_Y}:shortest=1[v1];"
        f"[v1][1:v]overlay={x_der}:{PANEL_Y}[v2];"
        f"[v2][3:v]overlay=0:0,format=yuv420p[v]"
    )
    ffmpeg([
        "-i", a.clip,
        "-loop", "1", "-t", f"{dur:.3f}", "-i", str(tmp / "boceto_panel.png"),
        "-loop", "1", "-t", f"{dur:.3f}", "-i", str(tmp / "mascara.png"),
        "-loop", "1", "-t", f"{dur:.3f}", "-i", str(tmp / "texto.png"),
        "-filter_complex", filtro, "-map", "[v]", "-an",
        "-t", f"{dur:.3f}", "-c:v", "libx264", "-crf", "18", "-preset", "medium", a.out,
    ])


def revelado(a, tmp):
    cubrir(Image.open(a.boceto), W, H).save(tmp / "boceto_full.png") if a.recortar else \
        contener(Image.open(a.boceto), W, H).save(tmp / "boceto_full.png")
    t = 0.6
    sosten = max(a.sosten, t + 0.1)
    filtro = (
        f"[0:v]scale={W}:{H},fps={FPS},format=yuv420p,settb=AVTB[s];"
        f"[1:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
        f"fps={FPS},format=yuv420p,settb=AVTB[c];"
        f"[s][c]xfade=transition={a.transicion}:duration={t}:offset={sosten - t:.3f}[v]"
    )
    ffmpeg([
        "-loop", "1", "-t", f"{sosten:.3f}", "-i", str(tmp / "boceto_full.png"),
        "-i", a.clip,
        "-filter_complex", filtro, "-map", "[v]", "-an",
        "-c:v", "libx264", "-crf", "18", "-preset", "medium", a.out,
    ])


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("modo", choices=["solo", "split", "revelado"])
    p.add_argument("--clip", required=True)
    p.add_argument("--boceto")
    p.add_argument("--out", required=True)
    p.add_argument("--titulo", default="")
    p.add_argument("--etiquetas", default="Animación,Boceto")
    p.add_argument("--cta", default="")
    p.add_argument("--sosten", type=float, default=1.2, help="segundos que se ve el boceto antes de transformarse")
    p.add_argument("--transicion", default="fade", help="cualquier transición de xfade: fade, wipeup, circleopen, pixelize…")
    p.add_argument("--recortar", action="store_true", help="revelado: llenar la pantalla recortando el boceto")
    a = p.parse_args()

    if a.modo != "solo" and not a.boceto:
        sys.exit(f"el modo {a.modo} necesita --boceto")
    for ruta in filter(None, [a.clip, a.boceto]):
        if not Path(ruta).exists():
            sys.exit(f"no existe: {ruta}")
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as t:
        {"solo": lambda: solo(a), "split": lambda: split(a, Path(t)), "revelado": lambda: revelado(a, Path(t))}[a.modo]()
    print(a.out)


if __name__ == "__main__":
    main()
