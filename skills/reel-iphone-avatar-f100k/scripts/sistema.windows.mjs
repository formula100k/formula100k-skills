// sistema.windows.mjs — la parte de Windows de sistema.mjs: voz de prueba con las voces de Windows (System.Speech,
// por PowerShell), fotos con ffmpeg, transcripción con faster-whisper, recorte con rembg y cara con OpenCV
// (los tres últimos corren con uv, que trae su propio Python: no hay que instalar Python aparte).
import { writeFileSync } from 'node:fs';

export default function windows(c) {
  const { correr, join, existsSync } = c;
  const INSTALAR = { uv: 'winget install -e --id astral-sh.uv', ffmpeg: 'winget install -e --id Gyan.FFmpeg', chrome: 'winget install -e --id Google.Chrome', 'yt-dlp': 'winget install -e --id yt-dlp.yt-dlp' };

  // PowerShell 5.1 (powershell.exe) viene en todo Windows 10 y 11 y trae System.Speech. El script viaja codificado:
  // así no hay comillas ni tildes que se rompan en el camino. Lo que responde sale por la salida normal, en UTF-8.
  const ps = (script, plazo = 120000) => correr('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand',
    Buffer.from("try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}\n$ErrorActionPreference = 'Stop'\n" + script, 'utf16le').toString('base64')], { timeout: plazo });
  const q = s => "'" + String(s).replace(/'/g, "''") + "'";            // texto literal de PowerShell
  const VOCES_ES = "$voces = @($s.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { $_.VoiceInfo } | Where-Object { $_.Culture.TwoLetterISOLanguageName -eq 'es' })";

  function vozDePrueba(texto, base, { voz = '', ritmo } = {}) {
    const wav = base + '.wav', txt = base + '.txt';
    // `ritmo` viene en palabras por minuto (como en Mac). Windows usa una escala de -10 a 10 donde cada 10 es el triple de rápido.
    const velocidad = ritmo ? Math.max(-10, Math.min(10, Math.round(10 * Math.log(ritmo / 180) / Math.log(3)))) : 0;
    c.rmSync(wav, { force: true });
    writeUtf8(txt, texto || ' ');
    const r = ps(`
try {
  Add-Type -AssemblyName System.Speech
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  ${VOCES_ES}
  if ($voces.Count -eq 0) { Write-Output 'SIN_VOZ'; exit 3 }
  $pedida = ${q(voz)}
  $v = $null
  if ($pedida -ne '') { $v = $voces | Where-Object { $_.Name -like ('*' + $pedida + '*') } | Select-Object -First 1 }
  if ($null -eq $v) { $v = $voces | Where-Object { $_.Culture.Name -ne 'es-ES' } | Select-Object -First 1 }
  if ($null -eq $v) { $v = $voces[0] }
  $s.SelectVoice($v.Name)
  $s.Rate = ${velocidad}
  $s.SetOutputToWaveFile(${q(wav)})
  $s.Speak([System.IO.File]::ReadAllText(${q(txt)}, [System.Text.Encoding]::UTF8))
  $s.SetOutputToNull()
  $s.Dispose()
  Write-Output ('VOZ=' + $v.Name)
  exit 0
} catch { Write-Output ('ERROR=' + $_.Exception.Message); exit 1 }
`);
    c.rmSync(txt, { force: true });
    if (r.status === 0 && existsSync(wav)) return wav;
    if (r.error || r.status === 3 || /SIN_VOZ/.test(r.stdout || '')) throw new Error(c.SIN_VOZ + '\n(Para tener voz de prueba: Configuración de Windows → Hora e idioma → Voz → Agregar voces → Español.)');
    throw new Error('La voz de Windows falló: ' + ((r.stdout || '').match(/ERROR=(.*)/)?.[1] || c.cola(r.stderr, 3) || 'sin respuesta') + '\n' + c.SIN_VOZ);
  }
  function vocesDePrueba() {
    const r = ps(`
try {
  Add-Type -AssemblyName System.Speech
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  ${VOCES_ES}
  foreach ($v in $voces) { Write-Output ($v.Name + ' (' + $v.Culture.Name + ')') }
  $s.Dispose()
  exit 0
} catch { exit 1 }
`, 60000);
    return r.status === 0 ? (r.stdout || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean) : [];
  }
  function writeUtf8(archivo, texto) { c.rmSync(archivo, { force: true }); writeFileSync(archivo, texto, 'utf8'); }

  const en = (variable, ...resto) => process.env[variable] ? join(process.env[variable], ...resto) : null;
  const arg = a => /[\s&|<>^"()]/.test(a) ? '"' + String(a).replace(/"/g, '""') + '"' : String(a);

  return {
    INSTALAR, vozDePrueba, vocesDePrueba,
    transcribir: (audio, opciones) => c.transcribirFaster(audio, opciones),
    medirImagen: c.medirImagenFf, achicarImagen: c.achicarImagenFf,
    recortarPersona: c.recortarRembg, buscarCara: c.caraOpenCV,
    rutasChrome: () => [en('PROGRAMFILES', 'Google', 'Chrome', 'Application', 'chrome.exe'), en('PROGRAMFILES(X86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      en('LOCALAPPDATA', 'Google', 'Chrome', 'Application', 'chrome.exe'), 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'],
    // start "" "ruta": las comillas vacías son el título de la ventana; sin ellas, una ruta entre comillas no abre nada
    abrir: ruta => { const r = correr('cmd.exe', ['/d', '/s', '/c', `"start "" "${ruta}""`], { windowsVerbatimArguments: true }); if (r.status !== 0) throw new Error('No pude abrir ' + ruta); },
    // npx es npx.cmd: solo arranca pasando por la consola, y ahí cada dato con espacios va entre comillas
    npx: (args, opt) => correr('npx', args.map(arg), { ...opt, shell: true }),
    pythonDelVenv: venv => join(venv, 'Scripts', 'python.exe'),
    PYTHON: [['py', '-3'], ['python']], PRIMERO_UV: true,
  };
}
