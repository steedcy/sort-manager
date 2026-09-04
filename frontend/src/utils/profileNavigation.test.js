import assert from 'node:assert/strict'
import test from 'node:test'
import { getProfileMenuItems } from './profileNavigation.js'

test('owners see family members, family operations, and logout in their profile menu', () => {
  assert.deepEqual(
    getProfileMenuItems({ role: 'OWNER' }).map(({ key, path }) => ({ key, path })),
    [
      { key: 'members', path: '/members' },
      { key: 'operations', path: '/operations' },
      { key: 'logout', path: null },
    ],
  )
})

test('household members only see logout in their profile menu', () => {
  assert.deepEqual(
    getProfileMenuItems({ role: 'MEMBER' }).map(({ key, path }) => ({ key, path })),
    [{ key: 'logout', path: null }],
  )
})
