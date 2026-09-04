[CmdletBinding()]
param(
    [string]$SocketDirectory = 'C:\Temp\sort-manager-java-uds',
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Import-ProjectEnvironment([string]$Path) {
    $values = @{}
    foreach ($line in Get-Content -LiteralPath $Path -Encoding UTF8) {
        if ($line -match '^\s*([^#=\s]+)\s*=\s*(.*)\s*$') {
            $key = $matches[1]
            $value = $matches[2].Trim()
            if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
                ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            $values[$key] = $value
        }
    }
    return $values
}

$repositoryRoot = Split-Path $PSScriptRoot -Parent
$backendRoot = Join-Path $repositoryRoot 'backend'
$environmentPath = Join-Path $repositoryRoot '.env'
$jarPath = Join-Path $backendRoot 'target\manager.jar'

if (-not (Test-Path -LiteralPath $environmentPath -PathType Leaf)) {
    throw "Missing local environment file: $environmentPath. Copy .env.example to .env and configure it before starting."
}

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    throw 'Java was not found on PATH. Install JDK 26.0.1, then retry.'
}

if (-not $SkipBuild -and -not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    throw 'Maven was not found on PATH. Install Maven, or run again with -SkipBuild when target\manager.jar already exists.'
}

$mysql = Get-Service -Name MySQL80 -ErrorAction SilentlyContinue
if ($null -ne $mysql -and $mysql.Status -ne 'Running') {
    throw 'MySQL80 is not running. Start it first, then rerun this script; the script does not change Windows service state.'
}

New-Item -ItemType Directory -Force -Path $SocketDirectory | Out-Null
$projectEnvironment = Import-ProjectEnvironment $environmentPath
$previousEnvironment = @{}

foreach ($key in $projectEnvironment.Keys) {
    $previousEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
    Set-Item -Path "Env:$key" -Value $projectEnvironment[$key]
}

try {
    Push-Location $backendRoot
    try {
        if (-not $SkipBuild) {
            & mvn package -DskipTests
            if ($LASTEXITCODE -ne 0) { throw "Maven build failed with exit code $LASTEXITCODE." }
        }

        if (-not (Test-Path -LiteralPath $jarPath -PathType Leaf)) {
            throw "Backend jar was not found: $jarPath. Run without -SkipBuild or build the backend first."
        }

        Write-Host "Starting backend with AF_UNIX socket directory: $SocketDirectory"
        & java "-Djdk.net.unixdomain.tmpdir=$SocketDirectory" -jar $jarPath
        if ($LASTEXITCODE -ne 0) { throw "Backend exited with code $LASTEXITCODE." }
    } finally {
        Pop-Location
    }
} finally {
    foreach ($key in $previousEnvironment.Keys) {
        if ($null -eq $previousEnvironment[$key]) {
            Remove-Item -Path "Env:$key" -ErrorAction SilentlyContinue
        } else {
            Set-Item -Path "Env:$key" -Value $previousEnvironment[$key]
        }
    }
}
