# FÓRMULA 100K — Skills oficiales

Suite completa de skills para Claude Code de la metodología **FÓRMULA 100K**, creada por Andrea Vega.

> Repo privado — acceso exclusivo para alumnas de la comunidad.

---

## ¿Qué son las skills de FÓRMULA 100K?

Son **58 herramientas** que viven dentro de Claude Code y te permiten ejecutar la metodología F100K sin tener que recordar cada paso. Le pides algo en lenguaje natural ("crea un carrusel viral sobre X", "audita mi comunidad de Skool", "escribe un VSL para mi oferta", "diseña un lead magnet tangible") y la skill correspondiente se activa con todo el know-how de Andrea adentro.

Cubren: guionización, calendarios de contenido e historias, audios de venta, VSL, construcción de ofertas, comunidades Skool, edición de video, miniaturas, carruseles, infografías reel, lead magnets y más.

---

## Cómo instalar (3 minutos)

### Paso 1 — Asegúrate de tener Claude Code

Si aún no lo tienes, instálalo desde [claude.com/claude-code](https://claude.com/claude-code).

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

¡Listo! Reinicia Claude Code y ya tienes acceso a las 57 skills.

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
- `andrea-vendedora-instagram` — Agente vendedor para DMs de Instagram

### Comunidad Skool
- `creadora-comunidades-skool` — Construir comunidades Skool desde cero
- `respondedora-andrea-skool` — Responder posts/comentarios en Skool
- `auditor-formula100k` — Auditar comunidades Skool + estrategias de contenido
- `roadmap-producto-f100k` — Roadmap de producto con Backward Design

### Video y visual
- `editor-video-formula100k` — Edita automáticamente reels desde manifest
- `graficos-de-video-formula100k` — Genera gráficos scrapbook para reels
- `recursos-de-video-formula100k` — Caza B-roll real + IA para reels
- `historias-a-imagenes-nanobanana` — Convertir guion de stories en PNGs
- `carrusel-render-formula100k` — Renderizar guion de carrusel a slides PNG
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

**FÓRMULA 100K © 2026 — Andrea Vega · Todos los derechos reservados**
