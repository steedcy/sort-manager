import { expect, test } from '@playwright/test'
import { authenticateApi, loginThroughUi } from './helpers/auth'

test.describe('批量录入工作台', () => {
  test('粘贴表格、预检并原子录入物品', async ({ page }) => {
    const itemName = `E2E 批量雨伞 ${Date.now()}`
    const { api } = await authenticateApi()
    let createdId = null

    try {
      await loginThroughUi(page)
      await page.goto('/items/bulk')
      await page.getByLabel('粘贴 Excel / WPS 表格').fill(
        `物品名称\t数量\t单价\t分类\t位置\t购买日期\t有效期\t备注\n${itemName}\t2\t19.90\t\t\t2026-07-21\t\tE2E`,
      )
      await page.getByRole('button', { name: '放进入库托盘' }).click()

      const validateResponsePromise = page.waitForResponse((response) =>
        response.url().endsWith('/api/v1/items/batch') && response.request().method() === 'POST')
      await page.getByRole('button', { name: '预检全部' }).click()
      const validateResponse = await validateResponsePromise
      expect(validateResponse.ok(), await validateResponse.text()).toBeTruthy()
      expect((await validateResponse.json()).data.createdCount).toBe(0)
      await expect(page.getByText('1 行可录入')).toBeVisible()

      const commitResponsePromise = page.waitForResponse((response) =>
        response.url().endsWith('/api/v1/items/batch') && response.request().method() === 'POST')
      await page.getByRole('button', { name: '确认正式录入' }).click()
      const commitBody = await (await commitResponsePromise).json()
      expect(commitBody.data.createdCount).toBe(1)
      createdId = commitBody.data.createdItems[0].id
      await expect(page.getByText('尚未预检')).toBeVisible()

      const searchResponse = await api.get('items', { params: { keyword: itemName, size: 10 } })
      expect(searchResponse.ok(), await searchResponse.text()).toBeTruthy()
      expect((await searchResponse.json()).data.content.some((item) => item.name === itemName)).toBeTruthy()
    } finally {
      if (createdId) await api.delete(`items/${createdId}`)
      await api.dispose()
    }
  })

  test('移动端入库托盘保持可操作且无页面横向溢出 @mobile', async ({ page }) => {
    await loginThroughUi(page)
    await page.goto('/items/bulk')
    await expect(page.getByRole('heading', { name: '批量录入' })).toBeVisible()
    await expect(page.getByRole('button', { name: '预检全部' })).toBeVisible()
    const horizontalOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(horizontalOverflow).toBeLessThanOrEqual(1)
  })
})
