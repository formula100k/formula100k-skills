import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont as loadSerif} from '@remotion/google-fonts/InstrumentSerif';
import {loadFont as loadMano} from '@remotion/google-fonts/GochiHand';
import {loadFont as loadPalo} from '@remotion/google-fonts/Montserrat';
import {loadFont as loadPoster} from '@remotion/google-fonts/Anton';
import type {Camara, Gancho, Lamina, Nota, NotitasProps, Palabra, Sfx, Sticker, ZonaSub} from './tipos';
import {LaminaCapa} from './Lamina';
import {MockupCapa} from './Mockup';

// ──────────────────────────────────────────────────────────────────────
// Estilo «notitas»: subtítulo de UNA palabra en serif, notitas a mano que
// aparecen con corte seco (23-oct: sin tecleo ni pop), capturas reales, y la cámara que
// cambia de encuadre en cada corte. Todos los tiempos llegan ya resueltos
// (segundos del video cortado) desde scripts/render.ts.
// ──────────────────────────────────────────────────────────────────────

const {fontFamily: SERIF} = loadSerif();
const {fontFamily: MANO} = loadMano();
const {fontFamily: PALO} = loadPalo('normal', {weights: ['800', '900'], subsets: ['latin', 'latin-ext']});
const {fontFamily: POSTER} = loadPoster('normal', {subsets: ['latin', 'latin-ext']});
const {fontFamily: SERIF_ITA} = loadSerif('italic');

export const AMARILLO = '#FFE14D';
// Doble sombra: el halo oscuro separa el texto de fondos claros (techos,
// paredes blancas) sin llegar a ser un trazo duro.
const SOMBRA = '0 2px 3px rgba(0,0,0,0.6), 0 0 16px rgba(0,0,0,0.5), 0 0 34px rgba(0,0,0,0.3)';

const color = (c?: string) =>
  c === 'blanco' ? '#FFFFFF' : c === 'rojo' ? '#FF3B4E' : c === 'verde' ? '#3DFF6A' : c === 'amarillo' || !c ? AMARILLO : c;
const fuente = (f?: string) => (f === 'serif' ? SERIF : MANO);

// ── Cámara: encuadre por tramo (zoom, blanco y negro, marco) ─────────────
const camaraEn = (t: number, tramos: Camara[]): Camara => {
  let actual: Camara = {desde: 0, hasta: 1e9, zoom: 1};
  for (const c of tramos) if (t >= c.desde && t < c.hasta) actual = c;
  return actual;
};

const Base: React.FC<{video: string; camara: Camara[]}> = ({video, camara}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const c = camaraEn(t, camara);
  const zoom = c.zoom ?? 1;
  const marco = c.marco ? 0.84 : 1;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill
        style={{
          transform: `scale(${marco})`,
          overflow: 'hidden',
        }}
      >
        <OffthreadVideo
          src={staticFile(video)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${zoom})`,
            transformOrigin: `${c.ox ?? 50}% ${c.oy ?? 38}%`,
            filter: c.bn ? 'grayscale(1) contrast(1.05)' : undefined,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Degradado negro suave arriba: las notitas se leen aunque el techo sea claro.
// ventanasLimpias: tramos con una escena a pantalla completa horneada en la base (papel, cartón): ahí no va.
const Degradado: React.FC<{limpias?: [number, number][]}> = ({limpias}) => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  if ((limpias ?? []).some(([a, b]) => t >= a && t < b)) return null;
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.32) 18%, rgba(0,0,0,0) 38%)',
      }}
    />
  );
};

// ── Subtítulo de una palabra ─────────────────────────────────────────────
const zonaEn = (t: number, zonas: ZonaSub[]): ZonaSub => {
  let z = zonas[0];
  for (const x of zonas) if (t >= x.desde) z = x;
  return z;
};

const enLamina = (t: number, laminas: Lamina[]) => laminas.some((l) => t >= l.desde && t < l.hasta);

const Palabras: React.FC<{palabras: Palabra[]; zonas: ZonaSub[]; tamano: number; laminas: Lamina[]; colorClave?: string}> = ({palabras, zonas, tamano, laminas, colorClave}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  // En una lámina habla el papel: el subtítulo se esconde.
  if (enLamina(t, laminas)) return null;
  // La palabra vive hasta que arranca la siguiente; si hay pausa larga, se apaga.
  let i = -1;
  for (let k = 0; k < palabras.length; k++) {
    const p = palabras[k];
    const fin = Math.min(palabras[k + 1]?.start ?? p.end + 0.4, p.end + 0.5);
    if (t >= p.start && t < fin) {
      i = k;
      break;
    }
  }
  if (i < 0) return null;
  const p = palabras[i];
  const z = zonaEn(t, zonas);
  if (z.oculto) return null;
  const f = Math.round((t - p.start) * fps);
  // Corte seco (23-oct, edición sin olor a IA): la palabra aparece entera, sin pop de entrada.
  void f;
  const escala = p.amarilla ? 1.2 : 1;
  const anclaX = z.alinear === 'der' ? '-100%' : z.alinear === 'centro' ? '-50%' : '0%';
  return (
    <div
      style={{
        position: 'absolute',
        left: z.x,
        top: z.y,
        transform: `translate(${anclaX}, -50%) scale(${escala})`,
        transformOrigin: z.alinear === 'der' ? 'right center' : z.alinear === 'centro' ? 'center' : 'left center',
        fontFamily: SERIF,
        fontSize: tamano,
        letterSpacing: -1.5,
        color: p.amarilla ? (colorClave ?? AMARILLO) : '#FFFFFF',
        textShadow: SOMBRA,
        whiteSpace: 'nowrap',
        lineHeight: 1,
      }}
    >
      {p.w}
    </div>
  );
};

// ── Texto que se escribe solo (gancho, notitas) ──────────────────────────
const tiempoEscritura = (texto: string) => Math.min(1.1, Math.max(0.3, texto.length * 0.035));

const Escrito: React.FC<{texto: string; escribe: boolean; desde: number}> = ({texto, escribe, desde}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!escribe) return <>{texto}</>;
  const prog = Math.min(1, (frame / fps - desde) / tiempoEscritura(texto));
  const n = Math.max(0, Math.round(prog * texto.length));
  // Los caracteres que faltan ocupan su lugar invisibles: el bloque no salta.
  return (
    <>
      {texto.slice(0, n)}
      <span style={{opacity: 0}}>{texto.slice(n)}</span>
    </>
  );
};

// Gancho «golpe»: la palabra que pega va enorme, en mayúsculas y en el color de su
// sentido (rojo = lo negativo, verde = lo que ganas, amarillo = la casa); la otra
// línea, chica y blanca. 23-oct (edición sin olor a IA): letra de DISEÑO elegida por
// tema (`letra`: condensada = Anton de póster, serif = Instrument Serif itálica,
// palo = Montserrat 900 de antes), SIN brillo ni degradado y con corte seco: está
// entera y quieta desde el cuadro 0, sin rebote ni animación de entrada.
const LETRAS: Record<string, {familia: string; ancho: number; estilo?: React.CSSProperties}> = {
  condensada: {familia: POSTER, ancho: 0.5, estilo: {fontWeight: 400, letterSpacing: 0, textTransform: 'uppercase'}},
  serif: {familia: SERIF_ITA, ancho: 0.56, estilo: {fontStyle: 'italic', letterSpacing: -2, textTransform: 'uppercase'}},
  palo: {familia: PALO, ancho: 0.74, estilo: {fontWeight: 900, letterSpacing: -2, textTransform: 'uppercase'}},
  // 23-oct «editorial»: el look minimalista de revista de los notitas (Instrument Serif recta,
  // enorme) con un color pastel sacado de la ropa de la toma (`color` en hex) y la chica en itálica.
  editorial: {familia: SERIF, ancho: 0.47, estilo: {fontWeight: 400, letterSpacing: -3, textTransform: 'uppercase'}},
};
const SOMBRA_SECA = '0 3px 8px rgba(0,0,0,0.55)';
// El pastel es claro: en techos y paredes blancas necesita un halo suave para leerse.
const SOMBRA_PASTEL = '0 2px 4px rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.35)';
const GanchoGolpe: React.FC<{g: Gancho}> = ({g}) => {
  const c = color(g.color);
  const grande = g.grande ?? g.lineas.length - 1;
  const L = LETRAS[g.letra ?? 'condensada'] ?? LETRAS.condensada;
  // La línea grande nunca se sale del cuadro: `ancho` = em aproximados por letra en mayúsculas.
  const largo = Math.max(1, (g.lineas[grande] ?? '').length);
  const base = Math.min(g.tamano ?? 170, Math.floor(1000 / (largo * L.ancho)));
  return (
    <div style={{position: 'absolute', top: g.y ?? 240, left: 40, right: 40, textAlign: 'center'}}>
      {g.lineas.map((l, i) =>
        i === grande ? (
          <div
            key={i}
            style={{
              fontFamily: L.familia,
              fontSize: base,
              lineHeight: 0.98,
              color: c,
              ...L.estilo,
              textShadow: g.letra === 'editorial' ? SOMBRA_PASTEL : SOMBRA_SECA,
              whiteSpace: 'nowrap',
            }}
          >
            {l}
          </div>
        ) : (
          <div
            key={i}
            style={
              g.chica === 'sans'
                ? {fontFamily: PALO, fontWeight: 800, fontSize: Math.max(48, base * 0.4), textTransform: 'uppercase', color: '#FFFFFF', letterSpacing: 0, textShadow: SOMBRA, margin: '6px 0'}
                : {fontFamily: SERIF_ITA, fontStyle: 'italic', fontSize: Math.max(64, base * 0.5), color: '#FFFFFF', letterSpacing: -1, lineHeight: 1, textShadow: SOMBRA, margin: '4px 0'}
            }
          >
            {l}
          </div>
        ),
      )}
    </div>
  );
};

const GanchoCapa: React.FC<{g: Gancho}> = ({g}) => {
  if (g.estilo === 'golpe') return <GanchoGolpe g={g} />;
  const serif = (g.fuente ?? 'serif') === 'serif';
  return (
    <div
      style={{
        position: 'absolute',
        top: g.y ?? 300,
        left: 60,
        right: 60,
        textAlign: 'center',
        textShadow: SOMBRA,
      }}
    >
      <div
        style={{
          fontFamily: serif ? SERIF : MANO,
          fontSize: g.tamano ?? (serif ? 104 : 84),
          letterSpacing: serif ? -3 : 0,
          lineHeight: serif ? 0.92 : 1.05,
          color: color(g.color),
        }}
      >
        {g.lineas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      {g.sub ? (
        <div style={{fontFamily: MANO, fontSize: 54, color: '#FFFFFF', marginTop: 10}}>
          <Escrito texto={g.sub} escribe={false} desde={g.subDesde ?? 0.4} />
        </div>
      ) : null}
    </div>
  );
};

const NotaCapa: React.FC<{n: Nota}> = ({n}) => (
  <div
    style={{
      position: 'absolute',
      left: n.x,
      top: n.y,
      transform: `translate(-50%, -50%) rotate(${n.rot ?? 0}deg)`,
      fontFamily: fuente(n.fuente),
      fontSize: n.tamano ?? 84,
      letterSpacing: n.fuente === 'serif' ? -2 : 0,
      lineHeight: 1.05,
      color: color(n.color),
      textShadow: SOMBRA,
      whiteSpace: 'pre',
      textAlign: 'center',
      ...(n.recuadro
        ? {border: `3px solid ${color(n.color)}`, borderRadius: 14, padding: '6px 22px'}
        : {}),
    }}
  >
    {/* 23-oct: corte seco por defecto; el tecleo solo si el plan pide `escribe: true` */}
    <Escrito texto={n.texto} escribe={n.escribe === true} desde={0} />
  </div>
);

// ── Stickers: memes, capturas, logos y emojis ────────────────────────────
const StickerCapa: React.FC<{s: Sticker}> = ({s}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // 23-oct: entra con corte seco (sin pop de escala).
  void frame; void fps;
  const escala = 1;
  const comun: React.CSSProperties = {
    position: 'absolute',
    left: s.x,
    top: s.y,
    transform: `translate(-50%, -50%) rotate(${s.rot ?? 0}deg) scale(${escala})`,
  };
  if (s.emoji) {
    return <div style={{...comun, fontSize: s.w ?? 110, lineHeight: 1, letterSpacing: 6}}>{s.emoji}</div>;
  }
  const tipo = s.tipo ?? 'meme';
  const marco: React.CSSProperties =
    tipo === 'captura'
      ? {borderRadius: 22, boxShadow: '0 18px 40px rgba(0,0,0,0.35)'}
      : tipo === 'logo'
        ? {filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.3))'}
        : {border: '5px solid #FFFFFF', boxShadow: '0 10px 26px rgba(0,0,0,0.3)'};
  return (
    <div style={comun}>
      {/\.(mp4|mov|webm)$/i.test(s.src!) ? (
        <OffthreadVideo muted src={staticFile(s.src!)} style={{width: s.w ?? 340, height: 'auto', display: 'block', ...marco}} />
      ) : (
        <Img src={staticFile(s.src!)} style={{width: s.w ?? 340, height: 'auto', display: 'block', ...marco}} />
      )}
      {s.insignia ? (
        <div
          style={{
            position: 'absolute',
            left: -34,
            top: -34,
            width: 104,
            height: 104,
            borderRadius: '50%',
            background: AMARILLO,
            color: '#111',
            fontFamily: SERIF,
            fontSize: 70,
            lineHeight: '104px',
            textAlign: 'center',
            letterSpacing: -2,
            boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
          }}
        >
          {s.insignia}
        </div>
      ) : null}
      {s.rotulo ? (
        <div style={{fontFamily: MANO, fontSize: 64, color: '#FFFFFF', textAlign: 'center', marginTop: 4, textShadow: SOMBRA, whiteSpace: 'nowrap'}}>
          {s.rotulo}
        </div>
      ) : null}
      {s.numero ? (
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 110,
            color: '#FFFFFF',
            textAlign: 'center',
            letterSpacing: -3,
            lineHeight: 1,
            marginTop: 6,
            textShadow: SOMBRA,
          }}
        >
          {s.numero}
        </div>
      ) : null}
    </div>
  );
};

const Efectos: React.FC<{sfx: Sfx[]}> = ({sfx}) => {
  const {fps} = useVideoConfig();
  return (
    <>
      {sfx.map((s, i) => (
        <Sequence
          key={i}
          from={Math.max(0, Math.round(s.t * fps))}
          durationInFrames={Math.max(1, Math.round((s.dur ?? 0.6) * fps))}
          layout="none"
        >
          <Audio src={staticFile(`_sfx/${s.archivo}`)} volume={s.vol ?? 0.5} />
        </Sequence>
      ))}
    </>
  );
};

const enVentana = (desde: number, hasta: number, fps: number) => ({
  from: Math.max(0, Math.round(desde * fps)),
  durationInFrames: Math.max(1, Math.round((hasta - desde) * fps)),
});

export const Notitas: React.FC<NotitasProps> = (p) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill>
      <Base video={p.video} camara={p.camara} />
      <Degradado limpias={p.ventanasLimpias} />
      {p.gancho ? (
        <Sequence {...enVentana(0, p.gancho.hasta, fps)} layout="none">
          <GanchoCapa g={p.gancho} />
        </Sequence>
      ) : null}
      {p.stickers.map((s, i) => (
        <Sequence key={`s${i}`} {...enVentana(s.desde, s.hasta, fps)} layout="none">
          <StickerCapa s={s} />
        </Sequence>
      ))}
      {p.notitas.map((n, i) => (
        <Sequence key={`n${i}`} {...enVentana(n.desde, n.hasta, fps)} layout="none">
          <NotaCapa n={n} />
        </Sequence>
      ))}
      {(p.mockups ?? []).map((m, i) => (
        <Sequence key={`m${i}`} {...enVentana(m.desde, m.hasta, fps)} layout="none">
          <MockupCapa m={m} mano={MANO} />
        </Sequence>
      ))}
      {p.laminas.map((l, i) => (
        <Sequence key={`l${i}`} {...enVentana(l.desde, l.hasta, fps)} layout="none">
          <LaminaCapa l={l} serif={SERIF} mano={MANO} />
        </Sequence>
      ))}
      <Palabras palabras={p.palabras} zonas={p.zonas} tamano={p.tamanoSub} laminas={p.laminas} colorClave={p.colorClave} />
      <Efectos sfx={p.sfx} />
    </AbsoluteFill>
  );
};
