#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# ///
"""Biblioteca de imágenes para el collage de gancho.

Todo vive en una carpeta (por defecto ~/Documents/mis-animaciones/biblioteca-collage en Mac y
~/mis-animaciones/biblioteca-collage en Windows; se cambia con la variable BIBLIO_COLLAGE):
  imagenes/<id>.<ext>   lo que se bajó
  recortes/<id>.png     la misma imagen sin fondo (si ya se pagó)
  hojas/                hojas de muestras para elegir
  indice.json           ficha de cada imagen: etiquetas, origen, usos

Solo usa la librería estándar de Python (córrelo con `uv run biblio.py …`; en Mac también `python3 -I biblio.py …`). Comandos:
  buscar    mira primero la biblioteca y dice qué falta
  traer     baja de Openverse (gratis, libres para ads) o, si tienes cuenta de Apify, de Pinterest
  hoja      arma la hoja numerada para elegir
  recorte   registra la versión sin fondo
  usar      anota en qué pieza se usó
  etiquetar / descartar / ver / resumen
"""
import argparse, datetime as dt, hashlib, json, os, re, subprocess, sys, tempfile
import urllib.parse, urllib.request
from pathlib import Path

_ANIM = Path.home() / "mis-animaciones" if sys.platform == "win32" else Path.home() / "Documents" / "mis-animaciones"
BASE = Path(os.environ.get("BIBLIO_COLLAGE") or _ANIM / "biblioteca-collage").expanduser()
INDICE = BASE / "indice.json"


def buscar_chrome():
    """La ruta de Google Chrome en Mac, Windows o Linux (manda la variable CHROME si existe)."""
    import shutil
    cand = [os.environ.get("CHROME"),
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            str(Path.home() / "Applications/Google Chrome.app/Contents/MacOS/Google Chrome")]
    for var in ("PROGRAMFILES", "PROGRAMFILES(X86)", "LOCALAPPDATA"):
        if os.environ.get(var):
            cand.append(os.path.join(os.environ[var], "Google", "Chrome", "Application", "chrome.exe"))
    cand += [shutil.which(n) for n in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome")]
    for c in cand:
        if c and Path(c).is_file():
            return c
    sys.exit("No encontré Google Chrome. Instálalo o indica dónde está con la variable CHROME.")


CHROME = None  # se busca al usarlo: buscar_chrome()
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
HOY = dt.date.today().isoformat()

# Precios de Apify por imagen (oct-2026), para dejar el gasto anotado.
ACTORES = {
    "devcake": ("devcake~pinterest-search-scraper", 0.002, 0.0),
    "fetch_cat": ("fetch_cat~pinterest-search-scraper", 0.0014, 0.0476),
}


# ---------- índice ----------
def cargar():
    if INDICE.exists():
        return json.loads(INDICE.read_text(encoding="utf-8"))
    return {"imagenes": {}, "gastos": []}


def guardar(ix):
    for d in ("imagenes", "recortes", "hojas"):
        (BASE / d).mkdir(parents=True, exist_ok=True)
    tmp = INDICE.with_suffix(".tmp")
    tmp.write_text(json.dumps(ix, ensure_ascii=False, indent=1), encoding="utf-8")
    tmp.replace(INDICE)


def norm(t):
    t = t.lower().strip()
    for a, b in zip("áéíóúüñ", "aeiouun"):
        t = t.replace(a, b)
    return t


def etiquetas(s):
    return sorted({norm(x) for x in re.split(r"[,;]", s or "") if x.strip()})


# ---------- buscar en la biblioteca ----------
def puntaje(img, pedidas):
    tags = set(img.get("etiquetas", []))
    texto = norm(" ".join([img.get("busqueda", ""), img.get("descripcion", "")]))
    p = 0.0
    for t in pedidas:
        if t in tags:
            p += 3
        elif any(t in x or x in t for x in tags):
            p += 1.5
        elif t in texto:
            p += 1
    return p


def cmd_buscar(a):
    ix = cargar()
    pedidas = etiquetas(a.etiquetas)
    limite = dt.date.today() - dt.timedelta(days=a.sin_usar_dias)
    res = []
    for i, img in ix["imagenes"].items():
        if img.get("descartada"):
            continue
        if a.solo_libres and not img.get("libre"):
            continue
        p = puntaje(img, pedidas)
        if p <= 0:
            continue
        reciente = [u for u in img.get("usos", []) if u["fecha"] >= limite.isoformat()]
        res.append((p, img.get("saves") or 0, i, img, reciente))
    res.sort(key=lambda r: (-r[0], -r[1]))
    libres = [r for r in res if not r[4]]
    print(f"Biblioteca: {len(ix['imagenes'])} imágenes · coinciden {len(res)} · disponibles (sin uso en {a.sin_usar_dias} días) {len(libres)}")
    for p, s, i, img, rec in res[: a.max]:
        marca = "  usada " + rec[-1]["pieza"] if rec else ""
        rc = " [recorte]" if img.get("recorte") else ""
        print(f"{i}  {p:>4.1f}  {s or '-':>6}  {', '.join(img['etiquetas'])[:60]}{rc}{marca}")
    if len(libres) < a.necesito:
        print(f"\nFALTAN {a.necesito - len(libres)}: conviene traer más con «traer».")
    else:
        print("\nALCANZA: no hace falta buscar afuera.")


# ---------- traer ----------
def token():
    if os.environ.get("APIFY_TOKEN"):
        return os.environ["APIFY_TOKEN"]
    sys.exit("Pinterest pasa por Apify (de pago, centavos) y necesita la variable APIFY_TOKEN con tu llave de Apify.\n"
             "Sin cuenta de Apify usa --fuente openverse (gratis).")


def http_json(url, data=None, timeout=300):
    req = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None,
                                 headers={"Content-Type": "application/json", **UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def pinterest(consultas, por_consulta, actor):
    """devcake no devuelve la consulta en cada fila: se corre una por consulta (su arranque cuesta 0)."""
    if actor == "devcake" and len(consultas) > 1:
        out, n = [], 0
        for q in consultas:
            o, k = pinterest([q], por_consulta, actor)
            out += o; n += k
        return out, n
    nombre, _, _ = ACTORES[actor]
    if actor == "devcake":
        entrada = {"searchQueries": consultas, "maxResults": max(24, por_consulta), "includeComments": False}
    else:
        entrada = {"queries": consultas, "maxResultsPerQuery": por_consulta, "includePinDetails": False}
    url = (f"https://api.apify.com/v2/acts/{nombre}/run-sync-get-dataset-items"
           f"?token={token()}&clean=true&timeout=280")
    filas = http_json(url, entrada)
    out = []
    for f in filas:
        if actor == "devcake":
            img = ((f.get("images") or {}).get("orig") or {}).get("url") or f.get("images.orig.url")
            out.append({"url": img, "pin": f.get("url") or (f"https://www.pinterest.com/pin/{f.get('id')}/" if f.get("id") else ""),
                        "busqueda": consultas[0],
                        "descripcion": " ".join(filter(None, [f.get("grid_title"), (f.get("description") or "").strip()]))[:300],
                        "saves": f.get("saves") or f.get("repin_count") or 0})
        else:
            out.append({"url": f.get("imageUrl"), "pin": f.get("pinUrl", ""), "busqueda": f.get("query", ""),
                        "descripcion": " ".join(filter(None, [f.get("title"), f.get("description")]))[:300],
                        "saves": f.get("saveCount") or f.get("repinCount") or 0})
    return [o for o in out if o["url"]], len(filas)


def openverse(consultas, por_consulta):
    """Imágenes con licencia que permite uso comercial (CC0, dominio público, CC BY, CC BY-SA)."""
    out = []
    for q in consultas:
        # Openverse exige todas las palabras: si no hay nada, se prueba con menos.
        palabras, res = q.split(), []
        while palabras and not res:
            u = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode({
                "q": " ".join(palabras), "page_size": min(por_consulta, 20),
                "license": "cc0,pdm,by,by-sa", "mature": "false"})  # sin ND ni NC: se pueden recortar y usar en ads
            res = http_json(u).get("results", [])
            palabras = palabras[:-1]
        for o in res:
            if o.get("url"):
                autor = o.get("creator") or "autor desconocido"
                out.append({"url": o["url"], "pin": o.get("foreign_landing_url", ""), "busqueda": q,
                            "descripcion": f"{o.get('title') or ''} · {autor} · {o.get('license','').upper()} {o.get('license_version') or ''}".strip(),
                            "saves": 0, "libre": True,
                            "credito": f"{autor} ({o.get('license','').upper()} {o.get('license_version') or ''})".strip()})
    return out, len(out)


def bajar(url):
    req = urllib.request.Request(url, headers={**UA, "Referer": "https://www.pinterest.com/"} if "pinimg" in url else UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read(), r.headers.get("Content-Type", "")


def ext_de(datos, ctype):
    if datos[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if datos[:4] == b"RIFF" and datos[8:12] == b"WEBP":
        return "webp"
    if datos[:3] == b"GIF":
        return "gif"
    return "jpg"


def cmd_traer(a):
    ix = cargar()
    consultas = [c.strip() for c in a.consultas if c.strip()]
    tags_fijas = etiquetas(a.etiquetas)
    # etiquetas por consulta: "consulta=>tag1,tag2"
    pares = []
    for c in consultas:
        if "=>" in c:
            q, t = c.split("=>", 1)
            pares.append((q.strip(), etiquetas(t)))
        else:
            pares.append((c, []))
    qs = [q for q, _ in pares]
    tags_q = {norm(q): t for q, t in pares}

    if a.fuente == "openverse":
        filas, n = openverse(qs, a.por_consulta)
        costo = 0.0
    else:
        filas, n = pinterest(qs, a.por_consulta, a.fuente)
        _, por, arranque = ACTORES[a.fuente]
        costo = round(n * por + arranque, 4)

    por_url = {img.get("url_origen"): i for i, img in ix["imagenes"].items()}
    por_hash = {img.get("sha1"): i for i, img in ix["imagenes"].items()}
    nuevas, repetidas, fallas = [], 0, 0
    for f in filas:
        if f["url"] in por_url:
            repetidas += 1
            continue
        try:
            datos, ctype = bajar(f["url"])
        except Exception as e:
            fallas += 1
            continue
        if len(datos) < 3000:
            fallas += 1
            continue
        sha = hashlib.sha1(datos).hexdigest()
        if sha in por_hash:
            repetidas += 1
            continue
        i = sha[:10]
        ext = ext_de(datos, ctype)
        (BASE / "imagenes").mkdir(parents=True, exist_ok=True)
        (BASE / "imagenes" / f"{i}.{ext}").write_bytes(datos)
        q = f["busqueda"] or (qs[0] if len(qs) == 1 else "")
        extra = tags_q.get(norm(q), [])
        ix["imagenes"][i] = {
            "archivo": f"imagenes/{i}.{ext}", "sha1": sha, "url_origen": f["url"], "pin": f["pin"],
            "fuente": "openverse" if a.fuente == "openverse" else "pinterest", "libre": bool(f.get("libre")),
            "credito": f.get("credito"),
            "busqueda": q, "descripcion": f["descripcion"], "saves": f["saves"],
            "etiquetas": sorted(set(tags_fijas) | set(extra) | ({a.estilo} if a.estilo else set())),
            "recorte": None, "usos": [], "fecha": HOY,
        }
        por_url[f["url"]] = i
        por_hash[sha] = i
        nuevas.append(i)
    ix["gastos"].append({"fecha": HOY, "fuente": a.fuente, "consultas": qs, "resultados": n,
                         "nuevas": len(nuevas), "usd_aprox": costo})
    guardar(ix)
    print(f"Fuente {a.fuente}: {n} resultados · {len(nuevas)} nuevas · {repetidas} ya estaban · {fallas} no bajaron · ~{costo} USD")
    print("IDS " + " ".join(nuevas))


# ---------- hoja de muestras ----------
def cmd_hoja(a):
    ix = cargar()
    ids = a.ids or []
    if a.ultimas:
        ids += sorted(ix["imagenes"], key=lambda i: ix["imagenes"][i]["fecha"])[-a.ultimas:]
    if a.etiquetas:
        pedidas = etiquetas(a.etiquetas)
        cand = [(puntaje(img, pedidas), img.get("saves") or 0, i) for i, img in ix["imagenes"].items()
                if not img.get("descartada")]
        ids += [i for p, s, i in sorted(cand, reverse=True) if p > 0][: a.max]
    ids = [i for i in dict.fromkeys(ids) if i in ix["imagenes"]]
    if not ids:
        sys.exit("No hay imágenes para la hoja.")
    cols = 5
    celdas = []
    for n, i in enumerate(ids, 1):
        img = ix["imagenes"][i]
        arch = BASE / (img["recorte"] or img["archivo"])
        usos = len(img.get("usos", []))
        pie = f"{n} · {i}" + (f" · usada {usos}" if usos else "") + (" · libre" if img.get("libre") else "")
        celdas.append(f'<figure><div class="n">{n}</div><img src="{arch.as_uri()}"><figcaption>{pie}</figcaption></figure>')
    filas = (len(ids) + cols - 1) // cols
    alto = 120 + filas * 430
    html = f"""<!doctype html><meta charset="utf-8"><style>
body{{margin:0;background:#1b1b1b;font:600 15px -apple-system,Helvetica;color:#ddd}}
h1{{font-size:22px;margin:24px 28px 8px}}
.g{{display:grid;grid-template-columns:repeat({cols},1fr);gap:14px;padding:16px 28px}}
figure{{margin:0;background:#2a2a2a;position:relative;height:400px;display:flex;flex-direction:column}}
img{{flex:1;min-height:0;object-fit:contain;width:100%;background:#111}}
.n{{position:absolute;top:8px;left:8px;background:#ff5a1f;color:#fff;font-size:22px;padding:2px 10px;border-radius:6px}}
figcaption{{padding:6px 8px;font-size:12px;color:#aaa}}</style>
<h1>{a.titulo or 'Hoja de muestras'} · {HOY}</h1><div class="g">{''.join(celdas)}</div>"""
    nombre = re.sub(r"[^a-z0-9-]+", "-", norm(a.titulo or "hoja")).strip("-") or "hoja"
    destino = BASE / "hojas" / f"{HOY}_{nombre}.png"
    destino.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as fh:
        fh.write(html)
    subprocess.run([buscar_chrome(), "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                    f"--screenshot={destino}", f"--window-size=1500,{alto}", "--virtual-time-budget=8000",
                    Path(fh.name).as_uri()], check=True, capture_output=True)
    (destino.with_suffix(".json")).write_text(json.dumps(dict(enumerate(ids, 1)), indent=1))
    print(destino)
    for n, i in enumerate(ids, 1):
        print(f"{n}={i}", end="  ")
    print()


# ---------- recorte, uso, etiquetas ----------
def cmd_recorte(a):
    ix = cargar()
    img = ix["imagenes"][a.id]
    if re.match(r"https?://", a.png):
        datos, _ = bajar(a.png)
    else:
        datos = Path(a.png).expanduser().read_bytes()
    dest = BASE / "recortes" / f"{a.id}.png"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(datos)
    img["recorte"] = f"recortes/{a.id}.png"
    guardar(ix)
    print(dest)


def cmd_usar(a):
    ix = cargar()
    for i in a.ids:
        ix["imagenes"][i].setdefault("usos", []).append({"pieza": a.pieza, "fecha": HOY})
    guardar(ix)
    print(f"Anotadas {len(a.ids)} en «{a.pieza}».")


def cmd_etiquetar(a):
    ix = cargar()
    img = ix["imagenes"][a.id]
    tags = set(img["etiquetas"])
    for t in a.cambios:
        if t.startswith("-"):
            tags.discard(norm(t[1:]))
        else:
            tags.add(norm(t.lstrip("+")))
    img["etiquetas"] = sorted(tags)
    guardar(ix)
    print(a.id, ", ".join(img["etiquetas"]))


def cmd_descartar(a):
    ix = cargar()
    for i in a.ids:
        ix["imagenes"][i]["descartada"] = a.motivo or True
    guardar(ix)
    print(f"Descartadas {len(a.ids)}: no vuelven a salir en búsquedas.")


def cmd_ver(a):
    ix = cargar()
    img = ix["imagenes"][a.id]
    print(json.dumps({**img, "ruta": str(BASE / (img["recorte"] or img["archivo"]))}, ensure_ascii=False, indent=1))


def cmd_resumen(a):
    ix = cargar()
    ims = ix["imagenes"].values()
    tags = {}
    for img in ims:
        for t in img["etiquetas"]:
            tags[t] = tags.get(t, 0) + 1
    gasto = sum(g["usd_aprox"] for g in ix["gastos"])
    print(f"{len(ix['imagenes'])} imágenes · {sum(1 for i in ims if i.get('recorte'))} recortes · "
          f"{sum(1 for i in ims if i.get('usos'))} usadas · {sum(1 for i in ims if i.get('libre'))} libres para ads · "
          f"gastado ~{gasto:.2f} USD en {len(ix['gastos'])} búsquedas")
    print("Etiquetas: " + ", ".join(f"{t} ({n})" for t, n in sorted(tags.items(), key=lambda x: -x[1])[:40]))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    s = p.add_subparsers(dest="cmd", required=True)

    b = s.add_parser("buscar"); b.add_argument("etiquetas"); b.add_argument("--necesito", type=int, default=6)
    b.add_argument("--sin-usar-dias", type=int, default=14); b.add_argument("--max", type=int, default=25)
    b.add_argument("--solo-libres", action="store_true"); b.set_defaults(f=cmd_buscar)

    t = s.add_parser("traer"); t.add_argument("consultas", nargs="+", help='"consulta" o "consulta=>tag1,tag2"')
    t.add_argument("--etiquetas", default=""); t.add_argument("--estilo", default="")
    t.add_argument("--fuente", choices=["openverse", "devcake", "fetch_cat"], default="openverse")
    t.add_argument("--por-consulta", type=int, default=24); t.set_defaults(f=cmd_traer)

    h = s.add_parser("hoja"); h.add_argument("ids", nargs="*"); h.add_argument("--ultimas", type=int)
    h.add_argument("--etiquetas"); h.add_argument("--max", type=int, default=30); h.add_argument("--titulo")
    h.set_defaults(f=cmd_hoja)

    r = s.add_parser("recorte"); r.add_argument("id"); r.add_argument("png"); r.set_defaults(f=cmd_recorte)
    u = s.add_parser("usar"); u.add_argument("pieza"); u.add_argument("ids", nargs="+"); u.set_defaults(f=cmd_usar)
    e = s.add_parser("etiquetar"); e.add_argument("id"); e.add_argument("cambios", nargs="+"); e.set_defaults(f=cmd_etiquetar)
    d = s.add_parser("descartar"); d.add_argument("ids", nargs="+"); d.add_argument("--motivo"); d.set_defaults(f=cmd_descartar)
    v = s.add_parser("ver"); v.add_argument("id"); v.set_defaults(f=cmd_ver)
    s.add_parser("resumen").set_defaults(f=cmd_resumen)

    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
