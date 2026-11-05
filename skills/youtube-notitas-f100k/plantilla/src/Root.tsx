import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import plan from '../public/plan.json';

export const Root: React.FC = () => (
	<Composition id="Video" component={Main} durationInFrames={Math.ceil((plan as any).total * 30)} fps={30} width={1920} height={1080} />
);
