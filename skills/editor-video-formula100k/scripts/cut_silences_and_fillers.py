#!/usr/bin/env python3
"""
Cut silences and Spanish filler words ("eh", "em", "uhh") from a video.

Usage:
  cut_silences_and_fillers.py <video_path> <dest_folder>

Outputs (inside dest_folder):
  _source_cut.mov  — video with silences and fillers removed
  edl.json         — list of {origStart, origEnd, newStart, newEnd} segments
  captions.json    — word-level timestamps of the CUT video (for subtitles)

Strategy:
  1. Extract mono 16kHz audio
  2. Transcribe with mlx-whisper --word-timestamps True → words.json
  3. Compute "keep" ranges:
     - between consecutive words, drop gap > MIN_SILENCE
     - skip words matching FILLER_REGEX
     - add small padding (PAD seconds) before/after each kept word for natural pacing
  4. Use ffmpeg with select+aselect to build the cut video
  5. Re-transcribe the cut video with word timestamps for captions
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

MIN_SILENCE = 0.15  # seconds — gap larger than this is treated as silence and trimmed
PAD = 0.025  # seconds — padding around each kept word to avoid clipped consonants
MIN_SEGMENT = 0.08  # don't keep segments smaller than this
FILLER_REGEX = re.compile(
    r'^[¿¡"\'(\[]*(eh+|em+|um+|uh+|ah+|mm+|ehm+|emm+)[.,;:!?\)\]\'\"…]*$',
    re.IGNORECASE,
)


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


def compute_keep_segments(words: list[dict], total: float) -> list[tuple[float, float]]:
    """Build a list of (start, end) ranges to keep, in seconds.

    Drops:
      - Silence longer than MIN_SILENCE
      - Words matching FILLER_REGEX (with PAD removed too)
    """
    kept: list[tuple[float, float]] = []
    for w in words:
        if FILLER_REGEX.match(w['word'].strip()):
            continue
        kept.append((max(0.0, w['start'] - PAD), min(total, w['end'] + PAD)))

    if not kept:
        return [(0.0, total)]

    # Merge overlapping / near segments, but break on long silences
    merged: list[list[float]] = [list(kept[0])]
    for s, e in kept[1:]:
        prev_end = merged[-1][1]
        if s - prev_end <= MIN_SILENCE:
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

        total = probe_duration(source)
        segments = compute_keep_segments(words, total)
        cut_total = sum(e - s for s, e in segments)
        ratio = cut_total / total if total else 0
        print(f'[3/5] Keep segments: {len(segments)} | '
              f'{cut_total:.2f}s of {total:.2f}s ({ratio:.0%})', file=sys.stderr)

        # Count fillers removed
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

    print(f'\nDone.', file=sys.stderr)
    print(f'  cut video:  {out_video}', file=sys.stderr)
    print(f'  edl.json:   {dest / "edl.json"}', file=sys.stderr)
    print(f'  duration:   {total:.2f}s → {cut_total:.2f}s', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
