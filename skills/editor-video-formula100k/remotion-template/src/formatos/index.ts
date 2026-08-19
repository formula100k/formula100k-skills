import type React from 'react';
import type {FormatoProps} from '../types';
import {Fullscreen} from './fullscreen';
import {Split} from './split';
import {Pip} from './pip';
import {Versus} from './versus';
import {Pizarra} from './pizarra';

export const COMPONENTES_FORMATO: Record<string, React.FC<FormatoProps>> = {
  fullscreen: Fullscreen,
  split: Split,
  pip: Pip,
  versus: Versus,
  pizarra: Pizarra,
};
