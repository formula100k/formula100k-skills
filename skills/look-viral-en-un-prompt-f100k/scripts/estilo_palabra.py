"""Estilo «palabra detrás de ti».

Una palabra gigante va DETRÁS de la persona (la cabeza la tapa un poco), en dos líneas:
arriba en contorno transparente y abajo en cursiva con degradé que se escribe letra por letra
justo cuando la dices. Abajo, subtítulos chicos palabra por palabra.

Uso: python estilo_palabra.py CARPETA_DE_TRABAJO [config.json] [salida.mp4]
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from comun import FPS, H, W, ease_out, escritor, fuente, leer_json, lector, palabras

COLORES = ["#ffb067", "#ff6fa8", "#b38cff"]


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def ajustar(texto, ruta_fuente, alto_max, ancho_max):
    tam = alto_max
    while tam > 40:
        f = ImageFont.truetype(ruta_fuente, tam)
        x0, y0, x1, y1 = f.getbbox(texto)
        if x1 - x0 <= ancho_max:
            return f
        tam -= 6
    return ImageFont.truetype(ruta_fuente, tam)


def capa_contorno(texto, f, cy, opac=1.0):
    """Texto en contorno blanco con relleno casi transparente, centrado en cy."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = f.getbbox(texto)
    x = (W - (x1 - x0)) / 2 - x0
    y = cy - (y1 - y0) / 2 - y0
    d.text((x, y), texto, font=f, fill=(255, 255, 255, int(55 * opac)),
           stroke_width=4, stroke_fill=(255, 255, 255, int(240 * opac)))
    return Image.alpha_composite(sombra_de(img.getchannel("A"), 0.35, 12), img)


def capa_degrade(texto, f, cy, colores):
    """Texto relleno con degradé horizontal y sombra suave, centrado en cy."""
    mascara = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mascara)
    x0, y0, x1, y1 = f.getbbox(texto)
    x = (W - (x1 - x0)) / 2 - x0
    y = cy - (y1 - y0) / 2 - y0
    d.text((x, y), texto, font=f, fill=255)
    # degradé de izquierda a derecha sobre el ancho del texto
    izq, der = int(x + x0), int(x + x1)
    cols = [np.array(hex_rgb(c), np.float32) for c in colores]
    xs = np.clip((np.arange(W) - izq) / max(1, der - izq), 0, 1)
    tramos = len(cols) - 1
    idx = np.minimum((xs * tramos).astype(int), tramos - 1)
    t = (xs * tramos - idx)[:, None]
    fila = np.array(cols)[idx] * (1 - t) + np.array(cols)[idx + 1] * t
    rgb = np.broadcast_to(fila[None, :, :], (H, W, 3)).astype(np.uint8)
    img = Image.fromarray(rgb, "RGB").convert("RGBA")
    img.putalpha(mascara)
    return Image.alpha_composite(sombra_de(mascara), img)


def sombra_de(mascara, fuerza=0.5, radio=16):
    """Halo oscuro detrás del texto para que se lea sobre paredes claras."""
    sombra = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sombra.putalpha(mascara.filter(ImageFilter.GaussianBlur(radio)).point(lambda v: int(min(255, v * fuerza * 1.6))))
    return sombra


def cima_cabeza(mascara):
    filas = np.where((mascara > 128).sum(axis=1) > 40)[0]
    return int(filas[0]) if len(filas) else int(H * 0.25)


def altura_legible(texto, f, mascara, minimo=0.6):
    """Sube la línea desde la frente hasta que se vea al menos `minimo` de las letras."""
    cima = cima_cabeza(mascara)
    persona = mascara.astype(np.float32) / 255.0
    for cy in range(min(max(cima + 15, 360), 820), 279, -30):
        x0, y0, x1, y1 = f.getbbox(texto)
        img = Image.new("L", (W, H), 0)
        ImageDraw.Draw(img).text(((W - (x1 - x0)) / 2 - x0, cy - (y1 - y0) / 2 - y0), texto, font=f, fill=255)
        letras = np.asarray(img).astype(np.float32) / 255.0
        total = letras.sum() or 1
        if (letras * (1 - persona)).sum() / total >= minimo:
            return cy
    return 280


class Golpe:
    def __init__(self, g, colores, mascara):
        self.desde, self.hasta = g["desde"], g["hasta"]
        self.abajo_en = g.get("abajo_en", self.desde + 0.2)
        self.arriba, self.abajo = g.get("arriba", ""), g.get("abajo", "")
        tam = g.get("tam", 1.0)
        # la línea de abajo cruza la frente; la de arriba queda sobre la cabeza
        self.f_ar = ajustar(self.arriba, fuente("DMSerifDisplay-Regular.ttf"), int(190 * tam), 980) if self.arriba else None
        self.f_ab = ajustar(self.abajo, fuente("InstrumentSerif-Italic.ttf"), int(330 * tam), 1010)
        cy_abajo = g.get("y") or altura_legible(self.abajo, self.f_ab, mascara, g.get("legible", 0.6))
        alto_ab = self.f_ab.size * 0.62
        self.cy_ab = cy_abajo
        self.cy_ar = cy_abajo - alto_ab / 2 - (self.f_ar.size * 0.45 if self.f_ar else 0) - 10
        self.colores = g.get("colores", colores)
        self.cache = {}

    def capa(self, t):
        """Capa RGBA (numpy float) del golpe en el segundo t, o None."""
        if t < self.desde or t > self.hasta:
            return None
        entra = ease_out((t - self.desde) / 0.22)
        sale = min(1.0, (self.hasta - t) / 0.12)
        alfa = min(entra, sale)
        # cuántas letras de la línea de abajo ya se escribieron
        dur = min(0.45, max(0.18, 0.05 * len(self.abajo)))
        k = int(np.clip((t - self.abajo_en) / dur, 0, 1) * len(self.abajo) + 0.999) if t >= self.abajo_en else 0
        clave = (k, round(alfa, 2), round(entra, 2))
        if clave in self.cache:
            return self.cache[clave]
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        if self.f_ar:
            sube = (1 - entra) * 40
            img = Image.alpha_composite(img, capa_contorno(self.arriba, self.f_ar, self.cy_ar + sube))
        if k > 0:
            # fija la posición con el texto completo para que no salte al escribirse
            parcial = capa_degrade(self.abajo, self.f_ab, self.cy_ab, self.colores)
            x0, _, x1, _ = self.f_ab.getbbox(self.abajo)
            x_ini = (W - (x1 - x0)) / 2
            x_corte = x_ini + self.f_ab.getlength(self.abajo[:k]) + 6
            a = np.array(parcial)
            a[:, int(min(W, x_corte)):, 3] = 0
            img = Image.alpha_composite(img, Image.fromarray(a))
        arr = np.asarray(img).astype(np.float32) / 255.0
        arr[..., 3] *= alfa
        if len(self.cache) > 80:
            self.cache.clear()
        self.cache[clave] = arr
        return arr


def bloques_subtitulos(pal, max_pal=3):
    out, actual = [], []
    for i, p in enumerate(pal):
        actual.append(p)
        corte = len(actual) >= max_pal or p["w"][-1:] in ".?!,;:" or (
            i + 1 < len(pal) and pal[i + 1]["s"] - p["e"] > 0.3)
        if corte:
            out.append(actual)
            actual = []
    if actual:
        out.append(actual)
    return out


class Subtitulos:
    def __init__(self, pal):
        self.bloques = bloques_subtitulos(pal)
        self.f = ImageFont.truetype(fuente("Poppins-SemiBold.ttf"), 50)
        self.cache = {}

    def capa(self, t):
        for b in self.bloques:
            if b[0]["s"] - 0.05 <= t <= b[-1]["e"] + 0.15:
                texto = " ".join(p["w"].strip(".,;:") for p in b)
                if texto not in self.cache:
                    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                    d = ImageDraw.Draw(img)
                    x0, y0, x1, y1 = self.f.getbbox(texto)
                    x, y = (W - (x1 - x0)) / 2 - x0, H * 0.70
                    sombra = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                    ImageDraw.Draw(sombra).text((x, y + 3), texto, font=self.f, fill=(0, 0, 0, 170))
                    img = Image.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(6)), img)
                    ImageDraw.Draw(img).text((x, y), texto, font=self.f, fill=(255, 255, 255, 255))
                    self.cache[texto] = np.asarray(img).astype(np.float32) / 255.0
                return self.cache[texto]
        return None


def sobre(fondo, capa):
    a = capa[..., 3:4]
    return fondo * (1 - a) + capa[..., :3] * a


def main():
    trabajo = sys.argv[1]
    cfg = leer_json(sys.argv[2] if len(sys.argv) > 2 else os.path.join(trabajo, "config-palabra.json"))
    salida = sys.argv[3] if len(sys.argv) > 3 else os.path.join(trabajo, "palabra-detras.mp4")
    base = os.path.join(trabajo, "base.mp4")
    colores = cfg.get("colores", COLORES)

    # la altura de la cabeza al inicio de cada golpe decide dónde va la palabra
    tiempos = sorted({round(g["desde"] * FPS) for g in cfg["golpes"]})
    mascaras = {}
    for i, m in enumerate(lector(os.path.join(trabajo, "mascara.mp4"), gris=True)):
        if i in tiempos:
            mascaras[i] = m.copy()
        if i > max(tiempos, default=0):
            break
    vacia = np.zeros((H, W), np.uint8)
    golpes = [Golpe(g, colores, mascaras.get(round(g["desde"] * FPS), vacia)) for g in cfg["golpes"]]
    subs = Subtitulos(palabras(trabajo)) if cfg.get("subtitulos", True) else None

    out = escritor(salida, audio_de=base)
    print("Renderizando «palabra detrás de ti»…")
    for i, (cuadro, m) in enumerate(zip(lector(base), lector(os.path.join(trabajo, "mascara.mp4"), gris=True))):
        t = i / FPS
        img = cuadro.astype(np.float32) / 255.0
        texto = None
        for g in golpes:
            c = g.capa(t)
            if c is not None:
                texto = c if texto is None else sobre(texto[..., :3], c)  # rara vez se cruzan
                break
        if texto is not None:
            persona = (m.astype(np.float32) / 255.0)[..., None]
            img = sobre(img, texto) * (1 - persona) + img * persona
        if subs:
            s = subs.capa(t)
            if s is not None:
                img = sobre(img, s)
        out.stdin.write((np.clip(img, 0, 1) * 255).astype(np.uint8).tobytes())
        if i % 90 == 0:
            print(f"  {t:.0f} s")
    out.stdin.close()
    out.wait()
    print(f"Listo → {salida}")


if __name__ == "__main__":
    main()
