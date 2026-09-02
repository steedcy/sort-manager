import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeBookMetadata } from './bookMetadata.js'

test('book lookup never replaces an existing manually entered value with an empty value', () => {
  const result = mergeBookMetadata({ name: '手填书名', description: '手填简介', imageUrl: 'https://manual.test/cover.jpg' }, { isbn13: '9787111128069', title: '', description: '', coverUrl: '' })
  assert.equal(result.name, '手填书名')
  assert.equal(result.description, '手填简介')
  assert.equal(result.imageUrl, 'https://manual.test/cover.jpg')
  assert.equal(result.bookMetadata.isbn13, '9787111128069')
})
