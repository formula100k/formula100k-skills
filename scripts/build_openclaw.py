#!/usr/bin/env python3
"""build_openclaw.py — genera el canal OpenClaw (openclaw/skills/) desde la copia LIMPIA de skills/.

Uso:  python3 scripts/build_openclaw.py

Qué hace, por cada skill listada en openclaw/config.json:
  1. Copia skills/<s>/ a openclaw/skills/<s>/ (sin los archivos de "exclude").
     NUNCA copia desde ~/.claude/skills: esa es la copia personalizada y trae fugas.
  2. Reescribe rutas de la Mac (~/Documents, $HOME/Documents, ~/.claude, ~/.f100k-radar)
     a carpetas del workspace del agente, con el mapeo de config (lo no mapeado → fallback_dir).
  3. Inserta al inicio del cuerpo el bloque «🦞 Corriendo en OpenClaw» con las notas de esa skill.
  4. Reescribe el frontmatter: description ≤1024 caracteres (estándar AgentSkills) y metadata
     en una sola línea JSON, con {"openclaw": {"requires": {"env": [...]}}} solo si la skill lo declara.
  5. Copia las skills que solo existen en OpenClaw: el puente (openclaw/puente/) y las nativas
     (openclaw/nativas/). Pasan por la misma validación que las demás.
  6. Valida y sale con 1 si algo no cumple.
"""
import json
import re
import shutil
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "skills"
OUT = ROOT / "openclaw" / "skills"
PUENTE = ROOT / "openclaw" / "puente"
NATIVAS = ROOT / "openclaw" / "nativas"
CONFIG = ROOT / "openclaw" / "config.json"
TEXT_EXT = {".md", ".json", ".txt", ".yaml", ".yml", ".py", ".sh", ".js", ".ts", ".csv", ".jsonl", ".html"}
MARK = "## 🦞 Corriendo en OpenClaw"

errors = []


def fail(msg):
    errors.append(msg)


def split_frontmatter(text, where):
    if not text.startswith("---"):
        fail(f"{where}: no empieza con frontmatter")
        return {}, text
    _, fm, body = text.split("---", 2)
    try:
        data = yaml.safe_load(fm) or {}
    except yaml.YAMLError:
        # Algunas skills de escritorio traen la description en una línea con ": " adentro,
        # que no es YAML válido. Se leen las claves de primer nivel a mano.
        data = {}
        for m in re.finditer(r"^([A-Za-z][\w-]*):\s?(.*)$", fm, re.M):
            data[m.group(1)] = m.group(2).strip()
    return data, body.lstrip("\n")


# ── Tuteo ───────────────────────────────────────────────────────────────────────────────
# Las alumnas se tutean. Se convierten las formas de voseo dirigidas a la usuaria.
# NO se tocan las líneas que ENSEÑAN la regla (listas de prohibidos, tablas vos→tú),
# ni formas ambiguas con el pretérito (elegí, escribí, abrí, subí, seguí = "yo elegí").
VOSEO = {
    "tenés": "tienes", "podés": "puedes", "querés": "quieres", "sabés": "sabes", "sentís": "sientes",
    "debés": "debes", "aplicás": "aplicas", "preferís": "prefieres", "usás": "usas", "mirás": "miras",
    "escribís": "escribes", "pensás": "piensas", "decís": "dices", "necesitás": "necesitas", "hacés": "haces",
    "generame": "genérame", "generá": "genera", "copiá": "copia", "decime": "dime", "mirá": "mira",
    "hacé": "haz", "creá": "crea", "mandá": "manda", "contá": "cuenta", "seguime": "sígueme",
    "pasame": "pásame", "mostrá": "muestra", "pintá": "pinta", "pegá": "pega", "decí": "di",
    "contale": "cuéntale", "decile": "dile", "mandame": "mándame", "contame": "cuéntame",
    "verificá": "verifica", "guardalo": "guárdalo", "seguilo": "síguelo", "combiná": "combina",
    "completá": "completa", "agregá": "agrega", "pegalo": "pégalo", "envialo": "envíalo",
    "abrilo": "ábrelo", "seleccioná": "selecciona", "armame": "ármame", "usá": "usa", "fijate": "fíjate",
    "avisame": "avísame", "probá": "prueba", "revisá": "revisa", "empezá": "empieza", "llamá": "llama",
    "indicá": "indica", "pensá": "piensa", "acá": "aquí", "generalo": "genéralo", "envialos": "envíalos",
}
META_LINE = re.compile(r"→|neutro|NEUTRO|voseo|argentin|PROHIBIDO|[Pp]rohibido|NUNCA|reemplaz|\(no |no vos|\| *vos|sin vos|vos/|/vos|tenés/|\"tenés\"|'tenés'", re.I)
VOSEO_RX = re.compile(r"(?<![\wáéíóúñÁÉÍÓÚÑ])(" + "|".join(sorted(map(re.escape, VOSEO), key=len, reverse=True)) + r")(?![\wáéíóúñÁÉÍÓÚÑ])", re.I)


def tutear(text):
    out = []
    for line in text.split("\n"):
        # Fila de una tabla de equivalencias (| tenés, podés | tienes, puedes |): trae la forma de voseo
        # y su reemplazo a la vez, así que es una regla, no una frase para la usuaria.
        es_tabla_regla = line.lstrip().startswith("|") and any(
            VOSEO[m.group(1).lower()] in line.lower() for m in VOSEO_RX.finditer(line))
        if not META_LINE.search(line) and not es_tabla_regla:
            def sub(m):
                w = m.group(1)
                r = VOSEO[w.lower()]
                if w.isupper() and len(w) > 1:
                    return r.upper()
                return r[0].upper() + r[1:] if w[0].isupper() else r
            line = VOSEO_RX.sub(sub, line)
        out.append(line)
    return "\n".join(out)


def blank_json(value):
    """Esqueleto vacío de un JSON de ejemplo: mismas claves, sin los datos (que pueden ser de un cliente)."""
    if isinstance(value, dict):
        return {k: blank_json(v) for k, v in value.items()}
    if isinstance(value, list):
        return [blank_json(value[0])] if value else []
    if isinstance(value, str):
        return ""
    return value


# Apify por Composio pide el actor con virgulilla (`clockworks~tiktok-scraper`). Las skills de
# escritorio lo escriben con barra porque el MCP de Apify sí la acepta; aquí se normaliza para que
# el agente no reciba un «no encontrado» mudo.
# El lookbehind evita tocar una URL del Store (apify.com/clockworks/tiktok-scraper), donde la barra sí va.
ACTOR_RX = re.compile(r"(?<![\w./~-])((?:clockworks|apify|compass|bebity|dtrungtin)/[a-z0-9][a-z0-9-]*)\b")


def normalizar_actores(text):
    return ACTOR_RX.sub(lambda m: m.group(1).replace("/", "~"), text)


def scrub(text):
    """Quita llaves e IDs personales que se colaron en las skills de escritorio, sin escribirlos en config."""
    text = re.sub(r"\s*·?\s*https://claude\.ai/code/routines/trig_[A-Za-z0-9]+", "", text)
    text = re.sub(r"sd_[a-f0-9]{16,}", "$SUPADATA_API_KEY", text)
    text = re.sub(r"`?trig_[A-Za-z0-9]{10,}`?", "tu automatización", text)
    return text


SECRET_RX = re.compile(r"sd_[a-f0-9]{16,}|apify_api_[A-Za-z0-9]{10,}|tvly-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{20,}|"
                       r"sk-(?:ant|or|proj)?-?[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|"
                       r"hf_[A-Za-z0-9]{20,}|xox[bp]-[A-Za-z0-9-]{10,}|sk_live_[A-Za-z0-9]{10,}|trig_[A-Za-z0-9]{10,}")
# El origen del método de las fichas profundas de storytelling no se nombra en ningún archivo público.
ORIGEN_RX = re.compile(r"playbook|creator\s*college", re.I)


def as_hint(v):
    if isinstance(v, list):
        return "[" + ", ".join(str(x) for x in v) + "]"
    return str(v)


def emit_frontmatter(data):
    lines = ["---", f"name: {data['name']}", "description: " + json.dumps(data["description"], ensure_ascii=False)]
    if "argument-hint" in data:
        lines.append("argument-hint: " + json.dumps(as_hint(data["argument-hint"]), ensure_ascii=False))
    for k, v in data.items():
        if k in ("name", "description", "argument-hint", "metadata"):
            continue
        lines.append(f"{k}: " + json.dumps(v, ensure_ascii=False))
    if data.get("metadata"):
        lines.append("metadata: " + json.dumps(data["metadata"], ensure_ascii=False))
    lines.append("---")
    return "\n".join(lines) + "\n\n"


def rewrite_paths(text, path_map, fallback):
    for src, dst in sorted(path_map, key=lambda p: -len(p[0])):
        text = text.replace(src, dst)
        if src.startswith("~/"):
            text = text.replace("$HOME/" + src[2:], dst)
    # Lo que quede de ~/Documents o $HOME/Documents sin mapear → fallback
    text = re.sub(r"(?:~|\$HOME)/Documents/[^\s`\"')\]]*", fallback, text)
    return text


def block(notes):
    out = [MARK, "", "> Esta versión corre en un agente OpenClaw (servidor + Telegram), no en Claude Code.",
           "> **Antes de seguir, lee la skill `f100k-puente`**: traduce herramientas y rutas.",
           "> Lo específico de esta skill:", ">"]
    out += [f"> - {n}" for n in notes]
    out += ["", "---", "", ""]
    return "\n".join(out)


def build():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    fallback = cfg["fallback_dir"]
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    for name, sc in cfg["skills"].items():
        src = SRC / name
        if not src.is_dir():
            fail(f"{name}: no existe skills/{name}")
            continue
        if not sc.get("notes"):
            fail(f"{name}: sin notas en config (escribe notas reales, no genéricas)")
        dst = OUT / name
        excl = set(sc.get("exclude", []))
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns("node_modules", ".DS_Store", "__pycache__"))
        for src_rel, dst_rel in sc.get("blank_json", []):
            p = src / src_rel
            if not p.exists():
                fail(f"{name}: blank_json '{src_rel}' no existe")
                continue
            (dst / dst_rel).write_text(json.dumps(blank_json(json.loads(p.read_text(encoding="utf-8"))),
                                                  ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        for rel in excl:
            p = dst / rel
            if p.exists():
                p.unlink()
            else:
                fail(f"{name}: exclude '{rel}' no existe")

        replaces = sc.get("replace", [])
        used = {r[0]: False for r in replaces}
        replaces_re = sc.get("replace_re", [])
        used_re = {r[0]: False for r in replaces_re}
        for f in dst.rglob("*"):
            if not f.is_file() or f.suffix.lower() not in TEXT_EXT:
                continue
            t = f.read_text(encoding="utf-8", errors="strict")
            t = scrub(t)
            t = normalizar_actores(t)
            for a, b in replaces:
                if a in t:
                    used[a] = True
                    t = t.replace(a, b)
            for a, b in replaces_re:
                t, k = re.subn(a, b, t)
                if k:
                    used_re[a] = True
            t = rewrite_paths(t, cfg["path_map"], fallback)
            t = tutear(t)
            f.write_text(t, encoding="utf-8")
        for a, ok in used_re.items():
            if not ok:
                fail(f"{name}: el replace_re '{a[:50]}…' no encontró nada (¿cambió la skill?)")
        for a, ok in used.items():
            if not ok:
                fail(f"{name}: el replace '{a[:50]}…' no encontró nada (¿cambió la skill?)")

        skill_md = dst / "SKILL.md"
        data, body = split_frontmatter(skill_md.read_text(encoding="utf-8"), name)
        if "description_override" in sc:
            data["description"] = sc["description_override"]
        data["description"] = " ".join(str(data.get("description", "")).split())
        meta = data.get("metadata") or {}
        if not isinstance(meta, dict):
            meta = {"original": meta}
        oc = {"emoji": "🦞"}
        if sc.get("requires_env"):
            oc["requires"] = {"env": sc["requires_env"]}
        meta["openclaw"] = oc
        data["metadata"] = meta
        skill_md.write_text(normalizar_actores(emit_frontmatter(data) + block(sc["notes"]) + body), encoding="utf-8")

    for base in (PUENTE, NATIVAS):
        if not base.exists():
            continue
        for p in base.iterdir():
            if p.is_dir():
                if (OUT / p.name).exists():
                    fail(f"{p.name}: existe en {base.name}/ y también en config (duplicada)")
                    continue
                shutil.copytree(p, OUT / p.name,
                                ignore=shutil.ignore_patterns("node_modules", ".DS_Store", "__pycache__"))
            for f in (OUT / p.name).rglob("*"):
                if f.is_file() and f.suffix.lower() in TEXT_EXT:
                    f.write_text(normalizar_actores(f.read_text(encoding="utf-8")), encoding="utf-8")


def validate():
    for skill in sorted(OUT.iterdir()):
        md = skill / "SKILL.md"
        text = md.read_text(encoding="utf-8")
        data, body = split_frontmatter(text, skill.name)
        if data.get("name") != skill.name:
            fail(f"{skill.name}: name del frontmatter no coincide con la carpeta")
        d = data.get("description", "")
        if not d:
            fail(f"{skill.name}: sin description")
        if len(d) > 1024:
            fail(f"{skill.name}: description de {len(d)} caracteres (máx 1024) → usa description_override en config")
        oc = (data.get("metadata") or {}).get("openclaw")
        if not isinstance(oc, dict):
            fail(f"{skill.name}: metadata.openclaw no parsea como objeto")
        is_puente = skill.name == "f100k-puente"
        if not is_puente and MARK not in body:
            fail(f"{skill.name}: falta el bloque «Corriendo en OpenClaw»")
        for f in skill.rglob("*"):
            if not f.is_file() or f.suffix.lower() not in TEXT_EXT:
                continue
            t = f.read_text(encoding="utf-8")
            rel = f.relative_to(OUT)
            if "/Users/" in t:
                fail(f"{rel}: queda una ruta /Users/")
            if re.search(r"(?:~|\$HOME)/(?:Documents|Downloads|Desktop|\.claude|\.f100k-radar)", t) and not is_puente:
                fail(f"{rel}: queda una ruta de la Mac sin mapear")
            for m in SECRET_RX.finditer(t):
                fail(f"{rel}: queda un secreto o ID personal ({m.group(0)[:12]}…) → reemplázalo en config")
            if ORIGEN_RX.search(t):
                fail(f"{rel}: nombra el origen del método de storytelling → neutralízalo en config")
            for m in ACTOR_RX.finditer(t):
                fail(f"{rel}: actor de Apify con barra ({m.group(1)}) → va con virgulilla")
            for i, line in enumerate(t.split("\n"), 1):
                if not META_LINE.search(line) and re.search(r"(?<![\wáéíóúñ])vos(?![\wáéíóúñ])", line):
                    fail(f"{rel}:{i}: queda «vos» fuera de una regla de idioma → replace en config")
            if re.search(r"claude-in-chrome|agent-browser", t) and not is_puente:
                if MARK not in (skill / "SKILL.md").read_text(encoding="utf-8"):
                    fail(f"{rel}: nombra el navegador de Claude Code y la skill no tiene bloque de equivalencia")


if __name__ == "__main__":
    build()
    validate()
    if errors:
        print("🚫 build_openclaw falló:")
        for e in errors:
            print("  -", e)
        sys.exit(1)
    names = sorted(p.name for p in OUT.iterdir())
    print(f"✅ openclaw/skills generado: {len(names)} skills")
    for n in names:
        print("  -", n)
