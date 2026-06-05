import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';
import type {
  BrollCue,
  CreaContenidoViralProps,
  EmphasisCue,
  HookCue,
  OverlayCue,
  TranscriptWord,
} from './types';

const {fontFamily: INTER} = loadFont('normal', {
  weights: ['700', '800'],
  subsets: ['latin'],
});

const MIN_OVERLAY_VISIBLE_SECONDS = 1.8;
const DEFAULT_OVERLAY_DURATION = 3.0;
const DEFAULT_BROLL_DURATION = 3.5;

// SFX que suena al inicio de cada imagen (hook, overlays, B-roll)
const SFX_SRC = 'sfx/pop.wav';
const SFX_DURATION_SECONDS = 0.18;

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9áéíóúñü ]+/gi, '')
    .trim();

const resolveSrc = (src: string): string => {
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  // Cualquier otro path se sirve desde public/ vía staticFile.
  // Si necesitas un archivo absoluto, cópialo a public/ antes.
  return staticFile(src.replace(/^\/+/, ''));
};

function findKeywordTime(
  transcript: TranscriptWord[],
  keyword: string
): number | null {
  const target = normalize(keyword);
  if (!target) return null;
  for (const w of transcript) {
    if (normalize(w.text).includes(target)) return w.start;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────
// Resolved cue shapes (timestamps computed from keywords)
// ──────────────────────────────────────────────────────────────────────

type ResolvedEmphasis = {
  text: string;
  start: number;
  end: number;
  auto?: boolean;
};

type ResolvedOverlay = {
  src: string;
  width: number;
  start: number;
  end: number;
  position?: 'top' | 'bottom';
};

type ResolvedBroll = {
  src: string;
  start: number;
  end: number;
  style: 'monitor-photo' | 'clean';
};

function resolveEmphasis(
  cues: EmphasisCue[],
  transcript: TranscriptWord[]
): ResolvedEmphasis[] {
  return cues
    .map((c): ResolvedEmphasis | null => {
      const t = findKeywordTime(transcript, c.keyword);
      if (t === null) return null;
      const start = t + (c.startOffset ?? 0);
      const end = start + (c.duration ?? 1.6);
      return {text: c.text, start, end};
    })
    .filter((x): x is ResolvedEmphasis => x !== null)
    .sort((a, b) => a.start - b.start);
}

function resolveOverlays(
  cues: OverlayCue[],
  transcript: TranscriptWord[]
): ResolvedOverlay[] {
  return cues
    .map((c): ResolvedOverlay | null => {
      const t = findKeywordTime(transcript, c.keyword);
      if (t === null) return null;
      return {
        src: resolveSrc(c.src),
        width: c.width ?? 420,
        start: t,
        end: t + (c.duration ?? DEFAULT_OVERLAY_DURATION),
        position: c.position ?? 'bottom',
      };
    })
    .filter((x): x is ResolvedOverlay => x !== null);
}

function resolveBroll(
  cues: BrollCue[],
  transcript: TranscriptWord[]
): ResolvedBroll[] {
  const resolved = cues
    .map((c): ResolvedBroll | null => {
      const t = findKeywordTime(transcript, c.keyword);
      if (t === null) return null;
      return {
        src: resolveSrc(c.src),
        start: t,
        end: t + (c.duration ?? DEFAULT_BROLL_DURATION),
        style: c.style ?? 'monitor-photo',
      };
    })
    .filter((x): x is ResolvedBroll => x !== null)
    .sort((a, b) => a.start - b.start);

  // Clamp overlapping entries: each broll ends when the next one starts.
  for (let i = 0; i < resolved.length - 1; i++) {
    if (resolved[i].end > resolved[i + 1].start) {
      resolved[i] = {...resolved[i], end: resolved[i + 1].start};
    }
  }
  return resolved;
}

// Si un overlay choca con uno o más emphasis y queda visible menos de
// MIN_OVERLAY_VISIBLE_SECONDS, lo desplaza al final del último emphasis
// solapado para que conserve su duración completa. Si tras varios shifts
// sigue sin alcanzar el mínimo visible, se descarta — preferimos no
// mostrar un overlay flasheando 0.5s.
function shiftOverlaysAroundEmphasis(
  overlays: ResolvedOverlay[],
  emphasis: ResolvedEmphasis[]
): ResolvedOverlay[] {
  const sortedEmphasis = [...emphasis].sort((a, b) => a.start - b.start);

  const visibleSeconds = (start: number, end: number): number => {
    let visible = 0;
    let cursor = start;
    for (const e of sortedEmphasis) {
      if (e.end <= cursor || e.start >= end) continue;
      if (e.start > cursor) visible += e.start - cursor;
      cursor = Math.max(cursor, e.end);
      if (cursor >= end) return visible;
    }
    if (cursor < end) visible += end - cursor;
    return visible;
  };

  return overlays
    .map((o) => {
      const cueDuration = o.end - o.start;
      let cur = o;
      for (let iter = 0; iter < 5; iter++) {
        const visible = visibleSeconds(cur.start, cur.end);
        if (visible >= MIN_OVERLAY_VISIBLE_SECONDS) break;
        const overlapping = sortedEmphasis.filter(
          (e) => e.start < cur.end && e.end > cur.start
        );
        if (overlapping.length === 0) break;
        const latestEnd = Math.max(...overlapping.map((e) => e.end));
        cur = {...cur, start: latestEnd, end: latestEnd + cueDuration};
      }
      return cur;
    })
    .filter((o) => visibleSeconds(o.start, o.end) >= MIN_OVERLAY_VISIBLE_SECONDS);
}

// Cada emphasis aparece EXACTAMENTE UNA VEZ en su keyword.
// No auto-recap — el usuario lo pidió explícitamente.

// ──────────────────────────────────────────────────────────────────────
// Layer components
// ──────────────────────────────────────────────────────────────────────

// Imagen gancho del segundo 1: sticker editorial en una esquina superior,
// rotado ligeramente, con spring drop desde fuera de frame.
// NO cubre la cara centrada.
const HookImage: React.FC<{cue: HookCue; durationInFrames: number}> = ({
  cue,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const position = cue.position ?? 'right';
  const w = cue.width ?? 360;
  const rotation = cue.rotation ?? (position === 'left' ? -3 : 3);

  // Spring entry — slide up from below (anclado al fondo del frame)
  const dropProgress = spring({
    frame,
    fps,
    config: {damping: 13, mass: 0.7, stiffness: 120},
    durationInFrames: 18,
  });
  const dropOffsetY = (1 - dropProgress) * 300;

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

  // Posición: bottom-right (default) o bottom-left.
  // Anclado al fondo del frame para no chocar con el header grande de arriba.
  // bottom=520 lo coloca encima de overlays (bottom 180) y emphasis (bottom 220),
  // dejando espacio visual de respiración.
  const margin = 40;
  const left = position === 'left' ? margin : width - w - margin;
  const bottom = 520;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          bottom,
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

const Header: React.FC<{line1: string; line2: string; hideAfter?: number}> = ({line1, line2, hideAfter}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (hideAfter != null && frame / fps >= hideAfter) return null;
  return (
  <AbsoluteFill
    style={{
      alignItems: 'center',
      paddingTop: 280,
      pointerEvents: 'none',
    }}
  >
    <h1
      style={{
        margin: 0,
        fontFamily: INTER,
        fontWeight: 800,
        fontSize: 84,
        lineHeight: 1.06,
        color: '#FFFFFF',
        WebkitTextStroke: '6px #000000',
        paintOrder: 'stroke fill',
        textShadow: '0 4px 14px rgba(0,0,0,0.45)',
        letterSpacing: -0.5,
        textAlign: 'center',
        maxWidth: '90%',
      }}
    >
      {line1}
      <br />
      {line2}
    </h1>
  </AbsoluteFill>
  );
};

const BrollLayer: React.FC<{cue: ResolvedBroll; durationInFrames: number}> = ({
  cue,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 6, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const opacity = Math.min(fadeIn, fadeOut);
  const monitor = cue.style === 'monitor-photo';
  const isVideo = /\.(mp4|mov|webm|m4v)$/i.test(cue.src);

  // Videos → fullscreen. Imágenes → en la parte inferior como overlay
  // (las imágenes horizontales de B-roll quedan en la zona pecho/manos, no tapan la cara).
  if (isVideo) {
    return (
      <AbsoluteFill style={{opacity}}>
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: monitor ? 'rotate(-1.2deg) scale(1.04)' : 'none',
            overflow: 'hidden',
          }}
        >
          <OffthreadVideo
            src={cue.src}
            muted
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
          {monitor ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.08), rgba(255,255,255,0) 60%)',
                pointerEvents: 'none',
              }}
            />
          ) : null}
        </div>
      </AbsoluteFill>
    );
  }

  // Imagen de B-roll → parte inferior, igual que OverlayLayer
  const enterScale = spring({
    frame,
    fps,
    config: {damping: 12, mass: 0.6},
    from: 0.6,
    to: 1.0,
    durationInFrames: 10,
  });
  const floatY = Math.sin(frame / 10) * 4;
  const imgWidth = cue.width ?? 900;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          bottom: 150,
          left: '50%',
          transform: `translate(-50%, 0) translateY(${floatY}px) scale(${enterScale})`,
          opacity,
        }}
      >
        <Img
          src={cue.src}
          style={{
            width: imgWidth,
            height: 'auto',
            display: 'block',
            borderRadius: 16,
            filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.45))',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const OverlayLayer: React.FC<{
  cue: ResolvedOverlay;
  durationInFrames: number;
  startFrame: number;
  emphasis: ResolvedEmphasis[];
}> = ({cue, durationInFrames, startFrame, emphasis}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Rule: si hay emphasis activo, el overlay se oculta (emphasis gana).
  const tGlobal = (frame + startFrame) / fps;
  const emphasisActive = emphasis.some(
    (e) => tGlobal >= e.start && tGlobal < e.end
  );

  const enterScale = spring({
    frame,
    fps,
    config: {damping: 12, mass: 0.6},
    from: 0.6,
    to: 1.0,
    durationInFrames: 10,
  });
  const fadeIn = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 6, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const baseOpacity = Math.min(fadeIn, fadeOut);
  const opacity = emphasisActive ? 0 : baseOpacity;
  const isTop = cue.position === 'top';
  const floatY = Math.sin(frame / 10) * 4;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          ...(isTop ? {top: 120} : {bottom: 150}),
          left: '50%',
          transform: `translate(-50%, 0) translateY(${isTop ? -floatY : floatY}px) scale(${enterScale})`,
          opacity,
        }}
      >
        {/\.(mp4|mov|webm|m4v)$/i.test(cue.src) ? (
          <OffthreadVideo
            src={cue.src}
            style={{
              width: cue.width,
              height: 'auto',
              display: 'block',
              filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.35))',
            }}
          />
        ) : (
          <Img
            src={cue.src}
            style={{
              width: cue.width,
              height: 'auto',
              display: 'block',
              filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.35))',
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};

const EmphasisLayer: React.FC<{
  cue: ResolvedEmphasis;
  durationInFrames: number;
}> = ({cue, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const popIn = spring({
    frame,
    fps,
    config: {damping: 12, mass: 0.6},
    from: 0.7,
    to: 1.0,
    durationInFrames: 8,
  });
  const fadeIn = interpolate(frame, [0, 7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 5, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const exitScale = interpolate(
    frame,
    [durationInFrames - 5, durationInFrames],
    [1.0, 0.94],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const opacity = Math.min(fadeIn, fadeOut);
  const scale = Math.min(popIn, exitScale);

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          bottom: 220,
          left: '50%',
          transform: `translate(-50%, 0) scale(${scale})`,
          opacity,
          background: '#FFFFFF',
          borderRadius: 24,
          padding: '20px 40px',
          boxShadow:
            '0 8px 0 rgba(0,0,0,0.12), 0 12px 30px rgba(0,0,0,0.18)',
          maxWidth: 880,
        }}
      >
        <span
          style={{
            fontFamily: INTER,
            fontWeight: 800,
            fontSize: 84,
            lineHeight: 1.04,
            color: '#000000',
            letterSpacing: -1,
            display: 'block',
            textAlign: 'center',
          }}
        >
          {cue.text}
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Root composition
// ──────────────────────────────────────────────────────────────────────

export const CreaContenidoViral: React.FC<CreaContenidoViralProps> = ({
  videoSrc,
  transcript,
  header,
  emphasisCues,
  overlayCues,
  brollCues,
  hookCue,
  durationInFrames,
  fps,
}) => {
  const emphasis = useMemo(
    () => resolveEmphasis(emphasisCues, transcript),
    [emphasisCues, transcript]
  );

  const overlays = useMemo(
    () => shiftOverlaysAroundEmphasis(
      resolveOverlays(overlayCues, transcript),
      emphasis
    ),
    [overlayCues, transcript, emphasis]
  );

  const broll = useMemo(
    () => resolveBroll(brollCues, transcript),
    [brollCues, transcript]
  );

  return (
    <AbsoluteFill style={{backgroundColor: '#000000'}}>
      {/* CAPA 0 — VideoBase */}
      <OffthreadVideo
        src={resolveSrc(videoSrc)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
        }}
      />

      {/* CAPA 1 — Header persistente */}
      <Header line1={header.line1} line2={header.line2} hideAfter={header.hideAfter} />

      {/* CAPA 1.5 — Imagen gancho (sólo segundos iniciales, sticker editorial) */}
      {hookCue && hookCue.src ? (() => {
        const start = Math.floor((hookCue.start ?? 0.3) * fps);
        const dur = Math.max(1, Math.floor((hookCue.duration ?? 2.2) * fps));
        return (
          <Sequence
            key="hook-image"
            from={start}
            durationInFrames={dur}
            layout="none"
          >
            <HookImage cue={{...hookCue, src: resolveSrc(hookCue.src)}} durationInFrames={dur} />
          </Sequence>
        );
      })() : null}

      {/* CAPA 2 — B-roll fullscreen */}
      {broll.map((cue, i) => {
        const from = Math.floor(cue.start * fps);
        const dur = Math.max(1, Math.floor((cue.end - cue.start) * fps));
        return (
          <Sequence
            key={`broll-${i}`}
            from={from}
            durationInFrames={dur}
            layout="none"
          >
            <BrollLayer cue={cue} durationInFrames={dur} />
          </Sequence>
        );
      })}

      {/* CAPA 3 — Overlay sobre el pecho (excluído si hay emphasis activo) */}
      {overlays.map((cue, i) => {
        const from = Math.floor(cue.start * fps);
        const dur = Math.max(1, Math.floor((cue.end - cue.start) * fps));
        return (
          <Sequence
            key={`overlay-${i}`}
            from={from}
            durationInFrames={dur}
            layout="none"
          >
            <OverlayLayer
              cue={cue}
              durationInFrames={dur}
              startFrame={from}
              emphasis={emphasis}
            />
          </Sequence>
        );
      })}

      {/* CAPA 4 — Caja de énfasis central */}
      {emphasis.map((cue, i) => {
        const from = Math.floor(cue.start * fps);
        const dur = Math.max(1, Math.floor((cue.end - cue.start) * fps));
        return (
          <Sequence
            key={`emphasis-${i}`}
            from={from}
            durationInFrames={dur}
            layout="none"
          >
            <EmphasisLayer cue={cue} durationInFrames={dur} />
          </Sequence>
        );
      })}

      {/* CAPA 5 — SFX "pop" al aparecer cada imagen (hook + overlays + B-roll) */}
      {(() => {
        const sfxStarts: number[] = [];
        if (hookCue && hookCue.src) sfxStarts.push(hookCue.start ?? 0.3);
        for (const o of overlays) sfxStarts.push(o.start);
        for (const b of broll) sfxStarts.push(b.start);
        const sfxDurFrames = Math.max(
          1,
          Math.floor(SFX_DURATION_SECONDS * fps)
        );
        return sfxStarts.map((t, i) => (
          <Sequence
            key={`sfx-${i}`}
            from={Math.max(0, Math.floor(t * fps))}
            durationInFrames={sfxDurFrames}
            layout="none"
          >
            <Audio src={staticFile(SFX_SRC)} volume={0.55} />
          </Sequence>
        ));
      })()}
    </AbsoluteFill>
  );
};
