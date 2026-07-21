const ACCESS_TOKEN_KEY = 'sort-access-token'
const REFRESH_TOKEN_KEY = 'sort-refresh-token'

export const authStorage = {
  getAccessToken() {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setTokens({ accessToken, refreshToken }) {
    if (accessToken) sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },

  clear() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}
