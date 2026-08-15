import React, {useMemo} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import type {FormatoProps} from '../types';
import {getTema} from '../temas';
import {BrollLayer, Captions, OverlayLayer, SfxLayer} from '../layers';
import {resolveBroll, resolveOverlays, resolveSrc} from '../layers/shared';
import {agruparCaptions, marcarDestacados} from '../captionUtils';

const PIP_W = 380;
const PIP_H = 510;
const MARGEN = 48;

// `Captions.tsx` posiciona 'lower-third' con `paddingBottom: 360` (constante
// del componente) y una línea de texto de `fontSize: 84 × lineHeight: 1.05`
// ≈ 88.2px por línea (también constantes de `Captions.tsx`, no de aquí). El
// texto se ancla al fondo del contenedor (`justifyContent: 'flex-end'`), así
// que para N líneas su borde superior es:
//   textTop(N) = height - 360 - N × 88.2
// Con height=1920: 1 línea → 1471.8 · 2 líneas → 1383.6 · 3 líneas → 1295.4.
// `agruparCaptions` corta cada bloque a 3 palabras — el máximo de líneas que
// cabe antes de que el bloque termine es 3 (una palabra larga por línea).
// El recuadro (510px, anclado por abajo con offset `o`) tiene su borde
// inferior en `height - o`; para que quede por encima del subtítulo en el
// peor caso (3 líneas) hace falta `height - o ≤ textTop(3)` →
// `o ≥ height - textTop(3) = 1920 - 1295.4 = 624.6`. Ronda de arreglo 1: el
// valor anterior (470) sólo cubría 1 línea — con un bloque de 2+ líneas
// (p. ej. "esto cambia absolutamente") el recuadro sí tapaba el subtítulo
// (medido por el revisor: 11.090 px de solape). `PIP_BOTTOM_SAFE = 630`
// deja ~5px de aire incluso en el caso de 3 líneas, y de sobra en 1 y 2.
const PIP_BOTTOM_SAFE = 630;

function posicionPip(esquina: 'tl' | 'tr' | 'bl' | 'br'): React.CSSProperties {
  switch (esquina) {
    case 'tl': return {top: MARGEN, left: MARGEN};
    case 'tr': return {top: MARGEN, right: MARGEN};
    case 'br': return {bottom: PIP_BOTTOM_SAFE, right: MARGEN};
    case 'bl':
    default:   return {bottom: PIP_BOTTOM_SAFE, left: MARGEN};
  }
}

// ──────────────────────────────────────────────────────────────────────
// Pip — screen recording de lienzo (frame completo) con la cámara en un
// recuadro flotante con esquinas redondeadas y sombra (look Screen
// Studio / Loom). El despachador ya resolvió formato/tema/subtítulos:
// este componente sólo monta capas.
//
// `formatos.ts` (registro, no tocado en esta tarea) declara las capas de
// `pip` como `['overlay', 'broll', 'captions', 'sfx']` — SIN `emphasis`.
// A diferencia de `fullscreen`, este formato no tiene caja de énfasis:
// no se monta `EmphasisLayer` y se le pasa `emphasis={[]}` a
// `OverlayLayer` (igual que hace `split`, aunque por otra razón — ver
// nota en el informe de la Tarea 8).
// ──────────────────────────────────────────────────────────────────────

export const Pip: React.FC<FormatoProps> = (props) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const tema = getTema(props.tema);
  // Default 'tr' (Ronda de arreglo 1, no 'bl'): la esquina inferior es donde
  // vive todo lo demás — subtítulos, overlay 'bottom' y B-roll de imagen
  // (ambos calibrados a `bottom: 520`). Con esquina superior el revisor
  // midió el solape residual del overlay en ~7% del recuadro y el del
  // B-roll imagen en ~11% (vs. 26% y 95.6% en 'bl'). 'bl'/'br' siguen
  // disponibles vía `pipEsquina` y ya no tapan el subtítulo con
  // `PIP_BOTTOM_SAFE` recalibrado arriba.
  const esquina = props.pipEsquina ?? 'tr';

  const overlays = useMemo(
    () => resolveOverlays(props.overlayCues, props.transcript),
    [props.overlayCues, props.transcript]
  );

  const broll = useMemo(
    () => resolveBroll(props.brollCues, props.transcript),
    [props.brollCues, props.transcript]
  );

  const tiemposSfx = [...overlays.map((o) => o.start), ...broll.map((b) => b.start)];

  // Sin screen recording no hay lienzo: se avisa y se usa la cámara a
  // pantalla completa, que es lo más cerca de `fullscreen` sin romper el
  // render. Remotion invoca este componente una vez POR FRAME renderizado
  // (180 veces en un video de 6s a 30fps) — sin el guard de `frame === 0`
  // el warning se repetiría esa misma cantidad de veces por export.
  const hayCanvas = Boolean(props.canvasSrc);
  if (!hayCanvas && frame === 0) {
    console.warn('[warn] formato pip sin canvasSrc — la cámara ocupa el frame completo');
  }

  return (
    <AbsoluteFill style={{backgroundColor: tema.fondo}}>
      {/* CAPA 0 — Lienzo: screen recording a pantalla completa (o la cámara si no hay canvas) */}
      <OffthreadVideo
        src={resolveSrc(hayCanvas ? (props.canvasSrc as string) : props.videoSrc)}
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />

      {/* CAPA 0.5 — Cámara en recuadro flotante (sólo si hay lienzo) */}
      {hayCanvas && (
        <div
          style={{
            position: 'absolute',
            width: PIP_W,
            height: PIP_H,
            borderRadius: 32,
            overflow: 'hidden',
            boxShadow: '0 18px 48px rgba(0,0,0,0.45)',
            ...posicionPip(esquina),
          }}
        >
          <OffthreadVideo
            src={resolveSrc(props.videoSrc)}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        </div>
      )}

      {/* CAPA 1 — B-roll fullscreen */}
      {broll.map((cue, i) => {
        const from = Math.floor(cue.start * fps);
        const dur = Math.max(1, Math.floor((cue.end - cue.start) * fps));
        return (
          <Sequence key={`broll-${i}`} from={from} durationInFrames={dur} layout="none">
            <BrollLayer cue={cue} durationInFrames={dur} />
          </Sequence>
        );
      })}

      {/* CAPA 2 — Overlays. Sin caja de énfasis en este formato (no está en
          `capas` del registro), así que no hay nada que la regla "emphasis
          gana" de OverlayLayer deba respetar: se le pasa []. */}
      {overlays.map((cue, i) => {
        const from = Math.floor(cue.start * fps);
        const dur = Math.max(1, Math.floor((cue.end - cue.start) * fps));
        return (
          <Sequence key={`overlay-${i}`} from={from} durationInFrames={dur} layout="none">
            <OverlayLayer cue={cue} durationInFrames={dur} startFrame={from} emphasis={[]} />
          </Sequence>
        );
      })}

      {/* CAPA 3 — SFX "pop" al aparecer cada overlay/B-roll */}
      <SfxLayer tiempos={tiemposSfx} fps={fps} />

      {/* CAPA 4 — Subtítulos */}
      {props.subtitulos && (
        <Captions
          chunks={marcarDestacados(
            agruparCaptions(props.transcript),
            props.emphasisCues.map((c) => c.keyword),
          )}
          fps={fps}
          position="lower-third"
          tema={tema}
        />
      )}
    </AbsoluteFill>
  );
};
