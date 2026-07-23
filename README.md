# Sort Manager

Sort Manager is a private daily item storage management system. It helps track household or office items, categories, storage locations, prices, purchase dates, expiry dates, and item photos.

## Stack

- Backend: Spring Boot 3.3.5, Spring Security, Spring Web, Spring Data JPA, Flyway, Bean Validation, MySQL
- Frontend: React 19, Vite 7, React Router, Axios, Tailwind CSS 4, lucide-react, PWA plugin
- Mini program: native WeChat Mini Program (JavaScript, WXML, WXSS)
- Database: MySQL 8.4
- Runtime: JDK 21+ or JDK 26 installed locally, compiling Java release 17 bytecode

## Requirements

- JDK 17 or newer with `JAVA_HOME` configured (the project compiles Java 17 bytecode)
- Maven 3.9+
- Node.js `>=20.19.0`
- npm 10+
- MySQL 8.4
- Git

The backend uses environment variables:

```yaml
DB_URL: jdbc:mysql://localhost:3306/sort_manager
DB_USERNAME: sort_manager_app
DB_PASSWORD: <your-password>
```

Do not edit `application.yml` for local credentials. Copy `.env.example` to `.env` and
set your own `DB_USERNAME` and `DB_PASSWORD`. `start.bat` loads this file automatically.
For manual backend startup, export the values in the current PowerShell session:

```powershell
$env:DB_USERNAME = 'sort_manager_app'
$env:DB_PASSWORD = '<your-password>'
$env:DB_URL = 'jdbc:mysql://localhost:3306/sort_manager?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false'
```

Vite reads `FRONTEND_PORT` and `BACKEND_URL` from `frontend/.env` when present.

Backend configuration supports these environment variables:

- `SERVER_PORT`
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DRIVER`
- `JPA_DDL_AUTO`, `JPA_SHOW_SQL`, `HIBERNATE_DIALECT`, `FLYWAY_ENABLED`, `FLYWAY_BASELINE_ON_MIGRATE`
- `APP_CORS_ALLOWED_ORIGINS`
- `APP_UPLOAD_PATH`, `APP_LOG_LEVEL`
- `APP_JWT_SECRET`, `APP_JWT_ACCESS_TTL_SECONDS`, `APP_REFRESH_TTL_DAYS`
- `APP_LOGIN_MAX_ATTEMPTS`, `APP_LOGIN_BLOCK_SECONDS`, `APP_LOGIN_MAX_TRACKED_ATTEMPTS`
- `APP_BOOTSTRAP_USERNAME`, `APP_BOOTSTRAP_PASSWORD`, `APP_BOOTSTRAP_DISPLAY_NAME`, `APP_BOOTSTRAP_HOUSEHOLD_NAME`
- `APP_BACKUP_STATUS_PATH`, `APP_BACKUP_STALE_AFTER_HOURS`

## Setup

Create an empty database and a least-privilege application account. On first backend startup
Flyway migrates the schema to v5; V3 assigns v1.3 data to the default household, V4 aligns
refresh-token column types with Hibernate, and V5 adds soft deletion plus append-only audit data.
Back up a populated database before
the upgrade: MySQL DDL is not transactionally rolled back, so recovery means restoring that backup.

v1.4 requires a random JWT secret of at least 32 bytes. Generate one locally and store it only
in the ignored `.env` file. Also set the `APP_BOOTSTRAP_*` values for the first OWNER. The
bootstrap password is used only when no application user exists and must never be committed or
printed in logs. Keep `FLYWAY_BASELINE_ON_MIGRATE=false` for a v1.3 database that already has
Flyway history; only enable it deliberately when taking over a verified legacy v1.2 database.

```powershell
$bytes = New-Object byte[] 48
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
[Convert]::ToBase64String($bytes)
```

`database/init.sql` is optional sample data and must only be run after Flyway migration:

```powershell
$env:MYSQL_PWD = $env:DB_PASSWORD
cmd /c "mysql --default-character-set=utf8mb4 --user=%DB_USERNAME% < database\init.sql"
Remove-Item Env:MYSQL_PWD
```

Install frontend dependencies:

```powershell
cd frontend
npm ci
```

## Development

Start both services:

```powershell
.\start.bat
```

Manual startup:

```powershell
cd backend
mvn package -DskipTests
java -jar target/manager.jar
```

The packaged JAR startup is used because the Spring Boot 3.3 Maven `run` goal can
lose non-ASCII classpath entries when used with newer JDKs on Windows.

```powershell
cd frontend
npm run dev
```

Default URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

If Maven Central is unavailable on the current network, the repository-level
`backend/.mvn/settings.xml` automatically uses the Aliyun public mirror for Central artifacts.

## Quality Gates

Backend:

```powershell
cd backend
mvn clean test
```

Frontend:

```powershell
cd frontend
npm run lint
npm run build
npm run test:e2e
```

Mini program:

```powershell
cd miniapp
npm test
npm run check
```

Encrypted backup and recovery scripts:

```powershell
./ops/tests/syntax-check.ps1
./ops/tests/backup-roundtrip.tests.ps1
```

Combined frontend verification:

```powershell
cd frontend
npm run verify
```

GitHub Actions runs the same quality gates on pushes and pull requests:

- Backend: `mvn clean test`
- Frontend: `npm ci`, `npm audit --audit-level=high`, `npm run lint`, `npm run build`
- Full stack: MySQL 8.4, packaged backend JAR, authenticated API readiness, Vite, desktop Chromium flows and a mobile login smoke test
- Mini program: request/auth utility tests and JavaScript syntax checks
- Operations: PowerShell syntax, encrypted round-trip, tamper rejection and verify-only recovery

## Version Control

Main branch: `main`

Feature work should use isolated branches or worktrees. The v1.1 quality upgrade was developed with the Superpowers workflow in `feature/v1-1-quality-upgrade`.

The sanitized project conversation and engineering timeline is maintained in
[`docs/history/project-conversation-and-development-history.md`](docs/history/project-conversation-and-development-history.md).

## Current Scope

Implemented modules:

- Dashboard statistics
- Item CRUD, paginated filtering, image upload, batch delete, batch move
- Atomic bulk item validation/import (up to 100 rows) and the Web intake-tray workflow
- Category CRUD
- Hierarchical location CRUD
- Family OWNER/MEMBER accounts, login, refresh rotation and member enable/disable
- Household-scoped business data and authenticated image access
- PWA build output
- Native WeChat Mini Program foundation for login, dashboard, search and quick entry
- Item recycle bin, household activity audit, member session revocation and OWNER operations summary
- Authenticated encrypted MySQL/upload backups with verify-first recovery tooling
- Backend validation and upload safety
- GitHub Actions CI
- Portable environment configuration via `.env.example`

Known next steps:

- Add export, `.xlsx`, barcode/OCR and batch image workflows
- Add WeChat login, offline cache and Mini Program automated UI tests
- Add Docker Compose for one-command local startup
- Add off-host backup replication, retention automation and restore drills

## API Notes

All business APIs are under `/api/v1` and require `Authorization: Bearer <access-token>`.
Authenticate with `POST /api/v1/auth/login`; use the one-time refresh token with
`POST /api/v1/auth/refresh`, and revoke it with `POST /api/v1/auth/logout`. Logout accepts the
refresh token even when the access token has expired.

`GET /api/v1/items` returns paginated data:

```json
{
  "success": true,
  "data": {
    "content": [],
    "page": 0,
    "size": 12,
    "totalElements": 0,
    "totalPages": 0,
    "first": true,
    "last": true,
    "empty": true
  }
}
```

This replaces the older raw list response for the item list endpoint. Supported query parameters are `keyword`, `categoryId`, `locationId`, `status`, `page`, `size`, `sort`, and `direction`.

`POST /api/v1/items/batch` accepts up to 100 rows. Send `validateOnly: true` first to receive
per-row `fieldErrors`; send the same valid rows with `validateOnly: false` to commit them in one
transaction. If any row is invalid, `createdCount` remains zero.

## WeChat Mini Program

Copy `miniapp/config.example.js` to the ignored `miniapp/config.js`, set the HTTPS `/api/v1`
address, then import `miniapp/` into WeChat Developer Tools with your own AppID. The API host
must be registered as a request domain in the WeChat public platform. See
[`miniapp/README.md`](miniapp/README.md) for local checks and security notes.

OWNER accounts also see a compact household protection summary on the profile page. MEMBER accounts
do not request the protected operations endpoint, and the Mini Program keeps the existing four tabs.

## Production deployment

Expose the application only through an HTTPS reverse proxy. Configure an exact
`APP_CORS_ALLOWED_ORIGINS` list, keep the database port private, run MySQL with a non-root
application account, and persist both the database and `APP_UPLOAD_PATH` in the backup plan.
The public readiness endpoint is `/api/v1/health`; business data and files remain authenticated.
At the HTTPS reverse proxy, set a production Content-Security-Policy equivalent to the frontend policy
and include `frame-ancestors 'none'`; keep production `connect-src` limited to the deployed origin.
Configure encrypted backups and rehearse verify-first recovery using
[`ops/README.md`](ops/README.md). Keep archive storage, the passphrase secret, and the non-sensitive
status JSON in separate locations.
