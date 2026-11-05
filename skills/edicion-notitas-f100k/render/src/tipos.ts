// Props ya resueltas (segundos del video cortado). El PLAN.json que escribe
// el agente se ancla por frase; scripts/render.ts lo traduce a esto.

export type Palabra = {w: string; start: number; end: number; amarilla?: boolean};

export type ZonaSub = {
  desde: number;
  x: number;
  y: number;
  alinear?: 'izq' | 'der' | 'centro';
  oculto?: boolean;
};

export type Camara = {
  desde: number;
  hasta: number;
  zoom?: number;
  /** Punto de anclaje del zoom en % del cuadro (default 50 / 38 = la cara). */
  ox?: number;
  oy?: number;
  bn?: boolean;
  marco?: boolean;
};

export type Gancho = {
  lineas: string[];
  // «golpe» (21-oct, patrón Devin Jatho): una línea enorme (`grande` = su índice) y la otra
  // chica en blanco. 23-oct: sin brillo, corte seco y letra de diseño según el tema
  // (`letra`, default condensada). Sin `estilo` = serif de siempre.
  estilo?: 'golpe';
  grande?: number;
  letra?: 'condensada' | 'serif' | 'palo' | 'editorial';
  chica?: 'serif' | 'sans';
  sub?: string;
  subDesde?: number;
  fuente?: 'serif' | 'mano';
  color?: string;
  tamano?: number;
  y?: number;
  hasta: number;
};

export type Nota = {
  desde: number;
  hasta: number;
  texto: string;
  x: number;
  y: number;
  rot?: number;
  tamano?: number;
  color?: string;
  fuente?: 'mano' | 'serif';
  escribe?: boolean;
  recuadro?: boolean;
};

export type Sticker = {
  desde: number;
  hasta: number;
  src?: string;
  emoji?: string;
  tipo?: 'meme' | 'captura' | 'logo';
  x: number;
  y: number;
  w?: number;
  rot?: number;
  /** Cifra grande en serif debajo de la imagen (ej. «426K»). */
  numero?: string;
  /** Número en un círculo amarillo en la esquina de arriba (contador del catálogo). */
  insignia?: string;
  /** Rótulo a mano debajo de la imagen. */
  rotulo?: string;
};

/** Elemento de una lámina: texto, imagen o las dos; aparece en su segundo. */
export type ItemLamina = {t: number; texto?: string; img?: string; tachado?: boolean; check?: boolean};

/**
 * Lámina de papel a pantalla completa para explicar: un flujo de pasos,
 * una lista, un mockup con capturas reales o un antes/después. Se dibuja a mano
 * y queda quieta (23-oct: sin el temblor de garabato).
 */
export type Lamina = {
  desde: number;
  hasta: number;
  tipo: 'flujo' | 'lista' | 'mockup' | 'comparar';
  titulo?: string;
  items: ItemLamina[];
  /** mockup: marco de la imagen (celular por defecto). */
  marco?: 'celular' | 'ninguno';
  /** mockup con celular: ancho del celular en px (540 por defecto). Más ancho = el celular arranca bajo el título y la notita va debajo. */
  ancho?: number;
  /** comparar: si está, ancho de cada captura (px) y columnas desde arriba. tenue: la columna se ve apagada antes de su `en`. */
  tenue?: boolean;
  /** comparar: rótulos de las 2 columnas. */
  rotulos?: [string, string];
  semilla?: number;
};

/**
 * Mockup de lo que se nombra (19-oct): el prompt pegado en el chat de Claude,
 * la skill que se instala, la nota de voz que suena, la carpeta que se llena,
 * el post publicado o el chat de WhatsApp. Tarjeta pegada con cinta sobre el
 * video. Los tiempos internos (`accion`, `tiempos`, `envia`, `respuestaEn`)
 * van en segundos DESDE QUE ENTRA la tarjeta (render.ts los traduce).
 */
export type Mockup = {
  desde: number;
  hasta: number;
  tipo: 'prompt' | 'guion' | 'skill' | 'voz' | 'chat' | 'carpeta' | 'post_ig';
  x?: number;
  y?: number;
  w?: number;
  rot?: number;
  /** prompt: el texto real · skill: su nombre · carpeta: su etiqueta · post_ig: el caption. */
  texto?: string;
  sub?: string;
  titulo?: string;
  icono?: string;
  avatar?: string;
  usuario?: string;
  imgs?: string[];
  items?: string[];
  mensajes?: {de: 'yo' | 'otro'; texto: string}[];
  /** Rótulo a mano arriba de la tarjeta («tu prompt», «la skill»). */
  rotulo?: string;
  /** prompt: se pega de golpe (default) o se teclea. */
  pegar?: boolean;
  accion?: number;
  tiempos?: number[];
  envia?: number;
  respuesta?: string;
  respuestaEn?: number;
  segundos?: number;
  duracion?: number;
  hora?: string;
  /** Lo calcula render.ts: la tarjeta pisa la franja del subtítulo. */
  tapaSub?: boolean;
};

export type Sfx = {t: number; archivo: string; vol?: number; dur?: number};

export type NotitasProps = {
  video: string;
  palabras: Palabra[];
  zonas: ZonaSub[];
  tamanoSub: number;
  // color de las palabras clave del subtítulo (default amarillo de la casa)
  colorClave?: string;
  // tramos [ini, fin] con escena a pantalla completa horneada: sin degradado de arriba
  ventanasLimpias?: [number, number][];
  camara: Camara[];
  gancho: Gancho | null;
  notitas: Nota[];
  stickers: Sticker[];
  laminas: Lamina[];
  mockups: Mockup[];
  sfx: Sfx[];
  duracionFrames: number;
};
