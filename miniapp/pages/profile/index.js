const api = require('../../utils/api')
const { REFRESH_TOKEN_KEY, USER_KEY, getStorage, requireSession } = require('../../utils/auth')
const requestClient = require('../../utils/request')

function displayUser(user) {
  if (!user) return null
  return {
    ...user,
    roleLabel: user.role === 'OWNER' ? '家庭管理员' : '家庭成员',
    initials: String(user.displayName || user.username || '家').slice(0, 1),
  }
}

Page({
  data: {
    user: null,
    loading: true,
    error: '',
    loggingOut: false,
  },
  onLoad() {
    this.setData({ user: displayUser(getStorage().get(USER_KEY)) })
  },
  onShow() {
    if (requireSession()) this.loadProfile()
  },
  onPullDownRefresh() {
    this.loadProfile().finally(() => wx.stopPullDownRefresh())
  },
  async loadProfile() {
    this.setData({ loading: !this.data.user, error: '' })
    try {
      const user = await api.me()
      getStorage().set(USER_KEY, user)
      this.setData({ user: displayUser(user) })
    } catch (error) {
      this.setData({ error: error.message || '账号信息更新失败' })
    } finally {
      this.setData({ loading: false })
    }
  },
  confirmLogout() {
    wx.showModal({
      title: '退出当前账号？',
      content: '退出后，本机保存的登录状态将被清除。',
      confirmText: '退出登录',
      confirmColor: '#B91C1C',
      success: (result) => { if (result.confirm) this.logout() },
    })
  },
  async logout() {
    if (this.data.loggingOut) return
    const refreshToken = getStorage().get(REFRESH_TOKEN_KEY)
    this.setData({ loggingOut: true })
    requestClient.clearSession()
    try {
      if (refreshToken) await api.logout(refreshToken)
    } catch (error) {
      // Local sign-out remains available when the server cannot be reached.
    } finally {
      wx.reLaunch({ url: '/pages/login/index' })
    }
  },
})
