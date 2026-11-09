# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///
"""Oído Gemini: escucha un corte terminado y marca errores de edición.

Uso: oido_gemini.py <audio.wav|video.mp4> <salida.json> [--modelo gemini-3.8-flash] [--guion guion.txt] [--final]
     --final   escucha el REEL TERMINADO (con efectos): además de los errores de corte marca efectos que tapan la voz,
               sonidos agudos (regla 30-oct), saltos de volumen, música y huecos. Es el «oído humano» de la entrega (31-oct).
     oido_gemini.py --clip union.wav [union2.wav …]   (clips de 2–5 s: transcribe exacto y dice si suena de corrido)
Llave: $GEMINI_API_KEY, $GEMINI_KEY_FILE o ~/.editor-video/llave-gemini.txt (en ese orden);
si una se queda sin cuota (429) salta sola a la siguiente.
Sus tiempos son aproximados: cada aviso se confirma escuchando la unión del edl más cercana
(clip corto a Gemini o whisper-cli aislado) antes de tocar el corte.
"""
import json, os, sys, time, urllib.request, urllib.error, argparse

API = "https://generativelanguage.googleapis.com"

PROMPT = """Eres editora de video en español. Te paso el AUDIO de un video YA CORTADO (una creadora hablando a cámara).
Escúchalo completo con atención, como lo escucharía alguien que lo ve por primera vez, y marca SOLO errores de edición:

- "repeticion": dice la misma idea dos veces seguidas porque se equivocó y la volvió a decir (aunque cambie palabras). Indica cuál de las dos sobra (normalmente la primera, la que quedó incompleta o peor dicha).
- "frase_a_medias": empieza una frase y la abandona; queda sin sentido o sin contexto.
- "palabra_cortada": una palabra suena mocha, le falta una sílaba o el corte la interrumpe.
- "salto_raro": un corte donde se nota un salto brusco de tono, respiración o sentido.
- "muletilla": "eh", "este", "o sea" sueltos que sobran.

NO marques: ideas que se repiten a propósito para enfatizar, citas, ni cosas que dice un clip de otra persona (puede haber voces en inglés u otras voces; ignóralas).
{guion}
Para cada error da el tiempo en el audio (segundos, con decimales) lo más exacto que puedas y el TEXTO EXACTO que se oye ahí, palabra por palabra, para poder ubicarlo.
Responde SOLO un JSON: {{"errores":[{{"inicio":12.3,"fin":14.1,"tipo":"repeticion","texto_que_sobra":"...","contexto":"lo que se oye justo antes y después","motivo":"...","confianza":"alta|media|baja"}}]}}
Si no hay errores, {{"errores":[]}}."""


PROMPT_FINAL = PROMPT.replace("""- "muletilla": "eh", "este", "o sea" sueltos que sobran.""", """- "muletilla": "eh", "este", "o sea" sueltos que sobran.

Este es el REEL TERMINADO, con efectos de sonido. Escúchalo también como lo oiría la audiencia y marca la MEZCLA:
- "efecto_fuerte": un efecto (pop, swish, golpe, papel) que tapa o compite con la voz, o que asusta por lo fuerte.
- "sonido_agudo": cualquier pitido, timbre, campana, ding, clic, tecla o chirrido agudo (están PROHIBIDOS; solo valen graves).
- "volumen": la voz sube o baja de golpe entre un tramo y otro, o se oye lejana, saturada o con eco distinto.
- "musica": se oye música de fondo (no debe haber).
- "hueco": un silencio de más de 0,6 s que corta el ritmo.""")


class SinCuota(Exception):
    pass


def claves():
    ks = []
    if os.environ.get("GEMINI_API_KEY"):
        ks.append(os.environ["GEMINI_API_KEY"].strip())
    rutas = [os.environ.get("GEMINI_KEY_FILE"), "~/.editor-video/llave-gemini.txt"]
    for r in rutas:
        if r and os.path.exists(os.path.expanduser(r)):
            k = open(os.path.expanduser(r)).read().strip()
            if k and k not in ks:
                ks.append(k)
    if not ks:
        sys.exit("Falta la llave de Gemini: guárdala en ~/.editor-video/llave-gemini.txt (se saca gratis en https://aistudio.google.com/apikey)")
    return ks


def clave():
    return claves()[0]


def con_claves(fn):
    """Corre fn(k) con cada clave hasta que una tenga cuota."""
    ks = claves()
    for i, k in enumerate(ks):
        try:
            return fn(k)
        except SinCuota as e:
            print(f"clave {i + 1}/{len(ks)} sin cuota ({e}); pruebo la siguiente", file=sys.stderr)
    sys.exit("429: todas las claves de Gemini están sin cuota")


def subir(k, ruta):
    datos = None
    mime = "audio/wav" if ruta.endswith(".wav") else "audio/mpeg"
    if ruta.lower().endswith((".mp4", ".mov", ".m4v")):          # video: se le saca el audio tal cual (mp3 44,1 kHz, con efectos)
        import subprocess, tempfile
        mp3 = tempfile.mktemp(suffix=".mp3")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", ruta, "-vn", "-ac", "1", "-ar", "44100", "-b:a", "128k", mp3], check=True)
        datos, mime = open(mp3, "rb").read(), "audio/mpeg"
    if datos is None:
        datos = open(ruta, "rb").read()
    ini = urllib.request.Request(
        f"{API}/upload/v1beta/files",
        json.dumps({"file": {"display_name": os.path.basename(ruta)}}).encode(),
        {"x-goog-api-key": k, "X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start",
         "X-Goog-Upload-Header-Content-Length": str(len(datos)), "X-Goog-Upload-Header-Content-Type": mime,
         "Content-Type": "application/json"})
    url = urllib.request.urlopen(ini).headers["X-Goog-Upload-URL"]
    sub = urllib.request.Request(url, datos, {"X-Goog-Upload-Command": "upload, finalize",
                                              "X-Goog-Upload-Offset": "0", "Content-Length": str(len(datos))})
    f = json.load(urllib.request.urlopen(sub))["file"]
    while f.get("state") == "PROCESSING":
        time.sleep(3)
        f = json.load(urllib.request.urlopen(urllib.request.Request(f"{API}/v1beta/{f['name']}", headers={"x-goog-api-key": k})))
    return f


def generar(k, modelo, cuerpo):
    for intento in range(6):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(
                f"{API}/v1beta/models/{modelo}:generateContent", json.dumps(cuerpo).encode(),
                {"x-goog-api-key": k, "Content-Type": "application/json"}), timeout=900))
        except urllib.error.HTTPError as e:
            cuerpo_err = e.read().decode()[:300]
            if e.code == 429 and ("quota" in cuerpo_err.lower() or "exhausted" in cuerpo_err.lower()):
                raise SinCuota(cuerpo_err[:120])
            if e.code not in (429, 500, 503) or intento == 5:
                sys.exit(f"{e.code}: {cuerpo_err}")
            print(f"{e.code}, reintento en {20 * (intento + 1)} s", file=sys.stderr)
            time.sleep(20 * (intento + 1))


def clips(rutas):
    import base64
    for ruta in rutas:
        cuerpo = {"contents": [{"parts": [
            {"inline_data": {"mime_type": "audio/wav", "data": base64.b64encode(open(ruta, "rb").read()).decode()}},
            {"text": "Transcribe EXACTAMENTE lo que se oye, incluidas sílabas a medias y repeticiones. Luego: ¿suena natural, "
                     "dicho de corrido? Formato: TEXTO: ... | NATURAL: sí/no y por qué (breve)."}]}],
            "generationConfig": {"temperature": 0}}
        r = con_claves(lambda kk: generar(kk, "gemini-3.8-flash", cuerpo))
        print(os.path.basename(ruta), "→", "".join(p.get("text", "") for p in r["candidates"][0]["content"]["parts"] if not p.get("thought")).strip())


def main():
    if len(sys.argv) > 2 and sys.argv[1] == "--clip":
        return clips(sys.argv[2:])
    ap = argparse.ArgumentParser()
    ap.add_argument("audio"); ap.add_argument("salida")
    ap.add_argument("--modelo", default="gemini-3.8-flash")
    ap.add_argument("--guion")
    ap.add_argument("--final", action="store_true")
    a = ap.parse_args()
    guion = ""
    if a.guion:
        guion = "\nEste es el GUION que quería decir (lo que no está en el guion y suena a error, márcalo; las improvisaciones que suman, déjalas):\n" + open(a.guion).read() + "\n"
    t0 = time.time()

    def correr(k):
        f = subir(k, a.audio)
        cuerpo = {"contents": [{"parts": [{"file_data": {"mime_type": f["mimeType"], "file_uri": f["uri"]}},
                                          {"text": (PROMPT_FINAL if a.final else PROMPT).format(guion=guion)}]}],
                  "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}}
        return generar(k, a.modelo, cuerpo)
    r = con_claves(correr)
    texto = "".join(p.get("text", "") for p in r["candidates"][0]["content"]["parts"] if not p.get("thought"))
    res = json.loads(texto)
    res["_modelo"] = a.modelo
    res["_uso"] = r.get("usageMetadata")
    res["_segundos"] = round(time.time() - t0)
    json.dump(res, open(a.salida, "w"), ensure_ascii=False, indent=1)
    print(f"{len(res['errores'])} errores · {res['_segundos']} s · {a.modelo}")


if __name__ == "__main__":
    main()
