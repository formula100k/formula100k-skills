# Wrapper de PowerShell para render.py (la logica vive en Python, cross-platform).
# Uso: .\render.ps1 <DEST_FOLDER> <SOURCE_VIDEO>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Dest,

    [Parameter(Mandatory=$true, Position=1)]
    [string]$Source
)

$ErrorActionPreference = 'Stop'

$ScriptDir     = Split-Path -Parent $MyInvocation.MyCommand.Path
$BootstrapPath = Join-Path $ScriptDir 'bootstrap.ps1'
$RenderPyPath  = Join-Path $ScriptDir 'render.py'

# Pre-check rapido: si winget falta, mostrar instrucciones y abortar limpio
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    & powershell -ExecutionPolicy Bypass -File $BootstrapPath -Check | Out-Host
    exit 2
}

# Verificar bootstrap silenciosamente; si falta algo, instalar
& powershell -ExecutionPolicy Bypass -File $BootstrapPath -Check *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[bootstrap] Faltan dependencias. Corriendo bootstrap (solo la primera vez, ~5-8 min)..." -ForegroundColor Yellow
    & powershell -ExecutionPolicy Bypass -File $BootstrapPath
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# Ejecutar el orquestador Python (cross-platform)
python $RenderPyPath $Dest $Source
exit $LASTEXITCODE
