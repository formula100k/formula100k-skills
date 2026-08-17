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
  --no-snap             disable energy-based silence snapping (use fixed pad)

Outputs (inside dest_folder):
  _source_cut.mov  — video with silences, fillers, and stutters removed
  edl.json         — list of {origStart, origEnd, newStart, newEnd} segments
  captions.json    — word-level timestamps of the CUT video (for subtitles)

Strategy:
  1. Extract mono 16kHz audio
  2. Transcribe with whisper --word-timestamps True  (single source of truth)
  2b. SEMANTIC pass (optional, needs ANTHROPIC_API_KEY): Claude reads the indexed
      transcript and deletes whole discarded takes — misspeaks the speaker
      reformulated with different words, false starts, wandering. This is the
      layer that "understands" speech; the lexical steps below only match strings.
      Skipped gracefully when no key is set. An over-delete guard (40% cap) means
      a bad suggestion can never gut the video.
  3. Drop consecutive repeated words (stutters), keeping the LAST attempt
  4. Drop phrase restarts (speaker stumbles + retries)
  5. Skip words matching FILLER_REGEX (eh/em/uh/ah/mm)
  6. Compute "keep" ranges; any gap > MIN_SILENCE between kept words is cut
  6b. Snap every cut boundary onto the nearest REAL silence in the audio energy
      envelope, so cuts never land mid-word (fixes clipped tails/onsets). The
      fixed/fricative pad is only a fallback when the envelope can't be built.
  7. Use ffmpeg with select+aselect to build the cut video
  8. Remap the kept words' timestamps onto the cut timeline via the EDL —
     NO re-transcription. This kills three failure modes at once:
       - Whisper hallucination loops on the cut audio
       - Phoneme drift on cut audio (e.g. "reels" → "reales")
       - Dedupe acting on unstable re-transcribed captions
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_MIN_SILENCE = 0.08  # seconds — gap larger than this is treated as silence and cut
DEFAULT_PAD = 0.06  # seconds — padding around each kept word; gives the tail of the word room to breathe so consonants/vowels no se cortan
DEFAULT_DEDUPE_MAX_GAP = 1.2  # seconds — repeats farther apart than this aren't stutters
MIN_SEGMENT = 0.08  # don't keep segments smaller than this


def cut_output_path(dest, audio_only: bool) -> Path:
    """Return the output path for the cut file.

    audio_only=True  → _voz_cut.m4a  (faceless preset: voiceover, no video track)
    audio_only=False → _source_cut.mov (talking-head preset: video+audio)
    """
    dest = Path(dest)
    return dest / ("_voz_cut.m4a" if audio_only else "_source_cut.mov")
# Fricatives have low amplitude tails so Whisper's word_end lands BEFORE the
# sibilant. Without extra room they get clipped ("carísimas" → "carísima",
# "diez" → "die", "francés" → "francé"). Extending only the end-pad of these
# words keeps the rest of the timeline tight.
FRICATIVE_PAD_EXTRA = 0.04
FRICATIVE_END_RE = re.compile(r'(?:ch|[szjxf])$', re.IGNORECASE)
FILLER_REGEX = re.compile(
    r'^[¿¡"\'(\[]*(eh+|em+|um+|uh+|ah+|mm+|ehm+|emm+)[.,;:!?\)\]\'\"…]*$',
    re.IGNORECASE,
)
_PUNCT_STRIP = re.compile(r'^[\W_]+|[\W_]+$', re.UNICODE)


def _ends_in_fricative(word: str) -> bool:
    """True if `word` ends in a Spanish fricative (s/z/j/x/f or 'ch' digraph).

    Strips surrounding punctuation first so "carísimas," still resolves as
    fricative-ending.
    """
    stripped = _PUNCT_STRIP.sub('', word.strip().lower())
    return bool(stripped and FRICATIVE_END_RE.search(stripped))


def _normalize_token(text: str) -> str:
    """Lowercase, strip surrounding punctuation, drop accents — for dedupe matching."""
    s = _PUNCT_STRIP.sub('', text.strip().lower())
    s = unicodedata.normalize('NFD', s)
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn')


def detect_hallucinations(words: list[dict]) -> list[dict]:
    """Spot likely Whisper loop artifacts in a raw transcript.

    Two signatures:
      - 6+ consecutive words with identical normalized token ("descargas
        descargas descargas..." failure mode).
      - 5+ words sharing the same start timestamp (Whisper sometimes piles
        many tokens on one frame when the decoder is stuck).

    Returns a list of finding dicts; doesn't modify `words`. The remap-via-EDL
    pipeline already contains the damage of an isolated loop, so this exists
    only as observability — callers should warn, not abort.
    """
    findings: list[dict] = []
    n = len(words)
    if n < 5:
        return findings
    # Consecutive identical normalized tokens
    i = 0
    while i < n:
        norm = _normalize_token(words[i]['word'])
        j = i
        while j + 1 < n and norm and _normalize_token(words[j + 1]['word']) == norm:
            j += 1
        run = j - i + 1
        if run >= 6:
            findings.append({
                'kind': 'repeat_run',
                'token': norm,
                'count': run,
                'start': words[i]['start'],
                'end': words[j]['end'],
            })
        i = j + 1
    # Collapsed timestamps (many words on the same frame)
    i = 0
    while i < n:
        base = words[i]['start']
        j = i
        while j + 1 < n and abs(words[j + 1]['start'] - base) < 0.005:
            j += 1
        if j - i + 1 >= 5:
            sample = ' '.join(w['word'].strip() for w in words[i:j + 1])
            findings.append({
                'kind': 'timestamp_collapse',
                'count': j - i + 1,
                'start': base,
                'end': words[j]['end'],
                'sample': sample[:60] + ('...' if len(sample) > 60 else ''),
            })
        i = j + 1
    return findings


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
# Detects when the speaker restarts a sentence after a stumble: e.g.
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

    Differentiates restarts (speaker stumbled) from list items (consecutive sentences
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


# ── Semantic cleanup (Claude) ────────────────────────────────────────────
# The lexical layers above (stutter dedupe, phrase-restart, fillers) only catch
# repetitions that LOOK alike as strings. They miss the real failure mode:
# The speaker misspeaks, then re-says the idea with DIFFERENT words — or repeats a
# word with a breath in between, or wanders off and comes back. To "understand"
# the transcript we hand it to Claude, which reasons like a human editor:
# "she botched this take and nailed it here → keep the good one". Claude returns
# word-index ranges to delete; the existing keep-segment/EDL machinery does the
# rest. Fully optional: no ANTHROPIC_API_KEY → this layer is skipped and the
# local engine runs alone. An over-delete guard means a bad model suggestion can
# never silently gut the video.

DEFAULT_SEMANTIC_MODEL = 'claude-opus-4-8'  # highest quality; override per-render
DEFAULT_SEMANTIC_MAX_DROP = 0.40  # never delete more than this fraction of words
ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
ANTHROPIC_VERSION = '2023-06-01'

# ── Pase semántico: dos niveles de agresividad ──────────────────────────────
# 'conservador' (default histórico): quita SOLO tomas falladas literales —
#   arranques en falso, tartamudeos, reformulaciones, auto-correcciones. Deja el
#   mensaje intacto. Para video grabado limpio (sin restarts) casi no corta → el
#   reel queda largo y "flojo".
# 'ajustado': lo anterior + relleno de arranque/carraspeo verbal, divagaciones y
#   apartes tangenciales, y re-enunciados redundantes que NO hacen avanzar el
#   mensaje. Protege gancho, pasos, datos, ejemplos que cargan info y el CTA.
#   Corte notablemente más apretado (≈2-3× más palabras) sin mutilar el mensaje.
SEMANTIC_SYSTEM_CONSERVADOR = (
    "Eres un editor de video profesional que limpia transcripciones de reels "
    "hablados (español). Recibes el transcript palabra por palabra, cada una con "
    "su índice [n]. La persona graba de corrido SIN guion fijo: arranca frases en "
    "falso, se traba, se equivoca y repite la idea con OTRAS palabras, divaga y "
    "vuelve, o repite una palabra. Tu trabajo: marcar SOLO los índices de palabras "
    "que pertenecen a tomas DESCARTADAS, para quedarte con la toma final limpia y "
    "el mensaje intacto.\n\n"
    "Reglas duras:\n"
    "- Si dijo algo mal y lo reformuló después, BORRA el intento fallado y CONSERVA "
    "el último (el bueno), aunque usen palabras distintas.\n"
    "- Borra repeticiones, arranques en falso, muletillas largas y auto-correcciones "
    "('no, perdón', 'a ver', 'espérate', 'me equivoqué', 'lo digo de nuevo').\n"
    "- NUNCA borres contenido bueno solo porque suene redundante de forma intencional "
    "(énfasis, listas, 'muy muy importante'). Ante la duda, CONSERVA.\n"
    "- No reordenes ni reescribas: solo eliges qué índices quitar.\n"
    "- Responde EXCLUSIVAMENTE un objeto JSON, sin texto extra, con esta forma:\n"
    '  {"drop": [{"start": <idx>, "end": <idx>, "reason": "<motivo corto>"}]}\n'
    "  donde start..end es un rango INCLUSIVO de índices a borrar. Si no hay nada "
    'que borrar, responde {"drop": []}.'
)

SEMANTIC_SYSTEM_AJUSTADO = (
    "Eres un editor de reels viral (español). Recibes el transcript palabra por "
    "palabra, cada una con su índice [n]. La persona graba de corrido SIN guion. "
    "Tu trabajo: dejar el corte FINAL apretado y dinámico para retención, quitando "
    "todo lo que NO hace avanzar el mensaje.\n\n"
    "BORRA (marca sus índices):\n"
    "1. Tomas falladas: arranques en falso, frases reformuladas (deja la última "
    "buena), tartamudeos, repeticiones de palabra, auto-correcciones ('a ver', "
    "'perdón', 'me equivoqué').\n"
    "2. Relleno de arranque / carraspeo verbal: preámbulos que no dicen nada ('en "
    "donde te explico', 'lo que les quería decir es que', 'básicamente') cuando la "
    "idea real viene justo después.\n"
    "3. Divagaciones y apartes tangenciales: anécdotas/ejemplos secundarios que se "
    "desvían del punto y vuelven, auto-referencias ('yo tengo un video hablando de "
    "eso'), si quitarlos NO rompe el hilo.\n"
    "4. Re-enunciados redundantes: cuando repite la misma idea con otras palabras "
    "sin agregar info.\n\n"
    "PROTEGE SIEMPRE (NO borrar):\n"
    "- El gancho/primera afirmación fuerte, los pasos concretos, los datos, nombres "
    "y ejemplos que SÍ cargan el mensaje, y el CTA final completo.\n"
    "- No reordenes ni reescribas; solo eliges índices a quitar. El hilo debe quedar "
    "coherente al unir.\n\n"
    "Apunta a un corte notablemente más apretado que el mínimo, pero NUNCA mutiles "
    "el mensaje. Responde EXCLUSIVAMENTE un objeto JSON, sin texto extra, con esta "
    'forma:\n  {"drop": [{"start": <idx>, "end": <idx>, "reason": "<motivo corto>"}]}\n'
    "  donde start..end es un rango INCLUSIVO de índices a borrar. Si no hay nada "
    'que borrar, responde {"drop": []}.'
)

SEMANTIC_SYSTEMS = {
    'conservador': SEMANTIC_SYSTEM_CONSERVADOR,
    'ajustado': SEMANTIC_SYSTEM_AJUSTADO,
}
DEFAULT_SEMANTIC_LEVEL = 'conservador'
# Back-compat alias (some callers/tests import SEMANTIC_SYSTEM directly).
SEMANTIC_SYSTEM = SEMANTIC_SYSTEM_CONSERVADOR


def build_semantic_prompt(words: list[dict], guion: str | None = None) -> str:
    """Render the indexed transcript (+ optional guion) into the user message."""
    lines = [f'[{i}] {w["word"].strip()}' for i, w in enumerate(words)]
    parts = []
    if guion:
        parts.append(
            'GUION DE REFERENCIA (lo que la persona QUERÍA decir; úsalo como norte '
            'para distinguir la toma buena de la fallada, pero la verdad es el '
            'transcript, no el guion):\n' + guion.strip() + '\n'
        )
    parts.append('TRANSCRIPT INDEXADO:\n' + '\n'.join(lines))
    parts.append(
        '\nDevuelve SOLO el JSON con los rangos de índices a borrar '
        '(formato {"drop":[{"start","end","reason"}]}).'
    )
    return '\n'.join(parts)


def _extract_json_object(text: str) -> str | None:
    """Pull the first balanced {...} JSON object out of a possibly-noisy reply."""
    if not text:
        return None
    start = text.find('{')
    if start == -1:
        return None
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(text)):
        c = text[i]
        if in_str:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    return text[start:i + 1]
    return None


def parse_semantic_response(text: str, n_words: int) -> list[tuple[int, int, str]]:
    """Parse Claude's reply into validated (start, end, reason) index ranges.

    Tolerant of code fences and surrounding prose. Indices are coerced to int,
    swapped if inverted, clamped to [0, n_words-1], and ranges fully outside the
    transcript are dropped. Any parsing error yields an empty list (→ the local
    engine runs unaffected).
    """
    blob = _extract_json_object(text)
    if not blob:
        return []
    try:
        data = json.loads(blob)
    except (ValueError, TypeError):
        return []
    raw = data.get('drop') if isinstance(data, dict) else None
    if not isinstance(raw, list):
        return []
    out: list[tuple[int, int, str]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        try:
            s = int(item['start'])
            e = int(item['end'])
        except (KeyError, TypeError, ValueError):
            continue
        if s > e:
            s, e = e, s
        if e < 0 or s > n_words - 1:  # fully outside
            continue
        s = max(0, s)
        e = min(n_words - 1, e)
        reason = str(item.get('reason', '')).strip()
        out.append((s, e, reason))
    return out


def apply_drops(
    words: list[dict],
    ranges: list[tuple[int, int, str]],
    max_drop_ratio: float = DEFAULT_SEMANTIC_MAX_DROP,
) -> tuple[list[dict], list[str], bool]:
    """Remove the words inside `ranges`, guarding against over-deletion.

    Returns (kept_words, removed_snippets, aborted). If the union of ranges would
    delete more than `max_drop_ratio` of the words, NOTHING is removed and
    aborted=True — a runaway model suggestion can never gut the video.
    """
    if not words or not ranges:
        return words, [], False
    drop_idx: set[int] = set()
    for s, e, _ in ranges:
        drop_idx.update(range(s, e + 1))
    drop_idx = {i for i in drop_idx if 0 <= i < len(words)}
    if not drop_idx:
        return words, [], False
    if len(drop_idx) / len(words) > max_drop_ratio:
        return words, [], True
    removed: list[str] = []
    for s, e, reason in ranges:
        snippet = ' '.join(words[i]['word'].strip() for i in range(s, e + 1)
                           if 0 <= i < len(words))
        tag = f' [{reason}]' if reason else ''
        removed.append(snippet + tag)
    kept = [w for i, w in enumerate(words) if i not in drop_idx]
    return kept, removed, False


def _ssl_context():
    """Build an SSL context that verifies certs even on python.org builds.

    The macOS python.org installer ships without CA certs wired into OpenSSL
    (default cafile is None → every HTTPS call dies with CERTIFICATE_VERIFY_FAILED
    unless the user ran "Install Certificates.command"). We fall back to the
    `certifi` bundle so the API call works out of the box on a fresh machine.
    """
    import ssl
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def call_claude(prompt: str, api_key: str, model: str, timeout: float = 90.0,
                max_tokens: int = 4096, system: str | None = None) -> str | None:
    """POST to the Anthropic Messages API via stdlib urllib. None on any failure.

    No SDK dependency — keeps the skill installable with just Python + ffmpeg.
    `system` selects the semantic prompt; defaults to the conservative one.
    """
    body = json.dumps({
        'model': model,
        'max_tokens': max_tokens,
        'system': system or SEMANTIC_SYSTEM,
        'messages': [{'role': 'user', 'content': prompt}],
    }).encode('utf-8')
    req = urllib.request.Request(
        ANTHROPIC_API_URL, data=body, method='POST',
        headers={
            'x-api-key': api_key,
            'anthropic-version': ANTHROPIC_VERSION,
            'content-type': 'application/json',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=_ssl_context()) as resp:
            payload = json.loads(resp.read().decode('utf-8'))
    except (urllib.error.URLError, TimeoutError, ValueError, OSError):
        return None
    try:
        blocks = payload.get('content', [])
        return ''.join(b.get('text', '') for b in blocks if b.get('type') == 'text')
    except (AttributeError, TypeError):
        return None


def semantic_clean(
    words: list[dict],
    api_key: str | None,
    model: str = DEFAULT_SEMANTIC_MODEL,
    guion: str | None = None,
    max_drop_ratio: float = DEFAULT_SEMANTIC_MAX_DROP,
    level: str = DEFAULT_SEMANTIC_LEVEL,
) -> tuple[list[dict], list[str], str]:
    """Drop discarded takes from `words` using Claude. Always safe.

    `level` ∈ {'conservador','ajustado'} picks the system prompt: 'conservador'
    removes only literal failed takes; 'ajustado' also trims wind-up/tangents/
    redundant re-statements for a tighter reel (message + CTA protected).

    Returns (words, removed_snippets, status). status ∈
    {'ok', 'no_key', 'api_fail', 'aborted_overbudget', 'nothing'}. On anything
    other than 'ok'/'nothing' the original word list is returned untouched.
    """
    if not api_key:
        return words, [], 'no_key'
    if len(words) < 4:
        return words, [], 'nothing'
    system = SEMANTIC_SYSTEMS.get(level, SEMANTIC_SYSTEM_CONSERVADOR)
    prompt = build_semantic_prompt(words, guion)
    reply = call_claude(prompt, api_key, model, system=system)
    if reply is None:
        return words, [], 'api_fail'
    ranges = parse_semantic_response(reply, len(words))
    if not ranges:
        return words, [], 'nothing'
    kept, removed, aborted = apply_drops(words, ranges, max_drop_ratio)
    if aborted:
        return words, [], 'aborted_overbudget'
    return kept, removed, 'ok'


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
        # Anti-hallucination: disable previous-text conditioning so the decoder
        # can't lock into a repeating phrase loop (the "descargas y lo descargas..."
        # failure mode observed on cut videos with rhythmic Spanish speech).
        '--condition-on-previous-text', 'False',
        '--temperature', '0',
        '--compression-ratio-threshold', '2.0',
        '--logprob-threshold', '-1.0',
        '--no-speech-threshold', '0.5',
        '--hallucination-silence-threshold', '1.0',
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


# ── Energy-aware boundary snapping ───────────────────────────────────────
# Whisper's word_start/word_end land *inside* the acoustic word (±50-150 ms),
# so cutting at word_end+pad slices through still-voiced audio: clipped tails
# ("carísimas"→"carísima") and chopped onsets. Instead of trusting a fixed pad,
# we read the real audio energy envelope and push every CUT boundary out to the
# nearest sustained silence. The cut then always lands in silence, regardless of
# whether the word ends in s, d, n, a vowel, etc. This supersedes the
# fricative-only pad heuristic (kept only as a fallback when the envelope can't
# be computed).

SNAP_MIN_SILENCE = 0.04   # sec — a gap must stay below thresh this long to count
                          # as real silence (ignores stop-consonant closures /t/ /k/)
SNAP_MARGIN = 0.02        # sec — nudge the snapped cut this far INTO the silence


def load_energy_envelope(wav_path: Path, hop: float = 0.01, win: float = 0.025):
    """Return (env, sr, hop): a per-frame RMS energy envelope of the mono audio.

    env[i] is the RMS over [i*hop, i*hop+win]. Used to locate the true acoustic
    end/start of words so cuts can be snapped into real silence.
    """
    import wave
    import numpy as np

    w = wave.open(str(wav_path), 'rb')
    sr = w.getframerate()
    n = w.getnframes()
    raw = w.readframes(n)
    w.close()
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    hop_n = max(1, int(round(hop * sr)))
    win_n = max(hop_n, int(round(win * sr)))
    if len(a) < win_n:
        val = float(np.sqrt(np.mean(a * a))) if len(a) else 0.0
        return np.array([val], dtype=np.float32), sr, hop
    nfr = 1 + (len(a) - win_n) // hop_n
    env = np.empty(nfr, dtype=np.float32)
    for i in range(nfr):
        s = i * hop_n
        seg = a[s:s + win_n]
        env[i] = np.sqrt(np.mean(seg * seg))
    return env, sr, hop


def compute_silence_threshold(env) -> float:
    """Adaptive RMS floor separating silence from speech for this clip.

    Anchored to the clip's own noise floor (10th pct) and speech level (75th pct)
    so it survives background hum without eating soft fricatives.
    """
    import numpy as np
    noise = float(np.percentile(env, 10))
    speech = float(np.percentile(env, 75))
    thr = noise + 0.15 * (speech - noise)
    return max(thr, noise * 1.5, 1e-4)


def _snap_end_forward(env, hop: float, thresh: float, t: float, t_max: float,
                      min_sil: float = SNAP_MIN_SILENCE) -> float:
    """Move an end-cut at time `t` forward to the first SUSTAINED silence.

    Only walks while audio is voiced (energy ≥ thresh); a silence shorter than
    `min_sil` (a stop-consonant closure inside a word) is skipped. Capped at
    `t_max` (midpoint of the gap to the next kept segment) so neighbours can't
    overlap. If speech runs all the way to t_max, the cut stays at t_max.
    """
    if t >= t_max:
        return t
    nfr = len(env)
    i = min(max(int(round(t / hop)), 0), nfr - 1)
    imax = min(max(int(round(t_max / hop)), 0), nfr - 1)
    need = max(1, int(round(min_sil / hop)))
    j = i
    while j < imax:
        if env[j] < thresh:
            cnt = 0
            k = j
            while k <= imax and k < nfr and env[k] < thresh and cnt < need:
                cnt += 1
                k += 1
            if cnt >= need or k > imax:
                return min(t_max, j * hop)
            j = k
        else:
            j += 1
    return t_max


def _snap_start_backward(env, hop: float, thresh: float, t: float, t_min: float,
                         min_sil: float = SNAP_MIN_SILENCE) -> float:
    """Move a start-cut at time `t` backward to the first SUSTAINED silence.

    Mirror of `_snap_end_forward`: protects the word onset (initial consonant)
    from being clipped. Capped at `t_min` (gap midpoint to the previous segment).
    """
    if t <= t_min:
        return t
    nfr = len(env)
    i = min(max(int(round(t / hop)), 0), nfr - 1)
    imin = min(max(int(round(t_min / hop)), 0), nfr - 1)
    need = max(1, int(round(min_sil / hop)))
    j = i
    while j > imin:
        if env[j] < thresh:
            cnt = 0
            k = j
            while k >= imin and env[k] < thresh and cnt < need:
                cnt += 1
                k -= 1
            if cnt >= need or k < imin:
                return max(t_min, j * hop)
            j = k
        else:
            j -= 1
    return t_min


def _snap_segments_to_silence(merged, total, env, sr, hop, thresh):
    """Snap each merged segment's outer cut boundaries into real silence."""
    out: list[list[float]] = []
    n = len(merged)
    for idx in range(n):
        s, e = merged[idx][0], merged[idx][1]
        prev_end = merged[idx - 1][1] if idx > 0 else 0.0
        next_start = merged[idx + 1][0] if idx + 1 < n else total
        s_min = (prev_end + s) / 2 if idx > 0 else 0.0
        e_max = (e + next_start) / 2 if idx + 1 < n else total
        new_s = _snap_start_backward(env, hop, thresh, s, s_min)
        new_e = _snap_end_forward(env, hop, thresh, e, e_max)
        new_s = max(s_min, new_s - SNAP_MARGIN)
        new_e = min(e_max, new_e + SNAP_MARGIN)
        if new_e <= new_s:  # degenerate guard
            new_s, new_e = s, e
        out.append([new_s, new_e])
    return out


def compute_keep_segments(
    words: list[dict],
    total: float,
    min_silence: float,
    pad: float,
    env=None,
    sr=None,
    hop=None,
    thresh=None,
) -> list[tuple[float, float]]:
    """Build a list of (start, end) ranges to keep, in seconds.

    Drops:
      - Silence longer than min_silence (in the padded timeline)
      - Words matching FILLER_REGEX

    When an energy envelope is supplied (`env`/`sr`/`hop`/`thresh`), every cut
    boundary is snapped to the nearest real silence in the audio, so words are
    never sliced mid-phoneme. Without it, falls back to the fixed + fricative pad.
    """
    have_env = env is not None and sr and hop and thresh is not None
    kept: list[tuple[float, float]] = []
    for w in words:
        if FILLER_REGEX.match(w['word'].strip()):
            continue
        if have_env:
            end_pad = pad  # snapping handles word tails; no fricative special-case
        else:
            end_pad = pad + FRICATIVE_PAD_EXTRA if _ends_in_fricative(w['word']) else pad
        kept.append((max(0.0, w['start'] - pad), min(total, w['end'] + end_pad)))

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

    # Snap real cut boundaries into silence (kills mid-word clipping)
    if have_env:
        merged = _snap_segments_to_silence(merged, total, env, sr, hop, thresh)

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


def cut_audio(source: Path, segments: list[tuple[float, float]], out: Path) -> None:
    """Render the cut audio using ffmpeg with aselect filter only (no video track).

    Used by --audio-only mode (faceless preset). Output is AAC in an .m4a container.
    """
    if not segments:
        raise ValueError('No segments to keep')

    # Build aselect expression: 'between(t,a,b)+between(t,c,d)+...'
    sel = '+'.join(f'between(t,{s:.3f},{e:.3f})' for s, e in segments)
    af = f"aselect='{sel}',asetpts=N/SR/TB"

    cmd = [
        'ffmpeg', '-y', '-i', str(source),
        '-vn',  # no video
        '-af', af,
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


def remap_words_via_edl(words: list[dict], edl: list[dict]) -> list[dict]:
    """Translate word timestamps from the original timeline onto the cut timeline.

    A word is kept iff its midpoint falls inside an EDL segment; its new
    start/end are shifted by `seg.newStart - seg.origStart` and clamped to the
    segment's new boundaries. Words from cut regions (silences, fillers,
    dedupe drops) are skipped — they never appear in the cut video.

    Using the midpoint (instead of requiring `start >= origStart AND
    end <= origEnd`) tolerates words whose tail was nudged by the segment
    pad/merge logic.
    """
    if not edl:
        return []
    result: list[dict] = []
    for w in words:
        mid = (w['start'] + w['end']) / 2
        for seg in edl:
            if seg['origStart'] <= mid < seg['origEnd']:
                offset = seg['newStart'] - seg['origStart']
                new_start = max(seg['newStart'], w['start'] + offset)
                new_end = min(seg['newEnd'], w['end'] + offset)
                if new_end > new_start:
                    result.append({
                        'word': w['word'],
                        'start': round(new_start, 3),
                        'end': round(new_end, 3),
                    })
                break
    return result


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
    ap.add_argument('--no-snap', action='store_true',
                    help='disable energy-based silence snapping (use fixed/fricative pad)')
    ap.add_argument('--no-semantic', action='store_true',
                    help='disable the Claude semantic pass (keep only the local '
                         'string-matching engine)')
    ap.add_argument('--semantic-model', default=DEFAULT_SEMANTIC_MODEL,
                    help=f'Claude model for the semantic pass (default {DEFAULT_SEMANTIC_MODEL})')
    ap.add_argument('--semantic-level', choices=tuple(SEMANTIC_SYSTEMS),
                    default=DEFAULT_SEMANTIC_LEVEL,
                    help="agresividad del pase semántico: 'conservador' (default; "
                         "solo tomas falladas literales) o 'ajustado' (también recorta "
                         "preámbulos, divagaciones y re-enunciados redundantes para un "
                         "reel más apretado; protege gancho/pasos/CTA)")
    ap.add_argument('--guion', default=None,
                    help='ruta a un guion .txt opcional; le da a Claude el norte de '
                         'lo que querías decir (si no se pasa, busca $DEST/guion.txt)')
    ap.add_argument('--semantic-max-drop', type=float, default=DEFAULT_SEMANTIC_MAX_DROP,
                    help=f'fracción máxima de palabras que el pase semántico puede '
                         f'borrar antes de abortar por seguridad (default {DEFAULT_SEMANTIC_MAX_DROP})')
    ap.add_argument('--audio-only', action='store_true',
                    help='Salida solo-audio (_voz_cut.m4a) para el preset faceless: '
                         'corta silencios/muletillas del voiceover sin pista de video.')
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

        hallucinations = detect_hallucinations(words)
        if hallucinations:
            print(f'      ⚠ {len(hallucinations)} possible Whisper hallucination(s):',
                  file=sys.stderr)
            for h in hallucinations[:5]:
                if h['kind'] == 'repeat_run':
                    print(f'        • "{h["token"]}" × {h["count"]} '
                          f'@ {h["start"]:.2f}-{h["end"]:.2f}s',
                          file=sys.stderr)
                else:
                    print(f'        • {h["count"]} words on one frame '
                          f'@ {h["start"]:.2f}s: {h["sample"]!r}',
                          file=sys.stderr)
            if len(hallucinations) > 5:
                print(f'        ... ({len(hallucinations) - 5} more)', file=sys.stderr)
            print(f'      (remap-via-EDL contains the damage; '
                  f'inspect captions.json if quality is off)', file=sys.stderr)

        # ── Semantic pass (Claude) — runs on the RAW transcript so it has full
        # context; the local layers below then polish whatever it leaves behind.
        if not args.no_semantic:
            api_key = os.environ.get('ANTHROPIC_API_KEY')
            guion_text = None
            guion_path = Path(args.guion).expanduser() if args.guion else (dest / 'guion.txt')
            if guion_path.is_file():
                guion_text = guion_path.read_text(encoding='utf-8')
                print(f'      semantic: usando guion {guion_path.name} como referencia',
                      file=sys.stderr)
            n_before = len(words)
            words, sem_removed, status = semantic_clean(
                words, api_key, model=args.semantic_model,
                guion=guion_text, max_drop_ratio=args.semantic_max_drop,
                level=args.semantic_level,
            )
            if status == 'ok':
                pct = (n_before - len(words)) / n_before * 100 if n_before else 0
                print(f'      semantic ({args.semantic_model} · {args.semantic_level}): '
                      f'{n_before - len(words)} palabras de tomas descartadas borradas '
                      f'({len(sem_removed)} tramos, {pct:.0f}%)', file=sys.stderr)
                for snip in sem_removed[:10]:
                    s = snip if len(snip) <= 80 else snip[:77] + '...'
                    print(f'        − {s}', file=sys.stderr)
                if len(sem_removed) > 10:
                    print(f'        ... ({len(sem_removed) - 10} más)', file=sys.stderr)
            elif status == 'no_key':
                print('      ⚠ semantic OFF: falta ANTHROPIC_API_KEY '
                      '(corre solo el motor local). Exporta la key para activar '
                      'el corte por comprensión.', file=sys.stderr)
            elif status == 'api_fail':
                print('      ⚠ semantic: la llamada a Claude falló — sigo con el '
                      'motor local.', file=sys.stderr)
            elif status == 'aborted_overbudget':
                print(f'      ⚠ semantic: Claude propuso borrar >'
                      f'{args.semantic_max_drop:.0%} del video — descartado por '
                      f'seguridad, sigo con el motor local.', file=sys.stderr)
            else:  # 'nothing'
                print('      semantic: sin tomas descartadas que borrar',
                      file=sys.stderr)

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

        # Energy envelope → snap every cut into real silence (no mid-word clips)
        env = sr_env = hop_env = thresh = None
        if not args.no_snap:
            try:
                env, sr_env, hop_env = load_energy_envelope(audio)
                thresh = compute_silence_threshold(env)
                print(f'      silence-snap ON (RMS thresh={thresh:.4f}, '
                      f'{len(env)} frames)', file=sys.stderr)
            except Exception as ex:  # numpy/wave unavailable → graceful fallback
                env = sr_env = hop_env = thresh = None
                print(f'      ⚠ silence-snap OFF, using pad fallback ({ex})',
                      file=sys.stderr)

        segments = compute_keep_segments(
            words, total, args.min_silence, args.pad,
            env=env, sr=sr_env, hop=hop_env, thresh=thresh,
        )
        cut_total = sum(e - s for s, e in segments)
        ratio = cut_total / total if total else 0
        print(f'[3/5] Keep segments: {len(segments)} | '
              f'{cut_total:.2f}s of {total:.2f}s ({ratio:.0%}) | '
              f'min_silence={args.min_silence}s pad={args.pad}s '
              f'snap={"on" if env is not None else "off"}',
              file=sys.stderr)

        # Count fillers removed (the original word list before dedupe is gone,
        # so report from the dedupe-filtered list — close enough for telemetry)
        fillers = [w['word'] for w in words if FILLER_REGEX.match(w['word'].strip())]
        print(f'      filler tokens removed: {len(fillers)} '
              f'({", ".join(fillers[:8])}{"..." if len(fillers) > 8 else ""})',
              file=sys.stderr)

        out_video = cut_output_path(dest, args.audio_only)
        if args.audio_only:
            print(f'[4/5] Rendering cut audio (audio-only) → {out_video.name}',
                  file=sys.stderr)
            cut_audio(source, segments, out_video)
        else:
            print(f'[4/5] Rendering cut video → {out_video.name}', file=sys.stderr)
            cut_video(source, segments, out_video)

        edl = build_edl(segments)
        (dest / 'edl.json').write_text(json.dumps(edl, indent=2), encoding='utf-8')

        if args.no_recaption:
            print('[5/5] Skipped captions (--no-recaption)', file=sys.stderr)
        else:
            print(f'[5/5] Remapping word timestamps onto cut timeline via EDL...',
                  file=sys.stderr)
            cap_words = remap_words_via_edl(words, edl)
            (dest / 'captions.json').write_text(
                json.dumps(cap_words, indent=2), encoding='utf-8'
            )
            print(f'      → captions.json ({len(cap_words)} words, no re-transcription)',
                  file=sys.stderr)

    print(f'\nDone.', file=sys.stderr)
    print(f'  cut video:  {out_video}', file=sys.stderr)
    print(f'  edl.json:   {dest / "edl.json"}', file=sys.stderr)
    print(f'  duration:   {total:.2f}s → {cut_total:.2f}s', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
