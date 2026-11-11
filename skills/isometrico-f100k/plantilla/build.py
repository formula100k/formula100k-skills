# build.py · Plantilla «Isométrico» (isometrico-f100k)
# Maqueta isométrica en 3D: 4 estaciones unidas por un cable que se dibuja solo, toma continua de 11 s.
# Reconstruye la escena entera desde cero en Blender (EEVEE), sin créditos:
#   ISO_CONFIG=config.json blender -b --factory-startup -P build.py   → escena.blend (junto a este archivo o en ISO_OUT)
#   blender -b escena.blend -a                                        → frames/f_0001.png … f_0330.png
#   ./post.sh                                                         → muestra.mp4 (grano y viñeta finos), poster.jpg, hoja.jpg
# Variables de entorno: ISO_CONFIG (config.json: textos, CTA y colores), ISO_OUT (carpeta de salida),
# ISO_FONTS (carpeta de letras), ISO_SCALE (% de 1080x1920, 100 por defecto), ISO_SAMPLES (muestras EEVEE, 32),
# ISO_FSTOP (diafragma base, 4.0). Pruebas rápidas: ISO_SCALE=50 ISO_SAMPLES=12 y renderiza 3 cuadros con -f.
import bpy, bmesh, math, os, random, json
from mathutils import Vector, Euler

HERE = os.environ.get("ISO_OUT") or os.path.dirname(os.path.abspath(__file__))
_here = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fuentes")
FUENTES = os.environ.get("ISO_FONTS") or _here
SCALE = int(os.environ.get("ISO_SCALE", "100"))
SAMPLES = int(os.environ.get("ISO_SAMPLES", "32"))
FPS = 30
DUR = 11.0
NF = int(DUR * FPS)

# ---------------------------------------------------------------- configuración (textos, CTA y colores)
CFG = {}
if os.environ.get("ISO_CONFIG"):
    with open(os.path.expanduser(os.environ["ISO_CONFIG"])) as fh:
        CFG = json.load(fh)
CTA = CFG.get("cta", "GUÍA").upper()
CTA_CHICA = CFG.get("cta_chica", "Comenta")
GANCHO = dict(chica="De una idea a", grande=["VIDEOS", "LISTOS"])
GANCHO.update(CFG.get("gancho", {}))
EST = CFG.get("estaciones") or [
    {"titulo": "IDEAS", "renglon": "llega una idea"},
    {"titulo": "GUIONES", "renglon": "se vuelve guion"},
    {"titulo": "EDICIÓN", "renglon": "se edita sola"},
    {"titulo": "PUBLICAR", "renglon": "listos para subir"},
]
COLS = dict(acento="#FFD43A", cable="#5B86F2", tinta="#2A2733", asistentes="#EC8A62",
            muros=["#F7C9AC", "#BFE5D0", "#D0C2EE", "#BBD9F4"],
            suelos=["#FDE7D8", "#E2F4EA", "#EAE3F8", "#E1EEFA"])
COLS.update(CFG.get("colores", {}))

def F(t):
    return int(round(t * FPS)) + 1

# ---------------------------------------------------------------- escena limpia
bpy.ops.wm.read_factory_settings(use_empty=True)
S = bpy.context.scene
bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
S.render.engine = 'BLENDER_EEVEE'
S.render.resolution_x, S.render.resolution_y = 1080, 1920
S.render.resolution_percentage = SCALE
S.render.fps = FPS
S.frame_start, S.frame_end = 1, NF
S.render.image_settings.file_format = 'PNG'
S.render.filepath = "//frames/f_"
S.render.film_transparent = False
try:
    S.view_settings.view_transform = 'Standard'
    S.view_settings.look = 'None'
except Exception as e:
    print("view transform:", e)
ee = S.eevee
ee.taa_render_samples = SAMPLES
ee.use_shadows = True
ee.use_raytracing = True          # AO / rebote suave entre volúmenes
try:
    ee.ray_tracing_method = 'SCREEN'
    ee.fast_gi_method = 'GLOBAL_ILLUMINATION'
    ee.fast_gi_distance = 2.5
    ee.ray_tracing_options.resolution_scale = '2'
except Exception as e:
    print("eevee gi:", e)
ee.bokeh_max_size = 60

# ---------------------------------------------------------------- ejes isométricos
CAMROT = Euler((math.radians(60), 0, math.radians(45)))   # 60° = coherente con RIGHT/UP/D y scr()
RIGHT = Vector((0.70711, 0.70711, 0))
UP = Vector((-0.35355, 0.35355, 0.86603))
D = Vector((0.61237, -0.61237, 0.5))      # hacia la cámara

def scr(sx, sy):
    """punto del piso que cae en la coordenada de pantalla (sx, sy)"""
    return Vector(((sx * 1.41421 - sy * 2.82843) / 2, (sx * 1.41421 + sy * 2.82843) / 2, 0))

# ---------------------------------------------------------------- materiales
def hexc(h, a=1.0):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (*c, a)

_mats = {}
def mat(name, col, rough=0.85, emit=None, estr=0.0):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = hexc(col)
    b.inputs["Roughness"].default_value = rough
    try:
        b.inputs["Specular IOR Level"].default_value = 0.25
    except Exception:
        pass
    if emit:
        b.inputs["Emission Color"].default_value = hexc(emit)
        b.inputs["Emission Strength"].default_value = estr
    _mats[name] = m
    return m

def flat(name, col, strength=1.0):
    """color plano sin sombreado (para letras: sin brillo ni degradado)"""
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = hexc(col)
    e.inputs["Strength"].default_value = strength
    o = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(e.outputs[0], o.inputs[0])
    _mats[name] = m
    return m

def bsdf(m):
    return m.node_tree.nodes.get("Principled BSDF")

INK = COLS["tinta"]
M_INK = flat("tinta", INK)
M_WHITE = flat("blanco", "#FFFFFF", 0.95)
M_SLAB = mat("losa", "#FBF6EA")
M_TRIM = mat("remate", "#FFFFFF")
M_DARK = mat("oscuro", "#3A3847", 0.6)
M_WOOD = mat("madera", "#E3C39A")
M_PAPER = mat("papel", "#FFFDF6")
M_ASIS = mat("asistente", COLS["asistentes"], 0.7)
M_CABLE = mat("cable", COLS["cable"], 0.5, COLS["cable"], 0.6)
M_PACK = mat("paquete", COLS["acento"], 0.4, COLS["acento"], 7.0)
M_CUBE = mat("cubo", "#EADFC4")
M_TREE1 = mat("arbol1", "#A9D8B4")
M_TREE2 = mat("arbol2", "#8CC9A8")
M_TRUNK = mat("tronco", "#C9A887")
PASTEL = ["#F4A58A", "#FFD76A", "#9ED9B8", "#8FB8F5", "#C9A8F0", "#F7A8C4", "#7FD3D8", "#FFB870"]

COL = bpy.data.collections.new("maqueta")
S.collection.children.link(COL)

# ---------------------------------------------------------------- primitivas
def _obj(name, bm, m, loc, rot=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    COL.objects.link(o)
    o.location = loc
    if rot is not None:
        o.rotation_euler = rot
    if m:
        me.materials.append(m)
    return o

def box(name, sx, sy, sz, loc, m, anchor=(0.5, 0.5, 0.0), bevel=0.0, rot=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x = (v.co.x + 0.5 - anchor[0]) * sx
        v.co.y = (v.co.y + 0.5 - anchor[1]) * sy
        v.co.z = (v.co.z + 0.5 - anchor[2]) * sz
    o = _obj(name, bm, m, loc, rot)
    if bevel > 0:
        md = o.modifiers.new("b", 'BEVEL')
        md.width = bevel
        md.segments = 2
        md.limit_method = 'ANGLE'
    return o

def cyl(name, r, h, loc, m, seg=12, r2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    for v in bm.verts:
        v.co.z += h / 2
    return _obj(name, bm, m, loc)

def ico(name, r, loc, m, sub=2):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    return _obj(name, bm, m, loc)

def tri(name, s, loc, m, rot=None):
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in ((-0.4 * s, -0.5 * s, 0), (0.5 * s, 0, 0), (-0.4 * s, 0.5 * s, 0))]
    bm.faces.new(vs)
    return _obj(name, bm, m, loc, rot)

_fonts = {}
def font(f):
    if f not in _fonts:
        _fonts[f] = bpy.data.fonts.load(os.path.join(FUENTES, f))
    return _fonts[f]

def text(body, f, size, loc, rot, m, align='LEFT', track=1.0):
    cu = bpy.data.curves.new("t_" + body[:10], 'FONT')
    cu.body = body
    cu.font = font(f)
    cu.size = size
    cu.align_x = align
    cu.space_character = track
    o = bpy.data.objects.new("t_" + body[:10], cu)
    COL.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    cu.materials.append(m)
    return o

def fit(o, maxw):
    """achica la letra si el texto pasa de maxw de largo (para que tus textos no pisen otros módulos)"""
    bpy.context.view_layer.update()
    w = o.dimensions.x
    if w > maxw:
        o.data.size *= maxw / w
    return o

# ---------------------------------------------------------------- animación
def ease(t):
    t = min(1, max(0, t))
    return 1 - (1 - t) ** 3

def grow(o, t0, dur=0.3, axes='xyz'):
    """crece de 0 a su tamaño (sin rebote)"""
    base = o.scale.copy()
    f0 = F(t0)
    n = max(2, int(round(dur * FPS)))
    for i in range(-1, n + 1):
        k = max(ease(i / n), 0.0001) if i >= 0 else 0.0001
        o.scale = (base.x * (k if 'x' in axes else 1), base.y * (k if 'y' in axes else 1), base.z * (k if 'z' in axes else 1))
        if i < 0:
            o.scale = (0, 0, 0)
        o.keyframe_insert('scale', frame=f0 + i)
    o.scale = base

def cut(o, t, t_out=None):
    """corte seco: aparece en un cuadro, sin animación de entrada"""
    base = o.scale.copy()
    f = F(t)
    o.scale = (0, 0, 0); o.keyframe_insert('scale', frame=f - 1)
    o.scale = base; o.keyframe_insert('scale', frame=f)
    if t_out is not None:
        g = F(t_out)
        o.scale = base; o.keyframe_insert('scale', frame=g - 1)
        o.scale = (0, 0, 0); o.keyframe_insert('scale', frame=g)
        o.scale = base

def pchip(ts, vs, t):
    n = len(ts)
    if t <= ts[0]:
        return vs[0]
    if t >= ts[-1]:
        return vs[-1]
    h = [ts[i + 1] - ts[i] for i in range(n - 1)]
    d = [(vs[i + 1] - vs[i]) / h[i] for i in range(n - 1)]
    m = [0.0] * n
    m[0], m[-1] = d[0], d[-1]
    for i in range(1, n - 1):
        m[i] = 0.0 if d[i - 1] * d[i] <= 0 else 2 * d[i - 1] * d[i] / (d[i - 1] + d[i])
    i = max(j for j in range(n - 1) if ts[j] <= t)
    u = (t - ts[i]) / h[i]
    h00 = 2 * u ** 3 - 3 * u ** 2 + 1; h10 = u ** 3 - 2 * u ** 2 + u
    h01 = -2 * u ** 3 + 3 * u ** 2; h11 = u ** 3 - u ** 2
    return h00 * vs[i] + h10 * h[i] * m[i] + h01 * vs[i + 1] + h11 * h[i] * m[i + 1]

def path_point(pts, k):
    """punto a fracción k (0..1) de una polilínea"""
    segs = [(pts[i + 1] - pts[i]).length for i in range(len(pts) - 1)]
    tot = sum(segs)
    d = k * tot
    for i, L in enumerate(segs):
        if d <= L or i == len(segs) - 1:
            return pts[i].lerp(pts[i + 1], min(1, d / L))
        d -= L

# ---------------------------------------------------------------- piso y entorno
fm = bpy.data.materials.new("piso")
fm.use_nodes = True
nt = fm.node_tree
pb = nt.nodes.get("Principled BSDF")
pb.inputs["Roughness"].default_value = 0.95
tc = nt.nodes.new("ShaderNodeTexCoord")
ck = nt.nodes.new("ShaderNodeTexChecker")
ck.inputs["Scale"].default_value = 1.0
ck.inputs["Color1"].default_value = hexc("#F4EBD6")
ck.inputs["Color2"].default_value = hexc("#EFE4CB")
nt.links.new(tc.outputs["Object"], ck.inputs["Vector"])
nt.links.new(ck.outputs["Color"], pb.inputs["Base Color"])
floor = box("piso", 160, 160, 0.2, (4, -9, -0.2), fm)

MODS = [Vector((0, 0, 0)), Vector((0, -8, 0)), Vector((8, -8, 0)), Vector((8, -16, 0))]
WALLC = COLS["muros"]
FLOORC = COLS["suelos"]
NAMES = [(e["titulo"].upper(), e["renglon"]) for e in EST[:4]]
# cables (en el piso, con quiebre como la referencia)
CABLES = [
    [Vector((0.8, -1.85, 0)), Vector((0.8, -4.0, 0)), Vector((-0.8, -4.0, 0)), Vector((-0.8, -6.15, 0))],
    [Vector((1.85, -7.2, 0)), Vector((4.0, -7.2, 0)), Vector((4.0, -8.8, 0)), Vector((6.15, -8.8, 0))],
    [Vector((8.8, -9.85, 0)), Vector((8.8, -12.0, 0)), Vector((7.2, -12.0, 0)), Vector((7.2, -14.15, 0))],
]
# tiempos
T_BUILD = [-0.45, 2.5, 4.6, 6.7]          # arranca la losa de cada módulo
T_CABLE = [(1.75, 2.5), (3.85, 4.6), (5.95, 6.7)]
T_WIDE = 8.6

random.seed(9)
def libre(x, y, r):
    for m in MODS:
        if abs(x - m.x) < 2.7 + r and abs(y - m.y) < 2.7 + r:
            return False
    for c in CABLES:
        xs = [p.x for p in c]; ys = [p.y for p in c]
        if min(xs) - 0.7 - r < x < max(xs) + 0.7 + r and min(ys) - 0.7 - r < y < max(ys) + 0.7 + r:
            return False
    if 1.6 - r < x < 7.0 + r and -7.9 - r < y < 1.0 + r:      # letras del gancho
        return False
    if 9.9 - r < x < 17.2 + r and -26 - r < y < -11.5 + r:   # letras del cierre
        return False
    return True

n = 0
puestos = []
while n < 95:
    x = random.uniform(-16, 26); y = random.uniform(-34, 14)
    r = random.uniform(0.45, 0.95)
    if not libre(x, y, r) or any((x - a) ** 2 + (y - b) ** 2 < (r + c + 0.5) ** 2 for a, b, c in puestos):
        continue
    puestos.append((x, y, r))
    if random.random() < 0.45:
        h = random.uniform(0.35, 1.5)
        box("cubo", r * 1.5, r * 1.5, h, (x, y, 0), M_CUBE, bevel=0.03)
    else:
        s = random.uniform(0.7, 1.2)
        cyl("tronco", 0.09 * s, 0.45 * s, (x, y, 0), M_TRUNK, seg=6)
        tm = random.choice([M_TREE1, M_TREE2])
        cyl("copa", 0.55 * s, 0.9 * s, (x, y, 0.4 * s), tm, seg=7, r2=0.0)
        cyl("copa", 0.4 * s, 0.75 * s, (x, y, 0.9 * s), tm, seg=7, r2=0.0)
    n += 1

# ---------------------------------------------------------------- asistentes (cubos que brincan)
asistentes = []
def asistente(p, t, fase):
    b = box("asistente", 0.46, 0.46, 0.4, p, M_ASIS, bevel=0.07)
    for dx in (-0.11, 0.11):
        e = box("ojo", 0.07, 0.02, 0.11, (dx, -0.235, 0.2), M_DARK)
        e.parent = b
    for dy in (-0.11, 0.11):
        e = box("ojo", 0.02, 0.07, 0.11, (0.235, dy, 0.2), M_DARK)
        e.parent = b
    grow(b, t, 0.25)
    asistentes.append((b, Vector(p), t + 0.3, fase))
    return b

# ---------------------------------------------------------------- módulo base
def modulo(i):
    c = MODS[i]; t = T_BUILD[i]
    wm = mat("muro%d" % i, WALLC[i])
    fl = mat("suelo%d" % i, FLOORC[i])
    slab = box("losa%d" % i, 3.6, 3.6, 0.25, c, M_SLAB, bevel=0.04)
    grow(slab, t, 0.2)
    tile = box("suelo%d" % i, 3.2, 3.2, 0.03, c + Vector((0.1, -0.1, 0.25)), fl)
    grow(tile, t + 0.1, 0.2, 'xy')
    wa = box("muroA%d" % i, 0.2, 3.6, 2.4, c + Vector((-1.7, 0, 0.25)), wm, bevel=0.02)
    wb = box("muroB%d" % i, 3.4, 0.2, 2.4, c + Vector((0.1, 1.7, 0.25)), wm, bevel=0.02)
    for w, dims in ((wa, (0.28, 3.68, 0.1)), (wb, (3.44, 0.28, 0.1))):
        cap = box("remate", *dims, (0, 0, 2.4), M_TRIM)
        cap.parent = w
    grow(wa, t + 0.12, 0.42, 'z')
    grow(wb, t + 0.2, 0.42, 'z')
    # rótulo con línea guía (mecánica de la referencia)
    title, sub = NAMES[i]
    a = c + Vector((-1.7, -0.9, 2.75))
    dot = ico("punto", 0.07, a, M_INK, 1)
    line = box("guia", 0.028, 0.028, 0.75, a, M_INK)
    tp = a + Vector((0, 0, 0.75)) + D * 0.3
    arm = box("guia2", 0.3, 0.028, 0.028, tp, M_INK, anchor=(0, 0.5, 0.5), rot=CAMROT)
    t1 = fit(text(title, "ArchivoBlack-Regular.ttf", 0.46, tp + RIGHT * 0.4 + UP * 0.02, CAMROT, M_INK, track=1.08), 3.0)
    t2 = fit(text(sub, "InstrumentSerif-Italic.ttf", 0.44, tp + RIGHT * 0.4 - UP * 0.42, CAMROT, M_INK), 3.3)
    tl = t + 0.75
    for o in (dot, line, arm, t1):
        cut(o, tl)
    cut(t2, tl + 0.3)
    return c, t

# ---------------------------------------------------------------- M1 · IDEAS
c, t = modulo(0)
z0 = 0.28
cyl("pedestal", 0.5, 0.45, c + Vector((0.1, 0.1, z0)), M_SLAB, seg=10)
ped = bpy.data.objects["pedestal"]; grow(ped, t + 0.5, 0.25)
neck = cyl("casquillo", 0.24, 0.32, c + Vector((0.1, 0.1, z0 + 0.45)), M_DARK, seg=8); grow(neck, t + 0.6, 0.25)
M_BULB = mat("foco", "#FFF3C4", 0.3, "#FFC93A", 0.0)
bulb = ico("foco", 0.6, c + Vector((0.1, 0.1, z0 + 1.3)), M_BULB); grow(bulb, t + 0.7, 0.3)
T_ON = 0.85
es = bsdf(M_BULB).inputs["Emission Strength"]
es.default_value = 0.0; es.keyframe_insert('default_value', frame=F(T_ON) - 1)
for f in range(F(T_ON), NF + 1, 3):
    es.default_value = 4.2 + 1.3 * math.sin(f * 0.21)
    es.keyframe_insert('default_value', frame=f)
for k in range(8):   # rayitos (corte seco al encenderse)
    ang = k * math.pi / 4
    dirv = RIGHT * math.cos(ang) + UP * math.sin(ang)
    r = box("rayo", 0.3, 0.07, 0.03, c + Vector((0.1, 0.1, z0 + 1.3)) + dirv * 0.82 + D * 0.3, mat("rayo", "#FFC93A", 0.5, "#FFC93A", 2.5),
            anchor=(0, 0.5, 0.5), rot=Euler((CAMROT.x, 0, CAMROT.z)))
    r.rotation_mode = 'XYZ'
    # gira dentro del plano de pantalla
    r.rotation_euler = (CAMROT.to_matrix() @ Euler((0, 0, ang)).to_matrix()).to_euler()
    cut(r, T_ON + (0.0 if k % 2 == 0 else 0.13))
# notas adhesivas en el muro A, tablero en el muro B
for k, (yy, zz) in enumerate([(-0.95, 1.75), (-0.3, 1.2), (0.45, 1.8), (1.05, 1.15)]):
    nn = box("nota", 0.04, 0.52, 0.52, c + Vector((-1.58, yy, zz)), mat("nota%d" % k, PASTEL[(k + 1) % 8]))
    cut(nn, 0.5 + k * 0.17)
bd = box("tablero", 2.3, 0.05, 1.25, c + Vector((0.15, 1.58, 1.0)), M_PAPER); grow(bd, t + 0.75, 0.25, 'xz')
for k in range(4):
    ln = box("trazo", [1.7, 1.3, 1.5, 0.8][k], 0.02, 0.09, c + Vector((-0.75, 1.54, 1.95 - k * 0.24)), M_DARK, anchor=(0, 0.5, 0.5))
    grow(ln, 0.75 + k * 0.16, 0.22, 'x')
asistente(c + Vector((1.05, 0.75, z0)), t + 0.6, 0.0)
asistente(c + Vector((-0.55, -1.0, z0)), t + 0.75, 1.4)

# ---------------------------------------------------------------- M2 · GUIONES
c, t = modulo(1)
sh = box("hoja", 2.5, 0.05, 1.8, c + Vector((0.15, 1.58, 0.6)), M_PAPER); grow(sh, t + 0.55, 0.3, 'xz')
for k in range(7):
    ln = box("renglon", [2.0, 1.6, 1.9, 1.2, 1.8, 1.5, 0.9][k], 0.02, 0.1, c + Vector((-0.85, 1.54, 2.15 - k * 0.22)),
             M_DARK if k else mat("titular", PASTEL[0]), anchor=(0, 0.5, 0.5))
    grow(ln, t + 0.85 + k * 0.13, 0.2, 'x')
for k, (yy, col) in enumerate([(-0.75, 3), (0.55, 4)]):
    p = box("pliego", 0.04, 0.95, 1.3, c + Vector((-1.58, yy, 0.85)), M_PAPER); grow(p, t + 0.7 + k * 0.15, 0.25, 'yz')
    for j in range(4):
        ln = box("renglon", 0.02, [0.7, 0.55, 0.65, 0.4][j], 0.07, c + Vector((-1.55, yy - 0.36, 1.95 - j * 0.2)), M_DARK, anchor=(0.5, 0, 0.5))
        grow(ln, t + 1.0 + k * 0.2 + j * 0.1, 0.18, 'y')
desk = box("mesa", 1.25, 0.8, 0.5, c + Vector((0.35, -0.1, z0)), M_WOOD, bevel=0.03); grow(desk, t + 0.5, 0.25)
for k in range(12):   # la pila de guiones crece hoja por hoja
    pg = box("pagina", 0.62, 0.86, 0.045, c + Vector((0.35 + (0.03 if k % 2 else -0.03), -0.1, z0 + 0.5 + k * 0.05)), M_PAPER,
             rot=Euler((0, 0, math.radians([4, -6, 2, -3, 7, -2, 5, -5, 1, -4, 6, 0][k]))))
    cut(pg, t + 0.8 + k * 0.09)
asistente(c + Vector((1.2, 0.95, z0)), t + 0.65, 0.7)
asistente(c + Vector((-0.75, -1.05, z0)), t + 0.8, 2.3)

# ---------------------------------------------------------------- M3 · EDICIÓN
c, t = modulo(2)
scn = box("pantalla", 2.9, 0.07, 1.75, c + Vector((0.15, 1.57, 0.7)), M_DARK, bevel=0.02); grow(scn, t + 0.5, 0.3, 'xz')
M_PREV = mat("previa", "#F7A8C4", 0.4, "#F7A8C4", 1.6)
pv = box("previa", 0.48, 0.02, 0.8, c + Vector((0.15, 1.52, 1.55)), M_PREV); cut(pv, t + 0.85)
ptri = tri("play", 0.26, c + Vector((0.17, 1.5, 1.95)), M_WHITE, rot=Euler((math.radians(90), 0, 0))); cut(ptri, t + 0.85)
bars = [(0, 0.0, 0.8, 0), (0, 0.85, 0.6, 1), (0, 1.5, 1.05, 2), (1, 0.2, 1.1, 3), (1, 1.35, 0.7, 5), (2, 0.0, 0.5, 4), (2, 0.55, 0.9, 6), (2, 1.5, 0.75, 7)]
for k, (row, x0, L, ci) in enumerate(bars):
    b = box("clip", L, 0.02, 0.14, c + Vector((-1.15 + x0, 1.52, 1.4 - row * 0.19)),
            mat("clip%d" % ci, PASTEL[ci], 0.5, PASTEL[ci], 1.1), anchor=(0, 0.5, 0.5))
    grow(b, t + 0.95 + k * 0.1, 0.2, 'x')
ph = box("cabezal", 0.035, 0.02, 0.62, c + Vector((-1.15, 1.5, 0.94)), mat("cabezal", "#FFFFFF", 0.4, "#FFFFFF", 2.2))
cut(ph, t + 0.95)
for f in range(F(t + 0.95), NF + 1):
    k = ((f - F(t + 0.95)) / (1.6 * FPS)) % 1.0
    ph.location.x = c.x - 1.15 + 2.55 * k
    ph.keyframe_insert('location', frame=f)
for k, yy in enumerate((-0.85, 0.05, 0.95)):
    mm = mat("mon%d" % k, PASTEL[[3, 1, 2][k]], 0.4, PASTEL[[3, 1, 2][k]], 1.2)
    m_ = box("monitor", 0.05, 0.72, 0.5, c + Vector((-1.57, yy, 1.35 + (0.25 if k == 1 else 0))), M_DARK); grow(m_, t + 0.6 + k * 0.1, 0.2, 'yz')
    s_ = box("monitorluz", 0.02, 0.6, 0.38, c + Vector((-1.53, yy, 1.41 + (0.25 if k == 1 else 0))), mm); cut(s_, t + 0.9 + k * 0.15)
desk = box("mesa", 0.8, 1.5, 0.45, c + Vector((0.2, -0.2, z0)), M_WOOD, bevel=0.03); grow(desk, t + 0.5, 0.25)
for k, yy in enumerate((-0.55, 0.15)):
    lp = box("laptop", 0.4, 0.5, 0.04, c + Vector((0.25, -0.2 + yy, z0 + 0.45)), M_DARK); grow(lp, t + 0.65, 0.2)
    ls = box("laptoppant", 0.04, 0.5, 0.36, c + Vector((0.03, -0.2 + yy, z0 + 0.47)), mat("lap", "#9ED9B8", 0.4, "#9ED9B8", 1.3)); grow(ls, t + 0.75, 0.2, 'z')
asistente(c + Vector((1.0, -0.6, z0)), t + 0.65, 1.1)
asistente(c + Vector((1.0, 0.35, z0)), t + 0.8, 2.9)

# ---------------------------------------------------------------- M4 · PUBLICAR
c, t = modulo(3)
phone = box("telefono", 1.2, 0.18, 2.15, c + Vector((0.25, 0.45, z0)), M_DARK, bevel=0.06); grow(phone, t + 0.5, 0.35, 'xyz')
M_SCR = mat("telpant", "#F4A58A", 0.3, "#F4A58A", 1.5)
ps = box("telpant", 1.02, 0.02, 1.9, c + Vector((0.25, 0.35, z0 + 0.13)), M_SCR); cut(ps, t + 0.85)
ptri = tri("play", 0.42, c + Vector((0.27, 0.33, z0 + 1.08)), M_WHITE, rot=Euler((math.radians(90), 0, 0))); cut(ptri, t + 0.85)
bn = bsdf(M_SCR)
for k, f in enumerate(range(F(t + 0.85), NF + 1, 11)):     # la pantalla cambia de video (corte seco)
    col = hexc(PASTEL[k % 8])
    for inp in ("Base Color", "Emission Color"):
        if k:
            bn.inputs[inp].keyframe_insert('default_value', frame=f - 1)
        bn.inputs[inp].default_value = col
        bn.inputs[inp].keyframe_insert('default_value', frame=f)
for k in range(12):   # calendario que se llena
    r_, c_ = divmod(k, 3)
    q = box("dia", 0.03, 0.42, 0.34, c + Vector((-1.58, -0.75 + c_ * 0.55, 2.2 - r_ * 0.45)), mat("dia%d" % (k % 8), PASTEL[k % 8]))
    cut(q, t + 0.6 + k * 0.07)
asistente(c + Vector((1.2, -0.5, z0)), t + 0.65, 0.4)
asistente(c + Vector((-0.8, -1.05, z0)), t + 0.8, 2.0)
# 8 videos salen del teléfono, vuelan en arco y aterrizan en fila sobre el piso, camino al cierre
T_CARDS = t + 0.75
src = c + Vector((0.25, 0.2, 1.4))
Q0 = CAMROT.to_quaternion()
Q1 = Euler((0, 0, math.radians(90))).to_quaternion()
for k in range(8):
    dst = Vector((11.0, -12.4 - k * 0.98, 0.015))
    card = box("video%d" % k, 0.82, 1.32, 0.04, src, mat("video%d" % k, PASTEL[k], 0.6, PASTEL[k], 0.25), bevel=0.03)
    card.rotation_mode = 'QUATERNION'
    pt = tri("play", 0.34, (0.02, 0.08, 0.045), M_WHITE); pt.parent = card
    cp = box("pie", 0.5, 0.07, 0.01, (-0.06, -0.48, 0.04), M_WHITE); cp.parent = card
    t0 = T_CARDS + k * 0.1
    n = int(0.55 * FPS)
    for f in range(F(t0) - 1, F(t0) + n + 2):
        u = ease((f - F(t0)) / n)
        card.location = src.lerp(dst, u) + Vector((0, 0, 2.2 * math.sin(math.pi * u)))
        s = 0.0 if f < F(t0) else 0.25 + 0.75 * u
        card.scale = (s, s, s)
        card.rotation_quaternion = Q0.slerp(Q1, u)
        for dp in ('location', 'scale', 'rotation_quaternion'):
            card.keyframe_insert(dp, frame=f)

# ---------------------------------------------------------------- asistentes: saltito constante
for b, p, t0, fase in asistentes:
    for f in range(F(t0), NF + 1, 2):
        tt = (f - 1) / FPS
        b.location = p + Vector((0, 0, 0.16 * abs(math.sin(tt * 4.2 + fase))))
        b.keyframe_insert('location', frame=f)

# ---------------------------------------------------------------- cables y paquetes de luz
for i, pts in enumerate(CABLES):
    ta, tb = T_CABLE[i]
    cu = bpy.data.curves.new("cable%d" % i, 'CURVE')
    cu.dimensions = '3D'
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts):
        p.co = (q.x, q.y, 0.07, 1)
    cu.bevel_depth = 0.075
    cu.bevel_resolution = 2
    cu.use_fill_caps = True
    cu.materials.append(M_CABLE)
    o = bpy.data.objects.new("cable%d" % i, cu)
    COL.objects.link(o)
    cu.bevel_factor_end = 0.0; cu.keyframe_insert('bevel_factor_end', frame=F(ta) - 1)
    for f in range(F(ta), F(tb) + 1):
        cu.bevel_factor_end = (f - F(ta)) / (F(tb) - F(ta))
        cu.keyframe_insert('bevel_factor_end', frame=f)
    for e in (pts[0], pts[-1]):
        sk = box("toma", 0.34, 0.34, 0.2, e, M_DARK, bevel=0.03)
        cut(sk, ta - 0.05 if e is pts[0] else tb)
    # dos paquetes en bucle (el primero viaja con la punta del cable)
    per = 1.1
    for j in range(2):
        pk = box("paquete%d_%d" % (i, j), 0.3, 0.3, 0.3, pts[0], M_PACK, bevel=0.05)
        for f in range(F(ta) - 1, NF + 1):
            tt = (f - 1) / FPS - ta - j * per / 2
            if tt < 0 or (j == 1 and (f - 1) / FPS < tb):
                s = 0.0; k = 0.0
            else:
                ph_ = (tt % per) / (tb - ta)
                k = min(1, ph_); s = 1.0 if ph_ <= 1 else 0.0
            p = path_point(pts, k)
            pk.location = (p.x, p.y, 0.22)
            pk.scale = (s, s, s)
            pk.rotation_euler = (0, 0, tt * 3.0)
            pk.keyframe_insert('location', frame=f); pk.keyframe_insert('scale', frame=f); pk.keyframe_insert('rotation_euler', frame=f)
# la idea sale del foco y entra al primer cable
idea = box("idea", 0.3, 0.3, 0.3, MODS[0], M_PACK, bevel=0.05)
a = MODS[0] + Vector((0.1, 0.1, z0 + 1.3)); b_ = Vector((0.8, -1.85, 0.22))
f0, f1 = F(1.4), F(T_CABLE[0][0])
for f in range(f0 - 1, f1 + 1):
    u = (f - f0) / (f1 - f0)
    s = 0 if (f < f0 or f >= f1) else 1
    p = a.lerp(b_, max(0, u)) + Vector((0, 0, 0.7 * math.sin(math.pi * max(0, u))))
    idea.location = p; idea.scale = (s, s, s)
    idea.keyframe_insert('location', frame=f); idea.keyframe_insert('scale', frame=f)

# ---------------------------------------------------------------- letras pintadas en el piso (isométricas)
FLOORROT = Euler((0, 0, math.radians(90)))     # la línea base sube hacia la derecha
def piso_txt(body, f, size, x, y, m=M_INK, track=1.0):
    return text(body, f, size, (x, y, 0.012), FLOORROT, m, track=track)

# gancho pintado en el piso: renglón chico en itálica + 1 o 2 renglones enormes (máx. ~8 letras cada uno)
G_BIG = [g.upper() for g in GANCHO["grande"]][:2]
h1 = fit(piso_txt(GANCHO["chica"], "InstrumentSerif-Italic.ttf", 0.78, 3.05, -7.1), 7.8)
h2 = fit(piso_txt(G_BIG[0], "ArchivoBlack-Regular.ttf", 1.2, 4.45, -7.15, track=0.97), 7.8)
h3 = fit(piso_txt(G_BIG[1] if len(G_BIG) > 1 else " ", "ArchivoBlack-Regular.ttf", 1.32, 5.95, -7.15, track=0.97), 7.8)
T_HOOK_OUT = 3.4
cut(h1, -1.0, T_HOOK_OUT)
cut(h2, 0.4, T_HOOK_OUT)
cut(h3, 0.75, T_HOOK_OUT)

M_YEL = flat("acento", COLS["acento"])
c1 = fit(piso_txt(CTA_CHICA, "InstrumentSerif-Italic.ttf", 1.25, 12.55, -23.6), 8.0)
c2 = fit(piso_txt(CTA, "ArchivoBlack-Regular.ttf", 2.25, 15.05, -23.4, track=0.98), 11.8)
bpy.context.view_layer.update()
LCTA = c2.dimensions.x                      # la placa de acento mide lo que mide tu palabra
plate = box("placa", 2.75, LCTA + 1.0, 0.01, (14.2, -23.9 + (LCTA + 1.0) / 2, 0.004), M_YEL)
c2.location.z = 0.03      # encima de la placa
cut(c1, 9.15)
cut(plate, 9.5)
cut(c2, 9.5)

# ---------------------------------------------------------------- cámara ortográfica viva
cam_d = bpy.data.cameras.new("cam")
cam_d.type = 'ORTHO'
cam_d.clip_start, cam_d.clip_end = 1, 200
cam = bpy.data.objects.new("cam", cam_d)
COL.objects.link(cam)
S.camera = cam
cam.rotation_euler = CAMROT
cam_d.dof.use_dof = True
cam_d.dof.focus_distance = 60
FSTOP = float(os.environ.get('ISO_FSTOP', '4.0'))
cam_d.dof.aperture_fstop = FSTOP
# (t, sx, sy, escala): centro del encuadre en coordenadas de pantalla
WP = [
    (0.0, 0.45, -0.8, 13.0),
    (1.5, 0.55, -1.1, 11.9),
    (2.3, -1.6, -1.5, 11.2),
    (3.1, -5.5, -1.45, 10.7),
    (3.8, -5.3, -1.3, 10.3),
    (4.6, -3.0, -3.7, 10.9),
    (5.3, -0.1, -4.2, 10.6),
    (5.95, 0.1, -4.0, 10.3),
    (6.7, -2.6, -6.5, 11.0),
    (7.5, -5.66, -6.1, 11.8),
    (8.5, -5.6, -5.5, 12.4),
    (9.6, -2.6, -5.9, 25.5),      # ojo: en vertical ortho_scale es el ALTO del encuadre
    (11.0, -2.45, -7.4, 22.0),    # cierra empujando hacia tu CTA
]
ts = [w[0] for w in WP]
for f in range(1, NF + 1):
    tt = (f - 1) / FPS
    sx = pchip(ts, [w[1] for w in WP], tt)
    sy = pchip(ts, [w[2] for w in WP], tt)
    sc = pchip(ts, [w[3] for w in WP], tt)
    P = scr(sx, sy)
    cam.location = P + D * 60
    cam_d.ortho_scale = sc
    cam_d.dof.focus_distance = 60 - 4.0 * ease((tt - 8.6) / 1.2) if tt > 8.6 else 60   # el foco baja al cierre
    cam_d.dof.keyframe_insert('focus_distance', frame=f)
    # en PUBLICAR el diafragma se cierra para que el rótulo «8 videos listos» y la fila de videos queden nítidos
    cam_d.dof.aperture_fstop = FSTOP + 5.0 * (ease((tt - 6.8) / 0.6) - ease((tt - 8.7) / 0.8))
    cam_d.dof.keyframe_insert('aperture_fstop', frame=f)
    cam.keyframe_insert('location', frame=f)
    cam_d.keyframe_insert('ortho_scale', frame=f)

# ---------------------------------------------------------------- luz
sun_d = bpy.data.lights.new("sol", 'SUN')
sun_d.energy = 2.1
sun_d.color = (1.0, 0.95, 0.88)
sun_d.angle = math.radians(14)
sun = bpy.data.objects.new("sol", sun_d)
COL.objects.link(sun)
sun.rotation_euler = Vector((0.42, 0.55, -1.0)).to_track_quat('-Z', 'Y').to_euler()
w = bpy.data.worlds.new("mundo")
w.use_nodes = True
bg = w.node_tree.nodes.get("Background")
bg.inputs[0].default_value = hexc("#DDD6FF")
bg.inputs[1].default_value = 0.45
S.world = w

# ---------------------------------------------------------------- compositor: halo suave de los paquetes de luz
try:
    tree = bpy.data.node_groups.new("comp", "CompositorNodeTree")
    S.compositing_node_group = tree
    rl = tree.nodes.new("CompositorNodeRLayers")
    gl = tree.nodes.new("CompositorNodeGlare")
    gl.inputs["Type"].default_value = 'Bloom'
    gl.inputs["Threshold"].default_value = 1.6
    gl.inputs["Strength"].default_value = 0.55
    gl.inputs["Size"].default_value = 0.45
    tree.interface.new_socket("Image", in_out='OUTPUT', socket_type='NodeSocketColor')
    out = tree.nodes.new("NodeGroupOutput")
    tree.links.new(rl.outputs["Image"], gl.inputs["Image"])
    tree.links.new(gl.outputs["Image"], out.inputs[0])
except Exception as e:
    print("compositor:", e)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "escena.blend"))
print("OK escena.blend", len(bpy.data.objects), "objetos")
