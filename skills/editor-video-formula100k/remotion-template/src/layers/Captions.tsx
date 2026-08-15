import React from 'react';
import {AbsoluteFill, Sequence, spring, useCurrentFrame} from 'remotion';
import type {CaptionChunk} from '../captionUtils';
import type {Tema} from '../temas';

export const Captions: React.FC<{
  chunks: CaptionChunk[];
  fps: number;
  position: 'center' | 'lower-third' | 'seam';
  tema: Tema;
  /** Sólo para position 'seam': píxeles desde arriba. */
  seamTop?: number;
}> = ({chunks, fps, position, tema, seamTop = 800}) => (
  <>
    {chunks.map((c, i) => {
      const from = Math.round(c.start * fps);
      const frames = Math.max(1, Math.round((c.end - c.start) * fps));
      return (
        <Sequence key={i} from={from} durationInFrames={frames}>
          <CaptionWord chunk={c} fps={fps} position={position} tema={tema} seamTop={seamTop} />
        </Sequence>
      );
    })}
  </>
);

const CaptionWord: React.FC<{
  chunk: CaptionChunk;
  fps: number;
  position: 'center' | 'lower-third' | 'seam';
  tema: Tema;
  seamTop: number;
}> = ({chunk, fps, position, tema, seamTop}) => {
  const frame = useCurrentFrame();
  const pop = spring({frame, fps, config: {stiffness: 320, damping: 26}});

  const contenedor: React.CSSProperties =
    position === 'seam'
      ? {justifyContent: 'flex-start', alignItems: 'center', paddingTop: seamTop}
      : {
          justifyContent: position === 'center' ? 'center' : 'flex-end',
          alignItems: 'center',
          paddingBottom: position === 'center' ? 0 : 360,
        };

  const partes = chunk.text.split(/\s+/);

  return (
    <AbsoluteFill style={contenedor}>
      <div
        style={{
          fontFamily: tema.fuenteCuerpo,
          fontWeight: 800,
          fontSize: 84,
          color: tema.captionTexto,
          WebkitTextStroke: tema.captionTrazo === '0' ? undefined : `${tema.captionTrazo} #000`,
          textShadow: '0 6px 18px rgba(0,0,0,0.5)',
          transform: `scale(${0.85 + pop * 0.15})`,
          textAlign: 'center',
          maxWidth: 900,
          lineHeight: 1.05,
          padding: '0 40px',
          textTransform: 'uppercase',
        }}
      >
        {partes.map((p, i) => {
          const esDestacado = p === chunk.destacado;
          return (
            <span
              key={i}
              style={
                esDestacado
                  ? {
                      backgroundColor: tema.cajaFondo,
                      color: tema.cajaTexto,
                      padding: '0 12px',
                      borderRadius: 6,
                      WebkitTextStroke: '0px transparent',
                    }
                  : undefined
              }
            >
              {p}
              {i < partes.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
