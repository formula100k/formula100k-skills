# ascii_post.py · Plantilla «Animación ASCII»: convierte los pases (luz + profundidad) en una grilla de caracteres
# y arma muestra.mp4 + poster.jpg + cuadros.jpg. Textos y colores salen de config.json.
# Uso: uv run --with pillow --with numpy ascii_post.py            -> muestra.mp4 (300 cuadros), poster.jpg, cuadros.jpg
#      uv run --with pillow --with numpy ascii_post.py 1,60,150   -> PNG sueltos en revision/ (para revisar)
# Variables de entorno: AS_CONFIG (config.json; si no, el config.json junto a este archivo), AS_OUT (carpeta con pases/).
import os, sys, subprocess, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

_dir = os.path.dirname(os.path.abspath(__file__))
AQUI = os.environ.get("AS_OUT") or _dir
W, H, CW, CH = 1080, 1920, 12, 24
COLS, ROWS = W // CW, H // CH                    # 90 x 80
MONO = os.path.join(_dir, "fuentes", "JetBrainsMono-Bold.ttf")
ANTON = os.path.join(_dir, "fuentes", "Anton-Regular.ttf")
F_FIN = 300
_cfg = os.environ.get("AS_CONFIG") or os.path.join(_dir, "config.json")
CFG = json.load(open(os.path.expanduser(_cfg), encoding="utf-8")) if os.path.exists(os.path.expanduser(_cfg)) else {}
def _rgb(h):
    h = h.lstrip("#"); return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)
COLORES = dict(cerca="#33FF6B", lejos="#089E66", blanco="#E6FFED", clave="#E6FFED")
COLORES.update(CFG.get("colores", {}))
C_CERCA, C_LEJOS, C_BLANCO, C_CLAVE = (_rgb(COLORES[k]) for k in ("cerca", "lejos", "blanco", "clave"))
rng = np.random.default_rng(7)

# ---------- atlas de glifos ----------
RAMPA = " .,:;-~=+*icoaxzXO0#%8&@"
EXTRA = "|/\\_>→█▌▓▒░" + "ABCDEFGHIJKLMNOPQRSTUVWXYZÁ0123456789abcdefghijklmnopqrstuvwxyz-=>"
CHARS = "".join(dict.fromkeys(RAMPA + EXTRA))
def atlas(cw, ch, pt):
    f = ImageFont.truetype(MONO, pt)
    out = np.zeros((len(CHARS), ch, cw), np.float32)
    for i, c in enumerate(CHARS):
        im = Image.new("L", (cw, ch), 0)
        if c == "█": ImageDraw.Draw(im).rectangle((0, 0, cw - 1, ch - 1 - max(2, ch // 8)), fill=255)   # bloque casi lleno: letras legibles
        else: ImageDraw.Draw(im).text((cw / 2, ch * 0.5), c, font=f, fill=255, anchor="mm")
        out[i] = np.asarray(im, np.float32) / 255
    return out
AT = atlas(CW, CH, 20)
E2 = 3
AT2 = atlas(CW * E2, CH * E2, 60)
IDX = {c: i for i, c in enumerate(CHARS)}
tinta = AT[:len(RAMPA)].mean(axis=(1, 2))
orden = np.argsort(tinta)                        # rampa ordenada por tinta real
NR = len(orden)

# ---------- textos (carácter por carácter) ----------
def banner(palabra, max_cols=84, filas=13):
    """Palabra enorme en Anton, rasterizada a celdas: cada letra se arma con su propia letra."""
    pt = 400
    while True:
        f = ImageFont.truetype(ANTON, pt)
        x0, y0, x1, y1 = f.getbbox(palabra)
        if x1 - x0 <= max_cols * CW and y1 - y0 <= filas * CH: break
        pt -= 4
    wc = -(-(x1 - x0) // CW); hc = -(-(y1 - y0) // CH)
    im = Image.new("L", (wc * CW, hc * CH), 0)
    ImageDraw.Draw(im).text((-x0 + (wc * CW - (x1 - x0)) // 2, -y0 + (hc * CH - (y1 - y0))), palabra, font=f, fill=255)
    cob = np.asarray(im, np.float32).reshape(hc, CH, wc, CW).mean(axis=(1, 3)) / 255
    # a qué letra pertenece cada columna
    letra = np.zeros(wc, int); bordes = []
    off = (wc * CW - (x1 - x0)) // 2 - x0
    for i in range(len(palabra)):
        bordes.append((off + f.getlength(palabra[:i + 1])) / CW)
    for c in range(wc):
        letra[c] = next((i for i, b in enumerate(bordes) if c + 0.5 < b), len(palabra) - 1)
    return cob, letra

# Cada texto: f0/f1 = cuadro en que entra y en que se va (30 cuadros = 1 s), chica = línea chica que se escribe con
# cursor, grande = palabra clave enorme hecha de bloques (o null), fila = fila de la grilla donde arranca (0 arriba, 79 abajo).
TEXTOS = CFG.get("textos") or [
    dict(f0=22, f1=84, chica="tu equipo", grande="TRABAJA", fila=9),
    dict(f0=90, f1=152, chica="mientras", grande="DUERMES", fila=9),
    dict(f0=158, f1=224, chica="1 idea →", grande="8 VIDEOS", fila=50),
    dict(f0=264, f1=999, chica="comenta", grande=None, fila=49),
]
for t in TEXTOS:
    t.setdefault("grande", None)
    if t["grande"]: t["grande"] = t["grande"].upper(); t["cob"], t["letra"] = banner(t["grande"])

def sm(a, b, x): 
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def cargar(f):
    L = np.asarray(Image.open(f"{AQUI}/pases/luz/{f:04d}.png").convert("L"), np.float32) / 255
    N = np.asarray(Image.open(f"{AQUI}/pases/prof/{f:04d}.png").convert("L"), np.float32) / 255
    dec = lambda v: np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)
    N = np.clip(dec(N) * 2, 0, 1)                    # sRGB -> lineal (x2: el render va 1 paso subexpuesto): cercanía 0..1
    l = dec(L) * 2                                   # luz lineal 0..2
    l = np.where(l > 0.5, 0.5 + 0.5 * (1 - np.exp(-(l - 0.5) / 0.5)), l)    # rodilla: las altas luces no se queman
    cargar.emite = dec(L) > 0.93                     # máscara de lo que emite de verdad
    l = np.where(dec(L) > 0.93, 1.0, l)              # lo que emite de verdad (pantallas, letras del CTA) sí va a blanco sólido
    L = np.where(l <= 0.0031308, l * 12.92, 1.055 * np.clip(l, 0, 1) ** (1 / 2.4) - 0.055)
    return L, N

RUIDO = rng.random((ROWS, COLS))
VIG = None
def cuadro(f, estado):
    global VIG
    L, N = cargar(f)
    sh, sw = L.shape                                  # 640 x 360 -> 8 x 4 por celda
    by, bx = sh // ROWS, sw // COLS
    Lc = L.reshape(ROWS, by, COLS, bx).mean(axis=(1, 3))
    Nc = N.reshape(ROWS, by, COLS, bx).mean(axis=(1, 3))
    # bordes (luz + profundidad) -> caracteres de línea
    S = L * 0.35 + N * 3.0
    gy, gx = np.gradient(S)
    Jxx = (gx * gx).reshape(ROWS, by, COLS, bx).sum(axis=(1, 3))
    Jyy = (gy * gy).reshape(ROWS, by, COLS, bx).sum(axis=(1, 3))
    Jxy = (gx * gy).reshape(ROWS, by, COLS, bx).sum(axis=(1, 3))
    mag = np.sqrt(Jxx + Jyy)
    ang = 0.5 * np.arctan2(2 * Jxy, Jxx - Jyy)        # dirección del gradiente
    if estado.get("L") is not None:                   # suavizado temporal: menos chisporroteo
        Lc = 0.65 * Lc + 0.35 * estado["L"]; mag = 0.65 * mag + 0.35 * estado["m"]
    estado["L"], estado["m"] = Lc, mag
    # intensidad: luz x cercanía (lo cercano más denso y brillante) + un piso de profundidad
    I = np.clip((Lc ** 1.3) * (0.35 + 0.95 * Nc ** 1.2) + 0.03 * sm(0.05, 0.9, Nc), 0, 1)
    I = np.clip((I - 0.085) / 0.915, 0, 1)
    solido = (Lc > 0.965) | (cargar.emite.reshape(ROWS, by, COLS, bx).mean(axis=(1, 3)) > 0.45)   # emisores: bloque lleno con media celda cubierta
    ri = np.clip((I ** 0.8) * (NR - 1) + (RUIDO - 0.5) * 0.9, 0, NR - 1).round().astype(int)
    g = orden[ri]
    borde = (mag > 0.30) & ~solido
    g = np.where(solido, IDX['█'], g); I = np.where(solido, 1.0, I)
    d = np.degrees(ang)
    gl = np.where(np.abs(d) < 22.5, IDX["|"], np.where(np.abs(d) > 67.5, IDX["_"] if False else IDX["-"],
                  np.where(d > 0, IDX["/"], IDX["\\"])))
    g = np.where(borde, gl, g)
    I = np.where(borde, np.maximum(I, np.clip(0.35 + 0.6 * Nc, 0, 1) * sm(0.30, 0.8, mag) + 0.25), I)
    blanco = sm(0.60, 0.92, Lc) * sm(0.15, 0.5, Nc)
    # arranque: cada fila se escribe de izquierda a derecha, escalonada
    fila = np.arange(ROWS)[:, None]; colu = np.arange(COLS)[None, :]
    cab = (f + 14 - fila * 0.2) * 6.0     # el cuadro 1 ya va escrito a medias (nunca portada negra)                 # posición del cursor en cada fila
    visible = colu < cab
    cursor = (colu >= cab) & (colu < cab + 1.5) & (cab > 0)
    g = np.where(cursor, IDX["█"], g); I = np.where(cursor, 1.0, I); blanco = np.where(cursor, 1.0, blanco)
    visible = visible | cursor
    I = I * visible
    oscurecer = np.ones((ROWS, COLS), np.float32)
    clave = np.zeros((ROWS, COLS), np.float32)        # celdas de la palabra clave (van en el color «clave»)

    # ---------- textos ----------
    capas2 = []                                       # letras chicas a doble celda
    for t in TEXTOS:
        if not (t["f0"] <= f < t["f1"]): continue
        k = f - t["f0"]
        r0 = t["fila"]
        n_ch = min(len(t["chica"]), k + 1)
        ancho2 = len(t["chica"]) + 1
        c0 = (COLS - ancho2 * E2) // 2            # columna (en celdas chicas) centrada
        filas_bloque = E2 + 1
        if t["grande"]:
            cob, letra = t["cob"], t["letra"]; hc, wc = cob.shape
            filas_bloque = E2 + 1 + hc + 1
            bc0 = (COLS - wc) // 2; br0 = r0 + E2 + 1
            n_gr = int(np.clip((k - len(t["chica"]) - 2) // 2 + 1, 0, len(t["grande"])))
            x_a = min(bc0, c0) - 2; x_b = max(bc0 + wc, c0 + ancho2 * E2) + 2
        else:
            x_a = c0 - 2; x_b = c0 + ancho2 * E2 + 2; n_gr = 0
        oscurecer[r0 - 1:r0 + filas_bloque, x_a:x_b] = 0.0
        for i in range(n_ch):
            capas2.append((r0, c0 + i * E2, t["chica"][i], 0.85))
        if n_ch < len(t["chica"]) or (f // 8) % 2 == 0 and (not t["grande"] or n_gr == 0):
            capas2.append((r0, c0 + n_ch * E2, "█", 1.0))
        if t["grande"] and n_gr:
            ok = (letra[None, :] < n_gr)
            llena = (cob > 0.2) & ok
            sub_g = g[br0:br0 + hc, bc0:bc0 + wc]; sub_I = I[br0:br0 + hc, bc0:bc0 + wc]
            sub_b = blanco[br0:br0 + hc, bc0:bc0 + wc]; sub_o = oscurecer[br0:br0 + hc, bc0:bc0 + wc]
            sub_k = clave[br0:br0 + hc, bc0:bc0 + wc]
            ids = np.select([cob > 0.8, cob > 0.58, cob > 0.38], [IDX["█"], IDX["▓"], IDX["▒"]], IDX["░"])
            sub_g[llena] = ids[llena]; sub_I[llena] = 1.0; sub_b[llena] = 1.0; sub_o[llena] = 1.0; sub_k[llena] = 1.0
            if n_gr < len(t["grande"]):               # cursor al final de lo escrito
                cc = np.where(letra == n_gr)[0]
                if len(cc):
                    sub_g[:, cc[0]:cc[0] + 2] = IDX["█"]; sub_I[:, cc[0]:cc[0] + 2] = 1; sub_b[:, cc[0]:cc[0] + 2] = 1
                    sub_o[:, cc[0]:cc[0] + 2] = 1
    I = I * oscurecer

    # ---------- componer ----------
    mask = AT[g].transpose(0, 2, 1, 3).reshape(H, W)
    cerca = sm(0.1, 0.75, Nc)[..., None]
    colr = C_LEJOS * (1 - cerca) + C_CERCA * cerca
    colr = colr * (1 - blanco[..., None]) + C_BLANCO * blanco[..., None]
    colr = colr * (1 - clave[..., None]) + C_CLAVE * clave[..., None]
    colr = colr * (0.22 + 0.78 * I[..., None]) * (I[..., None] > 0.004)
    img = np.repeat(np.repeat(colr, CH, axis=0), CW, axis=1) * mask[..., None]
    for (r, c, chr_, v) in capas2:
        y, x = r * CH, c * CW
        img[y:y + CH * E2, x:x + CW * E2] = AT2[IDX[chr_]][..., None] * C_BLANCO * v
    # fósforo: resplandor + líneas de barrido + viñeta
    pil = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    b1 = np.asarray(pil.filter(ImageFilter.GaussianBlur(3)), np.float32) / 255
    b2 = np.asarray(pil.filter(ImageFilter.GaussianBlur(14)), np.float32) / 255
    img = img + b1 * 0.35 + b2 * 0.55
    if VIG is None:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((xx - W / 2) / (W * 0.78)) ** 2 + ((yy - H / 2) / (H * 0.70)) ** 2)
        VIG = (1 - 0.55 * sm(0.45, 1.0, r))[..., None]
        VIG = VIG * np.where((np.arange(H) % 3) == 2, 0.86, 1.0)[:, None, None]
    img = img * VIG + np.array([0.012, 0.022, 0.016], np.float32)
    return (np.clip(img, 0, 1) * 255).astype(np.uint8)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        os.makedirs(f"{AQUI}/revision", exist_ok=True)
        for f in [int(x) for x in sys.argv[1].split(",")]:
            Image.fromarray(cuadro(f, {})).save(f"{AQUI}/revision/{f:04d}.png")
    else:
        p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                              "-r", "30", "-i", "-", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
                              "-preset", "slow", "-movflags", "+faststart", f"{AQUI}/muestra.mp4"], stdin=subprocess.PIPE)
        est = {}
        for f in range(1, F_FIN + 1):
            p.stdin.write(cuadro(f, est).tobytes())
        p.stdin.close(); p.wait()
        v = f"{AQUI}/muestra.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "9.5", "-i", v, "-frames:v", "1", "-q:v", "2", f"{AQUI}/poster.jpg"])
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", v, "-vf", "select='not(mod(n-8\\,35))',scale=240:427,tile=3x3",
                        "-frames:v", "1", "-q:v", "3", f"{AQUI}/cuadros.jpg"])
        print("OK muestra.mp4 + poster.jpg + cuadros.jpg")
