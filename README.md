# Sort Manager

Sort Manager is a private daily item storage management system. It helps track household or office items, categories, storage locations, prices, purchase dates, expiry dates, and item photos.

## Stack

- Backend: Spring Boot 3.3.5, Spring Web, Spring Data JPA, Bean Validation, MySQL
- Frontend: React 19, Vite 5, React Router, Axios, Tailwind CSS 4, lucide-react, PWA plugin
- Database: MySQL 8.4
- Runtime: JDK 26 installed locally, compiling Java release 17 bytecode

## Requirements

- JDK 26 with `JAVA_HOME` configured
- Maven 3.9+
- Node.js `>=20.19.0`
- npm 10+
- MySQL 8.4
- Git

The current backend datasource expects:

```yaml
url: jdbc:mysql://localhost:3306/sort_manager
username: root
password: root123
```

Adjust `backend/src/main/resources/application.yml` if your local MySQL credentials differ.

## Setup

Create or initialize the database:

```powershell
mysql -uroot -proot123 < database/init.sql
```

Install frontend dependencies:

```powershell
cd frontend
npm install
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

## Version Control

Main branch: `main`

Feature work should use isolated branches or worktrees. The v1.1 quality upgrade was developed with the Superpowers workflow in `feature/v1-1-quality-upgrade`.

## Current Scope

Implemented modules:

- Dashboard statistics
- Item CRUD, filtering, image upload, batch delete, batch move
- Category CRUD
- Hierarchical location CRUD
- PWA build output
- Backend validation and upload safety

Known next steps:

- Add browser-level end-to-end tests
- Add pagination for larger item collections
- Add import/export workflows
- Replace local database credentials with environment variables for deployment
