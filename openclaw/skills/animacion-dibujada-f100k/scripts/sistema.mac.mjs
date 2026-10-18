// sistema.mac.mjs — la parte de Mac de sistema.mjs: voz con `say`, fotos con `sips`, recorte y cara con Vision
// (los .swift) y transcripción con mlx-whisper en chip Apple. Lo que una Mac no pueda hacer así (procesador Intel,
// macOS anterior al 14, sin `swift`) cae en las piezas comunes: faster-whisper, ffmpeg, rembg y OpenCV.
// Para probar esas piezas comunes en una Mac: F100K_SIN_APPLE=1 node …   (o F100K_TRANSCRIPCION=faster solo para la voz).
export default function mac(c) {
  const { correr, cola, sinExt, pieza, join, existsSync } = c;
  const sinApple = () => !!process.env.F100K_SIN_APPLE || process.platform !== 'darwin';
  const INSTALAR = { uv: 'brew install uv', ffmpeg: 'brew install ffmpeg', chrome: 'brew install --cask google-chrome', 'yt-dlp': 'brew install yt-dlp' };

  function transcribir(audio, opciones = {}) {
    const { dir, idioma = 'es', txt = false, extra = [], sinInternetPrimero = false } = opciones;
    const forzado = (process.env.F100K_TRANSCRIPCION || '').toLowerCase();
    const mlx = forzado ? forzado === 'mlx' : (!sinApple() && process.arch === 'arm64');
    if (mlx) {
      const destino = dir, archivo = join(destino, sinExt(audio) + (txt ? '.txt' : '.json'));
      const base = ['--from', 'mlx-whisper', 'mlx_whisper', audio, '--model', 'mlx-community/whisper-large-v3-turbo', '--language', idioma,
        ...(txt ? [] : ['--word-timestamps', 'True']), '--output-format', txt ? 'txt' : 'json', '--output-dir', destino, ...extra];
      let r;
      for (const antes of sinInternetPrimero ? [['--offline'], []] : [[]]) {
        r = correr('uvx', [...antes, ...base], { timeout: 900000 });
        if (r.error) return { ok: false, error: 'Falta uv (trae uvx, que corre la transcripción). Instálalo con: ' + INSTALAR.uv };
        if (r.status === 0 && existsSync(archivo)) return { ok: true, archivo, motor: 'mlx-whisper' };
      }
      if (forzado) return { ok: false, error: cola(r.stderr) };
    }
    return c.transcribirFaster(audio, opciones);
  }

  // `say` a veces se queda colgado sin escribir nada: se le da un plazo y se reintenta.
  function vozDePrueba(texto, base, { voz = 'Paulina', ritmo } = {}) {
    const aiff = base + '.aiff';
    let r;
    for (let n = 1; n <= 3; n++) {
      r = correr('say', ['-v', voz, ...(ritmo ? ['-r', String(ritmo)] : []), '-o', aiff, texto || ' '], { timeout: 25000, killSignal: 'SIGKILL' });
      if (r.error && r.error.code === 'ENOENT') throw new Error(c.SIN_VOZ);
      if (r.status === 0 && existsSync(aiff)) return aiff;
      if (/not found|no such voice/i.test(r.stderr || '')) throw new Error(`La voz «${voz}» no está instalada. Voces en español de esta Mac: ${vocesDePrueba().join(', ') || 'ninguna'}.\n` + (vocesDePrueba().length ? 'Elige una de esas.' : c.SIN_VOZ));
      console.warn(`⚠ la voz de la computadora no respondió (intento ${n} de 3): «${String(texto).slice(0, 40)}…»`);
    }
    throw new Error('`say` no respondió tres veces seguidas. Cierra y vuelve a abrir la terminal, o prueba otra voz.');
  }
  function vocesDePrueba() {
    const r = correr('say', ['-v', '?']);
    return (r.stdout || '').split('\n').filter(l => /\bes_[A-Z0-9]+/.test(l)).map(l => l.split(/\s{2,}/)[0].trim()).filter(Boolean);
  }

  const haySips = () => !sinApple() && !correr('sips', ['--version']).error;
  function medirImagen(foto) {
    if (!haySips()) return c.medirImagenFf(foto);
    const m = (correr('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', foto]).stdout || '').match(/pixelWidth: (\d+)[\s\S]*pixelHeight: (\d+)/);
    if (!m) throw new Error('No pude leer la foto: ' + foto);
    return [+m[1], +m[2]];
  }
  function achicarImagen(foto, salida, lado, { calidad } = {}) {
    if (!haySips()) return c.achicarImagenFf(foto, salida, lado, { calidad });
    const jpg = /\.jpe?g$/i.test(salida), sobra = Math.max(...medirImagen(foto)) > lado;   // sips -Z también agranda: solo si sobra
    const r = correr('sips', [...(sobra ? ['-Z', String(lado)] : []), '-s', 'format', jpg ? 'jpeg' : 'png', ...(jpg && calidad ? ['-s', 'formatOptions', String(calidad)] : []), foto, '--out', salida]);
    if (r.status !== 0 || !existsSync(salida)) throw new Error('No pude convertir la foto ' + foto + ':\n' + cola(r.stderr || r.stdout, 4));
  }

  const swift = (script, ...a) => { const ruta = pieza(script); return ruta ? correr('swift', [ruta, ...a]) : { status: -1, stdout: '', stderr: 'falta ' + script }; };
  function recortarPersona(foto, salida) {
    if (!sinApple()) {
      const r = swift('recortar.swift', foto, salida), dicho = cola(r.stdout, 1);
      if (r.status === 0 && existsSync(salida)) return { ok: true, mensaje: dicho };
      if (r.status === 2) return { ok: false, mensaje: dicho, sinSujeto: true };
      // sin `swift`, o macOS anterior al 14 (no trae ese recorte): sigue con la pieza común
    }
    return c.recortarRembg(foto, salida);
  }
  function buscarCara(imagen) {
    if (!sinApple()) {
      const r = swift('cara.swift', imagen), linea = (r.stdout || '').split('\n').filter(l => l.startsWith('{')).pop();
      if (r.status === 0 && linea) return JSON.parse(linea);
    }
    return c.caraOpenCV(imagen);
  }

  return {
    INSTALAR, transcribir, vozDePrueba, vocesDePrueba, medirImagen, achicarImagen, recortarPersona, buscarCara,
    rutasChrome: () => ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', join(process.env.HOME || '', 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), '/Applications/Chromium.app/Contents/MacOS/Chromium'],
    abrir: ruta => { const r = correr(process.platform === 'darwin' ? 'open' : 'xdg-open', [ruta]); if (r.status !== 0) throw new Error('No pude abrir ' + ruta); },
    npx: (args, opt) => correr('npx', args, opt),
    pythonDelVenv: venv => join(venv, 'bin', 'python'),
    PYTHON: [['python3']], PRIMERO_UV: false,
  };
}
