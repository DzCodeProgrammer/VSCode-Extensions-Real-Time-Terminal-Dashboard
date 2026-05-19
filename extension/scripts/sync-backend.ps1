$ErrorActionPreference = "Stop"
$ExtensionRoot = Split-Path -Parent $PSScriptRoot
$RepoRoot = Split-Path -Parent $ExtensionRoot
$SourceBackend = Join-Path $RepoRoot "backend"
$TargetBackend = Join-Path $ExtensionRoot "backend"

if (-not (Test-Path $SourceBackend)) {
    throw "Backend source folder not found: $SourceBackend"
}

if (Test-Path $TargetBackend) {
    Remove-Item -LiteralPath $TargetBackend -Recurse -Force
}

New-Item -ItemType Directory -Path $TargetBackend -Force | Out-Null
$ExcludedDirectories = @(".venv", "__pycache__")
$ExcludedFiles = @("*.pyc", "uvicorn.*.log")

Get-ChildItem -Path $SourceBackend -Recurse -Force | ForEach-Object {
    $relative = $_.FullName.Substring($SourceBackend.Length).TrimStart("\")
    if (-not $relative) { return }

    foreach ($directory in $ExcludedDirectories) {
        if ($relative -eq $directory -or $relative.StartsWith("$directory\") -or $relative.Contains("\$directory\")) {
            return
        }
    }

    foreach ($pattern in $ExcludedFiles) {
        if (-not $_.PSIsContainer -and $_.Name -like $pattern) {
            return
        }
    }

    $destination = Join-Path $TargetBackend $relative
    if ($_.PSIsContainer) {
        New-Item -ItemType Directory -Path $destination -Force | Out-Null
    } else {
        $parent = Split-Path -Parent $destination
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
        Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
    }
}

Write-Host "Synced backend into extension/backend for packaging."