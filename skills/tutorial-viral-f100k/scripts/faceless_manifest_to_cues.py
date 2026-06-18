#!/usr/bin/env python3
"""MANIFEST.md (preset faceless) → cues.json para la composición tutorial-faceless.

Usage:
  faceless_manifest_to_cues.py <DEST_FOLDER> [--out cues.json]
Reads:  $DEST/MANIFEST.md  (+ $DEST/captions.json opcional para warnings)
Writes: $DEST/cues.json
"""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path

# Reusar helpers del motor talking-head (mismo repo de skills).
ENGINE = Path(__file__).resolve().parents[2] / "editor-video-formula100k" / "scripts"
sys.path.insert(0, str(ENGINE))
from manifest_to_cues import (  # noqa: E402
    _section, _table_rows, _cell, _to_float, _to_int, _strip_code, _clean_inline,
    _normalize_match, warn_missing_keywords,
)

DEF_HOOK_DUR = 3.0
DEF_CTA_DUR = 3.5
DEF_CARD_WIDTH = 700
DEF_CARD_DUR = 2.4
DEF_BG_DUR = 4.0
DEF_BROLL_DUR = 3.0


def _grab(sec: str, label: str) -> str | None:
    m = re.search(rf'\*?\*?\s*{re.escape(label)}\s*\*?\*?\s*[:\-]\s*(.+?)\s*$',
                  sec, re.IGNORECASE | re.MULTILINE)
    return _clean_inline(m.group(1)) if m else None


def _single_card(text: str, names: tuple[str, ...], default_dur: float) -> dict | None:
    sec = _section(text, *names)
    if not sec:
        return None
    src = _grab(sec, 'Archivo') or _grab(sec, 'Src')
    if not src:
        return None
    dur = _grab(sec, 'Duración') or _grab(sec, 'Duracion') or _grab(sec, 'Duration')
    return {"src": _strip_code(src), "duration": _to_float(dur or '', default_dur)}


def parse_background(text: str) -> list[dict]:
    sec = _section(text, 'Fondo', 'Background')
    if not sec:
        return []
    out: list[dict] = []
    for cells in _table_rows(sec):
        kw, src = _cell(cells, 0), _strip_code(_cell(cells, 1))
        if not kw or not src:
            continue
        style = _cell(cells, 3).lower() or 'fullscreen'
        if style not in {'monitor', 'fullscreen'}:
            style = 'fullscreen'
        out.append({"keyword": kw, "src": src,
                    "duration": _to_float(_cell(cells, 2), DEF_BG_DUR), "style": style})
    return out


def parse_cards(text: str) -> list[dict]:
    sec = _section(text, 'Cards', 'Card')
    if not sec:
        return []
    out: list[dict] = []
    for cells in _table_rows(sec):
        kw, src = _cell(cells, 0), _strip_code(_cell(cells, 1))
        if not kw or not src:
            continue
        pos = _cell(cells, 4).lower().strip() or 'center'
        if pos not in {'center', 'bottom', 'top'}:
            pos = 'center'
        out.append({"keyword": kw, "src": src,
                    "width": _to_int(_cell(cells, 2), DEF_CARD_WIDTH),
                    "duration": _to_float(_cell(cells, 3), DEF_CARD_DUR),
                    "position": pos,
                    "rotation": _to_float(_cell(cells, 5), 0.0)})
    return out


def parse_broll(text: str) -> list[dict]:
    sec = _section(text, 'B-roll', 'Broll')
    if not sec:
        return []
    out: list[dict] = []
    for cells in _table_rows(sec):
        kw, src = _cell(cells, 0), _strip_code(_cell(cells, 1))
        if not kw or not src:
            continue
        style = _cell(cells, 3).lower() or 'monitor-photo'
        if style not in {'monitor-photo', 'clean'}:
            style = 'monitor-photo'
        out.append({"keyword": kw, "src": src,
                    "duration": _to_float(_cell(cells, 2), DEF_BROLL_DUR), "style": style})
    return out


def parse_captions(text: str) -> dict:
    sec = _section(text, 'Captions', 'Subtitulos', 'Subtítulos')
    enabled, pos = True, 'lower-third'
    if sec:
        en = _grab(sec, 'Activado') or _grab(sec, 'Enabled')
        if en and en.lower() in {'no', 'false', 'off', '0'}:
            enabled = False
        p = _grab(sec, 'Posición') or _grab(sec, 'Posicion') or _grab(sec, 'Position')
        if p and p.lower() in {'center', 'centro'}:
            pos = 'center'
    return {"enabled": enabled, "position": pos}


def parse_faceless(text: str) -> dict:
    return {
        "hookCard": _single_card(text, ('Tarjeta gancho', 'Tarjeta Gancho', 'Hook card'), DEF_HOOK_DUR),
        "background": parse_background(text),
        "cards": parse_cards(text),
        "broll": parse_broll(text),
        "cta": _single_card(text, ('CTA', 'Cta'), DEF_CTA_DUR),
        "captions": parse_captions(text),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('dest')
    ap.add_argument('--out', default=None)
    args = ap.parse_args()
    dest = Path(args.dest).expanduser().resolve()
    md = dest / 'MANIFEST.md'
    if not md.exists():
        print(f'MANIFEST.md not found at {md}', file=sys.stderr)
        return 1
    text = md.read_text(encoding='utf-8')
    cues = parse_faceless(text)
    captions_path = dest / 'captions.json'
    if captions_path.exists():
        try:
            caps = json.loads(captions_path.read_text(encoding='utf-8'))
            blob = _normalize_match(' '.join((w.get('word') or w.get('text') or '') for w in caps))
            warn_missing_keywords('background', cues['background'], blob)
            warn_missing_keywords('cards', cues['cards'], blob)
            warn_missing_keywords('broll', cues['broll'], blob)
        except json.JSONDecodeError as e:
            print(f'[warn] captions.json ilegible: {e}', file=sys.stderr)
    out = Path(args.out) if args.out else (dest / 'cues.json')
    out.write_text(json.dumps(cues, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'wrote {out}', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
