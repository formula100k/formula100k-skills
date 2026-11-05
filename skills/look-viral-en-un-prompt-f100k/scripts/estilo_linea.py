"""Estilo «línea minimalista».

Fondo negro, la persona en blanco y negro con un halo de luz, figuras de línea blanca que se
dibujan solas (círculo, péndulo, esfera, flor, espiral, reloj, barra) y una frase chica en serif.
Dos tipos de escena:
  persona  tú en blanco y negro sobre negro (con figura chica opcional arriba)
  linea    pantalla negra solo con la figura grande y la frase (tu voz sigue sonando)

Uso: python estilo_linea.py CARPETA_DE_TRABAJO [config.json] [salida.mp4]
"""
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from comun import FPS, H, W, ease_out, escritor, fuente, leer_json, lector

GROSOR = 3


# ---------- figuras: cada una devuelve una lista de trazos (arrays Nx2) ----------

def _circulo_pts(cx, cy, r, n=160, a0=0.0):
    a = a0 + np.linspace(0, 2 * math.pi, n)
    return np.stack([cx + r * np.cos(a), cy + r * np.sin(a)], 1)


def fig_circulo(cx, cy, r, t):
    lados = 9
    a = t * 0.25 + np.linspace(0, 2 * math.pi, lados + 1)
    poli = np.stack([cx + r * np.cos(a), cy + r * np.sin(a)], 1)
    ang = t * 1.4
    punto = _circulo_pts(cx + r * 1.25 * math.cos(ang), cy + r * 1.25 * math.sin(ang), 9, 24)
    return [poli, punto]


def fig_pendulo(cx, cy, r, t):
    piv = (cx, cy - r * 1.1)
    ang = 0.55 * math.sin(t * 2.2)
    largo = r * 1.9
    bx, by = piv[0] + largo * math.sin(ang), piv[1] + largo * math.cos(ang)
    hilo = np.array([piv, (bx, by)])
    techo = np.array([(cx - r * 0.5, piv[1]), (cx + r * 0.5, piv[1])])
    return [techo, hilo, _circulo_pts(bx, by, r * 0.16, 60)]


def fig_esfera(cx, cy, r, t):
    trazos = [_circulo_pts(cx, cy, r)]
    for k in range(6):  # meridianos que giran
        fase = (t * 0.6 + k * math.pi / 6) % math.pi
        rx = abs(r * math.cos(fase))
        a = np.linspace(0, 2 * math.pi, 100)
        trazos.append(np.stack([cx + rx * np.cos(a), cy + r * np.sin(a)], 1))
    for k in (-0.6, -0.3, 0, 0.3, 0.6):  # paralelos
        y = cy + r * k
        rx = r * math.sqrt(1 - k * k)
        a = np.linspace(0, 2 * math.pi, 100)
        trazos.append(np.stack([cx + rx * np.cos(a), y + rx * 0.18 * np.sin(a)], 1))
    trazos.append(np.array([(cx, cy - r), (cx, cy - r * 1.6)]))
    return trazos


def fig_flor(cx, cy, r, t):
    trazos = []
    for k in range(5):
        rot = t * 0.3 + k * 2 * math.pi / 5
        a = np.linspace(0, 2 * math.pi, 220)
        rr = r * (0.55 + 0.25 * np.cos(5 * a))
        x, y = rr * np.cos(a), rr * np.sin(a) * 0.55
        xr = x * math.cos(rot) - y * math.sin(rot)
        yr = x * math.sin(rot) + y * math.cos(rot)
        trazos.append(np.stack([cx + xr, cy + yr], 1))
    return trazos


def fig_espiral(cx, cy, r, t):
    a = np.linspace(0, 6 * math.pi, 500)
    rr = r * a / (6 * math.pi)
    a = a + t * 0.8
    return [np.stack([cx + rr * np.cos(a), cy + rr * np.sin(a)], 1)]


def fig_reloj(cx, cy, r, t):
    trazos = [_circulo_pts(cx, cy, r)]
    for k in range(12):
        a = k * math.pi / 6
        trazos.append(np.array([(cx + r * 0.86 * math.cos(a), cy + r * 0.86 * math.sin(a)),
                                (cx + r * 0.96 * math.cos(a), cy + r * 0.96 * math.sin(a))]))
    a = t * 1.2 - math.pi / 2
    trazos.append(np.array([(cx, cy), (cx + r * 0.75 * math.cos(a), cy + r * 0.75 * math.sin(a))]))
    trazos.append(np.array([(cx, cy), (cx + r * 0.45 * math.cos(a / 12), cy + r * 0.45 * math.sin(a / 12))]))
    return trazos


def fig_barra(cx, cy, r, t):
    y = cy + r * 0.8 * math.sin(t * 1.5)
    return [np.array([(cx, cy - r), (cx, cy + r)]), _circulo_pts(cx, y, r * 0.12, 50)]


FIGURAS = {"circulo": fig_circulo, "pendulo": fig_pendulo, "esfera": fig_esfera, "flor": fig_flor,
           "espiral": fig_espiral, "reloj": fig_reloj, "barra": fig_barra}


def dibujar(lienzo, trazos, p):
    """Dibuja los trazos con antialias; p (0..1) es cuánto del recorrido total ya se dibujó."""
    largos = [float(np.sum(np.linalg.norm(np.diff(tr, axis=0), axis=1))) for tr in trazos]
    total = sum(largos) or 1
    resta = total * p
    for tr, lg in zip(trazos, largos):
        if resta <= 0:
            break
        if resta < lg:
            seg = np.linalg.norm(np.diff(tr, axis=0), axis=1)
            acum = np.cumsum(seg)
            n = int(np.searchsorted(acum, resta)) + 1
            tr = tr[: n + 1]
        resta -= lg
        cv2.polylines(lienzo, [np.round(tr * 4).astype(np.int32)], False, 1.0, GROSOR, cv2.LINE_AA, shift=2)


# ---------- frase ----------

class Frases:
    def __init__(self):
        self.f = ImageFont.truetype(fuente("InstrumentSerif-Regular.ttf"), 66)
        self.cache = {}

    def capa(self, texto, x, y, centrar=False):
        clave = (texto, x, y, centrar)
        if clave not in self.cache:
            img = Image.new("L", (W, H), 0)
            d = ImageDraw.Draw(img)
            lineas = partir(texto, self.f, 900)
            for i, ln in enumerate(lineas):
                ancho = self.f.getlength(ln)
                xx = (W - ancho) / 2 if centrar else x
                d.text((xx, y + i * 76), ln, font=self.f, fill=235)
            self.cache[clave] = np.asarray(img).astype(np.float32) / 255.0
        return self.cache[clave]


def partir(texto, f, ancho):
    lineas, actual = [], ""
    for w in texto.split():
        prueba = (actual + " " + w).strip()
        if f.getlength(prueba) > ancho and actual:
            lineas.append(actual)
            actual = w
        else:
            actual = prueba
    return lineas + ([actual] if actual else [])


def main():
    trabajo = sys.argv[1]
    cfg = leer_json(sys.argv[2] if len(sys.argv) > 2 else os.path.join(trabajo, "config-linea.json"))
    salida = sys.argv[3] if len(sys.argv) > 3 else os.path.join(trabajo, "linea-minimal.mp4")
    base = os.path.join(trabajo, "base.mp4")
    escenas = cfg["escenas"]
    halo = cfg.get("halo", 0.55)
    frases = Frases()

    out = escritor(salida, audio_de=base)
    print("Renderizando «línea minimalista»…")
    for i, (cuadro, m) in enumerate(zip(lector(base), lector(os.path.join(trabajo, "mascara.mp4"), gris=True))):
        t = i / FPS
        esc = next((e for e in escenas if e["desde"] <= t < e["hasta"]), escenas[-1])
        dt = t - esc["desde"]
        img = np.zeros((H, W), np.float32)

        if esc.get("modo", "persona") == "persona":
            gris = cuadro.astype(np.float32) @ np.array([0.299, 0.587, 0.114], np.float32) / 255.0
            gris = np.clip((gris - 0.5) * 1.18 + 0.53, 0, 1)
            mp_ = m.astype(np.float32) / 255.0
            chica = cv2.resize(mp_, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
            brillo = cv2.resize(cv2.GaussianBlur(chica, (0, 0), 14), (W, H))
            img = np.clip(brillo * halo, 0, 1) * (1 - mp_) + gris * mp_
            fig, r, cx, cy = esc.get("figura"), 120, W * 0.78, H * 0.17
            x_fr, y_fr, centrar = 80, int(H * 0.17), False
        else:
            fig, r, cx, cy = esc.get("figura") or "circulo", 230, W / 2, H * 0.55
            x_fr, y_fr, centrar = 0, int(H * 0.25), True

        capa = np.zeros((H, W), np.float32)
        if fig:
            dibujar(capa, FIGURAS[fig](cx, cy, r, dt), ease_out(dt / 0.9))
        texto = esc.get("frase", "")
        if texto:
            a = ease_out(dt / 0.35)
            capa = np.maximum(capa, frases.capa(texto, x_fr, y_fr, centrar) * a)
        img = np.maximum(img, capa)

        rgb = np.repeat((np.clip(img, 0, 1) * 255).astype(np.uint8)[..., None], 3, axis=2)
        out.stdin.write(rgb.tobytes())
        if i % 90 == 0:
            print(f"  {t:.0f} s")
    out.stdin.close()
    out.wait()
    print(f"Listo → {salida}")


if __name__ == "__main__":
    main()
