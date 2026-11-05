# efectos_extra.py — efectos de VIDEO de «Auto Edit Effects». No se corre solo: auto-edicion/scripts/efectos.py lo importa
# (si esta skill está instalada junto a auto-edicion) y le pasa los tipos que no conoce. Mismo contrato: devuelve (imagen BGR, alfa 0..1 o None).
#
#   puntos   {"dur": .5, "celda": 26, "fondo": "#141513"}   tu video entra como trama de puntos y se resuelve (la transición de los 3 reels)
#   ventana  {"de": [x, y, w, h], "aparece": s, "en": s, "dur": .3, "r": 28, "puntos": true}
#            tu video dentro de una burbuja (la del chat de marcoComando); en «en» crece a pantalla completa y frena seco
#   look     {"estilo": "bn" | "calido" | "duotono" | "documental" | "cine" | "vhs" | "grano", "de": "#…", "a": "#…", "barras": .16}
#            filtros de color del reel de Bruno Media. Sin temblor: el VHS desplaza los colores fijo, no vibra.
import math
import numpy as np, cv2

CAPA = {"puntos": "debajo", "ventana": "encima", "look": "debajo"}
NECESITA_MATE = set()

def _hex(h):
    h = h.lstrip("#"); return np.float32([int(h[4:6], 16), int(h[2:4], 16), int(h[0:2], 16)])   # BGR

_tiles = {}
def trama(img, celda, fondo):
    """Trama de puntos: cada celda es un círculo del color medio de la celda, del tamaño de su luz."""
    H, W = img.shape[:2]; c = max(2, int(celda)); h, w = math.ceil(H / c), math.ceil(W / c)
    peq = cv2.resize(img, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32)
    luz = (peq @ np.float32([.114, .587, .299])) / 255
    radio = (c / 2) * np.sqrt(np.clip(luz * 1.15, 0.06, 1))
    if (c, H, W) not in _tiles:
        yy, xx = np.mgrid[0:h * c, 0:w * c]; _tiles[c, H, W] = np.hypot((xx % c) - c / 2 + .5, (yy % c) - c / 2 + .5)[:H, :W]
    r_big = np.repeat(np.repeat(radio, c, 0), c, 1)[:H, :W]
    m = np.clip(r_big - _tiles[c, H, W] + .5, 0, 1)[..., None]
    col = np.repeat(np.repeat(peq, c, 0), c, 1)[:H, :W]
    return (col * m + fondo * (1 - m)).astype(np.uint8)

def _puntos_en(img, u, celda, fondo):   # u 0→1: de trama gruesa a imagen limpia
    if u >= 1: return img
    c = celda * (1 - u) ** 1.4 + 2
    out = trama(img, c, fondo)
    if u > .7:   # el último 30 % funde a la imagen
        a = (u - .7) / .3; out = cv2.addWeighted(img, a, out, 1 - a, 0)
    return out

def _redondeado(H, W, x, y, w, h, r):
    m = np.zeros((H, W), np.uint8); x, y, w, h, r = int(x), int(y), int(w), int(h), int(max(0, min(r, w / 2, h / 2)))
    cv2.rectangle(m, (x + r, y), (x + w - r, y + h), 255, -1); cv2.rectangle(m, (x, y + r), (x + w, y + h - r), 255, -1)
    for cx, cy in ((x + r, y + r), (x + w - r, y + r), (x + r, y + h - r), (x + w - r, y + h - r)): cv2.circle(m, (cx, cy), r, 255, -1, cv2.LINE_AA)
    return m.astype(np.float32) / 255

def _look(img, ef, k):
    est = ef.get("estilo", "bn"); f = img.astype(np.float32); H, W = img.shape[:2]
    gris = (f @ np.float32([.114, .587, .299]))[..., None]
    if est == "bn":
        out = np.clip((gris - 128) * 1.15 + 128, 0, 255).repeat(3, 2)
    elif est == "calido":
        out = f * np.float32([.86, 1.0, 1.10]) + np.float32([0, 6, 14])
    elif est in ("duotono", "documental"):
        de, a = (_hex(ef.get("de", "#1E1404")), _hex(ef.get("a", "#E9D45A"))) if est == "documental" else (_hex(ef.get("de", "#2B1055")), _hex(ef.get("a", "#FF8A5C")))
        g = np.clip((gris / 255 - .08) / .84, 0, 1); out = de + (a - de) * g
    elif est == "cine":
        out = f * np.float32([1.04, .98, .96]); out = np.clip((out - 128) * 1.08 + 128, 0, 255)
        b = int(H * ef.get("barras", .16)); out[:b] = 0; out[H - b:] = 0
    elif est == "vhs":
        out = f.copy(); d = ef.get("corrimiento", 7)
        out[..., 2] = np.roll(f[..., 2], d, 1); out[..., 0] = np.roll(f[..., 0], -d, 1)   # rojo a la derecha, azul a la izquierda (fijo)
        out = cv2.GaussianBlur(out, (0, 0), 1.1); out[::3] *= .8
        out *= np.float32([.95, 1.0, 1.06]); out += np.random.default_rng(k).normal(0, 6, (H, W, 1)).astype(np.float32)
    elif est == "grano":
        out = f + np.random.default_rng(k).normal(0, 13, (H, W, 1)).astype(np.float32)
        yy, xx = np.mgrid[0:H, 0:W]; v = 1 - .35 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 2
        out *= v[..., None].astype(np.float32)
    else:
        raise SystemExit(f"No conozco el look «{est}». Hay: bn, calido, duotono, documental, cine, vhs, grano.")
    return np.clip(out, 0, 255).astype(np.uint8)

def cuadro(tipo, ef, img, m, t, T, k, W, H, rel):
    """Un cuadro del efecto. t = segundo dentro de la escena; rel(s, por_defecto) pasa segundos del video a la escena."""
    if tipo == "puntos":
        dur = ef.get("dur", .5); return _puntos_en(img, t / dur, ef.get("celda", 26), _hex(ef.get("fondo", "#141513"))), None
    if tipo == "look":
        out = _look(img, ef, k)
        if ef.get("puntos"): out = _puntos_en(out, t / ef.get("dur_puntos", .5), 26, _hex("#141513"))
        return out, None
    if tipo == "ventana":
        x, y, w, h = ef.get("de", [60, 300, 640, 1060]); en = rel(ef.get("en"), T); dur = ef.get("dur", .3); ap = rel(ef.get("aparece"), 0)
        if t < ap: return np.zeros((H, W, 3), np.uint8), np.zeros((H, W), np.float32)   # aún no se envía el comando
        t = t - ap; en = en - ap
        u = 1 - (1 - min(1, max(0, (t - en) / dur))) ** 4
        bx, by, bw, bh = x * (1 - u), y * (1 - u), w + (W - w) * u, h + (H - h) * u; r = ef.get("r", 28) * (1 - u)
        s = max(bw / W, bh / H); sw, sh = int(W * s + 1), int(H * s + 1)
        esc = cv2.resize(img, (sw, sh), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR)
        ox, oy = int((sw - bw) / 2), int((sh - bh) * .35)
        lienzo = np.zeros((H, W, 3), np.uint8); X0, Y0 = int(bx), int(by); cw, ch = min(int(bw), W - X0), min(int(bh), H - Y0)
        lienzo[Y0:Y0 + ch, X0:X0 + cw] = esc[oy:oy + ch, ox:ox + cw]
        if ef.get("puntos", True) and t < ef.get("dur_puntos", .5):
            lienzo[Y0:Y0 + ch, X0:X0 + cw] = _puntos_en(lienzo[Y0:Y0 + ch, X0:X0 + cw], t / ef.get("dur_puntos", .5), 18, _hex("#1F1E1D"))
        return lienzo, _redondeado(H, W, bx, by, bw, bh, r)
    raise SystemExit(f"No conozco el efecto «{tipo}». Mira auto-edit-effects/referencia/catalogo.md.")
