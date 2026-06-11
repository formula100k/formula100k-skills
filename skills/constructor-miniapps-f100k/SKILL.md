---
name: constructor-miniapps-f100k
description: >
  Construye mini-apps y herramientas reales sin ser programadora, con la metodología FÓRMULA 100K. Usar SIEMPRE que alguien pida: "constrúyeme una app", "hazme una mini-app", "crea una herramienta", "construye una extensión de Chrome", "hazme un scraper", "una calculadora web", "un generador de X", "un analizador de X", "un quiz que capte correos", "un dashboard", "una app con mi API/IA subsidiada", "un mini-SaaS de suscripción", "clona esta web/app", o cualquier variación que implique construir software (web app, extensión, scraper, calculadora, generador, analizador, lead magnet interactivo, dashboard o SaaS) y desplegarlo en Vercel. Cubre las 20 plantillas del artifact "40 Trucos de Claude + 20 Mini-Apps". NO usar para landings de venta puras (usar landing-producto-formula100k), ni para artifacts educativos HTML de un archivo (usar generador-artifact-educativo-formula100k), ni para diseñar la estrategia del lead magnet (usar cazador-lead-magnets-f100k).
argument-hint: [tipo de app o idea]
disable-model-invocation: false
---

# Constructor de Mini-Apps — FÓRMULA 100K

Convierte una idea en una herramienta real, construida y desplegada, sin que la alumna escriba código. Esta skill decide el stack correcto según el tipo de app, sigue las convenciones probadas de F100K (para que el deploy en Vercel no falle) y deja la app en internet lista para usar.

> Esta skill es el motor de la categoría **🛠️ Crear apps** y de las **20 plantillas de mini-apps** del artifact "40 Trucos de Claude". Cada prompt de ese artifact invoca esta skill por nombre.

---

## Fase 0 — Brief (1 minuto, obligatorio)

Antes de tocar código, confirma en lenguaje natural:

1. **¿Qué hace la app en una frase?** (el resultado para el usuario final)
2. **¿Quién la usa?** ¿La alumna sola, su equipo, o su audiencia (público)?
3. **¿Usa IA?** Si sí: ¿con la API key de la alumna (subsidiada) y acceso por código? → guarda la key SIEMPRE en variable de entorno del servidor, nunca en el cliente.
4. **¿Capta correos / cobra?** (lead magnet, suscripción Stripe, o ninguno)
5. **¿Dónde vive?** Web (Vercel) en la mayoría de casos; extensión de Chrome se carga local.

Si la idea es ambigua o tiene varias piezas grandes (auth + pagos + IA + dashboard), **usa primero `superpowers:brainstorming`** para acordar el diseño, y para apps con lógica delicada apóyate en `superpowers:test-driven-development`. Si es una mini-app simple (calculadora, quiz, generador de un solo paso), construye directo.

---

## Decisión de stack por tipo

| Tipo | Stack | Deploy | Notas |
|------|-------|--------|-------|
| **Calculadora / Quiz simple** (sin backend) | 1 archivo HTML + React + Tailwind por CDN | Abrir con doble clic o subir a Vercel | Idéntico a los artifacts. Cero instalación. Ideal para regalar. |
| **Generador / Analizador con IA** | Next.js (App Router) + Tailwind + Claude API | Vercel | Key en env del servidor. Acceso por código si es para público. |
| **Scraper / Transcriptor** | Next.js + MCP (Apify / Supadata) en el server | Vercel | Nunca scrapear desde el cliente. Manejar cuentas privadas/sin datos. |
| **Dashboard / Swipe file / Tracker** | Next.js + Tailwind + (localStorage → Supabase si multi-dispositivo) | Vercel | Empieza con localStorage; sube a Supabase solo si hace falta persistencia compartida. |
| **Encuesta en vivo / colaborativa** | Next.js + Supabase (realtime) | Vercel | Usa Supabase Realtime para resultados que se actualizan solos. |
| **Lead magnet con captura** | HTML/Next.js + Google Sheet o endpoint | Vercel | Guardar correo en Sheet/Supabase. Mensaje de éxito claro. |
| **Mini-SaaS de suscripción** | Next.js + Supabase (auth + RLS) + Stripe (suscripción + webhook) | Vercel | El más complejo: brainstorming primero, esquema de DB, luego build. |
| **Landing de venta con pago** | → delega en `landing-producto-formula100k` | Vercel | Esta skill no la construye; la deriva. |
| **Extensión de Chrome** | Manifest V3 + JS vanilla + chrome.storage | Cargar descomprimida en chrome://extensions | Sin servidor. README de instalación en 3 pasos. |

---

## Convenciones F100K (evitan que el deploy falle)

Estas reglas vienen de errores reales ya resueltos. Aplícalas siempre en proyectos Next.js:

- **Pin de Next.js a `16.1.7`.** Next `16.2.0` rompe el build en Vercel (`TypeError path undefined` en modifyConfig); local pasa, Vercel no. No uses `latest`.
- **`eslint: "^9"`** en devDependencies.
- **`.gitignore` ANTES del primer commit** (incluye `node_modules`, `.next`, `.env*`). Nunca commitees `node_modules`.
- **Email de commit correcto para Vercel:** usa `161402298+Kissicore@users.noreply.github.com`. Un email no asociado al usuario de GitHub deja el deploy en estado BLOCKED.
- **API keys SIEMPRE en variables de entorno del servidor** (route handlers / server actions). Jamás en el cliente ni en el bundle. En Vercel se configuran en Project → Settings → Environment Variables.
- **Supabase + RLS:** las server actions usan el cliente RLS-aware (anon). Toda tabla que se mute necesita una policy permisiva o el insert/upsert **falla en silencio**. Define las policies en el mismo `schema.sql`.
- **Docs actualizados:** cuando uses una librería o API que cambia rápido (Stripe, Supabase, Next), trae la doc real con **Context7 MCP** antes de programar — no inventes código viejo.
- **next.config:** sin opciones experimentales raras; mantenlo mínimo.

---

## Flujo de construcción

```
1. Brief (Fase 0)            → confirmar qué, para quién, IA/captura/pago, dónde vive
2. (si complejo) brainstorm  → superpowers:brainstorming + diseño aprobado
3. Scaffold                  → según la tabla de stack
4. Construir el core         → la funcionalidad principal primero, lo demás después
5. Conectar IA/datos         → keys en env, MCPs en el server, policies de Supabase
6. Probar local              → npm run dev / cargar extensión / abrir HTML
7. Deploy                    → /vercel:deploy (web) o README de instalación (extensión)
8. Entregar                  → URL + checklist de lo que la alumna debe configurar ella
```

### Scaffold web (Next.js)

```bash
npx create-next-app@latest [nombre] --typescript --tailwind --app --no-src-dir
cd [nombre]
# pin de versiones seguras
npm pkg set dependencies.next=16.1.7
npm pkg set devDependencies.eslint=^9
npm install
```

### Scaffold extensión Chrome (MV3)

Estructura mínima: `manifest.json` (manifest_version 3), `content.js` (inyecta el botón/captura), `popup.html` + `popup.js` (lista + acciones), `background.js` si hace falta. Persistencia con `chrome.storage.local`. Entregar README: 1) ir a `chrome://extensions`, 2) activar modo desarrollador, 3) "Cargar descomprimida" → seleccionar la carpeta.

### Deploy

- Web: usa la skill `/vercel:deploy` (o `vercel --prod`). Verifica que el deploy quede en estado **Ready**, no BLOCKED.
- Confirma que las variables de entorno estén configuradas en Vercel ANTES de marcar como listo.

---

## Skills y MCPs que se combinan

- **`landing-producto-formula100k`** — para la landing de venta con Stripe (plantilla #9). Esta skill la deriva.
- **`cazador-lead-magnets-f100k`** — define la estrategia del lead magnet (el QUÉ); esta skill construye el artefacto (el CÓMO). Plantillas #6 y #1.
- **`generador-artifact-educativo-formula100k`** — si lo que se pide es un recurso educativo HTML de un solo archivo (no una app con backend).
- **`agent-browser`** — para clonar una web/app de referencia (plantilla "clonar una web/app") inspeccionando estructura y estilo.
- **MCPs:** Apify (scraping logueado), Supadata (transcripción), Context7 (docs actualizados al construir), Higgsfield (si la app genera imágenes/video).

---

## Cierre obligatorio (estilo F100K)

Toda mini-app que sirva como lead magnet o producto cierra apuntando a la comunidad: el resultado/CTA final lleva a **FÓRMULA 100K** (o al producto de la alumna). Y al entregar, recuérdale que tiene el ecosistema F100K detrás: +33 skills, su Segundo Cerebro y la Consola de Contenido para potenciar lo que acaba de construir.

## Entregable final

1. La app construida y (si es web) **desplegada con su URL**.
2. **Checklist de configuración** de la alumna: qué env vars poner, cuentas a conectar (Vercel, Stripe, Supabase), códigos de acceso si aplica.
3. Cómo editar el contenido clave (preguntas del quiz, enlaces, precio, códigos) en 1 lugar.
4. Para extensiones: README de instalación en 3 pasos.
