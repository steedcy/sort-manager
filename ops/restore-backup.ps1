[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ArchivePath,
    [switch]$Apply, [string]$TargetDatabase, [string]$TargetUploadsPath,
    [string]$DatabaseHost = '127.0.0.1', [int]$DatabasePort = 3306,
    [string]$DatabaseUser = $(if ($env:DB_USERNAME) { $env:DB_USERNAME } else { 'sort_manager_app' }),
    [string]$MySqlExecutable = 'mysql', [Security.SecureString]$Passphrase
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib/BackupCrypto.ps1')

$work = Join-Path ([IO.Path]::GetTempPath()) ('sort-manager-restore-' + [Guid]::NewGuid().ToString('N'))
$uploadsFull = $null
try {
    [IO.Directory]::CreateDirectory($work) | Out-Null
    $zip = Join-Path $work 'payload.zip'
    Expand-SortManagerEncryptedArchive -ArchivePath $ArchivePath -ZipPath $zip -Passphrase $Passphrase | Out-Null
    $payload = Join-Path $work 'payload'
    [IO.Directory]::CreateDirectory($payload) | Out-Null
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zipArchive = [IO.Compression.ZipFile]::OpenRead($zip)
    try {
        $seenEntries = @{}
        foreach ($entry in $zipArchive.Entries) {
            $name = $entry.FullName.Replace('\', '/')
            if ([string]::IsNullOrEmpty($entry.Name)) { continue }
            if (($name -ne 'manifest.json' -and $name -ne 'database.sql' -and $name -notmatch '^uploads/[A-Za-z0-9_./ -]+$') -or $name.Contains('..') -or $name.StartsWith('/')) {
                throw "Unsafe archive entry: $name"
            }
            if ($seenEntries.ContainsKey($name)) { throw "Duplicate archive entry: $name" }
            $seenEntries[$name] = $true
        }
    } finally { $zipArchive.Dispose() }
    Expand-Archive -LiteralPath $zip -DestinationPath $payload
    $manifestPath = Join-Path $payload 'manifest.json'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw 'Backup manifest is missing.' }
    $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($manifest.formatVersion -ne 1 -or [string]::IsNullOrWhiteSpace($manifest.sourceDatabase)) { throw 'Backup manifest is invalid.' }
    $declared = @{}
    foreach ($entry in @($manifest.files)) {
        if ($entry.path -notmatch '^(database\.sql|uploads/[A-Za-z0-9_./ -]+)$' -or $entry.path.Contains('..')) { throw "Unsafe manifest path: $($entry.path)" }
        if ($declared.ContainsKey($entry.path)) { throw "Duplicate manifest path: $($entry.path)" }
        $declared[$entry.path] = $true
        $candidate = [IO.Path]::GetFullPath((Join-Path $payload $entry.path))
        if (-not $candidate.StartsWith([IO.Path]::GetFullPath($payload) + [IO.Path]::DirectorySeparatorChar)) { throw 'Manifest path escapes the restore directory.' }
        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { throw "Backup file is missing: $($entry.path)" }
        if ((Get-Item -LiteralPath $candidate).Length -ne [long]$entry.sizeBytes) { throw "Backup file size mismatch: $($entry.path)" }
        $hash = (Get-FileHash -LiteralPath $candidate -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($hash -ne $entry.sha256) { throw "Backup file hash mismatch: $($entry.path)" }
    }
    $actualFiles = @(Get-ChildItem -LiteralPath $payload -File -Recurse | Where-Object Name -ne 'manifest.json')
    if ($actualFiles.Count -ne $declared.Count) { throw 'Backup contains undeclared files.' }
    if (-not $declared.ContainsKey('database.sql')) { throw 'Database dump is missing from manifest.' }

    if ($Apply) {
        if ($TargetDatabase -notmatch '^[A-Za-z0-9_]+$') { throw 'Apply requires an isolated TargetDatabase using letters, numbers, or underscores.' }
        if ([string]::Equals($TargetDatabase, [string]$manifest.sourceDatabase, [StringComparison]::OrdinalIgnoreCase)) { throw 'Refusing to restore directly over the source database. Use an isolated target database.' }
        if ($DatabaseHost -notmatch '^[A-Za-z0-9.:-]+$' -or $DatabaseUser -notmatch '^[A-Za-z0-9_@.-]+$') { throw 'Database host or user contains unsupported characters.' }
        if ([string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) { throw 'DB_PASSWORD is required when restore apply is requested.' }
        if ([string]::IsNullOrWhiteSpace($TargetUploadsPath)) { throw 'Apply requires an isolated TargetUploadsPath.' }
        $uploadsFull = [IO.Path]::GetFullPath($TargetUploadsPath)
        if (Test-Path -LiteralPath $uploadsFull) {
            if (-not (Test-Path -LiteralPath $uploadsFull -PathType Container) -or (Get-ChildItem -LiteralPath $uploadsFull -Force | Select-Object -First 1)) {
                throw 'TargetUploadsPath must be a new or empty isolated directory.'
            }
        } else { [IO.Directory]::CreateDirectory($uploadsFull) | Out-Null }
        $oldPassword = $env:MYSQL_PWD
        try {
            $env:MYSQL_PWD = $env:DB_PASSWORD
            $check = [Diagnostics.ProcessStartInfo]::new()
            $check.FileName = $MySqlExecutable
            $check.Arguments = "--batch --skip-column-names --host=$DatabaseHost --port=$DatabasePort --user=$DatabaseUser --execute=`"SELECT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$TargetDatabase') + (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = '$TargetDatabase')`""
            $check.UseShellExecute = $false; $check.RedirectStandardOutput = $true; $check.RedirectStandardError = $true; $check.CreateNoWindow = $true
            $check.Environment.Remove('BACKUP_PASSPHRASE') | Out-Null
            $check.Environment.Remove('DB_PASSWORD') | Out-Null
            $checkProcess = [Diagnostics.Process]::Start($check)
            $checkOutput = $checkProcess.StandardOutput.ReadToEnd()
            $checkError = $checkProcess.StandardError.ReadToEnd()
            $checkProcess.WaitForExit()
            $tableCount = 0L
            if ($checkProcess.ExitCode -ne 0 -or -not [long]::TryParse($checkOutput.Trim(), [ref]$tableCount)) {
                throw "Unable to verify that the target database is empty: $checkError"
            }
            if ($tableCount -ne 0) { throw 'TargetDatabase must be an empty isolated database.' }

            $psi = [Diagnostics.ProcessStartInfo]::new()
            $psi.FileName = $MySqlExecutable
            $psi.Arguments = "--default-character-set=utf8mb4 --host=$DatabaseHost --port=$DatabasePort --user=$DatabaseUser $TargetDatabase"
            $psi.UseShellExecute = $false; $psi.RedirectStandardInput = $true; $psi.RedirectStandardError = $true; $psi.CreateNoWindow = $true
            $psi.Environment.Remove('BACKUP_PASSPHRASE') | Out-Null
            $psi.Environment.Remove('DB_PASSWORD') | Out-Null
            $process = [Diagnostics.Process]::Start($psi)
            $stderrTask = $process.StandardError.ReadToEndAsync()
            $input = [IO.File]::OpenRead((Join-Path $payload 'database.sql'))
            try { $input.CopyTo($process.StandardInput.BaseStream); $process.StandardInput.Close() } finally { $input.Dispose() }
            $process.WaitForExit(); $stderr = $stderrTask.GetAwaiter().GetResult()
            if ($process.ExitCode -ne 0) { throw "mysql restore failed: $stderr" }
        } finally {
            if ($null -eq $oldPassword) { Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue } else { $env:MYSQL_PWD = $oldPassword }
        }
        $restoredUploads = Join-Path $payload 'uploads'
        if (Test-Path -LiteralPath $restoredUploads -PathType Container) {
            Get-ChildItem -LiteralPath $restoredUploads -Force | Copy-Item -Destination $uploadsFull -Recurse -Force
        }
    }
    [pscustomobject]@{ Verified = $true; Applied = [bool]$Apply; CreatedAt = $manifest.createdAt; FileCount = $declared.Count; TargetDatabase = $(if ($Apply) { $TargetDatabase } else { $null }); TargetUploadsPath = $uploadsFull }
} finally {
    if (Test-Path -LiteralPath $work) { Remove-Item -LiteralPath $work -Recurse -Force }
}
