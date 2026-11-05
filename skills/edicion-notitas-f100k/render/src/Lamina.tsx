import React from 'react';
import {AbsoluteFill, Img, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ItemLamina, Lamina} from './tipos';

// ──────────────────────────────────────────────────────────────────────
// Lámina de papel a pantalla completa. Se usa cuando hay que explicar algo
// (un flujo, una lista, un mockup, un antes/después) y la cara sola no
// alcanza. Todo está dibujado a mano. 23-oct (edición sin olor a IA): ya no
// «hierve»: el trazo y las fotos quedan quietos, sin temblor ni pop.
// ──────────────────────────────────────────────────────────────────────

const PAPEL = '#F3ECDD';
const TINTA = '#232019';
const ROJO = '#D93A2B';
const VERDE = '#2E8B57';
const RESALTADOR = 'rgba(255, 214, 10, 0.75)';
const CADA = Number.POSITIVE_INFINITY; // 23-oct: sin temblor (antes 4 cuadros entre uno y otro)

const paso = (frame: number) => Math.floor(frame / CADA);

/** Línea temblorosa de (x1,y1) a (x2,y2), con una curva leve y dos pasadas. */
const linea = (x1: number, y1: number, x2: number, y2: number, s: string) => {
  const j = (k: string, a: number) => (random(`${s}${k}`) - 0.5) * a;
  const mx = (x1 + x2) / 2 + j('mx', 10);
  const my = (y1 + y2) / 2 + j('my', 10);
  return `M ${x1 + j('a', 4)} ${y1 + j('b', 4)} Q ${mx} ${my} ${x2 + j('c', 4)} ${y2 + j('d', 4)}`;
};

/** Rectángulo a mano: cuatro lados que se pasan un poco en las esquinas. */
const caja = (x: number, y: number, w: number, h: number, s: string) =>
  [
    linea(x - 6, y, x + w + 8, y + 2, `${s}1`),
    linea(x + w, y - 6, x + w - 2, y + h + 8, `${s}2`),
    linea(x + w + 6, y + h, x - 8, y + h - 2, `${s}3`),
    linea(x, y + h + 6, x + 2, y - 8, `${s}4`),
  ].join(' ');

const flecha = (x: number, y1: number, y2: number, s: string) =>
  `${linea(x, y1, x, y2, s)} ${linea(x - 26, y2 - 30, x, y2, `${s}i`)} ${linea(x + 26, y2 - 30, x, y2, `${s}d`)}`;

const check = (x: number, y: number, s: string, f = 1) =>
  `${linea(x, y, x + 26 * f, y + 30 * f, `${s}a`)} ${linea(x + 26 * f, y + 30 * f, x + 76 * f, y - 40 * f, `${s}b`)}`;
const cruz = (x: number, y: number, t: number, s: string) =>
  `${linea(x - t, y - t, x + t, y + t, `${s}a`)} ${linea(x + t, y - t, x - t, y + t, `${s}b`)}`;

/** Trazo que se dibuja solo entre `desde` y `desde + dur` (en cuadros). */
const Trazo: React.FC<{d: string; frame: number; desde: number; dur?: number; color?: string; ancho?: number}> = ({
  d,
  frame,
  desde,
  dur = 7,
  color = TINTA,
  ancho = 6,
}) => {
  const p = Math.max(0, Math.min(1, (frame - desde) / dur));
  if (p <= 0) return null;
  return (
    <path
      d={d}
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - p}
      fill="none"
      stroke={color}
      strokeWidth={ancho}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

/** Imagen real con cinta adhesiva que tiembla como garabato. */
const Foto: React.FC<{src: string; w: number; rot: number; s: string; frame: number; desde: number; celular?: boolean}> = ({
  src,
  w,
  rot,
  s,
  frame,
  desde,
  celular,
}) => {
  const {fps} = useVideoConfig();
  if (frame < desde) return null;
  const k = paso(frame);
  const r = rot + (random(`${s}r${k % 3}`) - 0.5) * 2.4;
  const dx = (random(`${s}x${k % 3}`) - 0.5) * 6;
  const dy = (random(`${s}y${k % 3}`) - 0.5) * 6;
  return (
    <div
      style={{
        position: 'relative',
        transform: `translate(${dx}px, ${dy}px) rotate(${r}deg)`, // 23-oct: corte seco, sin pop
        width: w,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          display: 'block',
          borderRadius: celular ? 46 : 6,
          border: celular ? `14px solid ${TINTA}` : '10px solid #FFFFFF',
          boxShadow: '0 14px 30px rgba(60,40,10,0.28)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -22,
          left: '50%',
          width: 170,
          height: 44,
          transform: `translateX(-50%) rotate(${-4 + random(`${s}t`) * 8}deg)`,
          background: 'rgba(255, 240, 180, 0.78)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
        }}
      />
    </div>
  );
};

const Texto: React.FC<{children: React.ReactNode; frame: number; desde: number; tamano: number; fuente: string; color?: string; style?: React.CSSProperties}> = ({
  children,
  frame,
  desde,
  tamano,
  fuente,
  color = TINTA,
  style,
}) => {
  const {fps} = useVideoConfig();
  if (frame < desde) return null;
  return (
    <div style={{fontFamily: fuente, fontSize: tamano, color, lineHeight: 1.05, ...style}}>
      {children}
    </div>
  );
};

export const LaminaCapa: React.FC<{l: Lamina; serif: string; mano: string}> = ({l, serif, mano}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = paso(frame);
  const semilla = l.semilla ?? 1;
  const id = `hervor-${semilla}`;
  const enCuadros = (it: ItemLamina) => Math.max(0, Math.round((it.t - l.desde) * fps));
  // La hoja entra deslizándose desde abajo, un poco girada.
  const entra = spring({frame, fps, config: {stiffness: 300, damping: 26}, durationInFrames: 9});
  const n = l.items.length;

  const titulo = l.titulo ? (
    <div style={{position: 'absolute', top: 190, left: 70, right: 70, textAlign: 'center'}}>
      <div style={{position: 'relative', display: 'inline-block'}}>
        <div
          style={{
            position: 'absolute',
            left: -18,
            right: -18,
            top: '52%',
            height: '42%',
            background: RESALTADOR,
            transformOrigin: 'left center',
            transform: `scaleX(${Math.min(1, Math.max(0, (frame - 4) / 8))}) rotate(-1deg)`,
            borderRadius: 8,
          }}
        />
        <Texto frame={frame} desde={1} tamano={l.titulo.length > 18 ? 112 : 136} fuente={serif} style={{position: 'relative', letterSpacing: -2}}>
          {l.titulo}
        </Texto>
      </div>
    </div>
  ) : null;

  let cuerpo: React.ReactNode = null;
  let trazos: React.ReactNode = null;

  if (l.tipo === 'flujo' || l.tipo === 'lista') {
    // Las cajas llenan la hoja: más grandes cuantos menos pasos haya.
    const zona = 1380;
    const alto = Math.min(400, zona / Math.max(n, 1));
    const arriba = 450 + (zona - alto * n) / 2;
    const caja_h = l.tipo === 'flujo' ? alto - 100 : alto - 40;
    const foto_w = Math.min(caja_h + 10, 250);
    trazos = l.items.map((it, i) => {
      const f0 = enCuadros(it);
      const y = arriba + i * alto;
      const s = `${semilla}-${i}-${k % 3}`;
      return (
        <g key={i}>
          {l.tipo === 'flujo' ? <Trazo d={caja(110, y, 860, caja_h, s)} frame={frame} desde={f0} /> : null}
          {l.tipo === 'flujo' && i > 0 ? <Trazo d={flecha(540, y - 82, y - 12, `${s}f`)} frame={frame} desde={f0 - 4} dur={5} /> : null}
          {l.tipo === 'lista' ? <Trazo d={caja(110, y + caja_h / 2 - 45, 90, 90, s)} frame={frame} desde={f0} dur={5} /> : null}
          {it.check ? <Trazo d={check(l.tipo === 'lista' ? 122 : 860, y + caja_h / 2 - 4, s)} frame={frame} desde={f0 + 6} dur={5} color={VERDE} ancho={9} /> : null}
          {it.tachado ? <Trazo d={linea(230, y + caja_h / 2 + 4, 960, y + caja_h / 2 - 6, `${s}t`)} frame={frame} desde={f0 + 8} dur={6} color={ROJO} ancho={9} /> : null}
        </g>
      );
    });
    cuerpo = l.items.map((it, i) => {
      const f0 = enCuadros(it);
      const y = arriba + i * alto;
      const izq = l.tipo === 'lista' ? 250 : it.img ? 190 + foto_w : 150;
      return (
        <React.Fragment key={i}>
          {it.img ? (
            <div style={{position: 'absolute', left: 150, top: y + caja_h / 2, transform: 'translateY(-50%)'}}>
              <Foto src={it.img} w={foto_w} rot={-4 + i * 3} s={`${semilla}f${i}`} frame={frame} desde={f0 + 2} />
            </div>
          ) : null}
          <div style={{position: 'absolute', left: izq, right: 130, top: y, height: caja_h, display: 'flex', alignItems: 'center', justifyContent: it.img || l.tipo === 'lista' ? 'flex-start' : 'center', textAlign: it.img || l.tipo === 'lista' ? 'left' : 'center'}}>
            <Texto frame={frame} desde={f0 + 3} tamano={it.texto && it.texto.length > 20 ? 80 : 96} fuente={mano}>
              {l.tipo === 'lista' && !it.check ? <span style={{fontFamily: serif, marginRight: 18}}>{i + 1}.</span> : null}
              {it.texto}
            </Texto>
          </div>
        </React.Fragment>
      );
    });
  }

  if (l.tipo === 'mockup') {
    const conImg = l.items.filter((it) => it.img);
    if (conImg.length === 1 && (l.marco ?? 'celular') === 'celular') {
      const it = conImg[0];
      const cw = l.ancho ?? 540;
      const ch = (cw * 1920) / 1080 + 28;
      const cy = l.ancho ? 360 + ch / 2 : 1040;
      const notaTop = l.ancho ? 360 + ch + 24 : 1700;
      cuerpo = (
        <>
          <div style={{position: 'absolute', left: 540, top: cy, transform: 'translate(-50%, -50%)'}}>
            <Foto src={it.img!} w={cw} rot={-2} s={`${semilla}m`} frame={frame} desde={enCuadros(it)} celular />
          </div>
          {l.items
            .filter((x) => !x.img)
            .map((x, i) => (
              <div key={i} style={{position: 'absolute', left: 80, right: 80, top: notaTop + i * 90, textAlign: 'center', transform: `rotate(${-3 + i * 2}deg)`}}>
                <Texto frame={frame} desde={enCuadros(x)} tamano={72} fuente={mano} color={ROJO}>
                  {x.texto}
                </Texto>
              </div>
            ))}
        </>
      );
    } else {
      // Collage de capturas pegadas con cinta, cada una con su rótulo a mano.
      // Una sola captura sin celular (un cuadro, una gráfica): centrada y grande, bajo el título.
      const pos = l.items.length === 1 ? [[540, 1000, -2]] : [
        [300, 720, -6],
        [780, 820, 5],
        [330, 1300, 4],
        [770, 1400, -5],
      ];
      cuerpo = l.items.slice(0, 4).map((it, i) => (
        <div key={i} style={{position: 'absolute', left: pos[i][0], top: pos[i][1], transform: 'translate(-50%, -50%)', textAlign: 'center'}}>
          {it.img ? <Foto src={it.img} w={l.ancho ?? 400} rot={pos[i][2]} s={`${semilla}c${i}`} frame={frame} desde={enCuadros(it)} /> : null}
          {it.texto ? (
            <Texto frame={frame} desde={enCuadros(it) + 3} tamano={64} fuente={mano} color={ROJO} style={{marginTop: 18}}>
              {it.texto}
            </Texto>
          ) : null}
        </div>
      ));
    }
  }

  if (l.tipo === 'comparar') {
    const [mal, bien] = [l.items[0], l.items[1]];
    const [rMal, rBien] = l.rotulos ?? ['así no', 'así sí'];
    // `ancho` (opcional, 21-oct): capturas grandes que llenan su mitad, columnas desde arriba.
    // `tenue` (opcional): la columna se ve apagada desde que entra la lámina, en vez de vacía.
    const grande = !!l.ancho;
    const col = (it: ItemLamina | undefined, x: number, rotulo: string, malo: boolean, i: number) => {
      if (!it) return null;
      const llega = enCuadros(it);
      const apagada = l.tenue && frame < llega;
      const d = l.tenue ? 0 : llega;
      return (
        <div key={i} style={grande
          ? {position: 'absolute', left: x, top: 360, width: 500, height: 1250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 28, opacity: apagada ? 0.28 : 1, filter: apagada ? 'grayscale(1)' : 'none'}
          : {position: 'absolute', left: x, top: 560, width: 440, height: 760, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 60}}>
          <Texto frame={frame} desde={d} tamano={grande ? 110 : 130} fuente={serif} color={malo ? ROJO : VERDE}>
            {rotulo}
          </Texto>
          {it.img ? <Foto src={it.img} w={l.ancho ?? 380} rot={malo ? -3 : 2} s={`${semilla}k${i}`} frame={frame} desde={l.tenue ? 0 : llega + 2} /> : null}
          {it.texto ? (
            <Texto frame={frame} desde={l.tenue ? 0 : llega + 3} tamano={grande ? 84 : it.texto.length > 18 ? 88 : 104} fuente={mano} style={{textAlign: 'center'}}>
              {it.texto}
            </Texto>
          ) : null}
        </div>
      );
    };
    cuerpo = grande ? [col(mal, 25, rMal, true, 0), col(bien, 555, rBien, false, 1)] : [col(mal, 60, rMal, true, 0), col(bien, 580, rBien, false, 1)];
    trazos = (
      <>
        <Trazo d={linea(540, 500, 540, 1640, `${semilla}-div-${k % 3}`)} frame={frame} desde={2} dur={8} ancho={4} />
        {mal ? <Trazo d={cruz(grande ? 275 : 280, grande ? 1340 : 1460, 80, `${semilla}-x-${k % 3}`)} frame={frame} desde={enCuadros(mal) + 10} dur={6} color={ROJO} ancho={11} /> : null}
        {bien ? <Trazo d={check(grande ? 760 : 720, grande ? 1330 : 1450, `${semilla}-v-${k % 3}`, 2.2)} frame={frame} desde={enCuadros(bien) + 10} dur={6} color={VERDE} ancho={11} /> : null}
      </>
    );
  }

  return (
    <AbsoluteFill style={{transform: `translateY(${(1 - entra) * 110}%) rotate(${(1 - entra) * 4}deg)`}}>
      <AbsoluteFill style={{backgroundColor: PAPEL}}>
        <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
          <defs>
            <filter id="grano">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={3} />
              <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.15  0 0 0 0.3 0" />
            </filter>
            <filter id="manchas">
              <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={3} seed={7} />
              <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.42  0 0 0 0 0.25  0 0 0 0.16 0" />
            </filter>
            <radialGradient id="borde" cx="50%" cy="50%" r="75%">
              <stop offset="60%" stopColor="rgba(110,80,40,0)" />
              <stop offset="100%" stopColor="rgba(110,80,40,0.28)" />
            </radialGradient>
            <filter id={id}>
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={semilla * 10 + (k % 3)} />
              <feDisplacementMap in="SourceGraphic" scale={6} />
            </filter>
          </defs>
          <rect width="1080" height="1920" filter="url(#manchas)" />
          <rect width="1080" height="1920" filter="url(#grano)" />
          <rect width="1080" height="1920" fill="url(#borde)" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{filter: `url(#${id})`}}>
        <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
          {trazos}
        </svg>
        {titulo}
        {cuerpo}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
