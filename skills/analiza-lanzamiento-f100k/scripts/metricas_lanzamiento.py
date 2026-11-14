#!/usr/bin/env python3
"""Calcula las métricas de un lanzamiento y arma el reporte HTML.

Solo usa la librería estándar de Python 3 (Mac y Windows).

Uso:
  python3 metricas_lanzamiento.py datos.json                 -> imprime las métricas en JSON
  python3 metricas_lanzamiento.py datos.json --md            -> imprime una tabla en markdown
  python3 metricas_lanzamiento.py datos.json --html salida.html [--analisis analisis.md]
  python3 metricas_lanzamiento.py plantilla.csv ...          -> también acepta el CSV de plantilla

Campos de datos.json (los que falten valen 0):
  nombre, inversion_ads, visitas_landing, leads, asistentes_en_vivo,
  sin_landing (true/false),
  precio_unico, ventas_unico, precio_mensual, ventas_mensual, precio_anual, ventas_anual,
  supuestos: {churn_mensual, churn_anual}            (opcional, en fracción: 0.15 = 15 %)
  referencias: {registro, show_up, venta, cpl, roas} (opcional, cambia las referencias)
"""
import csv
import html
import json
import math
import re
import sys
from datetime import date

# Referencias que usaba la app original. NO son un benchmark verificado:
# son supuestos de partida que la alumna puede cambiar en "referencias".
REFERENCIAS = {"registro": 40.0, "show_up": 30.0, "venta": 5.0, "cpl": 2.5, "roas": 3.0}
# Supuestos de churn de la app original (también editables en "supuestos").
SUPUESTOS = {"churn_mensual": 0.15, "churn_anual": 0.30}

CSV_COLS = {
    "launchName": "nombre", "inversionAds": "inversion_ads", "visitasLanding": "visitas_landing",
    "leadsGenerados": "leads", "asistentesEnVivo": "asistentes_en_vivo",
    "precioUnico": "precio_unico", "ventasUnico": "ventas_unico",
    "precioMensual": "precio_mensual", "ventasMensual": "ventas_mensual",
    "precioAnual": "precio_anual", "ventasAnual": "ventas_anual",
}


def leer(ruta):
    if ruta.lower().endswith(".csv"):
        with open(ruta, newline="", encoding="utf-8-sig") as f:
            fila = next(csv.DictReader(f))
        return {CSV_COLS.get(k.strip(), k.strip()): v for k, v in fila.items()}
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def num(d, k):
    try:
        return float(d.get(k) or 0)
    except (TypeError, ValueError):
        return 0.0


def div(a, b):
    return a / b if b else 0.0


def calcular(d):
    ref = {**REFERENCIAS, **(d.get("referencias") or {})}
    sup = {**SUPUESTOS, **(d.get("supuestos") or {})}
    sin_landing = str(d.get("sin_landing", "")).lower() in ("true", "1", "si", "sí")

    inv = num(d, "inversion_ads")
    visitas = num(d, "visitas_landing")
    leads = num(d, "leads")
    asist = num(d, "asistentes_en_vivo")
    pu, vu = num(d, "precio_unico"), num(d, "ventas_unico")
    pm, vm = num(d, "precio_mensual"), num(d, "ventas_mensual")
    pa, va = num(d, "precio_anual"), num(d, "ventas_anual")

    ventas = vu + vm + va
    ingresos = vu * pu + vm * pm + va * pa  # Mes 1, igual que la app
    registro = None if sin_landing else div(leads, visitas) * 100
    show_up = div(asist, leads) * 100
    conv_venta = div(ventas, asist) * 100
    cpl = div(inv, leads)
    cpa = div(inv, ventas)
    roas = div(ingresos, inv)
    ganancia = ingresos - inv
    ticket = div(ingresos, ventas)
    equilibrio = math.ceil(div(inv, ticket)) if ticket else None

    # Qué tan lejos está cada métrica de su referencia (1 = en la referencia).
    etapas = []
    if registro is not None:
        etapas.append(("registro", "Visitas → Leads", registro, ref["registro"], True))
    etapas += [
        ("show_up", "Leads → Asistentes (show-up)", show_up, ref["show_up"], True),
        ("venta", "Asistentes → Ventas", conv_venta, ref["venta"], True),
        ("cpl", "Costo por lead", cpl, ref["cpl"], False),
    ]
    comparadas = []
    for clave, nombre, valor, r, mas_es_mejor in etapas:
        if mas_es_mejor:
            ratio = div(valor, r)
        else:
            ratio = div(r, valor) if valor else 1.0
        comparadas.append({
            "clave": clave, "etapa": nombre, "valor": round(valor, 2), "referencia": r,
            "ratio": round(ratio, 3), "cumple": ratio >= 1,
        })
    # El eslabón más débil se busca entre las conversiones del embudo (no el CPL).
    conversiones = [c for c in comparadas if c["clave"] != "cpl"]
    debil = min(conversiones, key=lambda c: c["ratio"]) if conversiones else None

    # Dinero sobre la mesa: cuánto más se vendía si SOLO esa etapa llegaba a la referencia.
    s_reg, s_show, s_venta = div(leads, visitas), div(asist, leads), div(ventas, asist)
    mesa = {}
    if registro is not None and registro < ref["registro"]:
        v = visitas * ref["registro"] / 100 * s_show * s_venta
        mesa["registro"] = {"ventas_extra": round(v - ventas, 1), "dinero": round((v - ventas) * ticket, 2)}
    if show_up < ref["show_up"]:
        v = leads * ref["show_up"] / 100 * s_venta
        mesa["show_up"] = {"ventas_extra": round(v - ventas, 1), "dinero": round((v - ventas) * ticket, 2)}
    if conv_venta < ref["venta"]:
        v = asist * ref["venta"] / 100
        mesa["venta"] = {"ventas_extra": round(v - ventas, 1), "dinero": round((v - ventas) * ticket, 2)}

    # LTV con churn (solo si hay suscripciones). Supuestos editables.
    cm, ca = sup["churn_mensual"], sup["churn_anual"]
    def acumulado(meses):
        mensual = sum(vm * pm * (1 - cm) ** i for i in range(meses))
        anual = va * pa * (1 + sum((1 - ca) ** k for k in range(1, (meses - 1) // 12 + 1)))
        return vu * pu + mensual + anual
    hay_sub = vm > 0 or va > 0
    ltv = None
    if hay_sub:
        ltv = {}
        for m in (3, 6, 12):
            total = acumulado(m)
            ltv[f"{m}_meses"] = {
                "ingresos": round(total, 2), "roas": round(div(total, inv), 2),
                "ganancia": round(total - inv, 2),
            }
        ltv["ltv_por_suscriptor_mensual_12m"] = round(sum(pm * (1 - cm) ** i for i in range(12)), 2)
        ltv["ltv_por_suscriptor_mensual_total"] = round(div(pm, cm), 2) if cm else None
        ltv["renovaciones_anuales_esperadas"] = round(va * (1 - ca), 1)
        payback = next((m for m in range(1, 37) if acumulado(m) >= inv), None)
        ltv["mes_de_recuperacion"] = payback

    # Proyección con la MISMA inversión y el MISMO costo por lead.
    # pesimista = igual que hoy · conservador = el eslabón débil recorre la mitad
    # del camino hacia su referencia · optimista = el eslabón débil llega a la referencia.
    proyeccion = None
    if debil and ticket and leads:
        def escenario(avance):
            tasas = {"registro": s_reg, "show_up": s_show, "venta": s_venta}
            k = debil["clave"]
            if not debil["cumple"]:
                objetivo = ref[k] / 100
                tasas[k] = tasas[k] + (objetivo - tasas[k]) * avance
            if registro is not None:
                l = visitas * tasas["registro"]
                vis = visitas
            else:
                l, vis = leads, None
            a = l * tasas["show_up"]
            v = a * tasas["venta"]
            ing = v * ticket
            return {"visitas": round(vis) if vis else None, "leads": round(l), "asistentes": round(a),
                    "ventas": round(v, 1), "ingresos": round(ing, 2), "roas": round(div(ing, inv), 2)}
        proyeccion = {"etapa_que_mejora": debil["etapa"],
                      "pesimista": escenario(0), "conservador": escenario(0.5), "optimista": escenario(1)}

    return {
        "nombre": d.get("nombre") or "Mi lanzamiento",
        "sin_landing": sin_landing,
        "entradas": {"inversion_ads": inv, "visitas_landing": visitas, "leads": leads,
                     "asistentes_en_vivo": asist,
                     "tickets": {"unico": [pu, vu], "mensual": [pm, vm], "anual": [pa, va]}},
        "ventas": ventas,
        "ingresos_mes_1": round(ingresos, 2),
        "mrr_inicial": round(vm * pm, 2),
        "arr_inicial": round(va * pa, 2),
        "ganancia_neta": round(ganancia, 2),
        "conversion_registro": None if registro is None else round(registro, 1),
        "show_up": round(show_up, 1),
        "conversion_venta": round(conv_venta, 1),
        "cpl": round(cpl, 2),
        "cpa": round(cpa, 2),
        "roas": round(roas, 2),
        "ticket_promedio": round(ticket, 2),
        "ventas_para_equilibrio": equilibrio,
        "comparacion": comparadas,
        "eslabon_mas_debil": debil,
        "dinero_sobre_la_mesa": mesa,
        "ltv": ltv,
        "proyeccion": proyeccion,
        "referencias_usadas": ref,
        "supuestos_usados": sup if hay_sub else None,
    }


def money(x):
    if x is None:
        return "—"
    s = f"{abs(x):,.2f}"
    if s.endswith(".00"):
        s = s[:-3]
    return ("-$" if x < 0 else "$") + s


def pct(x):
    return "N/A (sin landing)" if x is None else f"{x:.1f} %"


def tabla_md(m):
    filas = [
        ("Inversión en ads", money(m["entradas"]["inversion_ads"])),
        ("Ingresos (mes 1)", money(m["ingresos_mes_1"])),
        ("Ganancia neta", money(m["ganancia_neta"])),
        ("ROAS", f'{m["roas"]}x'),
        ("Ventas", f'{m["ventas"]:g}'),
        ("Ticket promedio", money(m["ticket_promedio"])),
        ("Ventas para cubrir la inversión", m["ventas_para_equilibrio"] or "—"),
        ("Conversión de registro", pct(m["conversion_registro"])),
        ("Show-up", pct(m["show_up"])),
        ("Conversión a venta", pct(m["conversion_venta"])),
        ("Costo por lead (CPL)", money(m["cpl"])),
        ("Costo por venta (CPA)", money(m["cpa"])),
    ]
    out = ["| Métrica | Valor |", "|---|---|"] + [f"| {a} | {b} |" for a, b in filas]
    if m["eslabon_mas_debil"]:
        e = m["eslabon_mas_debil"]
        out.append(f'\n**Eslabón más débil:** {e["etapa"]} = {e["valor"]} (referencia supuesta: {e["referencia"]}).')
    return "\n".join(out)


# ---------- HTML ----------

def md_a_html(texto):
    """Markdown mínimo: títulos, viñetas, negritas y párrafos."""
    out, lista = [], False
    for linea in texto.splitlines():
        l = linea.rstrip()
        esc = html.escape(l)
        esc = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", esc)
        if re.match(r"^\s*[-*] ", l):
            if not lista:
                out.append("<ul>"); lista = True
            out.append("<li>" + re.sub(r"^\s*[-*] ", "", esc) + "</li>")
            continue
        if lista:
            out.append("</ul>"); lista = False
        if l.startswith("### "):
            out.append(f"<h4>{esc[4:]}</h4>")
        elif l.startswith("## "):
            out.append(f"<h3>{esc[3:]}</h3>")
        elif l.startswith("# "):
            out.append(f"<h3>{esc[2:]}</h3>")
        elif l.strip():
            out.append(f"<p>{esc}</p>")
    if lista:
        out.append("</ul>")
    return "\n".join(out)


def svg_embudo(m):
    e = m["entradas"]
    barras = []
    if not m["sin_landing"]:
        barras.append(("Visitas", e["visitas_landing"]))
    barras += [("Leads", e["leads"]), ("Asistentes", e["asistentes_en_vivo"]), ("Ventas", m["ventas"])]
    tope = max([v for _, v in barras] + [1])
    alto_fila, ancho = 46, 560
    partes = []
    for i, (nombre, v) in enumerate(barras):
        y = i * alto_fila
        w = max(4, (v / tope) * (ancho - 170))
        partes.append(
            f'<text x="0" y="{y + 27}" class="lbl">{nombre}</text>'
            f'<rect x="100" y="{y + 8}" width="{w:.1f}" height="28" rx="6" class="bar b{3 if nombre == "Ventas" else i}"/>'
            f'<text x="{106 + w:.1f}" y="{y + 27}" class="val">{v:,.0f}</text>'
        )
    return (f'<svg viewBox="0 0 {ancho} {alto_fila * len(barras)}" role="img" '
            f'aria-label="Embudo del lanzamiento">{"".join(partes)}</svg>')


def tarjetas_referencia(m):
    out = []
    for c in m["comparacion"]:
        es_dinero = c["clave"] == "cpl"
        val = money(c["valor"]) if es_dinero else f'{c["valor"]:.1f} %'
        ref = money(c["referencia"]) if es_dinero else f'{c["referencia"]:g} %'
        ancho = min(c["ratio"], 1) * 100
        estado = "ok" if c["cumple"] else "bajo"
        texto = "Llega a la referencia" if c["cumple"] else "Por debajo de la referencia"
        out.append(
            f'<div class="card"><div class="k">{html.escape(c["etapa"])}</div>'
            f'<div class="v">{val}</div><div class="track"><div class="fill {estado}" style="width:{ancho:.0f}%"></div></div>'
            f'<div class="s {estado}">{texto} · referencia supuesta {ref}</div></div>'
        )
    return "".join(out)


def armar_html(m, analisis_md=""):
    g = m["ganancia_neta"]
    resumen = [
        ("Inversión", money(m["entradas"]["inversion_ads"]), ""),
        ("Ingresos (mes 1)", money(m["ingresos_mes_1"]), "pos"),
        ("Ganancia neta", money(g), "pos" if g >= 0 else "neg"),
        ("ROAS", f'{m["roas"]}x', ""),
        ("Costo por venta", money(m["cpa"]), ""),
        ("Ventas", f'{m["ventas"]:g}', ""),
    ]
    stats = "".join(f'<div class="stat"><div class="k">{a}</div><div class="v {c}">{b}</div></div>' for a, b, c in resumen)
    conv = (f'<div class="conv"><span>Visitas → Leads <b>{pct(m["conversion_registro"])}</b></span>'
            f'<span>Leads → Asistentes <b>{pct(m["show_up"])}</b></span>'
            f'<span>Asistentes → Ventas <b>{pct(m["conversion_venta"])}</b></span></div>')
    ltv_html = ""
    if m["ltv"]:
        filas = "".join(
            f'<tr><td>{k.split("_")[0]} meses</td><td>{money(v["ingresos"])}</td><td>{v["roas"]}x</td><td>{money(v["ganancia"])}</td></tr>'
            for k, v in m["ltv"].items() if k.endswith("_meses"))
        s = m["supuestos_usados"]
        ltv_html = (
            '<section><h2>Ingreso recurrente proyectado</h2>'
            f'<p class="note">Supuesto (puedes cambiarlo): churn mensual {s["churn_mensual"]*100:g} % y '
            f'{s["churn_anual"]*100:g} % de suscripciones anuales que no renuevan.</p>'
            '<table><tr><th>Horizonte</th><th>Ingresos acumulados</th><th>ROAS</th><th>Ganancia</th></tr>'
            f'{filas}</table>'
            f'<p class="note">Recuperas la inversión en el mes {m["ltv"]["mes_de_recuperacion"] or "— (no en 36 meses)"}.</p></section>'
        )
    proy_html = ""
    if m["proyeccion"]:
        p = m["proyeccion"]
        filas = "".join(
            f'<tr><td>{n.capitalize()}</td><td>{p[n]["leads"]:,}</td><td>{p[n]["asistentes"]:,}</td>'
            f'<td>{p[n]["ventas"]:g}</td><td>{money(p[n]["ingresos"])}</td><td>{p[n]["roas"]}x</td></tr>'
            for n in ("pesimista", "conservador", "optimista"))
        proy_html = (
            '<section><h2>Proyección del próximo lanzamiento</h2>'
            f'<p class="note">Misma inversión y mismo costo por lead. Supuesto: solo mejora «{html.escape(p["etapa_que_mejora"])}» '
            '(pesimista = igual que hoy, conservador = la mitad del camino a la referencia, optimista = llega a la referencia).</p>'
            '<table><tr><th>Escenario</th><th>Leads</th><th>Asistentes</th><th>Ventas</th><th>Ingresos</th><th>ROAS</th></tr>'
            f'{filas}</table></section>'
        )
    analisis = f'<section class="analisis">{md_a_html(analisis_md)}</section>' if analisis_md.strip() else ""
    titulo = html.escape(m["nombre"])
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reporte · {titulo}</title>
<style>
:root{{--bg:#f6f7f9;--card:#fff;--ink:#1d2330;--mute:#6b7280;--line:#e5e7eb;--ok:#15803d;--bad:#c2410c;--a:#4f46e5}}
@media (prefers-color-scheme:dark){{:root{{--bg:#111318;--card:#1a1d24;--ink:#eef0f4;--mute:#9aa1ad;--line:#2b303a;--ok:#4ade80;--bad:#fb923c;--a:#818cf8}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 -apple-system,Segoe UI,Roboto,sans-serif}}
main{{max-width:880px;margin:0 auto;padding:32px 16px 64px}}h1{{margin:0 0 4px;font-size:28px}}h2{{font-size:20px;margin:0 0 12px}}
section{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px;margin:18px 0}}
.sub{{color:var(--mute);margin:0 0 18px}}.stats{{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}}
.stat{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px}}.k{{color:var(--mute);font-size:12px;text-transform:uppercase;letter-spacing:.04em}}
.v{{font-size:22px;font-weight:700}}.pos{{color:var(--ok)}}.neg{{color:var(--bad)}}
svg{{width:100%;height:auto}}.lbl{{font-size:14px;fill:var(--mute)}}.val{{font-size:14px;font-weight:700;fill:var(--ink)}}
.bar{{fill:var(--a)}}.b1{{opacity:.85}}.b2{{opacity:.7}}.b3{{fill:var(--ok)}}
.conv{{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:12px;color:var(--mute);font-size:14px}}.conv b{{color:var(--ink)}}
.cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}}.card{{border:1px solid var(--line);border-radius:12px;padding:14px}}
.track{{height:8px;background:var(--line);border-radius:6px;margin:8px 0;overflow:hidden}}.fill{{height:100%}}.fill.ok{{background:var(--ok)}}.fill.bajo{{background:var(--bad)}}
.s{{font-size:13px}}.s.ok{{color:var(--ok)}}.s.bajo{{color:var(--bad)}}.note{{color:var(--mute);font-size:14px}}
table{{width:100%;border-collapse:collapse;font-size:14px}}th,td{{text-align:left;padding:8px;border-bottom:1px solid var(--line)}}
.analisis h3{{margin:22px 0 8px}}.analisis h3:first-child{{margin-top:0}}footer{{color:var(--mute);font-size:13px;text-align:center;margin-top:24px}}
@media print{{body{{background:#fff}}section{{break-inside:avoid}}}}
</style></head><body><main>
<h1>Reporte de lanzamiento</h1><p class="sub">{titulo} · {date.today().strftime('%d/%m/%Y')}</p>
<div class="stats">{stats}</div>
<section><h2>Embudo</h2>{svg_embudo(m)}{conv}</section>
<section><h2>Tus números frente a la referencia</h2><div class="cards">{tarjetas_referencia(m)}</div>
<p class="note">Las referencias son supuestos de partida, no una verdad del mercado: cámbialas por las tuyas cuando tengas historial.</p></section>
{ltv_html}{proy_html}{analisis}
<footer>Para guardarlo en PDF: abre este archivo y usa Imprimir → Guardar como PDF.</footer>
</main></body></html>"""


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 1
    datos = leer(argv[1])
    m = calcular(datos)
    if "--html" in argv:
        salida = argv[argv.index("--html") + 1]
        analisis = ""
        if "--analisis" in argv:
            with open(argv[argv.index("--analisis") + 1], encoding="utf-8") as f:
                analisis = f.read()
        with open(salida, "w", encoding="utf-8") as f:
            f.write(armar_html(m, analisis))
        print(f"HTML guardado en {salida}")
    elif "--md" in argv:
        print(tabla_md(m))
    else:
        print(json.dumps(m, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
