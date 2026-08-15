import React from 'react';
import {
  AbsoluteFill, Audio, Img, OffthreadVideo, Sequence,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import type {
  TutorialFacelessProps, BackgroundCue, CardCue, BrollCue,
} from './types';
import {Captions} from './layers/Captions';
import {getTema} from './temas';

function norm(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, '').trim();
}

function findKeywordTime(transcript: TutorialFacelessProps['transcript'], keyword: string): number {
  const kw = norm(keyword);
  if (!kw) return 0;
  for (const w of transcript) {
    const word = norm(w.word ?? w.text ?? '');
    if (word && (word.includes(kw) || kw.includes(word))) return w.start;
  }
  return 0;
}

function asset(src: string): string {
  // src es relativo a $DEST (ej. "USER/x.mov", "IA/y.png"); en public/ está aplanado por carpeta.
  return staticFile(src);
}

const isVideo = (s: string) => /\.(mp4|mov|webm|m4v)$/i.test(s);

// ── Capa de fondo (screen-rec o card fullscreen) ────────────────────────
const Background: React.FC<{cue: BackgroundCue; fps: number; transcript: TutorialFacelessProps['transcript']}> =
({cue, fps, transcript}) => {
  const start = findKeywordTime(transcript, cue.keyword);
  const dur = cue.duration ?? 4.0;
  const from = Math.round(start * fps);
  const frames = Math.round(dur * fps);
  const monitor = cue.style === 'monitor';
  const inner = isVideo(cue.src)
    ? <OffthreadVideo src={asset(cue.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} muted />
    : <Img src={asset(cue.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />;
  return (
    <Sequence from={from} durationInFrames={frames}>
      <AbsoluteFill style={{
        transform: monitor ? 'rotate(-1.2deg) scale(1.04)' : 'none',
        background: '#0d0d0d',
      }}>
        {inner}
        {monitor && <AbsoluteFill style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.08), transparent 70%)'}} />}
      </AbsoluteFill>
    </Sequence>
  );
};

// ── Card pop-in (puede tomar el centro) ─────────────────────────────────
const Card: React.FC<{cue: CardCue; fps: number; transcript: TutorialFacelessProps['transcript']}> =
({cue, fps, transcript}) => {
  const start = findKeywordTime(transcript, cue.keyword);
  const dur = cue.duration ?? 2.4;
  const from = Math.round(start * fps);
  const frames = Math.round(dur * fps);
  return (
    <Sequence from={from} durationInFrames={frames}>
      <CardInner cue={cue} fps={fps} />
    </Sequence>
  );
};

const CardInner: React.FC<{cue: CardCue; fps: number}> = ({cue, fps}) => {
  const frame = useCurrentFrame();
  const enter = spring({frame, fps, config: {stiffness: 300, damping: 28}});
  const width = cue.width ?? 700;
  const rot = cue.rotation ?? 0;
  const pos = cue.position ?? 'center';
  const justify = pos === 'top' ? 'flex-start' : pos === 'bottom' ? 'flex-end' : 'center';
  const pad = pos === 'center' ? 0 : 180;
  return (
    <AbsoluteFill style={{justifyContent: justify, alignItems: 'center',
      paddingTop: pos === 'top' ? pad : 0, paddingBottom: pos === 'bottom' ? pad : 0}}>
      <Img src={asset(cue.src)} style={{
        width, transform: `scale(${enter}) rotate(${rot}deg)`, opacity: enter,
        borderRadius: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.45)'}} />
    </AbsoluteFill>
  );
};

// ── B-roll (igual que el motor actual) ──────────────────────────────────
const Broll: React.FC<{cue: BrollCue; fps: number; transcript: TutorialFacelessProps['transcript']}> =
({cue, fps, transcript}) => {
  const start = findKeywordTime(transcript, cue.keyword);
  const dur = cue.duration ?? 3.0;
  const from = Math.round(start * fps);
  const frames = Math.round(dur * fps);
  const monitor = (cue.style ?? 'monitor-photo') === 'monitor-photo';
  return (
    <Sequence from={from} durationInFrames={frames}>
      <AbsoluteFill style={{transform: monitor ? 'rotate(-1.2deg)' : 'none', background: '#0d0d0d'}}>
        {isVideo(cue.src)
          ? <OffthreadVideo src={asset(cue.src)} style={{width:'100%',height:'100%',objectFit:'cover'}} muted />
          : <Img src={asset(cue.src)} style={{width:'100%',height:'100%',objectFit:'cover'}} />}
      </AbsoluteFill>
    </Sequence>
  );
};

// ── Tarjeta gancho / CTA (fullscreen pop) ───────────────────────────────
const FullCard: React.FC<{src: string; fps: number}> = ({src, fps}) => {
  const frame = useCurrentFrame();
  const enter = spring({frame, fps, config: {stiffness: 300, damping: 28}});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: '#0d0d0d'}}>
      <Img src={asset(src)} style={{width: '100%', transform: `scale(${0.96 + enter*0.04})`, opacity: enter}} />
    </AbsoluteFill>
  );
};

export const TutorialFaceless: React.FC<TutorialFacelessProps> = (props) => {
  const {fps} = useVideoConfig();
  const hookFrames = props.hookCard ? Math.round((props.hookCard.duration ?? 3.0) * fps) : 0;
  const ctaFrames = props.cta ? Math.round((props.cta.duration ?? 3.5) * fps) : 0;
  const ctaFrom = Math.max(0, props.durationInFrames - ctaFrames);

  return (
    <AbsoluteFill style={{background: '#0d0d0d'}}>
      {/* Audio = voz cortada */}
      {props.audioSrc ? <Audio src={asset(props.audioSrc)} /> : null}

      {/* Fondos */}
      {props.background.map((c, i) => <Background key={`bg${i}`} cue={c} fps={fps} transcript={props.transcript} />)}

      {/* B-roll */}
      {props.broll.map((c, i) => <Broll key={`br${i}`} cue={c} fps={fps} transcript={props.transcript} />)}

      {/* Cards */}
      {props.cards.map((c, i) => <Card key={`cd${i}`} cue={c} fps={fps} transcript={props.transcript} />)}

      {/* Captions cinéticos */}
      {props.captionsConfig.enabled &&
        <Captions
          chunks={props.kineticCaptions}
          fps={fps}
          position={props.captionsConfig.position}
          tema={getTema('default')}
        />}

      {/* Tarjeta gancho (encima de todo, al inicio) */}
      {props.hookCard &&
        <Sequence from={0} durationInFrames={hookFrames}>
          <FullCard src={props.hookCard.src} fps={fps} />
        </Sequence>}

      {/* CTA final */}
      {props.cta &&
        <Sequence from={ctaFrom} durationInFrames={ctaFrames}>
          <FullCard src={props.cta.src} fps={fps} />
        </Sequence>}
    </AbsoluteFill>
  );
};
