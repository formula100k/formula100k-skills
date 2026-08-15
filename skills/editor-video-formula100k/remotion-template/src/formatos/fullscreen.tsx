import React, {useMemo} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence} from 'remotion';
import type {FormatoProps} from '../types';
import {
  BrollLayer,
  Captions,
  EmphasisLayer,
  Header,
  HookImage,
  OverlayLayer,
  SfxLayer,
} from '../layers';
import {
  resolveEmphasis,
  resolveOverlays,
  resolveBroll,
  resolveSrc,
  shiftOverlaysAroundEmphasis,
} from '../layers/shared';
import {agruparCaptions, marcarDestacados} from '../captionUtils';
import {getTema} from '../temas';

// ──────────────────────────────────────────────────────────────────────
// Fullscreen — talking-head 9:16 a pantalla completa.
// Ensamblado movido tal cual desde CreaContenidoViral.tsx (Tarea 6): el
// despachador ya resolvió `formato`, `tema` y `subtitulos`, este componente
// sólo monta capas.
// ──────────────────────────────────────────────────────────────────────

export const Fullscreen: React.FC<FormatoProps> = ({
  videoSrc,
  transcript,
  header,
  emphasisCues,
  overlayCues,
  brollCues,
  hookCue,
  fps,
  tema: temaId,
  subtitulos,
}) => {
  const tema = getTema(temaId);

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
      <SfxLayer
        tiempos={[
          ...(hookCue && hookCue.src ? [hookCue.start ?? 0.3] : []),
          ...overlays.map((o) => o.start),
          ...broll.map((b) => b.start),
        ]}
        fps={fps}
      />

      {/* CAPA 6 — Subtítulos (opt-in; este formato los trae apagados por default) */}
      {subtitulos && (
        <Captions
          chunks={marcarDestacados(
            agruparCaptions(transcript),
            emphasisCues.map((c) => c.keyword),
          )}
          fps={fps}
          position="lower-third"
          tema={tema}
        />
      )}
    </AbsoluteFill>
  );
};
