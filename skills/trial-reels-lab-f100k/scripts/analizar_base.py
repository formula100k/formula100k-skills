#!/usr/bin/env python3
"""
analizar_base.py — Paso 1 del MODO VIDEO de trial-reels-lab-f100k.

Toma el video grabado y deja listo todo lo que hace falta para escribir las
4 variantes de gancho:

  - metadatos reales (duración, fps, resolución) leídos con ffprobe
  - transcript palabra por palabra (mlx-whisper en Apple Silicon,
    faster-whisper como respaldo)
  - hook_end: dónde termina el gancho HABLADO, detectado por la primera
    pausa real después de los 1.8s
  - 4 frames PNG del arranque, para que Claude los MIRE antes de diseñar
    los overlays (dónde está el hairline, si hay objeto en mano, qué zonas
    del cuadro están libres)

Uso:
    python3 analizar_base.py /ruta/al/video.mov [--outdir DIR]

Escribe <carpeta_del_video>/TRIAL_REELS/analisis.json y los frames.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

# Instantes (en segundos) de los frames que se extraen para inspección visual.
FRAMES_EN = [0.0, 0.5, 1.0, 2.0]

# El gancho hablado nunca termina antes de esto ni se busca más allá.
HOOK_MIN_S = 1.8
HOOK_MAX_S = 6.0
# Una pausa de al menos este largo entre dos palabras cuenta como fin de frase.
PAUSA_MIN_S = 0.35


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def probe(video: Path) -> dict:
    """Metadatos reales del contenedor. Sin adivinar nada."""
    cp = run([
        "ffprobe", "-v", "error", "-print_format", "json",
        "-show_format", "-show_streams", str(video),
    ])
    if cp.returncode != 0:
        sys.exit(f"ffprobe falló sobre {video}:\n{cp.stderr}")

    data = json.loads(cp.stdout)
    vstream = next(
        (s for s in data["streams"] if s.get("codec_type") == "video"), None
    )
    if vstream is None:
        sys.exit(f"{video} no tiene pista de video.")

    # r_frame_rate llega como "30000/1001"
    num, _, den = vstream.get("r_frame_rate", "30/1").partition("/")
    fps = round(float(num) / float(den or 1), 3)

    tiene_audio = any(s.get("codec_type") == "audio" for s in data["streams"])

    return {
        "duracion": round(float(data["format"]["duration"]), 3),
        "fps": fps,
        "ancho": int(vstream["width"]),
        "alto": int(vstream["height"]),
        "tiene_audio": tiene_audio,
    }


def extraer_audio(video: Path, work: Path) -> Path:
    """16 kHz mono — lo que quiere Whisper."""
    wav = work / "audio.wav"
    cp = run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", str(wav),
    ])
    if cp.returncode != 0:
        sys.exit(f"No se pudo extraer el audio:\n{cp.stderr}")
    return wav


def _palabras_desde_segmentos(segments: list[dict]) -> list[dict]:
    """Aplana la salida de Whisper a una lista plana de palabras."""
    palabras: list[dict] = []
    for seg in segments:
        for w in seg.get("words") or []:
            texto = (w.get("word") or w.get("text") or "").strip()
            if not texto:
                continue
            palabras.append({
                "palabra": texto,
                "inicio": round(float(w["start"]), 3),
                "fin": round(float(w["end"]), 3),
            })
    return palabras


def transcribir(wav: Path, work: Path) -> list[dict]:
    """
    mlx-whisper primero (rápido en Apple Silicon), faster-whisper de respaldo.
    Devuelve [] si ninguno está disponible — el flujo sigue, solo pierde el
    hook_end automático.
    """
    if shutil.which("uvx"):
        cp = run([
            "uvx", "--from", "mlx-whisper", "mlx_whisper", str(wav),
            "--model", "mlx-community/whisper-large-v3-mlx",
            "--language", "es", "--word-timestamps", "True",
            "--output-format", "json", "--output-dir", str(work),
        ])
        salida = work / f"{wav.stem}.json"
        if cp.returncode == 0 and salida.exists():
            data = json.loads(salida.read_text(encoding="utf-8"))
            palabras = _palabras_desde_segmentos(data.get("segments", []))
            if palabras:
                return palabras
        print("⚠ mlx-whisper no dio resultado; probando faster-whisper.",
              file=sys.stderr)

    try:
        from faster_whisper import WhisperModel  # type: ignore
    except ImportError:
        print("⚠ Sin transcriptor disponible. hook_end quedará en null y hay "
              "que fijarlo a mano mirando el video.", file=sys.stderr)
        return []

    modelo = WhisperModel("large-v3", device="auto", compute_type="int8")
    segments, _ = modelo.transcribe(str(wav), language="es", word_timestamps=True)
    return _palabras_desde_segmentos(
        [{"words": [w._asdict() for w in (s.words or [])]} for s in segments]
    )


def detectar_hook_end(palabras: list[dict], duracion: float) -> float | None:
    """
    El gancho hablado termina en la primera pausa real después de HOOK_MIN_S.
    Si no hay ninguna pausa clara, se corta en la primera palabra que termine
    pasados los 3s. Es una estimación — por eso siempre se revisa mirando los
    frames antes de diseñar los overlays.
    """
    if not palabras:
        return None

    tope = min(HOOK_MAX_S, duracion)

    for actual, siguiente in zip(palabras, palabras[1:]):
        if actual["fin"] < HOOK_MIN_S:
            continue
        if actual["fin"] > tope:
            break
        if siguiente["inicio"] - actual["fin"] >= PAUSA_MIN_S:
            return round(actual["fin"], 2)

    for w in palabras:
        if w["fin"] >= 3.0:
            return round(min(w["fin"], tope), 2)

    return round(min(palabras[-1]["fin"], tope), 2)


def extraer_frames(video: Path, outdir: Path) -> list[dict]:
    frames = []
    for t in FRAMES_EN:
        nombre = f"frame_{int(t * 10):02d}.png"
        destino = outdir / nombre
        cp = run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-ss", str(t), "-i", str(video),
            "-frames:v", "1", str(destino),
        ])
        if cp.returncode == 0 and destino.exists():
            frames.append({"t": t, "archivo": str(destino)})
        else:
            print(f"⚠ No se pudo extraer el frame de {t}s.", file=sys.stderr)
    return frames


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("video", type=Path)
    ap.add_argument("--outdir", type=Path, default=None,
                    help="por defecto <carpeta_del_video>/TRIAL_REELS")
    args = ap.parse_args()

    video = args.video.expanduser().resolve()
    if not video.exists():
        sys.exit(f"No existe: {video}")

    outdir = (args.outdir or video.parent / "TRIAL_REELS").expanduser().resolve()
    work = outdir / ".work"
    outdir.mkdir(parents=True, exist_ok=True)
    work.mkdir(exist_ok=True)

    print(f"→ Analizando {video.name}")
    meta = probe(video)
    print(f"  {meta['ancho']}×{meta['alto']} · {meta['fps']} fps · "
          f"{meta['duracion']}s")

    palabras: list[dict] = []
    if meta["tiene_audio"]:
        print("→ Transcribiendo (puede tardar)…")
        palabras = transcribir(extraer_audio(video, work), work)
        print(f"  {len(palabras)} palabras")
    else:
        print("  El video no tiene audio; no hay gancho hablado que detectar.")

    hook_end = detectar_hook_end(palabras, meta["duracion"])
    texto_gancho = " ".join(
        w["palabra"] for w in palabras
        if hook_end is not None and w["fin"] <= hook_end
    ).strip()

    print("→ Extrayendo frames…")
    frames = extraer_frames(video, outdir)

    analisis = {
        "video": str(video),
        **meta,
        "hook_end": hook_end,
        "hook_texto": texto_gancho or None,
        "frames": frames,
        "transcript": palabras,
    }
    destino = outdir / "analisis.json"
    destino.write_text(
        json.dumps(analisis, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"\n✓ {destino}")
    if hook_end:
        print(f"  hook_end estimado: {hook_end}s → «{texto_gancho}»")
    else:
        print("  hook_end: null — fijarlo a mano en variantes.json")
    print("\nSIGUIENTE: mirar los frames con Read antes de diseñar los overlays:")
    for f in frames:
        print(f"  {f['archivo']}")


if __name__ == "__main__":
    main()
