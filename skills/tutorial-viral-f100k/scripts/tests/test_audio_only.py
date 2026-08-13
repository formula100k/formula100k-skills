# scripts/tests/test_audio_only.py
import sys
from pathlib import Path
ENGINE = Path("$HOME/.claude/skills/editor-video-formula100k/scripts")
sys.path.insert(0, str(ENGINE))
from cut_silences_and_fillers import cut_output_path

def test_audio_only_path(tmp_path):
    assert cut_output_path(tmp_path, True).name == "_voz_cut.m4a"

def test_video_path_default(tmp_path):
    assert cut_output_path(tmp_path, False).name == "_source_cut.mov"
