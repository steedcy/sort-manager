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

  const violations = files.filter((file) => {
    const styleObjects = read(file).match(/style=\{\{[\s\S]*?\}\}/g) || []
    return styleObjects.some((styleObject) => !/style=\{\{\s*'--[\w-]+'\s*:/.test(styleObject))
  })
  assert.deepEqual(violations, [])
})

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

test('passive notifications do not block page actions', () => {
  const components = read('src/styles/components.css')
  assert.match(components, /\.app-toast\s*\{[\s\S]*?pointer-events:\s*none;/)
})
