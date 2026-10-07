#!/usr/bin/env python3
"""Lista los últimos videos de un canal de YouTube con vistas y duración, y marca los outliers.

Uso:
  python3 canal_videos.py @handle            (o la URL del canal)
  python3 canal_videos.py @handle --json salida.json

Lee la página pública /videos (los ~30 videos más recientes). No necesita API key.
Un "outlier" es un video con 5 veces o más la mediana de vistas del canal (★); 50 veces o más es mega outlier (★★).
Esos son los que hay que estudiar: el resto muestra lo que el canal hace normalmente.
"""
import json, re, sys, statistics, urllib.request


def handle_from(arg):
    m = re.search(r'@([\w.\-]+)', arg)
    if not m:
        sys.exit('Pasa el @handle del canal o su URL (ej: @j_r25)')
    return m.group(1)


def parse_views(txt):
    # "642 mil visualizaciones", "1,5 mil", "2,3 M", "833 visualizaciones", "1.2K views"
    t = txt.lower().replace('\xa0', ' ')
    m = re.search(r'([\d.,]+)\s*(mil|k|m|mill|b)?', t)
    if not m:
        return None
    num = m.group(1)
    if m.group(2):
        num = num.replace(',', '.')
    else:
        num = num.replace('.', '').replace(',', '')
    try:
        n = float(num)
    except ValueError:
        return None
    mult = {'mil': 1e3, 'k': 1e3, 'm': 1e6, 'mill': 1e6, 'b': 1e9}.get(m.group(2), 1)
    return int(n * mult)


def fetch(handle):
    req = urllib.request.Request(
        f'https://www.youtube.com/@{handle}/videos',
        headers={'Accept-Language': 'es-ES,es;q=0.9', 'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=30).read().decode('utf8')


def parse(html):
    m = re.search(r'<script id="yt-initial-data"[^>]*>(.*?)</script>', html, re.S) \
        or re.search(r'var ytInitialData = (\{.*?\});</script>', html, re.S)
    if not m:
        sys.exit('No encontré los datos del canal en la página (¿cambió YouTube el formato?)')
    data = json.loads(m.group(1))
    items, subs, name = [], None, None
    raw = json.dumps(data, ensure_ascii=False)
    s = re.search(r'"content":\s*"([^"]*suscriptor[^"]*|[^"]*subscriber[^"]*)"', raw)
    subs = s.group(1) if s else None
    t = re.search(r'"channelMetadataRenderer":\s*\{"title":\s*"([^"]+)"', raw)
    name = t.group(1) if t else None

    def walk(o):
        if isinstance(o, dict):
            if 'richItemRenderer' in o:
                items.append(o['richItemRenderer']); return
            for v in o.values(): walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    walk(data)

    videos = []
    for it in items:
        txt = json.dumps(it, ensure_ascii=False)
        vid = re.search(r'"contentId":\s*"([\w-]{11})"', txt) or re.search(r'"videoId":\s*"([\w-]{11})"', txt)
        title = re.search(r'"lockupMetadataViewModel":\s*\{"title":\s*\{"content":\s*"((?:[^"\\]|\\.)*)"', txt) \
            or re.search(r'"title":\s*\{"runs":\s*\[\{"text":\s*"((?:[^"\\]|\\.)*)"', txt)
        views = re.search(r'"(?:accessibilityLabel|content|simpleText)":\s*"([^"]*(?:visualizaci|views|vistas)[^"]*)"', txt)
        dur = re.search(r'"text":\s*"(\d{1,2}:\d{2}(?::\d{2})?)"', txt)
        when = re.search(r'"content":\s*"((?:hace|[^"]*ago)[^"]*)"', txt)
        if not vid or not title:
            continue
        videos.append({
            'id': vid.group(1),
            'url': f'https://www.youtube.com/watch?v={vid.group(1)}',
            'titulo': json.loads('"' + title.group(1) + '"'),
            'vistas_texto': views.group(1) if views else None,
            'vistas': parse_views(views.group(1)) if views else None,
            'duracion': dur.group(1) if dur else None,
            'publicado': when.group(1) if when else None,
        })
    return name, subs, videos


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    handle = handle_from(sys.argv[1])
    name, subs, videos = parse(fetch(handle))
    vals = [v['vistas'] for v in videos if v['vistas'] is not None]
    med = statistics.median(vals) if vals else 0
    for v in videos:
        v['x_mediana'] = round(v['vistas'] / med, 1) if med and v['vistas'] is not None else None
        v['outlier'] = bool(v['x_mediana'] and v['x_mediana'] >= 5)
    total = sum(vals) or 1
    print(f'Canal: {name or handle} · {subs or "suscriptores ?"} · {len(videos)} videos · mediana {med:,.0f} vistas')
    for i, v in enumerate(videos, 1):
        x = v['x_mediana'] or 0
        flag = '★★ MEGA OUTLIER' if x >= 50 else '★ OUTLIER' if x >= 5 else ''
        print(f"{i:>2}. {v['vistas_texto'] or '?':>24} | {v['duracion'] or '?':>7} | x{v['x_mediana'] or '?':<5} | {v['id']} | {v['titulo']} {flag}")
    out = [v for v in videos if v['outlier']]
    if out:
        share = sum(v['vistas'] for v in out) / total * 100
        print(f'\n{len(out)} outlier(s) concentran el {share:.0f}% de las vistas. Estudia esos primero.')
    if '--json' in sys.argv:
        path = sys.argv[sys.argv.index('--json') + 1]
        json.dump({'canal': name, 'handle': handle, 'suscriptores': subs, 'mediana': med, 'videos': videos},
                  open(path, 'w', encoding='utf8'), ensure_ascii=False, indent=2)
        print(f'Guardado en {path}')


if __name__ == '__main__':
    main()
