// ──────────────────────────────────────────────────────────────────────
// CreaContenidoViral — keyword-driven reel preset
// ──────────────────────────────────────────────────────────────────────

export type TranscriptWord = {
  word?: string;  // captions.json field name
  text?: string;  // legacy alias
  start: number;
  end: number;
};

export type ReelHeader = {
  line1: string;
  line2: string;
  hideAfter?: number;  // segundo (en timeline del cut) a partir del cual el header desaparece
};

export type EmphasisCue = {
  keyword: string;
  text: string;
  startOffset?: number;
  duration?: number;
};

export type OverlayCue = {
  keyword: string;
  src: string;
  width?: number;
  duration?: number;
  position?: 'top' | 'bottom'; // default 'bottom'
};

export type BrollStyle = 'monitor-photo' | 'clean';

export type BrollCue = {
  keyword: string;
  src: string;
  duration?: number;
  style?: BrollStyle;
  /** Mitad del cuadro en el formato versus. Default 'a' (la de arriba). */
  lado?: 'a' | 'b';
};

// Imagen gancho del segundo 1 — sticker editorial que aparece brevemente
// al inicio del video sin tapar la cara.
export type HookCue = {
  src: string;
  start?: number;       // segundo en que aparece (default 0.3)
  duration?: number;    // default 2.2s
  position?: 'left' | 'right';  // default 'right'
  width?: number;       // default 360px
  rotation?: number;    // grados, default 3 (right) o -3 (left)
};

export type CreaContenidoViralProps = {
  videoSrc: string;
  transcript: TranscriptWord[];
  header: ReelHeader;
  emphasisCues: EmphasisCue[];
  overlayCues: OverlayCue[];
  brollCues: BrollCue[];
  hookCue?: HookCue | null;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  formato?: string;
  tema?: string;
  subtitulos?: boolean;
  /** Screen recording que hace de lienzo en el formato pip. */
  canvasSrc?: string;
  /** Esquina donde va el recuadro de cámara. Default 'tr' (ver pip.tsx). */
  pipEsquina?: 'tl' | 'tr' | 'bl' | 'br';
  /** Etiquetas de cada mitad en el formato versus. Default ANTES/AHORA. */
  versusEtiquetas?: {a: string; b: string};
  /** Lienzo animado de la pizarra (.mov/.webm con alfa) en el formato pizarra. */
  lienzoSrc?: string;
  /** Sujeto recortado sin fondo (.webm VP9 con alfa) en el formato pizarra. */
  cutoutSrc?: string;
};

// ──────────────────────────────────────────────────────────────────────
// TutorialFaceless — preset faceless (screen-rec + cards + captions cinéticos)
// ──────────────────────────────────────────────────────────────────────

export type KineticCaption = {
  text: string;
  start: number;  // segundos, absoluto sobre el audio cortado
  end: number;
};

export type HookCardCue = {
  src: string;
  duration?: number;  // default 3.0
};

export type BackgroundCue = {
  keyword: string;
  src: string;
  duration?: number;  // default 4.0
  style?: 'monitor' | 'fullscreen';  // default 'fullscreen'
};

export type CardCue = {
  keyword: string;
  src: string;
  width?: number;     // default 700
  duration?: number;  // default 2.4
  position?: 'center' | 'bottom' | 'top';  // default 'center'
  rotation?: number;  // grados, default 0
};

export type CtaCue = {
  src: string;
  duration?: number;  // default 3.5
};

export type CaptionsConfig = {
  enabled: boolean;
  position: 'center' | 'lower-third';
};

export type TutorialFacelessProps = {
  audioSrc: string;
  transcript: TranscriptWord[];
  kineticCaptions: KineticCaption[];
  hookCard: HookCardCue | null;
  background: BackgroundCue[];
  cards: CardCue[];
  broll: BrollCue[];
  cta: CtaCue | null;
  captionsConfig: CaptionsConfig;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
};

// ──────────────────────────────────────────────────────────────────────
// Despachador de formatos — props ya resueltas que consume cada componente
// registrado en `formatos/index.ts`.
// ──────────────────────────────────────────────────────────────────────

export type FormatoProps = CreaContenidoViralProps & {
  formato: string;
  tema: string;
  subtitulos: boolean;
};
