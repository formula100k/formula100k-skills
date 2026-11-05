// Dibuja las miniaturas del ejemplo (repostería) como SVG y las guarda en PNG. Son formas simples, sin personas.
// Solo sirve para rehacer el ejemplo: tus reels llevan TUS capturas y fotos.
//   node hacer-miniaturas.mjs [carpeta-de-salida]      (por defecto ../plantilla/img)
import { createRequire } from 'node:module'; import { homedir } from 'node:os'; import { join, dirname, resolve } from 'node:path'; import { fileURLToPath } from 'node:url'; import { mkdirSync } from 'node:fs';
import { chromeOSalir } from '../scripts/sistema.mjs';
const require = createRequire(import.meta.url), aqui = dirname(fileURLToPath(import.meta.url));
let puppeteer; for (const s of ['puppeteer-core', join(aqui, '../node_modules/puppeteer-core'), join(aqui, '../../carrusel-render-formula100k/node_modules/puppeteer-core'), join(homedir(), '.claude/skills/carrusel-render-formula100k/node_modules/puppeteer-core')]) { try { puppeteer = require(s); break; } catch {} }
if (!puppeteer) { console.error('Falta puppeteer-core: cd ~/.claude/skills/lista-sobre-video-hablado-f100k && npm install'); process.exit(1); }
const chrome = chromeOSalir();
const out = resolve(process.argv[2] || join(aqui, '../plantilla/img')); mkdirSync(out, { recursive: true });

const C = { crema: '#FFF3E2', rosa: '#FF6B9A', rosaClaro: '#FFC2D4', choco: '#5A3324', chocoOsc: '#2B1620', menta: '#8FD3B6', cielo: '#BFE3F5', sol: '#FFD25E', masa: '#F2C48D', blanco: '#FFFFFF' };
const svg = (w, h, fondo, dentro) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${fondo}"/>${dentro}</svg>`;
const M = {
  // 1 · especialidad
  '1a-pastel': [400, 500, C.rosaClaro, `
    <ellipse cx="200" cy="430" rx="170" ry="22" fill="${C.choco}" opacity=".25"/>
    <rect x="60" y="300" width="280" height="120" rx="16" fill="${C.masa}"/><path d="M60 322 q35 44 70 0 t70 0 t70 0 t70 0 v-14 a16 16 0 0 0 -16 -16 h-248 a16 16 0 0 0 -16 16z" fill="${C.blanco}"/>
    <rect x="105" y="200" width="190" height="104" rx="14" fill="${C.masa}"/><path d="M105 220 q24 36 48 0 t48 0 t47 0 t47 0 v-8 a14 14 0 0 0 -14 -14 h-162 a14 14 0 0 0 -14 14z" fill="${C.rosa}"/>
    <rect x="192" y="120" width="16" height="78" rx="6" fill="${C.blanco}"/><path d="M200 70 q26 30 0 52 q-26 -22 0 -52z" fill="${C.sol}"/>`],
  '1b-cupcake': [400, 500, C.menta, `
    <path d="M110 290 h180 l-26 150 a12 12 0 0 1 -12 10 h-104 a12 12 0 0 1 -12 -10z" fill="${C.rosa}"/>
    <path d="M150 292 l12 156 M200 292 v158 M250 292 l-12 156" stroke="${C.blanco}" stroke-width="8" opacity=".55"/>
    <path d="M92 292 c-24 -56 30 -76 50 -66 c-10 -50 50 -74 78 -44 c34 -30 92 6 70 50 c36 4 44 46 18 60z" fill="${C.crema}"/>
    <circle cx="210" cy="150" r="26" fill="#E5324F"/><path d="M212 126 q14 -30 36 -30" stroke="${C.choco}" stroke-width="7" fill="none" stroke-linecap="round"/>`],
  // 2 · clienta
  '2a-cumple': [400, 500, C.cielo, `
    <path d="M140 250 q-20 110 60 200 M270 240 q10 120 -70 210" stroke="${C.choco}" stroke-width="5" fill="none"/>
    <ellipse cx="140" cy="170" rx="74" ry="90" fill="${C.rosa}"/><path d="M128 258 h24 l-12 -16z" fill="${C.rosa}"/>
    <ellipse cx="272" cy="160" rx="70" ry="86" fill="${C.sol}"/><path d="M260 244 h24 l-12 -16z" fill="${C.sol}"/>
    <ellipse cx="112" cy="136" rx="16" ry="26" fill="${C.blanco}" opacity=".5"/><ellipse cx="248" cy="128" rx="15" ry="24" fill="${C.blanco}" opacity=".5"/>`],
  '2b-boda': [400, 500, C.crema, `
    <circle cx="160" cy="290" r="96" fill="none" stroke="${C.sol}" stroke-width="30"/><circle cx="252" cy="290" r="96" fill="none" stroke="#E8B23C" stroke-width="30"/>
    <path d="M160 194 a96 96 0 0 1 83 48" fill="none" stroke="${C.sol}" stroke-width="30"/>
    <path d="M160 150 l-34 -44 l22 -26 h24 l22 26z" fill="${C.cielo}" stroke="${C.blanco}" stroke-width="6" stroke-linejoin="round"/>`],
  // 3 · menú
  '3a-menu': [400, 500, C.chocoOsc, `
    <rect x="46" y="40" width="308" height="420" rx="20" fill="${C.crema}"/>
    <rect x="130" y="70" width="140" height="22" rx="11" fill="${C.rosa}"/>
    ${[0, 1, 2].map(i => `<circle cx="${110}" cy="${170 + i * 100}" r="${24 + i * 9}" fill="${C.masa}"/><circle cx="${110}" cy="${170 + i * 100}" r="${13 + i * 6}" fill="${C.rosaClaro}"/>
      <rect x="170" y="${154 + i * 100}" width="${96 + i * 20}" height="14" rx="7" fill="${C.choco}"/><rect x="170" y="${178 + i * 100}" width="70" height="12" rx="6" fill="${C.choco}" opacity=".35"/>
      <rect x="290" y="${160 + i * 100}" width="40" height="22" rx="11" fill="${C.menta}"/>`).join('')}`],
  '3b-precio': [500, 400, C.rosa, `
    <g transform="rotate(-12 250 200)"><path d="M120 120 h230 a20 20 0 0 1 20 20 v120 a20 20 0 0 1 -20 20 h-230 l-70 -80z" fill="${C.crema}"/>
    <circle cx="112" cy="200" r="16" fill="${C.rosa}"/><rect x="170" y="160" width="150" height="20" rx="10" fill="${C.choco}"/><rect x="170" y="204" width="96" height="20" rx="10" fill="${C.choco}" opacity=".4"/></g>
    <path d="M70 180 q-50 -70 10 -130" stroke="${C.crema}" stroke-width="8" fill="none" stroke-linecap="round"/>`],
  // 4 · fotos
  '4a-ventana': [400, 500, '#E9DCC9', `
    <rect x="70" y="50" width="260" height="290" rx="12" fill="${C.cielo}" stroke="${C.blanco}" stroke-width="18"/>
    <path d="M200 50 v290 M70 195 h260" stroke="${C.blanco}" stroke-width="14"/><circle cx="262" cy="118" r="34" fill="${C.sol}"/>
    <path d="M88 340 l-60 160 h300 l40 -160z" fill="${C.sol}" opacity=".35"/>
    <ellipse cx="200" cy="452" rx="92" ry="14" fill="${C.choco}" opacity=".25"/><rect x="130" y="380" width="140" height="66" rx="12" fill="${C.masa}"/><path d="M130 398 q23 30 46 0 t47 0 t47 0 v-6 a12 12 0 0 0 -12 -12 h-116 a12 12 0 0 0 -12 12z" fill="${C.rosa}"/>`],
  '4b-camara': [500, 400, C.menta, `
    <rect x="90" y="110" width="320" height="210" rx="28" fill="${C.chocoOsc}"/><rect x="170" y="78" width="110" height="46" rx="14" fill="${C.chocoOsc}"/>
    <circle cx="250" cy="216" r="78" fill="${C.crema}"/><circle cx="250" cy="216" r="56" fill="${C.choco}"/><circle cx="250" cy="216" r="30" fill="${C.cielo}"/><circle cx="234" cy="200" r="10" fill="${C.blanco}"/>
    <rect x="344" y="134" width="42" height="24" rx="8" fill="${C.sol}"/>`],
  // 5 · pedidos
  '5a-mensaje': [500, 400, C.sol, `
    <path d="M70 80 h360 a24 24 0 0 1 24 24 v170 a24 24 0 0 1 -24 24 h-190 l-70 60 v-60 h-100 a24 24 0 0 1 -24 -24 v-170 a24 24 0 0 1 24 -24z" fill="${C.blanco}"/>
    <rect x="100" y="126" width="230" height="20" rx="10" fill="${C.choco}"/><rect x="100" y="170" width="300" height="20" rx="10" fill="${C.choco}" opacity=".4"/><rect x="100" y="214" width="180" height="20" rx="10" fill="${C.choco}" opacity=".4"/>
    <g transform="rotate(30 400 80)"><circle cx="400" cy="62" r="26" fill="${C.rosa}"/><rect x="394" y="80" width="12" height="46" fill="${C.choco}"/></g>`],
  '5b-calendario': [400, 500, C.rosaClaro, `
    <rect x="50" y="90" width="300" height="340" rx="24" fill="${C.blanco}"/><path d="M50 114 a24 24 0 0 1 24 -24 h252 a24 24 0 0 1 24 24 v56 h-300z" fill="${C.rosa}"/>
    <rect x="110" y="62" width="18" height="60" rx="9" fill="${C.choco}"/><rect x="272" y="62" width="18" height="60" rx="9" fill="${C.choco}"/>
    ${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<rect x="${78 + c * 66}" y="${200 + r * 70}" width="46" height="46" rx="10" fill="${r === 1 && c === 2 ? C.rosa : '#F1E4D6'}"/>`).join('')).join('')}
    <path d="M222 292 l10 10 l18 -20" stroke="${C.blanco}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`],
};

const b = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: [...(process.platform === 'linux' ? ['--no-sandbox', '--disable-dev-shm-usage'] : [])] }), p = await b.newPage();
for (const [nombre, [w, h, fondo, dentro]] of Object.entries(M)) {
  await p.setViewport({ width: w, height: h });
  await p.setContent(`<body style="margin:0">${svg(w, h, fondo, dentro)}</body>`);
  await p.screenshot({ path: join(out, nombre + '.png') });
}
await b.close(); console.log(`${Object.keys(M).length} miniaturas en ${out}`);
