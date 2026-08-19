import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {ResolvedBroll} from './shared';

export const BrollLayer: React.FC<{
  cue: ResolvedBroll;
  durationInFrames: number;
  /**
   * 'frame' (default) posiciona la rama imagen pensando en el frame 1920
   * completo — así se comportaba siempre, y `fullscreen` no debe notar el
   * cambio. 'panel' la centra y la contiene dentro de su contenedor
   * (pensado para canvases recortados como el de `split`). La rama video ya
   * es un `AbsoluteFill` al 100%×100% y llena su contenedor en ambos casos,
   * así que no distingue `encuadre`.
   */
  encuadre?: 'frame' | 'panel';
}> = ({cue, durationInFrames, encuadre = 'frame'}) => {
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
  // 900 fijo: la tabla de B-roll del MANIFEST no tiene columna `Ancho`
  // (sus columnas son Keyword | Archivo | Duración | Estilo, más `Lado` en
  // versus). Antes esto leía `cue.width`, un campo que no existe en
  // `BrollCue` ni en `ResolvedBroll`: siempre valía undefined y siempre caía
  // a 900. Era un error de tipos y una promesa falsa en la documentación.
  // Si algún día hace falta el ancho por fila, hay que agregar la columna al
  // parser, al tipo y acá — no basta con volver a poner `cue.width`.
  const imgWidth = 900;
  const isPanel = encuadre === 'panel';

  const contenedorStyle: React.CSSProperties = isPanel
    ? {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateY(${floatY}px) scale(${enterScale})`,
        opacity,
      }
    : {
        position: 'absolute',
        bottom: 520,
        left: '50%',
        transform: `translate(-50%, 0) translateY(${floatY}px) scale(${enterScale})`,
        opacity,
      };

  const imgStyle: React.CSSProperties = isPanel
    ? {
        maxWidth: '90%',
        maxHeight: '90%',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
        display: 'block',
        borderRadius: 16,
        filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.45))',
      }
    : {
        width: imgWidth,
        height: 'auto',
        display: 'block',
        borderRadius: 16,
        filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.45))',
      };

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={contenedorStyle}>
        <Img src={cue.src} style={imgStyle} />
      </div>
    </AbsoluteFill>
  );
};
