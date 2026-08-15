import React, {useMemo} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, useVideoConfig} from 'remotion';
import type {FormatoProps} from '../types';
import {getTema} from '../temas';
import {BrollLayer, Captions, EmphasisLayer, OverlayLayer, SfxLayer} from '../layers';
import {resolveBroll, resolveEmphasis, resolveOverlays, resolveSrc} from '../layers/shared';
import {agruparCaptions, marcarDestacados} from '../captionUtils';

const CANVAS_H = 768; // 40% de 1920 — costura fija
const SEAM_TOP = 800; // subtítulo justo debajo de la costura

// ──────────────────────────────────────────────────────────────────────
// Split — canvas arriba (B-roll + overlays, viven DENTRO del panel y
// nunca invaden la zona de la cara) y la cara abajo en su propio panel,
// sin solaparse. El despachador ya resolvió formato/tema/subtítulos:
// este componente sólo monta capas. No monta Header ni HookImage — el
// canvas cumple esa función (su `capas` en formatos.ts ya los excluye).
// ──────────────────────────────────────────────────────────────────────

export const Split: React.FC<FormatoProps> = (props) => {
  const {fps, height} = useVideoConfig();
  const tema = getTema(props.tema);

  const emphasis = useMemo(
    () => resolveEmphasis(props.emphasisCues, props.transcript),
    [props.emphasisCues, props.transcript]
  );

  const overlays = useMemo(
    () => resolveOverlays(props.overlayCues, props.transcript),
    [props.overlayCues, props.transcript]
  );

  const broll = useMemo(
    () => resolveBroll(props.brollCues, props.transcript),
    [props.brollCues, props.transcript]
  );

  return (
    <AbsoluteFill style={{backgroundColor: tema.fondo}}>
      {/* Panel superior — el canvas. B-roll y overlays viven DENTRO de él,
          recortados por overflow:hidden para que nunca invadan la cara. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: CANVAS_H,
          overflow: 'hidden',
        }}
      >
        {broll.map((cue, i) => {
          const from = Math.floor(cue.start * fps);
          const dur = Math.max(1, Math.floor((cue.end - cue.start) * fps));
          return (
            <Sequence key={`broll-${i}`} from={from} durationInFrames={dur} layout="none">
              <BrollLayer cue={cue} durationInFrames={dur} encuadre="panel" />
            </Sequence>
          );
        })}
        {overlays.map((cue, i) => {
          const from = Math.floor(cue.start * fps);
          const dur = Math.max(1, Math.floor((cue.end - cue.start) * fps));
          return (
            <Sequence key={`overlay-${i}`} from={from} durationInFrames={dur} layout="none">
              <OverlayLayer
                cue={cue}
                durationInFrames={dur}
                startFrame={from}
                // Zonas disjuntas en este formato (overlay en el canvas y<768,
                // emphasis sobre la cara y≈1550): no pueden colisionar, así
                // que la regla "emphasis gana" no aplica — se le pasa [].
                emphasis={[]}
                encuadre="panel"
              />
            </Sequence>
          );
        })}
      </div>

      {/* Panel inferior — la cara. Vive en su propio panel: nunca se tapa. */}
      <div
        style={{
          position: 'absolute',
          top: CANVAS_H,
          left: 0,
          width: '100%',
          height: height - CANVAS_H,
          overflow: 'hidden',
        }}
      >
        <OffthreadVideo
          src={resolveSrc(props.videoSrc)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 20%',
          }}
        />
      </div>

      {/* Énfasis y SFX viven sobre el frame completo. */}
      {emphasis.map((cue, i) => {
        const from = Math.floor(cue.start * fps);
        const dur = Math.max(1, Math.floor((cue.end - cue.start) * fps));
        return (
          <Sequence key={`emphasis-${i}`} from={from} durationInFrames={dur} layout="none">
            <EmphasisLayer cue={cue} durationInFrames={dur} />
          </Sequence>
        );
      })}

      <SfxLayer
        tiempos={[...overlays.map((o) => o.start), ...broll.map((b) => b.start)]}
        fps={fps}
      />

      {props.subtitulos && (
        <Captions
          chunks={marcarDestacados(
            agruparCaptions(props.transcript),
            props.emphasisCues.map((c) => c.keyword),
          )}
          fps={fps}
          position="seam"
          seamTop={SEAM_TOP}
          tema={tema}
        />
      )}
    </AbsoluteFill>
  );
};
