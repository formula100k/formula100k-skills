# build.py · Plantilla «Objetos 3D minimalistas» (objetos-3d-minimal-f100k)
# Reconstruye la escena entera desde cero en Blender (EEVEE), sin créditos:
#   blender -b -P build.py              → escena.blend (junto a este archivo o en OM_OUT)
#   blender -b escena.blend -a          → frames/f_0001.png … f_0360.png
#   ./montar.sh                         → muestra.mp4 (viñeta + grano fino), poster.jpg y cuadros.jpg
# Variables de entorno: OM_CONFIG (config.json: frases, palabra del CTA y colores), OM_OUT (carpeta de salida),
# OM_FONTS (carpeta de letras), OM_SCALE (% de 1080x1920, 100 por defecto), OM_SAMPLES (muestras EEVEE, 48).
# Pruebas rápidas: OM_SCALE=50 OM_SAMPLES=16 y renderiza 3–4 cuadros con -f.
#
# Mecánica: 4 objetos-mundo en pedestales sobre fondo oscuro, luz cálida de área,
# DOF macro, UNA toma continua en travelling de un mundo al siguiente, letra de
# máquina de escribir que entra palabra por palabra con corte seco.
import bpy, bmesh, math, os, random, json
from mathutils import Vector

AQUI = os.path.dirname(os.path.abspath(__file__))
HERE = os.environ.get("OM_OUT") or AQUI
FONTS = os.environ.get("OM_FONTS") or os.path.join(AQUI, "fuentes")
SCALE = int(os.environ.get("OM_SCALE", "100"))
SAMPLES = int(os.environ.get("OM_SAMPLES", "48"))
CFG = {}
_cfg = os.environ.get("OM_CONFIG") or os.path.join(AQUI, "config.json")
if os.path.exists(os.path.expanduser(_cfg)):
    with open(os.path.expanduser(_cfg)) as fh:
        CFG = json.load(fh)
CTA = str(CFG.get("cta", "GUÍA")).upper()
COL = dict(texto="#F1E7D0", acento="#FFC83A", tenue="#A08C6C",
           pantallas=["#FFB347", "#F2E3C6", "#E8743B", "#FFD27A", "#C9D4E8", "#F4A259", "#FFE9B8", "#E0562F"])
COL.update(CFG.get("colores") or {})
# 4 frases, una por mundo (escritorio · claqueta · cinta · caja). Cada frase = líneas; cada línea = palabras.
# Prefijo de cada palabra: «*» clave enorme en acento · «+» mediana en acento · «#» mediana · «~» chica tenue ·
# sin prefijo = conector chico. «{cta}» se cambia por la palabra del CTA.
FRASES = CFG.get("frases") or [
    [["tu", "equipo"], ["*TRABAJA"], ["mientras", "duermes"]],
    [["#1", "idea"], ["#»", "*8", "+VIDEOS"]],
    [["se", "hacen"], ["*SOLOS"], ["~sin", "~que", "~los", "~toques"]],
    [["comenta"], ["*{cta}"]],
]
FPS = 30
NF = 360                      # 12 s
SP = 3.0                      # separación entre mundos (x)
WX = [0.0, SP, 2 * SP, 3 * SP]
PED_H = 0.62                  # altura del pedestal
OBJ_S = 1.2                   # escala de los objetos sobre el pedestal
FONT_PATH = os.path.join(FONTS, "CourierPrime-Bold.ttf")   # máquina de escribir (OFL)
random.seed(5)

# ───────────────────────── base ─────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 1, NF
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
sc.render.resolution_percentage = SCALE
for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
    try:
        sc.render.engine = eng
        break
    except Exception:
        pass
ee = sc.eevee
for k, v in dict(taa_render_samples=SAMPLES, use_raytracing=True, use_shadows=True,
                 use_gtao=True, bokeh_max_size=200.0, use_bokeh_jittered=False,
                 use_soft_shadows=True).items():
    try:
        setattr(ee, k, v)
    except Exception:
        pass
try:
    ee.ray_tracing_options.resolution_scale = "1"
except Exception:
    pass
sc.view_settings.view_transform = "Filmic" if "Filmic" in [
    i.identifier for i in sc.view_settings.bl_rna.properties["view_transform"].enum_items] else "AgX"
try:
    sc.view_settings.look = "Medium High Contrast"
except Exception:
    try:
        sc.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        pass
sc.render.image_settings.file_format = "PNG"
sc.render.filepath = os.path.join(HERE, "frames", "f_")

world = bpy.data.worlds.new("Mundo")
sc.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.012, 0.009, 0.007, 1)
bg.inputs[1].default_value = 1.0

font = bpy.data.fonts.load(FONT_PATH)


# ───────────────────────── utilidades ─────────────────────────
def hexc(h, a=1.0):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (a,)


def mat(name, color, rough=0.6, metal=0.0, emit=None, estr=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = hexc(color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = hexc(emit)
        b.inputs["Emission Strength"].default_value = estr
    return m


def emat(name, color, strength=1.0):
    """Emisión pura (letras y pantallas): plana, sin brillo ni degradado."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs[0].default_value = hexc(color)
    e.inputs[1].default_value = strength
    nt.links.new(e.outputs[0], out.inputs[0])
    return m


def link(o, parent=None):
    sc.collection.objects.link(o)
    if parent:
        o.parent = parent
    return o


def finish(o, m, bevel=0.0, seg=3, smooth=True):
    o.data.materials.append(m)
    if smooth:
        for p in o.data.polygons:
            p.use_smooth = True
    if bevel > 0:
        md = o.modifiers.new("Bevel", "BEVEL")
        md.width = bevel
        md.segments = seg
        md.limit_method = "ANGLE"
        md.angle_limit = math.radians(40)
        try:
            md.harden_normals = True
        except Exception:
            pass
    return o


def box(name, size, loc, m, bevel=0.01, parent=None, rot=(0, 0, 0), shear=0.0, smooth=False):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]; v.co.y *= size[1]; v.co.z *= size[2]
        v.co.x += shear * v.co.z
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me), parent)
    o.location = loc
    o.rotation_euler = rot
    return finish(o, m, bevel, smooth=smooth)


def cyl(name, r, h, loc, m, bevel=0.01, parent=None, rot=(0, 0, 0), r2=None, seg=48):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r,
                          radius2=r if r2 is None else r2, depth=h)
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me), parent)
    o.location = loc
    o.rotation_euler = rot
    finish(o, m, bevel)
    # caras planas en las tapas
    for p in o.data.polygons:
        p.use_smooth = len(p.vertices) == 4
    return o


def sphere(name, r, loc, m, parent=None, seg=24):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r)
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me), parent)
    o.location = loc
    return finish(o, m)


def empty(name, loc=(0, 0, 0), parent=None):
    o = link(bpy.data.objects.new(name, None), parent)
    o.location = loc
    o.empty_display_size = 0.1
    return o


def light(name, kind, loc, energy, color, size=1.0, parent=None, rot=None, target=None, spot=None):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = energy
    ld.color = hexc(color)[:3]
    if kind == "AREA":
        ld.shape = "DISK"; ld.size = size
    else:
        ld.shadow_soft_size = size
    if kind == "SPOT" and spot:
        ld.spot_size = math.radians(spot); ld.spot_blend = 0.6
    o = link(bpy.data.objects.new(name, ld), parent)
    o.location = loc
    if rot:
        o.rotation_euler = rot
    if target:
        c = o.constraints.new("TRACK_TO"); c.target = target
        c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
    return o


def bake(o, path, fn, index=-1, f0=1, f1=NF, step=1):
    """Hornea fn(frame) en la propiedad, cuadro a cuadro (sin depender de la API de fcurves)."""
    tgt, prop = o, path
    if "." in path:
        head, prop = path.rsplit(".", 1)
        tgt = o.path_resolve(head)
    fr = list(range(f0, f1 + 1, step))
    if fr[-1] != f1:
        fr.append(f1)
    for f in fr:
        v = fn(f)
        if index >= 0:
            getattr(tgt, prop)[index] = v
        else:
            setattr(tgt, prop, v)
        tgt.keyframe_insert(prop, index=index, frame=f)


def sstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def ease_in(a, b, x):      # acelera (golpe seco al final, sin rebote)
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * t


def ease_out(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return 1 - (1 - t) ** 3


def pchip(knots):
    """Interpolación cúbica monótona (Fritsch–Carlson): velocidad continua, sin pasarse."""
    xs = [k[0] for k in knots]; ys = [k[1] for k in knots]
    n = len(xs)
    h = [xs[i + 1] - xs[i] for i in range(n - 1)]
    d = [(ys[i + 1] - ys[i]) / h[i] for i in range(n - 1)]
    m = [0.0] * n
    m[0], m[-1] = d[0], d[-1]
    for i in range(1, n - 1):
        if d[i - 1] * d[i] <= 0:
            m[i] = 0.0
        else:
            w1 = 2 * h[i] + h[i - 1]; w2 = h[i] + 2 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])

    def f(x):
        if x <= xs[0]:
            return ys[0]
        if x >= xs[-1]:
            return ys[-1]
        i = max(j for j in range(n - 1) if xs[j] <= x)
        t = (x - xs[i]) / h[i]
        h00 = 2 * t ** 3 - 3 * t ** 2 + 1; h10 = t ** 3 - 2 * t ** 2 + t
        h01 = -2 * t ** 3 + 3 * t ** 2; h11 = t ** 3 - t ** 2
        return h00 * ys[i] + h10 * h[i] * m[i] + h01 * ys[i + 1] + h11 * h[i] * m[i + 1]
    return f


def appear(o, f_on, f_off=None):
    """Corte seco: escala 0 → 1 en un cuadro, sin animación de entrada."""
    s = tuple(o.scale)
    bake(o, "scale", lambda f: s if (f >= f_on and (f_off is None or f < f_off)) else (0, 0, 0))


# ───────────────────────── materiales ─────────────────────────
M_FLOOR = mat("piso", "#0E0B09", rough=0.32)
M_PED = mat("pedestal", "#2A1F18", rough=0.78)
M_PEDTOP = mat("pedestal_tapa", "#3A2A20", rough=0.7)
M_WOOD = mat("madera", "#7C4B2A", rough=0.55)
M_WOOD_D = mat("madera_osc", "#4A2A16", rough=0.6)
M_CREAM = mat("crema", "#DCD2BC", rough=0.65)
M_DARK = mat("carbon", "#16130F", rough=0.45)
M_GRAPH = mat("grafito", "#3B3A3C", rough=0.5)
M_BRASS = mat("laton", "#C9933E", rough=0.28, metal=1.0)
M_STEEL = mat("acero", "#8E9095", rough=0.3, metal=1.0)
M_RUBBER = mat("goma", "#1B1A19", rough=0.85)
M_CARD = mat("tarjeta_gris", "#6A6660", rough=0.6)
M_KRAFT = mat("carton", "#9A7748", rough=0.8)
M_KRAFT_D = mat("carton_osc", "#5E4426", rough=0.85)
M_TXT = emat("letra_crema", COL["texto"], 1.6)
M_TXT_Y = emat("letra_ambar", COL["acento"], 2.2)
M_TXT_D = emat("letra_tenue", COL["tenue"], 0.9)
_pc = list(COL["pantallas"]) or ["#FFB347"]
SCREENS = [emat("pant_%d" % i, _pc[i % len(_pc)], 2.4) for i in range(8)]
M_BULB = emat("foco", "#FFD9A0", 14.0)
M_BOKEH = [emat("bokeh_%d" % i, c, s) for i, (c, s) in enumerate(
    [("#FF9A3C", 2.2), ("#FFC67A", 1.6), ("#B0562A", 2.0), ("#6C7589", 1.3)])]

# ───────────────────────── set ─────────────────────────
box("piso", (60, 40, 0.1), (SP * 1.5, 6, -0.05), M_FLOOR, bevel=0)
box("fondo", (60, 0.1, 20), (SP * 1.5, 16, 8), mat("fondo", "#0A0806", rough=0.95), bevel=0)

# bokeh de «oficina de noche» al fondo (el DOF lo vuelve discos)
bk = empty("bokeh")
for i in range(150):
    x = random.uniform(-4, WX[-1] + 4)
    y = random.uniform(5.5, 14)
    z = random.uniform(0.4, 5.2)
    sphere("bk%03d" % i, random.uniform(0.012, 0.035), (x, y, z), random.choice(M_BOKEH), parent=bk, seg=8)

# polvo en el aire, cerca del plano de foco (deriva lenta, un solo objeto animado)
dust = empty("polvo")
M_DUST = emat("polvo_m", "#FFD7A0", 1.2)
for i in range(260):
    x = random.uniform(-1.5, WX[-1] + 1.5)
    y = random.uniform(-2.6, 1.6)
    z = random.uniform(0.5, 3.0)
    sphere("d%03d" % i, random.uniform(0.0025, 0.006), (x, y, z), M_DUST, parent=dust, seg=6)
bake(dust, "location", lambda f: (0.10 * math.sin(f / 90), 0, 0.0009 * f), step=4)


def pedestal(i):
    root = empty("mundo%d" % (i + 1), (WX[i], 0, 0))
    cyl("ped%d" % i, 0.62, PED_H, (0, 0, PED_H / 2), M_PED, bevel=0.025, parent=root, seg=64)
    cyl("pedtapa%d" % i, 0.60, 0.012, (0, 0, PED_H + 0.006), M_PEDTOP, bevel=0.004, parent=root, seg=64)
    top = empty("tapa%d" % i, (0, 0, PED_H + 0.012), root)
    top.scale = (OBJ_S, OBJ_S, OBJ_S)
    tgt = empty("mira_luz%d" % i, (0, 0, PED_H + 0.35), root)
    # luz principal cálida de área (arriba-izquierda-frente), sombras suaves
    light("key%d" % i, "AREA", (-1.5, -1.7, 3.3), 380, "#FFC896", size=1.5, parent=root, target=tgt)
    # contra fría y tenue para despegar la silueta del fondo
    light("rim%d" % i, "AREA", (1.5, 1.9, 2.3), 150, "#8FA3C8", size=0.8, parent=root, target=tgt)
    # relleno muy bajo desde cámara
    light("fill%d" % i, "AREA", (0.9, -2.6, 1.1), 28, "#FF9A5A", size=2.0, parent=root, target=tgt)
    return top


TOPS = [pedestal(i) for i in range(4)]

# postes fuera de foco entre mundos: el travelling los cruza = cortinilla natural
for j in range(3):
    x = (WX[j] + WX[j + 1]) / 2
    cyl("poste%d" % j, 0.11, 6, (x, -2.7, 3), M_DARK, bevel=0, seg=24)
    sphere("foco_poste%d" % j, 0.035, (x - 0.2, -2.55, 2.05), M_BULB)
    cyl("cable%d" % j, 0.004, 3.0, (x - 0.2, -2.55, 3.58), M_DARK, bevel=0, seg=8)


def mini_card(name, parent, loc, screen_mat, w=0.12, h=0.215, rot=(0, 0, 0), body=M_DARK):
    """Mini pantalla vertical 9:16 (un «video»). Devuelve el contenedor."""
    r = empty(name, loc, parent)
    r.rotation_euler = rot
    box(name + "_c", (w, 0.014, h), (0, 0, h / 2), body, bevel=0.006, parent=r)
    if screen_mat:
        box(name + "_p", (w - 0.016, 0.004, h - 0.016), (0, -0.0075, h / 2), screen_mat, bevel=0, parent=r)
        # barra de «subtítulo» y punto: detalle que da escala
        box(name + "_s", (w * 0.55, 0.002, 0.012), (0, -0.0105, h * 0.2), M_DARK, bevel=0, parent=r)
    return r


# ═════════════ MUNDO 1 · escritorio en miniatura ═════════════
t = TOPS[0]
dz = 0.34
box("mesa", (0.86, 0.42, 0.035), (0, 0, dz), M_WOOD, bevel=0.008, parent=t)
for sx in (-1, 1):
    for sy in (-1, 1):
        box("pata", (0.035, 0.035, dz), (sx * 0.38, sy * 0.17, dz / 2), M_WOOD_D, bevel=0.004, parent=t)
box("travesano", (0.76, 0.02, 0.03), (0, 0.17, 0.12), M_WOOD_D, bevel=0.004, parent=t)
zt = dz + 0.0175
# portátil
box("lap_base", (0.30, 0.20, 0.012), (-0.03, -0.03, zt + 0.006), M_GRAPH, bevel=0.004, parent=t)
box("lap_teclas", (0.25, 0.10, 0.002), (-0.03, -0.05, zt + 0.013), M_DARK, bevel=0, parent=t)
lid = empty("lap_tapa", (-0.03, 0.07, zt + 0.012), t)
box("lap_marco", (0.30, 0.010, 0.20), (0, 0, 0.10), M_GRAPH, bevel=0.004, parent=lid)
scr = box("lap_pantalla", (0.275, 0.002, 0.175), (0, -0.0062, 0.10), emat("lap_scr", "#F3D9A8", 0.9), bevel=0, parent=lid)
# línea de tiempo en la pantalla (bloques que «se arman»)
tl = []
for r_ in range(3):
    xacc = -0.12
    for c_ in range(4):
        w_ = random.uniform(0.035, 0.07)
        if xacc + w_ > 0.125:
            break
        b_ = box("clip", (w_, 0.002, 0.020), (xacc + w_ / 2, -0.0078, 0.045 + r_ * 0.028),
                 [M_DARK, mat("clipn", "#C2571F", 0.5), M_GRAPH][r_], bevel=0, parent=lid)
        tl.append(b_)
        xacc += w_ + 0.006
box("visor", (0.085, 0.002, 0.060), (-0.08, -0.0078, 0.150), M_DARK, bevel=0, parent=lid)
lid.rotation_euler = (math.radians(-14), 0, 0)
scr_light = light("lap_luz", "AREA", (0, -0.05, 0.10), 0.0, "#FFD9A0", size=0.2, parent=lid,
                  rot=(math.radians(90), 0, 0))
# lámpara de latón
cyl("lamp_base", 0.055, 0.014, (0.30, 0.06, zt + 0.007), M_BRASS, bevel=0.004, parent=t)
cyl("lamp_brazo", 0.007, 0.22, (0.30, 0.06, zt + 0.12), M_BRASS, bevel=0, parent=t, seg=12)
cyl("lamp_brazo2", 0.007, 0.16, (0.245, 0.03, zt + 0.255), M_BRASS, bevel=0, parent=t, seg=12,
    rot=(math.radians(-25), math.radians(62), 0))
cyl("lamp_pantalla", 0.075, 0.08, (0.175, -0.005, zt + 0.255), M_BRASS, bevel=0.003, parent=t, r2=0.028,
    rot=(math.radians(-18), math.radians(-32), 0))
bulb = sphere("lamp_foco", 0.022, (0.165, -0.01, zt + 0.225), M_BULB, parent=t)
lamp = light("lamp_luz", "SPOT", (0.165, -0.01, zt + 0.22), 0.0, "#FFB060", size=0.03, parent=t, spot=120,
             rot=(math.radians(18), math.radians(-30), 0))
# taza + pila de «videos» terminados
cyl("taza", 0.030, 0.055, (-0.31, -0.10, zt + 0.0275), M_CREAM, bevel=0.006, parent=t, seg=32)
cyl("cafe", 0.024, 0.002, (-0.31, -0.10, zt + 0.0555), M_WOOD_D, bevel=0, parent=t, seg=32)
for k in range(4):
    box("pila%d" % k, (0.10, 0.16, 0.010), (-0.30 + 0.004 * k, 0.09, zt + 0.006 + 0.0115 * k),
        [M_CREAM, M_GRAPH, M_CREAM, M_KRAFT][k], bevel=0.003, parent=t, rot=(0, 0, 0.08 * (k - 1.5)))
# silla mínima
box("silla_as", (0.20, 0.18, 0.02), (-0.03, -0.30, 0.19), M_WOOD_D, bevel=0.006, parent=t)
box("silla_re", (0.20, 0.018, 0.18), (-0.03, -0.385, 0.30), M_WOOD_D, bevel=0.006, parent=t,
    rot=(math.radians(8), 0, 0))
for sx in (-1, 1):
    for sy in (-1, 1):
        box("silla_p", (0.02, 0.02, 0.19), (-0.03 + sx * 0.085, -0.30 + sy * 0.075, 0.095), M_WOOD_D,
            bevel=0.003, parent=t)

# animación mundo 1: se enciende la lámpara (f16), la pantalla (f30) y la línea de tiempo se arma sola
LAMP_ON, SCR_ON = 16, 30
bake(lamp, "data.energy", lambda f: 26.0 if f >= LAMP_ON else 0.0)
bake(bulb, "scale", lambda f: (1, 1, 1) if f >= LAMP_ON else (0, 0, 0))
bake(scr, "scale", lambda f: (1, 1, 1) if f >= SCR_ON else (0, 0, 0))
bake(scr_light, "data.energy", lambda f: 3.0 if f >= SCR_ON else 0.0)
for n_, b_ in enumerate(tl):
    f_on = SCR_ON + 4 + n_ * 4
    bake(b_, "scale", (lambda fo: (lambda f: (ease_out(fo, fo + 5, f), 1, 1) if f >= fo else (0, 0, 0)))(f_on))

# ═════════════ MUNDO 2 · claqueta + 8 videos ═════════════
t = TOPS[1]
CL_W, CL_H = 0.74, 0.46
clq = empty("claqueta", (0, 0.05, 0.0), t)
clq.rotation_euler = (0, 0, math.radians(-10))
box("clq_pie", (0.5, 0.16, 0.02), (0, 0, 0.01), M_DARK, bevel=0.005, parent=clq)
box("clq_tabla", (CL_W, 0.035, CL_H), (0, 0, 0.02 + CL_H / 2), M_DARK, bevel=0.008, parent=clq)
for r_ in range(3):
    box("clq_linea%d" % r_, (CL_W - 0.08, 0.003, 0.006), (0, -0.019, 0.02 + CL_H * (0.25 + 0.22 * r_)), M_CREAM,
        bevel=0, parent=clq)
box("clq_div", (0.006, 0.003, CL_H * 0.42), (0.02, -0.019, 0.02 + CL_H * 0.24), M_CREAM, bevel=0, parent=clq)
ZB = 0.02 + CL_H


def stripes(parent, zc, flip):
    n = 7
    w_ = CL_W / n
    for s_ in range(n):
        box("franja", (w_ * 0.5, 0.039, 0.068), (-CL_W / 2 + w_ * (s_ + 0.5), 0, zc),
            M_CREAM, bevel=0.0, parent=parent, shear=0.6 * (-1 if flip else 1))


box("clq_fija", (CL_W, 0.037, 0.07), (0, 0, ZB + 0.04), M_DARK, bevel=0.006, parent=clq)
stripes(clq, ZB + 0.04, False)
arm = empty("clq_brazo", (-CL_W / 2, 0, ZB + 0.08), clq)
box("clq_movil", (CL_W, 0.037, 0.07), (CL_W / 2, 0, 0.04), M_DARK, bevel=0.006, parent=arm)
armc = empty("clq_brazo_c", (CL_W / 2, 0, 0.04), arm)
stripes(armc, 0, True)
cyl("clq_bisagra", 0.022, 0.045, (0, 0, 0.0), M_BRASS, bevel=0.003, parent=arm, rot=(math.radians(90), 0, 0), seg=24)
CLAP = 104      # cuadro del golpe
bake(arm, "rotation_euler", lambda f: -math.radians(32) * (1 - ease_in(CLAP - 7, CLAP, f)), index=1)
# 8 videos que salen en abanico detrás de la claqueta
cards2 = []
for k in range(8):
    a = math.radians(-52 + k * (104 / 7))
    R = 0.50
    x = math.sin(a) * R
    z = 0.40 + math.cos(a) * R * 0.34
    c = mini_card("v2_%d" % k, t, (x, 0.16, z), SCREENS[k], w=0.105, h=0.19, rot=(0, -a * 0.75, 0))
    f_on = CLAP + 6 + k * 4
    zz = z
    bake(c, "scale", (lambda fo: (lambda f: (lambda s: (s, s, s))(ease_out(fo, fo + 6, f)) if f >= fo else (0, 0, 0)))(f_on))
    bake(c, "location", (lambda fo, z0: (lambda f: z0 - 0.10 * (1 - ease_out(fo, fo + 9, f))))(f_on, zz), index=2)
    cards2.append(c)
light("v2_luz", "POINT", (0, -0.25, 1.05), 5.0, "#FFC27A", size=0.2, parent=t)

# ═════════════ MUNDO 3 · cinta de montaje ═════════════
t = TOPS[2]
BL, BZ = 1.08, 0.20
box("cinta", (BL, 0.24, 0.035), (0, 0, BZ), M_RUBBER, bevel=0.012, parent=t)
box("cinta_lat1", (BL + 0.02, 0.02, 0.06), (0, -0.13, BZ - 0.01), M_STEEL, bevel=0.006, parent=t)
box("cinta_lat2", (BL + 0.02, 0.02, 0.06), (0, 0.13, BZ - 0.01), M_STEEL, bevel=0.006, parent=t)
rollers = []
for sx in (-1, 1):
    r_ = cyl("rodillo", 0.035, 0.27, (sx * BL / 2, 0, BZ), M_BRASS, bevel=0.004, parent=t,
             rot=(math.radians(90), 0, 0), seg=24)
    rollers.append(r_)
    box("pata_c", (0.03, 0.2, BZ - 0.02), (sx * 0.36, 0, (BZ - 0.02) / 2), M_STEEL, bevel=0.004, parent=t)
# marcas de la cinta que corren (se ve que se mueve)
SPEED = 0.0072     # unidades por cuadro
marks = []
NM = 9
for k in range(NM):
    m_ = box("marca%d" % k, (0.012, 0.21, 0.004), (0, 0, BZ + 0.0185), M_GRAPH, bevel=0, parent=t)
    marks.append(m_)
    ph = k * BL / NM
    bake(m_, "location", (lambda p: (lambda f: ((p + f * SPEED) % BL) - BL / 2))(ph), index=0)
# la «máquina»: arco por el que entran tarjetas grises y salen videos encendidos
GX = 0.0
box("maq_cuerpo", (0.30, 0.34, 0.33), (GX, 0, BZ + 0.02 + 0.18), M_WOOD, bevel=0.02, parent=t)
box("maq_boca", (0.31, 0.20, 0.23), (GX, 0, BZ + 0.02 + 0.115), M_DARK, bevel=0.0, parent=t)
box("maq_techo", (0.34, 0.38, 0.03), (GX, 0, BZ + 0.38), M_WOOD_D, bevel=0.008, parent=t)
pil = sphere("maq_piloto", 0.016, (GX - 0.09, -0.172, BZ + 0.33), emat("piloto", "#FFB347", 9.0), parent=t)
bake(pil, "scale", lambda f: (1, 1, 1) if (f // 9) % 2 == 0 else (0.45, 0.45, 0.45))
light("maq_luz", "POINT", (GX, -0.02, BZ + 0.16), 2.2, "#FF9A3C", size=0.08, parent=t)
# engrane lateral girando
gear = empty("engrane", (GX + 0.03, -0.176, BZ + 0.29), t)
cyl("eng_disco", 0.055, 0.012, (0, 0, 0), M_BRASS, bevel=0.002, parent=gear, rot=(math.radians(90), 0, 0), seg=24)
for g_ in range(8):
    a = g_ * math.pi / 4
    box("eng_d", (0.022, 0.012, 0.022), (math.cos(a) * 0.06, 0, math.sin(a) * 0.06), M_BRASS, bevel=0.002,
        parent=gear, rot=(0, -a, 0))
bake(gear, "rotation_euler", lambda f: f * 0.07, index=1)
for r_ in rollers:
    bake(r_, "rotation_euler", lambda f: f * SPEED / 0.035, index=1, step=2)
# tarjetas: gris antes de la máquina, pantalla encendida después (la máquina tapa el cambio)
NC = 6
GAP = BL / NC * 1.0
for k in range(NC):
    ph = k * GAP + 0.05
    zc = BZ + 0.0185
    g = mini_card("c3g_%d" % k, t, (0, 0, zc), None, w=0.10, h=0.18, body=M_CARD)
    l = mini_card("c3l_%d" % k, t, (0, 0, zc), SCREENS[(k * 3) % 8], w=0.10, h=0.18)

    def xpos(f, p=ph):
        return ((p + f * SPEED) % (BL * 1.0)) - BL / 2
    bake(g, "location", xpos, index=0)
    bake(l, "location", xpos, index=0)
    edge = BL / 2 - 0.06

    def sc_g(f, fn=xpos):
        x = fn(f)
        s = sstep(-BL / 2, -BL / 2 + 0.07, x)       # nace al entrar a la cinta
        return (s, s, s) if x < GX else (0, 0, 0)

    def sc_l(f, fn=xpos, e=edge):
        x = fn(f)
        s = 1 - sstep(e, BL / 2, x)                 # se va al final de la cinta
        return (s, s, s) if x >= GX else (0, 0, 0)
    bake(g, "scale", sc_g)
    bake(l, "scale", sc_l)

# ═════════════ MUNDO 4 · la caja con tu palabra de CTA ═════════════
t = TOPS[3]
CW, CD, CH = 0.74, 0.50, 0.42
cj = empty("caja", (0, 0.02, 0), t)
cj.rotation_euler = (0, 0, math.radians(-12))
th = 0.02
box("cj_fondo", (CW, CD, th), (0, 0, th / 2), M_KRAFT_D, bevel=0.004, parent=cj)
box("cj_frente", (CW, th, CH), (0, -CD / 2 + th / 2, CH / 2), M_KRAFT, bevel=0.005, parent=cj)
box("cj_atras", (CW, th, CH), (0, CD / 2 - th / 2, CH / 2), M_KRAFT, bevel=0.005, parent=cj)
box("cj_izq", (th, CD, CH), (-CW / 2 + th / 2, 0, CH / 2), M_KRAFT, bevel=0.005, parent=cj)
box("cj_der", (th, CD, CH), (CW / 2 - th / 2, 0, CH / 2), M_KRAFT, bevel=0.005, parent=cj)
box("cj_cinta", (CW + 0.002, 0.004, 0.07), (0, -CD / 2 - 0.001, CH * 0.80), M_KRAFT_D, bevel=0, parent=cj)
# rótulo estampado en el frente
lab = bpy.data.curves.new("rotulo", "FONT")
lab.body = CTA; lab.font = font; lab.size = min(0.105, 0.95 / max(1, len(CTA))); lab.align_x = "CENTER"; lab.extrude = 0.001
lo = link(bpy.data.objects.new("rotulo", lab), cj)
lo.location = (0, -CD / 2 - 0.004, CH * 0.36); lo.rotation_euler = (math.radians(90), 0, 0)
lo.data.materials.append(M_DARK)
# solapas con bisagra
flapL = empty("solapaL", (-CW / 2, 0, CH), cj)
box("solL", (CW / 2 - 0.004, CD, 0.014), (CW / 4, 0, 0), M_KRAFT, bevel=0.004, parent=flapL)
flapR = empty("solapaR", (CW / 2, 0, CH), cj)
box("solR", (CW / 2 - 0.004, CD, 0.014), (-CW / 4, 0, 0), M_KRAFT, bevel=0.004, parent=flapR)
OPEN = 284
op = lambda f: ease_out(OPEN, OPEN + 16, f)
bake(flapL, "rotation_euler", lambda f: math.radians(128) * op(f), index=1)
bake(flapR, "rotation_euler", lambda f: -math.radians(128) * op(f), index=1)
# luz que sale de la caja
glow = box("cj_brillo", (CW - 0.06, CD - 0.06, 0.01), (0, 0, 0.10), emat("cj_glow", "#FFB450", 9.0), bevel=0, parent=cj)
cjl = light("cj_luz", "POINT", (0, 0, CH * 0.75), 0.0, "#FFA94A", size=0.12, parent=cj)
bake(cjl, "data.energy", lambda f: 20.0 * op(f) + 5.0 * sstep(OPEN + 16, NF, f))
bake(glow, "scale", lambda f: (1, 1, 1) if f >= OPEN else (0, 0, 0))
# videos que salen flotando de la caja
for k in range(5):
    f_on = OPEN + 12 + k * 7
    x0 = (-0.24, 0.20, -0.06, 0.27, -0.29)[k]
    y0 = (0.04, -0.03, 0.10, 0.09, -0.06)[k]
    zt_ = (0.50, 0.54, 0.62, 0.46, 0.43)[k]
    c = mini_card("v4_%d" % k, cj, (x0, y0, 0.2), SCREENS[(k * 2 + 1) % 8], w=0.10, h=0.18,
                  rot=(0, math.radians((-14, 10, -4, 16, -18)[k]), math.radians(12)))
    bake(c, "scale", (lambda fo: (lambda f: (lambda s: (s, s, s))(ease_out(fo, fo + 8, f)) if f >= fo else (0, 0, 0)))(f_on))
    bake(c, "location", (lambda fo, z1, kk: (lambda f: 0.18 + (z1 - 0.18) * ease_out(fo, fo + 26, f)
                                             + 0.012 * math.sin((f + kk * 11) / 14)))(f_on, zt_, k), index=2)

# ───────────────────────── letra (máquina de escribir) ─────────────────────────
def typeset(wi, lines, z_top, max_w=0.94, y=0.0):
    """lines = [[(palabra, tamaño, material, cuadro_on), ...], ...] centradas sobre el mundo wi.
    Cada palabra es un objeto: entra con corte seco, tamaños distintos en la misma frase."""
    z = z_top
    for line in lines:
        objs = []
        for (w_, size, m_, f_on) in line:
            cu = bpy.data.curves.new("t_" + w_, "FONT")
            cu.body = w_; cu.font = font; cu.size = size; cu.align_x = "LEFT"
            o = link(bpy.data.objects.new("t_" + w_, cu))
            o.data.materials.append(m_)
            objs.append((o, size, f_on))
        bpy.context.view_layer.update()
        gap = 0.28
        widths = [o.dimensions.x for o, _, _ in objs]
        total = sum(widths) + sum(gap * min(objs[i][1], objs[i + 1][1]) * 1.6 for i in range(len(objs) - 1))
        k = min(1.0, max_w / total)
        hmax = max(s for _, s, _ in objs) * k
        z -= hmax * 0.74
        x = WX[wi] - total * k / 2
        for i, (o, size, f_on) in enumerate(objs):
            o.scale = (k, k, k)
            o.location = (x, y, z)
            o.rotation_euler = (math.radians(90), 0, 0)
            x += widths[i] * k
            if i < len(objs) - 1:
                x += gap * min(size, objs[i + 1][1]) * 1.6 * k
            if f_on > 1:
                appear(o, f_on)
        z -= hmax * 0.30


ZT = 2.16
S, B = 0.165, 0.40      # conector chico / clave enorme
TAM = {"*": (B, M_TXT_Y), "+": (0.30, M_TXT_Y), "#": (0.30, M_TXT), "~": (0.15, M_TXT_D)}
T0 = [1, 96, 186, 290]  # cuadro en que arranca el texto de cada mundo (la cámara llega en 1, 92, 182, 272)
for wi, frase in enumerate(FRASES[:4]):
    palabras = [p for linea in frase for p in linea]
    paso = max(4, min(12, 40 // max(1, len(palabras))))   # todas las palabras entran en ≈1,3 s
    k, lines = 0, []
    for linea in frase:
        fila = []
        for p in linea:
            p = p.replace("{cta}", CTA).replace("→", "»")   # la letra no trae la flecha
            size, m_ = (TAM[p[0]] if p[:1] in TAM else (S, M_TXT))
            if p[:1] in TAM: p = p[1:]
            on = T0[wi] + k * paso if not (wi == 0 and k <= 1) else 1   # el video abre con texto ya en pantalla
            fila.append((p, size, m_, on)); k += 1
        lines.append(fila)
    typeset(wi, lines, ZT + (0.10 if len(frase) <= 2 and wi == 1 else (0.08 if wi == 2 else 0.0)))

# ───────────────────────── cámara: una sola toma ─────────────────────────
cam_d = bpy.data.cameras.new("cam")
cam = link(bpy.data.objects.new("cam", cam_d))
sc.camera = cam
cam_d.lens = 70
cam_d.sensor_fit = "VERTICAL"; cam_d.sensor_height = 36
cam_d.clip_start = 0.05; cam_d.clip_end = 80
aim = empty("mira")
foc = empty("foco_dof")
c = cam.constraints.new("TRACK_TO"); c.target = aim
c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
cam_d.dof.use_dof = True
cam_d.dof.focus_object = foc
cam_d.dof.aperture_fstop = 0.55
cam_d.dof.aperture_blades = 7

D0, D1 = [1, 92, 182, 272], [66, 156, 246, 360]       # estancia en cada mundo (llega, se va)
kx, ka, ky, kz = [], [], [], []
for i in range(4):
    last = i == 3
    kx += [(D0[i], WX[i] - 0.52), (D1[i], WX[i] + (0.30 if last else 0.50))]   # órbita lenta durante la estancia
    ka += [(D0[i], WX[i] - 0.05), (D1[i], WX[i] + 0.05)]
    ky += [(D0[i], -4.95), (D1[i], -4.10 if not last else -3.95)]              # push-in constante
    kz += [(D0[i], 1.52), (D1[i], 1.40)]
    if not last:
        mid = (D1[i] + D0[i + 1]) / 2
        ky.append((mid, -5.15))                                                 # se abre al viajar
        kz.append((mid, 1.56))
fx, fa, fy, fz = pchip(kx), pchip(ka), pchip(sorted(ky)), pchip(sorted(kz))
bake(cam, "location", lambda f: (fx(f), fy(f), fz(f)))
AIM_Z = 1.30
bake(aim, "location", lambda f: (fa(f), 0.0, AIM_Z))
bake(foc, "location", lambda f: (fa(f), -0.10, 1.2))

# ───────────────────────── guardar ─────────────────────────
sc.frame_set(1)
os.makedirs(HERE, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "escena.blend"))
print("OK escena.blend →", HERE, "· CTA:", CTA)
