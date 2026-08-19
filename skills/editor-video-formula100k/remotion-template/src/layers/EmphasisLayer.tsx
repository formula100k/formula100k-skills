import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';
import type {ResolvedEmphasis} from './shared';

const {fontFamily: INTER} = loadFont('normal', {
  weights: ['700', '800'],
  subsets: ['latin'],
});

export const EmphasisLayer: React.FC<{
  cue: ResolvedEmphasis;
  durationInFrames: number;
  /**
   * Ancla la caja a `top: topPx` en vez del `bottom: 220` de siempre.
   * Lo usa `versus`, donde el tercio inferior no es zona libre sino el
   * cuerpo de la card del panel B: ahí la caja caía justo encima del texto
   * de la card. Sin este prop el comportamiento es el de antes, así que
   * `fullscreen` y `split` no se enteran.
   */
  topPx?: number;
}> = ({cue, durationInFrames, topPx}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const popIn = spring({
    frame,
    fps,
    config: {damping: 12, mass: 0.6},
    from: 0.7,
    to: 1.0,
    durationInFrames: 8,
  });
  const fadeIn = interpolate(frame, [0, 7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 5, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const exitScale = interpolate(
    frame,
    [durationInFrames - 5, durationInFrames],
    [1.0, 0.94],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const opacity = Math.min(fadeIn, fadeOut);
  const scale = Math.min(popIn, exitScale);

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          ...(topPx == null ? {bottom: 220} : {top: topPx}),
          left: '50%',
          transform: `translate(-50%, 0) scale(${scale})`,
          opacity,
          background: '#FFFFFF',
          borderRadius: 24,
          padding: '20px 40px',
          boxShadow:
            '0 8px 0 rgba(0,0,0,0.12), 0 12px 30px rgba(0,0,0,0.18)',
          maxWidth: 880,
        }}
      >
        <span
          style={{
            fontFamily: INTER,
            fontWeight: 800,
            fontSize: 84,
            lineHeight: 1.04,
            color: '#000000',
            letterSpacing: -1,
            display: 'block',
            textAlign: 'center',
          }}
        >
          {cue.text}
        </span>
      </div>
    </AbsoluteFill>
  );
};
