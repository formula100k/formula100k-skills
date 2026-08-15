import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';

// SFX que suena al inicio de cada imagen (hook, overlays, B-roll)
const SFX_SRC = 'sfx/pop.wav';
const SFX_DURATION_SECONDS = 0.18;

export const SfxLayer: React.FC<{tiempos: number[]; fps: number}> = ({tiempos, fps}) => {
  const dur = Math.max(1, Math.floor(SFX_DURATION_SECONDS * fps));
  return (
    <>
      {tiempos.map((t, i) => (
        <Sequence key={`sfx-${i}`} from={Math.max(0, Math.floor(t * fps))}
                  durationInFrames={dur} layout="none">
          <Audio src={staticFile(SFX_SRC)} volume={0.55} />
        </Sequence>
      ))}
    </>
  );
};
