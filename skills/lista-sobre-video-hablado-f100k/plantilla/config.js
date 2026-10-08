// ============================================================================
// LISTA SOBRE VIDEO HABLADO · lo único que se toca para hacer otro reel.
// Este archivo trae un EJEMPLO de repostería. Cambia textos, imágenes y colores
// por los tuyos. Los segundos (`t`) no se escriben a mano: los pone
// scripts/tiempos.mjs --escribir a partir de tu toma ya grabada.
// ============================================================================
window.CONFIG = {
  fps: 30,
  duracion: 40.3,               // segundos que dura la capa (lo ajusta tiempos.mjs)
  lado: 'izquierda',            // dónde va la LISTA. 'izquierda' = tú a la derecha · 'derecha' = versión espejo, tú a la izquierda

  acento: '#FF6B9A',            // un solo color de acento (número activo, palabra del rótulo, borde de la caja)
  estilo: {                     // opcional: borra lo que no quieras cambiar
    oscuro: '#2B1620',          // fondo del rótulo y de las etiquetas
    claro: '#FFF3E2',           // texto de las etiquetas, borde de las miniaturas, fondo de la caja de comentario
    borde: '#4A2A38',           // filete del rótulo
    sobreAcento: '#2B1620',     // texto que va encima del acento
    // fuente: '"Helvetica Neue", Arial, sans-serif',     // solo fuentes del sistema
    // fuenteCursiva: 'Georgia, serif',
  },

  // Rótulo fijo de arriba. *asteriscos* = palabra en el acento · _guiones_ = cursiva en el acento
  titulo: {
    lineas: ['*5 pasos* para que te', '_encarguen_ pasteles'],
    nota: '',                   // renglón chico debajo ('' = sin nota)
  },

  // Cada paso: en qué segundo lo dices, su nombre corto (1 o 2 palabras) y de 1 a 3 miniaturas.
  // Las miniaturas entran de una en una (primero grandes, luego se acomodan en la fila).
  // `rotulo` es opcional: una palabra pegada a la miniatura.
  pasos: [
    { t: 6.5, nombre: 'Especialidad', minis: [
      { src: 'img/1a-pastel.png' },
      { src: 'img/1b-cupcake.png' } ] },
    { t: 11.98, nombre: 'Clienta', minis: [
      { src: 'img/2a-cumple.png', rotulo: 'Cumpleaños' },
      { src: 'img/2b-boda.png', rotulo: 'Bodas' } ] },
    { t: 18.8, nombre: 'Menú', minis: [
      { src: 'img/3a-menu.png' },
      { src: 'img/3b-precio.png' } ] },
    { t: 24.27, nombre: 'Fotos', minis: [
      { src: 'img/4a-ventana.png' },
      { src: 'img/4b-camara.png' } ] },
    { t: 29.54, nombre: 'Pedidos', minis: [
      { src: 'img/5a-mensaje.png' },
      { src: 'img/5b-calendario.png' } ] },
  ],

  // Un número que late sin llenarse (para cuando lo nombras antes o después de su turno). [] = ninguno
  pulsos: [],

  // Subtítulo corto (2 o 3 palabras) del lado de tu cara. Opcional: si los subtítulos
  // los pones después en tu editor, deja `subs: []`.
  subs: [
    { t: 0.63, texto: 'si haces pasteles' },
    { t: 1.6, texto: 'riquísimos y casi' },
    { t: 2.76, texto: 'nadie te encarga' },
    { t: 4.21, texto: 'te faltan estos' },
    { t: 5, texto: 'cinco pasos' },
    { t: 6.5, texto: 'uno: especialidad' },
    { t: 8.22, texto: 'elige un solo' },
    { t: 9.04, texto: 'tipo de pastel' },
    { t: 9.92, texto: 'y hazte conocida' },
    { t: 10.9, texto: 'por ese' },
    { t: 11.98, texto: 'dos: clienta' },
    { t: 13.43, texto: 'decide para quién' },
    { t: 14.32, texto: 'horneas' },
    { t: 15.15, texto: 'un cumpleaños' },
    { t: 15.92, texto: 'infantil no se' },
    { t: 16.86, texto: 'vende igual que' },
    { t: 17.66, texto: 'una boda' },
    { t: 18.8, texto: 'tres: menú' },
    { t: 20.1, texto: 'tres tamaños' },
    { t: 21.35, texto: 'cada uno con' },
    { t: 22.04, texto: 'su nombre y' },
    { t: 22.66, texto: 'su precio' },
    { t: 23.2, texto: 'cerrado' },
    { t: 24.27, texto: 'cuatro: fotos' },
    { t: 25.72, texto: 'luz de ventana' },
    { t: 26.44, texto: 'y fondo liso' },
    { t: 27.63, texto: 'la foto es' },
    { t: 28.32, texto: 'tu vitrina' },
    { t: 29.54, texto: 'cinco: pedidos' },
    { t: 31.15, texto: 'un mensaje fijado' },
    { t: 32.2, texto: 'que diga cómo' },
    { t: 32.94, texto: 'encargar y con' },
    { t: 33.8, texto: 'cuánta' },
    { t: 34.2, texto: 'anticipación', hasta: 35.38 },
  ],

  sale: 36.28,                  // segundo en que se va la lista (y el rótulo)

  // La toma se acerca en el cierre, con movimiento suave. Lo aplica montar.js.
  // Bórralo y arranca solo 0,2 s después de `sale`. `acercar: false` = sin acercamiento.
  acercar: { t: 36.48, segundos: 1, escala: 1.25 },

  // Cierre: caja de comentario que se escribe sola.
  cta: {
    t: 37.48,
    antes: 'Comenta',
    palabra: 'MENÚ',
    despues: 'y te mando la plantilla',
    usuario: 'tu.pasteleria',
  },

  // Acomodo en píxeles del lienzo 1080×1920. Casi nunca hay que tocarlo.
  // Se escribe SIEMPRE como si la lista fuera a la izquierda: con lado 'derecha' se pasa solo al otro lado.
  acomodo: {
    yTitulo: 236,               // borde de arriba del rótulo
    yFin: 1500,                 // hasta dónde puede bajar la lista (debajo manda Instagram)
    xNumero: 132,               // los números se alinean a la derecha aquí
    xMinis: 154,                // donde arrancan las miniaturas
    anchoMax: 500,              // ancho máximo de una fila de miniaturas (más allá está tu cara)
    altoMini: 150,              // tope de alto de miniatura; se achica solo si hay muchos pasos
    foco: 2,                    // cuánto crece cada miniatura al entrar
    cadaMini: 1.0,              // segundos entre una miniatura y la siguiente de la misma fila
    xSubs: 800, ySubs: 1215,    // centro del subtítulo
    yCta: 1080,                 // borde de arriba del bloque de cierre
  },
};
