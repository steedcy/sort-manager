import { expect, test } from '@playwright/test'

test('登录页仅展示账号登录控件 @mobile', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: '家庭物品管理系统' })).toBeVisible()
  await expect(page.getByLabel('用户名')).toBeVisible()
  await expect(page.getByLabel('密码', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible()
  await expect(page.getByText('v2.0.0', { exact: true })).toBeVisible()

  await expect(page.getByText('家庭物品簿', { exact: true })).toHaveCount(0)
  await expect(page.getByText('每件物品，都有它的位置', { exact: true })).toHaveCount(0)
  await expect(page.getByText('登录家庭空间', { exact: true })).toHaveCount(0)
})
