import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily: INTER} = loadFont('normal', {
  weights: ['400', '800'],
  subsets: ['latin'],
});

// ──────────────────────────────────────────────────────────────────────
// Shared helpers — Emil Kowalski spring presets
// ──────────────────────────────────────────────────────────────────────

/** UI spring: fast entry, settles smoothly. No bounce. */
function uiSpring(frame: number, fps: number, delay = 0) {
  return spring({
    frame: frame - delay,
    fps,
    config: {stiffness: 280, damping: 28, mass: 1},
    durationInFrames: 20,
  });
}

/** Snap spring: stiff, fast, imperceptible settle (for dots/badges). */
function snapSpring(frame: number, fps: number, delay = 0) {
  return spring({
    frame: frame - delay,
    fps,
    config: {stiffness: 320, damping: 32, mass: 1},
    durationInFrames: 16,
  });
}

/** Wipe spring: used for clip-path reveal. High stiffness, fast settle. */
function wipeSpring(frame: number, fps: number, delay = 0) {
  return spring({
    frame: frame - delay,
    fps,
    config: {stiffness: 400, damping: 40, mass: 1},
    durationInFrames: 20,
  });
}

// ──────────────────────────────────────────────────────────────────────
// Prop interfaces
// ──────────────────────────────────────────────────────────────────────

export interface BadgeSlideProps {
  badgeNumber: number;
  title: string;
  subtitle?: string;
  accentColor?: string;
}

export interface StatCounterProps {
  value: number;
  label: string;
  suffix?: string;
  accentColor?: string;
}

export interface QuoteCardProps {
  quote: string;
  author?: string;
  accentColor?: string;
}

export interface ListRevealProps {
  items: string[];
  title?: string;
  accentColor?: string;
}

// ──────────────────────────────────────────────────────────────────────
// 1. BadgeSlide — Badge numerado que entra desde la izquierda
// ──────────────────────────────────────────────────────────────────────

export const BadgeSlide: React.FC<BadgeSlideProps> = ({
  badgeNumber,
  title,
  subtitle,
  accentColor = '#F59E0B',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Badge: entra desde x=-100, stagger 0ms
  const badgeProgress = uiSpring(frame, fps, 0);
  const badgeX = interpolate(badgeProgress, [0, 1], [-100, 0]);
  const badgeOpacity = interpolate(badgeProgress, [0, 0.3], [0, 1]);

  // Título: stagger 50ms ≈ 1.5 frames @ 30fps → delay=2
  const titleProgress = uiSpring(frame, fps, 2);
  const titleX = interpolate(titleProgress, [0, 1], [-100, 0]);
  const titleOpacity = interpolate(titleProgress, [0, 0.3], [0, 1]);

  // Subtitle: stagger 100ms ≈ 3 frames → delay=3
  const subProgress = uiSpring(frame, fps, 3);
  const subX = interpolate(subProgress, [0, 1], [-100, 0]);
  const subOpacity = interpolate(subProgress, [0, 0.3], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0d0d0d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
        fontFamily: INTER,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 32,
          width: '100%',
        }}
      >
        {/* Badge circular */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transform: `translateX(${badgeX}px)`,
            opacity: badgeOpacity,
          }}
        >
          <span
            style={{
              color: '#0d0d0d',
              fontSize: 24,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {badgeNumber}
          </span>
        </div>

        {/* Texto */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <span
            style={{
              color: '#ffffff',
              fontSize: 48,
              fontWeight: 800,
              lineHeight: 1.1,
              transform: `translateX(${titleX}px)`,
              opacity: titleOpacity,
            }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              style={{
                color: '#9ca3af',
                fontSize: 28,
                fontWeight: 400,
                lineHeight: 1.3,
                transform: `translateX(${subX}px)`,
                opacity: subOpacity,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────────────────
// 2. StatCounter — Número que cuenta de 0 al valor final
// ──────────────────────────────────────────────────────────────────────

export const StatCounter: React.FC<StatCounterProps> = ({
  value,
  label,
  suffix = '',
  accentColor = '#F59E0B',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Progreso del contador: spring que decelera (ease-out feel)
  const countProgress = spring({
    frame,
    fps,
    config: {stiffness: 60, damping: 20, mass: 1},
    durationInFrames: 50,
  });

  const displayValue = Math.round(interpolate(countProgress, [0, 1], [0, value]));

  // El label y suffix aparecen cuando el número está cerca del final
  const labelProgress = uiSpring(frame, fps, 40);
  const labelOpacity = interpolate(labelProgress, [0, 1], [0, 1]);
  const labelY = interpolate(labelProgress, [0, 1], [20, 0]);

  // El número en sí entra con fade rápido
  const numOpacity = interpolate(frame, [0, 6], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0d0d0d',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: INTER,
        gap: 16,
      }}
    >
      {/* Número gigante */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          opacity: numOpacity,
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: 180,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-4px',
          }}
        >
          {displayValue.toLocaleString()}
        </span>
        {suffix && (
          <span
            style={{
              color: accentColor,
              fontSize: 80,
              fontWeight: 800,
              lineHeight: 1,
              marginTop: 16,
              marginLeft: 8,
            }}
          >
            {suffix}
          </span>
        )}
      </div>

      {/* Label debajo */}
      <span
        style={{
          color: '#9ca3af',
          fontSize: 36,
          fontWeight: 400,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          transform: `translateY(${labelY}px)`,
          opacity: labelOpacity,
        }}
      >
        {label}
      </span>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────────────────
// 3. QuoteCard — Cita con wipe horizontal animado
// ──────────────────────────────────────────────────────────────────────

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  author,
  accentColor = '#F59E0B',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Comillas: scale spring desde 0 a 1
  const quoteMarkProgress = snapSpring(frame, fps, 0);
  const quoteMarkScale = interpolate(quoteMarkProgress, [0, 1], [0, 1]);

  // Wipe horizontal del texto: clip-path inset(0 X% 0 0) → inset(0 0% 0 0)
  // Empieza en frame 8 (después de las comillas)
  const wipeProgress = wipeSpring(frame, fps, 8);
  // inset right: 100% = completamente ocultado, 0% = completamente visible
  const insetRight = interpolate(wipeProgress, [0, 1], [100, 0]);

  // Autor: fade-in después del wipe (~frame 28)
  const authorProgress = uiSpring(frame, fps, 28);
  const authorOpacity = interpolate(authorProgress, [0, 1], [0, 1]);
  const authorY = interpolate(authorProgress, [0, 1], [16, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0d0d0d',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
        fontFamily: INTER,
        gap: 32,
      }}
    >
      {/* Comillas decorativas */}
      <span
        style={{
          color: accentColor,
          fontSize: 120,
          fontWeight: 800,
          lineHeight: 0.8,
          alignSelf: 'flex-start',
          transform: `scale(${quoteMarkScale})`,
          transformOrigin: 'top left',
          display: 'block',
        }}
      >
        "
      </span>

      {/* Texto de la cita con wipe */}
      <div
        style={{
          overflow: 'hidden',
          clipPath: `inset(0 ${insetRight}% 0 0)`,
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: 48,
            fontWeight: 800,
            lineHeight: 1.3,
            display: 'block',
            textAlign: 'center',
          }}
        >
          {quote}
        </span>
      </div>

      {/* Autor */}
      {author && (
        <span
          style={{
            color: '#9ca3af',
            fontSize: 24,
            fontWeight: 400,
            textAlign: 'center',
            transform: `translateY(${authorY}px)`,
            opacity: authorOpacity,
          }}
        >
          — {author}
        </span>
      )}
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────────────────
// 4. ListReveal — Lista de items que aparecen uno a uno
// ──────────────────────────────────────────────────────────────────────

const STAGGER_FRAMES = 12;
const TITLE_DELAY = 0;
const ITEMS_START = 14; // el título tarda ~14 frames en asentarse

export const ListReveal: React.FC<ListRevealProps> = ({
  items,
  title,
  accentColor = '#F59E0B',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Título: sube desde translateY(40px)
  const titleProgress = uiSpring(frame, fps, TITLE_DELAY);
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);
  const titleOpacity = interpolate(titleProgress, [0, 0.4], [0, 1]);

  const clampedItems = items.slice(0, 10);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0d0d0d',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '0 80px',
        fontFamily: INTER,
        gap: 0,
      }}
    >
      {/* Título */}
      {title && (
        <span
          style={{
            color: '#ffffff',
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 48,
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
          }}
        >
          {title}
        </span>
      )}

      {/* Items */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          width: '100%',
        }}
      >
        {clampedItems.map((item, i) => {
          const itemDelay = ITEMS_START + i * STAGGER_FRAMES;

          const itemProgress = uiSpring(frame, fps, itemDelay);
          const itemY = interpolate(itemProgress, [0, 1], [24, 0]);
          const itemOpacity = interpolate(itemProgress, [0, 0.4], [0, 1]);

          const dotProgress = snapSpring(frame, fps, itemDelay);
          const dotScale = interpolate(dotProgress, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 20,
                transform: `translateY(${itemY}px)`,
                opacity: itemOpacity,
              }}
            >
              {/* Dot */}
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: accentColor,
                  flexShrink: 0,
                  transform: `scale(${dotScale})`,
                }}
              />
              {/* Texto del item */}
              <span
                style={{
                  color: '#ffffff',
                  fontSize: 36,
                  fontWeight: 400,
                  lineHeight: 1.3,
                }}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
