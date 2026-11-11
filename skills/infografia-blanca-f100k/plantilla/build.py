# -*- coding: utf-8 -*-
"""
build.py · Plantilla «Infografía blanca» (infografia-blanca-f100k)
Reconstruye la escena entera desde cero en Blender (EEVEE), sin créditos:
    blender -b -P build.py                 → escena.blend (junto a este archivo o en IB_OUT)
    blender -b escena.blend -a             → cuadros/f_0001.png … f_0300.png
    ffmpeg -y -framerate 30 -start_number 1 -i cuadros/f_%04d.png \
      -vf "vignette=angle=PI/9,noise=alls=5:allf=t,format=yuv420p" \
      -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -movflags +faststart -an muestra.mp4
Variables de entorno: IB_CONFIG (config.json con textos, CTA y colores), IB_OUT (carpeta de salida),
IB_FONTS (carpeta de letras), IB_SCALE (% de 1080x1920, 100 por defecto), IB_SAMPLES (muestras EEVEE, 48).
Pruebas rápidas: IB_SCALE=50 IB_SAMPLES=12 y renderiza 3–4 cuadros con -f.

Mecánica: mesa crema, tarjetas de cartón grueso con borde negro y canto real, un solo
color de acento, 4 «pantallas» recreadas paso a paso, cámara en toma continua que viaja
de una a otra con desenfoque ligero y barra de avance (pegada a la cámara) que marca el tramo.
"""
import bpy, bmesh, math, os, json
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get('IB_OUT') or HERE
_f = os.path.join(HERE, 'fuentes')
FONTS = os.environ.get('IB_FONTS') or (_f if os.path.isdir(_f) else os.path.expanduser('~/.claude/skills/gancho-golpe-f100k/fuentes'))
SCALE = int(os.environ.get('IB_SCALE', '100'))
SAMPLES = int(os.environ.get('IB_SAMPLES', '48'))
FPS, F_END = 30, 300

# ------------------------------------------------------------------ configuración (config.json)
CFG = {}
_cp = os.environ.get('IB_CONFIG') or os.path.join(HERE, 'config.json')
if os.path.exists(os.path.expanduser(_cp)):
    with open(os.path.expanduser(_cp), encoding='utf-8') as fh:
        CFG = json.load(fh)


def cfg(sec, key, default):
    return CFG.get(sec, {}).get(key, default) if sec else CFG.get(key, default)


CTA = str(cfg(None, 'cta', 'GUÍA')).upper()
COL = dict(acento='#E0592F', fondo='#F4F1EA', tinta='#151411')
COL.update(CFG.get('colores', {}))
E1 = dict(hora=['3:07', '3:08'], hora_chica='a. m.', estado='TÚ: DURMIENDO',
          frase=['Tu equipo', 'TRABAJA', 'mientras', 'duermes'])
E1.update(CFG.get('estacion1', {}))
E2 = dict(app='Tu equipo', estado='EN TURNO', tareas=['GUION', 'VOZ', 'DIBUJO', 'MÚSICA', 'EDICIÓN', 'PUBLICA'],
          frase=['Hacen tus videos', 'SOLOS'])
E2.update(CFG.get('estacion2', {}))
E3 = dict(origen=['1', 'idea'], cantidad=8, unidad=['video', 'videos'], remate='LISTOS PARA PUBLICAR')
E3.update(CFG.get('estacion3', {}))
E4 = dict(pide='Comenta')
E4.update(CFG.get('estacion4', {}))
TRAMOS = cfg(None, 'tramos', ['01 EQUIPO', '02 TAREAS', '03 VIDEOS', '04 ' + CTA])

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = scene.collection
prefs = bpy.context.preferences.edit


# ------------------------------------------------------------------ utilidades
def srgb(hexs):
    hexs = hexs.lstrip('#')
    out = []
    for i in (0, 2, 4):
        c = int(hexs[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def mat(name, hexs, rough=0.92, paper=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = srgb(hexs)
    b.inputs['Roughness'].default_value = rough
    try:
        b.inputs['Specular IOR Level'].default_value = 0.25
    except Exception:
        pass
    if paper:  # fibra de papel muy sutil
        n = nt.nodes.new('ShaderNodeTexNoise')
        n.inputs['Scale'].default_value = 420
        n.inputs['Detail'].default_value = 6
        bp = nt.nodes.new('ShaderNodeBump')
        bp.inputs['Strength'].default_value = 0.06
        nt.links.new(n.outputs['Fac'], bp.inputs['Height'])
        nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m


M_TABLE = mat('mesa', COL['fondo'], paper=True)
M_FACE = mat('cara', '#FFFEFA', paper=True)
M_BLACK = mat('negro', COL['tinta'], 0.8)
M_ACC = mat('acento', COL['acento'], 0.85, paper=True)
M_CANTO = mat('canto', '#CFC8BB', paper=True)
M_GRAY = mat('gris', '#C9C4B9')
M_INK = mat('tinta', COL['tinta'], 0.95)
M_INKACC = mat('tinta_acento', COL['acento'], 0.95)
M_INKGRAY = mat('tinta_gris', '#8E897F', 0.95)
M_INKCREAM = mat('tinta_crema', '#FCFAF5', 0.95)


def font(path):
    return bpy.data.fonts.load(path) if os.path.exists(path) else None


F_BLACK = font(os.path.join(FONTS, 'ArchivoBlack-Regular.ttf'))
F_SERIF = font(os.path.join(FONTS, 'InstrumentSerif-Italic.ttf'))


def empty(name, parent=None, loc=(0, 0, 0)):
    o = bpy.data.objects.new(name, None)
    o.empty_display_size = 0.1
    col.objects.link(o)
    o.parent = parent
    o.location = loc
    return o


def rrect(w, h, r, seg=6, x0=None):
    """Rectángulo redondeado centrado (o con borde izquierdo en x=0 si x0 == 0)."""
    r = max(min(r, w / 2 - 1e-4, h / 2 - 1e-4), 1e-4)
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90),
                       (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    if x0 == 0:
        pts = [(x + w / 2, y) for x, y in pts]
    return pts


def circle(r, n=40):
    return [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def crescent(R, n=72):
    cx, cy, r2 = 0.42 * R, 0.30 * R, 0.86 * R
    outer = [(R * math.cos(2 * math.pi * i / n), R * math.sin(2 * math.pi * i / n)) for i in range(n)]
    inner = [(cx + r2 * math.cos(2 * math.pi * i / n), cy + r2 * math.sin(2 * math.pi * i / n)) for i in range(n)]
    keep_o = [math.hypot(x - cx, y - cy) > r2 for x, y in outer]
    keep_i = [math.hypot(x, y) < R for x, y in inner]

    def run(pts, keep):
        k = next(i for i in range(n) if keep[i] and not keep[i - 1])
        out = []
        while keep[k % n]:
            out.append(pts[k % n]); k += 1
        return out
    return run(outer, keep_o) + list(reversed(run(inner, keep_i)))


def slab(name, pts, z0, z1, material, parent, loc=(0, 0, 0), bevel=True, shadow=True):
    bm = bmesh.new()
    lo = [bm.verts.new((x, y, z0)) for x, y in pts]
    hi = [bm.verts.new((x, y, z1)) for x, y in pts]
    n = len(pts)
    bm.faces.new(hi)
    bm.faces.new(list(reversed(lo)))
    for i in range(n):
        bm.faces.new((lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    me.materials.append(material)
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    o.parent = parent
    o.location = loc
    if bevel and (z1 - z0) > 0.012:
        md = o.modifiers.new('bisel', 'BEVEL')
        md.width = 0.0035; md.segments = 2; md.limit_method = 'ANGLE'
    if not shadow:
        try:
            o.visible_shadow = False
        except Exception:
            pass
    return o


def card(name, parent, x, y, w, h, z=0.0, T=0.075, b=0.032, face=None, r=0.035, shadow=True):
    """Tarjeta de cartón: canto gris + aro negro + cara crema hundida hacia adentro del borde."""
    face = face or M_FACE
    root = empty(name, parent, (x, y, z))
    slab(name + '_canto', rrect(w, h, r), 0, T * 0.6, M_CANTO, root, shadow=shadow)
    slab(name + '_aro', rrect(w, h, r), T * 0.6, T, M_BLACK, root, shadow=shadow)
    slab(name + '_cara', rrect(w - 2 * b, h - 2 * b, r - b * 0.6), T, T + 0.003, face, root, bevel=False, shadow=shadow)
    root['top'] = T + 0.003
    return root


_wcache = {}


def text(body, fnt, size, material, x, y, z, parent, align='CENTER', extrude=0.0025):
    cu = bpy.data.curves.new('t_' + body, 'FONT')
    cu.body = body
    if fnt:
        cu.font = fnt
    cu.size = size
    cu.align_x = align
    cu.align_y = 'BOTTOM_BASELINE'
    cu.extrude = extrude
    cu.materials.append(material)
    o = bpy.data.objects.new('t_' + body, cu)
    col.objects.link(o)
    o.parent = parent
    o.location = (x, y - 0.36 * size, z + extrude + 0.0005)
    try:
        o.visible_shadow = False
    except Exception:
        pass
    return o


def twidth(body, fnt, size):
    key = (body, fnt.name if fnt else '', )
    if key not in _wcache:
        t = text(body, fnt, 1.0, M_INK, 0, 0, 0, None, align='LEFT')
        bpy.context.view_layer.update()
        _wcache[key] = t.dimensions.x
        bpy.data.objects.remove(t)
    return _wcache[key] * size


def words(specs, cx, y, z, parent, gap=0.06):
    """Renglón centrado de palabras con letra/tamaño/color/cuadro propios.
    specs: [(texto, fuente, tamaño, material, cuadro_de_entrada | None)]"""
    ws = [twidth(s[0], s[1], s[2]) for s in specs]
    total = sum(ws) + gap * (len(specs) - 1)
    x = cx - total / 2
    out = []
    for s, w in zip(specs, ws):
        o = text(s[0], s[1], s[2], s[3], x, y, z, parent, align='LEFT')
        if s[4] is not None:
            show(o, s[4])
        out.append(o)
        x += w + gap
    return out


# ---- animación: corte seco (CONSTANT) y crecer suave (BEZIER, sin rebote)
def _fcurves(o):
    ad = o.animation_data
    act = ad.action
    try:
        return list(act.fcurves)
    except Exception:
        return list(act.layers[0].strips[0].channelbag(ad.action_slot).fcurves)


def _key(o, f, v, index=-1, mode='CONSTANT'):
    if index == -1:
        o.scale = (v, v, v)
    else:
        o.scale[index] = v
    o.keyframe_insert('scale', frame=f, index=index)
    for fc in _fcurves(o):
        if fc.data_path == 'scale':
            for kp in fc.keyframe_points:
                if abs(kp.co.x - f) < 0.01:
                    kp.interpolation = mode


def show(o, f_on, f_off=None):
    """Aparece con corte seco en f_on (y desaparece en f_off)."""
    if f_on > 1:
        _key(o, 1, 0.0001)
    _key(o, f_on, 1.0)
    if f_off:
        _key(o, f_off, 0.0001)


def grow(o, f, dur=7, index=-1):
    """Se construye: escala 0→1 con suavizado, sin rebote."""
    _key(o, f, 0.0001, index, 'BEZIER')
    _key(o, f + dur, 1.0, index, 'BEZIER')


def pill(name, parent, x, y, w, h, z, label, size, face=None, ink=None, fnt=None, shadow=True):
    c = card(name, parent, x, y, w, h, z, T=0.022, b=0.014, face=face, r=h / 2, shadow=shadow)
    size = min(size, (w - 0.6 * h) / max(twidth(label, fnt or F_BLACK, 1.0), 1e-4))   # textos largos: se achica, no se sale
    text(label, fnt or F_BLACK, size, ink or M_INK, 0, 0, c['top'], c)
    return c


# ------------------------------------------------------------------ mundo, mesa, luz
w = bpy.data.worlds.new('mundo'); scene.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']
bg.inputs['Color'].default_value = srgb('#FFFCF7'); bg.inputs['Strength'].default_value = 0.66

tm = bpy.data.meshes.new('mesa')
tm.from_pydata([(-12, -16, 0), (20, -16, 0), (20, 12, 0), (-12, 12, 0)], [], [(0, 1, 2, 3)])
tm.materials.append(M_TABLE)
col.objects.link(bpy.data.objects.new('mesa', tm))

sd = bpy.data.lights.new('sol', 'SUN'); sd.energy = 2.0; sd.angle = math.radians(9)
sd.color = (1.0, 0.975, 0.95)
so = bpy.data.objects.new('sol', sd); col.objects.link(so)
so.rotation_euler = (math.radians(57), math.radians(-10), math.radians(38))

# ------------------------------------------------------------------ estaciones
ST = [(0.0, 0.0), (3.2, 0.6), (3.2, -4.4), (6.4, -4.4)]
DW = [(1, 64), (84, 148), (168, 226), (246, 300)]          # cuadros de permanencia
CHG = [74, 158, 236]                                        # cambio de paso (mitad del viaje)
S = [empty(f'estacion{i + 1}', None, (x, y, 0)) for i, (x, y) in enumerate(ST)]

# sendero de puntos entre estaciones (lo que pasa bajo la cámara al viajar)
for i in range(3):
    a, b = Vector(ST[i]), Vector(ST[i + 1])
    d = (b - a); L = d.length; d.normalize()
    t = 1.35
    while t < L - 1.3:
        p = a + d * t
        slab('punto', rrect(0.06, 0.06, 0.01), 0, 0.012, M_BLACK, None, (p.x, p.y, 0), bevel=False)
        t += 0.2

def fit(body, fnt, size, maxw):
    """Tamaño de letra que no pasa de maxw de ancho."""
    return min(size, maxw / max(twidth(body, fnt, 1.0), 1e-4))


# Los textos de las 4 estaciones salen de config.json (E1…E4). Para cambiar el DIBUJO de una estación
# (luna, asistentes, tarjetas de video, campo de comentario) se edita su bloque aquí abajo.

# ============ ESTACIÓN 1 · «Tu equipo TRABAJA mientras duermes» (tarjeta de noche con reloj)
s = S[0]
c = card('pantalla_noche', s, 0, 0.52, 1.95, 1.35)
top = c['top']
slab('luna', crescent(0.27), 0, 0.03, M_ACC, c, (-0.55, 0.12, top))
for body, sz, dx, dy, f in (('z', 0.12, -0.27, 0.36, 16), ('z', 0.16, -0.16, 0.45, 30), ('Z', 0.21, -0.02, 0.52, 44)):
    show(text(body, F_SERIF, sz, M_INK, dx, dy, top, c), f)
h0, h1 = (list(E1['hora']) + [E1['hora'][0]])[:2]
hs = fit(max(h0, h1, key=len), F_BLACK, 0.40, 0.95)
show(text(h0, F_BLACK, hs, M_INK, 0.36, 0.10, top, c), 1, 38)
show(text(h1, F_BLACK, hs, M_INK, 0.36, 0.10, top, c), 38)
text(E1['hora_chica'], F_BLACK, 0.08, M_INKGRAY, 0.36, -0.12, top, c)
p = pill('pill_estado', c, 0, -0.42, 1.2, 0.2, top, E1['estado'], 0.09)
slab('linea_noche', rrect(1.7, 0.012, 0.002), 0, 0.004, M_BLACK, c, (0, -0.24, top), bevel=False)

f1 = list(E1['frase']) + [''] * 4
words([(f1[0], F_SERIF, fit(f1[0], F_SERIF, 0.30, 1.9), M_INK, 1)], 0, -0.42, 0, s)
big = 1.9 / twidth(f1[1], F_BLACK, 1.0)                     # la clave ocupa el ancho de la tarjeta
strip = slab('tira_clave', rrect(2.06, big * 0.98, 0.02), 0, 0.012, M_ACC, s, (0, -0.86, 0), bevel=False)
show(strip, 10)
show(text(f1[1], F_BLACK, big, M_INK, 0, -0.86, 0.012, s), 10)
r3 = [(f1[2], F_SERIF, 0.25, M_INK, 22), (f1[3], F_BLACK, 0.21, M_INK, 30)]
k3 = min(1.0, 1.9 / max(sum(twidth(w_[0], w_[1], w_[2]) for w_ in r3) + 0.08, 1e-4))
words([(a_, b_, c_ * k3, d_, e_) for a_, b_, c_, d_, e_ in r3 if a_], 0, -1.30, 0, s, gap=0.08)

# ============ ESTACIÓN 2 · la ventana de la app: hasta 6 tareas que se prenden una por una
s = S[1]
c = card('ventana_app', s, 0, 0.12, 2.12, 2.36)
top = c['top']
slab('barra_titulo', rrect(2.05, 0.012, 0.002), 0, 0.004, M_BLACK, c, (0, 0.88, top), bevel=False)
slab('icono_app', rrect(0.13, 0.13, 0.02), 0, 0.02, M_ACC, c, (-0.90, 1.02, top))
text(E2['app'], F_BLACK, fit(E2['app'], F_BLACK, 0.125, 1.0), M_INK, -0.78, 1.02, top, c, align='LEFT')
pill('pill_turno', c, 0.66, 1.02, 0.62, 0.14, top, E2['estado'], 0.06)

LABELS = list(E2['tareas'])[:6]
for i, lab in enumerate(LABELS):
    cx = (-0.67, 0, 0.67)[i % 3]
    cy = (0.42, -0.36)[i // 3]
    t = card(f'tarea_{i}', c, cx, cy, 0.6, 0.7, top, T=0.05, b=0.024, r=0.03)
    tt = t['top']
    # cabecita del asistente
    slab('cabeza', rrect(0.27, 0.21, 0.05), 0, 0.022, M_BLACK, t, (0, 0.12, tt))
    for ex in (-0.06, 0.06):
        slab('ojo', circle(0.027, 20), 0.022, 0.026, M_FACE, t, (ex, 0.125, tt), bevel=False)
    slab('antena', rrect(0.014, 0.05, 0.003), 0, 0.012, M_BLACK, t, (0, 0.245, tt), bevel=False)
    slab('antena_bola', circle(0.018, 16), 0, 0.014, M_ACC, t, (0, 0.275, tt), bevel=False)
    text(lab, F_BLACK, fit(lab, F_BLACK, 0.066, 0.5), M_INK, 0, -0.08, tt, t)
    # barrita de trabajo que se llena
    slab('riel', rrect(0.44, 0.05, 0.012), 0, 0.006, M_BLACK, t, (0, -0.215, tt), bevel=False)
    slab('riel_fondo', rrect(0.41, 0.026, 0.006), 0.006, 0.008, M_FACE, t, (0, -0.215, tt), bevel=False)
    fill = slab('riel_lleno', rrect(0.41, 0.026, 0.006, x0=0), 0.008, 0.011, M_ACC, t, (-0.205, -0.215, tt), bevel=False)
    f0 = 80 + i * 6
    grow(t, f0, 7)
    grow(fill, f0 + 10, 30 + (i % 3) * 5, index=0)

f2 = (list(E2['frase']) + [''])[:2]
r2 = [(f2[0], F_SERIF, 0.19, M_INK, 118), (f2[1], F_BLACK, 0.2, M_INKACC, 128)]
k2 = min(1.0, 1.95 / max(sum(twidth(w_[0], w_[1], w_[2]) for w_ in r2) + 0.08, 1e-4))
words([(a_, b_, c_ * k2, d_, e_) for a_, b_, c_, d_, e_ in r2 if a_], 0, -0.90, top, c, gap=0.08)

# ============ ESTACIÓN 3 · «1 idea → N videos» (N de 1 a 8: la cifra real de tu guion)
s = S[2]
c = card('tarjeta_origen', s, -0.52, 0.98, 0.98, 0.5)
o3 = (list(E3['origen']) + [''])[:2]
words([(o3[0], F_BLACK, 0.30, M_INKACC, None), (o3[1], F_SERIF, fit(o3[1], F_SERIF, 0.30, 0.55), M_INK, None)], 0, 0, c['top'], c, gap=0.07)
shaft = slab('flecha_palo', rrect(0.30, 0.035, 0.004, x0=0), 0, 0.012, M_BLACK, s, (0.06, 0.98, 0), bevel=False)
grow(shaft, 170, 8, index=0)
head = slab('flecha_punta', [(0, 0.085), (0, -0.085), (0.13, 0)], 0, 0.012, M_BLACK, s, (0.36, 0.98, 0), bevel=False)
show(head, 178)

N = max(1, min(8, int(E3['cantidad'])))
VID_F = [180 + i * (5 if N > 4 else 9) for i in range(N)]
uni, plu = (list(E3['unidad']) + [E3['unidad'][0]])[:2]
for i, f in enumerate(VID_F):
    show(text(str(i + 1), F_BLACK, 0.5, M_INKACC, 0.72, 1.04, 0, s), f, VID_F[i + 1] if i < N - 1 else None)
    cx = (-0.735, -0.245, 0.245, 0.735)[i % 4]
    cy = (0.16, -0.66)[i // 4]
    v = card(f'video{i + 1}', s, cx, cy, 0.44, 0.70, 0, T=0.06, b=0.026, r=0.03)
    vt = v['top']
    slab('play', [(-0.045, 0.06), (-0.045, -0.06), (0.065, 0)], 0, 0.014, M_ACC, v, (0, 0.07, vt), bevel=False)
    slab('renglon1', rrect(0.28, 0.022, 0.004), 0, 0.004, M_BLACK, v, (0, -0.17, vt), bevel=False)
    slab('renglon2', rrect(0.18, 0.022, 0.004), 0, 0.004, M_GRAY, v, (-0.05, -0.225, vt), bevel=False)
    grow(v, f, 6)
if N > 1:   # «1 video» en singular y después el plural
    show(text(uni, F_SERIF, fit(uni, F_SERIF, 0.2, 0.7), M_INK, 0.72, 0.74, 0, s), 180, VID_F[1])
    show(text(plu, F_SERIF, fit(plu, F_SERIF, 0.2, 0.7), M_INK, 0.72, 0.74, 0, s), VID_F[1])
else:
    show(text(uni, F_SERIF, fit(uni, F_SERIF, 0.2, 0.7), M_INK, 0.72, 0.74, 0, s), 180)
show(pill('pill_remate', s, 0, -1.24, 1.5, 0.2, 0, E3['remate'], 0.085), 222)

# ============ ESTACIÓN 4 · «Comenta [CTA]»: la palabra se teclea, se enciende PUBLICAR y sale el comentario
s = S[3]
show(text(E4['pide'], F_SERIF, fit(E4['pide'], F_SERIF, 0.34, 2.0), M_INK, 0, 1.0, 0, s), 244)
c = card('tarjeta_cta', s, 0, 0.34, 2.12, 0.86, face=M_ACC)
WORD = CTA
fsz = min(0.62, 1.78 / twidth(WORD, F_BLACK, 1.0))
xl = -twidth(WORD, F_BLACK, fsz) / 2
step = max(1, min(3, 24 // max(len(WORD), 1)))
TYPE_F = [252 + i * step for i in range(len(WORD))]
for i, f in enumerate(TYPE_F):
    show(text(WORD[:i + 1], F_BLACK, fsz, M_INK, xl, 0, c['top'], c, align='LEFT'), f, TYPE_F[i + 1] if i < len(WORD) - 1 else None)

fld = card('campo_comentario', s, 0, -0.52, 2.12, 0.4, T=0.04, b=0.026)
ft = fld['top']
csz = fit(WORD, F_BLACK, 0.13, 1.0)
slab('globo', rrect(0.15, 0.12, 0.025), 0, 0.012, M_BLACK, fld, (-0.86, 0.0, ft), bevel=False)
slab('globo_in', rrect(0.105, 0.075, 0.012), 0.012, 0.014, M_FACE, fld, (-0.86, 0.0, ft), bevel=False)
for i, f in enumerate(TYPE_F):
    part = WORD[:i + 1]
    show(text(part, F_BLACK, csz, M_INK, -0.72, 0, ft, fld, align='LEFT'), f, TYPE_F[i + 1] if i < len(WORD) - 1 else None)
    caret = slab('cursor', rrect(0.012, 0.15, 0.002), 0, 0.004, M_ACC, fld,
                 (-0.72 + twidth(part, F_BLACK, csz) + 0.025, 0, ft), bevel=False)
    show(caret, f, TYPE_F[i + 1] if i < len(WORD) - 1 else 282)
show(pill('btn_publicar_off', fld, 0.66, 0, 0.6, 0.2, ft, 'PUBLICAR', 0.066, ink=M_INKGRAY), 1, 280)
show(pill('btn_publicar_on', fld, 0.66, 0, 0.6, 0.2, ft, 'PUBLICAR', 0.066, face=M_ACC), 280)

cm = card('comentario_enviado', s, 0, -1.08, 1.5, 0.34, T=0.035, b=0.022)
slab('foto_perfil', circle(0.085, 28), 0, 0.014, M_BLACK, cm, (-0.55, 0, cm['top']), bevel=False)
text(WORD, F_BLACK, fit(WORD, F_BLACK, 0.12, 0.9), M_INK, -0.40, 0, cm['top'], cm, align='LEFT')
slab('punto_enviado', circle(0.045, 20), 0, 0.012, M_ACC, cm, (0.56, 0, cm['top']), bevel=False)
grow(cm, 284, 6)

# ------------------------------------------------------------------ cámara en toma continua
cd = bpy.data.cameras.new('camara'); cd.lens = 50; cd.sensor_width = 36
cam = bpy.data.objects.new('camara', cd); col.objects.link(cam); scene.camera = cam
tgt = empty('foco')
cd.dof.use_dof = True; cd.dof.focus_object = tgt; cd.dof.aperture_fstop = 0.55

DRIFT = [(0.10, -0.12), (-0.10, -0.12), (0.10, -0.14), (-0.06, -0.10)]
H0, PUSH = 6.05, 0.5


def smoother(s):
    return s * s * s * (s * (s * 6 - 15) + 10)


def dwell_state(i, u):
    x, y = ST[i]
    return Vector((x + DRIFT[i][0] * (u - 0.5), y + DRIFT[i][1] * (u - 0.5) - 0.06, H0 - PUSH * u))


def cam_state(f):
    for i, (a, b) in enumerate(DW):
        if a <= f <= b:
            return dwell_state(i, (f - a) / (b - a))
    for i in range(3):
        b, a2 = DW[i][1], DW[i + 1][0]
        if b < f < a2:
            sraw = (f - b) / (a2 - b)
            e = smoother(sraw)
            v = dwell_state(i, 1.0).lerp(dwell_state(i + 1, 0.0), e)
            v.z += 0.45 * math.sin(math.pi * sraw)      # la cámara se levanta al viajar
            return v
    return dwell_state(3, 1.0)


# ---- barra de progreso (pegada a la cámara, a la distancia de foco)
hud = empty('barra_progreso', cam, (0, 0, -6))
HY = 1.55
CX = [-0.98, -0.72, -0.46, -0.20]
slab('hud_linea', rrect(0.78, 0.012, 0.002, x0=0), 0, 0.004, M_BLACK, hud, (CX[0], HY, 0), bevel=False, shadow=False)
bounds = [1] + CHG + [F_END + 1]
for k in range(4):
    card(f'hud_chip{k}', hud, CX[k], HY, 0.15, 0.15, 0, T=0.02, b=0.016, r=0.02, shadow=False)
    on = slab(f'hud_actual{k}', rrect(0.118, 0.118, 0.012), 0.023, 0.026, M_ACC, hud, (CX[k], HY, 0), bevel=False, shadow=False)
    show(on, bounds[k], bounds[k + 1] if k < 3 else None)
    if k < 3:
        done = slab(f'hud_hecho{k}', rrect(0.118, 0.118, 0.012), 0.023, 0.026, M_BLACK, hud, (CX[k], HY, 0), bevel=False, shadow=False)
        show(done, bounds[k + 1])
        seg = slab(f'hud_tramo{k}', rrect(0.11, 0.03, 0.004, x0=0), 0.004, 0.008, M_ACC, hud, (CX[k] + 0.075, HY, 0), bevel=False, shadow=False)
        grow(seg, DW[k][1], DW[k + 1][0] - DW[k][1], index=0)
    lab = (list(TRAMOS) + [''] * 4)[k]
    pl = pill(f'hud_pill{k}', hud, 0.70, HY, 0.66, 0.15, 0, lab, 0.06, shadow=False)
    show(pl, bounds[k], bounds[k + 1] if k < 3 else None)

prefs.keyframe_new_interpolation_type = 'LINEAR'
TILT = math.radians(15)
for f in range(1, F_END + 1):
    st = cam_state(f)
    target = Vector((st.x, st.y, 0.03))
    ox = 0.55 * math.sin(2 * math.pi * (f / F_END) * 1.25 + 0.5)
    pos = Vector((st.x + ox, st.y - st.z * math.tan(TILT), st.z))
    fw = (target - pos).normalized()
    roll = math.radians(1.6) * math.sin(2 * math.pi * f / F_END * 1.0 + 1.0)
    up = Vector((math.sin(roll), math.cos(roll), 0))
    up = (up - fw * up.dot(fw)).normalized()
    rt = fw.cross(up)
    q = Matrix((rt, up, -fw)).transposed().to_quaternion()
    cam.location = pos
    cam.rotation_euler = q.to_euler('XYZ')
    tgt.location = target
    D = (target - pos).length
    hud.location = (0, 0, -D)
    hud.scale = (D / 6, D / 6, D / 6)
    for o, paths in ((cam, ('location', 'rotation_euler')), (tgt, ('location',)), (hud, ('location', 'scale'))):
        for pth in paths:
            o.keyframe_insert(pth, frame=f)

# ------------------------------------------------------------------ render
r = scene.render
for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try:
        r.engine = eng; break
    except Exception:
        pass
r.resolution_x, r.resolution_y, r.resolution_percentage = 1080, 1920, SCALE
r.fps = FPS
scene.frame_start, scene.frame_end = 1, F_END
r.image_settings.file_format = 'PNG'
r.filepath = '//cuadros/f_'
r.film_transparent = False
for vt in ('Standard',):
    try:
        scene.view_settings.view_transform = vt
    except Exception:
        pass
try:
    scene.view_settings.look = 'None'
except Exception:
    pass
ee = scene.eevee
for k, v in (('taa_render_samples', SAMPLES), ('use_shadows', True), ('use_raytracing', False),
             ('use_gtao', True), ('shadow_ray_count', 2), ('shadow_step_count', 6),
             ('use_fast_gi', True), ('bokeh_max_size', 60)):
    try:
        setattr(ee, k, v)
    except Exception as e:
        print('[eevee] sin', k, e)

scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'escena.blend'))
print('[build] listo', os.path.join(OUT, 'escena.blend'))
