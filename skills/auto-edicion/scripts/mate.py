# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["onnxruntime", "opencv-python-headless", "numpy<2"]
# ///
"""Máscara en grises de la persona (blanco = persona) para recortarla del fondo. La llama video.mjs con `uv run`.
Robust Video Matting (ONNX): borde fino en el pelo, sin restos del fondo y estable entre cuadros (memoria recurrente).
La primera vez baja el modelo (15 MB) a ~/.cache/auto-edicion.
Uso: uv run mate.py <video> <mate.mp4>
"""
import os
import subprocess
import sys
import urllib.request

import cv2
import numpy as np
import onnxruntime as ort

URL = "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx"
src, dst = sys.argv[1], sys.argv[2]
modelo = os.path.join(os.path.expanduser("~"), ".cache", "auto-edicion", "rvm_mobilenetv3_fp32.onnx")
if not os.path.exists(modelo):
    os.makedirs(os.path.dirname(modelo), exist_ok=True)
    urllib.request.urlretrieve(URL, modelo + ".parcial")
    os.replace(modelo + ".parcial", modelo)

cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS) or 30
w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
ratio = np.array([min(1.0, 512 / min(w, h))], dtype=np.float32)   # el modelo mira la imagen chica y refina el borde a tamaño completo
sess = ort.InferenceSession(modelo, providers=["CPUExecutionProvider"])
rec = [np.zeros((1, 1, 1, 1), dtype=np.float32)] * 4
ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
                       "-c:v", "libx264", "-crf", "10", "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
while True:
    ok, fr = cap.read()
    if not ok:
        break
    x = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB).astype(np.float32).transpose(2, 0, 1)[None] / 255.0
    fgr, pha, *rec = sess.run(None, {"src": x, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": ratio})
    a = np.clip((pha[0, 0] - 0.04) / 0.92, 0, 1)   # limpia el velo casi transparente del fondo sin endurecer el pelo
    ff.stdin.write((a * 255 + 0.5).astype(np.uint8).tobytes())
ff.stdin.close(); ff.wait()
