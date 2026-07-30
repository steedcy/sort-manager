# Frontend Design System Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current dark-first, page-specific Web styling with one accessible light “家庭档案柜” design system shared by every React page.

**Architecture:** Keep the existing React 19 application, router, API layer, Lucide icons, and business flows. Add a small CSS design-system layer plus focused reusable UI components, remove theme branching and presentational inline styles, then migrate pages in behavior-preserving batches guarded by source-contract, unit, lint, build, and Playwright tests.

**Tech Stack:** React 19, React Router 7, Vite 7, plain CSS, Lucide React, Node test runner, Playwright.

## Global Constraints

- Maintain one light theme only; remove `ThemeContext`, `useTheme`, theme toggles, `data-theme` selectors, and all dark-theme branches.
- Do not change backend APIs, database behavior, authorization, routing, or existing user workflows.
- Do not add a UI library, chart library, font package, or animation dependency.
- Use Lucide for all interface icons; no emoji icons.
- Use a 4/8px spacing rhythm, 8/12/16px radii, semantic color tokens, and 150–220ms state transitions.
- Keep normal body text at 16px on mobile, controls at least 44×44px, and adjacent touch targets at least 8px apart.
- Keep one `h1` per page, sequential heading levels, visible labels, visible focus, text plus icons for semantic states, and `prefers-reduced-motion`.
- Eliminate presentational JSX inline styles. Runtime category colors and percentage widths may only be passed through named CSS custom properties.
- Outside `styles/tokens.css` and the category business palette, JSX and CSS must not hard-code product colors.
- Verify 375, 768, 1024, and 1440px widths, mobile landscape, keyboard use, reduced motion, and no page-level horizontal overflow.

---

### Task 1: Add failing design-system contract tests

**Files:**
- Create: `frontend/src/utils/designSystem.test.js`
- Modify: `frontend/package.json`
- Test: `frontend/src/utils/designSystem.test.js`

**Interfaces:**
- Consumes: the existing `npm run test:unit` Node test command.
- Produces: source-level guardrails that every later task must satisfy.

- [ ] **Step 1: Add a source-contract test that describes the target**

Create `frontend/src/utils/designSystem.test.js` with:

```js
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const frontendRoot = fileURLToPath(new URL('../../', import.meta.url))
const read = (path) => readFileSync(`${frontendRoot}${path}`, 'utf8')

test('the application has one light theme and no theme runtime', () => {
  const app = read('src/App.jsx')
  const sidebar = read('src/components/Sidebar.jsx')
  const styles = read('src/index.css')

  assert.doesNotMatch(app, /ThemeContext|useTheme|data-theme/)
  assert.doesNotMatch(sidebar, /toggle|isDark|Moon|Sun|btn-theme/)
  assert.doesNotMatch(styles, /\[data-theme=|prefers-color-scheme/)
})

test('the design system exposes the required semantic layers', () => {
  const index = read('src/index.css')
  const tokens = read('src/styles/tokens.css')

  for (const layer of ['tokens.css', 'base.css', 'layout.css', 'components.css', 'pages.css']) {
    assert.match(index, new RegExp(layer.replace('.', '\\.')))
  }
  for (const token of [
    '--color-canvas',
    '--color-surface',
    '--color-ink',
    '--color-primary',
    '--color-accent',
    '--color-danger',
    '--space-4',
    '--radius-md',
    '--shadow-card',
    '--motion-fast',
  ]) {
    assert.match(tokens, new RegExp(token))
  }
})

test('page and component JSX avoids presentational inline styles', () => {
  const files = [
    'src/App.jsx',
    'src/components/AppShell.jsx',
    'src/components/EmptyState.jsx',
    'src/components/ImageUpload.jsx',
    'src/components/Modal.jsx',
    'src/components/Sidebar.jsx',
    'src/pages/BulkItems.jsx',
    'src/pages/Categories.jsx',
    'src/pages/Dashboard.jsx',
    'src/pages/Items.jsx',
    'src/pages/Locations.jsx',
    'src/pages/Login.jsx',
    'src/pages/Members.jsx',
    'src/pages/Operations.jsx',
  ]

  const violations = files.filter((file) => /style=\{\{/.test(read(file)))
  assert.deepEqual(violations, [])
})
```

- [ ] **Step 2: Include the new contract in the unit command**

Keep the existing glob in `frontend/package.json`:

```json
"test:unit": "node --test src/utils/*.test.js"
```

No script change is required if the glob already matches the new file.

- [ ] **Step 3: Run the contract test and confirm RED**

Run:

```powershell
cd frontend
npm run test:unit
```

Expected: existing tests pass and the new design-system tests fail because theme runtime, style files, and inline styles still exist.

- [ ] **Step 4: Commit the failing contract**

```powershell
git add frontend/src/utils/designSystem.test.js
git commit -m "test: define frontend design system contracts"
```

### Task 2: Establish the single-theme CSS foundation

**Files:**
- Create: `frontend/src/styles/tokens.css`
- Create: `frontend/src/styles/base.css`
- Create: `frontend/src/styles/layout.css`
- Create: `frontend/src/styles/components.css`
- Create: `frontend/src/styles/pages.css`
- Replace: `frontend/src/index.css`
- Delete: `frontend/src/App.css`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Sidebar.jsx`
- Delete: `frontend/src/context/ThemeContext.jsx`
- Delete: `frontend/src/hooks/useTheme.js`
- Test: `frontend/src/utils/designSystem.test.js`

**Interfaces:**
- Produces: semantic CSS tokens and five style layers imported by `src/index.css`.
- Produces: an `App` and `Sidebar` with no theme state or theme toggle.

- [ ] **Step 1: Define the token source of truth**

Create `src/styles/tokens.css` with one `:root` block. It must define the exact interface below:

```css
:root {
  color-scheme: light;
  --color-canvas: #f3f5f1;
  --color-surface: #ffffff;
  --color-surface-muted: #e9eee8;
  --color-surface-raised: #fbfcfa;
  --color-ink: #17211b;
  --color-ink-secondary: #46534b;
  --color-ink-muted: #69766e;
  --color-primary: #2f6b57;
  --color-primary-hover: #255846;
  --color-primary-soft: #e0eee8;
  --color-on-primary: #ffffff;
  --color-accent: #9a641c;
  --color-accent-soft: #f7ead2;
  --color-success: #2f6b57;
  --color-warning: #9a641c;
  --color-danger: #b42318;
  --color-danger-soft: #fce8e6;
  --color-border: #d9e0d9;
  --color-border-strong: #b9c5bc;
  --color-focus: #1f6feb;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --shadow-card: 0 1px 2px rgb(23 33 27 / 6%), 0 10px 30px rgb(23 33 27 / 5%);
  --shadow-float: 0 18px 45px rgb(23 33 27 / 14%);
  --shadow-modal: 0 30px 80px rgb(23 33 27 / 22%);
  --motion-fast: 160ms;
  --motion-standard: 210ms;
  --ease-standard: cubic-bezier(.2, .8, .2, 1);
  --sidebar-width: 248px;
  --content-width: 1280px;
  --z-sticky: 20;
  --z-nav: 40;
  --z-float: 60;
  --z-overlay: 80;
  --z-modal: 100;
}
```

- [ ] **Step 2: Create the base and import layers**

`src/index.css` must contain only:

```css
@import "tailwindcss";
@import "./styles/tokens.css";
@import "./styles/base.css";
@import "./styles/layout.css";
@import "./styles/components.css";
@import "./styles/pages.css";
```

Move reset, typography, focus, screen-reader-only, scrollbar, reduced-motion, and selection rules into `base.css`. Move `.app-layout`, sidebar, main content, page container, navigation, grid, safe-area, and breakpoint rules into `layout.css`. Move button, input, card, badge, modal, empty-state, skeleton, toolbar, and pagination selectors into `components.css`. Move login, dashboard, item, bulk, location, category, member, and operations selectors into `pages.css`. Preserve selector behavior during this mechanical split; Tasks 3–9 own semantic selector replacement.

- [ ] **Step 3: Remove theme runtime and unused starter CSS**

Update `App.jsx` to render the router directly and use semantic toast classes without `ThemeContext` or `useTheme`. The complete component body becomes:

```jsx
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="items" element={<Items />} />
              <Route path="items/bulk" element={<BulkItems />} />
              <Route path="locations" element={<Locations />} />
              <Route path="categories" element={<Categories />} />
              <Route element={<ProtectedRoute role="OWNER" />}>
                <Route path="members" element={<Members />} />
                <Route path="operations" element={<Operations />} />
              </Route>
              <Route path="*" element={<Dashboard />} />
            </Route>
          </Route>
        </Routes>
        <Toaster position="top-right" toastOptions={{ className: 'app-toast', duration: 4000 }} />
      </AuthProvider>
    </BrowserRouter>
  )
}
```

Remove `Moon`, `Sun`, `useThemeContext`, and the theme button from `Sidebar.jsx`. Delete `ThemeContext.jsx`, `useTheme.js`, and `App.css`.

- [ ] **Step 4: Run the focused contract and lint**

```powershell
npm run test:unit
npm run lint
```

Expected: the theme and token tests pass; the inline-style test remains RED until page migrations finish.

- [ ] **Step 5: Commit the foundation**

```powershell
git add frontend/src frontend/package.json
git commit -m "refactor: establish light frontend design system"
```

### Task 3: Build shared UI primitives

**Files:**
- Create: `frontend/src/components/ui/Button.jsx`
- Create: `frontend/src/components/ui/Card.jsx`
- Create: `frontend/src/components/ui/FormField.jsx`
- Create: `frontend/src/components/ui/PageHeader.jsx`
- Create: `frontend/src/components/ui/Pagination.jsx`
- Create: `frontend/src/components/ui/Skeleton.jsx`
- Create: `frontend/src/components/ui/StatusBadge.jsx`
- Create: `frontend/src/components/ui/Toolbar.jsx`
- Create: `frontend/src/components/ui/index.js`
- Modify: `frontend/src/components/EmptyState.jsx`
- Modify: `frontend/src/components/Modal.jsx`
- Modify: `frontend/src/styles/components.css`
- Test: `frontend/src/utils/designSystem.test.js`

**Interfaces:**
- `Button({ variant, size, loading, icon, className, children, ...buttonProps })`
- `Card({ as, variant, className, children, ...props })`
- `FormField({ id, label, required, hint, error, children })`
- `PageHeader({ icon, eyebrow, title, subtitle, actions })`
- `Pagination({ page, totalPages, totalElements, pageSize, onPageChange, onPageSizeChange })`
- `Skeleton({ variant, className })`
- `StatusBadge({ tone, icon, children })`
- `Toolbar({ children, className })`
- `EmptyState({ icon, title, desc, action })`
- `Modal({ title, children, onClose, onSubmit, loading, wide })`

- [ ] **Step 1: Extend the contract test for component exports**

Add to `designSystem.test.js`:

```js
test('shared UI primitives expose the standard component contract', () => {
  const exports = read('src/components/ui/index.js')
  for (const component of [
    'Button',
    'Card',
    'FormField',
    'PageHeader',
    'Pagination',
    'Skeleton',
    'StatusBadge',
    'Toolbar',
  ]) {
    assert.match(exports, new RegExp(`export \\{ default as ${component} \\}`))
  }
})
```

Run `npm run test:unit` and expect this test to fail because the export file is absent.

- [ ] **Step 2: Implement focused primitives**

Use semantic class composition rather than style objects. `Button` must render:

```jsx
<button
  className={['button', `button--${variant}`, `button--${size}`, className].filter(Boolean).join(' ')}
  disabled={loading || disabled}
  aria-busy={loading || undefined}
  {...props}
>
  {loading ? <LoaderCircle className="button__spinner" aria-hidden="true" /> : icon}
  <span>{children}</span>
</button>
```

`FormField` must connect `aria-describedby` to hint and error IDs. `StatusBadge` must always render children text. `PageHeader` must render one `h1`. `Pagination` must use actual buttons and a labeled native select.

- [ ] **Step 3: Refactor existing EmptyState and Modal**

Replace inline styles with BEM-style classes. Preserve Modal behavior and add:

- `role="dialog"` and `aria-modal="true"`
- Escape close
- initial focus on the close button
- focus return to the previously active element

- [ ] **Step 4: Define all primitive states**

In `components.css`, define default, hover, active, focus-visible, disabled, and loading states. All interactive primitives use `min-height: 44px`; icon buttons use `min-width: 44px`.

- [ ] **Step 5: Run tests and commit**

```powershell
npm run test:unit
npm run lint
git add frontend/src/components frontend/src/styles frontend/src/utils/designSystem.test.js
git commit -m "feat: add shared frontend UI primitives"
```

Expected: primitive contract passes; page inline-style contract remains RED.

### Task 4: Redesign the app shell and login

**Files:**
- Modify: `frontend/src/components/AppShell.jsx`
- Modify: `frontend/src/components/Sidebar.jsx`
- Modify: `frontend/src/components/BottomNav.jsx`
- Modify: `frontend/src/pages/Login.jsx`
- Modify: `frontend/src/styles/layout.css`
- Modify: `frontend/src/styles/pages.css`
- Test: `frontend/e2e/authentication.spec.js`

**Interfaces:**
- Consumes: global tokens and `Button`, `PageHeader`, `FormField`.
- Preserves: route paths, login request, logout, OWNER navigation rules, skip link, and route focus.

- [ ] **Step 1: Add shell and light-theme E2E assertions**

In `authentication.spec.js`, add assertions after login:

```js
await expect(page.locator('html')).not.toHaveAttribute('data-theme')
await expect(page.getByRole('button', { name: /切换.*模式/ })).toHaveCount(0)
await expect(page.locator('.app-shell')).toBeVisible()
```

Add a login-page assertion that the computed body color scheme is light:

```js
expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('light')
```

- [ ] **Step 2: Refactor shell navigation**

Use `.app-shell`, `.app-sidebar`, `.app-main`, `.mobile-account-bar`, and `.bottom-nav` as the stable layout contract. Separate navigation groups for inventory and household administration. Keep logout spatially separate. Use the “收纳标签条” on the brand block rather than a gradient logo.

- [ ] **Step 3: Refactor login markup**

Keep the two regions and all current copy. Replace the dark abstract presentation with:

- `.login-story` using the canvas/surface palette
- `.cabinet-index` as four archive cells
- `.login-form-panel` as the primary surface
- shared `FormField` and `Button`

The mobile order remains form first. Do not add external images or fonts.

- [ ] **Step 4: Verify shell and login**

```powershell
npm run lint
npm run build
npx playwright test e2e/authentication.spec.js
```

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/components frontend/src/pages/Login.jsx frontend/src/styles frontend/e2e/authentication.spec.js
git commit -m "feat: redesign application shell and login"
```

### Task 5: Standardize the dashboard

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx`
- Modify: `frontend/src/styles/pages.css`
- Test: `frontend/e2e/item-management.spec.js`

**Interfaces:**
- Consumes: `PageHeader`, `Card`, `Skeleton`, `StatusBadge`.
- Preserves: dashboard API call and navigation to items, locations, categories, and operations.

- [ ] **Step 1: Add dashboard structure assertions**

In `item-management.spec.js`, assert:

```js
await expect(page.getByRole('heading', { level: 1, name: '收纳总览' })).toBeVisible()
await expect(page.locator('.inventory-summary')).toBeVisible()
await expect(page.locator('.dashboard-grid')).toBeVisible()
```

Run the test and expect RED for the new class contract.

- [ ] **Step 2: Extract stable dashboard sections**

Replace inline styles with:

- `.inventory-summary` and `.summary-card`
- `.expiry-panel` and `.expiry-item`
- `.recent-items` and `.recent-item`
- `.category-distribution` and `.category-meter`

Use `StatusBadge` for normal, expiring, and expired states. Pass category colors through `style={{ '--category-color': value }}` only on `.category-meter`; the contract test must explicitly permit this named custom property and reject other style objects.

- [ ] **Step 3: Verify and commit**

```powershell
npm run test:unit
npm run lint
npx playwright test e2e/item-management.spec.js --grep "仪表盘"
git add frontend/src/pages/Dashboard.jsx frontend/src/styles/pages.css frontend/src/utils/designSystem.test.js frontend/e2e/item-management.spec.js
git commit -m "feat: standardize inventory dashboard"
```

### Task 6: Standardize item management

**Files:**
- Modify: `frontend/src/pages/Items.jsx`
- Modify: `frontend/src/components/ImageUpload.jsx`
- Modify: `frontend/src/styles/components.css`
- Modify: `frontend/src/styles/pages.css`
- Test: `frontend/e2e/item-management.spec.js`

**Interfaces:**
- Consumes: `PageHeader`, `Toolbar`, `Card`, `FormField`, `Button`, `StatusBadge`, `Pagination`, `Skeleton`, `Modal`.
- Preserves: create, edit, search, filter, pagination, selection, soft deletion, image upload, and API payloads.

- [ ] **Step 1: Add item-page contract assertions**

Add assertions for `.item-toolbar`, `.item-grid`, `.item-card`, `.pagination`, and `.batch-action-dock`. Add a mobile assertion that `document.documentElement.scrollWidth <= clientWidth + 1`.

- [ ] **Step 2: Replace page-specific controls**

Use shared header, toolbar, form fields, modal, status badge, pagination, and buttons. Item cards use:

```jsx
<Card
  className={`item-card ${isSelected ? 'item-card--selected' : ''}`}
  data-testid="item-card"
>
```

The selected state uses inset shadow or outline and must not change border width. Image upload uses classes for preview, remove button, drop zone, hint, and loading.

- [ ] **Step 3: Remove presentation styles**

Convert current inline layouts, typography, padding, expiry badges, image sizing, action rows, batch dock, and form grids to CSS classes. Only a dynamic category-color custom property may remain.

- [ ] **Step 4: Verify full item flow and commit**

```powershell
npm run test:unit
npm run lint
npx playwright test e2e/item-management.spec.js
git add frontend/src/pages/Items.jsx frontend/src/components/ImageUpload.jsx frontend/src/styles frontend/src/utils/designSystem.test.js frontend/e2e/item-management.spec.js
git commit -m "feat: unify item management interface"
```

### Task 7: Standardize locations and categories

**Files:**
- Modify: `frontend/src/pages/Locations.jsx`
- Modify: `frontend/src/pages/Categories.jsx`
- Modify: `frontend/src/styles/pages.css`
- Test: `frontend/src/utils/designSystem.test.js`

**Interfaces:**
- Consumes: `PageHeader`, `Card`, `FormField`, `Button`, `Skeleton`, `Modal`, `StatusBadge`.
- Preserves: tree expansion, parent selection, create, edit, delete, icon selection, color selection, and protected-reference errors.

- [ ] **Step 1: Extend the contract for semantic controls**

Add source assertions that location tree action buttons and category color buttons have accessible labels, and that each page imports `PageHeader`.

- [ ] **Step 2: Refactor the location tree**

Create class-based node structure:

```jsx
<div className="location-node">
  <button
    className="location-node__toggle"
    type="button"
    aria-expanded={expanded}
    aria-label={`${expanded ? '收起' : '展开'}位置 ${node.name}`}
    onClick={() => onToggle(node.id)}
  >
    <ChevronRight aria-hidden="true" />
  </button>
  <div className="location-node__identity">
    <span className="location-node__icon" aria-hidden="true"><MapPin /></span>
    <div>
      <strong>{node.name}</strong>
      {node.description && <span>{node.description}</span>}
    </div>
  </div>
  <span className="count-badge">{node.itemCount} 件</span>
  <div className="location-node__actions">
    <Button variant="ghost" size="icon" aria-label={`编辑位置 ${node.name}`} onClick={() => onEdit(node)}>
      <Pencil aria-hidden="true" />
    </Button>
    <Button variant="danger" size="icon" aria-label={`删除位置 ${node.name}`} onClick={() => onDelete(node)}>
      <Trash2 aria-hidden="true" />
    </Button>
  </div>
</div>
```

Use a real button for expansion. Indentation and branch lines belong in CSS.

- [ ] **Step 3: Refactor category cards and palette**

Use `.category-grid`, `.category-card`, `.category-card__identity`, `.category-color`, and `.category-card__actions`. Pass the selected business color through `--category-color`; show its text value beside the swatch.

- [ ] **Step 4: Verify and commit**

```powershell
npm run test:unit
npm run lint
npm run build
git add frontend/src/pages/Locations.jsx frontend/src/pages/Categories.jsx frontend/src/styles/pages.css frontend/src/utils/designSystem.test.js
git commit -m "feat: unify location and category management"
```

### Task 8: Standardize bulk entry

**Files:**
- Modify: `frontend/src/pages/BulkItems.jsx`
- Modify: `frontend/src/components/BulkItemRow.jsx`
- Modify: `frontend/src/styles/pages.css`
- Test: `frontend/e2e/bulk-entry.spec.js`

**Interfaces:**
- Consumes: `PageHeader`, `Card`, `FormField`, `Button`, `StatusBadge`, `Toolbar`.
- Preserves: CSV download/import, paste parsing, row editing, validation-only request, atomic create, and 100-row limit.

- [ ] **Step 1: Add workflow structure assertions**

Assert the page exposes:

```js
await expect(page.locator('.bulk-import-card')).toBeVisible()
await expect(page.locator('.bulk-tray')).toBeVisible()
await expect(page.locator('.bulk-action-dock')).toBeVisible()
```

Keep the existing mobile overflow assertion.

- [ ] **Step 2: Refactor the four-step workflow**

Use archive-label headings for “导入清单”, “待录入物品”, “预检结果”, and “确认入库”. `BulkItemRow` uses `FormField` and `StatusBadge`; validation errors remain adjacent to fields and in the summary.

- [ ] **Step 3: Normalize the mobile action dock**

Reserve bottom space equal to the dock plus safe area. At 375px, actions stack and no field is obscured. At 768px and above, actions remain in one row when space permits.

- [ ] **Step 4: Verify and commit**

```powershell
npm run test:unit
npm run lint
npx playwright test e2e/bulk-entry.spec.js
git add frontend/src/pages/BulkItems.jsx frontend/src/components/BulkItemRow.jsx frontend/src/styles/pages.css frontend/e2e/bulk-entry.spec.js
git commit -m "feat: standardize bulk entry workspace"
```

### Task 9: Standardize members and household operations

**Files:**
- Modify: `frontend/src/pages/Members.jsx`
- Modify: `frontend/src/pages/Operations.jsx`
- Modify: `frontend/src/styles/pages.css`
- Test: `frontend/e2e/authentication.spec.js`
- Test: `frontend/e2e/operations.spec.js`

**Interfaces:**
- Consumes: all shared primitives.
- Preserves: owner checks, create/disable member, session revoke, activity filters, recycle restore, permanent delete, backup status, and pagination.

- [ ] **Step 1: Add semantic structure assertions**

For members, assert `.member-form-card`, `.member-list`, and role/status badges. For operations, assert `.operations-summary`, `.activity-timeline`, and `.recycle-list`. Retain all existing functional assertions.

- [ ] **Step 2: Refactor members**

Use `PageHeader`, `FormField`, `Button`, `StatusBadge`, and `Card`. Desktop table and mobile cards must consume the same role/status copy. Password requirements remain visible helper text. Disable and revoke actions use danger styling and explanatory labels.

- [ ] **Step 3: Refactor operations**

Use shared summary cards and status badges. Keep the activity timeline as the page-specific signature. Replace custom confirmation overlay with the shared Modal contract while preserving alert-dialog semantics for permanent delete.

- [ ] **Step 4: Verify and commit**

```powershell
npm run test:unit
npm run lint
npx playwright test e2e/authentication.spec.js e2e/operations.spec.js
git add frontend/src/pages/Members.jsx frontend/src/pages/Operations.jsx frontend/src/styles/pages.css frontend/e2e
git commit -m "feat: unify household administration views"
```

### Task 10: Complete responsive, accessibility, visual, and review gates

**Files:**
- Modify: `frontend/src/styles/base.css`
- Modify: `frontend/src/styles/layout.css`
- Modify: `frontend/src/styles/components.css`
- Modify: `frontend/src/styles/pages.css`
- Modify: `frontend/e2e/authentication.spec.js`
- Modify: `frontend/e2e/bulk-entry.spec.js`
- Modify: `frontend/e2e/item-management.spec.js`
- Modify: `frontend/e2e/operations.spec.js`
- Create: `docs/superpowers/reviews/2026-07-30-frontend-design-system-code-review.md`

**Interfaces:**
- Consumes: the completed single-theme component and page system.
- Produces: a verified, reviewable frontend release candidate.

- [ ] **Step 1: Add the cross-page viewport matrix**

Add a serial Playwright test that visits `/`, `/items`, `/items/bulk`, `/locations`, `/categories`, `/members`, and `/operations` at 375, 768, 1024, and 1440px. For every route assert:

```js
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
)
expect(overflow).toBeLessThanOrEqual(1)
```

At 375px, assert visible interactive controls have a computed height and width of at least 44px unless they are inline text links.

- [ ] **Step 2: Validate accessibility behavior**

Test the skip link, visible `:focus-visible`, one `h1` per page, modal Escape close, focus return, field error association, mobile navigation count, and reduced-motion media query. Use axe only if already installed; do not add a dependency for this task.

- [ ] **Step 3: Run automated gates**

```powershell
cd frontend
npm audit --audit-level=high
npm run test:unit
npm run lint
npm run build
npm run test:e2e
```

Expected: all commands pass and audit reports zero high-severity vulnerabilities.

- [ ] **Step 4: Perform browser visual QA**

Inspect login and all authenticated pages at 375, 768, 1024, and 1440px. Verify:

- one light theme with no dark remnants
- “家庭档案柜” typography and label signature
- no clipped text, hidden controls, overlap, or horizontal scroll
- consistent buttons, cards, forms, badges, modals, spacing, and icon stroke style
- readable normal, warning, danger, disabled, loading, and empty states
- keyboard focus and reduced-motion behavior

Record before/after screenshots for the login, dashboard, items, and operations pages in the review notes; do not commit transient screenshots.

- [ ] **Step 5: Run code review**

Review the complete diff against:

- `docs/superpowers/specs/2026-07-30-frontend-design-system-refresh-design.md`
- ui-ux-pro-max accessibility, touch, responsive, token, and pre-delivery rules
- awesome-design-skills selected style guidance
- frontend-design subject specificity and restraint

Write `docs/superpowers/reviews/2026-07-30-frontend-design-system-code-review.md` with severity counts, ADR gate, review coverage, verification evidence, and any non-blocking observations. Fix every P0/P1 issue and rerun affected tests.

- [ ] **Step 6: Commit the verified frontend refresh**

```powershell
git add frontend docs/superpowers/reviews/2026-07-30-frontend-design-system-code-review.md
git diff --cached --check
git commit -m "feat: unify frontend design system"
```

- [ ] **Step 7: Finish the branch**

Use `finishing-a-development-branch` to verify the final commit, decide the safe integration path, and push only after the review and all gates pass.
