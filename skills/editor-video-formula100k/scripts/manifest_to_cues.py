#!/usr/bin/env python3
"""
Parse the keyword-based MANIFEST.md (FORMULA 100K reel-viral preset) → cues.json.

Usage:
  manifest_to_cues.py <DEST_FOLDER> [--out cues.json]

Reads:
  $DEST/MANIFEST.md
  $DEST/captions.json     (opcional — para warning si una keyword no aparece)

Writes:
  $DEST/cues.json         (consumido por scripts/render.ts del template Remotion)

Esquema de salida (consumido por CreaContenidoViral):
  {
    "header":       { "line1": str, "line2": str },
    "emphasisCues": [{ "keyword": str, "text": str, "duration"?: float, "startOffset"?: float }],
    "overlayCues":  [{ "keyword": str, "src": str,  "width"?: int,      "duration"?: float }],
    "brollCues":    [{ "keyword": str, "src": str,  "duration"?: float, "style"?: "monitor-photo"|"clean" }]
  }
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

DEFAULT_EMPHASIS_DURATION = 1.6
DEFAULT_OVERLAY_WIDTH = 480
DEFAULT_OVERLAY_DURATION = 3.0
DEFAULT_BROLL_DURATION = 3.5
DEFAULT_BROLL_STYLE = 'monitor-photo'


def _section(text: str, *names: str) -> str | None:
    """Return body of the first matching H2 section (case-insensitive, accent-tolerant)."""
    def normalize(s: str) -> str:
        return (s.lower()
                .replace('á', 'a').replace('é', 'e').replace('í', 'i')
                .replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n'))

    targets = {normalize(n) for n in names}
    headings = list(re.finditer(r'^##\s+(.+?)\s*$', text, re.MULTILINE))
    for i, h in enumerate(headings):
        title = normalize(h.group(1))
        if title in targets:
            start = h.end()
            end = headings[i + 1].start() if i + 1 < len(headings) else len(text)
            return text[start:end].strip()
    return None


def _table_rows(section: str) -> list[list[str]]:
    """Parse a markdown table. Returns list of cell lists (header excluded)."""
    rows: list[list[str]] = []
    header_seen = False
    for line in section.splitlines():
        line = line.strip()
        if not line.startswith('|'):
            continue
        if re.match(r'^\|[\s\-:|]+\|?$', line):
            header_seen = True
            continue
        cells = [c.strip() for c in line.strip('|').split('|')]
        if not header_seen:
            header_seen = True
            continue
        rows.append(cells)
    return rows


def _cell(cells: list[str], i: int) -> str:
    return cells[i].strip() if i < len(cells) else ''


def _to_float(s: str, default: float) -> float:
    s = s.strip()
    if not s or s in {'—', '-', '–'}:
        return default
    try:
        return float(s.replace(',', '.'))
    except ValueError:
        return default


def _to_int(s: str, default: int) -> int:
    s = s.strip()
    if not s or s in {'—', '-', '–'}:
        return default
    try:
        return int(float(s.replace(',', '.')))
    except ValueError:
        return default


def _strip_code(s: str) -> str:
    return s.strip().strip('`').strip()


def _clean_inline(s: str) -> str:
    """Strip markdown bold/backticks from a captured value.
    NO toca underscores — son válidos en paths (T1_G1_foo.png)."""
    return re.sub(r'[*`]+', '', s).strip().strip('"').strip("'")


DEFAULT_HEADER_HIDE_AFTER = 8.0  # segundos — el header funciona como gancho, no debe quedarse todo el video


def parse_header(text: str) -> dict:
    sec = _section(text, 'Header')
    line1 = ''
    line2 = ''
    hide_after: float | None = None
    if sec:
        for line in sec.splitlines():
            m = re.search(r'L[ií]nea\s*1.*?[:\-]\s*(.+?)\s*$', line, re.IGNORECASE)
            if m:
                line1 = _clean_inline(m.group(1))
                continue
            m = re.search(r'L[ií]nea\s*2.*?[:\-]\s*(.+?)\s*$', line, re.IGNORECASE)
            if m:
                line2 = _clean_inline(m.group(1))
                continue
            m = re.search(
                r'(?:Esconder\s+despu[eé]s|Hide\s*After|Ocultar\s+despu[eé]s)\s*\**\s*[:\-]\**\s*([\d.,]+)',
                line, re.IGNORECASE,
            )
            if m:
                hide_after = _to_float(_clean_inline(m.group(1)), 0.0)
    out: dict = {'line1': line1, 'line2': line2}
    # Si el MANIFEST no especifica un override, el header desaparece a los 8s por default.
    effective_hide = hide_after if (hide_after is not None and hide_after > 0) else DEFAULT_HEADER_HIDE_AFTER
    out['hideAfter'] = effective_hide
    return out


def parse_emphasis(text: str) -> list[dict]:
    sec = _section(text, 'Énfasis', 'Enfasis')
    if not sec:
        return []
    cues: list[dict] = []
    for cells in _table_rows(sec):
        keyword = _cell(cells, 0)
        body = _cell(cells, 1).strip('"').strip("'")
        if not keyword or not body:
            continue
        cue: dict = {
            'keyword': keyword,
            'text': body,
            'duration': _to_float(_cell(cells, 2), DEFAULT_EMPHASIS_DURATION),
        }
        offset = _to_float(_cell(cells, 3), 0.0)
        if offset != 0.0:
            cue['startOffset'] = offset
        cues.append(cue)
    return cues


def parse_overlays(text: str) -> list[dict]:
    sec = _section(text, 'Overlays', 'Overlay')
    if not sec:
        return []
    cues: list[dict] = []
    for cells in _table_rows(sec):
        keyword = _cell(cells, 0)
        src = _strip_code(_cell(cells, 1))
        if not keyword or not src:
            continue
        cue: dict = {
            'keyword': keyword,
            'src': src,
            'width': _to_int(_cell(cells, 2), DEFAULT_OVERLAY_WIDTH),
            'duration': _to_float(_cell(cells, 3), DEFAULT_OVERLAY_DURATION),
        }
        pos_raw = _cell(cells, 4).lower().strip()
        if pos_raw in {'top', 'bottom'}:
            cue['position'] = pos_raw
        cues.append(cue)
    return cues


def parse_hook_cue(text: str) -> dict | None:
    """Parsea la sección `## Gancho visual` (singular). Formato esperado:

    ## Gancho visual

    - **Archivo:** `IA/hook_image.png`
    - **Posición:** right | left      (default: right)
    - **Inicio:** 0.3                  (segundos, default: 0.3)
    - **Duración:** 2.2                (segundos, default: 2.2)
    - **Ancho:** 360                   (px, default: 360)
    - **Rotación:** 3                  (grados, default: 3 right / -3 left)
    """
    sec = _section(text, 'Gancho visual', 'Gancho Visual', 'Hook visual', 'Hook Visual')
    if not sec:
        return None

    def grab(label: str) -> str | None:
        m = re.search(rf'\*?\*?\s*{re.escape(label)}\s*\*?\*?\s*[:\-]\s*(.+?)\s*$',
                      sec, re.IGNORECASE | re.MULTILINE)
        return _clean_inline(m.group(1)) if m else None

    src = grab('Archivo') or grab('Src') or grab('src')
    if not src:
        return None

    cue: dict = {'src': _strip_code(src)}
    pos = grab('Posición') or grab('Posicion') or grab('Position')
    if pos and pos.lower() in {'left', 'right', 'izquierda', 'derecha'}:
        cue['position'] = 'left' if pos.lower() in {'left', 'izquierda'} else 'right'
    start = grab('Inicio') or grab('Start')
    if start:
        cue['start'] = _to_float(start, 0.3)
    dur = grab('Duración') or grab('Duracion') or grab('Duration')
    if dur:
        cue['duration'] = _to_float(dur, 2.2)
    width = grab('Ancho') or grab('Width')
    if width:
        cue['width'] = _to_int(width, 360)
    rot = grab('Rotación') or grab('Rotacion') or grab('Rotation')
    if rot:
        cue['rotation'] = _to_float(rot, 3.0)
    return cue


def parse_broll(text: str) -> list[dict]:
    sec = _section(text, 'B-roll', 'Broll')
    if not sec:
        return []
    cues: list[dict] = []
    for cells in _table_rows(sec):
        keyword = _cell(cells, 0)
        src = _strip_code(_cell(cells, 1))
        if not keyword or not src:
            continue
        style = _cell(cells, 3).lower() or DEFAULT_BROLL_STYLE
        if style not in {'monitor-photo', 'clean'}:
            style = DEFAULT_BROLL_STYLE
        cues.append({
            'keyword': keyword,
            'src': src,
            'duration': _to_float(_cell(cells, 2), DEFAULT_BROLL_DURATION),
            'style': style,
        })
    return cues


def _normalize_match(s: str) -> str:
    s = s.lower()
    for a, b in (('á', 'a'), ('é', 'e'), ('í', 'i'), ('ó', 'o'), ('ú', 'u'), ('ñ', 'n')):
        s = s.replace(a, b)
    return re.sub(r'[^a-z0-9 ]+', '', s)


def warn_missing_keywords(cue_kind: str, cues: list[dict], blob: str) -> int:
    missing = 0
    for c in cues:
        kw = _normalize_match(c['keyword'])
        if kw and kw not in blob:
            print(f'[warn] {cue_kind}: keyword no aparece en captions: '
                  f'{c["keyword"]!r}', file=sys.stderr)
            missing += 1
    return missing


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('dest', help='Folder con MANIFEST.md (y opcionalmente captions.json)')
    ap.add_argument('--out', default=None, help='Output cues.json (default: $DEST/cues.json)')
    args = ap.parse_args()

    dest = Path(args.dest).expanduser().resolve()
    md = dest / 'MANIFEST.md'
    if not md.exists():
        print(f'MANIFEST.md not found at {md}', file=sys.stderr)
        return 1

    text = md.read_text(encoding='utf-8')

    cues = {
        'header': parse_header(text),
        'emphasisCues': parse_emphasis(text),
        'overlayCues': parse_overlays(text),
        'brollCues': parse_broll(text),
        'hookCue': parse_hook_cue(text),
    }

    # Optional sanity check: warn if any keyword doesn't appear in captions.json.
    captions_path = dest / 'captions.json'
    if captions_path.exists():
        try:
            captions = json.loads(captions_path.read_text(encoding='utf-8'))
            blob = _normalize_match(' '.join(
                (w.get('word') or w.get('text') or '') for w in captions
            ))
            missing = (
                warn_missing_keywords('emphasis', cues['emphasisCues'], blob)
                + warn_missing_keywords('overlay', cues['overlayCues'], blob)
                + warn_missing_keywords('broll', cues['brollCues'], blob)
            )
            if missing:
                print(f'[warn] {missing} keyword(s) sin match — esos cues '
                      f'no aparecerán en el render', file=sys.stderr)
        except json.JSONDecodeError as e:
            print(f'[warn] no se pudo leer captions.json: {e}', file=sys.stderr)

    out_path = Path(args.out) if args.out else (dest / 'cues.json')
    out_path.write_text(
        json.dumps(cues, indent=2, ensure_ascii=False) + '\n',
        encoding='utf-8',
    )
    print(f'wrote {out_path}', file=sys.stderr)
    print(f'  header:       "{cues["header"]["line1"]}" / "{cues["header"]["line2"]}"',
          file=sys.stderr)
    print(f'  emphasisCues: {len(cues["emphasisCues"])}', file=sys.stderr)
    print(f'  overlayCues:  {len(cues["overlayCues"])}', file=sys.stderr)
    print(f'  brollCues:    {len(cues["brollCues"])}', file=sys.stderr)
    print(f'  hookCue:      {"yes — " + cues["hookCue"]["src"] if cues["hookCue"] else "no"}',
          file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
