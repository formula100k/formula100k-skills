#!/usr/bin/env python3
"""GANCHO GOLPE · el ÚNICO dibujante del gancho textual del expediente. PNG transparente 1080x1920.

El gancho es un BLOQUE centrado sobre la escena a pantalla completa:
  · la frase grande partida en 1–4 líneas apretadas, centradas, lo más grandes posible (tope 230 px de letra);
  · interlineado APRETADO: entre la tinta de dos líneas, 0,30 x el alto de la mayúscula;
  · la chica en mayúscula palo seco, 0,5 del tamaño, justo debajo (0,55 x mayúscula);
  · detrás, un degradado negro SUAVE sin bordes (nunca una franja ni un cuadro negro).

Se NIEGA (código 1, no escribe el PNG) si: más de 5 palabras, o la chica < 0,45x.

Letras: «helvetica» busca la Helvetica Neue del sistema (Mac) o la Arial Bold (Windows) y, si no hay ninguna, usa Anton,
que viene en herramientas/fuentes con su licencia libre. «condensada» es Anton.

Uso:
  uv run --with pillow --with numpy python3 gancho_png.py --grande "CANVA RECORTA" --chica "22 % del equipo" \
     [--y0 220] [--color rojo|verde|amarillo|#hex] [--letra helvetica|condensada] [--out gancho.png] [--fondo cuadro.jpg --prueba prueba.jpg]
"""
import argparse, itertools, json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

F = Path(__file__).resolve().parent / "fuentes"
W, H = 1080, 1920
COLORES = {"rojo": "#E5322D", "verde": "#2FBF5B", "amarillo": "#FFD21F", "blanco": "#FFFFFF", "lila": "#C9C3FF"}
LETRAS = {  # nombre: (archivo, índice ttc, tope px)
    "helvetica":  ("HelveticaNeue.ttc", 1, 230),
    "condensada": ("Anton-Regular.ttf", 0, 260),
}
CHICAS = {"sans": ("HelveticaNeue.ttc", 1)}
# dónde buscar cada letra: primero herramientas/fuentes, después las del sistema; si no hay, Anton (viene con la skill)
SISTEMA = {"HelveticaNeue.ttc": [("/System/Library/Fonts/HelveticaNeue.ttc", 1), ("C:/Windows/Fonts/arialbd.ttf", 0),
                                 ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 0)]}
MARGEN, VACIO_MAX = 80, 70


def fnt(spec, tam):
    nombre, idx = spec
    for ruta, i in [(str(F / nombre), idx)] + SISTEMA.get(nombre, []):
        if Path(ruta).exists(): return ImageFont.truetype(ruta, tam, index=i)
    return ImageFont.truetype(str(F / "Anton-Regular.ttf"), tam)


def caja(f, s):
    return f.getbbox(s)


def alto_mayus(f):
    b = f.getbbox("H"); return b[3] - b[1]


def particiones(palabras, n):
    for cortes in itertools.combinations(range(1, len(palabras)), n - 1):
        idx = (0,) + cortes + (len(palabras),)
        yield [" ".join(palabras[idx[i]:idx[i + 1]]) for i in range(n)]


def detectar_hasta(fondo, y0):
    """y donde empieza la imagen bajo el área del gancho (primer renglón con contenido distinto del fondo)."""
    import numpy as np
    a = np.asarray(Image.open(fondo).convert("RGB").resize((W, H)), float)
    ref = np.median(a[y0:y0 + 40].reshape(-1, 3), 0)
    dif = (np.abs(a - ref).sum(2) > 60).mean(1)
    for y in range(y0 + 120, H // 2 + 200):
        if dif[y:y + 6].min() > 0.12: return y
    return H // 2


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--grande", required=True); a.add_argument("--chica", default="")
    a.add_argument("--modo", default="bloque", choices=["bloque", "linea"])
    a.add_argument("--alinear", default="centro", choices=["centro"])  # siempre centrado: nunca a la izquierda sobre un cuadro negro
    a.add_argument("--hasta", default=None); a.add_argument("--y0", type=int, default=170)
    a.add_argument("--y", type=int, default=None, help="alias de --y0")
    a.add_argument("--orden", default="grande-chica", choices=["grande-chica", "chica-grande"])
    a.add_argument("--color", default="rojo"); a.add_argument("--letra", default=None, choices=list(LETRAS))
    a.add_argument("--letra-chica", default=None, choices=list(CHICAS) + ["igual"])
    a.add_argument("--tinta", default="clara", choices=["clara", "oscura"])
    a.add_argument("--out", default="gancho.png"); a.add_argument("--fondo"); a.add_argument("--prueba")
    a.add_argument("--estricto", action="store_true")
    a.add_argument("--sin-degradado", action="store_true", help="quita el degradado negro suave detrás del texto (solo si el fondo ya es oscuro y liso)")
    a.add_argument("--tipo", default="golpe", choices=["golpe", "titulo"],
                   help="titulo = frase de curiosidad («Cómo un resorte se convirtió en / IDEA MILLONARIA»): 2–9 palabras, centrado, chica en hasta 2 renglones")
    a.add_argument("--anclar", default="abajo", choices=["abajo", "arriba"],
                   help="abajo (default 9-nov noche) = el bloque termina pegado a la imagen; el aire que sobra queda ARRIBA, nunca entre texto e imagen")
    a.add_argument("--chica-tal-cual", action="store_true", help="no pasa la chica a mayúsculas")
    o = a.parse_args()
    if o.y is not None: o.y0 = o.y
    letra = o.letra or ("helvetica" if o.modo == "bloque" else "condensada")
    nombre, idx, tope = LETRAS[letra]; FG = (nombre, idx)
    lc = o.letra_chica or ("sans" if o.modo == "bloque" else "igual")
    FC = FG if lc == "igual" else CHICAS[lc]

    errores, avisos = [], []
    palabras = len((o.grande + " " + o.chica).split())
    tope_pal = 9 if o.tipo == "titulo" else 5
    if o.tipo == "titulo" and o.alinear == "izq" and "--alinear" not in sys.argv: o.alinear = "centro"
    if not 2 <= palabras <= tope_pal: errores.append(f"{palabras} palabras: el gancho va de 2 a {tope_pal}")
    G = o.grande.upper()
    C = o.chica.upper() if (lc == "sans" and not o.chica_tal_cual) else o.chica
    ancho_util = W - 2 * MARGEN

    hasta = None
    if o.hasta == "auto":
        if not o.fondo: errores.append("--hasta auto necesita --fondo (un cuadro SIN el gancho)")
        else: hasta = detectar_hasta(o.fondo, o.y0)
    elif o.hasta: hasta = int(o.hasta)
    alto_disp = (hasta - 45 - o.y0) if hasta else 620     # sin imagen conocida: el tercio de arriba

    def medir(lineas, t):
        fg = fnt(FG, t); cap = alto_mayus(fg)
        ct = max(44, int(t * 0.5)); fc = fnt(FC, ct)
        def cortar(fc):
            if not C: return []
            if o.tipo != "titulo" or fc.getlength(C) <= ancho_util: return [C]
            ws = C.split(); best = None
            for i in range(1, len(ws)):
                a, b = " ".join(ws[:i]), " ".join(ws[i:]); m = max(fc.getlength(a), fc.getlength(b))
                if best is None or m < best[0]: best = (m, [a, b])
            return best[1]
        cl = cortar(fc)
        while cl and max(fc.getlength(x) for x in cl) > ancho_util and ct > 30: ct -= 2; fc = fnt(FC, ct); cl = cortar(fc)
        medir.chicas = cl
        hs = [caja(fg, l)[3] - caja(fg, l)[1] for l in lineas]
        gap = max(10, int(cap * 0.30)); gapc = max(12, int(cap * 0.55))
        capc = alto_mayus(fc); hc = sum(caja(fc, x)[3] - caja(fc, x)[1] for x in cl) + max(8, int(capc * .35)) * (len(cl) - 1)
        alto = sum(hs) + gap * (len(lineas) - 1) + (hc + gapc if C else 0)
        ancho = max(fg.getlength(l) for l in lineas)
        return fg, fc, ct, gap, gapc, alto, ancho

    pal = G.split()
    opciones = [[G]] if o.modo == "linea" else [p for n in range(1, min(4, len(pal)) + 1) for p in particiones(pal, n)]
    mejor = None
    for lineas in opciones:
        t = tope
        while t > 40:
            fg, fc, ct, gap, gapc, alto, ancho = medir(lineas, t)
            if ancho <= ancho_util and alto <= alto_disp: break
            t -= 2
        clave = (t, -len(lineas))                  # la letra más grande; a igualdad, menos líneas
        if mejor is None or clave > mejor[0]: mejor = (clave, lineas, t)
    _, lineas, gt = mejor
    fg, fc, ct, gap, gapc, alto, ancho = medir(lineas, gt)
    chicas = medir.chicas
    if C and ct / gt < (0.38 if o.tipo == "titulo" else 0.45) and ct > 44: errores.append(f"la chica es {ct/gt:.2f}x la grande: mínimo 0,45x")

    col_g = COLORES.get(o.color, o.color)
    col_c = "#FFFFFF" if o.tinta == "clara" else "#231F1C"
    filas = [(l, fg, col_g, False) for l in lineas]
    if C:
        fch = [(x, fc, col_c, True) for x in chicas]
        filas = fch + filas if o.orden == "chica-grande" else filas + fch

    capa = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sombra = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d, ds = ImageDraw.Draw(capa), ImageDraw.Draw(sombra)
    y0 = o.y0
    if hasta and o.anclar == "abajo": y0 = max(o.y0, hasta - 45 - alto)   # pegado a la imagen: el aire queda arriba
    y, cajas = y0, []
    for k, (s, f, col, es_chica) in enumerate(filas):
        if k: y += (max(8, int(alto_mayus(f) * .35)) if (es_chica and filas[k - 1][3]) else gapc if (es_chica or filas[k - 1][3]) else gap)
        b = caja(f, s)
        x = (MARGEN - b[0]) if o.alinear == "izq" else (W - (b[2] - b[0])) / 2 - b[0]
        top = y - b[1]
        trazo = max(4, int(f.size * 0.07)) if letra == "pixel" else 0
        if o.tinta == "clara": ds.text((x, top + 4), s, font=f, fill=(0, 0, 0, 140))
        d.text((x, top), s, font=f, fill=col, stroke_width=trazo, stroke_fill="#14161C")
        cajas.append([int(x + b[0]), y, int(x + b[2]), y + (b[3] - b[1])])
        y += b[3] - b[1]
    fin = y
    vacio = (hasta - fin) if hasta else None
    if vacio is not None and vacio > VACIO_MAX:
        msg = f"quedan {vacio} px vacíos hasta la imagen: sube la imagen a y≈{fin + 45} (el texto ya llena el ancho)"
        (errores if o.estricto else avisos).append(msg)

    out = Image.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(5)), capa)
    # la escena va A PANTALLA COMPLETA detrás del gancho; nada de franja ni cuadro negro.
    # Para leerlo, un degradado negro SUAVE (como en notitas), sin bordes: opaco 0,62 detrás del texto y se pierde 260 px abajo.
    if not o.sin_degradado and o.tinta == "clara":
        top_t = min(c[1] for c in cajas) - 60; fin_g = fin + 260
        g = Image.new("L", (1, H), 0)
        for yy in range(H):
            if yy <= fin + 40: a_ = 158
            elif yy < fin_g: a_ = int(158 * (1 - (yy - fin - 40) / (fin_g - fin - 40)) ** 1.6)
            else: a_ = 0
            if yy < top_t - 200: a_ = int(a_ * max(0.55, yy / max(1, top_t - 200)))
            g.putpixel((0, yy), a_)
        grad = Image.new("RGBA", (W, H), (0, 0, 0, 255)); grad.putalpha(g.resize((W, H)))
        out = Image.alpha_composite(grad, out)
    info = {"modo": o.modo, "lineas": lineas, "grande_px": gt, "chica_px": ct, "razon": round(ct / gt, 2),
            "interlineado_px": gap, "fin_y": fin, "hasta": hasta, "vacio_px": vacio, "cajas": cajas,
            "palabras": palabras, "letra": letra, "avisos": avisos}
    if errores:
        print(json.dumps({"ok": False, "errores": errores, **info}, ensure_ascii=False)); sys.exit(1)
    out.save(o.out)
    if o.fondo:
        f0 = Image.open(o.fondo).convert("RGBA").resize((W, H))
        Image.alpha_composite(f0, out).convert("RGB").save(o.prueba or (o.out[:-4] + "-prueba.jpg"), quality=90)
    print(json.dumps({"ok": True, "png": o.out, **info}, ensure_ascii=False))


if __name__ == "__main__":
    main()
