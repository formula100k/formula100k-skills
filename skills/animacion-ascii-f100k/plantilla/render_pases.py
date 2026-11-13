# render_pases.py · saca los dos pases que alimentan la grilla ASCII: luz (beauty) y profundidad.
# Uso: blender -b escena.blend -P render_pases.py -- [cuadros sueltos: 1,80,150 | nada = toda la animación]
# Escribe pases/luz/0001.png… y pases/prof/0001.png… junto a escena.blend (360×640, EEVEE, unos 2 min los 300 cuadros).
import bpy, os, sys
AQUI = os.path.dirname(bpy.data.filepath)
arg = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
cuadros = [int(x) for x in arg[0].split(",")] if arg else None
sc = bpy.context.scene; vl = sc.view_layers[0]
for pase in ("luz", "prof"):
    vl.material_override = bpy.data.materials["PASE_PROFUNDIDAD"] if pase == "prof" else None
    try: sc.eevee.taa_render_samples = 6 if pase == "prof" else 16
    except Exception: pass
    base = os.path.join(AQUI, "pases", pase, "")
    if cuadros:
        for f in cuadros:
            sc.frame_set(f); sc.render.filepath = base + "%04d" % f
            bpy.ops.render.render(write_still=True)
    else:
        sc.render.filepath = base
        bpy.ops.render.render(animation=True)
