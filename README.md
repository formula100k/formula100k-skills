# 🔒 FÓRMULA 100K · Skills exclusivas

Suite completa de skills para Claude Code de la metodología **FÓRMULA 100K**, creada por Andrea Vega.

> 🔒🔒🔒 **Si no eres de FÓRMULA 100K, no instales esto.** 🔒🔒🔒
>
> Estas skills son exclusivas para los miembros de la comunidad FÓRMULA 100K en Skool. Funcionan junto con las clases, plantillas y acompañamiento de la comunidad: fuera de ella no tienen soporte.

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

¡Listo! Reinicia Claude Code y ya tienes acceso a las 124 skills.

---

## Cómo se usan

Una vez instaladas, Claude Code activa la skill correcta automáticamente cuando le pides algo. Ejemplos:

| Lo que dices | Skill que se activa |
|---|---|
| "Hazme un carrusel viral sobre X" | `carrusel-viral-formula100k` |
| "Audita esta comunidad de Skool" | `auditor-formula100k` |
| "Calendariza mi semana de contenido" | `calendarizador-contenido-formula100k` |
| "Escribe un VSL para esta oferta" | `vsl-expert-f100k` |
| "Arranca mis 7 movimientos" | `movimientos-de-venta-f100k` |
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

## Tu brandkit en todas las piezas

Todas las skills que hacen piezas visuales (edición, animación, carruseles, miniaturas e imágenes) leen tu
brandkit: basta con decir «usa mi brandkit» o adjuntar tu `brandkit.md` (o el ZIP que descargas de Yapper,
Identidad visual → Tu brandkit). Si tienes el conector de Yapper, lo leen solas. Va encima del estilo que
elijas: colores, letras, gancho, subtítulos, elementos, stickers y CTA. La guía está en
`references/tu-brandkit.md` de cada skill.

## Las 268 plantillas de edición, completas

Desde la v1.59.0 el plugin trae todos los motores del catálogo de plantillas (`plantillas-edicion-f100k`):
Auto-Edición, notitas, motion recortada, cubitos 3D, collage, pizarra, listas, telenovela y los 66 estilos
de cine. Dices «edita mi video con la plantilla …» y funciona sin instalar nada más.

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
- `movimientos-de-venta-f100k` — Los 7 movimientos de venta: diagnóstico, plan de 30 días y las piezas de la semana 1 («Arranca mis 7 movimientos»)
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
- `plantillas-edicion-f100k` — Catálogo único de 248 plantillas de edición (con 66 estilos de cine): dices «edita mi video con la plantilla «Pantalla dividida»» y sabe qué skill la hace, qué material pedir y cómo instalarla si falta
- `reel-lista-maquetas-f100k` — Reel faceless de lista con voz: titular con la clave en color, una maqueta plana de pantalla por ítem y la barra «07/27 · CATEGORÍA»; render local gratis
- `edicion-girlie-f100k` — Edición nativa de TikTok: una palabra a la vez arriba de tu cabeza, pruebas reales y, en cada chiste, un meme, una nota a mano o un zoom seco; sello para tus series; render local gratis
- `telenovela-explicada-f100k` — Telenovela para explicar sin salir a cámara: frutas 3D que dialogan con tutoriales animados de la app, o la historia real en collage documental con fotos y documentos; corta en el punto más silencioso
- `expediente-inteligencia-f100k` — Reel sin cara de un caso real de negocio como noticiero en blanco y negro con HUD: fotos y capturas reales, mira en la cara, etiquetas que cuelgan de lo que nombran, cifra que cuenta y revisión automática de cuadros; render local gratis
- `avatar-mini-tele-f100k` — Reel sin cara en Blender: tu avatar 3D con volumen y textura explica abajo y una mini tele retro cambia de canal con cada frase (trama de puntos, tarjeta de la app, palabra clave enorme y tu CTA tecleándose); render local gratis
- `cuento-dibujado-f100k` — Cuento dibujado: Un cuento infantil dibujado cuadro a cuadro: el mundo empieza gris y con lluvia, un solo objeto tiene color, se enciende y el color vuelve en una ola que nace de él. Cierra con tu palabra de CTA escrita a mano; render local gratis con código
- `pizarra-negra-tiza-f100k` — Pizarra negra: Una parábola con un monigote de tiza que se dibuja trazo a trazo sobre pizarra negra, con un medidor de malo a bueno cuya aguja se mueve con la historia. Al final el borrador limpia el rótulo y se escribe tu palabra de CTA; render local gratis con código
- `ensayo-palitos-f100k` — Ensayo de palitos: Monigotes de palito en papel blanco, con plumón que tiembla apenas y relleno de lápiz de color. Las caras y las poses cambian con corte seco, un cartel y un globo cuentan una situación que tu cliente conoce, y un remate rojo gordo cierra el chiste antes de tu palabra de CTA; render local gratis con código
- `galeria-animaciones-f100k` — Galería de animaciones: Una ventana de chat oscura: a la izquierda, una vista previa que cambia cada medio segundo con tus fotos reales o una mini animación; a la derecha, una lista numerada con contador que avanza con corte seco. Arriba, un título con la palabra enorme en tu color, y al final tu palabra de CTA; render local gratis con código
- `noticia-escandalo-f100k` — Noticia de escándalo: Recortes de papel sobre un cielo azul noche: un detalle absurdo y chiquito se marca con plumón y un óvalo rojo, la cámara baja hasta el titular de la caída, entra un sello rojo y un hilo une lo chico con lo grande. Cierra con tu palabra tecleándose en una nota; render local gratis con código
- `infografia-blanca-f100k` — Infografía blanca: Fondo crema, tarjetas de cartón con borde negro grueso y un solo color de acento. La cámara recorre 4 pantallas de la app en una sola toma, cada una se arma a la vista, y una barra arriba marca en qué parte vas. Cierra con tu palabra tecleándose en un comentario; Blender por código, render local gratis
- `plano-del-sistema-f100k` — Plano del sistema: Un plano azul tipo blueprint sobre una mesa de madera se dibuja solo con tus 4 pasos; la cámara se mete por una trampilla a la sala donde una máquina 3D se arma, recibe la idea y saca las piezas por una cinta, y vuelve a subir para tu palabra de CTA; Blender por código, render local gratis
- `linea-dorada-f100k` — Línea dorada: Una sola línea de luz dorada se dibuja sola sobre negro y se transforma, sin cortes, en una figura por frase (luna, equipo, foco, celular, regalo…), con polvo dorado, piso que la refleja y la clave enorme en dorado arriba; Blender por código, render local gratis
- `explicacion-blanco-negro-f100k` — Explicación en blanco y negro: Un solo plano secuencia en línea blanca fina sobre negro: una idea se arma, de ella nacen pantallas mientras la cifra sube, y al final el globo se abre y el fondo pasa a blanco para tu CTA; Blender por código, render local gratis
- `objetos-3d-minimal-f100k` — Objetos 3D minimalistas: Una sola toma que viaja por 4 mundos en miniatura sobre pedestales, con luz cálida, fondo desenfocado y letra de máquina de escribir: un escritorio que se enciende, una claqueta que suelta videos, una cinta que los fabrica y una caja que se abre con tu palabra; Blender por código, render local gratis
- `monigotes-oscuros-f100k` — Monigotes oscuros: Siluetas negras de palitos con ojos que brillan en un paisaje nocturno de cine, con luna, niebla y sierras. En una sola toma continua, uno empuja solo una roca cuesta arriba hasta que llega su equipo desde la niebla, y tu palabra de CTA cierra en tu color; Blender por código, render local gratis
- `animacion-ascii-f100k` — Animación ASCII: Una escena 3D real hecha de caracteres verdes sobre negro, como un monitor antiguo: asistentes trabajando de noche y una pared de pantallas que se prenden. Los textos se teclean solos y la palabra clave aparece enorme armada con bloques; Blender por código, render local gratis
- `isometrico-f100k` — Isométrico: Tu proceso en 4 pasos como una maqueta 3D vista en isométrico: cada módulo se arma en pantalla y un cable con un paquete de luz lleva lo que sale de un paso al siguiente. La cámara recorre las 4 estaciones y cierra sobre tu CTA pintado en el piso; Blender por código, render local gratis
- `efecto-domino-f100k` — Efecto dominó: Cientos de fichas de dominó con física real caen en cadena por una serpentina sobre una mesa de madera, y tus frases aparecen justo cuando pasa la ola. Al final, las últimas fichas, al caer, escriben tu palabra de CTA; Blender por código, render local gratis
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
- `seguridad-tu-app-f100k` — Revisa, arregla y PRUEBA la seguridad de tu app antes de publicarla (27 controles, solo los que aplican a tu tipo de app) y te deja un informe en palabras simples
- `agente-whatsapp-f100k` — Agente de IA en el WhatsApp de tu negocio que conversa, recuerda y agenda en Cal.com, solo por la API oficial de Meta (para que no te baneen el número)
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
