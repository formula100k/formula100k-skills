import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';

// Pack F100K — display de impacto para el HEADER (gancho), igual que el resto de
// skills de edición (motion-reels/reel-memes usan 'F100K Display' = Anton).
const {fontFamily: ANTON} = loadAnton('normal', {
  weights: ['400'],
  subsets: ['latin'],
});

export const Header: React.FC<{line1: string; line2: string; hideAfter?: number}> = ({line1, line2, hideAfter}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (hideAfter != null && frame / fps >= hideAfter) return null;
  return (
  <AbsoluteFill
    style={{
      alignItems: 'center',
      paddingTop: 280,
      pointerEvents: 'none',
      zIndex: 100,
    }}
  >
    <h1
      style={{
        margin: 0,
        fontFamily: ANTON,
        fontWeight: 400,
        fontSize: 92,
        lineHeight: 1.02,
        color: '#FFFFFF',
        WebkitTextStroke: '6px #000000',
        paintOrder: 'stroke fill',
        textShadow: '0 4px 14px rgba(0,0,0,0.45)',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        textAlign: 'center',
        maxWidth: '92%',
      }}
    >
      {line1}
      <br />
      {line2}
    </h1>
  </AbsoluteFill>
  );
};
