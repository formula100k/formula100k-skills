# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["opencv-python-headless>=4.9,<5", "numpy"]
# ///
"""Detecta el rostro más grande de cada imagen con OpenCV (gratis, en tu computadora). Es la versión de Windows
(y de las Mac sin swiftc) de rostro.swift: misma salida, una línea JSON por imagen, en píxeles con origen arriba a
la izquierda:
{"archivo":..., "ancho":W, "alto":H, "rostro":{"x":..,"y":..,"w":..,"h":..,"cejas":..,"barbilla":..}}  (rostro null si no hay)
Cejas y barbilla se estiman con las proporciones de una cara (el detector solo da el recuadro).
Uso: uv run rostro.py img1.jpg [img2.jpg ...]
"""
import json
import sys

import cv2
import numpy as np

casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
for ruta in sys.argv[1:]:
    salida = {"archivo": ruta, "rostro": None}
    try:  # imdecode en vez de imread: imread no abre rutas con tildes o eñes en Windows
        img = cv2.imdecode(np.fromfile(ruta, dtype=np.uint8), cv2.IMREAD_COLOR)
    except Exception:
        img = None
    if img is None:
        salida["error"] = "no se pudo abrir"
        print(json.dumps(salida)); continue
    H, W = img.shape[:2]
    salida["ancho"], salida["alto"] = W, H
    gris = cv2.equalizeHist(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    caras = casc.detectMultiScale(gris, scaleFactor=1.1, minNeighbors=6, minSize=(max(40, W // 12), max(40, W // 12)))
    if len(caras):
        x, y, w, h = [float(v) for v in max(caras, key=lambda c: c[2] * c[3])]
        # el recuadro de Haar va de la frente baja a la boca: cejas ≈ 22 % del alto, barbilla ≈ 12 % por debajo
        salida["rostro"] = {"x": x, "y": y, "w": w, "h": h, "cejas": y + h * 0.22, "barbilla": y + h * 1.12}
    print(json.dumps(salida))
