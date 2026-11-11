#!/usr/bin/env python3
"""caras.py — detecta la cara más grande de cada foto y de cada cuadro de clip (Vision de macOS) y escribe fuente/caras.js.
Uso: python3 herramientas/caras.py <carpeta del proyecto>
Así la mira se engancha a la CARA COMPLETA de la persona que se nombra: nunca se pone a ojo."""
import json, os, subprocess, sys
D = os.path.abspath(sys.argv[1]); I = os.path.join(D, "fuente", "img"); SW = os.path.join(os.path.dirname(os.path.abspath(__file__)), "caras.swift")
def detecta(carpeta, archivos):
    if not archivos: return {}
    r = subprocess.run(["swift", SW, *archivos], cwd=carpeta, capture_output=True, text=True)
    return json.loads(r.stdout or "{}")
out = {}
fotos = sorted(f for f in os.listdir(I) if f.lower().endswith((".jpg", ".jpeg", ".png")))
for f, caja in detecta(I, fotos).items(): out[os.path.splitext(f)[0]] = caja
for c in sorted(d for d in os.listdir(I) if os.path.isdir(os.path.join(I, d))):
    cu = sorted(os.listdir(os.path.join(I, c))); det = detecta(os.path.join(I, c), cu)
    pista, ultimo = [], None
    for f in cu:                                   # si un cuadro no tiene cara, hereda la del cuadro vecino
        ultimo = det.get(f, ultimo); pista.append(ultimo)
    primero = next((p for p in pista if p), None)
    out[c] = [p or primero for p in pista]
open(os.path.join(D, "fuente", "caras.js"), "w").write("// generado por herramientas/caras.py — [x, y, ancho, alto] en fracciones de la imagen\nwindow.CARAS = " + json.dumps(out) + ";\n")
print("caras.js:", {k: (len(v) if isinstance(v[0], list) else "1") if v else 0 for k, v in out.items()})
