"""uso: quitar.py DEST SRC.mov OUT.mov '[[a,b],...]'  -> quita esos rangos (tiempo del corte) del video y remapea
captions.json, cortes.json, edl.json, PLAN.json (t) y plan_div.json (desde/hasta) si existen."""
import json, subprocess, sys
from pathlib import Path
dest, src, out, quita = Path(sys.argv[1]), sys.argv[2], sys.argv[3], sorted(json.loads(sys.argv[4]))
dur = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",src],capture_output=True,text=True).stdout)
keep, cur = [], 0.0
for a, b in quita:
    keep.append((cur, a)); cur = b
keep.append((cur, dur))
def m(t):
    s = sum(min(b, max(t, a)) - a for a, b in quita if t > a)
    return round(t - s, 3)
def dentro(t): return any(a <= t < b for a, b in quita)
f = []
for i, (a, b) in enumerate(keep):
    d = b - a
    f.append(f"[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.006,afade=t=out:st={max(d-0.006,0):.3f}:d=0.006[a{i}]")
f.append("".join(f"[v{i}][a{i}]" for i in range(len(keep))) + f"concat=n={len(keep)}:v=1:a=1[v][a]")
(dest/"_fq.txt").write_text(";".join(f), encoding="utf-8")
subprocess.run(["ffmpeg","-y","-v","error","-i",src,"-/filter_complex",str(dest/"_fq.txt"),"-map","[v]","-map","[a]","-c:v","libx264","-preset","fast","-crf","16","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k",str(out)],check=True)
c = json.load(open(dest/"captions.json", encoding="utf-8"))
c2 = [dict(w, start=m(w["start"]), end=m(w["end"])) for w in c if not dentro((w["start"]+w["end"])/2)]
print("palabras quitadas:", [w["word"] for w in c if dentro((w["start"]+w["end"])/2)])
json.dump(c2, open(dest/"captions.json","w", encoding="utf-8"), ensure_ascii=False, indent=1)
k = json.load(open(dest/"cortes.json", encoding="utf-8"))["cortes"]
k2 = sorted(set([m(x) for x in k] + [m(a) for a, b in quita]))
json.dump({"cortes": k2}, open(dest/"cortes.json","w", encoding="utf-8"))
e = json.load(open(dest/"edl.json", encoding="utf-8"))
json.dump([dict(s, newStart=m(s["newStart"]), newEnd=m(s["newEnd"])) for s in e if m(s["newEnd"]) > m(s["newStart"])], open(dest/"edl.json","w", encoding="utf-8"), indent=1)
def walk(o):
    if isinstance(o, dict):
        if isinstance(o.get("t"), (int, float)):
            t0 = o["t"]; o["t"] = m(t0)
            if isinstance(o.get("dur"), (int, float)): o["dur"] = round(m(t0 + o["dur"]) - o["t"], 3)
        for v in o.values(): walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
p = json.load(open(dest/"PLAN.json", encoding="utf-8")); walk(p); json.dump(p, open(dest/"PLAN.json","w", encoding="utf-8"), ensure_ascii=False, indent=1)
if (dest/"plan_div.json").exists():
    d = json.load(open(dest/"plan_div.json", encoding="utf-8")); d["desde"] = m(d["desde"]); d["hasta"] = m(d["hasta"])
    for i in d["imagenes"]: i["desde"] = m(i["desde"])
    json.dump(d, open(dest/"plan_div.json","w", encoding="utf-8"), ensure_ascii=False, indent=1); print("div", d["hasta"], [i["desde"] for i in d["imagenes"]])
print("ok", out, round(dur - sum(b - a for a, b in quita), 3))
