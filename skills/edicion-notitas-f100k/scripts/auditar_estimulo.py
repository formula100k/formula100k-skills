#!/usr/bin/env python3
"""Auditoría de estímulo de un notitas ANTES de entregar.

Lista TODOS los tramos de cara sola > 5 s (sin escena encima) y todos los huecos > 2,5 s
sin nada nuevo en pantalla (escena, notita, sticker/meme/gancho, lámina, mockup).
El gancho collage (sticker de 0 s) cuenta como estímulo y como «no cara sola».

uso: python3 -I auditar_estimulo.py <DEST con PLAN.json, captions.json y escenas.json>
       [--cara 5] [--hueco 2.5]
Sale con código 1 si hay algo que arreglar: no se entrega así.
"""
import json, re, sys, unicodedata
from pathlib import Path

args = sys.argv[1:]
if not args:
    sys.exit(__doc__)
D = Path(args[0]).resolve()
CARA = float(args[args.index('--cara') + 1]) if '--cara' in args else 5.0
HUECO = float(args[args.index('--hueco') + 1]) if '--hueco' in args else 2.5


def norm(s):
    s = unicodedata.normalize('NFKD', s.lower()).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9 ]', '', s).strip()


caps = json.loads((D / 'captions.json').read_text())
if isinstance(caps, dict):
    caps = caps.get('words') or caps.get('segments') or []
W = [(norm(w.get('word', w.get('text', ''))), w['start'], w['end']) for w in caps]
T = max((w[2] for w in W), default=0)


def ancla(frase):
    """Primera vez que se dice la frase (acepta '#2' para la segunda)."""
    n = 1
    if '#' in frase:
        frase, k = frase.rsplit('#', 1)
        n = int(k) if k.isdigit() else 1
    toks = norm(frase).split()
    vistos = 0
    for i in range(len(W)):
        if all(i + j < len(W) and W[i + j][0].startswith(t[:max(3, len(t) - 2)]) for j, t in enumerate(toks)):
            vistos += 1
            if vistos == n:
                return W[i][1]
    return None


plan = json.loads((D / 'PLAN.json').read_text())
esc_f = D / 'escenas.json'
escenas = [tuple(e) for e in json.loads(esc_f.read_text())['escenas']] if esc_f.exists() else []

estimulos, tapa_cara, sin_ancla = [], list(escenas), []
for clave in ('notitas', 'stickers', 'laminas', 'mockups'):
    for x in plan.get(clave, []) or []:
        t = x.get('t')
        if t is None and x.get('en'):
            t = ancla(x['en'])
        if t is None:
            sin_ancla.append(f"{clave}: {x.get('en') or x.get('texto') or x.get('src')}")
            continue
        dur = x.get('dur')
        if dur is None and isinstance(x.get('hasta'), str):
            h = ancla(x['hasta'])
            dur = (h - t) if h else 1.0
        dur = dur or 1.0
        estimulos.append((t, t + dur))
        # el gancho a pantalla completa y las láminas tapan la cara igual que una escena
        if clave == 'laminas' or (clave == 'stickers' and t < 0.5 and (x.get('w') or 0) >= 900):
            tapa_cara.append((t, t + dur))

estimulos += escenas


def huecos(iv, minimo):
    iv = sorted(iv)
    out, cur = [], 0.0
    for a, b in iv:
        if a - cur > minimo:
            out.append((cur, a))
        cur = max(cur, b)
    if T - cur > minimo:
        out.append((cur, T))
    return out


cara = huecos(tapa_cara, CARA)
vacios = huecos(estimulos, HUECO)
cob = sum(b - a for a, b in escenas) / T * 100 if T else 0

print(f'[auditoría] {D.name} · {T:.1f} s · escenas {cob:.0f} % · {len(estimulos)} estímulos')
for a, b in cara:
    print(f'  ✗ cara sola {b - a:.1f} s ({a:.1f}–{b:.1f}): «{" ".join(w[0] for w in W if a <= w[1] < b)[:90]}»')
for a, b in vacios:
    print(f'  ✗ hueco sin estímulo {b - a:.1f} s ({a:.1f}–{b:.1f})')
for s in sin_ancla:
    print(f'  ? sin ancla: {s}')
if cara or vacios:
    print('[auditoría] ✗ falta estímulo: agrega una escena (≤ 5 s, 3–5 recortes) o una notita/meme en cada tramo marcado')
    sys.exit(1)
print(f'[auditoría] ✅ cara sola ≤ {CARA:g} s y ningún hueco > {HUECO:g} s')
