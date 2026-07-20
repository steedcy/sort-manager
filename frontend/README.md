# Sort Manager Frontend

React 19 + Vite 7 frontend for Sort Manager.

```powershell
npm ci
npm run dev
```

The development server defaults to `http://localhost:5173` and proxies `/api` and
`/uploads` to `http://localhost:8080`. Copy `.env.example` to `.env` to override
`FRONTEND_PORT` or `BACKEND_URL`.

Quality gate:

```powershell
npm run verify
```

Real full-stack E2E (requires the backend and MySQL to be running):

```powershell
npx playwright install chromium
npm run test:e2e
```
