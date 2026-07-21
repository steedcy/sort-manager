import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { authApi } from '../api'
import { configureAuthInterceptors } from '../api/axios'
import { authStorage } from '../auth/storage'
import { AuthContext } from './AuthContext'

const REFRESH_LOCK = 'sort-manager-refresh-token'
const REFRESH_STORAGE_KEY = 'sort-refresh-token'

const unwrapApiData = (response) => response?.data ?? response

function sessionChangedError() {
  const error = new Error('登录会话已变更')
  error.code = 'AUTH_SESSION_CHANGED'
  return error
}

async function withRefreshLock(callback) {
  if (navigator.locks?.request) return navigator.locks.request(REFRESH_LOCK, callback)
  return callback()
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(() => Boolean(authStorage.getRefreshToken()))
  const generationRef = useRef(0)

  const commitSession = useCallback(async (session, generation) => {
    if (generation !== generationRef.current) throw sessionChangedError()
    authStorage.setTokens(session)
    let nextUser = session.user
    if (!nextUser) {
      const meResponse = await authApi.me()
      if (generation !== generationRef.current) throw sessionChangedError()
      nextUser = unwrapApiData(meResponse)
    }
    if (generation !== generationRef.current) throw sessionChangedError()
    setUser(nextUser)
    return session
  }, [])

  const expire = useCallback(() => {
    generationRef.current += 1
    authStorage.clear()
    setUser(null)
    setInitializing(false)
  }, [])

  const refresh = useCallback(async () => {
    const generation = generationRef.current
    return withRefreshLock(async () => {
      if (generation !== generationRef.current) throw sessionChangedError()
      const refreshToken = authStorage.getRefreshToken()
      if (!refreshToken) throw sessionChangedError()
      const session = await authApi.refresh(refreshToken)
      return commitSession(session, generation)
    })
  }, [commitSession])

  useEffect(() => configureAuthInterceptors({ refresh, expire }), [expire, refresh])

  useEffect(() => {
    let active = true
    if (!authStorage.getRefreshToken()) {
      return () => { active = false }
    }

    refresh()
      .catch((error) => {
        if (active && error.code !== 'AUTH_SESSION_CHANGED') expire()
      })
      .finally(() => {
        if (active) setInitializing(false)
      })

    return () => { active = false }
  }, [expire, refresh])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === REFRESH_STORAGE_KEY && !event.newValue) expire()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [expire])

  const login = useCallback(async (credentials) => {
    return withRefreshLock(async () => {
      const generation = generationRef.current + 1
      generationRef.current = generation
      const session = await authApi.login(credentials)
      await commitSession(session, generation)
      return session
    })
  }, [commitSession])

  const logout = useCallback(async () => {
    const refreshToken = authStorage.getRefreshToken()
    const accessToken = authStorage.getAccessToken()
    if (user) sessionStorage.removeItem(`sort-manager:bulk-items-draft:v1:${user.id}:${user.householdId}`)
    expire()
    if (refreshToken && accessToken) {
      try {
        await authApi.logout(refreshToken, accessToken)
      } catch {
        // The local session is already cleared if the server is unavailable.
      }
    }
  }, [expire, user])

  const value = useMemo(() => ({
    user,
    initializing,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refresh,
  }), [initializing, login, logout, refresh, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
