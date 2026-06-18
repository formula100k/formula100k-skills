import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from generate_kinetic_captions import chunk_words

def test_groups_pairs_of_words():
    words = [
        {"word": "hola", "start": 0.0, "end": 0.3},
        {"word": "mundo", "start": 0.3, "end": 0.6},
        {"word": "bonito", "start": 0.6, "end": 0.9},
    ]
    chunks = chunk_words(words, max_words=2, max_gap=0.45)
    assert chunks[0] == {"text": "hola mundo", "start": 0.0, "end": 0.6}
    assert chunks[1] == {"text": "bonito", "start": 0.6, "end": 0.9}

def test_splits_on_large_gap():
    words = [
        {"word": "uno", "start": 0.0, "end": 0.3},
        {"word": "dos", "start": 2.0, "end": 2.3},  # gap 1.7s > max_gap
    ]
    chunks = chunk_words(words, max_words=2, max_gap=0.45)
    assert chunks == [
        {"text": "uno", "start": 0.0, "end": 0.3},
        {"text": "dos", "start": 2.0, "end": 2.3},
    ]

def test_accepts_text_alias_and_skips_empty():
    words = [
        {"text": "a", "start": 0.0, "end": 0.1},
        {"text": "", "start": 0.1, "end": 0.2},
        {"text": "b", "start": 0.2, "end": 0.3},
    ]
    chunks = chunk_words(words, max_words=2, max_gap=0.45)
    assert chunks == [{"text": "a b", "start": 0.0, "end": 0.3}]
