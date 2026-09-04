Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw "Assertion failed: $Message" }
}

$repositoryRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$backendRoot = Join-Path $repositoryRoot 'backend'
Push-Location $backendRoot
try {
    & mvn clean compile -DskipTests
    Assert-True ($LASTEXITCODE -eq 0) 'backend should compile successfully'
    $classDetails = & javap -verbose 'target/classes/com/sort/manager/SortManagerApplication.class'
    Assert-True (($classDetails -join "`n") -match 'major version: 70') 'backend bytecode should target Java 26 (major version 70)'
} finally {
    Pop-Location
}

Write-Host 'Java 26 target contract passed.'
