---
name: carrusel-organico-f100k
description: >-
  Crea carruseles ORGÁNICOS estilo "diario / chat": la protagonista a pantalla
  completa con burbujas de texto blancas redondeadas, flecha swipe, dots y
  opcionalmente una tarjeta de "prueba" (captura) con un círculo dibujado a
  mano. Usa fotos reales de la persona (selfies) y, si tiene el conector de
  Higgsfield, puede generar variaciones a partir de esas selfies para que salga
  ELLA en cada slide. Actívala cuando pidan: "carrusel orgánico", "carrusel
  estilo diario / storytime", "carrusel con burbujas de texto sobre mi foto",
  "un carrusel como el de [cuenta] pero con mi cara", "carrusel selfie + texto
  para explicar X". Renderiza slides 1080×1350 en PNG listas para Instagram.
  NO usar para carruseles tipográficos sin foto (usa carrusel-formatos-f100k)
  ni para clonar un estilo ajeno desde captura (usa clonador-carrusel-formula100k).
---

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Antes de producir, búscalo y aplícalo como dice `references/tu-brandkit.md`: basta con que diga «usa mi brandkit» o adjunte su `brandkit.md` o su ZIP, y si no lo dice, búscalo igual (`mi_brandkit` del conector de Yapper, `mi-marca/brandkit.md` del proyecto o `~/Documents/mi-contenido/mi-marca/`). Va encima del estilo de esta skill (colores, letras, gancho, subtítulos, elementos, stickers y CTA), respeta su estructura y no pisa sus reglas de oficio. Al entregar, di en una línea qué aplicaste. Si no hay brandkit, sigue como siempre.

## 🧰 EN TU COMPU (leer antes de seguir: manda sobre lo que diga esta skill más abajo)

Esta skill viaja en el módulo de Carruseles de FÓRMULA 100K y corre igual en Mac y en Windows.

- **Tu marca.** Color de acento, letra, @handle y tono salen de `~/Documents/mi-contenido/mi-marca.md`. Rubro, avatar y oferta salen de `~/Documents/mi-contenido/mi-negocio.md`. Léelos antes de escribir.
- **Si no existen**, pregunta en UN solo mensaje: «¿Cuál es tu color principal (o un HEX)?, ¿qué letra te gusta (o "no sé")? y ¿cuál es tu @?». Mientras no responda, usa el estilo por defecto de la plantilla (burbuja blanca, letra Fredoka, acento magenta `#E6187D`) y `@tuhandle`.
- **Tus fotos.** Siempre de la persona: pídeselas por su nombre («súbeme 4 a 6 selfies tuyas, verticales, con espacio arriba de la cabeza»). Nunca uses fotos de muestra, caras inventadas ni fotos de otra creadora.
- **Dónde guardar.** `~/Documents/mi-contenido/carruseles/<AAAA-MM-DD>-<tema>/` (crea la carpeta si no existe).
- **Si falta una cuenta o un conector, no te detengas:** sin Higgsfield se trabaja con sus selfies tal cual (camino A del paso 3). Di en una línea qué faltó.
- **Nombres de herramientas.** Un conector puede aparecer como `mcp__claude_ai_<Nombre>__…` o `mcp__<nombre>__…`: usa el que esté disponible.
- **Abrir un archivo o una carpeta:** en Mac `open "<ruta>"`; en Windows `start "" "<ruta>"`.
- **Llaves.** Nunca pidas que peguen una llave o un token en el chat ni los escribas en un archivo de `~/Documents/mi-contenido/`.

---

## 🧭 ANCLAJE DE RUBRO (leer PRIMERO — manda sobre cualquier ejemplo de esta skill)

Esta skill enseña un **método**. El método es agnóstico de industria: sirve igual para
formulación cosmética, nutrición, repostería, fisioterapia, finanzas o jabonería.
Los ejemplos escritos aquí abajo son ilustraciones **del método**, nunca del tema.

**Antes de escribir nada:**

1. Identifica el **RUBRO real** de la persona (léelo de `~/Documents/mi-contenido/mi-negocio.md`, de su
   perfil o pregúntaselo en una línea si no está claro). Decláralo: *"Rubro: ___"*.
2. Todos los ejemplos, analogías, comparaciones, objeciones, métricas y vocabulario salen
   de **ESE** rubro.
3. Si el rubro **no** es marketing, redes sociales, creación de contenido, ventas online o
   negocios digitales → queda **PROHIBIDO** el vocabulario de ese mundo (reels, algoritmo,
   embudo, lead magnet, engagement, "publicar sin vender", "clientes de alto ticket",
   "escalar tu negocio", "posicionarte como referente"), salvo que la persona lo escriba primero.
4. Si el rubro es **técnico, científico o de oficio**: NO borres el tecnicismo para
   "simplificar". Úsalo y **tradúcelo en su primera mención**. El término preciso ES la
   autoridad de esa creadora; quitarlo borra justo lo que la diferencia.
5. Si no tienes datos suficientes del negocio, dilo y usa marcadores explícitos
   (`[TU OFERTA]`, `[TU RESULTADO]`). **Nunca asumas que el rubro es marketing.**
6. **Perfil de compra.** Si vas a proponer ideas, ángulos, ganchos o un calendario, primero encaja al
   avatar en 1 a 3 perfiles según lo que compra en realidad. Se clasifica por situación, nunca por género:
   principiante perdida → dirección · saturada → simplicidad · sin tiempo → tiempo · escéptica → certeza
   (háblale con prueba) · insegura → confianza (identidad + un paso pequeño) · indecisa → que decidan por
   ella · ambiciosa → acceso y estatus · experta estancada → ventaja · cómoda en su plan B → salir del
   «sigo como estoy» · responsable de otros → tranquilidad. Etiqueta cada idea con **perfil + nivel de
   conciencia + palanca** y reparte las piezas entre perfiles. La urgencia sale de lo que le cuesta seguir
   igual, con datos reales. No nombres el perfil en pantalla: háblale desde su freno.

**El método viaja, el rubro no.** El mismo molde, vestido con rubros distintos:

| Rubro | El mismo molde |
|---|---|
| Cocina | "Así es mi cena favorita para no dormir con el azúcar alta." |
| Relaciones | "5 señales de que estás forzando una relación que ya no funciona." |
| Finanzas | "La principal causa de un divorcio no es una infidelidad." |
| Formulación cosmética | "El conservante decide si tu crema dura tres meses o te da una infección. No el aceite." |
| Jabonería | "Si tu jabón se pone blando a los dos días, no fue el aceite. Fue la sosa." |
| Fisioterapia | "Ese dolor de rodilla al bajar escaleras casi nunca nace en la rodilla." |
| Repostería | "Tu bizcocho se hunde en el centro por la temperatura, no por la harina." |
| Jardinería | "Tu planta no se está muriendo de sed. Se está ahogando." |

Mismo molde en todos; ninguno menciona reels ni embudos. Haz exactamente eso.

---

# Skill — Carrusel ORGÁNICO (diario / chat-bubble sobre selfie)

> "Tu cara a pantalla completa + burbujas de texto tipo mensaje. Se siente
> hecho con el teléfono, no diseñado. Frena el scroll porque parece personal."

Estilo validado: **selfie full-bleed + burbujas de chat**. La protagonista **eres tú**
(o tu clienta, con sus fotos y su permiso).

## CUÁNDO ACTIVAR
- "Hazme un carrusel orgánico / estilo diario / storytime con mi foto"
- "Carrusel con burbujas de texto sobre una selfie mía"
- "Un carrusel como el de esa chica pero conmigo, explicando [tema]"

**No activar:** carrusel puramente tipográfico → `carrusel-formatos-f100k`.
Clonar un estilo ajeno desde una captura → `clonador-carrusel-formula100k`.

---

## ADN DEL ESTILO (no negociable)
1. **Foto full-bleed** de la protagonista, estética selfie cruda de teléfono
   (luz natural, sin filtro de belleza, piel real). Nada de stock.
2. **Burbujas blancas redondeadas** (Fredoka por defecto, o la letra de su marca si es
   redondeada y legible), texto negro, palabra clave en **bold** o en el acento
   (el color principal de su marca; magenta si no tiene).
3. **Portada MÍNIMA**: 1 sola burbuja de gancho corto + flecha. Sin saturar. Mínima en texto, no en sentido: la foto de la portada muestra el tema (la persona haciendo lo que dice el gancho, con el objeto o en el lugar). Ver `references/portada-gancho-visual.md`.
4. **Círculo dibujado a mano** y **tarjeta de prueba** (mock captura):
   OPCIONALES y como mucho en 1–2 slides, para resaltar UNA prueba. No abusar.
5. **Flecha swipe** (todas menos la última) + **dots** + **@handle** en el CTA.

## REGLAS DURAS
- **Foto con AIRE ARRIBA**: cada foto necesita espacio sobre la cabeza y en el pecho,
  para que las burbujas NO tapen cara/ojos. Es el error #1.
- **Portada = poco texto.** Un gancho de una frase, como afirmación directa (no pregunta
  retórica). Si necesitas explicar, va en las slides siguientes.
- **1 idea por slide**, máx ~12–18 palabras visibles. Cuerpo legible.
- **Español neutro y tuteo** (tú, tienes, puedes; nunca vos, tenés, podés).
- **NUNCA inventar datos.** Si pones una métrica (vistas, %, tiempo, ventas), que sea
  real de la persona o pídesela; si es un claim narrativo, avísalo y deja que lo
  edite. No presentes un número inventado como si fuera captura real.
- **CTA** en la última: comentario de una palabra clave ligada al tema (nunca «YO») +
  "guárdalo", salvo que `mi-marca.md` traiga otro CTA. Si promete enviar algo, que exista.

---

## FLUJO (6 pasos)

### 1 · Tema, marca y protagonista
Confirma: tema en 1 frase · @handle y color de acento (de `mi-marca.md` o de su respuesta) ·
de quién es la cara. Pide **4 a 6 selfies** de la persona: verticales, luz natural,
con espacio arriba de la cabeza, en 3–4 lugares distintos (escritorio, sofá, cafetería, pared).
Si ya tiene una carpeta con sus fotos, pregúntale la ruta; no busques carpetas por tu cuenta.

### 2 · Guion slide por slide
Portada (gancho) → error/tensión → pasos/desarrollo → prueba → CTA.
Reescribe el gancho con un patrón validado (número, contraste, ruptura, error común).
Entrega el guion en texto y pide OK antes de producir.

### 3 · Las fotos

**Camino A — sus selfies tal cual (siempre disponible, gratis).**
- Mira cada foto con Read y elige la mejor para cada slide: la **portada** se lleva la más
  fuerte (mirada a cámara). Que slides seguidas no repitan foto.
- Cópialas a la carpeta de salida como `bg1.jpg`, `bg2.jpg`… (respeta la extensión real).
- Si una foto no tiene aire arriba, ajusta `object-position` de `.bg` o pon la burbuja abajo.

**Camino B — variaciones con Higgsfield (opcional, solo si tiene el conector y créditos).**
- Antes de gastar créditos, di cuántas imágenes son y pide confirmación.
- Sube 3 selfies frontales con `media_upload` → PUT del archivo → `media_confirm`.
- `generate_image` con un modelo de imagen que acepte referencias (p. ej. `nano_banana_2`),
  `aspect_ratio:"4:5"`, pasando las selfies como `medias[].role:"image"`.
- Prompt: énfasis de identidad + escena. Plantilla:
  > "Photorealistic candid phone selfie of the SAME person as in the reference
  > photos — keep the exact face and identity identical. Authentic
  > amateur selfie, natural light, real skin texture, no beauty filter. [escena
  > y expresión]. Vertical 4:5, generous empty headroom above the head and space
  > around the chest for text overlays. [fondo]."
- Genera 3–4 escenarios distintos. Verifica cada imagen con visión (identidad + aire arriba).
  Si una no se parece a ella, no la uses.
- Descarga los resultados a la carpeta de salida como `bg1.png`, `bg2.png`…

### 4 · Construir el HTML
Copia `references/plantilla-organica.html` (está en `~/.claude/skills/carrusel-organico-f100k/references/`)
a la carpeta de salida como `carrusel-organico.html` y rellena las slides (tipos: portada mínima · 2
burbujas · con tarjeta+círculo · CTA). Rutas de imagen **relativas** (`bg1.jpg`).
- Acento de marca: cambia `--pink` en `:root` por el color principal de `mi-marca.md`.
- @: cambia `@tuhandle` por el suyo.
- Ajusta el número de dots al número de slides.

### 5 · Renderizar
La primera vez, si falta `node_modules` dentro de la skill:
```bash
cd "$HOME/.claude/skills/carrusel-organico-f100k" && npm install
```
Luego:
```bash
node "$HOME/.claude/skills/carrusel-organico-f100k/export.js" "<carpeta>/carrusel-organico.html" --width 1080 --height 1350 --scale 2
```
Genera `slide-01.png`…`slide-NN.png`. Usa el Google Chrome instalado (Mac o Windows).

### 6 · REVISAR CADA SLIDE con visión y corregir
Abre los PNG y verifica en TODAS: (a) las burbujas no tapan la cara/ojos;
(b) `.proof` y `.bottom` no se solapan; (c) el `.circle` encierra SOLO la línea
correcta (circular texto dentro de una burbuja que hace wrap es poco fiable →
mejor círculo sobre la tarjeta o quítalo); (d) nada de texto cortado. Ajusta
posiciones en el HTML y re-renderiza hasta que quede limpio. Entrega los PNG en
orden + caption/CTA, y abre la carpeta.

## NOTAS
- Si no hay Chrome: entrega el HTML para abrirlo en el navegador.
- Fuente: Fredoka por defecto (redondeada, amable). Si su marca usa otra letra
  redondeada de Google Fonts, cámbiala en el `<link>` y en `body`.
- La tarjeta de prueba de la plantilla imita una respuesta de un chat de IA: cámbiala por
  la prueba real que tenga la persona (un mensaje, un resultado, una captura suya).
