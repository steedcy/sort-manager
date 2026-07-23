const { hasSession, redirectToLogin } = require('./utils/auth')

App({
  globalData: { version: '1.6.0' },
  onLaunch() {
    if (!hasSession()) redirectToLogin()
  },
})
