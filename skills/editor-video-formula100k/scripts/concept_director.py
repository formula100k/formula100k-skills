#!/usr/bin/env python3
"""concept_director.py — segundo pase de Claude (después del corte) que detecta
MOMENTOS DE CONCEPTO NUEVO en el transcript y propone una representación visual para
ejemplificarlos. Híbrido: conceptos simples → card/infografía HTML; conceptos ricos
(ej. representar una skill, un sistema, una metáfora) → imagen generada (nano_banana).

NO genera imágenes ni edita el MANIFEST. Solo PROPONE: el flujo de la skill revisa
las propuestas con el usuario (checkpoint) y recién ahí genera cards/imágenes y agrega filas
al MANIFEST. Así no se gastan créditos Higgsfield a ciegas.

Mismo patrón que el pase semántico: HTTP nativo a la Messages API (sin SDK).

Uso:
  concept_director.py <captions.json> [--out concept_proposals.json]
                      [--model claude-opus-4-8] [--max 4] [--guion guion.txt]
Sale 'no_key' (y escribe []) si no hay ANTHROPIC_API_KEY → no bloquea el pipeline.

Salida: JSON list de
  {"keyword": "<palabra/expresión textual del transcript para anclar>",
   "concepto": "<nombre corto del concepto>",
   "tipo": "card" | "imagen",
   "prompt_visual": "<qué dibujar / qué poner en la card>",
   "t_hint": <segundos aprox>}
"""
import os, sys, json, urllib.request, urllib.error, ssl

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
DEFAULT_MODEL = "claude-opus-4-8"
DEFAULT_MAX = 4   # tope de conceptos por video (no saturar)

SYSTEM = """Eres el director visual de un reel educativo de FÓRMULA 100K (creación de contenido con IA, español neutro).
Lees el transcript de un video y detectas los momentos donde quien habla INTRODUCE UN CONCEPTO NUEVO que se entendería mejor con un apoyo visual: una skill, una herramienta, un sistema, un framework, una metáfora, un "modo", un flujo de pasos.

Para CADA concepto que de verdad merezca apoyo visual (no para todo), decides cómo representarlo:
- "card": concepto simple, textual o numérico → una infografía/tarjeta HTML (un título, 2-3 bullets, o un número con label). Barato e instantáneo.
- "imagen": concepto rico, abstracto o "visualizable" (representar una skill como un objeto/escena, un sistema como un diagrama ilustrado, una metáfora) → una imagen generada.

REGLAS:
- Devuelve SOLO un array JSON válido, sin texto extra, sin markdown.
- "keyword" DEBE ser una palabra o expresión CORTA copiada TEXTUALMENTE del transcript (para anclar el overlay por keyword). Elige una poco ambigua.
- "prompt_visual": si tipo="imagen", describe una escena clara y minimalista para un generador de imágenes (estilo limpio, fondo simple, sin texto incrustado). Si tipo="card", da el título y los bullets/numero exactos.
- Español neutro. No inventes datos: los números salen de lo que se dice.
- Calidad sobre cantidad: mejor 2-3 conceptos potentes que muchos flojos."""

def _ssl_ctx():
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()

def call_claude(prompt, api_key, model, system, max_tokens=2048, timeout=90):
    body = json.dumps({"model": model, "max_tokens": max_tokens, "system": system,
                       "messages": [{"role": "user", "content": prompt}]}).encode("utf-8")
    req = urllib.request.Request(ANTHROPIC_API_URL, data=body, method="POST",
        headers={"x-api-key": api_key, "anthropic-version": ANTHROPIC_VERSION,
                 "content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=_ssl_ctx()) as r:
            payload = json.loads(r.read().decode("utf-8"))
        return "".join(b.get("text", "") for b in payload.get("content", [])
                       if b.get("type") == "text")
    except (urllib.error.URLError, TimeoutError, ValueError, OSError):
        return None

def load_words(path):
    """Tolerante: acepta lista, {words:[...]}, o {segments:[{words:[...]}]}.
    Normaliza a [{text,start,end}]."""
    data = json.load(open(path))
    raw = data if isinstance(data, list) else (
        data.get("words") or [w for s in data.get("segments", []) for w in s.get("words", [])])
    out = []
    for w in raw:
        t = w.get("text", w.get("word", ""))
        if t and "start" in w:
            out.append({"text": t, "start": float(w["start"]), "end": float(w.get("end", w["start"]))})
    return out

def build_prompt(words, guion):
    # transcript con marcas de tiempo cada ~5s para que Claude estime t_hint
    lines, chunk, t0 = [], [], None
    for w in words:
        if t0 is None:
            t0 = w["start"]
        chunk.append(w["text"])
        if w["start"] - t0 >= 5.0:
            lines.append(f"[{t0:.0f}s] " + " ".join(chunk)); chunk, t0 = [], w["start"]
    if chunk:
        lines.append(f"[{t0:.0f}s] " + " ".join(chunk))
    transcript = "\n".join(lines)
    g = f"\n\nGUION/NORTE (contexto):\n{guion}\n" if guion else ""
    return (f"TRANSCRIPT (con marcas de tiempo):\n{transcript}{g}\n\n"
            "Devuelve el array JSON de conceptos a ilustrar (máximo los más potentes).")

def parse_array(reply):
    if not reply:
        return []
    s = reply.strip()
    a, b = s.find("["), s.rfind("]")
    if a == -1 or b == -1:
        return []
    try:
        arr = json.loads(s[a:b+1])
    except ValueError:
        return []
    clean = []
    for it in arr if isinstance(arr, list) else []:
        if not isinstance(it, dict):
            continue
        kw = (it.get("keyword") or "").strip()
        tipo = it.get("tipo") if it.get("tipo") in ("card", "imagen") else "card"
        if kw and it.get("prompt_visual"):
            clean.append({"keyword": kw, "concepto": it.get("concepto", kw),
                          "tipo": tipo, "prompt_visual": it["prompt_visual"],
                          "t_hint": it.get("t_hint", 0)})
    return clean

def keyword_in_transcript(kw, words):
    norm = lambda s: "".join(c for c in s.lower() if c.isalnum() or c == " ")
    text = norm(" ".join(w["text"] for w in words))
    return norm(kw) in text

def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__); sys.exit(1)
    captions = args[0]
    def opt(flag, default=None):
        return args[args.index(flag)+1] if flag in args else default
    out = opt("--out", os.path.join(os.path.dirname(os.path.abspath(captions)),
                                    "concept_proposals.json"))
    model = opt("--model", DEFAULT_MODEL)
    maxn = int(opt("--max", str(DEFAULT_MAX)))
    guion_path = opt("--guion")
    guion = open(guion_path).read() if guion_path and os.path.exists(guion_path) else None

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        json.dump([], open(out, "w"))
        print("no_key: sin ANTHROPIC_API_KEY → 0 conceptos (no bloquea)"); return

    words = load_words(captions)
    if len(words) < 8:
        json.dump([], open(out, "w")); print("nothing: transcript muy corto"); return

    reply = call_claude(build_prompt(words, guion), api_key, model, SYSTEM)
    props = parse_array(reply)
    # anclar: descartar los cuyo keyword no esté literal en el transcript
    props = [p for p in props if keyword_in_transcript(p["keyword"], words)][:maxn]
    json.dump(props, open(out, "w"), ensure_ascii=False, indent=2)
    print(f"✅ {len(props)} concepto(s) propuesto(s) → {out}")
    for p in props:
        print(f"  · [{p['tipo']}] {p['concepto']}  (ancla: '{p['keyword']}')")

if __name__ == "__main__":
    main()
