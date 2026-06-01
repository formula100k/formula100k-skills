---
name: landing-producto-formula100k
description: Use when someone asks to build a product landing page, create a sales landing, make a launch page, build a SaaS landing, or create a landing with screenshots, mockups, motion graphics, Stripe checkout, or Vercel deploy.
argument-hint: [nombre del producto]
disable-model-invocation: false
---

# Landing de Producto — FÓRMULA 100K

Flujo completo para construir una landing de venta con mockups CSS → capturas reales → motion graphics → Stripe → deploy en Vercel.

Referencia base: SMMA Bento Landing (`~/Documents/smma-bento-landing`).

---

## Fase 0 — Brief del producto

Antes de escribir código, recopila:

- **Nombre del producto** y URL del app (si ya existe en producción)
- **Pain point principal** → titular del hero
- **3 funcionalidades clave** → secciones Features
- **Precio mensual y anual** → sección Pricing
- **¿Ya hay capturas reales del app?** (sí/no)
- **¿Quiere video demo?** (sí = HyperFrames; no = skip Fase 3)
- **Cuenta Vercel y Stripe** que se van a usar

---

## Fase 1 — Estructura Next.js

### Setup

```bash
npx create-next-app@latest [nombre] --typescript --tailwind --app --no-src-dir
cd [nombre]
npm install stripe
```

### Secciones obligatorias (en orden en `app/page.tsx`)

```tsx
<Navbar />          // sticky, logo + CTA derecha
<HeroSection />     // headline + sub + CTAs + mockup del app
<SocialProofSection /> // logos de clientes o stats clave
<FeaturesSection /> // 3 bloques alternados + mini-grid de 6
<DemoSection />     // video autoplay muted loop
<PricingSection />  // toggle mensual/anual + cards + CTA Stripe
<CtaBanner />       // urgencia final
<Footer />
```

### Paleta estándar (dark indigo — estilo SMMA Bento)

| Token | Valor |
|-------|-------|
| Fondo principal | `bg-black` |
| Superficie card | `bg-[#0E0E14]` |
| Sidebar | `bg-[#0A0A10]` |
| Acento | `indigo-600` / `indigo-400` |
| Borde suave | `border-white/8` a `border-white/10` |
| Texto secundario | `text-gray-400` / `text-gray-600` |

---

## Fase 2 — Mockups CSS → Capturas reales

### Paso 2A — Mockups CSS primero

Construye los visuales de cada Feature como JSX puro (sin imágenes). Esto permite iterar el copy/layout sin depender de capturas.

Estructura típica en `FEATURES` array:

```tsx
{
  tag: 'Pipeline',
  icon: '🎬',
  title: '...',
  desc: '...',
  visual: <div className="space-y-2">...</div>,
}
```

El `visual` es un mini-componente CSS que simula la pantalla del app.

### Paso 2B — Tomar las capturas reales

Capturas desde el app en producción:
- Resolución: **1440×900 @2x** (retina)
- Formato: PNG
- Carpeta destino: `public/screenshots/`
- Nombres sugeridos: `pipeline.png`, `dashboard.png`, `editores.png`, `clientes.png`, `sala.png`, `proyectos.png`, `main.png`

Si hay un script de capturas automáticas, ejecutarlo:
```bash
node scripts/take-screenshots.mjs
```

### Paso 2C — Reemplazar mockups por capturas

**Hero** — dentro del "browser chrome" div:
```tsx
{/* Reemplaza el bloque CSS de sidebar+kanban */}
<img
  src="/screenshots/pipeline.png"
  alt="[Producto] — Pipeline de entregas"
  className="w-full rounded-b-xl object-cover object-top"
  style={{ maxHeight: '480px' }}
/>
```

**Features** — cambiar la propiedad `visual` por `screenshot` + `alt`:
```tsx
{
  tag: 'Pipeline',
  screenshot: '/screenshots/pipeline.png',
  alt: 'Pipeline de [Producto]',
  // ... resto igual
}
```

Y en el render:
```tsx
<div className="rounded-2xl border border-white/10 shadow-xl overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
  <img src={f.screenshot} alt={f.alt} className="w-full object-cover object-top" />
</div>
```

---

## Fase 3 — Motion Graphics con HyperFrames

Aplica el skill `/editor-video-formula100k` o `/hyperframes` para crear la composición de video demo.

### Estructura de escenas recomendada (28s total)

| Escena | Duración | Contenido |
|--------|----------|-----------|
| Intro | 0–5s | Logo + tagline animado |
| Feature 1 | 5–12s | Pipeline / función principal |
| Feature 2 | 12–18s | Equipo / colaboración |
| Feature 3 | 18–24s | Gamificación / resultado |
| CTA | 24–28s | URL + llamado a acción |

### Output

- Archivo: `public/videos/[producto]-demo.mp4`
- Specs: 1920×1080, 30fps, ~2MB
- En `DemoSection.tsx`:

```tsx
<video
  src="/videos/[producto]-demo.mp4"
  autoPlay muted loop playsInline
  className="w-full rounded-xl"
/>
```

---

## Fase 4 — Stripe Checkout

### Variables de entorno (`.env.local`)

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...
APP_URL=https://[app-url]
NEXT_PUBLIC_LANDING_URL=https://REPLACE_ME
NEXT_PUBLIC_PRICE_MONTHLY=20
NEXT_PUBLIC_PRICE_ANNUAL=197
```

### API route (`app/api/checkout/route.ts`)

```ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const { priceId } = await req.json()
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_LANDING_URL}`,
  })
  return NextResponse.json({ url: session.url })
}
```

### Botón CTA en PricingSection

```tsx
async function handleCheckout(isAnnual: boolean) {
  const priceId = isAnnual
    ? process.env.NEXT_PUBLIC_PRICE_ANNUAL
    : process.env.NEXT_PUBLIC_PRICE_MONTHLY
  const res = await fetch('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId }),
  })
  const { url } = await res.json()
  window.location.href = url
}
```

---

## Fase 5 — Deploy a Vercel

### Versiones obligatorias (gotchas conocidos)

| Paquete | Versión correcta | Por qué |
|---------|-----------------|---------|
| `next` | `16.1.7` | 16.2.x rompe builds en Vercel (TypeError path undefined en modifyConfig) |
| `eslint-config-next` | `16.1.7` | Debe coincidir con next |
| `eslint` | `^9` | eslint-config-next@16.x requiere eslint >=9.0.0 |

Actualizar en `package.json` y correr `npm install` antes del commit.

### .gitignore — CRÍTICO

Crear **antes** del primer `git add`:

```
.env
.env.local
.env.*.local
.env.production
node_modules/
.next/
.vercel
```

Si ya hiciste `git add .` sin `.gitignore` y el classifier bloqueó el commit por el `sk_live_`, crea el `.gitignore` primero y vuelve a intentar.

### Secuencia de deploy

```bash
# 1. Verificar build local
npm run build

# 2. Git
git init
git add -A       # .env.local ya está en .gitignore
git commit -m "feat: landing [producto]"

# 3. GitHub (opcional, recomendado)
gh repo create Kissicore/[repo] --private --source=. --push

# 4. Vercel link
vercel link --yes --project [nombre] --scope andreavegabocanegra-5978s-projects

# 5. Env vars en Vercel
printf 'sk_live_...' | vercel env add STRIPE_SECRET_KEY production --yes
printf 'price_...'   | vercel env add STRIPE_PRICE_MONTHLY production --yes
printf 'price_...'   | vercel env add STRIPE_PRICE_ANNUAL production --yes
printf 'https://...' | vercel env add APP_URL production --yes
printf '20'          | vercel env add NEXT_PUBLIC_PRICE_MONTHLY production --yes
printf '197'         | vercel env add NEXT_PUBLIC_PRICE_ANNUAL production --yes

# 6. Deploy
vercel --prod --scope andreavegabocanegra-5978s-projects --yes
```

### Post-deploy — actualizar NEXT_PUBLIC_LANDING_URL

Una vez que Vercel devuelva la URL real:

```bash
printf 'https://[url-real].vercel.app' | vercel env add NEXT_PUBLIC_LANDING_URL production --yes
vercel --prod --scope andreavegabocanegra-5978s-projects --yes
```

---

## Smoke test final

1. Abrir la landing en producción
2. ✅ Video autoplay sin sonido
3. ✅ Toggle mensual/anual cambia precios correctamente
4. ✅ Clic en "Conseguir espacio" → redirige a Stripe Checkout (no completar el pago)
5. ✅ Capturas visibles en Hero y las 3 Features
6. ✅ Sin errores 404 en consola

---

## Notas y gotchas

- **Cuenta Vercel**: siempre `andreavegabocanegra-5978s-projects` (scope obligatorio en CLI)
- **`NEXT_PUBLIC_` vars**: Vercel muestra warning "pueden verse por visitantes" — es normal para precios de display
- **Auto-mode classifier**: puede bloquear `git commit` si hay `sk_live_` en el historial de la sesión. Correr el commit en terminal externa o en nueva sesión de Claude Code
- **Imágenes `<img>` vs `<Image>`**: para capturas locales estáticas usar `<img>` normal es suficiente; `next/image` agrega complejidad innecesaria para una landing
- **Video en Vercel**: si el `.mp4` es >5MB considerar CDN externo (Cloudflare R2 o similar); <5MB va directo en `public/`
