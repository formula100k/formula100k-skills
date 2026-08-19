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


class TestVersus(unittest.TestCase):
    def test_lee_las_dos_etiquetas(self):
        out = m.parse_formato(_manifest(
            "- **Formato:** versus\n"
            "- **Etiqueta A:** Antes\n"
            "- **Etiqueta B:** Después"
        ))
        self.assertEqual(out["formato"], "versus")
        self.assertEqual(out["versusEtiquetas"], {"a": "ANTES", "b": "DESPUÉS"})

    def test_sin_etiquetas_no_emite_la_clave(self):
        out = m.parse_formato(_manifest("- **Formato:** versus"))
        self.assertNotIn("versusEtiquetas", out)

    def test_una_sola_etiqueta_no_emite_la_clave(self):
        # A medias no sirve: el componente necesita las dos o cae a su default.
        out = m.parse_formato(_manifest(
            "- **Formato:** versus\n- **Etiqueta A:** Antes"
        ))
        self.assertNotIn("versusEtiquetas", out)

    def test_se_ignoran_si_el_formato_no_es_versus(self):
        out = m.parse_formato(_manifest(
            "- **Formato:** split\n- **Etiqueta A:** Antes\n- **Etiqueta B:** Ahora"
        ))
        self.assertNotIn("versusEtiquetas", out)

    def test_defaults_del_formato_versus(self):
        out = m.parse_formato(_manifest("- **Formato:** versus"))
        self.assertEqual(out["tema"], "crema-editorial")
        self.assertTrue(out["subtitulos"])


class TestColumnaLado(unittest.TestCase):
    TABLA = (
        "## B-roll\n"
        "| Keyword | Archivo | Duración | Estilo | Lado |\n"
        "|---|---|---|---|---|\n"
        "| antes | a.png | 4 | clean | a |\n"
        "| ahora | b.png | 4 | clean | B |\n"
        "| otro  | c.png | 4 | clean |   |\n"
        "| raro  | d.png | 4 | clean | izquierda |\n"
    )

    def test_lee_a_y_b_sin_importar_mayusculas(self):
        cues = m.parse_broll(self.TABLA)
        self.assertEqual(cues[0]["lado"], "a")
        self.assertEqual(cues[1]["lado"], "b")

    def test_celda_vacia_o_desconocida_no_emite_la_clave(self):
        cues = m.parse_broll(self.TABLA)
        self.assertNotIn("lado", cues[2])
        self.assertNotIn("lado", cues[3])

    def test_sin_la_columna_el_broll_de_siempre_sigue_igual(self):
        cues = m.parse_broll(
            "## B-roll\n"
            "| Keyword | Archivo | Duración | Estilo |\n"
            "|---|---|---|---|\n"
            "| algo | a.png | 4 | clean |\n"
        )
        self.assertEqual(len(cues), 1)
        self.assertNotIn("lado", cues[0])


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


class PizarraFormato(unittest.TestCase):
    """`pizarra` se declara en el MANIFEST como cualquier otro formato."""

    def test_pizarra_es_formato_valido(self):
        self.assertIn('pizarra', m.FORMATOS_VALIDOS)

    def test_pizarra_trae_subtitulos_encendidos_y_tema_default(self):
        cues = m.parse_formato('- **Formato:** pizarra\n')
        self.assertEqual(cues['formato'], 'pizarra')
        self.assertEqual(cues['tema'], 'default')
        self.assertTrue(cues['subtitulos'])

    def test_las_etiquetas_de_versus_se_ignoran_en_pizarra(self):
        cues = m.parse_formato(
            '- **Formato:** pizarra\n'
            '- **Etiqueta A:** ANTES\n'
            '- **Etiqueta B:** AHORA\n'
        )
        self.assertNotIn('versusEtiquetas', cues)


if __name__ == '__main__':
    unittest.main()
