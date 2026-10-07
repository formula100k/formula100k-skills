#!/usr/bin/env python3
"""Mide el ritmo de un guion o transcripción: giros por minuto, huecos sin giro y palabras por minuto.

Uso:
  python3 densidad_giros.py transcripcion.txt            (con marcas [m:ss] de transcripcion.py)
  python3 densidad_giros.py guion.txt --wpm 200          (guion sin tiempos: estima el tiempo a 200 palabras/min)

Qué mirar:
  - "uno cada X s": en los videos virales analizados va de 11 a 16 s. Si tu guion pasa de 25 s, le falta tensión.
  - tramos sin giro: en los virales el más largo fue de 41 s. Más de 45 s seguidos sin giro es donde la gente se va.
"""
import re, sys

GIROS = ['sin embargo', 'pero', 'de repente', 'acto seguido', 'en ese momento', 'entonces', 'mientras tanto',
         'más tarde', 'al día siguiente', 'no obstante', 'justo', 'de pronto', 'lo que no sabía', 'sin saber',
         'resulta que', 'hasta que', 'por desgracia', 'para su sorpresa', 'aunque', 'días después', 'tiempo después']


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    raw = open(sys.argv[1], encoding='utf8').read()
    wpm = float(sys.argv[sys.argv.index('--wpm') + 1]) if '--wpm' in sys.argv else 200
    # convierte cada palabra en (segundo, palabra)
    words, t = [], 0.0
    stamps = list(re.finditer(r'\[(\d+):(\d{2})\]|\[(\d+)\]', raw))
    if stamps:
        for i, m in enumerate(stamps):
            sec = int(m.group(1)) * 60 + int(m.group(2)) if m.group(1) else int(m.group(3))
            end = stamps[i + 1].start() if i + 1 < len(stamps) else len(raw)
            for w in raw[m.end():end].split():
                words.append((sec, w))
    else:
        for w in raw.split():
            words.append((t, w)); t += 60 / wpm
    if not words:
        sys.exit('El archivo está vacío')
    text = ' '.join(w for _, w in words).lower()
    dur = max(words[-1][0], 1)
    # posiciones de giro -> segundo aproximado
    starts, pos = [], 0
    for _, w in words:
        starts.append(pos); pos += len(w) + 1
    hits = []
    for g in GIROS:
        for m in re.finditer(r'\b' + re.escape(g) + r'\b', text):
            idx = max(i for i, s in enumerate(starts) if s <= m.start())
            hits.append((words[idx][0], g))
    hits.sort()
    print(f'Duración: {int(dur)//60}:{int(dur)%60:02d} · palabras: {len(words)} · {len(words)/dur*60:.0f} palabras/min')
    print(f'Conectores de giro: {len(hits)} · uno cada {dur/max(len(hits),1):.1f} s')
    counts = {}
    for _, g in hits: counts[g] = counts.get(g, 0) + 1
    print('Más usados:', ', '.join(f'{g} ({n})' for g, n in sorted(counts.items(), key=lambda x: -x[1])[:8]))
    marks = [0] + [h[0] for h in hits] + [dur]
    gaps = [(a, b) for a, b in zip(marks, marks[1:]) if b - a > 30]
    if gaps:
        print('Tramos de más de 30 s sin giro (más de 45 s = revisar sí o sí):')
        for a, b in gaps:
            print(f'  {int(a)//60}:{int(a)%60:02d} → {int(b)//60}:{int(b)%60:02d} ({b-a:.0f} s)' + ('  ⚠ revisar' if b - a > 45 else ''))
    else:
        print('Ningún tramo pasa de 30 s sin giro. Buen ritmo.')


if __name__ == '__main__':
    main()
