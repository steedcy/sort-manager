const api = require('../../utils/api')
const { REFRESH_TOKEN_KEY, USER_KEY, getStorage, requireSession } = require('../../utils/auth')
const requestClient = require('../../utils/request')
const { formatProtectionSummary, shouldLoadOperations } = require('../../utils/operations')

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
    protection: null,
    protectionLoading: false,
    protectionError: '',
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
      this.setData({ user: displayUser(user), loading: false })
      if (shouldLoadOperations(user)) await this.loadProtectionSummary()
      else this.setData({ protection: null, protectionError: '' })
    } catch (error) {
      this.setData({ error: error.message || '账号信息更新失败' })
    } finally {
      this.setData({ loading: false })
    }
  },
  async loadProtectionSummary() {
    this.setData({ protectionLoading: true, protectionError: '' })
    try {
      const summary = await api.operationsSummary()
      this.setData({ protection: formatProtectionSummary(summary) })
    } catch (error) {
      this.setData({ protection: null, protectionError: error.message || '家庭保护状态暂时不可用' })
    } finally {
      this.setData({ protectionLoading: false })
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
