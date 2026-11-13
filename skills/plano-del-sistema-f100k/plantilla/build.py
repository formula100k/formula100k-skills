# build.py · Plantilla «Plano del sistema» (plano-del-sistema-f100k)
# Plano tipo blueprint sobre una mesa (luz rasante, papel con relieve), lineas que se trazan solas,
# la camara baja por la trampilla del modulo 03 a la sala donde la maquina 3D se arma y trabaja,
# y vuelve a subir al plano en toma continua. 300 cuadros, 30 fps, 1080x1920, sin creditos.
#   PS_CONFIG=config.json blender -b -P build.py   → escena.blend (junto a este archivo o en PS_OUT)
#   blender -b escena.blend -a                     → frames/f_0001.png … f_0300.png
#   ./post.sh                                      → muestra.mp4 + poster.jpg + cuadros.jpg
# Variables de entorno: PS_CONFIG (config.json: titulo, modulos, sala, CTA y colores), PS_OUT (carpeta de salida),
# PS_FONTS (carpeta de letras), PS_SCALE (% de 1080x1920, 100 por defecto), PS_SAMPLES (muestras EEVEE, 32).
# Pruebas rapidas: PS_SCALE=50 PS_SAMPLES=12 y renderiza 2–3 cuadros con -f.
import bpy, bmesh, math, os, random, json
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.expanduser(os.environ.get("PS_OUT") or HERE))
FUENTES = os.environ.get("PS_FONTS") or os.path.join(HERE, "fuentes")
FUENTES = os.path.join(os.path.expanduser(FUENTES), "")
SCALE = int(os.environ.get("PS_SCALE", "100")); SAMPLES = int(os.environ.get("PS_SAMPLES", "32"))
# ---------------------------------------------------------------- configuracion (todo lo que dice la pantalla)
CFG = {
    "titulo": {"chica_1": "TU EQUIPO", "grande_1": "TRABAJA", "chica_2": "mientras", "clave": "DUERMES"},
    "modulos": ["IDEAS", "GUION", "ANIMACIÓN", "PUBLICA"],   # 01..04; el 03 es la trampilla que se abre
    "cota": "TRABAJA SOLA",                                    # rotulo bajo el modulo 03
    "cajetin": ["PLANO 01", "TU SISTEMA"],
    "sala": {"entra": "1 IDEA", "sale": "8 VIDEOS", "piezas": 8},   # pared de la sala + piezas en la cinta (1–8)
    "cta_chica": "COMENTA", "cta": "GUÍA",
    "colores": {"acento": "#FFC200"},
}
if os.environ.get("PS_CONFIG"):
    with open(os.path.expanduser(os.environ["PS_CONFIG"])) as fh:
        _u = json.load(fh)
    for k, v in _u.items():
        CFG[k] = {**CFG[k], **v} if isinstance(CFG.get(k), dict) and isinstance(v, dict) else v
TIT, MODS, SALA, COLS = CFG["titulo"], list(CFG["modulos"]) + ["", "", "", ""], CFG["sala"], CFG["colores"]
PIEZAS = max(1, min(8, int(SALA.get("piezas", 8))))
def hex_lin(h):
    h = h.lstrip("#")
    return tuple(((c / 12.92) if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4) for c in (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)))
random.seed(7)
FPS, F_END = 30, 300
FLOOR = -3.0            # piso de la sala bajo la mesa
HX0, HX1, HY0, HY1 = -0.45, 0.45, -0.75, 0.35   # hueco del modulo 03
ZL = 0.017              # altura de la tinta sobre el papel

bpy.ops.wm.read_factory_settings(use_empty=True)
S = bpy.context.scene
bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
COL = S.collection
DEFER = []   # (objeto, cuadro, hasta): se aplica al final a todo su arbol

# ---------------------------------------------------------------- utilidades
def link(o, parent=None):
    COL.objects.link(o)
    if parent: o.parent = parent
    return o

def mat(name, color, rough=0.5, metal=0.0, emis=None, estr=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emis:
        b.inputs["Emission Color"].default_value = (*emis, 1)
        b.inputs["Emission Strength"].default_value = estr
    return m

def mesh_obj(name, verts, faces, m=None, smooth=False, parent=None):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    if smooth:
        for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    if m: me.materials.append(m)
    return link(o, parent)

def box(name, size, loc, m, bevel=0.0, parent=None):
    sx, sy, sz = [s / 2 for s in size]
    v = [(-sx,-sy,-sz),(sx,-sy,-sz),(sx,sy,-sz),(-sx,sy,-sz),(-sx,-sy,sz),(sx,-sy,sz),(sx,sy,sz),(-sx,sy,sz)]
    f = [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    o = mesh_obj(name, v, f, m, parent=parent); o.location = loc
    if bevel:
        md = o.modifiers.new("bev", 'BEVEL'); md.width = bevel; md.segments = 3
        for p in o.data.polygons: p.use_smooth = True
    return o

def cyl(name, r, h, loc, m, verts=32, r2=None, parent=None, bevel=0.0, axis='Z'):
    r2 = r if r2 is None else r2
    v, f = [], []
    for i in range(verts):
        a = 2 * math.pi * i / verts
        v.append((r * math.cos(a), r * math.sin(a), -h / 2)); v.append((r2 * math.cos(a), r2 * math.sin(a), h / 2))
    for i in range(verts):
        j = (i + 1) % verts
        f.append((2*i, 2*j, 2*j+1, 2*i+1))
    f.append(tuple(2*i for i in reversed(range(verts)))); f.append(tuple(2*i+1 for i in range(verts)))
    o = mesh_obj(name, v, f, m, parent=parent); o.location = loc
    for p in o.data.polygons[:verts]: p.use_smooth = True
    if axis == 'Y': o.rotation_euler = (math.pi / 2, 0, 0)
    if axis == 'X': o.rotation_euler = (0, math.pi / 2, 0)
    if bevel:
        md = o.modifiers.new("bev", 'BEVEL'); md.width = bevel; md.segments = 2; md.limit_method = 'ANGLE'
    return o

def grid_mesh(name, xs, ys, zf, hole, m):
    nx, ny = len(xs), len(ys)
    verts = [(x, y, zf(x, y)) for y in ys for x in xs]
    faces = []
    for j in range(ny - 1):
        for i in range(nx - 1):
            cx, cy = (xs[i] + xs[i+1]) / 2, (ys[j] + ys[j+1]) / 2
            if hole and hole[0] < cx < hole[1] and hole[2] < cy < hole[3]: continue
            a = j * nx + i
            faces.append((a, a + 1, a + nx + 1, a + nx))
    return mesh_obj(name, verts, faces, m, smooth=True)

def frange(a, b, step):
    n = int(round((b - a) / step)); return [round(a + i * step, 5) for i in range(n + 1)]

def kf(o, path, f, idx=-1):
    o.keyframe_insert(path, frame=f, index=idx)

def appear(o, f, until=None, tree=False):
    """Corte seco: aparece en el cuadro f (sin animacion de entrada)."""
    if tree:
        DEFER.append((o, f, until)); return
    for prop in ("hide_render", "hide_viewport"):
        if f > 1:
            setattr(o, prop, True); kf(o, prop, 1)
        setattr(o, prop, False); kf(o, prop, f)
        if until:
            setattr(o, prop, True); kf(o, prop, until)

def ease(t):  # in-out
    t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)
def ease_out(t):
    t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3

# ---------------------------------------------------------------- materiales
def paper_material():
    m = bpy.data.materials.new("papel_plano"); m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links
    b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.82
    geo = N.new("ShaderNodeNewGeometry"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(geo.outputs["Position"], sep.inputs[0])
    def line_mask(out, scale, width):
        a = N.new("ShaderNodeMath"); a.operation = 'MULTIPLY'; a.inputs[1].default_value = scale; L.new(out, a.inputs[0])
        fr = N.new("ShaderNodeMath"); fr.operation = 'FRACT'; L.new(a.outputs[0], fr.inputs[0])
        lt = N.new("ShaderNodeMath"); lt.operation = 'LESS_THAN'; lt.inputs[1].default_value = width; L.new(fr.outputs[0], lt.inputs[0])
        return lt.outputs[0]
    def vmax(a, c):
        n = N.new("ShaderNodeMath"); n.operation = 'MAXIMUM'; L.new(a, n.inputs[0]); L.new(c, n.inputs[1]); return n.outputs[0]
    fine = vmax(line_mask(sep.outputs["X"], 10.0, 0.035), line_mask(sep.outputs["Y"], 10.0, 0.035))
    big = vmax(line_mask(sep.outputs["X"], 2.0, 0.012), line_mask(sep.outputs["Y"], 2.0, 0.012))
    noise = N.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 3.0; noise.inputs["Detail"].default_value = 6
    ramp = N.new("ShaderNodeValToRGB"); L.new(noise.outputs["Fac"], ramp.inputs[0])
    ramp.color_ramp.elements[0].position = 0.3; ramp.color_ramp.elements[0].color = (0.012, 0.062, 0.27, 1)
    ramp.color_ramp.elements[1].position = 0.75; ramp.color_ramp.elements[1].color = (0.022, 0.105, 0.40, 1)
    mix1 = N.new("ShaderNodeMixRGB"); mix1.inputs[2].default_value = (0.10, 0.28, 0.70, 1)
    f1 = N.new("ShaderNodeMath"); f1.operation = 'MULTIPLY'; f1.inputs[1].default_value = 0.30; L.new(fine, f1.inputs[0])
    L.new(f1.outputs[0], mix1.inputs[0]); L.new(ramp.outputs[0], mix1.inputs[1])
    mix2 = N.new("ShaderNodeMixRGB"); mix2.inputs[2].default_value = (0.16, 0.38, 0.80, 1)
    f2 = N.new("ShaderNodeMath"); f2.operation = 'MULTIPLY'; f2.inputs[1].default_value = 0.55; L.new(big, f2.inputs[0])
    L.new(f2.outputs[0], mix2.inputs[0]); L.new(mix1.outputs[0], mix2.inputs[1])
    L.new(mix2.outputs[0], b.inputs["Base Color"])
    # relieve: fibra fina + arrugas grandes
    n2 = N.new("ShaderNodeTexNoise"); n2.inputs["Scale"].default_value = 90.0; n2.inputs["Detail"].default_value = 4
    n3 = N.new("ShaderNodeTexNoise"); n3.inputs["Scale"].default_value = 2.2; n3.inputs["Detail"].default_value = 8; n3.inputs["Roughness"].default_value = 0.7
    add = N.new("ShaderNodeMath"); add.operation = 'MULTIPLY_ADD'; add.inputs[1].default_value = 6.0
    L.new(n3.outputs["Fac"], add.inputs[0]); L.new(n2.outputs["Fac"], add.inputs[2])
    bump = N.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.45; bump.inputs["Distance"].default_value = 0.02
    L.new(add.outputs[0], bump.inputs["Height"]); L.new(bump.outputs[0], b.inputs["Normal"])
    return m

def wall_material():
    m = bpy.data.materials.new("sala_plano"); m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links
    b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.6
    geo = N.new("ShaderNodeNewGeometry"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(geo.outputs["Position"], sep.inputs[0])
    masks = []
    for ax in "XYZ":
        for scale, width in ((4.0, 0.022), (1.0, 0.012)):
            a = N.new("ShaderNodeMath"); a.operation = 'ADD'; a.inputs[1].default_value = 0.37; L.new(sep.outputs[ax], a.inputs[0])
            s = N.new("ShaderNodeMath"); s.operation = 'MULTIPLY'; s.inputs[1].default_value = scale; L.new(a.outputs[0], s.inputs[0])
            fr = N.new("ShaderNodeMath"); fr.operation = 'FRACT'; L.new(s.outputs[0], fr.inputs[0])
            lt = N.new("ShaderNodeMath"); lt.operation = 'LESS_THAN'; lt.inputs[1].default_value = width; L.new(fr.outputs[0], lt.inputs[0])
            masks.append(lt.outputs[0])
    cur = masks[0]
    for k in masks[1:]:
        n = N.new("ShaderNodeMath"); n.operation = 'MAXIMUM'; L.new(cur, n.inputs[0]); L.new(k, n.inputs[1]); cur = n.outputs[0]
    mix = N.new("ShaderNodeMixRGB"); mix.inputs[1].default_value = (0.006, 0.035, 0.17, 1); mix.inputs[2].default_value = (0.25, 0.5, 0.95, 1)
    L.new(cur, mix.inputs[0]); L.new(mix.outputs[0], b.inputs["Base Color"])
    em = N.new("ShaderNodeMath"); em.operation = 'MULTIPLY'; em.inputs[1].default_value = 0.55; L.new(cur, em.inputs[0])
    b.inputs["Emission Color"].default_value = (0.45, 0.7, 1.0, 1); L.new(em.outputs[0], b.inputs["Emission Strength"])
    return m

def wood_material():
    m = bpy.data.materials.new("madera"); m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links
    b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.42
    tc = N.new("ShaderNodeNewGeometry"); mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (9.0, 0.6, 1.0)
    L.new(tc.outputs["Position"], mp.inputs[0])
    n = N.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 2.0; n.inputs["Detail"].default_value = 10; n.inputs["Distortion"].default_value = 1.2
    L.new(mp.outputs[0], n.inputs["Vector"])
    r = N.new("ShaderNodeValToRGB"); L.new(n.outputs["Fac"], r.inputs[0])
    r.color_ramp.elements[0].position = 0.32; r.color_ramp.elements[0].color = (0.030, 0.014, 0.007, 1)
    r.color_ramp.elements[1].position = 0.72; r.color_ramp.elements[1].color = (0.16, 0.075, 0.032, 1)
    L.new(r.outputs[0], b.inputs["Base Color"])
    bump = N.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.12
    L.new(n.outputs["Fac"], bump.inputs["Height"]); L.new(bump.outputs[0], b.inputs["Normal"])
    return m

def shaft_material():
    m = bpy.data.materials.new("haz_de_luz"); m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links
    N.remove(N["Principled BSDF"]); out = N["Material Output"]
    em = N.new("ShaderNodeEmission"); em.inputs[0].default_value = (1.0, 0.82, 0.55, 1); em.inputs[1].default_value = 1.6
    tr = N.new("ShaderNodeBsdfTransparent"); mix = N.new("ShaderNodeMixShader")
    geo = N.new("ShaderNodeNewGeometry"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(geo.outputs["Position"], sep.inputs[0])
    mr = N.new("ShaderNodeMapRange"); mr.inputs[1].default_value = FLOOR; mr.inputs[2].default_value = 0.0; L.new(sep.outputs["Z"], mr.inputs[0])
    lw = N.new("ShaderNodeLayerWeight"); lw.inputs[0].default_value = 0.35
    inv = N.new("ShaderNodeMath"); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0; L.new(lw.outputs["Facing"], inv.inputs[1])
    mu = N.new("ShaderNodeMath"); mu.operation = 'MULTIPLY'; L.new(mr.outputs[0], mu.inputs[0]); L.new(inv.outputs[0], mu.inputs[1])
    mu2 = N.new("ShaderNodeMath"); mu2.operation = 'MULTIPLY'; mu2.inputs[1].default_value = 0.055; L.new(mu.outputs[0], mu2.inputs[0])
    L.new(mu2.outputs[0], mix.inputs[0]); L.new(tr.outputs[0], mix.inputs[1]); L.new(em.outputs[0], mix.inputs[2])
    L.new(mix.outputs[0], out.inputs["Surface"])
    try: m.surface_render_method = 'BLENDED'
    except Exception: m.blend_method = 'BLEND'
    return m

M_PAPER = paper_material(); M_WALL = wall_material(); M_WOOD = wood_material()
_ink = hex_lin(COLS["tinta"]) if COLS.get("tinta") else (0.85, 0.92, 1.0)
M_INK = mat("tinta", _ink, 0.6, emis=_ink, estr=1.15)
ACENTO = hex_lin(COLS.get("acento", "#FFC200"))
M_YEL = mat("acento", ACENTO, 0.5, emis=ACENTO, estr=1.0)
M_DOT = mat("punto_flujo", (1.0, 0.75, 0.1), 0.4, emis=(1.0, 0.72, 0.05), estr=6.0)
M_DARK = mat("canto_oscuro", (0.008, 0.02, 0.07), 0.7)
M_ENAMEL = mat("esmalte_blanco", (0.82, 0.84, 0.86), 0.32)
M_STEEL = mat("acero_azul", (0.10, 0.14, 0.22), 0.35, 0.85)
M_BRASS = mat("laton", (0.85, 0.55, 0.16), 0.28, 1.0)
M_CORAL = mat("coral", (0.95, 0.20, 0.10), 0.35)
M_RUBBER = mat("goma", (0.02, 0.02, 0.025), 0.7)
M_GLASS_EYE = mat("visor", (0.01, 0.012, 0.02), 0.15)
M_EYE = mat("ojo", (0.2, 0.9, 1.0), 0.3, emis=(0.2, 0.9, 1.0), estr=7.0)
M_BULB = mat("idea", (1.0, 0.85, 0.4), 0.3, emis=(1.0, 0.78, 0.25), estr=9.0)
M_WHITE_E = mat("blanco_emis", (1, 1, 1), 0.5, emis=(1, 1, 1), estr=1.6)

# ---------------------------------------------------------------- mesa + papel
def paper_z(x, y):
    z = 0.010 + 0.0028 * math.sin(x * 2.1 + 1.0) * math.sin(y * 1.7 + 0.4)
    z -= 0.0035 * math.exp(-((x - 0.0) / 0.03) ** 2)        # doblez vertical
    z -= 0.0035 * math.exp(-((y - 1.30) / 0.03) ** 2)       # doblez horizontal
    z -= 0.0035 * math.exp(-((y + 0.90) / 0.03) ** 2)
    for cx, cy in ((1.3, 2.3), (-1.3, -2.3), (1.3, -2.3)):
        d = math.hypot(x - cx, y - cy)
        if d < 0.24: z += 0.045 * (1 - d / 0.24) ** 2          # esquinas levantadas
    return z

paper = grid_mesh("papel", frange(-1.3, 1.3, 0.05), frange(-2.3, 2.3, 0.05), paper_z, (HX0, HX1, HY0, HY1), M_PAPER)
tx = sorted(set([-6, -3, -1.5, HX0, 0, HX1, 1.5, 3, 6])); ty = sorted(set([-7, -4, -2, HY0, HY1, 2, 4, 7]))
table = grid_mesh("mesa", tx, ty, lambda x, y: 0.0, (HX0, HX1, HY0, HY1), M_WOOD)
# canto del hueco (grosor de la mesa)
for (a, b_) in (((HX0, HY0), (HX1, HY0)), ((HX1, HY0), (HX1, HY1)), ((HX1, HY1), (HX0, HY1)), ((HX0, HY1), (HX0, HY0))):
    mesh_obj("canto", [(a[0], a[1], 0.011), (b_[0], b_[1], 0.011), (b_[0], b_[1], -0.14), (a[0], a[1], -0.14)], [(0, 1, 2, 3)], M_DARK)

# trampillas del modulo 03
flapL = mesh_obj("trampilla_izq", [(0, -0.55, 0), (0.45, -0.55, 0), (0.45, 0.55, 0), (0, 0.55, 0)], [(0, 1, 2, 3)], M_PAPER)
flapL.location = (HX0, -0.2, 0.0115)
flapR = mesh_obj("trampilla_der", [(-0.45, -0.55, 0), (0, -0.55, 0), (0, 0.55, 0), (-0.45, 0.55, 0)], [(0, 1, 2, 3)], M_PAPER)
flapR.location = (HX1, -0.2, 0.0115)
for f in list(range(92, 118)) + list(range(258, 280)):
    a = math.radians(102) * (ease((f - 94) / 20.0) if f < 200 else 1 - ease((f - 260) / 16.0))
    flapL.rotation_euler = (0, a, 0); kf(flapL, "rotation_euler", f)
    flapR.rotation_euler = (0, -a, 0); kf(flapR, "rotation_euler", f)

# ---------------------------------------------------------------- tinta: lineas que se trazan solas
def stroke(name, pts, f0, f1, width=0.0055, parent=None, z=ZL, m=None, local=False):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts):
        p.co = (q[0], q[1], (q[2] if len(q) > 2 else (0.004 if local else z)), 1)
    cu.bevel_depth = width; cu.bevel_resolution = 1; cu.use_fill_caps = True
    cu.materials.append(m or M_INK)
    o = link(bpy.data.objects.new(name, cu), parent)
    n = max(2, f1 - f0)
    for i in range(n + 1):
        cu.bevel_factor_end = ease(i / n) if n > 6 else i / n
        cu.keyframe_insert("bevel_factor_end", frame=f0 + i)
    if f0 >= 1: appear(o, f0 + 1)
    return o

def rect(x0, y0, x1, y1): return [(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)]
def circle(cx, cy, r, n=56, a0=0.0, frac=1.0):
    return [(cx + r * math.cos(a0 + 2 * math.pi * frac * i / n), cy + r * math.sin(a0 + 2 * math.pi * frac * i / n)) for i in range(n + 1)]

# marco doble y cajetin
stroke("marco", rect(-1.18, -2.18, 1.18, 2.18), -30, 34, 0.007)
stroke("marco2", rect(-1.13, -2.13, 1.13, 2.13), 6, 52, 0.003)
stroke("cajetin", [(-1.13, -1.97), (1.13, -1.97)], 30, 46, 0.004)
stroke("cajetin_v", [(0.45, -2.13), (0.45, -1.97)], 44, 50, 0.004)
stroke("titulo_base", [(-1.08, 1.30), (1.08, 1.30)], 34, 58, 0.004)
# modulos 01 y 02
stroke("mod01", rect(-1.05, 0.62, -0.14, 1.20), -34, 6, 0.008)
stroke("mod02", rect(0.14, 0.62, 1.05, 1.20), 14, 40, 0.008)
stroke("i01_bombilla", circle(-0.36, 0.98, 0.105, a0=-math.pi / 2 + 0.5, frac=0.84), -6, 14, 0.005)
stroke("i01_base", [(-0.41, 0.865), (-0.31, 0.865)], 15, 19, 0.005)
stroke("i01_base2", [(-0.395, 0.835), (-0.325, 0.835)], 18, 22, 0.005)
for k, (yy, ln) in enumerate(((1.10, 0.36), (1.03, 0.30), (0.96, 0.34), (0.89, 0.20))):
    stroke(f"i02_linea{k}", [(0.62, yy), (0.62 + ln, yy)], 30 + 4 * k, 38 + 4 * k, 0.005)
# conectores con flecha
def arrow(name, pts, f0, f1, head=0.045):
    stroke(name, pts, f0, f1, 0.005)
    (ax, ay), (bx, by) = pts[-2][:2], pts[-1][:2]
    d = Vector((bx - ax, by - ay)).normalized(); n = Vector((-d.y, d.x))
    p1 = Vector((bx, by)) - d * head + n * head * 0.6; p2 = Vector((bx, by)) - d * head - n * head * 0.6
    stroke(name + "_punta", [tuple(p1), (bx, by), tuple(p2)], f1, f1 + 3, 0.005)
C12 = [(-0.14, 0.91), (0.13, 0.91)]
C23 = [(0.60, 0.62), (0.60, 0.50), (0.38, 0.50), (0.38, 0.41)]
C34 = [(0.50, -0.20), (0.61, -0.20)]
C4F = [(0.87, -0.50), (0.87, -1.01)]
arrow("c12", C12, 36, 46); arrow("c23", C23, 48, 62); arrow("c34", C34, 70, 76); arrow("c4f", C4F, 78, 90)
# modulo 03 (el hueco) + cruz de «abertura» sobre las trampillas
stroke("mod03", rect(-0.50, -0.80, 0.50, 0.40), 44, 74, 0.010)
stroke("x_izq_a", [(0.02, -0.53), (0.43, 0.53)], 62, 78, 0.004, parent=flapL, local=True)
stroke("x_izq_b", [(0.02, 0.53), (0.43, -0.53)], 66, 82, 0.004, parent=flapL, local=True)
stroke("x_der_a", [(-0.43, -0.53), (-0.02, 0.53)], 64, 80, 0.004, parent=flapR, local=True)
stroke("x_der_b", [(-0.43, 0.53), (-0.02, -0.53)], 68, 84, 0.004, parent=flapR, local=True)
# modulo 04
stroke("mod04", rect(0.62, -0.50, 1.12, 0.10), 58, 78, 0.008)
stroke("i04_cel", rect(0.80, -0.26, 0.94, 0.02), 70, 82, 0.005)
stroke("i04_play", [(0.845, -0.16), (0.905, -0.12), (0.845, -0.08), (0.845, -0.16)], 80, 86, 0.005)
# engranajes dibujados a la izquierda + ejes
stroke("g_ext", circle(-0.83, -0.12, 0.22), 40, 66, 0.005)
stroke("g_int", circle(-0.83, -0.12, 0.085), 52, 66, 0.005)
stroke("g_eje_h", [(-1.10, -0.12), (-0.56, -0.12)], 60, 68, 0.0025)
stroke("g_eje_v", [(-0.83, -0.39), (-0.83, 0.15)], 62, 70, 0.0025)
stroke("g2_ext", circle(-0.70, -0.52, 0.13), 56, 76, 0.005)
stroke("g2_int", circle(-0.70, -0.52, 0.045), 66, 76, 0.005)
for i in range(12):
    a = 2 * math.pi * i / 12
    stroke(f"g_diente{i}", [(-0.83 + 0.22 * math.cos(a), -0.12 + 0.22 * math.sin(a)), (-0.83 + 0.262 * math.cos(a), -0.12 + 0.262 * math.sin(a))], 58 + i, 61 + i, 0.006)
# cota bajo el modulo 03
stroke("cota", [(-0.50, -0.90), (0.50, -0.90)], 72, 84, 0.003)
stroke("cota_a", [(-0.50, -0.94), (-0.50, -0.84)], 72, 75, 0.003); stroke("cota_b", [(0.50, -0.94), (0.50, -0.84)], 82, 85, 0.003)
# bloque del cierre
stroke("cierre", rect(-1.08, -1.90, 1.08, -1.02), 62, 96, 0.008)

# puntos de flujo que recorren los conectores (el sistema vivo)
def flow_dot(path, f0, period, f1=F_END):
    me = bpy.data.meshes.new("punto"); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.017); bm.to_mesh(me); bm.free()
    me.materials.append(M_DOT); o = link(bpy.data.objects.new("punto_flujo", me))
    segs = [(Vector(a[:2]), Vector(b[:2])) for a, b in zip(path[:-1], path[1:])]
    total = sum((b - a).length for a, b in segs)
    appear(o, f0)
    for f in range(f0, f1 + 1):
        d = (((f - f0) % period) / period) * total
        for a, b in segs:
            l = (b - a).length
            if d <= l or (a, b) == segs[-1]:
                p = a + (b - a) * min(1.0, d / l); break
            d -= l
        o.location = (p.x, p.y, ZL + 0.004); kf(o, "location", f)
flow_dot(C12, 50, 14); flow_dot(C23, 66, 20); flow_dot(C34, 80, 9); flow_dot(C4F, 94, 18)

# ---------------------------------------------------------------- textos (corte seco, tamanos distintos)
F_ANTON = bpy.data.fonts.load(FUENTES + "Anton-Regular.ttf")
F_MONT = bpy.data.fonts.load(FUENTES + "ArchivoBlack-Regular.ttf")
def text(body, font, size, loc, m, f_in=None, rot=(0, 0, 0), align='LEFT', spacing=1.0, parent=None):
    cu = bpy.data.curves.new("txt_" + body, 'FONT'); cu.body = body; cu.font = font; cu.size = size
    cu.align_x = align; cu.space_character = spacing; cu.materials.append(m)
    o = link(bpy.data.objects.new("txt_" + body, cu), parent); o.location = loc; o.rotation_euler = rot
    if f_in: appear(o, f_in)
    bpy.context.view_layer.update()
    return o
def width(o): return o.dimensions.x
def fit(o, maxw):
    """Si el texto no cabe, se achica hasta maxw (nunca se agranda)."""
    if o.data.body and width(o) > maxw:
        o.data.size *= maxw / width(o); bpy.context.view_layer.update()
    return o

# titulo del plano
t1 = fit(text(TIT["chica_1"], F_MONT, 0.105, (-1.08, 1.84, ZL), M_INK, 44, spacing=1.08), 0.9)
t2 = fit(text(TIT["grande_1"], F_ANTON, 0.33, (-1.08 + width(t1) + 0.07, 1.84, ZL), M_INK, 54), 2.16 - width(t1) - 0.07)
t3 = fit(text(TIT["chica_2"], F_MONT, 0.105, (-1.08, 1.40, ZL), M_INK, 64, spacing=1.05), 0.9)
t4 = fit(text(TIT["clave"], F_ANTON, 0.50, (-1.08 + width(t3) + 0.07, 1.40, ZL), M_YEL, 74), 2.16 - width(t3) - 0.07)
# etiquetas de modulos (aparecen cuando su caja termina de trazarse)
text("01", F_MONT, 0.085, (-1.00, 1.065, ZL), M_INK, None); fit(text(MODS[0], F_ANTON, 0.19, (-1.00, 0.69, ZL), M_INK, 10), 0.80)
text("02", F_MONT, 0.085, (0.19, 1.065, ZL), M_INK, 38); fit(text(MODS[1], F_ANTON, 0.19, (0.19, 0.69, ZL), M_INK, 42), 0.80)
text("03", F_MONT, 0.085, (-0.50, 0.445, ZL), M_INK, 70); fit(text(MODS[2], F_ANTON, 0.105, (-0.36, 0.445, ZL), M_INK, 74, spacing=1.1), 0.66)
text("04", F_MONT, 0.07, (0.66, 0.005, ZL), M_INK, 78); fit(text(MODS[3], F_ANTON, 0.115, (0.66, -0.46, ZL), M_INK, 84), 0.42)
fit(text(CFG["cota"], F_MONT, 0.05, (0.0, -0.975, ZL), M_INK, 86, align='CENTER', spacing=1.15), 0.95)
fit(text(CFG["cajetin"][0], F_MONT, 0.055, (-1.08, -2.075, ZL), M_INK, 48, spacing=1.15), 1.45)
fit(text(CFG["cajetin"][1], F_MONT, 0.055, (0.50, -2.075, ZL), M_INK, 52, spacing=1.15), 0.58)
# cierre
fit(text(CFG["cta_chica"].upper(), F_MONT, 0.13, (-1.0, -1.22, ZL), M_INK, 266, spacing=1.12), 2.0)
fit(text(CFG["cta"].upper(), F_ANTON, 0.64, (0.0, -1.83, ZL), M_YEL, 275, align='CENTER'), 2.0)

# ---------------------------------------------------------------- utileria de mesa
pen = link(bpy.data.objects.new("lapiz", None)); pen.location = (-0.15, -2.62, 0.026); pen.rotation_euler = (0, 0, math.radians(9))
cyl("lapiz_cuerpo", 0.024, 1.0, (0, 0, 0), mat("lapiz_am", (0.95, 0.62, 0.03), 0.35), verts=6, parent=pen, axis='X')
cyl("lapiz_madera", 0.024, 0.11, (0.555, 0, 0), mat("lapiz_mad", (0.75, 0.52, 0.32), 0.6), verts=16, r2=0.007, parent=pen, axis='X')
cyl("lapiz_mina", 0.007, 0.035, (0.627, 0, 0), M_RUBBER, verts=12, r2=0.001, parent=pen, axis='X')
cyl("lapiz_casquillo", 0.026, 0.06, (-0.53, 0, 0), mat("casquillo", (0.7, 0.7, 0.72), 0.25, 1.0), verts=20, parent=pen, axis='X')
cyl("lapiz_goma", 0.024, 0.07, (-0.595, 0, 0), mat("goma_rosa", (0.85, 0.30, 0.34), 0.7), verts=20, parent=pen, axis='X')
rul = box("regla", (1.7, 0.17, 0.008), (0.35, -2.98, 0.005), mat("regla_acero", (0.55, 0.57, 0.6), 0.3, 1.0)); rul.rotation_euler = (0, 0, math.radians(-3))
for i in range(34):
    box("regla_marca", (0.004, 0.05 if i % 5 else 0.085, 0.001), (-0.8 + i * 0.048, 0.06 - (0.025 if i % 5 else 0.0425) + 0.0, 0.0046), M_RUBBER, parent=rul)
for (px, py) in ((1.16, 2.14), (-1.16, -2.16)):
    cyl("pisapapel", 0.115, 0.07, (px, py, 0.05), M_BRASS, verts=48, bevel=0.012)
mug = cyl("taza", 0.26, 0.5, (1.78, 1.25, 0.25), mat("taza_m", (0.9, 0.88, 0.84), 0.25), verts=48, bevel=0.02)
cyl("cafe", 0.235, 0.01, (1.78, 1.25, 0.497), mat("cafe_m", (0.03, 0.012, 0.004), 0.08), verts=48)

# ---------------------------------------------------------------- sala bajo la mesa
RX, RY0, RY1 = 2.2, -4.2, 1.7
grid_mesh('techo', tx, ty, lambda x, y: -0.004, (HX0, HX1, HY0, HY1), M_DARK)
room_v = [(-RX, RY0, FLOOR), (RX, RY0, FLOOR), (RX, RY1, FLOOR), (-RX, RY1, FLOOR), (-RX, RY0, -0.001), (RX, RY0, -0.001), (RX, RY1, -0.001), (-RX, RY1, -0.001)]
mesh_obj("sala", room_v, [(0, 1, 2, 3), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)], M_WALL)
bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=1.25, radius2=0.52, depth=-FLOOR, location=(0, -0.2, FLOOR / 2), end_fill_type='NOTHING')
shaft = bpy.context.active_object; shaft.name = "haz"; shaft.data.materials.append(shaft_material()); shaft.visible_shadow = False
for p in shaft.data.polygons: p.use_smooth = True
dust_me = bpy.data.meshes.new("polvo"); bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.006); bm.to_mesh(dust_me); bm.free()
dust_me.materials.append(M_WHITE_E)
for i in range(46):
    o = link(bpy.data.objects.new("polvo", dust_me)); o.visible_shadow = False
    z = random.uniform(FLOOR + 0.3, -0.1); rr = 0.45 + (0.6 * (z / FLOOR)); a = random.uniform(0, 6.28); r = rr * math.sqrt(random.random())
    p0 = Vector((r * math.cos(a), -0.2 + r * math.sin(a), z)); d = Vector((random.uniform(-.12, .12), random.uniform(-.12, .12), random.uniform(-.25, -.05)))
    o.location = p0 - d; kf(o, "location", 100); o.location = p0 + d; kf(o, "location", 300)

# ---------------------------------------------------------------- la maquina (se arma y trabaja)
CY = 0.0
def slide(o, f0, f1, offset, final=None, fn=ease_out):
    final = Vector(final if final is not None else o.location)
    appear(o, f0, tree=True)
    for f in range(f0, f1 + 1):
        o.location = final + Vector(offset) * (1 - fn((f - f0) / (f1 - f0))); kf(o, "location", f)
    o.location = final

base = box("maq_base", (1.25, 0.85, 0.25), (0, CY, FLOOR + 0.125), M_STEEL, bevel=0.03); slide(base, 138, 150, (0, 0, -0.30))
body = box("maq_cuerpo", (0.9, 0.6, 1.2), (0, CY, FLOOR + 0.85), M_ENAMEL, bevel=0.06); slide(body, 146, 162, (0, 0, -1.5))
box("maq_ranura", (0.56, 0.02, 0.36), (0, -0.300, -0.33), M_RUBBER, parent=body)
box("maq_franja", (0.902, 0.602, 0.05), (0, 0, 0.47), M_YEL, parent=body)
box("maq_tapa", (0.80, 0.50, 0.03), (0, 0, 0.60), M_STEEL, bevel=0.01, parent=body)
for i, c in enumerate((M_EYE, M_YEL, M_CORAL)):
    cyl("maq_piloto", 0.022, 0.02, (0.33, -0.305, 0.33 - i * 0.075), c, verts=16, parent=body, axis='Y')

def gear(name, r, teeth, m, loc, thick=0.07, tooth=0.045):
    p = 2 * math.pi / teeth; ro, ri = r + tooth / 2, r - tooth / 2
    pts = []
    for i in range(teeth):
        a = i * p
        for rr, da in ((ri, 0.0), (ro, 0.2), (ro, 0.5), (ri, 0.7)):
            pts.append((rr * math.cos(a + da * p), rr * math.sin(a + da * p)))
    n = len(pts)
    v = [(x, thick / 2, z) for x, z in pts] + [(x, -thick / 2, z) for x, z in pts]
    f = [tuple(range(n)), tuple(reversed(range(n, 2 * n)))] + [(i, i + n, (i + 1) % n + n, (i + 1) % n) for i in range(n)]
    o = mesh_obj(name, v, f, m); o.location = loc
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(o.data); bm.free()
    md = o.modifiers.new("bev", 'BEVEL'); md.width = 0.006; md.segments = 2; md.limit_method = 'ANGLE'
    cyl(name + "_cubo", r * 0.30, thick + 0.03, (0, 0, 0), M_STEEL, verts=24, parent=o, axis='Y')
    for k in range(5):
        a = 2 * math.pi * k / 5
        cyl(name + "_hoyo", r * 0.17, thick + 0.004, (r * 0.62 * math.cos(a), 0, r * 0.62 * math.sin(a)), M_RUBBER, verts=16, parent=o, axis='Y')
    return o

GY = CY - 0.30 - 0.05
gz = FLOOR + 1.02
gA = (Vector((-0.12, GY, gz)), 0.24, 16, M_BRASS)
gB = (Vector((-0.12 + 0.39 * math.cos(0.35), GY, gz + 0.39 * math.sin(0.35))), 0.15, 10, M_CORAL)
gC = (Vector((-0.12 + 0.36 * math.cos(2.55), GY, gz + 0.36 * math.sin(2.55))), 0.12, 8, M_YEL)
F_SPIN = 170
def spin_angle(f):  # arranca suave y queda a velocidad constante
    t = max(0.0, (f - F_SPIN) / FPS); return 2.4 * (t - (1 - math.exp(-3 * t)) / 3)
gears = []
for i, ((loc, r, n, m), theta) in enumerate(((gA, None), (gB, 0.35), (gC, 2.55))):
    g = gear(f"engranaje_{i}", r, n, m, loc)
    slide(g, 158 + i * 4, 168 + i * 4, (0, -0.9, 0))
    pA = 2 * math.pi / 16; pB = 2 * math.pi / n
    if theta is None: ratio, ph = 1.0, 0.0
    else:
        uA = (theta - 0.35 * pA) / pA
        ratio, ph = -16.0 / n, theta + math.pi - 0.85 * pB + uA * pB
    for f in range(150, F_END + 1):
        # el eje del engranaje es Y; visto de frente gira con rotation_euler.y
        g.rotation_euler = (0, -(ph + ratio * spin_angle(f)), 0); kf(g, "rotation_euler", f)

funnel = cyl("maq_tolva", 0.15, 0.26, (0, CY, FLOOR + 1.45 + 0.13), M_YEL, verts=40, r2=0.30); slide(funnel, 164, 176, (0, 0, 1.0))
cyl("maq_tolva_boca", 0.27, 0.012, (0, 0, 0.126), M_RUBBER, verts=40, parent=funnel)
belt = box("maq_cinta", (0.56, 1.05, 0.07), (0, CY - 0.30 - 0.525, FLOOR + 0.30), M_RUBBER, bevel=0.02)
appear(belt, 168, tree=True)
for f in range(168, 181):
    s = ease_out((f - 168) / 12)
    belt.scale = (1, max(0.001, s), 1); belt.location = (0, CY - 0.30 - 0.525 * s, FLOOR + 0.30)
    kf(belt, "scale", f); kf(belt, "location", f)
for sx in (-0.30, 0.30):
    rail = box("maq_riel", (0.035, 1.07, 0.11), (sx / 1.0, 0, 0.0), M_STEEL, parent=belt)
for k in range(5):
    cyl("maq_rodillo", 0.05, 0.60, (0, -0.48 + k * 0.24, -0.02), M_BRASS, verts=20, parent=belt, axis='X')
for sx in (-0.26, 0.26):
    box("maq_pata", (0.05, 0.05, 0.27), (sx, -0.42, -0.165), M_STEEL, parent=belt)

# la idea: una bombilla que cae por el haz y entra a la tolva
bulb_me = bpy.data.meshes.new("idea"); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=0.11); bm.to_mesh(bulb_me); bm.free()
for p in bulb_me.polygons: p.use_smooth = True
bulb_me.materials.append(M_BULB); bulb = link(bpy.data.objects.new("idea", bulb_me))
appear(bulb, 177, until=193)
for f in range(177, 193):
    t = (f - 177) / 15; bulb.location = (0, CY, -0.35 + (FLOOR + 1.60 + 0.35) * (t * t)); kf(bulb, "location", f)
bl = bpy.data.lights.new("luz_idea", 'POINT'); bl.energy = 60; bl.color = (1.0, 0.75, 0.3); bl.shadow_soft_size = 0.1
blo = link(bpy.data.objects.new("luz_idea", bl), bulb); appear(blo, 177, until=193)

# los 8 videos que salen por la cinta
CARD_COLS = [(1.0, 0.72, 0.0), (0.95, 0.2, 0.1), (0.2, 0.75, 1.0), (0.95, 0.95, 0.95), (1.0, 0.35, 0.6), (0.3, 0.9, 0.5), (1.0, 0.72, 0.0), (0.2, 0.75, 1.0)]
for i in range(PIEZAS):
    f0 = 192 + i * 4
    y_end = CY - 0.30 - 1.00 + i * 0.115; y0 = CY - 0.26
    card = box(f"video_{i+1}", (0.20, 0.022, 0.34), (0, y0, FLOOR + 0.335 + 0.17), M_RUBBER, bevel=0.008)
    cm = mat(f"pantalla_{i}", CARD_COLS[i], 0.4, emis=CARD_COLS[i], estr=0.6)
    box("pantalla", (0.175, 0.004, 0.31), (0, -0.0125, 0), cm, parent=card)
    mesh_obj("play", [(-0.03, -0.016, -0.04), (0.04, -0.016, 0.0), (-0.03, -0.016, 0.04)], [(0, 1, 2)], M_WHITE_E if i != 3 else M_RUBBER, parent=card)
    card.rotation_euler = (math.radians(-12), 0, 0)
    appear(card, f0, tree=True)
    for f in range(f0, f0 + 13):
        t = ease_out((f - f0) / 12); card.location = (0, y0 + (y_end - y0) * t, FLOOR + 0.335 + 0.17); kf(card, "location", f)

# el equipo: dos asistentes al lado de la cinta
def bot(name, loc, rz, f_in, phase):
    root = link(bpy.data.objects.new(name, None)); root.location = loc; root.rotation_euler = (0, 0, rz)
    parts = [box(name + "_cuerpo", (0.26, 0.20, 0.30), (0, 0, 0.21), M_ENAMEL, bevel=0.05, parent=root),
             box(name + "_pie", (0.20, 0.16, 0.06), (0, 0, 0.03), M_STEEL, bevel=0.015, parent=root),
             box(name + "_pecho", (0.10, 0.01, 0.05), (0, -0.102, 0.24), M_YEL, parent=root)]
    head = box(name + "_cabeza", (0.31, 0.24, 0.21), (0, 0, 0.49), M_ENAMEL, bevel=0.055, parent=root)
    parts += [head, box(name + "_visor", (0.25, 0.02, 0.11), (0, -0.117, 0.0), M_GLASS_EYE, bevel=0.008, parent=head)]
    for sx in (-0.055, 0.055):
        parts.append(cyl(name + "_ojo", 0.024, 0.012, (sx, -0.128, 0.0), M_EYE, verts=16, parent=head, axis='Y'))
    parts.append(cyl(name + "_antena", 0.008, 0.10, (0, 0, 0.15), M_STEEL, verts=8, parent=head))
    me = bpy.data.meshes.new("bola"); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.022); bm.to_mesh(me); bm.free()
    me.materials.append(M_CORAL); ball = link(bpy.data.objects.new(name + "_bola", me), head); ball.location = (0, 0, 0.21); parts.append(ball)
    for p in parts: appear(p, f_in)
    for f in range(f_in, F_END + 1):
        head.rotation_euler = (math.radians(-10) + math.radians(5) * math.sin((f + phase) * 0.16), 0, math.radians(14) * math.sin((f + phase) * 0.085))
        kf(head, "rotation_euler", f)
bot("asistente_a", (-0.60, CY - 0.95, FLOOR), math.radians(-28), 178, 0)
bot("asistente_b", (0.62, CY - 0.62, FLOOR), math.radians(32), 186, 20)

# texto de la sala (pared del fondo)
WY = RY1 - 0.012
R_WALL = (math.pi / 2, 0, 0)
w1 = fit(text(SALA["entra"], F_ANTON, 0.26, (-0.92, WY, -0.36), M_INK, 184, rot=R_WALL), 1.25)
ax0 = -0.92 + width(w1) + 0.10
arr = mesh_obj("flecha", [(0, 0, 0.085), (0.26, 0, 0.085), (0.26, 0, 0.035), (0.40, 0, 0.11), (0.26, 0, 0.185), (0.26, 0, 0.135), (0, 0, 0.135)], [(0, 1, 5, 6), (2, 3, 4)], M_INK)
arr.location = (ax0, WY, -0.36); appear(arr, 192)
fit(text(SALA["sale"], F_ANTON, 0.52, (-0.92, WY, -0.86), M_YEL, 204, rot=R_WALL), 1.84)

for o, f, until in DEFER:
    for x in [o] + list(o.children_recursive): appear(x, f, until)

# ---------------------------------------------------------------- luces
def light(name, kind, loc, target, energy, color, size=0.3, spot=None, blend=0.5):
    l = bpy.data.lights.new(name, kind); l.energy = energy; l.color = color
    if kind == 'AREA': l.size = size
    else: l.shadow_soft_size = size
    if spot: l.spot_size = math.radians(spot); l.spot_blend = blend
    o = link(bpy.data.objects.new(name, l)); o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return o
light("lampara_rasante", 'SPOT', (-4.2, 2.6, 1.15), (0.3, -0.5, 0), 5200, (1.0, 0.80, 0.58), size=0.10, spot=80, blend=0.7)
light("relleno_cielo", 'AREA', (1.5, -1.0, 5.0), (0, 0, 0), 300, (0.55, 0.70, 1.0), size=6.0)
light("sala_cenital", 'SPOT', (0, -0.2, -0.06), (0, -0.05, FLOOR), 950, (1.0, 0.86, 0.66), size=0.12, spot=64, blend=0.5)
light("sala_contra", 'POINT', (1.5, 1.1, -1.6), (0, 0, FLOOR), 260, (0.25, 0.65, 1.0), size=0.3)
light("sala_relleno", 'AREA', (-1.4, -3.6, -1.3), (0, 0, -2.2), 120, (0.70, 0.82, 1.0), size=2.5)
light("sala_pared", 'AREA', (0, 0.9, -0.25), (0, RY1, -0.8), 45, (0.8, 0.88, 1.0), size=2.0)

w = bpy.data.worlds.new("mundo"); w.use_nodes = True; S.world = w
w.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.018, 0.035, 1)

# ---------------------------------------------------------------- camara viva (toma continua)
cam_d = bpy.data.cameras.new("camara"); cam_d.lens = 32; cam_d.clip_start = 0.03; cam_d.clip_end = 60
cam_d.dof.use_dof = True
cam = link(bpy.data.objects.new("camara", cam_d)); S.camera = cam; cam.rotation_mode = 'QUATERNION'
#        cuadro  posicion                 mira a                 foco   f-stop
KEYS = [(1,   (-1.00, -0.30, 1.00), (-0.60, 0.82, 0.0),  None, 0.8),
        (45,  (-0.60, -2.10, 1.90), (-0.05, 0.50, 0.0),  None, 0.7),
        (85,  (0.00, -0.90, 4.60),  (0.00, 0.35, 0.0),   None, 1.4),
        (112, (0.00, -0.55, 2.90),  (0.00, -0.20, 0.0),  None, 1.0),
        (132, (0.00, -0.35, 0.90),  (0.00, -0.15, -1.4), None, 0.8),
        (152, (0.00, -0.60, -0.60), (0.00, 0.05, -2.2),  None, 0.8),
        (180, (0.60, -3.35, -1.52), (0.00, 0.15, -1.85), None, 1.5),
        (234, (-0.55, -3.00, -1.60), (0.00, 0.15, -1.85), None, 1.5),
        (251, (0.00, -0.55, -0.50), (0.00, -0.50, -2.4), None, 1.6),
        (263, (0.00, -0.45, 1.20),  (0.00, -0.60, 0.0),  None, 0.9),
        (300, (0.00, -1.50, 4.30),  (0.00, -0.95, 0.0),  None, 1.4)]
def hermite(vals, times, f):
    for i in range(len(times) - 1):
        if times[i] <= f <= times[i + 1]: break
    def tan(k):
        a, b = max(0, k - 1), min(len(times) - 1, k + 1)
        return (vals[b] - vals[a]) / (times[b] - times[a])
    h = times[i + 1] - times[i]; t = (f - times[i]) / h
    h00, h10, h01, h11 = 2*t**3 - 3*t**2 + 1, t**3 - 2*t**2 + t, -2*t**3 + 3*t**2, t**3 - t**2
    return vals[i] * h00 + tan(i) * (h * h10) + vals[i + 1] * h01 + tan(i + 1) * (h * h11)
T = [k[0] for k in KEYS]; P = [Vector(k[1]) for k in KEYS]; Q = [Vector(k[2]) for k in KEYS]
FOC = [k[3] if k[3] else (Vector(k[2]) - Vector(k[1])).length for k in KEYS]; FST = [k[4] for k in KEYS]
prev_q = None; prev_p = None
for f in range(1, F_END + 1):
    p = hermite(P, T, f); q = hermite(Q, T, f)
    if prev_p is not None and (prev_p.z > 0) != (p.z > 0):   # cruza la mesa: tiene que pasar por el hueco
        assert HX0 + 0.06 < p.x < HX1 - 0.06 and HY0 + 0.06 < p.y < HY1 - 0.06, f"camara fuera del hueco en {f}: {p}"
    fwd = (q - p).normalized(); hint = Vector((0, 1, 1)).normalized()
    up = (hint - fwd * hint.dot(fwd)).normalized(); right = fwd.cross(up).normalized()
    rot = Matrix((right, up, -fwd)).transposed().to_quaternion()
    if prev_q is not None and rot.dot(prev_q) < 0: rot.negate()
    cam.location = p; cam.rotation_quaternion = rot
    kf(cam, "location", f); kf(cam, "rotation_quaternion", f)
    cam_d.dof.focus_distance = max(0.2, hermite(FOC, T, f)); cam_d.dof.aperture_fstop = max(0.15, hermite(FST, T, f))
    cam_d.dof.keyframe_insert("focus_distance", frame=f); cam_d.dof.keyframe_insert("aperture_fstop", frame=f)
    prev_q, prev_p = rot.copy(), p.copy()

# ---------------------------------------------------------------- render
S.frame_start, S.frame_end = 1, F_END; S.render.fps = FPS
S.render.resolution_x, S.render.resolution_y, S.render.resolution_percentage = 1080, 1920, SCALE
try: S.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception: S.render.engine = 'BLENDER_EEVEE'
ee = S.eevee
for attr, val in (("taa_render_samples", SAMPLES), ("use_raytracing", True), ("use_shadows", True), ("use_gtao", True),
                  ("bokeh_max_size", 60.0), ("use_bokeh_jittered", False), ("shadow_ray_count", 2), ("shadow_step_count", 6)):
    try: setattr(ee, attr, val)
    except Exception as e: print("eevee: sin", attr)
for look in ("AgX - Medium High Contrast", "Medium High Contrast"):
    try: S.view_settings.look = look; break
    except Exception: pass
S.render.image_settings.file_format = 'PNG'; S.render.image_settings.color_mode = 'RGB'
S.render.filepath = "//frames/f_"
S.frame_set(1)
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "escena.blend"))
print("OK escena.blend · engine", S.render.engine)
