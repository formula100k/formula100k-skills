#!/usr/bin/env python3
"""
armar.py — convierte plan.json en la composición del reel y en el plan de efectos de sonido.

Uso:  armar.py <DEST>
Lee:   DEST/plan.json · DEST/captions.json (del corte) · DEST/silueta.json (de recortar.py)
Deja:  DEST/reel/index.html · DEST/sfx_plan.json · y un REPORTE con lo que no cumple las reglas.
Sale con código 1 si hay errores (pieza desconocida, imagen que no existe, escenas encimadas).
"""
import json, os, re, sys, shutil, subprocess
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
VT, VH = 1390, 530          # estilo ventana: franja de abajo (top y alto), ancho 1008 con 36 px a cada lado

PERSONA = {
    "ventana": """  <div id="cara-wrap"><div id="cara-in"><div class="zoom-corte" style="position:absolute;inset:0"><video id="yo-cara" class="clip" src="assets/yo.mp4" data-start="0" data-duration="__DUR__" data-track-index="1" muted playsinline></video></div></div></div>
  <div id="ventana"><div id="vent-in"><video id="yo-vent" class="clip" src="assets/yo-ventana.mp4" data-start="0" data-duration="__DUR__" data-track-index="2" muted playsinline></video></div><div class="fundido"></div></div>""",
    "recortada": """  <div id="yo-wrap"><div class="zoom-corte" style="position:absolute;left:0;top:0;width:1080px;height:1920px"><video id="yo" class="clip" src="assets/yo.webm" data-start="0" data-duration="__DUR__" data-track-index="1" muted playsinline></video></div></div>""",
}
TIPOS = {"flujo", "escribe", "edicion", "nota_voz", "carpeta", "tachado", "captura", "telefono", "grilla", "curva", "barra", "caja", "documento", "objeto", "lista", "pantalla", "numero", "frase", "html", "skill", "post_ig"}
CAMPOS_IMG = {"edicion": ["imgs"], "carpeta": ["imgs"], "captura": ["img"], "telefono": ["img", "video"], "grilla": ["imgs"], "objeto": ["img"], "pantalla": ["img"], "post_ig": ["img", "imgs", "avatar"], "skill": ["icono", "video_img"]}


def proporcion(ruta):
    """ancho/alto de una imagen (ffprobe, igual en Mac y en Windows; None si no se puede leer)."""
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                              "-of", "csv=p=0", str(ruta)], capture_output=True, text=True).stdout
        w, h = [int(x) for x in out.strip().split("\n")[0].split(",")[:2]]
        return w / h
    except Exception:
        return None


def self_tope(p, y):
    """Borde de arriba de una pieza (misma cuenta que reel.html para la flecha)."""
    if p.get("tipo") == "grilla":
        pw, ph = map(float, str(p.get("proporcion", "9:16")).split(":"))
        filas = -(-min(6, len(p.get("imgs", []))) // 3)
        return y - (filas * p.get("ancho_card", 230) * ph / pw + (filas - 1) * 20) / 2
    if p.get("tipo") == "telefono":
        return y - p.get("ancho", 330) * 2.05 / 2
    if p.get("tipo") == "objeto":
        return y - p.get("ancho", 380) * 0.75
    if p.get("tipo") == "flujo" and p.get("nodos"):
        n = p["nodos"][0]
        return y - 500 + n["y"] - n.get("ancho", 260) / 2
    return y - 220


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    dest = Path(sys.argv[1])
    plan = json.loads((dest / "plan.json").read_text(encoding="utf-8"))
    palabras = json.loads((dest / "captions.json").read_text(encoding="utf-8"))
    sil = json.loads((dest / "silueta.json").read_text(encoding="utf-8"))
    reel = dest / "reel"
    dur = float(plan.get("duracion") or sil["duracion"])
    plan["duracion"] = round(dur, 3)

    errores, avisos = [], []

    # ── Poses de la persona (de silueta.json) ──
    yo = plan.get("yo", {})
    estilo = yo.get("estilo") or sil.get("estilo") or "recortada"
    cy, cx = sil["cabeza_y"], sil["centro_x"]
    zc = yo.get("cara_zoom", 1.08)
    sm = yo.get("motion_escala", 0.58)
    cabeza_motion = yo.get("motion_cabeza_y", 1345)
    pose_cara = {"s": zc, "x": round(540 - cx * zc), "y": round(min(0, cy * (1 - zc)))}
    if pose_cara["y"] + 1920 * zc < 1920:
        pose_cara["y"] = round(1920 - 1920 * zc)
    if estilo == "ventana":
        # dentro de la franja: el cuadro entero de ancho (se ve su fondo a los lados), la cabeza a 46 px del borde de arriba
        sv = 1008 / 1080 * yo.get("ventana_zoom", 1.0)
        pose_motion = {"s": round(sv, 4), "x": round(504 - cx * sv), "y": round(yo.get("ventana_cabeza_y", 46) - cy * sv)}
        pose_motion["x"] = min(0, max(1008 - round(1080 * sv), pose_motion["x"]))
        if pose_motion["y"] + 1920 * sv < VH:
            avisos.append("En la ventana se ve el borde de abajo del video (baja ventana_zoom o ventana_cabeza_y).")
        sub_motion = VT - 104
    else:
        pose_motion = {"s": sm, "x": round(540 - cx * sm), "y": round(cabeza_motion - cy * sm)}
        if pose_motion["y"] + 1920 * sm < 1920:
            avisos.append(f"En modo motion el corte del cuerpo queda a la vista (sube motion_escala o baja motion_cabeza_y).")
        sub_motion = cabeza_motion - 92
    if not (reel / "assets" / ("yo.mp4" if estilo == "ventana" else "yo.webm")).exists():
        errores.append(f"Falta reel/assets/{'yo.mp4' if estilo == 'ventana' else 'yo.webm'}: corre recortar.py con --estilo {estilo}.")
    plan["yo"] = {"estilo": estilo, "cara": pose_cara, "motion": pose_motion}
    if estilo == "ventana" and (reel / "assets" / "yo.mp4").exists():
        # la ventana usa su propia copia (enlace duro): dos <video> con la misma fuente se descubren dos veces al compilar
        dup = reel / "assets" / "yo-ventana.mp4"
        if dup.exists():
            dup.unlink()
        os.link(reel / "assets" / "yo.mp4", dup)
    plan.setdefault("sub_y_motion", sub_motion)
    plan["silueta"] = {"cx": cx, "cy": cy}
    # uniones del corte fino (para el punch-in que disimula el salto y el micro-fundido de la voz)
    if "cortes" not in plan and (dest / "edl.json").exists():
        edl = json.loads((dest / "edl.json").read_text(encoding="utf-8"))
        plan["cortes"] = [round(x["newStart"], 3) for x in edl[1:]]
    if "cortes" not in plan:
        avisos.append("Sin «cortes» en el plan ni edl.json: los saltos del corte fino no se van a disimular.")
    plan.setdefault("sub_y_cara", 1255)
    plan.setdefault("sub_y_completa", 1640)
    # El gancho lleva a la persona (20-oct, probado en trial reels: el gancho 100 % animado no convence).
    # Va en modo motion: ella recortada abajo y la pieza arriba, que el motor achica para no bajar del subtítulo
    # (y el subtítulo queda sobre su cabeza), así la animación no le tapa la cara.
    for e in plan.get("escenas", []):
        if e["desde"] <= 0.01 and e.get("completa") and not e.get("gancho_sin_mi"):
            e["completa"] = False
            avisos.append("El gancho venía a pantalla completa: lo pasé a modo motion para que aparezcas tú abajo "
                          "(«gancho_sin_mi»: true lo deja sin ti).")
    # título GOLPE del gancho (22-oct): 2 a 5 palabras entre las dos líneas, sin tercera línea
    for e in plan.get("escenas", []):
        tt = e.get("titulo") or {}
        if tt and (tt.get("estilo") == "golpe" or (e["desde"] < 0.05 and tt.get("estilo") != "bloque")):
            n = len(((tt.get("l1") or "") + " " + (tt.get("l2") or "")).split())
            gl = [tt.get("l1") or "", tt.get("l2") or ""][min(int(tt.get("grande", 0)), 1)]
            if len(gl) > 11:
                avisos.append(f"La línea grande «{gl}» tiene {len(gl)} letras: queda chica para caber. Déjala en 1–2 palabras cortas (≤ 11 letras, como «ELIMINA»).")
            if n > 5:
                avisos.append(f"El golpe «{tt.get('l1','')} / {tt.get('l2','')}» tiene {n} palabras: déjalo en 2 a 5 (gancho-golpe-f100k).")
            if tt.get("color") not in (None, "rojo", "verde", "amarillo") and not str(tt.get("color", "")).startswith("#"):
                avisos.append(f"Color de golpe desconocido «{tt.get('color')}»: usa rojo, verde, amarillo o un hex.")
    # cara con su fondo real (por defecto desde el 19-oct): los huecos entre escenas se llenan con la toma original.
    # El recorte de Vision deja huecos en el pelo cuando la cara va grande; con la toma real eso no pasa.
    if estilo == "recortada" and yo.get("cara_fondo", "real") == "real":
        mot = sorted([e for e in plan.get("escenas", []) if not e.get("real")], key=lambda e: e["desde"])
        ocupado = sorted([(e["desde"], e["hasta"]) for e in plan.get("escenas", [])])
        t = 0.0
        for a, b in ocupado + [(dur, dur)]:
            if a - t > 0.05:
                plan["escenas"].append({"desde": round(t, 3), "hasta": round(a, 3), "real": True, "auto": True})
            t = max(t, b)
    plan.setdefault("zoom_corte", 1.06)
    # GANCHO CON SU TOMA REAL (22-oct, estilo «ELIMINA / tus destacadas»): la escena 0 con título
    # golpe va sobre la toma original con su fondo, ella más abajo y el texto encima. "fondo": "negro" lo apaga.
    capa_golpe = ""
    e0 = next((e for e in plan.get("escenas", []) if e["desde"] < 0.05 and not e.get("real")), None)
    t0 = (e0 or {}).get("titulo") or {}
    if e0 and estilo == "recortada" and t0 and t0.get("estilo") != "bloque" and e0.get("fondo", "real") == "real":
        e0["golpe_real"] = True
        cab = int(yo.get("golpe_cabeza_y", 1000))      # dónde queda el borde de arriba de su cabeza
        plan["golpe_cabeza_y"] = cab
        plan.setdefault("sub_y_golpe", min(1720, cab + 640))
        dy = cab - int(sil["cabeza_y"])
        h0 = round(e0["hasta"] + 0.3, 3)
        capa_golpe = (f'  <div id="golpe-real" style="--gdy:{dy}px"><video id="golpe-bg" class="clip" src="assets/real.mp4" data-start="0" '
                      f'data-duration="{h0}" data-track-index="4" muted playsinline></video><video id="golpe-fg" class="clip" src="assets/real.mp4" '
                      f'data-start="0" data-duration="{h0}" data-track-index="5" muted playsinline></video><div class="sombra"></div></div>')
    # escenas "real": la toma original con su fondo a pantalla completa (dramatización). Sale de _source_cut.mov.
    hay_real = any(e.get("real") or e.get("golpe_real") for e in plan.get("escenas", []))
    real = reel / "assets" / "real.mp4"
    if hay_real:
        src = dest / "_source_cut.mov"
        if not src.exists():
            errores.append("Hay escenas «real» pero falta _source_cut.mov.")
        elif not real.exists() or real.stat().st_mtime < src.stat().st_mtime:
            import subprocess
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-an", "-c:v", "libx264", "-crf", "16", "-preset", "fast",
                            "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", str(real)], check=True)

    # ── Validación de escenas ──
    escenas = sorted(plan.get("escenas", []), key=lambda e: e["desde"])
    plan["escenas"] = escenas
    prev_fin = 0.0
    huecos_cara = []
    for i, e in enumerate(escenas):
        if e["hasta"] <= e["desde"]:
            errores.append(f"Escena {i}: «hasta» no es mayor que «desde».")
        if e["desde"] < prev_fin - 0.01:
            errores.append(f"Escena {i} se encima con la anterior ({e['desde']} < {prev_fin}).")
        if e["desde"] - prev_fin > 0.01:
            huecos_cara.append((prev_fin, e["desde"]))
        if e["hasta"] - e["desde"] < 1.2:
            avisos.append(f"Escena {i} dura menos de 1,2 s: el cambio de modo se va a sentir brusco.")
        prev_fin = e["hasta"]
        if e.get("real"):
            if e["hasta"] - e["desde"] > 6.5:
                avisos.append(f"Cara de {e['desde']:.1f} a {e['hasta']:.1f} s ({e['hasta'] - e['desde']:.1f} s): nunca más de ~6 s con la cara sola.")
            if e.get("piezas") or e.get("titulo"):
                avisos.append(f"Escena {i} es «real» (toma con su fondo): no lleva título ni piezas, se ignoran.")
            continue
        textos = [p for p in e.get("piezas", []) if p.get("tipo") in ("caja", "lista", "frase", "documento")]
        if len(textos) >= 2 or (textos and len(e.get("piezas", [])) == len(textos) and len(textos[0].get("items", [])) > 2):
            avisos.append(f"Escena {i} ({e['desde']:.1f} s): demasiado texto ({', '.join(p['tipo'] for p in textos)}). Cámbiala por un gráfico que ejemplifique (flujo, objeto, captura), mejor a pantalla completa.")
        entradas = []
        for p in e.get("piezas", []):
            entradas.append(p.get("en", e["desde"]))
            entradas += [t for t in (p.get("tiempos") or []) if t is not None]
            entradas += [x["marca_en"] for x in p.get("secciones", []) if x.get("marca_en") is not None]
            entradas += [x["en"] for x in p.get("resaltes", []) if x.get("en") is not None]
            entradas += [x["en"] for x in p.get("items", []) if isinstance(x, dict) and x.get("en") is not None]
            entradas += [x["en"] for x in p.get("nodos", []) + p.get("flechas", []) if x.get("en") is not None]
            if p.get("gira_en") is not None:
                entradas.append(p["gira_en"])
            entradas += [float(v) for v in re.findall(r'data-(?:en|traza)="([\d.]+)"', p.get("html", ""))]
        entradas = sorted(t for t in entradas if e["desde"] <= t <= e["hasta"])
        marcas = [e["desde"]] + entradas + [e["hasta"]]
        hueco = max(b - a for a, b in zip(marcas, marcas[1:]))
        if hueco > 5.2:
            avisos.append(f"Escena {i} ({e['desde']:.1f}–{e['hasta']:.1f} s): {hueco:.1f} s sin que entre nada nuevo (regla: algo cada 3–5 s).")
        ps = e.get("piezas", [])
        for x in range(len(ps)):
            for y in range(x + 1, len(ps)):
                a, b = ps[x], ps[y]
                ia, fa = a.get("en", e["desde"]), a.get("hasta", e["hasta"])
                ib, fb = b.get("en", e["desde"]), b.get("hasta", e["hasta"])
                if ia < fb and ib < fa and "centro" in (a.get("pos", "centro"), b.get("pos", "centro")) and a.get("x") is None and b.get("x") is None:
                    avisos.append(f"Escena {i}: {a['tipo']} y {b['tipo']} están a la vez y una va al centro: se van a chocar. Usa arriba + abajo o izq + der.")
        ico = (e.get("titulo") or {}).get("icono")
        if ico and not (reel / ico).is_file():
            errores.append(f"Escena {i}: no existe reel/{ico} (ícono del golpe)")
        for p in ps:
            if p.get("tipo") not in TIPOS:
                errores.append(f"Escena {i}: pieza desconocida «{p.get('tipo')}». Tipos: {', '.join(sorted(TIPOS))}.")
                continue
            if p["tipo"] == "flujo":
                for x in p.get("nodos", []):
                    if not (reel / x.get("img", "")).is_file():
                        errores.append(f"Escena {i}: no existe reel/{x.get('img')}")
            if p["tipo"] == "tachado":
                for x in p.get("items", []):
                    if not (reel / x.get("img", "")).is_file():
                        errores.append(f"Escena {i}: no existe reel/{x.get('img')}")
            for campo in CAMPOS_IMG.get(p["tipo"], []):
                vals = p.get(campo)
                for v in ([vals] if isinstance(vals, str) else (vals or [])):
                    if not (reel / v).exists():
                        errores.append(f"Escena {i}: no existe reel/{v}")
            # mockups (19-oct): un carrusel nunca va recortado dentro de un teléfono; va publicado en un post_ig
            if p["tipo"] == "telefono" and p.get("img") and (reel / p["img"]).is_file():
                r = proporcion(reel / p["img"])
                if r and r > 0.62:
                    errores.append(f"Escena {i}: «{p['img']}» es {r:.2f} de ancho/alto (no 9:16): dentro de un teléfono sale recortada. "
                                   "Si es un carrusel o post, usa la pieza post_ig (post ya publicado en Instagram).")
            if p.get("en") is not None and not (e["desde"] - 0.01 <= p["en"] < e["hasta"]):
                errores.append(f"Escena {i}: la pieza {p['tipo']} entra en {p['en']}, fuera de la escena.")
    if dur - prev_fin > 0.01:
        huecos_cara.append((prev_fin, dur))

    # «Todo lo dicho se siente real» (19-oct): si nombra una skill, un prompt, una plantilla, un documento o un post,
    # en ese momento tiene que verse su mockup (skill · escribe · documento · pantalla · post_ig · captura · telefono).
    MOCKUP = {"grilla", "skill", "escribe", "documento", "pantalla", "post_ig", "captura", "telefono", "carpeta", "edicion", "nota_voz"}
    PIDEN = ("skill", "prompt", "plantilla", "documento", "recetario", "carrusel", "publica", "app")
    for w in palabras:
        lw = (w.get("word") or "").lower().strip(".,;:!?¿¡«»\"")
        if not any(lw.startswith(k) for k in PIDEN):
            continue
        t = w.get("start", 0)
        e = next((x for x in escenas if x["desde"] <= t < x["hasta"]), None)
        if e is None or e.get("real"):
            avisos.append(f"{t:.1f} s «{w.get('word')}»: se nombra pero está en cara/toma real. ¿Va un mockup?")
            continue
        vivas = [p for p in e.get("piezas", []) if p.get("en", e["desde"]) - 0.4 <= t <= p.get("hasta", e["hasta"])]
        if not any(p["tipo"] in MOCKUP for p in vivas):
            avisos.append(f"{t:.1f} s «{w.get('word')}»: se nombra y en pantalla no hay mockup que lo muestre ({', '.join(p['tipo'] for p in vivas) or 'nada'}).")

    for a, b in huecos_cara:
        if b - a > 6.5:
            avisos.append(f"Modo cara de {a:.1f} a {b:.1f} s ({b - a:.1f} s): la referencia nunca pasa de ~6 s con la cara sola. Mete una escena o un apoyo.")
    t_motion = sum(e["hasta"] - e["desde"] for e in escenas if not e.get("real"))
    pct = 100 * t_motion / dur if dur else 0
    if not 55 <= pct <= 92:
        avisos.append(f"Motion ocupa {pct:.0f} % del reel (la referencia anda en 65–75 %).")
    if dur > 25 and not any(e.get("completa") for e in escenas):
        avisos.append("Sin variación: ninguna escena va a pantalla completa («completa»: true). Usa al menos una para el gráfico que mejor ejemplifica.")
    if dur > 25 and not any(e.get("real") for e in escenas):
        avisos.append("Sin variación: ninguna escena con su fondo real («real»: true). Si en algún momento actúa o dramatiza una frase, va ahí.")
    if not escenas or escenas[0]["desde"] > 0.01 or escenas[0].get("real"):
        avisos.append("El reel no abre en modo motion: revisa el golpe visual de 0–2 s.")

    IMG = set(CAMPOS_IMG) | {"tachado"}
    reales = [p for e in escenas for p in e.get("piezas", []) if p.get("tipo") in IMG]
    if not reales:
        avisos.append("Ninguna pieza usa una imagen real (captura, telefono, grilla, pantalla, objeto). La referencia muestra prueba propia: tu perfil, tus reels, tu página.")
    elif escenas and not any(p.get("tipo") in IMG for p in escenas[0].get("piezas", [])):
        avisos.append("La primera escena no muestra una imagen real: el golpe de 0–2 s pega más con la cosa de la que hablas (tu perfil, tu resultado).")

    texto = " ".join((w.get("word") or "").lower() for w in palabras)
    for c in plan.get("claves", []):
        if c.lower() not in texto:
            avisos.append(f"La palabra clave «{c}» no aparece en la transcripción (no se va a resaltar).")

    # ── Plan de efectos de sonido ──
    sfx = []
    cambios = sorted({t for e in escenas for t in (e["desde"], e["hasta"]) if 0.05 < t < dur - 0.05})
    def modo(t):
        for e in escenas:
            if e["desde"] <= t < e["hasta"]:
                return "real" if e.get("real") else "completa" if e.get("completa") else "motion"
        return "cara"
    k = 0
    for t in cambios:
        if modo(t - 0.01) != modo(t + 0.01):
            sfx.append({"t": round(max(0, t - 0.2), 3), "sfx": ("whoosh1", "whoosh2")[k % 2], "vol": 0.55}); k += 1
    titulo_prev = None
    if escenas and escenas[0]["desde"] < 0.05 and escenas[0].get("titulo"):
        sfx.append({"t": 0.0, "sfx": "whoosh2", "vol": 0.6})   # golpe del cuadro 0
    for ei, e in enumerate(escenas):
        # la flecha a mano (reel.html) se dibuja 0,3 s después de la primera pieza; en el gancho, a los 0,3 s
        # misma regla que reel.html: sin espacio entre el título (abajo ≈ 250 + 97 por línea) y la pieza, no hay flecha
        SLOT_Y = {"centro": 800, "arriba": 700, "abajo": 1040, "izq": 800, "der": 800, "completo": 1010,
                  "arriba-izq": 700, "arriba-der": 700, "abajo-izq": 1040, "abajo-der": 1040}
        tt0, pz0 = e.get("titulo") or {}, (e.get("piezas") or [{}])[0]
        # título GOLPE (22-oct): el del gancho por defecto; no lleva flecha ni clics de tecleo
        golpe = bool(tt0) and (tt0.get("estilo") == "golpe" or (e["desde"] < 0.05 and tt0.get("estilo") != "bloque"))
        y_pieza = pz0.get("y", SLOT_Y.get(pz0.get("pos") or ("completo" if e.get("completa") else "centro"), 800))
        fondo_tit = 250 + 97 * len([x for x in (tt0.get("l1"), tt0.get("l2")) if x]) + 20
        if not golpe and e.get("titulo") and e.get("piezas") and e.get("flecha") is not False and plan.get("flechas") is not False \
                and (self_tope(pz0, y_pieza) - fondo_tit >= 160 or (e["desde"] < 0.05 and pz0.get("tipo") in ("objeto", "telefono"))):
            pegada = ei > 0 and abs(escenas[ei - 1]["hasta"] - e["desde"]) < 0.3
            p0 = e["piezas"][0]
            en0 = max(e["desde"] + (0.35 * 0.75 if pegada else 0), p0.get("en", e["desde"] + 0.1))
            sfx.append({"t": round(0.3 if e["desde"] < 0.05 else en0 + 0.3, 3), "sfx": "swoosh1", "vol": 0.4})
        tt = e.get("titulo")
        if tt:
            key = (tt.get("l1", ""), tt.get("l2", ""))
            if golpe and e["desde"] > 0.05:
                sfx.append({"t": round(e["desde"] + 0.05, 3), "sfx": "whoosh2", "vol": 0.55})
            elif key != titulo_prev and e["desde"] > 0.05:
                # 23-oct (sin olor a IA): el título ya no se teclea, entra con corte seco → un solo clic
                sfx.append({"t": round(e["desde"] + 0.05, 3), "sfx": "click1", "vol": 0.35})
            titulo_prev = key
        if e.get("cta"):
            sfx.append({"t": round(max(0, e["desde"] - 0.3), 3), "sfx": "riser1", "vol": 0.5})
        for j, p in enumerate(e.get("piezas", [])):
            en = p.get("en", e["desde"] + 0.1)
            if en < 0.05:
                continue
            sfx.append({"t": round(en + 0.04, 3), "sfx": ("pop1", "pop2")[j % 2], "vol": 0.45})
            if p.get("tipo") == "lista":
                for q, _ in enumerate(p.get("items", [])[1:], 1):
                    tq = (p.get("tiempos") or [None] * 99)[q] if p.get("tiempos") else en + 0.15 + q * p.get("ritmo", 0.4)
                    sfx.append({"t": round(tq + 0.03, 3), "sfx": ("pop1", "pop2")[q % 2], "vol": 0.4})
            if p.get("tipo") == "html":   # lo que entra por dentro (data-en) suena con pop; los trazos (data-traza) con swoosh
                for q, tq in enumerate(sorted({float(v) for v in re.findall(r'data-en="([\d.]+)"', p.get("html", ""))})):
                    if tq > en + 0.15:
                        sfx.append({"t": round(tq + 0.03, 3), "sfx": ("pop1", "pop2")[q % 2], "vol": 0.35})
                for tq in sorted({float(v) for v in re.findall(r'data-traza="([\d.]+)"', p.get("html", ""))}):
                    sfx.append({"t": round(tq, 3), "sfx": "swoosh1", "vol": 0.45})
            if p.get("tipo") == "tachado":
                for q, x in enumerate(p.get("items", [])):
                    if x.get("en") is not None:
                        sfx.append({"t": round(x["en"], 3), "sfx": "swoosh1", "vol": 0.45})
            if p.get("tipo") == "telefono" and p.get("cuenta"):
                k = p["cuenta"]; n0 = k.get("desde", 3); t0 = k.get("en", en + 0.4); d = k.get("dur", n0)
                for q in range(1, n0):
                    sfx.append({"t": round(t0 + d * q / n0, 3), "sfx": ("click1", "click2")[q % 2], "vol": 0.4})
                sfx.append({"t": round(t0 + d, 3), "sfx": "ding1", "vol": 0.4})
            if p.get("tipo") == "captura":
                for q, r in enumerate(p.get("resaltes", [])):
                    if r.get("en") is not None:
                        sfx.append({"t": round(r["en"] + 0.03, 3), "sfx": ("pop1", "pop2")[q % 2], "vol": 0.4})
            if p.get("tipo") == "skill":
                sfx.append({"t": round(p.get("instala_en", en + 0.6), 3), "sfx": "ding1", "vol": 0.4})
                if p.get("video_img"):
                    sfx.append({"t": round(p.get("video_en", en + 1.2), 3), "sfx": "swoosh1", "vol": 0.4})
                for q, _ in enumerate(p.get("items", [])):
                    tq = (p.get("tiempos") or [None] * 99)[q]
                    if tq is not None:
                        sfx.append({"t": round(tq + 0.03, 3), "sfx": ("pop1", "pop2")[q % 2], "vol": 0.4})
            if p.get("tipo") == "numero":
                sfx.append({"t": round(en + 0.2 + p.get("dur", 1.2), 3), "sfx": "ding1", "vol": 0.4})
    sfx.sort(key=lambda h: h["t"])
    (dest / "sfx_plan.json").write_text(json.dumps(sfx, indent=1), encoding="utf-8")

    for e in escenas:
        for p in e.get("piezas", []):
            if p.get("tipo") == "telefono" and p.get("video"):
                avisos.append(f"El `telefono` de {p.get('en', e['desde'])} s usa `video`: el render lo deja negro (o fuera del celular). Usa `img` con un cuadro del video.")

    # ── HTML ──
    html = (SKILL / "templates" / "reel.html").read_text(encoding="utf-8")
    capa_real = ("""  <div id="real-wrap"><div class="zoom-corte" style="position:absolute;inset:0"><video id="real" class="clip" src="assets/real.mp4" data-start="0" data-duration="__DUR__" data-track-index="3" muted playsinline></video></div></div>"""
                 if hay_real else "")
    html = html.replace("__PERSONA__", PERSONA[estilo]).replace("__REAL__", capa_real).replace("__GOLPE__", capa_golpe).replace("__VT__", str(VT)).replace("__VH__", str(VH))
    html = html.replace("__DUR__", f"{dur:.3f}")
    html = html.replace("__PLAN__", json.dumps(plan, ensure_ascii=False))
    html = html.replace("__PALABRAS__", json.dumps(palabras, ensure_ascii=False))
    # proporción de cada imagen: el motor mide el alto de las piezas antes de que carguen (22-oct: una captura
    # sin medir se subía encima del título golpe)
    tams = {}
    for f in sorted((reel / "assets").glob("*")):
        if f.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
            r = proporcion(f)
            if r:
                tams["assets/" + f.name] = round(r, 4)
    html = html.replace("__TAMS__", json.dumps(tams, ensure_ascii=False))
    # El acento de su marca («acento» en plan.json, de mi-marca.md) reemplaza al dorado de fábrica en todo el motor.
    acento = str(plan.get("acento") or "").strip().lstrip("#")
    if re.fullmatch(r"[0-9a-fA-F]{6}", acento):
        rgb = ",".join(str(int(acento[i:i + 2], 16)) for i in (0, 2, 4))
        html = html.replace("#F5C542", "#" + acento.upper()).replace("245,197,66", rgb)
    elif acento:
        avisos.append(f"`acento` «{plan.get('acento')}» no es un hex de 6 cifras (#RRGGBB): queda el dorado de fábrica.")
    reel.mkdir(parents=True, exist_ok=True)
    (reel / "index.html").write_text(html, encoding="utf-8")

    print(f"· duración {dur:.1f} s · {len(escenas)} escenas · motion {pct:.0f} % · {len(sfx)} efectos de sonido")
    for a in avisos:
        print("⚠️ ", a)
    for e in errores:
        print("❌", e)
    if errores:
        sys.exit(1)
    print(f"✅ {reel / 'index.html'}")


if __name__ == "__main__":
    main()
