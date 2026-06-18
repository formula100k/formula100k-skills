#!/usr/bin/env python3
"""Orquestador del preset faceless: $DEST (MANIFEST + USER/voz) → BORRADOR_AUTO.mp4.

Usage:
  render_tutorial.py <DEST> <VOZ_PATH>
"""
from __future__ import annotations
import os, shutil, subprocess, sys
from pathlib import Path

# Rutas derivadas de la ubicación del script (portable): esta skill y el motor
# editor-video-formula100k viven como hermanos bajo el mismo directorio skills/.
SKILL = Path(__file__).resolve().parents[1]
ENGINE = SKILL.parent / "editor-video-formula100k"
TEMPLATE = ENGINE / "remotion-template"


def step(tag, msg): print(f"[{tag}] {msg}", file=sys.stderr)


def copy_or_link(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        dst.unlink()
    try:
        os.link(src, dst)
    except OSError:
        shutil.copy2(src, dst)


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: render_tutorial.py <DEST> <VOZ_PATH>", file=sys.stderr)
        return 2
    dest = Path(sys.argv[1]).expanduser().resolve()
    voz = Path(sys.argv[2]).expanduser().resolve()
    voz_cut = dest / "_voz_cut.m4a"
    captions = dest / "captions.json"

    # 1/5 — corte audio-only + transcripción
    if voz_cut.exists() and captions.exists():
        step("1/5", "_voz_cut.m4a y captions.json ya existen, salteando corte.")
    else:
        step("1/5", "Cortando voz + transcribiendo...")
        subprocess.run([sys.executable, str(ENGINE / "scripts/cut_silences_and_fillers.py"),
                        str(voz), str(dest), "--audio-only"], check=True)

    # 2/5 — MANIFEST faceless → cues.json
    step("2/5", "Parseando MANIFEST faceless...")
    subprocess.run([sys.executable, str(SKILL / "scripts/faceless_manifest_to_cues.py"), str(dest)], check=True)

    # 3/5 — captions cinéticos
    step("3/5", "Generando captions cinéticos...")
    subprocess.run([sys.executable, str(SKILL / "scripts/generate_kinetic_captions.py"), str(dest)], check=True)

    # 4/5 — setup public/
    step("4/5", "Preparando public/...")
    pub = TEMPLATE / "public"
    for sub in ("USER", "IA", "WEB"):
        srcdir = dest / sub
        if srcdir.is_dir():
            for f in srcdir.iterdir():
                if f.is_file():
                    copy_or_link(f, pub / sub / f.name)
    copy_or_link(voz_cut, pub / voz_cut.name)

    # 5/5 — render
    step("5/5", "Renderizando tutorial-faceless...")
    npx = shutil.which("npx") or "npx"
    subprocess.run([npx, "tsx", "scripts/render.ts",
                    "--mode", "tutorial",
                    "--audio", str(voz_cut),
                    "--transcript", str(captions),
                    "--cues", str(dest / "cues.json"),
                    "--captions", str(dest / "captions_kinetic.json"),
                    "--out", str(dest / "BORRADOR_AUTO.mp4")],
                   cwd=str(TEMPLATE), check=True)
    step("done", str(dest / "BORRADOR_AUTO.mp4"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
