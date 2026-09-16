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
| `puente/f100k-openclaw/` | La skill puente: tabla de equivalencias Claude Code → OpenClaw. Se edita aquí. |
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

## Lo que NO se hace

**Este repo no se sube a ClawHub.** ClawHub es un catálogo público y este repo es privado: es para
miembros de FÓRMULA 100K. En ClawHub solo irá una vitrina aparte con unas pocas skills gratis.
