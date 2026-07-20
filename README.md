# Sort Manager

Sort Manager is a private daily item storage management system. It helps track household or office items, categories, storage locations, prices, purchase dates, expiry dates, and item photos.

## Stack

- Backend: Spring Boot 3.3.5, Spring Web, Spring Data JPA, Flyway, Bean Validation, MySQL
- Frontend: React 19, Vite 7, React Router, Axios, Tailwind CSS 4, lucide-react, PWA plugin
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
DB_USERNAME: root
DB_PASSWORD: <your-password>
```

Do not edit `application.yml` for local credentials. Copy `.env.example` to `.env` and
set your own `DB_USERNAME` and `DB_PASSWORD`. `start.bat` loads this file automatically.
For manual backend startup, export the values in the current PowerShell session:

```powershell
$env:DB_USERNAME = 'root'
$env:DB_PASSWORD = '<your-password>'
$env:DB_URL = 'jdbc:mysql://localhost:3306/sort_manager?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false'
```

Vite reads `FRONTEND_PORT` and `BACKEND_URL` from `frontend/.env` when present.

Backend configuration supports these environment variables:

- `SERVER_PORT`
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DRIVER`
- `JPA_DDL_AUTO`, `JPA_SHOW_SQL`, `HIBERNATE_DIALECT`, `FLYWAY_ENABLED`
- `APP_CORS_ALLOWED_ORIGINS`
- `APP_UPLOAD_PATH`, `APP_UPLOAD_URL_PREFIX`, `APP_LOG_LEVEL`

## Setup

Create an empty database and application account. On first backend startup Flyway creates
the tables and records schema version 2. Existing non-empty v1.2 databases are baselined
at version 1 and upgraded without recreating business tables.

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

Combined frontend verification:

```powershell
cd frontend
npm run verify
```

GitHub Actions runs the same quality gates on pushes and pull requests:

- Backend: `mvn clean test`
- Frontend: `npm ci`, `npm audit --audit-level=high`, `npm run lint`, `npm run build`
- Full stack: MySQL 8.4, packaged backend JAR, Vite and three Playwright Chromium flows

## Version Control

Main branch: `main`

Feature work should use isolated branches or worktrees. The v1.1 quality upgrade was developed with the Superpowers workflow in `feature/v1-1-quality-upgrade`.

## Current Scope

Implemented modules:

- Dashboard statistics
- Item CRUD, paginated filtering, image upload, batch delete, batch move
- Category CRUD
- Hierarchical location CRUD
- PWA build output
- Backend validation and upload safety
- GitHub Actions CI
- Portable environment configuration via `.env.example`

Known next steps:

- Add import/export workflows
- Add Docker Compose for one-command local startup
- Add authentication, production profiles and deployment automation

## API Notes

`GET /api/items` returns paginated data in v1.2.0:

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
