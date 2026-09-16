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
  5. Copia la skill puente openclaw/puente/f100k-openclaw.
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
    return yaml.safe_load(fm) or {}, body.lstrip("\n")


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
           "> **Antes de seguir, lee la skill `f100k-openclaw`**: traduce herramientas y rutas.",
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
        for rel in excl:
            p = dst / rel
            if p.exists():
                p.unlink()
            else:
                fail(f"{name}: exclude '{rel}' no existe")

        replaces = sc.get("replace", [])
        used = {r[0]: False for r in replaces}
        for f in dst.rglob("*"):
            if not f.is_file() or f.suffix.lower() not in TEXT_EXT:
                continue
            t = f.read_text(encoding="utf-8", errors="strict")
            for a, b in replaces:
                if a in t:
                    used[a] = True
                    t = t.replace(a, b)
            t = rewrite_paths(t, cfg["path_map"], fallback)
            f.write_text(t, encoding="utf-8")
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
        skill_md.write_text(emit_frontmatter(data) + block(sc["notes"]) + body, encoding="utf-8")

    for p in PUENTE.iterdir():
        if p.is_dir():
            shutil.copytree(p, OUT / p.name)


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
        is_puente = skill.name == "f100k-openclaw"
        if not is_puente and MARK not in body:
            fail(f"{skill.name}: falta el bloque «Corriendo en OpenClaw»")
        for f in skill.rglob("*"):
            if not f.is_file() or f.suffix.lower() not in TEXT_EXT:
                continue
            t = f.read_text(encoding="utf-8")
            rel = f.relative_to(OUT)
            if "/Users/" in t:
                fail(f"{rel}: queda una ruta /Users/")
            if re.search(r"(?:~|\$HOME)/(?:Documents|\.claude|\.f100k-radar)", t) and not is_puente:
                fail(f"{rel}: queda una ruta de la Mac sin mapear")
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
