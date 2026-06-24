#!/usr/bin/env python3
"""Draw a tracked element (glow dot + optional label, or tap ripple) that RIDES
the index fingertip during pointing-up segments. Smoothed, with fade in/out.
Composites onto the source video and muxes the original audio.

Usage:
    python compose_overlay.py <config.json>

config.json:
{
  "src":   "/path/video.mov",
  "track": "/path/finger_track.json",
  "out":   "/path/video_FINGER.mp4",
  "style": "glow_label",          # glow_label | glow_dot | tap_ripple
  "accent": [10,132,255],          # RGB of the glow/ring/pill dot
  "font":  "/System/Library/Fonts/Supplemental/Arial Black.ttf",
  "font_size": 46,
  "min_seg_dur": 0.8,              # drop pointing blips shorter than this
  "labels": ["SIN GANCHO", null, "NADA NUEVO", "MUY LARGO"]  # aligned to kept segments; null skips
}
"""
import cv2, json, subprocess, math, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

cfg = json.load(open(sys.argv[1]))
SRC   = cfg["src"]
TRACK = cfg["track"]
OUT   = cfg["out"]
STYLE = cfg.get("style", "glow_label")
ACCENT = tuple(cfg.get("accent", [10,132,255]))
FONT_PATH = cfg.get("font", "/System/Library/Fonts/Supplemental/Arial Black.ttf")
FONT_SIZE = int(cfg.get("font_size", 46))
MIN_DUR = float(cfg.get("min_seg_dur", 0.8))
LABELS = cfg.get("labels", [])
PILL_BG = tuple(cfg.get("pill_bg", [14,14,16]))
WHITE = (255,255,255)
TMP = os.path.join(os.path.dirname(OUT) or ".", "_track_noaudio.mp4")

def ema(arr, a):
    out = np.array(arr, dtype=float).copy()
    for i in range(1, len(out)):
        out[i] = a*out[i] + (1-a)*out[i-1]
    return out

d = json.load(open(TRACK))
FPS, W, H = d["fps"], d["w"], d["h"]
by_idx = {fr["f"]: fr for fr in d["frames"]}
segs = [s for s in d["segments"] if s["dur"] >= MIN_DUR]

state = {}
for si, s in enumerate(segs):
    label = LABELS[si] if si < len(LABELS) else None
    a, b = s["start_f"], s["end_f"]
    xs, ys, idxs = [], [], []
    for f in range(a, b+1):
        fr = by_idx.get(f)
        if fr and fr["x"] is not None:
            xs.append(fr["x"]); ys.append(fr["y"]); idxs.append(f)
    if len(idxs) < 3:
        continue
    fr_range = list(range(a, b+1))
    ix = np.interp(fr_range, idxs, xs); iy = np.interp(fr_range, idxs, ys)
    sx = ema(ix, 0.45); sy = ema(iy, 0.45)        # dot path
    lx = ema(sx, 0.22); ly = ema(sy, 0.22)        # laggier label path
    n = len(fr_range); fade_f = max(4, int(0.28*FPS))
    for k, f in enumerate(fr_range):
        alpha = max(0.0, min(min(1.0, k/fade_f), min(1.0, (n-1-k)/fade_f)))
        state[f] = dict(x=sx[k], y=sy[k], lx=lx[k], ly=ly[k],
                        alpha=alpha, label=label, age=k)

font = ImageFont.truetype(FONT_PATH, FONT_SIZE)

def draw_glow_dot(overlay, dx, dy, A, fidx):
    pulse = 1.0 + 0.12*math.sin(fidx/FPS*2*math.pi*1.6)
    glow = Image.new("RGBA", (W,H), (0,0,0,0))
    gd = ImageDraw.Draw(glow); R = 54*pulse
    gd.ellipse([dx-R,dy-R,dx+R,dy+R], fill=ACCENT+(int(150*A),))
    glow = glow.filter(ImageFilter.GaussianBlur(22))
    overlay = Image.alpha_composite(overlay, glow)
    dr = ImageDraw.Draw(overlay); r2 = 26*pulse
    dr.ellipse([dx-r2,dy-r2,dx+r2,dy+r2], outline=ACCENT+(int(255*A),), width=6)
    dr.ellipse([dx-13,dy-13,dx+13,dy+13], fill=WHITE+(int(255*A),))
    return overlay

def draw_ripple(overlay, dx, dy, A, age):
    dr = ImageDraw.Draw(overlay)
    for k in range(3):
        phase = (age*0.12 + k*0.5) % 1.5
        rr = 20 + phase*70
        aa = int(200*A*max(0.0, 1-phase/1.5))
        dr.ellipse([dx-rr,dy-rr,dx+rr,dy+rr], outline=ACCENT+(aa,), width=5)
    dr.ellipse([dx-12,dy-12,dx+12,dy+12], fill=WHITE+(int(255*A),))

def draw_label(overlay, st):
    txt = st["label"]
    if not txt: return overlay
    dr = ImageDraw.Draw(overlay)
    tb = dr.textbbox((0,0), txt, font=font); tw, th = tb[2]-tb[0], tb[3]-tb[1]
    padx, pady = 34, 22; pw, ph = tw+2*padx, th+2*pady
    lx, ly = st["lx"], st["ly"]
    px = (lx - 60 - pw) if lx > W*0.5 else (lx + 60)
    py = ly + 30
    px = max(40, min(W-40-pw, px)); py = max(210, min(H-300-ph, py))
    A = st["alpha"]
    pill = Image.new("RGBA", (W,H), (0,0,0,0)); pd = ImageDraw.Draw(pill)
    pd.rounded_rectangle([px,py,px+pw,py+ph], radius=ph//2, fill=PILL_BG+(int(238*A),))
    pd.ellipse([px+18, py+ph/2-7, px+32, py+ph/2+7], fill=ACCENT+(int(255*A),))
    overlay = Image.alpha_composite(overlay, pill)
    dr = ImageDraw.Draw(overlay)
    dr.text((px+padx+22, py+pady-tb[1]), txt, font=font, fill=WHITE+(int(255*A),))
    return overlay

def render_frame(base_bgr, st, fidx):
    overlay = Image.new("RGBA", (W,H), (0,0,0,0))
    A, dx, dy = st["alpha"], st["x"], st["y"]
    if STYLE == "tap_ripple":
        draw_ripple(overlay, dx, dy, A, st["age"])
    else:
        overlay = draw_glow_dot(overlay, dx, dy, A, fidx)
        if STYLE == "glow_label":
            overlay = draw_label(overlay, st)
    base = Image.fromarray(cv2.cvtColor(base_bgr, cv2.COLOR_BGR2RGB)).convert("RGBA")
    return cv2.cvtColor(np.array(Image.alpha_composite(base, overlay).convert("RGB")), cv2.COLOR_RGB2BGR)

cap = cv2.VideoCapture(SRC)
ff = subprocess.Popen([
    "ffmpeg","-y","-f","rawvideo","-pix_fmt","bgr24","-s",f"{W}x{H}","-r",str(FPS),
    "-i","pipe:0","-an","-c:v","libx264","-crf","18","-preset","medium",
    "-pix_fmt","yuv420p","-movflags","+faststart",TMP], stdin=subprocess.PIPE)
fidx = 0
while True:
    ok, frame = cap.read()
    if not ok: break
    st = state.get(fidx)
    out = render_frame(frame, st, fidx) if st and st["alpha"] > 0 else frame
    ff.stdin.write(out.tobytes()); fidx += 1
    if fidx % 120 == 0: print(f"  composited {fidx} frames", flush=True)
cap.release(); ff.stdin.close(); ff.wait()
print("video done, muxing audio...")
subprocess.run(["ffmpeg","-y","-i",TMP,"-i",SRC,"-map","0:v:0","-map","1:a:0?",
    "-c:v","copy","-c:a","aac","-b:a","192k","-shortest","-movflags","+faststart",OUT], check=True)
os.remove(TMP)
print("OUTPUT:", OUT)
