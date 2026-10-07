#!/usr/bin/env python3
"""Baja la transcripción de un video de YouTube con marcas de tiempo [m:ss].

Uso:
  python3 transcripcion.py <url-o-id> [salida.txt]

Necesita: pip install youtube-transcript-api
Si la librería no está o YouTube bloquea la descarga, usa la skill transcripcion-youtube-formula100k
o el MCP de transcripción que tengas conectado.
"""
import re, sys

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    sys.exit('Falta la librería: pip install youtube-transcript-api')


def vid_id(arg):
    m = re.search(r'(?:v=|youtu\.be/|shorts/|embed/)([\w-]{11})', arg)
    return m.group(1) if m else arg.strip()


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    vid = vid_id(sys.argv[1])
    langs = ['es', 'es-419', 'es-MX', 'es-ES', 'en']
    try:
        try:
            segs = [(s.start, s.text) for s in YouTubeTranscriptApi().fetch(vid, languages=langs)]
        except AttributeError:  # versiones viejas de la librería
            segs = [(s['start'], s['text']) for s in YouTubeTranscriptApi.get_transcript(vid, languages=langs)]
    except Exception as e:
        sys.exit(f'No pude bajar la transcripción de {vid} ({type(e).__name__}). '
                 'Si dice RequestBlocked, YouTube está bloqueando esta IP: espera un rato o usa '
                 'la skill transcripcion-youtube-formula100k / el MCP de transcripción.')
    lines = [f'[{int(t)//60}:{int(t)%60:02d}] {txt}' for t, txt in segs]
    text = '\n'.join(lines)
    if len(sys.argv) > 2:
        open(sys.argv[2], 'w', encoding='utf8').write(text)
        print(f'{len(lines)} líneas guardadas en {sys.argv[2]}')
    else:
        print(text)


if __name__ == '__main__':
    main()
