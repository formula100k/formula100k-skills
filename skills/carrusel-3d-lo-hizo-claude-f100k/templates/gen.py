# Carrusel 3D «lo hizo Claude» — plantilla genérica.
# Uso: python3 gen.py   (lee img/, escribe carrusel.html en esta carpeta)
# 1) Edita SOLO la sección de textos. 2) Pon tus renders y capturas en img/. 3) Exporta (ver SKILL.md).
import os
# ---------- TEXTOS EDITABLES ----------
TEMA_PILL    = "PROCESO REAL"
TITULO_INTRO = "mira este carrusel"
TITULO_1     = "HECHO 100%"              # línea grande en acento
TITULO_2     = "CON CLAUDE"              # línea grande en tinta
DESLIZA      = "DESLIZA PARA VER →"
CAPAS_TITULO = ("La portada la armó", "Claude por capas,", "y se puede editar.")
CAPAS_NOMBRES= ["el papel","el título","los bloques","Claudito","los detalles"]
CAPAS_PIE    = "Cada capa va por separado: la tuya, a tu gusto."
SIN_APP      = ("No usé","Photoshop","para nada, ni","Canva","ni otro editor.")
ESTILO       = ("Puedo replicar","cualquier estilo,","y hacerlo para ti o tus clientes.")
ADEMAS       = ("Además de","hacerlo,","Claude también:")
PASTILLAS    = ["crear el contenido","revisarlo","hacer el diseño","y dejarlo listo para publicar"]  # la última va en acento
CTA_PREGUNTA = ("¿Quieres aprender","y aplicarlo en tu perfil y en el de tus clientes?")
CTA_PALABRA  = "CARRUSEL"                # ligada al tema; nunca «YO»
CTA_REMATE   = "Y MIRA TU DIRECT →"
FIRMA        = ""                        # tu @ (opcional); vacío = no sale
# ---------- COLORES (pon los de tu brandkit) ----------
PAPEL, PAPEL2, TINTA, GRIS, ACENTO, ROJO, ROSA = "#F3ECDD","#E9DFC9","#1A1612","#7A7064","#F0B24A","#D8452E","#F3B6C4"
# ---------- IMÁGENES en img/ (si falta una sale un marcador punteado) ----------
IMG_HERO, IMG_OBJETO, IMG_POSE, IMG_CIERRE = "hero.png","lapiz.png","pose.png","planta.png"
TABLETS = ["tab-a.jpg","tab-b.jpg","tab-c.jpg"]   # TUS diseños reales: izquierda, centro, derecha
# --------------------------------------------------

def IM(f, style, cls="sombra"):
    if os.path.exists(os.path.join("img", f)):
        return f'<img class="abs {cls}" src="img/{f}" style="{style}">'
    return f'<div class="abs vacio" style="{style}">pon img/{f}</div>'

CSS = f"""
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Zilla+Slab:ital,wght@0,400;0,700;1,400&display=swap');
:root{{--papel:{PAPEL};--papel2:{PAPEL2};--tinta:{TINTA};--gris:{GRIS};--oro:{ACENTO};--rojo:{ROJO};--rosa:{ROSA}}}
*{{box-sizing:border-box;margin:0;padding:0}} body{{background:#777}}
.slide{{width:1080px;height:1350px;position:relative;overflow:hidden;background:var(--papel);color:var(--tinta);font-family:'Zilla Slab',serif}}
.grid{{position:absolute;inset:0;background-image:linear-gradient(rgba(26,22,18,.075) 1.5px,transparent 1.5px),linear-gradient(90deg,rgba(26,22,18,.075) 1.5px,transparent 1.5px);background-size:54px 54px}}
.guia{{position:absolute;left:150px;top:370px;width:780px;height:780px;border-radius:50%;border:2px solid rgba(26,22,18,.13)}}
.abs{{position:absolute}} .d{{font-family:'Dela Gothic One',sans-serif;font-weight:400}}
.pill{{position:absolute;left:50%;transform:translateX(-50%);border:2.5px solid var(--tinta);border-radius:40px;padding:10px 30px;font-size:30px;letter-spacing:.12em;white-space:nowrap;background:var(--papel)}}
.contador{{position:absolute;left:50%;top:56px;transform:translateX(-50%);font-size:30px;letter-spacing:.18em;border:2.5px solid var(--tinta);border-radius:40px;padding:8px 28px;background:var(--papel)}}
.handle{{position:absolute;left:0;right:0;bottom:40px;text-align:center;font-size:28px;letter-spacing:.08em;color:var(--gris)}}
.petalo{{position:absolute;border-radius:60% 40% 60% 40%;filter:blur(7px)}}
.tex{{background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/><feColorMatrix values='0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0.22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}}
.tablet{{position:absolute;background:#15110d;border-radius:46px;padding:18px;box-shadow:0 30px 50px rgba(26,22,18,.35),0 4px 8px rgba(26,22,18,.3)}}
.tablet .pant{{width:100%;height:100%;border-radius:30px;overflow:hidden;position:relative;background:var(--papel)}}
.tablet img{{width:100%;height:100%;object-fit:cover;object-position:top;display:block}}
.sombra{{filter:drop-shadow(0 26px 24px rgba(26,22,18,.34))}}
.vacio{{border:3px dashed var(--gris);border-radius:24px;display:flex;align-items:center;justify-content:center;color:var(--gris);font-size:30px;text-align:center;min-height:200px;background:rgba(255,255,255,.4)}}
.frase{{position:absolute;left:80px;right:80px;font-size:68px;line-height:1.1;letter-spacing:-.01em}}
.frase b{{font-weight:700}} .oro{{color:var(--oro)}} .gris{{color:var(--gris)}}
.num{{display:inline-flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:50%;background:var(--oro);color:var(--tinta);font-family:'Dela Gothic One';font-size:38px;border:2.5px solid var(--tinta);flex:none}}
"""
def petalos():
    P=[(40,80,46,30,'--rosa',-20),(130,40,30,20,'--oro',30),(900,60,52,34,'--rosa',40),(985,160,34,22,'--oro',-10),(60,1090,60,38,'--oro',20),(960,1060,56,36,'--rosa',-30),(130,1210,34,22,'--rosa',10),(870,1250,40,26,'--oro',60)]
    return "".join(f'<div class="petalo" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;background:var({c});transform:rotate({r}deg);opacity:.85"></div>' for x,y,w,h,c,r in P)
def L_papel(): return '<div class="grid"></div><div class="guia"></div>'
def L_titulo(): return f'''<div class="pill" style="top:76px">{TEMA_PILL}</div>
<div class="abs" style="left:0;right:0;top:165px;text-align:center;font-size:50px;color:var(--gris)">{TITULO_INTRO}</div>
<div class="abs d fit" style="left:60px;right:60px;top:245px;text-align:center;font-size:132px;line-height:1.08;color:var(--oro)">{TITULO_1}</div>
<div class="abs d fit" style="left:60px;right:60px;top:395px;text-align:center;font-size:132px;line-height:1.08;color:var(--tinta)">{TITULO_2}</div>'''
def L_bloques(): return '''<div class="abs tex" style="left:170px;top:900px;width:560px;height:380px;border-radius:64px;background-color:var(--oro)"></div>
<div class="abs tex" style="left:690px;top:960px;width:250px;height:250px;border-radius:34px;background-color:var(--papel2);border:3px solid var(--tinta);transform:rotate(7deg)"></div>'''+petalos()
def L_claudito(): return IM(IMG_HERO,"left:230px;top:790px;width:640px")
def L_detalles():
    firma = f'<div class="abs" style="left:-176px;top:640px;width:420px;transform:rotate(-90deg);text-align:center;font-size:26px;letter-spacing:.2em;color:var(--gris)">{FIRMA.upper()}</div>' if FIRMA else ''
    return f'<div class="abs" style="left:0;right:0;top:690px;text-align:center;font-size:32px;letter-spacing:.34em;color:var(--tinta)">{DESLIZA}</div>'+firma
LAYERS=[L_papel,L_titulo,L_bloques,L_claudito,L_detalles]
def cover(): return "".join(f() for f in LAYERS)

def tablet_cover(x,y,w,h,rot=0,extra=""):
    s=(w-36)/1080
    return f'<div class="tablet" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;transform:rotate({rot}deg);{extra}"><div class="pant"><div style="width:1080px;height:1350px;transform:scale({s});transform-origin:0 0;position:relative;background:var(--papel)">{cover()}</div></div></div>'
def tablet_img(x,y,w,h,img,rot=0,extra=""):
    ok=os.path.exists(os.path.join("img",img))
    cont=f'<img src="img/{img}">' if ok else f'<div class="vacio" style="height:100%;border-radius:0;border:none">pon tu diseño en img/{img}</div>'
    return f'<div class="tablet" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;transform:rotate({rot}deg);{extra}"><div class="pant">{cont}</div></div>'
def base(inner,n=None):
    c=f'<div class="contador">{n:02d} / 06</div>' if n else ''
    f=f'<div class="handle">{FIRMA}</div>' if FIRMA else ''
    return f'<section class="slide"><div class="grid"></div>{c}{inner}{f}</section>'

S=[]
# 1 portada
S.append(f'<section class="slide">{cover()}</section>')
# 2 capas explotadas
cl=[]
for i,f in enumerate(LAYERS):
    bg='background:rgba(243,236,221,.96)' if i==0 else 'background:rgba(255,255,255,.10)'
    cl.append(f'<div class="cap" style="transform:translateZ({i*115}px) scale(.44);{bg}">{f()}</div>')
stack=f'''<style>.pila{{position:absolute;left:40px;top:330px;width:1000px;height:800px;perspective:2600px}}
.rot{{position:absolute;left:80px;top:-70px;width:1080px;height:1350px;transform-style:preserve-3d;transform:rotateX(62deg) rotateZ(-40deg)}}
.cap{{position:absolute;left:0;top:0;width:1080px;height:1350px;border:7px solid rgba(255,255,255,.95);outline:3px solid rgba(26,22,18,.35);border-radius:22px;overflow:hidden;box-shadow:0 0 0 2px rgba(26,22,18,.2);transform-origin:50% 50%}}
.rot .grid{{background-size:54px 54px}}</style>
<div class="pila"><div class="rot">{"".join(cl)}</div></div>'''
etq=""
for (x,y),n,t in zip([(70,1030),(70,885),(70,740),(70,595),(70,450)],range(1,6),CAPAS_NOMBRES):
    etq+=f'<div class="abs" style="left:{x}px;top:{y}px;display:flex;align-items:center;gap:18px;font-size:40px"><span class="num">{n}</span>{t}</div>'
a,b,c=CAPAS_TITULO
S.append(base(f'''<div class="frase" style="top:150px"><span class="gris">{a}</span><br><b>{b}</b><br><span class="oro">{c}</span></div>{stack}{etq}
<div class="abs" style="left:80px;right:80px;bottom:100px;font-size:34px;color:var(--gris);text-align:center;font-style:italic">{CAPAS_PIE}</div>''',2))
# 3 sin editor
a,b,c,d,e=SIN_APP
S.append(base(f'''<div class="frase" style="top:150px"><span class="gris">{a}</span> <b>{b}</b><br><span class="gris">{c}</span> <span class="oro"><b>{d}</b></span><br><span class="gris">{e}</span></div>
{tablet_cover(250,520,580,740,-4)}
{IM(IMG_OBJETO,"left:-120px;top:640px;width:1300px;transform:rotate(-38deg)")}''',3))
# 4 cualquier estilo
a,b,c=ESTILO
S.append(base(f'''<div class="frase" style="top:300px"><b>{a}</b> <span class="oro"><b>{b}</b></span><br><span class="gris">{c}</span></div>
{IM(IMG_OBJETO,"left:130px;top:140px;width:820px;transform:rotate(-6deg)")}
{tablet_img(60,760,360,470,TABLETS[0],-9)}{tablet_img(660,760,360,470,TABLETS[2],9)}{tablet_img(370,720,380,490,TABLETS[1],0,'z-index:3')}''',4))
# 5 además
ph=""
for i,t in enumerate(PASTILLAS):
    h = i==len(PASTILLAS)-1
    bg='background:var(--oro)' if h else 'background:#fff'
    ph+=f'<div class="abs" style="left:80px;top:{330+i*135}px;display:flex;align-items:center;gap:22px;{bg};border:3px solid var(--tinta);border-radius:70px;padding:14px 40px 14px 16px;font-size:46px;box-shadow:6px 6px 0 var(--tinta)"><span class="num" style="{"background:var(--tinta);color:var(--oro)" if h else ""}">{i+1}</span>{t}</div>'
a,b,c=ADEMAS
S.append(base(f'''<div class="frase" style="top:150px"><span class="gris">{a}</span> <b>{b}</b><br><span class="gris">{c}</span></div>{ph}
{IM(IMG_POSE,"left:430px;top:870px;width:560px")}''',5))
# 6 cierre
a,b=CTA_PREGUNTA
S.append(base(f'''<div class="frase" style="top:130px;font-size:62px"><b>{a}</b> <span class="gris">{b}</span></div>
<div class="abs d fit" style="left:70px;right:70px;top:400px;font-size:190px;line-height:1.05;color:var(--tinta)">COMENTA</div>
<div class="abs d fit" style="left:70px;right:70px;top:600px;font-size:190px;line-height:1.05;color:var(--oro)">{CTA_PALABRA}</div>
<div class="abs" style="left:80px;top:830px;font-size:40px;letter-spacing:.2em">{CTA_REMATE}</div>
{IM(IMG_CIERRE,"left:590px;top:780px;width:500px")}''',6))
# autoajuste de títulos grandes (.fit): ninguno se desborda
FIT="<script>document.fonts.ready.then(()=>{document.querySelectorAll('.fit').forEach(e=>{let f=parseFloat(getComputedStyle(e).fontSize),i=0;e.style.whiteSpace='nowrap';while(e.scrollWidth>e.clientWidth&&i++<40){f*=.97;e.style.fontSize=f+'px'}})})</script>"
html=f'<!doctype html><html><head><meta charset="utf-8"><title>Lo hizo Claude</title><style>{CSS}</style></head><body>'+"\n".join(S)+FIT+'</body></html>'
open("carrusel.html","w",encoding="utf-8").write(html)
print("carrusel.html listo (6 láminas)")
