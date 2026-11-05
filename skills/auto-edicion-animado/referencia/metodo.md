# El método: de una frase a una escena que se entiende sin sonido

Lo que hace que un reel animado se vea hecho con cuidado y no con IA. Sale de estudiar formatos de explicados
animados que pasaron el millón de vistas y de las notas que más se repiten en una primera versión: «puede ser más
real, con más detalle, con más atención; tiene que ir a fondo».

## 1. El plan visual, antes de dibujar

`fuente/plan.md`. Primero, una vez para todo el reel:

- **La idea equivocada que se rompe**, en 5 palabras. Cada escena la rompe desde otro lado.
- **Un solo mundo, tres escalas**: por dentro (el corte, el interior), en la mano (el objeto) y alrededor (el lugar
  donde se vive). Se viaja entre las tres y se vuelve, para que nadie se pierda.
- **Un objeto hilo** que aparece en varias escenas y avanza: una llamada que no se puede contestar y cuyo botón se
  mueve recién al final, un comentario que se escribe de a poco. Es la barra de progreso del reel.
- **Lo invisible tiene UNA forma y UN color en todo el reel** (el acento de `mi-look.json`): la carga, la señal, el
  ruido. Todo lo demás conserva sus colores reales, así el acento es lo único que jala el ojo.

Después, una fila por escena:

| Escena | Sus palabras | La cosa real que se ve | De dónde sale la imagen | palabra → qué cambia |
|---|---|---|---|---|

- «cae en» si es un evento puntual en esa palabra; «termina en» si algo se arma y tiene que quedar listo justo ahí.
- **Prueba**: leída sola, de arriba abajo, la última columna cuenta el guion.
- **Cada vuelta al mismo mundo trae un protagonista nuevo** con otro encuadre. El mundo se repite; la imagen
  principal, nunca.
- Baja las referencias de cada escena a `fuente/refs/`, con nombre de lo que muestran.

**Crítica (un agente nuevo, una sola vez, antes de dibujar).** Lee el plan frase por frase y busca: una imagen
principal que repite otra, una metáfora donde existe la cosa real, una idea contada en vez de mostrada funcionando,
dos focos a la vez, una causa que dice la voz y la imagen no muestra, unos primeros 10 s flojos, una escena con pocas
referencias reales (baja más). Reescribe el plan ahí mismo. Es la única revisión de otro agente.

## 2. Mirar lo real antes de dibujar (cada escena)

1. **Abre cada referencia a tamaño completo y escribe lo que ves** en `fuente/notas/escena-NN.md`: las partes y
   cuántas son, los materiales, los rótulos y su letra, de dónde viene la luz, la escala, cómo se mueve en la vida
   real y **el detalle que delataría una imitación**.
2. **Piensa antes del código**, en la misma nota: qué detalles hacen que se vea real (los que alguien extrañaría solo
   si faltan), palabra → cambio, y **la prueba sin sonido**: qué entiende un desconocido solo con las imágenes. Si la
   escena podría ser de otro reel, piénsala de nuevo.
3. **Dibuja desde las referencias**, con su geometría y su texto reales, en capas: frente, protagonista, fondo. Donde
   la cosa real está hecha de miles de piezas chicas (píxeles, personas, mensajes), dibuja miles.

## 3. Reglas de imagen

- **Cosas reales, nunca un ícono genérico.** Cuando se nombra algo real, va su captura o su dibujo fiel.
- **Un cambio de estado le pasa al objeto que ya está en pantalla**: se recolorea, se abre, se rompe o crece. No se
  reemplaza por otro.
- **Una cifra nunca está quieta**: cuenta, rueda o se llena, y cae en su palabra.
- **Llena el escenario**: frente, protagonista, profundidad y un segundo movimiento detrás. Nunca un objeto chico
  sobre fondo vacío.
- **Cada patrón dice qué es**: lo que representa algo lleva su palabra al lado, chica y con línea guía.
- **Un foco a la vez**: grande y al centro primero; después se corre cuando llega lo demás.
- **Corta por dentro**: si el mecanismo está adentro, muestra adentro (el corte de lado, la carcasa transparente,
  las capas que se levantan como en un desarme).
- **El último plano es el primero, resuelto.**
- **Movimiento con sentido en casi cada palabra**: el mecanismo funcionando, no adorno. Nada quieto más de ~1 s; un
  plano sostenido sigue vivo con un empuje lento, luz que viaja o piezas chicas que trabajan. Sin tembladera, sin
  rebote, sin texto que vibra.
- **Cambio de escena**: solo en el silencio entre frases, en un solo movimiento, y nunca por fondo vacío.
- **Letra de menos de 32 px es textura, no prueba.** Si algo se tiene que leer: menos filas y más grandes.

**Se ve hecho con IA** (cada una fue rechazada en un reel real): píldoras o etiquetas con puntito, tarjetas con
número de paso, un titular que repite el subtítulo, filas de barras de colores para comparar (dibuja el objeto real),
apps o documentos inventados cuando existe el real, desenfoque o vidrio esmerilado como contenido, cuatro tarjetas a
la vez, líneas punteadas que conectan cosas, un objeto partido en dos de un tajo.

## 4. El gancho visual: la frase decodificada

Antes de dibujar el gancho, en `fuente/notas/escena-01.md` va una tabla: **cada palabra del gancho, la cosa real que
nombra y el verbo que se le hace al protagonista**. Después se construye como una sola transformación sobre un solo
protagonista: cada sustantivo entra como cosa real en su palabra y cada verbo se le hace físicamente.

- El cuadro 0 es la escena completa y ya se mueve. Nunca fondo vacío, un título solo o un objeto que espera.
- El mecanismo se juega una vez, chico y rápido, dentro del primer segundo. Después, algo nuevo cada 0,2 a 0,4 s.
- Un solo movimiento grande y con peso (profundidad, inercia, material) en la palabra clave. Después, el resultado
  se sostiene.
- Lo que pierde: una historia de pantallas de app, un montón de tarjetas, cámara acrobática en vez de la idea.

El texto del gancho golpe (línea chica + línea ENORME) va encima, como dice `auto-edicion/referencia/molde-guion.md`.

## 5. La voz en una sola toma

Una toma corrida suena a una persona hablando; una frase por pedido suena a frases pegadas. Por eso se pide el guion
entero en un solo audio y `scripts/partir-toma.mjs` lo corta en los silencios entre frases: Whisper ubica cada
palabra y el corte se lleva al silencio medido más cercano. Si la voz encadena dos frases sin pausa (pasa seguido con
ElevenLabs), corta en el punto más callado entre las dos palabras, porque Whisper suele cerrar la última palabra antes
de tiempo y el corte se comía «grande» → «gran». Después del corte, transcribe cada pedazo y confirma que empieza y
termina entero.

- Un punto al final de cada frase, para que haya silencio donde se corta.
- Cifras en letras y el CTA en minúscula.
- Si sale una palabra mal dicha, se pide la toma entera de nuevo. Nunca se parcha una frase suelta.

## 6. La revisión con máquina

`scripts/revisar.mjs <mp4> --guion fuente/pieza.src.html` falla si:
- algo queda **quieto más de 1,2 s** (sin contar el cierre);
- hay **2 o más cuadros con el escenario vacío** (un cambio de escena que pasa por fondo liso);
- el **cuadro 0 está casi vacío**, o **no cambia nada entre 0 y 2 s**.

Y avisa si la parte de abajo del escenario (y 1080–1470) queda vacía en más de la mitad del reel, o si la pieza tiene
letra de menos de 32 px (termina la línea con `// textura` si es a propósito).

También informa el ritmo en palabras por segundo y deja `apertura.jpg` (0 · 0,5 · 1 · 1,5 · 2 s). No reemplaza
mirar: después del revisor se miran los cuadros al lado de las referencias.

## 7. La pasada rica

Cuando ya funciona, una pasada más a propósito: más detalle real, más cosas pasando, más profundidad, más atención a
lo chico (un reflejo, un rótulo, un cable, un segundo movimiento detrás del primero). Es la pasada que la persona
pediría si no se hace. Sin tocar las palabras, los tiempos ni los cambios de escena.
