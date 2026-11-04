#!/usr/bin/env python3
"""Montador v3: corta en el valle de volumen (no en la marca de la palabra) y mete tutoriales animados a pantalla completa.
Montador v2 (estilo de la casa): cortes sin aire, gancho golpe en letra gruesa de la casa,
subtítulos de UNA palabra en Instrument Serif (clave en amarillo 1,2x), capturas reales como tarjetas planas
que entran con corte seco en la palabra que las nombra, pops graves, CTA final.
Uso: python montar3.py spec.json
"""
import json, os, re, subprocess, sys, tempfile, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from valles import env, valle
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1080, 1920
AQUI = os.path.dirname(os.path.abspath(__file__))
LETRAS = os.path.join(AQUI, "..", "fuentes")   # todas con licencia SIL OFL 1.1
FUENTES = {
    "chicle": os.path.join(LETRAS, "SelloVivo.ttf"),       # gruesa redonda para ganchos alegres
    "cartel": os.path.join(LETRAS, "Anton-Regular.ttf"),   # condensada tipo cartel para historias reales
    "sello": os.path.join(LETRAS, "SelloVivo.ttf"),
}
SERIF = os.path.join(LETRAS, "InstrumentSerif-Regular.ttf")
SERIF_IT = os.path.join(LETRAS, "InstrumentSerif-Italic.ttf")
AMARILLO, BLANCO = (255, 225, 77), (255, 255, 255)
COLORES = {"rojo": (255, 59, 78), "verde": (61, 255, 106), "amarillo": AMARILLO}

def sh(*a):
    r = subprocess.run(a, capture_output=True, text=True)
    if r.returncode: sys.exit("ERROR " + " ".join(map(str, a[:6])) + "\n" + r.stderr[-1500:])
    return r.stdout

def dur(f): return float(sh("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f))
def norm(w): return unicodedata.normalize("NFKD", w.lower()).encode("ascii", "ignore").decode().strip("¡!¿?.,;: ")

def lienzo(): return Image.new("RGBA", (W, H), (0, 0, 0, 0))

def sombra_de(capa, blur, alfa, dy):
    a = capa.split()[3].point(lambda v: v * alfa / 255)
    s = Image.new("RGBA", (W, H), (0, 0, 0, 0)); s.putalpha(a)
    s = s.filter(ImageFilter.GaussianBlur(blur))
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0)); out.paste(s, (0, dy), s)
    return out

def texto_centrado(d, txt, f, y, color):
    bb = d.textbbox((0, 0), txt, font=f)
    d.text(((W - (bb[2] - bb[0])) // 2 - bb[0], y - bb[1]), txt, font=f, fill=color)
    return bb[3] - bb[1]

def ajusta(path, txt, size, maxw):
    while True:
        f = ImageFont.truetype(path, size)
        if f.getlength(txt) <= maxw or size < 40: return f
        size -= 6

def png_gancho(g, out):
    """Molde de la casa: línea grande en letra gruesa propia, color plano + sombra seca; línea chica serif itálica blanca."""
    capa = lienzo(); d = ImageDraw.Draw(capa); y = g.get("y", 250)
    deg = None
    if g.get("degradado"):   # degradado negro real: opaco arriba y se desvanece suave (curva), nunca un bloque
        alto, fuerza = g.get("degradado_alto", 900), g["degradado"]
        deg = lienzo(); col = Image.new("L", (1, alto))
        col.putdata([int(255 * fuerza * (1 - yy / alto) ** 2.2) for yy in range(alto)])
        deg.paste(Image.new("RGBA", (W, alto), (0, 0, 0, 255)), (0, 0), col.resize((W, alto)))
    for i, l in enumerate(g["lineas"]):
        if i == g.get("grande", 0):
            f = ajusta(FUENTES[g.get("letra", "chicle")], l, g.get("tamano", 190), 1000)
            h = texto_centrado(d, l, f, y, COLORES.get(g.get("color", "rojo"), AMARILLO)); y += h + 22
        else:
            f = ajusta(SERIF_IT, l, 84, 980)
            h = texto_centrado(d, l, f, y, BLANCO); y += h + 18
    seca = sombra_de(capa, 6, 150, 4)
    res = Image.alpha_composite(seca, capa)
    if deg is not None: res = Image.alpha_composite(deg, res)
    res.save(out)

def png_palabra(w, clave, out, y):
    capa = lienzo(); d = ImageDraw.Draw(capa)
    size = 150 if clave else 124
    f = ajusta(SERIF, w, size, 1000)
    texto_centrado(d, w, f, y, AMARILLO if clave else BLANCO)
    halo = sombra_de(capa, 18, 235, 3); cerca = sombra_de(capa, 4, 255, 3)
    halo = Image.alpha_composite(halo, sombra_de(capa, 34, 140, 0))
    Image.alpha_composite(Image.alpha_composite(halo, cerca), capa).save(out)

def png_tarjeta(img, out, caja):
    """Captura real como tarjeta plana (esquinas redondeadas, sombra suave, sin brillo)."""
    im = Image.open(img).convert("RGBA")
    x, y, ancho = caja.get("x"), caja.get("y", 260), caja.get("ancho", 860)
    alto_max = caja.get("alto_max", 820)
    r = min(ancho / im.width, alto_max / im.height)
    im = im.resize((int(im.width * r), int(im.height * r)), Image.LANCZOS)
    if x is None: x = (W - im.width) // 2
    radio = caja.get("radio", 30 if not caja.get("logo") else 0)
    if radio:
        m = Image.new("L", im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width, im.height), radio, fill=255)
        im.putalpha(Image.composite(im.split()[3], m, m))
    capa = lienzo(); capa.paste(im, (x, y), im)
    if caja.get("logo"):
        Image.alpha_composite(sombra_de(capa, 10, 120, 6), capa).save(out)
    else:
        Image.alpha_composite(sombra_de(capa, 22, 150, 14), capa).save(out)

def recorta(p):
    im = Image.open(p); bb = im.getbbox() or (0, 0, 2, 2)
    bb = (bb[0] - bb[0] % 2, bb[1] - bb[1] % 2, bb[2], bb[3])
    im.crop(bb).save(p); return bb[0], bb[1]

def main(spec):
    S = json.load(open(spec)); os.chdir(os.path.dirname(os.path.abspath(spec)))
    tmp = tempfile.mkdtemp(); T = json.load(open(S["tiempos"]))
    clips, overlays, pops, palabras, tutoriales = [], [], [], [], []
    t = 0.0
    # 1) cortes sin aire: cada clip desde su primera sílaba hasta su última palabra
    for i, c in enumerate(S["clips"]):
        info = T[c["tiempos"]]
        ws = [w for w in info["palabras"] if norm(w["w"]) not in [norm(x) for x in c.get("quitar", [])]]
        D = dur(c["archivo"]); e = env(c["archivo"])
        # inicio: punto más bajo del volumen entre 0,35 s y 0,04 s antes de la 1.ª palabra
        a = c["desde"] if "desde" in c else (0.0 if ws[0]["t0"] < 0.2 else valle(e, max(0, ws[0]["t0"] - 0.35), ws[0]["t0"] - 0.04))
        # final: punto más bajo entre 0,12 y 0,55 s después de la última palabra (nunca a media sílaba)
        b = c["hasta"] if "hasta" in c else (D if ws[-1]["t1"] + 0.12 >= D - 0.05 else valle(e, ws[-1]["t1"] + 0.12, min(D - 0.02, ws[-1]["t1"] + 0.55)))
        print(f"  {c['archivo']}: {a:.2f}–{b:.2f} (palabras {ws[0]['t0']:.2f}–{ws[-1]['t1']:.2f}, clip {D:.2f})")
        pre = c.get("congelar_inicio", 0.0)
        o = os.path.join(tmp, f"c{i}.mp4"); src = c["archivo"]
        if not sh("ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", c["archivo"]).strip():
            mudo = os.path.join(tmp, f"m{i}.mp4")
            sh("ffmpeg", "-loglevel", "error", "-y", "-i", c["archivo"], "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-shortest", "-c:v", "copy", "-c:a", "aac", mudo)
            src = mudo
        rec = c.get("recorte_arriba", 0)   # px del clip original con relleno borroso (Kling) que se descartan
        vf = (f"crop=iw:ih-{rec}:0:{rec}," if rec else "") + f"trim={a}:{b},setpts=PTS-STARTPTS,scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps=30,setsar=1"
        if pre: vf += f",tpad=start_mode=clone:start_duration={pre}"
        if c.get("acercar_en") is not None:   # golpe de 0–2 s: corte seco a un plano más cerrado
            z, ax, ay = c.get("zoom", 1.35), c.get("zoom_x", 0.02), c.get("zoom_y", 0.2)
            k = c["acercar_en"]
            vf = (f"{vf},split[p][q];[p]trim=0:{k},setpts=PTS-STARTPTS[p1];"
                  f"[q]trim={k},setpts=PTS-STARTPTS,crop=iw/{z}:ih/{z}:iw*{ax}:ih*{ay},scale={W}:{H},setsar=1[q1];[p1][q1]concat=n=2:v=1:a=0")
        af = f"atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={b - a - 0.09:.3f}:d=0.09"
        if pre: af += f",adelay={int(pre * 1000)}|{int(pre * 1000)}"
        if c.get("lowpass_desde") is not None:
            af += f",lowpass=f=2800:enable='gte(t,{c['lowpass_desde'] - a + pre:.2f})'"
        sh("ffmpeg", "-loglevel", "error", "-y", "-i", src, "-filter_complex", f"[0:v]{vf}[v];[0:a]{af},aresample=48000[a]",
           "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-c:a", "aac", "-ar", "48000", "-ac", "2", o)
        d_ = dur(o); clips.append(o)
        for w in ws:
            if c.get("sin_subs_hasta") is not None and w["t0"] < c["sin_subs_hasta"]: continue
            if a - 0.05 <= w["t0"] <= b: palabras.append((t + pre + w["t0"] - a, t + pre + min(w["t1"], b) - a, w["w"]))
        # capturas / logos anclados a una palabra del clip
        for ov in c.get("capturas", []):
            hit = next((w for w in ws if norm(w["w"]).startswith(norm(ov["palabra"]))), None)
            if not hit: print("  ⚠ no encontré la palabra", ov["palabra"], "en", c["archivo"]); continue
            t0 = t + pre + hit["t0"] - a
            t1 = t + d_ if ov.get("hasta_fin", True) else t0 + ov.get("dur", 2.0)
            p = os.path.join(tmp, f"ov{len(overlays)}.png"); png_tarjeta(ov["archivo"], p, ov); overlays.append((p, t0, t1, "tarjeta")); pops.append(t0)
        tu = c.get("tutorial")
        if tu:
            hit = next((w for w in ws if norm(w["w"]).startswith(norm(tu["palabra"])) and w["t0"] >= tu.get("despues", 0)), None)
            t0 = t + pre + hit["t0"] - a - 0.05
            tutoriales.append((tu["archivo"], t0, t + d_)); pops.append(t0)
        c["_inicio"], c["_dur"] = t, d_
        t += d_
    total = t + S.get("pie_final", 0)

    # 2) concatena
    lista = os.path.join(tmp, "l.txt"); open(lista, "w").write("".join(f"file '{c}'\n" for c in clips))
    cat = os.path.join(tmp, "cat.mp4")
    sh("ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", cat)
    if S.get("pie_final"):
        cat2 = os.path.join(tmp, "cat2.mp4")
        sh("ffmpeg", "-loglevel", "error", "-y", "-i", cat, "-vf", f"tpad=stop_mode=clone:stop_duration={S['pie_final']}",
           "-af", f"apad=pad_dur={S['pie_final']}", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", cat2); cat = cat2

    # 3) voces en off (gancho, CTA) con sus palabras
    voces = []
    for v in S.get("voces", []):
        en = v["en"] if v["en"] >= 0 else total + v["en"]
        voces.append((v["archivo"], en, v.get("gain", 1.0)))
        if v.get("subs") and v.get("tiempos"):
            for w in T[v["tiempos"]]["palabras"]: palabras.append((en + w["t0"], en + w["t1"], w["w"]))

    # 4) gancho + subtítulos de una palabra
    g = S.get("gancho"); g_hasta = g["hasta"] if g else 0
    if g:
        p = os.path.join(tmp, "gancho.png"); png_gancho(g, p); overlays.append((p, 0, g["hasta"], "gancho"))
    claves = {norm(k) for k in S.get("claves", [])}
    fix = S.get("corregir", {})
    palabras.sort()
    for k, (t0, t1, w) in enumerate(palabras):
        if t1 <= g_hasta: continue
        w = fix.get(norm(w), w).strip()
        nxt = palabras[k + 1][0] if k + 1 < len(palabras) else t1 + 0.3
        t1 = nxt if nxt - t1 < 0.5 else t1 + 0.15
        p = os.path.join(tmp, f"w{k}.png"); png_palabra(w, norm(w) in claves, p, S.get("subs_y", 1430))
        overlays.append((p, max(t0, g_hasta), t1, "sub"))
    for r in S.get("rotulos", []):
        p = os.path.join(tmp, f"rot{len(overlays)}.png"); png_gancho(r, p)
        overlays.append((p, r["en"], r["hasta"], "gancho"))
    for f in S.get("finales", []):   # tarjetas o textos al cierre (CTA)
        p = os.path.join(tmp, f"fin{len(overlays)}.png")
        if f.get("tipo") == "gancho": png_gancho(f, p)
        else: png_tarjeta(f["archivo"], p, f)
        t0 = f["en"] if f["en"] >= 0 else total + f["en"]
        overlays.append((p, t0, total, "fin")); pops.append(t0)

    # 5) pop grave (120 Hz, nada sobre 3 kHz) en cada captura
    pop = os.path.join(tmp, "pop.wav")
    sh("ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
       "aevalsrc='0.8*sin(2*PI*(160-260*t)*t)*exp(-22*t)':s=48000:d=0.25", "-af", "lowpass=f=900", "-ac", "2", pop)

    pops += S.get("pops_extra", [])
    ins = ["-i", cat]; fc = []; last = "0:v"; k0 = 1
    for j, (f, t0, t1) in enumerate(tutoriales):
        ins += ["-i", f]
        fc.append(f"[{k0}:v]setpts=PTS-STARTPTS+{t0:.3f}/TB[tu{j}];[{last}][tu{j}]overlay=0:0:eof_action=pass:enable='between(t,{t0:.3f},{t1:.3f})'[vt{j}]"); last = f"vt{j}"; k0 += 1
    orden = [o for o in overlays if o[3] in ("tarjeta", "fin")] + [o for o in overlays if o[3] == "gancho"] + [o for o in overlays if o[3] == "sub"]
    for i, (p, t0, t1, _) in enumerate(orden, 1):
        ox, oy = recorta(p)
        ins += ["-loop", "1", "-framerate", "30", "-t", f"{t1 - t0 + 0.2:.3f}", "-i", p]
        fc.append(f"[{i + k0 - 1}:v]setpts=PTS-STARTPTS+{t0:.3f}/TB[o{i}];[{last}][o{i}]overlay={ox}:{oy}:eof_action=pass:enable='between(t,{t0:.3f},{t1:.3f})'[v{i}]"); last = f"v{i}"
    ai = len(orden) + k0; am = [f"[0:a]volume={S.get('vol_clips', 1.0)}[a0]"]; lab = ["[a0]"]
    for j, (f, en, gain) in enumerate(voces):
        ins += ["-i", f]; ms = int(en * 1000)
        am.append(f"[{ai}:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-2,volume={gain},adelay={ms}|{ms}[v_{j}]"); lab.append(f"[v_{j}]"); ai += 1
    for j, tp in enumerate(pops):
        ins += ["-i", pop]; ms = int(tp * 1000)
        am.append(f"[{ai}:a]volume=0.5,adelay={ms}|{ms}[p_{j}]"); lab.append(f"[p_{j}]"); ai += 1
    am.append(f"{''.join(lab)}amix=inputs={len(lab)}:normalize=0:duration=first,alimiter=limit=0.9[aout]")
    script = os.path.join(tmp, "fc.txt"); open(script, "w").write(";".join(fc + am))
    sh("ffmpeg", "-loglevel", "error", "-y", *ins, "-/filter_complex", script, "-map", f"[{last}]", "-map", "[aout]",
       "-t", f"{total:.3f}", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-r", "30", "-c:a", "aac", "-b:a", "192k", S["salida"])
    json.dump({"clips": [{"archivo": c["archivo"], "inicio": c["_inicio"], "dur": c["_dur"]} for c in S["clips"]],
               "palabras": palabras, "total": total}, open(S["salida"] + ".tiempos.json", "w"), ensure_ascii=False, indent=1)
    print(f"listo: {S['salida']} {total:.1f}s · {len(orden)} capas · {len(pops)} pops")

if __name__ == "__main__":
    main(sys.argv[1])
