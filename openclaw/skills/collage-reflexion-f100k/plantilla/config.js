// config.js — TODO lo que cambia de una reflexión a otra vive aquí. El HTML y el motor no se tocan.
// Lienzo 1080 × 1920. Las posiciones `x`, `y` son el CENTRO de la pieza en píxeles.
// `en` = cuándo entra una pieza: una palabra de la frase del bloque ('seis') o segundos desde que
// empieza el bloque (0.8). Si no pones `en`, cada renglón entra cuando la voz dice su primera palabra.
// Detalle de cada tipo de bloque: references/bloques.md
window.CONFIG = {
  nombre: 'muestra',                 // nombre del MP4
  audio: 'voz/narracion.wav',        // la voz (grabada o generada)
  fps: 30,
  cola: 1.6,                         // segundos que se sostiene el cierre después de la última palabra
  mostrarPendientes: true,           // false = esconde los avisos amarillos de «PENDIENTE»

  colores: {                         // los nombres se usan en `plano` y en `color`
    papel: '#F6F1E7', tinta: '#2A211B',
    acento: '#C8553D',               // palabra clave y planos fuertes
    acento2: '#8FB8A8',              // segundo plano y palabra clave sobre foto
    suave: '#F1D9C9', alerta: '#C8553D',
  },
  fuentes: {                         // fuentes del sistema; para fuentes web pon la URL del CSS en `web`
    sans: "'Avenir Next','Helvetica Neue',Arial,sans-serif", peso: 900, tracking: '-.04em',
    serif: "Georgia,'Times New Roman',serif", serifItalica: false,
    minusculas: true, web: null,
  },

  bloques: [
    // 1 · toma: clip (o foto) a pantalla completa. Se congela en blanco y negro en «seis» y sigue en «abrí»
    { id: 'apertura', tipo: 'toma', frase: 'Hace seis años abrí mi panadería.',
      recurso: { clip: 'amasado' }, congela: { en: 'seis', hasta: 'abrí' },
      texto: [{ t: 'hace', letra: 'serif', tam: 'm' }, { t: '6', tam: 'gigante', color: 'acento2' }, { t: 'años', tam: 'l' },
              { t: 'abrí mi panadería', letra: 'serif', tam: 'm', y: 1420 }] },

    // 2 · sticker: plano liso + recorte de la persona + tarjetas de dato que se le pegan
    { id: 'plazo', tipo: 'sticker', frase: 'Me di un año para vivir solo del pan.', plano: 'acento',
      persona: { img: 'assets/silueta.svg', x: 540, y: 1290, ancho: 560 },
      tarjetas: [{ tipo: 'calendario', arriba: 'días', valor: '365', x: 830, y: 980, giro: 9, en: 'año' },
                 { tipo: 'contador', valor: '1', etiqueta: 'local propio', x: 250, y: 1400, giro: -7, en: 'vivir' }],
      texto: [{ t: 'me di', tam: 'l' }, { t: 'un año', letra: 'serif', tam: 'm' }, { t: 'para vivir', tam: 'm' }, { t: 'solo del pan', letra: 'serif', tam: 'm' }] },

    // 3 · bandeja: llega por rodillos con el inventario (las piezas sin `en` vienen montadas)
    { id: 'inventario', tipo: 'bandeja', frase: 'Un año después tenía cuarenta clientes fijos, un horno nuevo y tres recetas propias.',
      plano: 'papel', bandeja: { color: 'acento2' },
      piezas: [{ tipo: 'calendario', arriba: 'días', valor: '365', x: 500, y: 190, giro: -6 },
               { tipo: 'contador', valor: '40', etiqueta: 'clientes fijos', x: 260, y: 430, giro: -5, en: 'cuarenta' },
               { tipo: 'objeto', img: 'assets/croissant.png', ancho: 300, x: 480, y: 640, giro: 8, en: 'horno' },
               { tipo: 'contador', valor: '3', etiqueta: 'recetas propias', x: 300, y: 790, giro: 5, en: 'tres' }] },

    // 4 · eco: el bloque anterior queda borroso y sin color detrás del texto
    { id: 'pero', tipo: 'eco', frase: 'Y la caja seguía igual de vacía.', zona: 'centro',
      texto: [{ t: 'y la caja', letra: 'serif', tam: 'm' }, { t: 'seguía igual', tam: 'l' }, { t: 'de vacía', tam: 'xl', color: 'acento2' }] },

    // 5 · franja: negro + foto o clip en franja + serif arriba, palabra gigante, serif abajo
    { id: 'decepcion', tipo: 'franja', frase: 'Hornear más no era el problema.',
      recurso: { foto: 'assets/foto-frascos.jpg' }, arriba: 'hornear', palabra: 'más', abajo: 'no era el problema' },

    // 6 · carpeta: el cursor la abre, salen las fichas y se tachan en «nada»
    { id: 'intentos', tipo: 'carpeta', frase: 'Probé descuentos, combos y volantes. Nada movió la aguja.', plano: 'suave',
      fichas: ['descuentos', 'combos', 'volantes'], tacha: 'nada',
      texto: [{ t: 'probé', tam: 'l' }, { t: 'nada movió la aguja', letra: 'serif', tam: 'm', color: 'acento' }] },

    // 7 · apilado: el giro. Sin `texto`, la frase se parte sola y cada renglón entra con su palabra
    { id: 'giro', tipo: 'apilado', frase: 'Lo que sí cambió todo fue algo que nunca planeé.', recurso: { clip: 'horno' } },

    // 8 · capturas: una grabación de pantalla (clip) o una captura dentro de un celular
    { id: 'pantalla', tipo: 'capturas', frase: 'Empecé a grabar cómo amaso cada madrugada.', plano: 'acento2',
      celular: { clip: 'pantalla', x: 540, y: 1180, ancho: 440 },
      texto: [{ t: 'empecé a grabar', tam: 'm' }, { t: 'cómo amaso', letra: 'serif', tam: 'm' }, { t: 'cada madrugada', tam: 'm' }] },

    // 9 · capturas: imágenes reales (mensajes, panel) que caen como tarjetas
    { id: 'mensajes', tipo: 'capturas', frase: 'Y la gente empezó a escribirme.', fondo: { foto: 'assets/foto-masa.jpg' }, velo: .5,
      cartas: [{ img: 'assets/captura-mensaje-1.png', ancho: 640, x: 450, y: 860, giro: -4 },
               { img: 'assets/captura-mensaje-2.png', ancho: 640, x: 630, y: 1160, giro: 3 },
               { img: 'assets/captura-mensaje-3.png', ancho: 640, x: 460, y: 1470, giro: -2 }],
      texto: [{ t: 'y la gente', letra: 'serif', tam: 'm' }, { t: 'empezó a escribirme', tam: 'm', color: 'acento2' }] },

    // 10 · contenedor: entra cerrado y se abre con 1 a 3 piezas adentro
    { id: 'prueba', tipo: 'contenedor', frase: 'En tres meses, los pedidos por mensaje pasaron de cuatro a treinta por semana.', plano: 'papel',
      contenedor: { abre: 'pedidos', y: 1120, ancho: 420 },
      adentro: [{ tipo: 'calendario', arriba: 'meses', valor: '3', x: 500, y: 930, giro: -6 },
                { tipo: 'contador', valor: '4 → 30', etiqueta: 'pedidos por semana', x: 560, y: 1240, giro: 5, en: 'cuatro' }],
      texto: [{ t: 'en tres meses', letra: 'serif', tam: 'm' }, { t: 'los pedidos', tam: 'l', color: 'acento' }, { t: 'por mensaje', letra: 'serif', tam: 'm' }] },

    // 11 · toma con foto: la primera mitad de la regla
    { id: 'regla', tipo: 'toma', frase: 'La gente no compra pan.', recurso: { foto: 'assets/foto-pan.jpg', zoom: .06 }, zona: 'centro',
      texto: [{ t: 'la gente', letra: 'serif', tam: 'm' }, { t: 'no compra', tam: 'l' }, { t: 'pan', tam: 'xl', color: 'acento2' }] },

    // 12 · remate: el cuadro anterior congelado en blanco y negro + mayúsculas
    { id: 'remate', tipo: 'remate', frase: 'Le compra a quien ve amasarlo.', sigue: true, zona: 'centro',
      texto: ['le compra', 'a quien', 've amasarlo'] },

    // 13 · cierre: «Comenta PALABRA…» + regalo
    { id: 'cierre', tipo: 'cierre', frase: 'Comenta HORNO y te mando la lista de lo que puedes grabar en tu taller.', plano: 'acento2',
      palabra: 'HORNO', promesa: ['y te mando la lista', 'de lo que puedes grabar'],
      persona: { img: 'assets/silueta.svg', x: 320, y: 1420, ancho: 480 }, regalo: { x: 790, y: 1400 } },
  ],
};
