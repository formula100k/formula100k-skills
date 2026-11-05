// TODO lo que cambia por pieza vive aquí. No edites index.html.
// Después de cambiar algo:  node ajustar.mjs  →  hyperframes lint  →  hyperframes snapshot …  →  hyperframes render
window.CONFIG = {
  // TITULAR · una entrada por renglón. Aparece palabra por palabra.
  // Marcas por palabra:  *grande*   _chica_ (cursiva, se despega y sale volando)   ~acento~ (cursiva de color)   =resaltada=
  titular: [
    "¿Qué hay",
    "*detrás*",
    "_de un_ *pastel*",
    "_que_ *~enamora?~*"
  ],
  titularY: 640,            // centro vertical del titular (px sobre 1920)

  // OBJETOS QUE FLOTAN · PNG sin fondo. x, y = centro (lienzo 1080×1920). fondo: 0 lejos y lento → 1 cerca y rápido.
  // Déjalos en los bordes: el titular vive entre x 120–960, y 380–900.
  objetos: [
    { img: "assets/rodillo.png",   x: 250, y: 1330, ancho: 470, fondo: 0.25, giro: -24 },
    { img: "assets/fresa.png",     x: 960, y: 1180, ancho: 250, fondo: 0.4,  giro: 12 },
    { img: "assets/batidor.png",   x: 900, y: 300,  ancho: 400, fondo: 0.55, giro: 18 },
    { img: "assets/macaron.png",   x: 620, y: 1300, ancho: 290, fondo: 0.7,  giro: -8 },
    { img: "assets/croissant.png", x: 230, y: 170,  ancho: 380, fondo: 0.85, giro: -10 },
    { img: "assets/cupcake.png",   x: 860, y: 1640, ancho: 400, fondo: 1,    giro: 6 }
  ],
  deriva: { x: -50, y: -210 },   // hacia dónde deriva todo durante el titular (px)

  // CARPETA
  carpeta: { etiqueta: "Recetario", numero: "Vol. 1" },

  // RECORTES que salen de la carpeta (ideal 8–10). forma: "vertical" | "cuadrada" | "horizontal".
  // Sin imagen también funciona: { texto: "…", color: "#…" } o { emoji: "🍋", color: "#…" }.
  recortes: [
    { img: "assets/foto-pastel.jpg",   forma: "vertical" },
    { img: "assets/foto-masa.jpg",     forma: "cuadrada" },
    { texto: "Mantequilla fría, manos rápidas", color: "#F4D9A0", forma: "cuadrada" },
    { img: "assets/foto-macarons.jpg", forma: "vertical" },
    { img: "assets/foto-pan.jpg",      forma: "vertical" },
    { emoji: "🍋", color: "#CFE0B8", forma: "cuadrada" },
    { img: "assets/foto-tarta.jpg",    forma: "vertical" },
    { texto: "Horno listo antes de empezar", color: "#E9A6B0", forma: "cuadrada" },
    { img: "assets/foto-frascos.jpg",  forma: "vertical" }
  ],
  recorteBorde: 10,         // marco blanco de cada recorte (px). 0 = sin marco
  cinta: false,             // true o un color: pega cinta adhesiva en algunos recortes
  sello: "HECHO A MANO",    // rótulo que cae sobre el collage. null = sin rótulo
  persona: null,            // opcional: { img: "assets/yo.png", ancho: 560, alto: 900 } → sticker que sube al final del collage

  // MONITOR VIEJO
  monitor: { texto: "Cada receta empezó como un recorte suelto…" },

  // CAPTURA (opcional) · imagen o video de tu pantalla con garabatos encima. null = la pieza termina en el monitor.
  captura: {
    src: "assets/captura-ejemplo.mp4",
    texto: ["Así se ve", "*la vitrina* _de_ ~hoy~"],
    // trazo: "rough",   // opcional: dibuja los garabatos con trazo de lápiz (Rough.js). temblor: 0 a 3 (1.8 por defecto)
    // tipos: circulo {x,y,ancho,alto} · flecha {x,y,x2,y2} · subrayado {x,y,ancho} · estrella {x,y,ancho} · espiral {x,y,ancho}
    garabatos: [
      { tipo: "circulo",   x: 300, y: 720,  ancho: 470, alto: 430 },
      { tipo: "flecha",    x: 820, y: 1500, x2: 640, y2: 1280 },
      { tipo: "estrella",  x: 960, y: 520,  ancho: 100 },
      { tipo: "subrayado", x: 560, y: 1700, ancho: 400 },
      { tipo: "espiral",   x: 130, y: 1720, ancho: 130 }
    ]
  },

  // MÚSICA (opcional). null = sin música, la pieza sale con los `tiempos` de abajo.
  //   { archivo: "assets/pista.mp3" }   tu pista: cada cambio de parte cae en un golpe fuerte y se mezcla en el MP4
  //   { bpm: 120 }                      solo el tempo (p. ej. el de un audio de Instagram): ajusta los tiempos y sale sin audio
  // Extras: inicio (segundo de la pista en que arranca el video; por defecto su primer golpe fuerte), volumen (0 a 1),
  // mezclar: false (ajusta los tiempos pero no pega el audio), tolerancia (cuánto puede correrse un cambio, en s; 0.6).
  musica: null,

  // TIEMPOS de cada parte, en segundos
  tiempos: { titular: 5, carpeta: 1.8, collage: 3.6, monitor: 3.6, captura: 3.8 },

  // MARCA
  colores: {
    papel: "#EFE9DC", tinta: "#1F1B16", acento: "#B4472E", resalte: "#F4D9A0",
    carpeta: "#C8B08A", carpetaTinta: "#6B5A3E", pantalla: "#E9EEF6", garabato: "#FFFFFF"
  },
  fuentes: {                // solo fuentes del sistema
    titular: "Georgia,'Times New Roman',serif", pesoTitular: 400, tracking: "-0.03em",
    acento: "Georgia,'Times New Roman',serif",  pesoAcento: 400
  },
  semilla: 7                // cambia el número y cambia el acomodo del collage
};
