# Carrusel del radar — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Skill nativa de OpenClaw `carrusel-del-radar-f100k` que convierte el radar del agente en un carrusel del recetario y lo publica en Instagram con doble ✅ por Telegram, más un artifact con los prompts para que Andrea lo active en Bigotito.

**Architecture:** La skill es un SKILL.md orquestador (sin código propio): encadena `radar-*`, `carrusel-formatos-f100k` (catálogo + `build.js` con su revisión), la §3.1 del puente (Gemini) y `publicar-ig` (Composio). El estado entre ✅ vive en `entregables/carruseles/<fecha>-<slug>/estado.json`. El build copia una carpeta nueva `openclaw/nativas/` igual que ya copia `openclaw/puente/`.

**Tech Stack:** Markdown (skill), Python 3 + PyYAML (build), Node + puppeteer-core + Chrome (render, ya existente), Composio Instagram, Gemini API.

**Spec:** `docs/superpowers/specs/2026-09-21-carrusel-del-radar-design.md`

## Global Constraints

- Tuteo y español neutro en todo lo que lee la usuaria (el build ya tutea y valida «vos»).
- Skill genérica: nada de la marca, handle, palabra de CTA ni datos de Andrea; todo sale de `USER.md` y `cerebro/`.
- No nombrar el origen del método de storytelling (el build lo valida).
- Nunca publica sin ✅ explícito por Telegram; nunca cifras sin fuente.
- `description` ≤ 1024 caracteres.
- Rutas solo del workspace (`cerebro/`, `informes/`, `entregables/`, `skills/`); ninguna ruta de Mac.
- Costo de portada: US$0,10 (Gemini 2K, verificado 20-sep). Cron: lunes y jueves 8:00, zona de `USER.md`.
- Versión del plugin: 1.36.0 → 1.37.0.

---

### Task 1: El build copia `openclaw/nativas/`

**Files:**
- Modify: `scripts/build_openclaw.py` (constante junto a `PUENTE`, bucle final de `build()`, docstring paso 5)
- Create: `openclaw/nativas/.gitkeep` (se borra en Task 2 cuando entra la skill)

**Interfaces:**
- Produces: toda carpeta en `openclaw/nativas/<skill>/` aparece en `openclaw/skills/<skill>/` y pasa por `validate()` (exige el bloque «🦞 Corriendo en OpenClaw»).

- [ ] **Step 1: Prueba que falla** — crear una skill de prueba en `openclaw/nativas/zz-prueba/SKILL.md` con frontmatter `name: zz-prueba`, description corta y el bloque `## 🦞 Corriendo en OpenClaw`. Correr:
  `python3 scripts/build_openclaw.py >/dev/null; test -f openclaw/skills/zz-prueba/SKILL.md && echo PASA || echo FALLA`
  Esperado: `FALLA`.
- [ ] **Step 2: Implementar**

```python
PUENTE = ROOT / "openclaw" / "puente"
NATIVAS = ROOT / "openclaw" / "nativas"
```

```python
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
```

  Docstring paso 5: «Copia las skills que solo existen en OpenClaw: el puente (`openclaw/puente/`) y las nativas (`openclaw/nativas/`).»
- [ ] **Step 3: Correr** el mismo comando del Step 1. Esperado: `PASA` y `✅ openclaw/skills generado: 79 skills`.
- [ ] **Step 4:** borrar `openclaw/nativas/zz-prueba`, volver a correr el build (78 skills), confirmar `git status` sin cambios en `openclaw/skills/` salvo lo esperado.
- [ ] **Step 5: Commit** `feat(openclaw): el build copia las skills nativas de openclaw/nativas/`

### Task 2: La skill `carrusel-del-radar-f100k`

**Files:**
- Create: `openclaw/nativas/carrusel-del-radar-f100k/SKILL.md`
- Create: `openclaw/nativas/carrusel-del-radar-f100k/references/mensajes-telegram.md` (plantillas exactas de ✅1, ✅2, falta-algo, recordatorio, publicado)
- Create: `openclaw/nativas/carrusel-del-radar-f100k/references/estado.schema.json`
- Delete: `openclaw/nativas/.gitkeep`

**Interfaces:**
- Consumes: `skills/carrusel-formatos-f100k/{references/catalogo.md,build.js}`, `skills/carrusel-viral-formula100k`, `skills/publicar-ig`, `skills/radar-tendencias-f100k`, §3.1 de `f100k-puente`, acciones Composio `INSTAGRAM_GET_IG_USER_CONTENT_PUBLISHING_LIMIT`, `INSTAGRAM_POST_IG_USER_MEDIA` (`image_file`, `is_carousel_item`, `media_type: CAROUSEL`, `children`, `caption`), `INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH`.
- Produces: estados `esperando_ok_guion | esperando_ok_slides | publicado | entregado_a_mano | descartado`; frases gatillo «corre el carrusel del radar», «hazme un carrusel de X», «ensayo, no publiques».

- [ ] **Step 1: Prueba que falla** — `python3 scripts/build_openclaw.py >/dev/null; test -f openclaw/skills/carrusel-del-radar-f100k/SKILL.md && echo PASA || echo FALLA` → `FALLA`.
- [ ] **Step 2: Escribir el SKILL.md** con estas secciones, en este orden, con el contenido del spec (Pasos 0–6, ✅1, ✅2, reglas de ficha automática, reglas duras de guion, revisión con máx. 2 vueltas, Composio paso a paso, `%23`, PNG→JPEG con Pillow, un carrusel abierto a la vez, modo ensayo que se detiene en ✅2 y guarda con estado `entregado_a_mano`):
  1. Frontmatter (`name`, `description` ≤1024 con gatillos, `metadata: {"openclaw": {"emoji": "🦞", "requires": {"env": ["GEMINI_API_KEY"]}}}`)
  2. `## 🦞 Corriendo en OpenClaw` (lee el puente; esta skill solo existe aquí)
  3. `## Antes de todo: ¿hay un carrusel abierto?`
  4. `## Paso 0 · Chequeo` (comandos exactos)
  5. `## Paso 1 · Tema` … `## Paso 6 · Publicar`
  6. `## Automatización` (texto exacto para crear el cron con ✅)
  7. `## Lo que nunca haces`
- [ ] **Step 3: Escribir** `references/mensajes-telegram.md` y `references/estado.schema.json` (JSON Schema draft-07 del `estado.json` del spec).
- [ ] **Step 4: Correr** build → `PASA`, `79 skills`; `./scripts/check-fugas.sh` → limpio; `python3 -c "import json;json.load(open('openclaw/nativas/carrusel-del-radar-f100k/references/estado.schema.json'))"` → sin error; `grep -rnE "andreaestratega|Andrea|«YO»|Comenta 100K" openclaw/nativas/carrusel-del-radar-f100k` → vacío.
- [ ] **Step 5: Commit** `feat(openclaw): carrusel-del-radar — del radar al post con doble ✅`

### Task 3: Ensayo real del render (en la Mac)

**Files:** ninguno del repo; todo en el scratchpad.

- [ ] **Step 1:** `cd skills/carrusel-formatos-f100k && npm install` (si falta `node_modules`).
- [ ] **Step 2:** seguir la skill construida como lo haría el agente, con un tema real y genérico: una ficha de plantilla (`datos`) → `spec.json` → `node build.js <carpeta>/spec.json`.
- [ ] **Step 3:** lo mismo con una ficha G de HTML libre → `carrusel.html` → `build.js`.
- [ ] **Step 4:** mirar TODOS los PNG. Esperado: 0 avisos `⚠ fuente`/`⚠ imagen`, sin texto cortado. Si la skill dio una instrucción que no funcionó, se corrige el SKILL.md (vuelve a Task 2 Step 4) y se anota.
- [ ] **Step 5:** sin commit si no hubo cambios; si los hubo, `fix(carrusel-del-radar): <qué>`.

### Task 4: README, versión y PR

**Files:**
- Modify: `openclaw/README.md` (fila `nativas/` en la tabla «Qué hay aquí»)
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (1.36.0 → 1.37.0)

- [ ] **Step 1:** editar, rebuild + check-fugas verdes.
- [ ] **Step 2: Commit** `chore: v1.37.0 — carrusel del radar en el canal OpenClaw`.
- [ ] **Step 3:** `git push -u origin feat/carrusel-del-radar` y `gh pr create` con resumen + qué falta que haga Andrea. **No mergear ni `clawhub sync`** sin su ✅.

### Task 5: Artifact para Andrea

**Files:** `<scratchpad>/carrusel-del-radar.html`

- [ ] **Step 1:** cargar `artifact-design`.
- [ ] **Step 2:** página con: qué estamos haciendo (el flujo en 8 pasos, con diagrama), qué hace ella vs. qué hace Bigotito, y los prompts listos con botón copiar, en orden: (1) mergear y publicar a ClawHub (lo pide a Claude aquí), (2) actualizar a Bigotito + reinicio, (3) chequeo del taller/Chrome, (4) conectar/confirmar Instagram en Composio, (5) ensayo sin publicar, (6) crear la automatización lunes/jueves, (7) uso diario (bajo demanda, respuestas a los ✅). Costos y qué hacer si algo falla.
- [ ] **Step 3:** publicar con Artifact y mandar el link.
