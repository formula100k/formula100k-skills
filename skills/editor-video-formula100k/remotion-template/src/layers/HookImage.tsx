import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {HookCue} from '../types';

// Imagen gancho del segundo 1: sticker editorial en una esquina superior,
// rotado ligeramente, con spring drop desde fuera de frame.
// NO cubre la cara centrada.
export const HookImage: React.FC<{cue: HookCue; durationInFrames: number}> = ({
  cue,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const position = cue.position ?? 'right';
  const w = cue.width ?? 360;
  const rotation = cue.rotation ?? (position === 'left' ? -3 : 3);

  // Spring entry — drop down from outside the frame (anclado a la esquina
  // superior, así que entra cayendo desde arriba en vez de deslizar desde abajo).
  const dropProgress = spring({
    frame,
    fps,
    config: {damping: 13, mass: 0.7, stiffness: 120},
    durationInFrames: 18,
  });
  const dropOffsetY = (1 - dropProgress) * -300;

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  const fadeIn = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);

  // Sutil "wobble" suave durante el sostén
  const wobble = Math.sin(frame / 12) * 0.5;
  const finalRotation = rotation + wobble;

  // Posición: esquina superior derecha (default) o superior izquierda —
  // como documenta SKILL.md ("## Formato del MANIFEST.md" → Gancho visual).
  // `top: 340` empieza debajo del arranque del header (`paddingTop: 280` en
  // Header.tsx) — el header ocupa el centro horizontal del frame (`Anton`
  // 92px, maxWidth 92%), mientras el hook vive pegado a la esquina derecha
  // (x≥680 con el ancho default de 360px), así que sólo colisionarían si el
  // header tuviera una línea larga que llegara hasta el borde derecho. Muy
  // por encima de overlays/emphasis/B-roll, que viven en la mitad inferior
  // del frame (`bottom: 520` / `bottom: 220`).
  const margin = 40;
  const left = position === 'left' ? margin : width - w - margin;
  const top = 340;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top,
          left,
          width: w,
          transform: `translateY(${dropOffsetY}px) rotate(${finalRotation}deg)`,
          opacity,
          filter: 'drop-shadow(0 18px 32px rgba(0,0,0,0.45))',
        }}
      >
        <Img
          src={cue.src}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: 16,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
