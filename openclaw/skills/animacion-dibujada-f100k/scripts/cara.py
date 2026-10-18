# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["opencv-python-headless>=4.9", "numpy"]
# ///
"""Dónde están la cara, los ojos y la boca en una imagen (OpenCV + el detector YuNet, local y gratis).
Coordenadas en pixeles de ESA imagen, origen arriba a la izquierda. Si hay varias caras, usa la más grande.
Lo llama sistema.mjs con `uv run`, que baja Python y lo que haga falta.

Uso: uv run cara.py imagen.png  → imprime JSON:
  { ancho, alto, cara: [x,y,w,h], ojoIzq: [x,y], ojoDer: [x,y], ojoAncho, boca: [x,y], bocaAncho, bocaAlto }
  o  { ancho, alto, cara: null }
ojoIzq es el ojo que queda a la IZQUIERDA de la imagen. YuNet da el centro de cada ojo y las dos comisuras de la
boca; el ancho del ojo y el alto de la boca se estiman con las proporciones de una cara.
"""
import json
import sys
from pathlib import Path

MODELO = Path(__file__).resolve().parent / "modelos" / "face_detection_yunet_2023mar.onnx"


def main() -> int:
    if len(sys.argv) < 2:
        print("uso: cara.py imagen.png")
        return 1
    import cv2
    import numpy as np

    ruta = sys.argv[1]
    # imdecode en vez de imread: imread no abre rutas con tildes o eñes en Windows
    try:
        img = cv2.imdecode(np.fromfile(ruta, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    except Exception:
        img = None
    if img is None:
        print(f"No pude abrir la imagen: {ruta}")
        return 1
    if img.dtype != np.uint8:
        img = (img / 256).astype(np.uint8)
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif img.shape[2] == 4:  # recorte transparente: se pone sobre gris para que el borde no parezca una cara
        alfa = img[:, :, 3:4].astype(np.float32) / 255.0
        img = (img[:, :, :3].astype(np.float32) * alfa + 128.0 * (1.0 - alfa)).astype(np.uint8)
    alto, ancho = img.shape[:2]

    # YuNet ve mejor las caras de tamaño medio: la imagen se lleva a ~960 px de lado largo y se vuelve a la escala real
    k = min(1.0, 960.0 / max(alto, ancho))
    chica = cv2.resize(img, (max(1, round(ancho * k)), max(1, round(alto * k)))) if k < 1 else img
    tam = (chica.shape[1], chica.shape[0])
    try:  # el modelo se pasa desde memoria: OpenCV no abre archivos en rutas con tildes o eñes en Windows
        det = cv2.FaceDetectorYN.create("onnx", np.fromfile(str(MODELO), dtype=np.uint8), np.empty(0, dtype=np.uint8), tam, 0.6, 0.3, 50)
    except Exception:
        det = cv2.FaceDetectorYN.create(str(MODELO), "", tam, 0.6, 0.3, 50)
    _, caras = det.detect(chica)
    vacio = {"ancho": ancho, "alto": alto, "cara": None}
    if caras is None or len(caras) == 0:
        print(json.dumps(vacio))
        return 0
    f = max(caras, key=lambda c: c[2] * c[3]) / k
    r = lambda v: round(float(v), 1)
    x, y, w, h = f[0:4]
    ojo_a, ojo_b = (f[4], f[5]), (f[6], f[7])
    izq, der = sorted([ojo_a, ojo_b], key=lambda p: p[0])
    com_a, com_b = (f[10], f[11]), (f[12], f[13])
    entre_ojos = float(np.hypot(der[0] - izq[0], der[1] - izq[1]))
    boca_ancho = float(np.hypot(com_b[0] - com_a[0], com_b[1] - com_a[1])) * 1.15  # de comisura a comisura → borde de los labios
    print(json.dumps({
        "ancho": ancho, "alto": alto, "cara": [r(x), r(y), r(w), r(h)],
        "ojoIzq": [r(izq[0]), r(izq[1])], "ojoDer": [r(der[0]), r(der[1])], "ojoAncho": r(entre_ojos * 0.42),
        "boca": [r((com_a[0] + com_b[0]) / 2), r((com_a[1] + com_b[1]) / 2)], "bocaAncho": r(boca_ancho), "bocaAlto": r(boca_ancho * 0.39),
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
