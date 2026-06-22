#!/usr/bin/env python3
"""
compose_blocks.py — Compositor por-bloques para collage-cine-f100k.
Toma _source_cut.mov + una lista de bloques (start_seg, escena.png) y produce
_panels.mp4: por cada bloque, talking-head en banda inferior + escena en banda
superior, con grade vintage verdoso-sepia + grano + viñeteado sobre todo el frame.

Uso:
  python3 compose_blocks.py "$DEST" blocks.json
  blocks.json = [{"start": 0.0, "scene": "escenas/escena_1.png"}, ...]  (ordenado)
El fin de cada bloque = start del siguiente; el último llega hasta el fin del video.

Layout 9:16 (1080x1920): escena arriba 0..BAND_SPLIT, talking-head abajo.
"""
import json, os, sys, subprocess, tempfile

W, H = 1080, 1920
BAND_SPLIT = 720          # alto banda escena (arriba); talking-head = 1920-720 = 1200
GRADE = ("eq=saturation=0.82:contrast=1.06:gamma=0.98,"
         "curves=b='0/0.04 0.5/0.46 1/0.92':g='0/0.02 1/0.99',"
         "vignette=PI/5")
GRAIN = "noise=alls=9:allf=t+u"

def dur(path):
    out = subprocess.check_output(["ffprobe","-v","error","-show_entries",
        "format=duration","-of","default=nokey=1:noprint_wrappers=1",path])
    return float(out)

def main():
    dest = sys.argv[1]
    blocks = json.load(open(sys.argv[2]))
    src = os.path.join(dest,"_source_cut.mov")
    if not os.path.exists(src):
        cands=[f for f in os.listdir(dest) if f.endswith((".mov",".mp4"))]
        src=os.path.join(dest,cands[0])
    total = dur(src)
    th_h = H - BAND_SPLIT
    tmpd = tempfile.mkdtemp()
    parts=[]
    for i,b in enumerate(blocks):
        start=float(b["start"])
        end=float(blocks[i+1]["start"]) if i+1<len(blocks) else total
        if end<=start: continue
        scene=b["scene"]
        if not os.path.isabs(scene): scene=os.path.join(dest,scene)
        out=os.path.join(tmpd,f"block_{i}.mp4")
        seg=end-start
        fc=(f"[0:v]scale={W}:{th_h}:force_original_aspect_ratio=increase,"
            f"crop={W}:{th_h},setsar=1[th];"
            f"[1:v]scale={W}:{BAND_SPLIT}:force_original_aspect_ratio=increase,"
            f"crop={W}:{BAND_SPLIT},setsar=1[sc];"
            f"[sc][th]vstack=inputs=2[stk];"
            f"[stk]{GRADE},{GRAIN},format=yuv420p[outv]")
        cmd=["ffmpeg","-y","-ss",f"{start}","-t",f"{seg}","-i",src,
             "-loop","1","-t",f"{seg}","-i",scene,
             "-filter_complex",fc,"-map","[outv]","-map","0:a?",
             "-c:v","libx264","-crf","18","-preset","medium",
             "-c:a","aac","-b:a","160k","-r","30","-shortest",out]
        print(f"[block {i}] {start:.1f}-{end:.1f}s scene={os.path.basename(scene)}")
        subprocess.run(cmd,check=True,capture_output=True)
        parts.append(out)
    # concat
    listf=os.path.join(tmpd,"list.txt")
    with open(listf,"w") as f:
        for p in parts: f.write(f"file '{p}'\n")
    outp=os.path.join(dest,"_panels.mp4")
    subprocess.run(["ffmpeg","-y","-f","concat","-safe","0","-i",listf,
        "-c","copy","-movflags","+faststart",outp],check=True,capture_output=True)
    print(f"[ok] -> {outp}  ({dur(outp):.1f}s)")

if __name__=="__main__":
    main()
