// Todo lo que cambia de una pieza a otra vive aquí. index.html no se toca.
// Después de cambiar un `dur`, las poses o `musica`: node ajustar.mjs (escribe la duración total y los tiempos).
// Lienzo: 1080 × 1920. x, y, ancho y alto van en píxeles de ese lienzo.
window.CONFIG = {
  cuadrosPorSalto: 4,        // 4 = 7,5 saltos por segundo (look stop motion). 3 = más nervioso, 5 = más lento
  semilla: 11,               // cambia el dibujo de estrellas, colinas y pinos
  fondo: "#14131c",

  // MÚSICA (opcional). null = sin música, todo sale con los tiempos de abajo.
  //   { archivo: "assets/pista.mp3" }   tu pista: los cortes de escenario caen en golpes fuertes, las poses en golpes, y se mezcla en el MP4
  //   { bpm: 120 }                      solo el tempo (p. ej. el de un audio de Instagram): ajusta los tiempos y sale sin audio
  // Extras: inicio (segundo de la pista en que arranca el video; por defecto su primer golpe fuerte), volumen (0 a 1),
  // mezclar: false (ajusta los tiempos pero no pega el audio), tolerancia (cuánto puede correrse un corte, en s; 0.6).
  // Después de tocar esto: node ajustar.mjs
  musica: null,

  // texto fijo encima de todo. *palabra* = resaltada · _palabra_ = serif itálica
  texto: {
    contenido: "mi perro ignorando que lo llamo porque está cuidando el jardín",
    estilo: "suelto",        // "suelto" (letra chica con sombra) o "etiqueta" (papel rasgado)
    y: 900, ancho: 640, tamano: 42, color: "#ffffff"
  },
  firma: null,               // { texto: "@tuusuario", color: "#fff" }
  apertura: { color: "#c9b8a6" },   // papel que se rasga al empezar; null = sin apertura

  // persona (o mascota, u objeto): null = la pieza funciona sin nadie al centro
  persona: { borde: 0, colorBorde: "#ffffff", meneo: 1.5, brinco: 10, cada: 2 },

  escenarios: [
    /* ── 1 · muelle de noche ── */
    {
      dur: 3.4,
      capas: [
        { id: "cielo",     forma: "plano", color: "#14131c" },
        { id: "estrellas", forma: "estrellas", color: "#f2d669", cantidad: 7, tamano: 74, x: 40, y: 70, ancho: 1000, alto: 720 },
        { id: "agua",      forma: "plano", patron: "ondas", color: "#3f7f98", color2: "rgba(255,255,255,.22)", y: 960, fibra: true },
        { id: "muelle",    src: "assets/muelle.png", x: 0, y: 1059, ancho: 1080 },
        { id: "colinas",   forma: "colinas", color: "#5c7d3c", x: 0, y: 770, ancho: 1080, alto: 200, en: 0.27, entra: "abajo", pasos: 2 },
        { id: "luna",      src: "assets/luna.png", x: 290, y: 150, ancho: 500, en: 0.67, entra: "arriba", pasos: 7 },
        { id: "pinos",     forma: "pinos", color: "#2d4a2f", cantidad: 7, x: 0, y: 640, ancho: 1080, alto: 190, z: 45, en: 1.73, entra: "pop" },
        { id: "nube1",     forma: "nube", x: -70, y: 600, ancho: 280, alto: 150, z: 46, en: 2.4, entra: "izquierda", pasos: 2, deriva: { x: 14 } },
        { id: "nube2",     forma: "nube", x: 880, y: 540, ancho: 300, alto: 160, z: 46, en: 2.67, entra: "derecha", pasos: 2, deriva: { x: -14 } }
      ],
      personaEntra: { en: 0.53, desde: "izquierda", pasos: 3 },
      poses: [
        { src: "assets/mascota-1.png", x: 540, pie: 1650, alto: 560, ancho: 310, dur: 1.2 },
        { src: "assets/mascota-2.png", x: 540, pie: 1650, alto: 700, ancho: 260, dur: 0.8 },
        { src: "assets/mascota-1.png", x: 540, pie: 1650, alto: 560, ancho: 310, dur: 0.9 }
      ]
    },

    /* ── 2 · sala ── */
    {
      dur: 3.0,
      capas: [
        { id: "pared",    forma: "plano", color: "#e3a98c", alto: 1360 },
        { id: "piso",     forma: "plano", patron: "tablas", color: "#b98a5e", tamano: 150, y: 1360, fibra: true },
        { id: "vista",    forma: "plano", color: "#8cc3e6", x: 330, y: 400, ancho: 420, alto: 760, grano: 0.25, en: 0.13 },
        { id: "nubecita", forma: "nube", x: 420, y: 560, ancho: 230, alto: 120, en: 0.13, deriva: { x: 6, cada: 2 } },
        { id: "ventana",  src: "assets/ventana.png", x: 205, y: 215, ancho: 670, en: 0.13, entra: "arriba", pasos: 2, sombra: true },
        { id: "alfombra", forma: "ovalo", color: "#efe2c6", x: 120, y: 1500, ancho: 840, alto: 250, en: 0.27, entra: "pop" },
        { id: "divan",    src: "assets/divan.png", x: 110, y: 1190, ancho: 860, en: 0.4, entra: "derecha", pasos: 3, sombra: true },
        { id: "planta1",  src: "assets/planta.png", x: -90, y: 1130, ancho: 340, en: 0.67, entra: "pop" },
        { id: "planta2",  src: "assets/planta.png", x: 830, y: 1180, ancho: 320, espejo: true, en: 0.8, entra: "pop" }
      ],
      personaEntra: { en: 0.53 },
      poses: [
        { src: "assets/mascota-4.png", x: 540, pie: 1700, alto: 400, ancho: 530, dur: 0.53 },
        { src: "assets/mascota-1.png", x: 620, pie: 1440, alto: 430, ancho: 240, dur: 0.53 },
        { src: "assets/mascota-3.png", x: 500, pie: 1445, alto: 330, ancho: 370, dur: 0.53 },
        { src: "assets/mascota-2.png", x: 330, pie: 1700, alto: 620, ancho: 230, dur: 0.53 },
        { src: "assets/mascota-4.png", x: 560, pie: 1440, alto: 330, ancho: 440, espejo: true, dur: 0.53 }
      ]
    },

    /* ── 3 · jardín de día ── */
    {
      dur: 2.6,
      capas: [
        { id: "cielo",   forma: "plano", color: "#a9d4ee" },
        { id: "sol",     forma: "ovalo", color: "#f6c94c", x: 700, y: 170, ancho: 260, alto: 260, en: 0.13, entra: "pop" },
        { id: "nube",    forma: "nube", x: 90, y: 260, ancho: 380, alto: 190, en: 0.27, entra: "izquierda", pasos: 2, deriva: { x: 10, cada: 2 } },
        { id: "colinas", forma: "colinas", color: "#7fa650", y: 900, alto: 330 },
        { id: "pinos",   forma: "pinos", color: "#3d6a3a", cantidad: 5, y: 700, alto: 260, en: 0.4, entra: "pop" },
        { id: "pasto",   forma: "plano", color: "#6f9a48", y: 1180, fibra: true },
        { id: "p1",      src: "assets/planta.png", x: 20, y: 1010, ancho: 360, en: 0.53, entra: "pop", vaiven: 2, cada: 3 },
        { id: "p2",      src: "assets/planta.png", x: 700, y: 980, ancho: 380, espejo: true, en: 0.8, entra: "pop", vaiven: 2, cada: 3 },
        { id: "p3",      src: "assets/planta.png", x: 380, y: 880, ancho: 320, en: 1.07, entra: "pop", vaiven: 2, cada: 3 }
      ],
      personaEntra: { en: 0.13 },
      poses: [
        { src: "assets/mascota-3.png", x: 540, pie: 1720, alto: 420, ancho: 470, dur: 0.4 },
        { src: "assets/mascota-2.png", x: 560, pie: 1720, alto: 680, ancho: 250, dur: 0.4 },
        { src: "assets/mascota-4.png", x: 520, pie: 1720, alto: 420, ancho: 560, dur: 0.4 },
        { src: "assets/mascota-1.png", x: 540, pie: 1720, alto: 540, ancho: 300, dur: 0.4 }
      ]
    }
  ]
};
