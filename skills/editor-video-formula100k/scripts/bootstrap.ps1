# Bootstrap para Windows: instala dependencias del editor-video-formula100k.
#
# Uso:
#   .\bootstrap.ps1            -> modo automático (instala lo que falta)
#   .\bootstrap.ps1 -Check     -> sólo reporta qué falta, no instala
#
# Dependencias:
#   - winget (Windows Package Manager, viene en Windows 10/11 modernos)
#   - Node 18+ (winget: OpenJS.NodeJS.LTS)
#   - Python 3.10+ (winget: Python.Python.3.12)
#   - ffmpeg (winget: Gyan.FFmpeg)
#   - yt-dlp (winget: yt-dlp.yt-dlp)
#   - faster-whisper (pip)
#   - Remotion (npm install en remotion-template/)

param(
    [switch]$Check
)

$ErrorActionPreference = 'Stop'

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir    = Split-Path -Parent $ScriptDir
$TemplateDir = Join-Path $SkillDir 'remotion-template'

function Say-OK    ($msg) { Write-Host "  [OK]   $msg" -ForegroundColor Green }
function Say-Fail  ($msg) { Write-Host "  [MISS] $msg" -ForegroundColor Red }
function Say-Warn  ($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }

$Missing = @()
$Actions = @()

function Check-Cmd($name, $check, $fix) {
    if (& $check) {
        Say-OK $name
    } else {
        Say-Fail $name
        $script:Missing += $name
        $script:Actions += $fix
    }
}

Write-Host ""
Write-Host "Editor de Video FORMULA 100K - Bootstrap (Windows)" -ForegroundColor Cyan
Write-Host "[1/2] Verificando dependencias..." -ForegroundColor Cyan

# winget (precondición)
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Say-Fail "winget (Windows Package Manager)"
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host "  WINGET NO ESTA DISPONIBLE" -ForegroundColor Red
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "winget es la unica precondicion de esta skill en Windows." -ForegroundColor Yellow
    Write-Host "Sin el no se puede instalar Node, Python, ffmpeg ni yt-dlp."
    Write-Host ""
    Write-Host "winget viene preinstalado en Windows 10 (build 1809+) y 11." -ForegroundColor Yellow
    Write-Host "Si te falta:"
    Write-Host ""
    Write-Host "  1) Abre Microsoft Store"
    Write-Host "  2) Busca 'App Installer' (de Microsoft) e instala/actualiza"
    Write-Host "  3) Cierra esta ventana de PowerShell y abre una nueva"
    Write-Host "  4) Vuelve a correr /render <carpeta> o /edita <carpeta>"
    Write-Host ""
    Write-Host "Alternativa manual (si Microsoft Store no funciona):" -ForegroundColor Yellow
    Write-Host "  https://github.com/microsoft/winget-cli/releases/latest"
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Red
    exit 2
}
Say-OK "winget"

Check-Cmd "Node 18+" `
    { try { (node --version) -match '^v(1[89]|[2-9][0-9])' } catch { $false } } `
    "winget install -e --id OpenJS.NodeJS.LTS --silent"

Check-Cmd "Python 3.10+" `
    { try { (python --version) -match '^Python 3\.(1[0-9]|[2-9][0-9])' } catch { $false } } `
    "winget install -e --id Python.Python.3.12 --silent"

Check-Cmd "ffmpeg" `
    { try { Get-Command ffmpeg -ErrorAction Stop | Out-Null; $true } catch { $false } } `
    "winget install -e --id Gyan.FFmpeg --silent"

Check-Cmd "yt-dlp" `
    { try { Get-Command yt-dlp -ErrorAction Stop | Out-Null; $true } catch { $false } } `
    "winget install -e --id yt-dlp.yt-dlp --silent"

Check-Cmd "faster-whisper (pip)" `
    { try { python -c "import faster_whisper" 2>$null; $LASTEXITCODE -eq 0 } catch { $false } } `
    "python -m pip install --user faster-whisper"

Check-Cmd "Remotion (node_modules)" `
    { Test-Path (Join-Path $TemplateDir 'node_modules\remotion') } `
    "Push-Location '$TemplateDir'; npm install --cache='$env:TEMP\npm-cache'; Pop-Location"

if ($Missing.Count -eq 0) {
    Write-Host ""
    Write-Host "Todo listo. La skill editor-video-formula100k esta operativa." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Falta(n): $($Missing -join ', ')" -ForegroundColor Yellow

if ($Check) {
    Write-Host ""
    Write-Host "Para instalar lo que falta:"
    foreach ($a in $Actions) { Write-Host "  $a" }
    exit 1
}

Write-Host "[2/2] Instalando..." -ForegroundColor Cyan
for ($i = 0; $i -lt $Missing.Count; $i++) {
    Write-Host ""
    Write-Host "-> $($Missing[$i])" -ForegroundColor Yellow
    Write-Host "   $($Actions[$i])"
    Invoke-Expression $Actions[$i]
}

Write-Host ""
Write-Host "Bootstrap completo. La skill editor-video-formula100k esta lista." -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE: Si Node o Python recien se instalaron," -ForegroundColor Yellow
Write-Host "cierra esta ventana y abre PowerShell de nuevo para que el PATH se actualice."
