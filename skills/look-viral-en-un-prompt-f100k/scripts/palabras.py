"""Paso 2: transcribe tu toma palabra por palabra.

Saca trabajo/palabras.json: [{"w": "hola", "s": 0.42, "e": 0.71}, ...]

Uso: python palabras.py CARPETA_DE_TRABAJO [--idioma es] [--json transcripcion_whisper.json]

En Mac con chip Apple usa mlx_whisper (lo baja solo con uvx la primera vez).
En Windows y en Mac Intel usa faster-whisper (lo instala look.mjs; más lento: usa el procesador).
También puedes pasar una transcripción tuya (Whisper con tiempos por palabra, JSON) con --json.
"""
import argparse
import json
import os
import platform
import subprocess


def aplanar(datos):
    sal = []
    for seg in datos.get("segments", []):
        for p in seg.get("words", []):
            w = p.get("word", "").strip()
            if w:
                sal.append({"w": w, "s": round(float(p["start"]), 3), "e": round(float(p["end"]), 3)})
    # Whisper a veces estira la palabra que sigue a un silencio hacia atrás: la acortamos.
    for p in sal:
        if p["e"] - p["s"] > 1.2:
            p["s"] = round(p["e"] - 0.6, 3)
    return sal


def transcribir_faster(wav, salida, idioma, pista):
    """faster-whisper (Windows y Mac Intel). El audio se lee con ffmpeg: así no depende de PyAV."""
    import numpy as np
    from faster_whisper import WhisperModel
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    modelo = WhisperModel(os.environ.get("F100K_WHISPER_MODELO", "large-v3-turbo"), device="cpu", compute_type="int8")
    segs, _ = modelo.transcribe(audio, language=idioma, word_timestamps=True, initial_prompt=pista)
    datos = {"segments": [{"start": s.start, "end": s.end, "text": s.text,
                           "words": [{"word": w.word, "start": w.start, "end": w.end} for w in (s.words or [])]} for s in segs]}
    with open(salida, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("trabajo")
    ap.add_argument("--idioma", default="es")
    ap.add_argument("--json")
    ap.add_argument("--pista", default="Claude, ChatGPT, Instagram, TikTok, reels.",
                    help="palabras que Whisper suele oír mal (marcas, nombres)")
    a = ap.parse_args()

    if a.json:
        crudo = a.json
    else:
        wav = os.path.join(a.trabajo, "voz.wav")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", os.path.join(a.trabajo, "base.mp4"),
                        "-ar", "16000", "-ac", "1", wav], check=True)
        print("Transcribiendo (la primera vez descarga el modelo)…")
        crudo = os.path.join(a.trabajo, "voz.json")
        apple = platform.system() == "Darwin" and platform.machine() == "arm64" and os.environ.get("F100K_TRANSCRIPCION") != "faster"
        if apple:
            r = subprocess.run(["uvx", "--from", "mlx-whisper", "mlx_whisper", wav,
                                "--model", "mlx-community/whisper-large-v3-turbo", "--language", a.idioma,
                                "--word-timestamps", "True", "--initial-prompt", a.pista, "--output-format", "json",
                                "--output-dir", a.trabajo], capture_output=True, text=True)
            if r.returncode != 0:
                raise SystemExit(r.stderr[-2000:] + "\nNo pude transcribir con mlx_whisper. "
                                 "Prueba con F100K_TRANSCRIPCION=faster o pasa tu transcripción con --json archivo.json")
        else:
            transcribir_faster(wav, crudo, a.idioma, a.pista)

    with open(crudo, encoding="utf-8") as f:
        sal = aplanar(json.load(f))
    with open(os.path.join(a.trabajo, "palabras.json"), "w", encoding="utf-8") as f:
        json.dump(sal, f, ensure_ascii=False, indent=0)
    print(f"{len(sal)} palabras → {os.path.join(a.trabajo, 'palabras.json')}")
    print(" ".join(p["w"] for p in sal))


if __name__ == "__main__":
    main()
