#!/usr/bin/env python3
"""construir.py — arma UNA variante del expediente de punta a punta.

  python3 herramientas/construir.py <carpeta del proyecto> <A|B|C> <salida.mp4> [--musica tu-musica.mp3] [--solo-revisar]

Necesita: ffmpeg, Node y la skill clonador-de-edicion-f100k instalada (arma y renderiza con su motor). Si la tienes en otra
carpeta, dile dónde con la variable CLONADOR_EDICION. whisper.cpp es opcional (si no está, reparte el tiempo por letras).
La música es opcional y la pones tú (--musica): un tema oscuro y con pulso, sin voz.

Qué hace, en orden:
  1. Voz: toma voz/01.mp3 … NN.mp3 (para B y C la frase 1 sale de voz-gancho/01_B.mp3, 01_C.mp3), les recorta el silencio
     y mide cada frase.
  2. Hora de cada palabra con whisper.cpp → fuente/tiempos.js (así cada cambio cae en la palabra que lo nombra y el
     subtítulo va clavado). Si no hay whisper, reparte por letras.
  3. Arma la pieza y corre herramientas/revisar.mjs (zona segura, encimados, anclas, cámara quieta). Con faltas, PARA.
  4. Render mudo + voz + golpes graves cortos en cada cambio + música con ducking, todo a −14 LUFS.
  5. Hoja de contacto cuadro por cuadro (1 por segundo) en revision/.
"""
import difflib, hashlib, json, os, re, subprocess, sys, unicodedata
D = os.path.abspath(sys.argv[1]); VAR = sys.argv[2]; SAL = os.path.abspath(sys.argv[3])
def op(k, d=None): return sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
MUSICA = op("--musica")
if MUSICA and not os.path.exists(MUSICA): sys.exit(f"no encuentro la música: {MUSICA}")
K = os.path.expanduser(os.environ.get("CLONADOR_EDICION", "~/.claude/skills/clonador-de-edicion-f100k")); AQUI = os.path.dirname(os.path.abspath(__file__))
if not os.path.exists(os.path.join(K, "scripts", "armar.mjs")): sys.exit(f"falta la skill clonador-de-edicion-f100k en {K}: instálala o define CLONADOR_EDICION con su carpeta")
SFX = os.path.join(AQUI, "sfx")      # golpes graves y cortos que vienen con la skill
BANCO = {"pop": ["pop1", "pop2"], "swish": ["swoosh1"], "golpe": ["pop2"]}
MODELOS = [os.path.expanduser(p) for p in ("~/.cache/hyperframes/whisper/models/ggml-large-v3.bin", "~/.cache/whisper-cpp/ggml-small.bin")]
TMP = os.path.join(D, "_voz", VAR); os.makedirs(TMP, exist_ok=True); os.makedirs(os.path.join(D, "revision"), exist_ok=True)
def run(*a, **k): return subprocess.run(a, check=True, **k)
def dur(f): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).decode())
norma = lambda s: re.sub(r"[^a-z0-9$]", "", unicodedata.normalize("NFD", s.replace("*", "").lower()).encode("ascii", "ignore").decode())

# ---------- el guion sale de la pieza ----------
src = os.path.join(D, "fuente", "pieza.src.html"); html = open(src).read()
bloque = html[html.index("const LINEAS = ["):html.index("];", html.index("const LINEAS = ["))]
frases = []
for linea in bloque.splitlines():
    m = re.search(r"txt: (\{.*?\}\[VAR\]|'(?:[^'\\]|\\.)*')", linea)
    if not m: continue
    t = m.group(1)
    if t.startswith("{"): t = re.search(VAR + r": '((?:[^'\\]|\\.)*)'", t).group(1)
    else: t = t[1:-1]
    frases.append(t)
pausa = float(re.search(r"PAUSA = ([\d.]+)", html).group(1)); cola = float(re.search(r"COLA = ([\d.]+)", html).group(1))

# ---------- 1 · voz recortada ----------
voces = []
for i in range(len(frases)):
    f = os.path.join(D, "voz", f"{i+1:02d}.mp3")
    if i == 0 and os.path.exists(os.path.join(D, "voz-gancho", f"01_{VAR}.mp3")): f = os.path.join(D, "voz-gancho", f"01_{VAR}.mp3")
    if not os.path.exists(f): sys.exit(f"falta la voz de la frase {i+1}: {f}")
    w = os.path.join(TMP, f"{i+1:02d}.wav")
    run("ffmpeg", "-y", "-loglevel", "error", "-i", f, "-af",
        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse", "-ar", "44100", "-ac", "1", w)
    voces.append(w)
durs = [round(dur(w), 2) for w in voces]

# ---------- 2 · hora de cada palabra ----------
modelo = next((m for m in MODELOS if os.path.exists(m)), None)
def palabras_whisper(wav):
    h = hashlib.md5(open(wav, "rb").read()).hexdigest()[:12]; cache = os.path.join(D, "_voz", f"w_{h}.json")
    if not os.path.exists(cache):
        w16 = wav + ".16k.wav"; run("ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-ar", "16000", w16)
        subprocess.run(["whisper-cli", "-m", modelo, "-l", "es", "-ml", "1", "-sow", "-oj", "-of", cache[:-5], w16], capture_output=True); os.remove(w16)
    tr = json.load(open(cache))["transcription"]
    return [(s["text"].strip(), s["offsets"]["from"] / 1000, s["offsets"]["to"] / 1000) for s in tr if s["text"].strip()]
tiempos = []
for i, (fr, wav, d) in enumerate(zip(frases, voces, durs)):
    toks = fr.split(" "); w = [None] * len(toks)
    if modelo:
        try:
            pw = palabras_whisper(wav); a = [norma(t) for t in toks]; b = [norma(p[0]) for p in pw]
            for x, y, n in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
                for k in range(n): w[x + k] = [round(pw[y + k][1], 2), round(pw[y + k][2], 2)]
        except Exception as e: print("  (whisper falló en la frase", i + 1, e, ")")
    # lo que whisper escribió distinto (cifras, nombres) se reparte entre sus vecinas por cantidad de letras
    k = 0
    while k < len(toks):
        if w[k]: k += 1; continue
        j = k
        while j < len(toks) and not w[j]: j += 1
        t0 = w[k - 1][1] if k else 0.0; t1 = w[j][0] if j < len(toks) else d
        pesos = [len(norma(toks[x])) + 2 for x in range(k, j)]; tot = sum(pesos); acc = 0
        for x in range(k, j): w[x] = [round(t0 + (t1 - t0) * acc / tot, 2), round(t0 + (t1 - t0) * (acc + pesos[x - k]) / tot, 2)]; acc += pesos[x - k]
        k = j
    tiempos.append({"d": d, "w": w})
open(os.path.join(D, "fuente", "tiempos.js"), "w").write(f"// generado por herramientas/construir.py (variante {VAR})\nwindow.VARIANTE = '{VAR}';\nwindow.TIEMPOS = " + json.dumps(tiempos) + ";\n")
print(f"variante {VAR} · frases: {durs} · total {sum(durs) + pausa * (len(durs) - 1) + cola:.1f} s")

# ---------- 3 · armar + revisión de cuadros ----------
armada = os.path.join(D, "fuente", "pieza.html")
run("node", os.path.join(K, "scripts", "armar.mjs"), src, armada, stdout=subprocess.DEVNULL)
rev = os.path.join(D, "revision", f"revision_{VAR}.json")
r = subprocess.run(["node", os.path.join(AQUI, "revisar.mjs"), armada, rev]); R = json.load(open(rev))
if r.returncode: sys.exit(f"❌ la revisión de cuadros tiene faltas ({rev}): corrige la pieza y vuelve a correr. No se renderiza.")
if "--solo-revisar" in sys.argv: sys.exit(0)

# ---------- 4 · render + mezcla ----------
mudo = os.path.join(TMP, "mudo.mp4"); sello = os.path.join(TMP, "mudo.sello")
huella = hashlib.md5(b"".join(open(os.path.join(D, "fuente", f), "rb").read() for f in ("pieza.html", "motor.js", "tiempos.js", "ganchos.js", "caras.js"))).hexdigest()
if not (os.path.exists(mudo) and os.path.exists(sello) and open(sello).read() == huella):      # si la fuente no cambió, no se vuelve a renderizar
    run("node", os.path.join(K, "scripts", "renderizar.mjs"), armada, mudo, "--callado"); open(sello, "w").write(huella)
T = dur(mudo); ini = R["inicios"]
inp, fl = [], []
for i, w in enumerate(voces):
    inp += ["-i", w]; fl.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={int(ini[i] * 1000)}:all=1[v{i}]")
n = len(voces); fl.append("".join(f"[v{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0,apad=whole_dur={T},asplit=2[voz][vsc]")   # se alarga con silencio hasta el final del video
golpes, ult = [], -9
for t, s in R["eventos"]:                      # como mucho un golpe cada 0,3 s; el cambio de plano manda sobre el pop
    if t - ult < .3 and s != "swish": continue
    golpes.append((t, s)); ult = t
mix = ["[voz]"]
for j, (t, s) in enumerate(golpes):
    b = BANCO.get(s, BANCO["pop"]); inp += ["-i", os.path.join(SFX, b[j % len(b)] + ".wav")]
    # graves y cortos: nada sobre ~3 kHz, 0,3 s como mucho, sin pitidos
    fl.append(f"[{n + j}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:0.3,lowpass=f=2800,lowpass=f=2800,afade=t=out:st=0.2:d=0.1,volume={0.5 if s == 'swish' else 0.4},adelay={int(max(0, t - .04) * 1000)}:all=1[s{j}]"); mix.append(f"[s{j}]")
k = n + len(golpes)
if MUSICA:                                     # música opcional, con ducking bajo la voz
    inp += ["-stream_loop", "-1", "-i", MUSICA]
    fl.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{T},highshelf=f=7000:g=-4,volume=0.30,afade=t=in:d=0.3,afade=t=out:st={T - 1.4}:d=1.4[m0]")
    fl.append("[m0][vsc]sidechaincompress=threshold=0.04:ratio=5:attack=15:release=350[m]"); mix.append("[m]")
else:
    fl.append("[vsc]anullsink")
fl.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0,atrim=0:{T}[a]")
pre = os.path.join(TMP, "pre.wav"); fin = os.path.join(TMP, "mezcla.wav")
run("ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", ";".join(fl), "-map", "[a]", "-ar", "48000", pre)
e = subprocess.run(["ffmpeg", "-hide_banner", "-i", pre, "-af", "loudnorm=I=-14:TP=-2:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(e[e.rindex("{"):e.rindex("}") + 1])
run("ffmpeg", "-v", "error", "-y", "-i", pre, "-af", f"loudnorm=I=-14:TP=-2:LRA=11:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']},aresample=48000", fin)
run("ffmpeg", "-v", "error", "-y", "-i", mudo, "-i", fin, "-map", "0:v:0", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", SAL)

# ---------- 5 · hoja de contacto, 1 cuadro por segundo ----------
hoja = os.path.join(D, "revision", f"hoja-contacto_{VAR}.jpg"); cols = 8; filas = -(-int(T + 1) // cols)
run("ffmpeg", "-v", "error", "-y", "-i", SAL, "-vf", f"fps=1:start_time=0.5,scale=405:720,tile={cols}x{filas}:padding=6:color=white", "-frames:v", "1", "-q:v", "3", hoja)
print(f"✅ {SAL} ({T:.1f} s) · {len(golpes)} golpes · hoja: {hoja}")
