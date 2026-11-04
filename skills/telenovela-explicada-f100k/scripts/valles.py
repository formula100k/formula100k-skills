#!/usr/bin/env python3
"""Envolvente de volumen (10 ms) de un clip y búsqueda del punto más silencioso en una ventana."""
import subprocess, sys, numpy as np
def env(f):
    raw = subprocess.run(["ffmpeg","-loglevel","error","-i",f,"-ac","1","-ar","16000","-f","s16le","-"],capture_output=True).stdout
    a = np.frombuffer(raw, np.int16).astype(float)/32768
    n = len(a)//160
    return np.sqrt((a[:n*160].reshape(n,160)**2).mean(1)+1e-12)
def db(e): return 20*np.log10(e)
def valle(e, a, b):
    i0, i1 = max(0,int(a*100)), min(len(e)-1,int(b*100))
    if i1 <= i0: return a
    seg = db(e[i0:i1+1]); m = seg.min()
    # el primer punto que está a menos de 3 dB del mínimo, más cerca del centro de la ventana
    ok = np.where(seg <= m+3)[0]
    return (i0 + ok[len(ok)//2])/100
if __name__ == "__main__":
    e = env(sys.argv[1]); d = db(e)
    for i in range(0, len(d), 5): print(f"{i/100:5.2f} {'#'*max(0,int((d[i]+60)/2))}")
