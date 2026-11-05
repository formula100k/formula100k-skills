"""Piezas compartidas por los dos estilos: leer y escribir video por tubería con ffmpeg,
cargar las fuentes y las palabras, y suavizar la máscara de la persona."""
import json
import os
import subprocess

import numpy as np

W, H, FPS = 1080, 1920, 30
AQUI = os.path.dirname(os.path.abspath(__file__))
FUENTES = os.path.join(os.path.dirname(AQUI), "fuentes")


def fuente(nombre):
    return os.path.join(FUENTES, nombre)


def lector(ruta, gris=False):
    """Devuelve un generador de cuadros (H, W, 3) uint8, o (H, W) si gris."""
    pix = "gray" if gris else "rgb24"
    canales = 1 if gris else 3
    p = subprocess.Popen(
        ["ffmpeg", "-loglevel", "error", "-i", ruta, "-f", "rawvideo", "-pix_fmt", pix, "-"],
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
    )
    tam = W * H * canales
    while True:
        buf = p.stdout.read(tam)
        if len(buf) < tam:
            break
        a = np.frombuffer(buf, np.uint8)
        yield a.reshape(H, W) if gris else a.reshape(H, W, 3)
    p.stdout.close()
    p.wait()


def escritor(salida, audio_de=None, crf=18):
    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    if audio_de:
        cmd += ["-i", audio_de, "-map", "0:v", "-map", "1:a?", "-c:a", "aac", "-b:a", "192k", "-shortest"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", salida]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


def cuadros_totales(ruta):
    r = subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0",
                        "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", ruta],
                       capture_output=True, text=True)
    try:
        return int(r.stdout.strip())
    except ValueError:
        return 0


def leer_json(ruta):
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def palabras(trabajo):
    ruta = os.path.join(trabajo, "palabras.json")
    return leer_json(ruta) if os.path.exists(ruta) else []


def suave(x, a, b):
    """smoothstep entre a y b."""
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def ease_out(t):
    t = min(max(t, 0.0), 1.0)
    return 1 - (1 - t) ** 3
