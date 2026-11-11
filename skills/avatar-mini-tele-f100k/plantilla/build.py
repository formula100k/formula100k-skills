# build.py · Plantilla «Avatar con mini tele» (avatar-mini-tele-f100k)
# Reconstruye la escena entera desde cero en Blender (EEVEE), sin créditos:
#   blender -b -P build.py                       → escena.blend (junto a este archivo o en MT_OUT)
#   blender -b escena.blend -a                   → frames/f_0001.png … f_0300.png
#   ffmpeg -framerate 30 -start_number 1 -i frames/f_%04d.png -vf "vignette=PI/11,noise=alls=4:allf=t+u" \
#          -an -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart muestra.mp4
# Variables de entorno: MT_CONFIG (config.json: palabra del CTA + rasgos del avatar), MT_OUT (carpeta de salida),
# MT_FONTS (carpeta de letras), MT_SCALE (% de 1080x1920, 100 por defecto), MT_SAMPLES (muestras EEVEE, 32).
# Pruebas rápidas: MT_SCALE=50 MT_SAMPLES=16 y renderiza 2–3 cuadros con -f.
import bpy, bmesh, os, random, json
from math import sin, cos, pi, sqrt, radians as rad
from mathutils import Vector

OUT = os.environ.get("MT_OUT") or os.path.dirname(os.path.abspath(__file__))
_here = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fuentes") + "/"
FONTS = os.environ.get("MT_FONTS") or (_here if os.path.isdir(_here) else os.path.expanduser("~/.claude/skills/gancho-golpe-f100k/fuentes/"))
HELV = "HelveticaNeue.ttc" if os.path.exists(FONTS + "HelveticaNeue.ttc") else "Montserrat.ttf"
SCALE = int(os.environ.get("MT_SCALE", "100"))
SAMPLES = int(os.environ.get("MT_SAMPLES", "32"))
# Configuración (opcional): MT_CONFIG=/ruta/config.json → palabra del CTA y rasgos del avatar
CFG = {}
if os.environ.get("MT_CONFIG"):
    with open(os.path.expanduser(os.environ["MT_CONFIG"])) as fh:
        CFG = json.load(fh)
CTA = CFG.get("cta", "GUÍA").upper()
AVC = dict(piel="#F4C29E", pelo="#3B2418", ropa="#2F6FD6", lunares_ropa=False, collar=False,
           aretes=True, lunares_cara=False, pecas=True, labios="#C9373F", iris="#5B2E1A")
AVC.update(CFG.get("avatar", {}))
FPS, NF = 30, 300
B1, B2, B3, B4, END = 1, 76, 151, 223, NF + 1   # inicio de cada frase (corte seco)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
random.seed(6)

# ───────────────────────── paleta ─────────────────────────
INK, CREAM, WHITE = "#17150F", "#F4EFE4", "#FFFFFF"
ORANGE, COBALT, YELLOW, NAVY = "#FF5A2A", "#2747D9", "#FFC533", "#1B2550"
SKIN, HAIR, GRAY = "#E3A57C", "#3A2217", "#A9A295"


def hexc(h, a=1.0):
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(lin(int(h[i:i + 2], 16) / 255) for i in (1, 3, 5)) + (a,)


# ───────────────────────── materiales ─────────────────────────
def _nt(name):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    nt.nodes.clear()
    return m, nt


def halftone_fac(nt, n=14.0, axis="Z", lo=-0.5, hi=0.5, rmin=0.62, rmax=0.0, ang=45, aa=0.05):
    """Trama de puntos procedural: devuelve el socket 0..1 (1 = punto)."""
    N = nt.nodes.new
    tc = N("ShaderNodeTexCoord")
    mp = N("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value = (0, rad(ang), 0)
    mp.inputs["Scale"].default_value = (n, n, n)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    sep = N("ShaderNodeSeparateXYZ")
    nt.links.new(mp.outputs["Vector"], sep.inputs[0])
    comp = []
    for ax in ("X", "Z"):
        fr = N("ShaderNodeMath"); fr.operation = "FRACT"
        nt.links.new(sep.outputs[ax], fr.inputs[0])
        sb = N("ShaderNodeMath"); sb.operation = "SUBTRACT"; sb.inputs[1].default_value = 0.5
        nt.links.new(fr.outputs[0], sb.inputs[0])
        comp.append(sb)
    cb = N("ShaderNodeCombineXYZ")
    nt.links.new(comp[0].outputs[0], cb.inputs["X"])
    nt.links.new(comp[1].outputs[0], cb.inputs["Z"])
    ln = N("ShaderNodeVectorMath"); ln.operation = "LENGTH"
    nt.links.new(cb.outputs[0], ln.inputs[0])
    sep2 = N("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep2.inputs[0])
    mr = N("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = lo; mr.inputs["From Max"].default_value = hi
    mr.inputs["To Min"].default_value = rmin; mr.inputs["To Max"].default_value = rmax
    nt.links.new(sep2.outputs[axis], mr.inputs["Value"])
    df = N("ShaderNodeMath"); df.operation = "SUBTRACT"
    nt.links.new(mr.outputs[0], df.inputs[0]); nt.links.new(ln.outputs["Value"], df.inputs[1])
    fac = N("ShaderNodeMapRange")
    fac.inputs["From Min"].default_value = -aa; fac.inputs["From Max"].default_value = aa
    nt.links.new(df.outputs[0], fac.inputs["Value"])
    return fac.outputs[0]


def m_toon(name, col, soft=False, thr=0.5, shade=(0.70, 0.64, 0.80), half=None):
    """Toon: difuso → Shader to RGB → rampa constante (o lineal si soft) → emisión."""
    m, nt = _nt(name)
    N = nt.nodes.new
    out = N("ShaderNodeOutputMaterial"); d = N("ShaderNodeBsdfDiffuse")
    d.inputs["Color"].default_value = (1, 1, 1, 1)
    s = N("ShaderNodeShaderToRGB"); r = N("ShaderNodeValToRGB")
    nt.links.new(d.outputs[0], s.inputs[0]); nt.links.new(s.outputs[0], r.inputs[0])
    cr = r.color_ramp
    if soft:
        cr.interpolation = "LINEAR"
        cr.elements[0].position = 0.18; cr.elements[1].position = 0.80
    else:
        cr.interpolation = "CONSTANT"
        cr.elements[0].position = 0.0; cr.elements[1].position = thr
    cr.elements[0].color = (0, 0, 0, 1); cr.elements[1].color = (1, 1, 1, 1)
    base = N("ShaderNodeRGB"); base.outputs[0].default_value = hexc(col)
    base_out = base.outputs[0]
    if half:  # (color de punto, kwargs de la trama)
        hm = N("ShaderNodeMix"); hm.data_type = "RGBA"
        hm.inputs[7].default_value = hexc(half[0])
        nt.links.new(halftone_fac(nt, **half[1]), hm.inputs[0])
        nt.links.new(base_out, hm.inputs[6])
        base_out = hm.outputs[2]
    sh = N("ShaderNodeMix"); sh.data_type = "RGBA"; sh.blend_type = "MULTIPLY"
    sh.inputs[0].default_value = 1.0
    sh.inputs[7].default_value = shade + (1,)
    nt.links.new(base_out, sh.inputs[6])
    mix = N("ShaderNodeMix"); mix.data_type = "RGBA"
    nt.links.new(r.outputs[0], mix.inputs[0])
    nt.links.new(sh.outputs[2], mix.inputs[6]); nt.links.new(base_out, mix.inputs[7])
    em = N("ShaderNodeEmission")
    nt.links.new(mix.outputs[2], em.inputs[0]); nt.links.new(em.outputs[0], out.inputs[0])
    return m


def _set(node, name, v):
    try:
        node.inputs[name].default_value = v
    except Exception:
        pass


def m_volume(name, col, kind="skin", dots=None):
    """Avatar con volumen: Principled con luz real + textura según el tipo.
    skin = subsuperficie + poro fino · hair = mechones (ondas estiradas) + brillo anisótropo
    fabric = trama de tejido + lustre · metal = plata pulida."""
    m, nt = _nt(name)
    N = nt.nodes.new; L = nt.links.new
    out = N("ShaderNodeOutputMaterial"); p = N("ShaderNodeBsdfPrincipled")
    L(p.outputs[0], out.inputs[0])
    tc = N("ShaderNodeTexCoord")
    base = N("ShaderNodeRGB"); base.outputs[0].default_value = hexc(col)
    col_out = base.outputs[0]
    bump = N("ShaderNodeBump")
    if kind == "skin":
        _set(p, "Roughness", 0.55); _set(p, "Subsurface Weight", 0.12)
        _set(p, "Subsurface Radius", (0.9, 0.35, 0.2)); _set(p, "Subsurface Scale", 0.04)
        _set(p, "Specular IOR Level", 0.35)
        nz = N("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 260.0; nz.inputs["Detail"].default_value = 4.0
        L(tc.outputs["Object"], nz.inputs["Vector"])
        bump.inputs["Strength"].default_value = 0.06; L(nz.outputs[0], bump.inputs["Height"])
        # variación de tono suave (mejillas más cálidas en lo hondo)
        nz2 = N("ShaderNodeTexNoise"); nz2.inputs["Scale"].default_value = 6.0
        L(tc.outputs["Object"], nz2.inputs["Vector"])
        mx = N("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"
        mx.inputs[0].default_value = 0.10; L(nz2.outputs[0], mx.inputs[0])
        L(col_out, mx.inputs[6]); mx.inputs[7].default_value = (1.0, 0.80, 0.74, 1)
        col_out = mx.outputs[2]
    elif kind == "hair":
        _set(p, "Roughness", 0.38); _set(p, "Anisotropic", 0.85)
        _set(p, "Specular IOR Level", 0.75); _set(p, "Coat Weight", 0.12)
        mp = N("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1.0, 1.0, 0.06)
        L(tc.outputs["Object"], mp.inputs["Vector"])
        wv = N("ShaderNodeTexWave"); wv.wave_type = "BANDS"; wv.bands_direction = "X"
        wv.inputs["Scale"].default_value = 70.0; wv.inputs["Distortion"].default_value = 1.5
        wv.inputs["Detail"].default_value = 3.0; wv.inputs["Detail Scale"].default_value = 1.6
        L(mp.outputs[0], wv.inputs["Vector"])
        rp = N("ShaderNodeValToRGB"); L(wv.outputs[1], rp.inputs[0])
        c0 = hexc(col); hb = AVC.get("pelo_hebras")   # [oscura, clara] opcional
        rp.color_ramp.elements[0].color = hexc(hb[0]) if hb else tuple(min(1.0, v * 0.45) for v in c0[:3]) + (1,)
        rp.color_ramp.elements[1].color = hexc(hb[1]) if hb else tuple(min(1.0, v * 2.1 + 0.02) for v in c0[:3]) + (1,)
        rp.color_ramp.elements[0].position = 0.25; rp.color_ramp.elements[1].position = 0.85
        mx = N("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MIX"
        mx.inputs[0].default_value = 0.35; L(col_out, mx.inputs[6]); L(rp.outputs[0], mx.inputs[7])
        col_out = mx.outputs[2]
        bump.inputs["Strength"].default_value = 0.12; L(wv.outputs[1], bump.inputs["Height"])
    elif kind == "fabric":
        _set(p, "Roughness", 0.82); _set(p, "Sheen Weight", 0.55); _set(p, "Sheen Roughness", 0.4)
        _set(p, "Sheen Tint", (1.0, 0.85, 0.85, 1)); _set(p, "Specular IOR Level", 0.2)
        if dots:
            hm = N("ShaderNodeMix"); hm.data_type = "RGBA"
            hm.inputs[7].default_value = hexc(dots[0])
            L(halftone_fac(nt, **dots[1]), hm.inputs[0]); L(col_out, hm.inputs[6]); col_out = hm.outputs[2]
        bk = N("ShaderNodeTexBrick"); bk.inputs["Scale"].default_value = 520.0
        bk.inputs["Mortar Size"].default_value = 0.25; bk.offset = 0.5
        L(tc.outputs["Object"], bk.inputs["Vector"])
        nz = N("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 40.0
        L(tc.outputs["Object"], nz.inputs["Vector"])
        ad = N("ShaderNodeMath"); ad.operation = "ADD"; L(bk.outputs[1], ad.inputs[0])
        mu = N("ShaderNodeMath"); mu.operation = "MULTIPLY"; mu.inputs[1].default_value = 0.3
        L(nz.outputs[0], mu.inputs[0]); L(mu.outputs[0], ad.inputs[1])
        bump.inputs["Strength"].default_value = 0.18; L(ad.outputs[0], bump.inputs["Height"])
    elif kind == "metal":
        _set(p, "Metallic", 1.0); _set(p, "Roughness", 0.22)
        bump.inputs["Strength"].default_value = 0.0
    elif kind == "gloss":   # labios, iris: brillo húmedo
        _set(p, "Roughness", 0.18); _set(p, "Coat Weight", 0.6); _set(p, "Coat Roughness", 0.08)
        bump.inputs["Strength"].default_value = 0.0
    L(col_out, p.inputs["Base Color"])
    L(bump.outputs[0], p.inputs["Normal"])
    return m


_flat = {}


def MF(col):
    """Color plano (emisión): lo que vive dentro de la pantalla y en las tarjetas."""
    if col not in _flat:
        m, nt = _nt("flat" + col)
        out = nt.nodes.new("ShaderNodeOutputMaterial"); em = nt.nodes.new("ShaderNodeEmission")
        em.inputs[0].default_value = hexc(col)
        nt.links.new(em.outputs[0], out.inputs[0])
        _flat[col] = m
    return _flat[col]


def m_half(name, cola, colb, **kw):
    m, nt = _nt(name)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); em = nt.nodes.new("ShaderNodeEmission")
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"
    mx.inputs[6].default_value = hexc(cola); mx.inputs[7].default_value = hexc(colb)
    nt.links.new(halftone_fac(nt, **kw), mx.inputs[0])
    nt.links.new(mx.outputs[2], em.inputs[0]); nt.links.new(em.outputs[0], out.inputs[0])
    return m


def m_glare(alpha):
    m, nt = _nt("glare")
    N = nt.nodes.new
    out = N("ShaderNodeOutputMaterial"); em = N("ShaderNodeEmission"); tr = N("ShaderNodeBsdfTransparent")
    ms = N("ShaderNodeMixShader"); ms.inputs[0].default_value = alpha
    em.inputs[0].default_value = (1, 1, 1, 1)
    nt.links.new(tr.outputs[0], ms.inputs[1]); nt.links.new(em.outputs[0], ms.inputs[2])
    nt.links.new(ms.outputs[0], out.inputs[0])
    m.surface_render_method = "BLENDED"
    return m


M_OUT = MF(INK).copy(); M_OUT.name = "contorno"; M_OUT.use_backface_culling = True
try:
    M_OUT.use_backface_culling_shadow = True
except Exception:
    pass

# ───────────────────────── geometría ─────────────────────────
F = {k: bpy.data.fonts.load(FONTS + v) for k, v in dict(
    black="ArchivoBlack-Regular.ttf", ital="InstrumentSerif-Italic.ttf", helv=HELV).items()}


def link(o, loc=(0, 0, 0), parent=None, mat=None):
    scene.collection.objects.link(o)
    o.location = loc
    if parent:
        o.parent = parent
    if mat is not None:
        o.data.materials.append(mat)
    return o


def empty(name, loc=(0, 0, 0), parent=None):
    return link(bpy.data.objects.new(name, None), loc, parent)


def bm_obj(name, bm, loc, parent, mat, smooth=True):
    me = bpy.data.meshes.new(name)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me); bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    return link(bpy.data.objects.new(name, me), loc, parent, mat)


def rrect_pts(w, h, r, n=7):
    r = min(r, w / 2, h / 2)
    pts = []
    for cx, cz, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90),
                       (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(n + 1):
            a = rad(a0 + 90 * i / n)
            pts.append((cx + r * cos(a), cz + r * sin(a)))
    return pts


def circ_pts(r, n=40, rz=None):
    return [(r * cos(2 * pi * i / n), (rz or r) * sin(2 * pi * i / n)) for i in range(n)]


def gear_pts(r, teeth=8, depth=0.26):
    n = teeth * 4
    return [((r if i % 4 in (0, 1) else r * (1 - depth)) * cos(2 * pi * (i - 0.5) / n),
             (r if i % 4 in (0, 1) else r * (1 - depth)) * sin(2 * pi * (i - 0.5) / n)) for i in range(n)]


def flat(name, pts, col, loc=(0, 0, 0), parent=None, mat=None):
    """Polígono plano en XZ mirando a la cámara (-Y)."""
    me = bpy.data.meshes.new(name)
    me.from_pydata([(x, 0, z) for x, z in pts], [], [list(range(len(pts)))])
    me.update()
    return link(bpy.data.objects.new(name, me), loc, parent, mat or MF(col))


def prism(name, pts, y0, y1, loc=(0, 0, 0), parent=None, mat=None, smooth=False):
    bm = bmesh.new()
    vs = [bm.verts.new((x, y0, z)) for x, z in pts]
    f = bm.faces.new(vs)
    ex = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(0, y1 - y0, 0), verts=[e for e in ex["geom"] if isinstance(e, bmesh.types.BMVert)])
    return bm_obj(name, bm, loc, parent, mat, smooth)


def ellipsoid(name, sx, sy, sz, loc=(0, 0, 0), parent=None, mat=None, seg=32, rings=18, cut=None):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz))
    if cut:
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if cut(f.calc_center_median())], context="FACES")
    return bm_obj(name, bm, loc, parent, mat)


def capsule(name, r, length, loc=(0, 0, 0), parent=None, mat=None, seg=20):
    """Cápsula que cuelga hacia -Z desde su origen."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=12, radius=r)
    for v in bm.verts:
        if v.co.z < -1e-5:
            v.co.z -= length
    return bm_obj(name, bm, loc, parent, mat)


def cyl(name, r, depth, axis="Y", loc=(0, 0, 0), parent=None, mat=None, seg=40):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=depth)
    if axis == "Y":
        for v in bm.verts:
            v.co = Vector((v.co.x, v.co.z, v.co.y))
    o = bm_obj(name, bm, loc, parent, mat, smooth=False)
    return o


def rbox(name, w, d, h, r, loc=(0, 0, 0), parent=None, mat=None, seg=7):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * w, v.co.y * d, v.co.z * h))
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=r, segments=seg, profile=0.5, affect="EDGES")
    return bm_obj(name, bm, loc, parent, mat)


def outline(o, th=0.012):
    """Contorno de tinta: casco invertido (Solidify + normales volteadas + culling)."""
    o.data.materials.append(M_OUT)
    md = o.modifiers.new("contorno", "SOLIDIFY")
    md.thickness = th; md.offset = 1.0; md.use_flip_normals = True; md.use_rim = False
    md.material_offset = len(o.data.materials) - 1
    return o


def text(name, body, font, size, col, loc=(0, 0, 0), parent=None, align="LEFT", extrude=0.0, mat=None):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body; cu.font = F[font]; cu.size = size; cu.align_x = align; cu.extrude = extrude
    o = link(bpy.data.objects.new(name, cu), loc, parent, mat or MF(col))
    o.rotation_euler = (rad(90), 0, 0)
    return o


def width(o):
    bpy.context.view_layer.update()
    return o.dimensions.x


# ───────────────────────── animación ─────────────────────────
MODES = {}


def K(o, path, f, mode="BEZIER", index=-1):
    o.keyframe_insert(path, frame=f, index=index)
    MODES.setdefault((o.name, path), {})[int(f)] = mode


def vis(o, on, off=None):
    """Visible solo entre on y off: corte seco, sin animación de entrada."""
    s = o.scale.copy()
    if on > 0:
        o.scale = (0, 0, 0); K(o, "scale", 0, "CONSTANT")
    o.scale = s; K(o, "scale", on, "CONSTANT")
    if off is not None:
        o.scale = (0, 0, 0); K(o, "scale", off, "CONSTANT")
        o.scale = s
    return o


def fcurves_of(o):
    ad = o.animation_data
    if not ad or not ad.action:
        return
    act = ad.action
    if hasattr(act, "layers"):
        for layer in act.layers:
            for strip in layer.strips:
                cb = strip.channelbag(ad.action_slot)
                if cb:
                    yield from cb.fcurves
    else:
        yield from act.fcurves


def apply_modes():
    for o in bpy.data.objects:
        for fc in fcurves_of(o):
            d = MODES.get((o.name, fc.data_path), {})
            for kp in fc.keyframe_points:
                kp.interpolation = d.get(int(round(kp.co.x)), "BEZIER")
            fc.update()


# ───────────────────────── mundo, pared, luz ─────────────────────────
world = bpy.data.worlds.new("mundo"); scene.world = world
try:
    world.use_nodes = True
except Exception:
    pass
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (1, 0.97, 0.93, 1); bg.inputs[1].default_value = 0.30

WALL_Y = 1.6
wall = flat("pared", [(-6, -5), (6, -5), (6, 5), (-6, 5)], None, (0, WALL_Y, 0),
            mat=m_toon("pared", "#EFEAE0", soft=True, shade=(0.80, 0.76, 0.80),
                       half=("#DDD3BE", dict(n=7.5, axis="Z", lo=-2.6, hi=0.4, rmin=0.36, rmax=0.0))))


def sun(name, direction, strength, angle, shadow=True, color=(1, 1, 1)):
    L = bpy.data.lights.new(name, "SUN")
    L.energy = strength; L.angle = rad(angle); L.color = color
    L.use_shadow = shadow
    for k, v in (("use_shadow_jitter", True), ("shadow_jitter_overblur", 10.0)):
        try:
            setattr(L, k, v)
        except Exception:
            pass
    o = link(bpy.data.objects.new(name, L), (0, -5, 5))
    o.rotation_euler = Vector(direction).normalized().to_track_quat("-Z", "Y").to_euler()
    return o


sun("clave", (0.50, 0.72, -0.55), 3.3, 9, True, (1.0, 0.97, 0.92))
sun("relleno", (-0.6, 0.7, -0.1), 0.45, 20, False, (0.9, 0.94, 1.0))

# ───────────────────────── la tele física ─────────────────────────
TVX, TVY, TVZ = 0.0, 1.05, 0.46
TW, TH, TD = 2.0, 1.3, 0.55
SW, SH, SX = 1.38, 1.0, -0.2            # ventana de la pantalla y su corrimiento a la izquierda
FRONT = TVY - TD / 2                     # y de la cara frontal
YB, YM, YFR, YG = FRONT + 0.235, FRONT + 0.16, FRONT + 0.085, FRONT + 0.012
M_TV = m_toon("tele", ORANGE, thr=0.55, shade=(0.78, 0.62, 0.70))
tv = rbox("tele", TW, TD, TH, 0.13, (TVX, TVY, TVZ), None, M_TV)
cutter = prism("corte_pantalla", rrect_pts(SW, SH, 0.10), FRONT - 0.3, FRONT + 0.24, (TVX + SX, 0, TVZ))
cutter.hide_render = True; cutter.display_type = "WIRE"
bo = tv.modifiers.new("hueco", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cutter
outline(tv, 0.016)

# marco de tinta alrededor de la pantalla (anillo)
def ring(name, outer, inner, col, loc, parent=None):
    n = len(outer)
    vs = [(x, 0, z) for x, z in outer] + [(x, 0, z) for x, z in inner]
    fs = [[i, (i + 1) % n, n + (i + 1) % n, n + i] for i in range(n)]
    me = bpy.data.meshes.new(name); me.from_pydata(vs, [], fs); me.update()
    return link(bpy.data.objects.new(name, me), loc, parent, MF(col))


ring("marco", rrect_pts(SW + 0.09, SH + 0.09, 0.14), rrect_pts(SW, SH, 0.10), INK, (TVX + SX, FRONT - 0.004, TVZ))

# panel derecho: perillas, parlante, luz
PX = TVX + 0.745
M_KNOB = m_toon("perilla", CREAM, thr=0.5)
knob = outline(cyl("perilla1", 0.088, 0.07, "Y", (PX, FRONT - 0.035, TVZ + 0.36), None, M_KNOB), 0.012)
flat("perilla1_marca", rrect_pts(0.02, 0.085, 0.01), INK, (0, -0.037, 0.035), knob)
knob2 = outline(cyl("perilla2", 0.062, 0.06, "Y", (PX, FRONT - 0.03, TVZ + 0.12), None, M_KNOB), 0.012)
flat("perilla2_marca", rrect_pts(0.016, 0.06, 0.008), INK, (0, -0.032, 0.025), knob2)
knob2.rotation_euler.y = rad(-40)
for i in range(4):
    flat("parlante%d" % i, rrect_pts(0.2, 0.024, 0.012), INK, (PX, FRONT - 0.003, TVZ - 0.10 - i * 0.055))
led_on = flat("luz_on", circ_pts(0.022), YELLOW, (PX, FRONT - 0.004, TVZ - 0.40))
led_off = flat("luz_off", circ_pts(0.022), INK, (PX, FRONT - 0.003, TVZ - 0.40))
for f in range(0, NF + 12, 12):
    led_on.scale = (1, 1, 1) if (f // 12) % 2 == 0 else (0, 0, 0); K(led_on, "scale", max(f, 1), "CONSTANT")
# la perilla gira con cada corte de tarjeta (cambio de canal)
ang = 0
knob.rotation_euler.y = 0; K(knob, "rotation_euler", 1, "LINEAR")
for cut in (B2, B3, B4):
    K(knob, "rotation_euler", cut - 3, "LINEAR")
    ang += 55; knob.rotation_euler.y = rad(ang); K(knob, "rotation_euler", cut + 1, "LINEAR")
# patas y repisa
for sx in (-0.62, 0.62):
    outline(cyl("pata", 0.055, 0.09, "Z", (TVX + sx, TVY, TVZ - TH / 2 - 0.04), None, MF(INK)), 0.004)
SHELF_Z = TVZ - TH / 2 - 0.085
shelf = rbox("repisa", 5.0, 0.95, 0.07, 0.02, (0, WALL_Y - 0.475, SHELF_Z - 0.035), None,
             m_toon("repisa", "#D8C6A6", soft=True, shade=(0.74, 0.68, 0.72)))
# cristal: dos reflejos diagonales muy suaves
GL = m_glare(0.07)
flat("reflejo1", [(-0.62, 0.10), (-0.40, 0.47), (-0.18, 0.47), (-0.62, -0.25)], None, (TVX + SX, YG, TVZ), mat=GL)
flat("reflejo2", [(0.30, -0.47), (0.52, -0.47), (0.66, -0.25), (0.66, -0.02)], None, (TVX + SX, YG, TVZ), mat=GL)

# ───────────────────────── contenido de la pantalla ─────────────────────────
SCR = empty("pantalla", (TVX + SX, 0, TVZ))
_eps = {"b": 0, "m": 0, "f": 0}


def ly(layer):
    """Profundidad real dentro de la tele: fondo, medio, frente (con épsilon contra z-fighting)."""
    _eps[layer] += 1
    return {"b": YB, "m": YM, "f": YFR}[layer] - _eps[layer] * 0.0012


def S(parent, name, pts, col, x, z, layer="m", mat=None):
    return flat(name, pts, col, (x, ly(layer), z), parent, mat)


def T(parent, name, body, font, size, col, x, z, layer="f", align="LEFT"):
    return text(name, body, font, size, col, (x, ly(layer), z), parent, align)


def bot(parent, x, z, s=1.0, layer="m", col=ORANGE):
    """Asistente genérico: cabecita cuadrada con ojos."""
    e = empty("asistente", (x, 0, z), parent)
    S(e, "cab", rrect_pts(0.17 * s, 0.14 * s, 0.04 * s), col, 0, 0, layer)
    for sx in (-1, 1):
        S(e, "ojo", circ_pts(0.014 * s, 16, 0.02 * s), INK, sx * 0.035 * s, 0.005 * s, layer)
    S(e, "ant", rrect_pts(0.01 * s, 0.04 * s, 0.004), INK, 0, 0.088 * s, layer)
    S(e, "antb", circ_pts(0.016 * s, 16), YELLOW, 0, 0.118 * s, layer)
    return e


def vcard(parent, x, z, w, h, col, layer="m", play=CREAM):
    e = empty("video", (x, 0, z), parent)
    S(e, "v", rrect_pts(w, h, w * 0.18), col, 0, 0, layer)
    t = w * 0.22
    S(e, "play", [(-t * 0.7, -t), (t, 0), (-t * 0.7, t)], play, 0.005, 0, layer)
    return e


# — A · de noche, el equipo trabaja —
A = empty("A_noche", parent=SCR); vis(A, B1, B2)
S(A, "A_bg", rrect_pts(1.5, 1.14, 0.01), None, 0, 0, "b",
  m_half("A_bg", NAVY, "#3A4BA0", n=15, axis="Z", lo=-0.55, hi=0.35, rmin=0.56, rmax=0.0))
moon = empty("luna", (0.40, 0, 0.16), A)
S(moon, "luna", circ_pts(0.125, 48), CREAM, 0, 0, "b")
S(moon, "crater", circ_pts(0.03, 20), "#DCD2B8", -0.04, 0.03, "b")
S(moon, "crater", circ_pts(0.018, 16), "#DCD2B8", 0.045, -0.03, "b")
K(moon, "location", B1, "LINEAR"); moon.location.z = 0.29; K(moon, "location", B2, "LINEAR")
for i, (x, z) in enumerate([(-0.55, 0.36), (-0.2, 0.42), (0.08, 0.30), (0.6, 0.40), (-0.36, 0.20), (0.18, 0.44), (0.62, 0.02)]):
    st = S(A, "estrella", circ_pts(0.013, 12), CREAM, x, z, "b")
    for f in range(B1, B2, 7):
        st.scale = (1, 1, 1) if ((f // 7) + i) % 3 else (0.35, 0.35, 0.35); K(st, "scale", f, "CONSTANT")
for i, (x, z, s, f) in enumerate([(-0.60, 0.02, 0.10, 8), (-0.50, 0.11, 0.14, 15), (-0.38, 0.22, 0.19, 22)]):
    vis(T(A, "zeta", "Z", "black", s, CREAM, x, z, "m"), f)
S(A, "mesa", rrect_pts(1.5, 0.055, 0.02), CREAM, 0, -0.335, "f")
for i, x in enumerate((-0.44, 0.0, 0.44)):
    b = bot(A, x, -0.065, 1.05, "m")
    for f in range(B1, B2 + 6, 6):
        b.location.z = -0.065 + 0.016 * sin(f * 0.45 + i * 2.1); K(b, "location", f)
    S(A, "pie", rrect_pts(0.03, 0.06, 0.005), INK, x, -0.285, "f")
    S(A, "monitor", rrect_pts(0.25, 0.18, 0.03), INK, x, -0.19, "f")
    p1 = S(A, "luzA", rrect_pts(0.205, 0.135, 0.02), YELLOW, x, -0.19, "f")
    p2 = S(A, "luzB", rrect_pts(0.205, 0.135, 0.02), ORANGE, x, -0.19, "f")
    for k, f in enumerate(range(B1, B2, 5)):
        p2.scale = (1, 1, 1) if (k + i) % 2 else (0, 0, 0); K(p2, "scale", f, "CONSTANT")
    for j in range(3):   # líneas de «trabajo» en el monitor
        S(A, "linea", rrect_pts(0.13 - j * 0.03, 0.014, 0.006), INK, x - 0.02 - j * 0.015 + 0.0, -0.155 - j * 0.034, "f")
    vis(vcard(A, x + 0.13, 0.12, 0.085, 0.14, CREAM, "m", ORANGE), 36 + i * 10)

# — B · 1 idea → 8 videos —
B = empty("B_idea", parent=SCR); vis(B, B2, B3)
S(B, "B_bg", rrect_pts(1.5, 1.14, 0.01), None, 0, 0, "b",
  m_half("B_bg", CREAM, YELLOW, n=15, axis="X", lo=-0.3, hi=0.75, rmin=0.0, rmax=0.56))
S(B, "idea_borde", rrect_pts(0.36, 0.50, 0.05), INK, -0.46, 0, "m")
S(B, "idea", rrect_pts(0.325, 0.465, 0.035), WHITE, -0.46, 0, "m")
rays = empty("rayos", (-0.46, 0, 0.07), B)
for i in range(7):
    a = rad(-30 + i * 40)
    r_ = S(rays, "rayo", rrect_pts(0.014, 0.04, 0.006), INK, 0.125 * cos(a), 0.125 * sin(a), "m")
    r_.rotation_euler.y = -(a - pi / 2)
vis(rays, B2 + 4)
K(rays, "rotation_euler", B2, "LINEAR"); rays.rotation_euler.y = rad(-50); K(rays, "rotation_euler", B3, "LINEAR")
S(B, "foco", circ_pts(0.078, 40), YELLOW, -0.46, 0.07, "m")
S(B, "rosca", rrect_pts(0.062, 0.05, 0.012), INK, -0.46, -0.025, "m")
T(B, "t_idea", "1 idea", "black", 0.062, INK, -0.46, -0.165, "m", "CENTER")
arrow = S(B, "flecha", [(0, -0.016), (0.17, -0.016), (0.17, 0.016), (0, 0.016)], INK, -0.25, 0, "m")
arrow.scale = (0, 1, 1); K(arrow, "scale", B2 + 6, "LINEAR"); arrow.scale = (1, 1, 1); K(arrow, "scale", B2 + 14, "LINEAR")
vis(S(B, "punta", [(0, -0.05), (0.07, 0), (0, 0.05)], INK, -0.085, 0, "m"), B2 + 14)
GRID_ON = [B2 + 20 + 4 * k for k in range(8)]
for k in range(8):
    cx, cz = 0.085 + (k % 4) * 0.158, 0.125 - (k // 4) * 0.25
    col = [COBALT, ORANGE, INK, COBALT, ORANGE, INK, COBALT, ORANGE][k]
    vis(vcard(B, cx, cz, 0.128, 0.215, col, "f"), GRID_ON[k])
badge = empty("insignia", (0.60, 0, 0.30), B)
S(badge, "ins", circ_pts(0.062, 32), INK, 0, 0, "f")
T(badge, "ins_t", "8", "black", 0.08, YELLOW, 0, -0.028, "f", "CENTER")
vis(badge, GRID_ON[-1] + 5)

# — C · en automático: la banda —
C = empty("C_auto", parent=SCR); vis(C, B3, B4)
S(C, "C_bg", rrect_pts(1.5, 1.14, 0.01), None, 0, 0, "b",
  m_half("C_bg", YELLOW, "#FF8F1F", n=15, axis="Z", lo=-0.55, hi=0.3, rmin=0.56, rmax=0.0))
for (gx, gz, gr, sp, col, teeth) in ((0.40, 0.21, 0.17, 1.0, CREAM, 10), (0.155, 0.30, 0.105, -1.667, INK, 6)):
    g = S(C, "engrane", gear_pts(gr, teeth), col, gx, gz, "b")
    S(g, "eje", circ_pts(gr * 0.28, 20), YELLOW if col == INK else INK, 0, 0, "b").location = (0, -0.002, 0)
    K(g, "rotation_euler", B3, "LINEAR"); g.rotation_euler.y = rad(200 * sp); K(g, "rotation_euler", B4, "LINEAR")
S(C, "banda", rrect_pts(1.5, 0.07, 0.03), INK, 0, -0.30, "m")
for i in range(7):
    ro = S(C, "rodillo", circ_pts(0.036, 20), CREAM, -0.66 + i * 0.22, -0.30, "m")
    S(ro, "marca", circ_pts(0.011, 10), INK, 0.016, 0, "m").location = (0.017, -0.002, 0)
    K(ro, "rotation_euler", B3, "LINEAR"); ro.rotation_euler.y = rad(900); K(ro, "rotation_euler", B4, "LINEAR")
SPAN, NC, VEL = 1.56, 6, 0.0125
for k in range(NC):
    c = vcard(C, 0, -0.155, 0.118, 0.19, [COBALT, ORANGE, INK][k % 3], "m")
    for f in range(B3, B4 + 1):
        c.location.x = -0.74 + ((k * SPAN / NC + (f - B3) * VEL) % SPAN); K(c, "location", f, "LINEAR", 0)
S(C, "maquina", rrect_pts(0.46, 0.66, 0.06), INK, -0.52, -0.03, "f")
S(C, "chimenea", rrect_pts(0.08, 0.16, 0.02), INK, -0.62, 0.34, "f")
S(C, "ventana", circ_pts(0.115, 36), CREAM, -0.52, 0.10, "f")
gm = S(C, "engrane_m", gear_pts(0.085, 8), ORANGE, -0.52, 0.10, "f")
K(gm, "rotation_euler", B3, "LINEAR"); gm.rotation_euler.y = rad(-420); K(gm, "rotation_euler", B4, "LINEAR")
S(C, "boca", rrect_pts(0.10, 0.24, 0.02), "#3A362C", -0.335, -0.155, "f")
for i in range(3):
    l_ = S(C, "piloto", circ_pts(0.02, 14), [YELLOW, ORANGE, CREAM][i], -0.60 + i * 0.08, -0.13, "f")
    for k, f in enumerate(range(B3, B4, 6)):
        l_.scale = (1, 1, 1) if (k + i) % 3 == 0 else (0.45, 0.45, 0.45); K(l_, "scale", f, "CONSTANT")
bt = bot(C, -0.40, 0.385, 0.95, "f", ORANGE)
for f in range(B3, B4 + 6, 6):
    bt.location.z = 0.385 + 0.014 * sin(f * 0.5); K(bt, "location", f)

# — D · comenta [CTA] —
D = empty("D_cta", parent=SCR); vis(D, B4, END)
S(D, "D_bg", rrect_pts(1.5, 1.14, 0.01), None, 0, 0, "b",
  m_half("D_bg", COBALT, "#5672F2", n=15, axis="Z", lo=-0.55, hi=0.35, rmin=0.56, rmax=0.0))
S(D, "globo_borde", rrect_pts(1.20, 0.47, 0.10), INK, 0, 0.12, "m")
S(D, "cola_borde", [(-0.40, -0.10), (-0.22, -0.10), (-0.44, -0.27)], INK, 0, 0.0, "m")
S(D, "globo", rrect_pts(1.15, 0.42, 0.08), CREAM, 0, 0.12, "m")
S(D, "cola", [(-0.385, -0.085), (-0.255, -0.085), (-0.415, -0.215)], CREAM, 0, 0.0, "m")


def typed(parent, word, font, size, col, x, z, layer, start, step, maker):
    """Palabra que se teclea: una subcadena visible por tramo (corte seco). Devuelve anchos."""
    ws = []
    for k in range(1, len(word) + 1):
        o = maker(parent, "tecla%d" % k, word[:k], font, size, col, x, z, layer)
        ws.append(width(o))
        vis(o, start + (k - 1) * step, start + k * step if k < len(word) else None)
    return ws


probe = T(D, "probe", CTA, "black", 1.0, INK, 0, 0, "f"); w1 = width(probe)
bpy.data.objects.remove(probe)
FS = 0.98 / w1
TYPE0 = B4 + 8
ws = typed(D, CTA, "black", FS, INK, -0.50, 0.12 - FS * 0.36, "f", TYPE0, 3, T)
cur = S(D, "cursor", rrect_pts(0.022, FS * 0.78, 0.004), ORANGE, -0.48, 0.12, "f")
K(cur, "location", B4, "CONSTANT", 0)
for k, w_ in enumerate(ws):
    cur.location.x = -0.50 + w_ + 0.03; K(cur, "location", TYPE0 + k * 3, "CONSTANT", 0)
for k, f in enumerate(range(TYPE0 + 24, END, 7)):
    cur.scale = (1, 1, 1) if k % 2 else (0, 0, 0); K(cur, "scale", f, "CONSTANT")
send = empty("enviar", (0.50, 0, -0.30), D)
S(send, "env", circ_pts(0.085, 36), ORANGE, 0, 0, "f")
S(send, "env_f", [(-0.03, -0.04), (0.045, 0), (-0.03, 0.04), (-0.012, 0)], CREAM, 0, 0, "f")
vis(send, TYPE0 + 24)
for i, (x, z, f, dot) in enumerate([(-0.02, -0.255, TYPE0 + 32, YELLOW), (-0.14, -0.375, TYPE0 + 41, ORANGE)]):
    p = empty("pildora", (x, 0, z), D)
    S(p, "pil", rrect_pts(0.56, 0.095, 0.047), CREAM, 0, 0, "f")
    S(p, "pil_dot", circ_pts(0.03, 20), dot, -0.225, 0, "f")
    T(p, "pil_t", CTA, "black", 0.058, INK, -0.17, -0.021, "f")
    S(p, "pil_cor", circ_pts(0.016, 14), ORANGE, 0.225, 0, "f")
    vis(p, f)

# — cambio de canal: 4 cuadros de trama gruesa tapan el corte (transición, no salto de diapositiva) —
for j, (n_, ca_, cb2_) in enumerate(((5.0, INK, CREAM), (8.5, CREAM, INK))):
    stc = flat("estatica%d" % j, rrect_pts(1.5, 1.14, 0.01), None, (0, YFR - 0.05, 0), SCR,
               m_half("estatica%d" % j, ca_, cb2_, n=n_, axis="X", lo=-0.8, hi=0.8, rmin=0.60, rmax=0.22, ang=20 + 50 * j))
    stc.scale = (0, 0, 0); K(stc, "scale", 0, "CONSTANT")
    for cut in (B2, B3, B4):
        on = cut - 2 + 2 * j
        stc.scale = (1, 1, 1); K(stc, "scale", on, "CONSTANT")
        stc.scale = (0, 0, 0); K(stc, "scale", on + 2, "CONSTANT")

# ───────────────────────── tarjeta de la app (cambia con cada frase) ─────────────────────────
CARD = empty("tarjeta_app", (-0.50, 0.70, SHELF_Z - 0.26))
CARD.rotation_euler.y = rad(2.5)
cbase = prism("tarjeta_base", rrect_pts(1.02, 0.29, 0.07), 0, 0.022, (0, 0, 0), CARD, m_toon("tarjeta", WHITE, soft=True, shade=(0.86, 0.84, 0.88)))
outline(cbase, 0.009)
_ce = [0]


def cy():
    _ce[0] += 1
    return -0.002 - _ce[0] * 0.0008


def CS(parent, name, pts, col, x, z):
    return flat(name, pts, col, (x, cy(), z), parent)


def CT(parent, name, body, font, size, col, x, z, layer=None, align="LEFT"):
    return text(name, body, font, size, col, (x, cy(), z), parent, align)


ca = empty("app_A", parent=CARD); vis(ca, B1, B2)
st_dot = CS(ca, "estado", circ_pts(0.04, 24), ORANGE, -0.40, 0)
for k, f in enumerate(range(B1, B2, 8)):
    st_dot.scale = (1, 1, 1) if k % 2 == 0 else (0.6, 0.6, 0.6); K(st_dot, "scale", f, "CONSTANT")
CT(ca, "a1", "Tu equipo", "black", 0.078, INK, -0.32, 0.018)
CT(ca, "a2", "en turno · 3:12 a. m.", "helv", 0.058, "#6E685C", -0.32, -0.078)
CS(ca, "a_luna", circ_pts(0.05, 28), YELLOW, 0.39, 0.0)
CS(ca, "a_luna2", circ_pts(0.042, 28), WHITE, 0.412, 0.018)

cb_ = empty("app_B", parent=CARD); vis(cb_, B2, B3)
CT(cb_, "b1", "Videos listos", "black", 0.07, INK, -0.43, 0.03)
for k in range(8):
    x = -0.43 + 0.05 + k * 0.108
    CS(cb_, "seg0", rrect_pts(0.094, 0.04, 0.02), "#DDD6C8", x, -0.065)
    vis(CS(cb_, "seg1", rrect_pts(0.094, 0.04, 0.02), ORANGE, x, -0.065), GRID_ON[k])

cc = empty("app_C", parent=CARD); vis(cc, B3, B4)
CT(cc, "c1", "Modo automático", "black", 0.07, INK, -0.43, -0.024)
TOG = B3 + 12
CS(cc, "tog0", rrect_pts(0.17, 0.09, 0.045), "#CFC8BA", 0.36, 0)
vis(CS(cc, "tog1", rrect_pts(0.17, 0.09, 0.045), ORANGE, 0.36, 0), TOG)
tk = CS(cc, "tog_k", circ_pts(0.034, 24), WHITE, 0.32, 0)
K(tk, "location", B3, "CONSTANT", 0); tk.location.x = 0.40; K(tk, "location", TOG, "CONSTANT", 0)

cd = empty("app_D", parent=CARD); vis(cd, B4, END)
CS(cd, "campo_b", rrect_pts(0.74, 0.17, 0.085), INK, -0.10, 0)
CS(cd, "campo", rrect_pts(0.715, 0.145, 0.072), CREAM, -0.10, 0)
vis(CT(cd, "ph", "Comenta…", "helv", 0.062, GRAY, -0.40, -0.022), B4, TYPE0)
typed(cd, CTA, "black", 0.078, INK, -0.40, -0.028, None, TYPE0, 3, CT)
CS(cd, "d_env", circ_pts(0.068, 30), ORANGE, 0.385, 0)
CS(cd, "d_env_f", [(-0.024, -0.032), (0.036, 0), (-0.024, 0.032), (-0.01, 0)], WHITE, 0.385, 0)

# ───────────────────────── titular (palabra por palabra, corte seco) ─────────────────────────
TY, TX0 = 1.43, -1.0
M_T = {INK: m_toon("t_tinta", INK, soft=True), ORANGE: m_toon("t_naranja", ORANGE, soft=True, shade=(0.8, 0.7, 0.75)),
       COBALT: m_toon("t_cobalto", COBALT, soft=True, shade=(0.8, 0.75, 0.8))}
Z1, Z2, IT = 1.615, 1.275, 0.235


def tline(parent, words, z, x0=TX0):
    """words: (texto, fuente, tamaño o ('fit', ancho, máx), color, cuadro de entrada)."""
    x = x0
    for i, (body, font, size, col, f) in enumerate(words):
        o = text("w_" + body, body, font, 1.0, col, (x, TY, z), parent, "LEFT", 0.012, M_T[col])
        if isinstance(size, tuple):
            size = min(size[2], (size[1] - (x - x0)) / width(o))
        o.data.size = size
        vis(o, f)
        x += width(o) + size * 0.24
    return x


t1 = empty("titulo1"); vis(t1, B1, B2)
tline(t1, [("Tu", "ital", IT, INK, 3), ("equipo", "ital", IT, INK, 8), ("trabaja", "ital", IT, INK, 14)], Z1)
tline(t1, [("mientras", "ital", IT, INK, 24), ("DUERMES", "black", ("fit", 2.0, 0.34), ORANGE, 32)], Z2)
t2 = empty("titulo2"); vis(t2, B2, B3)
tline(t2, [("de", "ital", IT, INK, B2 + 2), ("1", "ital", IT, INK, B2 + 6), ("idea", "ital", IT, INK, B2 + 6), ("salen", "ital", IT, INK, B2 + 13)], Z1)
tline(t2, [("8 VIDEOS", "black", ("fit", 2.0, 0.36), COBALT, B2 + 20)], Z2)
t3 = empty("titulo3"); vis(t3, B3, B4)
tline(t3, [("y", "ital", IT, INK, B3 + 2), ("todo", "ital", IT, INK, B3 + 6), ("sale", "ital", IT, INK, B3 + 10), ("en", "ital", IT, INK, B3 + 15)], Z1)
tline(t3, [("AUTOMÁTICO", "black", ("fit", 2.0, 0.36), ORANGE, TOG)], Z2)
t4 = empty("titulo4"); vis(t4, B4, END)
tline(t4, [("Comenta", "ital", IT, INK, B4 + 2)], Z1)
tline(t4, [(CTA, "black", ("fit", 2.0, 0.40), ORANGE, TYPE0)], Z2 - 0.02)

# ───────────────────────── avatar (con volumen) ─────────────────────────
# Los rasgos salen de AVC (config.json → "avatar"): piel, pelo, ropa, lunares de la ropa,
# collar con dije, aretes, lunares y pecas de la cara, labios e iris.
def hair_lock(name, path, widths, thick, parent, mat, yaw=None, ring=18):
    """Lámina de pelo: anillos elípticos a lo largo de un recorrido, punta afilada."""
    bm = bmesh.new(); rings = []
    for i, (c, w) in enumerate(zip(path, widths)):
        a = rad(yaw[i]) if yaw else 0.0
        t = thick * (0.35 + 0.65 * min(1.0, w / max(widths)))
        rg = []
        for k in range(ring):
            u = 2 * pi * k / ring
            lx, ly = w * cos(u), t * sin(u)
            rg.append(bm.verts.new((c[0] + lx * cos(a) - ly * sin(a), c[1] + lx * sin(a) + ly * cos(a), c[2])))
        rings.append(rg)
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(ring):
            bm.faces.new((r0[k], r0[(k + 1) % ring], r1[(k + 1) % ring], r1[k]))
    for rg in (rings[0], rings[-1]):
        bm.faces.new(rg)
    o = bm_obj(name, bm, (0, 0, 0), parent, mat)
    sd = o.modifiers.new("suave", "SUBSURF"); sd.levels = 2; sd.render_levels = 2
    return o


SKIN = AVC["piel"]; HAIR = AVC["pelo"]; RED = AVC["ropa"]; SILVER = "#D9DCE2"
# 11-nov v2: materiales con volumen (luz real + textura), ya no toon plano de 2 tonos
M_SKIN = m_volume("piel", SKIN, "skin")
M_HAIR = m_volume("pelo", HAIR, "hair")
M_CARD = m_volume("polera", RED, "fabric",
                  dots=(WHITE, dict(n=11.0, rmin=0.17, rmax=0.17, ang=0, aa=0.03)) if AVC["lunares_ropa"] else None)
M_SILV = m_volume("plata", SILVER, "metal")
M_LIP = m_volume("labios", AVC["labios"], "gloss")
M_IRIS = m_volume("iris", AVC["iris"], "gloss")
M_EYEW = m_volume("ojo_blanco", "#FBF6F0", "gloss")
M_BLUSH = m_volume("rubor", "#F2A08A", "skin")
M_BROW = m_volume("ceja", "#3A1E14", "hair")
OW = 0.008
AVX, AVZ = 0.50, -2.02
AV = empty("avatar", (AVX, 0.0, AVZ)); AV.scale = (0.9, 0.9, 0.9)
torso = outline(ellipsoid("torso", 0.34, 0.21, 0.56, (0, 0, 0), AV, M_CARD, 48, 28), OW)
for sx in (-1, 1):
    outline(ellipsoid("hombro", 0.13, 0.135, 0.12, (sx * 0.25, 0, 0.32), AV, M_CARD, 32, 18), OW)
outline(capsule("cuello", 0.072, 0.22, (0, 0, 0.66), AV, M_SKIN, 28), OW)
# escote redondo de piel
ellipsoid("escote", 0.11, 0.02, 0.07, (0, -0.165, 0.46), AV, M_SKIN, 24, 12).rotation_euler.x = rad(-18)
if AVC["collar"]:
    # cadena plateada en V con dije de corazón (eslabones alternados = cadena de verdad)
    for i in range(21):
        t = (i / 20.0) * 2 - 1
        x, z = 0.115 * t, 0.50 - 0.15 * (1 - abs(t)) ** 0.9
        lk = ellipsoid("eslabon", 0.011, 0.0045 if i % 2 else 0.009, 0.008, (x, -0.205 + 0.03 * abs(t), z), AV, M_SILV, 12, 8)
        lk.rotation_euler.y = rad(70 * t)
    cor = empty("corazon", (0, -0.215, 0.315), AV)
    for sx in (-1, 1):
        outline(ellipsoid("lobulo", 0.021, 0.012, 0.021, (sx * 0.016, 0, 0.012), cor, M_SILV, 16, 10), 0.004)
    outline(ellipsoid("punta", 0.026, 0.012, 0.026, (0, 0, -0.008), cor, M_SILV, 16, 10), 0.004).rotation_euler.y = rad(45)
HP = empty("cabeza_pivote", (0, 0, 0.58), AV)
HA, HB, HC = 0.30, 0.29, 0.34
HZ = 0.36                                      # centro de la cabeza sobre el pivote
# pelo de atrás: cae largo por la espalda, lacio
outline(ellipsoid("pelo_atras", 0.37, 0.14, 0.80, (0, 0.13, HZ - 0.36), HP, M_HAIR, 40, 24), OW)
outline(ellipsoid("cabeza", HA, HB, HC, (0, 0, HZ), HP, M_SKIN, 48, 28), OW)
# casco de pelo en dos mitades: la raya al medio se ve como un pliegue real
for sx in (-1, 1):
    h = outline(ellipsoid("pelo", 0.30, 0.30, 0.37, (sx * 0.028, 0.075, HZ + 0.075), HP, M_HAIR, 64, 32), OW)
    h.rotation_euler.y = rad(sx * -5)
for sx in (-1, 1):
    # cortina lacia que enmarca la cara y cae sobre el pecho
    cort = outline(capsule("cortina", 0.10, 0.84, (sx * 0.255, -0.10, HZ + 0.20), HP, M_HAIR, 28), OW)
    cort.scale = (0.95, 0.55, 1.0); cort.rotation_euler = (rad(4), rad(sx * -3), 0)
    cort.hide_render = True; cort.hide_viewport = True
    for c in cort.children:
        c.hide_render = True
    # láminas lacias que nacen en la raya, enmarcan la cara y caen sobre el pecho, con punta
    Z0 = HZ + 0.33
    for j, (ox, oy, wk, ln) in enumerate(((0.0, 0.0, 1.0, 1.0), (0.035, 0.02, 0.8, 0.9), (-0.02, -0.012, 0.7, 0.82))):
        zs = [Z0, HZ + 0.22, HZ + 0.08, HZ - 0.08, HZ - 0.24, HZ - 0.42, HZ - 0.62, HZ - 0.82 * ln - 0.08, HZ - 0.95 * ln - 0.08]
        xs = [0.06, 0.22, 0.285, 0.292, 0.282, 0.27, 0.262, 0.255, 0.252]
        ys = [-0.18, -0.16, -0.10, -0.085, -0.10, -0.14, -0.17, -0.17, -0.165]
        ws = [0.05, 0.09, 0.075, 0.07, 0.075, 0.085, 0.08, 0.05, 0.008]
        yw = [sx * 25, sx * 55, sx * 75, sx * 80, sx * 60, sx * 20, sx * 8, 0, 0]
        outline(hair_lock("lamina", [(sx * (x + ox), y + oy - 0.004 * j, z) for x, y, z in zip(xs, ys, zs)],
                  [w * wk for w in ws], 0.032, HP, M_HAIR, yw), OW * 0.7)
    # arete pequeño
    if AVC["aretes"]:
        ellipsoid("arete", 0.016, 0.012, 0.016, (sx * 0.298, -0.04, HZ - 0.08), HP, M_SILV, 14, 10)


def face_y(x, z, lift=0.0):
    return -HB * sqrt(max(0.0, 1 - (x / HA) ** 2 - (z / HC) ** 2)) - lift


eyes = []
for sx in (-1, 1):
    x, z = sx * 0.118, 0.015
    # ojo de verdad: blanco + iris café + pupila + 2 brillos + párpado con delineado
    e = ellipsoid("ojo", 0.052, 0.016, 0.052, (x, face_y(x, z, 0.007), HZ + z), HP, M_EYEW, 24, 14)
    e.rotation_euler.z = rad(sx * 24)
    ir = ellipsoid("iris", 0.034, 0.010, 0.037, (0, -0.010, -0.002), e, M_IRIS, 24, 14)
    ellipsoid("pupila", 0.014, 0.006, 0.015, (0, -0.007, 0), ir, MF(INK), 16, 10)
    ellipsoid("brillo", 0.009, 0.004, 0.010, (sx * -0.009 + 0.004, -0.010, 0.012), ir, MF(WHITE), 12, 8)
    ellipsoid("brillo2", 0.004, 0.003, 0.004, (0.010, -0.010, -0.012), ir, MF(WHITE), 8, 6)
    lid = ellipsoid("parpado", 0.058, 0.012, 0.006, (0, -0.006, 0.051), e, MF(INK), 20, 8)
    ellipsoid("rabito", 0.026, 0.005, 0.006, (sx * 0.058, -0.002, 0.057), e, MF(INK), 12, 6).rotation_euler.y = rad(sx * -30)
    eyes.append(e)
    x, z = sx * 0.125, 0.112
    br = ellipsoid("ceja", 0.062, 0.016, 0.017, (x, face_y(x, z, 0.006), HZ + z), HP, M_BROW, 20, 10)
    br.rotation_euler = (0, rad(sx * -9), rad(sx * 24))
    x, z = sx * 0.19, -0.075
    ellipsoid("rubor", 0.052, 0.010, 0.032, (x, face_y(x, z, -0.002), HZ + z), HP, M_BLUSH, 20, 12).rotation_euler.z = rad(sx * 32)
    for k in range(4 if AVC["pecas"] else 0):   # pecas finas
        fx, fz = sx * (0.155 + 0.018 * k), -0.035 - 0.012 * (k % 2)
        ellipsoid("peca", 0.0035, 0.002, 0.0035, (fx, face_y(fx, fz, 0.001), HZ + fz), HP, MF("#B9744F"), 6, 4)
# nariz con volumen (recibe luz) + fosas
ellipsoid("nariz", 0.024, 0.026, 0.020, (0, face_y(0, -0.05, -0.010), HZ - 0.05), HP, M_SKIN, 20, 12)
for sx in (-1, 1):
    ellipsoid("fosa", 0.007, 0.004, 0.004, (sx * 0.012, face_y(sx * 0.012, -0.066, 0.016), HZ - 0.066), HP, MF("#9C5A40"), 8, 6)
mouth = ellipsoid("boca", 0.058, 0.010, 0.020, (0, face_y(0, -0.145, 0.002), HZ - 0.145), HP, MF("#6E1E24"), 20, 10)
MY = face_y(0, -0.145, 0.002) - 0.004; MZ = HZ - 0.145
lip_up = ellipsoid("labio_sup", 0.064, 0.016, 0.013, (0, MY, MZ + 0.010), HP, M_LIP, 24, 12)
lip_dn = ellipsoid("labio_inf", 0.058, 0.018, 0.017, (0, MY, MZ - 0.012), HP, M_LIP, 24, 12)
for (x, z) in (((-0.07, -0.118), (0.10, -0.13), (0.0, -0.24)) if AVC["lunares_cara"] else ()):
    ellipsoid("lunar", 0.005, 0.003, 0.005, (x, face_y(x, z, 0.002), HZ + z), HP, MF("#4A2A20"), 8, 6)

# luces del avatar: contraluz cálido (separa el pelo de la pared) + relleno suave desde la izquierda
for nm, loc, en, colr, size in (("contraluz", (AVX + 0.9, 0.9, AVZ + 1.1), 60.0, (1.0, 0.78, 0.6), 0.6),
                                 ("relleno_av", (AVX - 1.2, -1.6, AVZ + 0.9), 45.0, (1.0, 0.95, 0.92), 1.2)):
    Ld = bpy.data.lights.new(nm, "AREA"); Ld.energy = en; Ld.color = colr; Ld.size = size
    lo = link(bpy.data.objects.new(nm, Ld), loc)
    lo.rotation_euler = (Vector((AVX, 0, AVZ + 0.5)) - Vector(loc)).normalized().to_track_quat("-Z", "Y").to_euler()

arms = {}
for side, sx in (("L", -1), ("R", 1)):
    sh = empty("hombro_" + side, (sx * 0.31, 0, 0.28), AV)
    outline(capsule("manga", 0.098, 0.13, (0, 0, 0), sh, M_CARD, 28), OW)
    outline(capsule("brazo", 0.074, 0.36, (0, 0, 0), sh, M_SKIN), OW)
    el = empty("codo_" + side, (0, 0, -0.38), sh)
    outline(capsule("antebrazo", 0.068, 0.30, (0, 0, 0), el, M_SKIN), OW)
    wr = empty("muneca_" + side, (0, -0.005, -0.37), el)
    outline(ellipsoid("palma", 0.078, 0.042, 0.088, (0, 0, -0.07), wr, M_SKIN, 20, 12), OW * 0.9)
    for i, fx in enumerate((-0.052, -0.018, 0.018, 0.052)):
        fg = outline(capsule("dedo", 0.0215, 0.075 + (0.012 if i in (1, 2) else 0), (fx, 0, -0.125), wr, M_SKIN, 12), OW * 0.8)
        fg.rotation_euler.y = rad(-fx * 300)
    th = outline(capsule("pulgar", 0.024, 0.06, (-sx * 0.062, 0, -0.045), wr, M_SKIN, 12), OW * 0.8)
    th.rotation_euler.y = rad(sx * 58)
    arms[side] = (sh, el, wr)

# poses: cuadro, hombroL, codoL, hombroR, codoR, cabeza ladeo, cabeza giro, muñecaL, muñecaR
POSES = [
    (1,   52, 118, -22, -150,  7,  5,  10,  10),
    (14,  58, 110, -24, -146,  5,  2,   0,  12),
    (30,  54, 120, -26, -150,  8,  6,  12,   8),
    (40,  44, 104, -44, -104, -6, -4, -10,  10),
    (56,  48,  98, -48,  -98, -4, -1,  -4,   4),
    (72,  44, 104, -44, -106, -6, -3, -10,  10),
    (82,  30, 148, -20, -150,  6,  5,   0,  10),
    (94,  32, 144, -22, -148,  4,  3,   6,  10),
    (104, 80,  58, -70,  -70, -4, -3, -14,  14),
    (124, 75,  66, -66,  -78, -2,  1,  -6,   6),
    (146, 78,  60, -70,  -72, -4, -2, -12,  12),
    (158, 38, 106, -36, -112,  7,  3,  -8,   8),
    (172, 46,  92, -30, -124,  4, -2,   8,  -6),
    (186, 34, 114, -42, -100,  7,  4, -10,  10),
    (200, 46,  92, -30, -124,  3, -3,   8,  -6),
    (216, 38, 108, -38, -106,  6,  2,  -6,   6),
    (230, 66, 106, -26, -152, -8,  6,  14,  10),
    (250, 72,  98, -28, -148, -6,  3,   4,  12),
    (272, 64, 108, -26, -154, -9,  6,  16,   8),
    (300, 70, 100, -28, -150, -6,  4,   8,  10),
]
for (f, ls, le, rs, re_, hr, hyaw, lw, rw) in POSES:
    for side, s_, e_, w_ in (("L", ls, le, lw), ("R", rs, re_, rw)):
        sh, el, wr = arms[side]
        sh.rotation_euler = (rad(-14), rad(s_), 0); K(sh, "rotation_euler", f)
        el.rotation_euler = (rad(-10), rad(e_), 0); K(el, "rotation_euler", f)
        wr.rotation_euler = (0, rad(w_), 0); K(wr, "rotation_euler", f)
    HP.rotation_euler = (rad(-3), rad(hr), rad(hyaw)); K(HP, "rotation_euler", f)
# respiración y vaivén del cuerpo
for f in range(1, NF + 8, 8):
    AV.location = (AVX + 0.012 * sin(f * 0.085), 0, AVZ + 0.014 * sin(f * 0.21))
    AV.rotation_euler = (0, rad(1.6 * sin(f * 0.085 + 1.0)), rad(2.5 * sin(f * 0.06)))
    K(AV, "location", f); K(AV, "rotation_euler", f)
# boca que habla (se calla en cada corte de frase) y parpadeo
quiet = [(70, 78), (145, 153), (217, 225), (292, 301)]
f = 1
while f <= NF:
    q = any(a <= f <= b for a, b in quiet)
    op = 0.22 if q else random.choice([0.35, 0.8, 1.25, 1.6, 1.0, 0.5])
    mouth.scale = (1.0 if q else random.uniform(0.82, 1.08), 1, op); K(mouth, "scale", f)
    lip_dn.location.z = MZ - 0.012 - 0.016 * max(0.0, op - 0.22); K(lip_dn, "location", f)
    lip_up.location.z = MZ + 0.010 + 0.004 * max(0.0, op - 0.22); K(lip_up, "location", f)
    f += 3
for e in eyes:
    e.scale = (1, 1, 1); K(e, "scale", 1, "CONSTANT")
    for bf in (26, 68, 118, 166, 171, 214, 258, 290):
        e.scale = (1.1, 1, 0.12); K(e, "scale", bf, "CONSTANT")
        e.scale = (1, 1, 1); K(e, "scale", bf + 3, "CONSTANT")

# ───────────────────────── partículas de primer plano (bokeh) ─────────────────────────
for i in range(6):
    sx = -1 if i % 2 else 1
    x, z, y = sx * random.uniform(0.50, 0.62), random.uniform(-1.0, 0.5), random.uniform(-5.6, -4.2)
    p = flat("mota", circ_pts(random.uniform(0.008, 0.016), 16), [CREAM, YELLOW, ORANGE, WHITE][i % 4], (x, y, z))
    K(p, "location", 1, "LINEAR")
    p.location = (x + random.uniform(-0.06, 0.06), y, z + random.uniform(0.10, 0.22)); K(p, "location", NF, "LINEAR")

# ───────────────────────── cámara viva: push-in + respiración ─────────────────────────
cam_d = bpy.data.cameras.new("cam"); cam_d.lens = 78.0; cam_d.sensor_fit = "VERTICAL"; cam_d.sensor_height = 36.0
cam = link(bpy.data.objects.new("cam", cam_d), (0, -9.9, 0)); scene.camera = cam
CZ = -0.12
tgt = empty("mira", (0, 1.0, CZ))
tr = cam.constraints.new("TRACK_TO"); tr.target = tgt; tr.track_axis = "TRACK_NEGATIVE_Z"; tr.up_axis = "UP_Y"
foc = empty("foco", (0.1, 0.55, 0))
cam_d.dof.use_dof = True; cam_d.dof.focus_object = foc; cam_d.dof.aperture_fstop = 1.6
for f in range(1, NF + 1):
    t = (f - 1) / (NF - 1)
    cam.location = (0.16 * sin(2 * pi * 0.9 * t + 0.4) - 0.05,
                    -9.9 + 1.2 * t + 0.05 * sin(2 * pi * 2.0 * t),
                    CZ + 0.02 + 0.07 * sin(2 * pi * 1.4 * t + 1.0))
    tgt.location = (0.03 * sin(2 * pi * 0.7 * t + 2.0), 1.0, CZ + 0.035 * sin(2 * pi * 1.1 * t))
    K(cam, "location", f, "LINEAR"); K(tgt, "location", f, "LINEAR")

apply_modes()

# ───────────────────────── render ─────────────────────────
r = scene.render
r.engine = "BLENDER_EEVEE"
r.resolution_x, r.resolution_y, r.resolution_percentage = 1080, 1920, SCALE
r.fps = FPS; scene.frame_start, scene.frame_end = 1, NF
r.image_settings.file_format = "PNG"; r.image_settings.color_mode = "RGB"
r.filepath = os.path.join(OUT, "frames", "f_")
r.use_motion_blur = False
ee = scene.eevee
ee.taa_render_samples = SAMPLES
for k, v in (("use_shadows", True), ("shadow_ray_count", 2), ("shadow_step_count", 6), ("use_raytracing", False)):
    try:
        setattr(ee, k, v)
    except Exception:
        pass
try:
    scene.view_settings.view_transform = "Standard"; scene.view_settings.look = "None"
except Exception as ex:
    print("view transform:", ex)
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "escena.blend"))
print("OK escena.blend · %d%% · %d muestras" % (SCALE, SAMPLES))
