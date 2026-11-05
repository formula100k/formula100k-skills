import React from 'react';
import {Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Mockup} from './tipos';

// ──────────────────────────────────────────────────────────────────────
// Mockups «notitas»: lo que se nombra se ve de verdad (pedido original:
// «no agrega el prompt cuando menciono que pegue un prompt… ni mockups
// cuando menciono skill, audio de voz o carpeta»). Cada uno es una tarjeta
// pegada con cinta sobre el video, girada y con el temblor de garabato de
// las láminas, con un rótulo a mano opcional. Por dentro, la interfaz real
// (chat de Claude, tarjeta de skill, nota de voz de WhatsApp, carpeta,
// post publicado, chat de WhatsApp) para que lo dicho se sienta real.
// Todos los tiempos (`accion`, `tiempos`) llegan en segundos del video.
// ──────────────────────────────────────────────────────────────────────

const CADA = Number.POSITIVE_INFINITY; // 23-oct: sin temblor de garabato (antes 4 cuadros)
const CLAUDE = '#D97757';
const CREMA = '#FAF9F5';
const TINTA = '#1F1E1D';
const GRIS = '#8A877F';
const AMARILLO = '#FFE14D';
const SOMBRA_TXT = '0 2px 3px rgba(0,0,0,0.6), 0 0 16px rgba(0,0,0,0.5)';
const SANS = '-apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';

const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {frame, fps, t: (d: number) => (frame / fps) >= d, seg: frame / fps};
};

/** Cuánto lleva una animación que arranca en `desde` (segundos relativos a la tarjeta). */
const prog = (seg: number, desde: number, dur: number) => Math.max(0, Math.min(1, (seg - desde) / dur));

const Cinta: React.FC<{s: string; izq?: string}> = ({s, izq = '50%'}) => (
  <div
    style={{
      position: 'absolute',
      top: -24,
      left: izq,
      width: 180,
      height: 46,
      transform: `translateX(-50%) rotate(${-5 + random(`${s}cinta`) * 10}deg)`,
      background: 'rgba(255, 240, 180, 0.82)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      zIndex: 3,
    }}
  />
);

// ── GUION: hoja de cuaderno donde el guion se escribe solo, línea por línea ─
const Guion: React.FC<{m: Mockup; seg: number; mano: string}> = ({m, seg, mano}) => {
  const lineas = m.items ?? [];
  return (
    <div
      style={{
        background: '#FFFDF6',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 67px, #C9DDF2 67px 70px)',
        backgroundPositionY: 96,
        padding: '26px 40px 30px 92px',
        position: 'relative',
        color: '#1F2A44',
      }}
    >
      <div style={{position: 'absolute', left: 66, top: 0, bottom: 0, width: 3, background: '#F2A3A3'}} />
      <div style={{fontFamily: mano, fontSize: 58, lineHeight: '70px', color: '#D93A2B'}}>{m.titulo ?? 'Mi guion'}</div>
      {lineas.map((l, i) => {
        const en = m.tiempos?.[i] ?? (m.accion ?? 0.15) + i * 0.3;
        const p = prog(seg, en, Math.min(0.5, l.length * 0.025));
        const n = Math.round(p * l.length);
        return (
          <div key={i} style={{fontFamily: mano, fontSize: 46, lineHeight: '70px', whiteSpace: 'nowrap'}}>
            {l.slice(0, n)}
            <span style={{opacity: 0}}>{l.slice(n) || ' '}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── PROMPT: el chat de Claude con el prompt que se pega (o se teclea) ────
const Prompt: React.FC<{m: Mockup; seg: number}> = ({m, seg}) => {
  const accion = m.accion ?? 0.35;
  const texto = m.texto ?? '';
  const pegar = m.pegar !== false;
  const n = pegar ? (seg >= accion ? texto.length : 0) : Math.round(prog(seg, accion, Math.min(1.4, texto.length * 0.03)) * texto.length);
  const destello = pegar ? 1 - prog(seg, accion, 0.5) : 0;
  const listo = n >= texto.length && seg >= accion;
  const envia = m.envia != null && seg >= m.envia;
  return (
    <div style={{background: CREMA, borderRadius: 28, padding: '30px 30px 26px', fontFamily: SANS, color: TINTA}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20}}>
        {m.icono ? <Img src={staticFile(m.icono)} style={{width: 52, height: 52, borderRadius: 12}} /> : null}
        <b style={{fontSize: 36, fontWeight: 700}}>{m.titulo ?? 'Claude'}</b>
      </div>
      <div
        style={{
          position: 'relative',
          background: '#FFFFFF',
          border: '2px solid #E5E2D9',
          borderRadius: 22,
          padding: '22px 24px 82px',
          fontSize: 32,
          lineHeight: 1.32,
          minHeight: 120,
          whiteSpace: 'pre-wrap',
        }}
      >
        {m.imgs?.[0] && seg >= (m.accion ?? 0.35) - 0.2 ? (
          // adjunto: la captura que se le manda (aparece justo antes del texto)
          <Img
            src={staticFile(m.imgs[0])}
            style={{display: 'block', width: 150, height: 150, objectFit: 'cover', objectPosition: 'top', borderRadius: 14, border: '2px solid #E5E2D9', marginBottom: 14}}
          />
        ) : null}
        {n === 0 ? <span style={{color: '#B5B2A9'}}>Escríbele a Claude…</span> : null}
        <span style={{background: `rgba(255, 214, 10, ${0.55 * destello})`, borderRadius: 6}}>{texto.slice(0, n)}</span>
        <span style={{opacity: 0}}>{texto.slice(n)}</span>
        {pegar && seg >= accion ? (
          <span
            style={{
              position: 'absolute',
              left: 22,
              bottom: 22,
              padding: '4px 14px',
              borderRadius: 8,
              background: AMARILLO,
              fontWeight: 800,
              fontSize: 22,
              opacity: Math.min(1, 0.3 + destello * 2),
            }}
          >
            Pegado
          </span>
        ) : null}
        <div
          style={{
            position: 'absolute',
            right: 18,
            bottom: 16,
            width: 54,
            height: 54,
            borderRadius: 14,
            background: listo ? CLAUDE : '#E8C9BB',
            color: '#FFF',
            fontSize: 32,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${envia ? 0.86 + 0.14 * prog(seg, m.envia!, 0.2) : 1})`,
          }}
        >
          ↑
        </div>
      </div>
      {m.respuesta && m.respuestaEn != null && seg >= m.respuestaEn ? (
        <div style={{marginTop: 20, padding: '0 6px', fontSize: 32, lineHeight: 1.3, opacity: prog(seg, m.respuestaEn, 0.25)}}>
          <span style={{color: CLAUDE, marginRight: 10}}>✳</span>
          {m.respuesta}
        </div>
      ) : null}
    </div>
  );
};

// ── SKILL: tarjeta que pasa de «Instalar» a «Instalada ✓» y luego trabaja ─
const Skill: React.FC<{m: Mockup; seg: number}> = ({m, seg}) => {
  const accion = m.accion ?? 0.5;
  const ok = seg >= accion;
  const pop = prog(seg, accion, 0.18);
  return (
    <div style={{background: '#FFFFFF', borderRadius: 28, padding: '30px 30px 30px', fontFamily: SANS, color: TINTA}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <div
          style={{
            flex: 'none',
            width: 104,
            height: 104,
            borderRadius: 24,
            background: `linear-gradient(145deg, #F2A07F, ${CLAUDE})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 56,
          }}
        >
          {m.icono ? <Img src={staticFile(m.icono)} style={{width: 70, height: 70, borderRadius: 16}} /> : '⚡'}
        </div>
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{fontSize: 40, fontWeight: 800, lineHeight: 1.08, letterSpacing: -0.8}}>{m.texto ?? 'Skill'}</div>
          <div style={{marginTop: 6, fontSize: 26, fontWeight: 600, color: GRIS}}>{m.sub ?? 'Skill para Claude'}</div>
        </div>
        <div
          style={{
            flex: 'none',
            padding: '12px 22px',
            borderRadius: 999,
            fontSize: 26,
            fontWeight: 800,
            whiteSpace: 'nowrap',
            border: `2px solid ${ok ? '#2E8B57' : CLAUDE}`,
            background: ok ? '#2E8B57' : 'transparent',
            color: ok ? '#FFF' : CLAUDE,
            transform: `scale(${ok ? 0.8 + 0.2 * pop : 1})`,
          }}
        >
          {ok ? 'Instalada ✓' : 'Instalar'}
        </div>
      </div>
      {m.items?.length ? (
        <div style={{marginTop: 24, paddingTop: 20, borderTop: '2px solid #EEE'}}>
          {m.items.map((it, i) => {
            const en = m.tiempos?.[i] ?? accion + 0.4 + i * 0.35;
            const v = prog(seg, en, 0.2);
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: i ? 12 : 0, fontSize: 32, fontWeight: 700, opacity: 0.15 + 0.85 * v, transform: `translateX(${(1 - v) * 16}px)`}}>
                <span style={{flex: 'none', width: 46, height: 46, borderRadius: 12, background: CLAUDE, color: '#FFF', fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {i + 1}
                </span>
                {it}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

// ── VOZ: nota de voz de WhatsApp que suena (onda que se mueve, contador) ─
const Voz: React.FC<{m: Mockup; seg: number; frame: number}> = ({m, seg, frame}) => {
  const accion = m.accion ?? 0.3;
  const N = 30;
  const total = m.segundos ?? 12;
  const corre = Math.max(0, seg - accion);
  const avance = Math.min(1, corre / Math.max(0.8, (m.duracion ?? 2) - accion));
  const s = Math.min(total, Math.floor(avance * total));
  return (
    <div style={{background: '#EFEAE2', borderRadius: 28, padding: '34px 28px', fontFamily: SANS}}>
      <div
        style={{
          marginLeft: 'auto',
          width: '92%',
          background: '#D9FDD3',
          borderRadius: '24px 6px 24px 24px',
          padding: '20px 22px 14px',
          boxShadow: '0 2px 2px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {m.avatar ? (
          <div style={{position: 'relative', flex: 'none'}}>
            <Img src={staticFile(m.avatar)} style={{width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', display: 'block'}} />
            <span style={{position: 'absolute', right: -6, bottom: -4, fontSize: 30}}>🎙️</span>
          </div>
        ) : null}
        <div style={{flex: 'none', width: 0, height: 0, borderLeft: '30px solid #54656F', borderTop: '18px solid transparent', borderBottom: '18px solid transparent', marginLeft: 6, opacity: seg >= accion ? 0 : 1}} />
        {seg >= accion ? <div style={{flex: 'none', display: 'flex', gap: 8, marginLeft: -24}}><i style={{width: 9, height: 34, background: '#54656F', borderRadius: 2}} /><i style={{width: 9, height: 34, background: '#54656F', borderRadius: 2}} /></div> : null}
        <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: 5, height: 70}}>
          {Array.from({length: N}, (_, i) => {
            const base = 14 + Math.round(46 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
            const vivo = seg >= accion ? 0.55 + 0.45 * Math.abs(Math.sin(frame * 0.45 + i)) : 1;
            const oido = i / N < avance;
            return <b key={i} style={{display: 'block', width: 7, height: base * vivo, borderRadius: 4, background: oido ? '#25D366' : '#9DB0A0'}} />;
          })}
        </div>
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', width: '92%', marginLeft: 'auto', marginTop: 8, fontSize: 24, color: '#667781'}}>
        <span>0:{String(seg >= accion ? s : total).padStart(2, '0')}</span>
        <span>
          {m.hora ?? '9:41'} <span style={{color: '#53BDEB'}}>✓✓</span>
        </span>
      </div>
    </div>
  );
};

// ── CHAT: conversación de WhatsApp (mensajes que aparecen uno por uno) ───
const Chat: React.FC<{m: Mockup; seg: number}> = ({m, seg}) => (
  <div style={{background: '#EFEAE2', borderRadius: 28, padding: '26px 24px', fontFamily: SANS, color: '#111B21'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid rgba(0,0,0,0.08)'}}>
      {m.avatar ? <Img src={staticFile(m.avatar)} style={{width: 58, height: 58, borderRadius: '50%', objectFit: 'cover'}} /> : null}
      <b style={{fontSize: 30}}>{m.titulo ?? 'Chat'}</b>
    </div>
    {(m.mensajes ?? []).map((x, i) => {
      const en = m.tiempos?.[i] ?? (m.accion ?? 0.2) + i * 0.35;
      if (seg < en) return null;
      const v = prog(seg, en, 0.15);
      const mio = x.de === 'yo';
      return (
        <div key={i} style={{display: 'flex', justifyContent: mio ? 'flex-end' : 'flex-start', marginTop: i ? 10 : 0}}>
          <div
            style={{
              maxWidth: '82%',
              background: mio ? '#D9FDD3' : '#FFFFFF',
              borderRadius: mio ? '20px 6px 20px 20px' : '6px 20px 20px 20px',
              padding: '12px 18px',
              fontSize: 30,
              lineHeight: 1.3,
              boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
              transform: `scale(${0.85 + 0.15 * v})`,
              transformOrigin: mio ? 'right top' : 'left top',
              opacity: v,
            }}
          >
            {x.texto}
          </div>
        </div>
      );
    })}
  </div>
);

// ── CARPETA: las capturas caen una por una adentro; el contador sube ─────
const Carpeta: React.FC<{m: Mockup; seg: number; w: number}> = ({m, seg, w}) => {
  const imgs = m.imgs ?? [];
  const ats = imgs.map((_, i) => m.tiempos?.[i] ?? (m.accion ?? 0.3) + i * 0.3);
  const dentro = ats.filter((a) => seg >= a + 0.45).length;
  const fw = w * 0.78;
  const alto = w * 0.92;
  return (
    <div style={{position: 'relative', width: w, height: alto, fontFamily: SANS}}>
      {/* tapa de atrás */}
      <div style={{position: 'absolute', left: (w - fw) / 2, bottom: 0, width: fw, height: fw * 0.66, borderRadius: 26, background: '#C9922F'}} />
      <div style={{position: 'absolute', left: (w - fw) / 2, bottom: fw * 0.66 - 8, width: fw * 0.38, height: 52, borderRadius: '18px 18px 0 0', background: '#C9922F'}} />
      {imgs.map((src, i) => {
        const p = prog(seg, ats[i], 0.45);
        if (p <= 0) return null;
        const lado = i % 2 ? 1 : -1;
        const x = interpolate(p, [0, 1], [lado * (w * 0.32), lado * 12]);
        const y = interpolate(p, [0, 0.5, 1], [-alto * 0.08, -alto * 0.14, alto * 0.42], {extrapolateRight: 'clamp'});
        const iw = w * 0.3;
        return (
          <Img
            key={i}
            src={staticFile(src)}
            style={{
              position: 'absolute',
              left: w / 2 - iw / 2 + x,
              top: y,
              width: iw,
              height: iw * 1.25,
              objectFit: 'cover',
              borderRadius: 10,
              border: '5px solid #FFF',
              boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
              transform: `rotate(${lado * (12 - 10 * p)}deg)`,
              opacity: p < 0.98 ? 1 : 0,
            }}
          />
        );
      })}
      {/* frente */}
      <div
        style={{
          position: 'absolute',
          left: (w - fw) / 2,
          bottom: 0,
          width: fw,
          height: fw * 0.5,
          borderRadius: 26,
          background: 'linear-gradient(#F6C567, #E2A541)',
          boxShadow: '0 -6px 20px rgba(0,0,0,0.2), 0 18px 40px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 44,
          fontWeight: 800,
          color: '#3A2606',
        }}
      >
        {m.texto ?? 'Referencias'}
      </div>
      <div
        style={{
          position: 'absolute',
          right: (w - fw) / 2 - 24,
          bottom: fw * 0.5 - 30,
          minWidth: 86,
          height: 86,
          padding: '0 18px',
          borderRadius: 43,
          background: '#FF3B4E',
          color: '#FFF',
          fontSize: 46,
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
        }}
      >
        {dentro}
      </div>
    </div>
  );
};

// ── POST_IG: el post ya publicado (imagen completa 4:5, corazón que late) ─
const PostIg: React.FC<{m: Mockup; seg: number}> = ({m, seg}) => {
  const img = m.imgs?.[0];
  const late = m.accion != null && seg >= m.accion;
  const pop = late ? Math.sin(Math.PI * prog(seg, m.accion!, 0.3)) : 0;
  return (
    <div style={{background: '#FFF', borderRadius: 24, overflow: 'hidden', fontFamily: SANS, color: '#000'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px'}}>
        <div style={{width: 58, height: 58, borderRadius: '50%', padding: 3, background: 'linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7)'}}>
          {m.avatar ? <Img src={staticFile(m.avatar)} style={{width: '100%', height: '100%', borderRadius: '50%', border: '3px solid #FFF', objectFit: 'cover', display: 'block'}} /> : null}
        </div>
        <b style={{fontSize: 28}}>{m.usuario ?? 'tu_usuario'}</b>
        <span style={{marginLeft: 'auto', fontSize: 30, letterSpacing: 2}}>···</span>
      </div>
      {img ? <Img src={staticFile(img)} style={{display: 'block', width: '100%', aspectRatio: '4 / 5', objectFit: 'cover'}} /> : null}
      <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '16px 20px 6px', fontSize: 44, lineHeight: 1}}>
        <span style={{color: late ? '#FF3040' : '#000', transform: `scale(${1 + 0.35 * pop})`, display: 'inline-block'}}>{late ? '♥' : '♡'}</span>
        <span>💬</span>
        <span>➤</span>
        <span style={{marginLeft: 'auto'}}>🔖</span>
      </div>
      {m.texto ? (
        <div style={{padding: '4px 20px 20px', fontSize: 26, lineHeight: 1.3}}>
          <b>{m.usuario ?? 'tu_usuario'}</b> {m.texto}
        </div>
      ) : null}
    </div>
  );
};

export const MockupCapa: React.FC<{m: Mockup; mano: string}> = ({m, mano}) => {
  const {frame, fps, seg} = useT();
  const k = Math.floor(frame / CADA) % 3;
  const s = `${m.tipo}${m.x}${m.y}`;
  // temblor de garabato, como las fotos pegadas de las láminas
  const r = (m.rot ?? -2) + (random(`${s}r${k}`) - 0.5) * 1.6;
  const dx = (random(`${s}x${k}`) - 0.5) * 5;
  const dy = (random(`${s}y${k}`) - 0.5) * 5;
  const w = m.w ?? 760;
  const sinMarco = m.tipo === 'carpeta';
  let cuerpo: React.ReactNode = null;
  if (m.tipo === 'prompt') cuerpo = <Prompt m={m} seg={seg} />;
  if (m.tipo === 'guion') cuerpo = <Guion m={m} seg={seg} mano={mano} />;
  if (m.tipo === 'skill') cuerpo = <Skill m={m} seg={seg} />;
  if (m.tipo === 'voz') cuerpo = <Voz m={m} seg={seg} frame={frame} />;
  if (m.tipo === 'chat') cuerpo = <Chat m={m} seg={seg} />;
  if (m.tipo === 'carpeta') cuerpo = <Carpeta m={m} seg={seg} w={w} />;
  if (m.tipo === 'post_ig') cuerpo = <PostIg m={m} seg={seg} />;
  return (
    <div
      style={{
        position: 'absolute',
        left: m.x ?? 540,
        top: m.y ?? 1430,
        width: w,
        transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${r}deg)`, // 23-oct: corte seco, sin pop
      }}
    >
      {m.rotulo ? (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 10,
            marginBottom: 26,
            fontFamily: mano,
            fontSize: 64,
            color: AMARILLO,
            textShadow: SOMBRA_TXT,
            whiteSpace: 'nowrap',
            transform: 'rotate(-3deg)',
          }}
        >
          {m.rotulo}
        </div>
      ) : null}
      {sinMarco ? (
        cuerpo
      ) : (
        <div style={{position: 'relative', borderRadius: 34, border: '8px solid #FFFFFF', boxShadow: '0 22px 50px rgba(0,0,0,0.45)', background: '#FFF'}}>
          <Cinta s={s} izq="22%" />
          <div style={{borderRadius: 26, overflow: 'hidden'}}>{cuerpo}</div>
        </div>
      )}
    </div>
  );
};
