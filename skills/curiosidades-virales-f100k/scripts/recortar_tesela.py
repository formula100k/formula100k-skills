# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow>=10"]
# ///
"""Recorta un parche de una tesela de alta de la NASA (21.600 × 21.600, 240 px por grado). Igual en Mac y Windows.
Uso: uv run recortar_tesela.py <tesela.jpg> <salida.jpg> <y> <x> <alto> <ancho>
  y = (latNorteTesela − latNorteParche) · 240 · x = (lonOesteParche − lonOesteTesela) · 240 · máx. 8192 px por lado.
Ej. Chile (B2, lon −90…−60, lat −25…−55): uv run recortar_tesela.py tesela-B2.jpg chile-alta.jpg 6000 0 7200 7200
"""
import sys
from PIL import Image

if len(sys.argv) != 7:
    sys.exit(__doc__)
Image.MAX_IMAGE_PIXELS = None  # la tesela pasa el límite de seguridad de Pillow a propósito
tesela, salida = sys.argv[1], sys.argv[2]
y, x, alto, ancho = (int(v) for v in sys.argv[3:])
if max(alto, ancho) > 8192:
    sys.exit("Máximo 8192 px por lado: el render sin ventana no carga texturas más grandes.")
Image.open(tesela).crop((x, y, x + ancho, y + alto)).convert("RGB").save(salida, quality=90)
print(f"parche {ancho}×{alto} -> {salida}")
