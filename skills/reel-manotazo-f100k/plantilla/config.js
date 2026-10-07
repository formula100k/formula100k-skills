// TODO lo que cambia por pieza vive aquí. index.html no se toca.
window.CONFIG = {
  /* ── La toma ─────────────────────────────────────────────── */
  clip: null,               // "assets/clip.mp4" = tu toma vertical con el manotazo. null = fondo sustituto (solo para probar)
  clipInicio: 0,            // segundo del clip donde empieza el reel (para recortar el arranque)
  duracion: 7,              // segundos que dura el reel. Con clip: no más que (duración del clip − clipInicio)
  manotazo: 3.4,            // segundo del manotazo EN EL CLIP (lo imprime scripts/detectar-manotazo.mjs). Ahí cambia todo
  conservarAudio: true,     // true = el reel lleva el audio original del clip
  volumen: 1,               // 0 a 1

  // Solo se usa cuando clip es null: una foto fija y una mancha de color que cruza el cuadro imitando la mano
  fondoSustituto: {
    foto: "assets/fondo-sustituto.jpg",
    fotoDespues: null,      // opcional: otra foto para después del manotazo (como si fuera otra toma)
    mancha: "#E8B9A0",      // color de la «mano»
    color: "#3A3A3A"        // color de fondo si no hay foto
  },

  /* ── Antes del manotazo: el problema ─────────────────────── */
  antes: {
    quien: "Clienta:",
    texto: "necesito 9 publicaciones para el sábado y solo tengo una foto del ramo",
    imagen: "assets/antes.jpg",   // UNA imagen. null = solo texto
    y: 660,                 // altura a la que empieza el texto (0 = arriba, 1920 = abajo)
    ancho: 520,             // ancho de la tarjeta, en px
    aspecto: "1/1",         // forma de la tarjeta: "1/1", "4/5", "9/16"…
    ajuste: "contain",      // "contain" = la imagen entera · "cover" = llena la tarjeta y recorta
    relleno: 0              // aire entre la imagen y el borde de la tarjeta
  },

  /* ── Después del manotazo: el resultado ──────────────────── */
  despues: {
    quien: "Yo:",
    texto: "dame cinco minutos",
    imagenes: [             // de 1 a 9. Con 1 → una sola grande · 2 a 4 → dos columnas · 5 a 9 → tres columnas
      "assets/despues-1.jpg", "assets/despues-2.jpg", "assets/despues-3.jpg",
      "assets/despues-4.jpg", "assets/despues-5.jpg", "assets/despues-6.jpg",
      "assets/despues-7.jpg", "assets/despues-8.jpg", "assets/despues-9.jpg"
    ],
    y: 330,                 // altura a la que empieza el texto
    ancho: 810,             // ancho de la cuadrícula. Si no cabe a lo alto, se encoge sola
    columnas: null,         // null = automático · o fuerza 1, 2 o 3
    limiteInferior: 1560    // la cuadrícula nunca baja de aquí (debajo van los botones de Instagram)
  },

  /* ── Aspecto ─────────────────────────────────────────────── */
  estilo: {
    fuente: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif",  // solo fuentes del sistema
    peso: 800,
    tamano: 64,
    espaciado: "-.01em",    // separación entre letras
    color: "#FFFFFF",
    sombra: true,           // sombra oscura detrás del texto para que se lea sobre la toma
    fuenteQuien: null,      // otra fuente para «Clienta:» / «Yo:» (p. ej. "Georgia,serif"). null = la misma
    estiloQuien: "normal",  // "italic" para ponerlo en cursiva
    etiquetaFondo: null,    // color de fondo detrás de «Clienta:» / «Yo:». null = sin etiqueta
    etiquetaColor: null,    // color de esas dos palabras
    tarjetaFondo: "#FFFFFF",
    tarjetaBorde: 0,        // marco de la tarjeta «antes», en px
    tarjetaRadio: 0,
    tarjetaGiro: 0,         // grados de inclinación de la tarjeta «antes»
    cinta: null,            // color de una cinta adhesiva sobre la tarjeta. null = sin cinta
    separacion: 0,          // espacio entre celdas de la cuadrícula, en px
    celdaAspecto: "4/5",    // forma de cada celda: "1/1" cuadrada, "4/5" publicación, "9/16" historia
    celdaAjuste: "cover",
    celdaRadio: 0
  },

  /* ── El golpe del cambio ─────────────────────────────────── */
  golpe: {
    escala: 1.16,           // la cuadrícula entra un poco más grande y se asienta. 1 = sin golpe
    sacudida: 16,           // px de sacudida lateral. 0 = sin sacudida
    cuadros: 4              // cuántos cuadros dura (3 o 4)
  },

  firma: null,              // p. ej. "@tuusuario". null = sin firma
  firmaY: 1620
};
