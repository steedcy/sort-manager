import { expect, request } from '@playwright/test'
import process from 'node:process'

export const apiBaseUrl = `${(process.env.E2E_API_URL || 'http://127.0.0.1:8080/api/v1').replace(/\/$/, '')}/`
export const e2eUsername = process.env.E2E_USERNAME || 'owner'
export const e2ePassword = process.env.E2E_PASSWORD || 'change-me'

export async function authenticateApi(username = e2eUsername, password = e2ePassword) {
  const anonymous = await request.newContext({ baseURL: apiBaseUrl })
  const response = await anonymous.post('auth/login', { data: { username, password } })
  expect(response.ok(), await response.text()).toBeTruthy()
  const body = await response.json()
  expect(body.success).toBeTruthy()
  expect(body.data?.accessToken).toBeTruthy()
  await anonymous.dispose()

  const api = await request.newContext({
    baseURL: apiBaseUrl,
    extraHTTPHeaders: { Authorization: `Bearer ${body.data.accessToken}` },
  })
  return { api, session: body.data }
}

export async function loginThroughUi(page) {
  await page.goto('/login')
  await page.getByLabel('用户名').fill(e2eUsername)
  await page.getByLabel('密码', { exact: true }).fill(e2ePassword)
  await page.getByRole('button', { name: /登录/ }).click()
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/)
}
