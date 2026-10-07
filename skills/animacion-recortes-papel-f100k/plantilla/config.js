// Lo ÚNICO que se edita por pieza. Después: node armar.mjs
// En «frase» y en los textos: *palabra* la resalta con el color de acento, _palabra_ la pone en serif itálica.
// «en» (y desde, hasta, apagaEn…) = la palabra de la frase en la que ocurre la acción, o segundos desde el inicio de la escena.
window.CONFIG = {
  id: "recortes",
  titulo: "De mirar a comprar",
  usuario: "@tutiendadeplantas",
  cola: 1.6, // segundos de aire después de la última palabra
  voz: { id: "ef_dora", idioma: "es", velocidad: 1 }, // solo para --voz-ia
  tema: { acento: "#F4D35E", papel: "#F5F0E6", tinta: "#1B1A17", rosa: "#F6D5DC", azul: "#BFD0F5", salvia: "#B9CFA8" },

  escenas: [
    {
      encabezado: "De mirar a *comprar*",
      frase: "Una clienta nueva pasa por *tres* *momentos* antes de comprarte.",
      fondo: "papel",
      piezas: [
        { tipo: "tienda" },
        { tipo: "numeros", en: "tres", saltaEn: "comprarte" },
        { tipo: "personaje", x: 435, y: 985, tam: 96, en: 0.5 },
      ],
    },
    {
      encabezado: "Momento 1 · *Te descubre*",
      frase: "Primero te *descubre*: ve algo tuyo y se *detiene*.",
      fondo: "azul",
      piezas: [
        { tipo: "piso", y: 1130 },
        { tipo: "vitrina" },
        { tipo: "personaje", x: 385, y: 694, lleva: "iman" }, // el imán: lo que hace que se detengan
        { tipo: "gente", modo: "pasan", n: 2 },
        { tipo: "gente", modo: "llega", en: "detiene" },
      ],
    },
    {
      encabezado: "Momento 2 · *Te pregunta*",
      frase: "Después te *pregunta*: quiere saber si eso es para ella.",
      fondo: "rosa",
      piezas: [
        { tipo: "medidor", etiqueta: "INTERÉS", desde: "quiere", hasta: "ella" },
        { tipo: "gente", modo: "cliente", x: 170, y: 760, mira: "der" },
        { tipo: "personaje", x: 720, y: 700, tam: 110, mira: "izq" },
        { tipo: "mostrador" },
        { tipo: "globo", x: 120, y: 640, texto: "¿Es para mí?", en: "pregunta" },
      ],
    },
    {
      encabezado: "Momento 3 · *Decide*",
      frase: "Y al final *decide*: necesita ver el precio y cómo *pedirlo*.",
      fondo: "salvia",
      piezas: [
        { tipo: "piso", y: 1180, color: "kraft" },
        { tipo: "caja", pantalla: "EL PRECIO", pantallaEn: "precio", cajonEn: "pedirlo" },
        { tipo: "personaje", x: 20, y: 830, tam: 92, lleva: "bolsa" }, // la bolsa: lo que vende
        { tipo: "gente", modo: "cliente", x: 860, y: 880, tam: 150, v: 3, lleva: "moneda", mira: "izq" },
        { tipo: "etiqueta", x: 610, y: 420, texto: "ASÍ SE PIDE", en: "cómo", rot: 4 },
        { tipo: "sello", x: 340, y: 810, texto: "PEDIDO", en: "pedirlo" },
      ],
    },
    {
      encabezado: "Solo fotos = *solo miradas*",
      frase: "Si solo publicas fotos bonitas, se queda en el *primero*.",
      fondo: "noche",
      piezas: [
        { tipo: "piso", y: 1150, color: "tinta" },
        { tipo: "vitrina", x: 50, y: 470, ancho: 470, alto: 520, marco: "kraft", rayos: false, pedestal: false },
        { tipo: "personaje", x: 175, y: 540, tam: 70, lleva: "iman" },
        { tipo: "caja", x: 700, y: 700, escala: 0.57, apagada: true },
        { tipo: "gente", modo: "fila", n: 5 },
        { tipo: "ojos", en: "bonitas" },
        { tipo: "etiqueta", x: 735, y: 560, texto: "CERRADO", tam: 46, en: 0.9, rot: -5, mece: true },
        { tipo: "sello", x: 556, y: 860, texto: "SIN PEDIDOS", tam: 56, en: "primero", rot: -8 },
      ],
    },
    {
      encabezado: "Un video para *cada uno*",
      frase: "Dale un video a cada *momento* y guarda esta lista.",
      fondo: "papel",
      piezas: [
        { tipo: "lista", items: [
          { texto: "Uno para que te *descubra*", en: "video" },
          { texto: "Uno que *responda* su duda", en: "cada" },
          { texto: "Uno con precio y *cómo pedir*", en: "guarda" },
        ] },
        { tipo: "personaje", x: 448, y: 980, tam: 84, en: 0.3 },
      ],
    },
  ],
};
