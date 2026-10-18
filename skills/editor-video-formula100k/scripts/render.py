#!/usr/bin/env python3
"""Orquestador del editor de video. Corre igual en Mac y en Windows.

No se llama directo: lo lanza `scripts/editar.mjs`, que trae Python y sus
librerías con uv.

Uso:
    python render.py <DEST_FOLDER> <SOURCE_VIDEO> [--solo-corte] [--recortar] [flags del corte]

Produce $DEST_FOLDER/BORRADOR_AUTO.mp4 a partir de:
    $DEST_FOLDER/MANIFEST.md   (keyword-based)
    $SOURCE_VIDEO              (.mov o .mp4 sin editar)

Transcribe con mlx-whisper en Mac con chip Apple y con faster-whisper en
Windows y en Mac con procesador Intel.
"""

from __future__ import annotations

import argparse
import json
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


def despacho_por_formato(formato: str | None) -> tuple[list[str], bool, str]:
    """Qué modo de `render.ts` monta este formato.

    Devuelve `(flags_de_modo, admite_extras, etiqueta_humana)`.

    `noticiero` es horizontal 1920×1080 y usa la composición
    `news-horizontal`, con su propio juego de cues (ticker, chyrons,
    tarjetas). El resto de los formatos comparten `reel-viral`, que es el
    default de render.ts cuando no se le pasa `--mode`.

    `admite_extras` es False para noticiero porque los flags de canvas y
    pizarra son de formatos verticales: render.ts los ignoraría, pero
    mandarlos sugeriría que hacen algo.
    """
    if formato == 'noticiero':
        return ['--mode', 'news'], False, 'news-horizontal (1920×1080)'
    return [], True, 'reel-viral (1080×1920)'


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('dest', help='Carpeta con MANIFEST.md (output va aquí también)')
    ap.add_argument('source', help='Ruta al video fuente (.mov / .mp4)')
    ap.add_argument('--solo-corte', action='store_true',
                    help='Corta y transcribe, y se detiene antes del montaje')
    ap.add_argument('--recortar', action='store_true',
                    help='Rehace el corte aunque ya exista')
    # Lo que no conoce este script va tal cual al corte (--min-silence,
    # --semantic-level, --no-semantic, --guion…).
    args, flags_corte = ap.parse_known_args()

    dest = Path(args.dest).expanduser().resolve()
    source = Path(args.source).expanduser().resolve()

    if not dest.is_dir():
        fail(f'No encuentro la carpeta destino: {dest}')
    if not args.solo_corte and not (dest / 'MANIFEST.md').is_file():
        fail(f'No encuentro {dest / "MANIFEST.md"}')
    if not source.is_file():
        fail(f'No encuentro el video fuente: {source}')

    script_dir = Path(__file__).resolve().parent
    skill_dir = script_dir.parent
    template_dir = skill_dir / 'remotion-template'

    cut_video = dest / '_source_cut.mov'
    captions = dest / 'captions.json'

    # Paso A — Cortar silencios + transcribir (idempotente)
    if args.recortar:
        for viejo in (cut_video, captions, dest / 'edl.json', dest / 'corte.json'):
            if viejo.exists():
                viejo.unlink()
    if cut_video.exists() and captions.exists():
        step('1/4', '_source_cut.mov y captions.json ya existen: no vuelvo a cortar '
                    '(usa --recortar para rehacer el corte).')
    else:
        step('1/4', 'Cortando silencios + transcribiendo...')
        r = subprocess.run(
            [sys.executable, str(script_dir / 'cut_silences_and_fillers.py'),
             str(source), str(dest), *flags_corte],
        )
        if r.returncode != 0:
            fail('El corte no terminó. El mensaje de arriba dice por qué.', r.returncode)

    if args.solo_corte:
        stderr('Corte listo. Falta el montaje.')
        print(str(cut_video))
        return 0

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

    # Limpieza del canvas de un proyecto anterior: siempre se borran los
    # `_canvas.*` que hubiera en public/ antes de decidir si este proyecto
    # trae uno nuevo. Si no lo trae, el barrido ya dejó public/ limpio.
    for viejo in pub.glob('_canvas.*'):
        viejo.unlink()
    for viejo in list(pub.glob('_lienzo.*')) + list(pub.glob('_cutout.*')):
        viejo.unlink()

    # Canvas opcional para el formato pip: primer .mp4/.mov/.webm dentro de
    # $DEST/CANVAS/, copiado SIEMPRE a un nombre reservado (`_canvas<ext>`),
    # nunca con el nombre original. Si se copiara con su nombre original y
    # el usuario llamó a su grabación igual que el archivo que este script
    # ya gestiona (p. ej. `_source_cut.mov`), el canvas pisaría la toma de
    # cámara en public/ y `render.ts` recibiría `--video` y `--canvas`
    # apuntando al mismo archivo: la cámara desaparecería en silencio y el
    # lienzo se dibujaría dos veces. El nombre reservado hace esa colisión
    # imposible.
    canvas_arg: list[str] = []
    canvas_dir = dest / 'CANVAS'
    if canvas_dir.is_dir():
        candidatos = sorted(
            p for p in canvas_dir.iterdir()
            if p.suffix.lower() in {'.mp4', '.mov', '.webm'}
        )
        if candidatos:
            elegido = candidatos[0]
            stderr(
                f'[warn] canvas de pip: uso {elegido.name} de CANVAS/'
                + (f' ({len(candidatos)} candidatos, orden alfabético)'
                   if len(candidatos) > 1 else '')
            )
            nombre_canvas = f'_canvas{elegido.suffix.lower()}'
            copy_or_link(elegido, pub / nombre_canvas)
            canvas_arg = ['--canvas', nombre_canvas]

    # Insumos opcionales del formato `pizarra`. Mismo criterio que el canvas
    # de pip: se copian SIEMPRE a un nombre reservado (`_lienzo.*`,
    # `_cutout.*`), nunca con el suyo, para que no puedan pisar
    # `_source_cut.mov` ni entre sí.
    #
    # El cutout se busca por nombre porque es un artefacto derivado que la
    # usuaria genera con un quita-fondos de video; el lienzo es un video de
    # trazos con transparencia. Los dos son opcionales: sin ellos el
    # formato avisa y cae a fullscreen (ver pizarra.tsx), no rompe.
    def _primer_archivo(patrones: list[str]) -> Path | None:
        vistos: list[Path] = []
        for patron in patrones:
            vistos.extend(sorted(dest.glob(patron)))
        return vistos[0] if vistos else None

    def _a_webm_con_alfa(origen: Path, destino: Path) -> Path:
        """Convierte a VP9/webm si hace falta, y devuelve lo que se debe usar.

        Chrome —y por lo tanto Remotion— **no** respeta el alfa de un .mov
        HEVC: se comprobó decodificando un frame contra un fondo rojo y el
        rojo no aparecía por ningún lado, el frame salía opaco entero. Y el
        formato ligero habitual de un lienzo con transparencia es justamente
        un .mov HEVC con alfa.
        O sea: el insumo natural de este formato es ilegible para el motor
        de render sin convertirlo antes.

        VP9 en .webm sí lo respeta (mismo experimento, rojo visible). Así que
        se convierte una vez y se cachea junto al original: se deja el
        .mov tal cual y esto se ocupa solo.
        """
        if origen.suffix.lower() == '.webm':
            return origen
        if destino.is_file() and destino.stat().st_mtime >= origen.stat().st_mtime:
            stderr(f'[warn] pizarra: reuso {destino.name} (ya convertido)')
            return destino
        stderr(f'[warn] pizarra: {origen.name} es {origen.suffix} — Chrome no lee '
               'su alfa; convirtiendo a VP9/webm (una sola vez)...')
        subprocess.run(
            ['ffmpeg', '-y', '-v', 'error', '-i', str(origen),
             '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p',
             '-auto-alt-ref', '0', '-b:v', '4M', '-an', str(destino)],
            check=True,
        )
        return destino

    pizarra_args: list[str] = []
    if (cues_json := dest / 'cues.json').is_file():
        try:
            formato_pedido = json.loads(cues_json.read_text(encoding='utf-8')).get('formato')
        except (json.JSONDecodeError, OSError):
            formato_pedido = None
    else:
        formato_pedido = None

    if formato_pedido == 'pizarra':
        lienzo = _primer_archivo(['*lienzo*.mov', '*lienzo*.webm',
                                  'PIZARRA/*.mov', 'PIZARRA/*.webm'])
        cutout = _primer_archivo(['*cutout*.webm', '*cutout*.mov'])
        for etiqueta, elegido, flag in (('lienzo', lienzo, '--lienzo'),
                                        ('cutout', cutout, '--cutout')):
            if elegido is None:
                stderr(f'[warn] pizarra: no encuentro el {etiqueta} en {dest.name}/')
                continue
            stderr(f'[warn] pizarra: uso {elegido.name} como {etiqueta}')
            usable = _a_webm_con_alfa(
                elegido, dest / f'_{etiqueta}_alfa.webm'
            )
            nombre = f'_{etiqueta}{usable.suffix.lower()}'
            copy_or_link(usable, pub / nombre)
            pizarra_args += [flag, nombre]

    # Paso D — Render con npx tsx
    #
    # El modo lo decide el formato: `noticiero` es horizontal 1920×1080 y usa
    # la composición `news-horizontal`, con su propio juego de cues (ticker,
    # chyrons, tarjetas). El resto de los formatos comparten la composición
    # vertical `reel-viral`, que es el default de render.ts cuando no se pasa
    # `--mode`. Los flags de canvas/pizarra son de formatos verticales, así
    # que no se pasan en modo news (render.ts los ignoraría, pero mandarlos
    # sugeriría que hacen algo).
    modo_arg, usa_extras, etiqueta = despacho_por_formato(formato_pedido)
    extra_args = [*canvas_arg, *pizarra_args] if usa_extras else []

    step('4/4', f'Renderizando {etiqueta}...')
    out = dest / 'BORRADOR_AUTO.mp4'
    # En Windows npx es npx.cmd
    if not (template_dir / 'node_modules' / 'remotion').is_dir():
        fail('Falta instalar el motor de montaje. Corre: node '
             f'"{script_dir / "preparar.mjs"}"')
    npx = 'npx.cmd' if sys.platform == 'win32' else 'npx'
    subprocess.run(
        [npx, 'tsx', 'scripts/render.ts',
         *modo_arg,
         '--video', '_source_cut.mov',
         '--transcript', str(captions),
         '--cues', str(dest / 'cues.json'),
         *extra_args,
         '--out', str(out)],
        cwd=str(template_dir),
        check=True,
    )

    stderr('Done.')
    print(str(out))
    return 0


if __name__ == '__main__':
    sys.exit(main())
