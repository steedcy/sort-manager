const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'currentUser'

function getStorage() {
  return {
    get: (key) => wx.getStorageSync(key),
    set: (key, value) => wx.setStorageSync(key, value),
    remove: (key) => wx.removeStorageSync(key),
  }
}

function saveSession(session) {
  const storage = getStorage()
  storage.set(ACCESS_TOKEN_KEY, session.accessToken)
  storage.set(REFRESH_TOKEN_KEY, session.refreshToken)
  if (session.user) storage.set(USER_KEY, session.user)
}

function clearSession() {
  const storage = getStorage()
  storage.remove(ACCESS_TOKEN_KEY)
  storage.remove(REFRESH_TOKEN_KEY)
  storage.remove(USER_KEY)
}

function hasSession() {
  return Boolean(getStorage().get(REFRESH_TOKEN_KEY))
}

function redirectToLogin() {
  const pages = getCurrentPages()
  const currentRoute = pages.length ? pages[pages.length - 1].route : ''
  if (currentRoute !== 'pages/login/index') {
    wx.reLaunch({ url: '/pages/login/index' })
  }
}

function requireSession() {
  if (hasSession()) return true
  redirectToLogin()
  return false
}

module.exports = {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  clearSession,
  getStorage,
  hasSession,
  redirectToLogin,
  requireSession,
  saveSession,
  wxOneClickLogin,
}
