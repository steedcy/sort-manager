import { expect, test } from '@playwright/test'
import { apiBaseUrl, authenticateApi, e2ePassword, loginThroughUi } from './helpers/auth'

const memberUsername = 'e2e_member'
const memberDisplayName = 'E2E 家庭成员'

test.describe.serial('家庭账号与安全访问', () => {
  test('未登录会跳转到登录页，登录后可以安全退出', async ({ page }) => {
    await page.goto('/items')
    await expect(page).toHaveURL(/\/login(?:\?|$)/)

    await loginThroughUi(page)
    await expect(page.getByRole('heading', { name: /收纳总览/ })).toBeVisible()
    const refreshToken = await page.evaluate(() => localStorage.getItem('sort-refresh-token'))
    expect(refreshToken).toBeTruthy()

    const logoutResponsePromise = page.waitForResponse((response) =>
      response.url().endsWith('/api/v1/auth/logout') && response.request().method() === 'POST')
    await page.getByRole('button', { name: /退出登录|退出/ }).click()
    const logoutResponse = await logoutResponsePromise
    expect(logoutResponse.ok()).toBeTruthy()
    await expect(page).toHaveURL(/\/login(?:\?|$)/)
    const replayResponse = await page.request.post(`${apiBaseUrl}auth/refresh`, { data: { refreshToken } })
    expect(replayResponse.status()).toBe(401)
    await page.goto('/items')
    await expect(page).toHaveURL(/\/login(?:\?|$)/)
  })

  test('OWNER 可以创建、查看并停用家庭成员', async ({ page }) => {
    await loginThroughUi(page)
    const { api } = await authenticateApi()
    const membersResponse = await api.get('members')
    expect(membersResponse.ok(), await membersResponse.text()).toBeTruthy()
    const membersBody = await membersResponse.json()
    let member = membersBody.data.find((entry) => entry.username === memberUsername)

    if (member) {
      const memberId = member.id ?? member.userId
      const enableResponse = await api.patch(`members/${memberId}/enabled`, { data: { enabled: true } })
      expect(enableResponse.ok(), await enableResponse.text()).toBeTruthy()
    } else {
      await page.goto('/members')
      await page.getByRole('button', { name: /添加成员|新增成员/ }).click()
      await page.getByLabel('用户名').fill(memberUsername)
      await page.getByLabel(/显示名称|成员名称|昵称/).fill(memberDisplayName)
      await page.getByLabel('初始密码 *', { exact: true }).fill(e2ePassword)
      const role = page.getByLabel(/角色/)
      if (await role.count()) await role.selectOption('MEMBER')
      const createResponsePromise = page.waitForResponse((response) =>
        response.url().endsWith('/api/v1/members') && response.request().method() === 'POST')
      await page.getByRole('button', { name: '添加成员', exact: true }).click()
      const createResponse = await createResponsePromise
      expect(createResponse.ok(), await createResponse.text()).toBeTruthy()

      const refreshed = await api.get('members')
      expect(refreshed.ok(), await refreshed.text()).toBeTruthy()
      member = (await refreshed.json()).data.find((entry) => entry.username === memberUsername)
    }

    expect(member).toBeTruthy()
    await page.goto('/members')
    await expect(page.getByText(memberDisplayName).first()).toBeVisible()

    const memberId = member.id ?? member.userId
    const disableResponse = await api.patch(`members/${memberId}/enabled`, { data: { enabled: false } })
    expect(disableResponse.ok(), await disableResponse.text()).toBeTruthy()
    await page.reload()
    await expect(page.getByText(memberDisplayName).first()).toBeVisible()
    await expect(page.getByText(/已停用/).first()).toBeVisible()
    await api.dispose()
  })

  test('OWNER 可撤销指定成员的全部会话', async ({ page }) => {
    const { api } = await authenticateApi()
    const membersResponse = await api.get('members')
    expect(membersResponse.ok(), await membersResponse.text()).toBeTruthy()
    const member = (await membersResponse.json()).data.find((entry) => entry.username === memberUsername)
    expect(member).toBeTruthy()
    const memberId = member.id ?? member.userId
    const enableResponse = await api.patch(`members/${memberId}/enabled`, { data: { enabled: true } })
    expect(enableResponse.ok(), await enableResponse.text()).toBeTruthy()

    const { session, api: memberApi } = await authenticateApi(memberUsername, e2ePassword)
    await memberApi.dispose()
    await loginThroughUi(page)
    await page.goto('/members')
    page.once('dialog', (dialog) => dialog.accept())
    const memberRow = page.getByRole('row').filter({ hasText: memberDisplayName })
    const revokeResponsePromise = page.waitForResponse((response) => response.url().endsWith(`/api/v1/members/${memberId}/revoke-sessions`))
    await memberRow.getByRole('button', { name: '撤销会话' }).click()
    expect((await revokeResponsePromise).ok()).toBeTruthy()

    const replayResponse = await page.request.post(`${apiBaseUrl}auth/refresh`, { data: { refreshToken: session.refreshToken } })
    expect(replayResponse.status()).toBe(401)
    const disableResponse = await api.patch(`members/${memberId}/enabled`, { data: { enabled: false } })
    expect(disableResponse.ok(), await disableResponse.text()).toBeTruthy()
    await api.dispose()
  })

  test('移动端可以完成登录、访问看板并撤销成员会话 @mobile', async ({ page }) => {
    const { api } = await authenticateApi()
    let membersResponse = await api.get('members')
    expect(membersResponse.ok(), await membersResponse.text()).toBeTruthy()
    let member = (await membersResponse.json()).data.find((entry) => entry.username === memberUsername)
    if (!member) {
      const createResponse = await api.post('members', { data: {
        username: memberUsername,
        displayName: memberDisplayName,
        password: e2ePassword,
        role: 'MEMBER',
      } })
      expect(createResponse.ok(), await createResponse.text()).toBeTruthy()
      member = (await createResponse.json()).data
    }
    const memberId = member.id ?? member.userId
    const enableResponse = await api.patch(`members/${memberId}/enabled`, { data: { enabled: true } })
    expect(enableResponse.ok(), await enableResponse.text()).toBeTruthy()
    const { session, api: memberApi } = await authenticateApi(memberUsername, e2ePassword)
    await memberApi.dispose()

    await loginThroughUi(page)
    await expect(page.getByRole('heading', { name: /收纳总览/ })).toBeVisible()
    await page.goto('/members')
    page.once('dialog', (dialog) => dialog.accept())
    const memberRow = page.locator('.member-card').filter({ hasText: memberDisplayName })
    const revokeResponsePromise = page.waitForResponse((response) => response.url().endsWith(`/api/v1/members/${memberId}/revoke-sessions`))
    await memberRow.getByRole('button', { name: '撤销会话' }).click()
    expect((await revokeResponsePromise).ok()).toBeTruthy()
    const replayResponse = await page.request.post(`${apiBaseUrl}auth/refresh`, { data: { refreshToken: session.refreshToken } })
    expect(replayResponse.status()).toBe(401)
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(horizontalOverflow).toBeLessThanOrEqual(1)
    const disableResponse = await api.patch(`members/${memberId}/enabled`, { data: { enabled: false } })
    expect(disableResponse.ok(), await disableResponse.text()).toBeTruthy()
    await api.dispose()
  })
})
