---
name: guion-youtube-formula100k
description: "Escribe el guion completo de un video largo de YouTube con estructura de retención (doble caída, bucle abierto, cliffhangers) y lo entrega como teleprompter .docx. Usar con «arma mi guion de YouTube», «guion para mi video de [tema]», «escribe mi video de X minutos». NO para reels, VSL ni ads."
argument-hint: "[tema del video] o pega tu idea o tu borrador"
metadata:
  version: "1.0.0"
---

## 🧰 EN TU COMPU (leer antes de seguir: manda sobre lo que diga esta skill más abajo)

Esta skill viaja en el plugin de FÓRMULA 100K y corre igual en Mac y en Windows.

- **Tu negocio.** Los datos salen de la persona, nunca de un ejemplo: lo que venga en el pedido, su Manual o Segundo Cerebro si lo tiene, o la ficha `~/Documents/mi-contenido/mi-negocio.md`. Si no hay nada, pregunta rubro, avatar y oferta en un solo mensaje.
- **Tu voz.** Cómo habla (tono, palabras que usa y las que nunca usa) sale de `~/Documents/mi-contenido/mi-voz.md`. Si no existe, pídele dos o tres textos suyos o que te cuente cómo habla, en un solo mensaje.
- **Dónde guardar.** Todo lo que generes va dentro de `~/Documents/mi-contenido/guiones-youtube/` (crea la subcarpeta si no existe).
- **Si falta algo, no te detengas:** haz la parte que sí se puede y di en una línea qué faltó.
  - Sin Python o sin `python-docx` → entrega el guion en Markdown (`GUION_<tema>.md`) con la misma estructura y explica cómo instalarlo (`pip install python-docx`) para la próxima.
  - Sin búsqueda web → toda cifra que no leíste de una fuente va marcada «sin verificar». Nunca inventes un dato ni un enlace.
- **Otras skills.** Las que nombra esta skill vienen en el mismo plugin. Si alguna no está instalada, sigue sin ella y avisa.
- **Archivos de esta skill.** Las rutas como `references/…` y `scripts/…` son relativas a la carpeta de esta skill (la que tiene este `SKILL.md`), no a `~/.claude/skills/`.
- **Abrir un archivo o una carpeta:** en Mac `open "<ruta>"`; en Windows `start "" "<ruta>"`.

---

## 🧭 ANCLAJE DE RUBRO (leer PRIMERO — manda sobre cualquier ejemplo de esta skill)

Esta skill enseña un **método**. El método es agnóstico de industria: sirve igual para
formulación cosmética, nutrición, repostería, fisioterapia, finanzas o jabonería.
Los ejemplos escritos aquí abajo son ilustraciones **del método**, nunca del tema.

**Antes de escribir nada:**

1. Identifica el **RUBRO real** de la persona (léelo de su Segundo Cerebro, de su perfil o
   pregúntaselo en una línea si no está claro). Decláralo: *"Rubro: ___"*.
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
6. **Perfil de compra.** Si vas a proponer ángulos, títulos o aperturas, primero encaja al
   avatar en 1 a 3 perfiles según lo que compra en realidad. Se clasifica por situación, nunca por género:
   principiante perdida → dirección · saturada → simplicidad · sin tiempo → tiempo · escéptica → certeza
   (háblale con prueba) · insegura → confianza (identidad + un paso pequeño) · indecisa → que decidan por
   ella · ambiciosa → acceso y estatus · experta estancada → ventaja · cómoda en su plan B → salir del
   «sigo como estoy» · responsable de otros → tranquilidad. La urgencia sale de lo que le cuesta seguir
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

## Qué hace esta skill

Convierte una idea en el **guion completo de un video largo de YouTube** con una estructura pensada para la retención, y entrega:

1. **`GUION_<tema>.docx`** — teleprompter con todo lo que vas a decir, fase por fase, con las señales de pantalla (qué mostrar, qué poner en la pizarra, qué B-roll) en cajas aparte. Si no se puede generar el .docx, va en Markdown con la misma estructura.
2. **3 títulos y 3 aperturas** coherentes entre sí para que elijas.

Es para **video LARGO de YouTube**, no reels. Para reels usa `guionizacion-formula100k`; para VSL `vsl-expert-f100k`; para ads `guionizacion-ads-formula100k`.

---

## Proceso obligatorio

### Paso 1 — Encuadre (saltar lo ya respondido)
Si no está claro del mensaje, pregunta SOLO lo que falte, en un solo mensaje:
1. ¿Tema y promesa del video? (la transformación A→B)
2. ¿Duración objetivo? (define cuántas fases y cliffhangers)
3. ¿CTA final? (tu oferta, tu regalo o tu siguiente video; si no hay, deja `[TU CTA]`)
4. ¿Algún dato, historia personal o caso real que quieras incluir?

### Paso 2 — Pilar de valor (1 de 7)
Declara el pilar central (Revelación, Utilidad, Validación, Desafío, Actualidad, Curaduría, Disrupción) y justifícalo en 1 frase. (Mismo sistema que `guionizacion-formula100k`.)

### Paso 3 — Mapear la estructura larga
Lee `references/estructura-youtube.md` y mapea el tema a la **doble caída larga** (8 beats) con cliffhangers entre fases y el bucle abierto (algo prometido al inicio que se cierra al final). No inventes beats; usa el mapa del reference.

### Paso 4 — Triple gancho de YouTube
A diferencia del reel, YouTube tiene 3 superficies de gancho: **título + miniatura + primeros 8 s**. Diseña los tres coherentes entre sí (ver reference). Propón 3 títulos y 3 aperturas y deja elegir. Si quieres trabajar el empaque a fondo, pasa por `empaque-youtube-f100k`.

### Paso 5 — Escribir el guion completo
Redacta TODO lo que se va a decir, palabra por palabra, en español neutro (tú/tienes, nunca vos/tenés), con frases simples de nivel sexto grado y hablándole a «tú». Inserta:
- Un cliffhanger o micro-gancho al cierre de cada fase («…pero esto todavía no es lo mejor»).
- Zoom-in en las descripciones (detalle concreto, no genérico).
- El «tú invisible».
- Datos SOLO si son verificables (ver guardrails).
- En cada sección, la señal de pantalla: qué se ve mientras se dice (B-roll, captura, texto, idea para la pizarra).

### Paso 6 — Chequeo de retención
Pasa el guion por el chequeo del reference: ¿el gancho carga en 0-8 s? ¿hay un pico temprano? ¿la primera caída llega antes del minuto? ¿cada fase deja un pendiente abierto? ¿el bucle abierto se cierra al final? Reescribe lo que salga bajo.

### Paso 7 — Generar el entregable (ver «Salida»)

---

## La estructura (resumen; detalle en el reference)

**Doble caída larga (8 beats):**
1. **Romper patrón** — apertura disruptiva (visual + verbal).
2. **Intriga / promesa** — gancho negativo + qué se llevará + semilla del bucle abierto (prometer algo para el final).
3. **Problema 1** — identificación pura («así te ves tú ahora»).
4. **Solución 1** — primera satisfacción. ← cliffhanger
5. **🔻 Problema 2 (la doble caída)** — «pero no te quedes ahí; esto solo no basta». ← rompe la tranquilidad
6. **Solución 2 (definitiva)** — la capa que lo cambia todo + cerrar el bucle abierto.
7. **Prueba / datos** — solo verificables.
8. **CTA** — a tu oferta, tu regalo o tu siguiente video.

Detalle, ejemplos y el sistema de cliffhangers: `references/estructura-youtube.md`.

---

## Salida (entregable y rutas)

Crea la carpeta `~/Documents/mi-contenido/guiones-youtube/<AAAA-MM-DD>_<tema-kebab>/` y dentro:

1. **`guion.json`** con este esquema:
   ```json
   {
     "titulo": "Título elegido",
     "subtitulo": "opcional: promesa en una línea",
     "secciones": [
       {"titulo": "1. Romper patrón", "narracion": "Todo lo que se dice, palabra por palabra…", "cue": "En pantalla: …"}
     ]
   }
   ```
2. **`GUION_<tema>.docx`**, generado con:
   ```
   python3 scripts/make_docx.py <carpeta>/guion.json <carpeta>/GUION_<tema>.docx
   ```
   (En Windows puede ser `python` en vez de `python3`.) El script necesita `python-docx` (`pip install python-docx`). Produce el teleprompter sin índice, con texto justificado y las señales de pantalla en cajas con borde.
3. Si el .docx no se puede generar, **`GUION_<tema>.md`** con la misma estructura: título, y por sección el encabezado, la señal de pantalla en una cita (`> 🎬 …`) y la narración.

Al terminar, dile a la persona la ruta del archivo y los 3 títulos y 3 aperturas para elegir.

---

## Guardrails

- **NUNCA inventes datos.** Métricas, estudios, fechas y conteos solo si son verificables y con fuente que se pueda abrir. Si la persona quiere una cifra y no hay fuente, adviérteselo y búscala antes de usarla; si no aparece, se reescribe sin la cifra.
- **No inventes casos ni testimonios.** Las historias y resultados salen de la persona; si no los tiene, usa `[TU CASO]`.
- **Español neutro** siempre (tú/tienes, copia, aquí). Nunca vos, tenés, podés, acá, plata ni che.
- **No** generes imágenes desde esta skill: las señales de pantalla describen qué mostrar.
- **No** confundas con reel, VSL o ads: esta skill es para el video LARGO.
- Mantén este SKILL.md como índice; el detalle vive en `references/`.

---

## Siguientes pasos

- **Título y miniatura:** `empaque-youtube-f100k` (3 títulos con su concepto de miniatura, o auditar los que ya tienes).
- **La imagen de la miniatura:** `miniatura-youtube-formula100k` (con tus fotos o clonando el estilo de una referencia).
- **Opcional — pizarra para grabar:** `pizarra-youtube-f100k` arma una pizarra 16:9 para acompañar el video a partir de tu guion.
