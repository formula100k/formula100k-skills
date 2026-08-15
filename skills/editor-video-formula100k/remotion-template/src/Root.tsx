import React from 'react';
import {Composition, getInputProps} from 'remotion';
import {CreaContenidoViral} from './CreaContenidoViral';
import {TutorialFaceless} from './TutorialFaceless';
import {NewsHorizontal} from './NewsHorizontal';
import type {NewsHorizontalProps} from './NewsHorizontal';
import {
  BadgeSlide,
  StatCounter,
  QuoteCard,
  ListReveal,
} from './MotionGraphics';
import type {CreaContenidoViralProps, TutorialFacelessProps} from './types';
import type {
  BadgeSlideProps,
  StatCounterProps,
  QuoteCardProps,
  ListRevealProps,
} from './MotionGraphics';

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

const tutorialDefaults: TutorialFacelessProps = {
  audioSrc: '', transcript: [], kineticCaptions: [],
  hookCard: null, background: [], cards: [], broll: [], cta: null,
  captionsConfig: {enabled: true, position: 'lower-third'},
  width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: FPS,
};

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

// ── Motion Graphics defaults ──────────────────────────────────────────

const badgeDefaults: BadgeSlideProps = {
  badgeNumber: 1,
  title: 'Este método cambia todo',
  subtitle: 'Fórmula 100K',
  accentColor: '#F59E0B',
};

const statDefaults: StatCounterProps = {
  value: 100,
  label: 'estudiantes',
  suffix: 'K',
  accentColor: '#F59E0B',
};

const quoteDefaults: QuoteCardProps = {
  quote: 'El contenido que vende no es el más bonito, es el más claro.',
  author: 'Andrea Vega — Fórmula 100K',
  accentColor: '#F59E0B',
};

const listDefaults: ListRevealProps = {
  title: 'Lo que aprenderás',
  items: [
    'Crear contenido que vende',
    'Automatizar con IA',
    'Construir tu comunidad',
  ],
  accentColor: '#F59E0B',
};

const newsDefaults: NewsHorizontalProps = {
  videoSrc: '',
  transcript: [],
  brand: 'F100K NEWS',
  ticker: [],
  chyrons: [],
  cards: [],
  width: 1920,
  height: 1080,
  fps: FPS,
  durationInFrames: FPS,
};

export const RemotionRoot: React.FC = () => {
  const input = getInputProps() as Partial<CreaContenidoViralProps>;
  const merged: CreaContenidoViralProps = {...defaults, ...input};

  const newsInput = getInputProps() as Partial<NewsHorizontalProps>;
  const newsMerged: NewsHorizontalProps = {...newsDefaults, ...newsInput};

  const tutorialInput = getInputProps() as Partial<TutorialFacelessProps>;
  const tutorialMerged: TutorialFacelessProps = {...tutorialDefaults, ...tutorialInput};

  // Para las composiciones de motion graphics, leer props del input
  const mgInput = getInputProps() as Record<string, unknown>;

  const badgeProps: BadgeSlideProps = {
    ...badgeDefaults,
    ...(mgInput as Partial<BadgeSlideProps>),
  };

  const statProps: StatCounterProps = {
    ...statDefaults,
    ...(mgInput as Partial<StatCounterProps>),
  };

  const quoteProps: QuoteCardProps = {
    ...quoteDefaults,
    ...(mgInput as Partial<QuoteCardProps>),
  };

  const listProps: ListRevealProps = {
    ...listDefaults,
    ...(mgInput as Partial<ListRevealProps>),
  };

  // Duración dinámica para ListReveal: 30 + 12 * items.length
  const listItems = listProps.items ?? listDefaults.items;
  const listDuration = 30 + 12 * Math.min(listItems.length, 10) + 20;

  return (
    <>
      {/* ── Composición principal de reel ── */}
      <Composition
        id="reel-viral"
        component={CreaContenidoViral}
        durationInFrames={Math.max(1, merged.durationInFrames)}
        fps={merged.fps}
        width={merged.width}
        height={merged.height}
        defaultProps={merged}
      />

      {/* ── FÓRMULA 100K NEWS — horizontal 1920×1080 ── */}
      <Composition
        id="news-horizontal"
        component={NewsHorizontal}
        durationInFrames={Math.max(1, newsMerged.durationInFrames)}
        fps={newsMerged.fps}
        width={1920}
        height={1080}
        defaultProps={newsMerged}
      />

      {/* ── Tutorial Faceless ── */}
      <Composition
        id="tutorial-faceless"
        component={TutorialFaceless}
        durationInFrames={tutorialMerged.durationInFrames}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={tutorialMerged}
      />

      {/* ── Motion Graphics nativos ── */}

      {/* Badge numerado deslizante — 90 frames (3s) */}
      <Composition
        id="motion-badge"
        component={BadgeSlide}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={badgeProps}
      />

      {/* Contador animado — 60 frames (2s) */}
      <Composition
        id="motion-stat"
        component={StatCounter}
        durationInFrames={60}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={statProps}
      />

      {/* Cita con wipe horizontal — 90 frames (3s) */}
      <Composition
        id="motion-quote"
        component={QuoteCard}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={quoteProps}
      />

      {/* Lista reveal — duración dinámica según número de items */}
      <Composition
        id="motion-list"
        component={ListReveal}
        durationInFrames={listDuration}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={listProps}
      />
    </>
  );
};
