# EJEMPLO de plan (un video de noticias: «Todo lo que dijo el jefe de Instagram en una entrevista»).
# Cópialo a DEST/_remotion/plan.py y reescribe las secciones de abajo con las frases de TU video:
# las funciones (find, O, papel, word, lst, photo, add) y el final del archivo se quedan igual.
# Ancla cada apoyo a una frase del corte (public/words.json), mete los clips de la fuente
# y escribe public/plan.json con la línea de tiempo final.
# uso: uv run --no-project --python 3.12 python -X utf8 plan.py
import json, re, unicodedata
from pathlib import Path

ROOT = Path(__file__).parent
W = json.load(open(ROOT / "public/words.json", encoding="utf-8"))
EDL = json.load(open(ROOT / "../corte/edl.json", encoding="utf-8"))
CUT_DUR = EDL[-1]["newEnd"]


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9%]", "", "".join(c for c in s if unicodedata.category(c) != "Mn"))


NW = [norm(w["w"]) for w in W]


def find(phrase, after=0.0, end=False):
    """Inicio (o fin) de la primera aparición de `phrase` después de `after` (tiempo del corte)."""
    p = [norm(x) for x in phrase.split()]
    for i in range(len(W)):
        if W[i]["s"] < after - 0.01:
            continue
        if all(i + k < len(W) and NW[i + k] == p[k] for k in range(len(p))):
            return W[i + len(p) - 1]["e"] if end else W[i]["s"]
    raise SystemExit(f"no encontré: «{phrase}» después de {after}")


# ------------------------------------------------------------------ inserciones (en tiempo del corte)
CLIPS = {  # duración en s de public/clips/*.mp4
    "a_riesgo": 3.15, "b1_2024": 8.45, "b2_cambio": 1.23, "b3_mundo": 8.0, "b4_youtube": 9.85,
    "c_cuenta": 4.4, "d_envios": 4.22, "f_ia": 4.9, "g_6meses": 2.9,
}
noticia2_fin = find("podemos hacer en instagram", end=True) + 0.08
INS = [  # (tiempo del corte, lista de piezas)
    (find("al corriente", end=True) + 0.05, [("clip", "a_riesgo")]),
    (find("captura de pantalla", end=True) + 0.08, [("hold", "estructura", 3.2)]),
    (noticia2_fin + 0.02, [("hold", "titulo_n2", 2.8), ("clip", "b1_2024"), ("clip", "b2_cambio"), ("clip", "b3_mundo"), ("clip", "b4_youtube")]),
    (find("cuestion de dias", end=True) + 0.08, [("clip", "c_cuenta")]),
    (find("son los envios", end=True) + 0.08, [("clip", "d_envios")]),
    (find("crece mes tras mes", end=True) + 0.08, [("clip", "f_ia")]),
    (find("vaya a funcionar", end=True) + 0.08, [("clip", "g_6meses")]),
]

# segmentos de la salida: ('a', ini_corte, fin_corte) | ('clip', nombre, dur) | ('hold', escena, dur)
segs, cur = [], 0.0
for t, pieces in sorted(INS):
    segs.append(["a", cur, t])
    for p in pieces:
        segs.append(["clip", p[1], CLIPS[p[1]]] if p[0] == "clip" else ["hold", p[1], p[2]])
    cur = t
segs.append(["a", cur, CUT_DUR])

# tiempos de salida de cada segmento
out, T = [], 0.0
for s in segs:
    d = s[2] - s[1] if s[0] == "a" else s[2]
    out.append({"kind": s[0], "src": s[1] if s[0] != "a" else None, "a": s[1] if s[0] == "a" else None, "s": round(T, 3), "e": round(T + d, 3)})
    T += d
TOTAL = T


def O(tc):
    """tiempo del corte → tiempo de salida"""
    for o in out:
        if o["kind"] == "a" and o["a"] - 1e-6 <= tc < o["a"] + (o["e"] - o["s"]) - 0.02:
            return round(o["s"] + tc - o["a"], 3)
    last = [o for o in out if o["kind"] == "a"][-1]
    if tc <= last["a"] + (last["e"] - last["s"]) + 1.5:
        return round(min(last["s"] + tc - last["a"], last["e"]), 3)
    raise SystemExit(f"tiempo fuera de rango {tc}")


def seg_of(kind, src):
    return next(o for o in out if o["kind"] == kind and o["src"] == src)


# ------------------------------------------------------------------ apoyos (anclados en tiempo del corte)
items = []


def tO(phrase, after=0.0, end=False):
    return O(find(phrase, after, end))


def add(kind, phrase=None, dur=3.2, after=0.0, at=None, **kw):
    tc = at if at is not None else find(phrase, after)
    s = O(tc)
    items.append({"kind": kind, "s": s, "e": round(s + dur, 3), **kw})
    return tc


def word(phrase, small, big, dur=3.0, side="L", color="white", after=0.0):
    return add("word", phrase, dur, after, small=small, big=big, side=side, color=color)


def photo(phrase, src, cap, dur=3.4, side="R", after=0.0, phone=False):
    return add("photo", phrase, dur, after, src=src, cap=cap, side=side, phone=phone)


def papel(phrase, until, lines, cards=(), layout="L", after=0.0, extra=0.35):
    """Escena de papel cuadriculado a pantalla completa (estilo notitas).
    lines: (texto, tamaño, frase que lo dispara | None = al entrar). ~palabra = clave en azul.
    cards: dict(src, at=frase, w, circle=(cx, cy, rx, ry) relativo a la captura, circleAt=frase)."""
    t0 = find(phrase, after)
    s = O(t0)
    e = (tO(until, t0, end=True) + extra) if isinstance(until, str) else s + until
    L = [{"txt": t, "size": z, "t": s if f is None else tO(f, t0)} for t, z, f in lines]
    C = []
    for c in cards:
        c = dict(c)
        c["t"] = s if c.get("at") is None else tO(c.pop("at"), t0)
        c.pop("at", None)
        if c.get("circleAt"):
            c["circleT"] = tO(c.pop("circleAt"), t0)
        C.append(c)
    items.append({"kind": "papel", "s": s, "e": round(e, 3), "layout": layout, "lines": L, "cards": C})
    return t0


def lst(phrase, title, rows, dur, side="L", after=0.0):
    t0 = find(phrase, after)
    ts = [O(find(p, t0)) for _, p in rows]
    return add("list", at=t0, dur=dur, title=title, rows=[r for r, _ in rows], ts=ts, side=side)


# gancho: palabras con la voz (Hormozi) + manuscrita subrayada (Cristofari)
items.append({"kind": "hook", "s": 0.0, "e": round(tO("al corriente", end=True) + 0.05, 3),
              "lines": [
                  {"t": "grot", "w": [["INSTAGRAM", 0.0], ["VA", tO("esta a punto")], ["A", tO("a punto")], ["CAMBIAR", tO("de cambiar")]]},
                  {"t": "script", "w": [["por completo", tO("por completo")]], "under": True},
                  {"t": "grot", "w": [["EN", tO("para 2027")], ["2027", tO("2027")]], "accent": True},
              ],
              "line2": {"at": tO("tienes que aprovechar"), "small": "aprovecha estos", "script": "últimos meses"}})

# intro
papel("el ceo de instagram", "colin y samir", [("el jefe de", 70, None), ("~Instagram", 150, "de instagram"), ("habló 1 hora", 70, "ha dado una")],
      [dict(src="img/mosseri_portada.jpg", at="adam", w=820)])
papel("la entrevista la dio", "duenos de negocios", [("26 de octubre", 70, None), ("~1 hora", 170, "una hora completa"), ("con todos los cambios", 64, "todos los cambios")],
      [dict(src="img/estudio.jpg", at=None, w=820)], layout="R")

# noticia 1 · videos largos
papel("y es que instagram va", "videos largos", [("Instagram va a permitir", 70, None), ("videos ~largos", 150, "los videos largos")],
      [dict(src="web/bing_ig_largos_c.png", at=None, w=760, circle=(0.42, 0.335, 0.45, 0.085), circleAt="videos largos")])
papel("este cambio ya lo vimos", "transformo por completo", [("ya pasó en", 70, None), ("~TikTok", 170, "con tiktok")],
      [dict(src="web/bing_tiktok_largos_c.png", at="con tiktok", w=820, circle=(0.45, 0.07, 0.48, 0.06), circleAt="incluso tengo")], layout="R")
word("buscan que permanezcas", "lo que quieren", "MÁS TIEMPO", 3.0, side="L", color="yellow")
word("era la unica red", "se quedaba", "ATRÁS", 2.4, side="R", color="red")
lst("los videos largos no solamente", "Un video largo:", [("te escuchan más", "te escuchen"), ("confían más", "que confien mas"), ("te conocen más", "que conozcan")], 5.6, side="L")
papel("sino que tambien te permite", "un solo video", [("muestras tu", 70, None), ("~método", 170, "tu metodologia"), ("completo, en 1 video", 64, "en un solo video")],
      [dict(src="img/video_largo.jpg", at="tu metodologia", w=820)], layout="R")
word("de esta manera una persona", "de verte 1 vez a", "COMPRARTE", 4.0, side="L", color="yellow")
papel("es por eso que historicamente", "o tiktok", [("los videos de", 70, None), ("~YouTube", 150, "de youtube"), ("venden más", 110, "posibilidad de conversion")],
      [dict(src="web/logo_youtube.svg", at="de youtube", w=520, plain=True)])
word("pero algo tambien muy", "primero en TikTok", "VLOGS", 2.6, side="R")
word("que duraban 3", "reviews de", "3–5 MIN", 3.0, side="L", color="yellow")
word("ayudaban a crecer", "los videos largos", "LAS HICIERON CRECER", 3.0, side="R", color="yellow")
lst("un buen gancho", "Estructura de un video largo", [("1 · un buen gancho", "un buen gancho"), ("2 · inicio", "inicio"), ("3 · problema", "problema"), ("4 · payoff = el valor", "payoff es"), ("+ ganchos entre cada parte", "tienes que agregar ganchos")], 20.0, side="L")
_tc = find("la estructura se ve")
_hold = seg_of("hold", "estructura")
add("estructura", at=_tc, dur=_hold["e"] - O(_tc))
papel("una opcion para poner", "tu televisor", [("Instagram en tu", 70, None), ("~televisor", 160, "tu televisor")],
      [dict(src="web/bing_mosseri_tv_c.png", at=None, w=760, circle=(0.35, 0.08, 0.40, 0.07), circleAt="tu televisor")])
papel("y es que actualmente", "pantalla grande", [("en la tele ya se ve", 70, None), ("~Netflix", 140, "netflix"), ("y ~YouTube", 140, "muchisimo youtube")],
      [dict(src="web/logo_netflix.svg", at="netflix", w=420, plain=True), dict(src="web/logo_youtube.svg", at="muchisimo youtube", w=420, plain=True)], layout="R")
photo("ya sea videos de viajes", "img/tele.jpg", "Instagram en la tele · el mockup que mostraron", 4.4, side="L")
papel("lo que mas me impresiona", "podemos hacer en instagram", [("ahora sí vas a poner", 70, None), ("~miniaturas", 160, "poner miniaturas"), ("a tus videos largos", 64, "para los videos largos")],
      [dict(src="img/subir.jpg", at="poner miniaturas", w=860)], extra=0.0)

# noticia 3 · podcast
word("apagas tu celular", "apagas el celular y", "SIGUES ESCUCHANDO", 3.4, side="R", color="yellow")
word("lanzando series", "lanza", "SERIES", 3.0, side="L")
word("sin necesidad de ver", "que se entiendan", "SIN VER", 2.6, side="R")
word("recuperar la capacidad", "recuperamos la", "ATENCIÓN", 3.6, side="L", color="yellow")

# noticia 4 · dinero
word("por fin instagram", "por fin", "TE PAGAN", 2.6, side="R", color="yellow")
papel("asi como lo hacen", "con youtube", [("como ya pagan", 70, None), ("~Facebook", 120, "facebook"), ("~YouTube", 120, "youtube y"), ("y ~TikTok", 120, "y tiktok"), ("anuncios al inicio y a la mitad", 56, "poner anuncios")],
      [dict(src="img/mosseri_dinero.jpg", at="poner anuncios", w=780)], layout="L")
word("pagarte por", "te pagan por", "VISTAS", 2.6, side="R", color="yellow")

# noticia 5 · cuentas nuevas
word("porque yo se que", "si todavía no", "PUBLICAS", 2.8, side="L", color="red")
papel("una cuenta con cero", "cuestion de dias", [("una cuenta con", 90, None), ("~0 seguidores", 230, "cero seguidores"), ("→ 1 millón de vistas", 120, "al millon")], [], layout="C")
word("crecer en instagram nunca", "crecer nunca fue", "TAN FÁCIL", 2.6, side="R")

# noticia 6 · envíos
lst("no son los me gustas", "La métrica que te hace crecer", [("~~me gusta~~", "no son los me gustas"), ("~~comentarios~~", "no son los comentarios"), ("ENVÍOS", "son los envios")], 3.2, side="R")
papel("y oh sorpresa", "otro video", [("lo confirma", 64, None), ("~The Social Reckoning", 110, "social reckoning"), ("Facebook, denunciado en ~2021", 70, "denunciado en 2021")],
      [dict(src="img/bh_titulo.jpg", at="social reckoning", w=600), dict(src="web/wiki_haugen_c.png", at="denunciado en 2021", w=600)], layout="L")
add("chain", "basicamente las plataformas", 13.0, side="R")
word("y luego ese amigo", "un envío =", "MÁS ALCANCE", 2.6, side="L", color="yellow")

# noticia 7 · carruseles
papel("no solamente porque aparecen", "en el feed", [("los carruseles salen en", 64, None), ("~Explorar", 140, "seccion explorar"), ("y 2 o 3 veces en el feed", 70, "dos o tres veces")],
      [dict(src="img/carrusel_publish.jpg", at=None, w=440, phone=True)], layout="L")
word("cuando una persona ve tu reel", "el reel, si lo pasan,", "NO VUELVE", 3.4, side="R", color="red")
add("slides", "en cambio los carruseles", 6.0, tSecond=tO("el segundo slide"))
add("slides2", "que tu primer slide", 7.0, tSecond=tO("y el segundo sea"))

# noticia 8 · funciones
papel("como canales de difusion", "las notas", [("funciones olvidadas", 64, None), ("~canales de difusión", 100, "canales de difusion"), ("mejores amigos", 100, "mejores amigos"), ("notas", 100, "las notas")],
      [dict(src="img/perfil_mosseri.jpg", at=None, w=440, phone=True)], layout="L")
lst("en lo mas importante", "Céntrate en:", [("carruseles", "carruseles reels"), ("reels", "reels y ahora"), ("videos largos", "los videos largos")], 4.4, side="R")

# noticia 9 · IA
papel("los personajes con", "contenido original", [("personajes con IA", 70, None), ("rankean ~igual", 150, "rankean igual")],
      [dict(src="img/ia_personaje.jpg", at=None, w=440, phone=True)], layout="L")
word("esto es hiperpolemico", "para muchos es", "POLÉMICO", 2.6, side="R", color="red")
word("la inteligencia artificial esta", "la IA está", "CAMBIANDO EL MUNDO", 3.2, side="L")
papel("solamente miren las", "funcionando", [("solo mira las", 70, None), ("~frutinovelas", 150, "frutinovelas")],
      [dict(src="web/bing_frutinovelas_c.png", at="frutinovelas", w=1000), dict(src="web/bing_frutinovelas_news_c.png", at="la cantidad de vistas", w=640, circle=(0.45, 0.28, 0.48, 0.08), circleAt="la cantidad de vistas")], layout="C")
word("lo unico que se penaliza", "lo que castigan:", "COPIAR AL 100 %", 4.0, side="L", color="red")
photo("se busca que sea", "img/algoritmo.jpg", "«Tu algoritmo», la pantalla que revisaron en vivo", 3.6, side="R")

# noticia 10 · rechazo a la IA
word("pero no tanto", "no es el contenido, es la", "OPINIÓN PÚBLICA", 3.4, side="R")
word("de la boca para afuera", "de la boca", "PARA AFUERA", 3.0, side="L", color="red")
word("esta es una opinion", "esa opinión va a", "SEGUIR CRECIENDO", 3.0, side="R")
word("porque los numeros", "los números dicen", "OTRA COSA", 2.8, side="L", color="yellow")
papel("y algo que si", "vaya a funcionar", [("lo que funciona hoy", 70, None), ("en ~6 meses", 160, "seis meses"), ("puede dejar de funcionar", 64, "vaya a funcionar")],
      [dict(src="img/carrusel_mosseri.jpg", at=None, w=440, phone=True)], layout="L")

# cierre
word("entonces es super necesario", "actualízate", "SIEMPRE", 3.2, side="L", color="yellow")
word("no consumas contenido", "consume", "ESTRATÉGICO", 3.2, side="R")
word("no como un lugar", "Instagram", "TRABAJA PARA TI", 4.0, side="L", color="yellow")
add("three", "tres cosas que", 21.0, side="L", t1=tO("numero uno"), t2=tO("numero dos"), t3=tO("numero tres"))
word("metete con todo", "métete con", "TODO", 2.4, side="R", color="red")
word("le da mas apoyo", "Instagram empuja lo", "NUEVO", 3.2, side="R", color="yellow")

# relleno
word("que siempre hagas", "haz siempre tu", "INVESTIGACIÓN", 3.0, side="R")
word("y por supuesto si quieres", "mantente", "ACTUALIZADA", 3.4, side="R", color="yellow")
word("los mejores sistemas", "los mejores", "SISTEMAS CON IA", 3.6, side="L")
word("es mas o menos lo que pasa", "igual que en", "YOUTUBE", 2.4, side="R")
word("su vida diaria", "contenido de", "SU DÍA A DÍA", 2.6, side="L")

# títulos grandes por noticia
TITLES = [
    ("Noticia 01", "INSTAGRAM ACEPTA", "videos largos", "empezamos con lo"),
    ("Noticia 03", "INSTAGRAM COMO", "un podcast", "la tercera noticia"),
    ("Noticia 04", "POR FIN", "te pagan", "la noticia numero 4"),
    ("Noticia 05", "CUENTAS NUEVAS,", "millones de vistas", "la noticia numero 5"),
    ("Noticia 06", "LA MÉTRICA QUE TE HACE", "crecer", "la noticia numero 6"),
    ("Noticia 07", "LOS CARRUSELES", "tienen su momento", "la noticia numero 7"),
    ("Noticia 08", "FUNCIONES", "olvidadas", "la noticia numero 8"),
    ("Noticia 09", "CONTENIDO HECHO CON", "inteligencia artificial", "noticia numero 9"),
    ("Noticia 10", "EL RECHAZO A LA IA", "crece mes a mes", "la noticia numero 10"),
    ("Lo que haces tú", "3 COSAS PARA", "hoy", "tres cosas que"),
]
for kick, main, scr, ph in TITLES:
    s0 = tO(ph)
    items.append({"kind": "title", "s": s0, "e": round(s0 + 3.0, 3), "kick": kick, "main": main, "script": scr})
_n2 = seg_of("hold", "titulo_n2")
items.append({"kind": "title", "s": _n2["s"], "e": _n2["e"], "kick": "Noticia 02", "main": "¿POR QUÉ CAMBIÓ", "script": "de opinión?", "solid": True})

# lo que va a un costado se corta cuando entra algo a pantalla completa
FULLK = {"full", "hook", "slides", "slides2", "estructura", "title", "papel"}
blocks = [(i["s"], i["e"]) for i in items if i["kind"] in FULLK] + [(o["s"], o["e"]) for o in out if o["kind"] != "a"]
for i in items:
    if i["kind"] in FULLK:
        continue
    for bs, be in blocks:
        if i["s"] < bs < i["e"]:
            i["e"] = round(bs, 3)
    for bs, be in blocks:
        if bs <= i["s"] < be:
            i["s"] = round(be, 3)
items = [i for i in items if i["e"] - i["s"] >= 1.0]
for i in items:  # pantallas completas que se pisan: la siguiente manda
    if i["kind"] in FULLK:
        for bs, be in blocks:
            if i["s"] < bs < i["e"]:
                i["e"] = round(bs, 3)

# ------------------------------------------------------------------ chapter tags
chapters = [
    ("Noticia 1 · videos largos", "empezamos con lo"),
    ("Noticia 3 · podcast", "la tercera noticia"),
    ("Noticia 4 · dinero", "la noticia numero 4"),
    ("Noticia 5 · cuentas nuevas", "la noticia numero 5"),
    ("Noticia 6 · envíos", "la noticia numero 6"),
    ("Noticia 7 · carruseles", "la noticia numero 7"),
    ("Noticia 8 · funciones", "la noticia numero 8"),
    ("Noticia 9 · IA", "noticia numero 9"),
    ("Noticia 10 · rechazo a la IA", "la noticia numero 10"),
    ("Qué haces tú", "tres cosas que"),
]
chap = [{"txt": c, "s": O(find(p))} for c, p in chapters]
n2 = seg_of("hold", "titulo_n2")
chap.insert(1, {"txt": "Noticia 2 · por qué cambió", "s": n2["s"]})
for i, c in enumerate(chap):
    c["e"] = chap[i + 1]["s"] if i + 1 < len(chap) else TOTAL

# ------------------------------------------------------------------ cámara: punch-in en los saltos de corte
jumps = []
for a, b in zip(EDL, EDL[1:]):
    if b["origStart"] - a["origEnd"] > 0.25:
        jumps.append(a["newEnd"])
cams, z, last = [{"s": 0.0, "z": 1.0}], 1.0, 0.0
for j in jumps:
    if j - last < 2.5:
        continue
    z = 1.14 if z == 1.0 else 1.0
    cams.append({"s": O(j), "z": z})
    last = j
# tras cada clip insertado se vuelve con el plano abierto
for o in out:
    if o["kind"] != "a" and o["e"] < TOTAL:
        cams.append({"s": o["e"], "z": 1.0})
cams.sort(key=lambda c: c["s"])

# ------------------------------------------------------------------ subtítulos de los clips (traducción fiel)
SUBS = {
    "a_riesgo": [(0.0, "«Estamos tomando un gran riesgo con el video largo."), (1.65, "No sé si va a funcionar.»")],
    "b1_2024": [(0.0, "Lo que dijo hace 2 años: «No me interesa hacer video largo"), (4.4, "porque no quiero erosionar nuestra razón de existir.»")],
    "b2_cambio": [(0.0, "¿Qué cambió?")],
    "b3_mundo": [(0.0, "«El mundo cambió."), (1.8, "Cada vez más, la tele es una extensión clave"), (5.3, "de plataformas como Instagram.»")],
    "b4_youtube": [(0.0, "«Mira YouTube en EE. UU.: por lo que vemos,"), (3.4, "el tiempo en el celular está plano"), (6.4, "y todo su crecimiento viene de la tele.»")],
    "c_cuenta": [(0.0, "«Una cuenta nueva puede tener millones de vistas,"), (2.4, "algo imposible hace dos años.»")],
    "d_envios": [(0.0, "«Si eres una creadora nueva,"), (1.1, "es de las métricas más importantes que puedes seguir.»")],
    "f_ia": [(0.0, "«Mes a mes hay más ansiedad, más frustración"), (2.7, "y más enojo con la IA.»")],
    "g_6meses": [(0.0, "«Lo que funciona hoy puede no funcionar en seis meses.»")],
}
WHO = {"b1_2024": "Así lo dijo hace 2 años", "b2_cambio": "La entrevista"}   # rótulo de un clip puntual (si no, va FUENTE["quien"])

# Datos que lee la plantilla:
#   cara   = dónde está la cara en el lienzo 1920×1280 (mídela en un cuadro): ahí apunta el punch-in
#   fuente = quién habla en los clips y dónde lo dijo (rótulo arriba a la izquierda)
#   marca  = colores de mi-marca.md: acento (cifras y claves sobre la toma) y clave (palabras en azul del papel)
CARA = {"x": 1019, "y": 545}
FUENTE = {"quien": "Jefe de Instagram", "donde": "Entrevista en video · octubre 2026"}
MARCA = {"acento": "#f3c623", "clave": "#0192FB"}

plan = {"total": round(TOTAL, 3), "segs": out, "items": sorted(items, key=lambda x: x["s"]), "chapters": chap, "cams": cams,
        "subs": SUBS, "who": WHO, "cara": CARA, "fuente": FUENTE, "marca": MARCA}
json.dump(plan, open(ROOT / "public/plan.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"total {TOTAL:.2f} s · {len(items)} apoyos · {len(out)} segmentos · {len(cams)} planos")
# densidad: huecos > 5 s sin nada en pantalla (fuera de clips y holds)
cover = [(i["s"], i["e"]) for i in items] + [(o["s"], o["e"]) for o in out if o["kind"] != "a"]
cover.sort()
gaps, end = [], 0.0
for a, b in cover:
    if a - end > 5:
        gaps.append((round(end, 1), round(a, 1)))
    end = max(end, b)
print("huecos >5 s:", gaps)
if __import__("os").environ.get("DEBUG"):
    for a, b in gaps:
        ws = [w["w"] for w in W if w["s"] < CUT_DUR - 0.05 and a <= O(w["s"]) < b]
        print(f"{a}-{b}:", " ".join(ws))
