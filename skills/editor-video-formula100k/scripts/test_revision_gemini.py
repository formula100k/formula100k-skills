#!/usr/bin/env python3
"""Pruebas sin red de la revisión del guion con Gemini.

Run:  python3 -m unittest test_revision_gemini -v
"""
from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest import mock

import cut_silences_and_fillers as eng
import revision_gemini as rg


def _words(*tokens):
    return [{'word': t, 'start': i * 0.4, 'end': i * 0.4 + 0.3} for i, t in enumerate(tokens)]


class LlaveTests(unittest.TestCase):
    def test_variable_gana(self):
        llave, origen = rg.leer_llave_gemini({'GEMINI_API_KEY': ' AIzaXYZ '}, Path('/no/existe'))
        self.assertEqual(llave, 'AIzaXYZ')
        self.assertIn('GEMINI_API_KEY', origen)

    def test_archivo(self):
        with tempfile.TemporaryDirectory() as td:
            f = Path(td) / 'llave-gemini.txt'
            f.write_text('mi llave:\nAIzaSyA1234567890abcdefghijk\n', encoding='utf-8')
            llave, origen = rg.leer_llave_gemini({}, f)
            self.assertEqual(llave, 'AIzaSyA1234567890abcdefghijk')
            self.assertEqual(origen, str(f))

    def test_sin_llave(self):
        self.assertEqual(rg.leer_llave_gemini({}, Path('/no/existe')), (None, None))


class RevisionTests(unittest.TestCase):
    WS = _words('Hoy', 'te', 'cuento', 'o', 'sea', 'te', 'cuento', 'cómo', 'crecer', 'en', 'redes',
               'sin', 'gastar', 'en', 'anuncios', 'y', 'con', 'lo', 'que', 'ya', 'tienes')

    def test_sin_llave_no_toca(self):
        out, removed, st = eng.gemini_review(self.WS, None)
        self.assertEqual((out, removed, st), (self.WS, [], 'no_key'))

    def test_quita_muletilla_y_repeticion(self):
        with mock.patch.object(rg, 'call_gemini', return_value='{"drop":[{"start":3,"end":6,"reason":"muletilla y repetición"}]}'):
            out, removed, st = eng.gemini_review(self.WS, 'AIzaX')
        self.assertEqual(st, 'ok')
        self.assertEqual(' '.join(w['word'] for w in out), 'Hoy te cuento cómo crecer en redes sin gastar en anuncios y con lo que ya tienes')
        self.assertEqual(len(removed), 1)

    def test_falla_de_api(self):
        with mock.patch.object(rg, 'call_gemini', return_value=None):
            out, _, st = eng.gemini_review(self.WS, 'AIzaX')
        self.assertEqual(st, 'api_fail')
        self.assertIs(out, self.WS)

    def test_no_borra_de_mas(self):
        with mock.patch.object(rg, 'call_gemini', return_value='{"drop":[{"start":0,"end":15}]}'):
            out, _, st = eng.gemini_review(self.WS, 'AIzaX')
        self.assertEqual(st, 'aborted_overbudget')
        self.assertIs(out, self.WS)

    def test_nada_que_borrar(self):
        with mock.patch.object(rg, 'call_gemini', return_value='{"drop":[]}'):
            _, _, st = eng.gemini_review(self.WS, 'AIzaX')
        self.assertEqual(st, 'nothing')


if __name__ == '__main__':
    unittest.main()
