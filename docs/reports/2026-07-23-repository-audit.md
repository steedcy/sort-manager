# Repository audit report

Date: 2026-07-23

## Result

The maintained repository structure is sound: backend, web, Mini Program, database migrations,
operational tooling, automated tests, and project documentation are separated clearly. No
architecture change or dependency replacement is required for this cleanup.

## Removed content

- Four root-level, one-off database mutation scripts that embedded record identifiers or access
  tokens and were neither documented nor tested.
- A pre-Flyway manual `ALTER TABLE` script superseded by versioned migrations.
- Unreferenced Vite starter assets, an unused hero image, and an unused SVG symbol sheet.
- Demo item photographs referenced only by the removed one-off image assignment script.
- Three untracked candidate SVG assets and a local desktop capture with no application references.
- Ignored build output, test reports, caches, and scratch artifacts after verification.

## Explicitly retained

- `.env` and Mini Program private configuration, which are required locally and remain ignored.
- `.codex/backups`, which contains local pre-upgrade MySQL recovery points and remains ignored.
- `frontend/node_modules`, which is the installed development dependency tree.
- Both PWA icon sizes, the favicon, all source assets with live references, uploads placeholders,
  Flyway migrations, tests, and supported scripts under `ops/`.

## Improvements

- The complete `scratch/` directory and desktop capture filename are now ignored.
- The README documents repository ownership boundaries and the rule that reusable maintenance
  utilities belong under `ops/`.
- This audit and its verification review provide a traceable basis for the cleanup.

## Architecture decision record gate

The changes remove dead repository content and refine ignore/documentation rules. They do not
change service boundaries, data models, security posture, deployment topology, or technology
choices, so no new ADR is required. Existing ADRs remain authoritative.
