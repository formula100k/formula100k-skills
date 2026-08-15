import type {TranscriptWord} from './types';

export type CaptionChunk = {
  text: string;
  start: number;
  end: number;
  /** Palabra a resaltar dentro del chunk, tal cual aparece en el texto. */
  destacado?: string;
};

function palabra(w: TranscriptWord): string {
  return (w.text ?? w.word ?? '').trim();
}

/**
 * Agrupa word-timestamps en bloques cortos de subtítulo.
 * Corta al llegar a `maxPalabras` o cuando el hueco entre dos palabras
 * supera `maxPausa` segundos — así el subtítulo respeta la respiración.
 */
export function agruparCaptions(
  words: TranscriptWord[],
  maxPalabras = 3,
  maxPausa = 0.6,
): CaptionChunk[] {
  const chunks: CaptionChunk[] = [];
  let actual: TranscriptWord[] = [];

  const cerrar = () => {
    if (actual.length === 0) return;
    chunks.push({
      text: actual.map(palabra).join(' '),
      start: actual[0].start,
      end: actual[actual.length - 1].end,
    });
    actual = [];
  };

  for (const w of words) {
    if (!palabra(w)) continue;
    const anterior = actual[actual.length - 1];
    if (anterior && w.start - anterior.end > maxPausa) cerrar();
    actual.push(w);
    if (actual.length >= maxPalabras) cerrar();
  }
  cerrar();
  return chunks;
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Marca en cada chunk la primera palabra que coincida con alguna keyword. */
export function marcarDestacados(
  chunks: CaptionChunk[],
  keywords: string[],
): CaptionChunk[] {
  const objetivos = new Set(keywords.map(normalizar).filter(Boolean));
  return chunks.map((c) => {
    const hit = c.text.split(/\s+/).find((p) => objetivos.has(normalizar(p)));
    return hit ? {...c, destacado: hit} : c;
  });
}
