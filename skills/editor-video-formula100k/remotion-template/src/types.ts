// ──────────────────────────────────────────────────────────────────────
// CreaContenidoViral — keyword-driven reel preset
// ──────────────────────────────────────────────────────────────────────

export type TranscriptWord = {
  text: string;
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
};
