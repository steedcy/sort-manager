import test from 'node:test'
import assert from 'node:assert/strict'
import { BULK_HEADERS, buildBulkTemplate, parseBulkText } from './bulkParser.js'

test('parses an Excel or WPS tab-separated table with a recognized header', () => {
  const rows = parseBulkText('物品名称\t数量\t单价\t分类\t位置\t购买日期\t有效期\t备注\r\n电池\t4\t12.50\t日用品\t储物间\t2026-07-21\t\t备用')

  assert.deepEqual(rows, [{
    name: '电池', quantity: '4', price: '12.50', categoryName: '日用品',
    locationName: '储物间', purchaseDate: '2026-07-21', expiryDate: '', description: '备用',
  }])
})

test('parses quoted CSV values, escaped quotes, BOM and embedded commas', () => {
  const rows = parseBulkText('\ufeff物品名称,数量,单价,分类,位置,购买日期,有效期,备注\n"收纳盒,大号",2,19.9,收纳,"衣柜,上层",2026-07-21,,"写着""冬季"""')

  assert.equal(rows[0].name, '收纳盒,大号')
  assert.equal(rows[0].locationName, '衣柜,上层')
  assert.equal(rows[0].description, '写着"冬季"')
})

test('ignores blank rows and treats headerless content as data in template order', () => {
  const rows = parseBulkText('\n雨伞\t1\t0\t出行\t玄关\t2026-07-21\t\t\n\t\t\t\t\t\t\t\n手电筒\t2')

  assert.equal(rows.length, 2)
  assert.equal(rows[0].name, '雨伞')
  assert.equal(rows[1].name, '手电筒')
  assert.equal(rows[1].quantity, '2')
})

test('does not discard a headerless first item named like a single header alias', () => {
  const rows = parseBulkText('name\t1\t0\nTorch\t2\t9.9')

  assert.equal(rows.length, 2)
  assert.equal(rows[0].name, 'name')
})

test('does not discard a data row containing two header-like values', () => {
  const rows = parseBulkText('name,1,0,category\nTorch,2,9.9,Tools')

  assert.equal(rows.length, 2)
  assert.equal(rows[0].name, 'name')
  assert.equal(rows[0].categoryName, 'category')
})

test('rejects duplicate headers and unclosed quoted values', () => {
  assert.throws(() => parseBulkText('name,name\nTorch,Duplicate'), /duplicate/i)
  assert.throws(() => parseBulkText('name,quantity\n"Torch,1'), /unclosed/i)
})

test('maps common English headers and reports missing name header', () => {
  assert.equal(parseBulkText('name,quantity,price,category,location,purchaseDate,expiryDate,description\nTorch,1,9.9,Tools,Garage,2026-07-21,,').length, 1)
  assert.throws(() => parseBulkText('数量,单价\n1,9.9'), /物品名称/)
})

test('rejects more than one hundred data rows', () => {
  const text = `${BULK_HEADERS.join(',')}\n${Array.from({ length: 101 }, (_, index) => `物品${index + 1},1,0,,,,,`).join('\n')}`
  assert.throws(() => parseBulkText(text), /100/)
})

test('builds an Excel-friendly UTF-8 CSV template', () => {
  const template = buildBulkTemplate()

  assert.ok(template.startsWith('\ufeff'))
  assert.ok(template.includes(BULK_HEADERS.join(',')))
  assert.ok(template.includes('示例：雨伞'))
})
