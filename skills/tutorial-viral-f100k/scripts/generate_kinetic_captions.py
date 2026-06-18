#!/usr/bin/env python3
"""captions.json (word-level) → captions_kinetic.json (chunks de 1-2 palabras).

Usage:
  generate_kinetic_captions.py <DEST_FOLDER> [--max-words 2] [--max-gap 0.45]

Reads:  $DEST/captions.json
Writes: $DEST/captions_kinetic.json
"""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path


def _word(w: dict) -> str:
    return (w.get("word") or w.get("text") or "").strip()


def chunk_words(words: list[dict], max_words: int = 2, max_gap: float = 0.45) -> list[dict]:
    chunks: list[dict] = []
    cur: list[dict] = []

    def flush():
        if not cur:
            return
        chunks.append({
            "text": " ".join(_word(w) for w in cur),
            "start": round(cur[0]["start"], 3),
            "end": round(cur[-1]["end"], 3),
        })
        cur.clear()

    for w in words:
        if not _word(w):
            continue
        if cur:
            gap = w["start"] - cur[-1]["end"]
            if gap > max_gap or len(cur) >= max_words:
                flush()
        cur.append(w)
    flush()
    return chunks


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("dest")
    ap.add_argument("--max-words", type=int, default=2)
    ap.add_argument("--max-gap", type=float, default=0.45)
    args = ap.parse_args()
    dest = Path(args.dest).expanduser().resolve()
    cap = dest / "captions.json"
    if not cap.exists():
        print(f"captions.json not found at {cap}", file=sys.stderr)
        return 1
    words = json.loads(cap.read_text(encoding="utf-8"))
    chunks = chunk_words(words, args.max_words, args.max_gap)
    out = dest / "captions_kinetic.json"
    out.write_text(json.dumps(chunks, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {out} ({len(chunks)} chunks)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
