import {staticFile} from 'remotion';
import type {
  BrollCue,
  EmphasisCue,
  OverlayCue,
  TranscriptWord,
} from '../types';

export const MIN_OVERLAY_VISIBLE_SECONDS = 1.2;
export const DEFAULT_OVERLAY_DURATION = 3.0;
export const DEFAULT_BROLL_DURATION = 3.5;

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9áéíóúñü ]+/gi, '')
    .trim();

export const resolveSrc = (src: string): string => {
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  // Cualquier otro path se sirve desde public/ vía staticFile.
  // Si necesitas un archivo absoluto, cópialo a public/ antes.
  return staticFile(src.replace(/^\/+/, ''));
};

function getWordText(w: TranscriptWord): string {
  return w.word ?? w.text ?? '';
}

export function findKeywordTime(
  transcript: TranscriptWord[],
  keyword: string
): number | null {
  const target = normalize(keyword);
  if (!target) return null;
  const targetWords = target.split(/\s+/).filter(Boolean);
  if (targetWords.length === 1) {
    // Single word — fast path: check each word
    for (const w of transcript) {
      if (normalize(getWordText(w)).includes(target)) return w.start;
    }
  } else {
    // Multi-word phrase — build sliding window over transcript
    for (let i = 0; i <= transcript.length - targetWords.length; i++) {
      const phrase = transcript
        .slice(i, i + targetWords.length + 1)
        .map(w => normalize(getWordText(w)))
        .join(' ');
      if (phrase.includes(target)) return transcript[i].start;
    }
    // Fallback: match just the first word of the keyword
    for (const w of transcript) {
      if (normalize(getWordText(w)).includes(targetWords[0])) return w.start;
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────
// Resolved cue shapes (timestamps computed from keywords)
// ──────────────────────────────────────────────────────────────────────

export type ResolvedEmphasis = {
  text: string;
  start: number;
  end: number;
  auto?: boolean;
};

export type ResolvedOverlay = {
  src: string;
  width: number;
  start: number;
  end: number;
  position?: 'top' | 'bottom';
};

export type ResolvedBroll = {
  src: string;
  start: number;
  end: number;
  style: 'monitor-photo' | 'clean';
  /** Sólo lo lee `versus`; los demás formatos lo ignoran. Default 'a'. */
  lado: 'a' | 'b';
};

export function resolveEmphasis(
  cues: EmphasisCue[],
  transcript: TranscriptWord[]
): ResolvedEmphasis[] {
  return cues
    .map((c): ResolvedEmphasis | null => {
      const t = findKeywordTime(transcript, c.keyword);
      if (t === null) return null;
      const start = t + (c.startOffset ?? 0);
      const end = start + (c.duration ?? 1.6);
      return {text: c.text, start, end};
    })
    .filter((x): x is ResolvedEmphasis => x !== null)
    .sort((a, b) => a.start - b.start);
}

export function resolveOverlays(
  cues: OverlayCue[],
  transcript: TranscriptWord[]
): ResolvedOverlay[] {
  return cues
    .map((c): ResolvedOverlay | null => {
      const t = findKeywordTime(transcript, c.keyword);
      if (t === null) return null;
      return {
        src: resolveSrc(c.src),
        width: c.width ?? 420,
        start: t,
        end: t + (c.duration ?? DEFAULT_OVERLAY_DURATION),
        position: c.position ?? 'bottom',
      };
    })
    .filter((x): x is ResolvedOverlay => x !== null);
}

export function resolveBroll(
  cues: BrollCue[],
  transcript: TranscriptWord[]
): ResolvedBroll[] {
  const resolved = cues
    .map((c): ResolvedBroll | null => {
      const t = findKeywordTime(transcript, c.keyword);
      if (t === null) return null;
      return {
        src: resolveSrc(c.src),
        start: t,
        end: t + (c.duration ?? DEFAULT_BROLL_DURATION),
        style: c.style ?? 'monitor-photo',
        lado: c.lado ?? 'a',
      };
    })
    .filter((x): x is ResolvedBroll => x !== null)
    .sort((a, b) => a.start - b.start);

  // Clamp overlapping entries: each broll ends when the next one starts.
  //
  // El clamp es POR LADO a propósito. En `versus` las dos mitades se ven a la
  // vez — ese es el formato entero — así que un cue del lado B no debe cortar
  // al del lado A. Para el resto de los formatos todo cae en el lado 'a' por
  // default, y el comportamiento es idéntico al de antes.
  for (const lado of ['a', 'b'] as const) {
    const idx = resolved
      .map((c, i) => (c.lado === lado ? i : -1))
      .filter((i) => i >= 0);
    for (let k = 0; k < idx.length - 1; k++) {
      const cur = idx[k];
      const next = idx[k + 1];
      if (resolved[cur].end > resolved[next].start) {
        resolved[cur] = {...resolved[cur], end: resolved[next].start};
      }
    }
  }
  return resolved;
}

// Si un overlay choca con uno o más emphasis y queda visible menos de
// MIN_OVERLAY_VISIBLE_SECONDS, lo desplaza al final del último emphasis
// solapado para que conserve su duración completa. Si tras varios shifts
// sigue sin alcanzar el mínimo visible, se descarta — preferimos no
// mostrar un overlay flasheando 0.5s.
export function shiftOverlaysAroundEmphasis(
  overlays: ResolvedOverlay[],
  emphasis: ResolvedEmphasis[]
): ResolvedOverlay[] {
  const sortedEmphasis = [...emphasis].sort((a, b) => a.start - b.start);

  const visibleSeconds = (start: number, end: number): number => {
    let visible = 0;
    let cursor = start;
    for (const e of sortedEmphasis) {
      if (e.end <= cursor || e.start >= end) continue;
      if (e.start > cursor) visible += e.start - cursor;
      cursor = Math.max(cursor, e.end);
      if (cursor >= end) return visible;
    }
    if (cursor < end) visible += end - cursor;
    return visible;
  };

  return overlays
    .map((o) => {
      const cueDuration = o.end - o.start;
      let cur = o;
      for (let iter = 0; iter < 5; iter++) {
        const visible = visibleSeconds(cur.start, cur.end);
        if (visible >= MIN_OVERLAY_VISIBLE_SECONDS) break;
        const overlapping = sortedEmphasis.filter(
          (e) => e.start < cur.end && e.end > cur.start
        );
        if (overlapping.length === 0) break;
        const latestEnd = Math.max(...overlapping.map((e) => e.end));
        cur = {...cur, start: latestEnd, end: latestEnd + cueDuration};
      }
      return cur;
    })
    .filter((o) => visibleSeconds(o.start, o.end) >= MIN_OVERLAY_VISIBLE_SECONDS);
}

// Cada emphasis aparece EXACTAMENTE UNA VEZ en su keyword.
// No auto-recap — el usuario lo pidió explícitamente.
