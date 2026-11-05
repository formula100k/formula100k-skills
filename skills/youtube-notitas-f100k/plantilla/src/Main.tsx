// Video de YouTube 16:9 estilo «YouTube notitas» (skill youtube-notitas-f100k).
// Reglas de la casa: fotos y capturas reales, nada rebota ni tiembla, texto con corte seco,
// una sola familia: Inter grotesca + manuscrita (Nothing You Could Do), sin brillos ni degradados.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import plan from '../public/plan.json';

const P: any = plan;
const FPS = 30;
const BOARD = '#fbfbf8';
const INK = '#1b1f22';
const COL: Record<string, string> = {ink: INK, red: '#d23a2f', blue: '#1f5fbf', green: '#1c8a4a'};
// Colores de la marca (plan.marca, de mi-marca.md): acento = cifras y claves sobre la toma; clave = palabras clave en el papel.
const YEL = P.marca?.acento || '#f3c623';
const GROT = 'Inter, system-ui, sans-serif';
const SCRIPT = 'Script, cursive';
const SHADOW = '0 8px 0 rgba(0,0,0,0.22)'; // sombra seca, solo para despegar del fondo

const fonts = [
	['Inter', 'fonts/Inter-var.ttf', {weight: '100 900'}],
	['Script', 'fonts/NothingYouCouldDo.ttf', {}],
] as const;
let loaded = false;
const loadFonts = async () => {
	if (loaded) return;
	for (const [name, src, desc] of fonts) {
		const f = new FontFace(name, `url(${staticFile(src)})`, desc as any);
		await f.load();
		(document.fonts as any).add(f);
	}
	loaded = true;
};

// ---------------------------------------------------------------- cámara (punch-in con corte seco)
// Dónde está la cara en el lienzo 1920×1280 (plan.cara = {x, y}): ahí apunta el punch-in. Mídela en un cuadro.
const FX = P.cara?.x ?? 960;
const FY = P.cara?.y ?? 545;
const zoomAt = (t: number) => {
	let z = 1;
	for (const c of P.cams) if (c.s <= t + 1e-3) z = c.z;
	return z;
};

const Cam: React.FC<{seg: any}> = ({seg}) => {
	const f = useCurrentFrame();
	const t = seg.s + f / FPS;
	const z = zoomAt(t);
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
			<OffthreadVideo
				src={staticFile('cut.mov')}
				startFrom={Math.round(seg.a * FPS)}
				style={{position: 'absolute', left: 0, top: -100, width: 1920, height: 1280, transformOrigin: `${FX}px ${FY}px`, transform: `scale(${z})`, filter: 'brightness(0.82) contrast(1.06) saturate(0.96)'}}
			/>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- clips de la entrevista
const Clip: React.FC<{seg: any}> = ({seg}) => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const subs: [number, string][] = (P.subs || {})[seg.src] || [];
	let cur = '';
	for (const [at, txt] of subs) if (t >= at) cur = txt;
	const who = P.who?.[seg.src] || P.fuente?.quien || '';
	return (
		<AbsoluteFill>
			<OffthreadVideo src={staticFile(`clips/${seg.src}.mp4`)} style={{width: 1920, height: 1080}} />
			<div style={{position: 'absolute', left: 80, top: 64, color: '#fff', textShadow: '0 3px 14px rgba(0,0,0,0.6)'}}>
				<div style={{fontFamily: GROT, fontWeight: 800, fontSize: 40, letterSpacing: '-0.01em', textTransform: 'uppercase'}}>{who}</div>
				{P.fuente?.donde ? <div style={{fontFamily: GROT, fontWeight: 500, fontSize: 28, opacity: 0.85}}>{P.fuente.donde}</div> : null}
			</div>
			{cur && (
				<div style={{position: 'absolute', left: 0, right: 0, bottom: 64, display: 'flex', justifyContent: 'center'}}>
					<div style={{maxWidth: 1500, background: 'rgba(0,0,0,0.78)', color: '#fff', fontFamily: GROT, fontWeight: 600, fontSize: 46, lineHeight: 1.25, padding: '14px 30px', borderRadius: 8, textAlign: 'center'}}>
						{cur}
					</div>
				</div>
			)}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- piezas
const at = (it: any, t: number, d = 0) => t >= it.s + d - 1e-3;
const sideStyle = (it: any, i: number): React.CSSProperties => {
	const top = [230, 380, 300][i % 3];
	return it.side === 'L' ? {position: 'absolute', left: 64, top} : {position: 'absolute', right: 64, top};
};
const Card: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => (
	<div style={{background: BOARD, borderRadius: 8, boxShadow: SHADOW, padding: '22px 30px 24px', ...style}}>{children}</div>
);

// Gancho editorial: palabras blancas que entran con la voz (Hormozi) + una manuscrita subrayada (Cristofari)
const Dim: React.FC<{o?: number}> = ({o = 0.32}) => <AbsoluteFill style={{background: `rgba(0,0,0,${o})`}} />;
const Script: React.FC<{txt: string; size: number; under?: boolean}> = ({txt, size, under}) => (
	<span style={{position: 'relative', display: 'inline-block', fontFamily: SCRIPT, fontSize: size, lineHeight: 1, color: 'inherit', padding: '0 6px'}}>
		{txt}
		{under && <span style={{position: 'absolute', left: 0, right: -10, bottom: -size * 0.08, height: Math.max(4, size * 0.045), background: 'currentColor', transform: 'rotate(-1.5deg)', borderRadius: 4}} />}
	</span>
);
const Grot: React.FC<{txt: string; size: number; color?: string; weight?: number}> = ({txt, size, color = '#fff', weight = 800}) => (
	<span style={{fontFamily: GROT, fontWeight: weight, fontSize: size, lineHeight: 1, letterSpacing: '-0.02em', color, textTransform: 'uppercase'}}>{txt}</span>
);
const Hook: React.FC<{it: any; t: number}> = ({it, t}) => {
	const second = t >= it.line2.at - 0.02;
	return (
		<AbsoluteFill>
			<Dim o={0.3} />
			<div style={{position: 'absolute', left: 110, bottom: 110, display: 'flex', flexDirection: 'column', gap: 18, color: '#fff'}}>
				{!second &&
					it.lines.map((ln: any, k: number) => (
						<div key={k} style={{display: 'flex', gap: 22, alignItems: 'baseline'}}>
							{ln.w.map(([w, at0]: [string, number], j: number) =>
								t >= at0 - 0.02 ? (
									ln.t === 'script' ? <Script key={j} txt={w} size={150} under={ln.under} /> : <Grot key={j} txt={w} size={ln.accent && /\d/.test(w) ? 132 : 104} color={ln.accent && /\d/.test(w) ? YEL : '#fff'} />
								) : null,
							)}
						</div>
					))}
				{second && (
					<>
						<Grot txt={it.line2.small} size={72} weight={700} />
						{t >= it.line2.at + 0.25 && <Script txt={it.line2.script} size={150} under />}
					</>
				)}
			</div>
		</AbsoluteFill>
	);
};

// Título grande al empezar cada noticia
const Title: React.FC<{it: any; t: number}> = ({it, t}) => (
	<AbsoluteFill style={{background: it.solid ? '#121413' : undefined}}>
		{!it.solid && <Dim o={0.42} />}
		<div style={{position: 'absolute', left: 110, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22, maxWidth: 1300, color: '#fff'}}>
			<div style={{fontFamily: GROT, fontWeight: 500, fontSize: 40, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.02em'}}>{it.kick}</div>
			{t >= it.s + 0.15 && <Grot txt={it.main} size={it.main.length > 18 ? 92 : 112} />}
			{t >= it.s + 0.4 && (
				<div>
					<Script txt={it.script} size={it.script.length > 16 ? 120 : 150} under />
				</div>
			)}
		</div>
	</AbsoluteFill>
);

// ---- Tipografía única: la del gancho (Inter grotesca + manuscrita). Fuera la letra de pizarra.
const TXT_SHADOW = '0 3px 14px rgba(0,0,0,0.55)'; // solo para leer sobre la toma
const TCOL: Record<string, string> = {white: '#fff', yellow: YEL, red: '#FF5A4F', ink: '#fff', green: YEL, blue: '#fff'};
const BLUE = P.marca?.clave || '#0192FB'; // azul de las notitas (o el color de su marca)
const PAPER = '#f4f1e8';
const GRID = 'linear-gradient(#e4dfd2 1px, transparent 1px), linear-gradient(90deg, #e4dfd2 1px, transparent 1px)';
const RED = '#E5352B';

const sideBox = (it: any, i: number, top?: number): React.CSSProperties => {
	const y = top ?? [250, 330, 290][i % 3];
	return it.side === 'L' ? {position: 'absolute', left: 110, top: y} : {position: 'absolute', right: 110, top: y, textAlign: 'right'};
};

const Word: React.FC<{it: any; t: number; i: number}> = ({it, t, i}) => {
	const longest = Math.max(...it.big.split(' ').map((w: string) => w.length));
	const big = longest <= 7 ? 116 : longest <= 10 ? 96 : 80;
	return (
		<div style={{...sideBox(it, i), maxWidth: 660, textShadow: TXT_SHADOW}}>
			<div style={{fontFamily: GROT, fontWeight: 600, fontSize: 46, color: '#fff', lineHeight: 1.1}}>{it.small}</div>
			{at(it, t, 0.15) && <div style={{fontFamily: GROT, fontWeight: 900, fontSize: big, lineHeight: 0.98, letterSpacing: '-0.03em', color: TCOL[it.color] || '#fff', textTransform: 'uppercase'}}>{it.big}</div>}
		</div>
	);
};

const Photo: React.FC<{it: any; t: number; i: number}> = ({it, i}) => (
	<div style={{...sideBox(it, i, it.phone ? 140 : 210), width: it.phone ? 380 : 620, textAlign: 'left'}}>
		<div style={{background: '#fff', borderRadius: 22, padding: 12, boxShadow: '0 18px 40px rgba(0,0,0,0.35)'}}>
			<Img src={staticFile(it.src)} style={{display: 'block', width: '100%', height: it.phone ? 620 : 'auto', objectFit: 'cover', borderRadius: 14}} />
		</div>
		<div style={{fontFamily: GROT, fontWeight: 600, fontSize: 30, color: '#fff', marginTop: 12, textShadow: TXT_SHADOW}}>{it.cap}</div>
	</div>
);

const Row: React.FC<{txt: string}> = ({txt}) => {
	const strike = txt.startsWith('~~');
	const clean = txt.replace(/~~/g, '');
	const key = !strike && clean === clean.toUpperCase() && /[A-Z]/.test(clean);
	return (
		<div style={{fontFamily: GROT, fontWeight: 800, fontSize: key ? 84 : 56, lineHeight: 1.12, letterSpacing: '-0.02em', color: strike ? 'rgba(255,255,255,0.6)' : key ? YEL : '#fff', position: 'relative', display: 'inline-block'}}>
			{clean}
			{strike && <div style={{position: 'absolute', left: -6, right: -6, top: '52%', height: 6, background: '#FF5A4F', transform: 'rotate(-2deg)'}} />}
		</div>
	);
};
const List: React.FC<{it: any; t: number; i: number}> = ({it, t, i}) =>
	t < it.ts[0] - 0.05 ? null : (
		<div style={{...sideBox(it, i, 200), maxWidth: 700, textShadow: TXT_SHADOW, textAlign: 'left', color: '#fff'}}>
			<div style={{marginBottom: 10}}><Script txt={it.title} size={62} /></div>
			{it.rows.map((r: string, k: number) => (
				<div key={k} style={{display: t >= it.ts[k] - 0.05 ? 'block' : 'none'}}>
					<Row txt={r} />
				</div>
			))}
		</div>
	);

const THREE = [
	['1', 'contenido que la gente', 'MANDE'],
	['2', 'carruseles con', '2º GANCHO'],
	['3', 'video largo:', 'PRUÉBALO PRIMERO'],
];
const Three: React.FC<{it: any; t: number}> = ({it, t}) => (
	<div style={{position: 'absolute', left: 110, top: 200, width: 720, textShadow: TXT_SHADOW, color: '#fff'}}>
		<Script txt="haz esto hoy" size={70} under />
		{THREE.map(([n, a, b], k) => (
			<div key={k} style={{display: t >= [it.t1, it.t2, it.t3][k] - 0.05 ? 'flex' : 'none', gap: 22, alignItems: 'center', marginTop: 26}}>
				<div style={{width: 76, height: 76, borderRadius: 38, border: '4px solid #fff', fontFamily: GROT, fontWeight: 800, fontSize: 40, color: '#fff', display: 'grid', placeItems: 'center', flex: 'none'}}>{n}</div>
				<div>
					<div style={{fontFamily: GROT, fontWeight: 600, fontSize: 38, color: '#fff', lineHeight: 1}}>{a}</div>
					<div style={{fontFamily: GROT, fontWeight: 900, fontSize: 64, lineHeight: 1, letterSpacing: '-0.03em', color: k === 0 ? YEL : '#fff'}}>{b}</div>
				</div>
			</div>
		))}
	</div>
);

const Chain: React.FC<{it: any; t: number}> = ({it, t}) => {
	const nodes = ['TÚ', 'amiga', 'amigo', 'amiga', 'amigo', '…'];
	return (
		<div style={{position: 'absolute', right: 110, top: 250, width: 680, textShadow: TXT_SHADOW, color: '#fff'}}>
			<Script txt="cada envío llega a alguien más" size={56} />
			<div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 18}}>
				{nodes.map((n, k) =>
					at(it, t, k * 0.9) ? (
						<React.Fragment key={k}>
							{k > 0 && <span style={{fontFamily: GROT, fontWeight: 800, fontSize: 44, color: YEL}}>→</span>}
							<span style={{fontFamily: GROT, fontWeight: 800, fontSize: k === 0 ? 52 : 42, color: k === 0 ? '#111' : '#fff', background: k === 0 ? YEL : 'transparent', border: '4px solid ' + (k === 0 ? YEL : '#fff'), borderRadius: 40, padding: '2px 20px', textShadow: 'none'}}>{n}</span>
						</React.Fragment>
					) : null,
				)}
			</div>
		</div>
	);
};

// ---- Papel cuadriculado a pantalla completa (estilo notitas)
const Paper: React.FC<{children: React.ReactNode}> = ({children}) => (
	<AbsoluteFill style={{background: PAPER, backgroundImage: GRID, backgroundSize: '48px 48px'}}>{children}</AbsoluteFill>
);
const PLine: React.FC<{txt: string; size: number; show: boolean; align: string; maxW?: number}> = ({txt, size: size0, show, align, maxW = 760}) => {
	const longest = Math.max(...txt.replace(/~/g, '').split(' ').map((w) => w.length));
	const size = Math.min(size0, Math.floor(maxW / (0.6 * longest)));
	return (
	<div style={{fontFamily: GROT, fontWeight: size >= 100 ? 900 : 700, fontSize: size, lineHeight: size >= 150 ? 1.12 : 1.04, letterSpacing: size >= 100 ? '-0.035em' : '-0.015em', color: '#111', visibility: show ? 'visible' : 'hidden', textAlign: align as any}}>
		{txt.split(' ').map((w, k) => (
			<span key={k} style={{color: w.startsWith('~') ? BLUE : '#111'}}>
				{w.replace(/^~/, '')}
				{' '}
			</span>
		))}
	</div>
	);
};
const PCard: React.FC<{c: any; t: number; n: number}> = ({c: c0, t, n}) => {
	const c = {...c0, w: c0.phone || c0.plain ? c0.w * 1.1 : n === 1 ? Math.min(1020, c0.w * 1.3) : c0.w};
	if (t < c.t - 0.03) return <div style={{width: c.w, visibility: 'hidden'}} />;
	const img = <Img src={staticFile(c.src)} style={{display: 'block', width: '100%', height: c.phone ? c.w * 1.6 : 'auto', objectFit: 'cover', borderRadius: c.phone ? 28 : 14}} />;
	return (
		<div style={{position: 'relative', width: c.w, flex: 'none'}}>
			{c.plain ? img : <div style={{background: '#fff', borderRadius: c.phone ? 40 : 22, padding: c.phone ? 10 : 12, boxShadow: '0 22px 50px rgba(0,0,0,0.14)', border: c.phone ? '6px solid #111' : 'none'}}>{img}</div>}
			{c.circle && t >= (c.circleT ?? c.t) - 0.03 && (
				<svg style={{position: 'absolute', inset: 0, overflow: 'visible'}} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
					<ellipse cx={c.circle[0] * 100} cy={c.circle[1] * 100} rx={c.circle[2] * 100} ry={c.circle[3] * 100} fill="none" stroke={RED} strokeWidth={0.8} vectorEffect="non-scaling-stroke" style={{strokeWidth: 6} as any} transform={`rotate(-2 ${c.circle[0] * 100} ${c.circle[1] * 100})`} />
				</svg>
			)}
		</div>
	);
};
const Papel: React.FC<{it: any; t: number}> = ({it, t}) => {
	const lay = it.layout;
	const text = (
		<div style={{display: 'flex', flexDirection: 'column', gap: 6, maxWidth: lay === 'C' ? 1600 : 760, alignItems: lay === 'C' ? 'center' : 'flex-start'}}>
			{it.lines.map((l: any, k: number) => (
				<PLine key={k} txt={l.txt} size={Math.round(l.size * (lay === 'C' ? 1.0 : 1.15))} show={t >= l.t - 0.03} align={lay === 'C' ? 'center' : 'left'} maxW={lay === 'C' ? 1600 : 760} />
			))}
		</div>
	);
	const cards = it.cards.length ? (
		<div style={{display: 'flex', gap: 36, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', maxWidth: lay === 'C' ? 1700 : 1040}}>
			{it.cards.map((c: any, k: number) => (
				<PCard key={k} c={c} t={t} n={it.cards.length} />
			))}
		</div>
	) : null;
	return (
		<Paper>
			{lay === 'C' ? (
				<AbsoluteFill style={{alignItems: 'center', justifyContent: cards ? 'flex-start' : 'center', paddingTop: cards ? 90 : 0, gap: 50}}>
					{text}
					{cards}
				</AbsoluteFill>
			) : (
				<AbsoluteFill style={{flexDirection: lay === 'L' ? 'row' : 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: '0 110px', gap: 60}}>
					{text}
					{cards}
				</AbsoluteFill>
			)}
		</Paper>
	);
};

const Phone: React.FC<{label: string; sub: string; color: string; show: boolean; n: string}> = ({label, sub, color, show, n}) => (
	<div style={{visibility: show ? 'visible' : 'hidden', textAlign: 'center'}}>
		<div style={{width: 380, height: 640, borderRadius: 44, border: '10px solid #111', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, boxShadow: '0 22px 50px rgba(0,0,0,0.14)'}}>
			<div style={{fontFamily: GROT, fontWeight: 600, fontSize: 34, color: '#8a8f8c'}}>lámina {n}</div>
			<div style={{fontFamily: GROT, fontWeight: 900, fontSize: 62, lineHeight: 1, letterSpacing: '-0.03em', color}}>{label}</div>
		</div>
		<div style={{fontFamily: GROT, fontWeight: 600, fontSize: 40, marginTop: 18, color: '#111', width: 460}}>{sub}</div>
	</div>
);
const Slides: React.FC<{it: any; t: number}> = ({it, t}) => {
	const two = t >= it.tSecond - 0.05;
	const a = it.kind === 'slides' ? ['LA PASAN', '1ª vez en el feed'] : ['GANCHO', 'primera lámina'];
	const b = it.kind === 'slides' ? ['VUELVE A SALIR', '2ª vez, desde la lámina 2'] : ['PICO DE INTERÉS', 'segunda lámina'];
	return (
		<Paper>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{position: 'absolute', top: 60}}>
					<PLine txt={it.kind === 'slides' ? 'el carrusel tiene ~2ª oportunidad' : 'cómo ~aprovecharlo'} size={84} show align="center" maxW={1600} />
				</div>
				<div style={{display: 'flex', gap: 120, alignItems: 'center', marginTop: 90}}>
					<Phone n="1" label={a[0]} sub={a[1]} color={RED} show />
					<div style={{fontFamily: GROT, fontWeight: 900, fontSize: 90, color: BLUE, visibility: two ? 'visible' : 'hidden'}}>→</div>
					<Phone n="2" label={b[0]} sub={b[1]} color={BLUE} show={two} />
				</div>
			</AbsoluteFill>
		</Paper>
	);
};

const PASOS = [
	['GANCHO', RED],
	['INICIO', '#111'],
	['PROBLEMA', '#111'],
	['PAYOFF', BLUE],
];
const Estructura: React.FC = () => (
	<Paper>
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{position: 'absolute', top: 80, textAlign: 'center', color: BLUE}}>
				<Script txt="tómale captura" size={64} />
				<div style={{color: '#111'}}>
					<PLine txt="la estructura de un ~video ~largo" size={96} show align="center" maxW={1600} />
				</div>
			</div>
			<div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 140}}>
				{PASOS.map(([p, c], k) => (
					<React.Fragment key={k}>
						{k > 0 && (
							<div style={{textAlign: 'center'}}>
								<div style={{fontFamily: GROT, fontWeight: 900, fontSize: 60, color: BLUE}}>→</div>
								{k > 1 && <div style={{fontFamily: GROT, fontWeight: 700, fontSize: 30, color: RED}}>+ gancho</div>}
							</div>
						)}
						<div style={{border: `5px solid ${c}`, borderRadius: 22, padding: '28px 34px', fontFamily: GROT, fontWeight: 900, fontSize: 58, letterSpacing: '-0.02em', color: c, background: '#fff', boxShadow: '0 22px 50px rgba(0,0,0,0.10)'}}>{p}</div>
					</React.Fragment>
				))}
			</div>
			<div style={{position: 'absolute', bottom: 100, fontFamily: GROT, fontWeight: 600, fontSize: 44, color: '#111'}}>payoff = el valor que entregas</div>
		</AbsoluteFill>
	</Paper>
);

const FULLK = new Set(['full', 'hook', 'slides', 'slides2', 'estructura', 'title', 'papel']);
const Item: React.FC<{it: any; i: number}> = ({it, i}) => {
	const f = useCurrentFrame();
	const t = it.s + f / FPS;
	switch (it.kind) {
		case 'hook':
			return <Hook it={it} t={t} />;
		case 'title':
			return <Title it={it} t={t} />;
		case 'word':
			return <Word it={it} t={t} i={i} />;
		case 'photo':
			return <Photo it={it} t={t} i={i} />;
		case 'papel':
			return <Papel it={it} t={t} />;
		case 'list':
			return <List it={it} t={t} i={i} />;
		case 'three':
			return <Three it={it} t={t} />;
		case 'chain':
			return <Chain it={it} t={t} />;
		case 'slides':
		case 'slides2':
			return <Slides it={it} t={t} />;
		case 'estructura':
			return <Estructura />;
	}
	return null;
};

// ---------------------------------------------------------------- efectos de sonido (debajo de la voz)
type Sfx = {src: string; at: number; vol: number};
const sfx: Sfx[] = [];
const fx = (n: string, at: number, vol: number) => sfx.push({src: `sfx/${n}.wav`, at: Math.max(0, at), vol});
for (const it of P.items) {
	const k = it.kind;
	if (k === 'hook') (fx('impact', 0, 0.45), it.lines.forEach((ln: any) => ln.w.forEach(([, a]: any) => a > 0 && fx('click1', a, 0.35))), fx('swipe', it.line2.at, 0.35));
	else if (k === 'title') (fx('whoosh_big', it.s - 0.1, 0.3), fx('click1', it.s + 0.15, 0.4), fx('pop_soft', it.s + 0.4, 0.4));
	else if (k === 'lamina' || k === 'full' || k === 'estructura' || k === 'slides' || k === 'slides2') fx('whoosh_big', it.s - 0.15, 0.32);
	else if (k === 'papel') (fx('whoosh_big', it.s - 0.12, 0.3), it.lines.forEach((l: any) => l.t > it.s + 0.05 && fx('click1', l.t, 0.35)), it.cards.forEach((c: any) => (fx('pop_soft', c.t, 0.4), c.circleT && fx('scratch', c.circleT, 0.25))));
	else if (k === 'photo') fx('pop_soft', it.s, 0.4);
	else if (k === 'word') (fx('pop1', it.s, 0.3), fx('click1', it.s + 0.15, 0.45));
	else if (k === 'list') it.ts.forEach((x: number) => fx('tick', x, 0.4));
	else if (k === 'three') [it.t1, it.t2, it.t3].forEach((x: number) => fx('pop2', x, 0.4));
	else if (k === 'chain') [0, 1, 2, 3, 4, 5].forEach((j) => fx('pop2', it.s + j * 0.9, 0.3));
	if (k === 'slides' || k === 'slides2') fx('swipe', it.tSecond, 0.4);
}
for (const s of P.segs) if (s.kind === 'clip') fx('swipe', s.s - 0.1, 0.35);

// ---------------------------------------------------------------- composición
export const Main: React.FC = () => {
	const [h] = useState(() => delayRender('fuentes'));
	useEffect(() => {
		loadFonts().then(() => continueRender(h)).catch((e) => cancelRender(e));
	}, [h]);
	const f = useCurrentFrame();
	const t = f / FPS;
	const seg = P.segs.find((s: any) => t >= s.s && t < s.e);
	const fullOn = seg?.kind !== 'a' || P.items.some((it: any) => FULLK.has(it.kind) && it.kind !== 'hook' && t >= it.s && t < it.e);
	return (
		<AbsoluteFill style={{background: BOARD}}>
			{P.segs.map((s: any, i: number) => {
				const from = Math.round(s.s * FPS);
				const dur = Math.max(1, Math.round(s.e * FPS) - from);
				return (
					<Sequence key={'g' + i} from={from} durationInFrames={dur} layout="none">
						{s.kind === 'a' && <Cam seg={s} />}
						{s.kind === 'clip' && <Clip seg={s} />}
						{s.kind === 'hold' && s.src.startsWith('lamina') && <Img src={staticFile(`img/${s.src}.png`)} style={{width: 1920, height: 1080}} />}
					</Sequence>
				);
			})}
			{P.items.map((it: any, i: number) => {
				const from = Math.round(it.s * FPS);
				const dur = Math.max(1, Math.round(it.e * FPS) - from);
				return (
					<Sequence key={'i' + i} from={from} durationInFrames={dur} layout="none">
						<Item it={it} i={i} />
					</Sequence>
				);
			})}
			{sfx.map((s, i) => (
				<Sequence key={'s' + i} from={Math.round(s.at * FPS)} durationInFrames={Math.round(4 * FPS)} layout="none">
					<Audio src={staticFile(s.src)} volume={s.vol} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
