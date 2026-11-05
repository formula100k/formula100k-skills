"""Arma un primer plan automático (config.json) a partir de palabras.json.

Es el punto de partida: Claude (o tú) lo afina eligiendo las palabras que pegan.

Uso: python plan.py CARPETA_DE_TRABAJO palabra|linea
"""
import json
import os
import sys

from comun import palabras

VACIAS = set("""a al algo ante antes así aun aún bien cada como cómo con contra cual cuando de del desde donde
el ella ellas ellos en entre era es esa ese eso esta este esto estos estas fue ha hay hace haz la las le les lo
los más me mi mis mucho muy nada ni no nos o otra otro para pero poco por porque que qué se ser si sí sin sobre
solo son su sus también te tan tanto tiene tu tú tus un una uno unos unas va vas ya yo y e""".split())


def limpia(w):
    return w.strip(".,;:¡!¿?\"'()«»…").strip()


def frases(pal, pausa=0.28, max_pal=7):
    """Parte la transcripción en frases por pausas, puntuación o largo."""
    grupos, actual = [], []
    for i, p in enumerate(pal):
        actual.append(p)
        fin = p["w"].rstrip()[-1:] in ".?!,;:"
        hueco = i + 1 < len(pal) and pal[i + 1]["s"] - p["e"] > pausa
        sig_mayus = i + 1 < len(pal) and pal[i + 1]["w"][:1].isupper()
        if fin or hueco or sig_mayus or len(actual) >= max_pal:
            grupos.append(actual)
            actual = []
    if actual:
        grupos.append(actual)
    return grupos


def plan_palabra(pal):
    golpes = []
    for g in frases(pal):
        llenas = [p for p in g if limpia(p["w"]).lower() not in VACIAS and len(limpia(p["w"])) > 2]
        if not llenas:
            continue
        # las dos más largas, en el orden en que se dicen
        top = sorted(sorted(llenas, key=lambda p: -len(limpia(p["w"])))[:2], key=lambda p: p["s"])
        golpe = {"desde": round(g[0]["s"], 2), "hasta": round(g[-1]["e"] + 0.15, 2)}
        if len(top) == 2:
            golpe.update(arriba=limpia(top[0]["w"]).lower(), abajo=limpia(top[1]["w"]).lower(),
                         abajo_en=round(top[1]["s"], 2))
        else:
            golpe.update(arriba="", abajo=limpia(top[0]["w"]).lower(), abajo_en=round(top[0]["s"], 2))
        golpes.append(golpe)
    # cada golpe dura hasta que empieza el siguiente (sin huecos vacíos de menos de 0,6 s)
    for a, b in zip(golpes, golpes[1:]):
        if b["desde"] - a["hasta"] < 0.6:
            a["hasta"] = b["desde"]
    return {"estilo": "palabra", "subtitulos": True, "golpes": golpes}


FIGURAS = ["circulo", "pendulo", "esfera", "flor", "espiral", "reloj"]


def plan_linea(pal):
    escenas, n = [], 0
    for i, g in enumerate(frases(pal, max_pal=9)):
        texto = " ".join(limpia(p["w"]) for p in g).lower()
        modo = "linea" if i % 3 == 2 else "persona"
        escenas.append({"desde": round(g[0]["s"], 2), "hasta": round(g[-1]["e"] + 0.1, 2), "modo": modo,
                        "figura": FIGURAS[n % len(FIGURAS)] if modo == "linea" else None, "frase": texto})
        if modo == "linea":
            n += 1
    for a, b in zip(escenas, escenas[1:]):
        a["hasta"] = b["desde"]
    if escenas:
        escenas[0]["desde"] = 0
    return {"estilo": "linea", "subtitulos": False, "escenas": escenas}


def main():
    trabajo, estilo = sys.argv[1], sys.argv[2]
    pal = palabras(trabajo)
    if not pal:
        raise SystemExit("Falta palabras.json: corre primero palabras.py")
    plan = plan_palabra(pal) if estilo == "palabra" else plan_linea(pal)
    ruta = os.path.join(trabajo, f"config-{estilo}.json")
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(plan, f, ensure_ascii=False, indent=2)
    print(f"Plan → {ruta}")


if __name__ == "__main__":
    main()
