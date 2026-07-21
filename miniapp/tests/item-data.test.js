const test = require('node:test')
const assert = require('node:assert/strict')

const { buildItemQuery, mergePage, validateQuickItem } = require('../utils/item-data')

test('buildItemQuery trims search text and uses zero-based paging', () => {
  assert.equal(
    buildItemQuery({ keyword: '  电池  ', page: 2, size: 20 }),
    '?page=2&size=20&sort=createdAt&direction=desc&keyword=%E7%94%B5%E6%B1%A0',
  )
})

test('mergePage replaces the first page and de-duplicates appended items', () => {
  const first = mergePage([{ id: 9 }], { content: [{ id: 1 }, { id: 2 }], last: false }, true)
  const next = mergePage(first.items, { content: [{ id: 2 }, { id: 3 }], last: true }, false)

  assert.deepEqual(first.items.map((item) => item.id), [1, 2])
  assert.deepEqual(next.items.map((item) => item.id), [1, 2, 3])
  assert.equal(next.hasMore, false)
})

test('validateQuickItem requires a name and a positive integer quantity', () => {
  assert.deepEqual(validateQuickItem({ name: ' ', quantity: 0 }), {
    name: '请输入物品名称',
    quantity: '数量必须是大于 0 的整数',
  })
  assert.deepEqual(validateQuickItem({ name: '电池', quantity: 2 }), {})
})
