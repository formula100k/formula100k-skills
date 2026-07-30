#!/usr/bin/env python3
"""Unit tests for the semantic-cleanup layer of cut_silences_and_fillers.py.

These cover ONLY the pure, network-free helpers:
  - build_semantic_prompt   (transcript → indexed prompt text)
  - parse_semantic_response (Claude's reply → validated word-index ranges)
  - apply_drops             (ranges → cleaned words + over-delete guard)

The actual HTTP call (call_claude / semantic_clean orchestrator) needs the
network and is exercised manually, not here.

Run:  python3 -m unittest test_semantic_clean -v
"""

from __future__ import annotations

import unittest

import cut_silences_and_fillers as eng


def _words(*tokens):
    """Build a fake word list with monotonic timestamps."""
    out = []
    t = 0.0
    for tok in tokens:
        out.append({'word': tok, 'start': round(t, 3), 'end': round(t + 0.3, 3)})
        t += 0.4
    return out


class BuildPromptTests(unittest.TestCase):
    def test_indexes_every_word(self):
        ws = _words('Si', 'usas', 'Claude')
        prompt = eng.build_semantic_prompt(ws)
        self.assertIn('[0] Si', prompt)
        self.assertIn('[1] usas', prompt)
        self.assertIn('[2] Claude', prompt)

    def test_includes_guion_when_given(self):
        ws = _words('hola', 'mundo')
        prompt = eng.build_semantic_prompt(ws, guion='Hola a todos, bienvenidos')
        self.assertIn('Hola a todos, bienvenidos', prompt)

    def test_no_guion_section_when_absent(self):
        ws = _words('hola', 'mundo')
        prompt = eng.build_semantic_prompt(ws, guion=None)
        # The prompt must still be valid and reference JSON output.
        self.assertIn('JSON', prompt.upper())


class ParseResponseTests(unittest.TestCase):
    def test_parses_valid_ranges(self):
        text = '{"drop": [{"start": 0, "end": 2, "reason": "arranque fallido"}]}'
        got = eng.parse_semantic_response(text, n_words=10)
        self.assertEqual(got, [(0, 2, 'arranque fallido')])

    def test_parses_json_inside_codefence(self):
        text = '```json\n{"drop": [{"start": 3, "end": 4, "reason": "repeticion"}]}\n```'
        got = eng.parse_semantic_response(text, n_words=10)
        self.assertEqual(got, [(3, 4, 'repeticion')])

    def test_parses_json_with_surrounding_prose(self):
        text = 'Claro, aquí está:\n{"drop": [{"start": 1, "end": 1, "reason": "x"}]}\nListo.'
        got = eng.parse_semantic_response(text, n_words=10)
        self.assertEqual(got, [(1, 1, 'x')])

    def test_clamps_out_of_range_end(self):
        text = '{"drop": [{"start": 8, "end": 50, "reason": "cola"}]}'
        got = eng.parse_semantic_response(text, n_words=10)
        self.assertEqual(got, [(8, 9, 'cola')])

    def test_skips_fully_out_of_range(self):
        text = '{"drop": [{"start": 20, "end": 30, "reason": "fuera"}]}'
        got = eng.parse_semantic_response(text, n_words=10)
        self.assertEqual(got, [])

    def test_swaps_when_start_after_end(self):
        text = '{"drop": [{"start": 5, "end": 2, "reason": "invertido"}]}'
        got = eng.parse_semantic_response(text, n_words=10)
        self.assertEqual(got, [(2, 5, 'invertido')])

    def test_empty_drop_list(self):
        got = eng.parse_semantic_response('{"drop": []}', n_words=10)
        self.assertEqual(got, [])

    def test_malformed_returns_empty(self):
        self.assertEqual(eng.parse_semantic_response('no soy json', n_words=10), [])
        self.assertEqual(eng.parse_semantic_response('', n_words=10), [])
        self.assertEqual(eng.parse_semantic_response('{bad json', n_words=10), [])


class ApplyDropsTests(unittest.TestCase):
    def test_removes_words_in_range(self):
        ws = _words('a', 'b', 'c', 'd', 'e')
        kept, removed, aborted = eng.apply_drops(ws, [(1, 2, 'r')], max_drop_ratio=0.9)
        self.assertFalse(aborted)
        self.assertEqual([w['word'] for w in kept], ['a', 'd', 'e'])
        self.assertEqual(len(removed), 1)
        self.assertIn('b', removed[0])
        self.assertIn('c', removed[0])

    def test_multiple_ranges(self):
        ws = _words('a', 'b', 'c', 'd', 'e', 'f')
        kept, removed, aborted = eng.apply_drops(
            ws, [(0, 0, 'x'), (4, 5, 'y')], max_drop_ratio=0.9)
        self.assertFalse(aborted)
        self.assertEqual([w['word'] for w in kept], ['b', 'c', 'd'])

    def test_overbudget_guard_aborts_and_keeps_everything(self):
        ws = _words('a', 'b', 'c', 'd', 'e')
        # Dropping 4 of 5 words = 80% > 40% guard → abort, keep original.
        kept, removed, aborted = eng.apply_drops(
            ws, [(0, 3, 'too much')], max_drop_ratio=0.4)
        self.assertTrue(aborted)
        self.assertEqual([w['word'] for w in kept], ['a', 'b', 'c', 'd', 'e'])
        self.assertEqual(removed, [])

    def test_no_ranges_is_noop(self):
        ws = _words('a', 'b', 'c')
        kept, removed, aborted = eng.apply_drops(ws, [], max_drop_ratio=0.4)
        self.assertFalse(aborted)
        self.assertEqual([w['word'] for w in kept], ['a', 'b', 'c'])
        self.assertEqual(removed, [])

    def test_overlapping_ranges_dedupe_indices(self):
        ws = _words('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j')
        # (1,3) and (2,4) overlap → drop {1,2,3,4} = 40% which is not > 0.4
        kept, removed, aborted = eng.apply_drops(
            ws, [(1, 3, 'x'), (2, 4, 'y')], max_drop_ratio=0.4)
        self.assertFalse(aborted)
        self.assertEqual([w['word'] for w in kept], ['a', 'f', 'g', 'h', 'i', 'j'])


if __name__ == '__main__':
    unittest.main()
