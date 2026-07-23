Set-StrictMode -Version Latest

$script:ArchiveMagic = [Text.Encoding]::ASCII.GetBytes('SMBKP160')
$script:KdfIterations = 210000

function Get-Sha256Hex {
    param([Parameter(Mandatory)][byte[]]$Bytes)
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

function Test-FixedTimeEqual {
    param([byte[]]$Left, [byte[]]$Right)
    if ($null -eq $Left -or $null -eq $Right -or $Left.Length -ne $Right.Length) { return $false }
    $difference = 0
    for ($i = 0; $i -lt $Left.Length; $i++) { $difference = $difference -bor ($Left[$i] -bxor $Right[$i]) }
    return $difference -eq 0
}

function Get-PlainPassphrase {
    param([Security.SecureString]$Passphrase)
    if ($null -eq $Passphrase) {
        if ([string]::IsNullOrWhiteSpace($env:BACKUP_PASSPHRASE)) {
            throw 'Provide -Passphrase or set BACKUP_PASSPHRASE.'
        }
        return $env:BACKUP_PASSPHRASE
    }
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Passphrase)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

function Get-DerivedKeys {
    param([Parameter(Mandatory)][string]$PlainPassphrase, [Parameter(Mandatory)][byte[]]$Salt, [int]$Iterations)
    if ($PlainPassphrase.Length -lt 12) { throw 'Backup passphrase must contain at least 12 characters.' }
    $kdf = [Security.Cryptography.Rfc2898DeriveBytes]::new($PlainPassphrase, $Salt, $Iterations, [Security.Cryptography.HashAlgorithmName]::SHA256)
    try {
        $material = $kdf.GetBytes(64)
        return @{ Encryption = $material[0..31]; Authentication = $material[32..63] }
    } finally { $kdf.Dispose() }
}

function Export-SortManagerEncryptedArchive {
    param(
        [Parameter(Mandatory)][string]$ZipPath,
        [Parameter(Mandatory)][string]$ArchivePath,
        [Security.SecureString]$Passphrase
    )
    $plain = $null
    $zipBytes = $null
    $cipherBytes = $null
    try {
        $plain = Get-PlainPassphrase $Passphrase
        $zipBytes = [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $ZipPath))
        $salt = New-Object byte[] 16
        $iv = New-Object byte[] 16
        $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($salt); $rng.GetBytes($iv) } finally { $rng.Dispose() }
        $keys = Get-DerivedKeys $plain $salt $script:KdfIterations
        $aes = [Security.Cryptography.Aes]::Create()
        try {
            $aes.KeySize = 256; $aes.Mode = 'CBC'; $aes.Padding = 'PKCS7'
            $aes.Key = [byte[]]$keys.Encryption; $aes.IV = $iv
            $encryptor = $aes.CreateEncryptor()
            try { $cipherBytes = $encryptor.TransformFinalBlock($zipBytes, 0, $zipBytes.Length) }
            finally { $encryptor.Dispose() }
        } finally { $aes.Dispose() }

        $header = [ordered]@{
            format = 'sort-manager-backup'; version = 1; kdf = 'PBKDF2-SHA256'
            iterations = $script:KdfIterations; cipher = 'AES-256-CBC'; mac = 'HMAC-SHA256'
            salt = [Convert]::ToBase64String($salt); iv = [Convert]::ToBase64String($iv)
            archiveSha256 = Get-Sha256Hex $zipBytes
        }
        $headerBytes = [Text.Encoding]::UTF8.GetBytes(($header | ConvertTo-Json -Compress))
        $bodyStream = New-Object IO.MemoryStream
        try {
            $writer = New-Object IO.BinaryWriter($bodyStream, [Text.Encoding]::UTF8, $true)
            try {
                $writer.Write($script:ArchiveMagic); $writer.Write([int]$headerBytes.Length)
                $writer.Write($headerBytes); $writer.Write($cipherBytes); $writer.Flush()
            } finally { $writer.Dispose() }
            $body = $bodyStream.ToArray()
        } finally { $bodyStream.Dispose() }
        $hmac = [Security.Cryptography.HMACSHA256]::new([byte[]]$keys.Authentication)
        try { $tag = $hmac.ComputeHash($body) } finally { $hmac.Dispose() }
        $target = [IO.Path]::GetFullPath($ArchivePath)
        $parent = Split-Path -Parent $target
        if ($parent) { [IO.Directory]::CreateDirectory($parent) | Out-Null }
        $output = New-Object byte[] ($body.Length + $tag.Length)
        [Array]::Copy($body, 0, $output, 0, $body.Length)
        [Array]::Copy($tag, 0, $output, $body.Length, $tag.Length)
        $temporaryTarget = $target + '.tmp-' + [Guid]::NewGuid().ToString('N')
        try {
            [IO.File]::WriteAllBytes($temporaryTarget, $output)
            Move-Item -LiteralPath $temporaryTarget -Destination $target -Force
        } finally {
            if (Test-Path -LiteralPath $temporaryTarget) { Remove-Item -LiteralPath $temporaryTarget -Force }
        }
        return @{ Path = $target; SizeBytes = $output.Length; Sha256 = Get-Sha256Hex $output }
    } finally {
        $plain = $null
        if ($zipBytes) { [Array]::Clear($zipBytes, 0, $zipBytes.Length) }
        if ($cipherBytes) { [Array]::Clear($cipherBytes, 0, $cipherBytes.Length) }
    }
}

function Expand-SortManagerEncryptedArchive {
    param(
        [Parameter(Mandatory)][string]$ArchivePath,
        [Parameter(Mandatory)][string]$ZipPath,
        [Security.SecureString]$Passphrase
    )
    $plain = $null
    $archive = $null
    $zipBytes = $null
    try {
        $plain = Get-PlainPassphrase $Passphrase
        $archive = [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $ArchivePath))
        if ($archive.Length -lt 77) { throw 'Backup archive is truncated.' }
        for ($i = 0; $i -lt $script:ArchiveMagic.Length; $i++) {
            if ($archive[$i] -ne $script:ArchiveMagic[$i]) { throw 'Backup archive format is not recognized.' }
        }
        $headerLength = [BitConverter]::ToInt32($archive, 8)
        if ($headerLength -lt 100 -or $headerLength -gt 65536 -or (12 + $headerLength + 32) -ge $archive.Length) {
            throw 'Backup archive header is invalid.'
        }
        $headerText = [Text.Encoding]::UTF8.GetString($archive, 12, $headerLength)
        $header = $headerText | ConvertFrom-Json
        if ($header.format -ne 'sort-manager-backup' -or $header.version -ne 1 -or
            $header.kdf -ne 'PBKDF2-SHA256' -or $header.cipher -ne 'AES-256-CBC' -or $header.mac -ne 'HMAC-SHA256' -or
            $header.iterations -lt 100000 -or $header.iterations -gt 1000000) {
            throw 'Backup archive cryptographic metadata is invalid.'
        }
        $salt = [Convert]::FromBase64String($header.salt)
        $iv = [Convert]::FromBase64String($header.iv)
        if ($salt.Length -ne 16 -or $iv.Length -ne 16) { throw 'Backup archive salt or IV is invalid.' }
        $keys = Get-DerivedKeys $plain $salt ([int]$header.iterations)
        $bodyLength = $archive.Length - 32
        $body = New-Object byte[] $bodyLength
        [Array]::Copy($archive, 0, $body, 0, $bodyLength)
        $expectedTag = New-Object byte[] 32
        [Array]::Copy($archive, $bodyLength, $expectedTag, 0, 32)
        $hmac = [Security.Cryptography.HMACSHA256]::new([byte[]]$keys.Authentication)
        try { $actualTag = $hmac.ComputeHash($body) } finally { $hmac.Dispose() }
        if (-not (Test-FixedTimeEqual $actualTag $expectedTag)) {
            throw 'Backup authentication failed. The passphrase is wrong or the archive was modified.'
        }
        $cipherOffset = 12 + $headerLength
        $cipherLength = $bodyLength - $cipherOffset
        $aes = [Security.Cryptography.Aes]::Create()
        try {
            $aes.KeySize = 256; $aes.Mode = 'CBC'; $aes.Padding = 'PKCS7'
            $aes.Key = [byte[]]$keys.Encryption; $aes.IV = $iv
            $decryptor = $aes.CreateDecryptor()
            try { $zipBytes = $decryptor.TransformFinalBlock($archive, $cipherOffset, $cipherLength) }
            finally { $decryptor.Dispose() }
        } finally { $aes.Dispose() }
        if ((Get-Sha256Hex $zipBytes) -ne $header.archiveSha256) { throw 'Decrypted archive hash does not match.' }
        [IO.File]::WriteAllBytes([IO.Path]::GetFullPath($ZipPath), $zipBytes)
        return $header
    } finally {
        $plain = $null
        if ($archive) { [Array]::Clear($archive, 0, $archive.Length) }
        if ($zipBytes) { [Array]::Clear($zipBytes, 0, $zipBytes.Length) }
    }
}
