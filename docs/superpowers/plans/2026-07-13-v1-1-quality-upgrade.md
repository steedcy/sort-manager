# V1.1 Quality Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a v1.1 release that makes the item manager cleanly verifiable, safer at the API boundary, and easier to run and maintain.

**Architecture:** Keep the current Spring Boot + React/Vite split. Strengthen the backend at DTO validation, domain validation, and error responses; strengthen the frontend by clearing lint, isolating shared context, and documenting expected runtime versions. Avoid broad rewrites and preserve the existing user flows.

**Tech Stack:** Spring Boot 3.3.5, Java 17 bytecode on JDK 26, MySQL 8.4, React 19, Vite 5, ESLint 10, Axios, lucide-react.

## Global Constraints

- Work on branch `feature/v1-1-quality-upgrade` in `.worktrees/v1-1-quality-upgrade`.
- Keep `main` releasable; merge only after verification.
- Maintain existing API paths unless a new helper endpoint is additive.
- Do not commit `frontend/node_modules`, `frontend/dist`, `backend/target`, or uploaded runtime files.
- Use fresh verification before every completion claim: `mvn clean test`, `npm run build`, and `npm run lint`.
- Commit in coherent slices and push the feature branch when complete.

---

## File Structure

- `backend/pom.xml`: add validation dependency if needed.
- `backend/src/main/java/com/sort/manager/dto/*.java`: add Bean Validation annotations for request DTOs.
- `backend/src/main/java/com/sort/manager/config/GlobalExceptionHandler.java`: return 400 for validation errors and 404 for missing resources.
- `backend/src/main/java/com/sort/manager/service/*.java`: enforce uniqueness, relationship integrity, and cycle prevention.
- `backend/src/main/java/com/sort/manager/controller/*.java`: apply `@Valid` to request bodies.
- `backend/src/test/java/com/sort/manager/...`: add focused unit tests for validation-sensitive service behavior.
- `frontend/src/context/ThemeContext.jsx`: move React context out of `App.jsx`.
- `frontend/src/App.jsx`, `frontend/src/components/*.jsx`, `frontend/src/pages/*.jsx`: clear lint errors and fix hook loading patterns.
- `frontend/package.json`: document required Node engine and add a combined verify script.
- `README.md`: create project-level setup and release notes.
- `docs/superpowers/plans/2026-07-13-v1-1-quality-upgrade.md`: this plan.

---

### Task 1: Frontend Lint Gate

**Files:**
- Create: `frontend/src/context/ThemeContext.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Sidebar.jsx`
- Modify: `frontend/src/components/ImageUpload.jsx`
- Modify: `frontend/src/pages/Categories.jsx`
- Modify: `frontend/src/pages/Dashboard.jsx`
- Modify: `frontend/src/pages/Items.jsx`
- Modify: `frontend/src/pages/Locations.jsx`
- Modify: `frontend/package.json`

**Interfaces:**
- Produces: `ThemeContext` and `useThemeContext()` exported from `frontend/src/context/ThemeContext.jsx`.
- Consumes: existing `useTheme()` hook and existing page/component props.

- [ ] **Step 1: Verify RED lint baseline**

Run: `npm run lint` from `frontend/`.
Expected: FAIL with the existing 8 ESLint errors.

- [ ] **Step 2: Move theme context out of App**

Create `frontend/src/context/ThemeContext.jsx`:

```jsx
import { createContext, useContext } from 'react'

export const ThemeContext = createContext({ theme: 'dark', toggle: () => {}, isDark: true })

export const useThemeContext = () => useContext(ThemeContext)
```

Update `frontend/src/App.jsx` to import `ThemeContext` from the new file and stop exporting non-component values.

- [ ] **Step 3: Remove unused variables and imports**

In `Sidebar.jsx`, destructure only `toggle` and `isDark`.
In `ImageUpload.jsx`, change `catch (e)` to `catch`.
In `Dashboard.jsx`, remove unused `AlertCircle`.

- [ ] **Step 4: Replace effect loader pattern with linter-compatible async effects**

In `Categories.jsx`, `Items.jsx`, and `Locations.jsx`, call async work inside `useEffect` without synchronously calling a function that sets state in the effect body. Use a local `cancelled` flag and only update state if still mounted.

- [ ] **Step 5: Add Node engine and verify script**

Update `frontend/package.json`:

```json
"engines": {
  "node": ">=20.19.0"
},
"scripts": {
  "verify": "npm run lint && npm run build"
}
```

Preserve the existing scripts.

- [ ] **Step 6: Verify GREEN frontend gate**

Run: `npm run lint` and `npm run build` from `frontend/`.
Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
git add frontend
git commit -m "fix: clear frontend lint gate"
```

---

### Task 2: Backend Validation and Domain Safety

**Files:**
- Modify: `backend/pom.xml`
- Modify: `backend/src/main/java/com/sort/manager/dto/CategoryDTO.java`
- Modify: `backend/src/main/java/com/sort/manager/dto/ItemDTO.java`
- Modify: `backend/src/main/java/com/sort/manager/dto/LocationDTO.java`
- Modify: `backend/src/main/java/com/sort/manager/config/GlobalExceptionHandler.java`
- Modify: `backend/src/main/java/com/sort/manager/controller/CategoryController.java`
- Modify: `backend/src/main/java/com/sort/manager/controller/ItemController.java`
- Modify: `backend/src/main/java/com/sort/manager/controller/LocationController.java`
- Modify: `backend/src/main/java/com/sort/manager/service/CategoryService.java`
- Modify: `backend/src/main/java/com/sort/manager/service/ItemService.java`
- Modify: `backend/src/main/java/com/sort/manager/service/LocationService.java`
- Test: `backend/src/test/java/com/sort/manager/service/CategoryServiceTest.java`
- Test: `backend/src/test/java/com/sort/manager/service/LocationServiceTest.java`
- Test: `backend/src/test/java/com/sort/manager/service/ItemServiceTest.java`

**Interfaces:**
- Produces: predictable validation errors via `ApiResponse.fail(message)`.
- Produces: domain checks for duplicate category names, missing references, invalid quantities/prices, and location parent cycles.

- [ ] **Step 1: Write failing service tests**

Create tests that assert:
- creating duplicate category names throws `IllegalArgumentException`;
- updating a location to use itself as parent throws `IllegalArgumentException`;
- creating an item with a missing category id throws `IllegalArgumentException`;
- creating an item with quantity less than 1 throws `IllegalArgumentException`.

Run: `mvn test`.
Expected: FAIL because validation has not been implemented.

- [ ] **Step 2: Add Spring validation dependency and DTO constraints**

Add `spring-boot-starter-validation` to `backend/pom.xml`.
Add `@NotBlank`, `@Size`, `@Min`, and `@DecimalMin` annotations to request-bearing DTO fields.

- [ ] **Step 3: Add controller validation**

Add `@Valid` to create/update request bodies in category, item, and location controllers.

- [ ] **Step 4: Add global validation error handling**

Handle `MethodArgumentNotValidException` and `IllegalArgumentException` with HTTP 400.
Handle `NoSuchElementException` with HTTP 404.
Keep the generic exception handler for HTTP 500.

- [ ] **Step 5: Implement service domain checks**

Category:
- reject blank names;
- reject duplicate names on create;
- reject duplicate names owned by a different category on update.

Location:
- reject missing parent ids;
- reject parent id equal to current id;
- reject moving a location under its descendant.

Item:
- reject quantity less than 1;
- reject negative price;
- reject missing category/location references when ids are supplied.

- [ ] **Step 6: Verify GREEN backend gate**

Run: `mvn clean test`.
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add backend
git commit -m "feat: harden backend validation"
```

---

### Task 3: Upload Safety and API Polish

**Files:**
- Modify: `backend/src/main/java/com/sort/manager/controller/FileUploadController.java`
- Test: `backend/src/test/java/com/sort/manager/controller/FileUploadControllerTest.java`

**Interfaces:**
- Produces: upload endpoint rejects empty files, non-image MIME types, and unsupported extensions.
- Produces: upload filenames remain UUID-based and do not trust the original filename.

- [ ] **Step 1: Write failing upload controller tests**

Use `MockMultipartFile` to verify:
- empty upload returns failure;
- `text/plain` upload returns failure;
- `image/png` upload returns success shape with `url` and `filename`.

Run: `mvn test`.
Expected: FAIL for MIME validation until implemented.

- [ ] **Step 2: Add upload validation**

Allow only `image/jpeg`, `image/png`, `image/gif`, and `image/webp`.
Allow only `.jpg`, `.jpeg`, `.png`, `.gif`, and `.webp`.

- [ ] **Step 3: Verify GREEN upload gate**

Run: `mvn clean test`.
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add backend
git commit -m "feat: validate uploaded images"
```

---

### Task 4: Project Documentation and Release Metadata

**Files:**
- Create: `README.md`
- Create: `docs/releases/v1.1.0.md`
- Modify: `start.bat`

**Interfaces:**
- Produces: setup instructions for JDK, Maven, Node, MySQL, database initialization, and one-click startup.
- Produces: release notes describing quality gates and known remaining work.

- [ ] **Step 1: Create README**

Document:
- project purpose;
- backend and frontend stack;
- required versions: JDK 26 with Java 17 release target, Node `>=20.19.0`, MySQL 8.4;
- database credentials expected by `application.yml`;
- commands: `mvn clean test`, `npm run lint`, `npm run build`, `start.bat`.

- [ ] **Step 2: Create v1.1 release notes**

Document:
- lint gate fixed;
- backend validation added;
- upload validation added;
- Superpowers workflow installed and used;
- remaining known issue: no end-to-end browser tests yet.

- [ ] **Step 3: Improve start.bat preflight**

Add simple checks that `java`, `mvn`, `node`, `npm`, and `mysql` are on PATH before launching services.

- [ ] **Step 4: Verify docs/startup changes**

Run: `cmd /c start.bat` is not used because it launches interactive windows. Instead run:

```powershell
java -version
mvn -version
node -v
npm -v
mysql --version
```

Expected: each command prints a version.

- [ ] **Step 5: Commit**

```bash
git add README.md docs start.bat
git commit -m "docs: document v1.1 setup and release"
```

---

### Task 5: Final Verification and Publishing

**Files:**
- No new source files required.

**Interfaces:**
- Produces: feature branch pushed to GitHub.
- Produces: clean working tree after commit.

- [ ] **Step 1: Run full verification**

Run:

```powershell
cd backend; mvn clean test
cd ..\frontend; npm run lint; npm run build
cd ..
git status --short --branch
```

Expected:
- Maven exits 0;
- lint exits 0;
- build exits 0;
- only ignored build/dependency folders are untracked/ignored.

- [ ] **Step 2: Push branch**

```bash
git push -u origin feature/v1-1-quality-upgrade
```

- [ ] **Step 3: Merge to main after verification**

Because the user requested autonomous development and GitHub upload, merge the verified branch locally:

```bash
git checkout main
git pull
git merge --no-ff feature/v1-1-quality-upgrade
git push origin main
```

- [ ] **Step 4: Tag release**

```bash
git tag v1.1.0
git push origin v1.1.0
```

---

## Self-Review

- Spec coverage: plan covers Superpowers installation/use, project quality gates, frontend lint, backend safety, docs, version control, and GitHub upload.
- Placeholder scan: no TBD/TODO placeholders are used.
- Type consistency: frontend context exports and backend exception types are defined before use.
