// Ejemplo · escenas scrapbook a pantalla completa (cartón + recortes), horneadas en la base ANTES de las notitas.
// Copia este archivo a <carpeta-escenas>/config.js, pon las fotos en <carpeta-escenas>/fotos/ y reemplaza PALABRAS
// por las de tu captions.json (formato: w = palabra, a = inicio, b = fin, en segundos del video cortado).
// `cuadros` lo escribe hornear.mjs solo. `cuando` / `hasta` = frases que se dicen; x, y = centro de la pieza.
window.CFG = {
  cuadros: 0, subtitulos: false, quieto: true, escalaEscena: 1.35, escalaToma: 1.3, titulo: '',
  piezas: [
    // A · el lugar del que habla: foto real + etiqueta + sello
    {cuando: 'abrí mi local', tipo: 'escena', hasta: 'primer día', finMas: 0.3, hijos: [
      {cuando: 'abrí mi local', tipo: 'foto', foto: 'local.jpg', ancho: 429, x: 330, y: 640, rot: -5},
      {cuando: 'abrí mi local', tipo: 'etiqueta', texto: 'mi local<small>DÍA 1</small>', x: 700, y: 470, rot: 4},
      {cuando: 'primer día', tipo: 'sello', texto: 'abierto', x: 720, y: 980, rot: -4},
    ]},
    // B · lo que cuesta: foto + precio + letrero
    {cuando: 'me costó', tipo: 'escena', hasta: 'pero valió la pena', finMas: 0.2, hijos: [
      {cuando: 'me costó', tipo: 'foto', foto: 'producto.jpg', ancho: 400, x: 540, y: 660, rot: -3},
      {cuando: 'me costó', tipo: 'precio', texto: '$120', x: 330, y: 1000, rot: -4},
      {cuando: 'valió la pena', tipo: 'etiqueta mano', texto: 'valió la pena', x: 640, y: 1240, rot: 4},
      {cuando: 'valió la pena', tipo: 'letrero', texto: 'LO VOLVERÍA A HACER', x: 540, y: 1420, rot: -2},
    ]},
  ],
};
window.PALABRAS = [
  {"w": "Hace", "a": 0.0, "b": 0.2}, {"w": "un", "a": 0.2, "b": 0.3}, {"w": "año", "a": 0.3, "b": 0.6},
  {"w": "abrí", "a": 0.7, "b": 1.0}, {"w": "mi", "a": 1.0, "b": 1.1}, {"w": "local.", "a": 1.1, "b": 1.6},
  {"w": "El", "a": 1.8, "b": 1.9}, {"w": "primer", "a": 1.9, "b": 2.2}, {"w": "día", "a": 2.2, "b": 2.6},
  {"w": "no", "a": 2.7, "b": 2.8}, {"w": "vino", "a": 2.8, "b": 3.0}, {"w": "nadie.", "a": 3.0, "b": 3.5},
  {"w": "Todo", "a": 3.8, "b": 4.0}, {"w": "me", "a": 4.0, "b": 4.1}, {"w": "costó", "a": 4.1, "b": 4.5},
  {"w": "120", "a": 4.6, "b": 5.1}, {"w": "dólares,", "a": 5.1, "b": 5.5}, {"w": "pero", "a": 5.7, "b": 5.9},
  {"w": "valió", "a": 5.9, "b": 6.2}, {"w": "la", "a": 6.2, "b": 6.3}, {"w": "pena.", "a": 6.3, "b": 6.8},
];
