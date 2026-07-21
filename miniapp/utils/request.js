const { createRequestClient } = require('./request-core')
const { clearSession, getStorage, redirectToLogin } = require('./auth')

let config
try {
  config = require('../config')
} catch (error) {
  config = { apiBaseUrl: '' }
}

function transport(options) {
  if (!config.apiBaseUrl) {
    return Promise.reject(new Error('请先复制 config.example.js 并配置 config.js'))
  }
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      timeout: 15000,
      success: resolve,
      fail: () => reject(new Error('网络连接失败，请检查网络后重试')),
    })
  })
}

const client = createRequestClient({
  baseUrl: config.apiBaseUrl,
  transport,
  storage: getStorage(),
  onAuthExpired: () => {
    clearSession()
    redirectToLogin()
  },
})

module.exports = client
