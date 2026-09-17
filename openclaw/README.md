# Canal OpenClaw — las skills F100K dentro de tu agente

Esta carpeta es la versión de las skills de FÓRMULA 100K para correr en un **agente OpenClaw**
(por ejemplo, en PapayaClaw): un servidor que trabaja 24/7 y te habla por Telegram.

Es el 4º canal de distribución, junto al marketplace de Claude Code, la web y el pack de Claude Desktop.
El método de cada skill es el mismo; lo que cambia son las herramientas (no hay navegador logueado,
no hay rutas de una Mac, todo se entrega por Telegram).

## Qué hay aquí

| Ruta | Qué es |
|---|---|
| `skills/` | **Generado.** Lo que se instala en el agente. No lo edites a mano. |
| `puente/f100k-puente/` | La skill puente: tabla de equivalencias Claude Code → OpenClaw. Se edita aquí. |
| `config.json` | Qué skills entran, sus notas para el servidor, el mapeo de rutas y los archivos que no viajan. |
| `instalar.sh` | Instala o actualiza las skills en el servidor. |

## Cómo se regenera (quien mantiene el repo)

```bash
python3 scripts/build_openclaw.py   # copia desde skills/, reescribe rutas, valida
./scripts/check-fugas.sh            # también revisa openclaw/
```

Siempre parte de `skills/` de este repo (la copia limpia). Nunca de `~/.claude/skills`.
Para sumar una skill: agrégala en `config.json` con notas **reales** (qué herramienta usa y cuál es
su reemplazo en el servidor) y vuelve a correr el script. Si falla, no publiques.

## Cómo se instala en tu agente

1. En GitHub crea un **token de solo lectura** para este repo
   (Settings → Developer settings → Fine-grained tokens → acceso solo a `formula100k/formula100k-skills`, permiso *Contents: Read-only*).
2. Pídele a tu agente por Telegram que corra:

```bash
git clone https://<TU_TOKEN>@github.com/formula100k/formula100k-skills.git ~/f100k-skills
bash ~/f100k-skills/openclaw/instalar.sh
```

## Cómo se actualiza

Una automatización semanal en tu agente que corra:

```bash
git -C ~/f100k-skills pull --ff-only && bash ~/f100k-skills/openclaw/instalar.sh
```

Tus archivos (`cerebro/`, `guiones/`, `ideas/`, `informes/`, `entregables/`) nunca se tocan.

## ClawHub (público)

Desde el 16-sep-2026 las skills de `openclaw/skills/` se publican **públicas** en ClawHub para que
cualquier agente OpenClaw las instale sin token. Se publica **solo esa carpeta**, nunca el repo:

```bash
python3 scripts/build_openclaw.py && ./scripts/check-fugas.sh
clawhub sync --root openclaw/skills --dry-run   # revisar qué sube
clawhub sync --root openclaw/skills --all
```

Por ser público, `build_openclaw.py` además falla si en lo generado queda: una llave o ID personal,
el nombre del origen del método de las fichas profundas de storytelling, o «vos» fuera de una regla
de idioma. Convierte el voseo a tuteo (las alumnas se tutean) y no copia ejemplos con datos de clientes
reales (`exclude` + `blank_json` en config).

## Lo que el servidor necesita (lote 3)

Las skills de carruseles, video, apps e investigación piden esto en el VPS (Ubuntu 24.04, root):

| Qué | Para qué |
|---|---|
| 2 GB de swap | Chrome + un render no tumban el agente con 4 GB de RAM |
| `ffmpeg` | **Solo** juntar clips ya generados (`concat -c copy`). Nada de edición |
| Google Chrome (`.deb`, no el `chromium` de apt, que es snap) + `CHROME_PATH=/usr/bin/google-chrome-stable` | Navegador del agente sin login y render HTML → PNG de carruseles |
| Fuentes `fonts-noto-color-emoji fonts-liberation fonts-dejavu fonts-noto-core` | Que los carruseles no salgan con cuadritos |
| Node 20+ y `puppeteer-core` (sin bajar navegador) | `export.js` / `render.js` de las skills de carrusel |
| `python3-pip`, `zip`, `jq`, `curl` | Scripts auxiliares y mandar carpetas por Telegram |
| Higgsfield CLI (`npm i -g @higgsfield/cli` + `higgsfield auth login`) | Generar imágenes, clips y animaciones |
| `npm i -g vercel` + `VERCEL_TOKEN` de la usuaria | Las apps y landings se despliegan siempre directo en su Vercel |
| Llaves de la usuaria: `APIFY_TOKEN`; opcionales `SUPADATA_API_KEY`, `GROQ_API_KEY`/`OPENAI_API_KEY` | Datos públicos de redes, transcripts, voz |
| **Composio con Tavily y Apify conectados** | **La búsqueda web y los datos de redes de TODAS las skills entran por aquí.** Sin esto el agente no puede investigar y va a reportar «no encontré nada» |
| Composio con Instagram profesional | Métricas de su propia cuenta y publicar con ✅ |

**No se instala:** Remotion, HyperFrames, yt-dlp, Whisper local, Playwright con su propio Chromium.
Omitidas por ser edición de metraje grabado: `editor-video-formula100k`, `motion-youtube-f100k`, `motion-tracking-dedo-f100k`, `collage-cine-f100k`.

## Si el agente dice que no encuentra algo

Casi siempre no falta nada: falta mirar. Pídele por Telegram que corra esto y que te pegue la salida
tal cual, sin resumir:

```bash
ls ~/.openclaw/workspace/skills | wc -l          # cuántas skills tiene
ls ~/.openclaw/workspace/skills | grep radar     # ¿está la que dice que no existe?
cat ~/.openclaw/workspace/skills/*/.f100k-version | sort -u   # con qué versión corre
composio whoami                                   # ¿puede buscar?
```

- **Sale una lista con las skills** → estaban ahí y el agente no miró. Dile que lea la skill y repita
  la tarea siguiéndola fase por fase.
- **`.f100k-version` no existe** → se instalaron desde **ClawHub** (`openclaw skills install @formula100k/…`),
  que es la ruta normal de las alumnas y no deja ese sello. Para actualizar ahí:
  `openclaw skills update --all` y reiniciar el gateway. El sello `.f100k-version` solo aparece
  cuando se instala con `instalar.sh` desde este repo privado.
  ⚠️ **Una corrección de este repo no llega a ClawHub sola**: hay que republicar
  (`clawhub sync --owner formula100k --bump patch`) o la alumna sigue con la versión vieja.
- **`composio whoami` falla** → el agente no puede investigar nada. Corre `composio login` y revisa
  que Tavily y Apify estén conectados en dashboard.composio.dev → Connect Apps.

Un agente nunca debe reportar como «faltante» un archivo que ninguna skill le pidió. Si lo hace,
recuérdale la sección 2 de `f100k-puente`.
