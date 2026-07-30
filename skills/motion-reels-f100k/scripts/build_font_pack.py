#!/usr/bin/env python3
"""build_font_pack.py — descarga el pack tipográfico F100K (woff2 LOCALES) y
genera fonts.css con @font-face apuntando a archivos locales.

Por qué local: el render de HyperFrames/Remotion corre en Chrome headless. Si las
fuentes se cargan desde el CDN de Google, hay riesgo de FOUT (frames con la fuente
de sistema antes de que cargue la web font) → texto feo y no determinista. Bundlear
los woff2 localmente con font-display:block hace el render reproducible y nítido.

Catálogo Google Fonts → woff2 subset 'latin' (cubre español: áéíóúñ¿¡).
Idempotente: si los .woff2 y fonts.css ya existen, no vuelve a descargar.

Uso:  build_font_pack.py [out_dir]   (default: ../fonts junto a este script)
"""
import os, re, sys, urllib.request

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

# (familia Google, query css2) — pack curado por rol.
CSS_URL = ("https://fonts.googleapis.com/css2?"
           "family=Anton&"
           "family=Archivo+Black&"
           "family=Inter:wght@500;700;800;900&"
           "family=Montserrat:wght@800;900&"
           "family=Fraunces:ital,wght@1,600;1,700&"
           "display=block")

# Familias canónicas F100K → cómo se mapean a la familia real de Google.
# Las plantillas referencian SIEMPRE estos nombres canónicos (no el de Google),
# así cambiar de fuente es editar solo fonts.css.
CANON = {
    "Anton": "F100K Display",
    "Archivo Black": "F100K Display Alt",
    "Inter": "F100K Sans",
    "Montserrat": "F100K Sans Alt",
    "Fraunces": "F100K Serif",
}

def fetch(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read() if binary else r.read().decode("utf-8")

def parse_faces(css):
    """Devuelve [{family,weight,style,url,unicode_range}] de cada @font-face."""
    faces = []
    for block in re.findall(r"@font-face\s*{[^}]*}", css):
        fam = re.search(r"font-family:\s*'([^']+)'", block)
        wght = re.search(r"font-weight:\s*(\d+)", block)
        style = re.search(r"font-style:\s*(\w+)", block)
        url = re.search(r"url\((https://[^)]+\.woff2)\)", block)
        urange = re.search(r"unicode-range:\s*([^;]+);", block)
        if fam and url:
            faces.append({
                "family": fam.group(1),
                "weight": wght.group(1) if wght else "400",
                "style": style.group(1) if style else "normal",
                "url": url.group(1),
                "urange": urange.group(1).strip() if urange else "",
            })
    return faces

def is_latin(urange):
    # El subset 'latin' incluye el rango base U+0000-00FF.
    return "U+0000-00FF" in urange or "U+0000-0" in urange

def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "fonts")
    out = os.path.abspath(out)
    os.makedirs(out, exist_ok=True)
    css_path = os.path.join(out, "fonts.css")

    # Idempotencia: si ya hay css + al menos un woff2, salir.
    existing = [f for f in os.listdir(out) if f.endswith(".woff2")]
    if os.path.exists(css_path) and existing:
        print(f"✅ pack ya presente ({len(existing)} woff2) — nada que hacer")
        return

    print("→ pidiendo CSS de Google Fonts…")
    css = fetch(CSS_URL)
    faces = [f for f in parse_faces(css) if is_latin(f["urange"])]
    if not faces:  # fallback: si no detecta subset, quedarse con el primero por (fam,wght,style)
        seen = set(); faces = []
        for f in parse_faces(css):
            k = (f["family"], f["weight"], f["style"])
            if k not in seen:
                seen.add(k); faces.append(f)

    rules = []
    for f in faces:
        canon = CANON.get(f["family"], f["family"])
        slug = re.sub(r"[^a-z0-9]+", "-", canon.lower()).strip("-")
        fname = f"{slug}-{f['weight']}-{f['style']}.woff2"
        dest = os.path.join(out, fname)
        if not os.path.exists(dest):
            print(f"  ↓ {f['family']} {f['weight']} {f['style']} → {fname}")
            open(dest, "wb").write(fetch(f["url"], binary=True))
        # Emitir el @font-face con el nombre canónico F100K Y con el nombre original de
        # Google (alias) → así las plantillas que referencian 'Inter'/'Anton'/'Fraunces'
        # directamente también resuelven a la fuente local (drop-in, sin reescribir CSS).
        for famname in {canon, f["family"]}:
            rules.append(
                f"@font-face{{font-family:'{famname}';font-style:{f['style']};"
                f"font-weight:{f['weight']};font-display:block;"
                f"src:url('./{fname}') format('woff2');}}")

    header = ("/* Pack tipográfico F100K — generado por build_font_pack.py.\n"
              "   Familias canónicas: 'F100K Display' (Anton), 'F100K Sans' (Inter),\n"
              "   'F100K Serif' (Fraunces italic), + Alt (Archivo Black / Montserrat).\n"
              "   woff2 latin locales (incluye español). font-display:block evita FOUT. */\n")
    open(css_path, "w").write(header + "\n".join(rules) + "\n")
    print(f"✅ fonts.css con {len(rules)} @font-face en {out}")

if __name__ == "__main__":
    main()
