const api = require('../../utils/api')
const { requireSession } = require('../../utils/auth')

function formatMoney(value) {
  const number = Number(value || 0)
  const parts = number.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

Page({
  data: {
    loading: true,
    error: '',
    stats: null,
  },
  onShow() {
    if (requireSession()) this.loadStats()
  },
  onPullDownRefresh() {
    this.loadStats().finally(() => wx.stopPullDownRefresh())
  },
  async loadStats() {
    if (this.data.stats) this.setData({ error: '' })
    else this.setData({ loading: true, error: '' })
    try {
      const stats = await api.dashboard()
      stats.totalAssetDisplay = formatMoney(stats.totalAssetValue)
      stats.expiringCount = (stats.expiringItems || []).length
      this.setData({ stats })
    } catch (error) {
      this.setData({ error: error.message || '总览加载失败' })
    } finally {
      this.setData({ loading: false })
    }
  },
  goToItems() { wx.switchTab({ url: '/pages/items/index' }) },
  goToAdd() { wx.switchTab({ url: '/pages/add/index' }) },
})
