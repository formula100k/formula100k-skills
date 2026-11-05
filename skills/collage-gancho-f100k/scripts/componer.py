#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# ///
"""Arma la capa del collage de gancho (1080x1920, fondo transparente) desde la biblioteca.

Uso:
  uv run componer.py pieza.json                 -> <salida>.png (capa) y <salida>-prueba.png (sobre la toma)
  (en Mac también: python3 -I componer.py pieza.json)

pieza.json:
{
  "salida": "/ruta/sin-extension",
  "titulo": ["Finanzas que", "nadie te explicó"],   # 1 o 2 líneas: la 1 sans, la 2 serif cursiva
  "etiqueta": "(edición para creadoras)",            # opcional, chica bajo el título
  "estilo_titulo": "normal" | "contorno",            # contorno = letra hueca como Kate
  "letra": "palo" | "condensada" | "serif",          # letra de la línea 1 según el tema (default palo)
  "arriba": ["id1", "id2", "id3"],                   # 2 a 4 recortes alrededor de la cabeza (id o ruta a una imagen)
  "abajo": ["id4", "id5"],                           # 0 a 2 a la altura del pecho
  "cuadro": true,                                    # "arriba" = 1 sola imagen ancha al centro (el cuadro)
  "lados": ["id6", "id7"],                           # 0 a 2 a los lados de la cabeza (con "cuadro")
  "color": "#c8102e",                                # opcional: un solo bloque de color fuerte
  "toma": "/ruta/fotograma.jpg",                     # fotograma (o el video) de la toma: de ahí sale el rostro
  "muestras": ["/ruta/cuadros/000[1-9]*.jpg"],       # opcional: más cuadros (globs) del tramo del gancho
  "segundos": 3,                                     # si "toma" es video: cuántos segundos del inicio se miran
  "posicion_titulo": "auto",                         # auto | arriba | abajo | número (y en px)
  "color_titulo": "#E8262B",                        # opcional: color plano de la línea 1
  "tam": [190, 64]                                   # opcional: px de la línea 1 y la 2 (gancho golpe: 1 ENORME, 2 chica)
}

Título en "auto": se detecta el rostro (Vision en Mac; OpenCV con uv en Windows) en todos los cuadros y se usa el peor caso
(la frente más alta y la barbilla más baja). Va arriba de la frente si cabe entre los recortes de
arriba y la frente; si no, debajo de la barbilla; si no cabe en ninguno, donde tape menos, con aviso.
"""
import glob, json, shutil, subprocess, sys, tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from biblio import BASE, buscar_chrome, cargar  # noqa: E402

# Huecos tipo @improvewithkate: la cara queda libre entre y=520 y y=1150.
HUECOS_ARRIBA = {
    2: [(40, 70, 470, 460, -3), (570, 60, 470, 470, 2)],
    3: [(20, 90, 320, 400, -4), (380, 20, 320, 380, 1), (740, 90, 320, 400, 3)],   # sin pisarse (12 px de aire con la rotación)
    4: [(14, 50, 240, 330, -3), (282, 24, 245, 300, -1), (553, 24, 245, 300, 1), (826, 50, 240, 330, 3)],
}
# «cuadro» = la imagen protagonista (un cuadro, una captura) arriba al centro, ancha,
# con 2 a los lados de la cabeza y 2 abajo. "arriba" lleva 1 sola imagen.
HUECO_CUADRO = (90, 30, 900, 520, 0)
HUECOS_LADOS = {
    1: [(10, 600, 240, 310, -3)],
    2: [(10, 600, 240, 310, -3), (830, 600, 240, 310, 3)],
}
HUECOS_ABAJO = {
    1: [(60, 1300, 420, 460, -2)],
    2: [(30, 1310, 470, 470, -3), (580, 1290, 470, 490, 2)],
}


VIDEO = {".mp4", ".mov", ".m4v", ".webm", ".mkv"}
MARGEN = 24  # aire entre el título y la cara o los recortes
BAJAR_MAX = 140  # lo más que bajan los recortes del pecho para que el título quepa bajo la barbilla
AIRE = 12  # las imágenes NUNCA se superponen; mínimo de aire entre dos


def caja(x, y, w, h, r):
    """Caja que ocupa la imagen ya rotada."""
    import math
    a = math.radians(abs(r))
    W = w * math.cos(a) + h * math.sin(a)
    H = w * math.sin(a) + h * math.cos(a)
    cx, cy = x + w / 2, y + h / 2
    return cx - W / 2, cy - H / 2, cx + W / 2, cy + H / 2


def revisar_superposicion(huecos):
    """Corta el render si dos imágenes se tocan."""
    cajas = [caja(*h) for h in huecos]
    for i in range(len(cajas)):
        for j in range(i + 1, len(cajas)):
            a, b = cajas[i], cajas[j]
            if a[0] < b[2] + AIRE and b[0] < a[2] + AIRE and a[1] < b[3] + AIRE and b[1] < a[3] + AIRE:
                sys.exit(f"Las imágenes {i + 1} y {j + 1} se superponen: las imágenes nunca se pisan. "
                         "Cambia los huecos o usa menos imágenes.")


def detector():
    """La orden que detecta rostros: en Mac, rostro.swift (Vision, gratis, se compila la primera vez);
    en Windows (o si en la Mac no hay swiftc), rostro.py con OpenCV vía uv (la primera vez baja OpenCV)."""
    aqui = Path(__file__).parent
    src = aqui / "rostro.swift"
    if sys.platform == "darwin" and src.exists() and shutil.which("swiftc"):
        binario = aqui / ".bin" / "rostro"
        try:
            if not binario.exists() or binario.stat().st_mtime < src.stat().st_mtime:
                binario.parent.mkdir(exist_ok=True)
                subprocess.run(["swiftc", "-O", str(src), "-o", str(binario)], check=True, capture_output=True)
            return [str(binario)]
        except subprocess.CalledProcessError:
            pass
    if not shutil.which("uv"):
        sys.exit("Para ubicar el título según la cara hace falta uv (o pon \"posicion_titulo\" a mano en el JSON).")
    return ["uv", "run", "--quiet", str(aqui / "rostro.py")]


def cuadros_del_video(video, segundos, carpeta):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-t", str(segundos), "-i", str(video),
                    "-vf", "fps=3", str(Path(carpeta) / "c%03d.jpg")], check=True)
    return sorted(Path(carpeta).glob("c*.jpg"))


def rostro_en_lienzo(cuadros):
    """Frente y barbilla (peor caso de todos los cuadros) en coordenadas del lienzo 1080x1920."""
    if not cuadros:
        return None
    out = subprocess.run(detector() + [str(c) for c in cuadros], capture_output=True, text=True, encoding="utf-8").stdout
    frente, barbilla, vistos = None, None, 0
    for linea in out.splitlines():
        if not linea.startswith("{"):
            continue
        d = json.loads(linea)
        r = d.get("rostro")
        if not r:
            continue
        # la toma se pinta con object-fit:cover
        k = max(1080 / d["ancho"], 1920 / d["alto"])
        dy = (1920 - d["alto"] * k) / 2
        cejas = r.get("cejas", r["y"])
        menton = r.get("barbilla", r["y"] + r["h"])
        f = (cejas - (menton - cejas) * 0.5) * k + dy  # nacimiento del pelo ≈ media cara sobre las cejas
        b = menton * k + dy
        frente = f if frente is None else min(frente, f)
        barbilla = b if barbilla is None else max(barbilla, b)
        vistos += 1
    return {"frente": frente, "barbilla": barbilla, "cuadros": vistos, "total": len(cuadros)} if vistos else None


def alto_titulo(l1, l2, etiqueta, tam=None):
    a1, a2 = (round(tam[0] * 1.05), round(tam[1] * 1.05)) if tam else (88, 109)
    return (a1 if l1 else 0) + (a2 if l2 else 0) + (46 if etiqueta else 0)


def ubicar_titulo(modo, cara, techo, piso, alto):
    """Devuelve (y, motivo). techo = fin de los recortes de arriba, piso = inicio de los de abajo."""
    if isinstance(modo, (int, float)):
        return int(modo), "posición fija del JSON"
    if cara is None:
        return 560, "sin rostro detectado (pasa \"toma\"): queda en la posición de siempre"
    y_arriba = int(cara["frente"] - MARGEN - alto)
    y_abajo = int(cara["barbilla"] + MARGEN)
    cabe_arriba = y_arriba >= techo
    cabe_abajo = y_abajo + alto <= piso
    if modo == "arriba" or (modo == "auto" and cabe_arriba):
        return max(y_arriba, techo), "arriba de la frente" + ("" if cabe_arriba else " (NO CABE: tapa la frente)")
    if modo == "abajo" or (modo == "auto" and cabe_abajo):
        return y_abajo, "debajo de la barbilla" + ("" if cabe_abajo else " (NO CABE: pisa los recortes de abajo)")
    tapa_arriba = techo - y_arriba
    tapa_abajo = y_abajo + alto - piso
    if tapa_arriba <= tapa_abajo:
        return techo, f"AVISO: no cabe; arriba tapa {tapa_arriba}px de la frente. Usa 3 recortes arriba o baja el título a 1 línea"
    return piso - alto, f"AVISO: no cabe; abajo pisa {tapa_abajo}px de los recortes. Usa 1 recorte abajo o ninguno"


def figura(img, x, y, w, h, rot, color=None):
    src = (BASE / (img["recorte"] or img["archivo"])).as_uri()
    recorte = bool(img["recorte"])
    estilo = (f"left:{x}px;top:{y}px;width:{w}px;height:{h}px;transform:rotate({rot}deg);")
    clase = "rec" if recorte else "foto"
    fondo = f"background:{color};" if color else ""
    return f'<div class="{clase}" style="{estilo}{fondo}"><img src="{src}"></div>'


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    cfg = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    ix = cargar()["imagenes"]
    # además de ids de la biblioteca, acepta rutas a imágenes reales del proyecto (campañas, capturas)
    for i in cfg.get("arriba", []) + cfg.get("abajo", []):
        if i not in ix and Path(i).expanduser().is_file():
            ix[i] = {"archivo": str(Path(i).expanduser().resolve()), "recorte": None}
    arriba, abajo = cfg.get("arriba", []), cfg.get("abajo", [])
    lados = cfg.get("lados", [])
    for i in lados:
        if i not in ix and Path(i).expanduser().is_file():
            ix[i] = {"archivo": str(Path(i).expanduser().resolve()), "recorte": None}
    if cfg.get("cuadro"):
        if len(arriba) != 1 or len(lados) > 2 or len(abajo) > 2:
            sys.exit("Con \"cuadro\": 1 imagen arriba (el cuadro), 0 a 2 a los lados y 0 a 2 abajo.")
        huecos_arriba = [HUECO_CUADRO]
    else:
        if not 2 <= len(arriba) <= 4 or len(abajo) > 2:
            sys.exit("Arriba van de 2 a 4 imágenes y abajo de 0 a 2.")
        huecos_arriba = HUECOS_ARRIBA[len(arriba)]
    huecos_lados = HUECOS_LADOS.get(len(lados), [])
    huecos_abajo = HUECOS_ABAJO.get(len(abajo), [])
    t = cfg.get("titulo", [])
    l1 = t[0] if t else ""
    l2 = t[1] if len(t) > 1 else ""
    contorno = cfg.get("estilo_titulo") == "contorno"
    etiqueta = cfg.get("etiqueta", "")

    # ── dónde va el título según el rostro
    tmp = tempfile.mkdtemp()
    toma = Path(cfg["toma"]).expanduser().resolve() if cfg.get("toma") else None
    cuadros = []
    if toma and toma.suffix.lower() in VIDEO:
        cuadros = cuadros_del_video(toma, cfg.get("segundos", 3), tmp)
        toma = cuadros[len(cuadros) // 2] if cuadros else None  # la prueba se pinta sobre un cuadro del medio
    elif toma:
        cuadros = [toma]
    for patron in cfg.get("muestras", []):
        cuadros += [Path(p) for p in sorted(glob.glob(str(Path(patron).expanduser())))]
    modo = cfg.get("posicion_titulo", "auto")
    cara = rostro_en_lienzo(cuadros) if not isinstance(modo, (int, float)) else None
    techo = max(y + h for x, y, w, h, r in huecos_arriba) + MARGEN
    if cfg.get("color") and not cfg.get("cuadro"):
        techo = max(techo, 110 + 400 + MARGEN)  # el bloque de color también es de arriba
    piso = min((y for x, y, w, h, r in huecos_abajo), default=1900) - MARGEN
    tam = cfg.get("tam")
    alto = alto_titulo(l1, l2, etiqueta, tam)
    if modo in ("auto", "abajo") and cara and huecos_abajo and (modo == "abajo" or cara["frente"] - MARGEN - alto < techo):
        # arriba no cabe: si abajo falta poco, los recortes del pecho bajan lo necesario
        falta = int(cara["barbilla"] + MARGEN + alto - piso)
        if 0 < falta <= BAJAR_MAX:
            huecos_abajo = [(x, y + falta, w, h, r) for x, y, w, h, r in huecos_abajo]
            piso += falta
            print(f"Los recortes de abajo bajan {falta}px para dejarle sitio al título")
    y_titulo, motivo = ubicar_titulo(modo, cara, techo, piso, alto)
    if cara:
        print(f"Rostro en {cara['cuadros']}/{cara['total']} cuadros: frente y≈{cara['frente']:.0f}, "
              f"barbilla y≈{cara['barbilla']:.0f}")
    print(f"Título en y={y_titulo}: {motivo}")

    revisar_superposicion(huecos_arriba + huecos_lados + huecos_abajo)
    piezas = []
    for (x, y, w, h, r), i in zip(huecos_lados, lados):
        piezas.append(figura(ix[i], x, y, w, h, r))
    for (x, y, w, h, r), i in zip(huecos_arriba, arriba):
        piezas.append(figura(ix[i], x, y, w, h, r))
    for (x, y, w, h, r), i in zip(huecos_abajo, abajo):
        piezas.append(figura(ix[i], x, y, w, h, r))
    if cfg.get("color") and not cfg.get("cuadro"):  # bloque de color detrás de la segunda imagen de arriba
        piezas.insert(0, f'<div class="bloque" style="background:{cfg["color"]}"></div>')

    css = """
*{margin:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;background:transparent;overflow:hidden}
.lienzo{position:relative;width:1080px;height:1920px}
.toma{position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover}
.foto,.rec{position:absolute;display:flex}
.foto{box-shadow:0 10px 30px rgba(0,0,0,.45)}
.foto img{width:100%;height:100%;object-fit:cover;filter:grayscale(.25) contrast(1.05)}
.rec img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 12px 18px rgba(0,0,0,.5))}
.bloque{position:absolute;left:600px;top:110px;width:440px;height:400px}
.titulo{position:absolute;left:0;right:0;top:__Y__px;text-align:center;color:#fff;
  text-shadow:0 3px 18px rgba(0,0,0,.65)}
.l1{font:800 84px/1.05 'Helvetica Neue',Helvetica,'Segoe UI',Arial,sans-serif;letter-spacing:-1px}
.l2{font:italic 400 104px/1.05 'Didot','Bodoni 72','Bodoni MT',Georgia,serif}
.contorno .l1,.contorno .l2{color:transparent;-webkit-text-stroke:4px #f5f5f5;text-shadow:none;
  filter:drop-shadow(0 3px 10px rgba(0,0,0,.6))}
.etq{font:500 30px 'Helvetica Neue',Helvetica,sans-serif;margin-top:10px;opacity:.95}
"""
    css = css.replace("__Y__", str(y_titulo))
    # edición sin olor a IA: la línea 1 puede ir en una letra de diseño según el tema
    letra = cfg.get("letra", "palo")
    if letra == "condensada":
        css += ".l1{font:400 104px/1.02 Impact,'DIN Condensed','Haettenschweiler','Arial Narrow',sans-serif;letter-spacing:0;text-transform:uppercase}\n"
    elif letra == "serif":
        css += ".l1{font:italic 700 96px/1.05 'Didot','Bodoni 72','Bodoni MT',Georgia,serif;letter-spacing:-1px}\n"
    if cfg.get("color_titulo"):  # gancho golpe: color plano de la línea 1 (rojo negativo, verde logro, el acento de tu marca)
        css += f".l1{{color:{cfg['color_titulo']}}}\n"
    if tam:  # gancho golpe: la línea 1 enorme y la 2 chica
        css += f".l1{{font-size:{tam[0]}px;line-height:1.05}}\n.l2{{font-size:{tam[1]}px;line-height:1.05}}\n"
    cuerpo = "".join(piezas) + (
        f'<div class="titulo{" contorno" if contorno else ""}"><div class="l1">{l1}</div>'
        + (f'<div class="l2">{l2}</div>' if l2 else "")
        + (f'<div class="etq">{etiqueta}</div>' if etiqueta else "") + "</div>")

    salida = Path(cfg["salida"])
    salida.parent.mkdir(parents=True, exist_ok=True)

    def render(html, destino, transparente):
        with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as fh:
            fh.write(f'<!doctype html><meta charset="utf-8"><style>{css}</style><div class="lienzo">{html}</div>')
        args = [buscar_chrome(), "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                f"--screenshot={destino}", "--window-size=1080,1920", "--virtual-time-budget=8000"]
        if transparente:
            args.append("--default-background-color=00000000")
        subprocess.run(args + [Path(fh.name).as_uri()], check=True, capture_output=True)

    render(cuerpo, f"{salida}.png", True)
    print(f"{salida}.png")
    if toma:
        render(f'<img class="toma" src="{Path(toma).as_uri()}">' + cuerpo,
               f"{salida}-prueba.png", False)
        print(f"{salida}-prueba.png")


if __name__ == "__main__":
    main()
