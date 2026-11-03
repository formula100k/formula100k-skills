# FÓRMULA 100K — Skills oficiales

Suite completa de skills para Claude Code de la metodología **FÓRMULA 100K**, creada por Andrea Vega.

> Repo privado — acceso exclusivo para alumnas de la comunidad.

---

## ¿Qué son las skills de FÓRMULA 100K?

Son **63 herramientas** que viven dentro de Claude Code y te permiten ejecutar la metodología F100K sin tener que recordar cada paso. Le pides algo en lenguaje natural ("crea un carrusel viral sobre X", "audita mi comunidad de Skool", "escribe un VSL para mi oferta", "diseña un lead magnet tangible") y la skill correspondiente se activa con todo el know-how de Andrea adentro.

Cubren: guionización, calendarios de contenido e historias, audios de venta, VSL, construcción de ofertas, comunidades Skool, edición de video, miniaturas, carruseles, infografías reel, lead magnets y más.

---

## Cómo instalar (3 minutos)

### Paso 1 — Asegúrate de tener Claude Code y Git

Si aún no tienes Claude Code, instálalo desde [claude.com/claude-code](https://claude.com/claude-code).

También necesitas **Git** instalado en tu computadora: Claude Code lo usa para descargar el marketplace. Si al agregar el marketplace te sale `Command 'git' not found`, es esto.

- **Windows:** descárgalo de [git-scm.com/download/win](https://git-scm.com/download/win) e instálalo con las opciones por defecto.
- **Mac:** abre la Terminal y escribe `git --version`. Si no lo tienes, el Mac te ofrece instalarlo; acepta.

Después de instalarlo, cierra y vuelve a abrir Claude Code.

### Paso 2 — Agrega el marketplace

Abre Claude Code en cualquier proyecto y corre:

```
/plugin marketplace add formula100k/formula100k-skills
```

> Si te pide autenticación, GitHub te abrirá una ventana para autorizar. Acepta con tu cuenta (la misma que invitamos al repo).

### Paso 3 — Instala todas las skills

```
/plugin install formula100k@formula100k
```

### Paso 4 — Activa tus MCPs (importante)

Las skills se potencian con **MCPs** (conexiones a herramientas como generadores de imagen, búsqueda web, transcripciones, etc.). Sin MCPs las skills funcionan a medias.

👉 **Lee [`MCPS.md`](./MCPS.md)** — te explica cuáles activar primero (la mayoría son gratis).

**Resumen del mínimo viable (gratis):** Playwright + Nanobanana + Tavily + Supadata. Con eso tienes el ~80% de las skills funcionando sin pagar nada.

¡Listo! Reinicia Claude Code y ya tienes acceso a las 63 skills.

---

## Cómo se usan

Una vez instaladas, Claude Code activa la skill correcta automáticamente cuando le pides algo. Ejemplos:

| Lo que dices | Skill que se activa |
|---|---|
| "Hazme un carrusel viral sobre X" | `carrusel-viral-formula100k` |
| "Audita esta comunidad de Skool" | `auditor-formula100k` |
| "Calendariza mi semana de contenido" | `calendarizador-contenido-formula100k` |
| "Escribe un VSL para esta oferta" | `vsl-expert-f100k` |
| "Crea una infografía reel" | `infografia-reel-formula100k` |
| "Hazme un reel faceless de X (sin mi cara)" | `reel-faceless-f100k` |

No tienes que recordar nombres — solo dile lo que necesitas.

---

## Actualizaciones

Cuando Andrea publique mejoras o skills nuevas:

```
/plugin marketplace update formula100k
/plugin update formula100k@formula100k
```

---

## Soporte

- **Comunidad Skool:** [skool.com/formula100k](https://skool.com/formula100k)
- **Web:** [formula100k.app](https://formula100k.app)
- **Instagram:** [@andreaestratega](https://instagram.com/andreaestratega)

---

## Lista de skills incluidas

### Guionización y contenido
- `guionizacion-formula100k` — 33 estructuras de guion + hooks + criterios virales
- `guionizacion-historias-formula100k` — Secuencias de historias para IG (3-6 stories)
- `guionizacion-humanizada` — Quitar el tono de IA y aplicar voz personal
- `carrusel-viral-formula100k` — Carruseles completos slide por slide
- `multiplicador-de-contenido` — Convertir 1 idea en múltiples formatos
- `optimizador-cta-formula100k` — Analizar y mejorar llamados a la acción
- `corrector-guiones-formula100k` — Revisión profunda de guiones
- `evaluador-ganchos-formula100k` — Evaluar la viralidad de hooks

### Calendarios e investigación
- `calendarizador-contenido-formula100k` — Calendario semanal de reels/carruseles
- `calendarizador-historias-formula100k` — Calendario semanal de stories
- `calendarizador-urgencias-formula100k` — Calendario de campañas con urgencia
- `creador-estrategia-contenido-formula100k` — Estrategia completa de contenido
- `investigacion-contenido-formula100k` — Investigación de tendencias + outliers
- `analizador-perfiles-formula100k` — Auditoría de perfiles IG/TikTok
- `benchmark-producto-formula100k` — Benchmark de competencia

### Venta y ofertas
- `vsl-expert-f100k` — VSLs, landings, ads y emails de venta
- `audios-venta-f100k` — Audios de venta para DM/WhatsApp
- `constructor-ofertas-f100k` — Construir ofertas irresistibles
- `cazador-lead-magnets-f100k` — Lead magnets tangibles que generan comentarios masivos (Método LMT)

### Comunidad Skool
- `creadora-comunidades-skool` — Construir comunidades Skool desde cero
- `auditor-formula100k` — Auditar comunidades Skool + estrategias de contenido
- `roadmap-producto-f100k` — Roadmap de producto con Backward Design

### Video y visual
- `celular-a-cine-f100k` — Tu clip del celular vuelve a filmarse como escena de película con IA (Higgsfield): hoja de personaje primero, lista de tomas por segundo y Seedance 2.5 frente a Wan 3.0 lado a lado
- `plantillas-edicion-f100k` — Catálogo único de 246 plantillas de edición (con 66 estilos de cine): dices «edita mi video con la plantilla «Pantalla dividida»» y sabe qué skill la hace, qué material pedir y cómo instalarla si falta
- `editor-video-formula100k` — Edita automáticamente reels desde manifest
- `graficos-de-video-formula100k` — Genera gráficos scrapbook para reels
- `recursos-de-video-formula100k` — Caza B-roll real + IA para reels
- `historias-a-imagenes-nanobanana` — Convertir guion de stories en PNGs
- `carrusel-render-formula100k` — Renderizar guion de carrusel a slides PNG
- `carrusel-formatos-f100k` — 35 formatos de carrusel: elige por objetivo, visual detallado y prompts para Claude, Gemini y ChatGPT
- `clonador-carrusel-formula100k` — Skill ESPEJO: clona el estilo de un carrusel de referencia desde una captura, lo mejora con F100K y renderiza los PNG finales con tu marca
- `portada-video-carrusel-formula100k` — Portada en VIDEO para carruseles: anima la foto gancho (cinemagraph Higgsfield) y compone el título en HTML transparente → slide-01-ANIMADO.mp4
- `miniatura-youtube-formula100k` — Miniaturas virales de YouTube
- `infografia-reel-formula100k` — Infografías virales animadas en reel
- `generador-artifact-educativo-formula100k` — Artifacts HTML educativos
- `transcripcion-youtube-formula100k` — Transcribir videos de YouTube
- `publicar-ig` — Publicar directo a Instagram desde Claude Code
- `capturas-tutorial-formula100k` — Overlays UI tipo tutorial (terminal, callout, step, claude-input) renderizados HTML+CSS+Puppeteer
- `motion-reels-f100k` — Motion graphics 9:16 para reels: pill labels flotantes, comparison cards BEFORE/NOW, UI cards, chapter cards — transcribe el video y sincroniza cada overlay al timestamp exacto
- `motion-youtube-f100k` — Motion graphics 16:9 para YouTube: mismos 4 tipos de overlay optimizados para formato horizontal — transcribe con Supadata (URL) o Whisper (local)
- `reel-faceless-f100k` — Explainer faceless 9:16: Andrea graba la voz pero nunca sale en cámara. El Clip Director decide por gancho el visual de cada segmento (B-roll cinemático IA / card kinética / pixel-meme) y compone el reel completo. Su motor de clips también alimenta al editor de YouTube con B-roll de apoyo a medida del guion

### Crear apps (sin ser programadora)
- `constructor-miniapps-f100k` — Construye mini-apps reales y las despliega: extensiones de Chrome, scrapers, calculadoras, generadores, analizadores, quizzes capta-correos, dashboards y mini-SaaS de suscripción. Motor de las 20 plantillas del artifact "40 Trucos de Claude + 20 Mini-Apps"
- `landing-producto-formula100k` — Landing de venta con mockups, copy, Stripe y deploy en Vercel

---

## 🤖 Autopilot F100K

Familia de 6 skills que automatizan tu rutina diaria y semanal de contenido. **Configura una vez, recibe resultados cada día.**

| Skill | Frecuencia | Qué hace |
|-------|-----------|----------|
| `rutina-maestra-formula100k` | Una vez (setup) | Onboarding interactivo — configura tu nicho, keywords, email y programa todos los módulos |
| `radar-virales-f100k` | Diario (lun-vie) | Caza el viral más relevante del día + genera guion de reacción listo para grabar |
| `calendario-semanal-f100k` | Semanal (lunes) | Arma el calendario de 7 días con refs virales reales + guiones exportados a CSV/XLSX |
| `radar-tendencias-f100k` | Diario (lun-vie) | Detecta tendencias emergentes 24-72h antes del pico para que publiques primero |
| `digest-comunidad-f100k` | Semanal (viernes) | Analiza comentarios de la semana y los convierte en las 5 ideas que pide tu audiencia |
| `metricas-semanales-f100k` | Semanal (domingo) | Qué post ganó esta semana, por qué funcionó, y qué replicar la próxima |

**Cómo empezar:** Corre `/rutina-maestra-formula100k` una vez. Responde 8 preguntas rápidas. Tu Autopilot queda activo.

**Config:** Guardada en `~/.f100k-radar/config.json` en tu máquina (local, no en el repo — cada alumna tiene la suya).

**MCPs requeridos:** Apify, Tavily, Gmail. Ver [`MCPS.md`](./MCPS.md).

---

## 🔒 Para el equipo — antes de publicar (obligatorio)

Este repo es la **copia de distribución**: lo que hay aquí se instala en la máquina de cada
alumna. Las skills se escriben en `~/.claude/skills/`, donde es normal que estén personalizadas
(rutas locales, la cuenta propia, la voz propia). **Al copiarlas aquí, esa personalización se
convierte en una fuga**: el Claude de la alumna lee "eres Andrea" o "usa la carpeta de Andrea"
y se niega a trabajar ("no puedo usar información privada de otra persona"), o intenta leer
rutas y repos que no existen en su máquina.

Antes de cada commit de sync:

```bash
./scripts/check-fugas.sh
```

Revisa 7 clases de fuga: rutas `/Users/<alguien>/`, carpetas personales, handle hardcodeado,
cuentas de GitHub/Vercel/Skool ajenas, "Andrea" usada como sujeto, punteros a memorias que
solo existen en la máquina de origen, y secretos. Sale con error si encuentra algo.

Reglas al escribir una skill para distribución:

| En vez de… | Escribe… |
|---|---|
| `/Users/kissita/Documents/…` | `~/Documents/…` (docs) o `$HOME/…` (scripts) |
| "Si Andrea pide…", "para Andrea" | "Si el usuario pide…", "para el usuario" |
| `@andreaestratega` en una plantilla | `@tuhandle` + pregúntale el suyo la primera vez |
| Carpeta `ANDREA SELFIES` | `MIS SELFIES`, y si no existe **pregunta** la ruta |
| "usa la memoria `feedback_x_andrea`" | deja la regla escrita inline en la skill |
| `Kissicore/repo`, scope de Vercel propio | `<TU-USUARIO-GITHUB>` / `vercel whoami` |

Atribuir la metodología a **Andrea Vega** (autoría) sí está bien. Lo que no puede aparecer es
Andrea como **usuaria** de la skill: en la máquina de la alumna, la usuaria es ella.

Y al publicar: bumpea **las dos** versiones (`.claude-plugin/plugin.json` y `marketplace.json`)
o la update-detection de las alumnas no dispara.

---

**FÓRMULA 100K © 2026 — Andrea Vega · Todos los derechos reservados**
