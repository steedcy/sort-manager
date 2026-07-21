const test = require('node:test')
const assert = require('node:assert/strict')

const { createRequestClient } = require('../utils/request-core')

function createStorage(initial = {}) {
  const values = { ...initial }
  return {
    get: (key) => values[key],
    set: (key, value) => { values[key] = value },
    remove: (key) => { delete values[key] },
    snapshot: () => ({ ...values }),
  }
}

test('adds bearer token and unwraps the API envelope', async () => {
  const storage = createStorage({ accessToken: 'access-1' })
  const calls = []
  const client = createRequestClient({
    baseUrl: 'https://inventory.example.com/api/v1',
    storage,
    transport: async (options) => {
      calls.push(options)
      return { statusCode: 200, data: { success: true, data: { totalItems: 3 } } }
    },
  })

  const result = await client.request({ path: '/dashboard/stats' })

  assert.deepEqual(result, { totalItems: 3 })
  assert.equal(calls[0].url, 'https://inventory.example.com/api/v1/dashboard/stats')
  assert.equal(calls[0].header.Authorization, 'Bearer access-1')
})

test('serializes concurrent 401 refreshes and stores rotated tokens before replay', async () => {
  const storage = createStorage({ accessToken: 'expired', refreshToken: 'refresh-1' })
  let refreshCount = 0
  const protectedAttempts = new Map()
  const transport = async (options) => {
    if (options.url.endsWith('/auth/refresh')) {
      refreshCount += 1
      await new Promise((resolve) => setTimeout(resolve, 5))
      return {
        statusCode: 200,
        data: { data: { accessToken: 'access-2', refreshToken: 'refresh-2' } },
      }
    }
    const attempts = (protectedAttempts.get(options.url) || 0) + 1
    protectedAttempts.set(options.url, attempts)
    if (options.header.Authorization === 'Bearer expired') {
      return { statusCode: 401, data: { message: 'expired' } }
    }
    return { statusCode: 200, data: { data: options.url } }
  }
  const client = createRequestClient({
    baseUrl: 'https://inventory.example.com/api/v1',
    storage,
    transport,
  })

  const results = await Promise.all([
    client.request({ path: '/items?page=0' }),
    client.request({ path: '/dashboard/stats' }),
  ])

  assert.equal(refreshCount, 1)
  assert.equal(results.length, 2)
  assert.equal(storage.get('accessToken'), 'access-2')
  assert.equal(storage.get('refreshToken'), 'refresh-2')
  assert.equal(protectedAttempts.get('https://inventory.example.com/api/v1/items?page=0'), 2)
})

test('replays a late stale 401 with the already-rotated access token', async () => {
  const storage = createStorage({ accessToken: 'expired', refreshToken: 'refresh-1' })
  let refreshCount = 0
  let slowAttempt = 0
  const client = createRequestClient({
    baseUrl: 'https://inventory.example.com/api/v1',
    storage,
    transport: async (options) => {
      if (options.url.endsWith('/auth/refresh')) {
        refreshCount += 1
        return { statusCode: 200, data: { data: { accessToken: 'access-2', refreshToken: 'refresh-2' } } }
      }
      if (options.url.endsWith('/items/slow')) {
        slowAttempt += 1
        if (slowAttempt === 1) await new Promise((resolve) => setTimeout(resolve, 20))
      }
      if (options.header.Authorization === 'Bearer expired') return { statusCode: 401, data: {} }
      return { statusCode: 200, data: { data: 'ok' } }
    },
  })

  await Promise.all([
    client.request({ path: '/items/fast' }),
    client.request({ path: '/items/slow' }),
  ])

  assert.equal(refreshCount, 1)
  assert.equal(slowAttempt, 2)
})

test('clears the session and notifies once when refresh fails', async () => {
  const storage = createStorage({ accessToken: 'expired', refreshToken: 'invalid' })
  let expiredCount = 0
  const client = createRequestClient({
    baseUrl: 'https://inventory.example.com/api/v1',
    storage,
    onAuthExpired: () => { expiredCount += 1 },
    transport: async (options) => {
      if (options.url.endsWith('/auth/refresh')) {
        return { statusCode: 401, data: { message: 'refresh rejected' } }
      }
      return { statusCode: 401, data: { message: 'expired' } }
    },
  })

  await assert.rejects(() => client.request({ path: '/items' }), /refresh rejected/)

  assert.deepEqual(storage.snapshot(), {})
  assert.equal(expiredCount, 1)
})

test('does not refresh or replay an authentication request', async () => {
  const storage = createStorage({ refreshToken: 'refresh-1' })
  let callCount = 0
  const client = createRequestClient({
    baseUrl: 'https://inventory.example.com/api/v1',
    storage,
    transport: async () => {
      callCount += 1
      return { statusCode: 401, data: { message: 'wrong password' } }
    },
  })

  await assert.rejects(() => client.request({ path: '/auth/login', method: 'POST', auth: false }), /wrong password/)
  assert.equal(callCount, 1)
})

test('can keep bearer auth while opting out of refresh replay', async () => {
  const storage = createStorage({ accessToken: 'expired', refreshToken: 'refresh-1' })
  const calls = []
  const client = createRequestClient({
    baseUrl: 'https://inventory.example.com/api/v1',
    storage,
    transport: async (options) => {
      calls.push(options)
      return { statusCode: 401, data: { message: 'expired' } }
    },
  })

  await assert.rejects(
    () => client.request({ path: '/auth/logout', method: 'POST', refreshOnUnauthorized: false }),
    /expired/,
  )
  assert.equal(calls.length, 1)
  assert.equal(calls[0].header.Authorization, 'Bearer expired')
})

test('does not restore tokens when logout invalidates an in-flight refresh', async () => {
  const storage = createStorage({ accessToken: 'expired', refreshToken: 'refresh-1', currentUser: { id: 1 } })
  let releaseRefresh
  const refreshGate = new Promise((resolve) => { releaseRefresh = resolve })
  const client = createRequestClient({
    baseUrl: 'https://inventory.example.com/api/v1',
    storage,
    transport: async (options) => {
      if (options.url.endsWith('/auth/refresh')) {
        await refreshGate
        return { statusCode: 200, data: { data: { accessToken: 'new-a', refreshToken: 'new-r' } } }
      }
      return { statusCode: 401, data: {} }
    },
  })

  const pending = client.request({ path: '/items' })
  await new Promise((resolve) => setTimeout(resolve, 0))
  client.clearSession()
  releaseRefresh()

  await assert.rejects(() => pending, /session changed/i)
  assert.deepEqual(storage.snapshot(), {})
})
