const test = require('node:test')
const assert = require('node:assert/strict')

const { formatBackupState, formatProtectionSummary, shouldLoadOperations } = require('../utils/operations')

test('only owners load the protected operations endpoint', () => {
  assert.equal(shouldLoadOperations({ role: 'OWNER' }), true)
  assert.equal(shouldLoadOperations({ role: 'MEMBER' }), false)
  assert.equal(shouldLoadOperations(null), false)
})

test('healthy backup state has text in addition to its color', () => {
  const result = formatBackupState({ status: 'HEALTHY', lastSuccessAt: '2026-07-21T08:10:00Z' })
  assert.equal(result.label, '备份已验证')
  assert.equal(result.tone, 'healthy')
  assert.match(result.detail, /2026-07-21/)
})

test('summary normalizes absent counts and missing backup', () => {
  const result = formatProtectionSummary({ activeSessions: 2 })
  assert.equal(result.recycleBinItems, 0)
  assert.equal(result.activeSessions, 2)
  assert.equal(result.activityLast7Days, 0)
  assert.equal(result.backup.tone, 'warning')
})
