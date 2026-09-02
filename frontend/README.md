# Sort Manager Frontend

React 19 + Vite 7 frontend for Sort Manager. Current version: v1.9.0.

```powershell
npm ci
npm run dev
```

The development server defaults to `http://localhost:5173` and proxies `/api` to
`http://localhost:8080`. Copy `.env.example` to `.env` to override `FRONTEND_PORT`,
`BACKEND_URL`, or `VITE_API_BASE` (default `/api/v1`).

The login page authenticates against the shared v1 API. Access tokens live in
`sessionStorage`; rotating refresh tokens live in `localStorage`. Keep dependencies audited and do not inject untrusted HTML.
Images are loaded through the authenticated file API rather than the old public `/uploads` path.

Mobile camera barcode scanning requires the app to be served from a trusted HTTPS origin. HTTP LAN IP addresses are not secure contexts and browsers will not expose the camera API.

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
member and session management, logout, bulk preview/atomic commit, recycle-bin recovery and
permanent deletion, and 375 px mobile workflows. Credentials and tokens are not written to test
output.

The bulk workspace is available at `/items/bulk`; it accepts pasted Excel/WPS tables or UTF-8
CSV files and keeps an in-tab draft until commit or logout. The OWNER-only `/operations` workspace
shows the household protection summary, paginated activity tape, and recycle bin. On mobile it is
opened from the dashboard protection card instead of adding another bottom-navigation item.
