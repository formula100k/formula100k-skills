# build.py · Plantilla «Línea dorada» (linea-dorada-f100k)
# Una sola curva 3D dorada que se dibuja (bevel_factor) y se transforma (shape keys) en 5 figuras,
# con cámara viva horneada, DOF, polvo dorado, piso que refleja y texto pegado a la cámara.
# 5 frases de ~2 s (la última es el CTA), 300 cuadros, 30 fps, 1080x1920, sin créditos.
#   LD_CONFIG=config.json blender -b -P build.py   → escena.blend (junto a este archivo o en LD_OUT)
#   blender -b escena.blend -a                     → frames/f_0001.png … f_0300.png
#   ./post.sh                                      → muestra.mp4 + poster.jpg + cuadros.jpg
# Variables de entorno: LD_CONFIG (config.json: frases, figuras, CTA y colores), LD_OUT (carpeta de salida),
# LD_FONTS (carpeta de letras), LD_SCALE (% de 1080x1920, 100 por defecto), LD_SAMPLES (muestras EEVEE, 40).
# Pruebas rápidas: LD_SCALE=50 LD_SAMPLES=12 y renderiza 2–3 cuadros con -f.
import bpy, math, os, random, json
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.abspath(os.path.expanduser(os.environ.get("LD_OUT") or HERE))
FUENTES = os.path.expanduser(os.environ.get("LD_FONTS") or os.path.join(HERE, "fuentes"))
SCALE = int(os.environ.get("LD_SCALE", "100")); SAMPLES = int(os.environ.get("LD_SAMPLES", "40"))
FPS, NF, N = 30, 300, 1400
random.seed(7); np.random.seed(7)

# ───────────────────────── configuración (todo lo que dice la pantalla) ─────────────────────────
# Cada frase: «chica» (1–3 palabras en itálica, entran una por una) + «grande» (la clave enorme)
# + «figura» en la que se transforma la línea. Figuras: luna, equipo, foco, telefono, fabrica, regalo, corazon.
# «piezas» (solo en telefono): cuántas mini pantallas salen (0–8). Debe coincidir con la cifra que dices.
CFG = {
    "frases": [
        {"chica": "mientras tú", "grande": "DUERMES", "figura": "luna"},
        {"chica": "tu equipo", "grande": "TRABAJA", "figura": "equipo"},
        {"chica": "le das", "grande": "1 IDEA", "figura": "foco"},
        {"chica": "y te entrega", "grande": "8 VIDEOS", "figura": "telefono", "piezas": 8},
    ],
    "cta_chica": "comenta", "cta": "GUÍA", "cta_figura": "regalo",
    "colores": {"linea": "#FFCF7C", "clave": "#E8B045", "texto": "#EDE3CC"},
}
if os.environ.get("LD_CONFIG"):
    with open(os.path.expanduser(os.environ["LD_CONFIG"])) as fh:
        _u = json.load(fh)
    for k, v in _u.items():
        CFG[k] = {**CFG[k], **v} if isinstance(CFG.get(k), dict) and isinstance(v, dict) else v
assert len(CFG["frases"]) == 4, "la plantilla lleva 4 frases + el CTA"
FRASES = list(CFG["frases"]) + [{"chica": CFG.get("cta_chica", "comenta"), "grande": CFG["cta"].upper(),
                                 "figura": CFG.get("cta_figura", "regalo")}]
def hexrgb(h):
    h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'BLENDER_EEVEE'
sc.render.resolution_x, sc.render.resolution_y, sc.render.fps = 1080, 1920, FPS
sc.render.resolution_percentage = SCALE
sc.frame_start, sc.frame_end = 1, NF
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = "//frames/f_"
sc.view_settings.view_transform = 'Standard'
ee = sc.eevee
ee.taa_render_samples = SAMPLES
ee.use_raytracing = True
try: ee.ray_tracing_options.resolution_scale = '1'
except Exception: pass
ee.bokeh_max_size = 120
world = bpy.data.worlds.new("mundo"); sc.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.0035, 0.0028, 0.002, 1)

def lin(c):  # sRGB 0-1 -> lineal
    return tuple(((v/12.92) if v <= 0.04045 else ((v+0.055)/1.055)**2.4) for v in c)

def mat_emision(nombre, rgb, fuerza):
    m = bpy.data.materials.new(nombre); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    e = nt.nodes.new("ShaderNodeEmission"); o = nt.nodes.new("ShaderNodeOutputMaterial")
    e.inputs[0].default_value = (*rgb, 1); e.inputs[1].default_value = fuerza
    nt.links.new(e.outputs[0], o.inputs[0]); m["_e"] = 1
    return m

ORO = lin(hexrgb(CFG["colores"].get("linea", "#FFCF7C")))
M_LINEA = mat_emision("linea_oro", ORO, 5.0)
M_CHISPA = mat_emision("chispa", (1.0, 0.8, 0.45), 30.0)
M_PUNTO = mat_emision("punto", ORO, 9.0)
M_POLVO = mat_emision("polvo", ORO, 2.0)
M_ANILLO = mat_emision("anillo", ORO, 2.0)
M_TXT = mat_emision("texto_crema", lin(hexrgb(CFG["colores"].get("texto", "#EDE3CC"))), 1.0)
M_TXT_ORO = mat_emision("texto_oro", lin(hexrgb(CFG["colores"].get("clave", "#E8B045"))), 1.0)

# ───────────────────────── figuras (x, profundidad y, altura z) ─────────────────────────
def arco(cx, cz, r, a0, a1, n=80, y=0.0):
    return [(cx + r*math.cos(math.radians(a)), y, cz + r*math.sin(math.radians(a)))
            for a in np.linspace(a0, a1, n)]

def bez(p0, p1, p2, p3, n=30):
    out = []
    for t in np.linspace(0, 1, n):
        u = 1-t
        out.append(tuple(u*u*u*a + 3*u*u*t*b + 3*u*t*t*c + t*t*t*d for a, b, c, d in zip(p0, p1, p2, p3)))
    return out

def remuestrea(pts):
    p = np.array(pts, dtype=float)
    d = np.linalg.norm(np.diff(p, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(d)])
    u = np.linspace(0, s[-1], N)
    return np.stack([np.interp(u, s, p[:, k]) for k in range(3)], axis=1)

def luna():
    R = 1.25; cx = 0.75; ri = math.hypot(R*math.cos(math.radians(55)) - cx, R*math.sin(math.radians(55)))
    a = arco(0, 0, R, 55, 305, 160)
    b = arco(cx, 0, ri, 268.2, 91.8, 120)
    pts = a + b
    return [(x + 0.28, 0.35*math.sin(i/len(pts)*math.tau), z + 0.05) for i, (x, y, z) in enumerate(pts)]

def asistente(cx, base, s, y):
    P = lambda x, z: (cx + x*s, y, base + z*s)
    pts = bez(P(-0.62, 0), P(-0.62, 0.75), P(-0.16, 0.60), P(-0.16, 0.97))
    pts += arco(cx, base + 1.38*s, 0.42*s, 247.6, 90, 50, y)
    pts += [P(0, 2.12), P(0, 1.80)]                       # antena
    pts += arco(cx, base + 1.38*s, 0.42*s, 90, -67.6, 50, y)
    pts += bez(P(0.16, 0.97), P(0.16, 0.60), P(0.62, 0.75), P(0.62, 0))
    return pts

def equipo():
    return asistente(-1.12, -1.25, 0.72, 0.55) + asistente(0, -1.35, 1.12, -0.4) + asistente(1.12, -1.25, 0.72, 0.55)

def foco():
    pts = [(-0.28, 0, -1.4), (0.28, 0, -1.4), (0.28, 0, -1.24), (-0.28, 0, -1.24), (-0.28, 0, -1.08),
           (0.28, 0, -1.08), (0.28, 0, -0.92), (-0.28, 0, -0.92), (-0.30, 0, -0.76)]
    pts += arco(0, 0.3, 1.0, 245, -65, 200)
    pts += [(0.30, 0, -0.76), (0.17, -0.2, -0.55), (0.17, -0.4, 0.25)]
    pts += arco(0, 0.25, 0.17, 0, 540, 90, -0.4)
    pts += [(-0.17, -0.4, 0.25), (-0.17, -0.2, -0.55)]
    return pts

def rrect(w, h, r, x0):
    a, b = w/2, h/2
    pts = [(x0, 0, -b), (a - r, 0, -b)] + arco(a - r, -b + r, r, -90, 0, 14) + arco(a - r, b - r, r, 0, 90, 14) \
        + arco(-a + r, b - r, r, 90, 180, 14) + arco(-a + r, -b + r, r, 180, 270, 14) + [(x0, 0, -b)]
    return pts

def telefono():
    a, b, r, y = 0.75, 1.35, 0.22, 0.25
    pts = [(0.46, -0.45, 0.0), (-0.28, -0.45, 0.44), (-0.28, -0.45, -0.44), (0.46, -0.45, 0.0), (a, y, 0), (a, y, b - r)]
    pts += arco(a - r, b - r, r, 0, 90, 14, y) + arco(-a + r, b - r, r, 90, 180, 14, y)
    pts += arco(-a + r, -b + r, r, 180, 270, 14, y) + arco(a - r, -b + r, r, 270, 360, 14, y) + [(a, y, 0)]
    return pts

def fabrica():
    q = [(-1.4, -1.3, 0), (-1.4, 0, 0), (-0.8, 0.55, 0), (-0.8, 0, 0), (-0.2, 0.55, 0), (-0.2, 0, 0), (0.4, 0.55, 0),
         (0.4, 0, 0), (0.6, 0, .45), (0.6, 1.4, .45), (1.0, 1.4, .45), (1.0, 0, .45), (1.4, 0, 0), (1.4, -1.3, 0),
         (0.28, -1.3, -.35), (0.28, -0.55, -.35), (-0.28, -0.55, -.35), (-0.28, -1.3, -.35), (-1.4, -1.3, 0)]
    return [(x*0.9, y, z*0.9 - 0.15) for x, z, y in q]

def regalo():    # caja con tapa, cinta y moño
    pts = [(0, 0.1, -1.3), (0.8, 0.1, -1.3), (0.8, 0.1, -0.25), (0.92, 0.0, -0.25), (0.92, 0.0, 0.08), (0.06, -0.1, 0.08)]
    pts += bez((0.06, -0.1, 0.08), (0.70, -0.1, 1.05), (1.10, -0.1, 0.40), (0.06, -0.1, 0.12), 30)       # lazo der.
    pts += bez((-0.06, -0.1, 0.12), (-1.10, -0.1, 0.40), (-0.70, -0.1, 1.05), (-0.06, -0.1, 0.08), 30)   # lazo izq.
    pts += [(-0.92, 0.0, 0.08), (-0.92, 0.0, -0.25), (-0.8, 0.1, -0.25), (-0.8, 0.1, -1.3), (0, 0.1, -1.3),
            (0, 0.0, -0.25), (0, -0.1, 0.08)]
    return pts

def corazon():
    return [(1.15*(math.sin(t)**3), 0.25*math.sin(2*t), 0.075*(13*math.cos(t) - 5*math.cos(2*t) - 2*math.cos(3*t) - math.cos(4*t)) - 0.05)
            for t in np.linspace(0, math.tau, 300)]

def circulo():   # figura de paso: toda transformación cruza por un aro limpio
    return [(1.1*math.cos(a)*(1 + 0.03*math.sin(9*a)), 0.25*math.sin(2*a), 1.1*math.sin(a)*(1 + 0.03*math.sin(9*a)) + 0.1)
            for a in np.linspace(math.pi/2, math.pi/2 + math.tau, 400)]
FIGURAS = dict(luna=luna, equipo=equipo, foco=foco, telefono=telefono, fabrica=fabrica, regalo=regalo, corazon=corazon)
for fr in FRASES:
    assert fr["figura"] in FIGURAS, f"figura desconocida: {fr['figura']} (usa una de {sorted(FIGURAS)})"
FIG = [remuestrea(FIGURAS[fr["figura"]]()) for fr in FRASES] + [remuestrea(circulo())]

# ───────────────────────── tiempos ─────────────────────────
DIBUJO_FIN = 46
MORPH = [(52, 76), (112, 136), (172, 196), (229, 253)]     # ventanas de transformación
def ss(x): x = min(1, max(0, x)); return x*x*x*(x*(6*x - 15) + 10)
def pesos(f):
    w = [0.0]*6; k = 0; e = 0.0
    for i, (a, b) in enumerate(MORPH):
        if f >= b: k = i + 1
        elif f > a: k = i; e = ss((f - a)/(b - a))
    w[k] = 1 - e
    if e > 0:
        w[k+1] = e
        c = 0.8*math.sin(math.pi*e)**1.5
        w = [v*(1 - c) for v in w]; w[5] = c
    return w
def forma(f):
    w = pesos(f); return sum(w[i]*FIG[i] for i in range(6) if w[i] > 0)

# ───────────────────────── la línea ─────────────────────────
cu = bpy.data.curves.new("linea", 'CURVE'); cu.dimensions = '3D'
sp = cu.splines.new('POLY'); sp.points.add(N - 1)
sp.points.foreach_set("co", np.concatenate([FIG[0], np.ones((N, 1))], axis=1).ravel())
cu.bevel_depth = 0.0125; cu.bevel_resolution = 3; cu.use_fill_caps = True
cu.bevel_factor_mapping_start = cu.bevel_factor_mapping_end = 'SPLINE'
linea = bpy.data.objects.new("LINEA", cu); sc.collection.objects.link(linea)
cu.materials.append(M_LINEA)
linea.shape_key_add(name="luna")
for i, nom in enumerate([f"fig{k}_{FRASES[k]['figura']}" for k in range(1, 5)] + ["aro"], 1):
    kb = linea.shape_key_add(name=nom)
    for j in range(N): kb.data[j].co = FIG[i][j]
keys = cu.shape_keys.key_blocks
for f in range(1, NF + 1):
    w = pesos(f)
    for i in range(1, 6):
        keys[i].value = w[i]; keys[i].keyframe_insert("value", frame=f)
for f in range(1, DIBUJO_FIN + 1):
    cu.bevel_factor_end = max(0.004, ss((f - 1)/(DIBUJO_FIN - 1))**0.8)
    cu.keyframe_insert("bevel_factor_end", frame=f)

# la línea «respira»: el brillo sube en cada transformación
st = M_LINEA.node_tree.nodes["Emission"].inputs[1]
for f in range(1, NF + 1):
    w = pesos(f); m = min(1, w[5]/0.8)                # 0 en reposo, 1 a mitad de morph
    st.default_value = 5.0 + 5.0*m; st.keyframe_insert("default_value", frame=f)

# ───────────────────────── chispa que recorre la línea ─────────────────────────
def esfera(nombre, r, mat):
    me = bpy.data.meshes.new(nombre)
    import bmesh
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(nombre, me); sc.collection.objects.link(o); me.materials.append(mat); return o

def u_chispa(f):
    if f <= DIBUJO_FIN: return max(0.004, ss((f - 1)/(DIBUJO_FIN - 1))**0.8)
    return ((f - DIBUJO_FIN)/52.0) % 1.0
def punta(f):
    return forma(f)[int(u_chispa(f)*(N - 1))]
chispa = esfera("CHISPA", 0.038, M_CHISPA)
for f in range(1, NF + 1):
    chispa.location = punta(f); chispa.keyframe_insert("location", frame=f)

# ───────────────────────── puntos de luz por escena ─────────────────────────
def punto(pos, f_on, f_off, r=0.035, sube=None):
    o = esfera("punto", r, M_PUNTO); o.location = pos
    for f, s in ((f_on - 1, 0), (f_on + 3, 1.5), (f_on + 7, 1), (f_off - 4, 1), (f_off, 0)):
        o.scale = (s, s, s); o.keyframe_insert("scale", frame=f)
    return o
# cada figura trae sus luces; se encienden en el tramo de su frase (h0 = empieza, h1 = sale)
TRAMOS = [(28, MORPH[0][0])] + [(MORPH[k-1][1], MORPH[k][0] if k < 4 else NF + 1) for k in range(1, 5)]
def fx_luna(h0, h1, fr):        # 3 estrellas
    for k, p in enumerate(((-0.75, 0.6, 1.2), (-1.2, -0.3, 0.3), (-0.55, 0.2, -0.75))):
        punto(p, h0 + 2 + 7*k, h1 + 6, 0.03)
def fx_equipo(h0, h1, fr):      # antenas + un «corazón» que se enciende en cada asistente
    for k, (cx, base, s, y) in enumerate(((-1.12, -1.25, 0.72, 0.55), (0, -1.35, 1.12, -0.4), (1.12, -1.25, 0.72, 0.55))):
        punto((cx, y, base + 2.12*s), h0, h1 + 6, 0.03)
        punto((cx, y, base + 0.42*s), h0 + 8 + 8*k, h1 + 6, 0.06)
def fx_foco(h0, h1, fr):        # se enciende el foco
    punto((0, -0.4, 0.25), h0 + 10, h1 + 4, 0.06)
def fx_telefono(h0, h1, fr):    # mini pantallas que salen una por una (tantas como «piezas»)
    for i in range(max(0, min(8, int(fr.get("piezas", 0))))):
        lado = -1 if i % 2 == 0 else 1; fila = i//2
        c = bpy.data.curves.new("mini", 'CURVE'); c.dimensions = '3D'
        s_ = c.splines.new('POLY'); pts = rrect(0.30, 0.52, 0.06, 0)
        s_.points.add(len(pts) - 1)
        for k, p in enumerate(pts): s_.points[k].co = (*p, 1)
        c.bevel_depth = 0.008; c.materials.append(M_LINEA)
        o = bpy.data.objects.new("mini", c); sc.collection.objects.link(o)
        o.location = (lado*1.2, 0.25 - 0.25*fila*0.5, 0.96 - fila*0.64)
        f_on = int(h0 + 4 + i*3.4)
        for f, s in ((1, 0), (f_on - 1, 0), (f_on + 3, 1.25), (f_on + 6, 1), (h1 + 1, 1), (h1 + 6, 0)):
            o.scale = (s, s, s); o.keyframe_insert("scale", frame=f)
def fx_fabrica(h0, h1, fr):     # humo de puntos que sube de la chimenea
    for i in range(5):
        o = esfera("humo", 0.032, M_PUNTO)
        o.scale = (0, 0, 0); o.keyframe_insert("scale", frame=1)
        for f in range(h0 - 3, min(NF, h1 + 6) + 1):
            ph = ((f - h0 + 1)/30.0 + i/5.0) % 1.0
            s = 0 if (f < h0 + 1 + i*3 or f > h1 + 4) else math.sin(math.pi*ph)*(0.6 + 1.0*ph)
            o.location = (0.72 + 0.08*math.sin(ph*5 + i), 0.45, 1.16 + 0.32*ph); o.scale = (s, s, s)
            o.keyframe_insert("location", frame=f); o.keyframe_insert("scale", frame=f)
def fx_regalo(h0, h1, fr):      # destellos alrededor de la caja
    for k, p in enumerate(((-1.15, 0.2, 0.55), (1.2, 0.3, 0.2), (-1.05, 0.0, -0.9), (1.1, -0.1, -1.05))):
        punto(p, h0 + 4 + 5*k, h1 + 6, 0.032)
def fx_corazon(h0, h1, fr):     # late en el centro
    punto((0, -0.3, -0.05), h0 + 6, h1 + 4, 0.07)
for k, fr in enumerate(FRASES):
    globals()["fx_" + fr["figura"]](*TRAMOS[k], fr)

# anillo de onda en cada transformación
for a, b in MORPH:
    c = bpy.data.curves.new("anillo", 'CURVE'); c.dimensions = '3D'
    s_ = c.splines.new('POLY'); pts = arco(0, 0, 1, 0, 360, 120); s_.points.add(len(pts) - 1)
    for k, p in enumerate(pts): s_.points[k].co = (*p, 1)
    c.bevel_depth = 0.004
    m = M_ANILLO.copy(); c.materials.append(m)
    o = bpy.data.objects.new("anillo", c); sc.collection.objects.link(o); o.location = (0, 0.6, 0)
    e = m.node_tree.nodes["Emission"].inputs[1]
    for f, s, v in ((a - 1, 0.0, 0), (a + 2, 0.6, 1.8), (b + 8, 3.0, 0.05), (b + 9, 0.0, 0)):
        o.scale = (s, s, s); o.keyframe_insert("scale", frame=f)
        e.default_value = v; e.keyframe_insert("default_value", frame=f)

# ───────────────────────── fondo, piso, polvo ─────────────────────────
def plano(nombre, size, loc, rot):
    bpy.ops.mesh.primitive_plane_add(size=size, location=loc, rotation=rot)
    o = bpy.context.object; o.name = nombre; return o
fondo = plano("FONDO", 40, (0, 7, 1), (math.radians(90), 0, 0))
m = bpy.data.materials.new("halo_fondo"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); gr = nt.nodes.new("ShaderNodeTexGradient")
gr.gradient_type = 'SPHERICAL'; mp.inputs["Scale"].default_value = (0.11, 0.11, 0.11)
pw = nt.nodes.new("ShaderNodeMath"); pw.operation = 'POWER'; pw.inputs[1].default_value = 2.2
em = nt.nodes.new("ShaderNodeEmission"); em.inputs[0].default_value = (1.0, 0.55, 0.2, 1)
mu = nt.nodes.new("ShaderNodeMath"); mu.operation = 'MULTIPLY'; mu.inputs[1].default_value = 0.03
out = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(tc.outputs["Object"], mp.inputs[0]); nt.links.new(mp.outputs[0], gr.inputs[0])
nt.links.new(gr.outputs["Fac"], pw.inputs[0]); nt.links.new(pw.outputs[0], mu.inputs[0])
nt.links.new(mu.outputs[0], em.inputs[1]); nt.links.new(em.outputs[0], out.inputs[0])
fondo.data.materials.append(m)

piso = plano("PISO", 60, (0, 0, -1.72), (0, 0, 0))
m = bpy.data.materials.new("piso_espejo"); m.use_nodes = True
b = m.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = (0.004, 0.003, 0.002, 1)
b.inputs["Roughness"].default_value = 0.16; b.inputs["Metallic"].default_value = 0.0
b.inputs["Specular IOR Level"].default_value = 0.9
piso.data.materials.append(m)

import bmesh
def polvo(nombre, n, semilla, deriva, giro):
    rnd = random.Random(semilla); bm = bmesh.new()
    for _ in range(n):
        y = rnd.uniform(-6.2, 4.5)
        x = rnd.uniform(-3.2, 3.2); z = rnd.uniform(-1.5, 0.5 if y < -3 else 2.8)
        r = rnd.uniform(0.006, 0.02)
        ge = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=r)
        bmesh.ops.translate(bm, verts=ge["verts"], vec=(x, y, z))
    me = bpy.data.meshes.new(nombre); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(nombre, me); sc.collection.objects.link(o); me.materials.append(M_POLVO)
    for f in (1, NF):
        k = (f - 1)/(NF - 1)
        o.location = Vector(deriva)*k; o.rotation_euler = (0, 0, giro*k)
        o.keyframe_insert("location", frame=f); o.keyframe_insert("rotation_euler", frame=f)
    for fc in _fcurvas(o):
        for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
    return o
def _fcurvas(o):
    ad = o.animation_data
    if not ad or not ad.action: return []
    act = ad.action
    if hasattr(act, "fcurves"):
        try: return list(act.fcurves)
        except Exception: pass
    out = []
    for lay in act.layers:
        for strip in lay.strips:
            for cb in strip.channelbags: out += list(cb.fcurves)
    return out
polvo("POLVO_A", 85, 1, (0.45, 0.0, 0.40), 0.10)
polvo("POLVO_B", 60, 2, (-0.35, 0.5, 0.22), -0.14)

# ───────────────────────── cámara viva (horneada cuadro a cuadro) ─────────────────────────
cam_d = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("CAMARA", cam_d); sc.collection.objects.link(cam); sc.camera = cam
cam_d.lens = 50; cam_d.sensor_fit = 'VERTICAL'; cam_d.sensor_height = 36
cam_d.dof.use_dof = True; cam_d.dof.aperture_fstop = 0.4; cam_d.dof.aperture_blades = 0
cam_d.clip_start = 0.05; cam_d.clip_end = 200
txt_root = bpy.data.objects.new("TEXTO_RAIZ", None); sc.collection.objects.link(txt_root); txt_root.parent = cam

D_PTS = [(0, 4.0), (1.75, 9.1), (3.0, 8.4), (4.1, 9.2), (5.2, 8.4), (6.3, 9.7), (7.7, 9.3), (8.5, 9.5), (10.01, 7.9)]
def dist(t):
    for (t0, d0), (t1, d1) in zip(D_PTS, D_PTS[1:]):
        if t0 <= t <= t1:
            k = (t - t0)/(t1 - t0); k = (1 - math.cos(math.pi*k))/2
            return d0 + (d1 - d0)*k
    return D_PTS[-1][1]
CENTRO = Vector((0, 0, 0.27))
for f in range(1, NF + 1):
    t = (f - 1)/FPS
    az = math.radians(17)*math.sin(math.tau*t/6.4 + 0.5) + math.radians(3)*math.sin(math.tau*t/2.7)
    el = math.radians(3.5) + math.radians(3.5)*math.sin(math.tau*t/4.3 + 1.0)
    w = ss(1 - t/1.75)                       # arranque: la cámara persigue la punta
    obj = CENTRO.lerp(Vector(punta(f)), 0.9*w)
    d = dist(t)
    pos = obj + Vector((math.sin(az)*math.cos(el), -math.cos(az)*math.cos(el), math.sin(el)))*d
    pos.z = max(pos.z, -1.45)
    cam.location = pos
    cam.rotation_euler = (obj - pos).to_track_quat('-Z', 'Y').to_euler()
    cam.keyframe_insert("location", frame=f); cam.keyframe_insert("rotation_euler", frame=f)
    dd = (obj - pos).length
    cam_d.dof.focus_distance = dd; cam_d.dof.keyframe_insert("focus_distance", frame=f)
    txt_root.location = (0, 0, -dd); txt_root.scale = (dd, dd, dd)
    txt_root.keyframe_insert("location", frame=f); txt_root.keyframe_insert("scale", frame=f)

# ───────────────────────── texto (regla 10: corte seco, tamaños distintos, sin brillo) ─────────────────────────
PX = 0.72/1920.0                                   # 1 px en el plano del texto (a distancia 1)
F_CHICA = bpy.data.fonts.load(os.path.join(FUENTES, "InstrumentSerif-Italic.ttf"))
F_GRANDE = bpy.data.fonts.load(os.path.join(FUENTES, "DMSerifDisplay-Regular.ttf"))
def palabra(txt, fuente, px, mat):
    c = bpy.data.curves.new("t_" + txt, 'FONT'); c.body = txt; c.font = fuente; c.size = px*PX
    c.materials.append(mat)
    o = bpy.data.objects.new("T_" + txt, c); sc.collection.objects.link(o); o.parent = txt_root
    return o, ancho(o)
def ancho(o):
    bpy.context.view_layer.update()
    bb = o.evaluated_get(bpy.context.evaluated_depsgraph_get()).bound_box
    return max(v[0] for v in bb) - min(v[0] for v in bb)
def visible(o, f_on, f_off):
    for f, h in ((1, True), (f_on, False)) + (((f_off, True),) if f_off else ()):
        o.hide_render = h; o.hide_viewport = h
        o.keyframe_insert("hide_render", frame=f); o.keyframe_insert("hide_viewport", frame=f)
def frase(chicas, grande, f_off):
    # chicas: [(texto, cuadro)], grande: (texto, cuadro)
    objs = [palabra(t, F_CHICA, 66, M_TXT) for t, _ in chicas]
    esp = 18*PX; ancho = sum(w for _, w in objs) + esp*(len(objs) - 1)
    if ancho > 900*PX:                                   # la línea chica nunca pasa de 900 px
        k = 900*PX/ancho
        for o, _ in objs: o.data.size *= k
        objs = [(o, w*k) for o, w in objs]; esp *= k; ancho = 900*PX
    x = -ancho/2
    for (o, w), (_, f) in zip(objs, chicas):
        o.location = (x, 0.36 - 238*PX, 0); x += w + esp; visible(o, f, f_off)
    px = 176
    o, w = palabra(grande[0], F_GRANDE, px, M_TXT_ORO)
    if w > 900*PX:
        o.data.size *= 900*PX/w; w = ancho(o)
    o.location = (-w/2, 0.36 - 418*PX, 0); visible(o, grande[1], f_off)
# cada frase entra 10 cuadros después de que arranca la transformación; palabra chica cada 6, la clave 10 después
INICIO = [6] + [a + 10 for a, _ in MORPH]
for k, fr in enumerate(FRASES):
    chicas = fr["chica"].split()
    if len(chicas) > 3: chicas = [" ".join(chicas[:-2]), chicas[-2], chicas[-1]]
    t0 = INICIO[k]
    frase([(w, t0 + 6*i) for i, w in enumerate(chicas)], (fr["grande"], t0 + 6*(len(chicas) - 1) + 10),
          INICIO[k + 1] if k + 1 < len(FRASES) else None)

# ───────────────────────── compositor: bloom solo de la línea + dispersión fina ─────────────────────────
ng = bpy.data.node_groups.new("comp_linea_dorada", "CompositorNodeTree")
ng.interface.new_socket("Image", in_out='OUTPUT', socket_type='NodeSocketColor')
rl = ng.nodes.new("CompositorNodeRLayers"); rl.scene = sc
gl = ng.nodes.new("CompositorNodeGlare")
gl.inputs["Type"].default_value = 'Bloom'; gl.inputs["Threshold"].default_value = 1.6
gl.inputs["Strength"].default_value = 0.55; gl.inputs["Size"].default_value = 0.55
gl.inputs["Saturation"].default_value = 1.0
ld = ng.nodes.new("CompositorNodeLensdist"); ld.inputs["Dispersion"].default_value = 0.012
go = ng.nodes.new("NodeGroupOutput")
ng.links.new(rl.outputs["Image"], gl.inputs["Image"]); ng.links.new(gl.outputs["Image"], ld.inputs["Image"])
ng.links.new(ld.outputs["Image"], go.inputs[0])
sc.compositing_node_group = ng

sc.frame_set(1)
os.makedirs(DIR, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(DIR, "escena.blend"))
print("OK escena.blend")
