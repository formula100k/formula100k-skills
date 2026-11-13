---
name: galeria-animaciones-f100k
description: "Reel sin cara hecho con código, sin créditos: una ventana de chat donde aparecen una tras otra las animaciones o piezas que haces. Usar con «plantilla Galería de animaciones», «reel catálogo en un chat»."
argument-hint: [qué catálogo mostrar + la lista de items + palabra del CTA]
---

> 🔴 **PROTOCOLO DE CORTE OBLIGATORIO:** si el video lleva voz (la tuya o una clonada), ANTES de montar se sigue
> `~/.claude/skills/editor-video-formula100k/PROTOCOLO-CORTE.md`: preparar la toma, cortes con pase semántico,
> transcripción leída entera, escuchar el corte tramo por tramo y el sello del protocolo en NOTAS. Sin el sello, el video no está terminado.

# Galería de animaciones (reel sin cara, código puro)

Una ventana de chat donde, una tras otra, van apareciendo todas las cosas de tu catálogo. El ojo salta entre la vista previa
(que cambia cada medio segundo) y la lista (que marca en qué número vas), y el contador hace que la gente se quede a ver el
final. Todo se dibuja con código (canvas) y se renderiza gratis en tu compu: 1080×1920, 30 fps, unos segundos por reel.

## Antes de empezar: lo que necesita

Esta skill usa el renderizador de otra skill, que debe estar instalada **junto a esta** (misma carpeta de skills) o en `~/.claude/skills`.

| Skill | Qué usa de ella | ¿Viene en el paquete? |
|---|---|---|
| `animacion-dibujada-f100k` | `scripts/renderizar.mjs` | Sí (módulo Animación). La primera vez: `npm i` dentro de su carpeta |

Si falta, **dilo y detente**: no la sustituyas por otro script. Además: Node 18+, ffmpeg y Google Chrome.

## Tu brandkit (antes de producir)
Si la persona tiene brandkit, la pieza sale con su look. Búscalo y aplícalo como dice `references/tu-brandkit.md`.
En este estilo, su acento reemplaza el amarillo (línea ENORME, fila activa, barra de avance y palabra del CTA) y sus letras
pueden reemplazar las del título. La ventana de chat oscura y neutra se queda. Al entregar, di en una línea qué aplicaste.

## Qué te pido antes de empezar
1. **Qué catálogo muestras** y el título en 2 partes: una línea chica («toda una galería de», «todo lo que trae mi») y una
   palabra ENORME («ANIMACIONES», «PASTELES», «PLANTILLAS»). La línea ENORME es el gancho: 1 palabra, máximo 2.
2. **La lista**: de 9 a 30 cosas, con nombres cortos (2 a 3 palabras). Para cada una, **una foto o captura real** si la tienes
   (de tu carrete, tu tienda, tu app). Las que no tengan foto usan una mini animación dibujada.
3. **El pedido y la respuesta del chat**: lo que «pides» («Muéstrame todo lo que incluye el kit») y lo que «responde»
   («Listo. Aquí va cada uno:»). Frases tuyas, sin nombrar herramientas.
4. **Tu palabra de CTA**, ligada al tema y a tu regalo. No uses «YO».
5. **Voz o música (opcional).**

## Proceso
1. **Copia la plantilla** a una carpeta del proyecto: `plantilla/build.mjs`, `plantilla/galeria.html`, `plantilla/config.json`
   y `plantilla/fuentes/`. Pon las fotos en una subcarpeta (`fotos/`).
2. **Escribe `config.json`:**
   - Textos: `titulo_chico`, `titulo_grande`, `ventana` (el nombre de la ventana, ej. «tu estudio»), `pedido`, `respuesta`,
     `lista` (el rótulo sobre la lista).
   - `items`: uno por cosa, en orden. `{ "nombre": "Pastel de zanahoria", "imagen": "fotos/zanahoria.jpg" }` para una foto
     real, o `{ "nombre": "Ruta de entrega", "mini": "mapa", "texto": "Entrega en 2 horas" }` para una mini animación.
   - Minis disponibles y qué cambia su `texto`:
     | `mini` | Qué se ve | `texto` |
     |---|---|---|
     | `mapa` | ciudad en bloques y una ruta que se traza | la etiqueta de arriba |
     | `titular` | periódico con titular que entra por partes | «línea 1 / línea 2 / línea 3» (+ `cabecera`) |
     | `tablas` | letrero de tablas que giran hasta quedar fijas | hasta 4 palabras de hasta 7 letras |
     | `grafica` | curva que sube | la etiqueta (sin cifras inventadas) |
     | `plano` | casa en plano azul que se dibuja | el rótulo de abajo |
     | `suiza` | rejilla con bloques rojos y 3 palabras | las 3 palabras |
     | `avisos` | pantalla bloqueada con avisos que se apilan | «aviso 1 / aviso 2 / …» (hasta 5) |
     | `globo` | globo con arcos que salen de un punto | — |
     | `antesDespues` | cortina que barre de antes a después | «Grande / chico» |
   - Ritmo: `paso` = segundos por item (0,45 con minis; 0,6 a 0,8 con fotos para que se alcancen a ver), `t0` = cuándo
     entra el primero, `sosten` = pausa antes del CTA. Duración total = `t0 + paso × items + sosten + cta_dur`.
     Apunta a 12 a 20 s.
   - Cierre: `cta`, `comenta` (frase chica de arriba) y `cta_sub` (la de abajo, ej. «y te la mando»).
   - `acento`, `fondo`, `voz` y `musica` (rutas o `null`).
3. **Prueba rápida:** `node build.mjs --hoja` → `_revision.jpg` (un cuadro cada 0,4 s). Revisa con la lista de abajo.
   Para un video de prueba liviano: `node build.mjs --chico --out prueba.mp4` (540×960).
4. **Render completo:** `node build.mjs` → `reel.mp4`, `reel-hoja.jpg` (9 cuadros) y `reel-styleframe.jpg`.
   Si ya existe, usa `--out reel_v2.mp4`.
5. **Sonido:** un golpe sordo o un pop grave en cada cambio de fila, con filtro pasa-bajos a ~3 kHz. **Nada de clics de
   teclado, tecleo ni pitidos** (la referencia original trae un clic agudo: aquí no va). Música baja debajo.

## Lista de revisión (hoja de 9 cuadros)
1. ¿La línea ENORME del título se lee de un vistazo y va sin brillo ni degradado?
2. ¿Cada cambio de item salta con corte seco (fila activa sólida) y la lista sigue a la activa sin cortarse?
3. ¿Las fotos llenan la vista previa sin deformarse y se ve qué son?
4. ¿Algún nombre o texto se achicó demasiado o se cortó? Acórtalo.
5. ¿Hay cifras que no tienen fuente? Quítalas.
6. ¿El CTA es tu palabra, ocupa la vista previa y se queda quieto al final?
7. ¿En pantalla aparece el nombre de alguna herramienta, código o una marca ajena? Quítalo.

Si algo da «no», se corrige y se vuelve a pasar la lista.

## Reglas del estilo
- **Tres piezas fijas:** título arriba, ventana de chat al centro, vista previa a la izquierda y lista a la derecha.
- **Interfaz neutra:** sin logos ni nombres de apps; la marca del chat es un rombo de tu acento.
- **Un solo acento** (sin brillo): título, fila activa, barra de avance y CTA. Todo lo demás en grises.
- **Fotos reales primero:** lo que se nombra se muestra de verdad; las minis dibujadas son para lo que no tiene foto.
- **Cámara viva:** acercamiento continuo y deriva lenta hacia la vista previa. Nunca quieta, nunca temblando.
- **Ritmo rápido y parejo:** un item cada 0,45 a 0,8 s; nada rebota ni tiembla.
- **Contador visible** (06/09): es lo que hace que se queden hasta el final.

## Qué hay en la skill
| Ruta | Qué es |
|---|---|
| `plantilla/build.mjs` | Lee `config.json`, mete las fuentes, renderiza, mezcla voz o música y saca la hoja de 9 cuadros. |
| `plantilla/galeria.html` | Título, ventana de chat, vista previa (fotos o 9 minis), lista, contador, barra y CTA. |
| `plantilla/config.json` | Ejemplo genérico con las 9 minis y CTA «GUÍA». |
| `plantilla/fuentes/` | Inter, Barlow Condensed, Instrument Serif, JetBrains Mono y Lora (licencia OFL en `OFL.txt`). |
| `ejemplo/cuadros.jpg` | 9 cuadros del ejemplo resuelto. |
| `references/tu-brandkit.md` | Cómo buscar y aplicar su brandkit (sección 7: qué cambia en este estilo). |

## Errores que ya costaron un rechazo (no repetir)
- **Minis que no alcanzan a terminar:** a 0,45 s algunas apenas se ven. Con fotos o con minis de texto largo, sube `paso`.
- **Clic agudo en cada cambio:** fuera. Solo golpes sordos o pops graves.
- **Terminal con código en pantalla:** la ventana es un chat con frases normales, no una consola con comandos.
