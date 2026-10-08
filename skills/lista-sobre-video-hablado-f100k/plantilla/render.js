// Exporta la capa con TRANSPARENCIA para montarla sobre cualquier toma, o saca cuadros sueltos para revisar.
//   node render.js                               → capa.mov (ProRes 4444 con alfa)
//   node render.js --segundos=0,12.5,40 --toma=toma.mp4 [--guias]
//                                                → solo esos segundos, sobre el cuadro de tu toma, en revision/ + revision/hoja.jpg
//   node render.js --webm                        → además capa.webm (VP9 con alfa, liviano)
//   node render.js --png                         → conserva la secuencia PNG en f/
//   node render.js --c=otro-config.js --salida=capa-espejo
// Necesita Node, ffmpeg, Google Chrome y puppeteer-core.
const path = require('path'), fs = require('fs'), os = require('os'), { execFileSync } = require('child_process');
const arg = n => { const a = process.argv.find(x => x === '--' + n || x.startsWith('--' + n + '=')); return a ? (a.includes('=') ? a.split('=').slice(1).join('=') : true) : null; };

function buscarPuppeteer() {
  const sitios = ['puppeteer-core', path.join(__dirname, 'node_modules/puppeteer-core'), path.join(os.homedir(), '.claude/skills/carrusel-render-formula100k/node_modules/puppeteer-core')];
  for (const s of sitios) { try { return require(s); } catch {} }
  console.error([
    'Falta puppeteer-core (es lo que maneja Chrome para fotografiar cada cuadro).',
    'Lo busqué en esta carpeta y en ~/.claude/skills/carrusel-render-formula100k/node_modules.',
    'Arréglalo con UNA de estas dos:',
    '  cd ~/.claude/skills/carrusel-render-formula100k && npm install',
    '  npm install puppeteer-core        (dentro de esta carpeta de trabajo)',
  ].join('\n')); process.exit(1);
}
function buscarChrome() {
  const sitios = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
  const c = sitios.find(s => fs.existsSync(s));
  if (!c) { console.error('No encontré Google Chrome. Instálalo o indica dónde está: CHROME="/ruta/a/chrome" node render.js'); process.exit(1); }
  return c;
}

(async () => {
  const puppeteer = buscarPuppeteer(), dir = __dirname, cfg = arg('c') || 'config.js', nombre = arg('salida') || 'capa';
  if (!fs.existsSync(path.join(dir, cfg))) { console.error('No encontré ' + cfg + ' en ' + dir); process.exit(1); }
  const revision = arg('segundos') != null || arg('cuadros') != null, toma = arg('toma') && arg('toma') !== true ? path.resolve(arg('toma')) : null;
  const out = path.join(dir, revision ? 'revision' : 'f'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const b = await puppeteer.launch({ executablePath: buscarChrome(), headless: 'new', args: ['--allow-file-access-from-files', ...(process.platform === 'linux' ? ['--no-sandbox', '--disable-dev-shm-usage'] : [])] });   // en un servidor Linux (root) Chrome necesita --no-sandbox
  const p = await b.newPage(); await p.setViewport({ width: 1080, height: 1920 });
  await p.goto('file://' + path.join(dir, 'overlay.html') + '?' + (revision ? 'revision' + (arg('guias') ? '&guias' : '') : 'render') + '&c=' + encodeURIComponent(cfg));
  await p.evaluate(() => window.LISTO);
  await p.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
  const { n, fps, avisos } = await p.evaluate(() => ({ n: FRAMES, fps: FPS, avisos: window.AVISOS || [] }));
  avisos.forEach(a => console.log('⚠ ' + a));

  if (revision) {
    const cuadros = arg('segundos') != null ? String(arg('segundos')).split(',').map(s => Math.round(parseFloat(s) * fps)) : String(arg('cuadros')).split(',').map(Number);
    const fotos = [];
    for (const f of cuadros) {
      const s = (f / fps).toFixed(2), archivo = path.join(out, 's' + s.padStart(6, '0') + '.jpg');
      if (toma) {
        const cuadro = path.join(out, '_toma.jpg');
        execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', s, '-i', toma, '-frames:v', '1', '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920', '-update', '1', cuadro]);
        await p.evaluate(src => new Promise(ok => { const i = document.getElementById('fondoImg'); i.onload = ok; i.onerror = ok; i.src = src; }), 'file://' + cuadro + '?' + f);
      }
      await p.evaluate(f => draw(f), f);
      await p.screenshot({ path: archivo, type: 'jpeg', quality: 88 }); fotos.push(archivo);
    }
    await b.close(); fs.rmSync(path.join(out, '_toma.jpg'), { force: true });
    const col = Math.min(6, fotos.length), lista = path.join(out, '_lista.txt');
    fs.writeFileSync(lista, fotos.map(f => `file '${f}'\nduration 1`).join('\n'));
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-vf', `scale=360:-2,tile=${col}x${Math.ceil(fotos.length / col)}:padding=6:color=white`, '-frames:v', '1', '-update', '1', path.join(out, 'hoja.jpg')]);
    fs.rmSync(lista, { force: true });
    return console.log(`${fotos.length} cuadros en revision/ (segundos ${cuadros.map(f => (f / fps).toFixed(1)).join(', ')}). Mira revision/hoja.jpg`);
  }

  let antes = null, archivoAntes = null, fotos = 0;
  for (let f = 0; f < n; f++) {
    const firma = await p.evaluate(f => draw(f), f), archivo = path.join(out, String(f).padStart(5, '0') + '.png');
    if (firma === antes) fs.copyFileSync(archivoAntes, archivo);          // cuadro idéntico: no se vuelve a fotografiar
    else { await p.screenshot({ path: archivo, type: 'png', omitBackground: true }); fotos++; }
    antes = firma; archivoAntes = archivo;
    if (f % 150 === 0) process.stdout.write(`\r${f}/${n}`);
  }
  await b.close(); console.log(`\r${n} cuadros (${fotos} fotografiados)`);
  const ff = (...a) => execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps), '-i', path.join(out, '%05d.png'), ...a], { stdio: 'inherit' });
  ff('-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-qscale:v', '11', '-vendor', 'apl0', path.join(dir, nombre + '.mov'));
  console.log(nombre + '.mov listo (ProRes 4444 con alfa). Pesa mucho: bórralo cuando ya tengas el MP4.');
  if (arg('webm')) { ff('-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '28', '-auto-alt-ref', '0', path.join(dir, nombre + '.webm')); console.log(nombre + '.webm listo'); }
  if (!arg('png')) fs.rmSync(out, { recursive: true, force: true });
})();
