#!/usr/bin/env python3
"""Primeros segundos de un collage documental en stop motion (salto cada 4 cuadros), en 3 escenas:
 1) GANCHO sobre una foto real de los protagonistas: arriba se extiende su fondo liso para que el texto se lea.
 2) DOCUMENTO HISTÓRICO (paper, anuncio, post) con marcador amarillo en un nombre y un círculo rojo a mano.
 3) ACERCAMIENTO a la segunda persona de la foto.
Uso: python intro_documental.py intro.json   →   intro.mp4 (1080x1920, 30 fps, sin audio)

intro.json (coordenadas en píxeles de la imagen ORIGINAL; si la mediste en una vista escalada, conviértelas):
{
  "foto": "material/foto-protagonistas.jpg",
  "credito": "Foto: Nombre para Medio",
  "documento": "material/paper-p1.png",            # pdftoppm -r 200 -png paper.pdf paper-p1
  "doc_titulo": [410, 262, 1290, 330],               # recorte del título del documento
  "doc_recorte": [700, 815, 1430, 1085],             # recorte con el nombre y la empresa
  "marcador": [1215, 905, 1395, 955],                # rectángulo amarillo (nombre)
  "circulo": [849, 1037, 92, 38],                    # cx, cy, radio x, radio y (empresa)
  "pie_doc": "Paper de X · Empresa, mes de año",
  "persona2": [690, 140, 1600, 1758],                # recorte ~9:16 de la segunda persona
  "duraciones": [1.75, 1.65, 1.95],
  "salida": "intro.mp4"
}"""
import os, sys, json, random, subprocess, math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS, PASO = 1080, 1920, 30, 4
AQUI = os.path.dirname(os.path.abspath(__file__))
SERIF_IT = os.path.join(AQUI, "..", "fuentes", "InstrumentSerif-Italic.ttf")
C = json.load(open(sys.argv[1]))
FOTO = Image.open(C["foto"]).convert("RGB")
DOC = Image.open(C["documento"]).convert("RGB")
FONDO = FOTO.getpixel((FOTO.width // 2, 40))     # color del fondo liso de la foto
random.seed(7)
OUT = "intro_frames"; os.makedirs(OUT, exist_ok=True)

def credito(im):
    if not C.get("credito"): return
    d = ImageDraw.Draw(im); f = ImageFont.truetype(SERIF_IT, 30)
    d.text((W - d.textlength(C["credito"], font=f) - 36, H - 70), C["credito"], font=f, fill=(235, 225, 210))

def extiende_fondo(im, alto):
    g = Image.new("L", (1, alto)); g.putdata([int(255 * max(0, 1 - y / alto) ** 1.4) for y in range(alto)])
    im.paste(Image.new("RGB", (W, alto), FONDO), (0, 0), g.resize((W, alto)))

def escena_gancho(k, n):
    s = 1.0 + 0.05 * (k // PASO) / max(1, n // PASO)
    fw = int(W * 1.18 * s); fh = int(FOTO.height * fw / FOTO.width)
    im = Image.new("RGB", (W, H), FONDO)
    im.paste(FOTO.resize((fw, fh), Image.LANCZOS), ((W - fw) // 2 + 40, 470 - int(30 * (s - 1) * 20)))
    extiende_fondo(im, 700); credito(im); return im

def escena_documento(k, n):
    im = Image.new("RGB", (W, H), (32, 32, 42)); t = k / FPS
    X0, Y0, X1, Y1 = C["doc_recorte"]
    crop = DOC.crop((X0, Y0, X1, Y1)).copy(); d = ImageDraw.Draw(crop, "RGBA")
    if t >= 0.25 and C.get("marcador"):
        a, b, c_, e = C["marcador"]; d.rectangle((a - X0, b - Y0, c_ - X0, e - Y0), fill=(255, 225, 77, 150))
    if t >= 0.75 and C.get("circulo"):
        cx, cy, rx, ry = C["circulo"]; cx -= X0; cy -= Y0
        for j in range(2):
            pts = [(cx + (rx + j * 5) * math.cos(a / 40 * 2 * math.pi + 0.2 * j), cy + (ry + j * 4) * math.sin(a / 40 * 2 * math.pi + 0.2 * j)) for a in range(43)]
            d.line(pts, fill=(220, 40, 55, 255), width=5)
    hoja = Image.new("RGB", (crop.width, crop.height + 130), "white")
    if C.get("doc_titulo"):
        tit = DOC.crop(tuple(C["doc_titulo"]))
        hoja.paste(tit.resize((crop.width - 60, int(tit.height * (crop.width - 60) / tit.width))), (30, 25))
        ImageDraw.Draw(hoja).line((30, 118, crop.width - 30, 118), fill=(0, 0, 0), width=2)
    hoja.paste(crop, (0, 130))
    tarjeta = hoja.resize((1000, int(1000 * hoja.height / hoja.width)), Image.LANCZOS).convert("RGBA")
    if k % PASO == 0: escena_documento.rot = -1.5 + random.choice([-0.6, 0, 0.6])
    tarjeta = tarjeta.rotate(getattr(escena_documento, "rot", -1.5), expand=True, resample=Image.BICUBIC)
    sombra = Image.new("RGBA", tarjeta.size, (0, 0, 0, 0)); sombra.putalpha(tarjeta.split()[3].point(lambda v: v * 0.55))
    sombra = sombra.filter(ImageFilter.GaussianBlur(14))
    x, y = (W - tarjeta.width) // 2, 560
    im.paste(sombra, (x + 8, y + 16), sombra); im.paste(tarjeta, (x, y), tarjeta)
    if C.get("pie_doc"):
        dd = ImageDraw.Draw(im); f = ImageFont.truetype(SERIF_IT, 46)
        dd.text(((W - dd.textlength(C["pie_doc"], font=f)) // 2, y + tarjeta.height + 26), C["pie_doc"], font=f, fill=(235, 228, 215))
    return im

def escena_persona2(k, n):
    s = 1.0 + 0.04 * (k // PASO) / max(1, n // PASO)
    reg = FOTO.crop(tuple(C["persona2"]))
    fw = int(W * s); fh = int(reg.height * fw / reg.width)
    im = Image.new("RGB", (W, H), FONDO)
    im.paste(reg.resize((fw, fh), Image.LANCZOS), ((W - fw) // 2, 330))
    extiende_fondo(im, 560); credito(im); return im

def main():
    dur = C.get("duraciones", [1.75, 1.65, 1.95])
    i = 0; tot = 0.0
    for fn, d in zip([escena_gancho, escena_documento, escena_persona2], dur):
        a, b = round(tot * FPS), round((tot + d) * FPS); n = b - a; tot += d; ultimo = None
        for k in range(n):
            if k % PASO == 0 or ultimo is None or fn is escena_documento: ultimo = fn(k, n)
            ultimo.save(f"{OUT}/{i:04d}.png"); i += 1
    sal = C.get("salida", "intro.mp4")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", str(FPS), "-i", f"{OUT}/%04d.png",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", sal], check=True)
    print(sal, i, "cuadros")

main()
