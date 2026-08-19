import React, {useMemo} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, useVideoConfig} from 'remotion';
import type {FormatoProps} from '../types';
import {getTema} from '../temas';
import {BrollLayer, Captions, EmphasisLayer, SfxLayer} from '../layers';
import {resolveBroll, resolveEmphasis, resolveSrc} from '../layers/shared';
import {agruparCaptions, marcarDestacados} from '../captionUtils';

const MITAD_H = 960;   // 1920 / 2 — la costura cae exacta al centro
const CAM_D = 420;     // diámetro del círculo de cámara
// Las etiquetas van pegadas al borde SUPERIOR de su propia mitad, como un
// tag sobre el panel. La de B *no* puede ir centrada justo bajo la costura
// (que era lo natural): ahí vive el círculo de cámara y se la traga entera.
const ETIQUETA_TOP = 44;   // desde el borde superior de cada mitad
const ETIQUETA_LEFT = 48;  // alineadas a la izquierda, lejos de la cámara
// El subtítulo va bajo la cámara, no en lower-third: en lower-third caía en
// mitad de la card de B y la volvía ilegible. Acá se apoya en el círculo,
// que es donde ya está el ojo del espectador.
const CAPTION_TOP = MITAD_H + CAM_D / 2 + 34;

// ──────────────────────────────────────────────────────────────────────
// Versus — dos mitades que se comparan. Cada B-roll declara su `lado` y
// se recorta dentro de su mitad (overflow:hidden), así una imagen nunca
// invade la contraria. La cámara va en un círculo sobre la costura: es
// lo que hace que se lea como "versus" y no como dos fotos apiladas.
//
// No monta Header ni HookImage — las etiquetas cumplen esa función, y su
// `capas` en formatos.ts ya los excluye.
// ──────────────────────────────────────────────────────────────────────

export const Versus: React.FC<FormatoProps> = (props) => {
  const {fps, width} = useVideoConfig();
  const tema = getTema(props.tema);
  const etiquetas = props.versusEtiquetas ?? {a: 'ANTES', b: 'AHORA'};

  const emphasis = useMemo(
    () => resolveEmphasis(props.emphasisCues, props.transcript),
    [props.emphasisCues, props.transcript]
  );

  const broll = useMemo(
    () => resolveBroll(props.brollCues, props.transcript),
    [props.brollCues, props.transcript]
  );

  // Énfasis y subtítulo comparten banda (la de debajo de la cámara), así que
  // no pueden convivir: se descarta el chunk de subtítulo que pise una
  // ventana de énfasis. Es la misma regla que ya rige entre énfasis y overlay
  // en `fullscreen` — gana el énfasis —, sólo que acá el que cede es el
  // subtítulo.
  const captionsVisibles = useMemo(() => {
    const chunks = marcarDestacados(
      agruparCaptions(props.transcript),
      props.emphasisCues.map((c) => c.keyword),
    );
    if (emphasis.length === 0) return chunks;
    return chunks.filter(
      (c) => !emphasis.some((e) => c.start < e.end && e.start < c.end)
    );
  }, [props.transcript, props.emphasisCues, emphasis]);

  const mitad = (lado: 'a' | 'b') => (
    <div
      style={{
        position: 'absolute',
        top: lado === 'a' ? 0 : MITAD_H,
        left: 0,
        width: '100%',
        height: MITAD_H,
        overflow: 'hidden',
      }}
    >
      {broll
        .filter((cue) => cue.lado === lado)
        .map((cue, i) => {
          const from = Math.floor(cue.start * fps);
          const dur = Math.max(1, Math.floor((cue.end - cue.start) * fps));
          return (
            <Sequence
              key={`broll-${lado}-${i}`}
              from={from}
              durationInFrames={dur}
              layout="none"
            >
              <BrollLayer cue={cue} durationInFrames={dur} encuadre="panel" />
            </Sequence>
          );
        })}
    </div>
  );

  // Chip sólido, no texto suelto: la etiqueta cae sobre una card de B-roll
  // que puede ser clara u oscura. Con `crema-editorial` (trazoTexto '0') el
  // texto plano se volvía invisible sobre una card negra.
  const etiqueta = (texto: string, top: number) => (
    <div
      style={{
        position: 'absolute',
        top,
        left: ETIQUETA_LEFT,
        display: 'inline-block',
        padding: '10px 30px 16px',
        borderRadius: 14,
        backgroundColor: tema.cajaFondo,
        color: tema.cajaTexto,
        fontFamily: tema.fuenteDisplay,
        fontSize: 62,
        lineHeight: 1,
        letterSpacing: 2,
        boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
      }}
    >
      {texto}
    </div>
  );

  return (
    <AbsoluteFill style={{backgroundColor: tema.fondo}}>
      {mitad('a')}
      {mitad('b')}


      {/* Cámara: círculo centrado en la costura, pisando ambas mitades. */}
      <div
        style={{
          position: 'absolute',
          top: MITAD_H - CAM_D / 2,
          left: (width - CAM_D) / 2,
          width: CAM_D,
          height: CAM_D,
          borderRadius: '50%',
          overflow: 'hidden',
          border: `8px solid ${tema.fondo}`,
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
        }}
      >
        <OffthreadVideo
          src={resolveSrc(props.videoSrc)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 25%',
          }}
        />
      </div>

      {/* Las etiquetas se pintan DESPUÉS de la cámara a propósito: la de B
          vive justo bajo la costura, y si el círculo se dibujara encima se
          la comía entera (pasó: "LA ABRAZAS" perdía la S). Que una etiqueta
          larga pise el borde del círculo se lee como UI en capas; que
          desaparezca, no. */}
      {etiqueta(etiquetas.a, ETIQUETA_TOP)}
      {etiqueta(etiquetas.b, MITAD_H + ETIQUETA_TOP)}

      {/* Énfasis y SFX viven sobre el frame completo. */}
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
            <EmphasisLayer cue={cue} durationInFrames={dur} topPx={CAPTION_TOP} />
          </Sequence>
        );
      })}

      <SfxLayer tiempos={broll.map((b) => b.start)} fps={fps} />

      {props.subtitulos && (
        <Captions
          chunks={captionsVisibles}
          fps={fps}
          position="seam"
          seamTop={CAPTION_TOP}
          tema={tema}
          fondo
        />
      )}
    </AbsoluteFill>
  );
};
