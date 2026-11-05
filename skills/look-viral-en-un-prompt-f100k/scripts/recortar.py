"""Paso 1: deja la toma lista para los estilos.

Saca de tu video:
  trabajo/base.mp4     tu toma en vertical 1080x1920 a 30 cuadros, con su audio
  trabajo/mascara.mp4  la silueta de la persona en blanco sobre negro, cuadro por cuadro

Uso: python recortar.py MI_VIDEO.mov CARPETA_DE_TRABAJO
"""
import os
import subprocess
import sys

import cv2
import mediapipe as mp
import numpy as np

from comun import FPS, H, W, lector, suave

MODELO = os.path.expanduser("~/.cache/look-viral-models/selfie_multiclass.tflite")


def sin_manchas(m):
    """Borra islas sueltas (cojines, reflejos) y deja solo lo que está pegado a la persona."""
    chica = cv2.resize(m, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    n, etq, stats, _ = cv2.connectedComponentsWithStats((chica > 0.5).astype(np.uint8), 8)
    if n <= 2:
        return m
    areas = stats[1:, cv2.CC_STAT_AREA]
    mantener = np.zeros(n, np.float32)
    mantener[1:][areas >= areas.max() * 0.08] = 1
    keep = cv2.resize(mantener[etq], (W, H), interpolation=cv2.INTER_NEAREST)
    keep = cv2.dilate(keep, np.ones((25, 25), np.uint8))
    return m * keep


def main():
    video, trabajo = sys.argv[1], sys.argv[2]
    os.makedirs(trabajo, exist_ok=True)
    base = os.path.join(trabajo, "base.mp4")

    # Recorta al centro a 9:16 si hace falta y lleva todo a 1080x1920 a 30 cuadros.
    filtro = (f"crop='min(iw,ih*9/16)':'min(ih,iw*16/9)',scale={W}:{H}:flags=lanczos,fps={FPS},setsar=1")
    print("Preparando tu toma en vertical…")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", video, "-vf", filtro,
                    "-c:v", "libx264", "-crf", "14", "-preset", "fast", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "192k", base], check=True)

    opciones = mp.tasks.vision.ImageSegmenterOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=MODELO),
        running_mode=mp.tasks.vision.RunningMode.VIDEO,
        output_confidence_masks=True,
    )
    seg = mp.tasks.vision.ImageSegmenter.create_from_options(opciones)

    sal = os.path.join(trabajo, "mascara.mp4")
    p = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray",
                          "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "8",
                          "-pix_fmt", "yuv420p", sal], stdin=subprocess.PIPE)
    previa = None
    print("Recortando a la persona cuadro por cuadro…")
    for i, cuadro in enumerate(lector(base)):
        chico = cv2.resize(cuadro, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(chico))
        r = seg.segment_for_video(img, int(i * 1000 / FPS))
        fondo = r.confidence_masks[0].numpy_view()  # clase 0 = fondo
        m = 1.0 - np.squeeze(fondo).astype(np.float32)
        m = cv2.resize(m, (W, H), interpolation=cv2.INTER_LINEAR)
        # Quieta en el tiempo (sin parpadeo) pero sin arrastrar cuando te mueves.
        if previa is not None:
            mov = np.abs(m - previa)
            peso = np.clip(0.55 + mov * 2, 0.55, 1.0)
            m = previa * (1 - peso) + m * peso
        previa = m
        m = sin_manchas(m)
        borde = cv2.GaussianBlur(m, (0, 0), 1.6)
        borde = suave(borde, 0.35, 0.65)
        p.stdin.write((borde * 255).astype(np.uint8).tobytes())
        if i % 60 == 0:
            print(f"  {i / FPS:.0f} s")
    p.stdin.close()
    p.wait()
    print(f"Listo: {base}\n       {sal}")


if __name__ == "__main__":
    main()
