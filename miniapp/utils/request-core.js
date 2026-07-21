const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

function joinUrl(baseUrl, path) {
  return `${String(baseUrl || '').replace(/\/$/, '')}/${String(path || '').replace(/^\//, '')}`
}

function responseError(response, fallback) {
  const responseData = response && response.data
  const error = new Error((responseData && responseData.message) || fallback)
  error.statusCode = (response && response.statusCode) || 0
  error.response = response
  return error
}

function unwrap(response) {
  const body = response && response.data
  if (body && Object.prototype.hasOwnProperty.call(body, 'data')) return body.data
  return body
}

function createRequestClient({ baseUrl, transport, storage, onAuthExpired = () => {} }) {
  let refreshPromise = null
  let sessionGeneration = 0

  function clearSession() {
    sessionGeneration += 1
    storage.remove(ACCESS_TOKEN_KEY)
    storage.remove(REFRESH_TOKEN_KEY)
    storage.remove('currentUser')
  }

  async function refreshSession() {
    if (refreshPromise) return refreshPromise

    const refreshGeneration = sessionGeneration
    refreshPromise = (async () => {
      const refreshToken = storage.get(REFRESH_TOKEN_KEY)
      if (!refreshToken) throw new Error('登录已过期，请重新登录')
      const response = await transport({
        url: joinUrl(baseUrl, '/auth/refresh'),
        method: 'POST',
        data: { refreshToken },
        header: { 'Content-Type': 'application/json' },
      })
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw responseError(response, '刷新登录状态失败')
      }
      const session = unwrap(response)
      if (!session || !session.accessToken || !session.refreshToken) {
        throw new Error('刷新登录状态返回无效')
      }
      if (refreshGeneration !== sessionGeneration) {
        const error = new Error('Authentication session changed')
        error.code = 'AUTH_SESSION_CHANGED'
        throw error
      }
      storage.set(ACCESS_TOKEN_KEY, session.accessToken)
      storage.set(REFRESH_TOKEN_KEY, session.refreshToken)
      if (session.user) storage.set('currentUser', session.user)
      return session
    })()
      .catch((error) => {
        if (refreshGeneration === sessionGeneration) {
          clearSession()
          onAuthExpired(error)
        }
        throw error
      })
      .finally(() => { refreshPromise = null })

    return refreshPromise
  }

  async function request(options) {
    const {
      path,
      method = 'GET',
      data,
      header = {},
      auth = true,
      hasRetried = false,
      refreshOnUnauthorized = true,
    } = options
    const token = storage.get(ACCESS_TOKEN_KEY)
    const requestHeader = { 'Content-Type': 'application/json', ...header }
    if (auth && token) requestHeader.Authorization = `Bearer ${token}`

    const response = await transport({
      url: joinUrl(baseUrl, path),
      method,
      data,
      header: requestHeader,
    })
    if (response.statusCode === 401 && auth && refreshOnUnauthorized && !hasRetried) {
      const currentToken = storage.get(ACCESS_TOKEN_KEY)
      if (currentToken && currentToken !== token) {
        return request({ ...options, hasRetried: true })
      }
      await refreshSession()
      return request({ ...options, hasRetried: true })
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw responseError(response, '请求失败，请稍后重试')
    }
    return unwrap(response)
  }

  return { request, refreshSession, clearSession }
}

module.exports = {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  createRequestClient,
}
