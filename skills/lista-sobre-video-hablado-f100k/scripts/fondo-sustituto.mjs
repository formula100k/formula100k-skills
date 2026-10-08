#!/usr/bin/env node
// Fabrica una «toma» de mentira para probar la capa sin haber grabado: una pared en degradado y una
// silueta dibujada (sin cara) donde irías tú, con un micrófono en la mano y un vaivén leve.
//   node fondo-sustituto.mjs <salida.mp4> [--lado=izquierda|derecha] [--segundos=40] [--audio=voz.wav]
//   --lado      de qué lado va la LISTA (igual que en config.js). La silueta queda del lado contrario.
//   --audio     le pone ese audio (por ejemplo, tu guion leído) y la toma dura lo que dure el audio + 2 s
// Solo es para pruebas y para el ejemplo de la skill. Tu reel lleva tu toma.
import { createRequire } from 'node:module'; import { homedir, tmpdir } from 'node:os'; import { join, resolve } from 'node:path'; import { fileURLToPath } from 'node:url';
import { existsSync, mkdtempSync, rmSync } from 'node:fs'; import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const arg = n => { const a = process.argv.find(x => x === '--' + n || x.startsWith('--' + n + '=')); return a ? (a.includes('=') ? a.split('=').slice(1).join('=') : true) : null; };
const salida = process.argv.slice(2).find(a => !a.startsWith('--'));
if (!salida) { console.log('Uso: node fondo-sustituto.mjs <salida.mp4> [--lado=izquierda|derecha] [--segundos=40] [--audio=voz.wav]'); process.exit(1); }
let puppeteer; for (const s of ['puppeteer-core', join(process.cwd(), 'node_modules/puppeteer-core'), join(fileURLToPath(new URL('../..', import.meta.url)), 'carrusel-render-formula100k/node_modules/puppeteer-core'), join(homedir(), '.claude/skills/carrusel-render-formula100k/node_modules/puppeteer-core')]) { try { puppeteer = require(s); break; } catch {} }
if (!puppeteer) { console.error('Falta puppeteer-core. Arréglalo con: cd ~/.claude/skills/carrusel-render-formula100k && npm install   (o npm install puppeteer-core en tu carpeta de trabajo)'); process.exit(1); }
const chrome = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(existsSync);
if (!chrome) { console.error('No encontré Google Chrome. Indica dónde está: CHROME="/ruta/a/chrome" node fondo-sustituto.mjs …'); process.exit(1); }

const espejo = arg('lado') === 'derecha', audio = arg('audio') && arg('audio') !== true ? resolve(arg('audio')) : null;
const seg = audio ? parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audio]).toString()) + 2 : parseFloat(arg('segundos') || 40);
const tmp = mkdtempSync(join(tmpdir(), 'fondo-'));
const pared = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9CFC2"/><stop offset="1" stop-color="#A99B8C"/></linearGradient>
  <radialGradient id="l" cx=".3" cy=".25" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
  <rect width="1080" height="1920" fill="url(#g)"/><rect width="1080" height="1920" fill="url(#l)"/>
  <rect y="1560" width="1080" height="360" fill="#8C7B6B"/><rect y="1548" width="1080" height="16" fill="#75665A"/></svg>`;
// silueta con la cabeza centrada en x 540 de su propio lienzo; luego se coloca en su tercio
const silueta = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <path d="M160 1920 c0 -420 110 -560 290 -610 l180 0 c180 50 290 190 290 610z" fill="#6E7F8D"/>
  <path d="M410 770 c-40 300 -20 420 -70 560 l400 0 c-50 -140 -30 -260 -70 -560z" fill="#3B2A22"/>
  <rect x="484" y="1040" width="112" height="300" rx="50" fill="#D9A98B"/>
  <ellipse cx="540" cy="900" rx="128" ry="158" fill="#E8B99B"/>
  <path d="M404 900 c-20 -190 70 -250 136 -250 c66 0 156 60 136 250 c-30 -110 -90 -150 -136 -150 c-46 0 -106 40 -136 150z" fill="#3B2A22"/>
  <path d="M700 1920 c-10 -260 -60 -420 -150 -560 l70 -40 c120 150 200 330 220 600z" fill="#5F707E"/>
  <rect x="520" y="1250" width="84" height="130" rx="40" fill="#E8B99B"/>
  <rect x="544" y="1150" width="36" height="150" rx="16" fill="#2A2A30"/><circle cx="562" cy="1130" r="44" fill="#4A4A55"/></svg>`;
const b = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: [...(process.platform === 'linux' ? ['--no-sandbox', '--disable-dev-shm-usage'] : [])] }), p = await b.newPage(); await p.setViewport({ width: 1080, height: 1920 });
for (const [nombre, svg, transp] of [['pared.png', pared, false], ['silueta.png', silueta, true]]) { await p.setContent(`<body style="margin:0;background:transparent">${svg}</body>`); await p.screenshot({ path: join(tmp, nombre), omitBackground: transp }); }
await b.close();
const x = espejo ? 280 - 540 : 800 - 540;
const a = ['-v', 'error', '-y', '-loop', '1', '-framerate', '30', '-i', join(tmp, 'pared.png'), '-loop', '1', '-framerate', '30', '-i', join(tmp, 'silueta.png')];
if (audio) a.push('-i', audio);
a.push('-filter_complex', `[0:v][1:v]overlay=x='${x}+7*sin(2*PI*t/3.1)':y='-130+5*sin(2*PI*t/2.3)',format=yuv420p[v]`, '-map', '[v]');
if (audio) a.push('-map', '2:a', '-af', 'apad', '-c:a', 'aac', '-b:a', '160k');
a.push('-t', seg.toFixed(2), '-r', '30', '-c:v', 'libx264', '-crf', '20', '-movflags', '+faststart', resolve(salida));
execFileSync('ffmpeg', a, { stdio: 'inherit' }); rmSync(tmp, { recursive: true, force: true });
console.log(`Listo: ${resolve(salida)} · ${seg.toFixed(1)} s · silueta a la ${espejo ? 'izquierda' : 'derecha'} (la lista va a la ${espejo ? 'derecha' : 'izquierda'})`);
