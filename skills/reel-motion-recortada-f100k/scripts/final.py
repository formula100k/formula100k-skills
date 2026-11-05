#!/usr/bin/env python3
"""
final.py — renderiza el reel, le pone la voz original + efectos de sonido y lo revisa.

Uso:  final.py <DEST> [--nombre reel-final] [--sin-render]
Lee:   DEST/reel/index.html · DEST/_source_cut.mov (voz) · DEST/sfx_plan.json
Deja:  DEST/<nombre>.mp4 · DEST/revision/hoja.jpg (un cuadro por segundo) · DEST/revision/apertura.png (0–2 s)

La voz NUNCA se corta ni se mueve: el video mudo dura lo mismo que _source_cut.mov y el audio se
copia de ahí. Si las duraciones difieren más de 1 cuadro, falla.
"""
import json, shutil, subprocess, sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent


def sh(cmd, **kw):
    return subprocess.run(cmd, check=True, **kw)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", str(p)]).decode().strip())


def main():
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__)
    dest = Path(a[0]).resolve()
    nombre = a[a.index("--nombre") + 1] if "--nombre" in a else "reel-final"
    voz = dest / "_source_cut.mov"
    mudo = dest / "_reel_mudo.mp4"
    final = dest / f"{nombre}.mp4"

    if "--sin-render" not in a:
        print("· render de la composición…")
        hf = shutil.which("hyperframes")   # en Windows es hyperframes.cmd: which lo encuentra
        if not hf:
            sys.exit("❌ Falta hyperframes. Instálalo con: npm i -g hyperframes")
        sh([hf, "render", "--format", "mp4", "-o", str(mudo)], cwd=dest / "reel")

    # pista de efectos con volumen por golpe
    plan = json.loads((dest / "sfx_plan.json").read_text(encoding="utf-8"))
    D = dur(voz)
    sfx = dest / "_sfx.wav"
    ins = ["-f", "lavfi", "-t", f"{D:.3f}", "-i", "anullsrc=r=48000:cl=stereo"]
    fil, labs = [], ["[0:a]"]
    for i, h in enumerate(plan, 1):
        ins += ["-i", str(SKILL / "sfx" / f"{h['sfx']}.wav")]
        ms = int(h["t"] * 1000)
        fil.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={h.get('vol', 0.5)},adelay={ms}|{ms}[s{i}]")
        labs.append(f"[s{i}]")
    graf = (";".join(fil) + ";" if fil else "") + "".join(labs) + f"amix=inputs={len(labs)}:normalize=0:dropout_transition=0,atrim=0:{D:.3f}[m]"
    sh(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", graf, "-map", "[m]", str(sfx)])

    # en cada unión del corte fino la voz baja y sube en 2×15 ms: sin clic ni golpe seco (no mueve nada de lugar)
    cortes = []
    try:
        cortes = json.loads((dest / "plan.json").read_text(encoding="utf-8")).get("cortes") or []
        if not cortes and (dest / "edl.json").exists():
            cortes = [x["newStart"] for x in json.loads((dest / "edl.json").read_text(encoding="utf-8"))[1:]]
    except Exception:
        pass
    g = "*".join(f"min(1,abs(t-{c:.3f})/0.015)" for c in cortes if 0.05 < c < D - 0.05) or "1"
    fundido = f"aeval='val(0)*{g}|val(1)*{g}':c=same," if cortes else ""

    # mezcla: voz al frente, efectos por debajo (-6 dB aprox.)
    sh(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mudo), "-i", str(voz), "-i", str(sfx), "-filter_complex",
        f"[1:a]aformat=channel_layouts=stereo,{fundido}aresample=48000[v];[2:a]volume=0.5[s];[v][s]amix=inputs=2:normalize=0:dropout_transition=0,alimiter=limit=0.95[a]",
        "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(final)])

    dv, dm, df = D, dur(mudo), dur(final)
    print(f"· duraciones → voz {dv:.3f} s · video {dm:.3f} s · final {df:.3f} s")
    if abs(dv - dm) > 0.05:
        sys.exit(f"❌ El video mudo y la voz no duran lo mismo ({dm:.3f} vs {dv:.3f}). No publicar: revisa data-duration.")

    # revisión visual
    rev = dest / "revision"; rev.mkdir(exist_ok=True)
    n = int(df) + 1
    filas = (n + 7) // 8
    sh(["ffmpeg", "-y", "-loglevel", "error", "-i", str(final), "-vf", f"fps=1,scale=216:-1,tile=8x{filas}:padding=4:color=white",
        "-frames:v", "1", str(rev / "hoja.jpg")])
    for t in (0, 0.5, 1, 1.5, 2):
        sh(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(t), "-i", str(final), "-frames:v", "1", "-vf", "scale=270:-2",
            str(rev / f"apertura-{t}.png")])
    sh(["ffmpeg", "-y", "-loglevel", "error"] + sum([["-i", str(rev / f"apertura-{t}.png")] for t in (0, 0.5, 1, 1.5, 2)], []) +
       ["-filter_complex", "hstack=5", str(rev / "apertura.png")])
    print(f"✅ {final}\n   revisa: {rev / 'hoja.jpg'} (un cuadro por segundo) y {rev / 'apertura.png'} (0–2 s)")


if __name__ == "__main__":
    main()
