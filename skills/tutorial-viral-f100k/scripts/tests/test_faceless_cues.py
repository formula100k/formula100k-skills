import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from faceless_manifest_to_cues import parse_faceless

MANIFEST = """# Tutorial — demo

## Tarjeta gancho
- **Archivo:** `IA/hook.png`
- **Duración:** 3.0

## Fondo
| Keyword | Archivo | Duración | Estilo |
|---------|---------|----------|--------|
| abrir   | `USER/pantalla_01.mov` | 7 | monitor |
| resultado | `IA/card_resultado.png` | 4 | fullscreen |

## Cards
| Keyword | Archivo | Ancho | Duración | Posición | Rotación |
|---------|---------|-------|----------|----------|----------|
| prompt  | `IA/card_prompt.png` | 700 | 2.4 | center | -3 |

## B-roll
| Keyword | Archivo | Duración | Estilo |
|---------|---------|----------|--------|
| internet | `WEB/clip.mp4` | 3 | monitor-photo |

## CTA
- **Archivo:** `IA/cta.png`
- **Duración:** 3.5

## Captions
- **Activado:** sí
- **Posición:** lower-third
"""

def test_parses_all_sections():
    cues = parse_faceless(MANIFEST)
    assert cues["hookCard"] == {"src": "IA/hook.png", "duration": 3.0}
    assert cues["cta"] == {"src": "IA/cta.png", "duration": 3.5}
    assert cues["captions"] == {"enabled": True, "position": "lower-third"}
    assert cues["background"][0] == {
        "keyword": "abrir", "src": "USER/pantalla_01.mov", "duration": 7.0, "style": "monitor"}
    assert cues["background"][1]["style"] == "fullscreen"
    assert cues["cards"][0] == {
        "keyword": "prompt", "src": "IA/card_prompt.png", "width": 700,
        "duration": 2.4, "position": "center", "rotation": -3.0}
    assert cues["broll"][0]["style"] == "monitor-photo"

def test_missing_optional_sections_default():
    cues = parse_faceless("# Tutorial\n\n## Fondo\n| Keyword | Archivo | Duración | Estilo |\n|-|-|-|-|\n| x | IA/a.png | 2 | fullscreen |\n")
    assert cues["hookCard"] is None
    assert cues["cta"] is None
    assert cues["cards"] == []
    assert cues["captions"] == {"enabled": True, "position": "lower-third"}
