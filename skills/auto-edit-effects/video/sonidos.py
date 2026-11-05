# sonidos.py <proyecto> <video.mp4>  → mezcla los efectos de sonido de plano.json["sonidos"] sobre el video (lo reemplaza).
# Lo corre «node auto-edicion/scripts/video.mjs render» solo, al final, si plano.json trae "sonidos".
#   "sonidos_volumen": .4 (multiplica todo) · "sonidos": [[segundo, "pop" | "swish" | "golpe" | "papel" | "desliza", volumen?], …]   (segundos del video cortado; volumen 0..1, por defecto .5)
# Banco: sfx/ (CC0 de Openverse, ya filtrados graves: <5 % de energía sobre 3 kHz). Cada tipo rota entre sus variantes.
# Regla de la casa: sin pitidos. Por las dudas todo pasa además por un pasa-bajos de 3,2 kHz.
import json, os, subprocess, sys, glob, shutil

P, V = sys.argv[1], sys.argv[2]
X = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); B = os.path.join(X, "sfx")
plano = json.load(open(os.path.join(P, "fuente", "plano.json"))); son = plano.get("sonidos") or []
GLOBAL = float(plano.get("sonidos_volumen", .4))   # todo el banco por debajo de la voz (oido_mezcla avisa «fuerte» si un efecto pasa la voz)
if not son: sys.exit(0)
BANCO = {"pop": sorted(glob.glob(f"{B}/ov_pop_*.wav")), "swish": sorted(glob.glob(f"{B}/ov_swish_*.wav")),
         "golpe": sorted(glob.glob(f"{B}/ov_golpe_*.wav")), "papel": sorted(glob.glob(f"{B}/ov_papel_*.wav")),
         "desliza": [f"{B}/desliza_grave.wav"]}
usados = {k: 0 for k in BANCO}; entradas, fil, etq = [], [], []
for j, s in enumerate(sorted(son, key=lambda s: s[0])):
    t, tipo = float(s[0]), s[1]; vol = float(s[2]) if len(s) > 2 else .5
    if tipo not in BANCO: sys.exit(f"No conozco el sonido «{tipo}». Hay: {', '.join(BANCO)}.")
    f = BANCO[tipo][usados[tipo] % len(BANCO[tipo])]; usados[tipo] += 1
    entradas += ["-i", f]; ms = max(0, int(t * 1000))
    fil.append(f"[{j + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={vol * GLOBAL:.3f},adelay={ms}|{ms}[s{j}]"); etq.append(f"[s{j}]")
fil.append(f"{''.join(etq)}amix=inputs={len(etq)}:normalize=0,lowpass=f=3200[fx]")
fil.append("[0:a][fx]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]")
tmp = V + ".sonidos.mp4"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", V, *entradas, "-filter_complex", ";".join(fil), "-map", "0:v", "-map", "[a]",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", tmp], check=True)
shutil.move(tmp, V); print(f"sonidos: {len(son)} efectos mezclados ({', '.join(f'{k} {v}' for k, v in usados.items() if v)})")
