Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw "Assertion failed: $Message" }
}

$opsRoot = Split-Path $PSScriptRoot -Parent
$scriptPath = Join-Path $opsRoot 'start-local.ps1'

Assert-True (Test-Path -LiteralPath $scriptPath -PathType Leaf) 'local startup script should exist'

$tokens = $null
$errors = $null
[Management.Automation.Language.Parser]::ParseFile($scriptPath, [ref]$tokens, [ref]$errors) | Out-Null
Assert-True ($errors.Count -eq 0) 'local startup script should parse without errors'

$content = Get-Content -LiteralPath $scriptPath -Raw -Encoding UTF8
Assert-True ($content -match 'C:\\Temp\\sort-manager-java-uds') 'script should default to a dedicated C:\\Temp socket directory'
Assert-True ($content -match 'jdk\.net\.unixdomain\.tmpdir') 'script should set the JDK AF_UNIX temporary socket directory'
Assert-True ($content -match 'target[\\/]manager\.jar') 'script should launch the packaged backend jar'
Assert-True ($content -notmatch '(?i)\bsetx\s+TEMP\b') 'script must not persistently change the system TEMP environment variable'
Assert-True ($content -notmatch '(?i)\bnetsh\b|Set-NetFirewallProfile|Set-Acl') 'script must not reset networking, change the firewall, or modify ACLs'

Write-Host 'Local startup script contract passed.'
