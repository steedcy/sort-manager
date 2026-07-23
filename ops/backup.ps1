[CmdletBinding()]
param(
    [string]$OutputDirectory = $(if ($env:BACKUP_OUTPUT_PATH) { $env:BACKUP_OUTPUT_PATH } else { Join-Path $PSScriptRoot 'backups' }),
    [string]$StatusPath = $(if ($env:APP_BACKUP_STATUS_PATH) { $env:APP_BACKUP_STATUS_PATH } else { Join-Path $PSScriptRoot 'backup-status.json' }),
    [string]$UploadsPath = $(if ($env:APP_UPLOAD_PATH) { $env:APP_UPLOAD_PATH } else { Join-Path (Split-Path $PSScriptRoot -Parent) 'uploads' }),
    [string]$SourceDumpPath,
    [string]$DatabaseHost = '127.0.0.1', [int]$DatabasePort = 3306,
    [string]$DatabaseName = 'sort_manager', [string]$DatabaseUser = $(if ($env:DB_USERNAME) { $env:DB_USERNAME } else { 'sort_manager_app' }),
    [string]$MySqlDumpExecutable = 'mysqldump', [Security.SecureString]$Passphrase
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib/BackupCrypto.ps1')

function Write-BackupStatus([string]$Status, [string]$CompletedAt, [long]$SizeBytes, [string]$Sha256, [string]$Message) {
    $payload = if ($Status -eq 'HEALTHY') {
        [ordered]@{ lastSuccessAt = $CompletedAt; lastVerifiedAt = $CompletedAt; backupSizeBytes = $SizeBytes; sha256 = $Sha256 }
    } else {
        [ordered]@{ outcome = 'FAILED'; lastAttemptAt = $CompletedAt; message = $Message }
    }
    $statusFull = [IO.Path]::GetFullPath($StatusPath)
    [IO.Directory]::CreateDirectory((Split-Path -Parent $statusFull)) | Out-Null
    $statusTemporary = $statusFull + '.tmp-' + [Guid]::NewGuid().ToString('N')
    try {
        [IO.File]::WriteAllText($statusTemporary, ($payload | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
        Move-Item -LiteralPath $statusTemporary -Destination $statusFull -Force
    } finally {
        if (Test-Path -LiteralPath $statusTemporary) { Remove-Item -LiteralPath $statusTemporary -Force }
    }
}

$work = Join-Path ([IO.Path]::GetTempPath()) ('sort-manager-backup-' + [Guid]::NewGuid().ToString('N'))
$completedAt = [DateTime]::UtcNow.ToString('o')
try {
    if ($DatabaseName -notmatch '^[A-Za-z0-9_]+$') { throw 'DatabaseName contains unsupported characters.' }
    if ($DatabaseHost -notmatch '^[A-Za-z0-9.:-]+$' -or $DatabaseUser -notmatch '^[A-Za-z0-9_@.-]+$') { throw 'Database host or user contains unsupported characters.' }
    [IO.Directory]::CreateDirectory($work) | Out-Null
    $payload = Join-Path $work 'payload'
    [IO.Directory]::CreateDirectory($payload) | Out-Null
    $dumpTarget = Join-Path $payload 'database.sql'
    if ($SourceDumpPath) {
        Copy-Item -LiteralPath $SourceDumpPath -Destination $dumpTarget
    } else {
        if ([string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) { throw 'DB_PASSWORD is required when mysqldump is executed.' }
        $oldPassword = $env:MYSQL_PWD
        try {
            $env:MYSQL_PWD = $env:DB_PASSWORD
            $psi = [Diagnostics.ProcessStartInfo]::new()
            $psi.FileName = $MySqlDumpExecutable
            $psi.Arguments = "--single-transaction --routines --triggers --default-character-set=utf8mb4 --host=$DatabaseHost --port=$DatabasePort --user=$DatabaseUser $DatabaseName"
            $psi.UseShellExecute = $false; $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true; $psi.CreateNoWindow = $true
            $psi.Environment.Remove('BACKUP_PASSPHRASE') | Out-Null
            $psi.Environment.Remove('DB_PASSWORD') | Out-Null
            $process = [Diagnostics.Process]::Start($psi)
            $stderrTask = $process.StandardError.ReadToEndAsync()
            $stream = [IO.File]::Create($dumpTarget)
            try { $process.StandardOutput.BaseStream.CopyTo($stream) } finally { $stream.Dispose() }
            $process.WaitForExit(); $stderr = $stderrTask.GetAwaiter().GetResult()
            if ($process.ExitCode -ne 0) { throw "mysqldump failed: $stderr" }
        } finally {
            if ($null -eq $oldPassword) { Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue } else { $env:MYSQL_PWD = $oldPassword }
        }
    }
    $uploadsTarget = Join-Path $payload 'uploads'
    [IO.Directory]::CreateDirectory($uploadsTarget) | Out-Null
    if (Test-Path -LiteralPath $UploadsPath -PathType Container) {
        Get-ChildItem -LiteralPath $UploadsPath -Force | Copy-Item -Destination $uploadsTarget -Recurse -Force
    }
    $files = Get-ChildItem -LiteralPath $payload -File -Recurse | Sort-Object FullName | ForEach-Object {
        [ordered]@{ path = $_.FullName.Substring($payload.Length + 1).Replace('\', '/'); sizeBytes = $_.Length; sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
    }
    $manifest = [ordered]@{ formatVersion = 1; createdAt = $completedAt; sourceDatabase = $DatabaseName; files = @($files) }
    [IO.File]::WriteAllText((Join-Path $payload 'manifest.json'), ($manifest | ConvertTo-Json -Depth 6), [Text.UTF8Encoding]::new($false))
    $zip = Join-Path $work 'payload.zip'
    Compress-Archive -Path (Join-Path $payload '*') -DestinationPath $zip -CompressionLevel Optimal
    [IO.Directory]::CreateDirectory([IO.Path]::GetFullPath($OutputDirectory)) | Out-Null
    $archivePath = Join-Path $OutputDirectory ('sort-manager-' + [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmssfff') + '.smbak')
    $result = Export-SortManagerEncryptedArchive -ZipPath $zip -ArchivePath $archivePath -Passphrase $Passphrase
    $verificationZip = Join-Path $work 'verification.zip'
    Expand-SortManagerEncryptedArchive -ArchivePath $result.Path -ZipPath $verificationZip -Passphrase $Passphrase | Out-Null
    Write-BackupStatus 'HEALTHY' $completedAt $result.SizeBytes $result.Sha256 'Encrypted backup completed.'
    [pscustomobject]$result
} catch {
    Write-BackupStatus 'FAILED' $completedAt 0 '' 'Backup task failed; inspect restricted task logs.'
    throw
} finally {
    if (Test-Path -LiteralPath $work) { Remove-Item -LiteralPath $work -Recurse -Force }
}
