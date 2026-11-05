// Lo único que se edita para hacer un video nuevo. Después: node armar.mjs
// Ejemplo: «El tribunal de las 12 IAs». Cambia frases, encabezados, elenco y textos por los de tu tema.
window.CONFIG = {
  id: "tribunal-de-cubitos",
  titulo: "El tribunal de las 12 IAs",
  usuario: "",          // tu usuario; sale chico en la última escena. Vacío = no sale
  cola: 1.2,            // segundos de aire después de la última palabra
  ritmo: 0.75,          // solo sin voz: 1 = hablado normal, menos = más rápido
  voz: { id: "ef_dora", idioma: "es", velocidad: 1.05 },   // solo para la voz provisional (--voz-ia)

  // Colores. `acento` es tu color de marca; `cubo` es el color de los bichitos.
  tema: {
    acento: "#E0A03A", tinta: "#f4f1ea", papel: "#f4f1ea",
    noche: "#07060d", pared: "#1a1533", butaca: "#2b2350", alfombra: "#4a2470",
    madera: "#4a2c1c", madera2: "#24160f", luz: "#ffd98a",
    cubo: "#d9603a", si: "#3ecf8e", no: "#ef4444",
  },

  cartel: "TU *IDEA*",   // letrero de la baranda (y de la hoja del plano «sello»)
  mascota: "gato",       // mascota de los planos de papel: "gato" o "bichito"

  // Las 12 butacas, de adelante hacia atrás (0 a 3 = fila de adelante, la que sale en «papeles»).
  // tipo: "bichito" | "gato" · gorro: tapa, bombin, audifonos, pelo, visera, gorra, mono, boina, corona, antena, peluca
  // objeto: calculadora, guante, lupa, telefono, moneda, corazon · dientes: true · color / colorGorro: hex
  elenco: [
    { gorro: "visera", objeto: "calculadora" }, { gorro: "antena" }, { gorro: "mono", dientes: true, objeto: "corazon" }, { gorro: "boina", colorGorro: "#17171c", objeto: "guante" },
    { gorro: "gorra" }, { gorro: "bombin" }, { gorro: "audifonos" }, { gorro: "tapa" },
    { gorro: "boina" }, { dientes: true }, { gorro: "pelo" }, { gorro: "antena", dientes: true },
  ],
  duelo: { izq: { gorro: "boina", colorGorro: "#17171c", perlas: true }, der: { gorro: "tapa", corbata: true, traje: "#2b2350" } },
  jefe: { tipo: "gato", gorro: "corona", cadena: true },

  // Una frase por escena. *Así* se marca la palabra clave (sale en serif dorada).
  // `en`, `giroEn`, `abreEn`… aceptan una palabra de la frase (pasa cuando la voz la dice) o segundos.
  escenas: [
    { plano: "tribuna", encabezado: "12 Claudes *juzgan* tu idea",
      frase: "Armé un tribunal donde 12 Claudes llevan tu idea a *juicio*." },
    { plano: "sello", encabezado: "Claude dice que *sí* a todo", sello: "¡SÍ!", mascota: "bichito",
      diploma: { titulo: "SÍ A TODO", sub: "del mes" },
      frase: "Porque Claude le dice que *sí* a todo lo que dices." },
    { plano: "duelo", encabezado: "A favor y *en contra*",
      frase: "Así que lo puse a *discutir* consigo mismo." },
    { plano: "alegato", lado: "izq", texto: "FRACASA", ok: false, en: "fracasar", encabezado: "A favor y *en contra*",
      frase: "Un Claude argumenta que tu idea va a *fracasar*" },
    { plano: "alegato", lado: "der", texto: "FUNCIONA", ok: true, en: "funcionar", encabezado: "A favor y *en contra*",
      frase: "y otro argumenta que va a *funcionar*." },
    { plano: "votacion", si: "INOCENTE", no: "CULPABLE", aFavor: 7, en: "votan", giroEn: "sin", encabezado: "12 votos *secretos*",
      frase: "Luego 12 jurados leen los dos lados y votan culpable o inocente, sin ver el voto de los *demás*." },
    { plano: "apagon", en: "juzga", encabezado: "Cada jurado tiene *un papel*",
      frase: "Y ojo: cada jurado la juzga como alguien *distinto*:" },
    { plano: "papeles", encabezado: "Cada jurado tiene *un papel*",
      quienes: [{ asiento: 0, gesto: "teclea" }, { asiento: 2, gesto: "brinca", en: "clienta" }, { asiento: 3, gesto: "golpea", en: "competencia" }],
      frase: "una contadora, una clienta o tu *competencia*." },
    { plano: "marcador", encabezado: "Se acabó el *sí a todo*", barra: "veredicto", urna: "VOTOS",
      izq: { texto: "CULPABLE", n: 5 }, der: { texto: "INOCENTE", n: 7 }, sello: "honesta", selloEn: "honesta",
      frase: "Así por fin recibes una respuesta *honesta*." },
    { plano: "jefe", encabezado: "El juez *decide*", abreEn: "veredicto", mazoEn: "decisión",
      tarjeta: { eyebrow: "veredicto", lineas: ["¡HAZLA", "ya!"], ok: true },
      frase: "Luego el juez lee el veredicto y toma la *decisión*." },
    { plano: "edificio", encabezado: "100% *gratis*", rotulo: "TRIBUNAL", sello: "gratis",
      etiqueta: { chico: "revisión de tu idea", grande: "DE PAGO" }, cortaEn: "gratis", entraEn: "probar",
      frase: "Lo bueno es que es totalmente *gratis* y lo puedes probar ahora mismo." },
    { plano: "comentario", encabezado: "Comenta *JUICIO*", palabra: "JUICIO",
      frase: "Comenta *JUICIO* y te lo mando." },
  ],
};
