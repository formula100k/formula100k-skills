# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["opencv-python-headless", "numpy<2"]
# ///
# efectos.py <proyecto>  → pre-renderiza la capa de TU VIDEO de cada escena que lleva "efecto" en fuente/plano.json.
# Deja fuente/efx/<i>.mp4 (color) y fuente/efx/<i>_a.mp4 (alfa en grises, blanco = se ve). componer.py los pone en su lugar.
# Lo corre «node scripts/video.mjs render» solo (con uv: opencv + numpy). Los tiempos ("en", "pasos") van en segundos del video cortado, como desde/hasta.
#
# Efectos que mueven tu video (el resto de los 20 son piezas del lienzo, ver referencia/efectos.md):
#   acercamiento  {"en": s, "escala": 1.35, "dur": .12, "vuelve": s}     acercamiento seco a tu cara (Snap Zoom)
#   zoom-digital  {"pasos": [[s, 1.6], [s, 2.6]]}                        saltos de zoom de cámara; el lienzo pinta REC y el 2.6× (Digital Zoom)
#   zoom-atraves  {"dur": .45, "escala": 3.2}                            al final de la escena entra hasta desenfocar y corta a la siguiente (Zoom Through Cut)
#   portal        {"x": 230, "y": 560, "r": 150, "en": s, "dur": .5}     un círculo con tu cara en la esquina y la cámara vuela adentro (Zoom Portal)
#   vertigo       {"desde": 1.3, "hasta": 1.0}                           tú quieta y el fondo se aleja (Dolly Zoom; necesita mate.mp4)
#   polaroid      {"en": s, "escala": .7, "giro": -5, "cy": .5, "corte": .3}   tu video se vuelve una foto (de «corte» para abajo) y tu cabeza SE SALE del marco (Frame Escape; mate)
#   romper        {"en": s, "dur": .6, "x": .5, "y": .45}                el cuadro se raja y estalla en vidrios; debajo aparece el lienzo (Frame Break)
#   papel         {"borde": 16}                                          tú recortada con borde blanco de papel, sobre el fondo del lienzo (Paper Cutout; mate)
#   estudio       {"en": s, "oscuro": .22}                               tú a oscuras y se prenden las luces cuando dices la palabra (Studio Reveal; mate)
# "capa": "debajo" (bajo los gráficos: el lienzo pinta hueco verde) o "encima" (sobre los gráficos). Cada tipo trae la suya.
import json, os, subprocess, sys, math
import numpy as np, cv2

P = sys.argv[1]; F = os.path.join(P, "fuente")
plano = json.load(open(os.path.join(F, "plano.json")))
W, H = (1920, 1080) if plano.get("formato") == "16:9" else (1080, 1920)
CARA = plano.get("cara", [0.5, 0.35]); FPS = 30
CAPA = {"acercamiento": "debajo", "zoom-digital": "debajo", "zoom-atraves": "debajo", "portal": "debajo", "vertigo": "debajo",
        "polaroid": "encima", "romper": "encima", "papel": "encima", "estudio": "encima"}
NECESITA_MATE = {"vertigo", "polaroid", "papel", "estudio"}
EXTRA = None   # complemento «auto-edit-effects» (al lado de esta skill): puntos, ventana y look; le pasa los tipos que este archivo no conoce
_ruta_extra = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "auto-edit-effects", "video")
if os.path.exists(os.path.join(_ruta_extra, "efectos_extra.py")):
    sys.path.insert(0, _ruta_extra); import efectos_extra as EXTRA
    CAPA.update(EXTRA.CAPA); NECESITA_MATE |= EXTRA.NECESITA_MATE

def tamano(f):
    v = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_side_data=rotation", "-of", "json", f]))["streams"][0]
    giro = next((d["rotation"] for d in v.get("side_data_list", []) if "rotation" in d), 0)
    return [v["height"], v["width"]] if abs(int(giro)) % 180 == 90 else [v["width"], v["height"]]
def cover(src):
    e = max(W / src[0], H / src[1]); sw, sh = round(src[0] * e / 2) * 2, round(src[1] * e / 2) * 2
    return f"scale={sw}:{sh},crop={W}:{H}:{int((sw - W) * CARA[0])}:{int((sh - H) * CARA[1])}"

def leer(ruta, desde, n, gris=False):   # n cuadros de W×H desde «desde» (cubre como componer.py)
    c = 1 if gris else 3
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{desde:.3f}", "-i", ruta, "-vf", f"{cover(tamano(ruta))},fps={FPS}",
                          "-frames:v", str(n), "-f", "rawvideo", "-pix_fmt", "gray" if gris else "bgr24", "-"], capture_output=True, check=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, c) if raw else np.zeros((0, H, W, c), np.uint8)
    fr = [f[..., 0] if gris else f for f in fr]
    while len(fr) < n: fr.append(fr[-1] if fr else np.zeros((H, W) if gris else (H, W, 3), np.uint8))
    return fr

class Salida:
    def __init__(self, i):
        os.makedirs(os.path.join(F, "efx"), exist_ok=True)
        mk = lambda fmt, out, crf: subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", fmt, "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                                                      "-c:v", "libx264", "-crf", str(crf), "-preset", "fast", "-pix_fmt", "yuv420p", os.path.join(F, "efx", out)], stdin=subprocess.PIPE)
        self.c, self.a = mk("bgr24", f"{i}.mp4", 14), mk("gray", f"{i}_a.mp4", 10)
    def poner(self, img, alfa=None):
        self.c.stdin.write(np.ascontiguousarray(img, np.uint8).tobytes())
        self.a.stdin.write(np.ascontiguousarray(np.full((H, W), 255, np.uint8) if alfa is None else np.clip(alfa * 255, 0, 255).astype(np.uint8)).tobytes())
    def cerrar(self):
        for p in (self.c, self.a): p.stdin.close(); p.wait()

clamp = lambda x, a=0., b=1.: max(a, min(b, x))
aterriza = lambda t: 1 - (1 - clamp(t)) ** 5               # sale y frena seco, sin rebote
suave = lambda t: (lambda u: 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2)(clamp(t))
def escala_en(img, s, cx, cy, interp=cv2.INTER_LINEAR, borde=cv2.BORDER_REFLECT):
    M = np.float32([[s, 0, cx * (1 - s)], [0, s, cy * (1 - s)]])
    return cv2.warpAffine(img, M, (W, H), flags=interp, borderMode=borde)
def mezclar(fondo, frente, a):   # a en 0..1 (H×W)
    a = a[..., None]; return (frente * a + fondo * (1 - a)).astype(np.uint8)
CX, CY = W * CARA[0], H * CARA[1]

def efecto(i, e, ef):
    tipo = ef["tipo"]; d0 = e["desde"]; T = e["hasta"] - d0; n = max(1, round(T * FPS))
    fr = leer(os.path.join(F, "cortado.mp4"), d0, n)
    mt = None
    if tipo in NECESITA_MATE:
        ruta = os.path.join(F, "mate.mp4")
        if not os.path.exists(ruta): sys.exit(f"El efecto «{tipo}» necesita tu recorte: corre antes «node scripts/video.mjs mate».")
        mt = [m.astype(np.float32) / 255 for m in leer(ruta, d0, n, gris=True)]
    out = Salida(i)
    rel = lambda s, por_def: (s - d0) if s is not None else por_def   # «en» viene en segundos del video
    for k in range(n):
        t = k / FPS; img = fr[k]; m = mt[k] if mt is not None else None
        if tipo == "acercamiento":
            en, dur, s1 = rel(ef.get("en"), 0), ef.get("dur", .12), ef.get("escala", 1.35)
            vu = rel(ef.get("vuelve"), 1e9)
            s = 1 + (s1 - 1) * aterriza((t - en) / dur) if t < vu else 1 + (s1 - 1) * (1 - aterriza((t - vu) / dur))
            out.poner(escala_en(img, s, CX, CY))
        elif tipo == "zoom-digital":
            s, prev = 1., 1.
            for (ts, sv) in ef.get("pasos", [[d0 + .3, 1.6], [d0 + .9, 2.6]]):
                tl = ts - d0
                if t >= tl: s = prev + (sv - prev) * aterriza((t - tl) / .08)
                prev = sv if t >= tl else prev
            out.poner(escala_en(img, s, CX, CY))
        elif tipo == "zoom-atraves":
            dur, s1 = ef.get("dur", .45), ef.get("escala", 3.2)
            p = clamp((t - (T - dur)) / dur); s = 1 + (s1 - 1) * p ** 3
            o = escala_en(img, s, CX, CY)
            if p > 0: b = int(p ** 2 * 40) * 2 + 1; o = cv2.GaussianBlur(o, (b, b), 0)
            out.poner(o)
        elif tipo == "portal":
            x, y, r = ef.get("x", W * .21), ef.get("y", H * .29), ef.get("r", W * .14)
            en, dur = rel(ef.get("en"), T - ef.get("dur", .5)), ef.get("dur", .5)
            k0 = r / (W * .26)                              # la cara (≈ 26 % del ancho) llena el círculo
            p = suave((t - en) / dur)
            Z = 1 + 1.2 * p * p                               # el mundo se acerca al círculo (sin mover el centro: nunca deja bordes)
            mundo = escala_en(img, Z, x, y)
            q = clamp(p / .7)                                 # a los 7/10 el círculo ya está en tu cara y adentro va tu video entero
            cx, cy = x + (CX - x) * q, y + (CY - y) * q      # el círculo viaja al lugar de tu cara y crece
            ks = k0 + (1 - k0) * q                            # adentro: tu cara chica → tu video entero (identidad)
            Mi = np.float32([[ks, 0, cx - ks * CX], [0, ks, cy - ks * CY]])
            dentro = cv2.warpAffine(img, Mi, (W, H)); hay = cv2.warpAffine(np.ones((H, W), np.float32), Mi, (W, H))
            rad = min(r + p ** 2 * 2400, ks * min(CX, W - CX, CY, H - CY))   # el círculo nunca pasa el borde de tu video (sin costuras)
            mask = np.zeros((H, W), np.float32); cv2.circle(mask, (int(cx), int(cy)), int(rad), 1., -1, cv2.LINE_AA)
            f = clamp((p - .7) / .3); mask = mask + (1 - mask) * f      # el último tramo se funde a tu video entero
            o = mezclar(mundo, dentro, mask * hay)
            if p < .7: cv2.circle(o, (int(cx), int(cy)), int(rad), (26, 122, 255), max(3, int(8 * (1 - p))), cv2.LINE_AA)
            out.poner(o)
        elif tipo == "vertigo":
            s0, s1 = ef.get("desde", 1.3), ef.get("hasta", 1.0)
            sb = s0 + (s1 - s0) * suave(t / T)
            fondo = escala_en(img, sb, CX, CY); yo = escala_en(img, s0, CX, CY); a = escala_en(m, s0, CX, CY)
            out.poner(mezclar(fondo, yo, a))
        elif tipo == "polaroid":
            en = rel(ef.get("en"), 0); p = aterriza((t - en) / .35)
            s = 1 + (ef.get("escala", .7) - 1) * p; g = ef.get("giro", -5) * p
            cy = H / 2 + (H * ef.get("cy", .5) - H / 2) * p
            M = cv2.getRotationMatrix2D((W / 2, H / 2), g, s); M[1, 2] += cy - H / 2
            foto = cv2.warpAffine(img, M, (W, H)); persona = cv2.warpAffine(m, M, (W, H))
            def poli(x0, y0, x1, y1):   # rectángulo de la foto (en coordenadas de tu video) llevado a la pantalla
                q = cv2.transform(np.float32([[[x0, y0], [x1, y0], [x1, y1], [x0, y1]]]), M)[0]
                z = np.zeros((H, W), np.float32); cv2.fillConvexPoly(z, np.round(q * 4).astype(np.int32), 1., cv2.LINE_AA, 2); return z
            b = 34 * p / max(s, .01)                          # borde blanco de foto, más ancho abajo
            y0 = H * ef.get("corte", .3) * p                   # la foto empieza más abajo: tu cabeza queda fuera del marco
            rect = poli(0, y0, W, H); marco = np.maximum(poli(-b, y0 - b, W + b, H + b * 3.2), rect)
            sombra = cv2.GaussianBlur(cv2.warpAffine(marco, np.float32([[1, 0, 18], [0, 1, 26]]), (W, H)), (61, 61), 0) * .45 * p
            esc = np.clip(persona - rect, 0, 1) * (p > .5)    # tu cabeza fuera del marco
            o = np.full((H, W, 3), 255, np.float32) * marco[..., None]
            o = o * (1 - rect[..., None]) + foto * rect[..., None]
            o = o * (1 - esc[..., None]) + foto * esc[..., None]
            vis = np.maximum(marco, esc); alfa = np.maximum(vis, sombra)
            o = o * (vis / np.maximum(alfa, 1e-4))[..., None]   # donde solo hay sombra: negro translúcido
            out.poner(o.astype(np.uint8), alfa)
        elif tipo == "romper":
            out.poner(*romper(img, t, rel(ef.get("en"), T - ef.get("dur", .6)), ef.get("dur", .6), ef.get("x", .5), ef.get("y", .45)))
        elif tipo == "papel":
            b = ef.get("borde", 16); dura = (m > .5).astype(np.uint8)
            borde = cv2.dilate(dura, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * b + 1, 2 * b + 1))).astype(np.float32)
            borde = cv2.GaussianBlur(borde, (3, 3), 0)
            sombra = cv2.warpAffine(borde, np.float32([[1, 0, 14], [0, 1, 18]]), (W, H)) * .5
            o = np.full((H, W, 3), 255, np.float32) * borde[..., None]
            o = o * (1 - m[..., None]) + img * m[..., None]
            alfa = np.maximum(borde, sombra)
            o = o * (borde / np.maximum(alfa, 1e-4))[..., None]
            out.poner(o.astype(np.uint8), alfa)
        elif tipo == "estudio":
            en = rel(ef.get("en"), .5); luz = ef.get("oscuro", .22) + (1 - ef.get("oscuro", .22)) * clamp((t - en) / .15)
            out.poner(np.clip(img.astype(np.float32) * luz, 0, 255).astype(np.uint8), m)
        elif EXTRA:
            o, a = EXTRA.cuadro(tipo, ef, img, m, t, T, k, W, H, rel); out.poner(o, a)
        else:
            sys.exit(f"No conozco el efecto «{tipo}». Mira la lista arriba de scripts/efectos.py.")
    out.cerrar()
    return n

_shards = {}
def romper(img, t, en, dur, ix, iy):
    """Vidrios: triangulación con centro en el golpe; antes de «en», el cuadro entero."""
    if t < en: return img, None
    px, py = W * ix, H * iy
    if "tri" not in _shards:
        rnd = np.random.default_rng(7); pts = [(px, py)]
        for ring, cnt in ((120, 7), (300, 10), (560, 13), (900, 16), (1400, 18)):
            for j in range(cnt):
                a = 2 * math.pi * (j + rnd.random() * .6) / cnt; rr = ring * (.8 + .4 * rnd.random())
                pts.append((px + rr * math.cos(a), py + rr * math.sin(a)))
        pts += [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1), (W / 2, 0), (W / 2, H - 1), (0, H / 2), (W - 1, H / 2)]
        sub = cv2.Subdiv2D((0, 0, W, H))
        for x, y in pts: sub.insert((float(clamp(x, 0, W - 1)), float(clamp(y, 0, H - 1))))
        tris = [np.float32(tt).reshape(3, 2) for tt in sub.getTriangleList()]
        _shards["tri"] = [(tr, rnd.random() * 2 - 1, .6 + .8 * rnd.random()) for tr in tris
                          if (tr[:, 0] >= -1).all() and (tr[:, 0] <= W).all() and (tr[:, 1] >= -1).all() and (tr[:, 1] <= H).all()]
    tau = clamp((t - en) / dur); crack = .18
    o = np.zeros((H, W, 3), np.float32); a = np.zeros((H, W), np.float32)
    if tau < crack:   # primero se raja: líneas blancas finas desde el golpe
        o = img.astype(np.float32).copy(); a[:] = 1
        for tr, _, _ in _shards["tri"]:
            cv2.polylines(o, [tr.astype(np.int32)], True, (255, 255, 255), 2, cv2.LINE_AA)
        return o.astype(np.uint8), a
    u = (tau - crack) / (1 - crack)
    for tr, giro, vel in _shards["tri"]:
        c = tr.mean(0); dvec = c - (px, py); dist = np.linalg.norm(dvec) + 1; dvec /= dist
        mov = dvec * vel * (500 * u + 2400 * u * u) + np.float32([0, 900 * u * u])
        M = cv2.getRotationMatrix2D((float(c[0]), float(c[1])), giro * 160 * u, 1 - .25 * u); M[:, 2] += mov
        x0, y0 = np.floor(tr.min(0)).astype(int); x1, y1 = np.ceil(tr.max(0)).astype(int)
        mask = np.zeros((H, W), np.float32); cv2.fillConvexPoly(mask, tr.astype(np.int32), 1., cv2.LINE_AA)
        wm = cv2.warpAffine(mask, M, (W, H)); wi = cv2.warpAffine(img, M, (W, H))
        o = o * (1 - wm[..., None]) + wi * wm[..., None]; a = np.maximum(a, wm)
        if u < .9: cv2.polylines(o, [cv2.transform(tr[None], M)[0].astype(np.int32)], True, (255, 255, 255), 2, cv2.LINE_AA)
    return o.astype(np.uint8), a

hechos = 0
for i, e in enumerate(plano["escenas"]):
    ef = e.get("efecto")
    if not ef: continue
    if isinstance(ef, str): ef = {"tipo": ef}
    efecto(i, e, ef); hechos += 1
    print(f"efecto {i}: {ef['tipo']} ({ef.get('capa', CAPA.get(ef['tipo']))})", file=sys.stderr)
print(f"efectos listos: {hechos}")
