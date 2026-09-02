import { expect, test } from '@playwright/test'
import { loginThroughUi } from './helpers/auth'

test('HTTP 局域网访问时明确提示摄像头需要 HTTPS', async ({ page }) => {
  await loginThroughUi(page)
  await page.getByRole('link', { name: '物品管理' }).click()
  await page.getByRole('button', { name: '扫码/识别图书' }).click()
  await page.getByRole('button', { name: '打开摄像头扫描' }).click()

  await expect(page.getByText('局域网扫码需要使用 HTTPS 安全地址访问。')).toBeVisible()
})
