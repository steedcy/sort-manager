function buildItemQuery({ keyword = '', page = 0, size = 20 } = {}) {
  const params = [
    ['page', Math.max(0, Number(page) || 0)],
    ['size', Math.max(1, Number(size) || 20)],
    ['sort', 'createdAt'],
    ['direction', 'desc'],
  ]
  const normalizedKeyword = String(keyword).trim()
  if (normalizedKeyword) params.push(['keyword', normalizedKeyword])
  return `?${params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}`
}

function mergePage(currentItems, pageResponse, replace = false) {
  const combined = replace
    ? [...(pageResponse.content || [])]
    : [...(currentItems || []), ...(pageResponse.content || [])]
  const seen = new Set()
  const items = combined.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
  return { items, hasMore: !pageResponse.last }
}

function validateQuickItem(item) {
  const errors = {}
  if (!String(item.name || '').trim()) errors.name = '请输入物品名称'
  const quantity = Number(item.quantity)
  if (!Number.isInteger(quantity) || quantity <= 0) {
    errors.quantity = '数量必须是大于 0 的整数'
  }
  return errors
}

module.exports = { buildItemQuery, mergePage, validateQuickItem }
