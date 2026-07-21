const client = require('./request')

const api = {
  login: (credentials) => client.request({ path: '/auth/login', method: 'POST', data: credentials, auth: false }),
  logout: (refreshToken) => client.request({
    path: '/auth/logout',
    method: 'POST',
    data: { refreshToken },
    auth: false,
    refreshOnUnauthorized: false,
  }),
  me: () => client.request({ path: '/auth/me' }),
  dashboard: () => client.request({ path: '/dashboard/stats' }),
  items: (query) => client.request({ path: `/items${query}` }),
  createItem: (item) => client.request({ path: '/items', method: 'POST', data: item }),
  categories: () => client.request({ path: '/categories' }),
  locations: () => client.request({ path: '/locations' }),
}

module.exports = api
