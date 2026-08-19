import React, {useMemo} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, useVideoConfig} from 'remotion';
import type {FormatoProps} from '../types';
import {getTema} from '../temas';
import {Captions, EmphasisLayer, SfxLayer} from '../layers';
import {resolveEmphasis, resolveSrc} from '../layers/shared';
import {agruparCaptions, marcarDestacados} from '../captionUtils';
import {Fullscreen} from './fullscreen';

// ──────────────────────────────────────────────────────────────────────
// Pizarra — formato de MONTAJE, no un motor. No dibuja nada: encadena dos
// insumos que ya producen otras skills y los apila.
//
//   lienzo  ← `pizarra-explicativa-f100k`  (.mov/.webm con alfa: los trazos)
//   cutout  ← `hyperframes remove-background` (.webm VP9 con alfa: el sujeto)
//
// Orden de atrás hacia adelante: fondo del tema → lienzo → sujeto → énfasis
// → subtítulos. El sujeto va DELANTE del lienzo para que los trazos se
// dibujen "detrás de ella", que es el efecto entero del formato.
//
// Verificado en render real: Remotion respeta el alfa de un .webm VP9 si el
// `OffthreadVideo` lleva `transparent`. Sin ese prop el alfa se aplana a
// negro y el lienzo desaparece bajo un rectángulo opaco.
// ──────────────────────────────────────────────────────────────────────

export const Pizarra: React.FC<FormatoProps> = (props) => {
  const {fps} = useVideoConfig();
  const tema = getTema(props.tema);

  const emphasis = useMemo(
    () => resolveEmphasis(props.emphasisCues, props.transcript),
    [props.emphasisCues, props.transcript]
  );

  // Degradación: el pipeline nunca rompe, avisa. Sin cutout no hay formato
  // (el sujeto quedaría con su fondo original tapando el lienzo entero), y
  // sin lienzo no hay pizarra que mostrar. En ambos casos cae a fullscreen,
  // igual que hace el despachador con un formato desconocido.
  const faltan: string[] = [];
  if (!props.cutoutSrc) faltan.push('cutoutSrc');
  if (!props.lienzoSrc) faltan.push('lienzoSrc');
  if (faltan.length > 0) {
    console.warn(
      `[warn] pizarra: falta ${faltan.join(' y ')} — uso fullscreen. ` +
        'El cutout sale de `hyperframes remove-background`; el lienzo, de ' +
        'la skill pizarra-explicativa-f100k.'
    );
    return <Fullscreen {...props} />;
  }

  return (
    <AbsoluteFill style={{backgroundColor: tema.fondo}}>
      {/* Cada video va en su PROPIO AbsoluteFill. `AbsoluteFill` es un flex
          en columna: dos <OffthreadVideo> hermanos dentro del mismo no se
          superponen, se reparten el alto — y el sujeto desaparecía del
          frame. Envolver cada uno es lo que los apila de verdad. */}
      <AbsoluteFill>
        {/* Lienzo: los trazos a mano, frame completo. */}
        <OffthreadVideo
          transparent
          muted
          src={resolveSrc(props.lienzoSrc!)}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>

      <AbsoluteFill>
        {/* Sujeto recortado, delante de los trazos. Lleva el audio: es la
            misma toma que `_source_cut.mov`, ya cortada y sincronizada. */}
        <OffthreadVideo
          transparent
          src={resolveSrc(props.cutoutSrc!)}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}
        />
      </AbsoluteFill>

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

      <SfxLayer tiempos={emphasis.map((e) => e.start)} fps={fps} />

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
