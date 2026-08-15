import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {ResolvedEmphasis, ResolvedOverlay} from './shared';

export const OverlayLayer: React.FC<{
  cue: ResolvedOverlay;
  durationInFrames: number;
  startFrame: number;
  emphasis: ResolvedEmphasis[];
  /**
   * 'frame' (default) posiciona el overlay pensando en el frame 1920 completo
   * — así se comportaba siempre, y `fullscreen` no debe notar el cambio.
   * 'panel' lo centra y lo contiene dentro de su contenedor (pensado para
   * canvases recortados como el de `split`, donde 'frame' lo saca de cuadro
   * o lo recorta).
   */
  encuadre?: 'frame' | 'panel';
}> = ({cue, durationInFrames, startFrame, emphasis, encuadre = 'frame'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Rule: si hay emphasis activo, el overlay se oculta (emphasis gana).
  const tGlobal = (frame + startFrame) / fps;
  const emphasisActive = emphasis.some(
    (e) => tGlobal >= e.start && tGlobal < e.end
  );

  const enterScale = spring({
    frame,
    fps,
    config: {damping: 12, mass: 0.6},
    from: 0.6,
    to: 1.0,
    durationInFrames: 10,
  });
  const fadeIn = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 6, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const baseOpacity = Math.min(fadeIn, fadeOut);
  const opacity = emphasisActive ? 0 : baseOpacity;
  const isTop = cue.position === 'top';
  const floatY = Math.sin(frame / 10) * 4;
  const isPanel = encuadre === 'panel';

  const contenedorStyle: React.CSSProperties = isPanel
    ? {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateY(${isTop ? -floatY : floatY}px) scale(${enterScale})`,
        opacity,
      }
    : {
        position: 'absolute',
        ...(isTop ? {bottom: 1100} : {bottom: 520}),
        left: '50%',
        transform: `translate(-50%, 0) translateY(${isTop ? -floatY : floatY}px) scale(${enterScale})`,
        opacity,
      };

  const mediaStyle: React.CSSProperties = isPanel
    ? {
        maxWidth: '90%',
        maxHeight: '90%',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
        display: 'block',
        filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.35))',
      }
    : {
        width: cue.width,
        height: 'auto',
        display: 'block',
        filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.35))',
      };

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={contenedorStyle}>
        {/\.(mp4|mov|webm|m4v)$/i.test(cue.src) ? (
          <OffthreadVideo src={cue.src} style={mediaStyle} />
        ) : (
          <Img src={cue.src} style={mediaStyle} />
        )}
      </div>
    </AbsoluteFill>
  );
};
