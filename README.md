# Sort Manager

Sort Manager is a private daily item storage management system. It helps track household or office items, categories, storage locations, prices, purchase dates, expiry dates, and item photos.

## Stack

- Backend: Spring Boot 3.3.5, Spring Web, Spring Data JPA, Bean Validation, MySQL
- Frontend: React 19, Vite 5, React Router, Axios, Tailwind CSS 4, lucide-react, PWA plugin
- Database: MySQL 8.4
- Runtime: JDK 21+ or JDK 26 installed locally, compiling Java release 17 bytecode

## Requirements

- JDK 26 with `JAVA_HOME` configured
- Maven 3.9+
- Node.js `>=20.19.0`
- npm 10+
- MySQL 8.4
- Git

The current backend datasource defaults to:

```yaml
url: jdbc:mysql://localhost:3306/sort_manager
username: root
password: root123
```

Copy values from `.env.example` into your shell or local environment if your MySQL credentials differ. The most common values are:

```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="root123"
$env:APP_UPLOAD_PATH="uploads/"
```

Backend configuration supports these environment variables:

- `SERVER_PORT`
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DRIVER`
- `JPA_DDL_AUTO`, `JPA_SHOW_SQL`, `HIBERNATE_DIALECT`
- `APP_UPLOAD_PATH`, `APP_UPLOAD_URL_PREFIX`, `APP_LOG_LEVEL`

## Setup

Create or initialize the database:

```powershell
mysql -uroot -proot123 < database/init.sql
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
mvn spring-boot:run
```

```powershell
cd frontend
npm run dev
```

Default URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

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
```

Combined frontend verification:

```powershell
cd frontend
npm run verify
```

GitHub Actions runs the same quality gates on pushes and pull requests:

- Backend: `mvn clean test`
- Frontend: `npm ci`, `npm run lint`, `npm run build`

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

- Add browser-level end-to-end tests
- Add import/export workflows
- Add Docker Compose for one-command local startup

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
