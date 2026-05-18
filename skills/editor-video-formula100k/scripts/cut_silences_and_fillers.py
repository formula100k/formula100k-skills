#!/usr/bin/env python3
"""
Cut silences, Spanish filler words ("eh", "em", "uhh") and repeated stutters
("y, y, y…", "que que", "porque porque") from a video.

Usage:
  cut_silences_and_fillers.py <video_path> <dest_folder> [flags]

Flags:
  --min-silence FLOAT   gap (sec) to treat as silence and cut (default 0.08)
  --pad FLOAT           padding (sec) around each kept word (default 0.025)
  --no-dedupe           disable consecutive-stutter removal
  --dedupe-max-gap F    max gap between repeats to count as stutter (default 1.2)
  --no-recaption        skip word-level re-transcription of the cut video

Outputs (inside dest_folder):
  _source_cut.mov  — video with silences, fillers, and stutters removed
  edl.json         — list of {origStart, origEnd, newStart, newEnd} segments
  captions.json    — word-level timestamps of the CUT video (for subtitles)

Strategy:
  1. Extract mono 16kHz audio
  2. Transcribe with whisper --word-timestamps True
  3. Drop consecutive repeated words (stutters), keeping the LAST attempt
  4. Skip words matching FILLER_REGEX (eh/em/uh/ah/mm)
  5. Compute "keep" ranges; any gap > MIN_SILENCE between kept words is cut
  6. Use ffmpeg with select+aselect to build the cut video
  7. Re-transcribe the cut video with word timestamps for captions
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

DEFAULT_MIN_SILENCE = 0.08  # seconds — gap larger than this is treated as silence and cut
DEFAULT_PAD = 0.06  # seconds — padding around each kept word; gives the tail of the word room to breathe so consonants/vowels no se cortan
DEFAULT_DEDUPE_MAX_GAP = 1.2  # seconds — repeats farther apart than this aren't stutters
MIN_SEGMENT = 0.08  # don't keep segments smaller than this
FILLER_REGEX = re.compile(
    r'^[¿¡"\'(\[]*(eh+|em+|um+|uh+|ah+|mm+|ehm+|emm+)[.,;:!?\)\]\'\"…]*$',
    re.IGNORECASE,
)
_PUNCT_STRIP = re.compile(r'^[\W_]+|[\W_]+$', re.UNICODE)


def _normalize_token(text: str) -> str:
    """Lowercase, strip surrounding punctuation, drop accents — for dedupe matching."""
    s = _PUNCT_STRIP.sub('', text.strip().lower())
    s = unicodedata.normalize('NFD', s)
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn')


def remove_repeated_words(words: list[dict], max_gap: float) -> tuple[list[dict], list[str]]:
    """Collapse runs of consecutive identical words (stutters), keeping only the last.

    A "run" requires the same normalized token AND a gap ≤ max_gap between
    consecutive repeats (otherwise they're separate phrases, not a stutter).
    Returns (filtered_words, removed_tokens_for_reporting).
    """
    if not words:
        return words, []
    kept: list[dict] = []
    removed: list[str] = []
    i = 0
    while i < len(words):
        norm = _normalize_token(words[i]['word'])
        j = i
        # Extend the run while the next word matches AND the gap is small
        while j + 1 < len(words):
            next_norm = _normalize_token(words[j + 1]['word'])
            gap = words[j + 1]['start'] - words[j]['end']
            if next_norm and next_norm == norm and gap <= max_gap:
                removed.append(words[j]['word'])
                j += 1
            else:
                break
        # Keep only the last attempt of the run
        kept.append(words[j])
        i = j + 1
    return kept, removed


# ── Phrase-level restart removal ─────────────────────────────────────────
# Detects when Andrea restarts a sentence after a stumble: e.g.
#   "Si usas cloud para crear contenido... Si usas códigos de cloud..."
# Keeps only the LAST attempt of each restart chain.

import difflib  # for longest contiguous overlap

def _normalize_words(phrase: list[dict]) -> list[str]:
    return [_normalize_token(w['word']) for w in phrase]


def _ends_with_ellipsis(phrase: list[dict]) -> bool:
    if not phrase:
        return False
    last = phrase[-1]['word'].rstrip()
    return last.endswith('...') or last.endswith('…')


def _first_n_match(a: list[str], b: list[str], n: int) -> bool:
    if len(a) < n or len(b) < n:
        return False
    for i in range(n):
        if not a[i] or a[i] != b[i]:
            return False
    return True


def _lcsubstr_size(a: list[str], b: list[str]) -> int:
    if not a or not b:
        return 0
    matcher = difflib.SequenceMatcher(None, a, b, autojunk=False)
    return matcher.find_longest_match(0, len(a), 0, len(b)).size


def _split_phrases(words: list[dict], min_pause: float) -> list[list[dict]]:
    phrases: list[list[dict]] = []
    current: list[dict] = []
    for w in words:
        if current:
            gap = w['start'] - current[-1]['end']
            prev_word = current[-1]['word'].rstrip()
            ends_ellipsis = prev_word.endswith('...') or prev_word.endswith('…')
            # Sentence-ending punctuation `.!?` always marks a phrase boundary,
            # even with gap=0 (Whisper often transcribes back-to-back sentences).
            ends_sentence = bool(re.search(r'[.!?]', prev_word))
            if gap > min_pause or ends_ellipsis or ends_sentence:
                phrases.append(current)
                current = []
        current.append(w)
    if current:
        phrases.append(current)
    return phrases


def _is_restart(a: list[dict], b: list[dict], max_gap: float) -> bool:
    """Returns True if phrase a is a restart of phrase b.

    Differentiates restarts (Andrea stumbled) from list items (consecutive sentences
    starting the same way intentionally) by requiring either (a) very strong
    first-word match (4+), (b) substantial repeated chunk (LCS ≥ 4 AND ≥ 40%),
    or (c) shorter/unfinished `a` with weaker overlap.
    """
    if not a or not b:
        return False
    gap = b[0]['start'] - a[-1]['end']
    if gap > max_gap:
        return False
    a_norm = _normalize_words(a)
    b_norm = _normalize_words(b)

    # Count how many leading normalized words match
    first_match = 0
    for i in range(min(len(a_norm), len(b_norm))):
        if a_norm[i] and a_norm[i] == b_norm[i]:
            first_match += 1
        else:
            break

    lcs = _lcsubstr_size(a_norm, b_norm)
    a_ellipsis = _ends_with_ellipsis(a)
    a_shorter = len(a_norm) < 0.7 * max(1, len(b_norm))

    # Signal 1: very strong leading match (≥4 words). Hard to be a list item with 4-word prefix.
    if first_match >= 4:
        return True

    # Signal 2: large contiguous repeated chunk (≥4 words and ≥40% of shorter phrase).
    if lcs >= 4 and lcs >= 0.4 * min(len(a_norm), len(b_norm)):
        return True

    # Signal 3: 2-3 word leading match PLUS evidence that `a` was incomplete
    # (ends in ellipsis OR is much shorter than `b`).
    if first_match >= 2 and (a_ellipsis or a_shorter):
        return True

    # Signal 4: `a` ends in ellipsis (unfinished) + meaningful overlap with `b`.
    if a_ellipsis:
        if lcs >= 2:
            return True
        if a_norm and b_norm and a_norm[0] and a_norm[0] == b_norm[0]:
            return True
    return False


def remove_phrase_restarts(
    words: list[dict],
    min_pause: float = 0.35,
    max_gap: float = 3.5,
    lookahead: int = 3,
) -> tuple[list[dict], list[str]]:
    """Drop entire phrases that are restarts of a later phrase. Keeps the LAST attempt.

    Phrases are segmented at long pauses or sentence-ending punctuation. For each
    phrase, looks ahead up to `lookahead` phrases for a non-killed sibling that
    matches (same starting words, big contiguous overlap, or ellipsis + small overlap).
    """
    phrases = _split_phrases(words, min_pause)
    kill: set[int] = set()
    for i in range(len(phrases)):
        if i in kill:
            continue
        for k in range(1, lookahead + 1):
            j = i + k
            if j >= len(phrases):
                break
            if j in kill:
                continue
            # Effective gap: end of phrase i to start of phrase j
            gap = phrases[j][0]['start'] - phrases[i][-1]['end']
            if gap > max_gap + 2.0:
                break
            if _is_restart(phrases[i], phrases[j], max_gap=max_gap + 2.0):
                kill.add(i)
                break

    removed_texts = [
        ' '.join(w['word'] for w in phrases[i]) for i in sorted(kill)
    ]
    kept_words = [w for i, p in enumerate(phrases) if i not in kill for w in p]
    return kept_words, removed_texts


def run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT)


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
         '-of', 'default=noprint_wrappers=1:nokey=1', str(path)],
        text=True,
    )
    return float(out.strip())


def _transcribe_mlx(audio_path: Path, work_dir: Path) -> list[dict]:
    """macOS path: mlx-whisper via uvx (rápido, usa MLX/Apple Silicon)."""
    out_json = work_dir / (audio_path.stem + '.json')
    cmd = [
        'uvx', '--from', 'mlx-whisper', 'mlx_whisper', str(audio_path),
        '--model', 'mlx-community/whisper-large-v3-mlx',
        '--language', 'es',
        '--word-timestamps', 'True',
        '--output-format', 'json',
        '--output-dir', str(work_dir),
    ]
    subprocess.run(cmd, check=True, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
    data = json.loads(out_json.read_text(encoding='utf-8'))
    words: list[dict] = []
    for seg in data.get('segments', []):
        for w in seg.get('words', []):
            txt = w.get('word', '').strip()
            if txt:
                words.append({'word': txt, 'start': float(w['start']), 'end': float(w['end'])})
    return words


def _transcribe_faster_whisper(audio_path: Path, work_dir: Path) -> list[dict]:
    """Windows/Linux path: faster-whisper (CPU, funciona sin GPU)."""
    try:
        from faster_whisper import WhisperModel  # type: ignore
    except ImportError as e:
        raise RuntimeError(
            'faster-whisper no está instalado. Corre: pip install faster-whisper'
        ) from e
    model = WhisperModel('large-v3', device='cpu', compute_type='int8')
    segments, _info = model.transcribe(
        str(audio_path), language='es', word_timestamps=True
    )
    words: list[dict] = []
    for seg in segments:
        for w in (seg.words or []):
            txt = (w.word or '').strip()
            if txt:
                words.append({'word': txt, 'start': float(w.start), 'end': float(w.end)})
    return words


def transcribe_words(audio_path: Path, work_dir: Path) -> list[dict]:
    """Devuelve una lista plana de palabras con timestamps.
    En macOS usa mlx-whisper (rápido). En Windows/Linux usa faster-whisper."""
    if sys.platform == 'darwin':
        return _transcribe_mlx(audio_path, work_dir)
    return _transcribe_faster_whisper(audio_path, work_dir)


def compute_keep_segments(
    words: list[dict],
    total: float,
    min_silence: float,
    pad: float,
) -> list[tuple[float, float]]:
    """Build a list of (start, end) ranges to keep, in seconds.

    Drops:
      - Silence longer than min_silence (in the padded timeline)
      - Words matching FILLER_REGEX
    """
    kept: list[tuple[float, float]] = []
    for w in words:
        if FILLER_REGEX.match(w['word'].strip()):
            continue
        kept.append((max(0.0, w['start'] - pad), min(total, w['end'] + pad)))

    if not kept:
        return [(0.0, total)]

    # Merge overlapping / near segments, but break on long silences
    merged: list[list[float]] = [list(kept[0])]
    for s, e in kept[1:]:
        prev_end = merged[-1][1]
        if s - prev_end <= min_silence:
            merged[-1][1] = max(prev_end, e)
        else:
            merged.append([s, e])

    # Drop tiny segments
    return [(s, e) for s, e in merged if (e - s) >= MIN_SEGMENT]


def cut_video(source: Path, segments: list[tuple[float, float]], out: Path) -> None:
    """Render the cut video using ffmpeg with select+aselect filters."""
    if not segments:
        raise ValueError('No segments to keep')

    # Build select expression: 'between(t,a,b)+between(t,c,d)+...'
    sel = '+'.join(f'between(t,{s:.3f},{e:.3f})' for s, e in segments)
    vf = f"select='{sel}',setpts=N/FRAME_RATE/TB"
    af = f"aselect='{sel}',asetpts=N/SR/TB"

    cmd = [
        'ffmpeg', '-y', '-i', str(source),
        '-vf', vf, '-af', af,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
        '-c:a', 'aac', '-b:a', '192k',
        '-movflags', '+faststart',
        str(out),
    ]
    subprocess.run(cmd, check=True, stderr=subprocess.PIPE)


def build_edl(segments: list[tuple[float, float]]) -> list[dict]:
    """Translate kept segments into an EDL mapping orig→new times."""
    edl: list[dict] = []
    new_t = 0.0
    for s, e in segments:
        dur = e - s
        edl.append({
            'origStart': round(s, 3),
            'origEnd': round(e, 3),
            'newStart': round(new_t, 3),
            'newEnd': round(new_t + dur, 3),
        })
        new_t += dur
    return edl


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('source')
    ap.add_argument('dest')
    ap.add_argument('--min-silence', type=float, default=DEFAULT_MIN_SILENCE,
                    help=f'gap (sec) to treat as silence and cut (default {DEFAULT_MIN_SILENCE})')
    ap.add_argument('--pad', type=float, default=DEFAULT_PAD,
                    help=f'padding (sec) around each kept word (default {DEFAULT_PAD})')
    ap.add_argument('--no-dedupe', action='store_true',
                    help='disable consecutive-stutter removal')
    ap.add_argument('--dedupe-max-gap', type=float, default=DEFAULT_DEDUPE_MAX_GAP,
                    help=f'max gap between repeats to count as stutter '
                         f'(default {DEFAULT_DEDUPE_MAX_GAP})')
    ap.add_argument('--no-phrase-dedupe', action='store_true',
                    help='disable phrase-level restart removal (keep all attempts)')
    ap.add_argument('--phrase-max-gap', type=float, default=3.5,
                    help='max gap between phrase attempts to count as restart (default 3.5)')
    ap.add_argument('--no-recaption', action='store_true',
                    help='Skip word-level re-transcription of the cut video')
    args = ap.parse_args()

    source = Path(args.source).expanduser().resolve()
    dest = Path(args.dest).expanduser().resolve()
    if not source.exists():
        print(f'Source not found: {source}', file=sys.stderr)
        return 1
    dest.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as td:
        work = Path(td)
        audio = work / 'audio.wav'
        print(f'[1/5] Extracting audio...', file=sys.stderr)
        subprocess.run(
            ['ffmpeg', '-y', '-i', str(source), '-vn', '-ac', '1',
             '-ar', '16000', '-c:a', 'pcm_s16le', str(audio)],
            check=True, stderr=subprocess.DEVNULL,
        )

        print(f'[2/5] Transcribing source with word timestamps...', file=sys.stderr)
        words = transcribe_words(audio, work)
        print(f'      → {len(words)} words', file=sys.stderr)

        if args.no_dedupe:
            stutters: list[str] = []
        else:
            words, stutters = remove_repeated_words(words, args.dedupe_max_gap)
            print(f'      stutters collapsed: {len(stutters)} '
                  f'({", ".join(stutters[:8])}{"..." if len(stutters) > 8 else ""})',
                  file=sys.stderr)

        if args.no_phrase_dedupe:
            phrase_kills: list[str] = []
        else:
            words, phrase_kills = remove_phrase_restarts(
                words, max_gap=args.phrase_max_gap
            )
            print(f'      phrase restarts dropped: {len(phrase_kills)}',
                  file=sys.stderr)
            for ph in phrase_kills[:10]:
                snippet = ph if len(ph) <= 70 else ph[:67] + '...'
                print(f'        − {snippet}', file=sys.stderr)
            if len(phrase_kills) > 10:
                print(f'        ... ({len(phrase_kills) - 10} more)', file=sys.stderr)

        total = probe_duration(source)
        segments = compute_keep_segments(words, total, args.min_silence, args.pad)
        cut_total = sum(e - s for s, e in segments)
        ratio = cut_total / total if total else 0
        print(f'[3/5] Keep segments: {len(segments)} | '
              f'{cut_total:.2f}s of {total:.2f}s ({ratio:.0%}) | '
              f'min_silence={args.min_silence}s pad={args.pad}s',
              file=sys.stderr)

        # Count fillers removed (the original word list before dedupe is gone,
        # so report from the dedupe-filtered list — close enough for telemetry)
        fillers = [w['word'] for w in words if FILLER_REGEX.match(w['word'].strip())]
        print(f'      filler tokens removed: {len(fillers)} '
              f'({", ".join(fillers[:8])}{"..." if len(fillers) > 8 else ""})',
              file=sys.stderr)

        out_video = dest / '_source_cut.mov'
        print(f'[4/5] Rendering cut video → {out_video.name}', file=sys.stderr)
        cut_video(source, segments, out_video)

        edl = build_edl(segments)
        (dest / 'edl.json').write_text(json.dumps(edl, indent=2), encoding='utf-8')

        if args.no_recaption:
            print('[5/5] Skipped re-captioning (--no-recaption)', file=sys.stderr)
            cap_words = None
        else:
            print(f'[5/5] Re-transcribing cut video for captions...', file=sys.stderr)
            cut_audio = work / 'cut_audio.wav'
            subprocess.run(
                ['ffmpeg', '-y', '-i', str(out_video), '-vn', '-ac', '1',
                 '-ar', '16000', '-c:a', 'pcm_s16le', str(cut_audio)],
                check=True, stderr=subprocess.DEVNULL,
            )
            cap_words = transcribe_words(cut_audio, work)
            (dest / 'captions.json').write_text(
                json.dumps(cap_words, indent=2), encoding='utf-8'
            )
            print(f'      → captions.json ({len(cap_words)} words)', file=sys.stderr)

        # ── Post-cut phrase-dedupe pass ─────────────────────────────────
        # mlx-whisper sometimes merges restarts at the source-transcription level
        # (when condition_on_previous_text=True kicks in on long audio). The
        # POST-cut recaption transcribes each segment fresher and tends to split
        # restarts correctly. So we re-run phrase-dedupe on the cleaner captions
        # and produce a final tightened cut.
        if (not args.no_phrase_dedupe and not args.no_recaption and cap_words):
            clean_words, post_kills = remove_phrase_restarts(
                cap_words, max_gap=args.phrase_max_gap
            )
            if post_kills:
                print(f'[6/6] Post-cut phrase-dedupe: dropping {len(post_kills)} more restarts',
                      file=sys.stderr)
                for ph in post_kills[:10]:
                    snippet = ph if len(ph) <= 70 else ph[:67] + '...'
                    print(f'        − {snippet}', file=sys.stderr)
                if len(post_kills) > 10:
                    print(f'        ... ({len(post_kills) - 10} more)', file=sys.stderr)

                # Convert kept word timestamps into ffmpeg-select segments
                PAD = max(args.pad, 0.06)
                MERGE_GAP = max(args.min_silence, 0.1)
                refined: list[tuple[float, float]] = []
                if clean_words:
                    cur_s = max(0.0, clean_words[0]['start'] - PAD)
                    cur_e = clean_words[0]['end'] + PAD
                    for w in clean_words[1:]:
                        s = max(0.0, w['start'] - PAD)
                        e = w['end'] + PAD
                        if s - cur_e <= MERGE_GAP:
                            cur_e = max(cur_e, e)
                        else:
                            refined.append((cur_s, cur_e))
                            cur_s, cur_e = s, e
                    refined.append((cur_s, cur_e))

                refined_video = dest / '_source_cut_refined.mov'
                cut_video(out_video, refined, refined_video)
                refined_video.replace(out_video)
                refined_total = sum(e - s for s, e in refined)
                print(f'        cut: {cut_total:.2f}s → {refined_total:.2f}s', file=sys.stderr)
                cut_total = refined_total

                # Re-transcribe the refined cut for final captions
                with tempfile.TemporaryDirectory() as td2:
                    work2 = Path(td2)
                    final_audio = work2 / 'final.wav'
                    subprocess.run(
                        ['ffmpeg', '-y', '-i', str(out_video), '-vn', '-ac', '1',
                         '-ar', '16000', '-c:a', 'pcm_s16le', str(final_audio)],
                        check=True, stderr=subprocess.DEVNULL,
                    )
                    final_words = transcribe_words(final_audio, work2)
                (dest / 'captions.json').write_text(
                    json.dumps(final_words, indent=2), encoding='utf-8'
                )
                print(f'        captions: {len(final_words)} words', file=sys.stderr)
            else:
                print(f'[6/6] Post-cut phrase-dedupe: no further restarts found',
                      file=sys.stderr)

    print(f'\nDone.', file=sys.stderr)
    print(f'  cut video:  {out_video}', file=sys.stderr)
    print(f'  edl.json:   {dest / "edl.json"}', file=sys.stderr)
    print(f'  duration:   {total:.2f}s → {cut_total:.2f}s', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
