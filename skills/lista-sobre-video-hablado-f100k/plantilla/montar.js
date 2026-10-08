// Monta la capa (capa.mov) sobre tu toma hablada y saca el MP4.
//   node montar.js <toma.mp4|.mov> [salida.mp4] [--c=config.js] [--capa=capa] [--agrandar=1.3] [--sin-acercar] [--sin-audio]
// El acercamiento del cierre se lee de config.js (campo `acercar`; si no está, arranca 0,2 s después de `sale`)
// y es un movimiento suave, no un salto.
//   --agrandar=F   agranda la toma F veces y la corre para que quedes del lado contrario a la lista
//                  (solo si la grabaste centrada; lo correcto es grabarla ya en su tercio)
//   --sin-acercar  monta sin acercamiento
//   --sin-audio    deja el MP4 mudo
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const arg = n => { const a = process.argv.find(x => x === '--' + n || x.startsWith('--' + n + '=')); return a ? (a.includes('=') ? a.split('=').slice(1).join('=') : true) : null; };
const libres = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!libres[0]) { console.log('Uso: node montar.js <toma> [salida.mp4] [--c=config.js] [--capa=capa] [--agrandar=1.3] [--sin-acercar] [--sin-audio]'); process.exit(1); }
const toma = path.resolve(libres[0]), salida = path.resolve(libres[1] || path.join(__dirname, 'final.mp4')), capa = path.join(__dirname, (arg('capa') || 'capa') + '.mov');
for (const [f, que] of [[toma, 'la toma'], [capa, 'la capa (corre antes: node render.js)']]) if (!fs.existsSync(f)) { console.error(`No encontré ${que}: ${f}`); process.exit(1); }

const w = {}; new Function('window', fs.readFileSync(path.join(__dirname, arg('c') || 'config.js'), 'utf8'))(w);
const C = w.CONFIG || {}, espejo = C.lado === 'derecha';
let Z = null;
if (!arg('sin-acercar') && C.acercar !== false && C.acercar !== null) {
  const a = typeof C.acercar === 'object' && C.acercar ? C.acercar : {}, t = a.t != null ? a.t : (C.sale != null ? C.sale + .2 : null);
  if (t != null) Z = { t, segundos: a.segundos || 1, escala: a.escala || 1.25, x: a.x != null ? a.x : (espejo ? .08 : .92), y: a.y != null ? a.y : .36 };
}
const sonda = (f, campo) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=' + campo, '-of', 'csv=p=0', f]).toString());
const dur = sonda(capa, 'duration'), durToma = sonda(toma, 'duration');
if (durToma < dur - .05) console.log(`⚠ La toma dura ${durToma.toFixed(1)} s y la capa ${dur.toFixed(1)} s: el último cuadro de la toma se queda congelado hasta el final.`);

const F = parseFloat(arg('agrandar') || 1), W = Math.round(1080 * F / 2) * 2, H = Math.round(1920 * F / 2) * 2;
let f = `[0:v]fps=${C.fps || 30},scale=${W}:${H}:force_original_aspect_ratio=increase,crop=1080:1920:${espejo ? W - 1080 : 0}:${Math.round((H - 1920) * .4)},setsar=1,tpad=stop_mode=clone:stop_duration=${Math.max(0, dur - durToma + .5).toFixed(2)}[b]`;
if (Z) {
  // Suave: la escala sigue una curva que arranca y frena despacio (zoompan, un cuadro de salida por cuadro de entrada).
  // Se trabaja al doble de tamaño para que el encuadre no tiemble al moverse de píxel en píxel.
  const z = `(st(0\\,clip((in_time-${Z.t})/${Z.segundos}\\,0\\,1))\\;1+${(Z.escala - 1).toFixed(4)}*ld(0)*ld(0)*(3-2*ld(0)))`;
  f += `;[b]scale=2160:3840:flags=bicubic,zoompan=z='${z}':x='(iw-iw/zoom)*${Z.x}':y='(ih-ih/zoom)*${Z.y}':d=1:s=1080x1920:fps=${C.fps || 30},setsar=1[b]`;
}
f += `;[b][1:v]overlay=shortest=0[v]`;
const a = ['-v', 'error', '-y', '-i', toma, '-i', capa, '-filter_complex', f, '-map', '[v]'];
if (!arg('sin-audio')) a.push('-map', '0:a?', '-c:a', 'aac', '-b:a', '160k');
a.push('-t', String(dur), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', salida);
execFileSync('ffmpeg', a, { stdio: 'inherit' });
console.log(`Listo: ${salida}` + (Z ? ` · la toma se acerca del segundo ${(+Z.t).toFixed(1)} al ${(Z.t + Z.segundos).toFixed(1)} (×${Z.escala})` : ' · sin acercamiento'));
