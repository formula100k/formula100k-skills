# Biblioteca de B-roll

Los clips y fotos de la persona (su día, su oficina, su producto, sus viajes), descritos una sola vez para encontrarlos por tema en cada video. Vive en `~/Documents/mi-contenido/b-roll/` y sirve para todos sus proyectos.

## Armarla (una vez, y cada vez que tenga clips nuevos)
```
node K/scripts/broll.mjs agregar "<carpeta o archivo>" …
node K/scripts/broll.mjs pendientes
```
`agregar` copia cada clip a la biblioteca (si lo borra de Descargas, igual queda) y saca una hoja con 3 cuadros. Los repetidos los salta solo.

Después, por cada pendiente:
1. Mira su hoja de cuadros.
2. Describe lo que SE VE, no lo que imaginas: quién aparece, qué hace, dónde y si es de día o de noche.
3. Pon de 3 a 6 etiquetas por tema (trabajo, ciudad, cocina, cliente, producto…).

```
node K/scripts/broll.mjs describir b003 "trabajando en la laptop en una oficina, escribiendo" trabajo,laptop,oficina
```

## Usarla en un video
1. Por cada frase que nombra algo que se puede ver, busca: `node K/scripts/broll.mjs buscar "<la frase>"`. Sale ordenado del que más va al que menos.
2. Elige solo si el clip muestra de verdad lo que se dice. Si no hay ninguno que vaya, no fuerces: usa una captura real o deja a la persona en pantalla.
3. Para usar uno, corre `node K/scripts/broll.mjs usar "P" b003`. Lo copia al proyecto y te da la línea `"broll"` para esa escena de `plano.json`.
4. El B-roll va encima de la persona y debajo de los gráficos. Sin `x, y, w, h` ocupa toda la pantalla; con una caja, la persona se sigue viendo alrededor.
5. En la pieza, deja verde (`hueco`) la zona del B-roll.

Reglas:
- Solo clips que grabó la persona o que te dio. Nunca de stock ni descargados de otra cuenta.
- Un B-roll dura lo que la frase, de 1,5 a 4 s.
- No repitas el mismo clip en un video.
- Ve `lista` para ver toda la biblioteca.
