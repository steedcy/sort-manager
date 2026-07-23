Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$opsRoot = Split-Path $PSScriptRoot -Parent
$files = Get-ChildItem -LiteralPath $opsRoot -Filter '*.ps1' -File -Recurse
foreach ($file in $files) {
    $tokens = $null; $errors = $null
    [Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$errors) | Out-Null
    if ($errors.Count -gt 0) { throw "PowerShell parse failed for $($file.FullName): $($errors -join '; ')" }
}
Write-Host "PowerShell syntax check passed for $($files.Count) scripts."
