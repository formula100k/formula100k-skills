---
name: reel-lista-maquetas-f100k
description: Arma un reel faceless 9:16 de LISTA con voz, donde cada ítem es una escena de 2 a 3 s con un titular arriba (la palabra clave en color y más grande), una maqueta plana de pantalla al centro que ILUSTRA el pedido (navegador con formulario, código, servidor, base de datos, candado, registro, variables, cookies, reloj que caduca, dos tarjetas con sello ✓/✕, WhatsApp, calendario, límite, checklist) y abajo la barra «07/27 · CATEGORÍA» que avanza más la pastilla con el @. Fondo pastel plano, corte seco, sonidos graves y render local gratis con Chrome y ffmpeg. Usar cuando digan «reel de lista», «N cosas que…», «pídele a Claude que…», «checklist en video», «los pasos de un tutorial con maquetas», «reel con maquetas de app», «estilo lista con barra de progreso», «/reel-lista-maquetas», «lista en cuaderno», «lista con bocetos a lápiz», «estilo papel cuadriculado con grupos». NO usar para un talking-head con lista encima (lista-sobre-video-hablado-f100k), una lista que suena con sonido por ítem sobre fotos (reel-lista-que-suena-f100k) ni una explicación animada con personaje (reel-explicado-animado-f100k).
---

# Reel de lista con maquetas

Un reel sin cara en el que una voz dicta una lista («Claude, blinda mi app: saca las claves del navegador, protege mi base de datos…») y cada pedido se vuelve una escena corta: **titular arriba, maqueta de pantalla al centro y barra de progreso abajo**. Engancha porque la persona ve avanzar el contador (01/12, 02/12…) y quiere llegar al final, y porque cada maqueta le muestra en un segundo QUÉ pasa (la petición rechazada, la clave que se va al servidor, el enlace que caduca).

Todo lo que se entrega es genérico: el @, el dominio de ejemplo, el color y la palabra del CTA salen del `escenas.json` de quien la usa.

## Cuándo usarla

- «N cosas que le tienes que pedir a Claude para…», «27 pedidos de seguridad», «10 errores de tu web».
- Los pasos de un tutorial en los que cada paso se puede MOSTRAR en una pantalla.
- Un checklist que se vende con un regalo («comenta USO y te mando la lista completa»).

Si un ítem no se puede dibujar como una pantalla (una emoción, una historia), este formato no es el adecuado.

## Qué necesitas

1. **El guion o la lista** (o el tema, y lo escribimos juntas).
2. **La voz**: una de estas tres.
   - Tu voz o tu voz clonada, **un audio por escena** en una carpeta: `01.mp3` (gancho), `02.mp3`… y el último es el cierre.
   - Borrador con la voz del sistema de Mac (`say`, voz Paulina). Sirve para ver tiempos, no para publicar.
   - Sin voz: render mudo con tiempos fijos.
3. **Tu @, un dominio de ejemplo** (que no sea una web real ajena) y **la palabra del CTA**.
4. Node 18+, ffmpeg y Google Chrome. La primera vez, en la carpeta de la skill: `npm i`.

## Reglas de estilo (mandan sobre cualquier referencia)

- **Gancho golpe de 0 a 2 s:** una línea ENORME (en una sola línea) y otra chica que se leen como UNA frase, de 2 a 5 palabras la grande. Va negativa o polémica, o con una cifra real. La chica en rojo si es negativa, en verde si es un logro y en amarillo si es de la casa. No nombra Claude, prompt ni skill, y habla de TI. La primera frase de la voz dice lo mismo en 12 palabras o menos. Prepara 3 variantes A/B/C para los trial reels.
- **Sin frase puente** después del gancho («pero antes…»): se entra directo al ítem 01.
- **Texto con corte seco:** las palabras del titular entran una a una cuando la voz las dice, sin fundido, deslizamiento ni tecleo. La clave va en color y 1,25 veces más grande, y los conectores quedan chicos. Sin brillo ni degradado en las letras.
- **Nada de tembladera:** sin shake, rebote, elástico ni wiggle. Lo único que se mueve es lo que cuenta la acción: la barra que se llena, el punto que viaja del navegador al servidor, el reloj que se vacía, la clave que se muda al servidor. El sello ✓/✕ aparece con un corte.
- **Maquetas planas, como la pantalla real:** tarjetas blancas, letra mono para el código y las etiquetas, y pastillas verde/roja. Nada de emojis ni stickers.
- **Sonidos solo graves:** pop, swish, golpe sordo y desliz de papel bajo, todos sintetizados con un pasa-bajos a 2,2 kHz. Nada de pitidos, clics, teclas ni campanas. El script mide la energía sobre 3 kHz y avisa si se cuela algo.
- **Un ítem cada 2 a 3 s.** Si un ítem necesita más de 3,5 s de voz, se parte en dos o se acorta.
- **CTA solo al cierre** (es una lista: el CTA en la mitad corta el conteo), con una palabra ligada al tema (nunca «YO»).
- Sin marcas ni datos ajenos: el @ del pie y el dominio de ejemplo son los de quien publica el reel.

## Flujo

### 1. Guion → `escenas.json`

Escribe la lista y conviértela en `escenas.json` (el modelo está en `ejemplo/escenas.json` y todos los parámetros de cada maqueta en `referencias/MAQUETAS.md`):

```json
{
  "marca": { "handle": "@tucuenta", "dominio": "mitienda.app", "acento": "#4F5BFF" },
  "total": 12,
  "gancho": { "grande": "TE VAN A HACKEAR", "chica": "si no la blindas así", "color": "rojo",
              "voz": "Te van a hackear la app si no la blindas así.", "maqueta": { "tipo": "objetivo" } },
  "items": [
    { "titular": "Saca las *claves* del navegador.", "categoria": "Secretos",
      "voz": "Saca las claves del navegador.", "maqueta": { "tipo": "codigo", "clave": "sk_demo_7f3a…" } }
  ],
  "cierre": { "titular": "Comenta *BLINDA*.", "palabra": "BLINDA",
              "voz": "Comenta blinda y te mando la lista completa.", "regalo": "La lista completa para copiar y pegar" }
}
```

- `*clave*` marca la palabra o las palabras que van en color y más grandes. El punto final también va en color.
- `categoria` es la etiqueta corta de la barra (ACCESO, DATOS, RED…), de 1 palabra.
- `total` es el número que muestra la barra (`NN/TT`). Si el reel trae solo una parte de la lista, usa `"desde"` para empezar el contador en otro número.
- Elige la maqueta que MUESTRA la acción del ítem. Tipos: `objetivo`, `formulario`, `codigo`, `basedatos`, `candado`, `registro`, `variables`, `regla`, `galleta`, `reloj`, `flujo`, `whatsapp`, `calendario`, `limite`, `lista`, `cierre`, `libre` (HTML propio con los mismos atributos de tiempo).
- No repitas la misma maqueta más de 3 veces seguidas: cambia los textos o el tipo.

**✋ Checkpoint 1:** muestra el guion en una tabla (n.º, titular con la clave marcada, categoría, maqueta y qué acción se ve) y las 3 variantes de gancho. No sigas sin el OK.

### 2. Vista previa rápida (sin render)

```bash
node scripts/producir.mjs proyecto/escenas.json --voz say --solo-armar
```
Abre `proyecto/build/pieza.html` con doble clic: corre en vivo en el navegador.

### 3. Voz + render + efectos + mezcla

```bash
# borrador con la voz del sistema (Mac)
node scripts/producir.mjs proyecto/escenas.json --voz say --salida proyecto/reel.mp4
# con tu voz real o clonada: un audio por escena (01 = gancho, último = cierre)
node scripts/producir.mjs proyecto/escenas.json --voz proyecto/voz/ --salida proyecto/reel.mp4
# mudo, con tiempos fijos (el "dur" de cada escena o 2,6 s)
node scripts/producir.mjs proyecto/escenas.json --voz no
```

Qué hace: recorta el silencio de cada audio y lo mide, ajusta la duración de cada escena a su voz (mínimo 2,3 s por ítem), hace que cada palabra del titular entre cuando la voz la dice, renderiza en Chrome cuadro a cuadro (los tramos quietos se reusan, así que unos 20 s de reel tardan menos de un minuto), pone los efectos graves donde aparece cada cosa y mezcla a −14 LUFS.

Deja en `proyecto/build/`: `pieza.html`, `tiempos.json`, `voz.wav`, `efectos.wav`, `mudo.mp4` y `hoja.jpg` (la hoja de contacto, un cuadro por segundo).

### 4. Revisión de cuadros

1. Mira `build/hoja.jpg` y saca los cuadros que dudes:
   `node scripts/renderizar.mjs proyecto/build/pieza.html proyecto/build/c --cuadros 2.5s,7s,12s`
2. Revisa: ¿el gancho está en UNA línea grande + una chica?, ¿cada titular cabe en 2 líneas?, ¿la maqueta muestra la acción del ítem?, ¿algo se sale de la pantalla o se encima?, ¿la barra y el contador coinciden con el ítem?, ¿la palabra del CTA es la correcta?
3. Corrige el `escenas.json` y vuelve a producir.

**✋ Checkpoint 2:** entrega la hoja de contacto y 4 a 6 cuadros sueltos. Solo con el OK se exporta el final y se sube.

### 5. Entrega

El MP4 final (1080×1920, 30 fps, H.264 + AAC) va a la carpeta donde guardas tus videos editados.

## Estilo «cuaderno» (`"estilo": "cuaderno"`)

Otra piel para la misma lista: **papel crema cuadriculado**, encabezado «GRUPO 2 DE 5» con puntitos que se llenan y el nombre del grupo en serif itálica subrayado con una onda naranja. La lista del grupo **se acumula** (cada fila: ícono + nombre en negrita subrayado + descripción en serif itálica), debajo **un boceto a lápiz que se dibuja solo** y el subtítulo en un papelito abajo. Gancho con la línea chica en color y la ENORME con letra **rayada** (contorno + rayas, sin brillo ni degradado), intro opcional con la cifra rayada y una cajita «?» por ítem, y cierre en una **nota de papel con cinta** donde la palabra del CTA va rayada. Ejemplo completo: `ejemplo/cuaderno/escenas.json` (`ejemplo/muestra-cuaderno.png` es un cuadro).

```json
{ "estilo": "cuaderno", "marca": { "acento": "#E06A3C" }, "etiqueta_grupo": "Grupo",
  "gancho": { "chica": "Tu contenido", "grande": "NO VENDE", "color": "rojo", "voz": "Tu contenido no vende sin estos seis pasos." },
  "intro":  { "arriba": "Guárdate estos", "numero": 6, "abajo": "y que tus videos vendan", "voz": "Guárdate estos seis…" },
  "items": [ { "grupo": "Antes de grabar", "nombre": "Tu avatar", "desc": "a quién le hablas y qué le duele", "icono": "persona",
               "voz": "Primero, tu *avatar*: a quién le hablas y qué le duele.", "boceto": { "tipo": "ficha", "etiqueta": "su dolor" } } ],
  "cierre": { "arriba": "Los 6, por privado", "verbo": "comenta", "palabra": "LISTA", "regalo": "y te mando la lista completa", "voz": "Comenta *lista*…" } }
```

- **Grupos:** los ítems seguidos con el mismo `grupo` forman un grupo; de 2 a 3 ítems por grupo (más de 4 no caben con el boceto). Los puntitos = cantidad de grupos.
- **`icono`:** mejor el **logo o la captura real** de lo que nombra (ruta a un `.png`/`.jpg`/`.svg` junto al json; se incrusta solo). Si no hay, uno a lápiz: `persona`, `rayo`, `pasos`, `chat`, `calendario`, `grafica`, `lupa`, `play`, `dolar`, `check`, `documento`, `foco`, `objetivo`, `lapiz`, `estrella`. Nunca emojis.
- **`boceto.tipo`:** `pantallas` (izq tachada / der con ✓), `opciones` (3 cajas, una elegida), `pasos` (cajas con flechas), `chat` (comentario con la palabra), `calendario` (semana con días marcados), `grafica` (línea que sube), `ficha` (ficha + diana), `lista` (✓ que se marcan), `buscar` (tarjetas + lupa), `video` (video → documento), `precio` (dos etiquetas $), `libre` (`svg` propio en un viewBox 800×500 con `class="trazo" pathLength="1"` y `data-a`). El trazo se dibuja durante la voz del ítem; es lo único que se mueve.
- **Subtítulo:** sale de `voz` en trozos de hasta 3 palabras; van en color las palabras entre `*asteriscos*`, el `nombre` del ítem y la `palabra` del cierre. `"subtitulos": false` lo apaga.
- Los mismos comandos de siempre (`producir.mjs`, `--voz say|carpeta|no`). Con `intro`, la carpeta de voz lleva un audio más: 01 gancho, 02 intro, luego los ítems y al final el cierre.

## Archivos

| Archivo | Qué hace |
|---|---|
| `scripts/producir.mjs` | Todo el camino: voz → pieza → render → efectos → mezcla |
| `scripts/voz.mjs` | Voz por escena (carpeta propia, `say` o nada), recorte y medición → `tiempos.json` + `voz.wav` |
| `scripts/armar.mjs` | Junta json + estilo + maquetas + motor + fuentes en un HTML que funciona solo |
| `scripts/renderizar.mjs` | Chrome → cuadros → ffmpeg. También `--cuadros` (fotos sueltas) y `--hoja` (hoja de contacto) |
| `scripts/sonidos.mjs` | Efectos graves sintetizados + `node scripts/sonidos.mjs verificar <carpeta>` (mide los agudos) |
| `motor/estilo.css` | Fondo pastel, titular, barra, pastilla y primitivas (tarjeta, chip, pastillas, sellos) |
| `motor/maquetas.js` | La librería de maquetas: 16 tipos + mascota + `libre` |
| `motor/motor.js` | Arma las escenas, los tiempos y `draw(frame)` |
| `motor/cuaderno.css` · `motor/cuaderno.js` | Estilo «cuaderno»: papel cuadriculado, grupos, lista que se acumula, bocetos a lápiz y papelito |
| `motor/fuentes/` | Inter (variable), JetBrains Mono e Instrument Serif itálica, con licencia OFL |
| `referencias/MAQUETAS.md` | Los parámetros de cada maqueta |
| `ejemplo/escenas.json` | Demo «blinda tu app» (gancho + 5 ítems + cierre, unos 19 s) |
| `ejemplo/cuaderno/` | Demo del estilo cuaderno «tu contenido no vende» (3 grupos × 2 ítems, unos 28 s) |

## Errores comunes

- **«Falta playwright-core»**: corre `npm i` en la carpeta de la skill.
- **«Hay N escenas y M audios»**: la carpeta de voz necesita un audio por escena, contando el gancho y el cierre.
- **El titular ocupa 3 líneas o se achica mucho**: acorta el titular (lo ideal es de 3 a 6 palabras) y deja el detalle en la voz.
- **Una palabra del titular entra tarde**: el titular tiene que decir las mismas palabras que la voz; si no las encuentra, las reparte de forma pareja.
- **Sin Chrome**: playwright-core usa Chromium si lo instalas con `npx playwright install chromium`.
