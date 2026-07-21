# Sort Manager Frontend

React 19 + Vite 7 frontend for Sort Manager.

```powershell
npm ci
npm run dev
```

The development server defaults to `http://localhost:5173` and proxies `/api` to
`http://localhost:8080`. Copy `.env.example` to `.env` to override `FRONTEND_PORT`,
`BACKEND_URL`, or `VITE_API_BASE` (default `/api/v1`).

The login page authenticates against the shared v1 API. Access tokens live in
`sessionStorage`; rotating refresh tokens live in `localStorage` so the same JSON protocol can
later be used by the mini-program. Keep dependencies audited and do not inject untrusted HTML.
Images are loaded through the authenticated file API rather than the old public `/uploads` path.

Quality gate:

```powershell
npm run verify
```

Real full-stack E2E requires the backend, MySQL, and an OWNER test account:

```powershell
npx playwright install chromium
$env:E2E_API_URL = 'http://127.0.0.1:8080/api/v1'
$env:E2E_USERNAME = 'owner'
$env:E2E_PASSWORD = '<your-local-test-password>'
npm run test:e2e
```

The suite logs in through both the UI and API, covers authenticated item management, OWNER
member management, logout, and a Pixel-sized mobile authentication smoke test. Credentials and
tokens are not written to test output.
