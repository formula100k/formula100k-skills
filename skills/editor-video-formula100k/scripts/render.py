#!/usr/bin/env python3
"""Orquestador cross-platform del editor de video FÓRMULA 100K.

Uso:
    python render.py <DEST_FOLDER> <SOURCE_VIDEO>

Produce $DEST_FOLDER/BORRADOR_AUTO.mp4 a partir de:
    $DEST_FOLDER/MANIFEST.md   (keyword-based)
    $SOURCE_VIDEO              (.mov o .mp4 sin editar)

Funciona en macOS y Windows. En Mac usa mlx-whisper; en Windows faster-whisper.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path


def stderr(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def step(idx: str, msg: str) -> None:
    stderr(f'[{idx}] {msg}')


def fail(msg: str, code: int = 1) -> 'None':
    stderr(f'ERROR: {msg}')
    sys.exit(code)


def copy_or_link(src: Path, dst: Path) -> None:
    """Hard-link cuando se puede (Mac/Linux mismo volumen); copy otherwise."""
    if dst.exists():
        if dst.is_dir():
            shutil.rmtree(dst)
        else:
            dst.unlink()
    try:
        if src.is_dir():
            shutil.copytree(src, dst, copy_function=os.link)
        else:
            os.link(src, dst)
    except (OSError, NotImplementedError):
        if src.is_dir():
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('dest', help='Carpeta con MANIFEST.md (output va aquí también)')
    ap.add_argument('source', help='Ruta al video fuente (.mov / .mp4)')
    args = ap.parse_args()

    dest = Path(args.dest).expanduser().resolve()
    source = Path(args.source).expanduser().resolve()

    if not dest.is_dir():
        fail(f'No encuentro la carpeta destino: {dest}')
    if not (dest / 'MANIFEST.md').is_file():
        fail(f'No encuentro {dest / "MANIFEST.md"}')
    if not source.is_file():
        fail(f'No encuentro el video fuente: {source}')

    script_dir = Path(__file__).resolve().parent
    skill_dir = script_dir.parent
    template_dir = skill_dir / 'remotion-template'

    cut_video = dest / '_source_cut.mov'
    captions = dest / 'captions.json'

    # Paso A — Cortar silencios + transcribir (idempotente)
    if cut_video.exists() and captions.exists():
        step('1/4', '_source_cut.mov y captions.json ya existen, salteando corte.')
    else:
        step('1/4', 'Cortando silencios + transcribiendo...')
        subprocess.run(
            [sys.executable, str(script_dir / 'cut_silences_and_fillers.py'),
             str(source), str(dest)],
            check=True,
        )

    # Paso B — MANIFEST.md → cues.json
    step('2/4', 'Parseando MANIFEST.md → cues.json')
    subprocess.run(
        [sys.executable, str(script_dir / 'manifest_to_cues.py'), str(dest)],
        check=True,
    )

    # Paso C — Preparar public/ del template
    # Limpieza selectiva: borra solo los assets del proyecto anterior,
    # preserva archivos del template como sfx/pop.wav.
    step('3/4', 'Preparando public/ ...')
    pub = template_dir / 'public'
    pub.mkdir(parents=True, exist_ok=True)
    for sub in ('WEB', 'IA', 'USER'):
        if (pub / sub).exists():
            shutil.rmtree(pub / sub)
        srcd = dest / sub
        if srcd.is_dir():
            copy_or_link(srcd, pub / sub)
    if (pub / '_source_cut.mov').exists():
        (pub / '_source_cut.mov').unlink()
    copy_or_link(cut_video, pub / '_source_cut.mov')

    # Paso D — Render con npx tsx
    step('4/4', 'Renderizando reel-viral...')
    out = dest / 'BORRADOR_AUTO.mp4'
    # En Windows npx es npx.cmd
    npx = 'npx.cmd' if sys.platform == 'win32' else 'npx'
    subprocess.run(
        [npx, 'tsx', 'scripts/render.ts',
         '--video', '_source_cut.mov',
         '--transcript', str(captions),
         '--cues', str(dest / 'cues.json'),
         '--out', str(out)],
        cwd=str(template_dir),
        check=True,
    )

    stderr('Done.')
    print(str(out))
    return 0


if __name__ == '__main__':
    sys.exit(main())
