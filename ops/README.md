# Encrypted backup and recovery

The v1.6 scripts protect the MySQL dump and upload directory as one authenticated archive. The
archive uses PBKDF2-SHA256 (210,000 iterations), AES-256-CBC, and encrypt-then-MAC with
HMAC-SHA256. Its authenticated header contains the salt, IV, algorithm identifiers, and the SHA-256
of the compressed payload. `manifest.json` records the size and SHA-256 of every database/upload
file. Plaintext working files are always removed in `finally`.

## Create a backup

Set the password only in the process environment or pass a `SecureString`; do not put it in a command
line, task definition, repository file, or the same directory as the archives.

```powershell
$env:BACKUP_PASSPHRASE = '<a unique password of at least 12 characters>'
$env:DB_PASSWORD = '<database password>'
./ops/backup.ps1 `
  -OutputDirectory 'D:\sort-manager-backups' `
  -StatusPath 'D:\sort-manager-state\backup-status.json' `
  -UploadsPath 'D:\sort-manager\uploads' `
  -DatabaseName 'sort_manager' `
  -DatabaseUser 'sort_manager_backup'
Remove-Item Env:BACKUP_PASSPHRASE, Env:DB_PASSWORD
```

Use a dedicated MySQL backup account with only the permissions required by `mysqldump`. Schedule the
script with Windows Task Scheduler under a restricted service account. Retain multiple generations
on a different physical disk or host. Configure the backend with the status JSON path, not the archive
directory; the API never receives the passphrase and never restores data.

## Verify and restore

Verification is the default and does not invoke `mysql`:

```powershell
$env:BACKUP_PASSPHRASE = '<backup password>'
./ops/restore-backup.ps1 -ArchivePath 'D:\sort-manager-backups\sort-manager-20260721-020000.smbak'
```

The script authenticates the encrypted envelope before decryption, rejects unsafe ZIP paths, then
checks every declared file size/hash and rejects undeclared files. To perform a recovery, first create
an empty isolated database and explicitly opt in:

```powershell
$env:DB_PASSWORD = '<restore account password>'
./ops/restore-backup.ps1 `
  -ArchivePath 'D:\sort-manager-backups\sort-manager-20260721-020000.smbak' `
  -Apply `
  -TargetDatabase 'sort_manager_restore_validation' `
  -TargetUploadsPath 'D:\sort-manager-restore-validation\uploads' `
  -DatabaseUser 'sort_manager_restore'
```

The script refuses to apply over the source database recorded in the manifest and requires a new or
empty isolated upload directory. After restoring,
start a temporary backend against the isolated database, run Flyway validation, compare household,
member, item and audit counts, verify several uploaded images, and exercise login/read flows. Only
after those checks should an operator plan a separately approved production cutover.

## Automated checks

```powershell
./ops/tests/syntax-check.ps1
./ops/tests/backup-roundtrip.tests.ps1
```

The tests use a fixture SQL file rather than a database. They prove encrypted round-trip,
verify-only behavior, tamper rejection, status-file compatibility, and plaintext cleanup.
