Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-True([bool]$Condition, [string]$Message) { if (-not $Condition) { throw "Assertion failed: $Message" } }

$opsRoot = Split-Path $PSScriptRoot -Parent
$root = Join-Path ([IO.Path]::GetTempPath()) ('sort-manager-ops-test-' + [Guid]::NewGuid().ToString('N'))
$plainArtifactsBefore = @(
    Get-ChildItem -LiteralPath ([IO.Path]::GetTempPath()) -Directory -Filter 'sort-manager-backup-*'
    Get-ChildItem -LiteralPath ([IO.Path]::GetTempPath()) -Directory -Filter 'sort-manager-restore-*'
) | ForEach-Object FullName
$env:BACKUP_PASSPHRASE = 'CI-only-passphrase-2026!'
try {
    [IO.Directory]::CreateDirectory($root) | Out-Null
    $dump = Join-Path $root 'fixture.sql'
    $uploads = Join-Path $root 'uploads'
    $output = Join-Path $root 'encrypted'
    $status = Join-Path $root 'status.json'
    [IO.Directory]::CreateDirectory($uploads) | Out-Null
    [IO.File]::WriteAllText($dump, "CREATE TABLE fixture (id INT);`n", [Text.UTF8Encoding]::new($false))
    [IO.File]::WriteAllBytes((Join-Path $uploads 'photo.bin'), [byte[]](1, 4, 9, 16, 25))

    $backup = & (Join-Path $opsRoot 'backup.ps1') -OutputDirectory $output -StatusPath $status -UploadsPath $uploads -SourceDumpPath $dump -DatabaseName 'sort_manager_fixture'
    Assert-True (Test-Path -LiteralPath $backup.Path -PathType Leaf) 'encrypted archive should be created'
    $state = Get-Content -LiteralPath $status -Raw -Encoding UTF8 | ConvertFrom-Json
    Assert-True (-not [string]::IsNullOrWhiteSpace($state.lastSuccessAt)) 'status JSON should report the last successful backup'
    Assert-True ($state.lastSuccessAt -eq $state.lastVerifiedAt) 'new backup should be verified before reporting success'
    Assert-True ($state.backupSizeBytes -gt 0) 'status JSON should expose a non-sensitive backup size'
    Assert-True (-not ($state.PSObject.Properties.Name -contains 'path')) 'status JSON must not disclose the archive path'

    $verified = & (Join-Path $opsRoot 'restore-backup.ps1') -ArchivePath $backup.Path -MySqlExecutable '__verify_mode_must_not_invoke_mysql__'
    Assert-True ($verified.Verified -and -not $verified.Applied) 'default restore mode should verify without applying'
    Assert-True ($verified.FileCount -eq 2) 'database and upload file should be verified'

    $sourceOverwriteRejected = $false
    try { & (Join-Path $opsRoot 'restore-backup.ps1') -ArchivePath $backup.Path -Apply -TargetDatabase 'SORT_MANAGER_FIXTURE' -MySqlExecutable '__must_not_run__' | Out-Null } catch { $sourceOverwriteRejected = $_.Exception.Message -match 'source database' }
    Assert-True $sourceOverwriteRejected 'apply should refuse source database overwrite before invoking mysql'

    $tampered = Join-Path $root 'tampered.smbak'
    $bytes = [IO.File]::ReadAllBytes($backup.Path)
    $bytes[[Math]::Floor($bytes.Length / 2)] = $bytes[[Math]::Floor($bytes.Length / 2)] -bxor 1
    [IO.File]::WriteAllBytes($tampered, $bytes)
    $rejected = $false
    try { & (Join-Path $opsRoot 'restore-backup.ps1') -ArchivePath $tampered | Out-Null } catch { $rejected = $_.Exception.Message -match 'authentication failed' }
    Assert-True $rejected 'tampered archive should be rejected before extraction'

    $emptyUploads = Join-Path $root 'empty-uploads'
    [IO.Directory]::CreateDirectory($emptyUploads) | Out-Null
    $emptyBackup = & (Join-Path $opsRoot 'backup.ps1') -OutputDirectory $output -StatusPath $status -UploadsPath $emptyUploads -SourceDumpPath $dump -DatabaseName 'sort_manager_empty_uploads'
    $emptyVerified = & (Join-Path $opsRoot 'restore-backup.ps1') -ArchivePath $emptyBackup.Path
    Assert-True ($emptyVerified.Verified -and $emptyVerified.FileCount -eq 1) 'a family with no uploads should still produce a verifiable backup'

    $newPlainArtifacts = @(@(
        Get-ChildItem -LiteralPath ([IO.Path]::GetTempPath()) -Directory -Filter 'sort-manager-backup-*'
        Get-ChildItem -LiteralPath ([IO.Path]::GetTempPath()) -Directory -Filter 'sort-manager-restore-*'
    ) | Where-Object { $_.FullName -notin $plainArtifactsBefore })
    Assert-True ($newPlainArtifacts.Count -eq 0) 'plaintext work directories created by this run should be removed in finally'
    Write-Host 'Encrypted backup round-trip, verify-only mode, tamper rejection, and cleanup passed.'
} finally {
    Remove-Item Env:BACKUP_PASSPHRASE -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $root) { Remove-Item -LiteralPath $root -Recurse -Force }
}
