# build.py · Plantilla «Efecto dominó» (efecto-domino-f100k)
# Cientos de fichas de dominó caen en cadena por una serpentina sobre una mesa de madera y, al caer, escriben
# tu palabra de CTA. Física real (cuerpos rígidos), cámara que sigue la ola, 10,5 s a 1080x1920 y 30 fps.
# Reconstruye TODO desde cero, sin créditos:
#   DOM_CONFIG=config.json blender -b --factory-startup -P build.py
#     1) arma la mesa, las fichas (cadena en serpentina + tu palabra), textos y luces
#     2) corre la simulación de cuerpos rígidos (Bullet) cuadro a cuadro y la hornea a keyframes (≈ 2 min)
#     3) calcula la cámara a partir de la ola simulada (macro a ras de mesa → grúa cenital)
#     4) guarda escena.blend, eventos.json (cuándo cae cada tramo) y sim_cache.json (la simulación)
#   blender -b escena.blend -a      → frames/f_0001.png … f_0315.png
#   ./post.sh                       → muestra.mp4 (viñeta + grano fino), poster.jpg, hoja.jpg
# Variables de entorno:
#   DOM_CONFIG   config.json (textos, palabra del CTA y colores)
#   DOM_OUT      carpeta de salida (por defecto, la de este archivo)
#   DOM_FONTS    carpeta de letras (por defecto, fuentes/ junto a este archivo)
#   DOM_SCALE    % de 1080x1920 (100)        DOM_SAMPLES  muestras EEVEE (40)
#   DOM_CACHE=1  reutiliza sim_cache.json (para iterar cámara/luz/textos sin volver a simular;
#                NO lo uses si cambiaste la palabra: la caché es de la palabra anterior)
#   DOM_TS=2.6   escala de tiempo de la simulación
import bpy, bmesh, math, os, json, random, bisect
from mathutils import Vector, Matrix, Quaternion

OUT = os.environ.get("DOM_OUT") or os.path.dirname(os.path.abspath(__file__))
_here = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fuentes")
FUENTES = (os.environ.get("DOM_FONTS") or _here).rstrip("/") + "/"
SCALE = int(os.environ.get("DOM_SCALE", "100"))
SAMPLES = int(os.environ.get("DOM_SAMPLES", "40"))
CFG = {}
if os.environ.get("DOM_CONFIG"):
    with open(os.path.expanduser(os.environ["DOM_CONFIG"])) as fh:
        CFG = json.load(fh)
CTA = CFG.get("cta", "GUÍA").upper().replace(" ", "")
TX = dict(inicio={"grande": "1", "chica": "idea"},
          fila1={"chica": "Una cosa", "grande": "LLEVA"},
          fila2={"chica": "a la", "grande": "OTRA"},
          cta_chica="Comenta")
TX.update(CFG.get("textos", {}))
COLS = dict(cadena="#CE3F27", letras="#ED9C00", ficha="#CEC7B6", texto="#E4DAC2")
COLS.update(CFG.get("colores", {}))

def lin(h):
    """hex sRGB → color lineal (lo que usa Blender por dentro)"""
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

FPS, NF = 30, 315
H = 2.0                          # altura de mayúscula de la palabra
DW, DH, DT = 0.24, 0.48, 0.075   # ficha: ancho, alto, grosor (10x la escala real)
SP_S, SP_C = 0.215, 0.16         # separación en recta / en curva
BIG = (DW, DH, DT)
LET = (0.25, 0.30, 0.055)        # fichas cortas para las letras: resuelven mejor las curvas
LSP_S, LSP_C = 0.15, 0.115
TIME_SCALE = float(os.environ.get("DOM_TS", "2.6"))
USE_CACHE = os.environ.get("DOM_CACHE") == "1"
YA, YB, YC, YF = 11.5, 8.9, 6.1, 3.24   # filas de la serpentina y alimentador
F_START = 13                     # cuadro del primer empujón
CORAL = lin(COLS["cadena"]); AMAR = lin(COLS["letras"])
random.seed(7)

# ---------------------------------------------------------------- utilidades de trazo
def sample_path(pts, r, ds=0.004):
    pts = [Vector(p) for p in pts]
    out = []; s = 0.0
    def add_line(a, b, s):
        L = (b - a).length
        if L < 1e-6: return s
        t = (b - a) / L; n = max(1, int(math.ceil(L / ds)))
        for i in range(n):
            out.append((s + L * i / n, a + (b - a) * (i / n), t.copy(), False))
        return s + L
    def add_arc(c, a0, sweep, rad, s):
        L = abs(sweep) * rad; n = max(2, int(math.ceil(L / ds))); sg = 1 if sweep > 0 else -1
        for i in range(n):
            a = a0 + sweep * i / n
            p = c + Vector((math.cos(a), math.sin(a))) * rad
            t = Vector((-math.sin(a), math.cos(a))) * sg
            out.append((s + L * i / n, p, t, True))
        return s + L
    cur = pts[0]
    for i in range(1, len(pts) - 1):
        P = pts[i]; d1 = (P - pts[i - 1]).normalized(); d2 = (pts[i + 1] - P).normalized()
        cr = d1.x * d2.y - d1.y * d2.x; dt = d1.dot(d2); al = math.atan2(abs(cr), dt)
        if al < 1e-4: continue
        ri = r[i] if isinstance(r, (list, tuple)) else r
        tl = ri * math.tan(al / 2); T1 = P - d1 * tl; T2 = P + d2 * tl
        sg = 1 if cr > 0 else -1
        c = T1 + Vector((-d1.y, d1.x)) * sg * ri
        s = add_line(cur, T1, s)
        a0 = math.atan2(T1.y - c.y, T1.x - c.x)
        s = add_arc(c, a0, sg * al, ri, s); cur = T2
    s = add_line(cur, pts[-1], s)
    out.append((s, pts[-1].copy(), (pts[-1] - pts[-2]).normalized(), False))
    return out

def place(samples, end_trim=0.0, sp_s=SP_S, sp_c=SP_C):
    ss = [x[0] for x in samples]; L = ss[-1]; s = 0.0; res = []
    while s <= L - end_trim + 1e-6:
        i = min(bisect.bisect_left(ss, s), len(ss) - 1)
        j = min(bisect.bisect_left(ss, s + sp_s), len(ss) - 1)
        curved = any(samples[k][3] for k in range(i, j + 1, 3)) or samples[j][3]
        res.append((samples[i][0], samples[i][1].copy(), samples[i][2].copy()))
        s += sp_c if curved else sp_s
    return res

# ---------------------------------------------------------------- definición de trazos
STROKES = []
def stroke(name, pts, r=0.3, trim=None, color=None, parent=None, mode="near", off=(0, 0), dim=LET):
    pts = [(x + off[0], y + off[1]) for x, y in pts]
    big = dim is BIG
    if trim is None: trim = 0.8 * dim[1]
    it = place(sample_path(pts, r), trim, sp_s=SP_S if big else LSP_S, sp_c=SP_C if big else LSP_C)
    STROKES.append(dict(name=name, items=it, color=color or (lambda p: AMAR), parent=parent, mode=mode, dim=dim))

# ---------------------------------------------------------------- alfabeto de fichas
# Cada letra: (ancho, [trazos]). Un trazo = (sufijo, puntos, opciones). TOP = el alimentador: ese trazo baja
# desde la fila de abajo de la serpentina (coral) y al entrar en la letra se vuelve del color de las letras.
# Opciones: r (radio de las curvas, número o lista por punto), trim (cuánto se recorta al final),
# p (de qué trazo nace: "main" = el alimentador; si no, el sufijo de otro trazo de la misma letra),
# m ("near" = arranca cuando cae la ficha más cercana del trazo padre; "last" = cuando cae la última),
# tilde (True = el tramo de abajo es la tilde, en el color de las letras).
# Reglas para agregar letras: curvas de radio ≥ 0,25; dos trazos paralelos a ≥ 0,3 de distancia;
# ningún trazo cruza a otro (si se cruzan, pártelo en dos que nacen del centro).
TOP = "TOP"
T_ = H - 0.12            # línea central de la barra de arriba
B_ = 0.12                # línea central de la barra de abajo
STEM = ("1", [(0, TOP), (0, 0)], {})
def _tilde(x):           # tilde que baja en diagonal desde el alimentador hasta encima de la letra
    return ("t", [(x + 0.38, TOP), (x, 2.34)], dict(trim=0.23, tilde=True))
def _A(tilde):
    head = _tilde(0.64) if tilde else ("t", [(0.6, TOP), (0.6, 2.12)], dict(trim=0.25))
    return (1.2, [head,
                  ("l", [(0.47, 1.96), (0.0, 0.0)], dict(p="t", m="last")),
                  ("r", [(0.73, 1.96), (1.2, 0.0)], dict(p="t", m="last")),
                  ("b", [(0.40, 0.64), (0.94, 0.64)], dict(p="l", trim=0.27))])
def _E(tilde):
    first = [_tilde(0.22), ("1", [(0, 2.0), (0, 0)], dict(p="t", m="last"))] if tilde else [STEM]
    return (1.0, first + [("2", [(0.19, T_), (1.0, T_)], dict(p="1")),
                          ("3", [(0.19, 1.0), (0.85, 1.0)], dict(p="1")),
                          ("4", [(0.19, B_), (1.0, B_)], dict(p="1"))])
def _I(tilde):
    return (0.0, [_tilde(0.0), ("1", [(0, 2.0), (0, 0)], dict(p="t", m="last"))] if tilde else [STEM])
_OPTS = [(1.2, B_), (1.2, T_), (0.8, T_)]
def _O(tilde):
    if tilde:
        return (1.2, [_tilde(0.75), ("1", [(0.75, 2.12), (0.75, T_), (0, T_), (0, B_)] + _OPTS,
                                     dict(p="t", m="last", r=[0, 0.2, 0.45, 0.5, 0.5, 0.35, 0]))])
    return (1.2, [("1", [(0.75, TOP), (0.75, T_), (0, T_), (0, B_)] + _OPTS, dict(r=[0, 0.25, 0.45, 0.5, 0.5, 0.35, 0]))])
def _U(tilde):
    body = [(0, B_), (1.1, B_), (1.1, 1.95)]
    if tilde:
        return (1.1, [_tilde(0.22), ("1", [(0, 2.0)] + body, dict(p="t", m="last", r=[0, 0.5, 0.5, 0]))])
    return (1.1, [("1", [(0, TOP)] + body, dict(r=[0, 0.5, 0.5, 0]))])
def _N(tilde):
    if tilde:   # Ñ: el alimentador baja, dobla y dibuja la virgulilla plana encima de la N
        first = [("t", [(0, TOP), (0, 2.5), (1.1, 2.5)], dict(r=0.22, tilde=2.62)),
                 ("1", [(0, 2.12), (0, 0)], dict(p="t"))]
    else:
        first = [STEM]
    return (1.25, first + [("2", [(0.32, 1.8), (1.0, 0.2)], dict(p="1")),
                           ("3", [(1.25, 0.1), (1.25, 1.95)], dict(p="2", m="last"))])

GLYPHS = {
    "A": _A(False), "Á": _A(True), "E": _E(False), "É": _E(True), "I": _I(False), "Í": _I(True),
    "O": _O(False), "Ó": _O(True), "U": _U(False), "Ú": _U(True), "N": _N(False), "Ñ": _N(True),
    "B": (1.04, [STEM, ("2", [(0.19, T_), (1.0, T_), (1.0, 1.24)], dict(p="1", r=0.42)),
                 ("3", [(0.19, 0.97), (1.04, 0.97), (1.04, B_), (0.2, B_)], dict(p="1", r=0.42))]),
    "C": (1.04, [("1", [(1.42, TOP), (1.42, T_), (0, T_), (0, B_), (1.04, B_)], dict(r=[0, 0.35, 0.5, 0.5, 0]))]),
    "D": (1.1, [STEM, ("2", [(0.19, T_), (1.1, T_), (1.1, B_), (0.2, B_)], dict(p="1", r=0.5))]),
    "F": (1.04, [STEM, ("2", [(0.19, T_), (1.04, T_)], dict(p="1")), ("3", [(0.19, 1.02), (0.88, 1.02)], dict(p="1"))]),
    "G": (1.1, [("1", [(1.42, TOP), (1.42, T_), (0, T_), (0, B_), (1.1, B_), (1.1, 0.95), (0.6, 0.95)],
                 dict(r=[0, 0.35, 0.5, 0.5, 0.4, 0.25, 0]))]),
    "H": (1.14, [STEM, ("2", [(0.19, 1.0), (0.95, 1.0)], dict(p="1")), ("3", [(1.14, TOP), (1.14, 0)], {})]),
    "J": (0.9, [("1", [(0.9, TOP), (0.9, B_), (0, B_), (0, 0.7)], dict(r=[0, 0.4, 0.4, 0]))]),
    "K": (1.1, [STEM, ("2", [(0.3, 1.1), (1.05, 2.0)], dict(p="1")), ("3", [(0.45, 0.92), (1.1, 0.0)], dict(p="1"))]),
    "L": (0.95, [STEM, ("2", [(0.19, B_), (0.95, B_)], dict(p="1"))]),
    "M": (1.55, [STEM, ("2", [(0.32, 1.8), (0.72, 0.72)], dict(p="1")), ("3", [(0.92, 0.72), (1.32, 1.8)], dict(p="2", m="last")),
                 ("4", [(1.55, 1.95), (1.55, 0)], dict(p="3", m="last"))]),
    "P": (1.04, [STEM, ("2", [(0.19, T_), (1.04, T_), (1.04, 0.96), (0.2, 0.96)], dict(p="1", r=0.42))]),
    "Q": (1.2, _O(False)[1] + [("2", [(0.8, 0.5), (1.35, -0.1)], dict(p="1"))]),
    "R": (1.12, [STEM, ("2", [(0.19, T_), (1.04, T_), (1.04, 0.96), (0.42, 0.96)], dict(p="1", r=0.46)),
                 ("3", [(0.56, 0.78), (1.12, 0.0)], dict(p="2", m="last"))]),
    "S": (1.15, [("1", [(1.15, TOP), (1.15, T_), (0, T_), (0, 1.0), (1.1, 1.0), (1.1, B_), (0, B_)],
                  dict(r=[0, 0.25, 0.43, 0.43, 0.43, 0.43, 0]))]),
    "T": (1.4, [("1", [(0.7, TOP), (0.7, 0)], {}), ("2", [(0.53, T_), (0, T_)], dict(p="1", trim=0.1)),
                ("3", [(0.87, T_), (1.4, T_)], dict(p="1", trim=0.1))]),
    "V": (1.3, [("1", [(0, TOP), (0, 1.95), (0.6, 0.05)], dict(r=[0, 0.3, 0])), ("2", [(0.85, 0.1), (1.3, 1.95)], dict(p="1", m="last"))]),
    "W": (1.8, [("1", [(0, TOP), (0, 1.95), (0.4, 0.05)], dict(r=[0, 0.3, 0])), ("2", [(0.58, 0.12), (0.85, 1.35)], dict(p="1", m="last")),
                ("3", [(1.05, 1.4), (1.3, 0.1)], dict(p="2", m="last")), ("4", [(1.5, 0.12), (1.8, 1.95)], dict(p="3", m="last"))]),
    "X": (1.2, [("1", [(0, TOP), (0, 1.95), (1.2, 0.05)], dict(r=[0, 0.3, 0])), ("2", [(0.8, 1.15), (1.2, 1.9)], dict(p="1")),
                ("3", [(0.4, 0.85), (0.0, 0.1)], dict(p="1"))]),
    "Y": (1.2, [("1", [(0, TOP), (0, 1.95), (0.6, 1.0), (0.6, 0)], dict(r=[0, 0.3, 0.3, 0])), ("2", [(0.8, 1.25), (1.2, 1.95)], dict(p="1"))]),
    "Z": (1.1, [("1", [(0, TOP), (0, T_), (1.1, T_), (0, B_), (1.1, B_)], dict(r=[0, 0.25, 0.25, 0.25, 0]))]),
}
_faltan = [ch for ch in CTA if ch not in GLYPHS]
if _faltan:
    raise SystemExit("[domino] estas letras no están en el alfabeto de fichas: %s (usa A–Z, Ñ y vocales con tilde)" % "".join(_faltan))

def _feed_xs(g):
    return [s[1][0][0] for s in g[1] if s[1][0][1] == TOP]
# ancho de la palabra: 0,5 entre letras y, si hace falta, más aire para que dos alimentadores no se toquen
_pos = []; ox = 0.0; prev = None
for ch in CTA:
    g = GLYPHS[ch]
    if prev is not None:
        pg, pox = prev
        gap = max(0.5, max(_feed_xs(pg) + [pg[0]]) + 0.45 - pg[0] - min(_feed_xs(g) or [0.0]))
        ox = pox + pg[0] + gap
    _pos.append(ox); prev = (g, ox)
WORD_W = ox + GLYPHS[CTA[-1]][0]
XR = max(4.8, WORD_W / 2 + 0.2)          # la serpentina se estira si tu palabra es larga
KX = XR / 4.8
YTOP = YF - 0.23
FEED_END = max(x + o - WORD_W / 2 for ch, o in zip(CTA, _pos) for x in _feed_xs(GLYPHS[ch])) + 0.13

rAB, rBC, rCF = (YA - YB) / 2, (YB - YC) / 2, (YC - YF) / 2
MAIN = [(XR, YA), (-XR - rAB, YA), (-XR - rAB, YB), (XR + rBC, YB), (XR + rBC, YC),
        (-XR - rCF, YC), (-XR - rCF, YF), (FEED_END, YF)]
MAIN_R = [0, rAB, rAB, rBC, rBC, rCF, rCF, 0]
stroke("main", MAIN, MAIN_R, trim=0.0, color=lambda p: CORAL, dim=BIG)

for li, (ch, o) in enumerate(zip(CTA, _pos)):
    w, sts = GLYPHS[ch]
    ox = o - WORD_W / 2
    for sfx, pts, kw in sts:
        feed = pts[0][1] == TOP
        pts = [(x, YTOP if y == TOP else y) for x, y in pts]
        if kw.get("tilde"):
            lim = 1.44 * H if kw["tilde"] is True else kw["tilde"]
            col = lambda p, lim=lim: AMAR if p.y <= lim else CORAL
        elif feed:
            col = lambda p, ox=ox, w=w: AMAR if (p.y <= H + 0.02 and ox - 0.15 <= p.x <= ox + w + 0.05) else CORAL
        else:
            col = None
        par = "main" if feed else "L%d%s" % (li, kw.get("p", "1"))
        stroke("L%d%s" % (li, sfx), pts, r=kw.get("r", 0.3), trim=kw.get("trim"), color=col, parent=par,
               mode=kw.get("m", "near"), off=(ox, 0))

# ---------------------------------------------------------------- escena limpia
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS; scene.frame_start = 1; scene.frame_end = NF
try: bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
except Exception: pass
col_dom = bpy.data.collections.new("Fichas"); scene.collection.children.link(col_dom)
col_set = bpy.data.collections.new("Set"); scene.collection.children.link(col_set)
col_txt = bpy.data.collections.new("Textos"); scene.collection.children.link(col_txt)
col_aux = bpy.data.collections.new("Aux"); scene.collection.children.link(col_aux)

def new_mat(name):
    m = bpy.data.materials.new(name)
    try: m.use_nodes = True
    except Exception: pass
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(b.outputs[0], out.inputs[0])
    return m, nt, b
def setin(b, **kw):
    for k, v in kw.items():
        k = k.replace("_", " ")
        if k in b.inputs: b.inputs[k].default_value = v

# materiales de ficha (laca)
m_marfil, nt, b = new_mat("laca_marfil")
setin(b, Base_Color=lin(COLS["ficha"]), Roughness=0.22, Coat_Weight=1.0, Coat_Roughness=0.04)
m_color, nt, b = new_mat("laca_color")     # color por objeto (dorso)
oi = nt.nodes.new("ShaderNodeObjectInfo"); nt.links.new(oi.outputs["Color"], b.inputs["Base Color"])
setin(b, Roughness=0.18, Coat_Weight=1.0, Coat_Roughness=0.03)
m_pip, nt, b = new_mat("puntos")
setin(b, Base_Color=(0.03, 0.025, 0.02, 1), Roughness=0.35)

def domino_mesh(name, halves, all_color=False, dim=BIG):
    DW, DH, DT = dim
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(DW, DT, DH), verts=bm.verts)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.013, segments=3, profile=0.5, affect='EDGES')
    for f in bm.faces:
        f.smooth = True
        f.material_index = 1 if (all_color or (f.normal.y < -0.95)) else 0
    yq = DT / 2 + 0.0012
    def disc(cx, cz, rad):
        r = bmesh.ops.create_circle(bm, cap_ends=True, segments=20, radius=rad,
                                    matrix=Matrix.Translation((cx, yq, cz)) @ Matrix.Rotation(-math.pi / 2, 4, 'X'))
        for v in r["verts"]:
            for f in v.link_faces: f.material_index = 2
    def bar():
        vs = [bm.verts.new((x, yq, z)) for x, z in ((-0.085, -0.006), (0.085, -0.006), (0.085, 0.006), (-0.085, 0.006))]
        f = bm.faces.new(vs); f.material_index = 2
    pos = {1: [(0, 0)], 2: [(-1, 1), (1, -1)], 3: [(-1, 1), (0, 0), (1, -1)], 4: [(-1, 1), (1, 1), (-1, -1), (1, -1)],
           5: [(-1, 1), (1, 1), (0, 0), (-1, -1), (1, -1)], 6: [(-1, 1), (1, 1), (-1, 0), (1, 0), (-1, -1), (1, -1)]}
    if not all_color:
        bar()
        for half, cz in zip(halves, (DH / 4, -DH / 4)):
            k = min(DW, DH / 2) / 0.24
            for px, pz in pos[half]: disc(px * 0.058 * k, cz + pz * 0.058 * k, 0.019 * k)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in (m_marfil, m_color, m_pip): me.materials.append(m)
    return me
MESHES = [domino_mesh("ficha_%d" % i, hv) for i, hv in enumerate([(3, 5), (6, 2), (4, 1), (5, 6), (2, 3)])]
MESHES_L = [domino_mesh("fichaL_%d" % i, hv, dim=LET) for i, hv in enumerate([(3, 5), (6, 2), (4, 1), (5, 6), (2, 3)])]
MESH_IDEA = domino_mesh("ficha_idea", (1, 1), all_color=True)

# fichas
DOMS = []     # dict(obj, stroke, idx, p, t)
BY = {}
for st in STROKES:
    lst = []
    for i, (s, p, t) in enumerate(st["items"]):
        first = (st["name"] == "main" and i == 0)
        ob = bpy.data.objects.new("d_%s_%03d" % (st["name"], i), MESH_IDEA if first else random.choice(MESHES if st["dim"] is BIG else MESHES_L))
        ob.location = (p.x, p.y, st["dim"][1] / 2)
        ob.rotation_euler = (0, 0, math.atan2(t.y, t.x) - math.pi / 2)
        ob.color = AMAR if first else st["color"](p)
        col_dom.objects.link(ob)
        d = dict(obj=ob, stroke=st["name"], idx=i, p=p, t=t, dim=st["dim"]); lst.append(d); DOMS.append(d)
    BY[st["name"]] = lst
print("[domino] fichas:", len(DOMS), {k: len(v) for k, v in BY.items()})

# mesa
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 6, -0.5)); mesa = bpy.context.active_object
mesa.name = "Mesa"; mesa.scale = (140, 140, 1)
for c in list(mesa.users_collection): c.objects.unlink(mesa)
col_set.objects.link(mesa)
m_mad, nt, b = new_mat("madera_nogal")
N = nt.nodes.new; L = nt.links.new
tc = N("ShaderNodeTexCoord"); mp = N("ShaderNodeMapping"); L(tc.outputs["Object"], mp.inputs[0])
mp.inputs["Scale"].default_value = (140, 140, 1)          # a metros de mundo
br = N("ShaderNodeTexBrick"); L(mp.outputs[0], br.inputs["Vector"])
br.inputs["Scale"].default_value = 1.0; br.inputs["Mortar Size"].default_value = 0.012
br.inputs["Mortar Smooth"].default_value = 0.4
br.inputs["Brick Width"].default_value = 17.0; br.inputs["Row Height"].default_value = 2.9
br.inputs["Color1"].default_value = (0.75, 0.75, 0.75, 1); br.inputs["Color2"].default_value = (1, 1, 1, 1)
br.inputs["Mortar"].default_value = (0.12, 0.12, 0.12, 1); br.offset = 0.37
mp2 = N("ShaderNodeMapping"); L(tc.outputs["Object"], mp2.inputs[0])
mp2.inputs["Scale"].default_value = (140 * 0.06, 140 * 1.1, 1)   # veta estirada a lo largo de X
no1 = N("ShaderNodeTexNoise"); L(mp2.outputs[0], no1.inputs["Vector"])
no1.inputs["Scale"].default_value = 1.0; no1.inputs["Detail"].default_value = 9; no1.inputs["Roughness"].default_value = 0.62
mixv = N("ShaderNodeMixRGB"); mixv.blend_type = 'ADD'; mixv.inputs[0].default_value = 0.35
L(mp2.outputs[0], mixv.inputs[1]); L(br.outputs["Color"], mixv.inputs[2])     # desfasa la veta por tabla
no2 = N("ShaderNodeTexNoise"); L(mixv.outputs[0], no2.inputs["Vector"])
no2.inputs["Scale"].default_value = 2.2; no2.inputs["Detail"].default_value = 12; no2.inputs["Roughness"].default_value = 0.7
no2.inputs["Distortion"].default_value = 1.6
ramp = N("ShaderNodeValToRGB"); L(no2.outputs["Fac"], ramp.inputs[0])
e = ramp.color_ramp.elements
e[0].position = 0.28; e[0].color = (0.035, 0.014, 0.006, 1)
e[1].position = 0.72; e[1].color = (0.20, 0.085, 0.032, 1)
e2 = ramp.color_ramp.elements.new(0.5); e2.color = (0.105, 0.042, 0.016, 1)
mul = N("ShaderNodeMixRGB"); mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1.0
L(ramp.outputs[0], mul.inputs[1]); L(br.outputs["Color"], mul.inputs[2])
L(mul.outputs[0], b.inputs["Base Color"])
rr = N("ShaderNodeMapRange"); L(no2.outputs["Fac"], rr.inputs[0])
rr.inputs[3].default_value = 0.30; rr.inputs[4].default_value = 0.46
L(rr.outputs[0], b.inputs["Roughness"])
bump = N("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.12; bump.inputs["Distance"].default_value = 0.02
L(no2.outputs["Fac"], bump.inputs["Height"]); L(bump.outputs[0], b.inputs["Normal"])
setin(b, Coat_Weight=0.35, Coat_Roughness=0.16)
mesa.data.materials.append(m_mad)

# ---------------------------------------------------------------- textos pintados en la mesa
m_tx, nt, b = new_mat("pintura_crema")
setin(b, Base_Color=lin(COLS["texto"]), Roughness=0.6)
F_BLACK = bpy.data.fonts.load(FUENTES + "ArchivoBlack-Regular.ttf")
F_ITAL = bpy.data.fonts.load(FUENTES + "InstrumentSerif-Italic.ttf")
TXT = {}
def texto(key, body, font, size, x, y, align='LEFT'):
    cu = bpy.data.curves.new("t_" + key, 'FONT'); cu.body = body; cu.font = font; cu.size = size
    cu.align_x = align; cu.align_y = 'BOTTOM_BASELINE'
    ob = bpy.data.objects.new("T_" + key, cu); ob.location = (x, y, 0.004)
    cu.materials.append(m_tx); col_txt.objects.link(ob); TXT[key] = ob
    return ob
def ancho(ob):
    bpy.context.view_layer.update(); return ob.dimensions.x
def par(kc, kg, chica, grande, sc, sg, maxw):
    """renglón de 2 piezas (itálica chica + negra enorme); si no cabe entre las filas, se achica"""
    k = 1.0
    for _ in range(2):
        a = texto(kc, chica, F_ITAL, sc * k, 0, 0); b_ = texto(kg, grande, F_BLACK, sg * k, 0, 0)
        tot = ancho(a) + ancho(b_) + 0.35 * k
        if tot <= maxw: return a, b_, k
        bpy.data.objects.remove(a); bpy.data.objects.remove(b_); k *= maxw / tot
    return a, b_, k
XL = XR - 0.1
# inicio (arriba a la derecha, detrás de la primera ficha): «1 idea»
t = texto("uno", TX["inicio"]["grande"], F_BLACK, 1.25, XR - 2.25, YA + 0.75)
texto("idea", TX["inicio"]["chica"], F_ITAL, 1.25, XR - 2.25 + ancho(t) + 0.22, YA + 0.75)
# fila 1 entre fila A y B, alineada a la izquierda
yb1 = YB + 0.82
a, b_, k = par("tu", "trabaja", TX["fila1"]["chica"], TX["fila1"]["grande"].upper(), 1.22, 1.32, 2 * XL)
a.location = (-XL, yb1, 0.004); b_.location = (-XL + ancho(a) + 0.35 * k, yb1, 0.004)
# fila 2 entre fila B y C, alineada a la derecha
yb2 = YC + 0.92
a, b_, k = par("mientras", "duermes", TX["fila2"]["chica"], TX["fila2"]["grande"].upper(), 1.22, 1.32, 2 * XL)
b_.data.align_x = 'RIGHT'; b_.location = (XL, yb2, 0.004)
a.data.align_x = 'RIGHT'; a.location = (XL - ancho(b_) - 0.35 * k, yb2, 0.004)
# «Comenta» sobre el alimentador
texto("comenta", TX["cta_chica"], F_ITAL, 1.75, -XL, YF + 0.72)

# ---------------------------------------------------------------- física
EMPUJES = []   # dict(pusher, dom, src, start)
def nearest(lst, p):
    return min(lst, key=lambda d: (d["p"] - p).length)
for st in STROKES:
    d0 = BY[st["name"]][0]
    if st["name"] == "main": src = None
    elif st["mode"] == "last": src = BY[st["parent"]][-1]
    else: src = nearest(BY[st["parent"]], d0["p"])
    EMPUJES.append(dict(dom=d0, src=src, start=(F_START if src is None else None)))

def tilt_of(q):
    z = q @ Vector((0, 0, 1)); return math.degrees(math.acos(max(-1, min(1, z.z))))

def simular():
    bpy.ops.rigidbody.world_add()
    rbw = scene.rigidbody_world
    if rbw.collection is None:
        rbw.collection = bpy.data.collections.new("RB")
    rbw.substeps_per_frame = 60; rbw.solver_iterations = 40; rbw.time_scale = TIME_SCALE
    rbw.point_cache.frame_start = 1; rbw.point_cache.frame_end = NF + 2
    def add_rb(ob, tipo, shape='BOX'):
        rbw.collection.objects.link(ob)
        if ob.rigid_body is None:
            with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]):
                bpy.ops.rigidbody.object_add()
        rb = ob.rigid_body; rb.type = tipo; rb.collision_shape = shape; rb.use_margin = False
        return rb
    rb = add_rb(mesa, 'PASSIVE'); rb.friction = 0.85; rb.restitution = 0.0
    trig = {id(e["dom"]["obj"]) for e in EMPUJES}
    for d in DOMS:
        rb = add_rb(d["obj"], 'ACTIVE'); rb.mass = 1.0; rb.friction = 0.55; rb.restitution = 0.03
        rb.linear_damping = 0.02; rb.angular_damping = 0.05; rb.use_deactivation = False
        cc = [False] * 20; cc[0] = True
        if id(d["obj"]) in trig: cc[1] = True
        rb.collision_collections = cc
    # empujadores invisibles (cinemáticos) para la primera ficha de cada trazo
    pm = bpy.data.meshes.new("empuje"); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(0.12, 0.03, 0.05), verts=bm.verts); bm.to_mesh(pm); bm.free()
    for e in EMPUJES:
        d = e["dom"]; tt = Vector((d["t"].x, d["t"].y, 0))
        po = bpy.data.objects.new("emp_" + d["obj"].name, pm)
        base = Vector((d["p"].x, d["p"].y, 0.83 * d["dim"][1])) - tt * (d["dim"][2] / 2 + 0.015 + 0.012)
        po.location = base; po.rotation_euler = d["obj"].rotation_euler
        po.hide_render = True; col_aux.objects.link(po)
        rb = add_rb(po, 'ACTIVE'); rb.kinematic = True; rb.friction = 0.1
        cc = [False] * 20; cc[1] = True; rb.collision_collections = cc
        e["pusher"] = po; e["base"] = base; e["dir"] = tt
    rec = {d["obj"].name: [] for d in DOMS}
    tilt = {d["obj"].name: 0.0 for d in DOMS}
    PUSH = [0.05, 0.11, 0.17, 0.22, 0.25]
    for f in range(1, NF + 1):
        for e in EMPUJES:
            if e["start"] is not None and 0 <= f - e["start"] < len(PUSH):
                e["pusher"].location = e["base"] + e["dir"] * PUSH[f - e["start"]]
        scene.frame_set(f)
        dg = bpy.context.evaluated_depsgraph_get()
        for d in DOMS:
            m = d["obj"].evaluated_get(dg).matrix_world
            q = m.to_quaternion(); l = m.to_translation()
            rec[d["obj"].name].append((l.x, l.y, l.z, q.w, q.x, q.y, q.z))
            tilt[d["obj"].name] = tilt_of(q)
        for e in EMPUJES:
            if e["start"] is None and tilt[e["src"]["obj"].name] > 30:
                e["start"] = f + 1
        if f % 30 == 0:
            print("[sim] cuadro", f, "caídas:", sum(1 for v in tilt.values() if v > 45), "/", len(DOMS), flush=True)
    # limpiar física: todo queda en keyframes
    for ob in list(rbw.collection.objects): rbw.collection.objects.unlink(ob)
    bpy.ops.rigidbody.world_remove()
    for e in EMPUJES:
        bpy.data.objects.remove(e["pusher"])
    return rec

cache_path = os.path.join(OUT, "sim_cache.json")
if USE_CACHE and os.path.exists(cache_path):
    REC = json.load(open(cache_path)); print("[domino] sim desde caché")
else:
    REC = simular(); json.dump(REC, open(cache_path, "w"))

# ---------------------------------------------------------------- horneado a keyframes
def fall_frame(name, thr=45):
    for i, r in enumerate(REC[name]):
        if tilt_of(Quaternion(r[3:7])) > thr: return i + 1
    return None
nkeys = 0
for d in DOMS:
    ob = d["obj"]; r = REC[ob.name]; ob.rotation_mode = 'QUATERNION'
    mov = [False] * NF
    for i in range(1, NF):
        a, bq = r[i - 1], r[i]
        if max(abs(a[k] - bq[k]) for k in range(7)) > 2e-5: mov[i] = True; mov[i - 1] = True
    prevq = None
    for i in range(NF):
        if not (mov[i] or i == 0 or i == NF - 1): continue
        q = Quaternion(r[i][3:7])
        if prevq is not None and q.dot(prevq) < 0: q.negate()
        prevq = q
        ob.location = r[i][0:3]; ob.rotation_quaternion = q
        ob.keyframe_insert("location", frame=i + 1); ob.keyframe_insert("rotation_quaternion", frame=i + 1); nkeys += 1
print("[domino] keyframes:", nkeys)

# ---------------------------------------------------------------- medición de la ola
main = BY["main"]
ff_main = [fall_frame(d["obj"].name) for d in main]
def frame_at_s(cond):
    """cuadro en que cae la primera ficha de la cadena principal que cumple cond(p, s)"""
    for d, ff, it in zip(main, ff_main, STROKES[0]["items"]):
        if cond(d["p"], it[0]): return ff or NF
    return NF
sA = 2 * XR                                   # fin de la fila A
sB0 = sA + math.pi * rAB; sB1 = sB0 + 2 * XR
sC0 = sB1 + math.pi * rBC; sC1 = sC0 + 2 * XR
sF0 = sC1 + math.pi * rCF
fr = lambda s: frame_at_s(lambda p, ss: ss >= s)
fAB, fB0, fB1, fC0, fC1, fF0 = fr(sA), fr(sB0), fr(sB1), fr(sC0), fr(sC1), fr(sF0)
fFend = ff_main[-1] or NF
all_ff = [fall_frame(d["obj"].name) for d in DOMS]
stuck = [d["obj"].name for d, x in zip(DOMS, all_ff) if x is None]
fEND = max(x for x in all_ff if x) + 5
EV = dict(fAB=fAB, fB0=fB0, fB1=fB1, fC0=fC0, fC1=fC1, fF0=fF0, fFend=fFend, fEND=fEND, sin_caer=stuck)
for st in STROKES:
    l = [fall_frame(d["obj"].name) for d in BY[st["name"]]]
    EV["t_" + st["name"]] = (l[0], l[-1])
print("[domino] eventos:", json.dumps(EV))
json.dump(EV, open(os.path.join(OUT, "eventos.json"), "w"), indent=1)

# frente de ola suavizado (centro de las fichas principales que están cayendo)
wave = []; last = Vector((main[0]["p"].x, main[0]["p"].y))
for f in range(1, NF + 1):
    pts = [d["p"] for d, ff in zip(main, ff_main) if ff and ff - 3 <= f <= ff + 2]
    if pts: last = sum(pts, Vector((0, 0))) / len(pts)
    wave.append(last.copy())
def smooth(arr, sig=5):
    out = []
    for i in range(len(arr)):
        acc = Vector((0, 0)); w = 0
        for j in range(max(0, i - 3 * sig), min(len(arr), i + 3 * sig + 1)):
            g = math.exp(-0.5 * ((i - j) / sig) ** 2); acc += arr[j] * g; w += g
        out.append(acc / w)
    return out
wave = smooth(wave)

# ---------------------------------------------------------------- textos: entran con corte seco
def pop(key, f):
    ob = TXT[key]; f = int(f)
    ob.hide_render = True; ob.hide_viewport = True
    ob.keyframe_insert("hide_render", frame=1); ob.keyframe_insert("hide_viewport", frame=1)
    ob.hide_render = False; ob.hide_viewport = False
    ob.keyframe_insert("hide_render", frame=f); ob.keyframe_insert("hide_viewport", frame=f)
fx = lambda x, row_s0, sign: fr(row_s0 + (x - (-XR)) if sign > 0 else row_s0 + (XR - x))
pop("uno", 2); pop("idea", 8)
pop("tu", fx(-XR + 0.6, sB0, 1)); pop("trabaja", fx(-0.6 * KX, sB0, 1))
pop("mientras", fB1 + 2); pop("duermes", fC0 + 1)
pop("comenta", fEND + 2)
TXT["uno"].hide_render = False

# ---------------------------------------------------------------- luces y mundo
def luz(name, tipo, loc, target, energy, color, **kw):
    li = bpy.data.lights.new(name, tipo); li.energy = energy; li.color = color
    for k, v in kw.items():
        try: setattr(li, k, v)
        except Exception: pass
    ob = bpy.data.objects.new(name, li); ob.location = loc; col_set.objects.link(ob)
    d = Vector(target) - Vector(loc); ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return ob
luz("Clave_calida", 'SPOT', (11, 19, 9.5), (0, 6.3, 0), 62000, (1.0, 0.74, 0.46),
    spot_size=math.radians(74), spot_blend=0.75, shadow_soft_size=0.55)
luz("Relleno_frio", 'AREA', (-9, -6, 13), (0, 5.5, 0), 5200, (0.62, 0.74, 1.0), shape='SQUARE', size=14, specular_factor=0.0)
luz("Cenital_suave", 'AREA', (0, 5.5, 17), (0, 5.5, 0), 4200, (1.0, 0.90, 0.78), shape='SQUARE', size=10, specular_factor=0.0)
luz("Contra_palabra", 'SPOT', (-10, 3, 6), (0, 1.2, 0), 14000, (1.0, 0.80, 0.55),
    spot_size=math.radians(70), spot_blend=0.8, shadow_soft_size=0.6)
w = bpy.data.worlds.new("Mundo"); scene.world = w
try: w.use_nodes = True
except Exception: pass
bg = w.node_tree.nodes.get("Background") if w.node_tree else None
if bg:
    bg.inputs[0].default_value = (0.10, 0.065, 0.045, 1); bg.inputs[1].default_value = 0.55

# motas de polvo en la luz
m_polvo, nt, b = new_mat("polvo")
setin(b, Base_Color=(1, 0.85, 0.6, 1), Emission_Color=(1, 0.82, 0.55, 1), Emission_Strength=4.0)
pm = bpy.data.meshes.new("mota"); bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
bm.to_mesh(pm); bm.free(); pm.materials.append(m_polvo)
for i in range(110):
    ob = bpy.data.objects.new("mota_%03d" % i, pm)
    p = Vector((random.uniform(-7.5, 7.5), random.uniform(-1.5, 14), random.uniform(0.5, 4.5)))
    ob.scale = (random.uniform(0.004, 0.009),) * 3; ob.location = p; col_aux.objects.link(ob)
    ob.keyframe_insert("location", frame=1)
    ob.location = p + Vector((random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), random.uniform(-0.15, 0.3)))
    ob.keyframe_insert("location", frame=NF)

# ---------------------------------------------------------------- cámara desde la ola
cam_d = bpy.data.cameras.new("Cam"); cam = bpy.data.objects.new("Cam", cam_d); col_set.objects.link(cam)
scene.camera = cam; cam_d.clip_start = 0.1; cam_d.clip_end = 400; cam_d.sensor_width = 36
cam_d.dof.use_dof = True; cam_d.dof.aperture_blades = 7
cam.rotation_mode = 'QUATERNION'
CEN = Vector((0.0, 5.95))
SW = 36 * 9 / 16   # ancho efectivo del sensor en vertical
def dist_for(width, lens): return width * lens / SW
#       cuadro, el, az, dist, lens, wfix, toff, fstop
KEYS = [
    (1,                 33, -20, 3.3, 34, 0.0, 0.35, 0.16),
    (F_START + 14,      12, -40, 2.7, 32, 0.0, 0.10, 0.14),
    (fAB,               16, -24, 4.0, 32, 0.0, 0.25, 0.16),
    ((fB0 + fB1) / 2,   34,  16, 8.2 * KX, 30, 0.0, 1.00, 0.22),
    (fB1,               41,  12, 9.2 * KX, 30, 0.0, 0.90, 0.25),
    ((fC0 + fC1) / 2,   55,  -9, 11.5 * KX, 32, 0.0, 0.90, 0.30),
    (fC1,               63,  -5, 14.5 * KX, 34, 0.25, 0.60, 0.36),
    ((fF0 + fFend) / 2, 60,  -7, 25.0 * KX, 40, 0.70, 0.0, 0.45),      # la palabra cae vista en oblicuo (grúa subiendo)
    (fEND,              79,  -2, dist_for(15.0 * KX, 50), 50, 1.0, 0.0, 0.8),
    (NF,                90,   0, dist_for(13.3 * KX, 50), 50, 1.0, 0.0, 0.9),
]
KEYS = [tuple(float(v) for v in k) for k in KEYS]
def pchip(xs, ys, x):
    n = len(xs); h = [xs[i + 1] - xs[i] for i in range(n - 1)]; dl = [(ys[i + 1] - ys[i]) / h[i] for i in range(n - 1)]
    m = [0.0] * n; m[0] = dl[0]; m[-1] = dl[-1]
    for i in range(1, n - 1):
        if dl[i - 1] * dl[i] <= 0: m[i] = 0.0
        else:
            w1 = 2 * h[i] + h[i - 1]; w2 = h[i] + 2 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / dl[i - 1] + w2 / dl[i])
    i = max(0, min(n - 2, bisect.bisect_right(xs, x) - 1)); t = (x - xs[i]) / h[i]
    h00 = 2 * t ** 3 - 3 * t ** 2 + 1; h10 = t ** 3 - 2 * t ** 2 + t; h01 = -2 * t ** 3 + 3 * t ** 2; h11 = t ** 3 - t ** 2
    return h00 * ys[i] + h10 * h[i] * m[i] + h01 * ys[i + 1] + h11 * h[i] * m[i + 1]
xs = [k[0] for k in KEYS]
foco = bpy.data.objects.new("Foco", None); col_aux.objects.link(foco); cam_d.dof.focus_object = foco
for f in range(1, NF + 1):
    el, az, dist, lens, wfix, toff, fstop = [pchip(xs, [k[j] for k in KEYS], f) for j in range(1, 8)]
    el = math.radians(min(el, 90)); az = math.radians(az); wfix = max(0, min(1, wfix))
    wv = wave[f - 1]
    tg2 = wv * (1 - wfix) + CEN * wfix
    tg = Vector((tg2.x, tg2.y + toff * (1 - wfix), 0.12 * (1 - wfix)))
    d = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    pos = tg + d * dist; fw = -d; right = Vector((math.cos(az), math.sin(az), 0)); up = right.cross(fw)
    M = Matrix((right, up, -fw)).transposed()
    cam.location = pos; cam.rotation_quaternion = M.to_quaternion()
    cam.keyframe_insert("location", frame=f); cam.keyframe_insert("rotation_quaternion", frame=f)
    cam_d.lens = lens; cam_d.keyframe_insert("lens", frame=f)
    cam_d.dof.aperture_fstop = fstop; cam_d.dof.keyframe_insert("aperture_fstop", frame=f)
    # el foco va sobre la ola (un poco por delante) y termina en el centro de la palabra
    fo = Vector((wv.x, wv.y, 0.2)) * (1 - wfix) + Vector((0, 1.2, 0)) * wfix
    foco.location = fo; foco.keyframe_insert("location", frame=f)

# ---------------------------------------------------------------- render
r = scene.render
r.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in type(r).bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE_NEXT'
r.resolution_x, r.resolution_y, r.resolution_percentage = 1080, 1920, SCALE
r.image_settings.file_format = 'PNG'; r.filepath = "//frames/f_"
r.use_motion_blur = True; r.motion_blur_shutter = 0.35
ee = scene.eevee
for k, v in dict(taa_render_samples=SAMPLES, use_raytracing=True, ray_tracing_method='SCREEN', use_shadows=True,
                 shadow_ray_count=2, shadow_step_count=6, use_bokeh_jittered=True, bokeh_max_size=80.0,
                 motion_blur_steps=1, use_fast_gi=False).items():
    try: setattr(ee, k, v)
    except Exception as ex: print("[eevee] sin", k, ex)
try: ee.ray_tracing_options.resolution_scale = '2'
except Exception: pass
vs = scene.view_settings
try: vs.view_transform = 'AgX'; vs.look = 'AgX - Punchy'
except Exception as ex: print("[cm]", ex)
vs.exposure = 0.0
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "escena.blend"))
print("[domino] guardado escena.blend")
