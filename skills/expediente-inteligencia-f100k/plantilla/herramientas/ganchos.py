#!/usr/bin/env python3
"""ganchos.py — dibuja los ganchos A/B/C con el ÚNICO dibujante permitido (herramientas/gancho_png.py, al lado de este archivo)
y escribe fuente/ganchos.js con la caja de cada bloque (la usa la revisión para que nada se le encime).

Uso: python3 herramientas/ganchos.py <carpeta del proyecto> <ganchos.json> [fondo.png]
ganchos.json: {"A": {"grande": "$4.500 VALIERON", "chica": "mil millones", "color": "verde"}, "B": {...}, "C": {...}}
Reglas que este script NO deja romper: centrado (nunca --alinear izq), arriba de la zona segura (y0 = 220),
de 2 a 5 palabras, con el degradado negro suave sin bordes del dibujante. La escena va a pantalla completa DETRÁS."""
import json, os, subprocess, sys
D = os.path.abspath(sys.argv[1]); G = json.load(open(sys.argv[2])); fondo = sys.argv[3] if len(sys.argv) > 3 else None
PNG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gancho_png.py")
out = {}
for k, g in G.items():
    palabras = len((g["grande"] + " " + g.get("chica", "")).split())
    if not 2 <= palabras <= 5: sys.exit(f"gancho {k}: {palabras} palabras (van de 2 a 5)")
    cmd = ["uv", "run", "-q", "--with", "pillow", "--with", "numpy", "python3", PNG, "--grande", g["grande"], "--chica", g.get("chica", ""),
           "--color", g.get("color", "verde"), "--alinear", "centro", "--y0", "220", "--out", f"{D}/fuente/img/gancho_{k}.png"]
    if fondo: cmd += ["--fondo", fondo, "--prueba", f"{D}/revision/gancho_{k}_prueba.jpg"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: sys.exit(f"gancho {k}: el dibujante lo rechazó\n{r.stdout}{r.stderr}")
    j = json.loads(r.stdout.strip().splitlines()[-1]); c = j["cajas"]
    out[k] = {"texto": g["grande"] + " / " + g.get("chica", ""), "caja": [min(x[0] for x in c), min(x[1] for x in c), max(x[2] for x in c), max(x[3] for x in c)]}
    print(k, out[k])
open(f"{D}/fuente/ganchos.js", "w").write("// generado por herramientas/ganchos.py\nwindow.GANCHOS = " + json.dumps(out, ensure_ascii=False) + ";\n")
