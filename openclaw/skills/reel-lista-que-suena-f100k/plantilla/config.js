// TODO lo que cambia de una pieza a otra vive aquí. index.html no se toca.
// Ejemplo: plantas de interior según la luz de tu casa (4 categorías × 3 ítems).
window.CONFIG = {
  archivo: "reel-plantas-por-luz",          // nombre del MP4 de salida, sin extensión

  titulo: { linea1: "Plantas de interior", linea2: "según la luz de tu casa", alineacion: "izquierda" }, // linea2 puede ser null
  firma: "@tucuenta",                        // null = sin firma
  firmaY: 1640,

  // Cada categoría: nombre en la lista, icono del disco (solo se ve si un ítem no trae carátula),
  // frase que dice la voz y hasta 3 ítems.
  // Ítem: nombre, autor (segunda línea, opcional), etiqueta (opcional), caratula (ruta de imagen o null),
  // inicio (segundo del archivo de audio donde empieza su fragmento; solo lo usa mezclar.mjs).
  categorias: [
    { nombre: "Sol directo", icono: "☀️", frase: "Si a tu ventana le da el sol directo, pon una de estas.", items: [
      { nombre: "Aloe vera",       autor: "Aloe barbadensis",        etiqueta: "riego escaso",   caratula: "caratulas/01-aloe-vera.png", inicio: 0 },
      { nombre: "Árbol de jade",   autor: "Crassula ovata",          etiqueta: "riego escaso",   caratula: "caratulas/02-arbol-de-jade.png", inicio: 0 },
      { nombre: "Echeveria",       autor: "Echeveria elegans",       etiqueta: "riego escaso",   caratula: "caratulas/03-echeveria.png", inicio: 1 },
    ]},
    { nombre: "Luz brillante sin sol", icono: "🌤️", frase: "Si entra mucha luz, pero sin sol directo, estas.", items: [
      { nombre: "Monstera",        autor: "Monstera deliciosa",      etiqueta: "riego moderado", caratula: "caratulas/04-monstera.png", inicio: 0 },
      { nombre: "Ficus lira",      autor: "Ficus lyrata",            etiqueta: "riego moderado", caratula: "caratulas/05-ficus-lira.png", inicio: 0 },
      { nombre: "Pilea",           autor: "Pilea peperomioides",     etiqueta: "riego moderado", caratula: "caratulas/06-pilea.png", inicio: 2 },
    ]},
    { nombre: "Luz media", icono: "⛅", frase: "Para un cuarto con luz media, estas.", items: [
      { nombre: "Potus",           autor: "Epipremnum aureum",       etiqueta: "riego moderado", caratula: "caratulas/07-potus.png", inicio: 0 },
      { nombre: "Cinta",           autor: "Chlorophytum comosum",    etiqueta: "riego moderado", caratula: "caratulas/08-cinta.png", inicio: 0 },
      { nombre: "Calatea",         autor: "Goeppertia orbifolia",    etiqueta: "riego frecuente", caratula: "caratulas/09-calatea.png", inicio: 0 },
    ]},
    { nombre: "Poca luz", icono: "🌙", frase: "Y si casi no entra luz, estas aguantan.", items: [
      { nombre: "Sansevieria",     autor: "Dracaena trifasciata",    etiqueta: "riego escaso",   caratula: "caratulas/10-sansevieria.png", inicio: 0 },
      { nombre: "Zamioculca",      autor: "Zamioculcas zamiifolia",  etiqueta: "riego escaso",   caratula: "caratulas/11-zamioculca.png", inicio: 0 },
      { nombre: "Aspidistra",      autor: "Aspidistra elatior",      etiqueta: "riego moderado", caratula: null, inicio: 0 }, // sin carátula a propósito: dibuja el disco
    ]},
  ],

  // Cierre: una o más pantallas, cada una con su frase de voz.
  // Campos visuales (todos opcionales): grande (_así_ va en pequeño), linea, palabra (va en el recuadro), cursiva.
  cierre: {
    ocultarLista: false,                     // true = al cierre desaparecen título y lista
    pantallas: [
      { frase: "Estas son doce. La guía completa trae treinta plantas, ordenadas por luz y por riego.",
        grande: "12 _de_ 30", linea: "La guía completa,", cursiva: "ordenada por luz y por riego.", alineacion: "izquierda" },
      { frase: "Comenta la palabra plantas y te la mando.",
        linea: "Comenta", palabra: "PLANTAS", cursiva: "y te la mando", alineacion: "centro" },
    ],
  },

  filas: {
    entrada: "una-a-una",                    // "una-a-una" (como la referencia) | "juntas" (las tres carátulas desde que arranca la categoría)
    alTerminar: "atenuar",                   // qué pasa con el nombre del ítem que ya sonó: "atenuar" | "ocultar"
    indicador: "onda",                       // "onda" | "barra" | "ninguno" (usa "barra" si tu lista no suena)
    resaltarCategoria: true,                 // franja de color detrás de la categoría activa
  },

  tiempos: {                                 // en segundos
    fragmento: 2.0,                          // cuánto dura cada ítem en pantalla (y su fragmento de audio)
    arranque: 0.3,                           // antes de la primera categoría
    antes: 0.15,                             // entre que se escribe la categoría y empieza la voz
    pausa: 0.35,                             // entre el fin de la frase y el primer ítem
    cola: 0.2,                               // después del tercer ítem
    colaFinal: 1.6,                          // después de la última frase del cierre
  },

  mezcla: {                                  // solo para mezclar.mjs
    bajoLaVoz: 8,                            // cuántos dB por debajo de la voz queda cada fragmento
    fundido: 0.15,                           // fundido de entrada y de salida
  },

  colores: {
    fondo: "#f4f6ef", fondo2: "#dfe6d6",     // centro y borde del fondo (iguales = liso del todo)
    tinta: "#1d2a22",
    acento: "#8fd16a",
    tapas: ["#1d2a22", "#8fd16a", "#f2c9a0"],// fondo de la tapa cuando no hay carátula
    selloDisco: "#f4f6ef",
  },
  fuentes: {                                 // solo fuentes del sistema: las externas se caen al renderizar
    sans: '-apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif',
    serif: "Georgia,serif",
  },
  adornos: { cinta: true, grano: true, cuadricula: false },
};
