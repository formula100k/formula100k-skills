#!/usr/bin/env python3
"""Renderiza un clip sin voz (9:16 o 16:9 dentro de 9:16) a partir de un clip.json.

Uso:  python3 render_clip.py clip.json [--preview]
      --preview  además saca una hoja de cuadros (clip_preview.jpg) para revisar.

El clip.json (rutas relativas a la carpeta del json):
{
  "salida": "BORRADOR.mp4",
  "formato": "9:16",                      # o "16:9" (video horizontal al centro con franjas)
  "exposicion": -0.06,                    # opcional, -0.2..0.2 (baja un punto = más oscuro)
  "tomas":   [{"archivo": "T1.mov", "desde": 2.0, "hasta": 9.5}],
  "textos":  [{"texto": "el mejor momento\npara *grabar* 👇", "desde": 0, "hasta": 8,
               "y": 0.20, "tamano": 50, "letra": "sans", "color_marca": "#F5C542"}],
  "tarjetas":[{"imagen": "captura.png", "desde": 4, "hasta": 6, "modo": "encima",
               "y": 0.55, "ancho": 0.82, "fondo": "#111111"}]
}
*palabra* = palabra de color. "modo": "encima" pega la imagen sobre el video;
"completa" la pone a pantalla entera sobre un fondo liso (esqueleto 2).
Sin audio a propósito: la música en tendencia se pone en Instagram.
"""
import json, os, re, subprocess, sys, tempfile, shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
FUENTES = {
    "sans": [("/System/Library/Fonts/HelveticaNeue.ttc", 10), ("/System/Library/Fonts/Helvetica.ttc", 0),
             ("C:/Windows/Fonts/segoeui.ttf", 0), ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 0)],
    "serif": [("/System/Library/Fonts/Supplemental/Georgia.ttf", 0), ("C:/Windows/Fonts/georgia.ttf", 0),
              ("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 0)],
}
EMOJI_FONTS = ["/System/Library/Fonts/Apple Color Emoji.ttc", "C:/Windows/Fonts/seguiemj.ttf"]
EMOJI_RE = re.compile("([\U0001F000-\U0001FAFF\u2600-\u27BF\u2190-\u21FF\u2B00-\u2BFF\uFE0F\u200D]+)")


def fuente(tipo, size):
    for path, idx in FUENTES.get(tipo, FUENTES["sans"]):
        if os.path.exists(path):
            return ImageFont.truetype(path, size, index=idx)
    return ImageFont.load_default(size)


def emoji_img(e, size):
    for p in EMOJI_FONTS:
        if not os.path.exists(p):
            continue
        try:
            bs = 160 if p.endswith(".ttc") else size
            f = ImageFont.truetype(p, bs)
            box = f.getbbox(e)
            im = Image.new("RGBA", (box[2] + 16, box[3] + 16), (0, 0, 0, 0))
            ImageDraw.Draw(im).text((0, 0), e, font=f, embedded_color=True)
            im = im.crop(im.getbbox() or (0, 0, 1, 1))
            s = size / max(im.height, 1)
            return im.resize((max(1, int(im.width * s)), size), Image.LANCZOS)
        except Exception:
            continue
    return None


def tokens(linea):
    """Devuelve [(texto, es_color, es_emoji)] respetando *marcas* y emojis."""
    out = []
    for i, parte in enumerate(re.split(r"\*", linea)):
        color = i % 2 == 1
        for trozo in EMOJI_RE.split(parte):
            if trozo:
                out.append((trozo, color, bool(EMOJI_RE.fullmatch(trozo))))
    return out


def envolver(linea, f, maxw):
    palabras, filas, fila = linea.split(" "), [], ""
    for p in palabras:
        prueba = (fila + " " + p).strip()
        if f.getlength(prueba.replace("*", "")) <= maxw or not fila:
            fila = prueba
        else:
            filas.append(fila); fila = p
    filas.append(fila)
    # si una marca *...* quedó partida, se cierra y reabre en cada fila
    arreglo, abierta = [], False
    for r in filas:
        r2 = ("*" if abierta else "") + r
        if r2.count("*") % 2 == 1:
            r2 += "*"; abierta = True
        else:
            abierta = False if r.count("*") % 2 == 0 and not abierta else abierta and r.count("*") % 2 == 0
        arreglo.append(r2)
    return arreglo


def capa_texto(t, ruta):
    size = int(t.get("tamano", 50))
    f = fuente(t.get("letra", "sans"), size)
    marca = t.get("color_marca", "#F5C542")
    lineas = []
    for l in t["texto"].split("\n"):
        lineas += envolver(l, f, W * 0.80)
    alto_linea = int(size * 1.28)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    y = int(H * float(t.get("y", 0.20)))
    for l in lineas:
        toks = tokens(l)
        anchos = []
        for txt, _, emo in toks:
            anchos.append(int(size * 1.05) if emo else int(f.getlength(txt)))
        x = int((W - sum(anchos)) / 2)
        for (txt, color, emo), w in zip(toks, anchos):
            if emo:
                e = emoji_img(txt, size)
                if e: img.alpha_composite(e, (x, y + int(size * 0.08)))
            else:
                d.text((x, y), txt, font=f, fill=marca if color else "#FFFFFF")
            x += w
        y += alto_linea
    # sombra suave para que se lea sobre lo oscuro
    sombra = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    a = img.split()[3].filter(ImageFilter.GaussianBlur(7))
    sombra.putalpha(a.point(lambda v: int(v * 0.85)))
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    base.alpha_composite(sombra, (0, 3))
    base.alpha_composite(img)
    base.save(ruta)


def capa_tarjeta(c, ruta, raiz):
    src = Image.open(os.path.join(raiz, c["imagen"])).convert("RGBA")
    if c.get("modo", "encima") == "completa":
        lienzo = Image.new("RGBA", (W, H), c.get("fondo", "#111111"))
        s = min(W * 0.9 / src.width, H * 0.8 / src.height)
        im = src.resize((int(src.width * s), int(src.height * s)), Image.LANCZOS)
        lienzo.alpha_composite(im, ((W - im.width) // 2, (H - im.height) // 2))
    else:
        lienzo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ancho = int(W * float(c.get("ancho", 0.82)))
        im = src.resize((ancho, int(src.height * ancho / src.width)), Image.LANCZOS)
        cy = int(H * float(c.get("y", 0.55)))
        lienzo.alpha_composite(im, ((W - im.width) // 2, max(0, min(H - im.height, cy - im.height // 2))))
    lienzo.save(ruta)


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    spec_path = os.path.abspath(sys.argv[1]); raiz = os.path.dirname(spec_path)
    spec = json.load(open(spec_path))
    salida = os.path.join(raiz, spec.get("salida", "BORRADOR.mp4"))
    tmp = tempfile.mkdtemp(prefix="clip_")
    horizontal = spec.get("formato", "9:16") == "16:9"
    args, fc, n = ["ffmpeg", "-y", "-loglevel", "error"], [], 0
    for i, tm in enumerate(spec["tomas"]):
        args += ["-ss", str(tm.get("desde", 0))]
        if "hasta" in tm: args += ["-to", str(tm["hasta"])]
        args += ["-i", os.path.join(raiz, tm["archivo"])]
        if horizontal:
            geo = f"scale={W}:-2,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:black"
        else:
            geo = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}"
        vel = float(tm.get("velocidad", 1))
        fc.append(f"[{i}:v]{geo},setsar=1,fps={FPS},setpts=PTS/{vel}-STARTPTS[s{i}]")
        n += 1
    fc.append("".join(f"[s{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0[base]")
    ult = "base"
    if spec.get("exposicion"):
        fc.append(f"[base]eq=brightness={float(spec['exposicion'])}[bx]"); ult = "bx"
    capas = []
    for j, c in enumerate(spec.get("tarjetas", [])):
        p = os.path.join(tmp, f"card{j}.png"); capa_tarjeta(c, p, raiz); capas.append((p, c))
    for j, t in enumerate(spec.get("textos", [])):
        p = os.path.join(tmp, f"text{j}.png"); capa_texto(t, p); capas.append((p, t))
    for k, (p, item) in enumerate(capas):
        args += ["-loop", "1", "-i", p]
        idx = n + k
        fc.append(f"[{ult}][{idx}:v]overlay=0:0:shortest=1:enable='between(t,{item['desde']},{item['hasta']})'[o{k}]")
        ult = f"o{k}"
    args += ["-filter_complex", ";".join(fc), "-map", f"[{ult}]", "-an", "-c:v", "libx264",
             "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", salida]
    subprocess.run(args, check=True)
    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", salida],
                         capture_output=True, text=True).stdout.strip()
    print(f"OK {salida} · {float(dur):.1f} s")
    if "--preview" in sys.argv:
        prev = os.path.splitext(salida)[0] + "_preview.jpg"
        fps = min(2.0, 12 / max(float(dur), 1))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", salida, "-vf",
                        f"fps={fps},scale=270:-2,tile=6x2", "-frames:v", "1", prev], check=True)
        print(f"PREVIEW {prev}")
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
