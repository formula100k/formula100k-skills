# -*- coding: utf-8 -*-
"""
build.py · Plantilla «Monigotes oscuros» (monigotes-oscuros-f100k)
Reconstruye la escena entera desde cero en Blender (EEVEE), sin créditos:
    blender -b -P build.py          → escena.blend + texto_*.png + tiempos.env (en esta carpeta o en MO_OUT)
    ./montar.sh                     → frames/ + muestra.mp4 + poster.jpg + cuadros.jpg
Metáfora del ejemplo: un monigote solo empuja una roca enorme cuesta arriba, se le resbala,
llega su equipo (ojos de color) desde la niebla, la suben juntos, y él se sienta a mirar.
Todo es procedural: terreno, monigotes (FK + IK analítico de 2 huesos), roca, cámara de grúa.
Variables de entorno: MO_CONFIG (config.json; si no, el config.json junto a este archivo), MO_OUT (carpeta de salida),
MO_SCALE (% de 1080x1920, 100 por defecto), MO_SAMPLES (muestras EEVEE, 28).
Pruebas rápidas: MO_SCALE=50 MO_SAMPLES=12 y renderiza 3–4 cuadros con -f (ver SKILL.md).
"""
import bpy, bmesh, math, random, os, json
from mathutils import Vector, noise

HERE = os.environ.get("MO_OUT") or os.path.dirname(os.path.abspath(__file__))
FDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fuentes')
SCALE = int(os.environ.get("MO_SCALE", "100"))
SAMPLES = int(os.environ.get("MO_SAMPLES", "28"))
FPS = 30
DUR = 10.0
NF = int(FPS * DUR)          # 300 cuadros
random.seed(7)

# ───────────────────────── configuración (config.json) ─────────────────────────
_cfg_path = os.environ.get("MO_CONFIG") or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')
CFG = {}
if os.path.exists(os.path.expanduser(_cfg_path)):
    with open(os.path.expanduser(_cfg_path), encoding='utf-8') as fh:
        CFG = json.load(fh)
CTA = CFG.get('cta', 'GUÍA').upper()
CIERRE = CFG.get('cierre', 'comenta')
FRASE = CFG.get('frase', ['tu equipo trabaja', 'mientras', 'DUERMES'])     # 2 líneas chicas + la clave enorme
COL = dict(acento='#FFD21F', texto='#FFFFFF', ojos_heroe='#D9EBFF', ojos_equipo='#FF8019', ventanas='#FF8C24')
COL.update(CFG.get('colores', {}))
N_EQUIPO = max(1, min(7, int(CFG.get('equipo', 7))))
TIEMPOS = dict(linea1=5.90, linea2=6.40, clave=6.80, fuera=8.30, cierre=8.60, cta=8.90)
TIEMPOS.update(CFG.get('tiempos', {}))

# ───────────────────────── utilidades ─────────────────────────
def clamp(v, a=0.0, b=1.0): return max(a, min(b, v))
def smooth(v):
    v = clamp(v); return v * v * (3 - 2 * v)
def lerp(a, b, w): return a + (b - a) * w
def srgb(hexs):
    hexs = hexs.lstrip('#')
    c = [int(hexs[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)
def setp(o, name, val):
    try: setattr(o, name, val)
    except Exception as e: print('[setp]', name, e)

# ───────────────────────── terreno (perfil) ─────────────────────────
SL, XT, KT = 0.40, 6.0, 0.9          # pendiente, x de la cima, suavidad
def gh(x):
    e = (x - XT) / KT
    sp = KT * math.log1p(math.exp(e)) if e < 30 else (x - XT)
    return SL * (x - sp)
def gslope(x):
    e = (x - XT) / KT
    sig = 1 / (1 + math.exp(-e)) if abs(e) < 30 else (1.0 if e > 0 else 0.0)
    return SL * (1 - sig)

# ───────────────────────── roca: recorrido ─────────────────────────
R = 1.25
B_END = 7.3
def boulder_x(t):
    if t < 2.3:      # tres empujones que casi no rinden
        s = (smooth((t - 0.1) / 0.5) + smooth((t - 0.85) / 0.5) + smooth((t - 1.6) / 0.5)) / 3
        return -1.2 + 0.5 * s
    if t < 3.2:      # se le resbala
        w = (t - 2.3) / 0.9
        return -0.7 - 1.05 * (w * w * (1.6 - 0.6 * w) if w < 1 else 1)
    if t < 5.0:      # la aguanta apenas, cediendo
        w = (t - 3.2) / 1.8
        return -1.75 - 0.15 * w + 0.04 * math.sin(w * math.pi * 3) * (1 - w)
    tau = (t - 5.0) / 5.0
    f = (1 - (1 - tau) ** 2) * smooth(tau / 0.3)
    return -1.9 + (B_END + 1.9) * f
def boulder_c(t):
    bx = boulder_x(t); s = gslope(bx); n = math.hypot(s, 1)
    return bx - s / n * R, gh(bx) + R / n

# ───────────────────────── escena limpia ─────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.name = 'Escena'
sc.render.engine = 'BLENDER_EEVEE'
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 1, NF
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = os.path.join(HERE, 'frames', 'f_')
ee = sc.eevee
setp(ee, 'taa_render_samples', SAMPLES)
sc.render.resolution_percentage = SCALE
setp(ee, 'volumetric_start', 0.3)
setp(ee, 'volumetric_end', 80.0)
setp(ee, 'volumetric_tile_size', '4')
setp(ee, 'volumetric_samples', 96)
setp(ee, 'volumetric_sample_distribution', 0.85)
setp(ee, 'use_volumetric_shadows', True)
setp(ee, 'volumetric_shadow_samples', 16)
setp(ee, 'use_shadows', True)
setp(ee, 'use_raytracing', False)
setp(sc.render, 'use_motion_blur', True)
setp(sc.render, 'motion_blur_shutter', 0.45)
setp(ee, 'motion_blur_steps', 1)
try:
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
except Exception as e:
    print('[view]', e)

def link(o, coll=None):
    (coll or sc.collection).objects.link(o); return o

# ───────────────────────── materiales ─────────────────────────
def mat_principled(name, base, rough=0.5, spec=0.5):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = base
    b.inputs['Roughness'].default_value = rough
    if 'Specular IOR Level' in b.inputs: b.inputs['Specular IOR Level'].default_value = spec
    return m
def mat_emit(name, col, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    e = nt.nodes.new('ShaderNodeEmission'); o = nt.nodes.new('ShaderNodeOutputMaterial')
    e.inputs['Color'].default_value = col; e.inputs['Strength'].default_value = strength
    nt.links.new(e.outputs[0], o.inputs['Surface'])
    return m

M_FIG = mat_principled('monigote', (0.004, 0.005, 0.008, 1), 0.33, 0.6)
M_EYE_W = mat_emit('ojo_heroe', srgb(COL['ojos_heroe']), 7.0)
M_EYE_A = mat_emit('ojo_equipo', srgb(COL['ojos_equipo']), 14.0)
M_GROUND = mat_principled('suelo', (0.010, 0.013, 0.020, 1), 0.8, 0.35)
M_BLACK = mat_principled('negro', (0.003, 0.004, 0.006, 1), 0.9, 0.1)
M_MOON = mat_emit('luna', (0.80, 0.88, 1.0, 1), 5.0)
M_STAR = mat_emit('estrella', (0.8, 0.9, 1.0, 1), 6.0)
M_WIN = mat_emit('ventana', srgb(COL['ventanas']), 9.0)
M_DUST = mat_emit('polvo', (0.55, 0.7, 1.0, 1), 1.6)

# roca con relieve (bump) para que la luna le saque textura
M_ROCK = mat_principled('roca', (0.016, 0.018, 0.026, 1), 0.62, 0.5)
nt = M_ROCK.node_tree
bsdf = nt.nodes.get('Principled BSDF')
tex = nt.nodes.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value = 2.2
tex.inputs['Detail'].default_value = 8; tex.inputs['Roughness'].default_value = 0.65
tc = nt.nodes.new('ShaderNodeTexCoord')
bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.9
nt.links.new(tc.outputs['Object'], tex.inputs['Vector'])
nt.links.new(tex.outputs['Fac'], bump.inputs['Height'])
nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])

# ───────────────────────── mundo + niebla ─────────────────────────
w = bpy.data.worlds.new('Noche'); sc.world = w; w.use_nodes = True
wn = w.node_tree; wn.nodes.clear()
bg = wn.nodes.new('ShaderNodeBackground'); wo = wn.nodes.new('ShaderNodeOutputWorld')
wtc = wn.nodes.new('ShaderNodeTexCoord'); wsep = wn.nodes.new('ShaderNodeSeparateXYZ')
wmap = wn.nodes.new('ShaderNodeMapRange'); wmap.inputs['From Min'].default_value = -1; wmap.inputs['From Max'].default_value = 1
wr = wn.nodes.new('ShaderNodeValToRGB'); cr = wr.color_ramp
SKY = [(0.44, (0.010, 0.015, 0.030, 1)), (0.505, (0.150, 0.215, 0.360, 1)), (0.60, (0.050, 0.075, 0.145, 1)), (0.80, (0.008, 0.012, 0.028, 1))]
cr.elements[0].position, cr.elements[0].color = SKY[0]; cr.elements[1].position, cr.elements[1].color = SKY[-1]
for pos, col in SKY[1:-1]:
    e_ = cr.elements.new(pos); e_.color = col
wn.links.new(wtc.outputs['Generated'], wsep.inputs[0]); wn.links.new(wsep.outputs['Z'], wmap.inputs['Value'])
wn.links.new(wmap.outputs['Result'], wr.inputs['Fac']); wn.links.new(wr.outputs['Color'], bg.inputs['Color'])
bg.inputs['Strength'].default_value = 1.0
wn.links.new(bg.outputs[0], wo.inputs['Surface'])

def volume_box(name, lo, hi, density, noise_scale=0.12):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me))
    o.location = [(a + b) / 2 for a, b in zip(lo, hi)]
    o.scale = [(b - a) for a, b in zip(lo, hi)]
    m = bpy.data.materials.new(name + '_vol'); m.use_nodes = True
    n = m.node_tree; n.nodes.clear()
    out = n.nodes.new('ShaderNodeOutputMaterial'); sca = n.nodes.new('ShaderNodeVolumeScatter')
    sca.inputs['Color'].default_value = (0.62, 0.76, 1.0, 1); sca.inputs['Anisotropy'].default_value = 0.4
    tx = n.nodes.new('ShaderNodeTexNoise'); tx.inputs['Scale'].default_value = noise_scale; tx.inputs['Detail'].default_value = 3
    co = n.nodes.new('ShaderNodeTexCoord')
    ramp = n.nodes.new('ShaderNodeMapRange')
    ramp.inputs['From Min'].default_value = 0.35; ramp.inputs['From Max'].default_value = 0.75
    ramp.inputs['To Min'].default_value = density * 0.25; ramp.inputs['To Max'].default_value = density
    n.links.new(co.outputs['Generated'], tx.inputs['Vector'])   # se reasigna abajo a coordenadas de mundo
    geo = n.nodes.new('ShaderNodeNewGeometry')
    n.links.new(geo.outputs['Position'], tx.inputs['Vector'])
    n.links.new(tx.outputs['Fac'], ramp.inputs['Value'])
    n.links.new(ramp.outputs['Result'], sca.inputs['Density'])
    emi = n.nodes.new('ShaderNodeEmission'); emi.inputs['Color'].default_value = (0.16, 0.23, 0.40, 1)
    n.links.new(ramp.outputs['Result'], emi.inputs['Strength'])     # niebla con luz propia: la silueta siempre se lee
    add = n.nodes.new('ShaderNodeAddShader')
    n.links.new(sca.outputs[0], add.inputs[0]); n.links.new(emi.outputs[0], add.inputs[1])
    n.links.new(add.outputs[0], out.inputs['Volume'])
    me.materials.append(m)
    return o
# mar de niebla en el valle (de ahí sale el equipo)
volume_box('niebla_valle', (-60, -2.1, -30), (-3.2, 3, -1.25), 0.11)
# mar de niebla detrás de la cresta y delante del acantilado
volume_box('niebla_fondo', (-70, 3, -30), (80, 58, -1.0), 0.07, 0.08)
volume_box('niebla_frente', (-60, -9, -30), (40, -2.1, -1.25), 0.11)   # misma altura y densidad que el valle: sin costura

# ───────────────────────── terreno ─────────────────────────
def build_terrain():
    X0, X1, NX = -40.0, 34.0, 300
    Y0, Y1, NY = -1.9, 44.0, 90
    verts, faces = [], []
    for j in range(NY + 1):
        y = Y0 + (Y1 - Y0) * (j / NY) ** 1.6
        ramp = smooth((y - 1.5) / 3.0)
        for i in range(NX + 1):
            x = X0 + (X1 - X0) * i / NX
            drop = 0.5 * 1.2 * math.log1p(math.exp((y - 1.7) / 1.2))      # la ladera cae detrás del camino: cresta
            z = gh(x) - min(drop, 16.0) + ramp * (0.55 * noise.noise(Vector((x * 0.22, y * 0.22, 3.1))) + 0.15 * noise.noise(Vector((x * 0.9, y * 0.9, 1.0))))
            z += 0.012 * noise.noise(Vector((x * 3.0, y * 3.0, 0)))
            verts.append((x, y, z))
    W = NX + 1
    for j in range(NY):
        for i in range(NX):
            a = j * W + i; faces.append((a, a + 1, a + W + 1, a + W))
    # pared frontal (acantilado)
    base = len(verts)
    for i in range(NX + 1):
        x = X0 + (X1 - X0) * i / NX
        verts.append((x, Y0 - 0.25, gh(x) - 30))
    for i in range(NX):
        faces.append((i + 1, i, base + i, base + i + 1))
    me = bpy.data.meshes.new('terreno'); me.from_pydata(verts, [], faces); me.update()
    for p in me.polygons: p.use_smooth = True
    o = link(bpy.data.objects.new('terreno', me)); me.materials.append(M_GROUND)
    return o
build_terrain()

def fbm1(x, seed, oct=4):
    v, a, f = 0.0, 1.0, 1.0
    for _ in range(oct):
        v += a * noise.noise(Vector((x * f, seed, 0.0))); a *= 0.5; f *= 2.1
    return v
def curtain(name, y, zfun, x0=-90, x1=110, n=400, mat=None):
    verts, faces = [], []
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n
        verts.append((x, y, zfun(x))); verts.append((x, y, -40))
    for i in range(n):
        a = 2 * i; faces.append((a, a + 2, a + 3, a + 1))
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    o = link(bpy.data.objects.new(name, me)); me.materials.append(mat or M_BLACK); return o
# sierras de fondo que se disuelven en la niebla
for o_ in (
    curtain('sierra1', 62, lambda x: 1.0 + 0.05 * x + 2.2 * fbm1(x * 0.045, 1.3), mat=mat_emit('sierra1', (0.016, 0.024, 0.045, 1), 1.0)),
    curtain('sierra2', 95, lambda x: 3.0 + 0.03 * x + 3.6 * fbm1(x * 0.030, 5.7), x0=-140, x1=160, mat=mat_emit('sierra2', (0.032, 0.048, 0.088, 1), 1.0)),
    curtain('sierra3', 135, lambda x: 5.5 + 5.0 * fbm1(x * 0.022, 9.2), x0=-200, x1=220, mat=mat_emit('sierra3', (0.055, 0.082, 0.145, 1), 1.0))):
    o_.visible_shadow = False
# loma de primer plano (desenfocada, da paralaje)
FG_Y = -4.6
def fg_z(x): return gh(x) - 2.3 + 0.35 * fbm1(x * 0.3, 2.2)
curtain('loma_frente', FG_Y, fg_z, x0=-40, x1=34, n=300)

# pasto: hojas triangulares en el borde del camino y en la loma del frente
def grass(name, n, yfun, zfun, hmin, hmax, x0, x1):
    verts, faces = [], []
    for k in range(n):
        x = random.uniform(x0, x1); y = yfun(); z = zfun(x)
        h = random.uniform(hmin, hmax) * (0.6 + 0.8 * abs(noise.noise(Vector((x * 0.6, 4.0, 0)))))
        wd = h * random.uniform(0.05, 0.09); ln = random.uniform(-0.45, 0.45) * h
        b = len(verts)
        verts += [(x - wd, y, z - 0.03), (x + wd, y, z - 0.03), (x + ln, y + random.uniform(-0.05, 0.05), z + h)]
        faces.append((b, b + 1, b + 2))
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    o = link(bpy.data.objects.new(name, me)); me.materials.append(M_BLACK); return o
grass('pasto_borde', 900, lambda: random.uniform(-2.1, -1.75), gh, 0.06, 0.22, -14, 12)
grass('pasto_frente', 700, lambda: FG_Y - random.uniform(0.0, 0.1), fg_z, 0.15, 0.6, -14, 14)

# ───────────────────────── luna, estrellas, fábrica ─────────────────────────
MOON = Vector((-5.0, 164, 16.5))
def disc(name, loc, rad, mat, seg=64):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, segments=seg, radius=rad); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me)); o.location = loc; o.rotation_euler = (math.radians(90), 0, 0)
    me.materials.append(mat); return o
disc('luna', MOON, 6.5, M_MOON).visible_shadow = False
sv, sf = [], []
for k in range(170):
    x = random.uniform(-150, 190); z = random.uniform(30, 150); r = random.choice([0.07, 0.09, 0.12, 0.17])
    b = len(sv); sv += [(x - r, 200, z), (x, 200, z - r), (x + r, 200, z), (x, 200, z + r)]; sf.append((b, b + 1, b + 2, b + 3))
me = bpy.data.meshes.new('estrellas'); me.from_pydata(sv, [], sf); me.update()
link(bpy.data.objects.new('estrellas', me)).visible_shadow = False; me.materials.append(M_STAR)

def box(bm, lo, hi):
    r = bmesh.ops.create_cube(bm, size=1.0)
    for v in r['verts']:
        v.co = Vector((lerp(lo[0], hi[0], v.co.x + 0.5), lerp(lo[1], hi[1], v.co.y + 0.5), lerp(lo[2], hi[2], v.co.z + 0.5)))
def build_factory(ox, oy, oz):
    bm = bmesh.new()
    box(bm, (0, 0, -3), (15, 6, 5.2))                               # nave
    for k in range(5):                                              # techo diente de sierra
        x0 = k * 3.0
        vs_ = [bm.verts.new(p) for p in [(x0, 0, 5.2), (x0 + 3, 0, 5.2), (x0, 0, 6.9), (x0, 6, 5.2), (x0 + 3, 6, 5.2), (x0, 6, 6.9)]]
        bm.faces.new(vs_[0:3]); bm.faces.new(vs_[3:6])
        bm.faces.new((vs_[0], vs_[2], vs_[5], vs_[3])); bm.faces.new((vs_[1], vs_[2], vs_[5], vs_[4]))
    box(bm, (2.2, 2, 5), (3.3, 3.1, 12.5)); box(bm, (5.0, 2, 5), (5.9, 2.9, 10.6))   # chimeneas
    box(bm, (15, 1, -3), (19, 5, 3.4))                              # anexo
    me = bpy.data.meshes.new('fabrica'); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new('fabrica', me)); o.location = (ox, oy, oz); me.materials.append(M_BLACK)
    # ventanas encendidas
    wv, wf = [], []
    for r_ in range(2):
        for c in range(9):
            if (r_, c) in ((0, 3), (1, 6)): continue
            x0 = 0.9 + c * 1.55; z0 = 1.0 + r_ * 2.0
            b = len(wv); wv += [(x0, -0.03, z0), (x0 + 0.85, -0.03, z0), (x0 + 0.85, -0.03, z0 + 1.2), (x0, -0.03, z0 + 1.2)]
            wf.append((b, b + 1, b + 2, b + 3))
    b = len(wv); wv += [(16.2, 0.97, 0.0), (17.8, 0.97, 0.0), (17.8, 0.97, 2.4), (16.2, 0.97, 2.4)]; wf.append((b, b + 1, b + 2, b + 3))  # portón
    me2 = bpy.data.meshes.new('ventanas'); me2.from_pydata(wv, [], wf); me2.update()
    o2 = link(bpy.data.objects.new('ventanas', me2)); o2.location = (ox, oy, oz); me2.materials.append(M_WIN)
    return o
FAB = (12.5, 40.0, 3.2)
curtain('loma_fabrica', FAB[1] + 0.5, lambda x: FAB[2] - 0.2 - 0.004 * (x - 20) ** 2 + 0.5 * fbm1(x * 0.08, 7.7), x0=-30, x1=70, n=200)
build_factory(*FAB)

# ───────────────────────── luces ─────────────────────────
def light(name, kind, loc, energy, col, **kw):
    l = bpy.data.lights.new(name, kind); l.energy = energy; l.color = col
    for k, v in kw.items(): setp(l, k, v)
    o = link(bpy.data.objects.new(name, l)); o.location = loc; return o
moon_l = light('luz_luna', 'SUN', (0, 0, 30), 7.0, (0.55, 0.70, 1.0), angle=math.radians(1.2))
d = (Vector((0, 0, 3)) - Vector((-45, 160, 52))).normalized()   # contraluz más alto que la luna: borde claro en las siluetas
moon_l.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
fill = light('relleno', 'AREA', (-8, -14, 9), 260, (0.45, 0.6, 1.0), size=12)
fill.rotation_euler = (Vector((0, 0, 1)) - Vector(fill.location)).normalized().to_track_quat('-Z', 'Y').to_euler()
_wc = srgb(COL['ventanas'])[:3]
light('luz_fabrica', 'POINT', (FAB[0] + 7, FAB[1] - 3.5, FAB[2] + 2.5), 500, _wc, shadow_soft_size=2.5)
light('luz_porton', 'POINT', (FAB[0] + 17, FAB[1] - 1.5, FAB[2] + 1.5), 150, _wc, shadow_soft_size=1.0)

# ───────────────────────── roca ─────────────────────────
me = bpy.data.meshes.new('roca'); bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=5, radius=R)
for v in bm.verts:
    n_ = v.co.normalized()
    dsp = 0.16 * noise.noise(n_ * 1.6 + Vector((4, 1, 7))) + 0.05 * noise.noise(n_ * 5.0)
    v.co = n_ * (R + dsp - 0.06)
bm.to_mesh(me); bm.free()
for p in me.polygons: p.use_smooth = True
ROCK = link(bpy.data.objects.new('roca', me)); me.materials.append(M_ROCK)

# ───────────────────────── monigotes ─────────────────────────
LT, LS_ = 0.43, 0.43          # muslo, pantorrilla
TL = 0.56                     # torso
LA, LF = 0.31, 0.31           # brazo, antebrazo
HEAD_R = 0.20
RAD = 0.05

def seg_mesh(name, L, r):
    """Cápsula con origen en el extremo superior, bajando por -Z."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=r, radius2=r, depth=L)
    for v in bm.verts: v.co.z -= L / 2
    for zz in (0.0, -L):
        s = bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=6, radius=r)
        for v in s['verts']: v.co.z += zz
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    me.materials.append(M_FIG); return me
def sphere_mesh(name, r, mat, seg=24):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    me.materials.append(mat); return me

ME_THIGH = seg_mesh('m_muslo', LT, RAD); ME_SHIN = seg_mesh('m_pantorrilla', LS_, RAD)
ME_ARM = seg_mesh('m_brazo', LA, RAD * 0.9); ME_FORE = seg_mesh('m_antebrazo', LF, RAD * 0.9)
ME_TORSO = seg_mesh('m_torso', TL, RAD * 1.25)
ME_HEAD = sphere_mesh('m_cabeza', HEAD_R, M_FIG)
ME_EYE_W = sphere_mesh('m_ojo_b', 0.028, M_EYE_W, 10); ME_EYE_A = sphere_mesh('m_ojo_a', 0.030, M_EYE_A, 10)

class Fig:
    def __init__(self, name, y, amber=True, scale=1.0):
        self.name, self.y = name, y
        def ob(n, me, parent=None, loc=(0, 0, 0)):
            o = link(bpy.data.objects.new(f'{name}_{n}', me)); o.parent = parent; o.location = loc; return o
        self.root = ob('raiz', None); self.root.empty_display_size = 0.1; self.root.scale = (scale,) * 3
        self.scale = scale
        self.torso = ob('torso', ME_TORSO, self.root)
        self.torso.rotation_euler = (0, 0, 0)
        # el torso sube: giramos la malla 180° con un vacío intermedio
        self.tmesh = self.torso; self.tmesh.data = None if False else ME_TORSO
        self.tpivot = ob('pivote', None, self.root); self.torso.parent = self.tpivot; self.torso.rotation_euler = (math.pi, 0, 0)
        self.head = ob('cabeza', ME_HEAD, self.tpivot, (0, 0, TL + HEAD_R * 0.95))
        em = ME_EYE_A if amber else ME_EYE_W
        ob('ojo1', em, self.head, (0.050, -0.186, 0.03)); ob('ojo2', em, self.head, (0.135, -0.140, 0.03))
        self.arm = []; self.leg = []
        for s, yy in (('i', -0.03), ('d', 0.03)):
            a = ob('brazo_' + s, ME_ARM, self.tpivot, (0, yy, TL - 0.03)); f = ob('antebrazo_' + s, ME_FORE, a, (0, 0, -LA))
            self.arm.append((a, f))
            t = ob('muslo_' + s, ME_THIGH, self.root, (0, yy, 0)); sh = ob('pantorrilla_' + s, ME_SHIN, t, (0, 0, -LT))
            self.leg.append((t, sh))
    def key(self, f, hip, lean, legs, arms, head=0.0):
        """hip=(x,z) mundo; lean rad (+ hacia +x); legs/arms = [(a1,a2),(a1,a2)] ángulos de mundo (0 = abajo, + hacia +x)."""
        r = self.root; r.location = (hip[0], self.y, hip[1]); r.keyframe_insert('location', frame=f)
        self.tpivot.rotation_euler = (0, lean, 0); self.tpivot.keyframe_insert('rotation_euler', index=1, frame=f)
        self.head.rotation_euler = (0, head, 0); self.head.keyframe_insert('rotation_euler', index=1, frame=f)
        for (t, s), (a1, a2) in zip(self.leg, legs):
            t.rotation_euler = (0, -a1, 0); s.rotation_euler = (0, -(a2 - a1), 0)
            t.keyframe_insert('rotation_euler', index=1, frame=f); s.keyframe_insert('rotation_euler', index=1, frame=f)
        for (a, fo), (a1, a2) in zip(self.arm, arms):
            a.rotation_euler = (0, -a1 - lean, 0); fo.rotation_euler = (0, -(a2 - a1), 0)
            a.keyframe_insert('rotation_euler', index=1, frame=f); fo.keyframe_insert('rotation_euler', index=1, frame=f)

def ik2(ax, az, tx, tz, l1, l2, bend):
    dx, dz = tx - ax, tz - az
    dd = math.hypot(dx, dz)
    dc = clamp(dd, abs(l1 - l2) + 1e-4, l1 + l2 - 1e-4)
    base = math.atan2(dx, -dz)
    c = clamp((l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc), -1, 1)
    a1 = base + bend * math.acos(c)
    kx, kz = ax + l1 * math.sin(a1), az - l1 * math.cos(a1)
    ex, ez = ax + math.sin(base) * dc, az - math.cos(base) * dc
    a2 = math.atan2(ex - kx, -(ez - kz))
    return a1, a2
def lerp_ang(a, b, w):
    return (lerp(a[0], b[0], w), lerp(a[1], b[1], w))

def foot(p, off, Ls, c, lift, duty=0.6):
    q = p / Ls + off; k = math.floor(q); u = q - k
    F0 = (k - off) * Ls + c
    if u < duty: fx, lz = F0, 0.0
    else:
        w_ = (u - duty) / (1 - duty); fx = F0 + Ls * smooth(w_); lz = lift * math.sin(math.pi * w_)
    return fx, gh(fx) + 0.04 + lz

def push_slot(t, y, beta, lean, reach):
    """Dónde va la cadera y la mano de alguien que empuja la roca."""
    cx, cz = boulder_c(t)
    re = math.sqrt(max(R * R - y * y, 0.2)) - 0.03
    hx, hz = cx - re * math.cos(beta), cz - re * math.sin(beta)
    p = hx - reach - TL * math.sin(lean)
    return p, (hx, hz)

# ── definición del reparto ──
HERO = Fig('heroe', -0.30, amber=False)
TEAM_DEF = [  # y, beta, lean, reach, escala
    (-1.00, 0.95, 0.80, 0.40, 0.96),
    (0.30, 0.70, 0.70, 0.44, 1.04),
    (0.75, 0.85, 0.86, 0.38, 0.92),
    (-0.68, 0.60, 0.62, 0.46, 1.00),
    (1.10, 0.75, 0.78, 0.36, 1.06),
    (0.02, 1.05, 0.90, 0.40, 0.90),
    (0.50, 0.50, 0.58, 0.47, 0.98),
]
TEAM_DEF = TEAM_DEF[:N_EQUIPO]   # config.json → "equipo" (1 a 7); con menos se lee más limpio
TEAM = [Fig(f'equipo{i+1}', d_[0], amber=True, scale=d_[4]) for i, d_ in enumerate(TEAM_DEF)]

T_REL = 6.8      # el héroe suelta la roca
def hero_pose(t):
    y = HERO.y
    slot_t = min(t, T_REL)
    strain = 0.05 * math.sin(t * 5.0) if t < 5 else 0.0
    lean_push = 0.86 + (0.10 if 2.3 < t < 5.0 else 0.0) * smooth((t - 2.3) / 0.5) + strain * 0.4
    p_slot, hand = push_slot(slot_t, y, 0.80, lean_push, 0.40)
    wS = smooth((t - T_REL) / 0.75)                 # se endereza
    wSit = smooth((t - 7.55) / 0.7)                  # se sienta
    p = p_slot + 0.42 * wS
    lean = lerp(lerp(lean_push, 0.02, wS), -0.38, wSit)
    hh = lerp(lerp(0.66 + strain * 0.3, 0.84, wS), 0.15, wSit)
    hip = (p - 0.25 * wSit, gh(p - 0.25 * wSit) + hh)
    # piernas
    legs = []
    for off, sx in ((0.0, 0.50), (0.5, 0.66)):
        fx, fz = foot(p, off, 0.72, lerp(0.02, 0.10, wS), lerp(0.09, 0.05, wS))
        sxw = p + sx; fx = lerp(fx, sxw, wSit); fz = lerp(fz, gh(sxw) + 0.04, wSit)
        legs.append(ik2(hip[0], hip[1], fx, fz, LT, LS_, +1))
    # brazos
    sh = (hip[0] + (TL - 0.03) * math.sin(lean), hip[1] + (TL - 0.03) * math.cos(lean))
    arms = []
    for k, dz in enumerate((0.10, -0.12)):
        a_push = ik2(sh[0], sh[1], hand[0], hand[1] + dz, LA, LF, -1)
        a_hang = (0.06 - 0.1 * k, 0.22 - 0.1 * k)
        gx = hip[0] - 0.36 - 0.08 * k
        a_sit = ik2(sh[0], sh[1], gx, gh(gx) + 0.03, LA, LF, -1)
        arms.append(lerp_ang(lerp_ang(a_push, a_hang, wS), a_sit, wSit))
    head = lerp(lerp(0.0, -0.25, wS), 0.55, wSit) + 0.05 * math.sin(t * 2.2) * wSit   # cabecea: se duerme
    return hip, lean, legs, arms, head

def team_pose(i, t):
    y, beta, lean_p, reach, scale = TEAM_DEF[i]
    start = -15.0 - 1.1 * i
    t0, t1 = 2.6 + 0.13 * i, 4.55 + 0.13 * i
    p_slot, hand = push_slot(t, y, beta, lean_p, reach * scale)
    u = smooth((t - t0) / (t1 - t0))
    p = start + (p_slot - start) * u
    wP = smooth((u - 0.82) / 0.18)                   # 0 corre → 1 empuja
    cheer = smooth((t - 9.0) / 0.45) if i in (1, 4) else 0.0
    lean = lerp(lerp(0.30, lean_p, wP), 0.05, cheer)
    hh = lerp(lerp(0.79, 0.67, wP), 0.83, cheer) * scale
    hip = (p, gh(p) + hh)
    Ls = 0.95 * scale
    off0 = (i * 0.37) % 1.0
    legs = []
    for off in (off0, off0 + 0.5):
        fx, fz = foot(p, off, Ls, lerp(0.22, 0.0, wP), lerp(0.24, 0.09, wP))
        legs.append(ik2(hip[0], hip[1], fx, fz, LT * scale, LS_ * scale, +1))
    sh = (hip[0] + (TL - 0.03) * scale * math.sin(lean), hip[1] + (TL - 0.03) * scale * math.cos(lean))
    arms = []
    for k, dz in enumerate((0.09, -0.10)):
        ph = 2 * math.pi * (p / Ls + off0) + (math.pi if k else 0)
        up = 0.15 + 0.95 * math.sin(ph); a_run = (up, up + 1.35)
        a_push = ik2(sh[0], sh[1], hand[0], hand[1] + dz, LA * scale, LF * scale, -1)
        a_up = (2.55 + 0.25 * k, 2.85 + 0.2 * k)
        arms.append(lerp_ang(lerp_ang(a_run, a_push, wP), a_up, cheer))
    return hip, lean, legs, arms, 0.0

# piedritas que saltan detrás de la roca
PEB = []
me_p = sphere_mesh('m_piedrita', 1.0, M_ROCK, 8)
for k in range(22):
    ts = random.uniform(2.35, 3.0) if k < 8 else random.uniform(5.2, 8.2)
    o = link(bpy.data.objects.new(f'piedrita{k}', me_p))
    PEB.append((o, ts, random.uniform(-2.6, -0.8) if k >= 8 else random.uniform(0.2, 1.2), random.uniform(1.2, 3.0),
                random.uniform(-1.3, 0.9), random.uniform(0.03, 0.075)))

def bake():
    for f in range(1, NF + 1):
        t = (f - 1) / FPS
        cx, cz = boulder_c(t)
        ROCK.location = (cx, 0, cz); ROCK.keyframe_insert('location', frame=f)
        ROCK.rotation_euler = (0, (boulder_x(t) + 1.2) * math.hypot(1, SL) / R, 0); ROCK.keyframe_insert('rotation_euler', index=1, frame=f)
        HERO.key(f, *hero_pose(t))
        for i, fg in enumerate(TEAM):
            fg.key(f, *team_pose(i, t))
        for (o, ts, vx, vz, y, r) in PEB:
            if t < ts:
                o.scale = (0, 0, 0)
            else:
                bx0 = boulder_x(ts) - 0.15; x0, z0 = bx0, gh(bx0) + 0.05
                tt = t - ts; x = x0 + vx * tt; z = z0 + vz * tt - 4.9 * tt * tt
                if z < gh(x) + r:      # ya cayó: queda donde tocó el suelo
                    # busca el instante de contacto
                    lo, hi = 0.0, tt
                    for _ in range(18):
                        m = (lo + hi) / 2; xm = x0 + vx * m; zm = z0 + vz * m - 4.9 * m * m
                        if zm < gh(xm) + r and m > 0.05: hi = m
                        else: lo = m
                    x = x0 + vx * hi; z = gh(x) + r
                o.location = (x, y, z); o.scale = (r, r * 0.8, r * 0.7)
                o.keyframe_insert('location', frame=f)
            o.keyframe_insert('scale', frame=f)
bake()

# ───────────────────────── polvo flotante (bokeh) ─────────────────────────
me_d = sphere_mesh('m_polvo', 1.0, M_DUST, 6)
for k in range(110):
    o = link(bpy.data.objects.new(f'polvo{k}', me_d))
    x, y, z = random.uniform(-9, 13), random.uniform(-9.5, 5), random.uniform(-1.0, 10)
    r = random.uniform(0.008, 0.022)
    o.scale = (r, r, r)
    dv = Vector((random.uniform(-0.25, 0.1), random.uniform(-0.1, 0.1), random.uniform(-0.05, 0.12))) * DUR
    o.location = (x, y, z); o.keyframe_insert('location', frame=1)
    o.location = Vector((x, y, z)) + dv; o.keyframe_insert('location', frame=NF)

# ───────────────────────── cámara de grúa ─────────────────────────
cam_d = bpy.data.cameras.new('camara'); cam = link(bpy.data.objects.new('camara', cam_d)); sc.camera = cam
cam_d.lens = 40; cam_d.sensor_fit = 'VERTICAL'; cam_d.sensor_height = 36
cam_d.clip_start = 0.1; cam_d.clip_end = 400
tgt = link(bpy.data.objects.new('objetivo', None)); tgt.empty_display_size = 0.3
con = cam.constraints.new('TRACK_TO'); con.target = tgt; con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'
cam_d.dof.use_dof = True; cam_d.dof.focus_object = tgt; cam_d.dof.aperture_fstop = 1.1
CAM_KEYS = [  # t, cámara, objetivo
    (0.0, (-3.2, -10.0, -0.30), (-2.3, 0, 0.50)),     # contrapicado: él solo contra la luna
    (2.3, (-2.6, -8.6, 0.00), (-2.2, 0, 0.50)),       # push-in mientras empuja
    (3.2, (-3.8, -9.6, 0.10), (-3.1, 0, 0.20)),       # la roca lo arrastra
    (3.9, (-6.4, -12.0, 0.30), (-5.6, 0, -0.70)),     # paneo a la niebla: ojos ámbar
    (4.8, (-4.4, -12.0, 0.60), (-3.4, 0, 0.20)),      # los sigue hasta la roca
    (5.6, (-3.0, -11.4, 1.00), (-2.2, 0, 0.80)),
    (7.0, (1.2, -12.0, 2.40), (2.6, 0, 3.20)),        # grúa que sube con la roca
    (8.6, (3.2, -13.6, 3.30), (4.2, 0, 4.45)),        # abre: él se queda, el equipo sigue
    (10.0, (3.7, -14.4, 3.70), (4.3, 0, 4.65)),       # abre despacio: el que duerme y el equipo en el mismo cuadro
]
for t, c, g in CAM_KEYS:
    f = 1 + round(t * FPS) if t < DUR else NF
    cam.location = c; cam.keyframe_insert('location', frame=f)
    tgt.location = g; tgt.keyframe_insert('location', frame=f)

# ───────────────────────── «z z Z» del que duerme (corte seco, tamaños distintos) ─────────────────────────
_hip, _lean, *_ = hero_pose(9.0)
_hx = _hip[0] + (TL + HEAD_R) * math.sin(_lean); _hz = _hip[1] + (TL + HEAD_R) * math.cos(_lean)
M_Z = mat_emit('zeta', srgb(COL['ojos_heroe']), 3.0)
for k, (tz, size) in enumerate(((8.05, 0.20), (8.35, 0.28), (8.65, 0.38))):
    cu = bpy.data.curves.new(f'z{k}', 'FONT'); cu.body = 'z' if k < 2 else 'Z'; cu.size = size; cu.align_x = 'CENTER'
    try: cu.font = bpy.data.fonts.load(os.path.join(FDIR, 'InstrumentSerif-Italic.ttf'))
    except Exception as e: print('[fuente]', e)
    cu.materials.append(M_Z)
    o = link(bpy.data.objects.new(f'z{k}', cu)); o.rotation_euler = (math.radians(90), 0, 0)
    o.location = (_hx + 0.18 + 0.27 * k, HERO.y - 0.1, _hz + 0.30 + 0.30 * k + 0.05 * k * k)
    fz = 1 + round(tz * FPS)
    o.hide_render = True; o.keyframe_insert('hide_render', frame=1); o.keyframe_insert('hide_render', frame=fz - 1)
    o.hide_render = False; o.keyframe_insert('hide_render', frame=fz)

# ───────────────────────── textos (PNG transparentes, se superponen con ffmpeg en montar.sh) ─────────────────────────
def build_text_scene():
    ts = bpy.data.scenes.new('Texto')
    ts.render.engine = sc.render.engine
    ts.render.resolution_x, ts.render.resolution_y = 1080, 1920
    ts.render.resolution_percentage = SCALE
    ts.render.film_transparent = True
    ts.render.image_settings.file_format = 'PNG'; ts.render.image_settings.color_mode = 'RGBA'
    ts.view_settings.view_transform = 'Standard'
    setp(ts.eevee, 'taa_render_samples', 16)
    tw = bpy.data.worlds.new('negro'); ts.world = tw
    cd = bpy.data.cameras.new('cam_txt'); cd.type = 'ORTHO'; cd.sensor_fit = 'VERTICAL'; cd.ortho_scale = 19.2
    co = bpy.data.objects.new('cam_txt', cd); ts.collection.objects.link(co); co.location = (0, 0, 10); ts.camera = co
    MAX_W = 9.4                                          # 940 px de ancho útil (zona segura)
    def txt(name, body, font, size, col, ypx, spacing=1.0):
        cu = bpy.data.curves.new(name, 'FONT'); cu.body = body; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
        cu.size = size; cu.space_character = spacing
        try: cu.font = bpy.data.fonts.load(os.path.join(FDIR, font))
        except Exception as e: print('[fuente]', e)
        o = bpy.data.objects.new(name, cu); ts.collection.objects.link(o)
        o.location = (0, (960 - ypx) / 100.0, 0)          # 100 px = 1 unidad
        cu.materials.append(mat_emit('mt_' + name, col, 1.0))
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        w_ = o.evaluated_get(dg).dimensions.x
        if w_ > MAX_W: cu.size = size * MAX_W / w_          # palabra larga: se achica para no salirse
        return o
    l1, l2, clave = FRASE
    items = [
        ('texto_1_linea1.png', l1, 'InstrumentSerif-Italic.ttf', 0.92, COL['texto'], 262, 1.0),
        ('texto_2_linea2.png', l2, 'InstrumentSerif-Italic.ttf', 0.92, COL['texto'], 360, 1.0),
        ('texto_3_clave.png', clave.upper(), 'Anton-Regular.ttf', 2.45, COL['texto'], 520, 1.04),
        ('texto_4_cierre.png', CIERRE, 'InstrumentSerif-Italic.ttf', 0.95, COL['texto'], 300, 1.0),
        ('texto_5_cta.png', CTA, 'Anton-Regular.ttf', 2.75, COL['acento'], 470, 1.04),
    ]
    obs = [(fn, txt(f't{i}', body, font, size, srgb(col), ypx, sp)) for i, (fn, body, font, size, col, ypx, sp) in enumerate(items)]
    for fn, o in obs:
        for _, o2 in obs: o2.hide_render = o2 is not o
        ts.render.filepath = os.path.join(HERE, fn)
        bpy.ops.render.render(write_still=True, scene='Texto')
build_text_scene()

# tiempos del texto y escala para montar.sh
with open(os.path.join(HERE, 'tiempos.env'), 'w') as fh:
    fh.write('T1=%.2f\nT2=%.2f\nT3=%.2f\nTOFF=%.2f\nT_CIERRE=%.2f\nT_CTA=%.2f\nESCALA=%d\n' % (
        TIEMPOS['linea1'], TIEMPOS['linea2'], TIEMPOS['clave'], TIEMPOS['fuera'], TIEMPOS['cierre'], TIEMPOS['cta'], SCALE))

bpy.context.window.scene = sc if bpy.context.window else sc
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'escena.blend'))
print('[build] listo ->', os.path.join(HERE, 'escena.blend'))
