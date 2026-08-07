const api = require('../../utils/api')
const { buildItemQuery, mergePage } = require('../../utils/item-data')
const { requireSession } = require('../../utils/auth')

Page({
  data: {
    keyword: '',
    items: [],
    page: 0,
    hasMore: true,
    loading: true,
    loadingMore: false,
    error: '',
  },
  onLoad() {
    this.requestId = 0
  },
  onShow() {
    if (requireSession() && !this.data.items.length && !this.data.error) this.loadFirstPage()
  },
  onUnload() { clearTimeout(this.searchTimer) },
  onPullDownRefresh() {
    this.loadFirstPage().finally(() => wx.stopPullDownRefresh())
  },
  onReachBottom() { this.loadMore() },
  onKeywordInput(event) {
    this.setData({ keyword: event.detail.value })
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => this.loadFirstPage(), 300)
  },
  clearSearch() {
    clearTimeout(this.searchTimer)
    this.setData({ keyword: '' })
    this.loadFirstPage()
  },
  async fetchPage(page, replace) {
    const requestId = ++this.requestId
    const query = buildItemQuery({ keyword: this.data.keyword, page, size: 20 })
    try {
      const response = await api.items(query)
      if (requestId !== this.requestId) return false
      const merged = mergePage(this.data.items, response, replace)
      this.setData({
        items: merged.items,
        hasMore: merged.hasMore,
        page,
        error: '',
      })
      return true
    } catch (error) {
      if (requestId !== this.requestId) return false
      throw error
    }
  },
  async loadFirstPage() {
    const expectedRequestId = this.requestId + 1
    this.setData({ loading: true, error: '' })
    try {
      await this.fetchPage(0, true)
    } catch (error) {
      if (expectedRequestId === this.requestId) {
        this.setData({ error: error.message || '物品加载失败' })
      }
    } finally {
      if (expectedRequestId === this.requestId) this.setData({ loading: false })
    }
  },
  async loadMore() {
    if (!this.data.hasMore || this.data.loading || this.data.loadingMore) return
    this.setData({ loadingMore: true })
    try {
      await this.fetchPage(this.data.page + 1, false)
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' })
    } finally {
      this.setData({ loadingMore: false })
    }
  },
  goToAdd() { wx.switchTab({ url: '/pages/add/index' }) },
  scanIsbnBook() {
    wx.scanCode({
      scanType: ['barCode'],
      success: async (res) => {
        const isbn = res.result
        if (!isbn) return
        wx.showLoading({ title: '检索图书中...' })
        try {
          const bookRes = await api.request(`/items/isbn/${isbn}`)
          wx.hideLoading()
          if (bookRes && bookRes.data) {
            const book = bookRes.data
            wx.showModal({
              title: `识别图书：《${book.name}》`,
              content: `${book.description || ''}\n价格：￥${book.price || 0}`,
              confirmText: '去录入',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.navigateTo({
                    url: `/pages/entry/index?name=${encodeURIComponent(book.name)}&description=${encodeURIComponent(book.description || '')}&price=${book.price || 0}&imageUrl=${encodeURIComponent(book.imageUrl || '')}`
                  })
                }
              }
            })
          }
        } catch (err) {
          wx.hideLoading()
          wx.showToast({ title: '未查询到图书信息', icon: 'none' })
        }
      }
    })
  },
})
