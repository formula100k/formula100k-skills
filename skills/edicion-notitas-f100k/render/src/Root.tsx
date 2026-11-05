import React from 'react';
import {Composition} from 'remotion';
import {Notitas} from './Notitas';
import type {NotitasProps} from './tipos';

const vacio: NotitasProps = {
  video: '_source_cut.mov',
  palabras: [],
  zonas: [{desde: 0, x: 70, y: 1160}],
  tamanoSub: 78,
  camara: [],
  gancho: null,
  notitas: [],
  stickers: [],
  laminas: [],
  mockups: [],
  sfx: [],
  duracionFrames: 30,
};

export const Root: React.FC = () => (
  <Composition
    id="notitas"
    component={Notitas}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={30}
    defaultProps={vacio}
    calculateMetadata={({props}) => ({durationInFrames: props.duracionFrames})}
  />
);
