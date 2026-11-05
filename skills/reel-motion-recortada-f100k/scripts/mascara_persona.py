# /// script
# requires-python = ">=3.10"
# dependencies = ["mediapipe", "opencv-python-headless", "numpy"]
# ///
"""mascara_persona.py — saca la silueta de la persona de un video SIN fondo verde, en Mac y en Windows.

Usa la segmentación de personas de MediaPipe (local y gratis). La primera vez baja el modelo (~16 MB) a
~/.cache/f100k-modelos/. Hace lo mismo que mascara_persona.swift (la versión de Mac con Vision).
Uso:  uv run --python 3.12 mascara_persona.py <entrada> <mascara.mp4> [rapida]
Salida: video en escala de grises (blanco = persona), mismos cuadros por segundo que la entrada.
"""
import os, subprocess, sys, urllib.request

import cv2
import mediapipe as mp
import numpy as np

URL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite"
MODELO = os.path.join(os.path.expanduser("~"), ".cache", "f100k-modelos", "selfie_multiclass.tflite")


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    src, out = sys.argv[1], sys.argv[2]
    rapida = len(sys.argv) > 3 and sys.argv[3] == "rapida"
    if not os.path.exists(MODELO):
        os.makedirs(os.path.dirname(MODELO), exist_ok=True)
        print("· bajando el modelo de recorte (una sola vez, ~16 MB)…")
        urllib.request.urlretrieve(URL, MODELO)
    ancho = 360 if rapida else 540
    fps = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=avg_frame_rate",
                                   "-of", "csv=p=0", src]).decode().strip() or "30"
    # tamaño ya girado (el iPhone graba con rotación en los metadatos): se mide sobre un cuadro decodificado
    uno = subprocess.check_output(["ffmpeg", "-loglevel", "error", "-i", src, "-frames:v", "1", "-vf", f"scale={ancho}:-2",
                                   "-f", "image2pipe", "-vcodec", "png", "-"])
    h, w = cv2.imdecode(np.frombuffer(uno, np.uint8), cv2.IMREAD_GRAYSCALE).shape
    lee = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-i", src, "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                           stdout=subprocess.PIPE)
    escribe = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{w}x{h}", "-r", fps,
                                "-i", "-", "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    seg = mp.tasks.vision.ImageSegmenter.create_from_options(mp.tasks.vision.ImageSegmenterOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=MODELO),
        running_mode=mp.tasks.vision.RunningMode.VIDEO, output_confidence_masks=True))
    num, den = (fps.split("/") + ["1"])[:2]
    paso = 1000 * float(den) / float(num)
    n = 0
    while True:
        buf = lee.stdout.read(w * h * 3)
        if len(buf) < w * h * 3:
            break
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.frombuffer(buf, np.uint8).reshape(h, w, 3).copy())
        fondo = seg.segment_for_video(img, int(n * paso)).confidence_masks[0].numpy_view()   # clase 0 = fondo
        m = np.clip(1.0 - np.squeeze(fondo).astype(np.float32), 0, 1)
        escribe.stdin.write((m * 255).astype(np.uint8).tobytes())
        n += 1
        if n % 300 == 0:
            print(f"  {n} cuadros…")
    escribe.stdin.close(); escribe.wait(); lee.wait()
    print(f"✅ máscara: {n} cuadros {w}x{h} → {out}")


if __name__ == "__main__":
    main()
