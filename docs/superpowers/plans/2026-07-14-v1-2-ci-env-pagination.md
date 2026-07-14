# v1.2 CI Environment Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CI, portable environment configuration, and server-backed item pagination/filtering for v1.2.0.

**Architecture:** Keep the existing Spring Boot + React architecture. Add a generic page DTO, extend item repository/service/controller with pageable filtering, and update the item page to consume page metadata. Keep UI changes focused on pagination controls and filter state.

**Tech Stack:** Spring Boot 3.3.5, Spring Data JPA, Bean Validation, MySQL/H2 for tests, React 19, Vite, Axios, GitHub Actions.

## Global Constraints

- Do not introduce a new frontend component library in v1.2.0.
- Keep existing API response envelope `ApiResponse`.
- New backend behavior must have failing tests before implementation.
- CI must run backend tests and frontend lint/build.
- Frontend controls must use semantic buttons and visible disabled states.

---

### Task 1: CI and Portable Environment

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.env.example`
- Create: `backend/src/test/resources/application-test.yml`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/pom.xml`
- Modify: `README.md`

**Interfaces:**
- Produces environment variables consumed by Spring configuration.
- Produces GitHub workflow named `CI`.

- [ ] Add H2 test dependency to `backend/pom.xml`.
- [ ] Add `application-test.yml` with H2 datasource.
- [ ] Convert `application.yml` hardcoded values to environment placeholders.
- [ ] Add `.env.example` documenting backend variables.
- [ ] Add GitHub Actions workflow with backend and frontend jobs.
- [ ] Update README setup and quality gates.
- [ ] Run `mvn clean test` and frontend `npm run lint && npm run build`.

### Task 2: Backend Item Pagination API

**Files:**
- Create: `backend/src/main/java/com/sort/manager/dto/PageResponse.java`
- Create: `backend/src/test/java/com/sort/manager/service/ItemServicePaginationTest.java`
- Modify: `backend/src/main/java/com/sort/manager/repository/ItemRepository.java`
- Modify: `backend/src/main/java/com/sort/manager/service/ItemService.java`
- Modify: `backend/src/main/java/com/sort/manager/controller/ItemController.java`

**Interfaces:**
- Produces `PageResponse<ItemDTO> search(...)`.
- Produces `GET /api/items` paginated response.

- [ ] Write failing service tests for default paging, keyword matching, status filtering, and invalid sort fallback.
- [ ] Verify the new tests fail before implementation.
- [ ] Add `PageResponse<T>`.
- [ ] Add pageable repository query with keyword/category/location/status.
- [ ] Implement `ItemService.search(...)` with page/size bounds and sort allowlist.
- [ ] Update `ItemController.getAll(...)` to return `ApiResponse<PageResponse<ItemDTO>>`.
- [ ] Run targeted pagination tests and full backend tests.

### Task 3: Frontend Item Pagination Experience

**Files:**
- Modify: `frontend/src/api/index.js`
- Modify: `frontend/src/pages/Items.jsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes `itemApi.getAll(params)` returning `PageResponse<ItemDTO>`.
- Adds page, size, sort, direction, and status UI state.

- [ ] Update item API parameter usage as needed.
- [ ] Replace `items` assignment with `pageData.content`.
- [ ] Reset to page 0 when filters change.
- [ ] Add status, sort, direction, and size controls.
- [ ] Add previous/next pagination buttons and page summary.
- [ ] Keep selected items scoped to visible page changes.
- [ ] Run frontend lint and build.

### Task 4: Release and Review

**Files:**
- Create: `docs/releases/v1.2.0.md`

**Interfaces:**
- Produces release notes and GitHub tag `v1.2.0`.

- [ ] Run full backend and frontend verification.
- [ ] Review git diff for bugs, regressions, missing docs, and UI/accessibility concerns.
- [ ] Fix all critical/important findings.
- [ ] Commit changes.
- [ ] Merge to `main`.
- [ ] Tag `v1.2.0`.
- [ ] Push branch/main/tags to GitHub.
