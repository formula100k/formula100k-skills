# Ritmo, marca y serie

Cuatro cosas que suben la calidad de una pieza animada y que se deciden **antes** de animar. Este archivo es igual en
todas las skills de animación; cada SKILL.md dice qué parte aplica a su plantilla.

## 1. La música dirige el ritmo

Una animación se siente «hecha a medida» cuando lo grande pasa en el golpe fuerte de la música. No se pone la música
al final: se parte de ella.

Esta parte aplica en las skills que traen `golpes.mjs` (en `plantilla/` o en `scripts/`). Si la skill que estás usando
no lo trae, su SKILL.md explica por qué y qué hacer en su lugar.

**De dónde sale la pista.** La trae la persona: una pista propia o una libre de derechos que pueda usar. Estas skills
no incluyen música y no descargan pistas con derechos. Va en `assets/` de la pieza (mp3, wav, m4a o el audio de un mp4).

**Si la música se va a poner en Instagram** (un audio de la app), hay dos caminos y los dos dejan la pieza sin audio:

- tienes el archivo del audio (por ejemplo, de una grabación de pantalla): úsalo para medir y pon `mezclar: false`;
- solo sabes el tempo: pon `musica: { bpm: 120 }`. Los tiempos quedan sobre esa rejilla y, al publicar, se alinea el
  primer golpe del audio con el inicio del video.

**Cómo se mide.** `golpes.mjs` (Node + ffmpeg, sin instalar nada más) escucha la pista y escribe `golpes.json`:

```bash
node golpes.mjs analizar assets/pista.mp3            # tempo, golpes, golpes fuertes y secciones
node golpes.mjs ajustar golpes.json 2.8,5.4,9        # corre esos tiempos al golpe más cercano y dice cuánto movió cada uno
node golpes.mjs alinear golpes.json 3.4              # en qué segundo arrancar la pista para que un fuerte caiga en 3,4 s
node golpes.mjs rejilla --bpm 120 --duracion 20      # golpes a partir del tempo, sin pista
node golpes.mjs mezclar video.mp4 assets/pista.mp3 final.mp4 --inicio 0 --volumen 0.8   # pega la pista (--con-voz si el video ya trae voz)
```

Qué trae `golpes.json`: `bpm`, `golpes` (segundos), `fuertes` (el primer tiempo de cada compás, estimado por la energía
grave), `fuerza` de cada golpe (0 a 1), `secciones` (tramos donde la energía cambia mucho: entrada suave, subida) y
`notas` con avisos.

**Cómo se reparte:**

- la **revelación principal** cae en el primer golpe fuerte;
- el **crecimiento** (lo que se multiplica, se abre o se llena) en el siguiente golpe fuerte;
- los **acentos chicos** (una palabra, un sello, un cambio de pose) en los golpes intermedios;
- si la pista tiene una subida, el cambio de escena más grande va donde empieza la sección de energía alta.

**Límites que hay que decir en voz alta:**

- Los `fuertes` son una estimación. Si `golpes.mjs` avisa que no distingue el primer tiempo del compás, escucha la pista
  y corrige con `primerFuerte` (0 a 3) en la config o `--primer-fuerte` en la línea de comandos.
- Con tempo variable (música tocada en vivo, voz sin base) usa la lista de `golpes`, no una rejilla.
- Nadie escuchó el resultado: se sincroniza por tiempos. Pídele a la persona que lo oiga antes de publicar.
- Un video va a 30 cuadros por segundo: un cambio puede caer hasta medio cuadro (unos 17 ms) antes o después del golpe.
- Si la pieza lleva **voz**, manda la voz: los cortes siguen a las palabras y la música va debajo, más baja.

## 2. El archivo de marca incluye el movimiento

Antes de empezar, busca el `marca.md` de la persona (en su carpeta de trabajo o donde ella diga). Si no existe, copia
`references/marca.md`, hazle las preguntas que falten **en un solo mensaje** y déjaselo escrito para la próxima pieza.

Tiene tres partes que se usan siempre: **Color**, **Letra** y **Movimiento** (cuánto dura una entrada, cómo frena, si
rebota, si entra desenfocada, de qué lado entra, cuánto se sostiene y cómo sale). Color y letra van a los campos que
cada plantilla ya tiene; el movimiento va a los campos que la plantilla sepa leer (cada SKILL.md los lista) y, cuando
escribes la animación a mano, a las duraciones y curvas que elijas.

Si la plantilla no puede cumplir una regla de movimiento de la marca, dilo al entregar. No la ignores en silencio.

## 3. Biblia de estilo y momentos obligados (para lotes y series)

Cuando se hacen varias piezas que van juntas (una serie, un lote de la semana, las partes de un mismo reel), se
escribe **una** biblia antes de producir la primera y todas las piezas la cumplen. Media página, en `BIBLIA.md` junto a
las piezas:

- **Paleta:** los hex exactos y para qué se usa cada uno.
- **Letra:** titulares, apoyo, cómo se resalta.
- **Textura:** liso, grano, papel, cuadrícula.
- **Movimiento:** las filas de «Movimiento» de `marca.md`, ya decididas.
- **Música:** la pista o el tempo de la serie.
- **Momentos obligados:** lo que pasa en **todas** las piezas y en qué punto. Por ejemplo: «abre con el mismo gesto en
  el primer golpe fuerte», «la palabra clave entra con el mismo sello», «cierra con la firma en el mismo lugar durante
  el mismo tiempo».

Al terminar el lote, revisa cada pieza contra la lista de momentos obligados mirando sus cuadros, no de memoria. Una
pieza que se salta un momento obligado se corrige antes de entregar.

## 4. Cada referencia tiene un rol

Cuando la persona da más de una referencia (su propio trabajo, un reel que le gustó, una captura), no se mezclan a
ojo: se escribe **qué se toma de cada una** y se le enseña antes de producir.

> De mi trabajo toma **materiales y encuadre**. De la referencia toma **letra y jerarquía**. De ninguna tomes la paleta:
> esa sale de mi `marca.md`.

Roles posibles: paleta · letra · jerarquía (qué es grande y qué es chico) · encuadre · materiales y textura · ritmo ·
tipo de movimiento · estructura de escenas. Lo que no tiene dueño sale de `marca.md`.

De una cuenta ajena se copia la **mecánica** (ritmo, tipo de movimiento, estructura), nunca su paleta, su letra, sus
textos ni sus imágenes. Y una referencia se entiende mirando el video, no leyendo su descripción.
