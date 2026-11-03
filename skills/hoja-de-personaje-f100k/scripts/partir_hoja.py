#!/usr/bin/env -S uv run --quiet --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow", "numpy"]
# ///
"""Parte una hoja de personaje de N paneles en una imagen por panel.

Busca las franjas blancas verticales (separadores) en vez de la columna más
oscura, así no se equivoca con pelo oscuro ni con un bolso que toca el borde.
Al panel BODY le recorta la cabeza (cuerpo sin rostro): la única cara que
manda es la del FACE.

Uso:
  uv run partir_hoja.py HOJA.png --nombre sofi-terraza \
      --orden FACE,PROFILE,BACK,BODY  [-o CARPETA] [--sin-recorte-cabeza]
  Hoja de cara 4×2:
  uv run partir_hoja.py CARAS.png --nombre sofi-terraza --filas 2 \
      --orden NEUTRA,SONRISA,RISA,TRES-CUARTOS-IZQ,TRES-CUARTOS-DER,PENSATIVA,SORPRESA,INTENSA
"""
import argparse, os, sys
import numpy as np
from PIL import Image

FONDO_MIN = 238   # gris #F7F7F7 = 247; separador blanco = 255


def franjas(mask):
    """Devuelve [(ini, fin)] de tramos True consecutivos."""
    out, ini = [], None
    for i, v in enumerate(mask):
        if v and ini is None:
            ini = i
        elif not v and ini is not None:
            out.append((ini, i)); ini = None
    if ini is not None:
        out.append((ini, len(mask)))
    return out


def cortes(a, n):
    """Para cada división ideal (w·k/n) busca el separador más cercano.

    Prueba primero la línea blanca pura (255) y después franjas más claras que
    el fondo; el fondo gris #F7F7F7 dentro del panel no cuenta como separador
    porque se exige que la franja sea angosta (< 4 % del ancho).
    """
    h, w, _ = a.shape
    tol = w * 0.09
    elegidas = []
    for k in range(1, n):
        ide = w * k / n
        mejor = None
        for umbral in (252, 246, FONDO_MIN):
            claro = (a.min(axis=2) >= umbral).mean(axis=0) > 0.95
            cand = [(i, f) for i, f in franjas(claro)
                    if f - i >= 2 and f - i < w * 0.04 and abs((i + f) / 2 - ide) < tol]
            if cand:
                mejor = min(cand, key=lambda t: abs((t[0] + t[1]) / 2 - ide))
                break
        if mejor is None:
            perfil = a.min(axis=2).mean(axis=0)
            c, r = int(ide), int(w * 0.06)
            x = c - r + int(np.argmax(perfil[c - r:c + r]))
            mejor = (x - 1, x + 1)
            print(f"⚠️  División {k}: no encontré separador; corté en x={x}. Revísalo.")
        elegidas.append(mejor)
    bordes = [0] + [x for t in elegidas for x in t] + [w]
    return [(bordes[i], bordes[i + 1]) for i in range(0, len(bordes), 2)]


def recortar_cabeza(im):
    a = np.asarray(im.convert("RGB")).astype(int)
    fig = (a.min(axis=2) < FONDO_MIN - 8).mean(axis=1) > 0.01
    filas = np.where(fig)[0]
    if len(filas) == 0:
        return im
    top, bot = filas[0], filas[-1]
    corte = int(top + (bot - top) * 0.145)   # cabeza ≈ 1/7 de la figura
    return im.crop((0, corte, im.width, im.height))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("hoja")
    p.add_argument("--nombre", required=True)
    p.add_argument("--orden", default="FACE,PROFILE,BACK,BODY")
    p.add_argument("-o", "--out", default=None)
    p.add_argument("--sin-recorte-cabeza", action="store_true")
    p.add_argument("--filas", type=int, default=1, help="filas de la hoja (2 para la hoja de cara)")
    x = p.parse_args()
    roles = [r.strip().upper() for r in x.orden.split(",")]
    im = Image.open(x.hoja).convert("RGB")
    out = x.out or os.path.join(os.path.dirname(os.path.abspath(x.hoja)), "ELEMENTS")
    os.makedirs(out, exist_ok=True)
    if len(roles) % x.filas:
        sys.exit(f"--orden tiene {len(roles)} nombres y no se reparte en {x.filas} filas.")
    por_fila = len(roles) // x.filas
    # filas: se cortan con la misma búsqueda de separador, pero en horizontal
    a_rot = np.asarray(im.rotate(90, expand=True)).astype(int)
    tramos_y = [(im.height - y1, im.height - y0) for y0, y1 in cortes(a_rot, x.filas)][::-1] \
        if x.filas > 1 else [(0, im.height)]
    k = 0
    for y0, y1 in tramos_y:
        fila = im.crop((0, y0, im.width, y1))
        a = np.asarray(fila).astype(int)
        for x0, x1 in cortes(a, por_fila):
            rol = roles[k]; k += 1
            pieza = fila.crop((x0, 0, x1, fila.height))
            if rol == "BODY" and not x.sin_recorte_cabeza:
                pieza = recortar_cabeza(pieza)
            ruta = os.path.join(out, f"{x.nombre}__{rol}.png")
            pieza.save(ruta)
            print(f"{rol:18s} x={x0}-{x1} y={y0}-{y1}  {pieza.size[0]}x{pieza.size[1]}  → {ruta}")

if __name__ == "__main__":
    main()
