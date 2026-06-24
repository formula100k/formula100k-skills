#!/usr/bin/env python3
"""Track the index fingertip across a video and detect 'pointing-up' segments.

Usage:
    python track_finger.py <video> <out.json> [hand_landmarker.task]

Outputs a JSON with:
  fps, w, h, n,
  frames: [{f, t, x, y, point}]   # x/y in pixels, null when no hand
  segments: [{start_f,end_f,start_t,end_t,dur}]   # pointing-up runs

Requires MediaPipe Tasks (>=0.10) + opencv + numpy, running on Python 3.12.
The model auto-downloads on first run if not present.
"""
import cv2, json, sys, os, urllib.request
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

VIDEO = sys.argv[1]
OUT   = sys.argv[2]
MODEL = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(__file__), "hand_landmarker.task")
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

if not os.path.exists(MODEL):
    print(f"Downloading hand_landmarker model -> {MODEL}")
    urllib.request.urlretrieve(MODEL_URL, MODEL)

# Hand landmark indices
WRIST=0; I_MCP=5; I_PIP=6; I_TIP=8; M_TIP=12; R_TIP=16; P_TIP=20

cap = cv2.VideoCapture(VIDEO)
W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
FPS = cap.get(cv2.CAP_PROP_FPS) or 30.0
N = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

opts = vision.HandLandmarkerOptions(
    base_options=python.BaseOptions(model_asset_path=MODEL),
    num_hands=2, running_mode=vision.RunningMode.VIDEO,
    min_hand_detection_confidence=0.4, min_tracking_confidence=0.4,
    min_hand_presence_confidence=0.4)
landmarker = vision.HandLandmarker.create_from_options(opts)

frames = []
idx = 0
while True:
    ok, frame = cap.read()
    if not ok: break
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    res = landmarker.detect_for_video(mp_img, int(idx/FPS*1000))
    best = None
    if res.hand_landmarks:
        for p in res.hand_landmarks:
            tip = (p[I_TIP].x*W, p[I_TIP].y*H)
            index_up    = (p[I_TIP].y < p[I_PIP].y - 0.02 < p[I_MCP].y)
            above_wrist = (p[WRIST].y - p[I_TIP].y) > 0.12
            curled = sum([p[M_TIP].y > p[I_PIP].y,
                          p[R_TIP].y > p[I_PIP].y,
                          p[P_TIP].y > p[I_PIP].y]) >= 2
            topmost = p[I_TIP].y <= min(p[M_TIP].y, p[R_TIP].y, p[P_TIP].y) + 0.01
            pointing = bool(index_up and above_wrist and curled and topmost)
            score = (1 if pointing else 0, p[WRIST].y - p[I_TIP].y)
            if best is None or score > best[0]:
                best = (score, tip[0], tip[1], pointing)
    if best is not None:
        frames.append({"f": idx, "t": round(idx/FPS,4),
                       "x": round(best[1],2), "y": round(best[2],2), "point": best[3]})
    else:
        frames.append({"f": idx, "t": round(idx/FPS,4), "x": None, "y": None, "point": False})
    idx += 1
    if idx % 60 == 0:
        print(f"  ...{idx}/{N} frames", flush=True)
cap.release()

# Group pointing-up frames into segments (tolerate gaps <=4 frames, keep >=8 frames)
segs = []; cur = None; gap = 0
for fr in frames:
    if fr["point"] and fr["x"] is not None:
        cur = [fr["f"], fr["f"]] if cur is None else [cur[0], fr["f"]]
        gap = 0
    elif cur is not None:
        gap += 1
        if gap > 4:
            segs.append(cur); cur=None; gap=0
if cur is not None: segs.append(cur)
segs = [s for s in segs if (s[1]-s[0]) >= 8]
segs_out = [{"start_f":a,"end_f":b,"start_t":round(a/FPS,3),"end_t":round(b/FPS,3),
             "dur":round((b-a)/FPS,3)} for a,b in segs]

json.dump({"fps":FPS,"w":W,"h":H,"n":N,"frames":frames,"segments":segs_out}, open(OUT,"w"))
print(f"\nDONE. {len(frames)} frames, {len(segs_out)} pointing segments:")
for i,s in enumerate(segs_out):
    print(f"  [{i}] {s['start_t']:.2f}s -> {s['end_t']:.2f}s ({s['dur']:.2f}s)")
