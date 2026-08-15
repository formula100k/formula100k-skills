// Tokens visuales. v1 trae dos temas: el look actual y el de la referencia
// editorial. No agregues más hasta que haga falta uno de verdad.

export type Tema = {
  fondo: string;
  texto: string;
  acento: string;
  cajaFondo: string;
  cajaTexto: string;
  fuenteDisplay: string;
  fuenteCuerpo: string;
  /** Grosor del trazo de contorno del texto display, en px. '0' lo apaga. */
  trazoTexto: string;
  /**
   * Color del texto de los SUBTÍTULOS (`Captions.tsx`) — separado de `texto`
   * porque el subtítulo no siempre cae sobre el mismo fondo que el resto del
   * tema. En `crema-editorial` el panel de la cara es video, no el papel
   * crema, así que el subtítulo necesita su propio contraste.
   */
  captionTexto: string;
  /** Grosor del trazo de contorno del subtítulo, en px. '0' lo apaga. Mismo
   *  mecanismo que `trazoTexto` (el color del trazo es siempre negro, fijado
   *  en `Captions.tsx`) pero con su propio valor por tema. */
  captionTrazo: string;
};

export const TEMAS: Record<string, Tema> = {
  default: {
    fondo: '#000000',
    texto: '#ffffff',
    acento: '#f59e0b',
    cajaFondo: '#ffffff',
    cajaTexto: '#111111',
    fuenteDisplay: 'Anton, sans-serif',
    fuenteCuerpo: 'Inter, sans-serif',
    trazoTexto: '6px',
    // Mismos valores que `texto`/`trazoTexto` — sin cambio visible respecto
    // a antes de que existieran estos tokens.
    captionTexto: '#ffffff',
    captionTrazo: '6px',
  },
  'crema-editorial': {
    fondo: '#f5f0e6',
    texto: '#1a1a1a',
    acento: '#f5c542',
    cajaFondo: '#f5c542',
    cajaTexto: '#1a1a1a',
    fuenteDisplay: 'Anton, sans-serif',
    fuenteCuerpo: 'Inter, sans-serif',
    trazoTexto: '0',
    // El subtítulo de `split` SIEMPRE cae sobre el panel de video (`SEAM_TOP`
    // queda por debajo de donde empieza la cara), nunca sobre el papel
    // crema — blanco con trazo negro, no el texto casi negro sin trazo que
    // usa el resto del tema.
    captionTexto: '#ffffff',
    captionTrazo: '6px',
  },
};

export function getTema(id: string): Tema {
  return TEMAS[id] ?? TEMAS.default;
}
