import { expect, test } from '@playwright/test'
import { authenticateApi, loginThroughUi } from './helpers/auth'

test.describe.serial('家庭运营与回收站', () => {
  test('管理员可查看运营记录、恢复并永久删除物品', async ({ page }) => {
    const itemName = `E2E 回收站物品 ${Date.now()}`
    const { api } = await authenticateApi()
    let itemId
    try {
      const createResponse = await api.post('items/batch', { data: {
        validateOnly: false,
        items: [{ name: itemName, quantity: 1, price: 8.8, purchaseDate: '2026-07-21' }],
      } })
      expect(createResponse.ok(), await createResponse.text()).toBeTruthy()
      itemId = (await createResponse.json()).data.createdItems[0].id
      const softDelete = await api.delete(`items/${itemId}`)
      expect(softDelete.ok(), await softDelete.text()).toBeTruthy()

      await loginThroughUi(page)
      await page.goto('/operations')
      await expect(page.getByRole('heading', { name: '家庭运营' })).toBeVisible()
      await page.getByLabel('筛选动作').selectOption('ITEM_DELETED')
      await expect(page.locator('.activity-entry').filter({ hasText: itemName })).toBeVisible()
      const recycled = page.locator('.recycle-item').filter({ hasText: itemName })
      await expect(recycled).toBeVisible()

      await recycled.getByRole('button', { name: '恢复', exact: true }).click()
      await page.getByRole('button', { name: '确认恢复' }).click()
      await expect(recycled).toHaveCount(0)

      const deleteAgain = await api.delete(`items/${itemId}`)
      expect(deleteAgain.ok(), await deleteAgain.text()).toBeTruthy()
      await page.getByRole('button', { name: '刷新状态' }).click()
      const recycledAgain = page.locator('.recycle-item').filter({ hasText: itemName })
      await expect(recycledAgain).toBeVisible()
      await recycledAgain.getByRole('button', { name: '永久删除', exact: true }).click()
      await page.getByRole('button', { name: '确认永久删除' }).click()
      await expect(recycledAgain).toHaveCount(0)
      itemId = null
    } finally {
      if (itemId) {
        await api.delete(`items/${itemId}`)
        await api.delete(`operations/recycle-bin/${itemId}`)
      }
      await api.dispose()
    }
  })

  test('移动端可筛选运营纸带、恢复并永久删除且无横向溢出 @mobile', async ({ page }) => {
    const itemName = `E2E 移动运营物品 ${Date.now()}`
    const { api } = await authenticateApi()
    let itemId
    try {
      const createResponse = await api.post('items', { data: {
        name: itemName, quantity: 1, price: 1, purchaseDate: '2026-07-21',
      } })
      expect(createResponse.ok(), await createResponse.text()).toBeTruthy()
      itemId = (await createResponse.json()).data.id
      const softDelete = await api.delete(`items/${itemId}`)
      expect(softDelete.ok(), await softDelete.text()).toBeTruthy()

      await loginThroughUi(page)
      await page.goto('/operations')
      await expect(page.getByRole('heading', { name: '家庭运营' })).toBeVisible()
      await page.getByLabel('筛选动作').selectOption('ITEM_DELETED')
      await expect(page.locator('.activity-entry').filter({ hasText: itemName })).toBeVisible()
      let recycled = page.locator('.recycle-item').filter({ hasText: itemName })
      await recycled.getByRole('button', { name: '恢复', exact: true }).click()
      await page.getByRole('button', { name: '确认恢复' }).click()
      await expect(recycled).toHaveCount(0)

      const deleteAgain = await api.delete(`items/${itemId}`)
      expect(deleteAgain.ok(), await deleteAgain.text()).toBeTruthy()
      await page.getByRole('button', { name: '刷新状态' }).click()
      recycled = page.locator('.recycle-item').filter({ hasText: itemName })
      await expect(recycled).toBeVisible()
      await recycled.getByRole('button', { name: '永久删除', exact: true }).click()
      await page.getByRole('button', { name: '确认永久删除' }).click()
      await expect(recycled).toHaveCount(0)
      itemId = null

      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(horizontalOverflow).toBeLessThanOrEqual(1)
    } finally {
      if (itemId) {
        await api.delete(`items/${itemId}`)
        await api.delete(`operations/recycle-bin/${itemId}`)
      }
      await api.dispose()
    }
  })
})
