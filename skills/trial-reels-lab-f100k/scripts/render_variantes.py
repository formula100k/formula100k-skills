#!/usr/bin/env python3
"""
render_variantes.py — Paso 6 de trial-reels-lab-f100k.

Renderiza cada composición HyperFrames a .mov con ALFA REAL (ProRes 4444) y,
según el modo:

  --modo video : compone el overlay sobre el video base con ffmpeg y entrega
                 VARIANTE_A.mp4 … VARIANTE_D.mp4 listos para subir.
  --modo pack  : deja los overlay_[A-D].mov con alfa y escribe HOJA_MONTAJE.md
                 con las posiciones exactas para que el editor los monte.

Nunca se usa chroma key. El anti-aliasing de las letras dejaba halo magenta;
HyperFrames exporta alfa de verdad, así que se compone con `overlay` directo.

Uso:
    python3 render_variantes.py <carpeta_TRIAL_REELS> --modo video|pack
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

MUTACIONES = {
    "none": "sin mutación",
    "zoom": "zoom 1.02×",
    "speed": "velocidad 1.02×",
}
FACTOR = 1.02


def run(cmd: list[str], descripcion: str) -> None:
    cp = subprocess.run(cmd, capture_output=True, text=True)
    if cp.returncode != 0:
        sys.exit(f"{descripcion} falló:\n{cp.stderr[-2500:]}")


def render_overlay(comp_dir: Path, destino: Path) -> None:
    """ProRes 4444 con canal alfa. Si falla, se intenta WebM VP9 con alfa."""
    cmd = [
        "hyperframes", "render", str(comp_dir),
        "--format", "mov", "--output", str(destino),
    ]
    cp = subprocess.run(cmd, capture_output=True, text=True)
    if cp.returncode == 0 and destino.exists():
        return

    print(f"⚠ Render mov falló para {comp_dir.name}; probando webm.",
          file=sys.stderr)
    alt = destino.with_suffix(".webm")
    run(["hyperframes", "render", str(comp_dir),
         "--format", "webm", "--output", str(alt)],
        f"Render de {comp_dir.name}")
    if not alt.exists():
        sys.exit(f"No se pudo renderizar {comp_dir}.")
    destino.unlink(missing_ok=True)
    alt.rename(destino.with_suffix(".webm"))


def componer(base: Path, overlay: Path, entrada: float, salida: Path,
             ancho: int, alto: int, mutacion: str) -> None:
    """
    Compone overlay sobre base y después aplica la mutación técnica.

    El orden importa: la mutación va DESPUÉS de componer. Si se aplicara antes,
    el `speed` desincronizaría el overlay respecto al audio.
    """
    intermedio = salida.with_name(salida.stem + "_pre.mp4")

    # eof_action=pass: cuando el overlay se acaba, el resto del video sigue limpio.
    filtro = (
        f"[1:v]setpts=PTS-STARTPTS+{entrada}/TB[ov];"
        f"[0:v][ov]overlay=0:0:eof_action=pass:shortest=0[v]"
    )
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(base), "-i", str(overlay),
        "-filter_complex", filtro,
        "-map", "[v]", "-map", "0:a?",
        "-c:v", "libx264", "-crf", "18", "-preset", "medium",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
        str(intermedio),
    ]
    run(cmd, f"Composición de {salida.name}")

    if mutacion == "none":
        intermedio.rename(salida)
        return

    if mutacion == "zoom":
        # Escala 1.02× y recorta al tamaño original: imperceptible a ojo.
        cmd = [
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(intermedio),
            "-vf", (f"scale=iw*{FACTOR}:ih*{FACTOR},"
                    f"crop={ancho}:{alto}:(iw-{ancho})/2:(ih-{alto})/2"),
            "-c:v", "libx264", "-crf", "18", "-preset", "medium",
            "-pix_fmt", "yuv420p", "-c:a", "copy", str(salida),
        ]
    elif mutacion == "speed":
        cmd = [
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(intermedio),
            "-filter_complex",
            f"[0:v]setpts=PTS/{FACTOR}[v];[0:a]atempo={FACTOR}[a]",
            "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-crf", "18", "-preset", "medium",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", str(salida),
        ]
    else:
        sys.exit(f"Mutación desconocida: {mutacion}")

    run(cmd, f"Mutación {mutacion} de {salida.name}")
    intermedio.unlink(missing_ok=True)


def hoja_montaje(cfg: dict, base: Path, overlays: dict[str, Path]) -> Path:
    ancho, alto = cfg["resolucion"]
    hairline = cfg.get("hairline_y") or round(alto * 0.42)
    bottom_inf = round(520 / 1920 * alto)

    L = [
        f"# Hoja de montaje — {cfg.get('proyecto', 'trial reels')}",
        "",
        f"{len(cfg['variantes'])} overlays de gancho con **alfa real** "
        "(ProRes 4444). Se montan "
        "sobre la misma toma base: lo único que cambia entre variantes son los "
        "primeros segundos visuales. El cuerpo del video, el audio y la caption "
        "van idénticos en todas.",
        "",
        "## Reglas de posición",
        "",
        f"- **Superior:** el borde INFERIOR del overlay va al ras del cabello, "
        f"a **y = {hairline}px** desde arriba. No dejarlo flotando en el vacío.",
        f"- **Inferior:** a la altura del pecho, **bottom = {bottom_inf}px**. "
        f"Nunca por encima de la barbilla.",
        "- **Centro: prohibido.** Tapa la cara.",
        f"- Lienzo: **{ancho}×{alto}**, alineado a 0,0. No reescalar.",
        "",
        "## Caption (la misma en todas)",
        "",
        "```",
        cfg.get("caption", "— pendiente —"),
        "```",
        "",
        "## Variantes",
        "",
    ]

    for v in cfg["variantes"]:
        archivo = overlays.get(v["id"])
        entrada = float(v.get("entrada", 0.0))
        salida_t = float(v.get("salida", cfg["duracion_overlay"]))
        texto = v.get("texto", "")
        if v.get("subtexto"):
            texto += f"\n{v['subtexto']}"

        L += [
            f"### Variante {v['id']} — {v['celda'].upper()}",
            "",
            f"- **Archivo:** `{archivo.name if archivo else 'sin render'}`",
            f"- **Entra en:** {entrada}s · **sale en:** {salida_t}s",
            f"- **Posición:** {v.get('posicion', 'superior')}",
            f"- **Mutación técnica:** {MUTACIONES.get(v.get('mutacion','none'))}",
            f"- **Por qué existe:** {v.get('por_que', '—')}",
            "",
            "Texto en pantalla:",
            "",
            "```",
            texto,
            "```",
            "",
        ]

    L += [
        "## Antes de entregar",
        "",
        "- [ ] Ningún overlay tapa la cara ni cae en el centro del cuadro",
        "- [ ] El overlay superior apoya en el cabello, sin hueco visible arriba",
        f"- [ ] Las {len(cfg['variantes'])} variantes son idénticas después "
        "del segundo "
        f"{cfg['duracion_overlay']}",
        "- [ ] Los assets con transparencia no van fullscreen",
        "- [ ] Exportar 1080×1920, H.264, sin marca de agua",
        "",
    ]

    destino = base / "HOJA_MONTAJE.md"
    destino.write_text("\n".join(L), encoding="utf-8")
    return destino


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("carpeta", type=Path)
    ap.add_argument("--modo", choices=["video", "pack"], required=True)
    args = ap.parse_args()

    base = args.carpeta.expanduser().resolve()
    cfg = json.loads((base / "variantes.json").read_text(encoding="utf-8"))
    cfg.setdefault("resolucion", [1080, 1920])
    cfg.setdefault("duracion_overlay", 3.0)
    ancho, alto = cfg["resolucion"]

    if args.modo == "video":
        video_base = Path(cfg.get("base") or "").expanduser()
        if not video_base.exists():
            sys.exit(f"MODO VIDEO necesita 'base' válido en variantes.json "
                     f"(recibido: {cfg.get('base')!r})")

    overlays: dict[str, Path] = {}
    for v in cfg["variantes"]:
        comp = base / f"comp_{v['id']}"
        if not comp.exists():
            sys.exit(f"Falta {comp}. Correr build_overlays.py primero.")
        destino = base / f"overlay_{v['id']}.mov"
        print(f"→ Renderizando overlay {v['id']} ({v['celda']})…")
        render_overlay(comp, destino)
        real = destino if destino.exists() else destino.with_suffix(".webm")
        overlays[v["id"]] = real
        print(f"  ✓ {real.name}")

    if args.modo == "pack":
        hoja = hoja_montaje(cfg, base, overlays)
        print(f"\n✓ Pack listo en {base}")
        print(f"  {hoja.name} + {len(overlays)} overlays con alfa")
        print("  Eso es lo que recibe el editor.")
        return

    for v in cfg["variantes"]:
        salida = base / f"VARIANTE_{v['id']}.mp4"
        mut = v.get("mutacion", "none")
        print(f"→ Componiendo VARIANTE_{v['id']} ({MUTACIONES.get(mut, mut)})…")
        componer(
            base=Path(cfg["base"]).expanduser(),
            overlay=overlays[v["id"]],
            entrada=float(v.get("entrada", 0.0)),
            salida=salida,
            ancho=ancho, alto=alto, mutacion=mut,
        )
        print(f"  ✓ {salida.name}")

    print(f"\n✓ {len(cfg['variantes'])} variantes listas en {base}")
    print("  Siguiente: plan_publicacion.py --recordatorios")


if __name__ == "__main__":
    main()
