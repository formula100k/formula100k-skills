// Todo lo que cambia por pieza vive aquí. index.html NO se toca.
// En los textos: *palabra* = resaltada con el color de acento · _palabra_ = serif itálica.
// Cada visual es {emoji:"🥚"} o {img:"assets/huevo.png"} (PNG con fondo transparente).
window.CONFIG = {
  tema: {
    acento: "#E4572E",              // color de marca: resaltados, botón, cinta, barrido
    mantel: "rgba(228,87,46,.30)",  // color de los cuadros del mantel (el acento con transparencia)
    mantelFondo: "#FBF6EC",
    papel: "#F4EFE6",
    suave: "#F7D9C4",               // fondo de la escena final y segundo barrido
    tinta: "#1D1B19",
    kraft: "#C9A77A",
    rojo: "#C8372D"                 // sello y palabras escritas a mano
  },

  // MÚSICA (opcional). null = sin música, la pieza sale con sus tiempos de siempre (10,5 s).
  //   { archivo: "assets/pista.mp3" }   tu pista: los cambios de escena y los tres pasos caen en golpes, y se mezcla en el MP4
  //   { bpm: 120 }                      solo el tempo (p. ej. el de un audio de Instagram): ajusta los tiempos y sale sin audio
  // Extras: inicio (segundo de la pista en que arranca el video; por defecto su primer golpe fuerte), volumen (0 a 1),
  // mezclar: false (ajusta los tiempos pero no pega el audio), tolerancia (cuánto puede correrse un corte, en s; 0.6).
  // Después de tocar esto: node ajustar.mjs
  musica: null,

  // MOVIMIENTO de tu marca (opcional; sale de tu marca.md). null = el movimiento de la plantilla.
  //   { rebote: false, velocidad: 0.8, sostieneFinal: 2 }
  //   rebote: false = las entradas frenan suave, sin pasarse · velocidad: 1 normal, menos = entradas más lentas (0.6 a 1.6)
  //   sostieneFinal: segundos que se queda la última escena (1.5 por defecto; si lo cambias, corre node ajustar.mjs)
  movimiento: null,

  // Recortes de la persona (PNG sin fondo). Cualquiera puede ser null y la pieza funciona igual.
  personas: {
    portada: null,   // busto, de frente
    platos: null,    // cuerpo entero, angosto
    pasos: null      // busto o medio cuerpo
  },

  portada: {
    eyebrow: "Cocinando con Mari",
    titulo: "La receta",
    subtitulo: "de un bizcocho que *no se hunde*",
    boton: "▶ JUGAR"
  },

  platos: {
    titulo: "Elige tu _postre_",
    opciones: [                       // exactamente 3
      { emoji: "🍰", nombre: "Bizcocho", sub: "de vainilla" },
      { emoji: "🍪", nombre: "Galletas", sub: "de mantequilla" },
      { emoji: "🥖", nombre: "Pan", sub: "de masa madre" }
    ],
    elegido: 0,                       // 0, 1 o 2: cuál elige el dedo
    sello: "¡ESTE!"
  },

  pasos: [                            // exactamente 3; texto corto (hasta ~20 letras)
    { texto: "Bate los huevos",   ingrediente: { emoji: "🥚", etiqueta: "Huevos" }, palabra: "¡Zas!",   color: "#FBE9A8" },
    { texto: "Suma la harina",    ingrediente: { emoji: "🌾", etiqueta: "Harina" }, palabra: "Mezcla",  color: "#F2D58A" },
    { texto: "Hornea sin abrir",  ingrediente: { emoji: "🔥", etiqueta: "Horno" },  palabra: "¡Listo!", color: "#D9A34A" }
  ],

  final: {
    titulo: "¡Listo para _*servir*_!",
    tipo: "plato",                    // "plato" = emoji o imagen servida · "celular" = teléfono con una foto adentro
    emoji: "🍰",                      // o img: "assets/bizcocho.png"
    usuario: "@tu.usuario"
  }
};
