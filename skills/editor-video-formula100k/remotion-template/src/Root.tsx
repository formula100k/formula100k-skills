import React from 'react';
import {Composition, getInputProps} from 'remotion';
import {CreaContenidoViral} from './CreaContenidoViral';
import type {CreaContenidoViralProps} from './types';

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

const defaults: CreaContenidoViralProps = {
  videoSrc: '',
  transcript: [],
  header: {line1: '', line2: ''},
  emphasisCues: [],
  overlayCues: [],
  brollCues: [],
  hookCue: null,
  width: WIDTH,
  height: HEIGHT,
  fps: FPS,
  durationInFrames: FPS,
};

export const RemotionRoot: React.FC = () => {
  const input = getInputProps() as Partial<CreaContenidoViralProps>;
  const merged: CreaContenidoViralProps = {...defaults, ...input};

  return (
    <Composition
      id="reel-viral"
      component={CreaContenidoViral}
      durationInFrames={Math.max(1, merged.durationInFrames)}
      fps={merged.fps}
      width={merged.width}
      height={merged.height}
      defaultProps={merged}
    />
  );
};
