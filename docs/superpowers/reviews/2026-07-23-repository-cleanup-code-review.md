# Repository cleanup code review

Date: 2026-07-23
Branch: `codex/v1-6-data-protection-operations`

## Decision

**PASS**

- P0 findings: 0
- P1 findings: 0
- P2 findings: 0
- P3 findings: 0

## ADR gate

No ADR is required. The patch removes dead files, clarifies repository ownership, extends ignore
rules, and stabilizes an existing end-to-end assertion. It does not alter architecture, persistence
semantics, authentication, API contracts, deployment topology, or technology selection.

## Review coverage

- Confirmed every removed source asset and demo image has no maintained code reference.
- Confirmed the deleted root scripts were environment-specific, untested data mutation utilities
  superseded by maintained application and operational flows.
- Confirmed the deleted schema script is superseded by Flyway migrations V1 through V5.
- Confirmed local credentials, Mini Program private configuration, recovery backups, runtime
  dependencies, required PWA assets, and upload placeholders remain intact and ignored as intended.
- Reviewed the Playwright change for deterministic waiting: the assertion now waits for the
  filtered activity list to contain exactly one matching deletion event before checking visibility.
- Scanned added lines for common access-token, private-key, and bearer-token signatures; none found.
- `git diff --check` reports no whitespace errors.

## Verification

- Backend: `mvn test` — 63 passed.
- Frontend unit tests: `npm run test:unit` — 13 passed.
- Frontend lint: `npm run lint` — passed after the Playwright adjustment.
- Frontend production build: `npm run build` — passed.
- Frontend dependency audit: `npm audit --audit-level=high` — 0 vulnerabilities.
- Mini Program: `npm test` — 13 passed.
- Operations syntax: `ops/tests/syntax-check.ps1` — 5 scripts passed.
- Backup/recovery: `ops/tests/backup-roundtrip.tests.ps1` — encrypted round-trip, verify-only,
  tamper rejection, and plaintext cleanup passed.
- Full-stack Playwright against an isolated MySQL database: 11 passed across desktop and mobile.

The first Playwright attempt used the already-running personal instance and failed authentication
because its current password intentionally differs from the test default. An isolated database and
temporary service pair were then used; all tests passed, and the temporary services and database
were removed afterward without modifying personal application data.

## Non-blocking observations

- Java 26 emits forward-compatibility warnings for test instrumentation and native access in some
  current dependencies.
- Node.js emits a Vite ecosystem deprecation warning for `module.register()`.

These warnings are upstream compatibility signals rather than defects in this patch. They should be
revisited during a planned dependency upgrade instead of changing stable dependencies during a
repository cleanup.
