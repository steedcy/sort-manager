import axios from 'axios'
import toast from 'react-hot-toast'
import { authStorage } from '../auth/storage'

export const API_BASE_URL = import.meta.env.VITE_API_BASE || '/api/v1'

const commonConfig = {
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
}

const api = axios.create(commonConfig)
export const rawApi = axios.create(commonConfig)

let refreshSession = null
let expireSession = null
let refreshPromise = null

export function configureAuthInterceptors({ refresh, expire }) {
  refreshSession = refresh
  expireSession = expire

  return () => {
    if (refreshSession === refresh) refreshSession = null
    if (expireSession === expire) expireSession = null
  }
}

api.interceptors.request.use((config) => {
  const accessToken = authStorage.getAccessToken()
  if (accessToken && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config || {}
    const canRefresh = error.response?.status === 401
      && !originalRequest.skipAuth
      && !originalRequest._authRetry
      && Boolean(authStorage.getRefreshToken())
      && Boolean(refreshSession)

    if (canRefresh) {
      originalRequest._authRetry = true
      try {
        if (!refreshPromise) {
          refreshPromise = Promise.resolve(refreshSession())
            .finally(() => { refreshPromise = null })
        }
        await refreshPromise
        const token = authStorage.getAccessToken()
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api.request(originalRequest)
      } catch (refreshError) {
        if (refreshError.code !== 'AUTH_SESSION_CHANGED') expireSession?.()
        return Promise.reject(refreshError)
      }
    }

    if (error.response?.status === 401 && !originalRequest.skipAuth) {
      expireSession?.()
    }

    if (!originalRequest.silent) {
      const message = error.response?.data?.message || error.message || '请求失败，请稍后重试'
      toast.error(message)
    }
    return Promise.reject(error)
  },
)

export default api
