const api = require('../../utils/api')
const { hasSession, saveSession } = require('../../utils/auth')

Page({
  data: {
    username: '',
    password: '',
    submitting: false,
    error: '',
  },
  onLoad() {
    if (hasSession()) wx.reLaunch({ url: '/pages/overview/index' })
  },
  onUsernameInput(event) { this.setData({ username: event.detail.value, error: '' }) },
  onPasswordInput(event) { this.setData({ password: event.detail.value, error: '' }) },
  async submit() {
    if (this.data.submitting) return
    const username = this.data.username.trim()
    if (!username || !this.data.password) {
      this.setData({ error: '请输入用户名和密码' })
      return
    }
    this.setData({ submitting: true, error: '' })
    try {
      const session = await api.login({ username, password: this.data.password })
      saveSession(session)
      wx.reLaunch({ url: '/pages/overview/index' })
    } catch (error) {
      this.setData({ error: error.message || '登录失败，请检查账号信息' })
    } finally {
      this.setData({ submitting: false })
    }
  },
})
