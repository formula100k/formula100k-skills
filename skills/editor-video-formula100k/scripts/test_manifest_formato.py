#!/usr/bin/env python3
"""Tests del parseo de Formato / Tema / Subtítulos en el MANIFEST.

Run:  cd scripts && python3 -m unittest test_manifest_formato -v
"""

from __future__ import annotations

import io
import re
import unittest
import unittest.mock
from pathlib import Path

import manifest_to_cues as m


def _manifest(cuerpo: str) -> str:
    return "# Reel — prueba\n\n" + cuerpo + "\n\n## Header\n\n- **Línea 1:** a\n- **Línea 2:** b\n"


class TestParseFormato(unittest.TestCase):
    def test_manifest_sin_campos_usa_defaults(self):
        out = m.parse_formato(_manifest(""))
        self.assertEqual(out["formato"], "fullscreen")
        self.assertEqual(out["tema"], "default")
        self.assertFalse(out["subtitulos"])

    def test_formato_declarado(self):
        out = m.parse_formato(_manifest("- **Formato:** split"))
        self.assertEqual(out["formato"], "split")

    def test_formato_hereda_tema_y_subtitulos_del_catalogo(self):
        out = m.parse_formato(_manifest("- **Formato:** split"))
        self.assertEqual(out["tema"], "crema-editorial")
        self.assertTrue(out["subtitulos"])

    def test_formato_desconocido_cae_a_fullscreen(self):
        out = m.parse_formato(_manifest("- **Formato:** inventado"))
        self.assertEqual(out["formato"], "fullscreen")

    def test_tema_explicito_gana_al_default_del_formato(self):
        out = m.parse_formato(_manifest("- **Formato:** split\n- **Tema:** default"))
        self.assertEqual(out["tema"], "default")

    def test_tema_desconocido_cae_al_del_formato(self):
        out = m.parse_formato(_manifest("- **Formato:** split\n- **Tema:** inventado"))
        self.assertEqual(out["tema"], "crema-editorial")

    def test_subtitulos_on_fuerza_encendido(self):
        out = m.parse_formato(_manifest("- **Formato:** fullscreen\n- **Subtítulos:** on"))
        self.assertTrue(out["subtitulos"])

    def test_subtitulos_off_fuerza_apagado(self):
        out = m.parse_formato(_manifest("- **Formato:** split\n- **Subtítulos:** off"))
        self.assertFalse(out["subtitulos"])

    def test_subtitulos_acepta_si_y_no(self):
        self.assertTrue(m.parse_formato(_manifest("- **Subtítulos:** sí"))["subtitulos"])
        self.assertFalse(m.parse_formato(_manifest("- **Formato:** split\n- **Subtitulos:** no"))["subtitulos"])

    def test_es_tolerante_a_acentos_y_mayusculas(self):
        out = m.parse_formato(_manifest("- **FORMATO:** PIP"))
        self.assertEqual(out["formato"], "pip")

    def test_esquina_camara_valida_se_incluye(self):
        out = m.parse_formato(_manifest("- **Formato:** pip\n- **Esquina cámara:** bl"))
        self.assertEqual(out["pipEsquina"], "bl")

    def test_esquina_camara_invalida_se_omite(self):
        out = m.parse_formato(_manifest("- **Formato:** pip\n- **Esquina cámara:** centro"))
        self.assertNotIn("pipEsquina", out)

    def test_esquina_camara_ausente_se_omite(self):
        out = m.parse_formato(_manifest("- **Formato:** pip"))
        self.assertNotIn("pipEsquina", out)

    def test_esquina_camara_tolerante_a_acentos_y_mayusculas(self):
        out = m.parse_formato(_manifest("- **Formato:** pip\n- **ESQUINA CAMARA:** TR"))
        self.assertEqual(out["pipEsquina"], "tr")

    def test_esquina_camara_vacia_se_omite_sin_avisar_desconocida(self):
        # "- **Esquina cámara:**" sin nada después: el `**` de cierre del
        # bold queda como "valor" crudo hasta que `_clean_inline` lo
        # limpia a cadena vacía. Debe tratarse como ausente, no como un
        # valor desconocido (no debe emitir el warning de "desconocida").
        with unittest.mock.patch("sys.stderr", new_callable=io.StringIO) as fake_err:
            out = m.parse_formato(_manifest("- **Formato:** pip\n- **Esquina cámara:**"))
        self.assertNotIn("pipEsquina", out)
        self.assertNotIn("desconocida", fake_err.getvalue())


class TestSincroniaConElRegistro(unittest.TestCase):
    """Si formatos.ts cambia, esto falla antes que producción."""

    def _leer_ids_de_formatos_ts(self) -> set[str]:
        ruta = Path(__file__).resolve().parent.parent / "remotion-template" / "src" / "formatos.ts"
        texto = ruta.read_text(encoding="utf-8")
        cuerpo = texto.split("export const FORMATOS", 1)[1]
        return set(re.findall(r"^\s*id:\s*'([a-z-]+)'", cuerpo, re.MULTILINE))

    def test_los_ids_de_python_coinciden_con_los_de_typescript(self):
        self.assertEqual(set(m.FORMATOS_VALIDOS), self._leer_ids_de_formatos_ts())


if __name__ == "__main__":
    unittest.main()
