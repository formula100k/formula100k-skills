#!/usr/bin/env python3
"""
verify_audio_sync.py — Guardián del requisito NO-NEGOCIABLE: el audio no se desfasa.

Compara la duración del stream de VIDEO vs el de AUDIO del render final.
Si difieren más que el umbral (default 40ms), FALLA (exit 1) y hay que revisar
la composición (casi siempre: se usó cut/concat en vez de overlay opaco).

Uso:
    python3 verify_audio_sync.py video_final.mp4 [--source _source_cut.mov] [--threshold 0.040]

Salida:
    exit 0  → "✅ SYNC OK"      (audio y video alineados)
    exit 1  → "❌ SYNC FAIL"    (desfase por encima del umbral)
"""
import subprocess
import sys
import argparse


def stream_duration(path, stream):
    """Duración (segundos, float) del primer stream de tipo `stream` ('v' o 'a')."""
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", stream,
         "-show_entries", "stream=duration", "-of",
         "default=nokey=1:noprint_wrappers=1", path],
        capture_output=True, text=True,
    ).stdout.strip().splitlines()
    for line in out:
        try:
            v = float(line)
            if v > 0:
                return v
        except ValueError:
            continue
    # Fallback: algunos contenedores no exponen stream=duration → usa format=duration
    fmt = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nokey=1:noprint_wrappers=1", path],
        capture_output=True, text=True,
    ).stdout.strip()
    try:
        return float(fmt)
    except ValueError:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video", help="Ruta al video final a verificar")
    ap.add_argument("--source", help="(Opcional) fuente cortada, para comparar duración total")
    ap.add_argument("--threshold", type=float, default=0.040,
                    help="Desfase máximo tolerado en segundos (default 0.040 = 40ms)")
    args = ap.parse_args()

    vdur = stream_duration(args.video, "v")
    adur = stream_duration(args.video, "a")

    if vdur is None or adur is None:
        print(f"❌ No se pudo leer duración (video={vdur}, audio={adur}) de {args.video}")
        sys.exit(1)

    diff = abs(vdur - adur)
    print(f"🎬 video : {vdur:.3f}s")
    print(f"🔊 audio : {adur:.3f}s")
    print(f"Δ        : {diff*1000:.1f}ms   (umbral {args.threshold*1000:.0f}ms)")

    ok = diff <= args.threshold

    # Chequeo extra opcional: la duración final debe coincidir con la fuente cortada
    if args.source:
        sdur = stream_duration(args.source, "v")
        if sdur is not None:
            sdiff = abs(vdur - sdur)
            print(f"📎 fuente: {sdur:.3f}s   (Δ vs final {sdiff*1000:.1f}ms)")
            if sdiff > 0.100:
                print("⚠  La duración del final se alejó >100ms de la fuente: "
                      "sospecha de cut/concat. El takeover debe ser overlay opaco.")
                ok = False

    if ok:
        print("✅ SYNC OK — audio y video alineados. Apto para publicar.")
        sys.exit(0)
    else:
        print("❌ SYNC FAIL — hay desfase. NO publicar. "
              "Revisa Paso 7: los takeovers deben montarse como overlay opaco "
              "(enable='between'), nunca cortando/concatenando el video base.")
        sys.exit(1)


if __name__ == "__main__":
    main()
