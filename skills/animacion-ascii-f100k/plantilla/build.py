# build.py · Plantilla «Animación ASCII» (animacion-ascii-f100k)
# Una oficina en 3D real (3 asistentes de bloques, monitores, pared de 8 pantallas y tu palabra de CTA en letras 3D),
# lista para pasarse a caracteres.
# Uso:  blender -b -P build.py            -> arma la escena y guarda escena.blend (en esta carpeta o en AS_OUT)
# Luego: render_pases.py (pases luz + profundidad) y ascii_post.py (grilla de caracteres + video).
# Variables de entorno: AS_CONFIG (config.json; si no, el config.json junto a este archivo), AS_OUT (carpeta de salida).
import bpy, math, os, sys, json
from mathutils import Vector

_dir = os.path.dirname(os.path.abspath(__file__))
AQUI = os.environ.get("AS_OUT") or _dir
FUENTE = os.path.join(_dir, "fuentes", "Anton-Regular.ttf")
_cfg = os.environ.get("AS_CONFIG") or os.path.join(_dir, "config.json")
CFG = json.load(open(os.path.expanduser(_cfg), encoding="utf-8")) if os.path.exists(os.path.expanduser(_cfg)) else {}
CTA = CFG.get("cta", "GUÍA").upper()     # la palabra del CTA se arma en letras 3D sobre la tarima
F_FIN = 300          # 10 s a 30 fps
XB = 4.7             # centro de la zona B (pared de 8 pantallas + palabra del CTA)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.frame_start, sc.frame_end, sc.render.fps = 1, F_FIN, 30
for nombre in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        sc.render.engine = nombre; break
    except TypeError:
        pass
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 360, 640, 100
sc.view_settings.view_transform = "Standard"
sc.view_settings.exposure = -1.0     # se renderiza 1 paso abajo: ascii_post.py recupera las altas luces con curva (nada se quema)
sc.render.image_settings.file_format = "PNG"
try: sc.eevee.taa_render_samples = 16
except Exception: pass
mundo = bpy.data.worlds.new("negro"); sc.world = mundo
mundo.use_nodes = True
mundo.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)
try:
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "BEZIER"
    bpy.context.preferences.edit.keyframe_new_handle_type = "AUTO"
except Exception: pass

# ---------- materiales ----------
def mat(nombre, color, rough=0.6, emis=None, fuerza=0.0):
    m = bpy.data.materials.new(nombre); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    if emis:
        b.inputs["Emission Color"].default_value = (*emis, 1)
        b.inputs["Emission Strength"].default_value = fuerza
    return m

M_PISO_A = mat("pisoA", (0.035, 0.035, 0.035)); M_PISO_B = mat("pisoB", (0.16, 0.16, 0.16))
M_PARED = mat("pared", (0.035, 0.035, 0.035))
M_MESA = mat("mesa", (0.22, 0.22, 0.22), 0.4)
M_ROBOT = mat("robot", (0.7, 0.7, 0.7), 0.85)
M_OSCURO = mat("oscuro", (0.015, 0.015, 0.015), 0.3)
M_OJO = mat("ojo", (1, 1, 1), emis=(1, 1, 1), fuerza=0.8)
M_PANT_BASE = mat("pant_base", (0, 0, 0), emis=(1, 1, 1), fuerza=0.12)
M_PANT_MED = mat("pant_med", (0, 0, 0), emis=(1, 1, 1), fuerza=0.42)
M_PANT_ALTA = mat("pant_alta", (0, 0, 0), emis=(1, 1, 1), fuerza=0.72)
M_LUNA = mat("luna", (0, 0, 0), emis=(1, 1, 1), fuerza=0.8)
M_CIELO = mat("cielo", (0, 0, 0), emis=(1, 1, 1), fuerza=0.03)
M_LETRA = mat("letra", (0.5, 0.5, 0.5), 0.5)
M_LETRA_F = mat("letra_frente", (0, 0, 0), emis=(1, 1, 1), fuerza=3.0)

col = bpy.data.collections.new("escena"); sc.collection.children.link(col)

def caja(nombre, tam, loc, m, bisel=0.0, padre=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object; o.name = nombre; o.scale = tam
    bpy.ops.object.transform_apply(scale=True)
    if bisel:
        md = o.modifiers.new("b", "BEVEL"); md.width = bisel; md.segments = 3
    o.data.materials.append(m)
    if padre: o.parent = padre; o.matrix_parent_inverse = padre.matrix_world.inverted()
    return o

def cil(nombre, r, h, loc, m, rot=(0, 0, 0), padre=None, vert=24):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=vert)
    o = bpy.context.active_object; o.name = nombre; o.data.materials.append(m)
    if padre: o.parent = padre; o.matrix_parent_inverse = padre.matrix_world.inverted()
    return o

def paso(o, ruta, f, antes, despues):
    """Corte seco: vale `antes` hasta f-1 y `despues` desde f."""
    setattr(o, ruta, antes); o.keyframe_insert(ruta, frame=f - 1)
    setattr(o, ruta, despues); o.keyframe_insert(ruta, frame=f)

# ---------- set ----------
bpy.ops.mesh.primitive_plane_add(size=1, location=(2.5, -3, 0)); piso = bpy.context.active_object
piso.scale = (22, 16, 1); piso.name = "piso"
mp = bpy.data.materials.new("piso"); mp.use_nodes = True
nt = mp.node_tree; bs = nt.nodes["Principled BSDF"]
ch = nt.nodes.new("ShaderNodeTexChecker"); ch.inputs["Scale"].default_value = 26
ch.inputs["Color1"].default_value = (0.03, 0.03, 0.03, 1); ch.inputs["Color2"].default_value = (0.11, 0.11, 0.11, 1)
nt.links.new(ch.outputs["Color"], bs.inputs["Base Color"]); bs.inputs["Roughness"].default_value = 0.55
piso.data.materials.append(mp)
caja("pared", (22, 0.2, 7), (2.5, 1.75, 3.5), M_PARED)

# ventana con luna (zona A)
VX, VZ = 0.0, 2.75
caja("cielo", (1.5, 0.02, 1.5), (VX, 1.64, VZ), M_CIELO)
cil("luna", 0.34, 0.02, (VX + 0.22, 1.62, VZ + 0.2), M_LUNA, rot=(math.pi / 2, 0, 0), vert=48)
for dx, dz, sx, sz in ((0, 0.78, 1.7, 0.09), (0, -0.78, 1.7, 0.09), (-0.8, 0, 0.09, 1.65), (0.8, 0, 0.09, 1.65),
                       (0, 0, 0.05, 1.5), (0, 0, 1.5, 0.05)):
    caja("marco", (sx, 0.08, sz), (VX + dx, 1.6, VZ + dz), M_ROBOT)

# escritorio largo
caja("mesa", (3.9, 0.85, 0.07), (0, 0.15, 0.78), M_MESA, 0.01)
for x in (-1.8, 1.8):
    for y in (-0.2, 0.5):
        caja("pata", (0.07, 0.07, 0.75), (x, y, 0.375), M_MESA)

def monitor(x, fase):
    caja("mon_pie", (0.3, 0.2, 0.03), (x, 0.3, 0.83), M_OSCURO)
    caja("mon_cuello", (0.06, 0.05, 0.3), (x, 0.34, 0.97), M_OSCURO)
    caja("mon_marco", (0.98, 0.06, 0.62), (x, 0.32, 1.34), M_OSCURO, 0.015)
    y = 0.285
    caja("mon_base", (0.9, 0.01, 0.54), (x, y, 1.34), M_PANT_BASE)
    caja("mon_visor", (0.4, 0.01, 0.26), (x - 0.2, y - 0.006, 1.44), M_PANT_ALTA)       # el video que se está armando
    caja("mon_lista", (0.3, 0.01, 0.05), (x + 0.22, y - 0.006, 1.54), M_PANT_MED)
    caja("mon_lista", (0.22, 0.01, 0.05), (x + 0.18, y - 0.006, 1.45), M_PANT_MED)
    caja("mon_lista", (0.27, 0.01, 0.05), (x + 0.205, y - 0.006, 1.36), M_PANT_MED)
    for i, (w, off) in enumerate(((0.5, -0.15), (0.34, 0.2), (0.62, -0.05))):            # línea de tiempo
        caja("mon_clip", (w, 0.01, 0.05), (x + off, y - 0.006, 1.24 - i * 0.07), M_PANT_MED)
    cab = caja("mon_cabezal", (0.02, 0.012, 0.24), (x - 0.42, y - 0.012, 1.17), M_PANT_ALTA)
    for f in range(-40, F_FIN + 60, 60):                                                 # cabezal que recorre
        cab.location.x = x - 0.42; cab.keyframe_insert("location", frame=f + fase)
        cab.location.x = x + 0.42; cab.keyframe_insert("location", frame=f + fase + 58)
    bpy.ops.object.light_add(type="AREA", location=(x, 0.1, 1.36), rotation=(math.pi / 2, 0, 0))
    l = bpy.context.active_object; l.data.shape = "RECTANGLE"; l.data.size = 0.9; l.data.size_y = 0.5
    l.data.energy = 26; l.name = "luz_mon"
    caja("teclado", (0.5, 0.17, 0.02), (x, -0.1, 0.825), M_OSCURO, 0.005)

def asistente(x, f_giro, giro):
    """Robot de bloques sentado, de espaldas a la cámara inicial (mira a +Y)."""
    cil("banco", 0.17, 0.5, (x, -0.72, 0.25), M_OSCURO)
    caja("cuerpo", (0.44, 0.3, 0.5), (x, -0.72, 0.76), M_ROBOT, 0.05)
    bpy.ops.object.empty_add(location=(x, -0.72, 1.03)); cuello = bpy.context.active_object; cuello.name = "cuello"
    caja("cabeza", (0.5, 0.38, 0.38), (x, -0.72, 1.25), M_ROBOT, 0.07, padre=cuello)
    caja("cara", (0.4, 0.02, 0.26), (x, -0.525, 1.25), M_OSCURO, padre=cuello)
    for dx in (-0.1, 0.1):
        caja("ojo", (0.075, 0.02, 0.11), (x + dx, -0.512, 1.27), M_OJO, padre=cuello)
    cil("antena", 0.012, 0.16, (x, -0.72, 1.52), M_ROBOT, padre=cuello)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.04, location=(x, -0.72, 1.62)); b = bpy.context.active_object
    b.data.materials.append(M_OJO); b.parent = cuello; b.matrix_parent_inverse = cuello.matrix_world.inverted()
    for i, dx in enumerate((-0.27, 0.27)):
        br = caja("brazo", (0.09, 0.5, 0.09), (x + dx, -0.5, 0.9), M_ROBOT, 0.03)
        br.rotation_euler.x = -0.12
        for f in range(-6, 170, 6):                              # teclea
            br.delta_location.z = 0.025 if ((f // 6) + i) % 2 else 0.0
            br.keyframe_insert("delta_location", frame=f + i * 2)
    # gira la cabeza hacia la cámara cuando esta lo rodea (giro rápido, 6 cuadros)
    cuello.rotation_euler.z = 0; cuello.keyframe_insert("rotation_euler", frame=f_giro)
    cuello.rotation_euler.z = giro; cuello.keyframe_insert("rotation_euler", frame=f_giro + 6)

for i, x in enumerate((-1.25, 0.0, 1.25)):
    monitor(x, i * 17)
asistente(-1.25, 122, math.radians(-100))
asistente(0.0, 112, math.radians(-95))
asistente(1.25, 102, math.radians(-82))

# ---------- zona B: pared con 8 pantallas verticales + tu palabra de CTA ----------
F_PANT = 150
n = 0
for fila, z in enumerate((3.15, 1.92)):
    for c in range(4):
        x = XB + (c - 1.5) * 0.70
        caja("cel_cuerpo", (0.66, 0.07, 1.12), (x, 1.6, z), M_OSCURO, 0.03)
        f_on = F_PANT + n * 7
        p = caja("cel_pantalla", (0.58, 0.01, 1.02), (x, 1.555, z), M_PANT_ALTA if n % 2 == 0 else M_PANT_MED)
        paso(p, "scale", f_on, (0, 0, 0), (1, 1, 1))
        # triángulo de play
        bpy.ops.mesh.primitive_cylinder_add(vertices=3, radius=0.14, depth=0.01, location=(x, 1.54, z + 0.06),
                                            rotation=(math.pi / 2, math.radians(90), 0))
        t = bpy.context.active_object; t.data.materials.append(M_OSCURO); t.name = "cel_play"
        paso(t, "scale", f_on, (0, 0, 0), (1, 1, 1))
        # barra de avance que crece
        bar = caja("cel_barra", (0.46, 0.012, 0.035), (x, 1.54, z - 0.4), M_OSCURO)
        bar.scale = (0, 0, 0); bar.keyframe_insert("scale", frame=f_on - 1)
        bar.scale = (0.05, 1, 1); bar.keyframe_insert("scale", frame=f_on)
        bar.scale = (1, 1, 1); bar.keyframe_insert("scale", frame=F_FIN + 20)
        n += 1
bpy.ops.object.light_add(type="AREA", location=(XB, 0.4, 2.6), rotation=(math.pi / 2, 0, 0))
lp = bpy.context.active_object; lp.data.size = 3.0; lp.name = "luz_pared"
paso(lp.data, "energy", F_PANT, 0, 15); lp.data.energy = 90; lp.data.keyframe_insert("energy", frame=F_PANT + 56)

# la palabra del CTA en letras 3D, paradas en la tarima; entran una por una con corte seco
bpy.ops.object.text_add(location=(0, 0, 0)); tx = bpy.context.active_object
tx.data.body = CTA; tx.data.font = bpy.data.fonts.load(FUENTE)
tx.data.align_x = "CENTER"; tx.data.size = 1.0; tx.data.extrude = 0.11; tx.data.space_character = 1.06
bpy.ops.object.convert(target="MESH")
bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.remove_doubles(threshold=0.0005)
bpy.ops.mesh.separate(type="LOOSE"); bpy.ops.object.mode_set(mode="OBJECT")
info = []
for o in list(bpy.context.selected_objects):
    xs = [v.co.x for v in o.data.vertices]
    info.append([o, min(xs), max(xs)])
info.sort(key=lambda i: (i[1] + i[2]) / 2)
grupos = []                                   # una letra = piezas que se pisan en X (la tilde va con su A)
for it in info:
    cx = (it[1] + it[2]) / 2
    gc = (grupos[-1][0] + grupos[-1][1]) / 2 if grupos else 0
    if grupos and (grupos[-1][0] < cx < grupos[-1][1] or it[1] < gc < it[2]):
        grupos[-1][2].append(it[0]); grupos[-1][1] = max(grupos[-1][1], it[2]); grupos[-1][0] = min(grupos[-1][0], it[1])
    else:
        grupos.append([it[1], it[2], [it[0]]])
print("LETRAS:", len(grupos))
ancho = grupos[-1][1] - grupos[0][0]
ESC = 2.3 / max(ancho, 3.0)        # palabras cortas no crecen más que una de 7 letras (si no, se salen del cuadro)
caja("tarima", (2.8, 0.4, 0.75), (XB, 0.9, 0.375), M_MESA, 0.01)
F_LETRA = 228
for k, (x0, x1, objs) in enumerate(grupos):
    for o in objs:
        o.data.materials.append(M_LETRA); o.data.materials.append(M_LETRA_F); o.name = "letra_%d" % k
        for p in o.data.polygons:
            if abs(p.normal.z) > 0.9: p.material_index = 1   # frente y dorso emiten (las normales del texto convertido no son parejas)
        o.rotation_euler = (math.pi / 2, 0, 0); o.location = (XB, 0.86, 0.76)
        paso(o, "scale", F_LETRA + k * 5, (0, 0, 0), (ESC, ESC, ESC))
bpy.ops.object.light_add(type="AREA", location=(XB - 1.2, -2.2, 2.6)); ll = bpy.context.active_object
ll.data.size = 2.5; ll.data.energy = 420; ll.name = "luz_letras"
ob = bpy.data.objects.new("mira_letras", None); sc.collection.objects.link(ob); ob.location = (XB, 0.9, 1.05)
c = ll.constraints.new("TRACK_TO"); c.target = ob

# ---------- luces zona A ----------
bpy.ops.object.light_add(type="AREA", location=(VX + 0.2, 1.2, 3.2)); lm = bpy.context.active_object   # luna: contraluz
lm.data.size = 1.4; lm.data.energy = 130; lm.name = "luz_luna"
o2 = bpy.data.objects.new("mira_luna", None); sc.collection.objects.link(o2); o2.location = (0, -0.9, 0.9)
c = lm.constraints.new("TRACK_TO"); c.target = o2
bpy.ops.object.light_add(type="AREA", location=(-3.5, -4.5, 3.4)); lr = bpy.context.active_object       # relleno suave
lr.data.size = 4; lr.data.energy = 110; lr.name = "relleno"
o3 = bpy.data.objects.new("mira_relleno", None); sc.collection.objects.link(o3); o3.location = (0.5, -0.5, 1.0)
c = lr.constraints.new("TRACK_TO"); c.target = o3

# ---------- cámara viva: una sola toma continua ----------
bpy.ops.object.camera_add(); cam = bpy.context.active_object; sc.camera = cam
cam.data.lens = 34; cam.data.clip_start = 0.1; cam.data.clip_end = 60
mira = bpy.data.objects.new("mira", None); sc.collection.objects.link(mira)
c = cam.constraints.new("TRACK_TO"); c.target = mira; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
RUTA = [  # cuadro, cámara, mira
    (-40, (0.9, -7.6, 2.5), (0.0, 0.6, 2.4)),
    (1,   (0.6, -6.3, 2.25), (0.0, 0.6, 2.3)),       # general: ventana con luna + escritorio
    (78,  (-0.5, -3.9, 1.75), (0.0, 0.3, 1.75)),    # push-in a las espaldas y monitores
    (148, (3.25, -1.75, 1.55), (0.35, -0.1, 1.5)),  # órbita: las caras se voltean
    (212, (XB - 0.9, -2.7, 2.1), (XB, 1.6, 2.6)),  # travelling a la pared: 8 pantallas se prenden
    (300, (XB + 0.12, -3.3, 1.6), (XB, 1.6, 2.2)), # se abre: palabra del CTA + pared
    (345, (XB + 0.2, -3.0, 1.6), (XB, 1.6, 2.2)),
]
for f, pc, pm in RUTA:
    cam.location = pc; cam.keyframe_insert("location", frame=f)
    mira.location = pm; mira.keyframe_insert("location", frame=f)

# ---------- material del pase de profundidad (se usa como override en render_pases.py) ----------
md = bpy.data.materials.new("PASE_PROFUNDIDAD"); md.use_nodes = True; md.use_fake_user = True
nt = md.node_tree; nt.nodes.clear()
cd = nt.nodes.new("ShaderNodeCameraData"); mr = nt.nodes.new("ShaderNodeMapRange")
mr.inputs["From Min"].default_value = 1.0; mr.inputs["From Max"].default_value = 13.0
mr.inputs["To Min"].default_value = 1.0; mr.inputs["To Max"].default_value = 0.02
em = nt.nodes.new("ShaderNodeEmission"); out = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(cd.outputs["View Z Depth"], mr.inputs["Value"]); nt.links.new(mr.outputs["Result"], em.inputs["Color"])
nt.links.new(em.outputs["Emission"], out.inputs["Surface"])

sc.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(AQUI, "escena.blend"))
print("OK escena.blend")
