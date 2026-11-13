---
name: ensayo-palitos-f100k
description: "Reel sin cara hecho con código, sin créditos: monigotes de palito en papel blanco que cuentan un chiste de tu cliente con remate rojo. Usar con «plantilla Ensayo de palitos», «reel de monigotes en papel»."
argument-hint: [tema o situación + el remate + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Ensayo de palitos (reel sin cara, código puro)

Un ensayo sarcástico contado con monigotes de palito. Papel casi blanco, línea de plumón negro gruesa que tiembla un poco
cada 4 cuadros (como dibujo hecho a mano), relleno de lápiz de color en diagonal con vetas blancas, carteles colgados de
hilos y globos de diálogo en letra a mano. Casi nada se interpola: las caras y los brazos **saltan** de pose con corte seco.
El chiste lo remata una palabra roja gorda y el cierre es tu palabra de CTA en un cartel colgado.
Todo se dibuja con código (canvas) y se renderiza gratis en tu compu: 1080×1920, 30 fps. Una escena de 4 s tarda ~10 s.

En qué se distingue de `palitos-3d-bucle-f100k`: aquí todo es **plano, dibujado a mano y sin luz**; no hay 3D, ni volumen, ni
caminata en bucle. Lo que manda es el chiste: una situación conocida, la cara que cambia y el remate en rojo.

## Antes de empezar: lo que necesita

Esta skill usa el motor de dibujo de otra skill, que debe estar instalada **junto a esta** (misma carpeta de skills) o en `~/.claude/skills`.

| Skill | Qué usa de ella | ¿Viene en el paquete? |
|---|---|---|
| `animacion-dibujada-f100k` | `nucleo/nucleo.js`, `nucleo/cine-dibujo.js` y `scripts/renderizar.mjs` | Sí (módulo Animación). La primera vez: `npm i` dentro de su carpeta |

Si falta, **dilo y detente**: no la sustituyas por otro script. Además: Node 18+, ffmpeg y Google Chrome.

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`.
En este estilo, su acento va en el traje del protagonista y en la palabra del CTA; sus otros colores visten la camisa,
la corbata y las barras. **El papel, la tinta negra, la letra a mano y el rojo del remate se quedan.** Al entregar, di en
una línea qué aplicaste.

## Qué te pido antes de empezar
1. **La situación** que tu cliente ideal conoce y le duele o le da risa (una reunión eterna, el cliente que pide «precio» y
   desaparece, publicar sin plan…). Dime quién es el protagonista y qué le pasa.
2. **El remate**: 2 a 4 palabras que dicen la verdad incómoda (ej. «PUDO SER / UN CORREO»). Va en rojo y en 1 o 2 líneas.
3. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO».
4. **Duración**: una escena es un remate (~4 s). Para un reel de 12 a 20 s se encadenan 3 a 5 escenas.
5. **Voz (opcional):** tu grabación o una voz clonada, con el tono seco del ensayo. Sin voz, el reel va con música grave.

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: `plantilla/build.mjs`, `plantilla/escena.html`, `plantilla/config.json`
   y `plantilla/fuentes/`.
2. **Escribe `config.json`:**
   - `cta`: tu palabra. `comenta`: la frase chica del cartel (por defecto «COMENTA»).
   - `colores`: en hex (ver «Tu brandkit»).
   - `escenas`: una por remate, en orden. Cada una lleva `dur` (segundos de la acción), `cartel` (el lugar o la situación,
     1 a 2 palabras), `globo` (lo que dice el que habla, 1 a 3 palabras) y `remate` (1 o 2 líneas). La última lleva
     `"cierre": true` (el CTA se suma al final, `cta_dur` segundos).
   - `voz`: ruta a tu voz ya cortada (wav o mp3), o `null`.
3. **Adapta el dibujo de cada escena al tema.** `escena.html` trae la escena de ejemplo (reunión, reloj que se acelera,
   gráfica que baja, el protagonista que se duerme). Para otro tema, copia `escena.html` a `escena-2.html`, ponlo en
   `"archivo"` de esa escena y cambia solo la función `escena(t)`:
   - Usa el **KIT DE DIBUJO** que está arriba en el archivo: `sentado`, `parado`, `cara` (ojos `punto|medio|cerrado|enojo`,
     boca `plana|triste|abierta|sonrisa`), `cartelColgado`, `globo`, `lapiz`, `caja`, `ovalo`, `linea`, `texto`.
   - Los tiempos se escriben como en una escena de 4 s con `s(…)`: se estiran solos con `dur`.
   - Cambia las caras y las poses **con corte seco** (un `if` por tiempo), nunca con un deslizamiento.
   - La utilería (reloj, gráfica, lámpara) se cambia por algo que **muestre lo que dice la escena**: un celular, una caja
     registradora, un calendario, un letrero.
   - Mantén la línea `// ANATOMIA: estilizada …`: sin ella el renderizador frena los monigotes.
4. **Prueba rápida:** `node build.mjs --hoja` → `_revision-N.jpg` (un cuadro cada 0,4 s por escena). Revisa con la lista de abajo.
   Para un video de prueba liviano: `node build.mjs --chico --out prueba.mp4` (540×960).
5. **Render completo:** `node build.mjs` → `reel.mp4`, `reel-hoja.jpg` (9 cuadros) y `reel-styleframe.jpg`.
   Si ya existe, usa `--out reel_v2.mp4` (no pisa la entrega anterior).
6. **Sonido:** golpe sordo grave en cada cambio de pose y en el remate, desliz de papel en la cámara. Nada agudo (nada por
   encima de ~3 kHz): sin timbres, clics ni campanas. Música seca y grave, baja debajo de la voz.

## Lista de revisión (hoja de 9 cuadros)
1. ¿La línea de tinta «hierve» (cambia un poco entre cuadros) sin temblar de lugar?
2. ¿Cada cara o pose cambia con corte seco, sin deslizarse?
3. ¿El cartel y el globo se leen completos y dicen algo de TU tema?
4. ¿El remate rojo entra de golpe, se lee en 1 segundo y no tapa la cara del protagonista?
5. ¿La utilería muestra lo que dice la escena (no quedó la gráfica del ejemplo en un tema que no la usa)?
6. ¿El CTA es tu palabra y no es «YO»?
7. ¿Hay texto importante debajo de y = 1470 (lo tapa el texto de Instagram)?

Si algo da «no», se corrige y se vuelve a pasar la lista.

## Reglas del estilo
- **Plumón que hierve:** la semilla del trazo cambia cada 4 cuadros con 3 variantes. Nunca quieto del todo, nunca temblando.
- **Monigotes de la casa:** cabeza redonda con 3 pelos parados, cuerpo de huevo, piernas de palito y manos de bolita. Caras
  mínimas (puntos, rayitas, boca). Nada de anatomía realista.
- **Lápiz de color rayado en diagonal** para la ropa y la utilería, con vetas blancas. Nada de relleno liso ni degradado.
- **Corte seco:** las poses saltan; lo único que se mueve suave es la cámara que se desliza y se acerca.
- **Rótulos en cajitas colgadas** y globos en letra a mano mayúscula. Pocas palabras.
- **Remate rojo gordo** de 2 a 4 palabras, con un borde de papel para que se despegue del dibujo.
- **Tono sarcástico, no cruel:** se ríe de la situación, nunca de tu cliente.
- **Sin gancho textual extra:** el cartel y el remate hacen de gancho. En pantalla nunca nombres herramientas ni código.

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/build.mjs` | Lee `config.json`, mete el motor y las fuentes, renderiza cada escena, las pega y saca la hoja de 9 cuadros. |
| `plantilla/escena.html` | La escena de ejemplo + el kit de dibujo (monigotes, carteles, globos, lápiz de color, remate y cierre). |
| `plantilla/config.json` | Ejemplo genérico: la reunión que pudo ser un correo, CTA «GUÍA». |
| `plantilla/fuentes/` | Kalam (letra a mano) y Bangers (remate), licencia OFL en `OFL.txt`. |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit (sección 7: qué cambia en este estilo). |

## Errores que ya costaron un rechazo (no repetir)
- **Escena ancha en vertical:** la escena de la referencia es horizontal y en 9:16 deja papel vacío abajo. Encuadra cerrado
  (cámara a 1,1–1,4) y apila lo importante entre y = 250 y y = 1450.
- **Pocos personajes iguales:** si la escena tiene más de 3 monigotes, distínguelos con lápiz de color distinto, una corbata o
  un accesorio (gorra, lentes) hecho con `linea` y `ovalo`.
- **Cuerpo tieso del que se duerme:** el cuerpo se inclina (`dormido: true`) y la cabeza cae sobre el pupitre; no lo dejes derecho
  con los ojos cerrados.
