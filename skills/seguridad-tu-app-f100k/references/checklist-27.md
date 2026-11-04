# Checklist de 27 controles

Cada control tiene cinco partes: **qué es** (en una frase para la alumna), **aplica si**,
**cómo se revisa**, **cómo se arregla** y **cómo se prueba**. Un control sin prueba que pase no
cuenta como cumplido.

Gravedad sugerida por defecto (ajústala según lo que encuentres): 🔴 urgente · 🟡 importante ·
🔵 buena práctica.

## Antes de empezar: comandos que funcionan en Mac y en Windows

- **Buscar en el código:** usa la herramienta de búsqueda de Claude Code (Grep) con los patrones
  de abajo. En terminal, el equivalente que funciona igual en los dos sistemas es
  `git grep -nE "patrón"` (si la carpeta es un repositorio git).
- **curl:** en Mac y Linux es `curl`. En Windows usa **`curl.exe`** (en PowerShell, `curl` a secas
  es otro comando que responde distinto). Viene incluido en Windows 10 y 11.
- **Pruebas de afuera sin curl:** `node scripts/probar-protecciones.mjs <tu-url>` (solo pide Node,
  igual en los dos sistemas). Opciones: `--portero /api/ruta` y `--n 31` para el control 13.
- **Placeholders:** `<tu-app>` es tu dirección (ej. `https://mi-app.vercel.app`), `<proyecto>` el
  identificador de tu proyecto de Supabase.
- **Solo sobre tu propia app.** Todas estas pruebas son para la URL y el código de quien pide la
  revisión.

---

## Mapa de aplicación

✅ aplica · ➖ no aplica · 🛡️ lo cubre tu proveedor (igual se prueba) · ⚪ solo si la app tiene
eso (login, cobros, archivos…)

| # | Control | Un solo HTML | HTML + Supabase desde el navegador | Next.js sin base de datos (ej. llama a una IA) | Next.js + Supabase / login |
|---|---|---|---|---|---|
| 01 | Login bien configurado | ➖ | ⚪ | ➖ | ✅ |
| 02 | Contraseñas revueltas | ➖ | 🛡️ | ➖ | 🛡️ / ✅ si es login propio |
| 03 | Panel de admin con candado | ➖ | ⚪ | ⚪ | ⚪ |
| 04 | Enlaces de recuperación que caducan | ➖ | 🛡️ | ➖ | 🛡️ / ✅ si es propio |
| 05 | Llaves secretas fuera del navegador | ✅ | ✅ | ✅ | ✅ |
| 06 | Lo público vs. lo secreto | ➖ (salvo que haya llaves) | ✅ | ✅ | ✅ |
| 07 | Llaves en el historial de git | ⚪ si hay git | ⚪ | ⚪ | ⚪ |
| 08 | Rotar llaves comprometidas | ⚪ si 05 o 07 fallan | ⚪ | ⚪ | ⚪ |
| 09 | Cada quien ve solo lo suyo | ➖ | ✅ (crítico) | ➖ | ✅ (crítico) |
| 10 | Consultas seguras (inyección SQL) | ➖ | ✅ (filtros) | ➖ | ✅ |
| 11 | Precios y pagos en el servidor | ⚪ enlace de pago | ⚪ | ⚪ | ⚪ |
| 12 | Siempre con candado (HTTPS) | 🛡️ | 🛡️ | 🛡️ | 🛡️ |
| 13 | El portero (límite de peticiones) | ➖ | 🛡️ / ✅ | ✅ (si llama a una IA) | ✅ |
| 14 | Webs permitidas (CORS) | ➖ | ➖ | ✅ si tiene `/api` | ✅ |
| 15 | Archivos expuestos | ✅ | ✅ | ✅ | ✅ |
| 16 | Cabeceras de seguridad | ✅ | ✅ | ✅ | ✅ |
| 17 | Código colado en pantalla (XSS) | ⚪ si muestra texto de la usuaria o de la IA | ✅ | ✅ | ✅ |
| 18 | Cookies de sesión seguras | ➖ | ➖ (usa el almacenamiento del navegador) | ⚪ | ✅ |
| 19 | Clics falsos desde otra web (CSRF) | ➖ | ➖ | ⚪ | ✅ |
| 20 | Formularios revisados en el servidor | ➖ | ✅ (vía reglas de la base) | ✅ | ✅ |
| 21 | Archivos subidos: tipo y tamaño | ➖ | ⚪ | ⚪ | ⚪ |
| 22 | Dependencias con fallas conocidas | ✅ (scripts de CDN) | ✅ | ✅ | ✅ |
| 23 | Paquetes que sobran | ➖ | ➖ | ✅ | ✅ |
| 24 | Registro de actividad sospechosa | ➖ | 🛡️ | ✅ | ✅ |
| 25 | Modo depuración apagado | ⚪ | ⚪ | ✅ | ✅ |
| 26 | Revisión a fondo | ✅ | ✅ | ✅ | ✅ |
| 27 | Prueba final e informe | ✅ | ✅ | ✅ | ✅ |

**Sobre el HTML suelto:** si no guarda datos fuera del dispositivo, no tiene login y no lleva
llaves, es de lo más seguro que existe. Lo que guarda en `localStorage` vive solo en el navegador
de cada persona. No recomiendes migrar a Next.js "por seguridad".

---

# ACCESO

## 01 · Login bien configurado 🔴

- **Qué es:** que solo entre quien tiene cuenta, y que tu app lo compruebe en el servidor, no solo
  escondiendo botones.
- **Aplica si:** la app tiene cuentas de usuaria o páginas privadas.
- **Cómo se revisa:**
  - ¿Usa un proveedor probado (Supabase Auth, Clerk, Auth.js) o un login hecho a mano? Hecho a mano
    = 🟡 como mínimo.
  - Busca páginas y rutas privadas que solo se protegen en el navegador:
    `"use client"` + `if (!user) return null` sin chequeo del lado del servidor.
  - En Supabase, el código del servidor debe validar la sesión con `supabase.auth.getUser()` (o
    `getClaims()`), no confiar en `getSession()`. Patrón: `getSession\(` dentro de `app/**/route.ts`,
    `middleware.ts`/`proxy.ts` o Server Actions.
  - Lista todas las rutas de servidor (`app/**/route.ts`, archivos con `"use server"`) y anota cuáles
    no piden sesión. Cada una pública tiene que tener un motivo.
  - En el panel de Supabase: Authentication → confirmar correo activado.
- **Cómo se arregla:** chequeo de sesión en el servidor (en `middleware.ts`/`proxy.ts` para las
  páginas y dentro de cada route handler o Server Action para los datos), respondiendo 401 si no
  hay usuaria. Usar el proveedor, no inventar el login.
- **Cómo se prueba:**
  1. Ventana de incógnito → abre `<tu-app>/panel` (o la página privada) → te manda al login.
  2. `curl -s -o /dev/null -w "%{http_code}" <tu-app>/api/<ruta-privada>` → **401** (o 403), nunca 200.
- **Doc:** https://supabase.com/docs/guides/auth/server-side/nextjs ·
  https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

## 02 · Contraseñas revueltas (hash) 🔴

- **Qué es:** las contraseñas se guardan revueltas de una forma que no se puede deshacer; ni tú
  puedes leerlas.
- **Aplica si:** la app guarda contraseñas ella misma. Si usa Supabase Auth, Clerk o Auth.js con
  proveedor: 🛡️ lo cubre el proveedor.
- **Cómo se revisa:** busca `password` en el esquema (`schema.sql`, migraciones) y en los
  `insert`/`update`. Busca `md5(`, `sha1(`, `sha256(` cerca de `password`. Mira si existe `argon2` o
  `bcrypt` en `package.json`.
- **Cómo se arregla:** lo mejor es pasar el login a un proveedor. Si se queda propio: `argon2id`
  (`@node-rs/argon2`) o `bcrypt` (`bcryptjs`), nunca md5/sha a secas. Las contraseñas viejas se
  rehacen en el siguiente inicio de sesión (sin borrar cuentas).
- **Cómo se prueba:** crea una cuenta de prueba y mira su fila en la base: no existe columna de
  contraseña (la tiene el proveedor) **o** el valor empieza con `$argon2id$` o `$2a$`/`$2b$`.
  Nunca la contraseña legible.
- **Doc:** https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

## 03 · Panel de admin con candado (rol) 🔴

- **Qué es:** las páginas de administradora solo abren para la administradora, y el servidor lo
  comprueba.
- **Aplica si:** hay `/admin`, un panel, o acciones que solo la dueña debería hacer.
- **Cómo se revisa:**
  - ¿Dónde vive el rol? Patrón de alarma: `user_metadata.*role` o `user_metadata.*admin` (en
    Supabase, la usuaria puede editar su propio `user_metadata`). Correcto: `app_metadata` o una
    tabla `profiles.role` que la usuaria no puede modificar.
  - ¿Las rutas `/api/admin/*` o las Server Actions de admin comprueban el rol en el servidor, o solo
    se esconde el botón?
  - ¿Hay un correo de admin escrito en el código del navegador? (no es grave, pero el chequeo tiene
    que estar en el servidor).
- **Cómo se arregla:** rol en `app_metadata` o en una tabla protegida por políticas; chequeo de rol
  en `middleware.ts`/`proxy.ts` y dentro de cada acción de admin; 403 si no es admin.
- **Cómo se prueba:**
  1. Con una cuenta normal de prueba: abre `<tu-app>/admin` → te devuelve o muestra "no tienes
     acceso".
  2. Con la sesión de esa cuenta, llama a una ruta de admin → **403**.
  3. Supabase: con el token de la cuenta normal intenta cambiarse el rol:
     `curl -X PATCH "https://<proyecto>.supabase.co/rest/v1/profiles?id=eq.<su-id>" -H "apikey: <llave-publica>" -H "Authorization: Bearer <token-cuenta-normal>" -H "Content-Type: application/json" -d "{\"role\":\"admin\"}"`
     → error o 0 filas cambiadas.
- **Doc:** https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac

## 04 · Enlaces de recuperación que caducan 🟡

- **Qué es:** el enlace de "olvidé mi contraseña" sirve una sola vez y por poco tiempo.
- **Aplica si:** hay recuperación de contraseña o enlaces mágicos. Con Supabase Auth: 🛡️, pero
  revisa la configuración.
- **Cómo se revisa:** Supabase → Authentication → configuración del proveedor de correo → caducidad
  del código o enlace (OTP expiration). Si es propio: busca la tabla de tokens y si tiene
  `expires_at` y `used_at`, y si el token sale de `crypto.randomBytes`/`crypto.randomUUID` (no de
  `Math.random`).
- **Cómo se arregla:** caducidad corta (una hora o menos es una práctica común), un solo uso,
  token aleatorio guardado revuelto, y la misma respuesta exista o no el correo ("si tu correo está
  registrado, te llegará un enlace").
- **Cómo se prueba:**
  1. Pide un enlace, úsalo, vuelve a abrirlo → la segunda vez **falla**.
  2. Pide recuperación con un correo que no existe → el mensaje es **idéntico** al de uno que sí.
  3. (Si se puede esperar) abre un enlace pasada su caducidad → falla.
- **Doc:** https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html

---

# SECRETOS

## 05 · La llave secreta que nunca debe ver el navegador 🔴

- **Qué es:** las llaves de IA, de cobros o de administración de la base viven solo en el servidor.
  Todo lo que llega al navegador lo puede leer cualquiera con clic derecho → "Ver código fuente".
- **Aplica si:** siempre. En un HTML suelto, cualquier llave dentro del archivo es pública.
- **Cómo se revisa:**
  - Patrones en el código **y** en lo que se publica (el HTML, la carpeta `.next/static` después de
    `npm run build`, `dist/`):
    `sk-ant-` (Anthropic) · `sk-proj-|sk-[A-Za-z0-9]{20,}` (OpenAI) · `AIza[0-9A-Za-z_-]{35}`
    (Google; ojo: la llave web de Firebase también empieza así y es pública por diseño, confirma
    cuál es) · `sk_live_|rk_live_` (Stripe secreta) · `whsec_` (firma de webhooks) ·
    `service_role|sb_secret_` (Supabase admin) · `re_[A-Za-z0-9]{20,}` (Resend) ·
    `-----BEGIN .*PRIVATE KEY`.
  - Llamadas a APIs de IA desde el navegador: `fetch\(['"]https://api\.(anthropic|openai)\.com` o
    `generativelanguage.googleapis.com` en archivos con `"use client"` o dentro de un `<script>`.
  - Llaves de servidor importadas en componentes de navegador: `process.env.(?!NEXT_PUBLIC_)` en un
    archivo con `"use client"`.
- **Cómo se arregla:** la llave va a la caja fuerte (`.env.local` en tu computadora y Vercel → Settings →
  Environment Variables), y la llamada se hace desde el servidor (`app/api/<algo>/route.ts` o una
  Server Action). El navegador solo habla con tu ruta, nunca con la IA directamente. En un HTML
  suelto: se crea una función de servidor en Vercel (carpeta `api/`) y el HTML la llama; pide OK
  porque cambia el tipo de app. **Si la llave ya estuvo publicada: control 08 (rotarla) va primero.**
- **Cómo se prueba:**
  1. `npm run build` y busca los patrones en `.next/static` → **0 resultados**
     (`git grep` no sirve ahí porque esa carpeta está ignorada; usa la herramienta Grep de Claude Code
     sobre `.next/static`).
  2. En la app publicada: Ver código fuente y DevTools → pestaña Red (Network) → ninguna petición va
     directo a `api.anthropic.com`/`api.openai.com`, y ninguna respuesta contiene la llave.
- **Doc:** https://nextjs.org/docs/app/guides/environment-variables ·
  https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

## 06 · Lo público vs. lo secreto (la caja fuerte) 🔴

- **Qué es:** saber qué llaves pueden ser públicas y cuáles no, y que ninguna secreta lleve la
  etiqueta que la vuelve pública.
- **Aplica si:** la app tiene `.env*` o variables en Vercel.
- **Cómo se revisa:**
  - `NEXT_PUBLIC_` (y `VITE_` en Vite) **mete el valor en el código del navegador**. Patrón de alarma:
    `NEXT_PUBLIC_[A-Z_]*(SECRET|SERVICE|PRIVATE|OPENAI|ANTHROPIC|GEMINI|STRIPE_SECRET|WEBHOOK)`.
  - Públicas por diseño (están bien con `NEXT_PUBLIC_`): la URL de Supabase, su llave pública
    (`anon` o `sb_publishable_`), la llave publicable de Stripe (`pk_`). La seguridad de la
    llave pública de Supabase depende del control 09.
  - ¿`.env*` está en `.gitignore`? `git ls-files` y busca `.env` en la lista → no debe aparecer
    ninguno (salvo `.env.example` sin valores reales).
  - ¿Las variables de Vercel están en el entorno correcto (Production / Preview)?
- **Cómo se arregla:** renombrar la variable sin `NEXT_PUBLIC_` y mover su uso al servidor;
  `.env*` (con excepción `!.env.example`) en `.gitignore`; `git rm --cached .env.local` si quedó
  trackeado (no borra tu archivo local; **y la llave se rota, control 08**). En Vercel, cambiar
  variables exige volver a desplegar para que tome el valor.
- **Cómo se prueba:** `git ls-files` → sin `.env` con valores · búsqueda del patrón de alarma → 0 ·
  después del build, los valores secretos no aparecen en `.next/static` (misma prueba que 05).
- **Doc:** https://vercel.com/docs/environment-variables ·
  https://supabase.com/docs/guides/api/api-keys

## 07 · Llaves olvidadas en el historial de git 🔴 si el repo es público

- **Qué es:** aunque borres una llave hoy, git guarda todas las versiones anteriores. Si el repo está
  en GitHub público, cualquiera puede leerlas.
- **Aplica si:** la carpeta tiene `.git/`.
- **Cómo se revisa:**
  - Commits que tocaron archivos `.env`: `git log --all --oneline -- .env .env.local .env.production`
  - Commits que agregaron o quitaron texto con forma de llave (funciona en Mac y Windows):
    `git log --all --oneline -G "sk-ant-|sk-proj-|sk_live_|rk_live_|whsec_|service_role|sb_secret_|BEGIN .*PRIVATE KEY"`
    y luego `git show <commit>` para ver cuál fue (no pegues la llave en el chat).
  - Si está instalado, `gitleaks git -v` (en versiones viejas `gitleaks detect -v`). Mac:
    `brew install gitleaks`. Windows: descarga el ejecutable desde
    https://github.com/gitleaks/gitleaks/releases.
  - ¿El repo es público? `gh repo view --json visibility` si tiene la CLI de GitHub; si no, pregúntale.
- **Cómo se arregla:** **primero rotar** (control 08): una llave que estuvo en un repo público se da
  por robada. Limpiar el historial (`git filter-repo` o BFG) es **opcional**, reescribe la historia,
  obliga a forzar el push y solo se hace con permiso explícito. Si el repo no necesita ser público,
  ofrécele pasarlo a privado (GitHub → Settings → General → Danger Zone → Change visibility).
- **Cómo se prueba:** la llave vieja ya no funciona (una llamada de prueba con ella da 401) y la app
  funciona con la nueva. Si se limpió el historial: el comando `git log --all -G ...` de arriba → 0
  commits.
- **Doc:** https://docs.github.com/es/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

## 08 · Cambiar la cerradura: rotar llaves comprometidas 🔴

- **Qué es:** si una llave estuvo a la vista, se crea una nueva y se apaga la vieja. Borrarla del
  código no alcanza: quien la copió la sigue teniendo.
- **Aplica si:** el control 05, 06 o 07 encontró una llave expuesta (aunque haya sido "solo un rato").
- **Cómo se revisa:** lista cada llave expuesta, de qué proveedor es y desde cuándo.
- **Cómo se arregla (lo hace ella; tú la guías).** Los menús cambian de nombre seguido; si no lo
  encuentra, que busque "API keys" en el panel:
  | Proveedor | Dónde está el botón |
  |---|---|
  | Anthropic | Consola de Anthropic (console.anthropic.com) → Settings → API keys → crear una nueva y eliminar la vieja |
  | OpenAI | platform.openai.com/api-keys → crear nueva → revocar la vieja |
  | Google (Gemini) | aistudio.google.com/apikey → crear nueva → eliminar la vieja |
  | Stripe | Dashboard → Developers → API keys → en la llave secreta, "Roll key". Firma de webhook: Developers → Webhooks → el endpoint → "Roll secret" |
  | Supabase (llaves nuevas `sb_secret_`) | Project Settings → API Keys → crear una secret key nueva → cambiarla en la app → borrar la vieja |
  | Supabase (`service_role` antigua) | Project Settings → JWT / API: rotar el secreto cambia también la llave pública y cierra todas las sesiones; avísale antes y considera pasar a las llaves nuevas |
  | Resend | resend.com/api-keys → crear nueva → borrar la vieja |
  | GitHub (token) | Settings → Developer settings → Personal access tokens → borrar y crear otro |

  Después: tú pones la nueva en `.env.local` y en Vercel (Settings → Environment Variables), y con su
  OK se vuelve a desplegar.
- **Cómo se prueba:** una llamada de prueba con la llave **vieja** → rechazada (401/403); la app en
  local y publicada funciona con la **nueva**. Revisa también el panel del proveedor (uso o gasto
  raro en los últimos días) y anótalo en el informe.
- **Doc:** https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

---

# DATOS

## 09 · El candado de tus datos: cada quien ve solo lo suyo 🔴

- **Qué es:** cada usuaria puede leer y cambiar solo sus propias filas. Con Supabase, la llave
  pública está en el navegador a propósito; lo único que protege los datos son estas reglas.
- **Aplica si:** hay base de datos (sobre todo Supabase) con datos de usuarias.
- **Cómo se revisa:**
  - En el editor SQL de Supabase (solo lectura):
    `select tablename, rowsecurity from pg_tables where schemaname = 'public';` → todas en `true`.
    `select tablename, policyname, cmd, qual, with_check from pg_policies where schemaname = 'public';`
    → alarma si una tabla con datos privados tiene `qual = true` para `SELECT` o no tiene políticas
    con `auth.uid()`.
  - Panel de Supabase → Advisors → Security Advisor: anota cada aviso.
  - Storage: ¿los buckets con archivos privados están marcados como públicos?
  - En el código: uso de la llave de administración (`service_role` / `sb_secret_`) en rutas que
    devuelven datos sin filtrar por la usuaria (esa llave se salta las reglas).
- **Cómo se arregla:** `alter table <tabla> enable row level security;` y políticas por dueña
  (`using (auth.uid() = user_id)` y `with check (auth.uid() = user_id)`), en un archivo `.sql` del
  proyecto. Ojo (viene de errores reales): una tabla con reglas activadas y sin política **falla en
  silencio** al guardar; define la política de `insert` también. Nunca borres datos para
  "arreglar".
- **Cómo se prueba:**
  1. Sin sesión, con la llave pública:
     `curl "https://<proyecto>.supabase.co/rest/v1/<tabla>?select=*" -H "apikey: <llave-publica>"`
     → `[]` o error, **nunca filas**.
  2. Crea dos cuentas de prueba (A y B). A crea un pedido. Con el token de B
     (DevTools → Application → Local Storage → `sb-<proyecto>-auth-token` → `access_token`):
     `curl "https://<proyecto>.supabase.co/rest/v1/<tabla>?id=eq.<id-del-pedido-de-A>" -H "apikey: <llave-publica>" -H "Authorization: Bearer <token-de-B>"`
     → **`[]`**.
  3. Security Advisor sin avisos de tablas sin reglas.
- **Doc:** https://supabase.com/docs/guides/database/postgres/row-level-security ·
  https://owasp.org/Top10/A01_2021-Broken_Access_Control/

## 10 · Consultas seguras (inyección SQL) 🔴

- **Qué es:** lo que la usuaria escribe nunca se pega dentro de una orden a la base de datos; va
  aparte, como dato.
- **Aplica si:** la app consulta una base de datos.
- **Cómo se revisa:** patrones de alarma:
  `query\(\s*` + "`" + `[^`]*\$\{` (texto armado con `${}` en `pg`) · `\$queryRawUnsafe|\$executeRawUnsafe`
  (Prisma) · `sql\.unsafe\(` · en Supabase, filtros armados con texto de la usuaria:
  `\.or\(\s*` + "`" + `|\.filter\([^)]*\$\{` · `rpc(` que arma SQL dinámico dentro de la función
  (`execute format(` con `%s` en lugar de `%L`/`%I`).
- **Cómo se arregla:** parámetros (`$1`, `$2`), el constructor de consultas (`.eq()`, `.ilike()`
  con el valor como argumento), plantillas etiquetadas seguras (`sql\`... ${valor}\`` de
  postgres.js o Neon sí son seguras), y en funciones SQL `format('%L', valor)`.
- **Cómo se prueba:** en cada buscador o filtro escribe `' OR '1'='1` y luego `%` y `,id.gt.0` →
  sin resultados de más, sin error 500, sin mensajes con nombres de tablas.
- **Doc:** https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html

## 11 · Precios y pagos verificados en el servidor 🔴

- **Qué es:** el precio lo decide tu servidor, nunca el navegador; y el acceso se da solo cuando
  llega el aviso de pago con sello de Stripe.
- **Aplica si:** la app cobra. Con un enlace de pago de Stripe (`buy.stripe.com`) el precio vive en
  Stripe (bien); revisa solo cómo se da el acceso después.
- **Cómo se revisa:**
  - Patrones: `unit_amount|amount|price` leídos de `req.json()`/`formData` del cliente;
    `price_data` armado con valores que vienen del navegador.
  - Ruta del webhook: ¿llama a `stripe.webhooks.constructEvent(...)`? ¿Lee el cuerpo crudo
    (`await req.text()`) en vez de `req.json()`?
  - ¿El acceso se activa en la página de "gracias" (`success_url`) en lugar de en el webhook?
  - ¿Se guarda el `event.id` para no procesar dos veces el mismo aviso?
- **Cómo se arregla:** el navegador manda solo qué producto quiere; el servidor busca el `price_id`
  en su propia lista. Webhook:
  `stripe.webhooks.constructEvent(await req.text(), req.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET)`
  y responde 400 si falla. El acceso se da en el webhook. Trae la doc actual con Context7 antes de
  tocar este código.
- **Cómo se prueba:**
  1. `curl -X POST <tu-app>/api/<ruta-webhook> -H "Content-Type: application/json" -d "{\"type\":\"checkout.session.completed\"}"`
     → **400** (sin firma no pasa).
  2. Cambia el precio en la petición (DevTools o curl con `"amount":1`) → la página de pago de
     Stripe muestra el **precio real**.
  3. Abre la URL de "gracias" sin pagar → **no** da acceso.
  4. Modo prueba: `stripe listen --forward-to localhost:3000/api/<ruta-webhook>` y
     `stripe trigger checkout.session.completed` → 200 y el acceso de prueba se activa.
- **Doc:** https://docs.stripe.com/webhooks#verify-official-libraries ·
  https://docs.stripe.com/payments/checkout

---

# RED

## 12 · Siempre con candado (HTTPS) 🛡️

- **Qué es:** la app siempre abre con el candado del navegador; nadie en el wifi del café puede
  leer lo que viaja.
- **Aplica si:** siempre. Vercel lo pone solo en `*.vercel.app` y en dominios propios.
- **Cómo se revisa:** enlaces o llamadas con `http://` que no sean `localhost`
  (`http://(?!localhost|127\.0\.0\.1)`); dominio propio configurado en Vercel → Settings → Domains.
- **Cómo se arregla:** cambiar los `http://` por `https://`; si hay dominio propio, que esté
  verificado en Vercel.
- **Cómo se prueba:** `curl -s -o /dev/null -w "%{http_code} %{redirect_url}" http://<tu-dominio>/`
  → **301/308** hacia `https://...` (el script lo prueba solo). La consola del navegador no muestra
  avisos de "mixed content".
- **Doc:** https://vercel.com/docs/encryption

## 13 · El portero: límite de peticiones 🟡 (🔴 si la ruta gasta tu saldo de IA)

- **Qué es:** si alguien toca la puerta cientos de veces por minuto (para adivinar contraseñas o
  gastar tu saldo de IA), el portero le dice "espera".
- **Aplica si:** hay login, formularios que mandan correos o rutas que llaman a una IA.
- **Cómo se revisa:** ¿existe `@upstash/ratelimit`, una regla de límite en Vercel Firewall, o algo
  equivalente en las rutas sensibles? Un contador en una variable de memoria **no sirve** en Vercel
  (cada función arranca vacía). Supabase Auth trae límites propios para el login (Authentication →
  Rate Limits).
- **Cómo se arregla:** regla de límite en Vercel Firewall (Project → Firewall → regla con
  límite de peticiones) o `@upstash/ratelimit` con Redis de Upstash (desde el Marketplace de
  Vercel), respondiendo **429** con un mensaje amable ("Muchos intentos, prueba en un minuto").
- **Cómo se prueba:** `node scripts/probar-protecciones.mjs <tu-app> --portero /api/<ruta> --n 31`
  → aparece al menos un **429**. (En la ruta de IA, hazlo con un límite bajo de prueba para no
  gastar saldo, o contra la vista previa.)
- **Doc:** https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting ·
  https://github.com/upstash/ratelimit-js

## 14 · Webs permitidas (CORS) 🟡

- **Qué es:** solo tu propia web puede pedirle datos a tu servidor desde un navegador.
- **Aplica si:** la app tiene rutas `/api`.
- **Cómo se revisa:** `Access-Control-Allow-Origin` · `origin:\s*['"]\*` · `cors\(\)` sin opciones ·
  cabeceras en `next.config`/`vercel.json`. Alarma máxima: que devuelva el origen que le llegue
  junto con `Access-Control-Allow-Credentials: true`.
- **Cómo se arregla:** quitar el `*`; si otra web propia necesita acceso, lista explícita de
  dominios. Next.js sin configuración ya es "solo mi web".
- **Cómo se prueba:**
  `curl -s -I -H "Origin: https://otra-web.example" <tu-app>/api/<ruta>`
  → **no** aparece `access-control-allow-origin: https://otra-web.example` ni `*` en rutas con datos
  privados (el script lo prueba en la portada).
- **Doc:** https://developer.mozilla.org/es/docs/Web/HTTP/CORS

## 15 · Archivos que no deberían verse 🔴

- **Qué es:** al publicar una carpeta, TODO lo que hay en ella queda en internet: tu `.env`, copias
  viejas, notas, la carpeta `.git`, mapas del código.
- **Aplica si:** siempre (sobre todo al publicar un HTML arrastrando la carpeta).
- **Cómo se revisa:** lista lo que hay en la carpeta que se publica (la raíz en un HTML suelto,
  `public/` en Next.js): `.env*`, `*.bak`, `*.old`, `*.zip`, `*.sql`, `*-viejo.html`, `notas*`,
  `.git/`. En Next.js: `productionBrowserSourceMaps: true` en `next.config` (publica tu código
  original).
- **Cómo se arregla:** sacar esos archivos de la carpeta publicada (nunca borrarlos sin preguntar:
  muévelos a otra carpeta), o listarlos en `.vercelignore`. Quitar `productionBrowserSourceMaps`.
- **Cómo se prueba:** `node scripts/probar-protecciones.mjs <tu-app>` → `/.env`, `/.env.local`,
  `/.git/config`, `/.git/HEAD`, copias y `.map` dan **404** (o la página normal, nunca el
  archivo). A mano: `curl -s -o /dev/null -w "%{http_code}" <tu-app>/.env` → **404**.
- **Doc:** https://vercel.com/docs/deployments/vercel-ignore ·
  https://nextjs.org/docs/app/api-reference/config/next-config-js/productionBrowserSourceMaps

---

# NAVEGADOR

## 16 · Cabeceras de seguridad 🔵 (🟡 si hay login)

- **Qué es:** instrucciones que tu app le da al navegador: "no me metas dentro de otra web",
  "no adivines el tipo de archivo", "solo carga scripts de estos lugares".
- **Aplica si:** siempre.
- **Cómo se revisa:** `curl -s -I <tu-app>` (o el script) y mira si están:
  `Strict-Transport-Security` (Vercel suele mandarla), `Content-Security-Policy` (o
  `-Report-Only`), `X-Frame-Options` (o `frame-ancestors` en la CSP), `X-Content-Type-Options:
  nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Cómo se arregla:**
  - Next.js, en `next.config.(js|mjs|ts)`:
    ```js
    const cabeceras = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Si tu app usa la cámara o el micrófono, cambia () por (self) en esos permisos
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
      // Empieza en modo "solo avisar"; cuando no rompa nada, quita "-Report-Only"
      { key: 'Content-Security-Policy-Report-Only', value: "default-src 'self'; img-src 'self' data: https:; frame-ancestors 'none'" },
    ];
    // dentro de la config: async headers() { return [{ source: '/(.*)', headers: cabeceras }]; }
    ```
  - HTML suelto en Vercel, en `vercel.json` junto al `index.html`:
    ```json
    { "headers": [ { "source": "/(.*)", "headers": [
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ] } ] }
    ```
    Una CSP estricta rompe un HTML que usa React + Babel por CDN (necesita `'unsafe-inline'` y
    `'unsafe-eval'`); si la pones, limita al menos los dominios de scripts a los CDN que usa.
- **Cómo se prueba:** `curl -s -I <tu-app>` → aparecen las cabeceras; la app sigue funcionando
  entera (recórrela) y la consola no muestra bloqueos nuevos.
- **Doc:** https://nextjs.org/docs/app/api-reference/config/next-config-js/headers ·
  https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html ·
  https://vercel.com/docs/project-configuration#headers

## 17 · Código colado en pantalla (XSS) 🔴

- **Qué es:** si alguien escribe código en un formulario (o la IA lo devuelve), tu app tiene que
  mostrarlo como texto, no ejecutarlo.
- **Aplica si:** la app muestra algo escrito por una usuaria o generado por una IA.
- **Cómo se revisa:** `dangerouslySetInnerHTML` · `\.innerHTML\s*=` · `insertAdjacentHTML` ·
  `document\.write` · `eval\(` · `rehype-raw` · `marked\(` sin sanitizar · `href=\{` con valores de la
  usuaria (riesgo `javascript:`).
- **Cómo se arregla:** React ya escapa el texto normal; usarlo. En HTML suelto: `textContent` en vez
  de `innerHTML`. Si hace falta HTML (markdown de la IA): sanitizar con DOMPurify. Enlaces de la
  usuaria: aceptar solo `https://`.
- **Cómo se prueba:** en cada campo escribe `<script>alert(1)</script>`, luego
  `<img src=x onerror=alert(1)>` y, en campos de enlace, `javascript:alert(1)` → se ven **como
  texto**, no sale ninguna ventanita. Si hay IA, pídele que responda con ese mismo texto y mira lo
  mismo.
- **Doc:** https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

---

# SESIÓN

## 18 · Cookies de sesión seguras 🟡

- **Qué es:** la "pulsera" que demuestra que iniciaste sesión viaja solo con candado, no la puede
  leer código ajeno y no se manda desde otras webs.
- **Aplica si:** la sesión vive en cookies (Next.js con login).
- **Cómo se revisa:** `cookies\(\)\.set\(|setCookie|serialize\(` y sus opciones. Inicia sesión y
  mira DevTools → Application → Cookies: columnas **Secure**, **HttpOnly**, **SameSite**.
  Excepción conocida: las cookies de `@supabase/ssr` no son HttpOnly porque el navegador las
  necesita; eso es por diseño de Supabase y se compensa con 17 y 16.
- **Cómo se arregla:** en cookies propias:
  `{ httpOnly: true, secure: true, sameSite: 'lax', path: '/' }` y una duración razonable.
- **Cómo se prueba:** DevTools después de iniciar sesión → la cookie de sesión propia tiene Secure ✓,
  HttpOnly ✓, SameSite Lax o Strict. O `curl -s -I` a la ruta que inicia sesión y mira el
  `Set-Cookie`.
- **Doc:** https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

## 19 · Clics falsos desde otra web (CSRF) 🟡

- **Qué es:** que otra página no pueda hacer acciones en tu app (comprar, borrar, cambiar el correo)
  aprovechando que tu usuaria tiene la sesión abierta.
- **Aplica si:** hay sesión en cookies y acciones que cambian cosas.
- **Cómo se revisa:**
  - Rutas `GET` que cambian datos: `export async function GET` que hace `insert|update|delete|upsert`
    → 🔴 (un simple enlace las dispara).
  - Route handlers `POST/PUT/DELETE` con sesión por cookie: ¿comprueban el origen? Las Server
    Actions de Next.js ya comparan el origen con el host; revisa que no se haya abierto
    `serverActions.allowedOrigins` de más.
  - Cookies con `SameSite=None` sin motivo.
- **Cómo se arregla:** nada que cambie datos por `GET`; en route handlers con cookie, rechazar si el
  encabezado `Origin` no es tu dominio (403); `SameSite=Lax` como mínimo.
- **Cómo se prueba:**
  `curl -s -o /dev/null -w "%{http_code}" -X POST <tu-app>/api/<ruta> -H "Origin: https://otra-web.example" -H "Cookie: <cookie-de-sesion-de-prueba>"`
  → **403**. Y la búsqueda de `GET` que cambian datos → 0.
- **Doc:** https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html ·
  https://nextjs.org/docs/app/guides/data-security

---

# ENTRADAS

## 20 · Formularios revisados en el servidor 🟡

- **Qué es:** el servidor revisa lo que le llega (que el correo sea correo, que el número sea número,
  que no traiga una novela), aunque el formulario ya lo revise en pantalla. La revisión de la
  pantalla se puede saltar.
- **Aplica si:** hay formularios o rutas que reciben datos.
- **Cómo se revisa:** cada `route.ts` y Server Action: ¿usa `zod` (u otro validador) antes de
  usar `req.json()`/`formData`? ¿Hay límite de largo? ¿Los campos que no deberían venir del
  navegador (`user_id`, `role`, `price`) se ignoran?
- **Cómo se arregla:** un esquema por ruta (`z.object({...}).strict()`), largo máximo en textos,
  `user_id` siempre sacado de la sesión, respuesta 400 con un mensaje amable.
- **Cómo se prueba:**
  `curl -s -w " %{http_code}" -X POST <tu-app>/api/<ruta> -H "Content-Type: application/json" -d "{\"email\":\"no-es-correo\",\"edad\":\"abc\"}"`
  → **400** con mensaje claro. Con un texto gigante (genera uno con
  `node -e "console.log(JSON.stringify({texto:'a'.repeat(200000)}))"`) → **400 o 413**. Mandar
  `"user_id"` de otra persona → se ignora.
- **Doc:** https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html

## 21 · Archivos subidos: tipo y tamaño 🟡

- **Qué es:** tu app acepta solo los archivos que espera (por ejemplo, fotos de hasta cierto peso),
  y nadie puede subir una página web disfrazada de foto.
- **Aplica si:** hay subida de archivos.
- **Cómo se revisa:** ¿se valida tipo y tamaño en el servidor o solo con `accept=` en el `<input>`?
  En Supabase Storage: bucket → configuración → límite de tamaño y tipos permitidos; ¿el bucket es
  público?; ¿hay políticas de Storage por dueña? ¿Se conserva el nombre original del archivo?
- **Cómo se arregla:** límite de tamaño y lista de tipos en el bucket y en el servidor; nombre nuevo
  aleatorio (`crypto.randomUUID()`); bucket privado con enlaces firmados si los archivos son
  personales; no aceptar `.html` ni `.svg` de usuarias si se van a mostrar en tu dominio.
- **Cómo se prueba:** sube un `prueba.html` renombrado a `prueba.jpg` → **rechazado**; sube uno más
  grande que el límite → **rechazado** con mensaje amable; con la cuenta B intenta abrir o listar
  los archivos de A → **no puede**.
- **Doc:** https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html ·
  https://supabase.com/docs/guides/storage/buckets/fundamentals

---

# DEPENDENCIAS

## 22 · Dependencias con fallas conocidas 🟡

- **Qué es:** las piezas de otros que usa tu app a veces traen fallas conocidas y públicas; se
  actualizan.
- **Aplica si:** siempre. En un HTML suelto, son los scripts de CDN.
- **Cómo se revisa:** `npm audit --omit=dev` (anota altas y críticas). En HTML suelto: scripts con
  `@latest` o sin versión (`unpkg.com/react/` sin `@18.x.y`).
- **Cómo se arregla:** `npm audit fix` (sin `--force`). Si pide subir de versión mayor, avísale y
  pide OK: puede romper cosas. Si la app la hizo `constructor-miniapps-f100k`, Next.js está fijado a propósito en una versión probada; no la
  cambies sin probar el build. En HTML: fijar la versión exacta de cada script de CDN.
- **Cómo se prueba:** `npm audit --omit=dev` → **0 altas y 0 críticas** (o cada una que quede,
  explicada en el informe) **y** `npm run build` pasa. En HTML: búsqueda de `@latest` → 0, y la app
  abre.
- **Doc:** https://docs.npmjs.com/cli/commands/npm-audit ·
  https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/

## 23 · Paquetes que sobran 🔵

- **Qué es:** cada pieza que no usas es una puerta más que vigilar; si sobra, se quita.
- **Aplica si:** hay `package.json`.
- **Cómo se revisa:** `npx depcheck` (o `npx knip`). Confirma cada candidato buscando su nombre en el
  código antes de quitarlo (pueden usarse desde configuración).
- **Cómo se arregla:** `npm uninstall <paquete>`, uno por commit.
- **Cómo se prueba:** `npm run build` pasa, la app abre y el flujo principal funciona;
  `npm ls <paquete>` → vacío.
- **Doc:** https://github.com/depcheck/depcheck · https://knip.dev

---

# VIGILANCIA

## 24 · Registro de actividad sospechosa 🔵

- **Qué es:** tu app anota los intentos raros (muchos logins fallidos, accesos prohibidos, avisos de
  pago falsos) para que puedas verlos.
- **Aplica si:** hay servidor (Next.js) o login.
- **Cómo se revisa:** ¿las rutas registran los 401/403/429 y los webhooks rechazados? ¿Se registra
  algo que NO debería (contraseñas, tokens, llaves, datos de tarjeta)? Patrón:
  `console\.(log|info)\(.*(password|token|secret|authorization)`.
- **Cómo se arregla:** un `console.warn` con formato fijo (`[seguridad] login-fallido`, ruta, hora,
  sin datos sensibles) en los puntos clave. Se ven en Vercel → Project → Logs y en Supabase → Logs
  (Auth). Avisos por correo o "log drains" son opcionales.
- **Cómo se prueba:** provoca 3 logins fallidos y un 403 con una cuenta de prueba → aparecen en
  Vercel Logs con hora y ruta, **sin** contraseñas ni tokens.
- **Doc:** https://vercel.com/docs/logs ·
  https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

## 25 · Modo depuración apagado 🟡

- **Qué es:** cuando algo falla, la usuaria ve un mensaje amable; los detalles técnicos (rutas,
  nombres de tablas, el error completo) quedan solo en tus registros.
- **Aplica si:** hay servidor; en HTML suelto, solo si imprime datos en la consola.
- **Cómo se revisa:** respuestas que devuelven el error crudo: `error\.message|err\.stack|error:\s*e\b`
  dentro de `Response.json`/`NextResponse.json`; `debug:\s*true`; `console.log` con datos de
  usuarias; variables tipo `DEBUG=true` en Vercel producción. Vista previa de Vercel pública cuando
  no debería (Settings → Deployment Protection).
- **Cómo se arregla:** responder `{ error: 'Algo salió mal, intenta de nuevo' }` con su código y
  registrar el detalle en el servidor; quitar `debug: true`; activar la protección de vistas previas
  si las comparte solo con su equipo.
- **Cómo se prueba:** manda una petición rota a una ruta
  (`curl -s -X POST <tu-app>/api/<ruta> -H "Content-Type: application/json" -d "{roto"`) → mensaje
  genérico, **sin** stack, rutas de archivos ni SQL. Abre `<tu-app>/no-existe` → la página 404
  normal.
- **Doc:** https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html

## 26 · Revisión a fondo: lo que la lista no nombra 🟡

- **Qué es:** una segunda pasada buscando puertas que no están en ninguna lista, propias de cómo se
  construyó tu app.
- **Aplica si:** siempre.
- **Cómo se revisa (además de la skill `security-review` si está disponible):**
  - **Tabla de rutas:** cada `route.ts`, Server Action y función de `api/` con su columna "¿pide
    sesión?" y "¿comprueba que el dato es de esa usuaria?".
  - **Llave de administración en el lugar equivocado:** `service_role|sb_secret_|SUPABASE_SERVICE`
    en archivos con `"use client"` o en rutas que no filtran por la usuaria.
  - **Redirecciones abiertas:** `redirect\(.*(searchParams|query)` o `?next=` sin validar.
  - **Números adivinables:** URLs públicas tipo `/factura/123` que se pueden recorrer cambiando el
    número.
  - **El servidor visita enlaces que da la usuaria** (apps de "analiza mi web"): `fetch\(.*(url|link)`
    con valor de la usuaria, sin bloquear direcciones internas (`localhost`, `127.`, `10.`,
    `192.168.`, `169.254.`).
  - **Código que ejecuta texto:** `eval\(|new Function\(`.
  - **IA que hace acciones** (manda correos, borra, publica): ¿pide confirmación humana? ¿Una
    instrucción escondida en un texto podría hacerla actuar?
  - **Ruta de IA sin login ni portero:** cualquiera puede gastar tu saldo (cruza con 13).
- **Cómo se arregla:** según el hallazgo; cada uno entra a la tabla del informe con su propia prueba.
- **Cómo se prueba:** la tabla de rutas sin filas "pública sin motivo"; cada hallazgo con su prueba
  propia (ej. `<tu-app>/login?next=https://otra-web.example` → después del login te quedas en tu
  app; pedir `http://169.254.169.254` a la función que visita enlaces → rechazado).
- **Doc:** https://owasp.org/www-project-top-ten/ ·
  https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html ·
  https://nextjs.org/docs/app/guides/data-security

## 27 · Prueba final e informe 🔵

- **Qué es:** al final se repiten todas las pruebas juntas, sobre la versión que se va a publicar,
  y se entrega el informe.
- **Aplica si:** siempre.
- **Cómo se revisa:** que cada control que aplica tenga su prueba guardada (comando + respuesta o
  captura).
- **Cómo se arregla:** lo que falle vuelve al paso de arreglos.
- **Cómo se prueba:** `node scripts/probar-protecciones.mjs <tu-app>` sobre la vista previa o la
  versión publicada (con OK) → **sin ❌** (o cada ❌ explicado en el informe); el informe tiene
  todas las filas con prueba y estado; la app abre y su flujo principal funciona igual que antes.
