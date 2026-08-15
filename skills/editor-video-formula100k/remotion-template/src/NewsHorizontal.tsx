import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ────────────────────────────────────────────────────────────────────────
// FÓRMULA 100K NEWS — composición horizontal 1920×1080 (broadcast bulletin)
//
// Todo gráfico vive en el TERCIO INFERIOR para no tapar la cara de Andrea
// (centro en talking-head) ni la burbuja de cámara (arriba-centro en
// screen-share). Sistema: barra de noticias persistente + chyrons lower-third
// + tarjetas (título, bignum, leaderboard, lista) ancladas por keyword.
// ────────────────────────────────────────────────────────────────────────

const NAVY = '#0A1228';
const NAVY2 = '#0E1B3D';
const CYAN = '#22D3EE';
const BLUE = '#38BDF8';
const GOLD = '#F5B301';
const RED = '#FF3B3B';
const WHITE = '#FFFFFF';

type Word = {text: string; start: number; end: number};

type Chyron = {keyword: string; kicker: string; title: string; duration?: number; offset?: number};

type TitleCard = {kind: 'title'; keyword: string; eyebrow: string; title: string; subtitle?: string; duration?: number; offset?: number};
type BigNumCard = {kind: 'bignum'; keyword: string; from?: string; to: string; unit?: string; caption?: string; duration?: number; offset?: number};
type Row = {name: string; metric: string; sub?: string};
type LeaderboardCard = {kind: 'leaderboard'; keyword: string; title: string; rows: Row[]; duration?: number; offset?: number};
type ListCard = {kind: 'list'; keyword: string; title: string; items: string[]; duration?: number; offset?: number};
type NewsCard = TitleCard | BigNumCard | LeaderboardCard | ListCard;

export type NewsHorizontalProps = {
  videoSrc: string;
  transcript: Word[];
  brand: string;
  ticker: string[];
  chyrons: Chyron[];
  cards: NewsCard[];
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
};

const SFX_SRC = 'sfx/pop.wav';

// ── keyword resolution (igual que el reel vertical) ──────────────────────
const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

function resolveSrc(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return staticFile(src.replace(/^\/+/, ''));
}

function findKeywordTime(transcript: Word[], keyword: string): number | null {
  const target = normalize(keyword);
  if (!target) return null;
  const targetWords = target.split(/\s+/);
  // single token: primera coincidencia parcial
  if (targetWords.length === 1) {
    for (const w of transcript) {
      if (normalize(w.text).includes(target)) return w.start;
    }
    return null;
  }
  // multi-token: ventana deslizante
  for (let i = 0; i <= transcript.length - targetWords.length; i++) {
    const joined = normalize(
      transcript
        .slice(i, i + targetWords.length)
        .map((w) => w.text)
        .join(' ')
    );
    if (joined.includes(target)) return transcript[i].start;
  }
  // fallback: primer token
  for (const w of transcript) {
    if (normalize(w.text).includes(targetWords[0])) return w.start;
  }
  return null;
}

// ── helpers de animación ─────────────────────────────────────────────────
function useEnter(startFrame: number, fps: number) {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  return spring({frame: local, fps, config: {stiffness: 200, damping: 26}});
}

// ════════════════════════════════════════════════════════════════════════
// CAPA: video de fondo escalado a cover 1920×1080
// ════════════════════════════════════════════════════════════════════════
const VideoLayer: React.FC<{videoSrc: string}> = ({videoSrc}) => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <OffthreadVideo
      src={resolveSrc(videoSrc)}
      style={{width: '100%', height: '100%', objectFit: 'cover'}}
    />
    {/* gradiente inferior para legibilidad de los gráficos */}
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(to top, rgba(5,8,20,0.92) 0%, rgba(5,8,20,0.55) 16%, rgba(5,8,20,0) 34%)',
      }}
    />
  </AbsoluteFill>
);

// ════════════════════════════════════════════════════════════════════════
// CAPA: bug superior izquierdo "● EN VIVO · F100K NEWS"
// ════════════════════════════════════════════════════════════════════════
const NewsBug: React.FC<{brand: string; fps: number}> = ({brand, fps}) => {
  const frame = useCurrentFrame();
  const enter = spring({frame, fps, config: {stiffness: 160, damping: 22}});
  const blink = Math.sin(frame / 6) > -0.2 ? 1 : 0.25;
  return (
    <div
      style={{
        position: 'absolute',
        top: 46,
        left: 56,
        transform: `translateX(${interpolate(enter, [0, 1], [-60, 0])}px)`,
        opacity: enter,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 22px',
        borderRadius: 10,
        background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
        border: `1px solid rgba(56,189,248,0.35)`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: RED,
          opacity: blink,
          boxShadow: `0 0 14px ${RED}`,
        }}
      />
      <span style={{color: WHITE, fontWeight: 800, fontSize: 26, letterSpacing: 1, fontFamily: 'Arial, sans-serif'}}>
        EN VIVO
      </span>
      <span style={{width: 1, height: 22, background: 'rgba(255,255,255,0.25)'}} />
      <span style={{color: CYAN, fontWeight: 900, fontSize: 26, letterSpacing: 1.5, fontFamily: 'Arial, sans-serif'}}>
        {brand}
      </span>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// CAPA: barra de noticias inferior persistente con ticker rotativo
// ════════════════════════════════════════════════════════════════════════
const NewsBar: React.FC<{brand: string; ticker: string[]; fps: number}> = ({brand, ticker, fps}) => {
  const frame = useCurrentFrame();
  const enter = spring({frame: frame - 4, fps, config: {stiffness: 170, damping: 24}});
  const y = interpolate(enter, [0, 1], [170, 0]);

  // ticker: cada item ~5s, crossfade
  const PER = 5 * fps;
  const idx = Math.floor(frame / PER) % Math.max(ticker.length, 1);
  const within = frame % PER;
  const tFade = interpolate(within, [0, 8, PER - 8, PER], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 132,
        transform: `translateY(${y}px)`,
        display: 'flex',
        alignItems: 'stretch',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* bloque de marca */}
      <div
        style={{
          background: `linear-gradient(135deg, ${CYAN} 0%, ${BLUE} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 40px',
          minWidth: 360,
          clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0% 100%)',
        }}
      >
        <span style={{color: NAVY, fontWeight: 900, fontSize: 40, lineHeight: 1, letterSpacing: 1}}>
          FÓRMULA 100K
        </span>
        <span style={{color: NAVY, fontWeight: 800, fontSize: 26, letterSpacing: 8, opacity: 0.85}}>
          N E W S
        </span>
      </div>
      {/* franja del ticker */}
      <div
        style={{
          flex: 1,
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
          borderTop: `3px solid ${CYAN}`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 56,
          paddingRight: 40,
          gap: 28,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            background: RED,
            color: WHITE,
            fontWeight: 900,
            fontSize: 24,
            padding: '8px 18px',
            borderRadius: 6,
            letterSpacing: 1.5,
            flexShrink: 0,
          }}
        >
          ÚLTIMA HORA
        </span>
        <span
          style={{
            color: WHITE,
            fontWeight: 700,
            fontSize: 38,
            opacity: tFade,
            transform: `translateY(${interpolate(tFade, [0, 1], [12, 0])}px)`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {ticker[idx] ?? ''}
        </span>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// CAPA: chyron lower-third (kicker + título) por segmento
// ════════════════════════════════════════════════════════════════════════
const ChyronLayer: React.FC<{kicker: string; title: string; fps: number}> = ({kicker, title, fps}) => {
  const enter = useEnter(0, fps);
  const x = interpolate(enter, [0, 1], [-120, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        bottom: 168,
        transform: `translateX(${x}px)`,
        opacity: enter,
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        maxWidth: 1180,
      }}
    >
      <div
        style={{
          alignSelf: 'flex-start',
          background: `linear-gradient(135deg, ${GOLD} 0%, #FF8A00 100%)`,
          color: NAVY,
          fontWeight: 900,
          fontSize: 28,
          letterSpacing: 2,
          padding: '8px 20px',
          borderRadius: '8px 8px 0 0',
        }}
      >
        {kicker.toUpperCase()}
      </div>
      <div
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
          borderLeft: `6px solid ${CYAN}`,
          color: WHITE,
          fontWeight: 800,
          fontSize: 58,
          lineHeight: 1.05,
          padding: '18px 34px 22px 28px',
          borderRadius: '0 12px 12px 12px',
          boxShadow: '0 18px 50px rgba(0,0,0,0.5)',
        }}
      >
        {title}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// TARJETA: título de sección (eyebrow + título grande) — banda inferior
// ════════════════════════════════════════════════════════════════════════
const TitleCardView: React.FC<{c: TitleCard; fps: number}> = ({c, fps}) => {
  const enter = useEnter(0, fps);
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        bottom: 168,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          background: `linear-gradient(135deg, ${CYAN} 0%, ${BLUE} 100%)`,
          color: NAVY,
          fontWeight: 900,
          fontSize: 28,
          letterSpacing: 3,
          padding: '8px 22px',
          borderRadius: 8,
          marginBottom: 14,
        }}
      >
        {c.eyebrow.toUpperCase()}
      </div>
      <div
        style={{
          color: WHITE,
          fontWeight: 900,
          fontSize: 96,
          lineHeight: 1,
          textShadow: '0 8px 40px rgba(0,0,0,0.7)',
        }}
      >
        {c.title}
      </div>
      {c.subtitle ? (
        <div style={{color: CYAN, fontWeight: 700, fontSize: 42, marginTop: 12}}>{c.subtitle}</div>
      ) : null}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// TARJETA: big number con transición (ej. 42 → 28 días)
// ════════════════════════════════════════════════════════════════════════
const BigNumView: React.FC<{c: BigNumCard; fps: number}> = ({c, fps}) => {
  const enter = useEnter(0, fps);
  const frame = useCurrentFrame();
  const arrow = spring({frame: frame - 14, fps, config: {stiffness: 200, damping: 18}});
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        bottom: 168,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        alignItems: 'center',
        gap: 36,
        background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
        border: `1px solid rgba(56,189,248,0.4)`,
        borderRadius: 20,
        padding: '28px 44px',
        boxShadow: '0 22px 60px rgba(0,0,0,0.55)',
      }}
    >
      {c.from ? (
        <div style={{textAlign: 'center'}}>
          <div style={{color: '#94A3B8', fontWeight: 900, fontSize: 120, lineHeight: 1, textDecoration: 'line-through', textDecorationColor: RED}}>
            {c.from}
          </div>
        </div>
      ) : null}
      {c.from ? (
        <div style={{color: CYAN, fontSize: 80, fontWeight: 900, opacity: arrow, transform: `translateX(${interpolate(arrow, [0, 1], [-20, 0])}px)`}}>→</div>
      ) : null}
      <div style={{textAlign: 'center'}}>
        <div
          style={{
            color: CYAN,
            fontWeight: 900,
            fontSize: 150,
            lineHeight: 1,
            textShadow: `0 0 40px rgba(34,211,238,0.5)`,
            transform: `scale(${interpolate(arrow, [0, 1], [0.7, 1])})`,
          }}
        >
          {c.to}
        </div>
        {c.unit ? <div style={{color: WHITE, fontWeight: 800, fontSize: 44, marginTop: -6}}>{c.unit}</div> : null}
      </div>
      {c.caption ? (
        <div style={{color: WHITE, fontWeight: 700, fontSize: 40, maxWidth: 420, marginLeft: 12, opacity: arrow}}>
          {c.caption}
        </div>
      ) : null}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// TARJETA: leaderboard (ganadores / wins) — fila por persona con stagger
// ════════════════════════════════════════════════════════════════════════
const LeaderboardView: React.FC<{c: LeaderboardCard; fps: number}> = ({c, fps}) => {
  const enter = useEnter(0, fps);
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        bottom: 168,
        width: 1080,
        opacity: enter,
        transform: `translateX(${interpolate(enter, [0, 1], [-80, 0])}px)`,
        fontFamily: 'Arial, sans-serif',
        background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
        border: `1px solid rgba(56,189,248,0.4)`,
        borderRadius: 18,
        padding: '24px 30px 28px',
        boxShadow: '0 22px 60px rgba(0,0,0,0.55)',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18}}>
        <div style={{width: 10, height: 38, borderRadius: 4, background: `linear-gradient(${CYAN}, ${BLUE})`}} />
        <span style={{color: WHITE, fontWeight: 900, fontSize: 46, letterSpacing: 0.5}}>{c.title}</span>
      </div>
      {c.rows.map((r, i) => {
        const rowSpring = spring({frame: frame - 8 - i * 5, fps, config: {stiffness: 200, damping: 24}});
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '12px 14px',
              borderRadius: 12,
              marginBottom: 8,
              background: i === 0 ? 'rgba(245,179,1,0.14)' : 'rgba(255,255,255,0.05)',
              border: i === 0 ? `1px solid rgba(245,179,1,0.5)` : '1px solid rgba(255,255,255,0.08)',
              opacity: rowSpring,
              transform: `translateX(${interpolate(rowSpring, [0, 1], [-40, 0])}px)`,
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 10,
                background: i === 0 ? `linear-gradient(135deg, ${GOLD}, #FF8A00)` : `linear-gradient(135deg, ${CYAN}, ${BLUE})`,
                color: NAVY,
                fontWeight: 900,
                fontSize: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{color: WHITE, fontWeight: 800, fontSize: 38, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                {r.name}
              </div>
              {r.sub ? <div style={{color: '#9FB3C8', fontWeight: 600, fontSize: 26}}>{r.sub}</div> : null}
            </div>
            <div
              style={{
                color: i === 0 ? GOLD : CYAN,
                fontWeight: 900,
                fontSize: 40,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {r.metric}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// TARJETA: lista (sesiones / módulos / misiones) con check stagger
// ════════════════════════════════════════════════════════════════════════
const ListView: React.FC<{c: ListCard; fps: number}> = ({c, fps}) => {
  const enter = useEnter(0, fps);
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        bottom: 168,
        width: 980,
        opacity: enter,
        transform: `translateX(${interpolate(enter, [0, 1], [-80, 0])}px)`,
        fontFamily: 'Arial, sans-serif',
        background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
        border: `1px solid rgba(56,189,248,0.4)`,
        borderRadius: 18,
        padding: '24px 30px 26px',
        boxShadow: '0 22px 60px rgba(0,0,0,0.55)',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16}}>
        <div style={{width: 10, height: 36, borderRadius: 4, background: `linear-gradient(${CYAN}, ${BLUE})`}} />
        <span style={{color: WHITE, fontWeight: 900, fontSize: 44}}>{c.title}</span>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        {c.items.map((it, i) => {
          const rowSpring = spring({frame: frame - 8 - i * 4, fps, config: {stiffness: 210, damping: 24}});
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: rowSpring,
                transform: `translateX(${interpolate(rowSpring, [0, 1], [-30, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9,
                  background: `linear-gradient(135deg, ${CYAN}, ${BLUE})`,
                  color: NAVY,
                  fontWeight: 900,
                  fontSize: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
              <span style={{color: WHITE, fontWeight: 700, fontSize: 36, lineHeight: 1.15}}>{it}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── resolución de cues a frames ──────────────────────────────────────────
type Resolved<T> = {cue: T; startF: number; endF: number};

function resolveCards(cards: NewsCard[], transcript: Word[], fps: number): Resolved<NewsCard>[] {
  const out: Resolved<NewsCard>[] = [];
  for (const c of cards) {
    const t = findKeywordTime(transcript, c.keyword);
    if (t === null) continue;
    const start = t + (c.offset ?? 0);
    const dur = c.duration ?? 4;
    out.push({cue: c, startF: Math.round(start * fps), endF: Math.round((start + dur) * fps)});
  }
  out.sort((a, b) => a.startF - b.startF);
  return out;
}

function resolveChyrons(chyrons: Chyron[], transcript: Word[], fps: number): Resolved<Chyron>[] {
  const out: Resolved<Chyron>[] = [];
  for (const c of chyrons) {
    const t = findKeywordTime(transcript, c.keyword);
    if (t === null) continue;
    const start = t + (c.offset ?? 0);
    const dur = c.duration ?? 4;
    out.push({cue: c, startF: Math.round(start * fps), endF: Math.round((start + dur) * fps)});
  }
  out.sort((a, b) => a.startF - b.startF);
  // clamp solapados
  for (let i = 0; i < out.length - 1; i++) {
    if (out[i].endF > out[i + 1].startF) out[i].endF = out[i + 1].startF;
  }
  return out;
}

const CardRouter: React.FC<{c: NewsCard; fps: number}> = ({c, fps}) => {
  switch (c.kind) {
    case 'title':
      return <TitleCardView c={c} fps={fps} />;
    case 'bignum':
      return <BigNumView c={c} fps={fps} />;
    case 'leaderboard':
      return <LeaderboardView c={c} fps={fps} />;
    case 'list':
      return <ListView c={c} fps={fps} />;
    default:
      return null;
  }
};

// ════════════════════════════════════════════════════════════════════════
// COMPOSICIÓN PRINCIPAL
// ════════════════════════════════════════════════════════════════════════
export const NewsHorizontal: React.FC<NewsHorizontalProps> = ({
  videoSrc,
  transcript,
  brand,
  ticker,
  chyrons,
  cards,
}) => {
  const {fps} = useVideoConfig();

  const resolvedCards = React.useMemo(() => resolveCards(cards, transcript, fps), [cards, transcript, fps]);
  const resolvedChyrons = React.useMemo(() => resolveChyrons(chyrons, transcript, fps), [chyrons, transcript, fps]);

  const frame = useCurrentFrame();
  // un card activo oculta el chyron para no competir en el tercio inferior
  const cardActive = resolvedCards.some((r) => frame >= r.startF && frame < r.endF);

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* CAPA 1 — video */}
      <VideoLayer videoSrc={videoSrc} />

      {/* CAPA 2 — chyrons (ocultos si hay card activo) */}
      {!cardActive &&
        resolvedChyrons.map((r, i) => (
          <Sequence key={`chy-${i}`} from={r.startF} durationInFrames={Math.max(1, r.endF - r.startF)}>
            <ChyronLayer kicker={r.cue.kicker} title={r.cue.title} fps={fps} />
          </Sequence>
        ))}

      {/* CAPA 3 — tarjetas */}
      {resolvedCards.map((r, i) => (
        <Sequence key={`card-${i}`} from={r.startF} durationInFrames={Math.max(1, r.endF - r.startF)}>
          <CardRouter c={r.cue} fps={fps} />
          <Audio src={staticFile(SFX_SRC)} volume={0.5} />
        </Sequence>
      ))}

      {/* CAPA 4 — barra de noticias persistente */}
      <NewsBar brand={brand} ticker={ticker} fps={fps} />

      {/* CAPA 5 — bug superior */}
      <NewsBug brand={brand} fps={fps} />
    </AbsoluteFill>
  );
};
