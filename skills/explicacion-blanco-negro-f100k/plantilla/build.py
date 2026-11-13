# build.py · Plantilla «Explicación en blanco y negro» (explicacion-blanco-negro-f100k)
# Reconstruye la escena entera desde cero en Blender (EEVEE + Freestyle), sin créditos:
#   blender -b -P build.py              → escena.blend (junto a este archivo o en BN_OUT)
#   blender -b escena.blend -a          → cuadros/c_0001.png … c_0300.png
#   ./montar.sh                         → muestra.mp4 (resplandor fino + viñeta + grano), poster.jpg y cuadros.jpg
# Variables de entorno: BN_CONFIG (config.json: textos, cantidad, CTA y colores), BN_OUT (carpeta de salida),
# BN_FONTS (carpeta de letras), BN_SCALE (% de 1080x1920, 100 por defecto), BN_SAMPLES (muestras EEVEE, 16).
# Pruebas rápidas: BN_SCALE=50 y renderiza 3–4 cuadros con -f.
#
# Un solo plano secuencia de 10 s en 4 frases:
#   1) «1 idea»: una esfera de triángulos se arma pieza por pieza.
#   2) «1 idea → N videos»: de la idea salen N arcos; donde aterriza cada uno nace una pantalla y el contador sube.
#   3) «tu equipo trabaja MIENTRAS DUERMES»: las pantallas se pasan el trabajo y aparece el anillo de marcas.
#   4) el globo se pela, la cámara entra y el fondo pasa de oscuro a claro sin corte: «comenta [CTA]».
import bpy, bmesh, math, os, random, json
from math import radians, sin, cos, pi
from mathutils import Vector

AQUI = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("BN_OUT") or AQUI
_here = os.path.join(AQUI, "fuentes") + "/"
FUENTES = os.environ.get("BN_FONTS") or _here
if not FUENTES.endswith("/"): FUENTES += "/"
SCALE = int(os.environ.get("BN_SCALE", "100"))
SAMPLES = int(os.environ.get("BN_SAMPLES", "16"))

# ---------- configuración (config.json) ----------
CFG = {}
_cfg = os.environ.get("BN_CONFIG") or os.path.join(AQUI, "config.json")
if os.path.exists(os.path.expanduser(_cfg)):
    with open(os.path.expanduser(_cfg)) as fh:
        CFG = json.load(fh)
def _g(sec, k, d):
    return (CFG.get(sec) or {}).get(k, d)
CTA = str(CFG.get("cta", "GUÍA")).upper()
F1_NUM, F1_PAL = str(_g("frase1", "numero", "1")), _g("frase1", "palabra", "idea")
F2_DESDE = _g("frase2", "desde", "1 idea")
N = max(3, min(10, int(_g("frase2", "cantidad", 8))))
F2_SING, F2_PLU = _g("frase2", "singular", "video"), _g("frase2", "plural", "videos")
F3_CON, F3_LIN, F3_CLA = _g("frase3", "conector", "tu equipo trabaja"), _g("frase3", "linea", "MIENTRAS"), _g("frase3", "clave", "DUERMES")
F4_CON = _g("frase4", "conector", "comenta")
COL_OSC = _g("colores", "oscuro", "#000000")
COL_CLA = _g("colores", "claro", "#FFFFFF")
COL_ACE = _g("colores", "acento", None)          # opcional: color de las palabras clave y del CTA

def lin(h):
    h = h.lstrip("#")
    def c(x):
        x = int(x, 16) / 255
        return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    return (c(h[0:2]), c(h[2:4]), c(h[4:6]))
OSC, CLA = lin(COL_OSC), lin(COL_CLA)
def mezcla(t):   # t=0 oscuro, t=1 claro
    return tuple(OSC[i] + (CLA[i] - OSC[i]) * t for i in range(3))

FPS, FIN = 30, 300
random.seed(4)

bpy.ops.wm.read_factory_settings(use_empty=True)
try: bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
except Exception: pass
sc = bpy.context.scene
sc.frame_start, sc.frame_end, sc.render.fps = 1, FIN, FPS
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1080, 1920, SCALE
for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try: sc.render.engine = eng; break
    except Exception: pass
try: sc.eevee.taa_render_samples = SAMPLES
except Exception: pass
sc.view_settings.view_transform = 'Standard'
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = os.path.join(OUT, "cuadros", "c_")
w = bpy.data.worlds.new("Fondo"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = OSC + (1,)

# ---------- colecciones ----------
def col(n):
    c = bpy.data.collections.new(n); sc.collection.children.link(c); return c
C_BL, C_NG, C_GRIS, C_OTR = col("LINEA_CLARA"), col("LINEA_OSCURA"), col("LINEA_GRIS"), col("SIN_LINEA")

# ---------- materiales ----------
def emis(n, rgb):
    m = bpy.data.materials.new(n); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    e = nt.nodes.new("ShaderNodeEmission"); o = nt.nodes.new("ShaderNodeOutputMaterial")
    e.inputs[0].default_value = tuple(rgb) + (1,); nt.links.new(e.outputs[0], o.inputs[0]); return m
def mate(n, rgb):
    m = bpy.data.materials.new(n); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = tuple(rgb) + (1,); b.inputs["Roughness"].default_value = 1
    return m
M_BL, M_NG, M_GR = emis("claro", CLA), emis("oscuro", OSC), emis("gris", mezcla(0.55))
M_OSC = mate("relleno", mezcla(0.022))
M_ACE_BL = emis("acento", lin(COL_ACE)) if COL_ACE else M_BL   # clave sobre fondo oscuro
M_ACE_NG = emis("acento2", lin(COL_ACE)) if COL_ACE else M_NG  # CTA sobre fondo claro

# ---------- utilidades ----------
def obj(n, data, c, parent=None, loc=(0, 0, 0), mat=None):
    o = bpy.data.objects.new(n, data); c.objects.link(o); o.location = loc
    if parent: o.parent = parent
    if mat is not None and data is not None: data.materials.append(mat)
    return o
def malla(n, fn):
    me = bpy.data.meshes.new(n); bm = bmesh.new(); fn(bm); bm.to_mesh(me); bm.free(); return me
def caja(bm, sx, sy, sz, c=(0, 0, 0)):
    r = bmesh.ops.create_cube(bm, size=1)
    for v in r["verts"]:
        v.co = Vector((v.co.x * sx + c[0], v.co.y * sy + c[1], v.co.z * sz + c[2]))
    return r["verts"]
def visible(o, f_on, f_off=None):
    if f_on > 1:
        o.hide_render = True; o.keyframe_insert("hide_render", frame=f_on - 1)
    o.hide_render = False; o.keyframe_insert("hide_render", frame=f_on)
    if f_off:
        o.hide_render = True; o.keyframe_insert("hide_render", frame=f_off)
def hornea(o, path, f0, f1, fn, idx=-1):
    for f in range(f0, f1 + 1):
        v = fn(f)
        if idx >= 0: getattr(o, path)[idx] = v
        else: setattr(o, path, v)
        o.keyframe_insert(path, frame=f, index=idx)
def suave(t): t = max(0, min(1, t)); return t * t * (3 - 2 * t)
def sale(t): t = max(0, min(1, t)); return 1 - (1 - t) ** 3
def build(o, f0, dur, rev=False, azar=False, seed=1):
    m = o.modifiers.new("arma", 'BUILD'); m.frame_start = f0; m.frame_duration = dur
    m.use_reverse = rev; m.use_random_order = azar; m.seed = seed; return m
def curva(n, pts, grosor, parent, f0, dur, mat=M_BL, c=None):
    cu = bpy.data.curves.new(n, 'CURVE'); cu.dimensions = '3D'
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts): p.co = (q[0], q[1], q[2], 1)
    cu.bevel_depth = grosor; cu.bevel_resolution = 2; cu.use_fill_caps = True
    o = obj(n, cu, c or C_OTR, parent, mat=mat)
    visible(o, f0 + 1)
    for f in range(f0, f0 + dur + 1):
        cu.bevel_factor_end = max(0.001, sale((f - f0) / dur)); cu.keyframe_insert("bevel_factor_end", frame=f)
    return o
def bez2(a, c, b, n=48):
    a, c, b = Vector(a), Vector(c), Vector(b)
    return [(1 - t) ** 2 * a + 2 * (1 - t) * t * c + t * t * b for t in [i / (n - 1) for i in range(n)]]

# ---------- tiempos (cuadros) ----------
SALE = [75 + 9 * i for i in range(N)]      # sale el arco i
LLEGA = [s + 12 for s in SALE]              # aterriza y nace la pantalla i (87…150)
F_TXT_C, F_PELA, F_NUCLEO = 172, 230, 228
R_GLOBO, R_ANILLO, Z_IDEA = 2.0, 3.5, 3.3

# ---------- anillo giratorio (idea + arcos + pantallas + marcas) ----------
ANILLO = obj("ANILLO", None, C_OTR)
hornea(ANILLO, "rotation_euler", 1, FIN, lambda f: radians(55) * (f - 1) / (FIN - 1), 2)

# la idea: icosfera alámbrica que se arma + punto de luz
idea = obj("idea", malla("idea", lambda bm: bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.34)),
           C_BL, ANILLO, (0, 0, Z_IDEA), M_OSC)
build(idea, -16, 44, azar=True, seed=3)
hornea(idea, "rotation_euler", 1, FIN, lambda f: radians(1.1) * f, 0)
hornea(idea, "rotation_euler", 1, FIN, lambda f: radians(-1.6) * f, 2)
chispa = obj("chispa", malla("chispa", lambda bm: bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.05)),
             C_OTR, ANILLO, (0, 0, Z_IDEA), M_BL)
hornea(chispa, "scale", 1, 240, lambda f: 1 + 0.25 * sin(f * 0.21), 0)
hornea(chispa, "scale", 1, 240, lambda f: 1 + 0.25 * sin(f * 0.21), 1)
hornea(chispa, "scale", 1, 240, lambda f: 1 + 0.25 * sin(f * 0.21), 2)

# órbita guía
curva("orbita", [(R_ANILLO * cos(a), R_ANILLO * sin(a), 0) for a in [2 * pi * i / 160 for i in range(161)]],
      0.006, ANILLO, 66, 80, M_GR)

# N pantallas verticales + arcos desde la idea
PW, PH, PD = 0.62, 1.10, 0.04
def tri_y_barra(bm):
    for s in (1, -1):
        y = s * (PD / 2 + 0.004)
        vs = [bm.verts.new((s * 0.09, y, 0.26)), bm.verts.new((s * 0.09, y, 0.0)), bm.verts.new((-s * 0.13, y, 0.13))]
        bm.faces.new(vs)
for i in range(N):
    th = 2 * pi * i / N
    cx, cy = R_ANILLO * cos(th), R_ANILLO * sin(th)
    p = obj(f"pantalla{i}", malla(f"pantalla{i}", lambda bm: caja(bm, PW, PD, PH)), C_BL, ANILLO, (cx, cy, 0), M_OSC)
    p.rotation_euler[2] = th - pi / 2
    build(p, LLEGA[i] - 1, 7)
    t = obj(f"play{i}", malla(f"play{i}", tri_y_barra), C_OTR, p, mat=M_BL); visible(t, LLEGA[i] + 5)
    for s in (1, -1):   # barra de avance que se llena (una por cara)
        b = obj(f"barra{i}{s}", malla(f"barra{i}{s}", lambda bm: caja(bm, PW - 0.14, 0.004, 0.028, ((PW - 0.14) / 2, 0, 0))),
                C_OTR, p, (-(PW - 0.14) / 2, s * (PD / 2 + 0.004), -0.36), M_BL)
        visible(b, LLEGA[i] + 5)
        hornea(b, "scale", LLEGA[i] + 5, 262, lambda f, L=LLEGA[i]: max(0.02, min(1, (f - L - 5) / 95)), 0)
    ctrl = (3.3 * cos(th), 3.3 * sin(th), 3.6)
    curva(f"arco{i}", bez2((0, 0, Z_IDEA), ctrl, (cx, cy, PH / 2)), 0.007, ANILLO, SALE[i], 12)
    # el equipo se pasa el trabajo: arcos entre pantallas vecinas
    th2 = 2 * pi * (i + 1) / N; tm = (th + th2) / 2
    curva(f"relevo{i}", bez2((cx, cy, PH / 2), (4.5 * cos(tm), 4.5 * sin(tm), 1.5),
                              (R_ANILLO * cos(th2), R_ANILLO * sin(th2), PH / 2), 32), 0.006, ANILLO, F_TXT_C + 6 * i, 12)

# anillo de marcas técnicas
def marcas_fn(r, n, corto, largo, ancho, plano='XY'):
    def fn(bm):
        for k in range(n):
            a = 2 * pi * k / n; L = largo if k % 5 == 0 else corto
            vs = caja(bm, L, ancho, ancho, (r + L / 2, 0, 0))
            for v in vs:
                x, y = v.co.x * cos(a) - v.co.y * sin(a), v.co.x * sin(a) + v.co.y * cos(a)
                v.co = Vector((x, y, v.co.z)) if plano == 'XY' else Vector((x, v.co.z, y))
    return fn
marcas = obj("marcas", malla("marcas", marcas_fn(4.15, 120, 0.09, 0.24, 0.014)), C_OTR, ANILLO, mat=M_BL)
build(marcas, 163, 44)

# ---------- globo de meridianos ----------
globo = obj("globo", malla("globo", lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=R_GLOBO)),
            C_BL, mat=M_OSC)
build(globo, 48, 74)
build(globo, F_PELA, 22, rev=True, azar=True, seed=7)
hornea(globo, "rotation_euler", 1, FIN, lambda f: radians(-45) * (f - 1) / (FIN - 1), 2)
globo.rotation_euler[0] = radians(12)

# núcleo blanco (la fábrica por dentro): aparece cuando el globo ya está cerrado
def esfera_lisa(bm):
    bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=32, radius=1.95)
    for f in bm.faces: f.smooth = True
nucleo = obj("nucleo", malla("nucleo", esfera_lisa), C_OTR, mat=M_BL); visible(nucleo, F_NUCLEO)

jaula = obj("jaula", malla("jaula", lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=10, radius=1.9)),
            C_GRIS, mat=M_BL)
visible(jaula, F_NUCLEO); jaula.rotation_euler[0] = radians(12)
hornea(jaula, "rotation_euler", F_NUCLEO, FIN, lambda f: radians(0.35) * (f - F_NUCLEO), 2)

# abanico de N videos en línea negra dentro del núcleo
AZ_FIN = 140
ABANICO = obj("ABANICO", None, C_OTR); ABANICO.rotation_euler[2] = radians(AZ_FIN + 90)
CW, CH = 0.24, 0.42
for i in range(N):
    def carta(bm, i=i):
        caja(bm, CW, 0.003, CH, (0, 0, CH / 2))
    c = obj(f"video{i}", malla(f"video{i}", carta), C_NG, ABANICO, (0, 0.006 * i, -0.30), M_BL)
    visible(c, F_NUCLEO)
    ang = radians((i - (N - 1) / 2) * 80.5 / (N - 1))   # abanico de ~80° sea cual sea N
    hornea(c, "rotation_euler", 250, FIN, lambda f, a=ang, i=i: a * (sale((f - 256 - i) / 30) + 0.06 * (f - 256) / 44), 1)
    def tri(bm):
        bm.faces.new([bm.verts.new((-0.035, -0.004, CH / 2 + 0.05)), bm.verts.new((-0.035, -0.004, CH / 2 - 0.05)),
                      bm.verts.new((0.05, -0.004, CH / 2))])
    t = obj(f"vplay{i}", malla(f"vplay{i}", tri), C_OTR, c, mat=M_NG); visible(t, F_NUCLEO)
marcas2 = obj("marcas_negras", malla("marcas_negras", marcas_fn(0.44, 72, 0.012, 0.034, 0.0022, 'XZ')),
              C_OTR, ABANICO, (0, 0.06, -0.09), M_NG)
visible(marcas2, F_NUCLEO); build(marcas2, 258, 34)
hornea(marcas2, "rotation_euler", 250, FIN, lambda f: radians(0.5) * (f - 250), 1)

# ---------- polvo de puntos (paralaje) ----------
def polvo(bm):
    for _ in range(260):
        d = Vector((random.gauss(0, 1), random.gauss(0, 1), random.gauss(0, 1))).normalized()
        r = random.uniform(7, 34); s = random.uniform(0.007, 0.017) * (1 + r / 14)
        vs = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=s)["verts"]
        for v in vs: v.co += d * r
obj("polvo", malla("polvo", polvo), C_OTR, mat=M_GR)

# ---------- luz ----------
sol = obj("sol", bpy.data.lights.new("sol", 'SUN'), C_OTR); sol.data.energy = 3.0
sol.rotation_euler = (radians(55), 0, radians(150))

# ---------- cámara: un solo plano que orbita y avanza (nunca se detiene) ----------
def pchip(xs, ys):
    n = len(xs); h = [xs[i + 1] - xs[i] for i in range(n - 1)]; d = [(ys[i + 1] - ys[i]) / h[i] for i in range(n - 1)]
    m = [d[0]] + [0] * (n - 2) + [d[-1]]
    for i in range(1, n - 1):
        if d[i - 1] * d[i] > 0:
            w1, w2 = 2 * h[i] + h[i - 1], h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
    def f(x):
        i = max(0, min(n - 2, next((k for k in range(n - 1) if x < xs[k + 1]), n - 2)))
        t = (x - xs[i]) / h[i]; t2, t3 = t * t, t * t * t
        return ((2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i]
                + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1])
    return f
#        cuadro  az    el   dist   mira_z
CLAVES = [(1,   -30,   6,   2.7,  3.52),
          (52,   -4,  11,   3.5,  3.62),
          (108,  34,  20,  14.0,  1.75),
          (165,  70,  24,  16.0,  1.95),
          (230, 108,  13,  11.5,  1.35),
          (257, 125,   8,   1.85, 0.40),
          (300, 152,   4,   1.62, 0.26)]
fx = [k[0] for k in CLAVES]
F_AZ, F_EL, F_D, F_Z = (pchip(fx, [k[j] for k in CLAVES]) for j in (1, 2, 3, 4))
camd = bpy.data.cameras.new("cam"); camd.lens = 35; camd.sensor_fit = 'VERTICAL'; camd.sensor_height = 36
camd.clip_start, camd.clip_end = 0.01, 200
cam = obj("camara", camd, C_OTR); sc.camera = cam; cam.rotation_mode = 'QUATERNION'
prev = None
for f in range(1, FIN + 1):
    az, el, d, z = radians(F_AZ(f)), radians(F_EL(f)), F_D(f), F_Z(f)
    pos = Vector((d * cos(el) * cos(az), d * cos(el) * sin(az), d * sin(el) + (z if d > 3 else z * 0 + z)))
    if f <= 108:   # al principio orbita alrededor de la idea, después del globo
        k = suave((f - 52) / 56)
        pos = Vector((d * cos(el) * cos(az), d * cos(el) * sin(az), d * sin(el) + Z_IDEA * (1 - k)))
    else:
        pos = Vector((d * cos(el) * cos(az), d * cos(el) * sin(az), d * sin(el)))
    q = (Vector((0, 0, z)) - pos).to_track_quat('-Z', 'Y')
    if prev is not None and q.dot(prev) < 0: q.negate()
    prev = q.copy()
    cam.location = pos; cam.rotation_quaternion = q
    cam.keyframe_insert("location", frame=f); cam.keyframe_insert("rotation_quaternion", frame=f)

# ---------- texto: pegado a la cámara, palabras que entran con corte seco ----------
# Coordenadas en píxeles de 1080×1920 (x al centro de la palabra, base = línea de base). Nada debajo de y≈1650.
DT = 0.5; PX = DT * (18 / 35) / 960
HUD = obj("HUD", None, C_OTR, cam, (0, 0, -DT))
ANTON = bpy.data.fonts.load(FUENTES + "Anton-Regular.ttf")
SERIF = bpy.data.fonts.load(FUENTES + "InstrumentSerif-Italic.ttf")
def texto(s, font, x, base, em=None, ancho=None, mat=M_BL, on=1, off=None, align='CENTER', maxw=960, maxem=None):
    cu = bpy.data.curves.new("t_" + s, 'FONT'); cu.body = s; cu.font = font
    cu.align_x = align; cu.align_y = 'BOTTOM_BASELINE'; cu.size = (em or 100) * PX
    o = obj("t_" + s, cu, C_OTR, HUD, ((x - 540) * PX, (960 - base) * PX, 0), mat)
    bpy.context.view_layer.update()
    if ancho:   # la clave ocupa siempre el mismo ancho
        cu.size *= ancho * PX / max(o.dimensions.x, 1e-9)
        if maxem: cu.size = min(cu.size, maxem * PX)   # una palabra corta no se dispara de alto
    elif o.dimensions.x > maxw * PX:   # una palabra larga se achica para no salirse
        cu.size *= maxw * PX / o.dimensions.x
    visible(o, on, off); return o
# 1 · «1 idea»
texto(F1_NUM, ANTON, 540, 560, em=330, on=1, off=66, maxw=900)
texto(F1_PAL, SERIF, 540, 690, em=150, on=10, off=66, maxw=900)
# 2 · «1 idea → N videos» (el contador sube con cada pantalla que aterriza)
F_B0, F_B1 = 66, F_TXT_C - 2
texto(F2_DESDE, SERIF, 650, 330, em=120, on=F_B0, off=F_B1, align='RIGHT', maxw=560)
fl = obj("flecha", malla("flecha", lambda bm: (caja(bm, 86 * PX, 1e-5, 5 * PX, (0, 0, 0)),)), C_OTR, HUD,
         ((720 - 540) * PX, (960 - 300) * PX, 0), M_BL)
def punta(bm):
    bm.faces.new([bm.verts.new((43 * PX, 0, 0)), bm.verts.new((20 * PX, 0, 16 * PX)), bm.verts.new((20 * PX, 0, -16 * PX))])
pf = obj("flecha_punta", malla("flecha_punta", punta), C_OTR, fl, mat=M_BL)
fl.rotation_euler[0] = radians(90)
visible(fl, F_B0, F_B1); visible(pf, F_B0, F_B1)
for i in range(N):
    texto(str(i + 1), ANTON, 470, 610, em=300, mat=M_ACE_BL, on=LLEGA[i],
          off=(LLEGA[i + 1] if i < N - 1 else F_B1), align='RIGHT')
texto(F2_SING, ANTON, 500, 610, em=118, on=LLEGA[0], off=LLEGA[1], align='LEFT', maxw=520)   # singular con el 1
texto(F2_PLU, ANTON, 500, 610, em=118, on=LLEGA[1], off=F_B1, align='LEFT', maxw=520)
# 3 · «tu equipo trabaja MIENTRAS DUERMES»
texto(F3_CON, SERIF, 540, 290, em=112, on=F_TXT_C, off=F_PELA + 4)
texto(F3_LIN, ANTON, 540, 410, em=120, on=F_TXT_C + 13, off=F_PELA + 4)
def bajo(o, techo, k):   # la clave baja según su alto real: nunca pisa la línea de arriba
    em = o.data.size / PX; o.location.y = (960 - (techo + em * k)) * PX
bajo(texto(F3_CLA, ANTON, 540, 610, ancho=620, maxem=300, mat=M_ACE_BL, on=F_TXT_C + 25, off=F_PELA + 4), 430, 0.78)
# 4 · «comenta [CTA]» (oscuro sobre claro)
texto(F4_CON, SERIF, 540, 350, em=140, mat=M_NG, on=266)
bajo(texto(CTA, ANTON, 540, 700, ancho=820, maxem=440, mat=M_ACE_NG, on=276), 400, 0.92)

# ---------- Freestyle: línea técnica fina ----------
sc.render.use_freestyle = True
sc.render.line_thickness_mode = 'RELATIVE'; sc.render.line_thickness = 1.0
vl = sc.view_layers[0]; fs = vl.freestyle_settings
fs.crease_angle = radians(179); fs.use_culling = True; fs.as_render_pass = False
for l in list(fs.linesets): fs.linesets.remove(l)
def lineas(n, c, color, grosor, lejos):
    ls = fs.linesets.new(n); ls.select_by_collection = True; ls.collection = c
    ls.select_by_visibility = True; ls.visibility = 'VISIBLE'; ls.select_by_edge_types = True
    ls.select_silhouette = ls.select_border = ls.select_crease = True
    st = bpy.data.linestyles.new(n); ls.linestyle = st
    st.color = color; st.thickness = grosor; st.thickness_position = 'CENTER'
    if lejos:   # las líneas lejanas se apagan: profundidad sin perder nitidez
        m = st.alpha_modifiers.new("lejos", 'DISTANCE_FROM_CAMERA')
        m.range_min, m.range_max = 5, 26; m.invert = True; m.blend = 'MIX'; m.influence = 0.6
lineas("claras", C_BL, CLA, 0.34, True)
lineas("oscuras", C_NG, OSC, 0.34, False)
lineas("grises", C_GRIS, mezcla(0.72), 0.26, False)

os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "escena.blend"))
print("OK escena.blend →", OUT, "· CTA:", CTA, "· pantallas:", N)
