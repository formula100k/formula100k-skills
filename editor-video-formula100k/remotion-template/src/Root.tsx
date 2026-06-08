import React from 'react';
import {Composition, getInputProps} from 'remotion';
import {CreaContenidoViral} from './CreaContenidoViral';
import {
  BadgeSlide,
  StatCounter,
  QuoteCard,
  ListReveal,
} from './MotionGraphics';
import type {CreaContenidoViralProps} from './types';
import type {
  BadgeSlideProps,
  StatCounterProps,
  QuoteCardProps,
  ListRevealProps,
} from './MotionGraphics';

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

export const RemotionRoot: React.FC = () => {
  const input = getInputProps() as Partial<CreaContenidoViralProps>;
  const merged: CreaContenidoViralProps = {...defaults, ...input};

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
