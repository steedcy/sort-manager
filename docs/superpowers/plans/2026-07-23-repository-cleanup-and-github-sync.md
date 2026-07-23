# Repository cleanup and GitHub sync plan

Date: 2026-07-23

## Goal

Remove obsolete and unreferenced repository content, preserve all required development and
recovery assets, verify every maintained application surface, and publish the complete v1.4,
v1.5, and v1.6 branch history to GitHub.

## Scope

1. Inventory tracked, ignored, and untracked files and compare them with code and documentation
   references.
2. Remove one-off database mutation scripts, superseded schema SQL, unused starter assets, and
   unreferenced demo media.
3. Broaden scratch-file exclusion and document the supported repository structure.
4. Retain local credentials, Mini Program private configuration, database backups, PWA assets,
   runtime dependencies, source code, tests, migrations, and operational scripts.
5. Run backend, web, Mini Program, end-to-end, security, and operational verification.
6. Perform the mandatory ADR gate and code review, then commit and push all unreleased branches.

## Acceptance criteria

- Git reports no unintended untracked or modified files.
- No maintained source references a deleted file.
- Backend tests, frontend tests/lint/build, Mini Program checks, Playwright tests, and operational
  tests pass.
- The final review has no open P0 or P1 findings.
- GitHub contains the local v1.4, v1.5, and v1.6 branch heads.
