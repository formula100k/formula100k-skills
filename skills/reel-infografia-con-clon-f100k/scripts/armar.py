#!/usr/bin/env python3
"""
armar.py — convierte plan.json (piezas ancladas a PALABRAS) en la composición HyperFrames y el plan de efectos.

Uso:  armar.py <DEST> [--gancho 0|1|2]
Lee:   DEST/plan.json · DEST/captions.json · DEST/silueta.json · DEST/clon.json (si hay clon) · DEST/edl.json
Deja:  DEST/reel/index.html · DEST/reel/assets/base.mp4 · DEST/sfx_plan.json · DEST/plan_resuelto.json
       y un REPORTE con lo que no cumple las reglas. Sale con código 1 si hay errores.

Anclas (campos "en" y "hasta" de cada pieza, de cada item y del gancho):
  "cinco"          la primera vez que se dice «cinco» DESPUÉS de la pieza anterior (sin tildes ni mayúsculas)
  "cinco nichos"   una frase: arranca en la primera palabra
  "cinco@2"        la 2.ª vez en todo el video
  "cinco+0.3"      0,3 s después (también "-0.2")
  "cinco:fin"      cuando TERMINA de decirla
  4.2              segundos (escape: úsalo solo si no hay palabra)
"""
import json, re, subprocess, sys, unicodedata
from pathlib import Path

# Windows: la consola y los archivos en UTF-8 (tildes, «», ✅)
for _f in (sys.stdout, sys.stderr):
    try:
        _f.reconfigure(encoding="utf-8")
    except Exception:
        pass

SKILL = Path(__file__).resolve().parent.parent
SFX_DIR = SKILL / "sfx"
FORMAS = {"centro", "mapa", "cuadricula", "lista", "mosaico_numero"}
TIPOS = {"lamina", "palabra", "llave", "tabla", "tarjeta_video", "comentario"}
PANTALLA = {"lamina", "palabra", "llave"}          # ocupan la pantalla: cortan a la anterior
NUMEROS = {"uno": 1, "una": 1, "un": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5, "seis": 6, "siete": 7, "ocho": 8,
           "nueve": 9, "diez": 10, "once": 11, "doce": 12, "quince": 15, "veinte": 20, "treinta": 30, "cuarenta": 40,
           "cincuenta": 50, "cien": 100, "ciento": 100, "doscientos": 200, "trescientos": 300, "quinientos": 500, "mil": 1000,
           "millon": 1_000_000, "millones": 1_000_000}


def norm(s):
    s = unicodedata.normalize("NFD", str(s or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^\w]+", "", s)


def proporcion(ruta):
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                              "-of", "csv=p=0", str(ruta)], capture_output=True, text=True).stdout
        w, h = out.strip().split("\n")[0].split(",")[:2]
        return int(w) / int(h)
    except Exception:
        return None


class Anclas:
    def __init__(self, W):
        self.W, self.cursor = W, 0

    def __call__(self, v, donde, errores, mover=True):
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return float(v)
        s = str(v).strip()
        m = re.match(r"^(.*?)(?::(fin))?([+-]\d+(?:\.\d+)?)?$", s)
        frase, fin, off = m.group(1), m.group(2), float(m.group(3) or 0)
        n = None
        if "@" in frase:
            frase, n = frase.rsplit("@", 1); n = int(n)
        toks = [norm(t) for t in frase.split() if norm(t)]
        if not toks:
            errores.append(f"{donde}: ancla vacía «{v}»."); return None
        ini = 0 if n else self.cursor
        vistos = 0
        for i in range(ini, len(self.W) - len(toks) + 1):
            if all(norm(self.W[i + k]["word"]) == toks[k] for k in range(len(toks))):
                vistos += 1
                if n is None or vistos == n:
                    j = i + len(toks) - 1
                    if mover:
                        self.cursor = i
                    return round((self.W[j]["end"] if fin else self.W[i]["start"]) + off, 3)
        errores.append(f"{donde}: no encuentro «{frase}» en la transcripción (buscando desde «{self.W[min(ini, len(self.W) - 1)]['word']}»).")
        return None


def fin_de_frase(W, t, pausa=0.3):
    """Fin de la frase que contiene t: la primera palabra después de t seguida de una pausa > pausa."""
    for i, w in enumerate(W):
        if w["end"] < t:
            continue
        sig = W[i + 1]["start"] if i + 1 < len(W) else None
        if sig is None or sig - w["end"] > pausa or (w["word"].strip()[-1:] in ".?!"):
            return w["end"]
    return W[-1]["end"]


def main():
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__)
    dest = Path(a[0]).resolve()
    reel = dest / "reel"; (reel / "assets").mkdir(parents=True, exist_ok=True)
    plan = json.loads((dest / "plan.json").read_text(encoding="utf-8"))
    W = [w for w in json.loads((dest / "captions.json").read_text(encoding="utf-8")) if (w.get("word") or "").strip()]
    sil = json.loads((dest / "silueta.json").read_text(encoding="utf-8")) if (dest / "silueta.json").exists() else None
    clon = json.loads((dest / "clon.json").read_text(encoding="utf-8")) if (dest / "clon.json").exists() else []
    src = dest / "_source_cut.mov"
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(src)]).decode())
    errores, avisos = [], []
    anc = Anclas(W)

    # ── gancho (A/B/C) ──
    gi = int(a[a.index("--gancho") + 1]) if "--gancho" in a else 0
    ganchos = plan.get("ganchos") or ([plan["gancho"]] if plan.get("gancho") else [])
    if len(ganchos) < 3:
        avisos.append(f"Hay {len(ganchos)} variante(s) de gancho: el gancho golpe pide 3 (A/B/C) en «ganchos».")
    g = dict(ganchos[min(gi, len(ganchos) - 1)]) if ganchos else None
    if g:
        n = len(((g.get("l1") or "") + " " + (g.get("l2") or "")).split())
        grande = [g.get("l1") or "", g.get("l2") or ""][min(int(g.get("grande", 0)), 1)]
        if not 2 <= n <= 5:
            avisos.append(f"Gancho «{g.get('l1')} / {g.get('l2')}»: {n} palabras (gancho golpe: de 2 a 5).")
        if len(grande) > 11:
            avisos.append(f"Gancho: la línea grande «{grande}» tiene {len(grande)} letras (≤ 11 para que llene el ancho).")
        if re.search(r"claude|prompt|skill|token", (g.get("l1", "") + g.get("l2", "")).lower()):
            avisos.append("Gancho: nombra Claude/prompt/skill. Gancho golpe: consciencia baja, sin herramientas.")
        h = anc(g.get("hasta"), "gancho.hasta", errores, mover=False) if g.get("hasta") else None
        g["hasta"] = round(h if h is not None else min(fin_de_frase(W, 0.05) + 0.15, 3.5), 3)

    # ── piezas: resolver anclas en orden ──
    piezas = plan.get("piezas", [])
    for k, p in enumerate(piezas):
        donde = f"Pieza {k} ({p.get('tipo')}{'/' + p['forma'] if p.get('forma') else ''})"
        if p.get("tipo") not in TIPOS:
            errores.append(f"{donde}: tipo desconocido. Tipos: {', '.join(sorted(TIPOS))}."); continue
        if p["tipo"] == "lamina" and p.get("forma") not in FORMAS:
            errores.append(f"{donde}: forma desconocida. Formas: {', '.join(sorted(FORMAS))}."); continue
        p["_en"] = anc(p.get("en"), donde + ".en", errores)
        for j, it in enumerate(p.get("items", []) or []):
            if isinstance(it, dict) and it.get("en") is not None:
                it["_en"] = anc(it["en"], f"{donde}.items[{j}].en", errores, mover=False)
        if p.get("etiqueta_en") is not None:
            p["_etiqueta_en"] = anc(p["etiqueta_en"], donde + ".etiqueta_en", errores, mover=False)
        for campo in ("enviar_en", "corazon_en"):
            if p.get(campo) is not None:
                p["_" + campo] = anc(p[campo], f"{donde}.{campo}", errores, mover=False)
        if p.get("hasta") is not None:
            p["_hasta"] = anc(p["hasta"], donde + ".hasta", errores, mover=False)
    if errores:
        for e in errores:
            print("❌", e)
        sys.exit(1)

    # ── hasta por defecto ──
    tramos_clon = [(c["desde"], c["hasta"]) for c in clon]
    def fin_tramo(t):
        """Dónde termina el tramo de la narradora que contiene t (empieza un clon) o el video."""
        sig = [c0 for c0, _ in tramos_clon if c0 > t + 0.05]
        return min(sig) if sig else dur
    pant = sorted([p for p in piezas if p["tipo"] in PANTALLA and p.get("_en") is not None], key=lambda p: p["_en"])
    for p in piezas:
        if p.get("_en") is None:
            continue
        sig = [q["_en"] for q in pant if q["_en"] > p["_en"] + 0.05]
        tope = min([fin_tramo(p["_en"])] + sig)
        if p.get("_hasta") is None:
            if p["tipo"] == "lamina":
                p["_hasta"] = tope
            elif p["tipo"] in ("palabra", "llave"):
                p["_hasta"] = min(tope, max(p["_en"] + 1.0, fin_de_frase(W, p["_en"]) + 0.25), p["_en"] + 3.0)
            else:   # tabla, tarjeta_video, comentario: hasta la próxima lámina/clon o el final
                sig_l = [q["_en"] for q in pant if q["tipo"] == "lamina" and q["_en"] > p["_en"] + 0.05]
                p["_hasta"] = min([fin_tramo(p["_en"]), dur] + sig_l)
        p["_hasta"] = round(min(p["_hasta"], dur), 3)
        if p["_hasta"] - p["_en"] < 0.35:
            avisos.append(f"{p['tipo']} en {p['_en']:.2f} s dura {p['_hasta'] - p['_en']:.2f} s: casi no se ve.")
        if p["tipo"] == "lamina" and p["_hasta"] - p["_en"] > 4.5:
            entradas = [it.get("_en") for it in p.get("items", []) if isinstance(it, dict) and it.get("_en")]
            marcas = sorted([p["_en"], p["_hasta"]] + entradas)
            if max(b - a for a, b in zip(marcas, marcas[1:])) > 3.0:
                avisos.append(f"Lámina {p.get('forma')} de {p['_en']:.1f} a {p['_hasta']:.1f} s: más de 3 s sin que entre nada (ancla items a lo que se dice).")

    # ── validaciones de contenido ──
    for k, p in enumerate(piezas):
        for campo in ("img", "avatar", "centro_img"):
            if p.get(campo) and not (reel / p[campo]).is_file():
                errores.append(f"Pieza {k}: no existe reel/{p[campo]}")
        for it in p.get("items", []) or []:
            if isinstance(it, dict) and it.get("img") and not (reel / it["img"]).is_file():
                errores.append(f"Pieza {k}: no existe reel/{it['img']}")
        for im in p.get("imgs", []) or []:
            if not (reel / im).is_file():
                errores.append(f"Pieza {k}: no existe reel/{im}")
        if p["tipo"] == "lamina" and p["forma"] in ("centro", "mapa") and not p.get("centro_img") and not (reel / "assets/yo.webm").exists():
            errores.append(f"Pieza {k}: lámina {p['forma']} sin reel/assets/yo.webm (corre recortar.py) ni «centro_img».")
        if p["tipo"] == "comentario" and norm(p.get("palabra")) == "yo":
            errores.append("El CTA «YO» está gastado y no dice de qué se trata: usa una palabra ligada al tema del video.")
        if p["tipo"] == "lamina" and p["forma"] == "mosaico_numero":
            num = int(re.sub(r"\D", "", str(p.get("numero", ""))) or 0)
            dichos = {int(w["word"].replace(".", "").replace(",", "")) for w in W if re.fullmatch(r"[\d.,]+", w["word"].strip(".,;:!?"))} \
                | {NUMEROS[norm(w["word"])] for w in W if norm(w["word"]) in NUMEROS}
            calc = p.get("calculo") or []
            prod = 1
            for c in calc:
                prod *= int(c)
            if calc and prod != num:
                errores.append(f"mosaico_numero: {' × '.join(map(str, calc))} = {prod}, no {num}. El número gigante sale de multiplicar los del guion.")
            if calc and not all(int(c) in dichos for c in calc):
                errores.append(f"mosaico_numero: algún factor de {calc} no se dice en el guion. Nada de cifras inventadas.")
            if not calc and num not in dichos:
                errores.append(f"mosaico_numero: {num} no se dice en el guion y no trae «calculo». Nada de cifras inventadas.")

    # nada encima del gancho: la tarjeta de video y la tabla van después del golpe
    if g:
        for p in piezas:
            if p["tipo"] in ("tarjeta_video", "palabra", "llave") and p.get("_en") is not None and p["_en"] < g["hasta"] - 0.05:
                avisos.append(f"{p['tipo']} en {p['_en']:.2f} s se encima con el gancho golpe (dura hasta {g['hasta']:.2f} s): muévela después.")

    # cada número dicho se ve (en los primeros 70 % del video, donde va la infografía)
    vivas = [(p["_en"] - 0.6, p["_hasta"]) for p in piezas if p.get("_en") is not None]
    for w in W:
        nw = norm(w["word"])
        es_num = re.fullmatch(r"\d+", nw) or (nw in NUMEROS and nw not in ("un", "una"))
        if es_num and not any(a0 <= w["start"] <= b0 for a0, b0 in vivas):
            avisos.append(f"{w['start']:.1f} s se dice «{w['word']}» y no hay lámina ni palabra en pantalla (cada número se ve).")

    # ritmo de los primeros 11 s: un cambio cada 0,5–1,5 s
    cambios = sorted({round(t, 2) for p in piezas if p.get("_en") is not None for t in (p["_en"], p["_hasta"]) if t < min(11, dur)}
                     | {round(t, 2) for c in tramos_clon for t in c if t < min(11, dur)}
                     | {round(it["_en"], 2) for p in piezas for it in (p.get("items") or []) if isinstance(it, dict) and it.get("_en") and it["_en"] < 11})
    marcas = [0.0] + sorted(cambios) + [min(11, dur)]
    hueco = max(b - c for c, b in zip(marcas, marcas[1:]))
    if hueco > 2.2:
        avisos.append(f"Ritmo: en los primeros 11 s hay {hueco:.1f} s sin cambio (la referencia cambia cada 0,5–1,5 s).")
    if not tramos_clon:
        avisos.append("Sin clon (clon.json vacío o ausente): el estilo pide cortes de ~0,5 s al clon como puntuación entre láminas.")
    if not g:
        avisos.append("Sin gancho: el cuadro 0 necesita el golpe (gancho golpe).")

    # ── base: la toma montada, sin audio (la voz se mezcla al final, intacta) ──
    base = reel / "assets" / "base.mp4"
    if not base.exists() or base.stat().st_mtime < src.stat().st_mtime:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-an", "-c:v", "libx264", "-crf", "16", "-preset", "fast",
                        "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", str(base)], check=True)

    # uniones de la narradora (no de los clones): punch-in alterno para disimular el salto
    cortes = plan.get("cortes")
    if cortes is None and (dest / "edl.json").exists():
        edl = json.loads((dest / "edl.json").read_text(encoding="utf-8"))
        cortes = [round(x["newStart"], 3) for x in edl[1:]]
    plan["cortes"] = cortes or []

    # ── efectos de sonido ──
    sfx = []
    def pon(t, nombre, vol):
        if 0 <= t < dur and not any(abs(h["t"] - t) < 0.06 and h["sfx"][:3] == nombre[:3] for h in sfx):
            sfx.append({"t": round(max(0, t), 3), "sfx": nombre, "vol": vol})
    if g:
        pon(0.0, "whoosh2", 0.6)
    k = 0
    for c0, c1 in tramos_clon:                       # whoosh en cada corte al clon y de vuelta
        pon(c0 - 0.12, ("whoosh1", "whoosh2")[k % 2], 0.5); k += 1
        pon(c1 - 0.12, ("whoosh1", "whoosh2")[k % 2], 0.45); k += 1
    for p in sorted([p for p in piezas if p.get("_en") is not None], key=lambda p: p["_en"]):
        t0, t1 = p["_en"], p["_hasta"]
        if p["tipo"] == "lamina":
            pon(t0 - 0.1, ("whoosh1", "whoosh2")[k % 2], 0.5); k += 1
            pon(t0 + 0.03, "pop1", 0.5)
            its = [it for it in (p.get("items") or []) if isinstance(it, dict)]
            for q, it in enumerate(its):
                if it.get("_en"):
                    pon(it["_en"] + 0.03, ("pop2", "pop1")[q % 2], 0.42)
            if p["forma"] == "mapa":
                for q, it in enumerate(its):
                    if it.get("_en"):
                        pon(it["_en"] - 0.05, "swoosh1", 0.25)
            if p["forma"] == "mosaico_numero":
                pon(t0 + 0.35, "ding1", 0.45)
            if p["forma"] in ("cuadricula", "lista") and not any(it.get("_en") for it in its):
                for q in range(min(len(its), 10)):
                    pon(t0 + 0.08 + q * (0.07 if p["forma"] == "cuadricula" else 0.16), ("click1", "click2")[q % 2], 0.3)
            if t1 < dur - 0.1 and not any(abs(t1 - q["_en"]) < 0.1 for q in pant):
                pon(t1 - 0.1, "whoosh1", 0.35)
        elif p["tipo"] in ("palabra", "llave"):
            pon(t0, "pop2", 0.55)
            if p["tipo"] == "llave":
                pon(t0 + 0.25, "swoosh1", 0.35)
                for q in range(len(p.get("imgs") or [])):
                    pon(t0 + 0.4 + q * 0.08, ("click1", "click2")[q % 2], 0.3)
        elif p["tipo"] == "tabla":
            pon(t0, "swoosh1", 0.45); pon(t0 + 0.05, "pop1", 0.4)
        elif p["tipo"] == "tarjeta_video":
            pon(t0, "pop1", 0.5)
        elif p["tipo"] == "comentario":
            pon(t0, "pop2", 0.5)
            pal = str(p.get("palabra", ""))
            ritmo = float(p.get("ritmo", 0.085))
            tt = t0 + 0.35
            libre = t1 - tt - 1.0          # teclear + enviar (0,25) + corazón (0,45) + 0,3 s para verlo
            if pal and len(pal) * ritmo > libre:
                ritmo = max(0.035, libre / len(pal))
                if len(pal) * ritmo > libre:
                    avisos.append(f"Comentario en {t0:.2f} s: no alcanza el tiempo para teclear, enviar y ver el corazón (ánclalo antes).")
            p["ritmo"] = round(ritmo, 3)
            for q, _ in enumerate(pal):
                pon(tt + q * ritmo, ("click1", "click2")[q % 2], 0.42)
            env = p.get("_enviar_en") or tt + len(pal) * ritmo + 0.25
            p["_enviar_en"] = round(env, 3)
            pon(env, "pop1", 0.5)
            cor = p.get("_corazon_en") or env + 0.45
            p["_corazon_en"] = round(cor, 3)
            pon(cor, "ding1", 0.45)
    sfx.sort(key=lambda h: h["t"])
    for h in sfx:
        if not (SFX_DIR / f"{h['sfx']}.wav").exists():
            errores.append(f"Falta el efecto {h['sfx']}.wav en {SFX_DIR}")
    (dest / "sfx_plan.json").write_text(encoding="utf-8", data=json.dumps(sfx, indent=1))

    # ── composición ──
    tams = {}
    for f in sorted((reel / "assets").glob("*")):
        if f.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
            r = proporcion(f)
            if r:
                tams["assets/" + f.name] = round(r, 4)
    marca = plan.get("marca", {})
    resuelto = {"duracion": round(dur, 3), "gancho": g, "piezas": piezas, "clon": clon, "cortes": plan["cortes"],
                "marca": {"color": marca.get("color", "#FFD630"), "tinta": marca.get("tinta", "#111111"),
                          "usuario": marca.get("usuario", ""), "avatar": marca.get("avatar", "")},
                "sil": {"cx": sil["centro_x"], "cy": sil["cabeza_y"]} if sil else {"cx": 540, "cy": 560},
                "hay_yo": (reel / "assets/yo.webm").exists(), "sub_y": plan.get("sub_y", 1060), "zoom_corte": plan.get("zoom_corte", 1.07)}
    (dest / "plan_resuelto.json").write_text(encoding="utf-8", data=json.dumps(resuelto, ensure_ascii=False, indent=1))
    html = (SKILL / "templates" / "reel.html").read_text(encoding="utf-8")
    yo = ('<video id="yo" class="clip" src="assets/yo.webm" data-start="0" data-duration="__DUR__" data-track-index="2" muted playsinline></video>'
          if resuelto["hay_yo"] else "")
    html = html.replace("__YO__", yo).replace("__DUR__", f"{dur:.3f}")
    html = html.replace("__PLAN__", json.dumps(resuelto, ensure_ascii=False)).replace("__PALABRAS__", json.dumps(W, ensure_ascii=False))
    html = html.replace("__TAMS__", json.dumps(tams))
    (reel / "index.html").write_text(encoding="utf-8", data=html)
    # final.py toma las uniones de edl.json para el micro-fundido de la voz.

    n_lam = sum(1 for p in piezas if p["tipo"] == "lamina")
    print(f"· duración {dur:.1f} s · {len(piezas)} piezas ({n_lam} láminas) · {len(tramos_clon)} cortes al clon · {len(sfx)} efectos")
    print(f"· gancho {'ABC'[min(gi, 2)]}: «{g.get('l1')} / {g.get('l2')}» hasta {g['hasta']:.2f} s" if g else "· sin gancho")
    for p in sorted([p for p in piezas if p.get("_en") is not None], key=lambda p: p["_en"]):
        print(f"   {p['_en']:6.2f}–{p['_hasta']:6.2f}  {p['tipo']}{'/' + p['forma'] if p.get('forma') else ''}  {p.get('chip') or p.get('grande') or p.get('palabra') or p.get('titulo') or ''}")
    for x in avisos:
        print("⚠️ ", x)
    for e in errores:
        print("❌", e)
    if errores:
        sys.exit(1)
    print(f"✅ {reel / 'index.html'}")


if __name__ == "__main__":
    main()
