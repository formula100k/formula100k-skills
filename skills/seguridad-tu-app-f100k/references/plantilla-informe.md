# Plantilla del informe final

Guárdalo en la carpeta del proyecto como `INFORME-SEGURIDAD.md`. Reglas para llenarlo:

- Lenguaje de alumna: el término técnico va entre paréntesis, nunca solo.
- Nunca una llave completa: solo inicio y final (`sk_live_…a9F2`).
- Cada fila de la tabla tiene su prueba. Sin prueba, el estado es "No verificado".
- El termómetro cuenta solo los controles que aplican. "Lo cubre tu proveedor" cuenta como
  cumplido si su prueba pasó.
- Si el repo es público y el informe dice dónde estuvo una llave, avísale antes de subirlo.

---

```markdown
# Informe de seguridad · [Nombre de la app]

**Fecha:** [AAAA-MM-DD] · **Revisé:** [carpeta] · [URL o "aún sin publicar"]
**Tipo de app:** [un solo HTML / Next.js en Vercel / + Supabase / + Stripe / + login / + archivos / + IA]

## En 3 líneas

1. [Cómo estaba: ej. "Tu app tenía 2 puertas abiertas urgentes: la llave de la IA se veía en el navegador y cualquiera podía leer los pedidos de otras personas."]
2. [Qué se hizo: ej. "Las cerramos las dos y agregamos el portero que frena los intentos masivos."]
3. [Qué falta: ej. "Te queda un paso a mano: cambiar la llave vieja en el panel de tu proveedor (5 minutos)."]

## Termómetro

**[X] de [N] controles que aplican, cumplidos.**  ([M] no aplican a tu tipo de app.)

`[■■■■■■■■□□]` [X/N]

| Antes | Después |
|---|---|
| 🔴 [n] · 🟡 [n] · 🔵 [n] | 🔴 [n] · 🟡 [n] · 🔵 [n] |

## Lo que encontré, lo que arreglé y cómo lo comprobé

| # | Gravedad | Lo que encontré | Lo que hice | Cómo lo comprobé | Estado |
|---|---|---|---|---|---|
| 05 | 🔴 | La llave secreta de la IA estaba dentro del código que ve el navegador (`app/page.tsx:12`). | La moví a la caja fuerte del servidor y la app ahora le pregunta a su propio servidor. Commit `a1b2c3d`. | Busqué la llave en todo lo que se publica: 0 resultados. En la pestaña Red ninguna petición va directo a la IA. | ✅ Arreglado |
| 09 | 🔴 | [hallazgo] | [arreglo + commit] | [comando/acción → resultado] | ✅ Arreglado |
| 13 | 🟡 | [hallazgo] | [arreglo + commit] | [31 peticiones seguidas → apareció un 429 en la número N] | ✅ Arreglado |
| 16 | 🔵 | [hallazgo] | — | — | ⏸️ Lo dejamos para después (decisión tuya) |
| [#] | [ ] | [hallazgo] | [arreglo] | [prueba] | ✅ Arreglado / ⏳ Falta un paso tuyo / ⏸️ Pospuesto / ❓ No verificado |

## Lo que tienes que hacer tú (a mano)

Son cosas que solo puede hacer la dueña de la cuenta. Avísame cuando termines cada una y lo compruebo.

- [ ] **Cambia tu llave de [proveedor]** (la vieja estuvo a la vista). Dónde: [panel → menú → botón, ej. "Dashboard → Developers → API keys → Roll key"]. Después pégame la nueva solo a mí, una vez, y yo la guardo en la caja fuerte.
- [ ] **[Activa la confirmación de correo en tu login]**. Dónde: [Supabase → Authentication → …].
- [ ] **[Pasa tu repositorio a privado]** si no necesitas que sea público. Dónde: GitHub → Settings → General → Danger Zone → Change visibility.
- [ ] **Revisa el gasto de los últimos días** en [proveedor] por si alguien usó la llave vieja.

## Controles que no aplican a tu app (y por qué)

| # | Control | Por qué no aplica |
|---|---|---|
| 02 | Contraseñas revueltas | Tu app no tiene cuentas ni contraseñas. |
| 09 | Cada quien ve solo lo suyo | Tu app no guarda datos fuera del teléfono de cada persona. |
| [#] | [control] | [una frase] |

## Lo que no pude comprobar

- [ej. "Control 04: no esperé a que el enlace caducara. La configuración dice 1 hora; pruébalo mañana con un enlace viejo."]
- [Si no hay nada: "Todo lo que aplica quedó comprobado."]

## Cambios hechos (commits)

| Commit | Qué cambió |
|---|---|
| `[hash]` | seguridad: [descripción corta] |

## Antes de publicar

- [ ] Los arreglos están desplegados (solo con tu OK). URL revisada: [URL]
- [ ] Prueba final de afuera sin ❌: `node scripts/probar-protecciones.mjs [URL]`
- [ ] Tu app abre y hace lo principal igual que antes.

> Cuándo repetir esta revisión: cuando agregues login, cobros, subida de archivos o una IA nueva,
> o antes de mandar la app a mucha gente.
```
