param(
    [int]$Port = 8765
)

$ErrorActionPreference = "Stop"
$BackendRoot = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $BackendRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    throw "Python virtual environment not found. Run: python -m venv .venv"
}

Set-Location $BackendRoot
& $Python -m uvicorn app.main:app --host 127.0.0.1 --port $Port
