# /// script
# requires-python = ">=3.10"
# ///
"""efectos.py — pista de efectos de sonido sincronizada con la pieza.

Uso: uv run efectos.py <pieza.src.html> <carpeta-salida>      (en Mac también: python3 -I efectos.py …)
     -> <carpeta-salida>/efectos.wav (estéreo, 44,1 kHz, dura lo mismo que el video)

Lee de la pieza: las duraciones reales de LINEAS (las escribe voz.mjs), PAUSA, QUIETO_FINAL,
CONTINUA y la lista EFECTOS. Los sonidos se sintetizan con ffmpeg: no hay archivos de terceros.
"""
import ast, os, re, subprocess, sys

if len(sys.argv) < 3:
    sys.exit('uso: uv run efectos.py <pieza.src.html> <carpeta-salida>')
pieza, SFX = sys.argv[1], sys.argv[2]
os.makedirs(SFX, exist_ok=True)
html = open(pieza, encoding='utf-8').read()

D = [float(x) for x in re.findall(r'\{ d: ([\d.]+), txt:', html)]
num = lambda nombre, defecto: float((re.search(rf'const {nombre} = ([\d.]+)', html) or [0, defecto])[1])
PAUSA, QUIETO = num('PAUSA', .3), num('QUIETO_FINAL', 1.6)
m = re.search(r'const CONTINUA = new Set\(\[([^\]]*)\]\)', html)
CONTINUA = {int(x) for x in m[1].split(',') if x.strip()} if m else set()
m = re.search(r'const EFECTOS = (\[.*?\n\]);', html, re.S)
if not m:
    sys.exit('La pieza no tiene const EFECTOS = [...]; (mira la plantilla)')
EFECTOS = ast.literal_eval(re.sub(r'//[^\n]*', '', m[1]))

INI, a = [], 0.0
for d in D:
    INI.append(a); a += d + PAUSA
TOTAL = a + QUIETO

# ---------- los sonidos ----------
SONIDOS = {
    'pop':    ('aevalsrc', "0.8*sin(2*PI*(950-650*t/0.09)*t)*exp(-t*38)", 0.14),
    'tic':    ('aevalsrc', "0.5*sin(2*PI*2600*t)*exp(-t*110)", 0.04),
    'ding':   ('aevalsrc', "0.45*sin(2*PI*1320*t)*exp(-t*9)+0.25*sin(2*PI*1980*t)*exp(-t*11)", 0.6),
    'sello':  ('aevalsrc', "0.95*sin(2*PI*(78-40*t)*t)*exp(-t*9)+0.35*(random(0)*2-1)*exp(-t*45)", 0.6),
    'metal':  ('aevalsrc', "0.22*(sin(2*PI*820*t)+sin(2*PI*1373*t)+sin(2*PI*2211*t))*exp(-t*11)+0.3*(random(1)*2-1)*exp(-t*60)", 0.5),
    'whoosh': ('pink', "highpass=f=350,lowpass=f=2800,afade=t=in:d=0.22:curve=qsin,afade=t=out:st=0.22:d=0.26:curve=qsin,volume=0.9", 0.48),
    'plumon': ('pink', "bandpass=f=2300:w=1400,tremolo=f=18:d=0.6,afade=t=in:d=0.04,afade=t=out:st=0.25:d=0.12,volume=1.6", 0.38),
    'ola':    ('brown', "lowpass=f=420,afade=t=in:d=1.0:curve=qsin,afade=t=out:st=1.2:d=1.2:curve=qsin,volume=1.6", 2.4),
    'riser':  ('pink', "lowpass=f=2400,afade=t=in:d=3.6:curve=exp,afade=t=out:st=3.6:d=0.3,volume=0.6", 3.9),
    'papel':  ('pink', "bandpass=f=3800:w=3000,tremolo=f=31:d=0.9,afade=t=in:d=0.02,afade=t=out:st=0.12:d=0.12,volume=1.1", 0.24),
}
for n, (tipo, expr, dur) in SONIDOS.items():
    if tipo == 'aevalsrc':
        src, filt = f"aevalsrc='{expr}':s=44100:d={dur}", 'anull'
    else:
        src, filt = f"anoisesrc=d={dur}:c={tipo}:r=44100:a=0.5:seed=7", expr
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', src, '-af', filt, '-ac', '1',
                    os.path.join(SFX, f'_{n}.wav')], check=True)

# ---------- cuándo suena cada cosa ----------
def seg(v, i):   # número = segundos; '45%' = fracción de la escena (frase + pausa)
    return float(v[:-1]) / 100 * (D[i] + PAUSA) if isinstance(v, str) else float(v)

E = [(INI[i], 'whoosh', .55) for i in range(1, len(D)) if i not in CONTINUA]
for ef in EFECTOS:
    i, u, n, v = ef[:4]
    reps = ef[4] if len(ef) > 4 else 1
    paso = ef[5] if len(ef) > 5 else 0
    if n not in SONIDOS:
        sys.exit(f'Sonido desconocido «{n}» en la escena {i}. Hay: {", ".join(SONIDOS)}')
    if i >= len(D):
        sys.exit(f'La escena {i} no existe (la pieza tiene {len(D)} frases)')
    for k in range(int(reps)):
        E.append((INI[i] + seg(u, i) + k * seg(paso, i), n, v))
E.sort()

args = ['ffmpeg', '-y', '-loglevel', 'error']
for t, n, v in E:
    args += ['-i', os.path.join(SFX, f'_{n}.wav')]
f = ';'.join(f'[{k}:a]volume={v},adelay={int(t * 1000)}:all=1[e{k}]' for k, (t, n, v) in enumerate(E))
f += ';' + ''.join(f'[e{k}]' for k in range(len(E))) + f'amix=inputs={len(E)}:normalize=0,apad=whole_dur={TOTAL:.2f},atrim=0:{TOTAL:.2f}[o]'
args += ['-filter_complex', f, '-map', '[o]', '-ar', '44100', '-ac', '2', os.path.join(SFX, 'efectos.wav')]
subprocess.run(args, check=True)
print(f'{len(E)} efectos -> {os.path.join(SFX, "efectos.wav")} ({TOTAL:.1f} s)')
