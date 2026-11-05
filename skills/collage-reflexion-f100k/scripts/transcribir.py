# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["faster-whisper>=1.1,<2", "av<19"]   # PyAV 19 cambió la forma de abrir el audio y faster-whisper 1.x no la conoce
# ///
"""Transcribe un audio con faster-whisper (sin tarjeta de video) y deja el mismo JSON que Whisper:
segments[].words[] = { word, start, end }. Lo llama sistema.mjs con `uv run`, que baja Python y lo que haga falta.

Uso: uv run transcribir.py <audio> --dir <carpeta> [--idioma es] [--formato json|txt] [--modelo large-v3-turbo]
Deja <carpeta>/<nombre del audio>.json (o .txt). El modelo también se cambia con F100K_WHISPER_MODELO
(por ejemplo `small` en una compu lenta).
"""
import argparse
import json
import os
import sys
from pathlib import Path


def main() -> int:
    for flujo in (sys.stdout, sys.stderr):
        try:
            flujo.reconfigure(encoding="utf-8")
        except Exception:
            pass
    p = argparse.ArgumentParser()
    p.add_argument("audio")
    p.add_argument("--dir", required=True)
    p.add_argument("--idioma", default="es")
    p.add_argument("--formato", default="json", choices=["json", "txt"])
    p.add_argument("--modelo", default=os.environ.get("F100K_WHISPER_MODELO") or "large-v3-turbo")
    a = p.parse_args()

    audio = Path(a.audio)
    if not audio.exists():
        print(f"No existe el audio: {audio}", file=sys.stderr)
        return 1
    destino = Path(a.dir)
    destino.mkdir(parents=True, exist_ok=True)

    from faster_whisper import WhisperModel

    print(f"faster-whisper ({a.modelo}); la primera vez descarga el modelo", file=sys.stderr)
    modelo = WhisperModel(a.modelo, device="cpu", compute_type="int8")
    tramos, info = modelo.transcribe(
        str(audio), language=a.idioma, word_timestamps=True, condition_on_previous_text=False
    )
    segmentos = []
    for n, s in enumerate(tramos):
        segmentos.append({
            "id": n, "start": round(s.start, 3), "end": round(s.end, 3), "text": s.text,
            "words": [
                {"word": w.word, "start": round(w.start, 3), "end": round(w.end, 3), "probability": round(w.probability, 4)}
                for w in (s.words or [])
            ],
        })
    texto = "".join(s["text"] for s in segmentos).strip()
    if a.formato == "txt":
        salida = destino / (audio.stem + ".txt")
        salida.write_text("\n".join(s["text"].strip() for s in segmentos) + "\n", encoding="utf-8")
    else:
        salida = destino / (audio.stem + ".json")
        salida.write_text(
            json.dumps({"text": texto, "segments": segmentos, "language": info.language}, ensure_ascii=False),
            encoding="utf-8",
        )
    print(str(salida))
    return 0


if __name__ == "__main__":
    sys.exit(main())
