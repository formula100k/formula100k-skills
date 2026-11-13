#!/usr/bin/env python3
"""Edición Girlie · monta el estilo nativo de TikTok «amiga que te cuenta» + la capa de chistes y series sobre un video ya cortado.

Dos modos:

  hablado  Video a cámara (ya cortado con el protocolo de corte). Pone UNA palabra a la vez,
           en Rubik 800 color crema, arriba de la cabeza, y las «ventanitas» del plan
           (recortes sin fondo, capturas de perfil, clips de TikTok) ancladas a una palabra.

      uv run --with pillow python3 edicion_girlie.py hablado corte.mp4 --plan plan.json --out final.mp4
          [--mayus] [--palabras palabras.json] [--y 465] [--tam 80] [--sin-ventanitas]

  vlog     Uno o varios clips (se pegan en orden) con el texto nativo de TikTok fijo arriba
           (emoji + 1–3 líneas blancas) y, si quieres, rótulos chicos de hora/lugar.

      uv run --with pillow python3 edicion_girlie.py vlog clip1.mov clip2.mov --texto "..." --emojis "😭🥹"
          --out final.mp4 [--max 3.0] [--rotulo "0-2.5|5:00 am|Primer día en Londres"]

Todo se dibuja con Pillow y se pega con ffmpeg (sin libass ni drawtext). 0 créditos.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

K = Path(__file__).resolve().parent.parent
FUENTES = K / "fuentes"
W, H, FPS = 1080, 1920, 30
CREMA = (253, 244, 174, 255)          # color medido en la referencia (#FDF4AE)
EMOJI_TTC = "/System/Library/Fonts/Apple Color Emoji.ttc"
MODELOS = [
    Path.home() / ".cache/hyperframes/whisper/models/ggml-large-v3.bin",
    Path.home() / ".cache/whisper-cpp/ggml-large-v3.bin",
    Path.home() / ".cache/whisper-cpp/ggml-small.bin",
]


def sh(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        sys.exit(f"Falló: {' '.join(map(str, cmd))[:300]}\n{r.stderr[-1500:]}")
    return r.stdout


def duracion(p):
    return float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]).strip())


def fuente(nombre, tam, ejes=None):
    f = ImageFont.truetype(str(FUENTES / nombre), tam)
    if ejes:
        try:
            f.set_variation_by_axes(ejes)
        except Exception:
            pass
    return f


def rubik(tam):
    return fuente("Rubik[wght].ttf", tam, [800])


def tiktok_sans(tam, peso=600):
    # ejes: opsz, wdth, wght, slnt
    return fuente("TikTokSans[opsz,slnt,wdth,wght].ttf", tam, [36, 100, peso, 0])


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9ñ]", "", "".join(c for c in s if unicodedata.category(c) != "Mn"))


# ───────────────────────── palabras (whisper, una por segmento) ─────────────────────────
def transcribir(video, tmp):
    modelo = next((m for m in MODELOS if m.exists()), None)
    if not modelo:
        sys.exit("No encontré un modelo de whisper.cpp (ggml-large-v3.bin o ggml-small.bin).")
    wav = tmp / "voz.wav"
    sh(["ffmpeg", "-v", "error", "-y", "-i", str(video), "-ar", "16000", "-ac", "1", str(wav)])
    sh(["whisper-cli", "-m", str(modelo), "-l", "es", "-ml", "1", "-sow", "-oj", "-of", str(tmp / "voz"), "-np", "-f", str(wav)])
    d = json.load(open(tmp / "voz.json"))
    out = []
    for s in d["transcription"]:
        t = s["text"].strip()
        if not t:
            continue
        out.append({"w": t, "a": s["offsets"]["from"] / 1000, "b": s["offsets"]["to"] / 1000})
    return out


def limpiar_palabras(pal):
    """Quita signos, une números sueltos («9 a 5» queda como viene) y descarta vacíos."""
    out = []
    for p in pal:
        w = re.sub(r"[¿?¡!.,;:\"“”«»…()\[\]]", "", p["w"]).strip()
        if not w:
            continue
        out.append({**p, "w": w})
    return out


# ───────────────────────── capas ─────────────────────────
def capa_palabra(lienzo, palabra, y_centro, tam, mayus):
    texto = palabra.upper() if mayus else palabra
    f = rubik(tam)
    d = ImageDraw.Draw(lienzo)
    # que nunca se salga del ancho: achica si hace falta
    while d.textlength(texto, font=f) > W - 120 and tam > 40:
        tam -= 4
        f = rubik(tam)
    caja = d.textbbox((0, 0), texto, font=f, anchor="mm")
    x, y = W // 2, y_centro
    # sombra suave apenas visible (la referencia la tiene; nada de brillo ni contorno)
    sombra = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sombra).text((x, y + 4), texto, font=f, fill=(40, 25, 10, 90), anchor="mm")
    sombra = sombra.filter(ImageFilter.GaussianBlur(5))
    lienzo.alpha_composite(sombra)
    ImageDraw.Draw(lienzo).text((x, y), texto, font=f, fill=CREMA, anchor="mm")
    return caja


def esquinas(img, r):
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], r, fill=255)
    img = img.convert("RGBA")
    img.putalpha(Image.composite(img.getchannel("A"), Image.new("L", img.size, 0), m))
    return img


POS_X = {"izq": 0.27, "centro": 0.5, "der": 0.73}


def caja_ventanita(v, tam_src):
    """Devuelve (ancho, alto, x, y) en el lienzo 1080x1920 según tipo y posición."""
    tipo, pos = v.get("tipo", "captura"), v.get("pos", "centro")
    sw, sh_ = tam_src
    if tipo == "meme":
        # meme / imagen de chiste: chica, quieta, puede ir arriba a un costado de la cabeza 
        ancho = int(W * v.get("ancho", 0.40))
        alto = int(sh_ * ancho / sw)
        cx = int(W * POS_X.get(pos, 0.27))
        x = min(max(cx - ancho // 2, 20), W - ancho - 20)
        y = min(max(int(H * v.get("y", 0.30)) - alto // 2, 60), H - alto - 140)
        return ancho, alto, x, y
    if tipo == "recorte":
        # persona u objeto sin fondo: sale desde el borde de abajo, alto ~45 % del cuadro
        alto = int(H * v.get("alto", 0.45))
        ancho = int(sw * alto / sh_)
        if ancho > W * 0.62:
            ancho = int(W * 0.62)
            alto = int(sh_ * ancho / sw)
        cx = int(W * POS_X.get(pos, 0.5))
        x = min(max(cx - ancho // 2, 0), W - ancho)
        return ancho, alto, x, H - alto
    # captura o clip: tarjeta plana sobre el torso, sin borde, sin tapar la cara ni la palabra
    ancho = int(W * v.get("ancho", 0.45 if tipo == "captura" else 0.42))
    alto = int(sh_ * ancho / sw)
    alto = min(alto, int(H * 0.40))
    ancho = int(sw * alto / sh_) if alto == int(H * 0.40) else ancho
    cx = int(W * POS_X.get(pos, 0.5))
    x = min(max(cx - ancho // 2, 30), W - ancho - 30)
    y_centro = int(H * v.get("y", 0.70))
    y = min(max(y_centro - alto // 2, 620), H - alto - 140)
    return ancho, alto, x, y


def anclar_ventanitas(plan, palabras, total):
    out = []
    usadas = {}
    for i, v in enumerate(plan.get("ventanitas", [])):
        if "desde" in v:
            a = float(v["desde"])
        else:
            clave = norm(v["palabra"])
            n = v.get("ocurrencia", 1)
            hits = [p for p in palabras if norm(p["w"]) == clave or (len(clave) > 4 and clave in norm(p["w"]))]
            if len(hits) < n:
                print(f"⚠️  ventanita {i+1}: no encontré «{v['palabra']}» (ocurrencia {n}); la salto")
                continue
            a = hits[n - 1]["a"]
        b = min(a + float(v.get("dur", 2.5)), total)
        out.append({**v, "id": i, "a": a, "b": b})
        usadas[i] = (a, b)
    return out


# ───────────────────────── capa creativa ─────────────────────────
CARA = []   # centros de cara vistos por Vision (para zooms y notas)
MANO = "/System/Library/Fonts/Supplemental/Bradley Hand Bold.ttf"


def centro_cara():
    if not CARA:
        return W / 2, H * 0.38
    xs, ys = sorted(c[0] for c in CARA), sorted(c[1] for c in CARA)
    return xs[len(xs) // 2], ys[len(ys) // 2]


def momento(item, palabras, total, etiqueta):
    """Ancla cualquier elemento a una palabra (o a «desde» en s). Devuelve (a, b) o None."""
    if "desde" in item:
        a = float(item["desde"])
    else:
        clave = norm(item["palabra"])
        n = item.get("ocurrencia", 1)
        hits = [p for p in palabras if norm(p["w"]) == clave or (len(clave) > 4 and clave in norm(p["w"]))]
        if len(hits) < n:
            print(f"⚠️  {etiqueta}: no encontré «{item['palabra']}» (ocurrencia {n}); lo salto")
            return None
        a = hits[n - 1]["a"]
    if "hasta" in item:
        return a, min(float(item["hasta"]), total)
    return a, min(a + float(item.get("dur", 1.5)), total)


def capa_nota(lz, texto, lado, y_palabra_):
    """Comentario escrito a mano junto a la cabeza («hola colas :)», «¿quién fue?»). Blanco, chico, apenas inclinado."""
    f = ImageFont.truetype(MANO, 76)
    d = ImageDraw.Draw(lz)
    bb = d.textbbox((0, 0), texto, font=f)
    tw, th = bb[2] - bb[0] + 30, bb[3] - bb[1] + 30
    im = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    di = ImageDraw.Draw(im)
    di.text((15, 15), texto, font=f, fill=(255, 255, 255, 255), stroke_width=3, stroke_fill=(30, 20, 20, 255))
    im = im.rotate(8 if lado == "izq" else -8, expand=True, resample=Image.BICUBIC)
    cx, _ = centro_cara()
    _, cy = centro_cara()
    x = int(cx - 250 - im.width) if lado == "izq" else int(cx + 250)
    x = min(max(x, 30), W - im.width - 30)
    y = int(cy - 120 - im.height / 2)
    lz.alpha_composite(im, (x, y))


def capa_vineta():
    # degradado radial simple
    g = Image.radial_gradient("L").resize((W, H))            # 0 al centro → 255 en el borde
    a = g.point(lambda v: int(max(0, v - 120) * 1.4))
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    im.putalpha(a.point(lambda v: min(v, 190)))
    return im


def capa_brillos(semilla=3):
    import random
    r = random.Random(semilla)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bok = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(bok)
    for _ in range(6):          # círculos de luz grandes y suaves arriba
        x, y, rad = r.randint(0, W), r.randint(0, int(H * 0.35)), r.randint(70, 170)
        d.ellipse([x - rad, y - rad, x + rad, y + rad], outline=(255, 255, 255, 70), width=10)
    im.alpha_composite(bok.filter(ImageFilter.GaussianBlur(6)))
    d = ImageDraw.Draw(im)
    for _ in range(5):          # destellos de 4 puntas
        x, y, t = r.randint(60, W - 60), r.randint(40, int(H * 0.4)), r.randint(18, 40)
        d.polygon([(x, y - t), (x + t * .18, y - t * .18), (x + t, y), (x + t * .18, y + t * .18),
                   (x, y + t), (x - t * .18, y + t * .18), (x - t, y), (x - t * .18, y - t * .18)], fill=(255, 255, 255, 235))
    return im


def capa_garabatos(semilla=5, colores=((120, 230, 90), (250, 214, 60), (90, 140, 255))):
    """Estrellas dibujadas a mano alrededor (nunca sobre la cara)."""
    import math, random
    r = random.Random(semilla)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    col = colores[r.randrange(len(colores))]
    cx, cy = centro_cara()
    puestos = 0
    while puestos < 5:
        x, y = r.randint(70, W - 70), r.randint(140, H - 200)
        if abs(x - cx) < 260 and abs(y - cy) < 330:
            continue
        t = r.randint(34, 58)
        pts = []
        for k in range(11):
            ang = -math.pi / 2 + k * math.pi / 5 + r.uniform(-.12, .12)
            rr = (t if k % 2 == 0 else t * .45) * r.uniform(.85, 1.15)
            pts.append((x + rr * math.cos(ang), y + rr * math.sin(ang)))
        d.line(pts, fill=col + (255,), width=7, joint="curve")
        puestos += 1
    return im


# ───────────────────────── hablado ─────────────────────────
def y_palabra(video, tmp, total):
    """Pone la palabra arriba de la cabeza, como la referencia. Mira la cara en 5 cuadros (Vision de macOS)."""
    tops = []
    for i in range(5):
        f = tmp / f"cara{i}.png"
        t = total * (0.15 + 0.17 * i)
        sh(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", str(video), "-frames:v", "1", "-vf",
            f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}", str(f)])
        r = subprocess.run(["swift", str(Path(__file__).parent / "cara.swift"), str(f)], capture_output=True, text=True)
        partes = r.stdout.split()
        if len(partes) == 4:
            x, y, w, h = map(float, partes)
            tops.append(y - 0.55 * h)          # coronilla aprox: el pelo sube ~media cara sobre la caja
            CARA.append((x + w / 2, y + h / 2))
    if not tops:
        print("· no vi cara: palabra en y=465 (la de la referencia)")
        return 465
    corona = sorted(tops)[len(tops) // 2]
    y = int(min(max(corona - 75, 270), 600))
    if corona - 75 < 270:
        print(f"⚠️  la cabeza llega muy arriba (coronilla ≈ {corona:.0f}px): la palabra queda en y=270 y puede rozar el pelo."
              " Para el estilo de la referencia, graba con la cámara un poco más lejos (aire sobre la cabeza).")
    print(f"· palabra centrada en y={y} (coronilla ≈ {corona:.0f}px)")
    return y


def hablado(args):
    video = Path(args.video).resolve()
    plan = json.load(open(args.plan)) if args.plan else {}
    tmp = Path(tempfile.mkdtemp(prefix="edtk_"))
    total = duracion(video)

    if args.palabras:
        palabras = json.load(open(args.palabras))
    else:
        print("· transcribiendo palabra por palabra…")
        palabras = transcribir(video, tmp)
        json.dump(palabras, open(Path(args.out).with_suffix(".palabras.json"), "w"), ensure_ascii=False, indent=1)
    palabras = limpiar_palabras(palabras)
    corr = {norm(k): v for k, v in plan.get("corregir", {}).items()}
    for p in palabras:
        if norm(p["w"]) in corr:
            p["w"] = corr[norm(p["w"])]

    # cada palabra vive desde que empieza hasta que empieza la siguiente (sin huecos), salvo pausas largas
    for i, p in enumerate(palabras):
        sig = palabras[i + 1]["a"] if i + 1 < len(palabras) else total
        p["fin"] = sig if sig - p["b"] < 0.6 else p["b"] + 0.15

    args.y = y_palabra(video, tmp, total) if str(args.y) == "auto" else int(args.y)

    vents = [] if args.sin_ventanitas else anclar_ventanitas(plan, palabras, total)
    base = Path(args.plan).resolve().parent if args.plan else video.parent
    imgs, clips = {}, []
    for v in vents:
        src = (base / v["archivo"]).resolve()
        if not src.exists():
            sys.exit(f"No existe la ventanita: {src}")
        if v.get("tipo") == "clip":
            iw, ih = map(int, sh(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                  "stream=width,height", "-of", "csv=p=0", str(src)]).strip().split(","))
            w_, h_, x, y = caja_ventanita(v, (iw, ih))
            clips.append({**v, "src": src, "w": w_ - w_ % 2, "h": h_ - h_ % 2, "x": x, "y": y})
        else:
            im = Image.open(src).convert("RGBA")
            w_, h_, x, y = caja_ventanita(v, im.size)
            im = im.resize((w_, h_), Image.LANCZOS)
            if v.get("tipo", "captura") in ("captura", "meme") and not v.get("sin_esquinas"):
                im = esquinas(im, 18 if v.get("tipo", "captura") == "captura" else 10)
            imgs[v["id"]] = (im, x, y)

    # ── capa creativa: sello de serie, notas a mano, efectos de capa, zooms y blanco y negro
    sello = None
    if plan.get("sello"):
        sl = plan["sello"]
        im = Image.open((base / sl["archivo"]).resolve()).convert("RGBA")
        an = int(W * sl.get("ancho", 0.62))
        im = im.resize((an, int(im.height * an / im.width)), Image.LANCZOS)
        y_s = int(H * sl.get("y", 0.05))
        sello = (im, (W - an) // 2 if sl.get("pos", "centro") == "centro" else (40 if sl["pos"] == "izq" else W - an - 40), y_s)
        tramos_sello = [(float(sl.get("desde", 0)), min(float(sl.get("hasta", 6)), total))]
        if sl.get("al_final"):
            tramos_sello.append((max(total - float(sl["al_final"]), 0), total))
    else:
        tramos_sello = []
    notas = []
    for i, n in enumerate(plan.get("notas", [])):
        m = momento(n, palabras, total, f"nota {i+1}")
        if m:
            notas.append({**n, "a": m[0], "b": m[1], "nid": i})
    capas_fx, base_fx = [], []
    for i, e in enumerate(plan.get("efectos", [])):
        m = momento(e, palabras, total, f"efecto {i+1}")
        if not m:
            continue
        (base_fx if e["tipo"] in ("bn",) else capas_fx).append({**e, "a": m[0], "b": m[1], "eid": i})
    for i, z in enumerate(plan.get("zooms", [])):
        m = momento({**z, "dur": z.get("dur", 1.0)}, palabras, total, f"zoom {i+1}")
        if m:
            base_fx.append({**z, "tipo": "zoom", "a": m[0], "b": m[1]})
    fx_img = {}
    for e in capas_fx:
        if e["tipo"] == "vineta":
            fx_img[e["eid"]] = capa_vineta()
        elif e["tipo"] == "brillos":
            fx_img[e["eid"]] = capa_brillos(e.get("semilla", 3 + e["eid"]))
        elif e["tipo"] == "garabatos":
            fx_img[e["eid"]] = capa_garabatos(e.get("semilla", 5 + e["eid"]))
        else:
            print(f"⚠️  efecto «{e['tipo']}» no existe (bn · vineta · brillos · garabatos)")

    # cortes de estado: cada vez que cambia la palabra o entra/sale una ventanita fija
    gancho = Image.open(args.gancho).convert("RGBA").resize((W, H)) if args.gancho else None
    marcas = {0.0, total} | ({args.gancho_hasta} if gancho else set())
    for p in palabras:
        marcas |= {p["a"], p["fin"]}
    for v in vents:
        if v["id"] in imgs:
            marcas |= {v["a"], v["b"]}
    for t in tramos_sello + [(n["a"], n["b"]) for n in notas] + [(e["a"], e["b"]) for e in capas_fx]:
        marcas |= set(t)
    marcas = sorted(m for m in marcas if 0 <= m <= total)

    cache, lista = {}, []
    for a, b in zip(marcas, marcas[1:]):
        if b - a < 1 / FPS / 2:
            continue
        mid = (a + b) / 2
        w = next((p["w"] for p in palabras if p["a"] <= mid < p["fin"]), "")
        act = tuple(v["id"] for v in vents if v["id"] in imgs and v["a"] <= mid < v["b"])
        con_gancho = bool(gancho) and mid < args.gancho_hasta
        if con_gancho:
            w = ""
        fx_act = tuple(e["eid"] for e in capas_fx if e["eid"] in fx_img and e["a"] <= mid < e["b"])
        n_act = tuple(n["nid"] for n in notas if n["a"] <= mid < n["b"])
        s_act = bool(sello) and not con_gancho and any(a_ <= mid < b_ for a_, b_ in tramos_sello)
        if s_act:
            w = ""          # el sello ocupa el lugar de la palabra (es el título de la serie)
        clave = (w, act, con_gancho, fx_act, n_act, s_act)
        if clave not in cache:
            lz = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            for eid in fx_act:
                lz.alpha_composite(fx_img[eid])
            if s_act:
                lz.alpha_composite(sello[0], (sello[1], sello[2]))
            for nid in n_act:
                n = next(x for x in notas if x["nid"] == nid)
                capa_nota(lz, n["texto"], n.get("lado", "der"), args.y)
            for vid in act:
                im, x, y = imgs[vid]
                lz.alpha_composite(im, (x, y))
            if con_gancho:
                lz.alpha_composite(gancho)
            if w and not args.sin_subs:
                capa_palabra(lz, w, args.y, args.tam, args.mayus)
            f = tmp / f"e{len(cache):05d}.png"
            lz.save(f)
            cache[clave] = f
        lista.append((cache[clave], b - a))
    with open(tmp / "capa.txt", "w") as fh:
        for f, d in lista:
            fh.write(f"file '{f}'\nduration {d:.4f}\n")
        fh.write(f"file '{lista[-1][0]}'\n")
    print(f"· {len(lista)} cambios de capa, {len(cache)} cuadros únicos, {len(vents)} ventanitas, "
          f"{len(notas)} notas, {len(capas_fx) + len(base_fx)} efectos/zooms" + (", sello de serie" if sello else ""))

    # ffmpeg: base 1080x1920@30 → clips → capa de palabra/capturas
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(video), "-f", "concat", "-safe", "0", "-i", str(tmp / "capa.txt")]
    for c in clips:
        cmd += ["-ss", str(c.get("inicio_clip", 0)), "-t", f"{c['b'] - c['a']:.3f}", "-i", str(c["src"])]
    fc = [f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},setsar=1[v0]"]
    ult = "v0"
    if base_fx:
        fc.append(f"[v0]split={len(base_fx) + 1}[vb]" + "".join(f"[fx{i}]" for i in range(len(base_fx))))
        ult = "vb"
        cx, cy = centro_cara()
        for i, e in enumerate(base_fx):
            if e["tipo"] == "zoom":   # punch-in SECO a la cara (sin animación): recorta y agranda
                k = float(e.get("escala", 1.3))
                cw, ch = int(W / k) // 2 * 2, int(H / k) // 2 * 2
                x0 = int(min(max(cx - cw / 2, 0), W - cw)); y0 = int(min(max(cy - ch * 0.42, 0), H - ch))
                fc.append(f"[fx{i}]crop={cw}:{ch}:{x0}:{y0},scale={W}:{H},setsar=1[fz{i}]")
            else:                     # bn: blanco y negro en seco (el «ya me lo imaginaba»)
                fc.append(f"[fx{i}]hue=s=0[fz{i}]")
            fc.append(f"[{ult}][fz{i}]overlay=0:0:enable='between(t,{e['a']:.3f},{e['b']:.3f})'[b{i}]")
            ult = f"b{i}"
    for i, c in enumerate(clips):
        n = i + 2
        fc.append(f"[{n}:v]scale={c['w']}:{c['h']}:force_original_aspect_ratio=increase,crop={c['w']}:{c['h']},"
                  f"fps={FPS},setpts=PTS-STARTPTS+{c['a']:.3f}/TB[c{i}]")
        fc.append(f"[{ult}][c{i}]overlay={c['x']}:{c['y']}:eof_action=pass:enable='between(t,{c['a']:.3f},{c['b']:.3f})'[k{i}]")
        ult = f"k{i}"
    fc.append(f"[1:v]fps={FPS},format=rgba[capa]")
    fc.append(f"[{ult}][capa]overlay=0:0:format=auto:shortest=0,format=yuv420p[out]")
    cmd += ["-filter_complex", ";".join(fc), "-map", "[out]", "-map", "0:a?", "-t", f"{total:.3f}",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(args.out)]
    print("· renderizando…")
    sh(cmd)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"✅ {args.out}  ({total:.1f} s)")


# ───────────────────────── vlog ─────────────────────────
def emoji_img(e, alto):
    try:
        f = ImageFont.truetype(EMOJI_TTC, 160)
    except Exception:
        return None
    im = Image.new("RGBA", (220 * max(1, len(e)), 200), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((0, 0), e, font=f, embedded_color=True)
    bb = im.getbbox()
    if not bb:
        return None
    im = im.crop(bb)
    return im.resize((int(im.width * alto / im.height), alto), Image.LANCZOS)


def envolver(texto, f, ancho_max):
    d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    lineas, cur = [], ""
    for pal in texto.split():
        prueba = (cur + " " + pal).strip()
        if d.textlength(prueba, font=f) <= ancho_max or not cur:
            cur = prueba
        else:
            lineas.append(cur)
            cur = pal
    if cur:
        lineas.append(cur)
    return lineas


def texto_nativo(lz, texto, emojis, y_top=255, tam=44, ancho_max=600, color=(255, 255, 255, 255)):
    """Imita el texto nativo de TikTok: TikTok Sans semibold, blanco, contorno oscuro finito, centrado."""
    f = tiktok_sans(tam, 600)
    y = y_top
    if emojis:
        em = emoji_img(emojis, int(tam * 1.05))
        if em:
            lz.alpha_composite(em, ((W - em.width) // 2, y))
            y += em.height + 8
    capa = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    for ln in envolver(texto, f, ancho_max):
        d.text((W // 2, y), ln, font=f, fill=color, anchor="ma", stroke_width=2, stroke_fill=(0, 0, 0, 110))
        y += int(tam * 1.3)
    lz.alpha_composite(capa)
    return y


def vlog(args):
    tmp = Path(tempfile.mkdtemp(prefix="edtk_"))
    partes = []
    for i, c in enumerate(args.clips):
        d = duracion(c)
        t = min(d, args.max) if args.max else d
        ini = max(0.0, (d - t) / 2) if args.max and d > args.max else 0.0
        o = tmp / f"p{i:03d}.mp4"
        sh(["ffmpeg", "-v", "error", "-y", "-ss", f"{ini:.3f}", "-t", f"{t:.3f}", "-i", str(c),
            "-f", "lavfi", "-t", f"{t:.3f}", "-i", "anullsrc=r=48000:cl=stereo",
            "-filter_complex", f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},setsar=1[v]",
            "-map", "[v]", "-map", "0:a?", "-map", "1:a", "-shortest",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-c:a", "aac", "-ar", "48000", "-ac", "2", str(o)])
        # si el clip tenía audio, quedan 2 pistas: nos quedamos con la primera
        partes.append(o)
    with open(tmp / "lista.txt", "w") as fh:
        for p in partes:
            fh.write(f"file '{p}'\n")
    pegado = tmp / "pegado.mp4"
    sh(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(tmp / "lista.txt"),
        "-map", "0:v", "-map", "0:a:0", "-c", "copy", str(pegado)])
    total = duracion(pegado)

    fijo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if args.texto:
        texto_nativo(fijo, args.texto, args.emojis)
    fijo.save(tmp / "fijo.png")
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(pegado), "-loop", "1", "-t", f"{total:.3f}", "-i", str(tmp / "fijo.png")]
    fc, ult = ["[0:v][1:v]overlay=0:0[f0]"], "f0"
    for i, r in enumerate(args.rotulo or []):
        rango, *lineas = r.split("|")
        a, b = (float(x) for x in rango.split("-"))
        lz = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        f = tiktok_sans(38, 500)
        d = ImageDraw.Draw(lz)
        y = int(H * 0.58)
        for ln in lineas:
            d.text((W // 2, y), ln, font=f, fill=CREMA, anchor="ma", stroke_width=2, stroke_fill=(0, 0, 0, 120))
            y += 48
        p = tmp / f"r{i}.png"
        lz.save(p)
        cmd += ["-loop", "1", "-t", f"{total:.3f}", "-i", str(p)]
        fc.append(f"[{ult}][{i+2}:v]overlay=0:0:enable='between(t,{a},{b})'[f{i+1}]")
        ult = f"f{i+1}"
    fc.append(f"[{ult}]format=yuv420p[out]")
    cmd += ["-filter_complex", ";".join(fc), "-map", "[out]", "-map", "0:a", "-t", f"{total:.3f}",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart", str(args.out)]
    sh(cmd)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"✅ {args.out}  ({total:.1f} s, {len(partes)} tomas)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="modo", required=True)
    h = sub.add_parser("hablado")
    h.add_argument("video")
    h.add_argument("--plan")
    h.add_argument("--out", required=True)
    h.add_argument("--palabras", help="JSON de palabras ya corregido (salta whisper)")
    h.add_argument("--mayus", action="store_true", help="palabras en MAYÚSCULA (variante «tips»)")
    h.add_argument("--y", default="auto", help="centro vertical de la palabra; «auto» = arriba de la cabeza (ref: 465 de 1920)")
    h.add_argument("--tam", type=int, default=80)
    h.add_argument("--sin-ventanitas", action="store_true")
    h.add_argument("--gancho", help="PNG transparente 1080x1920 con tu gancho de texto; mientras está, no hay palabra")
    h.add_argument("--gancho-hasta", type=float, default=2.0, help="segundos que dura el gancho")
    h.add_argument("--sin-subs", action="store_true")
    v = sub.add_parser("vlog")
    v.add_argument("clips", nargs="+")
    v.add_argument("--texto")
    v.add_argument("--emojis", default="")
    v.add_argument("--max", type=float, default=0, help="recorta cada toma a N s (centro de la toma)")
    v.add_argument("--rotulo", action="append", help='"desde-hasta|línea 1|línea 2"')
    v.add_argument("--out", required=True)
    a = ap.parse_args()
    hablado(a) if a.modo == "hablado" else vlog(a)


if __name__ == "__main__":
    main()
