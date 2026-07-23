import test from 'node:test'
import assert from 'node:assert/strict'
import { actionLabel, actionTone, backupPresentation, formatOperationTime } from './operations.js'

test('审计动作转换为家庭用语', () => {
  assert.equal(actionLabel('ITEM_DELETED'), '移入回收站')
  assert.equal(actionLabel('MEMBER_SESSIONS_REVOKED'), '撤销会话')
  assert.equal(actionLabel('CUSTOM_ACTION'), 'CUSTOM_ACTION')
})

test('危险和恢复操作不只依赖颜色', () => {
  assert.equal(actionTone('ITEM_PERMANENTLY_DELETED'), 'danger')
  assert.equal(actionTone('ITEM_RESTORED'), 'success')
  assert.equal(actionTone('ITEM_UPDATED'), 'primary')
})

test('备份缺失不会误报为正常', () => {
  assert.equal(backupPresentation(null).tone, 'muted')
  assert.equal(backupPresentation({ status: 'INVALID' }).tone, 'danger')
  assert.equal(backupPresentation({ status: 'UNVERIFIED' }).tone, 'warning')
  const healthy = backupPresentation({ status: 'HEALTHY', lastSuccessAt: '2026-07-21T08:00:00Z', backupSizeBytes: 1048576 })
  assert.equal(healthy.tone, 'success')
  assert.match(healthy.detail, /1\.0 MB/)
})

test('无效时间使用明确降级文案', () => {
  assert.equal(formatOperationTime('not-a-date'), '时间未记录')
})
