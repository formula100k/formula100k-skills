# Uso (terminal, sin abrir Blender):
#   SALIDA=./salida blender -b --python-exit-code 3 -P escena.py -- hero   (también: pose, lapiz, planta, mini)
# Cambia colores, objetos y medidas abajo para tu tema. Render final = PNG con fondo transparente.
import bpy, sys, math, random, bmesh
from mathutils import Vector
V = sys.argv[sys.argv.index('--')+1]
import os
OUT = os.path.abspath(os.environ.get("SALIDA","./salida"))+"/"   # carpeta de salida (se crea sola)
os.makedirs(OUT+"render",exist_ok=True)
sc = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o,do_unlink=True)
def hexc(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: ((c+0.055)/1.055)**2.4 if c>0.04045 else c/12.92
    return (f(r),f(g),f(b),1)
def mat(name,col,rough=.5,metal=0,coat=0.0,sheen=0.0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    b=m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value=hexc(col); b.inputs["Roughness"].default_value=rough
    b.inputs["Metallic"].default_value=metal
    for k,v in (("Coat Weight",coat),("Sheen Weight",sheen)):
        if k in b.inputs: b.inputs[k].default_value=v
    return m
def box(name,c,s,m,bev=.06,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=c,rotation=rot); o=bpy.context.object; o.name=name
    o.scale=(s[0]/2,s[1]/2,s[2]/2); bpy.ops.object.transform_apply(scale=True)
    bv=o.modifiers.new("b","BEVEL"); bv.width=bev; bv.segments=4; bv.limit_method='NONE'
    o.data.materials.append(m); bpy.ops.object.shade_smooth(); return o
def cyl(name,c,r,d,m,rot=(0,0,0),verts=32,bev=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=d,location=c,rotation=rot); o=bpy.context.object; o.name=name
    if bev:
        bv=o.modifiers.new("b","BEVEL"); bv.width=bev; bv.segments=3
    o.data.materials.append(m); bpy.ops.object.shade_smooth(); return o

CORAL=mat("coral","#E0714F",.72,0,0.0,0.0); NEGRO=mat("ojo","#14100C",.35)
GOLD=mat("oro","#F0B24A",.5,0,.25); CREMA=mat("crema","#F3ECDD",.7)
shadow=False; cam_loc=None; cam_t=(0,0,0); rx,ry=1400,1300; lens=70

def claudito(arms=(0,0), off=(0,0,0), scale=1.0, yaw=0):
    # silueta de clawd.svg: x,y en svg -> X=(x-200)/100, Z=(344-y)/100 (pies en z=0)
    g=lambda x,y,w,h,d,yc=0: ((x+w/2-200)/100, yc, (344-(y+h/2))/100)
    parts=[]
    def R(n,x,y,w,h,d,m,bev=.07,rot=(0,0,0),yc=0):
        c=g(x,y,w,h,d); parts.append(box(n,(c[0],yc,c[2]),(w/100,d,h/100),m,bev,rot)); return parts[-1]
    R("cuerpo",72,92,258,184,1.7,CORAL,.13)
    a=R("brazoL",12,153,60,62,.9,CORAL,.09); b=R("brazoR",330,153,60,62,.9,CORAL,.09)
    for o,s,ang in ((a,-1,arms[0]),(b,1,arms[1])):
        sh=Vector((s*1.29,0,1.45))
        o.location=o.location-sh; bpy.context.view_layer.update()
        # rotar alrededor del hombro
        o.rotation_euler=(0,math.radians(ang)*s*-1,0)
        l=o.location.copy(); rm=o.rotation_euler.to_matrix(); o.location=sh+rm@l
    for i,x in enumerate((72,137,232,295)): R(f"pata{i}",x,276,35,68,.9,CORAL,.07)
    for n,x in (("ojoL",107),("ojoR",261)):
        c=g(x,119,34,34,0); o=box(n,(c[0],-.86,c[2]),(.34,.12,.34),NEGRO,.025); parts.append(o)
    root=bpy.data.objects.new("claudito",None); bpy.context.collection.objects.link(root)
    for p in parts: p.parent=root
    root.location=off; root.scale=(scale,)*3; root.rotation_euler=(0,0,math.radians(yaw)); return root

def pencil(off=(0,0,0)):
    L=5.2; r=.6
    body=cyl("cuerpo",(0,0,0),r,L,GOLD,rot=(0,math.pi/2,0),verts=6)
    # eje del lápiz = X
    def along(name,x,rad,d,m,verts=32):
        return cyl(name,(x,0,0),rad,d,m,rot=(0,math.pi/2,0),verts=verts)
    madera=mat("madera","#E9C9A0",.7); grafito=mat("grafito","#2A2622",.4)
    metal=mat("metal","#C9C3B8",.3,1.0); goma=mat("goma","#D8452E",.6)
    # punta cónica
    bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=r*.96,radius2=.1,depth=1.5,location=(L/2+.75,0,0),rotation=(0,math.pi/2,0))
    c=bpy.context.object; c.data.materials.append(madera); bpy.ops.object.shade_smooth()
    bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=.2,radius2=.0,depth=.5,location=(L/2+1.5+.2,0,0),rotation=(0,math.pi/2,0))
    t=bpy.context.object; t.data.materials.append(grafito); bpy.ops.object.shade_smooth()
    along("virola",-L/2-.28,r*.98,.56,metal); along("goma",-L/2-.78,r*.9,.46,goma)
    objs=[o for o in bpy.context.scene.objects if o.type=='MESH']
    root=bpy.data.objects.new("lapiz",None); bpy.context.collection.objects.link(root)
    for o in objs: o.parent=root
    root.location=off; return root

def planta(off=(0,0,0)):
    random.seed(7)
    maceta=mat("maceta","#E9DFC9",.75); tierra=mat("tierra","#4A3426",.9)
    v1=mat("v1","#8FB27E",.65,0,.1,.2); v2=mat("v2","#B9CFA8",.65); v3=mat("v3","#6F9A63",.65); tronco=mat("tronco","#7A5236",.7)
    cyl("maceta",(0,0,.55),1.15,1.1,maceta,verts=48,bev=.05)
    cyl("borde",(0,0,1.15),1.3,.22,maceta,verts=48,bev=.05)
    cyl("tierra",(0,0,1.22),1.1,.1,tierra,verts=48)
    # tronco de cubitos
    s=.3
    path=[(0,0),(0,1),(.3,2),(.3,3),(.0,4),(-.3,5),(-.3,6)]
    for i,(x,z) in enumerate(path): box(f"t{i}",(x*s*1.6,0,1.3+z*s),(s*.9,s*.9,s*1.05),tronco,.04)
    # copa voxel: nubes de cubos
    cx=[(-1.1,2.3),(0.2,2.9),(1.2,2.1),(-.2,3.7)]
    for k,(cxx,czz) in enumerate(cx):
        for i in range(34):
            p=Vector((random.gauss(0,.55),random.gauss(0,.4),random.gauss(0,.38)))
            if p.length>1.15: continue
            q=(cxx*.9+p.x, p.y, 1.3+czz*.7+1.2+p.z)
            q=(round(q[0]/.34)*.34,round(q[1]/.34)*.34,round(q[2]/.34)*.34)
            box(f"h{k}_{i}",q,(.32,.32,.32),random.choice((v1,v2,v3)),.035)
    objs=[o for o in bpy.context.scene.objects if o.type=='MESH']
    root=bpy.data.objects.new("planta",None); bpy.context.collection.objects.link(root)
    for o in objs: o.parent=root
    root.location=off; return root

if V=="hero":      # portada: Claudito de frente-3/4, brazos arriba
    claudito(arms=(22,22),off=(0,0,0),yaw=-30); shadow=False
    cam_loc=(-2.2,-9,5.4); cam_t=(0,0,1.7); rx,ry=1100,1000
elif V=="pose":    # lámina 5: Claudito con los brazos al frente/gesto
    claudito(arms=(-10,38),off=(0,0,0),yaw=30); shadow=False
    cam_loc=(3.0,-9,5.2); cam_t=(0,0,1.7); rx,ry=1100,1000
elif V=="lapiz":
    pencil(); cam_loc=(0,-12,2.2); cam_t=(0.35,0,0); rx,ry=1800,520; lens=34
elif V=="planta":
    planta(); shadow=False; cam_loc=(-2.5,-10,3.8); cam_t=(0,0,3.2); rx,ry=960,1200; lens=48
elif V=="mini":    # Claudito chiquito con lupa-check para capas
    claudito(arms=(10,60),yaw=0); shadow=False; cam_loc=(0,-9,3.2); cam_t=(0,0,1.7); rx,ry=1000,1000

# suelo con shadow catcher
if shadow:
    bpy.ops.mesh.primitive_plane_add(size=40,location=(0,0,0)); f=bpy.context.object; f.is_shadow_catcher=True
# cámara
cd=bpy.data.cameras.new("cam"); cd.lens=lens; co=bpy.data.objects.new("cam",cd); sc.collection.objects.link(co)
co.location=cam_loc; d=Vector(cam_t)-Vector(cam_loc); co.rotation_euler=d.to_track_quat('-Z','Y').to_euler(); sc.camera=co
# luces
def area(name,loc,energy,size,col=(1,1,1)):
    l=bpy.data.lights.new(name,'AREA'); l.energy=energy; l.size=size; l.color=col
    o=bpy.data.objects.new(name,l); sc.collection.objects.link(o); o.location=loc
    dd=Vector(cam_t)-Vector(loc); o.rotation_euler=dd.to_track_quat('-Z','Y').to_euler()
area("key",(-5,-6,8),900,6,(1,.93,.82)); area("fill",(7,-5,3),260,8,(.9,.95,1)); area("rim",(3,6,6),500,5,(1,.9,.75))
w=bpy.data.worlds.new("w"); sc.world=w; w.use_nodes=True
bg=w.node_tree.nodes["Background"]; bg.inputs[0].default_value=(.95,.92,.88,1); bg.inputs[1].default_value=.8
# render
sc.render.engine='CYCLES'; 
# GPU: Metal en Mac; en otros sistemas OptiX/CUDA/HIP. Si no hay GPU cae al procesador (más lento).
try:
    p=bpy.context.preferences.addons['cycles'].preferences
    for t in (['METAL'] if sys.platform=='darwin' else ['OPTIX','CUDA','HIP','ONEAPI']):
        try:
            p.compute_device_type=t; p.get_devices()
            for d in p.devices: d.use = d.type!='CPU'
            if any(d.use for d in p.devices): break
        except Exception: pass
except Exception: pass
sc.cycles.device='GPU'; sc.cycles.samples=40; sc.cycles.use_denoising=True
sc.render.film_transparent=True; # resolución: ≥1600 px en el lado largo del objeto en pantalla (sube RES_X para el hero/pose)
K=float(os.environ.get('ESCALA','1.5')); rx,ry=int(rx*K),int(ry*K)
sc.render.resolution_x=rx; sc.render.resolution_y=ry; sc.render.resolution_percentage=100
sc.view_settings.view_transform='Standard'
sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
sc.render.filepath=OUT+f"render/{V}.png"
bpy.ops.wm.save_as_mainfile(filepath=OUT+f"{V}.blend")  # opcional; bórralo si no quieres el .blend
bpy.ops.render.render(write_still=True)
print("LISTO",V)
