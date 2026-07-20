import { expect, request, test } from '@playwright/test'
import process from 'node:process'

const apiBaseUrl = `${(process.env.E2E_API_URL || 'http://127.0.0.1:8080/api').replace(/\/$/, '')}/`
const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
const categoryName = `E2E分类-${runId}`
const locationName = `E2E位置-${runId}`
const seedItemName = `E2E仪表盘-${runId}`
const uiItemName = `E2E界面物品-${runId}`
const pagePrefix = `E2E分页-${runId}`

let api
let categoryId
let locationId
const createdItemIds = new Set()

async function create(path, data) {
  const response = await api.post(path.replace(/^\//, ''), { data })
  expect(response.ok(), await response.text()).toBeTruthy()
  const body = await response.json()
  expect(body.success).toBeTruthy()
  return body.data
}

test.describe.serial('物品管理真实全栈流程', () => {
  test.beforeAll(async () => {
    api = await request.newContext({ baseURL: apiBaseUrl })
    categoryId = (await create('/categories', { name: categoryName, icon: 'Package', color: '#6366f1' })).id
    locationId = (await create('/locations', { name: locationName, description: 'Playwright fixture' })).id
    const item = await create('/items', {
      name: seedItemName,
      description: 'dashboard fixture',
      quantity: 1,
      price: 9.9,
      purchaseDate: new Date().toISOString().slice(0, 10),
      categoryId,
      locationId,
    })
    createdItemIds.add(item.id)
  })

  test.afterAll(async () => {
    if (!api) return
    const search = await api.get('items', { params: { keyword: runId, page: 0, size: 100 } })
    if (search.ok()) {
      const body = await search.json()
      for (const item of body.data?.content || []) createdItemIds.add(item.id)
    }
    for (const id of createdItemIds) await api.delete(`items/${id}`)
    if (categoryId) await api.delete(`categories/${categoryId}`)
    if (locationId) await api.delete(`locations/${locationId}`)
    await api.dispose()
  })

  test('仪表盘加载真实统计和最近物品', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /收纳总览/ })).toBeVisible()
    await expect(page.getByText(seedItemName)).toBeVisible()
    await page.getByText('物品总数').click()
    await expect(page).toHaveURL(/\/items$/)
  })

  test('通过界面新增、搜索并删除物品', async ({ page }) => {
    await page.goto('/items')
    await page.getByRole('button', { name: '添加物品' }).first().click()
    await page.getByLabel('物品名称 *').fill(uiItemName)
    await page.getByLabel('数量 *').fill('2')
    await page.getByLabel('单价 (元) *').fill('12.50')
    await page.getByLabel('存放位置 *').selectOption(String(locationId))
    await page.getByRole('button', { name: '保存' }).click()

    await page.getByLabel('搜索物品名称或描述').fill(uiItemName)
    const card = page.getByTestId('item-card').filter({ hasText: uiItemName })
    await expect(card).toBeVisible()
    page.once('dialog', dialog => dialog.accept())
    await card.getByRole('button', { name: `删除 ${uiItemName}` }).click()
    await expect(card).toHaveCount(0)
  })

  test('状态筛选和分页保持服务端结果一致', async ({ page }) => {
    for (let index = 1; index <= 13; index += 1) {
      const item = await create('/items', {
        name: `${pagePrefix}-${String(index).padStart(2, '0')}`,
        quantity: 1,
        price: index,
        purchaseDate: new Date().toISOString().slice(0, 10),
        categoryId,
        locationId,
      })
      createdItemIds.add(item.id)
    }

    await page.goto('/items')
    await page.getByLabel('搜索物品名称或描述').fill(pagePrefix)
    await page.getByLabel('按状态筛选').selectOption('normal')
    await expect(page.getByTestId('item-card')).toHaveCount(12)
    await expect(page.getByRole('button', { name: /下一页/ })).toBeEnabled()
    await page.getByRole('button', { name: /下一页/ }).click()
    await expect(page.getByText(/第 2 \/ 2 页/)).toBeVisible()
    await expect(page.getByTestId('item-card')).toHaveCount(1)
  })
})
